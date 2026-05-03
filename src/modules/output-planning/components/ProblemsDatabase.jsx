// src/modules/output-planning/components/ProblemsDatabase.jsx
// Problems Database - Tab 2
// Categories: Voeding, Gym, Motivatie, Mindset, Community
// Gold Theme

import { useState } from 'react'
import { 
  Plus,
  Target,
  Brain,
  Utensils,
  Dumbbell,
  Flame,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  Save,
  Lightbulb,
  ArrowRight
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

// Problem Categories
const CATEGORIES = [
  { id: 'voeding', label: 'Voeding', icon: Utensils, color: '#10b981' },
  { id: 'gym', label: 'Gym', icon: Dumbbell, color: '#f97316' },
  { id: 'motivatie', label: 'Motivatie', icon: Flame, color: '#ef4444' },
  { id: 'mindset', label: 'Mindset', icon: Brain, color: '#8b5cf6' },
  { id: 'community', label: 'Community', icon: MessageCircle, color: '#3b82f6' }
]

export default function ProblemsDatabase({ problems, service, db, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [activeCategory, setActiveCategory] = useState('voeding')
  const [showModal, setShowModal] = useState(false)
  const [editingProblem, setEditingProblem] = useState(null)
  const [saving, setSaving] = useState(false)
  
  // Filter problems by category
  const filteredProblems = problems.filter(p => p.category === activeCategory)
  
  // Get category config
  const getCategoryConfig = (categoryId) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]
  }
  
  // Handle save
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      if (editingProblem) {
        await service.updateProblem(editingProblem.id, formData)
      } else {
        await service.createProblem({
          ...formData,
          coach_id: user.id
        })
      }
      
      setShowModal(false)
      setEditingProblem(null)
      onRefresh()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }
  
  // Handle delete
  const handleDelete = async (problemId) => {
    if (!confirm('Weet je zeker dat je dit probleem wilt verwijderen?')) return
    
    try {
      await service.deleteProblem(problemId)
      onRefresh()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
  
  // Open edit modal
  const openEditModal = (problem) => {
    setEditingProblem(problem)
    setShowModal(true)
  }
  
  // Open new modal
  const openNewModal = () => {
    setEditingProblem(null)
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
            <Target size={20} color={GOLD.primary} />
          </div>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#fff'
            }}>
              Problemen Database
            </h2>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              {problems.length} problemen totaal
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
      
      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: isMobile ? '0.25rem' : '0.5rem',
        marginBottom: '1rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
      }}>
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = activeCategory === cat.id
          const count = problems.filter(p => p.category === cat.id).length
          
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
                  ? `${cat.color}20`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? `1px solid ${cat.color}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: isActive ? cat.color : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isActive ? '700' : '500',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                touchAction: 'manipulation',
                minHeight: '44px'
              }}
            >
              <Icon size={isMobile ? 14 : 16} />
              {cat.label}
              {count > 0 && (
                <span style={{
                  padding: '0.125rem 0.375rem',
                  background: isActive ? `${cat.color}30` : 'rgba(255, 255, 255, 0.1)',
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
      
      {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Lightbulb size={40} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '1rem' }} />
          <div style={{
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1rem'
          }}>
            Nog geen problemen in deze categorie
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
            Eerste probleem toevoegen
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {filteredProblems.map(problem => {
            const catConfig = getCategoryConfig(problem.category)
            
            return (
              <div
                key={problem.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden'
                }}
              >
                {/* Problem Header */}
                <div style={{
                  padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: `${catConfig.color}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <catConfig.icon size={12} color={catConfig.color} />
                        </div>
                        <span style={{
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: '700',
                          color: '#fff'
                        }}>
                          {problem.problem_title}
                        </span>
                      </div>
                      {problem.problem_description && (
                        <div style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          marginLeft: '32px'
                        }}>
                          {problem.problem_description}
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div style={{
                      display: 'flex',
                      gap: '0.375rem'
                    }}>
                      <button
                        onClick={() => openEditModal(problem)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Edit2 size={14} color="rgba(255, 255, 255, 0.7)" />
                      </button>
                      <button
                        onClick={() => handleDelete(problem.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          touchAction: 'manipulation'
                        }}
                      >
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Solution Section */}
                {(problem.solution_approach || problem.content_angle) && (
                  <div style={{
                    padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
                    background: 'rgba(16, 185, 129, 0.05)'
                  }}>
                    {problem.solution_approach && (
                      <div style={{ marginBottom: problem.content_angle ? '0.75rem' : 0 }}>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: '#10b981',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.25rem'
                        }}>
                          Oplossing
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem'
                        }}>
                          <ArrowRight size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            color: 'rgba(255, 255, 255, 0.8)'
                          }}>
                            {problem.solution_approach}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {problem.content_angle && (
                      <div>
                        <div style={{
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          color: GOLD.primary,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '0.25rem'
                        }}>
                          Content Invalshoek
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.5rem'
                        }}>
                          <Lightbulb size={14} color={GOLD.primary} style={{ marginTop: '2px', flexShrink: 0 }} />
                          <span style={{
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            color: 'rgba(255, 255, 255, 0.8)'
                          }}>
                            {problem.content_angle}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {showModal && (
        <ProblemModal
          problem={editingProblem}
          category={activeCategory}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false)
            setEditingProblem(null)
          }}
          saving={saving}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}

