let ctx;
export function getAudioContext(){
  if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}
export function playTone(freq=440, duration=.22, type='sine', gain=.08){
  const ac=getAudioContext();
  const o=ac.createOscillator(); const g=ac.createGain();
  o.type=type; o.frequency.value=freq; g.gain.value=gain;
  o.connect(g); g.connect(ac.destination); o.start();
  g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime+duration);
  o.stop(ac.currentTime+duration+.02);
}
export function midiToFreq(m){ return 440 * Math.pow(2,(m-69)/12); }
export function noteToMidi(note, octave=4){
  const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  return (octave+1)*12 + names.indexOf(note);
}
export function playChord(notes){ notes.forEach((n,i)=>playTone(midiToFreq(noteToMidi(n,4+(i>3?1:0))), .45, 'triangle', .055)); }
export function playDrum(id){
  const map={kick:[65,.18,'sine',.16],snare:[180,.12,'square',.07],clap:[260,.08,'sawtooth',.05],hat:[720,.06,'square',.035],tom:[115,.22,'sine',.11],rim:[430,.08,'triangle',.06],perc:[330,.1,'triangle',.05],crash:[980,.25,'sawtooth',.035]};
  const d=map[id]||[240,.1,'triangle',.05]; playTone(...d);
}
