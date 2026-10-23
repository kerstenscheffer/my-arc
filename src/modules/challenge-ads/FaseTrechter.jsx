// src/modules/challenge-ads/FaseTrechter.jsx
//
// De vijf fases als één balk met scheidingslijnen en pijltjes; de eerste die
// vastloopt pulseert.
// Een tik opent de metingen van die fase eronder. Uit ChallengeAdsDashboard
// gehaald (23 okt 2026) zodat de Comment-magnet-trechter dezelfde rij gebruikt.
//
// fases: [{ id, naam, vraag, preview: [[label, waarde, meting?]], metingen,
//           oordeel, zwakste }] — zie vatFaseSamen in fases.js.
// Meting: { label, tekst ('groot · klein'), sub, venster, oordeel }.

import { createElement, useState } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { ZWAK, vindVast } from './fases'

export default function FaseTrechter({ fases, m, iconen = {}, onMeting, uitleg }) {
  // Fases staan dicht: eerst alleen het oordeel per fase, details op een tik.
  const [openFase, setOpenFase] = useState(null)
  const vast = vindVast(fases)
  return (
    <>
    {/* De vijf fases als één balk: vakken tegen elkaar, een scheidingslijn
        met een pijltje ertussen. Een tik opent de metingen van die fase
        eronder. Op de telefoon veeg je de balk. */}
    <div style={{
      overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginTop: 6,
      padding: '10px 0', margin: m ? '0 -16px' : 0, paddingLeft: m ? 16 : 0, paddingRight: m ? 16 : 0,
    }}>
    <div style={{
      display: 'flex', alignItems: 'stretch', minWidth: m ? fases.length * 175 : 0,
      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, background: 'rgba(255,255,255,0.02)',
    }}>
      {fases.map((f, i) => {
        const isVast = vast?.id === f.id
        const k = f.oordeel.kleur
        const gemeten = f.oordeel.rang >= 0
        const open = openFase === f.id
        const eerste = i === 0, laatste = i === fases.length - 1
        return (
          <div key={f.id} style={{ position: 'relative', display: 'flex', flex: '1 1 0', minWidth: 0, borderLeft: eerste ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
            {!eerste && (
              <span style={{
                position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2,
                width: 24, height: 24, borderRadius: '50%', background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
              }}>
                <ChevronRight size={14} strokeWidth={2.8} color="rgba(255,255,255,0.5)" />
              </span>
            )}
            <button onClick={() => setOpenFase(o => (o === f.id ? null : f.id))} aria-expanded={open} style={{
              flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
              padding: m ? '0.9rem 1rem' : '1rem 1.2rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', color: '#fff',
              borderRadius: eerste ? '15px 0 0 15px' : laatste ? '0 15px 15px 0' : 0,
              background: open ? 'rgba(255,255,255,0.06)' : isVast ? `${k}0d` : 'transparent',
              boxShadow: open ? 'inset 0 -2px 0 rgba(255,255,255,0.55)' : 'none',
              transition: 'background 0.15s', WebkitTapHighlightColor: 'transparent',
            }}>
              {/* Bolletje, naam met het oordeel-label erachter op dezelfde
                  hoogte, de vraag eronder; onderaan de belangrijkste cijfers. */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <span style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: gemeten ? k : 'rgba(255,255,255,0.1)', color: gemeten ? '#000' : 'rgba(255,255,255,0.75)',
                  fontSize: '0.88rem', fontWeight: 900,
                  boxShadow: isVast ? `0 0 0 4px ${k}33, 0 0 18px ${k}88` : 'none',
                  animation: isVast ? 'vastPuls 1.8s ease-in-out infinite' : 'none',
                }}>{i + 1}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.98rem', fontWeight: 900 }}>{f.naam}</span>
                    <span style={{
                      fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                      padding: '2px 7px', borderRadius: 6,
                      color: gemeten ? k : 'rgba(255,255,255,0.6)', background: gemeten ? `${k}1f` : 'rgba(255,255,255,0.06)',
                    }}>{f.oordeel.tekst}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: ZWAK, lineHeight: 1.3, marginTop: 2 }}>{f.vraag}</span>
                </span>
                <ChevronDown size={15} strokeWidth={2.6} color="rgba(255,255,255,0.45)" style={{ flexShrink: 0, alignSelf: 'flex-start', marginTop: 4, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </span>
              <span style={{ display: 'flex', flexWrap: 'wrap', columnGap: m ? 12 : 18, rowGap: 8, width: '100%', marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {(f.preview || []).map(([label, waarde, meting]) => {
                  const o = meting ? f.metingen.find(x => x.label === meting)?.oordeel : null
                  const kl = o && o.rang >= 0 ? o.kleur : '#fff'
                  return (
                    <span key={label} style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', color: kl, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{waarde}</span>
                      <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, color: ZWAK, whiteSpace: 'nowrap' }}>{label}</span>
                    </span>
                  )
                })}
              </span>
            </button>
          </div>
        )
      })}
    </div>
    </div>

    {/* Metingen van de gekozen fase, ook als flow. */}
    {(() => {
      const f = fases.find(x => x.id === openFase)
      if (!f) return null
      // Eén vak in de kleur van het oordeel van de fase: dit hoort bij
      // elkaar, en bij rood zie je meteen dat je hier moet kijken.
      const k = f.oordeel.rang >= 0 ? f.oordeel.kleur : '#ffffff'
      const nr = fases.indexOf(f) + 1
      return (
        <div style={{
          marginTop: 8, borderRadius: 16, border: `1px solid ${k}55`, background: `${k}0d`,
          boxShadow: vast?.id === f.id ? `0 0 28px ${k}22` : 'none', overflow: 'hidden',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? '0.8rem 0.9rem 0' : '0.95rem 1.2rem 0' }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 900 }}>{nr}. {f.naam}</span>
          <span style={{ fontSize: '0.64rem', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 6, color: f.oordeel.kleur, background: `${k}1f` }}>{f.oordeel.tekst}</span>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: ZWAK, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.vraag}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'stretch', gap: m ? 6 : 8,
          overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
          padding: m ? '12px 14px 14px 10px' : '14px 20px 18px 14px',
        }}>
          {f.metingen.map((x, j) => {
            const [groot, klein] = String(x.tekst).split(' · ')
            const kleur = x.oordeel && x.oordeel.rang >= 0 ? x.oordeel.kleur : '#fff'
            const icoon = iconen[x.label] || Info
            const schud = f.zwakste === x.label
            return (
              <div key={x.label} style={{ display: 'flex', alignItems: 'flex-start', gap: m ? 6 : 8, flex: m ? '0 0 auto' : '1 1 0', minWidth: 0, scrollSnapAlign: 'start' }}>
                {j > 0 && <ChevronRight size={16} strokeWidth={2.6} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 12 }} />}
                <button onClick={() => onMeting?.(x.venster)} style={{
                  flex: 1, minWidth: m ? 118 : 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                  padding: 0, background: 'none', border: 'none', color: '#fff', fontFamily: 'inherit', textAlign: 'left',
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: kleur === '#fff' ? 'rgba(255,255,255,0.08)' : `${kleur}22`,
                    ...(schud ? { boxShadow: `0 0 0 2px ${kleur}, 0 0 16px ${kleur}99`, animation: 'vastSchud 2.4s ease-in-out infinite' } : {}),
                  }}>
                    {createElement(icoon, { size: 19, strokeWidth: 2.4, color: kleur })}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: m ? '1.45rem' : '1.6rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: klein ? '#fff' : kleur }}>{groot}</span>
                    {klein && <span style={{ fontSize: '0.8rem', fontWeight: 900, color: kleur }}>{klein}</span>}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, lineHeight: 1.2 }}>{x.label}</span>
                  {x.sub && <span style={{ fontSize: '0.7rem', fontWeight: 700, color: ZWAK, lineHeight: 1.35 }}>{x.sub}</span>}
                </button>
              </div>
            )
          })}
        </div>
        </div>
      )
    })()}
      {uitleg && (
        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ZWAK, marginTop: 8, lineHeight: 1.5 }}>
          {uitleg}
        </div>
      )}
      <style>{'@keyframes vastPuls { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } } @keyframes vastSchud { 0%,60%,100% { transform: translateX(0) rotate(0) } 64% { transform: translateX(-4px) rotate(-6deg) } 70% { transform: translateX(4px) rotate(6deg) } 76% { transform: translateX(-3px) rotate(-4deg) } 82% { transform: translateX(3px) rotate(4deg) } 88% { transform: translateX(0) rotate(0) } }'}</style>
    </>
  )
}
