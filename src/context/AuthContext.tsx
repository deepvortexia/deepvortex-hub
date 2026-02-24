// src/context/AuthContext.tsx  (Hub — Vite/React)
import { createContext, useContext, useEffect, useState, useRef } from 'react'
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const initialLoadDone = useRef(false)
  const fetchingProfile = useRef(false)

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (!supabase) return null
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Créer le profil s'il n'existe pas
          const { data: created, error: insertError } = await supabase
            .from('profiles')
                        .insert({ id: userId, credits: 2 })
            .select()
            .single()
          if (insertError) { console.error('createProfile error:', insertError); return null }
          return created
        }
        console.error('fetchProfile error:', error)
        return null
      }
      return data
    } catch (err) {
      console.error('fetchProfile exception:', err)
      return null
    }
  }

  const loadProfile = async (userId: string) => {
    if (fetchingProfile.current) return
    fetchingProfile.current = true
    try {
      const data = await fetchProfile(userId)
      if (data) setProfile(data)
    } finally {
      fetchingProfile.current = false
    }
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // ✅ INITIAL_SESSION comme source de vérité unique
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Hub auth event:', event)

        if (event === 'INITIAL_SESSION') {
          if (currentSession?.user) {
            setUser(currentSession.user)
            setSession(currentSession)
            await loadProfile(currentSession.user.id)
          } else {
            setUser(null)
            setSession(null)
            setProfile(null)
          }
          setLoading(false)
          initialLoadDone.current = true

        } else if (event === 'SIGNED_IN' && currentSession?.user) {
          setUser(currentSession.user)
          setSession(currentSession)
          await loadProfile(currentSession.user.id)
          setLoading(false)

        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setProfile(null)
          setLoading(false)

        } else if (event === 'TOKEN_REFRESHED' && currentSession) {
          setSession(currentSession)
        }
      }
    )

    const timeout = setTimeout(() => {
      if (!initialLoadDone.current) {
        console.warn('Hub auth timeout')
        setLoading(false)
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      const data = await fetchProfile(user.id)
      if (data) setProfile(data)
    }
  }

  // ✅ redirectTo = hub lui-même (le hub gère son propre callback)
  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading,
      signInWithGoogle, signInWithEmail, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
