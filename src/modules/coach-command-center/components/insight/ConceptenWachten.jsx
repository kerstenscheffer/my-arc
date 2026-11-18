// src/modules/coach-command-center/components/insight/ConceptenWachten.jsx
//
// Aanwijzing bovenaan het klantscherm van Coach Inzicht (18 nov 2026): staan
// er na de intake concepten klaar die de coach nog moet nakijken, dan zie je
// dat hier direct, met een knop per concept. Zonder concepten rendert dit niets.
//
//   - Trainingsplan: workout_schemas zonder client_id, generation_options
//     { concept_voor, status: 'concept', brief } (edge function workout-bouwer).
//   - Voedingsplan: client_meal_plans, created_via 'canoniek_concept',
//     generation_settings { status: 'concept', brief, macro_voorstel }
//     (database-functie maak_intake_voedingsconcept).

import { useEffect, useState } from 'react'
import { Dumbbell, UtensilsCrossed, ArrowRight, AlertTriangle, X } from 'lucide-react'

const GROEN = '#10b981'
const ORANJE = '#f59e0b'

export default function ConceptenWachten({ client, db, onNavigatePlan, onNavigateWorkout, onClose, isMobile }) {
  const [workout, setWorkout] = useState(null)
  const [voeding, setVoeding] = useState(null)
  const [weg, setWeg] = useState(false)

  useEffect(() => {
    setWorkout(null); setVoeding(null); setWeg(false)
    if (!client?.id || !db?.supabase) return undefined
    let leeft = true
    const veilig = (q) => q.then(r => r, () => ({ data: null }))
    veilig(db.supabase.from('workout_schemas').select('id, name, generation_options')
      .is('client_id', null).eq('generation_options->>concept_voor', client.id).eq('generation_options->>status', 'concept')
      .order('created_at', { ascending: false }).limit(1))
      .then(r => { if (leeft) setWorkout(r?.data?.[0] || null) })
    veilig(db.supabase.from('client_meal_plans').select('id, template_name, generation_settings')
      .eq('client_id', client.id).eq('is_active', false).eq('generation_settings->>status', 'concept')
      .order('created_at', { ascending: false }).limit(1))
      .then(r => { if (leeft) setVoeding(r?.data?.[0] || null) })
    return () => { leeft = false }
  }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if ((!workout && !voeding) || weg) return null

  const openWorkout = () => {
    try { sessionStorage.setItem('myarc_open_schema', JSON.stringify({ clientId: client.id, schemaId: workout.id })) } catch { /* de builder opent dan het actieve plan */ }
    onNavigateWorkout?.(client.id, workout.id)
    setTimeout(() => window.dispatchEvent(new CustomEvent('myarc:open-schema', { detail: { clientId: client.id, schemaId: workout.id } })), 300)
    onClose?.()
  }
  const openVoeding = () => { onNavigatePlan?.(client.id, voeding.id); onClose?.() }

  const aantal = (workout ? 1 : 0) + (voeding ? 1 : 0)
  const mv = voeding?.generation_settings?.macro_voorstel
  const n = (brief) => brief?.nakijken?.length || 0
  // Zweeft over de pagina, neemt geen ruimte in: alleen tekst en knoppen
  // (18 nov 2026). Het kruisje verbergt hem tot je de klant opnieuw opent.
  const knop = {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 30, padding: '0 0.7rem', borderRadius: 8, flexShrink: 0,
    background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
    fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
  }
  const teller = (k) => (k > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: ORANJE }}><AlertTriangle size={11} strokeWidth={2.8} />{k}</span> : null)
  const uitleg = `${client.first_name || 'De klant'} ziet nog niets tot jij goedkeurt.`
    + (mv ? ` Macro-voorstel: ${mv.target_calories} kcal, ${mv.target_protein} g eiwit, ${mv.target_carbs} g koolhydraten, ${mv.target_fat} g vet.` : '')
    + (mv && Number(client.target_calories) > 0 && Number(client.target_calories) !== Number(mv.target_calories) ? ` In de app staat nu ${client.target_calories} kcal uit de intake zelf.` : '')

  return (
    <div style={{
      position: 'fixed', top: isMobile ? 52 : 58, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 'calc(100vw - 24px)',
      padding: '0.35rem 0.5rem 0.35rem 0.8rem', borderRadius: 12, background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(6px)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
    }}>
      <span title={uitleg} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.82rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: GROEN, boxShadow: `0 0 10px 2px ${GROEN}` }} />
        {aantal === 1 ? '1 concept uit de intake' : `${aantal} concepten uit de intake`}
      </span>
      {workout && (
        <button onClick={openWorkout} title={`Trainingsplan openen: ${String(workout.name || '').replace(/^Concept\s*·\s*/i, '')}`} style={knop}>
          <Dumbbell size={13} strokeWidth={2.6} /> Trainingsplan {teller(n(workout.generation_options?.brief))} <ArrowRight size={13} strokeWidth={2.8} />
        </button>
      )}
      {voeding && (
        <button onClick={openVoeding} title={`Voedingsplan openen: ${String(voeding.template_name || '').replace(/^Concept\s*·\s*/i, '')}`} style={knop}>
          <UtensilsCrossed size={13} strokeWidth={2.6} /> Voedingsplan {teller(n(voeding.generation_settings?.brief))} <ArrowRight size={13} strokeWidth={2.8} />
        </button>
      )}
      <button onClick={() => setWeg(true)} aria-label="Verbergen" title="Verbergen tot je de klant opnieuw opent" style={{ ...knop, border: 'none', padding: '0 0.3rem' }}>
        <X size={15} strokeWidth={2.8} />
      </button>
    </div>
  )
}

