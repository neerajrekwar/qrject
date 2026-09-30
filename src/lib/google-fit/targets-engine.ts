/**
 * 3 MEASURABLE TARGETS & GOALS ANALYSIS ENGINE (%)
 * 
 * Implements mathematical models and clinical standards for:
 * 1. Target 1: Cardiovascular & Daily Movement Volume (%)
 * 2. Target 2: Body Composition & Mass Trajectory (%)
 * 3. Target 3: Hemodynamic & Vascular Recovery Score (%)
 * 
 * Provides calibrated preset profiles for:
 * - The Athlete (High-Performance Cardio/Endurance)
 * - The Gym Bulk Guy (Hypertrophy & Controlled Anabolic Surplus)
 * - The 9-to-5 Office Person (Desk Worker Circulatory & Anti-Sedentary Reset)
 * - The Metabolic Shred (Cardio Deficit & Muscle Sparing)
 */

import {
  PersonaType,
  PersonaProfile,
  MeasurableTargetAnalysis,
  DailySummaryMetric,
} from './types';

// ============================================================================
// 1. Calibrated Preset Profiles
// ============================================================================

export const PRESET_PERSONAS: Record<PersonaType, PersonaProfile> = {
  ATHLETE: {
    id: 'ATHLETE',
    title: 'High-Performance Athlete',
    tagline: 'Maximal VO2 Engine & Elite Cardiac Output',
    description:
      'Calibrated for marathoners, triathletes, and competitive sports performers requiring high daily movement volume, low resting arterial pressure, and lean body weight stabilization.',
    badgeColor: 'bg-emerald-500 text-black',
    targets: {
      targetStepsDaily: 15000,
      targetWeeklyWorkouts: 6,
      targetWeeklyCardioMinutes: 300,
      targetWeightKg: 70.0,
      baselineWeightKg: 72.0,
      targetWeightTrend: 'maintain',
      targetWeeklyWeightChangeKg: 0.0,
      targetSystolicMax: 115,
      targetDiastolicMax: 75,
      targetMeanArterialPressure: 85,
    },
  },

  GYM_BULK: {
    id: 'GYM_BULK',
    title: 'Gym Bulk & Strength Lifter',
    tagline: 'Controlled Anabolic Surplus & Progressive Hypertrophy',
    description:
      'Engineered for strength athletes and bodybuilders seeking clean hypertrophy. Balances sufficient daily NEAT for nutrient partitioning while avoiding excessive caloric burn, and closely tracks blood pressure under heavy load.',
    badgeColor: 'bg-purple-500 text-white',
    targets: {
      targetStepsDaily: 8500,
      targetWeeklyWorkouts: 5,
      targetWeeklyCardioMinutes: 75,
      targetWeightKg: 86.0,
      baselineWeightKg: 80.0,
      targetWeightTrend: 'bulk_surplus',
      targetWeeklyWeightChangeKg: 0.3, // ~300g lean gain per week
      targetSystolicMax: 125,
      targetDiastolicMax: 82,
      targetMeanArterialPressure: 90,
    },
  },

  OFFICE_WORKER: {
    id: 'OFFICE_WORKER',
    title: '9-to-5 Office Desk Worker',
    tagline: 'Anti-Sedentary Reset & Stress-Mitigation Protocol',
    description:
      'Optimized for knowledge workers seated 7-9 hours per day. Prioritizes breaking sedentary bouts, reducing work-related arterial tension, and maintaining metabolic health with sustainable step targets.',
    badgeColor: 'bg-blue-500 text-white',
    targets: {
      targetStepsDaily: 8000,
      targetWeeklyWorkouts: 3,
      targetWeeklyCardioMinutes: 150,
      targetWeightKg: 74.0,
      baselineWeightKg: 80.0,
      targetWeightTrend: 'cut_deficit',
      targetWeeklyWeightChangeKg: -0.4, // ~400g sustainable loss per week
      targetSystolicMax: 120,
      targetDiastolicMax: 80,
      targetMeanArterialPressure: 88,
    },
  },

  FAT_LOSS_SHRED: {
    id: 'FAT_LOSS_SHRED',
    title: 'Metabolic Shred & Rapid Cut',
    tagline: 'High Caloric Expenditure & Lean Sparing',
    description:
      'Formulated for intense cutting phases. Combines high daily step thresholds, regular cardio, and precise vascular tracking to avoid overtraining and adrenal fatigue.',
    badgeColor: 'bg-amber-500 text-black',
    targets: {
      targetStepsDaily: 12500,
      targetWeeklyWorkouts: 5,
      targetWeeklyCardioMinutes: 220,
      targetWeightKg: 72.0,
      baselineWeightKg: 79.0,
      targetWeightTrend: 'cut_deficit',
      targetWeeklyWeightChangeKg: -0.6,
      targetSystolicMax: 118,
      targetDiastolicMax: 78,
      targetMeanArterialPressure: 86,
    },
  },
};

