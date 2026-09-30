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
//
// Geen kader eromheen: de cijfers en de staafjes staan los op de pagina. Een
// kaartje eromheen voegde niets toe behalve een rand, en op een telefoon werd
// de cardio-sectie daar hokkerig van.

import { useCallback, useEffect, useState } from 'react'
import { Footprints, Flame, Info, BarChart3 } from 'lucide-react'
import StappenService, { STANDAARD_DOEL, vandaagIso } from '../../steps/StappenService'
import { STAPPEN_EVENT } from '../../steps/stappenSync'
import { kcalVanStappen } from '../../steps/stappenEnergie'
import StappenInzichtModal from '../../steps/StappenInzichtModal'
import StappenUitlegModal from '../../steps/StappenUitlegModal'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))

export default function StappenStrook({ client, db, isMobile }) {
  const m = isMobile
  const [week, setWeek] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [gewichtKg, setGewichtKg] = useState(null)
  const [toonInzicht, setToonInzicht] = useState(false)
  const [toonUitleg, setToonUitleg] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id || !db?.supabase) return
    const [dagen, d] = await Promise.all([
      StappenService.haalWeek(db, client.id),
      StappenService.haalDoel(db, client.id),
    ])
    setWeek(dagen || [])
    setDoel(d || STANDAARD_DOEL)
  }, [db, client?.id])

  // Voor de calorieschatting. Eerst de laatste weging, want die is actueler
  // dan het veld op de klantkaart; dat blijft staan tot iemand het bijwerkt.
  // Kennen we het gewicht niet, dan tonen we geen getal — een calorieschatting
  // zonder gewicht is een slag in de lucht.
  useEffect(() => {
    let afgebroken = false
    const haal = async () => {
      if (!client?.id || !db?.supabase) return
      const { data } = await db.supabase
        .from('weight_tracking')
        .select('weight')
        .eq('client_id', client.id)
        .order('date', { ascending: false })
        .limit(1)
      if (afgebroken) return
      const weging = Number(data?.[0]?.weight)
      const kaart = Number(client.current_weight)
      setGewichtKg(
        Number.isFinite(weging) && weging > 0 ? weging
        : Number.isFinite(kaart) && kaart > 0 ? kaart
        : null
      )
    }
    haal()
    return () => { afgebroken = true }
  }, [db, client?.id, client?.current_weight])

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
  const kcal = kcalVanStappen(totaal, gewichtKg)

  const hoogte = m ? 54 : 66

  return (
    <div style={{ marginBottom: m ? '1.1rem' : '1.35rem' }}>
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

      {/* Onderregel: links het doel, rechts de knop naar de lange lijn. De
          calorieschatting staat ertussen met een eigen info-knop — zonder die
          uitleg is het een getal dat mensen voor een meting aanzien. */}
      <div style={{
        marginTop: 12, display: 'flex', alignItems: 'center',
        gap: 10, flexWrap: 'wrap',
        fontSize: m ? '0.78rem' : '0.81rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.55)',
      }}>
        <span>Doel {nl(doel)} per dag</span>

        {kcal !== null && kcal > 0 && (
          <>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Flame size={m ? 13 : 14} color="rgba(255,255,255,0.7)" strokeWidth={2.4} />
              <span style={{ color: 'rgba(255,255,255,0.72)' }}>± {nl(kcal)} kcal</span>
              <button
                onClick={() => setToonUitleg(true)}
                aria-label="Hoe is deze schatting berekend?"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, padding: 0, borderRadius: 999,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Info size={m ? 13 : 14} strokeWidth={2.4} />
              </button>
            </span>
          </>
        )}

        <button
          onClick={() => setToonInzicht(true)}
          style={{
            marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: m ? '6px 10px' : '7px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.75)',
            fontSize: m ? '0.74rem' : '0.77rem', fontWeight: 800,
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <BarChart3 size={m ? 13 : 14} strokeWidth={2.4} />
          30 &amp; 90 dagen
        </button>
      </div>

      <StappenInzichtModal
        isOpen={toonInzicht}
        onClose={() => setToonInzicht(false)}
        client={client}
        db={db}
        isMobile={m}
        gewichtKg={gewichtKg}
        doel={doel}
      />
      <StappenUitlegModal
        isOpen={toonUitleg}
        onClose={() => setToonUitleg(false)}
        isMobile={m}
      />
    </div>
  )
}
