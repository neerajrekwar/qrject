'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Palette,
  Shapes,
  Image as ImageIcon,
  Printer,
  Download,
  AlertTriangle,
  ShieldCheck,
  UploadCloud,
  Trash2,
  FileCode,
  Scan,
} from 'lucide-react';
import {
  QROptions,
  DotShape,
  EyeFrameShape,
  EyeBallShape,
  ErrorCorrection,
  renderQRToCanvas,
  generateQRSVG,
  calculateContrastRatio,
  insertDpiIntoPngBlob,
} from '@/lib/qr-engine';
import { PRESET_LOGOS } from '@/lib/preset-logos';

interface QRStudioProps {
  options: QROptions;
  onOptionsChange: (newOptions: QROptions) => void;
}

const DOT_SHAPES: { id: DotShape; label: string; desc: string }[] = [
  { id: 'square', label: 'Classic Square', desc: 'Standard crisp geometric modules' },
  { id: 'dots', label: 'Circular Dots', desc: 'Modern soft rounded dots' },
  { id: 'rounded', label: 'Smooth Rounded', desc: 'Subtle corner radii' },
  { id: 'diamond', label: 'Diamond', desc: 'Rotated angular modules' },
  { id: 'classy', label: 'Classy Leaf', desc: 'Diagonal corner curvature' },
];

const EYE_FRAMES: { id: EyeFrameShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'squircle', label: 'Squircle' },
];

const EYE_BALLS: { id: EyeBallShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'diamond', label: 'Diamond' },
];

const COLOR_PRESETS = [
  { name: 'Ultra Contrast B&W', fg: '#000000', bg: '#ffffff', grad: false },
  { name: 'Cyber Blue', fg: '#0284c7', bg: '#ffffff', grad: true, gradEnd: '#4f46e5' },
  { name: 'Hot Magenta', fg: '#db2777', bg: '#ffffff', grad: true, gradEnd: '#9333ea' },
  { name: 'Dark Mode Invert', fg: '#38bdf8', bg: '#030712', grad: false },
  { name: 'Emerald Tech', fg: '#059669', bg: '#ffffff', grad: true, gradEnd: '#0284c7' },
  { name: 'Neon Purple', fg: '#9333ea', bg: '#030712', grad: false },
];

