# JamRoom Drum v8 — Two-Finger Pan

Focused MPC-style drum machine.

## Added in v8
- Two-finger sequencer pan now moves horizontally and vertically.
- One-finger tap still adds/removes MIDI notes.
- One-finger pad play stays locked and does not move the screen.
- Follow Playhead remains available in Settings.

## Prior features retained
- Low latency pad engine
- Count-in capture
- Snap-to-grid for mouse notes and recorded hits
- Grid options: 1/4, 1/8, 1/16, 1/32
- MPC 4x4 pads only
- Factory Southside kit

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```


## v9 Two-Finger Guard Update

- Removed the sequencer scrollbar.
- Sequencer navigation is now two-finger pan only.
- Two-finger pan moves horizontally through time and vertically through drum rows.
- One-finger tap still adds/removes notes.
- Touch note entry is delayed briefly so a second finger can join without accidentally creating notes.
- Any pending note tap is cancelled the moment two-finger pan starts.

## v10 Polyphony + Choke Groups

- Polyphony setting: 16, 32, or 64 voices
- Voice stealing: when the limit is reached, the oldest voice is stopped
- Voice meter in Settings
- Per-pad choke group setting in Samples
- Default choke groups:
  - Group 1: closed/open hats
  - Group 2: 808 pads


## v12 Performance Pass
- Virtualized sequencer grid rendering for longer patterns.
- RequestAnimationFrame playhead UI updates.
- Instant one-finger note entry.
- Two-finger pan remains protected with a movement threshold.
- 32-voice default polyphony remains enabled.
- Follow playhead remains available in Settings.


## v16 Pad Visibility Fix
- Replaced fragile grid height layout with fixed flex slots.
- Sequencer has a fixed visible height.
- MPC pads/editor always occupy the bottom performance slot.
- Pads no longer disappear into a black empty area.
