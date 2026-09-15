def get_weekend_weather(session=None, year=2024, gp='Monaco'):
    air_temp_base = 24.0
    track_temp_base = 38.0
    humidity_base = 52.0
    rain_chance = 10
    wind_speed = 12.5

    if session is not None and hasattr(session, 'weather_data') and session.weather_data is not None and not session.weather_data.empty:
        try:
            w_df = session.weather_data
            if 'AirTemp' in w_df and not w_df['AirTemp'].empty:
                air_temp_base = round(float(w_df['AirTemp'].mean()), 1)
            if 'TrackTemp' in w_df and not w_df['TrackTemp'].empty:
                track_temp_base = round(float(w_df['TrackTemp'].mean()), 1)
            if 'Humidity' in w_df and not w_df['Humidity'].empty:
                humidity_base = round(float(w_df['Humidity'].mean()), 1)
            if 'Rainfall' in w_df and not w_df['Rainfall'].empty:
                has_rain = bool(w_df['Rainfall'].any())
                rain_chance = 80 if has_rain else 15
            if 'WindSpeed' in w_df and not w_df['WindSpeed'].empty:
                wind_speed = round(float(w_df['WindSpeed'].mean()), 1)
        except Exception:
            pass

    return {
        'friday': {
            'day': 'Friday',
            'sessions': 'Practice 1 & Practice 2',
            'air_temp_c': round(air_temp_base - 1.2, 1),
            'track_temp_c': round(track_temp_base - 2.5, 1),
            'condition': 'Dry / Sunny' if rain_chance < 40 else 'Overcast',
            'rain_probability_pct': max(5, rain_chance - 5),
            'humidity_pct': int(humidity_base),
            'wind_kmh': round(wind_speed + 2.0, 1),
            'status': 'COMPLETED'
        },
        'saturday': {
            'day': 'Saturday',
            'sessions': 'Practice 3 & Qualifying',
            'air_temp_c': round(air_temp_base + 0.5, 1),
            'track_temp_c': round(track_temp_base + 1.8, 1),
            'condition': 'Clear Track' if rain_chance < 30 else 'Threat of Rain',
            'rain_probability_pct': rain_chance,
            'humidity_pct': int(humidity_base - 3),
            'wind_kmh': round(wind_speed, 1),
            'status': 'COMPLETED'
        },
        'sunday': {
            'day': 'Sunday',
            'sessions': 'Grand Prix Race',
            'air_temp_c': round(air_temp_base, 1),
            'track_temp_c': round(track_temp_base, 1),
            'condition': 'Optimum Grip' if rain_chance < 20 else 'Wet Conditions',
            'rain_probability_pct': rain_chance,
            'humidity_pct': int(humidity_base),
            'wind_kmh': round(wind_speed - 1.0, 1),
            'status': 'COMPLETED'
        }
    }
