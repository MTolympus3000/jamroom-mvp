import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Trash2, Copy, Upload, RotateCcw } from 'lucide-react';
import './styles.css';
import { DRUM_PADS, DEFAULT_VISIBLE_ROWS } from './data/drums';
import { getSampleName, loadSample, playPad } from './lib/drumAudio';

const STEPS_PER_BAR = 16;

function makeGrid(loopBars) {
  const steps = loopBars * STEPS_PER_BAR;
  return Object.fromEntries(DRUM_PADS.map(p => [p.id, Array(steps).fill(false)]));
}

function resizeGrid(oldGrid, loopBars) {
  const steps = loopBars * STEPS_PER_BAR;
  const next = makeGrid(loopBars);
  for (const pad of DRUM_PADS) {
    const old = oldGrid?.[pad.id] || [];
    next[pad.id] = Array.from({ length: steps }, (_, i) => Boolean(old[i]));
  }
  return next;
}

function App() {
  const [bpm, setBpm] = useState(120);
  const [loopBars, setLoopBars] = useState(2);
  const [quantizeStrength, setQuantizeStrength] = useState(100);
  const [quantizeResolution, setQuantizeResolution] = useState('1/16');
  const [swing, setSwing] = useState(50);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPad, setSelectedPad] = useState('kick');
  const [grid, setGrid] = useState(() => makeGrid(loopBars));
  const [sampleNames, setSampleNames] = useState({});
  const intervalRef = useRef(null);
  const stepRef = useRef(0);

  const totalSteps = loopBars * STEPS_PER_BAR;
  const visiblePads = useMemo(() => DRUM_PADS.filter(p => DEFAULT_VISIBLE_ROWS.includes(p.id)), []);

  useEffect(() => {
    setGrid(g => resizeGrid(g, loopBars));
    setCurrentStep(0);
    stepRef.current = 0;
  }, [loopBars]);

  useEffect(() => {
    function onKey(e) {
      const pad = DRUM_PADS.find(p => p.key.toLowerCase() === e.key.toLowerCase());
      if (pad) triggerPad(pad.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    const sixteenthMs = (60 / bpm / 4) * 1000;
    intervalRef.current = setInterval(() => {
      const step = stepRef.current;
      DRUM_PADS.forEach(p => { if (grid[p.id]?.[step]) playPad(p.id); });
      setCurrentStep(step);
      stepRef.current = (step + 1) % totalSteps;
    }, sixteenthMs);

    return () => clearInterval(intervalRef.current);
  }, [playing, bpm, grid, totalSteps]);

  function toggleStep(padId, step) {
    setGrid(g => ({
      ...g,
      [padId]: g[padId].map((hit, i) => (i === step ? !hit : hit))
    }));
  }

  function triggerPad(padId) {
    setSelectedPad(padId);
    playPad(padId);
    if (recording) {
      const target = quantizedStep(currentStep, quantizeStrength);
      setGrid(g => ({
        ...g,
        [padId]: g[padId].map((hit, i) => (i === target ? true : hit))
      }));
    }
  }

  function quantizedStep(step, strength) {
    const resolutionMap = { '1/4': 4, '1/8': 2, '1/16': 1, '1/32': 0.5 };
    const gridSize = resolutionMap[quantizeResolution] || 1;
    const nearest = Math.round(step / gridSize) * gridSize;
    const moved = step + (nearest - step) * (strength / 100);
    return Math.max(0, Math.min(totalSteps - 1, Math.round(moved)));
  }

  function stop() {
    setPlaying(false);
    setCurrentStep(0);
    stepRef.current = 0;
  }

  function clearPattern() {
    setGrid(makeGrid(loopBars));
  }

  function copyFirstBar() {
    setGrid(g => {
      const next = { ...g };
      for (const pad of DRUM_PADS) {
        const firstBar = g[pad.id].slice(0, STEPS_PER_BAR);
        next[pad.id] = Array.from({ length: totalSteps }, (_, i) => firstBar[i % STEPS_PER_BAR]);
      }
      return next;
    });
  }

  async function assignSample(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = await loadSample(selectedPad, file);
    setSampleNames(s => ({ ...s, [selectedPad]: name || getSampleName(selectedPad) }));
  }

  return <main className="app">
    <header className="hero">
      <div>
        <p className="eyebrow">JamRoom Focus Mode</p>
        <h1>Drum Machine + MIDI Sequencer</h1>
      </div>
      <div className="selected">Selected Pad: <b>{DRUM_PADS.find(p => p.id === selectedPad)?.name}</b></div>
    </header>

    <section className="transport panel">
      <button className="icon primary" onClick={() => setPlaying(true)}><Play size={18}/> Play</button>
      <button className="icon" onClick={stop}><Square size={18}/> Stop</button>
      <button className={recording ? 'icon rec active' : 'icon rec'} onClick={() => setRecording(r => !r)}><Circle size={18}/> Record Pads</button>
      <label>BPM <input type="number" min="40" max="240" value={bpm} onChange={e => setBpm(Number(e.target.value))}/></label>
      <label>Loop <select value={loopBars} onChange={e => setLoopBars(Number(e.target.value))}>{[1,2,4,8,16].map(v => <option key={v} value={v}>{v} Bars</option>)}</select></label>
      <label>Quantize <select value={quantizeResolution} onChange={e => setQuantizeResolution(e.target.value)}>{['1/4','1/8','1/16','1/32'].map(v => <option key={v}>{v}</option>)}</select></label>
      <label className="range">Strength <input type="range" min="0" max="100" value={quantizeStrength} onChange={e => setQuantizeStrength(Number(e.target.value))}/><span>{quantizeStrength}%</span></label>
      <label className="range">Swing <input type="range" min="50" max="75" value={swing} onChange={e => setSwing(Number(e.target.value))}/><span>{swing}%</span></label>
    </section>

    <section className="panel sequencerPanel">
      <div className="sectionHeader">
        <h2>MIDI Drum Sequencer</h2>
        <div className="actions">
          <button onClick={copyFirstBar}><Copy size={16}/> Copy Bar 1 to Loop</button>
          <button onClick={clearPattern}><Trash2 size={16}/> Clear</button>
        </div>
      </div>
      <div className="sequencer" style={{ gridTemplateColumns: `92px repeat(${totalSteps}, minmax(24px, 1fr))` }}>
        <div className="corner">Pad</div>
        {Array.from({ length: totalSteps }, (_, i) => <div key={i} className={i === currentStep ? 'stepNum playhead' : 'stepNum'}>{i % 4 === 0 ? i + 1 : ''}</div>)}
        {visiblePads.map(p => <React.Fragment key={p.id}>
          <button className={selectedPad === p.id ? 'rowLabel active' : 'rowLabel'} onClick={() => setSelectedPad(p.id)}>{p.name}</button>
          {Array.from({ length: totalSteps }, (_, i) => <button key={i} onClick={() => toggleStep(p.id, i)} className={grid[p.id]?.[i] ? 'step on' : 'step'} />)}
        </React.Fragment>)}
      </div>
    </section>

    <section className="panel padPanel">
      <div className="sectionHeader">
        <h2>16 Drum Pads</h2>
        <label className="sampleButton"><Upload size={16}/> Assign Sample to Selected Pad<input type="file" accept="audio/*" onChange={assignSample}/></label>
      </div>
      <div className="pads">
        {DRUM_PADS.map(p => <button key={p.id} onClick={() => triggerPad(p.id)} className={selectedPad === p.id ? 'pad active' : 'pad'}>
          <span>{p.name}</span>
          <small>{p.key} {sampleNames[p.id] ? `• ${sampleNames[p.id]}` : ''}</small>
        </button>)}
      </div>
    </section>

    <section className="panel notes">
      <h2>What this build includes</h2>
      <p>Only the drum machine and drum sequencer are included. Chords, piano roll, audio tracks, waveform timeline, and collaboration have been removed from this focused MVP.</p>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
