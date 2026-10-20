// src/utils/opruimenOpslag.js
//
// Sleutels in localStorage die per dag of per training worden aangemaakt en
// nooit werden weggehaald. Na maanden gebruik werd de opslag groot en elke
// lees/schrijf trager. Eén keer per dag, na het opstarten, alles ouder dan
// een paar dagen weghalen. Alleen deze bekende, wegwerpbare sleutels.

const DAG = 86400000

const datumUit = (tekst) => {
  const m = /(\d{4}-\d{2}-\d{2})/.exec(tekst)
  return m ? new Date(m[1] + 'T12:00:00').getTime() : null
}

export default function ruimOpslagOp() {
  try {
    const vandaag = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem('myarc:opgeruimd') === vandaag) return
    const grens = Date.now() - 3 * DAG
    const weg = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('myarc:opgewarmd:') || k.startsWith('pumpTimer:') || k.startsWith('arc_dag_rond_')) {
        const t = datumUit(k)
        if (t && t < grens) weg.push(k)
      } else if (k.startsWith('workout_progress_')) {
        // Lijst met afgeronde trainingen: alleen de laatste 30 dagen worden
        // nog gelezen (getWeeklyProgress kijkt 7 dagen terug).
        try {
          const lijst = JSON.parse(localStorage.getItem(k) || '[]')
          if (Array.isArray(lijst)) {
            const kort = lijst.filter(p => new Date(p?.completed_at).getTime() > Date.now() - 30 * DAG)
            if (kort.length !== lijst.length) localStorage.setItem(k, JSON.stringify(kort))
          }
        } catch { weg.push(k) }
      }
    }
    weg.forEach(k => localStorage.removeItem(k))
    localStorage.setItem('myarc:opgeruimd', vandaag)
  } catch { /* geen opslag beschikbaar — niets te doen */ }
}
