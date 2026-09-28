import QRCode from 'qrcode';
import jsQR from 'jsqr';

export type DotShape = 'square' | 'dots' | 'rounded' | 'diamond' | 'classy';
export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'squircle';
export type EyeBallShape = 'square' | 'rounded' | 'circle' | 'diamond';
export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export type PhotoQRMode = 'halftone' | 'fusion' | 'dither' | 'microdots' | 'center-logo';

export interface QROptions {
  text: string;
  errorCorrectionLevel?: ErrorCorrection;
  // Colors
  foregroundColor: string;
  backgroundColor: string;
  gradientEnabled?: boolean;
  gradientEndColor?: string;
  eyeOuterColor?: string;
  eyeInnerColor?: string;
  // Shapes
  dotShape: DotShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  // Whole Image Photo QR Settings
  photoUrl?: string | null;           // Whole photo/image URL or base64 data URL
  photoQRMode?: PhotoQRMode;          // 'halftone' | 'fusion' | 'dither' | 'microdots' | 'center-logo'
  photoContrast?: number;             // 0.5 to 2.5 (default 1.4 for crisp 300 DPI B/W)
  photoBrightness?: number;           // 0.5 to 1.8 (default 1.0)
  photoDotScale?: number;             // 0.35 to 0.85 (module center dot size, default 0.62)
  photoOpacity?: number;              // 0.3 to 1.0 (default 0.95)
  photoInvert?: boolean;              // Invert photo luminance
  photoCoverArea?: 'matrix' | 'full'; // 'matrix' (covers data matrix) or 'full' (entire canvas)
  photoBWMode?: boolean;              // Force pure monochrome B/W rendering (300 DPI standard)
  // Legacy / Center Logo (used if photoQRMode === 'center-logo')
  logoUrl?: string | null;
  logoSize?: number; // 0.15 to 0.35 of total QR size
  logoPadding?: number; // padding in px
  logoBackground?: string;
  logoShape?: 'circle' | 'square' | 'rounded';
  // High contrast & DPI
  dpi?: number;
  targetSizePx?: number;
}

// Convert hex to RGB luminance
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function calculateContrastRatio(hex1: string, hex2: string): number {
  try {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  } catch {
    return 21; // fallback
  }
}

// Helper to determine if a coordinate is in the finder eye zones (7x7 modules)
export function isFinderPattern(row: number, col: number, moduleCount: number): boolean {
  // Top-left finder (7x7)
  if (row < 7 && col < 7) return true;
  // Top-right finder (7x7)
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left finder (7x7)
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

// Helper to check if coordinate is in the 1-module quiet boundary around finders (8x8)
export function isFinderSeparator(row: number, col: number, moduleCount: number): boolean {
  if (row <= 7 && col <= 7) return true;
  if (row <= 7 && col >= moduleCount - 8) return true;
  if (row >= moduleCount - 8 && col <= 7) return true;
  return false;
}

// Helper to check if coordinate is in center logo zone (for legacy badge mode)
export function isLogoZone(row: number, col: number, moduleCount: number, logoRadiusModules: number): boolean {
  if (logoRadiusModules <= 0) return false;
  const center = Math.floor(moduleCount / 2);
  const distRow = Math.abs(row - center);
  const distCol = Math.abs(col - center);
  return distRow <= logoRadiusModules && distCol <= logoRadiusModules;
}

export interface ScanVerificationResult {
  isScannable: boolean;
  decodedText?: string;
  confidence: number;
  decodeTimeMs: number;
}

/**
 * Verifies if the rendered canvas can be optically decoded by standard QR engine
 */
export function verifyCanvasScannability(canvas: HTMLCanvasElement): ScanVerificationResult {
  const t0 = performance.now();
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width === 0 || canvas.height === 0) {
      return { isScannable: false, confidence: 0, decodeTimeMs: 0 };
    }
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imgData.data, canvas.width, canvas.height, {
      inversionAttempts: 'dontInvert',
    });
    const elapsed = Math.round(performance.now() - t0);
    if (code && code.data) {
      return {
        isScannable: true,
        decodedText: code.data,
        confidence: 100,
        decodeTimeMs: elapsed,
      };
    }
    return { isScannable: false, confidence: 0, decodeTimeMs: elapsed };
  } catch {
    return { isScannable: false, confidence: 0, decodeTimeMs: Math.round(performance.now() - t0) };
  }
}

