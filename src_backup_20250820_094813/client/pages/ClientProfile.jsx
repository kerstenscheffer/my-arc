// src/client/pages/ClientProfile.jsx - SIMPLE PROFILE PAGE
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { supabase } from '../../lib/supabase'

// Icon URLs
const iconUrls = {
  profile: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909977/settings_images/1e1d3f-24b5-b48-37a-1537c7b8f05e_MIND_12_.png",
  email: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b83b4d-cd-c11c-bbc3-72d4e7af7c_11.png",
  phone: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/01e28db-8cd3-0be1-e3dc-4103b1cd6f06_10.png",
  goal: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161970645/settings_images/b3c326-4f5-e7ca-42ff-e70f80ceffe5_8.png",
  coach: "https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/file-uploads/themes/2161909596/settings_images/6fdbdf-1af6-0d32-752b-12f22af8a2ac_IMG_3254.jpeg"
}

export default function ClientProfile({ client, user }) {
  const { t, language, toggleLanguage } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    phone: client?.phone || '',
    goal: client?.goal || '',
    experience: client?.experience || 'beginner'
  })
  const [saving, setSaving] = useState(false)
  
  const isMobile = window.innerWidth <= 768

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          phone: formData.phone,
          goal: formData.goal,
          experience: formData.experience,
          updated_at: new Date().toISOString()
        })
        .eq('id', client.id)
      
      if (error) throw error
      
      alert('Profiel bijgewerkt!')
      setIsEditing(false)
      // Reload page to show new data
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Fout bij opslaan')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="myarc-animate-in" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0a5c42 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #10b981'
          }}>
            <img src={iconUrls.profile} alt="" style={{ width: '60px', height: '60px' }} />
          </div>
          
          <h1 style={{ 
            color: '#fff', 
            fontSize: '2rem', 
            marginBottom: '0.5rem',
            fontWeight: 'bold'
          }}>
            {client?.first_name} {client?.last_name}
          </h1>
          <p style={{ 
            color: '#d1fae5', 
            fontSize: '1rem'
          }}>
            MY ARC Member sinds {new Date(client?.created_at).toLocaleDateString('nl-NL')}
          </p>
        </div>
      </div>

      {/* Profile Info */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #10b98133'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ 
            color: '#10b981', 
            fontSize: '1.2rem',
            fontWeight: 'bold'
          }}>
            Persoonlijke Informatie
          </h3>
          
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '0.5rem 1rem',
                background: 'transparent',
                border: '1px solid #10b981',
                borderRadius: '6px',
                color: '#10b981',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Bewerken
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: saving ? 0.5 : 1
                }}
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Annuleren
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Email (read-only) */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              <img src={iconUrls.email} alt="" style={{ width: '16px', height: '16px' }} />
              Email
            </label>
            <input
              type="email"
              value={client?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#0b1510',
                border: '1px solid #10b98133',
                borderRadius: '6px',
                color: '#9ca3af',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              <img src={iconUrls.phone} alt="" style={{ width: '16px', height: '16px' }} />
              Telefoon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="06-12345678"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isEditing ? '#0b1510' : '#0b1510',
                border: `1px solid ${isEditing ? '#10b981' : '#10b98133'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Goal */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              <img src={iconUrls.goal} alt="" style={{ width: '16px', height: '16px' }} />
              Doel
            </label>
            <textarea
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              disabled={!isEditing}
              placeholder="Wat is jouw fitness doel?"
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isEditing ? '#0b1510' : '#0b1510',
                border: `1px solid ${isEditing ? '#10b981' : '#10b98133'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                resize: 'none'
              }}
            />
          </div>

          {/* Experience */}
          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '0.5rem'
            }}>
              Ervaring Level
            </label>
            <select
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              disabled={!isEditing}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: isEditing ? '#0b1510' : '#0b1510',
                border: `1px solid ${isEditing ? '#10b981' : '#10b98133'}`,
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
                cursor: isEditing ? 'pointer' : 'not-allowed'
              }}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Gevorderd</option>
              <option value="advanced">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coach Info */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #10b98133'
      }}>
        <h3 style={{ 
          color: '#10b981', 
          fontSize: '1.2rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          Jouw Coach
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <img 
            src={iconUrls.coach} 
            alt="Coach" 
            style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%',
              border: '2px solid #10b981'
            }}
          />
          <div>
            <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
              Kersten Scheffer
            </h4>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
              Founder MY ARC • Personal Trainer
            </p>
          </div>
        </div>
        
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: '8px',
          border: '1px solid #10b98133'
        }}>
          <p style={{ color: '#fff', fontSize: '0.9rem', lineHeight: 1.6 }}>
            "Samen werken we aan jouw doelen. Bij vragen kun je me altijd bereiken via de app of WhatsApp!"
          </p>
        </div>
      </div>

      {/* Settings */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        border: '1px solid #10b98133'
      }}>
        <h3 style={{ 
          color: '#10b981', 
          fontSize: '1.2rem',
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          Instellingen
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Language Toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid #10b98133'
          }}>
            <span style={{ color: '#fff' }}>Taal / Language</span>
            <button
              onClick={toggleLanguage}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                border: 'none',
                borderRadius: '6px',
                color: '#000',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1.2rem'
              }}
            >
              {language === 'nl' ? '🇳🇱' : '🇬🇧'}
            </button>
          </div>
          
          {/* App Version */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid #10b98133'
          }}>
            <span style={{ color: '#fff' }}>App Versie</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>MY ARC v1.0</span>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '1rem',
          background: 'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
          border: 'none',
          borderRadius: '12px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        Uitloggen
      </button>
    </div>
  )
}
