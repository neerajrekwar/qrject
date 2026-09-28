import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getDb } from './mongodb';

export interface DeviceMetadata {
  deviceHash: string;
  clientIp: string;
  userAgent: string;
  platform?: string;
  acceptLanguage?: string;
}

/**
 * Extracts client IP and device signature exclusively on backend
 */
export function extractDeviceMetadata(req: NextRequest): DeviceMetadata {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  let clientIp = '127.0.0.1';
  if (cfConnectingIp) {
    clientIp = cfConnectingIp.trim();
  } else if (forwarded) {
    clientIp = forwarded.split(',')[0].trim();
  } else if (realIp) {
    clientIp = realIp.trim();
  }

  const userAgent = req.headers.get('user-agent') || 'unknown-client';
  const acceptLanguage = req.headers.get('accept-language') || '';
  const platform = req.headers.get('sec-ch-ua-platform') || '';

  // Generate deterministic device SHA-256 fingerprint hash
  const rawFingerprint = `${clientIp}:::${userAgent}:::${platform}:::${acceptLanguage.slice(0, 8)}`;
  const deviceHash = crypto.createHash('sha256').update(rawFingerprint).digest('hex');

  return {
    deviceHash,
    clientIp,
    userAgent,
    platform,
    acceptLanguage,
  };
}

/**
 * Validates and records guest device usage to prevent cookie-deletion loopholes
 */
export async function getDeviceUsage(deviceHash: string): Promise<{
  deviceUsageCount: number;
  isFlagged: boolean;
  firstSeenAt?: string;
  lastSeenAt?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { deviceUsageCount: 0, isFlagged: false };

    const record = await db.collection('device_records').findOne({ deviceHash });
    if (!record) {
      return { deviceUsageCount: 0, isFlagged: false };
    }

    return {
      deviceUsageCount: record.usageCount || 0,
      isFlagged: Boolean(record.isFlagged),
      firstSeenAt: record.firstSeenAt,
      lastSeenAt: record.lastSeenAt,
    };
  } catch (e) {
    console.warn('[Server Device Guard] Error checking device usage:', e);
    return { deviceUsageCount: 0, isFlagged: false };
  }
}

/**
 * Increment device usage counter in backend MongoDB
 */
export async function incrementDeviceUsage(
  metadata: DeviceMetadata,
  toolKey: string = 'general_generator',
  userEmail?: string
): Promise<{ deviceUsageCount: number }> {
  try {
    const db = await getDb();
    if (!db) return { deviceUsageCount: 1 };

    const now = new Date().toISOString();
    const incField = `toolBreakdown.${toolKey}`;

    const updateDoc: any = {
      $inc: {
        usageCount: 1,
        [incField]: 1,
      },
      $set: {
        lastSeenAt: now,
        clientIp: metadata.clientIp,
        userAgent: metadata.userAgent,
        platform: metadata.platform,
      },
      $setOnInsert: {
        firstSeenAt: now,
        deviceHash: metadata.deviceHash,
      },
    };

    if (userEmail) {
      updateDoc.$addToSet = { associatedAccounts: userEmail };
    }

    const res = await db.collection('device_records').findOneAndUpdate(
      { deviceHash: metadata.deviceHash },
      updateDoc,
      { upsert: true, returnDocument: 'after' }
    );

    return {
      deviceUsageCount: res?.usageCount || 1,
    };
  } catch (e) {
    console.warn('[Server Device Guard] Error incrementing device record:', e);
    return { deviceUsageCount: 1 };
  }
}
