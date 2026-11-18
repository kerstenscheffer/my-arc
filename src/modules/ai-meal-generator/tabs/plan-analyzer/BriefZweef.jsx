// src/modules/ai-meal-generator/tabs/plan-analyzer/BriefZweef.jsx
//
// De brief bij een concept uit de intake, in de stijl van de rest (18 nov 2026):
// geen blok dat ruimte inneemt, maar een smalle zwevende regel met knoppen, en
// de brief zelf in een sleepbaar venster. Gebruikt door de Plan Analyzer
// (VoedingConceptBrief) en de Workout Builder (ConceptBrief).

import { useState } from 'react'
import { Check, RefreshCw, AlertTriangle, FileText } from 'lucide-react'
import { ZweefVenster } from './ToevoegVenster'

const GROEN = '#10b981'
const ORANJE = '#f59e0b'

export default function BriefZweef({ brief, isConcept, bezig = null, onGoedkeuren, onOpnieuw, waarschuwing = null, sleutel = 'brief_venster', isMobile }) {
  // Bij een concept staat de brief meteen open: dat is het eerste wat je moet lezen.
  const [open, setOpen] = useState(!!isConcept)
  if (!brief) return null
  const k = brief.nakijken?.length || 0
  const datum = brief.gemaakt ? new Date(brief.gemaakt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''

  const knop = (vol) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 0.7rem', borderRadius: 8, flexShrink: 0,
    background: vol ? GROEN : 'transparent', border: `1px solid ${vol ? GROEN : 'rgba(255,255,255,0.35)'}`, color: '#fff',
    fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer', whiteSpace: 'nowrap', opacity: bezig ? 0.6 : 1,
  })
  const kopje = (kleur) => ({ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: kleur, margin: '1rem 0 0.4rem' })
  const regel = { fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1.45, margin: 0 }

  return (
    <>
      <div style={{
        position: 'fixed', top: isMobile ? 54 : 60, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'calc(100vw - 24px)', flexWrap: 'wrap', justifyContent: 'center',
        padding: '0.35rem 0.5rem 0.35rem 0.8rem', borderRadius: 12, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(6px)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: isConcept ? GROEN : 'rgba(255,255,255,0.5)', boxShadow: isConcept ? `0 0 10px 2px ${GROEN}` : 'none' }} />
          {isConcept ? 'Concept uit de intake' : 'Plan uit de intake'}
        </span>
        <button onClick={() => setOpen(v => !v)} aria-expanded={open} style={knop(false)}>
          <FileText size={13} strokeWidth={2.6} /> Brief
          {k > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: ORANJE }}><AlertTriangle size={11} strokeWidth={2.8} />{k}</span>}
        </button>
        {isConcept && onGoedkeuren && (
          <button onClick={onGoedkeuren} disabled={!!bezig} style={knop(true)}>
            <Check size={13} strokeWidth={3} /> {bezig === 'goed' ? 'Bezig…' : 'Goedkeuren'}
          </button>
        )}
      </div>

      {open && (
        <ZweefVenster sleutel={sleutel} breed={440} maxHoog={560} titel={`Brief${datum ? ` · ${datum}` : ''}`} onClose={() => setOpen(false)}>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.8rem 0.95rem 0.4rem' }}>
            <p style={{ ...regel, fontSize: '0.9rem', fontWeight: 900 }}>{brief.samenvatting}</p>
            {waarschuwing && <p style={{ ...regel, color: ORANJE, marginTop: 8 }}>{waarschuwing}</p>}
            {k > 0 && (<>
              <div style={kopje(ORANJE)}>Zelf nakijken</div>
              <ul style={{ margin: 0, paddingLeft: '1.05rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {brief.nakijken.map((t, i) => <li key={i} style={regel}>{t}</li>)}
              </ul>
            </>)}
            {!!brief.keuzes?.length && (<>
              <div style={kopje('rgba(255,255,255,0.55)')}>Gekozen en waarom</div>
              <ul style={{ margin: 0, paddingLeft: '1.05rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {brief.keuzes.map((t, i) => <li key={i} style={{ ...regel, color: 'rgba(255,255,255,0.8)' }}>{t}</li>)}
              </ul>
            </>)}
          </div>
          {isConcept && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '0.6rem 0.95rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {onGoedkeuren && (
                <button onClick={onGoedkeuren} disabled={!!bezig} style={knop(true)}>
                  <Check size={13} strokeWidth={3} /> {bezig === 'goed' ? 'Bezig…' : 'Goedkeuren en actief maken'}
                </button>
              )}
              {onOpnieuw && (
                <button onClick={onOpnieuw} disabled={!!bezig} style={knop(false)}>
                  <RefreshCw size={12} strokeWidth={2.6} /> {bezig === 'nieuw' ? 'Bezig…' : 'Opnieuw maken'}
                </button>
              )}
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>De klant ziet dit pas na goedkeuren.</span>
            </div>
          )}
        </ZweefVenster>
      )}
    </>
  )
}
