// src/modules/content-batches/components/BatchItemViewModal.jsx
// Lees-weergave van één batch-item: toont de ingevulde velden van het custom
// format (label: waarde), met genummerde opsommingen. Voor oude batches zonder
// format valt 'ie terug op de vaste velden (titel/hook/script/caption/notes).

import { X, CalendarPlus } from 'lucide-react'

const GOLD = { primary: '#FFD700', border: 'rgba(255,215,0,0.3)', background: 'rgba(255,215,0,0.1)' }

function renderValue(field, value) {
  if (value == null || value === '') return null
  if (field.type === 'list' && Array.isArray(value)) {
    const clean = value.filter(v => v && String(v).trim())
    return clean.length ? clean : null   // array → genummerd renderen
  }
  if (field.type === 'checklist' && Array.isArray(value)) return value.length ? value.join(', ') : null
  return String(value)
}

export default function BatchItemViewModal({ isOpen, onClose, item, format, onPlan, isMobile = false }) {
  if (!isOpen || !item) return null

  const fields = format?.fields || []
  const rows = fields.length
    ? fields.map(f => ({ label: f.label, type: f.type, val: renderValue(f, item.field_values?.[f.key]) })).filter(r => r.val)
    : [ // legacy fallback
        { label: 'Titel', val: item.title }, { label: 'Hook', val: item.hook },
        { label: 'Script', val: item.script }, { label: 'Caption', val: item.caption },
        { label: 'Notities', val: item.notes },
      ].filter(r => r.val)

  const accent = format?.color || GOLD.primary

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 2100, padding: isMobile ? 0 : '2rem' }}>
      <div style={{ width: isMobile ? '100%' : '90%', maxWidth: 560, maxHeight: isMobile ? '90vh' : '85vh', background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)', border: `1px solid ${GOLD.border}`, borderRadius: isMobile ? '16px 16px 0 0' : 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${GOLD.border}`, background: `linear-gradient(135deg, ${accent}18 0%, rgba(0,0,0,0.3) 100%)` }}>
          <div style={{ minWidth: 0 }}>
            {format?.name && <div style={{ fontSize: '0.62rem', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{format.name}</div>}
            <h3 style={{ margin: '2px 0 0', fontSize: '1.05rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || `Item ${item.item_number || ''}`}</h3>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {rows.length === 0 && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Nog geen velden ingevuld.</div>}
          {rows.map((r, i) => (
            <div key={i}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>{r.label}</div>
              {Array.isArray(r.val) ? (
                <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {r.val.map((v, idx) => <li key={idx} style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{v}</li>)}
                </ol>
              ) : (
                <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.val}</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '1rem 1.25rem', borderTop: `1px solid ${GOLD.border}`, background: 'rgba(0,0,0,0.3)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>Sluiten</button>
          {onPlan && (
            <button onClick={() => { onPlan(item); onClose() }} style={{ flex: 1.4, padding: '0.8rem', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem', background: `linear-gradient(135deg, ${GOLD.primary} 0%, #FFA500 100%)`, color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <CalendarPlus size={16} /> Inplannen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
