/**
 * Google Fitness API Integration Service (googleapis)
 * 
 * Production-ready service wrapping Google Cloud Fitness REST API v1
 * utilizing the official `googleapis` SDK.
 * 
 * ============================================================================
 * TIMESTAMPS & PRECISION ARCHITECTURE:
 * ============================================================================
 * 1. Milliseconds (ms) - Standard Unix Epoch:
 *    - Used by: Sessions API (`startTimeMillis`, `endTimeMillis`),
 *      Aggregation API (`startTimeMillis`, `endTimeMillis`).
 * 
 * 2. Nanoseconds (ns) - High-Precision Sensor Time:
 *    - 1 millisecond = 1,000,000 nanoseconds.
 *    - Used by: Raw DataPoint insertions (`startTimeNanos`, `endTimeNanos`)
 *      and Dataset IDs (`{minStartTimeNs}-{maxEndTimeNs}`).
 *    - BigInt arithmetic (`BigInt(ms) * 1_000_000n`) prevents IEEE-754
 *      floating-point precision loss for 64-bit nanosecond timestamps.
 * ============================================================================
 */

import { google, fitness_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { GoogleOAuthTokens } from './types';

// ============================================================================
// 1. Google OAuth 2.0 Configuration & Scopes
// ============================================================================

export const REQUIRED_FITNESS_SCOPES = [
  // Body metrics (Weight, Height)
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.body.write',
  // Blood Pressure
  'https://www.googleapis.com/auth/fitness.blood_pressure.read',
  'https://www.googleapis.com/auth/fitness.blood_pressure.write',
  // Physical Activity & Step Count
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.activity.write',
  // Profile information for display
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
] as const;

export const APPLICATION_NAME = 'Nedject Fitness Web';
export const APPLICATION_ID = 'com.nedject.fitness';

/**
 * Standard Google Fit Activity Types mapping.
 * Official Google Fit Activity IDs:
 * Ref: https://developers.google.com/fit/rest/v1/reference/activity-types
 */
export const FITNESS_ACTIVITY_MAP: Record<number, { name: string; category: string }> = {
  7: { name: 'Walking', category: 'Cardio' },
  8: { name: 'Running', category: 'Cardio' },
  1: { name: 'Cycling', category: 'Cardio' },
  97: { name: 'Weightlifting', category: 'Strength' },
  80: { name: 'Strength Training', category: 'Strength' },
  114: { name: 'High Intensity Interval Training (HIIT)', category: 'Conditioning' },
  100: { name: 'Yoga', category: 'Flexibility' },
  82: { name: 'Swimming', category: 'Cardio' },
  12: { name: 'Basketball', category: 'Sports' },
  29: { name: 'Soccer', category: 'Sports' },
  35: { name: 'Hiking', category: 'Cardio' },
  21: { name: 'Calisthenics', category: 'Strength' },
  25: { name: 'Elliptical', category: 'Cardio' },
  50: { name: 'Pilates', category: 'Flexibility' },
  54: { name: 'Rowing', category: 'Cardio' },
  72: { name: 'Squash', category: 'Sports' },
  40: { name: 'Jump Rope', category: 'Cardio' },
  0: { name: 'Other Workout', category: 'General' },
};

/**
 * Converts a numeric Google Fit activityType code to a human-readable string.
 */
export function mapActivityTypeCode(activityType: number): string {
  return FITNESS_ACTIVITY_MAP[activityType]?.name || `Activity (${activityType})`;
}

/**
 * Converts milliseconds to nanoseconds string using safe BigInt arithmetic.
 */
export function msToNanos(ms: number): string {
  return (BigInt(Math.floor(ms)) * BigInt(1000000)).toString();
}

/**
 * Converts nanoseconds string to milliseconds integer.
 */
export function nanosToMs(nanos: string): number {
  return Number(BigInt(nanos) / BigInt(1000000));
}

// ============================================================================
// 2. Google OAuth 2.0 Client Factory
// ============================================================================

/**
 * Resolves the Google OAuth 2.0 client configured with credentials from environment.
 */
export function createOAuth2Client(customRedirectUri?: string): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  // Fall back to configured redirect URI or custom override
  const redirectUri =
    customRedirectUri ||
    process.env.GOOGLE_FIT_REDIRECT_URI ||
    'http://localhost:3000/api/auth/callback/google';

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth consent URL requesting offline access and refresh token.
 */
export function getFitnessConsentUrl(redirectUri?: string, state: string = 'dashboard'): string {
  const oauth2Client = createOAuth2Client(redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',       // Ensures a refresh token is returned
    prompt: 'consent',             // Forces consent screen to ensure refresh_token on re-auth
    scope: [...REQUIRED_FITNESS_SCOPES],
    include_granted_scopes: true,
    state,
  });
}

