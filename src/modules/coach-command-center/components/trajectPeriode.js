// src/modules/coach-command-center/components/trajectPeriode.js
//
// Looptijd van een traject: eind-datum, weken gedaan/totaal/resterend en
// percentage, met pauzes meegerekend. Gebruikt door het trajectpaneel en
// door de trajectlijn bovenaan de klantkaart in Command. Eigen bestand,
// omdat een componentbestand alleen componenten mag exporteren (fast refresh).

// Onbeperkt = geen einddatum (Kersten zelf, familie). Weken leeg, dus computePeriod
// geeft null; staan er toch weken, dan winnen die (oude coachversie zette ze).
export const isOnbeperkt = (client) => !!client?.coaching_onbeperkt && !client?.coaching_total_weeks

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

// Pauze eraf: de pauzedagen gaan bij het totaal, dus de einddatum schuift mee. De open rij in
// coaching_pauses wordt gesloten; daarop schuiven ook de betaaltermijnen (pauze_schuif).
// Eén plek voor Coach Inzicht en het overzicht in Business OS. Gooit een fout als het mislukt.
// Coaching op pauze zetten, met een rij in coaching_pauses (daar rekent de
// betaalpauze mee). Gedeeld door Coach Inzicht en de foto op de klantkaart.
export async function pauzeerTraject(supabase, client, coachId, { vanaf = null, reden = null } = {}) {
  const pausedAt = vanaf ? new Date(vanaf + 'T00:00:00').toISOString() : new Date().toISOString()
  const payload = { coaching_status: 'paused', coaching_paused_at: pausedAt, coaching_pause_reason: reden }
  const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
  if (error) throw error
  await supabase.from('coaching_pauses').insert({ client_id: client.id, coach_id: coachId, paused_at: pausedAt, reason: reden })
  return payload
}

export async function hervatTraject(supabase, client) {
  if (!client?.coaching_paused_at) throw new Error('Deze klant staat niet op pauze')
  const pausedDays = Math.max(0, Math.floor((Date.now() - new Date(client.coaching_paused_at).getTime()) / 86400000))
  const payload = {
    coaching_status: 'active',
    coaching_paused_at: null,
    coaching_pause_reason: null,
    coaching_paused_days_total: (client.coaching_paused_days_total || 0) + pausedDays,
  }
  const { error } = await supabase.from('clients').update(payload).eq('id', client.id)
  if (error) throw error
  await supabase.from('coaching_pauses')
    .update({ resumed_at: new Date().toISOString() })
    .eq('client_id', client.id)
    .is('resumed_at', null)
  return payload
}
