import './PricingRedirectModal.css'

interface PricingRedirectModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PricingPack {
  name: string
  credits: number
  price: string
  popular?: boolean
}

const PricingRedirectModal = ({ isOpen, onClose }: PricingRedirectModalProps) => {
  if (!isOpen) return null

  const pricingPacks: PricingPack[] = [
    { name: 'Starter', credits: 10, price: '$3.49' },
    { name: 'Basic', credits: 30, price: '$7.99' },
    { name: 'Popular', credits: 75, price: '$16.99', popular: true },
    { name: 'Pro', credits: 200, price: '$39.99' },
    { name: 'Ultimate', credits: 500, price: '$84.99' },
  ]

  const handlePurchase = (packName: string) => {
    const imageGenUrl = `https://images.deepvortexai.art?buy=${packName}`
    window.location.assign(imageGenUrl)
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
              <div className="pack-price">{pack.price}</div>
              <button
                className="pack-purchase-btn"
                onClick={() => handlePurchase(pack.name)}
              >
                Purchase
              </button>
            </div>
          ))}
        </div>

        <div className="pricing-modal-footer">
          <p>You'll be redirected to our image generator to complete the purchase</p>
          <p className="footer-note">Credits are shared across all Deep Vortex AI tools</p>
        </div>
      </div>
    </div>
  )
}

export default PricingRedirectModal
