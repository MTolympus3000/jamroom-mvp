import React, { useMemo, useRef, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Mic, Upload, Save, Music2, Drum, SlidersHorizontal, Trash2, Copy, Plus, Download } from 'lucide-react';
import './styles.css';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MODES = {
  Ionian: [0, 2, 4, 5, 7, 9, 11],
  Dorian: [0, 2, 3, 5, 7, 9, 10],
  Phrygian: [0, 1, 3, 5, 7, 8, 10],
  Lydian: [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian: [0, 2, 3, 5, 7, 8, 10],
  Locrian: [0, 1, 3, 5, 6, 8, 10]
};
const DENSITIES = [
  { label: '2 Notes: Dyad / interval', value: 2 },
  { label: '3 Notes: Triad', value: 3 },
  { label: '4 Notes: Tetrad / seventh chord', value: 4 },
  { label: '5 Notes: Pentad / extended chord', value: 5 },
  { label: '6 Notes: Hexad', value: 6 },
  { label: '7 Notes: Heptad', value: 7 }
];
const DRUMS = ['Kick', 'Snare', 'Closed Hat', 'Open Hat', 'Clap', 'Perc'];
const PITCH_ROWS = ['B5','A#5','A5','G#5','G5','F#5','F5','E5','D#5','D5','C#5','C5','B4','A#4','A4','G#4','G4','F#4','F4','E4','D#4','D4','C#4','C4','B3','A3','G3','F3','E3','D3','C3'];

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
function noteIndex(note) { return NOTES.indexOf(note.replace(/[0-9]/g, '')); }
function transpose(root, semis, octave = 4) {
  const rootIndex = noteIndex(root);
  const total = rootIndex + semis;
  const name = NOTES[((total % 12) + 12) % 12];
  const oct = octave + Math.floor(total / 12);
  return `${name}${oct}`;
}
function chordQuality(scaleIntervals, degree) {
  const r = scaleIntervals[degree];
  const third = (scaleIntervals[(degree + 2) % 7] + (degree + 2 >= 7 ? 12 : 0)) - r;
  const fifth = (scaleIntervals[(degree + 4) % 7] + (degree + 4 >= 7 ? 12 : 0)) - r;
  const seventh = (scaleIntervals[(degree + 6) % 7] + (degree + 6 >= 7 ? 12 : 0)) - r;
  if (third === 4 && fifth === 7 && seventh === 11) return 'maj7';
  if (third === 4 && fifth === 7 && seventh === 10) return '7';
  if (third === 3 && fifth === 7 && seventh === 10) return 'm7';
  if (third === 3 && fifth === 6 && seventh === 10) return 'm7b5';
  return 'chord';
}
function generateChord(key, mode, degree, density) {
  const scale = MODES[mode];
  const keyIndex = NOTES.indexOf(key);
  const rootSemis = scale[degree];
  const rootName = NOTES[(keyIndex + rootSemis) % 12];
  const stackedThirds = [0,2,4,6,1,3,5].slice(0, density);
  const notes = stackedThirds.map(step => {
    const wrap = step >= 7 ? 12 : 0;
    const semis = rootSemis + (scale[step % 7] + wrap - rootSemis);
    return transpose(key, semis, 4);
  });
  return { rootName, label: `${rootName}${density >= 4 ? chordQuality(scale, degree) : density === 3 ? '' : ' dyad'}`, notes };
}
function makeWaveformSamples() { return Array.from({ length: 80 }, (_, i) => Math.abs(Math.sin(i * .31) * Math.cos(i * .09)) * 80 + 8); }

function useAudioEngine({ bpm, bars, drumGrid, midiNotes, audioTracks, masterVolume }) {
  const ctxRef = useRef(null); const sources = useRef([]); const timer = useRef(null);
  const [playing, setPlaying] = useState(false); const [beat, setBeat] = useState(0);
  const totalBeats = bars * 4;
  const stop = () => { sources.current.forEach(s => { try { s.stop(); } catch {} }); sources.current=[]; clearInterval(timer.current); setPlaying(false); setBeat(0); };
  const ensureCtx = () => { if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); return ctxRef.current; };
  const beep = (time, freq, dur = .12, type='sine', gain=.08) => { const ctx=ensureCtx(); const osc=ctx.createOscillator(); const g=ctx.createGain(); osc.type=type; osc.frequency.value=freq; g.gain.value=gain*masterVolume; osc.connect(g).connect(ctx.destination); osc.start(time); osc.stop(time+dur); sources.current.push(osc); };
  const drum = (time, name) => { const f = { Kick: 60, Snare: 180, 'Closed Hat': 650, 'Open Hat': 520, Clap: 300, Perc: 420 }[name] || 220; beep(time, f, name==='Kick'? .18:.06, name==='Kick'?'sine':'square', name==='Kick'? .18:.05); };
  const start = async () => {
    const ctx = ensureCtx(); await ctx.resume(); stop(); setPlaying(true);
    const secondsPerBeat = 60 / bpm; const loopDur = secondsPerBeat * totalBeats; const startTime = ctx.currentTime + .08;
    // schedule 8 loops ahead enough for MVP
    for (let loop=0; loop<8; loop++) {
      const base = startTime + loop * loopDur;
      drumGrid.forEach((row, r) => row.forEach((on, step) => { if (on) drum(base + step * (secondsPerBeat/4), DRUMS[r]); }));
      midiNotes.forEach(n => { const pitch = 220 * Math.pow(2, (PITCH_ROWS.indexOf('A4') - PITCH_ROWS.indexOf(n.pitch))/12); beep(base + n.start * secondsPerBeat, pitch, n.length * secondsPerBeat * .9, 'triangle', .045); });
      audioTracks.filter(t=>!t.muted && t.buffer).forEach(t => { const src=ctx.createBufferSource(); const g=ctx.createGain(); g.gain.value=(t.volume/100)*masterVolume; src.buffer=t.buffer; src.connect(g).connect(ctx.destination); const offset=Math.max(0,t.trimStart||0); const dur=Math.max(.1, Math.min(src.buffer.duration-offset, (t.trimEnd || src.buffer.duration)-offset)); src.start(base + (t.startBeat||0)*secondsPerBeat, offset, dur); sources.current.push(src); });
    }
    const startMs = performance.now(); timer.current = setInterval(()=> setBeat(Math.floor(((performance.now()-startMs)/1000)/secondsPerBeat)%totalBeats), 60);
  };
  return { playing, beat, start, stop, decodeAudio: async file => ensureCtx().decodeAudioData(await file.arrayBuffer()) };
}

