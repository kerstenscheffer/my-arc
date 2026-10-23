// src/modules/challenge-ads/MagnetTrechter.jsx
//
// Comment-magnet-trechter (23 okt 2026): reel met "comment WOORD" →
// comments → commenters op het bord → opvolging en reactie → call → sale.
// Als trechter van vijf lagen (dezelfde fases als bij Ads): Reel, Comment,
// Op het bord, Gesprek, Call & close. Eronder per woord een regel.
//
// Bron: get_magnet_trechter (zie magnet-trechter.sql). Reels en comments uit
// content_ig_media (Instagram-sync, elk uur), leads = call_leads met een magnet
// in lead_magnets_shared (de ochtendronde: screenshot van de commenters →
// Claude → bord). Leads tellen vanaf de dag dat ze op het bord kwamen.

import { useState } from 'react'
import {
  ChevronDown, Film, Eye, MessageSquare, UserPlus, Send, MessageCircle, PhoneOutgoing, CalendarCheck, PhoneCall, Trophy,
} from 'lucide-react'
import { GROEN, ZWAK, beoordeel, vatFaseSamen, vindVast } from './fases'

// Richtwaarden. Views en comments: vuistregels voor magnet-reels. De rest
// gelijk aan de advertenties waar het dezelfde stap is.
const RICHT = {
  views: { goed: 5000, matig: 2000, min: 3 },          // gem. views per reel, basis = aantal reels
  comments: { goed: 0.004, matig: 0.002, min: 2000 },  // comments per view, basis = views
  bord: { goed: 0.45, matig: 0.3, min: 20 },           // leads per comment (comments tellen je eigen antwoorden mee)
  opgevolgd: { goed: 0.8, matig: 0.5, min: 10 },
  reactie: { goed: 0.25, matig: 0.12, min: 10 },         // van wie een bericht kreeg
  voorgesteld: { goed: 0.6, matig: 0.4, min: 3 },
  ingepland: { goed: 0.7, matig: 0.5, min: 3 },
  show: { goed: 0.75, matig: 0.6, min: 3 },
  close: { goed: 0.3, matig: 0.15, min: 3 },
}

const ICONEN = {
  'Magnet-reels': Film, 'Views per reel': Eye, Comments: MessageSquare, 'Op het bord': UserPlus,
  Opgevolgd: Send, Reactie: MessageCircle, 'Call voorgesteld': PhoneOutgoing,
  'Call ingepland': CalendarCheck, 'Call gehad': PhoneCall, Sale: Trophy,
}

const getal = (n) => (n == null || !isFinite(n) ? '–' : Math.round(n).toLocaleString('nl-NL'))
const pct = (deel, basis) => (basis > 0 ? `${Math.round((deel / basis) * 100)}%` : '–')
const perDuizend = (deel, basis) => (basis > 0 ? `${((deel / basis) * 1000).toFixed(1).replace('.', ',')}‰` : '–')
const euro = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')

// Alle tellingen voor één set reels + leads (totaal of één woord).
function tel(reels, leads) {
  const r = reels.reduce((t, x) => ({
    reels: t.reels + (Number(x.reels) || 0),
    views: t.views + (Number(x.views) || 0),
    comments: t.comments + (Number(x.comments) || 0),
  }), { reels: 0, views: 0, comments: 0 })
  const sales = leads.filter(l => Number(l.omzet) > 0)
  const gehouden = leads.filter(l => l.gehouden)
  const noshows = leads.filter(l => l.noshow)
  return {
    ...r,
    leads: leads.length,
    opgevolgd: leads.filter(l => l.bericht).length,
    reactie: leads.filter(l => l.contact).length,
    voorgesteld: leads.filter(l => l.voorgesteld).length,
    calls: leads.filter(l => l.call).length,
    gehouden: gehouden.length,
    afgerond: gehouden.length + noshows.length,
    noshows: noshows.length,
    sales: sales.length,
    omzet: sales.reduce((s, l) => s + Number(l.omzet), 0),
  }
}

