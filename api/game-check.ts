import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const COOLDOWN_MS = 12 * 60 * 60 * 1000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'Authentication required' })
  const token = authHeader.replace('Bearer ', '')

  // Verify JWT
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' })

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // ── GET: check cooldown ──
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('last_game_played_at, credits')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('[game-check] GET error:', error)
        return res.status(500).json({ error: error.message })
      }

      const last: string | null = data?.last_game_played_at ?? null
      if (last && Date.now() - new Date(last).getTime() < COOLDOWN_MS) {
        const nextPlayAt = new Date(new Date(last).getTime() + COOLDOWN_MS).toISOString()
        return res.status(200).json({ canPlay: false, nextPlayAt })
      }

      return res.status(200).json({ canPlay: true, nextPlayAt: null })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  // ── POST: save result ──
  if (req.method === 'POST') {
    const { earned } = req.body as { earned: number }
    if (typeof earned !== 'number' || earned < 0 || earned > 3) {
      return res.status(400).json({ error: 'Invalid earned value' })
    }

    try {
      const { data, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('last_game_played_at, credits')
        .eq('id', user.id)
        .single()

      if (fetchError) return res.status(500).json({ error: fetchError.message })

      // Double-check cooldown server-side to prevent replay
      const last: string | null = data?.last_game_played_at ?? null
      if (last && Date.now() - new Date(last).getTime() < COOLDOWN_MS) {
        return res.status(403).json({ error: 'Still on cooldown' })
      }

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          credits: (data?.credits ?? 0) + earned,
          last_game_played_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) return res.status(500).json({ error: updateError.message })

      return res.status(200).json({ ok: true })
    } catch (err: any) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
