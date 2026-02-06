import { FC } from 'react';

interface BottomBarProps {
  primaryMessage: string;
  creditLine: string;
}

const BottomBar: FC<BottomBarProps> = ({ primaryMessage, creditLine }) => {
  const renderCredits = () => {
    const parts = creditLine.split(/<\/?strong>/);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={`credit-${index}`}>{part}</strong>;
      }
      return part;
    });
  };

  return (
    <footer className="dvx-bottombar">
      <div className="dvx-bottombar-container">
        <p className="dvx-bottom-primary">{primaryMessage}</p>
        <p className="dvx-bottom-credits">{renderCredits()}</p>
      </div>
    </footer>
  );
};

export default BottomBar;
