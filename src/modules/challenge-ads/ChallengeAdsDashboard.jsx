// src/modules/challenge-ads/ChallengeAdsDashboard.jsx
//
// Coachscherm "Ads": wat de Meta-advertenties voor de 6 Weken Challenge
// opleveren, van klik tot sale. Opnieuw opgezet 22 okt 2026 (Kersten: "wat
// is belangrijk om te zien en wat is ruis"):
//   1. Rendement: uitgegeven, kosten per lead, omzet, ROAS.
//   2. De trechter: bezoekers → video → formulier → gegevens → call → sale.
//      Elke stap opent een venster met de diepere cijfers.
//   3. Per advertentie: spend naast leads, calls en sales.
//
// Bron: get_challenge_ads_overzicht (één RPC). Pagina-events uit
// challenge_events, leads uit call_leads met hun weg over het bord
// (lead_movements: call gepland, gehouden, sale met order_value) en de
// Meta-spend per advertentie per dag uit meta_ad_insights (cron
// meta-ad-insights, elk uur, sync_meta_ad_insights). De advertentienaam in
// Meta is gelijk aan utm_content op de pagina; zo hoort spend bij een hook.
//
// Weggehaald als ruis: rapportcijfer-meter, KPI-rij met sparklines,
// algemene tips en de ruwe tabel per regel.
//
// Doel (Kersten, 22 okt 2026): ROAS 3 of hoger, €1 in en €3 uit. Testen
// waar het vastloopt, dat verbeteren, herhalen. Daarom staat de trechter in
// vijf fases (FASES): advertentie, funnel, follow-up, call, close. Elke
// meting heeft een richtwaarde; de eerste fase die eronder zit is waar het
// vastloopt. De lead-fases tellen met dezelfde woorden als de statistiekbalk
// van het leadsysteem, maar alleen voor leads uit de advertenties.

import { useEffect, useState } from 'react'
import {
  RefreshCw, Copy, Check, ChevronDown, ChevronRight, X, Link2,
  Megaphone, Info,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PrequalAfhaken from './PrequalAfhaken'
import PrequalAfgewezen from './PrequalAfgewezen'

const PERIODES = [
  { id: '7', label: 'Laatste 7 dagen', dagen: 7 },
  { id: '14', label: 'Laatste 14 dagen', dagen: 14 },
  { id: '30', label: 'Laatste 30 dagen', dagen: 30 },
  { id: '90', label: 'Laatste 90 dagen', dagen: 90 },
  { id: 'vanaf', label: 'Vanaf datum…' },
]

const GROEN = '#10b981'
const ORANJE = '#f59e0b'
const ROOD = '#ef4444'
const ZWAK = 'rgba(255,255,255,0.6)'
const LIJN = '1px solid rgba(255,255,255,0.08)'

const DOEL_ROAS = 3

// Richtwaarden per meting: vuistregels voor koud Meta-verkeer naar een
// coachingaanbod, geen wet. `laag` = lager is beter (kosten per klik).
// `min` = onder zoveel mensen in de basis zegt het percentage nog niets.
const RICHT = {
  ctr: { goed: 0.01, matig: 0.006, min: 1000 },
  cpc: { goed: 0.6, matig: 1.0, laag: true, min: 20 },
  video: { goed: 0.3, matig: 0.15, min: 20 },
  knop: { goed: 0.2, matig: 0.1, min: 20 },
  fstart: { goed: 0.15, matig: 0.08, min: 20 },
  leads: { goed: 0.5, matig: 0.3, min: 10 },
  bericht: { goed: 0.9, matig: 0.7, min: 3 },
  contact: { goed: 0.6, matig: 0.4, min: 3 },
  voorgesteld: { goed: 0.6, matig: 0.4, min: 3 },
  ingepland: { goed: 0.7, matig: 0.5, min: 3 },
  show: { goed: 0.75, matig: 0.6, min: 3 },
  close: { goed: 0.3, matig: 0.15, min: 3 },
}
const OORDEEL = {
  goed: { id: 'goed', tekst: 'Goed', kleur: GROEN, rang: 0 },
  matig: { id: 'matig', tekst: 'Kan beter', kleur: ORANJE, rang: 1 },
  slecht: { id: 'slecht', tekst: 'Loopt vast', kleur: ROOD, rang: 2 },
  weinig: { id: 'weinig', tekst: 'Te weinig data', kleur: 'rgba(255,255,255,0.45)', rang: -1 },
}
const beoordeel = (waarde, basis, r) => {
  if (!r || waarde == null || !isFinite(waarde) || !(basis >= r.min)) return OORDEEL.weinig
  if (r.laag) return waarde <= r.goed ? OORDEEL.goed : waarde <= r.matig ? OORDEEL.matig : OORDEEL.slecht
  return waarde >= r.goed ? OORDEEL.goed : waarde >= r.matig ? OORDEEL.matig : OORDEEL.slecht
}
const procent = (x, dec = 0) => `${(x * 100).toFixed(dec).replace('.', ',')}%`

const LINK_VOORBEELD = 'https://www.myarcfitness.com/challenge?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}'

const euro = (n, dec = false) => {
  if (n == null || !isFinite(n)) return '–'
  return '€' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: dec ? 2 : 0 })
}
const pct = (deel, basis) => (basis > 0 ? `${Math.round((deel / basis) * 100)}%` : '–')
const fmtTijd = (s) => {
  const n = Math.round(Number(s) || 0)
  if (n < 60) return `${n}s`
  return `${Math.floor(n / 60)}m ${String(n % 60).padStart(2, '0')}s`
}
const dagLabel = (iso) => new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// utm_content komt soms gecodeerd binnen ('strakker%2C+maar+uiteten'), soms
// als placeholder ('{{ad.name}}') of door Meta weggepoetst ('--sanitized--').
const schoon = (naam) => {
  let v = String(naam || '')
  try { v = decodeURIComponent(v.replace(/\+/g, ' ')) } catch { v = v.replace(/\+/g, ' ') }
  v = v.trim()
  if (!v || v === '(geen)' || /^\{\{.*\}\}$/.test(v) || /sanitized/i.test(v)) return null
  return v
}
const sleutelVan = (hook) => (schoon(hook) || '').toLowerCase() || '__onbekend'

