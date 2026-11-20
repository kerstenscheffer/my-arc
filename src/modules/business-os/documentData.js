// src/modules/business-os/documentData.js
//
// Data voor de documenten boven de Gino-bol (tabel business_os_documenten,
// business-os-documenten.sql). Het scherm staat in GinoDocument.jsx.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TABEL = 'business_os_documenten'
const KOLOMMEN = 'id, slug, titel, inhoud, updated_at'

export const AVATAR = {
  slug: 'avatar',
  titel: 'Avatar',
  inhoud: [
    '## Wie is hij',
    'Drukke Nederlandse of Vlaamse man die resultaat wil en van zijn leven wil blijven genieten.',
    '',
    '## Situatie',
    '- Leeftijd:',
    '- Werk en gezin:',
    '',
    '## Pijnpunten',
    '- ',
    '',
    '## Wat hij wil',
    '- ',
    '',
    '## Bezwaren',
    '- ',
    '',
    '## Zijn woorden',
    '- ',
  ].join('\n'),
}

// Tweede tab (20 nov 2026): Kerstens antwoorden uit de contentmap
// (07-KERSTENS-ANTWOORDEN.md). De starttekst staat in antwoordenStart.md en
// wordt pas geladen (eigen bestand) en opgeslagen als de tab voor het eerst open gaat.
export const ANTWOORDEN = {
  slug: 'antwoorden',
  titel: 'Antwoorden',
  inhoud: '',
  laadStart: () => import('./antwoordenStart.md?raw').then(m => m.default),
}

// { doc, laad, bewaar, stand } — doc is null zolang er nog niets is opgeslagen.
export function useGinoDocument(standaard) {
  const [doc, setDoc] = useState(null)
  const [geladen, setGeladen] = useState(false)
  const laad = useCallback(async () => {
    const { data, error } = await supabase.from(TABEL).select(KOLOMMEN).eq('slug', standaard.slug).maybeSingle()
      .then(r => r, e => ({ error: e }))
    // Netwerkfout: laat staan wat er al staat.
    if (!error) setDoc(data || null)
    setGeladen(true)
  }, [standaard.slug])
  useEffect(() => { laad() }, [laad])
  // Geeft true als het is opgeslagen.
  const bewaar = useCallback(async (inhoud) => {
    const { data, error } = await supabase.from(TABEL)
      .upsert({ slug: standaard.slug, titel: standaard.titel, inhoud }, { onConflict: 'coach_id,slug' })
      .select(KOLOMMEN).single()
      .then(r => r, e => ({ error: e }))
    if (error) return false
    setDoc(data)
    return true
  }, [standaard.slug, standaard.titel])
  // Eenmalig de starttekst opslaan als er nog geen rij is (alleen voor documenten met laadStart).
  const vult = useRef(false)
  const vulStart = useCallback(async () => {
    if (vult.current || !standaard.laadStart) return
    vult.current = true
    const tekst = await standaard.laadStart().then(t => t, () => null)
    if (tekst == null || !(await bewaar(tekst))) vult.current = false
  }, [standaard, bewaar])
  return { doc, geladen, laad, bewaar, vulStart: standaard.laadStart ? vulStart : null, tekst: doc?.inhoud ?? standaard.inhoud }
}

// Voor Gino's context: waar hij staat en de tekst (ingekort).
export function documentVoorGino(d, max = 1500) {
  const t = String(d.tekst || '').trim()
  return {
    tabel: TABEL, id: d.doc?.id || null, kolom: 'inhoud',
    let_op: d.doc?.id ? 'Aanpassen = de hele inhoud vervangen, bestaande tekst laten staan.' : 'Nog niet opgeslagen; Kersten vult hem eerst zelf.',
    tekst: t.length > max ? `${t.slice(0, max - 1)}…` : t,
  }
}

// Dicht/open per apparaat; BusinessOS gebruikt hem ook voor de maat van de kop erboven.
export function useDocumentDicht() {
  // Standaard weg: alleen zichtbaar als je hem opent (knop rechtsboven), 19 nov 2026.
  const [dicht, setDichtState] = useState(() => { try { return localStorage.getItem('bos_doc_open') !== '1' } catch { return true } })
  const setDicht = useCallback((v) => { setDichtState(v); try { localStorage.setItem('bos_doc_open', v ? '0' : '1') } catch { /* leeg */ } }, [])
  return [dicht, setDicht]
}

