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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