// Dezelfde aanwijzing als losse regel in een kolom (training of voeding):
// alleen tekst en één knop, op de plek waar je anders "Rustdag" of "niets in
// je plan" leest. Laadt zelf; zonder concept rendert hij niets.
export function ConceptHint({ soort, client, db, onNavigatePlan, onNavigateWorkout, onClose }) {
  const [rij, setRij] = useState(null)
  useEffect(() => {
    setRij(null)
    if (!client?.id || !db?.supabase) return undefined
    let leeft = true
    const q = soort === 'workout'
      ? db.supabase.from('workout_schemas').select('id, name, generation_options')
          .is('client_id', null).eq('generation_options->>concept_voor', client.id).eq('generation_options->>status', 'concept')
      : db.supabase.from('client_meal_plans').select('id, template_name, generation_settings')
          .eq('client_id', client.id).eq('is_active', false).eq('generation_settings->>status', 'concept')
    q.order('created_at', { ascending: false }).limit(1).then(r => { if (leeft) setRij(r?.data?.[0] || null) }, () => null)
    return () => { leeft = false }
  }, [client?.id, soort]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!rij) return null

  const brief = soort === 'workout' ? rij.generation_options?.brief : rij.generation_settings?.brief
  const k = brief?.nakijken?.length || 0
  const naam = String((soort === 'workout' ? rij.name : rij.template_name) || '').replace(/^Concept\s*·\s*/i, '')
  const open = (e) => {
    e?.stopPropagation?.()
    if (soort === 'workout') {
      try { sessionStorage.setItem('myarc_open_schema', JSON.stringify({ clientId: client.id, schemaId: rij.id })) } catch { /* de builder opent dan het actieve plan */ }
      onNavigateWorkout?.(client.id, rij.id)
      setTimeout(() => window.dispatchEvent(new CustomEvent('myarc:open-schema', { detail: { clientId: client.id, schemaId: rij.id } })), 300)
    } else {
      onNavigatePlan?.(client.id, rij.id)
    }
    onClose?.()
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 900, color: '#fff', minWidth: 0 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, flexShrink: 0, background: GROEN, boxShadow: `0 0 8px 2px ${GROEN}` }} />
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Concept klaar: {naam}</span>
      </span>
      <button onClick={open} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, height: 26, padding: '0 0.6rem', borderRadius: 7, flexShrink: 0,
        background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: '#fff',
        fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap',
      }}>
        Nakijken {k > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: ORANJE }}><AlertTriangle size={10} strokeWidth={2.8} />{k}</span>} <ArrowRight size={12} strokeWidth={2.8} />
      </button>
    </span>
  )
}
