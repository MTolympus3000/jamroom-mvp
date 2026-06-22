# JamRoom Drum Machine v15

Fixed-layout MPC performance build.

## Added in v15

- Fixed Play screen layout so pads do not disappear
- Minimal fixed Pad Editor replaces only the pad area
- Sequencer stays visible while editing a track
- Removed sample browser/import from the Pad Editor
- Pad Editor only contains Preview, Volume, Pan, Pitch, Fine, Choke Group, Voice Mode, Mute/Solo, Close
- Replaced BPM keyboard input with +/- stepper controls
- Added viewport and CSS protections to reduce iPhone Safari zoom/layout shifting
- Maintains low-latency pads, snap grid, count-in, first-pass playback, follow playhead, polyphony, and choke groups

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Commit message

```text
Add fixed layout and minimal pad editor
```
