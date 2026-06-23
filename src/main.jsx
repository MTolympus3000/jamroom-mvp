import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Mic, Play, Square, Trash2, Copy, Music2, Drum, Piano, Save, Download, Upload, FolderOpen, RotateCcw } from 'lucide-react';
import './styles.css';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
const OCTAVE_ROWS = ['C5','B4','A4','G4','F4','E4','D4','C4','B3','A3','G3','F3','E3','D3','C3'];
const DRUMS = ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Perc'];
const PROJECT_STORAGE_KEY = 'jamroom.mvp.project.v1';
const AUTOSAVE_STORAGE_KEY = 'jamroom.mvp.autosave.v1';

const chordModes = {
  diatonic7: {
    label: 'Diatonic 7ths',
    qualities: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'],
    intervals: {
      maj7: [0, 4, 7, 11],
      m7: [0, 3, 7, 10],
      '7': [0, 4, 7, 10],
      m7b5: [0, 3, 6, 10]
    }
  },
  major7All: {
    label: 'Every root = Major 7',
    qualities: ['maj7','maj7','maj7','maj7','maj7','maj7','maj7'],
    intervals: { maj7: [0, 4, 7, 11] }
  },
  minor7All: {
    label: 'Every root = Minor 7',
    qualities: ['m7','m7','m7','m7','m7','m7','m7'],
    intervals: { m7: [0, 3, 7, 10] }
  }
};

function midiToNote(midi) {
  return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}
function noteToMidi(note) {
  const match = note.match(/^([A-G]#?)(-?\d)$/);
  if (!match) return 60;
  return NOTE_NAMES.indexOf(match[1]) + (Number(match[2]) + 1) * 12;
}
function hz(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }
function makeScale(key) {
  const root = NOTE_NAMES.indexOf(key);
  return MAJOR_SCALE.map(i => (root + i) % 12);
}
function noteName(pc) { return NOTE_NAMES[((pc % 12) + 12) % 12]; }

function playToneSequence(notes, bpm, audioCtxRef) {
  const ctx = audioCtxRef.current || new AudioContext();
  audioCtxRef.current = ctx;
  const now = ctx.currentTime;
  notes.forEach((note, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz(note.midi);
    gain.gain.setValueAtTime(0.0001, now + index * 0.01);
    gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.01 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 60 / bpm * note.durationBeats);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + index * 0.01);
    osc.stop(now + 60 / bpm * note.durationBeats + 0.05);
  });
}

