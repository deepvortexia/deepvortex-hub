import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function AuthCallback() {
    const [error, setError] = useState<string | null>(null)
    const [debugInfo, setDebugInfo] = useState<string>('')

    useEffect(() => {
        const handleCallback = async () => {
            if (!supabase) {
                setError('Supabase not initialized')
                return
            }

            const url = new URL(window.location.href)
            const code = url.searchParams.get('code')
            const errorParam = url.searchParams.get('error')
            const errorDescription = url.searchParams.get('error_description')

            console.log('[Hub AuthCallback] URL params:', { code: code ? 'present' : 'missing', errorParam })

            if (errorParam) {
                setError(errorDescription || errorParam)
                return
            }

            // PKCE flow: exchange code for session
            if (code) {
                console.log('[Hub AuthCallback] Exchanging code for session...')
                
                try {
                    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    
                    if (exchangeError) {
                        console.error('[Hub AuthCallback] Exchange error:', exchangeError)
                        
                        // Check if it's actually a "already used" error (user refreshed)
                        if (exchangeError.message.includes('code verifier')) {
                            // Check if we're already logged in
                            const { data: sessionData } = await supabase.auth.getSession()
                            if (sessionData?.session) {
                                console.log('[Hub AuthCallback] Already have session, redirecting...')
                                window.location.replace('/')
                                return
                            }
                            
                            setError('Session expired. Please try signing in again.')
                            setDebugInfo('The PKCE code verifier was not found.')
                            return
                        }
                        
                        setError(exchangeError.message)
                        return
                    }
                    
                    console.log('[Hub AuthCallback] Session established, redirecting NOW')
                    // Use replace instead of href to avoid back button issues
                    window.location.replace('/')
                    return
                    
                } catch (err: any) {
                    console.error('[Hub AuthCallback] Exception:', err)
                    setError(err.message || 'Unknown error')
                    return
                }
            }

            // No code - check if we already have a session
            const { data: sessionData } = await supabase.auth.getSession()
            if (sessionData?.session) {
                console.log('[Hub AuthCallback] Already have session, redirecting...')
                window.location.replace('/')
                return
            }

            // Implicit flow fallback: check hash for access_token
            const hash = window.location.hash
            if (hash && hash.includes('access_token')) {
                console.log('[Hub AuthCallback] Found access_token in hash')
                await supabase.auth.getSession()
                window.location.replace('/')
                return
            }

            // Last resort: redirect home after short delay
            console.log('[Hub AuthCallback] No auth data found, redirecting home...')
            setTimeout(() => {
                window.location.replace('/')
            }, 1000)
        }

        handleCallback()
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
                {debugInfo && (
                    <p style={{ fontSize: '0.8rem', color: '#888', maxWidth: '400px' }}>
                        {debugInfo}
                    </p>
                )}
                <a href="/" style={{ 
                    color: '#D4AF37', 
                    textDecoration: 'underline',
                    marginTop: '1rem'
                }}>
                    Return to Home
                </a>
                <button 
                    onClick={() => window.location.href = '/'}
                    style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #D4AF37, #B8960C)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0a0a0a',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    Try Again
                </button>
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
