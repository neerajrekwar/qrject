import { jsPDF } from 'jspdf';
import { insertDpiIntoPngBlob } from './qr-engine';

export type FitnessCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type PrintOrientationMode = 'auto' | 'portrait' | 'landscape';

export interface FitnessGoal {
  id: string;
  title: string;
  category: 'Strength' | 'Endurance' | 'Body Comp' | 'Nutrition' | 'Habits';
  cadence: FitnessCadence;
  baseline: number;
  current: number;
  target: number;
  unit: string;
  notes?: string;
  completed?: boolean;
}

export interface TimetableBlock {
  id: string;
  timeOrDay: string;
  title: string;
  activity: string;
  focus: string;
  targetMetric: string;
  completed: boolean;
  // Day-by-day checklist grid for multi-day habit tracking (Day 1 to 7 / Mon to Sun)
  dayChecks?: boolean[]; // length 7: [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
}

export interface DayProgressRecord {
  dayLabel: string;
  dateStr: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface FitnessGlassData {
  cadence: FitnessCadence;
  userName: string;
  planTitle: string;
  startDate: string;
  targetDate: string;
  timetable: Record<FitnessCadence, TimetableBlock[]>;
  goals: FitnessGoal[];
  orientationMode?: PrintOrientationMode;
  dayHistory?: DayProgressRecord[];
}

export interface Adherence80Stats {
  totalTasks: number;
  completedCount: number;
  completionRate: number; // 0 to 100
  minRequired80: number;  // Math.ceil(totalTasks * 0.8)
  isPassing80: boolean;
  tasksNeeded: number;
}

export const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const INITIAL_TIMETABLE: Record<FitnessCadence, TimetableBlock[]> = {
  daily: [
    { id: 'd-1', timeOrDay: '06:00 - 06:45', title: 'Fasted Zone 2 Cardio', activity: 'Incline treadmill walk or steady rowing', focus: 'Fat Oxidation & Aerobic Base', targetMetric: '45 mins (HR 125-135 bpm)', completed: true, dayChecks: [true, true, true, true, false, false, false] },
    { id: 'd-2', timeOrDay: '07:00 - 07:30', title: 'Mobility & Hydration', activity: 'Dynamic hip/thoracic drill + 1L water with sodium', focus: 'Joint Health & Priming', targetMetric: '1,000 ml water + 500mg Na', completed: true, dayChecks: [true, true, true, true, true, false, false] },
    { id: 'd-3', timeOrDay: '08:00 - 08:30', title: 'Morning Micronutrients', activity: 'Omega-3 (2g EPA), Vitamin D3+K2, Magnesium', focus: 'Immune & Cellular Energy', targetMetric: '100% adherence', completed: true, dayChecks: [true, true, true, true, true, true, false] },
    { id: 'd-4', timeOrDay: '12:00 - 13:15', title: 'Hypertrophy Resistance', activity: 'Compound Push & Core resistance protocol', focus: 'Mechanical Tension & Volume', targetMetric: '18 total working sets (RPE 8)', completed: true, dayChecks: [true, true, true, false, false, false, false] },
    { id: 'd-5', timeOrDay: '13:30 - 14:00', title: 'Post-Workout Fuel', activity: 'High-protein whole meal + 5g creatine', focus: 'Muscle Protein Synthesis', targetMetric: '50g Protein + 5g Creatine', completed: true, dayChecks: [true, true, true, true, false, false, false] },
    { id: 'd-6', timeOrDay: '15:30 - 15:45', title: 'Postural Decompression', activity: 'Dead hangs (3x60s) + hip flexor stretches', focus: 'Spinal Decompression', targetMetric: '3 mins total hang', completed: true, dayChecks: [true, true, false, false, false, false, false] },
    { id: 'd-7', timeOrDay: '18:00 - 18:45', title: 'NEAT Outdoor Walk', activity: 'Outdoor nature walk in sunlight', focus: 'Cortisol Reduction & NEAT', targetMetric: '5,000 steps', completed: true, dayChecks: [true, true, true, true, true, false, false] },
    { id: 'd-8', timeOrDay: '19:30 - 20:00', title: 'Whole-Food Dinner', activity: 'Lean protein + fibrous greens + complex carb', focus: 'Glycogen Replenishment', targetMetric: '45g Protein (<800 kcal)', completed: true, dayChecks: [true, true, true, false, false, false, false] },
    { id: 'd-9', timeOrDay: '21:00 - 21:30', title: 'Blue-Light Curfew', activity: 'Screen dimming, ambient amber light, book read', focus: 'Melatonin Secretion', targetMetric: 'Zero screens 60m pre-bed', completed: false, dayChecks: [true, false, false, false, false, false, false] },
    { id: 'd-10', timeOrDay: '22:00 - 06:00', title: 'Deep Recovery Sleep', activity: 'Darkroom cold environment, 18°C temperature', focus: 'Cellular Repair & GH Release', targetMetric: '8.0 Hours uninterrupted', completed: false, dayChecks: [true, true, true, true, false, false, false] },
  ],
  weekly: [
    { id: 'w-1', timeOrDay: 'MONDAY', title: 'Heavy Lower & Core', activity: 'Squat 5x5, RDL 4x8, Walking Lunges', focus: 'Posterior Chain & Quad Power', targetMetric: 'Top Squat 140kg x 5', completed: true, dayChecks: [true, false, false, false, false, false, false] },
    { id: 'w-2', timeOrDay: 'TUESDAY', title: 'Upper Push & Triceps', activity: 'Incline DB Press, Overhead Press, Dips', focus: 'Pectoral & Deltoid Hypertrophy', targetMetric: 'Incline DB 40kg x 8', completed: true, dayChecks: [false, true, false, false, false, false, false] },
    { id: 'w-3', timeOrDay: 'WEDNESDAY', title: 'Zone 2 Endurance & Core', activity: '10km Steady State Trail Run', focus: 'Mitochondrial Density', targetMetric: '10 km in < 55 mins', completed: true, dayChecks: [false, false, true, false, false, false, false] },
    { id: 'w-4', timeOrDay: 'THURSDAY', title: 'Heavy Pull & Biceps', activity: 'Barbell Rows, Weighted Pull-Ups, Face Pulls', focus: 'Upper Back Density & Scapular Control', targetMetric: '+20kg Pull-Ups x 6', completed: true, dayChecks: [false, false, false, true, false, false, false] },
    { id: 'w-5', timeOrDay: 'FRIDAY', title: 'Posterior Hypertrophy', activity: 'Deadlift 4x4, Leg Press, Hamstring Curls', focus: 'Maximal Strength & Posterior Drive', targetMetric: 'Deadlift 180kg x 4', completed: true, dayChecks: [false, false, false, false, true, false, false] },
    { id: 'w-6', timeOrDay: 'SATURDAY', title: 'VO2 Max Intervals', activity: '4x4 min Norwegian Protocol on Assault Bike', focus: 'Cardiorespiratory Peak Power', targetMetric: 'Peak HR > 185 bpm', completed: false, dayChecks: [false, false, false, false, false, false, false] },
    { id: 'w-7', timeOrDay: 'SUNDAY', title: 'Active Recovery & Saunas', activity: 'Contrast hydrotherapy, cold plunge, mobility flow', focus: 'Parasympathetic Reset', targetMetric: '30 mins sauna + 15 min stretch', completed: false, dayChecks: [false, false, false, false, false, false, false] },
  ],
  monthly: [
    { id: 'm-1', timeOrDay: 'WEEK 01', title: 'Volume Accumulation', activity: 'Introduce target mesocycle weights at RPE 7-8', focus: 'Neuromuscular Adaptation', targetMetric: '16 sets/muscle group', completed: true },
    { id: 'm-2', timeOrDay: 'WEEK 02', title: 'Progressive Overload', activity: 'Increase intensity +2.5% across compounds', focus: 'Strength Escalation', targetMetric: '18 sets/muscle group', completed: true },
    { id: 'm-3', timeOrDay: 'WEEK 03', title: 'Peak Intensity Block', activity: 'Push top sets to RPE 9.5; heavy compound triples', focus: 'Maximal Force Output', targetMetric: '20 sets/muscle group', completed: false },
    { id: 'm-4', timeOrDay: 'WEEK 04', title: 'Strategic Deload & Assessment', activity: 'Drop volume 50%, maintain intensity; test body comp', focus: 'Systemic Fatigue Dissipation', targetMetric: 'DEXA scan / 1RM retest', completed: false },
  ],
  quarterly: [
    { id: 'q-1', timeOrDay: 'MONTH 01', title: 'Foundation & Capacity', activity: 'Build 40km weekly running base + hypertrophy volume', focus: 'Structural Integrity', targetMetric: '160km total monthly distance', completed: true },
    { id: 'q-2', timeOrDay: 'MONTH 02', title: 'Strength Specialization', activity: 'Squat/Bench/Deadlift peak strength progression', focus: 'Absolute Force Production', targetMetric: '+10kg across total big 3', completed: true },
    { id: 'q-3', timeOrDay: 'MONTH 03', title: 'Metabolic Conditioning & Cut', activity: 'Calorie deficit 300 kcal, retain lean mass, sprint peak', focus: 'Lean Body Composition', targetMetric: '-2.5% Body Fat', completed: false },
  ],
  yearly: [
    { id: 'y-1', timeOrDay: 'Q1 (JAN-MAR)', title: 'Mass & Strength Base', activity: 'Hypertrophy surplus (+250 kcal), heavy 5x5 lifting', focus: 'Lean Mass Acquisition', targetMetric: '+2.0 kg Muscle Mass', completed: true },
    { id: 'y-2', timeOrDay: 'Q2 (APR-JUN)', title: 'Cardiovascular Expansion', activity: 'Half-Marathon race prep + powerlifting maintenance', focus: 'Aerobic & VO2 Max Engine', targetMetric: 'Sub 1h 45m Half-Marathon', completed: true },
    { id: 'y-3', timeOrDay: 'Q3 (JUL-SEP)', title: 'Peak Definition & Calisthenics', activity: 'Conditioning, bodyweight levers, sub-10% body fat', focus: 'Relative Strength & Aesthetics', targetMetric: '9.5% Body Fat', completed: false },
    { id: 'y-4', timeOrDay: 'Q4 (OCT-DEC)', title: 'Functional Resilience', activity: 'Olympic weightlifting technique, mobility & recovery', focus: 'Longevity & Joint Durability', targetMetric: '100% Habit Adherence', completed: false },
  ],
};

export const INITIAL_GOALS: FitnessGoal[] = [
  { id: 'g-1', title: 'Barbell Back Squat 1RM', category: 'Strength', cadence: 'quarterly', baseline: 125, current: 150, target: 160, unit: 'kg', notes: 'Full depth below parallel' },
  { id: 'g-2', title: 'Body Fat Percentage', category: 'Body Comp', cadence: 'quarterly', baseline: 16.5, current: 12.8, target: 11.0, unit: '%', notes: 'DEXA calibrated scan' },
  { id: 'g-3', title: '10K Road Run Time', category: 'Endurance', cadence: 'monthly', baseline: 58, current: 48.0, target: 45.0, unit: 'mins', notes: 'Flat road course pace 4:30/km' },
  { id: 'g-4', title: 'Daily Clean Protein Intake', category: 'Nutrition', cadence: 'daily', baseline: 120, current: 175, target: 180, unit: 'g', notes: 'Whole food + whey isolate' },
  { id: 'g-5', title: 'Daily Step Count (NEAT)', category: 'Habits', cadence: 'daily', baseline: 6000, current: 11400, target: 12000, unit: 'steps', notes: 'Consistent non-exercise activity' },
  { id: 'g-6', title: 'Weekly Zone 2 Aerobic Vol.', category: 'Endurance', cadence: 'weekly', baseline: 60, current: 160, target: 180, unit: 'mins', notes: 'Nasal breathing, HR 128-138' },
  { id: 'g-7', title: 'Strict Dead-Hang Pull-Ups', category: 'Strength', cadence: 'monthly', baseline: 8, current: 18, target: 20, unit: 'reps', notes: 'Chest to bar, zero kip' },
  { id: 'g-8', title: 'Sleep Duration (Consistent)', category: 'Habits', cadence: 'daily', baseline: 6.0, current: 8.0, target: 8.5, unit: 'hours', notes: 'Sleep tracker confirmed' },
];

export const INITIAL_DAY_HISTORY: DayProgressRecord[] = [
  { dayLabel: 'DAY 01 (MON)', dateStr: '2026-09-21', completedCount: 9, totalCount: 10, percentage: 90 },
  { dayLabel: 'DAY 02 (TUE)', dateStr: '2026-09-22', completedCount: 8, totalCount: 10, percentage: 80 },
  { dayLabel: 'DAY 03 (WED)', dateStr: '2026-09-23', completedCount: 10, totalCount: 10, percentage: 100 },
  { dayLabel: 'DAY 04 (THU)', dateStr: '2026-09-24', completedCount: 8, totalCount: 10, percentage: 80 },
  { dayLabel: 'DAY 05 (FRI)', dateStr: '2026-09-25', completedCount: 7, totalCount: 10, percentage: 70 },
  { dayLabel: 'DAY 06 (SAT)', dateStr: '2026-09-26', completedCount: 9, totalCount: 10, percentage: 90 },
  { dayLabel: 'DAY 07 (SUN)', dateStr: '2026-09-27', completedCount: 8, totalCount: 10, percentage: 80 },
];

/**
 * Determines print orientation:
 * - If activities > 12: sets to 'landscape' (horizontal).
 * - If activities <= 11: sets to 'portrait' (vertical).
 * - Honors manual override if specified.
 */
export function determinePrintOrientation(
  activityCount: number,
  mode: PrintOrientationMode = 'auto'
): 'portrait' | 'landscape' {
  if (mode === 'landscape') return 'landscape';
  if (mode === 'portrait') return 'portrait';
  return activityCount > 12 ? 'landscape' : 'portrait';
}

/**
 * Computes 80% adherence benchmark:
 * e.g., 10 tasks => min 8 tasks needed (Math.ceil(10 * 0.8) = 8).
 * e.g., 12 tasks => min 10 tasks needed (Math.ceil(12 * 0.8) = 10).
 * e.g., 15 tasks => min 12 tasks needed (Math.ceil(15 * 0.8) = 12).
 */
export function compute80Adherence(totalTasks: number, completedCount: number): Adherence80Stats {
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedCount: 0,
      completionRate: 0,
      minRequired80: 0,
      isPassing80: true,
      tasksNeeded: 0,
    };
  }

  const completionRate = Math.round((completedCount / totalTasks) * 100);
  const minRequired80 = Math.ceil(totalTasks * 0.8);
  const isPassing80 = completedCount >= minRequired80;
  const tasksNeeded = Math.max(0, minRequired80 - completedCount);

  return {
    totalTasks,
    completedCount,
    completionRate,
    minRequired80,
    isPassing80,
    tasksNeeded,
  };
}

