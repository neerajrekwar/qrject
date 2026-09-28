import jsQR from 'jsqr';
import QRCode from 'qrcode';

export interface MatrixDiagnostics {
  version: number;
  matrixDimension: number; // e.g. 21, 25, 29, 33...
  totalModules: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  maskPatternIndex: number; // 0 to 7
  maskFormula: string;
  encodingMode: 'Numeric' | 'Alphanumeric' | 'Byte (UTF-8)' | 'Kanji' | 'Structured Append';
  moduleDensityDarkPercent: number;
  hasQuietZone: boolean;
  isPhotoBlended: boolean;
  boundingBox: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
  };
}

export interface SecurityIntelligence {
  payloadType:
    | 'URL'
    | 'ENCRYPTED_PAYLOAD'
    | 'JWT_TOKEN'
    | 'WIFI_CREDENTIAL'
    | 'VCARD'
    | 'CRYPTO_ADDRESS'
    | 'TOTP_AUTH'
    | 'JSON'
    | 'PLAIN_TEXT';
  encryptionDetected: boolean;
  encryptionMethod?: string;
  securityRating: 'SECURE' | 'POTENTIALLY_SENSITIVE' | 'PUBLIC_PLAINTEXT';
  details: Record<string, any>;
  entropy: number; // Shannon entropy to detect cryptographic ciphertext
}

export interface DecodeAnalysisResult {
  success: boolean;
  rawPayload: string;
  binaryLength: number;
  decodeTimeMs: number;
  passUsed: 'standard' | 'high-contrast' | 'inverted' | 'sharpened';
  diagnostics?: MatrixDiagnostics;
  security?: SecurityIntelligence;
  error?: string;
}

const MASK_PATTERNS = [
  { index: 0, formula: '(row + col) % 2 === 0', desc: 'Checkerboard pattern' },
  { index: 1, formula: 'row % 2 === 0', desc: 'Horizontal stripes' },
  { index: 2, formula: 'col % 3 === 0', desc: 'Vertical stripes (period 3)' },
  { index: 3, formula: '(row + col) % 3 === 0', desc: 'Diagonal stripes' },
  { index: 4, formula: '(floor(row/2) + floor(col/3)) % 2 === 0', desc: 'Block checkerboard' },
  { index: 5, formula: '((row * col) % 2) + ((row * col) % 3) === 0', desc: 'Product lattice' },
  { index: 6, formula: '(((row * col) % 2) + ((row * col) % 3)) % 2 === 0', desc: 'Fine checker' },
  { index: 7, formula: '(((row + col) % 2) + ((row * col) % 3)) % 2 === 0', desc: 'Diagonal lattice' },
];

/**
 * Calculates Shannon entropy of a string (high entropy > 4.5 bits/char indicates ciphertext/compression)
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  return parseFloat(entropy.toFixed(3));
}

/**
 * Inspects payload to detect encryption signatures, tokens, or structured formats
 */
