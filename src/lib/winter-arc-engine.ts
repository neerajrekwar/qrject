import { jsPDF } from 'jspdf';
import { insertDpiIntoPngBlob } from './qr-engine';

export type WinterArcViewMode = '24hrs_timetable' | '90days_matrix' | 'phases_milestones';
export type WinterArcPrintStyle = 'blank_paper_pen' | 'with_digital_checks';
export type WinterArcOrientation = 'auto' | 'portrait' | 'landscape';
export type WinterArcCategory =
  | 'Morning Routine'
  | 'Deep Work'
  | 'Physical Training'
  | 'Nutrition & Fuel'
  | 'Recovery & Sleep'
  | 'Discipline & Mindset';

export interface WinterArc24HrSlot {
  id: string;
  hourRange: string; // e.g., "05:00 - 06:00"
  phaseTitle: string; // e.g., "Dawn Ignition & Hydration"
  category: WinterArcCategory;
  protocol: string; // Details e.g. "Cold plunge/splash, 750ml water + electrolytes, 10 min mobility"
  targetMetric: string; // e.g. "750ml + 10m"
  disciplineRule: string; // Non-negotiable standard
  completed: boolean;
}

export interface WinterArcDayRecord {
  dayNumber: number; // 1 to 90
  phase: 1 | 2 | 3; // Phase 1 (1-30), Phase 2 (31-60), Phase 3 (61-90)
  completed: boolean;
  scorePercent: number; // 0 to 100%
  hoursCompliant: number; // out of active blocks
  dateStr?: string;
  notes?: string;
}

export interface WinterArcGoalStandard {
  id: string;
  name: string;
  category: 'Body Transformation' | 'Physical Training' | 'Deep Work / Skill' | 'Mental Hardness' | 'Nutrition / Sleep';
  startingBaseline: string;
  targetStandard: string;
  currentStatus: string;
  percentAccomplished: number;
}

export interface WinterArcChallengeState {
  athleteName: string;
  challengeTitle: string;
  year: number;
  startDate: string; // 2026-10-01 (or custom)
  endDate: string; // 2026-12-31
  currentDay: number; // 1 to 90
  activeView: WinterArcViewMode;
  printOrientation: WinterArcOrientation;
  printStyle: WinterArcPrintStyle;
  slots24h: WinterArc24HrSlot[];
  dayMatrix: WinterArcDayRecord[]; // 90 days
  standards: WinterArcGoalStandard[];
}

