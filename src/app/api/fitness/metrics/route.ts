import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleFitTokens } from '@/lib/google-fit/token-store';
import {
  getFitnessClient,
  getAggregated24hMetrics,
  insertBiometricMetrics,
  BiometricMetricInput,
} from '@/lib/google-fit/fitness-service';

/**
 * GET /api/fitness/metrics
 * 
 * Fetches last 24h aggregated telemetry and current biometric readings from Google Fit:
 * - Aggregated step delta (com.google.step_count.delta) over the last 24 hours
 * - Latest body weight (com.google.weight in kg)
 * - Latest height (com.google.height in meters)
 * - Latest blood pressure (com.google.blood_pressure with systolic, diastolic in mmHg, position, location)
 * - Derived Body Mass Index (BMI)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';

  // 1. Retrieve authenticated tokens from HTTP-only cookie
  const tokens = await getValidGoogleFitTokens();

  // 2. Fallback to sandbox / preview metrics if user requested demo or is unauthenticated in preview
  if (!tokens || !tokens.access_token) {
    if (isDemo) {
      const now = Date.now();
      return NextResponse.json({
        connected: false,
        isDemo: true,
        user: {
          name: 'Demo Athlete',
          email: 'athlete.demo@example.com',
        },
        timeRange: {
          startMillis: now - 86400000,
          endMillis: now,
          startDate: new Date(now - 86400000).toISOString(),
          endDate: new Date(now).toISOString(),
        },
        metrics: {
          steps: 8742,
          weightKg: 78.4,
          heightMeters: 1.82,
          bloodPressure: {
            systolic: 118,
            diastolic: 76,
            meanArterialPressure: 90,
            status: 'Normal',
            bodyPosition: 'Sitting',
            location: 'Left Upper Arm',
            timestamp: new Date(now - 14400000).toISOString(),
          },
          bmi: 23.7,
          lastUpdated: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      {
        connected: false,
        error: 'Unauthorized',
        message: 'No active Google Fit session found. Please log in via /api/auth/login.',
      },
      { status: 401 }
    );
  }

  // 3. Query Google Fit API using googleapis client
  try {
    const fitness = getFitnessClient(tokens.access_token);
    const metrics = await getAggregated24hMetrics(fitness);

    return NextResponse.json({
      connected: true,
      isDemo: false,
      user: {
        email: tokens.userEmail,
        name: tokens.userName,
        image: tokens.userImage,
      },
      timeRange: metrics.timeRange,
      metrics: {
        steps: metrics.steps,
        weightKg: metrics.weightKg,
        heightMeters: metrics.heightMeters,
        bloodPressure: metrics.bloodPressure,
        bmi: metrics.bmi,
        lastUpdated: metrics.lastUpdated,
      },
    });
  } catch (err: any) {
    console.error('Error fetching Google Fit metrics:', err);

    // Detect if Google Cloud Fitness API is not enabled for the GCP project
    const errString = String(err?.message || err);
    const isApiDisabled =
      errString.includes('Fitness API has not been used') ||
      errString.includes('SERVICE_DISABLED') ||
      errString.includes('accessNotConfigured');

    return NextResponse.json(
      {
        connected: true,
        error: 'Fitness API Request Failed',
        message: err?.message || 'Failed to fetch metrics from Google Fit',
        isApiDisabled,
        activationUrl: isApiDisabled
          ? 'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview'
          : undefined,
      },
      { status: isApiDisabled ? 403 : 500 }
    );
  }
}

/**
 * POST /api/fitness/metrics
 * 
 * Inserts new manual biometric data points into Google Fit:
 * - Weight (com.google.weight in kg)
 * - Height (com.google.height in meters; accepts cm with auto-conversion)
 * - Blood Pressure (com.google.blood_pressure with systolic, diastolic, position, and location metadata)
 * 
 * Strictly complies with Google Fit timestamp requirements:
 * - Converts milliseconds to NANOSECONDS (`ms * 1,000,000`)
 * - Registers raw data source via `users.dataSources.create`
 * - Patches raw dataset points via `users.dataSources.datasets.patch`
 */
