// src/modules/ai-meal-generator/tabs/plan-analyzer/DagStrip.jsx
//
// De week in één regel: per dag een mini-ring (kcal tegen het doel) met de
// kcal eronder. Rood = te weinig, oranje = te veel, zelfde grenzen als de
// dag-ringen. Zo zie je zonder klikken welke dag van de week niet klopt;
// tik op een dag om hem te openen. Verving "‹ Maandag ›" (je zag één dag
// tegelijk en moest doorklikken om de week te beoordelen).
//
// Met `weekStart` (maandag, 'JJJJ-MM-DD') is het een echte week: datums onder
// de dagen, vandaag gemarkeerd, een stip bij een dag die alleen die week
// anders is, en vegen of de pijlen voor de week ervoor of erna.

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kleurVoor = (pct) => {
  if (pct == null) return 'rgba(255,255,255,0.35)'
  if (pct < 85) return '#ef4444'
  if (pct > 115) return '#f59e0b'
  return '#22c55e'
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const kort = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })

// dagen: [{ label: 'Ma', kcal, eiwit, training }] (7 stuks)
// aangepast: indexen (0 = ma) van dagen die alleen deze week anders zijn
export default function DagStrip({ dagen, actief, onKies, doelKcal, doelEiwit, isMobile, weekStart = null, onWeek = null, aangepast = [], onTerugzetten = null, bezig = false }) {
  const m = isMobile
  const veeg = useRef(null)
  const begin = weekStart ? new Date(`${weekStart}T00:00:00`) : null
  const datum = (i) => { const d = new Date(begin); d.setDate(d.getDate() + i); return d }
  const vandaag = iso(new Date())
  const ditMaandag = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d) })()
  const weekNaam = !weekStart ? null
    : weekStart === ditMaandag ? 'Deze week'
    : (() => { const v = new Date(`${ditMaandag}T00:00:00`); const w = Math.round((begin - v) / (7 * 86400000)); return w === 1 ? 'Volgende week' : w === -1 ? 'Vorige week' : w > 0 ? `Over ${w} weken` : `${-w} weken terug` })()
  const pijl = { width: 32, height: 32, padding: 0, borderRadius: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }

  // Vegen: horizontaal meer dan 50 px en duidelijk meer dan verticaal.
  const veegStart = (e) => { const t = e.touches[0]; veeg.current = { x: t.clientX, y: t.clientY } }
  const veegEind = (e) => {
    const s = veeg.current; veeg.current = null
    if (!s || !onWeek || bezig) return
    const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onWeek(dx < 0 ? 1 : -1)
  }

  return (
    <div onTouchStart={weekStart ? veegStart : undefined} onTouchEnd={weekStart ? veegEind : undefined} style={{ opacity: bezig ? 0.55 : 1, transition: 'opacity 0.15s' }}>
    {weekStart && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: m ? '0.5rem 0.5rem 0' : '0.6rem 0 0' }}>
        <button onClick={() => !bezig && onWeek?.(-1)} aria-label="Vorige week" style={pijl}><ChevronLeft size={16} strokeWidth={2.8} /></button>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span style={{ fontSize: m ? '0.86rem' : '0.92rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{weekNaam}</span>
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)' }}>{kort(begin)} – {kort(datum(6))}</span>
          {weekStart !== ditMaandag && (
            <button onClick={() => !bezig && onWeek?.(0)} style={{ background: 'none', border: 'none', padding: 0, color: '#fff', fontSize: '0.74rem', fontWeight: 900, textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}>Vandaag</button>
          )}
          {aangepast.length > 0 && onTerugzetten && (
            <button onClick={() => !bezig && onTerugzetten()} title="Deze week weer gelijk aan elke week maken" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.74rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RotateCcw size={12} strokeWidth={2.6} /> {aangepast.length} anders
            </button>
          )}
        </div>
        <button onClick={() => !bezig && onWeek?.(1)} aria-label="Volgende week" style={pijl}><ChevronRight size={16} strokeWidth={2.8} /></button>
      </div>
    )}
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: m ? 4 : 8,
      padding: m ? '0.5rem 0.5rem' : '0.6rem 0',
    }}>
      {dagen.map((d, i) => {
        const pct = doelKcal > 0 ? (d.kcal / doelKcal) * 100 : null
        // Eiwit telt mee in het oordeel: een dag die op kcal klopt maar
        // eiwit mist, is geen goede dag.
        const eiwitPct = doelEiwit > 0 ? (d.eiwit / doelEiwit) * 100 : null
        const slecht = [pct, eiwitPct].filter(x => x != null)
        const kleur = d.kcal === 0 ? 'rgba(255,255,255,0.2)'
          : slecht.some(x => x < 85) ? '#ef4444'
          : slecht.some(x => x > 115) ? '#f59e0b'
          : kleurVoor(pct)
        const aan = i === actief
        const dt = begin ? datum(i) : null
        const isVandaag = dt && iso(dt) === vandaag
        const anders = aangepast.includes(i)
        const maat = m ? 26 : 30, dikte = 3.5
        const r = (maat - dikte) / 2, omtrek = 2 * Math.PI * r
        const vol = omtrek - (Math.min(100, pct ?? 0) / 100) * omtrek
        return (
          <button key={i} onClick={() => onKies(i)} aria-pressed={aan} title={`${d.label}: ${nl(d.kcal)} kcal · ${nl(d.eiwit)} g eiwit`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: m ? '0.4rem 0' : '0.5rem 0', borderRadius: 12, minWidth: 0,
              background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: `1px solid ${aan ? 'rgba(255,255,255,0.35)' : 'transparent'}`,
              cursor: 'pointer', fontFamily: 'inherit',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: m ? '0.68rem' : '0.74rem', fontWeight: 900, color: aan ? '#fff' : 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {d.label}
              {d.training && <span title="Trainingsdag" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
            </span>
            {dt && (
              <span title={anders ? 'Alleen deze week anders' : undefined} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 900, lineHeight: 1,
                color: isVandaag ? '#0a0a0a' : aan ? '#fff' : 'rgba(255,255,255,0.55)',
                background: isVandaag ? '#fff' : 'transparent', borderRadius: 6, padding: isVandaag ? '2px 5px' : '2px 0',
              }}>
                {dt.getDate()}
                {anders && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b' }} />}
              </span>
            )}
            <svg width={maat} height={maat} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={maat / 2} cy={maat / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={dikte} fill="none" />
              <circle cx={maat / 2} cy={maat / 2} r={r} stroke={kleur} strokeWidth={dikte} fill="none"
                strokeDasharray={omtrek} strokeDashoffset={vol} strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: m ? '0.66rem' : '0.74rem', fontWeight: 900, color: kleur === '#22c55e' ? '#fff' : kleur, fontVariantNumeric: 'tabular-nums' }}>
              {d.kcal ? nl(d.kcal) : '–'}
            </span>
          </button>
        )
      })}
    </div>
    </div>
  )
}
