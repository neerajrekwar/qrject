/**
 * Google Fit API Types, Datasets, and Standards
 * 
 * Provides type definitions for:
 * 1. Google OAuth 2.0 Tokens and Scopes
 * 2. Google Fit REST API (DataSources, Datasets, Points, Aggregates, Sessions)
 * 3. 3 Measurable Targets & Goals Analysis Engine
 * 4. Physiological Presets (Athlete, Gym Bulk Guy, 9-to-5 Office Worker, Metabolic Shred)
 */

// ============================================================================
// 1. Google OAuth 2.0 Scopes & Tokens
// ============================================================================

export const GOOGLE_FIT_SCOPES = [
  // Body metrics (Weight, Height, Body Fat, etc.)
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.body.write',
  // Blood Pressure
  'https://www.googleapis.com/auth/fitness.blood_pressure.read',
  'https://www.googleapis.com/auth/fitness.blood_pressure.write',
  // Physical Activity & Step Count
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  // User profile identification
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

export interface GoogleOAuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
  obtained_at: number; // Milliseconds timestamp
  userEmail?: string;
  userName?: string;
  userImage?: string;
}

// ============================================================================
// 2. Google Fit Standard Activity Type Codes
// Ref: https://developers.google.com/fit/rest/v1/reference/activity-types
// ============================================================================

export const GOOGLE_FIT_ACTIVITY_TYPES: Record<number, { name: string; category: string }> = {
  7: { name: 'Walking', category: 'Cardio' },
  8: { name: 'Running', category: 'Cardio' },
  1: { name: 'Biking / Cycling', category: 'Cardio' },
  80: { name: 'Strength Training / Weightlifting', category: 'Strength' },
  113: { name: 'Calisthenics / Bodyweight', category: 'Strength' },
  114: { name: 'High Intensity Interval Training (HIIT)', category: 'Conditioning' },
  100: { name: 'Yoga', category: 'Flexibility' },
  82: { name: 'Swimming', category: 'Cardio' },
  4: { name: 'Basketball', category: 'Sports' },
  77: { name: 'Squash / Racquet sports', category: 'Sports' },
  9: { name: 'Aerobics', category: 'Conditioning' },
  108: { name: 'Pilates', category: 'Flexibility' },
  97: { name: 'Rowing', category: 'Cardio' },
  0: { name: 'Other', category: 'General' },
};

// ============================================================================
// 3. Google Fit REST API Structures
// ============================================================================

export type FitDataTypeName =
  | 'com.google.step_count.delta'
  | 'com.google.weight'
  | 'com.google.height'
  | 'com.google.blood_pressure'
  | 'com.google.active_minutes'
  | 'com.google.activity.segment';

export interface FitValue {
  intVal?: number;
  fpVal?: number;
  stringVal?: string;
  mapVal?: Array<{ key: string; value: { fpVal?: number } }>;
}

export interface FitDataPoint {
  // Nanosecond timestamps (represented as strings to prevent JS 64-bit float precision loss)
  startTimeNanos: string;
  endTimeNanos: string;
  dataTypeName: FitDataTypeName;
  value: FitValue[];
  originDataSourceId?: string;
}

export interface FitDataset {
  minStartTimeNs: string;
  maxEndTimeNs: string;
  dataSourceId: string;
  point: FitDataPoint[];
}

export interface FitDataSource {
  dataStreamId?: string;
  dataStreamName?: string;
  type: 'raw' | 'derived';
  dataType: {
    name: FitDataTypeName;
    field: Array<{
      name: string;
      format: 'integer' | 'floatPoint' | 'string' | 'map';
      optional?: boolean;
    }>;
  };
  application?: {
    name: string;
    version?: string;
  };
  device?: {
    uid: string;
    type: 'phone' | 'watch' | 'scale' | 'chest_strap' | 'unknown';
    model: string;
    manufacturer: string;
    version: string;
  };
}

export interface FitSession {
  id: string;
  name: string;
  description?: string;
  startTimeMillis: string; // Milliseconds as string
  endTimeMillis: string;   // Milliseconds as string
  activityType: number;    // Activity type code (e.g. 80 for strength, 8 for run)
  application: {
    name: string;
    version?: string;
  };
}

