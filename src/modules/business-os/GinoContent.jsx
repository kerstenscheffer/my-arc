// src/modules/business-os/GinoContent.jsx
//
// Contentkalender in Gino-stijl (31 okt 2026). Opbouw als de content-checklist
// in de leadbalk: soorten met hun doel als rijen, dagen als kolommen. Wat al
// gedaan is gloeit groen (vol = doel gehaald). Geplande content_items krijgen
// hun stand (contentStatus.jsx): draft grijs gestippeld, ingepland groene rand,
// mislukt rood; Gino's voorstellen groen gestippeld. Bovenaan een legenda,
// per dag een rij met het aantal per status. Onderaan bereik, nieuwe volgers en per dag een ring.
// Puur tekenwerk: data komt van GinoKalender (contentStand.js + planning).
//
// Klikken (5 nov 2026): dagkop en lege vakjes openen het dagoverzicht. Een vakje
// met 1 item opent dat item, met meer items een lijstje van precies die rij en
// die dag. Item openen = de draft in Metricool als die er is, anders de preview.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clapperboard, Image as ImageIcon, CircleDot, Magnet, Youtube, Send, X } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { CONTENT_SOORTEN, sleutel, soortVanType, dagScore, vakTelling } from './contentStand'
import { STANDEN, standVak, kortGetal, openContent } from './contentStatusData'
import { StandLegenda, StandChip } from './contentStatus'

const G = colors.success
const ICOON = { reel: Clapperboard, foto: ImageIcon, story: CircleDot, magnet: Magnet, youtube: Youtube, outreach: Send }
const WEEKLETTER = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z']
const KOLOM = 34
const STAND_H = 54 // rij met per dag het aantal per status
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const kort = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace('.', ',')}k` : String(n))
const maandagIso = (k) => { const d = new Date(`${k}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d) }
const openItem = (it) => {
  if (it.metricoolLink) window.open(it.metricoolLink, '_blank', 'noopener,noreferrer')
  else if (it.contentId) openContent(it.contentId)
}
const opTijd = (a, b) => (a.tijd ? (b.tijd ? a.tijd.localeCompare(b.tijd, undefined, { numeric: true }) : -1) : (b.tijd ? 1 : 0))

