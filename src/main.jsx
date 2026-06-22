import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Settings, Folder, UploadCloud, Search, Trash2, Copy, RotateCcw, SlidersHorizontal, Music2 } from 'lucide-react';
import { FACTORY_CATEGORIES } from './factorySamples';
import './styles.css';

const TICKS_PER_BAR = 96;
const GRID_OPTIONS = [
  { label:'1/4', ticks:24 },
  { label:'1/8', ticks:12 },
  { label:'1/16', ticks:6 },
  { label:'1/32', ticks:3 },
];
const getGridTicks = (label) => GRID_OPTIONS.find(g => g.label === label)?.ticks || 6;
const snapTick = (tick, gridTicks, strength = 1) => {
  const target = Math.round(tick / gridTicks) * gridTicks;
  return Math.max(0, Math.round(tick + (target - tick) * strength));
};
const removeOffGridNotes = (pattern, gridTicks) =>
  pattern.map(row => row.map((value, tick) => (tick % gridTicks === 0 ? value : 0)));

const makePattern = (rows, bars) => Array.from({length: rows}, () => Array.from({length: bars * TICKS_PER_BAR}, () => 0));

const defaultPads = [
  { label:'Kick Dirty Club', short:'KICK\nDIRTY', category:'KICKS', sample:'Kick Dirty Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_dirty_club.wav', color:'red' },
  { label:'Kick Super Club', short:'KICK\nSUPER', category:'KICKS', sample:'Kick Super Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_super_club.wav', color:'red' },
  { label:'Snare Trap Knock', short:'SNARE\nKNOCK', category:'SNARES', sample:'Snare Trap Knock', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_trap_knock.wav', color:'orange' },
  { label:'Clap Club', short:'CLAP\nCLUB', category:'CLAPS', sample:'Clap Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_club.wav', color:'yellow' },
  { label:'Hat Clean', short:'HAT\nCLEAN', category:'HATS CLOSED', sample:'Hat Clean', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_clean.wav', color:'green' },
  { label:'Open Hat Clean', short:'OPEN\nHAT', category:'HATS OPEN', sample:'Open Hat Clean', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_open_hihats/SOUTHSIDE_open_hihat_clean.wav', color:'teal' },
  { label:'Perc Sticks', short:'PERC\nSTICKS', category:'PERCUSSION', sample:'Perc Sticks', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_sticks.wav', color:'blue' },
  { label:'Perc Bing', short:'PERC\nBING', category:'PERCUSSION', sample:'Perc Bing', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_it_goes_bing.wav', color:'blue' },
  { label:'808 Earshaker', short:'808\nEAR', category:'808S', sample:'808 Earshaker', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_earshaker_Gsharp.wav', color:'purple' },
  { label:'808 Existential', short:'808\nEXIST', category:'808S', sample:'808 Existential', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_existential_C.wav', color:'purple' },
  { label:'Kick Knockr', short:'KICK\nKNOCKR', category:'KICKS', sample:'Kick Knockr', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_knockr.wav', color:'pink' },
  { label:'Snare Gritty', short:'SNARE\nGRITTY', category:'SNARES', sample:'Snare Gritty', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_gritty.wav', color:'pink' },
  { label:'Clap Room', short:'CLAP\nROOM', category:'CLAPS', sample:'Clap Room', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_room.wav', color:'orange' },
  { label:'Hat MPC Vibe', short:'HAT\nMPC', category:'HATS CLOSED', sample:'Hat MPC Vibe', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_mpc_vibe.wav', color:'yellow' },
  { label:'Perc Pull Up', short:'PERC\nPULL', category:'PERCUSSION', sample:'Perc Pull Up', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_pull_up.wav', color:'green' },
  { label:'User Sample', short:'USER\nSAMPLE', category:'USER', sample:'Empty', url:null, color:'gray' },
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
      gain.gain.exponentialRampToValueAtTime(isDownbeat ? 0.24 : 0.15, ctx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
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
    const ctx = ctxRef.current;
    const cached = pad.url ? bufferMap.current.get(pad.url) : null;
    if (ctx && cached) {
      triggerBuffer(ctx, cached, velocity, when);
      return;
    }
    (async () => {
      try {
        const activeCtx = await ensureContext();
        const buffer = await loadBuffer(pad);
        if (buffer) triggerBuffer(activeCtx, buffer, velocity, when);
        else await playFallback(pad, velocity);
      } catch {
        await playFallback(pad, velocity);
      }
    })();
  };

  return { playPad, playClick, preloadKit, loadStatus };
}

function MiniTransport({ isPlaying, start, stop, isRecording, requestRecord, isCountingIn, bpm, loopBars, currentStep }) {
  const bar = currentStep >= 0 ? Math.floor(currentStep / TICKS_PER_BAR) + 1 : 1;
  const beat = currentStep >= 0 ? Math.floor((currentStep % TICKS_PER_BAR) / 24) + 1 : 1;
  return <header className="miniTransport">
    <div className="brandSmall"><b>JAMROOM</b><span>DRUM</span></div>
    <div className="statusPill">{bpm} BPM</div>
    <div className="statusPill">{loopBars} BARS</div>
    <button className="iconBtn play" onPointerDown={(e)=>{e.preventDefault(); start();}} title="Play"><Play size={18} fill="currentColor"/></button>
    <button className="iconBtn" onPointerDown={(e)=>{e.preventDefault(); stop();}} title="Stop"><Square size={16} fill="currentColor"/></button>
    <button className={`iconBtn rec ${isRecording?'active':''} ${isCountingIn?'armed':''}`} onPointerDown={(e)=>{e.preventDefault(); requestRecord();}} title="Record / Count-In"><Circle size={16} fill="currentColor"/></button>
    <div className="counter">{isCountingIn ? 'COUNT' : `${bar}.${beat}`}</div>
  </header>
}

function Sequencer({ pads, pattern, setPatternLive, currentStep, loopBars, gridResolution, snapToGrid, muted, setMuted, followPlayhead }) {
  const totalTicks = loopBars * TICKS_PER_BAR;
  const gridTicks = getGridTicks(gridResolution);
  const columns = Math.ceil(totalTicks / gridTicks);
  const rowsRef = useRef(null);
  const touchScrollRef = useRef({ active: false, startX: 0, startLeft: 0 });
  const [scrollInfo, setScrollInfo] = useState({ left: 0, max: 0 });

  const updateScrollInfo = () => {
    const el = rowsRef.current;
    if (!el) return;
    setScrollInfo({ left: el.scrollLeft, max: Math.max(0, el.scrollWidth - el.clientWidth) });
  };

  useEffect(() => {
    updateScrollInfo();
    window.addEventListener('resize', updateScrollInfo);
    return () => window.removeEventListener('resize', updateScrollInfo);
  }, [loopBars, gridResolution]);

  useEffect(() => {
    const el = rowsRef.current;
    if (!el || !followPlayhead || currentStep < 0 || touchScrollRef.current.active) return;
    const totalTicks = loopBars * TICKS_PER_BAR;
    const ratio = currentStep / Math.max(1, totalTicks - 1);
    const target = ratio * el.scrollWidth - el.clientWidth * 0.5;
    const nextLeft = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, target));
    if (Math.abs(el.scrollLeft - nextLeft) > 18) {
      el.scrollLeft = nextLeft;
      updateScrollInfo();
    }
  }, [currentStep, followPlayhead, loopBars]);

  const jumpScroll = (event) => {
    const el = rowsRef.current;
    if (!el) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    el.scrollLeft = (x / rect.width) * scrollInfo.max;
    updateScrollInfo();
  };

  const avgTouchX = (touches) => (touches[0].clientX + touches[1].clientX) / 2;
  const onGridTouchStart = (event) => {
    if (event.touches.length === 2 && rowsRef.current) {
      touchScrollRef.current = { active: true, startX: avgTouchX(event.touches), startLeft: rowsRef.current.scrollLeft };
      event.preventDefault();
    }
  };
  const onGridTouchMove = (event) => {
    const el = rowsRef.current;
    if (!el) return;
    if (touchScrollRef.current.active && event.touches.length === 2) {
      const delta = avgTouchX(event.touches) - touchScrollRef.current.startX;
      el.scrollLeft = touchScrollRef.current.startLeft - delta;
      updateScrollInfo();
      event.preventDefault();
      return;
    }
    // One-finger movement should not drag the grid or slide the page while playing pads/notes.
    if (event.touches.length === 1) event.preventDefault();
  };
  const onGridTouchEnd = () => {
    touchScrollRef.current.active = false;
  };

  const toggleGridCell = (r, cellIndex) => {
    const rawTick = Math.min(totalTicks - 1, cellIndex * gridTicks);
    const tick = snapToGrid ? snapTick(rawTick, gridTicks, 1) : rawTick;
    setPatternLive(prev => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === tick ? (v ? 0 : 100) : v) : row));
  };
  const displayHit = (row, cellIndex) => row[Math.min(totalTicks - 1, cellIndex * gridTicks)] || 0;
  const thumbWidth = scrollInfo.max ? Math.max(18, 100 * (rowsRef.current?.clientWidth || 1) / (rowsRef.current?.scrollWidth || 1)) : 100;
  const thumbLeft = scrollInfo.max ? (scrollInfo.left / scrollInfo.max) * (100 - thumbWidth) : 0;

  return <section className="playSequencer">
    <div className="seqHeader"><span>SEQUENCER</span><small>{gridResolution} beat · snap {snapToGrid?'on':'off'}</small></div>
    <div className="barNumbers">{Array.from({length: loopBars}, (_, i)=><span key={i} style={{left:`${(i/loopBars)*100}%`}}>{i+1}</span>)}</div>
    <div className="seqRows" ref={rowsRef} onScroll={updateScrollInfo} onTouchStart={onGridTouchStart} onTouchMove={onGridTouchMove} onTouchEnd={onGridTouchEnd} onTouchCancel={onGridTouchEnd}>
      {pads.map((pad, r) => <div className="seqRow" key={r}>
        <button className={`rowName ${muted[r]?'muted':''}`} onClick={()=>setMuted({...muted, [r]: !muted[r]})}><i className={pad.color}></i><b>{r+1}</b><span>{pad.label}</span></button>
        <div className="stepGrid" style={{gridTemplateColumns:`repeat(${columns}, minmax(18px, 1fr))`}}>
          {Array.from({length: columns}, (_, c) => {
            const tick = c * gridTicks;
            const now = currentStep >= tick && currentStep < tick + gridTicks;
            return <button key={c} onPointerDown={(e)=>{e.preventDefault(); toggleGridCell(r,c);}} className={`step ${displayHit(pattern[r] || [], c) ? 'hit' : ''} ${now?'now':''} ${tick % 24 === 0?'beat':''} ${tick % TICKS_PER_BAR === 0?'barStep':''}`}></button>
          })}
        </div>
      </div>)}
    </div>
    <div className="seqScrollBar" onPointerDown={jumpScroll}>
      <span className="seqArrow">‹</span>
      <b style={{width:`${thumbWidth}%`, left:`${thumbLeft}%`}}></b>
      <span className="seqArrow right">›</span>
    </div>
  </section>
}

function MpcPads({ pads, selectedPad, setSelectedPad, onPad, velocity }) {
  return <section className="mpcOnly">
    {pads.map((pad, i)=><button key={i} className={`mpcPad ${pad.color} ${selectedPad===i?'selected':''}`} onPointerDown={(e)=>{e.preventDefault(); setSelectedPad(i); onPad(i, velocity);}}>
      <span>{i+1}</span><b>{pad.short.split('\n').map((line, idx)=><React.Fragment key={line+idx}>{line}{idx===0 && <br/>}</React.Fragment>)}</b>
    </button>)}
  </section>
}

function PlayPage(props) {
  return <div className="playPage">
    <MiniTransport {...props.transport}/>
    <Sequencer {...props.sequencer}/>
    <MpcPads {...props.pads}/>
  </div>
}

function SamplesPage({ pads, setPads, selectedPad, setSelectedPad }) {
  const [query, setQuery] = useState('');
  const [openCat, setOpenCat] = useState('KICKS');
  const [localSamples, setLocalSamples] = useState([]);
  const cats = FACTORY_CATEGORIES.map(c => ({...c, samples:c.samples.filter(s => s.name.toLowerCase().includes(query.toLowerCase()))}));
  const assign = (sample) => {
    setPads(prev => prev.map((p,i)=> i===selectedPad ? {...p, label:sample.name.slice(0,22), short: sample.name.slice(0,16).replaceAll(' ', '\n'), sample:sample.name, url:sample.url, category:sample.category } : p));
  };
  const importSample = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sample = {name:file.name.replace(/\.[^/.]+$/,''), url, category:'USER'};
    setLocalSamples(s=>[sample,...s]);
    assign(sample);
  };
  return <div className="samplesPage pageScroll">
    <h2>Samples</h2>
    <div className="selectedInfo">Assigning to pad <b>{selectedPad+1}</b>: {pads[selectedPad]?.label}</div>
    <div className="padSelectMini">{pads.map((p,i)=><button key={i} className={selectedPad===i?'active':''} onClick={()=>setSelectedPad(i)}>{i+1}</button>)}</div>
    <label className="import"><UploadCloud size={20}/><span>Import Sample</span><input type="file" accept="audio/*,.wav,.mp3,.aiff" onChange={e=>importSample(e.target.files?.[0])}/></label>
    <div className="search"><input placeholder="Search factory sounds..." value={query} onChange={e=>setQuery(e.target.value)}/><Search size={18}/></div>
    {cats.map(cat => <div className="catBlock" key={cat.name}>
      <button className="cat" onClick={()=>setOpenCat(openCat===cat.name?'':cat.name)}><Folder size={18}/><span>{cat.name}</span><em>{cat.samples.length}</em></button>
      {openCat===cat.name && <div className="sampleList">{cat.samples.slice(0,40).map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div>}
    </div>)}
    {localSamples.length>0 && <div className="sampleList">{localSamples.map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div>}
  </div>
}

function SettingsPage({ bpm,setBpm,loopBars,setLoopBars,quantize,setQuantize,swing,setSwing,metronome,setMetronome,lowLatency,setLowLatency,preloadKit,loadStatus,snapToGrid,setSnapToGrid,gridResolution,setGridResolution,countInBars,setCountInBars,followPlayhead,setFollowPlayhead,clearPattern,copyBar }) {
  return <div className="settingsPage pageScroll">
    <h2>Settings</h2>
    <div className="settingsGrid">
      <label>BPM<input type="number" value={bpm} min="40" max="240" onChange={e=>setBpm(Number(e.target.value)||120)}/></label>
      <label>Loop Bars<select value={loopBars} onChange={e=>setLoopBars(Number(e.target.value))}>{[1,2,4,8,16].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Count-In<select value={countInBars} onChange={e=>setCountInBars(Number(e.target.value))}>{[0,1,2,4].map(x=><option key={x} value={x}>{x === 0 ? 'Off' : `${x} Bar${x>1?'s':''}`}</option>)}</select></label>
      <label>Grid<select value={gridResolution} onChange={e=>setGridResolution(e.target.value)}>{GRID_OPTIONS.map(g=><option key={g.label}>{g.label}</option>)}</select></label>
      <label>Quantize Strength<input type="range" min="0" max="100" value={quantize} onChange={e=>setQuantize(Number(e.target.value))}/><b>{quantize}%</b></label>
      <label>Swing<input type="range" min="50" max="75" value={swing} onChange={e=>setSwing(Number(e.target.value))}/><b>{swing}%</b></label>
      <button className={snapToGrid?'toggle on':'toggle'} onClick={()=>setSnapToGrid(v=>!v)}>Snap To Grid {snapToGrid?'ON':'OFF'}</button>
      <button className={followPlayhead?'toggle on':'toggle'} onClick={()=>setFollowPlayhead(v=>!v)}>Follow Playhead {followPlayhead?'ON':'OFF'}</button>
      <button className={metronome?'toggle on':'toggle'} onClick={()=>setMetronome(v=>!v)}>Metronome {metronome?'ON':'OFF'}</button>
      <button className={lowLatency?'toggle on':'toggle'} onClick={()=>setLowLatency(v=>!v)}>Low Latency {lowLatency?'ON':'OFF'}</button>
      <button className="toggle" onClick={preloadKit}>Preload Kit · {loadStatus.loaded}/{loadStatus.total}</button>
      <button className="toggle" onClick={copyBar}><Copy size={16}/> Copy Bar 1 To Loop</button>
      <button className="toggle danger" onClick={clearPattern}><Trash2 size={16}/> Clear Pattern</button>
    </div>
  </div>
}

function App(){
  const [bpm,setBpm]=useState(120);
  const [loopBars,setLoopBars]=useState(4);
  const [quantize,setQuantize]=useState(100);
  const [swing,setSwing]=useState(55);
  const [metronome,setMetronome]=useState(true);
  const [lowLatency,setLowLatency]=useState(true);
  const [isPlaying,setIsPlaying]=useState(false);
  const [isRecording,setIsRecording]=useState(false);
  const [isCountingIn,setIsCountingIn]=useState(false);
  const [countText,setCountText]=useState('');
  const [countInBars,setCountInBars]=useState(1);
  const [currentStep,setCurrentStep]=useState(-1);
  const [pattern,setPattern]=useState(()=>makePattern(16,4));
  const [pads,setPads]=useState(defaultPads);
  const [selectedPad,setSelectedPad]=useState(0);
  const [velocity]=useState(110);
  const [gridResolution,setGridResolution]=useState('1/16');
  const [snapToGrid,setSnapToGrid]=useState(true);
  const [followPlayhead,setFollowPlayhead]=useState(false);
  const [muted,setMuted]=useState({});
  const [page,setPage]=useState('play');
  const timer = useRef(null);
  const countTimer = useRef(null);
  const stepRef = useRef(0);
  const currentStepRef = useRef(-1);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const stateRef = useRef({ muted, metronome, loopBars });
  const { playPad, playClick, preloadKit, loadStatus } = useDrumAudio(pads, 1, lowLatency);

  useEffect(()=>{ patternRef.current = pattern; },[pattern]);
  useEffect(()=>{ currentStepRef.current = currentStep; },[currentStep]);
  useEffect(()=>{ bpmRef.current = bpm; },[bpm]);
  useEffect(()=>{ stateRef.current = { muted, metronome, loopBars }; },[muted,metronome,loopBars]);

  const setPatternLive = (updater) => {
    setPattern(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      patternRef.current = next;
      return next;
    });
  };

  useEffect(()=>{
    setPatternLive(prev=> Array.from({length:16}, (_, r)=> Array.from({length:loopBars*TICKS_PER_BAR},(_,i)=> prev[r]?.[i] || 0)));
  },[loopBars]);


  useEffect(()=>{
    if (!snapToGrid) return;
    const gridTicks = getGridTicks(gridResolution);
    setPatternLive(prev => removeOffGridNotes(prev, gridTicks));
  },[snapToGrid, gridResolution]);

  const playStep = (step) => {
    const pat = patternRef.current;
    const { muted: mutedNow, metronome: metroNow } = stateRef.current;
    for (let r=0; r<pat.length; r++) {
      const velocityAtStep = pat[r]?.[step] || 0;
      if (velocityAtStep && !mutedNow[r]) playPad(r, velocityAtStep);
    }
    if (metroNow && step % 24 === 0) playClick(step % TICKS_PER_BAR === 0);
  };

  const stop = (reset=true)=>{
    if(timer.current) clearInterval(timer.current);
    if(countTimer.current) clearTimeout(countTimer.current);
    timer.current=null;
    countTimer.current=null;
    setIsCountingIn(false);
    setCountText('');
    setIsPlaying(false);
    if(reset){ setCurrentStep(-1); currentStepRef.current = -1; stepRef.current=0; }
  };

  const start = async () => {
    if (timer.current) stop(false);
    setIsPlaying(true);
    const max = loopBars*TICKS_PER_BAR;
    const msPerStep = ((60000 / bpmRef.current) * 4) / TICKS_PER_BAR;
    stepRef.current = 0;
    setCurrentStep(0);
    currentStepRef.current = 0;
    playStep(0);
    stepRef.current = 1;
    timer.current = setInterval(()=>{
      const maxNow = stateRef.current.loopBars*TICKS_PER_BAR;
      const step = stepRef.current % maxNow;
      setCurrentStep(step);
      currentStepRef.current = step;
      playStep(step);
      stepRef.current = (step + 1) % maxNow;
    }, msPerStep);
  };

  const requestRecord = async () => {
    if (isRecording || isCountingIn) {
      if (countTimer.current) clearTimeout(countTimer.current);
      countTimer.current = null;
      setIsCountingIn(false);
      setCountText('');
      setIsRecording(false);
      return;
    }

    // Recording arms immediately, even during count-in.
    // This lets early pad hits get captured instead of being ignored.
    if (!timer.current) await start();
    setIsRecording(true);

    if (countInBars === 0) {
      setCountText('REC');
      countTimer.current = setTimeout(() => setCountText(''), 280);
      return;
    }

    setIsCountingIn(true);
    const totalBeats = countInBars * 4;
    const beatMs = 60000 / bpmRef.current;
    let beatIndex = 0;

    const tick = async () => {
      if (beatIndex >= totalBeats) {
        setIsCountingIn(false);
        setCountText('REC');
        countTimer.current = setTimeout(() => setCountText(''), 280);
        return;
      }
      const beatsLeft = totalBeats - beatIndex;
      setCountText(String(beatsLeft));
      playClick(beatIndex % 4 === 0);
      beatIndex += 1;
      countTimer.current = setTimeout(tick, beatMs);
    };

    tick();
  };

  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{ if(isPlaying) start(); },[bpm, loopBars]);

  const recordPad = (i, vel) => {
    playPad(i, vel);
    setSelectedPad(i);
    if(!isRecording) return;
    const raw = currentStepRef.current >= 0 ? currentStepRef.current : 0;
    const gridTicks = getGridTicks(gridResolution);
    const placed = snapToGrid ? snapTick(raw, gridTicks, 1) : raw;
    setPatternLive(prev=>{
      const cleaned = snapToGrid ? removeOffGridNotes(prev, gridTicks) : prev;
      return cleaned.map((row,r)=> r===i ? row.map((v,c)=> c===placed ? vel : v) : row);
    });
  };

  const clearPattern = () => setPatternLive(makePattern(16, loopBars));
  const copyBar = () => setPatternLive(prev => prev.map(row => {
    const first = row.slice(0, TICKS_PER_BAR);
    return Array.from({length: loopBars*TICKS_PER_BAR}, (_, i) => first[i % TICKS_PER_BAR] || 0);
  }));

  return <main className="appLocked">
    {page === 'play' && <PlayPage transport={{isPlaying,start,stop,isRecording,requestRecord,isCountingIn,bpm,loopBars,currentStep}} sequencer={{pads,pattern,setPatternLive,currentStep,loopBars,gridResolution,snapToGrid,muted,setMuted,followPlayhead}} pads={{pads,selectedPad,setSelectedPad,onPad:recordPad,velocity}} />}
    {page === 'samples' && <SamplesPage pads={pads} setPads={setPads} selectedPad={selectedPad} setSelectedPad={setSelectedPad}/>} 
    {page === 'settings' && <SettingsPage bpm={bpm} setBpm={setBpm} loopBars={loopBars} setLoopBars={setLoopBars} quantize={quantize} setQuantize={setQuantize} swing={swing} setSwing={setSwing} metronome={metronome} setMetronome={setMetronome} lowLatency={lowLatency} setLowLatency={setLowLatency} preloadKit={preloadKit} loadStatus={loadStatus} snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid} gridResolution={gridResolution} setGridResolution={setGridResolution} countInBars={countInBars} setCountInBars={setCountInBars} followPlayhead={followPlayhead} setFollowPlayhead={setFollowPlayhead} clearPattern={clearPattern} copyBar={copyBar}/>} 
    {(isCountingIn || countText) && <div className="countOverlay"><b>{countText}</b><span>{isCountingIn ? 'Count-In' : 'Recording'}</span></div>}
    <nav className="bottomNav">
      <button className={page==='play'?'active':''} onClick={()=>setPage('play')}><Music2 size={17}/>Play</button>
      <button className={page==='samples'?'active':''} onClick={()=>setPage('samples')}><Folder size={17}/>Samples</button>
      <button className={page==='settings'?'active':''} onClick={()=>setPage('settings')}><SlidersHorizontal size={17}/>Settings</button>
    </nav>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>);
