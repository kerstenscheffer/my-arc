// src/modules/content-batches/components/BatchShootViewModal.jsx
// Inzien van een heel opnamemoment: alle items van de batch met hun ingevulde
// format-velden onder elkaar. Handig om vlak vóór het opnemen alles te zien.

import { X, Clapperboard } from 'lucide-react'

const GOLD = { primary: '#FFD700', border: 'rgba(255,215,0,0.3)' }

function renderValue(field, value) {
  if (value == null || value === '') return null
  if (field.type === 'list' && Array.isArray(value)) {
    const c = value.filter(v => v && String(v).trim()); return c.length ? c : null
  }
  if (field.type === 'checklist' && Array.isArray(value)) return value.length ? value.join(', ') : null
  return String(value)
}

export default function BatchShootViewModal({ isOpen, onClose, batch, isMobile = false }) {
  if (!isOpen || !batch) return null
  const fields = batch.format?.fields || []
  const items = batch.batch_items || []
  const accent = batch.format?.color || GOLD.primary
  const time = (batch.shoot_time || '').slice(0, 5)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2200, padding: isMobile ? 0 : '2rem' }}>
      <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 620, maxHeight: isMobile ? '92vh' : '88vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: `1px solid ${GOLD.border}`, borderRadius: isMobile ? '16px 16px 0 0' : 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${GOLD.border}`, background: `linear-gradient(135deg, ${accent}18 0%, rgba(0,0,0,0.3) 100%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <Clapperboard size={18} color={GOLD.primary} />
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{batch.batch_name || 'Opname'}</h3>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>Opnamemoment{time ? ` · ${time}` : ''} · {items.length} items</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {items.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Geen items in deze batch.</div>}
          {items.map((item, idx) => {
            const rows = fields.length
              ? fields.map(f => ({ label: f.label, type: f.type, val: renderValue(f, item.field_values?.[f.key]) })).filter(r => r.val)
              : [{ label: 'Titel', val: item.title }].filter(r => r.val)
            return (
              <div key={item.id || idx} style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: rows.length ? 8 : 0 }}>
                  <span style={{ width: 22, height: 22, flexShrink: 0, borderRadius: 5, background: `${accent}25`, color: accent, fontWeight: 800, fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.item_number || idx + 1}</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || `Item ${idx + 1}`}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 30 }}>
                  {rows.map((r, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{r.label}</div>
                      {Array.isArray(r.val) ? (
                        <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {r.val.map((v, j) => <li key={j} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{v}</li>)}
                        </ol>
                      ) : (
                        <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{r.val}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${GOLD.border}`, background: 'rgba(0,0,0,0.3)' }}>
          <button onClick={onClose} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>Sluiten</button>
        </div>
      </div>
    </div>
  )
}
