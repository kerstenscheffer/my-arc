// src/modules/challenge-ads/ChallengeAdsDashboard.jsx
//
// Coachscherm "Ads": wat de Meta-advertenties voor de 6 Weken Challenge
// opleveren, per hook (utm_content). Bron: challenge_events (gemeten op de
// pagina) en call_leads (aanmeldingen en geplande calls), via de
// database-functie get_challenge_ad_stats.
//
// Opgezet zodat je in tien seconden snapt hoe het gaat (Kersten, 12 okt 2026:
// "een kind van 10 moet het begrijpen"):
//   1. Rapportcijfer (meter: calls per 100 bezoekers) + grafiek per dag.
//   2. Vier KPI-kaarten met sparkline en verschil met de vorige periode.
//   3. De trechter tegen richtwaarden, naast wat je kunt verbeteren.
//   4. Welke advertentie werkt: hooks samengevoegd en gerangschikt.
// Opzet à la Stripe: kaarten, grafieken, deltas (Kersten: "zou Stripe zo'n
// dashboard hebben?"). Per-dag-cijfers via get_challenge_ad_daily.
//
// De richtwaarden zijn vuistregels voor koud verkeer uit Meta naar een
// aanmeldpagina met formulier, geen wet. Ze staan bovenaan in RICHT.
//
// CTR en kosten staan hier niet: die zitten in Meta Ads Manager.

