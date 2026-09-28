'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Download,
  FileText,
  Printer,
  Check,
  Eye,
  ArrowLeft,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import {
  PhotoDPIOptions,
  BWToneMode,
  renderPhotoToDPICanvas,
  exportPhotoDPI_PNG,
  exportPhotoDPI_PDF,
  triggerFileDownload,
} from '@/lib/photo-dpi-engine';
import { PHOTO_PRESETS } from '@/lib/photo-presets';
import { UsageBanner } from '@/components/auth/UsageBanner';
import { useSession } from 'next-auth/react';
import { consumeToolQuota } from '@/lib/usage-limits';
import { QuotaLimitModal } from '@/components/auth/QuotaLimitModal';

const PRINT_SIZES = [
  { label: '4" × 6" Postcard', w: 4, h: 6, desc: '1200×1800 px @ 300 DPI' },
  { label: '5" × 7" Portrait', w: 5, h: 7, desc: '1500×2100 px @ 300 DPI' },
  { label: '8" × 10" Gallery', w: 8, h: 10, desc: '2400×3000 px @ 300 DPI' },
  { label: '8.5" × 11" Letter', w: 8.5, h: 11, desc: '2550×3300 px @ 300 DPI' },
  { label: 'A4 (8.27" × 11.69")', w: 8.27, h: 11.69, desc: '2480×3508 px @ 300 DPI' },
];

const TONE_MODES: { id: BWToneMode; label: string; desc: string }[] = [
  {
    id: 'high-contrast',
    label: 'High-Contrast B/W',
    desc: 'Commercial 21:1 offset press contrast with sharp micro-tonal separation',
  },
  {
    id: 'silver-gelatin',
    label: 'Silver Gelatin Film',
    desc: 'Continuous tone darkroom S-curve with rich shadows and preserved highlights',
  },
  {
    id: 'floyd-steinberg',
    label: 'Floyd-Steinberg 1-Bit',
    desc: 'Authentic error-diffusion newspaper/risograph stippled halftoning',
  },
  {
    id: 'halftone-screen',
    label: 'Halftone Screen Dots',
    desc: 'Classic optical printing dot raster screen (variable dot pitch)',
  },
  {
    id: 'hard-threshold',
    label: 'Hard Threshold Stencil',
    desc: 'Crisp binary 1-bit monochrome silhouette for laser/silkscreen',
  },
];

