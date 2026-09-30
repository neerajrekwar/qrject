import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleFitTokens } from '@/lib/google-fit/token-store';
import { postManualReading } from '@/lib/google-fit/client';
import { ManualHealthReading } from '@/lib/google-fit/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validation & Data Normalization
    let weightKg: number | undefined = undefined;
    let heightMeters: number | undefined = undefined;
    let bloodPressure: ManualHealthReading['bloodPressure'] = undefined;

    // Weight validation (kg)
    if (body.weightKg !== undefined && body.weightKg !== null && body.weightKg !== '') {
      const w = parseFloat(body.weightKg);
      if (isNaN(w) || w < 20 || w > 350) {
        return NextResponse.json(
          { error: 'Weight must be a realistic value between 20 kg and 350 kg' },
          { status: 400 }
        );
      }
      weightKg = Number(w.toFixed(1));
    }

    // Height validation: accepts either cm (e.g. 178) or meters (e.g. 1.78)
    if (body.height !== undefined && body.height !== null && body.height !== '') {
      let h = parseFloat(body.height);
      if (isNaN(h) || h <= 0) {
        return NextResponse.json({ error: 'Height must be a valid positive number' }, { status: 400 });
      }
      // If entered as cm (e.g. 175), convert to meters (1.75)
      if (h > 3.0) {
        h = h / 100;
      }
      if (h < 0.5 || h > 2.6) {
        return NextResponse.json(
          { error: 'Height must be between 50 cm (0.50m) and 260 cm (2.60m)' },
          { status: 400 }
        );
      }
      heightMeters = Number(h.toFixed(2));
    }

    // Blood Pressure validation (systolic & diastolic mmHg)
    if (body.systolic !== undefined && body.diastolic !== undefined) {
      const sys = parseFloat(body.systolic);
      const dia = parseFloat(body.diastolic);

      if (isNaN(sys) || isNaN(dia)) {
        return NextResponse.json(
          { error: 'Systolic and Diastolic values must be numbers' },
          { status: 400 }
        );
      }

      if (sys < 70 || sys > 260) {
        return NextResponse.json(
          { error: 'Systolic pressure must be between 70 and 260 mmHg' },
          { status: 400 }
        );
      }

      if (dia < 40 || dia > 160) {
        return NextResponse.json(
          { error: 'Diastolic pressure must be between 40 and 160 mmHg' },
          { status: 400 }
        );
      }

      if (sys <= dia) {
        return NextResponse.json(
          { error: 'Systolic pressure must be strictly greater than diastolic pressure' },
          { status: 400 }
        );
      }

      bloodPressure = {
        systolic: sys,
        diastolic: dia,
        bodyPosition: body.bodyPosition ? parseInt(body.bodyPosition, 10) as any : 2, // sitting default
        location: body.location ? parseInt(body.location, 10) as any : 1,             // left upper arm
      };
    }

    if (!weightKg && !heightMeters && !bloodPressure) {
      return NextResponse.json(
        { error: 'At least one metric (Weight, Height, or Blood Pressure) must be provided' },
        { status: 400 }
      );
    }

    const readingPayload: ManualHealthReading = {
      timestampMs: body.timestampMs ? parseInt(body.timestampMs, 10) : Date.now(),
      weightKg,
      heightMeters,
      bloodPressure,
      note: body.note,
    };

    // 2. Transmit to Google Fit or Simulated Mode
    const tokens = await getValidGoogleFitTokens();

    if (!tokens) {
      // In simulation mode, return mock success with verified normalized values
      return NextResponse.json({
        success: true,
        isSimulated: true,
        message: 'Reading recorded in Simulated Device Mode (Connect Google Fit to sync live to cloud).',
        recorded: {
          weightKg,
          heightMeters,
          bloodPressure,
          timestampNanos: `${Date.now()}000000`,
        },
      });
    }

    const fitResult = await postManualReading(tokens.access_token, readingPayload);

    return NextResponse.json({
      success: true,
      isSimulated: false,
      message: `Successfully synced ${fitResult.inserted.join(', ')} to Google Fit with nanosecond precision.`,
      inserted: fitResult.inserted,
      recorded: readingPayload,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to record reading';
    console.error('Record reading API error:', message);
    const isApiDisabled =
      message.includes('Fitness API is disabled') ||
      message.includes('Fitness API has not been used') ||
      message.includes('SERVICE_DISABLED') ||
      message.includes('accessNotConfigured');
    return NextResponse.json(
      {
        success: false,
        error: message,
        isApiDisabled,
        activationUrl: 'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview?project=263261388820',
      },
      { status: 500 }
    );
  }
}
