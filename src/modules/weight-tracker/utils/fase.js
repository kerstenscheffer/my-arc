// src/modules/weight-tracker/utils/fase.js
//
// Trajectfases: waar begon deze fase, wat is de bedoeling, en ligt de klant
// op schema?
//
// Waarom een fase en niet clients.start_weight: dat is één veld dat bij de
// intake gevuld wordt. Gaat iemand na een cut een build in, dan is die waarde
// betekenisloos — en overschrijven wist de geschiedenis van de cut. Elke fase
// krijgt daarom een eigen rij (client_phases) met een eigen startpunt.
//
// De beoordeling vergelijkt de gemeten trend met de verwachte trend. Bewust
// op weekgemiddelden en niet op losse metingen: dagschommelingen van een kilo
// zijn normaal en zouden het oordeel elke dag laten omslaan.

export const DOELEN = {
  cut:      { label: 'Cut',     richting: -1 },
  build:    { label: 'Build',   richting: 1 },
  recomp:   { label: 'Recomp',  richting: 0 },
  maintain: { label: 'Behoud',  richting: 0 },
}

// Drempels. Zie de uitleg bij beoordeelFase waarom ze zo staan.
export const MIN_WEKEN = 2          // zo lang zwijgen we; korter is ruis
export const MARGE = 0.5            // 50% afwijking van het weektempo mag
export const MIN_METINGEN = 4       // minder metingen = geen betrouwbare trend

const dagen = (a, b) => (new Date(b) - new Date(a)) / 86400000

/** Weekgemiddelden binnen de fase, oplopend in tijd. */
export function weekGemiddelden(history, vanafDatum) {
  const maandagVan = (d) => {
    const x = new Date(d)
    const dag = x.getDay()
    x.setDate(x.getDate() + (dag === 0 ? -6 : 1 - dag))
    x.setHours(0, 0, 0, 0)
    return x.toISOString().split('T')[0]
  }
  const perWeek = {}
  ;(history || []).forEach(e => {
    const w = parseFloat(e.weight)
    if (!Number.isFinite(w)) return
    if (vanafDatum && new Date(e.date) < new Date(vanafDatum)) return
    const k = maandagVan(e.date)
    ;(perWeek[k] ||= []).push(w)
  })
  return Object.keys(perWeek).sort().map(k => ({
    week: k,
    gemiddelde: Math.round((perWeek[k].reduce((t, v) => t + v, 0) / perWeek[k].length) * 10) / 10,
    metingen: perWeek[k].length,
  }))
}

/**
 * Verwacht gewicht op een datum, volgens het weekdoel van de fase.
 * Dit is de planlijn die in de grafiek getekend wordt.
 */
export function verwachtGewicht(fase, datum) {
  if (!fase?.start_gewicht || !fase?.started_on) return null
  const weken = dagen(fase.started_on, datum) / 7
  if (weken < 0) return null
  const perWeek = Number(fase.week_doel_kg) || 0
  return Math.round((Number(fase.start_gewicht) + perWeek * weken) * 10) / 10
}

/**
 * Ligt de klant op plan?
 *
 * Werkwijze: vergelijk het gemeten tempo (eerste vs. laatste weekgemiddelde
 * binnen de fase) met het afgesproken tempo. Zit het gemeten tempo binnen
 * MARGE van het afgesproken tempo, dan is het op plan.
 *
 * De drempels zijn een keuze, geen wet:
 *  - MIN_WEKEN 2: onder de twee weken is elk oordeel ruis. Water, zout en
 *    darminhoud bewegen makkelijk een kilo; dat is bij een doel van 0,25 kg
 *    per week vier weken "vooruitgang" in één dag.
 *  - MARGE 0,5: een halve kilo doel per week en je haalt 0,3 — dat is geen
 *    probleem, dat is een normale week. Pas onder de helft van het tempo is
 *    er iets om over te praten.
 *  - Bij recomp en behoud is het doel juist géén verandering; daar kijken we
 *    of het gewicht binnen een halve kilo van het startpunt blijft.
 *
 * @returns {{status, label, tempo, verwachtTempo, weken, uitleg}|null}
 */
export function beoordeelFase(fase, history) {
  if (!fase) return null
  const weken = weekGemiddelden(history, fase.started_on)
  const aantalMetingen = weken.reduce((t, w) => t + w.metingen, 0)

  if (weken.length < MIN_WEKEN || aantalMetingen < MIN_METINGEN) {
    return {
      status: 'te_vroeg',
      label: 'Nog te vroeg',
      uitleg: `Nog ${Math.max(0, MIN_WEKEN - weken.length)} week/weken en ${Math.max(0, MIN_METINGEN - aantalMetingen)} meting(en) nodig voor een betrouwbaar oordeel.`,
      weken: weken.length,
    }
  }

  const eerste = weken[0], laatste = weken[weken.length - 1]
  const weekAfstand = Math.max(1, dagen(eerste.week, laatste.week) / 7)
  const tempo = Math.round(((laatste.gemiddelde - eerste.gemiddelde) / weekAfstand) * 100) / 100
  const verwachtTempo = Number(fase.week_doel_kg) || 0
  const basis = { tempo, verwachtTempo, weken: weken.length }

  // Recomp en behoud: het doel is stilstand, dus we kijken naar de afwijking
  // in kilo's en niet naar een tempo dat nul hoort te zijn.
  if (verwachtTempo === 0) {
    const afwijking = Math.abs(laatste.gemiddelde - Number(fase.start_gewicht ?? eerste.gemiddelde))
    if (afwijking <= 0.5) return { ...basis, status: 'op_plan', label: 'Op plan', uitleg: `Gewicht blijft binnen een halve kilo van het startpunt.` }
    return {
      ...basis, status: 'naast_plan', label: 'Niet op plan',
      uitleg: `${afwijking.toFixed(1)} kg van het startpunt af, terwijl het doel stabiel blijven is.`,
    }
  }

  const verhouding = tempo / verwachtTempo   // 1 = precies op tempo

  if (verhouding < 0) {
    return {
      ...basis, status: 'naast_plan', label: 'Verkeerde kant op',
      uitleg: `Beweegt ${tempo > 0 ? 'omhoog' : 'omlaag'} terwijl het doel de andere kant op is.`,
    }
  }
  if (verhouding < 1 - MARGE) {
    return {
      ...basis, status: 'achter', label: 'Achter op plan',
      uitleg: `${tempo > 0 ? '+' : ''}${tempo} kg/week gemeten, ${verwachtTempo > 0 ? '+' : ''}${verwachtTempo} afgesproken.`,
    }
  }
  if (verhouding > 1 + MARGE) {
    return {
      ...basis, status: 'voor', label: 'Sneller dan plan',
      uitleg: `${tempo > 0 ? '+' : ''}${tempo} kg/week gemeten, ${verwachtTempo > 0 ? '+' : ''}${verwachtTempo} afgesproken. Bij een build kan dat extra vet betekenen.`,
    }
  }
  return {
    ...basis, status: 'op_plan', label: 'Op plan',
    uitleg: `${tempo > 0 ? '+' : ''}${tempo} kg/week, doel ${verwachtTempo > 0 ? '+' : ''}${verwachtTempo}.`,
  }
}

export const STATUS_KLEUR = {
  op_plan:    '#10b981',
  achter:     '#f59e0b',
  voor:       '#f59e0b',
  naast_plan: '#ef4444',
  te_vroeg:   'rgba(255,255,255,0.35)',
}
