// src/modules/output-planning/components/week-planning/AddSalesModal.jsx
// Modal to add a new sales call with prospect info
// Pattern based on AddItemModal.jsx

import { useState } from 'react'
import { X, User, Building2, Mail, Phone as PhoneIcon, Calendar, Clock, Video } from 'lucide-react'
import { GOLD } from './constants'

const PLATFORMS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'phone', label: 'Telefoon' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'other', label: 'Anders' }
]

export default function AddSalesModal({
  isOpen,
  onClose,
  onSave,
  isMobile
}) {
  const [formData, setFormData] = useState({
    title: '',
    prospectName: '',
    prospectCompany: '',
    prospectEmail: '',
    prospectPhone: '',
    callDate: '',
    callTime: '14:00',
    callDuration: 30,
    callPlatform: 'zoom',
    callLink: '',
    needsPrep: true,
    needsFollowup: true,
    needsCall: true,
    needsAftersale: true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e?.preventDefault()
    
    if (!formData.prospectName.trim()) {
      setError('Prospect naam is verplicht')
      return
    }
    
    setSaving(true)
    setError('')
    
    try {
      await onSave(formData)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: isMobile ? '1rem' : '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        border: `1px solid ${GOLD.border}`,
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem',
          borderBottom: `1px solid ${GOLD.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.1rem',
            fontWeight: '700',
            color: GOLD.primary
          }}>
            Nieuwe Sales Call
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          flex: 1,
          overflow: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Prospect Name */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.375rem'
            }}>
              <User size={12} />
              Prospect Naam *
            </label>
            <input
              type="text"
              value={formData.prospectName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                prospectName: e.target.value,
                title: prev.title || `Call met ${e.target.value}`
              }))}
              placeholder="Jan Jansen"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Company (optional) */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.375rem'
            }}>
              <Building2 size={12} />
              Bedrijf (optioneel)
            </label>
            <input
              type="text"
              value={formData.prospectCompany}
              onChange={(e) => setFormData(prev => ({ ...prev, prospectCompany: e.target.value }))}
              placeholder="Bedrijfsnaam"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Email + Phone */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <Mail size={12} />
                Email
              </label>
              <input
                type="email"
                value={formData.prospectEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, prospectEmail: e.target.value }))}
                placeholder="email@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <PhoneIcon size={12} />
                Telefoon
              </label>
              <input
                type="tel"
                value={formData.prospectPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, prospectPhone: e.target.value }))}
                placeholder="+31 6 12345678"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          
          {/* Call Date + Time */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem'
          }}>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <Calendar size={12} />
                Call Datum
              </label>
              <input
                type="date"
                value={formData.callDate}
                onChange={(e) => setFormData(prev => ({ ...prev, callDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.375rem'
              }}>
                <Clock size={12} />
                Tijd
              </label>
              <input
                type="time"
                value={formData.callTime}
                onChange={(e) => setFormData(prev => ({ ...prev, callTime: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#111',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          
          {/* Platform + Link */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.375rem'
            }}>
              <Video size={12} />
              Platform
            </label>
            <select
              value={formData.callPlatform}
              onChange={(e) => setFormData(prev => ({ ...prev, callPlatform: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                marginBottom: '0.5rem'
              }}
            >
              {PLATFORMS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            
            <input
              type="url"
              value={formData.callLink}
              onChange={(e) => setFormData(prev => ({ ...prev, callLink: e.target.value }))}
              placeholder="https://zoom.us/j/..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          {/* Phase Checkboxes */}
          <div style={{
            padding: '0.75rem',
            background: 'rgba(255, 215, 0, 0.05)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '8px'
          }}>
            <p style={{
              margin: '0 0 0.5rem',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              Welke phases wil je inplannen?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { key: 'needsPrep', label: 'Prep (voorbereiding)' },
                { key: 'needsFollowup', label: 'Follow-up bericht' },
                { key: 'needsCall', label: 'Sales Call' },
                { key: 'needsAftersale', label: 'After Sale + Reflectie' }
              ].map(phase => (
                <label key={phase.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: '#fff'
                }}>
                  <input
                    type="checkbox"
                    checked={formData[phase.key]}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      [phase.key]: e.target.checked 
                    }))}
                    style={{ cursor: 'pointer' }}
                  />
                  {phase.label}
                </label>
              ))}
            </div>
          </div>
          
          {error && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '0.85rem'
            }}>
              {error}
            </div>
          )}
        </form>
        
        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '700',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Bezig...' : 'Volgende →'}
          </button>
        </div>
      </div>
    </div>
  )
}
