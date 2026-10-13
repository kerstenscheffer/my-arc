// src/modules/meal-plan/utils/dagVenster.js
//
// Begin en eind van één kalenderdag in de tijdzone van de telefoon, als ISO.
//
// De ringen en de weekgrafiek vroegen consumed_meals op met
// `${datum}T00:00:00` zonder tijdzone. Postgres leest dat als UTC, dus in
// Nederland liep "vandaag" van 02:00 tot 02:00. De tijdlijn met de gelogde
// maaltijden rekende wél in lokale tijd. Gevolg: de som van de kaartjes en de
// ringen/grafiek liepen uiteen zodra er iets rond middernacht stond, en de
// dag-sleutel (toISOString) sprong vóór 02:00 naar gisteren.

export function dagVenster(datum) {
  const start = datum instanceof Date ? new Date(datum) : lokaleDag(datum)
  start.setHours(0, 0, 0, 0)
  const eind = new Date(start)
  eind.setDate(eind.getDate() + 1)
  return { vanaf: start.toISOString(), tot: eind.toISOString() }
}

// 'JJJJ-MM-DD' → Date op lokale middernacht (new Date('JJJJ-MM-DD') is UTC).
export function lokaleDag(iso) {
  const [j, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(j, m - 1, d)
}

// Date → 'JJJJ-MM-DD' in lokale tijd.
export function lokaleIso(datum) {
  const d = datum instanceof Date ? datum : new Date(datum)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
