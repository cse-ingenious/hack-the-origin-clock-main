import type { View } from '../hooks/useHackathon'
import { DURATION_MS, HOUR } from '../lib/engine'
import { dayLabel, spanLabel, timeOfDay } from '../lib/format'

export default function Stats({ v }: { v: View }) {
  const notStarted = v.phase === 'waiting' || v.phase === 'standby'
  const done = v.phase === 'finished'

  if (done) {
    return (
      <section className="stats" aria-label="Summary">
        <div className="thanks">
          <div>
            <h2>That’s time. Thank you, builders.</h2>
            <p>Hack The Origin 2026 ran for 6 hours. Please stop working now.</p>
          </div>
          <div className="facts">
            <div className="stat" style={{ border: 0, padding: 0 }}><div className="stat-l">Duration</div><div className="stat-v">6 hr</div></div>
            <div className="stat" style={{ border: 0, padding: 0 }}><div className="stat-l">Ended</div><div className="stat-v">{timeOfDay(v.endsAt)}</div></div>
            {v.lostMs > 0 && <div className="stat" style={{ border: 0, padding: 0 }}><div className="stat-l">Power cuts</div><div className="stat-v">{spanLabel(v.lostMs)}</div></div>}
          </div>
        </div>
      </section>
    )
  }

  const pct = (v.elapsed / DURATION_MS) * 100
  const hour = Math.min(6, v.hourIndex + 1)
  const hourLeftMin = Math.ceil((HOUR - (v.elapsed % HOUR)) / 60000)

  return (
    <section className="stats" aria-label="Summary">
      <div className="stat">
        <div className="stat-l">Elapsed</div>
        <div className="stat-v">{(notStarted ? 0 : pct).toFixed(1)}<small>%</small></div>
        <div className="bar"><i style={{ width: `${notStarted ? 0 : pct}%` }} /></div>
      </div>
      <div className="stat">
        <div className="stat-l">{notStarted ? 'Length' : 'Current hour'}</div>
        <div className="stat-v">{notStarted ? '6' : hour}<small>{notStarted ? 'hours' : 'of 6'}</small></div>
        <div className="stat-s">{notStarted ? 'Hourly chime after each hour' : `${hourLeftMin} min until hour ${Math.min(6, hour)} ends`}</div>
      </div>
      <div className="stat">
        <div className="stat-l">{v.phase === 'waiting' ? 'Kick-off' : 'Started'}</div>
        <div className="stat-v">{timeOfDay(v.scheduledStart)}</div>
        <div className="stat-s">{dayLabel(v.scheduledStart)}</div>
      </div>
      <div className="stat">
        <div className="stat-l">Ends</div>
        <div className="stat-v">{timeOfDay(v.endsAt)}</div>
        <div className="stat-s">{v.lostMs > 0 ? `Includes ${spanLabel(v.lostMs)} lost to power cuts` : notStarted ? 'Six hours after kick-off' : 'On schedule'}</div>
      </div>
    </section>
  )
}
