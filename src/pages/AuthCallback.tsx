// src/pages/AuthCallback.tsx  (Hub — Vite/React)
// Nouveau fichier — gère le retour OAuth de Google

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      if (!supabase) return

      // Supabase détecte automatiquement le code dans l'URL et échange pour une session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth callback error:', error)
        window.location.href = '/?error=auth_failed'
        return
      }

      if (data.session) {
        console.log('✅ Session établie sur le Hub')
        window.location.href = '/'
      } else {
        window.location.href = '/'
      }
    }

    handleCallback()
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0a',
      color: '#D4AF37',
      fontFamily: 'Orbitron, sans-serif',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div style={{ fontSize: '2rem' }}>⚡</div>
      <p>Connexion en cours...</p>
    </div>
  )
}
