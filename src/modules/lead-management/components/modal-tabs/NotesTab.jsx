import { useState, useEffect } from 'react'
import { MessageSquare, Plus, Clock, User, Send } from 'lucide-react'

export default function NotesTab({ lead, leadService, coachId, isMobile }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({
    type: 'general',
    subject: '',
    content: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const noteTypes = [
    { value: 'general', label: 'Algemeen', color: '#3b82f6' },
    { value: 'call', label: 'Telefoongesprek', color: '#10b981' },
    { value: 'email', label: 'Email', color: '#f97316' },
    { value: 'meeting', label: 'Meeting', color: '#8b5cf6' },
    { value: 'follow-up', label: 'Follow-up', color: '#ef4444' }
  ]

  useEffect(() => {
    loadNotes()
  }, [lead.id])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const data = await leadService.getLeadNotes(lead.id)
      setNotes(data)
    } catch (error) {
      console.error('❌ Load notes failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return

    setSubmitting(true)
    try {
      await leadService.addLeadNote(lead.id, newNote, coachId)
      setNewNote({ type: 'general', subject: '', content: '' })
      setShowAddNote(false)
      await loadNotes()
    } catch (error) {
      console.error('❌ Add note failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getNoteTypeConfig = (type) => {
    return noteTypes.find(t => t.value === type) || noteTypes[0]
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Add Note Button */}
      {!showAddNote && (
        <button
          onClick={() => setShowAddNote(true)}
          style={{
            padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            color: '#10b981',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          <Plus size={18} />
          Nieuwe notitie toevoegen
        </button>
      )}

      {/* Add Note Form */}
      {showAddNote && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {/* Note Type */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Type notitie
              </label>
              <select
                value={newNote.type}
                onChange={(e) => setNewNote({ ...newNote, type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                  minHeight: '44px'
                }}
              >
                {noteTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject (Optional) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Onderwerp (optioneel)
              </label>
              <input
                type="text"
                value={newNote.subject}
                onChange={(e) => setNewNote({ ...newNote, subject: e.target.value })}
                placeholder="Bijv. 'Eerste kennismaking'"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  minHeight: '44px'
                }}
              />
            </div>

            {/* Content */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem',
                fontWeight: '500'
              }}>
                Notitie *
              </label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                placeholder="Voeg hier je notitie toe..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowAddNote(false)
                  setNewNote({ type: 'general', subject: '', content: '' })
                }}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                Annuleren
              </button>
              <button
                onClick={handleAddNote}
                disabled={submitting || !newNote.content.trim()}
                style={{
                  padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                  background: submitting || !newNote.content.trim()
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: submitting || !newNote.content.trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  opacity: submitting || !newNote.content.trim() ? 0.7 : 1
                }}
              >
                <Send size={16} />
                {submitting ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center'
        }}>
          <MessageSquare size={48} style={{ opacity: 0.3 }} />
          <div>
            <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Nog geen notities
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Voeg je eerste notitie toe om bij te houden
            </p>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {notes.map((note) => {
            const typeConfig = getNoteTypeConfig(note.note_type)
            return (
              <div
                key={note.id}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px'
                }}
              >
                {/* Note Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem',
                  gap: '1rem'
                }}>
                  <div style={{ flex: 1 }}>
                    {/* Type Badge */}
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.35rem 0.75rem',
                      background: `${typeConfig.color}15`,
                      border: `1px solid ${typeConfig.color}40`,
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: typeConfig.color,
                      marginBottom: note.subject ? '0.5rem' : '0'
                    }}>
                      {typeConfig.label}
                    </div>

                    {/* Subject */}
                    {note.subject && (
                      <h4 style={{
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        fontWeight: '600',
                        color: '#fff',
                        margin: '0.5rem 0 0 0'
                      }}>
                        {note.subject}
                      </h4>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}>
                    <Clock size={12} />
                    <span>
                      {new Date(note.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Note Content */}
                <p style={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  margin: 0,
                  whiteSpace: 'pre-wrap'
                }}>
                  {note.content}
                </p>

                {/* Author (if needed) */}
                {note.coach_id && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.8rem'
                  }}>
                    <User size={12} />
                    <span>Door coach</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
