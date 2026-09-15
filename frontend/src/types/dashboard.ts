export interface WeekendEventInfo {
  year: number;
  name: string;
  official_name?: string;
  round: number;
  country?: string;
  location?: string;
}

export interface GridResultDriver {
  position: number | null;
  driver_number: string;
  abbreviation: string;
  full_name: string;
  team: string;
  team_color: string | null;
  time: string | null;
  status: string | null;
  points: number | null;
}

export interface DrsZone {
  id: number;
  detection: string;
  detection_distance_m: number;
  activation: string;
  start_distance_m: number;
  end_distance_m: number;
}

export interface CircuitDetails {
  name: string;
  location: string;
  length_km: number;
  turns: number;
  drs_zones_count: number;
  fastest_lap_ever: {
    time: string;
    driver: string;
    team: string;
    year: number;
    session: string;
  };
  race_lap_record: {
    time: string;
    driver: string;
    team: string;
    year: number;
  };
  drs_zones: DrsZone[];
  characteristics: {
    type: string;
    downforce: string;
    direction: string;
    pit_lane_loss_sec: number;
  };
}

export interface DayWeather {
  day: string;
  sessions: string;
  air_temp_c: number;
  track_temp_c: number;
  condition: string;
  rain_probability_pct: number;
  humidity_pct: number;
  wind_kmh: number;
  status: string;
}

export interface WeekendWeather {
  friday: DayWeather;
  saturday: DayWeather;
  sunday: DayWeather;
}

export interface FiaCarUpdate {
  team: string;
  component: string;
  type: string;
  description: string;
}

export interface FiaDocument {
  id: string;
  title: string;
  category: string;
  time_issued: string;
  summary: string;
  updates: FiaCarUpdate[];
}

export interface FiaDocumentsResponse {
  event: string;
  governing_body: string;
  documents: FiaDocument[];
}

export interface TrackGeometryPoint {
  distance: number;
  x: number;
  y: number;
  speed: number;
  gear: number;
  drs: number;
}

export interface TrackCornerPoint {
  number: number;
  letter: string;
  distance: number;
  x: number;
  y: number;
  angle: number;
}

export interface TrackGeometry {
  track_rotation: number;
  corners: TrackCornerPoint[];
  track_samples: TrackGeometryPoint[];
  track_length: number;
}

export interface SessionFastestLap {
  time: string | null;
  driver: string;
  driver_code?: string;
  team: string;
  team_color?: string;
  session?: string;
  lap_number?: number | null;
}

export interface FastestLapOverview {
  qualifying_fastest?: SessionFastestLap | null;
  race_fastest?: SessionFastestLap | null;
}

export interface WeekendOverviewResponse {
  status: 'success' | 'partial' | 'error';
  year: number;
  gp: string;
  session_code: string;
  message?: string;
  data: {
    event: WeekendEventInfo;
    session: {
      name: string;
      type: string;
      date?: string;
    };
    results: GridResultDriver[];
    drivers: Array<{
      number: string;
      code: string;
      first_name?: string;
      last_name?: string;
      team: string;
      team_color?: string;
    }>;
    circuit: CircuitDetails;
    weather: WeekendWeather;
    track_geometry?: TrackGeometry;
    fastest_lap_info?: FastestLapOverview;
  };
}
