import { useEffect, useRef, useState } from 'react'
import { useHackathon } from './hooks/useHackathon'
import Header from './components/Header'
import Dial from './components/Dial'
import Stats from './components/Stats'
import Dock from './components/Dock'
import Toasts from './components/Toasts'
import Settings from './components/Settings'
import Finale from './components/Finale'

const toggleFullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen().catch(() => {}) }

export default function App() {
  const { view: v, toasts, dismissToast, actions, audioOk, outages } = useHackathon()
  const [settings, setSettings] = useState(false)

  // hide the controls and the mouse pointer after a few idle seconds (projector-friendly)
  useEffect(() => {
    let id = 0
    const wake = () => { document.body.classList.remove('idle'); clearTimeout(id); id = window.setTimeout(() => { if (!settings) document.body.classList.add('idle') }, 4000) }
    wake()
    const evs = ['mousemove', 'pointerdown', 'keydown', 'touchstart'] as const
    evs.forEach(e => window.addEventListener(e, wake))
    return () => { evs.forEach(e => window.removeEventListener(e, wake)); clearTimeout(id); document.body.classList.remove('idle') }
  }, [settings])

  // keyboard — registered ONCE and reading the latest state from a ref. Re-registering
  // on every render dropped the first key press (React re-rendered mid-dispatch).
  const latest = useRef({ v, settings, actions })
  latest.current = { v, settings, actions }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { v, settings, actions } = latest.current
      const tag = (e.target as HTMLElement | null)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      if (e.key === 'Escape') { if (settings) setSettings(false); else if (v?.rehearsing) actions.stopRehearsal(); return }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (e.code === 'Space' && tag !== 'BUTTON') {
        e.preventDefault()
        if (v?.phase === 'running') actions.pause(); else if (v?.phase === 'paused') actions.start()
      } else if (k === 'f') toggleFullscreen()
      else if (k === 'm') actions.toggleSound()
      else if (k === 's') setSettings(s => !s)
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!v) return <div className="app" />
  const theme = v.phase === 'finished' ? 'normal' : v.finalSprint ? 'sprint' : v.finalHour ? 'final' : 'normal'

  return (
    <div className="app" data-theme={theme}>
      <Header v={v} />
      <main className="stage"><Dial v={v} /></main>
      <Stats v={v} />

      {v.lastTen && <div className="vignette" aria-hidden />}
      {v.phase === 'finished' && <Finale key={v.rehearsing ? 'rehearsal' : 'real'} celebrate={v.celebrate} />}

      <Toasts toasts={toasts} onDismiss={dismissToast} />
      <Dock v={v} soundHint={v.soundOn && !audioOk && v.phase !== 'finished'}
        onStart={actions.start} onPause={actions.pause} onSound={actions.toggleSound} onFullscreen={toggleFullscreen} onSettings={() => setSettings(true)} />
      {settings && <Settings v={v} outages={outages} actions={actions} onClose={() => setSettings(false)} />}
    </div>
  )
}