/**
 * Draws the high-fidelity QR Code onto an HTML Canvas with Photo QR Code interpretation
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: QROptions
): Promise<void> {
  const {
    text,
    errorCorrectionLevel = (options.photoUrl || options.logoUrl) ? 'H' : 'M',
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    gradientEnabled = false,
    gradientEndColor = '#3b82f6',
    eyeOuterColor = foregroundColor,
    eyeInnerColor = foregroundColor,
    dotShape = 'square',
    eyeFrameShape = 'square',
    eyeBallShape = 'square',
    photoUrl = null,
    photoQRMode = 'halftone',
    photoContrast = 1.4,
    photoBrightness = 1.0,
    photoDotScale = 0.62,
    photoOpacity = 0.95,
    photoInvert = false,
    photoBWMode = true,
    logoUrl = null,
    logoSize = 0.22,
    logoPadding = 8,
    logoBackground = '#ffffff',
    logoShape = 'square',
    targetSizePx = 1000,
  } = options;

  // Active image for photo QR: prefer photoUrl, fallback to logoUrl if provided
  const activeImage = photoUrl || logoUrl;
  const isWholeImageMode = Boolean(activeImage && photoQRMode !== 'center-logo');

  // Generate QR Matrix (Level H guarantees 30% error correction tolerance)
  const effectiveEC = (activeImage ? 'H' : errorCorrectionLevel) as ErrorCorrection;
  const qr = QRCode.create(text || 'https://qrject.dev', {
    errorCorrectionLevel: effectiveEC,
  });

  const moduleCount = qr.modules.size;
  const size = targetSizePx;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Draw Clean Base Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Quiet zone margin: 4 modules on each side (standard optical boundary)
  const quietModules = 4;
  const totalModules = moduleCount + quietModules * 2;
  const cellSize = size / totalModules;
  const matrixX = quietModules * cellSize;
  const matrixY = quietModules * cellSize;
  const matrixSize = moduleCount * cellSize;

  // 2. Render WHOLE IMAGE AS THE QR CODE
  let photoImg: HTMLImageElement | null = null;
  if (isWholeImageMode && activeImage) {
    try {
      photoImg = await loadImage(activeImage);

      // Create an offscreen buffer at matrix size
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.round(matrixSize);
      offCanvas.height = Math.round(matrixSize);
      const offCtx = offCanvas.getContext('2d');

      if (offCtx && photoImg) {
        // Center crop and cover the matrix area
        const imgAspect = photoImg.width / photoImg.height;
        let sx = 0;
        let sy = 0;
        let sWidth = photoImg.width;
        let sHeight = photoImg.height;

        if (imgAspect > 1) {
          sWidth = photoImg.height;
          sx = (photoImg.width - sWidth) / 2;
        } else if (imgAspect < 1) {
          sHeight = photoImg.width;
          sy = (photoImg.height - sHeight) / 2;
        }

        offCtx.drawImage(
          photoImg,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          offCanvas.width,
          offCanvas.height
        );

        // Preprocess into High-Contrast 300 DPI Black and White Monochrome
        if (photoBWMode) {
          const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
          const d = imgData.data;
          const contrast = photoContrast;
          const brightness = photoBrightness;

          for (let i = 0; i < d.length; i += 4) {
            // Standard photographic luminance (Rec. 601)
            let lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            // Apply contrast and brightness adjustments
            lum = (lum - 128) * contrast + 128 + (brightness - 1.0) * 128;
            if (photoInvert) lum = 255 - lum;
            lum = Math.max(0, Math.min(255, lum));

            d[i] = lum;
            d[i + 1] = lum;
            d[i + 2] = lum;
          }

          // Optional 1-bit Floyd-Steinberg dithering if requested
          if (photoQRMode === 'dither') {
            const w = offCanvas.width;
            const h = offCanvas.height;
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const oldVal = d[idx];
                const newVal = oldVal < 128 ? 0 : 255;
                d[idx] = newVal;
                d[idx + 1] = newVal;
                d[idx + 2] = newVal;
                const err = oldVal - newVal;

                // Diffuse error
                if (x + 1 < w) d[(y * w + (x + 1)) * 4] += (err * 7) >> 4;
                if (x - 1 >= 0 && y + 1 < h) d[((y + 1) * w + (x - 1)) * 4] += (err * 3) >> 4;
                if (y + 1 < h) d[((y + 1) * w + x) * 4] += (err * 5) >> 4;
                if (x + 1 < w && y + 1 < h) d[((y + 1) * w + (x + 1)) * 4] += (err * 1) >> 4;
              }
            }
          }

          offCtx.putImageData(imgData, 0, 0);
        }

        // Composite the processed photographic matrix onto the main canvas
        ctx.save();
        ctx.globalAlpha = Math.min(Math.max(photoOpacity, 0.2), 1.0);
        ctx.drawImage(offCanvas, matrixX, matrixY, matrixSize, matrixSize);
        ctx.restore();

        // Protect the 3 Finder Pattern Registration Targets
        // Scanners require clean quiet zones around the 7x7 finder patterns to orient
        ctx.fillStyle = backgroundColor;
        // Top-Left Finder Cleanout (8x8)
        ctx.fillRect(matrixX - cellSize * 0.5, matrixY - cellSize * 0.5, 8.5 * cellSize, 8.5 * cellSize);
        // Top-Right Finder Cleanout (8x8)
        ctx.fillRect(matrixX + (moduleCount - 8) * cellSize, matrixY - cellSize * 0.5, 8.5 * cellSize, 8.5 * cellSize);
        // Bottom-Left Finder Cleanout (8x8)
        ctx.fillRect(matrixX - cellSize * 0.5, matrixY + (moduleCount - 8) * cellSize, 8.5 * cellSize, 8.5 * cellSize);
      }
    } catch (err) {
      console.warn('Could not render whole-image photo to canvas:', err);
    }
  }

  // Pre-calculate logo module radius to mask cells behind logo in legacy badge mode
  let logoRadiusModules = 0;
  if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
    const logoPx = size * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoModules = Math.ceil(logoPx / cellSize);
    logoRadiusModules = Math.floor(logoModules / 2) + 1;
  }

  // Foreground fill / gradient
  let fillStyle: string | CanvasGradient = foregroundColor;
  if (gradientEnabled && gradientEndColor) {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, foregroundColor);
    grad.addColorStop(1, gradientEndColor);
    fillStyle = grad;
  }

  // 3. DRAW DATA & ALIGNMENT MODULES
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue;

      // In legacy center logo mode, skip cells behind the logo badge
      if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
        if (isLogoZone(r, c, moduleCount, logoRadiusModules)) continue;
      }

      // In whole-image photo mode, skip separator margin around finders for clean registration
      if (isWholeImageMode && isFinderSeparator(r, c, moduleCount)) {
        continue;
      }

      const isDark = qr.modules.get(r, c);
      const x = matrixX + c * cellSize;
      const y = matrixY + r * cellSize;

      if (isWholeImageMode) {
        // Photo QR Interpreter Modulation
        const scale = photoQRMode === 'microdots' ? 0.48 : Math.max(0.38, Math.min(photoDotScale, 0.85));
        const dotSize = cellSize * scale;
        const padX = (cellSize - dotSize) / 2;
        const padY = (cellSize - dotSize) / 2;

        if (isDark) {
          ctx.fillStyle = fillStyle;
          drawModule(ctx, x + padX, y + padY, dotSize, dotShape);
        } else {
          // In Halftone / Fusion mode, draw light core so QR scanner sampling reads pure 0
          if (photoQRMode === 'halftone' || photoQRMode === 'fusion') {
            const lightDotSize = dotSize * 0.72;
            const lpadX = (cellSize - lightDotSize) / 2;
            const lpadY = (cellSize - lightDotSize) / 2;
            ctx.fillStyle = backgroundColor;
            // Draw clean light core module
            drawModule(ctx, x + lpadX, y + lpadY, lightDotSize, dotShape === 'diamond' ? 'diamond' : 'dots');
          }
        }
      } else {
        // Standard high-contrast QR code rendering
        if (!isDark) continue;
        ctx.fillStyle = fillStyle;
        drawModule(ctx, x, y, cellSize, dotShape);
      }
    }
  }

  // 4. DRAW 3 FINDER EYES (Top-Left, Top-Right, Bottom-Left)
  const eyePositions = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - 7 },
    { row: moduleCount - 7, col: 0 },
  ];

  for (const pos of eyePositions) {
    const eyeX = matrixX + pos.col * cellSize;
    const eyeY = matrixY + pos.row * cellSize;
    const eyeSize = 7 * cellSize;

    drawFinderEye(
      ctx,
      eyeX,
      eyeY,
      eyeSize,
      cellSize,
      eyeOuterColor || foregroundColor,
      eyeInnerColor || foregroundColor,
      backgroundColor,
      eyeFrameShape,
      eyeBallShape
    );
  }

  // 5. LEGACY CENTER BADGE (Only if explicitly set to center-logo mode)
  if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
    try {
      const logoImg = await loadImage(activeImage);
      const logoBoxSize = size * Math.min(Math.max(logoSize, 0.15), 0.32);
      const logoX = (size - logoBoxSize) / 2;
      const logoY = (size - logoBoxSize) / 2;

      ctx.save();
      ctx.fillStyle = logoBackground;
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;

      const radius =
        logoShape === 'circle'
          ? logoBoxSize / 2
          : logoShape === 'rounded'
          ? logoBoxSize * 0.2
          : 0;

      ctx.beginPath();
      if (logoShape === 'circle') {
        ctx.arc(
          logoX + logoBoxSize / 2,
          logoY + logoBoxSize / 2,
          logoBoxSize / 2,
          0,
          Math.PI * 2
        );
      } else {
        ctx.roundRect(logoX, logoY, logoBoxSize, logoBoxSize, radius);
      }
      ctx.fill();
      ctx.restore();

      const innerPad = Math.max(logoPadding, 4);
      const innerSize = logoBoxSize - innerPad * 2;
      const innerX = logoX + innerPad;
      const innerY = logoY + innerPad;

      ctx.save();
      ctx.beginPath();
      if (logoShape === 'circle') {
        ctx.arc(
          innerX + innerSize / 2,
          innerY + innerSize / 2,
          innerSize / 2,
          0,
          Math.PI * 2
        );
      } else {
        ctx.roundRect(innerX, innerY, innerSize, innerSize, radius * 0.7);
      }
      ctx.clip();

      const aspect = logoImg.width / logoImg.height;
      let drawW = innerSize;
      let drawH = innerSize;
      let drawX = innerX;
      let drawY = innerY;

      if (aspect > 1) {
        drawH = innerSize / aspect;
        drawY = innerY + (innerSize - drawH) / 2;
      } else {
        drawW = innerSize * aspect;
        drawX = innerX + (innerSize - drawW) / 2;
      }

      if (photoBWMode) {
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(95%)';
      }

      ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
      ctx.filter = 'none';
      ctx.restore();
    } catch (err) {
      console.warn('Could not render logo to QR canvas:', err);
    }
  }
}

function drawModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  shape: DotShape
) {
  const pad = size * 0.04;
  const drawSize = size - pad * 2;
  const drawX = x + pad;
  const drawY = y + pad;

  ctx.beginPath();

  switch (shape) {
    case 'dots': {
      const radius = drawSize / 2;
      ctx.arc(drawX + radius, drawY + radius, radius, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'rounded': {
      const radius = drawSize * 0.35;
      ctx.roundRect(drawX, drawY, drawSize, drawSize, radius);
      ctx.fill();
      break;
    }
    case 'diamond': {
      const cx = drawX + drawSize / 2;
      const cy = drawY + drawSize / 2;
      ctx.moveTo(cx, drawY);
      ctx.lineTo(drawX + drawSize, cy);
      ctx.lineTo(cx, drawY + drawSize);
      ctx.lineTo(drawX, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'classy': {
      // diagonal rounded corners
      const r = drawSize * 0.45;
      ctx.roundRect(drawX, drawY, drawSize, drawSize, [r, 0, r, 0]);
      ctx.fill();
      break;
    }
    case 'square':
    default: {
      ctx.fillRect(drawX, drawY, drawSize, drawSize);
      break;
    }
  }
}

function drawFinderEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  eyeSize: number,
  cellSize: number,
  outerColor: string,
  innerColor: string,
  bgColor: string,
  frameShape: EyeFrameShape,
  ballShape: EyeBallShape
) {
  // Outer frame: 7x7 modules
  ctx.save();
  ctx.fillStyle = outerColor;
  ctx.beginPath();

  switch (frameShape) {
    case 'circle': {
      ctx.arc(x + eyeSize / 2, y + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
      break;
    }
    case 'rounded': {
      ctx.roundRect(x, y, eyeSize, eyeSize, eyeSize * 0.25);
      break;
    }
    case 'squircle': {
      ctx.roundRect(x, y, eyeSize, eyeSize, eyeSize * 0.38);
      break;
    }
    case 'square':
    default: {
      ctx.rect(x, y, eyeSize, eyeSize);
      break;
    }
  }
  ctx.fill();

  // Hollow inner cut: 5x5 modules (1 module thickness frame)
  const hollowSize = 5 * cellSize;
  const hollowX = x + cellSize;
  const hollowY = y + cellSize;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  switch (frameShape) {
    case 'circle': {
      ctx.arc(
        hollowX + hollowSize / 2,
        hollowY + hollowSize / 2,
        hollowSize / 2,
        0,
        Math.PI * 2
      );
      break;
    }
    case 'rounded': {
      ctx.roundRect(hollowX, hollowY, hollowSize, hollowSize, hollowSize * 0.2);
      break;
    }
    case 'squircle': {
      ctx.roundRect(
        hollowX,
        hollowY,
        hollowSize,
        hollowSize,
        hollowSize * 0.35
      );
      break;
    }
    case 'square':
    default: {
      ctx.rect(hollowX, hollowY, hollowSize, hollowSize);
      break;
    }
  }
  ctx.fill();

  // Inner eyeball: 3x3 modules centered
  const ballSize = 3 * cellSize;
  const ballX = x + 2 * cellSize;
  const ballY = y + 2 * cellSize;

  ctx.fillStyle = innerColor;
  ctx.beginPath();
  switch (ballShape) {
    case 'circle': {
      ctx.arc(ballX + ballSize / 2, ballY + ballSize / 2, ballSize / 2, 0, Math.PI * 2);
      break;
    }
    case 'rounded': {
      ctx.roundRect(ballX, ballY, ballSize, ballSize, ballSize * 0.25);
      break;
    }
    case 'diamond': {
      const cx = ballX + ballSize / 2;
      const cy = ballY + ballSize / 2;
      ctx.moveTo(cx, ballY);
      ctx.lineTo(ballX + ballSize, cy);
      ctx.lineTo(cx, ballY + ballSize);
      ctx.lineTo(ballX, cy);
      ctx.closePath();
      break;
    }
    case 'square':
    default: {
      ctx.rect(ballX, ballY, ballSize, ballSize);
      break;
    }
  }
  ctx.fill();
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Embeds 300 DPI (or target DPI) into PNG file header via pHYs chunk
 * 300 DPI = 11811 pixels per meter (meter = 39.3701 inches)
 */
