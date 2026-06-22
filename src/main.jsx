import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Play, Square, Circle, Upload, Music2, SlidersHorizontal, Drum, Piano, Waves } from 'lucide-react';
import './styles.css';
import { NOTE_NAMES, MODES, DENSITIES, DRUM_PADS, buildChord } from './data/musicTheory';
import { playChord, playDrum } from './lib/audioEngine';

const GRID_STEPS = 32;
const PIANO_ROWS = ['C5','B4','A4','G4','F4','E4','D4','C4'];

function Transport({settings,setSettings,isPlaying,setPlaying}){
 const set=(k,v)=>setSettings(s=>({...s,[k]:v}));
 return <section className="transport glass">
  <button className="round primary" onClick={()=>setPlaying(true)}><Play size={18}/></button>
  <button className="round" onClick={()=>setPlaying(false)}><Square size={18}/></button>
  <button className="round record"><Circle size={18}/></button>
  <label>BPM<input type="number" value={settings.bpm} onChange={e=>set('bpm',+e.target.value)} /></label>
  <label>Loop<select value={settings.loopBars} onChange={e=>set('loopBars',+e.target.value)}>{[1,2,4,8,16,32,64].map(v=><option key={v} value={v}>{v} Bars</option>)}</select></label>
  <label>Quantize<select value={settings.quantizeGrid} onChange={e=>set('quantizeGrid',e.target.value)}>{['1/4','1/8','1/16','1/32','1/64'].map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Strength<input type="range" min="0" max="100" value={settings.quantizeStrength} onChange={e=>set('quantizeStrength',+e.target.value)}/><span>{settings.quantizeStrength}%</span></label>
  <label>Swing<input type="range" min="50" max="75" value={settings.swing} onChange={e=>set('swing',+e.target.value)}/><span>{settings.swing}%</span></label>
  <button className={settings.metro?'pill active':'pill'} onClick={()=>set('metro',!settings.metro)}>Metronome</button>
  <span className={isPlaying?'status live':'status'}>{isPlaying?'Playing loop':'Stopped'}</span>
 </section>
}

function Timeline({audioClips, chordNotes, drumGrid}){
 const hits=Object.values(drumGrid).flat().filter(Boolean).length;
 return <section className="panel timeline"><div className="sectionTitle"><Waves/>Timeline / Loop Playlist</div>
  <div className="barRuler">{Array.from({length:8},(_,i)=><span key={i}>Bar {i+1}</span>)}</div>
  <TrackLane name="Voice idea" type="wave" blocks={audioClips.length?audioClips:['default']}/>
  <TrackLane name="Harmony" type="wave" blocks={['soft']}/>
  <div className="lane"><b>Chord MIDI</b><div className="miniNotes">{chordNotes.map((n,i)=><span key={i}>{n}</span>)}</div></div>
  <div className="lane"><b>Drums MIDI</b><div className="drumSummary">{hits} hits in loop</div></div>
 </section>
}
function TrackLane({name,type,blocks}){ return <div className="lane"><b>{name}</b><div className="waveform">{Array.from({length:90},(_,i)=><i key={i} style={{height:`${12+Math.abs(Math.sin(i*.48))*38}px`}}/> )}</div></div> }

function DrumMachine({drumGrid,setDrumGrid,isRecording}){
 const toggle=(pad,step)=>setDrumGrid(g=>({...g,[pad]:g[pad].map((v,i)=>i===step?!v:v)}));
 const hitPad=(id)=>{ playDrum(id); if(isRecording){ const step=Math.floor(Math.random()*GRID_STEPS); toggle(id,step); } };
 return <section className="panel drumMachine"><div className="sectionTitle"><Drum/>Drum Machine: grid top, pads bottom</div>
  <div className="stepGrid">
   <div className="corner">Pad</div>{Array.from({length:GRID_STEPS},(_,i)=><div className="stepHead" key={i}>{i+1}</div>)}
   {DRUM_PADS.slice(0,8).map(p=><React.Fragment key={p.id}><div className="rowLabel">{p.name}</div>{Array.from({length:GRID_STEPS},(_,i)=><button key={i} className={drumGrid[p.id]?.[i]?'cell on':'cell'} onClick={()=>toggle(p.id,i)} />)}</React.Fragment>)}
  </div>
  <div className="padBank">{DRUM_PADS.map(p=><button className={`pad ${p.color}`} key={p.id} onClick={()=>hitPad(p.id)}><span>{p.name}</span><small>tap / record</small></button>)}</div>
 </section>
}

function ChordPlayer({settings,setSettings,chordNotes,setChordNotes}){
 const densityObj=DENSITIES.find(d=>d.id===settings.density);
 const playDegree=(i)=>{ const c=buildChord(settings.key,settings.mode,i,settings.density); setChordNotes(c.notes); playChord(c.notes); };
 const set=(k,v)=>setSettings(s=>({...s,[k]:v}));
 return <section className="panel"><div className="sectionTitle"><Music2/>One-Finger Chord Player</div>
  <div className="controlsGrid">
   <label>Key<select value={settings.key} onChange={e=>set('key',e.target.value)}>{NOTE_NAMES.map(n=><option key={n}>{n}</option>)}</select></label>
   <label>Mode<select value={settings.mode} onChange={e=>set('mode',e.target.value)}>{Object.keys(MODES).map(m=><option key={m}>{m}</option>)}</select></label>
   <label>Density<select value={settings.density} onChange={e=>set('density',+e.target.value)}>{DENSITIES.map(d=><option key={d.id} value={d.id}>{d.id} Notes: {d.label}</option>)}</select></label>
  </div>
  <div className="keyboard">{NOTE_NAMES.filter(n=>!n.includes('#')).map((n,i)=><button key={n} onClick={()=>playDegree(i)}>{n}<small>{buildChord(settings.key,settings.mode,i,settings.density).root}{buildChord(settings.key,settings.mode,i,settings.density).quality}</small></button>)}</div>
  <div className="theoryBox"><b>{densityObj.label}</b>: {densityObj.desc}. <b>Density</b> = notes sounding. <b>Voicing</b> = octave spacing. <b>Extensions</b> = 9ths, 11ths, 13ths.</div>
 </section>
}

function PianoRoll({chordNotes}){
 return <section className="panel"><div className="sectionTitle"><Piano/>Piano Roll</div>
  <div className="pianoRoll">{PIANO_ROWS.map(row=><React.Fragment key={row}><div className="pianoLabel">{row}</div>{Array.from({length:16},(_,i)=>{ const active=chordNotes.some(n=>row.startsWith(n)); return <div key={i} className={active && i<4?'noteCell active':'noteCell'} />})}</React.Fragment>)}</div>
  <div className="buttonRow"><button>Quantize Notes</button><button>Duplicate Bar</button><button>Transpose +12</button><button>Clear Selected</button></div>
 </section>
}

function AudioImporter({audioClips,setAudioClips}){
 const onFile=e=>{ const files=[...e.target.files].map(f=>({name:f.name,url:URL.createObjectURL(f)})); setAudioClips(c=>[...c,...files]); };
 return <section className="panel"><div className="sectionTitle"><Upload/>Audio Import / Wave Clips</div>
  <label className="dropZone"><input type="file" multiple accept="audio/*" onChange={onFile}/>Import WAV / MP3 / AIFF samples</label>
  <div className="clipList">{audioClips.map((c,i)=><div className="clip" key={i}><b>{c.name}</b><div className="waveform small">{Array.from({length:60},(_,j)=><i key={j} style={{height:`${8+Math.abs(Math.sin(j*.7+i))*26}px`}} />)}</div></div>)}</div>
 </section>
}

function App(){
 const [settings,setSettings]=useState({bpm:120, loopBars:8, quantizeGrid:'1/16', quantizeStrength:75, swing:58, metro:true, key:'C', mode:'Ionian', density:4});
 const [isPlaying,setPlaying]=useState(false); const [isRecording,setRecording]=useState(false);
 const [chordNotes,setChordNotes]=useState(['C','E','G','B']);
 const [audioClips,setAudioClips]=useState([]);
 const [drumGrid,setDrumGrid]=useState(()=>Object.fromEntries(DRUM_PADS.map(p=>[p.id,Array(GRID_STEPS).fill(false)])));
 return <main><header className="hero"><div><h1>JamRoom</h1><p>Collaborative loop DAW: drum pads, MIDI grid, chord engine, waveforms.</p></div><button className={isRecording?'pill danger active':'pill'} onClick={()=>setRecording(!isRecording)}>{isRecording?'Recording Pads':'Pad Record Off'}</button></header>
  <Transport settings={settings} setSettings={setSettings} isPlaying={isPlaying} setPlaying={setPlaying}/>
  <div className="layout"><div className="left"><Timeline audioClips={audioClips} chordNotes={chordNotes} drumGrid={drumGrid}/><DrumMachine drumGrid={drumGrid} setDrumGrid={setDrumGrid} isRecording={isRecording}/></div><aside><ChordPlayer settings={settings} setSettings={setSettings} chordNotes={chordNotes} setChordNotes={setChordNotes}/><PianoRoll chordNotes={chordNotes}/><AudioImporter audioClips={audioClips} setAudioClips={setAudioClips}/></aside></div>
 </main>
}

createRoot(document.getElementById('root')).render(<App/>);
