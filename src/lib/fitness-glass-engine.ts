import { jsPDF } from 'jspdf';
import { insertDpiIntoPngBlob } from './qr-engine';

export type FitnessCadence = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

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
}

export interface FitnessGlassData {
  cadence: FitnessCadence;
  userName: string;
  planTitle: string;
  startDate: string;
  targetDate: string;
  timetable: Record<FitnessCadence, TimetableBlock[]>;
  goals: FitnessGoal[];
}

export const INITIAL_TIMETABLE: Record<FitnessCadence, TimetableBlock[]> = {
  daily: [
    { id: 'd-1', timeOrDay: '06:00 - 06:45', title: 'Fasted Zone 2 Cardio', activity: 'Incline walk or steady rowing', focus: 'Fat Oxidation & Aerobic Base', targetMetric: '45 mins (HR 125-135 bpm)', completed: true },
    { id: 'd-2', timeOrDay: '07:00 - 07:30', title: 'Mobility & Hydration', activity: 'Dynamic hip/thoracic drill + 1L water with electrolytes', focus: 'Joint Health & Priming', targetMetric: '1,000 ml water + 500mg Na', completed: true },
    { id: 'd-3', timeOrDay: '12:00 - 13:15', title: 'Hypertrophy Training', activity: 'Compound Push & Core resistance protocol', focus: 'Mechanical Tension & Volume', targetMetric: '18 total working sets (RPE 8)', completed: false },
    { id: 'd-4', timeOrDay: '13:30 - 14:00', title: 'Post-Workout Fuel', activity: 'High-protein whole meal + creatine', focus: 'Muscle Protein Synthesis', targetMetric: '50g Protein + 5g Creatine', completed: false },
    { id: 'd-5', timeOrDay: '18:00 - 18:30', title: 'Decompression & Steps', activity: 'Outdoor nature walk & postural reset', focus: 'Cortisol Reduction & NEAT', targetMetric: '4,000 steps', completed: false },
    { id: 'd-6', timeOrDay: '22:00 - 06:00', title: 'Deep Recovery Sleep', activity: 'Darkroom cold environment, magnesium l-threonate', focus: 'Cellular Repair & GH Release', targetMetric: '8.0 Hours uninterrupted', completed: false },
  ],
  weekly: [
    { id: 'w-1', timeOrDay: 'MONDAY', title: 'Heavy Lower & Core', activity: 'Squat 5x5, RDL 4x8, Walking Lunges', focus: 'Posterior Chain & Quad Power', targetMetric: 'Top Squat 140kg x 5', completed: true },
    { id: 'w-2', timeOrDay: 'TUESDAY', title: 'Upper Push & Triceps', activity: 'Incline DB Press, Overhead Press, Dips', focus: 'Pectoral & Deltoid Hypertrophy', targetMetric: 'Incline DB 40kg x 8', completed: true },
    { id: 'w-3', timeOrDay: 'WEDNESDAY', title: 'Zone 2 Endurance & Core', activity: '10km Steady State Trail Run', focus: 'Mitochondrial Density', targetMetric: '10 km in < 55 mins', completed: false },
    { id: 'w-4', timeOrDay: 'THURSDAY', title: 'Heavy Pull & Biceps', activity: 'Barbell Rows, Weighted Pull-Ups, Face Pulls', focus: 'Upper Back Density & Scapular Control', targetMetric: '+20kg Pull-Ups x 6', completed: false },
    { id: 'w-5', timeOrDay: 'FRIDAY', title: 'Posterior Hypertrophy', activity: 'Deadlift 4x4, Leg Press, Hamstring Curls', focus: 'Maximal Strength & Posterior Drive', targetMetric: 'Deadlift 180kg x 4', completed: false },
    { id: 'w-6', timeOrDay: 'SATURDAY', title: 'VO2 Max Intervals', activity: '4x4 min Norwegian Protocol on Assault Bike', focus: 'Cardiorespiratory Peak Power', targetMetric: 'Peak HR > 185 bpm', completed: false },
    { id: 'w-7', timeOrDay: 'SUNDAY', title: 'Active Recovery & Saunas', activity: 'Contrast hydrotherapy, cold plunge, mobility flow', focus: 'Parasympathetic Reset', targetMetric: '30 mins sauna + 15 min stretch', completed: false },
  ],
  monthly: [
    { id: 'm-1', timeOrDay: 'WEEK 01', title: 'Volume Accumulation', activity: 'Introduce target mesocycle weights at RPE 7-8', focus: 'Neuromuscular Adaptation', targetMetric: '16 sets/muscle group', completed: true },
    { id: 'm-2', timeOrDay: 'WEEK 02', title: 'Progressive Overload', activity: 'Increase intensity +2.5% across compounds', focus: 'Strength Escalation', targetMetric: '18 sets/muscle group', completed: true },
    { id: 'm-3', timeOrDay: 'WEEK 03', title: 'Peak Intensity Block', activity: 'Push top sets to RPE 9.5; heavy compound triples', focus: 'Maximal Force Output', targetMetric: '20 sets/muscle group', completed: false },
    { id: 'm-4', timeOrDay: 'WEEK 04', title: 'Strategic Deload & Assessment', activity: 'Drop volume 50%, maintain intensity; test body comp', focus: 'Systemic Fatigue Dissipation', targetMetric: 'DEXA scan / 1RM retest', completed: false },
  ],
  quarterly: [
    { id: 'q-1', timeOrDay: 'MONTH 01', title: 'Foundation & Capacity', activity: 'Build 40km weekly running base + hypertrophy volume', focus: 'Structural Integrity', targetMetric: '160km total monthly distance', completed: true },
    { id: 'q-2', timeOrDay: 'MONTH 02', title: 'Strength Specialization', activity: 'Squat/Bench/Deadlift peak strength progression', focus: 'Absolute Force Production', targetMetric: '+10kg across total big 3', completed: false },
    { id: 'q-3', timeOrDay: 'MONTH 03', title: 'Metabolic Conditioning & Cut', activity: 'Calorie deficit 300 kcal, retain lean mass, sprint peak', focus: 'Lean Body Composition', targetMetric: '-2.5% Body Fat', completed: false },
  ],
  yearly: [
    { id: 'y-1', timeOrDay: 'Q1 (JAN-MAR)', title: 'Mass & Strength Base', activity: 'Hypertrophy surplus (+250 kcal), heavy 5x5 lifting', focus: 'Lean Mass Acquisition', targetMetric: '+2.0 kg Muscle Mass', completed: true },
    { id: 'y-2', timeOrDay: 'Q2 (APR-JUN)', title: 'Cardiovascular Expansion', activity: 'Half-Marathon race prep + powerlifting maintenance', focus: 'Aerobic & VO2 Max Engine', targetMetric: 'Sub 1h 45m Half-Marathon', completed: false },
    { id: 'y-3', timeOrDay: 'Q3 (JUL-SEP)', title: 'Peak Definition & Calisthenics', activity: 'Conditioning, bodyweight levers, sub-10% body fat', focus: 'Relative Strength & Aesthetics', targetMetric: '9.5% Body Fat', completed: false },
    { id: 'y-4', timeOrDay: 'Q4 (OCT-DEC)', title: 'Functional Resilience', activity: 'Olympic weightlifting technique, mobility & recovery', focus: 'Longevity & Joint Durability', targetMetric: '100% Habit Adherence', completed: false },
  ],
};