export function insertDpiIntoPngBlob(pngBlob: Blob, dpi: number = 300): Promise<Blob> {
  return new Promise((resolve) => {
    const ppm = Math.round(dpi * 39.3701); // pixels per meter
    const reader = new FileReader();
    reader.onload = function (e) {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve(pngBlob);
        return;
      }
      const view = new DataView(buffer);
      // Check PNG signature: 0x89504E47 0x0D0A1A0A
      if (view.getUint32(0) !== 0x89504e47 || view.getUint32(4) !== 0x0d0a1a0a) {
        resolve(pngBlob);
        return;
      }

      // Construct pHYs chunk:
      // Length: 9 bytes (4 bytes X, 4 bytes Y, 1 byte unit: 1 for meter)
      const physChunk = new Uint8Array(12 + 9);
      const physView = new DataView(physChunk.buffer);

      physView.setUint32(0, 9); // length
      // Chunk type: "pHYs" -> 0x70485973
      physChunk[4] = 0x70;
      physChunk[5] = 0x48;
      physChunk[6] = 0x59;
      physChunk[7] = 0x73;

      physView.setUint32(8, ppm); // X pixels per meter
      physView.setUint32(12, ppm); // Y pixels per meter
      physChunk[16] = 1; // unit: meters

      // Calculate CRC for pHYs chunk
      const crc = crc32(physChunk.subarray(4, 17));
      physView.setUint32(17, crc);

      // Insert pHYs after IHDR (IHDR starts at offset 8, length is 13 + 12 chunk header/crc = 25 bytes total -> offset 33)
      const ihdrEndOffset = 33;
      const newBuffer = new Uint8Array(buffer.byteLength + physChunk.byteLength);
      newBuffer.set(new Uint8Array(buffer.slice(0, ihdrEndOffset)), 0);
      newBuffer.set(physChunk, ihdrEndOffset);
      newBuffer.set(new Uint8Array(buffer.slice(ihdrEndOffset)), ihdrEndOffset + physChunk.byteLength);

      resolve(new Blob([newBuffer], { type: 'image/png' }));
    };
    reader.readAsArrayBuffer(pngBlob);
  });
}

