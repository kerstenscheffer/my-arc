// src/modules/business-os/aanbodOpslag.js
//
// Laden en bewaren van de aanbod-rekenaar (Aanbod.jsx). Eén rij per coach in
// business_os_aanbod (business-os-aanbod.sql), zodat Mac en telefoon gelijk
// lopen. Nog geen rij = de beginwaarden uit aanbodData.js.
// useAanbod (23 nov 2026): de stand van de pagina woont in BusinessOS, niet in
// Aanbod.jsx. Zo kan de pagina wisselen tussen boven de bol (Rekenen) en
// schermvullend (Laten zien) zonder iets kwijt te raken, ziet Gino dezelfde
// waarden in zijn context, en haalt de pagina de rij opnieuw op zodra Gino hem
// bijwerkt (WIJZIGING_GEDAAN, of na elk antwoord via laad).

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { normaliseer, AANBOD_TABEL } from './aanbodData'

// BusinessChat meldt hiermee dat een wijziging_voorstel is uitgevoerd of
// teruggedraaid (detail.tabel). Wie die tabel toont, haalt hem opnieuw op.
export const WIJZIGING_GEDAAN = 'bos-wijziging-gedaan'

const STAND_KEY = 'business_os_aanbod_stand'
const leesStand = () => {
  try { return localStorage.getItem(STAND_KEY) === 'tonen' ? 'tonen' : 'rekenen' } catch { return 'rekenen' }
}

async function eigenId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || null
}

// → { gegevens, id } of { fout: true }. id = coach_id van de rij, null zolang
// er nog geen rij is. Bij een fout nooit de beginwaarden tonen: de eerste
// wijziging zou dan over de echte rij heen schrijven.
export async function laadAanbod() {
  try {
    const id = await eigenId()
    if (!id) return { fout: true }
    const { data, error } = await supabase.from(AANBOD_TABEL).select('coach_id, gegevens').eq('coach_id', id).maybeSingle()
    if (error) return { fout: true }
    return { gegevens: normaliseer(data?.gegevens), id: data?.coach_id || null }
  } catch {
    return { fout: true }
  }
}

// → true als het in de database staat.
export async function bewaarAanbod(gegevens) {
  try {
    const id = await eigenId()
    if (!id) return false
    const { error } = await supabase.from(AANBOD_TABEL)
      .upsert({ coach_id: id, gegevens, updated_at: new Date().toISOString() }, { onConflict: 'coach_id' })
    return !error
  } catch {
    return false
  }
}

// aan  = deze gebruiker mag het aanbod zien (niet voor teamleden, niet zwevend)
// open = de pagina staat open
// → { g, id, laadFout, nietBewaard, duur, setDuur, stand, kiesStand, wijzig, laad }
export function useAanbod({ aan = true, open = false } = {}) {
  const [g, setG] = useState(null)
  const [id, setId] = useState(null)
  const [laadFout, setLaadFout] = useState(false)
  const [nietBewaard, setNietBewaard] = useState(false)
  const [duur, setDuur] = useState(6)
  // De laatst gekozen stand blijft per apparaat staan, zodat het scherm voor een
  // call alvast op Laten zien kan.
  const [stand, setStand] = useState(leesStand)

  // Opslag: de nieuwste stand wacht kort (typen) en gaat dan in één keer weg.
  const gRef = useRef(null)
  const wacht = useRef(null)      // nieuwste gegevens die nog niet in de database staan
  const timer = useRef(null)
  const onderweg = useRef(false)  // er loopt een schrijfactie
  const opnieuw = useRef(false)   // laden gevraagd terwijl er nog iets weg moest
  const laadNr = useRef(0)
  const laadRef = useRef(null)

  // Eén schrijfactie tegelijk, zodat een oudere nooit over een nieuwere heen
  // komt: wat tijdens het schrijven getypt wordt gaat er direct achteraan.
  const schrijf = useCallback(async () => {
    clearTimeout(timer.current)
    timer.current = null
    if (onderweg.current) return
    while (wacht.current) {
      const wat = wacht.current
      wacht.current = null
      onderweg.current = true
      const ok = await bewaarAanbod(wat)
      onderweg.current = false
      setNietBewaard(!ok)
      if (!ok) {
        // Niets nieuwers getypt: bewaren voor de volgende poging (volgende
        // wijziging, scherm uit beeld of sluiten).
        if (!wacht.current) wacht.current = wat
        break
      }
    }
    // Er kwam een verzoek om te laden binnen terwijl er nog iets weg moest
    // (Gino werkte de rij bij): nu alles bewaard is alsnog ophalen.
    if (opnieuw.current && !wacht.current) laadRef.current?.()
  }, [])

  const laad = useCallback(async () => {
    // Niet over eigen, nog niet bewaarde wijzigingen heen laden.
    if (wacht.current || onderweg.current) { opnieuw.current = true; return }
    opnieuw.current = false
    const nr = ++laadNr.current
    const uit = await laadAanbod()
    // Alleen het laatst gestarte antwoord telt: een trager, ouder antwoord mag
    // de nieuwe waarden niet terugzetten.
    if (nr !== laadNr.current) return
    if (wacht.current || onderweg.current) { opnieuw.current = true; return }
    if (uit.fout) { if (!gRef.current) setLaadFout(true); return }
    setId(uit.id)
    setLaadFout(false)
    // Zelfde inhoud: niets opnieuw tekenen.
    if (gRef.current && JSON.stringify(gRef.current) === JSON.stringify(uit.gegevens)) return
    gRef.current = uit.gegevens
    setG(uit.gegevens)
  }, [])
  useEffect(() => { laadRef.current = laad }, [laad])

  const wijzig = useCallback((maak) => {
    if (!gRef.current) return
    const nieuw = maak(gRef.current)
    gRef.current = nieuw
    wacht.current = nieuw
    setG(nieuw)
    clearTimeout(timer.current)
    timer.current = setTimeout(schrijf, 600)
  }, [schrijf])

  const kiesStand = useCallback((s) => {
    setStand(s)
    try { localStorage.setItem(STAND_KEY, s) } catch { /* privé-venster */ }
  }, [])

  // Eén keer bij binnenkomst, voor Gino's context.
  useEffect(() => { if (aan) laad() }, [aan, laad])

  // Pagina open: laden, en opnieuw als het scherm weer in beeld komt (wijziging
  // op het andere apparaat). Uit beeld of dicht: meteen wegschrijven.
  useEffect(() => {
    if (!aan || !open) return undefined
    // Eerder niet bewaard (geen verbinding): eerst dat opnieuw proberen, laden volgt daarna vanzelf.
    if (wacht.current) schrijf()
    laad()
    const zicht = () => { if (document.visibilityState === 'hidden') schrijf(); else laad() }
    document.addEventListener('visibilitychange', zicht)
    return () => { document.removeEventListener('visibilitychange', zicht); schrijf() }
  }, [aan, open, laad, schrijf])

  // Gino (of Ongedaan maken) raakte de rij: opnieuw ophalen.
  useEffect(() => {
    if (!aan) return undefined
    const gedaan = (e) => { if (e.detail?.tabel === AANBOD_TABEL) laad() }
    window.addEventListener(WIJZIGING_GEDAAN, gedaan)
    return () => window.removeEventListener(WIJZIGING_GEDAAN, gedaan)
  }, [aan, laad])

  return { g, id, laadFout, setLaadFout, nietBewaard, duur, setDuur, stand, kiesStand, wijzig, laad }
}
