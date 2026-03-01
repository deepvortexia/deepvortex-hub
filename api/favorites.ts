import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = authHeader.replace('Bearer ', '')

  // Verify JWT with anon key
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey)
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)

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
      console.error('Error fetching favorites:', error)
      return res.status(500).json({ error: 'Failed to fetch favorites' })
    }

    return res.status(200).json({ favorites: data || [] })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch favorites' })
  }
}
