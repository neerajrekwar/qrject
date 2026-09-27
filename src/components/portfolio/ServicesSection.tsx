'use client';

import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface ServiceItem {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
  stack: string[];
  leadTime: string;
  icon: 'cpu' | 'database' | 'network' | 'shield';
}

const SERVICES: ServiceItem[] = [
  {
    id: 'distributed-infra',
    step: '01',
    title: 'DISTRIBUTED ARCHITECTURE & CLOUD INFRA',
    subtitle: 'High-Throughput Microservices & Orchestration',
    description:
      'Designing mission-critical backend systems with deterministic performance, Kubernetes clustering, eBPF telemetry probes, and fault-tolerant failovers.',
    deliverables: [
      'Multi-region Kubernetes / Docker deployment manifests',
      'Zero-allocation message streaming (Kafka / Redis)',
      'Sub-millisecond p99 telemetry & synthetic tracing',
      'Automated disaster recovery & blue-green zero-downtime cutover',
    ],
    stack: ['GO', 'KUBERNETES', 'DOCKER', 'KAFKA', 'PROMETHEUS'],
    leadTime: '2 - 4 WEEKS',
    icon: 'cpu',
  },
  {
    id: 'optical-engines',
    step: '02',
    title: 'OPTICAL ENGINES & HIGH-PRECISION WEB APPS',
    subtitle: 'Physical 300 DPI Canvas Rendering & Matrix Compilers',
    description:
      'Building specialized web applications with pixel-perfect hardware acceleration, 300 DPI physical print metadata injection (pHYs chunks), and batch export pipelines.',
    deliverables: [
      'Client-side hardware accelerated Canvas / WebGL pipelines',
      'ISO/IEC 18004 certified QR matrix encoders with custom geometry',
      '300 DPI / 600 DPI calibrated PNG exports with pHYs chunks',
      'High-throughput in-memory batch ZIP packaging (JSZip)',
    ],
    stack: ['REACT 19', 'NEXT.JS 16', 'TYPESCRIPT', 'CANVAS API', 'JSZIP'],
    leadTime: '1 - 3 WEEKS',
    icon: 'database',
  },
  {
    id: 'latency-trade',
    step: '03',
    title: 'REAL-TIME STREAMING & LOW-LATENCY KERNELS',
    subtitle: 'Microsecond Event Processing & Orderbooks',
    description:
      'Constructing deterministic financial order matching kernels, WebSocket fanout networks, and transactional ledger compaction routines.',
    deliverables: [
      'Microsecond in-memory matching logic on Redis cluster shards',
      'Bi-directional WebSocket pipelines with backpressure management',
      'Idempotent transactional compaction to PostgreSQL storage',
      'Deterministic state replays from chronological event journals',
    ],
    stack: ['TYPESCRIPT', 'REDIS', 'WEBSOCKETS', 'NODE.JS', 'POSTGRESQL'],
    leadTime: '3 - 6 WEEKS',
    icon: 'network',
  },
  {
    id: 'security-audit',
    step: '04',
    title: 'CRYPTOGRAPHIC SECURITY & SYSTEM AUDITS',
    subtitle: 'Zero-Trust Auth & Key Derivation Enclaves',
    description:
      'Deep architectural audits and hardened cryptographic implementation. Establishing hardware-backed authentication, Argon2id derivation, and PGP signatures.',
    deliverables: [
      'WebAuthn / FIDO2 hardware attestation flows',
      'Argon2id and rotatable ephemeral token authentication gate',
      'Zero-trust network boundaries & automated penetration fuzzing',
      'Comprehensive vulnerability mitigation & audit dossier',
    ],
    stack: ['ARGON2ID', 'PGP/RSA', 'LARAVEL', 'TYPESCRIPT', 'FIDO2'],
    leadTime: '1 - 2 WEEKS',
    icon: 'shield',
  },
];

interface ServicesSectionProps {
  onSelectService?: (serviceName: string) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const [activeService, setActiveService] = useState<string>(SERVICES[0].id);

