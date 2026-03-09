// src/main.tsx  (Hub)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HubPortal from './HubPortal'
import { AuthCallback } from './pages/AuthCallback'
import { AuthProvider } from './context/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/react'

function App() {
  const path = window.location.pathname
  return (
    <AuthProvider>
      {path === '/auth/callback' ? <AuthCallback /> : <HubPortal />}
      <SpeedInsights />
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
