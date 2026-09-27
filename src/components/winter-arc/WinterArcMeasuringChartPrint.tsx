'use client';

import React from 'react';
import { WinterArcDayRecord, WinterArcPrintStyle, WinterArcGoalStandard } from '@/lib/winter-arc-engine';
import { PenTool, Award } from 'lucide-react';

interface WinterArcMeasuringChartPrintProps {
  athleteName: string;
  challengeTitle: string;
  dayMatrix: WinterArcDayRecord[];
  printStyle: WinterArcPrintStyle;
  standards?: WinterArcGoalStandard[];
  isStandalone?: boolean;
}

// 13 Weeks definition for 90 days
const WEEKS_DATA = [
  { week: 'W01', phase: 1, days: 'Days 01–07', daysCount: 7 },
  { week: 'W02', phase: 1, days: 'Days 08–14', daysCount: 7 },
  { week: 'W03', phase: 1, days: 'Days 15–21', daysCount: 7 },
  { week: 'W04', phase: 1, days: 'Days 22–28', daysCount: 7 },
  { week: 'W05', phase: 1, days: 'Days 29–35', daysCount: 7 },
  { week: 'W06', phase: 2, days: 'Days 36–42', daysCount: 7 },
  { week: 'W07', phase: 2, days: 'Days 43–49', daysCount: 7 },
  { week: 'W08', phase: 2, days: 'Days 50–56', daysCount: 7 },
  { week: 'W09', phase: 2, days: 'Days 57–63', daysCount: 7 },
  { week: 'W10', phase: 3, days: 'Days 64–70', daysCount: 7 },
  { week: 'W11', phase: 3, days: 'Days 71–77', daysCount: 7 },
  { week: 'W12', phase: 3, days: 'Days 78–84', daysCount: 7 },
  { week: 'W13', phase: 3, days: 'Days 85–90', daysCount: 6 },
];

