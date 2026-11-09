// src/modules/manual-workout-builder/components/PlanInfo.jsx
//
// Planinfo (9 nov 2026): sets per spiergroep per week voor het plan in de
// builder. Elke dag in het plan telt als één training per week; alleen de
// primaire spier telt (zoals primairSpieren in het plan staat). Cardio telt niet.

const LABEL = {
  chest: 'Borst', back: 'Rug', shoulders: 'Schouders', biceps: 'Biceps', triceps: 'Triceps',
  legs: 'Benen', glutes: 'Billen', calves: 'Kuiten', abs: 'Buik', traps: 'Traps', onbekend: 'Geen spiergroep',
}
// Nederlandse en afwijkende spelling naar één sleutel.
const GELIJK = {
  borst: 'chest', rug: 'back', schouders: 'shoulders', schouder: 'shoulders', tricep: 'triceps', bicep: 'biceps',
  benen: 'legs', billen: 'glutes', kuiten: 'calves', calf: 'calves', buik: 'abs', core: 'abs', trap: 'traps',
}

function spierVan(ex) {
  const ruw = String(ex.primairSpieren || '').split(/[,/]/)[0].trim().toLowerCase()
  if (ruw) return GELIJK[ruw] || ruw
  // Geen spier ingevuld: een paar namen herkennen we zelf.
  const n = String(ex.name || '').toLowerCase()
  if (/cr?h?un?s?ch|sit.?up|zit.?up|plank|leg raise/.test(n)) return 'abs'
  return 'onbekend'
}

function setsPerSpier(days = []) {
  const telling = {}
  for (const d of days) {
    for (const ex of d.exercises || []) {
      if (ex.type === 'cardio') continue
      const s = Number(ex.sets) || 0
      if (!s) continue
      const k = spierVan(ex)
      telling[k] = (telling[k] || 0) + s
    }
  }
  return Object.entries(telling).sort((a, b) => b[1] - a[1])
}

export default function PlanInfo({ days = [] }) {
  const rijen = setsPerSpier(days)
  const totaal = rijen.reduce((n, [, s]) => n + s, 0)
  const max = rijen[0]?.[1] || 1
  const label = (k) => LABEL[k] || k.charAt(0).toUpperCase() + k.slice(1)

  return (
    <div style={{ marginTop: '0.6rem', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0.75rem 0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>Sets per week</span>
        <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>
          {totaal} sets · {days.length} {days.length === 1 ? 'dag' : 'dagen'}
        </span>
      </div>
      {rijen.length === 0 ? (
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>Nog geen oefeningen.</div>
      ) : rijen.map(([k, s]) => (
        <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
          <span style={{ width: 92, flexShrink: 0, fontSize: '0.8rem', fontWeight: 800, color: k === 'onbekend' ? '#f59e0b' : '#fff' }}>{label(k)}</span>
          <span style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.round((s / max) * 100)}%`, background: k === 'onbekend' ? '#f59e0b' : '#10b981', borderRadius: 3 }} />
          </span>
          <span style={{ width: 26, textAlign: 'right', fontSize: '0.82rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{s}</span>
        </div>
      ))}
      <div style={{ marginTop: 8, fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
        Elke dag telt als één training per week. Alleen de primaire spier telt.
      </div>
    </div>
  )
}