const VELDEN = ['sessies', 'geopend', 'mobiel', 'blijft_30s', 'video_start', 'video_25', 'video_50', 'video_75', 'video_100',
  'knop', 'form_start', 'form_klaar', 'geschikt', 'afgewezen', 'geschikt_video_start', 'geschikt_video_klaar']
function telOp(hooks) {
  const t = Object.fromEntries(VELDEN.map(k => [k, 0]))
  let tijdSom = 0
  for (const h of hooks) {
    for (const k of VELDEN) t[k] += Number(h[k]) || 0
    tijdSom += (Number(h.tijd_gem) || 0) * (Number(h.sessies) || 0)
  }
  t.tijd = t.sessies ? tijdSom / t.sessies : 0
  return t
}

// Per advertentie: pagina-cijfers, leads en spend bij elkaar op advertentienaam.
function perAdvertentie(hooks, leads, spend) {
  const map = new Map()
  const rij = (hook) => {
    const k = sleutelVan(hook)
    if (!map.has(k)) map.set(k, { sleutel: k, naam: schoon(hook) || 'Naam niet doorgekomen', onbekend: k === '__onbekend', hooks: [], leads: [], spend: 0, klikken: 0, impressies: 0 })
    return map.get(k)
  }
  hooks.forEach(h => rij(h.hook).hooks.push(h))
  leads.forEach(l => rij(l.hook).leads.push(l))
  spend.forEach(s => { const r = rij(s.hook); r.spend += Number(s.spend) || 0; r.klikken += Number(s.klikken) || 0; r.impressies += Number(s.impressies) || 0 })
  return [...map.values()].map(r => {
    const t = telOp(r.hooks)
    const sales = r.leads.filter(l => Number(l.omzet) > 0)
    return {
      ...r, t,
      calls: r.leads.filter(l => l.call).length,
      sales: sales.length,
      omzet: sales.reduce((s, l) => s + Number(l.omzet), 0),
    }
  }).sort((a, b) => (a.onbekend - b.onbekend) || (b.spend - a.spend) || (b.t.sessies - a.t.sessies))
}

// ── Bouwstenen ─────────────────────────────────────────────────────────────

const kop = { fontSize: '0.8rem', fontWeight: 800, color: ZWAK, marginBottom: 10 }
const keuze = {
  minHeight: 36, padding: '0 0.7rem', borderRadius: 10, background: '#111', color: '#fff',
  border: '1px solid rgba(255,255,255,0.14)', fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer',
}

function Getal({ label, waarde, sub, kleur = '#fff', onClick }) {
  return (
    <button onClick={onClick} style={{
      minWidth: 0, textAlign: 'left', background: 'none', border: 'none', padding: 0, color: '#fff',
      fontFamily: 'inherit', cursor: onClick ? 'pointer' : 'default', WebkitTapHighlightColor: 'transparent',
    }}>
      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: ZWAK, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}{onClick && <Info size={12} strokeWidth={2.6} style={{ opacity: 0.6 }} />}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, marginTop: 4, color: kleur, fontVariantNumeric: 'tabular-nums' }}>{waarde}</div>
      {sub && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 3 }}>{sub}</div>}
    </button>
  )
}

function Regel({ label, waarde, sterk }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, padding: '0.55rem 0', borderBottom: LIJN }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 700, color: sterk ? '#fff' : 'rgba(255,255,255,0.75)' }}>{label}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{waarde}</span>
    </div>
  )
}

function Balk({ label, aantal, basis, kleur = '#fff', tekst }) {
  const breedte = basis > 0 ? Math.max(2, (aantal / basis) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: 800 }}>{label}</span>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: ZWAK }}>{tekst ?? pct(aantal, basis)}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 900, minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{aantal}</span>
      </div>
      <div style={{ height: 8, borderRadius: 5, background: 'rgba(255,255,255,0.06)', marginTop: 5, overflow: 'hidden' }}>
        <div style={{ width: `${breedte}%`, height: '100%', borderRadius: 5, background: kleur, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

function Grafiek({ data, sleutel, kleur = '#fff', label, euroAs }) {
  const id = `ads-${sleutel}`
  return (
    <div style={{ height: 170, margin: '4px 0 14px' }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={kleur} stopOpacity={0.3} />
              <stop offset="100%" stopColor={kleur} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="dag" tickFormatter={dagLabel} tick={{ fontSize: 10, fill: ZWAK, fontWeight: 800 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis allowDecimals={!!euroAs} tick={{ fontSize: 10, fill: ZWAK, fontWeight: 800 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ stroke: 'rgba(255,255,255,0.2)' }}
            content={({ active, payload, label: dag }) => (active && payload?.length ? (
              <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '0.45rem 0.6rem', fontSize: '0.76rem', fontWeight: 900 }}>
                <div style={{ color: ZWAK, fontSize: '0.7rem' }}>{dagLabel(dag)}</div>
                {euroAs ? euro(payload[0].value, true) : payload[0].value} {label}
              </div>
            ) : null)}
          />
          <Area type="monotone" dataKey={sleutel} stroke={kleur} strokeWidth={2.4} fill={`url(#${id})`} isAnimationActive={false}
            dot={data.length <= 14 ? { r: 3, fill: kleur, strokeWidth: 0 } : false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Venster: op mobiel een blad van onderen, op desktop gecentreerd.
function Venster({ titel, sub, m, onClose, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    const oud = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = oud }
  }, [onClose])
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.78)',
      display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center', padding: m ? 0 : '2rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 640, maxHeight: m ? '90dvh' : '86vh', overflowY: 'auto', overscrollBehavior: 'contain',
        background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: m ? '20px 20px 0 0' : 18,
        padding: m ? '1.1rem 1.1rem calc(1.5rem + env(safe-area-inset-bottom))' : '1.4rem 1.6rem 1.6rem', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{titel}</div>
            {sub && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK, marginTop: 2 }}>{sub}</div>}
          </div>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} strokeWidth={2.6} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// Eén lead met waar hij nu staat.
function LeadRegel({ l }) {
  const status = Number(l.omzet) > 0 ? { tekst: `Sale ${euro(l.omzet)}`, kleur: GROEN }
    : l.verloren ? { tekst: 'Sale verloren', kleur: ROOD }
      : l.gehouden ? { tekst: 'Call gehad', kleur: '#fff' }
        : l.noshow ? { tekst: 'No-show', kleur: ROOD }
          : l.afgezegd ? { tekst: 'Call afgezegd', kleur: ORANJE }
            : l.nog_gepland ? { tekst: `Call ${dagLabel(l.call_datum)}`, kleur: '#60a5fa' }
              : l.afgewezen ? { tekst: 'Call afgewezen', kleur: ROOD }
                : l.call ? { tekst: 'Call ingepland', kleur: '#60a5fa' }
                  : l.voorgesteld ? { tekst: 'Call voorgesteld', kleur: '#60a5fa' }
                    : l.contact ? { tekst: 'In gesprek', kleur: '#fff' }
                      : l.bericht ? { tekst: 'Bericht gestuurd', kleur: ORANJE }
                        : { tekst: 'Nog geen bericht', kleur: ORANJE }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0', borderBottom: LIJN }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>{l.naam || 'Onbekend'}</div>
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {dagLabel(l.created_at)} · {schoon(l.hook) || 'onbekende advertentie'}{l.sectie ? ` · ${l.sectie.trim()}` : ''}
        </div>
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 900, color: status.kleur, whiteSpace: 'nowrap' }}>{status.tekst}</span>
    </div>
  )
}

