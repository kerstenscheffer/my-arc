// src/modules/meal-plan/components/food-log/useZoekLog.js
//
// Legt elke zoekpoging vast in zoek_log (25 okt 2026). Doel: zien wat
// klanten zoeken en niet vinden. Zoeken zonder iets aan te klikken = de
// zoeker schoot tekort.
//
// Eén poging = één rij, niet elke toetsaanslag. "k" → "ko" → "koffie" is één
// poging; we bewaren de langste term en de resultaten daarvan. Wordt de term
// iets anders ("koffie" → wissen → "kip"), dan sluit de vorige poging als
// geen_klik en begint een nieuwe. Klikt de klant een resultaat aan, dan
// sluit de poging als gekozen, met naam en plek in de lijst.
//
// Schrijven mag nooit het zoeken hinderen: fouten gaan stil.

import { useEffect, useRef } from 'react'

const hoortBij = (a, b) => a.startsWith(b) || b.startsWith(a)

export default function useZoekLog({ db, client, modus = 'products', context = null }) {
  const poging = useRef(null)

  const schrijf = (p, uitkomst, keuze = null) => {
    if (!db?.supabase || !p || p.term.length < 2) return
    db.supabase.from('zoek_log').insert({
      client_id: client?.id || null,
      zoekterm: keuze ? p.laatste : p.term,
      laatste_term: p.laatste,
      modus,
      context,
      aantal_resultaten: keuze ? p.laatsteAantal : p.aantal,
      top_resultaten: keuze ? p.laatsteTop : p.top,
      uitkomst,
      gekozen_naam: keuze?.naam || null,
      gekozen_id: keuze?.id != null ? String(keuze.id) : null,
      gekozen_positie: keuze?.positie ?? null,
      gekozen_bron: keuze?.bron || null,
      duur_ms: Date.now() - p.start,
    }).then(r => r, () => {})
  }

  const sluit = (uitkomst = 'geen_klik', keuze = null) => {
    const p = poging.current
    poging.current = null
    schrijf(p, uitkomst, keuze)
  }

  // Na elke zoekopdracht met de resultaten van díé term.
  const noteer = (term, resultaten = []) => {
    const t = String(term || '').trim().toLowerCase()
    if (t.length < 2) return
    const top = resultaten.slice(0, 5).map(r => r?.name).filter(Boolean)
    const p = poging.current
    if (p && !hoortBij(t, p.laatste)) sluit('geen_klik')
    const nu = poging.current
    if (!nu) {
      poging.current = { term: t, laatste: t, aantal: resultaten.length, top, laatsteAantal: resultaten.length, laatsteTop: top, start: Date.now() }
      return
    }
    nu.laatste = t
    nu.laatsteAantal = resultaten.length
    nu.laatsteTop = top
    if (t.length >= nu.term.length) { nu.term = t; nu.aantal = resultaten.length; nu.top = top }
  }

  const gekozen = (item, positie) => {
    if (!poging.current) return
    sluit('gekozen', { naam: item?.name || null, id: item?.id ?? null, positie: positie + 1, bron: item?.source || null })
  }

  // Venster dicht of ander tabblad: de open poging telt als geen klik.
  useEffect(() => () => sluit('geen_klik'), []) // eslint-disable-line react-hooks/exhaustive-deps

  return { noteer, gekozen, sluit }
}