import { createElement, useEffect, useState } from 'react'
import {
  RefreshCw, Copy, Check, CalendarDays, ChevronDown, Filter, Lightbulb, Megaphone, Table2, Link2,
  ArrowUpRight, ArrowDownRight, Gauge, Activity, MousePointerClick, Play, PenLine, ClipboardCheck,
  UserCheck, CalendarCheck, Sparkles,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PERIODES = [
  { id: '7', label: '7 dagen', dagen: 7 },
  { id: '14', label: '14 dagen', dagen: 14 },
  { id: '30', label: '30 dagen', dagen: 30 },
  { id: '90', label: '90 dagen', dagen: 90 },
]

const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'
const GRIJS = 'rgba(255,255,255,0.4)'

// Onder dit aantal mensen bij de stap ervoor zeggen percentages niets.
const MIN_BASIS = 10
// Een hook beoordelen we pas vanaf zoveel bezoekers.
const MIN_HOOK = 20

// Richtwaarden per stap: `goed` en `matig` als fractie van de stap ervoor.
const RICHT = {
  video: {
    goed: 0.30, matig: 0.15, goedTekst: '3 op de 10',
    tipKop: 'Laat meer mensen je video starten',
    tip: 'Zet de video bovenaan, groot, met een thumbnail met jouw gezicht en één pakkende zin erop. Een video die je pas na scrollen ziet, start bijna niemand.',
  },
  fstart: {
    goed: 0.15, matig: 0.08, goedTekst: '15 van de 100',
    tipKop: 'Laat meer mensen aan het formulier beginnen',
    tip: 'Zet de knop direct onder de video én bovenaan, en zeg op de knop wat ze krijgen ("Check of je mee kunt doen"). Sluit aan op de belofte uit de advertentie, anders voelen ze zich op de verkeerde plek.',
  },
  fklaar: {
    goed: 0.60, matig: 0.40, goedTekst: '6 op de 10',
    tipKop: 'Laat meer mensen het formulier afmaken',
    tip: 'Haal vragen weg die je niet echt nodig hebt, zet de makkelijkste vragen eerst en laat zien hoe ver ze zijn. Elke extra vraag kost mensen.',
  },
  geschikt: {
    goed: 0.60, matig: 0.40, goedTekst: '6 op de 10',
    tipKop: 'Trek de juiste mensen aan',
    tip: 'Veel invullers zijn (nog) niet geschikt. Zeg in de advertentie zelf duidelijker voor wie het is: leeftijd, doel, en dat het een betaald traject is.',
  },
  call: {
    goed: 0.50, matig: 0.30, goedTekst: 'de helft',
    tipKop: 'Zorg dat geschikte mensen ook een call plannen',
    tip: 'Laat de agenda direct na het formulier zien, en stuur geschikte mensen die niet plannen binnen een uur een appje. Daar laat je nu calls liggen.',
  },
  totaal: { goed: 0.03, matig: 0.01, goedTekst: '3 calls per 100 bezoekers' },
}

const OORDELEN = {
  goed: { id: 'goed', tekst: 'Goed', kleur: GROEN },
  matig: { id: 'matig', tekst: 'Kan beter', kleur: ORANJE },
  slecht: { id: 'slecht', tekst: 'Slecht', kleur: ROOD },
  weinig: { id: 'weinig', tekst: 'Te weinig data', kleur: GRIJS },
}

const oordeelVan = (deel, basis, richt) => {
  if (deel == null || !basis || basis < MIN_BASIS || !richt) return OORDELEN.weinig
  if (deel >= richt.goed) return OORDELEN.goed
  if (deel >= richt.matig) return OORDELEN.matig
  return OORDELEN.slecht
}

// "13 van de 100 mensen" of "2 van de 4" — bij weinig mensen geen procenten,
// want "50%" van twee mensen klinkt groter dan het is.
const zin = (st) => {
  if (st.basis >= 20) return `${Math.round(st.deel * 100)} van de 100 doen dit`
  return `${st.aantal} van de ${st.basis} doen dit`
}

const fmtTijd = (s) => {
  const n = Math.round(Number(s) || 0)
  if (n < 60) return `${n}s`
  return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`
}
const komma = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',')

// utm_content komt soms nog gecodeerd binnen ('strakker%2C+maar+uiteten'),
// soms als placeholder ('{{ad.name}}') of door Meta weggepoetst
// ('--sanitized--'). Netjes maken en samenvoegen, anders staat dezelfde
// advertentie er drie keer in.
const schoon = (naam) => {
  let v = String(naam || '')
  try { v = decodeURIComponent(v.replace(/\+/g, ' ')) } catch { v = v.replace(/\+/g, ' ') }
  v = v.trim()
  if (!v || v === '(geen)' || /^\{\{.*\}\}$/.test(v) || /sanitized/i.test(v)) return null
  return v
}

function groepeerHooks(rijen) {
  const map = new Map()
  for (const r of rijen) {
    const naam = schoon(r.hook)
    const sleutel = naam ? naam.toLowerCase() : '__onbekend'
    const g = map.get(sleutel) || {
      naam: naam || 'Onbekend (geen advertentienaam)', onbekend: !naam,
      sessies: 0, tijdSom: 0, form_klaar: 0, geschikt: 0, calls: 0,
    }
    const ses = Number(r.sessies) || 0
    g.sessies += ses
    g.tijdSom += (Number(r.tijd_gem) || 0) * ses
    g.form_klaar += Number(r.form_klaar) || 0
    g.geschikt += Number(r.geschikt) || 0
    g.calls += Number(r.calls_gepland) || 0
    map.set(sleutel, g)
  }
  return [...map.values()]
    .map(g => ({ ...g, tijd: g.sessies ? g.tijdSom / g.sessies : 0 }))
    .sort((a, b) => (a.onbekend - b.onbekend)
      || (b.calls - a.calls)
      || (b.geschikt - a.geschikt)
      || ((b.form_klaar / Math.max(1, b.sessies)) - (a.form_klaar / Math.max(1, a.sessies)))
      || (b.sessies - a.sessies))
}

// Per advertentie: levert hij calls of in elk geval formulieren op?
const hookOordeel = (h) => {
  if (h.onbekend) return { id: 'weinig', tekst: 'Niet te koppelen', kleur: GRIJS }
  if (h.calls > 0) return { id: 'goed', tekst: 'Winnaar', kleur: GROEN }
  if (h.sessies < MIN_HOOK) return OORDELEN.weinig
  const f = h.form_klaar / h.sessies
  if (f >= 0.05) return { id: 'matig', tekst: 'Belooft wat', kleur: ORANJE }
  return { id: 'slecht', tekst: 'Werkt niet', kleur: ROOD }
}

const LINK_VOORBEELD = 'https://www.myarcfitness.com/challenge?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}'

const pil = (aan) => ({
  padding: '0.45rem 0.8rem', borderRadius: 10, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  background: aan ? '#fff' : 'rgba(255,255,255,0.06)', color: aan ? '#000' : 'rgba(255,255,255,0.75)',
  border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.12)'}`,
})

