// src/modules/ai-meal-generator/tabs/plan-analyzer/PdfSettingsModal.jsx
// Instellingen vóór het genereren van de plan-PDF: wat exporteren (hele week /
// alleen weekschema / één dag), swaps meenemen en een eigen titel.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, FileDown, Calendar, LayoutGrid, CalendarDays } from 'lucide-react'
import { DAYS } from './DayNavigator'

const GOLD = '#FFD700'

export default function PdfSettingsModal({ onGenerate, onClose, hasSwaps = false, defaultTitle = '', isMobile = false }) {
  const modalHost = useModalHost()
  const [scope, setScope] = useState('week')        // 'week' | 'weekschema' | 'day'
  const [day, setDay] = useState('monday')
  const [includeSwaps, setIncludeSwaps] = useState(hasSwaps)
  const [title, setTitle] = useState('')

  const SCOPES = [
    { id: 'week',       label: 'Hele week',       sub: 'Cover + weekschema + alle dagen', Icon: CalendarDays },
    { id: 'weekschema', label: 'Alleen weekschema', sub: 'Cover + het weekoverzicht',       Icon: LayoutGrid },
    { id: 'day',        label: 'Eén dag',          sub: 'Alleen de gekozen dag',           Icon: Calendar },
  ]

  const submit = () => onGenerate({ scope, day, includeSwaps: hasSwaps && includeSwaps, title })

  return createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2147483600, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, background: '#0a0a0a', border: '1px solid rgba(255,215,0,0.22)', borderRadius: isMobile ? '18px 18px 0 0' : 18, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: isMobile ? '92vh' : '88vh' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1rem 1.15rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <FileDown size={17} color={GOLD} />
          <div style={{ flex: 1, color: '#fff', fontWeight: 800, fontSize: '1rem' }}>PDF-instellingen</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        <div style={{ padding: '1.1rem 1.15rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Wat exporteren */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '0.6rem' }}>Wat exporteren?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {SCOPES.map(s => {
                const active = scope === s.id
                return (
                  <button key={s.id} onClick={() => setScope(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', textAlign: 'left', padding: '0.7rem 0.85rem', borderRadius: 11, cursor: 'pointer',
                      background: active ? 'rgba(255,215,0,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${active ? GOLD + '88' : 'rgba(255,255,255,0.1)'}` }}>
                    <s.Icon size={18} color={active ? GOLD : 'rgba(255,255,255,0.5)'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: active ? GOLD : '#fff' }}>{s.label}</div>
                      <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{s.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Dag-keuze — alleen bij 'Eén dag' */}
            {scope === 'day' && (
              <div style={{ marginTop: '0.7rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {DAYS.map(d => {
                  const sel = day === d.id
                  return (
                    <button key={d.id} onClick={() => setDay(d.id)}
                      style={{ padding: '0.4rem 0.7rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.74rem', fontWeight: 800,
                        background: sel ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${sel ? GOLD + '77' : 'rgba(255,255,255,0.1)'}`,
                        color: sel ? GOLD : 'rgba(255,255,255,0.6)' }}>{d.full}</button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Swaps */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '0.6rem' }}>Extra</div>
            <button onClick={() => hasSwaps && setIncludeSwaps(v => !v)} disabled={!hasSwaps}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.7rem', textAlign: 'left', padding: '0.7rem 0.85rem', borderRadius: 11,
                cursor: hasSwaps ? 'pointer' : 'not-allowed', opacity: hasSwaps ? 1 : 0.5,
                background: (hasSwaps && includeSwaps) ? 'rgba(255,215,0,0.10)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${(hasSwaps && includeSwaps) ? GOLD + '88' : 'rgba(255,255,255,0.1)'}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: (hasSwaps && includeSwaps) ? GOLD : '#fff' }}>Voorgeschreven swaps toevoegen</div>
                <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
                  {hasSwaps ? 'Voegt een swap-pagina toe met jouw curatie per slot' : 'Geen swaps ingesteld voor deze client'}
                </div>
              </div>
              <div style={{ flexShrink: 0, width: 40, height: 22, borderRadius: 99, padding: 2, background: (hasSwaps && includeSwaps) ? GOLD : 'rgba(255,255,255,0.15)', transition: 'background .15s' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#000', transform: (hasSwaps && includeSwaps) ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .15s' }} />
              </div>
            </button>
          </div>

          {/* Titel */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '0.5rem' }}>Titel (optioneel)</div>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder={defaultTitle || 'Jouw persoonlijke voedingsplan op maat'}
              style={{ width: '100%', padding: '0.65rem 0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.6rem', padding: '0.9rem 1.15rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.8rem', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Annuleren</button>
          <button onClick={submit} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '0.8rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#FFD700,#D4AF37)', color: '#000', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            <FileDown size={15} /> Genereer PDF
          </button>
        </div>
      </div>
    </div>,
    modalHost
  )
}
