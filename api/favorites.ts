import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

// Support both VITE_-prefixed (Vite build) and plain names (server-only vars)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[favorites] Request:', req.method)
  console.log('[favorites] Env check:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
  })

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[favorites] Missing Supabase env vars — set SUPABASE_URL and SUPABASE_ANON_KEY (or VITE_ prefixed) in Vercel')
    return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.replace('Bearer ', '')

  // Verify JWT with anon key
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

  console.log('[favorites] Auth result:', { userId: user?.id, hasError: !!authError, errorMsg: authError?.message })

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid authentication token' })
  }

  // Query with service role to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey)

  try {
    const { data, error } = await supabase
      .from('images')
      .select('id, prompt, image_url, aspect_ratio, created_at')
      .eq('user_id', user.id)
      .eq('is_favorite', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[favorites] DB error:', error)
      return res.status(500).json({ error: 'Failed to fetch favorites', detail: error.message })
    }

    console.log('[favorites] Success — returned', data?.length ?? 0, 'items')
    return res.status(200).json({ favorites: data || [] })
  } catch (err: any) {
    console.error('[favorites] Unexpected error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch favorites' })
  }
}
