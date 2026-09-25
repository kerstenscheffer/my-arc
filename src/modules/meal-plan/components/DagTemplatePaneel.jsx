// src/modules/meal-plan/components/DagTemplatePaneel.jsx
//
// De dagen die je coach voor je klaarzette, en hoe je er een op je eigen week
// zet. Zit achter een tab tegen de linkerrand van het maaltijdscherm.
//
// Wat het doet, in die volgorde:
//   1. lijst met dagen — tik er een aan en je ziet de maaltijden in dezelfde
//      kaart als in je plan, zodat je kiest op wat je ziet en niet op een naam
//   2. dagen aanklikken (ma t/m zo, standaard de dag die je open had)
//   3. "alleen deze week" of "altijd"
//
// Alleen deze week schrijft een losse dag per datum (client_day_overrides);
// altijd schrijft in het weekplan zelf. Het verschil is zichtbaar: de eerste
// verdwijnt vanzelf, de tweede blijft staan.

import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, X, ChevronRight, Check, Loader } from 'lucide-react'
import MealCard from './day-schedule/MealCard'
import { foodImageFallback } from '../foodImageFallback'
import {
  getKlantDagTemplates, slotsVanTemplate, zetDagAltijd, zetDagDezeWeek,
  lokaleDatum, DAG_LABELS,
} from '../DayTemplateService'

const DAGEN_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const LIJN = 'rgba(255,255,255,0.1)'

const SLOT_VOLGORDE = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner', 'snack3', 'snack4']
const slotRang = (slot) => {
  const i = SLOT_VOLGORDE.indexOf(slot)
  return i === -1 ? 99 : i
}

// "Dagmenu 2000 · Dag 3" uit elkaar halen: het niveau kopt de groep, de dag
// is de titel van de kaart. Past een naam niet in dat patroon, dan blijft hij
// gewoon in z'n geheel staan.
const ontleed = (t) => {
  const naam = t.name || t.template_name || 'Dag'
  const m = /^Dagmenu\s+(\d+)\s*·\s*(.+)$/i.exec(naam)
  return m ? { niveau: Number(m[1]), titel: m[2].trim(), naam } : { niveau: null, titel: naam, naam }
}

// De foto van het diner draagt de kaart: dat is de maaltijd waar je je iets
// bij voorstelt. Geen eigen foto? Dan pakt het fallback-systeem er een op de
// titel (kwark → zuivel, kip → kip).
const dagFoto = (t) => {
  const slots = slotsVanTemplate(t)
  const maaltijd = slots.dinner || slots.lunch || slots.breakfast || Object.values(slots)[0]
  if (!maaltijd) return null
  return maaltijd.image_url || foodImageFallback(maaltijd.name || maaltijd.title, 'dinner', 200)
}

// De namen van de maaltijden, in de volgorde van de dag.
const maaltijdNamen = (t) => Object.entries(slotsVanTemplate(t))
  .sort((a, b) => slotRang(a[0]) - slotRang(b[0]))
  .map(([, m]) => m?.name)
  .filter(Boolean)

