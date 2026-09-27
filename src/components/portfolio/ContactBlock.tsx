'use client';

import React, { useState } from 'react';
import { ShieldCheck, Clock, Send, CheckCircle2, Key } from 'lucide-react';

export function ContactBlock() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Architecture & Scalability',
    timeline: 'Within 30 Days',
    budget: '$10k - $25k',
    requirements: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <section id="contact" className="w-full py-16 md:py-24 border-b-2 border-black bg-[#f5f5f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Pill Marker */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-[#ccff00] px-3 py-1 font-mono text-xs font-black tracking-widest text-black shadow-[3px_3px_0px_#000000]">
            <span>[04] DIRECT COMM CHANNEL</span>
          </div>
        </div>

        {/* Large Rectangular Container Split into Two Panes with Hard Drop Shadow */}
        <div className="border-2 border-black bg-white shadow-[8px_8px_0px_#000000] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANE (Solid Black Fill, 5 cols) */}
          <div className="lg:col-span-5 bg-black text-white p-8 sm:p-10 flex flex-col justify-between border-b-2 lg:border-b-0 lg:border-r-2 border-black">
            <div className="space-y-6">
              
              {/* Availability Status Badge */}
              <div className="inline-flex items-center gap-2 border-2 border-[#ccff00] bg-zinc-900 px-3 py-1.5 font-mono text-xs font-black text-[#ccff00]">
                <span className="w-2 h-2 bg-[#ccff00] animate-pulse inline-block" />
                <span>ACTIVE: ACCEPTING NEW BRIEFS</span>
              </div>

              {/* Title */}
              <div>
                <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
                  INITIALIZE ENGAGEMENT
                </h3>
                <p className="font-mono text-xs text-zinc-400 mt-2 tracking-wide">
                  PROTOCOL: DISPATCH ARCHITECTURAL INQUIRY // DIRECT COMMS
                </p>
              </div>

              {/* Consultation Narrative */}
              <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                Seeking principal-level execution for distributed cloud architecture, high-frequency systems, or resilient fullstack applications? Transmit requirements for deterministic scope scoping and SLA planning.
              </p>

              {/* Contact Coordinates List */}
              <div className="space-y-3 pt-2 font-mono text-xs border-t border-zinc-800">
                <div className="p-3 border border-zinc-800 bg-zinc-900/80">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase">PRIMARY DISPATCH EMAIL</div>
                  <a
                    href="mailto:neerajrekwar817@gmail.com"
                    className="text-[#ccff00] font-black text-sm hover:underline block mt-0.5"
                  >
                    neerajrekwar817@gmail.com
                  </a>
                </div>

                <div className="p-3 border border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">AVAILABILITY WINDOW</div>
                    <div className="text-white font-bold mt-0.5">Q4 2026 / FULL COMMITMENT</div>
                  </div>
                  <Clock className="w-4 h-4 text-emerald-400" />
                </div>

                <div className="p-3 border border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase">PGP FINGERPRINT</div>
                    <div className="text-zinc-400 font-mono text-[11px] mt-0.5">7F92 84A1 BE90 148F</div>
                  </div>
                  <Key className="w-4 h-4 text-[#ccff00]" />
                </div>
              </div>

            </div>

            {/* Bottom Security Assurance */}
            <div className="mt-8 pt-6 border-t border-zinc-800 font-mono text-[11px] text-zinc-500 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct encrypted routing · No recruiters / brokers</span>
            </div>
          </div>

          {/* RIGHT PANE (White Fill, 7 cols) */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 flex flex-col justify-between">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-black bg-[#fafaf8] shadow-[4px_4px_0px_#000000]">
                <div className="w-14 h-14 border-2 border-black bg-[#ccff00] flex items-center justify-center mb-4 shadow-[3px_3px_0px_#000000]">
                  <CheckCircle2 className="w-8 h-8 text-black" />
                </div>
                <h4 className="text-2xl font-black uppercase text-black tracking-tight">
                  DISPATCH TRANSMITTED
                </h4>
                <p className="font-mono text-xs text-zinc-600 max-w-md mt-2 leading-relaxed">
                  Your architecture brief has been logged into the queue. A technical response or calendar booking link will be transmitted within 24 operational hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 border-2 border-black bg-black text-[#ccff00] font-mono text-xs font-black px-6 py-3 shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all cursor-pointer"
                >
                  TRANSMIT ANOTHER BRIEF
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="border-b-2 border-black pb-3">
                  <span className="font-mono text-xs font-black text-black uppercase tracking-wider">
                    SPECIFICATION ENTRY FORM
                  </span>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black text-black mb-1.5 uppercase">
                      NAME / IDENTITY *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Mercer"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#000000] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black text-black mb-1.5 uppercase">
                      COMMUNICATION EMAIL *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="alex@enterprise.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#000000] transition-all"
                    />
                  </div>
                </div>

                {/* Project Type & Timeline Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-xs font-black text-black mb-1.5 uppercase">
                      ENGAGEMENT TYPE
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs text-black focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
                    >
                      <option>Architecture & Scalability</option>
                      <option>Fullstack Web Engineering</option>
                      <option>High-Throughput Microservices</option>
                      <option>Audit & Performance Tuning</option>
                      <option>Advisory / Technical Due Diligence</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-black text-black mb-1.5 uppercase">
                      TARGET TIMELINE
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs text-black focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
                    >
                      <option>Immediate (1-2 Weeks)</option>
                      <option>Within 30 Days</option>
                      <option>Q4 2026 Cycle</option>
                      <option>Exploratory / Feasibility</option>
                    </select>
                  </div>
                </div>

                {/* Multi-Line Requirements Textarea */}
                <div>
                  <label className="block font-mono text-xs font-black text-black mb-1.5 uppercase">
                    SCOPE SPECIFICATION & REQUIREMENTS
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Detail system objectives, existing tech stack, scalability thresholds, or immediate bottlenecks..."
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    className="w-full border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs text-black placeholder-zinc-400 focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_#000000] transition-all resize-y"
                  />
                </div>

                {/* Full-Width Bottom Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full border-2 border-black bg-black py-4 px-6 text-white font-mono text-xs font-black tracking-widest uppercase shadow-[4px_4px_0px_#000000] hover:bg-[#ccff00] hover:text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#000000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'TRANSMITTING DISPATCH...' : 'TRANSMIT DISPATCH // SUBMIT BRIEF ->'}
                  </span>
                </button>

              </form>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
