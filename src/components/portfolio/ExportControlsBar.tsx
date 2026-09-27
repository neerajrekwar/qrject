'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileCode,
  Image as ImageIcon,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { QROptions } from '@/lib/qr-engine';
import { ExportFormat, exportQRCode, triggerDownload } from '@/lib/qr-export';

interface ExportControlsBarProps {
  options: QROptions;
  onExportSuccess?: (format: ExportFormat, filename: string) => void;
  className?: string;
  compact?: boolean;
}

const FORMAT_CONFIGS: Record<
  ExportFormat,
  {
    label: string;
    ext: string;
    icon: typeof ImageIcon;
    resolutionText: string;
    specs: string;
    bestFor: string;
  }
> = {
  PNG: {
    label: 'PNG',
    ext: '.png',
    icon: ImageIcon,
    resolutionText: '300 DPI // 2400×2400 PX',
    specs: 'Embedded pHYs chunk (11,811 ppm) for physical print shops. Lossless pixel density.',
    bestFor: 'Direct raster printing, commercial signage, ID badges.',
  },
  SVG: {
    label: 'SVG',
    ext: '.svg',
    icon: FileCode,
    resolutionText: 'VECTOR // ∞ DPI',
    specs: 'Resolution-independent mathematical vector paths with calibrated 4"×4" physical print box.',
    bestFor: 'Adobe Illustrator, Figma, vinyl plotters, laser engraving.',
  },
  PDF: {
    label: 'PDF',
    ext: '.pdf',
    icon: FileText,
    resolutionText: '300 DPI // PRINT SHEET',
    specs: 'Commercial print specimen (120×150mm) with corner trim marks, color swatches, and verification metadata.',
    bestFor: 'Offset presses, formal client handoff, press-ready print proof.',
  },
};

export function ExportControlsBar({
  options,
  onExportSuccess,
  className = '',
  compact = false,
}: ExportControlsBarProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('PNG');
  const [isExporting, setIsExporting] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);

  const activeConfig = FORMAT_CONFIGS[selectedFormat];
  const IconComponent = activeConfig.icon;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportQRCode(options, selectedFormat);
      triggerDownload(result);
      if (onExportSuccess) {
        onExportSuccess(selectedFormat, result.filename);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-2 font-mono ${className}`}>
      {/* Format Selector Bar */}
      <div className="border-2 border-black bg-white p-2.5 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Left: Format Tabs (0px radius, 2px borders) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-black text-black uppercase pr-1 flex items-center gap-1">
            <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
            <span className="hidden md:inline">FORMAT:</span>
          </span>

          {(['PNG', 'SVG', 'PDF'] as ExportFormat[]).map((fmt) => {
            const isSelected = selectedFormat === fmt;
            const FmtIcon = FORMAT_CONFIGS[fmt].icon;
            return (
              <button
                key={fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                }`}
              >
                <FmtIcon className="w-3.5 h-3.5" />
                <span>{fmt}</span>
                <span className="text-[9px] opacity-75 hidden lg:inline">
                  {fmt === 'SVG' ? 'VECTOR' : '300 DPI'}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowSpecs(!showSpecs)}
            className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors ml-1 cursor-pointer"
            title="Toggle print calibration specifications"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Specs Badge & Primary Download Trigger */}
        <div className="flex items-center gap-2">
          {!compact && (
            <div className="hidden xl:flex items-center gap-1.5 border border-black bg-[#fafaf8] px-2.5 py-1 text-[10px] text-zinc-700 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeConfig.resolutionText}</span>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border-2 border-black bg-[#ccff00] px-4 py-2 text-black font-mono text-xs font-black tracking-wider shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#ccff00] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isExporting ? 'EXPORTING 300 DPI...' : `EXPORT ${selectedFormat} (300 DPI)`}
            </span>
          </button>
        </div>

      </div>

      {/* Expandable Format Print Calibration Specs */}
      {showSpecs && (
        <div className="border-2 border-black bg-[#fafaf8] p-3 text-xs shadow-[3px_3px_0px_#000000] space-y-1.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-1.5">
            <span className="font-black text-black flex items-center gap-1.5">
              <IconComponent className="w-3.5 h-3.5 text-black" />
              <span>{selectedFormat} SPECIFICATION // 300 DPI CALIBRATION</span>
            </span>
            <span className="text-[10px] bg-black text-[#ccff00] px-1.5 py-0.5 font-black">
              PRINT COMPLIANT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[9px]">PHYSICAL RENDERING:</span>
              <span className="text-black font-bold">{activeConfig.specs}</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[9px]">RECOMMENDED DEPLOYMENT:</span>
              <span className="text-emerald-800 font-bold">{activeConfig.bestFor}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
