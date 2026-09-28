import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getDb } from '@/lib/mongodb';
import { extractDeviceMetadata } from '@/lib/server-device';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();
    const device = extractDeviceMetadata(req);

    if (!db) {
      return NextResponse.json({ items: [], source: 'fallback_memory' });
    }

    const email = session?.user?.email;
    const query = email
      ? { userEmail: email }
      : { $or: [{ deviceHash: device.deviceHash }, { isPublicOrGuest: true }] };

    const docs = await db
      .collection('qr_history')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(30)
      .toArray();

    const formatted = docs.map((doc) => ({
      id: doc.id || doc._id.toString(),
      title: doc.title || 'QR Code Matrix',
      content: doc.content || doc.options?.text || '',
      timestamp: doc.timestamp || Date.now(),
      dateFormatted: doc.dateFormatted || new Date().toLocaleString(),
      options: doc.options || {},
      previewDataUrl: doc.previewDataUrl,
      format: doc.format || '300 DPI PNG',
      contrast: doc.contrast || 21.0,
      userEmail: doc.userEmail,
    }));

    return NextResponse.json({ items: formatted, source: 'mongodb' });
  } catch (error: any) {
    console.error('History GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const db = await getDb();
    const item = await req.json();

    if (!item || !item.options) {
      return NextResponse.json({ error: 'Invalid history item payload' }, { status: 400 });
    }

    const userEmail = session?.user?.email || 'guest';
    const isPublicOrGuest = !session?.user?.email;
    const now = new Date().toISOString();
    const device = extractDeviceMetadata(req);

    const docToSave = {
      id: item.id || `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: item.title || item.options?.text?.slice(0, 32) || 'QR Code',
      content: item.content || item.options?.text || '',
      timestamp: item.timestamp || Date.now(),
      dateFormatted: item.dateFormatted || new Date().toLocaleString(),
      options: item.options,
      previewDataUrl: item.previewDataUrl,
      format: item.format || '300 DPI PNG',
      contrast: item.contrast || 21.0,
      userEmail,
      deviceHash: device.deviceHash,
      clientIp: device.clientIp,
      isPublicOrGuest,
      savedAt: now,
    };

    if (db) {
      await db.collection('qr_history').updateOne(
        { id: docToSave.id },
        { $set: docToSave },
        { upsert: true }
      );

      // Also record in user activity if authenticated
      if (session?.user?.email) {
        await db.collection('users').updateOne(
          { email: session.user.email },
          {
            $set: { lastActiveAt: now },
            $inc: { generationsUsed: 1 },
          }
        ).catch(() => {});
      }

      return NextResponse.json({ success: true, item: docToSave, storedIn: 'mongodb' });
    }

    return NextResponse.json({ success: true, item: docToSave, storedIn: 'local_fallback' });
  } catch (error: any) {
    console.error('History POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';
    const session = await getServerSession(authOptions);
    const db = await getDb();

    if (!db) {
      return NextResponse.json({ success: true, message: 'Deleted locally' });
    }

    const userEmail = session?.user?.email;

    if (clearAll) {
      if (userEmail) {
        await db.collection('qr_history').deleteMany({ userEmail });
      } else {
        await db.collection('qr_history').deleteMany({ isPublicOrGuest: true });
      }
      return NextResponse.json({ success: true, message: 'All items cleared from MongoDB' });
    }

    if (id) {
      await db.collection('qr_history').deleteOne({ id });
      return NextResponse.json({ success: true, deletedId: id });
    }

    return NextResponse.json({ error: 'Missing ID parameter' }, { status: 400 });
  } catch (error: any) {
    console.error('History DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
