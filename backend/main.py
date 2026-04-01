<<<<<<< HEAD
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Dict

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
=======
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from processor import analyze_light_curve

app = FastAPI(title="Solar X-ray Burst API")

# Setup CORS to allow React Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
>>>>>>> 14d73ff (Initialize SolarXray Dashboard with Research-Grade UI and Analytics Features)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    # Dummy implementation: return static data structure expected by frontend
    plot_data = {
        "time": [0, 10, 20, 30, 40, 50],
        "rate": [0, 5, 15, 10, 20, 5]
    }
    bursts = [
        {
            "id": 1,
            "peak_time": 25,
            "peak_flux": 20.5,
            "rise_time": 5,
            "decay_time": 5,
            "duration": 10,
            "classification": "M1.0",
            "confidence": 92
        }
    ]
    summary = {
        "total_bursts": len(bursts),
        "max_flux": max(b['peak_flux'] for b in bursts) if bursts else 0
    }
    return JSONResponse(content={"plot_data": plot_data, "bursts": bursts, "summary": summary})

if __name__ == "__main__":
=======
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Solar X-ray Burst API is running"}

@app.post("/api/analyze")
async def extract_bursts(file: UploadFile = File(...)):
    """
    Endpoint to upload a FITS or ASCII file, parse it, identify bursts, and returning 
    downsampled chart data + extracted parameters.
    """
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        results = analyze_light_curve(file_path)
    except Exception as e:
        return {"error": str(e)}
    finally:
        # Cleanup uploaded file if desired
        if os.path.exists(file_path):
            os.remove(file_path)
            
    return results

if __name__ == "__main__":
    import uvicorn
>>>>>>> 14d73ff (Initialize SolarXray Dashboard with Research-Grade UI and Analytics Features)
    uvicorn.run(app, host="0.0.0.0", port=8000)
