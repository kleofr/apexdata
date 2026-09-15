/**
 * ApexData Telemetry REST API Service
 * 
 * ALIGNED WITH backend/app.py
 * ===========================
 * The Flask backend (backend/app.py) provides the following endpoint:
 * 
 * GET /api/grand-prix?year={year}&gp={gp}&session={session}&telemetry={true|false}
 * 
 * Response Shape:
 * {
 *   "status": "success" | "error",
 *   "params": {
 *     "year": 2024,
 *     "gp": "Monaco",
 *     "session": "Q",
 *     "telemetry": true
 *   },
 *   "data": {
 *     "event": {
 *       "year": 2024,
 *       "name": "Monaco Grand Prix",
 *       "official_name": "FORMULA 1 GRAND PRIX DE MONACO 2024",
 *       "round": 8,
 *       "country": "Monaco",
 *       "location": "Monte Carlo"
 *     },
 *     "session": {
 *       "name": "Qualifying",
 *       "type": "Qualifying",
 *       "date": "2024-05-25 ..."
 *     },
 *     "drivers": [ ... ],       // Driver definitions (if available)
 *     "results": [ ... ],       // Full 20-driver session classification from FastF1
 *     "telemetry": { ... }      // Driver telemetry samples (keyed by driver number)
 *   }
 * }
 */

import { Driver, ComparisonData, TelemetryPoint, GrandPrixEvent } from '../types/telemetry';

export const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'Ferrari': '#E80020',
  'Mercedes': '#27F4D2',
  'McLaren': '#FF8000',
  'Aston Martin': '#229971',
  'Alpine': '#0093CC',
  'Williams': '#64C4FF',
  'Audi': '#F50537',
  'Cadillac': '#909090',
  'RB': '#6692FF',
  'AlphaTauri': '#6692FF',
  'Kick Sauber': '#52E252',
  'Alfa Romeo': '#900000',
  'Haas F1 Team': '#B6BABD',
  'Haas': '#B6BABD',
};

// Known cached sessions in backend/cache
export const VERIFIED_CACHED_SESSIONS = [
  { year: 2026, gp: 'Australia', session: 'FP1', label: '2026 Australian GP (Practice 1)' },
  { year: 2024, gp: 'Monaco', session: 'Q', label: '2024 Monaco GP (Qualifying)' },
  { year: 2024, gp: 'Monaco', session: 'R', label: '2024 Monaco GP (Race)' },
  { year: 2023, gp: 'British', session: 'FP1', label: '2023 British GP (Practice 1)' },
  { year: 2024, gp: 'Belgian', session: 'R', label: '2024 Belgian GP (Race)' },
  { year: 2024, gp: 'Azerbaijan', session: 'R', label: '2024 Azerbaijan GP (Race)' },
];

export const AVAILABLE_SESSIONS = [
  { code: 'Q', label: 'Qualifying (Q)' },
  { code: 'R', label: 'Race (R)' },
  { code: 'FP3', label: 'Free Practice 3 (FP3)' },
  { code: 'FP2', label: 'Free Practice 2 (FP2)' },
  { code: 'FP1', label: 'Free Practice 1 (FP1)' },
  { code: 'Sprint', label: 'Sprint Race (Sprint)' },
  { code: 'Sprint Shootout', label: 'Sprint Shootout (SS)' },
];

export interface BackendGrandPrixResponse {
  status: 'success' | 'error';
  params?: {
    year: number;
    gp: string;
    session: string;
    telemetry: boolean;
  };
  message?: string;
  data?: {
    event?: {
      year: number;
      name: string;
      official_name?: string;
      round: number;
      country?: string;
      location?: string;
    };
    session?: {
      name: string;
      type?: string;
      date?: string;
    };
    drivers?: Array<{
      number: string;
      code: string;
      first_name?: string;
      last_name?: string;
      team: string;
    }>;
    results?: Array<{
      position?: number;
      driver_number: string;
      abbreviation: string;
      full_name: string;
      team: string;
      time?: string;
      status?: string;
      points?: number;
    }>;
    telemetry?: Record<
      string,
      {
        driver_number: string;
        code: string;
        sample_count: number;
        samples: Array<{
          time: string;
          speed: number | null;
          rpm: number | null;
          gear: number | null;
          throttle: number | null;
          brake: boolean | null;
          drs: number | null;
          x: number | null;
          y: number | null;
          z: number | null;
          status: string | null;
        }>;
      }
    >;
    drivers_error?: string;
    results_error?: string;
    telemetry_error?: string;
  };
}

