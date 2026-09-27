import QRCode from 'qrcode';

export type DotShape = 'square' | 'dots' | 'rounded' | 'diamond' | 'classy';
export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'squircle';
export type EyeBallShape = 'square' | 'rounded' | 'circle' | 'diamond';
export type ErrorCorrection = 'L' | 'M' | 'Q' | 'H';

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
  // Logo
  logoUrl?: string | null;
  logoSize?: number; // 0.15 to 0.35 of total QR size
  logoPadding?: number; // padding in px
  logoBackground?: string;
  logoShape?: 'circle' | 'square' | 'rounded';
  photoBWMode?: boolean; // When true, converts embedded photo/logo to high-contrast B/W
  // High contrast & DPI
  dpi?: 72 | 300 | 600;
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

// Helper to determine if a coordinate is in the finder eye zones
export function isFinderPattern(row: number, col: number, moduleCount: number): boolean {
  // Top-left finder (7x7)
  if (row < 7 && col < 7) return true;
  // Top-right finder (7x7)
  if (row < 7 && col >= moduleCount - 7) return true;
  // Bottom-left finder (7x7)
  if (row >= moduleCount - 7 && col < 7) return true;
  return false;
}

// Helper to check if coordinate is in center logo zone
export function isLogoZone(row: number, col: number, moduleCount: number, logoRadiusModules: number): boolean {
  if (logoRadiusModules <= 0) return false;
  const center = Math.floor(moduleCount / 2);
  const distRow = Math.abs(row - center);
  const distCol = Math.abs(col - center);
  return distRow <= logoRadiusModules && distCol <= logoRadiusModules;
}

/**
 * Draws the high-fidelity QR Code onto an HTML Canvas
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: QROptions
): Promise<void> {
  const {
    text,
    errorCorrectionLevel = options.logoUrl ? 'H' : 'M',
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    gradientEnabled = false,
    gradientEndColor = '#3b82f6',
    eyeOuterColor = foregroundColor,
    eyeInnerColor = foregroundColor,
    dotShape = 'square',
    eyeFrameShape = 'square',
    eyeBallShape = 'square',
    logoUrl = null,
    logoSize = 0.22,
    logoPadding = 8,
    logoBackground = '#ffffff',
    logoShape = 'rounded',
    targetSizePx = 1000,
  } = options;

  // Generate QR Matrix
  const qr = QRCode.create(text || 'https://qrject.dev', {
    errorCorrectionLevel,
  });

  const moduleCount = qr.modules.size;
  const size = targetSizePx;
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // Quiet zone margin: standard 4 modules on each side
  const quietModules = 4;
  const totalModules = moduleCount + quietModules * 2;
  const cellSize = size / totalModules;
  const offsetX = quietModules * cellSize;
  const offsetY = quietModules * cellSize;

  // Compute gradient if enabled
  let fillStyle: string | CanvasGradient = foregroundColor;
  if (gradientEnabled && gradientEndColor) {
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, foregroundColor);
    grad.addColorStop(1, gradientEndColor);
    fillStyle = grad;
  }

  // Pre-calculate logo module radius to mask cells behind logo
  let logoRadiusModules = 0;
  if (logoUrl) {
    const logoPx = size * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoModules = Math.ceil(logoPx / cellSize);
    logoRadiusModules = Math.floor(logoModules / 2) + 1;
  }

  ctx.fillStyle = fillStyle;

  // Draw regular data & alignment modules (excluding finders and logo zone)
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue;
      if (logoUrl && isLogoZone(r, c, moduleCount, logoRadiusModules)) continue;

      const isDark = qr.modules.get(r, c);
      if (!isDark) continue;

      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      drawModule(ctx, x, y, cellSize, dotShape);
    }
  }

  // Draw 3 Finder Eyes (Top-Left, Top-Right, Bottom-Left)
  const eyePositions = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - 7 },
    { row: moduleCount - 7, col: 0 },
  ];

  for (const pos of eyePositions) {
    const eyeX = offsetX + pos.col * cellSize;
    const eyeY = offsetY + pos.row * cellSize;
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

  // Draw Center Logo if provided
  if (logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      const logoBoxSize = size * Math.min(Math.max(logoSize, 0.15), 0.32);
      const logoX = (size - logoBoxSize) / 2;
      const logoY = (size - logoBoxSize) / 2;

      // Draw Logo Background Cutout
      ctx.save();
      ctx.fillStyle = logoBackground;
      ctx.shadowColor = 'rgba(0,0,0,0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 0;
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

      // Clip and draw image inside padded area
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

      // Preserve aspect ratio
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

      if (options.photoBWMode) {
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
 * optional embedded photo/logo, B/W filtering, and module/eye geometry.
 */