export const WinterArcMeasuringChartPrint: React.FC<WinterArcMeasuringChartPrintProps> = ({
  athleteName,
  challengeTitle,
  dayMatrix,
  printStyle,
  standards,
  isStandalone = false,
}) => {
  // SVG Chart Dimensions
  const chartW = 920;
  const chartH = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 25;
  const padBottom = 30;

  const innerW = chartW - padLeft - padRight;
  const innerH = chartH - padTop - padBottom;

  // Map 90 days horizontally
  const getX = (dayNum: number) => {
    return padLeft + ((dayNum - 1) / 89) * innerW;
  };

  // Map 0 - 100% vertically
  const getY = (percent: number) => {
    return padTop + innerH - (percent / 100) * innerH;
  };

  // Construct SVG path for digital checks if active
  const hasDigitalChecks = printStyle === 'with_digital_checks';
  const plottedPoints = dayMatrix.map((d) => ({
    x: getX(d.dayNumber),
    y: getY(d.scorePercent || 0),
    dayNumber: d.dayNumber,
    score: d.scorePercent || 0,
    isPassed: (d.scorePercent || 0) >= 80,
    hasScore: (d.scorePercent || 0) > 0,
  }));

  const svgLinePath = plottedPoints
    .filter((p) => p.hasScore)
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Y-axis ticks
  const yTicks = [0, 20, 40, 60, 80, 100];

  return (
    <div
      className={`print-attached-measuring-page border-4 border-black bg-white p-5 text-black font-mono shadow-[6px_6px_0px_#000000] space-y-4 print:border-2 print:shadow-none print:p-2 print:space-y-2.5 ${
        isStandalone ? 'mt-0' : 'mt-8'
      }`}
    >
      {/* 1. Header Bar */}
      <div className="border-b-2 border-black bg-black text-[#ccff00] p-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 border border-[#ccff00] bg-black text-[#ccff00] flex items-center justify-center font-black text-sm">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
              WINTER ARC 2026 // PROGRESS REPORT RAW MEASURING CHART &amp; ATTESTATION LOG
            </h2>
            <div className="text-[10px] text-[#ccff00] font-bold tracking-wider">
              ATTACHED LAST PAGE · SPECIFICATION FOR MANUAL BLACK BALLPOINT PEN RECORDING &amp; PHYSICAL MEASUREMENT
            </div>
          </div>
        </div>

        <div className="text-right text-[10px] font-bold text-white border-l border-zinc-700 pl-3 hidden sm:block">
          <div>OCTOBER 01 – DECEMBER 31, 2026</div>
          <div className="text-[#ccff00]">80% NON-NEGOTIABLE STANDARD</div>
        </div>
      </div>

      {/* 2. Athlete Information & Protocol Specification Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-2 border-black bg-[#fafaf8] p-2.5 text-xs">
        <div>
          <span className="text-[9px] text-zinc-500 font-bold block uppercase">ATHLETE NAME</span>
          <span className="font-black text-black text-xs uppercase">{athleteName || 'NEERAJ REKWAR'}</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 font-bold block uppercase">CHALLENGE TITLE</span>
          <span className="font-black text-black text-xs truncate block">{challengeTitle}</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 font-bold block uppercase">PASSING CRITERION</span>
          <span className="font-black text-emerald-800 text-xs">&ge; 80% DAILY ADHERENCE</span>
        </div>
        <div>
          <span className="text-[9px] text-zinc-500 font-bold block uppercase">MANUAL PEN PROTOCOL</span>
          <span className="font-black text-black text-xs">BLACK BALLPOINT PEN ONLY</span>
        </div>
      </div>

      {/* 3. Raw Trend Coordinate Measuring Chart Grid */}
      <div className="border-2 border-black bg-[#fefefe] p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black pb-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#ccff00] px-1.5 py-0.5 text-[10px] font-black uppercase">
              COORDINATE GRID 01
            </span>
            <span className="font-black text-xs uppercase tracking-tight text-black">
              DAILY SCORE PERCENTAGE PLOTTING SYSTEM (DAYS 01 – 90)
            </span>
          </div>
          <div className="text-[10px] text-zinc-600 font-bold">
            X-AXIS: DAYS 01-90 · Y-AXIS: SCORE 0-100% · RED LINE: 80% PASS THRESHOLD
          </div>
        </div>

        {/* Phase Header Bands */}
        <div className="grid grid-cols-3 text-center text-[10px] font-black uppercase border border-black">
          <div className="bg-blue-50 py-1 border-r border-black text-blue-900">
            PHASE 1: THE FOUNDATION (DAYS 01 – 30)
          </div>
          <div className="bg-amber-50 py-1 border-r border-black text-amber-900">
            PHASE 2: THE CRUCIBLE (DAYS 31 – 60)
          </div>
          <div className="bg-[#f2fee0] py-1 text-emerald-950">
            PHASE 3: ASCENDANCE (DAYS 61 – 90)
          </div>
        </div>

        {/* SVG Coordinate Grid */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full h-auto min-w-[700px] border border-zinc-300 bg-white"
          >
            {/* Background Phase Shading */}
            <rect
              x={getX(1)}
              y={padTop}
              width={getX(30) - getX(1)}
              height={innerH}
              fill="#f8fafc"
              opacity="0.8"
            />
            <rect
              x={getX(31)}
              y={padTop}
              width={getX(60) - getX(31)}
              height={innerH}
              fill="#fffbeb"
              opacity="0.8"
            />
            <rect
              x={getX(61)}
              y={padTop}
              width={getX(90) - getX(61)}
              height={innerH}
              fill="#f7fee7"
              opacity="0.8"
            />

            {/* Horizontal Grid lines & Y-ticks */}
            {yTicks.map((yVal) => {
              const yPos = getY(yVal);
              const is80 = yVal === 80;
              return (
                <g key={`y-${yVal}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={chartW - padRight}
                    y2={yPos}
                    stroke={is80 ? '#dc2626' : '#e2e8f0'}
                    strokeWidth={is80 ? 2 : 0.8}
                    strokeDasharray={is80 ? '4 3' : undefined}
                  />
                  <text
                    x={padLeft - 6}
                    y={yPos + 3.5}
                    textAnchor="end"
                    fontSize={is80 ? '10' : '8'}
                    fontFamily="monospace"
                    fontWeight={is80 ? '900' : 'bold'}
                    fill={is80 ? '#dc2626' : '#64748b'}
                  >
                    {yVal}%
                  </text>
                </g>
              );
            })}

            {/* 80% Non-negotiable standard label */}
            <text
              x={chartW - padRight - 8}
              y={getY(80) - 4}
              textAnchor="end"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="900"
              fill="#dc2626"
            >
              80% NON-NEGOTIABLE BENCHMARK LINE [PASSED ZONE &ge; 80%]
            </text>

            {/* Vertical Milestone lines for Phase boundaries (Day 30 and Day 60) */}
            <line
              x1={getX(30)}
              y1={padTop}
              x2={getX(30)}
              y2={chartH - padBottom}
              stroke="#000000"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            <line
              x1={getX(60)}
              y1={padTop}
              x2={getX(60)}
              y2={chartH - padBottom}
              stroke="#000000"
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />

            {/* Vertical Grid lines every 5 days */}
            {Array.from({ length: 19 }, (_, i) => (i === 0 ? 1 : i * 5)).map((dNum) => {
              const xPos = getX(dNum);
              return (
                <g key={`x-${dNum}`}>
                  <line
                    x1={xPos}
                    y1={padTop}
                    x2={xPos}
                    y2={chartH - padBottom}
                    stroke="#cbd5e1"
                    strokeWidth="0.6"
                  />
                  <line
                    x1={xPos}
                    y1={chartH - padBottom}
                    x2={xPos}
                    y2={chartH - padBottom + 4}
                    stroke="#000000"
                    strokeWidth="1"
                  />
                  <text
                    x={xPos}
                    y={chartH - padBottom + 14}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    fill="#000000"
                  >
                    D{dNum.toString().padStart(2, '0')}
                  </text>
                </g>
              );
            })}

            {/* Manual coordinate pen plotting circles across all 90 days */}
            {Array.from({ length: 90 }, (_, i) => i + 1).map((dNum) => {
              const xPos = getX(dNum);
              return (
                <g key={`marker-${dNum}`}>
                  {/* Small guide ticks on 80% line */}
                  <circle
                    cx={xPos}
                    cy={getY(80)}
                    r="1.2"
                    fill="#dc2626"
                    opacity="0.4"
                  />
                  {/* Subtle target dot at 0% */}
                  <circle
                    cx={xPos}
                    cy={getY(0)}
                    r="0.8"
                    fill="#94a3b8"
                  />
                </g>
              );
            })}

            {/* Digital Checks Line Plot (if with_digital_checks) */}
            {hasDigitalChecks && svgLinePath && (
              <>
                <path
                  d={svgLinePath}
                  fill="none"
                  stroke="#000000"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {plottedPoints
                  .filter((p) => p.hasScore)
                  .map((p) => (
                    <circle
                      key={`pt-${p.dayNumber}`}
                      cx={p.x}
                      cy={p.y}
                      r="2.5"
                      fill={p.isPassed ? '#ccff00' : '#000000'}
                      stroke="#000000"
                      strokeWidth="1.2"
                    />
                  ))}
              </>
            )}
          </svg>
        </div>

        {/* Manual Plotting Instructions Guide */}
        <div className="border border-black bg-[#fafaf8] p-2 text-[10px] grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex items-start gap-1.5">
            <span className="font-black text-sm">🖊️</span>
            <div>
              <span className="font-black uppercase block text-black">1. PLOT DAILY SCORE DOT</span>
              <span className="text-zinc-600">
                At nightly 21:00 review, mark a solid dot (•) at the intersection of Day and Adherence Score %.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <span className="font-black text-sm">📐</span>
            <div>
              <span className="font-black uppercase block text-black">2. DRAW TRENDLINE</span>
              <span className="text-zinc-600">
                Connect each daily dot to the next with a ruler or straight line. Maintain trajectory above the red 80% line.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-1.5">
            <span className="font-black text-sm">🛡️</span>
            <div>
              <span className="font-black uppercase block text-black">3. 80% DEFICIT RULE</span>
              <span className="text-zinc-600">
                Any point plotted below 80% triggers mandatory 24-Hour immediate correction and root-cause analysis.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Weekly Raw Compliance & Biometric Measurement Log (13 Weeks) */}
      <div className="border-2 border-black bg-white p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-black pb-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#ccff00] px-1.5 py-0.5 text-[10px] font-black uppercase">
              TABLE 02
            </span>
            <span className="font-black text-xs uppercase tracking-tight text-black">
              13-WEEK RAW COMPLIANCE &amp; BIOMETRIC MEASUREMENT LOG
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">
            RECORD RAW WEEKLY TOTALS &amp; PHYSICAL MEASUREMENTS WITH BLACK PEN
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-[10px] text-left">
            <thead>
              <tr className="bg-[#f0f0eb] border-b border-black font-black uppercase text-black">
                <th className="p-1.5 border-r border-black w-14">WEEK</th>
                <th className="p-1.5 border-r border-black w-24">DAYS SPAN</th>
                <th className="p-1.5 border-r border-black w-24">TARGET DAYS</th>
                <th className="p-1.5 border-r border-black w-24">ACTUAL MET</th>
                <th className="p-1.5 border-r border-black w-24">AVG SCORE %</th>
                <th className="p-1.5 border-r border-black">BODYWEIGHT (KG/LB)</th>
                <th className="p-1.5 border-r border-black">DEEP WORK (HRS)</th>
                <th className="p-1.5 border-r border-black w-28 text-center">80% STATUS</th>
                <th className="p-1.5 w-20 text-center">INITIALS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {WEEKS_DATA.map((w, idx) => (
                <tr
                  key={w.week}
                  className={`border-b border-black ${
                    idx % 2 === 1 ? 'bg-[#fafaf8]' : 'bg-white'
                  }`}
                >
                  <td className="p-1.5 font-black border-r border-black text-black">
                    {w.week} <span className="text-[8px] text-zinc-500 font-bold">P{w.phase}</span>
                  </td>
                  <td className="p-1.5 font-bold border-r border-black text-zinc-800">
                    {w.days}
                  </td>
                  <td className="p-1.5 font-bold border-r border-black text-zinc-600">
                    &ge; {w.daysCount === 7 ? '6 / 7 Days' : '5 / 6 Days'}
                  </td>
                  <td className="p-1.5 font-black border-r border-black text-black">
                    [ ____ / {w.daysCount} ]
                  </td>
                  <td className="p-1.5 font-black border-r border-black text-black">
                    [ _____ % ]
                  </td>
                  <td className="p-1.5 border-r border-black text-zinc-500">
                    ________________
                  </td>
                  <td className="p-1.5 border-r border-black text-zinc-500">
                    ________________
                  </td>
                  <td className="p-1.5 border-r border-black text-center font-bold">
                    <span className="inline-flex items-center gap-2">
                      <span>[ ] MET</span>
                      <span>[ ] DEF</span>
                    </span>
                  </td>
                  <td className="p-1.5 text-center text-zinc-500 font-bold">
                    ________
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. 4 Core Pillars Measurement Matrix (Milestone Checks) */}
      <div className="border-2 border-black bg-white p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-black pb-1.5">
          <div className="flex items-center gap-2">
            <span className="bg-black text-[#ccff00] px-1.5 py-0.5 text-[10px] font-black uppercase">
              TABLE 03
            </span>
            <span className="font-black text-xs uppercase tracking-tight text-black">
              4 CORE WINTER ARC PILLARS // QUANTITATIVE MILESTONE MEASURING MATRIX
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-bold">
            BASELINE &rarr; 30-DAY &rarr; 60-DAY &rarr; 90-DAY FINAL VERIFICATION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-[10px] text-left">
            <thead>
              <tr className="bg-[#f0f0eb] border-b border-black font-black uppercase text-black">
                <th className="p-1.5 border-r border-black w-48">PILLAR / CORE METRIC</th>
                <th className="p-1.5 border-r border-black w-40">STARTING BASELINE</th>
                <th className="p-1.5 border-r border-black w-40">DAY 30 CHECK (P1)</th>
                <th className="p-1.5 border-r border-black w-40">DAY 60 CHECK (P2)</th>
                <th className="p-1.5 border-r border-black w-44">DAY 90 TARGET STANDARD</th>
                <th className="p-1.5 w-24 text-center">FINAL STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {standards && standards.length > 0 ? (
                standards.map((std) => (
                  <tr key={std.id} className="border-b border-black">
                    <td className="p-1.5 font-black border-r border-black text-black">
                      {std.name}
                      <span className="block text-[8px] text-zinc-500 uppercase">{std.category}</span>
                    </td>
                    <td className="p-1.5 font-bold border-r border-black text-zinc-700">
                      {std.startingBaseline}
                    </td>
                    <td className="p-1.5 border-r border-black text-zinc-500">
                      [ ______________ ]
                    </td>
                    <td className="p-1.5 border-r border-black text-zinc-500">
                      [ ______________ ]
                    </td>
                    <td className="p-1.5 font-black border-r border-black text-emerald-900">
                      {std.targetStandard}
                    </td>
                    <td className="p-1.5 text-center font-bold">
                      [ ] MET
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-black border-r border-black text-black">
                      Body Composition &amp; Weight
                      <span className="block text-[8px] text-zinc-500 uppercase">Body Transformation</span>
                    </td>
                    <td className="p-1.5 font-bold border-r border-black text-zinc-700">82.5 kg / ~17% BF</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 font-black border-r border-black text-emerald-900">77.0 kg / 11-12% BF</td>
                    <td className="p-1.5 text-center font-bold">[ ] MET</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-black border-r border-black text-black">
                      Strength Compound Index (Bench / Squat / Deadlift)
                      <span className="block text-[8px] text-zinc-500 uppercase">Physical Training</span>
                    </td>
                    <td className="p-1.5 font-bold border-r border-black text-zinc-700">100 / 140 / 170 kg</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 font-black border-r border-black text-emerald-900">120 / 160 / 200 kg</td>
                    <td className="p-1.5 text-center font-bold">[ ] MET</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-black border-r border-black text-black">
                      Cognitive Deep Work Sprint
                      <span className="block text-[8px] text-zinc-500 uppercase">Deep Work &amp; Skill</span>
                    </td>
                    <td className="p-1.5 font-bold border-r border-black text-zinc-700">2.5 hrs sporadic</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 font-black border-r border-black text-emerald-900">5.0 hrs daily unbroken</td>
                    <td className="p-1.5 text-center font-bold">[ ] MET</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1.5 font-black border-r border-black text-black">
                      Discipline &amp; Sleep Schedule Lockdown
                      <span className="block text-[8px] text-zinc-500 uppercase">Mental Hardness</span>
                    </td>
                    <td className="p-1.5 font-bold border-r border-black text-zinc-700">Inconsistent / Snoozing</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 border-r border-black text-zinc-500">[ ______________ ]</td>
                    <td className="p-1.5 font-black border-r border-black text-emerald-900">05:00 Wake / 0 Snooze (90/90)</td>
                    <td className="p-1.5 text-center font-bold">[ ] MET</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Execution Attestation, Verification & Final Certification Block */}
      <div className="border-2 border-black bg-[#fafaf8] p-3 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-black pb-2 text-xs">
          <div>
            <div className="font-black text-black text-sm uppercase flex items-center gap-1.5">
              <Award className="w-4 h-4 text-black" />
              <span>FINAL 90-DAY WINTER ARC ATTESTATION &amp; ACCREDITATION</span>
            </div>
            <div className="text-zinc-600 text-[10px] mt-0.5">
              Official physical attestation. Mark with a black ballpoint pen upon completion of the 90-day challenge on December 31, 2026.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-bold text-xs">
            <div className="border border-black bg-white px-2.5 py-1">
              TOTAL DAYS &ge; 80%: <span className="font-black">[ _____ / 90 ]</span>
            </div>
            <div className="border border-black bg-white px-2.5 py-1">
              CHALLENGE AVG: <span className="font-black">[ _____ % ]</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
          {/* Col 1 */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">ACCREDITATION DECISION</span>
            <div className="space-y-1 text-[11px] font-black">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-black inline-block" />
                <span>CERTIFIED WINTER ARC FINISHER (&ge;80%)</span>
              </div>
              <div className="flex items-center gap-1.5 text-zinc-600">
                <span className="w-3.5 h-3.5 border-2 border-black inline-block" />
                <span>CHALLENGE INCOMPLETE (&lt;80%)</span>
              </div>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">ATHLETE SIGNATURE</span>
            <div className="border-b-2 border-black pb-1 text-[11px] font-bold text-zinc-500">
              Sign: ____________________________________
            </div>
            <div className="text-[9px] text-zinc-500 font-bold">
              DATE SIGNED: _____ / _____ / 2026
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block uppercase">WITNESS / ACCOUNTABILITY PARTNER</span>
            <div className="border-b-2 border-black pb-1 text-[11px] font-bold text-zinc-500">
              Sign: ____________________________________
            </div>
            <div className="text-[9px] text-zinc-500 font-bold">
              VERIFIED PHYSICAL LOG INTEGRITY
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
