# Changelog

## v3.0.0
- New professional design: a six-segment day dial (9 AM to 3 PM), one segment per hour, with a live leading dot.
  Quiet header, summary bar, auto-hiding controls. Light-to-dark background and the marquee were removed.
- Clock is now anchored to a schedule: counts down to a 9:00 AM kick-off, starts by itself, runs 6 hours.
- Power-cut safe: heartbeat saved every second; outages over 8 s are not counted, clock resumes where it stopped.
  Projected end time, notice and outage log included.
- Ending: last-10-seconds countdown, flash, shockwaves, "Time's up" headline, fanfare, confetti, fireworks, end screen.
- Settings panel (kick-off time, jump to real time, rehearsal, reset with confirmation).
- Notices for start, every hour and the 3h / 1h / 30m / 10m milestones.
- Dependencies reduced to React only (Tailwind, Framer Motion and Lucide removed).
- Fixed ports so the saved time is always found again.
