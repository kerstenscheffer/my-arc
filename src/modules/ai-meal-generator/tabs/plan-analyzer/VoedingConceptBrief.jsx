// src/modules/ai-meal-generator/tabs/plan-analyzer/VoedingConceptBrief.jsx
//
// De brief bij een automatisch klaargezet conceptvoedingsplan (database-functie
// maak_intake_voedingsconcept, 18 nov 2026): het macro-voorstel, het gekozen
// basisplan, en wat de coach zelf moet nakijken. Zelfde vorm als de brief bij
// het concept-trainingsplan (ConceptBrief.jsx): samenvatting, keuzes, nakijken.
//
// De macro's staan tot goedkeuren alleen in het voorstel. "Goedkeuren" zet ze
// op de klant, haalt "Concept" van de naam en maakt het plan actief.

import { useState } from 'react'
import { ChevronDown, ChevronRight, Check, RefreshCw, AlertTriangle, FileText } from 'lucide-react'

const GROEN = '#10b981'
const ORANJE = '#f59e0b'

export default function VoedingConceptBrief({ db, planMeta, client, onActiveer, onHerlaad, isMobile }) {
  const gs = planMeta?.generation || {}
  const brief = gs.brief
  const isConcept = gs.status === 'concept'
  const voorstel = gs.macro_voorstel || null
  const [open, setOpen] = useState(isConcept)
  const [bezig, setBezig] = useState(null)
  if (!brief) return null

  const keurGoed = async () => {
    if (bezig || !client?.id || !planMeta?.id) return
    const voornaam = client.first_name || 'de klant'
    const heeftMacros = Number(client.target_calories) > 0
    const macroTekst = voorstel
      ? `\n\nMacro's: ${voorstel.target_calories} kcal, ${voorstel.target_protein} g eiwit, ${voorstel.target_carbs} g koolhydraten, ${voorstel.target_fat} g vet.${heeftMacros ? `\nLet op: dit vervangt de huidige ${client.target_calories} kcal.` : ''}`
      : ''
    if (!window.confirm(`Dit plan actief maken voor ${voornaam}? ${voornaam} ziet het plan en de macro's dan direct in de app.${macroTekst}`)) return
    setBezig('goed')
    try {
      if (voorstel) {
        const { error } = await db.supabase.from('clients').update({
          tdee: voorstel.tdee, surplus: voorstel.surplus,
          target_calories: voorstel.target_calories, target_protein: voorstel.target_protein,
          target_carbs: voorstel.target_carbs, target_fat: voorstel.target_fat,
        }).eq('id', client.id)
        if (error) throw error
        try { window.dispatchEvent(new CustomEvent('myarc:macros-gewijzigd', { detail: { clientId: client.id } })) } catch { /* geen venster */ }
      }
      const { data, error: pe } = await db.supabase.from('client_meal_plans').update({
        template_name: String(planMeta.name || '').replace(/^Concept\s*·\s*/i, '') || planMeta.name,
        generation_settings: { ...gs, status: 'goedgekeurd', goedgekeurd_op: new Date().toISOString() },
      }).eq('id', planMeta.id).select('id')
      if (pe) throw pe
      if (!data?.length) throw new Error('niets bijgewerkt (geen rechten op dit plan?)')
      await onActiveer?.()
      await onHerlaad?.(planMeta.id)
    } catch (e) { alert('Goedkeuren mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const opnieuw = async () => {
    if (bezig || !client?.id) return
    if (!window.confirm('Concept opnieuw laten maken uit de intake? Wat je in dit concept hebt aangepast gaat verloren.')) return
    setBezig('nieuw')
    try {
      const { data, error } = await db.supabase.rpc('maak_intake_voedingsconcept', { p_client: client.id, p_opnieuw: true })
      if (error || data?.fout) throw new Error(data?.fout || error?.message || 'mislukt')
      await onHerlaad?.(data?.plan_id || planMeta.id)
    } catch (e) { alert('Opnieuw maken mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const knop = (kleur, vol) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 0.8rem', borderRadius: 8, cursor: bezig ? 'wait' : 'pointer',
    fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900,
    background: vol ? kleur : 'transparent', color: '#fff', border: `1px solid ${vol ? kleur : 'rgba(255,255,255,0.18)'}`, opacity: bezig ? 0.6 : 1,
  })
  const regel = { fontSize: isMobile ? '0.8rem' : '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, margin: 0 }
  const kopje = (kleur) => ({ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: kleur, margin: '0.9rem 0 0.35rem' })
  const datum = brief.gemaakt ? new Date(brief.gemaakt).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) : ''

  return (
    <div style={{ flexShrink: 0, maxWidth: 1200, width: '100%', margin: '0.6rem auto 0', padding: isMobile ? '0 0.5rem' : '0 1rem', boxSizing: 'border-box' }}>
      <div style={{ background: '#0d0d0d', border: `1px solid ${isConcept ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, overflow: 'hidden' }}>
        <button onClick={() => setOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.9rem', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <FileText size={15} color={isConcept ? GROEN : 'rgba(255,255,255,0.6)'} strokeWidth={2.4} />
          <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 900, color: '#fff' }}>
            {isConcept ? 'Concept uit de intake' : 'Brief bij dit plan'}
            <span style={{ marginLeft: 8, fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{datum}</span>
          </span>
          {!!brief.nakijken?.length && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 900, color: ORANJE }}>
              <AlertTriangle size={12} strokeWidth={2.6} /> {brief.nakijken.length} nakijken
            </span>
          )}
          {open ? <ChevronDown size={16} color="rgba(255,255,255,0.6)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.6)" />}
        </button>
        {open && (
          <div style={{ padding: '0 0.9rem 0.9rem' }}>
            <p style={{ ...regel, color: '#fff', fontWeight: 900 }}>{brief.samenvatting}</p>
            {voorstel && Number(client?.target_calories) > 0 && Number(client.target_calories) !== Number(voorstel.target_calories) && isConcept && (
              <p style={{ ...regel, color: ORANJE, marginTop: 6 }}>De klant heeft nu {client.target_calories} kcal als doel. Goedkeuren vervangt dat door {voorstel.target_calories}.</p>
            )}
            {!!brief.keuzes?.length && (<>
              <div style={kopje('rgba(255,255,255,0.5)')}>Zo is het gekozen</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {brief.keuzes.map((k, i) => <li key={i} style={regel}>{k}</li>)}
              </ul>
            </>)}
            {!!brief.nakijken?.length && (<>
              <div style={kopje(ORANJE)}>Zelf nakijken</div>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {brief.nakijken.map((k, i) => <li key={i} style={regel}>{k}</li>)}
              </ul>
            </>)}
            {isConcept && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: '0.9rem' }}>
                <button onClick={keurGoed} disabled={!!bezig} style={knop(GROEN, true)}>
                  <Check size={14} strokeWidth={3} /> {bezig === 'goed' ? 'Bezig…' : 'Goedkeuren en actief maken'}
                </button>
                <button onClick={opnieuw} disabled={!!bezig} style={knop('#fff', false)}>
                  <RefreshCw size={13} strokeWidth={2.6} /> {bezig === 'nieuw' ? 'Bezig…' : 'Opnieuw maken'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