  return (
    <section id="services" className="w-full py-16 md:py-24 border-b-2 border-black bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-2 border-black pb-8">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1 font-mono text-xs font-black tracking-widest text-black mb-3 shadow-[3px_3px_0px_#000000]">
              <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
              <span>[04] CAPABILITIES & ARCHITECTURAL SERVICES</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black">
              CORE DISCIPLINES
            </h2>
            <p className="font-mono text-sm text-zinc-600 mt-2 max-w-2xl">
              Specialized technical engagements delivering high-availability system architecture, optical compilers, and bulletproof web applications.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 font-mono text-xs border-2 border-black bg-white px-4 py-2 shadow-[3px_3px_0px_#000000]">
            <span className="font-bold text-zinc-500">ENGAGEMENT MODEL:</span>
            <span className="font-black text-black">FIXED SCOPE / DIRECT SLA</span>
          </div>
        </div>

        {/* 2-Column or Grid Layout for Services */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Service Selector List (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {SERVICES.map((srv) => {
              const isSelected = activeService === srv.id;
              return (
                <button
                  key={srv.id}
                  onClick={() => setActiveService(srv.id)}
                  className={`w-full text-left p-5 border-2 border-black transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-black text-white shadow-[6px_6px_0px_#ccff00] translate-x-1'
                      : 'bg-white text-black shadow-[4px_4px_0px_#000000] hover:bg-[#fafaf8] hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-xs font-black px-2 py-0.5 border ${
                        isSelected
                          ? 'border-[#ccff00] bg-[#ccff00] text-black'
                          : 'border-black bg-zinc-100 text-black'
                      }`}
                    >
                      SPEC // {srv.step}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider font-bold opacity-80">
                      LEAD: {srv.leadTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {srv.title}
                  </h3>

                  <p
                    className={`font-mono text-xs mt-1.5 line-clamp-1 ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-600'
                    }`}
                  >
                    {srv.subtitle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Selected Service Dossier Spec (7 cols) */}
          <div className="lg:col-span-7">
            {(() => {
              const current = SERVICES.find((s) => s.id === activeService) || SERVICES[0];
              return (
                <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000] relative">
                  
                  {/* Top Bar with Step counter and Diamond badge */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-black rotate-45 transform" />
                      <span className="font-mono text-xs font-black tracking-widest text-black">
                        DELIVERABLE PROTOCOL // {current.step}
                      </span>
                    </div>
                    <span className="border-2 border-black bg-[#ccff00] text-black px-2.5 py-0.5 font-mono text-xs font-black">
                      VERIFIED SLA
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mb-2">
                    {current.title}
                  </h3>

                  <div className="font-mono text-xs text-emerald-800 font-bold mb-4">
                    PRIMARY OBJECTIVE: {current.subtitle}
                  </div>

                  <p className="text-sm sm:text-base text-zinc-800 leading-relaxed font-medium mb-6">
                    {current.description}
                  </p>

                  {/* Concrete Deliverables Checklist */}
                  <div className="border-2 border-black bg-[#fafaf8] p-5 mb-6">
                    <div className="font-mono text-xs font-black uppercase text-black mb-3 flex items-center justify-between">
                      <span>CORE ENGAGEMENT DELIVERABLES</span>
                      <span className="text-zinc-500 text-[10px]">INSPECTION READY</span>
                    </div>

                    <ul className="space-y-2.5 font-mono text-xs text-zinc-800">
                      {current.deliverables.map((del, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="w-4 h-4 border border-black bg-[#ccff00] text-black flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-black stroke-[3]" />
                          </span>
                          <span className="leading-snug">{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Stack Chips & Action */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-zinc-500 mr-1 uppercase">
                        TECHNOLOGY MATRIX:
                      </span>
                      {current.stack.map((st) => (
                        <span
                          key={st}
                          className="border border-black bg-white px-2 py-0.5 font-mono text-[10px] font-black text-black shadow-[1.5px_1.5px_0px_#000000]"
                        >
                          {st}
                        </span>
                      ))}
                    </div>

                    <div className="pt-4 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="font-mono text-xs text-zinc-600">
                        ESTIMATED LEAD TIME: <span className="font-black text-black">{current.leadTime}</span>
                      </div>

                      <a
                        href="#contact"
                        onClick={() => onSelectService && onSelectService(current.title)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-black bg-black text-[#ccff00] px-6 py-3 font-mono text-xs font-black tracking-widest shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all cursor-pointer"
                      >
                        <span>INITIALIZE WITH THIS SPEC</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>

        </div>

      </div>
    </section>
  );
}
