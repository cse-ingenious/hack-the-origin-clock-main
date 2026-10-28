import { useEffect, useRef, useState } from 'react'

const COLORS = ['#7b4dfd', '#e64be6', '#ffb547', '#4f86ff', '#ffffff', '#6ef0c0', '#ff5c7a']
const BURST_MS = 14_000

interface P {
  x: number; y: number; vx: number; vy: number; life: number; max: number; color: string
  kind: 0 | 1 | 2 // 0 spark, 1 confetti, 2 rocket
  size: number; rot: number; vr: number; w: number; h: number; ty: number
}

/** Canvas fireworks + confetti. Redrawn from scratch every frame, so nothing smears. */
function Fireworks({ celebrate }: { celebrate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const canvas = ref.current!; const c = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let W = 0, H = 0, sc = 1
    const resize = () => { W = innerWidth; H = innerHeight; canvas.width = W * dpr; canvas.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); sc = Math.min(W, H) / 900 }
    resize(); window.addEventListener('resize', resize)

    const parts: P[] = []
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)
    const pick = () => COLORS[Math.floor(Math.random() * COLORS.length)]
    const blank = (): P => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 0, color: '#fff', kind: 0, size: 2, rot: 0, vr: 0, w: 0, h: 0, ty: 0 })

    const rocket = () => {
      const p = blank(); p.kind = 2; p.x = rnd(W * 0.12, W * 0.88); p.y = H + 10
      p.vy = -rnd(8.6, 11.6) * sc; p.vx = rnd(-1, 1) * sc; p.max = p.life = 200; p.color = '#ffe7b0'; p.size = 2.4; parts.push(p)
    }
    const explode = (x: number, y: number) => {
      const base = pick(); const alt = pick(); const ring = Math.random() < 0.35; const n = ring ? 54 : rnd(70, 100)
      for (let i = 0; i < n; i++) {
        const a = ring ? (i / n) * Math.PI * 2 : Math.random() * Math.PI * 2
        const sp = (ring ? 4.6 : rnd(1.2, 5.8)) * sc
        const p = blank(); p.x = x; p.y = y; p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp
        p.max = p.life = rnd(60, 105); p.color = Math.random() < 0.25 ? alt : base; p.size = rnd(1.6, 3); parts.push(p)
      }
    }
    const confetti = (x: number, y: number, vx: number, vy: number, rain = false) => {
      const p = blank(); p.kind = 1; p.x = x; p.y = y; p.vx = vx * sc; p.vy = vy * sc; p.w = rnd(6, 10) * sc + 2; p.h = rnd(10, 16) * sc + 2
      p.rot = rnd(0, 6.28); p.vr = rnd(-0.22, 0.22); p.max = p.life = rain ? 520 : 460; p.color = pick(); parts.push(p)
    }

    const t0 = performance.now(); let last = t0
    let nextRocket = t0 + 300; let raf = 0
    if (celebrate) {
      for (let i = 0; i < 90; i++) confetti(rnd(0, W), rnd(-H * 0.7, -20), rnd(-1, 1), rnd(1.6, 3.4), true)
      for (let i = 0; i < 70; i++) { confetti(0, H, rnd(3, 9), -rnd(13, 23)); confetti(W, H, -rnd(3, 9), -rnd(13, 23)) }
    }

    const loop = (t: number) => {
      const dt = Math.min(2.5, (t - last) / 16.667); last = t
      const calm = !celebrate || t - t0 > BURST_MS
      if (t >= nextRocket && parts.length < 900) {
        rocket(); if (!calm && Math.random() < 0.5) rocket()
        nextRocket = t + (calm ? rnd(2400, 4200) : rnd(260, 620))
      }
      c.clearRect(0, 0, W, H)
      c.globalCompositeOperation = 'lighter'
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]
        p.life -= dt
        if (p.kind === 2) {
          p.vy += 0.12 * sc * dt; p.x += p.vx * dt; p.y += p.vy * dt
          c.globalAlpha = 0.9; c.strokeStyle = p.color; c.lineWidth = p.size; c.lineCap = 'round'
          c.beginPath(); c.moveTo(p.x - p.vx * 4, p.y - p.vy * 4); c.lineTo(p.x, p.y); c.stroke()
          if (p.vy > -1.2 * sc || p.life <= 0) { explode(p.x, p.y); parts.splice(i, 1) }
        } else if (p.kind === 0) {
          p.vx *= Math.pow(0.985, dt); p.vy = p.vy * Math.pow(0.985, dt) + 0.045 * sc * dt
          p.x += p.vx * dt; p.y += p.vy * dt
          if (p.life <= 0) { parts.splice(i, 1); continue }
          c.globalAlpha = Math.min(1, p.life / 40); c.strokeStyle = p.color; c.lineWidth = p.size; c.lineCap = 'round'
          c.beginPath(); c.moveTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4); c.lineTo(p.x, p.y); c.stroke()
        } else {
          p.vx *= Math.pow(0.97, dt); p.vy = p.vy * Math.pow(0.955, dt) + 0.12 * sc * dt
          p.x += (p.vx + Math.sin((t + p.y * 3) / 260) * 0.7) * dt; p.y += p.vy * dt; p.rot += p.vr * dt
          if (p.life <= 0 || p.y > H + 30) { parts.splice(i, 1); continue }
          c.globalCompositeOperation = 'source-over'
          c.globalAlpha = Math.min(1, p.life / 40)
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.rot * 1.7)); c.fillStyle = p.color; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore()
          c.globalCompositeOperation = 'lighter'
        }
      }
      c.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [celebrate])
  return <canvas ref={ref} className="fx" aria-hidden />
}

/** End-of-hackathon show: white flash, shockwaves, "Time's up" headline, then fireworks that keep going. */
export default function Finale({ celebrate }: { celebrate: boolean }) {
  const [splash, setSplash] = useState(celebrate)
  useEffect(() => {
    if (!celebrate) return
    const id = setTimeout(() => setSplash(false), 7600)
    return () => clearTimeout(id)
  }, [celebrate])
  const headline = 'Time’s up'
  return (
    <>
      <Fireworks celebrate={celebrate} />
      {celebrate && splash && (
        <>
          <div className="flash" aria-hidden />
          <div className="splash" role="alert">
            <div className="ring" aria-hidden /><div className="ring" aria-hidden /><div className="ring" aria-hidden />
            <div className="splash-inner">
              <h1 aria-label={headline}>
                {headline.split('').map((ch, i) => (
                  <span key={i} aria-hidden style={{ animationDelay: `${0.25 + i * 0.07}s` }}>{ch === ' ' ? ' ' : ch}</span>
                ))}
              </h1>
              <p>Hack The Origin 2026 is complete.</p>
              <small>Hands off the keyboards. Thank you, builders.</small>
            </div>
          </div>
        </>
      )}
    </>
  )
}
