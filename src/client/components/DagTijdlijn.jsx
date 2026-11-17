// src/client/components/DagTijdlijn.jsx
//
// De agendaweergave van één dag (17 nov 2026, Kersten): dezelfde tegel als een
// dag in de week van Coach Inzicht, maar dan voor de klant zelf.
//   · bovenin twee banden: slaap van de nacht ervoor (paars) en de stappen
//   · daaronder de dag op tijd: training en cardio als fotoblok, maaltijden,
//     supplementen en wegen als smalle regel
//   · werk en slaap als zacht vlak op de achtergrond
//   · rechts één voedingsbalk (kcal tegen het doel, met kcal en eiwit erin) en
//     een smalle strook voor water
//
// Alleen tekenen: wat er op de dag staat en wat er gebeurt bij een tik komt
// van DagAgenda, die de gegevens en de vensters al heeft.

import { useEffect, useRef, useState } from 'react'
import { CircleCheck, Circle, HeartPulse, Footprints, Moon, Briefcase, Pill, Scale, ClipboardCheck, Calendar, Milk, Coffee, Utensils, ChevronRight, Info } from 'lucide-react'
import { resolveFoodImage, foodImageFallback } from '../../modules/meal-plan/foodImageFallback'
import { getWorkoutImage } from '../../modules/workout/components/week-schedule/workoutImage'
import { cardioFoto } from '../../modules/workout/utils/workoutFoto'
import { kcalKleur } from '../../modules/meal-plan/utils/kcalKleur'
import { supplementFoto } from '../../modules/supplements/utils/supplementFoto'
import { useProductFotos } from '../../modules/supplements/utils/productFoto'

const GROEN = '#10b981'
const PAARS = '#a855f7'
const SLAAP_DOEL = 8
// Ruimte boven de banden, zodat de gloed van de slaapring niet tegen de
// bovenrand wordt afgesneden.
const BAND_BOVEN = 10
const BAND = 60 // ruimte erboven + slaapband + stappenband, elk hoog genoeg voor de ring
const BAND_HOOG = 24
// De balken van voeding en water beginnen iets boven de onderrand, zodat een
// lage stand met zijn ring niet onder in beeld wegvalt.
const BALK_BODEM = 0
// Ruimte links in de dag voor de uren, die nu in de tegel zelf staan.
const UREN_BREED = 40
// Rechts, tegen de schermrand: de voedingsbalk en daarnaast de waterbalk.
const VOEDING_BREED = 42
const WATER_BREED = 36
const BALKEN = VOEDING_BREED + WATER_BREED

