import JsBarcode from 'jsbarcode';
import { jsPDF } from 'jspdf';
import { insertDpiIntoPngBlob } from './qr-engine';

export type BarcodeFormat =
  | 'CODE128'
  | 'EAN13'
  | 'UPC'
  | 'EAN8'
  | 'CODE39'
  | 'ITF14'
  | 'ITF'
  | 'pharmacode'
  | 'codabar'
  | 'MSI';

export interface BarcodeDefinition {
  format: BarcodeFormat;
  name: string;
  category: 'Logistics' | 'Retail' | 'Specialty' | 'Industrial';
  standard: string;
  defaultPayload: string;
  description: string;
  placeholder: string;
  allowedChars: string;
  maxLen?: number;
}

export const BARCODE_CATALOG: BarcodeDefinition[] = [
  {
    format: 'CODE128',
    name: 'Code 128 (Universal)',
    category: 'Logistics',
    standard: 'ISO/IEC 15417',
    defaultPayload: 'PKG-2026-984712',
    description: 'High-density alphanumeric standard used for shipping, Amazon FNSKU, logistics and supply chain.',
    placeholder: 'Any alphanumeric text (e.g. PKG-2026-X9)',
    allowedChars: 'Full 128 ASCII table',
  },
  {
    format: 'EAN13',
    name: 'EAN-13 (Global Retail)',
    category: 'Retail',
    standard: 'ISO/IEC 15420',
    defaultPayload: '9780132350884',
    description: 'Worldwide retail standard (supermarkets, books/ISBN, consumer packaged goods). 12 or 13 digits.',
    placeholder: '12 or 13 digits (e.g. 9780132350884)',
    allowedChars: 'Numeric only (12 or 13 digits)',
    maxLen: 13,
  },
  {
    format: 'UPC',
    name: 'UPC-A (North America)',
    category: 'Retail',
    standard: 'GS1 Standard',
    defaultPayload: '012345678905',
    description: 'Primary retail barcode across the United States and Canada. 11 or 12 digits.',
    placeholder: '11 or 12 digits (e.g. 012345678905)',
    allowedChars: 'Numeric only (11 or 12 digits)',
    maxLen: 12,
  },
  {
    format: 'CODE39',
    name: 'Code 39 (Industrial)',
    category: 'Industrial',
    standard: 'ANSI/AIM BC1',
    defaultPayload: 'ASSET-8849',
    description: 'Self-checking alphanumeric barcode standard widely used in automotive, defense, and asset management.',
    placeholder: 'Capital letters, numbers, -, ., $, /, +, %, space',
    allowedChars: 'A-Z, 0-9, -, ., $, /, +, %, space',
  },
  {
    format: 'ITF14',
    name: 'ITF-14 (Shipping Master Carton)',
    category: 'Logistics',
    standard: 'GS1 General Spec',
    defaultPayload: '10012345678902',
    description: 'Interleaved 2 of 5 with thick bearer bars. Engineered for corrugated shipping cartons and freight.',
    placeholder: '13 or 14 digits (e.g. 10012345678902)',
    allowedChars: 'Numeric only (13 or 14 digits)',
    maxLen: 14,
  },
  {
    format: 'EAN8',
    name: 'EAN-8 (Compact Retail)',
    category: 'Retail',
    standard: 'ISO/IEC 15420',
    defaultPayload: '96385074',
    description: 'Condensed 8-digit barcode for small retail packaging like confectionery, cosmetics, and pens.',
    placeholder: '7 or 8 digits (e.g. 96385074)',
    allowedChars: 'Numeric only (7 or 8 digits)',
    maxLen: 8,
  },
  {
    format: 'pharmacode',
    name: 'Pharmacode (Pharmaceutical)',
    category: 'Specialty',
    standard: 'Laetus Standard',
    defaultPayload: '12345',
    description: 'Single-track binary code used on prescription medication cartons as packing control verification.',
    placeholder: 'Number from 3 to 131070',
    allowedChars: 'Numeric integer (3 to 131070)',
  },
  {
    format: 'codabar',
    name: 'Codabar (Blood Bank & Libraries)',
    category: 'Specialty',
    standard: 'AIM BC3',
    defaultPayload: 'A123456789B',
    description: 'Character set starting and ending with A, B, C, or D. Used in FedEx airbills, blood banks, and libraries.',
    placeholder: 'Starts/ends with A, B, C, or D (e.g. A123456789B)',
    allowedChars: '0-9, -, $, :, /, ., + and start/stop chars A, B, C, D',
  },
  {
    format: 'ITF',
    name: 'ITF (Interleaved 2 of 5)',
    category: 'Industrial',
    standard: 'USS ITF 2/5',
    defaultPayload: '12345678',
    description: 'High-density numeric code where even number of digits are interleaved.',
    placeholder: 'Even number of digits (e.g. 12345678)',
    allowedChars: 'Numeric digits (even length)',
  },
  {
    format: 'MSI',
    name: 'MSI Plessey (Shelf Tags)',
    category: 'Retail',
    standard: 'Plessey System',
    defaultPayload: '1234567',
    description: 'Used primarily for supermarket inventory control, warehouse storage shelves, and marking.',
    placeholder: 'Numeric digits (e.g. 1234567)',
    allowedChars: 'Numeric digits 0-9',
  },
];

