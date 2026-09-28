'use client';

export const GUEST_GENERATION_LIMIT = 2;
export const AUTH_FREE_GENERATION_LIMIT = 10;
export const PRO_GENERATION_LIMIT = 100;

export interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  canGenerate: boolean;
  isLoggedIn: boolean;
  plan: 'guest' | 'free' | 'pro';
}

const STORAGE_USAGE_KEY = 'qrject_usage_count_v2';

export function getLocalUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_USAGE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function setLocalUsageCount(count: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USAGE_KEY, count.toString());
    // Dispatch custom event for cross-component reactive updates
    window.dispatchEvent(new Event('qrject_usage_updated'));
  } catch (e) {
    console.error('Failed to set local usage count:', e);
  }
}

export function getUsageStats(isLoggedIn: boolean, plan: 'free' | 'pro' = 'free'): UsageStats {
  const used = getLocalUsageCount();
  const limit = !isLoggedIn
    ? GUEST_GENERATION_LIMIT
    : plan === 'pro'
    ? PRO_GENERATION_LIMIT
    : AUTH_FREE_GENERATION_LIMIT;

  const remaining = Math.max(0, limit - used);
  const canGenerate = remaining > 0;

  return {
    used,
    limit,
    remaining,
    canGenerate,
    isLoggedIn,
    plan: !isLoggedIn ? 'guest' : plan,
  };
}

export function tryConsumeGenerationQuota(
  isLoggedIn: boolean,
  plan: 'free' | 'pro' = 'free'
): { allowed: boolean; stats: UsageStats; message?: string } {
  const currentStats = getUsageStats(isLoggedIn, plan);

  if (!currentStats.canGenerate) {
    const message = !isLoggedIn
      ? `Guest limit reached (${GUEST_GENERATION_LIMIT}/${GUEST_GENERATION_LIMIT} generations). Please sign in with Google, X, Instagram, or Email to unlock 10 generations!`
      : `Free limit reached (${currentStats.limit}/${currentStats.limit} generations). Upgrade your plan to continue generating.`;
    return { allowed: false, stats: currentStats, message };
  }

  const nextUsed = currentStats.used + 1;
  setLocalUsageCount(nextUsed);

  const updatedStats = getUsageStats(isLoggedIn, plan);
  return { allowed: true, stats: updatedStats };
}

export function resetGuestUsageForTesting(): void {
  setLocalUsageCount(0);
}
