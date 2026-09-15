import fastf1 as f1
import pandas as pd
from utils.formatters import (
    to_float, to_int, to_str,
    format_lap_timedelta, format_team_color
)

_SESSION_CACHE = {}

def get_or_load_session(year, gp, session_code, load_telemetry=False):
    clean_gp = str(gp).replace('Grand Prix', '').strip().lower()
    clean_session = str(session_code).strip().upper()
    cache_key = (int(year), clean_gp, clean_session)

    if cache_key in _SESSION_CACHE:
        sess, has_tel = _SESSION_CACHE[cache_key]
        if not load_telemetry or has_tel:
            return sess
        session = f1.get_session(int(year), gp, session_code)
        session.load(telemetry=load_telemetry, laps=True, weather=True)
        _SESSION_CACHE[cache_key] = (session, load_telemetry)
        return sess

    session = f1.get_session(int(year), gp, session_code)
    session.load(
        laps=True,
        telemetry=load_telemetry,
        weather=True,
        messages=False,
    )
    _SESSION_CACHE[cache_key] = (session, load_telemetry)
    return session

def serialize_session(session, include_telemetry=False):
    payload = {
        'event': {
            'year': int(session.event.year),
            'name': session.event['EventName'],
            'official_name': session.event.get('OfficialEventName'),
            'round': int(session.event['RoundNumber']) if 'RoundNumber' in session.event else 1,
            'country': session.event.get('Country'),
            'location': session.event.get('Location'),
        },
        'session': {
            'name': session.name,
            'type': session.session_info.get('Type') if hasattr(session, 'session_info') else 'Session',
            'date': str(session.session_info.get('StartDate')) if hasattr(session, 'session_info') else str(session.date),
        },
        'drivers': [],
        'results': [],
    }

    try:
        for drv_num in session.drivers:
            try:
                info = session.get_driver(drv_num)
                payload['drivers'].append({
                    'number': str(drv_num),
                    'code': str(info.get('Abbreviation') or drv_num),
                    'first_name': to_str(info.get('FirstName')),
                    'last_name': to_str(info.get('LastName')),
                    'team': to_str(info.get('TeamName')) or 'Formula 1',
                    'team_color': format_team_color(info.get('TeamColor')),
                })
            except Exception:
                payload['drivers'].append({
                    'number': str(drv_num),
                    'code': str(drv_num),
                    'team': 'Formula 1',
                })
    except Exception as e:
        payload['drivers_error'] = str(e)

    try:
        results = session.results
        if results is not None and not results.empty:
            for _, row in results.iterrows():
                lap_time_str = None
                time_val = row.get('Time')
                if time_val is not None and not pd.isna(time_val):
                    lap_time_str = format_lap_timedelta(time_val)

                payload['results'].append({
                    'position': to_int(row.get('Position')),
                    'driver_number': to_str(row.get('DriverNumber')),
                    'abbreviation': to_str(row.get('Abbreviation')),
                    'full_name': to_str(row.get('FullName')),
                    'team': to_str(row.get('TeamName')),
                    'team_color': format_team_color(row.get('TeamColor')),
                    'time': lap_time_str,
                    'status': to_str(row.get('Status')),
                    'points': to_float(row.get('Points')),
                })
    except Exception as e:
        payload['results_error'] = str(e)

    return payload