// CRC32 table & calculation for PNG chunks
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Generates an SVG string of the QR Code with 300 DPI vector calibration,
 * embedded photo/image, high-contrast B/W filtering, and module/eye geometry.
 */
export function generateQRSVG(options: QROptions): string {
  const {
    text,
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    eyeOuterColor = foregroundColor,
    eyeInnerColor = foregroundColor,
    dotShape = 'square',
    eyeFrameShape = 'square',
    eyeBallShape = 'square',
    photoUrl = null,
    photoQRMode = 'halftone',
    photoDotScale = 0.62,
    photoOpacity = 0.95,
    photoBWMode = true,
    logoUrl = null,
    logoSize = 0.22,
    logoPadding = 8,
    logoBackground = '#ffffff',
    logoShape = 'square',
  } = options;

  const activeImage = photoUrl || logoUrl;
  const isWholeImageMode = Boolean(activeImage && photoQRMode !== 'center-logo');

  const qr = QRCode.create(text || 'https://qrject.dev', {
    errorCorrectionLevel: activeImage ? 'H' : (options.errorCorrectionLevel || 'M'),
  });
  const moduleCount = qr.modules.size;
  const quietModules = 4;
  const total = moduleCount + quietModules * 2;
  const cellSize = 10;
  const totalSize = total * cellSize;
  const matrixX = quietModules * cellSize;
  const matrixY = quietModules * cellSize;
  const matrixSize = moduleCount * cellSize;

  let defsElements = '';
  if (photoBWMode) {
    defsElements += `
    <filter id="svg-qr-bw">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0"/>
      <feComponentTransfer>
        <feFuncR type="linear" slope="1.5" intercept="-0.25"/>
        <feFuncG type="linear" slope="1.5" intercept="-0.25"/>
        <feFuncB type="linear" slope="1.5" intercept="-0.25"/>
      </feComponentTransfer>
    </filter>`;
  }

  let photoSvg = '';
  if (isWholeImageMode && activeImage) {
    defsElements += `
    <clipPath id="svg-matrix-clip">
      <rect x="${matrixX}" y="${matrixY}" width="${matrixSize}" height="${matrixSize}" />
    </clipPath>`;

    // Embed whole image under matrix
    photoSvg = `
    <g clip-path="url(#svg-matrix-clip)" opacity="${photoOpacity}">
      <image href="${activeImage}" x="${matrixX}" y="${matrixY}" width="${matrixSize}" height="${matrixSize}" preserveAspectRatio="xMidYMid slice" ${photoBWMode ? 'filter="url(#svg-qr-bw)"' : ''} />
    </g>
    <!-- Clear Finder Corners -->
    <rect x="${matrixX - cellSize * 0.5}" y="${matrixY - cellSize * 0.5}" width="${8.5 * cellSize}" height="${8.5 * cellSize}" fill="${backgroundColor}" />
    <rect x="${matrixX + (moduleCount - 8) * cellSize}" y="${matrixY - cellSize * 0.5}" width="${8.5 * cellSize}" height="${8.5 * cellSize}" fill="${backgroundColor}" />
    <rect x="${matrixX - cellSize * 0.5}" y="${matrixY + (moduleCount - 8) * cellSize}" width="${8.5 * cellSize}" height="${8.5 * cellSize}" fill="${backgroundColor}" />
    `;
  }

  // Pre-calculate logo module radius to mask center cells in badge mode
  let logoRadiusModules = 0;
  if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
    const logoPx = totalSize * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoModules = Math.ceil(logoPx / cellSize);
    logoRadiusModules = Math.floor(logoModules / 2) + 1;
  }

  let svgElements = '';

  // Draw data modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue;
      if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
        if (isLogoZone(r, c, moduleCount, logoRadiusModules)) continue;
      }
      if (isWholeImageMode && isFinderSeparator(r, c, moduleCount)) continue;

      const isDark = qr.modules.get(r, c);
      const x = matrixX + c * cellSize;
      const y = matrixY + r * cellSize;

      if (isWholeImageMode) {
        const scale = photoQRMode === 'microdots' ? 0.48 : Math.max(0.38, Math.min(photoDotScale, 0.85));
        const dotSize = cellSize * scale;
        const padX = (cellSize - dotSize) / 2;
        const padY = (cellSize - dotSize) / 2;

        if (isDark) {
          if (dotShape === 'dots') {
            const rad = dotSize / 2;
            svgElements += `<circle cx="${x + padX + rad}" cy="${y + padY + rad}" r="${rad}" fill="${foregroundColor}" />`;
          } else if (dotShape === 'rounded') {
            svgElements += `<rect x="${x + padX}" y="${y + padY}" width="${dotSize}" height="${dotSize}" rx="${dotSize * 0.35}" fill="${foregroundColor}" />`;
          } else if (dotShape === 'diamond') {
            const cx = x + padX + dotSize / 2;
            const cy = y + padY + dotSize / 2;
            svgElements += `<polygon points="${cx},${y + padY} ${x + padX + dotSize},${cy} ${cx},${y + padY + dotSize} ${x + padX},${cy}" fill="${foregroundColor}" />`;
          } else {
            svgElements += `<rect x="${x + padX}" y="${y + padY}" width="${dotSize}" height="${dotSize}" fill="${foregroundColor}" />`;
          }
        } else if (photoQRMode === 'halftone' || photoQRMode === 'fusion') {
          // Light core for contrast
          const lightSize = dotSize * 0.72;
          const lpadX = (cellSize - lightSize) / 2;
          const lpadY = (cellSize - lightSize) / 2;
          svgElements += `<circle cx="${x + lpadX + lightSize / 2}" cy="${y + lpadY + lightSize / 2}" r="${lightSize / 2}" fill="${backgroundColor}" />`;
        }
      } else {
        if (!isDark) continue;
        if (dotShape === 'dots') {
          const radius = cellSize * 0.45;
          svgElements += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${radius}" fill="${foregroundColor}" />`;
        } else if (dotShape === 'rounded') {
          svgElements += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize - 1}" height="${cellSize - 1}" rx="${cellSize * 0.3}" fill="${foregroundColor}" />`;
        } else if (dotShape === 'diamond') {
          const cx = x + cellSize / 2;
          const cy = y + cellSize / 2;
          svgElements += `<polygon points="${cx},${y} ${x + cellSize},${cy} ${cx},${y + cellSize} ${x},${cy}" fill="${foregroundColor}" />`;
        } else {
          svgElements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${foregroundColor}" />`;
        }
      }
    }
  }

  // Draw Finders in SVG
  const eyePositions = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - 7 },
    { row: moduleCount - 7, col: 0 },
  ];

  for (const pos of eyePositions) {
    const eyeX = matrixX + pos.col * cellSize;
    const eyeY = matrixY + pos.row * cellSize;
    const eyeSize = 7 * cellSize;

    const frameRx =
      eyeFrameShape === 'circle'
        ? eyeSize / 2
        : eyeFrameShape === 'squircle'
        ? cellSize * 2.5
        : eyeFrameShape === 'rounded'
        ? cellSize * 1.6
        : 0;

    const hollowSize = 5 * cellSize;
    const hollowRx =
      eyeFrameShape === 'circle'
        ? hollowSize / 2
        : eyeFrameShape === 'squircle'
        ? cellSize * 1.8
        : eyeFrameShape === 'rounded'
        ? cellSize * 1.0
        : 0;

    const ballSize = 3 * cellSize;
    const ballX = eyeX + 2 * cellSize;
    const ballY = eyeY + 2 * cellSize;

    // Outer frame
    svgElements += `<rect x="${eyeX}" y="${eyeY}" width="${eyeSize}" height="${eyeSize}" rx="${frameRx}" fill="${eyeOuterColor || foregroundColor}" />`;
    // Hollow inner
    svgElements += `<rect x="${eyeX + cellSize}" y="${eyeY + cellSize}" width="${hollowSize}" height="${hollowSize}" rx="${hollowRx}" fill="${backgroundColor}" />`;

    // Eyeball
    if (eyeBallShape === 'circle') {
      svgElements += `<circle cx="${ballX + ballSize / 2}" cy="${ballY + ballSize / 2}" r="${ballSize / 2}" fill="${eyeInnerColor || foregroundColor}" />`;
    } else if (eyeBallShape === 'diamond') {
      const cx = ballX + ballSize / 2;
      const cy = ballY + ballSize / 2;
      svgElements += `<polygon points="${cx},${ballY} ${ballX + ballSize},${cy} ${cx},${ballY + ballSize} ${ballX},${cy}" fill="${eyeInnerColor || foregroundColor}" />`;
    } else if (eyeBallShape === 'rounded') {
      svgElements += `<rect x="${ballX}" y="${ballY}" width="${ballSize}" height="${ballSize}" rx="${cellSize * 0.8}" fill="${eyeInnerColor || foregroundColor}" />`;
    } else {
      svgElements += `<rect x="${ballX}" y="${ballY}" width="${ballSize}" height="${ballSize}" fill="${eyeInnerColor || foregroundColor}" />`;
    }
  }

  // Legacy center badge if in center-logo mode
  let logoElements = '';
  if (!isWholeImageMode && activeImage && photoQRMode === 'center-logo') {
    const logoBoxSize = totalSize * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoX = (totalSize - logoBoxSize) / 2;
    const logoY = (totalSize - logoBoxSize) / 2;
    const boxRadius = logoShape === 'circle' ? logoBoxSize / 2 : logoShape === 'rounded' ? logoBoxSize * 0.2 : 0;

    const pad = Math.max(logoPadding, 4);
    const innerSize = logoBoxSize - pad * 2;
    const innerX = logoX + pad;
    const innerY = logoY + pad;
    const innerRadius = logoShape === 'circle' ? innerSize / 2 : logoShape === 'rounded' ? innerSize * 0.15 : 0;

    defsElements += `
    <clipPath id="svg-qr-badge-clip">
      ${
        logoShape === 'circle'
          ? `<circle cx="${innerX + innerSize / 2}" cy="${innerY + innerSize / 2}" r="${innerSize / 2}" />`
          : `<rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${innerRadius}" />`
      }
    </clipPath>`;

    if (logoShape === 'circle') {
      logoElements += `<circle cx="${logoX + logoBoxSize / 2}" cy="${logoY + logoBoxSize / 2}" r="${logoBoxSize / 2}" fill="${logoBackground}" stroke="#000000" stroke-width="1" />`;
    } else {
      logoElements += `<rect x="${logoX}" y="${logoY}" width="${logoBoxSize}" height="${logoBoxSize}" rx="${boxRadius}" fill="${logoBackground}" stroke="#000000" stroke-width="1" />`;
    }

    logoElements += `<image href="${activeImage}" x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#svg-qr-badge-clip)" ${photoBWMode ? 'filter="url(#svg-qr-bw)"' : ''} />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
  ${defsElements ? `<defs>${defsElements}</defs>` : ''}
  <rect width="${totalSize}" height="${totalSize}" fill="${backgroundColor}"/>
  ${photoSvg}
  ${svgElements}
  ${logoElements}
</svg>`;
}

export { blendImageWithQRCode, loadImageElement } from './photo-qr-blend';
export type { PhotoQRBlendOptions, PhotoQRBlendResult } from './photo-qr-blend';
