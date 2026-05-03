// src/coach/tabs/client-info/NotesInfoTab.jsx
// UPGRADED - Interactive checkboxes, copy message, input fields support

import { useState, useEffect } from 'react'
import { 
  Plus, X, Search, Calendar, Tag, 
  FileText, CheckSquare, Target, AlertCircle, 
  MessageSquare, TrendingUp, Clock, Lightbulb,
  Phone, ChevronLeft, ChevronRight, Trash2,
  Save, ChevronDown, ChevronUp, Layers,
  GripVertical, Copy, Check
} from 'lucide-react'
import NotesService from '../../../modules/notes/NotesService'
import TemplateSelector from './components/TemplateSelector'

// GOLD THEME
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Category configuration with gold accents
const CATEGORIES = [
  { id: 'session', label: 'Session', icon: FileText, color: '#10b981' },
  { id: 'todo', label: 'To-Do', icon: CheckSquare, color: '#3b82f6' },
  { id: 'goal', label: 'Goal', icon: Target, color: '#f59e0b' },
  { id: 'struggle', label: 'Struggle', icon: AlertCircle, color: '#ef4444' },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare, color: '#8b5cf6' },
  { id: 'tracking', label: 'Tracking', icon: TrendingUp, color: '#06b6d4' },
  { id: 'reminder', label: 'Reminder', icon: Clock, color: '#ec4899' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: '#fbbf24' },
  { id: 'call', label: 'Call', icon: Phone, color: GOLD.primary }
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
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(null)
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState([])
  
  // Local edit state
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
  
  useEffect(() => {
    if (client?.id) {
      loadNotes()
    }
  }, [client?.id])
  
  useEffect(() => {
    filterNotes()
  }, [notes, searchQuery, selectedCategory])
  
  useEffect(() => {
    if (selectedNote) {
      setEditingNote(JSON.parse(JSON.stringify(selectedNote)))
      // Expand first section by default
      if (selectedNote.content?.sections?.length > 0) {
        setExpandedSections([selectedNote.content.sections[0].id])
      }
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
  
  const filterNotes = () => {
    let filtered = [...notes]
    if (selectedCategory) {
      filtered = filtered.filter(note => note.category === selectedCategory)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(note => 
        note.title?.toLowerCase().includes(query) ||
        note.subtitle?.toLowerCase().includes(query) ||
        JSON.stringify(note.content).toLowerCase().includes(query)
      )
    }
    setFilteredNotes(filtered)
  }
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId) 
        : [...prev, sectionId]
    )
  }
  
  const expandAllSections = () => {
    if (editingNote?.content?.sections) {
      setExpandedSections(editingNote.content.sections.map(s => s.id))
    }
  }
  
  const collapseAllSections = () => {
    setExpandedSections([])
  }
  
  const handleCopyMessage = async (message, sectionId) => {
    try {
      await navigator.clipboard.writeText(message)
      setCopiedMessage(sectionId)
      setTimeout(() => setCopiedMessage(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('❌ Kopiëren mislukt')
    }
  }
  
  const handleCreateNote = async () => {
    if (!newNote.title) {
      alert('⚠️ Vul een titel in')
      return
    }
    
    try {
      const created = await service.createNote(client.id, newNote)
      setNotes([created, ...notes])
      setShowNewNote(false)
      setNewNote({
        title: '',
        subtitle: '',
        category: 'session',
        priority: 'medium',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        content: { sections: [] }
      })
      setSelectedNote(created)
    } catch (error) {
      console.error('Error creating note:', error)
      alert('❌ Fout: ' + error.message)
    }
  }
  
  const handleTemplateSelect = async (template) => {
    const noteFromTemplate = {
      title: template.name,
      subtitle: `Created from ${template.name} template`,
      category: template.category?.toLowerCase() || 'call',
      priority: 'high',
      date: new Date().toISOString().split('T')[0],
      tags: [template.category?.toLowerCase() || 'onboarding'],
      content: { 
        sections: template.sections.map(section => ({
          ...section,
          id: `${section.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      }
    }
    
    try {
      const created = await service.createNote(client.id, noteFromTemplate)
      setNotes([created, ...notes])
      setShowTemplateSelector(false)
      setSelectedNote(created)
    } catch (error) {
      console.error('Error creating note from template:', error)
      alert('❌ Fout: ' + error.message)
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
      alert('✅ Note opgeslagen!')
    } catch (error) {
      console.error('Error saving note:', error)
      alert('❌ Fout: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteNote = async (noteId) => {
    if (!confirm('Weet je zeker dat je deze note wilt verwijderen?')) return
    
    try {
      await service.deleteNote(noteId)
      setNotes(notes.filter(n => n.id !== noteId))
      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        setEditingNote(null)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      alert('❌ Fout: ' + error.message)
    }
  }
  
  const handleAddSection = () => {
    if (!editingNote) return
    
    const newSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      title: 'Nieuwe Sectie',
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
    setExpandedSections(prev => [...prev, newSection.id])
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
  
  const handleToggleCheckItem = (sectionId, itemId) => {
    if (!editingNote) return
    
    const updatedSections = editingNote.content.sections.map(section => {
      if (section.id === sectionId && section.checkItems) {
        return {
          ...section,
          checkItems: section.checkItems.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          )
        }
      }
      return section
    })
    
    setEditingNote({
      ...editingNote,
      content: {
        ...editingNote.content,
        sections: updatedSections
      }
    })
    setHasChanges(true)
  }
  
  const handleUpdateField = (sectionId, fieldId, value) => {
    if (!editingNote) return
    
    const updatedSections = editingNote.content.sections.map(section => {
      if (section.id === sectionId && section.fields) {
        return {
          ...section,
          fields: section.fields.map(field =>
            field.id === fieldId ? { ...field, value } : field
          )
        }
      }
      return section
    })
    
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
    if (!confirm('Sectie verwijderen?')) return
    
    const updatedSections = editingNote.content.sections.filter(s => s.id !== sectionId)
    
    setEditingNote({
      ...editingNote,
      content: {
        ...editingNote.content,
        sections: updatedSections
      }
    })
    setExpandedSections(prev => prev.filter(id => id !== sectionId))
    setHasChanges(true)
  }
  
  const getCategoryInfo = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }
  
  const getPriorityInfo = (priorityId) => {
    return PRIORITIES.find(p => p.id === priorityId) || PRIORITIES[2]
  }

  // ==========================================
  // RENDER: NOTES LIST
  // ==========================================
  const renderNotesList = () => (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          width: isMobile ? '56px' : '64px',
          height: isMobile ? '56px' : '64px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${GOLD.primary}20 0%, ${GOLD.secondary}10 100%)`,
          border: `1px solid ${GOLD.borderActive}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 20px ${GOLD.glow}`
        }}>
          <FileText size={isMobile ? 28 : 32} color={GOLD.primary} />
        </div>
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            fontWeight: '800',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Notes
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            margin: 0
          }}>
            {notes.length} notities
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <Search size={18} style={{
          position: 'absolute',
          left: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'rgba(255, 255, 255, 0.4)'
        }} />
        <input
          type="text"
          placeholder="Zoek in notities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem 1rem 0.875rem 3rem' : '1rem 1rem 1rem 3rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            outline: 'none',
            minHeight: '48px'
          }}
        />
      </div>
      
      {/* Category filters */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setSelectedCategory('')}
          style={{
            padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.25rem',
            background: !selectedCategory ? GOLD.background : 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${!selectedCategory ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '10px',
            color: !selectedCategory ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: !selectedCategory ? '600' : '500',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            minHeight: '44px'
          }}
        >
          Alle
        </button>
        
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const count = notes.filter(n => n.category === cat.id).length
          if (count === 0) return null
          
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.25rem',
                background: selectedCategory === cat.id ? `${cat.color}15` : 'rgba(0, 0, 0, 0.4)',
                border: `1px solid ${selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '10px',
                color: selectedCategory === cat.id ? cat.color : 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: selectedCategory === cat.id ? '600' : '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap',
                minHeight: '44px'
              }}
            >
              <Icon size={16} />
              {cat.label}
              <span style={{
                padding: '0.15rem 0.5rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                fontSize: '0.75rem'
              }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
      
      {/* Action buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setShowTemplateSelector(true)}
          style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
            border: `1px solid ${GOLD.border}`,
            borderRadius: '14px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '56px',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={20} />
          Template
        </button>
        
        <button
          onClick={() => setShowNewNote(true)}
          style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '14px',
            color: '#000',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '56px',
            boxShadow: `0 4px 20px ${GOLD.glow}`
          }}
        >
          <Plus size={20} />
          Nieuwe Note
        </button>
      </div>
      
      {/* Notes List */}
      {loading ? (
        <div style={{ padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `3px solid ${GOLD.border}`,
            borderTopColor: GOLD.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '16px',
          border: `1px solid ${GOLD.border}`
        }}>
          <FileText size={56} color={GOLD.primary} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h4 style={{
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.5rem'
          }}>
            {searchQuery || selectedCategory ? 'Geen notities gevonden' : 'Nog geen notities'}
          </h4>
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.9rem' : '0.95rem'
          }}>
            Gebruik een template of maak een lege note
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotes.map(note => {
            const category = getCategoryInfo(note.category)
            const priority = getPriorityInfo(note.priority)
            const CategoryIcon = category.icon
            const sectionCount = note.content?.sections?.length || 0
            
            return (
              <button
                key={note.id}
                onClick={() => setSelectedNote(note)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '14px',
                  padding: isMobile ? '1rem' : '1.25rem',
                  border: `1px solid rgba(255, 255, 255, 0.08)`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Top accent */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${category.color} 0%, transparent 100%)`,
                  opacity: 0.6
                }} />
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: `${category.color}15`,
                      border: `1px solid ${category.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <CategoryIcon size={20} color={category.color} />
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{
                        fontSize: isMobile ? '1rem' : '1.05rem',
                        fontWeight: '600',
                        color: '#fff',
                        margin: 0,
                        marginBottom: '0.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {note.title}
                      </h4>
                      
                      {note.subtitle && (
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: '0 0 0.5rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {note.subtitle}
                        </p>
                      )}
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center'
                      }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          background: `${priority.color}20`,
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          color: priority.color,
                          fontWeight: '600'
                        }}>
                          {priority.label}
                        </span>
                        
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {sectionCount} secties
                        </span>
                        
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {new Date(note.note_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // ==========================================
  // RENDER: NEW NOTE FORM
  // ==========================================
  const renderNewNoteForm = () => (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <button
          onClick={() => setShowNewNote(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.7rem 1rem',
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '10px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            minHeight: '44px'
          }}
        >
          ← Terug
        </button>
        
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0
        }}>
          Nieuwe Note
        </h2>
        
        <div style={{ width: '80px' }} />
      </div>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Date */}
        <div style={{
          padding: '1.25rem',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '14px',
          border: `1px solid ${GOLD.border}`
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            color: GOLD.primary,
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            <Calendar size={18} />
            Datum
          </label>
          <input
            type="date"
            value={newNote.date}
            onChange={(e) => setNewNote({...newNote, date: e.target.value})}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              minHeight: '48px'
            }}
          />
        </div>
        
        {/* Title */}
        <div style={{
          padding: '1.25rem',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '14px',
          border: `1px solid ${GOLD.border}`
        }}>
          <label style={{
            display: 'block',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            color: GOLD.primary,
            fontWeight: '600',
            marginBottom: '0.75rem'
          }}>
            Titel <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="Note titel..."
            value={newNote.title}
            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: `1px solid ${newNote.title ? GOLD.borderActive : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '10px',
              color: '#fff',
              fontSize: '1rem',
              minHeight: '48px'
            }}
          />
        </div>
        
        {/* Category & Priority */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem'
        }}>
          <div style={{
            padding: '1.25rem',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Categorie
            </label>
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({...newNote, category: e.target.value})}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minHeight: '48px'
              }}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#111' }}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{
            padding: '1.25rem',
            background: 'rgba(0, 0, 0, 0.4)',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <label style={{
              display: 'block',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: '600',
              marginBottom: '0.75rem'
            }}>
              Prioriteit
            </label>
            <select
              value={newNote.priority}
              onChange={(e) => setNewNote({...newNote, priority: e.target.value})}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer',
                minHeight: '48px'
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
            padding: '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '14px',
            color: '#000',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            minHeight: '56px',
            boxShadow: `0 4px 20px ${GOLD.glow}`
          }}
        >
          Note Aanmaken
        </button>
      </div>
    </div>
  )

  // ==========================================
  // RENDER: SECTION CONTENT (NEW - HANDLES ALL TYPES)
  // ==========================================
  const renderSectionContent = (section) => {
    // TYPE: CHECKLIST (interactive checkboxes)
    if (section.type === 'checklist' && section.checkItems) {
      return (
        <div>
          {/* Checklist items */}
          <div style={{ marginBottom: '1.5rem' }}>
            {section.checkItems.map(item => (
              <label
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: item.checked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '10px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  border: `1px solid ${item.checked ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.checked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = item.checked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.3)'
                }}
              >
                <input
                  type="checkbox"
                  checked={item.checked || false}
                  onChange={() => handleToggleCheckItem(section.id, item.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#10b981',
                    flexShrink: 0,
                    marginTop: '0.1rem'
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  color: item.checked ? '#10b981' : 'rgba(255,255,255,0.8)',
                  textDecoration: item.checked ? 'line-through' : 'none',
                  opacity: item.checked ? 0.7 : 1,
                  flex: 1
                }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
          
          {/* Input fields (if present) */}
          {section.fields && section.fields.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              {section.fields.map(field => (
                <div key={field.id}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.5rem',
                    fontWeight: '600'
                  }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={field.value || ''}
                    onChange={(e) => handleUpdateField(section.id, field.id, e.target.value)}
                    placeholder={field.placeholder || ''}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: `1px solid ${field.value ? GOLD.borderActive : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Notes field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '0.5rem',
              fontWeight: '600'
            }}>
              Extra notities
            </label>
            <textarea
              value={section.notes || ''}
              onChange={(e) => handleUpdateSection(section.id, { notes: e.target.value })}
              placeholder="Extra opmerkingen tijdens de call..."
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '0.875rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: `1px solid ${section.notes ? GOLD.borderActive : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none',
                lineHeight: '1.6'
              }}
            />
          </div>
          
          {/* Copy message button */}
          {section.clientMessage && (
            <div style={{ marginTop: '1rem' }}>
              <button
                onClick={() => handleCopyMessage(section.clientMessage, section.id)}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: copiedMessage === section.id 
                    ? 'rgba(16, 185, 129, 0.2)' 
                    : `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
                  border: `1px solid ${copiedMessage === section.id ? '#10b981' : GOLD.border}`,
                  borderRadius: '12px',
                  color: copiedMessage === section.id ? '#10b981' : GOLD.primary,
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  minHeight: '52px',
                  transition: 'all 0.2s ease'
                }}
              >
                {copiedMessage === section.id ? (
                  <>
                    <Check size={20} />
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <Copy size={20} />
                    Kopieer Client Bericht
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )
    }
    
    // TYPE: TEXT (regular textarea - fallback)
    return (
      <div>
        <label style={{
          display: 'block',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.5)',
          marginBottom: '0.5rem',
          fontWeight: '600'
        }}>
          Inhoud
        </label>
        <textarea
          value={section.content || ''}
          onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
          placeholder="Schrijf hier je notities...

• Punt 1
• Punt 2
• Etc."
          style={{
            width: '100%',
            minHeight: '200px',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: `1px solid ${section.content ? GOLD.borderActive : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
            lineHeight: '1.7',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = GOLD.borderActive
            e.target.style.background = 'rgba(0, 0, 0, 0.7)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = section.content ? GOLD.borderActive : 'rgba(255,255,255,0.15)'
            e.target.style.background = 'rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>
    )
  }

  // ==========================================
  // RENDER: NOTE DETAIL WITH UPGRADED SECTIONS
  // ==========================================
  const renderNoteDetail = () => {
    if (!selectedNote || !editingNote) return null
    
    const category = getCategoryInfo(editingNote.category)
    const priority = getPriorityInfo(editingNote.priority)
    const CategoryIcon = category.icon
    const sections = editingNote.content?.sections || []
    
    return (
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <button
            onClick={() => {
              if (hasChanges && !confirm('Je hebt onopgeslagen wijzigingen. Terug zonder opslaan?')) return
              setSelectedNote(null)
              setEditingNote(null)
              setHasChanges(false)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.7rem 1rem',
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '10px',
              color: GOLD.primary,
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            ← Terug
          </button>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {hasChanges && (
              <span style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(251, 191, 36, 0.15)',
                borderRadius: '8px',
                color: '#fbbf24',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center'
              }}>
                Niet opgeslagen
              </span>
            )}
            
            <button
              onClick={handleSaveNote}
              disabled={!hasChanges || saving}
              style={{
                padding: '0.7rem 1.25rem',
                background: hasChanges 
                  ? `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                  : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '10px',
                color: hasChanges ? '#000' : 'rgba(255,255,255,0.3)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px'
              }}
            >
              <Save size={16} />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
            
            <button
              onClick={() => handleDeleteNote(selectedNote.id)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ef4444'
              }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        
        {/* Note header card */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
          borderRadius: '16px',
          border: `1px solid ${GOLD.border}`,
          marginBottom: '1rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
          }} />
          
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: `${category.color}15`,
              border: `1px solid ${category.color}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CategoryIcon size={28} color={category.color} />
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
                  fontSize: isMobile ? '1.25rem' : '1.4rem',
                  fontWeight: '700',
                  color: '#fff',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid transparent',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '0.5rem',
                  padding: '0.25rem 0'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = GOLD.border}
                onBlur={(e) => e.target.style.borderBottomColor = 'transparent'}
              />
              
              <input
                type="text"
                value={editingNote.subtitle || ''}
                onChange={(e) => {
                  setEditingNote({ ...editingNote, subtitle: e.target.value })
                  setHasChanges(true)
                }}
                placeholder="Voeg een ondertitel toe..."
                style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  marginBottom: '0.75rem'
                }}
              />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{
                  padding: '0.3rem 0.75rem',
                  background: `${priority.color}20`,
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: priority.color,
                  fontWeight: '600'
                }}>
                  {priority.label}
                </span>
                
                <span style={{
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {new Date(editingNote.note_date).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section controls */}
        {sections.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            padding: '0 0.25rem'
          }}>
            <span style={{
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              color: 'rgba(255,255,255,0.5)'
            }}>
              {sections.length} secties · {expandedSections.length} open
            </span>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={expandAllSections}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ChevronDown size={14} />
                Alles open
              </button>
              
              <button
                onClick={collapseAllSections}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <ChevronUp size={14} />
                Alles dicht
              </button>
            </div>
          </div>
        )}
        
        {/* COLLAPSIBLE SECTIONS - UPGRADED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {sections.map((section, index) => {
            const isExpanded = expandedSections.includes(section.id)
            const hasContent = section.content || section.notes || 
                              (section.checkItems && section.checkItems.some(i => i.checked)) ||
                              (section.fields && section.fields.some(f => f.value))
            
            const checkedCount = section.checkItems?.filter(i => i.checked).length || 0
            const totalCheckItems = section.checkItems?.length || 0
            const completionPercent = totalCheckItems > 0 ? Math.round((checkedCount / totalCheckItems) * 100) : 0
            
            return (
              <div
                key={section.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '14px',
                  border: `1px solid ${isExpanded ? GOLD.borderActive : 'rgba(255,255,255,0.08)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: isExpanded ? `0 4px 20px ${GOLD.glow}` : 'none'
                }}
              >
                {/* Section header - clickable */}
                <button
                  onClick={() => toggleSection(section.id)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '1rem' : '1.25rem',
                    background: isExpanded 
                      ? `linear-gradient(135deg, ${GOLD.background} 0%, transparent 100%)`
                      : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isExpanded ? `${GOLD.primary}20` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isExpanded ? GOLD.border : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        color: isExpanded ? GOLD.primary : 'rgba(255,255,255,0.5)'
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontSize: isMobile ? '1rem' : '1.05rem',
                        fontWeight: '700',
                        color: isExpanded ? GOLD.primary : '#fff',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {section.title || 'Naamloze sectie'}
                      </h3>
                      
                      {!isExpanded && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', alignItems: 'center' }}>
                          {section.type === 'checklist' && totalCheckItems > 0 && (
                            <span style={{
                              fontSize: '0.75rem',
                              color: completionPercent === 100 ? '#10b981' : 'rgba(255,255,255,0.5)',
                              fontWeight: '600'
                            }}>
                              {checkedCount}/{totalCheckItems} ✓
                            </span>
                          )}
                          
                          {hasContent && (
                            <span style={{
                              padding: '0.15rem 0.4rem',
                              background: 'rgba(16,185,129,0.15)',
                              borderRadius: '4px',
                              fontSize: '0.7rem',
                              color: '#10b981',
                              fontWeight: '600'
                            }}>
                              Ingevuld
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {section.type === 'checklist' && !isExpanded && totalCheckItems > 0 && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: `conic-gradient(#10b981 ${completionPercent}%, rgba(255,255,255,0.1) 0)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: '700',
                            color: completionPercent === 100 ? '#10b981' : 'rgba(255,255,255,0.5)'
                          }}>
                            {completionPercent}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {isExpanded ? (
                      <ChevronUp size={20} color={GOLD.primary} />
                    ) : (
                      <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
                    )}
                  </div>
                </button>
                
                {/* Section content - expandable */}
                {isExpanded && (
                  <div style={{
                    padding: isMobile ? '0 1rem 1.25rem' : '0 1.25rem 1.5rem'
                  }}>
                    {/* Section title edit */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.5)',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        Sectie titel
                      </label>
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                        placeholder="Sectie naam..."
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: `1px solid ${GOLD.border}`,
                          borderRadius: '10px',
                          color: GOLD.primary,
                          fontSize: '1rem',
                          fontWeight: '600',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    {/* Render section content based on type */}
                    {renderSectionContent(section)}
                    
                    {/* Delete section button */}
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      style={{
                        padding: '0.6rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '8px',
                        color: '#ef4444',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginTop: '1rem'
                      }}
                    >
                      <Trash2 size={14} />
                      Sectie verwijderen
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Add section button */}
        <button
          onClick={handleAddSection}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
            border: `2px dashed ${GOLD.border}`,
            borderRadius: '14px',
            color: GOLD.primary,
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '56px',
            transition: 'all 0.2s ease'
          }}
        >
          <Plus size={20} />
          Nieuwe Sectie Toevoegen
        </button>
      </div>
    )
  }
  
  // ==========================================
  // MAIN RENDER
  // ==========================================
  return (
    <div style={{
      background: '#000',
      minHeight: '100%',
      padding: isMobile ? '0' : '0'
    }}>
      {showNewNote ? renderNewNoteForm() : (
        selectedNote ? renderNoteDetail() : renderNotesList()
      )}
      
      {showTemplateSelector && (
        <TemplateSelector
          isMobile={isMobile}
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}
