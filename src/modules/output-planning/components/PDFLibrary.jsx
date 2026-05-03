// src/modules/output-planning/components/PDFLibrary.jsx
// PDF Library - Tab 3
// Store PDFs with Google Drive links
// Gold Theme

import { useState } from 'react'
import { 
  Plus,
  FileText,
  ExternalLink,
  Copy,
  Edit2,
  Trash2,
  X,
  Save,
  Link,
  Check,
  FolderOpen
} from 'lucide-react'

// Gold Theme Constants
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// PDF Categories
const CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'voeding', label: 'Voeding' },
  { id: 'training', label: 'Training' },
  { id: 'mindset', label: 'Mindset' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'overig', label: 'Overig' }
]

export default function PDFLibrary({ pdfs, service, db, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [activeCategory, setActiveCategory] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPDF, setEditingPDF] = useState(null)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  // Filter PDFs by category
  const filteredPDFs = activeCategory === 'all' 
    ? pdfs 
    : pdfs.filter(p => p.category === activeCategory)
  
  // Handle save
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      if (editingPDF) {
        await service.updatePDF(editingPDF.id, formData)
      } else {
        await service.createPDF({
          ...formData,
          coach_id: user.id
        })
      }
      
      setShowModal(false)
      setEditingPDF(null)
      onRefresh()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }
  
  // Handle delete
  const handleDelete = async (pdfId) => {
    if (!confirm('Weet je zeker dat je deze PDF wilt verwijderen?')) return
    
    try {
      await service.deletePDF(pdfId)
      onRefresh()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
  
  // Copy link
  const copyLink = async (link, id) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }
  
  // Open edit modal
  const openEditModal = (pdf) => {
    setEditingPDF(pdf)
    setShowModal(true)
  }
  
  // Open new modal
  const openNewModal = () => {
    setEditingPDF(null)
    setShowModal(true)
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
            border: `1px solid ${GOLD.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={20} color={GOLD.primary} />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              PDF Bibliotheek
            </h2>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {pdfs.length} PDF's
            </div>
          </div>
        </div>
        
        <button
          onClick={openNewModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontWeight: '700',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            cursor: 'pointer',
            boxShadow: `0 4px 16px ${GOLD.glow}`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Plus size={16} />
          Nieuw
        </button>
      </div>
      
      {/* Category Filter */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.25rem' : '0.5rem',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id
          const count = cat.id === 'all' 
            ? pdfs.length 
            : pdfs.filter(p => p.category === cat.id).length
          
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
                background: isActive 
                  ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? `1px solid ${GOLD.borderActive}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: isActive ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isActive ? '700' : '500',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              {cat.label}
              {count > 0 && (
                <span style={{
                  padding: '0.125rem 0.375rem',
                  background: isActive ? `${GOLD.primary}30` : 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: '700'
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* PDFs List */}
      {filteredPDFs.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <FolderOpen size={40} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1rem'
          }}>
            {activeCategory === 'all' 
              ? 'Nog geen PDFs toegevoegd'
              : 'Geen PDFs in deze categorie'}
          </div>
          <button
            onClick={openNewModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
              border: `1px solid ${GOLD.border}`,
              borderRadius: '8px',
              color: GOLD.primary,
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <Plus size={16} />
            Eerste PDF toevoegen
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {filteredPDFs.map(pdf => (
            <div
              key={pdf.id}
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: isMobile ? '1rem' : '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Top Accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
                opacity: 0.5
              }} />
              
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileText size={20} color="#ef4444" />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '0.95rem',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {pdf.title}
                  </div>
                  
                  {pdf.category && (
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
                      border: `1px solid ${GOLD.border}`,
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: GOLD.primary,
                      textTransform: 'uppercase'
                    }}>
                      {pdf.category}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Description */}
              {pdf.description && (
                <div style={{
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.75rem',
                  lineHeight: '1.4'
                }}>
                  {pdf.description}
                </div>
              )}
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {/* Open Link */}
                {pdf.drive_link && (
                  <a
                    href={pdf.drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#3b82f6',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    <ExternalLink size={14} />
                    Openen
                  </a>
                )}
                
                {/* Copy Link */}
                {pdf.drive_link && (
                  <button
                    onClick={() => copyLink(pdf.drive_link, pdf.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      background: copiedId === pdf.id 
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: copiedId === pdf.id
                        ? '1px solid rgba(16, 185, 129, 0.3)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: copiedId === pdf.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    {copiedId === pdf.id ? (
                      <>
                        <Check size={14} />
                        Gekopieerd!
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Kopieer
                      </>
                    )}
                  </button>
                )}
                
                {/* Edit */}
                <button
                  onClick={() => openEditModal(pdf)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  <Edit2 size={14} color="rgba(255, 255, 255, 0.7)" />
                </button>
                
                {/* Delete */}
                <button
                  onClick={() => handleDelete(pdf.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    touchAction: 'manipulation'
                  }}
                >
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {showModal && (
        <PDFModal
          pdf={editingPDF}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingPDF(null)
          }}
          saving={saving}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// PDF Modal Component
function PDFModal({ pdf, onSave, onClose, saving, isMobile }) {
  const [formData, setFormData] = useState({
    title: pdf?.title || '',
    category: pdf?.category || 'voeding',
    description: pdf?.description || '',
    drive_link: pdf?.drive_link || ''
  })
  
  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Vul een titel in')
      return
    }
    onSave(formData)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '16px',
        border: `1px solid ${GOLD.border}`,
        position: 'relative'
      }}>
        {/* Top Accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
        }} />
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '1rem' : '1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '700',
            color: GOLD.primary
          }}>
            {pdf ? '✏️ PDF Bewerken' : '📄 Nieuwe PDF'}
          </h3>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              touchAction: 'manipulation'
            }}
          >
            <X size={18} color="rgba(255, 255, 255, 0.7)" />
          </button>
        </div>
        
        {/* Form */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Bijv: Calorieën Berekenen"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Category */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Categorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          {/* Description */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Beschrijving (optioneel)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Korte beschrijving van de PDF"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'vertical',
                minHeight: '60px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Google Drive Link */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              <Link size={14} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
              Google Drive Link
            </label>
            <input
              type="url"
              value={formData.drive_link}
              onChange={(e) => setFormData(prev => ({ ...prev, drive_link: e.target.value }))}
              placeholder="https://drive.google.com/..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              marginTop: '0.375rem'
            }}>
              Plak hier de share link van je Google Drive
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              fontSize: '0.9rem',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              touchAction: 'manipulation'
            }}
          >
            <Save size={16} />
            {saving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
