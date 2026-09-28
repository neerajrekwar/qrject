'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Coffee,
  Check,
  Heart,
  ArrowRight,
} from 'lucide-react';

interface MonetizationBannerProps {
  monetizationMode: 1 | 0; // 1 = Plans, 0 = Buy Me a Coffee
  onOpenUpgrade?: () => void;
  className?: string;
}

export const MonetizationBanner: React.FC<MonetizationBannerProps> = ({
  monetizationMode,
  onOpenUpgrade,
  className = '',
}) => {
  const [selectedTip, setSelectedTip] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://ko-fi.com/neerajrekwar2001');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // MODE 1: MY PLANS & PRO UPGRADE (EXCLUSIVELY)
  // ==========================================
  if (monetizationMode === 1) {
    return (
      <div
        className={`border-4 border-black bg-[#fafaf5] p-4 sm:p-5 shadow-[6px_6px_0px_#000000] font-mono space-y-3 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 bg-[#ccff00] text-black font-black text-xs flex items-center justify-center border border-black">
              ★
            </span>
            <h3 className="text-sm font-black text-black uppercase tracking-tight">
              PRO MEMBERSHIP &amp; PASS GENERATION TIERS
            </h3>
          </div>
          <span className="text-[10px] bg-black text-[#ccff00] px-2 py-0.5 font-bold uppercase self-start sm:self-auto">
            UNLIMITED ACCESS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Plan 1: Free Tier */}
          <div className="border-2 border-black bg-white p-3 space-y-2">
            <div className="flex justify-between items-center font-black">
              <span className="uppercase text-black">FREE ACCOUNT</span>
              <span className="text-sm">$0</span>
            </div>
            <ul className="space-y-1 text-zinc-600 text-[11px]">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>2 guest / 10 authenticated generations</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Standard 300 DPI PNG export</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>MongoDB profile synchronization</span>
              </li>
            </ul>
            <div className="pt-1 text-[10px] font-bold text-zinc-400 uppercase">
              DEFAULT CURRENT STATUS
            </div>
          </div>

          {/* Plan 2: Pro Tier */}
          <div className="border-2 border-black bg-[#f0fde8] p-3 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center font-black">
                <span className="uppercase text-black flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>PRO MEMBERSHIP</span>
                </span>
                <span className="text-sm text-emerald-900">$9 / month</span>
              </div>
              <ul className="space-y-1 text-zinc-800 text-[11px] mt-2 font-bold">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>UNLIMITED High-Resolution Generations</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>600 DPI Print-Ready Vector PDF</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Event Matrix &amp; Batch ZIP Engine</span>
                </li>
              </ul>
            </div>

            <a
              href="/tip"
              className="w-full mt-2 py-2 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all cursor-pointer shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5"
            >
              <span>UPGRADE TO PRO</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 0: BUY ME A COFFEE (EXACT UI FROM SCREENSHOT)
  // ==========================================
  return (
    <div
      className={`border-4 border-black bg-[#fffef0] p-4 sm:p-5 shadow-[6px_6px_0px_#000000] font-mono space-y-4 ${className}`}
    >
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#FFDD00] text-black font-black flex items-center justify-center border-2 border-black shrink-0">
            <Coffee className="w-5 h-5 text-black" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm sm:text-base font-black text-black uppercase tracking-tight leading-tight">
              SUPPORT THE CREATOR // BUY ME A COFFEE
            </h3>
            <p className="text-[11px] text-zinc-700 font-bold uppercase tracking-tight leading-tight">
              HELP KEEP QRJECT HIGH-RESOLUTION GENERATION FREE &amp; OPEN-SOURCE
            </p>
          </div>
        </div>

        {/* Community Supported Tag */}
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] bg-[#ffeef2] border border-rose-300 text-rose-600 px-2 py-0.5 font-black uppercase">
            <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
            <span>COMMUNITY SUPPORTED</span>
          </span>
        </div>
      </div>

      <div className="border-t-2 border-black pt-3 space-y-2.5">
        {/* Tier 1: 1 ESPRESSO ($3) */}
        <button
          type="button"
          onClick={() => setSelectedTip(3)}
          className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
            selectedTip === 3
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
          onClick={() => setSelectedTip(5)}
          className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
            selectedTip === 5
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
          onClick={() => setSelectedTip(15)}
          className={`w-full border-2 border-black p-3.5 text-left transition-all cursor-pointer block ${
            selectedTip === 15
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
      </div>

      {/* Selected Contribution and Action Buttons */}
      <div className="border-t-2 border-black pt-3 space-y-3">
        <div className="text-xs text-black font-black">
          Selected Contribution: <span>${selectedTip}.00</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full py-2.5 px-3 border-2 border-black bg-white hover:bg-zinc-100 font-black text-xs text-black text-center uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
          >
            {copied ? '✓ COPIED DONATION LINK' : 'COPY DONATION LINK'}
          </button>

          <a
            href="https://ko-fi.com/neerajrekwar2001"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 border-2 border-black bg-[#FFDD00] hover:bg-black hover:text-[#FFDD00] font-black text-xs text-black text-center uppercase transition-all shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>BUY ME A COFFEE (${selectedTip})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
