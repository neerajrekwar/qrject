'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, GitBranch, BookOpen } from 'lucide-react';

interface RegistryPackage {
  handle: string;
  name: string;
  version: string;
  downloads: string;
  license: string;
  description: string;
  installCommand: string;
  docsUrl: string;
  repoUrl: string;
  icon: 'package' | 'layers' | 'shield' | 'cpu';
}

const PACKAGES: RegistryPackage[] = [
  {
    handle: '@neeraj/qr-matrix-300dpi',
    name: 'Industrial QR & 300 DPI Rasterizer',
    version: 'v2.6.4',
    downloads: '14.2k/mo',
    license: 'MIT',
    description:
      'TypeScript QR matrix generator that renders custom geometric modules and injects calibrated 11,811 ppm pHYs metadata for commercial print vendors.',
    installCommand: 'npm i @neeraj/qr-matrix-300dpi',
    docsUrl: '#',
    repoUrl: 'https://github.com/neerajrekwar/Nedject',
    icon: 'package',
  },
  {
    handle: '@sys/resilience-kv',
    name: 'Distributed In-Memory Fallback Shard',
    version: 'v1.9.0',
    downloads: '8.7k/mo',
    license: 'Apache-2.0',
    description:
      'Zero-dependency Redis & memory-store abstraction with automatic circuit breaker trips, deterministic TTL sweeps, and zero-allocation key hashing.',
    installCommand: 'npm i @sys/resilience-kv',
    docsUrl: '#',
    repoUrl: 'https://github.com/neerajrekwar',
    icon: 'layers',
  },
  {
    handle: '@grid/dossier-tokens',
    name: 'Neo-Brutalist Industrial Design System',
    version: 'v3.1.2',
    downloads: '22.1k/mo',
    license: 'MIT',
    description:
      'Tailwind CSS v4 token preset enforcing 0px border-radius, 2px solid black boundaries, zero-blur drop shadows, and high-contrast accessibility.',
    installCommand: 'npm i @grid/dossier-tokens',
    docsUrl: '#',
    repoUrl: 'https://github.com/neerajrekwar',
    icon: 'shield',
  },
  {
    handle: '@telemetry/ebpf-ring',
    name: 'Lightweight Linux Ring Buffer Consumer',
    version: 'v0.8.5',
    downloads: '5.4k/mo',
    license: 'BSD-3-Clause',
    description:
      'High-throughput consumer for kernel eBPF ring buffer maps, streaming network socket latencies to OpenTelemetry collectors with sub-millisecond overhead.',
    installCommand: 'npm i @telemetry/ebpf-ring',
    docsUrl: '#',
    repoUrl: 'https://github.com/neerajrekwar',
    icon: 'cpu',
  },
];

export function OpenSourceRegistry() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <section id="registry" className="w-full py-16 md:py-24 border-b-2 border-black bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Centered Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black tracking-widest text-black mb-3 shadow-[3px_3px_0px_#000000]">
            <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
            <span>[03] PUBLIC REPOSITORIES</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black">
            OPEN-SOURCE REGISTRY
          </h2>

          <p className="font-mono text-sm sm:text-base text-zinc-600 mt-3 max-w-xl mx-auto">
            Battle-tested utilities, npm packages, and architectural primitives distributed for production systems.
          </p>
        </div>

        {/* 2-Column Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {PACKAGES.map((pkg, idx) => (
            <div
              key={pkg.handle}
              className="border-2 border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Top Bar: Package Handle, Icon, and Version Badge (0px radius) */}
                <div className="flex items-center justify-between gap-3 border-b-2 border-black pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border-2 border-black bg-[#ccff00] flex items-center justify-center shadow-[2px_2px_0px_#000000]">
                      <Terminal className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-black text-black tracking-tight">
                        {pkg.handle}
                      </div>
                      <div className="font-mono text-[11px] text-zinc-500 font-bold">
                        {pkg.name}
                      </div>
                    </div>
                  </div>

                  {/* Version & License Badge */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="border-2 border-black bg-black text-[#ccff00] px-2 py-0.5 font-mono text-[10px] font-black">
                      {pkg.version}
                    </span>
                    <span className="hidden sm:inline-block border-2 border-black bg-zinc-100 text-zinc-700 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                      {pkg.license}
                    </span>
                  </div>
                </div>

                {/* Module Description */}
                <p className="text-sm text-zinc-700 font-medium leading-relaxed">
                  {pkg.description}
                </p>

                {/* Dark Monospaced Terminal Snippet Box showing install command */}
                <div className="border-2 border-black bg-[#0d1117] p-3.5 flex items-center justify-between text-white font-mono text-xs shadow-[3px_3px_0px_#000000]">
                  <div className="flex items-center gap-2 overflow-x-auto pr-2">
                    <span className="text-[#ccff00] font-black select-none">&gt;</span>
                    <span className="text-emerald-400 font-bold tracking-tight whitespace-nowrap">
                      {pkg.installCommand}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopy(pkg.installCommand, idx)}
                    title="Copy install command to clipboard"
                    className="p-1.5 border border-zinc-700 bg-zinc-900 hover:bg-[#ccff00] hover:text-black hover:border-black text-zinc-300 transition-colors cursor-pointer shrink-0"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Quick Package Stats */}
                <div className="flex items-center justify-between font-mono text-[11px] text-zinc-500 border-t border-zinc-200 pt-3">
                  <span>DL: {pkg.downloads}</span>
                  <span className="text-emerald-700 font-bold">● PASSING AUDIT</span>
                  <span>NODE: &gt;= 18.0.0</span>
                </div>

              </div>

              {/* Bottom Outline Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-6">
                <a
                  href={pkg.docsUrl}
                  className="flex items-center justify-center gap-2 border-2 border-black bg-white py-2.5 px-3 font-mono text-xs font-black text-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-white transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>DOCUMENTATION</span>
                </a>

                <a
                  href={pkg.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 border-2 border-black bg-black py-2.5 px-3 font-mono text-xs font-black text-[#ccff00] shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all cursor-pointer"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>SOURCE CODE</span>
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
