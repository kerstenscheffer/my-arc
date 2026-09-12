// src/modules/workout/components/todays-workout/rusttijd.js
//
// De rusttijd van een oefening: wat de coach in het schema zette, en wat de
// klant er zelf van maakte.
//
// De coach vult `rust` als vrije tekst in de plan-bouwer. In de schema's staat
// van alles: "2 min", "90s", "3min", "60-90 seconds", "2-3 minutes", "3-4min",
// "45s", "240s" — en een typefout als "8-3min". Daarom een parser en geen
// parseInt.

const MIN_SEC = 15
const MAX_SEC = 600
export const STANDAARD_SEC = 90

const SLEUTEL = (naam) => `myarc.rust.${naam}`
const AAN_SLEUTEL = 'myarc.rust.aan'

// "2 min" → 120, "60-90s" → 90, "3min" → 180, "240s" → 240.
//
// Bij een reeks het LAATSTE getal: dat is de bovengrens van "60-90s", en het
// redt meteen de typefout "8-3min" (3 minuten in plaats van acht).
export function parseRusttijd(tekst) {
  if (tekst == null) return null
  const s = String(tekst).toLowerCase().trim()
  if (!s) return null

  const getallen = s.match(/\d+(?:[.,]\d+)?/g)
  if (!getallen || getallen.length === 0) return null
  const laatste = parseFloat(getallen[getallen.length - 1].replace(',', '.'))
  if (!Number.isFinite(laatste) || laatste <= 0) return null

  const inMinuten = /min/.test(s)
  const inSeconden = /sec|(^|\d|\s)s\b|\ds$/.test(s)

  let sec
  if (inMinuten) sec = laatste * 60
  else if (inSeconden) sec = laatste
  // Geen eenheid: een klein getal is bijna altijd minuten ("2"), een groot
  // getal seconden ("90").
  else sec = laatste <= 10 ? laatste * 60 : laatste

  return Math.max(MIN_SEC, Math.min(MAX_SEC, Math.round(sec)))
}

// Wat de klant zelf voor deze oefening heeft ingesteld, of null.
export function eigenRusttijd(oefeningNaam) {
  try {
    const n = parseInt(localStorage.getItem(SLEUTEL(oefeningNaam)), 10)
    return Number.isFinite(n) && n >= MIN_SEC && n <= MAX_SEC ? n : null
  } catch {
    return null
  }
}

export function bewaarRusttijd(oefeningNaam, sec) {
  try { localStorage.setItem(SLEUTEL(oefeningNaam), String(sec)) } catch { /* privémodus */ }
}

// De rusttijd die de timer moet gebruiken, plus waar hij vandaan komt.
// Eigen instelling gaat vóór het schema: heeft de klant hem een keer
// aangepast, dan hoort hij dat niet elke set opnieuw te doen.
export function rusttijdVoor(oefening) {
  const eigen = eigenRusttijd(oefening?.name)
  if (eigen != null) return { sec: eigen, bron: 'eigen' }
  const uitPlan = parseRusttijd(oefening?.rust ?? oefening?.rest)
  if (uitPlan != null) return { sec: uitPlan, bron: 'coach' }
  return { sec: STANDAARD_SEC, bron: 'standaard' }
}

// De aan/uit-schakelaar van de timer. Onthouden, want dit is een voorkeur en
// geen keuze per oefening: wie met een timer traint, doet dat de hele workout.
export function timerStaatAan() {
  try { return localStorage.getItem(AAN_SLEUTEL) === '1' } catch { return false }
}

export function bewaarTimerAan(aan) {
  try { localStorage.setItem(AAN_SLEUTEL, aan ? '1' : '0') } catch { /* privémodus */ }
}
