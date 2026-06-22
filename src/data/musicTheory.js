export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const MODES = {
  Ionian:       { offset: 0, steps: [0,2,4,5,7,9,11], degrees: ['maj7','m7','m7','maj7','7','m7','m7b5'] },
  Dorian:       { offset: 1, steps: [0,2,3,5,7,9,10], degrees: ['m7','m7','maj7','7','m7','m7b5','maj7'] },
  Phrygian:     { offset: 2, steps: [0,1,3,5,7,8,10], degrees: ['m7','maj7','7','m7','m7b5','maj7','m7'] },
  Lydian:       { offset: 3, steps: [0,2,4,6,7,9,11], degrees: ['maj7','7','m7','m7b5','maj7','m7','m7'] },
  Mixolydian:   { offset: 4, steps: [0,2,4,5,7,9,10], degrees: ['7','m7','m7b5','maj7','m7','m7','maj7'] },
  Aeolian:      { offset: 5, steps: [0,2,3,5,7,8,10], degrees: ['m7','m7b5','maj7','m7','m7','maj7','7'] },
  Locrian:      { offset: 6, steps: [0,1,3,5,6,8,10], degrees: ['m7b5','maj7','m7','m7','maj7','7','m7'] }
};

export const DENSITIES = [
  { id: 2, label: 'Dyad', desc: '2 notes / interval' },
  { id: 3, label: 'Triad', desc: '3 notes' },
  { id: 4, label: 'Tetrad', desc: '4 notes / seventh chord' },
  { id: 5, label: 'Pentad', desc: '5 notes / extension' },
  { id: 6, label: 'Hexad', desc: '6 notes' },
  { id: 7, label: 'Heptad', desc: '7 notes' }
];

export const DRUM_PADS = [
  { id:'kick', name:'KICK', color:'hot' }, { id:'snare', name:'SNARE', color:'hot' },
  { id:'clap', name:'CLAP', color:'hot' }, { id:'hat', name:'HAT', color:'cool' },
  { id:'tom', name:'TOM', color:'cool' }, { id:'rim', name:'RIM', color:'cool' },
  { id:'perc', name:'PERC', color:'cool' }, { id:'crash', name:'CRASH', color:'hot' },
  { id:'pad9', name:'PAD 9', color:'dim' }, { id:'pad10', name:'PAD 10', color:'dim' },
  { id:'pad11', name:'PAD 11', color:'dim' }, { id:'pad12', name:'PAD 12', color:'dim' },
  { id:'pad13', name:'PAD 13', color:'dim' }, { id:'pad14', name:'PAD 14', color:'dim' },
  { id:'pad15', name:'PAD 15', color:'dim' }, { id:'pad16', name:'PAD 16', color:'dim' }
];

export function noteIndex(note) { return NOTE_NAMES.indexOf(note); }
export function transpose(note, semitones) { return NOTE_NAMES[(noteIndex(note)+semitones+120)%12]; }

export function buildScale(key, mode) {
  const root = noteIndex(key);
  return MODES[mode].steps.map(s => NOTE_NAMES[(root+s)%12]);
}

export function buildChord(key, mode, degreeIndex, density) {
  const scale = buildScale(key, mode);
  const root = scale[degreeIndex];
  const notes = [];
  for (let i=0; i<density; i++) notes.push(scale[(degreeIndex + i*2) % 7]);
  return { root, quality: MODES[mode].degrees[degreeIndex], notes };
}
