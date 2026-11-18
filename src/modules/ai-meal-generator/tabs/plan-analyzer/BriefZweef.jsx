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

// Feedback wordt een regel (tabel concept_feedback). De coach typt wat er mis
// was; de edge function feedback-regel herschrijft dat tot een algemene regel
// en de coach bevestigt die met "Klopt" (of past de zin aan). Pas dan wordt hij
// opgeslagen: tekst = de bevestigde regel, origineel = wat er getypt is. De
// concept-nakijker past alle open regels toe op elk nieuw concept. Uitzetten =
// verwerkt_at vullen met notitie 'uitgezet'; weer aanzetten maakt het leeg.
const UIT = 'uitgezet'

// Alle regels van beide soorten in één venster: aanpassen, uit- of aanzetten.
function RegelLijst({ db, onClose, onGewijzigd }) {
  const [rijen, setRijen] = useState(null)
  const [bewerk, setBewerk] = useState(null) // { id, tekst }
  const laad = () => db.supabase.from('concept_feedback').select('id, soort, tekst, origineel, verwerkt_at, verwerkt_notitie, created_at')
    .or(`verwerkt_at.is.null,verwerkt_notitie.eq.${UIT}`).order('created_at', { ascending: false }).limit(200)
    .then(r => setRijen(r?.data || []), () => setRijen([]))
  useEffect(() => { laad() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const zet = async (id, velden) => {
    setRijen(prev => (prev || []).map(r => (r.id === id ? { ...r, ...velden } : r)))
    await db.supabase.from('concept_feedback').update(velden).eq('id', id).then(r => r, () => null)
    onGewijzigd?.()
  }
  const tekstStijl = { fontSize: '0.82rem', fontWeight: 700, color: '#fff', lineHeight: 1.45 }
  const klein = { height: 26, padding: '0 0.55rem', borderRadius: 7, background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0 }
  return (
    <ZweefVenster sleutel="regel_venster" breed={460} maxHoog={560} startLinks titel="Regels voor concepten" onClose={onClose}>
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.6rem 0.95rem 0.9rem' }}>
        {rijen === null && <div style={{ ...tekstStijl, color: 'rgba(255,255,255,0.5)' }}>Laden…</div>}
        {rijen?.length === 0 && <div style={{ ...tekstStijl, color: 'rgba(255,255,255,0.5)' }}>Nog geen regels. Geef feedback in een brief, dan komt hij hier te staan.</div>}
        {[['workout', 'Training'], ['voeding', 'Voeding']].map(([srt, naam]) => {
          const lijst = (rijen || []).filter(r => r.soort === srt)
          if (!lijst.length) return null
          return (
            <div key={srt}>
              <div style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', margin: '0.8rem 0 0.4rem' }}>{naam} · {lijst.filter(r => !r.verwerkt_at).length} actief</div>
              {lijst.map(r => {
                const aan = !r.verwerkt_at
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0.45rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', opacity: aan ? 1 : 0.5 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {bewerk?.id === r.id ? (
                        <textarea autoFocus value={bewerk.tekst} onChange={e => setBewerk({ id: r.id, tekst: e.target.value })} rows={3}
                          style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '0.4rem 0.5rem', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none' }} />
                      ) : (
                        <div style={tekstStijl}>{r.tekst}</div>
                      )}
                      {r.origineel && r.origineel !== r.tekst && bewerk?.id !== r.id && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Jij schreef: {r.origineel}</div>
                      )}
                    </div>
                    {bewerk?.id === r.id ? (
                      <button onClick={() => { const t = bewerk.tekst.trim(); if (t) zet(r.id, { tekst: t }); setBewerk(null) }} style={{ ...klein, background: GROEN, border: `1px solid ${GROEN}` }}>Bewaar</button>
                    ) : (<>
                      <button onClick={() => setBewerk({ id: r.id, tekst: r.tekst })} style={klein}>Wijzig</button>
                      <button onClick={() => zet(r.id, aan ? { verwerkt_at: new Date().toISOString(), verwerkt_notitie: UIT } : { verwerkt_at: null, verwerkt_notitie: null })} style={klein}>{aan ? 'Zet uit' : 'Zet aan'}</button>
                    </>)}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </ZweefVenster>
  )
}

export default function BriefZweef({ brief, isConcept, bezig = null, onGoedkeuren, onOpnieuw, waarschuwing = null, sleutel = 'brief_venster', isMobile, db = null, soort = null, clientId = null, planId = null }) {
  // Bij een concept staat de brief meteen open: dat is het eerste wat je moet lezen.
  const [open, setOpen] = useState(!!isConcept)
  const [feedback, setFeedback] = useState([])
  const [tekst, setTekst] = useState('')
  const [fbBezig, setFbBezig] = useState(false)
  // Voorstel van de AI voor de regel, ter bevestiging: { origineel, regel, twijfel }.
  const [voorstel, setVoorstel] = useState(null)
  const [lijstOpen, setLijstOpen] = useState(false)
  const kanFeedback = !!db?.supabase && !!soort
  const laadFeedback = () => {
    if (!kanFeedback) return
    db.supabase.from('concept_feedback').select('id, tekst, created_at').eq('soort', soort).is('verwerkt_at', null)
      .order('created_at', { ascending: false }).limit(30)
      .then(r => setFeedback(r?.data || []), () => null)
  }
  useEffect(() => { laadFeedback() }, [soort]) // eslint-disable-line react-hooks/exhaustive-deps
  // Stap 1: van de getypte feedback een regel laten maken.
  const maakRegel = async () => {
    const t = tekst.trim()
    if (!t || fbBezig || !kanFeedback) return
    setFbBezig(true)
    const { data, error } = await db.supabase.functions.invoke('feedback-regel', { body: { soort, tekst: t } }).then(r => r, e => ({ data: null, error: e }))
    setFbBezig(false)
    // Lukt het herschrijven niet, dan kan de coach zijn eigen zin als regel bewaren.
    if (error || data?.error || !data?.regel) setVoorstel({ origineel: t, regel: t, twijfel: null, zonderAI: true })
    else setVoorstel({ origineel: t, regel: data.regel, twijfel: data.twijfel || null })
  }
  // Stap 2: de bevestigde regel opslaan.
  const bewaarRegel = async () => {
    const r = String(voorstel?.regel || '').trim()
    if (!r || fbBezig) return
    setFbBezig(true)
    const { error } = await db.supabase.from('concept_feedback').insert({ soort, tekst: r, origineel: voorstel.origineel, client_id: clientId, plan_id: planId }).then(x => x, e => ({ error: e }))
    setFbBezig(false)
    if (error) { alert('Regel opslaan mislukt: ' + (error.message || error)); return }
    setVoorstel(null); setTekst(''); laadFeedback()
  }
  const haalWeg = async (id) => {
    setFeedback(prev => prev.filter(f => f.id !== id))
    await db.supabase.from('concept_feedback').update({ verwerkt_at: new Date().toISOString(), verwerkt_notitie: UIT }).eq('id', id).then(r => r, () => null)
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
              <div style={{ ...kopje('rgba(255,255,255,0.55)'), display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1 }}>Regels voor elk concept · {feedback.length}</span>
                <button onClick={() => setLijstOpen(true)} style={{ padding: 0, border: 'none', background: 'transparent', color: '#fff', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>Alle regels</button>
              </div>
              {feedback.length > 0 && (
                <ul style={{ margin: '0 0 8px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {feedback.map(f => (
                    <li key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ ...regel, flex: 1, color: 'rgba(255,255,255,0.8)' }}>{f.tekst}</span>
                      <button onClick={() => haalWeg(f.id)} title="Uitzetten: geldt niet meer (terug aan via Alle regels)" aria-label="Uitzetten" style={{ flexShrink: 0, width: 22, height: 22, padding: 0, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} strokeWidth={2.8} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </>)}
          </div>
          {/* Feedback staat vast onderaan het venster, zodat je kunt typen terwijl je de brief leest. */}
          {kanFeedback && !voorstel && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0.55rem 0.95rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <textarea value={tekst} onChange={e => setTekst(e.target.value)} rows={1} placeholder="Feedback voor volgende keer…"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); maakRegel() } }}
                style={{ flex: 1, minWidth: 0, boxSizing: 'border-box', resize: 'none', minHeight: 34, maxHeight: 96, padding: '0.45rem 0.6rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', fieldSizing: 'content' }} />
              <button onClick={maakRegel} disabled={!tekst.trim() || fbBezig} title="Maak er een regel van (Cmd+Enter)" style={{ ...knop(false), height: 34, opacity: !tekst.trim() || fbBezig ? 0.4 : 1 }}>
                {fbBezig ? 'Bezig…' : 'Maak regel'}
              </button>
            </div>
          )}
          {/* De regel die ervan gemaakt is: bevestigen of aanpassen voordat hij geldt. */}
          {kanFeedback && voorstel && (
            <div style={{ flexShrink: 0, padding: '0.6rem 0.95rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: GROEN, marginBottom: 5 }}>
                {voorstel.zonderAI ? 'Herschrijven lukte niet: jouw zin als regel' : 'Zo wordt het een regel. Klopt dit?'}
              </div>
              <textarea value={voorstel.regel} onChange={e => setVoorstel(v => ({ ...v, regel: e.target.value }))} rows={3}
                style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '0.45rem 0.6rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: `1px solid ${GROEN}`, color: '#fff', fontSize: '0.84rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none', lineHeight: 1.4 }} />
              {voorstel.twijfel && (
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ORANJE, marginTop: 5 }}>Je kunt ook bedoelen: {voorstel.twijfel}</div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                <button onClick={bewaarRegel} disabled={!String(voorstel.regel || '').trim() || fbBezig} style={{ ...knop(true), opacity: fbBezig ? 0.6 : 1 }}>
                  <Check size={13} strokeWidth={3} /> {fbBezig ? 'Opslaan…' : 'Klopt, bewaar'}
                </button>
                <button onClick={() => setVoorstel(null)} disabled={fbBezig} style={knop(false)}>Terug</button>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', minWidth: 0 }}>Geldt daarna voor elk nieuw concept.</span>
              </div>
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
      {lijstOpen && kanFeedback && <RegelLijst db={db} onClose={() => setLijstOpen(false)} onGewijzigd={laadFeedback} />}
    </>
  )
}
