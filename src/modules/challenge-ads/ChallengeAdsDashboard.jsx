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
//
// Per pagina (23 okt 2026): vooraan in de keuzebalk kies je de pagina
// (/challenge of /mijn-split). Beide RPC's krijgen p_pagina mee en tellen dan
// alleen de bezoeken van die pagina en de leads met haar lead_source (zie
// ads-per-pagina.sql). /mijn-split telt al het verkeer, niet alleen ads:
// daar komt het meeste via Instagram.

import { useEffect, useRef, useState } from 'react'
import {
  Copy, Check, ChevronDown, Link2,
  Megaphone, Info, Percent, Download, FileText, Euro, Users, Play, MousePointerClick, PenLine, UserCheck, Send, MessageCircle,
  PhoneOutgoing, CalendarCheck, PhoneCall, Trophy, Wallet, UserPlus, Phone, XCircle, Repeat, Banknote, Coins, TrendingUp,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PrequalAfhaken from './PrequalAfhaken'
import PrequalAfgewezen from './PrequalAfgewezen'
import FaseTrechter from './FaseTrechter'
import Venster from './Venster'
import MagnetTrechter from './MagnetTrechter'
import { GROEN, ORANJE, ROOD, ZWAK, beoordeel, vatFaseSamen } from './fases'

const PERIODES = [
  { id: '7', label: 'Laatste 7 dagen', dagen: 7 },
  { id: '14', label: 'Laatste 14 dagen', dagen: 14 },
  { id: '30', label: 'Laatste 30 dagen', dagen: 30 },
  { id: '90', label: 'Laatste 90 dagen', dagen: 90 },
  { id: 'vanaf', label: 'Vanaf datum…' },
  { id: 'tussen', label: 'Van … tot …' },
]

// De pagina's met meting. `alleenAds`: alleen advertentieverkeer tellen.
// `schermNaam`: namen van de formulierschermen die per pagina verschillen.
const PAGINAS = [
  { id: '/challenge', label: '/challenge', alleenAds: true, schermNaam: {} },
  { id: '/mijn-split', label: '/mijn-split', alleenAds: false, pdf: true,
    schermNaam: { dagen: 'Dagen per week', locatie: 'Gym of thuis', doel: 'Doel', niveau: 'Hoe lang trainen', beperkingen: 'Kan of wil niet', gegevens: 'Naam en e-mail' } },
  { id: '/mijn-menu', label: '/mijn-menu', alleenAds: false, pdf: true,
    schermNaam: { doel: 'Doel', overjou: 'Over jou', activiteit: 'Activiteit', maaltijden: 'Maaltijden per dag', variatie: 'Afwisseling', dieet: 'Dieet', lustniet: 'Lust niet', gegevens: 'Naam en e-mail' } },
  // Geen pagina maar de Instagram-route "comment WOORD" (MagnetTrechter).
  { id: 'magnets', label: 'Comment-magnets', magnets: true, schermNaam: {} },
]
const paginaVan = (id) => PAGINAS.find(p => p.id === id) || PAGINAS[0]

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
  contact: { goed: 0.6, matig: 0.4, min: 3 },
  voorgesteld: { goed: 0.6, matig: 0.4, min: 3 },
  ingepland: { goed: 0.7, matig: 0.5, min: 3 },
  show: { goed: 0.75, matig: 0.6, min: 3 },
  close: { goed: 0.3, matig: 0.15, min: 3 },
  verlengd: { goed: 0.5, matig: 0.3, min: 3 },
}
// Korte naam per formulierscherm, ook van eerdere versies van het formulier.
const SCHERM_NAAM = {
  doel: 'Doel', vastlopen: 'Waar loop je vast', geprobeerd: 'Wat al geprobeerd', leeftijd: 'Leeftijd',
  gegevens: 'Naam en nummer', voornaam: 'Voornaam', email: 'E-mailadres', contact: 'Telefoonnummer', telefoon: 'Telefoonnummer',
  kilos: 'Hoeveel kilo', waarom_nu: 'Waarom nu', belang: 'Hoe belangrijk', trainen: 'Hoe vaak trainen', borg: 'Borg',
  geschikt: 'Geschikt-uitleg', route: 'Zelf plannen of contact', kanaal: 'Hoe contact',
}

// Icoon per meting in de fases.
const ICONEN = {
  'Klikratio (CTR)': Percent, 'Kosten per klik': Euro,
  Bezoekers: Users, 'Video gestart': Play, 'Op de knop geklikt': MousePointerClick, 'Formulier gestart': PenLine, 'Leads binnen': UserCheck,
  'Follow-up gestuurd': Send, 'In gesprek': MessageCircle,
  'Call voorgesteld': PhoneOutgoing, 'Call ingepland': CalendarCheck, 'Call gehad': PhoneCall,
  Sale: Trophy, Verlengd: Repeat, 'Gem. orderwaarde': Wallet, 'PDF gedownload': Download,
}

const procent = (x, dec = 0) => `${(x * 100).toFixed(dec).replace('.', ',')}%`

const linkVoorbeeld = (pad) => `https://www.myarcfitness.com${pad}?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`

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
  'knop', 'form_start', 'form_klaar', 'geschikt', 'afgewezen', 'geschikt_video_start', 'geschikt_video_klaar', 'pdf']
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
      // Sale plus verlenging: alles wat deze advertentie uiteindelijk opleverde.
      omzet: sales.reduce((s, l) => s + Number(l.omzet), 0) + r.leads.reduce((s, l) => s + (Number(l.verlenging_omzet) || 0), 0),
    }
  }).sort((a, b) => (a.onbekend - b.onbekend) || (b.spend - a.spend) || (b.t.sessies - a.t.sessies))
}

// ── Bouwstenen ─────────────────────────────────────────────────────────────

