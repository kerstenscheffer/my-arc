// src/modules/business-os/documentData.js
//
// Data voor het document in het Gino-scherm (tabel business_os_documenten,
// business-os-documenten.sql). Het scherm staat in GinoDocument.jsx.
//
// Sinds 20 nov 2026 werkt het als Google Docs: elke rij is een tab, subtabs via
// parent_id, volgorde via volgorde, verwijderen = verwijderd_op (rij blijft staan).
// Kersten en Gino schrijven allebei in de tabs.

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TABEL = 'business_os_documenten'
const KOLOMMEN = 'id, slug, titel, inhoud, parent_id, volgorde, vastgezet, updated_at'

const sorteer = (a, b) => (a.volgorde - b.volgorde) || String(a.titel).localeCompare(String(b.titel))

// { tabs, geladen, laad, bewaar, nieuw, hernoem, verwijder, verplaats, verplaatsNaar, zetVast }
export function useGinoDocumenten() {
  const [tabs, setTabs] = useState([])
  const [geladen, setGeladen] = useState(false)

  const laad = useCallback(async () => {
    const { data, error } = await supabase.from(TABEL).select(KOLOMMEN).is('verwijderd_op', null)
      .then(r => r, e => ({ error: e }))
    // Netwerkfout: laat staan wat er al staat.
    if (!error) setTabs((data || []).sort(sorteer))
    setGeladen(true)
  }, [])
  useEffect(() => { laad() }, [laad])

  const zet = (rij) => setTabs(t => t.map(x => (x.id === rij.id ? rij : x)).sort(sorteer))

  const wijzig = useCallback(async (id, velden) => {
    const { data, error } = await supabase.from(TABEL).update(velden).eq('id', id).select(KOLOMMEN).single()
      .then(r => r, e => ({ error: e }))
    if (error) return false
    zet(data)
    return true
  }, [])

  // Geeft true als het is opgeslagen.
  const bewaar = useCallback((id, inhoud) => wijzig(id, { inhoud }), [wijzig])
  const hernoem = useCallback((id, titel) => wijzig(id, { titel: titel.trim() || 'Naamloos tabblad' }), [wijzig])

  // Nieuwe tab achteraan bij zijn broertjes; geeft de nieuwe rij terug (of null).
  const nieuw = useCallback(async ({ titel = 'Naamloos tabblad', parent_id = null } = {}) => {
    const broers = tabs.filter(t => (t.parent_id || null) === parent_id)
    const volgorde = broers.length ? Math.max(...broers.map(t => t.volgorde)) + 1 : 0
    const slug = `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const { data, error } = await supabase.from(TABEL).insert({ slug, titel, inhoud: '', parent_id, volgorde }).select(KOLOMMEN).single()
      .then(r => r, e => ({ error: e }))
    if (error) return null
    setTabs(t => [...t, data].sort(sorteer))
    return data
  }, [tabs])

  // Subtabs schuiven één niveau omhoog, de tab zelf krijgt verwijderd_op.
  const verwijder = useCallback(async (id) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return false
    const kinderen = tabs.filter(t => t.parent_id === id)
    for (const k of kinderen) await wijzig(k.id, { parent_id: tab.parent_id || null })
    const { error } = await supabase.from(TABEL).update({ verwijderd_op: new Date().toISOString() }).eq('id', id)
      .then(r => r, e => ({ error: e }))
    if (error) return false
    setTabs(t => t.filter(x => x.id !== id))
    return true
  }, [tabs, wijzig])

  // richting -1 = omhoog, 1 = omlaag binnen dezelfde ouder.
  const verplaats = useCallback(async (id, richting) => {
    const tab = tabs.find(t => t.id === id)
    if (!tab) return
    const broers = tabs.filter(t => (t.parent_id || null) === (tab.parent_id || null))
    const j = broers.findIndex(t => t.id === id) + richting
    if (j < 0 || j >= broers.length) return
    const nieuwe = broers.map(t => t.id)
    nieuwe.splice(j - richting, 1)
    nieuwe.splice(j, 0, id)
    // Volgorde opnieuw nummeren, alleen wat verandert.
    await Promise.all(nieuwe.map((tid, i) => (broers.find(b => b.id === tid).volgorde !== i ? wijzig(tid, { volgorde: i }) : null)))
  }, [tabs, wijzig])

  // Slepen in de zijbalk: plek 'in' = subtab van doel (achteraan), 'voor'/'na' = naast doel.
  // Nooit in zijn eigen subtabs (dan raakt hij los van de boom).
  const verplaatsNaar = useCallback(async (id, doelId, plek) => {
    if (id === doelId) return
    const doel = tabs.find(t => t.id === doelId)
    if (!doel) return
    for (let p = doel; p; p = tabs.find(t => t.id === p.parent_id)) if (p.id === id) return
    const ouder = plek === 'in' ? doel.id : (doel.parent_id || null)
    const broers = tabs.filter(t => (t.parent_id || null) === ouder && t.id !== id)
    const plekIndex = plek === 'in' ? broers.length : broers.findIndex(t => t.id === doelId) + (plek === 'na' ? 1 : 0)
    broers.splice(plekIndex, 0, { id })
    const tab = tabs.find(t => t.id === id)
    await Promise.all(broers.map((b, i) => {
      // Bovenste niveau: hij komt in dezelfde sectie als het doel (Vastgezet of de gewone lijst).
      if (b.id === id) {
        // Als subtab volgt hij zijn ouder (anders sprong hij los naar Vastgezet).
        const velden = { parent_id: ouder, volgorde: i, vastgezet: ouder ? false : !!doel.vastgezet }
        return Object.entries(velden).some(([k, v]) => (tab[k] ?? null) !== v) ? wijzig(id, velden) : null
      }
      return b.volgorde !== i ? wijzig(b.id, { volgorde: i }) : null
    }))
  }, [tabs, wijzig])

  // Inspringen (subtab van de tab erboven) en uitspringen (één niveau omhoog), ook zonder slepen (telefoon).
  const springIn = useCallback(async (id) => {
    const tab = tabs.find(t => t.id === id)
    const broers = tabs.filter(t => (t.parent_id || null) === (tab?.parent_id || null))
    const boven = broers[broers.findIndex(t => t.id === id) - 1]
    if (boven) await verplaatsNaar(id, boven.id, 'in')
  }, [tabs, verplaatsNaar])
  const springUit = useCallback(async (id) => {
    const tab = tabs.find(t => t.id === id)
    if (tab?.parent_id) await verplaatsNaar(id, tab.parent_id, 'na')
  }, [tabs, verplaatsNaar])

  const zetVast = useCallback((id, aan) => wijzig(id, { vastgezet: aan }), [wijzig])

  return { tabs, geladen, laad, bewaar, nieuw, hernoem, verwijder, verplaats, verplaatsNaar, springIn, springUit, zetVast }
}

// Voor Gino's context: welke tabs er zijn, plus de avatar-tekst (ingekort) omdat die vaak nodig is.
export function documentenVoorGino(d, max = 1200) {
  const avatar = d.tabs.find(t => t.slug === 'avatar')
  const t = String(avatar?.inhoud || '').trim()
  return {
    tabel: TABEL, kolom: 'inhoud',
    let_op: 'Document met tabs naast Gino; Kersten en jij schrijven erin. Lees/vervang de hele inhoud per id. Nieuwe tab: insert met dezelfde coach_id, unieke slug, titel, inhoud, volgorde, eventueel parent_id.',
    tabs: d.tabs.map(x => ({ id: x.id, titel: x.titel, ...(x.parent_id ? { onder: x.parent_id } : null), tekens: (x.inhoud || '').length })),
    avatarTekst: t.length > max ? `${t.slice(0, max - 1)}…` : t,
  }
}

// Dicht/open per apparaat.
export function useDocumentDicht() {
  // Standaard weg: alleen zichtbaar als je hem opent (knop rechtsboven), 19 nov 2026.
  const [dicht, setDichtState] = useState(() => { try { return localStorage.getItem('bos_doc_open') !== '1' } catch { return true } })
  const setDicht = useCallback((v) => { setDichtState(v); try { localStorage.setItem('bos_doc_open', v ? '0' : '1') } catch { /* leeg */ } }, [])
  return [dicht, setDicht]
}
