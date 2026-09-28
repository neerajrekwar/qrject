'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Coffee, Sparkles, Check, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { MonetizationBanner } from '@/components/auth/MonetizationBanner';

export default function TipAndPaymentPage() {
  const [serverMode, setServerMode] = useState<1 | 0>(0);
  const [loadingFlag, setLoadingFlag] = useState<boolean>(true);
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
  }, []);

  if (loadingFlag) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] text-black font-mono flex items-center justify-center p-4">
        <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] flex items-center gap-3">
          <div className="w-4 h-4 bg-black animate-spin" />
          <span className="font-black text-sm uppercase">LOADING...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-mono selection:bg-[#ccff00] selection:text-black flex flex-col">
      
      {/* 1. TOP BREADCRUMB & HEADER */}
      <div className="border-b-4 border-black bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 font-black text-xs uppercase hover:bg-black hover:text-[#ccff00] px-3 py-1.5 border-2 border-black transition-colors shadow-[2px_2px_0px_#000000]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>BACK TO GENERATOR</span>
          </Link>

          <div className="font-black text-xs uppercase text-zinc-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black inline-block" />
            <span>{serverMode === 1 ? 'PRO MEMBERSHIP TIERS' : 'CREATOR SUPPORT // BUY ME A COFFEE'}</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEW AREA (EXACT 1:1 TO SCREENSHOT IN MODE 0) */}
      <main className="max-w-3xl mx-auto w-full px-4 py-10 flex-1 space-y-6">
        
        {/* ========================================================================= */}
        {/* EXCLUSIVE MODE 0: BUY ME A COFFEE (EXACT MATCH TO USER SCREENSHOT)        */}
        {/* ========================================================================= */}
        {serverMode === 0 && (
          <div className="space-y-6">
            <MonetizationBanner monetizationMode={0} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* EXCLUSIVE MODE 1: PRO TIERS (WHEN FEATURE_FLAG_PLANS_MODE=1)              */}
        {/* ========================================================================= */}
        {serverMode === 1 && (
          <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
              
              {/* Tier 1: Free */}
              <div className="border-4 border-black bg-white p-5 shadow-[5px_5px_0px_#000000] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <span className="font-black text-sm uppercase text-black">FREE</span>
                    <span className="text-xl font-black text-black">$0</span>
                  </div>
                  <ul className="space-y-1.5 text-xs font-bold text-zinc-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>2 Guest / 10 Logged In</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>300 DPI Export</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-2 border-2 border-black bg-zinc-100 text-zinc-500 font-black text-xs uppercase"
                >
                  CURRENT
                </button>
              </div>

              {/* Tier 2: Pro Studio */}
              <div className="border-4 border-black bg-[#f4fde8] p-5 shadow-[6px_6px_0px_#000000] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <span className="font-black text-sm uppercase text-black flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>PRO</span>
                    </span>
                    <span className="text-xl font-black text-black">
                      {billingCycle === 'monthly' ? '$9' : '$7'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs font-bold text-zinc-900">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>UNLIMITED Generations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>600 DPI Vector PDF</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan('pro');
                    setPlanSuccess(true);
                  }}
                  className="w-full py-2.5 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  UPGRADE
                </button>
              </div>

              {/* Tier 3: Enterprise */}
              <div className="border-4 border-black bg-white p-5 shadow-[5px_5px_0px_#000000] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <span className="font-black text-sm uppercase text-black">ENTERPRISE</span>
                    <span className="text-xl font-black text-black">
                      {billingCycle === 'monthly' ? '$29' : '$24'}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-xs font-bold text-zinc-700">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>API Access &amp; Sync</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan('enterprise');
                    setPlanSuccess(true);
                  }}
                  className="w-full py-2 border-2 border-black bg-white hover:bg-black hover:text-[#ccff00] font-black text-xs uppercase cursor-pointer"
                >
                  CONTACT
                </button>
              </div>

            </div>

            {planSuccess && (
              <div className="border-3 border-black bg-[#f0fde8] p-4 text-center text-xs font-bold text-emerald-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Selected plan: {selectedPlan.toUpperCase()}</span>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. FOOTER */}
      <footer className="border-t-2 border-black bg-white py-4 px-4 font-mono text-xs text-center text-zinc-600">
        QRject · Clean Developer Support Infrastructure
      </footer>

    </div>
  );
}