function Stempel({ oordeel, klein }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
      fontSize: klein ? '0.7rem' : '0.8rem', fontWeight: 900, color: oordeel.kleur, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: klein ? 7 : 9, height: klein ? 7 : 9, borderRadius: '50%', background: oordeel.kleur }} />
      {oordeel.tekst}
    </span>
  )
}

// Eén uitklapregel: icoon, titel, een korte samenvatting rechts en een pijl.
// Dicht zie je in één oogopslag wat waar zit én hoe het ervoor staat.
function Sectie({ id, icoon, titel, samenvatting, kleur = '#fff', open, onWissel, children }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => onWissel(id)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '0.95rem 0',
        background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        <span style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {createElement(icoon, { size: 18, strokeWidth: 2.4, color: kleur })}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{titel}</span>
        {samenvatting && (
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: kleur === '#fff' ? 'rgba(255,255,255,0.5)' : kleur, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '45%' }}>{samenvatting}</span>
        )}
        <ChevronDown size={18} strokeWidth={2.6} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && <div style={{ paddingBottom: '1rem' }}>{children}</div>}
    </div>
  )
}

// ── Stripe-achtige bouwstenen ──────────────────────────────────────────────

const kaart = {
  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16, padding: '1.1rem 1.2rem', minWidth: 0,
}
const kaartKop = { fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 6 }

const dagLabel = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// Verschil met de vorige periode van dezelfde lengte. Onder de 5 in beide
// periodes zeggen procenten niets; dan tonen we het absolute verschil.
function Delta({ nu, vorig }) {
  if (vorig == null) return null
  const verschil = nu - vorig
  if (verschil === 0) return <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>gelijk</span>
  const omhoog = verschil > 0
  const tekst = vorig >= 5 ? `${Math.round(Math.abs(verschil / vorig) * 100)}%` : `${Math.abs(verschil)}`
  const kleur = omhoog ? GROEN : ROOD
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.72rem', fontWeight: 900, color: kleur, background: omhoog ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 7px', borderRadius: 999 }}>
      {omhoog ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}{tekst}
    </span>
  )
}

