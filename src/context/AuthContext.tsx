import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it with 3 default credits
          const newProfile = {
            id: userId,
            credits: 3,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()

          if (insertError) {
            console.error('Error creating profile:', insertError)
            return
          }

          setProfile(createdProfile)
        } else {
          console.error('Error fetching profile:', error)
        }
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    if (!supabase) {
      // Use a microtask to avoid synchronous setState warning
      Promise.resolve().then(() => setLoading(false))
      return
    }

    // Set a safety timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 5000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      clearTimeout(loadingTimeout)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    if (!supabase) {
      throw new Error('Supabase client not initialized')
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signInWithEmail = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase client not initialized') }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error('Error signing in with email:', error)
      return { error }
    }

    return { error: null }
  }

  const signOut = async () => {
    if (!supabase) return

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
