// src/coach/pages/challenge-monitor/MealProgressView.jsx
//
// De voedingsweken van één deelnemer.
//
// Las ai_meal_progress en telde elke dag met "enige" registratie als goed. Dat
// is een andere regel dan de challenge hanteert (70% van de geplande
// maaltijden, en een week telt bij 5 goede dagen), dus dit scherm en de teller
// gaven verschillende antwoorden over dezelfde week.
//
// Nu uit get_challenge_stand, met de dagen erbij zodat je ziet welke dag een
// week onderuit haalde.

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { EISEN, haalStand } from '../../../modules/challenge-monitor/challengeEisen'

const EIS = EISEN.find(e => e.key === 'voeding')
const DAGEN_PER_WEEK = 5   // zelfde drempel als de RPC-parameter p_dagen_per_week

export default function MealProgressView({ client, db, challengeData }) {
  const isMobile = window.innerWidth <= 768
  const [stand, setStand] = useState(null)
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    let afgebroken = false
    setLaden(true)
    haalStand(db, challengeData ? { ...challengeData, client_id: client?.id } : null)
      .then(s => { if (!afgebroken) setStand(s) })
      .catch(e => console.error('Voedings-stand laden mislukt:', e))
      .finally(() => { if (!afgebroken) setLaden(false) })
    return () => { afgebroken = true }
  }, [client?.id, challengeData?.id, challengeData?.end_date])

  // Geen gekleurd kader: de tab erboven zegt al waar je naar kijkt.
  const kader = (inhoud) => <div>{inhoud}</div>

  if (laden) return kader(<div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Voeding ophalen…</div>)
  if (!stand) return kader(<div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '2rem' }}>Geen gegevens.</div>)

  const v = stand.voeding || {}
  const weken = v.weken || []
  const dagen = v.dagen || []
  const geldigeWeken = v.geldige_weken || 0

  // De dagen bij hun week zoeken. De RPC groepeert op maandag (date_trunc
  // 'week'), dus hier dezelfde maandag uitrekenen in plaats van op index.
  const maandagVan = (d) => {
    const dt = new Date(`${d}T00:00:00`)
    const verschuiving = (dt.getDay() + 6) % 7
    dt.setDate(dt.getDate() - verschuiving)
    return dt.toISOString().slice(0, 10)
  }
  const dagenPerWeek = new Map()
  dagen.forEach(d => {
    const k = maandagVan(d.dag)
    if (!dagenPerWeek.has(k)) dagenPerWeek.set(k, [])
    dagenPerWeek.get(k).push(d)
  })

  return kader(
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, minmax(0, 150px))',
        gap: isMobile ? 8 : 10, marginBottom: '1.4rem',
      }}>
        <Vak label={`van de ${EIS.nodig} weken nodig`} waarde={geldigeWeken} kleur={geldigeWeken >= EIS.nodig ? '#10b981' : '#f97316'} isMobile={isMobile} />
        <Vak label="goede dagen" waarde={v.geldige_dagen || 0} isMobile={isMobile} />
        <Vak label="dagen in periode" waarde={dagen.length} isMobile={isMobile} />
      </div>

      {weken.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
          Geen voedingsgegevens in deze periode.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weken.map((w, i) => {
            const ok = w.dagen >= DAGEN_PER_WEEK
            return (
              <div key={w.week} style={{
                padding: '0.7rem 0.8rem', borderRadius: 10,
                background: ok ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
                border: `1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                  {ok ? <Check size={14} color="#10b981" strokeWidth={3} /> : <X size={14} color="rgba(255,255,255,0.25)" strokeWidth={3} />}
                  <div style={{ fontSize: isMobile ? '0.78rem' : '0.83rem', fontWeight: 800, color: '#fff' }}>
                    Week {i + 1}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
                    vanaf {new Date(`${w.week}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                    color: ok ? '#10b981' : 'rgba(255,255,255,0.45)',
                  }}>
                    {w.dagen}<span style={{ color: 'rgba(255,255,255,0.2)' }}>/{DAGEN_PER_WEEK}</span>
                  </div>
                </div>
                {/* De losse dagen: hoveren geeft hoeveel maaltijden er gelogd zijn */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(dagenPerWeek.get(w.week) || []).map(d => (
                    <div key={d.dag}
                         title={`${new Date(`${d.dag}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })} — ${d.gelogd} van ${d.slots} maaltijden`}
                         style={{
                           flex: 1, height: 6, borderRadius: 3,
                           background: d.telt ? '#10b981'
                             : d.gelogd > 0 ? 'rgba(255,215,0,0.4)'
                             : 'rgba(255,255,255,0.08)',
                         }} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '0.9rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
        Een dag telt mee bij 70% van de maaltijden uit het actieve plan, een week
        bij {DAGEN_PER_WEEK} goede dagen. {EIS.uitleg.charAt(0).toUpperCase() + EIS.uitleg.slice(1)}.
        Een geel streepje is een dag waarop wél gelogd is, maar te weinig.
      </div>
    </>
  )
}

function Vak({ label, waarde, kleur = '#fff', isMobile }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.035)', borderRadius: 12,
      padding: isMobile ? '0.7rem 0.5rem' : '0.9rem', textAlign: 'center',
    }}>
      <div style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {waarde}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{label}</div>
    </div>
  )
}
