// src/modules/business-os/GinoTijd.jsx
//
// Waar Kerstens tijd achter de Mac heen gaat (2 nov 2026), in de stijl van
// Gino's bol. Gino meet elke minuut welke app/site voorop staat
// (scripts/gino-tijd.mjs → business_os_tijd); business_os_tijd_overzicht deelt
// in, met Gino's eigen regels voorrang.
//
//   ┌ geldtijd-ring ┐ ┌ per categorie ┐ ┌ grootste tijdvreters ┐
//   └──────────── per dag van de week, gestapeld ─────────────┘
//
// Geldtijd = sales + calls + coaching + content: tijd die omzet oplevert.
// focus (van Gino): een categorie en/of een datum licht op, de rest dimt.

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const G = colors.success
const TIJD_SOORTEN = [
  ['sales', 'Sales', true],
  ['calls', 'Calls', true],
  ['coaching', 'Coaching', true],
  ['content', 'Content', true],
  ['bouwen', 'Bouwen', false],
  ['admin', 'Admin', false],
  ['social', 'Social', false],
  ['afleiding', 'Afleiding', false],
  ['overig', 'Overig', false],
]
const GELD = new Set(TIJD_SOORTEN.filter(s => s[2]).map(s => s[0]))
const LABEL = Object.fromEntries(TIJD_SOORTEN.map(([k, l]) => [k, l]))
// Geld in groentinten, de rest in grijzen: in één oogopslag wat iets oplevert.
const KLEUR = {
  sales: G, calls: '#4ade80', coaching: '#16a34a', content: '#86efac',
  bouwen: 'rgba(255,255,255,0.55)', admin: 'rgba(255,255,255,0.38)', social: 'rgba(255,255,255,0.26)',
  afleiding: 'rgba(255,255,255,0.18)', overig: 'rgba(255,255,255,0.12)',
}
const WEEKDAG = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const uren = (min) => (min >= 60 ? `${Math.floor(min / 60)}u${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}` : `${min}m`)

function GeldRing({ geld, totaal }) {
  const deel = totaal ? geld / totaal : 0
  const R = 58, C = 72, omtrek = 2 * Math.PI * R
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="144" height="144" viewBox="0 0 144 144" style={{ flexShrink: 0, overflow: 'visible' }}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
        <circle cx={C} cy={C} r={R} fill="none" stroke={G} strokeWidth="6" strokeLinecap="round" transform={`rotate(-90 ${C} ${C})`}
          strokeDasharray={omtrek} style={{ strokeDashoffset: omtrek * (1 - deel), transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.8,.2,1)', filter: `drop-shadow(0 0 6px ${G})` }} />
        <circle cx={C} cy={C} r="50" fill="none" stroke={`${G}55`} strokeWidth="1" strokeDasharray="3 6" style={{ transformOrigin: `${C}px ${C}px`, animation: 'gt-draai 14s linear infinite' }} />
        <text x={C} y={C + 8} textAnchor="middle" fill="#fff" fontSize="24" fontWeight="900">{Math.round(deel * 100)}%</text>
      </svg>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, textShadow: `0 0 24px ${G}44` }}>{uren(geld)}</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 8, lineHeight: 1.5 }}>
          geldtijd van {uren(totaal)}<br />achter de Mac
        </div>
      </div>
    </div>
  )
}

