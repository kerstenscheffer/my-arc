// src/modules/content-batches/components/BatchItemViewModal.jsx
// Lees-weergave van één batch-item: toont de ingevulde velden van het custom
// format (label: waarde), met genummerde opsommingen. Voor oude batches zonder
// format valt 'ie terug op de vaste velden (titel/hook/script/caption/notes).
//
// 11 nov 2026: schermvullend en strak (bold wit). Een opsomming waarvan de
// regels "DIK: … | FIT: …" zijn (de paren van een split screen) staat als
// genummerde rijen met de twee kanten naast elkaar, zodat je het script als
// dialoog leest in plaats van als één lap tekst.

import { useEffect } from 'react'
import { X, CalendarPlus } from 'lucide-react'

const LIJN = '1px solid rgba(255,255,255,0.1)'

function renderValue(field, value) {
  if (value == null || value === '') return null
  if (field.type === 'list' && Array.isArray(value)) {
    const clean = value.filter(v => v && String(v).trim())
    return clean.length ? clean : null   // array → genummerd renderen
  }
  if (field.type === 'checklist' && Array.isArray(value)) return value.length ? value.join(', ') : null
  return String(value)
}

// "1. DIK: Feestje… | FIT: Ik eet…" → [{ wie: 'DIK', tekst: 'Feestje…' }, { wie: 'FIT', tekst: 'Ik eet…' }]
// Geen " | " erin → null (gewone regel).
function splitsPaar(regel) {
  const s = String(regel).replace(/^\s*\d+[.)]\s*/, '')
  if (!s.includes('|')) return null
  return s.split('|').map(deel => {
    const m = /^\s*([A-Za-zÀ-ÿ0-9 ]{1,20}):\s*([\s\S]*)$/.exec(deel)
    return m ? { wie: m[1].trim(), tekst: m[2].trim() } : { wie: null, tekst: deel.trim() }
  }).filter(d => d.tekst)
}

export default function BatchItemViewModal({ isOpen, onClose, item, format, onPlan, isMobile = false }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const esc = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [isOpen, onClose])

  if (!isOpen || !item) return null
  const m = isMobile

  const fields = format?.fields || []
  const rows = fields.length
    ? fields.map(f => ({ label: f.label, type: f.type, val: renderValue(f, item.field_values?.[f.key]) })).filter(r => r.val)
    : [ // legacy fallback
        { label: 'Titel', val: item.title }, { label: 'Hook', val: item.hook },
        { label: 'Script', val: item.script }, { label: 'Caption', val: item.caption },
        { label: 'Notities', val: item.notes },
      ].filter(r => r.val)

  const kop = { fontSize: '0.68rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem' }
  const tekst = { fontSize: m ? '0.95rem' : '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.5 }

  const lijst = (waarden) => {
    const paren = waarden.map(splitsPaar)
    const alleParen = paren.every(p => p && p.length >= 2)
    if (alleParen) {
      return (
        <div style={{ border: LIJN, borderRadius: 12, overflow: 'hidden' }}>
          {paren.map((delen, idx) => (
            <div key={idx} style={{ display: 'flex', borderTop: idx ? LIJN : 'none' }}>
              <div style={{ width: m ? 34 : 48, flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: m ? '0.85rem' : '1.1rem', fontSize: m ? '0.9rem' : '1.05rem', fontWeight: 900, color: '#fff', borderRight: LIJN, fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</div>
              <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: m ? '1fr' : `repeat(${delen.length}, minmax(0, 1fr))` }}>
                {delen.map((d, j) => (
                  <div key={j} style={{ padding: m ? '0.75rem 0.85rem' : '1rem 1.25rem', borderLeft: !m && j ? LIJN : 'none', borderTop: m && j ? LIJN : 'none', background: j % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                    {d.wie && <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{d.wie}</div>}
                    <div style={tekst}>{d.tekst}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    return (
      <ol style={{ margin: 0, paddingLeft: '1.3rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {waarden.map((v, idx) => <li key={idx} style={tekst}>{String(v).replace(/^\s*\d+[.)]\s*/, '')}</li>)}
      </ol>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2100, background: '#000', display: 'flex', flexDirection: 'column' }}>
      {/* Kop */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: m ? '0.85rem 1rem' : '1rem 1.5rem', borderBottom: LIJN, paddingTop: m ? 'max(0.85rem, env(safe-area-inset-top))' : '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {format?.name && <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{format.name}</div>}
          <h3 style={{ margin: '2px 0 0', fontSize: m ? '1.1rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || `Item ${item.item_number || ''}`}</h3>
        </div>
        {onPlan && !m && (
          <button onClick={() => { onPlan(item); onClose() }} style={{ height: 38, padding: '0 1rem', border: 'none', borderRadius: 10, background: '#fff', color: '#0a0a0a', fontWeight: 900, fontSize: '0.88rem', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarPlus size={16} strokeWidth={2.6} /> Inplannen
          </button>
        )}
        <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, flexShrink: 0, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={22} strokeWidth={2.8} /></button>
      </div>

      {/* Inhoud */}
      <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: m ? '1rem 1rem 2rem' : '1.75rem 1.5rem 3rem', display: 'flex', flexDirection: 'column', gap: m ? '1.25rem' : '1.6rem' }}>
          {rows.length === 0 && <div style={{ ...tekst, color: 'rgba(255,255,255,0.45)' }}>Nog geen velden ingevuld.</div>}
          {rows.map((r, i) => (
            <div key={i}>
              <div style={kop}>{r.label}</div>
              {Array.isArray(r.val) ? lijst(r.val) : <div style={{ ...tekst, whiteSpace: 'pre-wrap' }}>{r.val}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Mobiel: inplannen onderin, binnen duimbereik. */}
      {onPlan && m && (
        <div style={{ flexShrink: 0, padding: '0.75rem 1rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', borderTop: LIJN }}>
          <button onClick={() => { onPlan(item); onClose() }} style={{ width: '100%', height: 48, border: 'none', borderRadius: 12, background: '#fff', color: '#0a0a0a', fontWeight: 900, fontSize: '0.95rem', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <CalendarPlus size={17} strokeWidth={2.6} /> Inplannen
          </button>
        </div>
      )}
    </div>
  )
}
