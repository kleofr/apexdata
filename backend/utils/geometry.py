import numpy as np

def rotate_coordinates(x_arr, y_arr, track_rotation):
    "Rotate (X, Y) track coordinates by track_rotation to match FIA TV orientation."
    angle_rad = np.radians(track_rotation)
    cos_a = np.cos(angle_rad)
    sin_a = np.sin(angle_rad)
    x_rot = x_arr * cos_a - y_arr * sin_a
    y_rot = x_arr * sin_a + y_arr * cos_a
    return x_rot, y_rot

def extract_corners_fallback(x_raw, y_raw, d_arr, x_rot, y_rot, speed_arr=None):
    "Detect corners via track curvature peaks or speed minimums if FastF1 has no corner metadata."
    corners_list = []
    if len(d_arr) <= 50:
        return corners_list

    try:
        from scipy.signal import find_peaks
        from scipy.ndimage import gaussian_filter1d

        # 1. Primary: Curvature peak extraction if coordinate data exists
        if np.any(x_raw != 0) and np.any(y_raw != 0):
            sigma = max(2, int(len(d_arr) / 300))
            xs = gaussian_filter1d(x_raw, sigma=sigma)
            ys = gaussian_filter1d(y_raw, sigma=sigma)

            dx = np.gradient(xs, d_arr)
            dy = np.gradient(ys, d_arr)
            ddx = np.gradient(dx, d_arr)
            ddy = np.gradient(dy, d_arr)
            curvature = np.abs(dx * ddy - dy * ddx) / ((dx**2 + dy**2)**1.5 + 1e-9)

            min_distance_samples = max(12, int(len(d_arr) / 45))
            peaks, _ = find_peaks(curvature, distance=min_distance_samples, prominence=0.00015)

            for idx, p in enumerate(peaks):
                corners_list.append({
                    "number": idx + 1,
                    "letter": "",
                    "distance": round(float(d_arr[p]), 1),
                    "x": round(float(x_rot[p]), 1),
                    "y": round(float(y_rot[p]), 1),
                    "angle": 0.0,
                })

        # 2. Secondary: If curvature found fewer than 5 turns and speed data is available, detect corner apexes via speed troughs
        if len(corners_list) < 5 and speed_arr is not None and len(speed_arr) == len(d_arr):
            corners_list = []
            inv_speed = -np.array(speed_arr, dtype=float)
            min_dist_samples = max(15, int(len(d_arr) / 35))
            speed_troughs, _ = find_peaks(inv_speed, distance=min_dist_samples, prominence=10)

            for idx, p in enumerate(speed_troughs):
                corners_list.append({
                    "number": idx + 1,
                    "letter": "",
                    "distance": round(float(d_arr[p]), 1),
                    "x": round(float(x_rot[p]), 1) if len(x_rot) > p else 0.0,
                    "y": round(float(y_rot[p]), 1) if len(y_rot) > p else 0.0,
                    "angle": 0.0,
                })
    except Exception as e:
        print(f"[ApexData] Curvature corner extraction fallback error: {e}")

    return corners_list

