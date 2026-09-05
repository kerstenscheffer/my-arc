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

// Stappenband uit de intake naast het ingestelde activiteitsniveau.
//
// De TDEE wordt NIET opnieuw berekend uit de stappen. Dat getal hangt aan de
// macro-targets en aan alles wat daarop rekent; er stilletjes iets anders van
// maken is precies hoe je een fout krijgt die niemand meer kan plaatsen.
//
// Wat hier wél gebeurt: melden wanneer de twee elkaar tegenspreken. Iemand
// die 10.000+ stappen zet maar als "weinig beweging" staat ingesteld heeft
// vrijwel zeker een te lage verbranding staan — en dat verklaart waarom een
// plan niet doet wat het zou moeten doen.
const STAP_LABEL = {
  '4000_6000': '4.000 – 6.000',
  '6000_8000': '6.000 – 8.000',
  '8000_10000': '8.000 – 10.000',
  '10000_plus': '10.000+',
}

// Beide op dezelfde schaal van 0 (zit vooral) tot 3 (de hele dag in beweging),
// zodat "spreken ze elkaar tegen" een rekensom is en geen tabel vol
// uitzonderingen.
const STAP_NIVEAU  = { '4000_6000': 0, '6000_8000': 1, '8000_10000': 2, '10000_plus': 3 }
const ACTIE_NIVEAU = { sedentary: 0, lightly_active: 1, moderately_active: 2, very_active: 3 }
const ACTIE_LABEL  = {
  sedentary: 'weinig beweging', lightly_active: 'licht actief',
  moderately_active: 'matig actief', very_active: 'heel actief',
}

// ── Aannames voor de wat-als-knop ──────────────────────────────────────
//
// Deze getallen zijn schattingen, en het scherm zegt dat er ook bij. Ze zijn
// bedoeld om richting te geven ("wat gebeurt er ongeveer als hij meer gaat
// lopen"), niet om een plan op te bouwen.
//
// Lopen: ongeveer 1.300 stappen per kilometer, en wandelen kost ruwweg een
// halve kcal per kilo per kilometer. Per duizend stappen komt dat neer op
// 0,385 kcal per kilo lichaamsgewicht. Voor iemand van 90 kg is dat ~35 kcal
// per 1.000 stappen; van 6.000 naar 10.000 stappen is dus ~140 kcal per dag.
const KCAL_PER_1000_STAPPEN_PER_KG = 0.385

// Krachttraining: MET van 4 over een uur. kcal = MET x 3,5 x kg / 200 per
// minuut. Bewust aan de voorzichtige kant — krachttraining zit met rustpauzes
// meestal tussen 3,5 en 6 MET, en te hoog schatten laat het tekort groter
// lijken dan het is. Dat is de gevaarlijke kant om fout te zitten. Het scherm
// toont het getal per sessie, zodat je zelf kunt wegen of het klopt.
const MET_KRACHTTRAINING = 4
const TRAINING_MINUTEN = 60

// Middelpunt van elke stappenband, om het verschil tussen twee banden te
// kunnen uitrekenen. 10.000+ krijgt 11.000: de band is open, maar doen alsof
// iemand daar 15.000 loopt maakt de schatting alleen maar wilder.
const STAP_MIDDEN = { '4000_6000': 5000, '6000_8000': 7000, '8000_10000': 9000, '10000_plus': 11000 }

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

// Plus/min-knopje met de afwijking ertussen. Toont bewust "+150" en niet de
// nieuwe absolute waarde: je denkt in "wat als er honderdvijftig bij komt",
// en zo is teruggaan naar nul ook meteen duidelijk.
function Stapper({ label, waarde, eenheid, stap, onChange, toelichting }) {
  const knop = {
    width: 24, height: 24, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.06)',
    borderTop: '1px solid rgba(255,255,255,0.12)',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    borderLeft: '1px solid rgba(255,255,255,0.12)',
    borderRight: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900,
    cursor: 'pointer', lineHeight: 1,
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </span>
        <button onClick={() => onChange(waarde - stap)} style={knop}>−</button>
        <span style={{
          minWidth: 52, textAlign: 'center',
          fontSize: '0.72rem', fontWeight: 900,
          color: waarde === 0 ? 'rgba(255,255,255,0.35)' : '#FFD700',
        }}>
          {waarde > 0 ? `+${waarde}` : waarde}
        </span>
        <button onClick={() => onChange(waarde + stap)} style={knop}>+</button>
      </div>
      <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.28)', marginTop: 1 }}>
        {eenheid}{toelichting ? ` · ${toelichting}` : ''}
      </div>
    </div>
  )
}

