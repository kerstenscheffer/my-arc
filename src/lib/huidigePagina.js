// src/lib/huidigePagina.js
//
// Waar is de coach nu in CoachHub, en wat staat er op het scherm? Gino (de
// zwevende Business OS-chat) stuurt dit mee bij elke vraag, zodat hij weet
// waar je naar kijkt (10 nov 2026).
//
// CoachHub zet de pagina (zetPagina). De zichtbare tekst wordt pas gelezen op
// het moment dat je een vraag stuurt, zodat hij altijd actueel is.

let stand = { tabblad: null, pagina: null, adres: '', split: null, extra: {} }

export function zetPagina(p) {
  stand = { ...stand, ...p, extra: { ...stand.extra, ...(p.extra || {}) } }
}

const MAX_TEKST = 1800

// Leesbare tekst van wat er nu open staat. Eerst open vensters (modals die
// naar <body> geportald zijn), dan de hoofdpagina. De Gino-chat zelf en de
// navigatiebalk tellen niet mee.
function zichtbareTekst() {
  if (typeof document === 'undefined') return ''
  const schoon = (t) => String(t || '').replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim()
  const hoofd = document.querySelector('[data-coach-hoofd]')
  const delen = []
  for (const el of Array.from(document.body.children)) {
    if (el.contains(hoofd) || el.querySelector?.('[data-bos-blok]') || el.matches?.('script, style, noscript')) continue
    const t = schoon(el.innerText)
    if (t.length > 40) delen.push(`[Open venster]\n${t}`)
  }
  if (hoofd) delen.push(schoon(hoofd.innerText))
  const tekst = delen.join('\n\n')
  return tekst.length > MAX_TEKST ? tekst.slice(0, MAX_TEKST) + ' …' : tekst
}

export function paginaVoorGino() {
  return {
    pagina: stand.pagina || stand.tabblad,
    tabblad: stand.tabblad,
    // Live gelezen: binnen een tab verandert het adres (#ai-meals:<plan-id>).
    adres: (typeof window !== 'undefined' ? window.location.hash : stand.adres) || null,
    splitRechts: stand.split || null,
    ...Object.fromEntries(Object.entries(stand.extra).filter(([, v]) => v != null && v !== '')),
    zichtbareTekst: zichtbareTekst(),
  }
}
