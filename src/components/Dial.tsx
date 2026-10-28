import { memo, useEffect, type ReactNode } from 'react'
import type { View } from '../hooks/useHackathon'
import { HOUR } from '../lib/engine'
import { dayLabel, splitHMS, timeOfDay } from '../lib/format'

const CX = 120
const R = 96
const C = 2 * Math.PI * R
const GAP = 5 // degrees between hour segments
const SEG = 60 - GAP
const SEG_LEN = (C * SEG) / 360

const two = (n: number) => String(n).padStart(2, '0')
const tickLabel = (epoch: number) => {
  const d = new Date(epoch)
  const h = d.getHours() % 12 || 12
  const mm = d.getMinutes()
  return mm === 0 ? `${h} ${d.getHours() < 12 ? 'AM' : 'PM'}` : `${h}:${two(mm)}`
}

/** Measure the widest digit of the font that actually loaded, so fixed digit cells never overlap or look loose. */
function useDigitWidth() {
  useEffect(() => {
    const measure = () => {
      const s = document.createElement('span')
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:700 100px var(--font-display)'
      document.body.appendChild(s)
      let max = 0
      for (const d of '0123456789') { s.textContent = d; max = Math.max(max, s.getBoundingClientRect().width) }
      s.remove()
      if (max > 0) document.documentElement.style.setProperty('--dwn', (max / 100 + 0.07).toFixed(3))
    }
    measure()
    void document.fonts?.ready.then(measure)
    document.fonts?.addEventListener?.('loadingdone', measure)
    return () => document.fonts?.removeEventListener?.('loadingdone', measure)
  }, [])
}

function Digits({ ms }: { ms: number }) {
  const { h, m, s } = splitHMS(ms)
  const parts = [two(h), two(m), two(s)]
  return (
    <>
      <div className="digits" aria-hidden>
        {parts.map((p, gi) => (
          <span key={gi} style={{ display: 'contents' }}>
            {gi > 0 && <span className="colon">:</span>}
            <span className={gi === 2 ? 'sec' : undefined} style={{ display: 'inline-flex' }}>
              {p.split('').map((ch, i) => <span key={`${gi}${i}${ch}`} className="d in">{ch}</span>)}
            </span>
          </span>
        ))}
      </div>
      <div className="units" aria-hidden><span>hours</span><span /><span>minutes</span><span /><span>seconds</span></div>
    </>
  )
}

export default memo(function Dial({ v }: { v: View }) {
  useDigitWidth()
  const notStarted = v.phase === 'waiting' || v.phase === 'standby'
  const done = v.phase === 'finished'
  const elapsed = notStarted ? 0 : v.elapsed
  const idx = Math.min(5, Math.floor(elapsed / HOUR))
  const frac = Math.min(1, (elapsed - idx * HOUR) / HOUR)
  const leadDeg = idx * 60 + GAP / 2 + frac * SEG
  const secsLeft = Math.ceil(v.remaining / 1000)

  let label = 'Time remaining'
  let note: ReactNode = <>Ends at <b>{timeOfDay(v.endsAt)}</b></>
  if (v.phase === 'waiting') { label = 'Kick-off in'; note = <>Starts at <b>{timeOfDay(v.scheduledStart)}</b>, {dayLabel(v.scheduledStart)}</> }
  else if (v.phase === 'standby') { label = 'Ready'; note = <>Press play to start the 6 hours</> }
  else if (v.phase === 'paused') { label = 'Paused'; note = <>The clock is on hold</> }
  else if (done) { label = 'Hackathon complete'; note = <>Ended at <b>{timeOfDay(v.endsAt)}</b></> }

  return (
    <div className={`dial${done ? ' done' : ''}${v.phase === 'paused' ? ' paused' : ''}`}>
      <svg viewBox="0 0 240 240" aria-hidden>
        <defs>
          <linearGradient id="dialGrad" gradientUnits="userSpaceOnUse" x1="30" y1="30" x2="210" y2="210">
            <stop className="s1" offset="0" /><stop className="s2" offset="0.55" /><stop className="s3" offset="1" />
          </linearGradient>
        </defs>
        <circle className="hair" cx={CX} cy={CX} r={R - 11} />
        {Array.from({ length: 6 }, (_, i) => {
          const rot = i * 60 - 90 + GAP / 2
          const f = done ? 1 : Math.min(1, Math.max(0, (elapsed - i * HOUR) / HOUR))
          return (
            <g key={i} transform={`rotate(${rot} ${CX} ${CX})`}>
              <circle className="track" cx={CX} cy={CX} r={R} strokeDasharray={`${SEG_LEN} ${C}`} />
              <circle className="fill fill-glow" cx={CX} cy={CX} r={R} strokeDasharray={`${f * SEG_LEN} ${C}`} />
            </g>
          )
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i * 60 * Math.PI) / 180
          const x = CX + 109 * Math.sin(a); const y = CX - 109 * Math.cos(a)
          return <text key={i} className={`tick${elapsed >= i * HOUR && !notStarted ? ' passed' : ''}`} x={x} y={y}>{tickLabel(v.scheduledStart + i * HOUR)}</text>
        })}
        {!notStarted && !done && (
          <g className="lead-g" style={{ transform: `rotate(${leadDeg}deg)` }}>
            <circle className="lead" cx={CX} cy={CX - R} r="3.4" />
          </g>
        )}
      </svg>

      <div className="center">
        {v.lastTen ? (
          <>
            <div className="c-label">Seconds remaining</div>
            <div className="ten" key={secsLeft}>{secsLeft}</div>
          </>
        ) : (
          <>
            <div className="c-label">{label}</div>
            <Digits ms={v.displayMs} />
            <div className="c-note">{note}</div>
          </>
        )}
      </div>
      <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }} role="timer" aria-live="off">
        {label} {two(splitHMS(v.displayMs).h)} hours {two(splitHMS(v.displayMs).m)} minutes {two(splitHMS(v.displayMs).s)} seconds
      </span>
    </div>
  )
})

