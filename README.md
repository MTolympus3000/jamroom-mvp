# JamRoom MVP

A collaborative loop-building app prototype for asynchronous jam sessions.

## Current features

- Global project settings: title, BPM, bars, key, mode, chord density
- One-finger chord player
- Mode selector: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian
- Density selector: dyad, triad, tetrad, pentad, hexad, heptad
- Piano roll grid with manual note entry, delete, and quantize
- Drum pads and 32-step drum sequencer
- Copy first 2 drum bars across the loop
- Audio recording from microphone
- Import audio files such as WAV/MP3
- DAW-style waveform timeline with start-beat sliders
- Track mute, delete, volume, and master volume
- Local project save for MIDI/drum settings

## Run locally

```bash
npm install
npm run dev
```

## Build for Netlify

```bash
npm run build
```

Publish directory:

```text
dist
```

## Planned architecture

Future folders should stay organized like this:

```text
src/
  components/       reusable UI components
  lib/              audio engine, theory engine, storage helpers
  data/             music constants, presets, sample metadata
  styles/           CSS modules or global styles
```

## Future cloud features

- Supabase login
- Jam room invite links
- Audio upload to Supabase Storage
- Project database sync
- Comments per layer
- Export WAV/MIDI/stems
