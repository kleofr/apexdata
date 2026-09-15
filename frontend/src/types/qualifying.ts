export interface TheoreticalBestLap {
  lap_time: string;
  lap_time_seconds: number;
  best_s1: string;
  best_s1_seconds: number;
  best_s2: string;
  best_s2_seconds: number;
  best_s3: string;
  best_s3_seconds: number;
}

export interface QualifyingDriverSummary {
  code: string;
  number: string;
  name: string;
  team: string;
  team_color: string;
  lap_time: string;
  lap_time_seconds: number;
  s1: string;
  s2: string;
  s3: string;
  s1_seconds: number | null;
  s2_seconds: number | null;
  s3_seconds: number | null;
  theoretical: TheoreticalBestLap | null;
  time_left_on_table: number; // seconds
}

export interface SectorDeltaItem {
  sector: string;
  pole_time: string;
  driver_time: string;
  pole_seconds: number | null;
  driver_seconds: number | null;
  delta_seconds: number | null;
  faster: 'POLE' | string;
}

export interface CornerTelemetryStats {
  apex_speed: number;
  apex_distance: number;
  braking_distance: number | null;
  throttle_distance: number | null;
}

export interface CornerAnalysisItem {
  corner_number: number;
  corner_letter: string;
  corner_label: string;
  distance: number;
  pole: CornerTelemetryStats;
  driver: CornerTelemetryStats;
  deltas: {
    apex_speed: number; // km/h (positive: driver faster, negative: pole faster)
    braking_delta_m: number | null; // meters (positive: driver later, negative: driver earlier)
    throttle_delta_m: number | null; // meters (positive: driver later, negative: driver earlier)
  };
}

export interface QualifyingTelemetrySample {
  distance: number;
  speed_pole: number;
  speed_driver: number;
  throttle_pole: number;
  throttle_driver: number;
  brake_pole: number;
  brake_driver: number;
  delta: number;
  x?: number;
  y?: number;
}

export interface QualifyingDeltaPayload {
  year: number;
  gp: string;
  pole_driver: QualifyingDriverSummary;
  reference_driver: QualifyingDriverSummary;
  overall_delta: number;
  sector_breakdown: SectorDeltaItem[];
  corner_analysis: CornerAnalysisItem[];
  telemetry: QualifyingTelemetrySample[];
  corners?: CornerAnalysisItem[];
  track_rotation?: number;
  track_length: number;
}


export interface QualifyingDeltaResponse {
  status: 'success' | 'error';
  data?: QualifyingDeltaPayload;
  message?: string;
}