export interface AggregateBucket {
  startTimeMillis: string;
  endTimeMillis: string;
  dataset: Array<{
    dataSourceId: string;
    point: FitDataPoint[];
  }>;
}

export interface AggregateResponse {
  bucket: AggregateBucket[];
}

// ============================================================================
// 4. Clean Application Domain Models
// ============================================================================

export interface DailySummaryMetric {
  date: string; // YYYY-MM-DD
  steps: number;
  weightKg: number | null;
  heightMeters: number | null;
  bloodPressure: {
    systolic: number;
    diastolic: number;
    meanArterialPressure: number;
    status: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis' | 'Not Recorded' | 'Unknown';
  } | null;
  bmi: number | null;
  activeMinutes: number;
  lastUpdatedNanos?: string;
}

export interface ManualHealthReading {
  timestampMs?: number;
  weightKg?: number;
  heightMeters?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    bodyPosition?: 0 | 1 | 2 | 3 | 4; // 0=unspec, 1=standing, 2=sitting, 3=lying, 4=semi-recumbent
    location?: 0 | 1 | 2; // 0=unspec, 1=left upper arm, 2=right upper arm
  };
  note?: string;
}

export interface WorkoutSessionInput {
  id?: string;
  name: string;
  description?: string;
  activityType: number;
  startTimeMillis: number;
  endTimeMillis: number;
}

// ============================================================================
// 5. 3 Measurable Targets & Goals Analysis Models
// ============================================================================

export type PersonaType = 'ATHLETE' | 'GYM_BULK' | 'OFFICE_WORKER' | 'FAT_LOSS_SHRED';

export interface PersonaProfile {
  id: PersonaType;
  title: string;
  tagline: string;
  description: string;
  badgeColor: string;
  targets: {
    // Target 1: Cardiovascular & Daily Movement
    targetStepsDaily: number;
    targetWeeklyWorkouts: number;
    targetWeeklyCardioMinutes: number;
    
    // Target 2: Body Composition & Mass Trajectory
    targetWeightKg: number;
    baselineWeightKg: number;
    targetWeightTrend: 'maintain' | 'bulk_surplus' | 'cut_deficit';
    targetWeeklyWeightChangeKg: number; // e.g. +0.25 kg for bulk, -0.5 kg for cut
    
    // Target 3: Hemodynamic & Vascular Recovery Score
    targetSystolicMax: number;
    targetDiastolicMax: number;
    targetMeanArterialPressure: number; // MAP = (2*DP + SP)/3 ~ 70-100 mmHg
  };
}

export interface MeasurableTargetAnalysis {
  // Target 1: Cardiovascular & Daily Movement Volume
  movementTarget: {
    title: string;
    currentSteps: number;
    targetSteps: number;
    completionPercentage: number; // 0 - 100%+
    activeMinutes: number;
    targetMinutes: number;
    status: 'Optimal' | 'On Track' | 'Under Target' | 'Sedentary Risk';
    insight: string;
  };

  // Target 2: Body Composition & Mass Trajectory
  compositionTarget: {
    title: string;
    currentWeightKg: number;
    targetWeightKg: number;
    baselineWeightKg: number;
    trajectoryPercentage: number; // Progress towards target weight goal
    trendType: 'maintain' | 'bulk_surplus' | 'cut_deficit';
    bmi: number;
    bmiClassification: string;
    status: 'Optimal Rate' | 'On Track' | 'Deviation Warning' | 'Baseline Pending';
    insight: string;
  };

  // Target 3: Hemodynamic & Vascular Recovery Score
  vascularTarget: {
    title: string;
    currentSystolic: number;
    currentDiastolic: number;
    currentMap: number; // Mean arterial pressure
    targetSystolicMax: number;
    targetDiastolicMax: number;
    vascularScorePercentage: number; // 0 - 100% health score
    clinicalStatus: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Not Recorded';
    recoveryReadiness: 'High Performance' | 'Moderate' | 'Stressed / Elevated' | 'Unknown';
    insight: string;
  };

  // Overall Composite Daily Fitness Adherence Score
  compositeFitnessIndex: number; // 0 - 100%
  overallRating: 'Elite Tier' | 'High Adherence' | 'Moderate Progress' | 'Needs Attention';
}
