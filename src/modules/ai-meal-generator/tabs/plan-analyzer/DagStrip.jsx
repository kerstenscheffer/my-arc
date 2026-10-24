// src/modules/ai-meal-generator/tabs/plan-analyzer/DagStrip.jsx
//
// De week in één regel: per dag een mini-ring (kcal tegen het doel) met de
// kcal eronder. Rood = te weinig, oranje = te veel, zelfde grenzen als de
// dag-ringen. Zo zie je zonder klikken welke dag van de week niet klopt;
// tik op een dag om hem te openen. Verving "‹ Maandag ›" (je zag één dag
// tegelijk en moest doorklikken om de week te beoordelen).

const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const kleurVoor = (pct) => {
  if (pct == null) return 'rgba(255,255,255,0.35)'
  if (pct < 85) return '#ef4444'
  if (pct > 115) return '#f59e0b'
  return '#22c55e'
}

// dagen: [{ label: 'Ma', kcal, eiwit, training }] (7 stuks)
export default function DagStrip({ dagen, actief, onKies, doelKcal, doelEiwit, isMobile }) {
  const m = isMobile
  return (
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
  )
}
