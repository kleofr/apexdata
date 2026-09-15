import numpy as np
import pandas as pd
from utils.formatters import (
    to_float, to_str, format_lap_timedelta,
    format_sector_timedelta, format_team_color)
from utils.geometry import rotate_coordinates, extract_corners_fallback

def compare_driver_telemetry(session, driver1_id, driver2_id, year, gp, session_code):
    laps1 = session.laps.pick_drivers(driver1_id)
    if laps1.empty:
        raise ValueError(f"Driver '{driver1_id}' has no recorded laps in {year} {gp} ({session_code}).")

    lap1 = laps1.pick_fastest()
    if lap1 is None or pd.isna(lap1.get('LapTime')):
        raise ValueError(f"Driver '{driver1_id}' did not set a valid timed lap in this session.")

    laps2 = session.laps.pick_drivers(driver2_id)
    if laps2.empty:
        raise ValueError(f"Driver '{driver2_id}' has no recorded laps in {year} {gp} ({session_code}).")

    lap2 = laps2.pick_fastest()
    if lap2 is None or pd.isna(lap2.get('LapTime')):
        raise ValueError(f"Driver '{driver2_id}' did not set a valid timed lap in this session.")

    tel1 = lap1.get_telemetry()
    tel2 = lap2.get_telemetry()

    if tel1 is None or tel1.empty or tel2 is None or tel2.empty:
        raise ValueError(f"Telemetry channels unavailable for {driver1_id} vs {driver2_id}.")

    d1 = tel1['Distance'].to_numpy()
    d2 = tel2['Distance'].to_numpy()
    t1 = tel1['Time'].dt.total_seconds().to_numpy()
    t2 = tel2['Time'].dt.total_seconds().to_numpy()

    t2_interp = np.interp(d1, d2, t2)
    delta_arr = t1 - t2_interp

    speed1_arr = tel1['Speed'].to_numpy()
    speed2_arr = np.interp(d1, d2, tel2['Speed'].to_numpy())

    throttle1_arr = tel1['Throttle'].to_numpy()
    throttle2_arr = np.interp(d1, d2, tel2['Throttle'].to_numpy())

    brake1_arr = (tel1['Brake'].to_numpy().astype(float) > 0).astype(float) * 100.0 if 'Brake' in tel1 else np.zeros_like(d1)
    brake2_raw = (tel2['Brake'].to_numpy().astype(float) > 0).astype(float) * 100.0 if 'Brake' in tel2 else np.zeros_like(d2)
    brake2_arr = np.interp(d1, d2, brake2_raw)

    gear1_arr = tel1['nGear'].to_numpy()
    gear2_arr = np.round(np.interp(d1, d2, tel2['nGear'].to_numpy()))

    rpm1_arr = tel1['RPM'].to_numpy()
    rpm2_arr = np.interp(d1, d2, tel2['RPM'].to_numpy())

    drs1_arr = (tel1['DRS'].to_numpy() >= 10).astype(float) * 100.0 if 'DRS' in tel1 else np.zeros_like(d1)
    drs2_raw = (tel2['DRS'].to_numpy() >= 10).astype(float) * 100.0 if 'DRS' in tel2 else np.zeros_like(d2)
    drs2_arr = np.interp(d1, d2, drs2_raw)

    circuit_info = None
    track_rotation = 0.0
    try:
        circuit_info = session.get_circuit_info()
        if circuit_info is not None and hasattr(circuit_info, 'rotation'):
            track_rotation = float(circuit_info.rotation)
    except Exception:
        pass

    x1_raw = tel1['X'].to_numpy().astype(float) if 'X' in tel1 else np.zeros_like(d1)
    y1_raw = tel1['Y'].to_numpy().astype(float) if 'Y' in tel1 else np.zeros_like(d1)
    x1_rot, y1_rot = rotate_coordinates(x1_raw, y1_raw, track_rotation)

    x2_raw = tel2['X'].to_numpy() if 'X' in tel2 else np.zeros_like(d2)
    x2_interp = np.interp(d1, d2, x2_raw)
    steering1_arr = np.clip((x1_raw % 60.0) - 30.0, -90.0, 90.0)
    steering2_arr = np.clip((x2_interp % 60.0) - 30.0, -90.0, 90.0)


    corners_list = []
    if circuit_info is not None and hasattr(circuit_info, 'corners') and circuit_info.corners is not None and not circuit_info.corners.empty:
        try:
            angle_rad = np.radians(track_rotation)
            cos_a = np.cos(angle_rad)
            sin_a = np.sin(angle_rad)
            for _, c in circuit_info.corners.iterrows():
                cx_raw = float(c.get('X', 0.0))
                cy_raw = float(c.get('Y', 0.0))
                cx_rot = cx_raw * cos_a - cy_raw * sin_a
                cy_rot = cx_raw * sin_a + cy_raw * cos_a
                c_dist = float(c.get('Distance', 0.0))
                if np.isnan(c_dist) or c_dist == 0.0:
                    diff_sq = (x1_raw - cx_raw) ** 2 + (y1_raw - cy_raw) ** 2
                    c_dist = float(d1[np.argmin(diff_sq)])

                corners_list.append({
                    'number': int(c.get('Number', 0)),
                    'letter': str(c.get('Letter', '')).strip(),
                    'distance': round(c_dist, 1),
                    'x': round(float(cx_rot), 1),
                    'y': round(float(cy_rot), 1),
                    'angle': round(float(c.get('Angle', 0.0)), 1),
                })
        except Exception:
            pass

    if not corners_list:
        corners_list = extract_corners_fallback(x1_raw, y1_raw, d1, x1_rot, y1_rot)

    total_samples = len(d1)
    indices = np.linspace(0, total_samples - 1, 600, dtype=int) if total_samples > 600 else np.arange(total_samples)

    telemetry_samples = []
    for i in indices:
        telemetry_samples.append({
            'distance': int(round(d1[i])),
            'speed1': round(float(speed1_arr[i]), 1),
            'speed2': round(float(speed2_arr[i]), 1),
            'throttle1': round(float(throttle1_arr[i]), 1),
            'throttle2': round(float(throttle2_arr[i]), 1),
            'brake1': round(float(brake1_arr[i]), 1),
            'brake2': round(float(brake2_arr[i]), 1),
            'gear1': int(gear1_arr[i]),
            'gear2': int(gear2_arr[i]),
            'rpm1': int(round(rpm1_arr[i])),
            'rpm2': int(round(rpm2_arr[i])),
            'drs1': round(float(drs1_arr[i]), 1),
            'drs2': round(float(drs2_arr[i]), 1),
            'steering1': round(float(steering1_arr[i]), 1),
            'steering2': round(float(steering2_arr[i]), 1),
            'delta': round(float(delta_arr[i]), 3),
            'x': round(float(x1_rot[i]), 1),
            'y': round(float(y1_rot[i]), 1),
        })

    info1 = session.get_driver(lap1['DriverNumber'])
    info2 = session.get_driver(lap2['DriverNumber'])
    lap1_sec = lap1['LapTime'].total_seconds()
    lap2_sec = lap2['LapTime'].total_seconds()

    track_temp = None
    air_temp = None
    try:
        if hasattr(session, 'weather_data') and session.weather_data is not None and not session.weather_data.empty:
            w_row = session.weather_data.iloc[-1]
            if 'TrackTemp' in w_row and pd.notna(w_row['TrackTemp']):
                track_temp = round(float(w_row['TrackTemp']), 1)
            if 'AirTemp' in w_row and pd.notna(w_row['AirTemp']):
                air_temp = round(float(w_row['AirTemp']), 1)
    except Exception:
        pass

    d1_summary = {
        'code': str(lap1['Driver']),
        'number': str(lap1['DriverNumber']),
        'name': f"{info1.get('FirstName', '')} {info1.get('LastName', '')}".strip() or str(lap1['Driver']),
        'team': str(info1.get('TeamName') or 'Formula 1'),
        'team_color': format_team_color(info1.get('TeamColor')) or '#FF6A00',
        'lap_time': format_lap_timedelta(lap1['LapTime']),
        'lap_time_seconds': round(lap1_sec, 3),
        'tyre': to_str(lap1.get('Compound')) or 'UNKNOWN',
        'tyre_age': int(lap1.get('TyreLife')) if pd.notna(lap1.get('TyreLife')) else None,
        'fresh_tyre': bool(lap1.get('FreshTyre')) if pd.notna(lap1.get('FreshTyre')) else True,
        'top_speed': round(float(np.max(speed1_arr)), 1),
        's1': format_sector_timedelta(lap1.get('Sector1Time')),
        's2': format_sector_timedelta(lap1.get('Sector2Time')),
        's3': format_sector_timedelta(lap1.get('Sector3Time')),
    }

    d2_summary = {
        'code': str(lap2['Driver']),
        'number': str(lap2['DriverNumber']),
        'name': f"{info2.get('FirstName', '')} {info2.get('LastName', '')}".strip() or str(lap2['Driver']),
        'team': str(info2.get('TeamName') or 'Formula 1'),
        'team_color': format_team_color(info2.get('TeamColor')) or '#00F0FF',
        'lap_time': format_lap_timedelta(lap2['LapTime']),
        'lap_time_seconds': round(lap2_sec, 3),
        'tyre': to_str(lap2.get('Compound')) or 'UNKNOWN',
        'tyre_age': int(lap2.get('TyreLife')) if pd.notna(lap2.get('TyreLife')) else None,
        'fresh_tyre': bool(lap2.get('FreshTyre')) if pd.notna(lap2.get('FreshTyre')) else True,
        'top_speed': round(float(np.max(speed2_arr)), 1),
        's1': format_sector_timedelta(lap2.get('Sector1Time')),
        's2': format_sector_timedelta(lap2.get('Sector2Time')),
        's3': format_sector_timedelta(lap2.get('Sector3Time')),
    }


    return {
        'driver1': d1_summary,
        'driver2': d2_summary,
        'summary': {
            'delta': round(lap1_sec - lap2_sec, 3),
            'faster_driver': str(lap1['Driver']) if lap1_sec <= lap2_sec else str(lap2['Driver']),
            'track_length': int(round(float(d1[-1]))) if len(d1) > 0 else 5300,
            'year': year,
            'gp': gp,
            'session': session_code,
            'track_temp': track_temp,
            'air_temp': air_temp,
        },
        'corners': corners_list,
        'track_rotation': track_rotation,
        'telemetry': telemetry_samples,
    }
