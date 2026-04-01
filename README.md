# HelioTrack: Solar X-ray Burst Identification

This project automates the detection and classification of Solar X-ray bursts using ISRO PRADAN data.

## Quick Start (Automatic)

The development environment is pre-configured and already running in this workspace. 

### 1. Backend (FastAPI)
Running on `http://localhost:8000`. 
If you need to restart it manually, use:
```powershell
backend\venv\Scripts\python.exe backend\main.py
```

### 2. Frontend (Vite + React)
Running on `http://localhost:5173` (or `5174`).
If you need to restart it manually, use:
```bash
cd frontend
npm run dev
```

## Troubleshooting

- **"Failed to fetch" Error**: This usually means the backend server is not running or the URL in `App.tsx` (default `localhost:8000`) is blocked. Ensure the backend is started using the command above.
- **"ModuleNotFoundError: No module named 'scipy'"**: This happens if you run `python main.py` without the virtual environment. Always use the path `backend\venv\Scripts\python.exe` or activate the environment first.

## Data Formats

- **.fits / .lc**: Standard ISRO Chandrayaan-2/XSM format.
- **.csv / .txt**: Should contain columns with "time" and "rate" (or "counts") in the header. (Try the `backend\sample_data.csv` for a demonstration).
