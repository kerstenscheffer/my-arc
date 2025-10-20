import { useState } from 'react'
import { Mail, Phone, Calendar, MapPin, Save } from 'lucide-react'

export default function InfoTab({ lead, onUpdate, isMobile }) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    priority: lead.priority || 'medium',
    lead_source: lead.lead_source || 'website'
  })
  const [saving, setSaving] = useState(false)

  const statusOptions = [
    { value: 'new', label: 'Nieuw', color: '#3b82f6' },
    { value: 'contacted', label: 'Benaderd', color: '#f97316' },
    { value: 'scheduled', label: 'Gepland', color: '#8b5cf6' },
    { value: 'converted', label: 'Geconverteerd', color: '#10b981' },
    { value: 'closed', label: 'Gesloten', color: 'rgba(255, 255, 255, 0.5)' },
    { value: 'unqualified', label: 'Niet gekwalificeerd', color: '#ef4444' }
  ]

  const priorityOptions = [
    { value: 'high', label: 'Hoog', color: '#ef4444', icon: '🔴' },
    { value: 'medium', label: 'Gemiddeld', color: '#f97316', icon: '🟠' },
    { value: 'low', label: 'Laag', color: 'rgba(255, 255, 255, 0.4)', icon: '⚪' }
  ]

  const sourceOptions = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Verwijzing' },
    { value: 'social', label: 'Social Media' },
    { value: 'advertisement', label: 'Advertentie' },
    { value: 'other', label: 'Overig' }
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(formData)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      status: lead.status || 'new',
      priority: lead.priority || 'medium',
      lead_source: lead.lead_source || 'website'
    })
    setIsEditing(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Edit/Save Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem'
      }}>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              color: '#10b981',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            Bewerken
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '10px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
                background: saving
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '10px',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px',
                opacity: saving ? 0.7 : 1
              }}
            >
              <Save size={16} />
              {saving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </>
        )}
      </div>

      {/* Form Fields */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1rem'
      }}>
        {/* First Name */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            Voornaam
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          />
        </div>

        {/* Last Name */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            Achternaam
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          />
        </div>

        {/* Email */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Mail size={14} />
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          />
        </div>

        {/* Phone */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Phone size={14} />
            Telefoon
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease',
              minHeight: '44px'
            }}
          />
        </div>

        {/* Status */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              appearance: 'none',
              backgroundImage: isEditing
                ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")"
                : 'none',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
              minHeight: '44px'
            }}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500'
          }}>
            Prioriteit
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              appearance: 'none',
              backgroundImage: isEditing
                ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")"
                : 'none',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
              minHeight: '44px'
            }}
          >
            {priorityOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div style={{ gridColumn: isMobile ? '1' : 'span 2' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <MapPin size={14} />
            Bron
          </label>
          <select
            value={formData.lead_source}
            onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
            disabled={!isEditing}
            style={{
              width: '100%',
              padding: '0.875rem 1rem',
              background: isEditing ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              appearance: 'none',
              backgroundImage: isEditing
                ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='rgba(255,255,255,0.5)' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")"
                : 'none',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
              minHeight: '44px'
            }}
          >
            {sourceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metadata */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.8rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          <Calendar size={14} />
          Tijdlijn
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Aangemaakt:</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              {new Date(lead.created_at).toLocaleDateString('nl-NL', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          {lead.last_contacted_at && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Laatst contact:</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {new Date(lead.last_contacted_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
