import { FC } from 'react';

interface NavigationBarProps {
  brandName: string;
  subtitle: string;
  onAuthClick: () => void;
  onBookmarkClick: () => void;
}

const NavigationBar: FC<NavigationBarProps> = ({ 
  brandName, 
  subtitle, 
  onAuthClick, 
  onBookmarkClick 
}) => {
  return (
    <nav className="dvx-topbar">
      <div className="dvx-topbar-wrapper">
        <div className="dvx-brand-section">
          <h1 className="dvx-brand-title">🌌 {brandName}</h1>
          <span className="dvx-brand-caption">{subtitle}</span>
        </div>
        <div className="dvx-action-cluster">
          <button onClick={onAuthClick} className="dvx-action-item dvx-auth">
            🔒 Sign In
          </button>
          <button onClick={onBookmarkClick} className="dvx-action-item dvx-bookmark">
            ⭐ Favorites
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
