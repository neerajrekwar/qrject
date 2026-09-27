import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { DotShape, EyeFrameShape, EyeBallShape } from './qr-engine';

export interface PhotoQRBlendOptions {
  text: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Level H recommended for photo QR
  contrast?: number;          // 0.5 to 2.5 (default: 1.45)
  brightness?: number;        // 0.6 to 1.6 (default: 1.0)
  dotScale?: number;          // 0.38 to 0.85 (default: 0.62) - module core sampling radius
  blendMode?: 'pixel-clamp' | 'halftone-core' | 'luminance-fusion';
  monochrome?: boolean;       // default: true (300 DPI high-contrast B/W standard)
  invert?: boolean;           // default: false
  targetSizePx?: number;      // default: 1000px
  foregroundColor?: string;   // default: #000000
  backgroundColor?: string;   // default: #ffffff
  dotShape?: DotShape;        // default: 'square'
  eyeFrameShape?: EyeFrameShape; // default: 'square'
  eyeBallShape?: EyeBallShape;   // default: 'square'
}

export interface PhotoQRBlendResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  isScannable: boolean;
  decodedText?: string;
  decodeTimeMs: number;
}

/**
 * Loads an image from a string URL, File, or HTMLImageElement
 */
export function loadImageElement(source: HTMLImageElement | string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window not available'));
      return;
    }

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
 * Blends an image with the generated QR code pattern at the data level using canvas manipulation.
 *
 * How it works at the data level:
 * 1. Generates the ISO/IEC 18004 QR matrix with Level H (30% fault tolerance).
 * 2. Pre-processes the image into 300 DPI calibrated high-contrast monochrome.
 * 3. Operates on the pixel data buffer (ImageData) at the module cell level:
 *    - Preserves clean quiet margins and isolates the 3 corner finder pattern registration targets.
 *    - For every data module cell, mathematically manipulates pixel luminance:
 *      * Centers of dark modules (1) are clamped below optical threshold (scannable black core).
 *      * Centers of light modules (0) are clamped above optical threshold (scannable light core).
 *      * Surrounding cell margins and boundaries preserve the image's shading, eyes, contours, and texture.
 * 4. Renders precision finder frames and verifies decodability in real time with jsQR.
 */
