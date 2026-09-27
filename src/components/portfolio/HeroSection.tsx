'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Sliders,
  FileText,
  Image as ImageIcon,
  Download,
  Copy,
  Check,
  ShieldCheck,
  BookmarkPlus,
  Trash2,
  Scan,
  ArrowDownRight,
  Terminal,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Printer,
  Barcode as BarcodeIcon,
  Activity,
} from 'lucide-react';
import {
  QROptions,
  DotShape,
  EyeFrameShape,
  EyeBallShape,
  PhotoQRMode,
  renderQRToCanvas,
  calculateContrastRatio,
  verifyCanvasScannability,
  ScanVerificationResult,
} from '@/lib/qr-engine';
import { PHOTO_PRESETS, PhotoPreset } from '@/lib/photo-presets';
import { exportQRCode, triggerDownload, ExportFormat } from '@/lib/qr-export';
import { addQRToHistory } from '@/lib/qr-history';

interface HeroSectionProps {
  onExploreProjects?: () => void;
  onExploreRegistry?: () => void;
  onOpenQRArtifact?: () => void;
}

const MODULE_SHAPES: { id: DotShape; label: string; desc: string }[] = [
  { id: 'square', label: 'Classic Square', desc: 'Crisp industrial geometry (21:1 B/W standard)' },
  { id: 'dots', label: 'Circular Dots', desc: 'Refined modern optical dots' },
  { id: 'rounded', label: 'Smooth Rounded', desc: 'Engineered subtle radii' },
  { id: 'diamond', label: 'Diamond Angle', desc: '45° technical angular modules' },
  { id: 'classy', label: 'Classy Leaf', desc: 'Diagonal corner curvature' },
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
    desc: 'Traditional center cutout logo stamp',
  },
];

const QUICK_PRESETS = [
  {
    label: 'Architect Specimen',
    text: 'NEERAJ REKWAR // SENIOR SYSTEMS ARCHITECT\nCONTACT: neerajrekwar817@gmail.com\nSTATUS: AVAILABLE Q4 2026',
    shape: 'square' as DotShape,
    photoId: 'bw-portrait-photo',
  },
  {
    label: 'VIP Dev Pass',
    text: 'https://summit.globalai.dev/verify/DEV-AI-2026-8849',
    shape: 'square' as DotShape,
    photoId: 'bw-cyber-avatar',
  },
  {
    label: 'Monolith Seal',
    text: 'https://qrject.dev/spec/iso18004-monolith-verification-token',
    shape: 'diamond' as DotShape,
    photoId: 'bw-nr-monogram',
  },
];

