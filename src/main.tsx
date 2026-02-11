import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HubPortal from './HubPortal.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <HubPortal />
    </AuthProvider>
  </StrictMode>,
)
