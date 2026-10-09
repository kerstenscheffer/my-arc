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
import { Minus, ChevronRight, Droplets } from 'lucide-react'
import { useOnderMarge } from './videoBalkHoogte'

const STAP_ML = 100
const STANDAARD_DOEL_L = 3
// De fles is te verslepen (omhoog/omlaag) en in te klappen tot een randje,
// want op de maaltijdpagina stond hij vast vóór de grammen van gerechten
// (call Martijn, 8 okt 2026). Beide staan onthouden op het toestel.
const SLEUTEL_HOOGTE = 'myarc_waterfles_hoogte'
const SLEUTEL_INGEKLAPT = 'myarc_waterfles_ingeklapt'
const lees = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const schrijf = (k, v) => { try { localStorage.setItem(k, String(v)) } catch { /* leeg */ } }

const vandaag = () => new Date().toISOString().split('T')[0]

// onderMarge is de afstand zonder video-balk; komt die omhoog, dan schuift de
// fles mee.
export default function WaterFles({ client, db, isMobile = false, onderMarge = 96 }) {
  const onder = useOnderMarge(onderMarge)
  const [ml, setMl] = useState(0)
  const [doelMl, setDoelMl] = useState(STANDAARD_DOEL_L * 1000)
  const [geladen, setGeladen] = useState(false)
  const [toonMin, setToonMin] = useState(false)
  const bewaarTimer = useRef(null)
  const minTimer = useRef(null)
  // Verslepen: extra hoogte boven de standaardplek, in px.
  const [hoogte, setHoogte] = useState(() => Math.max(0, Number(lees(SLEUTEL_HOOGTE)) || 0))
  const [ingeklapt, setIngeklapt] = useState(() => lees(SLEUTEL_INGEKLAPT) === '1')

  // Onder een venster blijven. Het voedingsscherm is zelf een vaste laag
  // (z-index 1) en de vensters daarin (maaltijdinfo, wisselen, loggen)
  // komen daardoor nooit boven deze fles (z-index 95) uit, hoe hoog hun
  // eigen z-index ook is (9 okt 2026). Daarom kijkt de fles zelf of er een
  // venster openstaat: een vaste laag met z-index ≥ 1000 die het grootste
  // deel van het scherm bedekt. Dan verdwijnt hij tot het venster dicht is.
  const [vensterOpen, setVensterOpen] = useState(false)
  useEffect(() => {
    const isVenster = (el) => {
      if (!(el instanceof HTMLElement)) return false
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed') return false
      const z = parseInt(cs.zIndex, 10)
      if (!(z >= 1000)) return false
      const r = el.getBoundingClientRect()
      return r.width >= window.innerWidth * 0.6 && r.height >= window.innerHeight * 0.5
    }
    const kandidaten = (node) => (node instanceof HTMLElement) ? [node, ...node.children] : []
    const open = new Set()
    const mo = new MutationObserver((muts) => {
      let gewijzigd = false
      muts.forEach(m => {
        m.addedNodes.forEach(n => kandidaten(n).forEach(el => { if (isVenster(el)) { open.add(el); gewijzigd = true } }))
        m.removedNodes.forEach(n => { open.forEach(el => { if (n === el || (n instanceof HTMLElement && n.contains(el))) { open.delete(el); gewijzigd = true } }) })
      })
      if (gewijzigd) setVensterOpen(open.size > 0)
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  const sleep = useRef({ actief: false, startY: 0, startHoogte: 0, verplaatst: false })

  const sleepStart = (e) => {
    sleep.current = { actief: true, startY: e.clientY, startHoogte: hoogte, verplaatst: false }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* leeg */ }
  }
  const sleepBeweeg = (e) => {
    if (!sleep.current.actief) return
    const dy = sleep.current.startY - e.clientY
    if (!sleep.current.verplaatst && Math.abs(dy) < 8) return
    sleep.current.verplaatst = true
    const max = Math.max(0, window.innerHeight - 260)
    setHoogte(Math.min(max, Math.max(0, sleep.current.startHoogte + dy)))
  }
  const sleepEind = () => {
    if (!sleep.current.actief) return
    sleep.current.actief = false
    if (sleep.current.verplaatst) schrijf(SLEUTEL_HOOGTE, Math.round(hoogte))
  }
  const klapIn = (v) => { setIngeklapt(v); schrijf(SLEUTEL_INGEKLAPT, v ? '1' : '0') }

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

  if (vensterOpen) return null

  if (ingeklapt) {
    return (
      <button
        onClick={() => klapIn(false)}
        aria-label="Waterfles tonen"
        style={{
          position: 'fixed', right: 0,
          bottom: `calc(${onder + hoogte + 20}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: 95, width: 30, height: 44, padding: 0,
          borderRadius: '10px 0 0 10px', border: '1px solid rgba(255,255,255,0.14)', borderRight: 'none',
          background: 'rgba(10,10,10,0.92)', color: 'rgba(96,165,250,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Droplets size={16} strokeWidth={2.4} />
      </button>
    )
  }

  const pct = doelMl > 0 ? Math.min(100, (ml / doelMl) * 100) : 0
  const gehaald = ml >= doelMl && doelMl > 0
  const liters = (ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 1)

  return (
    <div
      onPointerDown={sleepStart} onPointerMove={sleepBeweeg} onPointerUp={sleepEind} onPointerCancel={sleepEind}
      style={{
        position: 'fixed',
        right: isMobile ? 10 : 16,
        bottom: `calc(${onder + hoogte}px + env(safe-area-inset-bottom, 0px))`,
        transition: sleep.current.actief ? 'none' : 'bottom 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
        zIndex: 95, touchAction: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>

      {/* Min-knop: alleen vlak na een tik, want meestal heb je hem niet nodig. */}
      <button
        onClick={() => { if (!sleep.current.verplaatst) verzet(-STAP_ML) }}
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

      {/* De fles zelf: een echte flesvorm in SVG, die van onderen volloopt.
          Een afgerond blokje leek op een knop; hier zie je in één oogopslag
          waar het over gaat. */}
      <div style={{ position: 'relative' }}>
      {/* Inklappen: klein knopje tegen de dop van de fles, zodat je ziet dat
          het bij de fles hoort en niet bij de lijst erboven. */}
      <button
        onClick={(e) => { e.stopPropagation(); klapIn(true) }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Waterfles verbergen"
        title="Verbergen"
        style={{
          position: 'absolute', top: -4, right: -8, zIndex: 2,
          width: 20, height: 20, padding: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fff', border: '1px solid rgba(0,0,0,0.3)',
          color: '#0a0a0a', cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        <ChevronRight size={12} strokeWidth={3.5} />
      </button>
      <button
        onClick={() => { if (!sleep.current.verplaatst) verzet(STAP_ML) }}
        aria-label={`${ml} van ${doelMl} milliliter water. Tik voor 100 ml erbij. Sleep om te verplaatsen.`}
        title={`${liters} van ${(doelMl / 1000).toFixed(1)} liter — tik voor +100 ml`}
        style={{
          position: 'relative', padding: 0, border: 'none', background: 'transparent',
          cursor: 'pointer', lineHeight: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.55))',
        }}
      >
        <svg width={isMobile ? 42 : 46} height={isMobile ? 70 : 76} viewBox="0 0 40 72" fill="none">
          <defs>
            <clipPath id="fles-binnen">
              <path d="M15.5 8 L15.5 15.5 C15.5 19.5 8.5 21.5 8.5 29.5 L8.5 62 C8.5 66.5 11.5 69.5 16 69.5 L24 69.5 C28.5 69.5 31.5 66.5 31.5 62 L31.5 29.5 C31.5 21.5 24.5 19.5 24.5 15.5 L24.5 8 Z" />
            </clipPath>
          </defs>

          {/* Glas */}
          <path
            d="M15.5 8 L15.5 15.5 C15.5 19.5 8.5 21.5 8.5 29.5 L8.5 62 C8.5 66.5 11.5 69.5 16 69.5 L24 69.5 C28.5 69.5 31.5 66.5 31.5 62 L31.5 29.5 C31.5 21.5 24.5 19.5 24.5 15.5 L24.5 8 Z"
            fill="rgba(10,10,10,0.85)"
          />

          {/* Water, van onderen omhoog */}
          <g clipPath="url(#fles-binnen)">
            <rect
              x="0" width="40"
              y={72 - (pct / 100) * 62}
              height={(pct / 100) * 62 + 2}
              fill="url(#water)"
              style={{ transition: 'y 0.35s cubic-bezier(0.22, 1, 0.36, 1), height 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
            />
            {pct > 0 && (
              <rect
                x="0" width="40" height="1.6"
                y={72 - (pct / 100) * 62}
                fill="rgba(147,197,253,0.95)"
                style={{ transition: 'y 0.35s cubic-bezier(0.22, 1, 0.36, 1)' }}
              />
            )}
          </g>

          <defs>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.65)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.85)" />
            </linearGradient>
          </defs>

          {/* Rand van de fles en de dop */}
          <path
            d="M15.5 8 L15.5 15.5 C15.5 19.5 8.5 21.5 8.5 29.5 L8.5 62 C8.5 66.5 11.5 69.5 16 69.5 L24 69.5 C28.5 69.5 31.5 66.5 31.5 62 L31.5 29.5 C31.5 21.5 24.5 19.5 24.5 15.5 L24.5 8"
            stroke={gehaald ? 'rgba(96,165,250,0.9)' : 'rgba(255,255,255,0.35)'}
            strokeWidth="1.6"
            strokeLinejoin="round"
            fill="none"
          />
          <rect
            x="13.5" y="1.5" width="13" height="7" rx="2.2"
            fill={gehaald ? 'rgba(96,165,250,0.9)' : 'rgba(255,255,255,0.75)'}
          />
        </svg>

        <span style={{
          minWidth: 44, padding: '2px 6px', borderRadius: 999,
          background: 'rgba(10,10,10,0.9)',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: '0.6rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.01em', lineHeight: 1.4,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {liters}<span style={{ color: 'rgba(255,255,255,0.45)' }}>/{(doelMl / 1000).toFixed(1)}L</span>
        </span>
      </button>
      </div>
    </div>
  )
}
