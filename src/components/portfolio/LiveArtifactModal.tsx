'use client';

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import {
  QrCode,
  ShieldCheck,
  History,
  BookmarkPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Sliders,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { EventCard } from '@/components/EventCard';
import { QRStudio } from '@/components/QRStudio';
import { BatchProcessor } from '@/components/BatchProcessor';
import { QROptions } from '@/lib/qr-engine';
import { QRHistoryItem, loadQRHistory, addQRToHistory, deleteQRHistoryItem, clearQRHistory } from '@/lib/qr-history';
import { QRHistoryView } from './QRHistoryView';
import { ExportControlsBar } from './ExportControlsBar';
import { ExportFormat } from '@/lib/qr-export';
import { PHOTO_PRESETS } from '@/lib/photo-presets';
import { blendImageWithQRCode, PhotoQRBlendResult } from '@/lib/photo-qr-blend';

interface LiveArtifactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveArtifactModal({ isOpen, onClose }: LiveArtifactModalProps) {
  const [activeTab, setActiveTab] = useState<'studio' | 'event' | 'batch' | 'history'>('studio');
  const [historyItems, setHistoryItems] = useState<QRHistoryItem[]>(() => {
    if (typeof window !== 'undefined') {
      return loadQRHistory();
    }
    return [];
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master QR State
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
    photoUrl: PHOTO_PRESETS[0].dataUrl,
    photoQRMode: 'halftone',
    photoContrast: 1.45,
    photoBrightness: 1.0,
    photoDotScale: 0.62,
    photoBWMode: true,
    errorCorrectionLevel: 'H',
    dpi: 300,
    targetSizePx: 1000,
  });

  // State for image file input & data-level canvas blending
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string | null>('B/W Portrait Photograph');
  const [isBlending, setIsBlending] = useState<boolean>(false);
  const [blendResult, setBlendResult] = useState<PhotoQRBlendResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync latest history if window storage changed externally
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'qrject_recent_codes_v2') {
        setHistoryItems(loadQRHistory());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  /**
   * Performs data-level canvas blending of an image with the QR code pattern.
   * Ensures the result remains optically scannable while creating the 'photo-QR' effect.
   */
  const executeDataLevelBlend = async (
    imageSource: File | string,
    customOptions: Partial<QROptions> = {}
  ) => {
    setIsBlending(true);
    try {
      const mergedOptions = { ...qrOptions, ...customOptions };
      const result = await blendImageWithQRCode(null, imageSource, {
        text: mergedOptions.text,
        errorCorrectionLevel: 'H',
        contrast: mergedOptions.photoContrast || 1.45,
        brightness: mergedOptions.photoBrightness || 1.0,
        dotScale: mergedOptions.photoDotScale || 0.62,
        blendMode: 'pixel-clamp',
        monochrome: mergedOptions.photoBWMode !== false,
        invert: mergedOptions.photoInvert || false,
        dotShape: mergedOptions.dotShape || 'square',
        eyeFrameShape: mergedOptions.eyeFrameShape || 'square',
        eyeBallShape: mergedOptions.eyeBallShape || 'square',
        foregroundColor: mergedOptions.foregroundColor || '#000000',
        backgroundColor: mergedOptions.backgroundColor || '#ffffff',
      });

      setBlendResult(result);

      // Update QR options with blended data URL and Level H error correction
      setQrOptions((prev) => ({
        ...prev,
        photoUrl: result.dataUrl,
        errorCorrectionLevel: 'H',
        photoBWMode: true,
      }));

      showToast(
        result.isScannable
          ? `Data-level blend complete: 100% Scannable (${result.decodeTimeMs}ms)`
          : 'Data-level blend complete (Adjust module strength for low-contrast images)'
      );
    } catch (err) {
      console.error('Data-level blend failed:', err);
      showToast('Error blending image with QR pattern');
    } finally {
      setIsBlending(false);
    }
  };

  /**
   * File input change handler: accepts any image, loads it, and calls the canvas blending utility
   */
  const handleImageFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadedImageName(file.name);

    await executeDataLevelBlend(file);
  };

  /**
   * Re-blend when user changes module strength slider
   */
  const handleDotScaleChange = async (newScale: number) => {
    setQrOptions((prev) => ({ ...prev, photoDotScale: newScale }));
    const source = uploadedFile || qrOptions.photoUrl;
    if (source) {
      await executeDataLevelBlend(source, { photoDotScale: newScale });
    }
  };

  /**
   * Remove custom image and reset to pure geometric QR code
   */
  const handleClearImage = () => {
    setUploadedFile(null);
    setUploadedImageName(null);
    setBlendResult(null);
    setQrOptions((prev) => ({
      ...prev,
      photoUrl: null,
      logoUrl: null,
      errorCorrectionLevel: 'M',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Removed image from QR pattern');
  };

  const handleSaveCurrentToHistory = async () => {
    const updated = await addQRToHistory(qrOptions, `${qrOptions.dpi || 300} DPI PNG`);
    setHistoryItems(updated);
    showToast('Current QR saved to Recent History');
  };

  const handleCodeExported = async (codeInfo: { title?: string; options: QROptions; format: string }) => {
    const updated = await addQRToHistory(codeInfo.options, codeInfo.format, codeInfo.title);
    setHistoryItems(updated);
    showToast(`Exported & logged to Recents (${codeInfo.format})`);
  };

  const handleSelectHistoryCode = (options: QROptions, targetTab: 'studio' | 'event' = 'studio') => {
    setQrOptions(options);
    setActiveTab(targetTab);
    showToast(`Loaded "${options.text.slice(0, 24)}..." into ${targetTab.toUpperCase()}`);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteQRHistoryItem(id);
    setHistoryItems(updated);
    showToast('Removed code from history');
  };

  const handleClearAllHistory = () => {
    const cleared = clearQRHistory();
    setHistoryItems(cleared);
    showToast('All recent history cleared');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[94vh] flex flex-col border-2 border-black bg-[#f5f5f0] shadow-[12px_12px_0px_#000000] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header Bar */}
        <div className="border-b-2 border-black bg-[#ccff00] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="font-mono text-sm font-black text-black uppercase tracking-tight">
                LIVE ARTIFACT // PHOTO-QR BLEND ENGINE & 300 DPI MATRIX COMPILER
              </div>
              <div className="font-mono text-[10px] text-zinc-900 font-bold">
                DATA-LEVEL CANVAS PIXEL BLENDING · OPTICAL SCANNABILITY VERIFICATION · 300 DPI EXPORT
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
            >
              <span>[X] CLOSE</span>
            </button>
          </div>
        </div>

        {/* 2. DEDICATED DATA-LEVEL PHOTO-QR BLEND FILE INPUT BAR */}
        <div className="border-b-2 border-black bg-white p-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileInput}
              className="hidden"
              id="modal-photo-qr-input"
            />

            {/* Custom Styled Trigger Button */}
            <label
              htmlFor="modal-photo-qr-input"
              className="border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] px-3.5 py-1.5 font-mono text-xs font-black text-black transition-all cursor-pointer flex items-center gap-2 shadow-[2px_2px_0px_#000000] shrink-0"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isBlending ? 'BLENDING AT DATA LEVEL...' : 'UPLOAD PHOTO FOR QR BLEND'}</span>
            </label>

            {/* Status & Filename Readout */}
            <div className="flex items-center gap-2 font-mono text-xs truncate">
              {uploadedImageName ? (
                <div className="flex items-center gap-1.5 bg-[#fafaf8] border border-black px-2.5 py-1 text-black font-bold">
                  <ImageIcon className="w-3.5 h-3.5 text-black shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-[220px]">
                    {uploadedImageName}
                  </span>
                  <button
                    onClick={handleClearImage}
                    title="Clear uploaded photo"
                    className="text-zinc-500 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-zinc-500 text-[11px] hidden sm:inline">
                  Select any photo (portrait, selfie, art) to blend into the QR matrix
                </span>
              )}
            </div>
          </div>

          {/* Scannability Telemetry Chip & Auto-Calibrate */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {blendResult ? (
              blendResult.isScannable ? (
                <span className="inline-flex items-center gap-1.5 border border-black bg-[#ccff00] text-black px-2.5 py-1 font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000000]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SCANNABLE ({blendResult.decodeTimeMs}ms)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 border border-black bg-amber-300 text-black px-2.5 py-1 font-mono text-[10px] font-black shadow-[1.5px_1.5px_0px_#000000]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>LOW CONTRAST</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-700">
                <Sparkles className="w-3 h-3 text-black" />
                <span>CANVAS DATA-BLENDER READY</span>
              </span>
            )}

            {/* Quick module strength adjustment */}
            {qrOptions.photoUrl && (
              <div className="hidden md:flex items-center gap-1.5 border border-black bg-[#fafaf8] px-2 py-0.5 font-mono text-[10px]">
                <Sliders className="w-3 h-3 text-black" />
                <span>STRENGTH:</span>
                <input
                  type="range"
                  min="0.4"
                  max="0.8"
                  step="0.05"
                  value={qrOptions.photoDotScale || 0.62}
                  onChange={(e) => handleDotScaleChange(parseFloat(e.target.value))}
                  className="w-16 accent-black cursor-pointer"
                  title="Module core sampling strength"
                />
                <span className="font-bold">{Math.round((qrOptions.photoDotScale || 0.62) * 100)}%</span>
              </div>
            )}

            <button
              onClick={() => {
                const source = uploadedFile || qrOptions.photoUrl;
                if (source) executeDataLevelBlend(source, { photoDotScale: 0.64 });
              }}
              title="Re-run canvas manipulation at data level"
              className="border border-black bg-white hover:bg-zinc-100 p-1 text-black transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isBlending ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Tab Controls Bar */}
        <div className="border-b-2 border-black bg-white p-2.5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'studio', label: '300 DPI Photo-QR Studio' },
              { id: 'event', label: '3:4 Event Pass Card' },
              { id: 'batch', label: 'Batch Processor (ZIP)' },
              { id: 'history', label: `Recent History (${historyItems.length})`, icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                      : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Toolbar Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCurrentToHistory}
              title="Pin current QR options to browser local storage"
              className="border-2 border-black bg-[#ccff00] px-3 py-1 font-mono text-xs font-black text-black hover:bg-black hover:text-[#ccff00] shadow-[2px_2px_0px_#000000] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save Current</span>
            </button>

            <button
              onClick={() => {
                setQrOptions({
                  ...qrOptions,
                  foregroundColor: '#000000',
                  backgroundColor: '#ffffff',
                  gradientEnabled: false,
                  eyeOuterColor: '#000000',
                  eyeInnerColor: '#000000',
                  photoBWMode: true,
                });
                showToast('Pure B&W (21:1) Applied');
              }}
              className="border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black text-black hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Pure B&W</span>
            </button>
          </div>
        </div>

        {/* 4. Quick-Access Recent Codes Strip */}
        {activeTab !== 'history' && historyItems.length > 0 && (
          <div className="border-b-2 border-black bg-[#fafaf8] px-3 py-2 flex items-center gap-2 overflow-x-auto select-none">
            <div className="flex items-center gap-1.5 text-zinc-500 font-mono text-[10px] font-bold uppercase shrink-0">
              <Clock className="w-3 h-3 text-black" />
              <span>QUICK RE-ACCESS:</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {historyItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectHistoryCode(item.options, activeTab === 'event' ? 'event' : 'studio')}
                  title={`Load "${item.title}" (${item.content})`}
                  className="flex items-center gap-1.5 border border-black bg-white hover:bg-[#ccff00] px-2 py-0.5 font-mono text-[11px] font-bold text-black shadow-[1.5px_1.5px_0px_#000000] hover:translate-x-0.5 transition-all cursor-pointer max-w-[180px] truncate"
                >
                  <span className="w-1.5 h-1.5 bg-black rotate-45 inline-block shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}

              <button
                onClick={() => setActiveTab('history')}
                className="font-mono text-[10px] font-black text-zinc-700 hover:text-black flex items-center gap-0.5 underline shrink-0 cursor-pointer ml-1"
              >
                <span>View all ({historyItems.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 5. 300 DPI Export Controls Bar with Format Selector (PNG, SVG, PDF) */}
        <div className="border-b-2 border-black bg-[#f5f5f0] px-3 sm:px-4 py-2">
          <ExportControlsBar
            options={qrOptions}
            onExportSuccess={(format: ExportFormat, filename: string) => {
              handleCodeExported({
                title: qrOptions.text.slice(0, 32),
                options: { ...qrOptions },
                format: `${format === 'SVG' ? 'Vector' : '300 DPI'} ${format}`,
              });
              showToast(`Exported ${format} (${filename}) at 300 DPI`);
            }}
          />
        </div>

        {/* 6. Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0a0d16] flex justify-center">
          {activeTab === 'event' && (
            <div className="w-full flex justify-center py-4">
              <EventCard qrOptions={qrOptions} />
            </div>
          )}

          {activeTab === 'studio' && (
            <div className="w-full flex justify-center py-2">
              <QRStudio
                options={qrOptions}
                onOptionsChange={setQrOptions}
                onCodeExported={handleCodeExported}
              />
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="w-full flex justify-center py-2">
              <BatchProcessor baseOptions={qrOptions} />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="w-full max-w-5xl py-2">
              <QRHistoryView
                historyItems={historyItems}
                currentOptions={qrOptions}
                onSelectCode={handleSelectHistoryCode}
                onSaveCurrent={handleSaveCurrentToHistory}
                onDeleteItem={handleDeleteHistoryItem}
                onClearAll={handleClearAllHistory}
              />
            </div>
          )}
        </div>

        {/* 7. Feedback Notification Toast */}
        {toastMessage && (
          <div className="absolute bottom-4 right-4 z-50 border-2 border-black bg-[#ccff00] text-black px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>{toastMessage}</span>
          </div>
        )}

      </div>
    </div>
  );
}
