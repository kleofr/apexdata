from flask import Blueprint, jsonify, request
import numpy as np
from services.session_service import get_or_load_session, serialize_session
from services.circuit_service import get_circuit_details
from services.weather_service import get_weekend_weather
from utils.geometry import rotate_coordinates, extract_corners_fallback
from utils.formatters import format_lap_timedelta, format_team_color, to_str

overview_bp = Blueprint('overview_bp', __name__)

def extract_fastest_lap_data(session, session_name='Race'):
    """Dynamically extracts the fastest lap from a FastF1 session laps dataframe."""
    if session is None or not hasattr(session, 'laps') or session.laps is None or session.laps.empty:
        return None
    try:
        fastest = session.laps.pick_fastest()
        if fastest is None or fastest.empty:
            return None
        
        driver_code = to_str(fastest.get('Driver'))
        team_name = to_str(fastest.get('Team'))
        lap_time = format_lap_timedelta(fastest.get('LapTime'))
        lap_num = int(fastest.get('LapNumber')) if fastest.get('LapNumber') is not None and not np.isnan(fastest.get('LapNumber')) else None
        
        driver_full_name = driver_code
        driver_color = '#FFFFFF'
        try:
            drv_info = session.get_driver(driver_code)
            if drv_info is not None:
                driver_full_name = to_str(drv_info.get('FullName')) or driver_code
                driver_color = format_team_color(drv_info.get('TeamColor')) or '#FFFFFF'
        except Exception:
            pass

        return {
            'time': lap_time,
            'driver': driver_full_name,
            'driver_code': driver_code,
            'team': team_name,
            'team_color': driver_color,
            'session': session_name,
            'lap_number': lap_num
        }
    except Exception as e:
        print(f"[ApexData] Error extracting fastest lap for {session_name}: {e}")
        return None

@overview_bp.route('/api/overview', methods=['GET'])
def get_weekend_overview():
    year = request.args.get('year', default=2024, type=int)
    gp = request.args.get('gp', default='Monaco', type=str)
    session_code = request.args.get('session', default='R', type=str)

    try:
        session = get_or_load_session(year, gp, session_code, load_telemetry=True)
        session_data = serialize_session(session, include_telemetry=False)
        circuit_data = get_circuit_details(gp, year=year)
        weather_data = get_weekend_weather(session=session, year=year, gp=gp)

        # Dynamic fastest lap extraction
        race_fastest = extract_fastest_lap_data(session, session_name='Race Lap')
        
        # Also attempt to dynamically query Qualifying session if available
        qualifying_fastest = None
        try:
            q_session = get_or_load_session(year, gp, 'Q', load_telemetry=False)
            qualifying_fastest = extract_fastest_lap_data(q_session, session_name='Qualifying (Pole)')
        except Exception as q_err:
            # Fallback if Qualifying has not occurred or cannot be loaded
            pass

        fastest_lap_info = {
            'qualifying_fastest': qualifying_fastest,
            'race_fastest': race_fastest,
        }

        track_rotation = 0.0
        corners_list = []
        track_samples = []

        try:
            circuit_info = session.get_circuit_info()
            if circuit_info is not None and hasattr(circuit_info, 'rotation'):
                track_rotation = float(circuit_info.rotation)
        except Exception:
            circuit_info = None

        try:
            fastest_lap = session.laps.pick_fastest()
            if fastest_lap is not None:
                tel = fastest_lap.get_telemetry()
                if tel is not None and not tel.empty:
                    d_raw = tel['Distance'].to_numpy()
                    x_raw = tel['X'].to_numpy().astype(float) if 'X' in tel else np.zeros_like(d_raw)
                    y_raw = tel['Y'].to_numpy().astype(float) if 'Y' in tel else np.zeros_like(d_raw)
                    x_rot, y_rot = rotate_coordinates(x_raw, y_raw, track_rotation)

                    if circuit_info is not None and hasattr(circuit_info, 'corners') and circuit_info.corners is not None and not circuit_info.corners.empty:
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
                                diff_sq = (x_raw - cx_raw) ** 2 + (y_raw - cy_raw) ** 2
                                c_dist = float(d_raw[np.argmin(diff_sq)])

                            corners_list.append({
                                'number': int(c.get('Number', 0)),
                                'letter': str(c.get('Letter', '')).strip(),
                                'distance': round(c_dist, 1),
                                'x': round(float(cx_rot), 1),
                                'y': round(float(cy_rot), 1),
                                'angle': round(float(c.get('Angle', 0.0)), 1),
                            })

                    if not corners_list:
                        corners_list = extract_corners_fallback(x_raw, y_raw, d_raw, x_rot, y_rot)

                    total_samples = len(d_raw)
                    indices = np.linspace(0, total_samples - 1, min(500, total_samples), dtype=int)
                    for i in indices:
                        track_samples.append({
                            'distance': int(round(d_raw[i])),
                            'x': round(float(x_rot[i]), 1),
                            'y': round(float(y_rot[i]), 1),
                            'speed': round(float(tel['Speed'].iloc[i]), 1) if 'Speed' in tel else 150.0,
                            'gear': int(tel['nGear'].iloc[i]) if 'nGear' in tel else 4,
                            'drs': int(tel['DRS'].iloc[i]) if 'DRS' in tel else 0,
                        })
        except Exception as tel_err:
            print(f"[ApexData] Track geometry extraction warning: {tel_err}")

        track_geometry = {
            'track_rotation': track_rotation,
            'corners': corners_list,
            'track_samples': track_samples,
            'track_length': int(round(float(track_samples[-1]['distance']))) if track_samples else int(circuit_data.get('length_km', 5.0) * 1000)
        }

        return jsonify({
            'status': 'success',
            'year': year,
            'gp': gp,
            'session_code': session_code,
            'data': {
                'event': session_data.get('event'),
                'session': session_data.get('session'),
                'results': session_data.get('results', []),
                'drivers': session_data.get('drivers', []),
                'circuit': circuit_data,
                'weather': weather_data,
                'track_geometry': track_geometry,
                'fastest_lap_info': fastest_lap_info
            }
        }), 200
    except Exception as e:
        circuit_data = get_circuit_details(gp, year=year)
        weather_data = get_weekend_weather(session=None, year=year, gp=gp)
        return jsonify({
            'status': 'partial',
            'message': str(e),
            'year': year,
            'gp': gp,
            'session_code': session_code,
            'data': {
                'event': {'year': year, 'name': f"{gp} Grand Prix", 'round': 1},
                'session': {'name': 'Grand Prix Race', 'type': 'Race'},
                'results': [],
                'drivers': [],
                'circuit': circuit_data,
                'weather': weather_data,
                'track_geometry': {
                    'track_rotation': 0.0,
                    'corners': [],
                    'track_samples': [],
                    'track_length': int(circuit_data.get('length_km', 5.0) * 1000)
                },
                'fastest_lap_info': {
                    'qualifying_fastest': None,
                    'race_fastest': None
                }
            }
        }), 200
