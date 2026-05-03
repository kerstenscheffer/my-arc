// src/modules/meal-templates/TemplateManager.jsx
// TEMPLATE MANAGEMENT PAGE - Voor coaches om templates te beheren

import { useState, useEffect } from 'react'
import { Plus, FileJson, Trash2, Edit2, Users, Copy, CheckCircle, XCircle } from 'lucide-react'
import TemplateLibrary from './TemplateLibrary'

export default function TemplateManager({ db, clients = [], isMobile }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showJSONInput, setShowJSONInput] = useState(false)
  const [jsonInput, setJsonInput] = useState('')
  const [jsonError, setJsonError] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [coachId, setCoachId] = useState(null)
  
  const templateService = new TemplateLibrary(db.supabase)
  
  // Get coach ID on mount
  useEffect(() => {
    async function loadCoachId() {
      const { data: { user } } = await db.supabase.auth.getUser()
      if (user?.id) {
        console.log('✅ Coach ID loaded:', user.id)
        setCoachId(user.id)
      } else {
        console.error('❌ No coach ID found')
      }
    }
    loadCoachId()
  }, [])
  
  // Load templates when coachId is available
  useEffect(() => {
    if (coachId) {
      loadTemplates()
    }
  }, [coachId])
  
  async function loadTemplates() {
    setLoading(true)
    const data = await templateService.getTemplates(coachId)
    setTemplates(data)
    setLoading(false)
  }
  
  // Handle JSON paste & create
  async function handleCreateFromJSON() {
    try {
      setJsonError(null)
      
      // Parse JSON
      const templateData = JSON.parse(jsonInput)
      
      // Validate structure
      if (!templateData.weekStructure || !templateData.weekStructure.setA) {
        throw new Error('Template must have weekStructure with setA and setB')
      }
      
      // Create in database
      await templateService.createTemplate(templateData, coachId)
      
      // Refresh list
      await loadTemplates()
      
      // Close modal
      setShowJSONInput(false)
      setJsonInput('')
      
    } catch (error) {
      setJsonError(error.message)
    }
  }
  
  // Handle create starter template
  async function handleCreateStarter() {
    try {
      const starterTemplate = templateService.getStarterTemplate()
      await templateService.createTemplate(starterTemplate, coachId)
      await loadTemplates()
    } catch (error) {
      console.error('Error creating starter:', error)
    }
  }
  
  // Handle delete
  async function handleDelete(templateId) {
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) return
    
    try {
      await templateService.deleteTemplate(templateId)
      await loadTemplates()
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }
  
  // Handle assign to client
  async function handleAssign(template, clientId) {
    try {
      // Get client data for macros
      const client = clients.find(c => c.id === clientId)
      if (!client) return
      
      const userMacros = {
        calories: client.target_calories || 2500,
        protein: client.target_protein || 180,
        carbs: client.target_carbs || 280,
        fat: client.target_fat || 70
      }
      
      await templateService.applyTemplateToClient(template.id, clientId, userMacros)
      
      alert(`Template "${template.name}" toegewezen aan ${client.first_name}!`)
      setShowAssignModal(false)
      
    } catch (error) {
      console.error('Error assigning:', error)
      alert('Fout bij toewijzen: ' + error.message)
    }
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(255, 215, 0, 0.2)',
            borderTopColor: '#FFD700',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Templates laden...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Meal Plan Templates
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Beheer je meal plan templates en wijs ze toe aan clients
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleCreateStarter}
            style={{
              padding: isMobile ? '0.625rem' : '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Plus size={isMobile ? 16 : 18} />
            {!isMobile && 'Starter Template'}
          </button>
          
          <button
            onClick={() => setShowJSONInput(true)}
            style={{
              padding: isMobile ? '0.625rem' : '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <FileJson size={isMobile ? 16 : 18} />
            {!isMobile && 'JSON Input'}
          </button>
        </div>
      </div>
      
      {/* Template Grid */}
      {templates.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 215, 0, 0.2)'
        }}>
          <FileJson size={48} style={{ color: 'rgba(255, 215, 0, 0.3)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
            Nog geen templates
          </p>
          <button
            onClick={handleCreateStarter}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              minHeight: '44px'
            }}
          >
            Maak Eerste Template
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
                backdropFilter: 'blur(12px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                padding: '1.5rem',
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
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)'
              }} />
              
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    fontSize: '2rem',
                    lineHeight: 1
                  }}>
                    {template.emoji}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: '#FFD700',
                      marginBottom: '0.25rem'
                    }}>
                      {template.name}
                    </h3>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'rgba(255,255,255,0.5)'
                    }}>
                      {template.meals_per_day} meals/dag
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '1rem',
                lineHeight: '1.4'
              }}>
                {template.description}
              </p>
              
              {/* Macros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Calorieën</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#FFD700' }}>
                    {template.base_macros.calories}
                  </div>
                </div>
                <div style={{
                  padding: '0.5rem',
                  background: 'rgba(255, 215, 0, 0.1)',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Protein</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#FFD700' }}>
                    {template.base_macros.protein}g
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => {
                    setSelectedTemplate(template)
                    setShowAssignModal(true)
                  }}
                  style={{
                    padding: '0.625rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                >
                  <Users size={14} />
                  Assign
                </button>
                
                <button
                  onClick={() => {
                    const json = JSON.stringify(template, null, 2)
                    navigator.clipboard.writeText(json)
                    alert('JSON gekopieerd!')
                  }}
                  style={{
                    padding: '0.625rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                >
                  <Copy size={14} />
                </button>
                
                <button
                  onClick={() => handleDelete(template.id)}
                  style={{
                    padding: '0.625rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* JSON Input Modal */}
      {showJSONInput && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '700px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            padding: isMobile ? '1.5rem' : '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#FFD700',
              marginBottom: '1rem'
            }}>
              Template JSON Input
            </h2>
            
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '1rem'
            }}>
              Plak je template JSON hieronder:
            </p>
            
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`{\n  "name": "💪 My Template",\n  "emoji": "💪",\n  "description": "...",\n  "baseMacros": {...},\n  "weekStructure": {...}\n}`}
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                marginBottom: '1rem',
                resize: 'vertical'
              }}
            />
            
            {jsonError && (
              <div style={{
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.9rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <XCircle size={16} />
                {jsonError}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowJSONInput(false)
                  setJsonInput('')
                  setJsonError(null)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px'
                }}
              >
                Annuleren
              </button>
              
              <button
                onClick={handleCreateFromJSON}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#000',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
                  minHeight: '44px'
                }}
              >
                <CheckCircle size={18} />
                Template Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Assign Modal */}
      {showAssignModal && selectedTemplate && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            padding: isMobile ? '1.5rem' : '2rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#FFD700',
              marginBottom: '1rem'
            }}>
              {selectedTemplate.emoji} {selectedTemplate.name} toewijzen
            </h2>
            
            <p style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '1.5rem'
            }}>
              Selecteer een client:
            </p>
            
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '1.5rem'
            }}>
              {clients.map(client => (
                <button
                  key={client.id}
                  onClick={() => handleAssign(selectedTemplate, client.id)}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    marginBottom: '0.5rem',
                    transition: 'all 0.3s ease',
                    minHeight: '44px',
                    touchAction: 'manipulation'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                  }}
                >
                  {client.first_name} {client.last_name}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowAssignModal(false)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontWeight: '600',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Sluiten
            </button>
          </div>
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
