import numpy as np
import pandas as pd
from astropy.io import fits
from scipy.signal import find_peaks, savgol_filter

def parse_file(file_path: str):
    """
    Parses a FITS or ASCII/CSV file and returns time and rate arrays.
    """
    if file_path.lower().endswith(('.fits', '.lc')):
        with fits.open(file_path) as hdul:
            data = hdul[1].data
            time = data['TIME']
            rate = data['RATE']
            return time, rate
    else:
        # Assume CSV or general ASCII
        try:
            df = pd.read_csv(file_path)
            # Find probable time and rate columns
            time_col = next((c for c in df.columns if 'time' in c.lower()), df.columns[0])
            rate_col = next((c for c in df.columns if 'rate' in c.lower() or 'flux' in c.lower() or 'counts' in c.lower()), df.columns[1])
            return df[time_col].values, df[rate_col].values
        except Exception as e:
            raise ValueError(f"Could not parse file. Details: {e}")

def classify_burst(peak_flux: float, baseline: float = 0.0):
    """
    Simple heuristic classification based on peak flux.
    Since real PRADAN data ranges depend on the instrument calibration,
    we'll use generic thresholds. Modify as per exact mission specifics.
    """
    flux = peak_flux - baseline
    if flux > 5000:
        return 'X-Class (Severe)'
    elif flux > 1000:
        return 'M-Class (Strong)'
    elif flux > 200:
        return 'C-Class (Minor)'
    elif flux > 50:
        return 'B-Class (Small)'
    else:
        return 'A-Class (Micro)'

def analyze_light_curve(file_path: str):
    raw_time, raw_rate = parse_file(file_path)
    
    # Handle NaN/Inf
    valid = ~np.isnan(raw_rate) & ~np.isinf(raw_rate)
    time = raw_time[valid]
    rate = raw_rate[valid]
    
    if len(time) == 0:
        raise ValueError("No valid data found in file.")

    # Smooth the signal to avoid detecting noise spikes as bursts
    window_length = min(51, len(rate) - (len(rate) % 2 == 0))
    if window_length > 3:
        smoothed_rate = savgol_filter(rate, window_length, 3)
    else:
        smoothed_rate = rate

    baseline = np.median(rate)
    prominence_threshold = np.std(rate) * 3  # 3 std dev above noise

    # Find peaks on smoothed data
    peaks, properties = find_peaks(
        smoothed_rate, 
        prominence=prominence_threshold,
        width=3 # Minimum width
    )

    detected_bursts = []
    
    # Calculate properties for each peak
    for i, peak_idx in enumerate(peaks):
        try:
            # We use widths properties from scipy
            # properties['left_ips'] gives interpolated left boundaries
            # properties['right_ips'] gives interpolated right boundaries
            
            # Use raw_rate for the actual peak flux to be accurate
            peak_flux = float(rate[peak_idx])
            peak_time = float(time[peak_idx])
            
            # Simple estimations of start and end from half-prominence width (or use base finding)
            # For simplicity, using widths provided by scipy (which relate to prominence)
            from scipy.signal import peak_widths
            widths, width_heights, left_ips, right_ips = peak_widths(smoothed_rate, [peak_idx], rel_height=0.9)
            
            left_idx = int(left_ips[0])
            right_idx = int(right_ips[0])
            
            start_time = float(time[left_idx])
            end_time = float(time[right_idx])
            
            rise_time = peak_time - start_time
            decay_time = end_time - peak_time
            duration = end_time - start_time
            
            burst_class = classify_burst(peak_flux, baseline)
            
            detected_bursts.append({
                "id": i + 1,
                "peak_time": peak_time,
                "peak_flux": round(peak_flux, 2),
                "rise_time": round(rise_time, 2),
                "decay_time": round(decay_time, 2),
                "duration": round(duration, 2),
                "classification": burst_class
            })
        except Exception:
            continue

    # Downsample time-series for frontend performance if too large
    # Let's say max 3000 points
    max_points = 3000
    if len(time) > max_points:
        step = len(time) // max_points
        plot_time = time[::step]
        plot_rate = rate[::step]
    else:
        plot_time = time
        plot_rate = rate
        
    return {
        "plot_data": {
            "time": plot_time.tolist(),
            "rate": plot_rate.tolist()
        },
        "bursts": detected_bursts,
        "summary": {
            "total_bursts": len(detected_bursts),
            "max_flux": round(float(np.max(rate)), 2)
        }
    }
