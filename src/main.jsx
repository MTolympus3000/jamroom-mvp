import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Settings, Grid3X3, BarChart3, MoreHorizontal, Search, Folder, UploadCloud, RotateCcw, Redo2, Copy, ClipboardPaste, Trash2, ChevronDown } from 'lucide-react';
import { FACTORY_CATEGORIES } from './factorySamples';
import './styles.css';

const colors = ['red','orange','yellow','green','teal','blue','purple','pink'];
const STEPS_PER_BAR = 16;
const makePattern = (rows, bars) => Array.from({length: rows}, () => Array.from({length: bars * STEPS_PER_BAR}, () => 0));

const defaultPads = [
  { label:'Kick Dirty Club', short:'Kick Dirty\nClub', category:'KICKS', sample:'Kick Dirty Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_dirty_club.wav', color:'red' },
  { label:'Kick Super Club', short:'Kick Super\nClub', category:'KICKS', sample:'Kick Super Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_super_club.wav', color:'red' },
  { label:'Snare Crack', short:'Snare\nCrack', category:'SNARES', sample:'Snare Crack', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_trap_knock.wav', color:'orange' },
  { label:'Clap Club', short:'Clap\nClub', category:'CLAPS', sample:'Clap Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_club.wav', color:'yellow' },
  { label:'Closed Hat 01', short:'Closed Hat\n01', category:'HATS CLOSED', sample:'Closed Hat 01', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_clean.wav', color:'green' },
  { label:'Open Hat 01', short:'Open Hat\n01', category:'HATS OPEN', sample:'Open Hat 01', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_open_hihats/SOUTHSIDE_open_hihat_clean.wav', color:'teal' },
  { label:'Percussion 01', short:'Percussion\n01', category:'PERCUSSION', sample:'Percussion 01', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_sticks.wav', color:'teal' },
  { label:'Percussion 02', short:'Percussion\n02', category:'PERCUSSION', sample:'Percussion 02', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_it_goes_bing.wav', color:'blue' },
  { label:'808 Earshaker', short:'808\nEarshaker', category:'808S', sample:'808 Earshaker', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_earshaker_Gsharp.wav', color:'purple' },
  { label:'808 Existential', short:'808\nExistential', category:'808S', sample:'808 Existential', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_existential_C.wav', color:'purple' },
  { label:'Kick Knockr', short:'Kick\nKnockr', category:'KICKS', sample:'Kick Knockr', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_knockr.wav', color:'pink' },
  { label:'Snare 02', short:'Snare\n02', category:'SNARES', sample:'Snare 02', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_gritty.wav', color:'pink' },
  { label:'Clap Room', short:'Clap\nRoom', category:'CLAPS', sample:'Clap Room', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_room.wav', color:'orange' },
  { label:'Closed Hat 02', short:'Closed Hat\n02', category:'HATS CLOSED', sample:'Closed Hat 02', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_mpc_vibe.wav', color:'yellow' },
  { label:'Crash / FX 01', short:'Crash / FX\n01', category:'FX', sample:'Crash / FX 01', url:null, color:'green' },
  { label:'User Sample', short:'User\nSample', category:'USER', sample:'Empty', url:null, color:'gray' },
];

function useDrumAudio(pads, volume = 1, lowLatency = true) {
  const ctxRef = useRef(null);
  const bufferMap = useRef(new Map());
  const loadingMap = useRef(new Map());
  const [loadStatus, setLoadStatus] = useState({ loaded: 0, total: 0, ready: false });

  const ensureContext = async () => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctxRef.current = new AudioCtx({ latencyHint: lowLatency ? 'interactive' : 'balanced' });
    }
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume();
    return ctxRef.current;
  };

  const loadBuffer = async (pad) => {
    if (!pad?.url) return null;
    if (bufferMap.current.has(pad.url)) return bufferMap.current.get(pad.url);
    if (loadingMap.current.has(pad.url)) return loadingMap.current.get(pad.url);

    const promise = (async () => {
      const ctx = await ensureContext();
      const res = await fetch(pad.url);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      bufferMap.current.set(pad.url, buf);
      setLoadStatus(prev => ({ ...prev, loaded: bufferMap.current.size, ready: bufferMap.current.size >= prev.total && prev.total > 0 }));
      return buf;
    })().finally(() => loadingMap.current.delete(pad.url));

    loadingMap.current.set(pad.url, promise);
    return promise;
  };

  const preloadKit = async () => {
    const urls = pads.filter(p => p.url).map(p => p.url);
    const uniqueTotal = new Set(urls).size;
    setLoadStatus({ loaded: bufferMap.current.size, total: uniqueTotal, ready: uniqueTotal === 0 });
    await ensureContext();
    await Promise.allSettled(pads.filter(p => p.url).map(loadBuffer));
    setLoadStatus(prev => ({ ...prev, loaded: bufferMap.current.size, total: uniqueTotal, ready: true }));
  };

  useEffect(() => {
    // Do not auto-start AudioContext before user gesture. We only update total.
    const total = new Set(pads.filter(p => p.url).map(p => p.url)).size;
    setLoadStatus(prev => ({ ...prev, total, loaded: [...bufferMap.current.keys()].filter(url => pads.some(p => p.url === url)).length }));
  }, [pads]);

  const triggerBuffer = (ctx, buffer, velocity = 100, when = 0) => {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = Math.max(0.02, (velocity / 127) * volume);
    source.buffer = buffer;
    source.connect(gain).connect(ctx.destination);
    source.start(ctx.currentTime + Math.max(0, when));
  };

  const playClick = async (isDownbeat = false) => {
    try {
      const ctx = await ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(isDownbeat ? 1400 : 950, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(isDownbeat ? 0.28 : 0.18, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch (err) {
      console.warn('Could not play metronome click', err);
    }
  };

  const playFallback = async (pad, velocity = 100) => {
    const ctx = await ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = pad.label.includes('Hat') ? 'square' : 'sine';
    osc.frequency.value = pad.label.includes('808') ? 52 : pad.label.includes('Snare') ? 180 : 85;
    gain.gain.setValueAtTime((velocity / 127) * 0.55, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  };

  const playPad = (padIndex, velocity = 100, when = 0) => {
    const pad = pads[padIndex];
    if (!pad) return;

    // Fast path: if the sample is decoded, playback is synchronous and immediate.
    const ctx = ctxRef.current;
    const cached = pad.url ? bufferMap.current.get(pad.url) : null;
    if (ctx && cached) {
      triggerBuffer(ctx, cached, velocity, when);
      return;
    }

    // Slow path: first tap loads the sample, then plays it. Preload Kit avoids this path.
    (async () => {
      try {
        const activeCtx = await ensureContext();
        const buffer = await loadBuffer(pad);
        if (buffer) triggerBuffer(activeCtx, buffer, velocity, when);
        else await playFallback(pad, velocity);
      } catch (err) {
        console.warn('Could not play sample', pad?.label, err);
      }
    })();
  };

  return { playPad, playClick, bufferMap, ensureContext, preloadKit, loadStatus };
}
function Transport({ isPlaying, onPlay, onStop, isRecording, setIsRecording, bpm, setBpm, loopBars, setLoopBars, quantize, setQuantize, swing, setSwing, metronome, setMetronome, lowLatency, setLowLatency, preloadKit, loadStatus }) {
  return <header className="transport">
    <div className="brand"><span>JAM</span><b>ROOM</b><small>DRUM MACHINE</small></div>
    <button className="transportButton play" onClick={onPlay}><Play size={30} fill="currentColor"/> <span>PLAY</span></button>
    <button className="transportButton" onClick={onStop}><Square size={24} fill="currentColor"/> <span>STOP</span></button>
    <button className={`transportButton record ${isRecording ? 'armed' : ''}`} onClick={() => setIsRecording(v => !v)}><Circle size={27} fill="currentColor"/> <span>RECORD</span></button>
    <div className="controlCard"><label>BPM</label><div className="bigValue"><input value={bpm} onChange={e=>setBpm(Number(e.target.value)||1)} /></div><button onClick={()=>setBpm(v=>v+1)}>⌃</button><button onClick={()=>setBpm(v=>Math.max(30,v-1))}>⌄</button><button className="tap">TAP</button></div>
    <div className="controlCard"><label>LOOP LENGTH</label><select value={loopBars} onChange={e=>setLoopBars(Number(e.target.value))}><option>1</option><option>2</option><option>4</option><option>8</option></select><b>{loopBars} BARS</b><ChevronDown size={17}/></div>
    <KnobCard title="QUANTIZE" value={quantize} suffix="%" setValue={setQuantize}/>
    <KnobCard title="SWING" value={swing} suffix="%" setValue={setSwing}/>
    <div className="controlCard met"><label>METRONOME</label><button className={metronome ? 'on' : ''} onClick={()=>setMetronome(v=>!v)}>{metronome?'ON':'OFF'}</button><Settings size={23}/></div>
    <div className="controlCard met"><label>LOW LATENCY</label><button className={lowLatency ? 'on' : ''} onClick={()=>setLowLatency(v=>!v)}>{lowLatency?'ON':'OFF'}</button><small>pointerdown</small></div>
    <div className="controlCard preload"><label>KIT CACHE</label><button onClick={preloadKit}>{loadStatus.ready ? 'READY' : 'PRELOAD'}</button><small>{loadStatus.loaded}/{loadStatus.total} loaded</small></div>
  </header>
}

function KnobCard({title, value, suffix, setValue}) {
  return <div className="controlCard knobCard"><label>{title}</label><b>{value}{suffix}</b><input type="range" min="0" max="100" value={value} onChange={e=>setValue(Number(e.target.value))}/><div className="knob" style={{'--deg': `${value*2.7}deg`}} /></div>
}

function Sequencer({ pads, pattern, setPattern, currentStep, resolution, setResolution, bank, setBank, loopBars, muted, setMuted, solo, setSolo }) {
  const steps = loopBars * STEPS_PER_BAR;
  const rows = pads.slice(0,8);
  const toggleStep = (r,c) => {
    setPattern(prev => prev.map((row,ri) => ri === r ? row.map((v,ci)=> ci === c ? (v ? 0 : 100) : v) : row));
  };
  const clear = () => setPattern(makePattern(8, loopBars));
  const copyBar = () => {
    setPattern(prev => prev.map(row => {
      const first = row.slice(0, STEPS_PER_BAR);
      return Array.from({length: steps}, (_, i) => first[i % STEPS_PER_BAR]);
    }));
  };
  return <section className="sequencer panel">
    <div className="panelHeader"><h2>SEQUENCER</h2><div className="tools"><button><Grid3X3 size={18}/></button><button><BarChart3 size={18}/></button><select value={resolution} onChange={e=>setResolution(e.target.value)}><option>1/8</option><option>1/16</option><option>1/32</option></select><button className="bank">{bank}</button><button><RotateCcw size={16}/></button><button><Redo2 size={16}/></button></div><div className="tools right"><button onClick={copyBar}><Copy size={16}/> COPY</button><button><ClipboardPaste size={16}/> PASTE</button><button onClick={clear}><Trash2 size={16}/> CLEAR</button><button><MoreHorizontal size={17}/></button></div></div>
    <div className="gridWrap">
      <div className="barNumbers">{Array.from({length:loopBars},(_,i)=><span key={i} style={{left: `${(i/loopBars)*100}%`}}>{i+1}</span>)}</div>
      <div className="rows">
        {rows.map((pad, r) => <div className="seqRow" key={pad.label}>
          <div className="trackName"><i className={pad.color}></i><span>{r+1}</span><b>{pad.label}</b><ChevronDown size={15}/><button onClick={()=>setSolo({...solo,[r]:!solo[r]})} className={solo[r]?'activeMini':''}>S</button><button onClick={()=>setMuted({...muted,[r]:!muted[r]})} className={muted[r]?'activeMini':''}>M</button></div>
          <div className="stepGrid" style={{gridTemplateColumns:`repeat(${steps}, 1fr)`}}>
            {Array.from({length:steps}, (_, c) => <button key={c} onClick={()=>toggleStep(r,c)} className={`step ${pattern[r]?.[c] ? 'hit' : ''} ${currentStep===c?'now':''} ${c%4===0?'beat':''}`}></button>)}
          </div>
        </div>)}
      </div>
    </div>
  </section>
}

function PadControls({ layout, setLayout, velocity, setVelocity, noteRepeat, setNoteRepeat, repeatEnabled, setRepeatEnabled }) {
  return <section className="padControls panel"><h3>PAD LAYOUT</h3><div className="seg"><button className={layout==='MPC'?'selected':''} onClick={()=>setLayout('MPC')}>MPC</button><button className={layout==='FPC'?'selected':''} onClick={()=>setLayout('FPC')}>FPC</button></div><label>VELOCITY <output>{velocity}</output></label><input type="range" min="1" max="127" value={velocity} onChange={e=>setVelocity(Number(e.target.value))}/><label>NOTE REPEAT</label><select value={noteRepeat} onChange={e=>setNoteRepeat(e.target.value)}><option>1/8</option><option>1/16</option><option>1/32</option><option>1/64</option></select><button className={`repeat ${repeatEnabled?'on':''}`} onClick={()=>setRepeatEnabled(v=>!v)}>{repeatEnabled?'ON':'OFF'}</button><footer><button className="selected"><Grid3X3 size={18}/> PADS</button><button><BarChart3 size={18}/> SAMPLES</button></footer></section>
}

function Pads({ pads, selectedPad, setSelectedPad, playPad, velocity, layout }) {
  return <>
    <section className={`padPanel panel ${layout==='MPC'?'glow':''}`}><h3>MPC PAD LAYOUT</h3><div className="mpcPads">{pads.map((pad,i)=><button key={i} onPointerDown={(e)=>{e.preventDefault(); setSelectedPad(i); playPad(i, velocity)}} className={`pad ${pad.color} ${selectedPad===i?'selectedPad':''}`}><span>{i+1}</span><b>{pad.short.split('\n').map((x,j)=><React.Fragment key={j}>{x}{j===0&&<br/>}</React.Fragment>)}</b></button>)}</div></section>
    <section className={`fpcPanel panel ${layout==='FPC'?'glow':''}`}><h3>FPC PAD LAYOUT</h3><div className="fpcPads">{pads.slice(0,14).map((pad,i)=><button key={i} onPointerDown={(e)=>{e.preventDefault(); setSelectedPad(i); playPad(i, velocity)}} className={`fpc ${pad.color} ${selectedPad===i?'selectedPad':''}`}><b>{pad.label}</b><small>{pad.category}</small></button>)}</div></section>
  </>
}

function SampleBrowser({ pads, setPads, selectedPad }) {
  const [query, setQuery] = useState('');
  const [openCat, setOpenCat] = useState('KICKS');
  const [localSamples, setLocalSamples] = useState([]);
  const cats = FACTORY_CATEGORIES.map(c => ({...c, samples:c.samples.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))}));
  const assign = (sample) => {
    setPads(prev => prev.map((p,i)=> i===selectedPad ? {...p, label:sample.name.replace(/^Kick /,'' ).length<18?sample.name:sample.name.slice(0,18), short: sample.name.replace('Southside ','').slice(0,18).replaceAll(' ', '\n'), sample:sample.name, url:sample.url, category:sample.category } : p));
  };
  const importSample = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sample = {name:file.name.replace(/\.[^/.]+$/,''), url, category:'USER'};
    setLocalSamples(s=>[sample,...s]);
    assign(sample);
  };
  return <section className="browser panel"><h3>SAMPLE BROWSER</h3><div className="search"><input placeholder="Search samples..." value={query} onChange={e=>setQuery(e.target.value)}/><Search size={20}/></div><div className="catList">{cats.map(cat => <div key={cat.name}><button className="cat" onClick={()=>setOpenCat(openCat===cat.name?'':cat.name)}><Folder size={20}/><span>{cat.name}</span><em>({cat.count})</em><ChevronDown size={18}/></button>{openCat===cat.name && <div className="sampleList">{cat.samples.slice(0,20).map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div>}</div>)}{localSamples.length>0 && <div><button className="cat"><Folder size={20}/><span>USER</span><em>({localSamples.length})</em></button><div className="sampleList">{localSamples.map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div></div>}</div><label className="import"><UploadCloud size={22}/><span>IMPORT SAMPLE</span><input type="file" accept="audio/*,.wav,.mp3,.aiff" onChange={e=>importSample(e.target.files?.[0])}/></label><p className="hint">Selected pad: <b>{selectedPad+1}</b> · {pads[selectedPad]?.label}</p></section>
}

function App(){
  const [bpm,setBpm]=useState(120); const [loopBars,setLoopBars]=useState(4); const [quantize,setQuantize]=useState(75); const [swing,setSwing]=useState(55); const [metronome,setMetronome]=useState(true); const [lowLatency,setLowLatency]=useState(true); const [isPlaying,setIsPlaying]=useState(false); const [isRecording,setIsRecording]=useState(false); const [currentStep,setCurrentStep]=useState(-1); const [pattern,setPattern]=useState(()=>makePattern(8,4)); const [pads,setPads]=useState(defaultPads); const [selectedPad,setSelectedPad]=useState(0); const [velocity,setVelocity]=useState(100); const [layout,setLayout]=useState('MPC'); const [resolution,setResolution]=useState('1/16'); const [bank,setBank]=useState('A'); const [noteRepeat,setNoteRepeat]=useState('1/16'); const [repeatEnabled,setRepeatEnabled]=useState(true); const [muted,setMuted]=useState({}); const [solo,setSolo]=useState({});
  const timer = useRef(null); const stepRef = useRef(0); const { playPad, playClick, preloadKit, loadStatus } = useDrumAudio(pads, 1, lowLatency);
  useEffect(()=>{ setPattern(prev=> prev.map(row=> Array.from({length:loopBars*STEPS_PER_BAR},(_,i)=> row[i] || 0)).slice(0,8)); },[loopBars]);
  const playCurrentStep = (step) => {
    const soloActive = Object.values(solo).some(Boolean);
    pattern.forEach((row,r)=>{ if(row[step] && !muted[r] && (!soloActive || solo[r])) playPad(r, row[step]); });
    if (metronome && step % 4 === 0) {
      playClick(step % 16 === 0);
    }
  };
  const start = () => {
    stop(false); setIsPlaying(true); const msPerStep = (60000 / bpm) / 4; const max = loopBars*STEPS_PER_BAR; stepRef.current = 0;
    timer.current = setInterval(()=>{ const step=stepRef.current; setCurrentStep(step); playCurrentStep(step); stepRef.current=(step+1)%max; }, msPerStep);
  };
  const stop = (reset=true)=>{ if(timer.current) clearInterval(timer.current); timer.current=null; setIsPlaying(false); if(reset){setCurrentStep(-1); stepRef.current=0;} };
  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{ if(isPlaying){ start(); } },[bpm, loopBars]);
  const recordPad = (i, vel) => {
    playPad(i, vel); setSelectedPad(i);
    if(!isRecording) return;
    const raw = currentStep >=0 ? currentStep : 0;
    const strength = quantize / 100;
    const grid = Math.round(raw); const placed = Math.round(raw + (grid - raw) * strength);
    setPattern(prev=>prev.map((row,r)=> r===Math.min(i,7) ? row.map((v,c)=> c===placed ? vel : v) : row));
  };
  const wrappedPlayPad = (i, vel) => recordPad(i, vel);
  return <main className="app"><Transport isPlaying={isPlaying} onPlay={start} onStop={()=>stop()} isRecording={isRecording} setIsRecording={setIsRecording} bpm={bpm} setBpm={setBpm} loopBars={loopBars} setLoopBars={setLoopBars} quantize={quantize} setQuantize={setQuantize} swing={swing} setSwing={setSwing} metronome={metronome} setMetronome={setMetronome} lowLatency={lowLatency} setLowLatency={setLowLatency} preloadKit={preloadKit} loadStatus={loadStatus}/><Sequencer pads={pads} pattern={pattern} setPattern={setPattern} currentStep={currentStep} resolution={resolution} setResolution={setResolution} bank={bank} setBank={setBank} loopBars={loopBars} muted={muted} setMuted={setMuted} solo={solo} setSolo={setSolo}/><div className="bottom"><PadControls layout={layout} setLayout={setLayout} velocity={velocity} setVelocity={setVelocity} noteRepeat={noteRepeat} setNoteRepeat={setNoteRepeat} repeatEnabled={repeatEnabled} setRepeatEnabled={setRepeatEnabled}/><Pads pads={pads} selectedPad={selectedPad} setSelectedPad={setSelectedPad} playPad={wrappedPlayPad} velocity={velocity} layout={layout}/><SampleBrowser pads={pads} setPads={setPads} selectedPad={selectedPad}/></div></main>
}

createRoot(document.getElementById('root')).render(<App/>);
