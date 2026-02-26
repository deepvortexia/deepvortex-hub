import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
)

// Price validation - matches the pricing in PricingModal
const VALID_PACKS = {
  'Starter': { credits: 10, price: 349 },
  'Basic': { credits: 30, price: 799 },
  'Popular': { credits: 75, price: 1699 },
  'Pro': { credits: 200, price: 3999 },
  'Ultimate': { credits: 500, price: 8499 },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { packName, credits, amountCents } = req.body

  if (!packName || !credits || !amountCents) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const validPack = VALID_PACKS[packName as keyof typeof VALID_PACKS]
  if (!validPack) {
    return res.status(400).json({ error: 'Invalid pack name' })
  }

  if (validPack.credits !== credits || validPack.price !== amountCents) {
    return res.status(400).json({ error: 'Invalid pack configuration' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const token = authHeader.replace('Bearer ', '')
    let { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return res.status(401).json({ 
        error: 'Authentication expired. Please try again.',
        code: 'TOKEN_EXPIRED'
      })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${packName} Pack - ${credits} Credits`,
              description: `Purchase ${credits} credits for Deep Vortex AI tools`,
              images: ['https://em-content.zobj.net/source/apple/391/artist-palette_1f3a8.png'],
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://deepvortexai.art'}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://deepvortexai.art'}`,
      metadata: {
        packName,
        credits: credits.toString(),
        userId: user.id,
        app: 'hub',
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return res.status(500).json({
      error: error.message || 'Failed to create checkout session',
    })
  }
}
