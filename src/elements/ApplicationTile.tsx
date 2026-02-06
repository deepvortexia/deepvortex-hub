import { FC, MouseEvent } from 'react';

type AppAvailability = 'live' | 'coming-soon';

interface ApplicationTileProps {
  emoji: string;
  appName: string;
  briefDesc: string;
  availability: AppAvailability;
  labelText?: string;
  thumbnailSrc?: string;
  destinationUrl?: string;
  userMetrics?: {
    activeUsers?: string;
  };
}

const ApplicationTile: FC<ApplicationTileProps> = ({
  emoji,
  appName,
  briefDesc,
  availability,
  labelText,
  thumbnailSrc,
  destinationUrl,
  userMetrics
}) => {
  const navigateToApp = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (destinationUrl && availability === 'live') {
      const externalLink = window.open(destinationUrl, '_blank', 'noopener,noreferrer');
      if (externalLink) {
        externalLink.opener = null;
      }
    }
  };

  const isAccessible = availability === 'live';
  const statusDisplay = isAccessible ? '🔥 LIVE' : '🔮 COMING SOON';
  const actionLabel = isAccessible ? 'Launch Tool →' : 'Coming Soon';

  return (
    <div className="dvx-app-tile">
      <div className="dvx-tile-preview">
        {thumbnailSrc ? (
          <img src={thumbnailSrc} alt={appName} className="dvx-preview-img" />
        ) : (
          <div className="dvx-preview-fallback">
            <span className="dvx-fallback-emoji">{emoji}</span>
          </div>
        )}
        {labelText && <span className="dvx-tile-tag">{labelText}</span>}
      </div>

      <div className="dvx-tile-details">
        <div className="dvx-details-header">
          <span className="dvx-app-emoji">{emoji}</span>
          <h3 className="dvx-app-name">{appName}</h3>
        </div>

        <p className="dvx-app-summary">{briefDesc}</p>

        <div className="dvx-tile-metadata">
          <span className={`dvx-availability-badge dvx-${availability}`}>
            {statusDisplay}
          </span>
          {userMetrics?.activeUsers && (
            <span className="dvx-user-count">{userMetrics.activeUsers} users</span>
          )}
        </div>

        <button 
          className="dvx-launch-action"
          onClick={navigateToApp}
          disabled={!isAccessible}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default ApplicationTile;
