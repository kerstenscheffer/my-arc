// src/modules/business-os/BusinessOS.jsx
//
// Business OS (30 okt 2026): het ene scherm waar alles samenkomt. Bovenaan het
// maanddoel, in het midden de keten content → lead → reactie → call → sale met
// de zwakste schakel en de terugrekensom, links de agents (pg_cron-jobs), rechts
// de calls van vandaag en de laatste sales. Indeling van het Jarvis-dashboard,
// kleuren MY ARC: zwart, dik wit, groen accent, blokken los op de pagina in
// plaats van in kaders. Data: RPC get_business_os (business-os.sql).
// Sinds 30 okt: de reactor-ring (% van maanddoel) is het gezicht van de AI-chat
// eronder: hij ademt rustig en versnelt zolang de chat denkt.
// Sinds 30 okt (middag): de pagina staat vast op schermhoogte, alleen de chat
// scrolt. De cijferpanelen zitten achter de puntjes-knop rechtsboven en openen
// als zijpaneel (desktop) of bottom sheet (mobiel).
// Sinds 30 okt (avond): geen begroeting meer; ring, cijferregel en chatbalk
// vormen één groep midden op het scherm, de ring schaalt mee met de hoogte.
// Stem-modus (30 okt): klik op de ring = Gino spreekt antwoorden hardop
// (stem.js). Klik tijdens het praten stopt alleen het praten. Zolang hij praat
// pulseert de ring in een eigen, sneller ritme.
// Stem (30 okt, avond): altijd eerst ElevenLabs (Gino-stem); de Mac-stem is
// alleen noodterugval. Faalt ElevenLabs, dan gloeit de bol kort oranjerood
// (.fout), zonder tekst of icoon.

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { createPortal } from '../../client/paginaPortal'
import { useModalHost } from '../../coach/ModalHost'
import BusinessChat from './BusinessChat'
import * as stem from './stem'
import ContentPlanningService from '../output-planning/ContentPlanningService'

const contentService = new ContentPlanningService(supabase)

const C = {
  bg: colors.bg,
  rand: colors.borderSubtle,
  wit: colors.textPrimary,
  gloed: 'rgba(255, 255, 255, 0.35)',
  tekst: colors.textPrimary,
  zacht: colors.textSecondary,
  groen: colors.success,
  oranje: '#f59e0b',
  rood: colors.danger,
}
const NUM = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }
const LABEL = { fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }
const DOEL_KEY = 'business_os_doel'
const PRIJS_KEY = 'business_os_prijs'

// De onderdelen achter de puntjes-knop, in deze volgorde.
const ONDERDELEN = [
  ['vandaag', 'Vandaag · taken, beloftes en calls'],
  ['content', 'Content · komende 14 dagen'],
  ['kern', 'Kerncijfers · deze maand'],
  ['keten', 'De keten · deze maand vs. gemiddelde'],
  ['acties', 'Acties deze week'],
  ['som', 'Terugrekensom · wat is er nodig'],
  ['calls', 'Calls · komende 3 dagen'],
  ['sales', 'Laatste sales'],
  ['agents', 'Agents'],
]

// Leesbare namen voor de cron-jobs. Onbekende jobs tonen hun eigen naam.
const AGENTS = {
  'instagram-sync': 'Instagram-sync',
  'meta-ad-insights': 'Meta ads-cijfers',
  'meta-ad-spend': 'Adspend',
  'meta-capi-flush': 'Meta conversies',
  'run-notification-schedules': 'Klantmeldingen',
  'sync-calendly-bookings': 'Calendly-boekingen',
  'weekreview-herinnering': 'Weekreview-herinnering',
}

// Per schakel: wat je doet als 'ie de zwakste is.
const ACTIES = {
  views: 'Bereik zakt: post weer dagelijks een reel en 4-5 magnets, hergebruik je best bekeken hooks.',
  leads: 'Minder leads op het bord: zet elke commenter dezelfde dag op het bord en post meer magnets.',
  reactie: 'Minder reacties: herschrijf het eerste magnet-bericht en stuur de outreach-ronde van 100 per dag.',
  call: 'Reacties worden geen calls: stel in elk gesprek binnen 3 berichten een call voor.',
  sale: 'Calls worden geen sales: luister je laatste 3 calls terug op bezwaren en pas je pitch aan.',
  prijs: 'Lagere orderwaarde: verkoop vaker het 12-weken traject of verhoog je prijs.',
}

const euro = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')
const getal = (n) => {
  const v = Number(n) || 0
  if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + 'M'
  if (v >= 1e4) return Math.round(v / 1e3) + 'K'
  return Math.round(v).toLocaleString('nl-NL')
}
const lees = (key, std) => {
  try { return Number(localStorage.getItem(key)) || std } catch { return std }
}
const bewaar = (key, v) => {
  try { localStorage.setItem(key, String(v)) } catch { /* privé-venster */ }
}