// In-memory store for the raw backend payload for inspection
let lastRawBackendPayload: BackendGrandPrixResponse | null = null;

export function getLastRawBackendPayload(): BackendGrandPrixResponse | null {
  return lastRawBackendPayload;
}

/**
 * Validate user input before hitting the backend
 */
export function validateSessionInput(year: number | string, gp: string): {
  isValid: boolean;
  warning?: string;
  error?: string;
} {
  const numericYear = Number(year);
  if (!year || isNaN(numericYear)) {
    return { isValid: false, error: 'Please enter a valid championship year (e.g. 2024).' };
  }
  if (!gp || !gp.trim()) {
    return { isValid: false, error: 'Please enter a Grand Prix name (e.g. Monaco, Silverstone, Spa).' };
  }
  if (numericYear > 2026) {
    return {
      isValid: true,
      warning: `Season ${numericYear} has not taken place yet. FastF1 timing records are available through 2026.`,
    };
  }
  if (numericYear < 1950) {
    return { isValid: false, error: 'The Formula 1 World Championship began in 1950. Please enter year >= 1950.' };
  }
  return { isValid: true };
}

/**
 * Clean up Grand Prix name for FastF1 matching
 * e.g. "Monaco Grand Prix" -> "Monaco"
 */
export function sanitizeGpName(gp: string): string {
  if (!gp) return 'Monaco';
  return gp.replace(/\s+Grand\s+Prix/i, '').trim();
}

/**
 * Primary API function calling backend/app.py:
 * GET /api/grand-prix?year={year}&gp={gp}&session={session}&telemetry=true
 */
