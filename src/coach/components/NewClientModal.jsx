// src/coach/components/NewClientModal.jsx
import { useState } from 'react'
import { X, User, Mail, Phone, Send } from 'lucide-react'

export default function NewClientModal({ onClose, onSubmit, isMobile }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    primary_goal: '', // We'll map this to 'goal' in DatabaseService
    experience_level: '' // We'll map this to 'experience' in DatabaseService
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Pass form data to parent's handleCreateClient
      const result = await onSubmit(formData)
      
      // Show credentials if successful
      if (result?.loginCredentials) {
        alert(`✅ Client aangemaakt!\n\nEmail: ${result.loginCredentials.email}\nWachtwoord: ${result.loginCredentials.password}\n\nDeel deze gegevens met je client.`)
      }
      
      onClose()
    } catch (error) {
      console.error('Error in modal:', error)
      alert(`❌ Fout bij aanmaken: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '1rem' : '2rem',
      zIndex: 1000
    }}>
      <div style={{
        background: 'rgba(17, 17, 17, 0.98)',
        borderRadius: isMobile ? '16px' : '20px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        width: '100%',
        maxWidth: isMobile ? '100%' : '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <User size={isMobile ? 20 : 24} color="#10b981" />
            Nieuwe Client
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '0.25rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          padding: isMobile ? '1.25rem' : '1.5rem'
        }}>
          {/* Name Fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.875rem' : '0.9rem'
              }}>
                Voornaam *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.875rem' : '0.9rem'
              }}>
                Achternaam *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: isMobile ? '1rem' : '1rem',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)'
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.875rem' : '0.9rem'
            }}>
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1rem',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.875rem' : '0.9rem'
            }}>
              Telefoon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '1rem' : '1rem',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
            />
          </div>

          {/* Goal & Experience */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.875rem' : '0.9rem'
              }}>
                Doel
              </label>
              <select
                value={formData.primary_goal}
                onChange={(e) => setFormData({...formData, primary_goal: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: formData.primary_goal ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '1rem' : '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="" style={{ background: '#111' }}>Selecteer doel</option>
                <option value="weight_loss" style={{ background: '#111' }}>Gewichtsverlies</option>
                <option value="muscle_gain" style={{ background: '#111' }}>Spiergroei</option>
                <option value="strength" style={{ background: '#111' }}>Kracht</option>
                <option value="general_fitness" style={{ background: '#111' }}>Algemene Fitness</option>
                <option value="athletic_performance" style={{ background: '#111' }}>Atletische Prestaties</option>
              </select>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.875rem' : '0.9rem'
              }}>
                Niveau
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({...formData, experience_level: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: formData.experience_level ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '1rem' : '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <option value="" style={{ background: '#111' }}>Selecteer niveau</option>
                <option value="beginner" style={{ background: '#111' }}>Beginner (0-18 maanden)</option>
                <option value="intermediate" style={{ background: '#111' }}>Gemiddeld (1.5-3 jaar)</option>
                <option value="advanced" style={{ background: '#111' }}>Gevorderd (3+ jaar)</option>
              </select>
            </div>
          </div>

          {/* Note about password */}
          <div style={{
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.875rem' : '0.9rem',
              margin: 0
            }}>
              ℹ️ Een tijdelijk wachtwoord wordt automatisch gegenereerd en getoond na het aanmaken
            </p>
          </div>

          {/* Submit Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              Annuleren
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                background: loading 
                  ? 'rgba(16, 185, 129, 0.5)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Send size={16} />
              {loading ? 'Aanmaken...' : 'Client Toevoegen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