export const INITIAL_GOALS: FitnessGoal[] = [
  { id: 'g-1', title: 'Barbell Back Squat 1RM', category: 'Strength', cadence: 'quarterly', baseline: 125, current: 145, target: 160, unit: 'kg', notes: 'Full depth below parallel' },
  { id: 'g-2', title: 'Body Fat Percentage', category: 'Body Comp', cadence: 'quarterly', baseline: 16.5, current: 13.8, target: 11.0, unit: '%', notes: 'DEXA calibrated scan' },
  { id: 'g-3', title: '10K Road Run Time', category: 'Endurance', cadence: 'monthly', baseline: 58, current: 50.5, target: 45.0, unit: 'mins', notes: 'Flat road course pace 4:30/km' },
  { id: 'g-4', title: 'Daily Clean Protein Intake', category: 'Nutrition', cadence: 'daily', baseline: 120, current: 175, target: 180, unit: 'g', notes: 'Whole food + whey isolate' },
  { id: 'g-5', title: 'Daily Step Count (NEAT)', category: 'Habits', cadence: 'daily', baseline: 6000, current: 11200, target: 12000, unit: 'steps', notes: 'Consistent non-exercise activity' },
  { id: 'g-6', title: 'Weekly Zone 2 Aerobic Vol.', category: 'Endurance', cadence: 'weekly', baseline: 60, current: 150, target: 180, unit: 'mins', notes: 'Nasal breathing, HR 128-138' },
  { id: 'g-7', title: 'Strict Dead-Hang Pull-Ups', category: 'Strength', cadence: 'monthly', baseline: 8, current: 16, target: 20, unit: 'reps', notes: 'Chest to bar, zero kip' },
  { id: 'g-8', title: 'Sleep Quality (Deep+REM)', category: 'Habits', cadence: 'daily', baseline: 6.0, current: 7.8, target: 8.5, unit: 'hours', notes: 'Sleep ring tracked consistency' },
];

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
    // Standard ascending target
    progress = ((current - baseline) / (target - baseline)) * 100;
  } else {
    // Descending target (like body fat or race time)
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

  // Header Section
  lines.push(`FITNESS GLASS // TIMETABLE & TARGETS`);
  lines.push(`Plan Title:,"${data.planTitle}"`);
  lines.push(`Athlete:,"${data.userName}"`);
  lines.push(`Current Cadence:,"${data.cadence.toUpperCase()}"`);
  lines.push(`Export Timestamp:,"${new Date().toISOString()}"`);
  lines.push('');

  // Measurable Goals Section
  lines.push(`MEASURABLE FITNESS TARGETS & GOALS`);
  lines.push(`Goal Title,Category,Cadence,Baseline,Current,Target,Unit,Progress %,Status,Notes`);
  data.goals.forEach((g) => {
    const prog = computeGoalProgress(g);
    const status = prog >= 100 ? 'COMPLETED' : prog >= 60 ? 'ON TRACK' : 'IN PROGRESS';
    lines.push(
      `"${g.title}","${g.category}","${g.cadence}",${g.baseline},${g.current},${g.target},"${g.unit}",${prog}%,"${status}","${g.notes || ''}"`
    );
  });
  lines.push('');

  // Timetable Schedule Section
  lines.push(`TIMETABLE SCHEDULE // ${data.cadence.toUpperCase()}`);
  lines.push(`Time / Day,Block Title,Activity Protocol,Focus Objective,Target Metric,Completed [X]`);
  (data.timetable[data.cadence] || []).forEach((b) => {
    lines.push(
      `"${b.timeOrDay}","${b.title}","${b.activity}","${b.focus}","${b.targetMetric}",${b.completed ? '[X] YES' : '[ ] NO'}`
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
 * Generates an A4 PDF document (210 x 297 mm) with clean typography,
 * checkboxes, tables, progress indicators, and coach verification lines.
 */
export async function exportFitnessToA4_PDF(data: FitnessGlassData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210 x 297 mm
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // 1. Base Background
  doc.setFillColor(248, 248, 246);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. High-Contrast Outer Border & Trim Grid
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2, 'S');

  // 3. Header Banner (Neo-Brutalist Electric Lime)
  doc.setFillColor(204, 255, 0); // #ccff00
  doc.rect(margin, margin, contentWidth, 14, 'F');
  doc.rect(margin, margin, contentWidth, 14, 'S');

  doc.setFont('courier', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`FITNESS GLASS // ${data.cadence.toUpperCase()} PROTOCOL & MEASURABLE TARGETS`, margin + 4, margin + 6.5);
  doc.setFontSize(7.5);
  doc.text(`ATHLETE: ${data.userName.toUpperCase()} · PRINT-READY A4 SPECIMEN · FORM REF: FG-A4-${data.cadence.slice(0, 3).toUpperCase()}`, margin + 4, margin + 11);

  // Top Metrics Strip
  let currentY = margin + 18;
  const avgProgress = computeAggregateProgress(data.goals);

  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 2, currentY, contentWidth - 4, 10, 'F');
  doc.rect(margin + 2, currentY, contentWidth - 4, 10, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text(`PLAN: ${data.planTitle}`, margin + 5, currentY + 6.5);
  doc.text(`CADENCE: ${data.cadence.toUpperCase()}`, margin + 70, currentY + 6.5);
  doc.text(`OVERALL PROGRESS: ${avgProgress}% COMPLETE`, margin + 125, currentY + 6.5);

  currentY += 14;

  // SECTION A: TIMETABLE SCHEDULE TABLE
  doc.setFillColor(0, 0, 0);
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 255, 0); // #ccff00
  doc.text(`[ SECTION 1 ] ${data.cadence.toUpperCase()} SCHEDULE & ROUTINE CHECKMARKS`, margin + 5, currentY + 4.2);

  currentY += 8;

  // Table Headers
  doc.setFillColor(235, 235, 230);
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'F');
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'S');

  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('CHK', margin + 4, currentY + 4);
  doc.text('TIME / DAY', margin + 12, currentY + 4);
  doc.text('BLOCK PROTOCOL', margin + 40, currentY + 4);
  doc.text('OBJECTIVE / TARGET METRIC', margin + 110, currentY + 4);

  currentY += 6;

  const currentTimetable = data.timetable[data.cadence] || [];
  currentTimetable.forEach((b) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 2, currentY, contentWidth - 4, 8.5, 'F');
    doc.rect(margin + 2, currentY, contentWidth - 4, 8.5, 'S');

    // Physical Checkbox Square
    doc.setLineWidth(0.4);
    doc.rect(margin + 4, currentY + 2, 4, 4, 'S');
    if (b.completed) {
      doc.text('X', margin + 5, currentY + 5.2);
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(b.timeOrDay, margin + 12, currentY + 4);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.text(b.title.slice(0, 24), margin + 12, currentY + 7);

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(b.activity.slice(0, 48), margin + 40, currentY + 4);
    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.text(`Focus: ${b.focus.slice(0, 48)}`, margin + 40, currentY + 7);

    doc.setFont('courier', 'bold');
    doc.text(b.targetMetric.slice(0, 45), margin + 110, currentY + 5.5);

    currentY += 8.5;
  });

  currentY += 4;

  // SECTION B: MEASURABLE TARGETS & GOALS PROGRESS TABLE
  doc.setFillColor(0, 0, 0);
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(204, 255, 0);
  doc.text(`[ SECTION 2 ] MEASURABLE TARGETS & PROGRESS ANALYSIS (%)`, margin + 5, currentY + 4.2);

  currentY += 8;

  // Table Headers
  doc.setFillColor(235, 235, 230);
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'F');
  doc.rect(margin + 2, currentY, contentWidth - 4, 6, 'S');

  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('METRIC GOAL', margin + 4, currentY + 4);
  doc.text('CAT', margin + 60, currentY + 4);
  doc.text('BASELINE', margin + 85, currentY + 4);
  doc.text('CURRENT', margin + 110, currentY + 4);
  doc.text('TARGET', margin + 135, currentY + 4);
  doc.text('PROGRESS %', margin + 160, currentY + 4);

  currentY += 6;

  data.goals.forEach((g) => {
    const prog = computeGoalProgress(g);

    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 2, currentY, contentWidth - 4, 8, 'F');
    doc.rect(margin + 2, currentY, contentWidth - 4, 8, 'S');

    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.text(g.title.slice(0, 36), margin + 4, currentY + 4);
    doc.setFont('courier', 'normal');
    doc.setFontSize(5.5);
    doc.text(g.notes ? g.notes.slice(0, 40) : `Cadence: ${g.cadence}`, margin + 4, currentY + 6.8);

    doc.setFont('courier', 'bold');
    doc.text(g.category.toUpperCase().slice(0, 10), margin + 60, currentY + 5);

    doc.text(`${g.baseline} ${g.unit}`, margin + 85, currentY + 5);
    doc.text(`${g.current} ${g.unit}`, margin + 110, currentY + 5);
    doc.text(`${g.target} ${g.unit}`, margin + 135, currentY + 5);

    // Progress Bar on PDF
    const barWidth = 18;
    const filledWidth = (prog / 100) * barWidth;
    doc.setFillColor(230, 230, 230);
    doc.rect(margin + 160, currentY + 2.5, barWidth, 3, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(margin + 160, currentY + 2.5, filledWidth, 3, 'F');
    doc.text(`${prog}%`, margin + 160 + barWidth + 2, currentY + 5);

    currentY += 8;
  });

  // Footer / Verification Block
  const footerY = pageHeight - margin - 22;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin + 2, footerY, contentWidth - 4, 18, 'F');
  doc.rect(margin + 2, footerY, contentWidth - 4, 18, 'S');

  doc.setFontSize(6.5);
  doc.setTextColor(0, 0, 0);
  doc.text('VERIFICATION & PHYSICAL REVIEW // SIGNATURE:', margin + 5, footerY + 5);
  doc.line(margin + 65, footerY + 5, margin + 120, footerY + 5);

  doc.text('DATE COMPLETED:', margin + 130, footerY + 5);
  doc.line(margin + 155, footerY + 5, margin + 180, footerY + 5);

  doc.setFontSize(5.5);
  doc.setTextColor(80, 80, 80);
  doc.text(
    'STANDARD ISO A4 FORM (210x297mm) · HIGH-DENSITY PRINT SPECIMEN · SYSTEMATIC REPETITION & OBJECTIVE MEASUREMENT',
    margin + 5,
    footerY + 12
  );

  return doc.output('blob');
}