export async function POST(request: NextRequest) {
  const tokens = await getValidGoogleFitTokens();

  if (!tokens || !tokens.access_token) {
    return NextResponse.json(
      {
        connected: false,
        error: 'Unauthorized',
        message: 'No active Google Fit session found. Please log in via /api/auth/login.',
      },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }

  const { metricType, weightKg, heightCm, heightMeters, bloodPressure, timestampMs } = body;

  const effectiveTimestamp =
    typeof timestampMs === 'number' && timestampMs > 0 ? timestampMs : Date.now();

  const metricInput: BiometricMetricInput = {
    timestampMs: effectiveTimestamp,
  };

  // 1. Process Body Weight
  if (weightKg !== undefined && weightKg !== null && weightKg !== '') {
    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 20 || parsedWeight > 350) {
      return NextResponse.json(
        { error: 'Weight must be a valid number between 20 kg and 350 kg.' },
        { status: 422 }
      );
    }
    metricInput.weightKg = Number(parsedWeight.toFixed(2));
  }

  // 2. Process Height (accepts cm or meters)
  if (heightCm !== undefined && heightCm !== null && heightCm !== '') {
    const parsedCm = parseFloat(heightCm);
    if (isNaN(parsedCm) || parsedCm < 50 || parsedCm > 280) {
      return NextResponse.json(
        { error: 'Height in cm must be between 50 cm and 280 cm.' },
        { status: 422 }
      );
    }
    metricInput.heightMeters = Number((parsedCm / 100).toFixed(2));
  } else if (heightMeters !== undefined && heightMeters !== null && heightMeters !== '') {
    const parsedMeters = parseFloat(heightMeters);
    if (isNaN(parsedMeters) || parsedMeters < 0.5 || parsedMeters > 2.8) {
      return NextResponse.json(
        { error: 'Height in meters must be between 0.5 m and 2.8 m.' },
        { status: 422 }
      );
    }
    metricInput.heightMeters = Number(parsedMeters.toFixed(2));
  }

  // 3. Process Blood Pressure
  if (bloodPressure) {
    const sys = parseFloat(bloodPressure.systolic);
    const dia = parseFloat(bloodPressure.diastolic);

    if (isNaN(sys) || isNaN(dia)) {
      return NextResponse.json(
        { error: 'Both systolic and diastolic pressures are required.' },
        { status: 422 }
      );
    }

    if (sys < 50 || sys > 260) {
      return NextResponse.json(
        { error: 'Systolic pressure must be between 50 and 260 mmHg.' },
        { status: 422 }
      );
    }

    if (dia < 30 || dia > 180) {
      return NextResponse.json(
        { error: 'Diastolic pressure must be between 30 and 180 mmHg.' },
        { status: 422 }
      );
    }

    if (sys <= dia) {
      return NextResponse.json(
        { error: 'Systolic pressure must be strictly greater than diastolic pressure.' },
        { status: 422 }
      );
    }

    metricInput.bloodPressure = {
      systolic: Math.round(sys),
      diastolic: Math.round(dia),
      bodyPosition:
        typeof bloodPressure.bodyPosition === 'number'
          ? bloodPressure.bodyPosition
          : parseInt(bloodPressure.bodyPosition || '2', 10),
      location:
        typeof bloodPressure.location === 'number'
          ? bloodPressure.location
          : parseInt(bloodPressure.location || '1', 10),
    };
  }

  // Ensure at least one biometric value is provided
  if (!metricInput.weightKg && !metricInput.heightMeters && !metricInput.bloodPressure) {
    return NextResponse.json(
      { error: 'At least one biometric metric (weight, height, or blood pressure) must be supplied.' },
      { status: 400 }
    );
  }

  try {
    const fitness = getFitnessClient(tokens.access_token);
    const result = await insertBiometricMetrics(fitness, metricInput);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${result.inserted.join(', ')} to Google Fit.`,
      inserted: result.inserted,
      recordedAt: new Date(effectiveTimestamp).toISOString(),
    });
  } catch (err: any) {
    console.error('Error inserting biometric reading into Google Fit:', err);

    const errString = String(err?.message || err);
    const isApiDisabled =
      errString.includes('Fitness API has not been used') ||
      errString.includes('SERVICE_DISABLED') ||
      errString.includes('accessNotConfigured');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to write biometric data to Google Fit',
        message: err?.message || String(err),
        isApiDisabled,
        activationUrl: isApiDisabled
          ? 'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview'
          : undefined,
      },
      { status: isApiDisabled ? 403 : 500 }
    );
  }
}
