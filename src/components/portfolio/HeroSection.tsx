'use client';

import React from 'react';
import { ArrowDownRight, Terminal, Cpu, Database, Network, ShieldCheck } from 'lucide-react';

interface HeroSectionProps {
  onExploreProjects: () => void;
  onExploreRegistry: () => void;
  onOpenQRArtifact?: () => void;
}

export function HeroSection({ onExploreProjects, onExploreRegistry, onOpenQRArtifact }: HeroSectionProps) {
  return (
    <section id="about" className="w-full py-12 md:py-20 border-b-2 border-black bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* LEFT COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Monospaced Dossier Tag Chip */}
            <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
              <span className="w-2 h-2 bg-[#ccff00] border border-black" />
              <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
                {'// DOSSIER: SENIOR SYSTEMS & FULLSTACK ARCHITECT'}
              </span>
            </div>

            {/* Two-Line Oversized Headline */}
            <div className="space-y-1">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-black">
                PRECISION
              </h1>
              <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] text-emerald-800">
                ENGINEERING
              </h2>
            </div>

            {/* Framed Narrative Card with Offset Drop Shadow */}
            <div className="border-2 border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0px_#000000] relative">
              {/* Technical corner coordinate marker */}
              <div className="absolute top-2 right-3 font-mono text-[10px] text-zinc-500 font-bold">
                REF: [SPEC//8849-NR]
              </div>

              <p className="text-base sm:text-lg text-black font-medium leading-relaxed">
                Architecting resilient web infrastructure, high-throughput distributed microservices, and razor-sharp interfaces. Grounded in deterministic workflows, zero-fluff Neo-Brutalist design tokens, and mission-critical performance.
              </p>

              {/* Technical Highlights Row */}
              <div className="mt-5 pt-4 border-t-2 border-black grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">DOMAIN EXP</div>
                  <div className="font-black text-black text-sm mt-0.5">8+ YEARS</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">CONTAINER ORCH</div>
                  <div className="font-black text-black text-sm mt-0.5">K8S / DOCKER</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">AVAILABILITY</div>
                  <div className="font-black text-emerald-700 text-sm mt-0.5">99.99% SLA</div>
                </div>
              </div>
            </div>

            {/* Side-by-Side Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onExploreProjects}
                className="flex items-center justify-center gap-2.5 border-2 border-black bg-black px-6 py-4 text-white font-mono text-xs font-black tracking-widest shadow-[5px_5px_0px_#000000] hover:bg-[#ccff00] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#000000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all cursor-pointer"
              >
                <span>EXPLORE ARTIFACTS</span>
                <ArrowDownRight className="w-4 h-4" />
              </button>

              <button
                onClick={onExploreRegistry}
                className="flex items-center justify-center gap-2.5 border-2 border-black bg-white px-6 py-4 text-black font-mono text-xs font-black tracking-widest shadow-[5px_5px_0px_#000000] hover:bg-black hover:text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_#000000] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all cursor-pointer"
              >
                <span>VIEW REGISTRY (NPM/PACKAGES)</span>
                <Terminal className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* RIGHT COLUMN (5 cols): Large Square Architectural Dossier Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md border-2 border-black bg-white shadow-[8px_8px_0px_#000000] relative">
              
              {/* Header Ribbon */}
              <div className="flex items-center justify-between border-b-2 border-black bg-[#ccff00] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  {/* Diamond Badge Icon */}
                  <div className="w-3.5 h-3.5 bg-black rotate-45 transform" />
                  <span className="font-mono text-xs font-black tracking-widest text-black">
                    SYSTEM ARCHITECTURE SPEC
                  </span>
                </div>
                {/* Step Counter "01" */}
                <span className="font-mono text-xs font-black bg-black text-[#ccff00] px-2 py-0.5">
                  01
                </span>
              </div>

              {/* Dossier Card Body */}
              <div className="p-5 space-y-4">
                
                {/* Sub-header with technical status */}
                <div className="flex items-center justify-between font-mono text-[11px] pb-3 border-b-2 border-dashed border-zinc-300">
                  <span className="text-zinc-600 font-bold">NODE: US-WEST-PRIMARY</span>
                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-500 font-bold px-1.5 py-0.5">
                    ONLINE: 24/7
                  </span>
                </div>

                {/* Switchable Architectural Blueprint View */}
                <div className="border-2 border-black bg-[#fafaf8] p-4">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                    <span className="font-mono text-xs font-black uppercase text-black">
                      ACTIVE ARCHITECTURE STACK
                    </span>
                    <span className="font-mono text-[10px] bg-black text-white px-1.5 py-0.5">
                      v4.2.0
                    </span>
                  </div>

                  {/* Diagnostic Blueprint Graphic */}
                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 border border-black bg-white shadow-[2px_2px_0px_#000000]">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-black" />
                        <span className="font-bold">CORE RUNTIME:</span>
                      </div>
                      <span className="bg-[#ccff00] px-1.5 font-black text-black">Node.js 22 / Bun</span>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-black bg-white shadow-[2px_2px_0px_#000000]">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-black" />
                        <span className="font-bold">DATA PERSISTENCE:</span>
                      </div>
                      <span className="bg-zinc-200 px-1.5 font-bold text-black">PostgreSQL + Redis</span>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-black bg-white shadow-[2px_2px_0px_#000000]">
                      <div className="flex items-center gap-2">
                        <Network className="w-4 h-4 text-black" />
                        <span className="font-bold">TRANSPORT LAYER:</span>
                      </div>
                      <span className="bg-zinc-200 px-1.5 font-bold text-black">gRPC & WebSockets</span>
                    </div>

                    <div className="flex items-center justify-between p-2 border border-black bg-white shadow-[2px_2px_0px_#000000]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-black" />
                        <span className="font-bold">DESIGN DISCIPLINE:</span>
                      </div>
                      <span className="bg-emerald-200 px-1.5 font-bold text-black">0px Radius Strict</span>
                    </div>
                  </div>
                </div>

                {/* Live Matrix Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_#000000]">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">CACHE HIT RATIO</div>
                    <div className="text-xl font-black text-black mt-0.5">99.4%</div>
                  </div>
                  <div className="border-2 border-black bg-white p-2.5 shadow-[3px_3px_0px_#000000]">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">P99 LATENCY</div>
                    <div className="text-xl font-black text-black mt-0.5">&lt; 14ms</div>
                  </div>
                </div>

                {/* Bottom Callout / Interactive Action */}
                {onOpenQRArtifact && (
                  <button
                    onClick={onOpenQRArtifact}
                    className="w-full border-2 border-black bg-[#ccff00] p-3 text-center font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#ccff00] hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>TEST LIVE ARTIFACT: 300 DPI ENGINE</span>
                    <ArrowDownRight className="w-4 h-4" />
                  </button>
                )}

              </div>

              {/* Technical dossier footer strip */}
              <div className="border-t-2 border-black bg-zinc-100 px-4 py-2 flex items-center justify-between font-mono text-[10px] text-zinc-600 font-bold">
                <span>SECURITY LEVEL: UNRESTRICTED</span>
                <span>CHECKSUM: 0x9B44F</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
