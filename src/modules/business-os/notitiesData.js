// src/modules/business-os/notitiesData.js
//
// Data voor notities (tabel business_os_notities, business-os-notities.sql).
// Bestaat de tabel nog niet, dan staan notities in localStorage (per account).
// Zodra de tabel er is, zet laadNotities ze vanzelf over en maakt het lokaal leeg.
// De knop staat in VastzetKnop.jsx, het blad in Notities.jsx.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const TABEL = 'business_os_notities'
const KOLOMMEN = 'id, titel, tekst, created_at, updated_at'

// PostgREST (tabel niet in schema) of Postgres (tabel bestaat niet).
const tabelOntbreekt = (error) => error?.code === 'PGRST205' || error?.code === '42P01'

async function lokaalSleutel() {
  const { data } = await supabase.auth.getSession().then(r => r, () => ({ data: null }))
  return `business_os_notities_lokaal_${data?.session?.user?.id || 'zonder_account'}`
}
const leesLokaal = (sleutel) => {
  try { return JSON.parse(localStorage.getItem(sleutel)) || [] } catch { return [] }
}
const schrijfLokaal = (sleutel, lijst) => {
  try {
    if (lijst.length) localStorage.setItem(sleutel, JSON.stringify(lijst))
    else localStorage.removeItem(sleutel)
    return true
  } catch { return false }
}
const nieuwsteEerst = (a, b) => String(b.created_at).localeCompare(String(a.created_at))

// De tekst blijft letterlijk; alleen een achtergebleven actieblok gaat eraf.
export const notitieTekst = (tekst) => String(tekst || '').replace(/```acties[\s\S]*?(?:```|$)/g, '').trim()

