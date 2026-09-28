'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
  ShieldCheck,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Tag,
  Printer,
  QrCode,
  Layers,
  Barcode as BarcodeIcon,
} from 'lucide-react';
import {
  BarcodeFormat,
  BarcodeOptions,
  BARCODE_CATALOG,
  DEFAULT_BARCODE_OPTIONS,
  renderBarcodeToCanvas,
  generateBarcodeSVG,
  exportBarcodePNG,
  exportBarcodePDF,
  sanitizeBarcodePayload,
} from '@/lib/barcode-engine';
import { UsageBanner } from '@/components/auth/UsageBanner';
import { useSession } from 'next-auth/react';
import { consumeToolQuota } from '@/lib/usage-limits';
import { QuotaLimitModal } from '@/components/auth/QuotaLimitModal';

const QUICK_PRESETS: { label: string; format: BarcodeFormat; payload: string; desc: string }[] = [
  {
    label: 'Amazon FNSKU',
    format: 'CODE128',
    payload: 'X003B4N9Z1',
    desc: 'Fulfillment warehouse tracking unit',
  },
  {
    label: 'Global ISBN-13',
    format: 'EAN13',
    payload: '9780132350884',
    desc: 'Commercial book & literature standard',
  },
  {
    label: 'US Grocery UPC-A',
    format: 'UPC',
    payload: '012345678905',
    desc: 'Point-of-Sale North American retail',
  },
  {
    label: 'Master Carton Freight',
    format: 'ITF14',
    payload: '10012345678902',
    desc: 'Corrugated master packaging bearer bars',
  },
  {
    label: 'Defense Asset Tag',
    format: 'CODE39',
    payload: 'ASSET-8849',
    desc: 'Alphanumeric physical equipment inventory',
  },
  {
    label: 'Clinical Prescription',
    format: 'pharmacode',
    payload: '49201',
    desc: 'Pharmaceutical packaging packaging control',
  },
];

