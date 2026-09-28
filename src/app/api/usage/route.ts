import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getDb } from '@/lib/mongodb';
import { GUEST_GENERATION_LIMIT, AUTH_FREE_GENERATION_LIMIT, PRO_GENERATION_LIMIT } from '@/lib/usage-limits';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();

    if (!session?.user?.email || !db) {
      return NextResponse.json({
        isLoggedIn: false,
        totalUsed: 0,
        limit: GUEST_GENERATION_LIMIT,
        plan: 'guest',
        toolBreakdown: {},
      });
    }

    const email = session.user.email;
    const plan = ((session.user as any)?.plan || 'free') as 'free' | 'pro';
    const limit = plan === 'pro' ? PRO_GENERATION_LIMIT : AUTH_FREE_GENERATION_LIMIT;

    const userRecord = await db.collection('users').findOne({ email });
    const usageDoc = await db.collection('usage_records').findOne({ email });

    const totalUsed = usageDoc?.totalUsed || userRecord?.generationsUsed || 0;
    const toolBreakdown = usageDoc?.toolBreakdown || {};

    return NextResponse.json({
      isLoggedIn: true,
      email,
      totalUsed,
      limit,
      remaining: Math.max(0, limit - totalUsed),
      plan,
      toolBreakdown,
    });
  } catch (error: any) {
    console.error('Usage GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();
    const body = await req.json().catch(() => ({}));
    const toolKey = body.toolKey || 'general_generator'; // e.g. 'qr_studio', 'photo_dpi', 'barcode_pick', 'fitness_glass'

    const isLoggedIn = Boolean(session?.user?.email);
    const email = session?.user?.email;
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    const limit = !isLoggedIn
      ? GUEST_GENERATION_LIMIT
      : plan === 'pro'
      ? PRO_GENERATION_LIMIT
      : AUTH_FREE_GENERATION_LIMIT;

    if (db && email) {
      const now = new Date().toISOString();
      const incField = `toolBreakdown.${toolKey}`;

      const updateResult = await db.collection('usage_records').findOneAndUpdate(
        { email },
        {
          $inc: {
            totalUsed: 1,
            [incField]: 1,
          },
          $set: {
            updatedAt: now,
            plan,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const totalUsed = updateResult?.totalUsed || 1;
      const remaining = Math.max(0, limit - totalUsed);

      // Also mirror to user object if exists
      await db.collection('users').updateOne(
        { email },
        { $inc: { generationsUsed: 1 } }
      ).catch(() => {});

      return NextResponse.json({
        success: true,
        totalUsed,
        limit,
        remaining,
        canGenerate: remaining > 0,
        toolBreakdown: updateResult?.toolBreakdown || {},
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recorded locally for guest',
      limit,
    });
  } catch (error: any) {
    console.error('Usage POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
