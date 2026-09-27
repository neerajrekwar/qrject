'use client';

import React, { useState, useMemo, useSyncExternalStore } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Zap,
  Target,
  Sparkles,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { WinterArcDayRecord } from '@/lib/winter-arc-engine';

interface WinterArcProgressionChartProps {
  dayMatrix: WinterArcDayRecord[];
  activePhaseFilter: 0 | 1 | 2 | 3; // 0 = all, 1 = P1, 2 = P2, 3 = P3
  onUpdateDayScore?: (dayNumber: number, score: number) => void;
  onLoadSampleTrajectory?: () => void;
  onClearMatrix?: () => void;
  current24hPercent?: number;
}

interface ChartDataPoint {
  dayNumber: number;
  dayLabel: string;
  scorePercent: number;
  phase: 1 | 2 | 3;
  phaseName: string;
  isPassed: boolean;
  benchmark: number;
  rollingAvg: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartDataPoint }>;
  label?: string | number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const isPassed = data.scorePercent >= 80;

  return (
    <div className="border-2 border-black bg-white p-3 font-mono shadow-[4px_4px_0px_#000000] text-xs space-y-1.5 z-50 min-w-[210px]">
      <div className="flex items-center justify-between border-b border-black pb-1">
        <span className="font-black text-black">DAY {data.dayNumber.toString().padStart(2, '0')} OF 90</span>
        <span className="text-[10px] px-1.5 py-0.5 bg-black text-[#ccff00] font-black">
          PHASE {data.phase}
        </span>
      </div>

      <div className="text-[10px] text-zinc-600 font-bold uppercase">
        {data.phaseName}
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <span className="text-zinc-600 font-bold text-[11px]">DAILY SCORE:</span>
        <span className={`text-base font-black ${isPassed ? 'text-emerald-800' : 'text-zinc-800'}`}>
          {data.scorePercent}%
        </span>
      </div>

      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-zinc-500">80% BENCHMARK:</span>
        <span className={`px-1 py-0.5 border ${
          isPassed ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-rose-600 bg-rose-50 text-rose-800'
        }`}>
          {isPassed ? 'PASSED [✓]' : 'DEFICIT [<80%]'}
        </span>
      </div>

      {data.rollingAvg > 0 && (
        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5 border-t border-zinc-200">
          <span>7-DAY TREND AVG:</span>
          <span className="font-bold text-black">{data.rollingAvg}%</span>
        </div>
      )}
    </div>
  );
};

const emptySubscribe = () => () => {};

