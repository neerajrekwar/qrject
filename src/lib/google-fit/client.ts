/**
 * Google Fit REST API Engine & OAuth 2.0 Integration Client
 * 
 * ============================================================================
 * ARCHITECTURAL NOTES ON GOOGLE FIT CONVENTIONS & TIMESTAMPS
 * ============================================================================
 * 
 * 1. DATASET NAMING CONVENTIONS ("raw:..." vs "derived:..."):
 * ----------------------------------------------------------------------------
 * Google Fit structures all health streams using unique Data Source IDs:
 * Format:
 *   [type]:[dataTypeName]:[applicationId]:[deviceManufacturer]:[deviceModel]:[deviceUid]
 * 
 * - "raw:com.google...":
 *   Identifies original, unmodified telemetry directly from hardware sensors
 *   or manual user input from a client application.
 *   Example: "raw:com.google.weight:com.nedject.fitness:web:manual_entry:user_weight"
 *   Always use "raw:" when writing user inputs or direct Bluetooth sync readings.
 * 
 * - "derived:com.google...":
 *   Identifies data calculated, merged, cleaned, or aggregated by Google Fit's
 *   internal pipeline (e.g. merging step counts from phone accelerometer + smartwatch).
 *   Example: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
 *   "derived:" streams should generally only be READ, as Google calculates them.
 * 
 * - DATASET ID CONVENTION:
 *   When patching or querying a dataset within a data source, the dataset ID is
 *   formatted as "{minStartTimeNs}-{maxEndTimeNs}".
 *   Path: /users/me/dataSources/{dataSourceId}/datasets/{minStartTimeNs}-{maxEndTimeNs}
 * 
 * 2. TIMESTAMP CONVERSIONS (Nanoseconds vs Milliseconds):
 * ----------------------------------------------------------------------------
 * Google Fit operates on two distinct time precisions:
 * - NANOSECONDS (ns): 1 millisecond = 1,000,000 nanoseconds.
 *   Used for: Individual DataPoints (`startTimeNanos`, `endTimeNanos`) and Dataset IDs.
 *   WARNING: JavaScript standard `Number` is IEEE-754 double-precision float, safe only up
 *   to Number.MAX_SAFE_INTEGER (~9e15). A nanosecond timestamp for year 2026 is ~1.77e18!
 *   Therefore, ALWAYS use BigInt arithmetic (`BigInt(ms) * 1_000_000n`) and serialize as
 *   Strings when communicating with Google Fit REST endpoints to prevent bit truncation.
 * 
 * - MILLISECONDS (ms): standard Unix epoch time (Date.now()).
 *   Used for: Aggregation API (`users/me/dataset:aggregate`), Sessions API (`startTimeMillis`,
 *   `endTimeMillis`), and OAuth token expiries.
 * ============================================================================
 */

import {
  GOOGLE_FIT_SCOPES,
  GoogleOAuthTokens,
  DailySummaryMetric,
  ManualHealthReading,
  WorkoutSessionInput,
  FitSession,
  AggregateResponse,
  FitDataSource,
} from './types';

const GOOGLE_FIT_BASE_URL = 'https://fitness.googleapis.com/fitness/v1/users/me';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const APPLICATION_NAME = 'NedjectFitness';
const APPLICATION_ID = 'com.nedject.fitness';

/**
 * Converts a millisecond timestamp to nanoseconds string using BigInt.
 * Prevents JavaScript 64-bit float precision loss.
 */
export function millisToNanosStr(millis: number): string {
  return (BigInt(Math.floor(millis)) * BigInt(1000000)).toString();
}

/**
 * Converts nanoseconds string back to millisecond integer.
 */
export function nanosStrToMillis(nanos: string): number {
  return Number(BigInt(nanos) / BigInt(1000000));
}

// ============================================================================
// 1. Google OAuth 2.0 Flow Helpers
// ============================================================================

/**
 * Generates the Google OAuth 2.0 consent URL requesting the required Google Fit scopes.
 * Requests offline access with forced consent prompt to ensure a refresh token is returned.
 */
