import type { View } from '../hooks/useHackathon'
import { DURATION_MS } from '../lib/engine'
import { dayLabel, timeOfDay } from '../lib/format'
import { IconCode } from './Icons'

type Tone = 'live' | 'warn' | 'hot' | 'done' | 'wait'
export function statusOf(v: View): { label: string; tone: Tone } {
  if (v.rehearsing && v.phase !== 'finished') return { label: 'Rehearsal', tone: 'warn' }
  switch (v.phase) {
    case 'waiting': return { label: 'Waiting for kick-off', tone: 'wait' }
    case 'standby': return { label: 'Ready to start', tone: 'wait' }
    case 'paused': return { label: 'Paused', tone: 'warn' }
    case 'finished': return { label: v.rehearsing ? 'Rehearsal complete' : 'Complete', tone: 'done' }
    default:
      if (v.finalSprint) return { label: 'Final 10 minutes', tone: 'hot' }
      if (v.finalHour) return { label: 'Final hour', tone: 'warn' }
      return { label: 'Live', tone: 'live' }
  }
}

export default function Header({ v }: { v: View }) {
  const st = statusOf(v)
  const end = v.scheduledStart + DURATION_MS
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-mark" aria-hidden><IconCode /></div>
        <div>
          <div className="brand-name">Hack The Origin 2026</div>
          <div className="brand-sub">6-hour hackathon, {timeOfDay(v.scheduledStart)} to {timeOfDay(end)}</div>
        </div>
      </div>
      <div className="header-right">
        <div className="wall" aria-label="Current time">
          <b>{timeOfDay(v.now)}</b>
          <span>{dayLabel(v.now)}</span>
        </div>
        <div className="chip" data-tone={st.tone} role="status"><i />{st.label}</div>
      </div>
    </header>
  )
}
