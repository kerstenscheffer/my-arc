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

import { useState, useEffect, useMemo, useCallback } from 'react'
import { MoreHorizontal, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { createPortal } from '../../client/paginaPortal'
import { useModalHost } from '../../coach/ModalHost'
import BusinessChat from './BusinessChat'

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

// Reactor: groene voortgangsboog = % van het maanddoel, eromheen draaiende
// tikkenring en segmenten, in het midden een ademende kern. bezig = de chat
// denkt: alles draait en pulseert sneller. Animaties uit bij reduced-motion.
const REACTOR_CSS = `
  @keyframes bos-draai { to { transform: rotate(360deg) } }
  @keyframes bos-terug { to { transform: rotate(-360deg) } }
  @keyframes bos-puls { 0%,100% { opacity: .55; transform: scale(.94) } 50% { opacity: 1; transform: scale(1) } }
  @keyframes bos-adem { 0%,100% { opacity: .35; transform: scale(.92) } 50% { opacity: .7; transform: scale(1.04) } }
  .bos-r .bos-a { transform-origin: 120px 120px; transform-box: view-box; animation: bos-draai var(--d) linear infinite }
  .bos-r .bos-a.terug { animation-name: bos-terug }
  .bos-r .bos-kern { transform-origin: 120px 120px; transform-box: view-box; animation: bos-puls 3s ease-in-out infinite }
  .bos-r .bos-halo { animation: bos-adem 6s ease-in-out infinite }
  .bos-r.bezig .bos-a { animation-duration: calc(var(--d) / 5) }
  .bos-r.bezig .bos-kern { animation-duration: .9s }
  .bos-r.bezig .bos-halo { animation-duration: 1.4s }
  @media (prefers-reduced-motion: reduce) {
    .bos-r .bos-a, .bos-r .bos-kern, .bos-r .bos-halo { animation: none }
    .bos-r.bezig .bos-halo { opacity: .8 }
  }
`

function Reactor({ pct, maat, bezig }) {
  const R = 96
  const omtrek = 2 * Math.PI * R
  return (
    <div className={`bos-r${bezig ? ' bezig' : ''}`} style={{ position: 'relative', width: maat, height: maat, margin: '0 auto' }}
      role="img" aria-label={`${Math.round(pct)}% van je maanddoel${bezig ? ', assistent denkt na' : ''}`}>
      <style>{REACTOR_CSS}</style>
      <div className="bos-halo" style={{
        position: 'absolute', inset: '-12%', borderRadius: '50%', pointerEvents: 'none',
        background: `radial-gradient(circle, ${C.groen}55 0%, ${C.groen}18 45%, transparent 70%)`,
      }} />
      <svg viewBox="0 0 240 240" width={maat} height={maat} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <defs>
          <radialGradient id="bos-kern">
            <stop offset="0%" stopColor={C.groen} stopOpacity="0.45" />
            <stop offset="60%" stopColor={C.groen} stopOpacity="0.15" />
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

        {/* voortgangsboog = omzet / doel */}
        <circle cx="120" cy="120" r={R} fill="none" stroke="#ffffff" strokeOpacity="0.07" strokeWidth="6" />
        <circle cx="120" cy="120" r={R} fill="none" stroke={C.groen} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - pct / 100)}
          transform="rotate(-90 120 120)" filter="url(#bos-gloed)"
          style={{ transition: 'stroke-dashoffset 1s' }} />

        {/* segmenten */}
        <g className="bos-a terug" style={{ '--d': '18s' }}>
          <circle cx="120" cy="120" r="78" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="5"
            strokeDasharray="22 10" />
        </g>
        <g className="bos-a" style={{ '--d': '10s' }}>
          <circle cx="120" cy="120" r="64" fill="none" stroke={C.groen} strokeOpacity="0.8" strokeWidth="2"
            strokeDasharray="60 40" strokeLinecap="round" filter="url(#bos-gloed)" />
        </g>
        <circle cx="120" cy="120" r="56" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />

        {/* kern */}
        <circle className="bos-kern" cx="120" cy="120" r="48" fill="url(#bos-kern)" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{ ...NUM, fontWeight: 900, fontSize: maat >= 260 ? '3rem' : maat >= 200 ? '2.3rem' : '1.6rem', lineHeight: 1, color: C.wit, textShadow: `0 0 18px ${C.groen}` }}>
          {Math.round(pct)}%
        </div>
        <div style={{ ...LABEL, fontSize: maat >= 200 ? '0.68rem' : '0.56rem', color: C.wit, opacity: 0.85, marginTop: maat >= 200 ? 6 : 4 }}>van doel</div>
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
  const uur = nu.getHours()
  const groet = uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'
  const nodigPerDag = Math.max(0, doel - a.omzet) / Math.max(1, dagenInMaand - dagenVoorbij)
  const opKoers = a.prognose >= doel
  const zw = a.zwakste[0]

  // Inhoud van de onderdelen: precies wat eerder in de inklap-secties stond.
  const inhoud = (k) => {
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
    // screen de hele helft). Alleen de chatlijst scrolt.
    <div style={{
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

      <div style={{ maxWidth: 860, width: '100%', margin: '0 auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* ── Reactor-ring: het gezicht van de assistent, altijd in beeld ── */}
        <div style={{ flexShrink: 0, width: '100%', maxWidth: 820, margin: '0 auto' }}>
          <Reactor pct={pctDoel} maat={isMobile ? 150 : 210} bezig={denkt} />
          <div style={{
            display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: isMobile ? '2px 14px' : '4px 28px',
            marginTop: isMobile ? 12 : 18, fontSize: isMobile ? '0.78rem' : '0.82rem', fontWeight: 700, color: C.zacht, textAlign: 'center',
          }}>
            <span><b style={{ ...NUM, color: C.wit }}>{euro(a.omzet)}</b> van {euro(doel)}</span>
            <span>prognose <b style={{ ...NUM, color: opKoers ? C.groen : C.oranje }}>{euro(a.prognose)}</b></span>
            <span>zwakste schakel <b style={{ color: C.wit }}>{zw.label}</b></span>
          </div>
          <div style={{
            borderTop: `1px solid ${C.groen}40`, marginTop: isMobile ? 10 : 14, paddingTop: 10,
            fontSize: '0.85rem', fontWeight: 800, lineHeight: 1.4,
          }}>
            {groet} Kersten. {opKoers ? 'Je ligt op koers voor je doel.' : `Je mist ${euro(doel - a.prognose)} op je doel als dit tempo blijft.`}
          </div>
        </div>

        {/* ── Chat: de ring praat; alleen de berichtenlijst scrolt ── */}
        <BusinessChat onBezig={setDenkt} context={{
          omzet: Math.round(a.omzet), doel, prognose: Math.round(a.prognose), prijsPerSale: a.p,
          dezeMaand: data.nu, gemiddeldeAfgelopen3Maanden: data.voor,
          schakels: a.schakels.map(s => ({ schakel: s.label, verschilTovGemiddelde: Math.round(s.verschil * 100) + '%' })),
          zwaksteSchakel: zw.label, nodigVoorDoel: a.som, actieveKlanten: data.klanten?.actief,
        }} />
      </div>

      {blad && (
        <Blad titel={ONDERDELEN.find(([k]) => k === blad)?.[1]} isMobile={isMobile} onSluit={sluitBlad}>
          {inhoud(blad)}
        </Blad>
      )}
    </div>
  )
}
