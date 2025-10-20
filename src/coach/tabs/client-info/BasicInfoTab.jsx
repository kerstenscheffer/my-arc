// src/coach/tabs/client-info/BasicInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, User, Mail, Phone, Calendar, MapPin, AlertCircle } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function BasicInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const service = new ClientIntelligenceService(db)
  
  // Load client data when client changes
  useEffect(() => {
    if (client) {
      loadClientData()
    }
  }, [client?.id])
  
  const loadClientData = async () => {
    setLoading(true)
    try {
      const profile = await service.getCompleteProfile(client.id)
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || '',
        location: client.location || 'Amsterdam, Nederland',
        emergencyContactName: profile.emergencyContactName || '',
        emergencyContactPhone: profile.emergencyContactPhone || ''
      })
    } catch (error) {
      console.error('Error loading client data:', error)
      // Fallback to basic client data
      setFormData({
        firstName: client.first_name || '',
        lastName: client.last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        dateOfBirth: client.date_of_birth || '',
        gender: client.gender || '',
        location: client.location || 'Amsterdam, Nederland',
        emergencyContactName: client.emergency_contact_name || '',
        emergencyContactPhone: client.emergency_contact_phone || ''
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await service.updateProfile(client.id, formData)
      await onRefresh() // Refresh parent data
      setIsEditing(false)
      alert('✅ Basic information updated successfully!')
    } catch (error) {
      console.error('Error saving basic info:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    loadClientData() // Reset to original data
    setIsEditing(false)
  }
  
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
  
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  return (
    <div>
      {/* Edit/Save Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              transition: 'all 0.3s ease',
              transform: 'translateZ(0)'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            <Edit2 size={16} />
            Edit Basic Info
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.85rem',
                cursor: 'pointer',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <X size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
                background: saving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.85rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                minHeight: '44px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
      
      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Personal Information */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <User size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Personal Information
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="First Name" 
              value={formData.firstName} 
              onChange={(v) => setFormData({...formData, firstName: v})} 
              isEditing={isEditing}
              required
              isMobile={isMobile}
            />
            <Field 
              label="Last Name" 
              value={formData.lastName} 
              onChange={(v) => setFormData({...formData, lastName: v})} 
              isEditing={isEditing}
              required
              isMobile={isMobile}
            />
            <Field 
              label="Email" 
              value={formData.email} 
              onChange={(v) => setFormData({...formData, email: v})} 
              isEditing={isEditing} 
              type="email"
              required
              isMobile={isMobile}
            />
            <Field 
              label="Phone" 
              value={formData.phone} 
              onChange={(v) => setFormData({...formData, phone: v})} 
              isEditing={isEditing}
              placeholder="+31 6 12345678"
              isMobile={isMobile}
            />
            <Field 
              label="Date of Birth" 
              value={formData.dateOfBirth} 
              onChange={(v) => setFormData({...formData, dateOfBirth: v})} 
              isEditing={isEditing} 
              type="date"
              isMobile={isMobile}
            />
            {formData.dateOfBirth && (
              <div style={{
                padding: '0.5rem',
                background: 'rgba(16, 185, 129, 0.05)',
                borderRadius: '6px',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                🎂 Age: {calculateAge(formData.dateOfBirth)} years
              </div>
            )}
            <Field 
              label="Gender" 
              value={formData.gender} 
              onChange={(v) => setFormData({...formData, gender: v})} 
              isEditing={isEditing} 
              type="select"
              options={[
                { value: '', label: 'Select...' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ]}
              isMobile={isMobile}
            />
            <Field 
              label="Location" 
              value={formData.location} 
              onChange={(v) => setFormData({...formData, location: v})} 
              isEditing={isEditing}
              placeholder="City, Country"
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Emergency Contact */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Emergency Contact
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Contact Name" 
              value={formData.emergencyContactName} 
              onChange={(v) => setFormData({...formData, emergencyContactName: v})} 
              isEditing={isEditing}
              placeholder="Full name"
              isMobile={isMobile}
            />
            <Field 
              label="Contact Phone" 
              value={formData.emergencyContactPhone} 
              onChange={(v) => setFormData({...formData, emergencyContactPhone: v})} 
              isEditing={isEditing}
              placeholder="+31 6 12345678"
              isMobile={isMobile}
            />
            
            {/* Emergency info note */}
            {!formData.emergencyContactName && !formData.emergencyContactPhone && (
              <div style={{
                padding: isMobile ? '0.6rem' : '0.75rem',
                background: 'rgba(251, 191, 36, 0.05)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#fbbf24'
              }}>
                ⚠️ No emergency contact set
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          <div style={{
            marginTop: '1.5rem',
            padding: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(16, 185, 129, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(16, 185, 129, 0.1)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem'
            }}>
              Account Status
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem'
            }}>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>Status:</span>
                <span style={{ color: '#10b981', marginLeft: '0.25rem' }}>{client.status || 'Active'}</span>
              </div>
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: isMobile ? '0.7rem' : '0.75rem' }}>ID:</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.6)', marginLeft: '0.25rem', fontSize: isMobile ? '0.65rem' : '0.7rem' }}>
                  {client.id.slice(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