// Paneel voor één onderdeel: zijpaneel rechts op desktop, bottom sheet op
// mobiel. Scrolt zelf; sluit met het kruisje, een klik ernaast of Escape.
function Blad({ titel, isMobile, onSluit, children }) {
  const host = useModalHost()
  useEffect(() => {
    const toets = (e) => { if (e.key === 'Escape') onSluit() }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [onSluit])
  if (!host) return null
  return createPortal(
    <>
      <div onClick={onSluit} style={{ position: 'fixed', inset: 0, zIndex: 2147483400, background: 'rgba(0,0,0,0.6)' }} />
      <div role="dialog" aria-label={titel} style={{
        position: 'fixed', zIndex: 2147483401, background: '#0a0a0a', color: C.tekst,
        display: 'flex', flexDirection: 'column',
        ...(isMobile
          ? { left: 0, right: 0, bottom: 0, maxHeight: '80dvh', borderRadius: '20px 20px 0 0', borderTop: `1px solid ${C.rand}` }
          : { top: 0, right: 0, bottom: 0, width: 'min(440px, 100%)', borderLeft: `1px solid ${C.rand}` }),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 12px 12px 20px', borderBottom: `1px solid ${C.rand}`, flexShrink: 0 }}>
          <span style={{ ...LABEL, color: C.wit }}>{titel}</span>
          <button type="button" onClick={onSluit} title="Sluiten" style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'transparent',
            color: C.wit, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '16px 20px calc(24px + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </div>
      </div>
    </>,
    host,
  )
}

// Reactor = Gino, de AI-assistent. In het midden alleen licht: een gloeiende
// kern die ademt. Status via licht, geen iconen: stem uit = gedimd en traag,
// stem aan = fel en sneller, bezig = ringen jagen en de kern flikkert, praat =
// ritmisch pulseren. Aanzetten geeft een lichtgolf + flits (.ontwaakt), uitzetten
// dooft zacht (.dooft). De dunne groene boog = % van het maanddoel.
// Bij reduced-motion wisselt alleen de helderheid.
const REACTOR_CSS = `
  @keyframes bos-draai { to { transform: rotate(360deg) } }
  @keyframes bos-terug { to { transform: rotate(-360deg) } }
  @keyframes bos-puls { 0%,100% { opacity: .75; transform: scale(.95) } 50% { opacity: 1; transform: scale(1.03) } }
  @keyframes bos-sluimer { 0%,100% { opacity: .45; transform: scale(.9) } 50% { opacity: .8; transform: scale(1) } }
  @keyframes bos-adem { 0%,100% { opacity: .3; transform: scale(.9) } 50% { opacity: .6; transform: scale(1) } }
  @keyframes bos-adem-aan { 0%,100% { opacity: .6; transform: scale(1.02) } 50% { opacity: .95; transform: scale(1.12) } }
  @keyframes bos-flikker { 0%,100% { opacity: 1 } 20% { opacity: .55 } 35% { opacity: .95 } 55% { opacity: .65 } 80% { opacity: .9 } }
  @keyframes bos-praat { 0%,100% { opacity: .6; transform: scale(.92) } 30% { opacity: 1; transform: scale(1.1) } 60% { opacity: .8; transform: scale(.98) } }
  @keyframes bos-golf { 0% { opacity: .9; transform: scale(.5) } 100% { opacity: 0; transform: scale(2.3) } }
  @keyframes bos-flits { 0% { opacity: 0 } 25% { opacity: 1 } 100% { opacity: 0 } }
  @keyframes bos-dooft { 0% { opacity: 1; transform: scale(1.03) } 100% { opacity: .45; transform: scale(.9) } }
  .bos-r .bos-lijf { position: absolute; inset: 0; opacity: .5; transition: opacity .6s ease }
  .bos-r.aan .bos-lijf, .bos-r.praat .bos-lijf { opacity: 1 }
  .bos-r .bos-a { transform-origin: 120px 120px; transform-box: view-box; animation: bos-draai calc(var(--d) * 1.6) linear infinite }
  .bos-r .bos-a.terug { animation-name: bos-terug }
  .bos-r.aan .bos-a { animation-duration: calc(var(--d) * .7) }
  .bos-r .bos-kern { transform-origin: 120px 120px; transform-box: view-box; animation: bos-sluimer 6s ease-in-out infinite }
  .bos-r.aan .bos-kern { animation: bos-puls 3s ease-in-out infinite }
  .bos-r .bos-halo { animation: bos-adem 6s ease-in-out infinite }
  .bos-r.aan .bos-halo { animation: bos-adem-aan 3.5s ease-in-out infinite }
  .bos-r.bezig .bos-a { animation-duration: calc(var(--d) / 5) }
  .bos-r.bezig .bos-kern { animation: bos-flikker 1.1s ease-in-out infinite }
  .bos-r.bezig .bos-halo { animation-duration: 1.4s }
  .bos-r.praat .bos-kern { animation: bos-praat .7s ease-in-out infinite }
  .bos-r.praat .bos-halo { animation: bos-praat 1.1s ease-in-out infinite }
  .bos-r.dooft .bos-kern { animation: bos-dooft .6s ease-out forwards }
  @keyframes bos-fout { 0% { opacity: 0 } 20% { opacity: .9 } 45% { opacity: .5 } 65% { opacity: .8 } 100% { opacity: 0 } }
  .bos-r .bos-fout { opacity: 0 }
  .bos-r.fout .bos-fout { animation: bos-fout 1.8s ease-out }
  .bos-r .bos-golf, .bos-r .bos-flits { opacity: 0 }
  .bos-r.ontwaakt .bos-golf { animation: bos-golf .7s ease-out }
  .bos-r.ontwaakt .bos-flits { animation: bos-flits .7s ease-out }
  @media (prefers-reduced-motion: reduce) {
    .bos-r .bos-a, .bos-r .bos-kern, .bos-r .bos-halo, .bos-r.aan .bos-a, .bos-r.aan .bos-kern, .bos-r.aan .bos-halo,
    .bos-r.bezig .bos-a, .bos-r.bezig .bos-kern, .bos-r.praat .bos-kern, .bos-r.praat .bos-halo,
    .bos-r.dooft .bos-kern, .bos-r.ontwaakt .bos-golf, .bos-r.fout .bos-fout { animation: none }
    .bos-r.fout .bos-fout { opacity: .6 }
    .bos-r .bos-halo { opacity: .4 }
    .bos-r.aan .bos-halo, .bos-r.bezig .bos-halo, .bos-r.praat .bos-halo { opacity: .85 }
  }
`

function Reactor({ pct, maat, bezig, praat, stemAan, fout, melding, onKlik }) {
  const R = 96
  const omtrek = 2 * Math.PI * R
  // Eenmalige overgang bij wisselen van de stem: .ontwaakt (aan) of .dooft (uit).
  const [overgang, setOvergang] = useState(null)
  const vorige = useRef(stemAan)
  useEffect(() => {
    if (vorige.current === stemAan) return
    vorige.current = stemAan
    setOvergang(stemAan ? 'ontwaakt' : 'dooft')
    const t = setTimeout(() => setOvergang(null), stemAan ? 700 : 600)
    return () => clearTimeout(t)
  }, [stemAan])
  const klassen = ['bos-r', stemAan && 'aan', fout && 'fout', praat ? 'praat' : bezig && 'bezig', overgang].filter(Boolean).join(' ')
  const labelMaat = maat >= 200 ? '0.62rem' : '0.56rem'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className={klassen} style={{ position: 'relative', width: maat, height: maat, margin: '0 auto', cursor: 'pointer' }}
        role="button" tabIndex={0} title={`Gino, stem ${stemAan ? 'uit' : 'aan'}zetten`} aria-pressed={stemAan}
        aria-label={`Gino, stem ${stemAan ? 'aan' : 'uit'}${praat ? '. Gino praat' : bezig ? '. Gino denkt na' : ''}`}
        onClick={onKlik} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onKlik() } }}>
        <style>{REACTOR_CSS}</style>
        <div className="bos-lijf">
          <div className="bos-halo" style={{
            position: 'absolute', inset: '-14%', borderRadius: '50%', pointerEvents: 'none',
            background: `radial-gradient(circle, ${C.groen}66 0%, ${C.groen}1f 45%, transparent 70%)`,
          }} />
          <svg viewBox="0 0 240 240" width={maat} height={maat} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <defs>
              <radialGradient id="bos-kern">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="18%" stopColor={C.groen} stopOpacity="0.9" />
                <stop offset="50%" stopColor={C.groen} stopOpacity="0.35" />
                <stop offset="100%" stopColor={C.groen} stopOpacity="0" />
              </radialGradient>
              <filter id="bos-gloed" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* tikkenring */}
            <g className="bos-a" style={{ '--d': '60s' }}>
              {Array.from({ length: 72 }, (_, i) => (
                <line key={i} x1="120" y1="4" x2="120" y2={i % 6 ? 9 : 14}
                  stroke="#ffffff" strokeOpacity={i % 6 ? 0.18 : 0.5} strokeWidth={i % 6 ? 1 : 2}
                  transform={`rotate(${i * 5} 120 120)`} />
              ))}
            </g>

            {/* voortgangsboog = omzet / doel, bewust subtiel */}
            <circle cx="120" cy="120" r={R} fill="none" stroke="#ffffff" strokeOpacity="0.05" strokeWidth="3" />
            <circle cx="120" cy="120" r={R} fill="none" stroke={C.groen} strokeOpacity="0.5" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - pct / 100)}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 1s' }} />

            {/* segmenten */}
            <g className="bos-a terug" style={{ '--d': '18s' }}>
              <circle cx="120" cy="120" r="78" fill="none" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="4"
                strokeDasharray="22 10" />
            </g>
            <g className="bos-a" style={{ '--d': '10s' }}>
              <circle cx="120" cy="120" r="64" fill="none" stroke={C.groen} strokeOpacity="0.8" strokeWidth="2"
                strokeDasharray="60 40" strokeLinecap="round" filter="url(#bos-gloed)" />
            </g>

            {/* kern + flits bij ontwaken */}
            <circle className="bos-kern" cx="120" cy="120" r="60" fill="url(#bos-kern)" filter="url(#bos-gloed)" />
            <circle className="bos-flits" cx="120" cy="120" r="62" fill="url(#bos-kern)" />
          </svg>
        </div>
        {/* lichtgolf bij ontwaken: buiten het gedimde lijf, schiet vanuit de kern naar buiten */}
        <div className="bos-golf" style={{
          position: 'absolute', inset: '25%', borderRadius: '50%', pointerEvents: 'none',
          border: `2px solid ${C.groen}`, boxShadow: `0 0 24px ${C.groen}, inset 0 0 16px ${C.groen}88`,
        }} />
        {/* korte oranjerode gloed: ElevenLabs gaf een fout (stem.js zet teruggevallen) */}
        <div className="bos-fout" style={{
          position: 'absolute', inset: '-10%', borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,90,40,0.55) 0%, rgba(255,60,40,0.22) 45%, transparent 70%)',
        }} />
      </div>
      {/* naam onder de bol; een melding vervangt hem even */}
      <div role="status" style={{
        ...LABEL, fontSize: labelMaat, letterSpacing: melding ? '0.04em' : '0.42em', textTransform: melding ? 'none' : 'uppercase',
        marginTop: maat >= 200 ? 10 : 6, height: 16, lineHeight: '16px', whiteSpace: 'nowrap', pointerEvents: 'none',
        color: melding ? C.zacht : C.wit, opacity: melding ? 1 : 0.35, paddingLeft: melding ? 0 : '0.42em',
      }}>
        {melding || 'Gino'}
      </div>
    </div>
  )
}