export default function DagTemplatePaneel({
  db, client, activePlan, isMobile, dagIndex = 0, weekOffset = 0, onToegepast,
}) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState([])
  const [laden, setLaden] = useState(true)
  const [gekozen, setGekozen] = useState(null)
  const [doelDagen, setDoelDagen] = useState([dagIndex])
  const [bezig, setBezig] = useState(false)
  const [klaar, setKlaar] = useState('')

  const laad = useCallback(async () => {
    if (!db?.supabase || !client?.id) return
    setLaden(true)
    setTemplates(await getKlantDagTemplates(db.supabase, client.id))
    setLaden(false)
  }, [db, client?.id])

  useEffect(() => { if (open) laad() }, [open, laad])
  useEffect(() => { if (open) setDoelDagen([dagIndex]) }, [open, dagIndex])

  // De datums van de dagen die je aanklikt, in de week die je open hebt.
  const datumsVanDoelen = () => doelDagen.map(i => {
    const d = new Date()
    const vandaagIndex = (d.getDay() + 6) % 7
    d.setDate(d.getDate() + (i - vandaagIndex) + weekOffset * 7)
    return lokaleDatum(d)
  })

  const pasToe = async (altijd) => {
    if (!gekozen || !doelDagen.length || bezig) return
    setBezig(true)
    let fout = null
    if (altijd) {
      // Per dag, want het weekplan bewaart per weekdag.
      for (const i of doelDagen) {
        const res = await zetDagAltijd(db.supabase, {
          clientId: client.id, planId: activePlan?.id, dagIndex: i, template: gekozen,
        })
        if (res?.error) { fout = res.error; break }
      }
    } else {
      const res = await zetDagDezeWeek(db.supabase, {
        clientId: client.id, planId: activePlan?.id, datums: datumsVanDoelen(), template: gekozen,
      })
      if (res?.error) fout = res.error
    }
    setBezig(false)
    if (fout) { alert(fout); return }
    setKlaar(altijd ? 'Staat voortaan in je plan' : 'Staat klaar voor deze week')
    onToegepast?.()
    setTimeout(() => { setKlaar(''); setGekozen(null); setOpen(false) }, 1400)
  }

  const maaltijden = gekozen
    ? Object.entries(slotsVanTemplate(gekozen))
      .map(([slot, meal]) => ({ slot, meal: { ...meal, slot } }))
      .sort((a, b) => slotRang(a.slot) - slotRang(b.slot))
    : []

  // ── De tab tegen de linkerrand ────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Dagen van je coach"
        style={{
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          padding: isMobile ? '0.9rem 0.45rem' : '1.1rem 0.55rem',
          background: 'rgba(10,10,10,0.94)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${LIJN}`, borderLeft: 'none',
          borderRadius: '0 14px 14px 0',
          color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <CalendarDays size={18} strokeWidth={2.6} />
        <span style={{
          fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
        }}>
          DAGEN
        </span>
      </button>
    )
  }

  // ── Het paneel ────────────────────────────────────────────────────────
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', justifyContent: 'flex-start',
      }}
    >
      <div style={{
        width: isMobile ? '100%' : 460, maxWidth: '100%', height: '100%',
        background: '#0a0a0a', borderRight: `1px solid ${LIJN}`,
        display: 'flex', flexDirection: 'column',
        animation: 'dagPaneelIn 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <style>{'@keyframes dagPaneelIn { from { transform: translateX(-100%) } to { transform: none } }'}</style>

        <div style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? 'calc(0.9rem + env(safe-area-inset-top, 0px)) 1rem 0.8rem' : '1.1rem 1.25rem 0.9rem',
          borderBottom: `1px solid ${LIJN}`,
        }}>
          <CalendarDays size={19} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {gekozen ? (gekozen.name || gekozen.template_name || 'Dag') : 'Dagen van je coach'}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>
              {gekozen ? `${maaltijden.length} maaltijden · ${Math.round(gekozen.daily_calories || 0)} kcal` : 'Kies een dag en zet hem op je week'}
            </div>
          </div>
          <button
            onClick={() => (gekozen ? setGekozen(null) : setOpen(false))}
            aria-label={gekozen ? 'Terug' : 'Sluiten'}
            style={{
              width: 38, height: 38, flexShrink: 0, borderRadius: 11,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${LIJN}`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem' }}>
          {laden && (
            <div style={{ padding: '2.5rem 0', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              Laden…
            </div>
          )}

          {!laden && !gekozen && templates.length === 0 && (
            <div style={{ padding: '2.5rem 0.5rem', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Je coach heeft nog geen dagen voor je klaargezet.
            </div>
          )}

          {/* Lijst */}
          {!laden && !gekozen && (() => {
            // Per niveau een kopje, en de dagen op volgorde. Vijftien regels op
            // een hoop leest als een dump; drie groepjes van vijf niet.
            const groepen = new Map()
            templates.forEach(t => {
              const { niveau } = ontleed(t)
              const sleutel = niveau ?? 'overig'
              if (!groepen.has(sleutel)) groepen.set(sleutel, [])
              groepen.get(sleutel).push(t)
            })
            const volgorde = [...groepen.keys()].sort((a, b) => {
              if (a === 'overig') return 1
              if (b === 'overig') return -1
              return a - b
            })

            return volgorde.map(sleutel => (
              <div key={sleutel} style={{ marginBottom: '1.5rem' }}>
                <div style={{
                  fontSize: '0.74rem', fontWeight: 900, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
                  padding: '0.25rem 0 0.75rem',
                }}>
                  {sleutel === 'overig' ? 'Overige dagen' : `Dagmenu ${sleutel} kcal`}
                </div>

                {groepen.get(sleutel)
                  .slice()
                  .sort((a, b) => ontleed(a).titel.localeCompare(ontleed(b).titel, 'nl', { numeric: true }))
                  .map(t => {
                    const { niveau, titel } = ontleed(t)
                    const foto = dagFoto(t)
                    const namen = maaltijdNamen(t)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setGekozen(t)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'stretch', gap: 0,
                          marginBottom: 10, padding: 0, overflow: 'hidden',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${LIJN}`, borderRadius: 14,
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <span style={{
                          width: isMobile ? 92 : 104, flexShrink: 0, alignSelf: 'stretch',
                          backgroundImage: foto ? `url(${foto})` : 'none',
                          backgroundColor: 'rgba(255,255,255,0.05)',
                          backgroundSize: 'cover', backgroundPosition: 'center',
                        }} />
                        <span style={{ flex: 1, minWidth: 0, padding: '0.8rem 0.9rem' }}>
                          {niveau && (
                            <span style={{
                              display: 'inline-block', marginBottom: 5,
                              fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.08em',
                              textTransform: 'uppercase', color: '#0a0a0a',
                              background: '#fff', borderRadius: 5, padding: '2px 6px',
                            }}>
                              {niveau} kcal
                            </span>
                          )}
                          <span style={{
                            display: 'block', fontSize: '1rem', fontWeight: 900, color: '#fff',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {titel}
                          </span>
                          <span style={{
                            display: 'block', fontSize: '0.8rem', fontWeight: 700,
                            color: 'rgba(255,255,255,0.45)', marginTop: 2,
                          }}>
                            {Math.round(t.daily_calories || 0)} kcal · {t.daily_protein ? `${Math.round(t.daily_protein)}g eiwit` : `${namen.length} maaltijden`}
                          </span>
                          {namen.length > 0 && (
                            <span style={{
                              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              overflow: 'hidden', marginTop: 6,
                              fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.4,
                              color: 'rgba(255,255,255,0.55)',
                            }}>
                              {namen.join(' · ')}
                            </span>
                          )}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', paddingRight: 8, flexShrink: 0 }}>
                          <ChevronRight size={20} strokeWidth={3} color="rgba(255,255,255,0.3)" />
                        </span>
                      </button>
                    )
                  })}
              </div>
            ))
          })()}

          {/* Eén dag: de maaltijden zoals ze in je plan zouden staan. */}
          {gekozen && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
                {maaltijden.map(({ slot, meal }) => (
                  <MealCard key={slot} meal={meal} isMobile={isMobile} acties={[]} />
                ))}
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', marginBottom: 10 }}>
                Op welke dagen?
              </div>
              <div style={{ display: 'flex', gap: 5, marginBottom: '1.25rem' }}>
                {DAGEN_KORT.map((label, i) => {
                  const aan = doelDagen.includes(i)
                  return (
                    <button
                      key={label}
                      onClick={() => setDoelDagen(prev => (prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i]))}
                      title={DAG_LABELS[i]}
                      style={{
                        flex: 1, minHeight: 46, borderRadius: 11,
                        background: aan ? '#fff' : 'transparent',
                        border: `1px solid ${aan ? '#fff' : LIJN}`,
                        color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.6)',
                        fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
                        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {klaar ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  minHeight: 54, borderRadius: 12, background: 'rgba(16,185,129,0.14)',
                  border: '1px solid rgba(16,185,129,0.5)', color: '#10b981',
                  fontSize: '0.95rem', fontWeight: 900,
                }}>
                  <Check size={18} strokeWidth={3} /> {klaar}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => pasToe(false)}
                    disabled={bezig || !doelDagen.length}
                    style={{
                      minHeight: 54, borderRadius: 12, border: 'none', background: '#fff', color: '#0a0a0a',
                      fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: bezig ? 'wait' : 'pointer', opacity: doelDagen.length ? 1 : 0.5,
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {bezig && <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    Alleen deze week
                  </button>
                  <button
                    onClick={() => pasToe(true)}
                    disabled={bezig || !doelDagen.length}
                    style={{
                      minHeight: 54, borderRadius: 12, background: 'transparent',
                      border: `1px solid ${LIJN}`, color: '#fff',
                      fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit',
                      cursor: bezig ? 'wait' : 'pointer', opacity: doelDagen.length ? 1 : 0.5,
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    Altijd op deze {doelDagen.length === 1 ? 'dag' : 'dagen'}
                  </button>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, textAlign: 'center', marginTop: 2 }}>
                    Deze week verdwijnt vanzelf. Altijd vervangt die dag in je plan.
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
