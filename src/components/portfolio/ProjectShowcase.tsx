'use client';

import React, { useState } from 'react';
import { GitBranch, ArrowUpRight, Activity, QrCode } from 'lucide-react';

interface Project {
  id: string;
  category: 'App' | 'System' | 'Infra';
  title: string;
  tagline: string;
  description: string;
  url: string;
  repo: string;
  status: string;
  tags: string[];
  mockupType: 'qr' | 'metrics' | 'terminal' | 'security';
  stats: { label: string; value: string }[];
  isFeatured?: boolean;
}

const PROJECTS: Project[] = [
  {
    id: 'Nedject-engine',
    category: 'App',
    title: 'Nedject // 300 DPI OPTICAL ENGINE',
    tagline: 'High-Density Matrix Generator & Cyber Pass Suite',
    description:
      'Engineered an industrial-grade QR matrix compiler with direct 300 DPI PNG physical chunk injection (pHYs metadata), high-contrast scanner certification, and batch generation of hundreds of attendee passes.',
    url: '#',
    repo: 'https://github.com/neerajrekwar/Nedject',
    status: 'PRODUCTION // LIVE',
    tags: ['NEXT.JS 16', 'REACT 19', 'CANVAS API', 'TAILWIND 4', 'JSZIP'],
    mockupType: 'qr',
    stats: [
      { label: 'OPTICAL RES', value: '300 / 600 DPI' },
      { label: 'CONTRAST RATIO', value: '21:1 B&W' },
      { label: 'BATCH CAP', value: '100+ CODES' },
    ],
    isFeatured: true,
  },
  {
    id: 'kubesentinel',
    category: 'Infra',
    title: 'KUBESENTINEL // MESH TELEMETRY',
    tagline: 'Zero-Allocation Kubernetes Node Telemetry Daemon',
    description:
      'Low-overhead eBPF event tracer streaming pod network latency and resource throttling directly into a distributed ring buffer with Prometheus / OpenTelemetry adapters.',
    url: 'https://github.com/neerajrekwar',
    repo: 'https://github.com/neerajrekwar',
    status: 'SYSTEM // OPERATIONAL',
    tags: ['GO RUNTIME', 'EBPF', 'KUBERNETES', 'DOCKER', 'PROMETHEUS'],
    mockupType: 'metrics',
    stats: [
      { label: 'DAEMON OVERHEAD', value: '&lt; 0.4% CPU' },
      { label: 'EVENT BURST', value: '180K/SEC' },
      { label: 'INGEST P99', value: '2.1ms' },
    ],
  },
  {
    id: 'chronostream',
    category: 'System',
    title: 'CHRONOSTREAM // L2 ORDERBOOK',
    tagline: 'Microsecond Distributed Financial Matching Kernel',
    description:
      'High-throughput in-memory orderbook engine built on Redis memory clusters and WebSockets, delivering deterministic chronological trade matching and ledger compaction.',
    url: 'https://github.com/neerajrekwar',
    repo: 'https://github.com/neerajrekwar',
    status: 'BENCHMARKED',
    tags: ['TYPESCRIPT', 'REDIS CLUSTER', 'WEBSOCKETS', 'NODE.JS', 'POSTGRESQL'],
    mockupType: 'terminal',
    stats: [
      { label: 'MATCH LATENCY', value: '42μs' },
      { label: 'THROUGHPUT', value: '85,000 TX/S' },
      { label: 'MEMORY FOOTPRINT', value: '128MB RAM' },
    ],
  },
  {
    id: 'vulcan-vault',
    category: 'System',
    title: 'VULCAN VAULT // PGP AUTH GATE',
    tagline: 'Multi-Tenant Key Derivation & Token Attestation',
    description:
      'Hardware-backed cryptographic authorization service featuring Argon2id hashing, rotatable JWT keys, and hardware security token attestation for enterprise microservices.',
    url: 'https://github.com/neerajrekwar',
    repo: 'https://github.com/neerajrekwar',
    status: 'AUDITED // v3.1',
    tags: ['LARAVEL', 'TYPESCRIPT', 'ARGON2ID', 'PGP/RSA', 'REDIS'],
    mockupType: 'security',
    stats: [
      { label: 'KEY DERIVATION', value: 'ARGON2ID' },
      { label: 'AUTH TIME', value: '18ms' },
      { label: 'MFA VECTORS', value: 'FIDO2 / TOTP' },
    ],
  },
];

