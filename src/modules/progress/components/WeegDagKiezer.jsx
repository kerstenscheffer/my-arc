// src/modules/progress/components/WeegDagKiezer.jsx
//
// Dagregel op de kopfoto van de trackingpagina, zelfde vorm als op Meal:
// pijlen links en rechts, in het midden 'Zondag · 25 okt'. Een tik op de dag
// opent een maandkalender met per dag de weging, zodat je ziet waar gaten
// zitten en een vergeten dag alsnog kunt invullen. Vooruit kan niet verder
// dan vandaag: een weging van morgen bestaat nog niet.

import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { createPortal } from '../../../client/paginaPortal'

const DAGNAMEN = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
const MAANDEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
const MAANDEN_VOL = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December']
const KOP = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

// Lokale datum als 'YYYY-MM-DD'. Niet toISOString: die geeft UTC, en dan valt
// een weging na middernacht op de dag ervoor.
const lokaleDatum = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const naarDate = (s) => new Date(`${s}T12:00:00`)
const schuif = (s, dagen) => { const d = naarDate(s); d.setDate(d.getDate() + dagen); return lokaleDatum(d) }

// De kalender kan ook open vanuit de balk bovenaan de pagina, dus de ouder
// houdt bij of hij open staat.
export default function WeegDagKiezer({ datum, onDatumChange, history = [], isMobile, kalenderOpen, setKalenderOpen }) {
  const vandaag = lokaleDatum(new Date())
  const d = naarDate(datum)
  const isVandaag = datum === vandaag
  const relatief = isVandaag ? 'Vandaag' : datum === schuif(vandaag, -1) ? 'Gisteren' : null

  const pijl = (uit) => ({
    width: isMobile ? 32 : 36, height: isMobile ? 32 : 36, padding: 0,
    background: 'transparent', border: 'none',
    color: uit ? 'rgba(255,255,255,0.25)' : '#fff',
    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: uit ? 'default' : 'pointer', flexShrink: 0,
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        padding: isMobile ? '0.3rem 1.5rem' : '0.5rem 2.5rem',
      }}>
        <button onClick={() => onDatumChange(schuif(datum, -1))} aria-label="Vorige dag" style={pijl(false)}>
          <ChevronLeft size={isMobile ? 24 : 26} strokeWidth={3} />
        </button>

        <button
          onClick={() => setKalenderOpen(true)}
          aria-label="Open maandkalender"
          style={{
            background: 'transparent', border: 'none', padding: '0.3rem 0.5rem',
            display: 'flex', alignItems: 'center', gap: 8, minWidth: 0,
            fontSize: isMobile ? '1.12rem' : '1.5rem', fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap',
            textShadow: '0 2px 12px rgba(0,0,0,0.7)', fontFamily: 'inherit',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <span>
            {DAGNAMEN[d.getDay()]}
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
              {' · '}{d.getDate()} {MAANDEN[d.getMonth()]}
            </span>
          </span>
          {relatief && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 900, color: 'rgba(0,0,0,0.85)', background: '#fff',
              padding: '2px 6px', borderRadius: 4, letterSpacing: '0.04em', textTransform: 'uppercase',
              textShadow: 'none',
            }}>
              {relatief}
            </span>
          )}
        </button>

        <button
          onClick={() => !isVandaag && onDatumChange(schuif(datum, 1))}
          disabled={isVandaag}
          aria-label="Volgende dag"
          style={pijl(isVandaag)}
        >
          <ChevronRight size={isMobile ? 24 : 26} strokeWidth={3} />
        </button>
      </div>

      {kalenderOpen && (
        <MaandKalender
          datum={datum}
          vandaag={vandaag}
          history={history}
          onKies={(s) => { onDatumChange(s); setKalenderOpen(false) }}
          onSluit={() => setKalenderOpen(false)}
        />
      )}
    </>
  )
}

