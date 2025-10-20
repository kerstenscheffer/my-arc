// src/modules/workout/components/pump-photos/CompactPhotoCard.jsx
import { useState, useEffect } from 'react'
import { Heart, Flame, Zap, Crown, Star, Trash2, User, MessageCircle, BarChart3 } from 'lucide-react'
import PhotoCommentsSection from './PhotoCommentsSection'
import ProgressComparisonModal from './ProgressComparisonModal'

const REACTIONS = [
  { type: 'fire', icon: Flame, color: '#f97316' },
  { type: 'strong', icon: Zap, color: '#eab308' },
  { type: 'beast', icon: Zap, color: '#8b5cf6' },
  { type: 'king', icon: Crown, color: '#f59e0b' }
]

export default function CompactPhotoCard({ photo, currentUser, db, onUpdate, delay = 0 }) {
  const isMobile = window.innerWidth <= 768
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(photo.like_count || 0)
  const [showReactions, setShowReactions] = useState(false)
  const [userReaction, setUserReaction] = useState(null)
  const [showHeart, setShowHeart] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(0)
  const [showProgressModal, setShowProgressModal] = useState(false)

  const isOwnPhoto = photo.client_id === currentUser?.id
  const isFeatured = photo.is_coach_highlight

  useEffect(() => {
    checkLikeStatus()
    checkReactionStatus()
    loadCommentCount()
  }, [photo.id, currentUser?.id])

  const loadCommentCount = async () => {
    try {
      const { count } = await db.getPhotoCommentCount(photo.id)
      setCommentCount(count || 0)
    } catch (error) {
      console.error('Load comment count error:', error)
    }
  }

  const checkLikeStatus = async () => {
    if (!currentUser?.id) return
    try {
      const { data } = await db.hasLikedPhoto(photo.id, currentUser.id)
      setIsLiked(data || false)
    } catch (error) {
      console.error('Check like error:', error)
    }
  }

  const checkReactionStatus = async () => {
    if (!currentUser?.id) return
    try {
      const { data } = await db.getUserReactions(photo.id, currentUser.id)
      if (data && data.length > 0) {
        setUserReaction(data[0].reaction_type)
      }
    } catch (error) {
      console.error('Check reaction error:', error)
    }
  }

  const handleDoubleTap = async () => {
    if (isLiked) return
    
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 1000)
    
    await handleLike()
  }

  const handleLike = async () => {
    if (!currentUser?.id) return
    
    try {
      if (isLiked) {
        await db.unlikePumpPhoto(photo.id, currentUser.id)
        setLikeCount(prev => Math.max(0, prev - 1))
        setIsLiked(false)
      } else {
        await db.likePumpPhoto(photo.id, currentUser.id)
        setLikeCount(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Like error:', error)
    }
  }

  const handleReaction = async (type) => {
    if (!currentUser?.id) return
    
    try {
      if (userReaction === type) {
        await db.removePhotoReaction(photo.id, currentUser.id, type)
        setUserReaction(null)
      } else {
        if (userReaction) {
          await db.removePhotoReaction(photo.id, currentUser.id, userReaction)
        }
        await db.addPhotoReaction(photo.id, currentUser.id, type)
        setUserReaction(type)
      }
      setShowReactions(false)
      onUpdate?.()
    } catch (error) {
      console.error('Reaction error:', error)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Weet je zeker dat je deze foto wilt verwijderen?')) return
    
    setIsDeleting(true)
    try {
      await db.deletePumpPhoto(photo.id)
      onUpdate?.()
    } catch (error) {
      console.error('Delete error:', error)
      setIsDeleting(false)
    }
  }

  const timeAgo = () => {
    const now = new Date()
    const posted = new Date(photo.created_at)
    const diffMs = now - posted
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays}d`
    if (diffHours > 0) return `${diffHours}u`
    if (diffMins > 0) return `${diffMins}m`
    return 'Nu'
  }

  return (
    <div
      style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(17, 17, 17, 0.8) 100%)',
        border: isFeatured 
          ? '2px solid rgba(251, 191, 36, 0.5)' 
          : '1px solid rgba(249, 115, 22, 0.2)',
        borderRadius: '0',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        animation: `slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms backwards`,
        opacity: isDeleting ? 0.5 : 1,
        pointerEvents: isDeleting ? 'none' : 'auto',
        boxShadow: isFeatured 
          ? '0 8px 40px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.15)' 
          : '0 4px 20px rgba(0, 0, 0, 0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
          e.currentTarget.style.boxShadow = isFeatured
            ? '0 12px 50px rgba(251, 191, 36, 0.4), 0 0 80px rgba(251, 191, 36, 0.2)'
            : '0 8px 30px rgba(249, 115, 22, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = isFeatured
            ? '0 8px 40px rgba(251, 191, 36, 0.3), 0 0 60px rgba(251, 191, 36, 0.15)'
            : '0 4px 20px rgba(0, 0, 0, 0.4)'
        }
      }}
    >
      {/* Top glow effect */}
      {isFeatured && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, transparent 0%, #fbbf24 50%, transparent 100%)',
          opacity: 0.8,
          animation: 'shimmer 2s ease-in-out infinite',
          zIndex: 2
        }} />
      )}

      {/* Featured Badge */}
      {isFeatured && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          zIndex: 3,
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.98) 0%, rgba(245, 158, 11, 0.98) 100%)',
          padding: '0.35rem 0.6rem',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          <Star size={14} color="#fff" fill="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
          <span style={{
            fontSize: '0.7rem',
            fontWeight: '800',
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Featured
          </span>
        </div>
      )}

      {/* Delete Button */}
      {isOwnPhoto && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 3,
            width: '36px',
            height: '36px',
            background: 'rgba(239, 68, 68, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            backdropFilter: 'blur(10px)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.15) rotate(5deg)'
            e.currentTarget.style.boxShadow = '0 6px 25px rgba(239, 68, 68, 0.6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.4)'
          }}
        >
          <Trash2 size={16} color="#fff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }} />
        </button>
      )}

      {/* Image - Double tap to like */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1',
          cursor: 'pointer',
          overflow: 'hidden'
        }}
        onDoubleClick={handleDoubleTap}
        onTouchStart={(e) => {
          const touch = e.touches[0]
          const lastTap = e.currentTarget.dataset.lastTap || 0
          const now = Date.now()
          if (now - lastTap < 300) {
            handleDoubleTap()
          }
          e.currentTarget.dataset.lastTap = now
        }}
      >
        <img
          src={photo.photo_url}
          alt="Pump photo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />

        {/* Double-tap heart animation */}
        {showHeart && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            animation: 'heartPop 1s cubic-bezier(0.4, 0, 0.2, 1) forwards'
          }}>
            <Heart 
              size={60} 
              color="#ef4444" 
              fill="#ef4444"
              style={{ filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))' }}
            />
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.95) 100%)',
          padding: '3rem 1rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          backdropFilter: 'blur(5px)'
        }}>
          {/* User info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '800',
              color: '#fff',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '0',
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: '800',
                boxShadow: '0 2px 10px rgba(249, 115, 22, 0.4)'
              }}>
                {photo.client?.first_name?.[0]}{photo.client?.last_name?.[0]}
              </div>
              {photo.client?.first_name || 'Unknown'} {photo.client?.last_name?.[0]}.
            </div>
            {photo.caption && (
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.8)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: '0.25rem',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
              }}>
                "{photo.caption}"
              </div>
            )}
            <div style={{
              fontSize: '0.65rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontWeight: '600',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)'
            }}>
              {timeAgo()}
            </div>
          </div>

          {/* Reaction button */}
          <button
            onClick={() => setShowReactions(!showReactions)}
            style={{
              background: userReaction 
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.4) 0%, rgba(234, 88, 12, 0.3) 100%)' 
                : 'rgba(0, 0, 0, 0.4)',
              border: userReaction
                ? '1px solid rgba(249, 115, 22, 0.6)'
                : '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0',
              padding: '0.4rem 0.6rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: userReaction
                ? '0 4px 15px rgba(249, 115, 22, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = userReaction
                ? '0 6px 20px rgba(249, 115, 22, 0.5)'
                : '0 4px 15px rgba(255, 255, 255, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = userReaction
                ? '0 4px 15px rgba(249, 115, 22, 0.3)'
                : '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
          >
            {userReaction ? (
              <>
                {REACTIONS.find(r => r.type === userReaction)?.icon && 
                  (() => {
                    const Icon = REACTIONS.find(r => r.type === userReaction).icon
                    return <Icon size={16} color={REACTIONS.find(r => r.type === userReaction).color} />
                  })()
                }
              </>
            ) : (
              <Flame size={16} color="rgba(255, 255, 255, 0.8)" />
            )}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        padding: '0.75rem 1rem',
        background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(249, 115, 22, 0.2)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        {/* Like button */}
        <button
          onClick={handleLike}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'none'
          }}
        >
          <Heart 
            size={18} 
            color={isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.6)'}
            fill={isLiked ? '#ef4444' : 'none'}
            style={{ 
              transition: 'all 0.3s ease',
              filter: isLiked ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))' : 'none'
            }}
          />
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            color: isLiked ? '#ef4444' : 'rgba(255, 255, 255, 0.6)'
          }}>
            {likeCount}
          </span>
        </button>

        {/* Comments button */}
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.5rem',
            borderRadius: '0',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            minHeight: '32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.background = 'rgba(249, 115, 22, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.background = 'none'
          }}
        >
          <MessageCircle 
            size={18} 
            color={showComments ? '#f97316' : 'rgba(255, 255, 255, 0.6)'}
            fill={showComments ? '#f97316' : 'none'}
            style={{ 
              transition: 'all 0.3s ease',
              filter: showComments ? 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.6))' : 'none'
            }}
          />
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '700',
            color: showComments ? '#f97316' : 'rgba(255, 255, 255, 0.6)'
          }}>
            {commentCount}
          </span>
        </button>

        {/* Progress comparison button (own photos only) */}
        {isOwnPhoto && (
          <button
            onClick={() => setShowProgressModal(true)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '0',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.background = 'none'
            }}
          >
            <BarChart3 
              size={18} 
              color="#10b981"
              style={{ filter: 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.4))' }}
            />
          </button>
        )}

        {/* Reaction counts */}
        {photo.reactions?.map((reaction, idx) => {
          const reactionConfig = REACTIONS.find(r => r.type === reaction.type)
          if (!reactionConfig) return null
          const Icon = reactionConfig.icon
          
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.25rem 0.4rem',
                background: `${reactionConfig.color}15`,
                borderRadius: '0',
                border: `1px solid ${reactionConfig.color}30`
              }}
            >
              <Icon 
                size={15} 
                color={reactionConfig.color}
                style={{ filter: `drop-shadow(0 0 4px ${reactionConfig.color}60)` }}
              />
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                color: reactionConfig.color
              }}>
                {reaction.count}
              </span>
            </div>
          )
        })}
      </div>

      {/* Comments Section - Expandable */}
      {showComments && (
        <PhotoCommentsSection
          photo={photo}
          currentUser={currentUser}
          isCoach={false} // Set based on actual role
          db={db}
          onUpdate={() => {
            loadCommentCount()
            onUpdate?.()
          }}
        />
      )}

      {/* Progress Comparison Modal */}
      {showProgressModal && (
        <ProgressComparisonModal
          client={currentUser}
          currentPhoto={photo}
          db={db}
          onClose={() => setShowProgressModal(false)}
        />
      )}

      {/* Reaction selector */}
      {showReactions && (
        <>
          <div
            onClick={() => setShowReactions(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 98
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '100%',
            right: '0.75rem',
            marginBottom: '0.5rem',
            background: 'rgba(17, 17, 17, 0.98)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '0',
            padding: '0.5rem',
            display: 'flex',
            gap: '0.5rem',
            zIndex: 99,
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
            animation: 'slideUpFast 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {REACTIONS.map((reaction) => {
              const Icon = reaction.icon
              return (
                <button
                  key={reaction.type}
                  onClick={() => handleReaction(reaction.type)}
                  style={{
                    background: userReaction === reaction.type
                      ? `${reaction.color}20`
                      : 'transparent',
                    border: userReaction === reaction.type
                      ? `1px solid ${reaction.color}40`
                      : '1px solid transparent',
                    borderRadius: '0',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    minWidth: '36px',
                    minHeight: '36px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.2)'
                    e.currentTarget.style.background = `${reaction.color}30`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.background = userReaction === reaction.type
                      ? `${reaction.color}20`
                      : 'transparent'
                  }}
                >
                  <Icon size={18} color={reaction.color} />
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUpFast {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heartPop {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
        }

        @keyframes shimmer {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}
