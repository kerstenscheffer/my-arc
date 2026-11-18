// src/modules/client-checkin/checkinWeek.js
//
// Over welke week gaat de check-in? Eén plek, zodat het formulier, de
// cijfers erin, de doelen en de herinnering allemaal dezelfde dagen bedoelen.
//
// Sinds 18 nov 2026 (Kersten): gewone weken, maandag t/m zondag. Dat was
// vrijdag-tot-vrijdag voor de check-in en zaterdag-op-zaterdag voor het
// gewicht, twee verschillende weken naast elkaar.
//
//   - De check-in staat open op zaterdag en zondag en gaat dan over de week
//     die op die zondag eindigt (maandag t/m vandaag).
//   - Wie later is (maandag t/m donderdag) vult hem in over de week die net
//     voorbij is, en telt als 1 tot 4 dagen te laat.
//   - Vrijdag is stil: te laat voor de vorige week, de nieuwe is nog niet open.
//     Een check-in die toch op vrijdag binnenkomt (oudere app-versies vragen
//     er dan nog om) hoort bij de week waarin die vrijdag valt.
//
// Daarmee hoort een check-in bij "de laatste vrijdag of later": precies wat
// CheckinService.hasCheckinSinceLastFriday al controleert. Die blijft dus zo.

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function checkinWeek(nu = new Date()) {
  const vandaag = new Date(nu); vandaag.setHours(12, 0, 0, 0)
  const dag = vandaag.getDay()                       // 0 = zondag … 6 = zaterdag
  const sindsMaandag = (dag + 6) % 7                 // ma 0 … zo 6
  const dezeMaandag = new Date(vandaag); dezeMaandag.setDate(vandaag.getDate() - sindsMaandag)
  // Vrijdag t/m zondag: deze week. Maandag t/m donderdag: de week ervoor.
  const lopend = dag === 5 || dag === 6 || dag === 0
  const maandag = new Date(dezeMaandag); if (!lopend) maandag.setDate(maandag.getDate() - 7)
  const zondag = new Date(maandag); zondag.setDate(maandag.getDate() + 6)
  const d = new Date(zondag); d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const weeknummer = Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 86400000 + 1) / 7)
  return {
    start: iso(maandag),                             // maandag
    eind: iso(zondag),                               // zondag
    totNu: lopend ? iso(vandaag) : iso(zondag),      // tot waar er al iets te meten valt
    lopend,                                          // de week is nog bezig
    open: dag === 6 || dag === 0,                    // zaterdag en zondag: nu invullen
    dagenLaat: lopend ? 0 : sindsMaandag + 1,        // ma 1 … do 4
    weeknummer,
  }
}

// "wk 47 · 16 t/m 22 nov"
export function checkinWeekLabel(week = checkinWeek()) {
  const kort = (x) => new Date(`${x}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }).replace('.', '')
  return `wk ${week.weeknummer} · ${kort(week.start)} t/m ${kort(week.eind)}`
}
