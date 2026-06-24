import { FACTORY_CATEGORIES } from './factorySamples.js';

const TICKS_PER_BAR = 96;
const TICKS_PER_BEAT = 24;
const GRID_OPTIONS = [
  { label: '1/4', ticks: 24 },
  { label: '1/8', ticks: 12 },
  { label: '1/16', ticks: 6 },
  { label: '1/32', ticks: 3 },
];
const SNAP_OPTIONS = [
  { label: 'Bar', ticks: TICKS_PER_BAR },
  { label: '1/2 bar', ticks: TICKS_PER_BAR / 2 },
  { label: '1 beat', ticks: TICKS_PER_BEAT },
  { label: '1/2 beat', ticks: TICKS_PER_BEAT / 2 },
  { label: '1/4', ticks: 24 },
  { label: '1/4T', ticks: 16 },
  { label: '1/8', ticks: 12 },
  { label: '1/8T', ticks: 8 },
  { label: '1/16', ticks: 6 },
  { label: '1/16T', ticks: 4 },
  { label: '1/32', ticks: 3 },
  { label: '1/32T', ticks: 2 },
  { label: '1/64', ticks: 1 },
  { label: 'Off', ticks: 0 },
];
const PROJECT_KEY = 'pangea.project.v1';
const AUTOSAVE_KEY = 'pangea.autosave.v1';
const LEGACY_PROJECT_KEY = 'jamroom.clean.project.v1';
const LEGACY_AUTOSAVE_KEY = 'jamroom.clean.autosave.v1';
const HISTORY_LIMIT = 60;
const KEYBOARD_PADS = {
  KeyQ: 0, KeyW: 1, KeyE: 2, KeyR: 3,
  KeyA: 4, KeyS: 5, KeyD: 6, KeyF: 7,
  KeyZ: 8, KeyX: 9, KeyC: 10, KeyV: 11,
  Digit1: 12, Digit2: 13, Digit3: 14, Digit4: 15,
};
const TAP_TEMPO_MAX_GAP_MS = 2200;
const TAP_TEMPO_MIN_INTERVAL_MS = 250;
const TAP_TEMPO_MAX_INTERVAL_MS = 1500;
let tapTempoTimes = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const gridTicks = () => GRID_OPTIONS.find(g => g.label === state.grid)?.ticks || 6;
const snapOptionTicks = label => SNAP_OPTIONS.find(item => item.label === label)?.ticks ?? gridTicks();
const instrumentTypeFromPage = () => state.page === 'chords' ? 'chords' : state.page === 'melody' ? 'melody' : state.page === 'slicer' ? 'slicer' : 'drums';
const activeLayerSnapLabel = type => currentLayer(type)?.snap || state.grid || '1/16';
const snapTickTo = (tick, ticks) => {
  if (!ticks) return clamp(Math.round(tick), 0, totalTicks() - 1);
  const target = Math.round(tick / ticks) * ticks;
  const strength = state.quantize / 100;
  return clamp(Math.round(tick + (target - tick) * strength), 0, totalTicks() - 1);
};
const snapEventTick = (tick, type = instrumentTypeFromPage()) => {
  const label = activeLayerSnapLabel(type);
  const ticks = label === 'Off' ? 0 : snapOptionTicks(label);
  return state.snap ? snapTickTo(tick, ticks) : clamp(Math.round(tick), 0, totalTicks() - 1);
};
const totalTicks = () => state.loopBars * TICKS_PER_BAR;
const nowLabel = () => {
  if (state.currentStep < 0) return '1.1';
  const bar = Math.floor(state.currentStep / TICKS_PER_BAR) + 1;
  const beat = Math.floor((state.currentStep % TICKS_PER_BAR) / TICKS_PER_BEAT) + 1;
  return `${bar}.${beat}`;
};
const snapTick = (tick) => {
  const g = gridTicks();
  const target = Math.round(tick / g) * g;
  const strength = state.quantize / 100;
  return clamp(Math.round(tick + (target - tick) * strength), 0, totalTicks() - 1);
};
const makePattern = () => Array.from({ length: 16 }, () => Array(totalTicks()).fill(0));
const shortLabel = (name = 'PAD') => name.replace(/^SOUTHSIDE\s+/i, '').split(' ').slice(0, 2).join('\n').toUpperCase();
const displayUrlName = (url = '') => decodeURIComponent(url.split('/').pop() || '').replace(/\.[^.]+$/, '');



const CHORD_KEYS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NOTE_NAMES = CHORD_KEYS;
const SCALE_OPTIONS = [
  'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian',
  'Major Pentatonic', 'Minor Pentatonic', 'Harmonic Minor', 'Melodic Minor'
];
const SCALE_PATTERNS = {
  'Ionian': [0,2,4,5,7,9,11],
  'Dorian': [0,2,3,5,7,9,10],
  'Phrygian': [0,1,3,5,7,8,10],
  'Lydian': [0,2,4,6,7,9,11],
  'Mixolydian': [0,2,4,5,7,9,10],
  'Aeolian': [0,2,3,5,7,8,10],
  'Locrian': [0,1,3,5,6,8,10],
  'Major Pentatonic': [0,2,4,7,9],
  'Minor Pentatonic': [0,3,5,7,10],
  'Harmonic Minor': [0,2,3,5,7,8,11],
  'Melodic Minor': [0,2,3,5,7,9,11]
};
const SCALE_LABELS = {
  'Ionian': ['I','ii','iii','IV','V','vi','vii°'],
  'Dorian': ['i','ii','III','IV','v','vi°','VII'],
  'Phrygian': ['i','II','III','iv','v°','VI','vii'],
  'Lydian': ['I','II','iii','iv°','V','vi','vii'],
  'Mixolydian': ['I','ii','iii°','IV','v','vi','VII'],
  'Aeolian': ['i','ii°','III','iv','v','VI','VII'],
  'Locrian': ['i°','II','iii','iv','V','VI','vii'],
  'Major Pentatonic': ['P1','P2','P3','P4','P5'],
  'Minor Pentatonic': ['p1','p2','p3','p4','p5'],
  'Harmonic Minor': ['i','ii°','III+','iv','V','VI','vii°'],
  'Melodic Minor': ['i','ii','III+','IV','V','vi°','vii°']
};
const DEGREE_COLORS = ['purple','blue','teal','green','yellow','orange','pink'];
const CHORD_PAD_DEGREES = [0,1,2,3,4,5,6,0,0,1,4,5,0,3,4,0];
const CHORD_PAD_OCTAVE_OFFSETS = [0,0,0,0,0,0,0,1,0,0,0,0,-1,-1,-1,1];
const CHORD_PAD_INVERSION_OFFSETS = [0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0];
const CHORD_SIZE_OPTIONS = [2,3,4,5,6,7];
const VOICING_OPTIONS = ['Closed','Open','Wide','Drop 2'];
const INSTRUMENT_OPTIONS = ['Piano','Electric Piano','Soft Synth','Pluck Synth','Pad Synth','Bass Synth'];
const OSC_OPTIONS = ['sine','triangle','sawtooth','square'];
const PROGRESSION_PRESETS = {
  Ionian: [
    { name:'I-V-vi-IV', degrees:[0,4,5,3] },
    { name:'I-IV-V', degrees:[0,3,4] },
    { name:'ii-V-I', degrees:[1,4,0] },
    { name:'I-vi-IV-V', degrees:[0,5,3,4] },
  ],
  Aeolian: [
    { name:'i-VI-III-VII', degrees:[0,5,2,6] },
    { name:'i-iv-v-i', degrees:[0,3,4,0] },
    { name:'i-VII-VI-VII', degrees:[0,6,5,6] },
    { name:'i-III-VII-VI', degrees:[0,2,6,5] },
    { name:'i-VI-iv-v', degrees:[0,5,3,4] },
  ],
  Phrygian: [
    { name:'i-II-i', degrees:[0,1,0] },
    { name:'i-II-VII-i', degrees:[0,1,6,0] },
    { name:'i-VII-VI-II', degrees:[0,6,5,1] },
  ],
  Dorian: [
    { name:'i-IV', degrees:[0,3] },
    { name:'i-IV-VII', degrees:[0,3,6] },
    { name:'i-ii-IV-i', degrees:[0,1,3,0] },
  ],
  Lydian: [
    { name:'I-II-I', degrees:[0,1,0] },
    { name:'I-V-II-IV', degrees:[0,4,1,3] },
  ],
  Mixolydian: [
    { name:'I-VII-IV-I', degrees:[0,6,3,0] },
    { name:'I-v-IV', degrees:[0,4,3] },
  ],
  Locrian: [
    { name:'i°-II-VI', degrees:[0,1,5] },
  ],
  'Major Pentatonic': [
    { name:'P1-P4-P5-P1', degrees:[0,3,4,0] },
  ],
  'Minor Pentatonic': [
    { name:'p1-p4-p5-p1', degrees:[0,3,4,0] },
  ],
  'Harmonic Minor': [
    { name:'i-iv-V-i', degrees:[0,3,4,0] },
    { name:'i-VI-V-i', degrees:[0,5,4,0] },
  ],
  'Melodic Minor': [
    { name:'i-IV-V-i', degrees:[0,3,4,0] },
  ],
};
const midiToFreq = midi => 440 * Math.pow(2, (midi - 69) / 12);
const CHORD_MIDI_LOW = 36;
const CHORD_MIDI_HIGH = 96;
const CHORD_NOTE_DURATION = TICKS_PER_BEAT;
const midiName = midi => `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
const makeChordNoteId = () => `cn_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const makeChordTriggerId = () => `ct_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
const currentScaleName = () => state.chordScale || 'Ionian';
const currentScale = () => SCALE_PATTERNS[currentScaleName()] || SCALE_PATTERNS.Ionian;
const chordModeSize = () => Number(state.chordNoteCount || ({Triads:3,'7ths':4,'9ths':5}[state.chordMode] || 4));
const degreeLabels = () => SCALE_LABELS[currentScaleName()] || SCALE_LABELS.Ionian;
const degreeCount = () => currentScale().length;
const degreeRootOffset = degree => currentScale()[((degree % degreeCount()) + degreeCount()) % degreeCount()] || 0;
const chordSteps = () => state.loopBars * 4;

function intervalName(intervals, size) {
  const simple = intervals.slice(0, Math.min(size, 4)).join(',');
  if (size <= 2) return intervals[1] === 7 ? '5' : intervals[1] === 3 ? 'm' : '';
  const triad = intervals.slice(0, 3).join(',');
  let quality = '';
  if (triad === '0,4,7') quality = '';
  else if (triad === '0,3,7') quality = 'm';
  else if (triad === '0,3,6') quality = 'dim';
  else if (triad === '0,4,8') quality = 'aug';
  else quality = 'sus';
  if (size >= 4) {
    const seventh = intervals[3];
    if (quality === '' && seventh === 11) quality = 'maj7';
    else if (quality === '' && seventh === 10) quality = '7';
    else if (quality === 'm' && seventh === 10) quality = 'm7';
    else if (quality === 'm' && seventh === 11) quality = 'mMaj7';
    else if (quality === 'dim' && seventh === 10) quality = 'm7b5';
    else if (quality === 'dim' && seventh === 9) quality = 'dim7';
    else quality += '7';
  }
  if (size === 5) quality = quality.replace('7','9') || 'add9';
  if (size === 6) quality = (quality || 'maj') + '11';
  if (size >= 7) quality = (quality || 'maj') + '13';
  return quality;
}

function applyInversion(notes, inversion = 0) {
  const next = [...notes];
  const moves = clamp(Number(inversion || 0), 0, Math.max(0, next.length - 1));
  for (let i = 0; i < moves; i++) next.push(next.shift() + 12);
  return next;
}

function applyVoicing(notes, voicing = 'Closed') {
  let next = [...notes];
  if (voicing === 'Open' && next.length >= 4) {
    next = [next[0], next[2], next[1] + 12, ...next.slice(3)];
  } else if (voicing === 'Wide') {
    next = next.map((note, i) => note + (i >= 2 ? 12 : 0));
  } else if (voicing === 'Drop 2' && next.length >= 4) {
    const idx = next.length - 2;
    next[idx] -= 12;
    next.sort((a,b) => a-b);
  }
  return next;
}

function chordNotesForDegree(degree, octave = state.chordOctave || 4, inversion = state.chordInversion || 0, voicing = state.chordVoicing || 'Closed') {
  const rootOffset = CHORD_KEYS.indexOf(state.chordKey || 'C');
  const scale = currentScale();
  const size = chordModeSize();
  const realDegree = ((degree % scale.length) + scale.length) % scale.length;
  const notes = [];
  let lastSemitone = -999;
  for (let i = 0; i < size; i++) {
    const scaleIndex = realDegree + i * 2;
    const octaveBump = Math.floor(scaleIndex / scale.length);
    let semitone = rootOffset + scale[scaleIndex % scale.length] + octaveBump * 12;
    while (semitone <= lastSemitone) semitone += 12;
    notes.push(12 * (Number(octave) + 1) + semitone);
    lastSemitone = semitone;
  }
  return applyVoicing(applyInversion(notes, inversion), voicing).map(note => clamp(note, CHORD_MIDI_LOW, CHORD_MIDI_HIGH));
}

function chordDegreeLabel(degree, forcedInversion = state.chordInversion) {
  const labels = degreeLabels();
  const label = labels[((degree % labels.length) + labels.length) % labels.length] || `D${degree + 1}`;
  const inv = Number(forcedInversion || 0);
  return inv > 0 ? `${label}/${inv}` : label;
}

function chordNameForDegree(degree, octave = state.chordOctave || 4, inversion = state.chordInversion || 0, voicing = state.chordVoicing || 'Closed') {
  const rootOffset = CHORD_KEYS.indexOf(state.chordKey || 'C');
  const scale = currentScale();
  const realDegree = ((degree % scale.length) + scale.length) % scale.length;
  const root = NOTE_NAMES[(rootOffset + scale[realDegree]) % 12];
  const raw = chordNotesForDegree(realDegree, octave, 0, 'Closed');
  const rootMidi = raw[0];
  const intervals = raw.map(note => ((note - rootMidi) % 12 + 12) % 12);
  return `${root}${intervalName(intervals, chordModeSize())}`;
}

function chordPadInfo(index) {
  const degree = CHORD_PAD_DEGREES[index % CHORD_PAD_DEGREES.length] % degreeCount();
  const octave = clamp(Number(state.chordOctave || 4) + CHORD_PAD_OCTAVE_OFFSETS[index % CHORD_PAD_OCTAVE_OFFSETS.length], 1, 7);
  const inversion = clamp(Number(state.chordInversion || 0) + CHORD_PAD_INVERSION_OFFSETS[index % CHORD_PAD_INVERSION_OFFSETS.length], 0, Math.max(0, chordModeSize() - 1));
  return { degree, octave, inversion };
}

function chordNotesToMidiNotes(degree, octave, tick, velocity = 110, duration = CHORD_NOTE_DURATION, inversion = state.chordInversion, voicing = state.chordVoicing) {
  return chordNotesForDegree(degree, octave, inversion, voicing).map(pitch => ({
    id: makeChordNoteId(), pitch, tick, duration: Math.max(1, duration), velocity, degree, label: midiName(pitch),
  }));
}

function makeChordSequence() {
  return Array.from({ length: totalTicks() }, () => null);
}

function makeChordMidiNotes() {
  return [];
}

function makeChordTriggers() {
  return [];
}

function makeMelodyEvents() {
  return [];
}

function makeSlicerPattern() {
  return makePattern();
}

function makeLayer(type, name, data) {
  return {
    id: `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    muted: false,
    solo: false,
    volume: 1,
    snap: state?.grid || '1/16',
    data,
  };
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeDefaultLayers() {
  return {
    drums: [makeLayer('drums', 'Drums 1', cloneData(state.pattern || makePattern()))],
    chords: [makeLayer('chords', 'Chords 1', cloneData(state.chordTriggers || []))],
    melody: [makeLayer('melody', 'Melody 1', cloneData(state.melodyEvents || []))],
    slicer: [makeLayer('slicer', 'Slicer 1', cloneData(state.slicerPattern || makeSlicerPattern()))],
  };
}

function ensureLayers() {
  if (!state.activeLayer) state.activeLayer = { drums: 0, chords: 0, melody: 0, slicer: 0 };
  if (!state.layers) state.layers = makeDefaultLayers();
  ['drums','chords','melody','slicer'].forEach(type => {
    if (!Array.isArray(state.layers[type]) || !state.layers[type].length) {
      const data = type === 'drums' ? cloneData(state.pattern || makePattern())
        : type === 'chords' ? cloneData(state.chordTriggers || [])
        : type === 'melody' ? cloneData(state.melodyEvents || [])
        : cloneData(state.slicerPattern || makeSlicerPattern());
      state.layers[type] = [makeLayer(type, `${type[0].toUpperCase()}${type.slice(1)} 1`, data)];
    }
    state.activeLayer[type] = clamp(Number(state.activeLayer[type] || 0), 0, state.layers[type].length - 1);
  });
}

function currentLayer(type) {
  ensureLayers();
  return state.layers[type][state.activeLayer[type] || 0];
}

function syncActiveLayer(type) {
  const layer = currentLayer(type);
  if (!layer) return;
  if (type === 'drums') layer.data = cloneData(state.pattern || makePattern());
  if (type === 'chords') layer.data = cloneData(state.chordTriggers || []);
  if (type === 'melody') layer.data = cloneData(state.melodyEvents || []);
  if (type === 'slicer') layer.data = cloneData(state.slicerPattern || makeSlicerPattern());
}

function loadInstrumentLayer(type, index) {
  ensureLayers();
  syncActiveLayer(type);
  const layers = state.layers[type] || [];
  const layer = layers[clamp(Number(index || 0), 0, Math.max(0, layers.length - 1))];
  if (!layer) return;
  state.activeLayer[type] = layers.indexOf(layer);
  if (type === 'drums') state.pattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => layer.data?.[r]?.[t] || 0));
  if (type === 'chords') {
    state.chordTriggers = sanitizeChordTriggers(layer.data || []);
    state.chordMidiNotes = expandChordTriggersForMidiExport();
  }
  if (type === 'melody') state.melodyEvents = sanitizeMelodyEvents(layer.data || []);
  if (type === 'slicer') state.slicerPattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => layer.data?.[r]?.[t] || 0));
  render();
  scheduleAutosave();
}

function addInstrumentLayer(type) {
  ensureLayers();
  syncActiveLayer(type);
  const number = state.layers[type].length + 1;
  const data = type === 'drums' ? makePattern()
    : type === 'chords' ? []
    : type === 'melody' ? []
    : makeSlicerPattern();
  state.layers[type].push(makeLayer(type, `${type[0].toUpperCase()}${type.slice(1)} ${number}`, data));
  state.activeLayer[type] = state.layers[type].length - 1;
  loadInstrumentLayer(type, state.activeLayer[type]);
  toast(`Added ${type} layer ${number}`);
}

function clearActiveLayer(type) {
  if (!confirm(`Clear current ${type} layer?`)) return;
  pushHistory(`Clear ${type} layer`);
  if (type === 'drums') state.pattern = makePattern();
  if (type === 'chords') { state.chordTriggers = []; state.chordMidiNotes = []; state.chordSequence = makeChordSequence(); }
  if (type === 'melody') state.melodyEvents = [];
  if (type === 'slicer') state.slicerPattern = makeSlicerPattern();
  syncActiveLayer(type);
  render();
  scheduleAutosave();
}

function deleteActiveLayer(type) {
  ensureLayers();
  if ((state.layers[type] || []).length <= 1) return toast('Keep at least one layer');
  if (!confirm(`Delete current ${type} layer?`)) return;
  const index = state.activeLayer[type] || 0;
  state.layers[type].splice(index, 1);
  state.activeLayer[type] = clamp(index - 1, 0, state.layers[type].length - 1);
  loadInstrumentLayer(type, state.activeLayer[type]);
}

function activeLayersForPlayback(type) {
  ensureLayers();
  const layers = state.layers[type] || [];
  const anySolo = layers.some(layer => layer.solo);
  return layers.filter(layer => !layer.muted && (!anySolo || layer.solo));
}


function openEditGrid(type = instrumentTypeFromPage()) {
  syncActiveLayer(type);
  state.editInstrument = type;
  state.page = 'editGrid';
  render();
}

function currentEditInstrument() {
  return state.editInstrument || instrumentTypeFromPage();
}

function flashPerformancePad(type, index, holdMs = 95) {
  const selectors = [
    `[data-pad="${index}"]`,
    `[data-chord-pad="${index}"]`,
    `[data-melody-pad="${index}"]`,
    `[data-slicer-pad="${index}"]`,
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add('playing');
      clearTimeout(el._pangeaLightTimer);
      el._pangeaLightTimer = setTimeout(() => el.classList.remove('playing'), holdMs);
    });
  });
}

function eraseEventAtStep(type, index, step = state.currentStep) {
  const tick = snapEventTick(step >= 0 ? step : 0, type);
  const snapTicks = snapOptionTicks(activeLayerSnapLabel(type)) || 1;
  const windowTicks = Math.max(1, Math.floor(snapTicks / 2));
  pushHistory(`Erase ${type} pad`, 650);
  if (type === 'drums') {
    const row = state.pattern[index] || [];
    for (let t = Math.max(0, tick - windowTicks); t <= Math.min(totalTicks() - 1, tick + windowTicks); t++) row[t] = 0;
    syncActiveLayer('drums');
  } else if (type === 'slicer') {
    const row = state.slicerPattern[index] || [];
    for (let t = Math.max(0, tick - windowTicks); t <= Math.min(totalTicks() - 1, tick + windowTicks); t++) row[t] = 0;
    syncActiveLayer('slicer');
  } else if (type === 'chords') {
    const degree = chordPadInfo(index).degree;
    state.chordTriggers = (state.chordTriggers || []).filter(ev => !(ev.degree === degree && tick >= ev.tick - windowTicks && tick < ev.tick + (ev.duration || CHORD_NOTE_DURATION) + windowTicks));
    state.chordMidiNotes = expandChordTriggersForMidiExport();
    syncActiveLayer('chords');
  } else if (type === 'melody') {
    state.melodyEvents = (state.melodyEvents || []).filter(ev => !(ev.padIndex === index && tick >= ev.tick - windowTicks && tick < ev.tick + (ev.duration || gridTicks()) + windowTicks));
    syncActiveLayer('melody');
  }
  scheduleAutosave();
}

function eraseHeldPadAtStep(step) {
  if (!eraseHold) return;
  eraseEventAtStep(eraseHold.type, eraseHold.index, step);
  renderSoft();
}

function renderLayerBar(type) {
  ensureLayers();
  const layers = state.layers[type] || [];
  const active = state.activeLayer[type] || 0;
  const layer = layers[active] || {};
  const snap = layer.snap || state.grid || '1/16';
  return `<div class="layerBar performanceLayerBar" data-layer-type="${type}">
    <button class="addLayerBtn" data-add-layer="${type}">+ Layer</button>
    <select data-layer-select="${type}">${layers.map((layer, index) => `<option value="${index}" ${index === active ? 'selected' : ''}>${escapeHTML(layer.name || `Layer ${index + 1}`)}</option>`).join('')}</select>
    <label class="snapSelectLabel">Snap<select data-layer-snap="${type}">${SNAP_OPTIONS.map(option => `<option value="${option.label}" ${option.label === snap ? 'selected' : ''}>${option.label}</option>`).join('')}</select></label>
    <button data-layer-toggle="mute" class="${layer.muted ? 'active' : ''}">Mute</button>
    <button data-layer-toggle="solo" class="${layer.solo ? 'active' : ''}">Solo</button>
    <button data-edit-layer="${type}">Edit</button>
    <button data-toggle-erase class="${state.eraseMode ? 'active danger' : ''}">Erase</button>
    <button data-clear-layer="${type}" class="danger">Clear</button>
  </div>`;
}
function chordTriggerToMidiNotes(trigger) {
  if (!trigger) return [];
  const degree = Number.isFinite(Number(trigger.degree)) ? Number(trigger.degree) : 0;
  const octave = Number.isFinite(Number(trigger.octave)) ? Number(trigger.octave) : (state.chordOctave || 4);
  const inversion = Number.isFinite(Number(trigger.inversion)) ? Number(trigger.inversion) : (state.chordInversion || 0);
  const voicing = trigger.voicing || state.chordVoicing || 'Closed';
  const tick = clamp(Number(trigger.tick || 0), 0, totalTicks() - 1);
  const duration = clamp(Number(trigger.duration || CHORD_NOTE_DURATION), 1, totalTicks());
  const velocity = clamp(Number(trigger.velocity || 100), 1, 127);
  return chordNotesForDegree(degree, octave, inversion, voicing).map(pitch => ({
    id: makeChordNoteId(),
    pitch,
    tick,
    duration,
    velocity,
    degree,
    label: midiName(pitch),
    sourceTriggerId: trigger.id || null,
  }));
}

function expandChordTriggersForMidiExport() {
  return (state.chordTriggers || []).flatMap(chordTriggerToMidiNotes);
}

function sanitizeChordTriggers(triggers = []) {
  return (Array.isArray(triggers) ? triggers : [])
    .filter(trigger => trigger && Number.isFinite(Number(trigger.tick)) && Number.isFinite(Number(trigger.degree)))
    .map(trigger => ({
      id: trigger.id || makeChordTriggerId(),
      degree: clamp(Number(trigger.degree), 0, degreeCount() - 1),
      padIndex: Number.isFinite(Number(trigger.padIndex)) ? clamp(Number(trigger.padIndex), 0, 15) : null,
      tick: clamp(Number(trigger.tick), 0, totalTicks() - 1),
      duration: clamp(Number(trigger.duration || CHORD_NOTE_DURATION), 1, totalTicks()),
      velocity: clamp(Number(trigger.velocity || 100), 1, 127),
      octave: Number.isFinite(Number(trigger.octave)) ? clamp(Number(trigger.octave), 1, 7) : (state.chordOctave || 4),
      inversion: Number.isFinite(Number(trigger.inversion)) ? clamp(Number(trigger.inversion), 0, Math.max(0, chordModeSize() - 1)) : (state.chordInversion || 0),
      voicing: trigger.voicing || state.chordVoicing || 'Closed',
      chordKey: trigger.chordKey || state.chordKey || 'C',
      chordScale: trigger.chordScale || state.chordScale || 'Ionian',
      chordNoteCount: Number.isFinite(Number(trigger.chordNoteCount)) ? Number(trigger.chordNoteCount) : chordModeSize(),
      label: trigger.label || chordDegreeLabel(Number(trigger.degree)),
      name: trigger.name || chordNameForDegree(Number(trigger.degree), Number(trigger.octave || state.chordOctave || 4), Number(trigger.inversion || state.chordInversion || 0), trigger.voicing || state.chordVoicing || 'Closed'),
    }));
}

function sanitizeChordMidiNotes(notes = []) {
  return notes
    .filter(note => note && Number.isFinite(Number(note.pitch)) && Number.isFinite(Number(note.tick)))
    .map(note => ({
      id: note.id || makeChordNoteId(),
      pitch: clamp(Number(note.pitch), CHORD_MIDI_LOW, CHORD_MIDI_HIGH),
      tick: clamp(Number(note.tick), 0, totalTicks() - 1),
      duration: clamp(Number(note.duration || CHORD_NOTE_DURATION), 1, totalTicks()),
      velocity: clamp(Number(note.velocity || 100), 1, 127),
      degree: Number.isFinite(Number(note.degree)) ? Number(note.degree) : null,
      label: note.label || midiName(Number(note.pitch)),
    }));
}