const kop = { fontSize: '0.8rem', fontWeight: 800, color: ZWAK, marginBottom: 10 }
// Onderdeel van de keuzebalk: geen eigen rand, de balk heeft er één.
const seg = {
  height: '100%', padding: '0 0.7rem', background: 'transparent', color: '#fff', border: 'none', outline: 'none',
  fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', colorScheme: 'dark', minWidth: 0,
}
const scheiding = { width: 1, height: 18, background: 'rgba(255,255,255,0.16)', flexShrink: 0 }


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

// Eigen keuzemenu in de stijl van de app (de systeemlijst van de browser
// paste er niet bij). opties: { waarde, label, kop?, in? } — kop = groepskop,
// in = ingesprongen onder een kop.
function Keuzemenu({ weergave, waarde, opties, onKies, label, stijl, rechts = false, breedte = 260 }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const weg = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', weg)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', weg); document.removeEventListener('keydown', esc) }
  }, [open])
  return (
    <span ref={ref} style={{ position: 'relative', display: 'flex', height: '100%', minWidth: 0, ...stijl }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-label={label} aria-expanded={open} style={{
        height: '100%', width: '100%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0 0.7rem',
        background: open ? 'rgba(255,255,255,0.06)' : 'transparent', border: 'none', color: '#fff', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', textAlign: 'left',
      }}>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{weergave}</span>
        <ChevronDown size={14} strokeWidth={2.6} color="rgba(255,255,255,0.55)" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 6px)', [rechts ? 'right' : 'left']: 0, zIndex: 50,
          minWidth: '100%', width: breedte, maxWidth: 'calc(100vw - 32px)', maxHeight: 380, overflowY: 'auto',
          background: '#0b0b0b', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 12, padding: 5,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}>
          {opties.map((o, i) => o.kop ? (
            <div key={`k${i}`} style={{ padding: '0.55rem 0.6rem 0.25rem', fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none', marginTop: i ? 4 : 0 }}>{o.kop}</div>
          ) : (
            <button key={o.waarde} type="button" role="option" aria-selected={o.waarde === waarde}
              onClick={() => { setOpen(false); onKies(o.waarde) }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: `0.5rem 0.6rem 0.5rem ${o.in ? '1.2rem' : '0.6rem'}`,
                background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                color: '#fff', fontSize: '0.82rem', fontWeight: o.waarde === waarde ? 900 : 700, fontFamily: 'inherit',
              }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.label}</span>
              {o.waarde === waarde && <Check size={14} strokeWidth={3} color={GROEN} style={{ flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </span>
  )
}

// Eén lead met waar hij nu staat.
function LeadRegel({ l }) {
  const status = l.verlengd ? { tekst: `Verlengd${l.verlenging_omzet ? ` ${euro(l.verlenging_omzet)}` : ''}`, kleur: GROEN }
    : Number(l.omzet) > 0 ? { tekst: `Sale ${euro(l.omzet)}`, kleur: GROEN }
    : l.verloren ? { tekst: 'Sale verloren', kleur: ROOD }
      : l.gehouden ? { tekst: 'Call gehad', kleur: '#fff' }
        : l.noshow ? { tekst: 'No-show', kleur: ROOD }
          : l.afgezegd ? { tekst: 'Call afgezegd', kleur: ORANJE }
            : l.nog_gepland ? { tekst: `Call ${dagLabel(l.call_datum)}`, kleur: '#60a5fa' }
              : l.afgewezen ? { tekst: 'Call afgewezen', kleur: ROOD }
                : l.call ? { tekst: 'Call ingepland', kleur: '#60a5fa' }
                  : l.voorgesteld ? { tekst: 'Call voorgesteld', kleur: '#60a5fa' }
                    : l.contact ? { tekst: 'In gesprek', kleur: '#fff' }
                      : l.bericht_gelogd ? { tekst: 'Follow-up gestuurd', kleur: ORANJE }
                        : { tekst: 'Nog niet in gesprek', kleur: ORANJE }
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
      if (p === 'tussen') return localStorage.getItem('arc_ads_bereik_van') && localStorage.getItem('arc_ads_bereik_tot') ? 'tussen' : '14'
      return PERIODES.some(x => x.id === p) ? p : '14'
    } catch { return '14' }
  })
  const setPeriode = (p) => {
    setPeriodeState(p)
    try { localStorage.setItem('arc_ads_periode', p) } catch { /* geen opslag */ }
  }
  const datumRef = useRef(null)
  const [vanafDatum, setVanafDatum] = useState(() => {
    try { return localStorage.getItem('arc_ads_vanaf') || '' } catch { return '' }
  })
  // Van … tot …: eigen begin- en einddatum, los van 'vanaf'. Gekozen in een
  // klein venster met twee datumvelden.
  const [bereik, setBereik] = useState(() => {
    try { return { van: localStorage.getItem('arc_ads_bereik_van') || '', tot: localStorage.getItem('arc_ads_bereik_tot') || '' } } catch { return { van: '', tot: '' } }
  })
  const [bereikOpen, setBereikOpen] = useState(false)
  const [bereikInvoer, setBereikInvoer] = useState({ van: '', tot: '' })
  const kiesBereik = (van, tot) => {
    setBereik({ van, tot })
    try { localStorage.setItem('arc_ads_bereik_van', van); localStorage.setItem('arc_ads_bereik_tot', tot) } catch { /* geen opslag */ }
    setPeriode('tussen')
  }
  const kiesVanaf = (iso) => {
    setVanafDatum(iso)
    try { if (iso) localStorage.setItem('arc_ads_vanaf', iso); else localStorage.removeItem('arc_ads_vanaf') } catch { /* geen opslag */ }
  }

  // Campagne en advertentie (22 okt 2026: nieuwe campagne los van de oude
  // kunnen bekijken). Leeg = alles. De campagne wordt onthouden.
  const [campagne, setCampagneState] = useState(() => { try { return localStorage.getItem('arc_ads_campagne') || '' } catch { return '' } })
  const [advFilter, setAdvFilter] = useState('')
  const setCampagne = (c) => {
    setCampagneState(c); setAdvFilter('')
    try { if (c) localStorage.setItem('arc_ads_campagne', c); else localStorage.removeItem('arc_ads_campagne') } catch { /* geen opslag */ }
  }

  // Welke pagina; onthouden. Wisselen zet campagne en advertentie terug.
  const [pagina, setPaginaState] = useState(() => { try { return paginaVan(localStorage.getItem('arc_ads_pagina')).id } catch { return '/challenge' } })
  const setPagina = (p) => {
    setPaginaState(p); setCampagne('')
    try { localStorage.setItem('arc_ads_pagina', p) } catch { /* geen opslag */ }
  }
  const P = paginaVan(pagina)

  const [data, setData] = useState(null)
  const [venster, setVenster] = useState(null)
  const [laden, setLaden] = useState(true)
  const [fout, setFout] = useState('')
  const [info, setInfo] = useState(null)        // id van het open venster
  const [advertentie, setAdvertentie] = useState(null)
  // Per advertentie en de advertentielink zitten achter knoppen in de balk.
  const [paneel, setPaneel] = useState(null)
  const [gekopieerd, setGekopieerd] = useState(false)

  const laad = async () => {
    if (periode === 'vanaf' && !vanafDatum) return
    if (periode === 'tussen' && !(bereik.van && bereik.tot)) return
    setLaden(true); setFout('')
    try {
      const dagen = PERIODES.find(p => p.id === periode)?.dagen || 14
      const tussen = periode === 'tussen' && bereik.van && bereik.tot
      const tot = tussen ? new Date(`${bereik.tot}T00:00:00`) : new Date(); tot.setHours(23, 59, 59, 999)
      const totEx = new Date(tot.getTime() + 1)
      const van = tussen
        ? new Date(`${bereik.van}T00:00:00`)
        : (periode === 'vanaf' && vanafDatum)
          ? new Date(`${vanafDatum}T00:00:00`)
          : (() => { const d = new Date(); d.setDate(d.getDate() - dagen + 1); d.setHours(0, 0, 0, 0); return d })()
      if (paginaVan(pagina).magnets) {
        const { data: res, error } = await db.supabase.rpc('get_magnet_trechter', { p_van: van.toISOString(), p_tot: totEx.toISOString() })
        if (error) throw error
        setData({ magnet: res || {} })
        setVenster({ van: van.toISOString(), tot: totEx.toISOString() })
        return
      }
      const p = { p_van: van.toISOString(), p_tot: totEx.toISOString(), p_pagina: pagina }
      const [{ data: res, error }, st] = await Promise.all([
        db.supabase.rpc('get_challenge_ads_overzicht', p),
        db.supabase.rpc('get_prequal_stappen', p).then(r => r, () => ({ data: [] })),
      ])
      if (error) throw error
      setData({ ...(res || {}), stappen: st?.data || [] })
      setVenster({ van: van.toISOString(), tot: totEx.toISOString() })
    } catch (e) {
      console.error('ads-overzicht laden mislukt:', e)
      setFout(e.message || 'Laden mislukt')
    } finally { setLaden(false) }
  }
  useEffect(() => { laad() }, [periode, vanafDatum, bereik, pagina]) // eslint-disable-line react-hooks/exhaustive-deps
  // Geen verversknop meer: elke 5 minuten vanzelf, zolang het tabblad openstaat.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') laad() }, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [periode, vanafDatum, bereik, pagina]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keuzelijsten: campagnes en advertenties uit spend, bezoek en leads.
  // Nieuwste activiteit bovenaan, zodat een net gestarte campagne vooraan staat.
  const campSleutel = (c) => (schoon(c) || '').toLowerCase()
  const laatst = new Map()
  const noteer = (map, k, naam, dag) => {
    if (!k) return
    const o = map.get(k)
    if (!o || dag > o.dag) map.set(k, { naam, dag: dag || (o?.dag ?? '') })
  }
  ;(data?.dagen || []).filter(d => d.ad).forEach(d => noteer(laatst, campSleutel(d.camp), schoon(d.camp), String(d.dag)))
  ;(data?.spend || []).forEach(r => noteer(laatst, campSleutel(r.camp), schoon(r.camp), ''))
  const campagnes = [...laatst.entries()].map(([k, v]) => ({ k, ...v })).sort((a, b) => (b.dag > a.dag ? 1 : b.dag < a.dag ? -1 : 0))
  // Advertenties per campagne, voor de groepen in de keuzelijst.
  const advPerCamp = new Map()
  ;(data?.dagen || []).filter(d => d.ad).forEach(d => {
    const ck = campSleutel(d.camp), ak = sleutelVan(d.hook)
    if (!ck || ak === '__onbekend') return
    if (!advPerCamp.has(ck)) advPerCamp.set(ck, new Map())
    noteer(advPerCamp.get(ck), ak, schoon(d.hook), String(d.dag))
  })
  const advVan = (ck) => [...(advPerCamp.get(ck) || new Map()).entries()].map(([k, v]) => ({ k, ...v }))
    .sort((a, b) => (b.dag > a.dag ? 1 : b.dag < a.dag ? -1 : 0))
  // Eén keuzelijst: '' = alles, ["campagne"] = hele campagne, ["campagne","advertentie"].
  const keuzeWaarde = campagne ? JSON.stringify(advFilter ? [campagne, advFilter] : [campagne]) : ''
  const kiesFilter = (v) => {
    if (!v) { setCampagne(''); return }
    try { const [c, a] = JSON.parse(v); setCampagne(c); if (a) setAdvFilter(a) } catch { setCampagne('') }
  }

  // /challenge telt alleen advertentieverkeer, /mijn-split alles (eigen bezoek telt nooit mee).
  const alleenAds = P.alleenAds
  const past = (r) => (!alleenAds || r.ad !== false)
    && (!campagne || campSleutel(r.camp) === campagne)
    && (!advFilter || sleutelVan(r.hook) === advFilter)
  const hooks = (data?.hooks || []).filter(past)
  const leads = (data?.leads || []).filter(past)
  const spendRijen = (data?.spend || []).filter(r => past({ ...r, ad: true }))
  // Per dag optellen na het filter, met lege dagen erbij voor de grafiek.
  const perDagMap = new Map()
  ;(data?.dagen || []).filter(past).forEach(d => {
    const k = String(d.dag).slice(0, 10)
    const o = perDagMap.get(k) || { sessies: 0, leads: 0, spend: 0 }
    o.sessies += Number(d.sessies) || 0; o.leads += Number(d.leads) || 0; o.spend += Number(d.spend) || 0
    perDagMap.set(k, o)
  })
  const dagen = []
  if (venster) {
    const eind = new Date(new Date(venster.tot).getTime() - 1)
    for (let d = new Date(venster.van); d <= eind; d.setDate(d.getDate() + 1)) {
      const k = d.toLocaleDateString('sv-SE')
      dagen.push({ dag: k, ...(perDagMap.get(k) || { sessies: 0, leads: 0, spend: 0 }) })
    }
  }

  const T = telOp(hooks)

  // Formulier per scherm: wie kwam door, wie klikte weg, wie werd afgewezen.
  // Volgorde = gemiddelde plek in het formulier.
  const perScherm = new Map()
  ;(data?.stappen || []).filter(past).forEach(r => {
    const o = perScherm.get(r.vraag) || { vraag: r.vraag, door: 0, afgewezen: 0, stapSom: 0, n: 0 }
    const b = Number(r.beantwoord) || 0
    o.door += b; o.afgewezen += Number(r.afgewezen) || 0
    if (r.stap != null) { o.stapSom += Number(r.stap) * Math.max(1, b); o.n += Math.max(1, b) }
    perScherm.set(r.vraag, o)
  })
  const schermen = []
  ;[...perScherm.values()].filter(x => x.door + x.afgewezen > 0)
    .sort((a, b) => (a.n ? a.stapSom / a.n : 99) - (b.n ? b.stapSom / b.n : 99))
    .reduce((vorige, x) => {
      const weg = Math.max(0, vorige - x.door - x.afgewezen)
      schermen.push({ ...x, binnen: vorige, weg, naam: P.schermNaam[x.vraag] || SCHERM_NAAM[x.vraag] || x.vraag })
      return x.door
    }, T.form_start)
  // Na het laatste scherm: wie niet als lead binnenkwam. Afwijzingen die niet
  // aan een vraag hangen (oudere versie) horen hier.
  const laatsteDoor = schermen.length ? schermen[schermen.length - 1].door : T.form_start
  const restAfgewezen = Math.max(0, T.afgewezen - schermen.reduce((n, x) => n + x.afgewezen, 0))
  const eindWeg = Math.max(0, laatsteDoor - leads.length - restAfgewezen)
  if (schermen.length && eindWeg + restAfgewezen > 0) {
    schermen.push({ vraag: '__eind', naam: 'Na het laatste scherm (versturen)', binnen: laatsteDoor, door: leads.length, weg: eindWeg, afgewezen: restAfgewezen })
  }
  const grootsteAfhaker = schermen.reduce((x, y) => (y.weg > (x?.weg || 0) ? y : x), null)
  const weggeklikt = Math.max(0, T.form_start - leads.length - T.afgewezen)
  const spend = spendRijen.reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const klikken = spendRijen.reduce((s, r) => s + (Number(r.klikken) || 0), 0)
  const impressies = spendRijen.reduce((s, r) => s + (Number(r.impressies) || 0), 0)
  const geladen = spendRijen.reduce((s, r) => s + (Number(r.geladen) || 0), 0)
  const ruis = data?.ruis || {}
  const calls = leads.filter(l => l.call)
  const gehouden = leads.filter(l => l.gehouden)
  const sales = leads.filter(l => Number(l.omzet) > 0)
  const saleOmzet = sales.reduce((s, l) => s + Number(l.omzet), 0)
  // Doorgezet naar een verlenging (TrajectModal). Die omzet hoort ook bij de
  // advertentie: telt mee in omzet en ROAS.
  const verlengd = leads.filter(l => l.verlengd)
  const verlengOmzet = verlengd.reduce((s, l) => s + (Number(l.verlenging_omzet) || 0), 0)
  const omzet = saleOmzet + verlengOmzet
  const cpl = leads.length ? spend / leads.length : null
  const roas = spend > 0 ? omzet / spend : null
  const advertenties = perAdvertentie(hooks.filter(h => h.ad), leads.filter(l => l.ad), spendRijen)

  // Lead-fases (cohort: leads uit deze periode, met alles wat daarna gebeurde).
  // Alleen wat op het bord als follow-up vastligt (DM gestuurd, follow-up
  // gelogd), net als op de leadkaart. Dus niet afgeleid uit een reactie.
  const metFollowup = leads.filter(l => l.bericht_gelogd)
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
    const oordeel = richt ? beoordeel(deel, richt.laag ? klikken : basis, richt) : null
    // Hoe ver onder 'goed' (1 = precies goed, lager = verder eronder).
    const score = oordeel && oordeel.rang >= 0 ? (richt.laag ? richt.goed / deel : deel / richt.goed) : null
    return { label, tekst, sub, venster, oordeel, score }
  }
  const FASES = [
    { id: 'advertentie', naam: 'Advertentie', vraag: 'Klikken mensen, en goedkoop?', preview: [['Uitgegeven', euro(spend)], ['CTR', ctr != null ? procent(ctr, 1) : '–', 'Klikratio (CTR)'], ['Per klik', cpc != null ? euro(cpc, true) : '–', 'Kosten per klik']], metingen: [
      M('Klikratio (CTR)', klikken, impressies, RICHT.ctr, ctr != null ? procent(ctr, 1) : '–', 'spend', `goed is 1% of meer · ${klikken} klikken`),
      M('Kosten per klik', cpc, null, RICHT.cpc, cpc != null ? euro(cpc, true) : '–', 'spend', 'goed is onder €0,60'),
    ] },
    { id: 'funnel', naam: 'Funnel', vraag: 'Laten bezoekers hun gegevens achter?', preview: [['Bezoekers', String(T.sessies)], ['Leads', String(leads.length), 'Leads binnen'], ['Conversie', pct(leads.length, T.sessies)]], metingen: [
      M('Bezoekers', T.sessies, null, null, String(T.sessies), 'bezoekers', `gem. ${fmtTijd(T.tijd)} op de pagina`),
      M('Video gestart', T.video_start, T.sessies, RICHT.video, `${T.video_start} · ${pct(T.video_start, T.sessies)}`, 'video', `${pct(T.video_100, T.video_start)} kijkt hem helemaal`),
      M('Op de knop geklikt', T.knop, T.sessies, RICHT.knop, `${T.knop} · ${pct(T.knop, T.sessies)}`, 'formulier', 'van de bezoekers'),
      M('Formulier gestart', T.form_start, T.sessies, RICHT.fstart, `${T.form_start} · ${pct(T.form_start, T.sessies)}`, 'formulier', 'van de bezoekers'),
      M('Leads binnen', leads.length, T.form_start, RICHT.leads, `${leads.length} · ${pct(leads.length, T.form_start)}`, 'gegevens', P.pdf ? 'van wie begon' : `van wie begon · ${T.afgewezen} niet geschikt`),
      ...(P.pdf ? [M('PDF gedownload', T.pdf, leads.length, null, `${T.pdf} · ${pct(T.pdf, leads.length)}`, 'gegevens', 'van de leads')] : []),
    ] },
    { id: 'followup', naam: 'Follow-up', vraag: 'Komen we in contact?', preview: [['In gesprek', String(inGesprek.length), 'In gesprek'], ['Van de leads', pct(inGesprek.length, leads.length), 'In gesprek'], ['Follow-ups', String(metFollowup.length)]], metingen: [
      M('Follow-up gestuurd', metFollowup.length, leads.length, null, `${metFollowup.length} · ${pct(metFollowup.length, leads.length)}`, 'followup', 'gelogd op het bord'),
      M('In gesprek', inGesprek.length, leads.length, RICHT.contact, `${inGesprek.length} · ${pct(inGesprek.length, leads.length)}`, 'followup', 'van de leads reageerde'),
    ] },
    { id: 'call', naam: 'Call', vraag: 'Worden er calls geboekt en gehouden?', preview: [['Ingepland', String(calls.length), 'Call ingepland'], ['Gehad', String(gehouden.length), 'Call gehad'], ['No-show', String(noshows.length)], ['Afgezegd', String(afgezegd.length)]], metingen: [
      M('Call voorgesteld', voorgesteld.length, inGesprek.length, RICHT.voorgesteld, `${voorgesteld.length} · ${pct(voorgesteld.length, inGesprek.length)}`, 'call', 'van wie in gesprek is'),
      M('Call ingepland', calls.length, voorgesteld.length, RICHT.ingepland, `${calls.length} · ${pct(calls.length, voorgesteld.length)}`, 'call', `van de voorstellen · ${nogGepland.length} staat nog`),
      M('Call gehad', gehouden.length, afgerond, RICHT.show, `${gehouden.length} · ${pct(gehouden.length, afgerond)}`, 'call', `kwam opdagen · ${noshows.length} no-show · ${afgezegd.length} afgezegd`),
    ] },
    { id: 'close', naam: 'Close', vraag: 'Wordt er geclosed?', preview: [['Sales', String(sales.length), 'Sale'], ['Verlengd', String(verlengd.length), 'Verlengd'], ['Omzet', euro(omzet)]], metingen: [
      M('Sale', sales.length, gehouden.length, RICHT.close, `${sales.length} · ${pct(sales.length, gehouden.length)}`, 'sale', `van de calls · ${verloren.length} verloren`),
      M('Verlengd', verlengd.length, sales.length, RICHT.verlengd, `${verlengd.length} · ${pct(verlengd.length, sales.length)}`, 'sale', verlengOmzet ? `${euro(verlengOmzet)} aan verlengingen` : 'doorgezet na de challenge'),
      M('Gem. orderwaarde', null, null, null, sales.length ? euro(saleOmzet / sales.length) : '–', 'omzet', `${euro(omzet)} omzet incl. verlengingen`),
    ] },
  ].map(vatFaseSamen)
  const nodigVoorDoel = spend * DOEL_ROAS - omzet

  const kopieer = async () => {
    try { await navigator.clipboard.writeText(linkVoorbeeld(pagina)); setGekopieerd(true); setTimeout(() => setGekopieerd(false), 2000) } catch { /* leeg */ }
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
          <Regel label="Sales" waarde={`${sales.length} · ${euro(saleOmzet)}`} />
          <Regel label="Verlengingen" waarde={`${verlengd.length} · ${euro(verlengOmzet)}`} />
          <Regel label="Omzet totaal" waarde={euro(omzet)} sterk />
          <Regel label="Gemiddeld per sale" waarde={sales.length ? euro(saleOmzet / sales.length) : '–'} />
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
      titel: 'Formulier', sub: `${T.form_start} begonnen · ${pct(leads.length, T.form_start)} laat gegevens achter`,
      inhoud: (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px 18px', marginBottom: 20 }}>
            <Getal label="Begonnen" waarde={T.form_start} sub={`${pct(T.form_start, T.sessies)} van de bezoekers`} />
            <Getal label="Gegevens achtergelaten" waarde={leads.length} kleur={GROEN} sub={`${pct(leads.length, T.form_start)} van wie begon`} />
            <Getal label="Weggeklikt" waarde={weggeklikt} kleur={weggeklikt ? ROOD : '#fff'} sub={`${pct(weggeklikt, T.form_start)} stopte halverwege`} />
            <Getal label="Niet geschikt" waarde={T.afgewezen} kleur={T.afgewezen ? ORANJE : '#fff'} sub={`${pct(T.afgewezen, T.form_start)} afgewezen`} />
          </div>

          <div style={kop}>Per scherm</div>
          {grootsteAfhaker?.weg > 0 && (
            <div style={{ fontSize: '0.86rem', fontWeight: 800, marginBottom: 10 }}>
              Meeste mensen weg bij <span style={{ color: ROOD }}>{grootsteAfhaker.naam}</span>: {grootsteAfhaker.weg} van de {grootsteAfhaker.binnen} ({pct(grootsteAfhaker.weg, grootsteAfhaker.binnen)})
            </div>
          )}
          {(() => {
            const rij = (key, nr, naam, aantal, rechts, kleur = '#fff', nadruk = false) => (
              <div key={key} style={{ padding: '0.5rem 0', borderBottom: LIJN }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: ZWAK, width: 18, flexShrink: 0 }}>{nr}</span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: '0.86rem', fontWeight: 800, color: nadruk ? ROOD : '#fff' }}>{naam}</span>
                  {rechts}
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, minWidth: 30, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{aantal}</span>
                </div>
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginTop: 5, marginLeft: 26, overflow: 'hidden' }}>
                  <div style={{ width: `${T.form_start ? Math.max(2, (aantal / T.form_start) * 100) : 0}%`, height: '100%', borderRadius: 4, background: kleur }} />
                </div>
              </div>
            )
            return (
              <>
                {rij('start', '', 'Formulier geopend', T.form_start, null)}
                {schermen.map((x, i) => rij(x.vraag, i + 1, x.naam, x.door, (
                  <span style={{ display: 'inline-flex', gap: 8, fontSize: '0.76rem', fontWeight: 900, whiteSpace: 'nowrap' }}>
                    {x.weg > 0 && <span style={{ color: ROOD }}>−{x.weg} weg</span>}
                    {x.afgewezen > 0 && <span style={{ color: ORANJE }}>{x.afgewezen} afgewezen</span>}
                  </span>
                ), 'rgba(255,255,255,0.75)', grootsteAfhaker === x && x.weg > 0))}
                {rij('klaar', '', 'Gegevens achtergelaten', leads.length, null, GROEN)}
              </>
            )
          })()}
          {!schermen.length && <Leeg>Nog geen schermen gemeten in deze periode.</Leeg>}
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, marginTop: 10, lineHeight: 1.5 }}>
            Getal rechts = mensen die dat scherm afrondden. Rood = klikte daar weg, oranje = werd daar afgewezen. Valt de periode over twee versies van het formulier, dan staan de schermen van beide versies erin.
          </div>

          <div style={{ height: 22 }} />
          {pagina === '/challenge' && <PrequalAfhaken venster={venster} m alleenNummers />}
        </>
      ),
    },
    gegevens: {
      titel: 'Gegevens achtergelaten', sub: `${leads.length} ${P.pdf ? '' : 'geschikte '}leads, ${pct(leads.length, T.form_start)} van wie begon`,
      inhoud: (
        <>
          {P.pdf && <Regel label="PDF gedownload" waarde={`${T.pdf} van ${leads.length} (${pct(T.pdf, leads.length)})`} sterk />}
          {T.geschikt_video_start > 0 && (
            <Regel label="Keek jouw video op het geschikt-scherm" waarde={`${T.geschikt_video_start} (${T.geschikt_video_klaar} helemaal)`} />
          )}
          <div style={{ ...kop, marginTop: 14 }}>Leads</div>
          {leads.length ? leads.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog geen leads in deze periode.</Leeg>}
          <div style={{ height: 22 }} />
          {pagina === '/challenge' && <PrequalAfgewezen venster={venster} />}
        </>
      ),
    },
    followup: {
      titel: 'Follow-up', sub: `${pct(inGesprek.length, leads.length)} van de leads is in gesprek`,
      inhoud: (
        <>
          <Regel label="Leads" waarde={leads.length} />
          <Regel label="Follow-up gestuurd (gelogd)" waarde={`${metFollowup.length} (${pct(metFollowup.length, leads.length)})`} />
          <Regel label="In gesprek" waarde={`${inGesprek.length} (${pct(inGesprek.length, leads.length)})`} sterk />
          {leads.some(l => !l.contact) && (
            <>
              <div style={{ ...kop, marginTop: 18, color: ORANJE }}>Nog niet in gesprek ({leads.filter(l => !l.contact).length})</div>
              {leads.filter(l => !l.contact).map(l => <LeadRegel key={l.id} l={l} />)}
            </>
          )}
          <div style={{ ...kop, marginTop: 18 }}>In gesprek</div>
          {inGesprek.length ? inGesprek.map(l => <LeadRegel key={l.id} l={l} />) : <Leeg>Nog niemand in gesprek.</Leeg>}
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ZWAK, marginTop: 12, lineHeight: 1.5 }}>
            Follow-up gestuurd telt alleen wat op de leadkaart staat: "DM gestuurd" of een gelogde follow-up. In gesprek telt zodra je een reactie telt of de lead naar een gesprek- of callsectie zet. Een lead die alleen op "DM vandaag" stond telt niet: die lijst zet het bord zelf.
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
          <Regel label="Doorgezet naar verlenging" waarde={`${verlengd.length} (${pct(verlengd.length, sales.length)} van de sales)`} />
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
    <div style={{ padding: m ? '1rem' : '1.5rem 2.5rem', color: '#fff', maxWidth: 1680, margin: '0 auto' }}>
      {fout && <div style={{ padding: '0.7rem 0.9rem', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', fontSize: '0.84rem', fontWeight: 700, marginBottom: '1rem' }}>{fout}</div>}

      {/* ═══ Eén statistiekbalk ═══
          Geld (uitgegeven, per lead) | de lead-stappen met dezelfde iconen en
          kleuren als PeriodStatsBar | resultaat (sales, omzet, ROAS). Telt per
          lead die in de periode binnenkwam wat er daarna gebeurde. Elk getal
          opent zijn detailvenster; het label staat in de tooltip. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 20, flexWrap: m ? 'wrap-reverse' : 'nowrap', marginBottom: m ? 26 : 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flex: '1 1 auto', minWidth: 0, paddingBottom: 2 }}>
        {!P.magnets && [
          [
            { label: 'Uitgegeven', waarde: euro(spend), Icon: Banknote, kleur: '#94a3b8', venster: 'spend' },
            { label: 'Kosten per lead', waarde: euro(cpl), Icon: Coins, kleur: '#94a3b8', venster: 'cpl' },
          ],
          [
            { label: 'Nieuwe leads', waarde: leads.length, Icon: UserPlus, kleur: '#3b82f6', venster: 'gegevens' },
            { label: 'Follow-ups (gelogd op het bord)', waarde: metFollowup.length, Icon: Send, kleur: '#f59e0b', venster: 'followup' },
            { label: 'Reacties (in gesprek)', waarde: inGesprek.length, Icon: MessageCircle, kleur: '#10b981', venster: 'followup' },
            { label: 'Call voorgesteld', waarde: voorgesteld.length, Icon: Phone, kleur: '#a855f7', venster: 'call' },
            { label: 'Call ingepland', waarde: calls.length, Icon: CalendarCheck, kleur: '#06b6d4', venster: 'call' },
            { label: 'Call gevoerd', waarde: gehouden.length, Icon: PhoneCall, kleur: '#10b981', venster: 'call' },
          ],
          [
            { label: 'Sales', waarde: sales.length, Icon: Trophy, kleur: '#FFD700', venster: 'sale' },
            { label: 'Omzet (incl. verlengingen)', waarde: euro(omzet), Icon: Euro, kleur: '#22c55e', venster: 'omzet' },
            { label: `ROAS, doel ${DOEL_ROAS}x`, waarde: roas != null ? `${roas.toFixed(1).replace('.', ',')}x` : '–', doel: `/ ${DOEL_ROAS}x`, Icon: TrendingUp,
              kleur: roas == null ? '#94a3b8' : roas >= DOEL_ROAS ? GROEN : roas >= 1 ? ORANJE : ROOD, gekleurd: roas != null, venster: 'roas' },
            { label: 'Sale verloren', waarde: verloren.length, Icon: XCircle, kleur: '#ef4444', venster: 'sale' },
          ],
        ].map((groep, gi) => (
          <div key={gi} style={{ display: 'flex', alignItems: 'center', gap: m ? 12 : 20, flexShrink: 0 }}>
            {gi > 0 && <span style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.14)', flexShrink: 0 }} />}
            {groep.map(it => (
              <button key={it.label} title={it.label} onClick={() => setInfo(it.venster)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, padding: 0, background: 'none', border: 'none',
                color: '#fff', fontFamily: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
              }}>
                <it.Icon size={15} color={it.kleur} strokeWidth={2.4} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: m ? '0.95rem' : '1.25rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', lineHeight: 1, opacity: laden ? 0.45 : 1, color: it.gekleurd ? it.kleur : '#fff' }}>
                  {it.waarde}
                  {it.doel && <span style={{ fontSize: m ? '0.65rem' : '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}> {it.doel}</span>}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

        {/* Keuzes als één balk met scheidingslijnen, rechts van de cijfers. */}
        <div style={{
          display: 'flex', alignItems: 'center', flexShrink: m ? 1 : 0, width: m ? '100%' : 'auto', minWidth: 0,
          height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.16)', position: 'relative', zIndex: 20,
        }}>
          <Keuzemenu label="Pagina" waarde={pagina} onKies={setPagina} breedte={200}
            stijl={{ flex: '0 0 auto' }}
            weergave={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FileText size={14} strokeWidth={2.6} />{P.label}</span>}
            opties={PAGINAS.map(x => ({ waarde: x.id, label: x.label }))} />
          {!P.magnets && (<>
          <span style={scheiding} />
          <Keuzemenu label="Campagne of advertentie" waarde={keuzeWaarde} onKies={kiesFilter} breedte={320}
            stijl={{ flex: m ? '1 1 0' : '0 1 280px', maxWidth: m ? 'none' : 280 }}
            weergave={(() => {
              if (!campagne) return 'Alle campagnes'
              const c = campagnes.find(x => x.k === campagne)
              const a = advFilter ? advVan(campagne).find(x => x.k === advFilter) : null
              return a ? `${c?.naam || 'Campagne'} · ${a.naam}` : (c?.naam || 'Gekozen campagne')
            })()}
            opties={[
              { waarde: '', label: 'Alle campagnes' },
              ...campagnes.flatMap(c => [
                { kop: c.naam },
                { waarde: JSON.stringify([c.k]), label: 'Hele campagne', in: true },
                ...advVan(c.k).map(a => ({ waarde: JSON.stringify([c.k, a.k]), label: a.naam, in: true })),
              ]),
            ]} />
          </>)}
          <span style={scheiding} />
          {/* Periode en 'vanaf' in één: kies je een datum, dan opent de
              datumkiezer en staat er daarna "Vanaf 10 okt". */}
          <span style={{ position: 'relative', display: 'flex', height: '100%', flex: m ? '1 1 0' : '0 0 auto' }}>
            <Keuzemenu label="Periode" rechts breedte={190} stijl={{ width: '100%' }}
              waarde={periode === 'vanaf' && vanafDatum ? 'vanaf' : periode}
              weergave={periode === 'tussen' && bereik.van && bereik.tot
                ? `${dagLabel(bereik.van)} – ${dagLabel(bereik.tot)}`
                : periode === 'vanaf' && vanafDatum ? `Vanaf ${dagLabel(vanafDatum)}` : (PERIODES.find(p => p.id === periode)?.label || 'Periode')}
              onKies={(v) => {
                if (v === 'tussen' || v === 'tussen_kies') {
                  const vandaag = new Date().toLocaleDateString('sv-SE')
                  setBereikInvoer({ van: bereik.van || vanafDatum || vandaag, tot: bereik.tot || vandaag })
                  setBereikOpen(true)
                  return
                }
                if (v === 'vanaf' || v === 'vanaf_kies') {
                  try { datumRef.current?.showPicker?.() } catch { datumRef.current?.focus?.() }
                  return
                }
                setPeriode(v)
              }}
              opties={[
                ...PERIODES.filter(p => p.id !== 'vanaf' && p.id !== 'tussen').map(p => ({ waarde: p.id, label: p.label })),
                ...(periode === 'vanaf' && vanafDatum
                  ? [{ waarde: 'vanaf', label: `Vanaf ${dagLabel(vanafDatum)}` }, { waarde: 'vanaf_kies', label: 'Andere datum…' }]
                  : [{ waarde: 'vanaf_kies', label: 'Vanaf datum…' }]),
                ...(periode === 'tussen' && bereik.van && bereik.tot
                  ? [{ waarde: 'tussen', label: `${dagLabel(bereik.van)} – ${dagLabel(bereik.tot)}` }, { waarde: 'tussen_kies', label: 'Andere van – tot…' }]
                  : [{ waarde: 'tussen_kies', label: 'Van … tot …' }]),
              ]} />
            <input ref={datumRef} type="date" value={vanafDatum} max={new Date().toLocaleDateString('sv-SE')} tabIndex={-1} aria-hidden="true"
              onChange={e => { kiesVanaf(e.target.value); if (e.target.value) setPeriode('vanaf') }}
              style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: 1, opacity: 0, pointerEvents: 'none', border: 0, padding: 0 }} />
          </span>
          {!P.magnets && (<>
          <span style={scheiding} />
          <button onClick={() => setPaneel('advertenties')} title="Per advertentie" style={{ ...seg, display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
            <Megaphone size={14} strokeWidth={2.6} />{!m && 'Per advertentie'}
          </button>
          </>)}
        </div>
      </div>

      {/* ═══ 2. WAAR LOOPT HET VAST ═══ */}
      <div style={{ marginBottom: m ? 34 : 46 }}>
        {P.magnets ? <MagnetTrechter data={data?.magnet} m={m} laden={laden} /> : <FaseTrechter fases={FASES} m={m} iconen={ICONEN} onMeting={setInfo}
          uitleg="Groen, oranje en rood zijn vuistregels voor koud verkeer uit Meta. Percentage = van de stap ervoor. Leads tellen vanaf de dag dat ze binnenkwamen, met alles wat er daarna gebeurde. Tik op een fase voor de cijfers eronder." />}
      </div>

      {paneel === 'advertenties' && (
        <Venster titel="Per advertentie" sub={`${advertenties.filter(a => !a.onbekend).length} advertenties · tik op een advertentie voor de flow`} m={m} breed onClose={() => setPaneel(null)}>
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
          <div style={{ ...kop, marginTop: 24, display: 'flex', alignItems: 'center', gap: 6 }}><Link2 size={14} strokeWidth={2.6} /> Link voor in de advertentie</div>
          <div style={{ paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <code style={{ flex: 1, fontSize: '0.76rem', color: 'rgba(255,255,255,0.85)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>{linkVoorbeeld(pagina)}</code>
              <button onClick={kopieer} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 0.7rem', borderRadius: 10, background: gekopieerd ? 'rgba(16,185,129,0.15)' : '#fff', color: gekopieerd ? GROEN : '#000', border: 'none', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {gekopieerd ? <Check size={14} /> : <Copy size={14} />} {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, marginTop: 6, lineHeight: 1.45 }}>
              Meta vult {'{{campaign.name}}'} en {'{{ad.name}}'} zelf in. Zo komen bezoekers en spend bij dezelfde advertentie uit.
            </div>
          </div>
        </Venster>
      )}
      {bereikOpen && (
        <Venster titel="Van … tot …" sub="Kies een begin- en einddatum" m={m} onClose={() => setBereikOpen(false)}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '1rem' }}>
            {[['van', 'Van'], ['tot', 'Tot en met']].map(([k, label]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: '1 1 140px', fontSize: '0.78rem', fontWeight: 800, color: ZWAK }}>
                {label}
                <input type="date" value={bereikInvoer[k]} max={new Date().toLocaleDateString('sv-SE')}
                  onChange={e => setBereikInvoer(b => ({ ...b, [k]: e.target.value }))}
                  style={{ height: 44, padding: '0 0.8rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.04)', color: '#fff', fontSize: '0.95rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark' }} />
              </label>
            ))}
            <button
              disabled={!bereikInvoer.van || !bereikInvoer.tot || bereikInvoer.van > bereikInvoer.tot}
              onClick={() => { kiesBereik(bereikInvoer.van, bereikInvoer.tot); setBereikOpen(false) }}
              style={{ height: 44, padding: '0 1.2rem', borderRadius: 10, border: 'none', background: '#fff', color: '#000', fontSize: '0.88rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer', opacity: (!bereikInvoer.van || !bereikInvoer.tot || bereikInvoer.van > bereikInvoer.tot) ? 0.4 : 1 }}>
              Toepassen
            </button>
          </div>
          {bereikInvoer.van && bereikInvoer.tot && bereikInvoer.van > bereikInvoer.tot && (
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: ROOD, paddingBottom: '1rem' }}>De begindatum ligt na de einddatum.</div>
          )}
        </Venster>
      )}
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