function Sparkline({ data, sleutel, kleur }) {
  const id = `spark-${sleutel}`
  return (
    <div style={{ height: 40, marginTop: 8 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={kleur} stopOpacity={0.35} />
              <stop offset="100%" stopColor={kleur} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={sleutel} stroke={kleur} strokeWidth={2} fill={`url(#${id})`} isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function KpiKaart({ icoon, label, waarde, vorig, data, sleutel, kleur, sub }) {
  return (
    <div style={kaart}>
      <div style={kaartKop}>{createElement(icoon, { size: 14, strokeWidth: 2.6, color: kleur })} {label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{waarde}</span>
        <Delta nu={waarde} vorig={vorig} />
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>
      <Sparkline data={data} sleutel={sleutel} kleur={kleur} />
    </div>
  )
}

// Halve-cirkel meter: waar sta je tegenover de richtwaarde?
function Meter({ waarde, goed, kleur }) {
  const max = goed * 2
  const deel = Math.max(0, Math.min(1, (waarde || 0) / max))
  const r = 70, omtrek = Math.PI * r
  return (
    <svg width="180" height="100" viewBox="0 0 180 100" style={{ display: 'block' }}>
      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" strokeLinecap="round" />
      <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke={kleur} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={omtrek} strokeDashoffset={omtrek * (1 - deel)} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      {/* Streepje op 'goed' (midden van de meter). */}
      <line x1="90" y1="12" x2="90" y2="28" stroke="rgba(255,255,255,0.6)" strokeWidth="2" />
    </svg>
  )
}

const GRAFIEK_METRIEKEN = [
  { id: 'sessies', label: 'Bezoekers', kleur: '#fff' },
  { id: 'form_klaar', label: 'Formulieren', kleur: '#60a5fa' },
  { id: 'geschikt', label: 'Geschikt', kleur: ORANJE },
  { id: 'calls', label: 'Calls', kleur: GROEN },
]

function Grafiekkaartje({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.5rem 0.65rem' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{dagLabel(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ fontSize: '0.76rem', fontWeight: 900, color: p.color }}>{p.value} {p.name.toLowerCase()}</div>
      ))}
    </div>
  )
}

export default function ChallengeAdsDashboard({ db, isMobile }) {
  const m = isMobile
  // Gekozen periode onthouden, ook 'vanaf' (Kersten, 12 okt 2026).
  const [periode, setPeriodeState] = useState(() => {
    try {
      const p = localStorage.getItem('arc_ads_periode')
      if (p === 'vanaf') return localStorage.getItem('arc_ads_vanaf') ? 'vanaf' : '14'
      return PERIODES.some(x => x.id === p) ? p : '14'
    } catch { return '14' }
  })
  const setPeriode = (p) => {
    setPeriodeState(p)
    try { localStorage.setItem('arc_ads_periode', p) } catch { /* geen opslag */ }
  }
  // Eigen startdatum ('vanaf'): bijv. de dag dat een nieuwe campagne live ging.
  const [vanafDatum, setVanafDatum] = useState(() => {
    try { return localStorage.getItem('arc_ads_vanaf') || '' } catch { return '' }
  })
  const kiesVanaf = (iso) => {
    setVanafDatum(iso)
    try { if (iso) localStorage.setItem('arc_ads_vanaf', iso); else localStorage.removeItem('arc_ads_vanaf') } catch { /* geen opslag */ }
    setPeriode(iso ? 'vanaf' : '14')
  }
  const [rijen, setRijen] = useState([])
  const [vorigeRijen, setVorigeRijen] = useState(null)
  const [perDag, setPerDag] = useState([])
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [gekopieerd, setGekopieerd] = useState(false)
  const [metriek, setMetriek] = useState('sessies')
  const [open, setOpen] = useState(() => {
    try { return JSON.parse(localStorage.getItem('arc_ads_open2') || '[]') } catch { return [] }
  })
  const wissel = (id) => setOpen(prev => {
    const nieuw = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    try { localStorage.setItem('arc_ads_open2', JSON.stringify(nieuw)) } catch { /* geen opslag */ }
    return nieuw
  })

  const laad = async () => {
    setLaden(true); setFout('')
    try {
      const dagen = PERIODES.find(p => p.id === periode)?.dagen || 14
      const tot = new Date(); tot.setHours(23, 59, 59, 999)
      const totEx = new Date(tot.getTime() + 1)
      const van = (periode === 'vanaf' && vanafDatum)
        ? new Date(`${vanafDatum}T00:00:00`)
        : (() => { const d = new Date(); d.setDate(d.getDate() - dagen + 1); d.setHours(0, 0, 0, 0); return d })()
      // Vorige periode: even lang, direct ervoor.
      const vorigVan = new Date(van.getTime() - (totEx.getTime() - van.getTime()))
      const [nu, vorig, dag] = await Promise.all([
        db.supabase.rpc('get_challenge_ad_stats', { p_van: van.toISOString(), p_tot: totEx.toISOString() }),
        db.supabase.rpc('get_challenge_ad_stats', { p_van: vorigVan.toISOString(), p_tot: van.toISOString() }),
        db.supabase.rpc('get_challenge_ad_daily', { p_van: van.toISOString(), p_tot: totEx.toISOString() }),
      ])
      if (nu.error) throw nu.error
      setRijen(nu.data || [])
      setVorigeRijen(vorig.error ? null : (vorig.data || []))
      setPerDag((dag.data || []).map(d => ({ ...d, dag: String(d.dag).slice(0, 10) })))
    } catch (e) {
      console.error('ads-stats laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally { setLaden(false) }
  }
  useEffect(() => { laad() }, [periode, vanafDatum]) // eslint-disable-line react-hooks/exhaustive-deps

  const somVan = (lijst, k) => (lijst || []).reduce((s, r) => s + (Number(r[k]) || 0), 0)
  const totaal = {
    sessies: somVan(rijen, 'sessies'),
    video_start: somVan(rijen, 'video_start'),
    form_start: somVan(rijen, 'form_start'), form_klaar: somVan(rijen, 'form_klaar'),
    geschikt: somVan(rijen, 'geschikt'), calls: somVan(rijen, 'calls_gepland'),
  }
  const vorig = vorigeRijen ? {
    sessies: somVan(vorigeRijen, 'sessies'), form_klaar: somVan(vorigeRijen, 'form_klaar'),
    geschikt: somVan(vorigeRijen, 'geschikt'), calls: somVan(vorigeRijen, 'calls_gepland'),
  } : {}

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(LINK_VOORBEELD); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000) } catch { /* leeg */ }
  }

  // ── De trechter: elke stap tegen de stap waar hij uit komt ──
  const ruweStappen = [
    { id: 'mensen', label: 'Op je pagina', icoon: MousePointerClick, aantal: totaal.sessies },
    { id: 'video', label: 'Video gestart', icoon: Play, aantal: totaal.video_start, van: 'mensen', ...RICHT.video },
    { id: 'fstart', label: 'Formulier begonnen', icoon: PenLine, aantal: totaal.form_start, van: 'mensen', ...RICHT.fstart },
    { id: 'fklaar', label: 'Formulier af', icoon: ClipboardCheck, aantal: totaal.form_klaar, van: 'fstart', ...RICHT.fklaar },
    { id: 'geschikt', label: 'Geschikt', icoon: UserCheck, aantal: totaal.geschikt, van: 'fklaar', ...RICHT.geschikt },
    { id: 'call', label: 'Call gepland', icoon: CalendarCheck, aantal: totaal.calls, van: 'geschikt', ...RICHT.call },
  ]
  const stappen = ruweStappen.map(st => {
    const basis = st.van ? ruweStappen.find(x => x.id === st.van).aantal : null
    const deel = basis ? st.aantal / basis : null
    return { ...st, basis, deel, oordeel: oordeelVan(deel, basis, st) }
  })
  const perHonderd = totaal.sessies > 0 ? (totaal.calls / totaal.sessies) * 100 : null
  const totaalOordeel = oordeelVan(perHonderd != null ? perHonderd / 100 : null, totaal.sessies, RICHT.totaal)
  const meterKleur = totaalOordeel.kleur === GRIJS ? '#fff' : totaalOordeel.kleur

  const verbeterpunten = stappen
    .filter(st => st.tip && st.oordeel.id !== 'weinig' && st.oordeel.id !== 'goed')
    .sort((x, y) => (x.deel / x.goed) - (y.deel / y.goed))
    .slice(0, 3)

  const hooks = groepeerHooks(rijen)
  const echteHooks = hooks.filter(h => !h.onbekend)
  const maxHook = Math.max(1, ...hooks.map(h => h.sessies))
  const actieveMetriek = GRAFIEK_METRIEKEN.find(x => x.id === metriek) || GRAFIEK_METRIEKEN[0]

  const kolommen = [
    { k: 'hook', label: 'Hook (utm_content)', links: true },
    { k: 'campagne', label: 'Campagne', links: true },
    { k: 'sessies', label: 'Bezoekers' },
    { k: 'tijd_gem', label: 'Tijd', f: fmtTijd },
    { k: 'video_start', label: 'Video' },
    { k: 'form_start', label: 'Form begonnen' },
    { k: 'form_klaar', label: 'Form af' },
    { k: 'geschikt', label: 'Geschikt' },
    { k: 'ongeschikt_tot', label: 'Ongeschikt', f: (v, r) => (Number(r.nog_niet) || 0) + (Number(r.ongeschikt) || 0) },
    { k: 'calls_gepland', label: 'Calls' },
  ]

  const twee = m ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)'

  return (
    <div style={{ padding: m ? '1rem' : '1.5rem 2rem', color: '#fff', maxWidth: 1180, margin: '0 auto' }}>
      {/* ═══ KOP ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: m ? '1.2rem' : '1.45rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Ads · 6 Weken Challenge</div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            Vanaf de klik op de advertentie · vergeleken met de periode ervoor
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {PERIODES.map(p => (
            <button key={p.id} onClick={() => setPeriode(p.id)} style={pil(periode === p.id)}>{p.label}</button>
          ))}
          <label title="Vanaf een datum" style={{ ...pil(periode === 'vanaf'), position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CalendarDays size={14} strokeWidth={2.6} />
            {vanafDatum ? `Vanaf ${dagLabel(vanafDatum)}` : 'Vanaf…'}
            <input
              type="date"
              value={vanafDatum}
              max={new Date().toLocaleDateString('sv-SE')}
              onChange={e => kiesVanaf(e.target.value)}
              onClick={e => { if (vanafDatum && periode !== 'vanaf') { e.preventDefault(); setPeriode('vanaf') } else { try { e.currentTarget.showPicker?.() } catch { /* oudere browser */ } } }}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
          </label>
          <button onClick={laad} aria-label="Verversen" style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ animation: laden ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {fout && <div style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>{fout}</div>}

      {/* ═══ RIJ 1: rapport + grafiek ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : 'minmax(0, 340px) minmax(0, 1fr)', gap: 12, marginBottom: 12 }}>
        <div style={{ ...kaart, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ ...kaartKop, alignSelf: 'flex-start' }}><Gauge size={14} strokeWidth={2.6} /> Rapportcijfer</div>
          <div style={{ position: 'relative', marginTop: 10 }}>
            <Meter waarde={perHonderd} goed={RICHT.totaal.goed * 100} kleur={meterKleur} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 4, textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: meterKleur }}>{perHonderd != null ? komma(perHonderd) : '–'}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, marginTop: 6 }}>calls per 100 bezoekers</div>
          <div style={{ marginTop: 6 }}><Stempel oordeel={totaalOordeel} /></div>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 10, lineHeight: 1.5 }}>
            {totaal.sessies > 0
              ? <>Van de <b style={{ color: '#fff' }}>{totaal.sessies}</b> klikkers {totaal.calls === 1 ? 'plande' : 'planden'} er <b style={{ color: '#fff' }}>{totaal.calls}</b> een call. Goed is {RICHT.totaal.goedTekst} (streepje).</>
              : (laden ? 'Laden…' : 'Nog geen bezoekers in deze periode.')}
          </div>
        </div>

        <div style={kaart}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={kaartKop}><Activity size={14} strokeWidth={2.6} /> Per dag</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {GRAFIEK_METRIEKEN.map(x => (
                <button key={x.id} onClick={() => setMetriek(x.id)} style={{
                  padding: '0.3rem 0.6rem', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  background: metriek === x.id ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none',
                  color: metriek === x.id ? '#fff' : 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: x.kleur }} />{x.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em' }}>{somVan(perDag, metriek)}</span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{actieveMetriek.label.toLowerCase()} in deze periode</span>
          </div>
          <div style={{ height: m ? 170 : 210, marginTop: 6 }}>
            <ResponsiveContainer>
              <AreaChart data={perDag} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="ads-hoofd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={actieveMetriek.kleur} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={actieveMetriek.kleur} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="dag" tickFormatter={dagLabel} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)', fontWeight: 800 }} axisLine={false} tickLine={false} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)', fontWeight: 800 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<Grafiekkaartje />} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
                <Area type="monotone" dataKey={metriek} name={actieveMetriek.label} stroke={actieveMetriek.kleur} strokeWidth={2.4} fill="url(#ads-hoofd)" isAnimationActive={false}
                  dot={perDag.length <= 14 ? { r: 3, fill: actieveMetriek.kleur, strokeWidth: 0 } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ RIJ 2: KPI's met sparkline en verschil ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 12 }}>
        <KpiKaart icoon={MousePointerClick} label="Bezoekers" waarde={totaal.sessies} vorig={vorig.sessies} data={perDag} sleutel="sessies" kleur="#fff" sub="klikten op je advertentie" />
        <KpiKaart icoon={ClipboardCheck} label="Formulier af" waarde={totaal.form_klaar} vorig={vorig.form_klaar} data={perDag} sleutel="form_klaar" kleur="#60a5fa" sub={`${totaal.form_start} begonnen eraan`} />
        <KpiKaart icoon={UserCheck} label="Geschikt" waarde={totaal.geschikt} vorig={vorig.geschikt} data={perDag} sleutel="geschikt" kleur={ORANJE} sub="passen bij de challenge" />
        <KpiKaart icoon={CalendarCheck} label="Calls gepland" waarde={totaal.calls} vorig={vorig.calls} data={perDag} sleutel="calls" kleur={GROEN} sub="in je agenda" />
      </div>

      {/* ═══ RIJ 3: trechter + verbeterpunten ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: twee, gap: 12, marginBottom: 12 }}>
        <div style={kaart}>
          <div style={kaartKop}><Filter size={14} strokeWidth={2.6} /> Waar haken mensen af?</div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stappen.map(st => {
              const breedte = totaal.sessies > 0 ? Math.max(2, (st.aantal / totaal.sessies) * 100) : 0
              const kleur = st.basis != null ? st.oordeel.kleur : '#fff'
              return (
                <div key={st.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {createElement(st.icoon, { size: 14, strokeWidth: 2.6, color: 'rgba(255,255,255,0.6)' })}
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, flex: 1, minWidth: 0 }}>{st.label}</span>
                    {st.basis != null && st.basis > 0 && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: kleur, whiteSpace: 'nowrap' }} title={`goed is ${st.goedTekst}`}>
                        {st.basis >= 20 ? `${Math.round(st.deel * 100)}%` : `${st.aantal}/${st.basis}`} door
                      </span>
                    )}
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, minWidth: 34, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{st.aantal}</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginTop: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${breedte}%`, height: '100%', borderRadius: 6, background: kleur, opacity: st.basis != null ? 0.9 : 0.75, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>
            {[OORDELEN.goed, OORDELEN.matig, OORDELEN.slecht, OORDELEN.weinig].map(o => <Stempel key={o.id} oordeel={o} klein />)}
          </div>
        </div>

        <div style={kaart}>
          <div style={kaartKop}><Lightbulb size={14} strokeWidth={2.6} color={ORANJE} /> Wat kun je verbeteren?</div>
          {verbeterpunten.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
              <Sparkles size={18} color={GROEN} /> {totaal.sessies >= MIN_BASIS ? 'Elke stap zit op of boven de richtwaarde.' : 'Nog te weinig bezoekers voor een advies.'}
            </div>
          ) : (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {verbeterpunten.map((st, i) => (
                <div key={st.id} style={{ display: 'flex', gap: 12 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${st.oordeel.kleur}22` }}>
                    {createElement(st.icoon, { size: 15, strokeWidth: 2.6, color: st.oordeel.kleur })}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.86rem', fontWeight: 900 }}>{i + 1}. {st.tipKop}</div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 2 }}>
                      Nu {zin(st)}, goed is {st.goedTekst}. {st.tip}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIJ 4: advertenties ═══ */}
      <div style={{ ...kaart, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={kaartKop}><Megaphone size={14} strokeWidth={2.6} /> Welke advertentie werkt?</div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{echteHooks.length} advertenties · oordeel vanaf {MIN_HOOK} bezoekers</span>
        </div>
        {!m && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 70px 70px 70px 64px', gap: 10, marginTop: 12, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>Advertentie</span><span style={{ textAlign: 'right' }}>Tijd</span><span style={{ textAlign: 'right' }}>Formulier</span><span style={{ textAlign: 'right' }}>Geschikt</span><span style={{ textAlign: 'right' }}>Calls</span>
          </div>
        )}
        {!laden && hooks.length === 0 && (
          <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Nog geen bezoeken in deze periode.</div>
        )}
        {hooks.map((h, i) => {
          const o = hookOordeel(h)
          return (
            <div key={h.naam} style={{
              display: 'grid', gridTemplateColumns: m ? 'minmax(0, 1fr) 48px 48px' : 'minmax(0, 1fr) 70px 70px 70px 64px',
              gap: 10, alignItems: 'center', padding: '0.7rem 0',
              borderBottom: i < hooks.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', opacity: h.onbekend ? 0.5 : 1,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.kleur, flexShrink: 0 }} title={o.tekst} />
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.naam}</span>
                  <span style={{ fontSize: '0.66rem', fontWeight: 900, color: o.kleur, whiteSpace: 'nowrap' }}>{o.tekst}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, marginLeft: 16 }}>
                  <div style={{ flex: 1, maxWidth: 260, height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: `${(h.sessies / maxHook) * 100}%`, height: '100%', background: 'rgba(255,255,255,0.45)', borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>{h.sessies} bezoekers</span>
                </div>
              </div>
              {!m && <span style={{ textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>{fmtTijd(h.tijd)}</span>}
              <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{h.form_klaar}</span>
              {!m && <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{h.geschikt}</span>}
              <span style={{ textAlign: 'right', fontSize: '1rem', fontWeight: 900, color: h.calls > 0 ? GROEN : 'rgba(255,255,255,0.5)' }}>{h.calls}</span>
            </div>
          )
        })}
      </div>

      {/* ═══ ONDERAAN: details en link, dicht ═══ */}
      <Sectie id="tabel" icoon={Table2} titel="Alle cijfers per regel" open={open.includes('tabel')} onWissel={wissel}
        samenvatting={`${rijen.length} regels`}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: m ? '0.76rem' : '0.82rem', minWidth: 760 }}>
            <thead>
              <tr>
                {kolommen.map(c => (
                  <th key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.5rem 0.6rem', fontSize: '0.64rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rijen.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {kolommen.map(c => {
                    const ruw = c.f ? c.f(r[c.k], r) : r[c.k]
                    return (
                      <td key={c.k} style={{ textAlign: c.links ? 'left' : 'right', padding: '0.5rem 0.6rem', fontWeight: c.links ? 800 : 700, color: c.links ? '#fff' : 'rgba(255,255,255,0.8)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', maxWidth: c.links ? 220 : undefined, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ruw ?? '–'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sectie>

      <Sectie id="link" icoon={Link2} titel="Link voor in de advertentie" open={open.includes('link')} onWissel={wissel} samenvatting="kopiëren">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <code style={{ flex: 1, fontSize: '0.74rem', color: 'rgba(255,255,255,0.8)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{LINK_VOORBEELD}</code>
          <button onClick={kopieer} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.7rem', borderRadius: 10, background: gekopieerd ? 'rgba(16,185,129,0.15)' : '#fff', color: gekopieerd ? GROEN : '#000', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            {gekopieerd ? <Check size={14} /> : <Copy size={14} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.45 }}>
          Meta vult {'{{campaign.name}}'} en {'{{ad.name}}'} zelf in. Geef elke hook een eigen advertentienaam, dan staat hij hier als aparte regel.
        </div>
      </Sectie>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
