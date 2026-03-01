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
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (error) {
        if (error.code === 'PGRST116') {
          const { data: created, error: insertError } = await supabase
            .from('profiles').insert({ id: userId, credits: 0 }).select().single()
          if (insertError && insertError.code !== '23505') return null
          if (created) return created
          const { data: refetched } = await supabase.from('profiles').select('*').eq('id', userId).single()
          return refetched
        }
        return null
      }
      return data
    } catch { return null }
  }

  const loadProfile = async (userId: string) => {
    if (fetchingProfile.current) return
    fetchingProfile.current = true
    try {
      const data = await fetchProfile(userId)
      if (data) setProfile(data)
    } finally { fetchingProfile.current = false }
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (currentSession?.user) {
          setUser(currentSession.user)
          setSession(currentSession)
          setTimeout(() => loadProfile(currentSession.user.id), 0)
        } else {
          setUser(null); setSession(null); setProfile(null)
        }
        setLoading(false)
        initialLoadDone.current = true
      } else if (event === 'SIGNED_OUT') {
        setUser(null); setSession(null); setProfile(null); setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && currentSession) {
        setSession(currentSession)
      }
    })

    const timeout = setTimeout(() => {
      if (!initialLoadDone.current && supabase) {
        supabase.auth.getSession().then(({ data }) => {
          if (data.session?.user) {
            setUser(data.session.user); setSession(data.session)
            loadProfile(data.session.user.id)
          }
          setLoading(false); initialLoadDone.current = true
        })
      }
    }, 3000)

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  const refreshProfile = async () => { 
    if (user) { 
      const data = await fetchProfile(user.id)
      if (data) setProfile(data) 
    } 
  }

  const signInWithGoogle = async () => {
    if (!supabase) throw new Error('Supabase not initialized')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } },
    })
    if (error) throw error
  }

  const signInWithEmail = async (email: string) => {
    if (!supabase) return { error: new Error('Supabase not initialized') }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    return { error: error as Error | null }
  }

  const signOut = async () => { 
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null); setProfile(null); setSession(null) 
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signInWithGoogle, signInWithEmail, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => { 
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context 
}