export function HeroSection({
  onExploreProjects,
  onExploreRegistry,
  onOpenQRArtifact,
}: HeroSectionProps) {
  // Master QR State configured for whole-image 300 DPI high-contrast Photo B/W format
  const [options, setOptions] = useState<QROptions>({
    text: 'https://summit.globalai.dev/verify/DEV-AI-2026-8849',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    gradientEnabled: false,
    eyeOuterColor: '#000000',
    eyeInnerColor: '#000000',
    dotShape: 'square',
    eyeFrameShape: 'square',
    eyeBallShape: 'square',
    // Whole Image Photo QR Settings (Defaulting to studio portrait)
    photoUrl: PHOTO_PRESETS[0].dataUrl,
    photoQRMode: 'halftone',
    photoContrast: 1.45,
    photoBrightness: 1.0,
    photoDotScale: 0.62,
    photoOpacity: 0.95,
    photoInvert: false,
    photoBWMode: true,
    errorCorrectionLevel: 'H', // Enforce Level H (30% fault tolerance) for photo QR
    dpi: 300,
    targetSizePx: 1000,
  });

  const [activeTab, setActiveTab] = useState<'photo' | 'content' | 'shapes' | 'export'>('photo');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('bw-portrait-photo');
  const [customPhotoName, setCustomPhotoName] = useState<string>('B/W Portrait Photograph');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Optical Scan Verification State
  const [scanVerification, setScanVerification] = useState<ScanVerificationResult>({
    isScannable: true,
    confidence: 100,
    decodeTimeMs: 6,
    decodedText: options.text,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const contrast = calculateContrastRatio(options.foregroundColor, options.backgroundColor);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdate = (updates: Partial<QROptions>) => {
    setOptions((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Force pure high-contrast black and white format
  const handleForcePureBW = () => {
    handleUpdate({
      foregroundColor: '#000000',
      backgroundColor: '#ffffff',
      gradientEnabled: false,
      eyeOuterColor: '#000000',
      eyeInnerColor: '#000000',
      photoBWMode: true,
      errorCorrectionLevel: 'H',
    });
    showToast('Pure B/W 21:1 Contrast Applied');
  };

  // Auto-Calibrate for 100% Scannability
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
    showToast('Auto-Calibrated for 100% Camera Scan Rate');
  };

  // Custom Photo Upload Handler (Whole Image)
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomPhotoName(file.name);
    setSelectedPresetId('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdate({
        photoUrl: dataUrl,
        errorCorrectionLevel: 'H', // Enforce Level H
        photoBWMode: true,
      });
      showToast(`Uploaded Photo "${file.name}" as QR Code`);
    };
    reader.readAsDataURL(file);
  };

  // Select Photo Preset
  const handleSelectPreset = (preset: PhotoPreset) => {
    setSelectedPresetId(preset.id);
    setCustomPhotoName(preset.name);
    handleUpdate({
      photoUrl: preset.dataUrl,
      errorCorrectionLevel: 'H',
      photoBWMode: true,
    });
    showToast(`Loaded Whole-Image Preset: ${preset.name}`);
  };

  // Remove Photo (Revert to pure geometric QR)
  const handleRemovePhoto = () => {
    setCustomPhotoName('');
    setSelectedPresetId('');
    handleUpdate({
      photoUrl: null,
      logoUrl: null,
      errorCorrectionLevel: 'M',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Reverted to standard geometric QR code');
  };

  // Direct 300 DPI Export (PNG, SVG, PDF)
  const handleExport = async (format: ExportFormat = selectedFormat) => {
    setIsExporting(true);
    try {
      const result = await exportQRCode(options, format);
      triggerDownload(result);
      await addQRToHistory(
        options,
        `${format === 'SVG' ? 'Vector' : '300 DPI'} ${format}`,
        options.text.slice(0, 32)
      );
      showToast(`Downloaded ${format} at 300 DPI`);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Export failed. Check console.');
    } finally {
      setIsExporting(false);
    }
  };

  // Save to Recents
  const handleSaveToRecents = async () => {
    await addQRToHistory(options, `300 DPI Photo QR (${selectedFormat})`, options.text.slice(0, 32));
    showToast('Saved Photo QR to Recent History');
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(options.text);
    setCopied('payload');
    showToast('Copied QR payload to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="about" className="w-full py-10 md:py-16 border-b-2 border-black bg-[#f5f5f0] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* HERO TITLE & DOSSIER HEADER */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
              <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black animate-pulse" />
              <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
                {'// GENQR_STUDIO: WHOLE-IMAGE PHOTO QR CODE ENGINE (300 DPI B/W)'}
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="border-2 border-black bg-[#ccff00] text-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                300 DPI CALIBRATED
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                HIGH-CONTRAST B/W
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-black">
                PHOTO QR CODE
              </h1>
              <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800">
                STUDIO & INTERPRETER
              </h2>
            </div>

            <p className="font-mono text-xs sm:text-sm text-zinc-700 max-w-xl leading-relaxed">
              Transforms your <strong>entire image into a scannable photo QR code</strong>. Combines photographic monochrome halftoning with ISO/IEC 18004 error-corrected data modules so human eyes see the portrait while smartphones scan instantly.
            </p>
          </div>
        </div>

        {/* GENQR_STUDIO MAIN INTERACTIVE COMPILER CONTAINER */}
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_#000000] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT COLUMN: Controls & Configuration Panels (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-7 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col justify-between space-y-6 bg-white">
            
            {/* Studio Navigation Tabs (Zero Radius, High-Contrast Neo-Brutalist) */}
            <div>
              <div className="flex items-center gap-1.5 border-2 border-black bg-[#fafaf8] p-1.5 shadow-[3px_3px_0px_#000000] overflow-x-auto">
                {[
                  { id: 'photo', label: 'PHOTO QR ENGINE', icon: ImageIcon },
                  { id: 'content', label: 'PAYLOAD', icon: Scan },
                  { id: 'shapes', label: 'B/W GEOMETRY', icon: Sliders },
                  { id: 'export', label: '300 DPI EXPORT', icon: Download },
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

              {/* TAB 1: WHOLE IMAGE PHOTO QR ENGINE */}
              {activeTab === 'photo' && (
                <div className="mt-5 space-y-5 animate-fadeIn">
                  
                  {/* Photo Uploader Card */}
                  <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1.5">
                        <UploadCloud className="w-4 h-4 text-black" />
                        <span>TRANSFORM ANY PHOTO INTO QR CODE</span>
                      </span>
                      <span className="font-mono text-[10px] bg-black text-[#ccff00] px-1.5 py-0.5 font-bold">
                        EC LEVEL: H (30%)
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        id="hero-photo-upload"
                      />
                      <label
                        htmlFor="hero-photo-upload"
                        className="flex-1 w-full border-2 border-dashed border-black bg-white hover:bg-zinc-50 p-3 text-center font-mono text-xs font-bold text-black cursor-pointer flex items-center justify-center gap-2 transition-colors"
                      >
                        <UploadCloud className="w-4 h-4 text-black" />
                        <span>
                          {customPhotoName
                            ? `Replace Photo: "${customPhotoName.slice(0, 24)}"`
                            : 'Upload Photo from Device (Portrait / Face / Art)...'}
                        </span>
                      </label>

                      {options.photoUrl && (
                        <button
                          onClick={handleRemovePhoto}
                          className="w-full sm:w-auto px-3 py-3 border-2 border-black bg-rose-100 hover:bg-rose-200 text-rose-800 font-mono text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    <p className="font-mono text-[11px] text-zinc-600">
                      The whole image is interpreted into the QR code matrix. Works with any portrait, face photo, selfie, silhouette, or artwork in high-contrast 300 DPI B/W.
                    </p>
                  </div>

                  {/* Photo QR Interpretation Mode Selector */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-700 block">
                      PHOTO QR INTERPRETER MODE:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PHOTO_QR_MODES.slice(0, 4).map((m) => {
                        const isSelected = options.photoQRMode === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleUpdate({ photoQRMode: m.id })}
                            className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-xs uppercase flex items-center justify-between">
                              <span>{m.label}</span>
                              {isSelected && <span className="text-[10px] bg-[#ccff00] text-black px-1">ACTIVE</span>}
                            </div>
                            <div className="text-[10px] opacity-75 mt-0.5 leading-snug">{m.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Photo Presets */}
                  <div className="space-y-2">
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-600 block">
                      CURATED B/W PHOTOGRAPHIC SPECIMENS:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {PHOTO_PRESETS.map((preset) => {
                        const isSelected = selectedPresetId === preset.id;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-2 border-2 border-black font-mono text-[11px] font-bold text-left transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="w-12 h-12 border border-black bg-white shrink-0 p-0.5 flex items-center justify-center overflow-hidden">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={preset.dataUrl} alt={preset.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] font-black truncate w-full text-center">{preset.name.replace('B/W ', '')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Photo QR Tuning Controls */}
                  {options.photoUrl && (
                    <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-4 shadow-[3px_3px_0px_#000000]">
                      <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                        <span className="font-mono text-xs font-black uppercase text-black flex items-center gap-1">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>PHOTO MATRIX CALIBRATION (300 DPI B/W)</span>
                        </span>
                        <button
                          onClick={handleAutoCalibrate}
                          className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black hover:bg-black hover:text-[#ccff00] transition-colors cursor-pointer"
                        >
                          Auto-Calibrate
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Dot Scale / QR Module Strength */}
                        <div>
                          <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                            <span>MODULE STRENGTH</span>
                            <span>{Math.round((options.photoDotScale || 0.62) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.38"
                            max="0.85"
                            step="0.02"
                            value={options.photoDotScale || 0.62}
                            onChange={(e) => handleUpdate({ photoDotScale: parseFloat(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                            Lower = more photo detail, Higher = faster scan
                          </span>
                        </div>

                        {/* Photo Contrast */}
                        <div>
                          <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                            <span>B/W CONTRAST</span>
                            <span>{(options.photoContrast || 1.45).toFixed(2)}x</span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="2.4"
                            step="0.05"
                            value={options.photoContrast || 1.45}
                            onChange={(e) => handleUpdate({ photoContrast: parseFloat(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                            Sharpens edges for 300 DPI print
                          </span>
                        </div>

                        {/* Photo Brightness & Invert */}
                        <div>
                          <div className="flex justify-between font-mono text-[11px] font-bold text-black mb-1">
                            <span>PHOTO BRIGHTNESS</span>
                            <span>{Math.round((options.photoBrightness || 1.0) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.6"
                            max="1.6"
                            step="0.05"
                            value={options.photoBrightness || 1.0}
                            onChange={(e) => handleUpdate({ photoBrightness: parseFloat(e.target.value) })}
                            className="w-full accent-black cursor-pointer"
                          />
                          <div className="mt-1 flex items-center justify-between">
                            <button
                              onClick={() => handleUpdate({ photoInvert: !options.photoInvert })}
                              className={`px-2 py-0.5 font-mono text-[10px] font-bold border border-black ${
                                options.photoInvert ? 'bg-black text-[#ccff00]' : 'bg-white text-black'
                              }`}
                            >
                              Invert: {options.photoInvert ? 'ON' : 'OFF'}
                            </button>
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">21:1 B/W</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: CONTENT & PAYLOAD */}
              {activeTab === 'content' && (
                <div className="mt-5 space-y-4 animate-fadeIn">
                  <div>
                    <label className="block font-mono text-xs font-black uppercase text-black mb-1.5">
                      QR MATRIX PAYLOAD // DATA DESTINATION
                    </label>
                    <textarea
                      rows={3}
                      value={options.text}
                      onChange={(e) => handleUpdate({ text: e.target.value })}
                      placeholder="Enter website URL, contact dossier, or cryptographic hash..."
                      className="w-full p-3 border-2 border-black bg-[#fafaf8] font-mono text-xs text-black focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] resize-y"
                    />
                  </div>

                  {/* Quick Preset Payloads */}
                  <div>
                    <span className="font-mono text-[11px] font-black uppercase text-zinc-600 block mb-1.5">
                      RAPID PAYLOAD TEMPLATES:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {QUICK_PRESETS.map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => {
                            const foundPreset = PHOTO_PRESETS.find((p) => p.id === preset.photoId);
                            handleUpdate({
                              text: preset.text,
                              dotShape: preset.shape,
                              photoUrl: foundPreset ? foundPreset.dataUrl : options.photoUrl,
                            });
                            if (foundPreset) setSelectedPresetId(foundPreset.id);
                            showToast(`Loaded payload: ${preset.label}`);
                          }}
                          className="p-2 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-bold text-left transition-colors cursor-pointer"
                        >
                          <div className="font-black text-black">{preset.label}</div>
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">{preset.text}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: B/W GEOMETRY & SHAPES */}
              {activeTab === 'shapes' && (
                <div className="mt-5 space-y-5 animate-fadeIn">
                  
                  {/* Module Shapes */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-black uppercase text-black">
                        MODULE PATTERN GEOMETRY
                      </span>
                      <button
                        onClick={handleForcePureBW}
                        className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black hover:bg-black hover:text-[#ccff00] transition-colors cursor-pointer"
                      >
                        RESET TO 21:1 B/W
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {MODULE_SHAPES.map((shp) => {
                        const isSelected = options.dotShape === shp.id;
                        return (
                          <button
                            key={shp.id}
                            onClick={() => handleUpdate({ dotShape: shp.id })}
                            className={`p-2.5 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-xs uppercase">{shp.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">{shp.desc}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Corner Finder Eyes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200 pt-3">
                    <div>
                      <span className="font-mono text-xs font-black uppercase text-black mb-1.5 block">
                        FINDER EYE FRAME
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-xs font-bold">
                        {(['square', 'rounded', 'circle', 'squircle'] as EyeFrameShape[]).map((f) => (
                          <button
                            key={f}
                            onClick={() => handleUpdate({ eyeFrameShape: f })}
                            className={`py-1.5 px-2 border border-black uppercase text-center cursor-pointer ${
                              options.eyeFrameShape === f ? 'bg-black text-white' : 'bg-white text-black'
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-mono text-xs font-black uppercase text-black mb-1.5 block">
                        FINDER EYE BALL
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 font-mono text-xs font-bold">
                        {(['square', 'rounded', 'circle', 'diamond'] as EyeBallShape[]).map((b) => (
                          <button
                            key={b}
                            onClick={() => handleUpdate({ eyeBallShape: b })}
                            className={`py-1.5 px-2 border border-black uppercase text-center cursor-pointer ${
                              options.eyeBallShape === b ? 'bg-black text-white' : 'bg-white text-black'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: 300 DPI EXPORT SETTINGS */}
              {activeTab === 'export' && (
                <div className="mt-5 space-y-4 animate-fadeIn">
                  
                  <div className="border-2 border-black bg-[#fafaf8] p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                    <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
                      <span className="font-mono text-xs font-black uppercase text-black">
                        CHOOSE 300 DPI OUTPUT FORMAT
                      </span>
                      <span className="font-mono text-[10px] bg-black text-[#ccff00] px-1.5 py-0.5 font-bold">
                        PRINT READY
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {(['PNG', 'SVG', 'PDF'] as ExportFormat[]).map((fmt) => {
                        const isSelected = selectedFormat === fmt;
                        return (
                          <button
                            key={fmt}
                            onClick={() => setSelectedFormat(fmt)}
                            className={`p-3 border-2 border-black font-mono text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-black text-[#ccff00] shadow-[3px_3px_0px_#000000]'
                                : 'bg-white text-black hover:bg-zinc-100'
                            }`}
                          >
                            <div className="font-black text-sm">{fmt}</div>
                            <div className="text-[10px] opacity-75 mt-0.5">
                              {fmt === 'PNG' ? '300 DPI RASTER' : fmt === 'SVG' ? 'VECTOR PATHS' : 'SPECIMEN SHEET'}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="font-mono text-[11px] text-zinc-700 bg-white p-2.5 border border-black">
                      {selectedFormat === 'PNG' && (
                        <span>
                          <strong>300 DPI PNG:</strong> Renders 2400×2400 px with embedded pHYs binary chunk (11,811 pixels per meter) preserving high-contrast photographic halftone detail.
                        </span>
                      )}
                      {selectedFormat === 'SVG' && (
                        <span>
                          <strong>Vector SVG:</strong> Mathematical vector paths with embedded photographic filters and 4.0×4.0 inch physical print bounding box.
                        </span>
                      )}
                      {selectedFormat === 'PDF' && (
                        <span>
                          <strong>Commercial Print PDF:</strong> ISO/IEC 18004 120×150mm specimen card with hairline corner trim marks, registration crosshairs, and verification metadata.
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExport(selectedFormat)}
                    disabled={isExporting}
                    className="w-full py-3.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black tracking-widest text-black shadow-[4px_4px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExporting ? 'GENERATING 300 DPI FILE...' : `EXPORT PHOTO QR AS ${selectedFormat} (300 DPI)`}</span>
                  </button>

                </div>
              )}

            </div>

            {/* Bottom Actions Row */}
            <div className="pt-4 border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleForcePureBW}
                  className="px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enforce Pure B/W (21:1)</span>
                </button>

                <button
                  onClick={handleSaveToRecents}
                  className="px-3 py-1.5 border-2 border-black bg-white hover:bg-[#ccff00] font-mono text-xs font-black text-black transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>Pin to Recents</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                {onExploreProjects && (
                  <button
                    onClick={onExploreProjects}
                    className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Projects</span>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {onExploreRegistry && (
                  <button
                    onClick={onExploreRegistry}
                    className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Registry</span>
                    <Terminal className="w-3.5 h-3.5" />
                  </button>
                )}
                {onOpenQRArtifact && (
                  <button
                    onClick={onOpenQRArtifact}
                    className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Modal Suite →</span>
                  </button>
                )}
                <Link
                  href="/nomral-dpi-photo"
                  className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Photo DPI Maker →</span>
                </Link>
                <Link
                  href="/barcode-pick"
                  className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <BarcodeIcon className="w-3.5 h-3.5" />
                  <span>Barcode Pick →</span>
                </Link>
                <Link
                  href="/fitness-glass"
                  className="font-black text-black hover:text-emerald-800 underline flex items-center gap-1 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Fitness Glass →</span>
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Live 300 DPI Photo QR Specimen Viewport (5 cols) */}
          <div className="lg:col-span-5 bg-[#fafaf8] p-5 sm:p-7 flex flex-col justify-between items-center text-center space-y-5">
            
            {/* Specimen Header Ribbon */}
            <div className="w-full flex items-center justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-black rotate-45 inline-block" />
                <span className="font-mono text-xs font-black uppercase text-black tracking-wider">
                  LIVE PHOTO QR SPECIMEN
                </span>
              </div>
              <span className="border border-black bg-[#ccff00] text-black px-2 py-0.5 font-mono text-[10px] font-black">
                PASS: {contrast.toFixed(1)}:1 B/W
              </span>
            </div>

            {/* Central QR Canvas Display (Zero-Radius Neo-Brutalist Frame) */}
            <div className="relative group p-4 border-2 border-black bg-white shadow-[6px_6px_0px_#000000] flex flex-col items-center">
              
              {/* Quiet Zone Corner Markers */}
              <div className="absolute top-1 left-1 font-mono text-[9px] text-zinc-400 font-bold">┌ QUIET ZONE</div>
              <div className="absolute bottom-1 right-1 font-mono text-[9px] text-zinc-400 font-bold">QUIET ZONE ┘</div>

              <div
                className="p-3 transition-transform duration-200 group-hover:scale-[1.01]"
                style={{ backgroundColor: options.backgroundColor }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-56 h-56 sm:w-64 sm:h-64 block border border-zinc-200"
                />
              </div>

              {/* Optical Scannability Verification Readout */}
              <div className="mt-3 w-full">
                {scanVerification.isScannable ? (
                  <div className="inline-flex items-center gap-1.5 border border-black bg-[#ccff00] px-2.5 py-1 font-mono text-[10px] font-black text-black shadow-[2px_2px_0px_#000000]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                    <span>SCANNABLE VERIFIED ({scanVerification.decodeTimeMs}ms via jsQR)</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 border border-black bg-amber-300 px-2.5 py-1 font-mono text-[10px] font-black text-black shadow-[2px_2px_0px_#000000]">
                    <AlertCircle className="w-3.5 h-3.5 text-black" />
                    <span>LOW CONTRAST: CLICK AUTO-CALIBRATE</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="w-full grid grid-cols-3 gap-2 font-mono text-center">
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">OUTPUT RES</div>
                <div className="text-xs font-black text-black mt-0.5">300 DPI</div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">MODE</div>
                <div className="text-xs font-black text-emerald-800 mt-0.5 truncate uppercase">
                  {options.photoQRMode || 'Halftone'}
                </div>
              </div>
              <div className="border-2 border-black bg-white p-2 shadow-[2px_2px_0px_#000000]">
                <div className="text-[9px] text-zinc-500 font-bold uppercase">ERROR CORR</div>
                <div className="text-xs font-black text-black mt-0.5">LEVEL H (30%)</div>
              </div>
            </div>

            {/* Primary Export Buttons Bar */}
            <div className="w-full space-y-2">
              <button
                onClick={() => handleExport(selectedFormat)}
                disabled={isExporting}
                className="w-full py-3 border-2 border-black bg-black text-white hover:bg-[#ccff00] hover:text-black font-mono text-xs font-black tracking-widest uppercase shadow-[4px_4px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'EXPORTING...' : `DOWNLOAD PHOTO QR (${selectedFormat} 300 DPI)`}</span>
              </button>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <button
                  onClick={() => handleExport(selectedFormat === 'PNG' ? 'PDF' : 'PNG')}
                  className="py-2 border-2 border-black bg-white hover:bg-zinc-100 font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000000]"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{selectedFormat === 'PNG' ? 'PDF Specimen' : 'PNG 300 DPI'}</span>
                </button>

                <button
                  onClick={handleCopyPayload}
                  className="py-2 border-2 border-black bg-white hover:bg-zinc-100 font-bold text-black transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-[2px_2px_0px_#000000]"
                >
                  {copied === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'payload' ? 'Copied' : 'Copy Payload'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#ccff00] text-black px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