export function getGoogleAuthUrl(redirectUri: string, state: string = 'fitness_connect'): string {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    console.warn('WARNING: GOOGLE_CLIENT_ID is not configured in environment variables.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_FIT_SCOPES.join(' '),
    access_type: 'offline', // Mandatory for obtaining refresh_token
    prompt: 'consent',       // Forces refresh_token issuance on re-authentication
    include_granted_scopes: 'true',
    state,
  });

  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges the authorization code received from Google callback for access & refresh tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<GoogleOAuthTokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are missing.');
  }

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange authorization code for tokens: ${errorText}`);
  }

  const data = await response.json();
  let userEmail: string | undefined;
  let userName: string | undefined;
  let userImage: string | undefined;

  if (data.id_token) {
    try {
      const parts = data.id_token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        userEmail = payload.email;
        userName = payload.name;
        userImage = payload.picture;
      }
    } catch (parseErr) {
      console.warn('Could not parse id_token in exchangeCodeForTokens:', parseErr);
    }
  }

  // Fallback to Google userinfo endpoint if email was not in id_token
  if (!userEmail && data.access_token) {
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      if (userinfoRes.ok) {
        const userInfo = await userinfoRes.json();
        userEmail = userInfo.email;
        userName = userInfo.name || userName;
        userImage = userInfo.picture || userImage;
      }
    } catch (uErr) {
      console.warn('Could not fetch userinfo in exchangeCodeForTokens:', uErr);
    }
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
    id_token: data.id_token,
    obtained_at: Date.now(),
    userEmail,
    userName,
    userImage,
  };
}

/**
 * Refreshes an expired Google access token using the stored refresh token.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  obtained_at: number;
}> {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh Google OAuth token: ${errorText}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
    obtained_at: Date.now(),
  };
}

// ============================================================================
// 2. Data Source Initialization & Caching
// ============================================================================

/**
 * Ensures a custom "raw:" data source exists in Google Fit before writing data points.
 * Creates the data source via POST /users/me/dataSources if it doesn't already exist.
 */
export async function ensureRawDataSource(
  accessToken: string,
  dataTypeName: 'com.google.weight' | 'com.google.height' | 'com.google.blood_pressure' | 'com.google.activity.segment'
): Promise<string> {
  const streamKey = dataTypeName.replace('com.google.', '');
  const dataStreamId = `raw:${dataTypeName}:${APPLICATION_ID}:web:manual_entry:${streamKey}_source`;

  // First verify if it exists
  const checkRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataStreamId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (checkRes.ok) {
    return dataStreamId;
  }

  // Construct Data Source schema according to Google Fit requirements
  let fields: Array<{ name: string; format: 'integer' | 'floatPoint' | 'string' | 'map'; optional?: boolean }> = [];

  if (dataTypeName === 'com.google.weight') {
    fields = [{ name: 'weight', format: 'floatPoint' }];
  } else if (dataTypeName === 'com.google.height') {
    fields = [{ name: 'height', format: 'floatPoint' }];
  } else if (dataTypeName === 'com.google.blood_pressure') {
    fields = [
      { name: 'systolic', format: 'floatPoint' },
      { name: 'diastolic', format: 'floatPoint' },
      { name: 'body_position', format: 'integer', optional: true },
      { name: 'blood_pressure_measurement_location', format: 'integer', optional: true },
    ];
  } else if (dataTypeName === 'com.google.activity.segment') {
    fields = [{ name: 'activity', format: 'integer' }];
  }

  const dataSourcePayload: FitDataSource = {
    dataStreamName: `${APPLICATION_NAME} ${streamKey} Input`,
    type: 'raw',
    dataType: {
      name: dataTypeName,
      field: fields,
    },
    application: {
      name: APPLICATION_NAME,
      version: '1.0.0',
    },
    device: {
      uid: 'web-client-01',
      type: 'phone',
      model: 'Chrome-Web-Interface',
      manufacturer: 'Nedject-Health',
      version: '2026.1',
    },
  };

  const createRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dataSourcePayload),
  });

  if (!createRes.ok && createRes.status !== 409) {
    const errorText = await createRes.text();
    console.warn(`DataSource creation note (${dataTypeName}):`, errorText);
  }

  return dataStreamId;
}

// ============================================================================
// 3. Helper: Fetch Latest Body Metrics & Aggregated Daily Summaries
// ============================================================================

/**
 * Fetches the user's latest recorded body metrics (weight, height, blood pressure)
 * directly from Google Fit data sources and datasets.
 * In the Google Fit app, users typically enter their height or weight in their profile once,
 * which may fall outside the recent 7-day query window.
 */
export async function fetchLatestBodyMetrics(accessToken: string): Promise<{
  weightKg: number | null;
  heightMeters: number | null;
  bloodPressure: DailySummaryMetric['bloodPressure'] | null;
  dataSourcesCount?: number;
}> {
  let weightKg: number | null = null;
  let heightMeters: number | null = null;
  let bloodPressure: DailySummaryMetric['bloodPressure'] = null;

  const nowNanos = millisToNanosStr(Date.now());
  // Use start 0 (epoch 0) so historical profile entries (like height set years ago) are retrieved
  const fetchDatasetPoints = async (
    dataSourceId: string,
    startNanos: string = '0',
    endNanos: string = nowNanos
  ) => {
    try {
      const url = `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${startNanos}-${endNanos}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.point || [];
      }
    } catch {
      // Ignore individual stream fetch error
    }
    return [];
  };

  // 1. Try standard Google Fit merged streams first
  try {
    const weightPoints = await fetchDatasetPoints('derived:com.google.weight:com.google.android.gms:merge_weight');
    if (weightPoints.length > 0) {
      const lastPt = weightPoints[weightPoints.length - 1];
      if (typeof lastPt.value?.[0]?.fpVal === 'number') {
        weightKg = Number(lastPt.value[0].fpVal.toFixed(1));
      }
    }
  } catch (e) {
    console.warn('Could not read merge_weight dataset:', e);
  }

  try {
    const heightPoints = await fetchDatasetPoints('derived:com.google.height:com.google.android.gms:merge_height');
    if (heightPoints.length > 0) {
      const lastPt = heightPoints[heightPoints.length - 1];
      if (typeof lastPt.value?.[0]?.fpVal === 'number') {
        heightMeters = Number(lastPt.value[0].fpVal.toFixed(2));
      }
    }
  } catch (e) {
    console.warn('Could not read merge_height dataset:', e);
  }

  // 2. If weight, height, or blood pressure not found, discover from user's active data sources
  let discoveredCount = 0;
  if (weightKg === null || heightMeters === null || bloodPressure === null) {
    try {
      const dsRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (dsRes.ok) {
        const dsData = await dsRes.json();
        const sources: Array<{ dataStreamId: string; dataType?: { name: string } }> = dsData.dataSource || [];
        discoveredCount = sources.length;

        for (const src of sources) {
          if (!src.dataStreamId) continue;

          // Check for weight if still missing
          if (weightKg === null && src.dataType?.name === 'com.google.weight') {
            const pts = await fetchDatasetPoints(src.dataStreamId);
            if (pts.length > 0) {
              const lastVal = pts[pts.length - 1].value?.[0]?.fpVal;
              if (typeof lastVal === 'number') {
                weightKg = Number(lastVal.toFixed(1));
              }
            }
          }

          // Check for height if still missing
          if (heightMeters === null && src.dataType?.name === 'com.google.height') {
            const pts = await fetchDatasetPoints(src.dataStreamId);
            if (pts.length > 0) {
              const lastVal = pts[pts.length - 1].value?.[0]?.fpVal;
              if (typeof lastVal === 'number') {
                heightMeters = Number(lastVal.toFixed(2));
              }
            }
          }

          // Check for blood pressure if still missing
          if (bloodPressure === null && src.dataType?.name === 'com.google.blood_pressure') {
            const pts = await fetchDatasetPoints(src.dataStreamId);
            if (pts.length > 0) {
              const lastPt = pts[pts.length - 1];
              const sys = lastPt.value?.[0]?.fpVal ?? null;
              const dia = lastPt.value?.[1]?.fpVal ?? null;
              if (sys !== null && dia !== null) {
                const map = Math.round((2 * dia + sys) / 3);
                let classification: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis' = 'Normal';
                if (sys >= 180 || dia >= 120) classification = 'Hypertensive Crisis';
                else if (sys >= 140 || dia >= 90) classification = 'Stage 2';
                else if (sys >= 130 || dia >= 80) classification = 'Stage 1';
                else if (sys >= 120 && dia < 80) classification = 'Elevated';

                bloodPressure = {
                  systolic: sys,
                  diastolic: dia,
                  meanArterialPressure: map,
                  status: classification,
                };
              }
            }
          }
        }
      }
    } catch (dsErr) {
      console.warn('Error discovering dataSources for latest body metrics:', dsErr);
    }
  }

  return { weightKg, heightMeters, bloodPressure, dataSourcesCount: discoveredCount };
}

