'use client';

import React from 'react';
import { Printer, Sparkles, Check, Sliders, ShieldCheck } from 'lucide-react';

export interface DPIGlideBarProps {
  dpi: number;
  onChange: (dpi: number) => void;
  variant?: 'dark' | 'brutalist';
  label?: string;
  showPresets?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

export const IDEAL_DPI = 300;

export const DPI_PRESETS = [
  { dpi: 72, label: '72', name: 'Web Preview', desc: 'Screen only' },
  { dpi: 150, label: '150', name: 'Draft Press', desc: 'Newsprint' },
  { dpi: 300, label: '300 ★', name: 'Commercial Print', desc: 'ISO/IEC Scannable Ideal', isIdeal: true },
  { dpi: 450, label: '450', name: 'Exhibition', desc: 'High definition' },
  { dpi: 600, label: '600', name: 'Fine Art', desc: 'Archival museum' },
  { dpi: 1200, label: '1200', name: 'Micro Litho', desc: 'Micro-print plate' },
];

export function DPIGlideBar({
  dpi,
  onChange,
  variant = 'dark',
  label = 'PHOTO QR PRINT RESOLUTION (DPI)',
  showPresets = true,
  min = 72,
  max = 1200,
  className = '',
}: DPIGlideBarProps) {
  const isIdeal = dpi === IDEAL_DPI;
  const ppm = Math.round(dpi * 39.3701); // pixels per meter for pHYs chunk
  const estPixels = Math.round((dpi / 300) * 2400);

  const getFidelityStatus = (currentDpi: number) => {
    if (currentDpi >= 600) {
      return { text: 'ULTRA ARCHIVAL FINE ART', color: 'text-purple-400', badge: 'MUSEUM GRADE' };
    }
    if (currentDpi === 300) {
      return { text: '★ IDEAL COMMERCIAL STANDARD', color: 'text-emerald-400', badge: '100% SCAN VERIFIED' };
    }
    if (currentDpi >= 300) {
      return { text: 'HIGH DEFINITION PRINT', color: 'text-cyan-400', badge: 'SHARP EDGES' };
    }
    if (currentDpi >= 150) {
      return { text: 'MEDIUM DESKTOP DRAFT', color: 'text-amber-400', badge: 'ACCEPTABLE' };
    }
    return { text: 'LOW SCREEN RESOLUTION', color: 'text-rose-400', badge: 'SCREEN ONLY' };
  };

  const status = getFidelityStatus(dpi);

  if (variant === 'brutalist') {
    return (
      <div className={`border-2 border-black bg-white p-3.5 sm:p-4 space-y-3 shadow-[3px_3px_0px_#000000] ${className}`}>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-black bg-[#ccff00] flex items-center justify-center font-black">
              <Printer className="w-3.5 h-3.5 text-black" />
            </div>
            <div>
              <span className="font-mono text-xs font-black uppercase text-black block tracking-tight">
                {label}
              </span>
              <span className="font-mono text-[10px] text-zinc-600 block">
                GLIDE BAR WITH IDEAL 300 DPI STANDARD SETPOINT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isIdeal ? (
              <span className="inline-flex items-center gap-1 border-2 border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000000] animate-pulse">
                <ShieldCheck className="w-3 h-3 stroke-[3]" />
                <span>★ IDEAL SETPOINT ACTIVE</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onChange(IDEAL_DPI)}
                className="border-2 border-black bg-white hover:bg-[#ccff00] text-black px-2.5 py-0.5 font-mono text-[10px] font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Snap immediately to 300 DPI ideal standard"
              >
                <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>SNAP TO IDEAL (300 DPI)</span>
              </button>
            )}

            <div className="flex items-center border-2 border-black bg-black text-[#ccff00] px-2 py-0.5 font-mono text-xs font-black shadow-[1.5px_1.5px_0px_#000000]">
              <input
                type="number"
                min={min}
                max={max}
                value={dpi}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
                }}
                className="w-12 bg-transparent text-right font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="ml-1 text-[10px] text-zinc-400">DPI</span>
            </div>
          </div>
        </div>

        {/* Glide Bar / Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center font-mono text-[11px] font-bold">
            <span className="text-zinc-700 flex items-center gap-1">
              <Sliders className="w-3 h-3" />
              <span>GLIDE ADJUSTER:</span>
            </span>
            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 border border-black ${
              isIdeal ? 'bg-[#ccff00] text-black' : 'bg-zinc-100 text-zinc-800'
            }`}>
              {status.text}
            </span>
          </div>

          <div className="relative py-1">
            {/* Ideal Marker Pin */}
            <div
              className="absolute -top-3 z-10 -translate-x-1/2 flex flex-col items-center pointer-events-none"
              style={{ left: `${((IDEAL_DPI - min) / (max - min)) * 100}%` }}
            >
              <span className="text-[9px] font-mono font-black bg-black text-[#ccff00] px-1 py-0.2 rounded-xs shadow-xs">
                ★ 300
              </span>
              <div className="w-0.5 h-3 bg-black mt-0.5" />
            </div>

