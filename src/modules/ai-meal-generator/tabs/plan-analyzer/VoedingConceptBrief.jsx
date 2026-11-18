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
import BriefZweef from './BriefZweef'

export default function VoedingConceptBrief({ db, planMeta, client, onActiveer, onHerlaad, isMobile }) {
  const gs = planMeta?.generation || {}
  const brief = gs.brief
  const isConcept = gs.status === 'concept'
  const voorstel = gs.macro_voorstel || null
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
      // Het nieuwe concept weer langs de feedback van de coach.
      await db.supabase.functions.invoke('concept-nakijker', { body: { client_id: client.id, soort: 'voeding' } }).then(r => r, () => null)
      await onHerlaad?.(data?.plan_id || planMeta.id)
    } catch (e) { alert('Opnieuw maken mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const afwijkend = voorstel && isConcept && Number(client?.target_calories) > 0 && Number(client.target_calories) !== Number(voorstel.target_calories)
  return (
    <BriefZweef brief={brief} isConcept={isConcept} bezig={bezig} isMobile={isMobile} db={db} soort="voeding" clientId={client?.id} planId={planMeta?.id} sleutel="pa_briefvenster"
      onGoedkeuren={keurGoed} onOpnieuw={opnieuw}
      waarschuwing={afwijkend ? `De klant heeft nu ${client.target_calories} kcal als doel. Goedkeuren vervangt dat door ${voorstel.target_calories}.` : null} />
  )
}
