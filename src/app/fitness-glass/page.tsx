'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Calendar,
  CheckSquare,
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
} from 'lucide-react';
import {
  FitnessCadence,
  FitnessGoal,
  TimetableBlock,
  FitnessGlassData,
  INITIAL_TIMETABLE,
  INITIAL_GOALS,
  computeGoalProgress,
  computeAggregateProgress,
  exportFitnessToCSV,
  exportFitnessToA4_PDF,
  renderFitnessA4ToCanvas,
} from '@/lib/fitness-glass-engine';

function getSavedProtocol(): Partial<FitnessGlassData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('fitness_glass_protocol_v2');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function FitnessGlassPage() {
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
    return saved?.planTitle || 'High-Performance Hypertrophy & Aerobic Base';
  });

  const [timetable, setTimetable] = useState<Record<FitnessCadence, TimetableBlock[]>>(() => {
    const saved = getSavedProtocol();
    return saved?.timetable || INITIAL_TIMETABLE;
  });

  const [goals, setGoals] = useState<FitnessGoal[]>(() => {
    const saved = getSavedProtocol();
    return saved?.goals || INITIAL_GOALS;
  });
  
  // Modal states
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [isEditingInfo, setIsEditingInfo] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // New goal form state
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

  // New block form state
  const [newBlock, setNewBlock] = useState<Partial<TimetableBlock>>({
    timeOrDay: '',
    title: '',
    activity: '',
    focus: '',
    targetMetric: '',
  });

  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
      };
      localStorage.setItem('fitness_glass_protocol_v2', JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [cadence, userName, planTitle, timetable, goals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Toggle timetable block completion checkmark
  const handleToggleBlock = (blockId: string) => {
    setTimetable((prev) => {
      const currentList = prev[cadence] || [];
      const updated = currentList.map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      );
      return { ...prev, [cadence]: updated };
    });
  };

  // Reset checkmarks for active cadence
  const handleResetCheckmarks = () => {
    setTimetable((prev) => {
      const currentList = prev[cadence] || [];
      const updated = currentList.map((b) => ({ ...b, completed: false }));
      return { ...prev, [cadence]: updated };
    });
    showToast(`Reset checkmarks for ${cadence.toUpperCase()} schedule`);
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
    showToast('Removed schedule block');
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
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const blob = await exportFitnessToA4_PDF(currentDataset);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fitness_Glass_${cadence.toUpperCase()}_A4_Specimen.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Generated print-ready ISO A4 PDF with checkmarks');
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
      a.download = `Fitness_Glass_${cadence.toUpperCase()}_300DPI_A4.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded 300 DPI high-density A4 PNG');
    } catch (err) {
      console.error(err);
      showToast('PNG Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    exportFitnessToCSV(currentDataset);
    showToast('Exported CSV spreadsheet');
  };

  const handlePrintBrowser = () => {
    window.print();
  };

  // Filter goals matching active cadence (or all if desired)
  const activeCadenceGoals = goals.filter((g) => g.cadence === cadence || cadence === 'yearly');
  const displayGoals = activeCadenceGoals.length > 0 ? activeCadenceGoals : goals;

  const currentTimetableBlocks = timetable[cadence] || [];
  const completedBlocksCount = currentTimetableBlocks.filter((b) => b.completed).length;
  const blockCompletionRate = currentTimetableBlocks.length
    ? Math.round((completedBlocksCount / currentTimetableBlocks.length) * 100)
    : 0;
  const overallGoalsProgress = computeAggregateProgress(displayGoals);

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-black font-sans selection:bg-[#ccff00] selection:text-black flex flex-col print:bg-white print:p-0">
      
      {/* 1. TOP NAVIGATION HEADER (Hidden in Print) */}
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
                MEASURABLE TIMETABLE & TARGET PROGRESSION (A4 PRINT READY)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
              <span className="border-2 border-black bg-[#ccff00] text-black px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                {cadence.toUpperCase()} CADENCE
              </span>
              <span className="border-2 border-black bg-black text-[#ccff00] px-2.5 py-1 font-black shadow-[2px_2px_0px_#000000]">
                ISO A4 (210×297mm)
              </span>
            </div>

            <Link
              href="/nomral-dpi-photo"
              className="hidden lg:flex items-center gap-1.5 border-2 border-black bg-white hover:bg-zinc-100 px-3 py-2 font-mono text-xs font-black shadow-[2px_2px_0px_#000000] transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PHOTO DPI</span>
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
              {'// ENGINE: SYSTEMATIC TIMETABLE & OBJECTIVE MEASURABLE TARGETS'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-black">
                FITNESS GLASS
              </h1>
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter uppercase leading-[0.95] text-emerald-800">
                TIMETABLE & TARGETS
              </h2>
            </div>

            {/* Quick Action Buttons Header */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrintBrowser}
                className="px-3.5 py-2 border-2 border-black bg-white hover:bg-black hover:text-white font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title="Print directly to physical A4 paper via browser dialog"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>PRINT A4 PAPER</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3.5 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black shadow-[3px_3px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                title="Download A4 PDF document with checkboxes & tables"
              >
                <FileText className="w-4 h-4 text-black" />
                <span>PDF (A4)</span>
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

        {/* CADENCE SELECTOR STRIP */}
        <div className="border-2 border-black bg-white p-2.5 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 print:hidden">
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
                  className={`px-3.5 py-1.5 border-2 border-black font-mono text-xs font-black transition-all cursor-pointer uppercase ${
                    isActive
                      ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                      : 'bg-[#fafaf8] text-black hover:bg-zinc-100'
                  }`}
                >
                  {tab === 'daily' && 'Daily (24H Routine)'}
                  {tab === 'weekly' && 'Weekly (7-Day Split)'}
                  {tab === 'monthly' && 'Monthly (Mesocycle)'}
                  {tab === 'quarterly' && 'Quarterly (12-Week Goals)'}
                  {tab === 'yearly' && 'Yearly (Macro Periodization)'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              className="border border-black bg-white hover:bg-zinc-100 px-2.5 py-1 font-bold text-black flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditingInfo ? 'Save Info' : 'Edit Plan Meta'}</span>
            </button>

            <button
              onClick={handleResetCheckmarks}
              className="border border-black bg-white hover:bg-zinc-100 px-2.5 py-1 font-bold text-black flex items-center gap-1 cursor-pointer"
              title="Reset checkmarks for current cadence"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Checks</span>
            </button>
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

        {/* 3. EXECUTIVE GLASS ANALYTICS SCORECARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          
          {/* Card 1: Overall Goals Progress */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>TARGET GOALS PROGRESS</span>
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-black">{overallGoalsProgress}%</span>
              <span className="font-mono text-xs text-zinc-500 font-bold">Aggregate</span>
            </div>
            <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
              <div className="bg-[#ccff00] h-full border-r border-black transition-all duration-300" style={{ width: `${overallGoalsProgress}%` }} />
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              {displayGoals.length} measurable targets in active cadence
            </div>
          </div>

          {/* Card 2: Schedule Checkmarks Rate */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-2">
            <div className="flex items-center justify-between text-zinc-600 font-mono text-xs font-bold uppercase">
              <span>TIMETABLE CHECKMARKS</span>
              <CheckSquare className="w-4 h-4 text-black" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black text-black">{blockCompletionRate}%</span>
              <span className="font-mono text-xs text-zinc-500 font-bold">{completedBlocksCount}/{currentTimetableBlocks.length} Done</span>
            </div>
            <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
              <div className="bg-black h-full transition-all duration-300" style={{ width: `${blockCompletionRate}%` }} />
            </div>
            <div className="font-mono text-[10px] text-zinc-500">
              Physical checkboxes ready for paper tick-off
            </div>
          </div>

          {/* Card 3: Athlete & Protocol Status */}
          <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] space-y-1.5">
            <div className="text-zinc-600 font-mono text-xs font-bold uppercase">
              ATHLETE PROFILE
            </div>
            <div className="font-mono text-sm font-black text-black truncate">{userName}</div>
            <div className="font-mono text-[11px] text-zinc-600 truncate">{planTitle}</div>
            <div className="pt-1 flex items-center gap-1 font-mono text-[10px] font-black text-emerald-800">
              <span className="w-2 h-2 bg-[#ccff00] border border-black inline-block" />
              <span>ACTIVE SYSTEM: {cadence.toUpperCase()}</span>
            </div>
          </div>

          {/* Card 4: Paper Print & Export Readiness */}
          <div className="border-2 border-black bg-[#fafaf8] p-4 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-zinc-600">
              <span>PAPER PRINT READY</span>
              <Printer className="w-4 h-4 text-black" />
            </div>
            <div className="font-mono text-[11px] text-zinc-800 font-bold leading-tight">
              Calibrated for standard A4 paper (210×297mm) with razor-sharp checkboxes and margin grids.
            </div>
            <button
              onClick={handlePrintBrowser}
              className="w-full py-1.5 border border-black bg-black text-[#ccff00] font-mono text-xs font-black uppercase hover:bg-[#ccff00] hover:text-black transition-colors cursor-pointer"
            >
              Print A4 Now (Ctrl+P)
            </button>
          </div>

        </div>

        {/* 4. SECTION 1: TIMETABLE SCHEDULE & ROUTINE CHECKMARKS */}
        <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-black">
          
          {/* Section Header Bar */}
          <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-xs">
                01
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                  {cadence.toUpperCase()} SCHEDULE & ROUTINE CHECKMARKS
                </h3>
                <div className="font-mono text-[11px] text-zinc-600 font-bold">
                  CHECK OFF ROUTINES VIRTUALLY OR PRINT FOR PHYSICAL PEN-AND-PAPER TRACKING
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setShowBlockModal(true)}
                className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Routine Block</span>
              </button>
            </div>
          </div>

          {/* Timetable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-black bg-[#f0f0eb] text-black font-black uppercase text-[11px]">
                  <th className="p-3 w-14 text-center border-r border-black">CHECK</th>
                  <th className="p-3 w-36 sm:w-44 border-r border-black">TIME / DAY</th>
                  <th className="p-3 border-r border-black">ROUTINE & PROTOCOL</th>
                  <th className="p-3 border-r border-black hidden md:table-cell">FOCUS OBJECTIVE</th>
                  <th className="p-3 border-r border-black">TARGET METRIC</th>
                  <th className="p-3 w-16 text-center print:hidden">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black">
                {currentTimetableBlocks.map((block) => (
                  <tr
                    key={block.id}
                    className={`hover:bg-[#fafaf8] transition-colors ${
                      block.completed ? 'bg-zinc-50' : 'bg-white'
                    }`}
                  >
                    {/* Checkbox cell */}
                    <td className="p-3 text-center border-r border-black">
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
                          <div className="w-5 h-5 border-2 border-black bg-white" />
                        )}
                      </button>
                    </td>

                    {/* Time or Day */}
                    <td className="p-3 font-bold border-r border-black text-black">
                      <div className="uppercase tracking-tight">{block.timeOrDay}</div>
                      <div className="text-[10px] text-zinc-500 font-normal">{block.title}</div>
                    </td>

                    {/* Activity */}
                    <td className="p-3 border-r border-black">
                      <div className="font-black text-black text-[13px]">{block.activity}</div>
                      <div className="text-[10px] text-zinc-600 md:hidden mt-0.5">
                        Focus: {block.focus}
                      </div>
                    </td>

                    {/* Focus */}
                    <td className="p-3 border-r border-black hidden md:table-cell text-zinc-700">
                      {block.focus}
                    </td>

                    {/* Target Metric */}
                    <td className="p-3 border-r border-black font-bold text-emerald-800">
                      <span className="bg-emerald-50 border border-emerald-300 px-2 py-0.5 inline-block">
                        {block.targetMetric}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title="Delete routine block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {currentTimetableBlocks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-zinc-500 font-bold">
                      No routine blocks configured for {cadence.toUpperCase()}. Click &quot;Add Routine Block&quot; to build schedule.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* 5. SECTION 2: MEASURABLE TARGETS & GOALS ANALYSIS (%) */}
        <section className="border-2 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-black">
          
          {/* Section Header Bar */}
          <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-xs">
                02
              </div>
              <div>
                <h3 className="font-mono text-sm font-black text-black uppercase tracking-tight">
                  MEASURABLE TARGETS & PROGRESS ANALYSIS (%)
                </h3>
                <div className="font-mono text-[11px] text-zinc-600 font-bold">
                  OBJECTIVE FORMULAS: LOG NUMERICAL PROGRESSION AND TRACK % TOWARDS FINAL GOAL
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

          {/* Goals List / Table */}
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
                      
                      {/* Metric Name */}
                      <td className="p-3 border-r border-black">
                        <div className="font-black text-black text-[13px]">{goal.title}</div>
                        <div className="text-[10px] text-zinc-500 font-normal">
                          {goal.notes ? goal.notes : `Cadence: ${goal.cadence.toUpperCase()}`}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 border-r border-black hidden sm:table-cell">
                        <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800">
                          {goal.category}
                        </span>
                      </td>

                      {/* Baseline */}
                      <td className="p-3 border-r border-black text-right font-bold text-zinc-600">
                        {goal.baseline} {goal.unit}
                      </td>

                      {/* Current Value & Interactive Steppers */}
                      <td className="p-3 border-r border-black text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleUpdateGoalCurrent(goal.id, -1)}
                            className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer print:hidden"
                            title="Decrease current value"
                          >
                            -
                          </button>
                          
                          <span className="font-black text-sm text-black min-w-[50px]">
                            {goal.current} <span className="text-[10px] font-normal text-zinc-500">{goal.unit}</span>
                          </span>

                          <button
                            onClick={() => handleUpdateGoalCurrent(goal.id, 1)}
                            className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer print:hidden"
                            title="Increase current value"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5">
                          {isAchieved ? (
                            <span className="text-emerald-700 font-bold">✓ TARGET ACHIEVED</span>
                          ) : (
                            <span>{Math.abs(deltaToTarget)} {goal.unit} {deltaToTarget > 0 ? 'remaining' : 'over'}</span>
                          )}
                        </div>
                      </td>

                      {/* Target */}
                      <td className="p-3 border-r border-black text-right font-black text-black">
                        {goal.target} {goal.unit}
                      </td>

                      {/* Progress Bar & Percentage */}
                      <td className="p-3 border-r border-black">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-black">
                            <span className={isAchieved ? 'text-emerald-800' : 'text-black'}>
                              {progress}%
                            </span>
                            <span className="text-[9px] text-zinc-500 font-bold">
                              {isAchieved ? 'COMPLETE' : progress >= 60 ? 'ON TRACK' : 'IN PROGRESS'}
                            </span>
                          </div>
                          
                          <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden flex">
                            <div
                              className={`h-full border-r border-black transition-all duration-300 ${
                                isAchieved ? 'bg-[#ccff00]' : 'bg-black'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="p-3 text-center print:hidden">
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                          title="Delete metric"
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
                      No goals configured for {cadence.toUpperCase()}. Click &quot;Add Target Goal&quot; to define measurable metrics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* 6. PHYSICAL A4 PRINT SPECIMEN FOOTER (Prints on Paper) */}
        <div className="border-2 border-black bg-white p-4 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:border-black">
          <div className="space-y-1 text-center sm:text-left">
            <div className="font-black text-black">
              FITNESS GLASS // PHYSICAL VERIFICATION & REVIEW LOG
            </div>
            <div className="text-[10px] text-zinc-500">
              FORM: FG-A4-{cadence.toUpperCase()} · HIGH-CONTRAST 21:1 B/W OPTICAL PRINT FORM
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <div>
              <span>ATHLETE SIGNATURE: </span>
              <span className="inline-block border-b-2 border-black w-32" />
            </div>
            <div>
              <span>DATE: </span>
              <span className="inline-block border-b-2 border-black w-24" />
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
                ADD {cadence.toUpperCase()} ROUTINE BLOCK
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
                  <label className="block font-black mb-1">TIME OR DAY</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 06:00 - 07:00 or MONDAY"
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
                  Save Routine Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#ccff00] text-black px-4 py-2.5 font-mono text-xs font-black shadow-[4px_4px_0px_#000000] flex items-center gap-2 animate-bounce print:hidden">
          <Check className="w-4 h-4 text-black stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer (Hidden in Print) */}
      <footer className="w-full border-t-2 border-black bg-white py-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-zinc-600">
          <div>
            FITNESS GLASS // MEASURABLE PHYSICAL PROTOCOL & A4 CHECKMARK COMPILER
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="font-black text-black hover:text-emerald-800 underline">
              genQRstudio
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