// 24-HOUR STANDARD TIMETABLE FOR WINTER ARC (16 distinct operational windows covering all 24 hours)
export const DEFAULT_WINTER_ARC_24H_SLOTS: WinterArc24HrSlot[] = [
  {
    id: 'wa-slot-01',
    hourRange: '05:00 - 06:00',
    phaseTitle: 'DAWN IGNITION & HYDRATION',
    category: 'Morning Routine',
    protocol: 'Immediate out of bed (no snooze). 750ml iced water + Himalayan salt + lemon. 10m dynamic spinal decompression.',
    targetMetric: '750ml + 0 Snooze',
    disciplineRule: 'Zero smartphone screen checking before 07:00.',
    completed: false,
  },
  {
    id: 'wa-slot-02',
    hourRange: '06:00 - 07:30',
    phaseTitle: 'PHYSICAL FORGE I: HYPERTROPHY & POWER',
    category: 'Physical Training',
    protocol: 'Heavy compound lift session or combat conditioning. High intensity output with tracked tempo.',
    targetMetric: '75-90 min Lift Session',
    disciplineRule: 'Log every working set; 100% focused rest intervals.',
    completed: false,
  },
  {
    id: 'wa-slot-03',
    hourRange: '07:30 - 08:15',
    phaseTitle: 'COLD RECOVERY & CLEAN RE-FUEL',
    category: 'Nutrition & Fuel',
    protocol: 'Cold thermal shower (3 min max cold). High-protein meal (45-50g protein) + creatine + micronutrients.',
    targetMetric: '50g Protein + 3m Cold',
    disciplineRule: 'No refined sugars or packaged pastries.',
    completed: false,
  },
  {
    id: 'wa-slot-04',
    hourRange: '08:15 - 09:00',
    phaseTitle: 'TACTICAL REVIEW & DAILY BRIEF',
    category: 'Discipline & Mindset',
    protocol: 'Review 90-day trajectory. Prioritize top 3 high-impact outcomes for today. Set phone to Do Not Disturb.',
    targetMetric: 'Top 3 Objectives Locked',
    disciplineRule: 'Ruthless elimination of trivial tasks.',
    completed: false,
  },
  {
    id: 'wa-slot-05',
    hourRange: '09:00 - 11:30',
    phaseTitle: 'DEEP WORK BLOCK A: MONK FOCUS',
    category: 'Deep Work',
    protocol: 'Deep uninterrupted cognitive execution. Highest leverage career / engineering / strategic work.',
    targetMetric: '150 min Pure Focus',
    disciplineRule: 'No social media, no messaging tabs open.',
    completed: false,
  },
  {
    id: 'wa-slot-06',
    hourRange: '11:30 - 12:00',
    phaseTitle: 'BIOMETRIC RESET & EYE RELIEF',
    category: 'Recovery & Sleep',
    protocol: '15-min natural outdoor light walk + optical horizon gaze + physiological sigh breathwork.',
    targetMetric: '2,000 Steps Outdoor',
    disciplineRule: 'Leave phone on desk during sunlight exposure.',
    completed: false,
  },
  {
    id: 'wa-slot-07',
    hourRange: '12:00 - 13:00',
    phaseTitle: 'MACRO-BALANCED NOON FUEL',
    category: 'Nutrition & Fuel',
    protocol: 'Clean whole-food lunch: lean meats, complex carbohydrates, fibrous vegetables, 500ml water.',
    targetMetric: '500 Cal Clean + 500ml',
    disciplineRule: 'Mindful chewing; no doom-scrolling while dining.',
    completed: false,
  },
  {
    id: 'wa-slot-08',
    hourRange: '13:00 - 15:30',
    phaseTitle: 'DEEP WORK BLOCK B: ARCHITECTURE & BUILD',
    category: 'Deep Work',
    protocol: 'Execution sprint on core deliverables, implementation, system architecture, or rigorous study.',
    targetMetric: '150 min Deep Sprint',
    disciplineRule: 'Single-tasking only. 1 tab active rule.',
    completed: false,
  },
  {
    id: 'wa-slot-09',
    hourRange: '15:30 - 16:30',
    phaseTitle: 'METABOLIC CONDITIONING / CARDIO',
    category: 'Physical Training',
    protocol: 'Zone 2 aerobic base builder (rucking, incline treadmill, or stationary rower) + 10k daily step milestone.',
    targetMetric: '45m Zone 2 / 10k Steps',
    disciplineRule: 'Nasal breathing target for Zone 2 discipline.',
    completed: false,
  },
  {
    id: 'wa-slot-10',
    hourRange: '16:30 - 17:30',
    phaseTitle: 'ASYNC OPERATIONS & CORRESPONDENCE',
    category: 'Deep Work',
    protocol: 'Batch communication window. Respond to emails, team commits, logistics, and scheduled syncs.',
    targetMetric: 'Inbox Zero & Sync Clear',
    disciplineRule: 'Strict 60-minute timebox; shut down async tabs at 17:30.',
    completed: false,
  },
  {
    id: 'wa-slot-11',
    hourRange: '17:30 - 18:30',
    phaseTitle: 'DISCIPLINE OF MIND: READING & LEARNING',
    category: 'Discipline & Mindset',
    protocol: 'Read 20+ pages of high-substance non-fiction books (philosophy, biology, engineering, discipline).',
    targetMetric: '20 Pages Read + Notes',
    disciplineRule: 'Physical paper book or dedicated e-reader only.',
    completed: false,
  },
  {
    id: 'wa-slot-12',
    hourRange: '18:30 - 19:30',
    phaseTitle: 'FINAL NUTRITION & KITCHEN SHUTDOWN',
    category: 'Nutrition & Fuel',
    protocol: 'Final whole food dinner. Complete daily protein target (1.8g-2.2g per kg bodyweight). 500ml water.',
    targetMetric: 'Daily Macros Met',
    disciplineRule: 'Fast begins promptly after this meal. Zero snacking afterwards.',
    completed: false,
  },
  {
    id: 'wa-slot-13',
    hourRange: '19:30 - 20:30',
    phaseTitle: 'DAILY AUDIT & 80% SCORECARD LOG',
    category: 'Discipline & Mindset',
    protocol: 'Fill the Winter Arc 24h & 90-day checklist. Calculate daily % score (must meet >=80% standard). Plan tomorrow.',
    targetMetric: 'Daily Audit Logged (>=80%)',
    disciplineRule: 'Absolute brutal honesty in scoring.',
    completed: false,
  },
  {
    id: 'wa-slot-14',
    hourRange: '20:30 - 21:30',
    phaseTitle: 'DIGITAL SUNSET & BLUE LIGHT ZERO',
    category: 'Recovery & Sleep',
    protocol: 'Shut down all glowing monitors and screens. Amber/dim warm lighting. Hot magnesium bath or sauna/mobility.',
    targetMetric: 'Screens Off at 20:30',
    disciplineRule: 'Device placed outside the sleeping chamber.',
    completed: false,
  },
  {
    id: 'wa-slot-15',
    hourRange: '21:30 - 22:00',
    phaseTitle: 'CHAMBER PREP & CIRCADIAN GROUNDING',
    category: 'Recovery & Sleep',
    protocol: 'Room cooled to 18-19°C (65-67°F). Blackout curtains sealed. 5m 4-7-8 parasympathetic down-regulation.',
    targetMetric: '100% Dark & 19°C Chamber',
    disciplineRule: 'No lights on once entering bed.',
    completed: false,
  },
  {
    id: 'wa-slot-16',
    hourRange: '22:00 - 05:00',
    phaseTitle: 'CELLULAR REGENERATION (SLEEP)',
    category: 'Recovery & Sleep',
    protocol: '7 full hours of continuous, restorative deep & REM sleep. Zero awakenings, optimized sleep hygiene.',
    targetMetric: '7h Uninterrupted Rest',
    disciplineRule: 'Consistent bed and rise time 7 days a week.',
    completed: false,
  },
];

