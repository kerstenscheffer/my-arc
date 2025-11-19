import { useState } from 'react'
import { X } from 'lucide-react'

export default function AddLeadModal({ isMobile, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    source: '',
    email: '',
    phone: '',
    notes: ''
  })

  const [errors, setErrors] = useState({})

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'Voornaam is verplicht'
    if (!formData.source.trim()) newErrors.source = 'Bron is verplicht'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit(formData)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '1rem' : '2rem' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>Nieuwe Lead</h3>
          <button onClick={onClose} style={{ padding: '0.5rem', background: 'transparent', border: 'none', borderRadius: '6px', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1rem' : '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>
              Voornaam <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => { setFormData({ ...formData, firstName: e.target.value }); setErrors({ ...errors, firstName: '' }) }}
              placeholder="John"
              style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: errors.firstName ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            />
            {errors.firstName && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.firstName}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>Achternaam</label>
            <input type="text" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Doe (optioneel)" style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>
              Bron/Plek <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => { setFormData({ ...formData, source: e.target.value }); setErrors({ ...errors, source: '' }) }}
              placeholder="Instagram Poll, Website, etc."
              style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: errors.source ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            />
            {errors.source && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.source}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com (optioneel)" style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>Telefoon</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+31 6 12345678 (optioneel)" style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>Notities</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Extra informatie..." rows={4} style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
              Annuleer
            </button>
            <button type="submit" style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
              Lead Toevoegen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
