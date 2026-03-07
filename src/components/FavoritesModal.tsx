import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './FavoritesModal.css'

interface FavoriteItem {
  id: string
  user_id: string
  tool_type: string
  result_url: string
  prompt: string | null
  metadata: Record<string, unknown>
  created_at: string
}

type GroupedFavorites = {
  emoticon: FavoriteItem[]
  image: FavoriteItem[]
  'bg-remover': FavoriteItem[]
  upscaler: FavoriteItem[]
  voice: FavoriteItem[]
  '3d': FavoriteItem[]
}

const GROUP_META: { key: keyof GroupedFavorites; label: string }[] = [
  { key: 'image',      label: '🎨 Images' },
  { key: 'emoticon',   label: '🎭 Emoticons' },
  { key: 'bg-remover', label: '✂️ Background Removed' },
  { key: 'upscaler',   label: '⬆️ Upscaled' },
  { key: 'voice',      label: '🎙️ Voice' },
  { key: '3d',         label: '🧊 3D Models' },
]

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
  const [grouped, setGrouped] = useState<GroupedFavorites>({
    emoticon: [], image: [], 'bg-remover': [], upscaler: [], voice: [], '3d': [],
  })
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !supabase) return

    const fetchFavorites = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: { user }, error: userErr } = await supabase!.auth.getUser()
        if (userErr || !user) {
          setError('Sign in to view your favorites')
          return
        }

        const { data, error: fetchErr } = await supabase!
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchErr) throw new Error(fetchErr.message)

        const items = (data || []) as FavoriteItem[]
        const g: GroupedFavorites = {
          emoticon: [], image: [], 'bg-remover': [], upscaler: [], voice: [], '3d': [],
        }
        for (const item of items) {
          if (item.tool_type in g) {
            g[item.tool_type as keyof GroupedFavorites].push(item)
          }
        }
        setGrouped(g)
        setTotalCount(items.length)
      } catch (err: any) {
        setError(err.message || 'Failed to load favorites')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [isOpen])

  if (!isOpen) return null

  const hasAny = totalCount > 0

  return (
    <div className="fav-overlay" onClick={onClose}>
      <div className="fav-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fav-close-btn" onClick={onClose} aria-label="Close">×</button>

        <div className="fav-header">
          <h2 className="fav-title">⭐ Your Favorites</h2>
          {!loading && !error && (
            <p className="fav-count">
              {totalCount} {totalCount === 1 ? 'item' : 'items'} saved
            </p>
          )}
        </div>

        <div className="fav-body">
          {loading ? (
            <div className="fav-loading">
              <div className="fav-spinner" />
              <p>Loading favorites...</p>
            </div>
          ) : error ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : !hasAny ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">📭</div>
              <p>No favorites yet</p>
              <p className="fav-empty-hint">
                Generate images, emoticons, or audio and tap ⭐ to save them here.
              </p>
            </div>
          ) : (
            GROUP_META.map(({ key, label }) => {
              const items = grouped[key]
              if (items.length === 0) return null
              return (
                <div key={key} className="fav-group">
                  <h3 className="fav-group-heading">{label}</h3>
                  <div className="fav-grid">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="fav-card"
                        onClick={() => window.open(item.result_url, '_blank')}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="fav-img-wrap">
                          {key === 'voice' ? (
                            <div className="fav-audio-wrap">
                              <audio
                                controls
                                src={item.result_url}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : key === '3d' ? (
                            <>
                              <video
                                src={item.result_url}
                                className="fav-img"
                                muted
                                loop
                                playsInline
                                onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                                onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()}
                              />
                              {item.metadata?.glb_url && (
                                <span className="fav-glb-badge">GLB</span>
                              )}
                            </>
                          ) : (
                            <img
                              src={item.result_url}
                              alt={item.prompt || ''}
                              className="fav-img"
                              loading="lazy"
                            />
                          )}
                        </div>
                        {item.prompt && (
                          <div className="fav-card-body">
                            <p className="fav-prompt" title={item.prompt}>{item.prompt}</p>
                            <p className="fav-date">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {!item.prompt && (
                          <div className="fav-card-body">
                            <p className="fav-date">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
