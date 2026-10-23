// src/modules/challenge-ads/MagnetTrechter.jsx
//
// Comment-magnet-trechter (23 okt 2026): reel met "comment WOORD" →
// comments → commenters op het bord → opvolging en reactie → call → sale.
// Dezelfde vijf-fasen-rij als de advertenties (FaseTrechter): Reel, Comment,
// Op het bord, Gesprek, Call & close. Eronder per woord een regel.
//
// Bron: get_magnet_trechter (zie magnet-trechter.sql). Reels en comments uit
// content_ig_media (Instagram-sync, elk uur), leads = call_leads met een magnet
// in lead_magnets_shared (de ochtendronde: screenshot van de commenters →
// Claude → bord). Leads tellen vanaf de dag dat ze op het bord kwamen.

import { useState } from 'react'
import {
  Film, Eye, MessageSquare, UserPlus, Send, MessageCircle, MessagesSquare, PhoneOutgoing, CalendarCheck, PhoneCall, Trophy,
} from 'lucide-react'
import FaseTrechter from './FaseTrechter'
import { GROEN, ZWAK, beoordeel, vatFaseSamen } from './fases'

// Richtwaarden. Comments en reactie op je eigen cijfers (23 okt 2026):
//  - commenters per view: Kersten beantwoordt elke comment één keer, dus
//    commenters = comments / 2. Mediaan 0,75‰, beste kwart vanaf 1,9‰
//    (48 magnet-reels 8-23 okt) → kan beter vanaf 0,75‰, goed vanaf 1,5‰;
//  - reactie op het automatische bericht: jun 18%, jul 27%, aug 16%, sep 10%,
//    okt 6% → goed vanaf 18% (gemiddelde jun-aug), kan beter vanaf 10%.
// Views per reel is een vuistregel; de call-stappen zijn gelijk aan Ads.
const RICHT = {
  views: { goed: 5000, matig: 2000, min: 3 },          // gem. views per reel, basis = aantal reels
  comments: { goed: 0.0015, matig: 0.00075, min: 2000 }, // commenters per view, basis = views
  bord: { goed: 0.45, matig: 0.3, min: 20 },           // nieuwe leads per commenter
  reactie: { goed: 0.18, matig: 0.1, min: 10 },          // van alle leads (iedereen krijgt het automatische bericht)
  voorgesteld: { goed: 0.6, matig: 0.4, min: 3 },
  ingepland: { goed: 0.7, matig: 0.5, min: 3 },
  show: { goed: 0.75, matig: 0.6, min: 3 },
  close: { goed: 0.3, matig: 0.15, min: 3 },
}

const ICONEN = {
  'Magnet-reels': Film, 'Views per reel': Eye, Commenters: MessageSquare, 'Op het bord': UserPlus,
  'Follow-up gestuurd': Send, Reactie: MessageCircle, 'Reacties in periode': MessagesSquare, 'Call voorgesteld': PhoneOutgoing,
  'Call ingepland': CalendarCheck, 'Call gehad': PhoneCall, Sale: Trophy,
}

const getal = (n) => (n == null || !isFinite(n) ? '–' : Math.round(n).toLocaleString('nl-NL'))
const pct = (deel, basis) => (basis > 0 ? `${Math.round((deel / basis) * 100)}%` : '–')
const perDuizend = (deel, basis) => (basis > 0 ? `${((deel / basis) * 1000).toFixed(1).replace('.', ',')}‰` : '–')
const euro = (n) => '€' + Math.round(Number(n) || 0).toLocaleString('nl-NL')