function App() {
  const [project, setProject] = useState({ title: 'Florida Melody Idea', bpm: 90, bars: 8, key: 'C', chordMode: 'diatonic7' });
  const [layers, setLayers] = useState([]);
  const [notes, setNotes] = useState([]);
  const [drums, setDrums] = useState(() => DRUMS.flatMap(d => Array.from({ length: 32 }, (_, step) => ({ drum: d, step, on: false }))));
  const [selectedTool, setSelectedTool] = useState('chords');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const chunksRef = useRef([]);
  const audioCtxRef = useRef(null);
  const projectFileRef = useRef(null);
  const [lastSaved, setLastSaved] = useState('');

  const scale = useMemo(() => makeScale(project.key), [project.key]);
  const stepCount = project.bars * 4;


  function makeProjectSnapshot() {
    return {
      app: 'JamRoom MVP',
      version: 1,
      savedAt: new Date().toISOString(),
      project,
      notes,
      drums,
      // Browser-recorded blob URLs cannot be restored after a refresh,
      // so we save lightweight layer labels only for now.
      layers: layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        muted: layer.muted,
        volume: layer.volume
      }))
    };
  }

  function applyProjectSnapshot(data) {
    if (!data || data.app !== 'JamRoom MVP') {
      alert('This is not a JamRoom MVP project file.');
      return;
    }

    const nextProject = {
      title: data.project?.title || 'Untitled Jam',
      bpm: Number(data.project?.bpm || 90),
      bars: Number(data.project?.bars || 8),
      key: data.project?.key || 'C',
      chordMode: data.project?.chordMode || 'diatonic7'
    };

    const totalSteps = nextProject.bars * 4;
    setProject(nextProject);
    setNotes((data.notes || []).filter(n => Number.isFinite(n.startBeat)).map(n => ({
      ...n,
      id: n.id || crypto.randomUUID(),
      startBeat: Math.max(0, Math.min(totalSteps - 1, Number(n.startBeat || 0))),
      durationBeats: Math.max(0.25, Number(n.durationBeats || 1)),
      velocity: Number(n.velocity || 90)
    })));

    const incomingDrums = Array.isArray(data.drums) ? data.drums : [];
    setDrums(DRUMS.flatMap(drum =>
      Array.from({ length: totalSteps }, (_, step) => {
        const saved = incomingDrums.find(c => c.drum === drum && Number(c.step) === step);
        return { drum, step, on: Boolean(saved?.on) };
      })
    ));

    setLayers([]);
    setSelectedTool('drums');
  }

  function saveProject() {
    try {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(makeProjectSnapshot()));
      const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setLastSaved(time);
      alert('Project saved on this device.');
    } catch (error) {
      console.error(error);
      alert('Save failed. Try Export JSON instead.');
    }
  }

  function loadProject() {
    try {
      const raw = localStorage.getItem(PROJECT_STORAGE_KEY) || localStorage.getItem(AUTOSAVE_STORAGE_KEY);
      if (!raw) {
        alert('No saved project found yet.');
        return;
      }
      applyProjectSnapshot(JSON.parse(raw));
      alert('Project loaded.');
    } catch (error) {
      console.error(error);
      alert('Load failed. Saved data may be damaged.');
    }
  }

  function exportProject() {
    try {
      const blob = new Blob([JSON.stringify(makeProjectSnapshot(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jamroom-${project.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'project'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert('Export failed.');
    }
  }

  function importProjectFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        applyProjectSnapshot(data);
        localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(data));
        const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        setLastSaved(time);
        alert('Project imported.');
      } catch (error) {
        console.error(error);
        alert('Import failed. Choose a JamRoom project JSON file.');
      }
    };
    reader.readAsText(file);
  }

  function newProject() {
    if (!window.confirm('Start a new project? This clears the current notes and drums.')) return;
    setProject({ title: 'Untitled Jam', bpm: 90, bars: 8, key: 'C', chordMode: 'diatonic7' });
    setLayers([]);
    setNotes([]);
    setDrums(DRUMS.flatMap(d => Array.from({ length: 32 }, (_, step) => ({ drum: d, step, on: false }))));
    setSelectedTool('drums');
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(makeProjectSnapshot()));
      } catch (error) {
        console.warn('Autosave failed:', error);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [project, notes, drums, layers]);

  function addChord(degreeIndex) {
    const mode = chordModes[project.chordMode];
    const rootPc = scale[degreeIndex];
    const quality = mode.qualities[degreeIndex];
    const chordIntervals = mode.intervals[quality];
    const rootMidi = 60 + ((rootPc - 0 + 12) % 12);
    const startBeat = notes.length ? Math.max(...notes.map(n => n.startBeat + n.durationBeats)) : 0;
    const newNotes = chordIntervals.map((interval, i) => ({
      id: crypto.randomUUID(),
      midi: rootMidi + interval,
      startBeat: startBeat % stepCount,
      durationBeats: 1,
      velocity: 90,
      label: `${noteName(rootPc)}${quality}`,
      stack: i
    }));
    setNotes(prev => [...prev, ...newNotes]);
    playToneSequence(newNotes, project.bpm, audioCtxRef);
  }

  function moveNote(id, field, amount) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: Math.max(0, field === 'midi' ? n[field] + amount : Math.min(stepCount - 1, n[field] + amount)) } : n));
  }
  function quantizeNotes() {
    setNotes(prev => prev.map(n => ({ ...n, startBeat: Math.round(n.startBeat), durationBeats: Math.max(0.25, Math.round(n.durationBeats * 4) / 4) })));
  }
  function duplicateTwoBarsToEight() {
    const twoBarNotes = notes.filter(n => n.startBeat < 8);
    const clones = [];
    for (let offset = 8; offset < stepCount; offset += 8) {
      twoBarNotes.forEach(n => clones.push({ ...n, id: crypto.randomUUID(), startBeat: n.startBeat + offset }));
    }
    setNotes(prev => [...prev, ...clones]);
  }
  function toggleDrum(drum, step) {
    setDrums(prev => prev.map(d => d.drum === drum && d.step === step ? { ...d, on: !d.on } : d));
  }
  function duplicateDrumTwoBars() {
    setDrums(prev => prev.map(cell => {
      const sourceStep = cell.step % 8;
      const source = prev.find(c => c.drum === cell.drum && c.step === sourceStep);
      return { ...cell, on: source?.on || false };
    }));
  }
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const url = URL.createObjectURL(blob);
      setLayers(prev => [...prev, { id: crypto.randomUUID(), name: `Voice layer ${prev.length + 1}`, type: 'audio', url, muted: false, volume: 1 }]);
      stream.getTracks().forEach(t => t.stop());
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  }
  function stopRecording() { mediaRecorder?.stop(); setIsRecording(false); }

  const chordButtons = scale.map((pc, idx) => {
    const mode = chordModes[project.chordMode];
    return { root: noteName(pc), quality: mode.qualities[idx], idx };
  });

  return <div className="app">
    <header className="hero">
      <div>
        <p className="eyebrow">Collaborative loop room MVP</p>
        <input className="titleInput" value={project.title} onChange={e => setProject({ ...project, title: e.target.value })} />
        <p className="subtitle">Record voice layers, tap one-note chords, edit notes on a piano roll, and program drums.</p>
      </div>
      <button className="saveBtn" onClick={saveProject}><Save size={18}/> Save</button>
    </header>

    <section className="controls card">
      <label>BPM<input type="number" value={project.bpm} onChange={e => setProject({ ...project, bpm: Number(e.target.value) })}/></label>
      <label>Bars<input type="number" min="2" max="16" value={project.bars} onChange={e => setProject({ ...project, bars: Number(e.target.value) })}/></label>
      <label>Key<select value={project.key} onChange={e => setProject({ ...project, key: e.target.value })}>{NOTE_NAMES.filter(n => !n.includes('#')).map(n => <option key={n}>{n}</option>)}</select></label>
      <label>Chord Mode<select value={project.chordMode} onChange={e => setProject({ ...project, chordMode: e.target.value })}>{Object.entries(chordModes).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
    </section>

    <section className="projectTools card">
      <div>
        <strong>Project Save</strong>
        <small>{lastSaved ? `Last saved ${lastSaved}` : 'Autosave is on'}</small>
      </div>
      <button onClick={saveProject}><Save size={16}/> Save</button>
      <button onClick={loadProject}><FolderOpen size={16}/> Load</button>
      <button onClick={exportProject}><Download size={16}/> Export</button>
      <button onClick={() => projectFileRef.current?.click()}><Upload size={16}/> Import</button>
      <button className="dangerMini" onClick={newProject}><RotateCcw size={16}/> New</button>
      <input ref={projectFileRef} type="file" accept="application/json,.json" hidden onChange={e => { importProjectFile(e.target.files?.[0]); e.target.value = ''; }} />
    </section>

    <nav className="tabs">
      <button className={selectedTool === 'record' ? 'active' : ''} onClick={() => setSelectedTool('record')}><Mic size={17}/> Record</button>
      <button className={selectedTool === 'chords' ? 'active' : ''} onClick={() => setSelectedTool('chords')}><Piano size={17}/> Chords</button>
      <button className={selectedTool === 'piano' ? 'active' : ''} onClick={() => setSelectedTool('piano')}><Music2 size={17}/> Piano Roll</button>
      <button className={selectedTool === 'drums' ? 'active' : ''} onClick={() => setSelectedTool('drums')}><Drum size={17}/> Drums</button>
    </nav>

    {selectedTool === 'record' && <section className="card panel">
      <h2>Audio layers</h2>
      <p>Record humming, singing, guitar, or beatbox. These become stackable jam layers.</p>
      {!isRecording ? <button className="primary" onClick={startRecording}><Mic/> Start Recording</button> : <button className="danger" onClick={stopRecording}><Square/> Stop Recording</button>}
      <div className="layerList">{layers.map(layer => <div className="layer" key={layer.id}><strong>{layer.name}</strong><audio controls src={layer.url}></audio><button onClick={() => setLayers(layers.filter(l => l.id !== layer.id))}><Trash2 size={16}/></button></div>)}</div>
    </section>}

    {selectedTool === 'chords' && <section className="card panel">
      <h2>One-finger chord player</h2>
      <p>In key of {project.key}, each piano button generates a full chord.</p>
      <div className="keyboard">{chordButtons.map(c => <button key={c.idx} onClick={() => addChord(c.idx)}><span>{c.root}</span><small>{c.root}{c.quality}</small></button>)}</div>
      <div className="actions"><button onClick={() => setNotes([])}><Trash2 size={16}/> Clear notes</button><button onClick={duplicateTwoBarsToEight}><Copy size={16}/> Copy first 2 bars to full loop</button></div>
    </section>}

    {selectedTool === 'piano' && <section className="card panel">
      <h2>Piano roll editor</h2>
      <div className="actions"><button onClick={quantizeNotes}>Quantize</button><button onClick={() => playToneSequence(notes, project.bpm, audioCtxRef)}><Play size={16}/> Preview notes</button></div>
      <div className="grid pianoGrid" style={{ gridTemplateColumns: `70px repeat(${stepCount}, minmax(24px, 1fr))` }}>
        {OCTAVE_ROWS.map(row => <React.Fragment key={row}>
          <div className="rowLabel">{row}</div>
          {Array.from({ length: stepCount }, (_, step) => {
            const midi = noteToMidi(row);
            const noteHere = notes.find(n => n.midi === midi && Math.round(n.startBeat) === step);
            return <div className="cell" key={step}>{noteHere && <div className="noteBlock" title={noteHere.label} onClick={() => moveNote(noteHere.id, 'midi', 1)} onContextMenu={e => { e.preventDefault(); setNotes(notes.filter(n => n.id !== noteHere.id)); }}>{noteHere.label}</div>}</div>;
          })}
        </React.Fragment>)}
      </div>
      <p className="hint">Tap a note block to move it up. Right-click/long-press menu on desktop to delete. More drag editing comes next.</p>
    </section>}

    {selectedTool === 'drums' && <section className="card panel">
      <h2>Drum step sequencer</h2>
      <div className="actions"><button onClick={duplicateDrumTwoBars}><Copy size={16}/> Copy 2 bars across loop</button></div>
      <div className="grid drumGrid" style={{ gridTemplateColumns: `90px repeat(${stepCount}, minmax(24px, 1fr))` }}>
        {DRUMS.map(drum => <React.Fragment key={drum}>
          <div className="rowLabel">{drum}</div>
          {Array.from({ length: stepCount }, (_, step) => {
            const cell = drums.find(c => c.drum === drum && c.step === step);
            return <button className={cell?.on ? 'drumCell on' : 'drumCell'} key={step} onClick={() => toggleDrum(drum, step)}>{step % 4 === 0 ? step / 4 + 1 : ''}</button>;
          })}
        </React.Fragment>)}
      </div>
    </section>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
