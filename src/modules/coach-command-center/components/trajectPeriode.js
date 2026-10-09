// src/modules/coach-command-center/components/trajectPeriode.js
//
// Looptijd van een traject: eind-datum, weken gedaan/totaal/resterend en
// percentage, met pauzes meegerekend. Gebruikt door het trajectpaneel en
// door de trajectlijn bovenaan de klantkaart in Command. Eigen bestand,
// omdat een componentbestand alleen componenten mag exporteren (fast refresh).

export function computePeriod(client) {
  const start = client.coaching_start_date
  const weeks = client.coaching_total_weeks
  const pausedDays = client.coaching_paused_days_total || 0
  const status = client.coaching_status || 'active'
  const pausedAt = client.coaching_paused_at

  if (!start || !weeks) return null

  const startMs = new Date(start + 'T00:00:00').getTime()
  const totalDurationDays = weeks * 7 + pausedDays
  const endMs = startMs + totalDurationDays * 86400000

  // Een "freeze" punt: bij pause stopt de teller bij paused_at.
  const nowMs = status === 'paused' && pausedAt
    ? new Date(pausedAt).getTime()
    : Date.now()

  const elapsedDays = Math.max(0, (nowMs - startMs) / 86400000 - pausedDays)
  const remainingDays = Math.max(0, (endMs - nowMs) / 86400000)
  const totalDays = weeks * 7

  const pct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))

  return {
    startDate: start,
    endDate: new Date(endMs).toISOString().split('T')[0],
    weeksDone: Math.floor(elapsedDays / 7),
    daysDoneRemainder: Math.floor(elapsedDays % 7),
    weeksTotal: weeks,
    weeksRemaining: Math.ceil(remainingDays / 7),
    pct,
    isOver: nowMs >= endMs,
  }
}
