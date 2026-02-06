import './HubPortal.css'

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

const HubPortal = () => {
  const mainToolsList: ToolCardData[] = [
    {
      iconSymbol: '😀',
      toolName: 'Emoticon Generator',
      toolDescription: 'Create custom emoji and emoticons with AI',
      statusLabel: 'LIVE',
      isActive: true,
      targetUrl: 'https://emoticons.deepvortexai.art'
    },
    {
      iconSymbol: '🖼️',
      toolName: 'Image Generator',
      toolDescription: 'Generate stunning AI artwork and images',
      statusLabel: 'LIVE',
      isActive: true,
      targetUrl: 'https://images.deepvortexai.art'
    },
    {
      iconSymbol: '💬',
      toolName: 'AI Chat',
      toolDescription: 'Intelligent conversation assistant',
      statusLabel: 'COMING SOON',
      isActive: false
    },
    {
      iconSymbol: '🎵',
      toolName: 'Music Generator',
      toolDescription: 'Compose AI-powered music and melodies',
      statusLabel: 'COMING SOON',
      isActive: false
    }
  ];

  const previewToolsList: ToolCardData[] = [
    {
      iconSymbol: '😀',
      toolName: 'Emoticons',
      toolDescription: 'Custom emoji creation',
      statusLabel: 'Available Now',
      isActive: true
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

  return (
    <div className="hub-portal-container">
      <div className="floating-particles-layer">
        {renderFloatingParticles()}
      </div>

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
        
        <div className="action-buttons-row">
          <button className="action-btn">
            <span className="btn-icon">🔒</span>
            <span>Sign In</span>
          </button>
          <button className="action-btn">
            <span className="btn-icon">⭐</span>
            <span>Favorites</span>
          </button>
        </div>
      </header>

      <section className="preview-tools-section">
        <h2 className="section-heading">Complete AI Ecosystem</h2>
        <div className="preview-tools-grid">
          {previewToolsList.map((tool, idx) => (
            <div key={idx} className={`preview-card ${tool.isActive ? 'card-active' : 'card-inactive'}`}>
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
        <h2 className="section-heading">
          <span className="heading-icon">🎨</span>
          Choose Your Tool
        </h2>
        <div className="main-tools-grid">
          {mainToolsList.map((tool, idx) => (
            <div
              key={idx}
              className={`main-tool-card ${tool.isActive ? 'tool-available' : 'tool-locked'}`}
              onClick={() => handleToolCardClick(tool)}
              style={{ cursor: tool.isActive ? 'pointer' : 'not-allowed' }}
            >
              <div className="tool-icon-large">{tool.iconSymbol}</div>
              <h3 className="tool-name">{tool.toolName}</h3>
              <p className="tool-description">{tool.toolDescription}</p>
              <div className="tool-footer">
                <span className={`tool-status-label ${tool.isActive ? 'status-live' : 'status-soon'}`}>
                  {tool.statusLabel}
                </span>
                {tool.isActive && (
                  <span className="tool-action-text">Click to launch →</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="portal-footer">
        <p className="footer-main-text">Deep Vortex AI - Building the complete AI creative ecosystem</p>
        <p className="footer-powered-text">Powered by Deep Vortex × SDXL Emoji</p>
      </footer>
    </div>
  );
};

export default HubPortal;