function MaandKalender({ datum, vandaag, history, onKies, onSluit }) {
  const start = naarDate(datum)
  const [maand, setMaand] = useState({ jaar: start.getFullYear(), m: start.getMonth() })

  const gewicht = {}
  history.forEach(r => { if (r?.date) gewicht[String(r.date).slice(0, 10)] = Number(r.weight) })

  const eerste = new Date(maand.jaar, maand.m, 1, 12)
  const aantal = new Date(maand.jaar, maand.m + 1, 0).getDate()
  // Week begint op maandag.
  const leeg = (eerste.getDay() + 6) % 7
  const cellen = [...Array(leeg).fill(null), ...Array.from({ length: aantal }, (_, i) => i + 1)]

  const dezeMaand = naarDate(vandaag)
  const isHuidigeMaand = maand.jaar === dezeMaand.getFullYear() && maand.m === dezeMaand.getMonth()
  const naar = (delta) => setMaand(({ jaar, m }) => {
    const n = new Date(jaar, m + delta, 1)
    return { jaar: n.getFullYear(), m: n.getMonth() }
  })

  const gewogen = Array.from({ length: aantal }, (_, i) => lokaleDatum(new Date(maand.jaar, maand.m, i + 1, 12)))
    .filter(s => gewicht[s] != null).length

  const navKnop = (uit) => ({
    width: 36, height: 36, padding: 0, background: 'transparent', border: 'none',
    color: uit ? 'rgba(255,255,255,0.2)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: uit ? 'default' : 'pointer',
    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  })

  return createPortal(
    <div
      onClick={onSluit}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520, maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px 18px 0 0',
          padding: '0.9rem 1rem calc(env(safe-area-inset-bottom, 0px) + 1rem)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
          animation: 'weegKalenderOmhoog 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.75rem' }}>
          <button onClick={() => naar(-1)} aria-label="Vorige maand" style={navKnop(false)}>
            <ChevronLeft size={22} strokeWidth={3} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {MAANDEN_VOL[maand.m]} {maand.jaar}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {gewogen} {gewogen === 1 ? 'weging' : 'wegingen'}
            </div>
          </div>
          <button onClick={() => !isHuidigeMaand && naar(1)} disabled={isHuidigeMaand} aria-label="Volgende maand" style={navKnop(isHuidigeMaand)}>
            <ChevronRight size={22} strokeWidth={3} />
          </button>
          <button onClick={onSluit} aria-label="Sluiten" style={{ ...navKnop(false), width: 30 }}>
            <X size={18} strokeWidth={2.8} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {KOP.map(k => (
            <div key={k} style={{
              textAlign: 'center', fontSize: '0.66rem', fontWeight: 900,
              color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em',
              paddingBottom: 4,
            }}>
              {k}
            </div>
          ))}
          {cellen.map((dag, i) => {
            if (!dag) return <div key={`l${i}`} />
            const s = lokaleDatum(new Date(maand.jaar, maand.m, dag, 12))
            const kg = gewicht[s]
            const toekomst = s > vandaag
            const gekozen = s === datum
            const isVandaag = s === vandaag
            return (
              <button
                key={s}
                onClick={() => !toekomst && onKies(s)}
                disabled={toekomst}
                style={{
                  minHeight: 50, padding: '5px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  borderRadius: 10, fontFamily: 'inherit',
                  background: gekozen ? '#fff' : kg != null ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: isVandaag && !gekozen ? '1.5px solid rgba(255,255,255,0.6)' : '1.5px solid transparent',
                  color: gekozen ? '#0a0a0a' : toekomst ? 'rgba(255,255,255,0.18)' : '#fff',
                  cursor: toekomst ? 'default' : 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 900, lineHeight: 1 }}>{dag}</span>
                <span style={{
                  fontSize: '0.64rem', fontWeight: 800, lineHeight: 1,
                  color: gekozen ? 'rgba(10,10,10,0.7)' : 'rgba(255,255,255,0.6)',
                  minHeight: '0.64rem',
                }}>
                  {kg != null ? kg.toFixed(1) : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      <style>{`@keyframes weegKalenderOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>,
    document.body
  )
}