interface ProjectShowcaseProps {
  onOpenQRArtifact?: () => void;
}

export function ProjectShowcase({ onOpenQRArtifact }: ProjectShowcaseProps) {
  const [filter, setFilter] = useState<'All' | 'App' | 'System' | 'Infra'>('All');

  const filteredProjects =
    filter === 'All'
      ? PROJECTS
      : PROJECTS.filter((p) => p.category === filter);

  return (
    <section id="projects" className="w-full py-16 md:py-24 border-b-2 border-black bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header & Filter Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b-2 border-black pb-8">
          <div>
            <div className="inline-flex items-center gap-2 border-2 border-black bg-[#ccff00] px-3 py-1 font-mono text-xs font-black tracking-widest text-black mb-3 shadow-[2px_2px_0px_#000000]">
              <span>[02] ARTIFACT INVENTORY</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-black">
              PROJECT SHOWCASE
            </h2>
            <p className="font-mono text-sm text-zinc-600 mt-2">
              Production deployments, real-time distributed kernels, and high-precision software artifacts.
            </p>
          </div>

          {/* Right-Aligned Filter Tab Group (0px radius, 2px borders) */}
          <div className="flex items-center border-2 border-black bg-white p-1 shadow-[4px_4px_0px_#000000] self-start md:self-auto">
            {(['All', 'App', 'System', 'Infra'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 font-mono text-xs font-black tracking-wider transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-black text-[#ccff00]'
                    : 'text-black hover:bg-zinc-100'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Column Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] hover:shadow-[8px_8px_0px_#000000] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Browser-Frame Header Bar (0px border-radius, macOS/terminal window dots) */}
                <div className="border-b-2 border-black bg-zinc-100 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 border border-black bg-rose-500 inline-block" />
                    <span className="w-3 h-3 border border-black bg-amber-400 inline-block" />
                    <span className="w-3 h-3 border border-black bg-emerald-500 inline-block" />
                    <span className="font-mono text-[11px] text-zinc-600 font-bold ml-2 hidden sm:inline-block">
                      {project.url}
                    </span>
                  </div>

                  {/* Status Pill (0px radius) */}
                  <div className="border border-black bg-[#ccff00] px-2 py-0.5 font-mono text-[10px] font-black text-black">
                    {project.status}
                  </div>
                </div>

                {/* Application Mockup Graphic Viewport */}
                <div className="border-b-2 border-black bg-[#0d1117] p-5 text-white font-mono text-xs select-none relative overflow-hidden">
                  
                  {project.mockupType === 'qr' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-[#ccff00] font-black flex items-center gap-2">
                          <QrCode className="w-4 h-4" />
                          <span>RASTER_ENGINE // 300_DPI_PIPELINE</span>
                        </span>
                        <span className="text-zinc-400 text-[10px]">ISO_IEC_18004_COMPLIANT</span>
                      </div>
                      
                      <div className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4 bg-white p-2.5 border border-zinc-700 flex flex-col items-center justify-center">
                          {/* Mini QR representation */}
                          <div className="w-20 h-20 bg-black flex flex-wrap p-1 gap-0.5">
                            {Array.from({ length: 36 }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 ${
                                  i % 2 === 0 || i % 7 === 0 ? 'bg-white' : 'bg-transparent'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[9px] text-black font-black mt-1">21:1 B&W PASS</span>
                        </div>

                        <div className="col-span-8 space-y-1.5 text-[11px] text-zinc-300">
                          <div className="text-emerald-400 font-bold">&gt; pHYs Chunk: 11,811 ppm (300 DPI)</div>
                          <div className="text-cyan-400 font-bold">&gt; Reed-Solomon: Level H (30% EC)</div>
                          <div className="text-zinc-400">&gt; Output Canvas: 2400 × 2400 px</div>
                          <div className="text-pink-400 font-bold">&gt; Batch Export: Active (JSZip Buffer)</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.mockupType === 'metrics' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-[#ccff00] font-black flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          <span>EBPF_PROBE // K8S_NODE_DAEMON</span>
                        </span>
                        <span className="text-emerald-400 text-[10px]">0 DROPPED PKTS</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="border border-zinc-800 bg-zinc-900/60 p-2">
                          <div className="text-[10px] text-zinc-500">RING BUFFER</div>
                          <div className="text-emerald-400 font-bold text-sm">64MB</div>
                        </div>
                        <div className="border border-zinc-800 bg-zinc-900/60 p-2">
                          <div className="text-[10px] text-zinc-500">LATENCY JITTER</div>
                          <div className="text-cyan-400 font-bold text-sm">± 1.2μs</div>
                        </div>
                        <div className="border border-zinc-800 bg-zinc-900/60 p-2">
                          <div className="text-[10px] text-zinc-500">SYSCALL TRACE</div>
                          <div className="text-pink-400 font-bold text-sm">ACTIVE</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {project.mockupType === 'terminal' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-zinc-400 text-[10px]">
                        <span>KERNEL MATCH ENGINE: v2.8</span>
                        <span className="text-[#ccff00]">REDIS_PRIMARY_SHARD</span>
                      </div>
                      <div className="text-emerald-400 text-[11px] font-mono leading-tight">
                        [14:02:44.891] BID ORDER #8911 MATCHED @ $1,842.10 (QTY: 40.00)<br />
                        [14:02:44.892] COMPACTION FLUSH TO PG_STORAGE IN 14MS<br />
                        [14:02:44.893] WEBSOCKET PUSH SENT TO 2,400 CONSUMERS
                      </div>
                    </div>
                  )}

                  {project.mockupType === 'security' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 text-zinc-400 text-[10px]">
                        <span>ARGON2ID KEY DERIVATION VAULT</span>
                        <span className="text-emerald-400">HARDWARE_ENCLAVE</span>
                      </div>
                      <div className="text-cyan-300 text-[11px] font-mono leading-tight">
                        ENCRYPTED_SIG: 0x9f1a...c84e [VALIDATED]<br />
                        FIDO2 ATTESTATION: WEBAUTHN CERTIFIED<br />
                        TOKEN ROTATION LIFETIME: 900 SECONDS
                      </div>
                    </div>
                  )}

                </div>

                {/* Card Main Information */}
                <div className="p-6 space-y-4">
                  {/* Title & External Link Buttons */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-black tracking-tight uppercase">
                        {project.title}
                      </h3>
                      <div className="font-mono text-xs font-bold text-zinc-600 mt-1">
                        {project.tagline}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {project.isFeatured && onOpenQRArtifact && (
                        <button
                          onClick={onOpenQRArtifact}
                          title="Open Interactive 300 DPI QR Studio"
                          className="border-2 border-black bg-[#ccff00] p-2 hover:bg-black hover:text-[#ccff00] transition-colors cursor-pointer shadow-[2px_2px_0px_#000000]"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={project.repo}
                        target="_blank"
                        rel="noreferrer"
                        title="View Source Code Repository"
                        className="border-2 border-black bg-white p-2 text-black hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000000]"
                      >
                        <GitBranch className="w-4 h-4" />
                      </a>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Direct Production Endpoint"
                        className="border-2 border-black bg-black p-2 text-white hover:bg-[#ccff00] hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_#000000]"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Description Paragraph */}
                  <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                    {project.description}
                  </p>

                  {/* Benchmark Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 border-2 border-black bg-[#f5f5f0] p-2.5 text-center font-mono">
                    {project.stats.map((st) => (
                      <div key={st.label}>
                        <div className="text-[9px] text-zinc-500 font-bold uppercase">{st.label}</div>
                        <div className="text-xs font-black text-black mt-0.5" dangerouslySetInnerHTML={{ __html: st.value }} />
                      </div>
                    ))}
                  </div>

                  {/* Row of Framework Tags along the bottom (0px radius) */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[10px] font-black text-black shadow-[2px_2px_0px_#000000]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Strip with Interactive Trigger */}
              {project.isFeatured && onOpenQRArtifact && (
                <div className="border-t-2 border-black bg-zinc-100 p-3 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-black">
                    INTERACTIVE ARTIFACT ATTACHED
                  </span>
                  <button
                    onClick={onOpenQRArtifact}
                    className="border-2 border-black bg-[#ccff00] px-3 py-1 font-mono text-xs font-black text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-white transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span>LAUNCH STUDIO</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
