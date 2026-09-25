// src/modules/workout/components/StappenStrook.jsx
//
// De stappen van deze week, bovenin de cardio-sectie.
//
// Ze staan al op de home-pagina als pil, maar daar kijk je naar je dag. Hier
// hoor je ze ook te zien: wandelen ís cardio, en wie zijn cardio bekijkt wil
// weten hoeveel hij liep zonder het ergens anders op te zoeken.
//
// Alleen lezen. De telefoon vult ze (zie telefoonStappen.js) en aanpassen doe
// je op de home-pagina of met de knop Stappen hiernaast; twee plekken om
// hetzelfde getal te wijzigen is er één te veel.

import { useCallback, useEffect, useState } from 'react'
import { Footprints } from 'lucide-react'
import StappenService, { STANDAARD_DOEL, vandaagIso } from '../../steps/StappenService'
import { STAPPEN_EVENT } from '../../steps/stappenSync'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function StappenStrook({ client, db, isMobile }) {
  const m = isMobile
  const [week, setWeek] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) return
    const [dagen, d] = await Promise.all([
      StappenService.haalWeek(db, client.id),
      StappenService.haalDoel(db, client.id),
    ])
    setWeek(dagen || [])
    setDoel(d || STANDAARD_DOEL)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  // De telefoon-synchronisatie laat van zich horen zodra er nieuwe stappen
  // binnen zijn; dan hoeft de klant niet te verversen.
  useEffect(() => {
    const opnieuw = () => laad()
    window.addEventListener(STAPPEN_EVENT, opnieuw)
    return () => window.removeEventListener(STAPPEN_EVENT, opnieuw)
  }, [laad])

  if (!week.length) return null

  const vandaag = vandaagIso()
  const gelopen = week.filter(d => !d.toekomst)
  const totaal = gelopen.reduce((s, d) => s + (d.steps || 0), 0)
  const metStappen = gelopen.filter(d => d.steps > 0)
  const gemiddeld = metStappen.length ? Math.round(totaal / metStappen.length) : 0
  const max = Math.max(doel, ...week.map(d => d.steps || 0), 1)

  return (
    <div style={{
      marginBottom: m ? '0.9rem' : '1.1rem',
      padding: m ? '0.8rem 0.9rem' : '0.9rem 1.1rem',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <Footprints size={m ? 14 : 16} color="rgba(255,255,255,0.45)" strokeWidth={2.4} style={{ alignSelf: 'center', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Stappen deze week
        </span>
        <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
          {nl(totaal)}
        </span>
      </div>

      <div style={{ display: 'flex', gap: m ? 5 : 7, alignItems: 'flex-end' }}>
        {week.map(d => {
          const hoogte = Math.max(3, Math.round(((d.steps || 0) / max) * (m ? 42 : 52)))
          const isVandaag = d.iso === vandaag
          const gehaald = (d.steps || 0) >= doel
          return (
            <div key={d.iso} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{ height: m ? 42 : 52, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  title={`${d.dag}: ${nl(d.steps || 0)} stappen`}
                  style={{
                    width: '100%', height: d.toekomst ? 3 : hoogte, borderRadius: 4,
                    background: d.toekomst
                      ? 'rgba(255,255,255,0.06)'
                      : gehaald ? '#10b981' : 'rgba(255,255,255,0.35)',
                  }}
                />
              </div>
              <span style={{
                fontSize: m ? '0.6rem' : '0.65rem',
                fontWeight: isVandaag ? 900 : 700,
                color: isVandaag ? '#fff' : 'rgba(255,255,255,0.35)',
              }}>
                {d.dag}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 8, fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
        Gemiddeld {nl(gemiddeld)} per dag · doel {nl(doel)}
      </div>
    </div>
  )
}
