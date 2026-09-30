'use client';

/**
 * Google Fit Two-Way Telemetry & Biometrics Dashboard
 * 
 * Synchronizes health, biometric, and workout data between this web application
 * and Google Fit (bridging Android smartphones and smartwatches).
 * 
 * Features:
 * 1. Live Stat Cards:
 *    - Steps Today (aggregated step delta com.google.step_count.delta)
 *    - Latest Body Weight (com.google.weight in kg)
 *    - Blood Pressure (com.google.blood_pressure with systolic, diastolic in mmHg, MAP, status)
 *    - Height (com.google.height in meters and cm preview with derived BMI)
 * 2. Recent Activity Feed (Workouts):
 *    - Past 7 days sessions from Google Fit Android app & smartwatch (users.sessions.list)
 *    - Mapped numeric activityType codes (7=Walking, 8=Running, 1=Cycling, 97=Weightlifting, etc.)
 *    - Duration badges, timestamps, and originating source app labels
 * 3. Two-Way Action Modal / Forms:
 *    - Form 1: Add Biometric Metric (Weight, Height with cm->m conversion, Blood Pressure with validation)
 *    - Form 2: Log Workout Session (Title, activity type dropdown, duration) using users.sessions.update
 */

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import {
  Footprints,
  Scale,
  HeartPulse,
  Ruler,
  Dumbbell,
  RefreshCw,
  Plus,
  Activity,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Watch,
  Globe,
  ExternalLink,
  ShieldCheck,
  LogOut,
  Calendar,
  Clock,
  ChevronRight,
  Sparkles,
  Info,
  X,
  Flame,
  ArrowUpRight,
  Home,
} from 'lucide-react';

// ============================================================================
// TypeScript Domain Interfaces
// ============================================================================

interface BloodPressureData {
  systolic?: number | null;
  diastolic?: number | null;
  meanArterialPressure?: number | null;
  status: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis' | 'Not Recorded' | 'Unknown';
  bodyPosition?: string;
  location?: string;
  timestamp?: string;
  isRecorded?: boolean;
}

interface TelemetryMetrics {
  steps: number;
  weightKg: number | null;
  heightMeters: number | null;
  bloodPressure: BloodPressureData | null;
  bmi: number | null;
  lastUpdated: string;
}

interface WorkoutSession {
  id: string;
  name: string;
  description?: string;
  activityType: number;
  activityName: string;
  category: string;
  startTimeMillis: number;
  endTimeMillis: number;
  durationMinutes: number;
  formattedDuration: string;
  startDateIso: string;
  sourceApp: string;
  isFromWatchOrPhone: boolean;
}

interface UserProfile {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Activity types dropdown options with numeric codes
const ACTIVITY_OPTIONS = [
  { code: 7, name: 'Walking', category: 'Cardio' },
  { code: 8, name: 'Running', category: 'Cardio' },
  { code: 1, name: 'Cycling / Biking', category: 'Cardio' },
  { code: 97, name: 'Weightlifting', category: 'Strength' },
  { code: 80, name: 'Strength Training', category: 'Strength' },
  { code: 114, name: 'HIIT (High Intensity)', category: 'Conditioning' },
  { code: 100, name: 'Yoga', category: 'Flexibility' },
  { code: 82, name: 'Swimming', category: 'Cardio' },
  { code: 35, name: 'Hiking', category: 'Cardio' },
  { code: 21, name: 'Calisthenics', category: 'Strength' },
  { code: 50, name: 'Pilates', category: 'Flexibility' },
  { code: 54, name: 'Rowing', category: 'Cardio' },
  { code: 0, name: 'Other Workout', category: 'General' },
];

export default function DashboardPage() {
  const [isPending, startTransition] = useTransition();

  // Authentication & Connection State
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [demoBpNotRecorded, setDemoBpNotRecorded] = useState<boolean>(false);

  // Telemetry Data State
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  // Error & Status Notifications
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isApiDisabled, setIsApiDisabled] = useState<boolean>(false);
  const [apiActivationUrl, setApiActivationUrl] = useState<string | null>(null);

  // Modal / Action Tabs State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'biometrics' | 'workout'>('biometrics');

  // Form 1 State: Biometrics
  const [biometricType, setBiometricType] = useState<'weight' | 'height' | 'blood_pressure'>('weight');
  const [weightInput, setWeightInput] = useState<string>('');
  const [heightCmInput, setHeightCmInput] = useState<string>('');
  const [systolicInput, setSystolicInput] = useState<string>('');
  const [diastolicInput, setDiastolicInput] = useState<string>('');
  const [bodyPositionInput, setBodyPositionInput] = useState<string>('2'); // 2 = Sitting
  const [locationInput, setLocationInput] = useState<string>('1');         // 1 = Left upper arm
  const [isSubmittingBiometric, setIsSubmittingBiometric] = useState<boolean>(false);

