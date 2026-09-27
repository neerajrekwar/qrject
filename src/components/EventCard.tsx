'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  MapPin,
  Sparkles,
  Download,
  Share2,
  RotateCw,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  User,
  Building,
  ScanLine,
} from 'lucide-react';
import { NeuralBanner } from './NeuralBanner';
import { renderQRToCanvas, insertDpiIntoPngBlob, QROptions } from '@/lib/qr-engine';

export interface AttendeeData {
  name: string;
  role: string;
  company: string;
  ticketId: string;
  selectedTags: string[];
}

interface EventCardProps {
  qrOptions: QROptions;
  onSelectTag?: (tag: string) => void;
}

const AVAILABLE_PILL_TAGS = [
  { id: 'keynote', label: 'Keynote Access', color: 'from-pink-500 to-rose-500', glow: 'shadow-pink-500/40' },
  { id: 'vip', label: 'VIP All-Access', color: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/40' },
  { id: 'neural', label: 'Neural AI Track', color: 'from-cyan-500 to-blue-500', glow: 'shadow-cyan-500/40' },
  { id: 'lab', label: 'Workshop Lab', color: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/40' },
  { id: 'quantum', label: 'Quantum Dev Tier', color: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/40' },
];

export function EventCard({ qrOptions }: EventCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Attendee state
  const [attendee, setAttendee] = useState<AttendeeData>({
    name: 'Alexandria Vance',
    role: 'Staff Generative AI Engineer',
    company: 'Synthetix Neural Labs',
    ticketId: 'DEV-AI-2026-8849',
    selectedTags: ['keynote', 'vip', 'neural'],
  });

  // 3D tilt state
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Canvas for QR rendering
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate payload string based on current attendee data
  const qrPayload = `SUMMIT: Global AI & Next-Gen Developer Summit 2026\nTICKET: ${attendee.ticketId}\nATTENDEE: ${attendee.name}\nROLE: ${attendee.role}\nCOMPANY: ${attendee.company}\nTIERS: ${attendee.selectedTags.join(', ')}\nVERIFY_URL: https://qrject.dev/verify/${attendee.ticketId}`;

  // Re-render QR code whenever qrOptions or attendee changes
  useEffect(() => {
    if (!qrCanvasRef.current) return;
    renderQRToCanvas(qrCanvasRef.current, {
      ...qrOptions,
      text: qrPayload,
      targetSizePx: 560,
    });
  }, [qrOptions, qrPayload]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -9;
    const rY = ((x - centerX) / centerX) * 9;
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const toggleTag = (id: string) => {
    setAttendee((prev) => {
      const exists = prev.selectedTags.includes(id);
      const updated = exists
        ? prev.selectedTags.filter((t) => t !== id)
        : [...prev.selectedTags, id];
      return { ...prev, selectedTags: updated };
    });
  };

  const handleExport300Dpi = async () => {
    setIsExporting(true);
    try {
      // Create high-res 300 DPI canvas for printing
      const printCanvas = document.createElement('canvas');
      const width = 1800; // 6 inches at 300 DPI
      const height = 2400; // 8 inches at 300 DPI (3:4 aspect ratio)
      printCanvas.width = width;
      printCanvas.height = height;

      const ctx = printCanvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#060a17';
      ctx.fillRect(0, 0, width, height);

      // Top banner
      const bannerH = height * 0.38;
      const bannerGrad = ctx.createLinearGradient(0, 0, width, bannerH);
      bannerGrad.addColorStop(0, '#040714');
      bannerGrad.addColorStop(0.5, '#0e1738');
      bannerGrad.addColorStop(1, '#080d22');
      ctx.fillStyle = bannerGrad;
      ctx.fillRect(0, 0, width, bannerH);

      // Neon glows
      const glowGrad = ctx.createRadialGradient(
        width * 0.8,
        bannerH * 0.3,
        20,
        width * 0.8,
        bannerH * 0.3,
        width * 0.7
      );
      glowGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, bannerH);

      // Header Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px system-ui, sans-serif';
      ctx.fillText('Global AI & Next-Gen', 100, bannerH + 90);
      ctx.fillText('Developer Summit', 100, bannerH + 165);

      // Dates & Location
      ctx.fillStyle = '#94a3b8';
      ctx.font = '36px system-ui, sans-serif';
      ctx.fillText('OCT 24-26, 2026 · SAN FRANCISCO, CA', 100, bannerH + 240);

      // Attendee info
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillText(attendee.name, 100, bannerH + 340);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '38px system-ui, sans-serif';
      ctx.fillText(`${attendee.role} · ${attendee.company}`, 100, bannerH + 400);

      // Render QR code in high res (800x800)
      const qrPrintCanvas = document.createElement('canvas');
      await renderQRToCanvas(qrPrintCanvas, {
        ...qrOptions,
        text: qrPayload,
        targetSizePx: 850,
      });

      // Draw QR centered in bottom area
      const qrX = (width - 850) / 2;
      const qrY = bannerH + 460;
      ctx.drawImage(qrPrintCanvas, qrX, qrY, 850, 850);

      // Ticket ID & Security Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '32px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`PASS ID: ${attendee.ticketId} · HIGH DENSITY OPTICAL BADGE`, width / 2, height - 70);

      // Convert to blob and embed 300 DPI pHYs chunk
      printCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const dpiBlob = await insertDpiIntoPngBlob(blob, 300);
        const url = URL.createObjectURL(dpiBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Summit-Badge-300DPI-${attendee.ticketId}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsExporting(false);
    }
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Controls Bar for Attendee Customization */}
      <div className="w-full max-w-4xl mb-6 p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Event Pass Configuration</div>
              <div className="text-xs text-slate-400">
                Live 3:4 High-Fidelity Summit Pass with embedded 300 DPI Scanner QR
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Show Front' : 'Flip Badge'}</span>
            </button>
            <button
              onClick={handleCopyPayload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Data'}</span>
            </button>
            <button
              onClick={handleExport300Dpi}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:opacity-90 rounded-lg shadow-lg shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating...' : 'Export 300 DPI Badge'}</span>
            </button>
          </div>
        </div>

        {/* Quick inline editor */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>Attendee Name</span>
            </label>
            <input
              type="text"
              value={attendee.name}
              onChange={(e) => setAttendee({ ...attendee, name: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-slate-400" />
              <span>Role / Title</span>
            </label>
            <input
              type="text"
              value={attendee.role}
              onChange={(e) => setAttendee({ ...attendee, role: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 flex items-center gap-1">
              <Building className="w-3 h-3 text-slate-400" />
              <span>Company / Lab</span>
            </label>
            <input
              type="text"
              value={attendee.company}
              onChange={(e) => setAttendee({ ...attendee, company: e.target.value })}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3D Perspective Card Container (Aspect Ratio 3:4) */}
      <div
        className="w-full max-w-[420px] aspect-[3/4] [perspective:1400px]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        <motion.div
          ref={cardRef}
          animate={{
            rotateX: isFlipped ? 0 : rotateX,
            rotateY: isFlipped ? 180 : rotateY,
            scale: isHovered ? 1.015 : 1,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative w-full h-full rounded-3xl [transform-style:preserve-3d] shadow-2xl transition-shadow duration-300"
          style={{
            boxShadow: isHovered
              ? '0 25px 60px -15px rgba(236, 72, 153, 0.25), 0 0 40px -10px rgba(59, 130, 246, 0.35)'
              : '0 20px 45px -10px rgba(0, 0, 0, 0.8)',
          }}
        >
          {/* Card Border Glow Ring (Unreal Engine 5 Rim Lighting Effect) */}
          <div className="absolute -inset-[1.5px] rounded-[25px] bg-gradient-to-b from-cyan-400 via-pink-500 to-indigo-600 opacity-60 blur-[1px] pointer-events-none" />

          {/* FRONT OF CARD */}
          <div
            className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-[#070b16] border border-slate-800/80 [backface-visibility:hidden] flex flex-col ${
              isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            {/* TOP BANNER: 3D Glowing Neural Network Mesh & Particles */}
            <div className="relative w-full h-[40%] overflow-hidden border-b border-cyan-500/20">
              <NeuralBanner height="100%" interactive={isHovered} />

              {/* Holographic Watermark Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-cyan-500/30">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
                  <span className="text-[10px] font-mono tracking-wider font-semibold text-cyan-300 uppercase">
                    AI CONVERGENCE 2026
                  </span>
                </div>
                <div className="bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-pink-500/30">
                  <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold">
                    {attendee.ticketId}
                  </span>
                </div>
              </div>

              {/* Lanyard Punch Hole Indicator */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-2.5 bg-black/80 rounded-full border border-slate-700/60 shadow-inner" />
            </div>

            {/* CARD BODY CONTENT */}
            <div className="flex-1 flex flex-col justify-between p-5 bg-gradient-to-b from-[#090e1f] via-[#070b16] to-[#04060d]">
              {/* Event Title in bold geometric sans-serif */}
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight font-sans">
                  Global AI & Next-Gen{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-400 to-indigo-300">
                    Developer Summit
                  </span>
                </h1>

                {/* Stylized Vector Icons for Date & Location */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-blue-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium tracking-wide">
                      OCT 24–26, 2026 · 09:00 PST
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium tracking-wide text-slate-300 truncate">
                      CyberDome & Metaverse Arena, San Francisco, CA
                    </span>
                  </div>
                </div>

                {/* Glowing Interactive Pill Tags */}
                <div className="mt-3.5">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span>Interactive Pass Privileges (Tap to Toggle)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PILL_TAGS.map((tag) => {
                      const isActive = attendee.selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          type="button"
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                            isActive
                              ? `bg-gradient-to-r ${tag.color} text-white shadow-md ${tag.glow} scale-105 border border-white/30`
                              : 'bg-slate-900/90 text-slate-400 border border-slate-800 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Attendee Identifier + High-Fidelity Scanner QR */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                    OFFICIAL ATTENDEE
                  </div>
                  <div className="text-base font-bold text-white truncate">
                    {attendee.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {attendee.role}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {attendee.company}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Optical Scanner Ready</span>
                  </div>
                </div>

                {/* Embedded Live QR Code */}
                <div className="relative p-1.5 rounded-xl bg-white shadow-lg shrink-0 group">
                  <canvas
                    ref={qrCanvasRef}
                    className="w-24 h-24 sm:w-26 sm:h-26 block rounded-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[8px] font-mono text-cyan-300 px-1 py-0.5 rounded border border-slate-700 shadow">
                    300 DPI
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK OF CARD (Flip View) */}
          <div
            className={`absolute inset-0 w-full h-full rounded-3xl overflow-hidden bg-[#070b16] border border-slate-800/80 [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col p-6 text-slate-200 justify-between ${
              !isFlipped ? 'pointer-events-none' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase text-pink-400 font-bold">
                      DELEGATE CREDENTIAL
                    </div>
                    <div className="text-sm font-semibold text-white">Security & Perks</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  NFC ENABLED
                </span>
              </div>

              {/* Agenda Highlights */}
              <div className="mt-4 space-y-3">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                  Summit Day 1 Highlights
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-white">09:30 AM · Neural AGI Keynote</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">Grand CyberDome Amphitheater</p>
                    </div>
                    <span className="text-cyan-400 font-mono text-[10px]">MAIN STAGE</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-white">01:00 PM · Quantum Model Scaling</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">Lab 4B · Hardware Acceleration</p>
                    </div>
                    <span className="text-pink-400 font-mono text-[10px]">WORKSHOP</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-white">05:30 PM · Developer VIP Mixer</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">Sky Lounge & Rooftop Terraces</p>
                    </div>
                    <span className="text-purple-400 font-mono text-[10px]">ALL TIERS</span>
                  </div>
                </div>
              </div>

              {/* WiFi & Venue Connectivity */}
              <div className="mt-4 p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
                <div className="font-mono text-cyan-400 font-bold mb-1">CONFERENCE WIFI</div>
                <div className="flex justify-between text-slate-300">
                  <span>SSID: <strong className="text-white">Summit2026_HighSpeed</strong></span>
                  <span>KEY: <strong className="font-mono text-white">neuro-dev-5G</strong></span>
                </div>
              </div>
            </div>

            {/* Back Footer */}
            <div className="pt-3 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
              Badge verified by cryptographic signature · Valid for Oct 24–26, 2026
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
