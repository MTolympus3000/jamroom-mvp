# Pangea Phase 30 — Performance Mode + Universal Edit Grid

This build changes Pangea into a pad-first, play-by-feel workflow.

## Added
- Main instrument pages are performance-first: large pads are the focus.
- Visible sequencer grids are removed from Drums, Chords, Melody, and Slicer main pages.
- Each instrument/layer has its own Snap selector.
- Snap options include Bar, 1/2 bar, beat values, triplets, 1/64, and Off.
- Chords and Melody share the same global key/scale settings.
- Pads light up during loop playback when their events are triggered.
- Erase mode: turn Erase on and hold a pad while the loop passes to remove events from that layer.
- Visible Undo button in the transport.
- One universal full-page Edit Grid.
- Edit Grid opens for the current instrument and current layer only.
- Edit Grid uses horizontal and vertical scrollbars; no two-finger scroll is required.

## Workflow
1. Pick instrument.
2. Pick layer.
3. Pick Snap value.
4. Record by playing pads.
5. Use Erase or Undo to fix mistakes.
6. Tap Edit for detailed grid editing only when needed.

## Netlify
Build command: `npm run build`
Publish directory: `dist`

## Commit message
`Add performance mode and universal edit grid`
