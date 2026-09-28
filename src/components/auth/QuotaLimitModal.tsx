'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  AlertTriangle,
  X,
  Coffee,
  Sparkles,
  LogIn,
  Heart,
  Check,
  ArrowRight,
} from 'lucide-react';
import { getUsageStats, UsageStats, setLocalUsageCount } from '@/lib/usage-limits';
import { AuthModal } from './AuthModal';

interface QuotaLimitModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const QuotaLimitModal: React.FC<QuotaLimitModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { data: session } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [monetizationMode, setMonetizationMode] = useState<1 | 0>(0);
  const [selectedTip, setSelectedTip] = useState<number>(5);
  const [copied, setCopied] = useState<boolean>(false);
  const [triggerTool, setTriggerTool] = useState<string>('Generator');

  const isModalOpen = propIsOpen !== undefined ? propIsOpen : internalOpen;

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    // Fetch monetization mode
    fetch('/api/feature-flags')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && (data.monetizationMode === 0 || data.monetizationMode === 1)) {
          setMonetizationMode(data.monetizationMode);
        }
      })
      .catch(() => {});

    // Listen for global limit exhaustion events
    const handleLimitExhausted = (e: any) => {
      if (e.detail?.toolKey) {
        setTriggerTool(e.detail.toolKey.replace('_', ' ').toUpperCase());
      }
      setInternalOpen(true);
    };

    window.addEventListener('Nedject_limit_exhausted', handleLimitExhausted);
    return () => window.removeEventListener('Nedject_limit_exhausted', handleLimitExhausted);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://ko-fi.com/neerajrekwar2001');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isGuest = !session?.user;

  if (!isModalOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono animate-in fade-in duration-150">
        <div className="relative w-full max-w-lg border-4 border-black bg-white shadow-[10px_10px_0px_#000000] p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-600 border border-black inline-block animate-pulse" />
              <h2 className="text-base sm:text-lg font-black uppercase text-black">
                GENERATION QUOTA REACHED
              </h2>
            </div>
            <p className="text-xs font-bold text-zinc-700">
              {isGuest
                ? `You've used all 2 guest generations on ${triggerTool}. Sign in to unlock 10 limits or support the creator to refresh immediately!`
                : `You've used all 10 free generations on ${triggerTool}. Support on Ko-fi or upgrade to Pro to unlock unlimited generations.`}
            </p>
          </div>

          {/* Guest Sign-in Promo (if guest) */}
          {isGuest && (
            <div className="border-2 border-black bg-[#fffde6] p-3 space-y-2">
              <div className="font-black text-xs uppercase text-black flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                <span>OPTION 1: SIGN IN (FREE 10 LIMITS)</span>
              </div>
              <p className="text-[11px] text-zinc-700 font-bold">
                Connect your Google, X, Instagram, or Email account instantly.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setShowAuthModal(true);
                }}
                className="w-full py-2 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>→] SIGN IN TO UNLOCK 10 LIMITS</span>
              </button>
            </div>
          )}

          {/* Option 2: Buy Me a Coffee / Ko-fi Mode (when mode === 0) */}
          {monetizationMode === 0 && (
            <div className="border-2 border-black bg-[#fffef0] p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-black pb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#FFDD00] border border-black flex items-center justify-center font-black">
                    <Coffee className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span className="font-black text-xs uppercase text-black">
                    {isGuest ? 'OPTION 2: FUEL THE PROJECT' : 'FUEL THE PROJECT // BUY ME A COFFEE'}
                  </span>
                </div>
                <span className="text-[9px] bg-[#ffeef2] border border-rose-300 text-rose-600 px-1.5 py-0.2 font-black uppercase">
                  ♥ SUPPORT
                </span>
              </div>

              {/* 3 Vertical Tiers */}
              <div className="space-y-2">
                {[
                  { id: 3, label: '☕ 1 ESPRESSO', price: '$3', desc: 'Quick boost for server algorithms' },
                  { id: 5, label: '☕☕ 2 COFFEES', price: '$5', desc: 'Keeps profile sync & exports blazing fast' },
                  { id: 15, label: '☕☕☕ ROASTER BAG', price: '$15', desc: 'Supercharged supporter badge & priority' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTip(tier.id)}
                    className={`w-full border-2 border-black p-2.5 text-left transition-all cursor-pointer block ${
                      selectedTip === tier.id
                        ? 'bg-[#FFDD00] shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-black text-xs text-black">
                      <span>{tier.label}</span>
                      <span>{tier.price}</span>
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-0.5 font-bold">{tier.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-1 text-[11px] font-black text-black">
                Selected: <span>${selectedTip}.00</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2 px-2 border-2 border-black bg-white hover:bg-zinc-100 font-black text-[11px] text-black text-center uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer"
                >
                  {copied ? '✓ COPIED LINK' : 'COPY DONATION LINK'}
                </button>

                <a
                  href="https://ko-fi.com/neerajrekwar2001"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2 border-2 border-black bg-[#FFDD00] hover:bg-black hover:text-[#FFDD00] font-black text-[11px] text-black text-center uppercase transition-all shadow-[2px_2px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Coffee className="w-3.5 h-3.5 text-black" />
                  <span>BUY ME A COFFEE (${selectedTip})</span>
                </a>
              </div>
            </div>
          )}

          {/* Option 2: Pro Upgrade (when mode === 1) */}
          {monetizationMode === 1 && (
            <div className="border-2 border-black bg-[#f0fde8] p-3.5 space-y-2.5">
              <div className="flex justify-between items-center font-black">
                <span className="uppercase text-black flex items-center gap-1 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>UPGRADE TO PRO STUDIO ($9/MO)</span>
                </span>
                <span className="text-xs bg-black text-[#ccff00] px-2 py-0.5">UNLIMITED</span>
              </div>
              <p className="text-[11px] text-zinc-700 font-bold">
                Unlock unrestricted 300/600 DPI vector exports, batch processing, and continuous database storage.
              </p>
              <a
                href="/tip"
                className="w-full py-2.5 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase transition-all shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>UPGRADE TO PRO MEMBERSHIP</span>
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          )}

        </div>
      </div>

      {/* Embedded Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setLocalUsageCount(0);
          handleClose();
        }}
      />
    </>
  );
};
