# JamRoom Drum Machine v3

Focused drum-machine MVP with low-latency pad playback and global Snap-to-Grid.

## Included

- Drum machine only
- 16 pads
- MPC and FPC pad layout switcher
- Drum MIDI sequencer
- Factory Southside drum kit
- Sample browser
- User sample import
- Play / Stop / Record
- BPM and loop length
- Metronome click
- Low Latency Mode
- Preload Kit button
- First-pass sequencer playback fix
- Snap To Grid ON/OFF
- Grid resolution selector

## Snap/Grid Options

- 1 Bar
- 1/2 Bar
- 1/4 Bar
- 1 Beat
- 1/2 Beat
- 1/4 Beat
- 1/8 Beat
- 1/4T
- 1/8T
- 1/16T
- 1/32T

Snap affects:

- Mouse-added sequencer notes
- Recorded pad hits
- Pattern copy/loop playback

## Run locally

```bash
npm install --registry=https://registry.npmjs.org/
npm run dev
```

## Build

```bash
npm run build
```

## Netlify

Build command:

```bash
npm install --legacy-peer-deps && npm run build
```

Publish directory:

```bash
dist
```
