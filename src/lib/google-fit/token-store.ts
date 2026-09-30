/**
 * Google Fit Token Management & Cookie Store (Next.js App Router)
 * 
 * Manages OAuth token lifecycle:
 * - Reads tokens from NextAuth session and Database first (per-user email)
 * - Falls back to secure HTTP-only cookies
 * - Detects token expiration and automatically calls refreshAccessToken
 * - Handles demo / sandbox mode fallback when user explicitly requests preview
 */

import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUserGoogleFitTokens, saveUserGoogleFitTokens } from '@/lib/db-users';
import { GoogleOAuthTokens, DailySummaryMetric, FitSession } from './types';
import { refreshAccessToken } from './client';

export const GOOGLE_FIT_COOKIE_NAME = 'gfit_oauth_tokens_v1';

/**
 * Retrieves valid Google Fit tokens for the current authenticated user.
 * 1. Checks NextAuth session user email and user database record.
 * 2. Falls back to secure HTTP-only cookie.
 * 3. Refreshes token automatically if expiring within 5 minutes.
 */
export async function getValidGoogleFitTokens(): Promise<GoogleOAuthTokens | null> {
  // 1. Check NextAuth session
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const userEmail = session.user.email.toLowerCase().trim();
      const userTokens = await getUserGoogleFitTokens(userEmail);

      if (userTokens?.accessToken) {
        // Check if token has expired or is expiring within next 5 minutes
        const isExpired = Date.now() > userTokens.expiresAt - 300 * 1000;

        if (isExpired && userTokens.refreshToken) {
          try {
            const refreshed = await refreshAccessToken(userTokens.refreshToken);
            const newExpiresAt = refreshed.obtained_at + refreshed.expires_in * 1000;

            await saveUserGoogleFitTokens(userEmail, {
              accessToken: refreshed.access_token,
              refreshToken: userTokens.refreshToken,
              expiresAt: newExpiresAt,
              scope: userTokens.scope,
            });

            return {
              access_token: refreshed.access_token,
              refresh_token: userTokens.refreshToken,
              expires_in: refreshed.expires_in,
              token_type: 'Bearer',
              scope: userTokens.scope || '',
              obtained_at: refreshed.obtained_at,
              userEmail: userEmail,
              userName: session.user.name || undefined,
              userImage: session.user.image || undefined,
            };
          } catch (refreshErr) {
            console.warn('Failed to refresh user token from database:', refreshErr);
          }
        }

        return {
          access_token: userTokens.accessToken,
          refresh_token: userTokens.refreshToken,
          expires_in: Math.max(0, Math.floor((userTokens.expiresAt - Date.now()) / 1000)),
          token_type: 'Bearer',
          scope: userTokens.scope || '',
          obtained_at: Date.now(),
          userEmail: userEmail,
          userName: session.user.name || undefined,
          userImage: session.user.image || undefined,
        };
      }
    }
  } catch (authErr) {
    console.warn('Session check note in getValidGoogleFitTokens:', authErr);
  }

  // 2. Fallback to HTTP-only cookie
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(GOOGLE_FIT_COOKIE_NAME);

  if (!tokenCookie?.value) {
    return null;
  }

  try {
    const tokens: GoogleOAuthTokens = JSON.parse(tokenCookie.value);

    // Check if token has expired or is expiring within the next 5 minutes (300,000 ms)
    const expirationThresholdMs = tokens.obtained_at + (tokens.expires_in - 300) * 1000;
    const isExpired = Date.now() > expirationThresholdMs;

    if (isExpired && tokens.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(tokens.refresh_token);
        tokens.access_token = refreshed.access_token;
        tokens.expires_in = refreshed.expires_in;
        tokens.obtained_at = refreshed.obtained_at;

        // Update cookie with refreshed access token
        cookieStore.set(GOOGLE_FIT_COOKIE_NAME, JSON.stringify(tokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 60, // 60 days
          path: '/',
        });
      } catch (refreshErr) {
        console.warn('Failed to refresh Google Fit cookie token:', refreshErr);
        return null;
      }
    }

    return tokens;
  } catch (err) {
    console.error('Failed to parse Google Fit tokens cookie:', err);
    return null;
  }
}

/**
 * Saves Google Fit OAuth tokens to HTTP-only cookie.
 */
export async function setGoogleFitTokensCookie(tokens: GoogleOAuthTokens): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_FIT_COOKIE_NAME, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 60, // 60 days
    path: '/',
  });
}

/**
 * Clears Google Fit OAuth tokens from cookie.
 */
export async function clearGoogleFitTokensCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_FIT_COOKIE_NAME);
}

// ============================================================================
// Clean Fresh User Default State (When a new user logs in and hasn't logged readings)
// ============================================================================

export function getCleanInitialSummariesForUser(): DailySummaryMetric[] {
  const today = new Date();
  const list: DailySummaryMetric[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    list.push({
      date: dateStr,
      steps: 0,
      weightKg: null,
      heightMeters: null,
      bloodPressure: null,
      bmi: null,
      activeMinutes: 0,
    });
  }

  return list;
}

// ============================================================================
// Simulated Demo Telemetry (Only for Sandbox / Preview Mode)
// ============================================================================

export function getMockDailySummaries(): DailySummaryMetric[] {
  const today = new Date();
  const list: DailySummaryMetric[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const baseSteps = i === 0 ? 11420 : 9800 + ((i * 543) % 4200);
    const baseWeight = 78.4 - i * 0.05;
    const systolic = 118 + ((i * 3) % 8);
    const diastolic = 77 + ((i * 2) % 6);
    const map = Math.round((2 * diastolic + systolic) / 3);

    list.push({
      date: dateStr,
      steps: baseSteps,
      weightKg: Number(baseWeight.toFixed(1)),
      heightMeters: 1.78,
      bloodPressure: {
        systolic,
        diastolic,
        meanArterialPressure: map,
        status: systolic < 120 && diastolic < 80 ? 'Normal' : 'Elevated',
      },
      bmi: Number((baseWeight / (1.78 * 1.78)).toFixed(1)),
      activeMinutes: 45 + ((i * 12) % 35),
    });
  }

  return list;
}

export function getMockWorkoutSessions(): FitSession[] {
  const now = Date.now();
  return [
    {
      id: 'session-strength-demo',
      name: 'Sample Workout: Compound Push',
      description: 'Demo session showing Google Fit Sessions API synchronization',
      startTimeMillis: (now - 1000 * 60 * 60 * 4).toString(),
      endTimeMillis: (now - 1000 * 60 * 60 * 3).toString(),
      activityType: 80, // Strength Training
      application: { name: 'Demo WearOS Tracker' },
    },
    {
      id: 'session-run-demo',
      name: 'Sample Workout: Zone 2 Run',
      description: 'Demo cardio session preview',
      startTimeMillis: (now - 1000 * 60 * 60 * 28).toString(),
      endTimeMillis: (now - 1000 * 60 * 60 * 27.4).toString(),
      activityType: 8, // Running
      application: { name: 'Demo Pixel Watch' },
    },
  ];
}
