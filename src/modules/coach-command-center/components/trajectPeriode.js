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

// ── Verlengen / vervolg boeken (24 nov 2026) ──────────────────────────────
// Eén route voor Coach Inzicht, Einde traject (leadbord) en Business OS → Klanten.
// Een vervolg kan later ingaan dan het huidige einde (challenge tot 24 nov, 6 mnd
// vanaf 1 jan). De klant houdt tussendoor gewoon toegang: de weken lopen door tot het
// nieuwe einde. Oude app-versies lezen alleen clients.coaching_*, die blijven kloppen.

const DAG_MS = 86400000
const isoVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const vandaagIso = () => isoVan(new Date())
export const plusMaandenIso = (iso, n) => { const d = new Date(`${iso}T00:00:00`); d.setMonth(d.getMonth() + n); return isoVan(d) }
const dagenTussen = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / DAG_MS)
const kortDatum = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')

// De omzetregel heeft een eigen sectietitel zonder "sale": telt als omzet, niet als nieuwe sale.
export const VERLENGING_TITEL = 'Verlenging 🔁'
// Zelfde standaard als SaleForm en getPartnerPayouts als de oorspronkelijke sale onbekend is.
export const STANDAARD_PARTNER_PCT = 50

// Waar een vervolg vanzelf begint: direct na het huidige einde, of vandaag als dat al voorbij is.
export function directeStart(client) {
  const p = computePeriod(client)
  const vandaag = vandaagIso()
  return p && p.endDate > vandaag ? p.endDate : vandaag
}

// Nieuw einde en totaal aantal weken (vanaf de oorspronkelijke start, pauzes eraf).
export function planVervolg(client, { maanden, startOp }) {
  const start = startOp || directeStart(client)
  const eind = plusMaandenIso(start, maanden)
  const klantStart = client.coaching_start_date || start
  // Naar boven afgerond: de klant verliest nooit dagen door de weekindeling.
  const totaalWeken = Math.max(1, Math.ceil((dagenTussen(klantStart, eind) - (client.coaching_paused_days_total || 0)) / 7))
  const huidigEind = computePeriod(client)?.endDate || null
  // Tussen het huidige einde (of vandaag, als dat al voorbij is) en de start van het
  // vervolg: toegang loopt door.
  const vanaf = huidigEind && huidigEind > vandaagIso() ? huidigEind : vandaagIso()
  const gatDagen = start > vanaf ? dagenTussen(vanaf, start) : 0
  return { start, eind, totaalWeken, huidigEind, gatDagen }
}

// Korte omschrijving voor client_doorstap.pakket en de schermen die die tonen.
export function pakketTekst({ maanden, betaling, prijs, start, betaald, betaalDatum, aanbod = null, prijsTekst = null }) {
  const geld = prijsTekst || (betaling === 'monthly' ? `${maanden}x €${prijs}` : `€${prijs}`)
  const open = betaald ? '' : `, nog niet betaald${betaalDatum ? ` (verwacht ${kortDatum(betaalDatum)})` : ''}`
  return `${aanbod ? `${aanbod}: ` : ''}${maanden} mnd vanaf ${kortDatum(start)}, ${geld}${open}`
}

// De laatste coaching-sale van deze klant: eerst via client_id, anders via de lead op e-mail.
// Geeft { leadId, pct, sale } of null.
export async function vorigeSale(supabase, client) {
  const kol = 'id, lead_id, order_value, payment_type, duration_months, partner_share_pct, sale_kind, challenge_status'
  const { data: eigen } = await supabase.from('lead_movements').select(kol)
    .eq('client_id', client.id).not('order_value', 'is', null).is('reverted_at', null)
    .order('moved_at', { ascending: false }).limit(5)
    .then(r => r, () => ({ data: [] }))
  const coaching = (eigen || []).find(s => s.sale_kind !== 'challenge')
  const metLead = (eigen || []).find(s => s.lead_id)
  if (coaching || metLead) {
    const s = coaching || metLead
    return { leadId: metLead?.lead_id || null, pct: s.partner_share_pct ?? null, sale: coaching || null }
  }
  const email = (client.email || '').trim()
  if (!email) return null
  const { data: leads } = await supabase.from('call_leads').select('id').ilike('email', email).limit(5)
    .then(r => r, () => ({ data: [] }))
  const ids = (leads || []).map(l => l.id)
  if (!ids.length) return null
  const { data: sales } = await supabase.from('lead_movements').select(kol)
    .in('lead_id', ids).not('order_value', 'is', null).is('reverted_at', null).eq('sale_kind', 'coaching')
    .order('moved_at', { ascending: false }).limit(1)
    .then(r => r, () => ({ data: [] }))
  const s = sales?.[0]
  return { leadId: s?.lead_id || ids[0], pct: s?.partner_share_pct ?? null, sale: s || null }
}

