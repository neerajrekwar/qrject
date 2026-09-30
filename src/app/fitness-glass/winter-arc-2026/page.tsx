'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Flame,
  Clock,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  ArrowLeft,
  Laptop,
  PenTool,
  Plus,
  Trash2,
  Sparkles,
  Zap,
  Target,
  Compass,
} from 'lucide-react';
import {
  WinterArcChallengeState,
  WinterArc24HrSlot,
  WinterArcDayRecord,
  WinterArcGoalStandard,
  WinterArcViewMode,
  WinterArcPrintStyle,
  WinterArcOrientation,
  WinterArcCategory,
  DEFAULT_WINTER_ARC_24H_SLOTS,
  generateInitial90DayMatrix,
  DEFAULT_WINTER_ARC_STANDARDS,
  calculateWinterArcAdherence,
  calculate90DayProgress,
  computeWinterArcGoalProgress,
  exportWinterArcToPDF,
  exportWinterArcMeasuringSheetPDF,
  renderWinterArcToCanvas,
  exportWinterArcToCSV,
} from '@/lib/winter-arc-engine';
import { WinterArcProgressionChart } from '@/components/winter-arc/WinterArcProgressionChart';
import { WinterArcMeasuringChartPrint } from '@/components/winter-arc/WinterArcMeasuringChartPrint';
import { WinterArcAutomatedProgressGraph } from '@/components/winter-arc/WinterArcAutomatedProgressGraph';
import {
  WinterArcMeasurableGoalsAnalysis,
  GoogleFitTelemetryState,
} from '@/components/winter-arc/WinterArcMeasurableGoalsAnalysis';
import { UsageBanner } from '@/components/auth/UsageBanner';

export type ManagementMode = 'digital_web' | 'print_paper';

const STORAGE_KEY = 'winter_arc_2026_state_v1';

