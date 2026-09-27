'use client';

import React, { useState, ChangeEvent } from 'react';
import JSZip from 'jszip';
import {
  Layers,
  Upload,
  Download,
  FileSpreadsheet,
  Search,
  RefreshCw,
  Eye,
  ShieldCheck,
  FileArchive,
} from 'lucide-react';
import {
  QROptions,
  renderQRToCanvas,
  insertDpiIntoPngBlob,
} from '@/lib/qr-engine';

export interface BatchItem {
  id: string;
  title: string;
  payload: string;
  category?: string;
  dataUrl?: string;
  status: 'pending' | 'rendered' | 'error';
}

interface BatchProcessorProps {
  baseOptions: QROptions;
}

const SAMPLE_DEV_BADGES = [
  { title: 'Sarah Connor', payload: 'PASS: VIP-001 | NAME: Sarah Connor | TIER: Keynote VIP | SUMMIT: Global AI 2026' },
  { title: 'Marcus Vance', payload: 'PASS: VIP-002 | NAME: Marcus Vance | TIER: Neural Architect | SUMMIT: Global AI 2026' },
  { title: 'Elena Rostova', payload: 'PASS: VIP-003 | NAME: Elena Rostova | TIER: Quantum AI Fellow | SUMMIT: Global AI 2026' },
  { title: 'Tariq Al-Mansoor', payload: 'PASS: VIP-004 | NAME: Tariq Al-Mansoor | TIER: Core Contributor | SUMMIT: Global AI 2026' },
  { title: 'Kenji Sato', payload: 'PASS: VIP-005 | NAME: Kenji Sato | TIER: Robotics Lead | SUMMIT: Global AI 2026' },
  { title: 'Aria Montgomery', payload: 'PASS: VIP-006 | NAME: Aria Montgomery | TIER: Speaker Delegate | SUMMIT: Global AI 2026' },
  { title: 'Devon Hayes', payload: 'PASS: VIP-007 | NAME: Devon Hayes | TIER: Workshop Lab | SUMMIT: Global AI 2026' },
  { title: 'Priya Sharma', payload: 'PASS: VIP-008 | NAME: Priya Sharma | TIER: Founder Track | SUMMIT: Global AI 2026' },
  { title: 'Liam O’Connor', payload: 'PASS: VIP-009 | NAME: Liam O’Connor | TIER: Staff Engineer | SUMMIT: Global AI 2026' },
  { title: 'Zoe Kravitz', payload: 'PASS: VIP-010 | NAME: Zoe Kravitz | TIER: Quantum Dev Tier | SUMMIT: Global AI 2026' },
];

