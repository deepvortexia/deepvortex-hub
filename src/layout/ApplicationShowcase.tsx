import { FC } from 'react';
import ApplicationTile from '../elements/ApplicationTile';

interface AppRegistryItem {
  emoji: string;
  appName: string;
  briefDesc: string;
  availability: 'live' | 'coming-soon';
  labelText?: string;
  destinationUrl?: string;
  userMetrics?: {
    activeUsers?: string;
  };
}

const ApplicationShowcase: FC = () => {
  const registeredApps: AppRegistryItem[] = [
    {
      emoji: '😀',
      appName: 'Emoticon Generator',
      briefDesc: 'Create custom AI-powered emoticons instantly. Perfect for chats, social media, and creative projects.',
      availability: 'live',
      labelText: '🔥 Popular',
      destinationUrl: 'https://emoticons.deepvortexai.art',
      userMetrics: { activeUsers: '1.2k' }
    },
    {
      emoji: '🖼️',
      appName: 'Image Generator',
      briefDesc: 'Generate stunning AI images from text descriptions. Professional quality for any creative project.',
      availability: 'live',
      labelText: '✨ New',
      destinationUrl: 'https://images.deepvortexai.art',
      userMetrics: { activeUsers: '850' }
    },
    {
      emoji: '💬',
      appName: 'AI Chat',
      briefDesc: 'Intelligent conversational AI assistant. Get help, brainstorm ideas, and solve problems.',
      availability: 'coming-soon',
      labelText: '🔮 Soon'
    },
    {
      emoji: '🎵',
      appName: 'Music Generator',
      briefDesc: 'Create original music and soundtracks with AI. From ambient to upbeat, any genre you need.',
      availability: 'coming-soon',
      labelText: '🔮 Soon'
    }
  ];

  return (
    <section id="tools" className="dvx-showcase-area">
      <div className="dvx-showcase-wrapper">
        <div className="dvx-showcase-intro">
          <h2 className="dvx-showcase-heading">🎨 Our AI Tools</h2>
          <p className="dvx-showcase-description">
            Choose your creative tool and start building amazing content
          </p>
        </div>

        <div className="dvx-apps-matrix">
          {registeredApps.map((appData, idx) => (
            <ApplicationTile key={`app-${idx}`} {...appData} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApplicationShowcase;
