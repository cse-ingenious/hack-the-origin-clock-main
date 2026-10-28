import type { View } from '../hooks/useHackathon'
import { IconFullscreen, IconMuted, IconPause, IconPlay, IconSettings, IconSound } from './Icons'

interface Props { v: View; onStart: () => void; onPause: () => void; onSound: () => void; onFullscreen: () => void; onSettings: () => void; soundHint: boolean }

export default function Dock({ v, onStart, onPause, onSound, onFullscreen, onSettings, soundHint }: Props) {
  const running = v.phase === 'running'
  const showPrimary = v.phase !== 'finished' && !v.rehearsing
  const tip = running ? 'Pause' : v.phase === 'paused' ? 'Resume' : 'Start now'
  return (
    <>
      <nav className="dock" aria-label="Clock controls">
        {showPrimary && (
          <button className="primary" data-tip={tip} aria-label={tip} onClick={running ? onPause : onStart}>
            {running ? <IconPause /> : <IconPlay />}
          </button>
        )}
        <button data-tip={v.soundOn ? 'Mute sounds (M)' : 'Turn sounds on (M)'} aria-label={v.soundOn ? 'Mute sounds' : 'Turn sounds on'} onClick={onSound}>
          {v.soundOn ? <IconSound /> : <IconMuted />}
        </button>
        <button data-tip="Fullscreen (F)" aria-label="Toggle fullscreen" onClick={onFullscreen}><IconFullscreen /></button>
        <button data-tip="Settings (S)" aria-label="Open settings" onClick={onSettings}><IconSettings /></button>
      </nav>
      {soundHint && <div className="sound-hint" role="note">Click anywhere once so the browser allows sound</div>}
    </>
  )
}
