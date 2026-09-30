import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { GoogleFitDashboard } from '@/components/google-fit/GoogleFitDashboard';
import { ArrowLeft, Activity, ShieldCheck, Smartphone, Watch } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Google Fit Cloud Sync & 3 Measurable Targets Analysis | Nedject',
  description:
    'End-to-end Google Fit REST API integration syncing Steps, Weight, Height, Blood Pressure, and Workout Sessions with 3 Measurable Targets & Goals Analysis.',
};

export default function GoogleFitPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f0] text-black pb-16 font-mono">
      {/* Top Header / Breadcrumb */}
      <div className="border-b-4 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 border-2 border-black bg-zinc-100 hover:bg-[#ccff00] text-black transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-black text-[#ccff00] text-[10px] font-black uppercase px-2 py-0.5">
                  v2.0 Production
                </span>
                <span className="text-xs font-bold text-zinc-500">
                  Google Cloud Platform &bull; Fitness REST API
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black mt-0.5">
                Google Fit Cloud Telemetry & Sync
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 bg-zinc-100 border-2 border-black px-2.5 py-1 text-xs font-bold">
              <Smartphone className="w-4 h-4 text-black" />
              <span>Android</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-100 border-2 border-black px-2.5 py-1 text-xs font-bold">
              <Watch className="w-4 h-4 text-black" />
              <span>Smart Tracker</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#ccff00] border-2 border-black px-2.5 py-1 text-xs font-black">
              <ShieldCheck className="w-4 h-4 text-black" />
              <span>OAuth 2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <GoogleFitDashboard />
      </div>
    </main>
  );
}