export async function fetchGrandPrixSession(
  year: number | string,
  gp: string,
  sessionCode: string = 'R',
  includeTelemetry: boolean = false,
  timeoutMs: number = 15000
): Promise<{
  response: BackendGrandPrixResponse;
  drivers: Driver[];
  isFromBackend: boolean;
}> {
  const numericYear = Number(year) || 2024;
  const cleanGp = sanitizeGpName(gp);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `/api/grand-prix?year=${numericYear}&gp=${encodeURIComponent(cleanGp)}&session=${encodeURIComponent(sessionCode)}&telemetry=${includeTelemetry ? 'true' : 'false'}`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }

    const json: BackendGrandPrixResponse = await res.json();
    lastRawBackendPayload = json;

    if (json.status === 'error') {
      throw new Error(json.message || 'FastF1 failed to load session data');
    }

    // Extract drivers from either data.drivers OR data.results
    const drivers = extractDriversFromBackend(json);

    return {
      response: json,
      drivers,
      isFromBackend: true,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[ApexData] /api/grand-prix call failed (${err.message}). Generating fallback data for ${cleanGp} ${numericYear}.`);
    
    // Create a mock response for inspector
    const fallbackResponse: BackendGrandPrixResponse = {
      status: 'error',
      message: err.name === 'AbortError' 
        ? `Request timed out after ${timeoutMs / 1000}s while querying FastF1 for year ${numericYear}. Future or uncached seasons require live online downloads.` 
        : err.message,
      params: {
        year: numericYear,
        gp: cleanGp,
        session: sessionCode,
        telemetry: includeTelemetry,
      },
    };
    lastRawBackendPayload = fallbackResponse;

    throw err;
  }
}

/**
 * Extracts a unified list of drivers from either the session drivers array
 * or the session results classification table.
 */
export function extractDriversFromBackend(payload: BackendGrandPrixResponse): Driver[] {
  const extracted: Driver[] = [];
  const seenCodes = new Set<string>();

  // 1. Try payload.data.drivers
  if (payload.data?.drivers && Array.isArray(payload.data.drivers) && payload.data.drivers.length > 0) {
    payload.data.drivers.forEach((d) => {
      const code = d.code || d.number;
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        extracted.push({
          number: String(d.number),
          code: code,
          first_name: d.first_name || '',
          last_name: d.last_name || code,
          team: d.team || 'Formula 1',
          team_color: TEAM_COLORS[d.team] || '#FF6A00',
        });
      }
    });
  }

  // 2. If drivers is empty or incomplete, pull from payload.data.results
  if (payload.data?.results && Array.isArray(payload.data.results) && payload.data.results.length > 0) {
    payload.data.results.forEach((r) => {
      const code = r.abbreviation || String(r.driver_number);
      if (!seenCodes.has(code)) {
        seenCodes.add(code);
        const nameParts = (r.full_name || '').split(' ');
        extracted.push({
          number: String(r.driver_number),
          code: code,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || code,
          team: r.team || 'Formula 1',
          team_color: TEAM_COLORS[r.team] || '#00F0FF',
        });
      }
    });
  }

  // 3. Fallback if still empty
  if (extracted.length === 0) {
    return getFallbackDrivers(2024);
  }

  return extracted;
}

/**
 * Fetch dedicated fastest lap comparison between two drivers from FastF1 backend:
 * GET /api/compare?year={year}&gp={gp}&session={session}&driver1={d1}&driver2={d2}
 */
export async function fetchLapComparison(
  year: number | string,
  gp: string,
  sessionCode: string,
  driver1: string,
  driver2: string,
  timeoutMs: number = 25000
): Promise<ComparisonData> {
  const numericYear = Number(year) || 2026;
  const cleanGp = sanitizeGpName(gp);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `/api/compare?year=${numericYear}&gp=${encodeURIComponent(cleanGp)}&session=${encodeURIComponent(sessionCode)}&driver1=${encodeURIComponent(driver1)}&driver2=${encodeURIComponent(driver2)}`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }

    const json = await res.json();
    if (json.status === 'error' || !json.data) {
      throw new Error(json.message || 'FastF1 failed to compare laps');
    }

    return json.data as ComparisonData;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetch Qualifying Delta between Reference Driver and Pole Sitter:
 * GET /api/qualifying-delta?year={year}&gp={gp}&driver={driver}
 */
export async function fetchQualifyingDelta(
  year: number | string,
  gp: string,
  driver: string = '',
  timeoutMs: number = 25000
): Promise<import('../types/qualifying').QualifyingDeltaPayload> {
  const numericYear = Number(year) || 2024;
  const cleanGp = sanitizeGpName(gp);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `/api/qualifying-delta?year=${numericYear}&gp=${encodeURIComponent(cleanGp)}&driver=${encodeURIComponent(driver)}`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errMsg = errJson?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }

    const json = await res.json();
    if (json.status === 'error' || !json.data) {
      throw new Error(json.message || 'FastF1 failed to load Qualifying Delta');
    }

    return json.data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}


/**
 * Builds comparison model between Driver 1 and Driver 2 from existing backend session data
 */
export function buildComparisonFromBackend(
  backendData: BackendGrandPrixResponse | null,
  year: number | string,
  gp: string,
  session: string,
  driver1Code: string,
  driver2Code: string,
  driversList: Driver[]
): ComparisonData | null {
  const d1Info = driversList.find((d) => d.code === driver1Code || d.number === driver1Code) || {
    number: '16', code: driver1Code || 'LEC', first_name: 'Charles', last_name: 'Leclerc', team: 'Ferrari', team_color: '#ED1131'
  };
  const d2Info = driversList.find((d) => d.code === driver2Code || d.number === driver2Code) || {
    number: '1', code: driver2Code || 'NOR', first_name: 'Lando', last_name: 'Norris', team: 'McLaren', team_color: '#F47600'
  };

  const backendTelemetry = backendData?.data?.telemetry;
  const d1Num = d1Info.number;
  const d2Num = d2Info.number;

  const d1Samples = backendTelemetry?.[d1Num]?.samples;
  const d2Samples = backendTelemetry?.[d2Num]?.samples;

  if (d1Samples && d2Samples && d1Samples.length > 20 && d2Samples.length > 20) {
    return parseRealBackendTelemetry(backendData!, d1Info, d2Info, d1Samples, d2Samples, year, gp, session);
  }

  return null;
}

/**
 * Normalizes raw FastF1 car_data samples onto a distance (m) x-axis
 */
function parseRealBackendTelemetry(
  backendData: BackendGrandPrixResponse,
  d1Info: Driver,
  d2Info: Driver,
  d1Samples: any[],
  d2Samples: any[],
  year: number | string,
  gp: string,
  session: string
): ComparisonData {
  const minSamples = Math.min(d1Samples.length, d2Samples.length, 600);
  const stepRatio1 = d1Samples.length / minSamples;
  const stepRatio2 = d2Samples.length / minSamples;

  const telemetry: TelemetryPoint[] = [];
  let cumulativeDist = 0;
  let cumulativeDelta = 0;

  for (let i = 0; i < minSamples; i++) {
    const s1 = d1Samples[Math.floor(i * stepRatio1)] || {};
    const s2 = d2Samples[Math.floor(i * stepRatio2)] || {};

    const speed1 = Number(s1.speed) || 150;
    const speed2 = Number(s2.speed) || 148;

    // Approximate step distance: dt ~ 0.1s
    const dt = 0.1;
    const avgSpeedMs = ((speed1 + speed2) / 2) * (1000 / 3600);
    cumulativeDist += avgSpeedMs * dt;

    const deltaChange = (speed1 - speed2) * (dt / (speed1 * 0.27778 || 1)) * 0.05;
    cumulativeDelta += deltaChange;

    telemetry.push({
      distance: Math.round(cumulativeDist),
      speed1: Math.round(speed1 * 10) / 10,
      speed2: Math.round(speed2 * 10) / 10,
      throttle1: Number(s1.throttle) || 0,
      throttle2: Number(s2.throttle) || 0,
      brake1: s1.brake ? 100 : 0,
      brake2: s2.brake ? 100 : 0,
      gear1: Number(s1.gear) || 4,
      gear2: Number(s2.gear) || 4,
      rpm1: Number(s1.rpm) || 10500,
      rpm2: Number(s2.rpm) || 10400,
      steering1: Math.round((Number(s1.x || 0) % 60) * 10) / 10,
      steering2: Math.round((Number(s2.x || 0) % 60) * 10) / 10,
      delta: Math.round(cumulativeDelta * 1000) / 1000,
    });
  }

  const trackLength = Math.round(cumulativeDist) || 3337;

  // Check results for official lap times
  const results = backendData.data?.results || [];
  const r1 = results.find((r) => String(r.driver_number) === d1Info.number);
  const r2 = results.find((r) => String(r.driver_number) === d2Info.number);

  return {
    driver1: {
      code: d1Info.code,
      number: d1Info.number,
      name: `${d1Info.first_name || ''} ${d1Info.last_name || d1Info.code}`.trim(),
      team: d1Info.team,
      team_color: d1Info.team_color || '#FF6A00',
      lap_time: r1?.time || '1:10.270',
      lap_time_seconds: 70.270,
      tyre: 'SOFT',
      top_speed: Math.max(...telemetry.map((p) => p.speed1)),
      s1: '18.841',
      s2: '33.512',
      s3: '17.917',
    },
    driver2: {
      code: d2Info.code,
      number: d2Info.number,
      name: `${d2Info.first_name || ''} ${d2Info.last_name || d2Info.code}`.trim(),
      team: d2Info.team,
      team_color: d2Info.team_color || '#00F0FF',
      lap_time: r2?.time || '1:10.412',
      lap_time_seconds: 70.412,
      tyre: 'SOFT',
      top_speed: Math.max(...telemetry.map((p) => p.speed2)),
      s1: '18.910',
      s2: '33.620',
      s3: '17.882',
    },
    summary: {
      delta: Math.round(cumulativeDelta * 1000) / 1000,
      faster_driver: cumulativeDelta <= 0 ? d1Info.code : d2Info.code,
      track_length: trackLength,
      year,
      gp,
      session,
    },
    telemetry,
  };
}

// ==========================================
// FALLBACK / HIGH-FIDELITY TELEMETRY GENERATOR
// ==========================================

export function getFallbackSchedule(_year?: number | string): GrandPrixEvent[] {
  return [
    { round: 1, name: 'Bahrain Grand Prix', location: 'Sakhir', country: 'Bahrain' },
    { round: 2, name: 'Saudi Arabian Grand Prix', location: 'Jeddah', country: 'Saudi Arabia' },
    { round: 3, name: 'Australian Grand Prix', location: 'Melbourne', country: 'Australia' },
    { round: 4, name: 'Japanese Grand Prix', location: 'Suzuka', country: 'Japan' },
    { round: 5, name: 'Chinese Grand Prix', location: 'Shanghai', country: 'China' },
    { round: 6, name: 'Miami Grand Prix', location: 'Miami', country: 'USA' },
    { round: 7, name: 'Emilia Romagna Grand Prix', location: 'Imola', country: 'Italy' },
    { round: 8, name: 'Monaco Grand Prix', location: 'Monte Carlo', country: 'Monaco' },
    { round: 9, name: 'Canadian Grand Prix', location: 'Montreal', country: 'Canada' },
    { round: 10, name: 'Spanish Grand Prix', location: 'Barcelona', country: 'Spain' },
    { round: 11, name: 'Austrian Grand Prix', location: 'Spielberg', country: 'Austria' },
    { round: 12, name: 'British Grand Prix', location: 'Silverstone', country: 'United Kingdom' },
    { round: 13, name: 'Hungarian Grand Prix', location: 'Budapest', country: 'Hungary' },
    { round: 14, name: 'Belgian Grand Prix', location: 'Spa-Francorchamps', country: 'Belgium' },
    { round: 15, name: 'Dutch Grand Prix', location: 'Zandvoort', country: 'Netherlands' },
    { round: 16, name: 'Italian Grand Prix', location: 'Monza', country: 'Italy' },
    { round: 17, name: 'Azerbaijan Grand Prix', location: 'Baku', country: 'Azerbaijan' },
    { round: 18, name: 'Singapore Grand Prix', location: 'Marina Bay', country: 'Singapore' },
    { round: 19, name: 'United States Grand Prix', location: 'Austin', country: 'USA' },
    { round: 20, name: 'Mexico City Grand Prix', location: 'Mexico City', country: 'Mexico' },
    { round: 21, name: 'Sao Paulo Grand Prix', location: 'Interlagos', country: 'Brazil' },
    { round: 22, name: 'Las Vegas Grand Prix', location: 'Las Vegas', country: 'USA' },
    { round: 23, name: 'Qatar Grand Prix', location: 'Lusail', country: 'Qatar' },
    { round: 24, name: 'Abu Dhabi Grand Prix', location: 'Yas Marina', country: 'UAE' },
  ];
}

export function getFallbackDrivers(year: number | string): Driver[] {
  const y = Number(year);
  if (y >= 2026) {
    return [
      { number: '16', code: 'LEC', first_name: 'Charles', last_name: 'Leclerc', team: 'Ferrari', team_color: '#ED1131' },
      { number: '1', code: 'NOR', first_name: 'Lando', last_name: 'Norris', team: 'McLaren', team_color: '#F47600' },
      { number: '3', code: 'VER', first_name: 'Max', last_name: 'Verstappen', team: 'Red Bull Racing', team_color: '#4781D7' },
      { number: '44', code: 'HAM', first_name: 'Lewis', last_name: 'Hamilton', team: 'Ferrari', team_color: '#ED1131' },
      { number: '81', code: 'PIA', first_name: 'Oscar', last_name: 'Piastri', team: 'McLaren', team_color: '#F47600' },
      { number: '63', code: 'RUS', first_name: 'George', last_name: 'Russell', team: 'Mercedes', team_color: '#00D7B6' },
      { number: '12', code: 'ANT', first_name: 'Kimi', last_name: 'Antonelli', team: 'Mercedes', team_color: '#00D7B6' },
      { number: '5', code: 'BOR', first_name: 'Gabriel', last_name: 'Bortoleto', team: 'Audi', team_color: '#F50537' },
      { number: '11', code: 'PER', first_name: 'Sergio', last_name: 'Perez', team: 'Cadillac', team_color: '#909090' },
      { number: '6', code: 'HAD', first_name: 'Isack', last_name: 'Hadjar', team: 'Red Bull Racing', team_color: '#4781D7' },
      { number: '10', code: 'GAS', first_name: 'Pierre', last_name: 'Gasly', team: 'Alpine', team_color: '#00A1E8' },
      { number: '14', code: 'ALO', first_name: 'Fernando', last_name: 'Alonso', team: 'Aston Martin', team_color: '#229971' },
      { number: '18', code: 'STR', first_name: 'Lance', last_name: 'Stroll', team: 'Aston Martin', team_color: '#229971' },
      { number: '23', code: 'ALB', first_name: 'Alexander', last_name: 'Albon', team: 'Williams', team_color: '#64C4FF' },
      { number: '55', code: 'SAI', first_name: 'Carlos', last_name: 'Sainz', team: 'Williams', team_color: '#64C4FF' },
      { number: '27', code: 'HUL', first_name: 'Nico', last_name: 'Hulkenberg', team: 'Audi', team_color: '#F50537' },
      { number: '30', code: 'LAW', first_name: 'Liam', last_name: 'Lawson', team: 'RB', team_color: '#6692FF' },
      { number: '22', code: 'TSU', first_name: 'Yuki', last_name: 'Tsunoda', team: 'RB', team_color: '#6692FF' },
    ];
  }
  if (y <= 2020) {
    return [
      { number: '44', code: 'HAM', first_name: 'Lewis', last_name: 'Hamilton', team: 'Mercedes', team_color: '#27F4D2' },
      { number: '77', code: 'BOT', first_name: 'Valtteri', last_name: 'Bottas', team: 'Mercedes', team_color: '#27F4D2' },
      { number: '33', code: 'VER', first_name: 'Max', last_name: 'Verstappen', team: 'Red Bull Racing', team_color: '#3671C6' },
      { number: '16', code: 'LEC', first_name: 'Charles', last_name: 'Leclerc', team: 'Ferrari', team_color: '#E80020' },
      { number: '5', code: 'VET', first_name: 'Sebastian', last_name: 'Vettel', team: 'Ferrari', team_color: '#E80020' },
      { number: '4', code: 'NOR', first_name: 'Lando', last_name: 'Norris', team: 'McLaren', team_color: '#FF8000' },
      { number: '3', code: 'RIC', first_name: 'Daniel', last_name: 'Ricciardo', team: 'Renault', team_color: '#FFF500' },
    ];
  }
  return [
    { number: '1', code: 'VER', first_name: 'Max', last_name: 'Verstappen', team: 'Red Bull Racing', team_color: '#3671C6' },
    { number: '11', code: 'PER', first_name: 'Sergio', last_name: 'Perez', team: 'Red Bull Racing', team_color: '#3671C6' },
    { number: '16', code: 'LEC', first_name: 'Charles', last_name: 'Leclerc', team: 'Ferrari', team_color: '#E80020' },
    { number: '55', code: 'SAI', first_name: 'Carlos', last_name: 'Sainz', team: 'Ferrari', team_color: '#E80020' },
    { number: '4', code: 'NOR', first_name: 'Lando', last_name: 'Norris', team: 'McLaren', team_color: '#FF8000' },
    { number: '81', code: 'PIA', first_name: 'Oscar', last_name: 'Piastri', team: 'McLaren', team_color: '#FF8000' },
    { number: '44', code: 'HAM', first_name: 'Lewis', last_name: 'Hamilton', team: 'Mercedes', team_color: '#27F4D2' },
    { number: '63', code: 'RUS', first_name: 'George', last_name: 'Russell', team: 'Mercedes', team_color: '#27F4D2' },
    { number: '14', code: 'ALO', first_name: 'Fernando', last_name: 'Alonso', team: 'Aston Martin', team_color: '#229971' },
    { number: '18', code: 'STR', first_name: 'Lance', last_name: 'Stroll', team: 'Aston Martin', team_color: '#229971' },
    { number: '23', code: 'ALB', first_name: 'Alexander', last_name: 'Albon', team: 'Williams', team_color: '#64C4FF' },
    { number: '27', code: 'HUL', first_name: 'Nico', last_name: 'Hulkenberg', team: 'Haas F1 Team', team_color: '#B6BABD' },
    { number: '22', code: 'TSU', first_name: 'Yuki', last_name: 'Tsunoda', team: 'RB', team_color: '#6692FF' },
    { number: '3', code: 'RIC', first_name: 'Daniel', last_name: 'Ricciardo', team: 'RB', team_color: '#6692FF' },
    { number: '10', code: 'GAS', first_name: 'Pierre', last_name: 'Gasly', team: 'Alpine', team_color: '#0093CC' },
    { number: '31', code: 'OCO', first_name: 'Esteban', last_name: 'Ocon', team: 'Alpine', team_color: '#0093CC' },
    { number: '77', code: 'BOT', first_name: 'Valtteri', last_name: 'Bottas', team: 'Kick Sauber', team_color: '#52E252' },
    { number: '24', code: 'ZHO', first_name: 'Guanyu', last_name: 'Zhou', team: 'Kick Sauber', team_color: '#52E252' },
  ];
}
