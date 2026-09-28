'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Lock,
  Zap,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { getUsageStats, UsageStats } from '@/lib/usage-limits';
import { AuthModal } from './AuthModal';
import { MonetizationBanner } from './MonetizationBanner';

interface UsageBannerProps {
  showMonetization?: boolean;
  className?: string;
}

export const UsageBanner: React.FC<UsageBannerProps> = ({
  showMonetization = true,
  className = '',
}) => {
  const { data: session } = useSession();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [monetizationMode, setMonetizationMode] = useState<1 | 0>(1);
  const [stats, setStats] = useState<UsageStats>({
    used: 0,
    limit: 2,
    remaining: 2,
    canGenerate: true,
    isLoggedIn: false,
    plan: 'guest',
  });

  const refresh = () => {
    const isLogged = Boolean(session?.user);
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    setStats(getUsageStats(isLogged, plan));
  };

  useEffect(() => {
    refresh();

    // Fetch feature flag
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.monetizationMode === 0 || data?.monetizationMode === 1) {
          setMonetizationMode(data.monetizationMode);
        }
      })
      .catch((e) => console.warn('Failed to fetch feature flags:', e));

    const handleUpdate = () => refresh();
    window.addEventListener('qrject_usage_updated', handleUpdate);
    return () => window.removeEventListener('qrject_usage_updated', handleUpdate);
  }, [session]);

  const isGuest = !session?.user;
  const isExhausted = stats.remaining === 0;

  return (
    <div className={`space-y-4 font-mono select-none ${className}`}>
      {/* 1. Quota Alert Strip */}
      <div
        className={`border-4 border-black p-3.5 sm:p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isExhausted
            ? 'bg-[#ffecec] text-rose-950'
            : isGuest
            ? 'bg-[#fffde6] text-zinc-900'
            : 'bg-[#f4fde8] text-zinc-900'
        }`}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 border border-black inline-block ${
                isExhausted ? 'bg-rose-600' : isGuest ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            <span className="font-black text-xs sm:text-sm uppercase tracking-tight">
              {isGuest
                ? 'GUEST GENERATION QUOTA: 2 GENERATIONS MAX'
                : stats.plan === 'pro'
                ? 'PRO UNLIMITED ACCOUNT ACTIVE'
                : 'AUTHENTICATED ACCOUNT: 10 GENERATIONS QUOTA'}
            </span>
          </div>

          <p className="text-[11px] font-bold text-zinc-600">
            {isGuest ? (
              <>
                You have used <strong>{stats.used} of 2</strong> guest generations. Sign in with Google, X, Instagram, or Email to unlock 10 limits!
              </>
            ) : stats.plan === 'pro' ? (
              <>Unlimited high-DPI export active with full MongoDB database persistence.</>
            ) : (
              <>
                You have used <strong>{stats.used} of 10</strong> generations for this account ({stats.remaining} remaining).
              </>
            )}
          </p>
        </div>

        {/* Action Button */}
        {isGuest ? (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="px-3.5 py-1.5 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>SIGN IN (UNLOCK 10)</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-black text-[#ccff00] px-2.5 py-1 border border-black">
              {stats.used} / {stats.limit} USED
            </span>
          </div>
        )}
      </div>

      {/* 2. Supporter Tipping & Pro Upgrade Tiers */}
      {showMonetization && (
        <MonetizationBanner
          monetizationMode={monetizationMode}
          onOpenUpgrade={() => {
            window.location.href = '/tip';
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => refresh()}
      />
    </div>
  );
};
