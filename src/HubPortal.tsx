import './HubPortal.css'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './context/AuthContext'
import AuthModal from './components/AuthModal'
import PricingModal from './components/PricingModal'

interface ToolCardData {
  iconSymbol: string;
  toolName: string;
  toolDescription: string;
  statusLabel: string;
  isActive: boolean;
  targetUrl?: string;
  embedInHub?: boolean;
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
  const [showFavoritesMessage, setShowFavoritesMessage] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [activeTool, setActiveTool] = useState<{ name: string; url: string } | null>(null)
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
      targetUrl: 'https://emoticons.deepvortexai.art',
      embedInHub: true
    },
    {
      iconSymbol: '💬',
      toolName: 'AI Chat',
      toolDescription: 'Smart conversations',
      statusLabel: 'Coming Soon',
      isActive: false
    },
    {
      iconSymbol: '🖼️',
      toolName: 'Image Gen',
      toolDescription: 'AI artwork',
      statusLabel: 'Available Now',
      isActive: true,
      targetUrl: 'https://images.deepvortexai.art/',
      embedInHub: true
    },
    {
      iconSymbol: '🎨',
      toolName: 'Remove Background',
      toolDescription: 'Remove backgrounds from images instantly with AI precision',
      statusLabel: 'Coming Soon',
      isActive: false
    },
    {
      iconSymbol: '🔍',
      toolName: 'Upscale Image',
      toolDescription: 'Enhance image resolution and quality with AI upscaling',
      statusLabel: 'Coming Soon',
      isActive: false
    },
    {
      iconSymbol: '🎬',
      toolName: 'Generate Video',
      toolDescription: 'Create stunning AI-generated videos from text prompts',
      statusLabel: 'Coming Soon',
      isActive: false
    },
    {
      iconSymbol: '✨',
      toolName: 'More Tools',
      toolDescription: 'Expanding soon',
      statusLabel: 'In Development',
      isActive: false
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

  // Listen for credit updates and navigation from embedded tools
  useEffect(() => {
    const allowedOrigins = ['https://images.deepvortexai.art', 'https://emoticons.deepvortexai.art'];
    const embeddableUrls: Record<string, string> = {
      'https://images.deepvortexai.art/': 'Image Gen',
      'https://emoticons.deepvortexai.art': 'Emoticons',
    };

    const handleMessage = (event: MessageEvent) => {
      if (!allowedOrigins.includes(event.origin)) return;

      if (event.data?.type === 'deepvortex-credits-updated') {
        refreshProfile();
      }
      if (event.data?.type === 'deepvortex-navigate' && event.data?.url) {
        const url = event.data.url as string;
        // If navigating back to Hub, close the embedded tool
        if (url === 'https://deepvortexai.art' || url === 'https://deepvortexai.art/') {
          setActiveTool(null);
          refreshProfile();
          return;
        }
        // Find matching embeddable tool, or navigate externally
        const toolName = embeddableUrls[url];
        if (toolName) {
          setActiveTool({ name: toolName, url });
        } else {
          window.location.assign(url);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshProfile]);

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
      if (tool.embedInHub) {
        setActiveTool({ name: tool.toolName, url: tool.targetUrl });
      } else {
        window.location.assign(tool.targetUrl);
      }
    }
  };

  const handleCloseTool = async () => {
    setActiveTool(null);
    // Refresh credits in case they were spent in the embedded tool
    try { await refreshProfile(); } catch (e) { console.error('Failed to refresh profile:', e); }
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

  const handleExploreTools = () => {
    const toolsSection = document.querySelector('.preview-tools-section')
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleFavoritesClick = () => {
    setShowFavoritesMessage(true)
    setTimeout(() => setShowFavoritesMessage(false), 5000)
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

      {activeTool && (
        <div className="embedded-tool-overlay">
          <div className="embedded-tool-header">
            <button className="back-to-hub-btn" onClick={handleCloseTool}>
              <span>←</span>
              <span>Back to Hub</span>
            </button>
            <span className="embedded-tool-name">{activeTool.name}</span>
            {user && (
              <span className="embedded-credits-display">
                <span className="credits-icon">💰</span>
                <span className="credits-amount">{profile?.credits ?? 0} credits</span>
              </span>
            )}
          </div>
          <iframe
            src={activeTool.url}
            className="embedded-tool-iframe"
            title={activeTool.name}
            allow="clipboard-write"
          />
        </div>
      )}

      <header className="hero-header-section">
        <div className="logo-display-zone">
          <div className="orbit-ring-one" />
          <div className="orbit-ring-two" />
          <div className="orbit-ring-three" />
          <img src="/logo.png" alt="Deep Vortex" className="brand-logo-image" />
        </div>
        
        <h1 className="brand-title-text">DΞΞP VORTΞX AI</h1>
        <p className="primary-tagline">Your AI Tools Ecosystem</p>
        <p className="secondary-tagline">Access powerful AI creative tools in one place</p>
        
        <div className="hub-pills-container">
          <div className="hub-pill credits-pill">
            <span className="pill-icon">🏆</span>
            <span className="pill-text">
              {user ? `${profile?.credits ?? 0} credits` : 'Sign in for credits'}
            </span>
          </div>

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
                  <img src={getAvatarUrl()!} alt={`${getUserDisplayName()}'s avatar`} />
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

        {showFavoritesMessage && (
          <div className="favorites-placeholder-message">
            Your favorites from all tools will be available here soon! For now, check your favorites in each tool.
          </div>
        )}
      </header>

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

      <footer className="portal-footer">
        <p className="footer-main-text">Deep Vortex AI - Building the complete AI creative ecosystem</p>
        <p className="footer-powered-text">Powered by Deep Vortex AI</p>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </div>
  );
};

export default HubPortal;
