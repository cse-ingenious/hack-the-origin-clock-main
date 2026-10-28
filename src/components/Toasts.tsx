import type { Toast } from '../hooks/useHackathon'
import { IconClose } from './Icons'

export default function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="toasts" role="region" aria-label="Notices" aria-live="polite">
      {toasts.map(t => (
        <div className="toast" data-tone={t.tone} key={t.id}>
          <span className="dot" />
          <div><b>{t.title}</b>{t.body && <p>{t.body}</p>}</div>
          <button aria-label="Dismiss notice" onClick={() => onDismiss(t.id)}><IconClose /></button>
        </div>
      ))}
    </div>
  )
}
