'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowUpRight, Terminal, Printer, Barcode as BarcodeIcon, Activity } from 'lucide-react';

interface NavbarProps {
  onOpenContact: () => void;
  onOpenQRArtifact?: () => void;
}

export function Navbar({ onOpenContact, onOpenQRArtifact }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: any[] = [
    // { label: 'ABOUT', href: '#about' },
    // { label: 'PROJECTS', href: '#projects' },
    // { label: 'REGISTRY', href: '#registry' },
    // { label: 'SERVICES', href: '#services' },
    // { label: 'CONTACT', href: '#contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f5f5f0] border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        {/* Left: Square Framed Brand Mark Box */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="flex items-center justify-center w-12 h-12 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000000] transition-all font-mono font-black text-xl tracking-tighter"
          >
            NR
          </a>
          <div className="hidden sm:block">
            <div className="font-mono text-xs font-black tracking-widest text-black flex items-center gap-1.5">
              <span>NEERAJ REKWAR</span>
              <span className="w-1.5 h-1.5 bg-[#ccff00] border border-black inline-block" />
            </div>
            <div className="font-mono text-[10px] text-zinc-600 tracking-wider">
              SYS-ARCH // FULLSTACK
            </div>
          </div>
        </div>

        {/* Center: Minimalist Text Links */}
        <nav className="hidden lg:flex items-center gap-1 border-2 border-black bg-white p-1 shadow-[4px_4px_0px_#000000]">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black hover:bg-black hover:text-[#ccff00] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/nomral-dpi-photo"
            className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black hover:bg-black hover:text-[#ccff00] transition-colors flex items-center gap-1 border-l-2 border-black"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PHOTO DPI</span>
          </Link>
          <Link
            href="/barcode-pick"
            className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black hover:bg-black hover:text-[#ccff00] transition-colors flex items-center gap-1 border-l-2 border-black"
          >
            <BarcodeIcon className="w-3.5 h-3.5" />
            <span>BARCODES</span>
          </Link>
          <Link
            href="/fitness-glass"
            className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black hover:bg-black hover:text-[#ccff00] transition-colors flex items-center gap-1 border-l-2 border-black"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>FITNESS</span>
          </Link>
          <Link
            href="/fitness-glass/winter-arc-2026"
            className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] transition-colors flex items-center gap-1 border-l-2 border-black"
          >
            <span>WINTER ARC</span>
          </Link>
          {onOpenQRArtifact && (
            <button
              onClick={onOpenQRArtifact}
              className="px-3 py-2 font-mono text-xs font-black tracking-wider text-black bg-[#ccff00] border-l-2 border-black hover:bg-black hover:text-white transition-colors flex items-center gap-1"
            >
              <span>QR ARTIFACT</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </nav>

        {/* Right: System Status Capsule Widget & Primary Rectangular Button */}
        <div className="hidden md:flex items-center gap-3">
          {/* Status Capsule Widget */}
          <div className="flex items-center gap-2 border-2 border-black bg-white px-3 py-2 shadow-[3px_3px_0px_#000000]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full bg-[#22c55e] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 bg-[#16a34a] border border-black" />
            </span>
            <span className="font-mono text-[11px] font-black tracking-widest text-black">
              SYS_OK // AVAIL_Q4
            </span>
          </div>

          {/* Primary Action Rectangular Button */}
          <button
            onClick={onOpenContact}
            className="flex items-center gap-2 border-2 border-black bg-black px-5 py-2.5 text-white font-mono text-xs font-black tracking-wider shadow-[4px_4px_0px_#000000] hover:bg-[#ccff00] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
          >
            <span>INITIALIZE ENGAGEMENT</span>
            <Terminal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-black bg-[#f5f5f0] p-4 space-y-3">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3 border-2 border-black bg-white font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00]"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/nomral-dpi-photo"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 border-2 border-black bg-white font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00]"
            >
              PHOTO DPI MAKER (300 DPI B/W) →
            </Link>
            <Link
              href="/barcode-pick"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 border-2 border-black bg-white font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00]"
            >
              BARCODE PICK & STUDIO →
            </Link>
            <Link
              href="/fitness-glass"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 border-2 border-black bg-white font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00]"
            >
              FITNESS GLASS (TIMETABLE & TARGETS) →
            </Link>
            <Link
              href="/fitness-glass/winter-arc-2026"
              onClick={() => setMobileMenuOpen(false)}
              className="block p-3 border-2 border-black bg-[#ccff00] font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000]"
            >
              🔥 WINTER ARC 2026 (90D / 24H PROTOCOL) →
            </Link>
            {onOpenQRArtifact && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenQRArtifact();
                }}
                className="w-full text-left p-3 border-2 border-black bg-[#ccff00] font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000]"
              >
                LAUNCH 300 DPI QR ENGINE →
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenContact();
              }}
              className="w-full p-3.5 border-2 border-black bg-black text-white font-mono text-xs font-black tracking-widest shadow-[3px_3px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              INITIALIZE ENGAGEMENT →
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
