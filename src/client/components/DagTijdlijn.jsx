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
import { CircleCheck, Circle, HeartPulse, Footprints, Moon, Briefcase, Pill, Scale, ClipboardCheck, Calendar, Milk, Coffee } from 'lucide-react'
import { resolveFoodImage, foodImageFallback } from '../../modules/meal-plan/foodImageFallback'
import { getWorkoutImage } from '../../modules/workout/components/week-schedule/workoutImage'
import { cardioFoto } from '../../modules/workout/utils/workoutFoto'
import { kcalKleur } from '../../modules/meal-plan/utils/kcalKleur'

const GROEN = '#10b981'
const PAARS = '#a855f7'
const SLAAP_DOEL = 8
const BAND = 38 // slaapband + stappenband
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
  onSlaap = null,       // tik op de slaapband → slaap invullen
  onWater = null,       // tik op het flesje → 100 ml erbij
}) {
  const U = Math.max(0, Number(uitloop) || 0)
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

  const GROOT = isMobile ? 58 : 54
  const KLEIN = isMobile ? 34 : 28
  // Elk ding op zijn tijd; wat zou overlappen schuift net onder het vorige.
  let onder = -Infinity
  const geplaatst = [...dingen].sort((a, b) => a.start - b.start).map(b => {
    const groot = b.type === 'training' || isCardio(b)
    const h = groot ? GROOT : KLEIN
    const top = Math.max((b.start - asStart) * pxPerMin, onder)
    onder = top + h + 2
    return { b, groot, top, h }
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

  const tik = { touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }
  const tijdKnop = (b, kleur) => (
    <span role={onTijd ? 'button' : undefined} onClick={onTijd ? (e) => { e.stopPropagation(); onTijd(b) } : undefined}
      style={{ cursor: onTijd ? 'pointer' : 'default', color: kleur, ...tik }}>{klok(b.start)}</span>
  )

  return (
    <div ref={vak} style={{ position: 'relative', flex: 1, minHeight: 320, height: hoogte || '100%', display: 'flex', gap: 6, boxSizing: 'border-box', marginLeft: -U, marginRight: -U }}>
      {/* De dag */}
      <div style={{
        position: 'relative', flex: 1, minWidth: 0, overflow: 'hidden', background: 'transparent',
      }}>
        {/* Slaap van de nacht ervoor */}
        <div onClick={onSlaap || undefined} role={onSlaap ? 'button' : undefined} aria-label={onSlaap ? 'Slaap invullen' : undefined} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', cursor: onSlaap ? 'pointer' : 'default', zIndex: 5, ...tik }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(Math.min(1, (slaapUren || 0) / SLAAP_DOEL) * 100)}%`, background: 'rgba(168,85,247,0.4)' }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: slaapUren > 0 ? '#d8b4fe' : 'rgba(255,255,255,0.4)' }}>
            <Moon size={10} strokeWidth={2.6} color={slaapUren > 0 ? PAARS : 'currentColor'} />{slaapUren > 0 ? `${String(Math.round(slaapUren * 10) / 10).replace('.', ',')}u` : '·'}
          </div>
        </div>
        {/* Stappen */}
        <div style={{ position: 'absolute', top: 19, left: 0, right: 0, height: 18, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.round(stDeel * 100)}%`, background: `rgba(${meng(200, 16)},${meng(200, 185)},${meng(200, 129)},${(0.22 + 0.23 * stGroen).toFixed(2)})` }} />
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: '0.66rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: st > 0 ? `rgb(${meng(255, 16)},${meng(255, 185)},${meng(255, 129)})` : 'rgba(255,255,255,0.4)' }}>
            <Footprints size={10} strokeWidth={2.6} style={{ opacity: 0.8 }} />
            <span>{st > 0 ? kort(st) : '·'}{st > 0 && stDoel > 0 && <span style={{ opacity: 0.6 }}> / {kort(stDoel)}</span>}</span>
          </div>
        </div>

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
            {geplaatst.map(({ b, groot, top }) => {
              const gedaan = !!isGedaan(b)
              const vink = afronden(b)
              if (groot) {
                const cardio = isCardio(b)
                const naam = cardio ? String(b.label || '').replace(/^Cardio\s*·\s*/, '') || 'Cardio' : (b.sublabel || b.label || 'Training')
                const foto = cardio ? cardioFoto(naam) : getWorkoutImage({ name: naam })
                const sub = cardio ? `${Math.max(0, b.end - b.start)} min` : (b.meta?.exercise_count > 0 ? `${b.meta.exercise_count} oefeningen` : null)
                return (
                  <div key={b.id} onClick={onOpen ? () => onOpen(b) : undefined} style={{ position: 'absolute', left: 0, right: 0, top, height: GROOT, borderRadius: 9, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', boxShadow: gedaan ? `inset 0 -2px 0 ${GROEN}` : 'none', cursor: onOpen ? 'pointer' : 'default', ...tik }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: gedaan ? 0.5 : 0.35 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)' }} />
                    {gedaan && <CircleCheck size={15} strokeWidth={2.6} color={GROEN} style={{ position: 'absolute', top: 4, right: 4, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8))' }} />}
                    <div style={{ position: 'absolute', left: 6, right: 6, bottom: 4, lineHeight: 1.1, textShadow: '0 1px 6px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: isMobile ? '0.82rem' : '0.76rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
                        {cardio && <HeartPulse size={11} strokeWidth={2.8} style={{ flexShrink: 0 }} />}
                        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{naam}</span>
                      </div>
                      <div style={{ fontSize: isMobile ? '0.62rem' : '0.56rem', fontWeight: 900, color: gedaan ? GROEN : 'rgba(255,255,255,0.65)', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tijdKnop(b, 'inherit')}{sub ? ` · ${sub}` : ''}{gedaan ? ' · gedaan' : ''}
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
              return (
                <div key={b.id} style={{ position: 'absolute', left: 0, right: 0, top, height: KLEIN, display: 'flex', alignItems: 'center', gap: 5, opacity: klaar && !b.meta?.los ? 0.6 : 1 }}>
                  <div onClick={openen || undefined} style={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', alignItems: 'center', gap: 5, cursor: openen ? 'pointer' : 'default', ...tik }}>
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
                        {tijdKnop(b, 'inherit')}{extra ? ` · ${extra}` : ''}
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
        </div>
        {/* Voeding: één brede balk, kcal tegen het doel, met kcal en eiwit bovenin de vulling. */}
        <div title={voeding ? `${fmt(kcal)} / ${fmt(doelKcal)} kcal · ${fmt(eiwit)} / ${fmt(doelEiwit)} g eiwit` : undefined} style={{ position: 'absolute', top: BAND, bottom: 0, right: WATER_BREED, width: VOEDING_BREED, background: 'rgba(255,255,255,0.05)', zIndex: 4, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(kDeel * 100)}%`, background: kKleur, opacity: 0.55, transition: 'height 0.3s ease' }} />
          {kcal > 0 && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(4, Math.round(kDeel * tijdHoogte) - 32), textAlign: 'center', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.9)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#fff' }}>{fmt(kcal)}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 900, color: eKleur }}>E{fmt(eiwit)}</div>
            </div>
          )}
        </div>
        {/* Water: tegen de schermrand, met de stand erop en bovenaan de
            vulling een flesje: elke tik is 100 ml erbij (zoals de fles op de
            maaltijdpagina). */}
        {(() => {
          const ml = Number(water?.ml) || 0
          const doel = Number(water?.doel) || 0
          const l = (x) => String(Math.round(x / 100) / 10).replace('.', ',')
          const vul = Math.round(wDeel * tijdHoogte)
          return (
            <div title={water ? `Water ${l(ml)} / ${l(doel)} L` : undefined} style={{ position: 'absolute', top: BAND, bottom: 0, right: 0, width: WATER_BREED, background: 'rgba(255,255,255,0.05)', zIndex: 4, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.round(wDeel * 100)}%`, background: '#38bdf8', opacity: 0.55, transition: 'height 0.3s ease' }} />
              {/* Het flesje staat precies op de rand van de vulling: half erin,
                  half erboven. De stand staat eronder, of erboven als de balk
                  nog bijna leeg is. */}
              {(() => {
                const KNOP = 30
                const knopOnder = Math.max(4, Math.min(tijdHoogte - KNOP - 4, vul - KNOP / 2))
                const tekstOnder = knopOnder >= 34 ? knopOnder - 30 : knopOnder + KNOP + 4
                return (
                  <>
                    <button onClick={onWater || undefined} disabled={!onWater} aria-label="100 ml water erbij" title={onWater ? '100 ml erbij' : undefined}
                      style={{ position: 'absolute', left: '50%', marginLeft: -KNOP / 2, bottom: knopOnder, width: KNOP, height: KNOP, padding: 0, borderRadius: '50%', background: '#0a0a0a', border: '2px solid #38bdf8', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onWater ? 'pointer' : 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.6)', zIndex: 2, transition: 'bottom 0.3s ease', ...tik }}>
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
