// src/modules/lead-management/kpiConfig.js
// Gedeelde KPI-doel-config voor de stats-bar (PeriodStatsBar) en de stats-modal
// (WeekStatsModal). De 5 belangrijkste stats krijgen een dag- én week-doel,
// opgeslagen in lead_kpi_targets (per coach).

export const KPI_STATS = [
  { key: 'nieuw',     label: 'Nieuwe leads' },
  { key: 'reacties',  label: 'Reacties' },
  { key: 'ingepland', label: 'Call ingepland' },
  { key: 'sales',     label: 'Sales' },
  { key: 'omzet',     label: 'Omzet', euro: true },
]

export const KPI_KEYS = KPI_STATS.map(s => s.key)

// Doel voor de gekozen periode. Alleen 'day' en 'week' hebben een doel — voor
// maand/aangepast tonen we geen doel (we werken met aparte dag/week-doelen,
// dus geen rommelige omreken-math).
export function kpiTargetFor(targets, statKey, period) {
  const t = targets?.[statKey]
  if (!t) return null
  if (period === 'day')  return (t.day  != null && t.day  > 0) ? t.day  : null
  if (period === 'week') return (t.week != null && t.week > 0) ? t.week : null
  return null
}

// Voortgangskleur: groen = gehaald, geel = onderweg (>=50%), rood = achter.
export function kpiColor(value, target) {
  if (target == null || target <= 0) return null
  const pct = (Number(value) || 0) / target
  if (pct >= 1)   return '#22c55e'
  if (pct >= 0.5) return '#f59e0b'
  return '#ef4444'
}

// Doel netjes formatteren (omzet met euroteken).
export function fmtTarget(statKey, target) {
  if (target == null) return ''
  if (statKey === 'omzet') return '€' + Math.round(target).toLocaleString('nl-NL')
  return String(target)
}