            <input
              type="range"
              min={min}
              max={max}
              step={5}
              value={dpi}
              onChange={(e) => onChange(parseInt(e.target.value, 10))}
              className="w-full h-2.5 bg-zinc-200 border border-black rounded-none appearance-none cursor-pointer accent-black"
              aria-label="DPI Glide Bar"
            />
          </div>

          <div className="flex justify-between font-mono text-[9px] text-zinc-500 font-bold px-0.5">
            <span>{min} DPI (Draft)</span>
            <span className="text-black font-black">300 DPI (Commercial Ideal)</span>
            <span>{max} DPI (Litho Master)</span>
          </div>
        </div>

        {/* Presets Grid */}
        {showPresets && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
            {DPI_PRESETS.map((p) => {
              const active = dpi === p.dpi;
              return (
                <button
                  key={p.dpi}
                  type="button"
                  onClick={() => onChange(p.dpi)}
                  className={`p-1.5 border border-black text-center font-mono transition-all cursor-pointer ${
                    active
                      ? 'bg-black text-[#ccff00] font-black shadow-[1.5px_1.5px_0px_#000000]'
                      : p.isIdeal
                      ? 'bg-[#ccff00]/40 text-black font-bold hover:bg-[#ccff00]'
                      : 'bg-zinc-50 text-zinc-800 hover:bg-zinc-100'
                  }`}
                >
                  <div className="text-[11px] leading-tight font-black">{p.dpi} DPI</div>
                  <div className="text-[8px] truncate mt-0.5 opacity-80">{p.name}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Physical Metric Strip */}
        <div className="border border-black bg-[#fafaf8] p-2 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-zinc-700">
          <div>
            <span className="text-zinc-500">CANVAS RESOLUTION: </span>
            <span className="font-bold text-black">{estPixels} × {estPixels} px</span>
          </div>
          <div>
            <span className="text-zinc-500">PHYSICAL CHUNK (pHYs): </span>
            <span className="font-bold text-black">{ppm.toLocaleString()} ppm</span>
          </div>
          <div className="font-bold text-black">
            STATUS: <span className="underline">{status.badge}</span>
          </div>
        </div>
      </div>
    );
  }

  // Dark Theme Variant (Matches QRStudio & Production Dark UI)
  return (
    <div className={`p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5 ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Printer className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>{label}</span>
              {isIdeal && (
                <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  ★ IDEAL
                </span>
              )}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Continuous Glide Bar with Commercial Ideal Presets
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isIdeal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/40">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>IDEAL 300 DPI LOCKED</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onChange(IDEAL_DPI)}
              className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Snap immediately to 300 DPI"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>SNAP TO IDEAL (300 DPI)</span>
            </button>
          )}

          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5 font-mono text-xs font-bold text-cyan-300">
            <input
              type="number"
              min={min}
              max={max}
              value={dpi}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)));
              }}
              className="w-12 bg-transparent text-right font-mono font-bold outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="ml-1 text-[10px] text-slate-500 font-mono">DPI</span>
          </div>
        </div>
      </div>

      {/* Glide Bar (Range Slider) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Resolution Glide Bar:</span>
          </span>
          <span className={`text-[11px] font-mono font-bold ${status.color}`}>
            {status.text}
          </span>
        </div>

        <div className="relative py-2">
          {/* Ideal Marker Pin */}
          <div
            className="absolute -top-1.5 z-10 -translate-x-1/2 flex flex-col items-center pointer-events-none"
            style={{ left: `${((IDEAL_DPI - min) / (max - min)) * 100}%` }}
          >
            <span className="text-[8px] font-mono font-bold bg-emerald-500 text-black px-1 rounded-xs shadow-sm">
              ★ 300
            </span>
            <div className="w-0.5 h-2.5 bg-emerald-400 mt-0.5" />
          </div>

          <input
            type="range"
            min={min}
            max={max}
            step={5}
            value={dpi}
            onChange={(e) => onChange(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            aria-label="DPI Glide Bar"
          />
        </div>

        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>{min} DPI (Screen Draft)</span>
          <span className="text-emerald-400 font-bold">300 DPI (★ Ideal Standard)</span>
          <span>{max} DPI (Litho Fine Art)</span>
        </div>
      </div>

      {/* Quick Select Preset Buttons */}
      {showPresets && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
          {DPI_PRESETS.map((p) => {
            const active = dpi === p.dpi;
            return (
              <button
                key={p.dpi}
                type="button"
                onClick={() => onChange(p.dpi)}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-sm'
                    : p.isIdeal
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/30'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-mono font-bold leading-tight">{p.dpi}</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">{p.name}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Real-time Technical Specs Readout */}
      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-400">
        <div>
          <span className="text-slate-500">Output Matrix: </span>
          <span className="text-slate-200 font-bold">{estPixels} × {estPixels} px</span>
        </div>
        <div>
          <span className="text-slate-500">PNG Header pHYs: </span>
          <span className="text-cyan-300 font-bold">{ppm.toLocaleString()} ppm</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-slate-500">Grade:</span>
          <span className={`px-1.5 py-0.2 rounded font-bold ${
            isIdeal ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
          }`}>
            {status.badge}
          </span>
        </div>
      </div>
    </div>
  );
}
