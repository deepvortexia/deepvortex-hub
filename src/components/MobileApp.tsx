import { useState } from 'react'
import './MobileApp.css'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'
import PricingModal from './PricingModal'

type Tab = 'home' | 'tools' | 'account'

const TOOLS = [
  { icon: '🖼️', name: 'Image Generator',   url: 'https://images.deepvortexai.com' },
  { icon: '✂️', name: 'Background Remover', url: 'https://bgremover.deepvortexai.com' },
  { icon: '🔍', name: 'Image Upscaler',     url: 'https://upscaler.deepvortexai.com' },
  { icon: '🧊', name: '3D Generator',       url: 'https://3d.deepvortexai.com' },
  { icon: '🎙️', name: 'Voice Generator',   url: 'https://voice.deepvortexai.com' },
  { icon: '😀', name: 'Emoticon Generator', url: 'https://emoticons.deepvortexai.com' },
  { icon: '🎬', name: 'Image to Video',     url: 'https://video.deepvortexai.com' },
  { icon: '💬', name: 'AI Chat',            url: 'https://chat.deepvortexai.com' },
  { icon: '🎭', name: 'Avatar Generator',   url: 'https://avatar.deepvortexai.com' },
  { icon: '🛡️', name: 'Logo Generator',    url: 'https://logo.deepvortexai.com' },
  { icon: '✏️', name: 'Image Editor',       url: 'https://image-editor.deepvortexai.com' },
]

// SVG icons for bottom nav
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const IconTools = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const IconAccount = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

function ToolCard({ icon, name, url }: { icon: string; name: string; url: string }) {
  return (
    <button className="ma-tool-card" onClick={() => { window.location.href = url }}>
      <span className="ma-tool-icon">{icon}</span>
      <span className="ma-tool-name">{name}</span>
    </button>
  )
}

function HomeTab({ onSignIn, onBuyCredits }: { onSignIn: () => void; onBuyCredits: () => void }) {
  const { user, profile, loading } = useAuth()

  return (
    <div className="ma-home">
      <div className="ma-home-hero">
        <div className="ma-hero-glow" />
        <img
          src="/logotinyreal.webp"
          alt="Deep Vortex AI"
          className="ma-hero-logo"
          width="90"
          height="90"
        />
        <h1 className="ma-hero-title">DΞΞP VORTΞX AI</h1>
        <p className="ma-hero-tagline">Your AI Tools Ecosystem</p>

        <div className="ma-hero-actions">
          {user ? (
            <div className="ma-credits-pill">
              <span className="ma-credits-icon">🏆</span>
              <span className="ma-credits-text">{profile?.credits ?? 0} credits</span>
              <button className="ma-buy-btn" onClick={onBuyCredits}>Buy More</button>
            </div>
          ) : (
            <button
              className="ma-signin-cta"
              onClick={onSignIn}
              disabled={loading}
            >
              🔐 Sign In — Get 2 Free Credits
            </button>
          )}
        </div>
      </div>

      <div className="ma-section-header">
        <span className="ma-section-label">AI Tools</span>
      </div>
      <div className="ma-tools-grid">
        {TOOLS.map((t) => (
          <ToolCard key={t.name} {...t} />
        ))}
      </div>
    </div>
  )
}

function ToolsTab() {
  return (
    <div className="ma-tools-tab">
      <div className="ma-tools-tab-header">
        <h2 className="ma-tab-title">All Tools</h2>
        <p className="ma-tab-subtitle">Tap any tool to get started</p>
      </div>
      <div className="ma-tools-grid ma-tools-grid--padded">
        {TOOLS.map((t) => (
          <ToolCard key={t.name} {...t} />
        ))}
      </div>
    </div>
  )
}

function AccountTab({ onSignIn, onBuyCredits }: { onSignIn: () => void; onBuyCredits: () => void }) {
  const { user, profile, loading, signOut } = useAuth()

  const displayName = profile?.full_name || profile?.email || user?.email || 'User'
  const initials = displayName.length >= 2 ? displayName.substring(0, 2).toUpperCase() : displayName.toUpperCase() || 'U'

  const handleSignOut = async () => {
    try { await signOut() } catch {}
  }

  if (loading) {
    return (
      <div className="ma-account">
        <div className="ma-account-loading">Loading…</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="ma-account">
        <div className="ma-account-signed-out">
          <div className="ma-account-avatar-placeholder">
            <span>?</span>
          </div>
          <p className="ma-account-prompt">Sign in to track credits and save favorites</p>
          <button className="ma-account-signin-btn" onClick={onSignIn}>
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="ma-account">
      <div className="ma-account-profile">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={displayName}
            className="ma-account-avatar"
            width="80"
            height="80"
          />
        ) : (
          <div className="ma-account-avatar-fallback">{initials}</div>
        )}
        <h2 className="ma-account-name">{displayName}</h2>
        {user.email && user.email !== displayName && (
          <p className="ma-account-email">{user.email}</p>
        )}
      </div>

      <div className="ma-account-credits-card">
        <div className="ma-account-credits-left">
          <span className="ma-account-credits-label">Credits Balance</span>
          <span className="ma-account-credits-value">{profile?.credits ?? 0}</span>
        </div>
        <button className="ma-account-buy-btn" onClick={onBuyCredits}>Buy Credits</button>
      </div>

      <div className="ma-account-links">
        <a href="https://chat.deepvortexai.com" className="ma-account-link">
          <span>💬</span>
          <span>AI Chat</span>
          <span className="ma-link-arrow">›</span>
        </a>
        <a href="https://deepvortexai.com" className="ma-account-link">
          <span>🌐</span>
          <span>Website</span>
          <span className="ma-link-arrow">›</span>
        </a>
        <a href="mailto:admin@deepvortexai.com" className="ma-account-link">
          <span>✉️</span>
          <span>Contact Support</span>
          <span className="ma-link-arrow">›</span>
        </a>
      </div>

      <button className="ma-signout-btn" onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}

export default function MobileApp() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const { user } = useAuth()

  const handleBuyCredits = () => {
    if (user) setShowPricingModal(true)
    else setShowAuthModal(true)
  }

  return (
    <div className="ma-root">
      <main className="ma-content">
        {activeTab === 'home' && (
          <HomeTab
            onSignIn={() => setShowAuthModal(true)}
            onBuyCredits={handleBuyCredits}
          />
        )}
        {activeTab === 'tools' && <ToolsTab />}
        {activeTab === 'account' && (
          <AccountTab
            onSignIn={() => setShowAuthModal(true)}
            onBuyCredits={handleBuyCredits}
          />
        )}
      </main>

      <nav className="ma-bottom-nav">
        <button
          className={`ma-nav-btn${activeTab === 'home' ? ' ma-nav-active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span className="ma-nav-icon"><IconHome /></span>
          <span className="ma-nav-label">Home</span>
        </button>
        <button
          className={`ma-nav-btn${activeTab === 'tools' ? ' ma-nav-active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          <span className="ma-nav-icon"><IconTools /></span>
          <span className="ma-nav-label">Tools</span>
        </button>
        <button
          className={`ma-nav-btn${activeTab === 'account' ? ' ma-nav-active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <span className="ma-nav-icon"><IconAccount /></span>
          <span className="ma-nav-label">Account</span>
        </button>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </div>
  )
}
