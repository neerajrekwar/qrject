import { NextRequest, NextResponse } from 'next/server';
import { getFitnessConsentUrl } from '@/lib/google-fit/fitness-service';

/**
 * GET /api/auth/login
 * 
 * Initiates the Google OAuth 2.0 flow for Google Fit.
 * Requests offline access (access_type=offline) and forced consent prompt
 * to guarantee issuance of a refresh token.
 * 
 * Required Scopes:
 * - https://www.googleapis.com/auth/fitness.body.read
 * - https://www.googleapis.com/auth/fitness.body.write
 * - https://www.googleapis.com/auth/fitness.blood_pressure.read
 * - https://www.googleapis.com/auth/fitness.blood_pressure.write
 * - https://www.googleapis.com/auth/fitness.activity.read
 * - https://www.googleapis.com/auth/fitness.activity.write
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const returnTo = searchParams.get('returnTo') || '/dashboard';
    
    // Resolve dynamic origin for multi-environment support (Codespaces, Vercel, localhost)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const origin = `${proto}://${host}`;

    // Prefer explicitly configured GOOGLE_FIT_REDIRECT_URI, otherwise default to callback route
    const configuredRedirect = process.env.GOOGLE_FIT_REDIRECT_URI;
    const redirectUri = configuredRedirect && configuredRedirect.startsWith('http')
      ? configuredRedirect
      : `${origin}/api/auth/callback/google`;

    const state = JSON.stringify({
      returnTo,
      redirectUri,
      timestamp: Date.now(),
    });

    // Generate consent URL via googleapis OAuth2 client
    const authUrl = getFitnessConsentUrl(redirectUri, Buffer.from(state).toString('base64url'));

    // Check if client is properly configured in environment
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.warn('Google OAuth credentials not configured in environment variables.');
      return NextResponse.redirect(
        new URL(`${returnTo}?error=oauth_missing_credentials`, origin)
      );
    }

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('Error generating Google Fit authorization URL:', err);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth flow', message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
