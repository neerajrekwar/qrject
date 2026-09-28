'use client';

import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  Camera,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  Layers,
  Terminal,
  FileCode,
  Binary,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  QrCode,
  KeyRound,
  Zap,
  Crosshair,
  Activity,
  ArrowRight,
  Download,
  Search,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  decodeQRWithDiagnostics,
  analyzePayloadSecurity,
  encryptPayloadAESGCM,
  decryptPayloadAESGCM,
  generateTestQRCodeDataUrl,
  DecodeAnalysisResult,
  calculateShannonEntropy,
} from '@/lib/qr-crush-analyzer';

const SAMPLE_SPECIMENS = [
  {
    id: 'sample-aes',
    title: 'AES-256 Encrypted Payload',
    tag: 'ENCRYPTED',
    description: 'Ciphertext container with PBKDF2 + AES-GCM (Passphrase: "quantum2026")',
    generatePayload: async () => {
      return await encryptPayloadAESGCM(
        'CONFIDENTIAL ARCHITECT DOSSIER // AGENT ID: NR-817 // AUTH: LEVEL 5 CLEARANCE // COORDINATES: 37.7749° N, 122.4194° W',
        'quantum2026'
      );
    },
  },
  {
    id: 'sample-wifi',
    title: 'WPA2 Enterprise Wi-Fi Key',
    tag: 'NETWORK CREDENTIAL',
    description: 'Direct router connection string with pre-shared key',
    generatePayload: async () => 'WIFI:T:WPA;S:CYBER_OPS_5G;P:N33r@j_R3kw@r_S3cur3!;;',
  },
  {
    id: 'sample-jwt',
    title: 'Signed JWT Authentication Token',
    tag: 'CRYPTO SIGNED',
    description: 'HMAC-SHA256 authenticated user session token with payload claims',
    generatePayload: async () => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'neerajrekwar817@gmail.com',
          role: 'SENIOR_SYSTEMS_ARCHITECT',
          iss: 'qrject.dev',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 86400,
        })
      );
      const signature = 'a7c91e84df2198be0092bc311e9f84820a021';
      return `${header}.${payload}.${signature}`;
    },
  },
  {
    id: 'sample-crypto',
    title: 'Elliptic Curve Crypto Address',
    tag: 'BLOCKCHAIN',
    description: 'Bitcoin SegWit Bech32 cryptographic destination address',
    generatePayload: async () => 'bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq?amount=0.045&label=ArchitectFee',
  },
  {
    id: 'sample-vcard',
    title: 'vCard 4.0 Contact Dossier',
    tag: 'STRUCTURED vCARD',
    description: 'Professional developer contact schema with MIME types',
    generatePayload: async () =>
      'BEGIN:VCARD\nVERSION:4.0\nN:Rekwar;Neeraj;;;\nFN:Neeraj Rekwar\nTITLE:Senior Systems Architect\nEMAIL:neerajrekwar817@gmail.com\nURL:https://qrject.dev\nEND:VCARD',
  },
];

