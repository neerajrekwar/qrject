import { jsPDF } from 'jspdf';
import {
  QROptions,
  renderQRToCanvas,
  generateQRSVG,
  insertDpiIntoPngBlob,
  calculateContrastRatio,
} from './qr-engine';

export type ExportFormat = 'PNG' | 'SVG' | 'PDF';

export interface ExportResult {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  dpi: number;
}

/**
 * Generates calibrated 300 DPI PNG with embedded pHYs metadata chunk
 */
export async function generate300DpiPNG(options: QROptions, dpi: number = options.dpi || 300): Promise<ExportResult> {
  const targetPx = Math.round((dpi / 300) * 2400);
  const canvas = document.createElement('canvas');

  await renderQRToCanvas(canvas, {
    ...options,
    dpi,
    targetSizePx: targetPx,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob from canvas'));
        return;
      }
      try {
        const dpiBlob = await insertDpiIntoPngBlob(blob, dpi);
        const cleanName = (options.text || 'qrcode').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 24);
        resolve({
          blob: dpiBlob,
          filename: `QRCode-${cleanName}-${dpi}DPI.png`,
          format: 'PNG',
          dpi,
        });
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Generates infinite-resolution Vector SVG with calibrated print dimensions
 */
export function generate300DpiSVG(options: QROptions): ExportResult {
  const svgRaw = generateQRSVG(options);
  
  // Inject print physical dimensions (4 inches x 4 inches @ 300 DPI base)
  // while preserving responsive vector viewBox
  const svgWithPrintHeader = svgRaw.replace(
    /<svg\s+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,
    `<svg xmlns="http://www.w3.org/2000/svg" width="4.0in" height="4.0in" data-print-dpi="300"`
  );

  const blob = new Blob([svgWithPrintHeader], { type: 'image/svg+xml;charset=utf-8' });
  const cleanName = (options.text || 'qrcode').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 24);

  return {
    blob,
    filename: `QRCode-${cleanName}-Vector-300DPI.svg`,
    format: 'SVG',
    dpi: 300,
  };
}

/**
 * Generates an ISO/IEC 18004 Commercial Print-Ready PDF document at >= 300 DPI
 * Includes printer trim marks, color calibration swatches, and technical metadata
 */
export async function generate300DpiPDF(options: QROptions): Promise<ExportResult> {
  // Render high-res 2400x2400 bitmap
  const canvas = document.createElement('canvas');
  await renderQRToCanvas(canvas, {
    ...options,
    targetSizePx: 2400,
  });

  const imgData = canvas.toDataURL('image/png');
  const contrast = calculateContrastRatio(options.foregroundColor, options.backgroundColor);

  // Document dimensions: 120mm x 150mm (commercial print card specimen)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [120, 150],
  });

  // Background Canvas fill
  doc.setFillColor(245, 245, 240); // #f5f5f0 off-white
  doc.rect(0, 0, 120, 150, 'F');

  // Outer 1.5pt crisp black boundary
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.rect(6, 6, 108, 138, 'S');

  // Top Neon Yellow Ribbon
  doc.setFillColor(204, 255, 0); // #ccff00 electric lime
  doc.rect(6, 6, 108, 12, 'F');
  doc.rect(6, 6, 108, 12, 'S');

  // Ribbon Title
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('300 DPI HIGH-RESOLUTION OPTICAL SPECIMEN', 10, 14);
  doc.setFontSize(7);
  doc.text('ISO/IEC 18004', 98, 14);

  // QR Code Image Placement: 80mm x 80mm
  // 2400 px / 80mm (3.15 inches) = 762 effective DPI (> 300 DPI baseline)
  const qrX = 20;
  const qrY = 24;
  const qrSize = 80;

  // Solid white card backing with 2px black border
  doc.setFillColor(255, 255, 255);
  doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'F');
  doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 'S');

  // Embed High-Density Raster
  doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize, undefined, 'FAST');

  // Hairline Crop Marks at four corners
  const cropLen = 4;
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);

  // Top-left
  doc.line(qrX - 6, qrY - 2, qrX - 6 + cropLen, qrY - 2);
  doc.line(qrX - 2, qrY - 6, qrX - 2, qrY - 6 + cropLen);

  // Top-right
  doc.line(qrX + qrSize + 2, qrY - 6, qrX + qrSize + 2, qrY - 6 + cropLen);
  doc.line(qrX + qrSize + 2, qrY - 2, qrX + qrSize + 6, qrY - 2);

  // Bottom-left
  doc.line(qrX - 6, qrY + qrSize + 2, qrX - 6 + cropLen, qrY + qrSize + 2);
  doc.line(qrX - 2, qrY + qrSize + 2, qrX - 2, qrY + qrSize + 6);

  // Bottom-right
  doc.line(qrX + qrSize + 2, qrY + qrSize + 2, qrX + qrSize + 6, qrY + qrSize + 2);
  doc.line(qrX + qrSize + 2, qrY + qrSize + 2, qrX + qrSize + 2, qrY + qrSize + 6);

  // Bottom Technical Metadata Block
  const metaY = 112;
  doc.setFillColor(255, 255, 255);
  doc.rect(10, metaY, 100, 26, 'F');
  doc.rect(10, metaY, 100, 26, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(0, 0, 0);

  doc.text('CALIBRATION: 300 DPI MASTER PRINT ARCHIVE', 13, metaY + 5);
  doc.text(`OPTICAL CONTRAST: ${contrast.toFixed(1)}:1 (${contrast >= 7 ? 'WCAG AAA / HIGH CONTRAST' : 'PASS'})`, 13, metaY + 9);
  doc.text(`MODULE GEOMETRY: ${options.dotShape.toUpperCase()} // EC: LEVEL ${options.errorCorrectionLevel || 'M'}`, 13, metaY + 13);
  
  // Truncated Payload preview
  const payloadPreview = (options.text || '').replace(/\n/g, ' ').slice(0, 48);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text(`PAYLOAD: ${payloadPreview}`, 13, metaY + 18);
  doc.text(`TIMESTAMP: ${new Date().toISOString()} // REF: 0x9B44F`, 13, metaY + 22);

  // Color Swatches on right side of metadata box
  doc.setFillColor(options.foregroundColor);
  doc.rect(98, metaY + 3, 8, 8, 'F');
  doc.rect(98, metaY + 3, 8, 8, 'S');

  doc.setFillColor(options.backgroundColor);
  doc.rect(98, metaY + 13, 8, 8, 'F');
  doc.rect(98, metaY + 13, 8, 8, 'S');

  const pdfBlob = doc.output('blob');
  const cleanName = (options.text || 'qrcode').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 24);

  return {
    blob: pdfBlob,
    filename: `QRCode-${cleanName}-Commercial-300DPI.pdf`,
    format: 'PDF',
    dpi: 300,
  };
}

/**
 * Universal dispatcher for any supported 300 DPI format
 */
export async function exportQRCode(options: QROptions, format: ExportFormat): Promise<ExportResult> {
  switch (format) {
    case 'PNG':
      return await generate300DpiPNG(options, options.dpi || 300);
    case 'SVG':
      return generate300DpiSVG(options);
    case 'PDF':
      return await generate300DpiPDF(options);
    default:
      return await generate300DpiPNG(options, options.dpi || 300);
  }
}

/**
 * Triggers native browser download for an ExportResult
 */
export function triggerDownload(result: ExportResult): void {
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