function maakFases(t) {
  const M = (label, deel, basis, richt, tekst, sub, waarde) => {
    const w = waarde ?? (basis ? deel / basis : null)
    const oordeel = richt ? beoordeel(w, basis, richt) : null
    const score = oordeel && oordeel.rang >= 0 ? w / richt.goed : null
    return { label, tekst, sub, oordeel, score }
  }
  const viewsPerReel = t.reels ? t.views / t.reels : null
  return [
    { id: 'reel', naam: 'Reel', vraag: 'Wordt de magnet bekeken?',
      preview: [['Reels', String(t.reels)], ['Views', getal(t.views)], ['Per reel', getal(viewsPerReel), 'Views per reel']],
      metingen: [
        M('Magnet-reels', null, null, null, String(t.reels), 'met "comment WOORD" in de caption'),
        M('Views per reel', null, t.reels, RICHT.views, getal(viewsPerReel), `goed is ${getal(RICHT.views.goed)} of meer · ${getal(t.views)} totaal`, viewsPerReel),
      ] },
    { id: 'comment', naam: 'Comment', vraag: 'Commenten mensen het woord?',
      preview: [['Comments', getal(t.comments), 'Comments'], ['Per 1.000 views', perDuizend(t.comments, t.views), 'Comments']],
      metingen: [
        M('Comments', t.comments, t.views, RICHT.comments, `${getal(t.comments)} · ${perDuizend(t.comments, t.views)}`, 'per 1.000 views · goed is 4‰ of meer'),
      ] },
    { id: 'bord', naam: 'Op het bord', vraag: 'Komen de commenters als lead binnen?',
      preview: [['Leads', String(t.leads), 'Op het bord'], ['Van de comments', pct(t.leads, t.comments), 'Op het bord']],
      metingen: [
        M('Op het bord', t.leads, t.comments, RICHT.bord, `${t.leads} · ${pct(t.leads, t.comments)}`, 'van de comments · Instagram telt je eigen antwoorden mee, dus 100% haal je niet'),
      ] },
    { id: 'gesprek', naam: 'Gesprek', vraag: 'Volgen we op en reageren ze?',
      preview: [['Opgevolgd', pct(t.opgevolgd, t.leads), 'Opgevolgd'], ['Reactie', pct(t.reactie, t.opgevolgd), 'Reactie'], ['Voorgesteld', String(t.voorgesteld), 'Call voorgesteld']],
      metingen: [
        M('Opgevolgd', t.opgevolgd, t.leads, RICHT.opgevolgd, `${t.opgevolgd} · ${pct(t.opgevolgd, t.leads)}`, 'DM of follow-up gelogd op het bord'),
        M('Reactie', t.reactie, t.opgevolgd, RICHT.reactie, `${t.reactie} · ${pct(t.reactie, t.opgevolgd)}`, 'van wie een bericht kreeg'),
        M('Call voorgesteld', t.voorgesteld, t.reactie, RICHT.voorgesteld, `${t.voorgesteld} · ${pct(t.voorgesteld, t.reactie)}`, 'van wie reageerde'),
      ] },
    { id: 'close', naam: 'Call & close', vraag: 'Calls geboekt, gehouden en geclosed?',
      preview: [['Ingepland', String(t.calls), 'Call ingepland'], ['Gehad', String(t.gehouden), 'Call gehad'], ['Sales', String(t.sales), 'Sale']],
      metingen: [
        M('Call ingepland', t.calls, t.voorgesteld, RICHT.ingepland, `${t.calls} · ${pct(t.calls, t.voorgesteld)}`, 'van de voorstellen'),
        M('Call gehad', t.gehouden, t.afgerond, RICHT.show, `${t.gehouden} · ${pct(t.gehouden, t.afgerond)}`, `kwam opdagen · ${t.noshows} no-show`),
        M('Sale', t.sales, t.gehouden, RICHT.close, `${t.sales} · ${pct(t.sales, t.gehouden)}`, `van de calls · ${euro(t.omzet)} omzet`),
      ] },
  ].map(vatFaseSamen)
}

