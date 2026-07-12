import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'

const PRESET_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16']

export default function SectionModal({ isMobile, section, onClose, onSubmit, onDelete }) {
  const [formData, setFormData] = useState({ title: '', color: '#10b981' })
  const [errors, setErrors] = useState({})
  // Guard tegen mobiele click-through die de modal meteen weer sluit.
  const [armed, setArmed] = useState(false)
  useEffect(() => { const t = setTimeout(() => setArmed(true), 300); return () => clearTimeout(t) }, [])

  useEffect(() => {
    if (section) {
      setFormData({ title: section.title || '', color: section.color || '#10b981' })
    }
  }, [section])

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Titel is verplicht'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit(formData)
  }

  const isEdit = !!section

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483550, padding: isMobile ? '1rem' : '2rem' }} onClick={(e) => { if (armed && e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#111', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '16px', width: '100%', maxWidth: '450px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ padding: isMobile ? '1rem' : '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
            {isEdit ? 'Sectie Bewerken' : 'Nieuwe Sectie'}
          </h3>
          <button onClick={onClose} style={{ padding: '0.5rem', background: 'transparent', border: 'none', borderRadius: '6px', color: 'rgba(255, 255, 255, 0.5)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '1rem' : '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>
              Sectie Titel <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
              placeholder="bijv. Instagram Poll, Gebeld, etc."
              style={{ width: '100%', padding: isMobile ? '0.75rem' : '0.875rem', background: 'rgba(255, 255, 255, 0.05)', border: errors.title ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
            />
            {errors.title && <p style={{ margin: '0.5rem 0 0 0', color: '#ef4444', fontSize: '0.8rem' }}>{errors.title}</p>}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.75rem', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', fontWeight: '500' }}>Sectie Kleur</label>
            
            <div style={{ marginBottom: '1rem', padding: '1rem', background: `${formData.color}15`, border: `2px solid ${formData.color}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: formData.color, boxShadow: `0 0 15px ${formData.color}80` }} />
              <span style={{ color: formData.color, fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>{formData.color}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  style={{ aspectRatio: '1', background: color, border: formData.color === color ? '3px solid #fff' : '2px solid rgba(255, 255, 255, 0.2)', borderRadius: '10px', cursor: 'pointer', boxShadow: formData.color === color ? `0 0 20px ${color}80` : 'none' }}
                />
              ))}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>Of kies eigen kleur</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                Annuleer
              </button>
              <button type="submit" style={{ flex: 1, padding: isMobile ? '0.875rem' : '1rem', background: `linear-gradient(135deg, ${formData.color} 0%, ${formData.color}dd 100%)`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
                {isEdit ? 'Opslaan' : 'Sectie Aanmaken'}
              </button>
            </div>

            {isEdit && onDelete && (
              <button type="button" onClick={onDelete} style={{ padding: isMobile ? '0.875rem' : '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Trash2 size={16} />
                Sectie Verwijderen
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
