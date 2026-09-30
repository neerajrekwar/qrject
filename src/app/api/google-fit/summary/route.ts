import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getValidGoogleFitTokens,
  getCleanInitialSummariesForUser,
  getMockDailySummaries,
} from '@/lib/google-fit/token-store';
import { fetchAggregatedDailySummaries } from '@/lib/google-fit/client';
import { DailySummaryMetric } from '@/lib/google-fit/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const isDemoRequested = searchParams.get('demo') === 'true';

    const session = await getServerSession(authOptions);
    const tokens = await getValidGoogleFitTokens();

    const userEmail = session?.user?.email || tokens?.userEmail || null;
    const userName = session?.user?.name || tokens?.userName || 'User';

    // If sandbox / demo mode requested explicitly
    if (isDemoRequested && !tokens) {
      const mockSummaries = getMockDailySummaries();
      return NextResponse.json({
        success: true,
        isAuthenticated: false,
        isSimulated: true,
        userEmail: null,
        userName: 'Demo Sandbox User',
        summaries: mockSummaries,
        latest: mockSummaries[mockSummaries.length - 1],
        stats: {
          avgSteps: 10450,
          totalSteps: 73150,
          daysCount: mockSummaries.length,
        },
      });
    }

    // If user is not authenticated with Google
    if (!tokens) {
      return NextResponse.json({
        success: false,
        isAuthenticated: Boolean(session?.user),
        isSimulated: false,
        userEmail,
        userName,
        message: session?.user
          ? `User ${userEmail} is logged in. Please authorize Google Fit permissions to sync your data.`
          : 'Please sign in with your Google email account to view your personal fitness data.',
        summaries: [],
        latest: null,
        stats: { avgSteps: 0, totalSteps: 0, daysCount: 0 },
      });
    }

    const now = Date.now();
    const startTimeMillis = now - days * 24 * 60 * 60 * 1000;

    let summaries: DailySummaryMetric[] = [];
    let isSimulated = false;

    try {
      summaries = await fetchAggregatedDailySummaries(tokens.access_token, startTimeMillis, now);
      // If user's Google Fit account has no logged activity in this period, provide clean zero baselines
      if (summaries.length === 0) {
        summaries = getCleanInitialSummariesForUser();
      }
    } catch (fitErr) {
      console.warn('Google Fit API call warning for user', userEmail, fitErr);
      // Fallback to clean zero state for the user instead of someone else's data!
      summaries = getCleanInitialSummariesForUser();
    }

    const latest = summaries[summaries.length - 1] || null;
    const totalSteps = summaries.reduce((acc, s) => acc + s.steps, 0);
    const avgSteps = Math.round(totalSteps / Math.max(1, summaries.length));

    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      isSimulated,
      userEmail,
      userName,
      summaries,
      latest,
      stats: {
        avgSteps,
        totalSteps,
        daysCount: summaries.length,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch summaries';
    console.error('Summary API error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
