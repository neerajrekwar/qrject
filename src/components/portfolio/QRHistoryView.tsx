'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Trash2,
  Sliders,
  CreditCard,
  Search,
  BookmarkPlus,
  AlertCircle,
} from 'lucide-react';
import { QRHistoryItem } from '@/lib/qr-history';
import { QROptions } from '@/lib/qr-engine';
import { exportQRCode, triggerDownload, ExportFormat } from '@/lib/qr-export';

interface QRHistoryViewProps {
  historyItems: QRHistoryItem[];
  currentOptions: QROptions;
  onSelectCode: (options: QROptions, targetTab?: 'studio' | 'event') => void;
  onSaveCurrent: () => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export function QRHistoryView({
  historyItems,
  currentOptions,
  onSelectCode,
  onSaveCurrent,
  onDeleteItem,
  onClearAll,
}: QRHistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = historyItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      (item.format && item.format.toLowerCase().includes(q)) ||
      item.options.dotShape.toLowerCase().includes(q)
    );
  });

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDirectDownload = async (item: QRHistoryItem, format: ExportFormat = 'PNG') => {
    setDownloadingId(`${item.id}-${format}`);
    try {
      const result = await exportQRCode(item.options, format);
      triggerDownload(result);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Controls Bar */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search recent codes by title, payload URL, or module shape..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-black bg-[#fafaf8] font-mono text-xs text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:shadow-[2px_2px_0px_#000000] transition-all"
          />
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSaveCurrent}
            className="flex items-center gap-1.5 border-2 border-black bg-[#ccff00] px-4 py-2 font-mono text-xs font-black text-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#ccff00] hover:translate-x-[1px] hover:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>SAVE CURRENT CODE</span>
          </button>

          {historyItems.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all stored recent QR codes from local storage?')) {
                  onClearAll();
                }
              }}
              className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-2 font-mono text-xs font-bold text-zinc-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>CLEAR ALL</span>
            </button>
          )}
        </div>

      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000]">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">STORED CODES</div>
          <div className="text-xl font-black text-black mt-0.5">{historyItems.length}</div>
        </div>
        <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000]">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">STORAGE ENGINE</div>
          <div className="text-sm font-black text-emerald-700 mt-1">BROWSER LOCAL STORAGE</div>
        </div>
        <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000]">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">CALIBRATION</div>
          <div className="text-sm font-black text-black mt-1">300 DPI pHYs CHUNKS</div>
        </div>
        <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#000000]">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">RE-ACCESS LATENCY</div>
          <div className="text-sm font-black text-black mt-1">&lt; 1ms (INSTANT)</div>
        </div>
      </div>

      {/* History Grid */}
      {filtered.length === 0 ? (
        <div className="border-2 border-black bg-white p-12 text-center shadow-[6px_6px_0px_#000000] space-y-4">
          <div className="w-12 h-12 border-2 border-black bg-[#ccff00] flex items-center justify-center mx-auto shadow-[3px_3px_0px_#000000]">
            <AlertCircle className="w-6 h-6 text-black" />
          </div>
          <div>
            <h4 className="text-lg font-black uppercase text-black">NO STORED CODES FOUND</h4>
            <p className="font-mono text-xs text-zinc-600 mt-1 max-w-md mx-auto">
              {searchQuery
                ? `No recent QR codes match "${searchQuery}". Try a different keyword.`
                : 'Your local storage history is currently empty. Generate a QR code or click "Save Current Code" above to pin it.'}
            </p>
          </div>
          <button
            onClick={onSaveCurrent}
            className="inline-flex items-center gap-2 border-2 border-black bg-black text-[#ccff00] px-5 py-2.5 font-mono text-xs font-black shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>BOOKMARK CURRENT CODE NOW</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isCurrentlyActive =
              item.content === currentOptions.text &&
              item.options.foregroundColor === currentOptions.foregroundColor &&
              item.options.dotShape === currentOptions.dotShape;

            return (
              <div
                key={item.id}
                className={`border-2 border-black bg-white transition-all flex flex-col justify-between ${
                  isCurrentlyActive
                    ? 'shadow-[6px_6px_0px_#ccff00] ring-1 ring-black'
                    : 'shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000]'
                }`}
              >
                <div>
                  
                  {/* Header Strip with Date and Format Badge */}
                  <div className="border-b-2 border-black bg-zinc-100 px-4 py-2.5 flex items-center justify-between font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
                      <span className="text-zinc-600 font-bold">{item.dateFormatted}</span>
                      {isCurrentlyActive && (
                        <span className="border border-black bg-[#ccff00] text-black px-1.5 py-0.2 text-[9px] font-black uppercase">
                          CURRENTLY LOADED
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.format && (
                        <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-black text-black">
                          {item.format}
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        title="Remove from history"
                        className="p-1 hover:bg-rose-100 hover:text-rose-600 text-zinc-400 transition-colors cursor-pointer border border-transparent hover:border-black"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      
                      {/* Visual QR Thumbnail Box */}
                      <div
                        className="w-24 h-24 border-2 border-black p-1 shrink-0 flex items-center justify-center shadow-[3px_3px_0px_#000000] relative group cursor-pointer"
                        style={{ backgroundColor: item.options.backgroundColor }}
                        onClick={() => onSelectCode(item.options, 'studio')}
                        title="Click to load into 300 DPI Studio"
                      >
                        {item.previewDataUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={item.previewDataUrl}
                            alt={item.title}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center text-white font-mono text-[9px] font-black">
                            QR PREVIEW
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#ccff00] font-mono text-[9px] font-black uppercase text-center p-1">
                          RE-OPEN IN STUDIO
                        </div>
                      </div>

                      {/* Metadata Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h4 className="font-mono text-sm font-black text-black uppercase tracking-tight truncate">
                          {item.title}
                        </h4>

                      {/* Content snippet */}
                      <div className="border border-zinc-200 bg-[#fafaf8] p-2 flex items-center justify-between font-mono text-[11px] text-zinc-700">
                        <span className="truncate pr-2">{item.content}</span>
                        <button
                          onClick={() => handleCopy(item.content, item.id)}
                          title="Copy content"
                          className="p-1 hover:bg-zinc-200 text-zinc-600 transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Specification Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="border border-black bg-white px-1.5 py-0.5 font-mono text-[9px] font-black text-black">
                          SHAPE: {item.options.dotShape.toUpperCase()}
                        </span>
                        <span
                          className={`border border-black px-1.5 py-0.5 font-mono text-[9px] font-black ${
                            item.contrast >= 7
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.contrast}:1 CONTRAST
                        </span>
                        <span className="border border-black bg-zinc-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-zinc-700">
                          EC: LEVEL {item.options.errorCorrectionLevel || 'M'}
                        </span>
                      </div>

                    </div>

                  </div>
                </div>

              </div>

              {/* Action Buttons Footer with Format Selector (PNG, SVG, PDF) */}
              <div className="border-t-2 border-black bg-[#fafaf8] p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    onClick={() => onSelectCode(item.options, 'studio')}
                    className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-[#ccff00] text-black py-1.5 px-2 font-mono text-[11px] font-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#ccff00] transition-all cursor-pointer"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>STUDIO</span>
                  </button>

                  <button
                    onClick={() => onSelectCode(item.options, 'event')}
                    className="flex-1 flex items-center justify-center gap-1 border-2 border-black bg-white text-black py-1.5 px-2 font-mono text-[11px] font-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>PASS</span>
                  </button>
                </div>

                {/* 300 DPI Format Buttons (PNG, SVG, PDF) */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase pr-0.5">300 DPI:</span>
                  {(['PNG', 'SVG', 'PDF'] as ExportFormat[]).map((fmt) => {
                    const isBusy = downloadingId === `${item.id}-${fmt}`;
                    return (
                      <button
                        key={fmt}
                        onClick={() => handleDirectDownload(item, fmt)}
                        disabled={!!downloadingId}
                        title={`Export 300 DPI ${fmt}`}
                        className={`px-2 py-1 border border-black font-mono text-[10px] font-black transition-all cursor-pointer disabled:opacity-50 ${
                          fmt === 'PDF'
                            ? 'bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black'
                            : 'bg-white text-black hover:bg-zinc-200'
                        }`}
                      >
                        {isBusy ? '...' : fmt}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
        </div>
      )}

    </div>
  );
}