/**
 * Exchanges the authorization code received from Google callback for tokens.
 */
export async function exchangeAuthorizationCode(
  code: string,
  redirectUri?: string
): Promise<GoogleOAuthTokens> {
  const oauth2Client = createOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(tokens);

  let userEmail: string | undefined;
  let userName: string | undefined;
  let userImage: string | undefined;

  // Extract user info from ID Token if available
  if (tokens.id_token) {
    try {
      const parts = tokens.id_token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        userEmail = payload.email;
        userName = payload.name;
        userImage = payload.picture;
      }
    } catch (e) {
      console.warn('Could not decode id_token payload:', e);
    }
  }

  // Fallback to oauth2 userinfo endpoint if email is missing
  if (!userEmail && tokens.access_token) {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      userEmail = userInfo.data.email || undefined;
      userName = userInfo.data.name || userName;
      userImage = userInfo.data.picture || userImage;
    } catch (e) {
      console.warn('Could not fetch oauth2 userinfo:', e);
    }
  }

  const expiresIn = tokens.expiry_date
    ? Math.max(0, Math.floor((tokens.expiry_date - Date.now()) / 1000))
    : 3600;

  return {
    access_token: tokens.access_token || '',
    refresh_token: tokens.refresh_token || undefined,
    expires_in: expiresIn,
    token_type: tokens.token_type || 'Bearer',
    scope: tokens.scope || REQUIRED_FITNESS_SCOPES.join(' '),
    id_token: tokens.id_token || undefined,
    obtained_at: Date.now(),
    userEmail,
    userName,
    userImage,
  };
}

/**
 * Instantiates the googleapis Fitness client configured with the provided access token.
 */
export function getFitnessClient(accessToken: string): fitness_v1.Fitness {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.fitness({ version: 'v1', auth: oauth2Client });
}

// ============================================================================
// 3. Raw Data Source Stream Management (users.dataSources.create)
// ============================================================================

export type RawFitDataType =
  | 'com.google.weight'
  | 'com.google.height'
  | 'com.google.blood_pressure'
  | 'com.google.activity.segment';

/**
 * Checks if a custom raw data source exists in Google Fit; if not, registers it.
 * Uses `fitness.users.dataSources.get` and `fitness.users.dataSources.create`.
 */
export async function getOrCreateRawDataSource(
  fitness: fitness_v1.Fitness,
  dataTypeName: RawFitDataType
): Promise<string> {
  const streamKey = dataTypeName.replace('com.google.', '');
  const dataStreamId = `raw:${dataTypeName}:${APPLICATION_ID}:web:manual_entry:${streamKey}_source`;

  // 1. Check if the data stream already exists
  try {
    const existing = await fitness.users.dataSources.get({
      userId: 'me',
      dataSourceId: dataStreamId,
    });
    if (existing.data?.dataStreamId) {
      return existing.data.dataStreamId;
    }
  } catch (err: any) {
    // 404 is expected if not created yet; any other error will be evaluated
    if (err?.code !== 404 && err?.status !== 404) {
      console.warn(`DataSource lookup notice for ${dataTypeName}:`, err?.message || err);
    }
  }

  // 2. Define schema fields according to Google Fit specifications
  let fields: fitness_v1.Schema$Value[] = [];

  if (dataTypeName === 'com.google.weight') {
    fields = [{ name: 'weight', format: 'floatPoint' } as any];
  } else if (dataTypeName === 'com.google.height') {
    fields = [{ name: 'height', format: 'floatPoint' } as any];
  } else if (dataTypeName === 'com.google.blood_pressure') {
    fields = [
      { name: 'systolic', format: 'floatPoint' } as any,
      { name: 'diastolic', format: 'floatPoint' } as any,
      { name: 'body_position', format: 'integer', optional: true } as any,
      { name: 'blood_pressure_measurement_location', format: 'integer', optional: true } as any,
    ];
  } else if (dataTypeName === 'com.google.activity.segment') {
    fields = [{ name: 'activity', format: 'integer' } as any];
  }

  // 3. Register raw stream via users.dataSources.create
  try {
    const created = await fitness.users.dataSources.create({
      userId: 'me',
      requestBody: {
        dataStreamName: `${APPLICATION_NAME} ${streamKey} Input`,
        type: 'raw',
        dataType: {
          name: dataTypeName,
          field: fields as any,
        },
        application: {
          name: APPLICATION_NAME,
          version: '2.0.0',
        },
        device: {
          uid: 'web-dashboard-01',
          type: 'phone',
          model: 'Browser-Dashboard',
          manufacturer: 'Nedject',
          version: '2026.1',
        },
      },
    });

    return created.data.dataStreamId || dataStreamId;
  } catch (createErr: any) {
    // If it already exists (409 Conflict), return the deterministic ID
    if (createErr?.code === 409 || createErr?.status === 409) {
      return dataStreamId;
    }
    console.warn(`Error registering data stream for ${dataTypeName}:`, createErr?.message || createErr);
    return dataStreamId;
  }
}