// Problem Modal Component
function ProblemModal({ problem, category, onSave, onClose, saving, isMobile }) {
  const [formData, setFormData] = useState({
    category: problem?.category || category,
    problem_title: problem?.problem_title || '',
    problem_description: problem?.problem_description || '',
    solution_approach: problem?.solution_approach || '',
    content_angle: problem?.content_angle || ''
  })
  
  const handleSave = () => {
    if (!formData.problem_title.trim()) {
      alert('Vul een titel in')
      return
    }
    onSave(formData)
  }
  
  const catConfig = CATEGORIES.find(c => c.id === formData.category) || CATEGORIES[0]

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
            {problem ? '✏️ Probleem Bewerken' : '🎯 Nieuw Probleem'}
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
          {/* Category Selector */}
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: '0.5rem'
            }}>
              {CATEGORIES.map(cat => {
                const Icon = cat.icon
                const isSelected = formData.category === cat.id
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.625rem',
                      background: isSelected 
                        ? `${cat.color}20`
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected
                        ? `2px solid ${cat.color}`
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Icon size={14} color={cat.color} />
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: isSelected ? cat.color : 'rgba(255, 255, 255, 0.7)'
                    }}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Title */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Probleem Titel *
            </label>
            <input
              type="text"
              value={formData.problem_title}
              onChange={(e) => setFormData(prev => ({ ...prev, problem_title: e.target.value }))}
              placeholder="Bijv: Geen planning"
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
              value={formData.problem_description}
              onChange={(e) => setFormData(prev => ({ ...prev, problem_description: e.target.value }))}
              placeholder="Uitgebreidere beschrijving van het probleem"
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
          
          {/* Solution */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              Oplossing / Hoe kun je helpen?
            </label>
            <textarea
              value={formData.solution_approach}
              onChange={(e) => setFormData(prev => ({ ...prev, solution_approach: e.target.value }))}
              placeholder="Bijv: Meal prep op zondag strategie"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'vertical',
                minHeight: '60px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Content Angle */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: GOLD.primary,
              marginBottom: '0.5rem'
            }}>
              Content Invalshoek / Rode Draad
            </label>
            <textarea
              value={formData.content_angle}
              onChange={(e) => setFormData(prev => ({ ...prev, content_angle: e.target.value }))}
              placeholder="Hoe kun je dit verwerken in content?"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`,
                border: `1px solid ${GOLD.border}`,
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'vertical',
                minHeight: '60px',
                outline: 'none'
              }}
            />
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
