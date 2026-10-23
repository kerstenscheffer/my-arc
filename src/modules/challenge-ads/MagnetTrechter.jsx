// src/modules/challenge-ads/MagnetTrechter.jsx
//
// Comment-magnet-trechter (23 okt 2026): reel met "comment WOORD" →
// comments → commenters op het bord → opvolging en reactie → call → sale.
// Als trechter: elke stap een laag die smaller wordt, met rechts het deel van
// de stap ervoor en een oordeel. Eronder per woord een regel.
//
// Bron: get_magnet_trechter (zie magnet-trechter.sql). Reels en comments uit
// content_ig_media (Instagram-sync, elk uur), leads = call_leads met een magnet
// in lead_magnets_shared (de ochtendronde: screenshot van de commenters →
// Claude → bord). Leads tellen vanaf de dag dat ze op het bord kwamen.

import { useState } from 'react'
import {
  Eye, MessageSquare, UserPlus, Send, MessageCircle, PhoneOutgoing, CalendarCheck, PhoneCall, Trophy,
} from 'lucide-react'
import { GROEN, ZWAK, beoordeel } from './fases'

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
  Views: Eye, Comments: MessageSquare, 'Op het bord': UserPlus,
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

// De trechter van boven naar beneden. Elke stap: aantal, en het deel van de
// stap ervoor met een oordeel. `richt` op dat deel; Views oordeelt op views
// per reel, Comments per view.
function maakStappen(t) {
  const viewsPerReel = t.reels ? t.views / t.reels : null
  const deel = (a, b) => (b ? a / b : null)
  // w = de waarde waarop het oordeel valt, basis = hoeveel daaronder ligt.
  const S = (label, aantal, w, basis, richt, deelTekst, sub) =>
    ({ label, aantal, deelTekst, sub, oordeel: beoordeel(w, basis, richt) })
  return [
    S('Views', t.views, viewsPerReel, t.reels, RICHT.views, `${getal(viewsPerReel)} per reel`, `${t.reels} magnet-reels · goed is ${getal(RICHT.views.goed)} per reel`),
    S('Comments', t.comments, deel(t.comments, t.views), t.views, RICHT.comments, perDuizend(t.comments, t.views), 'van de views · goed is 4‰'),
    S('Op het bord', t.leads, deel(t.leads, t.comments), t.comments, RICHT.bord, pct(t.leads, t.comments), 'van de comments · eigen antwoorden tellen mee'),
    S('Opgevolgd', t.opgevolgd, deel(t.opgevolgd, t.leads), t.leads, RICHT.opgevolgd, pct(t.opgevolgd, t.leads), 'DM of follow-up gelogd op het bord'),
    S('Reactie', t.reactie, deel(t.reactie, t.opgevolgd), t.opgevolgd, RICHT.reactie, pct(t.reactie, t.opgevolgd), 'van wie een bericht kreeg'),
    S('Call voorgesteld', t.voorgesteld, deel(t.voorgesteld, t.reactie), t.reactie, RICHT.voorgesteld, pct(t.voorgesteld, t.reactie), 'van wie reageerde'),
    S('Call ingepland', t.calls, deel(t.calls, t.voorgesteld), t.voorgesteld, RICHT.ingepland, pct(t.calls, t.voorgesteld), 'van de voorstellen'),
    S('Call gehad', t.gehouden, deel(t.gehouden, t.afgerond), t.afgerond, RICHT.show, pct(t.gehouden, t.afgerond), `kwam opdagen · ${t.noshows} no-show`),
    S('Sale', t.sales, deel(t.sales, t.gehouden), t.gehouden, RICHT.close, pct(t.sales, t.gehouden), t.omzet ? `${euro(t.omzet)} omzet` : 'van de calls'),
  ]
}

// Trechter: lagen die per stap smaller worden (vaste stap, niet op schaal —
// van 400.000 views naar een handvol sales zou anders onzichtbaar zijn).
function Trechter({ stappen, m }) {
  const vast = stappen.find(x => x.oordeel?.id === 'slecht') || stappen.find(x => x.oordeel?.id === 'matig') || null
  const n = stappen.length
  const breedte = (i) => 100 - (i * 66) / (n - 1)   // 100% → 34%
  const hoogte = m ? 50 : 56
  return (
    <div style={{ display: 'grid', gridTemplateColumns: m ? 'minmax(0, 1fr) 104px' : 'minmax(0, 1fr) 260px', columnGap: m ? 10 : 24 }}>
      {stappen.map((x, i) => {
        const boven = breedte(i), onder = breedte(Math.min(i + 1, n - 1))
        const inham = ((boven - onder) / 2 / boven) * 100
        const gemeten = x.oordeel && x.oordeel.rang >= 0
        const kleur = gemeten ? x.oordeel.kleur : 'rgba(255,255,255,0.5)'
        const isVast = vast === x
        const Icoon = ICONEN[x.label]
        return [
          <div key={`${x.label}-v`} style={{ display: 'flex', justifyContent: 'center', marginBottom: 3 }}>
            <div style={{
              width: `${boven}%`, height: hoogte, position: 'relative',
              clipPath: i === n - 1 ? 'none' : `polygon(0 0, 100% 0, ${100 - inham}% 100%, ${inham}% 100%)`,
              borderRadius: i === n - 1 ? 10 : (i === 0 ? '10px 10px 0 0' : 0),
              background: isVast ? `${kleur}55` : gemeten ? `${kleur}26` : 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              animation: isVast ? 'trechterPuls 1.8s ease-in-out infinite' : 'none',
            }}>
              {Icoon && !m && <Icoon size={16} strokeWidth={2.4} color={gemeten ? kleur : '#fff'} style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: m ? '1.05rem' : '1.25rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{getal(x.aantal)}</span>
              <span style={{ fontSize: m ? '0.72rem' : '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{x.label}</span>
            </div>
          </div>,
          <div key={`${x.label}-d`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: hoogte, marginBottom: 3, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 900, color: kleur, fontVariantNumeric: 'tabular-nums' }}>{x.deelTekst}</span>
              {gemeten && !m && (
                <span style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, color: kleur, background: `${kleur}1f` }}>
                  {isVast ? 'Hier loopt het vast' : x.oordeel.tekst}
                </span>
              )}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ZWAK, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: m ? 'nowrap' : 'normal' }}>
              {m && isVast ? 'Hier loopt het vast' : x.sub}
            </span>
          </div>,
        ]
      })}
      <style>{'@keyframes trechterPuls { 0%,100% { filter: brightness(1) } 50% { filter: brightness(1.35) } }'}</style>
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
  const stappen = maakStappen(t)

  const kol = m ? 'minmax(0, 1fr) 54px 50px 44px 44px' : 'minmax(0, 1fr) 60px 90px 80px 70px 70px 70px 60px 60px'
  const kopStijl = { fontSize: '0.7rem', fontWeight: 800, color: ZWAK, textAlign: 'right' }

  return (
    <div style={{ opacity: laden ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <Trechter stappen={stappen} m={m} />
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 10, lineHeight: 1.5 }}>
        {gekozen ? `Alleen ${gekozen}. ` : ''}Percentage = van de stap ervoor; groen, oranje en rood zijn vuistregels. Reels en comments uit Instagram (elk uur bijgewerkt), leads zijn commenters die met dit magnet-woord op het bord kwamen. De trechter is niet op schaal.
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
