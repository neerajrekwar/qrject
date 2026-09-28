'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Coffee,
  Sparkles,
  Check,
  Heart,
  ArrowRight,
  Zap,
  CreditCard,
  QrCode,
  ExternalLink,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { setLocalUsageCount } from '@/lib/usage-limits';

export default function TipAndPaymentPage() {
  const { data: session } = useSession();

  // Mode strictly controlled by base env feature flag (1 = Plans, 0 = Buy Me a Coffee)
  const [serverMode, setServerMode] = useState<1 | 0>(0);
  const [loadingFlag, setLoadingFlag] = useState<boolean>(true);

  // Coffee state
  const [coffeeCount, setCoffeeCount] = useState<number>(2);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [supporterName, setSupporterName] = useState<string>('');
  const [supporterMessage, setSupporterMessage] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'kofi' | 'card' | 'upi' | 'paypal' | 'crypto'>('kofi');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [copiedKofi, setCopiedKofi] = useState<boolean>(false);
  const [isProcessingTip, setIsProcessingTip] = useState<boolean>(false);
  const [tipSuccess, setTipSuccess] = useState<boolean>(false);

  // Plans state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [planSuccess, setPlanSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.monetizationMode === 0 || data.monetizationMode === 1)) {
          setServerMode(data.monetizationMode);
        }
      })
      .catch((e) => console.warn('Failed to fetch monetization mode:', e))
      .finally(() => setLoadingFlag(false));

    if (session?.user?.name) {
      setSupporterName(session.user.name);
    }
  }, [session]);

  const tipTotal = customAmount ? parseFloat(customAmount) || 0 : coffeeCount === 1 ? 3 : coffeeCount === 2 ? 5 : coffeeCount === 3 ? 15 : coffeeCount * 3;

  const handleProcessTip = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingTip(true);

    setTimeout(() => {
      setIsProcessingTip(false);
      setTipSuccess(true);
      setLocalUsageCount(0);
    }, 1200);
  };

  const handleSelectPlan = (plan: 'free' | 'pro' | 'enterprise') => {
    setSelectedPlan(plan);
    setPlanSuccess(true);
    setLocalUsageCount(0);
  };

  if (loadingFlag) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] text-black font-mono flex items-center justify-center p-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] flex items-center gap-3">
          <div className="w-4 h-4 bg-black animate-spin" />
          <span className="font-black text-sm uppercase">LOADING ENVIRONMENT CONFIGURATION...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-mono selection:bg-[#ccff00] selection:text-black flex flex-col">
      
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="border-b-4 border-black bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-black text-xs uppercase hover:bg-black hover:text-[#ccff00] px-3 py-1.5 border-2 border-black transition-colors shadow-[2px_2px_0px_#000000]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO GENERATOR</span>
          </Link>

          <div className="font-black text-xs uppercase text-zinc-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
            <span>{serverMode === 1 ? 'PRO MEMBERSHIP TIERS' : 'CREATOR TIP & KO-FI SUPPORT'}</span>
          </div>
        </div>
      </div>

      {/* 2. HERO BANNER */}
      <div className="border-b-4 border-black bg-[#fafaf5] py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 shadow-[2px_2px_0px_#000000]">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
              {serverMode === 0 ? '// CREATOR SUPPORT // KO-FI & TIP' : '// PROFESSIONAL MEMBERSHIP TIERS'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
            {serverMode === 0 ? (
              <>
                SUPPORT THE CREATOR <span className="text-amber-600">☕</span>
              </>
            ) : (
              <>
                UNLOCK PRO <span className="text-emerald-700">UNLIMITED</span> PASSES
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-700 max-w-2xl font-bold">
            {serverMode === 0
              ? 'Help keep QRject high-resolution 300/600 DPI photo generation, barcode matrixing, and fitness protocols free & open-source for everyone.'
              : 'Choose the plan tailored for your creative workflow or enterprise event pass generation. Upgrade instantly to unlock unlimited exports and 600 DPI ultra-sharp vector outputs.'}
          </p>
        </div>
      </div>

      {/* 3. EXCLUSIVE WORKSPACE (ONLY 1 ACTIVE BASED ON BASE ENV) */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1 space-y-8">
        
        {/* ========================================================================= */}
        {/* EXCLUSIVE VIEW 0: BUY ME A COFFEE / KO-FI (WHEN FEATURE_FLAG_PLANS_MODE=0) */}
        {/* ========================================================================= */}
        {serverMode === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Tipping & Ko-fi Form (7 cols) */}
            <div className="lg:col-span-7 border-4 border-black bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#000000] space-y-6">
              
              <div className="border-b-2 border-black pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FFDD00] text-black font-black flex items-center justify-center border-2 border-black shrink-0">
                    <Coffee className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-black">
                      SUPPORT THE CREATOR // BUY ME A COFFEE
                    </h2>
                    <p className="text-xs text-zinc-600 font-bold mt-0.5">
                      100% direct developer contribution via Ko-fi &amp; payment channels
                    </p>
                  </div>
                </div>
              </div>

              {tipSuccess ? (
                <div className="border-3 border-black bg-[#f0fde8] p-6 text-center space-y-3">
                  <div className="w-12 h-12 bg-black text-[#ccff00] rounded-full mx-auto flex items-center justify-center border-2 border-black">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-black uppercase">
                    THANK YOU FOR FUELING THE PROJECT!
                  </h3>
                  <p className="text-xs text-zinc-700 font-bold max-w-md mx-auto">
                    Your contribution of <strong>${tipTotal.toFixed(2)}</strong> has been received with deep gratitude. Your generation quota counter has been reset!
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setTipSuccess(false)}
                      className="px-4 py-2 border-2 border-black bg-black text-[#ccff00] font-black text-xs uppercase shadow-[2px_2px_0px_#000000] cursor-pointer"
                    >
                      Send Another Coffee
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProcessTip} className="space-y-5">
                  
                  {/* Coffee Selector Tiers (Stacked like screenshot) */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-black text-black uppercase">
                      SELECT CONTRIBUTION TIER
                    </label>

                    {/* Tier 1: 1 ESPRESSO ($3) */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmount('');
                        setCoffeeCount(1);
                      }}
                      className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
                        !customAmount && coffeeCount === 1
                          ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
                          : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-sm text-black">
                        <span>☕ 1 ESPRESSO</span>
                        <span>$3</span>
                      </div>
                      <p className="text-[11px] text-zinc-800 mt-1 font-bold">
                        Quick boost for servers &amp; high-DPI canvas algorithms.
                      </p>
                    </button>

                    {/* Tier 2: 2 COFFEES ($5) */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmount('');
                        setCoffeeCount(2);
                      }}
                      className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
                        !customAmount && coffeeCount === 2
                          ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
                          : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-sm text-black">
                        <span>☕☕ 2 COFFEES</span>
                        <span>$5</span>
                      </div>
                      <p className="text-[11px] text-zinc-800 mt-1 font-bold">
                        Keeps MongoDB profile persistence &amp; exports blazing fast.
                      </p>
                    </button>

                    {/* Tier 3: ROASTER BAG ($15) */}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomAmount('');
                        setCoffeeCount(3);
                      }}
                      className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
                        !customAmount && coffeeCount === 3
                          ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
                          : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-black text-sm text-black">
                        <span>☕☕☕ ROASTER BAG</span>
                        <span>$15</span>
                      </div>
                      <p className="text-[11px] text-zinc-800 mt-1 font-bold">
                        Supercharged supporter badge &amp; feature priority requests.
                      </p>
                    </button>

                    {/* Custom Amount */}
                    <div className="mt-3 flex items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-zinc-700">Or Custom Amount ($):</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g. 25"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-28 p-1.5 border-2 border-black bg-white font-black text-xs"
                      />
                    </div>
                  </div>

                  {/* Supporter Info */}
                  <div className="space-y-3 pt-2 border-t border-black">
                    <div>
                      <label className="block text-xs font-black text-black uppercase mb-1">
                        YOUR NAME OR TWITTER HANDLE (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Satoshi / AthleteDev"
                        value={supporterName}
                        onChange={(e) => setSupporterName(e.target.value)}
                        className="w-full p-2 border-2 border-black bg-white font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-black uppercase mb-1">
                        MESSAGE TO DEVELOPER (OPTIONAL)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Love the 300 DPI B&W photo QR tool and the Winter Arc planner!"
                        value={supporterMessage}
                        onChange={(e) => setSupporterMessage(e.target.value)}
                        className="w-full p-2 border-2 border-black bg-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  {/* Payment Channels with Ko-fi Direct */}
                  <div className="space-y-2 pt-2 border-t border-black">
                    <label className="block text-xs font-black text-black uppercase">
                      PAYMENT CHANNEL
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-black">
                      {[
                        { id: 'kofi', label: 'Ko-fi', icon: Coffee },
                        { id: 'card', label: 'Card', icon: CreditCard },
                        { id: 'upi', label: 'UPI / QR', icon: QrCode },
                        { id: 'paypal', label: 'PayPal', icon: DollarSign },
                        { id: 'crypto', label: 'Crypto', icon: Zap },
                      ].map((p) => {
                        const isSelected = paymentMethod === p.id;
                        const Icon = p.icon;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaymentMethod(p.id as any)}
                            className={`p-2 border-2 border-black flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              isSelected
                                ? p.id === 'kofi'
                                  ? 'bg-[#13C3FF] text-white shadow-[2px_2px_0px_#000000]'
                                  : 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Ko-fi Channel highlight */}
                    {paymentMethod === 'kofi' && (
                      <div className="border-2 border-black bg-[#f0faff] p-3 text-xs space-y-2.5">
                        <div className="font-black text-black flex items-center justify-between flex-wrap gap-2">
                          <span className="flex items-center gap-1.5">
                            <Coffee className="w-4 h-4 text-[#13C3FF]" />
                            <span>OFFICIAL KO-FI: ko-fi.com/neerajrekwar2001</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText('https://ko-fi.com/neerajrekwar2001');
                                setCopiedKofi(true);
                                setTimeout(() => setCopiedKofi(false), 2000);
                              }}
                              className="text-[10px] bg-white border border-black px-2 py-1 font-bold hover:bg-black hover:text-white cursor-pointer"
                            >
                              {copiedKofi ? '✓ COPIED LINK' : 'COPY KO-FI'}
                            </button>
                            <a
                              href="https://ko-fi.com/neerajrekwar2001"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-[#13C3FF] text-white border border-black px-2.5 py-1 font-black uppercase hover:bg-black hover:text-[#13C3FF] flex items-center gap-1 cursor-pointer"
                            >
                              <span>OPEN IN KO-FI</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* UPI Box details */}
                    {paymentMethod === 'upi' && (
                      <div className="border-2 border-black bg-[#fafaf8] p-3 text-xs space-y-2">
                        <div className="font-black text-black flex items-center justify-between">
                          <span>UPI ID: neerajrekwar817@okaxis</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText('neerajrekwar817@okaxis');
                              setCopiedUpi(true);
                              setTimeout(() => setCopiedUpi(false), 2000);
                            }}
                            className="text-[10px] bg-white border border-black px-2 py-0.5 font-bold hover:bg-black hover:text-white cursor-pointer"
                          >
                            {copiedUpi ? '✓ COPIED' : 'COPY UPI'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessingTip}
                    className="w-full py-3 border-2 border-black bg-[#FFDD00] text-black hover:bg-black hover:text-[#FFDD00] font-black text-sm uppercase transition-all shadow-[4px_4px_0px_#000000] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Coffee className="w-4 h-4 text-amber-900" />
                    <span>
                      {isProcessingTip
                        ? 'PROCESSING CONTRIBUTION...'
                        : `CONTRIBUTE $${tipTotal.toFixed(2)} VIA ${paymentMethod.toUpperCase()}`}
                    </span>
                  </button>
                </form>
              )}

            </div>

            {/* Right Column: Supporter Perks & Wall (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              
              <div className="border-4 border-black bg-[#fffef0] p-5 shadow-[6px_6px_0px_#000000] space-y-3">
                <div className="flex items-center gap-2 border-b-2 border-black pb-2">
                  <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
                  <h3 className="font-black text-sm uppercase text-black">
                    SUPPORTER RECOGNITION &amp; PERKS
                  </h3>
                </div>

                <ul className="space-y-2 text-xs font-bold text-zinc-800">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Instant reset and boost to your generation quota counter.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Priority consideration for new barcode formats and print presets.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Direct support via official Ko-fi page (ko-fi.com/neerajrekwar2001).</span>
                  </li>
                </ul>
              </div>

              {/* Direct Ko-fi Card */}
              <div className="border-4 border-black bg-[#13C3FF] text-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
                <div className="font-black text-sm uppercase flex items-center justify-between">
                  <span>KO-FI DIRECT CONTRIBUTION</span>
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-white/95">
                  Support Neeraj directly on Ko-fi with 0% platform fees.
                </p>
                <a
                  href="https://ko-fi.com/neerajrekwar2001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 bg-black text-[#ccff00] hover:bg-white hover:text-black text-center font-black text-xs uppercase border-2 border-black transition-colors"
                >
                  OPEN KO-FI.COM/NEERAJREKWAR2001 ↗
                </a>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* EXCLUSIVE VIEW 1: PLANS & MEMBERSHIP (WHEN FEATURE_FLAG_PLANS_MODE=1)     */}
        {/* ========================================================================= */}
        {serverMode === 1 && (
          <div className="space-y-8">
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 text-xs font-black">
              <span className={billingCycle === 'monthly' ? 'text-black' : 'text-zinc-500'}>
                MONTHLY BILLING
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-6 border-2 border-black bg-white p-0.5 flex items-center transition-all cursor-pointer"
              >
                <div
                  className={`w-4 h-4 bg-black transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6 bg-[#ccff00]' : ''
                  }`}
                />
              </button>
              <span className={billingCycle === 'yearly' ? 'text-black flex items-center gap-1' : 'text-zinc-500'}>
                <span>ANNUAL BILLING</span>
                <span className="bg-[#ccff00] text-black px-1.5 py-0.2 border border-black text-[10px]">
                  SAVE 20%
                </span>
              </span>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              
              {/* Tier 1: Free */}
              <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-black pb-3">
                    <span className="font-black text-sm uppercase text-black">GUEST / FREE</span>
                    <span className="text-xl font-black text-black">$0</span>
                  </div>
                  <p className="text-xs text-zinc-600 font-bold">
                    Perfect for casual users needing quick standard photo QRs or daily fitness tracking.
                  </p>
                  <ul className="space-y-2 text-xs font-bold text-zinc-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2 generations (Guest) / 10 (Logged in)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>300 DPI Standard PNG Export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>MongoDB Profile Sync</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 border-2 border-black bg-zinc-100 text-zinc-500 font-black text-xs uppercase"
                >
                  CURRENT TIER
                </button>
              </div>

              {/* Tier 2: Pro Studio (Featured) */}
              <div className="border-4 border-black bg-[#f4fde8] p-6 shadow-[8px_8px_0px_#000000] flex flex-col justify-between space-y-6 relative">
                <div className="absolute -top-3 right-4 bg-black text-[#ccff00] border border-black px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  RECOMMENDED
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-black pb-3">
                    <span className="font-black text-sm uppercase text-black flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>PRO STUDIO</span>
                    </span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-black">
                        {billingCycle === 'monthly' ? '$9' : '$7'}
                      </span>
                      <span className="text-[10px] text-zinc-600 block">/ month</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 font-bold">
                    For designers, agencies, and event coordinators demanding unrestricted volume.
                  </p>

                  <ul className="space-y-2 text-xs font-bold text-zinc-900">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="font-black">UNLIMITED Generations &amp; Exports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>600 DPI Ultra-Fine Vector PDF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Batch CSV Event Matrix Zip Engine</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('pro')}
                  className="w-full py-3 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[3px_3px_0px_#000000] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>UPGRADE TO PRO STUDIO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tier 3: Enterprise */}
              <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b-2 border-black pb-3">
                    <span className="font-black text-sm uppercase text-black">ENTERPRISE</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-black">
                        {billingCycle === 'monthly' ? '$29' : '$24'}
                      </span>
                      <span className="text-[10px] text-zinc-600 block">/ month</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-600 font-bold">
                    High-volume ticketing infrastructure and custom API automation integrations.
                  </p>

                  <ul className="space-y-2 text-xs font-bold text-zinc-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dedicated REST API Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Multi-seat Team Sync</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SLA &amp; Dedicated Engineer Support</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('enterprise')}
                  className="w-full py-2.5 border-2 border-black bg-white hover:bg-black hover:text-[#ccff00] font-black text-xs uppercase transition-colors cursor-pointer"
                >
                  CONTACT SALES
                </button>
              </div>

            </div>

            {planSuccess && (
              <div className="border-3 border-black bg-[#f0fde8] p-4 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Plan updated to {selectedPlan.toUpperCase()}! Unlimited generations active.</span>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="border-t-2 border-black bg-white py-4 px-4 font-mono text-xs text-center text-zinc-600">
        QRject Engine · Secure 256-bit SSL encrypted checkout &amp; Ko-fi integration
      </footer>

    </div>
  );
}
