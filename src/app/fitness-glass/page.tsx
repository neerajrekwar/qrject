'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Trash2,
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  RotateCcw,
  ArrowLeft,
  TrendingUp,
  Activity,
  Edit2,
  Check,
  Barcode as BarcodeIcon,
  CheckCircle2,
  AlertTriangle,
  Compass,
  PenTool,
  Laptop,
  Sparkles,
} from 'lucide-react';
import {
  FitnessCadence,
  FitnessGoal,
  TimetableBlock,
  FitnessGlassData,
  PrintOrientationMode,
  PrintCheckStyle,
  DayProgressRecord,
  DAYS_OF_WEEK,
  INITIAL_TIMETABLE,
  SAMPLE_FILLED_TIMETABLE,
  INITIAL_GOALS,
  determinePrintOrientation,
  compute80Adherence,
  computeGoalProgress,
  computeAggregateProgress,
  exportFitnessToCSV,
  exportFitnessToA4_PDF,
  renderFitnessA4ToCanvas,
} from '@/lib/fitness-glass-engine';

export type ManagementMode = 'digital_web' | 'print_paper';

const STORAGE_KEY = 'fitness_glass_protocol_v8_dual_clean';

function getSavedProtocol(): Partial<FitnessGlassData> | null {
  if (typeof window === 'undefined') return null;
  try {
    // Purge older preset keys that had preset checks
    localStorage.removeItem('fitness_glass_protocol_v5');
    localStorage.removeItem('fitness_glass_protocol_v4');
    localStorage.removeItem('fitness_glass_protocol_v3');
    
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function FitnessGlassPage() {
  // Dual Usage Management Mode:
  // 1. 'digital_web': Interactive clicking on web, live % calculations, real-time dynamic graph
  // 2. 'print_paper': Physical A4 printable layout with clean empty boxes for manual black ball pen ticking
  const [managementMode, setManagementMode] = useState<ManagementMode>('digital_web');

  const [cadence, setCadence] = useState<FitnessCadence>(() => {
    const saved = getSavedProtocol();
    return saved?.cadence || 'daily';
  });

  const [userName, setUserName] = useState<string>(() => {
    const saved = getSavedProtocol();
    return saved?.userName || 'Neeraj Rekwar';
  });

  const [planTitle, setPlanTitle] = useState<string>(() => {
    const saved = getSavedProtocol();
    return saved?.planTitle || 'High-Performance 80% Adherence Protocol';
  });

  // Default timetable: completely clean with ZERO preset checks (all completed: false, all dayChecks: [false...])
  const [timetable, setTimetable] = useState<Record<FitnessCadence, TimetableBlock[]>>(() => {
    const saved = getSavedProtocol();
    return saved?.timetable || INITIAL_TIMETABLE;
  });

  const [goals, setGoals] = useState<FitnessGoal[]>(() => {
    const saved = getSavedProtocol();
    return saved?.goals || INITIAL_GOALS;
  });

  const [orientationMode, setOrientationMode] = useState<PrintOrientationMode>(() => {
    const saved = getSavedProtocol();
    return saved?.orientationMode || 'auto';
  });

  // For paper print: default is blank_paper_pen (clean empty square boxes for black ball pen)
  const [printCheckStyle, setPrintCheckStyle] = useState<PrintCheckStyle>(() => {
    const saved = getSavedProtocol();
    return saved?.printCheckStyle || 'blank_paper_pen';
  });

  // Modal states
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Form states
  const [newGoal, setNewGoal] = useState<Partial<FitnessGoal>>({
    title: '',
    category: 'Strength',
    cadence: 'quarterly',
    baseline: 0,
    current: 0,
    target: 100,
    unit: 'kg',
    notes: '',
  });

  const [newBlock, setNewBlock] = useState<Partial<TimetableBlock>>({
    timeOrDay: '',
    title: '',
    activity: '',
    focus: '',
    targetMetric: '',
  });

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Current activities count & auto orientation calculation
  const currentTimetableBlocks = timetable[cadence] || [];
  const activityCount = currentTimetableBlocks.length;
  const activeOrientation = determinePrintOrientation(activityCount, orientationMode);
  const isLandscape = activeOrientation === 'landscape';

  // DYNAMIC 7-DAY PROGRESS GRAPH:
  // Automatically computed directly from the current daily activities checks across Mon-Sun!
  // When user ticks boxes in digital mode, each day on the graph immediately updates its % and compares to 80% line.
  const dynamicDayHistory: DayProgressRecord[] = useMemo(() => {
    const blocks = timetable[cadence] || [];
    const totalCount = Math.max(1, blocks.length);

    return DAYS_OF_WEEK.map((day, i) => {
      const completedCount = blocks.filter((b) => b.dayChecks && b.dayChecks[i]).length;
      const percentage = Math.round((completedCount / totalCount) * 100);
      return {
        dayLabel: `DAY 0${i + 1} (${day})`,
        dateStr: `Day 0${i + 1}`,
        completedCount,
        totalCount,
        percentage,
      };
    });
  }, [timetable, cadence]);

  // Save to localStorage on changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const payload: FitnessGlassData = {
        cadence,
        userName,
        planTitle,
        startDate: '2026-01-01',
        targetDate: '2026-12-31',
        timetable,
        goals,
        orientationMode,
        printCheckStyle,
        dayHistory: dynamicDayHistory,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [cadence, userName, planTitle, timetable, goals, orientationMode, printCheckStyle, dynamicDayHistory]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // 80% Adherence calculations for Master Completed status
  const completedBlocksCount = currentTimetableBlocks.filter((b) => b.completed).length;
  const adherence = compute80Adherence(activityCount, completedBlocksCount);

  // Toggle master block completion
  const handleToggleBlock = (blockId: string) => {
    setTimetable((prev) => {
      const currentList = prev[cadence] || [];
      const updated = currentList.map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      );
      return { ...prev, [cadence]: updated };
    });
  };

  // Toggle specific day check in the 7-day grid (Mon-Sun)
  const handleToggleDayCheck = (blockId: string, dayIndex: number) => {
    setTimetable((prev) => {
      const currentList = prev[cadence] || [];
      const updated = currentList.map((b) => {
        if (b.id !== blockId) return b;
        const currentChecks = [...(b.dayChecks || [false, false, false, false, false, false, false])];
        currentChecks[dayIndex] = !currentChecks[dayIndex];
        return {
          ...b,
          dayChecks: currentChecks,
        };
      });
      return { ...prev, [cadence]: updated };
    });
  };

  // 1-Click Clear All Checks -> Fresh Blank Slate (Zero Preset Checks)
  const handleClearAllChecks = () => {
    setTimetable((prev) => {
      const resetAll: Record<FitnessCadence, TimetableBlock[]> = {
        daily: (prev.daily || []).map((b) => ({ ...b, completed: false, dayChecks: [false, false, false, false, false, false, false] })),
        weekly: (prev.weekly || []).map((b) => ({ ...b, completed: false, dayChecks: [false, false, false, false, false, false, false] })),
        monthly: (prev.monthly || []).map((b) => ({ ...b, completed: false, dayChecks: [false, false, false, false, false, false, false] })),
        quarterly: (prev.quarterly || []).map((b) => ({ ...b, completed: false, dayChecks: [false, false, false, false, false, false, false] })),
        yearly: (prev.yearly || []).map((b) => ({ ...b, completed: false, dayChecks: [false, false, false, false, false, false, false] })),
      };
      return resetAll;
    });

    showToast('Clean Slate: All checkmarks cleared (ready for fresh tracking or paper print)');
  };

  // Mark all active blocks as completed for quick testing
  const handleMarkAllActive = () => {
    setTimetable((prev) => {
      const currentList = prev[cadence] || [];
      const updated = currentList.map((b) => ({
        ...b,
        completed: true,
        dayChecks: [true, true, true, true, true, true, true],
      }));
      return { ...prev, [cadence]: updated };
    });
    showToast(`Marked all ${cadence.toUpperCase()} activities completed`);
  };

  // Load sample demo 80% passing week
  const handleLoadDemoWeek = () => {
    setTimetable(SAMPLE_FILLED_TIMETABLE);
    showToast('Loaded sample 80% demo week (8/10 tasks passing)');
  };

  // Quick logging of current goal metric
  const handleUpdateGoalCurrent = (goalId: string, delta: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const newCurrent = Math.round((g.current + delta) * 10) / 10;
        return { ...g, current: Math.max(0, newCurrent) };
      })
    );
  };

  // Delete goal
  const handleDeleteGoal = (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    showToast('Removed goal target');
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    setTimetable((prev) => ({
      ...prev,
      [cadence]: (prev[cadence] || []).filter((b) => b.id !== blockId),
    }));
    showToast('Removed routine block');
  };

  // Add goal submission
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return;
    const created: FitnessGoal = {
      id: `g-${Date.now()}`,
      title: newGoal.title,
      category: newGoal.category || 'Strength',
      cadence: newGoal.cadence || cadence,
      baseline: Number(newGoal.baseline) || 0,
      current: Number(newGoal.current) || 0,
      target: Number(newGoal.target) || 100,
      unit: newGoal.unit || 'units',
      notes: newGoal.notes || '',
    };
    setGoals((prev) => [...prev, created]);
    setShowGoalModal(false);
    setNewGoal({
      title: '',
      category: 'Strength',
      cadence,
      baseline: 0,
      current: 0,
      target: 100,
      unit: 'kg',
      notes: '',
    });
    showToast(`Added target: "${created.title}"`);
  };

  // Add block submission
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.title || !newBlock.timeOrDay) return;
    const created: TimetableBlock = {
      id: `b-${Date.now()}`,
      timeOrDay: newBlock.timeOrDay,
      title: newBlock.title,
      activity: newBlock.activity || 'Standard Routine',
      focus: newBlock.focus || 'Consistency',
      targetMetric: newBlock.targetMetric || 'Completed',
      completed: false,
      dayChecks: [false, false, false, false, false, false, false],
    };
    setTimetable((prev) => ({
      ...prev,
      [cadence]: [...(prev[cadence] || []), created],
    }));
    setShowBlockModal(false);
    setNewBlock({
      timeOrDay: '',
      title: '',
      activity: '',
      focus: '',
      targetMetric: '',
    });
    showToast(`Added block to ${cadence.toUpperCase()} timetable`);
  };

  // Export handlers
  const currentDataset: FitnessGlassData = {
    cadence,
    userName,
    planTitle,
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    timetable,
    goals,
    orientationMode,
    printCheckStyle,
    dayHistory: dynamicDayHistory,
  };

  const handleExportPDF = async (overrideStyle?: PrintCheckStyle) => {
    setIsExporting(true);
    try {
      const dataToExport = overrideStyle
        ? { ...currentDataset, printCheckStyle: overrideStyle }
        : currentDataset;
      const blob = await exportFitnessToA4_PDF(dataToExport);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const styleTag = (overrideStyle || printCheckStyle) === 'blank_paper_pen' ? 'BLANK_PEN' : 'DIGITAL';
      a.download = `Fitness_Glass_${cadence.toUpperCase()}_${activeOrientation.toUpperCase()}_${styleTag}_A4.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${activeOrientation.toUpperCase()} A4 PDF (${styleTag})`);
    } catch (err) {
      console.error(err);
      showToast('PDF Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const canvas = hiddenCanvasRef.current || document.createElement('canvas');
      const blob = await renderFitnessA4ToCanvas(canvas, currentDataset);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fitness_Glass_${cadence.toUpperCase()}_${activeOrientation.toUpperCase()}_300DPI.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded 300 DPI ${activeOrientation.toUpperCase()} PNG`);
    } catch (err) {
      console.error(err);
      showToast('PNG Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    exportFitnessToCSV(currentDataset);
    showToast('Exported CSV with checklist grid & 80% stats');
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  // Filter goals
  const activeCadenceGoals = goals.filter((g) => g.cadence === cadence || cadence === 'yearly');
  const displayGoals = activeCadenceGoals.length > 0 ? activeCadenceGoals : goals;
  const overallGoalsProgress = computeAggregateProgress(displayGoals);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black flex flex-col print:bg-white print:p-0">
      
      {/* Dynamic @page CSS rule for browser print orientation based on user rule:
          > 12 activities => landscape, <= 11 activities => portrait */}
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
        }
      `}</style>

      {/* 1. TOP NAVIGATION HEADER (Hidden on Print) */}
      <header className="sticky top-0 z-50 w-full bg-[#f5f5f0] border-b-2 border-black print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-12 h-12 border-2 border-black bg-white shadow-[3px_3px_0px_#000000] hover:bg-[#ccff00] transition-colors font-mono font-black text-xl"
              title="Return to Home"
            >
              <Activity className="w-6 h-6 text-black" />
            </Link>
            <div>
              <div className="font-mono text-xs font-black tracking-widest text-black flex items-center gap-1.5">
                <span>FITNESS GLASS</span>
                <span className="w-1.5 h-1.5 bg-[#ccff00] border border-black inline-block" />
              </div>
              <div className="font-mono text-[10px] text-zinc-600 tracking-wider">
                DUAL SYSTEM · DIGITAL ON WEB &amp; PRINT PAPER (BLACK BALL PEN)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span className={`border-2 border-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000] ${
                adherence.isPassing80 ? 'bg-[#ccff00] text-black' : 'bg-white text-zinc-800'
              }`}>
                {adherence.isPassing80 ? '80% MET (PASS)' : `NEED +${adherence.tasksNeeded} FOR 80%`}
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                {isLandscape ? 'A4 HORIZONTAL (LANDSCAPE)' : 'A4 VERTICAL (PORTRAIT)'}
              </span>
            </div>

            <Link
              href="/fitness-glass/winter-arc-2026"
              className="flex items-center gap-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] px-3 py-2 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
            >
              <span>🔥 WINTER ARC 2026 (90D / 24H)</span>
            </Link>

            <Link
              href="/barcode-pick"
              className="hidden lg:flex items-center gap-1.5 border-2 border-black bg-white hover:bg-zinc-100 px-3 py-2 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
            >
              <BarcodeIcon className="w-3.5 h-3.5" />
              <span>BARCODES</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 border-2 border-black bg-white hover:bg-black hover:text-white px-3.5 py-2 font-mono text-xs font-black shadow-[3px_3px_0px_#000000] transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>QR STUDIO</span>
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
              {'// SYSTEM ENGINE: DIGITAL WEB TRACKING + MANUAL BLACK BALL PEN PRINT PAPER'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-black">
                FITNESS GLASS
              </h1>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800">
                CHECKLIST GRID &amp; 80% ESTIMATE PROTOCOL
              </h2>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrintBrowser}
                className="px-3.5 py-2 border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title={`Print directly to A4 paper (${activeOrientation.toUpperCase()} mode)`}
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>PRINT A4 PAPER ({isLandscape ? 'HORIZONTAL' : 'VERTICAL'})</span>
              </button>

              <button
                onClick={() => handleExportPDF()}
                disabled={isExporting}
                className="px-3.5 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title={`Download A4 PDF (${activeOrientation.toUpperCase()})`}
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
        {/* DUAL USE-CASE MANAGEMENT BAR: DIGITAL ON WEB vs. PRINT PAPER (BALL PEN) */}
        {/* ========================================================================= */}
        <div className="border-4 border-black bg-white p-4 shadow-[6px_6px_0px_#000000] space-y-4 print:hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black bg-black text-[#ccff00] px-2 py-0.5">
                  DUAL MANAGEMENT ARCHITECTURE
                </span>
                <span className="font-mono text-xs font-black text-zinc-600">
                  CHOOSE YOUR OPERATIONAL WORKFLOW:
                </span>
              </div>
              <p className="font-mono text-[11px] text-zinc-700 mt-1">
                You can manage activities <strong>digitally on the web</strong> with dynamic clicks and live % graphs, or export <strong>clean A4 print paper</strong> with empty boxes to tick manually with a <strong>black ballpoint pen</strong>!
              </p>
            </div>

            {/* Clear All Checks Button to ensure no preset checks remain */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllChecks}
                className="px-3 py-1.5 border-2 border-black bg-rose-50 hover:bg-rose-100 text-rose-900 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title="Wipe all checkboxes clean: start with zero preset checks"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>CLEAR ALL CHECKS (CLEAN SLATE)</span>
              </button>

              <button
                onClick={handleLoadDemoWeek}
                className="px-2.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 text-black font-mono text-[11px] font-bold shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Load example 80% passing week demo"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>DEMO 80% WEEK</span>
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
                  <span>1. DIGITAL ON WEB (LIVE TRACKER)</span>
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
                Interactive clicking on web · Live % progress · Real-time 80% adherence benchmark · Dynamic 7-day progress graph till last day.
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
                ISO A4 Paper Ready · Clean empty boxes for manual black ballpoint pen ticking · Manual daily score lines · Auto-landscape (&gt;12) or portrait (&lt;=11).
              </p>
            </button>
          </div>

          {/* Special Winter Arc 2026 Callout Banner */}
          <div className="border-2 border-black bg-[#fafaf8] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔥</span>
              <div>
                <div className="font-black text-xs text-black uppercase">
                  NEW: WINTER ARC 2026 CHALLENGE (90 DAYS / 24-HOUR PRECISION PROTOCOL)
                </div>
                <div className="text-[11px] text-zinc-600">
                  Full 24-hour hour-by-hour non-negotiable routine + 90-Day milestone matrix + printable A4 black ball pen sheets.
                </div>
              </div>
            </div>
            <Link
              href="/fitness-glass/winter-arc-2026"
              className="px-3.5 py-1.5 border-2 border-black bg-black text-[#ccff00] hover:bg-[#ccff00] hover:text-black font-black text-xs shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer text-center whitespace-nowrap"
            >
              LAUNCH WINTER ARC 2026 →
            </Link>
          </div>

        </div>

        {/* CADENCE & SMART ORIENTATION SELECTOR BAR */}
        <div className="border-2 border-black bg-white p-3 shadow-[4px_4px_0px_#000000] space-y-3 print:hidden">
          
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Cadence Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-black uppercase text-zinc-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-black" />
                <span>CADENCE:</span>
              </span>

              {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as FitnessCadence[]).map((tab) => {
                const isActive = cadence === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setCadence(tab)}
                    className={`px-3 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase ${
                      isActive
                        ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                        : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {/* Smart Orientation Override Selector */}
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-zinc-500 font-bold uppercase flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-black" />
                <span>A4 PRINT ORIENTATION:</span>
              </span>

              {[
                { id: 'auto', label: 'AUTO (>12 HORIZ / <=11 VERT)' },
                { id: 'landscape', label: 'HORIZONTAL (LANDSCAPE)' },
                { id: 'portrait', label: 'VERTICAL (PORTRAIT)' },
              ].map((opt) => {
                const isSelected = orientationMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setOrientationMode(opt.id as PrintOrientationMode)}
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
                ACTIVE PRINT MODE: {activeOrientation.toUpperCase()} ({isLandscape ? '297×210mm' : '210×297mm'})
              </span>
              <span className="text-zinc-500 text-[11px]">
                {activityCount > 12
                  ? `[Auto-selected Horizontal/Landscape because ${activityCount} activities > 12]`
                  : `[Auto-selected Vertical/Portrait because ${activityCount} activities <= 11]`}
              </span>
            </div>

            {/* Paper Print Checkmark Style Switcher */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-600 text-[11px]">PRINT GRID STYLE:</span>
              <button
                onClick={() => setPrintCheckStyle('blank_paper_pen')}
                className={`px-2 py-0.5 border border-black font-black text-[10px] uppercase cursor-pointer ${
                  printCheckStyle === 'blank_paper_pen'
                    ? 'bg-black text-[#ccff00]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
                title="Generates clean, hollow boxes for manual black ballpoint pen ticking"
              >
                BLANK BOXES (FOR BLACK BALL PEN)
              </button>
              <button
                onClick={() => setPrintCheckStyle('with_digital_checks')}
                className={`px-2 py-0.5 border border-black font-black text-[10px] uppercase cursor-pointer ${
                  printCheckStyle === 'with_digital_checks'
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
                <Edit2 className="w-3 h-3" />
                <span>{isEditingInfo ? 'Save Meta' : 'Edit Meta'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* EDIT PLAN META STRIP (Shown when toggled) */}
        {isEditingInfo && (
          <div className="border-2 border-black bg-[#fafaf8] p-4 shadow-[4px_4px_0px_#000000] grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="block font-black text-black mb-1">ATHLETE NAME</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-2 border-2 border-black bg-white font-bold"
              />
            </div>
            <div>
              <label className="block font-black text-black mb-1">PLAN / PROTOCOL TITLE</label>
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
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
                    PRINT ON ISO A4 PAPER · ALL BOXES ARE HOLLOWED FOR PHYSICAL BLACK BALLPOINT PEN TICKING
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
                  <div className="font-black text-black">BLACK BALL PEN RULE</div>
                  <div className="text-[11px] text-zinc-600">Use a standard black ballpoint pen to tick [✓] or mark [X] in the 5×5mm square boxes.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-black text-sm">📐</span>
                <div>
                  <div className="font-black text-black">80% ESTIMATE BENCHMARK</div>
                  <div className="text-[11px] text-zinc-600">Minimum {adherence.minRequired80} of {adherence.totalTasks} tasks must be ticked daily to achieve 80% passing status.</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-black text-black text-sm">📄</span>
                <div>
                  <div className="font-black text-black">SMART ORIENTATION</div>
                  <div className="text-[11px] text-zinc-600">
                    {activityCount > 12 ? 'Landscape format (>12 activities)' : 'Portrait format (<=11 activities)'} automatically applied.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. EXECUTIVE 80% ADHERENCE & ANALYTICS SCORECARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          
          {/* Card 1: 80% Adherence Requirement Estimate Benchmark */}
          <div className={`border-2 border-black p-4 shadow-[4px_4px_0px_#000000] space-y-2 ${
            adherence.isPassing80 ? 'bg-[#f4fde8]' : 'bg-[#fff5f5]'
          }`}>
            <div className="flex items-center justify-between font-mono text-xs font-bold uppercase">
              <span className="text-black">80% ADHERENCE REQUIREMENT</span>
              {adherence.isPassing80 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              )}
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`font-mono text-3xl sm:text-4xl font-black ${
                adherence.isPassing80 ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {adherence.completedCount}/{adherence.totalTasks}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-600">
                ({adherence.completionRate}%)
              </span>
            </div>

            {/* Progress bar with 80% target indicator marker */}
            <div className="relative w-full bg-zinc-200 h-3 border border-black overflow-hidden">
              <div
                className={`h-full border-r border-black transition-all duration-300 ${
                  adherence.isPassing80 ? 'bg-[#ccff00]' : 'bg-black'
                }`}
                style={{ width: `${Math.min(100, adherence.completionRate)}%` }}
              />
              {/* 80% marker line */}
              <div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-red-600 z-10" title="80% Threshold Line" />
            </div>

            <div className="font-mono text-[11px] font-bold text-zinc-700 flex items-center justify-between">
              <span>MIN REQUIRED (80%): <strong>{adherence.minRequired80} TASKS</strong></span>
              <span className={adherence.isPassing80 ? 'text-emerald-800' : 'text-rose-700'}>
                {adherence.isPassing80 ? 'PASS [MET]' : `NEED +${adherence.tasksNeeded}`}
              </span>
            </div>
          </div>

          {/* Card 2: Print Paper Orientation & Format */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>PRINT PAPER ORIENTATION</span>
              <Printer className="w-4 h-4 text-black" />
            </div>
            <div className="font-mono text-2xl font-black text-black uppercase">
              {isLandscape ? 'HORIZONTAL' : 'VERTICAL'}
            </div>
            <div className="font-mono text-xs text-zinc-600 font-bold">
              {isLandscape ? 'Landscape Mode (297×210mm)' : 'Portrait Mode (210×297mm)'}
            </div>
            <div className="w-full bg-[#ccff00] border border-black px-2 py-0.5 font-mono text-[10px] font-black text-black">
              {activityCount > 12 ? 'ACTIVITIES > 12 (HORIZONTAL)' : 'ACTIVITIES <= 11 (VERTICAL)'}
            </div>
          </div>

          {/* Card 3: Measurable Target Goals Score */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>PHYSICAL TARGET PROGRESS</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-black">{overallGoalsProgress}%</span>
              <span className="font-mono text-xs text-zinc-500 font-bold">Aggregate</span>
            </div>
            <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden">
              <div className="bg-[#ccff00] h-full border-r border-black transition-all duration-300" style={{ width: `${overallGoalsProgress}%` }} />
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              {displayGoals.length} measurable targets in active cadence
            </div>
          </div>

          {/* Card 4: Multi-Day Checklist Grid Status */}
          <div className="border-2 border-black bg-[#fafaf8] p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-zinc-600">
              <span>MANAGEMENT STATUS</span>
              {managementMode === 'digital_web' ? (
                <Laptop className="w-4 h-4 text-black" />
              ) : (
                <PenTool className="w-4 h-4 text-black" />
              )}
            </div>
            <div className="font-mono text-[11px] text-zinc-800 font-bold leading-tight">
              {managementMode === 'digital_web'
                ? 'Digital Mode: Click boxes below to toggle checkmarks and watch % recalculate.'
                : 'Print Paper Mode: Clean empty square boxes ready for manual black ball pen.'}
            </div>
            <button
              onClick={() => {
                if (managementMode === 'digital_web') {
                  handleMarkAllActive();
                } else {
                  handlePrintBrowser();
                }
              }}
              className="w-full py-1.5 border border-black bg-black text-[#ccff00] font-mono text-xs font-black uppercase hover:bg-[#ccff00] hover:text-black transition-colors cursor-pointer"
            >
              {managementMode === 'digital_web' ? 'Mark All Active Completed' : 'Print Grid Paper (Ctrl+P)'}
            </button>
          </div>

        </div>

        {/* 4. SECTION 1: CHECKLIST GRID BOXES FOR DAILY ACTIVITIES */}
        <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-black">
          
          {/* Section Header Bar */}
          <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-xs">
                01
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                  CHECKLIST GRID BOXES // {cadence.toUpperCase()} ACTIVITIES (PHYSICAL &amp; DIGITAL)
                </h3>
                <div className="font-mono text-[11px] text-zinc-600 font-bold">
                  {managementMode === 'digital_web'
                    ? `DIGITAL TRACKING: CLICK SQUARES TO TICK TASKS (80% MINIMUM: ${adherence.minRequired80}/${adherence.totalTasks} COMPLETED)`
                    : `PRINT PAPER MODE: HOLLOW BOXES READY FOR PHYSICAL BLACK BALLPOINT PEN TICKING`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleClearAllChecks}
                className="px-2.5 py-1.5 border border-black bg-white hover:bg-zinc-100 font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Reset all checkboxes to empty"
              >
                <RotateCcw className="w-3 h-3 text-zinc-600" />
                <span>Reset Checks</span>
              </button>

              <button
                onClick={() => setShowBlockModal(true)}
                className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity Block</span>
              </button>
            </div>
          </div>

          {/* Multi-Day Checklist Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-[#f0f0eb] text-black font-black uppercase text-[11px]">
                  <th className="p-3 w-16 text-center border-r border-black">STATUS</th>
                  <th className="p-3 w-36 sm:w-44 border-r border-black">TIME / SLOT</th>
                  <th className="p-3 border-r border-black">ACTIVITY PROTOCOL &amp; FOCUS</th>
                  <th className="p-3 border-r border-black">TARGET METRIC</th>
                  
                  {/* 7 Days Grid Header */}
                  {DAYS_OF_WEEK.map((day) => (
                    <th key={day} className="p-2 w-10 text-center border-r border-black bg-[#e9e9e2]">
                      {day}
                    </th>
                  ))}
                  
                  <th className="p-2 w-16 text-center border-r border-black">WEEK TOT</th>
                  <th className="p-2 w-14 text-center print:hidden">DEL</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black">
                {currentTimetableBlocks.map((block) => {
                  const checks = block.dayChecks || [false, false, false, false, false, false, false];
                  const weeklyCompleted = checks.filter(Boolean).length;

                  return (
                    <tr
                      key={block.id}
                      className={`hover:bg-[#fafaf8] transition-colors ${
                        block.completed ? 'bg-[#fcfdfa]' : 'bg-white'
                      }`}
                    >
                      {/* Master Completion Checkbox */}
                      <td className="p-2 text-center border-r border-black">
                        <button
                          onClick={() => handleToggleBlock(block.id)}
                          className="cursor-pointer inline-flex items-center justify-center p-0.5 hover:scale-110 transition-transform"
                          title={block.completed ? 'Mark uncompleted' : 'Mark completed'}
                        >
                          {block.completed ? (
                            <div className="w-5 h-5 border-2 border-black bg-[#ccff00] flex items-center justify-center font-black text-black text-xs">
                              ✓
                            </div>
                          ) : (
                            <div className="w-5 h-5 border-2 border-black bg-white hover:bg-zinc-100" />
                          )}
                        </button>
                      </td>

                      {/* Time Slot */}
                      <td className="p-3 font-bold border-r border-black text-black">
                        <div className="uppercase tracking-tight text-xs">{block.timeOrDay}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">{block.title}</div>
                      </td>

                      {/* Activity & Focus */}
                      <td className="p-3 border-r border-black">
                        <div className="font-black text-black text-[13px]">{block.activity}</div>
                        <div className="text-[11px] text-zinc-600 mt-0.5">
                          Focus: {block.focus}
                        </div>
                      </td>

                      {/* Target Metric */}
                      <td className="p-3 border-r border-black font-bold text-emerald-800">
                        <span className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 inline-block">
                          {block.targetMetric}
                        </span>
                      </td>

                      {/* 7 Daily Checkbox Grid Squares */}
                      {DAYS_OF_WEEK.map((day, dayIndex) => {
                        const isChecked = checks[dayIndex];
                        return (
                          <td key={day} className="p-1 text-center border-r border-black bg-[#fafaf8]">
                            <button
                              onClick={() => handleToggleDayCheck(block.id, dayIndex)}
                              className="w-6 h-6 border-2 border-black bg-white hover:bg-zinc-100 flex items-center justify-center mx-auto transition-colors cursor-pointer"
                              title={`Toggle ${day}: ${block.activity}`}
                            >
                              {isChecked ? (
                                <span className="font-black text-black text-xs">✓</span>
                              ) : (
                                <span className="text-zinc-300 text-[10px]">·</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Total Weekly Completed */}
                      <td className="p-2 text-center border-r border-black font-black text-black">
                        <span className={`px-1.5 py-0.5 border ${
                          weeklyCompleted >= 5 ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                        }`}>
                          {weeklyCompleted}/7
                        </span>
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Delete activity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {currentTimetableBlocks.length === 0 && (
                  <tr>
                    <td colSpan={13} className="p-6 text-center text-zinc-500 font-bold">
                      No activities configured. Click &quot;Add Activity Block&quot; to build schedule.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Section Summary Bar with 80% Rule Notice */}
          <div className="p-3 bg-[#fafaf8] border-t-2 border-black flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-black text-black">
                TOTAL ACTIVITIES: {activityCount} · COMPLETED: {completedBlocksCount}/{activityCount} ({adherence.completionRate}%)
              </span>
              <span className={`px-2 py-0.5 border font-black ${
                adherence.isPassing80 ? 'border-black bg-[#ccff00] text-black' : 'border-rose-400 bg-rose-100 text-rose-900'
              }`}>
                {adherence.isPassing80 ? '80% REQUIREMENT MET (PASS)' : `NEED +${adherence.tasksNeeded} TASKS FOR 80%`}
              </span>
            </div>

            <div className="text-zinc-500 text-[11px]">
              Print Auto-Rule: {activityCount > 12 ? 'Orientation = Horizontal (>12 Tasks)' : 'Orientation = Vertical (<=11 Tasks)'}
            </div>
          </div>

        </section>

        {/* 5. SECTION 2: AUTOMATIC PROGRESS GRAPH (TILL LAST DAY) WITH 80% THRESHOLD */}
        <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] p-4 sm:p-5 space-y-4 print:shadow-none print:border-black">
          
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-xs">
                02
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                  AUTOMATED ACTIVITY PROGRESS GRAPH (TILL LAST DAY)
                </h3>
                <div className="font-mono text-[11px] text-zinc-600 font-bold">
                  DYNAMIC 7-DAY ADHERENCE CURVE WITH RED 80% TARGET THRESHOLD (MINIMUM SUCCESS BENCHMARK)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-red-600 border border-red-600 inline-block" />
                <span className="font-bold text-red-600">80% TARGET LINE</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black inline-block" />
                <span className="font-bold text-black">&gt;= 80% PASS</span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Progress Graph */}
          <div className="w-full bg-[#fafaf8] border-2 border-black p-4 overflow-x-auto">
            <svg
              viewBox="0 0 800 240"
              className="w-full h-52 select-none"
              preserveAspectRatio="none"
            >
              {/* Background Grid Lines */}
              {[0, 20, 40, 60, 80, 100].map((pct) => {
                const y = 200 - (pct / 100) * 160;
                return (
                  <g key={pct}>
                    <line
                      x1="50"
                      y1={y}
                      x2="780"
                      y2={y}
                      stroke={pct === 80 ? '#dc2626' : '#e5e7eb'}
                      strokeWidth={pct === 80 ? 2 : 1}
                      strokeDasharray={pct === 80 ? '6 4' : undefined}
                    />
                    <text
                      x="40"
                      y={y + 4}
                      textAnchor="end"
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight={pct === 80 ? 'bold' : 'normal'}
                      fill={pct === 80 ? '#dc2626' : '#6b7280'}
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* 80% Threshold Line Label */}
              <text
                x="60"
                y="62"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                fill="#dc2626"
              >
                80% MINIMUM SUCCESS REQUIREMENT
              </text>

              {/* Plot Points & Connecting Line based on dynamicDayHistory */}
              {(() => {
                const numDays = dynamicDayHistory.length;
                const xStart = 80;
                const xSpan = (740 - xStart) / Math.max(1, numDays - 1);

                const points = dynamicDayHistory.map((pt, i) => {
                  const x = xStart + i * xSpan;
                  const y = 200 - (pt.percentage / 100) * 160;
                  return { ...pt, x, y };
                });

                const polylineCoords = points.map((p) => `${p.x},${p.y}`).join(' ');

                return (
                  <g>
                    {/* Area under curve fill */}
                    <polygon
                      points={`80,200 ${polylineCoords} ${points[points.length - 1].x},200`}
                      fill="#ccff00"
                      fillOpacity="0.2"
                    />

                    {/* Connecting Line */}
                    <polyline
                      fill="none"
                      stroke="#000000"
                      strokeWidth="3"
                      points={polylineCoords}
                    />

                    {/* Individual Day Circles and Labels */}
                    {points.map((p, idx) => {
                      const isPassing = p.percentage >= 80;
                      return (
                        <g key={idx} className="cursor-pointer group">
                          {/* Circle */}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill={isPassing ? '#16a34a' : '#dc2626'}
                            stroke="#000000"
                            strokeWidth="2"
                          />

                          {/* Percentage Text above */}
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#000000"
                          >
                            {p.percentage}%
                          </text>

                          {/* Day Label below axis */}
                          <text
                            x={p.x}
                            y="222"
                            textAnchor="middle"
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                            fill="#000000"
                          >
                            {p.dayLabel.split(' ')[0]}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Graph Days Log Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
            {dynamicDayHistory.map((d, i) => {
              const pass = d.percentage >= 80;
              return (
                <div
                  key={i}
                  className={`border-2 border-black p-2 shadow-[2px_2px_0px_#000000] ${
                    pass ? 'bg-[#f4fde8]' : 'bg-[#fff5f5]'
                  }`}
                >
                  <div className="text-[10px] font-bold text-zinc-600 truncate">{d.dayLabel}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="font-black text-lg text-black">{d.percentage}%</span>
                    <span className={`text-[10px] font-black ${pass ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {pass ? 'PASS' : '< 80%'}
                    </span>
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-0.5">
                    {d.completedCount}/{d.totalCount} completed
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* 6. SECTION 3: MEASURABLE TARGETS & GOALS ANALYSIS (%) */}
        <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-black">
          
          <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-xs">
                03
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                  MEASURABLE TARGETS &amp; GOALS ANALYSIS (%)
                </h3>
                <div className="font-mono text-[11px] text-zinc-600 font-bold">
                  OBJECTIVE FORMULAS: LOG CURRENT METRICS AND TRACK PERCENTAGE PROGRESSION
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setShowGoalModal(true)}
                className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target Goal</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-[#f0f0eb] text-black font-black uppercase text-[11px]">
                  <th className="p-3 border-r border-black">TARGET METRIC / GOAL</th>
                  <th className="p-3 w-28 border-r border-black hidden sm:table-cell">CATEGORY</th>
                  <th className="p-3 w-28 border-r border-black text-right">BASELINE</th>
                  <th className="p-3 w-44 border-r border-black text-center">CURRENT / LOG</th>
                  <th className="p-3 w-28 border-r border-black text-right">TARGET</th>
                  <th className="p-3 w-48 border-r border-black">PROGRESS (%)</th>
                  <th className="p-3 w-16 text-center print:hidden">DEL</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black">
                {displayGoals.map((goal) => {
                  const progress = computeGoalProgress(goal);
                  const isAchieved = progress >= 100;
                  const deltaToTarget = Math.round((goal.target - goal.current) * 10) / 10;

                  return (
                    <tr key={goal.id} className="hover:bg-[#fafaf8] transition-colors">
                      <td className="p-3 border-r border-black">
                        <div className="font-black text-black text-[13px]">{goal.title}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">
                          {goal.notes ? goal.notes : `Cadence: ${goal.cadence.toUpperCase()}`}
                        </div>
                      </td>

                      <td className="p-3 border-r border-black hidden sm:table-cell">
                        <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                          {goal.category}
                        </span>
                      </td>

                      <td className="p-3 border-r border-black text-right font-bold text-zinc-600">
                        {goal.baseline} {goal.unit}
                      </td>

                      <td className="p-3 border-r border-black text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleUpdateGoalCurrent(goal.id, -1)}
                            className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer print:hidden"
                          >
                            -
                          </button>
                          
                          <span className="font-black text-sm text-black min-w-[50px]">
                            {goal.current} <span className="text-[10px] font-normal text-zinc-500">{goal.unit}</span>
                          </span>

                          <button
                            onClick={() => handleUpdateGoalCurrent(goal.id, 1)}
                            className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer print:hidden"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td className="p-3 border-r border-black text-right font-bold text-black">
                        {goal.target} {goal.unit}
                      </td>

                      <td className="p-3 border-r border-black">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={isAchieved ? 'text-emerald-800 font-black' : 'text-black'}>
                              {progress}% {isAchieved ? '✓ MET' : ''}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {deltaToTarget > 0 ? `${deltaToTarget} ${goal.unit} to go` : 'Target achieved'}
                            </span>
                          </div>
                          <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
                            <div
                              className={`h-full border-r border-black transition-all duration-300 ${
                                isAchieved ? 'bg-[#ccff00]' : 'bg-black'
                              }`}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {displayGoals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-zinc-500 font-bold">
                      No goals configured. Click &quot;Add Target Goal&quot; to define measurable metrics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* 7. PHYSICAL PRINT SPECIMEN VERIFICATION SIGN-OFF (PRINTS ON A4 PAPER) */}
        <div className="border-2 border-black bg-white p-4 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:border-black">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-black text-black">
              FITNESS GLASS // PHYSICAL REVIEW &amp; 80% ADHERENCE CERTIFICATION
            </div>
            <div className="text-[10px] text-zinc-500">
              FORM: FG-A4-{activeOrientation.toUpperCase()} · ISO A4 ({isLandscape ? '297×210mm HORIZONTAL' : '210×297mm VERTICAL'}) · 80% REQUIREMENT: {adherence.minRequired80}/{adherence.totalTasks} TASKS
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <div>
              <span>ATHLETE SIGNATURE: </span>
              <span className="inline-block border-b-2 border-black w-36" />
            </div>
            <div>
              <span>DATE COMPLETED: </span>
              <span className="inline-block border-b-2 border-black w-24" />
            </div>
            <div className="font-black">
              {managementMode === 'print_paper' ? '[ ] PASS (>=80%)   [ ] INCOMPLETE' : (adherence.isPassing80 ? '[X] PASS' : '[ ] UNDER 80%')}
            </div>
          </div>
        </div>

      </main>

      {/* MODAL 1: ADD GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg border-2 border-black bg-[#f5f5f0] shadow-[8px_8px_0px_#000000] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-mono text-sm font-black text-black uppercase">
                ADD MEASURABLE TARGET GOAL
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="font-mono text-xs font-black text-zinc-500 hover:text-black cursor-pointer"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-black mb-1">METRIC TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Barbell Deadlift 1RM, Body Fat %, 5K Run Time"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black mb-1">CATEGORY</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as FitnessGoal['category'] })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  >
                    <option value="Strength">Strength</option>
                    <option value="Endurance">Endurance</option>
                    <option value="Body Comp">Body Comp</option>
                    <option value="Nutrition">Nutrition</option>
                    <option value="Habits">Habits</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black mb-1">CADENCE</label>
                  <select
                    value={newGoal.cadence}
                    onChange={(e) => setNewGoal({ ...newGoal, cadence: e.target.value as FitnessCadence })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block font-black mb-1">BASELINE</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.baseline}
                    onChange={(e) => setNewGoal({ ...newGoal, baseline: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">CURRENT</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.current}
                    onChange={(e) => setNewGoal({ ...newGoal, current: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">TARGET</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.target}
                    onChange={(e) => setNewGoal({ ...newGoal, target: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">UNIT</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, %, km, reps"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black mb-1">NOTES / TECHNIQUE SPECIFICATION</label>
                <input
                  type="text"
                  placeholder="e.g. strict lockout, DEXA calibrated, nasal breathing"
                  value={newGoal.notes}
                  onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-black cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD TIMETABLE BLOCK MODAL */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg border-2 border-black bg-[#f5f5f0] shadow-[8px_8px_0px_#000000] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="font-mono text-sm font-black text-black uppercase">
                ADD {cadence.toUpperCase()} ACTIVITY BLOCK
              </h3>
              <button
                onClick={() => setShowBlockModal(false)}
                className="font-mono text-xs font-black text-zinc-500 hover:text-black cursor-pointer"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleAddBlock} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black mb-1">TIME OR SLOT</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 06:00 - 07:00 or MORNING"
                    value={newBlock.timeOrDay}
                    onChange={(e) => setNewBlock({ ...newBlock, timeOrDay: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">BLOCK LABEL</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fasted Cardio, Push Hypertrophy"
                    value={newBlock.title}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-black mb-1">ACTIVITY PROTOCOL</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Treadmill 45m or Heavy Squats 5x5"
                  value={newBlock.activity}
                  onChange={(e) => setNewBlock({ ...newBlock, activity: e.target.value })}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-black mb-1">FOCUS OBJECTIVE</label>
                  <input
                    type="text"
                    placeholder="e.g. Fat Oxidation, Mechanical Tension"
                    value={newBlock.focus}
                    onChange={(e) => setNewBlock({ ...newBlock, focus: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-black mb-1">TARGET METRIC</label>
                  <input
                    type="text"
                    placeholder="e.g. 140kg x 5, HR 130 bpm"
                    value={newBlock.targetMetric}
                    onChange={(e) => setNewBlock({ ...newBlock, targetMetric: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-black cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  Save Activity Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#ccff00] text-black px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t-2 border-black bg-white py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-600">
          <div>
            FITNESS GLASS // DIGITAL TRACKING &amp; PHYSICAL BLACK BALL PEN PRINT PAPER
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-black hover:text-emerald-800 underline">
              genQRstudio (Home)
            </Link>
            <Link href="/nomral-dpi-photo" className="font-black text-black hover:text-emerald-800 underline">
              Photo DPI Maker
            </Link>
            <Link href="/barcode-pick" className="font-black text-black hover:text-emerald-800 underline">
              Barcode Pick
            </Link>
            <Link href="/fitness-glass" className="font-black text-black hover:text-emerald-800 underline">
              Fitness Glass
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