// 90-DAY STANDARD INITIAL MATRIX (All clean, uncompleted by default)
export function generateInitial90DayMatrix(): WinterArcDayRecord[] {
  const days: WinterArcDayRecord[] = [];
  for (let i = 1; i <= 90; i++) {
    const phase: 1 | 2 | 3 = i <= 30 ? 1 : i <= 60 ? 2 : 3;
    days.push({
      dayNumber: i,
      phase,
      completed: false,
      scorePercent: 0,
      hoursCompliant: 0,
      dateStr: `Day ${i.toString().padStart(2, '0')}`,
    });
  }
  return days;
}

// 4 CORE WINTER ARC STANDARDS
export const DEFAULT_WINTER_ARC_STANDARDS: WinterArcGoalStandard[] = [
  {
    id: 'wa-std-1',
    name: 'Body Fat & Lean Mass Protocol',
    category: 'Body Transformation',
    startingBaseline: '18% Body Fat / 78 kg',
    targetStandard: '12% Body Fat / 76 kg Athletic',
    currentStatus: '17.5% BF / 77.8 kg',
    percentAccomplished: 15,
  },
  {
    id: 'wa-std-2',
    name: '10,000 Steps + Zone 2 Daily Habit',
    category: 'Physical Training',
    startingBaseline: '5,200 Steps avg',
    targetStandard: '10,000+ Steps Daily (90/90 Days)',
    currentStatus: 'Tracking daily (Streak: 0)',
    percentAccomplished: 10,
  },
  {
    id: 'wa-std-3',
    name: 'Deep Work Mastery (5 Hours / Day)',
    category: 'Deep Work / Skill',
    startingBaseline: '2 Hours fragmented',
    targetStandard: '300 Mins High-Output Focus / Day',
    currentStatus: 'Locked to 09:00 & 13:00 blocks',
    percentAccomplished: 20,
  },
  {
    id: 'wa-std-4',
    name: '7h Sleep & Circadian Strictness',
    category: 'Nutrition / Sleep',
    startingBaseline: 'Midnight irregular sleep',
    targetStandard: '22:00 to 05:00 (100% adherence)',
    currentStatus: 'Cold dark chamber configured',
    percentAccomplished: 25,
  },
];

