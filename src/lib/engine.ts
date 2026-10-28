/**
 * Timer engine — pure functions, no React, no DOM.
 *
 * The hackathon is a 6-hour block that starts at a scheduled wall-clock time
 * (default 9:00 AM) and normally ends 6 hours later (3:00 PM).
 *
 * POWER-CUT RULE
 * While the clock is running we save a heartbeat (`lastSeen`) about once a
 * second. When the page comes back and the gap since the last heartbeat is
 * longer than OUTAGE_MS, the time in between is NOT counted: the clock
 * resumes exactly where it stopped. Short gaps (a page refresh) are counted.
 */

export const HOUR = 3_600_000
export const DURATION_MS = 6 * HOUR
/** A gap longer than this between two heartbeats is treated as a power cut. */
export const OUTAGE_MS = 8_000
/** Remaining-time milestones that trigger a notice + beep. */
export const MILESTONES_MS = [3 * HOUR, HOUR, 30 * 60_000, 10 * 60_000] as const

export interface Outage { at: number; lostMs: number; resumedAtElapsed: number }

export interface Persisted {
  v: 2
  /** Wall-clock moment the hackathon is scheduled to start (epoch ms). */
  scheduledStart: number
  /** If true, the clock starts by itself when the scheduled time arrives. */
  armed: boolean
  started: boolean
  paused: boolean
  finished: boolean
  /** Hackathon time that has elapsed as of `lastSeen` (ms, 0..DURATION_MS). */
  elapsed: number
  lastSeen: number
  soundOn: boolean
  /** Hours already announced (0..5) and milestones already announced. */
  hourMark: number
  milestoneMark: number
  outages: Outage[]
}

export type Phase = 'waiting' | 'standby' | 'running' | 'paused' | 'finished'

export type EngineEvent =
  | { type: 'start'; lateMs: number }
  | { type: 'hour'; hour: number }
  | { type: 'milestone'; index: number }
  | { type: 'outage'; lostMs: number; elapsed: number }
  | { type: 'finish' }

/** The next 9:00 AM (or given hour) strictly after `now` unless it is still ahead today. */
export function nextStart(now: number, hour = 9, minute = 0): number {
  const d = new Date(now)
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() <= now) d.setDate(d.getDate() + 1)
  return d.getTime()
}

export function freshState(now: number, soundOn = true): Persisted {
  return {
    v: 2, scheduledStart: nextStart(now), armed: true, started: false, paused: false,
    finished: false, elapsed: 0, lastSeen: now, soundOn, hourMark: 0, milestoneMark: 0, outages: [],
  }
}

export const hoursOf = (elapsed: number) => Math.min(5, Math.floor(elapsed / HOUR))
export const milestonesPassed = (elapsed: number) =>
  MILESTONES_MS.filter(m => DURATION_MS - elapsed <= m).length

export function phaseOf(s: Persisted, now: number): Phase {
  if (s.finished) return 'finished'
  if (!s.started) return s.armed && now < s.scheduledStart ? 'waiting' : 'standby'
  return s.paused ? 'paused' : 'running'
}

export function totalLostMs(s: Persisted): number {
  return s.outages.reduce((a, o) => a + o.lostMs, 0)
}

/**
 * Advance the state to `now`. Returns the new state and any events that
 * crossed during the step. Never mutates the input.
 */
export function reconcile(prev: Persisted, now: number): { state: Persisted; events: EngineEvent[] } {
  const events: EngineEvent[] = []
  let s = prev
  if (s.finished) return { state: s, events }

  if (!s.started) {
    if (!(s.armed && now >= s.scheduledStart)) return { state: s, events }
    // Scheduled time arrived. If the page is opened late, follow the wall clock.
    const late = Math.max(0, now - s.scheduledStart)
    const elapsed = Math.min(late, DURATION_MS)
    s = { ...s, started: true, paused: false, elapsed, lastSeen: now, hourMark: hoursOf(elapsed), milestoneMark: milestonesPassed(elapsed) }
    events.push({ type: 'start', lateMs: late })
  } else if (!s.paused) {
    const gap = now - s.lastSeen
    if (gap > OUTAGE_MS) {
      // Power cut / sleep: do not count the gap, resume where we stopped.
      s = { ...s, lastSeen: now, outages: [...s.outages, { at: s.lastSeen, lostMs: gap, resumedAtElapsed: s.elapsed }] }
      events.push({ type: 'outage', lostMs: gap, elapsed: s.elapsed })
    } else {
      s = { ...s, elapsed: s.elapsed + Math.max(0, gap), lastSeen: now }
    }
  } else if (s.lastSeen !== now) {
    s = { ...s, lastSeen: now }
  }

  if (s.elapsed >= DURATION_MS) {
    s = { ...s, elapsed: DURATION_MS, finished: true, paused: false }
    events.push({ type: 'finish' })
    return { state: s, events }
  }

  const hours = hoursOf(s.elapsed)
  if (hours > s.hourMark) {
    if (hours === s.hourMark + 1) events.push({ type: 'hour', hour: hours })
    s = { ...s, hourMark: hours }
  }
  const passed = milestonesPassed(s.elapsed)
  if (passed > s.milestoneMark) {
    if (passed === s.milestoneMark + 1) events.push({ type: 'milestone', index: passed - 1 })
    s = { ...s, milestoneMark: passed }
  }
  return { state: s, events }
}

/* ───────────── user actions (all return a new state) ───────────── */

/** Start immediately (early start), or resume if paused. */
export function actStart(s: Persisted, now: number): Persisted {
  if (s.finished) return s
  if (s.started) return { ...s, paused: false, lastSeen: now }
  return { ...s, started: true, paused: false, armed: false, scheduledStart: now, elapsed: 0, lastSeen: now, hourMark: 0, milestoneMark: 0 }
}

export function actPause(s: Persisted, now: number): Persisted {
  if (!s.started || s.finished) return s
  const r = reconcile(s, now).state
  return { ...r, paused: true, lastSeen: now }
}

/** Back to a clean 06:00:00, not started, not armed. */
export function actReset(s: Persisted, now: number): Persisted {
  return { ...freshState(now, s.soundOn), scheduledStart: s.scheduledStart, armed: false }
}

/** New schedule: wait for it, then auto-start. */
export function actSetSchedule(s: Persisted, start: number, now: number): Persisted {
  return { ...freshState(now, s.soundOn), scheduledStart: start, armed: true }
}

/** Jump the clock to real wall-clock time (start + now), e.g. after a long outage. */
export function actSyncToSchedule(s: Persisted, now: number): Persisted {
  if (now < s.scheduledStart) return { ...s, started: false, paused: false, finished: false, armed: true, elapsed: 0, lastSeen: now, hourMark: 0, milestoneMark: 0, outages: [] }
  const elapsed = Math.min(DURATION_MS, now - s.scheduledStart)
  const done = elapsed >= DURATION_MS
  return { ...s, started: true, paused: false, finished: done, armed: false, elapsed, lastSeen: now, hourMark: hoursOf(elapsed), milestoneMark: milestonesPassed(elapsed), outages: [] }
}

/** Load from storage, validating the shape; returns null if unusable. */
export function parse(raw: string | null): Persisted | null {
  if (!raw) return null
  try {
    const s = JSON.parse(raw) as Persisted
    if (s && s.v === 2 && typeof s.scheduledStart === 'number' && typeof s.elapsed === 'number' && typeof s.lastSeen === 'number' && Array.isArray(s.outages)) return s
  } catch { /* ignore */ }
  return null
}
