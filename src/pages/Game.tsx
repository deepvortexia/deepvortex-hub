import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const GAME_DURATION = 10

function getCreditsEarned(score: number): number {
  if (score >= 61) return 3
  if (score >= 41) return 2
  if (score >= 21) return 1
  return 0
}


function formatCountdown(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h}h ${m.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`
}

// 'loading'  = Supabase check in progress — show nothing interactive
// 'cooldown' = within 12h window — show countdown
// 'idle'     = ready to play
// 'playing'  = game in progress
// 'saving'   = game ended, writing to Supabase
// 'finished' = save complete, show result
type GameState = 'loading' | 'cooldown' | 'idle' | 'playing' | 'saving' | 'finished'

const S = {
  page: {
    minHeight: '100vh', background: '#0a0a0a', color: '#fff',
    fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative' as const,
  },
  back: {
    position: 'absolute' as const, top: '1.25rem', left: '1.5rem',
    background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
    color: '#D4AF37', borderRadius: '8px', padding: '0.4rem 1rem',
    fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none',
  },
  title: {
    fontFamily: "'Orbitron', sans-serif", fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 900,
    background: 'linear-gradient(135deg, #E8C87C 0%, #D4AF37 50%, #B8960C 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    textAlign: 'center' as const, marginBottom: '0.5rem', letterSpacing: '2px',
  },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: '1rem', textAlign: 'center' as const, marginBottom: '2rem' },
  ctaBtn: {
    display: 'inline-block', padding: '0.75rem 2rem',
    background: 'linear-gradient(135deg, #B8860B, #D4AF37)',
    color: '#0a0a0a', borderRadius: '50px', fontWeight: 700,
    fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.5px',
  },
}

export function Game() {
  const { user, refreshProfile } = useAuth()
  const [gameState, setGameState] = useState<GameState>('loading')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [creditsEarned, setCreditsEarned] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const scoreRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Step 1: On mount, fetch last_game_played_at and gate access ──
  useEffect(() => {
    if (!user || !supabase) {
      setGameState('idle')
      return
    }
    ;(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('last_game_played_at, credits')
        .eq('id', user.id)
        .single()

      if (error) { setGameState('idle'); return }

      const last = data?.last_game_played_at
      if (last) {
        const diff = Date.now() - new Date(last).getTime()
        if (diff < 12 * 60 * 60 * 1000) {
          const next = new Date(new Date(last).getTime() + 12 * 60 * 60 * 1000)
          setCountdown(Math.max(0, Math.floor((next.getTime() - Date.now()) / 1000)))
          setGameState('cooldown')
          return
        }
      }
      setGameState('idle')
    })()
  }, [user])

  // ── Countdown tick ──
  useEffect(() => {
    if (gameState !== 'cooldown') return
    countdownRef.current = setInterval(() => {
      setCountdown(s => {
        if (s <= 1) {
          clearInterval(countdownRef.current!)
          setGameState('idle')
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current!)
  }, [gameState])

  // ── Step 4: Save result THEN show finished ──
  const saveResult = useCallback(async (finalScore: number) => {
    if (!supabase || !user) { setGameState('finished'); return }
    setGameState('saving')
    const earned = getCreditsEarned(finalScore)
    setCreditsEarned(earned)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('last_game_played_at, credits')
        .eq('id', user.id)
        .single()
      await supabase
        .from('profiles')
        .update({
          credits: (data?.credits ?? 0) + earned,
          last_game_played_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      await refreshProfile()
    } catch (e) {
      console.error('Game save failed:', e)
    }
    setGameState('finished')
  }, [user, refreshProfile])

  const startGame = useCallback(() => {
    scoreRef.current = 0
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setGameState('playing')
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          saveResult(scoreRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)
  }, [saveResult])

  const handleClick = useCallback(() => {
    if (gameState !== 'playing') return
    scoreRef.current += 1
    setScore(s => s + 1)
  }, [gameState])

  // ── Not signed in ──
  if (!user) return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
      <h1 style={S.title}>Vortex Clicker</h1>
      <p style={S.sub}>Sign in to play and earn free credits</p>
      <a href="/" style={S.ctaBtn}>Sign In at Hub →</a>
    </div>
  )

  // ── Checking Supabase ──
  if (gameState === 'loading') return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <div style={{ color: '#D4AF37', fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px' }}>Checking eligibility...</div>
    </div>
  )

  // ── On cooldown ──
  if (gameState === 'cooldown') return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <h1 style={S.title}>On Cooldown</h1>
      <p style={S.sub}>You can play again in:</p>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', color: '#D4AF37', fontWeight: 900, letterSpacing: '3px' }}>
        {formatCountdown(countdown)}
      </div>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.82rem', marginTop: '0.75rem' }}>next game available in 12h</p>
      <a href="/" style={{ ...S.ctaBtn, marginTop: '2.5rem' }}>Back to Hub →</a>
    </div>
  )

  // ── Saving to Supabase ──
  if (gameState === 'saving') return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <div style={{ color: '#D4AF37', fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px' }}>Saving result...</div>
    </div>
  )

  // ── Result screen ──
  if (gameState === 'finished') return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
        {creditsEarned >= 3 ? '🏆' : creditsEarned >= 2 ? '🥈' : creditsEarned >= 1 ? '🥉' : '💪'}
      </div>
      <h1 style={S.title}>Game Over!</h1>
      <p style={S.sub}>You clicked <strong style={{ color: '#D4AF37' }}>{score} times</strong> in {GAME_DURATION}s</p>
      <div style={{
        background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.4)',
        borderRadius: '20px', padding: '2rem 3rem', textAlign: 'center', marginBottom: '2rem',
      }}>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', marginBottom: '0.5rem' }}>CREDITS EARNED</div>
        <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '4rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>+{creditsEarned}</div>
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', textAlign: 'center', lineHeight: 2, marginBottom: '2rem' }}>
        <div>0–20 clicks = 0 credits &nbsp;·&nbsp; 21–40 = 1 credit</div>
        <div>41–60 clicks = 2 credits &nbsp;·&nbsp; 61+ = 3 credits</div>
      </div>
      <a href="/" style={S.ctaBtn}>Back to Hub →</a>
    </div>
  )

  // ── Idle / Playing ──
  return (
    <div style={S.page}>
      <a href="/" style={S.back}>← Back to Hub</a>
      <h1 style={S.title}>Vortex Clicker</h1>
      <p style={S.sub}>Click the vortex as fast as you can!</p>

      <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: '#D4AF37', lineHeight: 1 }}>{score}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '1px', marginTop: '0.25rem' }}>CLICKS</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '2.5rem', fontWeight: 900, color: timeLeft <= 3 ? '#ff4444' : '#D4AF37', lineHeight: 1 }}>{timeLeft}s</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '1px', marginTop: '0.25rem' }}>TIME</div>
        </div>
      </div>

      <button
        onClick={gameState === 'idle' ? startGame : handleClick}
        className={gameState === 'playing' ? 'vortex-btn vortex-btn--active' : 'vortex-btn'}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {gameState === 'idle' ? 'TAP TO\nPLAY' : score}
      </button>

      {gameState === 'idle' && (
        <div style={{ marginTop: '2.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', lineHeight: 1.8 }}>
          <div>Tap the vortex to start — 10 seconds on the clock!</div>
          <div style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.3)' }}>21+ clicks = 1 credit · 41+ = 2 · 61+ = 3</div>
        </div>
      )}
    </div>
  )
}