const fmt = (n) => Math.round(n || 0).toLocaleString('nl-NL')
const kort = (x) => (x >= 10000 ? `${Math.round(x / 1000)}k` : x >= 1000 ? `${(x / 1000).toFixed(1).replace('.', ',').replace(',0', '')}k` : String(x))
const klok = (min) => (min == null ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`)
// Rood via oranje naar groen, t van 0 tot 1.
const schaal = (t) => {
  const x = Math.max(0, Math.min(1, t))
  const van = x < 0.5 ? [239, 68, 68] : [245, 158, 11]
  const naar = x < 0.5 ? [245, 158, 11] : [16, 185, 129]
  const u = x < 0.5 ? x / 0.5 : (x - 0.5) / 0.5
  return `rgb(${van.map((v, i) => Math.round(v + (naar[i] - v) * u)).join(',')})`
}
const isCardio = (b) => b.type === 'cardio' || (b.type === 'custom' && /^Cardio\s*·\s*/.test(String(b.label || '')))
const KLEIN_ICOON = { supplement: Pill, weging: Scale, checkin: ClipboardCheck }

export default function DagTijdlijn({
  blokken = [], isMobile = false, hoogte = null,
  onOpen = null,        // (blok) → maaltijd of training openen
  isGedaan = () => false,
  afronden = () => null, // (blok) → functie die afvinkt, of null
  onTijd = null,        // (blok) → tijd verzetten
  slaapVan = () => null, wegenVan = () => null,
  nuMin = null,         // minuten sinds middernacht als het vandaag is
  slaapUren = 0,
  stappen = null,       // { steps, doel }
  voeding = null,       // { kcal, eiwit, doelKcal, doelEiwit }
  water = null,         // { ml, doel }
  dagSleutel = null,    // verandert de dag, dan springt de agenda terug naar de ochtend
  // Hoeveel pixels de pagina links en rechts als marge heeft. De achtergrond
  // (uurlijnen, slaap- en werkkleur) loopt door tot de schermrand; wat ertoe
  // doet (tijden, blokken, balken) blijft binnen die marge staan.
  uitloop = 0,
  // Het vlak eromheen loopt zelf al van rand tot rand: dan geen negatieve marge.
  zonderMarge = false,
  onSlaap = null,       // tik op de slaapband → slaap invullen
  onWater = null,       // tik op het flesje → 100 ml erbij
  onVoeding = null,     // 'Loggen' in het ballonnetje bij de voedingsring → naar de maaltijdpagina
  onWaterMin = null,    // flesje ingedrukt houden → 100 ml eraf
  onStappen = null,     // tik op de stappenband → je week met stappen
  onVerzet = null,      // (blok, nieuweStart) na slepen → de ouder vraagt: alleen vandaag of altijd?
  // Hoeveel pixels onderaan achter de zwevende menubalk vallen. De agenda en de
  // balken lopen daar gewoon door; alleen de ringen blijven erboven, en je kunt
  // zo ver doorschuiven dat ook de late avond midden in beeld komt.
  onderRuimte = 0,
  onVolgendeDag = null, // onderaan de dag: door naar morgen
  onSupplementInfo = null, // (supplement) → uitleg bij dat supplement
  volgendeLabel = '',
}) {
  const U = Math.max(0, Number(uitloop) || 0)
  // Productfoto's van supplementen (het potje uit de winkelcatalogus), anders een passende stockfoto.
  const productFotos = useProductFotos()
  // De beschikbare hoogte bepaalt de schaal: de hele dag past zonder scrollen.
  const vak = useRef(null)
  const [vakHoogte, setVakHoogte] = useState(0)
  useEffect(() => {
    const el = vak.current
    if (!el) return
    const meet = () => setVakHoogte(el.clientHeight)
    meet()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Een pauze (eigen blok 'Pauze') hoort bij het werk: ook een vlak op de achtergrond.
  const isPauze = (b) => b.type === 'custom' && /^pauze$/i.test(String(b.label || '').trim())
  const achtergrond = blokken.filter(b => b.type === 'work' || b.type === 'sleep' || isPauze(b)).sort((a, b) => (isPauze(a) ? 1 : 0) - (isPauze(b) ? 1 : 0))
  const dingen = blokken.filter(b => b.type !== 'work' && b.type !== 'sleep' && !isPauze(b) && !b.meta?.placeholder)

  // De hele dag van 00:00 tot 24:00 staat erin; zestien uur past in beeld en
  // de rest bereik je door te schuiven. Bij openen: vandaag vanaf twee uur
  // geleden, een andere dag vanaf 06:00.
  const asStart = 0
  const asEind = 24 * 60
  const tijdHoogte = Math.max(200, vakHoogte - BAND)
  const pxPerMin = tijdHoogte / (16 * 60)
  const uren = Array.from({ length: 12 }, (_, i) => i * 120)
  const baan = useRef(null)
  useEffect(() => {
    if (!baan.current || !vakHoogte) return
    // Vandaag: twee uur terug bovenaan, de rest van de dag eronder. Een andere dag: vanaf 06:00.
    const start = nuMin != null ? Math.max(0, nuMin - 2 * 60) : 6 * 60
    baan.current.scrollTop = start * pxPerMin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dagSleutel, vakHoogte > 0])

  // ── Slepen: een blok oppakken en naar een andere tijd schuiven ──
  // Muis: vastpakken en bewegen. Vinger: even ingedrukt houden (anders is het
  // scrollen), dan schuiven. Loslaten meldt de nieuwe tijd aan de ouder.
  const [sleep, setSleep] = useState(null) // { id, delta } in minuten
  const sleepActief = useRef(false)
  const gesleept = useRef(false)
  const pxRef = useRef(pxPerMin)
  pxRef.current = pxPerMin
  useEffect(() => {
    const el = baan.current
    if (!el) return
    // Tijdens het slepen met een vinger mag de agenda zelf niet meescrollen.
    const blok = (e) => { if (sleepActief.current && e.cancelable) e.preventDefault() }
    el.addEventListener('touchmove', blok, { passive: false })
    return () => el.removeEventListener('touchmove', blok)
  }, [])
  const magSlepen = (b) => !!onVerzet && b.editable !== false && !b.meta?.los && !b.meta?.virtueel && b.type !== 'weging' && b.type !== 'checkin'
  const beginSleep = (e, b) => {
    if (!magSlepen(b) || (e.pointerType === 'mouse' && e.button !== 0)) return
    const startY = e.clientY
    const vinger = e.pointerType !== 'mouse'
    let delta = 0
    let wacht = null
    const activeer = () => { sleepActief.current = true; setSleep({ id: b.id, delta: 0 }); if (vinger && navigator.vibrate) navigator.vibrate(12) }
    if (vinger) wacht = setTimeout(activeer, 350)
    const klaar = () => {
      if (wacht) clearTimeout(wacht)
      window.removeEventListener('pointermove', beweeg); window.removeEventListener('pointerup', los); window.removeEventListener('pointercancel', stop)
    }
    const beweeg = (ev) => {
      const dy = ev.clientY - startY
      if (!sleepActief.current) {
        if (vinger) { if (Math.abs(dy) > 8) klaar(); return } // bewogen vóór het vasthouden: dat is scrollen
        if (Math.abs(dy) < 4) return
        activeer()
      }
      const d = Math.round(dy / pxRef.current / 5) * 5
      if (d !== delta) { delta = d; setSleep({ id: b.id, delta }) }
    }
    const stop = () => { klaar(); sleepActief.current = false; setSleep(null) }
    const los = () => {
      const was = sleepActief.current
      stop()
      if (!was) return
      gesleept.current = true
      setTimeout(() => { gesleept.current = false }, 300)
      if (delta !== 0) onVerzet(b, Math.max(0, Math.min(24 * 60 - 5, b.start + delta)))
    }
    window.addEventListener('pointermove', beweeg); window.addEventListener('pointerup', los); window.addEventListener('pointercancel', stop)
  }
  // Een tik na het slepen telt niet als openen.
  const alsGeenSleep = (fn) => (fn ? (e) => { if (gesleept.current) { e?.stopPropagation?.(); return } fn(e) } : undefined)
  const sleepStijl = (b) => (magSlepen(b) ? {
    cursor: sleep?.id === b.id ? 'grabbing' : 'grab', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
    ...(sleep?.id === b.id ? { outline: '2px solid #fff', outlineOffset: -2, zIndex: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' } : {}),
  } : {})

  const GROOT = isMobile ? 58 : 54
  // Een maaltijd is een kaart (foto, naam, macro's, i en vinkje), hoger dan een losse regel.
  const KAART = isMobile ? 38 : 34
  const KLEIN = isMobile ? 34 : 28
  // Elk ding op zijn tijd; wat zou overlappen schuift net onder het vorige.
  let onder = -Infinity
  const geplaatst = [...dingen].sort((a, b) => a.start - b.start).map(b => {
    const groot = b.type === 'training' || isCardio(b)
    const h = groot ? GROOT : (b.type === 'meal' || b.type === 'supplement') ? KAART : KLEIN
    // Het blok dat je sleept volgt je hand en duwt niets opzij.
    const mee = sleep?.id === b.id
    const top = mee ? (b.start + sleep.delta - asStart) * pxPerMin : Math.max((b.start - asStart) * pxPerMin, onder)
    if (!mee) onder = top + h + 2
    return { b, groot, top, h, mee }
  })

  const st = Number(stappen?.steps) || 0
  const stDoel = Number(stappen?.doel) || 0
  const stDeel = stDoel > 0 ? Math.min(1, st / stDoel) : 0
  const stGroen = Math.min(1, st / 10000)
  const meng = (van, naar) => Math.round(van + (naar - van) * stGroen)

  const kcal = Number(voeding?.kcal) || 0
  const eiwit = Number(voeding?.eiwit) || 0
  const doelKcal = Number(voeding?.doelKcal) || 0
  const doelEiwit = Number(voeding?.doelEiwit) || 0
  const kKleur = kcal > 0 ? kcalKleur(kcal, doelKcal, '#fff') : 'rgba(255,255,255,0.45)'
  const eKleur = kcal > 0 && doelEiwit ? schaal((eiwit / doelEiwit - 0.6) / 0.4) : 'rgba(255,255,255,0.45)'
  const kDeel = doelKcal > 0 ? Math.min(1, kcal / doelKcal) : 0
  const wDeel = water?.doel > 0 ? Math.min(1, (Number(water.ml) || 0) / water.doel) : 0

  // Binnen het slaapdoel van 7 tot 9 uur: het maantje en het getal worden groen; de band blijft paars.
  const slaapOpDoel = slaapUren >= 7 && slaapUren <= 9
  const tik = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  // Het eerstvolgende wat er vandaag nog te doen is: krijgt een rand en "over 40 min".
  const volgende = nuMin == null ? null : [...dingen].sort((a, b) => a.start - b.start)
    .find(b => b.start >= nuMin - 15 && !b.meta?.los && !isGedaan(b) && b.type !== 'weging') || null
  const overTekst = (b) => {
    const m = b.start - nuMin
    if (m <= 0) return 'nu'
    return m < 60 ? `over ${m} min` : `over ${Math.floor(m / 60)} u${m % 60 ? ` ${m % 60}` : ''}`
  }
  // Ballonnetje bij de voedingsring: wat er vandaag nog over is.
  const [overOpen, setOverOpen] = useState(false)
  const waterDruk = useRef({ timer: null, lang: false })
  // Vulhoogte van de balken rechts (voeding, water) in pixels. De balk is al
  // gevuld tot net boven de zwevende menubalk; daarvandaan groeit hij naar
  // boven. Zo zit er nooit een leeg gat achter de menubalk en staat de ring
  // bij nul precies op die rand.
  const balkBasis = onderRuimte > 0 ? onderRuimte + 18 : 0
  const vulPx = (deel) => Math.round(balkBasis + deel * Math.max(0, tijdHoogte - BALK_BODEM - balkBasis))
  const tijdKnop = (b, kleur) => (sleep?.id === b.id ? <span style={{ color: '#fff', fontWeight: 900 }}>{klok(Math.max(0, b.start + sleep.delta))}</span> :
    <span role={onTijd ? 'button' : undefined} onClick={onTijd ? (e) => { e.stopPropagation(); onTijd(b) } : undefined}
      style={{ cursor: onTijd ? 'pointer' : 'default', color: kleur, ...tik }}>{klok(b.start)}</span>
  )

  return (
    <div ref={vak} style={{ position: 'relative', flex: 1, minHeight: 320, height: hoogte || '100%', display: 'flex', gap: 6, boxSizing: 'border-box', marginLeft: zonderMarge ? 0 : -U, marginRight: zonderMarge ? 0 : -U }}>
      {/* De dag */}
      <div style={{
        position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden', background: 'transparent',
      }}>
        <style>{`@keyframes dagGloedPaars { 0%, 100% { box-shadow: 0 0 0 0 rgba(168,85,247,0); } 50% { box-shadow: 0 0 10px 3px rgba(168,85,247,0.75); } }`}</style>
        {/* Slaap van de nacht ervoor en de stappen: alleen het gevulde deel,
            met op het eind een ring met icoon (zelfde vorm als bij voeding en
            water) en de stand ernaast. */}
        {[
          { id: 'slaap', top: BAND_BOVEN, deel: Math.min(1, (slaapUren || 0) / SLAAP_DOEL), vulling: 'rgba(168,85,247,0.4)', ring: PAARS, icoonKleur: slaapOpDoel ? GROEN : '#fff', Icoon: Moon,
            tekst: slaapUren > 0 ? `${String(Math.round(slaapUren * 10) / 10).replace('.', ',')}u` : 'Slaap', kleur: slaapOpDoel ? '#a7f3d0' : slaapUren > 0 ? '#e9d5ff' : 'rgba(255,255,255,0.5)', onKlik: onSlaap, label: 'Slaap invullen',
            // Nog niet ingevuld en wel in te vullen: de ring gloeit zacht, als uitnodiging.
            gloed: !(slaapUren > 0) && !!onSlaap ? 'dagGloedPaars' : null },
          { id: 'stappen', top: BAND_BOVEN + BAND_HOOG + 1, deel: stDeel, vulling: `rgba(${meng(200, 16)},${meng(200, 185)},${meng(200, 129)},${(0.22 + 0.23 * stGroen).toFixed(2)})`, ring: st > 0 ? `rgb(${meng(255, 16)},${meng(255, 185)},${meng(255, 129)})` : 'rgba(255,255,255,0.5)', Icoon: Footprints,
            tekst: st > 0 ? `${kort(st)}${stDoel > 0 ? ` / ${kort(stDoel)}` : ''}` : 'Stappen', kleur: st > 0 ? '#fff' : 'rgba(255,255,255,0.5)', onKlik: onStappen, label: 'Stappen bekijken' },
        ].map(x => {
          const R = BAND_HOOG - 2
          // Het midden van de ring: op het eind van de vulling, maar altijd binnen beeld.
          const plek = `clamp(${U + R / 2 + 2}px, ${Math.round(x.deel * 100)}%, calc(100% - ${U + R / 2 + 2}px))`
          const links = x.deel > 0.6
          return (
            <div key={x.id} onClick={x.onKlik || undefined} role={x.onKlik ? 'button' : undefined} aria-label={x.label}
              style={{ position: 'absolute', top: x.top, left: 0, right: 0, height: BAND_HOOG, cursor: x.onKlik ? 'pointer' : 'default', zIndex: 5, ...tik }}>
              {/* De vulling loopt altijd minstens tot het midden van de ring, ook als er nog niets is. */}
              <div style={{ position: 'absolute', left: 0, top: 3, bottom: 3, width: `max(${Math.round(x.deel * 100)}%, ${U + R / 2 + 2}px)`, background: x.vulling, transition: 'width 0.4s ease' }} />
              <span style={{ position: 'absolute', top: 1, left: plek, width: R, height: R, marginLeft: -R / 2, boxSizing: 'border-box', borderRadius: '50%', border: `2px solid ${x.ring}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: x.gloed ? undefined : 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))', animation: x.gloed ? `${x.gloed} 1.8s ease-in-out infinite` : 'none', transition: 'left 0.4s ease' }}>
                <x.Icoon size={11} strokeWidth={2.6} color={x.icoonKleur || '#fff'} />
              </span>
              <span style={{ position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center', fontSize: '0.68rem', fontWeight: 900, color: x.kleur, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                ...(links ? { right: `calc(100% - ${plek} + ${R / 2 + 5}px)` } : { left: `calc(${plek} + ${R / 2 + 5}px)` }) }}>
                {x.tekst}
              </span>
            </div>
          )
        })}

        {/* De schuifbaan: de hele dag, met de uren links in beeld. */}
        <div ref={baan} className="dag-tijdlijn-baan" style={{ position: 'absolute', top: BAND, bottom: 0, left: 0, right: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{'.dag-tijdlijn-baan::-webkit-scrollbar{display:none}'}</style>
        <div style={{ position: 'relative', height: (asEind - asStart) * pxPerMin, backgroundImage: `repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent ${120 * pxPerMin}px)` }}>
        {uren.map(u => (
          <span key={u} style={{ position: 'absolute', left: U + 2, top: (u - asStart) * pxPerMin + 3, fontSize: '0.62rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1, zIndex: 3, pointerEvents: 'none' }}>{klok(u)}</span>
        ))}
        {/* Werk en slaap: zachte vlakken achter de rest. Tik op slaap om hem te loggen. */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          {achtergrond.map(b => {
            const slaapt = b.type === 'sleep'
            const boven = (b.start - asStart) * pxPerMin
            const hoog = Math.max(0, (b.end - b.start) * pxPerMin)
            const sl = slaapt ? slaapVan(b) : null
            return (
              <div key={b.id} style={{ position: 'absolute', left: 0, right: 0, top: boven, height: hoog, background: slaapt ? 'rgba(168,85,247,0.07)' : isPauze(b) ? '#0a0a0a' : 'rgba(255,255,255,0.035)' }}>
                {hoog >= 14 && (
                  <span role={onTijd ? 'button' : undefined} onClick={onTijd ? () => onTijd(b) : undefined} title={onTijd ? 'Tijden aanpassen' : undefined}
                    style={{ position: 'absolute', top: Math.max(2, -boven + 2), right: BALKEN + 8, zIndex: 3, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 0 4px 8px', fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: slaapt ? '#e9d5ff' : '#fff', cursor: onTijd ? 'pointer' : 'default', ...tik }}>
                    {slaapt ? <Moon size={11} strokeWidth={2.6} /> : isPauze(b) ? <Coffee size={11} strokeWidth={2.6} /> : <Briefcase size={11} strokeWidth={2.6} />}
                    {slaapt ? (sl?.gelogd ? `Slaap · ${String(sl.gelogd.uren).replace('.', ',')}u` : 'Slaap') : (b.label || 'Werk')}
                  </span>
                )}
              </div>
            )
          })}
          {/* Nu */}
          {nuMin != null && nuMin >= asStart && nuMin <= asEind && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: (nuMin - asStart) * pxPerMin, borderTop: '1px solid rgba(255,255,255,0.55)', zIndex: 4, pointerEvents: 'none' }}>
              <span style={{ position: 'absolute', left: -3, top: -3, width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            </div>
          )}
        </div>

        {/* Wat er op de dag staat */}
        {dingen.length === 0 ? (
          <div style={{ position: 'absolute', top: 6 * 60 * pxPerMin, height: tijdHoogte, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,0.3)' }}>
            <Calendar size={18} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Niets gepland op deze dag</span>
          </div>
        ) : (
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: U + UREN_BREED - 4, right: BALKEN + 8 }}>
            {geplaatst.map(({ b, groot, top, mee }) => {
              const gedaan = !!isGedaan(b)
              const vink = afronden(b)
              if (groot) {
                const cardio = isCardio(b)
                const naam = cardio ? String(b.label || '').replace(/^Cardio\s*·\s*/, '') || 'Cardio' : (b.sublabel || b.label || 'Training')
                const foto = cardio ? cardioFoto(naam) : getWorkoutImage({ name: naam })
                const sub = cardio ? `${Math.max(0, b.end - b.start)} min` : (b.meta?.exercise_count > 0 ? `${b.meta.exercise_count} oefeningen` : null)
                return (
                  <div key={b.id} onPointerDown={(e) => beginSleep(e, b)} onClick={alsGeenSleep(onOpen ? () => onOpen(b) : null)} style={{ ...sleepStijl(b), position: 'absolute', left: 0, right: 0, top, height: GROOT, borderRadius: 9, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', boxShadow: gedaan ? `inset 0 -2px 0 ${GROEN}` : volgende?.id === b.id ? 'inset 0 0 0 1.5px rgba(255,255,255,0.85)' : 'none', cursor: onOpen ? 'pointer' : 'default', ...tik }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: gedaan ? 0.5 : 0.35 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />
                    {gedaan && <CircleCheck size={15} strokeWidth={2.6} color={GROEN} style={{ position: 'absolute', top: 4, right: 4, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' }} />}
                    <div style={{ position: 'absolute', left: 6, right: 6, bottom: 4, lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: isMobile ? '0.82rem' : '0.76rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
                        {cardio && <HeartPulse size={11} strokeWidth={2.8} style={{ flexShrink: 0 }} />}
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                      </div>
                      <div style={{ fontSize: isMobile ? '0.62rem' : '0.56rem', fontWeight: 900, color: gedaan ? GROEN : 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tijdKnop(b, 'inherit')}{sub ? ` · ${sub}` : ''}{gedaan ? ' · gedaan' : ''}{volgende?.id === b.id && <span style={{ color: '#fff' }}> · {overTekst(b)}</span>}
                      </div>
                    </div>
                  </div>
                )
              }
              const maaltijd = b.type === 'meal'
              const naam = b.sublabel || b.label || (maaltijd ? 'Maaltijd' : '')
              const Icoon = KLEIN_ICOON[b.type] || Calendar
              const wg = b.type === 'weging' ? wegenVan(b) : null
              const klaar = gedaan || (wg && wg.gelogd != null)
              const openen = maaltijd && onOpen ? () => onOpen(b) : (wg?.kan ? wg.onLog : null)
              const extra = maaltijd ? (Number(b.meta?.kcal) > 0 ? `${fmt(b.meta.kcal)} kcal` : null)
                : wg?.gelogd != null ? `${String(wg.gelogd).replace('.', ',')} kg` : null
              // Supplementen: dezelfde kaart als een maaltijd, met de foto van het
              // potje, de i voor uitleg en het vinkje.
              if (b.type === 'supplement') {
                const items = Array.isArray(b.meta?.items) ? b.meta.items : []
                const eerste = items[0] || null
                const foto = eerste ? (productFotos[eerste.id] || supplementFoto({ name: eerste.naam }, 120)) : supplementFoto({ name: naam }, 120)
                const info = eerste && onSupplementInfo ? () => onSupplementInfo(eerste) : null
                const onder = items.length === 1 ? eerste.dosering : (items.length > 1 ? `${items.length} supplementen` : null)
                const knop = { flexShrink: 0, width: isMobile ? 38 : 32, alignSelf: 'stretch', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...tik }
                return (
                  <div key={b.id} onPointerDown={(e) => beginSleep(e, b)} style={{
                    ...sleepStijl(b), position: 'absolute', left: 0, right: 0, top, height: KAART, boxSizing: 'border-box',
                    display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderRadius: 10,
                    background: mee ? '#1a1a1a' : '#121212',
                    border: `1px solid ${volgende?.id === b.id ? 'rgba(255,255,255,0.85)' : klaar ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <div onClick={alsGeenSleep(info)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch', gap: 8, cursor: info ? 'pointer' : 'default', ...tik }}>
                      <span style={{ position: 'relative', width: KAART + 4, flexShrink: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#fff', opacity: klaar ? 0.5 : 1 }}>
                        {info && (
                          <span aria-hidden style={{ position: 'absolute', left: 3, bottom: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info size={12} strokeWidth={2.6} color="#fff" />
                          </span>
                        )}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.15, opacity: klaar ? 0.6 : 1 }}>
                        <span style={{ fontSize: isMobile ? '0.8rem' : '0.72rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: klaar ? 'line-through' : 'none' }}>{naam}</span>
                        <span style={{ fontSize: isMobile ? '0.62rem' : '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tijdKnop(b, 'inherit')}{onder ? ` · ${onder}` : ''}{volgende?.id === b.id && <span style={{ color: '#fff', fontWeight: 900 }}> · {overTekst(b)}</span>}
                        </span>
                      </span>
                    </div>
                    {vink && (
                      <button onClick={vink} aria-label={klaar ? 'Afvinken ongedaan maken' : 'Afronden'} title={klaar ? 'Toch niet' : 'Afronden'} style={knop}>
                        {klaar ? <CircleCheck size={isMobile ? 22 : 18} strokeWidth={2.6} color={GROEN} /> : <Circle size={isMobile ? 22 : 18} strokeWidth={2.2} color="rgba(255,255,255,0.6)" />}
                      </button>
                    )}
                  </div>
                )
              }
              // Maaltijd: een kaart zoals op de maaltijdpagina, met een i (openen) en het vinkje.
              if (maaltijd) {
                const foto = resolveFoodImage({ image_url: b.meta?.image_url, name: naam }) || foodImageFallback(naam, b.meta?.slot, 120)
                const doorgestreept = klaar && !b.meta?.los
                const delen = [
                  Number(b.meta?.kcal) > 0 ? `${fmt(b.meta.kcal)} kcal` : null,
                  Number(b.meta?.protein) > 0 ? `${fmt(b.meta.protein)}g eiwit` : null,
                ].filter(Boolean)
                const knop = { flexShrink: 0, width: isMobile ? 38 : 32, alignSelf: 'stretch', padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...tik }
                return (
                  <div key={b.id} onPointerDown={(e) => beginSleep(e, b)} style={{
                    ...sleepStijl(b), position: 'absolute', left: 0, right: 0, top, height: KAART, boxSizing: 'border-box',
                    display: 'flex', alignItems: 'stretch', overflow: 'hidden', borderRadius: 10,
                    background: mee ? '#1a1a1a' : '#121212',
                    border: `1px solid ${volgende?.id === b.id ? 'rgba(255,255,255,0.85)' : klaar ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}>
                    <div onClick={alsGeenSleep(openen)} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch', gap: 8, cursor: openen ? 'pointer' : 'default', ...tik }}>
                      <span style={{ position: 'relative', width: KAART + 4, flexShrink: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.06)', opacity: doorgestreept ? 0.5 : 1 }}>
                        {/* De i ligt over de foto: tik op de foto of de naam opent de maaltijd. */}
                        {openen && (
                          <span aria-hidden style={{ position: 'absolute', left: 3, bottom: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Info size={12} strokeWidth={2.6} color="#fff" />
                          </span>
                        )}
                      </span>
                      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.15, opacity: doorgestreept ? 0.6 : 1 }}>
                        <span style={{ fontSize: isMobile ? '0.8rem' : '0.72rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: doorgestreept ? 'line-through' : 'none' }}>{naam}</span>
                        <span style={{ fontSize: isMobile ? '0.62rem' : '0.56rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {tijdKnop(b, 'inherit')}{delen.length ? ` · ${delen.join(' · ')}` : ''}{volgende?.id === b.id && <span style={{ color: '#fff', fontWeight: 900 }}> · {overTekst(b)}</span>}
                        </span>
                      </span>
                    </div>
                    {b.meta?.los && <span style={{ ...knop, cursor: 'default' }}><CircleCheck size={isMobile ? 22 : 18} strokeWidth={2.6} color={GROEN} /></span>}
                    {vink && (
                      <button onClick={vink} aria-label={klaar ? 'Afvinken ongedaan maken' : 'Afronden'} title={klaar ? 'Toch niet' : 'Afronden'} style={knop}>
                        {klaar ? <CircleCheck size={isMobile ? 22 : 18} strokeWidth={2.6} color={GROEN} /> : <Circle size={isMobile ? 22 : 18} strokeWidth={2.2} color="rgba(255,255,255,0.6)" />}
                      </button>
                    )}
                  </div>
                )
              }
              return (
                <div key={b.id} onPointerDown={(e) => beginSleep(e, b)} style={{ ...sleepStijl(b), background: mee ? '#141414' : undefined, borderRadius: mee ? 6 : undefined, position: 'absolute', left: 0, right: 0, top, height: KLEIN, display: 'flex', alignItems: 'center', gap: 5, opacity: klaar && !b.meta?.los ? 0.6 : 1 }}>
                  <div onClick={alsGeenSleep(openen)} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 5, cursor: openen ? 'pointer' : 'default', ...tik }}>
                    {maaltijd ? (
                      <span style={{ width: KLEIN, height: KLEIN, flexShrink: 0, borderRadius: 5, backgroundImage: `url(${resolveFoodImage({ image_url: b.meta?.image_url, name: naam }) || foodImageFallback(naam, b.meta?.slot, 80)})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: 'rgba(255,255,255,0.06)' }} />
                    ) : (
                      <span style={{ width: KLEIN, height: KLEIN, flexShrink: 0, borderRadius: 5, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icoon size={isMobile ? 14 : 12} strokeWidth={2.4} color={klaar ? GROEN : 'rgba(255,255,255,0.7)'} />
                      </span>
                    )}
                    <span style={{ flex: 1, minWidth: 0, lineHeight: 1.1 }}>
                      <span style={{ display: 'block', fontSize: isMobile ? '0.72rem' : '0.64rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: klaar && maaltijd && !b.meta?.los ? 'line-through' : 'none' }}>{naam}</span>
                      <span style={{ display: 'block', fontSize: isMobile ? '0.58rem' : '0.52rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {tijdKnop(b, 'inherit')}{extra ? ` · ${extra}` : ''}{volgende?.id === b.id && <span style={{ color: '#fff', fontWeight: 900 }}> · {overTekst(b)}</span>}
                      </span>
                    </span>
                  </div>
                  {/* Zelf gelogd, buiten het plan om: staat er al, dus alleen een vinkje. */}
                  {b.meta?.los && <CircleCheck size={isMobile ? 20 : 16} strokeWidth={2.6} color={GROEN} style={{ flexShrink: 0, margin: '0 4px' }} />}
                  {vink && (
                    <button onClick={vink} aria-label={klaar ? 'Afvinken ongedaan maken' : 'Afronden'} title={klaar ? 'Toch niet' : 'Afronden'}
                      style={{ flexShrink: 0, width: KLEIN + 4, height: KLEIN, padding: 0, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...tik }}>
                      {klaar ? <CircleCheck size={isMobile ? 20 : 16} strokeWidth={2.6} color={GROEN} /> : <Circle size={isMobile ? 20 : 16} strokeWidth={2.2} color="rgba(255,255,255,0.6)" />}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        </div>
        {/* Onder 24:00: schuifruimte zodat ook de late avond midden in beeld
            kan komen, met bovenaan de stap naar de volgende dag. */}
        <div style={{ height: Math.round(tijdHoogte * 0.5), boxSizing: 'border-box', paddingTop: 10, paddingLeft: U, paddingRight: BALKEN + 8 }}>
          {onVolgendeDag && (
            <button onClick={onVolgendeDag} style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', ...tik }}>
              {volgendeLabel || 'Volgende dag'} <ChevronRight size={16} strokeWidth={3} />
            </button>
          )}
        </div>
        </div>
        {/* Ballonnetje bij de voedingsring: wat er vandaag nog kan, en door naar loggen. */}
        {overOpen && (() => {
          const restKcal = Math.round(doelKcal - kcal)
          const restEiwit = Math.round(doelEiwit - eiwit)
          return (
            <>
              <div onClick={() => setOverOpen(false)} style={{ position: 'absolute', inset: 0, zIndex: 86 }} />
              <div style={{ position: 'absolute', right: BALKEN + 10, bottom: Math.max(onderRuimte + 8, Math.min(tijdHoogte - 110, vulPx(kDeel) - 40)), zIndex: 87, width: 190, padding: '0.7rem 0.8rem', borderRadius: 14, background: '#141414', border: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 14px 34px rgba(0,0,0,0.6)' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>{doelKcal > 0 ? (restKcal >= 0 ? 'Nog over vandaag' : 'Boven je doel') : 'Vandaag'}</div>
                <div style={{ marginTop: 2, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {doelKcal > 0 ? fmt(Math.abs(restKcal)) : fmt(kcal)} <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>kcal</span>
                </div>
                {doelEiwit > 0 && (
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums' }}>
                    {restEiwit > 0 ? `nog ${fmt(restEiwit)} g eiwit` : 'eiwit gehaald'}
                  </div>
                )}
                {onVoeding && (
                  <button onClick={() => { setOverOpen(false); onVoeding() }} style={{ marginTop: 8, width: '100%', minHeight: 38, borderRadius: 10, background: '#fff', border: 'none', color: '#0a0a0a', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', ...tik }}>
                    Loggen
                  </button>
                )}
              </div>
            </>
          )
        })()}
        {/* Voeding: één brede balk, kcal tegen het doel, met kcal en eiwit bovenin de vulling. */}
        <div title={voeding ? `${fmt(kcal)} / ${fmt(doelKcal)} kcal · ${fmt(eiwit)} / ${fmt(doelEiwit)} g eiwit` : undefined} style={{ position: 'absolute', top: BAND, bottom: BALK_BODEM, right: WATER_BREED, width: VOEDING_BREED, background: 'transparent', zIndex: 85, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: vulPx(kDeel), background: kcal > 0 ? kKleur : 'rgba(255,255,255,0.35)', opacity: 0.55, transition: 'height 0.3s ease' }} />
          {/* Ring met bestek precies op de rand van de vulling (zelfde vorm als
              het flesje bij water); tik = naar je voeding. De stand staat eronder,
              of erboven als de balk nog bijna leeg is. */}
          {(() => {
            const KNOP = 30
            const balkHoogte = tijdHoogte - BALK_BODEM
            const vul = vulPx(kDeel)
            const knopOnder = Math.max(4 + onderRuimte, Math.min(balkHoogte - KNOP - 4, vul - KNOP / 2))
            const tekstOnder = knopOnder >= 46 + onderRuimte ? knopOnder - 42 : knopOnder + KNOP + 4 // drie regels: kcal, getal, eiwit
            return (
              <>
                <button onClick={() => setOverOpen(v => !v)} aria-label="Wat je vandaag nog over hebt" aria-expanded={overOpen}
                  style={{ position: 'absolute', left: '50%', marginLeft: -KNOP / 2, bottom: knopOnder, width: KNOP, height: KNOP, padding: 0, borderRadius: '50%', background: 'transparent', border: `2px solid ${kcal > 0 ? kKleur : 'rgba(255,255,255,0.5)'}`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, transition: 'bottom 0.3s ease', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))', ...tik }}>
                  <Utensils size={14} strokeWidth={2.6} />
                </button>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: tekstOnder, textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', pointerEvents: 'none', transition: 'bottom 0.3s ease' }}>
                  <div style={{ fontSize: '0.5rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)' }}>kcal</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>{fmt(kcal)}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 900, color: eKleur }}>E{fmt(eiwit)}</div>
                </div>
              </>
            )
          })()}
        </div>
        {/* Water: tegen de schermrand, met de stand erop en bovenaan de
            vulling een flesje: elke tik is 100 ml erbij (zoals de fles op de
            maaltijdpagina). */}
        {(() => {
          const ml = Number(water?.ml) || 0
          const doel = Number(water?.doel) || 0
          const l = (x) => String(Math.round(x / 100) / 10).replace('.', ',')
          const balkHoogte = tijdHoogte - BALK_BODEM
          const vul = vulPx(wDeel)
          return (
            <div title={water ? `Water ${l(ml)} / ${l(doel)} L` : undefined} style={{ position: 'absolute', top: BAND, bottom: BALK_BODEM, right: 0, width: WATER_BREED, background: 'transparent', zIndex: 85, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: vulPx(wDeel), background: '#38bdf8', opacity: 0.55, transition: 'height 0.3s ease' }} />
              {/* Het flesje staat precies op de rand van de vulling: half erin,
                  half erboven. De stand staat eronder, of erboven als de balk
                  nog bijna leeg is. */}
              {(() => {
                const KNOP = 30
                const knopOnder = Math.max(4 + onderRuimte, Math.min(balkHoogte - KNOP - 4, vul - KNOP / 2))
                const tekstOnder = knopOnder >= 34 + onderRuimte ? knopOnder - 30 : knopOnder + KNOP + 4
                return (
                  <>
                    <button disabled={!onWater} aria-label="100 ml water erbij. Ingedrukt houden: 100 ml eraf" title={onWater ? 'Tik: 100 ml erbij · ingedrukt houden: 100 ml eraf' : undefined}
                      onPointerDown={() => { const w = waterDruk.current; w.lang = false; if (onWaterMin) w.timer = setTimeout(() => { w.lang = true; onWaterMin(); if (navigator.vibrate) navigator.vibrate([10, 30, 10]) }, 550) }}
                      onPointerUp={() => clearTimeout(waterDruk.current.timer)} onPointerLeave={() => clearTimeout(waterDruk.current.timer)} onPointerCancel={() => clearTimeout(waterDruk.current.timer)}
                      onContextMenu={(e) => e.preventDefault()}
                      onClick={() => { if (waterDruk.current.lang) { waterDruk.current.lang = false; return } onWater?.() }}
                      style={{ position: 'absolute', left: '50%', marginLeft: -KNOP / 2, bottom: knopOnder, width: KNOP, height: KNOP, padding: 0, borderRadius: '50%', background: 'transparent', border: '2px solid #38bdf8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onWater ? 'pointer' : 'default', zIndex: 2, transition: 'bottom 0.3s ease', filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))', ...tik }}>
                      <Milk size={15} strokeWidth={2.6} />
                    </button>
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: tekstOnder, textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', pointerEvents: 'none', transition: 'bottom 0.3s ease' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>{l(ml)}</div>
                      <div style={{ fontSize: '0.56rem', fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>/ {l(doel)}L</div>
                    </div>
                  </>
                )
              })()}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
