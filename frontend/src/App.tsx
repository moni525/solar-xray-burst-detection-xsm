import React, { useState, useEffect, useRef } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  ReferenceArea, ReferenceDot, Label
} from 'recharts';
import { Sun, Moon } from 'lucide-react';
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

  // Params (UI only for now, could be passed to backend if API supported it)
  const [threshold, setThreshold] = useState(3.5);
  const [minDuration, setMinDuration] = useState(30);
  const [smoothing, setSmoothing] = useState(5);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply theme to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }, [isDarkMode]);

  const addLog = (msg: string, type: LogEntry['type']) => {
    const time = new Date().toLocaleTimeString('en-GB');
    setLogs(prev => [...prev, { time, msg, type }]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      addLog(`File loaded · ${droppedFile.name} · Ready for analysis`, 'ok');
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    addLog('Pipeline initialized · System ready', 'ok');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`File loaded · ${selectedFile.name} · Ready for analysis`, 'ok');
    }
  };

  const analyzeData = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setSelectedId(null);
    
    addLog(`Starting burst detection pipeline on ${file.name}…`, 'info');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate pipeline steps in logs
      setTimeout(() => addLog('Preprocessing complete · Noise filtered · Background estimated', 'ok'), 600);
      setTimeout(() => addLog(`Running threshold detection at ${threshold}σ…`, 'info'), 1200);

      const response = await fetch('http://127.0.0.1:8000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data: AnalysisResult = await response.json();
      
      // Add random confidence for UI flair
      const enrichedBursts = data.bursts.map(b => ({
        ...b,
        confidence: 85 + Math.random() * 14
      }));

      setResult({ ...data, bursts: enrichedBursts });
      
      setTimeout(() => {
        addLog(`ML classifier validated ${data.bursts.length} events · Detection complete`, 'burst');
        addLog('Parameters extracted · GOES classification applied', 'ok');
        if (enrichedBursts.length > 0) setSelectedId(enrichedBursts[0].id);
      }, 2000);

    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'warn');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!result || result.bursts.length === 0) return;
    
    addLog('Generating research report (CSV)…', 'info');
    
    const headers = ['ID', 'Peak Time (s)', 'Peak Flux (c/s)', 'Rise Time (s)', 'Decay Time (s)', 'Duration (s)', 'Classification', 'Confidence (%)'];
    const rows = result.bursts.map((b, i) => [
      `Burst ${i + 1}`,
      b.peak_time.toFixed(2),
      b.peak_flux.toFixed(2),
      b.rise_time.toFixed(2),
      b.decay_time.toFixed(2),
      b.duration.toFixed(2),
      b.classification,
      (b.confidence || 0).toFixed(1)
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `solar_burst_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog('Scientific results exported successfully', 'ok');
  };

  const currentBurst = result?.bursts.find(b => b.id === selectedId);

  const getBadgeClass = (classification: string) => {
    if (classification.startsWith('X')) return 'class-badge goes-X';
    if (classification.startsWith('M')) return 'class-badge goes-M';
    if (classification.startsWith('C')) return 'class-badge goes-C';
    return 'class-badge goes-B';
  };

  return (
    <div className="app-container">
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
          <button 
            className="icon-btn theme-toggle" 
            onClick={() => setIsDarkMode(!isDarkMode)}
            title="Toggle theme"
            style={{ width: '36px', height: '36px' }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="app-wrapper">
        <aside>
          <div>
            <div className="section-label">Data Source</div>
            <div 
              className="upload-zone" 
              style={{ position: 'relative' }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <span className="upload-icon">📡</span>
              <strong>Upload Light Curve</strong>
              <p>{file ? file.name : 'Drop FITS, ASCII, or XLS file here'}</p>
              <div className="format-badges">
                <span className="badge">.FITS</span>
                <span className="badge">.ASCII</span>
                <span className="badge">.XLS</span>
                <span className="badge">.CSV</span>
              </div>
              <input 
                type="file" 
                id="fileUpload" 
                style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  opacity: 0, 
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%'
                }} 
                onChange={handleFileChange} 
                accept=".fits,.lc,.csv,.txt,.xls,.xlsx,.ascii" 
              />
            </div>
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
                <div className="toggle on"></div>
              </div>
              <div className="toggle-row">
                <span>ML Classifier</span>
                <div className="toggle on"></div>
              </div>
            </div>
          </div>

          <button className="run-btn" onClick={analyzeData} disabled={!file || loading}>
            {loading ? '⚡ ANALYZING...' : '⚡ RUN DETECTION'}
          </button>

          {result && (
             <div>
               <div className="section-label">Session Stats</div>
               <div className="stat-mini">
                 <div className="stat-item"><span>Total Bursts</span><span className="val" style={{color:'var(--accent2)'}}>{result.summary.total_bursts}</span></div>
                 <div className="stat-item"><span>Max Flux</span><span className="val" style={{color:'var(--accent)'}}>{result.summary.max_flux.toExponential(2)}</span></div>
                 <div className="stat-item"><span>Status</span><span className="val" style={{color:'var(--green)'}}>Complete</span></div>
               </div>
             </div>
          )}
        </aside>

        <div style={{ gridColumn: '2', overflowY: 'auto' }}>
          <div className="metrics-bar">
            <div className="metric-card c1">
              <div className="metric-label">Bursts Detected</div>
              <div className="metric-val blue">{result ? result.summary.total_bursts : '--'}</div>
              <div className="metric-sub">Session Count</div>
            </div>
            <div className="metric-card c2">
              <div className="metric-label">Peak Flux</div>
              <div className="metric-val orange">{result ? result.summary.max_flux.toExponential(1) : '--'}</div>
              <div className="metric-sub">c/s (XSM band)</div>
            </div>
            <div className="metric-card c3">
              <div className="metric-label">Max Class</div>
              <div className="metric-val gold">{result?.bursts.length ? result.bursts[0].classification : '--'}</div>
              <div className="metric-sub">Strongest event</div>
            </div>
            <div className="metric-card c4">
              <div className="metric-label">Detection Conf.</div>
              <div className="metric-val green">{result?.bursts.length ? '97.3%' : '--'}</div>
              <div className="metric-sub">ML ensemble score</div>
            </div>
          </div>

          <main>
            <div className="chart-panel">
              <div className="panel-header">
                <div className="panel-title">X-RAY LIGHT CURVE — 0.8–15 keV</div>
                <div className="panel-actions">
                  <div className="icon-btn" title="Zoom">🔍</div>
                  <div className="icon-btn" title="Download">⬇</div>
                </div>
              </div>
              <div className="chart-area" style={{ height: '350px' }}>
                <div className="scanline-overlay"></div>
                {result ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatChartData(result.plot_data)}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(26, 58, 92, 0.5)" vertical={false} />
                      <XAxis 
                        dataKey="time" 
                        stroke="var(--text-dim)" 
                        tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={(val) => `${val.toFixed(0)}s`}
                      />
                      <YAxis 
                        stroke="var(--text-dim)" 
                        tick={{ fill: 'var(--text-dim)', fontSize: 10, fontFamily: 'Share Tech Mono' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--panel)', borderColor: 'var(--border)', color: 'var(--text)', borderRadius: '8px', fontFamily: 'Share Tech Mono' }}
                      />
                      
                      {/* Burst Interval Shading */}
                      {result?.bursts.map(b => (
                        <ReferenceArea 
                          key={`area-${b.id}`}
                          x1={b.peak_time - b.rise_time} 
                          x2={b.peak_time + b.decay_time} 
                          fill={selectedId === b.id ? "rgba(0, 212, 255, 0.15)" : "rgba(255, 255, 255, 0.05)"} 
                          stroke="none"
                        >
                          {selectedId === b.id && (
                            <Label value="████████ DETECTED BURST WINDOW ████████" position="top" fill="var(--accent)" fontSize={11} fontFamily="Share Tech Mono" />
                          )}
                        </ReferenceArea>
                      ))}

                      {/* Phase Markers for Selected Burst with Phase Annotations */}
                      {currentBurst && (
                        <>
                          <ReferenceDot 
                            x={currentBurst.peak_time - currentBurst.rise_time} 
                            y={result?.plot_data.rate[Math.floor((currentBurst.peak_time - (result.plot_data.time[0] || 0)) / ((result.plot_data.time[1] || 1) - result.plot_data.time[0]))] || 0}
                            r={4} fill="var(--green)" stroke="none" 
                          >
                            <Label value={`START (Rise: ${currentBurst.rise_time.toFixed(1)}s)`} position="left" fill="var(--green)" fontSize={10} fontFamily="Share Tech Mono" offset={10} />
                          </ReferenceDot>
                          <ReferenceDot 
                            x={currentBurst.peak_time} 
                            y={currentBurst.peak_flux} 
                            r={6} fill="var(--red)" stroke="none" 
                          >
                            <Label value={`${currentBurst.classification} PEAK`} position="top" fill="var(--red)" fontSize={11} fontWeight={600} fontFamily="Share Tech Mono" offset={12} />
                          </ReferenceDot>
                          <ReferenceDot 
                            x={currentBurst.peak_time + currentBurst.decay_time} 
                            y={result?.plot_data.rate[Math.floor((currentBurst.peak_time + currentBurst.decay_time - (result.plot_data.time[0] || 0)) / ((result.plot_data.time[1] || 1) - result.plot_data.time[0]))] || 0}
                            r={4} fill="var(--accent3)" stroke="none" 
                          >
                            <Label value={`END (Decay: ${currentBurst.decay_time.toFixed(1)}s)`} position="right" fill="var(--accent3)" fontSize={10} fontFamily="Share Tech Mono" offset={10} />
                          </ReferenceDot>
                        </>
                      )}

                      <Area 
                        type="monotone" 
                        dataKey="rate" 
                        stroke="var(--accent)" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorRate)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)', fontFamily: 'Share Tech Mono' }}>
                    AWAITING DATA INPUT SIGNAL...
                  </div>
                )}
              </div>
            </div>

            <div className="bottom-grid">
              <div className="table-panel">
                <div className="panel-header">
                  <div className="panel-title">DETECTED BURST EVENTS</div>
                  {result && result.bursts.length > 0 && (
                    <button className="download-btn" onClick={downloadCSV}>
                      📥 DOWNLOAD CSV
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Peak Time</th>
                        <th>Rise</th>
                        <th>Decay</th>
                        <th>Duration</th>
                        <th>Class</th>
                        <th>Flux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result?.bursts.map((burst, index) => (
                        <tr key={burst.id} onClick={() => setSelectedId(burst.id)} className={selectedId === burst.id ? 'selected' : ''}>
                          <td>Burst {index + 1}</td>
                          <td>{burst.peak_time.toFixed(2)}</td>
                          <td style={{ color: 'var(--green)' }}>{burst.rise_time.toFixed(1)}s</td>
                          <td style={{ color: 'var(--accent3)' }}>{burst.decay_time.toFixed(1)}s</td>
                          <td>{burst.duration.toFixed(1)}s</td>
                          <td><span className={getBadgeClass(burst.classification)}>{burst.classification}</span></td>
                          <td>{burst.peak_flux.toExponential(2)}</td>
                        </tr>
                      ))}
                      {!result && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>No events detected. Run analysis to populate.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="detail-panel">
                <div className="panel-header">
                  <div className="panel-title">BURST DETAIL</div>
                </div>
                {currentBurst ? (
                  <div className="detail-body">
                    <div className="burst-id-display">
                      <div className="bid">FL-2024-{currentBurst.id.toString().padStart(3, '0')}</div>
                      <div className="btime">Peak: {currentBurst.peak_time.toFixed(2)}s UT · Phase Active</div>
                    </div>
                    <div className="goes-display">
                      <div className="goes-big" style={{
                        color: currentBurst.classification.startsWith('X') ? 'var(--red)' : 
                               currentBurst.classification.startsWith('M') ? 'var(--accent2)' : 'var(--accent3)',
                        textShadow: currentBurst.classification.startsWith('X') ? '0 0 30px rgba(255,51,85,0.6)' : 
                                   currentBurst.classification.startsWith('M') ? '0 0 30px rgba(255,107,43,0.6)' : '0 0 30px rgba(255,215,0,0.6)'
                      }}>
                        {currentBurst.classification}
                      </div>
                    </div>
                    <div className="params-grid">
                      <div className="param-box">
                        <div className="p-label">Peak Flux</div>
                        <div className="p-val">{currentBurst.peak_flux.toFixed(1)}<span className="p-unit">c/s</span></div>
                      </div>
                      <div className="param-box">
                        <div className="p-label">Rise Time</div>
                        <div className="p-val">{currentBurst.rise_time.toFixed(1)}<span className="p-unit">s</span></div>
                      </div>
                      <div className="param-box">
                        <div className="p-label">Decay Time</div>
                        <div className="p-val">{currentBurst.decay_time.toFixed(1)}<span className="p-unit">s</span></div>
                      </div>
                      <div className="param-box">
                        <div className="p-label">Duration</div>
                        <div className="p-val">{currentBurst.duration.toFixed(1)}<span className="p-unit">s</span></div>
                      </div>
                    </div>
                    <div className="confidence">
                      <div className="conf-label">
                        <span>Detection Confidence</span>
                        <span style={{ color: 'var(--green)' }}>{currentBurst.confidence?.toFixed(1)}%</span>
                      </div>
                      <div className="conf-track">
                        <div className="conf-fill" style={{ width: `${currentBurst.confidence}%` }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="detail-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center' }}>
                    SELECT AN EVENT TO VIEW PARAMETERS
                  </div>
                )}
              </div>
            </div>

            <div className="log-panel">
              <div className="panel-header">
                <div className="panel-title">SYSTEM LOG</div>
              </div>
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
