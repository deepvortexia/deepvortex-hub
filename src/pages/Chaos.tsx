// src/pages/Chaos.tsx — Fragment Destruction Game
import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 'playing' | 'win' | 'lose'

interface Shard {
  id: number
  x: number; y: number
  vx: number; vy: number
  rot: number; rotV: number
  r: number
  color: string; glow: string
  pts: { x: number; y: number }[]
  pulled: boolean
}

interface Spark {
  x: number; y: number
  vx: number; vy: number
  life: number
  color: string
  sz: number
}

interface GS {
  shards: Shard[]
  sparks: Spark[]
  vAngle: number
  timeLeft: number
  regenAcc: number   // counts down seconds until next regen
  splitAcc: number   // counts down seconds until next split
  elapsed: number    // total elapsed seconds (fractional)
  prevSecFloor: number
  shake: number
  phase: Phase
  raf: number
  W: number; H: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let uid = 0

const PALETTE = [
  { c: '#a855f7', g: '#7c3aed' },
  { c: '#c084fc', g: '#9333ea' },
  { c: '#e9d5ff', g: '#a855f7' },
  { c: '#f5f3ff', g: '#c084fc' },
  { c: '#ddd6fe', g: '#6d28d9' },
  { c: '#7c3aed', g: '#4c1d95' },
]

function makeShard(x: number, y: number, r = 16 + Math.random() * 20): Shard {
  const n = 5 + Math.floor(Math.random() * 4)
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
    const len = r * (0.5 + Math.random() * 0.65)
    return { x: Math.cos(a) * len, y: Math.sin(a) * len }
  })
  const col = PALETTE[Math.floor(Math.random() * PALETTE.length)]
  return {
    id: uid++,
    x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.05,
    r, color: col.c, glow: col.g,
    pts, pulled: false,
  }
}