function resizeChordSequence(oldSequence = []) {
  const next = Array.from({ length: totalTicks() }, () => null);
  const looksBeatBased = oldSequence.length > 0 && oldSequence.length <= Math.max(4, state.loopBars * 4);
  if (looksBeatBased) {
    oldSequence.forEach((degree, beatIndex) => {
      if (degree === null || degree === undefined) return;
      const tick = beatIndex * TICKS_PER_BEAT;
      if (tick < next.length) next[tick] = degree;
    });
    return next;
  }
  for (let tick = 0; tick < Math.min(oldSequence.length, next.length); tick++) {
    next[tick] = oldSequence[tick] ?? null;
  }
  return next;
}

function sampleFrom(categoryName, index = 0) {
  const category = FACTORY_CATEGORIES.find(c => c.name === categoryName) || FACTORY_CATEGORIES[0];
  return category?.samples?.[index % category.samples.length] || null;
}

function makeDefaultPads() {
  const picks = [
    ['KICKS', 4, 'red', 0],
    ['KICKS', 14, 'red', 0],
    ['SNARES', 24, 'orange', 0],
    ['CLAPS', 2, 'yellow', 0],
    ['HATS CLOSED', 5, 'green', 1],
    ['HATS OPEN', 2, 'teal', 1],
    ['PERCUSSION', 39, 'blue', 0],
    ['PERCUSSION', 22, 'blue', 0],
    ['808S', 9, 'purple', 2],
    ['808S', 11, 'purple', 2],
    ['KICKS', 9, 'pink', 0],
    ['SNARES', 5, 'pink', 0],
    ['CLAPS', 10, 'orange', 0],
    ['HATS CLOSED', 20, 'yellow', 1],
    ['PERCUSSION', 34, 'green', 0],
    ['PERCUSSION', 36, 'gray', 0],
  ];
  return picks.map(([cat, idx, color, choke], padIndex) => {
    const sample = sampleFrom(cat, idx);
    const label = sample?.name || `Pad ${padIndex + 1}`;
    return {
      label,
      short: shortLabel(label),
      category: cat,
      sample: label,
      url: sample?.url || null,
      color,
      chokeGroup: choke,
      voiceMode: 'poly',
      volume: 1,
      pan: 0,
      tune: 0,
      fine: 0,
      mute: false,
      solo: false,
      trimStart: 0,
      trimEnd: 1,
      loop: false,
      reverse: false,
    };
  });
}

const state = {
  page: 'play',
  bpm: 120,
  tapTempoOpen: false,
  eraseMode: false,
  editInstrument: '',
  loopBars: 4,
  grid: '1/16',
  snap: true,
  quantize: 100,
  swing: 55,
  metronome: true,
  countInBars: 0,
  followPlayhead: false,
  lowLatency: true,
  keepAwake: true,
  wakeLockStatus: 'off',
  audioRecoveryStatus: 'ready',
  polyphony: 32,
  isPlaying: false,
  isRecording: false,
  isCountingIn: false,
  countText: '',
  currentStep: -1,
  selectedPad: 0,
  padMode: 'drums',
  drumView: 'split',
  chordView: 'split',
  melodyView: 'split',
  slicerView: 'split',
  editingPad: null,
  editorPage: 'mix',
  sampleCategory: 'KICKS',
  search: '',
  activeVoices: 0,
  loadStatus: { loaded: 0, total: 0, ready: false },
  lastSaved: '',
  chordKey: 'C',
  chordScale: 'Ionian',
  chordMode: '7ths',
  chordNoteCount: 4,
  chordOctave: 4,
  chordInversion: 0,
  chordVoicing: 'Closed',
  chordInstrument: 'Soft Synth',
  synthEngine: { oscillator: 'triangle', filter: 2600, resonance: 0.7, attack: 0.012, release: 0.16, brightness: 0.7, detune: 0, volume: 0.9 },
  selectedChordDegree: 0,
  melodyNoteCount: 1,
  melodyOctave: 4,
  selectedMelodyPad: 0,
  melodyEvents: [],
  chordSequence: null,
  chordMidiNotes: null,
  chordTriggers: null,
  voiceClips: [],
  isVoiceRecording: false,
  isVoiceRecordArmed: false,
  voiceRecordingTime: 0,
  voiceRecordMode: 'loopComp',
  voiceStackMode: true,
  voiceTargetDuration: 0,
  voiceArmedToLoop: true,
  voiceMonitor: false,
  voiceNudgeMs: -80,
  voiceStackStatus: '',
  voiceFx: { compressor: 0.35, reverb: 0.18, delay: 0.08, eqLow: 0, eqMid: 0, eqHigh: 0 },
  slicerSourceId: '',
  slicerSlices: 16,
  slicerStartPad: 0,
  slicerChokeGroup: 8,
  slicerMode: 'Manual',
  slicerTriggerMode: 'Trigger',
  slicerPlayback: 'One Shot',
  slicerVoices: 'Mono',
  slicerChoke: true,
  slicerTranspose: 0,
  slicerGain: 1,
  slicerNudgeTarget: 'Start',
  slicerNudgeDistance: '10 ms',
  slicerSelectedPad: 0,
  slicerAudioName: '',
  slicerAudioUrl: '',
  slicerAnalyzedBpm: null,
  slicerBpmConfidence: 0,
  slicerBpmMethod: '',
  slicerBpmCandidates: [],
  slicerBpmStatus: 'Load audio to analyze BPM',
  slicerSlicePoints: Array.from({ length: 16 }, (_, i) => ({ start: i / 16, end: (i + 1) / 16 })),
  slicerPattern: null,
  activeLayer: { drums: 0, chords: 0, melody: 0, slicer: 0 },
  layers: null,
  pads: makeDefaultPads(),
  pattern: null,
};
state.pattern = makePattern();
state.chordSequence = makeChordSequence();
state.chordMidiNotes = makeChordMidiNotes();
state.chordTriggers = makeChordTriggers();
state.slicerPattern = makePattern();
state.layers = makeDefaultLayers();

let voiceRecorder = null;
let voiceStream = null;
let voiceChunks = [];
let voiceStartedAt = 0;
let voiceTimer = null;
let voiceRecordAutoStopTimer = null;
let voiceLoopCompTimer = null;
let voicePassStartedAt = 0;
let voicePendingLayerDurations = [];
let voiceLayerSavingQueue = Promise.resolve();
let activeVoiceAudios = [];
let eraseHold = null;
let voiceStackDirty = true;
const voiceBufferCache = new Map();

// Phase 20: memory-buffered loop recorder.
// This avoids MediaRecorder pass-to-pass encoding latency while recording live comp layers.
let looperRecordingBuffer = [];
let looperScriptNode = null;
let looperInputSource = null;
let looperSilentGain = null;
let looperMonitorGain = null;
let looperProcessingCommit = false;

function voiceClipId() {
  return `voice-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = String(total % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

function voiceLoopSeconds() {
  return Math.max(0.25, state.loopBars * 4 * (60 / Math.max(1, Number(state.bpm) || 120)));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function analyzeVoiceBlob(blob, points = 72) {
  try {
    const ctx = await audio.ensure();
    const array = await blob.arrayBuffer();
    const buffer = await ctx.decodeAudioData(array.slice(0));
    const data = buffer.getChannelData(0);
    const block = Math.max(1, Math.floor(data.length / points));
    const peaks = [];
    for (let i = 0; i < points; i++) {
      let sum = 0;
      const start = i * block;
      const end = Math.min(data.length, start + block);
      for (let j = start; j < end; j++) sum += Math.abs(data[j]);
      const avg = sum / Math.max(1, end - start);
      peaks.push(clamp(Math.round(avg * 240), 6, 100));
    }

    // MediaRecorder clips often contain a tiny encoder/mic startup delay.
    // Detect the first meaningful sound and trim that on stack playback so layers feel tight.
    const threshold = 0.012;
    let first = 0;
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > threshold) { first = i; break; }
    }
    const latencyOffset = clamp(first / buffer.sampleRate, 0, 0.25);

    return { waveform: peaks, latencyOffset, buffer };
  } catch (error) {
    console.warn('Voice decode/analyze failed:', error);
    return { waveform: null, latencyOffset: 0, buffer: null };
  }
}

async function blobToWaveform(blob, points = 72) {
  return (await analyzeVoiceBlob(blob, points)).waveform;
}

function fallbackWaveform(clip, points = 72) {
  const seed = (clip?.name || clip?.id || 'voice').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Array.from({ length: points }, (_, i) => {
    const v = Math.abs(Math.sin((i + seed) * 0.37) * 0.75 + Math.sin((i + seed) * 0.91) * 0.25);
    return 12 + Math.round(v * 80);
  });
}

function renderVoiceWaveform(clip, compact = false) {
  const peaks = Array.isArray(clip?.waveform) && clip.waveform.length ? clip.waveform : fallbackWaveform(clip, compact ? 42 : 72);
  return `<div class="voiceWave ${compact ? 'compact' : ''}">${peaks.map(h => `<i style="height:${clamp(h, 4, 100)}%"></i>`).join('')}</div>`;
}



function sanitizeMelodyEvents(events = []) {
  return (Array.isArray(events) ? events : []).filter(event => event && Number.isFinite(Number(event.tick)) && Array.isArray(event.notes)).map(event => ({
    id: event.id || `melody-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    padIndex: Number.isFinite(Number(event.padIndex)) ? clamp(Number(event.padIndex), 0, 15) : 0,
    tick: clamp(Number(event.tick), 0, totalTicks() - 1),
    duration: clamp(Number(event.duration || gridTicks()), 1, totalTicks()),
    velocity: clamp(Number(event.velocity || 110), 1, 127),
    notes: event.notes.map(n => clamp(Number(n), CHORD_MIDI_LOW, CHORD_MIDI_HIGH)),
    label: event.label || 'Melody',
  }));
}

function melodyPadInfo(index) {
  const scale = currentScale();
  const degree = index % scale.length;
  const octaveOffset = index >= 8 ? 1 : 0;
  const lowerOffset = index >= 8 && index < 12 ? -1 : 0;
  const octave = clamp(Number(state.melodyOctave || state.chordOctave || 4) + octaveOffset + lowerOffset, 1, 7);
  const rootOffset = CHORD_KEYS.indexOf(state.chordKey || 'C');
  const midi = 12 * (octave + 1) + rootOffset + scale[degree];
  return { degree, octave, midi: clamp(midi, CHORD_MIDI_LOW, CHORD_MIDI_HIGH), label: midiName(midi) };
}

function melodyNotesForPad(index) {
  const count = clamp(Number(state.melodyNoteCount || 1), 1, 7);
  if (count <= 1) return [melodyPadInfo(index).midi];
  const info = melodyPadInfo(index);
  return chordNotesForDegree(info.degree, info.octave, clamp(Number(state.chordInversion || 0), 0, count - 1), state.chordVoicing || 'Closed').slice(0, count);
}

function recordMelodyEvent(index, startTick, duration, velocity = 110) {
  const tick = snapEventTick(startTick, 'melody');
  const dur = Math.max(state.snap ? (snapOptionTicks(activeLayerSnapLabel('melody')) || gridTicks()) : 1, Number(duration || gridTicks()));
  const notes = melodyNotesForPad(index);
  const label = notes.length === 1 ? midiName(notes[0]) : `${chordDegreeLabel(melodyPadInfo(index).degree)} ${notes.length}n`;
  state.melodyEvents = (state.melodyEvents || []).filter(event => !(event.tick === tick && event.padIndex === index));
  state.melodyEvents.push({ id: makeChordNoteId(), padIndex: index, tick, duration: dur, velocity, notes, label });
  syncActiveLayer('melody');
  syncActiveLayer('melody');
}

function playMelodyPad(index, velocity = 110) {
  state.selectedMelodyPad = index;
  const notes = melodyNotesForPad(index);
  notes.forEach((midi, offset) => audio.playMidiNote(midi, velocity, 0.9, offset * 0.002));
  if (state.isRecording) {
    pushHistory('Record melody pad');
    const rawTick = state.currentStep >= 0 ? state.currentStep : 0;
    recordMelodyEvent(index, rawTick, snapOptionTicks(activeLayerSnapLabel('melody')) || gridTicks(), velocity);
    render();
    scheduleAutosave();
  }
}

function toggleMelodyCell(padIndex, tick) {
  const safeTick = clamp(Number(tick || 0), 0, totalTicks() - 1);
  const existing = (state.melodyEvents || []).find(event => event.tick === safeTick && event.padIndex === padIndex);
  pushHistory('Toggle melody step');
  if (existing) { state.melodyEvents = state.melodyEvents.filter(event => event.id !== existing.id); syncActiveLayer('melody'); }
  else recordMelodyEvent(padIndex, safeTick, gridTicks(), 100);
  render();
  scheduleAutosave();
}

let slicerBuffer = null;
let slicerSource = null;
let slicerStartedAt = 0;
let slicerStartOffset = 0;
let activeSlicerVoices = [];

function stopSlicerVoice(voice, fade = 0.012) {
  if (!voice) return;
  try {
    const ctx = audio.ctx;
    const now = ctx?.currentTime || 0;
    voice.gain?.gain?.cancelScheduledValues?.(now);
    voice.gain?.gain?.setValueAtTime?.(Math.max(0.0001, voice.gain.gain.value || 0.0001), now);
    voice.gain?.gain?.exponentialRampToValueAtTime?.(0.0001, now + fade);
    voice.source?.stop?.(now + fade + 0.002);
  } catch {}
  activeSlicerVoices = activeSlicerVoices.filter(item => item !== voice);
}

function stopSlicerPadVoices(padIndex = null) {
  const group = Number(state.slicerChokeGroup || 8);
  const forceAll = state.slicerChoke !== false || state.slicerVoices === 'Mono';
  [...activeSlicerVoices].forEach(voice => {
    const sameGroup = group > 0 && Number(voice.chokeGroup || 0) === group;
    const samePad = padIndex !== null && Number(voice.padIndex) === Number(padIndex);
    if (forceAll || sameGroup || samePad) stopSlicerVoice(voice);
  });
}

function nudgeDistanceSeconds() {
  const value = state.slicerNudgeDistance || '10 ms';
  if (value.endsWith('ms')) return Number(value.replace(' ms','')) / 1000;
  const beats = { '1/64': 1/16, '1/32': 1/8, '1/16': 1/4, '1/8': 1/2 }[value] || 0;
  return beats * (60 / Math.max(1, state.bpm));
}


function normalizeTempoRange(bpm, min = 40, max = 240) {
  let value = Number(bpm) || 0;
  while (value < min) value *= 2;
  while (value > max) value /= 2;
  return value;
}

function addBpmScore(map, bpm, score, source, bars = null) {
  if (!Number.isFinite(bpm) || bpm <= 0) return;
  const normalized = normalizeTempoRange(bpm);
  if (normalized < 40 || normalized > 240) return;
  const rounded = Math.round(normalized);
  const item = map.get(rounded) || { bpm: rounded, score: 0, sources: new Set(), bars: new Set() };
  item.score += score;
  if (source) item.sources.add(source);
  if (bars) item.bars.add(bars);
  map.set(rounded, item);
}

function analyzeBpmFromAudioBuffer(buffer) {
  if (!buffer || !buffer.length || !buffer.sampleRate) {
    return { bpm: null, confidence: 0, method: 'No audio buffer', candidates: [] };
  }

  const sampleRate = buffer.sampleRate;
  const duration = buffer.duration;
  const channels = Math.max(1, buffer.numberOfChannels || 1);
  const maxSamples = Math.min(buffer.length, Math.floor(sampleRate * Math.min(duration, 180)));
  const hop = 1024;
  const frameCount = Math.max(1, Math.floor(maxSamples / hop));
  const energy = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame++) {
    const start = frame * hop;
    const end = Math.min(maxSamples, start + hop);
    let sum = 0;
    let count = 0;
    for (let ch = 0; ch < channels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = start; i < end; i += 2) {
        const v = data[i] || 0;
        sum += v * v;
        count++;
      }
    }
    energy[frame] = Math.sqrt(sum / Math.max(1, count));
  }

  const flux = new Float32Array(frameCount);
  let fluxSum = 0;
  for (let i = 1; i < frameCount; i++) {
    const value = Math.max(0, energy[i] - energy[i - 1]);
    flux[i] = value;
    fluxSum += value;
  }
  const mean = fluxSum / Math.max(1, frameCount - 1);
  let variance = 0;
  for (let i = 1; i < frameCount; i++) variance += (flux[i] - mean) ** 2;
  const std = Math.sqrt(variance / Math.max(1, frameCount - 1));
  const threshold = Math.max(mean * 1.55, mean + std * 0.55, 0.00001);

  const onsets = [];
  const minGapFrames = Math.max(1, Math.round((0.085 * sampleRate) / hop));
  for (let i = 2; i < frameCount - 2; i++) {
    if (flux[i] > threshold && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1]) {
      if (!onsets.length || i - onsets[onsets.length - 1].frame >= minGapFrames) {
        onsets.push({ time: (i * hop) / sampleRate, strength: flux[i], frame: i });
      } else if (flux[i] > onsets[onsets.length - 1].strength) {
        onsets[onsets.length - 1] = { time: (i * hop) / sampleRate, strength: flux[i], frame: i };
      }
    }
  }

  const scores = new Map();

  // Loop-length BPM is often most accurate for imported loops. Try common musical bar counts.
  [1, 2, 4, 8, 16, 32, 64].forEach(bars => {
    const bpm = (bars * 4 * 60) / duration;
    if (bpm >= 25 && bpm <= 360) {
      const normalized = normalizeTempoRange(bpm);
      const barBias = bars === state.loopBars ? 3.1 : [2,4,8,16].includes(bars) ? 2.35 : 1.55;
      addBpmScore(scores, normalized, barBias, `${bars} bar${bars === 1 ? '' : 's'} from length`, bars);
    }
  });

  // Onset interval histogram catches drum/percussive files and confirms duration candidates.
  const maxPairs = 2000;
  let pairs = 0;
  for (let i = 0; i < onsets.length; i++) {
    for (let j = i + 1; j < onsets.length && pairs < maxPairs; j++) {
      const delta = onsets[j].time - onsets[i].time;
      if (delta < 0.22) continue;
      if (delta > 2.4) break;
      let bpm = normalizeTempoRange(60 / delta);
      if (bpm >= 40 && bpm <= 240) {
        const strength = Math.sqrt(Math.max(0.00001, onsets[i].strength * onsets[j].strength));
        addBpmScore(scores, bpm, strength * (1.15 / Math.max(1, j - i)), 'transients');
        pairs++;
      }
    }
  }

  let candidates = [...scores.values()].map(item => ({
    bpm: item.bpm,
    score: item.score,
    method: [...item.sources].join(' + '),
    bars: [...item.bars]
  }));

  // Merge close neighbors into the strongest nearby BPM.
  candidates.sort((a, b) => b.score - a.score);
  const merged = [];
  for (const c of candidates) {
    const existing = merged.find(item => Math.abs(item.bpm - c.bpm) <= 1);
    if (existing) {
      existing.score += c.score * 0.85;
      existing.method = [...new Set((existing.method + ' + ' + c.method).split(' + '))].join(' + ');
      existing.bars = [...new Set([...(existing.bars || []), ...(c.bars || [])])];
    } else {
      merged.push({ ...c });
    }
  }

  merged.sort((a, b) => b.score - a.score);
  const top = merged.slice(0, 5);
  const best = top[0];
  const totalScore = top.reduce((sum, item) => sum + item.score, 0) || 1;
  const confidence = best ? clamp(Math.round((best.score / totalScore) * 100), 1, 99) : 0;

  return {
    bpm: best ? best.bpm : null,
    confidence,
    method: best ? best.method : 'No strong tempo found',
    duration,
    onsets: onsets.length,
    candidates: top.map(item => ({
      bpm: item.bpm,
      confidence: clamp(Math.round((item.score / totalScore) * 100), 1, 99),
      method: item.method,
      bars: item.bars || []
    }))
  };
}

function setSlicerBpmAnalysis(result) {
  state.slicerAnalyzedBpm = result?.bpm || null;
  state.slicerBpmConfidence = result?.confidence || 0;
  state.slicerBpmMethod = result?.method || '';
  state.slicerBpmCandidates = result?.candidates || [];
  state.slicerBpmStatus = result?.bpm
    ? `${result.bpm} BPM · ${result.confidence}% confidence`
    : 'Could not detect BPM';
}

async function analyzeCurrentSlicerBpm() {
  if (!slicerBuffer) return toast('Load audio into slicer first');
  state.slicerBpmStatus = 'Analyzing BPM...';
  render();
  await new Promise(resolve => setTimeout(resolve, 20));
  const result = analyzeBpmFromAudioBuffer(slicerBuffer);
  setSlicerBpmAnalysis(result);
  render();
  return result;
}

function applyAnalyzedSlicerBpm() {
  if (!state.slicerAnalyzedBpm) return toast('Analyze or load audio first');
  pushHistory('Apply analyzed BPM');
  setTempo(state.slicerAnalyzedBpm);
  render();
  toast(`Project BPM set to ${state.bpm}`);
}

function slicerCurrentTime() {
  if (!audio.ctx || !slicerBuffer || !slicerSource) return 0;
  const elapsed = audio.ctx.currentTime - slicerStartedAt;
  return (slicerStartOffset + elapsed) % Math.max(0.01, slicerBuffer.duration);
}

async function loadSlicerFile(file) {
  if (!file) return;
  const ctx = await audio.ensure();
  const buffer = await ctx.decodeAudioData(await file.arrayBuffer());
  stopSlicerPadVoices();
  slicerBuffer = buffer;
  state.slicerAudioName = file.name.replace(/\.[^.]+$/, '');
  state.slicerAudioUrl = URL.createObjectURL(file);
  state.slicerSlicePoints = Array.from({ length: 16 }, (_, i) => ({ start: i / 16, end: (i + 1) / 16 }));
  state.slicerBpmStatus = 'Analyzing BPM...';
  render();
  await new Promise(resolve => setTimeout(resolve, 20));
  const bpmResult = analyzeBpmFromAudioBuffer(buffer);
  setSlicerBpmAnalysis(bpmResult);
  toast(`Loaded ${file.name}`);
  render();
}

async function playSlicerSource() {
  const ctx = await audio.ensure();
  if (!slicerBuffer && state.slicerAudioUrl) {
    const res = await fetch(state.slicerAudioUrl);
    slicerBuffer = await ctx.decodeAudioData(await res.arrayBuffer());
  }
  if (!slicerBuffer) return toast('Load audio into slicer first');
  stopSlicerSource();
  slicerSource = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  slicerSource.buffer = slicerBuffer;
  slicerSource.connect(gain).connect(ctx.destination);
  slicerStartedAt = ctx.currentTime;
  slicerStartOffset = 0;
  slicerSource.start();
  slicerSource.onended = () => { slicerSource = null; };
}

function stopSlicerSource() {
  try { slicerSource?.stop(); } catch {}
  slicerSource = null;
}

function setSlicePointFromPad(index) {
  if (!slicerBuffer) return playSlicerPad(index);
  const time = slicerCurrentTime();
  const pos = clamp(time / slicerBuffer.duration, 0, 0.999);
  const points = [...(state.slicerSlicePoints || [])];
  points[index] = { ...(points[index] || {}), start: pos };
  if (index > 0 && points[index - 1]) points[index - 1].end = pos;
  if (!points[index].end || points[index].end <= pos) points[index].end = Math.min(1, pos + 1 / 16);
  state.slicerSlicePoints = points;
  state.slicerSelectedPad = index;
  toast(`Slice ${index + 1} start set`);
  render();
  scheduleAutosave();
}

function nudgeSlice(index, direction) {
  if (!slicerBuffer) return toast('Load audio first');
  const delta = (direction === 'right' ? 1 : -1) * (nudgeDistanceSeconds() / slicerBuffer.duration);
  const points = [...state.slicerSlicePoints];
  const slice = { ...(points[index] || { start: 0, end: 1 }) };
  const target = state.slicerNudgeTarget || 'Start';
  if (target === 'Start' || target === 'Both') slice.start = clamp(slice.start + delta, 0, slice.end - 0.001);
  if (target === 'End' || target === 'Both') slice.end = clamp(slice.end + delta, slice.start + 0.001, 1);
  points[index] = slice;
  state.slicerSlicePoints = points;
  render();
  scheduleAutosave();
}

async function playSlicerPad(index, velocity = 110) {
  const ctx = await audio.ensure();
  if (!slicerBuffer && state.slicerAudioUrl) {
    const res = await fetch(state.slicerAudioUrl);
    slicerBuffer = await ctx.decodeAudioData(await res.arrayBuffer());
  }
  if (!slicerBuffer) return toast('Load audio into slicer first');

  // MPC-style sampler choke: a new slice trigger cuts off the previous slice.
  // This prevents vocal/drum chops from piling up and matches classic one-shot
  // sampler behavior. Set Voices to Poly and Choke Off if you later want overlap.
  if (state.slicerChoke !== false || state.slicerVoices === 'Mono' || Number(state.slicerChokeGroup || 8) > 0) {
    stopSlicerPadVoices(index);
  }

  const slice = state.slicerSlicePoints[index] || { start: index / 16, end: (index + 1) / 16 };
  const startSec = clamp(slice.start, 0, 0.999) * slicerBuffer.duration;
  const endSec = clamp(slice.end, slice.start + 0.001, 1) * slicerBuffer.duration;
  const duration = Math.max(0.01, endSec - startSec);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = slicerBuffer;
  source.playbackRate.value = Math.pow(2, (Number(state.slicerTranspose || 0)) / 12);
  gain.gain.value = Math.max(0.001, (velocity / 127) * Number(state.slicerGain || 1));
  source.connect(gain).connect(ctx.destination);

  const voice = { source, gain, padIndex: index, chokeGroup: Number(state.slicerChokeGroup || 8) };
  activeSlicerVoices.push(voice);
  source.onended = () => { activeSlicerVoices = activeSlicerVoices.filter(item => item !== voice); };

  if (state.slicerPlayback === 'Loop') {
    source.loop = true;
    source.loopStart = startSec;
    source.loopEnd = endSec;
    source.start(ctx.currentTime, startSec);
  } else {
    source.start(ctx.currentTime, startSec, duration);
  }

  state.slicerSelectedPad = index;
  if (state.isRecording) {
    const tick = state.snap ? snapTick(state.currentStep >= 0 ? state.currentStep : 0) : (state.currentStep || 0);
    if (!state.slicerPattern[index]) state.slicerPattern[index] = Array(totalTicks()).fill(0);
    state.slicerPattern[index][tick] = velocity;
    syncActiveLayer('slicer');
  }
  updateLightUI();
}

function toggleSlicerStep(row, tick) {
  if (!state.slicerPattern[row]) state.slicerPattern[row] = Array(totalTicks()).fill(0);
  state.slicerPattern[row][tick] = state.slicerPattern[row][tick] ? 0 : 110;
  if (state.slicerPattern[row][tick]) playSlicerPad(row, 110);
  syncActiveLayer('slicer');
  render();
  scheduleAutosave();
}

