// src/modules/business-os/GinoWeek.jsx
//
// De agenda als HUD in de stijl van Gino's bol (31 okt 2026): een urenliniaal
// met streepjes zoals de rand van de bol, per dag een ringwijzer als kop
// (loopt vol naar hoe vol de dag is), afspraken als gloeiende capsules en een
// nu-lijn die door vandaag scant. Puur tekenwerk: data komt van GinoKalender.
//
// items: [{ id, soort, dag:'YYYY-MM-DD', startMin?, eindMin?, tijd?, titel, sub? }]
// soort: call | agenda | content | concept | taak | herinnering

import { useEffect, useMemo, useRef, useState } from 'react'
import { colors } from '../../ui/tokens'

const G = colors.success
const DAGLETTER = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const uur = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

// Overlappende afspraken naast elkaar: per blok een baan en het aantal banen.
function banen(lijst) {
  const uit = lijst.map(b => ({ ...b }))
  uit.sort((a, b) => a.startMin - b.startMin || b.eindMin - a.eindMin)
  let groep = [], eind = -1
  const sluit = () => { const n = Math.max(...groep.map(g => g.baan)) + 1; groep.forEach(g => { g.banen = n }); groep = [] }
  uit.forEach(b => {
    if (groep.length && b.startMin >= eind) { sluit(); eind = -1 }
    const bezet = groep.filter(g => g.eindMin > b.startMin).map(g => g.baan)
    let baan = 0
    while (bezet.includes(baan)) baan++
    b.baan = baan
    groep.push(b)
    eind = Math.max(eind, b.eindMin)
  })
  if (groep.length) sluit()
  return uit
}

function Wijzer({ deel, dag, nr, vandaag, vertraging }) {
  const r = 17, omtrek = 2 * Math.PI * r
  const vol = Math.min(1, deel)
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" style={{ display: 'block', overflow: 'visible' }}>
      {/* streepjes rond, zoals de bol */}
      {Array.from({ length: 24 }, (_, i) => {
        const h = (i / 24) * Math.PI * 2
        const lang = i % 6 === 0
        return (
          <line key={i} x1={23 + Math.sin(h) * 21} y1={23 - Math.cos(h) * 21} x2={23 + Math.sin(h) * (lang ? 18.5 : 19.5)} y2={23 - Math.cos(h) * (lang ? 18.5 : 19.5)}
            stroke={vandaag ? G : 'rgba(255,255,255,0.25)'} strokeWidth={lang ? 1.4 : 0.8} opacity={vandaag ? 0.8 : 1} />
        )
      })}
      <circle cx="23" cy="23" r={r} fill={vandaag ? `${G}26` : 'rgba(255,255,255,0.02)'} stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
      {vol > 0 && (
        <circle cx="23" cy="23" r={r} fill="none" stroke={G} strokeWidth="2" strokeLinecap="round" transform="rotate(-90 23 23)"
          strokeDasharray={omtrek} style={{ '--gw-tot': omtrek * (1 - vol), strokeDashoffset: omtrek * (1 - vol), animation: `gw-ring 1s ease-out ${vertraging}ms both`, filter: `drop-shadow(0 0 3px ${G})` }} />
      )}
      {vandaag && <circle cx="23" cy="23" r="22.5" fill="none" stroke={`${G}77`} strokeWidth="1" strokeDasharray="2 4" style={{ transformOrigin: '23px 23px', animation: 'gw-draai 8s linear infinite' }} />}
      <text x="23" y="20" textAnchor="middle" fill={vandaag ? G : 'rgba(255,255,255,0.5)'} fontSize="7.5" fontWeight="800" letterSpacing="1">{dag}</text>
      <text x="23" y="31.5" textAnchor="middle" fill="#fff" fontSize="12.5" fontWeight="900" style={vandaag ? { filter: `drop-shadow(0 0 4px ${G})` } : null}>{nr}</text>
    </svg>
  )
}

