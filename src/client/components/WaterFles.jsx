// src/client/components/WaterFles.jsx
//
// Water bijhouden met één tik. De fles zweeft aan de rechterkant van de
// maaltijdpagina en loopt vol naarmate de dag vordert; elke tik is 100 ml.
//
// Waarom hier en niet als kaart in de pagina: je drinkt de hele dag door,
// meestal terwijl je met iets anders bezig bent. Een teller waar je eerst
// naartoe moet scrollen wordt niet bijgehouden.
//
// Opslag: ai_water_tracking, één rij per klant per dag (unieke index op
// client_id + date). Het doel komt van de coach: clients.water_intake_target
// staat in liters.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus } from 'lucide-react'

const STAP_ML = 100
const STANDAARD_DOEL_L = 3

const vandaag = () => new Date().toISOString().split('T')[0]

export default function WaterFles({ client, db, isMobile = false, onderMarge = 130 }) {
  const [ml, setMl] = useState(0)
  const [doelMl, setDoelMl] = useState(STANDAARD_DOEL_L * 1000)
  const [geladen, setGeladen] = useState(false)
  const [toonMin, setToonMin] = useState(false)
  const bewaarTimer = useRef(null)
  const minTimer = useRef(null)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let weg = false
    ;(async () => {
      try {
        const [{ data: rij }, { data: c }] = await Promise.all([
          db.supabase.from('ai_water_tracking')
            .select('milliliters, target_milliliters')
            .eq('client_id', client.id).eq('date', vandaag()).maybeSingle(),
          db.supabase.from('clients')
            .select('water_intake_target').eq('id', client.id).maybeSingle(),
        ])
        if (weg) return
        setMl(Number(rij?.milliliters) || 0)
        // Het doel van de coach staat in liters op de klant; de rij van
        // vandaag kan een eigen doel hebben (bv. omdat het toen anders was).
        const uitKlant = Number(c?.water_intake_target) > 0 ? Number(c.water_intake_target) * 1000 : null
        setDoelMl(Number(rij?.target_milliliters) || uitKlant || STANDAARD_DOEL_L * 1000)
      } catch (e) {
        console.error('Water laden mislukt:', e)
      } finally {
        if (!weg) setGeladen(true)
      }
    })()
    return () => { weg = true }
  }, [db, client?.id])

  // Opslaan met een korte adempauze: tik je vijf keer achter elkaar, dan gaat
  // er één rij naar de database in plaats van vijf.
  const bewaar = useCallback((nieuweMl) => {
    if (bewaarTimer.current) clearTimeout(bewaarTimer.current)
    bewaarTimer.current = setTimeout(async () => {
      try {
        const { error } = await db.supabase.from('ai_water_tracking').upsert({
          client_id: client.id,
          date: vandaag(),
          milliliters: nieuweMl,
          glasses: Math.round(nieuweMl / 250),
          target_milliliters: doelMl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'client_id,date' })
        if (error) throw error
      } catch (e) {
        console.error('Water opslaan mislukt:', e)
      }
    }, 600)
  }, [db, client?.id, doelMl])

  useEffect(() => () => { if (bewaarTimer.current) clearTimeout(bewaarTimer.current) }, [])

  const verzet = (delta) => {
    setMl(vorig => {
      const nieuw = Math.max(0, vorig + delta)
      bewaar(nieuw)
      return nieuw
    })
    if (navigator.vibrate) navigator.vibrate(12)
    // Na een tik verschijnt het min-knopje even, voor als je te ver klikte.
    setToonMin(true)
    if (minTimer.current) clearTimeout(minTimer.current)
    minTimer.current = setTimeout(() => setToonMin(false), 4000)
  }

  if (!geladen || !client?.id) return null

  const pct = doelMl > 0 ? Math.min(100, (ml / doelMl) * 100) : 0
  const gehaald = ml >= doelMl && doelMl > 0
  const liters = (ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 1)

  return (
    <div style={{
      position: 'fixed',
      right: isMobile ? 10 : 16,
      bottom: `calc(${onderMarge}px + env(safe-area-inset-bottom, 0px))`,
      zIndex: 95,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      {/* Min-knop: alleen vlak na een tik, want meestal heb je hem niet nodig. */}
      <button
        onClick={() => verzet(-STAP_ML)}
        aria-label="100 ml eraf"
        title="100 ml eraf"
        style={{
          width: 26, height: 26, padding: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.14)',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
          opacity: toonMin && ml > 0 ? 1 : 0,
          transform: toonMin && ml > 0 ? 'translateY(0)' : 'translateY(6px)',
          pointerEvents: toonMin && ml > 0 ? 'auto' : 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Minus size={13} strokeWidth={3} />
      </button>

      {/* De fles zelf. Hij loopt van onderen vol; de tekst staat eronder. */}
      <button
        onClick={() => verzet(STAP_ML)}
        aria-label={`${ml} van ${doelMl} milliliter water. Tik voor 100 ml erbij.`}
        title={`${liters} van ${(doelMl / 1000).toFixed(1)} liter — tik voor +100 ml`}
        style={{
          position: 'relative', width: 46, height: 66, padding: 0,
          background: 'rgba(10,10,10,0.9)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          border: `1px solid ${gehaald ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 14,
          overflow: 'hidden', cursor: 'pointer',
          boxShadow: '0 10px 26px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        {/* Het water */}
        <span style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          height: `${pct}%`,
          background: 'linear-gradient(180deg, rgba(59,130,246,0.55) 0%, rgba(37,99,235,0.75) 100%)',
          transition: 'height 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
        }} />

        {/* Waterlijn: een streepje bovenop het water maakt het niveau leesbaar
            ook als de fles bijna leeg is. */}
        {pct > 0 && (
          <span style={{
            position: 'absolute', left: 0, right: 0, bottom: `${pct}%`,
            height: 2, background: 'rgba(147,197,253,0.9)',
            transition: 'bottom 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }} />
        )}

        <span style={{
          position: 'relative', width: '100%',
          padding: '0 2px 5px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}>
          <span style={{
            fontSize: '0.78rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1,
            textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            {liters}
          </span>
          <span style={{
            fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.65)',
            letterSpacing: '0.06em', textShadow: '0 1px 6px rgba(0,0,0,0.9)',
          }}>
            /{(doelMl / 1000).toFixed(1)}L
          </span>
        </span>
      </button>
    </div>
  )
}
