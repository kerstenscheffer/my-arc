// src/modules/client-checkin/FocusDezeWeek.jsx
//
// De doelen die de klant zelf in zijn laatste check-in heeft gesteld, met hoe
// ver hij is. Op zijn startscherm, want een doel dat je één keer per week
// opschrijft en daarna nergens meer ziet is geen doel maar een formulier.
//
// De voortgang telt vanaf de dag van de check-in, niet vanaf maandag: hij heeft
// die doelen op dat moment gesteld, dus wat hij ervoor deed hoort er niet bij.
//
// Dit staat los van de interne coach-afspraken; dit is wat de klant zichzelf
// heeft voorgenomen.

import { useEffect, useState } from 'react'
import { Target, Dumbbell, Weight, Utensils } from 'lucide-react'
import BladModal from '../workout/components/todays-workout/components/BladModal'
import { typeVan, doelTekst } from './doelen'

const isoDag = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Icoontje per meetbaar doel, voor de compacte vorm in de bovenbalk.
const ICOON = { trainen: Dumbbell, wegen: Weight, voeding: Utensils }

// `compact`: alleen de meetbare doelen als 'icoon 3/5' naast elkaar, voor in
// de zwarte bovenbalk van home. Een tik opent alle doelen in een blad.
export default function FocusDezeWeek({ db, client, isMobile = false, compact = false }) {
  const [blad, setBlad] = useState(false)
  const [doelen, setDoelen] = useState(null)
  const [cijfers, setCijfers] = useState(null)
  const [vanaf, setVanaf] = useState(null)

  useEffect(() => {
    let weg = false
    if (!db?.supabase || !client?.id) return undefined
    ;(async () => {
      const { data } = await db.supabase
        .from('client_checkins')
        .select('checkin_date, doelen_komende_week')
        .eq('client_id', client.id)
        .eq('formulier_versie', 4)
        .not('doelen_komende_week', 'is', null)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(r => r, () => ({ data: null }))

      if (weg) return
      const lijst = data?.doelen_komende_week
      if (!Array.isArray(lijst) || lijst.length === 0) { setDoelen([]); return }
      setDoelen(lijst)
      setVanaf(data.checkin_date)

      // Wat er sinds de check-in is gebeurd. Zelfde RPC als het coachoverzicht
      // en de check-in zelf, zodat de klant geen ander getal ziet dan zijn coach.
      const { data: stand } = await db.supabase
        .rpc('get_challenge_stand', {
          p_client_id: client.id,
          p_start: String(data.checkin_date).slice(0, 10),
          p_eind: isoDag(new Date()),
        })
        .then(r => r, () => ({ data: null }))
      if (!weg) {
        setCijfers(stand ? {
          trainingen: { gedaan: stand.workouts?.geldig ?? null },
          wegingen: { gedaan: stand.wegingen ?? null },
          voeding: { dagen: stand.voeding?.geldige_dagen ?? null },
        } : null)
      }
    })()
    return () => { weg = true }
  }, [db, client?.id])

  if (!doelen || doelen.length === 0) return null

  const sindsLabel = vanaf
    ? new Date(`${String(vanaf).slice(0, 10)}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : null

  const meetbaar = doelen.map(d => {
    const t = typeVan(d.type)
    const gedaan = t && cijfers ? t.meet(cijfers) : null
    const doel = Number(d.doel_getal) || null
    return { d, key: t?.key, gedaan, doel }
  }).filter(x => x.gedaan != null && x.doel != null)

  const volledig = (inBlad) => (
    <div style={{ padding: inBlad ? 0 : (isMobile ? '0 1rem' : '0 1.5rem') }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginBottom: isMobile ? '0.6rem' : '0.7rem',
      }}>
        <Target size={15} color="#fff" strokeWidth={2.6} />
        <span style={{
          fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 900, color: '#fff',
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          Jouw focus deze week
        </span>
        {sindsLabel && (
          <span style={{ fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
            sinds {sindsLabel}
          </span>
        )}
      </div>

      {/* Compact: één regel per doel, zonder kader. Naam links, een kort
          balkje en de stand rechts. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 7 : 8 }}>
        {doelen.map((d, i) => {
          const t = typeVan(d.type)
          const gedaan = t && cijfers ? t.meet(cijfers) : null
          const doel = Number(d.doel_getal) || null
          const klaar = gedaan != null && doel != null && gedaan >= doel
          const deel = (gedaan != null && doel) ? Math.min(1, gedaan / doel) : null

          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 22 }}>
              <span style={{
                flex: 1, minWidth: 0, fontSize: isMobile ? '0.84rem' : '0.88rem', fontWeight: 800,
                color: klaar ? '#10b981' : '#fff', letterSpacing: '-0.015em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {doelTekst(d)}
              </span>
              {/* Balkje alleen als we het kunnen meten. Bij een eigen doel
                  ("om 23:00 in bed") weet de app niets, en dan is een lege
                  balk een verkeerde belofte. */}
              {deel != null && (
                <span style={{
                  width: isMobile ? 56 : 72, height: 4, borderRadius: 2, flexShrink: 0,
                  background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
                }}>
                  <span style={{
                    display: 'block', width: `${Math.round(deel * 100)}%`, height: '100%',
                    background: klaar ? '#10b981' : '#fff', borderRadius: 2, transition: 'width 0.3s ease',
                  }} />
                </span>
              )}
              {gedaan != null && doel != null && (
                <span style={{
                  flexShrink: 0, minWidth: 30, textAlign: 'right',
                  fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 900,
                  color: klaar ? '#10b981' : '#fff', fontVariantNumeric: 'tabular-nums',
                }}>
                  {gedaan}<span style={{ color: 'rgba(255,255,255,0.3)' }}>/{doel}</span>
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  if (!compact) return volledig(false)

  return (
    <>
      <button
        onClick={() => setBlad(true)}
        aria-label="Jouw focus deze week"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, height: '100%', padding: '0 0.6rem',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {meetbaar.length === 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: '0.78rem', fontWeight: 900 }}>
            <Target size={15} strokeWidth={2.6} /> {doelen.length}
          </span>
        ) : meetbaar.slice(0, 3).map((x, i) => {
          const Icoon = ICOON[x.key] || Target
          const klaar = x.gedaan >= x.doel
          return (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: klaar ? '#10b981' : '#fff', fontSize: '0.78rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
              <Icoon size={14} strokeWidth={2.6} />
              {x.gedaan}<span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.66rem', fontWeight: 800 }}>/{x.doel}</span>
            </span>
          )
        })}
      </button>
      <BladModal open={blad} titel="Jouw focus deze week" onClose={() => setBlad(false)} zIndex={2147482600}>
        {volledig(true)}
      </BladModal>
    </>
  )
}
