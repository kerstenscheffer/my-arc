// src/modules/business-os/BerichtVak.jsx
//
// Bewerkbaar check-in bericht met de knop WhatsApp: bericht naar het
// klembord, WhatsApp open bij de klant, en als verstuurd gemarkeerd. Het
// versturen doet Kersten zelf (plakken en verzenden): er gaat niets
// automatisch naar de klant. Opslag in checkin_ronde_items.bewerkt_bericht.
// Gebruikt in het Klanten-paneel (CheckinRonde.jsx) en in Coach Inzicht >
// Logboek > Bericht.

import { useState, useEffect, useCallback, useRef } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import { vulDagdeel, sjabloon, waNummer, kopieer, ITEM_KOLOMMEN } from './berichtTekst'

const KNOPJE = {
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 32, padding: '0 12px', borderRadius: 999,
  border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 800,
}
const vandaagNL = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
const datumKort = (d) => d ? new Date(`${String(d).slice(0, 10)}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

// metSjabloon: leeg bericht begint met Kerstens vaste opbouw.
export default function BerichtVak({ clientId, voornaam, item, ronde, onItem, metSjabloon = false, rijen = 7 }) {
  const serverTekst = item?.bewerkt_bericht ?? item?.bericht ?? ''
  const beginTekst = () => (serverTekst ? vulDagdeel(serverTekst) : metSjabloon ? sjabloon(voornaam) : '')
  const [tekst, setTekst] = useState(beginTekst)
  const [gekopieerd, setGekopieerd] = useState(false)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const timer = useRef(null)
  const wacht = useRef(null)

  // Nieuwe tekst van de server (Gino) overnemen zolang er niets openstaat.
  useEffect(() => { if (!timer.current && serverTekst) setTekst(vulDagdeel(serverTekst)) }, [serverTekst])

  // Item ophalen of aanmaken (klant zonder rij in deze ronde).
  const zorgVoorItem = useCallback(async () => {
    if (item?.id) return item
    const { data, error } = await supabase.from('checkin_ronde_items')
      .upsert({ client_id: clientId, ronde_datum: ronde || vandaagNL() }, { onConflict: 'client_id,ronde_datum' })
      .select(ITEM_KOLOMMEN).single()
    if (error) throw error
    onItem?.(data)
    return data
  }, [item, clientId, ronde, onItem])

  const bewaar = useCallback(async (waarde) => {
    timer.current = null
    try {
      const it = await zorgVoorItem()
      const { data, error } = await supabase.from('checkin_ronde_items')
        .update({ bewerkt_bericht: waarde }).eq('id', it.id).select(ITEM_KOLOMMEN).single()
      if (error) throw error
      onItem?.(data); setFout(null)
      return data
    } catch (e) { setFout(`Opslaan mislukt: ${e.message}`); return null }
  }, [zorgVoorItem, onItem])

  const bewaarRef = useRef(bewaar)
  useEffect(() => { bewaarRef.current = bewaar }, [bewaar])
  // Bij sluiten of wegklikken een openstaande wijziging nog bewaren.
  useEffect(() => () => { if (timer.current) { clearTimeout(timer.current); bewaarRef.current(wacht.current) } }, [])

  const wijzig = (v) => {
    setTekst(v)
    wacht.current = v
    clearTimeout(timer.current)
    timer.current = setTimeout(() => bewaarRef.current(v), 800)
  }

  const verstuurd = !!item?.verstuurd_at

  const zetVerstuurd = async (aan) => {
    const it = (timer.current ? (clearTimeout(timer.current), await bewaar(wacht.current)) : null) || await zorgVoorItem()
    const { data, error } = await supabase.from('checkin_ronde_items')
      .update({ verstuurd_at: aan ? new Date().toISOString() : null }).eq('id', it.id).select(ITEM_KOLOMMEN).single()
    if (error) throw error
    onItem?.(data)
    if (aan) {
      const coach = data.coach_id || (await supabase.auth.getSession()).data.session?.user?.id
      const s = data.suggesties || {}
      const { error: nf } = await supabase.from('client_notes').insert({
        client_id: clientId, coach_id: coach, title: `Check-in ronde ${datumKort(data.ronde_datum)}`,
        // 'session': client_notes.category heeft een vaste lijst (check-constraint)
        category: 'session', note_date: vandaagNL(),
        content: { bericht: tekst, compliment: s.compliment ?? null, verbeterpunt: s.verbeterpunt ?? null },
      })
      if (nf) setFout(`Verstuurd gezet, notitie mislukt: ${nf.message}`)
    }
  }

  const wisselVerstuurd = async () => {
    if (bezig) return
    setBezig(true)
    try { await zetVerstuurd(!verstuurd); setFout(null) } catch (e) { setFout(e.message) }
    setBezig(false)
  }

  // Klembord + WhatsApp open bij de klant. Het venster gaat meteen open
  // (anders blokkeert de browser het na het ophalen van het nummer).
  const naarWhatsApp = async () => {
    if (bezig || !tekst.trim()) return
    const venster = window.open('', '_blank')
    setBezig(true)
    try {
      const gekopieerdOk = await kopieer(tekst)
      const { data } = await supabase.from('clients').select('phone').eq('id', clientId).maybeSingle()
      const nr = waNummer(data?.phone)
      if (!nr) {
        venster?.close()
        setFout(gekopieerdOk ? 'Geen telefoonnummer bekend. Het bericht staat wel in je klembord.' : 'Geen telefoonnummer bekend.')
      } else {
        const url = `https://wa.me/${nr}`
        if (venster) venster.location.href = url; else window.location.href = url
        if (!verstuurd) await zetVerstuurd(true)
        setFout(gekopieerdOk ? null : 'Kopiëren lukte niet, selecteer de tekst zelf.')
      }
    } catch (e) { venster?.close(); setFout(e.message) }
    setBezig(false)
  }

  const kopieerKlik = async () => {
    if (await kopieer(tekst)) { setGekopieerd(true); setTimeout(() => setGekopieerd(false), 1500) }
    else setFout('Kopiëren lukte niet, selecteer de tekst zelf.')
  }

  return (
    <div>
      <textarea value={tekst} onChange={e => wijzig(e.target.value)} rows={rijen}
        placeholder="Nog geen bericht van Gino. Typ hier zelf."
        style={{
          width: '100%', boxSizing: 'border-box', resize: 'vertical', background: colors.surface, color: colors.textPrimary,
          border: 'none', borderRadius: 12, padding: 10, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.45,
          fontFamily: 'inherit', outline: 'none',
        }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" onClick={naarWhatsApp} disabled={bezig || !tekst.trim()} title="Kopieert het bericht en opent WhatsApp bij de klant" style={{
          ...KNOPJE, background: colors.success, color: colors.onAccent, opacity: bezig || !tekst.trim() ? 0.5 : 1,
        }}>
          <MessageCircle size={14} strokeWidth={2.5} /> WhatsApp
        </button>
        <button type="button" onClick={kopieerKlik} disabled={!tekst.trim()} style={{
          ...KNOPJE, background: 'transparent', color: colors.textPrimary, boxShadow: `inset 0 0 0 1px ${colors.borderSubtle}`,
          opacity: tekst.trim() ? 1 : 0.4,
        }}>
          {gekopieerd ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2.5} />}
          {gekopieerd ? 'Gekopieerd' : 'Kopieer'}
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={wisselVerstuurd} disabled={bezig} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.74rem', fontWeight: 800,
          color: verstuurd ? colors.success : colors.textMuted,
        }}>
          <Check size={13} strokeWidth={3} /> {verstuurd ? 'Verstuurd' : 'Markeer verstuurd'}
        </button>
      </div>
      {fout && <div style={{ fontSize: '0.74rem', fontWeight: 700, color: colors.danger, marginTop: 6 }}>{fout}</div>}
    </div>
  )
}
