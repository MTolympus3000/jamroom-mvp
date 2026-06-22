# JamRoom Drum Machine v4

Focused MPC performance build.

## What changed

- Locked mobile screen so tapping pads does not drag the page
- Removed FPC layout from Play screen
- Play screen now focuses on compact transport, sequencer, and 4x4 MPC pads
- Samples and Settings moved to separate bottom tabs
- Transport buttons are smaller than pads
- Live loop fix: sequencer playback reads the current pattern live, not a stale copy
- Mouse-added notes and recorded pad hits can play during the first pass without stopping
- Snap-to-grid still controls mouse note placement and recorded pad hits
- Low latency sample playback retained
- Factory Southside kit retained

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
