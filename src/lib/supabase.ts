import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Auth features disabled.')
}

// Helper to get cookie value
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
}

// Helper to set cookie with cross-domain support
const setCookie = (name: string, value: string, maxAge: number = 31536000) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${encodeURIComponent(value)}; domain=.deepvortexai.art; path=/; max-age=${maxAge}; secure; samesite=lax`
}

// Helper to remove cookie
const removeCookie = (name: string) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=; domain=.deepvortexai.art; path=/; max-age=0; secure; samesite=lax`
}

// FIXED: Proper storage implementation that handles PKCE code_verifier correctly
const customCookieStorage = {
    getItem: (key: string): string | null => {
        const value = getCookie(key)
        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Getting ${key}:`, value ? 'found' : 'not found')
        }
        return value
    },
    setItem: (key: string, value: string): void => {
        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Setting ${key}`)
        }
        setCookie(key, value)
    },
    removeItem: (key: string): void => {
        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Removing ${key}`)
        }
        removeCookie(key)
    }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce',
            storageKey: 'deepvortex-auth',
            storage: customCookieStorage,
        }
  })
  : null

export interface Profile {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
    credits: number
    created_at: string
    updated_at: string
}