// Lijstje van één vakje. Blijft open na een klik, zodat je de volgende draft kunt pakken.
function VakLijst({ soort, dag, telling, onSluit }) {
  useEffect(() => {
    const op = (e) => { if (e.key === 'Escape') onSluit() }
    window.addEventListener('keydown', op)
    return () => window.removeEventListener('keydown', op)
  }, [onSluit])
  const titel = new Date(`${dag}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div onClick={onSluit} style={{ position: 'absolute', inset: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 460, maxHeight: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', padding: 14,
        background: '#0a0a0a', border: `1px solid ${G}55`, borderRadius: 14, boxShadow: `0 0 32px ${G}1f`, animation: 'gk-blad .2s ease-out both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{soort.label} · {telling.getal}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{titel}</div>
          </div>
          <button type="button" onClick={onSluit} aria-label="Sluiten" style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: '50%', border: `1px solid ${G}44`, background: 'transparent', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><X size={16} strokeWidth={2.6} /></button>
        </div>
        <div className="gk-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {[...telling.telt].sort(opTijd).map(it => (
            <button key={it.id} type="button" onClick={() => openItem(it)} style={{
              width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', cursor: 'pointer', textAlign: 'left',
              background: 'none', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', fontFamily: 'inherit', color: '#fff',
            }}>
              <span style={{ width: 40, flexShrink: 0, fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{it.tijd || ''}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere' }}>{it.titel}</span>
              <span style={{ flexShrink: 0 }}><StandChip stand={it.stand || 'draft'} /></span>
            </button>
          ))}
          {telling.los > 0 && (
            <div style={{ padding: '10px 0 2px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
              + {telling.los} geplaatst zonder gepland item
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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

// focus: Set met soort-id's ('reel', 'story', …) en/of dagen ('YYYY-MM-DD') die Gino aanwijst.
export default function GinoContent({ dagen, stand, perDag, onKies, isMobile = false, focus = null }) {
  const scroller = useRef(null)
  const [vak, setVak] = useState(null) // { dag, soort } van het open lijstje
  const sluitVak = useCallback(() => setVak(null), [])
  useEffect(() => { setVak(null) }, [dagen])
  const vandaag = iso(new Date())
  const vandaagIdx = dagen.findIndex(d => iso(d) === vandaag)
  const samen = stand?.samen || {}
  const doelen = stand?.doelen || {}
  const mc = stand?.mc || {}
  const perStand = stand?.perStand || {}
  const doelVan = (s) => doelen[s.id] ?? s.doel
  const focusSoort = focus && CONTENT_SOORTEN.some(s => focus.has(s.id))
  const focusDag = focus && [...focus].some(f => /^\d{4}-\d{2}-\d{2}$/.test(f))
  const licht = (soort, dag) => {
    if (!focus) return 1
    const s = !focusSoort || focus.has(soort)
    const d = !focusDag || focus.has(dag)
    return s && d ? 1 : 0.22
  }

  useEffect(() => {
    const el = scroller.current
    const doelIdx = focusDag ? dagen.findIndex(d => focus.has(iso(d))) : -1
    if (el && doelIdx >= 0) { el.scrollTo({ left: Math.max(0, doelIdx - 4) * (KOLOM + 4), behavior: 'smooth' }); return }
    if (el && vandaagIdx > 4) el.scrollTo({ left: (vandaagIdx - 4) * (KOLOM + 4), behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vandaagIdx, dagen, focus])

  // Gepland en voorgesteld per dag per soort.
  const plan = useMemo(() => {
    const p = {}
    for (const [k, lijst] of Object.entries(perDag || {})) {
      for (const it of lijst) {
        if (it.soort !== 'content' && it.soort !== 'concept') continue
        const s = soortVanType(it.type, it.woord)
        const v = (p[sleutel(k, s)] ||= { draft: 0, ingepland: 0, gepost: 0, mislukt: 0, concept: 0, items: [] })
        if (it.soort === 'concept') v.concept++
        else { v[it.stand || 'draft']++; v.items.push(it) }
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
      <StandLegenda style={{ paddingBottom: 10, flexShrink: 0 }} />
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
          <div style={{ height: STAND_H, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{isMobile ? '' : 'Per status'}</div>
          {CONTENT_SOORTEN.map((s, ri) => {
            const Icoon = ICOON[s.id]
            return (
              <div key={s.id} style={{ height: KOLOM + 4, display: 'flex', alignItems: 'center', gap: 8, animation: `gk-rij .35s ease-out ${ri * 50}ms both`, opacity: focusSoort && !focus.has(s.id) ? 0.3 : 1, transition: 'opacity .4s', textShadow: focusSoort && focus.has(s.id) ? `0 0 12px ${G}` : 'none' }}>
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
                  {(() => {
                    const r = perStand[k]
                    const tekst = r ? STANDEN.filter(s => r[s.id]).map(s => `${r[s.id]} ${s.label.toLowerCase()}`).join(' · ') + (r.views ? ` · ${kortGetal(r.views)} views` : '') : ''
                    return (
                      <div title={tekst || undefined} style={{ height: STAND_H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        {STANDEN.filter(s => r?.[s.id]).map(s => (
                          <span key={s.id} style={{ minWidth: 22, height: 11, padding: '0 3px', borderRadius: 4, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, lineHeight: 1, borderWidth: 1, ...standVak(s.id) }}>
                            {r[s.id]}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                  {CONTENT_SOORTEN.map(s => {
                    const doel = doelVan(s)
                    const n = samen[sleutel(k, s.id)] || 0
                    const p = plan[sleutel(k, s.id)]
                    const weekVol = s.week && doel > 0 && weekSom(k, s.id) >= doel
                    const gehaald = s.week ? weekVol : doel > 0 && n >= doel
                    const toonGepland = toekomst || (isVandaag && n === 0)
                    const mislukt = p?.mislukt || 0
                    const ingepland = toonGepland && p?.ingepland ? p.ingepland : 0
                    const draft = toonGepland && !ingepland && p?.draft ? p.draft : 0
                    const voorstel = toonGepland && !ingepland && !draft && p?.concept ? p.concept : 0
                    let stijl
                    if (mislukt) {
                      stijl = standVak('mislukt')
                    } else if (!toekomst && (n > 0 || weekVol)) {
                      stijl = gehaald
                        ? { background: G, color: '#000', boxShadow: `0 0 12px ${G}66` }
                        : { background: `${G}33`, color: '#fff' }
                    } else if (ingepland) {
                      stijl = { ...standVak('ingepland'), boxShadow: `0 0 10px ${G}33` }
                    } else if (draft) {
                      stijl = standVak('draft')
                    } else if (voorstel) {
                      stijl = { border: `1.5px dashed ${G}`, color: G }
                    } else {
                      stijl = { background: toekomst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }
                    }
                    // Het getal is wat de klik-lijst toont: zie vakTelling.
                    const telling = vakTelling(p?.items, k, vandaag, n)
                    const inhoud = telling.getal || (voorstel ? '+' : '')
                    const uitleg = telling.telt.length
                      ? [...STANDEN.filter(st => telling.telt.some(it => it.stand === st.id)).map(st => `${telling.telt.filter(it => it.stand === st.id).length} ${st.label.toLowerCase()}`), ...(telling.los ? [`${telling.los} los geplaatst`] : [])].join(' · ')
                      : voorstel ? 'Voorstel van Gino' : n ? `${n}/${doel}` : undefined
                    // Zonder gepland item: niet afvangen, de kolom opent het dagoverzicht.
                    const opVak = (e) => {
                      if (!telling.telt.length) return
                      e.stopPropagation()
                      if (telling.getal === 1) openItem(telling.telt[0])
                      else setVak({ dag: k, soort: s.id })
                    }
                    return (
                      <div key={s.id} style={{ height: KOLOM + 4, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: licht(s.id, k), transition: 'opacity .4s' }}>
                        <div className="gk-vak" onClick={opVak} title={uitleg} style={{
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
      {vak && (
        <VakLijst
          soort={CONTENT_SOORTEN.find(s => s.id === vak.soort)}
          dag={vak.dag}
          telling={vakTelling(plan[sleutel(vak.dag, vak.soort)]?.items, vak.dag, vandaag, samen[sleutel(vak.dag, vak.soort)] || 0)}
          onSluit={sluitVak}
        />
      )}
    </div>
  )
}