export default function QRCrushSecretPage() {
  const [activeTab, setActiveTab] = useState<'decoder' | 'technology' | 'crypto-lab' | 'generation-method'>('decoder');
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<DecodeAnalysisResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const cameraIntervalRef = useRef<number | null>(null);

  // Canvas Refs
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Crypto Lab State
  const [cryptoInputText, setCryptoInputText] = useState<string>(
    'TOP SECRET: Next-generation optical QR matrices support continuous physical pHYs resolution chunks and 21:1 B/W contrast.'
  );
  const [cryptoPassphrase, setCryptoPassphrase] = useState<string>('quantum2026');
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [encryptedQRDataUrl, setEncryptedQRDataUrl] = useState<string | null>(null);
  const [decryptInputPayload, setDecryptInputPayload] = useState<string>('');
  const [decryptPassphrase, setDecryptPassphrase] = useState<string>('quantum2026');
  const [decryptedText, setDecryptedText] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Perform full optical and forensic decode
  const executeAnalysisOnImage = async (imageSource: string) => {
    setIsAnalyzing(true);
    setCurrentImageSrc(imageSource);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image for optical scanning'));
        img.src = imageSource;
      });

      const canvas = workingCanvasRef.current || document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 800;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Failed to obtain canvas context');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const result = await decodeQRWithDiagnostics(canvas);
      setAnalysisResult(result);

      if (result.success && result.security?.payloadType === 'ENCRYPTED_PAYLOAD') {
        setDecryptInputPayload(result.rawPayload);
      }

      if (result.success) {
        showToast(`Decoded via ${result.passUsed.toUpperCase()} pass (${result.decodeTimeMs}ms)`);
      } else {
        showToast('Scanning failed: No readable QR patterns found');
      }
    } catch (err: any) {
      console.error('Forensic decode failed:', err);
      setAnalysisResult({
        success: false,
        rawPayload: '',
        binaryLength: 0,
        decodeTimeMs: 0,
        passUsed: 'standard',
        error: err.message || 'Unknown decode error',
      });
      showToast('Error analyzing QR image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // File input handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) executeAnalysisOnImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste listener (Ctrl+V anywhere on the page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              if (dataUrl) {
                showToast('Pasted image detected. Running matrix analysis...');
                executeAnalysisOnImage(dataUrl);
              }
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Camera Live Scanner
  const startCameraScanner = async () => {
    setCameraError(null);
    setIsCameraActive(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Live scan loop every 200ms
      cameraIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;

        const video = videoRef.current;
        const canvas = workingCanvasRef.current || document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const result = await decodeQRWithDiagnostics(canvas);
        if (result.success) {
          stopCameraScanner();
          setCurrentImageSrc(canvas.toDataURL('image/png'));
          setAnalysisResult(result);
          showToast(`Optical barcode locked via camera! (${result.decodeTimeMs}ms)`);
        }
      }, 250);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can upload an image or paste from clipboard instead.');
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (cameraIntervalRef.current) {
      clearInterval(cameraIntervalRef.current);
      cameraIntervalRef.current = null;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Load a sample specimen
  const loadSpecimen = async (specimen: (typeof SAMPLE_SPECIMENS)[0]) => {
    setIsAnalyzing(true);
    try {
      const payload = await specimen.generatePayload();
      const qrDataUrl = await generateTestQRCodeDataUrl(payload, 'H');
      await executeAnalysisOnImage(qrDataUrl);
      showToast(`Loaded Specimen: ${specimen.title}`);
    } catch (err) {
      console.error('Specimen generation failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize with the first sample on load
  useEffect(() => {
    loadSpecimen(SAMPLE_SPECIMENS[0]);
    return () => stopCameraScanner();
  }, []);

  // Handle AES Encryption Test
  const handleRunEncryption = async () => {
    if (!cryptoInputText || !cryptoPassphrase) return;
    try {
      const encrypted = await encryptPayloadAESGCM(cryptoInputText, cryptoPassphrase);
      setEncryptedOutput(encrypted);
      const dataUrl = await generateTestQRCodeDataUrl(encrypted, 'H');
      setEncryptedQRDataUrl(dataUrl);
      showToast('Payload encrypted with AES-GCM 256-Bit!');
    } catch (err: any) {
      console.error('Encryption failed:', err);
      showToast('Encryption failed: ' + err.message);
    }
  };

  // Handle Decryption
  const handleRunDecryption = async () => {
    setDecryptError(null);
    setDecryptedText(null);
    if (!decryptInputPayload || !decryptPassphrase) return;

    try {
      const plain = await decryptPayloadAESGCM(decryptInputPayload, decryptPassphrase);
      setDecryptedText(plain);
      showToast('Decryption successful! Cleartext recovered.');
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setDecryptError('Decryption failed: Incorrect passphrase or corrupted payload signature.');
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans selection:bg-[#ccff00] selection:text-black flex flex-col">
      {/* Hidden working canvas */}
      <canvas ref={workingCanvasRef} className="hidden" />

      {/* TOAST POPUP */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#ccff00] text-black border-2 border-black px-4 py-2 font-mono text-xs font-black shadow-[4px_4px_0px_#ffffff] flex items-center gap-2 animate-bounce">
          <Activity className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP SECRET CLASSIFIED HEADER BAR */}
      <header className="border-b-2 border-black bg-black text-[#ccff00] px-4 py-3 sticky top-0 z-40 shadow-[0_4px_0px_#ccff00]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#ccff00] bg-zinc-950 text-[#ccff00] flex items-center justify-center font-mono font-black text-sm shadow-[2px_2px_0px_#ccff00]">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black tracking-wider uppercase text-white">
                  QR-CRUSH // FORENSIC DECODER & PATTERN ANALYZER
                </span>
                <span className="bg-[#ccff00] text-black text-[9px] font-mono font-black px-1.5 py-0.2 rounded-xs uppercase">
                  CONFIDENTIAL LAB
                </span>
              </div>
              <div className="font-mono text-[10px] text-zinc-400">
                URL DIRECT ACCESS ONLY · MATRIX DECOMPILER · PATTERN REVERSE-ENGINEERING · CRYPTO INTEL
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="border border-[#ccff00] bg-black hover:bg-[#ccff00] hover:text-black text-[#ccff00] px-3 py-1 font-mono text-xs font-bold transition-all flex items-center gap-1 shadow-[2px_2px_0px_#ccff00]"
            >
              <span>RETURN TO MAIN STUDIO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. SECRET BANNER NOTICE */}
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 font-mono text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-zinc-200 font-bold">OPTICAL ENGINE:</span>
          <span>Multi-Pass ISO/IEC 18004 Reverse-Engineering Subsystem (jsQR + Otsu Thresholding + Shannon Entropy Engine)</span>
        </div>
        <div className="text-[10px] text-zinc-500">
          Paste image anytime with <kbd className="px-1 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 rounded text-[9px]">Ctrl+V</kbd>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 sm:py-8 flex-1 space-y-6">
        
        {/* Dossier Title Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-zinc-900 border border-zinc-700 text-[#ccff00] font-mono text-xs mb-2">
              <Binary className="w-3.5 h-3.5" />
              <span>CLASSIFIED TOOL: /qr-crush DIRECT SEARCH-BAR DISPATCH</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase font-mono">
              DECODE & CRUSH QR MATRICES
            </h1>
            <p className="text-zinc-400 font-mono text-xs sm:text-sm mt-1 max-w-3xl">
              Inspect the exact technological pattern, Reed-Solomon polynomial fault tolerance, ISO/IEC 18004 mask algorithm, and detect whether the QR contains AES encryption, signed JWTs, network credentials, or plain text.
            </p>
          </div>

          {/* Quick Navigation Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 font-mono text-xs overflow-x-auto">
            {[
              { id: 'decoder', label: '1. OPTICAL DECODER', icon: Search },
              { id: 'technology', label: '2. PATTERN TECHNOLOGY', icon: Layers },
              { id: 'crypto-lab', label: '3. ENCRYPTION LAB', icon: Lock },
              { id: 'generation-method', label: '4. HOW QRs ARE BUILT', icon: FileCode },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-3 py-1.5 flex items-center gap-1.5 font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#ccff00] text-black shadow-[2px_2px_0px_#ffffff]'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: OPTICAL DECODER & FORENSIC SCANNER */}
        {/* ========================================================================= */}
        {activeTab === 'decoder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT 6 COLS: Image Input & Live Viewport */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Capture Control Panel */}
              <div className="border border-zinc-800 bg-zinc-950 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-[#ccff00]" />
                    <span>LOAD TARGET QR CODE MATRIX</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">INPUT SOURCE</span>
                </div>

                {/* Input Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {/* File Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="crush-file-upload"
                  />
                  <label
                    htmlFor="crush-file-upload"
                    className="border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white p-2.5 font-mono text-xs font-bold text-center cursor-pointer flex items-center justify-center gap-2 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-[#ccff00]" />
                    <span>UPLOAD IMAGE</span>
                  </label>

                  {/* Live Camera Scanner Button */}
                  <button
                    onClick={isCameraActive ? stopCameraScanner : startCameraScanner}
                    className={`border p-2.5 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isCameraActive
                        ? 'border-rose-500 bg-rose-950/40 text-rose-300'
                        : 'border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-white'
                    }`}
                  >
                    <Camera className={`w-4 h-4 ${isCameraActive ? 'text-rose-400 animate-pulse' : 'text-[#ccff00]'}`} />
                    <span>{isCameraActive ? 'STOP CAMERA' : 'OPTICAL CAMERA'}</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="p-2.5 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Built-in Classified Specimen Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-mono text-[11px] text-zinc-400 block font-bold">
                    OR TEST WITH CLASSIFIED SPECIMENS:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {SAMPLE_SPECIMENS.map((specimen) => (
                      <button
                        key={specimen.id}
                        onClick={() => loadSpecimen(specimen)}
                        className="p-2 border border-zinc-800 bg-zinc-900 hover:border-[#ccff00] text-left transition-all cursor-pointer font-mono group"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-200 group-hover:text-[#ccff00]">
                          <span className="truncate">{specimen.title}</span>
                          <span className="text-[9px] bg-black px-1.5 py-0.2 rounded border border-zinc-700 text-zinc-400">
                            {specimen.tag}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{specimen.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Viewport Display Area */}
              <div className="border border-zinc-800 bg-zinc-950 p-4 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
                {isCameraActive ? (
                  <div className="relative w-full aspect-square max-w-[320px] border-2 border-[#ccff00] overflow-hidden flex items-center justify-center bg-black">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {/* Viewfinder Target Reticle */}
                    <div className="absolute inset-8 border border-[#ccff00]/60 pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between text-[9px] font-mono text-[#ccff00]">
                        <span>SCANNING FOR FINDERS</span>
                        <span className="animate-pulse">● REC</span>
                      </div>
                      <div className="w-full h-0.5 bg-[#ccff00]/80 shadow-[0_0_8px_#ccff00] animate-bounce" />
                      <div className="flex justify-between text-[9px] font-mono text-[#ccff00]">
                        <span>ISO/IEC 18004</span>
                        <span>TARGET LOCK</span>
                      </div>
                    </div>
                  </div>
                ) : currentImageSrc ? (
                  <div className="relative p-2 bg-white border-2 border-black max-w-[300px] shadow-[4px_4px_0px_#ccff00]">
                    <img
                      src={currentImageSrc}
                      alt="Scanned QR Matrix"
                      className="w-full h-auto block object-contain aspect-square"
                    />
                    {analysisResult?.success && (
                      <div className="absolute bottom-1 right-1 bg-black text-[#ccff00] font-mono text-[9px] font-bold px-1.5 py-0.5 border border-[#ccff00]">
                        DECODED ({analysisResult.decodeTimeMs}ms)
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center font-mono text-zinc-500 space-y-2 p-8">
                    <QrCode className="w-12 h-12 mx-auto text-zinc-700 animate-pulse" />
                    <p className="text-xs">Drop image, paste with Ctrl+V, or select a specimen</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center font-mono text-xs text-[#ccff00] gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>EXECUTING OPTICAL MATRIX FORENSICS...</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT 6 COLS: Decoded Payload & Intelligence */}
            <div className="lg:col-span-6 space-y-4">
              
              {analysisResult ? (
                analysisResult.success ? (
                  <>
                    {/* Status Ribbon */}
                    <div className="p-3 bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ccff00] animate-pulse" />
                        <span className="font-mono text-xs font-bold text-white uppercase">
                          OPTICAL MATRIX DECODE SUCCESSFUL
                        </span>
                      </div>
                      <div className="font-mono text-[10px] bg-black text-[#ccff00] px-2 py-0.5 border border-zinc-700">
                        {analysisResult.decodeTimeMs}ms · {analysisResult.passUsed.toUpperCase()} PASS
                      </div>
                    </div>

                    {/* Decoded Content Block */}
                    <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                          <Terminal className="w-4 h-4 text-[#ccff00]" />
                          <span>DECODED PAYLOAD VALUE</span>
                        </span>
                        <button
                          onClick={() => copyToClipboard(analysisResult.rawPayload, 'payload')}
                          className="font-mono text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-900 px-2 py-0.5 border border-zinc-700 cursor-pointer"
                        >
                          {copiedKey === 'payload' ? <Check className="w-3 h-3 text-[#ccff00]" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey === 'payload' ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>

                      <div className="p-3 bg-black border border-zinc-800 rounded font-mono text-xs text-[#ccff00] break-all max-h-48 overflow-y-auto whitespace-pre-wrap selection:bg-white selection:text-black">
                        {analysisResult.rawPayload}
                      </div>

                      {/* Payload Metrics */}
                      <div className="grid grid-cols-3 gap-2 font-mono text-[10px] text-center">
                        <div className="p-2 bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">CHAR COUNT</span>
                          <span className="text-white font-bold text-xs">{analysisResult.rawPayload.length}</span>
                        </div>
                        <div className="p-2 bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">BINARY BYTES</span>
                          <span className="text-white font-bold text-xs">{analysisResult.binaryLength} B</span>
                        </div>
                        <div className="p-2 bg-zinc-900 border border-zinc-800">
                          <span className="text-zinc-500 block">SHANNON ENTROPY</span>
                          <span className="text-cyan-300 font-bold text-xs">
                            {analysisResult.security?.entropy.toFixed(2)} b/c
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Security & Cryptographic Analysis Block */}
                    {analysisResult.security && (
                      <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                          <span className="font-mono text-xs font-bold text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-cyan-400" />
                            <span>CRYPTOGRAPHIC & SECURITY INTELLIGENCE</span>
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${
                              analysisResult.security.securityRating === 'SECURE'
                                ? 'bg-purple-950/60 text-purple-300 border-purple-600'
                                : analysisResult.security.securityRating === 'POTENTIALLY_SENSITIVE'
                                ? 'bg-amber-950/60 text-amber-300 border-amber-600'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {analysisResult.security.payloadType.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-400">Encryption Active:</span>
                            <span className={analysisResult.security.encryptionDetected ? 'text-[#ccff00] font-bold' : 'text-zinc-500'}>
                              {analysisResult.security.encryptionDetected ? 'YES (CIPHERTEXT DETECTED)' : 'NO (PLAINTEXT)'}
                            </span>
                          </div>

                          {analysisResult.security.encryptionMethod && (
                            <div className="flex justify-between py-1 border-b border-zinc-900">
                              <span className="text-zinc-400">Cipher / Protocol:</span>
                              <span className="text-cyan-300 font-bold">{analysisResult.security.encryptionMethod}</span>
                            </div>
                          )}

                          {analysisResult.security.payloadType === 'ENCRYPTED_PAYLOAD' && (
                            <div className="p-3 bg-purple-950/30 border border-purple-800/80 rounded space-y-2">
                              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                                <KeyRound className="w-4 h-4" />
                                <span>ENCRYPTED MATRIX DETECTED</span>
                              </div>
                              <p className="text-[11px] text-zinc-300">
                                This payload is locked with symmetric encryption. You can decrypt it directly in the <strong>Encryption Lab</strong> tab using the secret passphrase.
                              </p>
                              <button
                                onClick={() => setActiveTab('crypto-lab')}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                <span>OPEN IN ENCRYPTION LAB →</span>
                              </button>
                            </div>
                          )}

                          {analysisResult.security.payloadType === 'JWT_TOKEN' && analysisResult.security.details && (
                            <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5 text-[11px]">
                              <span className="text-zinc-400 font-bold block">PARSED JWT CLAIMS:</span>
                              <pre className="text-[#ccff00] bg-black p-2 rounded overflow-x-auto text-[10px]">
                                {JSON.stringify(analysisResult.security.details.claims, null, 2)}
                              </pre>
                            </div>
                          )}

                          {analysisResult.security.payloadType === 'WIFI_CREDENTIAL' && analysisResult.security.details && (
                            <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1 text-[11px]">
                              <div><span className="text-zinc-400">Network SSID:</span> <span className="text-white font-bold">{analysisResult.security.details.ssid}</span></div>
                              <div><span className="text-zinc-400">Security Type:</span> <span className="text-[#ccff00] font-bold">{analysisResult.security.details.authType}</span></div>
                              {analysisResult.security.details.passwordRaw && (
                                <div><span className="text-zinc-400">Pre-shared Key:</span> <span className="text-cyan-300 font-bold font-mono">{analysisResult.security.details.passwordRaw}</span></div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Decode Failure Card */
                  <div className="p-6 bg-zinc-950 border border-rose-900 text-center font-mono space-y-3">
                    <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
                    <h3 className="text-sm font-bold text-white uppercase">OPTICAL RECOGNITION FAILED</h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {analysisResult.error || 'The image could not be resolved into valid ISO/IEC 18004 timing and finder matrices.'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Recommendation: Ensure all 3 corner finder squares are unobstructed, increase image resolution, or test with one of the pre-loaded specimens.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-8 bg-zinc-950 border border-zinc-800 text-center font-mono text-zinc-500 space-y-2">
                  <Terminal className="w-10 h-10 mx-auto text-zinc-700" />
                  <p className="text-xs">Awaiting QR Matrix scan input...</p>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PATTERN TECHNOLOGY & GEOMETRY DIAGNOSTICS */}
        {/* ========================================================================= */}
        {activeTab === 'technology' && (
          <div className="space-y-6 font-mono">
            
            {/* Header Telemetry */}
            <div className="border border-zinc-800 bg-zinc-950 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#ccff00]" />
                  <span>ISO/IEC 18004 TECHNICAL PATTERN SPECIFICATION</span>
                </h3>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Reverse-engineered matrix parameters from the decoded QR code
                </p>
              </div>
              <span className="border border-[#ccff00] bg-black text-[#ccff00] px-2.5 py-1 text-xs font-bold">
                VERSION {analysisResult?.diagnostics?.version || 3} ({analysisResult?.diagnostics?.matrixDimension || 29}×{analysisResult?.diagnostics?.matrixDimension || 29})
              </span>
            </div>

            {/* Matrix Architecture Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              
              {/* Card 1: Matrix Dimension */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] block uppercase">MATRIX DIMENSION</span>
                <div className="text-xl font-black text-white">
                  {analysisResult?.diagnostics?.matrixDimension || 29} × {analysisResult?.diagnostics?.matrixDimension || 29}
                </div>
                <div className="text-zinc-400 text-[11px]">
                  {analysisResult?.diagnostics?.totalModules || 841} total data modules
                </div>
                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-900">
                  Formula: Dimension = 21 + (V - 1) × 4
                </div>
              </div>

              {/* Card 2: Error Correction (Reed-Solomon) */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] block uppercase">ERROR CORRECTION (REED-SOLOMON)</span>
                <div className="text-xl font-black text-[#ccff00]">
                  LEVEL {analysisResult?.diagnostics?.errorCorrectionLevel || 'H'} (30%)
                </div>
                <div className="text-zinc-400 text-[11px]">
                  Galois Field GF(2^8) polynomial parity
                </div>
                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-900">
                  Can reconstruct data even if 30% is obscured
                </div>
              </div>

              {/* Card 3: Mask Pattern Algorithm */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] block uppercase">MASK PATTERN EVALUATION</span>
                <div className="text-xl font-black text-cyan-300">
                  MASK #{analysisResult?.diagnostics?.maskPatternIndex || 0}
                </div>
                <div className="text-zinc-400 text-[11px] truncate">
                  {analysisResult?.diagnostics?.maskFormula || '(row + col) % 2 === 0'}
                </div>
                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-900">
                  Chosen via lowest penalty score (N1-N4)
                </div>
              </div>

              {/* Card 4: Encoding Mode */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-zinc-500 text-[10px] block uppercase">ENCODING MODE</span>
                <div className="text-xl font-black text-purple-300">
                  {analysisResult?.diagnostics?.encodingMode || 'Byte (UTF-8)'}
                </div>
                <div className="text-zinc-400 text-[11px]">
                  8 bits per character data packing
                </div>
                <div className="pt-2 text-[10px] text-zinc-500 border-t border-zinc-900">
                  Full UTF-8 unicode & binary support
                </div>
              </div>

            </div>

            {/* In-Depth Pattern Deconstruction Guide */}
            <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Cpu className="w-4 h-4 text-[#ccff00]" />
                <span>HOW THE PATTERNS WORK PHYSICALLY & MATHEMATICALLY</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-[#ccff00] font-bold block">1. CORNER FINDER PATTERNS (7×7 MODULES)</span>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Located at top-left, top-right, and bottom-left. They follow a strict <strong>1:1:3:1:1 module luminance ratio</strong> (black outer, white spacer, black center). This ratio never naturally occurs in horizontal or vertical lines of text, enabling smartphones to detect the QR code from any 360° angle in milliseconds.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-[#ccff00] font-bold block">2. TIMING TRACKS (ROW 6 & COL 6)</span>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Alternating black and white module tracks that bridge the corner finders. The decoder counts the alternating pulse frequency to mathematically determine the physical pixel pitch of every cell in the grid, compensating for perspective tilt and lens distortion.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-cyan-300 font-bold block">3. REED-SOLOMON ERROR RECOVERY (GF 2^8)</span>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    The QR standard treats data as coefficients in a Galois polynomial. Parity codewords are calculated using polynomial long division. Level H (30%) can recover lost or damaged modules even if a center logo, photo face, or tear covers up to nearly one-third of the code.
                  </p>
                </div>

                <div className="p-3 bg-zinc-900 border border-zinc-800 space-y-1.5">
                  <span className="text-cyan-300 font-bold block">4. DYNAMIC MASK PATTERNS (0 THROUGH 7)</span>
                  <p className="text-zinc-300 leading-relaxed text-[11px]">
                    Raw binary data often creates large clumps of all-black or all-white modules that confuse optical cameras. QR generators XOR the matrix with 8 standard mathematical masks and assign penalty points (N1-N4). The mask with the lowest penalty is stamped into the code.
                  </p>
                </div>

              </div>

              {analysisResult?.diagnostics?.isPhotoBlended && (
                <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/50 rounded flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-300 block">
                      ★ HALFTONE / PHOTO-QR DETECTED IN TARGET MATRIX
                    </span>
                    <span className="text-zinc-300 text-[11px]">
                      This matrix contains sub-dot photographic luminance manipulation, keeping module centers scannable while borders display photographic imagery.
                    </span>
                  </div>
                  <span className="px-2 py-1 bg-emerald-500 text-black font-black text-[10px] shrink-0">
                    PHOTO BLEND VERIFIED
                  </span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ENCRYPTION & SECURITY LAB */}
        {/* ========================================================================= */}
        {activeTab === 'crypto-lab' && (
          <div className="space-y-6 font-mono text-xs">
            
            <div className="border border-zinc-800 bg-zinc-950 p-4">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>QR CODE ENCRYPTION & DECRYPTION CRUCIBLE</span>
              </h3>
              <p className="text-zinc-400 text-xs mt-0.5">
                Standard QR codes store plain text that any mobile camera can read. This lab implements military-grade <strong>AES-GCM 256-bit authenticated encryption</strong> with PBKDF2 key derivation (100,000 iterations) and cryptographic initialization vectors (IV).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* SUB-PANEL 1: ENCRYPT & GENERATE SECURE QR */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>ENCRYPT PAYLOAD → BUILD ENCRYPTED QR</span>
                  </span>
                  <span className="text-[10px] bg-purple-950 text-purple-300 px-1.5 py-0.2 border border-purple-800">
                    AES-GCM 256
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">SECRET CLEARText MESSAGE:</label>
                  <textarea
                    rows={3}
                    value={cryptoInputText}
                    onChange={(e) => setCryptoInputText(e.target.value)}
                    placeholder="Enter confidential text to encrypt..."
                    className="w-full p-2.5 bg-black border border-zinc-800 text-slate-100 font-mono text-xs focus:border-purple-400 outline-none resize-y"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">ENCRYPTION PASSPHRASE:</label>
                  <input
                    type="password"
                    value={cryptoPassphrase}
                    onChange={(e) => setCryptoPassphrase(e.target.value)}
                    placeholder="Enter strong encryption key..."
                    className="w-full p-2 bg-black border border-zinc-800 text-slate-100 font-mono text-xs focus:border-purple-400 outline-none"
                  />
                </div>

                <button
                  onClick={handleRunEncryption}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>ENCRYPT WITH AES-GCM & COMPILE QR</span>
                </button>

                {encryptedOutput && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-400">ENCRYPTED CIPHERTEXT (ENC:AES):</span>
                      <button
                        onClick={() => copyToClipboard(encryptedOutput, 'cipher')}
                        className="text-[9px] text-[#ccff00] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>COPY</span>
                      </button>
                    </div>
                    <div className="p-2 bg-black border border-zinc-800 text-[10px] text-purple-300 break-all max-h-20 overflow-y-auto">
                      {encryptedOutput}
                    </div>

                    {encryptedQRDataUrl && (
                      <div className="pt-2 flex flex-col items-center">
                        <div className="p-2 bg-white border border-black shadow-[3px_3px_0px_#a855f7]">
                          <img src={encryptedQRDataUrl} alt="Encrypted QR Code" className="w-36 h-36 block" />
                        </div>
                        <span className="text-[10px] text-zinc-400 mt-1">
                          Scan with this lab to test decryption
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SUB-PANEL 2: DECRYPT ENCRYPTED QR PAYLOAD */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                    <Unlock className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>DECRYPT CIPHERTEXT QR PAYLOAD</span>
                  </span>
                  <span className="text-[10px] bg-zinc-900 text-[#ccff00] px-1.5 py-0.2 border border-zinc-700">
                    WEB CRYPTO
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">CIPHERTEXT PAYLOAD (ENC:AES:...):</label>
                  <textarea
                    rows={3}
                    value={decryptInputPayload}
                    onChange={(e) => setDecryptInputPayload(e.target.value)}
                    placeholder="Paste encrypted QR payload here or scan one..."
                    className="w-full p-2.5 bg-black border border-zinc-800 text-purple-300 font-mono text-xs focus:border-[#ccff00] outline-none resize-y"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">DECRYPTION PASSPHRASE:</label>
                  <input
                    type="password"
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    placeholder="Enter passphrase used during generation..."
                    className="w-full p-2 bg-black border border-zinc-800 text-slate-100 font-mono text-xs focus:border-[#ccff00] outline-none"
                  />
                </div>

                <button
                  onClick={handleRunDecryption}
                  className="w-full py-2.5 bg-[#ccff00] hover:bg-white text-black font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>DECRYPT RECOVERED CIPHERTEXT</span>
                </button>

                {decryptedText && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500 rounded space-y-1 animate-fadeIn">
                    <span className="text-[10px] text-emerald-400 font-bold block flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>DECRYPTION SUCCESSFUL (CLEARTEXT RECOVERED):</span>
                    </span>
                    <p className="text-white text-xs break-all bg-black p-2 border border-emerald-800/80 rounded">
                      {decryptedText}
                    </p>
                  </div>
                )}

                {decryptError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{decryptError}</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: HOW QR CODES ARE MATHEMATICALLY GENERATED */}
        {/* ========================================================================= */}
        {activeTab === 'generation-method' && (
          <div className="space-y-6 font-mono text-xs">
            
            <div className="border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#ccff00]" />
                <span>COMPLETE STEP-BY-STEP MATHEMATICAL GENERATION PIPELINE</span>
              </h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Deconstructing how strings, URLs, and ciphertexts are turned into optical 2D barcode matrices following ISO/IEC 18004.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Step 1 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    01
                  </span>
                  <span>DATA ANALYSIS & MODE ENCODING</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  The input payload is analyzed to pick the most efficient data mode: <strong>Numeric</strong> (10 bits per 3 digits), <strong>Alphanumeric</strong> (11 bits per 2 chars from 45-character set), <strong>Byte Mode</strong> (8 bits per UTF-8 byte), or <strong>Kanji</strong> (13 bits per Shift-JIS char). A 4-bit mode indicator followed by character count indicator is prepended to the bitstream.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    02
                  </span>
                  <span>REED-SOLOMON ERROR CORRECTION CODEWORDS GENERATION</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Data bits are sliced into 8-bit codewords. Reed-Solomon polynomial math is executed over Galois Field <strong>GF(2^8) with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (285 decimal)</strong>. The generator polynomial is divided into the data polynomial to compute error correction parity bytes.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    03
                  </span>
                  <span>STRUCTURAL MATRIX PLACEMENT</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Fixed functional patterns are stamped onto the grid first:
                  <br />• <strong>Finder Patterns:</strong> 3 corner 7×7 concentric squares.
                  <br />• <strong>Separators:</strong> 1-module wide white safety border around finders.
                  <br />• <strong>Timing Tracks:</strong> Alternating modules on Row 6 and Column 6.
                  <br />• <strong>Alignment Patterns:</strong> 5×5 sub-eyes placed throughout matrices version &gt;= 2 to correct paper curvature.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    04
                  </span>
                  <span>DATA INTERLEAVING & ZIG-ZAG BIT TRAVERSAL</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  Data and error correction blocks are interleaved (to distribute burst physical damage evenly across all codewords) and placed onto the remaining matrix cells in 2-column wide zig-zag vertical ribbons from bottom-right to top-left, skipping all reserved functional modules.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    05
                  </span>
                  <span>PENALTY SCORE MASK SELECTION (N1 THROUGH N4)</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  8 candidate masks (XOR formulas) are applied to the data area. Each is scored using 4 ISO penalty metrics:
                  <br />• <strong>N1:</strong> 5 or more consecutive same-colored modules.
                  <br />• <strong>N2:</strong> 2×2 blocks of same-colored modules.
                  <br />• <strong>N3:</strong> Patterns resembling the 1:1:3:1:1 finder pattern in data area.
                  <br />• <strong>N4:</strong> Ratio of total dark modules to light modules drifting away from 50%.
                  <br />The mask with the lowest cumulative penalty score is chosen.
                </p>
              </div>

              {/* Step 6 */}
              <div className="p-4 bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <span className="w-5 h-5 bg-[#ccff00] text-black flex items-center justify-center font-black text-[10px]">
                    06
                  </span>
                  <span>FORMAT & VERSION INFORMATION (BCH CODED)</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  15 bits containing the Error Correction level (2 bits) and Mask ID (3 bits) protected by 10 BCH error-correcting bits (BCH(15,5)) are stamped twice along the perimeter of the finder patterns so the optical scanner knows how to demark and decode the matrix even if parts of the format string are damaged.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-black py-4 px-4 font-mono text-[10px] text-zinc-500 text-center">
        <span>QRJECT // CONFIDENTIAL MATRIX FORENSIC TOOL // DIRECT SEARCH-BAR DISPATCH ONLY</span>
      </footer>
    </div>
  );
}