function Leeg({ children }) {
  return <div style={{ fontSize: '0.86rem', fontWeight: 700, color: ZWAK, padding: '0.6rem 0' }}>{children}</div>
}

// ── Scherm ─────────────────────────────────────────────────────────────────

export default function ChallengeAdsDashboard({ db, isMobile }) {
  const m = isMobile
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
  const [vanafDatum, setVanafDatum] = useState(() => {
    try { return localStorage.getItem('arc_ads_vanaf') || '' } catch { return '' }
  })
  const kiesVanaf = (iso) => {
    setVanafDatum(iso)
    try { if (iso) localStorage.setItem('arc_ads_vanaf', iso); else localStorage.removeItem('arc_ads_vanaf') } catch { /* geen opslag */ }
  }
  // Alleen advertentieverkeer, of ook Instagram-bio en direct (o.a. je eigen bezoeken).
  const [bron, setBronState] = useState(() => {
    try { return localStorage.getItem('arc_ads_bron') === 'alles' ? 'alles' : 'ads' } catch { return 'ads' }
  })
  const setBron = (b) => { setBronState(b); try { localStorage.setItem('arc_ads_bron', b) } catch { /* geen opslag */ } }

  const [data, setData] = useState(null)
  const [venster, setVenster] = useState(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [info, setInfo] = useState(null)        // id van het open venster
  const [advertentie, setAdvertentie] = useState(null)
  const [linkOpen, setLinkOpen] = useState(false)
  // Fases staan dicht: eerst alleen het oordeel per fase, details op een tik.
  const [openFase, setOpenFase] = useState(null)
  const [gekopieerd, setGekopieerd] = useState(false)

  const laad = async () => {
    if (periode === 'vanaf' && !vanafDatum) return
    setLaden(true); setFout('')
    try {
      const dagen = PERIODES.find(p => p.id === periode)?.dagen || 14
      const tot = new Date(); tot.setHours(23, 59, 59, 999)
      const totEx = new Date(tot.getTime() + 1)
      const van = (periode === 'vanaf' && vanafDatum)
        ? new Date(`${vanafDatum}T00:00:00`)
        : (() => { const d = new Date(); d.setDate(d.getDate() - dagen + 1); d.setHours(0, 0, 0, 0); return d })()
      const { data: res, error } = await db.supabase.rpc('get_challenge_ads_overzicht', { p_van: van.toISOString(), p_tot: totEx.toISOString() })
      if (error) throw error
      setData(res || {})
      setVenster({ van: van.toISOString(), tot: totEx.toISOString() })
    } catch (e) {
      console.error('ads-overzicht laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally { setLaden(false) }
  }
  useEffect(() => { laad() }, [periode, vanafDatum]) // eslint-disable-line react-hooks/exhaustive-deps

  const alleenAds = bron === 'ads'
  const hooks = (data?.hooks || []).filter(h => !alleenAds || h.ad)
  const leads = (data?.leads || []).filter(l => !alleenAds || l.ad)
  const spendRijen = data?.spend || []
  const dagen = (data?.dagen || []).map(d => ({
    dag: String(d.dag).slice(0, 10),
    sessies: alleenAds ? d.sessies_ad : d.sessies,
    leads: alleenAds ? d.leads_ad : d.leads,
    spend: Number(d.spend) || 0,
  }))

  const T = telOp(hooks)
  const spend = spendRijen.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const klikken = spendRijen.reduce((s, r) => s + (Number(r.klikken) || 0), 0)
  const impressies = spendRijen.reduce((s, r) => s + (Number(r.impressies) || 0), 0)
  const geladen = spendRijen.reduce((s, r) => s + (Number(r.geladen) || 0), 0)
  const ruis = data?.ruis || {}
  const calls = leads.filter(l => l.call)
  const gehouden = leads.filter(l => l.gehouden)
  const sales = leads.filter(l => Number(l.omzet) > 0)
  const omzet = sales.reduce((s, l) => s + Number(l.omzet), 0)
  const cpl = leads.length ? spend / leads.length : null
  const roas = spend > 0 ? omzet / spend : null
  const advertenties = perAdvertentie((data?.hooks || []).filter(h => h.ad), (data?.leads || []).filter(l => l.ad), spendRijen)

  // Lead-fases (cohort: leads uit deze periode, met alles wat daarna gebeurde).
  const metBericht = leads.filter(l => l.bericht)
  const inGesprek = leads.filter(l => l.contact)
  const voorgesteld = leads.filter(l => l.voorgesteld)
  const noshows = leads.filter(l => l.noshow)
  const afgezegd = leads.filter(l => l.afgezegd)
  const nogGepland = leads.filter(l => l.nog_gepland)
  const afgewezen = leads.filter(l => l.afgewezen)
  const verloren = leads.filter(l => l.verloren)
  const afgerond = gehouden.length + noshows.length   // calls waarvan de uitkomst bekend is
  const ctr = impressies ? klikken / impressies : null
  const cpc = klikken ? spend / klikken : null

  const M = (label, waarde, basis, richt, tekst, venster, sub) => {
    const deel = richt?.laag ? waarde : (basis ? waarde / basis : null)
    return { label, tekst, sub, venster, oordeel: richt ? beoordeel(deel, richt.laag ? klikken : basis, richt) : null }
  }
  const FASES = [
    { id: 'advertentie', naam: 'Advertentie', vraag: 'Klikken mensen, en goedkoop?', metingen: [
      M('Klikratio (CTR)', klikken, impressies, RICHT.ctr, ctr != null ? procent(ctr, 1) : '–', 'spend', `goed is 1% of meer · ${klikken} klikken`),
      M('Kosten per klik', cpc, null, RICHT.cpc, cpc != null ? euro(cpc, true) : '–', 'spend', 'goed is onder €0,60'),
    ] },
    { id: 'funnel', naam: 'Funnel', vraag: 'Laten bezoekers hun gegevens achter?', metingen: [
      M('Bezoekers', T.sessies, null, null, String(T.sessies), 'bezoekers', `gem. ${fmtTijd(T.tijd)} op de pagina`),
      M('Video gestart', T.video_start, T.sessies, RICHT.video, `${T.video_start} · ${pct(T.video_start, T.sessies)}`, 'video', `${pct(T.video_100, T.video_start)} kijkt hem helemaal`),
      M('Op de knop geklikt', T.knop, T.sessies, RICHT.knop, `${T.knop} · ${pct(T.knop, T.sessies)}`, 'formulier', 'van de bezoekers'),
      M('Formulier gestart', T.form_start, T.sessies, RICHT.fstart, `${T.form_start} · ${pct(T.form_start, T.sessies)}`, 'formulier', 'van de bezoekers'),
      M('Leads binnen', leads.length, T.form_start, RICHT.leads, `${leads.length} · ${pct(leads.length, T.form_start)}`, 'gegevens', `van wie begon · ${T.afgewezen} niet geschikt`),
    ] },
    { id: 'followup', naam: 'Follow-up', vraag: 'Komen we in contact?', metingen: [
      M('Bericht gestuurd', metBericht.length, leads.length, RICHT.bericht, `${metBericht.length} · ${pct(metBericht.length, leads.length)}`, 'followup', 'van de leads'),
      M('In gesprek', inGesprek.length, metBericht.length, RICHT.contact, `${inGesprek.length} · ${pct(inGesprek.length, metBericht.length)}`, 'followup', 'reageerde op je bericht'),
    ] },
    { id: 'call', naam: 'Call', vraag: 'Worden er calls geboekt en gehouden?', metingen: [
      M('Call voorgesteld', voorgesteld.length, inGesprek.length, RICHT.voorgesteld, `${voorgesteld.length} · ${pct(voorgesteld.length, inGesprek.length)}`, 'call', 'van wie in gesprek is'),
      M('Call ingepland', calls.length, voorgesteld.length, RICHT.ingepland, `${calls.length} · ${pct(calls.length, voorgesteld.length)}`, 'call', `van de voorstellen · ${nogGepland.length} staat nog`),
      M('Call gehad', gehouden.length, afgerond, RICHT.show, `${gehouden.length} · ${pct(gehouden.length, afgerond)}`, 'call', `kwam opdagen · ${noshows.length} no-show · ${afgezegd.length} afgezegd`),
    ] },
    { id: 'close', naam: 'Close', vraag: 'Wordt er geclosed?', metingen: [
      M('Sale', sales.length, gehouden.length, RICHT.close, `${sales.length} · ${pct(sales.length, gehouden.length)}`, 'sale', `van de calls · ${verloren.length} verloren`),
      M('Gem. orderwaarde', null, null, null, sales.length ? euro(omzet / sales.length) : '–', 'omzet', `${euro(omzet)} omzet`),
    ] },
  ].map(f => {
    const beoordeeld = f.metingen.map(x => x.oordeel).filter(o => o && o.rang >= 0)
    const oordeel = beoordeeld.length ? beoordeeld.reduce((x, y) => (y.rang > x.rang ? y : x)) : OORDEEL.weinig
    return { ...f, oordeel }
  })
  const vast = FASES.find(f => f.oordeel.id === 'slecht') || FASES.find(f => f.oordeel.id === 'matig') || null
  const nodigVoorDoel = spend * DOEL_ROAS - omzet

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(LINK_VOORBEELD); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000) } catch { /* leeg */ }
  }

  const bijgewerkt = data?.spend_bijgewerkt
    ? new Date(data.spend_bijgewerkt).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null

  // ── Inhoud van de vensters ──
  const vensters = {
    spend: {
      titel: 'Uitgegeven', sub: `Meta-advertenties · bijgewerkt ${bijgewerkt || 'nog niet'}`,
      inhoud: (
        <>
          <Grafiek data={dagen} sleutel="spend" kleur={GROEN} label="uitgegeven" euroAs />
          <Regel label="Uitgegeven" waarde={euro(spend, true)} sterk />
          <Regel label="Vertoningen" waarde={impressies.toLocaleString('nl-NL')} />
          <Regel label="Klikken op de link (Meta)" waarde={klikken} />
          <Regel label="Kosten per klik" waarde={klikken ? euro(spend / klikken, true) : '–'} />
          <Regel label="Klikratio (CTR)" waarde={impressies ? `${((klikken / impressies) * 100).toFixed(1).replace('.', ',')}%` : '–'} />
          <Regel label="Kosten per 1.000 vertoningen" waarde={impressies ? euro((spend / impressies) * 1000, true) : '–'} />
        </>
      ),
    },
    cpl: {
      titel: 'Kosten per lead', sub: 'Uitgegeven gedeeld door de mensen die hun gegevens achterlieten',
      inhoud: (
        <>
          <Regel label="Uitgegeven" waarde={euro(spend, true)} />
          <Regel label="Leads" waarde={leads.length} />
          <Regel label="Kosten per lead" waarde={euro(cpl, true)} sterk />
          <Regel label="Kosten per geplande call" waarde={calls.length ? euro(spend / calls.length, true) : '–'} />
          <Regel label="Kosten per sale" waarde={sales.length ? euro(spend / sales.length, true) : '–'} />
          <Grafiek data={dagen} sleutel="leads" kleur="#60a5fa" label="leads" />
        </>
      ),
    },
    omzet: {
      titel: 'Omzet uit advertenties', sub: 'Orderwaarde van sales uit deze leads, zoals op het bord',
      inhoud: (
        <>
          <Regel label="Sales" waarde={sales.length} />
          <Regel label="Omzet" waarde={euro(omzet)} sterk />
          <Regel label="Gemiddeld per sale" waarde={sales.length ? euro(omzet / sales.length) : '–'} />
          <div style={{ ...kop, marginTop: 18 }}>Sales</div>
          {sales.length ? sales.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen sale uit een advertentielead in deze periode.</Leeg>}
        </>
      ),
    },
    roas: {
      titel: 'Rendement (ROAS)', sub: 'Hoeveel euro omzet elke uitgegeven euro opleverde',
      inhoud: (
        <>
          <Regel label="Omzet" waarde={euro(omzet)} />
          <Regel label="Uitgegeven" waarde={euro(spend, true)} />
          <Regel label="Winst na advertenties" waarde={euro(omzet - spend)} sterk />
          <Regel label="ROAS" waarde={roas != null ? `${roas.toFixed(1).replace('.', ',')}x` : '–'} sterk />
          <Regel label={`Doel ${DOEL_ROAS}x: omzet nodig`} waarde={euro(spend * DOEL_ROAS)} />
          <Regel label="Nog te gaan" waarde={nodigVoorDoel > 0 ? euro(nodigVoorDoel) : 'gehaald'} />
          <Regel label={`Max. kosten per sale voor ${DOEL_ROAS}x`} waarde={sales.length ? euro(omzet / sales.length / DOEL_ROAS) : '–'} />
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ZWAK, marginTop: 12, lineHeight: 1.5 }}>
            Doel is €1 in, €3 uit. Boven 1x verdien je je advertenties terug. Omzet telt de orderwaarde van de sale, ook als die in termijnen binnenkomt.
          </div>
        </>
      ),
    },
    bezoekers: {
      titel: 'Op de pagina', sub: alleenAds ? 'Unieke bezoekers via een advertentie' : 'Unieke bezoekers, ook Instagram-bio en direct',
      inhoud: (
        <>
          <Grafiek data={dagen} sleutel="sessies" label="bezoekers" />
          <Regel label="Unieke bezoekers" waarde={T.sessies} sterk />
          <Regel label="Pagina geopend, ook opnieuw" waarde={T.geopend} />
          <Regel label="Gemiddelde tijd op de pagina" waarde={fmtTijd(T.tijd)} />
          <Regel label="Bleef langer dan 30 seconden" waarde={`${T.blijft_30s} (${pct(T.blijft_30s, T.geopend)})`} />
          <Regel label="Op de telefoon" waarde={pct(T.mobiel, T.geopend)} />
          <Regel label="Klikte op de knop" waarde={`${T.knop} (${pct(T.knop, T.geopend)})`} />
          {alleenAds && (
            <>
              <div style={{ ...kop, marginTop: 20 }}>Naast de cijfers van Meta</div>
              <Regel label="Linkklikken (Meta)" waarde={klikken} />
              <Regel label="Pagina geladen (Meta)" waarde={geladen} />
              <Regel label="Unieke bezoekers (hier)" waarde={T.sessies} sterk />
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', marginTop: 12, lineHeight: 1.55 }}>
                Elke klik op je advertentie krijgt van Meta een klik-id; hier telt elk id één keer, ook als iemand de pagina vaker opent. Meta haalt zelf nog dubbele en ongeldige klikken eruit, en Instagram geeft soms een nieuw id als de pagina opnieuw laadt. Daarom ligt dit getal iets boven dat van Meta. Kosten per klik reken je met het getal van Meta, de trechter hier met de unieke bezoekers.
              </div>
              {(ruis.controle_ad > 0 || ruis.fragment_ad > 0) && (
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK, marginTop: 10, lineHeight: 1.55 }}>
                  Niet meegeteld: {ruis.controle_ad || 0} controlebezoeken van Meta zelf (bij het publiceren of aanpassen van een advertentie) en {ruis.fragment_ad || 0} losse meetstukjes zonder echt bezoek.
                </div>
              )}
            </>
          )}
        </>
      ),
    },
    video: {
      titel: 'Video', sub: `${pct(T.video_start, T.sessies)} van de bezoekers start de video`,
      inhoud: (
        <>
          <div style={kop}>Hoe ver kijken ze?</div>
          <Balk label="Gestart" aantal={T.video_start} basis={T.video_start} tekst="100%" />
          <Balk label="Kwart gezien" aantal={T.video_25} basis={T.video_start} />
          <Balk label="Helft gezien" aantal={T.video_50} basis={T.video_start} />
          <Balk label="Driekwart gezien" aantal={T.video_75} basis={T.video_start} />
          <Balk label="Helemaal gezien" aantal={T.video_100} basis={T.video_start} kleur={GROEN} />
          <div style={{ height: 8 }} />
          <Regel label="Bezoekers die de video starten" waarde={`${T.video_start} van ${T.sessies} (${pct(T.video_start, T.sessies)})`} />
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ZWAK, marginTop: 12, lineHeight: 1.5 }}>
            Percentages zijn van wie de video startte. Kwart, helft en driekwart worden gemeten sinds 11 oktober.
          </div>
        </>
      ),
    },
    formulier: {
      titel: 'Formulier', sub: `${pct(T.form_start, T.sessies)} van de bezoekers begint eraan`,
      inhoud: (
        <>
          <Balk label="Klikte op de knop" aantal={T.knop} basis={T.sessies} />
          <Balk label="Formulier begonnen" aantal={T.form_start} basis={T.sessies} />
          <Balk label="Tot het eind ingevuld" aantal={T.form_klaar} basis={T.form_start} kleur="#60a5fa" />
          <Balk label="Geschikt, gegevens achtergelaten" aantal={leads.length} basis={T.form_start} kleur={GROEN} />
          <Balk label="Niet geschikt" aantal={T.afgewezen} basis={T.form_start} kleur={ORANJE} />
          <div style={{ height: 14 }} />
          <PrequalAfhaken venster={venster} m />
        </>
      ),
    },
    gegevens: {
      titel: 'Gegevens achtergelaten', sub: `${leads.length} geschikte leads, ${pct(leads.length, T.form_start)} van wie begon`,
      inhoud: (
        <>
          {T.geschikt_video_start > 0 && (
            <Regel label="Keek jouw video op het geschikt-scherm" waarde={`${T.geschikt_video_start} (${T.geschikt_video_klaar} helemaal)`} />
          )}
          <div style={{ ...kop, marginTop: 14 }}>Leads</div>
          {leads.length ? leads.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen leads in deze periode.</Leeg>}
          <div style={{ height: 22 }} />
          <PrequalAfgewezen venster={venster} />
        </>
      ),
    },
    followup: {
      titel: 'Follow-up', sub: `${pct(inGesprek.length, leads.length)} van de leads is in gesprek`,
      inhoud: (
        <>
          <Regel label="Leads" waarde={leads.length} />
          <Regel label="Bericht gestuurd" waarde={`${metBericht.length} (${pct(metBericht.length, leads.length)})`} />
          <Regel label="In gesprek" waarde={`${inGesprek.length} (${pct(inGesprek.length, metBericht.length)} van de berichten)`} sterk />
          {leads.some(l => !l.bericht) && (
            <>
              <div style={{ ...kop, marginTop: 18, color: ORANJE }}>Nog geen bericht ({leads.filter(l => !l.bericht).length})</div>
              {leads.filter(l => !l.bericht).map(l => <LeadRegel key={l.id} l={l} />)}
            </>
          )}
          {metBericht.some(l => !l.contact) && (
            <>
              <div style={{ ...kop, marginTop: 18, color: ORANJE }}>Bericht, nog geen reactie ({metBericht.filter(l => !l.contact).length})</div>
              {metBericht.filter(l => !l.contact).map(l => <LeadRegel key={l.id} l={l} />)}
            </>
          )}
          <div style={{ ...kop, marginTop: 18 }}>In gesprek</div>
          {inGesprek.length ? inGesprek.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog niemand in gesprek.</Leeg>}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ZWAK, marginTop: 12, lineHeight: 1.5 }}>
            Bericht gestuurd telt als je op het bord "DM gestuurd" kiest, een follow-up logt of een reactie telt. In gesprek telt zodra je een reactie telt of de lead naar een gesprek- of callsectie zet. Een lead die alleen op "DM vandaag" stond telt niet: die lijst zet het bord zelf.
          </div>
        </>
      ),
    },
    call: {
      titel: 'Calls', sub: `${pct(calls.length, leads.length)} van de leads boekt een call`,
      inhoud: (
        <>
          <Regel label="Call voorgesteld" waarde={voorgesteld.length} />
          <Regel label="Call ingepland" waarde={calls.length} sterk />
          <Regel label="Nog gepland" waarde={nogGepland.length} />
          <Regel label="Call gehad" waarde={gehouden.length} sterk />
          <Regel label="No-show" waarde={noshows.length} />
          <Regel label="Call afgezegd" waarde={afgezegd.length} />
          <Regel label="Call afgewezen" waarde={afgewezen.length} />
          <Regel label="Opkomst (gehad van afgerond)" waarde={pct(gehouden.length, afgerond)} />
          <Regel label="Kosten per ingeplande call" waarde={calls.length ? euro(spend / calls.length, true) : '–'} />
          <div style={{ ...kop, marginTop: 18 }}>Met een call</div>
          {calls.length ? calls.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen calls in deze periode.</Leeg>}
          {inGesprek.some(l => !l.call) && (
            <>
              <div style={{ ...kop, marginTop: 18, color: ORANJE }}>In gesprek, nog geen call ({inGesprek.filter(l => !l.call).length})</div>
              {inGesprek.filter(l => !l.call).map(l => <LeadRegel key={l.id} l={l} />)}
            </>
          )}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ZWAK, marginTop: 12, lineHeight: 1.5 }}>
            Zelfde tellingen als in je leadsysteem: voorgesteld = naar Call voorgesteld, ingepland = naar Sales Call of met een calldatum, gehad = call gemarkeerd als gehouden, no-show = laatste call niet gehouden. Een verplaatste call telt niet dubbel.
          </div>
        </>
      ),
    },
    sale: {
      titel: 'Close', sub: `${pct(sales.length, gehouden.length)} van de gehouden calls wordt een sale`,
      inhoud: (
        <>
          <Regel label="Call gehad" waarde={gehouden.length} />
          <Regel label="Sales" waarde={sales.length} sterk />
          <Regel label="Sale verloren" waarde={verloren.length} />
          <Regel label="Omzet" waarde={euro(omzet)} />
          <Regel label="Kosten per sale" waarde={sales.length ? euro(spend / sales.length, true) : '–'} />
          <div style={{ ...kop, marginTop: 18 }}>Sales</div>
          {sales.length ? sales.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen sale uit deze leads.</Leeg>}
        </>
      ),
    },
  }

  const open = info ? vensters[info] : null
  const ad = advertentie ? advertenties.find(a => a.sleutel === advertentie) : null

  return (
    <div style={{ padding: m ? '1rem' : '1.5rem 2rem', color: '#fff', maxWidth: 1080, margin: '0 auto' }}>
      {/* ═══ KOP ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: m ? 22 : 30 }}>
        <div style={{ fontSize: m ? '1.25rem' : '1.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Ads · 6 Weken Challenge</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={bron} onChange={e => setBron(e.target.value)} style={keuze} aria-label="Bron">
            <option value="ads">Alleen advertenties</option>
            <option value="alles">Alle bezoekers</option>
          </select>
          <select value={periode} onChange={e => setPeriode(e.target.value)} style={keuze} aria-label="Periode">
            {PERIODES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {periode === 'vanaf' && (
            <input type="date" value={vanafDatum} max={new Date().toLocaleDateString('sv-SE')}
              onChange={e => kiesVanaf(e.target.value)} style={{ ...keuze, colorScheme: 'dark' }} aria-label="Vanaf" />
          )}
          <button onClick={laad} aria-label="Verversen" style={{ ...keuze, width: 36, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ animation: laden ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {fout && <div style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.84rem', fontWeight: 700, marginBottom: '1rem' }}>{fout}</div>}

      {/* ═══ 1. RENDEMENT ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: m ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: m ? '22px 18px' : 32, marginBottom: m ? 34 : 46 }}>
        <Getal label="Uitgegeven" waarde={euro(spend)} sub={`${klikken} klikken · ${klikken ? euro(spend / klikken, true) : '–'} per klik`} onClick={() => setInfo('spend')} />
        <Getal label="Kosten per lead" waarde={euro(cpl)} sub={`${leads.length} ${leads.length === 1 ? 'lead' : 'leads'}`} onClick={() => setInfo('cpl')} />
        <Getal label="Omzet" waarde={euro(omzet)} kleur={omzet > 0 ? GROEN : '#fff'} sub={`${sales.length} ${sales.length === 1 ? 'sale' : 'sales'}`} onClick={() => setInfo('omzet')} />
        <Getal label="ROAS" waarde={roas != null ? `${roas.toFixed(1).replace('.', ',')}x` : '–'}
          kleur={roas == null ? '#fff' : roas >= DOEL_ROAS ? GROEN : roas >= 1 ? ORANJE : ROOD}
          sub={spend > 0 ? (nodigVoorDoel > 0 ? `doel ${DOEL_ROAS}x · nog ${euro(nodigVoorDoel)} omzet` : `doel ${DOEL_ROAS}x gehaald`) : 'nog geen spend'} onClick={() => setInfo('roas')} />
      </div>

      {/* ═══ 2. WAAR LOOPT HET VAST ═══ */}
      <div style={{ marginBottom: m ? 34 : 46 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Waar loopt het vast?</div>
          {vast && <div style={{ fontSize: '0.82rem', fontWeight: 900, color: vast.oordeel.kleur }}>Eerst aanpakken: {vast.naam}</div>}
        </div>
        {FASES.map((f, i) => {
          const isVast = vast?.id === f.id
          return (
            <div key={f.id} style={{
              padding: openFase === f.id ? '0.9rem 0 0.4rem' : '0.9rem 0', borderTop: i ? LIJN : 'none',
              ...(isVast ? { borderLeft: `3px solid ${f.oordeel.kleur}`, paddingLeft: 12, marginLeft: -15 } : {}),
            }}>
              <button onClick={() => setOpenFase(o => (o === f.id ? null : f.id))} aria-expanded={openFase === f.id} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: 0, background: 'none', border: 'none',
                color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff', color: '#000', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.98rem', fontWeight: 900 }}>{f.naam}</span>
                  <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: ZWAK }}>{f.vraag}</span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 900, color: f.oordeel.kleur, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.oordeel.kleur }} />{f.oordeel.tekst}
                </span>
                <ChevronDown size={17} strokeWidth={2.6} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0, transform: openFase === f.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {openFase === f.id && <div style={{ marginTop: 6, marginLeft: 36 }}>
                {f.metingen.map(x => (
                  <button key={x.label} onClick={() => setInfo(x.venster)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.5rem 0', background: 'none', border: 'none',
                    color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: 800 }}>{x.label}</span>
                      {x.sub && <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: ZWAK, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.sub}</span>}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: x.oordeel && x.oordeel.rang >= 0 ? x.oordeel.kleur : '#fff' }}>{x.tekst}</span>
                    <ChevronRight size={15} strokeWidth={2.6} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>}
            </div>
          )
        })}
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 8, lineHeight: 1.5 }}>
          Groen, oranje en rood zijn vuistregels voor koud verkeer uit Meta. Percentage = van de stap ervoor. Leads tellen vanaf de dag dat ze binnenkwamen, met alles wat er daarna gebeurde. Tik op een fase om hem open te klappen.
        </div>
      </div>

      {/* ═══ 3. PER ADVERTENTIE ═══ */}
      <div style={{ marginBottom: m ? 28 : 40 }}>
        <div style={{ ...kop, display: 'flex', alignItems: 'center', gap: 6 }}><Megaphone size={14} strokeWidth={2.6} /> Per advertentie</div>
        <div style={{ display: 'grid', gridTemplateColumns: m ? 'minmax(0, 1fr) 58px 44px 50px' : 'minmax(0, 1fr) 80px 80px 70px 80px 60px 60px 90px', gap: 8, paddingBottom: 6, borderBottom: LIJN, fontSize: '0.7rem', fontWeight: 800, color: ZWAK }}>
          <span>Advertentie</span>
          <span style={{ textAlign: 'right' }}>Spend</span>
          {!m && <span style={{ textAlign: 'right' }}>Bezoekers</span>}
          <span style={{ textAlign: 'right' }}>Leads</span>
          {!m && <span style={{ textAlign: 'right' }}>Per lead</span>}
          {!m && <span style={{ textAlign: 'right' }}>Calls</span>}
          {!m && <span style={{ textAlign: 'right' }}>Sales</span>}
          <span style={{ textAlign: 'right' }}>{m ? 'Calls' : 'Omzet'}</span>
        </div>
        {!laden && advertenties.length === 0 && <Leeg>Nog geen advertentieverkeer in deze periode.</Leeg>}
        {advertenties.map(a => (
          <button key={a.sleutel} onClick={() => setAdvertentie(a.sleutel)} style={{
            width: '100%', display: 'grid', gridTemplateColumns: m ? 'minmax(0, 1fr) 58px 44px 50px' : 'minmax(0, 1fr) 80px 80px 70px 80px 60px 60px 90px',
            gap: 8, alignItems: 'center', padding: '0.7rem 0', background: 'none', border: 'none', borderBottom: LIJN,
            color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', opacity: a.onbekend ? 0.55 : 1,
            fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent',
          }}>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.naam}</span>
              {m && <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: ZWAK, marginTop: 1 }}>{a.t.sessies} bezoekers{a.leads.length ? ` · ${euro(a.spend / a.leads.length)} per lead` : ''}</span>}
            </span>
            <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{a.spend ? euro(a.spend) : '–'}</span>
            {!m && <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{a.t.sessies}</span>}
            <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{a.leads.length}</span>
            {!m && <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{a.leads.length && a.spend ? euro(a.spend / a.leads.length) : '–'}</span>}
            {!m && <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{a.calls}</span>}
            {!m && <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900, color: a.sales ? GROEN : '#fff' }}>{a.sales}</span>}
            <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900, color: (m ? a.calls : a.omzet) > 0 ? GROEN : '#fff' }}>{m ? a.calls : (a.omzet ? euro(a.omzet) : '–')}</span>
          </button>
        ))}
      </div>

      {/* ═══ Link voor in de advertentie, dicht ═══ */}
      <div style={{ borderTop: LIJN }}>
        <button onClick={() => setLinkOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '0.9rem 0', background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
          <Link2 size={16} strokeWidth={2.5} />
          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 900 }}>Link voor in de advertentie</span>
          <ChevronDown size={17} strokeWidth={2.6} color="rgba(255,255,255,0.5)" style={{ transform: linkOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {linkOpen && (
          <div style={{ paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{LINK_VOORBEELD}</code>
              <button onClick={kopieer} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.7rem', borderRadius: 10, background: gekopieerd ? 'rgba(16,185,129,0.15)' : '#fff', color: gekopieerd ? GROEN : '#000', border: 'none', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {gekopieerd ? <Check size={14} /> : <Copy size={14} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, marginTop: 6, lineHeight: 1.45 }}>
              Meta vult {'{{campaign.name}}'} en {'{{ad.name}}'} zelf in. Zo komen bezoekers en spend bij dezelfde advertentie uit.
            </div>
          </div>
        )}
      </div>

      {open && (
        <Venster titel={open.titel} sub={open.sub} m={m} onClose={() => setInfo(null)}>{open.inhoud}</Venster>
      )}

      {ad && (
        <Venster titel={ad.naam} sub={`${euro(ad.spend, true)} uitgegeven · ${ad.klikken} klikken`} m={m} onClose={() => setAdvertentie(null)}>
          <Balk label="Op de pagina" aantal={ad.t.sessies} basis={ad.t.sessies} tekst={`gem. ${fmtTijd(ad.t.tijd)}`} />
          <Balk label="Video gestart" aantal={ad.t.video_start} basis={ad.t.sessies} />
          <Balk label="Video helemaal gezien" aantal={ad.t.video_100} basis={ad.t.video_start} />
          <Balk label="Formulier begonnen" aantal={ad.t.form_start} basis={ad.t.sessies} />
          <Balk label="Gegevens achtergelaten" aantal={ad.leads.length} basis={ad.t.form_start} kleur="#60a5fa" />
          <Balk label="Call gepland" aantal={ad.calls} basis={ad.leads.length} kleur="#60a5fa" />
          <Balk label="Sale" aantal={ad.sales} basis={ad.calls} kleur={GROEN} />
          <div style={{ height: 6 }} />
          <Regel label="Kosten per klik" waarde={ad.klikken ? euro(ad.spend / ad.klikken, true) : '–'} />
          <Regel label="Kosten per lead" waarde={ad.leads.length ? euro(ad.spend / ad.leads.length, true) : '–'} sterk />
          <Regel label="Omzet" waarde={euro(ad.omzet)} />
          <Regel label="ROAS" waarde={ad.spend ? `${(ad.omzet / ad.spend).toFixed(1).replace('.', ',')}x` : '–'} />
          <div style={{ ...kop, marginTop: 18 }}>Leads</div>
          {ad.leads.length ? ad.leads.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen leads uit deze advertentie.</Leeg>}
        </Venster>
      )}

      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  )
}