export default function WinterArcPage() {
  // Dual Usage Management Mode
  const [managementMode, setManagementMode] = useState<ManagementMode>('digital_web');

  const [athleteName, setAthleteName] = useState<string>('Neeraj Rekwar');
  const [challengeTitle, setChallengeTitle] = useState<string>(
    'Winter Arc 2026: 24-Hour Protocol & 90-Day Standard'
  );
  const [activeView, setActiveView] = useState<WinterArcViewMode>('24hrs_timetable');
  const [printOrientation, setPrintOrientation] = useState<WinterArcOrientation>('auto');
  const [printStyle, setPrintStyle] = useState<WinterArcPrintStyle>('blank_paper_pen');

  // 24-Hour Slots state (default with zero preset checks)
  const [slots24h, setSlots24h] = useState<WinterArc24HrSlot[]>(DEFAULT_WINTER_ARC_24H_SLOTS);

  // 90-Day Matrix state (all clean, zero completed by default)
  const [dayMatrix, setDayMatrix] = useState<WinterArcDayRecord[]>(() => generateInitial90DayMatrix());

  const [standards, setStandards] = useState<WinterArcGoalStandard[]>(DEFAULT_WINTER_ARC_STANDARDS);

  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // UI state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState<boolean>(false);
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<0 | 1 | 2 | 3>(0); // 0 = all
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false);

  // New slot form state
  const [newSlot, setNewSlot] = useState<Partial<WinterArc24HrSlot>>({
    hourRange: '14:00 - 15:00',
    phaseTitle: 'CUSTOM DISCIPLINE WINDOW',
    category: 'Discipline & Mindset',
    protocol: 'Focused execution of high-priority task without distraction.',
    targetMetric: '60 min sprint',
    disciplineRule: 'Zero notifications active.',
  });

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculations
  const stats24h = calculateWinterArcAdherence(slots24h);
  const stats90 = calculate90DayProgress(dayMatrix);

  // Orientation
  const isLandscape =
    printOrientation === 'landscape' ||
    (printOrientation === 'auto' && (slots24h.length > 12 || activeView === '90days_matrix'));

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Google Fit Cloud Telemetry Integration
  const [googleFitData, setGoogleFitData] = useState<GoogleFitTelemetryState>({
    isConnected: false,
    userEmail: null,
    userName: null,
    todaySteps: 0,
    avgSteps: 0,
    totalSteps: 0,
    latestWeight: null,
    latestHeight: null,
    activeMinutes: 0,
    isLoading: true,
  });

  const fetchGoogleFitTelemetry = useCallback(async () => {
    try {
      setGoogleFitData((prev) => ({ ...prev, isLoading: true }));
      const [statusRes, sumRes] = await Promise.all([
        fetch('/api/google-fit/auth/status'),
        fetch('/api/google-fit/summary?days=7'),
      ]);

      let isConnected = false;
      let userEmail: string | null = null;
      let userName: string | null = null;

      if (statusRes.ok) {
        const sData = await statusRes.json();
        isConnected = Boolean(sData.connected);
        userEmail = sData.user?.email || null;
        userName = sData.user?.name || null;
      }

      let todaySteps = 0;
      let avgSteps = 0;
      let totalSteps = 0;
      let latestWeight: number | null = null;
      let latestHeight: number | null = null;
      let activeMinutes = 0;
      let isApiDisabled = false;
      let apiActivationUrl: string | null = null;

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.userEmail) userEmail = sumData.userEmail;
        if (sumData.userName) userName = sumData.userName;
        isApiDisabled = Boolean(sumData.isApiDisabled);
        apiActivationUrl = sumData.apiActivationUrl || null;
        avgSteps = sumData.stats?.avgSteps || 0;
        totalSteps = sumData.stats?.totalSteps || 0;
        todaySteps = sumData.latest?.steps || 0;
        latestWeight = sumData.latest?.weightKg || null;
        latestHeight = sumData.latest?.heightMeters || null;
        activeMinutes = sumData.latest?.activeMinutes || 0;
      }

      setGoogleFitData({
        isConnected,
        userEmail,
        userName,
        todaySteps,
        avgSteps,
        totalSteps,
        latestWeight,
        latestHeight,
        activeMinutes,
        isApiDisabled,
        apiActivationUrl,
        isLoading: false,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (err) {
      console.warn('Error fetching Google Fit data for Winter Arc:', err);
      setGoogleFitData((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    fetchGoogleFitTelemetry();
  }, [fetchGoogleFitTelemetry]);

  // Restore persisted state from localStorage on client mount (prevents SSR hydration mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: Partial<WinterArcChallengeState> = JSON.parse(saved);
        if (data.athleteName) setAthleteName(data.athleteName);
        if (data.challengeTitle) setChallengeTitle(data.challengeTitle);
        if (data.activeView) setActiveView(data.activeView);
        if (data.printOrientation) setPrintOrientation(data.printOrientation);
        if (data.printStyle) setPrintStyle(data.printStyle);
        if (Array.isArray(data.slots24h) && data.slots24h.length > 0) setSlots24h(data.slots24h);
        if (Array.isArray(data.dayMatrix) && data.dayMatrix.length > 0) setDayMatrix(data.dayMatrix);
        if (Array.isArray(data.standards) && data.standards.length > 0) setStandards(data.standards);
      }
    } catch (e) {
      console.warn('Failed to load Winter Arc state from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist to localStorage only AFTER initial hydration load completes
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      const payload: WinterArcChallengeState = {
        athleteName,
        challengeTitle,
        year: 2026,
        startDate: '2026-10-01',
        endDate: '2026-12-31',
        currentDay: 1,
        activeView,
        printOrientation,
        printStyle,
        slots24h,
        dayMatrix,
        standards,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [
    isLoaded,
    athleteName,
    challengeTitle,
    activeView,
    printOrientation,
    printStyle,
    slots24h,
    dayMatrix,
    standards,
  ]);

  // Handlers for 24-Hour Slots
  const handleToggleSlot = (id: string) => {
    setSlots24h((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleDeleteSlot = (id: string) => {
    setSlots24h((prev) => prev.filter((s) => s.id !== id));
    showToast('Removed 24h slot');
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlot.hourRange || !newSlot.phaseTitle) return;
    const created: WinterArc24HrSlot = {
      id: `wa-slot-${Date.now()}`,
      hourRange: newSlot.hourRange,
      phaseTitle: newSlot.phaseTitle,
      category: (newSlot.category as WinterArcCategory) || 'Deep Work',
      protocol: newSlot.protocol || 'Unbroken execution',
      targetMetric: newSlot.targetMetric || 'Standard Met',
      disciplineRule: newSlot.disciplineRule || 'No exceptions.',
      completed: false,
    };
    setSlots24h((prev) => [...prev, created]);
    setShowAddSlotModal(false);
    showToast(`Added slot: ${created.hourRange}`);
  };

  // Handlers for 90-Day Matrix
  const handleToggleDay = (dayNum: number) => {
    setDayMatrix((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== dayNum) return d;
        const nextCompleted = !d.completed;
        return {
          ...d,
          completed: nextCompleted,
          scorePercent: nextCompleted ? Math.max(85, stats24h.percent || 85) : 0,
        };
      })
    );
  };

  // 1-Click Clear All Checks (Clean Slate)
  const handleClearAllChecks = () => {
    setSlots24h((prev) => prev.map((s) => ({ ...s, completed: false })));
    setDayMatrix((prev) =>
      prev.map((d) => ({ ...d, completed: false, scorePercent: 0, hoursCompliant: 0 }))
    );
    showToast('Clean Slate: All 24h & 90-Day checkmarks wiped clean');
  };

  // Load 80% passing demo day / week
  const handleLoadDemoPass = () => {
    // Check first 13 of 16 slots (approx 81%)
    setSlots24h((prev) =>
      prev.map((s, idx) => ({
        ...s,
        completed: idx < 13,
      }))
    );
    // Mark first 14 days of Phase 1 completed
    setDayMatrix((prev) =>
      prev.map((d) => {
        if (d.dayNumber <= 14) {
          return { ...d, completed: true, scorePercent: 88 };
        }
        return d;
      })
    );
    showToast('Loaded demo passing protocol (13/16 slots, Day 1-14 passing)');
  };

  // Populate realistic 90-Day athlete progression across Phase 1, Phase 2, and Phase 3
  const handleLoadSampleTrajectory = () => {
    setDayMatrix((prev) =>
      prev.map((d) => {
        let score = 0;
        // Phase 1 (1-30): Foundation adaptation (fluctuating 72% - 88%)
        if (d.phase === 1) {
          score = Math.min(100, Math.round(72 + d.dayNumber * 0.45 + (d.dayNumber % 4) * 2.5));
        } else if (d.phase === 2) {
          // Phase 2 (31-60): The Crucible (84% - 93%)
          const p2Day = d.dayNumber - 30;
          score = Math.min(100, Math.round(84 + p2Day * 0.25 + (d.dayNumber % 3) * 2));
        } else {
          // Phase 3 (61-90): Ascendance (90% - 100%)
          const p3Day = d.dayNumber - 60;
          score = Math.min(100, Math.round(90 + p3Day * 0.3 + (d.dayNumber % 2) * 2));
        }
        return {
          ...d,
          scorePercent: score,
          completed: score >= 80,
          hoursCompliant: Math.round((score / 100) * slots24h.length),
        };
      })
    );
    showToast('Loaded 90-Day progression trajectory across Phase 1, 2, and 3');
  };

  // Reset 90-Day matrix to 0% clean slate
  const handleClearMatrix = () => {
    setDayMatrix((prev) =>
      prev.map((d) => ({
        ...d,
        completed: false,
        scorePercent: 0,
        hoursCompliant: 0,
      }))
    );
    showToast('Reset 90-Day Matrix to 0% clean slate');
  };

  // Update specific day score
  const handleUpdateDayScore = (dayNumber: number, score: number) => {
    setDayMatrix((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== dayNumber) return d;
        const clamped = Math.max(0, Math.min(100, Math.round(score)));
        return {
          ...d,
          scorePercent: clamped,
          completed: clamped >= 80,
          hoursCompliant: Math.round((clamped / 100) * slots24h.length),
        };
      })
    );
  };

  // Mark all 24h active slots done
  const handleMarkAll24hDone = () => {
    setSlots24h((prev) => prev.map((s) => ({ ...s, completed: true })));
    showToast('Marked all 24h slots completed (100%)');
  };

  // Sync today's 24h score into current day of 90-day challenge
  const handleSyncTodayToMatrix = (targetDayNum: number) => {
    setDayMatrix((prev) =>
      prev.map((d) => {
        if (d.dayNumber !== targetDayNum) return d;
        return {
          ...d,
          completed: stats24h.isPassing80,
          scorePercent: stats24h.percent,
          hoursCompliant: stats24h.completed,
        };
      })
    );
    showToast(`Logged Day ${targetDayNum} with ${stats24h.percent}% score (${stats24h.isPassing80 ? 'PASSED 80%' : 'BELOW 80%'})`);
  };

  // Goal & Target Handlers
  const handleUpdateGoalCurrent = (goalId: string, delta: number) => {
    setStandards((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        if (g.currentNum !== undefined) {
          const nextVal = Math.round((g.currentNum + delta) * 10) / 10;
          const updated = {
            ...g,
            currentNum: Math.max(0, nextVal),
            currentStatus: `${Math.max(0, nextVal)} ${g.unit || ''}`,
          };
          updated.percentAccomplished = computeWinterArcGoalProgress(updated);
          return updated;
        }
        return g;
      })
    );
  };

  const handleSetGoalCurrent = (goalId: string, value: number) => {
    setStandards((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const clamped = Math.max(0, value);
        const updated = {
          ...g,
          currentNum: clamped,
          currentStatus: `${clamped.toLocaleString()} ${g.unit || ''}`,
        };
        updated.percentAccomplished = computeWinterArcGoalProgress(updated);
        return updated;
      })
    );
    showToast(`Updated target log to ${value.toLocaleString()}`);
  };

  const handleApplyGoogleFitToGoals = () => {
    if (!googleFitData) return;
    const { todaySteps, latestWeight } = googleFitData;

    setStandards((prev) =>
      prev.map((g) => {
        // 1. Step Goal
        if (g.unit === 'steps' || g.name.toLowerCase().includes('step')) {
          if (todaySteps > 0) {
            const updated = {
              ...g,
              currentNum: todaySteps,
              currentStatus: `${todaySteps.toLocaleString()} Steps`,
            };
            updated.percentAccomplished = computeWinterArcGoalProgress(updated);
            return updated;
          }
        }

        // 2. Weight Goal
        if (latestWeight && (g.unit === 'kg' || g.name.toLowerCase().includes('weight'))) {
          const updated = {
            ...g,
            currentNum: latestWeight,
            currentStatus: `${latestWeight} kg`,
          };
          updated.percentAccomplished = computeWinterArcGoalProgress(updated);
          return updated;
        }

        return g;
      })
    );

    showToast(
      todaySteps > 0
        ? `Aligned Google Fit live steps (${todaySteps.toLocaleString()} steps) to Measurable Goals Matrix`
        : 'Google Fit synced (awaiting mobile device step sync)'
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    setStandards((prev) => prev.filter((g) => g.id !== goalId));
    showToast('Removed measurable target standard');
  };

  const handleAddGoal = (newGoal: WinterArcGoalStandard) => {
    setStandards((prev) => [...prev, newGoal]);
    showToast(`Added target standard: "${newGoal.name}"`);
  };

  const handleResetGoals = () => {
    setStandards(DEFAULT_WINTER_ARC_STANDARDS);
    showToast('Reset targets to core standards');
  };

  // Current dataset bundle
  const currentStateBundle: WinterArcChallengeState = {
    athleteName,
    challengeTitle,
    year: 2026,
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    currentDay: 1,
    activeView,
    printOrientation,
    printStyle,
    slots24h,
    dayMatrix,
    standards,
  };

  // Export handlers
  const handleExportPDF = async (overrideStyle?: WinterArcPrintStyle) => {
    setIsExporting(true);
    try {
      const dataToExport = overrideStyle
        ? { ...currentStateBundle, printStyle: overrideStyle }
        : currentStateBundle;
      const blob = await exportWinterArcToPDF(dataToExport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const tag = (overrideStyle || printStyle) === 'blank_paper_pen' ? 'BLANK_PEN' : 'DIGITAL';
      const viewTag = activeView === '90days_matrix' ? '90DAYS_MATRIX' : '24HOURS_PROTOCOL';
      a.download = `Winter_Arc_2026_${viewTag}_${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'}_${tag}_A4.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'} A4 PDF`);
    } catch (e) {
      console.error(e);
      showToast('PDF Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMeasuringSheetPDF = async () => {
    setIsExporting(true);
    try {
      const blob = await exportWinterArcMeasuringSheetPDF(currentStateBundle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Winter_Arc_2026_MEASURING_SHEET_${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'}_A4.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported Attached Measuring Sheet A4 PDF');
    } catch (e) {
      console.error(e);
      showToast('Measuring Sheet PDF Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = hiddenCanvasRef.current || document.createElement('canvas');
      const blob = await renderWinterArcToCanvas(canvas, currentStateBundle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Winter_Arc_2026_300DPI_${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded 300 DPI high-res PNG');
    } catch (e) {
      console.error(e);
      showToast('PNG Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    exportWinterArcToCSV(currentStateBundle);
    showToast('Exported CSV with 24h schedule & 90-day matrix');
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  // Filter 90 days if phase selected
  const filteredDays =
    selectedPhaseFilter === 0
      ? dayMatrix
      : dayMatrix.filter((d) => d.phase === selectedPhaseFilter);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black flex flex-col print:bg-white print:p-0">
      
      {/* Dynamic @page CSS rule for browser print orientation */}
      <style jsx global>{`
        @media print {
          @page {
            size: ${isLandscape ? 'landscape' : 'portrait'};
            margin: 8mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          .print-attached-measuring-page {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* 1. TOP NAVIGATION HEADER (Hidden on Print) */}
      <header className="sticky top-0 z-50 w-full bg-[#f5f5f0] border-b-2 border-black print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/fitness-glass"
              className="flex items-center justify-center w-12 h-12 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] transition-colors font-mono font-black text-xl"
              title="Return to Fitness Glass Master"
            >
              <Flame className="w-6 h-6 text-black" />
            </Link>
            <div>
              <div className="font-mono text-xs font-black tracking-widest text-black flex items-center gap-1.5">
                <span>WINTER ARC 2026</span>
                <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block animate-pulse" />
                <span className="text-[10px] bg-black text-[#ccff00] px-1.5 py-0.2">90 DAYS / 24 HRS</span>
              </div>
              <div className="font-mono text-[10px] text-zinc-600 tracking-wider">
                DUAL SYSTEM · DIGITAL ON WEB &amp; PRINT PAPER (BLACK BALL PEN)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span
                className={`border-2 border-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000] ${
                  stats24h.isPassing80 ? 'bg-[#ccff00] text-black' : 'bg-white text-zinc-800'
                }`}
              >
                {stats24h.isPassing80 ? '24H: 80% MET (PASS)' : `24H: NEED +${stats24h.tasksNeeded} SLOTS`}
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                90-DAY: {stats90.completedDays}/90 ({stats90.percent90}%)
              </span>
            </div>

            <Link
              href="/fitness-glass"
              className="flex items-center gap-1.5 border-2 border-black bg-white hover:bg-black hover:text-white px-3.5 py-2 font-mono text-xs font-black shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>MAIN GLASS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hidden canvas for high-DPI A4 PNG generation */}
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* 2. MAIN APPLICATION WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 print:p-0 print:m-0 print:max-w-none">
        
        {/* Banner Section */}
        <div className="space-y-3 print:hidden">
          <div className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 shadow-[3px_3px_0px_#000000]">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black animate-pulse" />
            <span className="font-mono text-xs font-black tracking-widest text-black uppercase">
              {'// CHALLENGE PROTOCOL: 24-HOUR PRECISION TIMETABLE & 90-DAY STANDARD CHALLENGE'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-black flex items-center gap-3">
                <span>WINTER ARC 2026</span>
                <span className="text-2xl sm:text-3xl bg-black text-[#ccff00] px-2.5 py-1 font-mono">
                  90 DAYS
                </span>
              </h1>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800 mt-1">
                24-HOUR NON-NEGOTIABLE PROTOCOL &amp; 80% ESTIMATE PASS STANDARD
              </h2>
            </div>

            {/* Quick Export Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrintBrowser}
                className="px-3.5 py-2 border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title={`Print directly to A4 paper (${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'})`}
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>PRINT A4 PAPER ({isLandscape ? 'HORIZ' : 'VERT'})</span>
              </button>

              <button
                onClick={() => handleExportPDF()}
                disabled={isExporting}
                className="px-3.5 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title={`Download A4 PDF (${isLandscape ? 'LANDSCAPE' : 'PORTRAIT'})`}
              >
                <FileText className="w-4 h-4 text-black" />
                <span>PDF ({isLandscape ? 'HORIZ' : 'VERT'})</span>
              </button>

              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="px-3 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Download 300 DPI high-density PNG file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG (300 DPI)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Download CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DUAL WORKFLOW MANAGEMENT BAR: DIGITAL WEB vs. PRINT PAPER (BALL PEN)     */}
        {/* ========================================================================= */}
        <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_#000000] space-y-4 print:hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-black text-[#ccff00] px-2 py-0.5">
                  DUAL WORKFLOW ARCHITECTURE
                </span>
                <span className="font-mono text-xs font-black text-zinc-600">
                  CHOOSE YOUR OPERATION MODE:
                </span>
              </div>
              <p className="font-mono text-[11px] text-zinc-700 mt-1">
                Manage the Winter Arc <strong>digitally on the web</strong> with interactive checkmarks and live 80% pass calculations, or print <strong>clean A4 paper sheets</strong> with hollow boxes to check off with a <strong>black ballpoint pen</strong>!
              </p>
            </div>

            {/* Clear All Checks Button to ensure no preset checks remain */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllChecks}
                className="px-3 py-1.5 border-2 border-black bg-rose-50 hover:bg-rose-100 text-rose-900 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title="Wipe all checkmarks clean: zero preset checks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CLEAR ALL CHECKS (CLEAN SLATE)</span>
              </button>

              <button
                onClick={handleLoadDemoPass}
                className="px-2.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 text-black font-mono text-[11px] font-bold shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Load example 80% passing protocol"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>DEMO 80% PASS</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode 1 Tab: Digital On Web */}
            <button
              onClick={() => setManagementMode('digital_web')}
              className={`p-4 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                managementMode === 'digital_web'
                  ? 'bg-black text-white shadow-[4px_4px_0px_#ccff00]'
                  : 'bg-[#fafaf8] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-black text-sm uppercase">
                  <Laptop className={`w-4 h-4 ${managementMode === 'digital_web' ? 'text-[#ccff00]' : 'text-black'}`} />
                  <span>1. DIGITAL ON WEB (INTERACTIVE LIVE TRACKER)</span>
                </span>
                {managementMode === 'digital_web' && (
                  <span className="bg-[#ccff00] text-black text-[10px] font-black px-2 py-0.5 border border-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className={`text-xs mt-2 leading-relaxed ${
                managementMode === 'digital_web' ? 'text-zinc-300' : 'text-zinc-600'
              }`}>
                Interactive ticking on screen · Live 24-hour hour adherence recalculation · Real-time 80% pass/fail badges · 90-day phase advancement.
              </p>
            </button>

            {/* Mode 2 Tab: Print Paper (Black Ball Pen) */}
            <button
              onClick={() => setManagementMode('print_paper')}
              className={`p-4 border-2 border-black text-left font-mono transition-all cursor-pointer ${
                managementMode === 'print_paper'
                  ? 'bg-[#ccff00] text-black shadow-[4px_4px_0px_#000000]'
                  : 'bg-[#fafaf8] text-black hover:bg-white shadow-[2px_2px_0px_#000000]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-black text-sm uppercase">
                  <PenTool className="w-4 h-4 text-black" />
                  <span>2. PRINT PAPER (FOR BLACK BALL PEN)</span>
                </span>
                {managementMode === 'print_paper' && (
                  <span className="bg-black text-[#ccff00] text-[10px] font-black px-2 py-0.5 border border-black">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-800 mt-2 leading-relaxed">
                ISO A4 Paper Ready · Clean empty 5×5mm square boxes for manual black ballpoint pen ticking · Verification score lines &amp; signature blocks.
              </p>
            </button>
          </div>

        </div>

        {/* AUTH & QUOTA BANNER + MONETIZATION FEATURE FLAG (PRINT HIDDEN) */}
        <div className="print:hidden">
          <UsageBanner />
        </div>

        {/* VIEW NAVIGATION & PRINT CONFIGURATION BAR */}
        <div className="border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000000] space-y-3 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-black uppercase text-zinc-500 mr-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-black" />
                <span>VIEW:</span>
              </span>

              <button
                onClick={() => setActiveView('24hrs_timetable')}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeView === '24hrs_timetable'
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>24-HOUR PROTOCOL ({slots24h.length} SLOTS)</span>
              </button>

              <button
                onClick={() => setActiveView('90days_matrix')}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeView === '90days_matrix'
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>90-DAY PROGRESSION MATRIX (DAYS 1-90)</span>
              </button>

              <button
                onClick={() => setActiveView('phases_milestones')}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeView === 'phases_milestones'
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>STANDARDS &amp; PHASES</span>
              </button>

              <button
                onClick={() => setActiveView('measuring_report')}
                className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase flex items-center gap-1.5 ${
                  activeView === 'measuring_report'
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>MEASURING REPORT (PRINT LAST PAGE)</span>
              </button>
            </div>

            {/* Print Orientation Selector */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-zinc-500 font-bold uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-black" />
                <span>A4 ORIENTATION:</span>
              </span>

              {[
                { id: 'auto', label: 'AUTO (>12 HORIZ / <=11 VERT)' },
                { id: 'landscape', label: 'HORIZONTAL (LANDSCAPE)' },
                { id: 'portrait', label: 'VERTICAL (PORTRAIT)' },
              ].map((opt) => {
                const isSelected = printOrientation === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setPrintOrientation(opt.id as WinterArcOrientation)}
                    className={`px-2.5 py-1 border border-black font-bold uppercase transition-all cursor-pointer text-[10px] ${
                      isSelected ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orientation & Style Options Strip */}
          <div className="border border-black bg-[#fafaf8] p-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
              <span className="font-black text-black">
                ACTIVE PRINT MODE: {isLandscape ? 'LANDSCAPE / HORIZONTAL (297×210mm)' : 'PORTRAIT / VERTICAL (210×297mm)'}
              </span>
              <span className="text-zinc-500 text-[11px]">
                {slots24h.length > 12
                  ? `[Auto-selected Landscape because 24h slots (${slots24h.length}) > 12]`
                  : `[Portrait format active]`}
              </span>
            </div>

            {/* Paper Print Checkmark Style Switcher */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600 text-[11px]">PRINT STYLE:</span>
              <button
                onClick={() => setPrintStyle('blank_paper_pen')}
                className={`px-2 py-0.5 border border-black font-black text-[10px] uppercase cursor-pointer ${
                  printStyle === 'blank_paper_pen'
                    ? 'bg-black text-[#ccff00]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
                title="Generates clean, hollow boxes for manual black ballpoint pen ticking"
              >
                BLANK BOXES (FOR BLACK BALL PEN)
              </button>
              <button
                onClick={() => setPrintStyle('with_digital_checks')}
                className={`px-2 py-0.5 border border-black font-black text-[10px] uppercase cursor-pointer ${
                  printStyle === 'with_digital_checks'
                    ? 'bg-black text-[#ccff00]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
                title="Prints the current digital checkmarks logged on the web"
              >
                WITH DIGITAL CHECKS
              </button>

              <button
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                className="border border-black bg-white hover:bg-zinc-100 px-2 py-0.5 font-bold text-black flex items-center gap-1 cursor-pointer text-[11px] ml-2"
              >
                <span>{isEditingInfo ? 'Save Info' : 'Edit Info'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* EDIT ATHLETE INFO (When toggled) */}
        {isEditingInfo && (
          <div className="border-2 border-black bg-[#fafaf8] p-4 shadow-[4px_4px_0px_#000000] grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="block font-black text-black mb-1">ATHLETE NAME</label>
              <input
                type="text"
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>
            <div>
              <label className="block font-black text-black mb-1">CHALLENGE PROTOCOL TITLE</label>
              <input
                type="text"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SPECIFIC VIEW: PRINT PAPER (FOR BLACK BALL PEN) PREPARATION STUDIO CARD   */}
        {/* ========================================================================= */}
        {managementMode === 'print_paper' && (
          <div className="border-4 border-black bg-white p-5 shadow-[6px_6px_0px_#000000] space-y-4 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 border-2 border-black bg-[#ccff00] text-black flex items-center justify-center font-mono font-black text-base shadow-[2px_2px_0px_#000000]">
                  <PenTool className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-mono text-base font-black text-black uppercase tracking-tight">
                    PHYSICAL PRINT PAPER STUDIO // CALIBRATED FOR BLACK BALL PEN
                  </h3>
                  <div className="font-mono text-xs text-zinc-600 font-bold">
                    PRINT ON ISO A4 PAPER · HOLLOWED BOXES DESIGNED FOR MANUAL BLACK BALLPOINT PEN TICKING
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={handlePrintBrowser}
                  className="px-4 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4 text-black" />
                  <span>PRINT TO A4 PAPER NOW</span>
                </button>
                <button
                  onClick={() => handleExportPDF('blank_paper_pen')}
                  className="px-3 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-black" />
                  <span>BLANK PEN PDF</span>
                </button>
              </div>
            </div>

            {/* Pen Guide Callout */}
            <div className="border-2 border-black bg-[#fafaf8] p-3 font-mono text-xs grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <span className="font-black text-black text-sm">🖊️</span>
                <div>
                  <div className="font-black text-black">BLACK BALL PEN MANDATE</div>
                  <div className="text-[11px] text-zinc-600">Tick [✓] or mark [X] in the 5×5mm square boxes with a black ballpoint pen strictly upon slot execution.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-black text-sm">📐</span>
                <div>
                  <div className="font-black text-black">80% ESTIMATE BENCHMARK</div>
                  <div className="text-[11px] text-zinc-600">Minimum {stats24h.minRequired80} of {stats24h.total} slots must be checked daily to maintain the 80% passing standard.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-black text-sm">📄</span>
                <div>
                  <div className="font-black text-black">A4 SMART ORIENTATION</div>
                  <div className="text-[11px] text-zinc-600">
                    {slots24h.length > 12 ? 'Landscape format (>12 slots)' : 'Portrait format (<=11 slots)'} automatically selected.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EXECUTIVE 80% ADHERENCE & ANALYTICS SCORECARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          
          {/* Card 1: 24-Hour 80% Adherence Benchmark */}
          <div className={`border-2 border-black p-4 shadow-[4px_4px_0px_#000000] space-y-2 ${
            stats24h.isPassing80 ? 'bg-[#f4fde8]' : 'bg-[#fff5f5]'
          }`}>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase">
              <span className="text-black">24H 80% PASS REQUIREMENT</span>
              {stats24h.isPassing80 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-3xl sm:text-4xl font-black ${
                stats24h.isPassing80 ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {stats24h.completed}/{stats24h.total}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-600">
                ({stats24h.percent}%)
              </span>
            </div>

            {/* Progress bar with 80% marker */}
            <div className="relative w-full bg-zinc-200 h-3 border border-black overflow-hidden">
              <div
                className={`h-full border-r border-black transition-all duration-300 ${
                  stats24h.isPassing80 ? 'bg-[#ccff00]' : 'bg-black'
                }`}
                style={{ width: `${Math.min(100, stats24h.percent)}%` }}
              />
              <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-red-600 z-10" title="80% Standard Line" />
            </div>

            <div className="font-mono text-[11px] font-bold text-zinc-700 flex items-center justify-between">
              <span>MIN REQUIRED (80%): <strong>{stats24h.minRequired80} SLOTS</strong></span>
              <span className={stats24h.isPassing80 ? 'text-emerald-800' : 'text-rose-700'}>
                {stats24h.isPassing80 ? 'PASS [MET]' : `NEED +${stats24h.tasksNeeded}`}
              </span>
            </div>
          </div>

          {/* Card 2: 90-Day Challenge Master Streak */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>90-DAY CHALLENGE PROGRESS</span>
              <Calendar className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-black">
                {stats90.completedDays}/90
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500">
                ({stats90.percent90}%)
              </span>
            </div>
            <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden">
              <div className="bg-[#ccff00] h-full border-r border-black transition-all duration-300" style={{ width: `${stats90.percent90}%` }} />
            </div>
            <div className="font-mono text-[10px] text-zinc-600 flex justify-between">
              <span>P1: {stats90.phase1.done}/30</span>
              <span>P2: {stats90.phase2.done}/30</span>
              <span>P3: {stats90.phase3.done}/30</span>
            </div>
          </div>

          {/* Card 3: Phase & Milestones Breakdown */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>ACTIVE PHASE FOCUS</span>
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-mono text-lg font-black text-black uppercase">
              {stats90.completedDays <= 30
                ? 'PHASE 1: THE FOUNDATION (DAYS 1-30)'
                : stats90.completedDays <= 60
                ? 'PHASE 2: THE CRUCIBLE (DAYS 31-60)'
                : 'PHASE 3: ASCENDANCE (DAYS 61-90)'}
            </div>
            <div className="font-mono text-xs text-zinc-600 font-bold">
              October 01 – December 31, 2026
            </div>
            <div className="w-full bg-[#ccff00] border border-black px-2 py-0.5 font-mono text-[10px] font-black text-black">
              NON-NEGOTIABLE WINTER DISCIPLINE
            </div>
          </div>

          {/* Card 4: Quick Action Sync */}
          <div className="border-2 border-black bg-[#fafaf8] p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-zinc-600">
              <span>QUICK ACTION</span>
              <Zap className="w-4 h-4 text-black" />
            </div>
            <div className="font-mono text-[11px] text-zinc-800 font-bold leading-tight">
              {stats24h.isPassing80
                ? 'Today is passing (>=80%)! Sync today\'s score into the 90-day matrix.'
                : `Need ${stats24h.tasksNeeded} more slots to reach 80% passing threshold.`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSyncTodayToMatrix(stats90.completedDays + 1)}
                className="flex-1 py-1.5 border border-black bg-black text-[#ccff00] font-mono text-[11px] font-black uppercase hover:bg-[#ccff00] hover:text-black transition-colors cursor-pointer"
              >
                Sync To Day {stats90.completedDays + 1}
              </button>
              <button
                onClick={handleMarkAll24hDone}
                className="px-2 py-1.5 border border-black bg-white hover:bg-zinc-100 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                title="Mark all 24h slots completed"
              >
                100%
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: 24-HOUR PROTOCOL TIMETABLE (PHYSICAL & DIGITAL CHECKLIST)        */}
        {/* ========================================================================= */}
        {activeView === '24hrs_timetable' && (
          <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-black">
            
            {/* Table Header Controls */}
            <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm">
                  24H
                </div>
                <div>
                  <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                    24-HOUR PRECISION PROTOCOL TIMETABLE (16 OPERATIONAL WINDOWS)
                  </h3>
                  <div className="font-mono text-[11px] text-zinc-600 font-bold">
                    {managementMode === 'digital_web'
                      ? `DIGITAL TRACKING: CLICK SQUARES TO COMPLETE SLOTS (80% MINIMUM: ${stats24h.minRequired80}/${stats24h.total} SLOTS)`
                      : `PRINT PAPER MODE: HOLLOW BOXES READY FOR PHYSICAL BLACK BALLPOINT PEN TICKING`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  onClick={() => setShowAddSlotModal(true)}
                  className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Slot</span>
                </button>
              </div>
            </div>

            {/* 24-Hour Slots Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b-2 border-black bg-[#f0f0eb] text-black font-black uppercase text-[11px]">
                    <th className="p-3 w-16 text-center border-r border-black">STATUS</th>
                    <th className="p-3 w-36 sm:w-44 border-r border-black">TIME WINDOW</th>
                    <th className="p-3 w-64 border-r border-black">PHASE TITLE &amp; CATEGORY</th>
                    <th className="p-3 border-r border-black">EXACT PROTOCOL &amp; ROUTINE</th>
                    <th className="p-3 w-36 border-r border-black">TARGET METRIC</th>
                    <th className="p-3 w-64 border-r border-black">DISCIPLINE RULE</th>
                    <th className="p-3 w-14 text-center print:hidden">DEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-black">
                  {slots24h.map((slot) => (
                    <tr
                      key={slot.id}
                      className={`hover:bg-[#fafaf8] transition-colors ${
                        slot.completed ? 'bg-[#fcfdfa]' : 'bg-white'
                      }`}
                    >
                      {/* Checkbox square */}
                      <td className="p-3 text-center border-r border-black">
                        <button
                          onClick={() => handleToggleSlot(slot.id)}
                          className="cursor-pointer inline-flex items-center justify-center p-0.5 hover:scale-110 transition-transform"
                          title={slot.completed ? 'Mark uncompleted' : 'Mark completed'}
                        >
                          {slot.completed ? (
                            <div className="w-5 h-5 border-2 border-black bg-[#ccff00] flex items-center justify-center font-black text-black text-xs">
                              ✓
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-black bg-white hover:bg-zinc-100" />
                          )}
                        </button>
                      </td>

                      {/* Time Window */}
                      <td className="p-3 font-bold border-r border-black text-black">
                        <div className="text-xs">{slot.hourRange}</div>
                      </td>

                      {/* Phase Title & Category */}
                      <td className="p-3 border-r border-black">
                        <div className="font-black text-black text-[13px]">{slot.phaseTitle}</div>
                        <div className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                          {slot.category}
                        </div>
                      </td>

                      {/* Exact Protocol & Routine */}
                      <td className="p-3 border-r border-black text-zinc-800 font-medium">
                        {slot.protocol}
                      </td>

                      {/* Target Metric */}
                      <td className="p-3 border-r border-black font-bold text-emerald-800">
                        <span className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 inline-block">
                          {slot.targetMetric}
                        </span>
                      </td>

                      {/* Discipline Rule */}
                      <td className="p-3 border-r border-black text-zinc-600 italic">
                        {slot.disciplineRule}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Print Signature & Verification Block for Paper Use */}
            <div className="border-t-2 border-black bg-[#fafaf8] p-4 font-mono text-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-black text-black text-sm uppercase flex items-center gap-1.5">
                    <span>DAILY EXECUTION ATTESTATION // WINTER ARC PROTOCOL</span>
                  </div>
                  <div className="text-zinc-600 text-[11px]">
                    Ball Pen Rule: Mark each box with a black ballpoint pen immediately after completing the routine window.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 font-bold text-black text-[11px]">
                  <div>
                    DAILY SCORE: <span className="border-b-2 border-black px-4 inline-block">{stats24h.completed} / {stats24h.total} SLOTS</span>
                  </div>
                  <div>
                    80% STATUS:{' '}
                    <span className="border-b-2 border-black px-3 inline-block">
                      {stats24h.isPassing80 ? '[✓] PASSED (>= 80%)' : '[ ] INCOMPLETE (< 80%)'}
                    </span>
                  </div>
                  <div>
                    ATHLETE SIGNATURE: <span className="border-b-2 border-black px-8 inline-block" />
                  </div>
                </div>
              </div>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: 90-DAY CHALLENGE PROGRESSION MATRIX (DAYS 1 TO 90)              */}
        {/* ========================================================================= */}
        {activeView === '90days_matrix' && (
          <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] p-5 space-y-5 print:shadow-none print:border-black print:p-2">
            
            {/* Header with Phase Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm">
                    90D
                  </div>
                  <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                    90-DAY PROGRESSION MATRIX (DAYS 01 – 90)
                  </h3>
                </div>
                <p className="font-mono text-[11px] text-zinc-600 mt-1">
                  Each day is an irreversible milestone. Tick with a black ball pen on paper or click digitally on web when daily adherence reaches $\ge 80\%$.
                </p>
              </div>

              {/* Phase Filters */}
              <div className="flex items-center gap-1.5 font-mono text-xs print:hidden">
                <button
                  onClick={() => setSelectedPhaseFilter(0)}
                  className={`px-2.5 py-1 border border-black font-bold uppercase cursor-pointer ${
                    selectedPhaseFilter === 0 ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  ALL 90 DAYS
                </button>
                <button
                  onClick={() => setSelectedPhaseFilter(1)}
                  className={`px-2.5 py-1 border border-black font-bold uppercase cursor-pointer ${
                    selectedPhaseFilter === 1 ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  PHASE 1 (1-30)
                </button>
                <button
                  onClick={() => setSelectedPhaseFilter(2)}
                  className={`px-2.5 py-1 border border-black font-bold uppercase cursor-pointer ${
                    selectedPhaseFilter === 2 ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  PHASE 2 (31-60)
                </button>
                <button
                  onClick={() => setSelectedPhaseFilter(3)}
                  className={`px-2.5 py-1 border border-black font-bold uppercase cursor-pointer ${
                    selectedPhaseFilter === 3 ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
                  }`}
                >
                  PHASE 3 (61-90)
                </button>
              </div>
            </div>

            {/* INTEGRATED RECHARTS VISUALIZATION: 90-DAY PROGRESSION LINE CHART ACROSS ALL THREE PHASES */}
            <WinterArcProgressionChart
              dayMatrix={dayMatrix}
              activePhaseFilter={selectedPhaseFilter}
              onUpdateDayScore={handleUpdateDayScore}
              onLoadSampleTrajectory={handleLoadSampleTrajectory}
              onClearMatrix={handleClearMatrix}
              current24hPercent={stats24h.percent}
            />

            {/* 90-Day Interactive Matrix Grid (10 columns x 9 rows) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between font-mono text-xs border-b border-black pb-1">
                <span className="font-black uppercase text-black flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-black" />
                  <span>90-DAY COMPLIANCE MATRIX // CLICK ANY BOX TO TOGGLE DIGITAL TICK (80% THRESHOLD)</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">
                  P1: DAYS 1-30 · P2: DAYS 31-60 · P3: DAYS 61-90
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 font-mono">
              {filteredDays.map((day) => {
                const isPassed = day.completed || day.scorePercent >= 80;
                return (
                  <div
                    key={day.dayNumber}
                    onClick={() => handleToggleDay(day.dayNumber)}
                    className={`border-2 border-black p-2.5 flex flex-col justify-between transition-all cursor-pointer ${
                      isPassed
                        ? 'bg-[#ccff00] text-black shadow-[2px_2px_0px_#000000]'
                        : day.phase === 1
                        ? 'bg-white hover:bg-zinc-50'
                        : day.phase === 2
                        ? 'bg-[#fafaf8] hover:bg-zinc-100'
                        : 'bg-[#f4f4f0] hover:bg-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-black">
                      <span>DAY {day.dayNumber.toString().padStart(2, '0')}</span>
                      <span className="text-[9px] px-1 bg-black text-white font-bold">
                        P{day.phase}
                      </span>
                    </div>

                    <div className="my-2 flex items-center justify-center">
                      <div
                        className={`w-6 h-6 border-2 border-black flex items-center justify-center text-xs font-black ${
                          isPassed ? 'bg-black text-[#ccff00]' : 'bg-white'
                        }`}
                      >
                        {isPassed ? '✓' : ''}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-zinc-600 font-bold">
                      <span>{day.scorePercent > 0 ? `${day.scorePercent}%` : 'Score: ___%'}</span>
                      <span>{isPassed ? 'PASS' : 'PENDING'}</span>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* Phase Milestones Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-2 border-black font-mono">
              <div className="border-2 border-black bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs">PHASE 1: THE FOUNDATION</span>
                  <span className="text-xs font-bold text-zinc-600">DAYS 01 - 30</span>
                </div>
                <div className="text-[11px] text-zinc-600">
                  Total sleep schedule lockdown, zero snoozing, eliminate refined sugars, establish morning hydration protocol.
                </div>
                <div className="text-xs font-black text-emerald-800">
                  Status: {stats90.phase1.done}/30 Days Completed ({stats90.phase1.pct}%)
                </div>
              </div>

              <div className="border-2 border-black bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs">PHASE 2: THE CRUCIBLE</span>
                  <span className="text-xs font-bold text-zinc-600">DAYS 31 - 60</span>
                </div>
                <div className="text-[11px] text-zinc-600">
                  Peak cognitive deep work sprint (5h daily), daily Zone 2 cardio, 10,000 steps, cold thermal adaptation.
                </div>
                <div className="text-xs font-black text-emerald-800">
                  Status: {stats90.phase2.done}/30 Days Completed ({stats90.phase2.pct}%)
                </div>
              </div>

              <div className="border-2 border-black bg-white p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs">PHASE 3: ASCENDANCE</span>
                  <span className="text-xs font-bold text-zinc-600">DAYS 61 - 90</span>
                </div>
                <div className="text-[11px] text-zinc-600">
                  Peak athletic transformation, full system mastery, relentless discipline, preparation for 2027 dominance.
                </div>
                <div className="text-xs font-black text-emerald-800">
                  Status: {stats90.phase3.done}/30 Days Completed ({stats90.phase3.pct}%)
                </div>
              </div>
            </div>

          </section>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: CORE WINTER ARC STANDARDS & GOAL METRICS                          */}
        {/* ========================================================================= */}
        {activeView === 'phases_milestones' && (
          <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] p-5 space-y-4 print:shadow-none print:border-black">
            <div className="border-b-2 border-black pb-3">
              <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                4 CORE WINTER ARC PHYSICAL &amp; COGNITIVE PILLARS
              </h3>
              <p className="font-mono text-[11px] text-zinc-600 mt-0.5">
                Measurable targets locked for the 90-day winter timeframe (October 01 – December 31, 2026).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              {standards.map((std) => (
                <div key={std.id} className="border-2 border-black bg-[#fafaf8] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-black">{std.name}</span>
                    <span className="text-[10px] bg-black text-[#ccff00] px-2 py-0.5 font-bold uppercase">
                      {std.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-zinc-500 font-bold block">STARTING BASELINE</span>
                      <span className="font-black text-black">{std.startingBaseline}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 font-bold block">TARGET STANDARD</span>
                      <span className="font-black text-emerald-800">{std.targetStandard}</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-zinc-600 mb-1">
                      <span>CURRENT STATUS: {std.currentStatus}</span>
                      <span>{std.percentAccomplished}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
                      <div
                        className="bg-[#ccff00] h-full border-r border-black transition-all"
                        style={{ width: `${std.percentAccomplished}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* AUTOMATED ACTIVITY PROGRESS GRAPH (TILL LAST DAY)                         */}
        {/* Rendered in both Base Digital and Print Paper at the last section         */}
        {/* ========================================================================= */}
        <div className="pt-2 print:pt-0">
          <WinterArcAutomatedProgressGraph
            dayMatrix={dayMatrix}
            slots24h={slots24h}
            printStyle={printStyle}
            onUpdateDayScore={handleUpdateDayScore}
            onToggleDay={handleToggleDay}
            onClearMatrix={handleClearMatrix}
            onLoadSampleTrajectory={handleLoadSampleTrajectory}
            onLoadDemoPass={handleLoadDemoPass}
          />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 03: MEASURABLE TARGETS & GOALS ANALYSIS (%)                       */}
        {/* Rendered in both Base Digital and Print Paper at the last section         */}
        {/* ========================================================================= */}
        <div className="pt-2 print:pt-0">
          <WinterArcMeasurableGoalsAnalysis
            standards={standards}
            printStyle={printStyle}
            googleFitData={googleFitData}
            onRefreshGoogleFit={fetchGoogleFitTelemetry}
            onApplyGoogleFitToGoals={handleApplyGoogleFitToGoals}
            onUpdateGoalCurrent={handleUpdateGoalCurrent}
            onSetGoalCurrent={handleSetGoalCurrent}
            onDeleteGoal={handleDeleteGoal}
            onAddGoal={handleAddGoal}
            onResetGoals={handleResetGoals}
          />
        </div>

        {/* ========================================================================= */}
        {/* ATTACHED MEASURING SHEET PAGE (PRINT PAPER LAST ATTACHED PAGE)            */}
        {/* ========================================================================= */}
        {(managementMode === 'print_paper' || activeView === 'measuring_report') && (
          <div className="pt-4 print:pt-0">
            <WinterArcMeasuringChartPrint
              athleteName={athleteName}
              challengeTitle={challengeTitle}
              dayMatrix={dayMatrix}
              printStyle={printStyle}
              standards={standards}
              isStandalone={false}
            />
          </div>
        )}

      </main>

      {/* 4. MODAL: ADD CUSTOM 24-HOUR SLOT */}
      {showAddSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 w-full max-w-lg shadow-[8px_8px_0px_#000000] font-mono space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-black text-base text-black uppercase">
                ADD 24-HOUR PROTOCOL SLOT
              </h3>
              <button
                onClick={() => setShowAddSlotModal(false)}
                className="font-black text-sm px-2 py-0.5 border border-black hover:bg-black hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-black mb-1">HOUR WINDOW (e.g. 14:00 - 15:00)</label>
                <input
                  type="text"
                  required
                  value={newSlot.hourRange || ''}
                  onChange={(e) => setNewSlot({ ...newSlot, hourRange: e.target.value })}
                  className="w-full p-2 border-2 border-black"
                />
              </div>

              <div>
                <label className="block font-black mb-1">PHASE TITLE</label>
                <input
                  type="text"
                  required
                  value={newSlot.phaseTitle || ''}
                  onChange={(e) => setNewSlot({ ...newSlot, phaseTitle: e.target.value })}
                  className="w-full p-2 border-2 border-black"
                />
              </div>

              <div>
                <label className="block font-black mb-1">CATEGORY</label>
                <select
                  value={newSlot.category || 'Deep Work'}
                  onChange={(e) => setNewSlot({ ...newSlot, category: e.target.value as WinterArcCategory })}
                  className="w-full p-2 border-2 border-black bg-white"
                >
                  <option value="Morning Routine">Morning Routine</option>
                  <option value="Physical Training">Physical Training</option>
                  <option value="Deep Work">Deep Work</option>
                  <option value="Nutrition & Fuel">Nutrition & Fuel</option>
                  <option value="Recovery & Sleep">Recovery & Sleep</option>
                  <option value="Discipline & Mindset">Discipline & Mindset</option>
                </select>
              </div>

              <div>
                <label className="block font-black mb-1">PROTOCOL DETAILS</label>
                <textarea
                  rows={2}
                  value={newSlot.protocol || ''}
                  onChange={(e) => setNewSlot({ ...newSlot, protocol: e.target.value })}
                  className="w-full p-2 border-2 border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black mb-1">TARGET METRIC</label>
                  <input
                    type="text"
                    value={newSlot.targetMetric || ''}
                    onChange={(e) => setNewSlot({ ...newSlot, targetMetric: e.target.value })}
                    className="w-full p-2 border-2 border-black"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">DISCIPLINE RULE</label>
                  <input
                    type="text"
                    value={newSlot.disciplineRule || ''}
                    onChange={(e) => setNewSlot({ ...newSlot, disciplineRule: e.target.value })}
                    className="w-full p-2 border-2 border-black"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setShowAddSlotModal(false)}
                  className="px-4 py-2 border-2 border-black font-bold hover:bg-zinc-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 border-2 border-black bg-[#ccff00] font-black hover:bg-black hover:text-[#ccff00] cursor-pointer"
                >
                  Save Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-[#ccff00] border-2 border-[#ccff00] px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 5. FOOTER */}
      <footer className="w-full border-t-2 border-black bg-white mt-8 py-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="font-black">WINTER ARC 2026 PROTOCOL</span>
            <span className="text-zinc-500">· 24-HOUR / 90-DAY STANDARD CHALLENGE</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-600">
            <Link href="/fitness-glass" className="hover:text-black hover:underline font-bold">
              Fitness Glass Master
            </Link>
            <Link href="/barcode-pick" className="hover:text-black hover:underline font-bold">
              Barcode Engine
            </Link>
            <Link href="/" className="hover:text-black hover:underline font-bold">
              QR Studio
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