// Eigen titel, anders de eerste regel zonder opmaaktekens.
export function notitieTitel(n) {
  if (typeof n?.titel === 'string' && n.titel.trim()) return n.titel.trim()
  const regel = String(n?.tekst || '').split('\n').find(r => r.trim()) || ''
  const kaal = regel.replace(/^\s*(#{1,6}\s+|→\s+|->\s+|=>\s+|•\s+|-\s+)/, '').replace(/\*\*/g, '').replace(/:\s*$/, '').trim()
  return (kaal.length > 80 ? `${kaal.slice(0, 79)}…` : kaal) || 'Notitie'
}

export const notitieDatum = (iso) => new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

// Geeft { lijst, lokaal }. lokaal = true: de tabel bestaat nog niet.
export async function laadNotities() {
  const sleutel = await lokaalSleutel()
  const bij = leesLokaal(sleutel)
  const { data, error } = await supabase.from(TABEL).select(KOLOMMEN)
    .order('created_at', { ascending: false }).limit(200)
    .then(r => r, e => ({ error: e }))
  if (error) return { lijst: bij.map(n => ({ ...n, lokaal: true })).sort(nieuwsteEerst), lokaal: tabelOntbreekt(error) }
  if (!bij.length) return { lijst: data || [], lokaal: false }
  // Tabel bestaat: lokale notities overzetten. Op id, dus een halve poging dubbelt niets.
  const { error: overzetFout } = await supabase.from(TABEL)
    .upsert(bij.map(({ id, titel, tekst, created_at, updated_at }) => ({ id, titel, tekst, created_at, updated_at })), { onConflict: 'id' })
    .then(r => r, e => ({ error: e }))
  if (overzetFout) return { lijst: [...(data || []), ...bij.map(n => ({ ...n, lokaal: true }))].sort(nieuwsteEerst), lokaal: false }
  schrijfLokaal(sleutel, [])
  const opnieuw = await supabase.from(TABEL).select(KOLOMMEN).order('created_at', { ascending: false }).limit(200)
    .then(r => r, e => ({ error: e }))
  return { lijst: opnieuw.data || [...(data || []), ...bij].sort(nieuwsteEerst), lokaal: false }
}

// Geeft de nieuwe notitie, of null als opslaan mislukt.
export async function bewaarNotitie({ tekst, titel = null }) {
  const schoon = notitieTekst(tekst)
  if (!schoon) return null
  const nieuw = { tekst: schoon, titel: typeof titel === 'string' && titel.trim() ? titel.trim().slice(0, 120) : null }
  const { data, error } = await supabase.from(TABEL).insert(nieuw).select(KOLOMMEN).single()
    .then(r => r, e => ({ error: e }))
  if (!error) return data
  if (!tabelOntbreekt(error)) return null
  const sleutel = await lokaalSleutel()
  const nu = new Date().toISOString()
  const rij = { ...nieuw, id: crypto.randomUUID(), created_at: nu, updated_at: nu }
  return schrijfLokaal(sleutel, [rij, ...leesLokaal(sleutel)]) ? { ...rij, lokaal: true } : null
}

// Geeft de aangepaste notitie, of null als opslaan mislukt.
export async function wijzigNotitie(notitie, { titel, tekst }) {
  const velden = { titel: titel?.trim() ? titel.trim().slice(0, 120) : null, tekst: String(tekst), updated_at: new Date().toISOString() }
  if (notitie.lokaal) {
    const sleutel = await lokaalSleutel()
    const bij = leesLokaal(sleutel)
    if (!bij.some(n => n.id === notitie.id)) return null
    return schrijfLokaal(sleutel, bij.map(n => (n.id === notitie.id ? { ...n, ...velden } : n))) ? { ...notitie, ...velden } : null
  }
  const { data, error } = await supabase.from(TABEL).update(velden).eq('id', notitie.id).select(KOLOMMEN).maybeSingle()
    .then(r => r, e => ({ error: e }))
  return error ? null : data
}

export async function verwijderNotitie(notitie) {
  if (notitie.lokaal) {
    const sleutel = await lokaalSleutel()
    return schrijfLokaal(sleutel, leesLokaal(sleutel).filter(n => n.id !== notitie.id))
  }
  const { data, error } = await supabase.from(TABEL).delete().eq('id', notitie.id).select('id')
    .then(r => r, e => ({ error: e }))
  return !error && !!data?.length
}

// Kort voor Gino's context: de laatste 5 met een stukje tekst, daarvoor alleen titels.
export function notitiesVoorGino(lijst) {
  return lijst.slice(0, 25).map((n, i) => {
    const kop = `${notitieTitel(n)} (${notitieDatum(n.created_at)})`
    if (i >= 5) return kop
    const kaal = n.tekst.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()
    return `${kop}: ${kaal.length > 160 ? `${kaal.slice(0, 159)}…` : kaal}`
  })
}

// Eén stand voor het blad, de knoppen in de chat en Gino's context.
export function useNotities() {
  const [stand, setStand] = useState({ lijst: [], geladen: false, lokaal: false })
  const laad = useCallback(() => laadNotities().then(r => setStand({ ...r, geladen: true })), [])
  useEffect(() => { laad() }, [laad])
  const zetVast = useCallback(async (invoer) => {
    const nieuw = await bewaarNotitie(invoer)
    if (nieuw) setStand(s => ({ ...s, lijst: [nieuw, ...s.lijst] }))
    return !!nieuw
  }, [])
  const wijzig = useCallback(async (notitie, velden) => {
    const nieuw = await wijzigNotitie(notitie, velden)
    if (nieuw) setStand(s => ({ ...s, lijst: s.lijst.map(n => (n.id === nieuw.id ? nieuw : n)) }))
    return nieuw
  }, [])
  const verwijder = useCallback(async (notitie) => {
    const ok = await verwijderNotitie(notitie)
    if (ok) setStand(s => ({ ...s, lijst: s.lijst.filter(n => n.id !== notitie.id) }))
    return ok
  }, [])
  const vastgezet = useMemo(() => new Set(stand.lijst.map(n => n.tekst)), [stand.lijst])
  return { ...stand, laad, zetVast, wijzig, verwijder, vastgezet }
}