function App() {
  const [project, setProject] = useState({ title:'Untitled Jam', bpm:90, bars:8, key:'C', mode:'Ionian', density:4, masterVolume:.9 });
  const [midiNotes, setMidiNotes] = useState([]);
  const [drumGrid, setDrumGrid] = useState(Array.from({length:DRUMS.length},()=>Array(32).fill(false)));
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState('chords');
  const media = useRef(null); const chunks = useRef([]); const [recording, setRecording] = useState(false);
  const engine = useAudioEngine({ bpm:project.bpm, bars:project.bars, drumGrid, midiNotes, audioTracks, masterVolume:project.masterVolume });
  const totalSteps = project.bars * 4;
  const chordMap = useMemo(()=>WHITE_KEYS.map((_,i)=>generateChord(project.key, project.mode, i, project.density)),[project]);
  const addChord = (degree) => { const chord = chordMap[degree]; const nextStart = midiNotes.length ? Math.max(...midiNotes.map(n=>n.start+n.length)) : 0; const start = nextStart % (project.bars*4); setMidiNotes([...midiNotes, ...chord.notes.map(pitch=>({id:uid(), pitch, start, length:4, velocity:90, source:chord.label}))]); };
  const moveNote = (id, patch) => setMidiNotes(midiNotes.map(n=> n.id===id ? {...n,...patch} : n));
  const quantize = () => setMidiNotes(midiNotes.map(n=>({...n, start:Math.round(n.start), length:Math.max(1,Math.round(n.length))})));
  const copy2ToLoop = () => setDrumGrid(g=>g.map(row=>row.map((_,i)=>row[i%8])));
  const startRec = async () => { const stream = await navigator.mediaDevices.getUserMedia({ audio:true }); media.current = new MediaRecorder(stream); chunks.current=[]; media.current.ondataavailable=e=>chunks.current.push(e.data); media.current.onstop=async()=>{ const blob=new Blob(chunks.current,{type:'audio/webm'}); const file=new File([blob],`voice-${Date.now()}.webm`,{type:'audio/webm'}); const buffer=await engine.decodeAudio(file); setAudioTracks(t=>[...t,{id:uid(), name:file.name, kind:'recording', url:URL.createObjectURL(blob), buffer, waveform:makeWaveformSamples(), startBeat:0, trimStart:0, trimEnd:buffer.duration, volume:90, muted:false}]); }; media.current.start(); setRecording(true); };
  const stopRec = () => { media.current?.stop(); media.current?.stream.getTracks().forEach(t=>t.stop()); setRecording(false); };
  const importAudio = async (e) => { const files=[...e.target.files]; for (const file of files) { const buffer=await engine.decodeAudio(file); setAudioTracks(t=>[...t,{id:uid(), name:file.name, kind:'import', url:URL.createObjectURL(file), buffer, waveform:makeWaveformSamples(), startBeat:0, trimStart:0, trimEnd:buffer.duration, volume:90, muted:false}]); } };
  const saveProject = () => { const saved={project,midiNotes,drumGrid,audioTracks:audioTracks.map(({buffer,...rest})=>rest)}; localStorage.setItem('jamroomProject', JSON.stringify(saved)); alert('Project saved locally. Audio buffers reload from imported files in future cloud version.'); };
  useEffect(()=>{ const saved=localStorage.getItem('jamroomProject'); if(saved){ try{ const s=JSON.parse(saved); setProject(s.project||project); setMidiNotes(s.midiNotes||[]); setDrumGrid(s.drumGrid||drumGrid); }catch{} } },[]);
  return <div className="app">
    <header><div><h1>JamRoom</h1><p>Collaborative loop builder: audio, chords, piano roll, drums, waveforms.</p></div><div className="transport"><button onClick={engine.playing?engine.stop:engine.start}>{engine.playing?<Square/>:<Play/>}{engine.playing?'Stop':'Play'}</button><button onClick={saveProject}><Save/>Save</button></div></header>
    <section className="panel settings">
      <label>Title<input value={project.title} onChange={e=>setProject({...project,title:e.target.value})}/></label>
      <label>BPM<input type="number" value={project.bpm} onChange={e=>setProject({...project,bpm:+e.target.value})}/></label>
      <label>Bars<select value={project.bars} onChange={e=>setProject({...project,bars:+e.target.value})}>{[2,4,8,16,32].map(b=><option key={b}>{b}</option>)}</select></label>
      <label>Key<select value={project.key} onChange={e=>setProject({...project,key:e.target.value})}>{NOTES.map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Mode<select value={project.mode} onChange={e=>setProject({...project,mode:e.target.value})}>{Object.keys(MODES).map(m=><option key={m}>{m}</option>)}</select></label>
      <label>Density<select value={project.density} onChange={e=>setProject({...project,density:+e.target.value})}>{DENSITIES.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select></label>
    </section>
    <main className="grid">
      <section className="panel"><h2><Music2/> One-Finger Chord Player</h2><div className="chords">{chordMap.map((c,i)=><button key={i} onClick={()=>addChord(i)}><strong>{WHITE_KEYS[i]}</strong><span>{c.label}</span><small>{c.notes.join(' ')}</small></button>)}</div><div className="theory"><b>Density</b>: note count. <b>Voicing</b>: octave spacing. <b>Extension</b>: 9ths, 11ths, 13ths added to the chord.</div></section>
      <section className="panel"><h2><Drum/> Drum Pads + Sequencer</h2><div className="pads">{DRUMS.map((d,r)=><button key={d} onMouseDown={()=>setDrumGrid(g=>{const n=g.map(x=>[...x]); n[r][engine.beat*4%32]=true; return n;})}>{d}</button>)}</div><div className="drumgrid">{DRUMS.map((d,r)=><React.Fragment key={d}><div className="rowlabel">{d}</div>{drumGrid[r].map((on,c)=><button key={c} className={on?'on':''} onClick={()=>setDrumGrid(g=>{const n=g.map(x=>[...x]); n[r][c]=!n[r][c]; return n;})}></button>)}</React.Fragment>)}</div><button onClick={copy2ToLoop}><Copy/>Copy first 2 bars across loop</button></section>
      <section className="panel wide"><h2>DAW Timeline / Waveform Loops</h2><div className="ruler">{Array.from({length:project.bars},(_,i)=><span key={i}>Bar {i+1}</span>)}</div><div className="playhead" style={{left:`${(engine.beat/(project.bars*4))*100}%`}} />
        {audioTracks.map(t=><div className="track" key={t.id}><div className="trackhead"><b>{t.name}</b><button onClick={()=>setAudioTracks(a=>a.map(x=>x.id===t.id?{...x,muted:!x.muted}:x))}>{t.muted?'Unmute':'Mute'}</button><button onClick={()=>setAudioTracks(a=>a.filter(x=>x.id!==t.id))}><Trash2 size={14}/></button></div><div className="wave" style={{marginLeft:`${(t.startBeat/(project.bars*4))*100}%`, width:`${Math.min(100, ((t.trimEnd-t.trimStart)/(project.bars*4*(60/project.bpm)))*100)}%`}}>{t.waveform.map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div><label>Start beat <input type="range" min="0" max={project.bars*4-1} value={t.startBeat} onChange={e=>setAudioTracks(a=>a.map(x=>x.id===t.id?{...x,startBeat:+e.target.value}:x))}/></label><label>Volume <input type="range" min="0" max="100" value={t.volume} onChange={e=>setAudioTracks(a=>a.map(x=>x.id===t.id?{...x,volume:+e.target.value}:x))}/></label></div>)}
        <div className="importbar"><button onClick={recording?stopRec:startRec}><Mic/>{recording?'Stop recording':'Record audio'}</button><label className="file"><Upload/>Import WAV/MP3<input type="file" accept="audio/*" multiple onChange={importAudio}/></label></div>
      </section>
      <section className="panel wide"><h2>Piano Roll</h2><div className="rollTools"><button onClick={quantize}>Quantize</button><button onClick={()=>setMidiNotes([])}>Clear MIDI</button></div><div className="pianoroll">{PITCH_ROWS.map((p,row)=><React.Fragment key={p}><div className="pitch">{p}</div>{Array.from({length:totalSteps},(_,col)=>{const note=midiNotes.find(n=>n.pitch===p && col>=n.start && col<n.start+n.length); return <div key={col} className={'cell '+(note?'note':'')} onClick={()=> note ? moveNote(note.id,{pitch:PITCH_ROWS[clamp(row-1,0,PITCH_ROWS.length-1)]}) : setMidiNotes([...midiNotes,{id:uid(),pitch:p,start:col,length:1,velocity:90,source:'manual'}])}>{note && col===note.start?<button onClick={(e)=>{e.stopPropagation();setMidiNotes(midiNotes.filter(n=>n.id!==note.id));}}>×</button>:null}</div>})}</React.Fragment>)}</div></section>
      <section className="panel"><h2><SlidersHorizontal/> Mixer</h2>{['Chord MIDI','Drums',...audioTracks.map(t=>t.name)].map(name=><div className="mix" key={name}><span>{name}</span><input type="range" min="0" max="100" defaultValue="90"/></div>)}<label>Master Volume<input type="range" min="0" max="1" step=".01" value={project.masterVolume} onChange={e=>setProject({...project,masterVolume:+e.target.value})}/></label></section>
      <section className="panel"><h2>Next Cloud Features</h2><ul><li>Supabase login and invite links</li><li>Upload audio files to storage</li><li>Save MIDI/drum grid to database</li><li>Track comments and versions</li><li>Export mix as WAV</li></ul></section>
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
