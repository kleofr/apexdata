import numpy as np
import pandas as pd
from utils.formatters import (
    to_float, to_str, format_lap_timedelta,
    format_sector_timedelta, format_team_color
)
from utils.geometry import rotate_coordinates, extract_corners_fallback

def calculate_theoretical_best_lap(driver_laps):
    """
    Computes theoretical best lap from all valid timed laps for a driver in a session.
    Theoretical Best = min(Sector1Time) + min(Sector2Time) + min(Sector3Time)
    """
    if driver_laps.empty:
        return None

    # Filter for laps with valid sector times
    valid_s1 = driver_laps['Sector1Time'].dropna()
    valid_s2 = driver_laps['Sector2Time'].dropna()
    valid_s3 = driver_laps['Sector3Time'].dropna()

    if valid_s1.empty or valid_s2.empty or valid_s3.empty:
        return None

    best_s1_td = valid_s1.min()
    best_s2_td = valid_s2.min()
    best_s3_td = valid_s3.min()

    theoretical_td = best_s1_td + best_s2_td + best_s3_td
    theoretical_sec = theoretical_td.total_seconds()

    return {
        'lap_time': format_lap_timedelta(theoretical_td),
        'lap_time_seconds': round(theoretical_sec, 3),
        'best_s1': format_sector_timedelta(best_s1_td),
        'best_s1_seconds': round(best_s1_td.total_seconds(), 3),
        'best_s2': format_sector_timedelta(best_s2_td),
        'best_s2_seconds': round(best_s2_td.total_seconds(), 3),
        'best_s3': format_sector_timedelta(best_s3_td),
        'best_s3_seconds': round(best_s3_td.total_seconds(), 3),
    }

