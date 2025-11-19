// src/modules/coach-command-center/modules/CoachNotes.jsx
// CoachNotes Component - Quick note taking and recent notes view for Command Center
// Uses existing NotesService from src/modules/notes/NotesService.js

import React, { useState, useEffect } from 'react'
import { MessageSquare, Send, ChevronDown, ChevronUp, Clock, CheckCircle, AlertCircle, Tag, Trash2 } from 'lucide-react'
import NotesService from '../../notes/NotesService'

export default function CoachNotes({ clientId, clientName, db, isMobile }) {
  const [notesService] = useState(() => new NotesService(db))
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  
  // Quick note state
  const [noteInput, setNoteInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('session')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    loadNotes()
  }, [clientId])

  const loadNotes = async () => {
    console.log('📝 [CoachNotes] Loading notes for client:', clientId)
    setLoading(true)
    
    try {
      const data = await notesService.getRecentNotes(clientId, showAll ? 50 : 5)
      console.log('✅ [CoachNotes] Loaded', data.length, 'notes')
      setNotes(data)
    } catch (error) {
      console.error('❌ [CoachNotes] Error loading notes:', error)
      setNotes([])
    }
    
    setLoading(false)
  }

  const handleSendNote = async () => {
    if (!noteInput.trim()) return

    console.log('📝 [CoachNotes] Creating note:', { category: selectedCategory, content: noteInput })
    setSending(true)
    setFeedback(null)

    try {
      await notesService.createNote(clientId, {
        title: noteInput.substring(0, 50) + (noteInput.length > 50 ? '...' : ''),
        category: selectedCategory,
        content: { sections: [{ type: 'text', content: noteInput }] },
        priority: 'medium',
        status: 'active'
      })

      console.log('✅ [CoachNotes] Note created successfully')
      
      // Success feedback
      setFeedback({ type: 'success', message: '✅ Note saved!' })
      setNoteInput('')
      
      // Reload notes
      await loadNotes()

      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000)

    } catch (error) {
      console.error('❌ [CoachNotes] Error creating note:', error)
      setFeedback({ type: 'error', message: '❌ Failed to save note' })
      setTimeout(() => setFeedback(null), 3000)
    }

    setSending(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSendNote()
    }
  }

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return

    try {
      await notesService.deleteNote(noteId)
      console.log('✅ [CoachNotes] Note deleted')
      await loadNotes()
    } catch (error) {
      console.error('❌ [CoachNotes] Error deleting note:', error)
    }
  }

  const getCategoryColor = (category) => {
    switch(category) {
      case 'session': return '#10b981'
      case 'todo': return '#f59e0b'
      case 'contact': return '#3b82f6'
      case 'issue': return '#ef4444'
      case 'goal': return '#8b5cf6'
      case 'win': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'session': return '💬'
      case 'todo': return '📋'
      case 'contact': return '📞'
      case 'issue': return '⚠️'
      case 'goal': return '🎯'
      case 'win': return '🎉'
      default: return '📝'
    }
  }

  const getTimeAgo = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}m ago`
  }

  const lastContactDate = notes.length > 0 && notes.find(n => n.category === 'session' || n.category === 'contact')
    ? new Date(notes.find(n => n.category === 'session' || n.category === 'contact').created_at)
    : null

  const categories = [
    { id: 'session', label: 'Session', icon: '💬' },
    { id: 'todo', label: 'Todo', icon: '📋' },
    { id: 'contact', label: 'Contact', icon: '📞' },
    { id: 'issue', label: 'Issue', icon: '⚠️' },
    { id: 'win', label: 'Win', icon: '🎉' }
  ]

  if (loading) {
    return (
      <div style={{
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.875rem' : '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          color: '#10b981',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600',
          marginBottom: '0.75rem'
        }}>
          <MessageSquare size={isMobile ? 16 : 18} />
          Coach Notes
        </div>
        <div style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.5)',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          padding: '1rem'
        }}>
          Loading notes...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '0.875rem' : '1rem'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.5rem' : '0.625rem',
          color: '#10b981',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontWeight: '600'
        }}>
          <MessageSquare size={isMobile ? 16 : 18} />
          Coach Notes
        </div>
        
        {/* Last Contact Indicator */}
        {lastContactDate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Clock size={12} />
            Last: {getTimeAgo(lastContactDate)}
          </div>
        )}
      </div>

      {/* QUICK NOTE INPUT */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '8px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        marginBottom: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Category Selector */}
        <div style={{
          display: 'flex',
          gap: '0.375rem',
          marginBottom: '0.625rem',
          flexWrap: 'wrap'
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                background: selectedCategory === cat.id 
                  ? getCategoryColor(cat.id)
                  : 'rgba(255, 255, 255, 0.05)',
                border: selectedCategory === cat.id
                  ? `1px solid ${getCategoryColor(cat.id)}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: selectedCategory === cat.id ? '#000' : 'rgba(255, 255, 255, 0.7)',
                padding: '0.3rem 0.5rem',
                borderRadius: '6px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!isMobile && selectedCategory !== cat.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile && selectedCategory !== cat.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <textarea
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Add a ${selectedCategory} note for ${clientName}...`}
          disabled={sending}
          style={{
            width: '100%',
            minHeight: isMobile ? '70px' : '80px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: isMobile ? '0.625rem' : '0.75rem',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '0.625rem'
          }}
        />

        {/* Send Button + Feedback */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            {noteInput.length}/500 • {isMobile ? 'Cmd' : 'Ctrl'}+Enter to send
          </div>

          <button
            onClick={handleSendNote}
            disabled={!noteInput.trim() || sending || noteInput.length > 500}
            style={{
              background: (!noteInput.trim() || sending || noteInput.length > 500)
                ? 'rgba(255, 255, 255, 0.1)'
                : '#10b981',
              border: 'none',
              color: (!noteInput.trim() || sending || noteInput.length > 500)
                ? 'rgba(255, 255, 255, 0.3)'
                : '#000',
              padding: '0.5rem 0.875rem',
              borderRadius: '6px',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '600',
              cursor: (!noteInput.trim() || sending || noteInput.length > 500)
                ? 'not-allowed'
                : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.2s',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {sending ? (
              <>
                <div style={{
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Saving...
              </>
            ) : (
              <>
                <Send size={14} />
                Save Note
              </>
            )}
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div style={{
            marginTop: '0.625rem',
            padding: '0.5rem',
            borderRadius: '6px',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '600',
            background: feedback.type === 'success' 
              ? 'rgba(16, 185, 129, 0.15)' 
              : 'rgba(239, 68, 68, 0.15)',
            color: feedback.type === 'success' ? '#10b981' : '#ef4444',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {feedback.message}
          </div>
        )}
      </div>

      {/* RECENT NOTES TIMELINE */}
      <div>
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>Recent Notes ({notes.length})</span>
          {notes.length > 5 && (
            <button
              onClick={() => {
                setShowAll(!showAll)
                if (!showAll) loadNotes()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#10b981',
                cursor: 'pointer',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.25rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {showAll ? (
                <>Show Less <ChevronUp size={12} /></>
              ) : (
                <>View All <ChevronDown size={12} /></>
              )}
            </button>
          )}
        </div>

        {notes.length === 0 ? (
          <div style={{
            padding: isMobile ? '1.5rem 1rem' : '2rem 1rem',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.8rem' : '0.85rem'
          }}>
            No notes yet. Add your first note above! 📝
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '0.5rem' : '0.625rem'
          }}>
            {notes.slice(0, showAll ? notes.length : 5).map((note, index) => (
              <div
                key={note.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: isMobile ? '0.625rem' : '0.75rem',
                  transition: 'all 0.2s'
                }}
              >
                {/* Note Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  {/* Category Badge + Time */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      background: `${getCategoryColor(note.category)}20`,
                      border: `1px solid ${getCategoryColor(note.category)}40`,
                      color: getCategoryColor(note.category),
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {getCategoryIcon(note.category)} {note.category}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                      {getTimeAgo(note.created_at)}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.3)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px',
                      minHeight: '36px',
                      minWidth: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Note Content */}
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  lineHeight: '1.5'
                }}>
                  {note.title}
                </div>

                {/* Priority/Tags if present */}
                {(note.priority && note.priority !== 'medium') && (
                  <div style={{
                    marginTop: '0.5rem',
                    display: 'flex',
                    gap: '0.375rem',
                    alignItems: 'center'
                  }}>
                    {note.priority === 'high' && (
                      <div style={{
                        fontSize: isMobile ? '0.65rem' : '0.7rem',
                        color: '#ef4444',
                        background: 'rgba(239, 68, 68, 0.1)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        fontWeight: '600'
                      }}>
                        ⚠️ HIGH
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
