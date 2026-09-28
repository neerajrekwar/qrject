'use client';

import React, { useState } from 'react';
import {
  Coffee,
  Sparkles,
  Check,
  Zap,
  Heart,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
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
    navigator.clipboard.writeText('https://buymeacoffee.com/qrject');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // MODE 1: MY PLANS & PRO UPGRADE
  // ==========================================
  if (monetizationMode === 1) {
    return (
      <div
        className={`border-4 border-black bg-[#fafaf5] p-4 sm:p-5 shadow-[6px_6px_0px_#000000] font-mono space-y-3 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-black text-[#ccff00] font-black text-xs flex items-center justify-center border border-black">
              ★
            </span>
            <h3 className="text-sm font-black text-black uppercase tracking-tight">
              TIER PLANS &amp; LIMITS UPGRADE (FLAG: 1 ACTIVE)
            </h3>
          </div>
          <span className="text-[10px] bg-black text-[#ccff00] px-2 py-0.5 font-bold uppercase self-start sm:self-auto">
            PRO STUDIO ACCESS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Free Tier */}
          <div className="border-2 border-black bg-white p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-sm text-black">FREE ATHLETE</span>
              <span className="font-black text-base text-black">$0</span>
            </div>
            <p className="text-[11px] text-zinc-600">
              Standard access with 10 generations limit upon login (2 for guests).
            </p>
            <ul className="space-y-1 text-[11px] font-bold text-zinc-700">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>10 Generations per Account</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>300 DPI High-Resolution Render</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>MongoDB Profile Persistence</span>
              </li>
            </ul>
          </div>

          {/* Pro Tier */}
          <div className="border-2 border-black bg-[#f4fde8] p-3 space-y-2 relative shadow-[3px_3px_0px_#000000]">
            <div className="flex justify-between items-center">
              <span className="font-black text-sm text-black flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>PRO UNLIMITED</span>
              </span>
              <span className="font-black text-base text-black">$9 / mo</span>
            </div>
            <p className="text-[11px] text-zinc-700">
              Full unconstrained industrial pass generation &amp; batch matrix exports.
            </p>
            <ul className="space-y-1 text-[11px] font-bold text-zinc-800">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>UNLIMITED QR Code Generations</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>600 DPI Ultra Sharp Vector PDF</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Batch CSV Event Matrix Zip Creator</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={onOpenUpgrade}
              className="w-full mt-2 py-2 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all cursor-pointer shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5"
            >
              <span>UPGRADE TO PRO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MODE 0: BUY ME A COFFEE (SUPPORTER)
  // ==========================================
  return (
    <div
      className={`border-4 border-black bg-[#fffef0] p-4 sm:p-5 shadow-[6px_6px_0px_#000000] font-mono space-y-3 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#FFDD00] text-black font-black text-xs flex items-center justify-center border-2 border-black">
            <Coffee className="w-4 h-4 text-amber-900" />
          </div>
          <div>
            <h3 className="text-sm font-black text-black uppercase tracking-tight flex items-center gap-1.5">
              <span>SUPPORT THE CREATOR // BUY ME A COFFEE</span>
              <span className="text-[10px] bg-[#FFDD00] border border-black px-1.5 py-0.2 text-black font-bold">
                FLAG: 0 ACTIVE
              </span>
            </h3>
            <p className="text-[11px] text-zinc-600 font-bold">
              HELP KEEP QRJECT HIGH-RESOLUTION GENERATION FREE &amp; OPEN-SOURCE
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-rose-100 border border-rose-400 text-rose-900 px-2 py-0.5 font-bold uppercase self-start sm:self-auto flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
          <span>COMMUNITY SUPPORTED</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Tier 1: $3 Espresso */}
        <button
          type="button"
          onClick={() => setSelectedTip(3)}
          className={`border-2 border-black p-3 text-left transition-all cursor-pointer ${
            selectedTip === 3
              ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-zinc-50'
          }`}
        >
          <div className="flex items-center justify-between font-black text-sm">
            <span>☕ 1 ESPRESSO</span>
            <span>$3</span>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1">Quick boost for servers &amp; high-DPI canvas algorithms.</p>
        </button>

        {/* Tier 2: $5 Cappuccino */}
        <button
          type="button"
          onClick={() => setSelectedTip(5)}
          className={`border-2 border-black p-3 text-left transition-all cursor-pointer ${
            selectedTip === 5
              ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-zinc-50'
          }`}
        >
          <div className="flex items-center justify-between font-black text-sm">
            <span>☕☕ 2 COFFEES</span>
            <span>$5</span>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1">Keeps MongoDB profile persistence &amp; exports blazing fast.</p>
        </button>

        {/* Tier 3: $15 Roasted Bag */}
        <button
          type="button"
          onClick={() => setSelectedTip(15)}
          className={`border-2 border-black p-3 text-left transition-all cursor-pointer ${
            selectedTip === 15
              ? 'bg-[#FFDD00] shadow-[3px_3px_0px_#000000]'
              : 'bg-white hover:bg-zinc-50'
          }`}
        >
          <div className="flex items-center justify-between font-black text-sm">
            <span>☕☕☕ ROASTER BAG</span>
            <span>$15</span>
          </div>
          <p className="text-[10px] text-zinc-700 mt-1">Supercharged supporter badge &amp; feature priority requests.</p>
        </button>
      </div>

      {/* Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-black text-xs">
        <div className="text-[11px] text-zinc-700 font-bold">
          Selected Contribution: <span className="font-black text-black">${selectedTip}.00</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 font-black text-xs cursor-pointer"
          >
            {copied ? '✓ COPIED LINK' : 'COPY DONATION LINK'}
          </button>

          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 border-2 border-black bg-[#FFDD00] hover:bg-black hover:text-[#FFDD00] font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000000] flex items-center gap-1.5"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>BUY ME A COFFEE (${selectedTip})</span>
          </a>
        </div>
      </div>
    </div>
  );
};