const getal = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n))

export default function WeekBudgetPaneel({ db, clientId, mealPlan, isMobile }) {
  const [open, setOpen] = useState(false)
  const [tdee, setTdee] = useState(undefined)   // undefined = nog laden

  // Wat-als. Alle drie de knoppen zijn afwijkingen van de huidige situatie,
  // niet absolute waarden — zo blijft "terug naar nu" simpelweg alles op nul.
  const [simAan, setSimAan] = useState(false)
  const [simTdee, setSimTdee] = useState(0)          // kcal per dag erbij of eraf
  const [simTrainingen, setSimTrainingen] = useState(0) // sessies per week erbij
  const [simStappen, setSimStappen] = useState(null)    // andere band, of null

  // Pas ophalen als je het paneel opent. De agenda laadt al genoeg bij het
  // openen van de pagina; dit hoeft daar niet bij.
  useEffect(() => {
    if (!open || tdee !== undefined || !db?.supabase || !clientId) return
    let leeft = true
    db.supabase
      .from('clients')
      .select('tdee, target_calories, first_name, daily_steps, activity_level, current_weight')
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

  // ── Wat-als doorrekenen ──
  const gewicht = Number(tdee?.current_weight) || null
  const kcalPerTraining = gewicht
    ? Math.round(MET_KRACHTTRAINING * 3.5 * gewicht / 200 * TRAINING_MINUTEN)
    : null
  const kcalPer1000Stappen = gewicht ? Math.round(KCAL_PER_1000_STAPPEN_PER_KG * gewicht) : null

  const huidigeBand = tdee?.daily_steps || null
  const stapVerschilPerDag = (() => {
    if (!simStappen || !huidigeBand || !kcalPer1000Stappen) return 0
    const verschil = (STAP_MIDDEN[simStappen] ?? 0) - (STAP_MIDDEN[huidigeBand] ?? 0)
    return Math.round((verschil / 1000) * kcalPer1000Stappen)
  })()

  const simVerbranding = verbranding == null ? null : (
    verbranding
    + simTdee * 7
    + stapVerschilPerDag * 7
    + (kcalPerTraining || 0) * simTrainingen
  )
  const simTekort = (simVerbranding != null && planWeek != null) ? simVerbranding - planWeek : null
  const simKilos = simTekort != null ? simTekort / KCAL_PER_KILO : null
  const simActief = simAan && (simTdee !== 0 || simTrainingen !== 0 || !!simStappen)

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

                  {/* Stappen uit de intake. Alleen tonen als ze er zijn — een
                      regel "onbekend" helpt niemand. */}
                  {tdee?.daily_steps && (() => {
                    const stapN = STAP_NIVEAU[tdee.daily_steps]
                    const actieN = ACTIE_NIVEAU[tdee.activity_level]
                    // Pas melden bij een écht verschil. Eén stap ernaast is
                    // ruis; twee of meer betekent dat er iets niet klopt.
                    const botst = stapN != null && actieN != null && Math.abs(stapN - actieN) >= 2
                    const teLaag = botst && stapN > actieN
                    return (
                      <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
                            Stappen per dag
                          </div>
                          <div style={{ fontSize: '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', color: botst ? '#f59e0b' : '#fff' }}>
                            {STAP_LABEL[tdee.daily_steps] || tdee.daily_steps}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
                          {tdee.activity_level
                            ? `staat ingesteld als ${ACTIE_LABEL[tdee.activity_level] || tdee.activity_level}`
                            : 'geen activiteitsniveau ingesteld'}
                        </div>
                        {botst && (
                          <div style={{ marginTop: 3, fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1.35 }}>
                            Die twee spreken elkaar tegen. De verbranding hierboven is
                            {teLaag ? ' waarschijnlijk te laag' : ' waarschijnlijk te hoog'} — controleer
                            het activiteitsniveau voordat je op dit tekort stuurt.
                          </div>
                        )}
                      </div>
                    )
                  })()}
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

              {/* ── Wat als ──────────────────────────────────────────────
                  Aan de knoppen zitten zonder iets te wijzigen: wat gebeurt
                  er met het tekort als de TDEE anders is, als er een training
                  bij komt, of als hij meer gaat lopen. Verandert niets in de
                  database — het is een rekenmachine, geen instelling. */}
              {verbranding != null && (
                <div style={{ marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button onClick={() => setSimAan(o => !o)} style={{
                    display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit',
                    fontSize: '0.62rem', fontWeight: 800,
                  }}>
                    {simAan ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                    Wat als…
                  </button>

                  {simAan && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <Stapper
                        label="TDEE"
                        waarde={simTdee}
                        eenheid="kcal/dag"
                        stap={50}
                        onChange={setSimTdee}
                        toelichting={`nu ${getal(tdee.tdee)}`}
                      />
                      <Stapper
                        label="Trainingen"
                        waarde={simTrainingen}
                        eenheid="per week"
                        stap={1}
                        onChange={setSimTrainingen}
                        toelichting={kcalPerTraining ? `± ${kcalPerTraining} kcal per sessie` : 'gewicht onbekend'}
                      />

                      <div>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>
                          Stappen
                        </div>
                        <select
                          value={simStappen || ''}
                          onChange={e => setSimStappen(e.target.value || null)}
                          style={{
                            width: '100%', padding: '0.35rem 0.4rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 0,
                            color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                            fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
                          }}
                        >
                          <option value="" style={{ background: '#1a1a1a' }}>
                            {huidigeBand ? `nu: ${STAP_LABEL[huidigeBand]}` : 'niet ingevuld in de intake'}
                          </option>
                          {Object.keys(STAP_MIDDEN).map(b => (
                            <option key={b} value={b} style={{ background: '#1a1a1a' }}>{STAP_LABEL[b]}</option>
                          ))}
                        </select>
                        {stapVerschilPerDag !== 0 && (
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                            {stapVerschilPerDag > 0 ? '+' : '−'}{Math.abs(stapVerschilPerDag)} kcal per dag
                          </div>
                        )}
                        {!huidigeBand && (
                          <div style={{ fontSize: '0.55rem', fontWeight: 700, color: '#f59e0b', marginTop: 2 }}>
                            Zonder antwoord uit de intake valt er niets te vergelijken.
                          </div>
                        )}
                      </div>

                      {/* Uitkomst */}
                      <div style={{
                        marginTop: 2, padding: '0.5rem 0.6rem',
                        background: simActief ? 'rgba(255,215,0,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${simActief ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.08)'}`,
                      }}>
                        {!simActief ? (
                          <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                            Draai aan een knop om het effect te zien.
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                              <span>Verbranding</span>
                              <span>{getal(verbranding)} → <span style={{ color: '#fff' }}>{getal(simVerbranding)}</span></span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 3, fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>
                              <span>{simTekort >= 0 ? 'Tekort' : 'Overschot'}</span>
                              <span>{getal(Math.abs(tekort))} → <span style={{ color: '#fff' }}>{getal(Math.abs(simTekort))}</span></span>
                            </div>
                            <div style={{ marginTop: 5, fontSize: '1.05rem', fontWeight: 900, color: simTekort >= 0 ? '#10b981' : '#f59e0b' }}>
                              {simTekort >= 0 ? '−' : '+'}{Math.abs(simKilos).toFixed(2)} kg
                              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                                {' '}per week · was {kilos >= 0 ? '−' : '+'}{Math.abs(kilos).toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => { setSimTdee(0); setSimTrainingen(0); setSimStappen(null) }}
                              style={{
                                marginTop: 6, background: 'none', border: 'none', padding: 0,
                                color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit',
                                fontSize: '0.6rem', fontWeight: 800, cursor: 'pointer',
                              }}
                            >
                              Terug naar nu
                            </button>
                          </>
                        )}
                      </div>

                      <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.25)', lineHeight: 1.35 }}>
                        Schattingen, en ze wijzigen niets. Lopen gerekend op
                        {kcalPer1000Stappen ? ` ${kcalPer1000Stappen} kcal per 1.000 stappen` : ' gewicht onbekend'},
                        training op een uur krachttraining.
                      </div>
                    </div>
                  )}
                </div>
              )}

              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
