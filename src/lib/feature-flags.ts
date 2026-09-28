import { getDb } from './mongodb';

export type MonetizationMode = 1 | 0; // 1 = Plans, 0 = Buy Me a Coffee

export interface FeatureFlagConfig {
  key: string;
  value: number; // 1 or 0
  description: string;
  updatedAt: string;
}

// Default memory state
let memoryMonetizationMode: MonetizationMode = 1;

export async function getMonetizationFeatureFlag(): Promise<MonetizationMode> {
  // Check env first if explicitly set
  if (process.env.FEATURE_FLAG_PLANS_MODE !== undefined) {
    const envVal = parseInt(process.env.FEATURE_FLAG_PLANS_MODE, 10);
    if (envVal === 0 || envVal === 1) {
      memoryMonetizationMode = envVal as MonetizationMode;
    }
  }

  const db = await getDb();
  if (db) {
    try {
      const doc = await db
        .collection<FeatureFlagConfig>('feature_flags')
        .findOne({ key: 'monetization_mode' });
      if (doc && (doc.value === 1 || doc.value === 0)) {
        memoryMonetizationMode = doc.value as MonetizationMode;
        return memoryMonetizationMode;
      }
    } catch (e) {
      console.warn('Failed to read feature flag from MongoDB:', e);
    }
  }

  return memoryMonetizationMode;
}

export async function setMonetizationFeatureFlag(value: MonetizationMode): Promise<MonetizationMode> {
  memoryMonetizationMode = value;
  const now = new Date().toISOString();

  const db = await getDb();
  if (db) {
    try {
      await db.collection('feature_flags').updateOne(
        { key: 'monetization_mode' },
        {
          $set: {
            key: 'monetization_mode',
            value,
            description: value === 1 ? '1 = My Plans' : '0 = Buy Me a Coffee',
            updatedAt: now,
          },
        },
        { upsert: true }
      );
    } catch (e) {
      console.warn('Failed to save feature flag to MongoDB:', e);
    }
  }

  return memoryMonetizationMode;
}
