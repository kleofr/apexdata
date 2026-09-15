export interface GrandPrixEvent {
  round: number;
  name: string;
  official_name?: string;
  location?: string;
  country?: string;
  date?: string;
}

export interface Driver {
  number: string;
  code: string;
  first_name?: string;
  last_name?: string;
  team: string;
  team_color?: string;
}

export type TyreCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET' | 'UNKNOWN';

export interface DriverLapSummary {
  code: string;
  number: string;
  name: string;
  team: string;
  team_color: string;
  lap_time: string;
  lap_time_seconds: number;
  tyre?: TyreCompound | string;
  tyre_age?: number | null;
  fresh_tyre?: boolean;
  top_speed?: number;
  s1?: string;
  s2?: string;
  s3?: string;
}

export interface CornerMarker {
  number: number;
  letter?: string;
  distance: number;
  x?: number;
  y?: number;
  angle?: number;
}

export interface TelemetryPoint {
  distance: number;       // meters (x-axis)
  speed1: number;         // km/h
  speed2: number;         // km/h
  throttle1: number;      // 0 - 100 %
  throttle2: number;      // 0 - 100 %
  brake1: number;         // 0 - 100 % (or boolean 0 / 100)
  brake2: number;         // 0 - 100 % (or boolean 0 / 100)
  gear1: number;          // 1 - 8 (stepped)
  gear2: number;          // 1 - 8 (stepped)
  rpm1: number;           // RPM
  rpm2: number;           // RPM
  drs1?: number;          // 0 or 100 % (closed / open)
  drs2?: number;          // 0 or 100 % (closed / open)
  steering1: number;      // -180 to +180 deg
  steering2: number;      // -180 to +180 deg
  delta: number;          // seconds (positive: D1 ahead/faster, negative: D2 ahead)
  x?: number;             // rotated track X coordinate
  y?: number;             // rotated track Y coordinate
}

export interface ComparisonData {
  driver1: DriverLapSummary;
  driver2: DriverLapSummary;
  summary: {
    delta: number;
    faster_driver: string;
    track_length: number;
    year: number | string;
    gp: string;
    session: string;
    track_temp?: number | null;
    air_temp?: number | null;
  };
  corners?: CornerMarker[];
  track_rotation?: number;
  telemetry: TelemetryPoint[];
}

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export type PlaybackMode = 'time_accurate' | 'constant_speed';
export type PlaybackSpeed = 0.5 | 1 | 2 | 4;