export interface FetchSummariesResult {
  summaries: DailySummaryMetric[];
  diagnostics: {
    stepsAggregateStatus?: number;
    stepsAggregateError?: string;
    totalStepsFetched: number;
    dataSourcesCount: number;
    latestBody: {
      weightKg: number | null;
      heightMeters: number | null;
      bloodPressure: DailySummaryMetric['bloodPressure'] | null;
    };
  };
}

/**
 * Fetches aggregated daily summaries across Steps, Active Minutes, and Weight
 * bucketed by 1 calendar day (86,400,000 milliseconds).
 * Employs clean, isolated queries and automatic direct stream fallback so that
 * user data from the Google Fit app is reliably extracted.
 */
export async function fetchAggregatedDailySummaries(
  accessToken: string,
  startTimeMillis: number,
  endTimeMillis: number
): Promise<FetchSummariesResult> {
  // 1. Primary: Step Count Aggregation (standard Google Fit aggregate data type)
  const stepsPayload = {
    aggregateBy: [
      {
        dataTypeName: 'com.google.step_count.delta',
      },
    ],
    bucketByTime: { durationMillis: 86400000 },
    startTimeMillis,
    endTimeMillis,
  };

  let stepsBuckets: any[] = [];
  let stepsAggregateStatus: number | undefined;
  let stepsAggregateError: string | undefined;

  try {
    const stepsRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stepsPayload),
    });

    stepsAggregateStatus = stepsRes.status;
    if (stepsRes.ok) {
      const data = await stepsRes.json();
      stepsBuckets = data.bucket || [];
    } else {
      stepsAggregateError = await stepsRes.text();
      console.warn(`Google Fit steps aggregate warning (${stepsRes.status}):`, stepsAggregateError);
    }
  } catch (err: any) {
    stepsAggregateError = err.message;
    console.error('Failed to fetch steps aggregate:', err);
  }

  // 2. Map returned step buckets by ISO date string (YYYY-MM-DD)
  const stepsByDate = new Map<string, number>();
  for (const bucket of stepsBuckets) {
    const bucketStartMs = Number(bucket.startTimeMillis);
    const dateStr = new Date(bucketStartMs).toISOString().split('T')[0];
    let bSteps = 0;
    for (const ds of bucket.dataset || []) {
      for (const pt of ds.point || []) {
        for (const val of pt.value || []) {
          if (typeof val.intVal === 'number') {
            bSteps += val.intVal;
          } else if (typeof val.fpVal === 'number') {
            bSteps += Math.round(val.fpVal);
          }
        }
      }
    }
    stepsByDate.set(dateStr, (stepsByDate.get(dateStr) || 0) + bSteps);
  }

  // 3. Direct Step Data Source Fallback:
  // If dataset:aggregate returned 0 total steps, directly query the user's data sources
  let totalStepsFromAggregate = 0;
  for (const val of stepsByDate.values()) {
    totalStepsFromAggregate += val;
  }

  if (totalStepsFromAggregate === 0) {
    try {
      const startNs = millisToNanosStr(startTimeMillis);
      const endNs = millisToNanosStr(endTimeMillis);

      const fetchDirect = async (dataSourceId: string) => {
        try {
          const res = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataSourceId)}/datasets/${startNs}-${endNs}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const d = await res.json();
            return d.point || [];
          }
        } catch {
          // ignore
        }
        return [];
      };

      // A. Try standard merged step deltas directly
      const mergePts = await fetchDirect('derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas');
      for (const pt of mergePts) {
        const ptMs = nanosStrToMillis(pt.startTimeNanos);
        const ptDate = new Date(ptMs).toISOString().split('T')[0];
        const count = pt.value?.[0]?.intVal || (pt.value?.[0]?.fpVal ? Math.round(pt.value[0].fpVal) : 0);
        stepsByDate.set(ptDate, (stepsByDate.get(ptDate) || 0) + count);
      }

      // B. If still 0, search all dataSources for step_count
      let totalDirectSteps = 0;
      for (const s of stepsByDate.values()) totalDirectSteps += s;

      if (totalDirectSteps === 0) {
        const dsRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataSources`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (dsRes.ok) {
          const dsData = await dsRes.json();
          for (const src of dsData.dataSource || []) {
            if (src.dataStreamId && src.dataType?.name === 'com.google.step_count.delta') {
              const pts = await fetchDirect(src.dataStreamId);
              for (const pt of pts) {
                const ptMs = nanosStrToMillis(pt.startTimeNanos);
                const ptDate = new Date(ptMs).toISOString().split('T')[0];
                const count = pt.value?.[0]?.intVal || (pt.value?.[0]?.fpVal ? Math.round(pt.value[0].fpVal) : 0);
                stepsByDate.set(ptDate, (stepsByDate.get(ptDate) || 0) + count);
              }
            }
          }
        }
      }
    } catch (directErr) {
      console.warn('Direct step data source fallback note:', directErr);
    }
  }

  // 4. Secondary: Active Minutes Aggregation (gracefully isolated)
  const activeByDate = new Map<string, number>();
  try {
    const activePayload = {
      aggregateBy: [{ dataTypeName: 'com.google.active_minutes' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    };

    const activeRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activePayload),
    });

    if (activeRes.ok) {
      const aData = await activeRes.json();
      for (const bucket of aData.bucket || []) {
        const bucketStartMs = Number(bucket.startTimeMillis);
        const dateStr = new Date(bucketStartMs).toISOString().split('T')[0];
        let bMins = 0;
        for (const ds of bucket.dataset || []) {
          for (const pt of ds.point || []) {
            for (const val of pt.value || []) {
              if (typeof val.intVal === 'number') bMins += val.intVal;
            }
          }
        }
        activeByDate.set(dateStr, (activeByDate.get(dateStr) || 0) + bMins);
      }
    }
  } catch {
    // Graceful skip
  }

  // 5. Secondary: Daily Weight Summary Aggregation (gracefully isolated)
  const weightByDate = new Map<string, number>();
  try {
    const weightPayload = {
      aggregateBy: [{ dataTypeName: 'com.google.weight.summary' }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis,
      endTimeMillis,
    };

    const weightRes = await fetch(`${GOOGLE_FIT_BASE_URL}/dataset:aggregate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(weightPayload),
    });

    if (weightRes.ok) {
      const wData = await weightRes.json();
      for (const bucket of wData.bucket || []) {
        const bucketStartMs = Number(bucket.startTimeMillis);
        const dateStr = new Date(bucketStartMs).toISOString().split('T')[0];
        for (const ds of bucket.dataset || []) {
          for (const pt of ds.point || []) {
            if (typeof pt.value?.[0]?.fpVal === 'number') {
              weightByDate.set(dateStr, Number(pt.value[0].fpVal.toFixed(1)));
            }
          }
        }
      }
    }
  } catch {
    // Graceful skip
  }

  // 6. Retrieve latest user body metrics (height, weight, BP) from Google Fit app profile/streams
  const latestBody = await fetchLatestBodyMetrics(accessToken);

  // Calculate day-by-day buckets
  const bucketDuration = 86400000;
  const numBuckets = Math.max(
    1,
    stepsBuckets.length,
    Math.round((endTimeMillis - startTimeMillis) / bucketDuration)
  );

  const summaries: DailySummaryMetric[] = [];
  let totalStepsFetched = 0;

  for (let i = 0; i < numBuckets; i++) {
    const bStart = startTimeMillis + i * bucketDuration;
    const dateStr = new Date(bStart).toISOString().split('T')[0];

    const steps = stepsByDate.get(dateStr) || 0;
    totalStepsFetched += steps;

    let activeMinutes = activeByDate.get(dateStr) || 0;
    if (activeMinutes === 0 && steps > 1000) {
      activeMinutes = Math.round(steps / 120);
    }

    const dayWeight = weightByDate.get(dateStr) || null;
    const effectiveWeight = dayWeight || latestBody.weightKg;
    const effectiveHeight = latestBody.heightMeters;
    const bmi =
      effectiveWeight && effectiveHeight
        ? Number((effectiveWeight / (effectiveHeight * effectiveHeight)).toFixed(1))
        : null;

    summaries.push({
      date: dateStr,
      steps,
      weightKg: effectiveWeight,
      heightMeters: effectiveHeight,
      bloodPressure: latestBody.bloodPressure,
      bmi,
      activeMinutes,
    });
  }

  return {
    summaries,
    diagnostics: {
      stepsAggregateStatus,
      stepsAggregateError,
      totalStepsFetched,
      dataSourcesCount: latestBody.dataSourcesCount || 0,
      latestBody: {
        weightKg: latestBody.weightKg,
        heightMeters: latestBody.heightMeters,
        bloodPressure: latestBody.bloodPressure,
      },
    },
  };
}

