// src/modules/ai-meal-generator/tabs/plan-analyzer/BriefZweef.jsx
//
// De brief bij een concept uit de intake, in de stijl van de rest (18 nov 2026):
// geen blok dat ruimte inneemt, maar een smalle zwevende regel met knoppen, en
// de brief zelf in een sleepbaar venster. Gebruikt door de Plan Analyzer
// (VoedingConceptBrief) en de Workout Builder (ConceptBrief).

import { useEffect, useState } from 'react'
import { Check, RefreshCw, AlertTriangle, FileText, X } from 'lucide-react'
import { ZweefVenster } from './ToevoegVenster'

const GROEN = '#10b981'
const ORANJE = '#f59e0b'

// Feedback (tabel concept_feedback): wat de coach hier opschrijft komt in elke
// volgende brief van dezelfde soort terug onder "Eerdere feedback", tot het in
// de regels van de bouwer is verwerkt. De bouwers werken met vaste regels en
// lezen geen vrije tekst; verwerken = de regels aanpassen en het punt afvinken.
export default function BriefZweef({ brief, isConcept, bezig = null, onGoedkeuren, onOpnieuw, waarschuwing = null, sleutel = 'brief_venster', isMobile, db = null, soort = null, clientId = null, planId = null }) {
  // Bij een concept staat de brief meteen open: dat is het eerste wat je moet lezen.
  const [open, setOpen] = useState(!!isConcept)
  const [feedback, setFeedback] = useState([])
  const [tekst, setTekst] = useState('')
  const [fbBezig, setFbBezig] = useState(false)
  const kanFeedback = !!db?.supabase && !!soort
  const laadFeedback = () => {
    if (!kanFeedback) return
    db.supabase.from('concept_feedback').select('id, tekst, created_at').eq('soort', soort).is('verwerkt_at', null)
      .order('created_at', { ascending: false }).limit(30)
      .then(r => setFeedback(r?.data || []), () => null)
  }
  useEffect(() => { laadFeedback() }, [soort]) // eslint-disable-line react-hooks/exhaustive-deps
  const bewaarFeedback = async () => {
    const t = tekst.trim()
    if (!t || fbBezig || !kanFeedback) return
    setFbBezig(true)
    const { error } = await db.supabase.from('concept_feedback').insert({ soort, tekst: t, client_id: clientId, plan_id: planId }).then(r => r, e => ({ error: e }))
    setFbBezig(false)
    if (error) { alert('Feedback opslaan mislukt: ' + (error.message || error)); return }
    setTekst(''); laadFeedback()
  }
  const haalWeg = async (id) => {
    setFeedback(prev => prev.filter(f => f.id !== id))
    await db.supabase.from('concept_feedback').update({ verwerkt_at: new Date().toISOString(), verwerkt_notitie: 'weggehaald door de coach' }).eq('id', id).then(r => r, () => null)
  }
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
            {kanFeedback && feedback.length > 0 && (<>
              <div style={kopje('rgba(255,255,255,0.55)')}>Feedback voor volgende keer</div>
              {feedback.length > 0 && (
                <ul style={{ margin: '0 0 8px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {feedback.map(f => (
                    <li key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ ...regel, flex: 1, color: 'rgba(255,255,255,0.8)' }}>{f.tekst}</span>
                      <button onClick={() => haalWeg(f.id)} title="Weghalen: geldt niet meer" aria-label="Weghalen" style={{ flexShrink: 0, width: 22, height: 22, padding: 0, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} strokeWidth={2.8} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </>)}
          </div>
          {/* Feedback staat vast onderaan het venster, zodat je kunt typen terwijl je de brief leest. */}
          {kanFeedback && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0.55rem 0.95rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={1} placeholder="Feedback voor volgende keer…"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); bewaarFeedback() } }}
                style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', resize: 'none', minHeight: 34, maxHeight: 96, padding: '0.45rem 0.6rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', fieldSizing: 'content' }} />
              <button onClick={bewaarFeedback} disabled={!tekst.trim() || fbBezig} title="Bewaar voor volgende keer (Cmd+Enter)" style={{ ...knop(false), height: 34, opacity: !tekst.trim() || fbBezig ? 0.4 : 1 }}>
                {fbBezig ? 'Opslaan…' : 'Bewaar'}
              </button>
            </div>
          )}
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