export function BatchProcessor({ baseOptions }: BatchProcessorProps) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [rawText, setRawText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [forceBW, setForceBW] = useState(true);
  const [targetDpi, setTargetDpi] = useState<72 | 300>(300);
  const [selectedPreview, setSelectedPreview] = useState<BatchItem | null>(null);

  // Load sample dataset
  const handleLoadSample = (count: number = 10) => {
    let dataset: BatchItem[] = [];
    if (count <= 10) {
      dataset = SAMPLE_DEV_BADGES.slice(0, count).map((d, i) => ({
        id: `badge-${i + 1}`,
        title: d.title,
        payload: d.payload,
        status: 'pending',
      }));
    } else {
      // Generate up to 100 entries for batch stress testing
      for (let i = 1; i <= count; i++) {
        const seedName = SAMPLE_DEV_BADGES[(i - 1) % SAMPLE_DEV_BADGES.length].title;
        dataset.push({
          id: `badge-${i}`,
          title: `${seedName} #${i}`,
          payload: `PASS: DEV-2026-${1000 + i} | NAME: ${seedName} | SUMMIT: Global AI & Next-Gen Summit | VERIFY: https://qrject.dev/v/${1000 + i}`,
          status: 'pending',
        });
      }
    }
    setItems(dataset);
  };

  // Parse raw pasted lines
  const handleParseRawText = () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsed: BatchItem[] = lines.map((line, idx) => {
      // Check if comma-separated: Title, Payload
      if (line.includes(',')) {
        const parts = line.split(',');
        return {
          id: `item-${idx + 1}`,
          title: parts[0].trim(),
          payload: parts.slice(1).join(',').trim(),
          status: 'pending',
        };
      }
      return {
        id: `item-${idx + 1}`,
        title: `Item #${idx + 1}`,
        payload: line,
        status: 'pending',
      };
    });

    setItems(parsed);
  };

  // CSV file upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const parsed: BatchItem[] = [];

      // Check header row
      const startIndex = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('title') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // CSV split respecting quotes
        if (parts.length >= 2) {
          parsed.push({
            id: `csv-${i}`,
            title: parts[0].replace(/^"|"$/g, '').trim(),
            payload: parts[1].replace(/^"|"$/g, '').trim(),
            status: 'pending',
          });
        } else {
          parsed.push({
            id: `csv-${i}`,
            title: `Row ${i}`,
            payload: line.trim(),
            status: 'pending',
          });
        }
      }
      setItems(parsed);
    };
    reader.readAsText(file);
  };

  // Run Batch Generation
  const handleGenerateBatch = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    setProgress(0);

    const canvas = document.createElement('canvas');
    const updated = [...items];
    const total = updated.length;

    // Determine color scheme: pure black and white if forceBW is true
    const batchOptions: QROptions = {
      ...baseOptions,
      foregroundColor: forceBW ? '#000000' : baseOptions.foregroundColor,
      backgroundColor: forceBW ? '#ffffff' : baseOptions.backgroundColor,
      gradientEnabled: forceBW ? false : baseOptions.gradientEnabled,
      eyeOuterColor: forceBW ? '#000000' : baseOptions.eyeOuterColor,
      eyeInnerColor: forceBW ? '#000000' : baseOptions.eyeInnerColor,
      targetSizePx: targetDpi === 300 ? 1200 : 600,
    };

    for (let i = 0; i < total; i++) {
      try {
        await renderQRToCanvas(canvas, {
          ...batchOptions,
          text: updated[i].payload,
        });

        updated[i].dataUrl = canvas.toDataURL('image/png');
        updated[i].status = 'rendered';
      } catch (err) {
        console.error('Failed to render QR for item', updated[i], err);
        updated[i].status = 'error';
      }

      setProgress(Math.round(((i + 1) / total) * 100));

      // Yield thread briefly every 5 items to keep browser responsive
      if (i % 5 === 0) {
        await new Promise((r) => setTimeout(r, 0));
        setItems([...updated]);
      }
    }

    setItems([...updated]);
    setIsProcessing(false);
  };

  // Download All as ZIP archive
  const handleDownloadZip = async () => {
    const renderedItems = items.filter((item) => item.status === 'rendered');
    if (renderedItems.length === 0) return;

    setIsProcessing(true);
    const zip = new JSZip();
    const folder = zip.folder('QR_Batch_Export_300DPI');

    for (let i = 0; i < renderedItems.length; i++) {
      const item = renderedItems[i];
      if (!item.dataUrl) continue;

      // Extract base64 data
      const base64Data = item.dataUrl.replace(/^data:image\/png;base64,/, '');
      const binary = atob(base64Data);
      const array = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        array[j] = binary.charCodeAt(j);
      }

      // Embed 300 DPI chunk
      const originalBlob = new Blob([array], { type: 'image/png' });
      const dpiBlob = await insertDpiIntoPngBlob(originalBlob, targetDpi);
      const dpiArray = await dpiBlob.arrayBuffer();

      const safeName = item.title.replace(/[^a-z0-9_-]/gi, '_');
      folder?.file(`${String(i + 1).padStart(3, '0')}_${safeName}.png`, dpiArray);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_Batch_Export_${renderedItems.length}_Codes_${targetDpi}DPI.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setIsProcessing(false);
  };

  // Filter items by search query
  const filteredItems = items.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.payload.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderedCount = items.filter((i) => i.status === 'rendered').length;

  return (
    <div className="w-full max-w-6xl space-y-6">
      {/* Top Banner / Configuration Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Batch QR Code Generator
              </h2>
              <p className="text-xs text-slate-400">
                Generate dozens or hundreds of high-contrast 300 DPI codes simultaneously with instant ZIP export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleLoadSample(10)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Load 10 Badges
            </button>
            <button
              onClick={() => handleLoadSample(50)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Load 50 Badges
            </button>
            <button
              onClick={() => handleLoadSample(100)}
              className="px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 transition-colors"
            >
              Load 100 Badges
            </button>
          </div>
        </div>

        {/* Input Methods Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Method A: Paste Text / Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">
                Option 1: Paste Text or URLs (one per line)
              </span>
              <span className="text-[11px] text-slate-500">Format: Title, Content</span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder={`Alexandria Vance, https://qrject.dev/pass/101\nSarah Connor, https://qrject.dev/pass/102\nDev VIP, https://qrject.dev/pass/103`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              onClick={handleParseRawText}
              disabled={!rawText.trim()}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              Parse Pasted Lines ({rawText.split('\n').filter((l) => l.trim()).length} rows)
            </button>
          </div>

          {/* Method B: Upload CSV */}
          <div className="space-y-2 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Option 2: Upload CSV / Excel Spreadsheet
            </span>
            <div className="p-4 border border-dashed border-slate-700 rounded-xl bg-slate-950/60 text-center flex-1 flex flex-col items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2" />
              <div className="text-xs font-medium text-slate-200">
                Drag & drop or browse CSV file
              </div>
              <div className="text-[10px] text-slate-500 mb-3">
                First column: Title/Name · Second column: URL or Token
              </div>
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload CSV</span>
                <input
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Batch Options & Strict Scanner Compatibility Toggle */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* High Contrast Shield Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <input
              type="checkbox"
              checked={forceBW}
              onChange={(e) => setForceBW(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
            />
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Strict Scanner B&W Mode</span>
              </div>
              <div className="text-[10px] text-slate-400">
                100% optical camera readability (21:1 contrast)
              </div>
            </div>
          </label>

          {/* Target DPI Selector */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Export Print Resolution:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setTargetDpi(72)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                  targetDpi === 72 ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400'
                }`}
              >
                72 DPI
              </button>
              <button
                type="button"
                onClick={() => setTargetDpi(300)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                  targetDpi === 300 ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-400'
                }`}
              >
                300 DPI
              </button>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateBatch}
              disabled={items.length === 0 || isProcessing}
              className="flex-1 py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isProcessing
                  ? `Rendering (${progress}%)`
                  : `Generate ${items.length} Codes`}
              </span>
            </button>

            {renderedCount > 0 && (
              <button
                onClick={handleDownloadZip}
                disabled={isProcessing}
                className="py-2 px-3.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:opacity-90 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center gap-1.5"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>ZIP ({renderedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs font-mono text-cyan-400">
              <span>Rendering batch QR matrix...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-pink-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Batch Results Grid & Search Filter */}
      {items.length > 0 && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                Queue Matrix ({items.length} Total · {renderedCount} Rendered)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title or payload..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {renderedCount > 0 && (
                <button
                  onClick={handleDownloadZip}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download ZIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                    {item.status === 'rendered' ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                    ) : item.status === 'error' ? (
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                    )}
                  </div>

                  {/* QR Image Box */}
                  <div className="aspect-square w-full rounded-lg bg-white p-1.5 flex items-center justify-center overflow-hidden shadow-inner">
                    {item.dataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.dataUrl}
                        alt={item.title}
                        className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                        onClick={() => setSelectedPreview(item)}
                      />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 text-center">
                        Waiting render...
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-bold text-white truncate" title={item.title}>
                      {item.title}
                    </div>
                    <div
                      className="text-[10px] font-mono text-slate-400 truncate mt-0.5"
                      title={item.payload}
                    >
                      {item.payload}
                    </div>
                  </div>
                </div>

                {item.dataUrl && (
                  <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPreview(item)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect</span>
                    </button>
                    <a
                      href={item.dataUrl}
                      download={`QR-${item.title}.png`}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Save</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inspect Modal */}
      {selectedPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPreview(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono uppercase text-cyan-400 font-bold">
                Batch Code Inspector
              </span>
              <button
                onClick={() => setSelectedPreview(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-center">
              {selectedPreview.dataUrl && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedPreview.dataUrl}
                  alt={selectedPreview.title}
                  className="w-56 h-56 object-contain"
                />
              )}
            </div>

            <div>
              <div className="text-sm font-bold text-white">{selectedPreview.title}</div>
              <div className="text-xs font-mono text-slate-400 break-all mt-1 bg-slate-950 p-2 rounded-lg border border-slate-800">
                {selectedPreview.payload}
              </div>
            </div>

            <div className="flex gap-2">
              {selectedPreview.dataUrl && (
                <a
                  href={selectedPreview.dataUrl}
                  download={`QR-${selectedPreview.title}-300DPI.png`}
                  className="flex-1 py-2 text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition-colors"
                >
                  Download High-Res PNG
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
