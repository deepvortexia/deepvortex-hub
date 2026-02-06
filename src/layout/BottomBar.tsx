import { FC } from 'react';

interface BottomBarProps {
  primaryMessage: string;
  creditLine: string;
}

const BottomBar: FC<BottomBarProps> = ({ primaryMessage, creditLine }) => {
  return (
    <footer className="dvx-bottombar">
      <div className="dvx-bottombar-container">
        <p className="dvx-bottom-primary">{primaryMessage}</p>
        <p className="dvx-bottom-credits" dangerouslySetInnerHTML={{ __html: creditLine }} />
      </div>
    </footer>
  );
};

export default BottomBar;