// Trechter van vijf lagen die smaller worden (niet op schaal). In de laag:
// naam, oordeel en de belangrijkste cijfers. De eerste die vastloopt
// pulseert. Tik = de metingen van die fase klappen eronder open.
function Trechter({ fases, m }) {
  const [open, setOpen] = useState(null)
  const vast = vindVast(fases)
  const n = fases.length
  const breedte = (i) => 100 - (i * 44) / (n - 1)   // 100% → 56%
  return (
    <div>
      {fases.map((f, i) => {
        const boven = breedte(i), onder = breedte(Math.min(i + 1, n - 1))
        const inham = i === n - 1 ? 0 : ((boven - onder) / 2 / boven) * 100
        const gemeten = f.oordeel.rang >= 0
        const k = gemeten ? f.oordeel.kleur : 'rgba(255,255,255,0.5)'
        const isVast = vast?.id === f.id
        const isOpen = open === f.id
        const preview = m ? f.preview.slice(0, 2) : f.preview
        return (
          <div key={f.id}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <button onClick={() => setOpen(o => (o === f.id ? null : f.id))} aria-expanded={isOpen} style={{
                width: `${boven}%`, minHeight: m ? 92 : 96, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
                clipPath: `polygon(0 0, 100% 0, ${100 - inham}% 100%, ${inham}% 100%)`,
                borderRadius: i === 0 ? '14px 14px 0 0' : i === n - 1 ? '0 0 14px 14px' : 0,
                background: isOpen ? `${k}40` : isVast ? `${k}33` : gemeten ? `${k}1c` : 'rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: `0.6rem ${inham + 2}%`,
                animation: isVast && !isOpen ? 'trechterPuls 1.8s ease-in-out infinite' : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: gemeten ? k : 'rgba(255,255,255,0.12)', color: gemeten ? '#000' : '#fff', fontSize: '0.78rem', fontWeight: 900,
                  }}>{i + 1}</span>
                  <span style={{ fontSize: m ? '0.92rem' : '1rem', fontWeight: 900 }}>{f.naam}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, color: gemeten ? k : 'rgba(255,255,255,0.7)', background: gemeten ? `${k}26` : 'rgba(255,255,255,0.08)', whiteSpace: 'nowrap' }}>
                    {isVast ? 'Hier loopt het vast' : f.oordeel.tekst}
                  </span>
                  <ChevronDown size={14} strokeWidth={2.6} color="rgba(255,255,255,0.5)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </span>
                <span style={{ display: 'flex', gap: m ? 14 : 22, justifyContent: 'center' }}>
                  {preview.map(([label, waarde, meting]) => {
                    const o = meting ? f.metingen.find(x => x.label === meting)?.oordeel : null
                    return (
                      <span key={label} style={{ textAlign: 'center', minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', color: o && o.rang >= 0 ? o.kleur : '#fff' }}>{waarde}</span>
                        <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: ZWAK, whiteSpace: 'nowrap' }}>{label}</span>
                      </span>
                    )
                  })}
                </span>
              </button>
            </div>

            {/* Metingen van deze fase, onder de laag. */}
            {isOpen && (
              <div style={{ margin: '4px 0 12px', borderRadius: 14, border: `1px solid ${k}55`, background: `${k}0d`, padding: m ? '0.8rem 0.9rem' : '0.95rem 1.2rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: ZWAK, marginBottom: 12 }}>{f.vraag}</div>
                <div style={{ display: 'flex', gap: m ? 18 : 32, flexWrap: 'wrap' }}>
                  {f.metingen.map(x => {
                    const [groot, klein] = String(x.tekst).split(' · ')
                    const kleur = x.oordeel && x.oordeel.rang >= 0 ? x.oordeel.kleur : '#fff'
                    const Icoon = ICONEN[x.label]
                    return (
                      <div key={x.label} style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: m ? 120 : 150, maxWidth: 240 }}>
                        {Icoon && <Icoon size={18} strokeWidth={2.4} color={kleur} />}
                        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontSize: m ? '1.35rem' : '1.5rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: klein ? '#fff' : kleur }}>{groot}</span>
                          {klein && <span style={{ fontSize: '0.8rem', fontWeight: 900, color: kleur }}>{klein}</span>}
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 900 }}>{x.label}</span>
                        {x.sub && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ZWAK, lineHeight: 1.35 }}>{x.sub}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
      <style>{'@keyframes trechterPuls { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.4) } }'}</style>
    </div>
  )
}

export default function MagnetTrechter({ data, m, laden }) {
  // Welk woord; leeg = alle magnets samen.
  const [woord, setWoord] = useState('')
  const reels = data?.reels || []
  const leads = data?.leads || []

  const woorden = [...new Set([...reels.map(r => r.woord), ...leads.map(l => l.woord)].filter(Boolean))]
  const perWoord = woorden.map(w => ({ woord: w, t: tel(reels.filter(r => r.woord === w), leads.filter(l => l.woord === w)) }))
    .sort((a, b) => (b.t.views - a.t.views) || (b.t.leads - a.t.leads))

  const gekozen = woord && woorden.includes(woord) ? woord : ''
  const t = gekozen
    ? perWoord.find(x => x.woord === gekozen).t
    : tel(reels, leads)
  const fases = maakFases(t)

  const kol = m ? 'minmax(0, 1fr) 54px 50px 44px 44px' : 'minmax(0, 1fr) 60px 90px 80px 70px 70px 70px 60px 60px'
  const kopStijl = { fontSize: '0.7rem', fontWeight: 800, color: ZWAK, textAlign: 'right' }

  return (
    <div style={{ opacity: laden ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <Trechter fases={fases} m={m} />
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 10, lineHeight: 1.5 }}>
        {gekozen ? `Alleen ${gekozen}. ` : ''}Tik op een laag voor de cijfers erachter. Percentage = van de stap ervoor; groen, oranje en rood zijn vuistregels. Reels en comments uit Instagram (elk uur bijgewerkt), leads zijn commenters die met dit magnet-woord op het bord kwamen. De trechter is niet op schaal.
      </div>

      {/* Per woord: welke magnet het goed doet. Tik = trechter van dat woord. */}
      <div style={{ marginTop: m ? 28 : 36 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: ZWAK, marginBottom: 10 }}>Per magnet-woord</div>
        <div style={{ display: 'grid', gridTemplateColumns: kol, gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ ...kopStijl, textAlign: 'left' }}>Woord</span>
          {!m && <span style={kopStijl}>Reels</span>}
          <span style={kopStijl}>Views</span>
          <span style={kopStijl}>{m ? 'Com.' : 'Comments'}</span>
          <span style={kopStijl}>Leads</span>
          {!m && <span style={kopStijl}>Reactie</span>}
          {!m && <span style={kopStijl}>Calls</span>}
          <span style={kopStijl}>Sales</span>
          {!m && <span style={kopStijl}>Omzet</span>}
        </div>
        {!laden && perWoord.length === 0 && (
          <div style={{ padding: '1rem 0', fontSize: '0.84rem', fontWeight: 700, color: ZWAK }}>Geen magnet-reels of magnet-leads in deze periode.</div>
        )}
        {perWoord.map(({ woord: w, t: x }) => {
          const aan = gekozen === w
          return (
            <button key={w} onClick={() => setWoord(aan ? '' : w)} aria-pressed={aan} style={{
              width: '100%', display: 'grid', gridTemplateColumns: kol, gap: 8, alignItems: 'center',
              padding: '0.7rem 0', background: aan ? 'rgba(255,255,255,0.06)' : 'none', border: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'inherit', textAlign: 'left',
              cursor: 'pointer', fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent',
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w}</span>
              {!m && <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{x.reels || '–'}</span>}
              <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{x.views ? getal(x.views) : '–'}</span>
              <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{x.comments ? getal(x.comments) : '–'}</span>
              <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{x.leads}</span>
              {!m && <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{x.leads ? pct(x.reactie, x.leads) : '–'}</span>}
              {!m && <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900 }}>{x.calls}</span>}
              <span style={{ textAlign: 'right', fontSize: '0.92rem', fontWeight: 900, color: x.sales ? GROEN : '#fff' }}>{x.sales}</span>
              {!m && <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800, color: x.omzet ? GROEN : '#fff' }}>{x.omzet ? euro(x.omzet) : '–'}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
