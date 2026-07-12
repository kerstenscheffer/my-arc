import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const SOURCE_OPTIONS = [
  { value: 'Instagram',    label: 'Instagram' },
  { value: 'WhatsApp',     label: 'WhatsApp' },
  { value: 'Mond-op-mond', label: 'Mond-op-mond' },
  { value: '__other__',    label: 'Anders…' },
]

export default function AddLeadModal({ isMobile, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    source: '',
    email: '',
    phone: '',
    notes: ''
  })
  // Tracks which dropdown option is selected. '__other__' triggers the
  // free-text fallback below the select.
  const [sourceChoice, setSourceChoice] = useState('')

  const [errors, setErrors] = useState({})

  // Op mobiel vuurt de tik die de "+"-knop indrukt daarna nog een synthetische
  // klik af op de nét-verschenen backdrop (click-through), die de modal meteen
  // weer zou sluiten. Pas na een korte guard mag de backdrop sluiten.
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

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

  // Render via portal so the modal escapes any transform/overflow parents
  // in the kanban tree and centers in the actual viewport.
  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }} onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}>
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
            <select
              value={sourceChoice}
              onChange={(e) => {
                const choice = e.target.value
                setSourceChoice(choice)
                // Standard options map directly to source. "Anders" clears source so
                // the user fills the text input below.
                const newSource = choice === '__other__' ? '' : choice
                setFormData({ ...formData, source: newSource })
                setErrors({ ...errors, source: '' })
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.75rem' : '0.875rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: errors.source ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23999\' stroke-width=\'3\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polyline points=\'6 9 12 15 18 9\'/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.875rem center',
                paddingRight: '2.25rem',
                cursor: 'pointer',
              }}
            >
              <option value="" style={{ background: '#111' }}>Selecteer bron…</option>
              {SOURCE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} style={{ background: '#111' }}>{opt.label}</option>
              ))}
            </select>
            {sourceChoice === '__other__' && (
              <input
                type="text"
                autoFocus
                value={formData.source}
                onChange={(e) => { setFormData({ ...formData, source: e.target.value }); setErrors({ ...errors, source: '' }) }}
                placeholder="Bv. Website, Podcast, Event..."
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  padding: isMobile ? '0.75rem' : '0.875rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: errors.source ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            )}
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
    </div>,
    document.body
  )
}
