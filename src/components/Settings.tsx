import { useEffect, useRef, useState } from 'react'
import type { View } from '../hooks/useHackathon'
import type { Outage } from '../lib/engine'
import { fromInputs, spanLabel, timeOfDay, toDateInput, toTimeInput } from '../lib/format'
import { IconClose } from './Icons'

interface Actions { setSchedule: (t: number) => void; sync: () => void; reset: () => void; rehearse: () => void; clearOutages: () => void }

/** Two-step button for actions that change a running clock. */
function Confirm({ label, sure, onConfirm, cls = 'btn warn', needed = true }: { label: string; sure: string; onConfirm: () => void; cls?: string; needed?: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (!armed) return; const id = setTimeout(() => setArmed(false), 4000); return () => clearTimeout(id) }, [armed])
  return (
    <button className={`${cls}${armed ? ' armed' : ''}`} onClick={() => { if (!needed || armed) { setArmed(false); onConfirm() } else setArmed(true) }}>
      {armed ? sure : label}
    </button>
  )
}

export default function Settings({ v, outages, actions, onClose }: { v: View; outages: Outage[]; actions: Actions; onClose: () => void }) {
  const [date, setDate] = useState(toDateInput(v.scheduledStart))
  const [time, setTime] = useState(toTimeInput(v.scheduledStart))
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { ref.current?.querySelector<HTMLElement>('input')?.focus() }, [])
  const valid = !Number.isNaN(fromInputs(date, time))

  return (
    <div className="scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="Clock settings" ref={ref}>
        <header>
          <h2>Clock settings</h2>
          <button className="x" aria-label="Close settings" onClick={onClose}><IconClose /></button>
        </header>

        <div className="sec-block">
          <h3>Kick-off time</h3>
          <p>The clock starts by itself at this time and runs for 6 hours. Currently set to {timeOfDay(v.scheduledStart)}.</p>
          <div className="row">
            <label className="field">Date<input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            <label className="field">Time<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
            <Confirm cls="btn go" label="Set kick-off" sure="Restart clock?" needed={v.phase === 'running' || v.phase === 'paused'}
              onConfirm={() => { if (valid) { actions.setSchedule(fromInputs(date, time)); onClose() } }} />
          </div>
        </div>

        <div className="sec-block">
          <h3>After a power cut</h3>
          <p>If the power goes out, the clock freezes and picks up from the same second when the page reopens. The time lost is not counted. Open the same web address as before so the saved time is found.</p>
          <div className="row">
            <Confirm label="Jump to real time instead" sure="Jump to real time?" onConfirm={() => { actions.sync(); onClose() }} cls="btn" />
            {outages.length > 0 && <button className="btn" onClick={actions.clearOutages}>Clear log</button>}
          </div>
          {outages.length > 0
            ? <ul className="log">{outages.map((o, i) => <li key={i}>{timeOfDay(o.at)}: lost {spanLabel(o.lostMs)}, resumed with {Math.floor((21_600_000 - o.resumedAtElapsed) / 60000)} min left</li>)}</ul>
            : <ul className="log"><li>No power cuts recorded.</li></ul>}
        </div>

        <div className="sec-block">
          <h3>Rehearse the ending</h3>
          <p>Plays the last 10 seconds and the finish show on screen with sound. The real clock is not touched. Press Esc to stop early.</p>
          <button className="btn go" onClick={() => { actions.rehearse(); onClose() }}>Run rehearsal</button>
        </div>

        <div className="sec-block">
          <h3>Reset</h3>
          <p>Stops the clock and returns it to 06:00:00 without starting it.</p>
          <Confirm label="Reset clock" sure="Tap again to reset" onConfirm={() => { actions.reset(); onClose() }} />
        </div>

        <div className="sec-block">
          <h3>Keyboard</h3>
          <dl className="keys">
            <kbd>Space</kbd><span>Pause or resume the running clock</span>
            <kbd>F</kbd><span>Fullscreen</span>
            <kbd>M</kbd><span>Mute or unmute sounds</span>
            <kbd>S</kbd><span>Open settings</span>
            <kbd>Esc</kbd><span>Close settings, or stop a rehearsal</span>
          </dl>
        </div>
      </div>
    </div>
  )
}
