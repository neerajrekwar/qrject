'use client';

import React, { useState, useMemo } from 'react';
import {
  WinterArcDayRecord,
  WinterArc24HrSlot,
  WinterArcPrintStyle,
} from '@/lib/winter-arc-engine';
import {
  Activity,
  RotateCcw,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export interface AutomatedGraphDayPoint {
  dayNumber: number;
  dayLabel: string;
  shortLabel: string;
  percentage: number;
  completedCount: number;
  totalCount: number;
  isPassing: boolean;
  phase: 1 | 2 | 3;
}

interface WinterArcAutomatedProgressGraphProps {
  dayMatrix: WinterArcDayRecord[];
  slots24h: WinterArc24HrSlot[];
  printStyle?: WinterArcPrintStyle;
  onUpdateDayScore?: (dayNumber: number, score: number) => void;
  onToggleDay?: (dayNumber: number) => void;
  onClearMatrix?: () => void;
  onLoadSampleTrajectory?: () => void;
  onLoadDemoPass?: () => void;
}

export type GraphViewScope = '7days' | '14days' | 'phase1' | 'phase2' | 'phase3' | 'all90';

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const WinterArcAutomatedProgressGraph: React.FC<WinterArcAutomatedProgressGraphProps> = ({
  dayMatrix,
  slots24h,
  printStyle = 'blank_paper_pen',
  onUpdateDayScore,
  onToggleDay,
  onClearMatrix,
  onLoadSampleTrajectory,
  onLoadDemoPass,
}) => {
  const [selectedScope, setSelectedScope] = useState<GraphViewScope>('7days');
  const [hoveredDay, setHoveredDay] = useState<AutomatedGraphDayPoint | null>(null);

  const totalSlotsCount = Math.max(1, slots24h.length);
  const completedSlotsNow = slots24h.filter((s) => s.completed).length;
  const current24hPct = Math.round((completedSlotsNow / totalSlotsCount) * 100);

  // Compute dynamic points based on selected scope
  const plottedDays: AutomatedGraphDayPoint[] = useMemo(() => {
    if (selectedScope === '7days') {
      // 7-Day Cycle: Days 1 to 7 (or active week)
      return Array.from({ length: 7 }, (_, i) => {
        const dayRecord = dayMatrix[i];
        const dayName = DAYS_OF_WEEK[i % 7];
        const dayNum = i + 1;
        
        let score = dayRecord?.scorePercent || 0;
        let completed = dayRecord?.hoursCompliant || 0;

        // If today is day 1 and slots are ticked, reflect current live 24h score if higher
        if (i === 0 && current24hPct > score) {
          score = current24hPct;
          completed = completedSlotsNow;
        } else if (dayRecord?.completed && score === 0) {
          score = 85;
          completed = Math.round(0.85 * totalSlotsCount);
        } else if (score > 0 && completed === 0) {
          completed = Math.round((score / 100) * totalSlotsCount);
        }

        return {
          dayNumber: dayNum,
          dayLabel: `DAY 0${dayNum} (${dayName})`,
          shortLabel: `D0${dayNum} ${dayName}`,
          percentage: score,
          completedCount: completed,
          totalCount: totalSlotsCount,
          isPassing: score >= 80,
          phase: 1,
        };
      });
    }

    if (selectedScope === '14days') {
      // 14-Day Sprint: Days 1 to 14
      return Array.from({ length: 14 }, (_, i) => {
        const dayRecord = dayMatrix[i];
        const dayNum = i + 1;
        let score = dayRecord?.scorePercent || 0;
        let completed = dayRecord?.hoursCompliant || 0;

        if (i === 0 && current24hPct > score) {
          score = current24hPct;
          completed = completedSlotsNow;
        } else if (dayRecord?.completed && score === 0) {
          score = 85;
          completed = Math.round(0.85 * totalSlotsCount);
        } else if (score > 0 && completed === 0) {
          completed = Math.round((score / 100) * totalSlotsCount);
        }

        return {
          dayNumber: dayNum,
          dayLabel: `DAY ${dayNum.toString().padStart(2, '0')}`,
          shortLabel: `D${dayNum}`,
          percentage: score,
          completedCount: completed,
          totalCount: totalSlotsCount,
          isPassing: score >= 80,
          phase: (dayRecord?.phase || 1) as 1 | 2 | 3,
        };
      });
    }

    if (selectedScope === 'phase1') {
      return dayMatrix.slice(0, 30).map((d) => {
        let score = d.scorePercent || (d.completed ? 85 : 0);
        let completed = d.hoursCompliant || Math.round((score / 100) * totalSlotsCount);
        return {
          dayNumber: d.dayNumber,
          dayLabel: `DAY ${d.dayNumber.toString().padStart(2, '0')}`,
          shortLabel: `D${d.dayNumber}`,
          percentage: score,
          completedCount: completed,
          totalCount: totalSlotsCount,
          isPassing: score >= 80,
          phase: 1,
        };
      });
    }

    if (selectedScope === 'phase2') {
      return dayMatrix.slice(30, 60).map((d) => {
        let score = d.scorePercent || (d.completed ? 85 : 0);
        let completed = d.hoursCompliant || Math.round((score / 100) * totalSlotsCount);
        return {
          dayNumber: d.dayNumber,
          dayLabel: `DAY ${d.dayNumber.toString().padStart(2, '0')}`,
          shortLabel: `D${d.dayNumber}`,
          percentage: score,
          completedCount: completed,
          totalCount: totalSlotsCount,
          isPassing: score >= 80,
          phase: 2,
        };
      });
    }

    if (selectedScope === 'phase3') {
      return dayMatrix.slice(60, 90).map((d) => {
        let score = d.scorePercent || (d.completed ? 85 : 0);
        let completed = d.hoursCompliant || Math.round((score / 100) * totalSlotsCount);
        return {
          dayNumber: d.dayNumber,
          dayLabel: `DAY ${d.dayNumber.toString().padStart(2, '0')}`,
          shortLabel: `D${d.dayNumber}`,
          percentage: score,
          completedCount: completed,
          totalCount: totalSlotsCount,
          isPassing: score >= 80,
          phase: 3,
        };
      });
    }

    // Default 'all90'
    return dayMatrix.map((d) => {
      let score = d.scorePercent || (d.completed ? 85 : 0);
      let completed = d.hoursCompliant || Math.round((score / 100) * totalSlotsCount);
      return {
        dayNumber: d.dayNumber,
        dayLabel: `DAY ${d.dayNumber.toString().padStart(2, '0')}`,
        shortLabel: `D${d.dayNumber}`,
        percentage: score,
        completedCount: completed,
        totalCount: totalSlotsCount,
        isPassing: score >= 80,
        phase: d.phase,
      };
    });
  }, [selectedScope, dayMatrix, slots24h, totalSlotsCount, current24hPct, completedSlotsNow]);

  // Overall passing stats in this view
  const passingCount = plottedDays.filter((d) => d.isPassing).length;
  const overallAvg =
    plottedDays.length > 0
      ? Math.round(plottedDays.reduce((acc, curr) => acc + curr.percentage, 0) / plottedDays.length)
      : 0;

  // Chart coordinates calculation
  const svgWidth = 840;
  const svgHeight = 240;
  const xStart = 75;
  const xEnd = 800;
  const yBottom = 200;
  const yTop = 40;
  const ySpan = yBottom - yTop; // 160px for 0-100%

  const numDays = plottedDays.length;
  const xSpan = numDays > 1 ? (xEnd - xStart) / (numDays - 1) : 0;

  const points = plottedDays.map((pt, i) => {
    const x = numDays === 1 ? (xStart + xEnd) / 2 : xStart + i * xSpan;
    const y = yBottom - (pt.percentage / 100) * ySpan;
    return { ...pt, x, y };
  });

  const polylineCoords = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Quick handler to toggle or increment a day
  const handleDayCardClick = (dayNum: number) => {
    if (onToggleDay) {
      onToggleDay(dayNum);
    } else if (onUpdateDayScore) {
      const current = dayMatrix.find((d) => d.dayNumber === dayNum);
      const nextScore = (current?.scorePercent || 0) >= 80 ? 0 : 88;
      onUpdateDayScore(dayNum, nextScore);
    }
  };

  return (
    <section className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] p-4 sm:p-5 space-y-4 print:shadow-none print:border-2 print:border-black print:p-2 print:space-y-2">
      
      {/* 1. Header Bar: Title + 80% Threshold Legend + Scope Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm">
            02
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-black text-black uppercase tracking-tight flex items-center gap-2">
              <span>AUTOMATED ACTIVITY PROGRESS GRAPH (TILL LAST DAY)</span>
              <span className="text-[10px] bg-[#ccff00] text-black px-1.5 py-0.5 border border-black font-bold hidden sm:inline-block">
                80% BENCHMARK
              </span>
            </h3>
            <div className="font-mono text-[11px] text-zinc-600 font-bold">
              DYNAMIC ADHERENCE CURVE WITH RED 80% TARGET THRESHOLD (MINIMUM SUCCESS BENCHMARK)
            </div>
          </div>
        </div>

        {/* Legend & Summary Badges */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2 py-0.5">
            <span className="w-3 h-0.5 bg-red-600 border border-red-600 inline-block" />
            <span className="font-bold text-red-600 text-[11px]">80% TARGET LINE</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#f4fde8] border border-black px-2 py-0.5">
            <span className="w-2.5 h-2.5 bg-[#ccff00] border border-black inline-block" />
            <span className="font-bold text-black text-[11px]">
              &ge; 80% PASS ({passingCount}/{plottedDays.length})
            </span>
          </div>

          <div className="hidden sm:block font-bold text-zinc-700 text-[11px] bg-zinc-100 border border-zinc-300 px-2 py-0.5">
            AVG SCORE: <span className="font-black text-black">{overallAvg}%</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive View Scope Filter Strip (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden font-mono text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black uppercase text-zinc-500 mr-1 text-[11px] flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-black" />
            <span>SCOPE:</span>
          </span>

          {[
            { id: '7days', label: '7-DAY WEEKLY CYCLE' },
            { id: '14days', label: '14-DAY SPRINT (TILL LAST DAY)' },
            { id: 'phase1', label: 'PHASE 1 (1–30)' },
            { id: 'phase2', label: 'PHASE 2 (31–60)' },
            { id: 'phase3', label: 'PHASE 3 (61–90)' },
            { id: 'all90', label: 'ALL 90 DAYS' },
          ].map((scope) => {
            const isSelected = selectedScope === scope.id;
            return (
              <button
                key={scope.id}
                onClick={() => setSelectedScope(scope.id as GraphViewScope)}
                className={`px-2.5 py-1 border border-black font-bold uppercase transition-all cursor-pointer text-[11px] ${
                  isSelected
                    ? 'bg-black text-[#ccff00] shadow-[2px_2px_0px_#000000]'
                    : 'bg-white text-black hover:bg-zinc-100'
                }`}
              >
                {scope.label}
              </button>
            );
          })}
        </div>

        {/* Quick Testing Actions */}
        <div className="flex items-center gap-1.5">
          {onLoadDemoPass && (
            <button
              onClick={onLoadDemoPass}
              className="px-2 py-1 border border-black bg-white hover:bg-zinc-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Load 80% passing benchmark day"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Demo 80%</span>
            </button>
          )}

          {onLoadSampleTrajectory && (
            <button
              onClick={onLoadSampleTrajectory}
              className="px-2 py-1 border border-black bg-white hover:bg-zinc-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Load complete 90-day trajectory"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Full Trajectory</span>
            </button>
          )}

          {onClearMatrix && (
            <button
              onClick={onClearMatrix}
              className="px-2 py-1 border border-black bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              title="Reset matrix to 0% clean slate"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset 0%</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Interactive SVG Progress Graph */}
      <div className="w-full bg-[#fafaf8] border-2 border-black p-3 sm:p-4 overflow-x-auto print:bg-white print:border-black print:p-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 select-none min-w-[550px]"
          preserveAspectRatio="none"
        >
          {/* Phase Color Bandings for multi-phase views */}
          {(selectedScope === 'all90' || selectedScope === '14days') && (
            <g>
              <rect x={xStart} y={yTop} width={xEnd - xStart} height={ySpan} fill="#ffffff" />
            </g>
          )}

          {/* Background Grid Lines (0%, 20%, 40%, 60%, 80%, 100%) */}
          {[0, 20, 40, 60, 80, 100].map((pct) => {
            const y = yBottom - (pct / 100) * ySpan;
            const is80 = pct === 80;
            return (
              <g key={pct}>
                <line
                  x1="45"
                  y1={y}
                  x2={xEnd + 20}
                  y2={y}
                  stroke={is80 ? '#dc2626' : '#e5e7eb'}
                  strokeWidth={is80 ? 2 : 1}
                  strokeDasharray={is80 ? '6 4' : undefined}
                />
                <text
                  x="38"
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={is80 ? 'bold' : 'normal'}
                  fill={is80 ? '#dc2626' : '#6b7280'}
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* 80% Threshold Line Label */}
          <text
            x="55"
            y={yBottom - (80 / 100) * ySpan - 6}
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            fill="#dc2626"
          >
            80% MINIMUM SUCCESS REQUIREMENT
          </text>

          {/* Plot Points & Connecting Line */}
          {points.length > 0 && (
            <g>
              {/* Area under curve fill */}
              <polygon
                points={`${points[0].x},${yBottom} ${polylineCoords} ${points[points.length - 1].x},${yBottom}`}
                fill="#ccff00"
                fillOpacity="0.22"
              />

              {/* Connecting Line */}
              <polyline
                fill="none"
                stroke="#000000"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polylineCoords}
              />

              {/* Individual Day Circles and Labels */}
              {points.map((p, idx) => {
                const isPassing = p.percentage >= 80;
                const isDense = numDays > 30;
                const showText = !isDense || idx % 3 === 0 || idx === numDays - 1;

                return (
                  <g
                    key={p.dayNumber}
                    className="cursor-pointer group"
                    onClick={() => handleDayCardClick(p.dayNumber)}
                    onMouseEnter={() => setHoveredDay(p)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Pulsing hover halo */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isDense ? '4' : '7'}
                      fill={isPassing ? '#16a34a' : '#dc2626'}
                      stroke="#000000"
                      strokeWidth={isDense ? '1.5' : '2'}
                      className="group-hover:scale-125 transition-transform"
                    />

                    {/* Percentage Text above */}
                    {showText && (
                      <text
                        x={p.x}
                        y={p.y - (isDense ? 8 : 11)}
                        textAnchor="middle"
                        fontSize={isDense ? '9' : '10.5'}
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#000000"
                      >
                        {p.percentage}%
                      </text>
                    )}

                    {/* Day Label below axis */}
                    {showText && (
                      <text
                        x={p.x}
                        y={yBottom + 18}
                        textAnchor="middle"
                        fontSize={isDense ? '8.5' : '9.5'}
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#000000"
                      >
                        {p.shortLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* 4. Graph Days Log Strip (Cards for Each Day) */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex items-center justify-between text-[11px] text-zinc-600 font-bold border-b border-black pb-1">
          <span className="uppercase text-black">
            DAY-BY-DAY AUDIT TRAIL // CLICK ANY CARD TO TOGGLE 80% PASS STATUS
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            SHOWING {plottedDays.length} DAYS · MINIMUM 80% COMPLIANCE
          </span>
        </div>

        <div className={`grid gap-2 ${
          plottedDays.length <= 7
            ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7'
            : plottedDays.length <= 14
            ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
            : 'grid-cols-3 sm:grid-cols-5 md:grid-cols-10'
        }`}>
          {plottedDays.map((d) => {
            const pass = d.isPassing;
            return (
              <div
                key={d.dayNumber}
                onClick={() => handleDayCardClick(d.dayNumber)}
                className={`border-2 border-black p-2 transition-all cursor-pointer select-none ${
                  pass
                    ? 'bg-[#f4fde8] hover:bg-[#e8fad1] shadow-[2px_2px_0px_#000000]'
                    : 'bg-[#fff5f5] hover:bg-[#ffecec] shadow-[2px_2px_0px_#000000]'
                }`}
                title={`Day ${d.dayNumber}: ${d.percentage}% - Click to toggle pass status`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-700">
                  <span className="truncate">{d.dayLabel}</span>
                  <span className="text-[8.5px] px-1 bg-black text-white font-bold">
                    P{d.phase}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-black text-base sm:text-lg text-black">{d.percentage}%</span>
                  <span
                    className={`text-[9.5px] font-black px-1 py-0.2 border ${
                      pass
                        ? 'border-emerald-700 bg-emerald-100 text-emerald-900'
                        : 'border-rose-700 bg-rose-100 text-rose-900'
                    }`}
                  >
                    {pass ? 'PASS' : '< 80%'}
                  </span>
                </div>

                <div className="text-[9px] text-zinc-600 mt-1 font-medium flex items-center justify-between">
                  <span>{d.completedCount}/{d.totalCount} slots</span>
                  <span className="text-zinc-400">P{d.phase}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Paper Print Verification Block at the Last of Progress Graph */}
      <div className="border-t-2 border-black bg-[#fafaf8] p-3 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:bg-white print:p-2">
        <div className="text-[11px] text-zinc-700 font-bold">
          <div>AUTOMATED PROGRESS STANDARD: &ge; 80% SUCCESS BENCHMARK</div>
          <div className="text-zinc-500 text-[10px]">
            Ball Pen Mandate: Mark daily curve coordinates with a black ballpoint pen at the close of day.
          </div>
        </div>

        <div className="flex items-center gap-4 font-bold text-black text-[11px]">
          <div>
            TOTAL PASSED DAYS:{' '}
            <span className="border-b-2 border-black px-2 inline-block font-black">
              {passingCount} / {plottedDays.length}
            </span>
          </div>
          <div>
            ADHERENCE RATING:{' '}
            <span className="border-b-2 border-black px-2 inline-block font-black">
              {overallAvg >= 80 ? 'EXCELLENT (PASS)' : 'RECOVERY REQUIRED'}
            </span>
          </div>
        </div>
      </div>

    </section>
  );
};
