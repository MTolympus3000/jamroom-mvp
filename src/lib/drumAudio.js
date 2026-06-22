let ctx;
let samples = {};

export function getAudioContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, duration, type, gain) {
  const ac = getAudioContext();
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  amp.gain.setValueAtTime(gain, ac.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration + 0.02);
}

function noise(duration, gain, filterFreq = 900) {
  const ac = getAudioContext();
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const amp = ac.createGain();
  filter.type = 'highpass';
  filter.frequency.value = filterFreq;
  amp.gain.value = gain;
  src.buffer = buffer;
  src.connect(filter).connect(amp).connect(ac.destination);
  src.start();
}

export async function loadSample(padId, file) {
  const ac = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ac.decodeAudioData(arrayBuffer);
  samples[padId] = { name: file.name, buffer: audioBuffer };
  return file.name;
}

export function getSampleName(padId) {
  return samples[padId]?.name || null;
}

export function playPad(padId, velocity = 1) {
  const ac = getAudioContext();
  const sample = samples[padId];
  if (sample) {
    const src = ac.createBufferSource();
    const amp = ac.createGain();
    src.buffer = sample.buffer;
    amp.gain.value = Math.max(0.05, velocity);
    src.connect(amp).connect(ac.destination);
    src.start();
    return;
  }

  const v = Math.max(0.1, velocity);
  switch (padId) {
    case 'kick': tone(62, 0.20, 'sine', 0.24 * v); break;
    case 'snare': noise(0.12, 0.14 * v, 700); tone(185, 0.08, 'triangle', 0.05 * v); break;
    case 'clap': noise(0.08, 0.10 * v, 1100); setTimeout(() => noise(0.06, 0.08 * v, 1300), 28); break;
    case 'hat': noise(0.045, 0.06 * v, 6000); break;
    case 'ohat': noise(0.22, 0.05 * v, 5200); break;
    case 'tom': tone(118, 0.22, 'sine', 0.16 * v); break;
    case 'rim': tone(480, 0.06, 'square', 0.07 * v); break;
    case 'perc': tone(330, 0.09, 'triangle', 0.08 * v); break;
    case 'crash': noise(0.45, 0.06 * v, 2500); break;
    case 'shaker': noise(0.05, 0.04 * v, 7500); break;
    case 'ride': noise(0.20, 0.035 * v, 6800); tone(950, 0.14, 'triangle', 0.025 * v); break;
    case 'conga': tone(210, 0.16, 'sine', 0.12 * v); break;
    case '808': tone(48, 0.55, 'sine', 0.23 * v); break;
    case 'vox': tone(260, 0.12, 'sawtooth', 0.05 * v); break;
    case 'fx': noise(0.25, 0.05 * v, 1000); break;
    default: tone(240, 0.08, 'triangle', 0.05 * v);
  }
}
