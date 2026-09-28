import { NextResponse } from 'next/server';
import { testMongoConnection } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await testMongoConnection();
  return NextResponse.json({
    status: result.connected ? 'HEALTHY' : 'DISCONNECTED',
    database: result.databaseName || null,
    pingMs: result.pingMs || null,
    collections: result.collections || [],
    error: result.error || null,
  }, { status: result.connected ? 200 : 503 });
}
