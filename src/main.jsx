import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Settings, Folder, UploadCloud, Search, Trash2, Copy, RotateCcw, SlidersHorizontal, Music2 } from 'lucide-react';
import { FACTORY_CATEGORIES } from './factorySamples';
import './styles.css';

const TICKS_PER_BAR = 96;
const STEP_CELL_WIDTH = 21;
const VIRTUAL_BUFFER_COLS = 12;
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
  { label:'Kick Dirty Club', short:'KICK\nDIRTY', category:'KICKS', sample:'Kick Dirty Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_dirty_club.wav', color:'red', chokeGroup:0 },
  { label:'Kick Super Club', short:'KICK\nSUPER', category:'KICKS', sample:'Kick Super Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_super_club.wav', color:'red', chokeGroup:0 },
  { label:'Snare Trap Knock', short:'SNARE\nKNOCK', category:'SNARES', sample:'Snare Trap Knock', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_trap_knock.wav', color:'orange', chokeGroup:0 },
  { label:'Clap Club', short:'CLAP\nCLUB', category:'CLAPS', sample:'Clap Club', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_club.wav', color:'yellow', chokeGroup:0 },
  { label:'Hat Clean', short:'HAT\nCLEAN', category:'HATS CLOSED', sample:'Hat Clean', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_clean.wav', color:'green', chokeGroup:1 },
  { label:'Open Hat Clean', short:'OPEN\nHAT', category:'HATS OPEN', sample:'Open Hat Clean', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_open_hihats/SOUTHSIDE_open_hihat_clean.wav', color:'teal', chokeGroup:1 },
  { label:'Perc Sticks', short:'PERC\nSTICKS', category:'PERCUSSION', sample:'Perc Sticks', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_sticks.wav', color:'blue', chokeGroup:0 },
  { label:'Perc Bing', short:'PERC\nBING', category:'PERCUSSION', sample:'Perc Bing', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_it_goes_bing.wav', color:'blue', chokeGroup:0 },
  { label:'808 Earshaker', short:'808\nEAR', category:'808S', sample:'808 Earshaker', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_earshaker_Gsharp.wav', color:'purple', chokeGroup:2 },
  { label:'808 Existential', short:'808\nEXIST', category:'808S', sample:'808 Existential', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_808s/SOUTHSIDE_808_existential_C.wav', color:'purple', chokeGroup:2 },
  { label:'Kick Knockr', short:'KICK\nKNOCKR', category:'KICKS', sample:'Kick Knockr', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_kicks/SOUTHSIDE_kick_knockr.wav', color:'pink', chokeGroup:0 },
  { label:'Snare Gritty', short:'SNARE\nGRITTY', category:'SNARES', sample:'Snare Gritty', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_snares/SOUTHSIDE_snare_gritty.wav', color:'pink', chokeGroup:0 },
  { label:'Clap Room', short:'CLAP\nROOM', category:'CLAPS', sample:'Clap Room', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_claps/SOUTHSIDE_clap_room.wav', color:'orange', chokeGroup:0 },
  { label:'Hat MPC Vibe', short:'HAT\nMPC', category:'HATS CLOSED', sample:'Hat MPC Vibe', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_hihats/SOUTHSIDE_closed_hihats/SOUTHSIDE_hihat_mpc_vibe.wav', color:'yellow', chokeGroup:1 },
  { label:'Perc Pull Up', short:'PERC\nPULL', category:'PERCUSSION', sample:'Perc Pull Up', url:'/factory/SOUTHSIDE_drums/SOUTHSIDE_percussion/SOUTHSIDE_percussion_pull_up.wav', color:'green', chokeGroup:0 },
  { label:'User Sample', short:'USER\nSAMPLE', category:'USER', sample:'Empty', url:null, color:'gray', chokeGroup:0 },
];

function useDrumAudio(pads, volume = 1, lowLatency = true, maxPolyphony = 32) {
  const ctxRef = useRef(null);
  const bufferMap = useRef(new Map());
  const reverseMap = useRef(new Map());
  const loadingMap = useRef(new Map());
  const activeVoicesRef = useRef([]);
  const [activeVoices, setActiveVoices] = useState(0);
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

  const refreshVoiceCount = () => setActiveVoices(activeVoicesRef.current.length);
  const removeVoice = (voice) => {
    activeVoicesRef.current = activeVoicesRef.current.filter(v => v !== voice);
    refreshVoiceCount();
  };
  const stopVoice = (voice) => {
    try {
      const now = ctxRef.current?.currentTime || 0;
      voice.gain?.gain?.cancelScheduledValues(now);
      voice.gain?.gain?.setValueAtTime(Math.max(0.0001, voice.gain.gain.value || 0.0001), now);
      voice.gain?.gain?.exponentialRampToValueAtTime(0.0001, now + 0.015);
      voice.source?.stop(now + 0.018);
    } catch {}
    removeVoice(voice);
  };
  const enforcePolyphony = (chokeGroup = 0) => {
    if (chokeGroup > 0) {
      activeVoicesRef.current
        .filter(v => v.chokeGroup === chokeGroup)
        .forEach(stopVoice);
    }
    while (activeVoicesRef.current.length >= maxPolyphony) {
      const oldest = activeVoicesRef.current[0];
      if (!oldest) break;
      stopVoice(oldest);
    }
  };

  const makeReverseBuffer = (ctx, buffer) => {
    const key = buffer.__jamroomReverseKey || `${buffer.length}-${buffer.sampleRate}-${buffer.numberOfChannels}`;
    buffer.__jamroomReverseKey = key;
    if (reverseMap.current.has(key)) return reverseMap.current.get(key);
    const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j];
    }
    reverseMap.current.set(key, reversed);
    return reversed;
  };

  const triggerBuffer = (ctx, buffer, pad, velocity = 100, when = 0) => {
    const effectiveChoke = pad?.voiceMode === 'mono' ? 1000 + (pad?.padIndex || 0) : (pad?.chokeGroup || 0);
    enforcePolyphony(effectiveChoke);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const panNode = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const padVol = pad?.volume ?? 1;
    const tune = pad?.tune ?? 0;
    const fine = pad?.fine ?? 0;
    const useBuffer = pad?.reverse ? makeReverseBuffer(ctx, buffer) : buffer;
    const trimStartPct = Math.max(0, Math.min(99, pad?.trimStart ?? 0));
    const trimEndPct = Math.max(trimStartPct + 1, Math.min(100, pad?.trimEnd ?? 100));
    const offset = useBuffer.duration * (trimStartPct / 100);
    const endTime = useBuffer.duration * (trimEndPct / 100);
    const duration = Math.max(0.01, endTime - offset);
    source.buffer = useBuffer;
    source.playbackRate.value = Math.pow(2, (tune + fine / 100) / 12);
    if (pad?.loopSample) {
      source.loop = true;
      source.loopStart = offset;
      source.loopEnd = endTime;
    }
    gain.gain.value = Math.max(0.001, (velocity / 127) * volume * padVol);
    if (panNode) {
      panNode.pan.value = Math.max(-1, Math.min(1, pad?.pan ?? 0));
      source.connect(gain).connect(panNode).connect(ctx.destination);
    } else {
      source.connect(gain).connect(ctx.destination);
    }
    const voice = { source, gain, startedAt: ctx.currentTime, chokeGroup: effectiveChoke };
    activeVoicesRef.current.push(voice);
    refreshVoiceCount();
    source.onended = () => removeVoice(voice);
    if (pad?.loopSample) source.start(ctx.currentTime + Math.max(0, when), offset);
    else source.start(ctx.currentTime + Math.max(0, when), offset, duration);
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
    enforcePolyphony(pad?.voiceMode === 'mono' ? 1000 : (pad?.chokeGroup || 0));
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
      triggerBuffer(ctx, cached, {...pad, padIndex}, velocity, when);
      return;
    }
    (async () => {
      try {
        const activeCtx = await ensureContext();
        const buffer = await loadBuffer(pad);
        if (buffer) triggerBuffer(activeCtx, buffer, {...pad, padIndex}, velocity, when);
        else await playFallback(pad, velocity);
      } catch {
        await playFallback(pad, velocity);
      }
    })();
  };

  return { playPad, playClick, preloadKit, loadStatus, activeVoices };
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

function Sequencer({ pads, pattern, setPatternLive, currentStep, loopBars, gridResolution, snapToGrid, muted, setMuted, followPlayhead, editingPad, onEditPad }) {
  const totalTicks = loopBars * TICKS_PER_BAR;
  const gridTicks = getGridTicks(gridResolution);
  const columns = Math.ceil(totalTicks / gridTicks);
  const rowsRef = useRef(null);
  const touchScrollRef = useRef({ active: false, startX: 0, startY: 0, startLeft: 0, startTop: 0, moved: false });
  const gestureGuardUntilRef = useRef(0);
  const firstTouchRef = useRef(null);
  const [viewport, setViewport] = useState({ left: 0, top: 0, width: 1, height: 1 });

  const updateViewport = () => {
    const el = rowsRef.current;
    if (!el) return;
    setViewport({ left: el.scrollLeft, top: el.scrollTop, width: el.clientWidth, height: el.clientHeight });
  };

  useEffect(() => {
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, [loopBars, gridResolution]);

  useEffect(() => {
    const el = rowsRef.current;
    if (!el || !followPlayhead || currentStep < 0 || touchScrollRef.current.active) return;
    const currentCol = Math.floor(currentStep / gridTicks);
    const target = currentCol * STEP_CELL_WIDTH - el.clientWidth * 0.5;
    const maxLeft = Math.max(0, el.scrollWidth - el.clientWidth);
    const nextLeft = Math.max(0, Math.min(maxLeft, target));
    if (Math.abs(el.scrollLeft - nextLeft) > STEP_CELL_WIDTH * 2) {
      el.scrollLeft = nextLeft;
      updateViewport();
    }
  }, [currentStep, followPlayhead, loopBars, gridTicks]);

  const avgTouchX = (touches) => (touches[0].clientX + touches[1].clientX) / 2;
  const avgTouchY = (touches) => (touches[0].clientY + touches[1].clientY) / 2;

  const onGridTouchStart = (event) => {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      firstTouchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
      return;
    }
    if (event.touches.length >= 2 && rowsRef.current) {
      gestureGuardUntilRef.current = Date.now() + 90;
      touchScrollRef.current = {
        active: true,
        moved: false,
        startX: avgTouchX(event.touches),
        startY: avgTouchY(event.touches),
        startLeft: rowsRef.current.scrollLeft,
        startTop: rowsRef.current.scrollTop,
      };
      event.preventDefault();
    }
  };

  const onGridTouchMove = (event) => {
    const el = rowsRef.current;
    if (!el) return;
    if (event.touches.length >= 2) {
      if (!touchScrollRef.current.active) {
        touchScrollRef.current = {
          active: true,
          moved: false,
          startX: avgTouchX(event.touches),
          startY: avgTouchY(event.touches),
          startLeft: el.scrollLeft,
          startTop: el.scrollTop,
        };
      }
      const deltaX = avgTouchX(event.touches) - touchScrollRef.current.startX;
      const deltaY = avgTouchY(event.touches) - touchScrollRef.current.startY;
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) touchScrollRef.current.moved = true;
      el.scrollLeft = touchScrollRef.current.startLeft - deltaX;
      el.scrollTop = touchScrollRef.current.startTop - deltaY;
      updateViewport();
      gestureGuardUntilRef.current = Date.now() + 90;
      event.preventDefault();
      return;
    }
    if (event.touches.length === 1) event.preventDefault();
  };

  const onGridTouchEnd = (event) => {
    if (!event.touches || event.touches.length < 2) {
      const wasPanning = touchScrollRef.current.active && touchScrollRef.current.moved;
      touchScrollRef.current.active = false;
      if (wasPanning) gestureGuardUntilRef.current = Date.now() + 120;
    }
  };

  const toggleGridCell = (r, cellIndex) => {
    const rawTick = Math.min(totalTicks - 1, cellIndex * gridTicks);
    const tick = snapToGrid ? snapTick(rawTick, gridTicks, 1) : rawTick;
    setPatternLive(prev => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === tick ? (v ? 0 : 100) : v) : row));
  };

  const queueGridToggle = (event, r, c) => {
    event.preventDefault();
    if (touchScrollRef.current.active || Date.now() < gestureGuardUntilRef.current) return;
    // Performance pass: one-finger note entry is instant again. Two-finger panning
    // is protected by the gesture guard and movement threshold above.
    toggleGridCell(r, c);
  };

  const displayHit = (row, cellIndex) => row[Math.min(totalTicks - 1, cellIndex * gridTicks)] || 0;
  const currentCol = currentStep >= 0 ? Math.floor(currentStep / gridTicks) : -1;
  const startCol = Math.max(0, Math.floor(viewport.left / STEP_CELL_WIDTH) - VIRTUAL_BUFFER_COLS);
  const visibleCount = Math.ceil(viewport.width / STEP_CELL_WIDTH) + VIRTUAL_BUFFER_COLS * 2;
  const endCol = Math.min(columns, startCol + visibleCount);
  const visibleColumns = Array.from({ length: Math.max(0, endCol - startCol) }, (_, i) => startCol + i);

  return <section className="playSequencer">
    <div className="seqHeader"><span>SEQUENCER</span><small>{gridResolution} beat · snap {snapToGrid?'on':'off'}</small></div>
    <div className="barNumbers">{Array.from({length: loopBars}, (_, i)=><span key={i} style={{left:`${(i/loopBars)*100}%`}}>{i+1}</span>)}</div>
    <div className="seqRows" ref={rowsRef} onScroll={updateViewport} onTouchStart={onGridTouchStart} onTouchMove={onGridTouchMove} onTouchEnd={onGridTouchEnd} onTouchCancel={onGridTouchEnd}>
      {pads.map((pad, r) => <div className="seqRow" key={r}>
        <button className={`rowName ${muted[r]?'muted':''} ${editingPad===r?'editing':''}`} onClick={()=>onEditPad(r)}><i className={pad.color}></i><b>{r+1}</b><span>{pad.label}</span></button>
        <div className="stepGridVirtual" style={{width:`${columns * STEP_CELL_WIDTH}px`}}>
          <div className="visibleSteps" style={{transform:`translateX(${startCol * STEP_CELL_WIDTH}px)`}}>
            {visibleColumns.map((c) => {
              const tick = c * gridTicks;
              const now = currentCol === c;
              return <button key={c} onPointerDown={(e)=>queueGridToggle(e,r,c)} className={`step ${displayHit(pattern[r] || [], c) ? 'hit' : ''} ${now?'now':''} ${tick % 24 === 0?'beat':''} ${tick % TICKS_PER_BAR === 0?'barStep':''}`}></button>
            })}
          </div>
        </div>
      </div>)}
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


function TrackEditor({ padIndex, pads, setPads, onClose, onPreview }) {
  const [editorPage, setEditorPage] = useState(0);
  const gesture = useRef({ holdTimer: null, armed: false, startX: 0, startY: 0 });
  const pad = pads[padIndex];
  const setPadValue = (key, value) => setPads(prev => prev.map((p, i) => i === padIndex ? { ...p, [key]: value } : p));
  if (!pad) return null;

  const beginEditorGesture = (event) => {
    if (event.target.closest('button,input,select')) return;
    gesture.current.startX = event.clientX;
    gesture.current.startY = event.clientY;
    gesture.current.armed = false;
    clearTimeout(gesture.current.holdTimer);
    gesture.current.holdTimer = setTimeout(() => {
      gesture.current.armed = true;
    }, 500);
  };
  const moveEditorGesture = (event) => {
    if (!gesture.current.armed) return;
    event.preventDefault();
  };
  const endEditorGesture = (event) => {
    clearTimeout(gesture.current.holdTimer);
    if (!gesture.current.armed) return;
    const dx = event.clientX - gesture.current.startX;
    if (dx < -48) setEditorPage(1);
    if (dx > 48) setEditorPage(0);
    gesture.current.armed = false;
  };

  const trimStart = pad.trimStart ?? 0;
  const trimEnd = pad.trimEnd ?? 100;

  return <section className="trackEditor fixedPadEditor" onPointerDown={beginEditorGesture} onPointerMove={moveEditorGesture} onPointerUp={endEditorGesture} onPointerCancel={endEditorGesture}>
    <div className="editorTop miniEditorTop">
      <button className="backBtn" onClick={onClose}>‹</button>
      <div className="editorTitle"><small>{editorPage === 0 ? 'PAD EDITOR' : 'TRIM / LOOP'}</small><b><i className={pad.color}></i>{padIndex + 1} {pad.label}</b></div>
      <button className="previewBtn" onClick={() => onPreview(padIndex)}>▶</button>
      <button className="closeBtn" onClick={onClose}>×</button>
    </div>

    <div className="editorPageTabs">
      <button className={editorPage===0?'active':''} onClick={()=>setEditorPage(0)}>Params</button>
      <button className={editorPage===1?'active':''} onClick={()=>setEditorPage(1)}>Trim / Loop</button>
      <span>Hold 0.5s + swipe</span>
    </div>

    {editorPage === 0 ? <div className="minimalEditorGrid">
      <label className="editorControl"><span>Volume</span><input type="range" min="0" max="2" step="0.01" value={pad.volume ?? 1} onChange={e=>setPadValue('volume', Number(e.target.value))}/><b>{(((pad.volume ?? 1)-1)*12).toFixed(1)} dB</b></label>
      <label className="editorControl"><span>Pan</span><input type="range" min="-1" max="1" step="0.01" value={pad.pan ?? 0} onChange={e=>setPadValue('pan', Number(e.target.value))}/><b>{(pad.pan ?? 0) === 0 ? 'C' : (pad.pan ?? 0) < 0 ? 'L' : 'R'}</b></label>
      <label className="editorControl"><span>Pitch</span><input type="range" min="-24" max="24" step="1" value={pad.tune ?? 0} onChange={e=>setPadValue('tune', Number(e.target.value))}/><b>{pad.tune ?? 0} st</b></label>
      <label className="editorControl"><span>Fine</span><input type="range" min="-100" max="100" step="1" value={pad.fine ?? 0} onChange={e=>setPadValue('fine', Number(e.target.value))}/><b>{pad.fine ?? 0} ct</b></label>
      <div className="editorSelectRow"><span>Choke</span><select value={pad.chokeGroup ?? 0} onChange={e=>setPadValue('chokeGroup', Number(e.target.value))}>{[0,1,2,3,4,5,6,7,8].map(g=><option key={g} value={g}>{g===0?'Off':`Group ${g}`}</option>)}</select></div>
      <div className="editorSelectRow"><span>Voice</span><select value={pad.voiceMode || 'poly'} onChange={e=>setPadValue('voiceMode', e.target.value)}>{['poly','mono'].map(mode=><option key={mode} value={mode}>{mode}</option>)}</select></div>
      <div className="editorActionRow"><button className={pad.mute?'active':''} onClick={()=>setPadValue('mute', !pad.mute)}>Mute</button><button className={pad.solo?'active':''} onClick={()=>setPadValue('solo', !pad.solo)}>Solo</button><button onClick={onClose}>Close</button></div>
    </div> : <div className="trimEditorGrid">
      <div className="trimReadout"><span>Start <b>{trimStart}%</b></span><span>Length <b>{Math.max(1, trimEnd-trimStart)}%</b></span><span>End <b>{trimEnd}%</b></span></div>
      <div className="trimWave">
        {Array.from({length: 56}, (_, i) => <span key={i} style={{height:`${18 + Math.abs(Math.sin(i*.41))*48*(1-i/70)}%`}} />)}
        <i className="trimMarker start" style={{left:`${trimStart}%`}} />
        <i className="trimMarker end" style={{left:`${trimEnd}%`}} />
      </div>
      <label className="editorControl wideControl"><span>Start</span><input type="range" min="0" max="95" step="1" value={trimStart} onChange={e=>setPadValue('trimStart', Math.min(Number(e.target.value), trimEnd-1))}/><b>{trimStart}%</b></label>
      <label className="editorControl wideControl"><span>End</span><input type="range" min="5" max="100" step="1" value={trimEnd} onChange={e=>setPadValue('trimEnd', Math.max(Number(e.target.value), trimStart+1))}/><b>{trimEnd}%</b></label>
      <div className="trimActions"><button className={pad.loopSample?'active':''} onClick={()=>setPadValue('loopSample', !pad.loopSample)}>Loop {pad.loopSample?'ON':'OFF'}</button><button className={pad.reverse?'active':''} onClick={()=>setPadValue('reverse', !pad.reverse)}>Reverse {pad.reverse?'ON':'OFF'}</button><button onClick={()=>{setPadValue('trimStart',0);setPadValue('trimEnd',100);}}>Reset</button></div>
      <button className="previewWide" onClick={()=>onPreview(padIndex)}>Preview Selection</button>
    </div>}
  </section>
}

function PlayPage(props) {
  return <div className="playPage">
    <MiniTransport {...props.transport}/>
    <Sequencer {...props.sequencer}/>
    {props.editor.editingPad !== null ? <TrackEditor {...props.editor}/> : <MpcPads {...props.pads}/>}
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
    <label className="padSetting">Choke Group
      <select value={pads[selectedPad]?.chokeGroup || 0} onChange={e=>setPads(prev=>prev.map((p,i)=>i===selectedPad?{...p,chokeGroup:Number(e.target.value)}:p))}>
        {[0,1,2,3,4,5,6,7,8].map(g=><option key={g} value={g}>{g===0?'Off':`Group ${g}`}</option>)}
      </select>
    </label>
    <label className="import"><UploadCloud size={20}/><span>Import Sample</span><input type="file" accept="audio/*,.wav,.mp3,.aiff" onChange={e=>importSample(e.target.files?.[0])}/></label>
    <div className="search"><input placeholder="Search factory sounds..." value={query} onChange={e=>setQuery(e.target.value)}/><Search size={18}/></div>
    {cats.map(cat => <div className="catBlock" key={cat.name}>
      <button className="cat" onClick={()=>setOpenCat(openCat===cat.name?'':cat.name)}><Folder size={18}/><span>{cat.name}</span><em>{cat.samples.length}</em></button>
      {openCat===cat.name && <div className="sampleList">{cat.samples.slice(0,40).map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div>}
    </div>)}
    {localSamples.length>0 && <div className="sampleList">{localSamples.map(s=><button key={s.url} onClick={()=>assign(s)}>{s.name}</button>)}</div>}
  </div>
}

function SettingsPage({ bpm,setBpm,loopBars,setLoopBars,quantize,setQuantize,swing,setSwing,metronome,setMetronome,lowLatency,setLowLatency,preloadKit,loadStatus,snapToGrid,setSnapToGrid,gridResolution,setGridResolution,countInBars,setCountInBars,followPlayhead,setFollowPlayhead,maxPolyphony,setMaxPolyphony,activeVoices,clearPattern,copyBar }) {
  return <div className="settingsPage pageScroll">
    <h2>Settings</h2>
    <div className="settingsGrid">
      <div className="bpmStepper"><span>BPM</span><button onClick={()=>setBpm(v=>Math.max(40, v-1))}>−</button><b>{bpm}</b><button onClick={()=>setBpm(v=>Math.min(240, v+1))}>+</button></div>
      <label>Loop Bars<select value={loopBars} onChange={e=>setLoopBars(Number(e.target.value))}>{[1,2,4,8,16].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Count-In<select value={countInBars} onChange={e=>setCountInBars(Number(e.target.value))}>{[0,1,2,4].map(x=><option key={x} value={x}>{x === 0 ? 'Off' : `${x} Bar${x>1?'s':''}`}</option>)}</select></label>
      <label>Polyphony<select value={maxPolyphony} onChange={e=>setMaxPolyphony(Number(e.target.value))}>{[16,32,64].map(x=><option key={x} value={x}>{x} Voices</option>)}</select></label>
      <div className="voiceMeter"><span>Voices</span><b>{activeVoices}/{maxPolyphony}</b><em style={{width:`${Math.min(100,(activeVoices/maxPolyphony)*100)}%`}} /></div>
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
  const [pads,setPads]=useState(() => defaultPads.map(p => ({ volume:1, pan:0, tune:0, fine:0, attack:0, decay:250, release:120, voiceMode:'poly', mute:false, solo:false, filter:0, distortion:0, reverb:0, trimStart:0, trimEnd:100, loopSample:false, reverse:false, ...p })));
  const [editingPad,setEditingPad]=useState(null);
  const [selectedPad,setSelectedPad]=useState(0);
  const [velocity]=useState(110);
  const [gridResolution,setGridResolution]=useState('1/16');
  const [snapToGrid,setSnapToGrid]=useState(true);
  const [followPlayhead,setFollowPlayhead]=useState(false);
  const [maxPolyphony,setMaxPolyphony]=useState(32);
  const [muted,setMuted]=useState({});
  const [page,setPage]=useState('play');
  const timer = useRef(null);
  const countTimer = useRef(null);
  const rafRef = useRef(null);
  const lastUiStepRef = useRef(-999);
  const stepRef = useRef(0);
  const currentStepRef = useRef(-1);
  const patternRef = useRef(pattern);
  const bpmRef = useRef(bpm);
  const stateRef = useRef({ muted, metronome, loopBars });
  const { playPad, playClick, preloadKit, loadStatus, activeVoices } = useDrumAudio(pads, 1, lowLatency, maxPolyphony);

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
    const anySolo = pads.some(p => p.solo);
    for (let r=0; r<pat.length; r++) {
      const velocityAtStep = pat[r]?.[step] || 0;
      const pad = pads[r];
      const blocked = mutedNow[r] || pad?.mute || (anySolo && !pad?.solo);
      if (velocityAtStep && !blocked) playPad(r, velocityAtStep);
    }
    if (metroNow && step % 24 === 0) playClick(step % TICKS_PER_BAR === 0);
  };

  const stop = (reset=true)=>{
    if(timer.current) clearInterval(timer.current);
    if(countTimer.current) clearTimeout(countTimer.current);
    timer.current=null;
    countTimer.current=null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current=null;
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
      currentStepRef.current = step;
      playStep(step);
      stepRef.current = (step + 1) % maxNow;
    }, msPerStep);
  };


  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const loop = () => {
      const step = currentStepRef.current;
      if (step !== lastUiStepRef.current) {
        lastUiStepRef.current = step;
        setCurrentStep(step);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying]);

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
    {page === 'play' && <PlayPage transport={{isPlaying,start,stop,isRecording,requestRecord,isCountingIn,bpm,loopBars,currentStep}} sequencer={{pads,pattern,setPatternLive,currentStep,loopBars,gridResolution,snapToGrid,muted,setMuted,followPlayhead,editingPad,onEditPad:(i)=>{setSelectedPad(i); setEditingPad(prev => prev === i ? null : i);}}} pads={{pads,selectedPad,setSelectedPad,onPad:recordPad,velocity}} editor={{padIndex: editingPad, pads, setPads, onClose:()=>setEditingPad(null), onPreview:(i)=>playPad(i, velocity), openSamples:()=>{setSelectedPad(editingPad ?? selectedPad); setPage('samples');}}} />}
    {page === 'samples' && <SamplesPage pads={pads} setPads={setPads} selectedPad={selectedPad} setSelectedPad={setSelectedPad}/>} 
    {page === 'settings' && <SettingsPage bpm={bpm} setBpm={setBpm} loopBars={loopBars} setLoopBars={setLoopBars} quantize={quantize} setQuantize={setQuantize} swing={swing} setSwing={setSwing} metronome={metronome} setMetronome={setMetronome} lowLatency={lowLatency} setLowLatency={setLowLatency} preloadKit={preloadKit} loadStatus={loadStatus} snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid} gridResolution={gridResolution} setGridResolution={setGridResolution} countInBars={countInBars} setCountInBars={setCountInBars} followPlayhead={followPlayhead} setFollowPlayhead={setFollowPlayhead} maxPolyphony={maxPolyphony} setMaxPolyphony={setMaxPolyphony} activeVoices={activeVoices} clearPattern={clearPattern} copyBar={copyBar}/>} 
    {(isCountingIn || countText) && <div className="countOverlay"><b>{countText}</b><span>{isCountingIn ? 'Count-In' : 'Recording'}</span></div>}
    <nav className="bottomNav">
      <button className={page==='play'?'active':''} onClick={()=>setPage('play')}><Music2 size={17}/>Play</button>
      <button className={page==='samples'?'active':''} onClick={()=>setPage('samples')}><Folder size={17}/>Samples</button>
      <button className={page==='settings'?'active':''} onClick={()=>setPage('settings')}><SlidersHorizontal size={17}/>Settings</button>
    </nav>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>);