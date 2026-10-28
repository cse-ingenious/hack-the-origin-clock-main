import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DURATION_MS, HOUR, MILESTONES_MS, actPause, actReset, actSetSchedule, actStart, actSyncToSchedule,
  freshState, hoursOf, parse, phaseOf, reconcile, totalLostMs,
  type EngineEvent, type Persisted, type Phase,
} from '../lib/engine'
import { audioReady, playFinale, playHourTune, playMilestoneBeep, playStart, playTick, unlockAudio } from '../lib/audio'
import { clockString, spanLabel } from '../lib/format'

const KEY = 'hto2026-timer-v2'
const REHEARSAL_COUNTDOWN_MS = 11_000
const REHEARSAL_TOTAL_MS = 11_000 + 26_000

export interface View {
  phase: Phase
  now: number
  /** What the big digits show: time to start (waiting) or time remaining. */
  displayMs: number
  elapsed: number
  remaining: number
  scheduledStart: number
  /** Projected end: now + remaining while running, else scheduled start + 6h. */
  endsAt: number
  lostMs: number
  outageCount: number
  /** 0..5, the hour currently in progress (index of the dial segment). */
  hourIndex: number
  finalHour: boolean
  finalSprint: boolean
  lastTen: boolean
  /** True when the end was seen live (or rehearsed): play the full show. */
  celebrate: boolean
  rehearsing: boolean
  soundOn: boolean
}

export interface Toast { id: number; tone: 'info' | 'good' | 'warn'; title: string; body?: string; sticky?: boolean }

function load(now: number): Persisted {
  try { const p = parse(localStorage.getItem(KEY)); if (p) return p } catch { /* private mode etc. */ }
  return freshState(now)
}

