// src/modules/workout/components/pump-photos/PhotoCard.jsx
import { useState, useEffect } from 'react'
import { Heart, Flame, Zap, Crown, TrendingUp, Star, Trash2 } from 'lucide-react'

const REACTIONS = [
  { type: 'fire', icon: Flame, label: '🔥 Fire', color: '#f97316' },
  { type: 'strong', icon: Zap, label: '💪 Strong', color: '#10b981' },
  { type: 'beast', icon: TrendingUp, label: '⚡ Beast', color: '#8b5cf6' },
  { type: 'king', icon: Crown, label: '👑 King', color: '#eab308' }
]

export default function PhotoCard({ photo, currentUser, db, onUpdate, delay = 0 }) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(photo.like_count || 0)
  const [activeReactions, setActiveReactions] = useState([])
  const [showReactions, setShowReactions] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Progressive reveal
  useEffect(() => {
    setTimeout(() => setVisible(true), delay)
    checkLikeStatus()
    checkReactions()
  }, [])

  const checkLikeStatus = async () => {
    const { hasLiked } = await db.hasLikedPhoto(photo.id, currentUser.id)
    setLiked(hasLiked)
  }

  const checkReactions = async () => {
    const { reactions } = await db.getUserReactions(photo.id, currentUser.id)
    setActiveReactions(reactions)
  }

  const handleLike = async () => {
    if (liked) {
      // Unlike
      await db.unlikePumpPhoto(photo.id, currentUser.id)
      setLiked(false)
      setLikeCount(prev => prev - 1)
    } else {
      // Like
      await db.likePumpPhoto(photo.id, currentUser.id)
      setLiked(true)
      setLikeCount(prev => prev + 1)
      if (navigator.vibrate) navigator.vibrate(50)
    }
    onUpdate()
  }

  const handleReaction = async (reactionType) => {
    if (activeReactions.includes(reactionType)) {
      // Remove reaction
      await db.removePhotoReaction(photo.id, currentUser.id, reactionType)
      setActiveReactions(prev => prev.filter(r => r !== reactionType))
    } else {
      // Add reaction
      await db.addPhotoReaction(photo.id, currentUser.id, reactionType)
      setActiveReactions(prev => [...prev, reactionType])
      if (navigator.vibrate) navigator.vibrate(50)
    }
    onUpdate()
  }

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return
    
    setDeleting(true)
    try {
      await db.deletePumpPhoto(photo.id, photo.photo_url)
      onUpdate()
    } catch (error) {
      console.error('❌ Delete failed:', error)
      alert('Verwijderen mislukt')
      setDeleting(false)
    }
  }

  const isOwnPhoto = photo.client_id === currentUser.id
  const timeAgo = getTimeAgo(photo.created_at)

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
    >
      <div style={{
        background: 'rgba(0, 0, 0, 0.8)',
        border: photo.is_coach_highlight 
          ? '2px solid #eab308'
          : '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '0',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
      }}>
        {/* Coach Highlight Badge */}
        {photo.is_coach_highlight && (
          <div style={{
            position: 'absolute',
            top: '0.5rem',
            left: '0.5rem',
            background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            padding: '0.25rem 0.5rem',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            zIndex: 2,
            boxShadow: '0 2px 10px rgba(234, 179, 8, 0.5)'
          }}>
            <Star size={12} fill="#fff" color="#fff" />
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '700',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Coach Pick
            </span>
          </div>
        )}

        {/* Delete Button (own photos only) */}
        {isOwnPhoto && !deleting && (
          <button
            onClick={handleDelete}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              width: '32px',
              height: '32px',
              background: 'rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '0',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* Photo */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingTop: '100%',
          background: '#000'
        }}>
          <img
            src={photo.photo_url}
            alt={photo.caption || 'Pump photo'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>

        {/* Info Section */}
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* User Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <div>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                color: '#fff'
              }}>
                {photo.clients.first_name} {photo.clients.last_name}
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontWeight: '600'
              }}>
                {timeAgo}
              </div>
            </div>
          </div>

          {/* Caption */}
          {photo.caption && (
            <p style={{
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0 0 0.75rem 0',
              lineHeight: '1.4'
            }}>
              {photo.caption}
            </p>
          )}

          {/* Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.1)'
          }}>
            {/* Like Button */}
            <button
              onClick={handleLike}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                background: liked 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'rgba(249, 115, 22, 0.05)',
                border: '1px solid ' + (liked ? '#ef4444' : 'rgba(249, 115, 22, 0.2)'),
                borderRadius: '0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: '32px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Heart 
                size={16} 
                fill={liked ? '#ef4444' : 'none'}
                color={liked ? '#ef4444' : '#f97316'}
              />
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '700',
                color: liked ? '#ef4444' : '#f97316'
              }}>
                {likeCount}
              </span>
            </button>

            {/* Reactions Button */}
            <button
              onClick={() => setShowReactions(!showReactions)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
                borderRadius: '0',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: '32px',
                fontSize: '0.8rem',
                color: '#f97316',
                fontWeight: '700',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              🔥 {photo.fire_count || 0} 💪 {photo.strong_count || 0}
            </button>
          </div>

          {/* Reaction Buttons */}
          {showReactions && (
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '0.75rem',
              flexWrap: 'wrap'
            }}>
              {REACTIONS.map(({ type, icon: Icon, label, color }) => {
                const isActive = activeReactions.includes(type)
                return (
                  <button
                    key={type}
                    onClick={() => handleReaction(type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.4rem 0.75rem',
                      background: isActive 
                        ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
                        : 'rgba(249, 115, 22, 0.05)',
                      border: `1px solid ${isActive ? color : 'rgba(249, 115, 22, 0.2)'}`,
                      borderRadius: '0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '0.75rem',
                      color: isActive ? color : 'rgba(255, 255, 255, 0.7)',
                      fontWeight: '700',
                      minHeight: '32px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper function
function getTimeAgo(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const seconds = Math.floor((now - then) / 1000)
  
  if (seconds < 60) return 'Net nu'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m geleden`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}u geleden`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d geleden`
  return `${Math.floor(seconds / 604800)}w geleden`
}
