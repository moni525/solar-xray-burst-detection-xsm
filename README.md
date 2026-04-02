# HelioTrack: Solar X-ray Burst Identification

HelioTrack is an automated system for detecting and classifying solar X-ray bursts using Chandrayaan-2 Solar X-ray Monitor (XSM) light-curve data from the ISRO PRADAN archive. The system performs burst detection from time-series signals, extracts burst parameters, and classifies burst severity with an interactive visualization dashboard.

---

## Problem Statement

Solar X-ray bursts exhibit rapid rise and slow decay patterns in light-curve data. Manual detection is time-consuming and error-prone. This project provides an automated pipeline for:

- Detecting burst events
- Extracting burst parameters
- Classifying burst intensity
- Visualizing solar activity interactively

---

## Dataset Source

Dataset: Chandrayaan-2 Solar X-ray Monitor (XSM) Level-2 Light Curve Data
Source: Indian Space Research Organisation PRADAN Archive
File Path: frontend/ch2_xsm_20260315_v1_level2.lc
Energy Band: 0.8 – 15 keV
Format: Level-2 calibrated light curve (.lc)

Supported formats:

- `.lc`
- `.fits`
- `.csv`
- `.ascii`
- `.xls`

---

## Features

- Automated solar X-ray burst detection
- Peak flux identification
- Burst start and end detection
- Burst duration estimation
- Severity classification (e.g., X-Class)
- Background subtraction option
- Adjustable smoothing window
- Interactive visualization dashboard
- Support for multiple scientific data formats

---

## System Architecture

Frontend:
React + Vite + TypeScript

Backend:
FastAPI + Python signal processing

Visualization:
Interactive solar X-ray light-curve plotting

---

## Burst Parameters Extracted

The system automatically computes:

- Peak flux
- Burst duration
- Burst start time
- Burst end time
- Detection confidence
- Event classification

---
## Project Structure

```
solar-xray-burst-detection-xsm/
│
├── backend/
│   ├── main.py
│   ├── processor.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## Installation & Setup

### Backend (FastAPI)

Run:
cd backend
pip install -r requirements.txt
python main.py

Backend runs on:
http://localhost:8000

---

### Frontend (React + Vite)

Run:
cd frontend
npm install
npm run dev


Frontend runs on:
http://localhost:5173
---

## Visualization

The dashboard provides:

- Interactive solar X-ray light-curve plotting
- Burst detection markers
- Adjustable detection threshold
- Smoothing controls
- Background subtraction toggle
- ML classification toggle
- Burst statistics panel

---

## Detection Methodology

Burst detection is performed using time-series signal processing:

1. Background subtraction
2. Noise smoothing
3. Threshold-based peak detection
4. Burst boundary identification
5. Parameter extraction
6. Severity classification

---

## Applications

- Space weather monitoring
- Solar activity analysis
- Scientific research automation
- Satellite instrumentation analytics
- Astroinformatics workflows

---

## Future Improvements

- Real-time burst monitoring
- Deep learning-based classification
- Multi-band solar flare analysis
- Web deployment support

---

## Authors

Developed as part of the Neural Nexus AI/ML Hackathon submission using ISRO PRADAN solar X-ray data.