def analyze_corner_metrics(corners, car_pole, car_ref):
    """
    Analyzes corner-level telemetry (Braking Point, Apex Speed, Throttle Application)
    for both Pole and Reference driver.
    """
    corner_results = []
    if not corners or car_pole.empty or car_ref.empty:
        return corner_results

    # Pre-extract numpy arrays for fast vector search
    d_p = car_pole['Distance'].to_numpy()
    spd_p = car_pole['Speed'].to_numpy()
    thr_p = car_pole['Throttle'].to_numpy()
    brk_p = (car_pole['Brake'].to_numpy().astype(float) > 0).astype(float) if 'Brake' in car_pole else np.zeros_like(d_p)

    d_r = car_ref['Distance'].to_numpy()
    spd_r = car_ref['Speed'].to_numpy()
    thr_r = car_ref['Throttle'].to_numpy()
    brk_r = (car_ref['Brake'].to_numpy().astype(float) > 0).astype(float) if 'Brake' in car_ref else np.zeros_like(d_r)

    track_len = max(d_p[-1] if len(d_p) > 0 else 0, d_r[-1] if len(d_r) > 0 else 0)

    for c in corners:
        c_num = c.get('number', 0)
        c_letter = c.get('letter', '')
        c_dist = float(c.get('distance', 0.0))

        # Look in a window: 150m before apex to 100m after apex
        w_start = max(0.0, c_dist - 150.0)
        w_end = min(track_len, c_dist + 100.0)

        # Pole driver window indices
        mask_p = (d_p >= w_start) & (d_p <= w_end)
        mask_r = (d_r >= w_start) & (d_r <= w_end)

        if not np.any(mask_p) or not np.any(mask_r):
            continue

        # 1. Apex Speed: Minimum speed through the corner zone
        sub_spd_p = spd_p[mask_p]
        sub_d_p = d_p[mask_p]
        min_idx_p = np.argmin(sub_spd_p)
        apex_speed_p = float(sub_spd_p[min_idx_p])
        apex_dist_p = float(sub_d_p[min_idx_p])

        sub_spd_r = spd_r[mask_r]
        sub_d_r = d_r[mask_r]
        min_idx_r = np.argmin(sub_spd_r)
        apex_speed_r = float(sub_spd_r[min_idx_r])
        apex_dist_r = float(sub_d_r[min_idx_r])

        # 2. Braking Point: Where brake first turns ON before apex
        pre_apex_p = (d_p >= w_start) & (d_p <= apex_dist_p)
        brk_pre_p = brk_p[pre_apex_p]
        d_pre_p = d_p[pre_apex_p]
        brake_pt_p = None
        if np.any(brk_pre_p > 0):
            brk_indices = np.where(brk_pre_p > 0)[0]
            brake_pt_p = float(d_pre_p[brk_indices[0]])

        pre_apex_r = (d_r >= w_start) & (d_r <= apex_dist_r)
        brk_pre_r = brk_r[pre_apex_r]
        d_pre_r = d_r[pre_apex_r]
        brake_pt_r = None
        if np.any(brk_pre_r > 0):
            brk_indices_r = np.where(brk_pre_r > 0)[0]
            brake_pt_r = float(d_pre_r[brk_indices_r[0]])

        # 3. Throttle Application: First point after apex where throttle > 30%
        post_apex_p = (d_p >= apex_dist_p) & (d_p <= w_end)
        thr_post_p = thr_p[post_apex_p]
        d_post_p = d_p[post_apex_p]
        throttle_pt_p = None
        if np.any(thr_post_p > 30):
            thr_indices = np.where(thr_post_p > 30)[0]
            throttle_pt_p = float(d_post_p[thr_indices[0]])

        post_apex_r = (d_r >= apex_dist_r) & (d_r <= w_end)
        thr_post_r = thr_r[post_apex_r]
        d_post_r = d_r[post_apex_r]
        throttle_pt_r = None
        if np.any(thr_post_r > 30):
            thr_indices_r = np.where(thr_post_r > 30)[0]
            throttle_pt_r = float(d_post_r[thr_indices_r[0]])

        # Deltas
        apex_speed_delta = round(apex_speed_r - apex_speed_p, 1)
        braking_delta_m = round(brake_pt_r - brake_pt_p, 1) if (brake_pt_p is not None and brake_pt_r is not None) else None
        throttle_delta_m = round(throttle_pt_r - throttle_pt_p, 1) if (throttle_pt_p is not None and throttle_pt_r is not None) else None

        corner_results.append({
            'corner_number': c_num,
            'corner_letter': c_letter,
            'corner_label': f"T{c_num}{c_letter}".strip(),
            'distance': round(c_dist, 1),
            'pole': {
                'apex_speed': round(apex_speed_p, 1),
                'apex_distance': round(apex_dist_p, 1),
                'braking_distance': round(brake_pt_p, 1) if brake_pt_p is not None else None,
                'throttle_distance': round(throttle_pt_p, 1) if throttle_pt_p is not None else None,
            },
            'driver': {
                'apex_speed': round(apex_speed_r, 1),
                'apex_distance': round(apex_dist_r, 1),
                'braking_distance': round(brake_pt_r, 1) if brake_pt_r is not None else None,
                'throttle_distance': round(throttle_pt_r, 1) if throttle_pt_r is not None else None,
            },
            'deltas': {
                'apex_speed': apex_speed_delta,
                'braking_delta_m': braking_delta_m,
                'throttle_delta_m': throttle_delta_m,
            }
        })

    return corner_results

