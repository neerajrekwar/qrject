import { jsPDF } from 'jspdf';
import { insertDpiIntoPngBlob } from './qr-engine';

export type BWToneMode =
  | 'high-contrast'
  | 'silver-gelatin'
  | 'floyd-steinberg'
  | 'halftone-screen'
  | 'hard-threshold';

export interface PhotoDPIOptions {
  dpi: 72 | 150 | 300 | 600;
  toneMode: BWToneMode;
  contrast: number;      // 0.5 to 3.0 (default: 1.4)
  brightness: number;    // 0.5 to 2.0 (default: 1.0)
  sharpness: number;     // 0 to 100 (default: 30)
  invert: boolean;
  threshold: number;     // 0 to 255 (default: 128)
  halftoneDotSize: number;// 3 to 16 px (default: 6)
  targetWidthInches: number;
  targetHeightInches: number;
  aspectMode: 'cover' | 'contain' | 'original';
}

export interface PhotoDPIExportResult {
  blob: Blob;
  dataUrl: string;
  filename: string;
  format: 'PNG' | 'PDF' | 'SVG';
  widthPx: number;
  heightPx: number;
  dpi: number;
  physicalWidthInches: number;
  physicalHeightInches: number;
}

/**
 * Loads an image from string, File, or Image element
 */
export function loadSourceImage(source: HTMLImageElement | string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (source instanceof HTMLImageElement) {
      if (source.complete && source.naturalWidth > 0) {
        resolve(source);
        return;
      }
      source.onload = () => resolve(source);
      source.onerror = (e) => reject(e);
      return;
    }

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = reader.result as string;
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(source);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = source;
  });
}

/**
 * Renders source image onto canvas with calibrated DPI resolution, monochrome filtering,
 * and high-contrast photographic grain / dithering.
 */