// Alle tellingen voor één set (totaal of één woord). Twee soorten:
//  - reels, comments, nieuwe leads en hun reactie: wat er in de periode
//    binnenkwam (leads = nieuw op het bord in de periode);
//  - stappen (calls, sales): wat er in de periode GEBEURDE bij alle
//    magnet-leads, ook leads van eerder. Een sale komt vaak weken na de
//    comment; per instroom tellen liet zo bijna alle calls en sales weg.
function tel(reels, leads, stappen) {
  const r = reels.reduce((t, x) => ({
    reels: t.reels + (Number(x.reels) || 0),
    views: t.views + (Number(x.views) || 0),
    comments: t.comments + (Number(x.comments) || 0),
  }), { reels: 0, views: 0, comments: 0 })
  // Elke comment krijgt één antwoord van Kersten: de helft zijn commenters.
  r.commenters = Math.round(r.comments / 2)
  const sales = stappen.filter(l => Number(l.omzet) > 0)
  const gehouden = stappen.filter(l => l.gehouden)
  const noshows = stappen.filter(l => l.noshow)
  return {
    ...r,
    leads: leads.length,
    opgevolgd: leads.filter(l => l.bericht).length,
    reactie: leads.filter(l => l.contact).length,
    reactiesPeriode: stappen.filter(l => l.reactie).length,
    voorgesteld: stappen.filter(l => l.voorgesteld).length,
    calls: stappen.filter(l => l.call).length,
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
      preview: [['Commenters', getal(t.commenters), 'Commenters'], ['Per 1.000 views', perDuizend(t.commenters, t.views), 'Commenters']],
      metingen: [
        M('Commenters', t.commenters, t.views, RICHT.comments, `${getal(t.commenters)} · ${perDuizend(t.commenters, t.views)}`, `per 1.000 views · ${getal(t.comments)} comments, de helft is jouw antwoord · goed vanaf 1,5‰`),
      ] },
    { id: 'bord', naam: 'Op het bord', vraag: 'Komen de commenters als lead binnen?',
      preview: [['Nieuwe leads', String(t.leads), 'Op het bord'], ['Van de commenters', pct(t.leads, t.commenters), 'Op het bord']],
      metingen: [
        M('Op het bord', t.leads, t.commenters, RICHT.bord, `${t.leads} · ${pct(t.leads, t.commenters)}`, 'nieuwe leads van de commenters · wie al op het bord stond en opnieuw commentet telt niet mee'),
      ] },
    { id: 'gesprek', naam: 'Gesprek', vraag: 'Reageren ze op het automatische bericht?',
      preview: [['Reactie', pct(t.reactie, t.leads), 'Reactie'], ['Reacties', String(t.reactiesPeriode), 'Reacties in periode'], ['Voorgesteld', String(t.voorgesteld), 'Call voorgesteld']],
      metingen: [
        M('Reactie', t.reactie, t.leads, RICHT.reactie, `${t.reactie} · ${pct(t.reactie, t.leads)}`, 'van de nieuwe leads reageerde op het automatische bericht (+1 reactie) · goed vanaf 18%'),
        M('Reacties in periode', null, null, null, String(t.reactiesPeriode), 'alle magnet-leads die in deze periode reageerden, ook van eerder'),
        M('Call voorgesteld', null, null, null, String(t.voorgesteld), 'in deze periode, alle magnet-leads'),
        M('Follow-up gestuurd', null, null, null, `${t.opgevolgd} · ${pct(t.opgevolgd, t.leads)}`, 'extra bericht gelogd, naast het automatische'),
      ] },
    { id: 'close', naam: 'Call & close', vraag: 'Calls geboekt, gehouden en geclosed?',
      preview: [['Ingepland', String(t.calls), 'Call ingepland'], ['Gehad', String(t.gehouden), 'Call gehad'], ['Sales', String(t.sales), 'Sale']],
      metingen: [
        M('Call ingepland', t.calls, t.voorgesteld, RICHT.ingepland, `${t.calls} · ${pct(t.calls, t.voorgesteld)}`, 'in deze periode · t.o.v. de voorstellen'),
        M('Call gehad', t.gehouden, t.afgerond, RICHT.show, `${t.gehouden} · ${pct(t.gehouden, t.afgerond)}`, `kwam opdagen · ${t.noshows} no-show`),
        M('Sale', t.sales, t.gehouden, RICHT.close, `${t.sales} · ${pct(t.sales, t.gehouden)}`, `van de calls · ${euro(t.omzet)} omzet`),
      ] },
  ].map(vatFaseSamen)
}

export default function MagnetTrechter({ data, m, laden }) {
  // Welk woord; leeg = alle magnets samen.
  const [woord, setWoord] = useState('')
  const reels = data?.reels || []
  const vanaf = data?.vanaf ? new Date(data.vanaf).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' }) : null
  const leads = data?.leads || []
  const stappen = data?.stappen || []

  const woorden = [...new Set([...reels.map(r => r.woord), ...leads.map(l => l.woord), ...stappen.map(l => l.woord)].filter(Boolean))]
  const perWoord = woorden.map(w => ({ woord: w, t: tel(reels.filter(r => r.woord === w), leads.filter(l => l.woord === w), stappen.filter(l => l.woord === w)) }))
    .sort((a, b) => (b.t.views - a.t.views) || (b.t.leads - a.t.leads))

  const gekozen = woord && woorden.includes(woord) ? woord : ''
  const t = gekozen
    ? perWoord.find(x => x.woord === gekozen).t
    : tel(reels, leads, stappen)
  const fases = maakFases(t)

  const kol = m ? 'minmax(0, 1fr) 54px 50px 44px 44px' : 'minmax(0, 1fr) 60px 90px 80px 70px 70px 70px 60px 60px'
  const kopStijl = { fontSize: '0.7rem', fontWeight: 800, color: ZWAK, textAlign: 'right' }

  return (
    <div style={{ opacity: laden ? 0.5 : 1, transition: 'opacity 0.15s' }}>
      <FaseTrechter fases={fases} m={m} iconen={ICONEN} uitleg={<>
        {vanaf ? `Telt vanaf ${vanaf} (sinds dan haalt de app Instagram-data op). ` : ''}{gekozen ? `Alleen ${gekozen}. ` : ''}Tik op een fase voor de cijfers eronder. Percentage = van de stap ervoor; groen, oranje en rood zijn vuistregels. Reels en comments uit Instagram (elk uur bijgewerkt; commenters = comments ÷ 2, want jij beantwoordt elke comment), leads zijn commenters die met dit magnet-woord op het bord kwamen. Calls en sales: wat er in deze periode gebeurde, ook bij magnet-leads van eerder.
      </>} />

      {/* Per woord: welke magnet het goed doet. Tik = trechter van dat woord. */}
      <div style={{ marginTop: m ? 28 : 36 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: ZWAK, marginBottom: 10 }}>Per magnet-woord</div>
        <div style={{ display: 'grid', gridTemplateColumns: kol, gap: 8, paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ ...kopStijl, textAlign: 'left' }}>Woord</span>
          {!m && <span style={kopStijl}>Reels</span>}
          <span style={kopStijl}>Views</span>
          <span style={kopStijl}>{m ? 'Com.' : 'Commenters'}</span>
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
              <span style={{ textAlign: 'right', fontSize: '0.86rem', fontWeight: 800 }}>{x.commenters ? getal(x.commenters) : '–'}</span>
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