// Helper calculations
export function calculateWinterArcAdherence(slots: WinterArc24HrSlot[]) {
  const total = slots.length;
  const completed = slots.filter((s) => s.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const minRequired80 = Math.ceil(total * 0.8);
  const isPassing80 = completed >= minRequired80;
  const tasksNeeded = Math.max(0, minRequired80 - completed);

  return {
    total,
    completed,
    percent,
    minRequired80,
    isPassing80,
    tasksNeeded,
  };
}

export function calculate90DayProgress(days: WinterArcDayRecord[]) {
  const totalDays = 90;
  const completedDays = days.filter((d) => d.completed).length;
  const passing80Days = days.filter((d) => d.scorePercent >= 80).length;
  const percent90 = Math.round((completedDays / totalDays) * 100);

  const phase1 = days.filter((d) => d.phase === 1);
  const phase2 = days.filter((d) => d.phase === 2);
  const phase3 = days.filter((d) => d.phase === 3);

  const phase1Done = phase1.filter((d) => d.completed).length;
  const phase2Done = phase2.filter((d) => d.completed).length;
  const phase3Done = phase3.filter((d) => d.completed).length;

  return {
    totalDays,
    completedDays,
    passing80Days,
    percent90,
    phase1: { done: phase1Done, total: 30, pct: Math.round((phase1Done / 30) * 100) },
    phase2: { done: phase2Done, total: 30, pct: Math.round((phase2Done / 30) * 100) },
    phase3: { done: phase3Done, total: 30, pct: Math.round((phase3Done / 30) * 100) },
  };
}

// =========================================================================
// HIGH-PRECISION A4 PDF EXPORT FOR WINTER ARC 2026
// Generates either 24-Hour Protocol Sheet or 90-Day Challenge Master Grid
// =========================================================================
export async function exportWinterArcToPDF(state: WinterArcChallengeState): Promise<Blob> {
  // If > 12 slots or in landscape override, use Landscape (297 x 210mm); else Portrait (210 x 297mm)
  const isLandscape =
    state.printOrientation === 'landscape' ||
    (state.printOrientation === 'auto' && (state.slots24h.length > 12 || state.activeView === '90days_matrix'));

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = isLandscape ? 297 : 210;
  const pageHeight = isLandscape ? 210 : 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Background clean canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer framing boundary
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(margin - 2, margin - 2, contentWidth + 4, pageHeight - margin * 2 + 4);

  // Inner border hairline
  doc.setLineWidth(0.2);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  let curY = margin + 5;

  // Header Bar
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, margin, contentWidth, 14, 'F');

  doc.setTextColor(204, 255, 0); // Neon accent
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('WINTER ARC 2026 // 24-HOUR DISCIPLINE TIMETABLE & 90-DAY STANDARD CHALLENGE', margin + 4, margin + 9);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(
    `ATHLETE: ${state.athleteName.toUpperCase()} | 80% MINIMUM PASS REQUIREMENT | BLACK BALL PEN TICK PROTOCOL`,
    margin + 4,
    margin + 12.5
  );

  curY = margin + 17;

  // Sub-header Info Strip
  doc.setFillColor(245, 245, 240);
  doc.rect(margin, curY, contentWidth, 8, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, curY + 8, margin + contentWidth, curY + 8);

  const stats = calculateWinterArcAdherence(state.slots24h);
  const stats90 = calculate90DayProgress(state.dayMatrix);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`TIMEFRAME: OCT 01 - DEC 31, 2026 (90 DAYS)`, margin + 3, curY + 5.5);
  doc.text(
    `24H STATUS: ${stats.completed}/${stats.total} SLOTS (${stats.percent}%) | 80% REQUIREMENT: MIN ${stats.minRequired80} SLOTS`,
    margin + 75,
    curY + 5.5
  );
  doc.text(`90-DAY STREAK: ${stats90.completedDays}/90 DAYS (${stats90.percent90}%)`, margin + 195, curY + 5.5);

  curY += 11;

  if (state.activeView === '90days_matrix') {
    // -------------------------------------------------------------
    // 90-DAY HABIT MATRIX VIEW (10 columns x 9 rows of clean boxes)
    // -------------------------------------------------------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('90-DAY WINTER ARC PROGRESSION MATRIX (DAYS 01 - 90)', margin, curY);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Tick [✓] or mark [X] with a black ball pen each day after completing >= 80% of daily 24h slots.', margin + 110, curY);

    curY += 3;

    const cols = 10;
    const rows = 9;
    const cellW = contentWidth / cols;
    const cellH = (pageHeight - curY - 35) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const dayIdx = r * cols + c;
        if (dayIdx >= 90) break;
        const day = state.dayMatrix[dayIdx];
        const cellX = margin + c * cellW;
        const cellY = curY + r * cellH;

        // Border
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.25);
        if (day.phase === 1) {
          doc.setFillColor(252, 252, 250);
        } else if (day.phase === 2) {
          doc.setFillColor(245, 248, 245);
        } else {
          doc.setFillColor(242, 246, 252);
        }
        doc.rect(cellX, cellY, cellW, cellH, 'FD');

        // Day label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(0, 0, 0);
        doc.text(`DAY ${day.dayNumber.toString().padStart(2, '0')}`, cellX + 2, cellY + 4);

        // Phase tag
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(90, 90, 90);
        doc.text(`P${day.phase}`, cellX + cellW - 6, cellY + 4);

        // Checkbox square (5x5 mm) for ball pen
        const boxSize = 5;
        const boxX = cellX + cellW - boxSize - 2;
        const boxY = cellY + cellH - boxSize - 2;

        doc.setLineWidth(0.35);
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(255, 255, 255);
        doc.rect(boxX, boxY, boxSize, boxSize, 'FD');

        if (state.printStyle === 'with_digital_checks' && day.completed) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          doc.text('✓', boxX + 1, boxY + 4.2);
        }

        // Subline for score writing
        doc.setFontSize(5.5);
        doc.setTextColor(110, 110, 110);
        doc.text('Score: _____ %', cellX + 2, cellY + cellH - 3);
      }
    }

    curY += rows * cellH + 4;
  } else {
    // -------------------------------------------------------------
    // 24-HOUR PROTOCOL TABLE (16 Operational Slots)
    // -------------------------------------------------------------
    const headers = [
      { text: 'VERIF', w: 14 },
      { text: 'HOUR WINDOW', w: 32 },
      { text: 'PROTOCOL PHASE & CATEGORY', w: 55 },
      { text: 'EXACT 24H ROUTINE / ACTION', w: 90 },
      { text: 'TARGET METRIC', w: 36 },
      { text: 'DISCIPLINE MANDATE', w: 50 },
    ];

    let headerX = margin;
    doc.setFillColor(235, 235, 230);
    doc.rect(margin, curY, contentWidth, 6.5, 'F');
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, curY + 6.5, margin + contentWidth, curY + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 0, 0);

    headers.forEach((h) => {
      doc.text(h.text, headerX + 1.5, curY + 4.5);
      headerX += h.w;
      if (headerX < margin + contentWidth) {
        doc.line(headerX, curY, headerX, curY + 6.5);
      }
    });

    curY += 6.5;

    const rowH = Math.min(10.2, (pageHeight - curY - 32) / state.slots24h.length);

    state.slots24h.forEach((slot, idx) => {
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        doc.setFillColor(250, 250, 248);
        doc.rect(margin, curY, contentWidth, rowH, 'F');
      }

      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.18);
      doc.line(margin, curY + rowH, margin + contentWidth, curY + rowH);

      let colX = margin;

      // Col 1: Ball pen check box (5x5 mm square)
      const boxSize = 4.8;
      const bX = colX + (14 - boxSize) / 2;
      const bY = curY + (rowH - boxSize) / 2;
      doc.setLineWidth(0.35);
      doc.rect(bX, bY, boxSize, boxSize);

      if (state.printStyle === 'with_digital_checks' && slot.completed) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('✓', bX + 1, bY + 4.1);
      }

      colX += 14;

      // Col 2: Hour Window
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(0, 0, 0);
      doc.text(slot.hourRange, colX + 1.5, curY + 4.5);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(slot.category.toUpperCase(), colX + 1.5, curY + 8);
      colX += 32;

      // Col 3: Phase Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      const phaseLines = doc.splitTextToSize(slot.phaseTitle, 52);
      doc.text(phaseLines, colX + 1.5, curY + 4);
      colX += 55;

      // Col 4: Protocol Routine Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(20, 20, 20);
      const protoLines = doc.splitTextToSize(slot.protocol, 86);
      doc.text(protoLines.slice(0, 2), colX + 1.5, curY + 3.8);
      colX += 90;

      // Col 5: Target Metric
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(0, 100, 0);
      doc.text(slot.targetMetric, colX + 1.5, curY + 5);
      colX += 36;

      // Col 6: Discipline Rule
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(60, 60, 60);
      const ruleLines = doc.splitTextToSize(slot.disciplineRule, 47);
      doc.text(ruleLines.slice(0, 2), colX + 1.5, curY + 3.8);

      curY += rowH;
    });
  }

  // =========================================================================
  // FOOTER: VERIFICATION, SIGNATURE & 80% ESTIMATE PROTOCOL BLOCK
  // =========================================================================
  const footerY = pageHeight - margin - 22;
  doc.setFillColor(245, 245, 240);
  doc.rect(margin, footerY, contentWidth, 22, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(margin, footerY, contentWidth, 22);

  // Left col: Black ball pen rule
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('PEN DISCIPLINE & 80% REQUIREMENT PROTOCOL:', margin + 3, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('1. Use a black ballpoint pen to tick [✓] or mark [X] strictly after each slot is fulfilled.', margin + 3, footerY + 9);
  doc.text(`2. 80% Daily Pass Standard: Athlete must achieve >= ${stats.minRequired80} of ${stats.total} slots completed daily.`, margin + 3, footerY + 13);
  doc.text('3. Any day under 80% requires immediate 24h reset & reflection log.', margin + 3, footerY + 17);

  // Mid col: Manual verification checkboxes
  const midX = margin + 115;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DAILY VERIFICATION:', midX, footerY + 5);

  doc.rect(midX, footerY + 7.5, 4, 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('PASSED (>= 80% ADHERENCE)', midX + 6, footerY + 10.8);

  doc.rect(midX, footerY + 13.5, 4, 4);
  doc.text('FAILED (< 80% ADHERENCE)', midX + 6, footerY + 16.8);

  // Right col: Signature and Date lines
  const rightX = margin + 195;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EXECUTION ATTESTATION:', rightX, footerY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Date Logged: ____________________', rightX, footerY + 10.5);
  doc.text('Athlete Signature: _________________', rightX, footerY + 16.5);

  return doc.output('blob');
}

// =========================================================================
// RENDER HIGH-DPI A4 CANVAS FOR PNG DOWNLOAD (300 DPI)
// =========================================================================
export async function renderWinterArcToCanvas(
  canvas: HTMLCanvasElement,
  state: WinterArcChallengeState
): Promise<Blob> {
  const isLandscape =
    state.printOrientation === 'landscape' ||
    (state.printOrientation === 'auto' && (state.slots24h.length > 12 || state.activeView === '90days_matrix'));

  const width = isLandscape ? 3508 : 2480;
  const height = isLandscape ? 2480 : 3508;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Frame borders
  const margin = 100;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 10;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Header
  ctx.fillStyle = '#000000';
  ctx.fillRect(margin, margin, width - margin * 2, 180);

  ctx.fillStyle = '#ccff00';
  ctx.font = 'bold 50px monospace';
  ctx.fillText('WINTER ARC 2026 // 24-HOUR PROTOCOL & 90-DAY STANDARD CHALLENGE', margin + 40, margin + 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px monospace';
  ctx.fillText(
    `ATHLETE: ${state.athleteName.toUpperCase()} | 80% MINIMUM ESTIMATE ADHERENCE | PHYSICAL BLACK BALL PEN READY`,
    margin + 40,
    margin + 135
  );

  // Return PNG Blob with DPI insertion
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(async (rawBlob) => {
      if (!rawBlob) {
        reject(new Error('Canvas toBlob failed'));
        return;
      }
      try {
        const dpiBlob = await insertDpiIntoPngBlob(rawBlob, 300);
        resolve(dpiBlob);
      } catch {
        resolve(rawBlob);
      }
    }, 'image/png');
  });
}

