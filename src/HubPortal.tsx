import './HubPortal.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import PricingModal from './components/PricingModal'
import FavoritesModal from './components/FavoritesModal'

interface ToolCardData {
  iconSymbol: string;
  toolName: string;
  toolDescription: string;
  statusLabel: string;
  isActive: boolean;
  targetUrl?: string;
}

interface SuggestionChip {
  emoji: string;
  label: string;
}

const cleanUrlParams = () => {
  window.history.replaceState({}, '', window.location.pathname)
}

const HubPortal = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [showFavoritesModal, setShowFavoritesModal] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  const [showRetry, setShowRetry] = useState(false)
  const processedSessionIdRef = useRef<string | null>(null)

  const previewToolsList: ToolCardData[] = [
    {
      iconSymbol: '😀',
      toolName: 'Emoticons',
      toolDescription: 'Custom emoji creation',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://emoticons.deepvortexai.art'
    },
    {
      iconSymbol: '🖼️',
      toolName: 'Image Gen',
      toolDescription: 'AI artwork',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://images.deepvortexai.art/'
    },
    {
      iconSymbol: '✂️',
      toolName: 'Remove Background',
      toolDescription: 'Remove backgrounds from images instantly with AI precision',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://bgremover.deepvortexai.art'
    },
    {
      iconSymbol: '🔍',
      toolName: 'Upscale Image',
      toolDescription: 'Enhance image resolution and quality with AI upscaling',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://upscaler.deepvortexai.art'
    },
    {
      iconSymbol: '🧊',
      toolName: '3D Generator',
      toolDescription: 'Transform images into stunning 3D models instantly',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://3d.deepvortexai.art'
    },
    {
      iconSymbol: '🎬',
      toolName: 'Image to Video',
      toolDescription: 'Animate any image into a stunning AI video',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://video.deepvortexai.art'
    },
    {
      iconSymbol: '🎙️',
      toolName: 'Voice Generator',
      toolDescription: 'AI text to speech generation',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://voice.deepvortexai.art'
    }
  ];

  const popularStyles: SuggestionChip[] = [
    { emoji: '✨', label: 'sparkle' },
    { emoji: '🌈', label: 'neon' },
    { emoji: '🔮', label: 'mystical' },
    { emoji: '⚡', label: 'electric' },
    { emoji: '🌈', label: 'rainbow' },
    { emoji: '💎', label: 'crystal' },
    { emoji: '✨', label: 'glowing' },
    { emoji: '🔥', label: 'fire' }
  ];

  const quickIdeas: SuggestionChip[] = [
    { emoji: '🍕', label: 'pizza' },
    { emoji: '🚀', label: 'rocket' },
    { emoji: '❤️', label: 'heart' },
    { emoji: '⭐', label: 'star' },
    { emoji: '☕', label: 'coffee' },
    { emoji: '🐱', label: 'cat' },
    { emoji: '🎮', label: 'gaming' },
    { emoji: '🌙', label: 'moon' }
  ];


  // Stripe return handler with retry pattern
  useEffect(() => {
    const handleStripeReturn = async () => {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')
      const success = params.get('success')
      
      if (!sessionId || !success) return
      if (processedSessionIdRef.current === sessionId) return
      if (loading) return
      
      processedSessionIdRef.current = sessionId

      if (user) {
        // Retry pattern: webhook may not have processed yet
        const refreshWithRetry = async () => {
          try { await refreshProfile() } catch (e) { console.error('Refresh 1 failed:', e) }
          setTimeout(async () => {
            try { await refreshProfile() } catch (e) { console.error('Refresh 2 failed:', e) }
          }, 2000)
          setTimeout(async () => {
            try { await refreshProfile() } catch (e) { console.error('Refresh 3 failed:', e) }
          }, 5000)
        }
        
        await refreshWithRetry()
        setShowNotification(true)
        setTimeout(() => setShowNotification(false), 5000)
        cleanUrlParams()
      } else {
        cleanUrlParams()
      }
    }
    handleStripeReturn()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user])

  const renderFloatingParticles = () => {
    return Array.from({ length: 25 }).map((_, idx) => (
      <div key={idx} className="particle-dot" style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${6 + Math.random() * 6}s`
      }} />
    ));
  };

  const handleToolCardClick = (tool: ToolCardData) => {
    if (tool.isActive && tool.targetUrl) {
      window.location.href = tool.targetUrl;
    }
  };

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true)
        setShowRetry(true)
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
      setShowRetry(false)
    }
  }, [loading])

  const handleRetry = useCallback(() => {
    setShowRetry(false)
    setLoadingTimeout(false)
    if (user) refreshProfile()
  }, [user, refreshProfile])

  const handleBuyCreditsClick = () => {
    if (!user) setShowAuthModal(true)
    else setShowPricingModal(true)
  }

  const getAvatarUrl = () => profile?.avatar_url || null

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.length >= 2 ? name.substring(0, 2).toUpperCase() : name.toUpperCase() || 'U'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleFavoritesClick = () => {
    if (!user) { setShowAuthModal(true); return }
    setShowFavoritesModal(true)
  }

  const getUserDisplayName = () => {
    return profile?.full_name || profile?.email || user?.email || 'User'
  }

  return (
    <div className="hub-portal-container">
      <div className="floating-particles-layer">
        {renderFloatingParticles()}
      </div>

      {showNotification && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
          color: '#0a0a0a', padding: '1rem 1.5rem', borderRadius: '12px',
          fontWeight: 'bold', boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
          animation: 'fadeIn 0.3s ease'
        }}>
          ✅ Credits purchased successfully!
        </div>
      )}


      <header className="hero-header-section">
        <div className="logo-display-zone">
          <div className="orbit-ring-one" />
          <div className="orbit-ring-two" />
          <div className="orbit-ring-three" />
          <img src="/logo.png" alt="Deep Vortex" className="brand-logo-image" width="512" height="512" fetchPriority="high" />
        </div>
        
        <h1 className="brand-title-text">DΞΞP VORTΞX AI</h1>
        <p className="primary-tagline">Your AI Tools Ecosystem</p>
        <p className="secondary-tagline">Access powerful AI creative tools in one place</p>
        
        <div className="hub-pills-container">
          <a href="/blog" className="hub-pill blog-pill">
            <span className="pill-icon">📝</span>
            <span className="pill-text">Blog</span>
          </a>

          {user ? (
            <div className="hub-pill credits-pill">
              <span className="pill-icon">🏆</span>
              <span className="pill-text">{profile?.credits ?? 0} credits</span>
            </div>
          ) : (
            <button className="hub-pill credits-pill" style={{ cursor: 'pointer' }} onClick={() => setShowAuthModal(true)} title="Sign in to get free credits">
              <span className="pill-icon">🏆</span>
              <span className="pill-text">Sign in - Get 2 Free Credits</span>
            </button>
          )}

          <button
            className="hub-pill buy-credits-pill"
            onClick={handleBuyCreditsClick}
            title="Purchase more credits"
          >
            <span className="pill-icon">💳</span>
            <span className="pill-text">Buy Credits</span>
          </button>

          <button
            className="hub-pill favorites-pill"
            onClick={handleFavoritesClick}
            title="View your favorites"
          >
            <span className="pill-icon">⭐</span>
            <span className="pill-text">Favorites</span>
          </button>

          {user ? (
            <div className="hub-pill profile-pill">
              {getAvatarUrl() ? (
                <div className="profile-avatar">
                  <img src={getAvatarUrl()!} alt={`${getUserDisplayName()}'s avatar`} width="40" height="40" loading="lazy" />
                </div>
              ) : (
                <div className="profile-avatar-fallback">
                  {getUserInitials()}
                </div>
              )}
              <span className="profile-name">{getUserDisplayName()}</span>
              <button className="signout-pill-btn" onClick={handleSignOut} title="Sign out">
                Sign Out
              </button>
            </div>
          ) : (
            <button
              className="hub-pill signin-pill"
              onClick={() => setShowAuthModal(true)}
              disabled={loading && !loadingTimeout}
              title="Sign in to get credits"
            >
              <span className="pill-icon">🔐</span>
              <span className="pill-text">
                {(loading && !loadingTimeout) ? 'Loading...' : 'Sign In'}
              </span>
            </button>
          )}

          {showRetry && (
            <button className="hub-pill retry-pill" onClick={handleRetry} title="Retry loading">
              <span className="pill-icon">🔄</span>
              <span className="pill-text">Retry</span>
            </button>
          )}
        </div>

      </header>

      {/* ── Featured Chat Card ──────────────────────────────────────── */}
      <section className="chat-feature-section">
        <a href="https://chat.deepvortexai.art" className="chat-feature-card">
          <div className="chat-feature-glow" />
          <div className="chat-feature-new">✦ NEW</div>
          <div className="chat-feature-left">
            <div className="chat-feature-icon">💬</div>
            <h3 className="chat-feature-title">AI Chat Suite</h3>
            <p className="chat-feature-desc">
              Chat with 4 frontier models in one sleek interface. Switch instantly between models — no switching tabs, no extra accounts.
            </p>
            <div className="chat-feature-models">
              <span style={{ color: '#f97316' }}>◆ GPT-5</span>
              <span style={{ color: '#a855f7' }}>✦ Claude 4.5</span>
              <span style={{ color: '#06b6d4' }}>⚡ Gemini 2.5</span>
              <span style={{ color: '#10b981' }}>🧠 DeepSeek v3.1</span>
            </div>
            <span className="chat-feature-cta">Start chatting →</span>
          </div>
          <div className="chat-feature-right">
            <div className="chat-feature-preview">
              <div className="cfp-msg cfp-msg-user">What's the fastest sorting algorithm?</div>
              <div className="cfp-msg cfp-msg-ai"><span className="cfp-ai-dot" style={{ background: '#10b981' }} />DeepSeek v3.1 is typing…</div>
              <div className="cfp-msg cfp-msg-user">Write me a poem about the cosmos</div>
              <div className="cfp-msg cfp-msg-ai"><span className="cfp-ai-dot" style={{ background: '#a855f7' }} />Claude 4.5 is typing…</div>
            </div>
          </div>
        </a>
      </section>

      <section className="preview-tools-section">
        <h2 className="section-heading">Complete AI Ecosystem</h2>
        <div className="preview-tools-grid">
          {previewToolsList.map((tool, idx) => (
            <div 
              key={idx} 
              className={`preview-card ${tool.isActive ? 'card-active' : 'card-inactive'}`}
              onClick={() => handleToolCardClick(tool)}
              style={{ cursor: tool.isActive ? 'pointer' : 'default' }}
            >
              <div className="preview-icon">{tool.iconSymbol}</div>
              <h3 className="preview-title">{tool.toolName}</h3>
              <p className="preview-desc">{tool.toolDescription}</p>
              <span className={`status-badge ${tool.isActive ? 'badge-active' : 'badge-upcoming'}`}>
                {tool.statusLabel}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="suggestions-section">
        <div className="suggestions-row desktop-popular-row">
          <h3 className="suggestions-title">Popular Styles</h3>
          <div className="suggestion-chips-container">
            {popularStyles.map((item, idx) => (
              <button key={idx} className="suggestion-chip">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="suggestions-row desktop-ideas-row">
          <h3 className="suggestions-title">Quick Ideas</h3>
          <div className="suggestion-chips-container">
            {quickIdeas.map((item, idx) => (
              <button key={idx} className="suggestion-chip">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="suggestions-row mobile-combined-row">
          <h3 className="suggestions-title">Popular</h3>
          <div className="suggestion-chips-container">
            {[...popularStyles, ...quickIdeas].map((item, idx) => (
              <button key={idx} className="suggestion-chip">
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="main-tools-section">
        <h2 className="section-heading">How It Works</h2>
        <p className="section-subheading">Get started in three simple steps</p>
        <div className="main-tools-grid">
          <div className="main-tool-card">
            <div className="tool-icon-large">🎯</div>
            <h3 className="tool-name">Choose Your Tool</h3>
            <p className="tool-description">Select from our AI-powered creative suite</p>
          </div>
          <div className="main-tool-card">
            <div className="tool-icon-large">✍️</div>
            <h3 className="tool-name">Enter Your Prompt</h3>
            <p className="tool-description">Describe what you want to create</p>
          </div>
          <div className="main-tool-card">
            <div className="tool-icon-large">⚡</div>
            <h3 className="tool-name">Generate Instantly</h3>
            <p className="tool-description">Get professional results in seconds</p>
          </div>
        </div>
      </section>

      <section className="main-tools-section">
        <h2 className="section-heading">Why Choose Us</h2>
        <p className="section-subheading">The best AI creative platform</p>
        <div className="main-tools-grid">
          <div className="main-tool-card">
            <div className="tool-icon-large">⚡</div>
            <h3 className="tool-name">Lightning Fast</h3>
            <p className="tool-description">Generate high-quality content in seconds</p>
          </div>
          <div className="main-tool-card">
            <div className="tool-icon-large">🎨</div>
            <h3 className="tool-name">Professional Quality</h3>
            <p className="tool-description">Powered by cutting-edge AI models</p>
          </div>
          <div className="main-tool-card">
            <div className="tool-icon-large">💰</div>
            <h3 className="tool-name">Simple Pricing</h3>
            <p className="tool-description">Pay only for what you use with credits</p>
          </div>
          <div className="main-tool-card">
            <div className="tool-icon-large">🔒</div>
            <h3 className="tool-name">Secure & Private</h3>
            <p className="tool-description">Your data and creations stay protected</p>
          </div>
        </div>
      </section>

      {/* Industry Solutions — discreet SEO nav, styled like Stripe/Apple footer links */}
      <nav className="solutions-nav" aria-label="Industry Solutions">
        <span className="solutions-nav-label">Industry Solutions</span>
        <ul className="solutions-nav-list">
          <li><a href="/solutions/digital-artists.html" className="solutions-nav-link">Digital Artists</a></li>
          <li><a href="/solutions/gamers.html"          className="solutions-nav-link">Gamers</a></li>
          <li><a href="/solutions/real-estate.html"     className="solutions-nav-link">Real Estate</a></li>
          <li><a href="/solutions/e-commerce.html"      className="solutions-nav-link">E-commerce</a></li>
          <li><a href="/solutions/youtubers.html"        className="solutions-nav-link">YouTubers</a></li>
        </ul>
      </nav>

      <footer className="portal-footer">
        <a href="https://deepvortexai.art" className="footer-main-link">Deep Vortex AI - Building the complete AI creative ecosystem</a>
        <div className="footer-social">
          <a href="https://www.tiktok.com/@deepvortexai" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/>
            </svg>
            TikTok
          </a>
          <a href="https://x.com/deepvortexart" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X
          </a>
          <a href="https://deepvortexai.quora.com/" target="_blank" rel="noopener noreferrer" className="footer-social-link">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M12.071 0C5.4 0 0 5.4 0 12.071c0 6.67 5.4 12.071 12.071 12.071 6.67 0 12.071-5.4 12.071-12.071C24.142 5.4 18.742 0 12.07 0zm2.028 18.383c-.5-.998-.954-1.88-1.907-1.88h-.213l1.193-2.647h-.002c-.362.12-.743.18-1.128.18-2.287 0-3.996-1.837-3.996-4.177s1.709-4.177 3.997-4.177 3.996 1.837 3.996 4.177c0 1.29-.496 2.432-1.32 3.29.277.397.533.812.793 1.227l.15.238c.278.442.55.886.832 1.33l-2.395 2.44zm-2.057-4.997c1.18 0 1.94-1.083 1.94-2.51 0-1.428-.76-2.511-1.94-2.511s-1.94 1.083-1.94 2.51c0 1.428.76 2.511 1.94 2.511z"/>
            </svg>
            Quora
          </a>
          <a href="mailto:admin@deepvortexai.xyz" className="footer-contact-btn">Contact Us</a>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
      <FavoritesModal isOpen={showFavoritesModal} onClose={() => setShowFavoritesModal(false)} />
    </div>
  );
};

export default HubPortal;
