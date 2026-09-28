import { NextRequest, NextResponse } from 'next/server';
import {
  getMonetizationFeatureFlag,
  setMonetizationFeatureFlag,
  MonetizationMode,
} from '@/lib/feature-flags';

export async function GET() {
  try {
    const mode = await getMonetizationFeatureFlag();
    return NextResponse.json({
      monetizationMode: mode,
      description: mode === 1 ? '1 = My Plans' : '0 = Buy Me a Coffee',
      activeLabel: mode === 1 ? 'PLANS & PRO UPGRADE' : 'BUY ME A COFFEE (SUPPORTER)',
    });
  } catch (error: any) {
    console.error('Feature flag GET error:', error);
    return NextResponse.json({ monetizationMode: 1, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const modeVal = body.monetizationMode;

    if (modeVal !== 0 && modeVal !== 1) {
      return NextResponse.json(
        { error: 'Invalid feature flag value. Must be 1 (Plans) or 0 (Buy Me a Coffee).' },
        { status: 400 }
      );
    }

    const updated = await setMonetizationFeatureFlag(modeVal as MonetizationMode);
    return NextResponse.json({
      message: 'Feature flag updated successfully in MongoDB database',
      monetizationMode: updated,
      description: updated === 1 ? '1 = My Plans' : '0 = Buy Me a Coffee',
    });
  } catch (error: any) {
    console.error('Feature flag POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