/**
 * Renders an A4 preview on canvas at 300 DPI for high-res PNG export
 */
export async function renderFitnessA4ToCanvas(
  canvas: HTMLCanvasElement,
  data: FitnessGlassData
): Promise<Blob> {
  // A4 at 300 DPI = 2480 x 3508 pixels
  const w = 2480;
  const h = 3508;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  // Background
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, w, h);

  // Outer Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 14;
  ctx.strokeRect(80, 80, w - 160, h - 160);

  // Header Banner
  ctx.fillStyle = '#ccff00';
  ctx.fillRect(80, 80, w - 160, 220);
  ctx.strokeRect(80, 80, w - 160, 220);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 58px monospace';
  ctx.fillText(`FITNESS GLASS // ${data.cadence.toUpperCase()} PROTOCOL`, 120, 180);

  ctx.font = 'bold 36px monospace';
  ctx.fillStyle = '#111827';
  ctx.fillText(`ATHLETE: ${data.userName.toUpperCase()} · PLAN: ${data.planTitle} · 300 DPI A4 SPECIMEN`, 120, 250);

  // Aggregate Progress Readout
  const avgProg = computeAggregateProgress(data.goals);
  ctx.fillStyle = '#000000';
  ctx.fillRect(w - 620, 110, 500, 160);
  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 44px monospace';
  ctx.fillText(`SCORE: ${avgProg}%`, w - 580, 195);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px monospace';
  ctx.fillText('TARGET COMPLETION', w - 580, 235);

  let curY = 360;

  // SECTION 1 Header: Timetable
  ctx.fillStyle = '#000000';
  ctx.fillRect(80, curY, w - 160, 90);
  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 40px monospace';
  ctx.fillText(`[ 01 ] ${data.cadence.toUpperCase()} SCHEDULE & ROUTINE CHECKMARKS`, 120, curY + 62);
  curY += 120;

  const currentTimetable = data.timetable[data.cadence] || [];
  for (const block of currentTimetable) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, curY, w - 160, 130);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(80, curY, w - 160, 130);

    // Checkbox Square
    ctx.strokeRect(120, curY + 30, 60, 60);
    if (block.completed) {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 50px monospace';
      ctx.fillText('X', 133, curY + 76);
    }

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(block.timeOrDay, 220, curY + 60);
    ctx.font = '28px monospace';
    ctx.fillStyle = '#4b5563';
    ctx.fillText(block.title, 220, curY + 100);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(block.activity.slice(0, 42), 650, curY + 60);
    ctx.font = '26px monospace';
    ctx.fillStyle = '#374151';
    ctx.fillText(`Focus: ${block.focus.slice(0, 48)}`, 650, curY + 100);

    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 30px monospace';
    ctx.fillText(block.targetMetric.slice(0, 36), 1650, curY + 75);

    curY += 145;
  }

  curY += 40;

  // SECTION 2 Header: Measurable Goals
  ctx.fillStyle = '#000000';
  ctx.fillRect(80, curY, w - 160, 90);
  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 40px monospace';
  ctx.fillText(`[ 02 ] MEASURABLE TARGETS & GOALS ANALYSIS (%)`, 120, curY + 62);
  curY += 120;

  for (const g of data.goals) {
    const prog = computeGoalProgress(g);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, curY, w - 160, 120);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(80, curY, w - 160, 120);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(g.title.slice(0, 32), 120, curY + 55);
    ctx.font = '26px monospace';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`[${g.category.toUpperCase()}] ${g.notes || ''}`, 120, curY + 95);

    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#000000';
    ctx.fillText(`BASE: ${g.baseline}${g.unit}`, 900, curY + 70);
    ctx.fillText(`NOW: ${g.current}${g.unit}`, 1220, curY + 70);
    ctx.fillText(`GOAL: ${g.target}${g.unit}`, 1540, curY + 70);

    // Progress Bar
    const barW = 280;
    const fillW = (prog / 100) * barW;
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(1900, curY + 45, barW, 35);
    ctx.fillStyle = '#000000';
    ctx.fillRect(1900, curY + 45, fillW, 35);

    ctx.font = 'bold 32px monospace';
    ctx.fillText(`${prog}%`, 2210, curY + 72);

    curY += 135;
  }

  // Verification Strip
  const footY = h - 220;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(80, footY, w - 160, 120);
  ctx.strokeRect(80, footY, w - 160, 120);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 28px monospace';
  ctx.fillText('ATHLETE SIGNATURE: __________________________', 120, footY + 70);
  ctx.fillText('REVIEW DATE: ____________', 1000, footY + 70);
  ctx.fillText('STATUS: VERIFIED [ ]', 1650, footY + 70);

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
