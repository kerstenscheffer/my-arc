// src/client/components/StappenPil.jsx
//
// Stappen van vandaag naast de begroeting, en de week erachter.
//
// Waarom zo klein: het is één getal dat je in het voorbijgaan wilt zien, geen
// kaart die een halve schermhoogte opeist. Wil je weten hoe de week loopt, dan
// tik je erop — daar staan de totalen, de dagen en het veld om je stand bij te
// werken.
//
// Telt de telefoon mee, dan vult hij zichzelf (zie telefoonStappen.js); anders
// tik je hem in. Voor de klant is het één getal, niet twee systemen.

import { useCallback, useEffect, useState } from 'react'
import { Footprints } from 'lucide-react'
import StappenService, { STANDAARD_DOEL } from '../../modules/steps/StappenService'
import { heeftTelefoonBron, koppel } from '../../modules/steps/telefoonStappen'
import { STAPPEN_EVENT } from '../../modules/steps/stappenSync'
import StappenInzicht from '../../modules/steps/StappenInzicht'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kort = (n) => (n >= 10000 ? `${(n / 1000).toFixed(1).replace('.', ',')}k` : nl(n))

// `kaal`: zonder bolletje, voor in de zwarte bovenbalk.
// `verborgen`: geen pil in beeld; het weekvenster opent dan via de gebeurtenis
// 'myarc:stappen-open' (de stappenband in de agenda op Home).
export default function StappenPil({ client, db, isMobile = false, kaal = false, verborgen = false }) {
  const [week, setWeek] = useState([])
  const [doel, setDoel] = useState(STANDAARD_DOEL)
  const [open, setOpen] = useState(false)
  const [klaar, setKlaar] = useState(false)

  const laad = useCallback(async () => {
    if (!client?.id) return
    const [dagen, d] = await Promise.all([
      StappenService.haalWeek(db, client.id),
      StappenService.haalDoel(db, client.id),
    ])
    setWeek(dagen)
    setDoel(d)
    setKlaar(true)
  }, [db, client?.id])

  useEffect(() => { laad() }, [laad])

  // Het uitlezen van de telefoon gebeurt in het dashboard (bij het openen van
  // de app en bij terugkeer op de voorgrond). Wij wachten op het bericht dat er
  // een nieuwe stand is.
  useEffect(() => {
    const opBijwerking = () => laad()
    window.addEventListener(STAPPEN_EVENT, opBijwerking)
    return () => window.removeEventListener(STAPPEN_EVENT, opBijwerking)
  }, [laad])

  // Kan er gekoppeld worden op dit toestel? Alleen dan tonen we de knop.
  const [bron, setBron] = useState(false)
  useEffect(() => {
    let weg = false
    heeftTelefoonBron().then(b => { if (!weg) setBron(b) })
    return () => { weg = true }
  }, [])

  const koppelNu = async () => {
    const n = await koppel()
    if (n == null) return false
    await StappenService.bewaar(db, client.id, n, { source: 'telefoon' })
      .catch(e => console.error('Stappen van telefoon opslaan mislukt:', e))
    laad()
    return true
  }

  useEffect(() => {
    if (!verborgen) return
    const op = () => setOpen(true)
    window.addEventListener('myarc:stappen-open', op)
    return () => window.removeEventListener('myarc:stappen-open', op)
  }, [verborgen])

  if (!klaar || !client?.id) return null

  const vandaag = week.find(d => d.isVandaag)
  const stand = vandaag?.steps || 0
  const pct = doel > 0 ? Math.min(100, (stand / doel) * 100) : 0
  const gehaald = stand >= doel && doel > 0

  return (
    <>
      {/* Verborgen = niet tekenen. Het hidden-attribuut verloor het van display: 'flex'
          in de stijl: de pil stond dan toch onder de agenda en liet Home scrollen (18 nov 2026). */}
      {!verborgen && (
      <button
        onClick={() => setOpen(true)}
        title="Stappen van deze week"
        aria-label={`Stappen vandaag: ${nl(stand)}. Bekijk je week.`}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: kaal ? '0 0.6rem' : (isMobile ? '0.3rem 0.5rem' : '0.35rem 0.6rem'),
          height: kaal ? '100%' : undefined,
          borderRadius: 999,
          background: kaal ? 'transparent' : 'rgba(255,255,255,0.05)',
          border: kaal ? 'none' : `1px solid ${gehaald ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
          color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Footprints size={13} strokeWidth={2.6} color={gehaald ? '#10b981' : 'rgba(255,255,255,0.55)'} />
        <span style={{
          fontSize: isMobile ? '0.72rem' : '0.76rem', fontWeight: 900,
          letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums',
        }}>
          {kort(stand)}
          {/* In de bovenbalk ook het doel erbij: 5.105/8.500. */}
          {kaal && doel > 0 && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.64rem', fontWeight: 800 }}>/{kort(doel)}</span>}
        </span>
        {/* Streepje van hoever je bent; in de bovenbalk niet, daar staat het
            doel er al als getal bij. */}
        {!kaal && (
        <span style={{
          width: 18, height: 3, borderRadius: 2, flexShrink: 0,
          background: 'rgba(255,255,255,0.14)', overflow: 'hidden',
        }}>
          <span style={{
            display: 'block', width: `${pct}%`, height: '100%',
            background: gehaald ? '#10b981' : '#fff',
          }} />
        </span>
        )}
      </button>
      )}

      {open && (
        // Sinds 18 nov het stappeninzicht (zelfde opzet als slaap). WeekModal
        // hieronder is niet meer in gebruik.
        <StappenInzicht
          db={db}
          client={client}
          doel={doel}
          isMobile={isMobile}
          bron={bron}
          onKoppel={koppelNu}
          onSluit={() => setOpen(false)}
          onBewaar={async (n, iso) => {
            setWeek(w => w.map(d => d.iso === iso ? { ...d, steps: n, source: 'handmatig' } : d))
            try {
              await StappenService.bewaar(db, client.id, n, { datum: iso, source: 'handmatig' })
            } catch (e) {
              console.error('Stappen opslaan mislukt:', e)
            }
            laad()
          }}
        />
      )}
    </>
  )
}
