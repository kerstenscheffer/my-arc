// src/utils/tijd.js
//
// Een tijdstip uit de database goed lezen, ook als de tijdzone ontbreekt.
//
// Waarom dit bestaat: bijna honderd tabellen bewaren hun tijden als
// "timestamp without time zone". De database staat op UTC, dus de waarden
// zijn UTC — maar zonder markering. PostgREST levert ze dan als
// "2026-09-05T07:00:00" en de browser leest dat volgens de spec als lókale
// tijd. In Nederlandse zomertijd scheelt dat precies twee uur, en dat is
// waarom een melding van tien minuten oud als "2u geleden" in de bel stond.
//
// De fout is stil: er komt geen foutmelding, er staat gewoon een verkeerd
// getal. Daarom liever hier één keer goed dan op elke plek opnieuw.

/**
 * Leest een tijdstip uit de database. Ontbreekt de tijdzone, dan wordt het
 * als UTC gelezen in plaats van als lokale tijd.
 *
 * Staat de tijdzone er wél in — na een conversie naar timestamptz, of bij een
 * kolom die het altijd al goed deed — dan blijft die gerespecteerd.
 *
 * @param {string|number|Date} waarde
 * @returns {Date|null} null bij een lege of onleesbare waarde
 */
export function leesTijdstip(waarde) {
  if (!waarde) return null
  if (waarde instanceof Date) return isNaN(waarde) ? null : waarde
  if (typeof waarde === 'number') return new Date(waarde)

  let s = String(waarde).trim()
  if (!s) return null

  // Postgres schrijft een spatie tussen datum en tijd; de Date-constructor
  // wil een T. Safari is hier strenger in dan Chrome.
  s = s.replace(' ', 'T')

  // Al een tijdzone? Dan niets toevoegen. Let op de vorm: het teken moet ná
  // de tijd staan, anders ziet het streepje in de datum eruit als een min.
  const heeftZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)
  const d = new Date(heeftZone ? s : s + 'Z')
  return isNaN(d) ? null : d
}

/**
 * Hoe lang geleden, kort: net · 12m · 3u · 5d · 2w.
 *
 * @param {string|number|Date} waarde
 * @param {string} leeg  wat te tonen als er geen tijdstip is
 */
export function geleden(waarde, leeg = '') {
  const d = leesTijdstip(waarde)
  if (!d) return leeg

  const min = Math.floor((Date.now() - d.getTime()) / 60000)

  // Een tijdstip in de toekomst is bijna altijd een klok die een paar
  // seconden voorloopt. "over 3 minuten" bij een net binnengekomen melding
  // leest als een storing; "net" is dan eerlijker.
  if (min < 1) return 'net'
  if (min < 60) return `${min}m`
  const uur = Math.floor(min / 60)
  if (uur < 24) return `${uur}u`
  const dag = Math.floor(uur / 24)
  if (dag < 7) return `${dag}d`
  return `${Math.floor(dag / 7)}w`
}

/**
 * Zelfde idee, langere vorm: Zojuist · 12m geleden · 3u geleden · 5d geleden.
 * Ouder dan een week wordt een datum — "9d geleden" zegt minder dan "27 aug".
 *
 * @param {string|number|Date} waarde
 * @param {string} leeg  wat te tonen als er geen tijdstip is
 */
export function geledenLang(waarde, leeg = '') {
  const d = leesTijdstip(waarde)
  if (!d) return leeg

  const min = Math.floor((Date.now() - d.getTime()) / 60000)
  if (min < 1) return 'Zojuist'
  if (min < 60) return `${min}m geleden`
  const uur = Math.floor(min / 60)
  if (uur < 24) return `${uur}u geleden`
  const dag = Math.floor(uur / 24)
  if (dag < 7) return `${dag}d geleden`
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

/**
 * Een wandklok-invoer leesbaar maken: "2026-09-12T10:00" → "vr 12 sep 10:00".
 *
 * Let op het verschil met leesTijdstip hierboven. Dezelfde vorm zonder
 * tijdzone betekent op twee plekken iets anders:
 *
 *   · uit de database is het UTC zonder markering, en moet het als UTC
 *     gelezen worden;
 *   · uit een <input type="datetime-local"> is het de tijd die jij op de
 *     klok hebt gezet, dus al lokaal.
 *
 * Die door elkaar halen verschuift een afspraak twee uur. Vandaar twee
 * functies met elk hun eigen aanname, in plaats van één die moet raden.
 *
 * @param {string} waarde  vorm "JJJJ-MM-DDTuu:mm" uit een datetime-local
 * @param {string} leeg    wat te tonen als er niets is ingevuld
 */
export function wandklokNL(waarde, leeg = '—') {
  if (!waarde) return leeg
  const d = new Date(waarde)          // lokaal gelezen, precies de bedoeling
  if (isNaN(d)) return String(waarde)
  return d.toLocaleString('nl-NL', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
