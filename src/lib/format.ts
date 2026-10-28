const two = (n: number) => String(n).padStart(2, '0')

export function splitHMS(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000))
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60, total: t }
}

export const clockString = (ms: number) => {
  const { h, m, s } = splitHMS(ms)
  return `${two(h)}:${two(m)}:${two(s)}`
}

/** "9:00 AM" */
export const timeOfDay = (epoch: number) =>
  new Date(epoch).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/** "9 AM" for dial labels */
export const hourLabel = (epoch: number) =>
  new Date(epoch).toLocaleTimeString('en-US', { hour: 'numeric' })

/** "Thu, 29 Oct" */
export const dayLabel = (epoch: number) =>
  new Date(epoch).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

/** "12 min 04 sec" style for outage notices */
export function spanLabel(ms: number) {
  const { h, m, s } = splitHMS(ms)
  if (h > 0) return `${h} hr ${two(m)} min`
  if (m > 0) return `${m} min ${two(s)} sec`
  return `${s} sec`
}

/** yyyy-mm-dd and hh:mm for <input type=date|time> */
export const toDateInput = (epoch: number) => {
  const d = new Date(epoch)
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`
}
export const toTimeInput = (epoch: number) => {
  const d = new Date(epoch)
  return `${two(d.getHours())}:${two(d.getMinutes())}`
}
export const fromInputs = (date: string, time: string) => new Date(`${date}T${time}`).getTime()
