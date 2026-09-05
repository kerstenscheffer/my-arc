// src/modules/client-agenda/WeekBudgetPaneel.jsx
//
// Weekbudget en het tekort dat het plan oplevert, uitklapbaar in de agenda.
//
// De agenda is de plek waar de week van een klant bij elkaar komt, dus daar
// hoort ook de vraag thuis: wat geeft dit plan over zeven dagen, en hoeveel
// zit dat onder of boven zijn verbranding.
//
// Verbranding komt uit clients.tdee en niet uit de agendablokken. Dat is een
// bewuste keuze: er staan nauwelijks trainingsblokken in de agenda en geen
// enkel cardio- of wandelblok, dus optellen vanuit de agenda zou voor bijna
// iedereen een te lage verbranding geven. tdee heeft de activiteit al
// verwerkt via activity_level.

import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Flame } from 'lucide-react'

// Vuistregel: ongeveer 7700 kcal per kilo vetweefsel. Een model, geen wet —
// vandaar dat het scherm er "ongeveer" bij zet.
const KCAL_PER_KILO = 7700

const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const PRE_WORKOUT_SLOT = 'pre_workout'

/**
 * Wat levert dit weekplan op?
 * Telt de dagtotalen op, plus de losse pre-workout maaltijd op trainingsdagen.
 * Die staat in een eigen kolom en zit dus niet in week_structure — zonder deze
 * stap telt hij nergens mee.
 */
// Niet geexporteerd: naast een component een functie exporteren breekt
// hot-reload. Heeft een ander scherm dit nodig, dan hoort het in een eigen
// util-bestand.
function planWeekTotaal(mealPlan) {
  const week = mealPlan?.week_structure
  if (!week) return null

  let kcal = 0
  let trainingsdagenZonderEigenSlot = 0

  DAGEN.forEach(dag => {
    const dagplan = week[dag]
    if (!dagplan) return
    kcal += Number(dagplan?.totals?.kcal) || 0
    // Alleen meetellen als de dag geen eigen pre-workout slot heeft; anders
    // zit die maaltijd al in het dagtotaal en zou hij dubbel tellen.
    if (dagplan.is_training_day && !dagplan[PRE_WORKOUT_SLOT]) {
      trainingsdagenZonderEigenSlot += 1
    }
  })

  const pre = mealPlan?.pre_workout_meal
  if (pre?.calories) kcal += (Number(pre.calories) || 0) * trainingsdagenZonderEigenSlot

  return Math.round(kcal)
}

const getal = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n))

export default function WeekBudgetPaneel({ db, clientId, mealPlan, isMobile }) {
  const [open, setOpen] = useState(false)
  const [tdee, setTdee] = useState(undefined)   // undefined = nog laden

  // Pas ophalen als je het paneel opent. De agenda laadt al genoeg bij het
  // openen van de pagina; dit hoeft daar niet bij.
  useEffect(() => {
    if (!open || tdee !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    db.supabase
      .from('clients')
      .select('tdee, target_calories, first_name')
      .eq('id', clientId)
      .maybeSingle()
      .then(({ data }) => { if (leeft) setTdee(data || null) },
            (e) => { console.warn('tdee laden mislukt:', e); if (leeft) setTdee(null) })
    return () => { leeft = false }
  }, [open, tdee, db, clientId])

  const planWeek = planWeekTotaal(mealPlan)
  const verbranding = tdee?.tdee ? tdee.tdee * 7 : null
  const tekort = (planWeek != null && verbranding != null) ? verbranding - planWeek : null
  const kilos = tekort != null ? tekort / KCAL_PER_KILO : null

  const rand = 'rgba(255,255,255,0.1)'
  const regel = (label, waarde, toelichting, kleur = '#fff') => (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      gap: 10, padding: '0.5rem 0', borderBottom: `1px solid rgba(255,255,255,0.05)`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>{label}</div>
        {toelichting && (
          <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{toelichting}</div>
        )}
      </div>
      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: kleur, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {waarde}
      </div>
    </div>
  )

  return (
    <div style={{ flexShrink: 0, marginBottom: '0.4rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: 'flex', alignItems: 'center', gap: 7, width: '100%',
        padding: isMobile ? '0.5rem 0.6rem' : '0.55rem 0.75rem',
        background: 'rgba(255,255,255,0.03)',
        borderTop: `1px solid ${rand}`, borderBottom: `1px solid ${rand}`,
        borderLeft: `1px solid ${rand}`, borderRight: `1px solid ${rand}`,
        borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit',
        color: '#fff', fontSize: '0.78rem', fontWeight: 900,
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Flame size={13} style={{ color: '#FFD700' }} />
        Weekbudget
        {!open && planWeek != null && (
          <span style={{ marginLeft: 'auto', fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
            {getal(planWeek)} kcal
          </span>
        )}
      </button>

      {open && (
        <div style={{
          padding: isMobile ? '0.4rem 0.6rem 0.6rem' : '0.45rem 0.75rem 0.7rem',
          borderBottom: `1px solid ${rand}`,
          borderLeft: `1px solid ${rand}`, borderRight: `1px solid ${rand}`,
          background: 'rgba(255,255,255,0.015)',
        }}>
          {planWeek == null ? (
            <div style={{ padding: '0.6rem 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Geen actief weekplan voor deze klant.
            </div>
          ) : (
            <>
              {regel('Plan geeft', `${getal(planWeek)} kcal`, 'zeven dagen bij elkaar')}

              {tdee === undefined && regel('Verbranding', '…', 'laden')}

              {tdee !== undefined && verbranding == null && regel(
                'Verbranding', 'onbekend',
                'geen TDEE ingevuld bij deze klant', 'rgba(255,255,255,0.4)'
              )}

              {verbranding != null && (
                <>
                  {regel('Verbranding', `${getal(verbranding)} kcal`, 'TDEE maal zeven')}
                  {regel(
                    tekort >= 0 ? 'Tekort' : 'Overschot',
                    `${getal(Math.abs(tekort))} kcal`,
                    'over de hele week',
                    tekort >= 0 ? '#10b981' : '#f59e0b'
                  )}
                  <div style={{ paddingTop: '0.55rem' }}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>
                      Komt ongeveer neer op
                    </div>
                    <div style={{
                      fontSize: '1.25rem', fontWeight: 900, marginTop: 2,
                      color: tekort >= 0 ? '#10b981' : '#f59e0b',
                    }}>
                      {tekort >= 0 ? '−' : '+'}{Math.abs(kilos).toFixed(2)} kg
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}> per week</span>
                    </div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
                      Schatting op 7700 kcal per kilo. Wat de weegschaal doet blijft leidend.
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