export function QRStudio({ options, onOptionsChange }: QRStudioProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'shapes' | 'colors' | 'logo' | 'print'>('content');
  const [copied, setCopied] = useState<string | null>(null);
  const [customLogoName, setCustomLogoName] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate contrast ratio between foreground and background
  const contrast = calculateContrastRatio(options.foregroundColor, options.backgroundColor);
  const isHighContrast = contrast >= 7.0;
  const isContrastWarning = contrast < 4.5;

  // Render on canvas whenever options change
  useEffect(() => {
    if (!canvasRef.current) return;
    renderQRToCanvas(canvasRef.current, {
      ...options,
      targetSizePx: 600,
    });
  }, [options]);

  const handleUpdate = (updates: Partial<QROptions>) => {
    onOptionsChange({
      ...options,
      ...updates,
    });
  };

  const handleApplyBW = () => {
    handleUpdate({
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      gradientEnabled: false,
      eyeOuterColor: '#000000',
      eyeInnerColor: '#000000',
    });
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomLogoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdate({
        logoUrl: dataUrl,
        errorCorrectionLevel: 'H', // Force High error correction when logo is uploaded
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCustomLogoName(null);
    handleUpdate({
      logoUrl: null,
      errorCorrectionLevel: 'M',
    });
  };

  const handleDownloadPNG = async (dpi: 72 | 300 | 600 = 300) => {
    setIsExporting(true);
    try {
      const targetPx = dpi === 72 ? 800 : dpi === 300 ? 2400 : 4800;
      const exportCanvas = document.createElement('canvas');

      await renderQRToCanvas(exportCanvas, {
        ...options,
        targetSizePx: targetPx,
      });

      exportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const dpiBlob = await insertDpiIntoPngBlob(blob, dpi);
        const url = URL.createObjectURL(dpiBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QRCode-${dpi}DPI-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const handleDownloadSVG = () => {
    const svgString = generateQRSVG(options);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QRCode-Vector-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySVG = () => {
    const svgString = generateQRSVG(options);
    navigator.clipboard.writeText(svgString);
    setCopied('svg');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Controls & Tabs (7 cols) */}
      <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto">
          {[
            { id: 'content', label: 'Content', icon: Scan },
            { id: 'shapes', label: 'Shapes', icon: Shapes },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'logo', label: 'Logo', icon: ImageIcon },
            { id: 'print', label: '300 DPI Export', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: CONTENT & SCANNER COMPATIBILITY */}
        {activeTab === 'content' && (
          <div className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                QR Payload Content (URL, Text, VCARD, or Token)
              </label>
              <textarea
                value={options.text}
                onChange={(e) => handleUpdate({ text: e.target.value })}
                rows={3}
                placeholder="https://example.com or any text..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
              />
            </div>

            {/* Contrast Meter & Scanner Shield */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isContrastWarning
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isContrastWarning ? (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Scanner Contrast Ratio:</span>
                      <span className="font-mono text-cyan-400 font-bold">
                        {contrast.toFixed(1)}:1
                      </span>
                      {isHighContrast && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          GRADE AAA
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isContrastWarning
                        ? 'Low contrast detected. Standard optical scanners & phone cameras may fail in dim lighting.'
                        : 'Optimal contrast meets ISO/IEC 18004 scanner specifications.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyBW}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow transition-colors whitespace-nowrap"
                >
                  Force Pure B&W
                </button>
              </div>
            </div>

            {/* Error Correction Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Reed-Solomon Error Correction Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { level: 'L', name: 'Low (7%)', desc: 'Simplest matrix' },
                  { level: 'M', name: 'Medium (15%)', desc: 'Standard usage' },
                  { level: 'Q', name: 'Quartile (25%)', desc: 'High durability' },
                  { level: 'H', name: 'High (30%)', desc: 'Required for logos' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => handleUpdate({ errorCorrectionLevel: item.level as ErrorCorrection })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      options.errorCorrectionLevel === item.level
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHAPES CUSTOMIZATION */}
        {activeTab === 'shapes' && (
          <div className="mt-6 space-y-6">
            {/* Module Dot Shape */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Data Module Shape
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DOT_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleUpdate({ dotShape: shape.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      options.dotShape === shape.id
                        ? 'bg-blue-600/20 border-cyan-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-200">{shape.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{shape.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Eye Frame Shape */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Finder Pattern (Eye) Outer Frame Shape
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EYE_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => handleUpdate({ eyeFrameShape: frame.id })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      options.eyeFrameShape === frame.id
                        ? 'bg-indigo-600/20 border-indigo-400 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {frame.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eye Ball Shape */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Finder Pattern (Eye) Inner Pupil Shape
              </label>
              <div className="grid grid-cols-4 gap-2">
                {EYE_BALLS.map((ball) => (
                  <button
                    key={ball.id}
                    onClick={() => handleUpdate({ eyeBallShape: ball.id })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                      options.eyeBallShape === ball.id
                        ? 'bg-pink-600/20 border-pink-400 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {ball.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COLORS */}
        {activeTab === 'colors' && (
          <div className="mt-6 space-y-6">
            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Curated High-Contrast Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() =>
                      handleUpdate({
                        foregroundColor: p.fg,
                        backgroundColor: p.bg,
                        gradientEnabled: p.grad,
                        gradientEndColor: p.gradEnd,
                        eyeOuterColor: p.fg,
                        eyeInnerColor: p.fg,
                      })
                    }
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 text-left transition-all flex items-center gap-2.5"
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-slate-700 shrink-0 shadow"
                      style={{
                        background: p.grad
                          ? `linear-gradient(135deg, ${p.fg}, ${p.gradEnd})`
                          : p.fg,
                      }}
                    />
                    <div className="text-xs font-medium text-slate-200 truncate">{p.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Hex Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Foreground / Modules Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={options.foregroundColor}
                    onChange={(e) => handleUpdate({ foregroundColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={options.foregroundColor}
                    onChange={(e) => handleUpdate({ foregroundColor: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Background Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={options.backgroundColor}
                    onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={options.backgroundColor}
                    onChange={(e) => handleUpdate({ backgroundColor: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Linear Gradient Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Linear Color Gradient</div>
                  <div className="text-[10px] text-slate-400">
                    Blends from primary foreground to secondary gradient color
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={options.gradientEnabled}
                  onChange={(e) => handleUpdate({ gradientEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>

              {options.gradientEnabled && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80">
                  <input
                    type="color"
                    value={options.gradientEndColor || '#ec4899'}
                    onChange={(e) => handleUpdate({ gradientEndColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    End Color: {options.gradientEndColor || '#ec4899'}
                  </span>
                </div>
              )}
            </div>

            {/* Custom Eye Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Eye Outer Frame Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={options.eyeOuterColor || options.foregroundColor}
                    onChange={(e) => handleUpdate({ eyeOuterColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={options.eyeOuterColor || options.foregroundColor}
                    onChange={(e) => handleUpdate({ eyeOuterColor: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="block text-xs text-slate-400 mb-2 font-medium">
                  Eye Inner Pupil Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={options.eyeInnerColor || options.foregroundColor}
                    onChange={(e) => handleUpdate({ eyeInnerColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={options.eyeInnerColor || options.foregroundColor}
                    onChange={(e) => handleUpdate({ eyeInnerColor: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LOGO CUSTOMIZATION */}
        {activeTab === 'logo' && (
          <div className="mt-6 space-y-5">
            {/* Preset Logo Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Choose Built-in Tech & Summit Logos
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRESET_LOGOS.map((logo) => (
                  <button
                    key={logo.id}
                    onClick={() =>
                      handleUpdate({
                        logoUrl: logo.dataUrl,
                        errorCorrectionLevel: 'H',
                      })
                    }
                    className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                      options.logoUrl === logo.dataUrl
                        ? 'bg-blue-600/20 border-cyan-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-900 p-0.5 border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.dataUrl} alt={logo.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-white">{logo.name}</div>
                      <div className="text-[10px] text-slate-400">{logo.category}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Upload */}
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center">
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-200">
                Upload Custom Logo Image
              </div>
              <div className="text-[10px] text-slate-400 mb-3">
                PNG, SVG, or JPEG with clean background recommended
              </div>
              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer transition-colors">
                <span>Select File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
              {customLogoName && (
                <div className="mt-2 text-[11px] text-cyan-300 font-mono">
                  Loaded: {customLogoName}
                </div>
              )}
            </div>

            {/* Logo Controls (Sliders) */}
            {options.logoUrl && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">Logo Fine-Tuning</span>
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Relative Size</span>
                    <span className="font-mono">{Math.round((options.logoSize || 0.22) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.15"
                    max="0.32"
                    step="0.01"
                    value={options.logoSize || 0.22}
                    onChange={(e) => handleUpdate({ logoSize: parseFloat(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Padding (Safe Cutout Area)</span>
                    <span className="font-mono">{options.logoPadding || 8}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={options.logoPadding || 8}
                    onChange={(e) => handleUpdate({ logoPadding: parseInt(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Cutout Badge Shape</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['circle', 'rounded', 'square'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleUpdate({ logoShape: s })}
                        className={`py-1.5 px-3 rounded-lg border text-xs capitalize ${
                          options.logoShape === s
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: 300 DPI PRINT LAB */}
        {activeTab === 'print' && (
          <div className="mt-6 space-y-5">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5 text-cyan-400 mb-1">
                <Printer className="w-5 h-5" />
                <span className="text-sm font-bold text-white">
                  300 DPI High-Quality Printing Specifications
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard screens display at 72 DPI, causing pixelation when printed on paper, badges, or signage. Our generator embeds physical resolution chunks (pHYs) and renders at 2400px–4800px so your print vendor or office printer produces razor-sharp optical edges.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="font-mono text-slate-500 uppercase text-[10px]">Screen Preview</div>
                <div className="text-lg font-bold text-white mt-1">72 DPI</div>
                <div className="text-[11px] text-slate-400">800 × 800 px</div>
                <div className="text-[10px] text-slate-500 mt-1">Web & Digital Media</div>
                <button
                  onClick={() => handleDownloadPNG(72)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  Export 72 DPI
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/50 text-center relative overflow-hidden shadow-lg shadow-blue-500/10">
                <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-cyan-300">
                  RECOMMENDED
                </div>
                <div className="font-mono text-cyan-400 uppercase text-[10px]">Print HD</div>
                <div className="text-lg font-bold text-white mt-1">300 DPI</div>
                <div className="text-[11px] text-slate-300">2,400 × 2,400 px</div>
                <div className="text-[10px] text-slate-400 mt-1">8.00″ × 8.00″ (20.3 cm)</div>
                <button
                  onClick={() => handleDownloadPNG(300)}
                  disabled={isExporting}
                  className="mt-3 w-full py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-lg shadow transition-all"
                >
                  {isExporting ? 'Embedding pHYs...' : 'Export 300 DPI PNG'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="font-mono text-purple-400 uppercase text-[10px]">Ultra Poster</div>
                <div className="text-lg font-bold text-white mt-1">600 DPI</div>
                <div className="text-[11px] text-slate-400">4,800 × 4,800 px</div>
                <div className="text-[10px] text-slate-500 mt-1">Billboard & Exhibition</div>
                <button
                  onClick={() => handleDownloadPNG(600)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors"
                >
                  Export 600 DPI
                </button>
              </div>
            </div>

            {/* Vector SVG Export */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Scalable Vector Graphics (SVG)</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Mathematical paths with infinite resolution. Ideal for Adobe Illustrator, Figma, & vinyl cutters.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySVG}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  {copied === 'svg' ? 'Copied' : 'Copy SVG'}
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
                >
                  Download SVG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Live Interactive QR Preview (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Live Render Output
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              EC Level: {options.errorCorrectionLevel || 'M'}
            </span>
          </div>

          {/* QR Canvas Display */}
          <div
            className="p-4 rounded-2xl shadow-2xl border border-slate-700/50 transition-transform duration-300 hover:scale-[1.02]"
            style={{ backgroundColor: options.backgroundColor }}
          >
            <canvas
              ref={canvasRef}
              className="w-64 h-64 sm:w-72 sm:h-72 block rounded-xl"
            />
          </div>

          {/* Quick Metrics */}
          <div className="w-full mt-5 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Optical Contrast</span>
              <div className="text-sm font-bold text-white mt-0.5">{contrast.toFixed(1)}:1</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Module Style</span>
              <div className="text-sm font-bold text-cyan-400 capitalize mt-0.5">
                {options.dotShape}
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="w-full mt-4 space-y-2">
            <button
              onClick={() => handleDownloadPNG(300)}
              disabled={isExporting}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-90 text-white font-semibold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating High-Res Blob...' : 'Download 300 DPI PNG'}</span>
            </button>
            <button
              onClick={handleDownloadSVG}
              className="w-full py-2 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs rounded-xl border border-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Download Vector SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
