'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Activity,
  Footprints,
  Scale,
  HeartPulse,
  Ruler,
  Dumbbell,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Flame,
  Clock,
  Layers,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Lock,
  UserCheck,
  LogOut,
  Mail,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  DailySummaryMetric,
  FitSession,
  GOOGLE_FIT_ACTIVITY_TYPES,
} from '@/lib/google-fit/types';
import { MeasurableTargetsAnalysis } from './MeasurableTargetsAnalysis';
import { LogMetricModal } from './LogMetricModal';

export const GoogleFitDashboard: React.FC = () => {
  const { data: session, status: authStatus } = useSession();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userImage, setUserImage] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [missingActivityScope, setMissingActivityScope] = useState<boolean>(false);

  const [summaries, setSummaries] = useState<DailySummaryMetric[]>([]);
  const [latestMetric, setLatestMetric] = useState<DailySummaryMetric | null>(null);
  const [sessions, setSessions] = useState<FitSession[]>([]);
  const [avgSteps, setAvgSteps] = useState<number>(0);

  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [showTechDocs, setShowTechDocs] = useState<boolean>(false);

  // Check auth and connection status
  const checkStatusAndData = useCallback(async (enableDemo: boolean = false) => {
    setIsRefreshing(true);
    try {
      // 1. Check API Auth Status
      const statusRes = await fetch('/api/google-fit/auth/status');
      let authed = false;
      let email: string | null = null;

      if (statusRes.ok) {
        const sData = await statusRes.json();
        authed = Boolean(sData.connected);
        setIsConnected(authed);
        setIsConfigured(Boolean(sData.isConfigured));
        email = sData.user?.email || null;
        setConnectedEmail(email);
        setUserName(sData.user?.name || null);
        setUserImage(sData.user?.image || null);
      }

      // If user is neither connected nor requested demo, don't load fake numbers
      if (!authed && !enableDemo && !session?.user) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsDemoMode(false);
        return;
      }

      // 2. Fetch Summaries & Sessions
      const demoParam = enableDemo ? '&demo=true' : '';
      const [sumRes, sessRes] = await Promise.all([
        fetch(`/api/google-fit/summary?days=7${demoParam}`),
        fetch(`/api/google-fit/sessions?days=7${demoParam}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummaries(sumData.summaries || []);
        setLatestMetric(sumData.latest || null);
        setIsDemoMode(Boolean(sumData.isSimulated));
        if (sumData.userEmail) setConnectedEmail(sumData.userEmail);
        if (sumData.stats?.avgSteps !== undefined) setAvgSteps(sumData.stats.avgSteps);
        if (sumData.hasActivityScope === false) {
          setMissingActivityScope(true);
        } else {
          setMissingActivityScope(false);
        }
      }

      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSessions(sessData.sessions || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setErrorNotice('Failed to synchronize health metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    checkStatusAndData(isDemoMode);
  }, [checkStatusAndData, isDemoMode]);

  // Handle Google Sign In
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/google-fit' });
  };

  // Direct Google OAuth flow (alternative or scope re-authorization)
  const handleAuthorizeGoogleFit = async () => {
    try {
      const res = await fetch('/api/google-fit/auth/url');
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      }
    } catch (err) {
      console.error('Failed to initiate Google OAuth:', err);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Google Fit telemetry sync?')) return;
    try {
      await fetch('/api/google-fit/auth/disconnect', { method: 'POST' });
      setIsConnected(false);
      setIsDemoMode(false);
      setSummaries([]);
      setLatestMetric(null);
      setSessions([]);
      checkStatusAndData(false);
    } catch (err) {
      console.error('Failed to disconnect Google Fit:', err);
    }
  };

  const userDisplayName = session?.user?.name || userName || 'User';
  const userDisplayEmail = session?.user?.email || connectedEmail;
  const userAvatar = session?.user?.image || userImage;

  // Active metric for the dashboard
  const activeMetric: DailySummaryMetric = latestMetric || {
    date: new Date().toISOString().split('T')[0],
    steps: 0,
    weightKg: null,
    heightMeters: null,
    bloodPressure: null,
    bmi: null,
    activeMinutes: 0,
  };

  const currentSteps = activeMetric.steps || 0;
  const currentWeight = activeMetric.weightKg;
  const currentHeight = activeMetric.heightMeters;
  const currentBP = activeMetric.bloodPressure;

  // --------------------------------------------------------------------------
  // STATE 1: Loading Session
  // --------------------------------------------------------------------------
  if (authStatus === 'loading' || (isLoading && !isDemoMode && !isConnected)) {
    return (
      <div className="bg-white border-4 border-black p-12 text-center shadow-[6px_6px_0px_#000000] font-mono">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-black mb-3" />
        <p className="text-sm font-black uppercase text-black">Verifying Google Account Session...</p>
        <p className="text-xs text-zinc-500 mt-1">Connecting to Google Cloud Fitness API</p>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 2: User is NOT Signed in with Google (Authentication Gate)
  // --------------------------------------------------------------------------
  if (!session?.user && !isConnected && !isDemoMode) {
    return (
      <div className="space-y-6 font-mono">
        {/* Sign In Required Hero Gate */}
        <div className="bg-white border-4 border-black p-6 sm:p-10 shadow-[8px_8px_0px_#000000] text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-black text-[#ccff00] border-2 border-black flex items-center justify-center mx-auto mb-5 shadow-[4px_4px_0px_#000000]">
            <Lock className="w-8 h-8" />
          </div>

          <span className="bg-black text-[#ccff00] text-xs font-black uppercase px-2.5 py-1 tracking-wider">
            User Authentication Required
          </span>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-3">
            Sign In with Google to View Your Health Data
          </h2>

          <p className="text-xs sm:text-sm text-zinc-600 mt-2 max-w-xl mx-auto font-sans leading-relaxed">
            Google Fit health and fitness telemetry is strictly private and tied to your personal Google email account.
            Sign in with your Google account to automatically load and synchronize your real Android phone steps,
            wearable tracker readings, and workout sessions.
          </p>

          {/* Primary Action: Google Sign In or Direct Google Fit Connect */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleAuthorizeGoogleFit}
              className="w-full sm:w-auto px-6 py-3 border-2 border-black bg-[#ccff00] text-black hover:bg-black hover:text-[#ccff00] font-black text-sm uppercase tracking-tight shadow-[4px_4px_0px_#000000] transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Connect Google Fit Directly</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              className="w-full sm:w-auto px-6 py-3 border-2 border-black bg-black text-white hover:bg-zinc-800 font-bold text-sm uppercase tracking-tight shadow-[4px_4px_0px_#000000] transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V13.4h6.887C18.2 16.27 15.65 18.3 12.24 18.3c-3.53 0-6.4-2.87-6.4-6.4s2.87-6.4 6.4-6.4c1.61 0 3.08.59 4.22 1.57l2.4-2.4C17.24 3.01 14.88 2 12.24 2 6.7 2 2.2 6.5 2.2 12s4.5 10 10.04 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.07-1.3-.18-1.945H12.24z" />
              </svg>
              <span>Sign In with Google Account</span>
            </button>

            <button
              onClick={() => {
                setIsDemoMode(true);
                checkStatusAndData(true);
              }}
              className="w-full sm:w-auto px-5 py-3 border-2 border-black bg-zinc-100 hover:bg-zinc-200 text-black font-bold text-xs uppercase shadow-[2px_2px_0px_#000000] transition-colors"
            >
              Explore Sandbox
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-zinc-600 font-sans">
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Personal Data Isolation</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Footprints className="w-4 h-4 text-black shrink-0" />
              <span>Android & WearOS Sync</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Nanosecond Accuracy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STATE 3: Authenticated User Dashboard (Real Account Telemetry)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner: Authenticated User Email & Google Sync Status */}
      <div className="bg-white border-4 border-black p-4 sm:p-5 shadow-[6px_6px_0px_#000000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* User Identity Block */}
        <div className="flex items-start sm:items-center gap-3.5">
          {userAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userAvatar}
              alt={userDisplayName}
              className="w-12 h-12 rounded-full border-2 border-black object-cover shrink-0 shadow-[2px_2px_0px_#000000]"
            />
          ) : (
            <div className="w-12 h-12 bg-black text-[#ccff00] border-2 border-black flex items-center justify-center font-black text-lg shrink-0 shadow-[2px_2px_0px_#000000]">
              {userDisplayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-base text-black uppercase tracking-tight">
                {userDisplayName}
              </span>
              {isConnected ? (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-500 text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Google Fit Synced</span>
                </span>
              ) : isDemoMode ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-500 text-[10px] font-black uppercase px-2 py-0.5">
                  Sandbox Demo Mode
                </span>
              ) : (
                <span className="bg-zinc-100 text-zinc-800 border border-black text-[10px] font-black uppercase px-2 py-0.5">
                  Google Account Linked
                </span>
              )}
            </div>

            {/* Prominent Google Email Display */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-700 font-bold mt-0.5">
              <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Connected Account: </span>
              <span className="text-black bg-[#ccff00] px-1.5 py-0.2 border border-black font-black">
                {userDisplayEmail || 'demo-sandbox@example.com'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            onClick={() => checkStatusAndData(isDemoMode)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-zinc-100 hover:bg-zinc-200 text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] transition-transform active:translate-x-0.5 active:translate-y-0.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
          </button>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] text-black text-xs font-black uppercase shadow-[2px_2px_0px_#000000] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Metric / Session</span>
          </button>

          {!isConnected && !isDemoMode && (
            <button
              onClick={handleAuthorizeGoogleFit}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-black text-[#ccff00] text-xs font-bold uppercase shadow-[2px_2px_0px_#000000] hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Grant Fit Scopes</span>
            </button>
          )}

          {session?.user ? (
            <button
              onClick={() => signOut({ callbackUrl: '/google-fit' })}
              className="flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-zinc-100 hover:bg-rose-100 hover:text-rose-800 text-zinc-700 text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#000000]"
              title="Sign out of this Google Account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          ) : isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 border-2 border-black bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold uppercase transition-colors shadow-[2px_2px_0px_#000000]"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => {
                setIsDemoMode(false);
                checkStatusAndData(false);
              }}
              className="px-3 py-2 border-2 border-black bg-zinc-100 hover:bg-zinc-200 text-xs font-bold uppercase"
            >
              Exit Sandbox
            </button>
          )}
        </div>
      </div>

      {/* Notice if signed in but not connected with Google Fit */}
      {!isConnected && !isDemoMode && (
        <div className="bg-amber-50 border-4 border-amber-600 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[4px_4px_0px_#000000] text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-black uppercase">
                Google Fit Telemetry Permission Required
              </span>
              <p className="text-zinc-700 font-sans mt-0.5">
                Your account ({userDisplayEmail}) is active, but requires read permission for Google Fit activity & body metrics to display your steps, weight, and health telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={handleAuthorizeGoogleFit}
            className="shrink-0 px-4 py-2 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000000] transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Authorize Google Fit Now</span>
          </button>
        </div>
      )}

      {/* Notice if signed in but missing activity read scope */}
      {isConnected && missingActivityScope && (
        <div className="bg-rose-50 border-4 border-rose-600 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[4px_4px_0px_#000000] text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-rose-900 uppercase">
                Google Fit Physical Activity Scope Not Granted
              </span>
              <p className="text-zinc-700 font-sans mt-0.5">
                Your account ({userDisplayEmail}) is linked, but Google Fit step counts were not permitted because the <strong>&quot;See your Google Fit physical activity data&quot;</strong> checkbox was unchecked during sign-in. Click below and check all permission boxes to display your real steps!
              </p>
            </div>
          </div>
          <button
            onClick={handleAuthorizeGoogleFit}
            className="shrink-0 px-4 py-2 border-2 border-black bg-rose-600 text-white hover:bg-black hover:text-[#ccff00] font-black text-xs uppercase shadow-[2px_2px_0px_#000000] transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Grant Activity Permission</span>
          </button>
        </div>
      )}

      {/* Notice if new account with zero data yet */}
      {isConnected && !missingActivityScope && currentSteps === 0 && !currentWeight && (
        <div className="bg-[#ccff00]/20 border-2 border-black p-4 flex items-start gap-3 shadow-[3px_3px_0px_#000000] text-xs">
          <Info className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <span className="font-black text-black uppercase">
              Connected to {userDisplayEmail}: Awaiting Cloud Data Sync
            </span>
            <p className="text-zinc-700 font-sans">
              Your Google Account is securely connected. If you have steps in your Google Fit mobile app:
            </p>
            <ol className="list-decimal list-inside text-zinc-800 font-sans space-y-1 pl-1 font-medium">
              <li>Open the <strong>Google Fit app</strong> on your phone and pull down on the Home screen to sync with Google servers.</li>
              <li>Verify in Google Fit app profile that you are signed into <strong>{userDisplayEmail}</strong>.</li>
              <li>Click <strong>&quot;Sync Now&quot;</strong> above to re-fetch your synced telemetry.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 4 CORE STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* STAT CARD 1: DAILY STEPS */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Daily Movement</span>
              <Footprints className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {currentSteps.toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-zinc-600 mt-0.5">
              Target: 10,000 steps ({Math.min(150, Math.round((currentSteps / 10000) * 100))}%)
            </div>

            {/* Step progress bar */}
            <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden mt-2">
              <div
                className="bg-[#ccff00] h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round((currentSteps / 10000) * 100))}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 flex justify-between font-sans">
            <span>7-Day Avg: {avgSteps.toLocaleString()}</span>
            <span>~{(currentSteps * 0.00078).toFixed(1)} km</span>
          </div>
        </div>

        {/* STAT CARD 2: BODY WEIGHT */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Weight (kg)</span>
              <Scale className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {currentWeight ? (
                <>
                  {currentWeight.toFixed(1)} <span className="text-sm font-bold">kg</span>
                </>
              ) : (
                <span className="text-zinc-400 text-lg">Not Recorded</span>
              )}
            </div>
            <div className="text-[11px] font-bold text-zinc-600 mt-0.5">
              {activeMetric.bmi ? (
                <>
                  BMI: {activeMetric.bmi} &bull;{' '}
                  <span className="text-emerald-700">Optimal Range</span>
                </>
              ) : (
                'Log weight to compute BMI'
              )}
            </div>

            {/* Weight reference bar */}
            <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden mt-2">
              <div
                className="bg-purple-400 h-full transition-all duration-500"
                style={{ width: currentWeight ? '65%' : '0%' }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 flex justify-between font-sans">
            <span>Type: com.google.weight</span>
            <span>{currentWeight ? 'Cloud Synced' : 'Awaiting Entry'}</span>
          </div>
        </div>

        {/* STAT CARD 3: BLOOD PRESSURE */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Blood Pressure</span>
              <HeartPulse className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {currentBP ? (
                <>
                  {currentBP.systolic} / {currentBP.diastolic}{' '}
                  <span className="text-xs font-bold text-zinc-600">mmHg</span>
                </>
              ) : (
                <span className="text-zinc-400 text-lg">Not Recorded</span>
              )}
            </div>
            <div className="text-[11px] font-bold text-emerald-700 mt-0.5 flex items-center gap-1">
              {currentBP ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{currentBP.status}</span>
                </>
              ) : (
                <span className="text-zinc-400">Resting measurement pending</span>
              )}
            </div>

            {/* MAP bar */}
            <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden mt-2">
              <div
                className="bg-[#ccff00] h-full transition-all duration-500"
                style={{ width: currentBP ? '82%' : '0%' }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 flex justify-between font-sans">
            <span>MAP: {currentBP?.meanArterialPressure ? `${currentBP.meanArterialPressure} mmHg` : 'N/A'}</span>
            <span>com.google.blood_pressure</span>
          </div>
        </div>

        {/* STAT CARD 4: HEIGHT */}
        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider">Stature Height</span>
              <Ruler className="w-4 h-4 text-black" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-black">
              {currentHeight ? (
                <>
                  {currentHeight.toFixed(2)} <span className="text-sm font-bold">m</span>
                </>
              ) : (
                <span className="text-zinc-400 text-lg">Not Recorded</span>
              )}
            </div>
            <div className="text-[11px] font-bold text-zinc-600 mt-0.5">
              {currentHeight ? `Equals ${Math.round(currentHeight * 100)} cm` : 'Log height to enable BMI'}
            </div>

            {/* Height bar */}
            <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden mt-2">
              <div
                className="bg-black h-full transition-all duration-500"
                style={{ width: currentHeight ? '75%' : '0%' }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-200 text-[10px] text-zinc-500 flex justify-between font-sans">
            <span>Type: com.google.height</span>
            <span>Anthropometric</span>
          </div>
        </div>

      </div>

      {/* 3 MEASURABLE TARGETS & GOALS ANALYSIS (%) MODULE */}
      <MeasurableTargetsAnalysis currentMetric={activeMetric} />

      {/* RECENT WORKOUT SESSIONS (Google Fit Sessions API) */}
      <div className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0px_#000000]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-black" />
              <h3 className="text-lg font-black uppercase tracking-tight text-black">
                Recent Workout Sessions (Sessions API)
              </h3>
            </div>
            <p className="text-xs text-zinc-600 mt-0.5 font-sans font-medium">
              Synchronized workouts with activity type codes, duration spans, and segment datasets for{' '}
              <span className="font-bold text-black">{userDisplayEmail}</span>.
            </p>
          </div>

          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-black text-[#ccff00] text-xs font-black uppercase hover:bg-[#ccff00] hover:text-black transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Session</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs border-2 border-dashed border-zinc-300">
            No workout sessions logged yet for this period on account {userDisplayEmail}. Click &quot;Add Session&quot; to push one to Google Fit.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const startMs = parseInt(sess.startTimeMillis, 10);
              const endMs = parseInt(sess.endTimeMillis, 10);
              const durationMins = Math.round((endMs - startMs) / (1000 * 60));
              const actMeta = GOOGLE_FIT_ACTIVITY_TYPES[sess.activityType] || {
                name: 'Unknown Activity',
                category: 'General',
              };

              return (
                <div
                  key={sess.id}
                  className="bg-zinc-50 border-2 border-black p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#000000]"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-black text-[#ccff00] flex items-center justify-center border border-black shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-black">{sess.name}</span>
                        <span className="bg-zinc-200 border border-black text-[10px] font-bold uppercase px-1.5 py-0.5 text-zinc-800">
                          {actMeta.name} (Code: {sess.activityType})
                        </span>
                      </div>
                      {sess.description && (
                        <p className="text-xs text-zinc-600 mt-1 font-sans line-clamp-1">
                          {sess.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs shrink-0 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-black">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{durationMins} mins</span>
                    </div>
                    <div className="text-zinc-500 text-[11px]">
                      {new Date(startMs).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TECHNICAL ARCHITECTURE & GOOGLE FIT CONVENTIONS DRAWER */}
      <div className="bg-zinc-900 text-zinc-200 border-4 border-black p-5 shadow-[6px_6px_0px_#000000]">
        <button
          onClick={() => setShowTechDocs(!showTechDocs)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#ccff00]" />
            <span className="font-black text-sm uppercase tracking-wide text-white">
              Google Cloud & Google Fit Architecture Documentation
            </span>
          </div>
          <span className="text-xs text-[#ccff00] font-bold uppercase underline">
            {showTechDocs ? 'Hide Details' : 'View Conventions & Timestamp Guide'}
          </span>
        </button>

        {showTechDocs && (
          <div className="mt-4 pt-4 border-t border-zinc-800 text-xs space-y-4 font-mono">
            {/* 1. Dataset Naming Convention */}
            <div>
              <div className="text-[#ccff00] font-black uppercase mb-1">
                1. Dataset Naming Conventions (raw:com.google... vs derived:...)
              </div>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed">
                Google Fit establishes clean separation between raw sensor feeds and computed aggregate pipelines:
              </p>
              <ul className="mt-2 space-y-1.5 list-disc list-inside text-zinc-300">
                <li>
                  <code className="text-[#ccff00]">raw:com.google...</code>: Unaltered data streams originating
                  from manual input or direct Bluetooth hardware. ID format:{' '}
                  <code className="text-zinc-400">raw:&lt;type&gt;:&lt;package&gt;:&lt;manufacturer&gt;:&lt;model&gt;:&lt;uid&gt;</code>.
                </li>
                <li>
                  <code className="text-[#ccff00]">derived:com.google...</code>: Synthesized streams merged
                  across multiple devices (e.g. phone step counter + wearable smartwatch step counter) deduplicated by Google.
                </li>
              </ul>
            </div>

            {/* 2. Timestamp Precision Guide */}
            <div>
              <div className="text-[#ccff00] font-black uppercase mb-1">
                2. Nanosecond vs Millisecond Timestamps
              </div>
              <p className="text-zinc-400 font-sans text-xs leading-relaxed">
                Preventing floating point truncation across distinct Google Fit API boundaries:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="bg-black/60 p-3 border border-zinc-700">
                  <div className="text-white font-bold mb-1">Nanoseconds (ns) — 10^-9 sec</div>
                  <div className="text-zinc-400 text-[11px]">
                    Required for: DataPoints (<code className="text-[#ccff00]">startTimeNanos</code>,{' '}
                    <code className="text-[#ccff00]">endTimeNanos</code>) and dataset paths (
                    <code className="text-[#ccff00]">&#123;startNs&#125;-&#123;endNs&#125;</code>). Computed safely via{' '}
                    <code className="text-zinc-300">BigInt(millis) * BigInt(1000000)</code>.
                  </div>
                </div>
                <div className="bg-black/60 p-3 border border-zinc-700">
                  <div className="text-white font-bold mb-1">Milliseconds (ms) — 10^-3 sec</div>
                  <div className="text-zinc-400 text-[11px]">
                    Required for: Sessions API (<code className="text-[#ccff00]">startTimeMillis</code>), Aggregations
                    (<code className="text-[#ccff00]">dataset:aggregate</code>), and OAuth token expiration thresholds.
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Environment Variables setup instructions */}
            <div>
              <div className="text-[#ccff00] font-black uppercase mb-1">
                3. Live Google Cloud Platform Setup (.env.local)
              </div>
              <div className="bg-black p-3 border border-zinc-700 text-zinc-300 text-[11px] font-mono overflow-x-auto">
                GOOGLE_CLIENT_ID=&quot;your-oauth-client-id.apps.googleusercontent.com&quot;<br />
                GOOGLE_CLIENT_SECRET=&quot;GOCSPX-your-oauth-secret&quot;<br />
                GOOGLE_FIT_REDIRECT_URI=&quot;http://localhost:3000/api/google-fit/auth/callback&quot;
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Modal */}
      <LogMetricModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => checkStatusAndData(isDemoMode)}
      />
    </div>
  );
};
