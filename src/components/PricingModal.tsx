import { useState } from 'react'
import './PricingRedirectModal.css'
import { supabase } from '../lib/supabase'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PricingPack {
  name: string
  credits: number
  price: number
  popular?: boolean
}

const pricingPacks: PricingPack[] = [
  { name: 'Starter', credits: 10, price: 4.99 },
  { name: 'Basic', credits: 30, price: 9.99 },
  { name: 'Popular', credits: 75, price: 19.99, popular: true },
  { name: 'Pro', credits: 200, price: 49.99 },
  { name: 'Ultimate', credits: 500, price: 99.99 },
]

const PricingModal = ({ isOpen, onClose }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handlePurchase = async (pack: PricingPack) => {
    if (!supabase) {
      setError('Authentication not available')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Refresh session token
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      const session = refreshData?.session || (await supabase.auth.getSession()).data.session

      if (!session) {
        const errorMsg = refreshError 
          ? 'Session refresh failed. Please sign in again.' 
          : 'Please sign in to purchase credits'
        setError(errorMsg)
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ packName: pack.name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="pricing-modal-overlay" onClick={onClose}>
      <div className="pricing-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="pricing-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="pricing-modal-header">
          <h2>Choose Your Credit Pack</h2>
          <p>Purchase credits to use across all Deep Vortex AI tools</p>
        </div>

        <div className="pricing-packs-grid">
          {pricingPacks.map((pack) => (
            <div
              key={pack.name}
              className={`pricing-pack-card ${pack.popular ? 'pack-popular' : ''}`}
            >
              {pack.popular && <div className="popular-badge">Most Popular</div>}
              <h3 className="pack-name">{pack.name}</h3>
              <div className="pack-credits">{pack.credits} Credits</div>
              <div className="pack-price">${pack.price.toFixed(2)}</div>
              <div className="pack-perunit">
                ${(pack.price / pack.credits).toFixed(3)} per credit
              </div>
              <button
                className="pack-purchase-btn"
                onClick={() => handlePurchase(pack)}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="pricing-error" style={{
            color: '#ff4444',
            textAlign: 'center',
            padding: '0.75rem',
            marginTop: '1rem',
            background: 'rgba(255, 68, 68, 0.1)',
            borderRadius: '8px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <div className="pricing-modal-footer">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="footer-note">Credits are shared across all Deep Vortex AI tools</p>
        </div>
      </div>
    </div>
  )
}

export default PricingModal
