import { QROptions, renderQRToCanvas, calculateContrastRatio } from './qr-engine';

export interface QRHistoryItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
  dateFormatted: string;
  options: QROptions;
  previewDataUrl?: string;
  format?: string;
  contrast: number;
  userEmail?: string;
}

const STORAGE_KEY = 'qrject_recent_codes_v2';
const MAX_HISTORY_ITEMS = 25;

export async function generateQRThumbnail(options: QROptions): Promise<string> {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 160;
    await renderQRToCanvas(canvas, {
      ...options,
      targetSizePx: 160,
    });
    return canvas.toDataURL('image/png', 0.85);
  } catch (err) {
    console.warn('Failed to generate QR thumbnail:', err);
    return '';
  }
}

export function getInitialDefaultSeeds(): QRHistoryItem[] {
  return [
    {
      id: 'seed-summit-pass',
      title: 'Global AI Summit 2026 // VIP Pass',
      content: 'नमो नमः मित्रवर्ग! भवतः दिनं शुभं मङ्गलमयं च भूयात्।',
      timestamp: Date.now() - 3600000 * 2,
      dateFormatted: 'Today, 2h ago',
      contrast: 21.0,
      format: '300 DPI PNG',
      options: {
        text: 'नमो नमः मित्रवर्ग! भवतः दिनं शुभं मङ्गलमयं च भूयात्।',
        foregroundColor: '#000000',
        backgroundColor: '#ffffff',
        gradientEnabled: false,
        dotShape: 'square',
        eyeFrameShape: 'square',
        eyeBallShape: 'square',
        errorCorrectionLevel: 'H',
        dpi: 300,
        targetSizePx: 1000,
      },
    },
    {
      id: 'seed-architect-profile',
      title: 'Principal Architect // Contact Matrix',
      content: 'NEERAJ REKWAR // SENIOR SYSTEMS & FULLSTACK ARCHITECT\nPORTFOLIO: https://qrject.dev\nSTATUS: AVAILABLE Q4 2026\nCONTACT: neerajrekwar817@gmail.com',
      timestamp: Date.now() - 3600000 * 8,
      dateFormatted: 'Today, 8h ago',
      contrast: 21.0,
      format: '600 DPI Master',
      options: {
        text: 'NEERAJ REKWAR // SENIOR SYSTEMS & FULLSTACK ARCHITECT\nPORTFOLIO: https://qrject.dev\nSTATUS: AVAILABLE Q4 2026\nCONTACT: neerajrekwar817@gmail.com',
        foregroundColor: '#000000',
        backgroundColor: '#ffffff',
        gradientEnabled: false,
        dotShape: 'square',
        eyeFrameShape: 'square',
        eyeBallShape: 'square',
        errorCorrectionLevel: 'H',
        dpi: 300,
        targetSizePx: 1000,
      },
    },
    {
      id: 'seed-cyber-gateway',
      title: 'KubeSentinel Telemetry API Endpoint',
      content: 'https://api.telemetry.mesh.internal/v2/metrics/stream?token=x9a44f',
      timestamp: Date.now() - 86400000,
      dateFormatted: 'Yesterday',
      contrast: 8.6,
      format: 'Vector SVG',
      options: {
        text: 'https://api.telemetry.mesh.internal/v2/metrics/stream?token=x9a44f',
        foregroundColor: '#0284c7',
        backgroundColor: '#ffffff',
        gradientEnabled: true,
        gradientEndColor: '#4f46e5',
        dotShape: 'dots',
        eyeFrameShape: 'rounded',
        eyeBallShape: 'circle',
        errorCorrectionLevel: 'M',
        dpi: 300,
        targetSizePx: 1000,
      },
    },
  ];
}

export function loadQRHistory(): QRHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let localItems: QRHistoryItem[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localItems = parsed;
      }
    } else {
      localItems = getInitialDefaultSeeds();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));
    }

    // Trigger background sync from MongoDB to keep local storage fresh
    fetch('/api/history')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
          // Merge items by ID
          const existingIds = new Set(localItems.map((i) => i.id));
          const toAdd = data.items.filter((it: QRHistoryItem) => !existingIds.has(it.id));
          if (toAdd.length > 0) {
            const merged = [...toAdd, ...localItems].slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            window.dispatchEvent(new Event('qrject_history_updated'));
          }
        }
      })
      .catch(() => {});

    return localItems;
  } catch (err) {
    console.error('Error loading QR history from localStorage:', err);
    return getInitialDefaultSeeds();
  }
}

export function saveQRHistory(items: QRHistoryItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = items.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save QR history to localStorage:', err);
  }
}

export async function addQRToHistory(
  options: QROptions,
  formatLabel: string = '300 DPI PNG',
  customTitle?: string
): Promise<QRHistoryItem[]> {
  const currentHistory = loadQRHistory();
  const contrast = calculateContrastRatio(options.foregroundColor, options.backgroundColor);
  
  // Extract intelligent title
  let title = customTitle || '';
  if (!title) {
    const firstLine = options.text.split('\n')[0].trim();
    if (firstLine.startsWith('http')) {
      try {
        const u = new URL(firstLine);
        title = `${u.hostname}${u.pathname !== '/' ? u.pathname.slice(0, 20) : ''}`;
      } catch {
        title = firstLine.slice(0, 32);
      }
    } else {
      title = firstLine.slice(0, 32) || 'Custom QR Matrix';
    }
  }

  // Generate lightweight thumbnail
  const previewDataUrl = await generateQRThumbnail(options);

  const now = new Date();
  const dateFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
    now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const newItem: QRHistoryItem = {
    id: `qr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title,
    content: options.text,
    timestamp: Date.now(),
    dateFormatted,
    options: { ...options },
    previewDataUrl,
    format: formatLabel,
    contrast: Number(contrast.toFixed(1)),
  };

  // Remove duplicate content if identical options text exists within recent items
  const filtered = currentHistory.filter((item) => {
    return (
      item.content !== newItem.content ||
      item.options.foregroundColor !== newItem.options.foregroundColor ||
      item.options.dotShape !== newItem.options.dotShape
    );
  });

  const updated = [newItem, ...filtered];
  saveQRHistory(updated);

  // Sync to MongoDB database immediately in background
  if (typeof window !== 'undefined') {
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    }).catch((e) => console.warn('Failed to sync history item to MongoDB:', e));
  }

  return updated;
}

export function deleteQRHistoryItem(id: string): QRHistoryItem[] {
  const current = loadQRHistory();
  const updated = current.filter((it) => it.id !== id);
  saveQRHistory(updated);

  // Sync deletion with MongoDB
  if (typeof window !== 'undefined') {
    fetch(`/api/history?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {});
  }

  return updated;
}

export function clearQRHistory(): QRHistoryItem[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/history?clearAll=true', {
      method: 'DELETE',
    }).catch(() => {});
  }
  return [];
}
