import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleFitTokens } from '@/lib/google-fit/token-store';
import {
  getFitnessClient,
  getRecentWorkouts,
  logCompletedWorkoutSession,
  WorkoutSessionCreateInput,
  FITNESS_ACTIVITY_MAP,
} from '@/lib/google-fit/fitness-service';

/**
 * GET /api/fitness/workouts
 * 
 * Fetches past workout sessions logged in Google Fit over the last 7 days
 * using the Sessions API (users.sessions.list).
 * 
 * Maps numeric Google Fit activityType codes:
 * - 7 = Walking
 * - 8 = Running
 * - 1 = Cycling
 * - 97 = Weightlifting
 * - 80 = Strength Training
 * - 114 = HIIT
 * etc. to human-readable labels, computes duration badges,
 * and identifies the originating source application (Android, Smartwatch, Web).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDemo = searchParams.get('demo') === 'true';
  const days = parseInt(searchParams.get('days') || '7', 10);

  // 1. Retrieve authenticated tokens from HTTP-only cookie
  const tokens = await getValidGoogleFitTokens();

  // 2. Demo fallback if user requested sandbox preview or is not connected
  if (!tokens || !tokens.access_token) {
    if (isDemo) {
      const now = Date.now();
      const mockSessions = [
        {
          id: 'demo-session-run-1',
          name: 'Morning River Trail Run',
          description: 'Logged automatically via Google Fit Android & GPS tracker',
          activityType: 8,
          activityName: 'Running',
          category: 'Cardio',
          startTimeMillis: now - 3600000 * 5,
          endTimeMillis: now - 3600000 * 5 + 42 * 60000,
          durationMinutes: 42,
          formattedDuration: '42m',
          startDateIso: new Date(now - 3600000 * 5).toISOString(),
          sourceApp: 'Google Fit Android App',
          isFromWatchOrPhone: true,
        },
        {
          id: 'demo-session-strength-2',
          name: 'Heavy Compound Lift Session',
          description: 'Push routine logged from smartwatch companion',
          activityType: 97,
          activityName: 'Weightlifting',
          category: 'Strength',
          startTimeMillis: now - 86400000 * 1 - 3600000 * 3,
          endTimeMillis: now - 86400000 * 1 - 3600000 * 3 + 60 * 60000,
          durationMinutes: 60,
          formattedDuration: '1h',
          startDateIso: new Date(now - 86400000 * 1 - 3600000 * 3).toISOString(),
          sourceApp: 'WearOS Smartwatch',
          isFromWatchOrPhone: true,
        },
        {
          id: 'demo-session-walk-3',
          name: 'Midday Brisk Walk',
          description: 'Aggregated step movement captured by accelerometer',
          activityType: 7,
          activityName: 'Walking',
          category: 'Cardio',
          startTimeMillis: now - 86400000 * 2 - 3600000 * 6,
          endTimeMillis: now - 86400000 * 2 - 3600000 * 6 + 30 * 60000,
          durationMinutes: 30,
          formattedDuration: '30m',
          startDateIso: new Date(now - 86400000 * 2 - 3600000 * 6).toISOString(),
          sourceApp: 'Google Fit Android App',
          isFromWatchOrPhone: true,
        },
        {
          id: 'demo-session-cycle-4',
          name: 'City Commute Cycle',
          description: 'Two-way sync session from Nedject Web Dashboard',
          activityType: 1,
          activityName: 'Cycling',
          category: 'Cardio',
          startTimeMillis: now - 86400000 * 3 - 3600000 * 4,
          endTimeMillis: now - 86400000 * 3 - 3600000 * 4 + 45 * 60000,
          durationMinutes: 45,
          formattedDuration: '45m',
          startDateIso: new Date(now - 86400000 * 3 - 3600000 * 4).toISOString(),
          sourceApp: 'Nedject Fitness Web',
          isFromWatchOrPhone: false,
        },
      ];

      return NextResponse.json({
        connected: false,
        isDemo: true,
        daysQueried: days,
        count: mockSessions.length,
        sessions: mockSessions,
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

  // 3. Query Google Fit Sessions API
  try {
    const fitness = getFitnessClient(tokens.access_token);
    const sessions = await getRecentWorkouts(fitness, days);

    return NextResponse.json({
      connected: true,
      isDemo: false,
      daysQueried: days,
      count: sessions.length,
      sessions,
    });
  } catch (err: any) {
    console.error('Error listing workout sessions from Google Fit:', err);

    const errString = String(err?.message || err);
    const isApiDisabled =
      errString.includes('Fitness API has not been used') ||
      errString.includes('SERVICE_DISABLED') ||
      errString.includes('accessNotConfigured');

    return NextResponse.json(
      {
        connected: true,
        error: 'Google Fit Sessions API Failure',
        message: err?.message || 'Failed to list workout sessions',
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
 * POST /api/fitness/workouts
 * 
 * Writes a completed workout session to Google Fit using `users.sessions.update`.
 * 
 * Timestamp conventions:
 * - Sessions API uses MILLISECONDS (`startTimeMillis`, `endTimeMillis`).
 * - Also records raw activity segment point using NANOSECONDS (`BigInt(ms) * 1,000,000`).
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
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, activityType, durationMinutes, startTimeMillis, description } = body;

  // Validation
  const parsedActivity = parseInt(activityType, 10);
  if (isNaN(parsedActivity) || !FITNESS_ACTIVITY_MAP[parsedActivity]) {
    return NextResponse.json(
      {
        error: `Invalid activityType code (${activityType}). Must be a recognized Google Fit code (e.g. 7=Walking, 8=Running, 1=Cycling, 97=Weightlifting).`,
      },
      { status: 422 }
    );
  }

  const parsedDuration = parseInt(durationMinutes, 10);
  if (isNaN(parsedDuration) || parsedDuration <= 0 || parsedDuration > 1440) {
    return NextResponse.json(
      { error: 'Workout duration must be between 1 and 1440 minutes (24 hours).' },
      { status: 422 }
    );
  }

  const workoutInput: WorkoutSessionCreateInput = {
    name: (name && String(name).trim()) || `${FITNESS_ACTIVITY_MAP[parsedActivity].name} Session`,
    activityType: parsedActivity,
    durationMinutes: parsedDuration,
    startTimeMillis:
      typeof startTimeMillis === 'number' && startTimeMillis > 0
        ? startTimeMillis
        : Date.now() - parsedDuration * 60 * 1000,
    description: description ? String(description).trim() : undefined,
  };

  try {
    const fitness = getFitnessClient(tokens.access_token);
    const createdSession = await logCompletedWorkoutSession(fitness, workoutInput);

    return NextResponse.json({
      success: true,
      message: `Workout '${createdSession.name}' (${createdSession.activityName}) successfully logged to Google Fit.`,
      session: createdSession,
    });
  } catch (err: any) {
    console.error('Error logging workout session to Google Fit:', err);

    const errString = String(err?.message || err);
    const isApiDisabled =
      errString.includes('Fitness API has not been used') ||
      errString.includes('SERVICE_DISABLED') ||
      errString.includes('accessNotConfigured');

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to write session to Google Fit',
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
