'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  Mail,
  Calendar,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Coffee,
  Layers,
  LogOut,
  Save,
  RotateCcw,
  Zap,
  ExternalLink,
} from 'lucide-react';
import { getUsageStats, resetGuestUsageForTesting, UsageStats } from '@/lib/usage-limits';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
  monetizationMode: 1 | 0;
  onToggleMonetizationMode?: (newMode: 1 | 0) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onProfileUpdated,
  monetizationMode,
  onToggleMonetizationMode,
}) => {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [occupation, setOccupation] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro'>('free');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);

  // Load profile from API or session
  useEffect(() => {
    if (!isOpen) return;

    const stats = getUsageStats(Boolean(session?.user), (session?.user as any)?.plan || 'free');
    setUsage(stats);

    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
      setDob((session.user as any).dob || '');
      setOccupation((session.user as any).occupation || '');
      setPlan((session.user as any).plan || 'free');

      // Also fetch latest from MongoDB API
      fetch(`/api/auth/profile?email=${encodeURIComponent(session.user.email || '')}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            if (data.user.name) setName(data.user.name);
            if (data.user.dob) setDob(data.user.dob);
            if (data.user.occupation) setOccupation(data.user.occupation);
            if (data.user.plan) setPlan(data.user.plan);
          }
        })
        .catch((e) => console.warn('Failed to load fresh profile:', e));
    }
  }, [isOpen, session]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || session?.user?.email,
          name,
          dob,
          occupation,
          plan,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      await updateSession({
        name,
        dob,
        occupation,
        plan,
      });

      setSuccess('Profile details saved to MongoDB database!');
      if (onProfileUpdated) onProfileUpdated();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsageCounter = () => {
    resetGuestUsageForTesting();
    setUsage(getUsageStats(Boolean(session?.user), plan));
    setSuccess('Usage count reset for testing!');
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#fcfcf9] border-4 border-black p-5 sm:p-6 w-full max-w-lg shadow-[10px_10px_0px_#000000] font-mono space-y-4 relative max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:bg-black hover:text-[#ccff00] border-2 border-black w-7 h-7 flex items-center justify-center transition-colors cursor-pointer font-bold"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="border-b-2 border-black pb-3 flex items-center justify-between pr-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#ccff00] border border-black inline-block" />
              <h2 className="text-sm font-black uppercase text-black">
                USER PROFILE &amp; MONETIZATION ENGINE
              </h2>
            </div>
            <p className="text-[11px] text-zinc-600 font-bold mt-0.5">
              MONGODB STORED DETAILS: NAME, EMAIL, DOB, OCCUPATION
            </p>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-rose-50 border-2 border-rose-600 p-2.5 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-600 p-2.5 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. Plan & Usage Stats Box */}
        <div className="border-2 border-black bg-white p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-zinc-600">ACTIVE ACCOUNT STATUS:</span>
            <span className="bg-[#ccff00] text-black px-2 py-0.5 border border-black uppercase text-[10px]">
              {session?.user ? (plan === 'pro' ? 'PRO PLAN (UNLIMITED)' : 'AUTHENTICATED (10 LIMITS)') : 'GUEST (2 LIMITS)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-zinc-200">
            <span>GENERATIONS USED:</span>
            <span className="font-black text-black">
              {usage?.used || 0} / {usage?.limit || 2} ({usage?.remaining || 0} remaining)
            </span>
          </div>

          <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden">
            <div
              className="bg-black h-full transition-all"
              style={{
                width: `${Math.min(100, (((usage?.used || 0) / (usage?.limit || 2)) * 100))}%`,
              }}
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetUsageCounter}
              className="text-[10px] text-zinc-500 hover:text-black font-bold flex items-center gap-1 cursor-pointer underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Usage Counter</span>
            </button>
          </div>
        </div>

        {/* 2. Membership & Support Quick Action */}
        <div className="border-2 border-black bg-[#fafaf5] p-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black uppercase text-black flex items-center gap-1.5">
              {monetizationMode === 1 ? (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>PRO MEMBERSHIP &amp; UPGRADE</span>
                </>
              ) : (
                <>
                  <Coffee className="w-3.5 h-3.5 text-amber-800" />
                  <span>SUPPORT CREATOR &amp; TIP</span>
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-600 mt-0.5">
              {monetizationMode === 1
                ? 'Unlock 600 DPI, vector exports, and unlimited volume.'
                : 'Help keep 300 DPI high-resolution generation free & open.'}
            </p>
          </div>

          <a
            href="/tip"
            onClick={onClose}
            className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer shrink-0 flex items-center gap-1 ${
              monetizationMode === 1
                ? 'bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black'
                : 'bg-[#FFDD00] text-black hover:bg-black hover:text-[#FFDD00]'
            }`}
          >
            <span>{monetizationMode === 1 ? 'VIEW PLANS' : 'BUY COFFEE'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* 3. User Profile Edit Form (strictly name, email, dob, occupation) */}
        {session?.user ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
            <div className="text-[11px] font-black uppercase text-black border-b border-black pb-1">
              EDIT / UPDATE PROFILE DETAILS IN MONGODB
            </div>

            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>FULL NAME</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>

            <div>
              <label className="block font-black mb-1 text-black flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                <span>EMAIL ADDRESS (DATABASE PRIMARY KEY)</span>
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full p-2 border-2 border-zinc-300 bg-zinc-100 font-bold text-zinc-600 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block font-black mb-1 text-black flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>DOB (DATE OF BIRTH)</span>
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-black mb-1 text-black flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>OCCUPATION</span>
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="e.g. Athlete / Engineer"
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: window.location.href })}
                className="px-3 py-2 border-2 border-rose-600 bg-rose-50 text-rose-900 hover:bg-rose-100 font-black text-xs flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? 'SAVING...' : 'UPDATE DETAILS'}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs font-bold text-zinc-600">
              You are currently using the app as a <strong>Guest (2 limit)</strong>. Sign in to edit your MongoDB profile details and unlock 10 generations!
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
