import { NextResponse } from 'next/server';
import { clearGoogleFitTokensCookie } from '@/lib/google-fit/token-store';

export async function POST() {
  try {
    await clearGoogleFitTokensCookie();
    return NextResponse.json({ success: true, message: 'Disconnected Google Fit account.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to disconnect';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
