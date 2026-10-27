// src/modules/meal-plan/components/ClientMealEditModal.jsx
// Client-kant maaltijd-editor. Hergebruikt de coach MealEditModal (embedded +
// clientMode) voor het bewerken van ingrediënten/porties, en vraagt daarna in
// dezelfde drie stappen als wisselen en verwijderen (WisselStappen) waar het
// geldt. Pre-workout volgt dezelfde regel als wisselen: "altijd" = de
// plan-pre-workout op al je trainingsdagen (27 okt 2026; de oude dagkiezer
// schreef hem in losse dag-slots).
import React, { useState, useEffect } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X } from 'lucide-react'
import MealEditModal from '../../ai-meal-generator/tabs/plan-analyzer/MealEditModal'
import { werkGelogdeMaaltijdBij, zetMaaltijdOpDagen, zetPreWorkoutOpTrainingsdagen } from '../dagAanpassingen'
import { lokaleDag } from '../utils/dagVenster'
import { PRE_WORKOUT_SLOT } from '../utils/preWorkoutMeal'
import { resolveFoodImage } from '../foodImageFallback'
import WisselStappen from './WisselStappen'

export default function ClientMealEditModal({
  db, service, meal, planId, dayName, datum, clientId, onClose, onSaved, isMobile,
  dagenMetMaaltijd = null, trainingsdagen = null,
}) {
  const slot = meal?.slot
  const [enriched, setEnriched] = useState(null)
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('edit')   // 'edit' | 'scope'
  const [pending, setPending] = useState(null)  // bewerkte snapshot
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // De snapshot uit het plan mist vaak ingredients_list (alleen macro's). De
  // editor heeft die nodig, dus haal 'm bij op uit ai_meals.
  useEffect(() => {
    let alive = true
    const enrich = async () => {
      const mid = meal?.meal_id || meal?.id
      if (meal?.ingredients_list?.length || !mid) {
        if (alive) { setEnriched(meal); setLoading(false) }
        return
      }
      try {
        const { data } = await db.supabase
          .from('ai_meals')
          .select('ingredients_list, preparation_steps, tips, image_url')
          .eq('id', mid)
          .single()
        if (alive) setEnriched({
          ...meal,
          ingredients_list: data?.ingredients_list || [],
          preparation_steps: meal.preparation_steps?.length ? meal.preparation_steps : (data?.preparation_steps || []),
          tips: meal.tips || data?.tips || null,
        })
      } catch {
        if (alive) setEnriched(meal)
      }
      if (alive) setLoading(false)
    }
    enrich()
    return () => { alive = false }
  }, [])

  // keuze uit WisselStappen: { modus: 'altijd', dagen } of { modus: 'week', datums }.
  const persist = async (keuze) => {
    setSaving(true); setError(null)
    try {
      const snap = pending
      const targetMealId = meal?.meal_id || meal?.id
      const vandaagKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
      // Op welke datums staat de maaltijd al gelogd die nu een andere versie
      // krijgt? Die logs tellen vanaf nu de aangepaste macro's.
      let bijTeWerken = []
      if (keuze.modus === 'altijd' && slot === PRE_WORKOUT_SLOT) {
        // Op elke trainingsdag, meeschuivend met de training.
        await zetPreWorkoutOpTrainingsdagen(db.supabase, planId, snap)
        if (keuze.dagen.includes(vandaagKey)) await service.wisDagAanpassing(clientId, slot, null)
        bijTeWerken = [datum || new Date()]
      } else if (keuze.modus === 'altijd') {
        await zetMaaltijdOpDagen(db.supabase, planId, keuze.dagen, slot, snap)
        // Een oudere eenmalige versie van vandaag zou de blijvende verbergen.
        if (keuze.dagen.includes(vandaagKey)) await service.wisDagAanpassing(clientId, slot, null)
        if (keuze.dagen.includes(dayName)) bijTeWerken = [datum || new Date()]
      } else {
        for (const d of keuze.datums) await service.overrideMealForDate(clientId, slot, snap, d)
        bijTeWerken = keuze.datums.map(lokaleDag)
      }
      for (const d of bijTeWerken) await werkGelogdeMaaltijdBij(db.supabase, clientId, targetMealId, d, snap)
      onSaved?.()
    } catch (e) {
      console.error('❌ Client meal save failed:', e)
      setError(e?.message || 'Opslaan mislukt')
      setSaving(false)
    }
  }

  const overlay = (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
      zIndex: 11000, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
    }}>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(255,215,0,0.2)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'cmeSpin 0.8s linear infinite' }} />
        </div>
      ) : phase === 'edit' ? (
        <MealEditModal
          db={db}
          meal={enriched}
          slot={slot}
          clientMode
          embedded
          isMobile={isMobile}
          onClose={onClose}
          onSave={(updated) => { setPending(updated); setPhase('scope') }}
        />
      ) : (
        // Zelfde blad als verwijderen: foto, naam, dan de drie stappen.
        <div style={{
          position: 'relative', width: '100%', maxWidth: 560, margin: '0 auto', maxHeight: '92vh', overflowY: 'auto',
          background: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: 22, borderTopRightRadius: 22,
          padding: isMobile ? '0 1rem calc(1rem + env(safe-area-inset-bottom, 0px))' : '0 1.4rem 1.4rem',
        }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)', margin: '8px auto 0' }} />
          <button onClick={() => !saving && onClose?.()} aria-label="Sluiten" style={{
            position: 'absolute', top: 12, right: 12, width: 36, height: 36, padding: 0, background: 'none', border: 'none',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={22} strokeWidth={2.4} /></button>
          <div style={{ textAlign: 'center', padding: '0.9rem 0 1rem' }}>
            <img src={resolveFoodImage(pending || enriched || meal, { size: 300 })} alt="" style={{
              width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)',
            }} />
            <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', marginTop: '0.55rem', padding: '0 2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {pending?.name || enriched?.name || enriched?.meal_name}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {Math.round(meal?.calories || 0) !== Math.round(pending?.calories || 0) && <>{Math.round(meal?.calories || 0)} → </>}{Math.round(pending?.calories || 0)} kcal · {Math.round(pending?.protein || 0)}g eiwit
            </div>
          </div>
          <WisselStappen
            knopTekst="Opslaan"
            terugTekst="← Terug naar bewerken"
            datum={datum}
            dagKey={dayName}
            slot={slot}
            dagenMetMaaltijd={dagenMetMaaltijd}
            trainingsdagen={trainingsdagen}
            vastAltijd={slot === PRE_WORKOUT_SLOT}
            bezig={saving}
            fout={error}
            isMobile={isMobile}
            onKies={persist}
            onTerug={() => { if (!saving) { setPhase('edit'); setError(null) } }}
          />
        </div>
      )}
      <style>{`@keyframes cmeSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return createPortal(overlay, document.body)
}