// CSV Export for Winter Arc data
export function exportWinterArcToCSV(state: WinterArcChallengeState) {
  const stats = calculateWinterArcAdherence(state.slots24h);
  const rows: string[][] = [];

  rows.push(['WINTER ARC 2026 // 24-HOUR DISCIPLINE TIMETABLE & 90-DAY STANDARDS']);
  rows.push([`Athlete: ${state.athleteName}`, `Year: ${state.year}`, `Start: ${state.startDate}`, `End: ${state.endDate}`]);
  rows.push([`Total Slots: ${stats.total}`, `Completed: ${stats.completed}`, `Rate: ${stats.percent}%`, `Min Required 80%: ${stats.minRequired80} slots`]);
  rows.push([]);
  rows.push(['--- 24-HOUR SCHEDULE SLOTS ---']);
  rows.push(['Hour Range', 'Phase Title', 'Category', 'Routine / Protocol', 'Target Metric', 'Discipline Mandate', 'Status']);

  state.slots24h.forEach((s) => {
    rows.push([
      `"${s.hourRange}"`,
      `"${s.phaseTitle}"`,
      `"${s.category}"`,
      `"${s.protocol.replace(/"/g, '""')}"`,
      `"${s.targetMetric}"`,
      `"${s.disciplineRule.replace(/"/g, '""')}"`,
      s.completed ? 'COMPLETED' : 'PENDING',
    ]);
  });

  rows.push([]);
  rows.push(['--- 90-DAY STANDARD CHALLENGE MATRIX ---']);
  rows.push(['Day Number', 'Phase', 'Completed', 'Compliance %']);
  state.dayMatrix.forEach((d) => {
    rows.push([`Day ${d.dayNumber}`, `Phase ${d.phase}`, d.completed ? 'PASSED' : 'PENDING', `${d.scorePercent}%`]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `Winter_Arc_2026_${state.athleteName.replace(/\s+/g, '_')}_Protocol.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
