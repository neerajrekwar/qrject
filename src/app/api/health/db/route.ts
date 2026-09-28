import { NextResponse } from 'next/server';
import { testMongoConnection, getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await testMongoConnection();
  
  if (result.connected) {
    try {
      const db = await getDb();
      if (db) {
        const testDoc = { testKey: 'health_check', timestamp: new Date().toISOString() };
        await db.collection('_health_checks').updateOne(
          { testKey: 'health_check' },
          { $set: testDoc },
          { upsert: true }
        );
        const verified = await db.collection('_health_checks').findOne({ testKey: 'health_check' });
        
        return NextResponse.json({
          status: 'HEALTHY',
          database: result.databaseName,
          pingMs: result.pingMs,
          collections: result.collections,
          writeVerification: verified ? 'SUCCESS' : 'PENDING',
          message: 'MongoDB is connected and active for all QR & user persistence.',
        });
      }
    } catch (e: any) {
      return NextResponse.json({
        status: 'DEGRADED',
        error: e.message,
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    status: 'DISCONNECTED',
    error: result.error || 'Unable to reach MongoDB instance',
    hint: 'Verify MONGODB_URI in your environment variables.',
  }, { status: 503 });
}