function currentSlicerClip() {
  const clips = state.voiceClips || [];
  return clips.find(clip => clip.id === state.slicerSourceId) || clips[0] || null;
}

function slicePadShort(index) {
  return `SL-${index + 1}`;
}

async function sliceVoiceClipToPads(clipId = state.slicerSourceId, numSlices = state.slicerSlices, startPadIndex = state.slicerStartPad) {
  const clip = (state.voiceClips || []).find(item => item.id === clipId) || currentSlicerClip();
  if (!clip) return toast('Record or import a voice loop first');

  const slices = clamp(Number(numSlices) || 16, 1, 16);
  const startPad = clamp(Number(startPadIndex) || 0, 0, 15);
  const buffer = await getVoiceBuffer(clip);
  if (!buffer) return toast('Could not load voice layer for slicing');

  pushHistory('Slice voice layer to pads');

  for (let i = 0; i < slices; i++) {
    const padIndex = (startPad + i) % 16;
    const trimStart = i / slices;
    const trimEnd = (i + 1) / slices;
    const sourceLabel = clip.name || 'Voice Loop';
    state.pads[padIndex] = {
      ...state.pads[padIndex],
      label: `${sourceLabel} Slice ${i + 1}`,
      short: slicePadShort(i),
      category: 'VOICE SLICE',
      sample: `${sourceLabel} Slice ${i + 1}`,
      url: clip.url,
      sliceClipId: clip.id,
      sliceIndex: i,
      sliceCount: slices,
      trimStart,
      trimEnd,
      loop: false,
      reverse: false,
      voiceMode: 'mono',
      chokeGroup: Number(state.slicerChokeGroup || 8),
      volume: 1,
      color: DEGREE_COLORS[i % DEGREE_COLORS.length] || 'purple',
    };
  }

  // Use the already-decoded clip buffer for every sliced pad immediately.
  if (clip.url) audio.buffers.set(clip.url, buffer);

  state.padMode = 'drums';
  state.page = 'play';
  state.selectedPad = startPad;
  scheduleAutosave();
  render();
  toast(`Sliced into ${slices} pads`);
}

function renderSlicerSequencerGridHTML() {
  const steps = 16;
  const stepTicks = Math.max(1, Math.floor(TICKS_PER_BAR / steps));
  const rows = Array.from({ length: 16 }, (_, offset) => {
    const padIndex = 15 - offset;
    const pad = state.pads[padIndex];
    const activeRow = state.selectedPad === padIndex;
    const cells = Array.from({ length: steps }, (_, step) => {
      const tick = step * stepTicks;
      const hit = state.pattern?.[padIndex]?.[tick] || 0;
      const playStepIndex = state.currentStep >= 0 ? Math.floor((state.currentStep % TICKS_PER_BAR) / stepTicks) : -1;
      return `<button class="sliceStep ${hit ? 'active' : ''} ${playStepIndex === step && state.isPlaying ? 'playhead' : ''}" data-slice-step="${padIndex}:${tick}" aria-label="${escapeAttr(pad.label)} step ${step + 1}"></button>`;
    }).join('');
    return `<div class="sliceGridRow ${activeRow ? 'selected' : ''}">
      <button class="sliceRowLabel" data-select-slice-pad="${padIndex}"><i class="${pad.color}"></i><span>${escapeHTML((pad.short || pad.label || `Pad ${padIndex + 1}`).replace(/\n/g, ' '))}</span></button>
      <div class="sliceSteps">${cells}</div>
    </div>`;
  }).join('');
  return `<section class="slicerGridPanel">
    <div class="slicerPanelHeader"><b>Slice MIDI Grid</b><span>16-step pad matrix · uses drum pattern</span></div>
    <div class="sliceGridMatrix">${rows}</div>
    <div class="sliceTimeline"><span></span>${Array.from({ length: steps }, (_, i) => `<b>${i + 1}</b>`).join('')}</div>
    <div class="slicerActions"><button id="clearSliceGrid">Clear Slice Grid</button><button id="openDrumGridFromVoice">Open Drum Grid</button></div>
  </section>`;
}

