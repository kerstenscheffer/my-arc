// src/modules/workout/components/planning/WeekTemplateModal.jsx
// WEEK TEMPLATE MODAL - Save & Load Week Planning 📅

import { X, Save, Calendar, Trash2, Download } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function WeekTemplateModal({
  workoutService,
  clientId,
  currentSchedule,
  mode = 'save', // 'save' or 'load'
  onClose,
  onLoad
}) {
  const isMobile = window.innerWidth <= 768
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  
  // Save mode state
  const [templateName, setTemplateName] = useState('')
  const [nameError, setNameError] = useState('')
  
  // Load mode state
  const [templates, setTemplates] = useState([])
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    document.body.style.overflow = 'hidden'
    
    if (mode === 'load') {
      loadTemplates()
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [mode])
  
  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await workoutService.getWeekTemplates(clientId)
      setTemplates(data)
    } catch (error) {
      console.error('❌ Load templates failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    if (!templateName.trim()) {
      setNameError('Naam is verplicht')
      return
    }
    
    setSaving(true)
    
    try {
      await workoutService.saveWeekTemplate(
        clientId,
        templateName.trim(),
        currentSchedule
      )
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      handleClose()
      
    } catch (error) {
      console.error('❌ Save template failed:', error)
      alert('Kon template niet opslaan. Probeer opnieuw.')
      setSaving(false)
    }
  }
  
  const handleLoad = async (templateId) => {
    setLoading(true)
    
    try {
      const schedule = await workoutService.loadWeekTemplate(templateId)
      
      if (schedule && onLoad) {
        onLoad(schedule)
      }
      
      if (navigator.vibrate) navigator.vibrate([50, 100, 50])
      
      handleClose()
      
    } catch (error) {
      console.error('❌ Load template failed:', error)
      alert('Kon template niet laden. Probeer opnieuw.')
      setLoading(false)
    }
  }
  
  const handleDelete = async (templateId) => {
    if (!confirm('Weet je zeker dat je deze week template wilt verwijderen?')) {
      return
    }
    
    setDeleting(templateId)
    
    try {
      await workoutService.deleteWeekTemplate(templateId)
      
      // Refresh list
      await loadTemplates()
      
      if (navigator.vibrate) navigator.vibrate(50)
      
    } catch (error) {
      console.error('❌ Delete template failed:', error)
      alert('Kon template niet verwijderen. Probeer opnieuw.')
    } finally {
      setDeleting(null)
    }
  }
  
  const handleClose = () => {
    setVisible(false)
    setTimeout(() => onClose(), 300)
  }
  
  // Count activities in schedule
  const countScheduledDays = (schedule) => {
    if (!schedule) return 0
    return Object.keys(schedule).length
  }
  
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(10px)',
        zIndex: 10002,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '2rem',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        style={{
          width: '100%',
          height: isMobile ? '100vh' : 'auto',
          maxWidth: isMobile ? '100%' : '600px',
          maxHeight: isMobile ? '100vh' : '85vh',
          background: '#000',
          border: isMobile ? 'none' : '2px solid rgba(249, 115, 22, 0.3)',
          borderRadius: '0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '8px',
                background: 'rgba(249, 115, 22, 0.2)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.3))'
              }}>
                {mode === 'save' ? (
                  <Save size={isMobile ? 18 : 20} color="#f97316" />
                ) : (
                  <Download size={isMobile ? 18 : 20} color="#f97316" />
                )}
              </div>
              
              <h2 style={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                fontWeight: '900',
                color: '#fff',
                margin: 0,
                letterSpacing: '-0.02em',
                textShadow: '0 0 20px rgba(249, 115, 22, 0.3)'
              }}>
                {mode === 'save' ? 'Week Opslaan' : 'Week Laden'}
              </h2>
            </div>
            
            <button
              onClick={handleClose}
              style={{
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '0',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={isMobile ? 20 : 24} strokeWidth={2.5} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: isMobile ? '1rem' : '1.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {mode === 'save' ? (
            // SAVE MODE
            <div>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem',
                fontWeight: '600',
                lineHeight: 1.6
              }}>
                Sla je huidige weekplanning op als template. Je kunt deze later snel herladen om tijd te besparen.
              </p>
              
              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(249, 115, 22, 0.05)',
                border: '1px solid rgba(249, 115, 22, 0.15)',
                borderRadius: '0',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.5rem'
                }}>
                  Huidige planning
                </div>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  color: '#f97316',
                  fontWeight: '800'
                }}>
                  {countScheduledDays(currentSchedule)} dagen ingepland
                </div>
              </div>
              
              <label style={{
                display: 'block',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}>
                Template Naam *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value)
                  setNameError('')
                }}
                placeholder="Bijv. Opbouw Week, Deload Week, Vakantie Week"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem 1rem' : '0.875rem 1.125rem',
                  background: 'rgba(249, 115, 22, 0.05)',
                  border: nameError
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : '1px solid rgba(249, 115, 22, 0.2)',
                  borderRadius: '0',
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
              />
              {nameError && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#ef4444',
                  marginTop: '0.25rem',
                  fontWeight: '600'
                }}>
                  {nameError}
                </p>
              )}
            </div>
          ) : (
            // LOAD MODE
            <div>
              <p style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '1.5rem',
                fontWeight: '600',
                lineHeight: 1.6
              }}>
                Kies een opgeslagen week template om je planning snel in te vullen.
              </p>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(249, 115, 22, 0.2)',
                    borderTopColor: '#f97316',
                    borderRadius: '50%',
                    margin: '0 auto 1rem',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: '600'
                  }}>
                    Templates laden...
                  </p>
                </div>
              ) : templates.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 1rem'
                }}>
                  <Calendar 
                    size={isMobile ? 48 : 56} 
                    color="rgba(249, 115, 22, 0.3)"
                    style={{ marginBottom: '1rem' }}
                  />
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem'
                  }}>
                    Nog geen templates opgeslagen
                  </p>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: '600'
                  }}>
                    Sla een weekplanning op om deze later terug te halen
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {templates.map(template => (
                    <div
                      key={template.id}
                      style={{
                        padding: isMobile ? '1rem' : '1.25rem',
                        background: 'rgba(10, 10, 10, 0.8)',
                        border: '1px solid rgba(249, 115, 22, 0.2)',
                        borderRadius: '0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: '800',
                          color: '#fff',
                          marginBottom: '0.3rem'
                        }}>
                          {template.template_name}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: '600'
                        }}>
                          {countScheduledDays(template.schedule)} dagen • {new Date(template.created_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => handleLoad(template.id)}
                          disabled={loading}
                          style={{
                            padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            border: 'none',
                            borderRadius: '0',
                            color: '#000',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(249, 115, 22, 0.3)',
                            minHeight: '44px',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            opacity: loading ? 0.7 : 1
                          }}
                        >
                          Laden
                        </button>
                        
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={deleting === template.id}
                          style={{
                            width: '44px',
                            height: '44px',
                            minHeight: '44px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '0',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: deleting === template.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent',
                            opacity: deleting === template.id ? 0.5 : 1
                          }}
                        >
                          <Trash2 size={isMobile ? 16 : 18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Footer - Only for SAVE mode */}
        {mode === 'save' && (
          <div style={{
            padding: isMobile ? '1rem' : '1.5rem',
            borderTop: '1px solid rgba(249, 115, 22, 0.2)',
            flexShrink: 0,
            display: 'flex',
            gap: '0.75rem'
          }}>
            <button
              onClick={handleClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0',
                color: '#ef4444',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              Annuleren
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 2,
                padding: isMobile ? '0.875rem' : '1rem',
                background: saving
                  ? 'rgba(107, 114, 128, 0.3)'
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                borderRadius: '0',
                color: saving ? 'rgba(255, 255, 255, 0.5)' : '#000',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: saving ? 'none' : '0 4px 20px rgba(249, 115, 22, 0.35)',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: isMobile ? '16px' : '18px',
                    height: isMobile ? '16px' : '18px',
                    border: '2px solid rgba(0, 0, 0, 0.3)',
                    borderTopColor: '#000',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save size={isMobile ? 16 : 18} />
                  Template Opslaan
                </>
              )}
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  )
}
