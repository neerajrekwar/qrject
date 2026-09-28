'use client';

export const GUEST_GENERATION_LIMIT = 2;
export const AUTH_FREE_GENERATION_LIMIT = 10;
export const PRO_GENERATION_LIMIT = 100;

export type ToolKey =
  | 'qr_studio'
  | 'photo_dpi'
  | 'barcode_pick'
  | 'fitness_glass'
  | 'batch_zip'
  | 'general_generator';

export interface UsageStats {
  used: number;
  limit: number;
  remaining: number;
  canGenerate: boolean;
  isLoggedIn: boolean;
  plan: 'guest' | 'free' | 'pro';
  toolBreakdown?: Record<string, number>;
}

const STORAGE_USAGE_KEY = 'Nedject_usage_count_v2';
const STORAGE_BREAKDOWN_KEY = 'Nedject_tool_breakdown_v2';

export function getLocalUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_USAGE_KEY);
    return raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function getLocalToolBreakdown(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_BREAKDOWN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setLocalUsageCount(count: number, toolKey?: ToolKey): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_USAGE_KEY, count.toString());

    if (toolKey) {
      const breakdown = getLocalToolBreakdown();
      breakdown[toolKey] = (breakdown[toolKey] || 0) + 1;
      localStorage.setItem(STORAGE_BREAKDOWN_KEY, JSON.stringify(breakdown));
    }

    // Dispatch custom event for cross-component reactive updates
    window.dispatchEvent(new Event('Nedject_usage_updated'));
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
    toolBreakdown: getLocalToolBreakdown(),
  };
}

/**
 * Consumes 1 quota for a specific tool. If quota exhausted, dispatches limit modal event and returns false.
 */
export async function consumeToolQuota(
  toolKey: ToolKey = 'general_generator',
  isLoggedIn: boolean = false,
  plan: 'free' | 'pro' = 'free'
): Promise<{ allowed: boolean; stats: UsageStats; message?: string }> {
  const currentStats = getUsageStats(isLoggedIn, plan);

  if (!currentStats.canGenerate) {
    const message = !isLoggedIn
      ? `Guest generation limit reached (${GUEST_GENERATION_LIMIT}/${GUEST_GENERATION_LIMIT}). Sign in with Google, X, or Email to unlock 10 generations or support on Ko-fi!`
      : `Account limit reached (${currentStats.limit}/${currentStats.limit}). Support on Ko-fi or upgrade to Pro to unlock unlimited generations.`;

    // Trigger universal quota exhaustion dialog modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('Nedject_limit_exhausted', {
          detail: { toolKey, stats: currentStats, message },
        })
      );
    }

    return { allowed: false, stats: currentStats, message };
  }

  // Increment local storage counter immediately
  const nextUsed = currentStats.used + 1;
  setLocalUsageCount(nextUsed, toolKey);

  // Sync with MongoDB backend asynchronously
  if (typeof window !== 'undefined') {
    fetch('/api/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolKey }),
    }).catch((e) => console.warn('Usage sync warning:', e));
  }

  const updatedStats = getUsageStats(isLoggedIn, plan);
  return { allowed: true, stats: updatedStats };
}

export function resetGuestUsageForTesting(): void {
  if (typeof window === 'undefined') return;
  setLocalUsageCount(0);
  try {
    localStorage.removeItem(STORAGE_BREAKDOWN_KEY);
  } catch {}
  window.dispatchEvent(new Event('Nedject_usage_updated'));
}

export function syncUsageWithServer(): Promise<UsageStats | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  return fetch('/api/usage')
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (data && typeof data.totalUsed === 'number') {
        const local = getLocalUsageCount();
        if (data.totalUsed > local) {
          setLocalUsageCount(data.totalUsed);
        }
        return getUsageStats(Boolean(data.isLoggedIn), data.plan);
      }
      return null;
    })
    .catch(() => null);
}

// Auto-sync usage from server device footprint on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncUsageWithServer();
  }, 100);
}