export interface BarcodeOptions {
  format: BarcodeFormat;
  payload: string;
  width: number;       // line width 1 - 5
  height: number;      // height in px 30 - 200
  displayValue: boolean;
  font: string;
  fontSize: number;
  textMargin: number;
  textAlign: 'left' | 'center' | 'right';
  textPosition: 'bottom' | 'top';
  background: string;  // default #ffffff
  lineColor: string;   // default #000000
  margin: number;      // quiet zone margin
  dpi: 300 | 600 | 150 | 72;
}

export const DEFAULT_BARCODE_OPTIONS: BarcodeOptions = {
  format: 'CODE128',
  payload: 'PKG-2026-984712',
  width: 2,
  height: 90,
  displayValue: true,
  font: 'monospace',
  fontSize: 16,
  textMargin: 6,
  textAlign: 'center',
  textPosition: 'bottom',
  background: '#ffffff',
  lineColor: '#000000',
  margin: 15,
  dpi: 300,
};

/**
 * Calculates Modulo 10 check digit for EAN/UPC/ITF numbers
 */
export function calculateCheckDigit(digits: string, weights: [number, number] = [3, 1]): number {
  const clean = digits.replace(/\D/g, '');
  let sum = 0;
  // Compute from right to left
  for (let i = clean.length - 1, step = 0; i >= 0; i--, step++) {
    const digit = parseInt(clean[i], 10);
    const weight = step % 2 === 0 ? weights[0] : weights[1];
    sum += digit * weight;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Sanitizes and auto-fixes payload for strict formats like EAN-13, UPC-A, ITF-14
 */
export function sanitizeBarcodePayload(format: BarcodeFormat, input: string): string {
  if (!input) return '';
  const digitsOnly = input.replace(/\D/g, '');

  switch (format) {
    case 'EAN13': {
      if (digitsOnly.length === 12) {
        return digitsOnly + calculateCheckDigit(digitsOnly, [3, 1]);
      }
      if (digitsOnly.length >= 13) {
        const base = digitsOnly.slice(0, 12);
        return base + calculateCheckDigit(base, [3, 1]);
      }
      return digitsOnly.padEnd(12, '0') + calculateCheckDigit(digitsOnly.padEnd(12, '0'), [3, 1]);
    }
    case 'UPC': {
      if (digitsOnly.length === 11) {
        return digitsOnly + calculateCheckDigit(digitsOnly, [3, 1]);
      }
      if (digitsOnly.length >= 12) {
        const base = digitsOnly.slice(0, 11);
        return base + calculateCheckDigit(base, [3, 1]);
      }
      return digitsOnly.padEnd(11, '0') + calculateCheckDigit(digitsOnly.padEnd(11, '0'), [3, 1]);
    }
    case 'EAN8': {
      if (digitsOnly.length === 7) {
        return digitsOnly + calculateCheckDigit(digitsOnly, [3, 1]);
      }
      if (digitsOnly.length >= 8) {
        const base = digitsOnly.slice(0, 7);
        return base + calculateCheckDigit(base, [3, 1]);
      }
      return digitsOnly.padEnd(7, '0') + calculateCheckDigit(digitsOnly.padEnd(7, '0'), [3, 1]);
    }
    case 'ITF14': {
      if (digitsOnly.length === 13) {
        return digitsOnly + calculateCheckDigit(digitsOnly, [3, 1]);
      }
      if (digitsOnly.length >= 14) {
        const base = digitsOnly.slice(0, 13);
        return base + calculateCheckDigit(base, [3, 1]);
      }
      return digitsOnly.padEnd(13, '0') + calculateCheckDigit(digitsOnly.padEnd(13, '0'), [3, 1]);
    }
    case 'ITF': {
      // Must be even number of digits
      return digitsOnly.length % 2 === 0 ? digitsOnly : '0' + digitsOnly;
    }
    case 'pharmacode': {
      const num = parseInt(digitsOnly, 10);
      if (isNaN(num) || num < 3) return '3';
      if (num > 131070) return '131070';
      return String(num);
    }
    case 'codabar': {
      let upper = input.toUpperCase().replace(/[^0-9\-\$:\/\.\+ABCD]/g, '');
      if (!upper) return 'A00B';
      if (!['A', 'B', 'C', 'D'].includes(upper[0])) upper = 'A' + upper;
      if (!['A', 'B', 'C', 'D'].includes(upper[upper.length - 1])) upper = upper + 'B';
      return upper;
    }
    case 'CODE39': {
      return input.toUpperCase().replace(/[^0-9A-Z\-\.\ \$\/\+\%]/g, '');
    }
    case 'CODE128':
    case 'MSI':
    default:
      return input;
  }
}

/**
 * Renders barcode to HTMLCanvasElement using JsBarcode
 */
export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  options: BarcodeOptions
): { success: boolean; error?: string } {
  try {
    const sanitized = sanitizeBarcodePayload(options.format, options.payload);
    JsBarcode(canvas, sanitized, {
      format: options.format,
      width: options.width,
      height: options.height,
      displayValue: options.displayValue,
      font: options.font,
      fontSize: options.fontSize,
      textMargin: options.textMargin,
      textAlign: options.textAlign,
      textPosition: options.textPosition,
      background: options.background,
      lineColor: options.lineColor,
      margin: options.margin,
    });
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

/**
 * Generates an SVG string of the barcode
 */
export function generateBarcodeSVG(options: BarcodeOptions): string {
  try {
    const svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const sanitized = sanitizeBarcodePayload(options.format, options.payload);
    JsBarcode(svgElem, sanitized, {
      format: options.format,
      width: options.width,
      height: options.height,
      displayValue: options.displayValue,
      font: options.font,
      fontSize: options.fontSize,
      textMargin: options.textMargin,
      textAlign: options.textAlign,
      textPosition: options.textPosition,
      background: options.background,
      lineColor: options.lineColor,
      margin: options.margin,
    });
    return new XMLSerializer().serializeToString(svgElem);
  } catch (err) {
    console.error('SVG Barcode generation failed:', err);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100"><text x="10" y="50" fill="red">Barcode Syntax Error</text></svg>`;
  }
}

/**
 * Exports barcode as high-resolution 300 DPI PNG with physical pHYs metadata
 */
export async function exportBarcodePNG(
  options: BarcodeOptions,
  multiplier: number = 2
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const offscreen = document.createElement('canvas');
  const sanitized = sanitizeBarcodePayload(options.format, options.payload);

  JsBarcode(offscreen, sanitized, {
    format: options.format,
    width: options.width * multiplier,
    height: options.height * multiplier,
    displayValue: options.displayValue,
    font: options.font,
    fontSize: options.fontSize * multiplier,
    textMargin: options.textMargin * multiplier,
    textAlign: options.textAlign,
    textPosition: options.textPosition,
    background: options.background,
    lineColor: options.lineColor,
    margin: options.margin * multiplier,
  });

  return new Promise((resolve, reject) => {
    offscreen.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from barcode canvas'));
        return;
      }
      try {
        const dpiBlob = await insertDpiIntoPngBlob(blob, options.dpi || 300);
        const dataUrl = URL.createObjectURL(dpiBlob);
        const filename = `Barcode-${options.format}-${sanitized.replace(/[^a-zA-Z0-9_-]/g, '_')}-${options.dpi}DPI.png`;
        resolve({ blob: dpiBlob, dataUrl, filename });
      } catch (e) {
        reject(e);
      }
    }, 'image/png');
  });
}

