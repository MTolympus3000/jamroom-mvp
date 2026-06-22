# JamRoom Drum Machine

A focused MPC/FPC-style drum machine and MIDI step sequencer built with React + Vite.

## Features

- Dark JamRoom UI based on the generated mockup
- Transport bar: play, stop, record, BPM, loop length, quantize, swing, metronome
- Step sequencer grid with 8 visible drum lanes
- 16 pad MPC layout
- FPC named-pad layout
- Factory Southside drum kit browser
- Sample import per pad
- Record pad taps into the sequencer
- Mute and solo per sequencer row
- Copy first bar across full loop

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Netlify

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

## Notes

This is a front-end MVP. It uses the Web Audio API to play local factory WAV samples from `public/factory` and user-imported files from the browser.


## Low Latency Pad Engine

This version preloads and decodes factory samples into Web Audio buffers, uses one shared AudioContext, and triggers pads on pointerdown instead of click. Use the KIT CACHE / PRELOAD button once before finger drumming for the lowest-latency feel. True zero latency is not possible in a browser, but this removes the common first-tap sample loading delay.
