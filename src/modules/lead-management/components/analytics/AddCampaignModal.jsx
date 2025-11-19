import { useState } from 'react'
import { X } from 'lucide-react'

const PLATFORMS = [
  'Instagram',
  'LinkedIn',
  'Facebook',
  'Twitter/X',
  'Email',
  'WhatsApp',
  'TikTok',
  'Anders'
]

export default function AddCampaignModal({ isMobile, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    platform: 'Instagram',
    messageText: '',
    purpose: '',
    totalSent: '',
    date: new Date().toISOString().split('T')[0]
  })

  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.platform) newErrors.platform = 'Platform is verplicht'
    if (!formData.messageText.trim()) newErrors.messageText = 'Bericht is verplicht'
    if (!formData.purpose.trim()) newErrors.purpose = 'Doel is verplicht'
    if (!formData.totalSent || formData.totalSent <= 0) newErrors.totalSent = 'Aantal verzonden moet > 0 zijn'
    if (!formData.date) newErrors.date = 'Datum is verplicht'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      ...formData,
      totalSent: parseInt(formData.totalSent)
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '1rem' : '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={{
        background: '#111',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1rem' : '1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '600',
            color: '#fff',
            margin: 0
          }}>
            Nieuwe Outreach Campagne
          </h3>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          padding: isMobile ? '1rem' : '1.5rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Platform */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Platform <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={formData.platform}
              onChange={(e) => {
                setFormData({ ...formData, platform: e.target.value })
                setErrors({ ...errors, platform: '' })
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.platform ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            >
              {PLATFORMS.map(platform => (
                <option key={platform} value={platform} style={{ background: '#111' }}>
                  {platform}
                </option>
              ))}
            </select>
            {errors.platform && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.platform}</p>}
          </div>

          {/* Message Text */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Bericht Tekst <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.messageText}
              onChange={(e) => {
                setFormData({ ...formData, messageText: e.target.value })
                setErrors({ ...errors, messageText: '' })
              }}
              placeholder="Typ hier het bericht dat je verstuurd hebt..."
              rows={4}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.messageText ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
            {errors.messageText && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.messageText}</p>}
          </div>

          {/* Purpose */}
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Doel <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => {
                setFormData({ ...formData, purpose: e.target.value })
                setErrors({ ...errors, purpose: '' })
              }}
              placeholder="bijv. Community invite, Sales call boeken..."
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.purpose ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'inherit'
              }}
            />
            {errors.purpose && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.purpose}</p>}
          </div>

          {/* Total Sent + Date (row) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '1rem'
          }}>
            {/* Total Sent */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Aantal Verzonden <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalSent}
                onChange={(e) => {
                  setFormData({ ...formData, totalSent: e.target.value })
                  setErrors({ ...errors, totalSent: '' })
                }}
                placeholder="100"
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: errors.totalSent ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              {errors.totalSent && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.totalSent}</p>}
            </div>

            {/* Date */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                Datum <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({ ...formData, date: e.target.value })
                  setErrors({ ...errors, date: '' })
                }}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: errors.date ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontFamily: 'inherit'
                }}
              />
              {errors.date && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.date}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '0.5rem'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Annuleer
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Campagne Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