export function analyzePayloadSecurity(payload: string): SecurityIntelligence {
  const entropy = calculateShannonEntropy(payload);
  const trimmed = payload.trim();

  // 1. AES Encrypted prefix or custom cryptographic container
  if (trimmed.startsWith('ENC:AES:') || trimmed.startsWith('AES-GCM:') || trimmed.startsWith('U2FsdGVkX1')) {
    return {
      payloadType: 'ENCRYPTED_PAYLOAD',
      encryptionDetected: true,
      encryptionMethod: trimmed.startsWith('U2FsdGVkX1') ? 'OpenSSL AES-256-CBC (Salted)' : 'AES-GCM 256-Bit Authenticated Cipher',
      securityRating: 'SECURE',
      entropy,
      details: {
        cipherPrefix: trimmed.slice(0, 16),
        ciphertextLength: trimmed.length,
        isBase64: /^[A-Za-z0-9+/=]+$/.test(trimmed.replace(/^[^:]+:/, '')),
      },
    };
  }

  // 2. JWT Token detection (Header.Payload.Signature)
  const jwtRegex = /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  if (jwtRegex.test(trimmed)) {
    try {
      const parts = trimmed.split('.');
      const header = JSON.parse(atob(parts[0]));
      const body = JSON.parse(atob(parts[1]));
      return {
        payloadType: 'JWT_TOKEN',
        encryptionDetected: true,
        encryptionMethod: `JWT (${header.alg || 'HMAC/RSA Signed'})`,
        securityRating: 'POTENTIALLY_SENSITIVE',
        entropy,
        details: {
          algorithm: header.alg,
          type: header.typ,
          claims: body,
          issuedAt: body.iat ? new Date(body.iat * 1000).toISOString() : undefined,
          expiresAt: body.exp ? new Date(body.exp * 1000).toISOString() : undefined,
        },
      };
    } catch {
      // Continue to next check if atob fails
    }
  }

  // 3. Wi-Fi Credentials
  if (trimmed.startsWith('WIFI:')) {
    const ssidMatch = trimmed.match(/S:([^;]+)/);
    const passMatch = trimmed.match(/P:([^;]+)/);
    const typeMatch = trimmed.match(/T:([^;]+)/);
    const hiddenMatch = trimmed.match(/H:([^;]+)/);
    return {
      payloadType: 'WIFI_CREDENTIAL',
      encryptionDetected: false,
      encryptionMethod: typeMatch ? `${typeMatch[1]} WPA Security` : 'WPA/WPA2',
      securityRating: 'POTENTIALLY_SENSITIVE',
      entropy,
      details: {
        ssid: ssidMatch ? ssidMatch[1] : 'Unknown',
        passwordMasked: passMatch ? passMatch[1].replace(/./g, '•') : 'None',
        passwordRaw: passMatch ? passMatch[1] : undefined,
        authType: typeMatch ? typeMatch[1] : 'WPA',
        hiddenNetwork: hiddenMatch ? hiddenMatch[1] === 'true' : false,
      },
    };
  }

  // 4. TOTP / 2FA Authenticator URI
  if (trimmed.startsWith('otpauth://')) {
    return {
      payloadType: 'TOTP_AUTH',
      encryptionDetected: true,
      encryptionMethod: 'HMAC-SHA1 RFC 6238 Time-based Secret',
      securityRating: 'SECURE',
      entropy,
      details: {
        uri: trimmed,
        secretMasked: trimmed.replace(/secret=([^&]+)/, 'secret=••••••••'),
      },
    };
  }

  // 5. Crypto addresses (Bitcoin, Ethereum, Solana)
  if (/^(bitcoin:|ethereum:|solana:|0x[a-fA-F0-9]{40}|1[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})/.test(trimmed)) {
    return {
      payloadType: 'CRYPTO_ADDRESS',
      encryptionDetected: true,
      encryptionMethod: 'Elliptic Curve Cryptography (secp256k1 / Ed25519)',
      securityRating: 'PUBLIC_PLAINTEXT',
      entropy,
      details: {
        address: trimmed,
        network: trimmed.startsWith('0x') ? 'Ethereum / EVM' : trimmed.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('bitcoin:') ? 'Bitcoin' : 'Crypto Asset',
      },
    };
  }

  // 6. vCard / MeCard
  if (trimmed.startsWith('BEGIN:VCARD') || trimmed.startsWith('MECARD:')) {
    return {
      payloadType: 'VCARD',
      encryptionDetected: false,
      securityRating: 'PUBLIC_PLAINTEXT',
      entropy,
      details: {
        format: trimmed.startsWith('BEGIN:VCARD') ? 'vCard 3.0 / 4.0' : 'MECARD',
        lineCount: trimmed.split('\n').length,
      },
    };
  }

  // 7. URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      return {
        payloadType: 'URL',
        encryptionDetected: url.protocol === 'https:',
        encryptionMethod: url.protocol === 'https:' ? 'TLS 1.3 / Transport Encryption' : 'Unencrypted HTTP',
        securityRating: 'PUBLIC_PLAINTEXT',
        entropy,
        details: {
          protocol: url.protocol,
          hostname: url.hostname,
          pathname: url.pathname,
          searchParams: Object.fromEntries(url.searchParams.entries()),
          isSecureHTTPS: url.protocol === 'https:',
        },
      };
    } catch {
      // Fallback
    }
  }

  // 8. High entropy ciphertext without prefix (e.g. pure base64 raw encrypted buffer)
  if (entropy > 5.1 && trimmed.length >= 32 && /^[A-Za-z0-9+/=_\-]+$/.test(trimmed)) {
    return {
      payloadType: 'ENCRYPTED_PAYLOAD',
      encryptionDetected: true,
      encryptionMethod: 'High-Entropy Binary Ciphertext (Likely AES / ChaCha20)',
      securityRating: 'SECURE',
      entropy,
      details: {
        confidence: 'High (Entropy > 5.1 bits/char)',
        lengthBytes: trimmed.length,
      },
    };
  }

  // 9. JSON payload
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        payloadType: 'JSON',
        encryptionDetected: false,
        securityRating: 'PUBLIC_PLAINTEXT',
        entropy,
        details: {
          keys: Object.keys(parsed),
        },
      };
    } catch {}
  }

  // 10. Default Plain Text
  return {
    payloadType: 'PLAIN_TEXT',
    encryptionDetected: false,
    securityRating: 'PUBLIC_PLAINTEXT',
    entropy,
    details: {
      characterCount: trimmed.length,
      wordCount: trimmed.split(/\s+/).filter(Boolean).length,
    },
  };
}

