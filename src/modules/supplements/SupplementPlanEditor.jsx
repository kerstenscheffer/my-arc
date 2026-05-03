// src/modules/supplements/SupplementPlanEditor.jsx
// ✅ COACH INTERFACE - Edit/Customize supplement plans
// ✅ Add/Remove supplements, adjust dosages, save, approve

import React, { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'

export default function SupplementPlanEditor({ client, coach, db, isOpen, onClose }) {
  const isMobile = window.innerWidth <= 768
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState(null)
  const [supplements, setSupplements] = useState([])
  const [availableTemplates, setAvailableTemplates] = useState([])
  const [coachNotes, setCoachNotes] = useState('')
  
  useEffect(() => {
    if (isOpen && client) {
      loadPlanData()
    }
  }, [isOpen, client])
  
  const loadPlanData = async () => {
    setLoading(true)
    
    try {
      // Load existing plan
      const existingPlan = await DatabaseService.getSupplementPlan(client.id)
      
      // Load all templates (for adding new supplements)
      const templates = await DatabaseService.getSupplementTemplates()
      
      if (existingPlan) {
        setPlan(existingPlan)
        setSupplements(existingPlan.supplements || [])
        setCoachNotes(existingPlan.coach_notes || '')
      } else {
        // New plan - check if there's a draft
        const allPlans = await DatabaseService.getAllSupplementPlans(coach.id, 'draft')
        const clientDraft = allPlans.find(p => p.client_id === client.id)
        
        if (clientDraft) {
          setPlan(clientDraft)
          setSupplements(clientDraft.supplements || [])
          setCoachNotes(clientDraft.coach_notes || '')
        }
      }
      
      setAvailableTemplates(templates || [])
      console.log('✅ Plan editor loaded')
      
    } catch (error) {
      console.error('❌ Failed to load plan data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleAddSupplement = async (templateId) => {
    try {
      const template = availableTemplates.find(t => t.supplement_id === templateId)
      if (!template) return
      
      // Enrich with products
      const enriched = await DatabaseService.enrichSupplementWithProducts(template)
      
      setSupplements(prev => [...prev, enriched])
      
    } catch (error) {
      console.error('❌ Failed to add supplement:', error)
    }
  }
  
  const handleRemoveSupplement = (index) => {
    setSupplements(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleUpdateDosage = (index, newDosage) => {
    setSupplements(prev => prev.map((supp, i) => 
      i === index ? { ...supp, dosage: newDosage } : supp
    ))
  }
  
  const handleUpdateNotes = (index, notes) => {
    setSupplements(prev => prev.map((supp, i) => 
      i === index ? { ...supp, custom_notes: notes } : supp
    ))
  }
  
  const handleSaveDraft = async () => {
    setSaving(true)
    
    try {
      const planData = {
        client_id: client.id,
        coach_id: coach.id,
        supplements: supplements,
        client_weight: client.weight,
        training_frequency: client.training_frequency,
        goal: 'bulk',
        coach_notes: coachNotes,
        status: 'draft'
      }
      
      let result
      if (plan?.id) {
        // Update existing
        result = await DatabaseService.updateSupplementPlan(plan.id, planData)
      } else {
        // Create new
        result = await DatabaseService.createSupplementPlan(planData)
      }
      
      if (result) {
        console.log('✅ Draft saved')
        alert('✅ Draft opgeslagen')
        onClose(true)
      }
      
    } catch (error) {
      console.error('❌ Failed to save draft:', error)
      alert('❌ Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }
  
  const handleApproveAndActivate = async () => {
    if (!confirm(`Plan activeren voor ${client.name}?\n\nDe client kan het supplement plan dan zien.`)) {
      return
    }
    
    setSaving(true)
    
    try {
      // First save as draft if not exists
      let planId = plan?.id
      
      if (!planId) {
        const newPlan = await DatabaseService.createSupplementPlan({
          client_id: client.id,
          coach_id: coach.id,
          supplements: supplements,
          client_weight: client.weight,
          training_frequency: client.training_frequency,
          goal: 'bulk',
          coach_notes: coachNotes,
          status: 'draft'
        })
        
        planId = newPlan?.id
      }
      
      if (!planId) {
        throw new Error('Failed to create plan')
      }
      
      // Activate
      await DatabaseService.activateSupplementPlan(planId, client.id)
      
      console.log('✅ Plan activated')
      alert(`✅ Plan geactiveerd voor ${client.name}!`)
      onClose(true)
      
    } catch (error) {
      console.error('❌ Failed to activate:', error)
      alert('❌ Er ging iets mis bij het activeren')
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  const totalCost = supplements.reduce((sum, s) => sum + (s.cost_per_month || 0), 0)
  
  // Available supplements to add (not already in plan)
  const alreadyAdded = supplements.map(s => s.template_id)
  const availableToAdd = availableTemplates.filter(t => !alreadyAdded.includes(t.supplement_id))
  
  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => onClose(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease'
        }}
      />
      
      {/* Editor Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: isMobile ? '100%' : '600px',
          height: '100vh',
          background: '#000000',
          borderLeft: isMobile ? 'none' : '1px solid #1a1a1a',
          zIndex: 1000,
          overflowY: 'auto',
          padding: isMobile ? '1.5rem 1rem' : '2rem 1.5rem',
          animation: 'slideInRight 0.3s ease',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.5)'
        }}
      >
        
        {/* HEADER */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div>
              <h2 style={{
                color: '#9333ea',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: 600,
                margin: 0,
                marginBottom: '0.5rem'
              }}>
                ✏️ Edit Supplement Plan
              </h2>
              <div style={{
                color: '#ffffff',
                fontSize: '1.05rem',
                fontWeight: 500
              }}>
                {client.name}
              </div>
              <div style={{
                color: '#888888',
                fontSize: '0.875rem',
                marginTop: '0.25rem'
              }}>
                {client.weight}kg • {client.training_frequency}x/week training
              </div>
            </div>
            
            <button
              onClick={() => onClose(false)}
              style={{
                background: 'transparent',
                border: '1px solid #1a1a1a',
                color: '#888888',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.25rem',
                minHeight: '44px',
                minWidth: '44px'
              }}
            >
              ✕
            </button>
          </div>
          
          {/* Total Cost */}
          <div style={{
            padding: '1rem',
            background: 'rgba(147, 51, 234, 0.1)',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            borderRadius: '12px'
          }}>
            <div style={{
              color: '#888888',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
              textTransform: 'uppercase'
            }}>
              Totale kosten per maand
            </div>
            <div style={{
              color: '#9333ea',
              fontSize: '1.75rem',
              fontWeight: 700
            }}>
              €{totalCost.toFixed(0)}
            </div>
            <div style={{
              color: '#a855f7',
              fontSize: '0.875rem',
              marginTop: '0.25rem'
            }}>
              {supplements.length} supplementen
            </div>
          </div>
        </div>
        
        {/* LOADING */}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#888888'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(147, 51, 234, 0.2)',
              borderTop: '4px solid #9333ea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }} />
          </div>
        )}
        
        {/* SUPPLEMENTS LIST */}
        {!loading && (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{
                color: '#ffffff',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '1rem'
              }}>
                📋 Supplementen in Plan
              </h3>
              
              {supplements.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '2rem',
                  background: '#0a0a0a',
                  border: '1px dashed #1a1a1a',
                  borderRadius: '12px',
                  color: '#888888'
                }}>
                  Geen supplementen toegevoegd
                </div>
              )}
              
              {supplements.map((supp, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1.25rem',
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderLeft: '3px solid #9333ea',
                    borderRadius: '12px',
                    marginBottom: '1rem'
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.75rem' }}>{supp.emoji}</span>
                      <div>
                        <div style={{
                          color: '#ffffff',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}>
                          {supp.name}
                        </div>
                        <div style={{
                          color: '#888888',
                          fontSize: '0.8rem',
                          marginTop: '0.25rem'
                        }}>
                          €{supp.cost_per_month}/maand
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRemoveSupplement(index)}
                      style={{
                        background: 'transparent',
                        border: '1px solid #1a1a1a',
                        color: '#888888',
                        padding: '0.5rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.125rem',
                        minHeight: '40px',
                        minWidth: '40px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1a1a1a'
                        e.currentTarget.style.color = '#888888'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  
                  {/* Dosage (editable) */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{
                      display: 'block',
                      color: '#888888',
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase'
                    }}>
                      Dosering
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={supp.dosage?.amount || ''}
                        onChange={(e) => handleUpdateDosage(index, {
                          ...supp.dosage,
                          amount: e.target.value
                        })}
                        placeholder="5"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#000',
                          border: '1px solid #1a1a1a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.95rem'
                        }}
                      />
                      <input
                        type="text"
                        value={supp.dosage?.unit || ''}
                        onChange={(e) => handleUpdateDosage(index, {
                          ...supp.dosage,
                          unit: e.target.value
                        })}
                        placeholder="gram"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#000',
                          border: '1px solid #1a1a1a',
                          borderRadius: '8px',
                          color: '#ffffff',
                          fontSize: '0.95rem'
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Custom Notes */}
                  <div>
                    <label style={{
                      display: 'block',
                      color: '#888888',
                      fontSize: '0.8rem',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase'
                    }}>
                      Custom Notes (optioneel)
                    </label>
                    <input
                      type="text"
                      value={supp.custom_notes || ''}
                      onChange={(e) => handleUpdateNotes(index, e.target.value)}
                      placeholder="Bijv: Extra water drinken..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#000',
                        border: '1px solid #1a1a1a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* ADD SUPPLEMENT */}
            {availableToAdd.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  marginBottom: '1rem'
                }}>
                  ➕ Supplement Toevoegen
                </h3>
                
                <div style={{
                  display: 'grid',
                  gap: '0.75rem'
                }}>
                  {availableToAdd.map(template => (
                    <button
                      key={template.supplement_id}
                      onClick={() => handleAddSupplement(template.supplement_id)}
                      style={{
                        padding: '1rem',
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        borderRadius: '12px',
                        color: '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#9333ea'
                        e.currentTarget.style.background = 'rgba(147, 51, 234, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#1a1a1a'
                        e.currentTarget.style.background = '#0a0a0a'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{template.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {template.name}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#888888'
                        }}>
                          {template.priority_level === 'essential' ? '🔴 Essential' :
                           template.priority_level === 'recommended' ? '🟡 Recommended' :
                           '⚪ Optional'} • €{template.cost_per_month}/maand
                        </div>
                      </div>
                      <div style={{ color: '#9333ea', fontSize: '1.25rem' }}>
                        ➕
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* COACH NOTES */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                color: '#ffffff',
                fontSize: '1.125rem',
                fontWeight: 600,
                marginBottom: '0.75rem'
              }}>
                💬 Coach Notes
              </label>
              <textarea
                value={coachNotes}
                onChange={(e) => setCoachNotes(e.target.value)}
                placeholder="Algemene notities voor de client over het supplement plan..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.6
                }}
              />
            </div>
            
            {/* ACTIONS */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #1a1a1a'
            }}>
              <button
                onClick={handleSaveDraft}
                disabled={saving || supplements.length === 0}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: '#0a0a0a',
                  border: '1px solid #9333ea',
                  borderRadius: '12px',
                  color: '#9333ea',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: saving || supplements.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: saving || supplements.length === 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  minHeight: '48px'
                }}
                onMouseEnter={(e) => {
                  if (!saving && supplements.length > 0) {
                    e.currentTarget.style.background = 'rgba(147, 51, 234, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#0a0a0a'
                }}
              >
                {saving ? '💾 Saving...' : '💾 Save Draft'}
              </button>
              
              <button
                onClick={handleApproveAndActivate}
                disabled={saving || supplements.length === 0}
                style={{
                  flex: 1,
                  padding: '1rem',
                  background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: saving || supplements.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: saving || supplements.length === 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  minHeight: '48px',
                  boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!saving && supplements.length > 0) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.3)'
                }}
              >
                {saving ? '⚡ Activating...' : '⚡ Approve & Activate'}
              </button>
            </div>
          </>
        )}
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
            }
            to {
              transform: translateX(0);
            }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  )
}