export function useHackathon() {
  const stateRef = useRef<Persisted>(null as unknown as Persisted)
  if (stateRef.current === null) stateRef.current = load(Date.now())
  const rehearsalRef = useRef<number | null>(null)
  const celebrateRef = useRef(false)
  const lastKeyRef = useRef('')
  const lastSecRef = useRef(-1)
  const prevPhaseRef = useRef<Phase | null>(null)
  const toastId = useRef(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [view, setView] = useState<View | null>(null)
  const [audioOk, setAudioOk] = useState(false)

  const persist = useCallback(() => { try { localStorage.setItem(KEY, JSON.stringify(stateRef.current)) } catch { /* noop */ } }, [])

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastId.current
    setToasts(list => [...list.slice(-2), { ...t, id }])
    setTimeout(() => setToasts(list => list.filter(x => x.id !== id)), t.sticky ? 45_000 : 9000)
  }, [])
  const dismissToast = useCallback((id: number) => setToasts(list => list.filter(t => t.id !== id)), [])

  const handleEvent = useCallback((e: EngineEvent, silent: boolean) => {
    const sound = stateRef.current.soundOn && !silent
    switch (e.type) {
      case 'start':
        pushToast({ tone: 'good', title: e.lateMs > 5000 ? 'Clock joined the schedule late' : 'Hack The Origin has started', body: e.lateMs > 5000 ? `Following the real schedule: ${spanLabel(e.lateMs)} already elapsed.` : 'Six hours on the clock. Good luck, builders.' })
        if (sound && e.lateMs <= 5000) playStart()
        break
      case 'hour':
        pushToast({ tone: 'info', title: `Hour ${e.hour} complete`, body: e.hour === 5 ? 'One hour to go.' : `${6 - e.hour} hours to go.` })
        if (sound) playHourTune(e.hour)
        break
      case 'milestone':
        pushToast({ tone: e.index >= 2 ? 'warn' : 'info', title: ['3 hours left', '1 hour left', '30 minutes left', '10 minutes left'][e.index] })
        if (sound) playMilestoneBeep()
        break
      case 'outage':
        pushToast({ tone: 'warn', sticky: true, title: 'Power interruption detected', body: `The clock was frozen for ${spanLabel(e.lostMs)} and resumed from ${clockString(DURATION_MS - e.elapsed)} remaining. That time was not counted.` })
        break
      case 'finish':
        celebrateRef.current = true
        break
    }
  }, [pushToast])

  const tick = useCallback(() => {
    const now = Date.now()
    let reh = rehearsalRef.current
    if (reh !== null && now - reh >= REHEARSAL_TOTAL_MS) { rehearsalRef.current = null; celebrateRef.current = false; reh = null }
    let v: View

    if (reh !== null) {
      const t = now - reh
      const remaining = Math.max(0, REHEARSAL_COUNTDOWN_MS - t)
      const done = remaining === 0
      v = {
        phase: done ? 'finished' : 'running', now, displayMs: remaining, elapsed: DURATION_MS - remaining, remaining,
        scheduledStart: stateRef.current.scheduledStart, endsAt: now + remaining, lostMs: 0, outageCount: 0,
        hourIndex: 5, finalHour: true, finalSprint: true, lastTen: !done && remaining <= 10_000, celebrate: true, rehearsing: true, soundOn: stateRef.current.soundOn,
      }
      celebrateRef.current = true
    } else {
      const r = reconcile(stateRef.current, now)
      stateRef.current = r.state
      const s = r.state
      // events from a stale page (opened long after) should not be loud
      r.events.forEach(e => handleEvent(e, false))
      const phase = phaseOf(s, now)
      const remaining = phase === 'waiting' || phase === 'standby' ? DURATION_MS : DURATION_MS - s.elapsed
      const displayMs = phase === 'waiting' ? s.scheduledStart - now : remaining
      v = {
        phase, now, displayMs, elapsed: s.elapsed, remaining, scheduledStart: s.scheduledStart,
        endsAt: phase === 'running' ? now + remaining : phase === 'finished' ? s.lastSeen : phase === 'paused' ? now + remaining : s.scheduledStart + DURATION_MS,
        lostMs: totalLostMs(s), outageCount: s.outages.length, hourIndex: hoursOf(s.elapsed),
        finalHour: phase !== 'waiting' && phase !== 'standby' && remaining <= HOUR && remaining > 0,
        finalSprint: phase !== 'waiting' && phase !== 'standby' && remaining <= MILESTONES_MS[3] && remaining > 0,
        lastTen: phase === 'running' && remaining <= 10_000 && remaining > 0,
        celebrate: celebrateRef.current, rehearsing: false, soundOn: s.soundOn,
      }
    }

    const sec = Math.floor(v.displayMs / 1000)
    // sounds that depend on the displayed second
    if (sec !== lastSecRef.current) {
      if (v.lastTen && v.soundOn && lastSecRef.current !== -1) playTick(sec + (v.displayMs % 1000 === 0 ? 0 : 1))
      lastSecRef.current = sec
    }
    if (prevPhaseRef.current && prevPhaseRef.current !== 'finished' && v.phase === 'finished' && v.celebrate && v.soundOn) playFinale()
    prevPhaseRef.current = v.phase

    const key = `${v.phase}|${sec}|${v.rehearsing}|${v.celebrate}|${Math.floor(v.now / 60000)}|${v.outageCount}|${v.soundOn}`
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key
      setView(v)
      if (!v.rehearsing) persist()
    }
  }, [handleEvent, persist])

  // heartbeat
  useEffect(() => {
    tick()
    const id = setInterval(tick, 200)
    const onVis = () => tick()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pagehide', persist)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pagehide', persist) }
  }, [tick, persist])

  // keep the screen awake
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const ask = async () => { try { lock = (await navigator.wakeLock?.request('screen')) ?? null } catch { /* unsupported */ } }
    void ask()
    const onVis = () => { if (document.visibilityState === 'visible') void ask() }
    document.addEventListener('visibilitychange', onVis)
    return () => { document.removeEventListener('visibilitychange', onVis); void lock?.release().catch(() => {}) }
  }, [])

  // sound unlock tracking
  useEffect(() => {
    const unlock = () => { unlockAudio(); setAudioOk(audioReady()) }
    window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock)
    return () => { window.removeEventListener('pointerdown', unlock); window.removeEventListener('keydown', unlock) }
  }, [])

  // document title
  useEffect(() => {
    if (!view) return
    const label = view.phase === 'finished' ? 'Time’s up' : view.phase === 'waiting' ? `Starts in ${clockString(view.displayMs)}` : clockString(view.displayMs)
    document.title = `${label} · Hack The Origin 2026`
  }, [view])

  const apply = useCallback((next: Persisted) => {
    stateRef.current = next; celebrateRef.current = false; prevPhaseRef.current = null; lastKeyRef.current = ''
    persist(); tick()
  }, [persist, tick])

  const actions = {
    start: () => { unlockAudio(); const s = stateRef.current; const wasStarted = s.started; apply(actStart(s, Date.now())); if (!wasStarted) { pushToast({ tone: 'good', title: 'Hack The Origin has started', body: 'Six hours on the clock.' }); if (s.soundOn) playStart() } },
    pause: () => apply(actPause(stateRef.current, Date.now())),
    reset: () => apply(actReset(stateRef.current, Date.now())),
    setSchedule: (start: number) => apply(actSetSchedule(stateRef.current, start, Date.now())),
    sync: () => apply(actSyncToSchedule(stateRef.current, Date.now())),
    toggleSound: () => apply({ ...stateRef.current, soundOn: !stateRef.current.soundOn }),
    rehearse: () => { unlockAudio(); rehearsalRef.current = Date.now(); lastKeyRef.current = ''; prevPhaseRef.current = null; tick() },
    stopRehearsal: () => { rehearsalRef.current = null; celebrateRef.current = false; lastKeyRef.current = ''; tick() },
    clearOutages: () => apply({ ...stateRef.current, outages: [] }),
  }
  const outages = stateRef.current.outages
  return { view, toasts, dismissToast, actions, audioOk, outages }
}