export default function GinoTijd({ dagen, focus, isMobile = false }) {
  const [data, setData] = useState(null)
  const van = iso(dagen[0]), tot = iso(dagen[dagen.length - 1])
  useEffect(() => {
    let weg = false
    setData(null)
    supabase.rpc('business_os_tijd_overzicht', { van, tot })
      .then(({ data: d }) => { if (!weg) setData(d || { dagen: [], bronnen: [], totaal: 0 }) }, () => { if (!weg) setData({ dagen: [], bronnen: [], totaal: 0 }) })
    return () => { weg = true }
  }, [van, tot])

  const f = useMemo(() => {
    const fs = focus ? [...focus] : []
    return { soort: fs.find(x => LABEL[x]) || null, dag: fs.find(x => /^\d{4}-\d{2}-\d{2}$/.test(x)) || null }
  }, [focus])

  const som = useMemo(() => {
    const perSoort = {}, perDag = {}
    for (const r of data?.dagen || []) {
      perSoort[r.categorie] = (perSoort[r.categorie] || 0) + r.minuten
      ;(perDag[r.dag] ||= {})[r.categorie] = r.minuten
    }
    const totaal = data?.totaal || 0
    const geld = Object.entries(perSoort).filter(([k]) => GELD.has(k)).reduce((a, [, v]) => a + v, 0)
    const maxDag = Math.max(60, ...Object.values(perDag).map(d => Object.values(d).reduce((a, b) => a + b, 0)))
    const vreters = (data?.bronnen || []).filter(b => !GELD.has(b.categorie)).slice(0, 6)
    return { perSoort, perDag, totaal, geld, maxDag, vreters }
  }, [data])

  const dim = (soort, dag) => (f.soort && soort && soort !== f.soort) || (f.dag && dag && dag !== f.dag) ? 0.22 : 1
  const vandaag = iso(new Date())

  if (!data) return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', border: `1.5px dashed ${G}`, animation: 'gt-draai 1.2s linear infinite' }} />
      <style>{'@keyframes gt-draai { to { transform: rotate(360deg) } }'}</style>
    </div>
  )

  if (!som.totaal) return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
        Gino meet vanaf nu elke minuut waar je tijd achter de Mac heen gaat.<br />
        <span style={{ color: '#fff' }}>Zodra er een paar uur in staat, zie je hier waar de winst zit.</span>
      </div>
    </div>
  )

  const soorten = TIJD_SOORTEN.filter(([k]) => som.perSoort[k])
  const maxSoort = Math.max(...soorten.map(([k]) => som.perSoort[k]))

  return (
    <div className="gk-scroll" style={{ position: 'absolute', inset: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22, padding: '6px 4px 4px' }}>
      <style>{`
        @keyframes gt-draai { to { transform: rotate(360deg) } }
        @keyframes gt-groei { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes gt-breed { from { transform: scaleX(0) } to { transform: scaleX(1) } }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr 1fr', gap: isMobile ? 20 : 36, alignItems: 'start' }}>
        <GeldRing geld={som.geld} totaal={som.totaal} />

        {/* Per categorie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          {soorten.map(([k, l], i) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '78px 1fr 52px', alignItems: 'center', gap: 10, opacity: dim(k, null), transition: 'opacity .3s' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: GELD.has(k) ? '#fff' : 'rgba(255,255,255,0.6)' }}>{l}</span>
              <span style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <span style={{
                  display: 'block', height: '100%', width: `${(som.perSoort[k] / maxSoort) * 100}%`, borderRadius: 3, background: KLEUR[k],
                  boxShadow: GELD.has(k) ? `0 0 8px ${G}88` : 'none', transformOrigin: 'left', animation: `gt-breed .7s cubic-bezier(.2,.8,.2,1) ${i * 60}ms both`,
                }} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{uren(som.perSoort[k])}</span>
            </div>
          ))}
        </div>

        {/* Grootste tijdvreters: waar de winst zit */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Grootste tijdvreters</div>
          {som.vreters.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Alles was geldtijd.</div>}
          {som.vreters.map(b => (
            <div key={`${b.bron}|${b.categorie}`} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: dim(b.categorie, null), transition: 'opacity .3s' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: KLEUR[b.categorie], flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.bron}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{uren(b.minuten)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per dag, gestapeld: geld onderin */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${dagen.length}, 1fr)`, gap: isMobile ? 6 : 14, alignItems: 'end', minHeight: 150, flex: 1 }}>
        {dagen.map((d, i) => {
          const k = iso(d)
          const dag = som.perDag[k] || {}
          const tot = Object.values(dag).reduce((a, b) => a + b, 0)
          const geld = Object.entries(dag).filter(([c]) => GELD.has(c)).reduce((a, [, v]) => a + v, 0)
          return (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end', opacity: dim(null, k), transition: 'opacity .3s' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: tot ? '#fff' : 'rgba(255,255,255,0.3)' }}>{tot ? uren(tot) : '–'}</span>
              <div title={tot ? `${uren(geld)} geldtijd` : ''} style={{
                width: '100%', maxWidth: 46, height: `${(tot / som.maxDag) * 120}px`, minHeight: tot ? 3 : 0, display: 'flex', flexDirection: 'column-reverse',
                borderRadius: 6, overflow: 'hidden', transformOrigin: 'bottom', animation: `gt-groei .7s cubic-bezier(.2,.8,.2,1) ${i * 50}ms both`,
              }}>
                {TIJD_SOORTEN.filter(([c]) => dag[c]).map(([c]) => (
                  <span key={c} style={{ flex: dag[c], background: KLEUR[c], opacity: f.soort && c !== f.soort ? 0.25 : 1 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: k === vandaag ? G : 'rgba(255,255,255,0.55)' }}>{WEEKDAG[i]} {d.getDate()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
