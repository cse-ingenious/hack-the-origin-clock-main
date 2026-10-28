// WebAudio tunes — no audio files needed.
let ctx: AudioContext | null = null
function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}
function tone(freq: number, start: number, dur: number, type: OscillatorType = 'triangle', gain = 0.16) {
  const a = ac(); const t = a.currentTime + start
  const o = a.createOscillator(); const g = a.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(gain, t + 0.03)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05)
}

/** Browsers block sound until the page has been clicked once. */
export function unlockAudio() { try { ac() } catch { /* noop */ } }
export function audioReady(): boolean { return !!ctx && ctx.state === 'running' }

/** Played at the start of the hackathon. */
export function playStart() {
  ;[392, 523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.14, 0.5, 'triangle', 0.16))
  tone(1046.5, 0.62, 1.1, 'triangle', 0.14)
  tone(196, 0, 1.6, 'sine', 0.1)
}
/** After every full hour (1–5). */
export function playHourTune(hour: number) {
  const base = [523.25, 587.33, 659.25, 783.99, 880.0]
  tone(261.63, 0, 0.9, 'sine', 0.1)
  base.forEach((f, i) => tone(f, i * 0.16, 0.42, 'triangle', 0.16))
  tone(base[(hour - 1) % base.length] * 2, 0.85, 0.6, 'triangle', 0.12)
}
export function playMilestoneBeep() { tone(880, 0, 0.25); tone(1174.66, 0.18, 0.35) }
/** One tick per second during the last 10 seconds; the last three are higher. */
export function playTick(secondsLeft: number) {
  tone(secondsLeft <= 3 ? 1318.5 : 988, 0, 0.14, 'square', 0.07)
}
/** Big finish: rising fanfare, a held chord and a low hit. */
export function playFinale() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
  notes.forEach((f, i) => tone(f, i * 0.18, 0.7, 'triangle', 0.18))
  ;[523.25, 659.25, 783.99, 1046.5].forEach(f => tone(f, 1.0, 2.6, 'sawtooth', 0.05))
  tone(130.81, 0, 2.8, 'sine', 0.16)
  tone(98, 0.0, 0.6, 'square', 0.08)
}