function Paneel({ titel, children, style }) {
  return (
    <div style={{ padding: '8px 0', ...style }}>
      {titel && (
        <div style={{ ...LABEL, color: C.wit, marginBottom: 12 }}>
          {titel}
        </div>
      )}
      {children}
    </div>
  )
}

// ── Vandaag: beloftes, taken en calls ──
// Lokale datum als 'YYYY-MM-DD' (scheduled_date/deadline zijn date-kolommen).
const dagIso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const isBelofte = (t) => /^belofte/i.test(t.title || '')
const dagenOver = (datum, vandaag) => Math.round((new Date(vandaag) - new Date(datum)) / 864e5)

// Laadt de actieve taken van de ingelogde coach (zelfde filter als
// ProductivityService: coach_id = auth user id) en de calls van vandaag en morgen.
// Herhaaltaken blijven eruit: die mogen nooit permanent op 'completed'.
function useVandaag() {
  const [taken, setTaken] = useState(null)
  const [calls, setCalls] = useState([])
  const vandaag = dagIso(new Date())

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return
    const nu = new Date()
    const begin = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate())
    const eind = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate() + 2)
    const [t, c] = await Promise.all([
      supabase.from('productivity_tasks')
        .select('id, title, scheduled_date, deadline, recurrence_active')
        .eq('coach_id', user.id)
        .eq('status', 'active')
        .or(`scheduled_date.lte.${vandaag},deadline.eq.${vandaag}`)
        .order('scheduled_date', { ascending: true, nullsFirst: false })
        .then(r => r, e => ({ data: null, error: e })),
      supabase.from('client_calls')
        .select('id, scheduled_date, call_title, clients!inner(first_name, coach_id)')
        .eq('clients.coach_id', user.id)
        .in('status', ['scheduled', 'completed'])
        .is('canceled_at', null)
        .gte('scheduled_date', begin.toISOString())
        .lt('scheduled_date', eind.toISOString())
        .order('scheduled_date', { ascending: true })
        .then(r => r, e => ({ data: null, error: e })),
    ])
    if (!t.error) setTaken((t.data || []).filter(x => !x.recurrence_active))
    if (!c.error) setCalls(c.data || [])
  }, [vandaag])

  useEffect(() => { laad() }, [laad])

  const lijsten = useMemo(() => {
    const alle = taken || []
    const beloftes = alle.filter(x => isBelofte(x) && x.scheduled_date && x.scheduled_date <= vandaag)
    const rest = alle.filter(x => !isBelofte(x))
    const takenVandaag = rest.filter(x => x.scheduled_date === vandaag || x.deadline === vandaag)
    const overDatum = rest.filter(x => x.scheduled_date && x.scheduled_date < vandaag && !takenVandaag.includes(x))
    return { beloftes, takenVandaag, overDatum }
  }, [taken, vandaag])

  // Optimistisch afvinken: regel weg, bij een fout komt 'ie terug.
  const vinkAf = useCallback(async (taak) => {
    setTaken(l => (l || []).filter(x => x.id !== taak.id))
    const { error } = await supabase.from('productivity_tasks')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', taak.id)
      .then(r => r, e => ({ error: e }))
    if (error) {
      console.error('Afvinken mislukt:', error)
      setTaken(l => [...(l || []), taak].sort((x, y) => (x.scheduled_date || '9').localeCompare(y.scheduled_date || '9')))
    }
  }, [])

  return { geladen: taken !== null, vandaag, calls, ...lijsten, vinkAf, laad }
}