// ============================================================================
// 4. Helper: POST a New Manual Reading (Weight, Height, Blood Pressure)
// ============================================================================

/**
 * Inserts a manual health reading to Google Fit with exact NANOSECOND timestamps.
 * Creates the corresponding raw dataset and patches the data points.
 */
export async function postManualReading(
  accessToken: string,
  reading: ManualHealthReading
): Promise<{ success: boolean; inserted: string[] }> {
  const timestampMs = reading.timestampMs || Date.now();
  const startTimeNanos = millisToNanosStr(timestampMs);
  // Point duration is set to 1 millisecond window (1,000,000 nanoseconds) for instantaneous telemetry
  const endTimeNanos = millisToNanosStr(timestampMs + 1);
  const datasetRange = `${startTimeNanos}-${endTimeNanos}`;

  const inserted: string[] = [];

  // 1. Insert Weight (com.google.weight)
  if (typeof reading.weightKg === 'number' && reading.weightKg > 0) {
    const dataStreamId = await ensureRawDataSource(accessToken, 'com.google.weight');
    const datasetPayload = {
      dataSourceId: dataStreamId,
      minStartTimeNs: startTimeNanos,
      maxEndTimeNs: endTimeNanos,
      point: [
        {
          startTimeNanos,
          endTimeNanos,
          dataTypeName: 'com.google.weight',
          value: [{ fpVal: reading.weightKg }],
        },
      ],
    };

    const res = await fetch(
      `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataStreamId)}/datasets/${datasetRange}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetPayload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to write weight dataset: ${err}`);
    }
    inserted.push('weight');
  }

  // 2. Insert Height (com.google.height)
  if (typeof reading.heightMeters === 'number' && reading.heightMeters > 0) {
    const dataStreamId = await ensureRawDataSource(accessToken, 'com.google.height');
    const datasetPayload = {
      dataSourceId: dataStreamId,
      minStartTimeNs: startTimeNanos,
      maxEndTimeNs: endTimeNanos,
      point: [
        {
          startTimeNanos,
          endTimeNanos,
          dataTypeName: 'com.google.height',
          value: [{ fpVal: reading.heightMeters }],
        },
      ],
    };

    const res = await fetch(
      `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataStreamId)}/datasets/${datasetRange}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetPayload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to write height dataset: ${err}`);
    }
    inserted.push('height');
  }

  // 3. Insert Blood Pressure (com.google.blood_pressure)
  if (
    reading.bloodPressure &&
    typeof reading.bloodPressure.systolic === 'number' &&
    typeof reading.bloodPressure.diastolic === 'number'
  ) {
    const dataStreamId = await ensureRawDataSource(accessToken, 'com.google.blood_pressure');
    const datasetPayload = {
      dataSourceId: dataStreamId,
      minStartTimeNs: startTimeNanos,
      maxEndTimeNs: endTimeNanos,
      point: [
        {
          startTimeNanos,
          endTimeNanos,
          dataTypeName: 'com.google.blood_pressure',
          value: [
            { fpVal: reading.bloodPressure.systolic },
            { fpVal: reading.bloodPressure.diastolic },
            { intVal: reading.bloodPressure.bodyPosition ?? 2 }, // Default sitting (2)
            { intVal: reading.bloodPressure.location ?? 1 },     // Default left upper arm (1)
          ],
        },
      ],
    };

    const res = await fetch(
      `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataStreamId)}/datasets/${datasetRange}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datasetPayload),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to write blood pressure dataset: ${err}`);
    }
    inserted.push('blood_pressure');
  }

  return { success: true, inserted };
}