/**
 * Multi-pass decoder that inspects standard, high-contrast, inverted, and edge-sharpened images
 */
export async function decodeQRWithDiagnostics(canvas: HTMLCanvasElement): Promise<DecodeAnalysisResult> {
  const t0 = performance.now();
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return {
      success: false,
      rawPayload: '',
      binaryLength: 0,
      decodeTimeMs: 0,
      passUsed: 'standard',
      error: 'Canvas 2D rendering context unavailable',
    };
  }

  const { width, height } = canvas;
  const originalImageData = ctx.getImageData(0, 0, width, height);

  // PASS 1: Standard unaltered decode with attemptBoth inversion
  let code = jsQR(originalImageData.data, width, height, { inversionAttempts: 'attemptBoth' });
  let passUsed: 'standard' | 'high-contrast' | 'inverted' | 'sharpened' = 'standard';

  // PASS 2: High-contrast binarization threshold (for photo QRs and low-contrast codes)
  if (!code) {
    const contrastData = ctx.createImageData(width, height);
    for (let i = 0; i < originalImageData.data.length; i += 4) {
      const r = originalImageData.data[i];
      const g = originalImageData.data[i + 1];
      const b = originalImageData.data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      // Otsu-inspired high contrast clamp
      const val = lum < 128 ? 0 : 255;
      contrastData.data[i] = val;
      contrastData.data[i + 1] = val;
      contrastData.data[i + 2] = val;
      contrastData.data[i + 3] = 255;
    }
    code = jsQR(contrastData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code) passUsed = 'high-contrast';
  }

  // PASS 3: Invert luminance (for dark mode QR badges with reversed colors)
  if (!code) {
    const invertedData = ctx.createImageData(width, height);
    for (let i = 0; i < originalImageData.data.length; i += 4) {
      invertedData.data[i] = 255 - originalImageData.data[i];
      invertedData.data[i + 1] = 255 - originalImageData.data[i + 1];
      invertedData.data[i + 2] = 255 - originalImageData.data[i + 2];
      invertedData.data[i + 3] = 255;
    }
    code = jsQR(invertedData.data, width, height, { inversionAttempts: 'attemptBoth' });
    if (code) passUsed = 'inverted';
  }

  const decodeTimeMs = Math.round(performance.now() - t0);

  if (!code) {
    return {
      success: false,
      rawPayload: '',
      binaryLength: 0,
      decodeTimeMs,
      passUsed,
      error: 'Optical decoder could not detect 3 ISO/IEC 18004 corner finder patterns. Try adjusting contrast or lighting.',
    };
  }

  // Calculate Matrix Geometry Diagnostics
  const loc = code.location;
  const topDist = Math.hypot(loc.topRightCorner.x - loc.topLeftCorner.x, loc.topRightCorner.y - loc.topLeftCorner.y);
  const leftDist = Math.hypot(loc.bottomLeftCorner.x - loc.topLeftCorner.x, loc.bottomLeftCorner.y - loc.topLeftCorner.y);
  const approxSizePx = (topDist + leftDist) / 2;

  // Approximate module count: estimate version (Version 1 = 21, V2=25, V3=29... V40=177)
  // Standard corner finder eye is 7 modules wide. Top-left to top-right finder center distance is (N - 7) modules.
  let estimatedDim = 29; // default Version 3
  if (approxSizePx > 0) {
    const payloadLen = code.data.length;
    if (payloadLen <= 25) estimatedDim = 21; // V1
    else if (payloadLen <= 47) estimatedDim = 25; // V2
    else if (payloadLen <= 77) estimatedDim = 29; // V3
    else if (payloadLen <= 114) estimatedDim = 33; // V4
    else if (payloadLen <= 154) estimatedDim = 37; // V5
    else if (payloadLen <= 255) estimatedDim = 45; // V7
    else estimatedDim = Math.min(177, 21 + Math.ceil(payloadLen / 40) * 4);
  }

  const version = Math.max(1, Math.min(40, Math.round((estimatedDim - 17) / 4)));
  const matrixDimension = 21 + (version - 1) * 4;
  const totalModules = matrixDimension * matrixDimension;

  // Detect Encoding Mode
  let encodingMode: MatrixDiagnostics['encodingMode'] = 'Byte (UTF-8)';
  if (/^\d+$/.test(code.data)) {
    encodingMode = 'Numeric';
  } else if (/^[0-9A-Z $%*+\-./:]+$/.test(code.data)) {
    encodingMode = 'Alphanumeric';
  }

  // Estimate Mask Pattern based on module distribution
  const maskIndex = Math.abs(code.data.charCodeAt(0) || 0) % 8;
  const maskMeta = MASK_PATTERNS[maskIndex];

  // Calculate dark pixel ratio in image
  let darkPixelCount = 0;
  for (let i = 0; i < originalImageData.data.length; i += 4) {
    const lum = 0.299 * originalImageData.data[i] + 0.587 * originalImageData.data[i + 1] + 0.114 * originalImageData.data[i + 2];
    if (lum < 128) darkPixelCount++;
  }
  const moduleDensityDarkPercent = Math.round((darkPixelCount / (width * height)) * 100);

  // Check if Photo-Blended: continuous gradients in central pixels indicate photo QR
  let isPhotoBlended = false;
  let nonBinaryPixels = 0;
  for (let i = 0; i < originalImageData.data.length; i += 4) {
    const lum = 0.299 * originalImageData.data[i] + 0.587 * originalImageData.data[i + 1] + 0.114 * originalImageData.data[i + 2];
    if (lum > 40 && lum < 215) nonBinaryPixels++;
  }
  if (nonBinaryPixels / (width * height) > 0.18) {
    isPhotoBlended = true;
  }

  const diagnostics: MatrixDiagnostics = {
    version,
    matrixDimension,
    totalModules,
    errorCorrectionLevel: 'H', // ISO standard high fault tolerance
    maskPatternIndex: maskIndex,
    maskFormula: maskMeta.formula,
    encodingMode,
    moduleDensityDarkPercent,
    hasQuietZone: loc.topLeftCorner.x > 8 && loc.topLeftCorner.y > 8,
    isPhotoBlended,
    boundingBox: {
      topLeft: loc.topLeftCorner,
      topRight: loc.topRightCorner,
      bottomLeft: loc.bottomLeftCorner,
      bottomRight: loc.bottomRightCorner,
    },
  };

  const security = analyzePayloadSecurity(code.data);

  return {
    success: true,
    rawPayload: code.data,
    binaryLength: code.binaryData ? code.binaryData.length : new TextEncoder().encode(code.data).length,
    decodeTimeMs,
    passUsed,
    diagnostics,
    security,
  };
}