// uitlicht: 'YYYY-MM-DD' die Gino aanwijst; die kolom gloeit, de rest dimt.
export default function GinoWeek({ dagen, items, onKies, hoogte = 380, nu: nuProp = null, uitlicht = null }) {
  const [nu, setNu] = useState(() => nuProp || new Date())
  useEffect(() => {
    if (nuProp) return
    const t = setInterval(() => setNu(new Date()), 60000)
    return () => clearInterval(t)
  }, [nuProp])

  const scrollRef = useRef(null)
  const vandaag = iso(nu)
  const nuMin = nu.getHours() * 60 + nu.getMinutes()

  const perDag = useMemo(() => Object.fromEntries(dagen.map(d => {
    const k = iso(d)
    const lijst = items.filter(it => it.dag === k)
    const getimed = lijst.filter(it => it.startMin != null && (it.soort === 'call' || it.soort === 'agenda' || it.soort === 'herinnering'))
    const los = lijst.filter(it => !getimed.some(g => g.id === it.id))
    return [k, { getimed, los, totaal: lijst.length }]
  })), [dagen, items])

  // Venster: van het eerste tot het laatste blok van de week, minstens 08–21.
  const { van, tot } = useMemo(() => {
    const alle = Object.values(perDag).flatMap(d => d.getimed)
    const a = Math.min(8 * 60, ...alle.map(b => b.startMin))
    const b = Math.max(21 * 60, ...alle.map(b => b.eindMin))
    return { van: Math.floor(a / 60) * 60, tot: Math.min(24 * 60, Math.ceil(b / 60) * 60) }
  }, [perDag])
  const maxDag = Math.max(4, ...Object.values(perDag).map(d => d.totaal))

  const KOP = 84 // wijzer + losse chips
  const ruimteH = Math.max(160, hoogte - KOP)
  // Lens: uren met korte afspraken (calls, losse blokken) krijgen de ruimte,
  // lege uren en lange blokken (een hele dag Paviljoen) worden smal.
  const schaal = useMemo(() => {
    const kort = Object.values(perDag).flatMap(d => d.getimed).filter(b => b.eindMin - b.startMin <= 180)
    const raakt = (b, h) => b.startMin < h + 60 && Math.max(b.eindMin, b.startMin + 30) > h
    const gewicht = []
    for (let h = van; h < tot; h += 60) {
      gewicht.push(kort.some(b => b.soort === 'call' && raakt(b, h)) ? 1 : kort.some(b => raakt(b, h)) ? 0.6 : 0.3)
    }
    // Een call-uur minstens 44 px (een call van 30 min = 22 px); past het niet, dan scrollt het.
    const som = gewicht.reduce((t, w) => t + w, 0)
    const perEenheid = Math.max(44, ruimteH / som)
    const px = gewicht.map(w => w * perEenheid)
    const begin = px.reduce((l, p, i) => { l.push((l[i - 1] ?? 0) + (i ? px[i - 1] : 0)); return l }, [])
    return { px, begin, totaal: px.reduce((t, p) => t + p, 0) }
  }, [perDag, van, tot, ruimteH])
  const lijnH = schaal.totaal
  const y = (m) => {
    const i = Math.min(schaal.px.length - 1, Math.max(0, Math.floor((m - van) / 60)))
    return schaal.begin[i] + ((m - van - i * 60) / 60) * schaal.px[i]
  }
  // Omgekeerd: welke minuut hoort bij px (voor de minimale capsulehoogte).
  const minuutBij = (py) => {
    let i = schaal.begin.findIndex((b, j) => py < b + schaal.px[j])
    if (i < 0) i = schaal.px.length - 1
    return van + i * 60 + ((py - schaal.begin[i]) / schaal.px[i]) * 60
  }
  // Een call van 30 min is op dit formaat maar ~12 px: zichtbaar minstens 22 px,
  // en wat dan overlapt komt naast elkaar.
  const lanen = (lijst) => banen(lijst.map(b => ({ ...b, echtEind: b.eindMin, eindMin: Math.max(b.eindMin, minuutBij(y(b.startMin) + 20)) })))
  // Past de dag niet, open dan rond nu (of het eerste blok).
  const telBlokken = Object.values(perDag).reduce((t, d) => t + d.getimed.length, 0)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !telBlokken || lijnH <= ruimteH) return
    const eerste = Math.min(...Object.values(perDag).flatMap(d => d.getimed).map(b => b.startMin), tot)
    const doel = dagen.some(d => iso(d) === vandaag) ? nuMin - 90 : eerste
    el.scrollTop = Math.max(0, y(Math.max(van, Math.min(tot, doel))))
    // Alleen bij nieuwe data of een andere week, niet bij elke render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telBlokken, dagen[0]?.getTime(), lijnH > ruimteH])
  const uren = []
  for (let m = van; m <= tot; m += 30) uren.push(m)

  return (
    <div ref={scrollRef} className="gw-scroll" style={{ position: 'relative', width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
    <div style={{ position: 'relative', display: 'flex', width: '100%', height: KOP + lijnH }}>
      <style>{`
        @keyframes gw-ring { from { stroke-dashoffset: 107 } to { stroke-dashoffset: var(--gw-tot) } }
        @keyframes gw-draai { to { transform: rotate(360deg) } }
        @keyframes gw-liniaal { from { transform: scaleY(0) } to { transform: scaleY(1) } }
        @keyframes gw-capsule { from { opacity: 0; transform: translateY(14px) scaleY(.6) } to { opacity: 1; transform: none } }
        @keyframes gw-nu { 0%,100% { opacity: .75 } 50% { opacity: 1 } }
        @keyframes gw-stip { 0%,100% { box-shadow: 0 0 6px ${G}, 0 0 0 0 ${G}66 } 50% { box-shadow: 0 0 10px ${G}, 0 0 0 6px ${G}00 } }
        @keyframes gw-scan { from { transform: translateY(-40%) } to { transform: translateY(260%) } }
        @keyframes gw-aanwijs { 0%,100% { box-shadow: 0 0 0 1.5px ${G}, 0 0 28px ${G}55 } 50% { box-shadow: 0 0 0 2px ${G}, 0 0 44px ${G}99 } }
        @keyframes gw-in { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        .gw-cap { transition: transform .15s, box-shadow .15s, background .15s }
        .gw-cap:hover { transform: scale(1.03); z-index: 3 }
        .gw-dag:hover .gw-kolomlijn { opacity: 1 }
        .gw-scroll { scrollbar-width: none } .gw-scroll::-webkit-scrollbar { display: none }
      `}</style>

      {/* Urenliniaal: streepjes per half uur, label per 2 uur */}
      <div style={{ width: 46, flexShrink: 0, position: 'relative' }}>
        <div style={{ position: 'sticky', top: 0, height: KOP, background: '#000', zIndex: 6 }} />
        <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', right: 0, top: 0, width: 1, height: lijnH, background: `linear-gradient(to bottom, ${G}00, ${G}88, ${G}00)`, transformOrigin: 'top', animation: 'gw-liniaal .7s ease-out both' }} />
        {uren.map(m => {
          const heel = m % 60 === 0, label = m % 120 === 0
          return (
            <div key={m} style={{ position: 'absolute', right: 0, top: y(m), display: 'flex', alignItems: 'center', gap: 5, transform: 'translateY(-50%)', animation: `gw-in .3s ease-out ${((m - van) / 60) * 40}ms both` }}>
              {label && <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums', letterSpacing: '.05em' }}>{uur(m)}</span>}
              <span style={{ width: heel ? 8 : 4, height: 1, background: heel ? `${G}aa` : `${G}55` }} />
            </div>
          )
        })}
        </div>
      </div>

      {/* Dagen */}
      <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: `repeat(${dagen.length}, minmax(0, 1fr))`, position: 'relative' }}>
        {/* Uurlijnen over de hele week, heel zacht */}
        <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: KOP, height: lijnH, pointerEvents: 'none' }}>
          {uren.filter(m => m % 60 === 0).map(m => (
            <div key={m} style={{ position: 'absolute', left: 0, right: 0, top: y(m), height: 1, background: 'rgba(255,255,255,0.035)' }} />
          ))}
        </div>

        {dagen.map((d, di) => {
          const k = iso(d)
          const { los, totaal } = perDag[k]
          const getimed = lanen(perDag[k].getimed)
          const isVandaag = k === vandaag
          const verleden = k < vandaag
          return (
            <div key={k} className="gw-dag" onClick={() => onKies?.(k)} style={{
              position: 'relative', cursor: 'pointer', padding: '0 3px', borderRadius: 12, transition: 'opacity .4s',
              opacity: uitlicht ? (k === uitlicht ? 1 : 0.28) : verleden ? 0.5 : 1,
              ...(k === uitlicht ? { boxShadow: `0 0 0 1.5px ${G}, 0 0 28px ${G}55`, background: `${G}10`, animation: 'gw-aanwijs 1.6s ease-in-out 3' } : {}),
            }}>
              {/* kop: wijzer + losse dingen van die dag (content, taken) */}
              <div style={{ height: KOP, position: 'sticky', top: 0, zIndex: 5, background: '#000', margin: '0 -4px', padding: '0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: `gw-in .4s ease-out ${di * 60}ms both` }}>
                <Wijzer deel={totaal / maxDag} dag={DAGLETTER[d.getDay()]} nr={d.getDate()} vandaag={isVandaag} vertraging={200 + di * 80} />
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', maxWidth: '100%', overflow: 'hidden', maxHeight: 38 }}>
                  {los.slice(0, 3).map(it => {
                    const groen = it.soort === 'content' || it.soort === 'concept'
                    return (
                      <span key={it.id} title={it.titel} style={{
                        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 999, letterSpacing: '.03em',
                        color: groen ? G : 'rgba(255,255,255,0.65)',
                        border: it.soort === 'concept' ? `1px dashed ${G}` : `1px solid ${groen ? `${G}66` : 'rgba(255,255,255,0.15)'}`,
                        background: it.soort === 'content' ? `${G}14` : 'transparent',
                        boxShadow: it.soort === 'content' ? `0 0 8px ${G}33` : 'none',
                      }}>
                        {it.soort === 'concept' ? '+ ' : it.soort === 'content' ? '◆ ' : ''}{it.titel}
                      </span>
                    )
                  })}
                  {los.length > 3 && <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>+{los.length - 3}</span>}
                </div>
              </div>

              {/* tijdlijn van de dag */}
              <div style={{ position: 'relative', height: lijnH }}>
                <div className="gw-kolomlijn" style={{
                  position: 'absolute', left: '50%', top: 0, width: 1, height: '100%', opacity: isVandaag ? 1 : 0.5,
                  background: isVandaag ? `linear-gradient(to bottom, ${G}00, ${G}55 15%, ${G}55 85%, ${G}00)` : 'rgba(255,255,255,0.06)',
                  transformOrigin: 'top', animation: `gw-liniaal .7s ease-out ${di * 60}ms both`, transition: 'opacity .2s',
                }} />
                {isVandaag && (
                  <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 10 }}>
                    <div style={{ height: '30%', background: `linear-gradient(to bottom, ${G}00, ${G}14, ${G}00)`, animation: 'gw-scan 4s ease-in-out infinite' }} />
                  </div>
                )}
                {getimed.map((b, bi) => {
                  const call = b.soort === 'call'
                  const herinnering = b.soort === 'herinnering'
                  const top = y(Math.max(van, b.startMin))
                  const h = Math.max(18, y(Math.min(tot, b.eindMin)) - top - 2)
                  const breed = 100 / b.banen
                  const voorbij = isVandaag && b.echtEind <= nuMin
                  const naam = b.titel.replace(/^Call\s*\S\s*/, '')
                  return (
                    <div key={b.id} className="gw-cap" title={`${uur(b.startMin)}${b.echtEind > b.startMin + 15 ? `–${uur(b.echtEind)}` : ''} ${b.titel}`}
                      style={{
                        position: 'absolute', top, height: h, left: `calc(${b.baan * breed}% + 1px)`, width: `calc(${breed}% - 2px)`,
                        borderRadius: 7, overflow: 'hidden', padding: h > 34 ? '4px 7px' : '0 7px', display: 'flex', flexDirection: h > 34 ? 'column' : 'row',
                        alignItems: h > 34 ? 'stretch' : 'center', gap: h > 34 ? 1 : 5,
                        background: call ? `linear-gradient(135deg, ${G}40, ${G}1a)` : herinnering ? 'transparent' : 'rgba(255,255,255,0.05)',
                        border: call ? `1px solid ${G}aa` : herinnering ? `1px dashed ${G}88` : '1px solid rgba(255,255,255,0.14)',
                        borderLeft: `2px solid ${call ? G : herinnering ? `${G}88` : 'rgba(255,255,255,0.4)'}`,
                        boxShadow: call ? `0 0 14px ${G}40, inset 0 0 12px ${G}22` : 'none',
                        opacity: voorbij ? 0.45 : 1,
                        transformOrigin: 'top', animation: `gw-capsule .45s cubic-bezier(.2,.8,.2,1) ${300 + di * 60 + bi * 50}ms both`,
                      }}>
                      <span style={{ fontSize: 9.5, fontWeight: 800, color: call ? G : 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2, flexShrink: 0 }}>{uur(b.startMin)}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{naam}</span>
                    </div>
                  )
                })}
                {/* nu-lijn */}
                {isVandaag && nuMin >= van && nuMin <= tot && (
                  <div style={{ position: 'absolute', left: -3, right: -3, top: y(nuMin), height: 0, zIndex: 4, pointerEvents: 'none', animation: 'gw-nu 2s ease-in-out infinite' }}>
                    <div style={{ height: 1.5, background: G, boxShadow: `0 0 8px ${G}, 0 0 16px ${G}` }} />
                    <div style={{ position: 'absolute', left: -3, top: -4, width: 8, height: 8, borderRadius: '50%', background: G, animation: 'gw-stip 1.6s ease-in-out infinite' }} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
    </div>
  )
}
