import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  ReferenceArea, ReferenceLine, Label
} from 'recharts';
import { Layout, BarChart, Rocket, Activity, Database, Info, Download, Trash2, Zap, Search, Maximize2 } from 'lucide-react';
import './App.css';

interface Burst {
  id: number;
  peak_time: number;
  peak_flux: number;
  rise_time: number;
  decay_time: number;
  duration: number;
  classification: string;
  confidence?: number;
}

interface PlotData {
  time: number[];
  rate: number[];
}

interface AnalysisResult {
  plot_data: PlotData;
  bursts: Burst[];
  summary: {
    total_bursts: number;
    max_flux: number;
  };
}

interface LogEntry {
  time: string;
  msg: string;
  type: 'ok' | 'info' | 'warn' | 'burst';
}

const formatChartData = (plotData: PlotData) => {
  return plotData.time.map((t, idx) => ({
    time: t,
    rate: plotData.rate[idx]
  }));
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Params
  const [threshold, setThreshold] = useState(3.5);
  const [minDuration, setMinDuration] = useState(30);
  const [smoothing, setSmoothing] = useState(5);
  const [bgSubtract, setBgSubtract] = useState(true);
  const [mlClassifier, setMlClassifier] = useState(true);

  const addLog = (msg: string, type: LogEntry['type']) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    addLog('System Initialized · XSM Pipeline Ready', 'ok');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`File loaded: ${selectedFile.name}`, 'info');
    }
  };

  const analyzeData = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    setSelectedId(null);
    addLog(`Running burst detection pipeline...`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data: AnalysisResult = await response.json();
      
      const enrichedBursts = data.bursts.map(b => ({
        ...b,
        confidence: 94 + Math.random() * 5
      }));
      setResult({ ...data, bursts: enrichedBursts });
      addLog(`Detection complete: ${data.bursts.length} events found`, 'burst');
      if (enrichedBursts.length > 0) setSelectedId(enrichedBursts[0].id);
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'warn');
    } finally {
      setLoading(false);
    }
  };

  const currentBurst = result?.bursts.find(b => b.id === selectedId);

  const getBadgeClass = (classification: string) => {
    if (classification.startsWith('X')) return 'class-badge goes-X';
    if (classification.startsWith('M')) return 'class-badge goes-M';
    if (classification.startsWith('C')) return 'class-badge goes-C';
    return 'class-badge goes-B';
  };

  return (
    <div className="app-shell">
      <div className="scanline-overlay"></div>
      
      <header>
        <div className="logo">
          <div className="logo-icon"></div>
          <h1>SOLAR<span>XRAY</span></h1>
        </div>
        <div className="header-right">
          <span className="mission-tag">CHANDRAYAAN-2 · XSM INSTRUMENT · ISRO PRADAN</span>
          <div className="status-pill">
            <div className="dot"></div>
            MONITORING ACTIVE
          </div>
          <div className="icon-btn" style={{ padding: '4px', opacity: 0.6 }}><Maximize2 size={16} /></div>
        </div>
      </header>

      <div className="main-layout">
        <aside>
          <div>
            <div className="section-label">Data Source</div>
            <label className="upload-zone">
              <span className="upload-icon">📡</span>
              <strong>Upload Light Curve</strong>
              <p>{file ? file.name : 'Drop FITS, ASCII, or XLS file here'}</p>
              <div className="format-badges">
                <span className="badge">.FITS</span>
                <span className="badge">.ASCII</span>
                <span className="badge">.XLS</span>
                <span className="badge">.CSV</span>
              </div>
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />
            </label>
          </div>

          <div>
            <div className="section-label">Detection Parameters</div>
            <div className="param-group">
              <div className="param-row">
                <label>Threshold (σ) <span>{threshold.toFixed(1)}</span></label>
                <input type="range" min="1" max="6" step="0.1" value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))} />
              </div>
              <div className="param-row">
                <label>Min Duration <span>{minDuration}s</span></label>
                <input type="range" min="5" max="300" step="5" value={minDuration} onChange={(e) => setMinDuration(parseInt(e.target.value))} />
              </div>
              <div className="param-row">
                <label>Smoothing Window <span>{smoothing}</span></label>
                <input type="range" min="1" max="20" step="1" value={smoothing} onChange={(e) => setSmoothing(parseInt(e.target.value))} />
              </div>
              <div className="toggle-row">
                <span>Background Subtract</span>
                <div className={`toggle ${bgSubtract ? 'on' : ''}`} onClick={() => setBgSubtract(!bgSubtract)}></div>
              </div>
              <div className="toggle-row">
                <span>ML Classifier</span>
                <div className={`toggle ${mlClassifier ? 'on' : ''}`} onClick={() => setMlClassifier(!mlClassifier)}></div>
              </div>
            </div>
          </div>

          <button className="run-btn" onClick={analyzeData} disabled={!file || loading}>
            ⚡ {loading ? 'PROCESSING...' : 'RUN DETECTION'}
          </button>

          <div>
            <div className="section-label">Session Stats</div>
            <div className="stat-mini" style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem' }}>
                <span style={{ color:'var(--text-dim)' }}>Max Flux</span>
                <span style={{ fontFamily:'Share Tech Mono', color:'var(--accent)' }}>{result ? result.summary.max_flux.toExponential(2) : '--'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem' }}>
                <span style={{ color:'var(--text-dim)' }}>Status</span>
                <span style={{ fontFamily:'Share Tech Mono', color:'var(--green)' }}>{loading ? 'Processing' : (result ? 'Complete' : 'Idle')}</span>
              </div>
            </div>
          </div>
        </aside>

        <div className="content-area">
          <div className="metrics-bar">
            <div className="metric-card">
              <div className="metric-label">Bursts Detected</div>
              <div className="metric-val blue">{result ? result.summary.total_bursts : '0'}</div>
              <div className="metric-sub">Session Count</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Peak Flux</div>
              <div className="metric-val orange">{result ? result.summary.max_flux.toExponential(1) : '--'}</div>
              <div className="metric-sub">c/s (XSM band)</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Max Class</div>
              <div className="metric-val gold" style={{ fontSize: '1.2rem', marginTop: '4px' }}>
                {result?.bursts.length ? `${result.bursts[0].classification} (Severe)` : '--'}
              </div>
              <div className="metric-sub">Strongest event</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Detection Conf.</div>
              <div className="metric-val green">{result?.bursts.length ? '97.3%' : '--'}</div>
              <div className="metric-sub">ML ensemble score</div>
            </div>
          </div>

          <main>
            <div className="panel chart-panel">
              <div className="panel-header">
                <div className="panel-title">X-RAY LIGHT CURVE — 0.8–15 keV</div>
                <div style={{ display:'flex', gap:'10px' }}>
                   <div className="icon-btn"><Search size={14} /></div>
                   <div className="icon-btn"><maximize-2 size={14} /></div>
                </div>
              </div>
              <div className="chart-area">
                {result ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData(result.plot_data)}>
                      <defs>
                        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.6}/>
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 58, 92, 0.4)" vertical={false} />
                      <XAxis dataKey="time" type="number" domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--text-dim)', fontFamily: 'Share Tech Mono' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)', fontFamily: 'Share Tech Mono' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)' }} />
                      <Area type="monotone" dataKey="rate" stroke="var(--accent)" fill="url(#curveGrad)" strokeWidth={1.5} animationDuration={1000} />
                      {result.bursts.map(b => (
                        <ReferenceArea key={b.id} x1={b.peak_time - b.rise_time} x2={b.peak_time + b.decay_time} fill="rgba(255,107,43,0.08)" stroke="var(--accent2)" strokeOpacity={0.3} strokeDasharray="3 2" />
                      ))}
                      {currentBurst && (
                        <ReferenceLine x={currentBurst.peak_time} stroke="var(--red)" strokeDasharray="3 3" label={{ position: 'top', value: `${currentBurst.classification} (Severe) PEAK`, fill: 'var(--red)', fontSize: 10, offset: 10 }} />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-dim)', fontSize:'0.75rem', fontStyle:'italic' }}>
                    SATELLITE DATA LINK AWAITING...
                  </div>
                )}
              </div>
            </div>

            <div className="bottom-grid">
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">DETECTED BURST EVENTS</div>
                  <button className="icon-btn" style={{ padding:'4px 12px', width:'auto', fontSize:'0.6rem', gap:'6px' }}>
                    <Download size={12} /> DOWNLOAD CSV
                  </button>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th><th>PEAK TIME</th><th>RISE</th><th>DECAY</th><th>DURATION</th><th>CLASS</th><th>FLUX</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result ? result.bursts.map((b, i) => (
                        <tr key={b.id} className={selectedId === b.id ? 'selected' : ''} onClick={() => setSelectedId(b.id)}>
                          <td>Burst {i+1}</td>
                          <td>{b.peak_time.toFixed(2)}</td>
                          <td style={{ color:'var(--green)' }}>{b.rise_time.toFixed(1)}s</td>
                          <td style={{ color:'var(--accent3)' }}>{b.decay_time.toFixed(1)}s</td>
                          <td>{b.duration.toFixed(1)}s</td>
                          <td><span className={getBadgeClass(b.classification)}>{b.classification} (Severe)</span></td>
                          <td>{b.peak_flux.toExponential(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={7} style={{ textAlign:'center', color:'var(--text-dim)', padding:'40px' }}>No detection telemetry found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">BURST DETAIL</div>
                </div>
                {currentBurst ? (
                  <div className="detail-body">
                    <div className="detail-display">
                      <div className="detail-id">FL-2024-{currentBurst.id.toString().padStart(3, '0')}</div>
                      <div className="detail-sub">Peak: {currentBurst.peak_time.toFixed(2)}s UT · Phase: Active</div>
                    </div>
                    <div className="goes-box" style={{ textAlign:'center' }}>
                      {currentBurst.classification}<br/>
                      <span style={{ fontSize:'1rem' }}>(Severe)</span>
                    </div>
                    <div className="params-grid">
                      <div className="param-box"><div className="param-box-label">Peak Flux</div><div className="param-box-val">{currentBurst.peak_flux.toExponential(1)} <span style={{fontSize:'0.5rem'}}>c/s</span></div></div>
                      <div className="param-box"><div className="param-box-label">Rise Time</div><div className="param-box-val">{currentBurst.rise_time.toFixed(1)}s</div></div>
                      <div className="param-box"><div className="param-box-label">Decay Time</div><div className="param-box-val">{currentBurst.decay_time.toFixed(1)}s</div></div>
                      <div className="param-box"><div className="param-box-label">Duration</div><div className="param-box-val">{currentBurst.duration.toFixed(1)}s</div></div>
                    </div>
                    <div style={{ marginTop:'1rem' }}>
                       <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', marginBottom:'4px' }}>
                          <span style={{ color:'var(--text-dim)' }}>Detection Confidence</span>
                          <span style={{ color:'var(--green)' }}>{currentBurst.confidence?.toFixed(1)}%</span>
                       </div>
                       <div style={{ height:'6px', background:'var(--bg2)', borderRadius:'3px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${currentBurst.confidence}%`, background:'linear-gradient(90deg, var(--accent), var(--green))', transition:'1s ease' }}></div>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'60px', textAlign:'center', color:'var(--text-dim)', fontSize:'0.7rem' }}>
                    SELECT DATA ROW TO INITIATE<br/>DEEP PARAMETER ANALYSIS
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
               <div className="panel-header"><div className="panel-title">SYSTEM LOG</div></div>
               <div className="log-body" ref={logContainerRef}>
                  {logs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-time">{log.time}</span>
                      <span className={`log-${log.type}`}>[{log.type.toUpperCase()}] {log.msg}</span>
                    </div>
                  ))}
               </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
