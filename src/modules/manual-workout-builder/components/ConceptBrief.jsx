// src/modules/manual-workout-builder/components/ConceptBrief.jsx
//
// De brief bij een automatisch gebouwd conceptplan (edge function
// workout-bouwer): wat er gekozen is en waarom, en wat de coach zelf moet
// nakijken. Het concept heeft nog geen client_id; pas bij Goedkeuren krijgt
// het die en wordt het het actieve plan van de klant.
import { useState } from 'react'
import BriefZweef from '../../ai-meal-generator/tabs/plan-analyzer/BriefZweef'

export default function ConceptBrief({ db, plan, client, nietOpgeslagen, onKlaar, isMobile }) {
  const opties = plan?.generation_options || {}
  const brief = opties.brief
  const isConcept = opties.status === 'concept'
  const [bezig, setBezig] = useState(null)
  if (!brief) return null

  const keurGoed = async () => {
    if (bezig || !client?.id) return
    if (nietOpgeslagen) { alert('Sla eerst je wijzigingen op.'); return }
    const voornaam = client.first_name || 'de klant'
    if (!window.confirm(`Dit plan actief maken voor ${voornaam}? ${voornaam} ziet het dan direct in de app.`)) return
    setBezig('goed')
    try {
      const { data, error } = await db.supabase.from('workout_schemas').update({
        client_id: client.id,
        name: String(plan.name || '').replace(/^Concept\s*·\s*/i, '') || plan.name,
        generation_options: { ...opties, status: 'goedgekeurd', goedgekeurd_op: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      }).eq('id', plan.id).select('id')
      if (error) throw error
      if (!data?.length) throw new Error('niets bijgewerkt (geen rechten op dit plan?)')
      const r = await db.setActiveWorkoutPlan(client.id, plan.id)
      if (!r?.success) throw new Error(r?.error || 'Activeren mislukt')
      await onKlaar?.(plan.id)
    } catch (e) { alert('Goedkeuren mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  const opnieuw = async () => {
    if (bezig || !client?.id) return
    if (!window.confirm('Concept opnieuw laten maken uit de intake? Wat je in dit concept hebt aangepast gaat verloren.')) return
    setBezig('nieuw')
    try {
      const { data, error } = await db.supabase.functions.invoke('workout-bouwer', { body: { client_id: client.id } })
      if (error || data?.error) throw new Error(data?.error || error?.message || 'mislukt')
      await onKlaar?.(data?.schema_id || plan.id)
    } catch (e) { alert('Opnieuw maken mislukt: ' + (e?.message || e)) }
    finally { setBezig(null) }
  }

  // Zelfde zwevende vorm als de brief bij het voedingsconcept (18 nov 2026).
  return (
    <BriefZweef brief={brief} isConcept={isConcept} bezig={bezig} isMobile={isMobile} sleutel="mwb_briefvenster"
      onGoedkeuren={keurGoed} onOpnieuw={opnieuw} />
  )
}
