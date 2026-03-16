// src/main.tsx  (Hub)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HubPortal from './HubPortal'
import { AuthCallback } from './pages/AuthCallback'
import { Game } from './pages/Game'
import { AuthProvider } from './context/AuthContext'

function App() {
  const path = window.location.pathname
  return (
    <AuthProvider>
      {path === '/auth/callback' ? <AuthCallback />
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
