// src/modules/challenge-monitor/challengePrognose.js
//
// Lijkt een klant de challenge te halen, op basis van hoever die is? Puur rekenwerk.
// Twee vragen per eis:
//   1. Kan het nog? Telt op wat er in de resterende tijd maximaal bij kan.
//   2. Ligt het op schema? Vergelijkt met wat er na de volle weken zou moeten staan, met wat
//      speling: één keer iets missen is nog geen uitval.
// Een eis die niet meer kan of achterloopt, geeft een kruisje. Een schatting, geen oordeel:
// het echte oordeel over de borg blijft borgOordeel.

const WEKEN = 6
const SPELING = { workouts: 2, wegingen: 3, voeding: 1, checkins: 1, fotos: 0, calls: 1 }

export function prognose(waarden, nodigPerEis, { start, eind, nu = new Date() }) {
  const dag = (s) => new Date(`${s}T12:00:00`).getTime()
  const totaal = Math.max(1, Math.round((dag(eind) - dag(start)) / 864e5) + 1)
  const gedaan = Math.min(totaal, Math.max(0, Math.floor((nu.getTime() - dag(start)) / 864e5) + 1))
  const over = totaal - gedaan
  const volleWeken = Math.min(WEKEN, Math.floor((gedaan / totaal) * WEKEN + 1e-9))
  const wekenOver = WEKEN - volleWeken

  const maxErbij = {
    workouts: wekenOver * 4,
    wegingen: over,
    voeding: wekenOver,
    checkins: wekenOver,
    fotos: 3,
    calls: wekenOver,
  }
  // Foto's: begin, midden en einde. De rest loopt gelijk op met de weken.
  const verwacht = (key, nodig) => {
    if (key === 'fotos') return volleWeken >= WEKEN ? 3 : volleWeken >= 3 ? 2 : volleWeken >= 1 ? 1 : 0
    return Math.max(0, Math.floor((nodig * volleWeken) / WEKEN) - (SPELING[key] || 0))
  }

  const regels = {}
  for (const [key, nodig] of Object.entries(nodigPerEis)) {
    const waarde = Number(waarden[key]) || 0
    const kan = waarde + (maxErbij[key] ?? 0) >= nodig
    const minimaal = verwacht(key, nodig)
    regels[key] = { kan, opSchema: waarde >= minimaal, minimaal }
  }
  const lijst = Object.values(regels)
  return { ok: lijst.every(r => r.kan && r.opSchema), kanNog: lijst.every(r => r.kan), gestart: gedaan > 0, regels }
}
