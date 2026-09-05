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
import { balkVak, balkVakActief } from './werkbalkStijl'

// Vuistregel: ongeveer 7700 kcal per kilo vetweefsel. Een model, geen wet —
// vandaar dat het scherm er "ongeveer" bij zet.
const KCAL_PER_KILO = 7700

const DAGEN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const PRE_WORKOUT_SLOT = 'pre_workout'

const DAG_KORT = {
  monday: 'Ma', tuesday: 'Di', wednesday: 'Wo', thursday: 'Do',
  friday: 'Vr', saturday: 'Za', sunday: 'Zo',
}

/**
 * Wat levert dit weekplan op, per dag en in totaal?
 *
 * De losse pre-workout maaltijd telt mee op trainingsdagen. Die staat in een
 * eigen kolom en zit dus niet in week_structure — zonder deze stap telt hij
 * nergens mee, ook niet in het dagcijfer.
 *
 * Niet geexporteerd: naast een component een functie exporteren breekt
 * hot-reload. Heeft een ander scherm dit nodig, dan hoort het in een eigen
 * util-bestand.
 */
function planPerDag(mealPlan) {
  const week = mealPlan?.week_structure
  if (!week) return null

  const preKcal = Number(mealPlan?.pre_workout_meal?.calories) || 0

  const dagen = DAGEN.map(dag => {
    const dagplan = week[dag]
    let kcal = Number(dagplan?.totals?.kcal) || 0
    const training = !!dagplan?.is_training_day
    // Alleen optellen als de dag geen eigen pre-workout slot heeft; anders
    // zit die maaltijd al in het dagtotaal en zou hij dubbel tellen.
    if (training && preKcal && !dagplan?.[PRE_WORKOUT_SLOT]) kcal += preKcal
    return { dag, label: DAG_KORT[dag], kcal: Math.round(kcal), training }
  })

  return { dagen, totaal: dagen.reduce((t, d) => t + d.kcal, 0) }
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

  const perDag = planPerDag(mealPlan)
  const planWeek = perDag ? perDag.totaal : null
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
    // Inline in de werkbalk, met de cijfers als uitklap eronder. Als blok
    // over de volle breedte kostte dit een hele regel; nu is het een knop
    // naast de rest en zweeft het paneel over het rooster heen.
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Weekbudget en tekort"
        style={(open ? balkVakActief : balkVak)(isMobile, {
          cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        })}>
        <Flame size={12} style={{ color: open ? '#b8860b' : '#FFD700' }} />
        {planWeek != null ? `${getal(planWeek)} kcal` : 'Weekbudget'}
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 60,
          width: isMobile ? 'min(92vw, 320px)' : 320,
          marginTop: 4, padding: '0.5rem 0.7rem 0.7rem',
          border: `1px solid ${rand}`,
          background: '#0f0f0f',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
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

                {/* Verdeling over de week. Het weektotaal zegt niets over
                    hoe scheef de dagen liggen: 2000-2000-2000 leest heel
                    anders dan 900-900-4200. Staafje op de hoogste dag
                    geschaald; trainingsdagen in goud, zodat een uitschieter
                    meteen te plaatsen is. */}
                <div style={{ marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
                    Per dag
                  </div>
                  {(() => {
                  // Staafjes en de TDEE-lijn delen dezelfde schaal, anders
                  // zegt "erboven of eronder" niets. De schaal loopt daarom
                  // tot de hoogste van beide.
                  const dagTdee = tdee?.tdee || null
                  const hoogste = Math.max(...perDag.dagen.map(x => x.kcal), dagTdee || 0, 1)
                  // Ruim hoog: het verschil tussen "vult het blok" en
                  // "blijft eronder" is de hele boodschap, en op 44px zag je
                  // dat nauwelijks.
                  const H = 78

                  return (
                    <>
                      {/* Per dag een grijs blok met stippelrand: dat is de
                          verbranding van die dag. De staaf ervoor is wat het
                          plan geeft. Loopt de staaf tot de bovenrand, dan eet
                          hij op onderhoud; blijft hij eronder, dan is dat het
                          tekort van die dag. */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: H }}>
                        {perDag.dagen.map(d => {
                          const hoogte = Math.max(3, Math.round((d.kcal / hoogste) * H))
                          const tdeeHoogte = dagTdee ? Math.round((dagTdee / hoogste) * H) : null
                          const boven = dagTdee != null && d.kcal > dagTdee
                          return (
                            <div key={d.dag}
                              title={`${d.label}: ${getal(d.kcal)} kcal${dagTdee ? ` van ${getal(dagTdee)}` : ''}${d.training ? ' · trainingsdag' : ''}`}
                              style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
                              {tdeeHoogte != null && (
                                <div style={{
                                  position: 'absolute', left: 0, right: 0, bottom: 0,
                                  height: tdeeHoogte,
                                  background: 'rgba(255,255,255,0.05)',
                                  borderTop: '1px dashed rgba(255,255,255,0.35)',
                                  borderBottom: '1px dashed rgba(255,255,255,0.12)',
                                  borderLeft: '1px dashed rgba(255,255,255,0.18)',
                                  borderRight: '1px dashed rgba(255,255,255,0.18)',
                                  boxSizing: 'border-box',
                                }} />
                              )}
                              {/* Even breed als het blok erachter: zo lees je
                                  het als een gevuld vak, niet als een doosje
                                  in een doosje. Wat er boven de vulling aan
                                  stippelrand overblijft, is het tekort. */}
                              <div style={{
                                position: 'absolute', left: 0, right: 0, bottom: 0,
                                height: hoogte,
                                background: d.training ? '#FFD700' : (boven ? '#f59e0b' : 'rgba(255,255,255,0.55)'),
                              }} />
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {perDag.dagen.map(d => {
                          const verschil = dagTdee != null ? d.kcal - dagTdee : null
                          return (
                            <div key={d.dag} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                              <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                                {d.label}
                              </div>
                              <div style={{ fontSize: '0.52rem', fontWeight: 700, color: 'rgba(255,255,255,0.32)' }}>
                                {d.kcal >= 1000 ? `${(d.kcal / 1000).toFixed(1)}k` : d.kcal}
                              </div>
                              {verschil != null && (
                                <div style={{
                                  fontSize: '0.52rem', fontWeight: 800,
                                  color: verschil <= 0 ? '#10b981' : '#f59e0b',
                                }}>
                                  {verschil <= 0 ? '−' : '+'}{Math.abs(verschil) >= 1000
                                    ? `${(Math.abs(verschil) / 1000).toFixed(1)}k`
                                    : Math.abs(verschil)}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {dagTdee != null && (
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 5, marginTop: 6,
                          fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                        }}>
                          <span style={{
                            width: 12, height: 9,
                            background: 'rgba(255,255,255,0.05)',
                            borderTop: '1px dashed rgba(255,255,255,0.35)',
                            borderBottom: '1px dashed rgba(255,255,255,0.12)',
                            borderLeft: '1px dashed rgba(255,255,255,0.18)',
                            borderRight: '1px dashed rgba(255,255,255,0.18)',
                            boxSizing: 'border-box', flexShrink: 0,
                          }} />
                          Verbranding {getal(dagTdee)} kcal per dag
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