export function generateQRSVG(options: QROptions): string {
  const {
    text,
    errorCorrectionLevel = options.logoUrl ? 'H' : 'M',
    foregroundColor = '#000000',
    backgroundColor = '#ffffff',
    eyeOuterColor = foregroundColor,
    eyeInnerColor = foregroundColor,
    dotShape = 'square',
    eyeFrameShape = 'square',
    eyeBallShape = 'square',
    logoUrl = null,
    logoSize = 0.22,
    logoPadding = 8,
    logoBackground = '#ffffff',
    logoShape = 'square',
    photoBWMode = false,
  } = options;

  const qr = QRCode.create(text || 'https://qrject.dev', { errorCorrectionLevel });
  const moduleCount = qr.modules.size;
  const quietModules = 4;
  const total = moduleCount + quietModules * 2;
  const cellSize = 10;
  const totalSize = total * cellSize;
  const offset = quietModules * cellSize;

  // Calculate logo modules to mask center cells
  let logoRadiusModules = 0;
  if (logoUrl) {
    const logoPx = totalSize * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoModules = Math.ceil(logoPx / cellSize);
    logoRadiusModules = Math.floor(logoModules / 2) + 1;
  }

  let defsElements = '';
  if (photoBWMode) {
    defsElements += `
    <filter id="svg-qr-bw">
      <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 1 0"/>
    </filter>`;
  }

  let svgElements = '';

  // Draw data & alignment modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (isFinderPattern(r, c, moduleCount)) continue;
      if (logoUrl && isLogoZone(r, c, moduleCount, logoRadiusModules)) continue;
      if (!qr.modules.get(r, c)) continue;

      const x = offset + c * cellSize;
      const y = offset + r * cellSize;

      if (dotShape === 'dots') {
        const radius = cellSize * 0.45;
        svgElements += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${radius}" fill="${foregroundColor}" />`;
      } else if (dotShape === 'rounded') {
        svgElements += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize - 1}" height="${cellSize - 1}" rx="${cellSize * 0.3}" fill="${foregroundColor}" />`;
      } else if (dotShape === 'diamond') {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        svgElements += `<polygon points="${cx},${y} ${x + cellSize},${cy} ${cx},${y + cellSize} ${x},${cy}" fill="${foregroundColor}" />`;
      } else if (dotShape === 'classy') {
        svgElements += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${cellSize - 1}" height="${cellSize - 1}" rx="${cellSize * 0.4}" fill="${foregroundColor}" />`;
      } else {
        svgElements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${foregroundColor}" />`;
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
    const eyeX = offset + pos.col * cellSize;
    const eyeY = offset + pos.row * cellSize;
    const eyeSize = 7 * cellSize;

    // Outer frame rx
    const frameRx =
      eyeFrameShape === 'circle'
        ? eyeSize / 2
        : eyeFrameShape === 'squircle'
        ? cellSize * 2.5
        : eyeFrameShape === 'rounded'
        ? cellSize * 1.6
        : 0;

    // Hollow 5x5 rx
    const hollowSize = 5 * cellSize;
    const hollowRx =
      eyeFrameShape === 'circle'
        ? hollowSize / 2
        : eyeFrameShape === 'squircle'
        ? cellSize * 1.8
        : eyeFrameShape === 'rounded'
        ? cellSize * 1.0
        : 0;

    // Inner 3x3 ball
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

  // Draw Logo / Photo if present
  let logoElements = '';
  if (logoUrl) {
    const logoBoxSize = totalSize * Math.min(Math.max(logoSize, 0.15), 0.32);
    const logoX = (totalSize - logoBoxSize) / 2;
    const logoY = (totalSize - logoBoxSize) / 2;
    const boxRadius = logoShape === 'circle' ? logoBoxSize / 2 : logoShape === 'rounded' ? logoBoxSize * 0.2 : 0;

    const pad = Math.max(logoPadding, 4);
    const innerSize = logoBoxSize - pad * 2;
    const innerX = logoX + pad;
    const innerY = logoY + pad;
    const innerRadius = logoShape === 'circle' ? innerSize / 2 : logoShape === 'rounded' ? innerSize * 0.15 : 0;

    // Clip path for photo
    defsElements += `
    <clipPath id="svg-qr-photo-clip">
      ${
        logoShape === 'circle'
          ? `<circle cx="${innerX + innerSize / 2}" cy="${innerY + innerSize / 2}" r="${innerSize / 2}" />`
          : `<rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${innerRadius}" />`
      }
    </clipPath>`;

    // Background badge cutout
    if (logoShape === 'circle') {
      logoElements += `<circle cx="${logoX + logoBoxSize / 2}" cy="${logoY + logoBoxSize / 2}" r="${logoBoxSize / 2}" fill="${logoBackground}" stroke="#000000" stroke-width="1" />`;
    } else {
      logoElements += `<rect x="${logoX}" y="${logoY}" width="${logoBoxSize}" height="${logoBoxSize}" rx="${boxRadius}" fill="${logoBackground}" stroke="#000000" stroke-width="1" />`;
    }

    // Photo/Logo Image
    logoElements += `<image href="${logoUrl}" x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" preserveAspectRatio="xMidYMid meet" clip-path="url(#svg-qr-photo-clip)" ${photoBWMode ? 'filter="url(#svg-qr-bw)"' : ''} />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">
  ${defsElements ? `<defs>${defsElements}</defs>` : ''}
  <rect width="${totalSize}" height="${totalSize}" fill="${backgroundColor}"/>
  ${svgElements}
  ${logoElements}
</svg>`;
}
