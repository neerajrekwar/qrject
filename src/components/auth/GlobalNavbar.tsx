'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  User,
  LogIn,
  Zap,
  Coffee,
  Layers,
  Sparkles,
  QrCode,
  Dumbbell,
  Barcode as BarcodeIcon,
  ShieldAlert,
  Image as ImageIcon,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { UserProfileModal } from './UserProfileModal';
import { getUsageStats, UsageStats } from '@/lib/usage-limits';

export function GlobalNavbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [monetizationMode, setMonetizationMode] = useState<1 | 0>(1);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    used: 0,
    limit: 2,
    remaining: 2,
    canGenerate: true,
    isLoggedIn: false,
    plan: 'guest',
  });

  // Load feature flag from API
  useEffect(() => {
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.monetizationMode === 0 || data?.monetizationMode === 1) {
          setMonetizationMode(data.monetizationMode);
        }
      })
      .catch((e) => console.warn('Failed to load feature flags:', e));
  }, []);

  // Update usage stats on mount and session change
  const refreshUsage = () => {
    const isLogged = Boolean(session?.user);
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    setUsageStats(getUsageStats(isLogged, plan));
  };

  useEffect(() => {
    refreshUsage();

    const handleUsageUpdated = () => refreshUsage();
    window.addEventListener('Nedject_usage_updated', handleUsageUpdated);
    return () => window.removeEventListener('Nedject_usage_updated', handleUsageUpdated);
  }, [session]);

  const handleToggleMonetizationMode = async (newMode: 1 | 0) => {
    setMonetizationMode(newMode);
    try {
      await fetch('/api/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monetizationMode: newMode }),
      });
    } catch (e) {
      console.warn('Failed to update feature flag in database:', e);
    }
  };

  const navLinks = [
    { href: '/', label: '300 DPI Photo QR' },
    { href: '/normal-dpi-photo', label: 'Normal DPI' },
    { href: '/barcode-pick', label: 'Barcode Pick' },
    { href: '/fitness-glass', label: 'Fitness Glass' },
    { href: '/google-fit', label: 'Google Fit Sync' },
    { href: '/fitness-glass/winter-arc-2026', label: 'Winter Arc 2026' },
    { href: '/tip', label: monetizationMode === 1 ? 'Plans' : 'Tip & Coffee' },
  ];

  return (
    <>
      <header className="border-b-4 border-black bg-white sticky top-0 z-40 print:hidden select-none font-mono">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand & Nav links */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-2 bg-black text-[#ccff00] px-2.5 py-1 border-2 border-black font-black text-xs sm:text-sm tracking-tight hover:bg-[#ccff00] hover:text-black transition-colors"
            >
              <QrCode className="w-4 h-4" />
              <span>Nedject // genQRstudio</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1.5 text-xs">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2 py-1 border border-black font-bold uppercase transition-all ${
                      isActive
                        ? 'bg-black text-[#ccff00] shadow-[1px_1px_0px_#000000]'
                        : 'bg-zinc-50 text-black hover:bg-zinc-200'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar: Quota Counter + Upgrade/Coffee Button + User Profile / Auth */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* 1. Quota Limit Counter */}
            <div
              onClick={() => (!session?.user ? setShowAuthModal(true) : setShowProfileModal(true))}
              className="flex items-center gap-1.5 border-2 border-black bg-zinc-50 px-2 py-1 text-xs cursor-pointer hover:bg-zinc-100 shadow-[1px_1px_0px_#000000]"
              title={
                session?.user
                  ? `Authenticated Plan: ${usageStats.used}/${usageStats.limit} used`
                  : `Guest Limit: ${usageStats.used}/2 used. Click to Sign In for 10!`
              }
            >
              <span className="font-bold text-zinc-600 text-[11px]">QUOTA:</span>
              <span
                className={`font-black text-xs ${
                  usageStats.remaining === 0
                    ? 'text-rose-600'
                    : usageStats.remaining <= 1
                    ? 'text-amber-600'
                    : 'text-black'
                }`}
              >
                {usageStats.used}/{usageStats.limit}
              </span>

              {!session?.user && (
                <span className="text-[9px] bg-black text-[#ccff00] px-1 font-bold">
                  UNLOCK 10
                </span>
              )}
            </div>

            {/* 2. Clean Monetization Action Link (Conditional without internal debug wording) */}
            <Link
              href="/tip"
              className={`border-2 border-black px-2.5 py-1 text-xs font-black flex items-center gap-1.5 transition-all shadow-[1px_1px_0px_#000000] cursor-pointer ${
                monetizationMode === 1
                  ? 'bg-white text-black hover:bg-black hover:text-[#ccff00]'
                  : 'bg-[#FFDD00] text-black hover:bg-black hover:text-[#FFDD00]'
              }`}
            >
              {monetizationMode === 1 ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">UPGRADE PLAN</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3.5 h-3.5 text-amber-900" />
                  <span className="text-[11px]">BUY ME A COFFEE</span>
                </>
              )}
            </Link>

            {/* 3. User Authentication Button / Profile Pill */}
            {session?.user ? (
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black px-2.5 py-1 text-xs font-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="truncate max-w-[110px]">
                  {session.user.name?.split(' ')[0] || 'Profile'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] text-black px-3 py-1 text-xs font-black flex items-center gap-1.5 transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN / REGISTER</span>
              </button>
            )}

          </div>

        </div>

        {/* Mobile Navigation Strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-1 border-t border-black bg-zinc-100 text-[11px]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2 py-0.5 border border-black font-bold uppercase whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-black text-[#ccff00]'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          refreshUsage();
        }}
        onSuccess={() => {
          refreshUsage();
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          refreshUsage();
        }}
        monetizationMode={monetizationMode}
        onToggleMonetizationMode={handleToggleMonetizationMode}
        onProfileUpdated={() => {
          refreshUsage();
        }}
      />
    </>
  );
}
