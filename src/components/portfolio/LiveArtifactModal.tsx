'use client';

import React, { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import { EventCard } from '@/components/EventCard';
import { QRStudio } from '@/components/QRStudio';
import { BatchProcessor } from '@/components/BatchProcessor';
import { QROptions } from '@/lib/qr-engine';

interface LiveArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveArtifactModal({ isOpen, onClose }: LiveArtifactModalProps) {
  const [activeTab, setActiveTab] = useState<'event' | 'studio' | 'batch'>('event');

  const [qrOptions, setQrOptions] = useState<QROptions>({
    text: 'NEERAJ REKWAR // SENIOR SYSTEMS & FULLSTACK ARCHITECT\nPORTFOLIO: https://qrject.dev\nSTATUS: AVAILABLE Q4 2026\nCONTACT: neerajrekwar817@gmail.com',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    gradientEnabled: false,
    gradientEndColor: '#0284c7',
    eyeOuterColor: '#000000',
    eyeInnerColor: '#000000',
    dotShape: 'square',
    eyeFrameShape: 'square',
    eyeBallShape: 'square',
    logoUrl: null,
    logoSize: 0.22,
    logoPadding: 8,
    logoBackground: '#ffffff',
    logoShape: 'square',
    errorCorrectionLevel: 'H',
    dpi: 300,
    targetSizePx: 1000,
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] flex flex-col border-2 border-black bg-[#f5f5f0] shadow-[12px_12px_0px_#000000] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="border-b-2 border-black bg-[#ccff00] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-sm font-black text-black uppercase tracking-tight">
                LIVE ARTIFACT // QRJECT OPTICAL ENGINE & EVENT PASS
              </div>
              <div className="font-mono text-[10px] text-zinc-800 font-bold">
                PHYSICAL 300 DPI RASTER COMPILER · BATCH PROCESSOR · WCAG CERTIFIED
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
          >
            <span>[X] CLOSE</span>
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="border-b-2 border-black bg-white p-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'event', label: '3:4 Event Pass Card' },
              { id: 'studio', label: '300 DPI Custom Studio' },
              { id: 'batch', label: 'Batch Processor (ZIP)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQrOptions({
                  ...qrOptions,
                  foregroundColor: '#000000',
                  backgroundColor: '#ffffff',
                  gradientEnabled: false,
                  eyeOuterColor: '#000000',
                  eyeInnerColor: '#000000',
                });
              }}
              className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black text-black hover:bg-[#ccff00] transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Force Pure B&W (21:1)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0a0d16] flex justify-center">
          {activeTab === 'event' && (
            <div className="w-full flex justify-center py-4">
              <EventCard qrOptions={qrOptions} />
            </div>
          )}
          {activeTab === 'studio' && (
            <div className="w-full flex justify-center py-2">
              <QRStudio options={qrOptions} onOptionsChange={setQrOptions} />
            </div>
          )}
          {activeTab === 'batch' && (
            <div className="w-full flex justify-center py-2">
              <BatchProcessor baseOptions={qrOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
