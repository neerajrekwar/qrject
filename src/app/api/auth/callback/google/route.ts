import { NextRequest, NextResponse } from 'next/server';
import { exchangeAuthorizationCode } from '@/lib/google-fit/fitness-service';
import { setGoogleFitTokensCookie } from '@/lib/google-fit/token-store';
import { saveUserGoogleFitTokens } from '@/lib/db-users';

/**
 * GET /api/auth/callback/google
 * 
 * OAuth 2.0 redirect callback handler.
 * Exchanges the temporary authorization code for Google access and refresh tokens,
 * extracts user profile metadata, and stores credentials securely in an HTTP-only cookie.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateRaw = searchParams.get('state');

  let returnTo = '/dashboard';
  let redirectUriUsed: string | undefined;

  // Decode state payload if present
  if (stateRaw) {
    try {
      const stateObj = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
      if (stateObj.returnTo) returnTo = stateObj.returnTo;
      if (stateObj.redirectUri) redirectUriUsed = stateObj.redirectUri;
    } catch {
      // Fallback if state is plain string
      if (stateRaw.startsWith('/')) returnTo = stateRaw;
    }
  }

  // Handle OAuth provider error (e.g. user cancelled consent)
  if (error) {
    console.warn('Google OAuth callback returned error:', error);
    return NextResponse.redirect(
      new URL(`${returnTo}?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`${returnTo}?error=missing_authorization_code`, origin)
    );
  }

  try {
    // Determine the exact redirect URI passed to Google auth URL
    const configuredRedirect = process.env.GOOGLE_FIT_REDIRECT_URI;
    const finalRedirectUri =
      redirectUriUsed ||
      (configuredRedirect && configuredRedirect.startsWith('http')
        ? configuredRedirect
        : `${origin}/api/auth/callback/google`);

    // Exchange code for tokens using googleapis
    const tokens = await exchangeAuthorizationCode(code, finalRedirectUri);

    // Persist securely in HTTP-only cookie
    await setGoogleFitTokensCookie(tokens);

    // If email is available, also persist to database cache for cross-session continuity
    if (tokens.userEmail) {
      try {
        await saveUserGoogleFitTokens(tokens.userEmail, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: tokens.obtained_at + tokens.expires_in * 1000,
          scope: tokens.scope,
        });
      } catch (dbErr) {
        console.warn('Database user token cache warning (non-fatal):', dbErr);
      }
    }

    // Redirect to dashboard with success query param
    const destination = new URL(returnTo, origin);
    destination.searchParams.set('auth', 'success');
    if (tokens.userEmail) {
      destination.searchParams.set('user', tokens.userEmail);
    }

    return NextResponse.redirect(destination);
  } catch (err: any) {
    console.error('Failed to exchange Google OAuth code for tokens:', err);
    const destination = new URL(returnTo, origin);
    destination.searchParams.set('error', 'token_exchange_failed');
    destination.searchParams.set('details', encodeURIComponent(err?.message || String(err)));
    return NextResponse.redirect(destination);
  }
}