export async function renderPhotoToDPICanvas(
  canvas: HTMLCanvasElement,
  imageSource: HTMLImageElement | string | File,
  options: PhotoDPIOptions
): Promise<{ widthPx: number; heightPx: number }> {
  const img = await loadSourceImage(imageSource);

  const {
    dpi = 300,
    toneMode = 'high-contrast',
    contrast = 1.4,
    brightness = 1.0,
    sharpness = 30,
    invert = false,
    threshold = 128,
    halftoneDotSize = 6,
    targetWidthInches = 5,
    targetHeightInches = 7,
    aspectMode = 'cover',
  } = options;

  let widthPx = Math.round(targetWidthInches * dpi);
  let heightPx = Math.round(targetHeightInches * dpi);

  if (aspectMode === 'original') {
    const aspect = img.naturalWidth / img.naturalHeight;
    if (aspect > 1) {
      widthPx = Math.round(targetWidthInches * dpi);
      heightPx = Math.round(widthPx / aspect);
    } else {
      heightPx = Math.round(targetHeightInches * dpi);
      widthPx = Math.round(heightPx * aspect);
    }
  }

  canvas.width = widthPx;
  canvas.height = heightPx;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { widthPx, heightPx };

  // Fill canvas base with white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, widthPx, heightPx);

  // Compute crop and draw image
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = widthPx / heightPx;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (aspectMode === 'cover') {
    if (imgAspect > canvasAspect) {
      sw = img.naturalHeight * canvasAspect;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasAspect;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, widthPx, heightPx);
  } else if (aspectMode === 'contain') {
    let dw = widthPx;
    let dh = heightPx;
    let dx = 0;
    let dy = 0;

    if (imgAspect > canvasAspect) {
      dh = widthPx / imgAspect;
      dy = (heightPx - dh) / 2;
    } else {
      dw = heightPx * imgAspect;
      dx = (widthPx - dw) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.drawImage(img, 0, 0, widthPx, heightPx);
  }

  // Pixel Manipulation Buffer
  const imgData = ctx.getImageData(0, 0, widthPx, heightPx);
  const data = imgData.data;
  const w = widthPx;
  const h = heightPx;

  // 1. Grayscale & Contrast/Brightness Pass
  const grayBuffer = new Float32Array(w * h);

  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Standard Rec. 601 Luminance
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply contrast and brightness adjustments
    lum = (lum - 128) * contrast + 128 + (brightness - 1.0) * 128;
    if (invert) lum = 255 - lum;

    grayBuffer[idx] = Math.max(0, Math.min(255, lum));
  }

  // 2. Unsharp Mask Sharpness Pass if requested
  if (sharpness > 0) {
    const sharpWeight = (sharpness / 100) * 0.8;
    const copy = new Float32Array(grayBuffer);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const center = copy[y * w + x];
        const blur = (
          copy[(y - 1) * w + x] +
          copy[(y + 1) * w + x] +
          copy[y * w + (x - 1)] +
          copy[y * w + (x + 1)]
        ) * 0.25;

        const sharp = center + (center - blur) * sharpWeight;
        grayBuffer[y * w + x] = Math.max(0, Math.min(255, sharp));
      }
    }
  }

  // 3. Tonal Processing
  if (toneMode === 'floyd-steinberg') {
    // 1-Bit Error Diffusion Dithering
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const oldVal = grayBuffer[idx];
        const newVal = oldVal < threshold ? 0 : 255;
        grayBuffer[idx] = newVal;
        const err = oldVal - newVal;

        if (x + 1 < w) grayBuffer[idx + 1] += (err * 7) / 16;
        if (x - 1 >= 0 && y + 1 < h) grayBuffer[(y + 1) * w + (x - 1)] += (err * 3) / 16;
        if (y + 1 < h) grayBuffer[(y + 1) * w + x] += (err * 5) / 16;
        if (x + 1 < w && y + 1 < h) grayBuffer[(y + 1) * w + (x + 1)] += (err * 1) / 16;
      }
    }
  } else if (toneMode === 'hard-threshold') {
    // Crisp 1-bit high-contrast silhouette
    for (let i = 0; i < grayBuffer.length; i++) {
      grayBuffer[i] = grayBuffer[i] < threshold ? 0 : 255;
    }
  } else if (toneMode === 'halftone-screen') {
    // Optical Half-Tone Screen Dot Matrix
    const dotStep = Math.max(3, halftoneDotSize);
    for (let by = 0; by < h; by += dotStep) {
      for (let bx = 0; bx < w; bx += dotStep) {
        let sum = 0;
        let count = 0;
        for (let dy = 0; dy < dotStep && by + dy < h; dy++) {
          for (let dx = 0; dx < dotStep && bx + dx < w; dx++) {
            sum += grayBuffer[(by + dy) * w + (bx + dx)];
            count++;
          }
        }
        const avgLum = count > 0 ? sum / count : 128;
        const maxRadius = (dotStep / 2) * 1.05;
        const dotRadius = (1 - avgLum / 255) * maxRadius;

        for (let dy = 0; dy < dotStep && by + dy < h; dy++) {
          for (let dx = 0; dx < dotStep && bx + dx < w; dx++) {
            const cx = bx + dotStep / 2;
            const cy = by + dotStep / 2;
            const dist = Math.hypot(bx + dx - cx, by + dy - cy);
            grayBuffer[(by + dy) * w + (bx + dx)] = dist <= dotRadius ? 0 : 255;
          }
        }
      }
    }
  } else if (toneMode === 'silver-gelatin') {
    // Smooth S-curve Darkroom film response
    for (let i = 0; i < grayBuffer.length; i++) {
      const v = grayBuffer[i] / 255;
      // S-curve transfer function
      const s = v < 0.5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
      grayBuffer[i] = Math.round(s * 255);
    }
  }

  // 4. Write back to ImageData
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.round(grayBuffer[i / 4]);
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
  return { widthPx, heightPx };
}

/**
 * Generates 300 DPI / 600 DPI PNG file with physical pHYs metadata chunk
 */
export async function exportPhotoDPI_PNG(
  canvas: HTMLCanvasElement,
  options: PhotoDPIOptions,
  filenamePrefix: string = 'Photo-DPI'
): Promise<PhotoDPIExportResult> {
  const dpi = options.dpi || 300;
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }
      try {
        const dpiBlob = await insertDpiIntoPngBlob(blob, dpi);
        const dataUrl = URL.createObjectURL(dpiBlob);
        const filename = `${filenamePrefix}-${dpi}DPI-${options.toneMode}-${Date.now()}.png`;

        resolve({
          blob: dpiBlob,
          dataUrl,
          filename,
          format: 'PNG',
          widthPx: canvas.width,
          heightPx: canvas.height,
          dpi,
          physicalWidthInches: options.targetWidthInches,
          physicalHeightInches: options.targetHeightInches,
        });
      } catch (err) {
        reject(err);
      }
    }, 'image/png');
  });
}

