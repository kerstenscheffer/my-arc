// src/modules/business-os/GinoContent.jsx
//
// Contentkalender in Gino-stijl (31 okt 2026). Opbouw als de content-checklist
// in de leadbalk: soorten met hun doel als rijen, dagen als kolommen. Wat al
// gedaan is gloeit groen (vol = doel gehaald), wat gepland staat
// (content_items) staat als groene rand met het aantal, Gino's voorstellen
// gestippeld. Onderaan bereik, nieuwe volgers en per dag een ring.
// Puur tekenwerk: data komt van GinoKalender (contentStand.js + planning).

import { useEffect, useMemo, useRef } from 'react'
import { Clapperboard, Image as ImageIcon, CircleDot, Magnet, Youtube, Send } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { CONTENT_SOORTEN, sleutel, soortVanType, dagScore } from './contentStand'

const G = colors.success
const ICOON = { reel: Clapperboard, foto: ImageIcon, story: CircleDot, magnet: Magnet, youtube: Youtube, outreach: Send }
const WEEKLETTER = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z']
const KOLOM = 34
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const kort = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k` : String(n))
const maandagIso = (k) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d) }

function Ring({ deel, vandaag, vertraging, grootte = 24 }) {
  const r = grootte / 2 - 3, omtrek = 2 * Math.PI * r, c = grootte / 2
  const vol = Math.min(1, deel)
  return (
    <svg width={grootte} height={grootte} viewBox={`0 0 ${grootte} ${grootte}`} style={{ display: 'block', overflow: 'visible' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2.5" />
      {vol > 0 && (
        <circle cx={c} cy={c} r={r} fill="none" stroke={vol >= 1 ? G : '#fff'} strokeWidth="2.5" strokeLinecap="round"
          transform={`rotate(-90 ${c} ${c})`} strokeDasharray={omtrek}
          style={{ '--gk-tot': omtrek * (1 - vol), strokeDashoffset: omtrek * (1 - vol), animation: `gk-ring .9s ease-out ${vertraging}ms both`, filter: vol >= 1 || vandaag ? `drop-shadow(0 0 4px ${G})` : 'none' }} />
      )}
    </svg>
  )
}

export default function GinoContent({ dagen, stand, perDag, onKies, isMobile = false }) {
  const scroller = useRef(null)
  const vandaag = iso(new Date())
  const vandaagIdx = dagen.findIndex(d => iso(d) === vandaag)
  const samen = stand?.samen || {}
  const doelen = stand?.doelen || {}
  const mc = stand?.mc || {}
  const doelVan = (s) => doelen[s.id] ?? s.doel

  useEffect(() => {
    const el = scroller.current
    if (el && vandaagIdx > 4) el.scrollTo({ left: (vandaagIdx - 4) * (KOLOM + 4), behavior: 'smooth' })
  }, [vandaagIdx, dagen])

  // Gepland en voorgesteld per dag per soort.
  const plan = useMemo(() => {
    const p = {}
    for (const [k, lijst] of Object.entries(perDag || {})) {
      for (const it of lijst) {
        if (it.soort !== 'content' && it.soort !== 'concept') continue
        const s = soortVanType(it.type)
        const v = (p[sleutel(k, s)] ||= { gepland: 0, concept: 0, klaar: 0 })
        if (it.soort === 'concept') v.concept++
        else if (it.klaar) v.klaar++
        else v.gepland++
      }
    }
    return p
  }, [perDag])

  const weekSom = (k, soort) => {
    const m = new Date(`${maandagIso(k)}T12:00:00`)
    let t = 0
    for (let i = 0; i < 7; i++) { const d = new Date(m); d.setDate(m.getDate() + i); t += samen[sleutel(iso(d), soort)] || 0 }
    return t
  }

  const golf = (i) => Math.abs(i - (vandaagIdx >= 0 ? vandaagIdx : 0)) * 26
  const scoreVandaag = vandaagIdx >= 0 ? dagScore(vandaag, samen, doelen) : null
  const labelB = isMobile ? 40 : 150
  const extra = [
    { id: 'bereik', label: 'Bereik', waarde: (k) => mc[k]?.bereik },
    { id: 'volgers', label: 'Nieuwe volgers', waarde: (k) => mc[k]?.volgers, plus: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Vandaag: ring + wat er nog moet */}
      {scoreVandaag != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, flexShrink: 0, animation: 'gk-blad .4s ease-out both' }}>
          <div style={{ position: 'relative', width: 42, height: 42 }}>
            <Ring deel={scoreVandaag} vandaag grootte={42} vertraging={200} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: scoreVandaag >= 1 ? G : '#fff' }}>
              {Math.round(scoreVandaag * 100)}%
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>Vandaag</div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {CONTENT_SOORTEN.filter(s => !s.week).map(s => `${samen[sleutel(vandaag, s.id)] || 0}/${doelVan(s)} ${s.label.toLowerCase()}`).join(' · ')}
            </div>
          </div>
        </div>
      )}

      <div className="gk-scroll" style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-start', overflowY: 'auto' }}>
        {/* Labels */}
        <div style={{ width: labelB, flexShrink: 0, paddingTop: 40 }}>
          {CONTENT_SOORTEN.map((s, ri) => {
            const Icoon = ICOON[s.id]
            return (
              <div key={s.id} style={{ height: KOLOM + 4, display: 'flex', alignItems: 'center', gap: 8, animation: `gk-rij .35s ease-out ${ri * 50}ms both` }}>
                <Icoon size={15} strokeWidth={2.4} style={{ color: G, flexShrink: 0, filter: `drop-shadow(0 0 4px ${G}88)` }} />
                {!isMobile && (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{s.label}</span>
                    <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>{s.week ? `${doelVan(s)} p/w` : `doel ${doelVan(s)}`}</span>
                  </>
                )}
              </div>
            )
          })}
          {!isMobile && extra.map(e => (
            <div key={e.id} style={{ height: 22, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{e.label}</div>
          ))}
          <div style={{ height: 34, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{isMobile ? '' : 'Dag'}</div>
        </div>

        {/* Dagen */}
        <div ref={scroller} className="gk-scroll" style={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden' }}>
          <div style={{ display: 'flex', gap: 4, width: 'max-content', position: 'relative', paddingRight: 8 }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 3 }}>
              <div style={{ width: '40%', height: '100%', background: `linear-gradient(90deg, transparent, ${G}22, transparent)`, animation: 'gk-scan 1.4s ease-out .2s both' }} />
            </div>
            {dagen.map((d, i) => {
              const k = iso(d)
              const isVandaag = k === vandaag
              const toekomst = k > vandaag
              return (
                <div key={k} onClick={() => onKies?.(k)} style={{
                  width: KOLOM, flexShrink: 0, cursor: 'pointer', borderRadius: 10,
                  background: isVandaag ? `${G}14` : 'transparent', boxShadow: isVandaag ? `inset 0 0 0 1px ${G}55, 0 0 24px ${G}22` : 'none',
                }}>
                  <div style={{ height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: isVandaag ? G : 'rgba(255,255,255,0.4)' }}>{WEEKLETTER[d.getDay()]}</span>
                    <span style={{ fontSize: 15, fontWeight: 900, color: isVandaag ? G : '#fff', textShadow: isVandaag ? `0 0 10px ${G}` : 'none' }}>{d.getDate()}</span>
                  </div>
                  {CONTENT_SOORTEN.map(s => {
                    const doel = doelVan(s)
                    const n = samen[sleutel(k, s.id)] || 0
                    const p = plan[sleutel(k, s.id)]
                    const weekVol = s.week && doel > 0 && weekSom(k, s.id) >= doel
                    const gehaald = s.week ? weekVol : doel > 0 && n >= doel
                    const toonGepland = toekomst || (isVandaag && n === 0)
                    const gepland = toonGepland && p?.gepland ? p.gepland : 0
                    const voorstel = toonGepland && !gepland && p?.concept ? p.concept : 0
                    let stijl
                    if (!toekomst && (n > 0 || weekVol)) {
                      stijl = gehaald
                        ? { background: G, color: '#000', boxShadow: `0 0 12px ${G}66` }
                        : { background: `${G}33`, color: '#fff' }
                    } else if (gepland) {
                      stijl = { background: `${G}12`, border: `1.5px solid ${G}`, color: G, boxShadow: `0 0 10px ${G}33` }
                    } else if (voorstel) {
                      stijl = { border: `1.5px dashed ${G}`, color: G }
                    } else {
                      stijl = { background: toekomst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                    }
                    const inhoud = !toekomst && n > 0 ? n : gepland ? gepland : voorstel ? '+' : ''
                    return (
                      <div key={s.id} style={{ height: KOLOM + 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="gk-vak" title={gepland ? `${gepland} gepland` : voorstel ? 'Voorstel van Gino' : n ? `${n}/${doel}` : undefined} style={{
                          width: KOLOM, height: KOLOM, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: String(inhoud).length > 2 ? 10.5 : 13, fontWeight: 900, boxSizing: 'border-box', ...stijl,
                          animation: voorstel
                            ? `gk-cel .35s ease-out ${golf(i)}ms both, gk-puls 1.8s ease-in-out ${golf(i) + 400}ms infinite`
                            : `gk-cel .35s ease-out ${golf(i)}ms both`,
                        }}>
                          {inhoud}
                        </div>
                      </div>
                    )
                  })}
                  {!isMobile && extra.map(e => {
                    const w = e.waarde(k)
                    return (
                      <div key={e.id} style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: w ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)', fontVariantNumeric: 'tabular-nums' }}>
                        {w ? `${e.plus ? '+' : ''}${kort(w)}` : '·'}
                      </div>
                    )
                  })}
                  <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!toekomst && <Ring deel={dagScore(k, samen, doelen)} vandaag={isVandaag} vertraging={golf(i) + 200} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