// ============================================================================
// 2. BMI Calculation & Clinical Classifications
// ============================================================================

export function calculateBMI(weightKg: number, heightMeters: number): { bmi: number; classification: string } {
  if (weightKg <= 0 || heightMeters <= 0) {
    return { bmi: 0, classification: 'Unknown' };
  }
  const bmi = Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
  let classification = 'Normal Weight';

  if (bmi < 18.5) classification = 'Underweight';
  else if (bmi < 25.0) classification = 'Normal Weight (Optimal)';
  else if (bmi < 30.0) classification = 'Overweight (Pre-Obese)';
  else if (bmi < 35.0) classification = 'Obese Class I';
  else classification = 'Obese Class II+';

  return { bmi, classification };
}

// ============================================================================
// 3. Targets Analysis Computation Engine
// ============================================================================

/**
 * Evaluates current health metrics against the selected persona's targets
 * producing explicit percentage completions, clinical indicators, and insights.
 */
export function analyze3MeasurableTargets(
  currentMetric: DailySummaryMetric,
  personaType: PersonaType = 'OFFICE_WORKER',
  customOverrides?: Partial<PersonaProfile['targets']>
): MeasurableTargetAnalysis {
  const baseProfile = PRESET_PERSONAS[personaType];
  const targets = { ...baseProfile.targets, ...customOverrides };

  // --------------------------------------------------------------------------
  // Target 1: Cardiovascular & Daily Movement Volume (%)
  // --------------------------------------------------------------------------
  const currentSteps = currentMetric.steps || 0;
  const targetSteps = targets.targetStepsDaily;
  const stepPercentage = Math.round((currentSteps / targetSteps) * 100);

  let movementStatus: MeasurableTargetAnalysis['movementTarget']['status'] = 'On Track';
  let movementInsight = '';

  if (stepPercentage >= 100) {
    movementStatus = 'Optimal';
    movementInsight = `Outstanding volume! Exceeded target by ${stepPercentage - 100}% (+${(
      currentSteps - targetSteps
    ).toLocaleString()} steps). Excellent metabolic activation.`;
  } else if (stepPercentage >= 75) {
    movementStatus = 'On Track';
    movementInsight = `Solid momentum (${stepPercentage}%). Remaining ${(
      targetSteps - currentSteps
    ).toLocaleString()} steps achievable with a 20-min evening walk.`;
  } else if (stepPercentage >= 50) {
    movementStatus = 'Under Target';
    movementInsight = `Moderate pace (${stepPercentage}%). Prioritize dynamic standing intervals and post-meal strolls.`;
  } else {
    movementStatus = 'Sedentary Risk';
    movementInsight = `Prolonged sitting detected (${stepPercentage}% of target). Increased risk of vascular pooling and insulin resistance. Take a 10-min movement break.`;
  }

  // --------------------------------------------------------------------------
  // Target 2: Body Composition & Mass Trajectory (%)
  // --------------------------------------------------------------------------
  const currentWeight = currentMetric.weightKg || targets.baselineWeightKg;
  const targetWeight = targets.targetWeightKg;
  const baselineWeight = targets.baselineWeightKg;
  const height = currentMetric.heightMeters || 1.75;
  const { bmi, classification: bmiClassification } = calculateBMI(currentWeight, height);

  let trajectoryPercentage = 0;
  let compStatus: MeasurableTargetAnalysis['compositionTarget']['status'] = 'On Track';
  let compInsight = '';

  if (targets.targetWeightTrend === 'bulk_surplus') {
    // Hypertrophy bulk: Moving from baseline UP to target
    const totalToGain = targetWeight - baselineWeight;
    const gained = currentWeight - baselineWeight;
    if (totalToGain > 0) {
      trajectoryPercentage = Math.min(100, Math.max(0, Math.round((gained / totalToGain) * 100)));
    } else {
      trajectoryPercentage = 100;
    }

    if (currentWeight >= targetWeight) {
      compStatus = 'Optimal Rate';
      compInsight = `Bulk goal reached (${currentWeight} kg)! Consider entering a 4-week maintenance consolidation phase before further surplus.`;
    } else if (gained >= 0) {
      compStatus = 'On Track';
      compInsight = `${gained.toFixed(1)} kg accrued towards ${targetWeight} kg target (${trajectoryPercentage}% completed). Retain ~250-350 kcal surplus.`;
    } else {
      compStatus = 'Deviation Warning';
      compInsight = `Weight dipped below baseline (${currentWeight} kg). Caloric intake is insufficient to support hypertrophy demands.`;
    }
  } else if (targets.targetWeightTrend === 'cut_deficit') {
    // Fat loss cut: Moving from baseline DOWN to target
    const totalToLose = baselineWeight - targetWeight;
    const lost = baselineWeight - currentWeight;
    if (totalToLose > 0) {
      trajectoryPercentage = Math.min(100, Math.max(0, Math.round((lost / totalToLose) * 100)));
    } else {
      trajectoryPercentage = 100;
    }

    if (currentWeight <= targetWeight) {
      compStatus = 'Optimal Rate';
      compInsight = `Target weight achieved (${currentWeight} kg)! Transition to maintenance reverse dieting to sustain leptin and metabolic rate.`;
    } else if (lost >= 0) {
      compStatus = 'On Track';
      compInsight = `${lost.toFixed(1)} kg lost out of ${(baselineWeight - targetWeight).toFixed(1)} kg target (${trajectoryPercentage}% completed). Keep protein intake above 2.0g/kg.`;
    } else {
      compStatus = 'Deviation Warning';
      compInsight = `Weight increased above baseline (+${Math.abs(lost).toFixed(1)} kg). Review hidden liquid calories and weekend surplus.`;
    }
  } else {
    // Maintenance
    const deviation = Math.abs(currentWeight - targetWeight);
    trajectoryPercentage = Math.max(0, 100 - Math.round(deviation * 15));
    if (deviation <= 0.8) {
      compStatus = 'Optimal Rate';
      compInsight = `Excellent body mass stability (±${deviation.toFixed(1)} kg from ${targetWeight} kg target). Homeostasis maintained.`;
    } else {
      compStatus = 'On Track';
      compInsight = `Weight fluctuates ${deviation.toFixed(1)} kg from baseline. Adjust portion sizing to preserve equilibrium.`;
    }
  }

  // --------------------------------------------------------------------------
  // Target 3: Hemodynamic & Vascular Recovery Score (%)
  // --------------------------------------------------------------------------
  const bp = currentMetric.bloodPressure;
  let systolic = bp?.systolic || 120;
  let diastolic = bp?.diastolic || 80;
  let map = bp?.meanArterialPressure || Math.round((2 * diastolic + systolic) / 3);

  let vascularScore = 100;
  let clinicalStatus: MeasurableTargetAnalysis['vascularTarget']['clinicalStatus'] = 'Normal';
  let recoveryReadiness: MeasurableTargetAnalysis['vascularTarget']['recoveryReadiness'] = 'High Performance';
  let vascularInsight = '';

  if (!bp) {
    clinicalStatus = 'Not Recorded';
    vascularScore = 80; // Neutral default until measurement
    recoveryReadiness = 'Unknown';
    vascularInsight = 'No recent blood pressure reading recorded. Sync smart tracker or log a manual measurement to evaluate vascular tone.';
  } else {
    // Deduct points based on clinical thresholds
    if (systolic >= 140 || diastolic >= 90) {
      clinicalStatus = 'Stage 2';
      vascularScore = Math.max(35, 100 - (systolic - 130) * 1.5 - (diastolic - 85) * 1.5);
      recoveryReadiness = 'Stressed / Elevated';
      vascularInsight = `Elevated arterial resistance (${systolic}/${diastolic} mmHg). Limit high-stimulant pre-workouts; incorporate diaphragmatic box breathing.`;
    } else if (systolic >= 130 || diastolic >= 80) {
      clinicalStatus = 'Stage 1';
      vascularScore = Math.max(65, 90 - (systolic - 120) * 1.2);
      recoveryReadiness = 'Moderate';
      vascularInsight = `Borderline pressure reading (${systolic}/${diastolic} mmHg). Monitor sodium/potassium ratio and prioritize magnesium supplementation.`;
    } else if (systolic >= 120 && diastolic < 80) {
      clinicalStatus = 'Elevated';
      vascularScore = 85;
      recoveryReadiness = 'Moderate';
      vascularInsight = `Slightly elevated systolic (${systolic} mmHg). Good peripheral control. Maintain aerobic base training to support nitric oxide release.`;
    } else {
      clinicalStatus = 'Normal';
      vascularScore = 98;
      recoveryReadiness = 'High Performance';
      vascularInsight = `Optimal vascular compliance (${systolic}/${diastolic} mmHg, MAP: ${map} mmHg). Ideal cardiovascular condition for high-intensity exertion.`;
    }
  }

  // --------------------------------------------------------------------------
  // Composite Daily Fitness Adherence Index (%)
  // Weighted: Movement (40%), Composition (30%), Hemodynamic/Recovery (30%)
  // --------------------------------------------------------------------------
  const cappedStepPct = Math.min(100, stepPercentage);
  const compositeIndex = Math.round(
    cappedStepPct * 0.4 + trajectoryPercentage * 0.3 + vascularScore * 0.3
  );

  let overallRating: MeasurableTargetAnalysis['overallRating'] = 'High Adherence';
  if (compositeIndex >= 90) overallRating = 'Elite Tier';
  else if (compositeIndex >= 75) overallRating = 'High Adherence';
  else if (compositeIndex >= 55) overallRating = 'Moderate Progress';
  else overallRating = 'Needs Attention';

  return {
    movementTarget: {
      title: 'Target 1: Cardiovascular & Daily Movement Volume',
      currentSteps,
      targetSteps,
      completionPercentage: stepPercentage,
      activeMinutes: currentMetric.activeMinutes || 0,
      targetMinutes: Math.round(targets.targetWeeklyCardioMinutes / 7),
      status: movementStatus,
      insight: movementInsight,
    },
    compositionTarget: {
      title: 'Target 2: Body Composition & Mass Trajectory',
      currentWeightKg: currentWeight,
      targetWeightKg: targetWeight,
      baselineWeightKg: baselineWeight,
      trajectoryPercentage,
      trendType: targets.targetWeightTrend,
      bmi,
      bmiClassification,
      status: compStatus,
      insight: compInsight,
    },
    vascularTarget: {
      title: 'Target 3: Hemodynamic & Vascular Recovery Score',
      currentSystolic: systolic,
      currentDiastolic: diastolic,
      currentMap: map,
      targetSystolicMax: targets.targetSystolicMax,
      targetDiastolicMax: targets.targetDiastolicMax,
      vascularScorePercentage: Math.round(vascularScore),
      clinicalStatus,
      recoveryReadiness,
      insight: vascularInsight,
    },
    compositeFitnessIndex: compositeIndex,
    overallRating,
  };
}
