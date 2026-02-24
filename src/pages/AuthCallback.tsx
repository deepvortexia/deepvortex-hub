import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
    const [error, setError] = useState<string | null>(null)

  useEffect(() => {
        const handleCallback = async () => {
                if (!supabase) {
                          setError('Supabase not initialized')
                          return
                }

                const url = new URL(window.location.href)
                const code = url.searchParams.get('code')
                const errorParam = url.searchParams.get('error')

                if (errorParam) {
                          setError(errorParam)
                          return
                }

                // PKCE flow: exchange code for session
                if (code) {
                          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                          if (exchangeError) {
                                      console.error('Auth callback error:', exchangeError)
                                      setError(exchangeError.message)
                                      return
                          }
                          window.location.href = '/'
                          return
                }

                // Implicit flow fallback: check hash for access_token
                const hash = window.location.hash
                if (hash && hash.includes('access_token')) {
                          const { data, error: sessionError } = await supabase.auth.getSession()
                          if (sessionError) {
                                      setError(sessionError.message)
                                      return
                          }
                          if (data?.session) {
                                      window.location.href = '/'
                                      return
                          }
                }

                // Fallback: wait for auth state change then redirect
                const { data: { subscription } } = supabase.auth.onAuthStateChange(
                          (event, session) => {
                                      if (event === 'SIGNED_IN' && session) {
                                                    subscription.unsubscribe()
                                                    window.location.href = '/'
                                      }
                          }
                        )

                setTimeout(() => {
                          subscription.unsubscribe()
                          window.location.href = '/'
                }, 5000)
        }

                handleCallback()
  }, [])

  if (error) {
        return (
                <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: '100vh', background: '#0a0a0a', color: '#ff4444',
                          fontFamily: 'Orbitron, sans-serif', flexDirection: 'column', gap: '1rem',
                }}>
                          <div style={{ fontSize: '2rem' }}>⚠️</div>div>
                          <p>Sign in failed: {error}</p>p>
                        <a href="/" style={{ color: '#D4AF37', textDecoration: 'underline' }}>Return to Home</a>a>
                </div>div>
              )
  }
  
    return (
          <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100vh', background: '#0a0a0a', color: '#D4AF37',
                  fontFamily: 'Orbitron, sans-serif', flexDirection: 'column', gap: '1rem',
          }}>
                <div style={{ fontSize: '2rem' }}>⚡</div>div>
                <p>Completing sign in...</p>p>
          </div>div>
        )
}
</p>