/**
 * Generates an ISO Print Card PDF with trim crop marks, grayscale density strip, and technical metadata
 */
export async function exportPhotoDPI_PDF(
  canvas: HTMLCanvasElement,
  options: PhotoDPIOptions,
  filenamePrefix: string = 'Photo-Specimen'
): Promise<PhotoDPIExportResult> {
  const dpi = options.dpi || 300;
  const imgData = canvas.toDataURL('image/png');

  // Convert target dimensions in inches to mm
  const wMm = options.targetWidthInches * 25.4;
  const hMm = options.targetHeightInches * 25.4;

  // Margin for crop marks & technical card: 15mm each side
  const pageWMm = wMm + 30;
  const pageHMm = hMm + 40;

  const doc = new jsPDF({
    orientation: wMm > hMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [pageWMm, pageHMm],
  });

  // Background
  doc.setFillColor(245, 245, 240);
  doc.rect(0, 0, pageWMm, pageHMm, 'F');

  // Outer boundary
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(5, 5, pageWMm - 10, pageHMm - 10, 'S');

  // Header Banner
  doc.setFillColor(204, 255, 0); // #ccff00 electric lime
  doc.rect(5, 5, pageWMm - 10, 10, 'F');
  doc.rect(5, 5, pageWMm - 10, 10, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`PHOTO DPI MAKER // ${dpi} DPI MONOCHROME SPECIMEN`, 9, 11.5);
  doc.text(`${options.targetWidthInches}" × ${options.targetHeightInches}" (${canvas.width}×${canvas.height}px)`, pageWMm - 65, 11.5);

  // Position Image on Card
  const imgX = 15;
  const imgY = 20;

  // Solid border around image
  doc.setFillColor(255, 255, 255);
  doc.rect(imgX - 0.5, imgY - 0.5, wMm + 1, hMm + 1, 'F');
  doc.rect(imgX - 0.5, imgY - 0.5, wMm + 1, hMm + 1, 'S');

  // Draw image
  doc.addImage(imgData, 'PNG', imgX, imgY, wMm, hMm, undefined, 'FAST');

  // Corner Crop Marks
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Top-left
  doc.line(imgX - 8, imgY, imgX - 2, imgY);
  doc.line(imgX, imgY - 8, imgX, imgY - 2);
  // Top-right
  doc.line(imgX + wMm + 2, imgY, imgX + wMm + 8, imgY);
  doc.line(imgX + wMm, imgY - 8, imgX + wMm, imgY - 2);
  // Bottom-left
  doc.line(imgX - 8, imgY + hMm, imgX - 2, imgY + hMm);
  doc.line(imgX, imgY + hMm + 2, imgX, imgY + hMm + 8);
  // Bottom-right
  doc.line(imgX + wMm + 2, imgY + hMm, imgX + wMm + 8, imgY + hMm);
  doc.line(imgX + wMm, imgY + hMm + 2, imgX + wMm, imgY + hMm + 8);

  // Calibration Tone Strip at Bottom
  const stripY = imgY + hMm + 8;
  const swatchWidth = (wMm) / 10;
  for (let i = 0; i < 10; i++) {
    const val = Math.round(255 * (i / 9));
    doc.setFillColor(val, val, val);
    doc.rect(imgX + i * swatchWidth, stripY, swatchWidth, 4, 'F');
    doc.rect(imgX + i * swatchWidth, stripY, swatchWidth, 4, 'S');
  }

  // Footer Metadata
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    `CALIBRATION: 10-STEP DENSITY SCALE · DPI: ${dpi} · TONE: ${options.toneMode.toUpperCase()} · CONTRAST: ${options.contrast}x`,
    imgX,
    stripY + 8
  );

  const pdfBlob = doc.output('blob');
  const filename = `${filenamePrefix}-${dpi}DPI-PrintCard.pdf`;
  const dataUrl = URL.createObjectURL(pdfBlob);

  return {
    blob: pdfBlob,
    dataUrl,
    filename,
    format: 'PDF',
    widthPx: canvas.width,
    heightPx: canvas.height,
    dpi,
    physicalWidthInches: options.targetWidthInches,
    physicalHeightInches: options.targetHeightInches,
  };
}

/**
 * Triggers file download in browser
 */
export function triggerFileDownload(result: PhotoDPIExportResult) {
  const a = document.createElement('a');
  a.href = result.dataUrl;
  a.download = result.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
