// src/coach/tabs/client-info/NotesInfoTab.jsx
import { useState, useEffect, useRef } from 'react'
import { 
  Plus, X, Search, Filter, Calendar, Tag, 
  FileText, CheckSquare, Target, AlertCircle, 
  MessageSquare, TrendingUp, Clock, Lightbulb,
  Phone, ChevronLeft, ChevronRight, Edit2, Trash2,
  Save, Archive, ChevronDown, ChevronUp
} from 'lucide-react'
import NotesService from '../../../modules/notes/NotesService'

// Category configuration
const CATEGORIES = [
  { id: 'session', label: 'Session', icon: FileText, color: '#10b981' },
  { id: 'todo', label: 'To-Do', icon: CheckSquare, color: '#3b82f6' },
  { id: 'goal', label: 'Goal', icon: Target, color: '#f59e0b' },
  { id: 'struggle', label: 'Struggle', icon: AlertCircle, color: '#ef4444' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#8b5cf6' },
  { id: 'tracking', label: 'Tracking', icon: TrendingUp, color: '#06b6d4' },
  { id: 'reminder', label: 'Reminder', icon: Clock, color: '#ec4899' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: '#fbbf24' },
  { id: 'call', label: 'Call', icon: Phone, color: '#10b981' }
]

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
  { id: 'high', label: 'High', color: '#f59e0b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'low', label: 'Low', color: '#6b7280' }
]

export default function NotesInfoTab({ db, client, isMobile }) {
  const [notes, setNotes] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [selectedNote, setSelectedNote] = useState(null)
  const [showNewNote, setShowNewNote] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [templates, setTemplates] = useState([])
  const [tags, setTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // Local edit state for the selected note
  const [editingNote, setEditingNote] = useState(null)
  
  const service = new NotesService(db)
  
  // New note form state
  const [newNote, setNewNote] = useState({
    title: '',
    subtitle: '',
    category: 'session',
    priority: 'medium',
    date: new Date().toISOString().split('T')[0],
    tags: [],
    content: { sections: [] }
  })
  
  // Load data on mount and client change
  useEffect(() => {
    if (client?.id) {
      loadNotes()
      loadTemplates()
      loadTags()
    }
  }, [client?.id])
  
  // Filter notes when search or category changes
  useEffect(() => {
    filterNotes()
  }, [notes, searchQuery, selectedCategory])
  
  // Initialize editing note when selected note changes
  useEffect(() => {
    if (selectedNote) {
      setEditingNote(JSON.parse(JSON.stringify(selectedNote))) // Deep clone
      setHasChanges(false)
    }
  }, [selectedNote])
  
  const loadNotes = async () => {
    setLoading(true)
    try {
      const notesData = await service.getNotes(client.id)
      setNotes(notesData)
    } catch (error) {
      console.error('Error loading notes:', error)
      setNotes([])
    } finally {
      setLoading(false)
    }
  }
  
  const loadTemplates = async () => {
    try {
      const templatesData = await service.getTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }
  
  const loadTags = async () => {
    try {
      const tagsData = await service.getTags()
      setTags(tagsData)
    } catch (error) {
      console.error('Error loading tags:', error)
    }
  }
  
  const filterNotes = () => {
    let filtered = [...notes]
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(note => note.category === selectedCategory)
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.subtitle?.toLowerCase().includes(query) ||
        JSON.stringify(note.content).toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    setFilteredNotes(filtered)
  }
  
  const handleCreateNote = async () => {
    if (!newNote.title) {
      alert('Please enter a title')
      return
    }
    
    try {
      const created = await service.createNote(client.id, newNote)
      setNotes([created, ...notes])
      setShowNewNote(false)
      resetNewNote()
      setSelectedNote(created)
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Error creating note: ' + error.message)
    }
  }
  
  const handleSaveNote = async () => {
    if (!editingNote || !hasChanges) return
    
    setSaving(true)
    try {
      const updated = await service.updateNote(editingNote.id, editingNote)
      setNotes(notes.map(n => n.id === editingNote.id ? updated : n))
      setSelectedNote(updated)
      setHasChanges(false)
      alert('✅ Note saved successfully!')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('❌ Error saving note: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return
    
    try {
      await service.deleteNote(noteId)
      setNotes(notes.filter(n => n.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        setEditingNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('Error deleting note: ' + error.message)
    }
  }
  
  const handleAddSection = () => {
    if (!editingNote) return
    
    const newSection = {
      id: `section_${Date.now()}`,
      type: 'text',
      title: 'New Section',
      content: '',
      timestamp: new Date().toISOString()
    }
    
    const updatedNote = {
      ...editingNote,
      content: {
        ...editingNote.content,
        sections: [...(editingNote.content?.sections || []), newSection]
      }
    }
    
    setEditingNote(updatedNote)
    setHasChanges(true)
  }
  
  const handleUpdateSection = (sectionId, updates) => {
    if (!editingNote) return
    
    const updatedSections = editingNote.content.sections.map(s =>
      s.id === sectionId ? { ...s, ...updates } : s
    )
    
    setEditingNote({
      ...editingNote,
      content: {
        ...editingNote.content,
        sections: updatedSections
      }
    })
    setHasChanges(true)
  }
  
  const handleDeleteSection = (sectionId) => {
    if (!editingNote) return
    
    const updatedSections = editingNote.content.sections.filter(s => s.id !== sectionId)
    
    setEditingNote({
      ...editingNote,
      content: {
        ...editingNote.content,
        sections: updatedSections
      }
    })
    setHasChanges(true)
  }
  
  const resetNewNote = () => {
    setNewNote({
      title: '',
      subtitle: '',
      category: 'session',
      priority: 'medium',
      date: new Date().toISOString().split('T')[0],
      tags: [],
      content: { sections: [] }
    })
  }
  
  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }
  
  const getPriorityInfo = (priorityId) => {
    return PRIORITIES.find(p => p.id === priorityId) || PRIORITIES[2]
  }
  
  // Main list view when no note is selected
  const renderNotesList = () => (
    <div>
      {/* Header with search and filters */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Search bar */}
        <div style={{
          position: 'relative'
        }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.4)'
          }} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1rem 0.875rem 3rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              outline: 'none',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
        </div>
        
        {/* Category filters */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: '0.25rem'
        }}>
          <button
            onClick={() => setSelectedCategory('')}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
              background: !selectedCategory 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${!selectedCategory ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '8px',
              color: !selectedCategory ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: !selectedCategory ? '600' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            All Notes
          </button>
          
          {CATEGORIES.map(cat => {
            const Icon = cat.icon
            const count = notes.filter(n => n.category === cat.id).length
            
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                  background: selectedCategory === cat.id 
                    ? `linear-gradient(135deg, ${cat.color}20 0%, ${cat.color}10 100%)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: selectedCategory === cat.id ? '600' : '400',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  whiteSpace: 'nowrap',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Icon size={16} />
                {cat.label}
                {count > 0 && (
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Add Note Button */}
      <button
        onClick={() => setShowNewNote(true)}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          transition: 'all 0.3s ease',
          transform: 'translateZ(0)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        <Plus size={20} />
        Add New Note
      </button>
      
      {/* Notes List */}
      {loading ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            margin: '0 auto',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <FileText size={48} color="#10b981" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.5rem'
          }}>
            {searchQuery || selectedCategory ? 'No notes found' : 'No notes yet'}
          </h4>
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.85rem' : '0.9rem'
          }}>
            {searchQuery || selectedCategory 
              ? 'Try adjusting your filters' 
              : 'Click "Add New Note" to get started'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {filteredNotes.map(note => {
            const category = getCategoryInfo(note.category)
            const priority = getPriorityInfo(note.priority)
            const CategoryIcon = category.icon
            
            return (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: 'translateZ(0)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: `${category.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <CategoryIcon size={16} color={category.color} />
                      </div>
                      <h4 style={{
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        fontWeight: '600',
                        color: '#fff',
                        margin: 0
                      }}>
                        {note.title}
                      </h4>
                    </div>
                    
                    {note.subtitle && (
                      <p style={{
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        margin: '0.25rem 0',
                        paddingLeft: '2.5rem'
                      }}>
                        {note.subtitle}
                      </p>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.25rem'
                  }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      background: `${priority.color}20`,
                      borderRadius: '6px',
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: priority.color,
                      fontWeight: '600'
                    }}>
                      {priority.label}
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingLeft: '2.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    {note.tags?.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '0.15rem 0.5rem',
                          background: 'rgba(16, 185, 129, 0.1)',
                          borderRadius: '12px',
                          fontSize: isMobile ? '0.65rem' : '0.7rem',
                          color: '#10b981'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  <span style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)'
                  }}>
                    {new Date(note.note_date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
  
  // New note form
  const renderNewNoteForm = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0
        }}>
          New Note
        </h3>
        <button
          onClick={() => setShowNewNote(false)}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff'
          }}
        >
          <X size={18} />
        </button>
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Date picker */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            Date
          </label>
          <input
            type="date"
            value={newNote.date}
            onChange={(e) => setNewNote({...newNote, date: e.target.value})}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              minHeight: '44px'
            }}
          />
        </div>
        
        {/* Title */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            Title <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Enter note title..."
            value={newNote.title}
            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              minHeight: '44px'
            }}
          />
        </div>
        
        {/* Subtitle */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            Subtitle
          </label>
          <input
            type="text"
            placeholder="Brief description..."
            value={newNote.subtitle}
            onChange={(e) => setNewNote({...newNote, subtitle: e.target.value})}
            style={{
              width: '100%',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              minHeight: '44px'
            }}
          />
        </div>
        
        {/* Category & Priority */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              Category
            </label>
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({...newNote, category: e.target.value})}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                minHeight: '44px',
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#111' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500'
            }}>
              Priority
            </label>
            <select
              value={newNote.priority}
              onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '0.95rem',
                minHeight: '44px',
                cursor: 'pointer'
              }}
            >
              {PRIORITIES.map(pri => (
                <option key={pri.id} value={pri.id} style={{ background: '#111' }}>
                  {pri.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Create button */}
        <button
          onClick={handleCreateNote}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '1rem',
            minHeight: '44px'
          }}
        >
          Create Note
        </button>
      </div>
    </div>
  )
  
  // Note detail view with manual save
  const renderNoteDetail = () => {
    if (!selectedNote || !editingNote) return null
    
    const category = getCategoryInfo(editingNote.category)
    const priority = getPriorityInfo(editingNote.priority)
    const CategoryIcon = category.icon
    
    return (
      <div>
        {/* Header with Back and Save buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => {
              if (hasChanges && !confirm('You have unsaved changes. Discard them?')) {
                return
              }
              setSelectedNote(null)
              setEditingNote(null)
              setHasChanges(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            <ChevronLeft size={18} />
            Back
          </button>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem'
          }}>
            {hasChanges && (
              <span style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(251, 191, 36, 0.1)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                Unsaved changes
              </span>
            )}
            
            <button
              onClick={handleSaveNote}
              disabled={!hasChanges || saving}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                background: hasChanges 
                  ? 'linear-gradient(135deg, #10b981, #059669)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                opacity: hasChanges ? 1 : 0.5
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
            
            <button
              onClick={() => handleDeleteNote(selectedNote.id)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ef4444'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        {/* Note content */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Note header info */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${category.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CategoryIcon size={24} color={category.color} />
            </div>
            
            <div style={{ flex: 1 }}>
              <input
                type="text"
                value={editingNote.title}
                onChange={(e) => {
                  setEditingNote({ ...editingNote, title: e.target.value })
                  setHasChanges(true)
                }}
                style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '600',
                  color: '#fff',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '0.25rem',
                  padding: '0.25rem 0'
                }}
                onFocus={(e) => {
                  e.target.style.borderBottomColor = 'rgba(16, 185, 129, 0.3)'
                }}
                onBlur={(e) => {
                  e.target.style.borderBottomColor = 'transparent'
                }}
              />
              
              <input
                type="text"
                value={editingNote.subtitle || ''}
                onChange={(e) => {
                  setEditingNote({ ...editingNote, subtitle: e.target.value })
                  setHasChanges(true)
                }}
                placeholder="Add a subtitle..."
                style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid transparent',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '0.75rem',
                  padding: '0.25rem 0'
                }}
                onFocus={(e) => {
                  e.target.style.borderBottomColor = 'rgba(16, 185, 129, 0.2)'
                }}
                onBlur={(e) => {
                  e.target.style.borderBottomColor = 'transparent'
                }}
              />
              
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: `${priority.color}20`,
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: priority.color,
                  fontWeight: '600'
                }}>
                  {priority.label}
                </span>
                
                <span style={{
                  padding: '0.25rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '6px',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {new Date(editingNote.note_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Sections */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {editingNote.content?.sections?.map((section, index) => (
              <div
                key={section.id || index}
                style={{
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  position: 'relative'
                }}
              >
                {/* Section header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.75rem'
                }}>
                  <input
                    type="text"
                    value={section.title || ''}
                    onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                    placeholder="Section title..."
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid transparent',
                      fontSize: isMobile ? '0.95rem' : '1rem',
                      fontWeight: '600',
                      color: '#10b981',
                      outline: 'none',
                      padding: '0.25rem 0',
                      marginRight: '1rem',
                      flex: 1
                    }}
                    onFocus={(e) => {
                      e.target.style.borderBottomColor = 'rgba(16, 185, 129, 0.3)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderBottomColor = 'transparent'
                    }}
                  />
                  
                  <button
                    onClick={() => {
                      if (confirm('Delete this section?')) {
                        handleDeleteSection(section.id)
                      }
                    }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#ef4444',
                      flexShrink: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
                
                {/* Section content */}
                {section.type === 'text' && (
                  <textarea
                    value={section.content || ''}
                    onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                    placeholder="Write your notes here..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: isMobile ? '0.75rem' : '0.875rem',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                      e.target.style.background = 'rgba(0, 0, 0, 0.5)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      e.target.style.background = 'rgba(0, 0, 0, 0.3)'
                    }}
                  />
                )}
              </div>
            ))}
            
            {/* Add section button */}
            <button
              onClick={handleAddSection}
              style={{
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: '#10b981',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              <Plus size={18} />
              Add Section
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Main render
  return (
    <div>
      {showNewNote ? renderNewNoteForm() : (
        selectedNote ? renderNoteDetail() : renderNotesList()
      )}
    </div>
  )
}
