// src/modules/lead-management/components/statWeekReeks.js
//
// Week-op-week reeks voor één stat uit het stats-scherm (17 okt 2026). Per
// week dezelfde servicefuncties en rekenregels als het getal in de tegel, dus
// de laatste week in de grafiek is altijd gelijk aan wat de tegel bij
// weekweergave toont. Alleen de functies die de stat nodig heeft worden
// aangeroepen, twee weken tegelijk, om de (kleine) database te sparen.

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null)
const rx = (r) => r?.reactionEventsInWindow ?? r?.reactionsInWindow ?? r?.reactedLeads ?? 0
const gevoerd = (f) => f?.callHeld?.count || 0
const handled = (f) => (f?.callHeld?.count || 0) + (f?.noShow?.count || 0)

// label → [benodigde bronnen, waarde(ctx), eenheid]
export const STAT_REEKS = {
  'Nieuwe leads': [['rx'], c => c.rx?.newLeads ?? 0],
  'Follow-ups': [['act'], c => c.act?.followUps ?? 0],
  'Reacties': [['rx'], c => rx(c.rx)],
  'Voorgesteld': [['fun'], c => c.fun?.callProposed?.count || 0],
  'Ingepland': [['fun'], c => c.fun?.callScheduled?.count || 0],
  'Calls gepland': [['fun'], c => c.fun?.callBooked?.count || 0],
  'Call gevoerd': [['fun'], c => gevoerd(c.fun)],
  'Sales': [['fun'], c => c.fun?.sale?.count || 0],
  'Orderwaarde': [['fun'], c => Math.round(c.fun?.sale?.omzet || 0), '€'],
  'Toegezegd': [['fun'], c => Math.round(c.fun?.sale?.toegezegd || 0), '€'],
  'Binnengekomen': [['cash'], c => Math.round(c.cash?.bedrag || 0), '€'],
  'No-shows': [['fun'], c => c.fun?.noShow?.count || 0],
  'Afgewezen': [['fun'], c => c.fun?.callRejected?.count || 0],
  'Sale verloren': [['fun'], c => c.fun?.saleLost?.count || 0],
  'Niet geschikt': [['fun'], c => c.fun?.notSuitable?.count || 0],
  'Reactie→voorstel': [['fun', 'rx'], c => pct(c.fun?.callProposed?.count || 0, rx(c.rx)), '%'],
  'Voorstel→call': [['fun'], c => pct(c.fun?.callScheduled?.count || 0, c.fun?.callProposed?.count || 0), '%'],
  'Call→show-up': [['fun'], c => pct(gevoerd(c.fun), c.fun?.callBooked?.count || 0), '%'],
  'Show→close': [['fun'], c => pct(c.fun?.sale?.count || 0, gevoerd(c.fun)), '%'],
  'Response': [['rx'], c => pct(c.rx?.reactedLeads ?? 0, c.rx?.newLeads ?? 0), '%'],
  'Opvolg': [['rx'], c => pct(c.rx?.followedLeads ?? 0, c.rx?.newLeads ?? 0), '%'],
  'No-show': [['fun'], c => pct(c.fun?.noShow?.count || 0, handled(c.fun)), '%'],
}

const maandag = (d) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}
const weekNr = (d) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dag = t.getUTCDay() || 7
  t.setUTCDate(t.getUTCDate() + 4 - dag)
  const jaarStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1))
  return Math.ceil(((t - jaarStart) / 864e5 + 1) / 7)
}

const cache = new Map()

/**
 * @returns {Promise<Array<{ label, van, waarde }>>} oudste week eerst
 */
export async function haalStatWeekReeks(leadService, coachId, label, eindDatum, weken = 8) {
  const def = STAT_REEKS[label]
  if (!def || !leadService || !coachId) return null
  const [bronnen, waarde] = def
  const laatste = maandag(new Date(eindDatum.getTime() - 1))
  const sleutel = `${label}|${laatste.toISOString()}|${weken}`
  if (cache.has(sleutel)) return cache.get(sleutel)

  const vensters = Array.from({ length: weken }, (_, i) => {
    const van = new Date(laatste); van.setDate(van.getDate() - (weken - 1 - i) * 7)
    const tot = new Date(van); tot.setDate(tot.getDate() + 7)
    return { van, tot }
  })
  const haal = async ({ van, tot }) => {
    const s = van.toISOString(), e = tot.toISOString()
    const [act, fun, rxs, cash] = await Promise.all([
      bronnen.includes('act') ? leadService.getRangeActivity(coachId, s, e) : null,
      bronnen.includes('fun') ? leadService.getRangeFunnelStats(coachId, s, e) : null,
      bronnen.includes('rx') ? leadService.getRangeReactionStats(coachId, s, e) : null,
      bronnen.includes('cash') ? leadService.getRangeCashCollected(coachId, s, e) : null,
    ])
    return { label: `W${weekNr(van)}`, van: s, waarde: waarde({ act, fun, rx: rxs, cash }) }
  }
  const uit = []
  for (let i = 0; i < vensters.length; i += 2) {
    uit.push(...await Promise.all(vensters.slice(i, i + 2).map(haal)))
  }
  cache.set(sleutel, uit)
  return uit
}