export const WinterArcProgressionChart: React.FC<WinterArcProgressionChartProps> = ({
  dayMatrix,
  activePhaseFilter,
  onLoadSampleTrajectory,
  onClearMatrix,
}) => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [viewScope, setViewScope] = useState<'all' | 'filtered'>('all');
  const [showRollingAverage, setShowRollingAverage] = useState<boolean>(true);

  // Format data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return dayMatrix.map((item, index) => {
      // Calculate 7-day rolling average for trendline
      const startIdx = Math.max(0, index - 6);
      const windowItems = dayMatrix.slice(startIdx, index + 1);
      const sum = windowItems.reduce((acc, curr) => acc + (curr.scorePercent || 0), 0);
      const rollingAvg = Math.round(sum / windowItems.length);

      let phaseName = 'Phase 1: The Foundation';
      if (item.phase === 2) phaseName = 'Phase 2: The Crucible';
      if (item.phase === 3) phaseName = 'Phase 3: Ascendance';

      return {
        dayNumber: item.dayNumber,
        dayLabel: `D${item.dayNumber}`,
        scorePercent: item.scorePercent || 0,
        phase: item.phase,
        phaseName,
        isPassed: (item.scorePercent || 0) >= 80,
        benchmark: 80,
        rollingAvg,
      };
    });
  }, [dayMatrix]);

  // Apply filtering based on selected phase if user toggles filtered scope
  const displayedData = useMemo(() => {
    if (viewScope === 'filtered' && activePhaseFilter !== 0) {
      return chartData.filter((d) => d.phase === activePhaseFilter);
    }
    return chartData;
  }, [chartData, viewScope, activePhaseFilter]);

  // Aggregate Metrics across phases
  const metrics = useMemo(() => {
    const daysWithScore = dayMatrix.filter((d) => (d.scorePercent || 0) > 0);
    const passingDays = dayMatrix.filter((d) => (d.scorePercent || 0) >= 80);

    const calcPhaseStats = (phaseNum: 1 | 2 | 3) => {
      const pDays = dayMatrix.filter((d) => d.phase === phaseNum);
      const pScored = pDays.filter((d) => (d.scorePercent || 0) > 0);
      const pPassed = pDays.filter((d) => (d.scorePercent || 0) >= 80);
      const avg = pScored.length > 0
        ? Math.round(pScored.reduce((a, b) => a + (b.scorePercent || 0), 0) / pScored.length)
        : 0;
      return { total: 30, scored: pScored.length, passed: pPassed.length, avg };
    };

    const p1 = calcPhaseStats(1);
    const p2 = calcPhaseStats(2);
    const p3 = calcPhaseStats(3);

    const overallAvg = daysWithScore.length > 0
      ? Math.round(daysWithScore.reduce((a, b) => a + (b.scorePercent || 0), 0) / daysWithScore.length)
      : 0;

    // Calculate longest consecutive passing streak
    let maxStreak = 0;
    let currStreak = 0;
    dayMatrix.forEach((d) => {
      if ((d.scorePercent || 0) >= 80) {
        currStreak += 1;
        if (currStreak > maxStreak) maxStreak = currStreak;
      } else {
        currStreak = 0;
      }
    });

    return {
      totalDays: 90,
      passingDays: passingDays.length,
      passingPercent: Math.round((passingDays.length / 90) * 100),
      overallAvg,
      maxStreak,
      phase1: p1,
      phase2: p2,
      phase3: p3,
    };
  }, [dayMatrix]);

  return (
    <div className="border-2 border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000000] space-y-4 print:hidden">
      
      {/* Chart Top Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-black pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-black bg-[#ccff00] text-black flex items-center justify-center font-mono font-black text-sm shadow-[2px_2px_0px_#000000]">
              <TrendingUp className="w-4 h-4 text-black" />
            </div>
            <h4 className="font-mono text-sm sm:text-base font-black text-black uppercase tracking-tight">
              90-DAY PROGRESSION LINE CHART // DAILY ADHERENCE &amp; PHASE TRENDS
            </h4>
          </div>
          <p className="font-mono text-xs text-zinc-600">
            Interactive Recharts telemetry visualizing the athlete&apos;s daily score trajectory across Phase 1, Phase 2, and Phase 3 relative to the 80% passing benchmark.
          </p>
        </div>

        {/* View Mode & Preset Actions */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Zoom toggle if a filter is active */}
          {activePhaseFilter !== 0 && (
            <button
              onClick={() => setViewScope(viewScope === 'all' ? 'filtered' : 'all')}
              className="px-2.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 font-black text-black shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{viewScope === 'all' ? `FOCUS PHASE ${activePhaseFilter}` : 'SHOW ALL 90 DAYS'}</span>
            </button>
          )}

          {/* Toggle 7-Day Trend Line */}
          <button
            onClick={() => setShowRollingAverage(!showRollingAverage)}
            className={`px-2.5 py-1.5 border-2 border-black font-black text-xs shadow-[2px_2px_0px_#000000] cursor-pointer flex items-center gap-1.5 ${
              showRollingAverage ? 'bg-black text-[#ccff00]' : 'bg-white text-black hover:bg-zinc-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>7-DAY TRENDLINE {showRollingAverage ? '[ON]' : '[OFF]'}</span>
          </button>

          {/* Load Realistic 90-Day Sample Trajectory */}
          {onLoadSampleTrajectory && (
            <button
              onClick={onLoadSampleTrajectory}
              className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-black text-black shadow-[2px_2px_0px_#000000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
              title="Populate an authentic athlete 90-day trajectory showing phase progression"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>SIMULATE 90-DAY TRAJECTORY</span>
            </button>
          )}

          {/* Clear Chart */}
          {onClearMatrix && (
            <button
              onClick={onClearMatrix}
              className="px-2.5 py-1.5 border-2 border-black bg-white hover:bg-red-50 text-zinc-700 hover:text-red-700 font-bold shadow-[2px_2px_0px_#000000] active:shadow-none cursor-pointer"
              title="Reset matrix data to 0%"
            >
              RESET
            </button>
          )}
        </div>
      </div>

      {/* Analytical KPI Score Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
        
        {/* Metric 1: Overall Average */}
        <div className="border border-black bg-[#fafaf8] p-2.5 space-y-0.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase flex items-center justify-between">
            <span>90D AVG SCORE</span>
            <Target className="w-3 h-3 text-zinc-700" />
          </div>
          <div className="text-xl font-black text-black">
            {metrics.overallAvg}%
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            {metrics.overallAvg >= 80 ? 'Target Passed' : 'Target Deficit'}
          </div>
        </div>

        {/* Metric 2: Passing Days */}
        <div className="border border-black bg-[#fafaf8] p-2.5 space-y-0.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase flex items-center justify-between">
            <span>&ge; 80% DAYS MET</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-emerald-900">
            {metrics.passingDays}<span className="text-xs text-zinc-500 font-bold">/90</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            {metrics.passingPercent}% of Challenge
          </div>
        </div>

        {/* Metric 3: Max Consecutive Streak */}
        <div className="border border-black bg-[#fafaf8] p-2.5 space-y-0.5">
          <div className="text-[10px] text-zinc-500 font-bold uppercase flex items-center justify-between">
            <span>BEST 80%+ STREAK</span>
            <Zap className="w-3 h-3 text-amber-600" />
          </div>
          <div className="text-xl font-black text-black">
            {metrics.maxStreak} <span className="text-xs text-zinc-500 font-bold">DAYS</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            Consecutive standard
          </div>
        </div>

        {/* Metric 4: Phase 1 Avg */}
        <div className="border border-black bg-white p-2.5 space-y-0.5 border-l-4 border-l-blue-600">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">
            P1: FOUNDATION
          </div>
          <div className="text-lg font-black text-black">
            {metrics.phase1.avg}% <span className="text-[10px] text-zinc-500 font-bold">avg</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            {metrics.phase1.passed}/30 Days (&ge;80%)
          </div>
        </div>

        {/* Metric 5: Phase 2 Avg */}
        <div className="border border-black bg-white p-2.5 space-y-0.5 border-l-4 border-l-amber-600">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">
            P2: CRUCIBLE
          </div>
          <div className="text-lg font-black text-black">
            {metrics.phase2.avg}% <span className="text-[10px] text-zinc-500 font-bold">avg</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            {metrics.phase2.passed}/30 Days (&ge;80%)
          </div>
        </div>

        {/* Metric 6: Phase 3 Avg */}
        <div className="border border-black bg-white p-2.5 space-y-0.5 border-l-4 border-l-[#ccff00]">
          <div className="text-[10px] text-zinc-500 font-bold uppercase">
            P3: ASCENDANCE
          </div>
          <div className="text-lg font-black text-black">
            {metrics.phase3.avg}% <span className="text-[10px] text-zinc-500 font-bold">avg</span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            {metrics.phase3.passed}/30 Days (&ge;80%)
          </div>
        </div>

      </div>

      {/* Main Recharts Visualization Area */}
      <div className="border-2 border-black bg-[#fefefe] p-3 pt-6 relative">
        
        {/* Phase Region Labels Bar */}
        {viewScope === 'all' && (
          <div className="grid grid-cols-3 text-center font-mono text-[11px] font-black uppercase pb-2 mb-2 border-b border-zinc-200">
            <div className="text-blue-900 bg-blue-50 py-1 border-r border-black">
              PHASE 1: THE FOUNDATION (DAYS 01 - 30)
            </div>
            <div className="text-amber-900 bg-amber-50 py-1 border-r border-black">
              PHASE 2: THE CRUCIBLE (DAYS 31 - 60)
            </div>
            <div className="text-zinc-900 bg-[#f4fee0] py-1">
              PHASE 3: ASCENDANCE (DAYS 61 - 90)
            </div>
          </div>
        )}

        {/* Recharts Container */}
        <div className="w-full h-72 sm:h-80">
          {!isMounted ? (
            <div className="w-full h-full flex items-center justify-center font-mono text-xs text-zinc-500">
              Loading Recharts engine...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={displayedData}
                margin={{ top: 10, right: 20, left: -15, bottom: 20 }}
              >
                <defs>
                  {/* Gradient fill under score line */}
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccff00" stopOpacity={0.65} />
                    <stop offset="95%" stopColor="#ccff00" stopOpacity={0.05} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" vertical={false} />

                {/* X Axis: Days */}
                <XAxis
                  dataKey="dayNumber"
                  tickLine={{ stroke: '#000000' }}
                  axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
                  interval={viewScope === 'all' ? 4 : 1}
                  tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  tickFormatter={(val: number) => `D${val.toString().padStart(2, '0')}`}
                />

                {/* Y Axis: Percentage 0 to 100% */}
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  tickLine={{ stroke: '#000000' }}
                  axisLine={{ stroke: '#000000', strokeWidth: 1.5 }}
                  tick={{ fontFamily: 'monospace', fontSize: 10, fill: '#000000', fontWeight: 'bold' }}
                  tickFormatter={(val: number) => `${val}%`}
                />

                <Tooltip content={<CustomTooltip />} />

                {/* 80% Non-Negotiable Standard Reference Line */}
                <ReferenceLine
                  y={80}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{
                    value: '80% ADHERENCE BENCHMARK',
                    position: 'insideTopRight',
                    fill: '#dc2626',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    fontWeight: 900,
                  }}
                />

                {/* Phase Boundary Reference Lines (at Day 30 and Day 60) */}
                {viewScope === 'all' && (
                  <>
                    <ReferenceLine
                      x={30}
                      stroke="#000000"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      label={{
                        value: 'PHASE 1/2 BOUNDARY',
                        position: 'insideTopLeft',
                        fill: '#555555',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                    <ReferenceLine
                      x={60}
                      stroke="#000000"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      label={{
                        value: 'PHASE 2/3 BOUNDARY',
                        position: 'insideTopLeft',
                        fill: '#555555',
                        fontSize: 9,
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    />
                  </>
                )}

                {/* Area under the line */}
                <Area
                  type="monotone"
                  dataKey="scorePercent"
                  stroke="none"
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                />

                {/* 7-Day Rolling Trendline */}
                {showRollingAverage && (
                  <Line
                    type="monotone"
                    dataKey="rollingAvg"
                    stroke="#1e3a8a"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="7-Day Trend"
                  />
                )}

                {/* Main Daily Score Line */}
                <Line
                  type="monotone"
                  dataKey="scorePercent"
                  stroke="#000000"
                  strokeWidth={2.5}
                  dot={{
                    r: 2.5,
                    stroke: '#000000',
                    strokeWidth: 1.5,
                    fill: '#ccff00',
                  }}
                  activeDot={{
                    r: 6,
                    stroke: '#000000',
                    strokeWidth: 2,
                    fill: '#ccff00',
                  }}
                  name="Daily Score %"
                />

              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend and Interpretation Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-black font-mono text-[11px] text-black">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="w-3 h-3 bg-[#ccff00] border border-black inline-block" />
              <span>Daily Adherence Score %</span>
            </div>

            {showRollingAverage && (
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-blue-900 inline-block" />
                <span>7-Day Rolling Trendline</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 font-bold text-red-700">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-red-600 inline-block" />
              <span>80% Minimum Standard Threshold</span>
            </div>
          </div>

          <div className="font-bold text-zinc-500 text-[10px]">
            *CLICK ANY DAY IN MATRIX BELOW TO ADJUST DIGITAL CHECK &amp; SCORE
          </div>
        </div>

      </div>

    </div>
  );
};
