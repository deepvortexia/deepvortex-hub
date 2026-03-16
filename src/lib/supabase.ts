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

// Helper: get chunked cookie value
const getChunkedCookie = (key: string): string | null => {
    const singleValue = getCookie(key)
    if (singleValue) return singleValue

    let result = ''
    let index = 0
    while (true) {
        const chunk = getCookie(`${key}.${index}`)
        if (!chunk) break
        result += chunk
        index++
    }
    return result || null
}

// Helper: set chunked cookie value
const setChunkedCookie = (key: string, value: string): void => {
    let i = 0
    while (getCookie(`${key}.${i}`)) { removeCookieRaw(`${key}.${i}`); i++ }
    removeCookieRaw(key)

    if (value.length <= CHUNK_SIZE) {
        setCookieRaw(key, value)
        return
    }

    const chunks = Math.ceil(value.length / CHUNK_SIZE)
    for (let i = 0; i < chunks; i++) {
        const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
        setCookieRaw(`${key}.${i}`, chunk)
    }
}

// Helper: remove chunked cookie
const removeChunkedCookie = (key: string): void => {
    removeCookieRaw(key)
    let i = 0
    while (getCookie(`${key}.${i}`)) { removeCookieRaw(`${key}.${i}`); i++ }
}

// Chunked cookie storage with sessionStorage backup for PKCE code verifier.
// The code verifier must survive the OAuth redirect chain (app → Google → Supabase → app).
// Some browsers (Safari ITP, privacy extensions) can drop cross-domain cookies during
// this redirect chain, so we also store the verifier in sessionStorage as a reliable fallback.
const customCookieStorage = {
    getItem: (key: string): string | null => {
        if (key.includes('code-verifier')) {
            try {
                const ss = sessionStorage.getItem(key)
                if (ss) return ss
            } catch {}
        }

        return getChunkedCookie(key)
    },

    setItem: (key: string, value: string): void => {
        if (key.includes('code-verifier')) {
            try { sessionStorage.setItem(key, value) } catch {}
        }

        setChunkedCookie(key, value)
    },

    removeItem: (key: string): void => {
        if (key.includes('code-verifier')) {
            try { sessionStorage.removeItem(key) } catch {}
        }

        removeChunkedCookie(key)
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
    last_game_played_at: string | null
    created_at: string
    updated_at: string
}