function renderVoiceSlicerPanelHTML() {
  const clips = state.voiceClips || [];
  const source = currentSlicerClip();
  return `<section class="voiceSlicerPanel">
    <div class="slicerPanelHeader"><b>Sample Slicer</b><span>Slice voice loops to MPC pads</span></div>
    <div class="slicerControls">
      <label>Source<select id="slicerSource">${clips.length ? clips.map((clip, index) => `<option value="${clip.id}" ${(state.slicerSourceId || source?.id) === clip.id ? 'selected' : ''}>${escapeHTML(clip.name || `Layer ${index + 1}`)}</option>`).join('') : '<option>No voice layers</option>'}</select></label>
      <label>Slices<select id="slicerSlices">${[4,8,16].map(n => `<option value="${n}" ${Number(state.slicerSlices) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>Start Pad<select id="slicerStartPad">${[0,4,8,12].map(n => `<option value="${n}" ${Number(state.slicerStartPad) === n ? 'selected' : ''}>${n + 1}</option>`).join('')}</select></label>
      <label>Choke<select id="slicerChokeGroup">${[0,1,2,3,4,5,6,7,8].map(n => `<option value="${n}" ${Number(state.slicerChokeGroup || 8) === n ? 'selected' : ''}>${n === 0 ? 'Off' : `Group ${n}`}</option>`).join('')}</select></label>
    </div>
    <div class="slicerActions"><button id="sliceToPadsBtn">Slice To Pads</button><button id="sliceAndSequenceBtn">Slice + Open Grid</button></div>
    <small>Equal slices use the pad trim system. Slices default to mono and one choke group for clean MPC-style chops.</small>
  </section>`;
}

function clearSliceGridPattern() {
  pushHistory('Clear slice grid');
  for (let row = 0; row < 16; row++) {
    if (!state.pattern[row]) state.pattern[row] = Array(totalTicks()).fill(0);
    state.pattern[row].fill(0, 0, Math.min(TICKS_PER_BAR, state.pattern[row].length));
  }
  render();
  scheduleAutosave();
  toast('Slice grid cleared');
}

function generatePCMVisualPeaks(pcmArray, points = 72) {
  const blockSize = Math.max(1, Math.floor((pcmArray?.length || 1) / points));
  const peaks = [];
  for (let i = 0; i < points; i++) {
    let sum = 0;
    const start = i * blockSize;
    const end = Math.min(pcmArray.length, start + blockSize);
    for (let j = start; j < end; j++) sum += Math.abs(pcmArray[j]);
    const avg = sum / Math.max(1, end - start);
    peaks.push(clamp(Math.round(avg * 350), 6, 100));
  }
  return peaks;
}

function floatToWavBlob(pcmArray, sampleRate) {
  const channels = 1;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + pcmArray.length * bytesPerSample);
  const view = new DataView(buffer);
  const writeString = (offset, value) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmArray.length * bytesPerSample, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmArray.length * bytesPerSample, true);
  let offset = 44;
  for (let i = 0; i < pcmArray.length; i++, offset += 2) {
    const sample = Math.max(-1, Math.min(1, pcmArray[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function makeVoiceBufferFromPCM(ctx, pcmArray, durationSeconds) {
  const expectedSamples = Math.max(1, Math.round(durationSeconds * ctx.sampleRate));
  const length = Math.max(expectedSamples, pcmArray.length);
  const audioBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  audioBuffer.copyToChannel(pcmArray.subarray(0, Math.min(pcmArray.length, length)), 0);
  return audioBuffer;
}

function savePCMDataUrlToClip(clip, pcmArray, sampleRate) {
  setTimeout(async () => {
    try {
      const wavBlob = floatToWavBlob(pcmArray, sampleRate);
      clip.url = await blobToDataUrl(wavBlob);
      clip.type = 'audio/wav';
      scheduleAutosave();
    } catch (error) {
      console.warn('Voice PCM export cache failed:', error);
    }
  }, 0);
}

async function saveVoiceBlobAsLayer(blob, duration, actualDuration = duration) {
  if (!blob || blob.size < 250) return null;

  try {
    const analysis = await analyzeVoiceBlob(blob, 72);
    const dataUrl = await blobToDataUrl(blob);
    const waveform = analysis.waveform;
    const clipNumber = (state.voiceClips || []).length + 1;
    const clip = {
      id: voiceClipId(),
      name: `Voice Layer ${clipNumber}`,
      url: dataUrl,
      type: blob.type || 'audio/webm',
      duration: Math.max(0.1, duration || actualDuration || voiceLoopSeconds()),
      actualDuration: Math.max(0.1, actualDuration || duration || voiceLoopSeconds()),
      loopBars: state.loopBars,
      bpm: state.bpm,
      createdAt: new Date().toISOString(),
      loop: true,
      comp: true,
      stack: true,
      volume: 1,
      latencyOffset: analysis.latencyOffset || 0,
      waveform
    };

    state.voiceClips = [clip, ...(state.voiceClips || [])];
    voiceStackDirty = true;
    if (analysis.buffer) voiceBufferCache.set(clip.id, analysis.buffer);
    else voiceBufferCache.delete(clip.id);
    state.voiceStackStatus = `${state.voiceClips.filter(c => c.comp !== false && c.stack !== false).length} stacked`;
    pushHistory('Record voice comp layer');
    render();
    scheduleAutosave();
    toast(`${clip.name} saved`);
    // Keep older layers running while recording. The fresh layer joins the stack at the next loop start.
    if (state.isPlaying && state.voiceStackMode !== false) state.voiceStackStatus = 'new layer joins next loop';
    return clip;
  } catch (error) {
    console.error(error);
    alert('Voice layer save failed. Try a shorter loop or export your project first.');
    return null;
  }
}

function queueVoiceLayerSave(blob, duration, actualDuration = duration) {
  voiceLayerSavingQueue = voiceLayerSavingQueue.then(() => saveVoiceBlobAsLayer(blob, duration, actualDuration));
  return voiceLayerSavingQueue;
}

function stopVoiceInputTracks() {
  if (voiceStream) {
    voiceStream.getTracks().forEach(track => track.stop());
  }
  voiceStream = null;
}

function stopVoiceLoopClips() {
  activeVoiceAudios.forEach(item => {
    try {
      if (item?.source) item.source.stop();
      if (item?.audioEl) {
        item.audioEl.pause();
        item.audioEl.currentTime = 0;
      }
    } catch {}
  });
  activeVoiceAudios = [];
}

function voiceStackAlreadyPlaying() {
  return activeVoiceAudios.some(item => item?.type === 'voice-stack-layer' || item?.type === 'voice-stack-master');
}

function makeImpulseResponse(ctx, seconds = 1.5, decay = 2.4) {
  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * seconds));
  const impulse = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < impulse.numberOfChannels; ch++) {
    const channel = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

async function getVoiceBuffer(clip) {
  if (!clip) return null;
  if (voiceBufferCache.has(clip.id)) return voiceBufferCache.get(clip.id);
  if (!clip.url) return null;
  const ctx = await audio.ensure();
  const response = await fetch(clip.url);
  const array = await response.arrayBuffer();
  const buffer = await ctx.decodeAudioData(array.slice(0));
  voiceBufferCache.set(clip.id, buffer);
  return buffer;
}

function connectVoiceFx(ctx, source, clip) {
  const fx = state.voiceFx || {};
  const inputGain = ctx.createGain();
  inputGain.gain.value = clamp(Number(clip?.volume ?? 1), 0, 1);

  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 180;
  low.gain.value = Number(fx.eqLow || 0);

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1200;
  mid.Q.value = 0.9;
  mid.gain.value = Number(fx.eqMid || 0);

  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 5200;
  high.gain.value = Number(fx.eqHigh || 0);

  const comp = ctx.createDynamicsCompressor();
  const compAmount = clamp(Number(fx.compressor ?? 0), 0, 1);
  comp.threshold.value = -8 - compAmount * 34;
  comp.knee.value = 18;
  comp.ratio.value = 1 + compAmount * 9;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;

  const dry = ctx.createGain();
  dry.gain.value = 1;
  const reverbWet = ctx.createGain();
  reverbWet.gain.value = clamp(Number(fx.reverb ?? 0), 0, 1) * 0.55;
  const delayWet = ctx.createGain();
  delayWet.gain.value = clamp(Number(fx.delay ?? 0), 0, 1) * 0.55;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = clamp(Number(fx.delay ?? 0), 0, 1) * 0.42;
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = (60 / Math.max(1, state.bpm)) * 0.75;

  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulseResponse(ctx, 1.6, 2.5);

  source.connect(inputGain).connect(low).connect(mid).connect(high).connect(comp);
  comp.connect(dry).connect(ctx.destination);
  comp.connect(delay).connect(delayWet).connect(ctx.destination);
  delay.connect(delayFeedback).connect(delay);
  comp.connect(reverb).connect(reverbWet).connect(ctx.destination);

  return { inputGain, low, mid, high, comp, dry, delay, delayWet, delayFeedback, reverb, reverbWet };
}

function voicePlaybackOffset(clip, buffer) {
  const detected = Number(clip?.latencyOffset || 0);
  const manual = Number(state.voiceNudgeMs || 0) / 1000;
  return clamp(detected + manual, 0, Math.max(0, (buffer?.duration || 0) - 0.03));
}

async function playVoiceClip(clip, { loop = false, fromTransport = false, when = null, ctx = null } = {}) {
  if (!clip?.url) return null;
  try {
    const activeCtx = ctx || await audio.ensure();
    const buffer = await getVoiceBuffer(clip);
    if (!buffer) return null;
    const source = activeCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = Boolean(loop);

    const offset = voicePlaybackOffset(clip, buffer);
    const clipLoopLength = Math.max(0.25, Number(clip.duration || voiceLoopSeconds()));
    if (source.loop) {
      source.loopStart = offset;
      source.loopEnd = clamp(offset + clipLoopLength, offset + 0.05, buffer.duration);
    }

    connectVoiceFx(activeCtx, source, clip);
    const startAt = when ?? activeCtx.currentTime;
    source.start(startAt, offset);
    const item = { source, clipId: clip.id };
    if (fromTransport || loop) activeVoiceAudios.push(item);
    source.onended = () => {
      activeVoiceAudios = activeVoiceAudios.filter(v => v !== item);
    };
    return item;
  } catch (error) {
    console.warn('WebAudio voice playback failed, falling back to Audio element:', error);
    const audioEl = new Audio(clip.url);
    audioEl.volume = clamp(Number(clip.volume ?? 1), 0, 1);
    audioEl.loop = Boolean(loop);
    const item = { audioEl, clipId: clip.id };
    if (fromTransport || loop) activeVoiceAudios.push(item);
    try {
      audioEl.currentTime = Math.max(0, Number(clip.latencyOffset || 0) + Number(state.voiceNudgeMs || 0) / 1000);
    } catch {}
    audioEl.play().catch(() => toast('Tap Fix Audio or press Play again to unlock voice playback'));
    return item;
  }
}


function mixBufferIntoOutput(output, input, clip, loopSeconds) {
  if (!output || !input) return;
  const outRate = output.sampleRate;
  const inRate = input.sampleRate;
  const channels = Math.min(output.numberOfChannels, input.numberOfChannels || 1);
  const offsetSeconds = voicePlaybackOffset(clip, input);
  const startSample = Math.floor(offsetSeconds * inRate);
  const available = Math.max(1, input.length - startSample);
  const clipLengthSeconds = Math.max(0.25, Number(clip.duration || loopSeconds));
  const clipSamples = Math.max(1, Math.min(available, Math.floor(clipLengthSeconds * inRate)));
  const volume = clamp(Number(clip.volume ?? 1), 0, 1);

  for (let ch = 0; ch < output.numberOfChannels; ch++) {
    const out = output.getChannelData(ch);
    const inData = input.getChannelData(Math.min(ch, Math.max(0, input.numberOfChannels - 1)));

    for (let i = 0; i < output.length; i++) {
      const srcTime = i / outRate;
      const srcIndex = startSample + (Math.floor(srcTime * inRate) % clipSamples);
      out[i] += (inData[srcIndex] || 0) * volume;
    }
  }
}

function normalizeMixedVoiceBuffer(buffer) {
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  }
  if (peak <= 0.001) return;
  const gain = peak > 0.92 ? 0.92 / peak : 1;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) data[i] *= gain;
  }
}

async function buildVoiceStackMixBuffer() {
  const stackClips = (state.voiceClips || []).filter(clip => clip.comp !== false && clip.stack !== false);
  if (!stackClips.length) return null;
  const ctx = await audio.ensure();
  const loopSeconds = voiceLoopSeconds();
  const length = Math.max(1, Math.ceil(loopSeconds * ctx.sampleRate));
  const mix = ctx.createBuffer(2, length, ctx.sampleRate);

  const loaded = await Promise.all(stackClips.map(async clip => {
    try {
      const buffer = await getVoiceBuffer(clip);
      return { clip, buffer };
    } catch (error) {
      console.warn('Voice layer mix failed:', clip?.name, error);
      return null;
    }
  }));

  loaded.filter(Boolean).forEach(({ clip, buffer }) => mixBufferIntoOutput(mix, buffer, clip, loopSeconds));
  normalizeMixedVoiceBuffer(mix);
  return { buffer: mix, count: loaded.filter(Boolean).length, total: stackClips.length };
}

function connectVoiceStackFx(ctx, source) {
  const fx = state.voiceFx || {};
  const inputGain = ctx.createGain();
  inputGain.gain.value = 1;

  const low = ctx.createBiquadFilter();
  low.type = 'lowshelf';
  low.frequency.value = 180;
  low.gain.value = Number(fx.eqLow || 0);

  const mid = ctx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = 1200;
  mid.Q.value = 0.9;
  mid.gain.value = Number(fx.eqMid || 0);

  const high = ctx.createBiquadFilter();
  high.type = 'highshelf';
  high.frequency.value = 5200;
  high.gain.value = Number(fx.eqHigh || 0);

  const comp = ctx.createDynamicsCompressor();
  const compAmount = clamp(Number(fx.compressor ?? 0), 0, 1);
  comp.threshold.value = -8 - compAmount * 34;
  comp.knee.value = 18;
  comp.ratio.value = 1 + compAmount * 9;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;

  const dry = ctx.createGain();
  dry.gain.value = 1;
  const reverbWet = ctx.createGain();
  reverbWet.gain.value = clamp(Number(fx.reverb ?? 0), 0, 1) * 0.55;
  const delayWet = ctx.createGain();
  delayWet.gain.value = clamp(Number(fx.delay ?? 0), 0, 1) * 0.55;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = clamp(Number(fx.delay ?? 0), 0, 1) * 0.42;
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = (60 / Math.max(1, state.bpm)) * 0.75;
  const reverb = ctx.createConvolver();
  reverb.buffer = makeImpulseResponse(ctx, 1.6, 2.5);

  source.connect(inputGain).connect(low).connect(mid).connect(high).connect(comp);
  comp.connect(dry).connect(ctx.destination);
  comp.connect(delay).connect(delayWet).connect(ctx.destination);
  delay.connect(delayFeedback).connect(delay);
  comp.connect(reverb).connect(reverbWet).connect(ctx.destination);
}

async function preloadVoiceStack() {
  const clips = (state.voiceClips || []).filter(clip => clip.comp !== false && clip.stack !== false);
  if (!clips.length) return [];
  const loaded = await Promise.all(clips.map(async clip => {
    try {
      const buffer = await getVoiceBuffer(clip);
      return { clip, buffer };
    } catch (error) {
      console.warn('Voice layer preload failed:', clip?.name, error);
      return { clip, buffer: null };
    }
  }));
  return loaded.filter(item => item.buffer);
}

async function playVoiceLoopClips({ forceRestart = false } = {}) {
  // Phase 19: DAW-style voice stack engine.
  // Every active comp layer is decoded first, then all BufferSource nodes are
  // created and scheduled to the exact same Web Audio clock time. This keeps
  // layers separate for volume/mute/FX while making them start together.
  if (state.voiceStackMode === false) return;

  const stackClips = (state.voiceClips || []).filter(clip => clip.comp !== false && clip.stack !== false);
  if (!stackClips.length) {
    state.voiceStackStatus = '0 layers';
    updateLightUI();
    return;
  }

  try {
    const ctx = await audio.ensure();
    if (!forceRestart && !voiceStackDirty && voiceStackAlreadyPlaying()) return;

    state.voiceStackStatus = 'loading stack...';
    updateLightUI();

    const loaded = await Promise.all(stackClips.map(async clip => {
      try {
        const buffer = await getVoiceBuffer(clip);
        return { clip, buffer };
      } catch (error) {
        console.warn('Voice stack layer failed to load:', clip?.name, error);
        return null;
      }
    }));

    const layers = loaded.filter(item => item?.buffer);
    if (!layers.length) {
      state.voiceStackStatus = 'stack empty';
      updateLightUI();
      return;
    }

    stopVoiceLoopClips();

    const startAt = ctx.currentTime + 0.10;
    const loopSeconds = voiceLoopSeconds();
    const startedItems = [];

    layers.forEach(({ clip, buffer }) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const offset = voicePlaybackOffset(clip, buffer);
      const clipLoopLength = Math.max(0.25, Number(clip.duration || loopSeconds));
      const safeLoopStart = clamp(offset, 0, Math.max(0, buffer.duration - 0.05));
      const safeLoopEnd = clamp(
        safeLoopStart + Math.min(loopSeconds, clipLoopLength),
        safeLoopStart + 0.05,
        buffer.duration
      );

      source.loopStart = safeLoopStart;
      source.loopEnd = safeLoopEnd;
      connectVoiceFx(ctx, source, clip);

      const item = { source, type: 'voice-stack-layer', clipId: clip.id };
      startedItems.push(item);
      activeVoiceAudios.push(item);
      source.onended = () => { activeVoiceAudios = activeVoiceAudios.filter(v => v !== item); };

      // All layers use the same startAt value. This is the DAW-style sync point.
      source.start(startAt, safeLoopStart);
    });

    // Master marker helps us know the stack is already running without relying on one layer.
    const master = { type: 'voice-stack-master', clipId: 'voice-stack-master', startedAt: startAt };
    activeVoiceAudios.push(master);

    voiceStackDirty = false;
    state.voiceStackStatus = `${startedItems.length}/${stackClips.length} layers stacked`;
    updateLightUI();
  } catch (error) {
    console.warn('Voice stack start failed:', error);
    toast('Voice stack could not start. Tap Fix Audio.');
  }
}

async function startVoiceRecording() {
  if (state.isVoiceRecording) {
    stopVoiceRecording();
    return;
  }

  if (!state.isPlaying) {
    await start();
    await startLiveLooper();
    return;
  }

  const nearLoopStart = state.currentStep < 3 || state.currentStep > totalTicks() - 3;
  if (nearLoopStart) {
    await startLiveLooper();
  } else {
    state.isVoiceRecordArmed = true;
    render();
    toast('Voice armed for next loop');
  }
}

async function startLiveLooper() {
  if (state.isVoiceRecording) return;

  const ctx = await audio.ensure();

  if (!navigator.mediaDevices?.getUserMedia) {
    alert('Voice recording is not supported in this browser. Try Safari/Chrome updated, or install as a Home Screen app.');
    return;
  }

  try {
    if (!voiceStream) {
      voiceStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1,
          latency: 0
        }
      });
    }

    looperInputSource = ctx.createMediaStreamSource(voiceStream);
    looperScriptNode = ctx.createScriptProcessor(4096, 1, 1);
    looperSilentGain = ctx.createGain();
    looperSilentGain.gain.value = 0;
    looperRecordingBuffer = [];
    looperProcessingCommit = false;

    if (state.voiceMonitor) {
      looperMonitorGain = ctx.createGain();
      looperMonitorGain.gain.value = 1;
      looperInputSource.connect(looperMonitorGain).connect(ctx.destination);
    }

    state.voiceRecordMode = 'loopComp';
    state.isVoiceRecording = true;
    state.isVoiceRecordArmed = false;
    state.voiceStartedAt = ctx.currentTime;
    state.voicePassStartedAt = ctx.currentTime;
    voiceStartedAt = ctx.currentTime;
    voicePassStartedAt = ctx.currentTime;
    state.voiceRecordingTime = 0;
    state.voiceTargetDuration = voiceLoopSeconds();
    state.voiceStackStatus = 'Looper recording...';

    looperScriptNode.onaudioprocess = event => {
      if (!state.isVoiceRecording) return;
      const inputBuffer = event.inputBuffer;
      const inputData = inputBuffer.getChannelData(0);
      looperRecordingBuffer.push(new Float32Array(inputData));

      const elapsed = ctx.currentTime - voicePassStartedAt;
      state.voiceRecordingTime = elapsed;

      const maxLoopSeconds = voiceLoopSeconds();
      if (elapsed >= maxLoopSeconds && !looperProcessingCommit) {
        commitCurrentLoopLayer(ctx, maxLoopSeconds);
      }
    };

    looperInputSource.connect(looperScriptNode);
    // ScriptProcessor must be connected to keep processing on mobile browsers.
    // The silent gain prevents mic monitoring unless Monitor is explicitly enabled.
    looperScriptNode.connect(looperSilentGain).connect(ctx.destination);

    clearInterval(voiceTimer);
    voiceTimer = setInterval(() => {
      if (!state.isVoiceRecording) return;
      const loopSeconds = voiceLoopSeconds();
      const elapsedTotal = ctx.currentTime - voiceStartedAt;
      const elapsedPass = ctx.currentTime - voicePassStartedAt;
      state.voiceRecordingTime = elapsedPass;
      const timer = $('.voiceTimer');
      if (timer) timer.textContent = `PASS ${Math.floor(elapsedTotal / loopSeconds) + 1} · ${formatTime(elapsedPass)} / ${formatTime(loopSeconds)}`;
    }, 100);

    render();
    toast('Live loop comp recording started');
  } catch (error) {
    console.error(error);
    state.isVoiceRecording = false;
    state.isVoiceRecordArmed = false;
    stopLiveLooper(false);
    alert('Microphone permission failed. Allow mic access and try again.');
  }
}

function commitCurrentLoopLayer(ctx, durationSeconds) {
  if (!state.isVoiceRecording || looperRecordingBuffer.length === 0) return;

  looperProcessingCommit = true;
  const chunks = looperRecordingBuffer;
  looperRecordingBuffer = [];
  voicePassStartedAt = ctx.currentTime;
  state.voicePassStartedAt = ctx.currentTime;
  state.voiceRecordingTime = 0;

  // Build the new layer outside the audio callback so the input stream stays responsive.
  setTimeout(async () => {
    try {
      const totalSamples = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      if (totalSamples < 32) return;

      const flattenedPCM = new Float32Array(totalSamples);
      let offset = 0;
      for (const chunk of chunks) {
        flattenedPCM.set(chunk, offset);
        offset += chunk.length;
      }

      const audioBuffer = makeVoiceBufferFromPCM(ctx, flattenedPCM, durationSeconds);
      const clipId = voiceClipId();
      const clipNumber = (state.voiceClips || []).length + 1;
      const clip = {
        id: clipId,
        name: `Loop Layer ${clipNumber}`,
        url: '',
        type: 'audio/wav',
        duration: durationSeconds,
        actualDuration: audioBuffer.duration,
        loopBars: state.loopBars,
        bpm: state.bpm,
        createdAt: new Date().toISOString(),
        loop: true,
        comp: true,
        stack: true,
        volume: 0.85,
        latencyOffset: 0,
        waveform: generatePCMVisualPeaks(flattenedPCM, 72)
      };

      voiceBufferCache.set(clipId, audioBuffer);
      savePCMDataUrlToClip(clip, flattenedPCM, ctx.sampleRate);

      state.voiceClips = [clip, ...(state.voiceClips || [])];
      voiceStackDirty = true;
      state.voiceStackStatus = `${state.voiceClips.filter(c => c.comp !== false && c.stack !== false).length} layers stacked`;
      pushHistory('Record voice loop layer');
      render();
      scheduleAutosave();

      // Restart the full DAW-style stack at the loop boundary so all layers share one sync point.
      if (state.isPlaying && state.voiceStackMode !== false) {
        playVoiceLoopClips({ forceRestart: true });
      }
    } catch (error) {
      console.warn('Voice loop layer commit failed:', error);
    } finally {
      looperProcessingCommit = false;
    }
  }, 0);
}

function stopLiveLooper(savePartial = true) {
  const ctx = audio.ctx;

  if (savePartial && state.isVoiceRecording && looperRecordingBuffer.length) {
    const elapsed = ctx ? Math.max(0.1, ctx.currentTime - voicePassStartedAt) : state.voiceRecordingTime;
    if (elapsed > 0.25 && ctx) commitCurrentLoopLayer(ctx, elapsed);
  }

  state.isVoiceRecording = false;
  state.isVoiceRecordArmed = false;
  state.voiceRecordingTime = 0;

  clearInterval(voiceTimer);
  clearInterval(voiceLoopCompTimer);
  clearTimeout(voiceRecordAutoStopTimer);

  try { looperScriptNode?.disconnect(); } catch {}
  try { looperInputSource?.disconnect(); } catch {}
  try { looperSilentGain?.disconnect(); } catch {}
  try { looperMonitorGain?.disconnect(); } catch {}

  looperScriptNode = null;
  looperInputSource = null;
  looperSilentGain = null;
  looperMonitorGain = null;
  looperRecordingBuffer = [];
  looperProcessingCommit = false;

  stopVoiceInputTracks();
  state.voiceStackStatus = state.voiceClips?.length ? `${state.voiceClips.filter(c => c.comp !== false && c.stack !== false).length} layers stacked` : 'Stopped';
  render();
  scheduleAutosave();
}

function stopVoiceRecording() {
  stopLiveLooper(true);
  toast('Voice loop comp stopped');
}


class DrumAudio {
  constructor() {
    this.ctx = null;
    this.buffers = new Map();
    this.reverseBuffers = new Map();
    this.loading = new Map();
    this.active = [];
  }

  async ensure() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: state.lowLatency ? 'interactive' : 'balanced' });
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    return this.ctx;
  }

  async load(url) {
    if (!url) return null;
    if (this.buffers.has(url)) return this.buffers.get(url);
    if (this.loading.has(url)) return this.loading.get(url);
    const promise = (async () => {
      const ctx = await this.ensure();
      const response = await fetch(url);
      const array = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(array.slice(0));
      this.buffers.set(url, buffer);
      this.updateLoadStatus();
      return buffer;
    })().finally(() => this.loading.delete(url));
    this.loading.set(url, promise);
    return promise;
  }

  async getBufferForPad(pad) {
    if (!pad?.url) return null;
    const buffer = await this.load(pad.url);
    if (!pad.reverse) return buffer;
    const key = pad.url + ':reverse';
    if (this.reverseBuffers.has(key)) return this.reverseBuffers.get(key);
    const reversed = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0, j = src.length - 1; i < src.length; i++, j--) dst[i] = src[j];
    }
    this.reverseBuffers.set(key, reversed);
    return reversed;
  }

  updateLoadStatus() {
    const urls = new Set(state.pads.filter(p => p.url).map(p => p.url));
    state.loadStatus = {
      loaded: [...urls].filter(url => this.buffers.has(url)).length,
      total: urls.size,
      ready: [...urls].every(url => this.buffers.has(url)),
    };
    updateLightUI();
  }

  async preloadKit() {
    await this.ensure();
    await Promise.allSettled(state.pads.filter(p => p.url).map(p => this.load(p.url)));
    this.updateLoadStatus();
    toast('Kit preloaded');
  }

  stopVoice(voice, fade = 0.015) {
    try {
      const now = this.ctx?.currentTime || 0;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value || 0.0001), now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
      voice.source.stop(now + fade + 0.003);
    } catch {}
    this.active = this.active.filter(v => v !== voice);
    state.activeVoices = this.active.length;
    updateLightUI();
  }

  enforce(chokeKey) {
    if (chokeKey) this.active.filter(v => v.chokeKey === chokeKey).forEach(v => this.stopVoice(v));
    while (this.active.length >= state.polyphony) this.stopVoice(this.active[0]);
  }

  updatePadVoices(padIndex) {
    if (!this.ctx) return;
    const pad = state.pads[padIndex];
    const rate = Math.pow(2, ((pad.tune || 0) + (pad.fine || 0) / 100) / 12);
    this.active.filter(v => v.padIndex === padIndex).forEach(v => {
      try { v.gain.gain.setTargetAtTime(Math.max(0.001, v.baseGain * (pad.volume ?? 1)), this.ctx.currentTime, 0.01); } catch {}
      try { if (v.pan) v.pan.pan.setTargetAtTime(clamp(pad.pan ?? 0, -1, 1), this.ctx.currentTime, 0.01); } catch {}
      try { v.source.playbackRate.setTargetAtTime(rate, this.ctx.currentTime, 0.01); } catch {}
    });
  }

  async playPad(padIndex, velocity = 110, when = 0) {
    const pad = state.pads[padIndex];
    if (!pad || pad.mute) return;
    const anySolo = state.pads.some(p => p.solo);
    if (anySolo && !pad.solo) return;

    const ctx = await this.ensure();
    let buffer = pad?.url ? this.buffers.get(pad.url) : null;

    // Mobile-safe drum playback:
    // if the WAV is not decoded yet, play a synthesized fallback immediately
    // and keep loading the real sample in the background. This prevents silent pads.
    if (pad?.url && !buffer) {
      this.load(pad.url).catch(error => {
        console.warn('Drum sample background load failed:', pad?.label, error);
      });
      return this.playFallback(padIndex, velocity);
    }

    try {
      buffer = buffer || await this.getBufferForPad(pad);
    } catch (error) {
      console.warn('Drum sample failed, using fallback:', pad?.label, error);
    }
    if (!buffer) return this.playFallback(padIndex, velocity);

    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const padVol = pad.volume ?? 1;
    const baseGain = (velocity / 127) * padVol;
    const rate = Math.pow(2, ((pad.tune || 0) + (pad.fine || 0) / 100) / 12);
    source.buffer = buffer;
    source.playbackRate.value = rate;
    gain.gain.value = Math.max(0.001, baseGain);
    if (pan) {
      pan.pan.value = clamp(pad.pan ?? 0, -1, 1);
      source.connect(gain).connect(pan).connect(ctx.destination);
    } else source.connect(gain).connect(ctx.destination);

    const chokeKey = pad.voiceMode === 'mono' ? `pad-${padIndex}` : (pad.chokeGroup > 0 ? `group-${pad.chokeGroup}` : null);
    this.enforce(chokeKey);

    const trimStart = clamp(Number(pad.trimStart ?? 0), 0, 0.98);
    const trimEnd = clamp(Number(pad.trimEnd ?? 1), trimStart + 0.01, 1);
    const startSec = trimStart * buffer.duration;
    const endSec = trimEnd * buffer.duration;
    const duration = Math.max(0.01, endSec - startSec);
    const startAt = ctx.currentTime + Math.max(0, when);

    if (pad.loop) {
      source.loop = true;
      source.loopStart = startSec;
      source.loopEnd = endSec;
      source.start(startAt, startSec);
      source.stop(startAt + Math.min(8, Math.max(0.25, duration * 8)));
    } else {
      source.start(startAt, startSec, duration);
    }

    const voice = { source, gain, pan, padIndex, baseGain: velocity / 127, chokeKey, startedAt: ctx.currentTime };
    this.active.push(voice);
    state.activeVoices = this.active.length;
    source.onended = () => {
      this.active = this.active.filter(v => v !== voice);
      state.activeVoices = this.active.length;
      updateLightUI();
    };
    updateLightUI();
  }

  async playFallback(padIndex, velocity = 110) {
    const ctx = await this.ensure();
    const pad = state.pads[padIndex] || {};
    const name = String(pad.label || '').toLowerCase();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const noiseGain = ctx.createGain();
    let duration = 0.18;

    if (name.includes('hat')) {
      osc.type = 'square';
      osc.frequency.value = name.includes('open') ? 6500 : 8200;
      duration = name.includes('open') ? 0.32 : 0.07;
    } else if (name.includes('snare') || name.includes('clap')) {
      osc.type = 'triangle';
      osc.frequency.value = name.includes('clap') ? 320 : 190;
      duration = 0.13;
    } else if (name.includes('808')) {
      osc.type = 'sine';
      osc.frequency.value = 52;
      duration = 0.42;
    } else {
      osc.type = 'sine';
      osc.frequency.value = 78;
      duration = 0.16;
    }

    const level = Math.max(0.001, (velocity / 127) * 0.52);
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);

    // Add a tiny burst to snares/claps/hats so fallback drums are audible on phones.
    if (name.includes('snare') || name.includes('clap') || name.includes('hat')) {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noiseGain.gain.setValueAtTime((velocity / 127) * 0.12, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      noise.connect(noiseGain).connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + duration + 0.02);
    }
  }

  chordInstrumentSettings() {
    const engine = state.synthEngine || {};
    const instrument = state.chordInstrument || 'Soft Synth';
    const base = {
      oscillator: engine.oscillator || 'triangle',
      filter: Number(engine.filter || 2600),
      resonance: Number(engine.resonance ?? 0.7),
      attack: Number(engine.attack ?? 0.012),
      release: Number(engine.release ?? 0.16),
      brightness: Number(engine.brightness ?? 0.7),
      detune: Number(engine.detune || 0),
      volume: Number(engine.volume ?? 0.9),
    };
    if (instrument === 'Piano') return { ...base, oscillator: 'triangle', filter: 5200, attack: 0.004, release: 0.18, brightness: 0.85 };
    if (instrument === 'Electric Piano') return { ...base, oscillator: 'sine', filter: 4200, attack: 0.01, release: 0.28, brightness: 0.72 };
    if (instrument === 'Pluck Synth') return { ...base, oscillator: 'sawtooth', filter: 1800, attack: 0.002, release: 0.08, brightness: 0.65 };
    if (instrument === 'Pad Synth') return { ...base, oscillator: 'sawtooth', filter: 2400, attack: 0.28, release: 0.8, brightness: 0.55 };
    if (instrument === 'Bass Synth') return { ...base, oscillator: 'square', filter: 900, attack: 0.006, release: 0.12, brightness: 0.45 };
    return base;
  }

  async startMidiNote(midi, velocity = 90, when = 0) {
    const ctx = await this.ensure();
    const settings = this.chordInstrumentSettings();
    const now = ctx.currentTime + Math.max(0, when);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    const instrument = state.chordInstrument || 'Soft Synth';
    let pitch = midi;
    if (instrument === 'Bass Synth') pitch = Math.min(midi, 60);
    osc.type = settings.oscillator;
    osc.frequency.setValueAtTime(midiToFreq(pitch), now);
    osc.detune.setValueAtTime(settings.detune, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(clamp(settings.filter * (0.5 + settings.brightness), 120, 12000), now);
    filter.Q.setValueAtTime(clamp(settings.resonance, 0.1, 12), now);
    const level = Math.max(0.0001, (velocity / 127) * 0.24 * settings.volume);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + Math.max(0.002, settings.attack));
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(now);
    const voice = { osc, gain, filter, stopped: false };
    voice.stop = (release = settings.release) => {
      if (voice.stopped) return;
      voice.stopped = true;
      const t = ctx.currentTime;
      try {
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || 0.0001), t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.015, release));
        osc.stop(t + Math.max(0.02, release) + 0.03);
      } catch {}
    };
    return voice;
  }

  async playMidiNote(midi, velocity = 90, durationBeats = 0.95, when = 0) {
    const beatSeconds = 60 / state.bpm;
    const duration = Math.max(0.06, beatSeconds * durationBeats);
    const voice = await this.startMidiNote(midi, velocity, when);
    setTimeout(() => voice.stop(), duration * 1000);
  }

  async startChord(degree, velocity = 0.8, octave = state.chordOctave || 4, inversion = state.chordInversion || 0, voicing = state.chordVoicing || 'Closed') {
    const notes = chordNotesForDegree(degree, octave, inversion, voicing);
    const voices = [];
    for (let i = 0; i < notes.length; i++) {
      voices.push(await this.startMidiNote(notes[i], Math.round(velocity * 127 / Math.max(1, notes.length)) + 42, i * 0.002));
    }
    return { degree, notes, voices, stop: () => voices.forEach(v => v.stop()) };
  }

  async playChord(degree, velocity = 0.6, durationBeats = 0.95, octave = state.chordOctave || 4, inversion = state.chordInversion || 0, voicing = state.chordVoicing || 'Closed') {
    const notes = chordNotesForDegree(degree, octave, inversion, voicing);
    notes.forEach((midi, index) => {
      this.playMidiNote(midi, Math.round(velocity * 127 / Math.max(1, notes.length)) + 42, durationBeats, index * 0.002);
    });
  }

  async click(isDownbeat = false) {
    if (!state.metronome) return;
    const ctx = await this.ensure();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 950, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(isDownbeat ? 0.23 : 0.13, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }
}

const audio = new DrumAudio();
let interval = null;
let countTimer = null;
let stepRef = 0;
let pendingTouchToggle = null;
let autosaveTimer = null;
let historyPast = [];
let historyFuture = [];
let lastHistoryTime = 0;
let activeChordHolds = new Map();
let pressedKeyboardPads = new Set();


function cloneForHistory(value) {
  return JSON.parse(JSON.stringify(value));
}

function mutationSnapshot() {
  return {
    bpm: state.bpm,
    loopBars: state.loopBars,
    grid: state.grid,
    snap: state.snap,
    quantize: state.quantize,
    swing: state.swing,
    metronome: state.metronome,
    countInBars: state.countInBars,
    followPlayhead: state.followPlayhead,
    lowLatency: state.lowLatency,
    polyphony: state.polyphony,
    selectedPad: state.selectedPad,
    editingPad: state.editingPad,
    editorPage: state.editorPage,
    sampleCategory: state.sampleCategory,
    search: state.search,
    chordKey: state.chordKey,
    chordMode: state.chordMode,
    selectedChordDegree: state.selectedChordDegree,
    chordSequence: cloneForHistory(state.chordSequence),
    chordMidiNotes: cloneForHistory(state.chordMidiNotes),
    chordTriggers: cloneForHistory(state.chordTriggers),
    voiceClips: cloneForHistory(state.voiceClips),
    voiceFx: cloneForHistory(state.voiceFx),
    voiceRecordMode: state.voiceRecordMode,
    voiceStackMode: state.voiceStackMode,
    pads: cloneForHistory(state.pads),
    pattern: cloneForHistory(state.pattern),
  };
}

function pushHistory(label = 'Edit', mergeWindowMs = 0) {
  const now = Date.now();
  if (mergeWindowMs && now - lastHistoryTime < mergeWindowMs && historyPast.length) {
    return;
  }
  historyPast.push({ label, snapshot: mutationSnapshot() });
  if (historyPast.length > HISTORY_LIMIT) historyPast.shift();
  historyFuture = [];
  lastHistoryTime = now;
  updateLightUI();
}

function restoreHistory(snapshot) {
  if (!snapshot) return;
  Object.assign(state, snapshot);
  state.pattern = Array.from({ length: 16 }, (_, r) =>
    Array.from({ length: totalTicks() }, (_, t) => snapshot.pattern?.[r]?.[t] || 0)
  );
  state.chordSequence = resizeChordSequence(snapshot.chordSequence || []);
  state.chordMidiNotes = sanitizeChordMidiNotes(snapshot.chordMidiNotes || []);
  state.chordTriggers = sanitizeChordTriggers(snapshot.chordTriggers || []);
  state.voiceClips = Array.isArray(snapshot.voiceClips) ? snapshot.voiceClips : [];
  state.slicerSourceId = snapshot.slicerSourceId || '';
  state.slicerSlices = Number(snapshot.slicerSlices || 16);
  state.slicerStartPad = Number(snapshot.slicerStartPad || 0);
  state.slicerChokeGroup = Number(snapshot.slicerChokeGroup || 8);
  state.pads = makeDefaultPads().map((base, i) => ({ ...base, ...(snapshot.pads?.[i] || {}) }));
  state.isPlaying = false;
  state.isRecording = false;
  state.isCountingIn = false;
  state.countText = '';
  state.currentStep = -1;
  stepRef = 0;
  render();
  scheduleAutosave();
}

function undo() {
  if (!historyPast.length) return toast('Nothing to undo');
  historyFuture.push({ label: 'Redo', snapshot: mutationSnapshot() });
  const entry = historyPast.pop();
  restoreHistory(entry.snapshot);
  toast(`Undo: ${entry.label}`);
}

function redo() {
  if (!historyFuture.length) return toast('Nothing to redo');
  historyPast.push({ label: 'Undo', snapshot: mutationSnapshot() });
  const entry = historyFuture.pop();
  restoreHistory(entry.snapshot);
  toast('Redo');
}

function playStep(step) {
  ensureLayers();
  const anySolo = state.pads.some(p => p.solo);
  activeLayersForPlayback('drums').forEach(layer => {
    const pattern = layer.data || state.pattern;
    for (let r = 0; r < 16; r++) {
      const vel = pattern?.[r]?.[step] || 0;
      const pad = state.pads[r];
      if (!vel || pad.mute || (anySolo && !pad.solo)) continue;
      audio.playPad(r, Math.round(vel * (layer.volume ?? 1)));
      flashPerformancePad('drums', r);
    }
  });
  activeLayersForPlayback('slicer').forEach(layer => {
    const pattern = layer.data || state.slicerPattern;
    for (let r = 0; r < 16; r++) {
      const vel = pattern?.[r]?.[step] || 0;
      if (vel) { playSlicerPad(r, Math.round(vel * (layer.volume ?? 1))); flashPerformancePad('slicer', r); }
    }
  });
  activeLayersForPlayback('melody').forEach(layer => {
    (layer.data || state.melodyEvents || []).filter(event => event.tick === step).forEach(event => {
      flashPerformancePad('melody', event.padIndex ?? 0, Math.max(100, (event.duration || gridTicks()) * 8));
      (event.notes || []).forEach((midi, offset) => audio.playMidiNote(midi, event.velocity || 100, Math.max(0.1, (event.duration || gridTicks()) / TICKS_PER_BEAT), offset * 0.002));
    });
  });
  const chordTriggers = activeLayersForPlayback('chords').flatMap(layer => layer.data || []).filter(trigger => trigger.tick === step);
  chordTriggers.forEach(trigger => {
    flashPerformancePad('chords', trigger.padIndex ?? trigger.degree ?? 0, Math.max(120, (trigger.duration || CHORD_NOTE_DURATION) * 8));
    audio.playChord(
      trigger.degree,
      (trigger.velocity || 100) / 127,
      Math.max(0.1, (trigger.duration || CHORD_NOTE_DURATION) / TICKS_PER_BEAT),
      trigger.octave || state.chordOctave,
      trigger.inversion || 0,
      trigger.voicing || state.chordVoicing
    );
  });
  // Backward compatibility: older builds may have saved expanded MIDI notes or chord blocks.
  const chordNotes = (state.chordMidiNotes || []).filter(note => note.tick === step);
  if (chordTriggers.length === 0) {
    chordNotes.forEach(note => audio.playMidiNote(note.pitch, note.velocity || 100, Math.max(0.1, (note.duration || CHORD_NOTE_DURATION) / TICKS_PER_BEAT)));
  }
  const chordDegree = state.chordSequence?.[step];
  if (chordTriggers.length === 0 && chordNotes.length === 0 && chordDegree !== null && chordDegree !== undefined) {
    audio.playChord(chordDegree);
  }
  eraseHeldPadAtStep(step);
  if (step % TICKS_PER_BEAT === 0) {
    audio.click(step % TICKS_PER_BAR === 0);
  }
  if (step === 0 && state.isPlaying) {
    playVoiceLoopClips();
    if (state.isVoiceRecordArmed && !state.isVoiceRecording) {
      beginVoiceRecordingNow();
    }
  }
}

function updatePlayhead() {
  $$('.step.now').forEach(el => el.classList.remove('now'));
  const col = Math.floor(state.currentStep / gridTicks());
  $$(`[data-col="${col}"]`).forEach(el => el.classList.add('now'));
  $('.counter') && ($('.counter').textContent = nowLabel());
  if (state.followPlayhead) {
    const rows = $('.seqRows');
    if (rows) {
      const target = col * 22 - rows.clientWidth * 0.45;
      if (Math.abs(rows.scrollLeft - target) > 70) rows.scrollLeft = clamp(target, 0, rows.scrollWidth - rows.clientWidth);
    }
  }
  if (state.page === 'chords') {
    $$('.chordGridCell.now').forEach(el => el.classList.remove('now'));
    const col = state.currentStep >= 0 ? Math.floor(state.currentStep / gridTicks()) : -1;
    if (col >= 0) $$(`[data-chord-col="${col}"]`).forEach(el => el.classList.add('now'));
  }
}

function updateTransportInterval() {
  if (!interval) return;
  clearInterval(interval);
  const tickMs = ((60000 / state.bpm) * 4) / TICKS_PER_BAR;
  interval = setInterval(() => {
    const max = totalTicks();
    const step = stepRef % max;
    state.currentStep = step;
    playStep(step);
    updatePlayhead();
    stepRef = (step + 1) % max;
  }, tickMs);
}

function setTempo(value, options = {}) {
  const next = clamp(Math.round(Number(value) || state.bpm), 40, 240);
  state.bpm = next;
  if (interval) updateTransportInterval();
  if (options.history) pushHistory('Set BPM');
  renderTransport();
  updateTapTempoModal();
  scheduleAutosave();
}

function openTapTempoModal() {
  state.tapTempoOpen = true;
  tapTempoTimes = [];
  render();
  setTimeout(() => $('#tapTempoLargeBtn')?.focus?.(), 0);
}

function closeTapTempoModal() {
  state.tapTempoOpen = false;
  tapTempoTimes = [];
  render();
}

function updateTapTempoModal() {
  const bpm = $('#tapTempoModalBpm');
  const hint = $('#tapTempoModalHint');
  const count = $('#tapTempoModalCount');
  const avg = $('#tapTempoModalAvg');
  if (bpm) bpm.textContent = String(state.bpm);
  if (count) count.textContent = `${tapTempoTimes.length} tap${tapTempoTimes.length === 1 ? '' : 's'}`;
  if (avg) avg.textContent = tapTempoTimes.length >= 2 ? `${state.bpm} BPM` : '—';
  if (hint) {
    hint.textContent = tapTempoTimes.length < 2
      ? 'Tap the large button at least twice'
      : 'BPM updated live';
  }
}

function resetTapTempo() {
  tapTempoTimes = [];
  updateTapTempoModal();
}

function handleTapTempo() {
  const now = performance.now();
  const previous = tapTempoTimes[tapTempoTimes.length - 1];

  if (previous) {
    const gap = now - previous;
    if (gap > TAP_TEMPO_MAX_GAP_MS) tapTempoTimes = [];
    if (gap < TAP_TEMPO_MIN_INTERVAL_MS) return;
  }

  tapTempoTimes.push(now);
  tapTempoTimes = tapTempoTimes.slice(-6);

  const buttons = [$('#tapTempoBtn'), $('#tapTempoLargeBtn')].filter(Boolean);
  buttons.forEach(button => button.classList.add('tapped'));
  setTimeout(() => buttons.forEach(button => button.classList.remove('tapped')), 110);

  if (tapTempoTimes.length >= 2) {
    const intervals = [];
    for (let i = 1; i < tapTempoTimes.length; i++) {
      const gap = tapTempoTimes[i] - tapTempoTimes[i - 1];
      if (gap >= TAP_TEMPO_MIN_INTERVAL_MS && gap <= TAP_TEMPO_MAX_INTERVAL_MS) intervals.push(gap);
    }
    if (intervals.length) {
      intervals.sort((a, b) => a - b);
      const trimmed = intervals.length > 2 ? intervals.slice(1, -1) : intervals;
      const avg = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
      setTempo(60000 / avg);
    }
  }

  updateTapTempoModal();
}

async function start() {
  if (interval) stop(false);
  await audio.ensure();
  state.isPlaying = true;
  state.currentStep = 0;
  stepRef = 0;
  renderTransport();
  playStep(0);
  updatePlayhead();
  stepRef = 1;
  const tickMs = ((60000 / state.bpm) * 4) / TICKS_PER_BAR;
  interval = setInterval(() => {
    const max = totalTicks();
    const step = stepRef % max;
    state.currentStep = step;
    playStep(step);
    updatePlayhead();
    stepRef = (step + 1) % max;
  }, tickMs);
}

function stop(reset = true) {
  if (interval) clearInterval(interval);
  if (countTimer) clearTimeout(countTimer);
  interval = null;
  countTimer = null;
  state.isPlaying = false;
  state.isCountingIn = false;
  state.isVoiceRecordArmed = false;
  if (state.isVoiceRecording) stopVoiceRecording();
  stopVoiceLoopClips();
  stopSlicerPadVoices();
  if (reset) {
    state.currentStep = -1;
    stepRef = 0;
  }
  render();
}

async function requestRecord() {
  if (state.isRecording) {
    state.isRecording = false;
    state.countText = '';
    render();
    return;
  }
  if (!interval) await start();
  state.isRecording = true;
  state.isCountingIn = false;
  state.countText = '';
  render();
}

function recordChordNotes(degree, octave, velocity, tick, duration, inversion = state.chordInversion, voicing = state.chordVoicing) {
  const safeTick = clamp(Number(tick || 0), 0, totalTicks() - 1);
  const safeDuration = Math.max(1, Number(duration || gridTicks()));
  const incoming = chordNotesToMidiNotes(degree, octave, safeTick, velocity, safeDuration, inversion, voicing);
  const incomingPitches = new Set(incoming.map(note => note.pitch));
  state.chordMidiNotes = (state.chordMidiNotes || []).filter(note => !(note.tick === safeTick && incomingPitches.has(note.pitch)));
  state.chordMidiNotes.push(...incoming);
  state.chordSequence[safeTick] = degree;
}

function recordChordTrigger(degree, octave = state.chordOctave || 4, velocity = 110, duration = CHORD_NOTE_DURATION, tickOverride = null, inversion = state.chordInversion, voicing = state.chordVoicing, padIndex = null) {
  const rawTick = tickOverride === null ? (state.currentStep >= 0 ? state.currentStep : 0) : tickOverride;
  const tick = snapEventTick(rawTick, 'chords');
  const safeDuration = Math.max(1, Number(duration || (snapOptionTicks(activeLayerSnapLabel('chords')) || gridTicks())));
  const trigger = {
    id: makeChordTriggerId(),
    degree: clamp(Number(degree), 0, degreeCount() - 1),
    padIndex: Number.isFinite(Number(padIndex)) ? clamp(Number(padIndex), 0, 15) : null,
    tick,
    duration: safeDuration,
    velocity: clamp(Number(velocity || 100), 1, 127),
    octave: clamp(Number(octave || state.chordOctave || 4), 1, 7),
    inversion: clamp(Number(inversion || 0), 0, Math.max(0, chordModeSize() - 1)),
    voicing: voicing || state.chordVoicing || 'Closed',
    chordKey: state.chordKey,
    chordScale: state.chordScale,
    chordNoteCount: chordModeSize(),
  };
  trigger.label = chordDegreeLabel(trigger.degree, trigger.inversion);
  trigger.name = chordNameForDegree(trigger.degree, trigger.octave, trigger.inversion, trigger.voicing);
  const triggerLane = trigger.padIndex !== null ? trigger.padIndex : trigger.degree;
  state.chordTriggers = (state.chordTriggers || []).filter(existing => {
    const existingLane = existing.padIndex !== null && existing.padIndex !== undefined ? existing.padIndex : existing.degree;
    return !(existing.tick === tick && existingLane === triggerLane);
  });
  state.chordTriggers.push(trigger);
  state.chordSequence[tick] = trigger.degree;
  // Keep expanded notes available for future MIDI export, but the editable grid records chord triggers.
  state.chordMidiNotes = expandChordTriggersForMidiExport();
}

function recordChordAsMidiNotes(degree, octave = state.chordOctave || 4, velocity = 110, duration = CHORD_NOTE_DURATION, tickOverride = null, inversion = state.chordInversion, voicing = state.chordVoicing) {
  recordChordTrigger(degree, octave, velocity, duration, tickOverride, inversion, voicing);
}

function currentTickForRecord() {
  return state.currentStep >= 0 ? state.currentStep : 0;
}

function quantizeDuration(startTick, endTick) {
  const max = totalTicks();
  let start = state.snap ? snapTick(startTick) : clamp(startTick, 0, max - 1);
  let end = state.snap ? snapTick(endTick) : clamp(endTick, 0, max - 1);
  let duration = end >= start ? end - start : (max - start) + end;
  const min = state.snap ? gridTicks() : 1;
  if (duration < min) duration = min;
  return { start, duration: clamp(duration, 1, max) };
}

function beginChordHold(holdKey, degree, octave = state.chordOctave || 4, velocity = 110, inversion = state.chordInversion, voicing = state.chordVoicing, padIndex = null) {
  if (activeChordHolds.has(holdKey)) return;
  state.selectedChordDegree = degree;
  audio.startChord(degree, velocity / 127, octave, inversion, voicing).then(voice => {
    const hold = activeChordHolds.get(holdKey);
    if (hold) hold.voice = voice;
    else voice.stop();
  });
  activeChordHolds.set(holdKey, { degree, octave, velocity, inversion, voicing, padIndex, startTick: currentTickForRecord(), voice: null });
  updateLightUI();
}

function endChordHold(holdKey) {
  const hold = activeChordHolds.get(holdKey);
  if (!hold) return;
  activeChordHolds.delete(holdKey);
  hold.voice?.stop();
  if (state.isRecording) {
    const timing = quantizeDuration(hold.startTick, currentTickForRecord());
    pushHistory('Record held chord trigger');
    recordChordTrigger(hold.degree, hold.octave, hold.velocity, timing.duration, timing.start, hold.inversion, hold.voicing, hold.padIndex);
    renderChordPage();
    scheduleAutosave();
  }
  updateLightUI();
}

function triggerChordFromPad(index, velocity = 110) {
  const info = chordPadInfo(index);
  state.selectedPad = index;
  state.selectedChordDegree = info.degree;
  audio.playChord(info.degree, velocity / 127, 0.95, info.octave, info.inversion, state.chordVoicing);
  if (state.isRecording) {
    pushHistory('Record chord notes from MPC pad');
    recordChordTrigger(info.degree, info.octave, velocity, CHORD_NOTE_DURATION, null, info.inversion, state.chordVoicing, index);
    renderChordPage();
    scheduleAutosave();
  }
  updateLightUI();
}

function triggerChord(degree, shouldRecord = true, octave = state.chordOctave || 4) {
  state.selectedChordDegree = degree;
  audio.playChord(degree, 0.7, 0.95, octave, state.chordInversion, state.chordVoicing);
  if (shouldRecord && state.isRecording) {
    pushHistory('Record chord as MIDI notes');
    recordChordAsMidiNotes(degree, octave, 110);
    renderChordPage();
    scheduleAutosave();
  } else {
    renderChordPage();
  }
}

function setChordMidiNote(tick, pitch) {
  pushHistory('Chord MIDI note');
  const safeTick = clamp(tick, 0, totalTicks() - 1);
  const existing = (state.chordMidiNotes || []).find(note => note.tick === safeTick && note.pitch === pitch);
  if (existing) {
    state.chordMidiNotes = state.chordMidiNotes.filter(note => note.id !== existing.id);
  } else {
    state.chordMidiNotes.push({
      id: makeChordNoteId(),
      pitch,
      tick: safeTick,
      duration: gridTicks(),
      velocity: 100,
      degree: null,
      label: midiName(pitch),
    });
  }
  renderChordPage();
  scheduleAutosave();
}

function clearChordSequence() {
  pushHistory('Clear chord triggers');
  state.chordSequence = makeChordSequence();
  state.chordMidiNotes = makeChordMidiNotes();
state.chordTriggers = makeChordTriggers();
  syncActiveLayer('chords');
  renderChordPage();
  scheduleAutosave();
}

function copyChordBar() {
  pushHistory('Copy chord trigger bar');
  const firstBarTriggers = (state.chordTriggers || []).filter(trigger => trigger.tick < TICKS_PER_BAR);
  state.chordTriggers = [];
  state.chordTriggers = [];
  state.chordMidiNotes = [];
  state.chordSequence = makeChordSequence();
  for (let bar = 0; bar < state.loopBars; bar++) {
    firstBarTriggers.forEach(trigger => {
      const tick = trigger.tick + bar * TICKS_PER_BAR;
      if (tick < totalTicks()) {
        state.chordTriggers.push({ ...trigger, id: makeChordTriggerId(), tick });
        state.chordSequence[tick] = trigger.degree;
      }
    });
  }
  state.chordMidiNotes = expandChordTriggersForMidiExport();
  renderChordPage();
  scheduleAutosave();
}

function renderChordPage() {
  if (state.page === 'chords') render();
  else updatePlayhead();
}

function setLoopBars(value) {
  pushHistory('Loop bars');
  const old = state.pattern;
  state.loopBars = Number(value);
  state.pattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => old[r]?.[t] || 0));
  state.chordSequence = resizeChordSequence(state.chordSequence || []);
  state.chordMidiNotes = sanitizeChordMidiNotes(state.chordMidiNotes || []);
  state.chordTriggers = sanitizeChordTriggers(state.chordTriggers || []);
  state.chordMidiNotes = expandChordTriggersForMidiExport();
  state.slicerPattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => state.slicerPattern?.[r]?.[t] || 0));
  state.melodyEvents = sanitizeMelodyEvents(state.melodyEvents || []);
  ensureLayers();
  render();
  scheduleAutosave();
}

function setPadValue(index, key, value) {
  pushHistory('Pad edit', 350);
  state.pads[index] = { ...state.pads[index], [key]: value };
  audio.updatePadVoices(index);
  renderEditorBody();
  scheduleAutosave();
}

function assignSample(sample) {
  pushHistory('Assign sample');
  const i = state.selectedPad;
  state.pads[i] = {
    ...state.pads[i],
    label: sample.name,
    short: shortLabel(sample.name),
    sample: sample.name,
    url: sample.url,
    category: sample.category,
    trimStart: 0,
    trimEnd: 1,
    loop: false,
    reverse: false,
  };
  audio.load(sample.url).then(() => {
    render();
    drawWaveform();
  });
  render();
  scheduleAutosave();
}


function renderUniversalEditGridHTML() {
  const type = currentEditInstrument();
  ensureLayers();
  const layer = currentLayer(type) || {};
  const g = snapOptionTicks(layer.snap || state.grid || '1/16') || gridTicks();
  const cols = Math.ceil(totalTicks() / g);
  let rows = [];
  if (type === 'drums') {
    rows = state.pads.map((pad, row) => ({ label: pad.label, color: pad.color, row, hit: tick => (state.pattern?.[row]?.[tick] || 0) > 0 }));
  } else if (type === 'slicer') {
    rows = Array.from({ length: 16 }, (_, row) => ({ label: `Slice ${row + 1}`, color: DEGREE_COLORS[row % DEGREE_COLORS.length], row, hit: tick => (state.slicerPattern?.[row]?.[tick] || 0) > 0 }));
  } else if (type === 'chords') {
    rows = Array.from({ length: 16 }, (_, row) => { const info = chordPadInfo(row); return { label: chordNameForDegree(info.degree, info.octave, info.inversion, state.chordVoicing), color: DEGREE_COLORS[info.degree % DEGREE_COLORS.length], row, hit: tick => (state.chordTriggers || []).some(ev => ev.padIndex === row && tick >= ev.tick && tick < ev.tick + (ev.duration || CHORD_NOTE_DURATION)) }; });
  } else {
    rows = Array.from({ length: 16 }, (_, row) => { const info = melodyPadInfo(row); return { label: info.label, color: DEGREE_COLORS[info.degree % DEGREE_COLORS.length], row, hit: tick => (state.melodyEvents || []).some(ev => ev.padIndex === row && tick >= ev.tick && tick < ev.tick + (ev.duration || g)) }; });
  }
  const barNumbers = Array.from({ length: state.loopBars }, (_, bar) => `<div class="universalBar" style="left:${(bar / state.loopBars) * 100}%">${bar + 1}</div>`).join('');
  const body = rows.map(item => {
    const cells = Array.from({ length: cols }, (_, col) => {
      const tick = col * g;
      return `<button class="universalCell ${item.hit(tick) ? 'hit' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''}" data-edit-cell="${type}:${item.row}:${tick}"></button>`;
    }).join('');
    return `<div class="universalGridRow"><button class="universalRowName"><i class="${item.color}"></i><span>${escapeHTML(item.label)}</span></button><div class="universalSteps" style="grid-template-columns:repeat(${cols}, 28px)">${cells}</div></div>`;
  }).join('');
  return `<section class="universalEditPage">
    <div class="universalEditTop"><button data-back-from-edit>← Back</button><b>${type.toUpperCase()} · ${escapeHTML(layer.name || 'Layer')}</b><span>Snap ${escapeHTML(layer.snap || state.grid)}</span><button data-clear-layer="${type}" class="danger">Clear</button></div>
    <div class="universalTimeline">${barNumbers}</div>
    <div class="universalGridScroll">${body}</div>
    <div class="universalEditBottom"><button id="undoBtnGrid">Undo</button><button data-toggle-erase class="${state.eraseMode ? 'active danger' : ''}">Erase ${state.eraseMode ? 'On' : 'Off'}</button><button data-quantize-layer="${type}">Quantize</button></div>
  </section>`;
}

function toggleUniversalGridCell(type, row, tick) {
  pushHistory(`Edit ${type} grid`, 350);
  if (type === 'drums') {
    if (!state.pattern[row]) state.pattern[row] = Array(totalTicks()).fill(0);
    state.pattern[row][tick] = state.pattern[row][tick] ? 0 : 100;
    if (state.pattern[row][tick]) audio.playPad(row, 100);
    syncActiveLayer('drums');
  } else if (type === 'slicer') {
    if (!state.slicerPattern[row]) state.slicerPattern[row] = Array(totalTicks()).fill(0);
    state.slicerPattern[row][tick] = state.slicerPattern[row][tick] ? 0 : 100;
    if (state.slicerPattern[row][tick]) playSlicerPad(row, 100);
    syncActiveLayer('slicer');
  } else if (type === 'chords') {
    const info = chordPadInfo(row);
    const existing = (state.chordTriggers || []).find(ev => ev.padIndex === row && ev.tick === tick);
    if (existing) state.chordTriggers = state.chordTriggers.filter(ev => ev !== existing);
    else recordChordTrigger(info.degree, info.octave, 110, snapOptionTicks(activeLayerSnapLabel('chords')) || CHORD_NOTE_DURATION, tick, info.inversion, state.chordVoicing, row);
    state.chordMidiNotes = expandChordTriggersForMidiExport();
    syncActiveLayer('chords');
  } else if (type === 'melody') {
    const existing = (state.melodyEvents || []).find(ev => ev.padIndex === row && ev.tick === tick);
    if (existing) state.melodyEvents = state.melodyEvents.filter(ev => ev !== existing);
    else recordMelodyEvent(row, tick, snapOptionTicks(activeLayerSnapLabel('melody')) || gridTicks(), 110);
    syncActiveLayer('melody');
  }
  render();
  scheduleAutosave();
}

function bindUniversalEditGrid() {
  $('[data-back-from-edit]')?.addEventListener('click', () => { state.page = state.editInstrument === 'drums' ? 'play' : state.editInstrument; render(); });
  $('#undoBtnGrid')?.addEventListener('click', undo);
  $$('[data-edit-cell]').forEach(btn => btn.addEventListener('click', () => {
    const [type, row, tick] = btn.dataset.editCell.split(':');
    toggleUniversalGridCell(type, Number(row), Number(tick));
  }));
  $$('[data-quantize-layer]').forEach(btn => btn.addEventListener('click', () => toast('Layer already snaps by default')));
}

function render() {
  const app = $('#app');
  app.innerHTML = `
    <main class="appLocked">
      ${state.page === 'play' ? renderPlayPageHTML() : ''}
      ${state.page === 'samples' ? renderSamplesPageHTML() : ''}
      ${state.page === 'chords' ? renderChordsPageHTML() : ''}
      ${state.page === 'melody' ? renderMelodyPageHTML() : ''}
      ${state.page === 'slicer' ? renderSlicerPageHTML() : ''}
      ${state.page === 'voice' ? renderVoicePageHTML() : ''}
      ${state.page === 'settings' ? renderSettingsPageHTML() : ''}
      ${state.page === 'editGrid' ? renderUniversalEditGridHTML() : ''}
      ${renderTapTempoModalHTML()}
      <div id="countMount"></div>
      <nav class="bottomNav">
        <button data-page="play" class="${state.page === 'play' ? 'active' : ''}">Drums</button>
        <button data-page="samples" class="${state.page === 'samples' ? 'active' : ''}">Samples</button>
        <button data-page="chords" class="${state.page === 'chords' ? 'active' : ''}">Chords</button>
        <button data-page="melody" class="${state.page === 'melody' ? 'active' : ''}">Melody</button>
        <button data-page="slicer" class="${state.page === 'slicer' ? 'active' : ''}">Slicer</button>
        <button data-page="voice" class="${state.page === 'voice' ? 'active' : ''}">Voice</button>
        <button data-page="settings" class="${state.page === 'settings' ? 'active' : ''}">Settings</button>
      </nav>
    </main>
  `;
  bindCommon();
  if (state.page === 'play') bindPlay();
  if (state.page === 'samples') bindSamples();
  if (state.page === 'chords') bindChords();
  if (state.page === 'melody') bindMelody();
  if (state.page === 'slicer') bindSlicer();
  if (state.page === 'voice') bindVoice();
  if (state.page === 'settings') bindSettings();
  if (state.page === 'editGrid') bindUniversalEditGrid();
  renderCountOverlay();
  updatePlayhead();
  drawWaveform();
}

function renderTransportHTML() {
  return `
    <header class="miniTransport">
      <div class="brandSmall"><b>PANGEA</b><span>STUDIO</span></div>
      <button class="undoBtn" id="undoBtn" aria-label="Undo">UNDO</button>
      <button class="tapTempoBtn" id="tapTempoBtn" aria-label="Open tap tempo">TAP</button>
      <div class="statusPill" id="bpmPill">${state.bpm} BPM</div>
      <div class="statusPill" id="barPill">${state.loopBars} BARS</div>
      <button class="iconBtn play" id="playBtn" aria-label="Play">▶</button>
      <button class="iconBtn" id="stopBtn" aria-label="Stop">■</button>
      <button class="iconBtn rec ${state.isRecording ? 'active' : ''}" id="recBtn" aria-label="Record">●</button>
      <div class="counter">${nowLabel()}</div>
    </header>`;
}

function renderTapTempoModalHTML() {
  if (!state.tapTempoOpen) return '';
  return `
    <div class="tapTempoOverlay" data-close-tap-overlay="true">
      <section class="tapTempoModal" role="dialog" aria-modal="true" aria-label="Tap tempo">
        <div class="tapTempoModalTop">
          <div>
            <small>TAP TEMPO</small>
            <b><span id="tapTempoModalBpm">${state.bpm}</span> BPM</b>
          </div>
          <button id="tapTempoClose" aria-label="Close tap tempo">×</button>
        </div>

        <button class="tapTempoLargeBtn" id="tapTempoLargeBtn">TAP</button>

        <div class="tapTempoModalFooter">
          <span id="tapTempoModalHint">Tap the large button at least twice</span>
          <b id="tapTempoModalCount">0 taps</b>
        </div>

        <div class="tapTempoLiveReadout">Live estimate: <b id="tapTempoModalAvg">—</b></div>

        <button class="tapTempoResetBtn" id="tapTempoResetBtn">Reset taps</button>
      </section>
    </div>`;
}


function renderInstrumentModeBar(instrument, view, clearLabel) {
  const name = instrument === 'drums' ? 'Drums' : instrument === 'chords' ? 'Chords' : instrument === 'melody' ? 'Melody' : 'Slicer';
  const keyInfo = (instrument === 'chords' || instrument === 'melody') ? ` · ${state.chordKey} ${state.chordScale}` : '';
  return `<div class="instrumentModeBar performanceModeBar">
    <b>${name}</b><span>Play by feel${keyInfo}</span>
    <button data-view-target="${instrument}" data-view-mode="pads" class="active">Pads</button>
    <button data-clear-instrument="${instrument}" class="danger">Clear ${clearLabel || name}</button>
  </div>`;
}
function setInstrumentView(target, mode) {
  if (target === 'chords') state.chordView = mode;
  else if (target === 'melody') state.melodyView = mode;
  else if (target === 'slicer') state.slicerView = mode;
  else state.drumView = mode;
  render();
  scheduleAutosave();
}

function clearInstrumentPattern(target) {
  const label = target === 'chords' ? 'chord triggers' : target === 'all' ? 'all patterns' : 'drum pattern';
  if (!confirm(`Clear ${label}?`)) return;
  pushHistory(`Clear ${label}`);
  if (target === 'drums' || target === 'all') { state.pattern = makePattern(); syncActiveLayer('drums'); }
  if (target === 'slicer' || target === 'all') { state.slicerPattern = makeSlicerPattern(); syncActiveLayer('slicer'); }
  if (target === 'melody' || target === 'all') { state.melodyEvents = []; syncActiveLayer('melody'); }
  if (target === 'chords' || target === 'all') {
    state.chordMidiNotes = makeChordMidiNotes();
state.chordTriggers = makeChordTriggers();
    state.chordSequence = makeChordSequence();
    syncActiveLayer('chords');
  }
  render();
  scheduleAutosave();
}

function renderPlayPageHTML() {
  state.padMode = 'drums';
  return `
    <section class="playPage instrumentPage padsView performanceFirstPage">
      ${renderTransportHTML()}
      ${renderInstrumentModeBar('drums', 'pads', 'Drums')}
      ${renderLayerBar('drums')}
      <div class="performanceArea performanceOnlyArea">
        <div class="bottomArea">${state.editingPad === null ? renderPadsHTML() : renderTrackEditorHTML()}</div>
      </div>
    </section>`;
}

function renderSequencerHTML() {
  const isGridFull = (state.drumView || 'split') === 'grid';
  const g = gridTicks();
  const cols = Math.ceil(totalTicks() / g);
  const bars = Array.from({ length: state.loopBars }, (_, i) => `<span style="left:${(i / state.loopBars) * 100}%">${i + 1}</span>`).join('');

  if (false && isGridFull) {
    const gridTemplate = `42px repeat(${state.pads.length}, 64px)`;
    const topLabels = state.pads.map((pad, index) => `
      <button class="rotatedTopName ${pad.color} ${state.editingPad === index ? 'editing' : ''}" data-edit-pad="${index}" title="${escapeAttr(pad.label)}">
        <i class="${pad.color}"></i>
        <b>${index + 1}</b>
        <span>${escapeHTML(pad.label)}</span>
      </button>
    `).join('');
    const timeRows = Array.from({ length: cols }, (_, c) => {
      const tick = c * g;
      const beat = Math.floor((tick % TICKS_PER_BAR) / TICKS_PER_BEAT) + 1;
      const bar = Math.floor(tick / TICKS_PER_BAR) + 1;
      const rowCells = state.pads.map((pad, r) => {
        const hit = state.pattern[r]?.[tick] || 0;
        return `<button class="step rotatedStep ${hit ? 'hit' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''} ${tick % TICKS_PER_BAR === 0 ? 'barStep' : ''}" data-row="${r}" data-col="${c}" aria-label="${escapeAttr(pad.label)} bar ${bar} beat ${beat}"></button>`;
      }).join('');
      return `<div class="rotatedGridRow ${tick % TICKS_PER_BAR === 0 ? 'barRow' : ''}" style="grid-template-columns:${gridTemplate}">
        <div class="rotatedTimeLabel"><b>${bar}.${beat}</b><small>${c + 1}</small></div>
        ${rowCells}
      </div>`;
    }).join('');

    return `<section class="playSequencer gridFullRoll rotatedMidiRoll drumRotatedRoll">
      <div class="rotatedMiniStrip">DRUMS · ${state.grid} · SNAP ${state.snap ? 'ON' : 'OFF'} · ${state.loopBars} BARS · SOUND COLUMNS</div>
      <div class="rotatedGridScroller seqRows">
        <div class="rotatedTopLabels" style="grid-template-columns:${gridTemplate}">
          <div class="rotatedCorner">TIME</div>
          ${topLabels}
        </div>
        ${timeRows}
      </div>
    </section>`;
  }

  const rows = state.pads.map((pad, r) => {
    const cells = Array.from({ length: cols }, (_, c) => {
      const tick = c * g;
      const hit = state.pattern[r]?.[tick] || 0;
      return `<button class="step ${hit ? 'hit' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''} ${tick % TICKS_PER_BAR === 0 ? 'barStep' : ''}" data-row="${r}" data-col="${c}"></button>`;
    }).join('');
    return `<div class="seqRow">
      <button class="rowName ${state.editingPad === r ? 'editing' : ''}" data-edit-pad="${r}"><i class="${pad.color}"></i><b>${r + 1}</b><span>${escapeHTML(pad.label)}</span></button>
      <div class="stepGrid" style="grid-template-columns:repeat(${cols}, 18px)">${cells}</div>
    </div>`;
  }).join('');
  return `<section class="playSequencer">
    <div class="seqHeader"><span>MIDI GRID</span><small>${state.grid} · snap ${state.snap ? 'on' : 'off'} · 2-finger pan</small></div>
    <div class="barNumbers">${bars}</div>
    <div class="seqRows">${rows}</div>
  </section>`;
}

function renderPadsHTML() {
  if (state.padMode === 'chords') {
    return `<section class="mpcOnly chordMpcMode">
      ${state.pads.map((pad, i) => {
        const info = chordPadInfo(i);
        return `<button class="mpcPad chordTrigger ${DEGREE_COLORS[info.degree % DEGREE_COLORS.length]} ${state.selectedPad === i ? 'selected' : ''}" data-pad="${i}"><span>${i + 1}</span><b>${escapeHTML(chordDegreeLabel(info.degree, info.inversion))}<br><em>${escapeHTML(chordNameForDegree(info.degree, info.octave, info.inversion, state.chordVoicing))} · O${info.octave}</em></b></button>`;
      }).join('')}
    </section>`;
  }
  return `<section class="mpcOnly">
    ${state.pads.map((pad, i) => `<button class="mpcPad ${pad.color} ${state.selectedPad === i ? 'selected' : ''}" data-pad="${i}"><span>${i + 1}</span><b>${escapeHTML(pad.short).replace(/\n/g, '<br>')}</b></button>`).join('')}
  </section>`;
}

function renderTrackEditorHTML() {
  const pad = state.pads[state.editingPad];
  return `<section class="trackEditor fixedPadEditor" id="trackEditor">
    <div class="editorTop miniEditorTop">
      <button class="backBtn" id="closeEditor">‹</button>
      <div class="editorTitle"><small>${state.editorPage === 'mix' ? 'MIX EDITOR' : 'SAMPLE EDITOR'}</small><b><i class="${pad.color}"></i>${state.editingPad + 1} ${escapeHTML(pad.label)}</b></div>
      <button class="previewBtn" id="previewPad">▶</button>
      <button class="closeBtn" id="closeEditor2">×</button>
    </div>
    <div class="editorHint">Two-finger swipe editor to switch pages · ${state.editorPage === 'mix' ? 'Mix' : 'Sample'}</div>
    <div id="editorBody">${state.editorPage === 'mix' ? renderMixEditorHTML(pad) : renderSampleEditorHTML(pad)}</div>
  </section>`;
}

function renderMixEditorHTML(pad) {
  return `<div class="minimalEditorGrid">
    ${rangeControl('Volume', 'volume', 0, 2, 0.01, pad.volume, `${(((pad.volume ?? 1) - 1) * 12).toFixed(1)} dB`)}
    ${rangeControl('Pan', 'pan', -1, 1, 0.01, pad.pan, (pad.pan ?? 0) === 0 ? 'C' : (pad.pan ?? 0) < 0 ? 'L' : 'R')}
    ${rangeControl('Pitch', 'tune', -24, 24, 1, pad.tune, `${pad.tune ?? 0} st`)}
    ${rangeControl('Fine', 'fine', -100, 100, 1, pad.fine, `${pad.fine ?? 0} ct`)}
    <label class="editorSelectRow"><span>Choke</span><select data-pad-key="chokeGroup">${[0,1,2,3,4,5,6,7,8].map(g => `<option value="${g}" ${pad.chokeGroup === g ? 'selected' : ''}>${g === 0 ? 'Off' : `Group ${g}`}</option>`).join('')}</select></label>
    <label class="editorSelectRow"><span>Voice</span><select data-pad-key="voiceMode">${['poly','mono'].map(m => `<option value="${m}" ${pad.voiceMode === m ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
    <div class="editorActionRow"><button data-toggle="mute" class="${pad.mute ? 'active' : ''}">Mute</button><button data-toggle="solo" class="${pad.solo ? 'active' : ''}">Solo</button><button id="closeEditor3">Close</button></div>
  </div>`;
}

function renderSampleEditorHTML(pad) {
  return `<div class="sampleEditorGrid">
    <div class="wavePanel">
      <canvas id="waveCanvas" class="waveCanvas"></canvas>
      <div class="trimOverlay"><span style="left:${(pad.trimStart ?? 0) * 100}%"></span><span style="left:${(pad.trimEnd ?? 1) * 100}%"></span></div>
    </div>
    <label class="editorControl wide"><span>Start</span><input data-pad-key="trimStart" type="range" min="0" max="0.98" step="0.001" value="${pad.trimStart ?? 0}"><b>${Math.round((pad.trimStart ?? 0) * 100)}%</b></label>
    <label class="editorControl wide"><span>End</span><input data-pad-key="trimEnd" type="range" min="0.02" max="1" step="0.001" value="${pad.trimEnd ?? 1}"><b>${Math.round((pad.trimEnd ?? 1) * 100)}%</b></label>
    <div class="editorActionRow sampleActions"><button data-toggle="loop" class="${pad.loop ? 'active' : ''}">Loop</button><button data-toggle="reverse" class="${pad.reverse ? 'active' : ''}">Reverse</button><button id="previewRegion">Preview</button></div>
  </div>`;
}

function rangeControl(name, key, min, max, step, value, readout) {
  return `<label class="editorControl"><span>${name}</span><input data-pad-key="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value ?? 0}"><b>${readout}</b></label>`;
}

function renderSamplesPageHTML() {
  const cats = FACTORY_CATEGORIES.map(c => ({ ...c, samples: c.samples.filter(s => s.name.toLowerCase().includes(state.search.toLowerCase())) }));
  return `<section class="samplesPage pageScroll">
    <h2>Samples</h2>
    <div class="selectedInfo">Assigning to pad <b>${state.selectedPad + 1}</b>: ${escapeHTML(state.pads[state.selectedPad].label)}</div>
    <div class="padSelectMini">${state.pads.map((p,i)=>`<button data-select-pad="${i}" class="${state.selectedPad===i?'active':''}">${i+1}</button>`).join('')}</div>
    <label class="import"><span>Import Sample</span><input id="importSample" type="file" accept="audio/*,.wav,.mp3,.aiff,.aif"></label>
    <div class="search"><input id="sampleSearch" value="${escapeAttr(state.search)}" placeholder="Search factory sounds..."><span>⌕</span></div>
    ${cats.map(cat => `<div class="catBlock"><button class="cat" data-cat="${cat.name}"><span>▸</span><b>${cat.name}</b><em>${cat.samples.length}</em></button>${state.sampleCategory === cat.name ? `<div class="sampleList">${cat.samples.slice(0, 60).map(s => `<button data-sample-url="${escapeAttr(s.url)}">${escapeHTML(s.name)}</button>`).join('')}</div>` : ''}</div>`).join('')}
  </section>`;
}

function noteIsActiveAt(note, tick) {
  const start = Number(note.tick || 0);
  const duration = Math.max(1, Number(note.duration || 1));
  const end = start + duration;
  return tick >= start && tick < end;
}

function renderChordControlsHTML() {
  const invMax = Math.max(0, chordModeSize() - 1);
  const progressionList = PROGRESSION_PRESETS[currentScaleName()] || PROGRESSION_PRESETS.Ionian;
  return `<div class="chordControlsStrip">
    <label>Key<select id="chordKey">${CHORD_KEYS.map(k => `<option value="${k}" ${state.chordKey === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label>Scale<select id="chordScale">${SCALE_OPTIONS.map(k => `<option value="${k}" ${currentScaleName() === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label>Notes<select id="chordNoteCount">${CHORD_SIZE_OPTIONS.map(n => `<option value="${n}" ${chordModeSize() === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Oct<select id="chordOctave">${[2,3,4,5,6].map(o => `<option value="${o}" ${Number(state.chordOctave) === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <label>Inv<select id="chordInversion">${Array.from({length: invMax + 1}, (_, i) => `<option value="${i}" ${Number(state.chordInversion||0) === i ? 'selected' : ''}>${i === 0 ? 'Root' : i}</option>`).join('')}</select></label>
    <label>Voice<select id="chordVoicing">${VOICING_OPTIONS.map(v => `<option value="${v}" ${state.chordVoicing === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <label>Inst<select id="chordInstrument">${INSTRUMENT_OPTIONS.map(v => `<option value="${v}" ${state.chordInstrument === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    <div class="chordOctButtons"><button id="octDown">Oct−</button><button id="octUp">Oct+</button></div>
    <div class="progressionButtons">${progressionList.map((p, i) => `<button data-progression="${i}">${escapeHTML(p.name)}</button>`).join('')}</div>
  </div>`;
}

function renderSynthControlsHTML() {
  const e = state.synthEngine || {};
  return `<div class="synthMiniControls">
    <label>Osc<select id="synthOsc">${OSC_OPTIONS.map(o => `<option value="${o}" ${(e.oscillator || 'triangle') === o ? 'selected' : ''}>${o}</option>`).join('')}</select></label>
    <label>Filter<input id="synthFilter" type="range" min="200" max="9000" step="50" value="${Number(e.filter || 2600)}"></label>
    <label>Attack<input id="synthAttack" type="range" min="0.002" max="1" step="0.002" value="${Number(e.attack ?? 0.012)}"></label>
    <label>Release<input id="synthRelease" type="range" min="0.02" max="2" step="0.01" value="${Number(e.release ?? 0.16)}"></label>
  </div>`;
}

function renderChordPianoRollHTML() {
  const isGridFull = state.page === 'chords' && state.chordView === 'grid';
  const ticks = gridTicks();
  const cols = Math.ceil(totalTicks() / ticks);
  const currentCol = state.currentStep >= 0 ? Math.floor(state.currentStep / ticks) : -1;
  const bars = Array.from({ length: state.loopBars }, (_, i) => `<span style="left:${(i / state.loopBars) * 100}%">${i + 1}</span>`).join('');
  const lanes = Array.from({ length: 16 }, (_, index) => ({ index, ...chordPadInfo(index) }));
  const selectedNotes = chordNotesForDegree(state.selectedChordDegree, state.chordOctave, state.chordInversion, state.chordVoicing).map(midiName).join(' · ');
  const laneForTrigger = trigger => Number.isFinite(Number(trigger.padIndex)) ? Number(trigger.padIndex) : lanes.find(lane => lane.degree === trigger.degree)?.index ?? 0;
  const triggerAt = (laneIndex, tick) => (state.chordTriggers || []).find(trigger => trigger.tick === tick && laneForTrigger(trigger) === laneIndex);

  if (isGridFull) {
    const gridTemplate = `42px repeat(${lanes.length}, 64px)`;
    const topLabels = lanes.map(lane => {
      const name = chordNameForDegree(lane.degree, lane.octave, lane.inversion, state.chordVoicing);
      return `<div class="rotatedTopName chordTriggerTop ${DEGREE_COLORS[lane.degree % DEGREE_COLORS.length]}" title="${escapeAttr(name)}">
        <i class="${DEGREE_COLORS[lane.degree % DEGREE_COLORS.length]}"></i>
        <b>${escapeHTML(chordDegreeLabel(lane.degree, lane.inversion))}</b>
        <span>${escapeHTML(name)} · O${lane.octave}</span>
      </div>`;
    }).join('');
    const timeRows = Array.from({ length: cols }, (_, col) => {
      const tick = col * ticks;
      const beat = Math.floor((tick % TICKS_PER_BAR) / TICKS_PER_BEAT) + 1;
      const bar = Math.floor(tick / TICKS_PER_BAR) + 1;
      const rowCells = lanes.map(lane => {
        const trigger = triggerAt(lane.index, tick);
        const held = (state.chordTriggers || []).some(tr => laneForTrigger(tr) === lane.index && tick >= tr.tick && tick < tr.tick + tr.duration);
        return `<button class="chordGridCell chordTriggerCell rotatedStep ${held ? 'hit' : ''} ${trigger ? 'noteStart' : ''} ${currentCol === col ? 'now' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''} ${tick % TICKS_PER_BAR === 0 ? 'barStep' : ''}" data-chord-trigger-lane="${lane.index}" data-chord-col="${col}" data-chord-tick="${tick}" aria-label="${escapeAttr(chordDegreeLabel(lane.degree, lane.inversion))} bar ${bar} beat ${beat}"></button>`;
      }).join('');
      return `<div class="rotatedGridRow chordTimeRow ${tick % TICKS_PER_BAR === 0 ? 'barRow' : ''}" style="grid-template-columns:${gridTemplate}">
        <div class="rotatedTimeLabel"><b>${bar}.${beat}</b><small>${col + 1}</small></div>
        ${rowCells}
      </div>`;
    }).join('');

    return `<section class="playSequencer chordPianoRoll gridFullRoll rotatedMidiRoll chordRotatedRoll chordTriggerRoll">
      <div class="rotatedMiniStrip">CHORD TRIGGERS · ${state.grid} · ${state.chordKey} ${currentScaleName()} · ${chordModeSize()} NOTES · ${state.chordInstrument}</div>
      <div class="rotatedGridScroller chordGridRows">
        <div class="rotatedTopLabels" style="grid-template-columns:${gridTemplate}">
          <div class="rotatedCorner">TIME</div>
          ${topLabels}
        </div>
        ${timeRows}
      </div>
    </section>`;
  }

  const rows = lanes.map(lane => {
    const cells = Array.from({ length: cols }, (_, col) => {
      const tick = col * ticks;
      const trigger = triggerAt(lane.index, tick);
      const held = (state.chordTriggers || []).some(tr => laneForTrigger(tr) === lane.index && tick >= tr.tick && tick < tr.tick + tr.duration);
      return `<button class="chordGridCell chordTriggerCell ${held ? 'hit' : ''} ${trigger ? 'noteStart' : ''} ${currentCol === col ? 'now' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''} ${tick % TICKS_PER_BAR === 0 ? 'barStep' : ''}" data-chord-trigger-lane="${lane.index}" data-chord-col="${col}" data-chord-tick="${tick}"></button>`;
    }).join('');
    const name = chordNameForDegree(lane.degree, lane.octave, lane.inversion, state.chordVoicing);
    return `<div class="chordGridRow midiNoteRow chordTriggerRow">
      <button class="chordRowName midiPitchName"><i class="${DEGREE_COLORS[lane.degree % DEGREE_COLORS.length]}"></i><b>${escapeHTML(chordDegreeLabel(lane.degree, lane.inversion))}</b><span>${escapeHTML(name)} · O${lane.octave}</span></button>
      <div class="chordStepGrid" style="grid-template-columns:repeat(${cols},18px)">${cells}</div>
    </div>`;
  }).join('');
  return `<section class="playSequencer chordPianoRoll">
    <div class="seqHeader chordSeqHeader"><span>CHORD TRIGGER GRID</span><small>${state.grid} · ${state.chordKey} ${currentScaleName()} · ${chordModeSize()} notes · ${state.chordInstrument}</small></div>
    ${renderChordControlsHTML()}
    <div class="chordSelectedNotes">${escapeHTML(chordNameForDegree(state.selectedChordDegree))}: ${escapeHTML(selectedNotes)}</div>
    ${renderSynthControlsHTML()}
    <div class="chordBarNumbers">${bars}</div>
    <div class="chordGridRows">${rows}</div>
  </section>`;
}

function renderChordPadsInstrumentHTML() {
  return `<section class="mpcOnly chordMpcMode chordInstrumentPads">
    ${state.pads.map((pad, i) => {
      const info = chordPadInfo(i);
      const name = chordNameForDegree(info.degree, info.octave, info.inversion, state.chordVoicing);
      return `<button class="mpcPad chordTrigger ${DEGREE_COLORS[info.degree % DEGREE_COLORS.length]} ${state.selectedPad === i ? 'selected' : ''}" data-chord-pad="${i}"><span>${i + 1}</span><b>${escapeHTML(chordDegreeLabel(info.degree, info.inversion))}<br><em>${escapeHTML(name)} · O${info.octave}</em></b></button>`;
    }).join('')}
  </section>`;
}

function renderChordsPageHTML() {
  state.padMode = 'chords';
  return `<section class="playPage chordsInstrumentPage instrumentPage padsView performanceFirstPage">
    ${renderTransportHTML()}
    ${renderInstrumentModeBar('chords', 'pads', 'Chords')}
    ${renderLayerBar('chords')}
    ${renderChordControlsHTML()}
    <div class="performanceArea performanceOnlyArea">
      <div class="bottomArea">${renderChordPadsInstrumentHTML()}</div>
    </div>
  </section>`;
}

function applyProgressionPreset(index) {
  const list = PROGRESSION_PRESETS[currentScaleName()] || PROGRESSION_PRESETS.Ionian;
  const preset = list[index];
  if (!preset) return;
  pushHistory('Apply chord progression');
  state.chordTriggers = [];
  state.chordMidiNotes = [];
  state.chordSequence = makeChordSequence();
  const slot = state.loopBars >= preset.degrees.length ? TICKS_PER_BAR : Math.max(gridTicks(), Math.floor(totalTicks() / preset.degrees.length));
  for (let tick = 0, step = 0; tick < totalTicks(); tick += slot, step++) {
    const degree = preset.degrees[step % preset.degrees.length] % degreeCount();
    recordChordTrigger(degree, state.chordOctave, 108, Math.min(slot, totalTicks() - tick), tick, state.chordInversion, state.chordVoicing, degree % 16);
  }
  renderChordPage();
  scheduleAutosave();
}



function renderMelodyGridHTML() {
  const g = gridTicks();
  const cols = Math.ceil(totalTicks() / g);
  const pads = Array.from({ length: 16 }, (_, i) => melodyPadInfo(i));
  const rows = pads.map((info, row) => {
    const cells = Array.from({ length: cols }, (_, c) => {
      const tick = c * g;
      const hit = (state.melodyEvents || []).some(event => event.padIndex === row && event.tick === tick);
      return `<button class="melodyStep ${hit ? 'hit' : ''} ${tick % TICKS_PER_BEAT === 0 ? 'beat' : ''}" data-melody-cell="${row}:${tick}"></button>`;
    }).join('');
    return `<div class="melodyRow"><button class="rowName melodyName" data-melody-pad="${row}"><i class="${DEGREE_COLORS[info.degree % DEGREE_COLORS.length]}"></i><b>${row + 1}</b><span>${info.label}</span></button><div class="stepGrid" style="grid-template-columns:repeat(${cols},18px)">${cells}</div></div>`;
  }).join('');
  return `<section class="playSequencer melodyGrid"><div class="seqHeader"><span>MELODY MIDI GRID</span><small>${state.grid} · ${state.chordKey} ${state.chordScale} · ${state.melodyNoteCount} note${state.melodyNoteCount === 1 ? '' : 's'}</small></div><div class="seqRows">${rows}</div></section>`;
}

function renderMelodyPadsHTML() {
  return `<section class="mpcOnly melodyPads">${Array.from({ length: 16 }, (_, i) => {
    const info = melodyPadInfo(i);
    const notes = melodyNotesForPad(i);
    const label = notes.length === 1 ? info.label : `${chordDegreeLabel(info.degree)} ${notes.length}n`;
    return `<button class="mpcPad melodyPad ${DEGREE_COLORS[info.degree % DEGREE_COLORS.length]} ${state.selectedMelodyPad === i ? 'selected' : ''}" data-melody-pad="${i}"><span>${i + 1}</span><b>${escapeHTML(label)}<br><em>${notes.map(midiName).join(' · ')}</em></b></button>`;
  }).join('')}</section>`;
}

function renderMelodyControlsHTML() {
  return `<section class="chordControlPanel melodyControlPanel">
    <label>Key<select id="melodyKey">${CHORD_KEYS.map(k => `<option ${state.chordKey === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    <label>Scale<select id="melodyScale">${SCALE_OPTIONS.map(sc => `<option ${state.chordScale === sc ? 'selected' : ''}>${sc}</option>`).join('')}</select></label>
    <label>Notes<select id="melodyNoteCount">${[1,2,3,4,5,6,7].map(n => `<option value="${n}" ${Number(state.melodyNoteCount) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Oct<select id="melodyOctave">${[1,2,3,4,5,6].map(n => `<option value="${n}" ${Number(state.melodyOctave) === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label>Inst<select id="melodyInstrument">${INSTRUMENT_OPTIONS.map(name => `<option ${state.chordInstrument === name ? 'selected' : ''}>${name}</option>`).join('')}</select></label>
  </section>`;
}

function renderMelodyPageHTML() {
  return `<section class="playPage melodyInstrumentPage instrumentPage padsView performanceFirstPage">
    ${renderTransportHTML()}
    ${renderInstrumentModeBar('melody', 'pads', 'Melody')}
    ${renderLayerBar('melody')}
    ${renderMelodyControlsHTML()}
    <div class="performanceArea performanceOnlyArea">
      <div class="bottomArea">${renderMelodyPadsHTML()}</div>
    </div>
  </section>`;
}

function renderSlicerGridHTML() {
  const g = gridTicks();
  const cols = Math.ceil(totalTicks() / g);
  const rows = Array.from({ length: 16 }, (_, row) => {
    const slice = state.slicerSlicePoints[row] || { start: row / 16, end: (row + 1) / 16 };
    const cells = Array.from({ length: cols }, (_, c) => {
      const tick = c * g;
      const hit = state.slicerPattern?.[row]?.[tick] || 0;
      return `<button class="sliceStep ${hit ? 'active' : ''}" data-slicer-cell="${row}:${tick}"></button>`;
    }).join('');
    return `<div class="sliceGridRow ${state.slicerSelectedPad === row ? 'selected' : ''}"><button class="sliceRowLabel" data-slicer-pad="${row}"><i class="${DEGREE_COLORS[row % DEGREE_COLORS.length]}"></i><span>SL ${row + 1}</span><small>${(slice.start * 100).toFixed(1)}–${(slice.end * 100).toFixed(1)}%</small></button><div class="sliceSteps">${cells}</div></div>`;
  }).join('');
  return `<section class="slicerGridPanel slicerInstrumentGrid"><div class="slicerPanelHeader"><b>Slice MIDI Grid</b><span>${state.grid} · sequence chops</span></div><div class="sliceGridMatrix">${rows}</div></section>`;
}

function renderSlicerDeviceHTML() {
  const selected = clamp(Number(state.slicerSelectedPad || 0), 0, 15);
  const slice = state.slicerSlicePoints[selected] || { start: 0, end: 1 };
  return `<section class="slicerDevice">
    <div class="slicerPanelHeader"><b>AUDIO SLICER</b><span>${escapeHTML(state.slicerAudioName || 'No audio loaded')}</span></div>
    <div class="slicerBpmPanel">
      <div><b>Analyzed BPM</b><span>${state.slicerBpmStatus || 'Load audio to analyze BPM'}</span></div>
      <div class="slicerBpmCandidates">${(state.slicerBpmCandidates || []).slice(0,3).map(c => `<button data-slicer-bpm-candidate="${c.bpm}">${c.bpm}<small>${c.confidence}%</small></button>`).join('') || '<em>No candidates yet</em>'}</div>
      <div class="slicerBpmActions"><button id="reanalyzeSlicerBpm">Analyze BPM</button><button id="applySlicerBpm" ${state.slicerAnalyzedBpm ? '' : 'disabled'}>Change Project BPM</button></div>
      <small>${state.slicerBpmMethod ? `Method: ${escapeHTML(state.slicerBpmMethod)}` : 'Best accuracy uses loop length candidates plus transient/onset confirmation.'}</small>
    </div>
    <div class="slicerControls">
      <label class="import">Load WAV/AIFF/MP3<input id="slicerFile" type="file" accept="audio/*,.wav,.mp3,.aiff,.aif"></label>
      <button id="slicerPlaySource">Play Source</button><button id="slicerStopSource">Stop Source</button>
      <label>Mode<select id="slicerMode">${['Manual','Equal 4','Equal 8','Equal 16'].map(v => `<option ${state.slicerMode === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Trigger<select id="slicerTriggerMode">${['Trigger','Gate'].map(v => `<option ${state.slicerTriggerMode === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Playback<select id="slicerPlayback">${['One Shot','Loop','Reverse'].map(v => `<option ${state.slicerPlayback === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Voices<select id="slicerVoices">${['Mono','Poly'].map(v => `<option ${state.slicerVoices === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Choke<select id="slicerChoke">${['On','Off'].map(v => `<option value="${v}" ${(state.slicerChoke !== false ? 'On' : 'Off') === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Transpose<select id="slicerTranspose">${Array.from({ length: 49 }, (_, i) => i - 24).map(v => `<option value="${v}" ${Number(state.slicerTranspose || 0) === v ? 'selected' : ''}>${v > 0 ? '+' : ''}${v} st</option>`).join('')}</select></label>
      <label>Gain<select id="slicerGain">${[0.25,0.5,0.75,1,1.25,1.5,2].map(v => `<option value="${v}" ${Number(state.slicerGain || 1) === v ? 'selected' : ''}>${Math.round(v * 100)}%</option>`).join('')}</select></label>
      <label>Nudge<select id="slicerNudgeTarget">${['Start','End','Both'].map(v => `<option ${state.slicerNudgeTarget === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Distance<select id="slicerNudgeDistance">${['1 ms','5 ms','10 ms','25 ms','50 ms','100 ms','1/64','1/32','1/16','1/8'].map(v => `<option ${state.slicerNudgeDistance === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    <div class="slicerNudgeRow"><b>Slice ${selected + 1}</b><span>Start ${(slice.start * 100).toFixed(2)}% · End ${(slice.end * 100).toFixed(2)}%</span><button id="nudgeLeft">← Nudge</button><button id="nudgeRight">Nudge →</button></div>
    <div class="mpcOnly slicerPadsOnly">${Array.from({ length: 16 }, (_, i) => `<button class="mpcPad slicerPad ${DEGREE_COLORS[i % DEGREE_COLORS.length]} ${selected === i ? 'selected' : ''}" data-slicer-pad="${i}"><span>${i + 1}</span><b>SLICE<br>${i + 1}</b></button>`).join('')}</div>
  </section>`;
}

function renderSlicerPageHTML() {
  return `<section class="playPage slicerInstrumentPage instrumentPage padsView performanceFirstPage">
    ${renderTransportHTML()}
    ${renderInstrumentModeBar('slicer', 'pads', 'Slicer')}
    ${renderLayerBar('slicer')}
    <div class="performanceArea performanceOnlyArea">
      <div class="bottomArea">${renderSlicerDeviceHTML()}</div>
    </div>
  </section>`;
}

function renderVoicePageHTML() {
  const clips = state.voiceClips || [];
  const fx = state.voiceFx || {};
  const loopLen = voiceLoopSeconds();
  return `<section class="playPage voicePage instrumentPage splitView">
    ${renderTransportHTML()}
    <div class="voiceWorkspace voiceCompWorkspace">
      <section class="voiceRecorderPanel">
        <div class="voiceHeader">
          <div><b>VOICE LOOP COMP</b><span>${state.loopBars} bars · ${formatTime(loopLen)} global loop</span></div>
          <div class="voiceTimer">${state.isVoiceRecordArmed ? 'ARMED' : state.isVoiceRecording ? `${formatTime(state.voiceRecordingTime)} / ${formatTime(state.voiceTargetDuration || loopLen)}` : (state.voiceStackStatus || '0:00')}</div>
        </div>
        <div class="voiceRecordControls">
          <button id="voiceRecordBtn" class="${state.isVoiceRecording ? 'recording' : state.isVoiceRecordArmed ? 'armed' : ''}">${state.isVoiceRecording ? 'Stop Loop Comp' : state.isVoiceRecordArmed ? 'Armed Next Loop' : 'Record Loop Comp'}</button>
          <button id="voicePlayStackBtn">Play Stack</button>
          <button id="voiceStopAllBtn">Stop Stack</button>
          <button id="voiceFixAudioBtn">Fix Audio</button>
        </div>
        <p class="voiceHint">Loop Comp is default. Every Stack layer is scheduled to the same Web Audio clock so layers start together from the global transport loop. While you record, older layers keep looping underneath and each new pass joins the stack on the next loop.</p>
      </section>

      ${renderVoiceSlicerPanelHTML()}
      ${renderSlicerSequencerGridHTML()}

      <section class="voiceFxPanel">
        <div class="voiceClipsHeader"><b>VOICE FX</b><span>Compressor · Reverb · Delay · EQ</span></div>
        <div class="voiceFxGrid">
          <label>Comp <input data-voice-fx="compressor" type="range" min="0" max="1" step="0.01" value="${fx.compressor ?? 0.35}"><b>${Math.round((fx.compressor ?? 0.35)*100)}%</b></label>
          <label>Reverb <input data-voice-fx="reverb" type="range" min="0" max="1" step="0.01" value="${fx.reverb ?? 0.18}"><b>${Math.round((fx.reverb ?? 0.18)*100)}%</b></label>
          <label>Delay <input data-voice-fx="delay" type="range" min="0" max="1" step="0.01" value="${fx.delay ?? 0.08}"><b>${Math.round((fx.delay ?? 0.08)*100)}%</b></label>
          <label>Nudge <input data-voice-nudge type="range" min="-200" max="200" step="1" value="${state.voiceNudgeMs ?? -80}"><b>${state.voiceNudgeMs ?? -80}ms</b></label>
          <label>EQ Low <input data-voice-fx="eqLow" type="range" min="-12" max="12" step="0.5" value="${fx.eqLow ?? 0}"><b>${fx.eqLow ?? 0}dB</b></label>
          <label>EQ Mid <input data-voice-fx="eqMid" type="range" min="-12" max="12" step="0.5" value="${fx.eqMid ?? 0}"><b>${fx.eqMid ?? 0}dB</b></label>
          <label>EQ High <input data-voice-fx="eqHigh" type="range" min="-12" max="12" step="0.5" value="${fx.eqHigh ?? 0}"><b>${fx.eqHigh ?? 0}dB</b></label>
        </div>
      </section>

      <section class="voiceClipsPanel">
        <div class="voiceClipsHeader"><b>VOICE STACK</b><span>${clips.filter(c => c.comp !== false).length}/${clips.length} active layer${clips.length === 1 ? '' : 's'}</span></div>
        ${clips.length ? clips.map((clip, index) => `
          <div class="voiceClip ${clip.comp !== false ? 'compOn' : ''}" data-voice-id="${clip.id}">
            <div class="voiceClipInfo">
              <b>${clip.name || `Voice Layer ${index + 1}`}</b>
              <span>${formatTime(clip.duration)} · ${clip.loopBars || state.loopBars} bars · ${clip.comp !== false ? 'STACK ON' : 'MUTED'} · ${Math.round((clip.latencyOffset || 0) * 1000)}ms trim</span>
            </div>
            ${renderVoiceWaveform(clip)}
            <div class="voiceClipActions voiceClipActionsFive">
              <button data-play-voice="${clip.id}">Play</button>
              <button data-toggle-voice-comp="${clip.id}" class="${clip.comp !== false ? 'active' : ''}">Stack</button>
              <button data-toggle-voice-loop="${clip.id}" class="${clip.loop !== false ? 'active' : ''}">Loop</button>
              <button data-download-voice="${clip.id}">Export</button>
              <button data-delete-voice="${clip.id}" class="danger">Delete</button>
            </div>
            <label class="voiceVolume">Volume <input data-voice-volume="${clip.id}" type="range" min="0" max="1" step="0.01" value="${clip.volume ?? 1}"></label>
          </div>`).join('') : `<div class="emptyVoice"><b>No voice layers yet</b><span>Tap Record Loop Comp and keep singing. Each loop pass becomes a new stacked layer.</span></div>`}
      </section>
    </div>
  </section>`;
}

function renderSettingsPageHTML() {
  return `<section class="settingsPage pageScroll"><h2>Settings</h2><div class="settingsGrid">
    <section class="projectPanel"><div class="projectPanelHeader"><b>Project</b><span>${state.lastSaved ? `Saved ${state.lastSaved}` : 'Autosave on'}</span></div><div class="projectActions"><button id="saveProject">Save</button><button id="loadProject">Load</button><button id="exportProject">Export JSON</button><button id="importProjectBtn">Import JSON</button><button id="newProject" class="danger">New</button></div><input hidden type="file" id="importProject" accept="application/json,.json"><small>Save stays in this browser. Export JSON is the safest backup.</small></section>
    <section class="projectPanel phasePanel"><div class="projectPanelHeader"><b>Phase 2</b><span>Undo + keyboard pads</span></div><div class="projectActions phaseActions"><button id="undoBtn">Undo</button><button id="redoBtn">Redo</button></div><small>Keyboard pads: Q W E R / A S D F / Z X C V / 1 2 3 4. Space plays/stops. R starts record unless typing.</small></section>
    <section class="projectPanel wakePanel"><div class="projectPanelHeader"><b>Keep Awake</b><span class="wakeStatus">${wakeStatusLabel()}</span></div><div class="projectActions phaseActions"><button class="${state.keepAwake?'activeWake':''}" data-toggle-setting="keepAwake">${state.keepAwake?'Awake ON':'Awake OFF'}</button><button id="fixAudioBtn">Fix Audio</button></div><small>Keep Awake asks the phone to avoid sleep when supported. Fix Audio resumes the sound engine without refreshing after the app is backgrounded or locked.</small></section>
    <div class="bpmStepper"><span>BPM</span><button data-bpm="-1">−</button><b>${state.bpm}</b><button data-bpm="1">+</button></div>
    ${selectSetting('Loop Bars', 'loopBars', [1,2,4,8,16], state.loopBars)}
    ${selectSetting('Polyphony', 'polyphony', [16,32,64], state.polyphony, v => `${v} Voices`)}
    <div class="voiceMeter"><span>Voices</span><b>${state.activeVoices}/${state.polyphony}</b><em style="width:${Math.min(100,(state.activeVoices/state.polyphony)*100)}%"></em></div>
    ${selectSetting('Grid', 'grid', GRID_OPTIONS.map(g=>g.label), state.grid)}
    ${sliderSetting('Quantize Strength','quantize',0,100,1,state.quantize,'%')}
    ${sliderSetting('Swing','swing',50,75,1,state.swing,'%')}
    <button class="toggle ${state.snap?'on':''}" data-toggle-setting="snap">Snap To Grid ${state.snap?'ON':'OFF'}</button>
    <button class="toggle ${state.followPlayhead?'on':''}" data-toggle-setting="followPlayhead">Follow Playhead ${state.followPlayhead?'ON':'OFF'}</button>
    <button class="toggle ${state.metronome?'on':''}" data-toggle-setting="metronome">Metronome ${state.metronome?'ON':'OFF'}</button>
    <button class="toggle ${state.lowLatency?'on':''}" data-toggle-setting="lowLatency">Low Latency ${state.lowLatency?'ON':'OFF'}</button>
    <button class="toggle" id="preloadKit">Preload Kit · ${state.loadStatus.loaded}/${state.loadStatus.total}</button>
    <button class="toggle" id="copyBar">Copy Bar 1 To Loop</button>
    <button class="toggle danger" data-clear-instrument="drums">Clear Drums</button>
    <button class="toggle danger" data-clear-instrument="chords">Clear Chords</button>
    <button class="toggle danger" data-clear-instrument="all">Clear All Instruments</button>
  </div></section>`;
}

function selectSetting(label, key, values, value, format = v => v) {
  return `<label>${label}<select data-setting="${key}">${values.map(v => `<option value="${v}" ${String(v)===String(value)?'selected':''}>${format(v)}</option>`).join('')}</select></label>`;
}
function sliderSetting(label, key, min, max, step, value, suffix='') {
  return `<label>${label}<input data-setting="${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><b>${value}${suffix}</b></label>`;
}


function bindInstrumentModeControls() {
  $$('[data-view-mode]').forEach(btn => btn.addEventListener('click', () => {
    setInstrumentView(btn.dataset.viewTarget, btn.dataset.viewMode);
  }));
  $$('[data-clear-instrument]').forEach(btn => btn.addEventListener('click', () => {
    clearInstrumentPattern(btn.dataset.clearInstrument);
  }));
}

function bindCommon() {
  $$('.bottomNav button').forEach(btn => btn.addEventListener('click', () => {
    state.page = btn.dataset.page;
    state.padMode = state.page === 'chords' ? 'chords' : state.page === 'melody' ? 'melody' : state.page === 'slicer' ? 'slicer' : 'drums';
    render();
  }));
  bindInstrumentModeControls();
  bindLayerControls();
  bindTapTempoModal();
}

function bindLayerControls() {
  $$('[data-add-layer]').forEach(btn => btn.addEventListener('click', () => addInstrumentLayer(btn.dataset.addLayer)));
  $$('[data-layer-select]').forEach(sel => sel.addEventListener('change', () => loadInstrumentLayer(sel.dataset.layerSelect, Number(sel.value))));
  $$('[data-layer-snap]').forEach(sel => sel.addEventListener('change', () => { const layer = currentLayer(sel.dataset.layerSnap); if (layer) layer.snap = sel.value; scheduleAutosave(); render(); }));
  $$('[data-edit-layer]').forEach(btn => btn.addEventListener('click', () => openEditGrid(btn.dataset.editLayer)));
  $$('[data-toggle-erase]').forEach(btn => btn.addEventListener('click', () => { state.eraseMode = !state.eraseMode; render(); }));
  $$('[data-layer-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const type = btn.closest('[data-layer-type]')?.dataset.layerType;
    const layer = currentLayer(type);
    if (!layer) return;
    const key = btn.dataset.layerToggle;
    const prop = key === 'solo' ? 'solo' : key === 'mute' ? 'muted' : key;
    layer[prop] = !layer[prop];
    render(); scheduleAutosave();
  }));
  $$('[data-clear-layer]').forEach(btn => btn.addEventListener('click', () => clearActiveLayer(btn.dataset.clearLayer)));
  $$('[data-delete-layer]').forEach(btn => btn.addEventListener('click', () => deleteActiveLayer(btn.dataset.deleteLayer)));
}

function bindPlay() {
  bindTransportOnly();
  bindSequencer();
  bindPadsOrEditor();
}


function toggleNote(row, col) {
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || row >= 16) return;
  const rawTick = clamp(col * gridTicks(), 0, totalTicks() - 1);
  const tick = snapEventTick(rawTick, 'drums');
  if (!state.pattern[row]) state.pattern[row] = Array(totalTicks()).fill(0);
  pushHistory('Toggle drum note', 400);
  state.pattern[row][tick] = state.pattern[row][tick] ? 0 : 100;
  syncActiveLayer('drums');
  renderSequencer();
  scheduleAutosave();
}

function recordPad(index, velocity = 110) {
  if (!Number.isFinite(index) || index < 0 || index >= state.pads.length) return;

  // Drum pads must always use the drum/sample engine. This avoids the padMode
  // getting stuck on chords after switching pages.
  state.padMode = 'drums';
  state.selectedPad = index;
  audio.playPad(index, velocity);

  if (state.isRecording) {
    const rawTick = state.currentStep >= 0 ? state.currentStep : 0;
    const tick = snapEventTick(rawTick, 'drums');
    if (!state.pattern[index]) state.pattern[index] = Array(totalTicks()).fill(0);
    pushHistory('Record drum pad', 400);
    state.pattern[index][tick] = velocity;
    syncActiveLayer('drums');
    renderSequencer();
  }

  renderPadsOnly();
  scheduleAutosave();
}

function bindSequencer() {
  const rows = $('.seqRows');
  if (!rows) return;
  const pan = { active: false, startX: 0, startY: 0, left: 0, top: 0 };
  rows.addEventListener('touchstart', e => {
    if (e.touches.length >= 2) {
      clearPendingToggle();
      const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      Object.assign(pan, { active: true, startX: x, startY: y, left: rows.scrollLeft, top: rows.scrollTop });
      e.preventDefault();
    }
  }, { passive: false });
  rows.addEventListener('touchmove', e => {
    if (!pan.active || e.touches.length < 2) return;
    const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    rows.scrollLeft = pan.left - (x - pan.startX);
    rows.scrollTop = pan.top - (y - pan.startY);
    e.preventDefault();
  }, { passive: false });
  rows.addEventListener('touchend', e => { if (!e.touches || e.touches.length < 2) pan.active = false; });

  $$('.step').forEach(step => {
    step.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch') return;
      e.preventDefault();
      toggleNote(Number(step.dataset.row), Number(step.dataset.col));
    });
    step.addEventListener('touchstart', e => {
      if (e.touches.length > 1) return clearPendingToggle();
      const r = Number(step.dataset.row), c = Number(step.dataset.col);
      clearPendingToggle();
      pendingTouchToggle = setTimeout(() => { toggleNote(r, c); pendingTouchToggle = null; }, 85);
      e.preventDefault();
    }, { passive: false });
  });

  $$('[data-edit-pad]').forEach(btn => btn.addEventListener('click', () => {
    const i = Number(btn.dataset.editPad);
    state.selectedPad = i;
    state.editingPad = state.editingPad === i ? null : i;
    state.editorPage = 'mix';
    render();
  }));
}

function clearPendingToggle() {
  if (pendingTouchToggle) clearTimeout(pendingTouchToggle);
  pendingTouchToggle = null;
}

function bindPadsOrEditor() {
  if (state.editingPad === null) {
    $$('.mpcPad').forEach(btn => {
      btn.addEventListener('pointerdown', e => {
        e.preventDefault();
        const index = Number(btn.dataset.pad);
        const isChordPadContext = state.page === 'chords' || btn.classList.contains('chordTrigger');
        if (state.eraseMode) {
          const type = isChordPadContext ? 'chords' : 'drums';
          eraseHold = { type, index };
          eraseEventAtStep(type, index);
          btn.classList.add('erasing');
          return;
        }
        if (isChordPadContext) {
          const info = chordPadInfo(index);
          state.selectedPad = index;
          beginChordHold(`playpad-${index}`, info.degree, info.octave, 110, info.inversion, state.chordVoicing, index);
          btn.classList.add('holding');
        } else {
          recordPad(index);
        }
      });
      const end = e => {
        if (eraseHold) { eraseHold = null; btn.classList.remove('erasing'); return; }
        const isChordPadContext = state.page === 'chords' || btn.classList.contains('chordTrigger');
        if (!isChordPadContext) return;
        e?.preventDefault?.();
        const index = Number(btn.dataset.pad);
        endChordHold(`playpad-${index}`);
        btn.classList.remove('holding');
        renderPadsOnly();
      };
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointercancel', end);
      btn.addEventListener('pointerleave', end);
    });
    return;
  }
  bindEditor();
}

function bindEditor() {
  $('#closeEditor')?.addEventListener('click', () => { state.editingPad = null; render(); });
  $('#closeEditor2')?.addEventListener('click', () => { state.editingPad = null; render(); });
  $('#closeEditor3')?.addEventListener('click', () => { state.editingPad = null; render(); });
  $('#previewPad')?.addEventListener('click', () => audio.playPad(state.editingPad, 110));
  $('#previewRegion')?.addEventListener('click', () => audio.playPad(state.editingPad, 110));

  const editor = $('#trackEditor');
  const swipe = { active: false, startX: 0, moved: false };
  editor?.addEventListener('touchstart', e => {
    if (e.touches.length >= 2) { swipe.active = true; swipe.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2; swipe.moved = false; e.preventDefault(); }
  }, { passive: false });
  editor?.addEventListener('touchmove', e => {
    if (!swipe.active || e.touches.length < 2) return;
    const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const dx = x - swipe.startX;
    if (Math.abs(dx) > 45 && !swipe.moved) {
      state.editorPage = dx < 0 ? 'sample' : 'mix';
      swipe.moved = true;
      renderBottomArea();
    }
    e.preventDefault();
  }, { passive: false });
  editor?.addEventListener('touchend', () => { swipe.active = false; });

  $$('[data-pad-key]').forEach(input => {
    input.addEventListener('input', () => {
      const key = input.dataset.padKey;
      let value = input.type === 'range' ? Number(input.value) : input.value;
      if (key === 'chokeGroup') value = Number(value);
      if (key === 'trimEnd') value = Math.max(value, (state.pads[state.editingPad].trimStart ?? 0) + 0.01);
      if (key === 'trimStart') value = Math.min(value, (state.pads[state.editingPad].trimEnd ?? 1) - 0.01);
      state.pads[state.editingPad][key] = value;
      audio.updatePadVoices(state.editingPad);
      renderBottomArea(false);
      drawWaveform();
      scheduleAutosave();
    });
  });
  $$('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.toggle;
    state.pads[state.editingPad][key] = !state.pads[state.editingPad][key];
    renderBottomArea(false);
    drawWaveform();
    scheduleAutosave();
  }));
  drawWaveform();
}

function renderPadsOnly() {
  $$('.mpcPad.selected').forEach(el => el.classList.remove('selected'));
  $(`.mpcPad[data-pad="${state.selectedPad}"]`)?.classList.add('selected');
}
function renderTransport() { $('.miniTransport') && ($('.miniTransport').outerHTML = renderTransportHTML()); bindTransportOnly(); }
function renderSequencer() { $('.playSequencer') && ($('.playSequencer').outerHTML = renderSequencerHTML()); bindSequencer(); }
function renderBottomArea(rebind = true) { const area = $('.bottomArea'); if (!area) return; area.innerHTML = state.editingPad === null ? renderPadsHTML() : renderTrackEditorHTML(); if (rebind) bindPadsOrEditor(); else bindEditor(); }
function renderEditorBody() { const body = $('#editorBody'); if (!body || state.editingPad === null) return; body.innerHTML = state.editorPage === 'mix' ? renderMixEditorHTML(state.pads[state.editingPad]) : renderSampleEditorHTML(state.pads[state.editingPad]); bindEditor(); drawWaveform(); }
function updateLightUI() {
  $('#bpmPill') && ($('#bpmPill').textContent = `${state.bpm} BPM`);
  $('#barPill') && ($('#barPill').textContent = `${state.loopBars} BARS`);
  $$('.voiceMeter b').forEach(el => el.textContent = `${state.activeVoices}/${state.polyphony}`);
  $$('.voiceMeter em').forEach(el => el.style.width = `${Math.min(100,(state.activeVoices/state.polyphony)*100)}%`);
  $$('.wakeStatus').forEach(el => el.textContent = wakeStatusLabel());
}
function renderCountOverlay() { const mount = $('#countMount'); if (!mount) return; mount.innerHTML = (state.isCountingIn || state.countText) ? `<div class="countOverlay"><b>${state.countText}</b><span>${state.isCountingIn ? 'Count-In' : 'Recording'}</span></div>` : ''; }

function bindSamples() {
  $$('[data-select-pad]').forEach(btn => btn.addEventListener('click', () => { state.selectedPad = Number(btn.dataset.selectPad); render(); }));
  $$('.cat').forEach(btn => btn.addEventListener('click', () => { state.sampleCategory = state.sampleCategory === btn.dataset.cat ? '' : btn.dataset.cat; render(); }));
  $('#sampleSearch')?.addEventListener('input', e => { state.search = e.target.value; render(); });
  $$('[data-sample-url]').forEach(btn => btn.addEventListener('click', () => {
    const sample = FACTORY_CATEGORIES.flatMap(c => c.samples).find(s => s.url === btn.dataset.sampleUrl);
    if (sample) assignSample(sample);
  }));
  $('#importSample')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    assignSample({ name: file.name.replace(/\.[^.]+$/, ''), url, category: 'USER' });
  });
}

function bindTransportOnly() {
  $('#undoBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); undo(); });
  $('#tapTempoBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); openTapTempoModal(); });
  $('#playBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); state.isPlaying ? stop() : start(); });
  $('#stopBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); stop(); });
  $('#recBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); requestRecord(); });
  bindTapTempoModal();
}

function bindTapTempoModal() {
  const large = $('#tapTempoLargeBtn');
  if (large && !large.dataset.bound) {
    large.dataset.bound = '1';
    const tap = e => { e.preventDefault(); e.stopPropagation(); handleTapTempo(); };
    large.addEventListener('pointerdown', tap);
    large.addEventListener('touchstart', tap, { passive:false });
    large.addEventListener('click', tap);
  }
  $('#tapTempoClose')?.addEventListener('click', e => { e.preventDefault(); closeTapTempoModal(); });
  $('#tapTempoResetBtn')?.addEventListener('click', e => {
    e.preventDefault();
    resetTapTempo();
  });
  $('.tapTempoOverlay')?.addEventListener('pointerdown', e => {
    if (e.target === e.currentTarget) closeTapTempoModal();
  });
}

function bindChordRollPan() {
  const rows = $('.chordGridRows');
  if (!rows) return;
  const pan = { active:false, startX:0, startY:0, left:0, top:0 };
  rows.addEventListener('touchstart', e => {
    if (e.touches.length >= 2) {
      const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      Object.assign(pan, { active:true, startX:x, startY:y, left:rows.scrollLeft, top:rows.scrollTop });
      e.preventDefault();
    }
  }, { passive:false });
  rows.addEventListener('touchmove', e => {
    if (!pan.active || e.touches.length < 2) return;
    const x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    rows.scrollLeft = pan.left - (x - pan.startX);
    rows.scrollTop = pan.top - (y - pan.startY);
    e.preventDefault();
  }, { passive:false });
  rows.addEventListener('touchend', e => { if (!e.touches || e.touches.length < 2) pan.active = false; });
}


let chordSlideGesture = { active: false, pointerId: null, currentIndex: null };

function chordPadFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el?.closest?.('[data-chord-pad], .chordTrigger[data-pad]') || null;
}

function startChordSlidePad(index, button) {
  if (chordSlideGesture.currentIndex === index) return;
  if (chordSlideGesture.currentIndex !== null) {
    endChordHold('chord-slide');
    document.querySelector(`[data-chord-pad="${chordSlideGesture.currentIndex}"], .chordTrigger[data-pad="${chordSlideGesture.currentIndex}"]`)?.classList.remove('holding');
  }
  const info = chordPadInfo(index);
  state.selectedPad = index;
  state.selectedChordDegree = info.degree;
  chordSlideGesture.currentIndex = index;
  beginChordHold('chord-slide', info.degree, info.octave, 110, info.inversion, state.chordVoicing, index);
  button?.classList.add('holding');
  renderPadsOnly();
}

function endChordSlidePad() {
  if (!chordSlideGesture.active) return;
  if (chordSlideGesture.currentIndex !== null) {
    endChordHold('chord-slide');
    document.querySelector(`[data-chord-pad="${chordSlideGesture.currentIndex}"], .chordTrigger[data-pad="${chordSlideGesture.currentIndex}"]`)?.classList.remove('holding');
  }
  chordSlideGesture = { active: false, pointerId: null, currentIndex: null };
  renderPadsOnly();
}

function bindChordSlidePad(button) {
  const getIndex = () => Number(button.dataset.chordPad ?? button.dataset.pad);
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    chordSlideGesture = { active: true, pointerId: event.pointerId, currentIndex: null };
    button.setPointerCapture?.(event.pointerId);
    startChordSlidePad(getIndex(), button);
  });
  button.addEventListener('pointermove', event => {
    if (!chordSlideGesture.active || chordSlideGesture.pointerId !== event.pointerId) return;
    const target = chordPadFromPoint(event.clientX, event.clientY);
    if (!target) return;
    const nextIndex = Number(target.dataset.chordPad ?? target.dataset.pad);
    if (Number.isFinite(nextIndex)) startChordSlidePad(nextIndex, target);
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => {
    button.addEventListener(type, event => {
      if (chordSlideGesture.pointerId === event.pointerId) endChordSlidePad();
    });
  });
}

function bindChordHoldButton(button, holdKey, degree, octave, inversion) {
  const start = event => {
    event.preventDefault();
    button.setPointerCapture?.(event.pointerId);
    beginChordHold(holdKey, degree, octave, 110, inversion, state.chordVoicing);
    button.classList.add('holding');
  };
  const end = event => {
    event?.preventDefault?.();
    endChordHold(holdKey);
    button.classList.remove('holding');
  };
  button.addEventListener('pointerdown', start);
  button.addEventListener('pointerup', end);
  button.addEventListener('pointercancel', end);
  button.addEventListener('pointerleave', end);
}

function bindChords() {
  bindTransportOnly();
  bindChordRollPan();
  const rerenderChordSettings = (label, fn) => {
    pushHistory(label);
    fn();
    renderChordPage();
    scheduleAutosave();
  };
  $('#chordKey')?.addEventListener('change', e => rerenderChordSettings('Chord key', () => state.chordKey = e.target.value));
  $('#chordScale')?.addEventListener('change', e => rerenderChordSettings('Chord scale', () => { state.chordScale = e.target.value; state.selectedChordDegree = 0; }));
  $('#chordNoteCount')?.addEventListener('change', e => rerenderChordSettings('Chord note count', () => { state.chordNoteCount = Number(e.target.value); state.chordMode = state.chordNoteCount === 3 ? 'Triads' : state.chordNoteCount === 5 ? '9ths' : '7ths'; state.chordInversion = clamp(state.chordInversion, 0, Math.max(0, state.chordNoteCount - 1)); }));
  $('#chordOctave')?.addEventListener('change', e => rerenderChordSettings('Chord octave', () => state.chordOctave = Number(e.target.value)));
  $('#chordInversion')?.addEventListener('change', e => rerenderChordSettings('Chord inversion', () => state.chordInversion = Number(e.target.value)));
  $('#chordVoicing')?.addEventListener('change', e => rerenderChordSettings('Chord voicing', () => state.chordVoicing = e.target.value));
  $('#chordInstrument')?.addEventListener('change', e => rerenderChordSettings('Chord instrument', () => state.chordInstrument = e.target.value));
  $('#octDown')?.addEventListener('click', () => rerenderChordSettings('Octave down', () => state.chordOctave = clamp(Number(state.chordOctave || 4) - 1, 2, 6)));
  $('#octUp')?.addEventListener('click', () => rerenderChordSettings('Octave up', () => state.chordOctave = clamp(Number(state.chordOctave || 4) + 1, 2, 6)));
  $$('[data-progression]').forEach(btn => btn.addEventListener('click', () => applyProgressionPreset(Number(btn.dataset.progression))));

  $('#synthOsc')?.addEventListener('change', e => { state.synthEngine.oscillator = e.target.value; scheduleAutosave(); });
  $('#synthFilter')?.addEventListener('input', e => { state.synthEngine.filter = Number(e.target.value); scheduleAutosave(); });
  $('#synthAttack')?.addEventListener('input', e => { state.synthEngine.attack = Number(e.target.value); scheduleAutosave(); });
  $('#synthRelease')?.addEventListener('input', e => { state.synthEngine.release = Number(e.target.value); scheduleAutosave(); });

  $$('[data-chord-pad]').forEach(btn => {
    if (state.eraseMode) {
      btn.addEventListener('pointerdown', event => { event.preventDefault(); const i = Number(btn.dataset.chordPad); eraseHold = { type: 'chords', index: i }; eraseEventAtStep('chords', i); btn.classList.add('erasing'); });
      const stopErase = () => { if (eraseHold?.type === 'chords') eraseHold = null; btn.classList.remove('erasing'); };
      btn.addEventListener('pointerup', stopErase);
      btn.addEventListener('pointercancel', stopErase);
      btn.addEventListener('pointerleave', stopErase);
    } else {
      bindChordSlidePad(btn);
    }
    btn.addEventListener('contextmenu', event => event.preventDefault());
  });

  $$('[data-chord-trigger-lane]').forEach(btn => btn.addEventListener('pointerdown', event => {
    event.preventDefault();
    const lane = Number(btn.dataset.chordTriggerLane);
    const tick = Number(btn.dataset.chordTick);
    toggleChordTriggerCell(lane, tick);
  }));
}

function toggleChordTriggerCell(lane, tick) {
  const info = chordPadInfo(lane);
  const safeTick = clamp(Number(tick || 0), 0, totalTicks() - 1);
  const existing = (state.chordTriggers || []).find(trigger => {
    const triggerLane = Number.isFinite(Number(trigger.padIndex)) ? Number(trigger.padIndex) : trigger.degree;
    return trigger.tick === safeTick && triggerLane === lane;
  });
  pushHistory('Chord trigger cell');
  if (existing) {
    state.chordTriggers = state.chordTriggers.filter(trigger => trigger.id !== existing.id);
  } else {
    recordChordTrigger(info.degree, info.octave, 100, gridTicks(), safeTick, info.inversion, state.chordVoicing, lane);
  }
  state.chordMidiNotes = expandChordTriggersForMidiExport();
  renderChordPage();
  scheduleAutosave();
}


function bindMelody() {
  bindTransportOnly();
  bindChordRollPan();
  $('#melodyKey')?.addEventListener('change', e => { state.chordKey = e.target.value; render(); scheduleAutosave(); });
  $('#melodyScale')?.addEventListener('change', e => { state.chordScale = e.target.value; render(); scheduleAutosave(); });
  $('#melodyNoteCount')?.addEventListener('change', e => { state.melodyNoteCount = Number(e.target.value); render(); scheduleAutosave(); });
  $('#melodyOctave')?.addEventListener('change', e => { state.melodyOctave = Number(e.target.value); state.chordOctave = Number(e.target.value); render(); scheduleAutosave(); });
  $('#melodyInstrument')?.addEventListener('change', e => { state.chordInstrument = e.target.value; render(); scheduleAutosave(); });
  $$('[data-melody-pad]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const i = Number(button.dataset.melodyPad);
      if (state.eraseMode) { eraseHold = { type: 'melody', index: i }; eraseEventAtStep('melody', i); button.classList.add('erasing'); return; }
      playMelodyPad(i, 110);
    });
    const stopErase = () => { if (eraseHold?.type === 'melody') eraseHold = null; button.classList.remove('erasing'); };
    button.addEventListener('pointerup', stopErase);
    button.addEventListener('pointercancel', stopErase);
    button.addEventListener('pointerleave', stopErase);
  });
  $$('[data-melody-cell]').forEach(button => button.addEventListener('click', () => { const [row,tick] = button.dataset.melodyCell.split(':').map(Number); toggleMelodyCell(row, tick); }));
}

function bindSlicer() {
  bindTransportOnly();
  $('#slicerFile')?.addEventListener('change', e => loadSlicerFile(e.target.files?.[0]));
  $('#slicerPlaySource')?.addEventListener('click', playSlicerSource);
  $('#slicerStopSource')?.addEventListener('click', stopSlicerSource);
  ['slicerMode','slicerTriggerMode','slicerPlayback','slicerVoices','slicerTranspose','slicerGain','slicerNudgeTarget','slicerNudgeDistance'].forEach(id => {
    $('#' + id)?.addEventListener('change', e => { state[id] = e.target.value; render(); scheduleAutosave(); });
  });
  $('#slicerChoke')?.addEventListener('change', e => {
    state.slicerChoke = e.target.value !== 'Off';
    if (state.slicerChoke) stopSlicerPadVoices();
    render();
    scheduleAutosave();
  });
  $('#reanalyzeSlicerBpm')?.addEventListener('click', () => analyzeCurrentSlicerBpm());
  $('#applySlicerBpm')?.addEventListener('click', applyAnalyzedSlicerBpm);
  $$('[data-slicer-bpm-candidate]').forEach(button => button.addEventListener('click', () => {
    const bpm = Number(button.dataset.slicerBpmCandidate);
    if (bpm) {
      state.slicerAnalyzedBpm = bpm;
      state.slicerBpmStatus = `${bpm} BPM · selected manually`;
      applyAnalyzedSlicerBpm();
    }
  }));
  $('#nudgeLeft')?.addEventListener('click', () => nudgeSlice(Number(state.slicerSelectedPad || 0), 'left'));
  $('#nudgeRight')?.addEventListener('click', () => nudgeSlice(Number(state.slicerSelectedPad || 0), 'right'));
  $$('[data-slicer-pad]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const idx = Number(button.dataset.slicerPad);
      if (state.eraseMode) { eraseHold = { type: 'slicer', index: idx }; eraseEventAtStep('slicer', idx); button.classList.add('erasing'); return; }
      if (slicerSource) setSlicePointFromPad(idx); else playSlicerPad(idx, 110);
    });
    const stopErase = () => { if (eraseHold?.type === 'slicer') eraseHold = null; button.classList.remove('erasing'); };
    button.addEventListener('pointerup', stopErase);
    button.addEventListener('pointercancel', stopErase);
    button.addEventListener('pointerleave', stopErase);
  });
  $$('[data-slicer-cell]').forEach(button => button.addEventListener('click', () => { const [row,tick] = button.dataset.slicerCell.split(':').map(Number); toggleSlicerStep(row, tick); }));
}

function bindVoice() {
  $('#playBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); state.isPlaying ? stop() : start(); });
  $('#stopBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); stop(); });
  $('#recBtn')?.addEventListener('pointerdown', e => { e.preventDefault(); requestRecord(); });

  $('#voiceRecordBtn')?.addEventListener('click', () => {
    state.isVoiceRecording ? stopVoiceRecording() : startVoiceRecording();
  });
  $('#voicePlayStackBtn')?.addEventListener('click', async () => {
    await recoverAudioAndWake(false);
    if (!state.isPlaying) await start();
    else playVoiceLoopClips({ forceRestart: true });
  });
  $('#voiceStopAllBtn')?.addEventListener('click', () => stopVoiceLoopClips());
  $('#voiceFixAudioBtn')?.addEventListener('click', () => recoverAudioAndWake(true));

  $$('[data-play-voice]').forEach(button => button.addEventListener('click', () => {
    const clip = (state.voiceClips || []).find(item => item.id === button.dataset.playVoice);
    playVoiceClip(clip);
  }));

  $$('[data-toggle-voice-loop]').forEach(button => button.addEventListener('click', () => {
    const clip = (state.voiceClips || []).find(item => item.id === button.dataset.toggleVoiceLoop);
    if (!clip) return;
    pushHistory('Toggle voice loop');
    clip.loop = clip.loop === false;
    voiceStackDirty = true;
    render();
    scheduleAutosave();
  }));

  $$('[data-toggle-voice-comp]').forEach(button => button.addEventListener('click', () => {
    const clip = (state.voiceClips || []).find(item => item.id === button.dataset.toggleVoiceComp);
    if (!clip) return;
    pushHistory('Toggle voice comp layer');
    clip.comp = clip.comp === false;
    voiceStackDirty = true;
    render();
    scheduleAutosave();
  }));

  $$('[data-delete-voice]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.deleteVoice;
    const clip = (state.voiceClips || []).find(item => item.id === id);
    if (!clip || !confirm(`Delete ${clip.name || 'voice take'}?`)) return;
    pushHistory('Delete voice take');
    state.voiceClips = (state.voiceClips || []).filter(item => item.id !== id);
    voiceStackDirty = true;
    render();
    scheduleAutosave();
  }));

  $$('[data-download-voice]').forEach(button => button.addEventListener('click', () => {
    const clip = (state.voiceClips || []).find(item => item.id === button.dataset.downloadVoice);
    if (!clip?.url) return;
    const a = document.createElement('a');
    a.href = clip.url;
    const ext = clip.type?.includes('mp4') ? 'm4a' : clip.type?.includes('webm') ? 'webm' : 'audio';
    a.download = `${(clip.name || 'voice-take').replace(/[^a-z0-9-_]+/gi, '-')}.${ext}`;
    a.click();
  }));

  $$('[data-voice-volume]').forEach(input => input.addEventListener('input', () => {
    const clip = (state.voiceClips || []).find(item => item.id === input.dataset.voiceVolume);
    if (!clip) return;
    clip.volume = Number(input.value);
    voiceStackDirty = true;
    scheduleAutosave();
  }));

  $$('[data-voice-fx]').forEach(input => input.addEventListener('input', () => {
    const key = input.dataset.voiceFx;
    state.voiceFx = { compressor:0.35, reverb:0.18, delay:0.08, eqLow:0, eqMid:0, eqHigh:0, ...(state.voiceFx || {}) };
    state.voiceFx[key] = Number(input.value);
    voiceStackDirty = true;
    const label = input.parentElement?.querySelector('b');
    if (label) label.textContent = key.startsWith('eq') ? `${state.voiceFx[key]}dB` : `${Math.round(state.voiceFx[key] * 100)}%`;
    scheduleAutosave();
  }));

  $('[data-voice-nudge]')?.addEventListener('input', event => {
    state.voiceNudgeMs = Number(event.target.value);
    voiceStackDirty = true;
    const label = event.target.parentElement?.querySelector('b');
    if (label) label.textContent = `${state.voiceNudgeMs}ms`;
    scheduleAutosave();
  });

  $('#slicerSource')?.addEventListener('change', event => { state.slicerSourceId = event.target.value; scheduleAutosave(); });
  $('#slicerSlices')?.addEventListener('change', event => { state.slicerSlices = Number(event.target.value); scheduleAutosave(); });
  $('#slicerStartPad')?.addEventListener('change', event => { state.slicerStartPad = Number(event.target.value); scheduleAutosave(); });
  $('#slicerChokeGroup')?.addEventListener('change', event => { state.slicerChokeGroup = Number(event.target.value); scheduleAutosave(); });
  $('#sliceToPadsBtn')?.addEventListener('click', () => sliceVoiceClipToPads());
  $('#sliceAndSequenceBtn')?.addEventListener('click', async () => { await sliceVoiceClipToPads(); state.page = 'voice'; render(); });
  $('#openDrumGridFromVoice')?.addEventListener('click', () => { state.page = 'play'; state.padMode = 'drums'; state.drumView = 'grid'; render(); });
  $('#clearSliceGrid')?.addEventListener('click', () => clearSliceGridPattern());
  $$('[data-select-slice-pad]').forEach(button => button.addEventListener('click', () => { state.selectedPad = Number(button.dataset.selectSlicePad); render(); }));
  $$('[data-slice-step]').forEach(button => button.addEventListener('click', () => {
    const [row, tick] = button.dataset.sliceStep.split(':').map(Number);
    if (!state.pattern[row]) state.pattern[row] = Array(totalTicks()).fill(0);
    state.pattern[row][tick] = state.pattern[row][tick] ? 0 : 110;
    if (state.pattern[row][tick]) audio.playPad(row, 110);
    scheduleAutosave();
    render();
  }));
}

function bindSettings() {
  $$('[data-bpm]').forEach(btn => btn.addEventListener('click', () => { pushHistory('BPM'); setTempo(state.bpm + Number(btn.dataset.bpm)); render(); }));
  $$('[data-setting]').forEach(input => input.addEventListener('input', () => {
    const key = input.dataset.setting;
    const value = ['loopBars','countInBars','polyphony','quantize','swing'].includes(key) ? Number(input.value) : input.value;
    if (key === 'loopBars') setLoopBars(value);
    else { pushHistory('Setting', input.type === 'range' ? 350 : 0); state[key] = value; render(); scheduleAutosave(); }
  }));
  $$('[data-toggle-setting]').forEach(btn => btn.addEventListener('click', () => {
    const key = btn.dataset.toggleSetting;
    pushHistory('Toggle setting');
    state[key] = !state[key];
    if (key === 'keepAwake') {
      state.keepAwake ? requestWakeLock() : releaseWakeLock();
      recoverAudioAndWake(true);
    }
    render();
    scheduleAutosave();
  }));
  $('#fixAudioBtn')?.addEventListener('click', () => recoverAudioAndWake(false));
  $('#preloadKit')?.addEventListener('click', () => audio.preloadKit());
  $('#clearPattern')?.addEventListener('click', () => { if (confirm('Clear pattern?')) { pushHistory('Clear pattern'); state.pattern = makePattern(); syncActiveLayer('drums'); render(); scheduleAutosave(); } });
  $('#copyBar')?.addEventListener('click', () => { pushHistory('Copy bar'); state.pattern = state.pattern.map(row => Array.from({ length: totalTicks() }, (_, i) => row[i % TICKS_PER_BAR] || 0)); render(); scheduleAutosave(); });
  $('#saveProject')?.addEventListener('click', saveProject);
  $('#loadProject')?.addEventListener('click', loadProject);
  $('#exportProject')?.addEventListener('click', exportProject);
  $('#importProjectBtn')?.addEventListener('click', () => $('#importProject')?.click());
  $('#importProject')?.addEventListener('change', e => importProject(e.target.files?.[0]));
  $('#newProject')?.addEventListener('click', newProject);
  $('#undoBtn')?.addEventListener('click', undo);
  $('#redoBtn')?.addEventListener('click', redo);
}

async function drawWaveform() {
  const canvas = $('#waveCanvas');
  if (!canvas || state.editingPad === null) return;
  const pad = state.pads[state.editingPad];
  const ctx2d = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  ctx2d.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx2d.clearRect(0, 0, rect.width, rect.height);
  ctx2d.fillStyle = '#15101f';
  ctx2d.fillRect(0, 0, rect.width, rect.height);
  if (!pad.url) {
    ctx2d.fillStyle = '#8f86a8';
    ctx2d.fillText('No sample loaded', 12, 28);
    return;
  }
  try {
    const buffer = await audio.load(pad.url);
    const data = buffer.getChannelData(0);
    const width = Math.floor(rect.width);
    const height = rect.height;
    ctx2d.strokeStyle = '#b18cff';
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    const block = Math.max(1, Math.floor(data.length / width));
    for (let x = 0; x < width; x++) {
      let min = 1, max = -1;
      const start = x * block;
      for (let i = 0; i < block; i++) {
        const v = data[start + i] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = (1 + min) * height / 2;
      const y2 = (1 + max) * height / 2;
      ctx2d.moveTo(x, y1);
      ctx2d.lineTo(x, y2);
    }
    ctx2d.stroke();
    ctx2d.fillStyle = 'rgba(255,59,107,.22)';
    ctx2d.fillRect(0, 0, (pad.trimStart ?? 0) * width, height);
    ctx2d.fillRect((pad.trimEnd ?? 1) * width, 0, width, height);
    ctx2d.fillStyle = '#a7ffdf';
    ctx2d.fillRect((pad.trimStart ?? 0) * width - 1, 0, 2, height);
    ctx2d.fillRect((pad.trimEnd ?? 1) * width - 1, 0, 2, height);
  } catch {
    ctx2d.fillStyle = '#ff6a8c';
    ctx2d.fillText('Waveform failed to load', 12, 28);
  }
}

function snapshot() {
  return { app: 'Pangea', version: 1, savedAt: new Date().toISOString(), state: {
    bpm: state.bpm, loopBars: state.loopBars, grid: state.grid, snap: state.snap, quantize: state.quantize, swing: state.swing,
    metronome: state.metronome, countInBars: state.countInBars, followPlayhead: state.followPlayhead, lowLatency: state.lowLatency, keepAwake: state.keepAwake,
    polyphony: state.polyphony, selectedPad: state.selectedPad, padMode: state.padMode, drumView: state.drumView, chordView: state.chordView, chordKey: state.chordKey, chordScale: state.chordScale, chordMode: state.chordMode, chordNoteCount: state.chordNoteCount, chordOctave: state.chordOctave, chordInversion: state.chordInversion, chordVoicing: state.chordVoicing, chordInstrument: state.chordInstrument, synthEngine: state.synthEngine, selectedChordDegree: state.selectedChordDegree, chordSequence: state.chordSequence, chordMidiNotes: state.chordMidiNotes, chordTriggers: state.chordTriggers, voiceClips: state.voiceClips, voiceFx: state.voiceFx, voiceRecordMode: state.voiceRecordMode, voiceStackMode: state.voiceStackMode, voiceNudgeMs: state.voiceNudgeMs, slicerSourceId: state.slicerSourceId, slicerSlices: state.slicerSlices, slicerStartPad: state.slicerStartPad, slicerChokeGroup: state.slicerChokeGroup, slicerMode: state.slicerMode, slicerTriggerMode: state.slicerTriggerMode, slicerPlayback: state.slicerPlayback, slicerVoices: state.slicerVoices, slicerChoke: state.slicerChoke, slicerTranspose: state.slicerTranspose, slicerGain: state.slicerGain, slicerNudgeTarget: state.slicerNudgeTarget, slicerNudgeDistance: state.slicerNudgeDistance, slicerSelectedPad: state.slicerSelectedPad, slicerAudioName: state.slicerAudioName, slicerAudioUrl: state.slicerAudioUrl, slicerAnalyzedBpm: state.slicerAnalyzedBpm, slicerBpmConfidence: state.slicerBpmConfidence, slicerBpmMethod: state.slicerBpmMethod, slicerBpmCandidates: state.slicerBpmCandidates, slicerBpmStatus: state.slicerBpmStatus, slicerSlicePoints: state.slicerSlicePoints, slicerPattern: state.slicerPattern, melodyNoteCount: state.melodyNoteCount, melodyOctave: state.melodyOctave, selectedMelodyPad: state.selectedMelodyPad, melodyEvents: state.melodyEvents, melodyView: state.melodyView, slicerView: state.slicerView, activeLayer: state.activeLayer, layers: state.layers, pads: state.pads, pattern: state.pattern,
  }};
}
function applySnapshot(data) {
  if (!data || !['Pangea','JamRoom Drum Machine'].includes(data.app)) return alert('Not a Pangea project file.');
  const s = data.state || {};
  Object.assign(state, s);
  state.loopBars = Number(state.loopBars || 4);
  state.chordScale = state.chordScale || 'Ionian';
  state.chordNoteCount = Number(state.chordNoteCount || chordModeSize() || 4);
  state.chordOctave = Number(state.chordOctave || 4);
  state.chordInversion = Number(state.chordInversion || 0);
  state.chordVoicing = state.chordVoicing || 'Closed';
  state.chordInstrument = state.chordInstrument || 'Soft Synth';
  state.synthEngine = { oscillator:'triangle', filter:2600, resonance:0.7, attack:0.012, release:0.16, brightness:0.7, detune:0, volume:0.9, ...(state.synthEngine || {}) };
  state.keepAwake = Boolean(state.keepAwake ?? true);
  state.voiceClips = Array.isArray(s.voiceClips) ? s.voiceClips : [];
  state.slicerSourceId = s.slicerSourceId || '';
  state.slicerSlices = Number(s.slicerSlices || 16);
  state.slicerStartPad = Number(s.slicerStartPad || 0);
  state.slicerChokeGroup = Number(s.slicerChokeGroup || 8);
  state.slicerMode = s.slicerMode || 'Manual';
  state.slicerTriggerMode = s.slicerTriggerMode || 'Trigger';
  state.slicerPlayback = s.slicerPlayback || 'One Shot';
  state.slicerVoices = s.slicerVoices || 'Mono';
  state.slicerTranspose = Number(s.slicerTranspose || 0);
  state.slicerGain = Number(s.slicerGain || 1);
  state.slicerNudgeTarget = s.slicerNudgeTarget || 'Start';
  state.slicerNudgeDistance = s.slicerNudgeDistance || '10 ms';
  state.slicerSelectedPad = Number(s.slicerSelectedPad || 0);
  state.slicerAudioName = s.slicerAudioName || '';
  state.slicerAudioUrl = s.slicerAudioUrl || '';
  state.slicerAnalyzedBpm = s.slicerAnalyzedBpm || null;
  state.slicerBpmConfidence = Number(s.slicerBpmConfidence || 0);
  state.slicerBpmMethod = s.slicerBpmMethod || '';
  state.slicerBpmCandidates = Array.isArray(s.slicerBpmCandidates) ? s.slicerBpmCandidates : [];
  state.slicerBpmStatus = s.slicerBpmStatus || 'Load audio to analyze BPM';
  state.slicerSlicePoints = Array.isArray(s.slicerSlicePoints) ? s.slicerSlicePoints : Array.from({ length: 16 }, (_, i) => ({ start: i / 16, end: (i + 1) / 16 }));
  state.slicerPattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => s.slicerPattern?.[r]?.[t] || 0));
  state.melodyNoteCount = Number(s.melodyNoteCount || 1);
  state.melodyOctave = Number(s.melodyOctave || state.chordOctave || 4);
  state.selectedMelodyPad = Number(s.selectedMelodyPad || 0);
  state.melodyEvents = sanitizeMelodyEvents(s.melodyEvents || []);
  state.melodyView = s.melodyView || 'split';
  state.slicerView = s.slicerView || 'split';
  state.layers = s.layers || null;
  state.activeLayer = s.activeLayer || { drums:0, chords:0, melody:0, slicer:0 };
  ensureLayers();
  state.voiceFx = { compressor:0.35, reverb:0.18, delay:0.08, eqLow:0, eqMid:0, eqHigh:0, ...(s.voiceFx || {}) };
  state.voiceRecordMode = s.voiceRecordMode || 'loopComp';
  state.voiceStackMode = s.voiceStackMode !== false;
  state.voiceNudgeMs = Number(s.voiceNudgeMs ?? -80);
  state.isVoiceRecording = false;
  state.isVoiceRecordArmed = false;
  state.voiceRecordingTime = 0;
  state.voiceTargetDuration = 0;
  if (state.keepAwake) requestWakeLock(true);
  const old = s.pattern || [];
  state.pattern = Array.from({ length: 16 }, (_, r) => Array.from({ length: totalTicks() }, (_, t) => old[r]?.[t] || 0));
  state.chordSequence = resizeChordSequence(s.chordSequence || []);
  state.chordTriggers = sanitizeChordTriggers(s.chordTriggers || []);
  // Upgrade older chord-block or expanded-note projects into chord trigger events.
  if ((!state.chordTriggers || state.chordTriggers.length === 0) && Array.isArray(s.chordSequence)) {
    s.chordSequence.forEach((degree, tick) => {
      if (degree === null || degree === undefined) return;
      state.chordTriggers.push({
        id: makeChordTriggerId(),
        degree: Number(degree),
        padIndex: Number(degree) % 16,
        tick: clamp(tick, 0, totalTicks() - 1),
        duration: CHORD_NOTE_DURATION,
        velocity: 100,
        octave: state.chordOctave,
        inversion: state.chordInversion,
        voicing: state.chordVoicing,
        chordKey: state.chordKey,
        chordScale: state.chordScale,
        chordNoteCount: chordModeSize(),
        label: chordDegreeLabel(Number(degree)),
        name: chordNameForDegree(Number(degree)),
      });
    });
  }
  state.chordTriggers = sanitizeChordTriggers(state.chordTriggers);
  state.chordMidiNotes = expandChordTriggersForMidiExport();
  state.pads = makeDefaultPads().map((base, i) => ({ ...base, ...(s.pads?.[i] || {}) }));
  state.page = 'play';
  state.editingPad = null;
  render();
}
function saveProject() { localStorage.setItem(PROJECT_KEY, JSON.stringify(snapshot())); state.lastSaved = new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' }); render(); toast('Project saved'); }
function loadProject() { const raw = localStorage.getItem(PROJECT_KEY) || localStorage.getItem(AUTOSAVE_KEY) || localStorage.getItem(LEGACY_PROJECT_KEY) || localStorage.getItem(LEGACY_AUTOSAVE_KEY); if (!raw) return alert('No saved project yet.'); applySnapshot(JSON.parse(raw)); toast('Project loaded'); }
function exportProject() { const blob = new Blob([JSON.stringify(snapshot(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `pangea-project-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url); }
function importProject(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { try { applySnapshot(JSON.parse(reader.result)); saveProject(); } catch { alert('Import failed.'); } }; reader.readAsText(file); }
function newProject() { if (!confirm('Start new project?')) return; pushHistory('New project'); stop(); Object.assign(state, { bpm:120, loopBars:4, grid:'1/16', snap:true, quantize:100, swing:55, metronome:true, countInBars:0, followPlayhead:false, lowLatency:true, keepAwake:true, polyphony:32, selectedPad:0, padMode:'drums', drumView:'split', chordView:'split', melodyView:'split', slicerView:'split', editingPad:null, chordKey:'C', chordScale:'Ionian', chordMode:'7ths', chordNoteCount:4, chordOctave:4, chordInversion:0, chordVoicing:'Closed', chordInstrument:'Soft Synth', synthEngine:{ oscillator:'triangle', filter:2600, resonance:0.7, attack:0.012, release:0.16, brightness:0.7, detune:0, volume:0.9 }, selectedChordDegree:0, melodyNoteCount:1, melodyOctave:4, selectedMelodyPad:0, melodyEvents:[], chordSequence:makeChordSequence(), chordMidiNotes:makeChordMidiNotes(), chordTriggers:makeChordTriggers(), voiceClips:[], isVoiceRecording:false, isVoiceRecordArmed:false, voiceRecordingTime:0, voiceRecordMode:'loopComp', voiceStackMode:true, voiceNudgeMs:-80, voiceFx:{ compressor:0.35, reverb:0.18, delay:0.08, eqLow:0, eqMid:0, eqHigh:0 }, slicerMode:'Manual', slicerTriggerMode:'Trigger', slicerPlayback:'One Shot', slicerVoices:'Mono', slicerTranspose:0, slicerGain:1, slicerNudgeTarget:'Start', slicerNudgeDistance:'10 ms', slicerSelectedPad:0, slicerAudioName:'', slicerAudioUrl:'', slicerAnalyzedBpm:null, slicerBpmConfidence:0, slicerBpmMethod:'', slicerBpmCandidates:[], slicerBpmStatus:'Load audio to analyze BPM', slicerSlicePoints:Array.from({ length:16 }, (_,i)=>({ start:i/16, end:(i+1)/16 })), slicerPattern:makeSlicerPattern(), activeLayer:{ drums:0, chords:0, melody:0, slicer:0 }, layers:null, pads:makeDefaultPads() }); state.pattern = makePattern(); syncActiveLayer('drums'); render(); scheduleAutosave(); }
function scheduleAutosave() { clearTimeout(autosaveTimer); autosaveTimer = setTimeout(() => localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(snapshot())), 600); }


let wakeLock = null;
let wakeLockRequesting = false;
let lastRecoveryAt = 0;

function wakeStatusLabel() {
  if (!state.keepAwake) return 'Off';
  if (!('wakeLock' in navigator)) return 'Unsupported';
  if (wakeLock) return 'Active';
  return state.wakeLockStatus === 'released' ? 'Ready to re-lock' : 'Ready';
}

async function requestWakeLock(quiet = false) {
  if (!state.keepAwake) return false;
  if (!('wakeLock' in navigator)) {
    state.wakeLockStatus = 'unsupported';
    updateLightUI();
    if (!quiet) toast('Wake Lock is not supported here');
    return false;
  }
  if (wakeLock || wakeLockRequesting || document.visibilityState !== 'visible') return Boolean(wakeLock);
  wakeLockRequesting = true;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    state.wakeLockStatus = 'active';
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
      state.wakeLockStatus = 'released';
      updateLightUI();
    });
    updateLightUI();
    if (!quiet) toast('Keep Awake active');
    return true;
  } catch (error) {
    state.wakeLockStatus = 'blocked';
    updateLightUI();
    if (!quiet) toast('Keep Awake could not start');
    return false;
  } finally {
    wakeLockRequesting = false;
  }
}

async function releaseWakeLock() {
  const lock = wakeLock;
  wakeLock = null;
  state.wakeLockStatus = 'off';
  try { await lock?.release?.(); } catch {}
  updateLightUI();
}

async function recoverAudioAndWake(quiet = true) {
  const now = Date.now();
  if (quiet && now - lastRecoveryAt < 650) return;
  lastRecoveryAt = now;
  try {
    await audio.ensure();
    state.audioRecoveryStatus = audio.ctx?.state || 'running';
    if (state.keepAwake) await requestWakeLock(true);
    updateLightUI();
    if (!quiet) toast('Audio recovered');
  } catch (error) {
    state.audioRecoveryStatus = 'blocked';
    updateLightUI();
    if (!quiet) toast('Tap Play or a pad to unlock audio');
  }
}

function installAudioRecovery() {
  const recoverQuiet = () => recoverAudioAndWake(true);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recoverQuiet();
  });
  window.addEventListener('pageshow', recoverQuiet);
  window.addEventListener('focus', recoverQuiet);
  window.addEventListener('pointerdown', recoverQuiet, { passive: true, capture: true });
  window.addEventListener('touchstart', recoverQuiet, { passive: true, capture: true });
}

function escapeHTML(str = '') { return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }
function escapeAttr(str = '') { return escapeHTML(str).replace(/`/g, '&#96;'); }
function toast(message) { const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.appendChild(el); setTimeout(() => el.remove(), 1800); }


function isTypingTarget(target) {
  const tag = target?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable;
}

window.addEventListener('keydown', (event) => {
  if (isTypingTarget(event.target)) return;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    if (event.shiftKey) redo(); else undo();
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
    event.preventDefault();
    redo();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    state.isPlaying ? stop() : start();
    return;
  }
  if (event.code === 'KeyR') {
    event.preventDefault();
    requestRecord();
    return;
  }
  if (Object.prototype.hasOwnProperty.call(KEYBOARD_PADS, event.code)) {
    event.preventDefault();
    const index = KEYBOARD_PADS[event.code];
    if (event.repeat && state.padMode === 'chords') return;
    if (state.padMode === 'chords') {
      pressedKeyboardPads.add(event.code);
      const info = chordPadInfo(index);
      state.selectedPad = index;
      beginChordHold(`key-${event.code}`, info.degree, info.octave, 110, info.inversion, state.chordVoicing, index);
      renderPadsOnly();
    } else if (state.padMode === 'melody') {
      playMelodyPad(index, 110);
    } else if (state.padMode === 'slicer') {
      playSlicerPad(index, 110);
    } else {
      recordPad(index);
      renderPadsOnly();
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (!Object.prototype.hasOwnProperty.call(KEYBOARD_PADS, event.code)) return;
  if (!pressedKeyboardPads.has(event.code)) return;
  pressedKeyboardPads.delete(event.code);
  endChordHold(`key-${event.code}`);
  renderPadsOnly();
});

installAudioRecovery();
window.addEventListener('beforeunload', () => {
  try { stopVoiceRecording(); } catch {}
  try { stopVoiceLoopClips(); } catch {}
});
render();
audio.updateLoadStatus();
requestWakeLock(true);
