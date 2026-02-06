import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/MainStyles.css';
import MainPortal from './MainPortal';

const containerElement = document.getElementById('root');
if (!containerElement) throw new Error('Root element not found');

const reactRoot = createRoot(containerElement);
reactRoot.render(
  <StrictMode>
    <MainPortal />
  </StrictMode>
);
