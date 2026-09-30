import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getValidGoogleFitTokens } from '@/lib/google-fit/token-store';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const tokens = await getValidGoogleFitTokens();

    const isConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      !process.env.GOOGLE_CLIENT_ID.includes('demo')
    );

    const userEmail = session?.user?.email || tokens?.userEmail || null;
    const userName = session?.user?.name || tokens?.userName || null;
    const userImage = session?.user?.image || tokens?.userImage || null;

    if (!tokens) {
      return NextResponse.json({
        isAuthenticated: Boolean(session?.user),
        connected: false,
        isConfigured,
        user: session?.user
          ? {
              name: userName,
              email: userEmail,
              image: userImage,
              hasGoogleFit: false,
            }
          : null,
        message: session?.user
          ? `Logged in as ${userEmail}. Connect Google Fit to sync data for this email.`
          : 'Please sign in with your Google email account to access personal health telemetry.',
      });
    }

    const expiresAt = tokens.obtained_at + tokens.expires_in * 1000;

    return NextResponse.json({
      isAuthenticated: true,
      connected: true,
      isConfigured: true,
      user: {
        name: userName,
        email: userEmail,
        image: userImage,
        hasGoogleFit: true,
      },
      tokenType: tokens.token_type,
      scope: tokens.scope,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to check status';
    return NextResponse.json({ connected: false, error: message }, { status: 500 });
  }
}