// ============================================================================
// 4. Biometrics Insertion (users.dataSources.datasets.patch)
// ============================================================================

export interface BloodPressureInput {
  systolic: number;      // mmHg (e.g. 120)
  diastolic: number;     // mmHg (e.g. 80)
  bodyPosition?: number; // 0=unspecified, 1=standing, 2=sitting, 3=lying down, 4=semi-recumbent
  location?: number;     // 0=unspecified, 1=left upper arm, 2=right upper arm, 3=left wrist, 4=right wrist
}

export interface BiometricMetricInput {
  timestampMs?: number;
  weightKg?: number;
  heightMeters?: number;
  bloodPressure?: BloodPressureInput;
}

/**
 * Inserts manual biometric readings into Google Fit raw datasets.
 * Explicitly converts millisecond timestamps to NANOSECONDS (`ms * 1,000,000`).
 */
export async function insertBiometricMetrics(
  fitness: fitness_v1.Fitness,
  input: BiometricMetricInput
): Promise<{ inserted: string[] }> {
  const timestampMs = input.timestampMs || Date.now();
  // Duration: 1 millisecond window in nanoseconds
  const startTimeNanos = msToNanos(timestampMs);
  const endTimeNanos = msToNanos(timestampMs + 1);
  const datasetId = `${startTimeNanos}-${endTimeNanos}`;

  const inserted: string[] = [];

  // A. Insert Body Weight (com.google.weight)
  if (typeof input.weightKg === 'number' && input.weightKg > 0) {
    const dataSourceId = await getOrCreateRawDataSource(fitness, 'com.google.weight');

    await fitness.users.dataSources.datasets.patch({
      userId: 'me',
      dataSourceId,
      datasetId,
      requestBody: {
        dataSourceId,
        minStartTimeNs: startTimeNanos,
        maxEndTimeNs: endTimeNanos,
        point: [
          {
            startTimeNanos,
            endTimeNanos,
            dataTypeName: 'com.google.weight',
            value: [{ fpVal: input.weightKg }],
          },
        ],
      },
    });
    inserted.push('weight');
  }

  // B. Insert Height (com.google.height)
  if (typeof input.heightMeters === 'number' && input.heightMeters > 0) {
    const dataSourceId = await getOrCreateRawDataSource(fitness, 'com.google.height');

    await fitness.users.dataSources.datasets.patch({
      userId: 'me',
      dataSourceId,
      datasetId,
      requestBody: {
        dataSourceId,
        minStartTimeNs: startTimeNanos,
        maxEndTimeNs: endTimeNanos,
        point: [
          {
            startTimeNanos,
            endTimeNanos,
            dataTypeName: 'com.google.height',
            value: [{ fpVal: input.heightMeters }],
          },
        ],
      },
    });
    inserted.push('height');
  }

  // C. Insert Blood Pressure (com.google.blood_pressure)
  if (
    input.bloodPressure &&
    typeof input.bloodPressure.systolic === 'number' &&
    typeof input.bloodPressure.diastolic === 'number'
  ) {
    const dataSourceId = await getOrCreateRawDataSource(fitness, 'com.google.blood_pressure');

    await fitness.users.dataSources.datasets.patch({
      userId: 'me',
      dataSourceId,
      datasetId,
      requestBody: {
        dataSourceId,
        minStartTimeNs: startTimeNanos,
        maxEndTimeNs: endTimeNanos,
        point: [
          {
            startTimeNanos,
            endTimeNanos,
            dataTypeName: 'com.google.blood_pressure',
            value: [
              { fpVal: input.bloodPressure.systolic },
              { fpVal: input.bloodPressure.diastolic },
              { intVal: input.bloodPressure.bodyPosition ?? 2 }, // Default: Sitting (2)
              { intVal: input.bloodPressure.location ?? 1 },     // Default: Left upper arm (1)
            ],
          },
        ],
      },
    });
    inserted.push('blood_pressure');
  }

  return { inserted };
}

