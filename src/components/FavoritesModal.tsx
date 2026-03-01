import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import './FavoritesModal.css'

interface FavoriteItem {
  id: string
  prompt: string
  image_url: string
  aspect_ratio: string | null
  created_at: string
}

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
  const { user, session } = useAuth()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !session?.access_token) return

    const fetchFavorites = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load favorites')
        setFavorites(data.favorites || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load favorites')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [isOpen, session])

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `favorite-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download. Right-click the image and choose "Save Image As..."')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fav-overlay" onClick={onClose}>
      <div className="fav-modal" onClick={(e) => e.stopPropagation()}>
        <button className="fav-close-btn" onClick={onClose} aria-label="Close">×</button>

        <div className="fav-header">
          <h2 className="fav-title">⭐ Your Favorites</h2>
          {!loading && !error && (
            <p className="fav-count">
              {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
            </p>
          )}
        </div>

        <div className="fav-body">
          {!user ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">🔐</div>
              <p>Sign in to view your favorites</p>
            </div>
          ) : loading ? (
            <div className="fav-loading">
              <div className="fav-spinner" />
              <p>Loading favorites...</p>
            </div>
          ) : error ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">⚠️</div>
              <p>{error}</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="fav-empty">
              <div className="fav-empty-icon">📭</div>
              <p>No favorites yet</p>
              <p className="fav-empty-hint">
                Generate images or emoticons and tap ⭐ to save them here.
              </p>
            </div>
          ) : (
            <div className="fav-grid">
              {favorites.map((item) => (
                <div key={item.id} className="fav-card">
                  <div className="fav-img-wrap">
                    <img
                      src={item.image_url}
                      alt={item.prompt}
                      className="fav-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="fav-card-body">
                    <p className="fav-prompt" title={item.prompt}>{item.prompt}</p>
                    <p className="fav-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="fav-card-actions">
                    <button
                      className="fav-dl-btn"
                      onClick={() => handleDownload(item.image_url)}
                    >
                      📥 Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