function scatter(n: number, W: number, H: number): Shard[] {
  const cx = W / 2, cy = H / 2
  const out: Shard[] = []
  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, tries = 0
    do {
      x = 55 + Math.random() * (W - 110)
      y = 55 + Math.random() * (H - 110)
      tries++
    } while (Math.hypot(x - cx, y - cy) < 140 && tries < 40)
    out.push(makeShard(x, y))
  }
  return out
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Chaos() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gsRef    = useRef<GS | null>(null)
  const [phase,     setPhase]     = useState<Phase>('playing')
  const [timeLeft,  setTimeLeft]  = useState(60)
  const [fragCount, setFragCount] = useState(20)

  // ── Start / Restart ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Cancel previous loop
    if (gsRef.current) cancelAnimationFrame(gsRef.current.raf)

    const W = canvas.width, H = canvas.height
    const g: GS = {
      shards: scatter(20, W, H),
      sparks: [],
      vAngle: 0,
      timeLeft: 60,
      regenAcc: 8,
      splitAcc: 15,
      elapsed: 0,
      prevSecFloor: 0,
      shake: 0,
      phase: 'playing',
      raf: 0,
      W, H,
    }
    gsRef.current = g

    setPhase('playing')
    setTimeLeft(60)
    setFragCount(20)

    const ctx = canvas.getContext('2d')!
    const cx = W / 2, cy = H / 2

    // ── Particles ────────────────────────────────────────────────────────────
    function boom(x: number, y: number, color: string) {
      for (let i = 0; i < 22; i++) {
        const a = Math.random() * Math.PI * 2
        const spd = 2.5 + Math.random() * 6.5
        g.sparks.push({
          x, y,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          life: 1,
          color,
          sz: 2 + Math.random() * 4.5,
        })
      }
    }

    // ── Draw helpers ─────────────────────────────────────────────────────────
    function drawVortex(t: number) {
      g.vAngle += 0.028

      // Outer nebula glow
      const og = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90)
      og.addColorStop(0,   'rgba(88,28,135,0.6)')
      og.addColorStop(0.5, 'rgba(55,7,90,0.32)')
      og.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = og
      ctx.beginPath(); ctx.arc(cx, cy, 90, 0, Math.PI * 2); ctx.fill()

      // Spinning dashed rings
      for (let ri = 0; ri < 6; ri++) {
        const r = 12 + ri * 13
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(g.vAngle * (ri % 2 === 0 ? 1 : -1.4) + ri * 0.9)
        ctx.strokeStyle = `rgba(168,85,247,${0.10 + ri * 0.07})`
        ctx.lineWidth = 0.8 + ri * 0.25
        ctx.setLineDash([4 + ri * 2, 8 - ri])
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()
      }

      // Core radial gradient
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22)
      cg.addColorStop(0,   'rgba(255,255,255,0.98)')
      cg.addColorStop(0.25,'rgba(233,213,255,0.92)')
      cg.addColorStop(0.6, 'rgba(124,58,237,0.75)')
      cg.addColorStop(1,   'rgba(76,29,149,0)')
      ctx.fillStyle = cg
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill()

      // Pulse ring
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.5)
      ctx.strokeStyle = `rgba(192,132,252,${0.38 * pulse})`
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, 26 + pulse * 9, 0, Math.PI * 2); ctx.stroke()
    }

    function drawShard(s: Shard, t: number) {
      ctx.save()
      ctx.translate(s.x, s.y)
      ctx.rotate(s.rot)
      const pulse = 0.75 + 0.25 * Math.sin(t * 1.8 + s.id * 0.9)
      ctx.shadowColor = s.glow
      ctx.shadowBlur  = 14 * pulse
      ctx.fillStyle   = s.color
      ctx.beginPath()
      ctx.moveTo(s.pts[0].x, s.pts[0].y)
      for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i].x, s.pts[i].y)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth   = 0.8
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.restore()
    }

    function drawSparks() {
      for (const p of g.sparks) {
        ctx.save()
        ctx.globalAlpha  = p.life
        ctx.fillStyle    = p.color
        ctx.shadowColor  = p.color
        ctx.shadowBlur   = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.sz * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur  = 0
        ctx.globalAlpha = 1
        ctx.restore()
      }
    }

    // ── Main Loop ─────────────────────────────────────────────────────────────
    let prevTs = 0
    function loop(ts: number) {
      if (g.phase !== 'playing') return

      const dt = Math.min((ts - (prevTs || ts)) / 1000, 0.05)
      prevTs = ts
      const t = ts / 1000

      // ── Per-second ticks ──────────────────────────────────────────────────
      g.elapsed += dt
      const newSecFloor = Math.floor(g.elapsed)
      const ticks = newSecFloor - g.prevSecFloor
      if (ticks > 0) {
        g.prevSecFloor = newSecFloor

        for (let tick = 0; tick < ticks; tick++) {
          if (g.timeLeft > 0) g.timeLeft--
          g.regenAcc--
          g.splitAcc--
        }
        setTimeLeft(g.timeLeft)

        // Regen: add 5 new shards
        if (g.regenAcc <= 0) {
          g.shards.push(...scatter(5, W, H))
          g.regenAcc = 8
          setFragCount(g.shards.length)
        }

        // Split: each free shard spawns a child
        if (g.splitAcc <= 0) {
          const children: Shard[] = []
          for (const s of g.shards) {
            if (!s.pulled) {
              children.push(makeShard(
                s.x + (Math.random() - 0.5) * s.r * 2,
                s.y + (Math.random() - 0.5) * s.r * 2,
                s.r * 0.6,
              ))
            }
          }
          g.shards.push(...children)
          g.splitAcc = 15
          setFragCount(g.shards.length)
        }
      }

      // ── Physics update ────────────────────────────────────────────────────
      for (let i = g.shards.length - 1; i >= 0; i--) {
        const s = g.shards[i]
        s.rot += s.rotV

        if (s.pulled) {
          // Pull toward vortex
          const dx = cx - s.x, dy = cy - s.y
          const dist = Math.hypot(dx, dy)
          if (dist < 18) {
            boom(s.x, s.y, s.color)
            g.shards.splice(i, 1)
            g.shake = 0.4
            setFragCount(g.shards.length)
            continue
          }
          const spd = 4.5 + (110 - Math.min(dist, 110)) * 0.12
          s.vx = (dx / dist) * spd
          s.vy = (dy / dist) * spd
        } else {
          // Drift away from vortex
          const dx = s.x - cx, dy = s.y - cy
          const dist = Math.max(Math.hypot(dx, dy), 1)
          if (dist < 230) {
            const f = 0.038 * (230 - dist) / 230
            s.vx += (dx / dist) * f
            s.vy += (dy / dist) * f
          }
          // Soft friction
          s.vx *= 0.994
          s.vy *= 0.994
          // Wall bounce
          if (s.x < s.r)     { s.x = s.r;     s.vx =  Math.abs(s.vx) }
          if (s.x > W - s.r) { s.x = W - s.r; s.vx = -Math.abs(s.vx) }
          if (s.y < s.r)     { s.y = s.r;     s.vy =  Math.abs(s.vy) }
          if (s.y > H - s.r) { s.y = H - s.r; s.vy = -Math.abs(s.vy) }
        }
        s.x += s.vx
        s.y += s.vy
      }

      // Update sparks
      for (let i = g.sparks.length - 1; i >= 0; i--) {
        const p = g.sparks[i]
        p.x  += p.vx; p.y  += p.vy
        p.vx *= 0.91; p.vy *= 0.91
        p.life -= dt * 1.6
        if (p.life <= 0) g.sparks.splice(i, 1)
      }

      // ── Win / Lose ────────────────────────────────────────────────────────
      if (g.shards.length === 0 && g.timeLeft > 0) {
        g.phase = 'win'; setPhase('win'); return
      }
      if (g.timeLeft <= 0 && g.shards.length > 0) {
        g.phase = 'lose'; setPhase('lose'); return
      }

      // ── Screen shake offset ───────────────────────────────────────────────
      let sx = 0, sy = 0
      if (g.shake > 0) {
        sx = (Math.random() - 0.5) * g.shake * 20
        sy = (Math.random() - 0.5) * g.shake * 20
        g.shake = Math.max(0, g.shake - dt * 3.5)
      }

      // ── Render ────────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.translate(sx, sy)

      // Pure black background (slightly oversize to hide shake edges)
      ctx.fillStyle = '#000'
      ctx.fillRect(-25, -25, W + 50, H + 50)

      // Vignette
      const vig = ctx.createRadialGradient(cx, cy, H * 0.12, cx, cy, H * 0.78)
      vig.addColorStop(0, 'rgba(15,0,30,0)')
      vig.addColorStop(1, 'rgba(0,0,0,0.72)')
      ctx.fillStyle = vig
      ctx.fillRect(-25, -25, W + 50, H + 50)

      drawVortex(t)

      // Free shards (drawn first / behind)
      for (const s of g.shards) { if (!s.pulled) drawShard(s, t) }
      // Pulled shards (drawn on top)
      for (const s of g.shards) { if (s.pulled)  drawShard(s, t) }

      drawSparks()
      ctx.restore()

      g.raf = requestAnimationFrame(loop)
    }

    g.raf = requestAnimationFrame(loop)
  }, [])

  // ── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = Math.min(window.innerWidth - 32, 820)
    canvas.height = Math.min(window.innerHeight * 0.68, 560)
    start()
    return () => { if (gsRef.current) cancelAnimationFrame(gsRef.current.raf) }
  }, [start])

  // ── Click / Touch handler ─────────────────────────────────────────────────
  const handlePointer = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const g = gsRef.current
    if (!g || g.phase !== 'playing') return
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    let px: number, py: number
    if ('touches' in e) {
      if (e.touches.length === 0) return
      px = (e.touches[0].clientX - rect.left) * scaleX
      py = (e.touches[0].clientY - rect.top)  * scaleY
    } else {
      px = (e.clientX - rect.left) * scaleX
      py = (e.clientY - rect.top)  * scaleY
    }
    // Find closest unpulled shard within hit radius
    let best: Shard | null = null, bestD = Infinity
    for (const s of g.shards) {
      if (s.pulled) continue
      const d = Math.hypot(s.x - px, s.y - py)
      if (d < s.r + 12 && d < bestD) { best = s; bestD = d }
    }
    if (best) best.pulled = true
  }, [])

  // ── Retry ─────────────────────────────────────────────────────────────────
  const retry = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (gsRef.current) cancelAnimationFrame(gsRef.current.raf)
    start()
  }, [start])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Orbitron', sans-serif",
      position: 'relative', overflow: 'hidden',
      padding: '1rem',
    }}>

      {/* Back link */}
      <a href="/" style={{
        position: 'absolute', top: '1.1rem', left: '1.4rem',
        color: 'rgba(168,85,247,0.65)', fontSize: '0.78rem',
        textDecoration: 'none', letterSpacing: '1.5px', zIndex: 10,
      }}>← HUB</a>

      {/* HUD */}
      {phase === 'playing' && (
        <div style={{ display: 'flex', gap: '3.5rem', marginBottom: '0.7rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem', fontWeight: 900, lineHeight: 1,
              color: '#a855f7', textShadow: '0 0 12px rgba(168,85,247,0.6)',
            }}>{fragCount}</div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(168,85,247,0.45)', letterSpacing: '2.5px', marginTop: '3px' }}>SHARDS</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '2rem', fontWeight: 900, lineHeight: 1,
              color: timeLeft <= 15 ? '#ef4444' : '#a855f7',
              textShadow: timeLeft <= 15 ? '0 0 16px rgba(239,68,68,0.8)' : '0 0 12px rgba(168,85,247,0.6)',
              transition: 'color 0.3s, text-shadow 0.3s',
            }}>{timeLeft}s</div>
            <div style={{ fontSize: '0.58rem', color: 'rgba(168,85,247,0.45)', letterSpacing: '2.5px', marginTop: '3px' }}>TIME</div>
          </div>
        </div>
      )}

      {/* Canvas + overlays */}
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          onClick={handlePointer}
          onTouchStart={handlePointer}
          style={{
            display: 'block', maxWidth: '100vw',
            borderRadius: '10px',
            cursor: phase === 'playing' ? 'crosshair' : 'default',
            boxShadow: '0 0 60px rgba(88,28,135,0.25)',
          }}
        />

        {/* ── WIN overlay ─────────────────────────────────────────────────── */}
        {phase === 'win' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.87)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: '10px', gap: '0',
          }}>
            <div style={{
              fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 900,
              color: '#a855f7', letterSpacing: '4px',
              textShadow: '0 0 50px rgba(168,85,247,0.9), 0 0 20px rgba(168,85,247,0.6)',
              marginBottom: '0.4rem',
            }}>ORDER RESTORED</div>
            <div style={{ fontSize: '0.85rem', color: 'rgba(216,180,254,0.65)', letterSpacing: '2px', marginBottom: '1.8rem' }}>
              All fragments consumed by the vortex
            </div>
            <div style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.35)',
              borderRadius: '12px', padding: '1.1rem 2.5rem',
              textAlign: 'center', marginBottom: '1.8rem',
            }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(216,180,254,0.45)', letterSpacing: '3px', marginBottom: '0.4rem' }}>REWARD</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#c084fc', lineHeight: 1 }}>+2 credits</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(216,180,254,0.35)', marginTop: '0.4rem', letterSpacing: '1px' }}>coming soon</div>
            </div>
            <button onClick={retry} style={{
              background: 'linear-gradient(135deg,#6d28d9,#a855f7)',
              border: 'none', color: '#fff',
              padding: '0.65rem 2rem', borderRadius: '8px',
              fontSize: '0.8rem', fontFamily: "'Orbitron',sans-serif",
              fontWeight: 700, letterSpacing: '2px', cursor: 'pointer',
            }}>PLAY AGAIN</button>
          </div>
        )}

        {/* ── LOSE overlay ────────────────────────────────────────────────── */}
        {phase === 'lose' && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: '10px',
          }}>
            <div style={{
              fontSize: 'clamp(2rem,6vw,3.5rem)', fontWeight: 900,
              color: '#ef4444', letterSpacing: '5px',
              textShadow: '0 0 60px rgba(239,68,68,0.9), 0 0 25px rgba(239,68,68,0.6)',
              marginBottom: '0.5rem',
              animation: 'chaospulse 1.1s ease-in-out infinite',
            }}>CHAOS WINS</div>
            <div style={{ fontSize: '0.88rem', color: 'rgba(252,165,165,0.6)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
              The fragments survived
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(252,165,165,0.35)', letterSpacing: '1.5px', marginBottom: '2.5rem' }}>
              {fragCount} shard{fragCount !== 1 ? 's' : ''} remain{fragCount === 1 ? 's' : ''}
            </div>
            <button onClick={retry} style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.45)',
              color: '#ef4444', padding: '0.65rem 2rem',
              borderRadius: '8px', fontSize: '0.8rem',
              fontFamily: "'Orbitron',sans-serif",
              fontWeight: 700, letterSpacing: '2px', cursor: 'pointer',
            }}>TRY AGAIN</button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {phase === 'playing' && (
        <div style={{
          marginTop: '0.7rem', color: 'rgba(168,85,247,0.35)',
          fontSize: '0.62rem', letterSpacing: '2px', textAlign: 'center',
        }}>
          CLICK SHARDS → PULLED INTO VORTEX → DESTROY ALL BEFORE TIME RUNS OUT
        </div>
      )}

      <style>{`
        @keyframes chaospulse {
          0%,100% { opacity:1; transform:scale(1) }
          50%      { opacity:0.65; transform:scale(0.97) }
        }
      `}</style>
    </div>
  )
}
