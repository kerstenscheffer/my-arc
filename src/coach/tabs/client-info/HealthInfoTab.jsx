// src/coach/tabs/client-info/HealthInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, Heart, Pill, AlertTriangle } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function HealthInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const service = new ClientIntelligenceService(db)
  
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
        medicalConditions: profile.medicalConditions || '',
        medications: profile.medications || '',
        injuries: profile.injuries || '',
        supplements: profile.supplements || '',
        pregnant: profile.pregnant || false,
        breastfeeding: profile.breastfeeding || false
      })
    } catch (error) {
      console.error('Error loading health data:', error)
      setFormData({
        medicalConditions: client.medical_conditions || client.medical_notes || '',
        medications: client.medications || '',
        injuries: client.injuries || '',
        supplements: client.supplements || '',
        pregnant: client.pregnant || false,
        breastfeeding: client.breastfeeding || false
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await service.updateProfile(client.id, formData)
      await onRefresh()
      setIsEditing(false)
      alert('✅ Health information updated successfully!')
    } catch (error) {
      console.error('Error saving health:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    loadClientData()
    setIsEditing(false)
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
              minHeight: '44px'
            }}
          >
            <Edit2 size={16} />
            Edit Health Info
          </button>
        ) : (
          <>
            <button onClick={handleCancel} style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.85rem',
              cursor: 'pointer',
              minHeight: '44px'
            }}>
              <X size={16} />
            </button>
            <button onClick={handleSave} disabled={saving} style={{
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
              minHeight: '44px'
            }}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
      
      {/* Content */}
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
          <Heart size={18} color="#10b981" />
          <h3 style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            color: '#10b981',
            margin: 0
          }}>
            Health Information
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Field 
            label="Medical Conditions" 
            value={formData.medicalConditions} 
            onChange={(v) => setFormData({...formData, medicalConditions: v})} 
            isEditing={isEditing} 
            type="textarea"
            placeholder="e.g., Diabetes, Hypertension, Asthma..."
            isMobile={isMobile}
          />
          <Field 
            label="Current Medications" 
            value={formData.medications} 
            onChange={(v) => setFormData({...formData, medications: v})} 
            isEditing={isEditing} 
            type="textarea"
            placeholder="List all current medications..."
            isMobile={isMobile}
          />
          <Field 
            label="Injuries / Physical Limitations" 
            value={formData.injuries} 
            onChange={(v) => setFormData({...formData, injuries: v})} 
            isEditing={isEditing} 
            type="textarea"
            placeholder="e.g., Lower back pain, knee surgery..."
            isMobile={isMobile}
          />
          <Field 
            label="Supplements" 
            value={formData.supplements} 
            onChange={(v) => setFormData({...formData, supplements: v})} 
            isEditing={isEditing} 
            type="textarea"
            placeholder="e.g., Vitamin D, Protein powder, Creatine..."
            isMobile={isMobile}
          />
          
          {client.gender === 'female' && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                background: 'rgba(251, 191, 36, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(251, 191, 36, 0.1)'
              }}>
                <input
                  type="checkbox"
                  checked={formData.pregnant}
                  onChange={(e) => setFormData({...formData, pregnant: e.target.checked})}
                  disabled={!isEditing}
                  style={{ width: '20px', height: '20px' }}
                />
                <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Currently Pregnant</label>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.75rem',
                background: 'rgba(251, 191, 36, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(251, 191, 36, 0.1)'
              }}>
                <input
                  type="checkbox"
                  checked={formData.breastfeeding}
                  onChange={(e) => setFormData({...formData, breastfeeding: e.target.checked})}
                  disabled={!isEditing}
                  style={{ width: '20px', height: '20px' }}
                />
                <label style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Currently Breastfeeding</label>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