// ============================================================================
// 5. 24h Aggregated Telemetry & Metrics (users.dataset.aggregate)
// ============================================================================

export interface BloodPressureReading {
  systolic: number | null;
  diastolic: number | null;
  meanArterialPressure: number | null;
  status: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis' | 'Not Recorded' | 'Unknown';
  bodyPosition?: string;
  location?: string;
  timestamp?: string;
  isRecorded: boolean;
}

export interface Aggregated24hMetrics {
  steps: number;
  weightKg: number | null;
  heightMeters: number | null;
  bloodPressure: BloodPressureReading | null;
  bmi: number | null;
  timeRange: {
    startMillis: number;
    endMillis: number;
    startDate: string;
    endDate: string;
  };
  lastUpdated: string;
}

/**
 * Calculates Blood Pressure clinical category according to AHA/ACC guidelines.
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number
): BloodPressureReading['status'] {
  if (systolic >= 180 || diastolic >= 120) return 'Hypertensive Crisis';
  if (systolic >= 140 || diastolic >= 90) return 'Stage 2';
  if (systolic >= 130 || diastolic >= 80) return 'Stage 1';
  if (systolic >= 120 && diastolic < 80) return 'Elevated';
  if (systolic < 120 && diastolic < 80) return 'Normal';
  return 'Unknown';
}

/**
 * Fetches last 24h aggregated step delta (`com.google.step_count.delta`)
 * and queries latest weight, height, and blood pressure readings.
 */
