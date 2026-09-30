import { NextRequest, NextResponse } from 'next/server';
import { getValidGoogleFitTokens, clearGoogleFitTokensCookie } from '@/lib/google-fit/token-store';

/**
 * GET /api/fitness/status
 * 
 * Checks the Google Fit authentication status for the current client.
 */
export async function GET() {
  const isConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const tokens = await getValidGoogleFitTokens();

  if (!tokens || !tokens.access_token) {
    return NextResponse.json({
      connected: false,
      isConfigured,
      user: null,
    });
  }

  return NextResponse.json({
    connected: true,
    isConfigured,
    user: {
      email: tokens.userEmail || null,
      name: tokens.userName || null,
      image: tokens.userImage || null,
    },
    scope: tokens.scope,
    expiresIn: tokens.expires_in,
  });
}

/**
 * DELETE /api/fitness/status (or POST with action=disconnect)
 * 
 * Clears the Google Fit OAuth session cookie.
 */
export async function DELETE() {
  await clearGoogleFitTokensCookie();
  return NextResponse.json({
    success: true,
    message: 'Google Fit session successfully disconnected.',
  });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'disconnect') {
    await clearGoogleFitTokensCookie();
    return NextResponse.json({
      success: true,
      message: 'Google Fit session successfully disconnected.',
    });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
