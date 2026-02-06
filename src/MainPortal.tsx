import { FC } from 'react';
import NavigationBar from './layout/NavigationBar';
import BannerSection from './layout/BannerSection';
import ApplicationShowcase from './layout/ApplicationShowcase';
import BottomBar from './layout/BottomBar';
import './layout/NavigationBar.css';
import './layout/BannerSection.css';
import './elements/ApplicationTile.css';
import './layout/ApplicationShowcase.css';
import './layout/BottomBar.css';
import './styles/MainStyles.css';

const MainPortal: FC = () => {
  const handleAuthenticationRequest = () => {
    console.log('Authentication requested');
  };

  const handleBookmarkToggle = () => {
    console.log('Bookmark toggled');
  };

  return (
    <div className="dvx-main-portal">
      <NavigationBar 
        brandName="DEEP VORTEX AI"
        subtitle="Your AI Tools Ecosystem"
        onAuthClick={handleAuthenticationRequest}
        onBookmarkClick={handleBookmarkToggle}
      />
      <BannerSection 
        mainHeading="✨ Craft. Create. Innovate."
        descriptiveText="Professional AI-powered creative tools for modern creators. Choose your tool and start creating instantly."
        ctaLabel="Explore Tools ↓"
        ctaTarget="#tools"
      />
      <ApplicationShowcase />
      <BottomBar 
        primaryMessage="Deep Vortex AI - Building the complete AI creative ecosystem"
        creditLine="Powered by <strong>Deep Vortex</strong> × <strong>SDXL Emoji</strong>"
      />
    </div>
  );
};

export default MainPortal;