def compute_qualifying_delta(session, ref_driver_id, year, gp):
    """
    Main business logic computing the full Qualifying Delta payload comparing
    the specified reference driver against the session's Pole Sitter.
    """
    if session.laps is None or session.laps.empty:
        raise ValueError(f"No lap data available in qualifying session for {year} {gp}.")

    # 1. Identify Pole Lap (Fastest overall lap in Qualifying)
    pole_lap = session.laps.pick_fastest()
    if pole_lap is None or pd.isna(pole_lap.get('LapTime')):
        raise ValueError(f"Could not determine pole lap for {year} {gp} Qualifying.")

    pole_driver_code = str(pole_lap['Driver'])

    # 2. Identify Reference Driver Lap
    ref_code = str(ref_driver_id).strip().upper() if ref_driver_id else ''
    if not ref_code or ref_code == pole_driver_code:
        # Pick the second fastest driver in the session
        sorted_laps = session.laps.sort_values(by='LapTime')
        other_laps = sorted_laps[sorted_laps['Driver'] != pole_driver_code]
        if not other_laps.empty:
            ref_code = str(other_laps.iloc[0]['Driver'])
        else:
            ref_code = pole_driver_code

    ref_laps = session.laps.pick_drivers(ref_code)
    if ref_laps.empty:
        raise ValueError(f"Driver '{ref_code}' has no recorded laps in this qualifying session.")

    ref_lap = ref_laps.pick_fastest()
    if ref_lap is None or pd.isna(ref_lap.get('LapTime')):
        raise ValueError(f"Driver '{ref_code}' did not record a valid timed lap in qualifying.")

    # 3. Telemetry extraction using add_distance()
    pole_car = pole_lap.get_car_data().add_distance()
    ref_car = ref_lap.get_car_data().add_distance()

    # 4. Extract telemetry arrays & circuit coordinates
    pole_tel = pole_lap.get_telemetry()
    d_tel_p = pole_tel['Distance'].to_numpy()
    x1_raw = pole_tel['X'].to_numpy().astype(float) if 'X' in pole_tel else np.zeros_like(d_tel_p)
    y1_raw = pole_tel['Y'].to_numpy().astype(float) if 'Y' in pole_tel else np.zeros_like(d_tel_p)
    speed_raw = pole_tel['Speed'].to_numpy().astype(float) if 'Speed' in pole_tel else np.zeros_like(d_tel_p)

    # Circuit corners resolution
    corners_list = []
    track_rotation = 0.0
    try:
        circuit_info = session.get_circuit_info()
        if circuit_info is not None and hasattr(circuit_info, 'rotation'):
            track_rotation = float(circuit_info.rotation)
        if circuit_info is not None and hasattr(circuit_info, 'corners') and circuit_info.corners is not None and not circuit_info.corners.empty:
            for _, c in circuit_info.corners.iterrows():
                corners_list.append({
                    'number': int(c.get('Number', 0)),
                    'letter': str(c.get('Letter', '')).strip(),
                    'distance': float(c.get('Distance', 0.0)),
                    'x': float(c.get('X', 0.0)),
                    'y': float(c.get('Y', 0.0)),
                    'angle': float(c.get('Angle', 0.0)),
                })
    except Exception:
        pass

    x1_rot, y1_rot = rotate_coordinates(x1_raw, y1_raw, track_rotation)

    # If FastF1 lacks corners, generate them using track curvature peaks and speed apex troughs
    if not corners_list and len(d_tel_p) > 0:
        corners_list = extract_corners_fallback(
            x1_raw, y1_raw, d_tel_p, x1_rot, y1_rot, speed_arr=speed_raw
        )


    # 5. Corner-Level Analysis
    corner_metrics = analyze_corner_metrics(corners_list, pole_car, ref_car)

    # 6. Theoretical Best Lap for Pole & Reference
    pole_all_laps = session.laps.pick_drivers(pole_driver_code)
    pole_theoretical = calculate_theoretical_best_lap(pole_all_laps)
    ref_theoretical = calculate_theoretical_best_lap(ref_laps)

    # Driver info lookup
    pole_info = session.get_driver(pole_lap['DriverNumber'])
    ref_info = session.get_driver(ref_lap['DriverNumber'])

    pole_sec = pole_lap['LapTime'].total_seconds()
    ref_sec = ref_lap['LapTime'].total_seconds()
    lap_delta = round(ref_sec - pole_sec, 3)

    # Sector Breakdown
    p_s1 = pole_lap['Sector1Time'].total_seconds() if pd.notna(pole_lap.get('Sector1Time')) else None
    p_s2 = pole_lap['Sector2Time'].total_seconds() if pd.notna(pole_lap.get('Sector2Time')) else None
    p_s3 = pole_lap['Sector3Time'].total_seconds() if pd.notna(pole_lap.get('Sector3Time')) else None

    r_s1 = ref_lap['Sector1Time'].total_seconds() if pd.notna(ref_lap.get('Sector1Time')) else None
    r_s2 = ref_lap['Sector2Time'].total_seconds() if pd.notna(ref_lap.get('Sector2Time')) else None
    r_s3 = ref_lap['Sector3Time'].total_seconds() if pd.notna(ref_lap.get('Sector3Time')) else None

    delta_s1 = round(r_s1 - p_s1, 3) if (p_s1 is not None and r_s1 is not None) else None
    delta_s2 = round(r_s2 - p_s2, 3) if (p_s2 is not None and r_s2 is not None) else None
    delta_s3 = round(r_s3 - p_s3, 3) if (p_s3 is not None and r_s3 is not None) else None

    pole_time_left = round(pole_sec - pole_theoretical['lap_time_seconds'], 3) if pole_theoretical else 0.0
    ref_time_left = round(ref_sec - ref_theoretical['lap_time_seconds'], 3) if ref_theoretical else 0.0

    # Resample telemetry for plotting traces (Speed, Throttle, Brake, Delta)
    d_p = pole_car['Distance'].to_numpy()
    d_r = ref_car['Distance'].to_numpy()
    t_p = pole_lap.get_telemetry()['Time'].dt.total_seconds().to_numpy()
    t_r = ref_lap.get_telemetry()['Time'].dt.total_seconds().to_numpy()
    d_tel_p = pole_lap.get_telemetry()['Distance'].to_numpy()
    d_tel_r = ref_lap.get_telemetry()['Distance'].to_numpy()

    # Time delta alignment
    t_r_interp = np.interp(d_tel_p, d_tel_r, t_r)
    delta_arr = t_r_interp - t_p

    speed_p_interp = np.interp(d_tel_p, d_p, pole_car['Speed'].to_numpy())
    speed_r_interp = np.interp(d_tel_p, d_r, ref_car['Speed'].to_numpy())
    throttle_p_interp = np.interp(d_tel_p, d_p, pole_car['Throttle'].to_numpy())
    throttle_r_interp = np.interp(d_tel_p, d_r, ref_car['Throttle'].to_numpy())
    brake_p_interp = (np.interp(d_tel_p, d_p, (pole_car['Brake'].to_numpy().astype(float) > 0).astype(float)) > 0).astype(float) * 100.0 if 'Brake' in pole_car else np.zeros_like(d_tel_p)
    brake_r_interp = (np.interp(d_tel_p, d_r, (ref_car['Brake'].to_numpy().astype(float) > 0).astype(float)) > 0).astype(float) * 100.0 if 'Brake' in ref_car else np.zeros_like(d_tel_p)

    total_pts = len(d_tel_p)
    sample_indices = np.linspace(0, total_pts - 1, min(500, total_pts), dtype=int)

    telemetry_samples = []
    for idx in sample_indices:
        telemetry_samples.append({
            'distance': int(round(d_tel_p[idx])),
            'speed_pole': round(float(speed_p_interp[idx]), 1),
            'speed_driver': round(float(speed_r_interp[idx]), 1),
            'throttle_pole': round(float(throttle_p_interp[idx]), 1),
            'throttle_driver': round(float(throttle_r_interp[idx]), 1),
            'brake_pole': round(float(brake_p_interp[idx]), 1),
            'brake_driver': round(float(brake_r_interp[idx]), 1),
            'delta': round(float(delta_arr[idx]), 3),
            'x': round(float(x1_rot[idx]), 1),
            'y': round(float(y1_rot[idx]), 1),
        })


    pole_summary = {
        'code': pole_driver_code,
        'number': str(pole_lap['DriverNumber']),
        'name': f"{pole_info.get('FirstName', '')} {pole_info.get('LastName', '')}".strip() or pole_driver_code,
        'team': str(pole_info.get('TeamName') or 'Formula 1'),
        'team_color': format_team_color(pole_info.get('TeamColor')) or '#FF6A00',
        'lap_time': format_lap_timedelta(pole_lap['LapTime']),
        'lap_time_seconds': round(pole_sec, 3),
        's1': format_sector_timedelta(pole_lap.get('Sector1Time')),
        's2': format_sector_timedelta(pole_lap.get('Sector2Time')),
        's3': format_sector_timedelta(pole_lap.get('Sector3Time')),
        's1_seconds': round(p_s1, 3) if p_s1 else None,
        's2_seconds': round(p_s2, 3) if p_s2 else None,
        's3_seconds': round(p_s3, 3) if p_s3 else None,
        'theoretical': pole_theoretical,
        'time_left_on_table': max(0.0, pole_time_left),
    }

    ref_summary = {
        'code': ref_code,
        'number': str(ref_lap['DriverNumber']),
        'name': f"{ref_info.get('FirstName', '')} {ref_info.get('LastName', '')}".strip() or ref_code,
        'team': str(ref_info.get('TeamName') or 'Formula 1'),
        'team_color': format_team_color(ref_info.get('TeamColor')) or '#00F0FF',
        'lap_time': format_lap_timedelta(ref_lap['LapTime']),
        'lap_time_seconds': round(ref_sec, 3),
        's1': format_sector_timedelta(ref_lap.get('Sector1Time')),
        's2': format_sector_timedelta(ref_lap.get('Sector2Time')),
        's3': format_sector_timedelta(ref_lap.get('Sector3Time')),
        's1_seconds': round(r_s1, 3) if r_s1 else None,
        's2_seconds': round(r_s2, 3) if r_s2 else None,
        's3_seconds': round(r_s3, 3) if r_s3 else None,
        'theoretical': ref_theoretical,
        'time_left_on_table': max(0.0, ref_time_left),
    }

    sector_breakdown = [
        {
            'sector': 'Sector 1',
            'pole_time': pole_summary['s1'],
            'driver_time': ref_summary['s1'],
            'pole_seconds': pole_summary['s1_seconds'],
            'driver_seconds': ref_summary['s1_seconds'],
            'delta_seconds': delta_s1,
            'faster': 'POLE' if (delta_s1 is not None and delta_s1 > 0) else (ref_code if delta_s1 is not None and delta_s1 < 0 else 'TIED'),
        },
        {
            'sector': 'Sector 2',
            'pole_time': pole_summary['s2'],
            'driver_time': ref_summary['s2'],
            'pole_seconds': pole_summary['s2_seconds'],
            'driver_seconds': ref_summary['s2_seconds'],
            'delta_seconds': delta_s2,
            'faster': 'POLE' if (delta_s2 is not None and delta_s2 > 0) else (ref_code if delta_s2 is not None and delta_s2 < 0 else 'TIED'),
        },
        {
            'sector': 'Sector 3',
            'pole_time': pole_summary['s3'],
            'driver_time': ref_summary['s3'],
            'pole_seconds': pole_summary['s3_seconds'],
            'driver_seconds': ref_summary['s3_seconds'],
            'delta_seconds': delta_s3,
            'faster': 'POLE' if (delta_s3 is not None and delta_s3 > 0) else (ref_code if delta_s3 is not None and delta_s3 < 0 else 'TIED'),
        },
    ]

    return {
        'year': year,
        'gp': gp,
        'pole_driver': pole_summary,
        'reference_driver': ref_summary,
        'overall_delta': lap_delta,
        'sector_breakdown': sector_breakdown,
        'corner_analysis': corner_metrics,
        'telemetry': telemetry_samples,
        'corners': corners_list,
        'track_rotation': track_rotation,
        'track_length': int(round(float(d_tel_p[-1]))) if len(d_tel_p) > 0 else 5000,
    }

