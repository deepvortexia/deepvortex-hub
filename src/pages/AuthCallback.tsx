import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!supabase) {
            setError('Supabase not initialized')
            return
        }

        const url = new URL(window.location.href)
        const errorParam = url.searchParams.get('error')
        const errorDescription = url.searchParams.get('error_description')

        if (errorParam) {
            setError(errorDescription || errorParam)
            return
        }

        // With implicit flow the session arrives in the URL hash.
        // Wait for Supabase to parse the hash and fire SIGNED_IN before
        // redirecting — ensures the session cookie is written first.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                subscription.unsubscribe()
                window.location.replace('/')
            }
        })

        // Fallback: if SIGNED_IN never fires within 3s, redirect anyway
        const fallback = setTimeout(() => {
            subscription.unsubscribe()
            window.location.replace('/')
        }, 3000)

        return () => {
            subscription.unsubscribe()
            clearTimeout(fallback)
        }
    }, [])

    if (error) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#0a0a0a', color: '#ff4444',
                fontFamily: 'Orbitron, sans-serif', flexDirection: 'column', gap: '1rem',
                padding: '2rem', textAlign: 'center'
            }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <p style={{ maxWidth: '400px' }}>Sign in failed: {error}</p>
                <a href="/" style={{ color: '#D4AF37', textDecoration: 'underline', marginTop: '1rem' }}>Return to Home</a>
                <button onClick={() => window.location.href = '/'} style={{
                    marginTop: '0.5rem', padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                    border: 'none', borderRadius: '8px', color: '#0a0a0a', fontWeight: 'bold', cursor: 'pointer'
                }}>Try Again</button>
            </div>
        )
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#0a0a0a', color: '#D4AF37',
            fontFamily: 'Orbitron, sans-serif', flexDirection: 'column', gap: '1rem'
        }}>
            <div style={{ fontSize: '2rem' }}>⚡</div>
            <p>Completing sign in...</p>
        </div>
    )
}
