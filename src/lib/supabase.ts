import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing. Auth features disabled.')
}

// 🌉 CRÉATION DU PONT MAGIQUE (Cookie partagé)
const customCookieStorage = {
  getItem: (key: string) => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + key + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  },
  setItem: (key: string, value: string) => {
    if (typeof document === 'undefined') return;
    // Le '.deepvortexai.art' autorise le Hub, Images, et Emoticons à lire la session
    document.cookie = `${key}=${encodeURIComponent(value)}; domain=.deepvortexai.art; path=/; max-age=31536000; secure; samesite=lax`;
  },
  removeItem: (key: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; domain=.deepvortexai.art; path=/; max-age=0; secure; samesite=lax`;
  }
};

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // ⚠️ TRÈS IMPORTANT : La clé doit être la même sur tes 3 sites
        storageKey: 'deepvortex-auth',
        // On active le partage de session
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