export async function getAggregated24hMetrics(
  fitness: fitness_v1.Fitness,
  nowMs: number = Date.now()
): Promise<Aggregated24hMetrics> {
  const startMillis = nowMs - 24 * 60 * 60 * 1000;
  const endMillis = nowMs;

  // 1. Fetch Aggregated Steps Delta using users.dataset.aggregate
  let stepsTotal = 0;
  try {
    const aggRes = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
          },
        ],
        bucketByTime: { durationMillis: (endMillis - startMillis).toString() },
        startTimeMillis: startMillis.toString(),
        endTimeMillis: endMillis.toString(),
      },
    });

    for (const bucket of aggRes.data.bucket || []) {
      for (const dataset of bucket.dataset || []) {
        for (const pt of dataset.point || []) {
          for (const val of pt.value || []) {
            if (typeof val.intVal === 'number') stepsTotal += val.intVal;
            else if (typeof val.fpVal === 'number') stepsTotal += Math.round(val.fpVal);
          }
        }
      }
    }
  } catch (aggErr) {
    console.warn('Error fetching steps aggregate from Google Fit:', aggErr);
  }

  // 2. Fetch Latest Weight, Height, and Blood Pressure
  // Use a 48h forward buffer (nowMs + 86400000 * 2) from epoch 0 to prevent
  // clock drift or timezone offset from excluding recent data points.
  const queryEndNs = msToNanos(nowMs + 86400000 * 2);

  // Helper to fetch points from a specific data source
  const fetchPoints = async (dataSourceId: string, startNs = '0') => {
    try {
      const res = await fitness.users.dataSources.datasets.get({
        userId: 'me',
        dataSourceId,
        datasetId: `${startNs}-${queryEndNs}`,
      });
      return res.data.point || [];
    } catch {
      return [];
    }
  };

  // Discover all active data sources registered in the user's Google Fit account
  let allDataSources: fitness_v1.Schema$DataSource[] = [];
  try {
    const dsList = await fitness.users.dataSources.list({ userId: 'me' });
    allDataSources = dsList.data.dataSource || [];
  } catch (dsErr) {
    console.warn('Note: Could not enumerate all data sources from Google Fit:', dsErr);
  }

  // --------------------------------------------------------------------------
  // A. BLOOD PRESSURE FETCH & "NOT RECORDED" CHECK
  // --------------------------------------------------------------------------
  // Gather all potential blood pressure streams: standard merge, custom app stream, and any third-party monitor streams
  const bpStreamIds = new Set<string>();
  bpStreamIds.add('derived:com.google.blood_pressure:com.google.android.gms:merged');
  bpStreamIds.add(`raw:com.google.blood_pressure:${APPLICATION_ID}:web:manual_entry:blood_pressure_source`);

  for (const ds of allDataSources) {
    if (
      ds.dataStreamId &&
      (ds.dataType?.name === 'com.google.blood_pressure' ||
        ds.dataStreamId.includes('blood_pressure'))
    ) {
      bpStreamIds.add(ds.dataStreamId);
    }
  }

  let newestBpPoint: {
    point: fitness_v1.Schema$DataPoint;
    timestampNanos: bigint;
  } | null = null;

  for (const streamId of bpStreamIds) {
    const points = await fetchPoints(streamId);
    for (const pt of points) {
      // Check both fpVal and intVal in case hardware monitor logs integer values
      const sys = pt.value?.[0]?.fpVal ?? pt.value?.[0]?.intVal;
      const dia = pt.value?.[1]?.fpVal ?? pt.value?.[1]?.intVal;

      if (typeof sys === 'number' && typeof dia === 'number' && sys > 0 && dia > 0) {
        const ptTimeNs = BigInt(pt.startTimeNanos || pt.endTimeNanos || '0');
        if (!newestBpPoint || ptTimeNs > newestBpPoint.timestampNanos) {
          newestBpPoint = { point: pt, timestampNanos: ptTimeNs };
        }
      }
    }
  }

  let latestBP: BloodPressureReading;

  if (newestBpPoint) {
    const pt = newestBpPoint.point;
    const sys = Math.round(pt.value?.[0]?.fpVal ?? pt.value?.[0]?.intVal ?? 0);
    const dia = Math.round(pt.value?.[1]?.fpVal ?? pt.value?.[1]?.intVal ?? 0);
    const posCode = pt.value?.[2]?.intVal;
    const locCode = pt.value?.[3]?.intVal;

    const map = Math.round((2 * dia + sys) / 3);
    const posMap: Record<number, string> = {
      1: 'Standing',
      2: 'Sitting',
      3: 'Lying Down',
      4: 'Semi-recumbent',
    };
    const locMap: Record<number, string> = {
      1: 'Left Upper Arm',
      2: 'Right Upper Arm',
      3: 'Left Wrist',
      4: 'Right Wrist',
    };

    const ptMs = pt.startTimeNanos ? nanosToMs(pt.startTimeNanos) : undefined;

    latestBP = {
      systolic: sys,
      diastolic: dia,
      meanArterialPressure: map,
      status: classifyBloodPressure(sys, dia),
      bodyPosition: posCode ? posMap[posCode] || 'Unspecified' : 'Sitting',
      location: locCode ? locMap[locCode] || 'Unspecified' : 'Left Upper Arm',
      timestamp: ptMs ? new Date(ptMs).toISOString() : undefined,
      isRecorded: true,
    };
  } else {
    // Explicit "Not Recorded" state when no blood pressure readings exist in Google Fit
    latestBP = {
      systolic: null,
      diastolic: null,
      meanArterialPressure: null,
      status: 'Not Recorded',
      bodyPosition: 'Unspecified',
      location: 'Unspecified',
      isRecorded: false,
    };
  }

  // --------------------------------------------------------------------------
  // B. BODY WEIGHT FETCH
  // --------------------------------------------------------------------------
  const weightStreamIds = new Set<string>();
  weightStreamIds.add('derived:com.google.weight:com.google.android.gms:merge_weight');
  weightStreamIds.add(`raw:com.google.weight:${APPLICATION_ID}:web:manual_entry:weight_source`);

  for (const ds of allDataSources) {
    if (
      ds.dataStreamId &&
      (ds.dataType?.name === 'com.google.weight' || ds.dataStreamId.includes('weight'))
    ) {
      weightStreamIds.add(ds.dataStreamId);
    }
  }

  let newestWeightPoint: { val: number; timestampNanos: bigint } | null = null;
  for (const streamId of weightStreamIds) {
    const points = await fetchPoints(streamId);
    for (const pt of points) {
      const val = pt.value?.[0]?.fpVal ?? pt.value?.[0]?.intVal;
      if (typeof val === 'number' && val > 0) {
        const ptTimeNs = BigInt(pt.startTimeNanos || pt.endTimeNanos || '0');
        if (!newestWeightPoint || ptTimeNs > newestWeightPoint.timestampNanos) {
          newestWeightPoint = { val: Number(val.toFixed(1)), timestampNanos: ptTimeNs };
        }
      }
    }
  }
  const latestWeight = newestWeightPoint ? newestWeightPoint.val : null;

  // --------------------------------------------------------------------------
  // C. HEIGHT FETCH
  // --------------------------------------------------------------------------
  const heightStreamIds = new Set<string>();
  heightStreamIds.add('derived:com.google.height:com.google.android.gms:merge_height');
  heightStreamIds.add(`raw:com.google.height:${APPLICATION_ID}:web:manual_entry:height_source`);

  for (const ds of allDataSources) {
    if (
      ds.dataStreamId &&
      (ds.dataType?.name === 'com.google.height' || ds.dataStreamId.includes('height'))
    ) {
      heightStreamIds.add(ds.dataStreamId);
    }
  }

  let newestHeightPoint: { val: number; timestampNanos: bigint } | null = null;
  for (const streamId of heightStreamIds) {
    const points = await fetchPoints(streamId);
    for (const pt of points) {
      const val = pt.value?.[0]?.fpVal ?? pt.value?.[0]?.intVal;
      if (typeof val === 'number' && val > 0) {
        const ptTimeNs = BigInt(pt.startTimeNanos || pt.endTimeNanos || '0');
        if (!newestHeightPoint || ptTimeNs > newestHeightPoint.timestampNanos) {
          newestHeightPoint = { val: Number(val.toFixed(2)), timestampNanos: ptTimeNs };
        }
      }
    }
  }
  const latestHeight = newestHeightPoint ? newestHeightPoint.val : null;

  // Calculate BMI if weight and height are present
  const bmi =
    latestWeight && latestHeight && latestHeight > 0
      ? Number((latestWeight / (latestHeight * latestHeight)).toFixed(1))
      : null;

  return {
    steps: stepsTotal,
    weightKg: latestWeight,
    heightMeters: latestHeight,
    bloodPressure: latestBP,
    bmi,
    timeRange: {
      startMillis,
      endMillis,
      startDate: new Date(startMillis).toISOString(),
      endDate: new Date(endMillis).toISOString(),
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// 6. Workouts & Sessions (Two-Way Sync: users.sessions.list & update)
// ============================================================================

export interface WorkoutSessionItem {
  id: string;
  name: string;
  description?: string;
  activityType: number;
  activityName: string;
  category: string;
  startTimeMillis: number;
  endTimeMillis: number;
  durationMinutes: number;
  formattedDuration: string;
  startDateIso: string;
  sourceApp: string;
  isFromWatchOrPhone: boolean;
}

export interface WorkoutSessionCreateInput {
  name: string;
  activityType: number;
  durationMinutes: number;
  startTimeMillis?: number;
  description?: string;
}

/**
 * Formats duration in minutes into a clean human-readable badge (e.g. "45m" or "1h 15m").
 */
export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * Fetches recent workout sessions logged in Google Fit Android/smartwatch or web
 * using `fitness.users.sessions.list`.
 */
export async function getRecentWorkouts(
  fitness: fitness_v1.Fitness,
  days: number = 7
): Promise<WorkoutSessionItem[]> {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - days * 24 * 60 * 60 * 1000);

  const res = await fitness.users.sessions.list({
    userId: 'me',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
  });

  const sessions = res.data.session || [];

  return sessions
    .map((s): WorkoutSessionItem => {
      const startMs = Number(s.startTimeMillis || 0);
      const endMs = Number(s.endTimeMillis || startMs);
      const durationMs = Math.max(0, endMs - startMs);
      const durationMins = Math.round(durationMs / 60000);
      const actType = s.activityType ?? 0;
      const actInfo = FITNESS_ACTIVITY_MAP[actType] || {
        name: `Activity (${actType})`,
        category: 'Workout',
      };

      const appName = s.application?.name || 'Google Fit Android';
      const isWatchOrPhone =
        appName.toLowerCase().includes('android') ||
        appName.toLowerCase().includes('wear') ||
        appName.toLowerCase().includes('samsung') ||
        appName.toLowerCase().includes('fitbit') ||
        appName.toLowerCase().includes('google');

      return {
        id: s.id || `session-${startMs}`,
        name: s.name || actInfo.name,
        description: s.description || undefined,
        activityType: actType,
        activityName: actInfo.name,
        category: actInfo.category,
        startTimeMillis: startMs,
        endTimeMillis: endMs,
        durationMinutes: durationMins,
        formattedDuration: formatDurationMinutes(durationMins),
        startDateIso: new Date(startMs).toISOString(),
        sourceApp: appName,
        isFromWatchOrPhone: isWatchOrPhone,
      };
    })
    .sort((a, b) => b.startTimeMillis - a.startTimeMillis);
}

/**
 * Creates and updates a completed workout session in Google Fit using
 * `fitness.users.sessions.update` (uses MILLISECONDS).
 * Also patches corresponding `com.google.activity.segment` dataset using NANOSECONDS.
 */
export async function logCompletedWorkoutSession(
  fitness: fitness_v1.Fitness,
  workout: WorkoutSessionCreateInput
): Promise<WorkoutSessionItem> {
  const durationMs = (workout.durationMinutes || 30) * 60 * 1000;
  const endMs = workout.startTimeMillis ? workout.startTimeMillis + durationMs : Date.now();
  const startMs = workout.startTimeMillis || endMs - durationMs;
  const sessionId = `web-session-${workout.activityType}-${startMs}`;

  const activityName = mapActivityTypeCode(workout.activityType);
  const workoutTitle = workout.name?.trim() || `${activityName} Workout`;

  // 1. Write Session to Google Fit via users.sessions.update
  const sessionRes = await fitness.users.sessions.update({
    userId: 'me',
    sessionId,
    requestBody: {
      id: sessionId,
      name: workoutTitle,
      description: workout.description || `${workoutTitle} logged via ${APPLICATION_NAME}`,
      startTimeMillis: startMs.toString(),
      endTimeMillis: endMs.toString(),
      activityType: workout.activityType,
      application: {
        name: APPLICATION_NAME,
        version: '2.0.0',
      },
    },
  });

  // 2. Patch raw activity segment dataset (nanoseconds precision)
  try {
    const dataSourceId = await getOrCreateRawDataSource(fitness, 'com.google.activity.segment');
    const startNs = msToNanos(startMs);
    const endNs = msToNanos(endMs);

    await fitness.users.dataSources.datasets.patch({
      userId: 'me',
      dataSourceId,
      datasetId: `${startNs}-${endNs}`,
      requestBody: {
        dataSourceId,
        minStartTimeNs: startNs,
        maxEndTimeNs: endNs,
        point: [
          {
            startTimeNanos: startNs,
            endTimeNanos: endNs,
            dataTypeName: 'com.google.activity.segment',
            value: [{ intVal: workout.activityType }],
          },
        ],
      },
    });
  } catch (segmentErr) {
    console.warn('Note: Workout session created, segment dataset warning:', segmentErr);
  }

  const actInfo = FITNESS_ACTIVITY_MAP[workout.activityType] || {
    name: activityName,
    category: 'Workout',
  };

  return {
    id: sessionId,
    name: workoutTitle,
    description: workout.description,
    activityType: workout.activityType,
    activityName: actInfo.name,
    category: actInfo.category,
    startTimeMillis: startMs,
    endTimeMillis: endMs,
    durationMinutes: workout.durationMinutes,
    formattedDuration: formatDurationMinutes(workout.durationMinutes),
    startDateIso: new Date(startMs).toISOString(),
    sourceApp: APPLICATION_NAME,
    isFromWatchOrPhone: false,
  };
}