function TaakRegel({ taak, vandaag, toonDagen, onVink }) {
  const over = toonDagen && taak.scheduled_date ? dagenOver(taak.scheduled_date, vandaag) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      <button type="button" onClick={() => onVink(taak)} title="Afvinken" aria-label={`${taak.title} afvinken`} style={{
        width: 32, height: 32, flexShrink: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${C.groen}` }} />
      </button>
      <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.35 }}>{taak.title}</div>
      {toonDagen && (
        <div style={{ ...NUM, fontSize: '0.75rem', fontWeight: 800, color: over >= 1 ? C.oranje : C.zacht, flexShrink: 0 }}>
          {over >= 1 ? `${over} d over` : 'vandaag'}
        </div>
      )}
    </div>
  )
}

function VandaagPaneel({ v }) {
  const [alles, setAlles] = useState(false)
  if (!v.geladen) return <div style={{ fontSize: '0.85rem', color: C.zacht }}>Laden…</div>
  const leeg = (t) => <div style={{ fontSize: '0.85rem', color: C.zacht }}>{t}</div>
  const over = alles ? v.overDatum : v.overDatum.slice(0, 10)
  return (
    <>
      <Paneel titel={`Beloftes aan klanten · ${v.beloftes.length}`}>
        {v.beloftes.length === 0 && leeg('Geen openstaande beloftes.')}
        {v.beloftes.map(t => <TaakRegel key={t.id} taak={t} vandaag={v.vandaag} toonDagen onVink={v.vinkAf} />)}
      </Paneel>
      <Paneel titel={`Taken vandaag · ${v.takenVandaag.length}`} style={{ marginTop: 16 }}>
        {v.takenVandaag.length === 0 && leeg('Niets gepland voor vandaag.')}
        {v.takenVandaag.map(t => <TaakRegel key={t.id} taak={t} vandaag={v.vandaag} onVink={v.vinkAf} />)}
      </Paneel>
      <Paneel titel={`Over datum · ${v.overDatum.length}`} style={{ marginTop: 16 }}>
        {v.overDatum.length === 0 && leeg('Niets over datum.')}
        {over.map(t => <TaakRegel key={t.id} taak={t} vandaag={v.vandaag} toonDagen onVink={v.vinkAf} />)}
        {v.overDatum.length > 10 && (
          <button type="button" onClick={() => setAlles(a => !a)} style={{
            background: 'none', border: 'none', padding: '10px 0 0', minHeight: 40, cursor: 'pointer',
            color: C.groen, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 800,
          }}>
            {alles ? 'Toon minder' : `Toon alles (${v.overDatum.length})`}
          </button>
        )}
      </Paneel>
      <Paneel titel={`Calls vandaag en morgen · ${v.calls.length}`} style={{ marginTop: 16 }}>
        {v.calls.length === 0 && leeg('Geen calls vandaag of morgen.')}
        {v.calls.map(c => {
          const d = new Date(c.scheduled_date)
          const dag = dagIso(d) === v.vandaag ? 'Vandaag' : 'Morgen'
          return (
            <div key={c.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ ...NUM, fontSize: '0.8rem', fontWeight: 800, color: C.groen, minWidth: 96 }}>
                {dag} {d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.clients?.first_name || 'Klant'}{c.call_title ? ` · ${c.call_title}` : ''}
              </div>
            </div>
          )
        })}
      </Paneel>
    </>
  )
}

// ── Content: planner voor de komende 14 dagen ──
// Leest content_items van de ingelogde coach via ContentPlanningService
// (coach_id = auth user id). Gino zet editpakketten klaar als type reel,
// status planned, met title/hook/script/edit_notes en planned_date.
const STATUS_LABEL = { idea: 'idee', planned: 'gepland', created: 'gepost' }

function useContent() {
  const [items, setItems] = useState(null)
  const [ideeen, setIdeeen] = useState([])
  const vandaag = dagIso(new Date())
  const dagen = useMemo(() => {
    const [j, m, d] = vandaag.split('-').map(Number)
    return Array.from({ length: 14 }, (_, i) => new Date(j, m - 1, d + i))
  }, [vandaag])

  const laad = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.id) return
    const [lijst, idee] = await Promise.all([
      contentService.getContentItems(user.id, { weekStart: dagIso(dagen[0]), weekEnd: dagIso(dagen[13]) }),
      contentService.getContentIdeas(user.id),
    ])
    setItems(lijst)
    setIdeeen(idee.slice(0, 10))
  }, [dagen])

  useEffect(() => { laad() }, [laad])

  const perDag = useMemo(() => dagen.map(d => {
    const datum = dagIso(d)
    return { datum, dag: d, items: (items || []).filter(x => x.planned_date === datum) }
  }), [dagen, items])

  const gepost = useCallback(async (item) => {
    try {
      const nieuw = await contentService.updateContentItem(item.id, { status: 'created', posted_at: new Date().toISOString() })
      setItems(l => (l || []).map(x => (x.id === item.id ? { ...x, ...nieuw } : x)))
      return true
    } catch { return false }
  }, [])

  const plan = useCallback(async (idee, datum) => {
    if (!datum) return false
    try {
      await contentService.scheduleContent(idee.id, datum)
      await laad()
      return true
    } catch { return false }
  }, [laad])

  return { geladen: items !== null, perDag, ideeen, gepost, plan, laad }
}

const editpakket = (it) => [
  ['Titel', it.title], ['Hook', it.hook], ['Script', it.script], ['Editnotities', it.edit_notes],
].map(([k, w]) => `${k}\n${(w || '').trim() || '-'}`).join('\n\n')

function Knop({ children, onClick, vol }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, minHeight: 40, borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
      fontSize: '0.8rem', fontWeight: 800, padding: '0 12px',
      background: vol ? C.groen : 'transparent', color: vol ? '#000' : C.groen,
      border: `1px solid ${C.groen}`,
    }}>
      {children}
    </button>
  )
}

function ContentItem({ it, c }) {
  const [open, setOpen] = useState(false)
  const [melding, setMelding] = useState(null)
  const kopieer = async () => {
    try {
      await navigator.clipboard.writeText(editpakket(it))
      setMelding('Gekopieerd')
    } catch { setMelding('Kopiëren lukt niet in deze browser') }
  }
  const post = async () => setMelding(await c.gepost(it) ? 'Op gepost gezet' : 'Opslaan mislukt')
  const blok = (kop, tekst) => tekst ? (
    <div style={{ marginTop: 10 }}>
      <div style={{ ...LABEL, fontSize: '0.65rem', color: C.zacht }}>{kop}</div>
      <div style={{ fontSize: '0.85rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', marginTop: 2 }}>{tekst}</div>
    </div>
  ) : null
  return (
    <div style={{ marginTop: 6 }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', background: 'none',
        border: 'none', padding: '4px 0', minHeight: 32, cursor: 'pointer', color: C.wit, fontFamily: 'inherit',
      }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>
          {it.title || 'Zonder titel'}
        </span>
        {[it.type, STATUS_LABEL[it.status] || it.status].filter(Boolean).map(l => (
          <span key={l} style={{
            fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 6, flexShrink: 0,
            color: it.status === 'created' && l !== it.type ? C.groen : C.zacht, border: `1px solid ${C.rand}`,
          }}>{l}</span>
        ))}
      </button>
      {open && (
        <div style={{ paddingBottom: 6 }}>
          {blok('Hook', it.hook)}
          {blok('Script', it.script)}
          {blok('Editnotities', it.edit_notes)}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Knop vol onClick={kopieer}>Kopieer editpakket</Knop>
            {it.status !== 'created' && <Knop onClick={post}>Gepost</Knop>}
          </div>
          {melding && <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.zacht, marginTop: 6 }}>{melding}</div>}
        </div>
      )}
    </div>
  )
}

function IdeeRegel({ idee, c }) {
  const [fout, setFout] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
      <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.35 }}>
        {idee.title || 'Zonder titel'}
        {fout && <div style={{ fontSize: '0.72rem', color: C.rood }}>Plannen mislukt</div>}
      </div>
      <input type="date" aria-label={`Plan ${idee.title || 'idee'}`} min={c.perDag[0]?.datum}
        onChange={async e => setFout(!(await c.plan(idee, e.target.value)))}
        style={{
          background: 'transparent', border: `1px solid ${C.rand}`, borderRadius: 8, color: C.tekst,
          fontFamily: 'inherit', fontSize: '0.8rem', padding: '6px 8px', minHeight: 36, colorScheme: 'dark',
        }} />
    </div>
  )
}

function ContentPaneel({ c }) {
  if (!c.geladen) return <div style={{ fontSize: '0.85rem', color: C.zacht }}>Laden…</div>
  const gepland = c.perDag.filter(d => d.items.length > 0).length
  return (
    <>
      <div style={{ fontSize: '0.85rem', color: C.zacht, marginBottom: 12 }}>
        <b style={{ ...NUM, color: gepland >= 14 ? C.groen : C.wit }}>{gepland} van 14</b> dagen gepland
      </div>
      {c.perDag.map(d => {
        const leeg = d.items.length === 0
        return (
          <div key={d.datum} style={{
            padding: '8px 10px', marginBottom: 6, borderRadius: 10,
            border: `1px solid ${leeg ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.06)'}`,
            opacity: leeg ? 0.6 : 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ ...NUM, fontSize: '0.8rem', fontWeight: 800, color: leeg ? C.zacht : C.groen, minWidth: 64 }}>
                {d.dag.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
              {leeg && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: C.zacht }}>nog niets gepland</div>}
            </div>
            {d.items.map(it => <ContentItem key={it.id} it={it} c={c} />)}
          </div>
        )
      })}
      <Paneel titel={`Ideeën · ${c.ideeen.length}`} style={{ marginTop: 16 }}>
        {c.ideeen.length === 0 && <div style={{ fontSize: '0.85rem', color: C.zacht }}>Geen losse ideeën.</div>}
        {c.ideeen.map(i => <IdeeRegel key={i.id} idee={i} c={c} />)}
      </Paneel>
    </>
  )
}

