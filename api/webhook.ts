import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// CRITICAL: disable body parsing so Stripe signature verification works
export const config = {
  api: { bodyParser: false },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

async function readRawBody(readable: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('[webhook] Received POST')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[webhook] Missing env vars:', {
      hasWebhookSecret: !!webhookSecret,
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceRoleKey,
    })
    return res.status(500).json({ error: 'Server configuration error' })
  }

  let event: Stripe.Event

  try {
    const rawBody = await readRawBody(req as any)
    const signature = req.headers['stripe-signature'] as string
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    console.log('[webhook] Signature verified. Event:', event.type)
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const app = session.metadata?.app
    const userId = session.metadata?.userId
    const credits = session.metadata?.credits
    const packName = session.metadata?.packName

    console.log(`[webhook] Processing payment from app: '${app || 'unknown'}'`, {
      sessionId: session.id,
      userId,
      credits,
      packName,
    })

    if (!userId || !credits) {
      console.error('[webhook] Missing metadata — userId or credits absent')
      return res.status(400).json({ error: 'Missing session metadata' })
    }

    const creditsToAdd = parseInt(credits, 10)

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Fetch current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('[webhook] Profile fetch error:', fetchError)
      return res.status(404).json({ error: 'User not found' })
    }

    const currentCredits = profile?.credits || 0
    const newCredits = currentCredits + creditsToAdd

    console.log('[webhook] Updating credits:', { currentCredits, adding: creditsToAdd, newTotal: newCredits })

    // Update credits
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ credits: newCredits, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (updateError) {
      console.error('[webhook] Update error:', updateError)
      return res.status(500).json({ error: 'Failed to update credits' })
    }

    console.log(`[webhook] ✅ Credits updated (from ${app || 'unknown'})`, { userId, newCredits })

    // Record transaction (non-critical)
    try {
      await supabase.from('transactions').insert({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
        pack_name: packName || 'Unknown',
        amount_cents: session.amount_total || 0,
        credits_purchased: creditsToAdd,
        status: 'completed',
      })
      console.log('[webhook] Transaction recorded')
    } catch (txErr) {
      console.warn('[webhook] Transaction record failed (non-critical):', txErr)
    }

    return res.status(200).json({ received: true, creditsAdded: creditsToAdd })
  }

  return res.status(200).json({ received: true })
}
