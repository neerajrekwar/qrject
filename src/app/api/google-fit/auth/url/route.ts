import { NextRequest, NextResponse } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/google-fit/client';

export async function GET(request: NextRequest) {
  try {
    const origin = request.nextUrl.origin;
    const redirectUri =
      process.env.GOOGLE_FIT_REDIRECT_URI || `${origin}/api/google-fit/auth/callback`;

    const isConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !process.env.GOOGLE_CLIENT_ID.includes('demo')
    );

    const authUrl = getGoogleAuthUrl(redirectUri, 'google_fit_sync');

    return NextResponse.json({
      authUrl,
      redirectUri,
      isConfigured,
    });
  } catch (error) {
    console.error('Error generating Google Fit Auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication URL' },
      { status: 500 }
    );
  }
}
