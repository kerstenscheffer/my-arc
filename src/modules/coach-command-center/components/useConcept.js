// src/modules/coach-command-center/components/useConcept.js
//
// Een lopend formulier tussentijds bewaren in de database.
//
// Gebruikt door de check-in en de onboarding: allebei formulieren die je
// tijdens een call invult en waarbij je het venster tussendoor sluit. Wat je
// hebt ingevuld hoort dan bij de klant te staan en niet in de localStorage
// van dit ene apparaat — een gesprek dat je op de laptop begon wil je op de
// telefoon terugzien.
//
// Per (coach, klant, soort) één rij, zodat een check-in en een onboarding
// voor dezelfde klant elkaar niet overschrijven.

import { useState, useEffect, useRef, useCallback } from 'react'

const TABEL = 'checkin_drafts'

/**
 * @param {object}   o
 * @param {object}   o.db          DatabaseService (voor .supabase)
 * @param {string}   o.coachId
 * @param {string}   o.clientId
 * @param {string}   o.soort       'checkin' | 'onboarding'
 * @param {object}   o.waarde      huidige formulierstand
 * @param {Function} o.zetWaarde   setter voor die stand
 * @param {Function} o.heeftInhoud (waarde) => bool — is er iets ingevuld?
 * @param {Function} [o.uitConcept] (data) => waarde — bewaarde vorm klaarmaken
 * @returns {{ stand: string, wisConcept: Function }}
 *          stand is '' | 'bezig' | 'bewaard', voor de melding onder het formulier
 */
export function useConcept({ db, coachId, clientId, soort, waarde, zetWaarde, heeftInhoud, uitConcept }) {
  // Pas ná het laden mag er bewaard worden. Andersom overschrijft een leeg
  // formulier het concept dat er stond voordat het binnen was.
  const [geladen, setGeladen] = useState(false)
  const [stand, setStand] = useState('')
  const timer = useRef(null)

  // Laatste stand vasthouden voor het afsluiten. De bewaar-pauze wordt bij
  // het sluiten afgebroken; zonder dit ben je het laatste dat je typte kwijt
  // als je binnen een seconde het kruisje pakt.
  const laatste = useRef({ vuil: false })

  const sb = db?.supabase || null

  // De setter en de twee functies komen als losse props binnen en zijn bij
  // elke render een nieuwe referentie. In een ref houden scheelt dat de
  // effecten hieronder daarop opnieuw afgaan.
  const hulp = useRef({ zetWaarde, heeftInhoud, uitConcept })
  hulp.current = { zetWaarde, heeftInhoud, uitConcept }

  // ── Ophalen bij het openen ──
  useEffect(() => {
    if (!sb || !clientId || !coachId) { setGeladen(true); return }
    let leeft = true
    setGeladen(false)
    sb.from(TABEL).select('data')
      .eq('coach_id', coachId).eq('client_id', clientId).eq('soort', soort)
      .maybeSingle()
      .then(({ data }) => {
        if (!leeft) return
        const bewaard = data?.data
        if (bewaard && Object.keys(bewaard).length) {
          const { zetWaarde: zet, uitConcept: klaar } = hulp.current
          zet(klaar ? klaar(bewaard) : bewaard)
        }
        setGeladen(true)
      }, (e) => {
        // De fout wel benoemen. Faalt dit stil, dan begin je met een leeg
        // formulier terwijl je concept er nog is, en overschrijf je het.
        console.warn(`concept (${soort}) ophalen mislukt:`, e?.message)
        if (leeft) setGeladen(true)
      })
    return () => { leeft = false }
  }, [sb, clientId, coachId, soort])

  // ── Bewaren met een pauze van een seconde ──
  //
  // Bij elke toetsaanslag schrijven is zonde van de verbinding; een seconde
  // stilte betekent dat je even nadenkt of naar een ander veld gaat, en dat
  // is een prima moment.
  useEffect(() => {
    if (!geladen || !sb || !clientId || !coachId) return

    // Leeg formulier hoeft niet bewaard: anders legt het openen van dit
    // venster voor elke klant een lege rij aan. Stond er wél iets en heb je
    // het weer weggehaald, dan hoort het concept ook echt weg te zijn.
    const gevuld = hulp.current.heeftInhoud(waarde)
    laatste.current = { vuil: true, gevuld, waarde, coachId, clientId, soort, sb }
    setStand(gevuld ? 'bezig' : '')

    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const q = gevuld
          ? sb.from(TABEL).upsert(
              { coach_id: coachId, client_id: clientId, soort, data: waarde, updated_at: new Date().toISOString() },
              { onConflict: 'coach_id,client_id,soort' })
          : sb.from(TABEL).delete()
              .eq('coach_id', coachId).eq('client_id', clientId).eq('soort', soort)
        const { error } = await q
        if (error) throw error
        laatste.current.vuil = false
        setStand(gevuld ? 'bewaard' : '')
      } catch (e) {
        console.warn(`concept (${soort}) bewaren mislukt:`, e?.message)
        setStand('')
      }
    }, 1000)
    return () => clearTimeout(timer.current)
  }, [waarde, geladen, sb, clientId, coachId, soort])

  // ── Nog één keer wegschrijven bij het sluiten ──
  //
  // Bewust een lege lijst: dit hoort alleen bij het écht verdwijnen van het
  // venster te draaien, niet bij elke wijziging.
  useEffect(() => () => {
    const l = laatste.current
    if (!l.vuil || !l.sb || !l.coachId || !l.clientId) return
    if (l.gevuld) {
      l.sb.from(TABEL).upsert(
        { coach_id: l.coachId, client_id: l.clientId, soort: l.soort, data: l.waarde, updated_at: new Date().toISOString() },
        { onConflict: 'coach_id,client_id,soort' }).then(() => {}, () => {})
    } else {
      l.sb.from(TABEL).delete()
        .eq('coach_id', l.coachId).eq('client_id', l.clientId).eq('soort', l.soort).then(() => {}, () => {})
    }
  }, [])

  /**
   * Concept opruimen na het opslaan: het is nu een echt logboek-item. Laat je
   * 'm staan, dan zie je bij het volgende gesprek je vorige antwoorden terug.
   *
   * Zet eerst de tijd stop, anders schrijft de bewaar-pauze het zojuist
   * verwijderde concept meteen terug.
   */
  const wisConcept = useCallback(async () => {
    clearTimeout(timer.current)
    laatste.current = { vuil: false }
    setStand('')
    if (!sb || !clientId || !coachId) return
    try {
      await sb.from(TABEL).delete()
        .eq('coach_id', coachId).eq('client_id', clientId).eq('soort', soort)
    } catch (e) { console.warn(`concept (${soort}) opruimen mislukt:`, e?.message) }
  }, [sb, clientId, coachId, soort])

  return { stand, wisConcept }
}
