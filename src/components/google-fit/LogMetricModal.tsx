'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Scale,
  Activity,
  HeartPulse,
  Dumbbell,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { GOOGLE_FIT_ACTIVITY_TYPES } from '@/lib/google-fit/types';

interface LogMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LogMetricModal: React.FC<LogMetricModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'workout'>('health');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiDisabledUrl, setApiDisabledUrl] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Health Metric Form State
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [bodyPosition, setBodyPosition] = useState<string>('2'); // Sitting

  // Workout Session Form State
  const [sessionName, setSessionName] = useState<string>('');
  const [activityType, setActivityType] = useState<number>(80); // Default strength
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  if (!isOpen) return null;

  // Live Blood Pressure Classification
  const sysNum = parseFloat(systolic);
  const diaNum = parseFloat(diastolic);
  let bpCategory = '';
  let bpBadgeColor = '';

  if (!isNaN(sysNum) && !isNaN(diaNum)) {
    if (sysNum <= diaNum) {
      bpCategory = 'Error: Systolic must be greater than Diastolic';
      bpBadgeColor = 'text-rose-600 bg-rose-50 border-rose-300';
    } else if (sysNum >= 140 || diaNum >= 90) {
      bpCategory = 'AHA Stage 2 Hypertension';
      bpBadgeColor = 'text-rose-700 bg-rose-100 border-rose-400';
    } else if (sysNum >= 130 || diaNum >= 80) {
      bpCategory = 'AHA Stage 1 Hypertension';
      bpBadgeColor = 'text-amber-800 bg-amber-100 border-amber-400';
    } else if (sysNum >= 120 && diaNum < 80) {
      bpCategory = 'AHA Elevated Blood Pressure';
      bpBadgeColor = 'text-amber-700 bg-amber-50 border-amber-300';
    } else {
      bpCategory = 'AHA Normal Blood Pressure (Optimal)';
      bpBadgeColor = 'text-emerald-800 bg-emerald-100 border-emerald-400';
    }
  }

  // Live Height Conversion Preview
  const heightNum = parseFloat(heightCm);
  const metersPreview = !isNaN(heightNum) && heightNum > 0 ? (heightNum / 100).toFixed(2) : null;

  const handleSubmitHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!weightKg && !heightCm && (!systolic || !diastolic)) {
      setErrorMessage('Please fill in at least one health metric (Weight, Height, or Blood Pressure).');
      return;
    }

    if ((systolic && !diastolic) || (!systolic && diastolic)) {
      setErrorMessage('Both Systolic and Diastolic values are required for Blood Pressure.');
      return;
    }

    if (sysNum && diaNum && sysNum <= diaNum) {
      setErrorMessage('Systolic pressure must be higher than diastolic pressure.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/google-fit/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weightKg: weightKg ? parseFloat(weightKg) : undefined,
          height: heightCm ? parseFloat(heightCm) : undefined,
          systolic: systolic ? parseFloat(systolic) : undefined,
          diastolic: diastolic ? parseFloat(diastolic) : undefined,
          bodyPosition: parseInt(bodyPosition, 10),
          timestampMs: Date.now(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isApiDisabled || data.error?.includes('Fitness API') || data.error?.includes('disabled')) {
          setApiDisabledUrl(
            data.activationUrl ||
              'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview?project=263261388820'
          );
        }
        throw new Error(data.error || 'Failed to submit reading.');
      }

      setSuccessMessage(data.message || 'Reading recorded successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sessionName.trim()) {
      setErrorMessage('Please provide a workout session name.');
      return;
    }

    if (durationMinutes <= 0 || durationMinutes > 600) {
      setErrorMessage('Duration must be between 1 and 600 minutes.');
      return;
    }

    setIsLoading(true);

    const endTimeMillis = Date.now();
    const startTimeMillis = endTimeMillis - durationMinutes * 60 * 1000;

    try {
      const res = await fetch('/api/google-fit/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sessionName.trim(),
          description: sessionNotes.trim() || undefined,
          activityType,
          startTimeMillis,
          endTimeMillis,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isApiDisabled || data.error?.includes('Fitness API') || data.error?.includes('disabled')) {
          setApiDisabledUrl(
            data.activationUrl ||
              'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview?project=263261388820'
          );
        }
        throw new Error(data.error || 'Failed to push workout session.');
      }

      setSuccessMessage(data.message || 'Workout session successfully recorded!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-mono animate-in fade-in">
      <div className="bg-white border-4 border-black w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-[10px_10px_0px_#000000]">
        
        {/* Modal Header */}
        <div className="bg-black text-white p-4 flex items-center justify-between border-b-4 border-black">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#ccff00]" />
            <h3 className="font-black text-base uppercase tracking-tight">
              Google Fit Sync Console
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#ccff00] p-1 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 border-b-2 border-black bg-zinc-100 text-xs font-bold">
          <button
            onClick={() => {
              setActiveTab('health');
              setErrorMessage(null);
            }}
            className={`py-3 flex items-center justify-center gap-2 uppercase transition-all ${
              activeTab === 'health'
                ? 'bg-white text-black border-b-4 border-black font-black'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Health Metrics (Raw NS)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('workout');
              setErrorMessage(null);
            }}
            className={`py-3 flex items-center justify-center gap-2 uppercase transition-all ${
              activeTab === 'workout'
                ? 'bg-white text-black border-b-4 border-black font-black'
                : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>Workout Session (Sessions API)</span>
          </button>
        </div>

        {/* Status Messages */}
        <div className="p-4 pb-0">
          {errorMessage && (
            <div className="p-3 bg-rose-100 border-2 border-rose-500 text-rose-900 text-xs font-bold mb-3 shadow-[2px_2px_0px_#000000]">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-700" />
                <div className="flex-1">
                  <div className="font-black uppercase tracking-tight">
                    {apiDisabledUrl || errorMessage.includes('Fitness API')
                      ? 'Action Required: Enable Fitness API in Google Cloud'
                      : 'Submission Error'}
                  </div>
                  <p className="mt-1 font-sans font-normal text-rose-950 text-xs leading-relaxed">
                    {apiDisabledUrl || errorMessage.includes('Fitness API')
                      ? 'Google Fitness API has not been enabled in your Google Cloud Project (263261388820). Google rejects all data reads and writes until this API is enabled in your Google Cloud Console.'
                      : errorMessage}
                  </p>
                  {(apiDisabledUrl || errorMessage.includes('Fitness API')) && (
                    <a
                      href={
                        apiDisabledUrl ||
                        'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview?project=263261388820'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-mono font-bold text-xs border border-black shadow-[2px_2px_0px_#000000] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Enable Fitness API in Google Cloud Console &rarr;</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-emerald-100 border-2 border-emerald-500 text-emerald-900 text-xs font-bold flex items-start gap-2 mb-3 shadow-[2px_2px_0px_#000000]">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* TAB 1: HEALTH METRICS FORM */}
        {activeTab === 'health' && (
          <form onSubmit={handleSubmitHealth} className="p-5 space-y-4 text-xs">
            {/* Explanatory technical callout */}
            <div className="bg-zinc-100 border border-black p-3 text-[11px] text-zinc-700 leading-relaxed font-sans">
              <span className="font-bold text-black font-mono">Google Fit Dataset Convention: </span>
              Metrics are packaged into a <code className="bg-zinc-200 px-1 py-0.5">raw:com.google...</code> data
              source and committed to a <code className="bg-zinc-200 px-1 py-0.5">&#123;startNs&#125;-&#123;endNs&#125;</code> dataset
              using 64-bit nanosecond timestamps (<code className="bg-zinc-200 px-1 py-0.5">1 ms = 1,000,000 ns</code>).
            </div>

            {/* Metric 1: Weight */}
            <div>
              <label className="block font-black uppercase text-black mb-1">
                Body Weight (kg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  placeholder="e.g. 78.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full p-2.5 border-2 border-black bg-zinc-50 font-bold focus:bg-white focus:outline-hidden"
                />
                <span className="bg-black text-white px-3 py-2.5 border-2 border-black font-bold">
                  KG
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Google Fit Type: com.google.weight (fpVal)</p>
            </div>

            {/* Metric 2: Height with live cm to meters conversion */}
            <div>
              <label className="block font-black uppercase text-black mb-1">
                Height (cm)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="50"
                  max="260"
                  placeholder="e.g. 178"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full p-2.5 border-2 border-black bg-zinc-50 font-bold focus:bg-white focus:outline-hidden"
                />
                <span className="bg-black text-white px-3 py-2.5 border-2 border-black font-bold">
                  CM
                </span>
              </div>
              {metersPreview && (
                <div className="mt-1 text-[11px] font-bold text-emerald-700">
                  &rarr; Automatically converts to {metersPreview} meters for <code className="font-mono">com.google.height</code>
                </div>
              )}
            </div>

            {/* Metric 3: Blood Pressure (Systolic & Diastolic) */}
            <div className="border-2 border-black p-3 bg-zinc-50">
              <label className="block font-black uppercase text-black mb-2 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Blood Pressure (mmHg)
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                    Systolic (Upper)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="70"
                    max="260"
                    placeholder="e.g. 118"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full p-2 border-2 border-black bg-white font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                    Diastolic (Lower)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="40"
                    max="160"
                    placeholder="e.g. 78"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full p-2 border-2 border-black bg-white font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {bpCategory && (
                <div className={`mt-2 p-1.5 border text-[11px] font-bold ${bpBadgeColor}`}>
                  {bpCategory}
                </div>
              )}

              {/* Body Position Selector */}
              <div className="mt-2.5">
                <label className="block text-[10px] font-bold uppercase text-zinc-600 mb-0.5">
                  Measurement Position
                </label>
                <select
                  value={bodyPosition}
                  onChange={(e) => setBodyPosition(e.target.value)}
                  className="w-full p-1.5 border border-black bg-white text-xs font-bold"
                >
                  <option value="2">Sitting (Standard Resting)</option>
                  <option value="1">Standing</option>
                  <option value="3">Lying Down (Supine)</option>
                  <option value="4">Semi-recumbent</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-black font-bold uppercase bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 border-2 border-black font-black uppercase bg-[#ccff00] text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#ccff00] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Syncing to Google Fit...' : 'Commit Reading'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: WORKOUT SESSION FORM */}
        {activeTab === 'workout' && (
          <form onSubmit={handleSubmitWorkout} className="p-5 space-y-4 text-xs">
            {/* Explanatory callout */}
            <div className="bg-zinc-100 border border-black p-3 text-[11px] text-zinc-700 leading-relaxed font-sans">
              <span className="font-bold text-black font-mono">Sessions API Convention: </span>
              Workout sessions are persisted via <code className="bg-zinc-200 px-1 py-0.5">PUT /users/me/sessions/&#123;id&#125;</code> using
              standard Unix millisecond timestamps and standard activity type numeric codes.
            </div>

            {/* Session Title */}
            <div>
              <label className="block font-black uppercase text-black mb-1">
                Workout Session Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Heavy Upper Body Push Workout"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
                className="w-full p-2.5 border-2 border-black bg-zinc-50 font-bold focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Activity Type Dropdown */}
            <div>
              <label className="block font-black uppercase text-black mb-1">
                Activity Type Code (Google Fit Standard) *
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(parseInt(e.target.value, 10))}
                className="w-full p-2.5 border-2 border-black bg-zinc-50 font-bold focus:bg-white focus:outline-hidden"
              >
                {Object.entries(GOOGLE_FIT_ACTIVITY_TYPES).map(([code, meta]) => (
                  <option key={code} value={code}>
                    {meta.name} (Code: {code} — {meta.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="font-black uppercase text-black">
                  Session Duration
                </label>
                <span className="font-black text-sm text-black">
                  {durationMinutes} minutes
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="240"
                step="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                <span>5 mins</span>
                <span>45 mins</span>
                <span>90 mins</span>
                <span>240 mins</span>
              </div>
            </div>

            {/* Notes / Description */}
            <div>
              <label className="block font-black uppercase text-black mb-1">
                Notes & Training Focus (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 5x5 Incline Bench, Overhead Dumbbell Press, RPE 8.5"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="w-full p-2 border-2 border-black bg-zinc-50 text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t-2 border-black flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border-2 border-black font-bold uppercase bg-zinc-100 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 border-2 border-black font-black uppercase bg-[#ccff00] text-black shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#ccff00] transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Pushing Session...' : 'Insert Workout Session'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
