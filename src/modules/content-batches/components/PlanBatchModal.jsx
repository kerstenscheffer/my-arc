// src/modules/content-batches/components/PlanBatchModal.jsx
// Plan de HELE batch als één opnamemoment in de agenda (dag + tijd).

import { useState } from 'react'
import { X, Clapperboard, Check } from 'lucide-react'

const GOLD = { primary: '#FFD700', border: 'rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.1)' }
const input = { width: '100%', boxSizing: 'border-box', padding: '0.75rem', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: '#fff', fontSize: '0.95rem', outline: 'none', cursor: 'pointer' }

export default function PlanBatchModal({ isOpen, onClose, onSave, batch, isMobile = false }) {
  const [date, setDate] = useState(batch?.shoot_date || '')
  const [time, setTime] = useState(batch?.shoot_time?.slice(0, 5) || '10:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !batch) return null

  const count = (batch.batch_items || []).length
  const accent = batch.format?.color || GOLD.primary

  const handleSave = async () => {
    if (!date) { setError('Kies een dag'); return }
    setSaving(true); setError(null)
    try {
      await onSave(batch.id, date, time)
      onClose()
    } catch (e) {
      setError('Opslaan mislukt: ' + (e.message || 'onbekende fout'))
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2200, padding: isMobile ? 0 : '2rem' }}>
      <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 460, background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: `1px solid ${GOLD.border}`, borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${GOLD.border}`, background: `linear-gradient(135deg, ${accent}18 0%, rgba(0,0,0,0.3) 100%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Clapperboard size={18} color={GOLD.primary} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{batch.batch_name || 'Batch'}</h3>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{count} items samen opnemen</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>Dag</label>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setError(null) }} style={input} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.4rem' }}>Tijd</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={input} />
          </div>
          {error && <div style={{ gridColumn: '1 / -1', padding: '0.7rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', fontSize: '0.8rem' }}>{error}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '1rem 1.25rem', borderTop: `1px solid ${GOLD.border}`, background: 'rgba(0,0,0,0.3)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Annuleren</button>
          <button onClick={handleSave} disabled={saving || !date} style={{ flex: 1.6, padding: '0.8rem', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: (!date || saving) ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${GOLD.primary} 0%, #FFA500 100%)`, color: (!date || saving) ? 'rgba(255,255,255,0.4)' : '#000', cursor: (!date || saving) ? 'not-allowed' : 'pointer' }}>
            <Check size={16} /> {saving ? 'Opslaan…' : 'In agenda zetten'}
          </button>
        </div>
      </div>
    </div>
  )
}
