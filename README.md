# JamRoom Drum Machine v6

Focused MPC drum machine update.

## Added

- Minimal horizontal scrollbar for the MIDI sequencer grid
- Grid menu simplified to 1/4, 1/8, 1/16, 1/32 beat
- Count-In now arms recording immediately when countdown begins
- Early pad hits during count-in are captured
- Snap-to-grid removes off-grid notes when enabled or grid changes
- Mouse-added notes and recorded pad hits snap to selected grid

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## v7 Navigation Update
- Added Follow Playhead toggle in Settings.
- Sequencer grid no longer slides with one finger.
- Use two fingers on the sequencer grid to horizontally move through the MIDI grid.
- One-finger taps remain for adding/removing MIDI notes.