/**
 * Calculates Progress Percentage towards goal.
 * Handles both increasing targets (e.g. Squat from 100 to 150)
 * and decreasing targets (e.g. Body Fat % from 20% down to 12%).
 */
export function computeGoalProgress(goal: FitnessGoal): number {
  const { baseline, current, target } = goal;
  if (target === baseline) return 100;

  let progress = 0;
  if (target > baseline) {
    progress = ((current - baseline) / (target - baseline)) * 100;
  } else {
    progress = ((baseline - current) / (baseline - target)) * 100;
  }

  return Math.max(0, Math.min(100, Math.round(progress)));
}

/**
 * Computes average progress % across a list of goals
 */
export function computeAggregateProgress(goals: FitnessGoal[]): number {
  if (!goals.length) return 0;
  const total = goals.reduce((acc, g) => acc + computeGoalProgress(g), 0);
  return Math.round(total / goals.length);
}

/**
 * Exports data to CSV spreadsheet
 */
export function exportFitnessToCSV(data: FitnessGlassData): void {
  const lines: string[] = [];
  const currentTimetable = data.timetable[data.cadence] || [];
  const adherence = compute80Adherence(
    currentTimetable.length,
    currentTimetable.filter((b) => b.completed).length
  );

  lines.push(`FITNESS GLASS // TIMETABLE & TARGETS`);
  lines.push(`Plan Title:,"${data.planTitle}"`);
  lines.push(`Athlete:,"${data.userName}"`);
  lines.push(`Current Cadence:,"${data.cadence.toUpperCase()}"`);
  lines.push(`80% Minimum Threshold Requirement:,"Minimum ${adherence.minRequired80} of ${adherence.totalTasks} tasks required (Status: ${adherence.isPassing80 ? 'PASS' : 'INCOMPLETE'})"`);
  lines.push(`Export Timestamp:,"${new Date().toISOString()}"`);
  lines.push('');

  // Daily Grid Checklist Section
  lines.push(`CHECKLIST GRID BOXES // ${data.cadence.toUpperCase()}`);
  lines.push(`Status,Time/Day,Block Protocol,Target Metric,MON,TUE,WED,THU,FRI,SAT,SUN,Weekly Total`);
  currentTimetable.forEach((b) => {
    const checks = b.dayChecks || [false, false, false, false, false, false, false];
    const totalWeeklyChecks = checks.filter(Boolean).length;
    lines.push(
      `"${b.completed ? '[X] PASS' : '[ ] INCOMPLETE'}","${b.timeOrDay}","${b.activity}","${b.targetMetric}",${checks.map((c) => (c ? '[X]' : '[ ]')).join(',')},${totalWeeklyChecks}/7`
    );
  });
  lines.push('');

  // Historical Daily Progress Graph Data
  lines.push(`DAILY PROGRESS GRAPH LOG (TILL LAST DAY)`);
  lines.push(`Day Label,Date,Completed Tasks,Total Tasks,Completion %,80% Target Line,Adherence Status`);
  (data.dayHistory || INITIAL_DAY_HISTORY).forEach((d) => {
    lines.push(
      `"${d.dayLabel}","${d.dateStr}",${d.completedCount},${d.totalCount},${d.percentage}%,80%,"${d.percentage >= 80 ? 'PASS (>=80%)' : 'BELOW 80%'}"`
    );
  });
  lines.push('');

  // Measurable Goals Section
  lines.push(`MEASURABLE FITNESS TARGETS & GOALS`);
  lines.push(`Goal Title,Category,Cadence,Baseline,Current,Target,Unit,Progress %,Status,Notes`);
  data.goals.forEach((g) => {
    const prog = computeGoalProgress(g);
    const status = prog >= 100 ? 'COMPLETED' : prog >= 80 ? 'EXCELLENT' : prog >= 60 ? 'ON TRACK' : 'IN PROGRESS';
    lines.push(
      `"${g.title}","${g.category}","${g.cadence}",${g.baseline},${g.current},${g.target},"${g.unit}",${prog}%,"${status}","${g.notes || ''}"`
    );
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Fitness_Glass_${data.cadence}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an A4 PDF document with:
 * 1. Automatic Orientation Detection (Horizontal/Landscape if > 12 activities, Vertical/Portrait if <= 11)
 * 2. Multi-day Physical Checklist Grid Boxes for pen/tick tracking
 * 3. Prominent 80% Adherence Benchmark Indicator (e.g. 10 tasks => min 8 required)
 * 4. Activities Progress Graph rendered till the last day with the 80% reference line
 */
export async function exportFitnessToA4_PDF(data: FitnessGlassData): Promise<Blob> {
  const currentTimetable = data.timetable[data.cadence] || [];
  const activityCount = currentTimetable.length;
  const orientation = determinePrintOrientation(activityCount, data.orientationMode);
  const isLandscape = orientation === 'landscape';

  // Standard A4 dimensions in mm:
  // Portrait: 210 x 297 mm
  // Landscape: 297 x 210 mm
  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const adherence = compute80Adherence(
    activityCount,
    currentTimetable.filter((b) => b.completed).length
  );
  const dayHistory = data.dayHistory || INITIAL_DAY_HISTORY;

  // 1. Background Fill
  doc.setFillColor(248, 248, 246);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. High-Contrast Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2, 'S');

  // 3. Header Banner (Neo-Brutalist Electric Lime)
  doc.setFillColor(204, 255, 0); // #ccff00
  doc.rect(margin, margin, contentWidth, 13, 'F');
  doc.rect(margin, margin, contentWidth, 13, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(
    `FITNESS GLASS // ${data.cadence.toUpperCase()} PROTOCOL [${isLandscape ? 'HORIZONTAL LANDSCAPE (>12 ACTIVITIES)' : 'VERTICAL PORTRAIT (<=11 ACTIVITIES)'}]`,
    margin + 4,
    margin + 5.5
  );

  doc.setFontSize(7);
  doc.text(
    `ATHLETE: ${data.userName.toUpperCase()} · FORM REF: FG-A4-${orientation.toUpperCase()} · PRINT-CALIBRATED A4 SPECIMEN`,
    margin + 4,
    margin + 10
  );

  // 4. Top Executive Strip with 80% Requirement Banner
  let currentY = margin + 16;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 1, currentY, contentWidth - 2, 10, 'F');
  doc.rect(margin + 1, currentY, contentWidth - 2, 10, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`PLAN: ${data.planTitle}`, margin + 3, currentY + 6.5);
  doc.text(`COMPLETED: ${adherence.completedCount}/${adherence.totalTasks} (${adherence.completionRate}%)`, margin + (isLandscape ? 95 : 68), currentY + 6.5);

  // 80% Target Box
  doc.setFillColor(adherence.isPassing80 ? 204 : 255, adherence.isPassing80 ? 255 : 220, adherence.isPassing80 ? 0 : 220);
  const badgeX = margin + (isLandscape ? 175 : 122);
  const badgeW = isLandscape ? 110 : 75;
  doc.rect(badgeX, currentY + 1.5, badgeW, 7, 'F');
  doc.rect(badgeX, currentY + 1.5, badgeW, 7, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.text(
    `80% TARGET: NEED MIN ${adherence.minRequired80}/${adherence.totalTasks} TASKS [${adherence.isPassing80 ? 'PASS' : `NEED +${adherence.tasksNeeded}`}]`,
    badgeX + 2,
    currentY + 6
  );

  currentY += 13;

  // 5. SECTION A: CHECKLIST GRID BOXES TABLE
  doc.setFillColor(0, 0, 0);
  doc.rect(margin + 1, currentY, contentWidth - 2, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 255, 0);
  doc.text(
    `[ 01 ] CHECKLIST GRID BOXES (TICK OFF DAILY OR USE PEN ON PRINTED PAPER)`,
    margin + 4,
    currentY + 4.2
  );

  currentY += 7.5;

  // Table Column Definitions
  // In Landscape: more width is available for the 7-day grid boxes!
  const colTimeW = isLandscape ? 34 : 28;
  const colActivityW = isLandscape ? 85 : 55;
  const colMetricW = isLandscape ? 60 : 42;
  const dayBoxW = isLandscape ? 8.5 : 6.5; // Width of each daily check box

  // Table Header Row
  doc.setFillColor(235, 235, 230);
  doc.rect(margin + 1, currentY, contentWidth - 2, 6, 'F');
  doc.rect(margin + 1, currentY, contentWidth - 2, 6, 'S');

  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('TIME/SLOT', margin + 3, currentY + 4);
  doc.text('ACTIVITY PROTOCOL & FOCUS', margin + 3 + colTimeW, currentY + 4);
  doc.text('TARGET METRIC', margin + 3 + colTimeW + colActivityW, currentY + 4);

  // Day columns (Mon-Sun)
  let dayHeaderX = margin + 3 + colTimeW + colActivityW + colMetricW;
  DAYS_OF_WEEK.forEach((d) => {
    doc.text(d.slice(0, 2), dayHeaderX + 1.2, currentY + 4);
    dayHeaderX += dayBoxW;
  });
  doc.text('TOTAL', dayHeaderX + 1.5, currentY + 4);

  currentY += 6;

  // Render Table Rows with Physical Checkbox Grids
  const rowHeight = isLandscape ? 7.5 : 7.0;
  currentTimetable.forEach((b) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 1, currentY, contentWidth - 2, rowHeight, 'F');
    doc.rect(margin + 1, currentY, contentWidth - 2, rowHeight, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.text(b.timeOrDay.slice(0, 18), margin + 3, currentY + 4.5);

    doc.text(b.activity.slice(0, isLandscape ? 52 : 36), margin + 3 + colTimeW, currentY + 3.5);
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.2);
    doc.text(`Focus: ${b.focus.slice(0, isLandscape ? 52 : 36)}`, margin + 3 + colTimeW, currentY + 6.2);

    doc.setFont('courier', 'bold');
    doc.setFontSize(5.8);
    doc.text(b.targetMetric.slice(0, isLandscape ? 38 : 28), margin + 3 + colTimeW + colActivityW, currentY + 4.5);

    // 7 Physical Day Checkbox Squares
    let boxX = margin + 3 + colTimeW + colActivityW + colMetricW;
    const checks = b.dayChecks || [false, false, false, false, false, false, false];
    let weekSum = 0;

    checks.forEach((checked) => {
      // Physical tick box
      doc.setLineWidth(0.35);
      doc.rect(boxX, currentY + 1.5, dayBoxW - 2, rowHeight - 3, 'S');
      if (checked) {
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.text('X', boxX + (dayBoxW - 2) / 2 - 1.2, currentY + rowHeight - 2.5);
        weekSum++;
      }
      boxX += dayBoxW;
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.text(`${weekSum}/7`, boxX + 1.5, currentY + 4.5);

    currentY += rowHeight;
  });

  currentY += 4;

  // 6. SECTION B: AUTOMATIC PROGRESS GRAPH (TILL LAST DAY)
  doc.setFillColor(0, 0, 0);
  doc.rect(margin + 1, currentY, contentWidth - 2, 5.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(204, 255, 0);
  doc.text(
    `[ 02 ] AUTOMATED DAILY COMPLETION GRAPH (TILL LAST DAY) WITH 80% TARGET THRESHOLD`,
    margin + 4,
    currentY + 4
  );

  currentY += 7;

  // Render Graph Box
  const graphH = isLandscape ? 28 : 24;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 1, currentY, contentWidth - 2, graphH, 'F');
  doc.rect(margin + 1, currentY, contentWidth - 2, graphH, 'S');

  // Draw 80% Target Benchmark Line across Graph Box
  // 80% height from bottom:
  const graphInnerTop = currentY + 3;
  const graphInnerBottom = currentY + graphH - 5;
  const graphUsableH = graphInnerBottom - graphInnerTop;
  const y80 = graphInnerBottom - graphUsableH * 0.8;

  // Dashed red / bold line for 80%
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(margin + 18, y80, margin + contentWidth - 10, y80);

  doc.setFontSize(5.5);
  doc.setTextColor(180, 0, 0);
  doc.text('80% TARGET LINE', margin + 3, y80 + 1);

  // Plot Daily Progress Points
  const numDays = dayHistory.length;
  const xStart = margin + 28;
  const xStep = (contentWidth - 45) / Math.max(1, numDays - 1);

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);

  let prevX = 0;
  let prevY = 0;

  dayHistory.forEach((pt, i) => {
    const x = xStart + i * xStep;
    const y = graphInnerBottom - (pt.percentage / 100) * graphUsableH;

    // Draw point circle
    doc.setFillColor(pt.percentage >= 80 ? 0 : 200, pt.percentage >= 80 ? 160 : 0, 0);
    doc.circle(x, y, 1.2, 'FD');

    // Connect line
    if (i > 0) {
      doc.setDrawColor(0, 0, 0);
      doc.line(prevX, prevY, x, y);
    }
    prevX = x;
    prevY = y;

    // Day label below point
    doc.setFont('courier', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(0, 0, 0);
    doc.text(pt.dayLabel.split(' ')[0], x - 3, graphInnerBottom + 3.5);

    // % label above point
    doc.setFont('courier', 'bold');
    doc.text(`${pt.percentage}%`, x - 3.5, y - 2);
  });

  currentY += graphH + 3;

  // 7. SECTION C: MEASURABLE TARGETS & GOALS
  doc.setFillColor(0, 0, 0);
  doc.rect(margin + 1, currentY, contentWidth - 2, 5.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(204, 255, 0);
  doc.text(`[ 03 ] MEASURABLE TARGETS & PROGRESSION`, margin + 4, currentY + 4);

  currentY += 7;

  // Goals table headers
  doc.setFillColor(235, 235, 230);
  doc.rect(margin + 1, currentY, contentWidth - 2, 5.5, 'F');
  doc.rect(margin + 1, currentY, contentWidth - 2, 5.5, 'S');

  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text('GOAL METRIC', margin + 3, currentY + 3.8);
  doc.text('CAT', margin + (isLandscape ? 80 : 55), currentY + 3.8);
  doc.text('BASE', margin + (isLandscape ? 120 : 85), currentY + 3.8);
  doc.text('CURRENT', margin + (isLandscape ? 150 : 110), currentY + 3.8);
  doc.text('TARGET', margin + (isLandscape ? 180 : 135), currentY + 3.8);
  doc.text('PROGRESS %', margin + (isLandscape ? 215 : 160), currentY + 3.8);

  currentY += 5.5;

  // Render top goals (limit to fit on single page)
  const maxGoalsToShow = isLandscape ? 4 : 5;
  data.goals.slice(0, maxGoalsToShow).forEach((g) => {
    const prog = computeGoalProgress(g);

    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 1, currentY, contentWidth - 2, 6.2, 'F');
    doc.rect(margin + 1, currentY, contentWidth - 2, 6.2, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6);
    doc.text(g.title.slice(0, isLandscape ? 38 : 28), margin + 3, currentY + 4);

    doc.text(g.category.toUpperCase().slice(0, 10), margin + (isLandscape ? 80 : 55), currentY + 4);
    doc.text(`${g.baseline} ${g.unit}`, margin + (isLandscape ? 120 : 85), currentY + 4);
    doc.text(`${g.current} ${g.unit}`, margin + (isLandscape ? 150 : 110), currentY + 4);
    doc.text(`${g.target} ${g.unit}`, margin + (isLandscape ? 180 : 135), currentY + 4);

    // Progress bar
    const barW = isLandscape ? 32 : 18;
    const filledW = (prog / 100) * barW;
    const barX = margin + (isLandscape ? 215 : 160);
    doc.setFillColor(220, 220, 220);
    doc.rect(barX, currentY + 1.8, barW, 2.6, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(barX, currentY + 1.8, filledW, 2.6, 'F');

    doc.text(`${prog}%`, barX + barW + 2, currentY + 4);

    currentY += 6.2;
  });

  // Footer Verification Sign-off Box
  const footerY = pageHeight - margin - 13;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 1, footerY, contentWidth - 2, 11, 'F');
  doc.rect(margin + 1, footerY, contentWidth - 2, 11, 'S');

  doc.setFontSize(6);
  doc.setTextColor(0, 0, 0);
  doc.text('ATHLETE PHYSICAL SIGNATURE: ____________________________', margin + 3, footerY + 4.5);
  doc.text('DATE REVIEWED: ______________', margin + (isLandscape ? 140 : 95), footerY + 4.5);
  doc.text(
    `STATUS: ${adherence.isPassing80 ? '[X] 80% REQUIREMENT MET (PASS)' : '[ ] INCOMPLETE (<80%)'}`,
    margin + (isLandscape ? 210 : 140),
    footerY + 4.5
  );

  doc.setFontSize(5);
  doc.setTextColor(90, 90, 90);
  doc.text(
    `PRINT SPECIFICATION: ISO A4 (${pageWidth}x${pageHeight}mm) · ORIENTATION: ${orientation.toUpperCase()} (${activityCount > 12 ? '>12 ACTIVITIES AUTO-HORIZONTAL' : '<=11 ACTIVITIES AUTO-VERTICAL'}) · 80% BENCHMARK CALIBRATED`,
    margin + 3,
    footerY + 8.5
  );

  return doc.output('blob');
}

/**
 * Renders an A4 preview on canvas at 300 DPI for high-res PNG export
 * dynamically handling Landscape (3508 x 2480 px) vs Portrait (2480 x 3508 px)
 */
export async function renderFitnessA4ToCanvas(
  canvas: HTMLCanvasElement,
  data: FitnessGlassData
): Promise<Blob> {
  const currentTimetable = data.timetable[data.cadence] || [];
  const activityCount = currentTimetable.length;
  const orientation = determinePrintOrientation(activityCount, data.orientationMode);
  const isLandscape = orientation === 'landscape';

  // 300 DPI Pixel Dimensions:
  // Landscape: 3508 x 2480 px
  // Portrait: 2480 x 3508 px
  const w = isLandscape ? 3508 : 2480;
  const h = isLandscape ? 2480 : 3508;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const adherence = compute80Adherence(
    activityCount,
    currentTimetable.filter((b) => b.completed).length
  );
  const dayHistory = data.dayHistory || INITIAL_DAY_HISTORY;

  // Background
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, w, h);

  // Outer Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.strokeRect(60, 60, w - 120, h - 120);

  // Header Banner
  ctx.fillStyle = '#ccff00';
  ctx.fillRect(60, 60, w - 120, 180);
  ctx.strokeRect(60, 60, w - 120, 180);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 50px monospace';
  ctx.fillText(
    `FITNESS GLASS // ${data.cadence.toUpperCase()} PROTOCOL [${orientation.toUpperCase()}]`,
    100,
    140
  );

  ctx.font = 'bold 30px monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText(
    `ATHLETE: ${data.userName.toUpperCase()} · ${activityCount > 12 ? 'HORIZONTAL (>12 TASKS)' : 'VERTICAL (<=11 TASKS)'} · 300 DPI A4`,
    100,
    200
  );

  // 80% Adherence Badge Banner
  const badgeW = isLandscape ? 820 : 680;
  ctx.fillStyle = adherence.isPassing80 ? '#000000' : '#fee2e2';
  ctx.fillRect(w - badgeW - 80, 80, badgeW, 140);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.strokeRect(w - badgeW - 80, 80, badgeW, 140);

  ctx.fillStyle = adherence.isPassing80 ? '#ccff00' : '#991b1b';
  ctx.font = 'bold 34px monospace';
  ctx.fillText(
    `80% TARGET: ${adherence.isPassing80 ? 'PASS' : 'INCOMPLETE'}`,
    w - badgeW - 50,
    140
  );

  ctx.fillStyle = adherence.isPassing80 ? '#ffffff' : '#000000';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(
    `NEED ${adherence.minRequired80}/${adherence.totalTasks} TASKS (CUR: ${adherence.completedCount})`,
    w - badgeW - 50,
    190
  );

  let curY = 280;

  // SECTION 1 Header: Checklist Grid Boxes
  ctx.fillStyle = '#000000';
  ctx.fillRect(60, curY, w - 120, 80);
  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 36px monospace';
  ctx.fillText(`[ 01 ] CHECKLIST GRID BOXES (DAILY PHYSICAL / DIGITAL TRACKING)`, 100, curY + 54);
  curY += 105;

  // Table Headers
  ctx.fillStyle = '#e5e7eb';
  ctx.fillRect(60, curY, w - 120, 65);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, curY, w - 120, 65);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('TIME/SLOT', 80, curY + 44);
  ctx.fillText('ACTIVITY & FOCUS OBJECTIVE', isLandscape ? 480 : 380, curY + 44);
  ctx.fillText('TARGET METRIC', isLandscape ? 1750 : 1200, curY + 44);

  let gridX = isLandscape ? 2550 : 1780;
  DAYS_OF_WEEK.forEach((d) => {
    ctx.fillText(d.slice(0, 2), gridX + 10, curY + 44);
    gridX += isLandscape ? 95 : 75;
  });
  ctx.fillText('TOT', gridX + 10, curY + 44);

  curY += 75;

  // Render Table Rows
  const maxRows = isLandscape ? 14 : 11;
  const rowHeight = isLandscape ? 80 : 75;

  currentTimetable.slice(0, maxRows).forEach((b) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(60, curY, w - 120, rowHeight);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(60, curY, w - 120, rowHeight);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(b.timeOrDay.slice(0, 18), 80, curY + 48);

    ctx.fillText(b.activity.slice(0, isLandscape ? 56 : 38), isLandscape ? 480 : 380, curY + 38);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(`Focus: ${b.focus.slice(0, isLandscape ? 60 : 40)}`, isLandscape ? 480 : 380, curY + 68);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(b.targetMetric.slice(0, isLandscape ? 38 : 28), isLandscape ? 1750 : 1200, curY + 48);

    // 7 Physical Checkboxes
    let dayX = isLandscape ? 2550 : 1780;
    const checks = b.dayChecks || [false, false, false, false, false, false, false];
    let sumChecked = 0;

    checks.forEach((c) => {
      const boxSize = isLandscape ? 45 : 38;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(dayX + 5, curY + 18, boxSize, boxSize);

      if (c) {
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px monospace';
        ctx.fillText('X', dayX + 16, curY + 54);
        sumChecked++;
      }
      dayX += isLandscape ? 95 : 75;
    });

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 24px monospace';
    ctx.fillText(`${sumChecked}/7`, dayX + 10, curY + 48);

    curY += rowHeight + 8;
  });

  curY += 20;

  // SECTION 2: Automated Activity Graph till Last Day
  ctx.fillStyle = '#000000';
  ctx.fillRect(60, curY, w - 120, 75);
  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 34px monospace';
  ctx.fillText(`[ 02 ] AUTOMATED DAILY COMPLETION GRAPH (TILL LAST DAY) · 80% BENCHMARK`, 100, curY + 50);
  curY += 95;

  const graphBoxH = isLandscape ? 260 : 220;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(60, curY, w - 120, graphBoxH);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(60, curY, w - 120, graphBoxH);

  // Draw 80% line
  const graphInnerY0 = curY + 20;
  const graphInnerY1 = curY + graphBoxH - 40;
  const graphRange = graphInnerY1 - graphInnerY0;
  const y80Px = graphInnerY1 - graphRange * 0.8;

  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(120, y80Px);
  ctx.lineTo(w - 120, y80Px);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px monospace';
  ctx.fillText('--- 80% MINIMUM REQUIREMENT TARGET LINE ---', 130, y80Px - 10);

  // Draw Points
  const xStart = 200;
  const xSpan = (w - 400) / Math.max(1, dayHistory.length - 1);
  let lastX = 0;
  let lastY = 0;

  dayHistory.forEach((pt, idx) => {
    const px = xStart + idx * xSpan;
    const py = graphInnerY1 - (pt.percentage / 100) * graphRange;

    // Connect line
    if (idx > 0) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(px, py);
      ctx.stroke();
    }
    lastX = px;
    lastY = py;

    // Circle point
    ctx.fillStyle = pt.percentage >= 80 ? '#16a34a' : '#dc2626';
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(`${pt.percentage}%`, px - 25, py - 20);
    ctx.font = '18px monospace';
    ctx.fillText(pt.dayLabel.split(' ')[0], px - 25, graphInnerY1 + 25);
  });

  // Footer Verification Sign-off Box
  const footerY = h - 160;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(60, footerY, w - 120, 100);
  ctx.strokeRect(60, footerY, w - 120, 100);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px monospace';
  ctx.fillText('ATHLETE SIGNATURE: ________________________________', 100, footerY + 58);
  ctx.fillText('REVIEW DATE: ____________', isLandscape ? 1700 : 1200, footerY + 58);
  ctx.fillText(
    `STATUS: ${adherence.isPassing80 ? '[X] 80% REQUIREMENT MET' : '[ ] UNDER 80%'}`,
    isLandscape ? 2550 : 1800,
    footerY + 58
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('Canvas blob generation failed'));
        return;
      }
      try {
        const dpiBlob = await insertDpiIntoPngBlob(blob, 300);
        resolve(dpiBlob);
      } catch {
        resolve(blob);
      }
    }, 'image/png');
  });
}