// Boekt een verlenging of vervolg in één keer:
//   1. clients: weken tot het nieuwe einde (toegang + check-ins lopen door)
//   2. lead_movements: de omzetregel met start_op, betaald of nog open, termijnen vanaf payment_due_date
//   3. client_doorstap: betaald of ja_mondeling, met de afspraak als pakket
// borgId: challenge-sale die bij deze doorstap hoort. Leeg = de open challenge-sale van deze
// klant als die gekoppeld is. De trigger zet de borg op behouden zodra dit betaald is.
// Geeft { clientPayload, pakket, doorstap }. Gooit een fout als stap 1 of 2 mislukt.
export async function boekVerlenging(supabase, {
  client, coachId, maanden, betaling, prijs, startOp = null,
  betaald = true, betaalDatum = null, vorige = null, borgId, aanbod = null, borgOmzetten = null,
  totaal: totaalGegeven = null, prijsTekst = null, borgVerrekend = null, betaalLink = null,
}) {
  const plan = planVervolg(client, { maanden, startOp })
  // Borg omzetten (24 nov 2026, Joris → App 1 jaar): de borg ís de betaling. Geen nieuwe
  // omzetregel (dan telde het geld dubbel); de borg gaat op behouden en hangt aan de klant.
  // totaal = wat er nog te betalen is (na borg en korting, berekend in TrajectModal). Borg
  // verrekend: de borg hangt aan deze verlenging en gaat op behouden zodra die betaald is (trigger).
  const totaal = borgOmzetten ? 0 : (totaalGegeven != null ? totaalGegeven : (betaling === 'monthly' ? prijs * maanden : prijs))
  const vandaag = vandaagIso()

  const clientPayload = {
    coaching_total_weeks: plan.totaalWeken,
    coaching_onbeperkt: false,
    coaching_status: 'active',
    payment_plan: betaling,
    goal_deadline: plan.eind,
    ...(client.coaching_start_date ? {} : { coaching_start_date: plan.start }),
  }
  const { error } = await supabase.from('clients').update(clientPayload).eq('id', client.id)
  if (error) throw error

  const { data: { user } = {} } = await supabase.auth.getUser()
  const coach = user?.id || coachId || null

  let borg = borgVerrekend?.id || borgId
  if (borg === undefined) {
    const { data: open } = await supabase.from('lead_movements').select('id')
      .eq('client_id', client.id).eq('sale_kind', 'challenge').eq('challenge_status', 'open').is('reverted_at', null)
      .order('moved_at', { ascending: false }).limit(1)
      .then(r => r, () => ({ data: [] }))
    borg = open?.[0]?.id || null
  }

  if (totaal > 0) {
    // Termijnen starten op payment_due_date (get_payment_schedule). Nog niet betaald: de
    // verwachte datum. Betaald maar maandelijks en later ingaand: eerste termijn op de start.
    const betaalVanaf = !betaald
      ? (betaalDatum || (plan.start > vandaag ? plan.start : vandaag))
      : (betaling === 'monthly' && plan.start > vandaag ? plan.start : null)
    const { error: omzetFout } = await supabase.from('lead_movements').insert({
      lead_id: vorige?.leadId || null,
      client_id: client.id,
      to_section_title: VERLENGING_TITEL,
      lead_name: client.name || [client.first_name, client.last_name].filter(Boolean).join(' ') || client.email || 'Klant',
      coach_id: coach,
      outcome_type: 'verlenging',
      order_value: totaal,
      payment_type: betaling,
      duration_months: betaling === 'monthly' ? maanden : 1,
      partner_share_pct: vorige?.pct ?? STANDAARD_PARTNER_PCT,
      payment_received: !!betaald,
      payment_due_date: betaalVanaf,
      start_op: plan.start,
      aanbod: aanbod || null,
      // Betaallink (24 nov 2026): de klant ziet hem in de app zolang dit niet betaald is.
      ...(!betaald && betaalLink?.trim() ? { betaal_link: betaalLink.trim() } : {}),
      borg_movement_id: borg || null,
      sale_kind: 'coaching',
    })
    if (omzetFout) {
      const e = new Error('Verlengd, maar de omzet is niet geboekt: ' + omzetFout.message)
      e.clientPayload = clientPayload
      throw e
    }
  }

  // Borg die (deels) de betaling is: aan de klant hangen en meteen behouden. Hij zei ja tegen het
  // vervolg, dus de borg gaat niet meer terug, ook als de rest nog moet komen (24 nov 2026, Patrick).
  const borgBetaling = borgOmzetten || borgVerrekend || null
  if (borgBetaling?.id || borgVerrekend?.id) {
    const b = borgBetaling || borgVerrekend
    const patch = { client_id: client.id, ...(borgBetaling && b.challenge_status === 'open' ? { challenge_status: 'behouden' } : {}) }
    const { error: borgFout } = await supabase.from('lead_movements').update(patch).eq('id', b.id)
    if (borgFout) {
      const e = new Error('Verlengd, maar de borg is niet bijgewerkt: ' + borgFout.message)
      e.clientPayload = clientPayload
      throw e
    }
  }

  const pakket = borgOmzetten
    ? `${aanbod ? `${aanbod}: ` : ''}${maanden} mnd vanaf ${kortDatum(plan.start)}, betaald met borg €${Math.round(Number(borgOmzetten.order_value) || 0)}`
    : pakketTekst({ maanden, betaling, prijs, start: plan.start, betaald, betaalDatum, aanbod, prijsTekst })
  const { data: doorstap } = await supabase.from('client_doorstap').insert({
    client_id: client.id, coach_id: client.coach_id || coach, status: betaald ? 'betaald' : 'ja_mondeling',
    pakket, gezet_door: coach,
  }).select('id, client_id, status, pakket, notitie, gezet_at').single()
    .then(r => r, () => ({ data: null }))

  return { clientPayload, pakket, doorstap, plan }
}
