import { FC } from 'react';

interface BannerSectionProps {
  mainHeading: string;
  descriptiveText: string;
  ctaLabel: string;
  ctaTarget: string;
}

const BannerSection: FC<BannerSectionProps> = ({ 
  mainHeading, 
  descriptiveText, 
  ctaLabel, 
  ctaTarget 
}) => {
  return (
    <section className="dvx-banner-zone">
      <div className="dvx-banner-content">
        <h2 className="dvx-banner-headline">{mainHeading}</h2>
        <p className="dvx-banner-subtext">{descriptiveText}</p>
        <div className="dvx-banner-actions">
          <a href={ctaTarget} className="dvx-primary-cta">
            {ctaLabel}
          </a>
        </div>
      </div>
    </section>
  );
};

export default BannerSection;
