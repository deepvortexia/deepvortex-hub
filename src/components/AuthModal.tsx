import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import './AuthModal.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [emailSent, setEmailSent] = useState(false)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
      setMessage('Failed to sign in with Google. Please try again.')
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setMessage('Please enter your email')
      return
    }

    setLoading(true)
    setMessage('')

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    )

    try {
      const { error } = await Promise.race([signInWithEmail(email), timeout])
      if (error) {
        setMessage('Failed to send magic link. Please try again.')
      } else {
        setEmailSent(true)
        setMessage('Check your email for the magic link!')
      }
    } catch (err: any) {
      console.error('Error signing in:', err)
      if (err?.message === 'timeout') {
        setMessage('Request timed out. Please check your connection and try again.')
      } else {
        setMessage('Failed to send magic link. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="auth-modal-header">
          <h2>Welcome to Deep Vortex AI</h2>
          <p>Sign in to access your credits and favorites</p>
        </div>

        {!emailSent ? (
          <>
            <button
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <span className="google-icon">🔐</span>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleEmailSignIn} className="auth-email-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-email-input"
                disabled={loading}
              />
              <button type="submit" className="auth-email-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-success-message">
            <div className="success-icon">✓</div>
            <p>Magic link sent to {email}</p>
            <p className="success-subtitle">Check your inbox and click the link to sign in</p>
          </div>
        )}

        {message && !emailSent && (
          <div className="auth-message">{message}</div>
        )}
      </div>
    </div>
  )
}

export default AuthModal