function Invoer({ label, waarde, onChange }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', fontWeight: 700, color: C.zacht, flex: 1 }}>
      {label}
      <input
        type="number" inputMode="numeric" value={waarde}
        onChange={e => onChange(Math.max(1, Number(e.target.value) || 0))}
        style={{
          background: 'transparent', border: 'none', borderBottom: `1px solid ${C.rand}`, borderRadius: 0,
          color: C.tekst, ...NUM, fontSize: '1rem', fontWeight: 800, padding: '8px 0', minHeight: 44, outline: 'none',
        }}
      />
    </label>
  )
}

export default function BusinessOS({ isMobile }) {
  const [data, setData] = useState(null)
  const [fout, setFout] = useState(null)
  const [doel, setDoel] = useState(() => lees(DOEL_KEY, 10000))
  const [prijs, setPrijs] = useState(() => lees(PRIJS_KEY, 0))
  const [menu, setMenu] = useState(false)
  const [blad, setBlad] = useState(null)
  const [denkt, setDenkt] = useState(false)
  const sluitBlad = useCallback(() => setBlad(null), [])
  const vandaag = useVandaag()
  const { laad: laadVandaag } = vandaag
  useEffect(() => { if (blad === 'vandaag') laadVandaag() }, [blad, laadVandaag])
  const content = useContent()
  const { laad: laadContent } = content
  useEffect(() => { if (blad === 'content') laadContent() }, [blad, laadContent])
  // Stem-modus: eerste klik zet aan (en ontgrendelt iOS), klik tijdens praten
  // stopt alleen, klik in stilte zet uit.
  const { aan: stemAan, spreekt, teruggevallen } = stem.useStem()
  const [stemMelding, setStemMelding] = useState(null)
  const meldTimer = useRef(null)
  useEffect(() => () => clearTimeout(meldTimer.current), [])
  const meld = useCallback((tekst, ms) => {
    clearTimeout(meldTimer.current)
    setStemMelding(tekst)
    meldTimer.current = setTimeout(() => setStemMelding(null), ms)
  }, [])
  // ElevenLabs gaf een fout: kort oranjerood licht in de bol (1,8 s), geen tekst.
  const [stemFout, setStemFout] = useState(false)
  useEffect(() => {
    if (!teruggevallen) return
    setStemFout(true)
    const t = setTimeout(() => setStemFout(false), 1800)
    return () => clearTimeout(t)
  }, [teruggevallen])
  const klikRing = () => {
    if (!stem.beschikbaar()) {
      meld('Stem niet beschikbaar in deze browser', 2500)
      return
    }
    if (stem.isBezig()) { stem.stop(); return }
    if (!stemAan) stem.ontgrendel()
    stem.zetAan(!stemAan)
  }
  // Ringmaat volgt de beschikbare ruimte: hoogte min ringlabel + chatbalk.
  const [ruimte, setRuimte] = useState(null)
  const ro = useRef(null)
  const midden = useCallback((el) => {
    ro.current?.disconnect()
    ro.current = null
    if (!el || typeof ResizeObserver === 'undefined') return
    ro.current = new ResizeObserver(([e]) => {
      const b = Math.round(e.contentRect.width), h = Math.round(e.contentRect.height)
      setRuimte(r => (r && r.b === b && r.h === h ? r : { b, h }))
    })
    ro.current.observe(el)
  }, [])
  const maxMaat = isMobile ? 190 : 240
  const maat = ruimte
    ? Math.round(Math.max(96, Math.min(maxMaat, ruimte.h - (isMobile ? 206 : 196), ruimte.b - 48)))
    : (isMobile ? 150 : 210)

  const nu = new Date()
  const van = new Date(nu.getFullYear(), nu.getMonth(), 1)
  const tot = new Date(nu.getFullYear(), nu.getMonth() + 1, 1)
  const dagenInMaand = Math.round((tot - van) / 864e5)
  const dagenVoorbij = Math.max(1, (nu - van) / 864e5)

  useEffect(() => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    let weg = false
    const laad = () => supabase.rpc('get_business_os', { p_van: iso(van), p_tot: iso(tot) })
      .then(({ data: d, error }) => {
        if (weg) return
        if (error) setFout(error.message)
        else { setData(d); setFout(null) }
      })
    laad()
    const t = setInterval(laad, 60000)
    return () => { weg = true; clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const a = useMemo(() => {
    if (!data?.nu) return null
    const n = data.nu, v = data.voor
    // Tempo deze maand vs. gemiddelde maand van de 3 ervoor, per dag.
    const perDagNu = (x) => (Number(n[x]) || 0) / dagenVoorbij
    const perDagVoor = (x) => (Number(v[x]) || 0) / (dagenInMaand * 3)
    const ratio = (o, x, y) => (Number(o[y]) > 0 ? Number(o[x]) / Number(o[y]) : 0)
    const schakels = [
      { key: 'views', label: 'Views', nu: perDagNu('views'), voor: perDagVoor('views'), toon: getal(n.views) },
      { key: 'leads', label: 'Leads', nu: perDagNu('leads'), voor: perDagVoor('leads'), toon: getal(n.leads) },
      { key: 'reactie', label: 'Reactie', nu: ratio(n, 'reacties', 'leads'), voor: ratio(v, 'reacties', 'leads'), toon: getal(n.reacties), pct: true },
      { key: 'call', label: 'Call', nu: ratio(n, 'calls', 'reacties'), voor: ratio(v, 'calls', 'reacties'), toon: getal(n.calls), pct: true },
      { key: 'sale', label: 'Sale', nu: ratio(n, 'sales', 'calls'), voor: ratio(v, 'sales', 'calls'), toon: getal(n.sales), pct: true },
      { key: 'prijs', label: '€ / sale', nu: ratio(n, 'omzet', 'sales'), voor: ratio(v, 'omzet', 'sales'), toon: euro(ratio(n, 'omzet', 'sales')) },
    ].map(s => ({ ...s, verschil: s.voor > 0 ? s.nu / s.voor - 1 : 0 }))
    const zwakste = [...schakels].sort((x, y) => x.verschil - y.verschil)
    const omzet = Number(n.omzet) || 0
    const prognose = omzet / dagenVoorbij * dagenInMaand
    // Terugrekensom op de omzetting van de afgelopen 3 maanden.
    const p = prijs || Math.round(ratio(v, 'omzet', 'sales')) || 297
    const sales = Math.ceil(doel / p)
    const calls = Math.ceil(sales / (ratio(v, 'sales', 'calls') || 0.3))
    const reacties = Math.ceil(calls / (ratio(v, 'calls', 'reacties') || 0.06))
    const leads = Math.ceil(reacties / (ratio(v, 'reacties', 'leads') || 0.13))
    return { schakels, zwakste, omzet, prognose, p, som: { sales, calls, reacties, leads } }
  }, [data, doel, prijs, dagenVoorbij, dagenInMaand])

  if (fout) return <div style={{ background: C.bg, color: C.rood, padding: 24 }}>Business OS laadt niet: {fout}</div>
  if (!a) return <div style={{ background: C.bg, color: C.zacht, padding: 24, minHeight: '60vh', fontWeight: 700 }}>Laden…</div>

  const pctDoel = Math.min(100, a.omzet / doel * 100)
  const nodigPerDag = Math.max(0, doel - a.omzet) / Math.max(1, dagenInMaand - dagenVoorbij)
  const zw = a.zwakste[0]

  // Inhoud van de onderdelen: precies wat eerder in de inklap-secties stond.
  const inhoud = (k) => {
    if (k === 'vandaag') return <VandaagPaneel v={vandaag} />
    if (k === 'content') return <ContentPaneel c={content} />
    if (k === 'kern') return (
      <>
        <div style={{ fontSize: '0.85rem', color: C.zacht, marginBottom: 12 }}>
          Nog <b style={{ ...NUM, color: C.wit }}>{euro(nodigPerDag)}</b> per dag nodig voor je doel.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['VIEWS', getal(data.nu.views)],
            ['LEADS', getal(data.nu.leads)],
            ['CALLS', getal(data.nu.calls)],
            ['KLANTEN', `${data.klanten?.actief ?? 0}`],
          ].map(([l, w]) => (
            <Paneel key={l}>
              <div style={{ ...LABEL, color: C.zacht }}>{l}</div>
              <div style={{ ...NUM, fontSize: '1.6rem', fontWeight: 900, marginTop: 4 }}>{w}</div>
            </Paneel>
          ))}
        </div>
      </>
    )
    if (k === 'keten') return (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {a.schakels.map(s => {
            const kleur = s.verschil <= -0.25 ? C.rood : s.verschil < -0.05 ? C.oranje : C.groen
            return (
              <div key={s.key} style={{ borderBottom: `2px solid ${s.key === zw.key ? C.rood : 'transparent'}`, padding: '8px 0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.zacht }}>{s.label}</div>
                <div style={{ ...NUM, fontSize: '1.1rem', fontWeight: 900, margin: '4px 0' }}>{s.toon}</div>
                <div style={{ ...NUM, fontSize: '0.75rem', fontWeight: 800, color: kleur }}>
                  {s.verschil >= 0 ? '+' : ''}{Math.round(s.verschil * 100)}%
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: '0.75rem', color: C.zacht, marginTop: 8 }}>
          Views en leads per dag; reactie, call en sale als omzetting van de stap ervoor.
        </div>
      </>
    )
    if (k === 'acties') return (
      <>
        {a.zwakste.filter(s => s.verschil < -0.05).slice(0, 3).map((s, i) => (
          <div key={s.key} style={{ display: 'flex', gap: 10, padding: '6px 0', fontSize: '0.9rem', lineHeight: 1.45 }}>
            <span style={{ ...NUM, color: C.groen, fontWeight: 900 }}>{i + 1}</span>
            <span>{ACTIES[s.key]}</span>
          </div>
        ))}
        {!a.zwakste.some(s => s.verschil < -0.05) && (
          <div style={{ fontSize: '0.9rem' }}>Alle schakels draaien op of boven je gemiddelde. Schaal het volume op: meer magnets en meer outreach.</div>
        )}
      </>
    )
    if (k === 'som') return (
      <>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.rand}` }}>
          <Invoer label="Doel per maand (€)" waarde={doel} onChange={v => { setDoel(v); bewaar(DOEL_KEY, v) }} />
          <Invoer label="Prijs per sale (€)" waarde={prijs || a.p} onChange={v => { setPrijs(v); bewaar(PRIJS_KEY, v) }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
          {[['Sales', a.som.sales], ['Calls', a.som.calls], ['Reacties', a.som.reacties], ['Leads', a.som.leads]].map(([l, w]) => (
            <div key={l}>
              <div style={{ ...NUM, fontSize: '1.2rem', fontWeight: 900 }}>{getal(w)}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: C.zacht }}>{l} / mnd</div>
              <div style={{ ...NUM, fontSize: '0.75rem', fontWeight: 700, color: C.groen }}>{getal(w / 4.33)} / week</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '0.75rem', color: C.zacht, marginTop: 8 }}>
          Gerekend met jouw omzetting van de afgelopen 3 maanden.
        </div>
      </>
    )
    if (k === 'calls') return (
      <>
        {(data.calls || []).length === 0 && <div style={{ fontSize: '0.85rem', color: C.zacht }}>Geen calls ingepland.</div>}
        {(data.calls || []).map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
            <div style={{ ...NUM, fontSize: '0.8rem', fontWeight: 800, color: C.groen, minWidth: 64 }}>
              {new Date(c.datum).toLocaleDateString('nl-NL', { weekday: 'short' })} {c.tijd || ''}
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.naam}</div>
          </div>
        ))}
      </>
    )
    if (k === 'sales') return (data.sales || []).map((s, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.naam}</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.zacht }}>{new Date(s.at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ ...NUM, fontSize: '0.9rem', fontWeight: 900, color: C.groen }}>{euro(s.bedrag)}</div>
      </div>
    ))
    if (k === 'agents') return (data.agents || []).map(ag => {
      const ok = ag.actief && ag.status === 'succeeded'
      const kleur = !ag.actief ? C.zacht : ok ? C.groen : C.rood
      return (
        <div key={ag.naam} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: kleur, flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{AGENTS[ag.naam] || ag.naam}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: C.zacht }}>
              {!ag.actief ? 'uit' : ag.laatst ? new Date(ag.laatst).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'nog niet gedraaid'}
              {ag.actief && ag.status && ag.status !== 'succeeded' ? ` · ${ag.status}` : ''}
            </div>
          </div>
        </div>
      )
    })
    return null
  }

  return (
    // Vaste pagina: precies de ruimte boven de zwevende navbalk (in split
    // screen de hele helft). Alleen de chatlijst scrolt. Ring en chatbalk
    // staan als één groep in het midden; de ring schaalt mee met de
    // hoogte zodat de groep altijd past.
    <div data-bos-pagina="" style={{
      background: C.bg, color: C.tekst, position: 'relative', overflow: 'hidden',
      height: 'calc(var(--paneel-hoogte, 100dvh) - var(--paneel-navruimte, 120px))',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      padding: isMobile ? '12px 16px 8px' : '20px 24px 12px',
    }}>
      {/* ── Puntjes-knop rechtsboven: de cijferpanelen ── */}
      <div style={{ position: 'absolute', top: isMobile ? 12 : 16, right: isMobile ? 12 : 20, zIndex: 20 }}>
        <button type="button" onClick={() => setMenu(m => !m)} title="Cijfers" aria-expanded={menu} style={{
          width: 40, height: 40, borderRadius: '50%', border: `1px solid ${C.rand}`,
          background: menu ? colors.surface : 'transparent', color: C.wit, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <MoreHorizontal size={20} />
        </button>
        {menu && (
          <>
            <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: -1 }} />
            <div role="menu" style={{
              position: 'absolute', top: 48, right: 0, width: 240, background: '#0a0a0a',
              border: `1px solid ${C.rand}`, borderRadius: 14, padding: 6, boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}>
              {ONDERDELEN.map(([k, titel]) => (
                <button key={k} type="button" role="menuitem" onClick={() => { setMenu(false); setBlad(k) }}
                  onMouseEnter={e => { e.currentTarget.style.background = colors.surface }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  style={{
                    width: '100%', display: 'block', textAlign: 'left', background: 'none', border: 'none',
                    color: C.wit, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700,
                    padding: '0 12px', minHeight: 40, borderRadius: 10, cursor: 'pointer',
                  }}>
                  {titel.split(' · ')[0]}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Eén gecentreerde groep: ring en chatbalk ── */}
      <div ref={midden} style={{
        flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: '100%', maxWidth: 680, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Reactor pct={pctDoel} maat={maat} bezig={denkt} praat={spreekt} stemAan={stemAan} fout={stemFout} melding={stemMelding} onKlik={klikRing} />

          {/* ── Chat: de ring praat ── */}
          <BusinessChat onBezig={setDenkt} marginTop={isMobile ? 18 : 24} context={{
            omzet: Math.round(a.omzet), doel, prognose: Math.round(a.prognose), prijsPerSale: a.p,
            dezeMaand: data.nu, gemiddeldeAfgelopen3Maanden: data.voor,
            schakels: a.schakels.map(s => ({ schakel: s.label, verschilTovGemiddelde: Math.round(s.verschil * 100) + '%' })),
            zwaksteSchakel: zw.label, nodigVoorDoel: a.som, actieveKlanten: data.klanten?.actief,
            vandaag: {
              beloftesOpen: vandaag.beloftes.length, takenVandaag: vandaag.takenVandaag.length,
              overDatum: vandaag.overDatum.length, callsVandaag: vandaag.calls.filter(c => dagIso(new Date(c.scheduled_date)) === vandaag.vandaag).length,
              oudsteBeloftes: vandaag.beloftes.slice(0, 5).map(t => t.title),
            },
            contentKomende14Dagen: {
              geplandeDagen: content.perDag.filter(d => d.items.length > 0).length,
              legeDagen: content.perDag.filter(d => d.items.length === 0).map(d => d.datum),
              items: content.perDag.flatMap(d => d.items.map(it => ({ datum: d.datum, titel: it.title, status: it.status }))),
            },
          }} />
        </div>
      </div>

      {blad && (
        <Blad titel={ONDERDELEN.find(([k]) => k === blad)?.[1]} isMobile={isMobile} onSluit={sluitBlad}>
          {inhoud(blad)}
        </Blad>
      )}
    </div>
  )
}
