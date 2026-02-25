import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing. Auth features disabled.')
}

const CHUNK_SIZE = 3000 // Safe size under 4096 limit

// Helper to get cookie value
const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
    return match ? decodeURIComponent(match[2]) : null
}

// Helper to set cookie
const setCookieRaw = (name: string, value: string, maxAge: number = 31536000) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=${encodeURIComponent(value)}; domain=.deepvortexai.art; path=/; max-age=${maxAge}; secure; samesite=lax`
}

// Helper to remove cookie
const removeCookieRaw = (name: string) => {
    if (typeof document === 'undefined') return
    document.cookie = `${name}=; domain=.deepvortexai.art; path=/; max-age=0; secure; samesite=lax`
}

// Chunked cookie storage to handle large JWT tokens
const customCookieStorage = {
    getItem: (key: string): string | null => {
        // First try to get it as a single cookie
        const singleValue = getCookie(key)
        if (singleValue) {
            return singleValue
        }

        // Try to get chunked cookies
        let result = ''
        let index = 0
        while (true) {
            const chunk = getCookie(`${key}.${index}`)
            if (!chunk) break
            result += chunk
            index++
        }

        if (result) {
            console.log(`[Hub Auth] Retrieved ${index} chunks for ${key}`)
            return result
        }

        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Getting ${key}: not found`)
        }
        return null
    },

    setItem: (key: string, value: string): void => {
        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Setting ${key}`)
        }

        // Remove any existing chunks first
        let i = 0
        while (getCookie(`${key}.${i}`)) {
            removeCookieRaw(`${key}.${i}`)
            i++
        }
        removeCookieRaw(key)

        // If value is small enough, store as single cookie
        if (value.length <= CHUNK_SIZE) {
            setCookieRaw(key, value)
            return
        }

        // Split into chunks
        const chunks = Math.ceil(value.length / CHUNK_SIZE)
        console.log(`[Hub Auth] Splitting ${key} into ${chunks} chunks`)
        
        for (let i = 0; i < chunks; i++) {
            const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
            setCookieRaw(`${key}.${i}`, chunk)
        }
    },

    removeItem: (key: string): void => {
        if (key.includes('code-verifier')) {
            console.log(`[Hub Auth] Removing ${key}`)
        }

        // Remove single cookie
        removeCookieRaw(key)

        // Remove any chunks
        let i = 0
        while (getCookie(`${key}.${i}`)) {
            removeCookieRaw(`${key}.${i}`)
            i++
        }
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