// ============================================================================
// 5. Helper: PUT a Completed Workout Session
// ============================================================================

/**
 * Inserts or updates a completed workout session with start/end timestamps and activity type.
 * Also patches corresponding com.google.activity.segment points so the activity shows in Google Fit logs.
 */
export async function putWorkoutSession(
  accessToken: string,
  session: WorkoutSessionInput
): Promise<FitSession> {
  const sessionId = session.id || `session-${session.activityType}-${session.startTimeMillis}`;

  // 1. Prepare Session Payload (uses MILLISECONDS)
  const sessionPayload = {
    id: sessionId,
    name: session.name,
    description: session.description || `${session.name} logged via ${APPLICATION_NAME}`,
    startTimeMillis: session.startTimeMillis.toString(),
    endTimeMillis: session.endTimeMillis.toString(),
    activityType: session.activityType,
    application: {
      name: APPLICATION_NAME,
      version: '1.0.0',
    },
  };

  const sessionRes = await fetch(`${GOOGLE_FIT_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sessionPayload),
  });

  if (!sessionRes.ok) {
    const errorText = await sessionRes.text();
    throw new Error(`Failed to save workout session (${sessionRes.status}): ${errorText}`);
  }

  // 2. Also register the activity segment dataset (uses NANOSECONDS)
  try {
    const dataStreamId = await ensureRawDataSource(accessToken, 'com.google.activity.segment');
    const startNs = millisToNanosStr(session.startTimeMillis);
    const endNs = millisToNanosStr(session.endTimeMillis);
    const datasetRange = `${startNs}-${endNs}`;

    const segmentPayload = {
      dataSourceId: dataStreamId,
      minStartTimeNs: startNs,
      maxEndTimeNs: endNs,
      point: [
        {
          startTimeNanos: startNs,
          endTimeNanos: endNs,
          dataTypeName: 'com.google.activity.segment',
          value: [{ intVal: session.activityType }],
        },
      ],
    };

    await fetch(
      `${GOOGLE_FIT_BASE_URL}/dataSources/${encodeURIComponent(dataStreamId)}/datasets/${datasetRange}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(segmentPayload),
      }
    );
  } catch (err) {
    console.warn('Note: Workout session created, but activity segment sync had warning:', err);
  }

  return await sessionRes.json();
}

/**
 * Fetches completed workout sessions from Google Fit within an optional time range.
 */
export async function listWorkoutSessions(
  accessToken: string,
  startTimeMillis?: number,
  endTimeMillis?: number
): Promise<FitSession[]> {
  const params = new URLSearchParams();
  if (startTimeMillis) {
    params.set('startTime', new Date(startTimeMillis).toISOString());
  }
  if (endTimeMillis) {
    params.set('endTime', new Date(endTimeMillis).toISOString());
  }

  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`${GOOGLE_FIT_BASE_URL}/sessions${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to list workout sessions: ${err}`);
  }

  const data = await response.json();
  return data.session || [];
}