export async function blendImageWithQRCode(
  targetCanvas: HTMLCanvasElement | null,
  imageSource: HTMLImageElement | string | File,
  options: Partial<PhotoQRBlendOptions> = {}
): Promise<PhotoQRBlendResult> {
  const {
    text = 'https://qrject.dev',
    errorCorrectionLevel = 'H',
    contrast = 1.45,
    brightness = 1.0,
    dotScale = 0.62,
    blendMode = 'pixel-clamp',
    monochrome = true,
    invert = false,
    targetSizePx = 1000,
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    dotShape = 'square',
    eyeFrameShape = 'square',
    eyeBallShape = 'square',
  } = options;

  // 1. Create or prepare canvas
  const canvas = targetCanvas || document.createElement('canvas');
  const size = targetSizePx;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Could not get 2D canvas context');
  }

  // 2. Generate QR Code Matrix (Level H guarantees 30% error correction tolerance)
  const qr = QRCode.create(text || 'https://qrject.dev', {
    errorCorrectionLevel,
  });

  const moduleCount = qr.modules.size;
  const quietZone = 4;
  const totalModules = moduleCount + quietZone * 2;
  const cellSize = size / totalModules;
  const matrixX = quietZone * cellSize;
  const matrixY = quietZone * cellSize;
  const matrixSize = moduleCount * cellSize;

  // 3. Clear canvas with pure background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // 4. Load input image
  const img = await loadImageElement(imageSource);

  // 5. Draw cropped photo to fill matrix area on offscreen buffer
  const offCanvas = document.createElement('canvas');
  offCanvas.width = Math.round(matrixSize);
  offCanvas.height = Math.round(matrixSize);
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

  if (!offCtx) {
    throw new Error('Could not get offscreen 2D canvas context');
  }

  // Center crop source image into square matrix
  const imgDim = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const sx = ((img.naturalWidth || img.width) - imgDim) / 2;
  const sy = ((img.naturalHeight || img.height) - imgDim) / 2;

  offCtx.drawImage(img, sx, sy, imgDim, imgDim, 0, 0, offCanvas.width, offCanvas.height);

  // 6. Draw photo onto main canvas at matrix offset
  ctx.drawImage(offCanvas, matrixX, matrixY, matrixSize, matrixSize);

  // 7. DATA-LEVEL CANVAS MANIPULATION
  // Extract pixel buffer across the full canvas
  const imgData = ctx.getImageData(0, 0, size, size);
  const pixels = imgData.data;

  // Pre-calculate finder boundary check
  const isFinderMargin = (r: number, c: number) => {
    if (r <= 7 && c <= 7) return true;
    if (r <= 7 && c >= moduleCount - 8) return true;
    if (r >= moduleCount - 8 && c <= 7) return true;
    return false;
  };

  const effectiveDotScale = Math.max(0.38, Math.min(dotScale, 0.85));
  const coreRadiusRatio = (effectiveDotScale / 2);

  // Iterate across every pixel on the canvas for data-level blending
  for (let py = 0; py < size; py++) {
    // Check if pixel is within quiet margin (outside matrix)
    const inMatrixY = py >= matrixY && py < matrixY + matrixSize;

    for (let px = 0; px < size; px++) {
      const idx = (py * size + px) * 4;
      const inMatrixX = px >= matrixX && px < matrixX + matrixSize;

      if (!inMatrixX || !inMatrixY) {
        // Outside matrix: enforce pure quiet margin
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
        continue;
      }

      // Identify corresponding QR module coordinates (row, col)
      const col = Math.floor((px - matrixX) / cellSize);
      const row = Math.floor((py - matrixY) / cellSize);

      if (row < 0 || row >= moduleCount || col < 0 || col >= moduleCount) {
        continue;
      }

      // Finder pattern registration targets are cleared for 100% optical precision
      if (isFinderMargin(row, col)) {
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
        continue;
      }

      // Compute normalized relative coordinate inside this module cell [0.0, 1.0]
      const cellRelX = (px - matrixX - col * cellSize) / cellSize;
      const cellRelY = (py - matrixY - row * cellSize) / cellSize;
      const dx = cellRelX - 0.5;
      const dy = cellRelY - 0.5;

      // Distance from module center
      let distFromCenter = Math.hypot(dx, dy);
      if (dotShape === 'square') {
        // Chebyshev distance for square modules
        distFromCenter = Math.max(Math.abs(dx), Math.abs(dy));
      } else if (dotShape === 'diamond') {
        // Manhattan distance for diamond modules
        distFromCenter = (Math.abs(dx) + Math.abs(dy)) * 0.707;
      }

      const isDarkModule = qr.modules.get(row, col);

      // Original pixel color
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      // Convert to monochrome luminance if enabled
      let lum = monochrome ? 0.299 * r + 0.587 * g + 0.114 * b : (r + g + b) / 3;

      // Apply contrast & brightness
      lum = (lum - 128) * contrast + 128 + (brightness - 1.0) * 128;
      if (invert) lum = 255 - lum;
      lum = Math.max(0, Math.min(255, lum));

      // DATA-LEVEL BLEND LOGIC:
      // The QR scanner samples the module center.
      // We guarantee that the center core matches the QR bit, while the periphery reveals the image.
      if (distFromCenter <= coreRadiusRatio) {
        // Core sampling zone: enforce binary state for scanner
        if (isDarkModule) {
          // Guaranteed dark (bit 1)
          lum = Math.min(lum, 18);
        } else {
          // Guaranteed light (bit 0)
          lum = Math.max(lum, 245);
        }
      } else if (distFromCenter <= coreRadiusRatio + 0.12) {
        // Smooth transition zone between core and photographic details
        const t = (distFromCenter - coreRadiusRatio) / 0.12;
        if (isDarkModule) {
          const targetDark = Math.min(lum, 25);
          lum = targetDark * (1 - t) + lum * t;
        } else {
          const targetLight = Math.max(lum, 235);
          lum = targetLight * (1 - t) + lum * t;
        }
      } else {
        // Periphery: image details show through
        if (blendMode === 'pixel-clamp') {
          // Slight bias to assist peripheral camera sampling
          if (isDarkModule) {
            lum = Math.min(lum, 190);
          } else {
            lum = Math.max(lum, 65);
          }
        }
      }

      lum = Math.max(0, Math.min(255, Math.round(lum)));

      if (monochrome) {
        pixels[idx] = lum;
        pixels[idx + 1] = lum;
        pixels[idx + 2] = lum;
      } else {
        // Color blend: preserve hue while modulating luminance
        const factor = lum / 255;
        pixels[idx] = Math.round(r * factor);
        pixels[idx + 1] = Math.round(g * factor);
        pixels[idx + 2] = Math.round(b * factor);
      }
      pixels[idx + 3] = 255;
    }
  }

  // Write modified pixels back to canvas
  ctx.putImageData(imgData, 0, 0);

  // 8. RENDER THE 3 CORNER FINDER TARGETS
  // Standard 7x7 outer frame, 5x5 white moat, 3x3 inner pupil
  const eyePositions = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - 7 },
    { row: moduleCount - 7, col: 0 },
  ];

  for (const pos of eyePositions) {
    const eyeX = matrixX + pos.col * cellSize;
    const eyeY = matrixY + pos.row * cellSize;
    const eyeSize = 7 * cellSize;

    drawFinderEyeOnCanvas(
      ctx,
      eyeX,
      eyeY,
      eyeSize,
      cellSize,
      foregroundColor,
      backgroundColor,
      eyeFrameShape,
      eyeBallShape
    );
  }

  // 9. VERIFY SCANNABILITY AT RUNTIME USING JSQR
  const t0 = performance.now();
  let isScannable = false;
  let decodedText: string | undefined;

  try {
    const checkData = ctx.getImageData(0, 0, size, size);
    const code = jsQR(checkData.data, size, size, {
      inversionAttempts: 'dontInvert',
    });
    if (code && code.data) {
      isScannable = true;
      decodedText = code.data;
    }
  } catch (err) {
    console.warn('Scannability test error:', err);
  }

  const elapsed = Math.round(performance.now() - t0);
  const dataUrl = canvas.toDataURL('image/png');

  return {
    canvas,
    dataUrl,
    isScannable,
    decodedText,
    decodeTimeMs: elapsed,
  };
}

function drawFinderEyeOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  eyeSize: number,
  cellSize: number,
  fgColor: string,
  bgColor: string,
  frameShape: EyeFrameShape,
  ballShape: EyeBallShape
) {
  ctx.save();

  // 1. Outer 7x7 Frame
  ctx.fillStyle = fgColor;
  ctx.beginPath();
  const radius =
    frameShape === 'circle'
      ? eyeSize / 2
      : frameShape === 'rounded'
      ? eyeSize * 0.25
      : frameShape === 'squircle'
      ? eyeSize * 0.38
      : 0;

  if (frameShape === 'circle') {
    ctx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
  } else {
    ctx.roundRect(x, y, eyeSize, eyeSize, radius);
  }
  ctx.fill();

  // 2. Hollow 5x5 Moat
  const hollowSize = 5 * cellSize;
  const hollowX = x + cellSize;
  const hollowY = y + cellSize;
  const hollowRadius =
    frameShape === 'circle'
      ? hollowSize / 2
      : frameShape === 'rounded'
      ? hollowSize * 0.2
      : frameShape === 'squircle'
      ? hollowSize * 0.35
      : 0;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  if (frameShape === 'circle') {
    ctx.arc(hollowX + hollowSize / 2, hollowY + hollowSize / 2, hollowSize / 2, 0, Math.PI * 2);
  } else {
    ctx.roundRect(hollowX, hollowY, hollowSize, hollowSize, hollowRadius);
  }
  ctx.fill();

  // 3. Inner 3x3 Pupil
  const ballSize = 3 * cellSize;
  const ballX = x + 2 * cellSize;
  const ballY = y + 2 * cellSize;
  const ballRadius =
    ballShape === 'circle'
      ? ballSize / 2
      : ballShape === 'rounded'
      ? ballSize * 0.25
      : 0;

  ctx.fillStyle = fgColor;
  ctx.beginPath();
  if (ballShape === 'circle') {
    ctx.arc(ballX + ballSize / 2, ballY + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
  } else if (ballShape === 'diamond') {
    const cx = ballX + ballSize / 2;
    const cy = ballY + ballSize / 2;
    ctx.moveTo(cx, ballY);
    ctx.lineTo(ballX + ballSize, cy);
    ctx.lineTo(cx, ballY + ballSize);
    ctx.lineTo(ballX, cy);
    ctx.closePath();
  } else {
    ctx.roundRect(ballX, ballY, ballSize, ballSize, ballRadius);
  }
  ctx.fill();

  ctx.restore();
}
