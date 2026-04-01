import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Dict

app = FastAPI()

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
    uvicorn.run(app, host="0.0.0.0", port=8000)
