import pandas as pd
import numpy as np

def to_float(value):
    "Convert numpy/pandas scalar to a JSON-safe float or None."
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    try:
        return float(value)
    except (TypeError, ValueError):
        return None

def to_int(value):
    "Convert numpy/pandas scalar to a JSON-safe int or None."
    f = to_float(value)
    return None if f is None else int(f)

def to_str(value):
    "Convert value to a JSON-safe string or None."
    if value is None:
        return None
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    return str(value)

def format_lap_timedelta(td):
    "Format timedelta into MM:SS.mmm string."
    if td is None:
        return None
    try:
        if pd.isna(td):
            return None
        total_sec = td.total_seconds()
        mins = int(total_sec // 60)
        rem = total_sec % 60
        return f"{mins}:{rem:06.3f}"
    except Exception:
        return str(td)

def format_sector_timedelta(td):
    """Format sector timedelta into SS.mmm string."""
    if td is None:
        return None
    try:
        if pd.isna(td):
            return None
        total_sec = td.total_seconds()
        return f"{total_sec:.3f}"
    except Exception:
        return str(td)

def format_team_color(color_hex):
    """Format hex color ensuring leading #."""
    if not color_hex or pd.isna(color_hex):
        return None
    s = str(color_hex).strip().lstrip("#")
    return f"#{s}" if s else None
