import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/google-fit/client';
import { setGoogleFitTokensCookie } from '@/lib/google-fit/token-store';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = request.nextUrl.origin;
  const redirectUri =
    process.env.GOOGLE_FIT_REDIRECT_URI || `${origin}/api/google-fit/auth/callback`;

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/google-fit?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/google-fit?error=missing_authorization_code', request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    await setGoogleFitTokensCookie(tokens);

    if (tokens.userEmail) {
      try {
        const { saveUserGoogleFitTokens } = await import('@/lib/db-users');
        await saveUserGoogleFitTokens(tokens.userEmail, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.obtained_at + tokens.expires_in * 1000,
          scope: tokens.scope,
        });
      } catch (dbErr) {
        console.warn('Note: Could not persist Google Fit tokens to DB in callback:', dbErr);
      }
    }

    return NextResponse.redirect(new URL('/google-fit?connected=success', request.url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown OAuth error';
    console.error('Failed to exchange Google OAuth code:', message);
    return NextResponse.redirect(
      new URL(`/google-fit?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
