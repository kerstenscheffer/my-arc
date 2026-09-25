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
  const dagenGehaald = gelopen.filter(d => (d.steps || 0) >= doel).length

  const hoogte = m ? 54 : 66

  return (
    <div style={{
      marginBottom: m ? '0.9rem' : '1.1rem',
      padding: m ? '0.9rem 1rem 1rem' : '1.05rem 1.25rem 1.15rem',
      background: 'rgba(255,255,255,0.035)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 14,
    }}>
      {/* Kop: het weektotaal is het nieuws, het woord ernaast de uitleg. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: m ? 12 : 14 }}>
        <Footprints size={m ? 16 : 18} color="rgba(255,255,255,0.55)" strokeWidth={2.4} style={{ flexShrink: 0, marginBottom: 3 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: m ? '1.35rem' : '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {nl(totaal)}
            <span style={{ fontSize: '0.5em', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginLeft: 5 }}>stappen</span>
          </div>
          <div style={{ fontSize: m ? '0.76rem' : '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
            deze week · gemiddeld {nl(gemiddeld)} per dag
          </div>
        </div>
        {dagenGehaald > 0 && (
          <div style={{
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 8px', borderRadius: 999,
            background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.4)',
            color: '#10b981', fontSize: m ? '0.72rem' : '0.76rem', fontWeight: 900,
          }}>
            {dagenGehaald}× doel
          </div>
        )}
      </div>

      {/* Zeven kolommen met een eigen baan, zodat een lege dag een lege baan
          is en geen streepje dat je moet raden. De doellijn loopt erdoorheen. */}
      <div style={{ position: 'relative', display: 'flex', gap: m ? 6 : 8, alignItems: 'flex-end' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, zIndex: 1, pointerEvents: 'none',
          bottom: 22 + Math.round((Math.min(doel, max) / max) * hoogte),
          borderTop: '1px dashed rgba(255,255,255,0.22)',
        }} />
        {week.map(d => {
          const deel = Math.min(1, (d.steps || 0) / max)
          const vul = d.steps > 0 ? Math.max(4, Math.round(deel * hoogte)) : 0
          const isVandaag = d.iso === vandaag
          const gehaald = (d.steps || 0) >= doel
          return (
            <div key={d.iso} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                title={`${d.dag}: ${nl(d.steps || 0)} stappen`}
                style={{
                  width: '100%', height: hoogte, borderRadius: 7,
                  background: d.toekomst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'flex-end', overflow: 'hidden',
                }}
              >
                {vul > 0 && (
                  <div style={{
                    width: '100%', height: vul, borderRadius: 7,
                    background: gehaald ? '#10b981' : 'rgba(255,255,255,0.55)',
                    transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                )}
              </div>
              <span style={{
                fontSize: m ? '0.72rem' : '0.76rem',
                fontWeight: isVandaag ? 900 : 700,
                color: isVandaag ? '#fff' : 'rgba(255,255,255,0.4)',
                textTransform: 'capitalize',
              }}>
                {d.dag}
              </span>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: m ? '0.75rem' : '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
        Doel {nl(doel)} per dag
      </div>
    </div>
  )
}
