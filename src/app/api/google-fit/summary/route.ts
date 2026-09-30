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

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const startTimeMillis = todayMidnight.getTime() - (days - 1) * 24 * 60 * 60 * 1000;
    const endTimeMillis = Date.now();

    const hasActivityScope = Boolean(
      tokens.scope?.includes('fitness.activity.read') || tokens.scope?.includes('fitness.activity.write')
    );
    const hasBodyScope = Boolean(
      tokens.scope?.includes('fitness.body.read') || tokens.scope?.includes('fitness.body.write')
    );

    let summaries: DailySummaryMetric[] = [];
    let diagnosticsData: any = null;
    let isSimulated = false;

    try {
      const result = await fetchAggregatedDailySummaries(tokens.access_token, startTimeMillis, endTimeMillis);
      summaries = result.summaries;
      diagnosticsData = result.diagnostics;
      if (summaries.length === 0) {
        summaries = getCleanInitialSummariesForUser();
      }
    } catch (fitErr) {
      console.error('Google Fit API call warning for user', userEmail, fitErr);
      summaries = getCleanInitialSummariesForUser();
    }

    const latest = summaries[summaries.length - 1] || null;
    const totalSteps = summaries.reduce((acc, s) => acc + s.steps, 0);
    const avgSteps = Math.round(totalSteps / Math.max(1, summaries.length));

    console.log('[Google Fit Summary]', {
      userEmail,
      hasActivityScope,
      hasBodyScope,
      totalSteps,
      diagnostics: diagnosticsData,
    });

    const isApiDisabled = Boolean(diagnosticsData?.isApiDisabled);
    const apiActivationUrl = diagnosticsData?.apiActivationUrl || null;

    return NextResponse.json({
      success: true,
      isAuthenticated: true,
      isSimulated,
      userEmail,
      userName,
      isApiDisabled,
      apiActivationUrl,
      hasActivityScope,
      hasBodyScope,
      grantedScope: tokens.scope,
      diagnostics: diagnosticsData,
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