/**
 * Generates an ISO Print Specimen Card & Label Sheet PDF for standard barcode thermal/laser printers
 */
export async function exportBarcodePDF(
  options: BarcodeOptions
): Promise<{ blob: Blob; dataUrl: string; filename: string }> {
  const offscreen = document.createElement('canvas');
  const sanitized = sanitizeBarcodePayload(options.format, options.payload);

  JsBarcode(offscreen, sanitized, {
    format: options.format,
    width: options.width * 2,
    height: options.height * 2,
    displayValue: options.displayValue,
    font: options.font,
    fontSize: options.fontSize * 2,
    textMargin: options.textMargin * 2,
    textAlign: options.textAlign,
    textPosition: options.textPosition,
    background: options.background,
    lineColor: options.lineColor,
    margin: options.margin * 2,
  });

  const barcodeImg = offscreen.toDataURL('image/png');

  // Standard 4" x 3" Shipping / Asset Label Card (101.6 x 76.2 mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [102, 76],
  });

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 102, 76, 'F');

  // Outer border & crop marks
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(4, 4, 94, 68, 'S');

  // Header Ribbon
  doc.setFillColor(204, 255, 0); // #ccff00
  doc.rect(4, 4, 94, 9, 'F');
  doc.rect(4, 4, 94, 9, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`BARCODE SPECIMEN // ${options.format} (${options.dpi} DPI)`, 7, 10);

  // Barcode Image centered on card
  const imgWidth = 84;
  const imgHeight = (offscreen.height / offscreen.width) * imgWidth;
  const imgY = 17 + Math.max(0, (44 - imgHeight) / 2);

  doc.addImage(barcodeImg, 'PNG', 9, imgY, imgWidth, Math.min(imgHeight, 46));

  // Footer metadata
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);
  doc.text(`PAYLOAD: ${sanitized}`, 7, 68);
  doc.text(`SYMBOLOGY: ${options.format} · PRINT READY 300 DPI`, 60, 68);

  const pdfBlob = doc.output('blob');
  const dataUrl = URL.createObjectURL(pdfBlob);
  const filename = `Barcode-Label-${options.format}-${sanitized.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

  return { blob: pdfBlob, dataUrl, filename };
}