  // Form 2 State: Workout Session
  const [workoutTitle, setWorkoutTitle] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<number>(8); // Default: Running
  const [workoutDuration, setWorkoutDuration] = useState<number>(30);  // Minutes
  const [workoutNotes, setWorkoutNotes] = useState<string>('');
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // Fetch Metrics & Sessions Data
  // --------------------------------------------------------------------------
  const loadDashboardData = useCallback(async (forcedDemo?: boolean) => {
    setIsRefreshing(true);
    setErrorNotice(null);

    const demoFlag = forcedDemo !== undefined ? forcedDemo : isDemoMode;
    const queryParam = demoFlag ? '?demo=true' : '';

    try {
      // 1. Fetch connection status
      const statusRes = await fetch('/api/fitness/status');
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setIsConfigured(sData.isConfigured !== false);
        setIsConnected(Boolean(sData.connected));
        if (sData.user) {
          setUser(sData.user);
        }
      }

      // 2. Fetch Metrics and Workouts in parallel
      const [metricsRes, workoutsRes] = await Promise.all([
        fetch(`/api/fitness/metrics${queryParam}`),
        fetch(`/api/fitness/workouts${queryParam}`),
      ]);

      // Process Metrics
      if (metricsRes.ok) {
        const mData = await metricsRes.json();
        setMetrics(mData.metrics);
        if (mData.user && !user) {
          setUser(mData.user);
        }
        if (mData.isDemo) {
          setIsDemoMode(true);
        }
      } else if (metricsRes.status === 401) {
        // Not connected: default to demo preview so user sees full interface
        if (!demoFlag) {
          setIsDemoMode(true);
          return loadDashboardData(true);
        }
      } else if (metricsRes.status === 403) {
        const errJson = await metricsRes.json();
        if (errJson.isApiDisabled) {
          setIsApiDisabled(true);
          setApiActivationUrl(
            errJson.activationUrl ||
              'https://console.developers.google.com/apis/api/fitness.googleapis.com/overview'
          );
        }
      }

      // Process Workouts
      if (workoutsRes.ok) {
        const wData = await workoutsRes.json();
        setWorkouts(wData.sessions || []);
      }

      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setErrorNotice('Network error connecting to fitness sync service.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isDemoMode, user]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle URL auth return parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('auth') === 'success') {
        setSuccessNotice('Google Fit connected successfully! Live two-way sync active.');
        setIsConnected(true);
        setIsDemoMode(false);
        // Clean search query from URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        loadDashboardData(false);
      } else if (urlParams.get('error')) {
        setErrorNotice(`Connection error: ${urlParams.get('error')}`);
      }
    }
  }, [loadDashboardData]);

  // Disconnect handler
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Fit?')) return;
    try {
      await fetch('/api/fitness/status', { method: 'DELETE' });
      setIsConnected(false);
      setUser(null);
      setSuccessNotice('Disconnected from Google Fit.');
      loadDashboardData(true); // Switch to sandbox mode
    } catch (err) {
      console.error('Error disconnecting:', err);
    }
  };

  // --------------------------------------------------------------------------
  // Form 1 Submission: Add Biometric Metric
  // --------------------------------------------------------------------------
  const handleSubmitBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBiometric(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    const payload: any = { metricType: biometricType };

    if (biometricType === 'weight') {
      const wVal = parseFloat(weightInput);
      if (isNaN(wVal) || wVal < 20 || wVal > 350) {
        setErrorNotice('Please provide a valid weight between 20 kg and 350 kg.');
        setIsSubmittingBiometric(false);
        return;
      }
      payload.weightKg = wVal;
    } else if (biometricType === 'height') {
      const hVal = parseFloat(heightCmInput);
      if (isNaN(hVal) || hVal < 50 || hVal > 280) {
        setErrorNotice('Please provide a valid height between 50 cm and 280 cm.');
        setIsSubmittingBiometric(false);
        return;
      }
      payload.heightCm = hVal;
    } else if (biometricType === 'blood_pressure') {
      const sys = parseFloat(systolicInput);
      const dia = parseFloat(diastolicInput);

      if (isNaN(sys) || isNaN(dia)) {
        setErrorNotice('Please provide both systolic and diastolic pressures.');
        setIsSubmittingBiometric(false);
        return;
      }
      if (sys <= dia) {
        setErrorNotice('Systolic pressure must be strictly greater than diastolic pressure.');
        setIsSubmittingBiometric(false);
        return;
      }

      payload.bloodPressure = {
        systolic: sys,
        diastolic: dia,
        bodyPosition: parseInt(bodyPositionInput, 10),
        location: parseInt(locationInput, 10),
      };
    }

    try {
      const res = await fetch('/api/fitness/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessNotice(`Biometric data successfully written to Google Fit raw stream!`);
        setShowModal(false);
        // Clear input fields
        setWeightInput('');
        setHeightCmInput('');
        setSystolicInput('');
        setDiastolicInput('');
        // Refresh telemetry
        await loadDashboardData();
      } else {
        setErrorNotice(data.message || data.error || 'Failed to write biometric metric.');
        if (data.isApiDisabled) {
          setIsApiDisabled(true);
          setApiActivationUrl(data.activationUrl);
        }
      }
    } catch (err: any) {
      setErrorNotice('Network error while saving biometric metric.');
    } finally {
      setIsSubmittingBiometric(false);
    }
  };

  // --------------------------------------------------------------------------
  // Form 2 Submission: Log Completed Workout Session
  // --------------------------------------------------------------------------
  const handleSubmitWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWorkout(true);
    setErrorNotice(null);
    setSuccessNotice(null);

    const actInfo = ACTIVITY_OPTIONS.find((a) => a.code === selectedActivity);
    const finalTitle = workoutTitle.trim() || `${actInfo?.name || 'Workout'} Session`;

    const payload = {
      name: finalTitle,
      activityType: selectedActivity,
      durationMinutes: workoutDuration,
      description: workoutNotes.trim() || undefined,
    };

    try {
      const res = await fetch('/api/fitness/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessNotice(`Workout '${data.session?.name}' synchronized to Google Fit!`);
        setShowModal(false);
        setWorkoutTitle('');
        setWorkoutNotes('');
        setWorkoutDuration(30);
        // Refresh workouts feed
        await loadDashboardData();
      } else {
        setErrorNotice(data.message || data.error || 'Failed to log workout session.');
        if (data.isApiDisabled) {
          setIsApiDisabled(true);
          setApiActivationUrl(data.activationUrl);
        }
      }
    } catch (err: any) {
      setErrorNotice('Network error while saving workout session.');
    } finally {
      setIsSubmittingWorkout(false);
    }
  };

  // Derived calculations for preview
  const liveHeightMeters = heightCmInput ? (parseFloat(heightCmInput) / 100).toFixed(2) : null;
  const sysVal = parseFloat(systolicInput);
  const diaVal = parseFloat(diastolicInput);
  const isBpValid = !isNaN(sysVal) && !isNaN(diaVal) && sysVal > diaVal;

  // Explicit check for Blood Pressure: whether recorded or pending measurement
  const isBpRecorded = Boolean(
    (!isDemoMode || !demoBpNotRecorded) &&
    metrics?.bloodPressure &&
    metrics.bloodPressure.isRecorded !== false &&
    metrics.bloodPressure.status !== 'Not Recorded' &&
    typeof metrics.bloodPressure.systolic === 'number' &&
    metrics.bloodPressure.systolic > 0 &&
    typeof metrics.bloodPressure.diastolic === 'number' &&
    metrics.bloodPressure.diastolic > 0
  );

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans pb-20 selection:bg-[#ccff00] selection:text-black">
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & TELEMETRY STATUS BAR                                 */}
      {/* ==================================================================== */}
      <header className="border-b-2 border-black bg-white sticky top-0 z-30 shadow-[0_2px_0px_#000000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="w-10 h-10 border-2 border-black bg-[#ccff00] flex items-center justify-center font-mono font-black text-lg shadow-[2px_2px_0px_#000000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              title="Return to Home"
            >
              <Home className="w-5 h-5 text-black" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 bg-black text-[#ccff00]">
                  Two-Way Cloud Sync
                </span>
                <span className="font-mono text-xs font-bold text-zinc-500 hidden sm:inline">
                  Google Fit REST API v1
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
                Biometrics & Workout Dashboard
              </h1>
            </div>
          </div>

          {/* Right Action & Connection Status Block */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sync Status Badge */}
            {isConnected ? (
              <div className="flex items-center gap-2 border-2 border-black bg-emerald-100 px-3 py-1.5 shadow-[2px_2px_0px_#000000]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-900 leading-tight">
                    Google Fit Linked
                  </span>
                  {user?.email && (
                    <span className="text-[10px] font-mono text-emerald-800 truncate max-w-[140px]">
                      {user.email}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="ml-1 text-zinc-500 hover:text-black p-1 hover:bg-emerald-200 transition-colors"
                  title="Disconnect Google Fit"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/api/auth/login?returnTo=/dashboard"
                  className="flex items-center gap-1.5 bg-[#ccff00] border-2 border-black px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-black hover:text-[#ccff00] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Connect Google Fit</span>
                </a>

                {/* Sandbox / Demo Mode Toggle */}
                <button
                  onClick={() => {
                    const next = !isDemoMode;
                    setIsDemoMode(next);
                    loadDashboardData(next);
                  }}
                  className={`border-2 border-black px-2.5 py-1.5 font-mono text-xs font-bold transition-all shadow-[2px_2px_0px_#000000] ${
                    isDemoMode
                      ? 'bg-amber-300 text-black'
                      : 'bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                  title="Toggle Simulated Sensor Data"
                >
                  {isDemoMode ? 'Preview Sandbox (On)' : 'Demo Sandbox'}
                </button>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={() => loadDashboardData()}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] hover:bg-zinc-100 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-60"
              title="Refresh Data from Google Fit"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-black' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Quick Action Button to Open Modal */}
            <button
              onClick={() => {
                setShowModal(true);
                setModalTab('biometrics');
              }}
              className="flex items-center gap-1.5 bg-black text-[#ccff00] border-2 border-black px-3.5 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-[#ccff00] hover:text-black hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Data</span>
            </button>
          </div>
        </div>

        {/* Device Sync Badges Sub-Bar */}
        <div className="bg-zinc-100 border-t border-black px-4 sm:px-6 py-1.5 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-zinc-600">Bridged Streams:</span>
            <span className="flex items-center gap-1 text-black font-semibold">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              Android Phone
            </span>
            <span className="flex items-center gap-1 text-black font-semibold">
              <Watch className="w-3.5 h-3.5 text-blue-600" />
              Smartwatch Companion
            </span>
            <span className="flex items-center gap-1 text-black font-semibold">
              <Globe className="w-3.5 h-3.5 text-purple-600" />
              Web Client
            </span>
          </div>

          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            <span>
              {lastRefreshedAt
                ? `Last Synced: ${lastRefreshedAt.toLocaleTimeString()}`
                : 'Connecting to telemetry streams...'}
            </span>
          </div>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* 2. ALERTS & NOTIFICATIONS                                            */}
      {/* ==================================================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* Success Alert */}
        {successNotice && (
          <div className="border-2 border-black bg-emerald-100 p-4 shadow-[4px_4px_0px_#000000] flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-950 font-mono text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-800 hover:text-black font-mono font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorNotice && (
          <div className="border-2 border-black bg-rose-100 p-4 shadow-[4px_4px_0px_#000000] flex items-start justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-rose-950 font-mono text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-800 hover:text-black font-mono font-bold"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* API Disabled in GCP Alert */}
        {isApiDisabled && (
          <div className="border-2 border-black bg-amber-100 p-5 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-mono font-black text-sm uppercase">
              <AlertCircle className="w-5 h-5 text-amber-700" />
              <span>Google Cloud Action Required: Fitness API Disabled</span>
            </div>
            <p className="text-xs text-amber-950 font-medium">
              The Google Fitness API is not enabled in your Google Cloud Platform project.
              Enable <strong>Fitness API (fitness.googleapis.com)</strong> to allow real-time
              telemetry sync and points insertion.
            </p>
            {apiActivationUrl && (
              <a
                href={apiActivationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-black text-[#ccff00] border-2 border-black px-3 py-1 font-mono text-xs font-black uppercase hover:bg-zinc-800 transition-colors"
              >
                <span>Enable Fitness API in Google Cloud</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && !isConnected && (
          <div className="border-2 border-black bg-[#ccff00]/30 border-dashed p-3 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-black font-semibold">
              <Sparkles className="w-4 h-4 text-black shrink-0" />
              <span>
                <strong>Sandbox Preview Mode Active:</strong> Displaying representative telemetry
                points. Connect your Google Fit account to view your live device sensors.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDemoBpNotRecorded(!demoBpNotRecorded)}
                className={`px-2.5 py-1 text-[11px] font-black uppercase border border-black shadow-[1px_1px_0px_#000000] transition-colors ${
                  demoBpNotRecorded
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
                title="Toggle Blood Pressure between Recorded and Not Recorded states"
              >
                {demoBpNotRecorded ? 'Test BP: ∅ Not Recorded' : 'Test BP: ✓ Recorded'}
              </button>
              <a
                href="/api/auth/login?returnTo=/dashboard"
                className="bg-black text-[#ccff00] font-black uppercase px-2.5 py-1 text-[11px] whitespace-nowrap hover:bg-[#ccff00] hover:text-black border border-black shadow-[1px_1px_0px_#000000] transition-colors"
              >
                Connect Real Account
              </a>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* 3. CORE REQUIREMENT 1: LIVE STAT CARDS (4 METRICS)                   */}
        {/* ==================================================================== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-2">
                <span>Core Health & Biometrics</span>
                <span className="font-mono text-xs bg-black text-white px-2 py-0.5 font-bold">
                  Last 24h Telemetry
                </span>
              </h2>
            </div>
            <div className="text-xs font-mono text-zinc-500 hidden sm:block">
              Auto-aggregated from hardware sensors & manual entries
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ---------------- CARD 1: DAILY STEPS ---------------- */}
            <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative flex flex-col justify-between hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#000000] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-600">
                    Daily Steps
                  </span>
                  <div className="w-8 h-8 rounded-none border-2 border-black bg-[#ccff00] flex items-center justify-center">
                    <Footprints className="w-4 h-4 text-black" />
                  </div>
                </div>

                <div className="text-3xl font-black tracking-tight text-black font-mono">
                  {metrics ? metrics.steps.toLocaleString() : '—'}
                </div>
                <div className="font-mono text-xs text-zinc-500 mt-0.5">
                  com.google.step_count.delta
                </div>
              </div>

              {/* Progress bar towards 10,000 steps */}
              <div className="mt-4 pt-3 border-t-2 border-zinc-100">
                <div className="flex justify-between font-mono text-[11px] font-bold text-zinc-600 mb-1">
                  <span>Goal: 10,000</span>
                  <span>
                    {metrics ? `${Math.min(100, Math.round((metrics.steps / 10000) * 100))}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden">
                  <div
                    className="bg-[#ccff00] h-full border-r border-black transition-all duration-500"
                    style={{
                      width: `${metrics ? Math.min(100, Math.round((metrics.steps / 10000) * 100)) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ---------------- CARD 2: BODY WEIGHT ---------------- */}
            <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative flex flex-col justify-between hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#000000] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-600">
                    Body Weight
                  </span>
                  <div className="w-8 h-8 rounded-none border-2 border-black bg-blue-100 flex items-center justify-center">
                    <Scale className="w-4 h-4 text-black" />
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-black font-mono">
                    {metrics?.weightKg !== null && metrics?.weightKg !== undefined
                      ? metrics.weightKg.toFixed(1)
                      : '—'}
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-500">kg</span>
                </div>
                <div className="font-mono text-xs text-zinc-500 mt-0.5">
                  {metrics?.weightKg
                    ? `~ ${(metrics.weightKg * 2.20462).toFixed(1)} lbs (com.google.weight)`
                    : 'com.google.weight'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-zinc-100 flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-500">Latest reading</span>
                <button
                  onClick={() => {
                    setBiometricType('weight');
                    setShowModal(true);
                    setModalTab('biometrics');
                  }}
                  className="font-mono text-[11px] font-black uppercase text-blue-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Update</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ---------------- CARD 3: BLOOD PRESSURE (NOT RECORDED CHECK SET) ---------------- */}
            <div
              className={`border-2 border-black p-5 shadow-[4px_4px_0px_#000000] relative flex flex-col justify-between hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#000000] transition-all ${
                isBpRecorded ? 'bg-white' : 'bg-zinc-50 border-dashed border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-600">
                    Blood Pressure
                  </span>
                  <div
                    className={`w-8 h-8 rounded-none border-2 border-black flex items-center justify-center ${
                      isBpRecorded ? 'bg-rose-100' : 'bg-zinc-200'
                    }`}
                  >
                    <HeartPulse className={`w-4 h-4 ${isBpRecorded ? 'text-rose-600' : 'text-zinc-500'}`} />
                  </div>
                </div>

                {isBpRecorded && metrics?.bloodPressure?.systolic && metrics?.bloodPressure?.diastolic ? (
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black tracking-tight text-black font-mono">
                        {metrics.bloodPressure.systolic} / {metrics.bloodPressure.diastolic}
                      </span>
                      <span className="font-mono text-xs font-bold text-zinc-500">mmHg</span>
                    </div>
                    <div className="font-mono text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                      <span>MAP: {metrics.bloodPressure.meanArterialPressure} mmHg</span>
                      {metrics.bloodPressure.bodyPosition && (
                        <span>&bull; {metrics.bloodPressure.bodyPosition}</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black tracking-tight text-zinc-700 font-mono">
                        Not Recorded
                      </span>
                    </div>
                    <div className="font-mono text-xs text-zinc-500 mt-0.5">
                      Baseline pending &bull; No reading in Google Fit
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t-2 border-zinc-200 flex items-center justify-between">
                {isBpRecorded && metrics?.bloodPressure?.status ? (
                  <span
                    className={`font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-black ${
                      metrics.bloodPressure.status === 'Normal'
                        ? 'bg-emerald-100 text-emerald-900'
                        : metrics.bloodPressure.status === 'Elevated'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {metrics.bloodPressure.status}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-dashed border-zinc-400 bg-zinc-100 text-zinc-600">
                    Not Recorded
                  </span>
                )}
                <button
                  onClick={() => {
                    setBiometricType('blood_pressure');
                    setShowModal(true);
                    setModalTab('biometrics');
                  }}
                  className={`font-mono text-[11px] font-black uppercase flex items-center gap-0.5 transition-all ${
                    isBpRecorded
                      ? 'text-rose-700 hover:underline'
                      : 'bg-black text-[#ccff00] px-2.5 py-1 border border-black hover:bg-[#ccff00] hover:text-black shadow-[1px_1px_0px_#000000]'
                  }`}
                >
                  <span>{isBpRecorded ? 'Update' : '+ Record BP'}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ---------------- CARD 4: HEIGHT & BMI ---------------- */}
            <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] relative flex flex-col justify-between hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#000000] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-black uppercase tracking-wider text-zinc-600">
                    Height & BMI
                  </span>
                  <div className="w-8 h-8 rounded-none border-2 border-black bg-purple-100 flex items-center justify-center">
                    <Ruler className="w-4 h-4 text-purple-700" />
                  </div>
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-black font-mono">
                    {metrics?.heightMeters !== null && metrics?.heightMeters !== undefined
                      ? metrics.heightMeters.toFixed(2)
                      : '—'}
                  </span>
                  <span className="font-mono text-sm font-bold text-zinc-500">m</span>
                  {metrics?.heightMeters && (
                    <span className="font-mono text-xs text-zinc-400">
                      ({Math.round(metrics.heightMeters * 100)} cm)
                    </span>
                  )}
                </div>

                <div className="font-mono text-xs text-zinc-500 mt-0.5">
                  {metrics?.bmi ? (
                    <span className="font-bold text-black">BMI: {metrics.bmi}</span>
                  ) : (
                    'com.google.height'
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-zinc-100 flex items-center justify-between">
                <span className="font-mono text-[11px] text-zinc-500">Profile reading</span>
                <button
                  onClick={() => {
                    setBiometricType('height');
                    setShowModal(true);
                    setModalTab('biometrics');
                  }}
                  className="font-mono text-[11px] font-black uppercase text-purple-700 hover:underline flex items-center gap-0.5"
                >
                  <span>Update</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 4. CORE REQUIREMENT 1 & 2: RECENT ACTIVITY FEED (WORKOUTS)           */}
        {/* ==================================================================== */}
        <section className="mt-8">
          <div className="border-2 border-black bg-white shadow-[4px_4px_0px_#000000]">
            {/* Feed Header */}
            <div className="p-4 sm:p-5 border-b-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 border-2 border-black bg-[#ccff00] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-black">
                    Recent Activity Feed & Sessions
                  </h2>
                  <p className="font-mono text-xs text-zinc-600">
                    Two-way sync: Past 7 days workouts logged in Android Google Fit app, WearOS, or Web
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowModal(true);
                    setModalTab('workout');
                  }}
                  className="bg-black text-[#ccff00] border-2 border-black px-3 py-1.5 font-mono text-xs font-black uppercase shadow-[2px_2px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Workout</span>
                </button>
                <button
                  onClick={() => loadDashboardData()}
                  disabled={isRefreshing}
                  className="border-2 border-black bg-white p-1.5 hover:bg-zinc-100 transition-colors shadow-[2px_2px_0px_#000000]"
                  title="Refresh Sessions"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-black ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Workout Sessions List */}
            {workouts.length > 0 ? (
              <div className="divide-y-2 divide-zinc-200">
                {workouts.map((workout) => {
                  const startDate = new Date(workout.startTimeMillis);
                  const isRecent = Date.now() - workout.startTimeMillis < 86400000;

                  return (
                    <div
                      key={workout.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                    >
                      {/* Left: Icon & Info */}
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div
                          className={`w-11 h-11 border-2 border-black shrink-0 flex items-center justify-center ${
                            workout.category === 'Strength'
                              ? 'bg-rose-100 text-rose-700'
                              : workout.category === 'Cardio'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <Dumbbell className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-base text-black">
                              {workout.name}
                            </span>
                            {/* Human-Readable Activity Name Badge */}
                            <span className="font-mono text-[10px] font-black uppercase px-2 py-0.5 border border-black bg-zinc-100">
                              {workout.activityName}
                            </span>
                            {isRecent && (
                              <span className="font-mono text-[10px] font-black uppercase px-1.5 py-0.5 bg-[#ccff00] text-black border border-black">
                                Today
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-zinc-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {startDate.toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              at{' '}
                              {startDate.toLocaleTimeString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {workout.description && (
                              <span className="text-zinc-600 italic truncate max-w-xs">
                                &bull; {workout.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Duration Badge & Source App Label */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                        {/* Source App Tag */}
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-600 bg-zinc-100 border border-zinc-300 px-2 py-1">
                          {workout.isFromWatchOrPhone ? (
                            workout.sourceApp.toLowerCase().includes('wear') ||
                            workout.sourceApp.toLowerCase().includes('watch') ? (
                              <Watch className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            )
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span>{workout.sourceApp}</span>
                        </div>

                        {/* Duration Badge */}
                        <div className="border-2 border-black bg-black text-[#ccff00] font-mono text-xs font-black px-3 py-1 shadow-[2px_2px_0px_#000000] whitespace-nowrap">
                          {workout.formattedDuration}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center font-mono">
                <div className="w-14 h-14 border-2 border-black bg-zinc-100 mx-auto flex items-center justify-center mb-3">
                  <Activity className="w-7 h-7 text-zinc-400" />
                </div>
                <h3 className="font-black text-base text-black uppercase">
                  No Past Sessions Found in Last 7 Days
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Workout sessions logged in your Google Fit Android app, WearOS watch, or from
                  this dashboard will automatically sync and appear here.
                </p>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setModalTab('workout');
                  }}
                  className="mt-4 bg-[#ccff00] text-black border-2 border-black px-4 py-2 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000000] hover:bg-black hover:text-[#ccff00] transition-all inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Your First Workout</span>
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================== */}
        {/* 5. ARCHITECTURAL & SPECIFICATION DETAILS FOOTER                      */}
        {/* ==================================================================== */}
        <section className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] font-mono text-xs space-y-3">
          <div className="flex items-center gap-2 font-black uppercase text-black text-sm">
            <Info className="w-4 h-4 text-black" />
            <span>Google Fit Integration Architecture Specifications</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-zinc-600">
            <div className="border-l-2 border-black pl-3 space-y-1">
              <strong className="text-black block">1. Precision Timestamps:</strong>
              <p>
                - Datasets & Points: <strong>Nanoseconds (ns)</strong> using BigInt
                (<code>BigInt(ms) * 1,000,000</code>) to prevent JS float bit precision loss.
              </p>
              <p>- Sessions & Aggregations: Standard Epoch <strong>Milliseconds (ms)</strong>.</p>
            </div>
            <div className="border-l-2 border-black pl-3 space-y-1">
              <strong className="text-black block">2. Raw Stream Registration:</strong>
              <p>
                Automated <code>users.dataSources.create</code> provisioning custom raw
                streams: <code>raw:com.google.[weight|height|blood_pressure]</code>.
              </p>
              <p>Patched via <code>users.dataSources.datasets.patch</code>.</p>
            </div>
            <div className="border-l-2 border-black pl-3 space-y-1">
              <strong className="text-black block">3. Two-Way Session Sync:</strong>
              <p>
                - Read: <code>users.sessions.list</code> mapping numeric codes to friendly names.
              </p>
              <p>
                - Write: <code>users.sessions.update</code> logging web sessions back to Android.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ==================================================================== */}
      {/* 6. MODAL & FORMS (CORE REQUIREMENT 3)                                */}
      {/* ==================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black w-full max-w-xl shadow-[8px_8px_0px_#000000] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-black text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#ccff00]" />
                <h3 className="font-mono text-base font-black uppercase text-white tracking-wider">
                  {modalTab === 'biometrics' ? 'Log Biometric Reading' : 'Log Workout Session'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Action Tabs */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-zinc-100 font-mono text-xs font-black uppercase">
              <button
                onClick={() => setModalTab('biometrics')}
                className={`py-3 flex items-center justify-center gap-2 transition-colors ${
                  modalTab === 'biometrics'
                    ? 'bg-white border-b-4 border-[#ccff00] text-black shadow-inner'
                    : 'text-zinc-500 hover:text-black'
                }`}
              >
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>1. Biometrics (Body/BP)</span>
              </button>
              <button
                onClick={() => setModalTab('workout')}
                className={`py-3 flex items-center justify-center gap-2 transition-colors ${
                  modalTab === 'workout'
                    ? 'bg-white border-b-4 border-[#ccff00] text-black shadow-inner'
                    : 'text-zinc-500 hover:text-black'
                }`}
              >
                <Dumbbell className="w-4 h-4 text-blue-600" />
                <span>2. Workout Session</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* ------------------------------------------------------------ */}
              {/* FORM 1: ADD BIOMETRIC METRIC                                 */}
              {/* ------------------------------------------------------------ */}
              {modalTab === 'biometrics' && (
                <form onSubmit={handleSubmitBiometrics} className="space-y-5 font-mono">
                  {/* Select Metric Sub-type */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-2">
                      Target Metric Type:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBiometricType('weight')}
                        className={`p-2.5 border-2 border-black text-xs font-black uppercase flex flex-col items-center gap-1.5 transition-all ${
                          biometricType === 'weight'
                            ? 'bg-[#ccff00] shadow-[2px_2px_0px_#000000]'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <Scale className="w-4 h-4" />
                        <span>Weight (kg)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBiometricType('height')}
                        className={`p-2.5 border-2 border-black text-xs font-black uppercase flex flex-col items-center gap-1.5 transition-all ${
                          biometricType === 'height'
                            ? 'bg-[#ccff00] shadow-[2px_2px_0px_#000000]'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <Ruler className="w-4 h-4" />
                        <span>Height (cm)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBiometricType('blood_pressure')}
                        className={`p-2.5 border-2 border-black text-xs font-black uppercase flex flex-col items-center gap-1.5 transition-all ${
                          biometricType === 'blood_pressure'
                            ? 'bg-[#ccff00] shadow-[2px_2px_0px_#000000]'
                            : 'bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <HeartPulse className="w-4 h-4" />
                        <span>Blood Pressure</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Weight Field */}
                  {biometricType === 'weight' && (
                    <div className="space-y-3 bg-zinc-50 border-2 border-black p-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">
                          Body Weight (kg):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            min="20"
                            max="350"
                            required
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            placeholder="e.g. 74.5"
                            className="w-full border-2 border-black p-2.5 text-base font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ccff00]"
                          />
                          <span className="absolute right-3 top-2.5 text-zinc-400 font-bold text-sm">
                            kg
                          </span>
                        </div>
                      </div>
                      {weightInput && !isNaN(parseFloat(weightInput)) && (
                        <div className="text-xs text-zinc-600">
                          Equivalent in imperial units:{' '}
                          <strong>{(parseFloat(weightInput) * 2.20462).toFixed(1)} lbs</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Height Field with cm -> m conversion */}
                  {biometricType === 'height' && (
                    <div className="space-y-3 bg-zinc-50 border-2 border-black p-4">
                      <div>
                        <label className="block text-xs font-bold text-black mb-1">
                          Height in Centimeters (cm):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="1"
                            min="50"
                            max="280"
                            required
                            value={heightCmInput}
                            onChange={(e) => setHeightCmInput(e.target.value)}
                            placeholder="e.g. 178"
                            className="w-full border-2 border-black p-2.5 text-base font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ccff00]"
                          />
                          <span className="absolute right-3 top-2.5 text-zinc-400 font-bold text-sm">
                            cm
                          </span>
                        </div>
                      </div>
                      {liveHeightMeters && (
                        <div className="text-xs text-zinc-700 bg-[#ccff00]/40 p-2 border border-black">
                          Automatic Google Fit Conversion:{' '}
                          <strong>{liveHeightMeters} meters</strong> (
                          <code>com.google.height</code> standard)
                        </div>
                      )}
                    </div>
                  )}

                  {/* Blood Pressure Fields with AHA validation & position/location metadata */}
                  {biometricType === 'blood_pressure' && (
                    <div className="space-y-4 bg-zinc-50 border-2 border-black p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-black mb-1">
                            Systolic (mmHg):
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="50"
                            max="260"
                            required
                            value={systolicInput}
                            onChange={(e) => setSystolicInput(e.target.value)}
                            placeholder="e.g. 120"
                            className="w-full border-2 border-black p-2.5 text-base font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ccff00]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-black mb-1">
                            Diastolic (mmHg):
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="30"
                            max="180"
                            required
                            value={diastolicInput}
                            onChange={(e) => setDiastolicInput(e.target.value)}
                            placeholder="e.g. 80"
                            className="w-full border-2 border-black p-2.5 text-base font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ccff00]"
                          />
                        </div>
                      </div>

                      {/* Live Validation & Status Badge */}
                      {systolicInput && diastolicInput && (
                        <div>
                          {!isBpValid ? (
                            <div className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-300 p-2">
                              &times; Systolic pressure must be higher than diastolic pressure.
                            </div>
                          ) : (
                            <div className="text-xs text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 p-2 flex items-center justify-between">
                              <span>Valid blood pressure reading</span>
                              <span>
                                MAP: ~{Math.round((2 * diaVal + sysVal) / 3)} mmHg
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Position & Location Metadata Fields */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200 text-xs">
                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">
                            Body Position:
                          </label>
                          <select
                            value={bodyPositionInput}
                            onChange={(e) => setBodyPositionInput(e.target.value)}
                            className="w-full border-2 border-black p-2 bg-white font-mono text-xs font-bold"
                          >
                            <option value="2">Sitting (Standard)</option>
                            <option value="1">Standing</option>
                            <option value="3">Lying Down</option>
                            <option value="4">Semi-recumbent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-bold text-zinc-700 mb-1">
                            Measurement Location:
                          </label>
                          <select
                            value={locationInput}
                            onChange={(e) => setLocationInput(e.target.value)}
                            className="w-full border-2 border-black p-2 bg-white font-mono text-xs font-bold"
                          >
                            <option value="1">Left Upper Arm</option>
                            <option value="2">Right Upper Arm</option>
                            <option value="3">Left Wrist</option>
                            <option value="4">Right Wrist</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="border-2 border-black px-4 py-2 font-bold text-xs uppercase hover:bg-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBiometric}
                      className="bg-black text-[#ccff00] border-2 border-black px-5 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all disabled:opacity-60"
                    >
                      {isSubmittingBiometric ? 'Writing to Google Fit...' : 'Save to Google Fit'}
                    </button>
                  </div>
                </form>
              )}

              {/* ------------------------------------------------------------ */}
              {/* FORM 2: LOG WORKOUT SESSION                                  */}
              {/* ------------------------------------------------------------ */}
              {modalTab === 'workout' && (
                <form onSubmit={handleSubmitWorkout} className="space-y-4 font-mono">
                  {/* Workout Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Workout Title:
                    </label>
                    <input
                      type="text"
                      required
                      value={workoutTitle}
                      onChange={(e) => setWorkoutTitle(e.target.value)}
                      placeholder="e.g. Morning River Trail Run"
                      className="w-full border-2 border-black p-2.5 text-sm font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-[#ccff00]"
                    />
                  </div>

                  {/* Activity Type Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Activity Type (Google Fit Standard Code):
                    </label>
                    <select
                      value={selectedActivity}
                      onChange={(e) => setSelectedActivity(parseInt(e.target.value, 10))}
                      className="w-full border-2 border-black p-2.5 text-sm font-bold bg-white font-mono"
                    >
                      {ACTIVITY_OPTIONS.map((act) => (
                        <option key={act.code} value={act.code}>
                          {act.name} [{act.category}] — Code {act.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Duration in Minutes with Quick Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-zinc-700">
                        Duration (Minutes):
                      </label>
                      <span className="text-xs font-black text-black">
                        {workoutDuration} mins
                      </span>
                    </div>

                    <input
                      type="number"
                      min="1"
                      max="1440"
                      required
                      value={workoutDuration}
                      onChange={(e) => setWorkoutDuration(parseInt(e.target.value || '0', 10))}
                      className="w-full border-2 border-black p-2 text-sm font-bold bg-white"
                    />

                    {/* Quick Selection Chips */}
                    <div className="flex gap-1.5 mt-2">
                      {[15, 30, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setWorkoutDuration(mins)}
                          className={`px-2 py-1 text-xs border border-black font-bold transition-colors ${
                            workoutDuration === mins
                              ? 'bg-[#ccff00] text-black font-black'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Optional Notes */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-zinc-700 mb-1">
                      Optional Notes / Description:
                    </label>
                    <textarea
                      rows={2}
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                      placeholder="Notes on sets, pacing, elevation, or intensity..."
                      className="w-full border-2 border-black p-2 text-xs font-medium bg-white"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="border-2 border-black px-4 py-2 font-bold text-xs uppercase hover:bg-zinc-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingWorkout}
                      className="bg-black text-[#ccff00] border-2 border-black px-5 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] hover:text-black transition-all disabled:opacity-60"
                    >
                      {isSubmittingWorkout ? 'Updating users.sessions...' : 'Write Session to Google Fit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
