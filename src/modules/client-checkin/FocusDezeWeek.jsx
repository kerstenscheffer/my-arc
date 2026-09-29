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
import { Target } from 'lucide-react'
import { typeVan, doelTekst } from './doelen'

const isoDag = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function FocusDezeWeek({ db, client, isMobile = false }) {
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

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {doelen.map((d, i) => {
          const t = typeVan(d.type)
          const gedaan = t && cijfers ? t.meet(cijfers) : null
          const doel = Number(d.doel_getal) || null
          const klaar = gedaan != null && doel != null && gedaan >= doel
          const deel = (gedaan != null && doel) ? Math.min(1, gedaan / doel) : null

          return (
            <div key={i} style={{
              padding: isMobile ? '0.7rem 0.8rem' : '0.8rem 0.9rem',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${klaar ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  flex: 1, fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 900,
                  color: '#fff', letterSpacing: '-0.015em',
                }}>
                  {doelTekst(d)}
                </span>
                {gedaan != null && doel != null && (
                  <span style={{
                    fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 900,
                    color: klaar ? '#10b981' : '#fff', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {gedaan}<span style={{ color: 'rgba(255,255,255,0.3)' }}>/{doel}</span>
                  </span>
                )}
              </div>

              {/* Balkje alleen als we het kunnen meten. Bij een eigen doel
                  ("om 23:00 in bed") weet de app niets, en dan is een lege
                  balk een verkeerde belofte. */}
              {deel != null && (
                <div style={{
                  marginTop: 8, height: 4, borderRadius: 2,
                  background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.round(deel * 100)}%`, height: '100%',
                    background: klaar ? '#10b981' : '#fff',
                    borderRadius: 2, transition: 'width 0.3s ease',
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
