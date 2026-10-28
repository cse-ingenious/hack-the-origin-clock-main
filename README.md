# Hack The Origin 2026: event clock

A 6-hour hackathon clock for the projector. It starts by itself at **9:00 AM**, ends at **3:00 PM**,
survives power cuts, and finishes with a full-screen show.

React 19 + Vite 7 + TypeScript. No other runtime dependencies.

## Run it

```bash
npm install
npm run dev                          # http://localhost:5173
# or, more robust for the event:
npm run build && npm run preview     # http://localhost:4173
```

Open it in Chrome or Edge, press **F** for fullscreen, and click once anywhere so the browser allows sound.

## Before the event

1. Open the page, press **S**, set the **kick-off date and time** (default is the next 9:00 AM), and press *Set kick-off*.
2. Run **Rehearse the ending** once to check the projector, speakers and the finish show. It does not touch the real clock.
3. Leave the page open. At 9:00 AM it starts on its own with a start tune.

## Power cuts

The clock saves its state about once a second in the browser. If the power goes out (or the laptop sleeps) for
more than 8 seconds, the time in between is **not counted**: when the page is opened again it continues from the
same second it stopped at, shows a "Power interruption detected" notice, and moves the projected end time later
(for example "Ends 3:25 PM, includes 25 min lost to power cuts"). Every cut is listed in Settings.

To make this work, after a cut **open the same web address as before** (same port, same browser). Saved time
lives in the browser for that address. The ports are fixed (5173 dev, 4173 preview) for this reason.
If you would rather follow the real wall clock after a cut, use Settings, *Jump to real time instead*.

Opening the page after 9:00 AM with a clock that never started follows the real schedule (for example opening at 9:30 shows 5:30:00 left).

## What happens during the event

| Moment | What you see and hear |
| --- | --- |
| Before 9:00 AM | Countdown to kick-off, dial empty |
| 9:00 AM | Start tune, "Hack The Origin has started" notice, clock runs |
| Every hour | Hour tune, "Hour N complete" notice, dial segment completes |
| 12:00 PM, 2:00 PM, 2:30 PM, 2:50 PM | Notice and beep (3 hours, 1 hour, 30 minutes, 10 minutes left) |
| Last hour | Warm amber theme, "Final hour" status |
| Last 10 minutes | Red-orange theme, "Final 10 minutes" status |
| Last 10 seconds | One giant countdown number, a tick each second, pulsing red edge |
| 3:00 PM | White flash, shockwaves, "Time's up" headline, fanfare, confetti and fireworks |
| After | Clock rests at 00:00:00, fireworks keep going gently, thank-you bar |

## Controls

Move the mouse to show the control dock (it hides itself after 4 seconds, along with the cursor).

| Key | Action |
| --- | --- |
| Space | Pause or resume the running clock |
| F | Fullscreen |
| M | Mute or unmute |
| S | Settings (kick-off time, reset, rehearsal, power-cut log) |
| Esc | Close settings, or stop a rehearsal |

Reset needs a confirmation tap in Settings, so it cannot be hit by accident.

## Notes

- Fonts (Unbounded, Manrope) load from Google Fonts. If the venue internet is unreliable, open the page once
  beforehand so the browser caches them. The clock still works with fallback fonts.
- The screen is kept awake while the page is open. A UPS for the laptop and projector is still worth having.

## Code map

```
src/lib/engine.ts        timer rules: schedule, power-cut freeze, milestones (pure functions)
src/lib/audio.ts         WebAudio tunes, no audio files
src/hooks/useHackathon.ts  heartbeat, storage, wake lock, sounds, notices, rehearsal
src/components/          Dial, Header, Stats, Dock, Settings, Toasts, Finale (fireworks canvas)
src/index.css            all styling and design tokens
```
