// src/modules/workout/components/pump-photos/PhotoCommentsSection.jsx
import { useState, useEffect, useRef } from 'react'
import { Send, Shield, Trash2, MessageCircle } from 'lucide-react'

export default function PhotoCommentsSection({ photo, currentUser, isCoach = false, db, onUpdate }) {
  const isMobile = window.innerWidth <= 768
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    loadComments()
  }, [photo.id])

  const loadComments = async () => {
    try {
      const { data } = await db.getPhotoComments(photo.id)
      setComments(data || [])
    } catch (error) {
      console.error('Load comments error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendComment = async () => {
    if (!newComment.trim() || sending) return

    setSending(true)
    try {
      const commenterType = isCoach ? 'coach' : 'client'
      
      await db.addPhotoComment(
        photo.id,
        currentUser.id,
        commenterType,
        newComment.trim()
      )

      setNewComment('')
      await loadComments()
      onUpdate?.()
      
      // Scroll to bottom
      setTimeout(() => {
        const container = inputRef.current?.parentElement?.parentElement
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Send comment error:', error)
    } finally {
      setSending(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Weet je zeker dat je deze reactie wilt verwijderen?')) return

    try {
      await db.deletePhotoComment(commentId)
      await loadComments()
      onUpdate?.()
    } catch (error) {
      console.error('Delete comment error:', error)
    }
  }

  const formatTimeAgo = (dateString) => {
    const now = new Date()
    const posted = new Date(dateString)
    const diffMs = now - posted
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays}d geleden`
    if (diffHours > 0) return `${diffHours}u geleden`
    if (diffMins > 0) return `${diffMins}m geleden`
    return 'Net geplaatst'
  }

  return (
    <div style={{
      background: 'rgba(23, 23, 23, 0.6)',
      borderTop: '1px solid rgba(249, 115, 22, 0.1)',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderBottom: '1px solid rgba(249, 115, 22, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <MessageCircle size={isMobile ? 16 : 18} color="#f97316" />
        <span style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '700',
          color: '#f97316',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Reacties ({comments.length})
        </span>
      </div>

      {/* Comments List */}
      <div style={{
        maxHeight: isMobile ? '200px' : '250px',
        overflowY: 'auto',
        padding: isMobile ? '0.75rem' : '1rem'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '2px solid rgba(249, 115, 22, 0.2)',
              borderTopColor: '#f97316',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : comments.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '1.5rem 1rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.85rem' : '0.9rem'
          }}>
            Nog geen reacties. Wees de eerste! 💬
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.75rem' : '1rem'
          }}>
            {comments.map((comment) => {
              const isOwnComment = comment.commenter_id === currentUser.id
              const isCoachComment = comment.commenter_type === 'coach'
              
              return (
                <div
                  key={comment.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    animation: 'slideIn 0.3s ease'
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: isMobile ? '32px' : '36px',
                    height: isMobile ? '32px' : '36px',
                    borderRadius: '0',
                    background: isCoachComment 
                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                      : 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                    border: isCoachComment 
                      ? '2px solid rgba(249, 115, 22, 0.5)'
                      : '1px solid rgba(249, 115, 22, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isCoachComment 
                      ? '0 4px 15px rgba(249, 115, 22, 0.3)'
                      : 'none'
                  }}>
                    {isCoachComment ? (
                      <Shield size={isMobile ? 16 : 18} color="#fff" />
                    ) : (
                      <span style={{
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        fontWeight: '700',
                        color: isCoachComment ? '#fff' : '#f97316'
                      }}>
                        {comment.commenter?.first_name?.[0]}{comment.commenter?.last_name?.[0]}
                      </span>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem',
                      flexWrap: 'wrap'
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: '700',
                        color: '#fff'
                      }}>
                        {comment.commenter?.first_name} {comment.commenter?.last_name}
                      </span>
                      
                      {isCoachComment && (
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                          borderRadius: '0',
                          color: '#f97316',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <Shield size={10} />
                          Coach
                        </span>
                      )}
                      
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>

                    {/* Comment Text */}
                    <div style={{
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      marginBottom: isOwnComment ? '0.25rem' : 0
                    }}>
                      {comment.comment_text}
                    </div>

                    {/* Delete Button (own comments only) */}
                    {isOwnComment && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'rgba(239, 68, 68, 0.6)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          padding: '0.25rem 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#ef4444'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'rgba(239, 68, 68, 0.6)'
                        }}
                      >
                        <Trash2 size={12} />
                        Verwijder
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderTop: '1px solid rgba(249, 115, 22, 0.1)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-end'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendComment()
            }
          }}
          placeholder={isCoach ? "Geef feedback als coach..." : "Schrijf een reactie..."}
          disabled={sending}
          style={{
            flex: 1,
            padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(249, 115, 22, 0.2)',
            borderRadius: '0',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            outline: 'none',
            transition: 'all 0.3s ease',
            minHeight: '44px'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.4)'
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = '1px solid rgba(249, 115, 22, 0.2)'
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
          }}
        />
        
        <button
          onClick={handleSendComment}
          disabled={!newComment.trim() || sending}
          style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            borderRadius: '0',
            background: newComment.trim() && !sending
              ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
              : 'rgba(249, 115, 22, 0.2)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: newComment.trim() && !sending ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: newComment.trim() && !sending
              ? '0 4px 15px rgba(249, 115, 22, 0.3)'
              : 'none',
            opacity: sending ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (newComment.trim() && !sending) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (newComment.trim() && !sending) {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 115, 22, 0.3)'
            }
          }}
        >
          {sending ? (
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : (
            <Send size={isMobile ? 18 : 20} color="#fff" />
          )}
        </button>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
