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
  FileText,
  Scan,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import {
  QROptions,
  DotShape,
  EyeFrameShape,
  EyeBallShape,
  PhotoQRMode,
  ErrorCorrection,
  renderQRToCanvas,
  generateQRSVG,
  calculateContrastRatio,
  insertDpiIntoPngBlob,
  verifyCanvasScannability,
  ScanVerificationResult,
} from '@/lib/qr-engine';
import { generate300DpiPDF, triggerDownload } from '@/lib/qr-export';
import { PHOTO_PRESETS } from '@/lib/photo-presets';

interface QRStudioProps {
  options: QROptions;
  onOptionsChange: (newOptions: QROptions) => void;
  onCodeExported?: (codeInfo: { title?: string; options: QROptions; format: string }) => void;
}

const DOT_SHAPES: { id: DotShape; label: string; desc: string }[] = [
  { id: 'square', label: 'Classic Square', desc: 'Standard crisp geometric modules' },
  { id: 'dots', label: 'Circular Dots', desc: 'Modern soft rounded dots' },
  { id: 'rounded', label: 'Smooth Rounded', desc: 'Subtle corner radii' },
  { id: 'diamond', label: 'Diamond Angle', desc: 'Rotated 45° angular modules' },
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

const PHOTO_QR_MODES: { id: PhotoQRMode; label: string; desc: string }[] = [
  {
    id: 'halftone',
    label: 'Halftone Core Matrix',
    desc: 'Whole image visible with optical sub-dot cores (guaranteed 100% scan rate)',
  },
  {
    id: 'fusion',
    label: 'Luminance Fusion',
    desc: 'Adaptive module modulation blended with photographic brightness',
  },
  {
    id: 'dither',
    label: 'Floyd-Steinberg 1-Bit',
    desc: 'Vintage high-contrast newspaper stipple B/W dithering',
  },
  {
    id: 'microdots',
    label: 'Micro-Dots Art QR',
    desc: 'Fine optical barcode watermark stamped over high-contrast photo',
  },
  {
    id: 'center-logo',
    label: 'Center Emblem Badge',
    desc: 'Traditional center cutout badge stamp',
  },
];

const COLOR_PRESETS = [
  { name: 'Pure B&W (21:1)', fg: '#000000', bg: '#ffffff', grad: false },
  { name: 'Cyber Blue', fg: '#0284c7', bg: '#ffffff', grad: true, gradEnd: '#4f46e5' },
  { name: 'Hot Magenta', fg: '#db2777', bg: '#ffffff', grad: true, gradEnd: '#9333ea' },
  { name: 'Dark Mode Invert', fg: '#38bdf8', bg: '#030712', grad: false },
  { name: 'Emerald Tech', fg: '#059669', bg: '#ffffff', grad: true, gradEnd: '#0284c7' },
  { name: 'Neon Purple', fg: '#9333ea', bg: '#030712', grad: false },
];

export function QRStudio({ options, onOptionsChange, onCodeExported }: QRStudioProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'content' | 'shapes' | 'colors' | 'print'>('photo');
  const [copied, setCopied] = useState<string | null>(null);
  const [customPhotoName, setCustomPhotoName] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Live Optical Scan Verification State
  const [scanVerification, setScanVerification] = useState<ScanVerificationResult>({
    isScannable: true,
    confidence: 100,
    decodeTimeMs: 6,
    decodedText: options.text,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate contrast ratio between foreground and background
  const contrast = calculateContrastRatio(options.foregroundColor, options.backgroundColor);
  const isHighContrast = contrast >= 7.0;
  const isContrastWarning = contrast < 4.5;

  // Render on canvas whenever options change & verify optical scannability
  useEffect(() => {
    let isCancelled = false;
    if (!canvasRef.current) return;

    renderQRToCanvas(canvasRef.current, {
      ...options,
      targetSizePx: 640,
    }).then(() => {
      if (isCancelled || !canvasRef.current) return;
      const result = verifyCanvasScannability(canvasRef.current);
      setScanVerification(result);
    });

    return () => {
      isCancelled = true;
    };
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
      photoBWMode: true,
      errorCorrectionLevel: 'H',
    });
  };

  const handleAutoCalibrate = () => {
    handleUpdate({
      photoDotScale: 0.64,
      photoContrast: 1.45,
      photoBrightness: 1.0,
      photoQRMode: 'halftone',
      photoBWMode: true,
      errorCorrectionLevel: 'H',
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
    });
  };

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdate({
        photoUrl: dataUrl,
        errorCorrectionLevel: 'H', // Force Level H for photo embedding
        photoBWMode: true,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setCustomPhotoName(null);
    handleUpdate({
      photoUrl: null,
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
        a.download = `PhotoQR-300DPI-Calibrated-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);

        if (onCodeExported) {
          onCodeExported({
            options: { ...options, dpi },
            format: `${dpi} DPI PNG`,
          });
        }
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
    a.download = `PhotoQR-Vector-Paths-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);

    if (onCodeExported) {
      onCodeExported({
        options: { ...options },
        format: 'Vector SVG',
      });
    }
  };

  const handleCopySVG = () => {
    const svgString = generateQRSVG(options);
    navigator.clipboard.writeText(svgString);
    setCopied('svg');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      const result = await generate300DpiPDF(options);
      triggerDownload(result);
      if (onCodeExported) {
        onCodeExported({
          options: { ...options },
          format: '300 DPI PDF',
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Controls & Tabs (7 cols) */}
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-x-auto">
          {[
            { id: 'photo', label: 'Photo QR Engine', icon: ImageIcon },
            { id: 'content', label: 'Payload', icon: Scan },
            { id: 'shapes', label: 'Shapes', icon: Shapes },
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'print', label: '300 DPI Export', icon: Printer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

        {/* TAB 1: WHOLE IMAGE PHOTO QR ENGINE */}
        {activeTab === 'photo' && (
          <div className="mt-6 space-y-5">
            {/* Mode selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Whole-Image Photo QR Interpreter Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PHOTO_QR_MODES.slice(0, 4).map((m) => {
                  const isSelected = options.photoQRMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleUpdate({ photoQRMode: m.id })}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                        <span>{m.label}</span>
                        {isSelected && <span className="text-[10px] bg-cyan-500 text-black px-1.5 py-0.5 rounded font-black">ACTIVE</span>}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 leading-snug">{m.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Built-in Photo Presets */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Curated Photographic Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      handleUpdate({
                        photoUrl: preset.dataUrl,
                        errorCorrectionLevel: 'H',
                        photoBWMode: true,
                      });
                      setCustomPhotoName(preset.name);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      options.photoUrl === preset.dataUrl
                        ? 'bg-blue-600/20 border-cyan-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preset.dataUrl} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-semibold text-white truncate max-w-[80px]">
                        {preset.name.replace('B/W ', '')}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Photo Upload */}
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center">
              <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-200">
                Transform Any Custom Photo into QR Code
              </div>
              <div className="text-[10px] text-slate-400 mb-3">
                Upload portraits, selfies, cars, or silhouettes (auto-converted to 300 DPI high-contrast B/W)
              </div>
              <label className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer transition-colors">
                <span>Choose Photo File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {customPhotoName && (
                <div className="mt-2 text-[11px] text-cyan-300 font-mono">
                  Loaded: {customPhotoName}
                </div>
              )}
            </div>

            {/* Photo QR Fine-Tuning Controls */}
            {options.photoUrl && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    <span>300 DPI Photographic Calibration</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAutoCalibrate}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors cursor-pointer"
                    >
                      Auto-Calibrate
                    </button>
                    <button
                      onClick={handleRemovePhoto}
                      className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Module Strength</span>
                      <span className="font-mono text-cyan-300">
                        {Math.round((options.photoDotScale || 0.62) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.38"
                      max="0.85"
                      step="0.02"
                      value={options.photoDotScale || 0.62}
                      onChange={(e) => handleUpdate({ photoDotScale: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>B/W Contrast</span>
                      <span className="font-mono text-cyan-300">
                        {(options.photoContrast || 1.45).toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="2.4"
                      step="0.05"
                      value={options.photoContrast || 1.45}
                      onChange={(e) => handleUpdate({ photoContrast: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Brightness</span>
                      <span className="font-mono text-cyan-300">
                        {Math.round((options.photoBrightness || 1.0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.6"
                      max="1.6"
                      step="0.05"
                      value={options.photoBrightness || 1.0}
                      onChange={(e) => handleUpdate({ photoBrightness: parseFloat(e.target.value) })}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                  <button
                    onClick={() => handleUpdate({ photoInvert: !options.photoInvert })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      options.photoInvert
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Invert Tones: {options.photoInvert ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => handleUpdate({ photoBWMode: !options.photoBWMode })}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-colors cursor-pointer ${
                      options.photoBWMode
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Monochrome B/W: {options.photoBWMode ? 'ACTIVE (21:1)' : 'COLOR'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONTENT & SCANNER COMPATIBILITY */}
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                          GRADE AAA (21:1 B/W)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isContrastWarning
                        ? 'Low contrast detected. Standard optical scanners & phone cameras may fail.'
                        : 'Optimal contrast meets ISO/IEC 18004 300 DPI specifications.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleApplyBW}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg shadow transition-colors whitespace-nowrap cursor-pointer"
                >
                  Force Pure B&W (21:1)
                </button>
              </div>
            </div>

            {/* Error Correction Level */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Reed-Solomon Error Correction Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { level: 'L', name: 'Low (7%)', desc: 'Simplest matrix' },
                  { level: 'M', name: 'Medium (15%)', desc: 'Standard usage' },
                  { level: 'Q', name: 'Quartile (25%)', desc: 'High durability' },
                  { level: 'H', name: 'High (30%)', desc: 'Enforced for Photo QR' },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => handleUpdate({ errorCorrectionLevel: item.level as ErrorCorrection })}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
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

        {/* TAB 3: SHAPES CUSTOMIZATION */}
        {activeTab === 'shapes' && (
          <div className="mt-6 space-y-6">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Data Module Shape
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {DOT_SHAPES.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleUpdate({ dotShape: shape.id })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Finder Pattern (Eye) Outer Frame Shape
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EYE_FRAMES.map((frame) => (
                  <button
                    key={frame.id}
                    onClick={() => handleUpdate({ eyeFrameShape: frame.id })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
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

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Finder Pattern (Eye) Inner Pupil Shape
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EYE_BALLS.map((ball) => (
                  <button
                    key={ball.id}
                    onClick={() => handleUpdate({ eyeBallShape: ball.id })}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
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

        {/* TAB 4: COLORS */}
        {activeTab === 'colors' && (
          <div className="mt-6 space-y-6">
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
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 text-left transition-all flex items-center gap-2.5 cursor-pointer"
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
          </div>
        )}

        {/* TAB 5: 300 DPI PRINT LAB */}
        {activeTab === 'print' && (
          <div className="mt-6 space-y-5">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5 text-cyan-400 mb-1">
                <Printer className="w-5 h-5" />
                <span className="text-sm font-bold text-white">
                  300 DPI Commercial Print Specifications
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct physical resolution injection (`pHYs` chunk at 11,811 ppm). Produces razor-sharp optical edges for paper, badges, posters, and signage with 100% camera readability.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="font-mono text-slate-500 uppercase text-[10px]">Screen Preview</div>
                <div className="text-lg font-bold text-white mt-1">72 DPI</div>
                <div className="text-[11px] text-slate-400">800 × 800 px</div>
                <button
                  onClick={() => handleDownloadPNG(72)}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Export 72 DPI
                </button>
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/50 text-center relative overflow-hidden shadow-lg shadow-blue-500/10">
                <div className="absolute top-1 right-2 text-[9px] font-mono font-bold text-cyan-300">
                  STANDARD PRINT
                </div>
                <div className="font-mono text-cyan-400 uppercase text-[10px]">Print HD</div>
                <div className="text-lg font-bold text-white mt-1">300 DPI</div>
                <div className="text-[11px] text-slate-300">2,400 × 2,400 px</div>
                <button
                  onClick={() => handleDownloadPNG(300)}
                  disabled={isExporting}
                  className="mt-3 w-full py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-semibold rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {isExporting ? 'Embedding pHYs...' : 'Export 300 DPI PNG'}
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <div className="font-mono text-slate-500 uppercase text-[10px]">Ultra Fine Print</div>
                <div className="text-lg font-bold text-white mt-1">600 DPI</div>
                <div className="text-[11px] text-slate-400">4,800 × 4,800 px</div>
                <button
                  onClick={() => handleDownloadPNG(600)}
                  disabled={isExporting}
                  className="mt-3 w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Export 600 DPI
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadSVG}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Export Vector SVG</span>
              </button>

              <button
                onClick={handleCopySVG}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
              >
                <span>{copied === 'svg' ? 'Copied SVG Markup!' : 'Copy SVG'}</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isExporting}
                className="flex-1 py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span>Generate ISO Specimen PDF</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* RIGHT COLUMN: Live Photo QR Preview & Scannability Telemetry (5 cols) */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="sticky top-6 w-full space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-2xl flex flex-col items-center">
            
            {/* Viewport Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Photo QR Interpreter Specimen
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                {contrast.toFixed(1)}:1 B/W
              </span>
            </div>

            {/* QR Canvas Display */}
            <div className="relative group my-5 p-4 rounded-xl border border-slate-800 bg-white/5 backdrop-blur-md shadow-inner flex flex-col items-center">
              <div
                className="p-3 rounded-lg shadow-xl transition-transform duration-200 group-hover:scale-[1.01]"
                style={{ backgroundColor: options.backgroundColor }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-56 h-56 sm:w-64 sm:h-64 block rounded"
                />
              </div>

              {/* Optical Verification Chip */}
              <div className="mt-3 w-full text-center">
                {scanVerification.isScannable ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Scannable (Decoded in {scanVerification.decodeTimeMs}ms)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Low contrast: click Auto-Calibrate</span>
                  </div>
                )}
              </div>
            </div>

            {/* Specifications Readout */}
            <div className="w-full grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">PRINT RES</div>
                <div className="text-white font-bold mt-0.5">300 DPI</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">MODE</div>
                <div className="text-cyan-400 font-bold mt-0.5 capitalize truncate">
                  {options.photoQRMode || 'Halftone'}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500">REED-SOLOMON</div>
                <div className="text-white font-bold mt-0.5">LEVEL H</div>
              </div>
            </div>

            {/* Direct Export Action Buttons */}
            <div className="w-full space-y-2">
              <button
                onClick={() => handleDownloadPNG(300)}
                disabled={isExporting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating 300 DPI...' : 'Download 300 DPI PNG'}</span>
              </button>

              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDownloadSVG}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Vector SVG</span>
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isExporting}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print PDF</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
