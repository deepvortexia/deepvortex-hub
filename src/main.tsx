// src/main.tsx  (Hub)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HubPortal from './HubPortal'
import { AuthCallback } from './pages/AuthCallback'
import { Game } from './pages/Game'
import { AuthProvider } from './context/AuthContext'
import MobileApp from './components/MobileApp'

const isCapacitor = !!(window as { Capacitor?: unknown }).Capacitor

function App() {
  const path = window.location.pathname
  if (path === '/chaos') return <div style={{ backgroundColor: '#000', width: '100vw', height: '100vh' }} />
  return (
    <AuthProvider>
      {isCapacitor ? <MobileApp />
        : path === '/auth/callback' ? <AuthCallback />
        : path === '/game' ? <Game />
        : <HubPortal />}
    </AuthProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
