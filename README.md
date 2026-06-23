# JamRoom MVP

A first web MVP for a collaborative loop/jam app.

## Features included

- Jam project settings: title, BPM, bars, key, chord mode
- Audio recorder for voice/humming/beatbox layers
- One-finger chord player
- Diatonic 7th chords in the selected key
- Piano-roll style note viewer/editor
- Quantize button
- Copy first 2 bars to full loop
- Drum step sequencer
- Copy 2-bar drum pattern across the loop

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL shown by Vite.

## Next build steps

1. Add real drag-and-drop note editing.
2. Add proper transport playback with metronome.
3. Add Supabase login, project saving, and invite links.
4. Upload audio recordings to Supabase Storage.
5. Add friend collaboration and comments.


## Save Project Update

This version adds local Save/Load, autosave, Export JSON, Import JSON, and New Project. Audio recordings created as browser blob URLs are not permanently stored in JSON yet, but project settings, chords, piano-roll notes, and drum patterns are saved.
