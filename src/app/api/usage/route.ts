import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getDb } from '@/lib/mongodb';
import { GUEST_GENERATION_LIMIT, AUTH_FREE_GENERATION_LIMIT, PRO_GENERATION_LIMIT } from '@/lib/usage-limits';
import { extractDeviceMetadata, getDeviceUsage, incrementDeviceUsage } from '@/lib/server-device';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();
    const device = extractDeviceMetadata(req);

    // 1. Authenticated User flow
    if (session?.user?.email && db) {
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
    }

    // 2. Guest User Flow (Protected by Backend Device Fingerprinting)
    if (db) {
      const { deviceUsageCount } = await getDeviceUsage(device.deviceHash);
      const remaining = Math.max(0, GUEST_GENERATION_LIMIT - deviceUsageCount);

      return NextResponse.json({
        isLoggedIn: false,
        totalUsed: deviceUsageCount,
        limit: GUEST_GENERATION_LIMIT,
        remaining,
        canGenerate: remaining > 0,
        plan: 'guest',
        toolBreakdown: {},
      });
    }

    return NextResponse.json({
      isLoggedIn: false,
      totalUsed: 0,
      limit: GUEST_GENERATION_LIMIT,
      remaining: GUEST_GENERATION_LIMIT,
      canGenerate: true,
      plan: 'guest',
      toolBreakdown: {},
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
    const toolKey = body.toolKey || 'general_generator';

    const isLoggedIn = Boolean(session?.user?.email);
    const email = session?.user?.email;
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    const limit = !isLoggedIn
      ? GUEST_GENERATION_LIMIT
      : plan === 'pro'
      ? PRO_GENERATION_LIMIT
      : AUTH_FREE_GENERATION_LIMIT;

    const device = extractDeviceMetadata(req);

    // Track device footprint unconditionally in MongoDB
    await incrementDeviceUsage(device, toolKey, email || undefined);

    // 1. Authenticated User Quota Increment
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
            lastDeviceHash: device.deviceHash,
            lastClientIp: device.clientIp,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );

      const totalUsed = updateResult?.totalUsed || 1;
      const remaining = Math.max(0, limit - totalUsed);

      await db.collection('users').updateOne(
        { email },
        {
          $inc: { generationsUsed: 1 },
          $set: { lastActiveAt: now, lastDeviceHash: device.deviceHash },
        }
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

    // 2. Guest User Quota Check & Increment
    if (db) {
      const { deviceUsageCount } = await getDeviceUsage(device.deviceHash);
      const remaining = Math.max(0, GUEST_GENERATION_LIMIT - deviceUsageCount);

      return NextResponse.json({
        success: true,
        totalUsed: deviceUsageCount,
        limit: GUEST_GENERATION_LIMIT,
        remaining,
        canGenerate: remaining > 0,
        isGuest: true,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recorded locally',
      limit,
    });
  } catch (error: any) {
    console.error('Usage POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