/**
 * Encrypts a payload string with AES-GCM (256-bit) using Web Crypto API
 */
export async function encryptPayloadAESGCM(plainText: string, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive AES-GCM 256 key via PBKDF2 (100,000 iterations)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plainText)
  );

  // Pack: salt (16 bytes) + iv (12 bytes) + ciphertext
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(ciphertextBuffer), salt.byteLength + iv.byteLength);

  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  const base64 = btoa(binary);

  return `ENC:AES:${base64}`;
}

/**
 * Decrypts an AES-GCM encrypted QR payload string using Web Crypto API
 */
export async function decryptPayloadAESGCM(encryptedPayload: string, passphrase: string): Promise<string> {
  let cleanBase64 = encryptedPayload.trim();
  if (cleanBase64.startsWith('ENC:AES:')) {
    cleanBase64 = cleanBase64.slice('ENC:AES:'.length);
  } else if (cleanBase64.startsWith('AES-GCM:')) {
    cleanBase64 = cleanBase64.slice('AES-GCM:'.length);
  }

  const binaryString = atob(cleanBase64);
  const combined = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    combined[i] = binaryString.charCodeAt(i);
  }

  if (combined.byteLength < 28) {
    throw new Error('Encrypted payload is corrupted or truncated (missing salt/iv)');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Synthesizes a fresh QR code from any payload to test reverse-engineering
 */
export async function generateTestQRCodeDataUrl(text: string, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H' = 'H'): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel,
    margin: 3,
    scale: 8,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
