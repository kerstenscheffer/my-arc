// src/modules/videos/CategoryManagerModal.jsx
// Beheer video categorieën — aanmaken, bewerken, verwijderen
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Edit2, Trash2, Check, AlertTriangle } from 'lucide-react'
import videoService from './VideoService'

const GOLD = '#FFD700'

// Preset kleuren voor categorieën
const COLOR_PRESETS = [
  '#FFD700', // goud
  '#10b981', // groen
  '#3b82f6', // blauw
  '#f59e0b', // oranje
  '#ec4899', // roze
  '#8b5cf6', // paars
  '#06b6d4', // cyaan
  '#ef4444', // rood
  '#84cc16', // lime
  '#64748b'  // grijs
]

export default function CategoryManagerModal({ isOpen, onClose, coachId, onChange }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state voor nieuwe categorie
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(COLOR_PRESETS[0])

  // Edit state
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null)

  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (isOpen && coachId) loadCategories()
  }, [isOpen, coachId])

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return
    const orig = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = orig }
  }, [isOpen])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await videoService.getCategories(coachId)
      setCategories(data)
    } catch (e) {
      console.error('Load categories failed:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await videoService.createCategory({
        name: newName.trim(),
        color: newColor
      })
      if (res.success) {
        setNewName('')
        setNewColor(COLOR_PRESETS[0])
        setShowAddForm(false)
        await loadCategories()
        if (onChange) onChange()
      } else {
        alert(res.error || 'Aanmaken mislukt')
      }
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color || COLOR_PRESETS[0])
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editingId) return
    setSaving(true)
    try {
      const res = await videoService.updateCategory(editingId, {
        name: editName.trim(),
        color: editColor
      })
      if (res.success) {
        cancelEdit()
        await loadCategories()
        if (onChange) onChange()
      } else {
        alert(res.error || 'Bewerken mislukt')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (catId) => {
    setSaving(true)
    try {
      const res = await videoService.deleteCategory(catId)
      if (res.success) {
        setDeletingId(null)
        await loadCategories()
        if (onChange) onChange()
      } else {
        alert(res.error || 'Verwijderen mislukt')
      }
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '1rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          width: '100%',
          maxWidth: isMobile ? '100%' : '520px',
          maxHeight: isMobile ? '90vh' : '85vh',
          height: 'auto',
          borderRadius: isMobile ? '12px 12px 0 0' : '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: 'translateZ(0)'
        }}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.4rem' : '0.45rem',
              fontWeight: '700',
              color: 'rgba(255, 255, 255, 0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '0.2rem'
            }}>
              Video Categorieën
            </div>
            <div style={{
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '800',
              color: '#fff',
              letterSpacing: '-0.01em'
            }}>
              Beheer categorieën
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div
          className="cat-mgr-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* ── Add button / form ── */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                color: GOLD,
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                fontWeight: '700',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                textAlign: 'left',
                letterSpacing: '0.02em',
                minHeight: '44px'
              }}
            >
              <Plus size={14} />
              Nieuwe categorie
            </button>
          ) : (
            <div style={{
              padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              background: 'rgba(255, 215, 0, 0.03)'
            }}>
              <div style={{
                fontSize: '0.4rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '0.4rem'
              }}>
                Nieuwe categorie
              </div>

              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="Bv. Workouts Loggen"
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.55rem 0.7rem',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '600',
                  outline: 'none',
                  marginBottom: '0.6rem'
                }}
              />

              <ColorPicker color={newColor} onChange={setNewColor} isMobile={isMobile} />

              <div style={{
                display: 'flex',
                gap: '0.4rem',
                marginTop: '0.75rem'
              }}>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewName('')
                    setNewColor(COLOR_PRESETS[0])
                  }}
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '36px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  Annuleer
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newName.trim() || saving}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    background: newName.trim() && !saving ? GOLD : 'rgba(255, 215, 0, 0.2)',
                    border: 'none',
                    borderRadius: '6px',
                    color: newName.trim() && !saving ? '#000' : 'rgba(0, 0, 0, 0.4)',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    cursor: newName.trim() && !saving ? 'pointer' : 'not-allowed',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '36px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}
                >
                  {saving ? 'Opslaan...' : 'Toevoegen'}
                </button>
              </div>
            </div>
          )}

          {/* ── Categorieën lijst ── */}
          {loading ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.3)',
              fontSize: '0.7rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Laden...
            </div>
          ) : categories.length === 0 ? (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.3rem'
              }}>
                Nog geen categorieën
              </div>
              <div style={{
                fontSize: '0.7rem',
                color: 'rgba(255, 255, 255, 0.3)'
              }}>
                Maak er een aan om je video's te organiseren.
              </div>
            </div>
          ) : (
            categories.map(cat => {
              const isEditing = editingId === cat.id
              const isDeleting = deletingId === cat.id

              return (
                <div
                  key={cat.id}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                  }}
                >
                  {/* Normal row */}
                  {!isEditing && !isDeleting && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: isMobile ? '0.625rem 0.875rem' : '0.75rem 1.125rem',
                      gap: '0.6rem'
                    }}>
                      {/* Color dot */}
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: cat.color || COLOR_PRESETS[0],
                        flexShrink: 0
                      }} />

                      {/* Name */}
                      <div style={{
                        flex: 1,
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: '700',
                        color: '#fff',
                        letterSpacing: '-0.01em',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {cat.name}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => startEdit(cat)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: '6px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingId(cat.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}

                  {/* Edit form */}
                  {isEditing && (
                    <div style={{
                      padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
                      background: 'rgba(255, 215, 0, 0.03)'
                    }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '0.55rem 0.7rem',
                          background: '#000',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          fontWeight: '600',
                          outline: 'none',
                          marginBottom: '0.6rem'
                        }}
                      />

                      <ColorPicker color={editColor} onChange={setEditColor} isMobile={isMobile} />

                      <div style={{
                        display: 'flex',
                        gap: '0.4rem',
                        marginTop: '0.75rem'
                      }}>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            minHeight: '36px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          Annuleer
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editName.trim() || saving}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: editName.trim() && !saving ? GOLD : 'rgba(255, 215, 0, 0.2)',
                            border: 'none',
                            borderRadius: '6px',
                            color: editName.trim() && !saving ? '#000' : 'rgba(0, 0, 0, 0.4)',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            cursor: editName.trim() && !saving ? 'pointer' : 'not-allowed',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            minHeight: '36px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          {saving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete confirmation */}
                  {isDeleting && (
                    <div style={{
                      padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1.125rem',
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderLeft: '3px solid #ef4444'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.4rem'
                      }}>
                        <AlertTriangle size={14} color="#ef4444" />
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          color: '#ef4444',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}>
                          Verwijder "{cat.name}"?
                        </div>
                      </div>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        lineHeight: 1.4,
                        marginBottom: '0.6rem'
                      }}>
                        Video's in deze categorie blijven bestaan maar verliezen hun categorie-link.
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '0.4rem'
                      }}>
                        <button
                          onClick={() => setDeletingId(null)}
                          disabled={saving}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '6px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.7rem',
                            fontWeight: '700',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            minHeight: '36px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          Annuleer
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          disabled={saving}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: '800',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            minHeight: '36px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em'
                          }}
                        >
                          {saving ? '...' : 'Verwijder'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <style>{`.cat-mgr-body::-webkit-scrollbar { display: none; }`}</style>
    </div>,
    document.body
  )
}

// ============ COLOR PICKER SUB-COMPONENT ============
function ColorPicker({ color, onChange, isMobile }) {
  return (
    <div>
      <div style={{
        fontSize: '0.4rem',
        fontWeight: '700',
        color: 'rgba(255, 255, 255, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '0.35rem'
      }}>
        Kleur
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.35rem'
      }}>
        {COLOR_PRESETS.map(preset => {
          const isActive = color === preset
          return (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: preset,
                border: isActive ? '2px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.15s ease',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isActive && <Check size={14} color="#000" strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
