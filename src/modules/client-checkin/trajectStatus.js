// src/modules/client-checkin/trajectStatus.js
//
// Loopt het traject van deze klant?
//
// Aanleiding: mensen van wie het account wél was aangemaakt maar die nog
// niet waren begonnen, kregen elke week te horen dat hun check-in te laat
// was. De check-in draaide namelijk voor iedereen met een account.
//
// De maatstaf is de coachingsperiode: een startdatum plus een aantal weken.
// Dat is precies wat de coach invult als iemand echt begint, en het is ook
// waar CoachingPeriodPanel op rekent (computePeriod geeft null zonder die
// twee). Andere kandidaten vielen af op de cijfers:
//
//   clients.status  — 36 mensen staan op 'inactive' terwijl 13 daarvan
//                     gewoon check-ins invullen. Geen startvlag dus.
//   alleen een startdatum — te dun gevuld; dan zou bijna iedereen afvallen.
//
// Met deze regel blijft de check-in staan voor de 15 mensen met een lopende
// periode (10 daarvan checkten de afgelopen twee maanden in) en verdwijnt
// hij voor de 43 die niet lopen (daarvan checkte er 1 recent in).
//
// Bewust géén eind-controle. Een periode die verlopen is terwijl de coach
// hem nog niet heeft afgesloten komt vaak voor — CoachingPeriodPanel heeft
// daar zelfs een aparte 'overdue'-melding voor. Wie daarop zou filteren zet
// stilletjes lopende klanten uit.

/**
 * @param {object} client rij uit `clients` (select '*')
 * @returns {boolean} true als de klant een lopend traject heeft
 */
export function trajectLoopt(client) {
  if (!client) return false

  // Gepauzeerd of afgerond telt niet als lopend.
  const status = client.coaching_status || 'active'
  if (status === 'paused' || status === 'ended') return false

  // Geen periode ingesteld = nog niet begonnen.
  if (!client.coaching_start_date || !client.coaching_total_weeks) return false

  // Startdatum in de toekomst = ingepland, nog niet gestart.
  const start = new Date(`${client.coaching_start_date}T00:00:00`)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() <= Date.now()
}

// Kolommen die trajectLoopt nodig heeft. Wie een smalle select doet moet
// deze meenemen, anders valt iedereen af omdat de velden ontbreken.
export const TRAJECT_KOLOMMEN = 'coaching_start_date, coaching_total_weeks, coaching_status'
