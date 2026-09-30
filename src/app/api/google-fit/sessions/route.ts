import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleFitTokens, getMockWorkoutSessions } from '@/lib/google-fit/token-store';
import { listWorkoutSessions, putWorkoutSession } from '@/lib/google-fit/client';
import { WorkoutSessionInput, GOOGLE_FIT_ACTIVITY_TYPES } from '@/lib/google-fit/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const now = Date.now();
    const startTimeMillis = now - days * 24 * 60 * 60 * 1000;

    const tokens = await getValidGoogleFitTokens();

    if (!tokens) {
      return NextResponse.json({
        success: true,
        isSimulated: true,
        sessions: getMockWorkoutSessions(),
      });
    }

    try {
      const sessions = await listWorkoutSessions(tokens.access_token, startTimeMillis, now);
      return NextResponse.json({
        success: true,
        isSimulated: false,
        sessions: sessions.length > 0 ? sessions : getMockWorkoutSessions(),
      });
    } catch (apiErr) {
      console.warn('Google Fit sessions API failed, falling back to mock:', apiErr);
      return NextResponse.json({
        success: true,
        isSimulated: true,
        sessions: getMockWorkoutSessions(),
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve sessions';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      return NextResponse.json({ error: 'Workout session name is required' }, { status: 400 });
    }

    const activityType = parseInt(body.activityType, 10);
    if (isNaN(activityType) || !(activityType in GOOGLE_FIT_ACTIVITY_TYPES)) {
      return NextResponse.json(
        { error: 'Invalid Google Fit activityType code' },
        { status: 400 }
      );
    }

    const startTimeMillis = parseInt(body.startTimeMillis, 10);
    const endTimeMillis = parseInt(body.endTimeMillis, 10);

    if (isNaN(startTimeMillis) || isNaN(endTimeMillis)) {
      return NextResponse.json(
        { error: 'Valid startTimeMillis and endTimeMillis must be provided' },
        { status: 400 }
      );
    }

    if (startTimeMillis >= endTimeMillis) {
      return NextResponse.json(
        { error: 'Workout end time must be chronologically after start time' },
        { status: 400 }
      );
    }

    const sessionInput: WorkoutSessionInput = {
      name: body.name.trim(),
      description: body.description?.trim() || undefined,
      activityType,
      startTimeMillis,
      endTimeMillis,
    };

    const tokens = await getValidGoogleFitTokens();

    if (!tokens) {
      const mockCreated = {
        id: `session-mock-${Date.now()}`,
        name: sessionInput.name,
        description: sessionInput.description || 'Logged in Simulated Device Mode',
        startTimeMillis: sessionInput.startTimeMillis.toString(),
        endTimeMillis: sessionInput.endTimeMillis.toString(),
        activityType: sessionInput.activityType,
        application: { name: 'Nedject Simulated Sync' },
      };

      return NextResponse.json({
        success: true,
        isSimulated: true,
        message: 'Workout session recorded in Simulated Mode (Connect Google Fit to sync live to cloud).',
        session: mockCreated,
      });
    }

    const created = await putWorkoutSession(tokens.access_token, sessionInput);

    return NextResponse.json({
      success: true,
      isSimulated: false,
      message: `Workout "${created.name}" successfully pushed to Google Fit Sessions API.`,
      session: created,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create session';
    console.error('Session create API error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