export default function BarcodePickPage() {
  const { data: session } = useSession();
  const [options, setOptions] = useState<BarcodeOptions>(DEFAULT_BARCODE_OPTIONS);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Logistics' | 'Retail' | 'Industrial' | 'Specialty'>('All');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeDef = BARCODE_CATALOG.find((b) => b.format === options.format) || BARCODE_CATALOG[0];

  const verifyQuota = async () => {
    const isLogged = Boolean(session?.user);
    const plan = ((session?.user as any)?.plan || 'free') as 'free' | 'pro';
    const res = await consumeToolQuota('barcode_pick', isLogged, plan);
    return res.allowed;
  };

  // Render barcode whenever options change
  useEffect(() => {
    if (!canvasRef.current) return;
    const result = renderBarcodeToCanvas(canvasRef.current, options);
    if (!result.success) {
      setRenderError(result.error || 'Syntax error for chosen format');
    } else {
      setRenderError(null);
    }
  }, [options]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdate = (updates: Partial<BarcodeOptions>) => {
    setOptions((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  const handleSelectFormat = (format: BarcodeFormat) => {
    const def = BARCODE_CATALOG.find((b) => b.format === format);
    handleUpdate({
      format,
      payload: def ? def.defaultPayload : '12345678',
    });
    showToast(`Switched symbology to ${def ? def.name : format}`);
  };

  const handleLoadPreset = (preset: typeof QUICK_PRESETS[0]) => {
    handleUpdate({
      format: preset.format,
      payload: preset.payload,
    });
    showToast(`Loaded preset: ${preset.label}`);
  };

  const handleAutoFixPayload = () => {
    const sanitized = sanitizeBarcodePayload(options.format, options.payload);
    handleUpdate({ payload: sanitized });
    showToast(`Auto-formatted payload to valid ${options.format} standard`);
  };

  const handleDownloadPNG = async () => {
    const allowed = await verifyQuota();
    if (!allowed) return;

    setIsExporting(true);
    try {
      const result = await exportBarcodePNG(options, 2);
      const a = document.createElement('a');
      a.href = result.dataUrl;
      a.download = result.filename;
      a.click();
      showToast(`Downloaded ${options.dpi} DPI Barcode PNG`);
    } catch (err) {
      console.error(err);
      showToast('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSVG = async () => {
    const allowed = await verifyQuota();
    if (!allowed) return;

    const svgStr = generateBarcodeSVG(options);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Barcode-${options.format}-${options.payload}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded Vector SVG Barcode');
  };

  const handleDownloadPDF = async () => {
    const allowed = await verifyQuota();
    if (!allowed) return;

    setIsExporting(true);
    try {
      const result = await exportBarcodePDF(options);
      const a = document.createElement('a');
      a.href = result.dataUrl;
      a.download = result.filename;
      a.click();
      showToast('Downloaded ISO Print Label PDF');
    } catch (err) {
      console.error(err);
      showToast('PDF Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopySVG = () => {
    const svgStr = generateBarcodeSVG(options);
    navigator.clipboard.writeText(svgStr);
    setCopied('svg');
    showToast('Copied Vector SVG markup');
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredCatalog =
    categoryFilter === 'All'
      ? BARCODE_CATALOG
      : BARCODE_CATALOG.filter((b) => b.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black flex flex-col">
      
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 w-full bg-[#f5f5f0] border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-12 h-12 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] transition-colors"
              title="Return to Home"
            >
              <BarcodeIcon className="w-6 h-6 text-black" />
            </Link>
            <div>
              <div className="font-mono text-xs font-black tracking-widest text-black flex items-center gap-1.5">
                <span>BARCODE PICK & STUDIO</span>
                <span className="w-1.5 h-1.5 bg-[#ccff00] border border-black inline-block" />
              </div>
              <div className="font-mono text-[10px] text-zinc-600 tracking-wider">
                INDUSTRIAL LINEAR & 2D BARCODE GENERATOR
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span className="border-2 border-black bg-[#ccff00] text-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                {options.format}
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                {options.dpi} DPI PRINT
              </span>
            </div>

            <Link
              href="/nomral-dpi-photo"
              className="hidden md:flex items-center gap-1.5 border-2 border-black bg-white hover:bg-zinc-100 px-3 py-2 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PHOTO DPI MAKER</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 border-2 border-black bg-white hover:bg-black hover:text-white px-3.5 py-2 font-mono text-xs font-black shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>QR STUDIO</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* QUOTA & FEATURE FLAG MONETIZATION BANNER */}
        <UsageBanner />

        {/* Dossier Banner */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
              {'// ENGINE: INDUSTRIAL-GRADE LINEAR BARCODE PICKER & VERIFIER'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-black">
                BARCODE PICK
              </h1>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800">
                STUDIO & VERIFIER
              </h2>
            </div>

            <p className="font-mono text-xs sm:text-sm text-zinc-700 max-w-xl leading-relaxed">
              Industrial linear barcode generator for logistics, retail point-of-sale, pharmaceuticals, and asset management. Supports <strong>Code 128, EAN-13, UPC-A, ITF-14, Code 39, Pharmacode</strong> with auto-calculated check digits and calibrated 300 DPI exports.
            </p>
          </div>
        </div>

        {/* Master Workspace Grid */}
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_#000000] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Symbology Picker & Parameters (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-7 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between space-y-6 bg-white">
            
            <div className="space-y-6">
              
              {/* Category Filter Filter Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>SELECT BARCODE SYMBOLOGY</span>
                  </span>
                  <span className="font-mono text-[10px] bg-black text-[#ccff00] px-1.5 py-0.5 font-bold">
                    {filteredCatalog.length} FORMATS
                  </span>
                </div>

                <div className="flex items-center gap-1.5 border-2 border-black bg-[#fafaf8] p-1.5 shadow-[2px_2px_0px_#000000] overflow-x-auto">
                  {(['All', 'Logistics', 'Retail', 'Industrial', 'Specialty'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 font-mono text-xs font-black transition-all cursor-pointer ${
                        categoryFilter === cat
                          ? 'bg-black text-[#ccff00] shadow-[1.5px_1.5px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode Catalog Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto p-1 border-2 border-black bg-[#fafaf8]">
                {filteredCatalog.map((item) => {
                  const isSelected = options.format === item.format;
                  return (
                    <button
                      key={item.format}
                      onClick={() => handleSelectFormat(item.format)}
                      className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                          : 'bg-white text-black hover:bg-zinc-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs uppercase">{item.name}</span>
                        <span
                          className={`text-[9px] px-1 font-bold ${
                            isSelected ? 'bg-[#ccff00] text-black' : 'bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] opacity-75 mt-0.5 line-clamp-2 leading-tight">
                        {item.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Payload Data Input Card */}
              <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>BARCODE DATA PAYLOAD</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-[10px] text-zinc-500">
                      Standard: <strong>{activeDef.standard}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={options.payload}
                    onChange={(e) => handleUpdate({ payload: e.target.value })}
                    placeholder={activeDef.placeholder}
                    className="flex-1 p-2.5 border-2 border-black bg-white font-mono text-xs font-bold text-black focus:outline-none focus:shadow-[2px_2px_0px_#000000]"
                  />

                  <button
                    onClick={handleAutoFixPayload}
                    className="px-3 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer whitespace-nowrap shadow-[2px_2px_0px_#000000]"
                  >
                    Auto-Format / Checksum
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-600">
                  <span>
                    Accepted: <strong>{activeDef.allowedChars}</strong>
                  </span>
                  {activeDef.maxLen && (
                    <span>
                      Length: {options.payload.length}/{activeDef.maxLen}
                    </span>
                  )}
                </div>

                {/* Error Banner */}
                {renderError && (
                  <div className="p-2 border border-black bg-rose-100 text-rose-800 font-mono text-xs font-bold flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{renderError}</span>
                    </div>
                    <button
                      onClick={handleAutoFixPayload}
                      className="px-2 py-0.5 border border-black bg-white text-black text-[10px] uppercase font-black hover:bg-black hover:text-white"
                    >
                      Fix Now
                    </button>
                  </div>
                )}

                {/* Quick Industry Presets */}
                <div className="pt-2 border-t border-zinc-200">
                  <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                    RAPID COMMERCIAL PRESETS:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleLoadPreset(preset)}
                        className={`p-1.5 border border-black font-mono text-[10px] font-bold text-left transition-colors cursor-pointer ${
                          options.format === preset.format && options.payload === preset.payload
                            ? 'bg-black text-[#ccff00]'
                            : 'bg-white hover:bg-zinc-100 text-black'
                        }`}
                      >
                        <div className="font-black truncate">{preset.label}</div>
                        <div className="text-[9px] opacity-70 truncate">{preset.payload}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Geometry & Typography Fine-Tuning */}
              <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-4 shadow-[3px_3px_0px_#000000]">
                <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                  <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>OPTICAL DIMENSIONS & LABELS</span>
                  </span>
                  <button
                    onClick={() =>
                      handleUpdate({
                        width: 2,
                        height: 90,
                        margin: 15,
                        displayValue: true,
                        fontSize: 16,
                      })
                    }
                    className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black hover:bg-black hover:text-[#ccff00] transition-colors cursor-pointer"
                  >
                    Reset Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bar Width */}
                  <div>
                    <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                      <span>BAR DENSITY</span>
                      <span>{options.width}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.5"
                      value={options.width}
                      onChange={(e) => handleUpdate({ width: parseFloat(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>

                  {/* Bar Height */}
                  <div>
                    <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                      <span>BAR HEIGHT</span>
                      <span>{options.height}px</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="180"
                      step="5"
                      value={options.height}
                      onChange={(e) => handleUpdate({ height: parseInt(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>

                  {/* Quiet Zone Margin */}
                  <div>
                    <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                      <span>QUIET MARGIN</span>
                      <span>{options.margin}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="2"
                      value={options.margin}
                      onChange={(e) => handleUpdate({ margin: parseInt(e.target.value) })}
                      className="w-full accent-black cursor-pointer"
                    />
                  </div>
                </div>

                {/* Typography Controls */}
                <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate({ displayValue: !options.displayValue })}
                      className={`px-2.5 py-1 border border-black font-bold cursor-pointer ${
                        options.displayValue ? 'bg-black text-[#ccff00]' : 'bg-white text-black'
                      }`}
                    >
                      Human Text: {options.displayValue ? 'ON' : 'OFF'}
                    </button>

                    {options.displayValue && (
                      <button
                        onClick={() =>
                          handleUpdate({
                            textPosition: options.textPosition === 'bottom' ? 'top' : 'bottom',
                          })
                        }
                        className="px-2.5 py-1 border border-black bg-white hover:bg-zinc-100 font-bold uppercase cursor-pointer"
                      >
                        Pos: {options.textPosition}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px]">DPI:</span>
                    {([300, 600, 150] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => handleUpdate({ dpi: d })}
                        className={`px-2 py-0.5 border border-black text-[10px] font-bold cursor-pointer ${
                          options.dpi === d ? 'bg-black text-[#ccff00]' : 'bg-white text-black'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="pt-4 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleUpdate({
                      background: '#ffffff',
                      lineColor: '#000000',
                    })
                  }
                  className="px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enforce Pure 21:1 B/W</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <Link
                  href="/"
                  className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Studio</span>
                </Link>
                <Link
                  href="/nomral-dpi-photo"
                  className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Photo DPI Maker</span>
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Live Barcode Viewport & Exporter (5 cols) */}
          <div className="lg:col-span-5 bg-[#fafaf8] p-5 sm:p-7 flex flex-col justify-between items-center text-center space-y-5">
            
            {/* Viewport Header */}
            <div className="w-full flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black rotate-45 inline-block" />
                <span className="font-mono text-xs font-black uppercase text-black tracking-wider">
                  LIVE BARCODE SPECIMEN
                </span>
              </div>
              <span className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black">
                {options.format} · 300 DPI
              </span>
            </div>

            {/* Central Barcode Canvas Viewport */}
            <div className="relative group p-6 border-2 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col items-center justify-center w-full min-h-[220px] overflow-hidden">
              <div className="absolute top-1 left-1 font-mono text-[9px] text-zinc-400 font-bold">┌ QUIET MARGIN</div>
              <div className="absolute bottom-1 right-1 font-mono text-[9px] text-zinc-400 font-bold">QUIET MARGIN ┘</div>

              <div className="p-3 transition-transform duration-200 group-hover:scale-[1.01] max-w-full overflow-x-auto flex items-center justify-center">
                <canvas ref={canvasRef} className="block max-w-full" />
              </div>

              {/* Scannability Readout Badge */}
              <div className="mt-3">
                {!renderError ? (
                  <div className="inline-flex items-center gap-1.5 border border-black bg-[#ccff00] px-3 py-1 font-mono text-[10px] font-black text-black shadow-[2px_2px_0px_#000000]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>OPTICALLY VERIFIED (ISO {activeDef.standard})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 border border-black bg-rose-200 px-3 py-1 font-mono text-[10px] font-black text-rose-900 shadow-[2px_2px_0px_#000000]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>PAYLOAD REJECTED BY SYMBOLOGY</span>
                  </div>
                )}
              </div>
            </div>

            {/* Symbology Metadata Specs */}
            <div className="w-full grid grid-cols-3 gap-2 font-mono text-center">
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">STANDARD</div>
                <div className="text-xs font-black text-black mt-0.5 truncate">{activeDef.standard}</div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">CATEGORY</div>
                <div className="text-xs font-black text-emerald-800 mt-0.5 truncate uppercase">{activeDef.category}</div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">PRINT DPI</div>
                <div className="text-xs font-black text-black mt-0.5">{options.dpi} DPI</div>
              </div>
            </div>

            {/* Direct Multi-Format Export Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={handleDownloadPNG}
                disabled={isExporting || Boolean(renderError)}
                className="w-full py-3 border-2 border-black bg-black text-white hover:bg-[#ccff00] hover:text-black font-mono text-xs font-black tracking-widest uppercase shadow-[4px_4px_0px_#000000] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'EXPORTING...' : `DOWNLOAD ${options.format} (${options.dpi} DPI PNG)`}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  onClick={handleDownloadSVG}
                  disabled={Boolean(renderError)}
                  className="py-2 border-2 border-black bg-white hover:bg-zinc-100 font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Vector SVG</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting || Boolean(renderError)}
                  className="py-2 border-2 border-black bg-white hover:bg-zinc-100 font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000000] disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Label PDF</span>
                </button>
              </div>

              <button
                onClick={handleCopySVG}
                disabled={Boolean(renderError)}
                className="w-full py-1.5 border border-black bg-white hover:bg-[#ccff00] font-mono text-[11px] font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {copied === 'svg' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'svg' ? 'Copied Vector SVG!' : 'Copy Vector SVG Markup'}</span>
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
            BARCODE PICK // PROPERLY FUNCTIONAL LINEAR & INDUSTRIAL BARCODE SUITE
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-black hover:text-emerald-800 underline">
              genQRstudio (Home)
            </Link>
            <Link href="/nomral-dpi-photo" className="font-black text-black hover:text-emerald-800 underline">
              Photo DPI Maker
            </Link>
            <Link href="/barcode-pick" className="font-black text-black hover:text-emerald-800 underline">
              Barcode Pick
            </Link>
          </div>
        </div>
      </footer>

      {/* Universal Quota Exhaustion Modal */}
      <QuotaLimitModal />

    </div>
  );
}