export default function NormalDPIPhotoPage() {
  const { data: session } = useSession();
  const [currentImageSource, setCurrentImageSource] = useState<string>(PHOTO_PRESETS[0].dataUrl);
  const [imageFileName, setImageFileName] = useState<string>('Studio Portrait Specimen');

  const [options, setOptions] = useState<PhotoDPIOptions>({
    dpi: 300,
    toneMode: 'high-contrast',
    contrast: 1.45,
    brightness: 1.0,
    sharpness: 35,
    invert: false,
    threshold: 128,
    halftoneDotSize: 6,
    targetWidthInches: 5,
    targetHeightInches: 7,
    aspectMode: 'cover',
  });

  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'tonal' | 'dpi' | 'export'>('tonal');
  const [showOriginal, setShowOriginal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Re-render canvas whenever image or options change
  useEffect(() => {
    let isCancelled = false;
    if (!canvasRef.current) return;

    renderPhotoToDPICanvas(canvasRef.current, currentImageSource, options).then(() => {
      if (isCancelled) return;
    });

    return () => {
      isCancelled = true;
    };
  }, [currentImageSource, options]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdate = (updates: Partial<PhotoDPIOptions>) => {
    setOptions((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCurrentImageSource(dataUrl);
      showToast(`Loaded "${file.name}" for DPI processing`);
    };
    reader.readAsDataURL(file);
  };

  const verifyQuota = async () => {
    const isLogged = Boolean(session?.user);
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    const res = await consumeToolQuota('photo_dpi', isLogged, plan);
    return res.allowed;
  };

  const handleExportPNG = async () => {
    if (!canvasRef.current) return;
    const allowed = await verifyQuota();
    if (!allowed) return;

    setIsExporting(true);
    try {
      const result = await exportPhotoDPI_PNG(canvasRef.current, options, 'Photo-Print');
      triggerFileDownload(result);
      showToast(`Exported ${options.dpi} DPI PNG (Physical pHYs injected)`);
    } catch (err) {
      console.error(err);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!canvasRef.current) return;
    const allowed = await verifyQuota();
    if (!allowed) return;

    setIsExporting(true);
    try {
      const result = await exportPhotoDPI_PDF(canvasRef.current, options, 'Photo-Print');
      triggerFileDownload(result);
      showToast('Exported ISO Print Card PDF with trim marks');
    } catch (err) {
      console.error(err);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  // Dimensions math
  const widthPx = Math.round(options.targetWidthInches * options.dpi);
  const heightPx = Math.round(options.targetHeightInches * options.dpi);
  const megapixels = ((widthPx * heightPx) / 1000000).toFixed(2);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black flex flex-col">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#f5f5f0] border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-12 h-12 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] transition-colors font-mono font-black text-xl"
            >
              NR
            </Link>
            <div>
              <div className="font-mono text-xs font-black tracking-widest text-black flex items-center gap-1.5">
                <span>PHOTO DPI MAKER</span>
                <span className="w-1.5 h-1.5 bg-[#ccff00] border border-black inline-block" />
              </div>
              <div className="font-mono text-[10px] text-zinc-600 tracking-wider">
                NORMAL PHOTO → 300 DPI B/W PRINT ENGINE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span className="border-2 border-black bg-[#ccff00] text-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                {options.dpi} DPI CALIBRATED
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                pHYs INJECTOR
              </span>
            </div>

            <Link
              href="/"
              className="flex items-center gap-1.5 border-2 border-black bg-white hover:bg-black hover:text-white px-3.5 py-2 font-mono text-xs font-black shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>RETURN TO QR STUDIO</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Dossier Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
              {'// ENGINE: NORMAL PHOTO TO 300 DPI HIGH-RESOLUTION B/W CONVERTER'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-black">
                PHOTO DPI MAKER
              </h1>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800">
                HIGH-RESOLUTION B/W
              </h2>
            </div>

            <p className="font-mono text-xs sm:text-sm text-zinc-700 max-w-xl leading-relaxed">
              Standalone utility to convert ordinary digital photos into <strong>physical print-ready 300 DPI / 600 DPI Black & White images</strong>. Embeds physical binary resolution chunks (`pHYs` @ 11,811 ppm), applies darkroom tonal curves, unsharp masking, and commercial print crop marks.
            </p>
          </div>
        </div>

        {/* QUOTA & FEATURE FLAG MONETIZATION BANNER */}
        <UsageBanner />

        {/* Workspace Grid Container */}
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_#000000] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Controls & Configurations (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-7 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between space-y-6 bg-white">
            
            <div className="space-y-6">
              
              {/* Tabs Bar */}
              <div className="flex items-center gap-1.5 border-2 border-black bg-[#fafaf8] p-1.5 shadow-[3px_3px_0px_#000000] overflow-x-auto">
                {[
                  { id: 'tonal', label: 'B/W TONAL ENGINE', icon: SlidersHorizontal },
                  { id: 'dpi', label: 'DPI & PRINT DIMENSIONS', icon: Printer },
                  { id: 'export', label: 'HIGH-RES EXPORT', icon: Download },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`px-3 py-2 font-mono text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Photo Upload & Presets Section */}
              <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-black" />
                    <span>LOAD PHOTO FOR DPI PROCESSING</span>
                  </span>
                  <span className="font-mono text-[10px] bg-black text-[#ccff00] px-1.5 py-0.5 font-bold">
                    ANY FORMAT (JPG/PNG/WEBP)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="photo-dpi-upload"
                  />
                  <label
                    htmlFor="photo-dpi-upload"
                    className="flex-1 w-full border-2 border-dashed border-black bg-white hover:bg-zinc-50 p-3 text-center font-mono text-xs font-bold text-black cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-black" />
                    <span>{imageFileName ? `Change Image (${imageFileName})` : 'Choose Photo from Device...'}</span>
                  </label>
                </div>

                {/* Preset Specimens */}
                <div className="pt-2 border-t border-zinc-200">
                  <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase block mb-1.5">
                    OR TEST WITH CURATED SPECIMEN PRESETS:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {PHOTO_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setCurrentImageSource(p.dataUrl);
                          setImageFileName(p.name);
                          showToast(`Loaded ${p.name}`);
                        }}
                        className={`p-1.5 border border-black font-mono text-[10px] font-bold text-left transition-all cursor-pointer flex flex-col items-center gap-1 ${
                          currentImageSource === p.dataUrl ? 'bg-black text-[#ccff00]' : 'bg-white hover:bg-zinc-100'
                        }`}
                      >
                        <div className="w-10 h-10 border border-black bg-white shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="truncate w-full text-center">{p.name.replace('B/W ', '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TAB 1: B/W TONAL ENGINE */}
              {activeTab === 'tonal' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Tonal Mode Selector */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-700 block">
                      MONOCHROME TONAL CURVE PROFILE:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {TONE_MODES.map((mode) => {
                        const isSelected = options.toneMode === mode.id;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => handleUpdate({ toneMode: mode.id })}
                            className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-xs uppercase flex items-center justify-between">
                              <span>{mode.label}</span>
                              {isSelected && <span className="text-[10px] bg-[#ccff00] text-black px-1 font-black">ACTIVE</span>}
                            </div>
                            <div className="text-[10px] opacity-75 mt-0.5 leading-snug">{mode.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sliders: Contrast, Brightness, Sharpness */}
                  <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-4 shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                      <span className="font-mono text-xs font-black uppercase text-black">
                        OPTICAL TONAL CALIBRATION
                      </span>
                      <button
                        onClick={() =>
                          handleUpdate({
                            contrast: 1.45,
                            brightness: 1.0,
                            sharpness: 35,
                            invert: false,
                          })
                        }
                        className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black hover:bg-black hover:text-[#ccff00] transition-colors cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Contrast */}
                      <div>
                        <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                          <span>B/W CONTRAST</span>
                          <span>{options.contrast.toFixed(2)}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="3.0"
                          step="0.05"
                          value={options.contrast}
                          onChange={(e) => handleUpdate({ contrast: parseFloat(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      {/* Brightness */}
                      <div>
                        <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                          <span>EXPOSURE</span>
                          <span>{Math.round(options.brightness * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={options.brightness}
                          onChange={(e) => handleUpdate({ brightness: parseFloat(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>

                      {/* Unsharp Mask Sharpness */}
                      <div>
                        <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                          <span>UNSHARP MASK</span>
                          <span>{options.sharpness}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={options.sharpness}
                          onChange={(e) => handleUpdate({ sharpness: parseInt(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Halftone Dot Size (Only when Halftone Screen active) */}
                    {options.toneMode === 'halftone-screen' && (
                      <div className="pt-2 border-t border-zinc-200">
                        <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                          <span>HALFTONE SCREEN DOT PITCH</span>
                          <span>{options.halftoneDotSize} px</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="16"
                          step="1"
                          value={options.halftoneDotSize}
                          onChange={(e) => handleUpdate({ halftoneDotSize: parseInt(e.target.value) })}
                          className="w-full accent-black cursor-pointer"
                        />
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
                      <button
                        onClick={() => handleUpdate({ invert: !options.invert })}
                        className={`px-3 py-1 font-mono text-xs font-bold border border-black transition-colors ${
                          options.invert ? 'bg-black text-[#ccff00]' : 'bg-white text-black'
                        }`}
                      >
                        Invert Negative: {options.invert ? 'ON' : 'OFF'}
                      </button>

                      <span className="font-mono text-[11px] text-zinc-600">
                        21:1 Commercial Black & White Standard
                      </span>
                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: DPI & PRINT DIMENSIONS */}
              {activeTab === 'dpi' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* DPI Selector */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-700 block">
                      TARGET PHYSICAL PRINT RESOLUTION:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { dpi: 300, name: '300 DPI Standard', desc: 'Commercial Press / RIP' },
                        { dpi: 600, name: '600 DPI Ultra', desc: 'Fine Art / Archival' },
                        { dpi: 150, name: '150 DPI Draft', desc: 'Screen Print / Newsprint' },
                        { dpi: 72, name: '72 DPI Web', desc: 'Screen Preview Only' },
                      ].map((d) => {
                        const isSelected = options.dpi === d.dpi;
                        return (
                          <button
                            key={d.dpi}
                            onClick={() => handleUpdate({ dpi: d.dpi as PhotoDPIOptions['dpi'] })}
                            className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-sm">{d.dpi} DPI</div>
                            <div className="text-[10px] opacity-75 mt-0.5">{d.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Physical Print Dimensions */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-700 block">
                      PRESET PHYSICAL PRINT SIZES:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {PRINT_SIZES.map((sz) => {
                        const isSelected =
                          options.targetWidthInches === sz.w && options.targetHeightInches === sz.h;
                        return (
                          <button
                            key={sz.label}
                            onClick={() =>
                              handleUpdate({
                                targetWidthInches: sz.w,
                                targetHeightInches: sz.h,
                              })
                            }
                            className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-xs">{sz.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">{sz.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Width / Height Inputs */}
                  <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                    <span className="font-mono text-xs font-black uppercase text-black block">
                      CUSTOM PRINT DIMENSIONS (INCHES)
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[11px] text-zinc-600 mb-1">WIDTH (INCHES)</label>
                        <input
                          type="number"
                          step="0.25"
                          min="1"
                          max="30"
                          value={options.targetWidthInches}
                          onChange={(e) => handleUpdate({ targetWidthInches: Math.max(1, parseFloat(e.target.value) || 1) })}
                          className="w-full p-2 border-2 border-black bg-white font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[11px] text-zinc-600 mb-1">HEIGHT (INCHES)</label>
                        <input
                          type="number"
                          step="0.25"
                          min="1"
                          max="40"
                          value={options.targetHeightInches}
                          onChange={(e) => handleUpdate({ targetHeightInches: Math.max(1, parseFloat(e.target.value) || 1) })}
                          className="w-full p-2 border-2 border-black bg-white font-mono text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: HIGH-RES EXPORT */}
              {activeTab === 'export' && (
                <div className="space-y-4 animate-fadeIn">
                  
                  <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                    <span className="font-mono text-xs font-black uppercase text-black block">
                      EXPORT PRESS-READY 300 DPI ARTIFACT
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleExportPNG}
                        disabled={isExporting}
                        className="p-4 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-left shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-sm uppercase">DOWNLOAD {options.dpi} DPI PNG</span>
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="text-[11px] opacity-80 leading-snug">
                          Embeds physical `pHYs` binary chunk ({Math.round(options.dpi * 39.3701)} ppm). Opened at exact physical dimensions in Photoshop & InDesign.
                        </div>
                      </button>

                      <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="p-4 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-left shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-sm uppercase">EXPORT SPECIMEN PDF</span>
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="text-[11px] opacity-80 leading-snug">
                          ISO Print Card with corner trim marks, registration targets, 10-step grayscale density strip, and technical metadata.
                        </div>
                      </button>
                    </div>

                    <div className="font-mono text-[11px] text-zinc-600 bg-white p-3 border border-black mt-2">
                      <strong>Physical Specification:</strong> {options.targetWidthInches}&quot; × {options.targetHeightInches}&quot; at {options.dpi} DPI produces a canvas of {widthPx} × {heightPx} px ({megapixels} Megapixels) in high-contrast Black &amp; White.
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000000] ${
                  showOriginal ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showOriginal ? 'Viewing Original Photo' : 'Compare Original'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPNG}
                  disabled={isExporting}
                  className="px-4 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Generating...' : `Export ${options.dpi} DPI PNG`}</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Live High-Resolution Viewport (5 cols) */}
          <div className="lg:col-span-5 bg-[#fafaf8] p-5 sm:p-7 flex flex-col justify-between items-center text-center space-y-5">
            
            {/* Viewport Header */}
            <div className="w-full flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black rotate-45 inline-block" />
                <span className="font-mono text-xs font-black uppercase text-black tracking-wider">
                  LIVE DPI SPECIMEN
                </span>
              </div>
              <span className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black">
                {options.dpi} DPI · {options.toneMode.toUpperCase()}
              </span>
            </div>

            {/* Canvas Viewport Display */}
            <div className="relative group p-4 border-2 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col items-center max-w-full overflow-hidden">
              <div className="absolute top-1 left-1 font-mono text-[9px] text-zinc-400 font-bold">┌ PRINT CROP MARKS</div>
              <div className="absolute bottom-1 right-1 font-mono text-[9px] text-zinc-400 font-bold">PRINT CROP MARKS ┘</div>

              <div className="p-2 transition-transform duration-200 group-hover:scale-[1.01] max-w-full max-h-[380px] overflow-hidden flex items-center justify-center">
                {showOriginal ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImageSource}
                    alt="Original"
                    className="max-h-[360px] max-w-full object-contain border border-zinc-300"
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="max-h-[360px] max-w-full object-contain border border-zinc-300 block"
                  />
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-2 inline-flex items-center gap-1.5 border border-black bg-[#ccff00] px-2.5 py-0.5 font-mono text-[10px] font-black text-black">
                <Sparkles className="w-3 h-3 text-black" />
                <span>{showOriginal ? 'ORIGINAL COLOR PREVIEW' : `CALIBRATED ${options.dpi} DPI B/W PREVIEW`}</span>
              </div>
            </div>

            {/* Specifications Readout Grid */}
            <div className="w-full grid grid-cols-3 gap-2 font-mono text-center">
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">PHYSICAL SIZE</div>
                <div className="text-xs font-black text-black mt-0.5">
                  {options.targetWidthInches}&quot; × {options.targetHeightInches}&quot;
                </div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">PIXEL MATRIX</div>
                <div className="text-xs font-black text-emerald-800 mt-0.5">
                  {widthPx}×{heightPx}px
                </div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">RESOLUTION</div>
                <div className="text-xs font-black text-black mt-0.5">
                  {options.dpi} DPI ({megapixels}MP)
                </div>
              </div>
            </div>

            {/* Direct Export Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full py-3 border-2 border-black bg-black text-white hover:bg-[#ccff00] hover:text-black font-mono text-xs font-black tracking-widest uppercase shadow-[4px_4px_0px_#000000] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'PROCESSING...' : `DOWNLOAD ${options.dpi} DPI MONOCHROME PNG`}</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="w-full py-2 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Download ISO Commercial Specimen PDF</span>
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#ccff00] text-black px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t-2 border-black bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-600">
          <div>
            PHOTO DPI MAKER // CALIBRATED PHYSICAL METADATA FOR COMMERCIAL PRINT
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-black hover:text-emerald-800 underline">
              genQRstudio (Home)
            </Link>
            <Link href="/nomral-dpi-photo" className="font-black text-black hover:text-emerald-800 underline">
              Photo DPI Maker
            </Link>
          </div>
        </div>
      </footer>

      {/* Universal Quota Exhaustion Modal */}
      <QuotaLimitModal />

    </div>
  );
}
