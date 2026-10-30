// src/modules/business-os/BusinessChat.jsx
//
// Chatbalk onder de reactor in Business OS: taken uitbesteden aan Claude
// (scripts, hooks, DM-teksten, meedenken over de cijfers). Het gesprek blijft
// per apparaat bewaard.
// Twee routes: draait de lokale PA (npm run pa, hartslag in
// business_os_pa_status), dan gaat de vraag via Kerstens Mac en zijn Claude-
// abonnement (rij soort 'chat' in business_os_opdrachten). Anders, of als de
// Mac hem niet binnen 25 s oppakt, via de edge function business-os-chat (API).
// Microfoon = spraak naar tekst van de browser (Web Speech API, nl-NL). Waar
// de browser dat niet kan (o.a. de iOS-app-webview) verschijnt de knop niet.
// Screenshot (30 okt): kiezen of plakken (Cmd+V), verkleind tot max 1600 px
// jpeg en als { afbeelding: { media_type, data } } aan het gebruikersbericht
// gehangen. Zo'n gesprek gaat altijd via de API (de Mac-route kan geen
// beelden). In localStorage bewaren we alleen een kleine thumbnail.
// Berichten verborgen (30 okt): standaard alleen invoerbalk + statusregel. Een
// klik op het poppetje boven de balk klapt het berichtenvenster open (zweeft
// onder de groep, of erboven als daar te weinig ruimte is; de groep schuift
// niet). Niet onthouden: elke sessie start dicht. Komt er een antwoord binnen
// terwijl hij dicht is, dan krijgt het poppetje een groene stip tot je opent.
// Mac/API-schakelaar en herstart-knop staan rechts op de hoogte van het
// poppetje; herstart gaat via het lokale loket van de PA (POST /herstart).
// Slepen: een afbeelding over het scherm slepen toont een dropzone over de
// balk; loslaten zet hem (max 3) als thumbnail in de balk. De edge function
// kent één beeld per bericht, dus meerdere gaan als opeenvolgende
// gebruikersberichten mee.
// Werk-indicator: robotje boven de balk zolang de AI denkt of een code-opdracht
// (business_os_opdrachten soort 'code', wacht/bezig) loopt; daarna kort Klaar/Mislukt.
// Stem (30 okt): staat de stem-modus aan (klik op de ring, stem.js), dan wordt
// elk nieuw antwoord na versturen voorgelezen, plus de toestemmingsvraag uit het
// wolkje. Stopt bij typen, microfoon, versturen, nieuw gesprek en weggaan. Luistert
// de microfoon, dan praat hij niet (anders hoort de herkenning zichzelf).
// Rustregel (30 okt): in rust toont het robotje de eerste zin van de laatst
// afgeronde code-opdracht (max ~60 tekens; stem en herhaalknop krijgen het hele
// resultaat en spreken daarvan de korte kern uit, stem.spreekTekst); open "Ik wacht op jou"-acties staan
// eronder met elk een Gedaan-knop, plus de ElevenLabs-sleutelactie zolang
// gino-stem 503 geen_sleutel geeft. Versturen breekt de spraakherkenning af en
// negeert late resultaten, zodat het veld leeg blijft.
// Editor (30 okt): vast tabje na Code/Strategie dat via edge function editor-chat
// met ChatGPT (OpenAI API) praat, alleen tekst (geen Mac-route, geen screenshots).
// Opdrachten met status bovenaan het venster (business-os-editor.sql).

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { ArrowUp, Copy, Check, Mic, Lock, Database, Laptop, ImagePlus, X, SquarePen, History, RotateCw, Volume2, Eye, ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import useIsMobile from '../../hooks/useIsMobile'
import * as stem from './stem'
import { bewaarOordeel } from './feedback'
import { useNieuweVersie } from './useNieuweVersie'

const KEY = 'business_os_chat'
const PA_ONLINE_MS = 45000
const MAX_BEELDEN = 3 // zoveel recente screenshots gaan mee naar de AI
const INVOER_MAX_H = 130 // ~6 regels
const WACHT_RIJ_H = 28 // rij in het wacht-op-jou-lijstje onder de statusregel
const slaap = (ms) => new Promise(r => setTimeout(r, ms))

const TEKST = { fontSize: '0.78rem', lineHeight: 1.4 }
const KNOP = {
  background: colors.textPrimary, color: colors.onAccent, border: 'none', borderRadius: 10,
  padding: '0 12px', minHeight: 36, fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
}
const KAART = { margin: '2px 0 6px', fontSize: '0.76rem', lineHeight: 1.35 }
const KAART_KOP = { display: 'flex', gap: 6, alignItems: 'center', fontWeight: 800, marginBottom: 2 }
const KAART_SUB = { color: colors.textSecondary, fontWeight: 600, marginBottom: 6 }

// Vraag via de lokale PA. Geeft { tekst, acties } of null (Mac pakte hem niet op).
// Vraag via de PA op de Mac. Realtime geeft elke wijziging van de rij meteen
// door (ook de halve tekst tijdens het typen → opDeel); pollen elke 2 s blijft
// als vangnet. null = niet gelukt, dan gaat de vraag via de API.
// extra = { modus: 'snel' | 'slim', gesprek_id } (Slim hervat per gesprek een sessie).
// signaal = { id, gestopt }: de stopknop zet gestopt; dan { gestopt: true } terug.
async function vraagViaMac(berichten, context, opDeel, extra = {}, signaal = {}) {
  const { data: rij, error } = await supabase.from('business_os_opdrachten')
    .insert({ soort: 'chat', opdracht: berichten[berichten.length - 1].content.slice(0, 500), invoer: { berichten, context, ...extra } })
    .select('id').single()
  if (error) return null
  signaal.id = rij.id
  const start = Date.now()
  let klaar = null
  const bekijk = (data) => {
    if (!data || klaar) return
    if (data.status === 'gestopt') { klaar = { antwoord: { gestopt: true } }; return }
    if (data.status === 'klaar' || data.status === 'mislukt') { klaar = { antwoord: data.antwoord?.tekst ? data.antwoord : null }; return }
    if (data.status === 'bezig' && data.antwoord?.bezig && data.antwoord.tekst) opDeel?.(data.antwoord.tekst)
  }
  const kanaal = supabase.channel(`pa-antwoord-${rij.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_os_opdrachten', filter: `id=eq.${rij.id}` }, (m) => bekijk(m.new))
    .subscribe()
  try {
    let laatstGepold = 0
    for (;;) {
      await slaap(150)
      if (signaal.gestopt) {
        // Ook als de stopknop kwam vóórdat het id bekend was: rij intrekken.
        await supabase.from('business_os_opdrachten').update({ status: 'gestopt', klaar_at: new Date().toISOString() })
          .eq('id', rij.id).in('status', ['wacht', 'bezig']).then(r => r, () => null)
        return { gestopt: true }
      }
      if (klaar) return klaar.antwoord
      if (Date.now() - laatstGepold < 2000) continue
      laatstGepold = Date.now()
      const { data } = await supabase.from('business_os_opdrachten')
        .select('status, antwoord').eq('id', rij.id).maybeSingle()
      bekijk(data)
      if (klaar) return klaar.antwoord
      if (data?.status === 'wacht' && Date.now() - start > 25000) {
        // Niet opgepakt: intrekken (alleen als hij nog op 'wacht' staat) en via de API.
        const { data: ingetrokken } = await supabase.from('business_os_opdrachten')
          .update({ status: 'mislukt' }).eq('id', rij.id).eq('status', 'wacht').select('id')
        if (ingetrokken?.length) return null
      }
      if (Date.now() - start > 11 * 60 * 1000) return null
    }
  } finally { supabase.removeChannel(kanaal) }
}
const Spraak = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
// Gesproken stuk achter de tekst plakken: één spatie ertussen, geen dubbele, geen spatie vooraan.
const plakSpraak = (basis, stuk) => {
  const s = (stuk || '').replace(/\s+/g, ' ').trim()
  if (!s) return basis
  if (!basis.trim()) return s
  return /\s$/.test(basis) ? basis + s : basis + ' ' + s
}

// Het oude ene gesprek (vóór de tabjes): wordt bij de eerste keer het tabje 'Code'.
const leesGesprek = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
// Volle afbeeldingen niet bewaren (te groot), alleen de thumbnail.
const schoon = (berichten) => berichten.slice(-40).map(b => {
  if (!b.afbeelding && !b.afbeeldingen) return b
  const kopie = { ...b }
  delete kopie.afbeelding
  delete kopie.afbeeldingen
  return kopie
})

// Afbeelding → { media_type, data (base64 zonder prefix), thumb (data-URL) }.
async function verklein(bestand) {
  const url = URL.createObjectURL(bestand)
  try {
    const img = await new Promise((ok, nee) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => nee(new Error('Afbeelding kon niet gelezen worden'))
      i.src = url
    })
    const teken = (maxB, kwaliteit) => {
      const schaal = Math.min(1, maxB / img.naturalWidth)
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.naturalWidth * schaal))
      c.height = Math.max(1, Math.round(img.naturalHeight * schaal))
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#ffffff' // transparante png's niet zwart laten worden
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.drawImage(img, 0, 0, c.width, c.height)
      return c.toDataURL('image/jpeg', kwaliteit)
    }
    const groot = teken(1600, 0.85)
    return { media_type: 'image/jpeg', data: groot.split(',')[1], thumb: teken(240, 0.7) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function Kopieer({ tekst }) {
  const [klaar, setKlaar] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(tekst).then(() => { setKlaar(true); setTimeout(() => setKlaar(false), 1500) }, () => {})}
      title="Kopieer"
      style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: 2, display: 'flex' }}
    >
      {klaar ? <Check size={13} color={colors.success} /> : <Copy size={13} />}
    </button>
  )
}

// Duimpjes (30 okt): oordeel over een antwoord of beeld → business_os_feedback.
// De groeironde leest ze 's nachts en werkt de skills bij (bewezen beelden,
// wat Kersten niet wil). Het oordeel staat ook op het bericht zelf (b.oordeel).
function Duimpjes({ oordeel, onOordeel }) {
  const knop = (waarde, Icoon, titel) => (
    <button type="button" onClick={() => onOordeel(waarde)} title={titel} disabled={!!oordeel}
      style={{
        background: 'none', border: 'none', padding: 2, display: 'flex', cursor: oordeel ? 'default' : 'pointer',
        color: oordeel === waarde ? (waarde === 'goed' ? colors.success : colors.danger) : colors.textSecondary,
        opacity: oordeel && oordeel !== waarde ? 0.3 : 1,
      }}>
      <Icoon size={13} strokeWidth={2.4} />
    </button>
  )
  return (
    <>
      {knop('goed', ThumbsUp, 'Goed antwoord (Gino leert ervan)')}
      {knop('slecht', ThumbsDown, 'Niet goed (Gino leert ervan)')}
    </>
  )
}

// Herhaalknop achter het laatste Gino-antwoord: speelt het opnieuw af met de
// Gino-stem (stem.herhaal, uit de cache), ook als de stem uit staat. Tijdens praten = stop.
function Herhaal({ onKlik, praat }) {
  return (
    <button onClick={onKlik} title={praat ? 'Stop' : 'Herhaal wat Gino zei'} aria-label={praat ? 'Stop' : 'Herhaal wat Gino zei'}
      style={{
        background: 'none', border: 'none', padding: '0 2px', marginLeft: 4, cursor: 'pointer',
        display: 'inline-flex', verticalAlign: '-2px', color: praat ? colors.success : colors.textSecondary,
      }}>
      <Volume2 size={13} />
    </button>
  )
}

// Terugblik onderaan het gesprek: 2-4 zinnen 'waar ging dit over en wat staat
// open', met een luidspreker die hem door Gino laat voorlezen (nogmaals = stop).
// Geen label: een zacht groen lijntje links zegt genoeg.
function Terugblik({ tekst, praat, onKlik }) {
  return (
    <div style={{
      display: 'flex', gap: 6, alignItems: 'flex-start', marginTop: 8, padding: '6px 0 2px 10px',
      borderLeft: `2px solid ${colors.success}66`,
    }}>
      <div style={{ flex: 1, minWidth: 0, ...TEKST, fontWeight: 600, color: colors.textSecondary }}>{tekst}</div>
      {stem.beschikbaar() && (
        <button onClick={onKlik} title={praat ? 'Stop' : 'Laat Gino dit voorlezen'} aria-label={praat ? 'Stop' : 'Laat Gino dit voorlezen'}
          style={{
            background: 'none', border: 'none', padding: 2, cursor: 'pointer', display: 'flex', flexShrink: 0,
            color: praat ? colors.success : colors.textSecondary,
          }}>
          <Volume2 size={14} className={praat ? 'bos-stip' : undefined} />
        </button>
      )}
    </div>
  )
}
// Laadstaat van de terugblik: alleen een zacht ademend licht, geen tekst.
const TerugblikLicht = () => (
  <div aria-hidden style={{ marginTop: 8, padding: '8px 0 6px 10px', borderLeft: `2px solid ${colors.success}33` }}>
    <span style={{
      display: 'block', height: 6, width: '45%', borderRadius: 999, color: colors.success,
      background: `${colors.success}40`, animation: 'bos-licht 1.8s ease-in-out infinite',
    }} />
  </div>
)

// Lange antwoorden ingekort tonen (~6 regels) met 'meer' / 'minder'.
// achter: element direct achter de laatste zin (ingeklapt: naast 'meer').
const MAX_REGELS = 6
function Inkort({ tekst, achter }) {
  const ref = useRef(null)
  const [lang, setLang] = useState(false)
  const [open, setOpen] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (el && !open) setLang(el.scrollHeight > el.clientHeight + 2)
  }, [tekst, open])
  return (
    <>
      <div ref={ref} style={{
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        ...(open ? {} : { maxHeight: `${MAX_REGELS * 1.4}em`, overflow: 'hidden' }),
      }}>
        {tekst}
        {achter && (open || !lang) && achter}
      </div>
      {(lang || open) && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', fontFamily: 'inherit',
            color: colors.success, fontWeight: 800, fontSize: '0.75rem',
          }}>
            {open ? 'minder' : 'meer'}
          </button>
          {lang && !open && achter}
        </div>
      )}
    </>
  )
}

// ── Voorstellen uitvoeren ──
// Eén plek voor de uitvoer, gedeeld door de kaart in de berichtenlijst en het
// vraagwolkje bij het robotje. Geeft { veld } (wat er op de actie komt te
// staan) of { fout }. Status zit op de actie in het gesprek (uitgevoerd /
// opdrachtId / afgewezen), dus wolkje en kaart zien hetzelfde.

// Slot: dezelfde velden als de slotknop in Coach Inzicht (CoachingPeriodPanel.wisselSlot).
async function voerSlotUit(voorstel) {
  const payload = voorstel.actie === 'op_slot'
    ? { account_locked_at: new Date().toISOString(), account_locked_reason: voorstel.tekst || null, coaching_status: 'ended', coaching_paused_at: null, coaching_pause_reason: null }
    : { account_locked_at: null, account_locked_reason: null }
  const { error } = await supabase.from('clients').update(payload).in('id', voorstel.klanten.map(k => k.id))
  return error ? { fout: 'Opslaan mislukt: ' + error.message } : { veld: { uitgevoerd: true } }
}

// Data (stel_wijziging_voor): de AI heeft het aantal rijen al geteld; dit draait
// met Kerstens eigen rechten (RLS), dus nooit meer dan hij zelf in de app zou mogen.
async function voerWijzigingUit(voorstel) {
  let q
  if (voorstel.actie === 'insert') {
    q = supabase.from(voorstel.tabel).insert(voorstel.rijen)
  } else {
    q = supabase.from(voorstel.tabel).update(voorstel.velden)
    for (const f of voorstel.filters) {
      if (f.op === 'in') q = q.in(f.kolom, Array.isArray(f.waarde) ? f.waarde : [f.waarde])
      else if (f.op === 'is') q = q.is(f.kolom, f.waarde)
      else q = q[f.op](f.kolom, f.waarde)
    }
  }
  const { error } = await q
  return error ? { fout: 'Mislukt: ' + error.message } : { veld: { uitgevoerd: true } }
}

// Code: zet een rij in business_os_opdrachten voor de lokale PA.
async function startPaOpdracht(voorstel) {
  const { data, error } = await supabase.from('business_os_opdrachten')
    .insert({ opdracht: voorstel.tekst }).select('id').single()
  return error ? { fout: 'Starten mislukt: ' + error.message } : { veld: { opdrachtId: data.id } }
}

// Wacht op jou: Gino heeft iets van Kersten nodig (sleutel, download, screenshot,
// antwoord). Niets uit te voeren; 'Gedaan' zet hem op afgehandeld.
const meldGedaan = async () => ({ veld: { afgehandeld: true } })

const VOER_UIT = { slot_voorstel: voerSlotUit, wijziging_voorstel: voerWijzigingUit, pa_voorstel: startPaOpdracht, wacht_op_jou: meldGedaan }
const staatOpen = (ac) => !!ac && !!VOER_UIT[ac.soort] && !ac.uitgevoerd && !ac.opdrachtId && !ac.afgewezen && !ac.afgehandeld

const waardeTekst = (v) => v === null ? 'leeg' : typeof v === 'object' ? JSON.stringify(v) : String(v)
const wijzigingRegels = (v) => v.actie === 'insert'
  ? [`${v.aantal} nieuwe rij(en) in ${v.tabel}`]
  : [
      `${v.aantal} rij(en) in ${v.tabel} waar ${v.filters.map(f => `${f.kolom} ${f.op} ${waardeTekst(f.waarde)}`).join(' en ')}`,
      `→ ${Object.entries(v.velden).map(([k, w]) => `${k} = ${waardeTekst(w)}`).join(', ')}`,
    ]

const kort = (t, max = 80) => {
  const s = (t || '').replace(/\s+/g, ' ').trim()
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}
const eersteZin = (t) => {
  const regel = (t || '').trim().split('\n')[0]
  return regel.match(/^.*?[.!?](\s|$)/)?.[0] || regel
}
// Resultaat van een code-opdracht → één korte regel voor de statusregel:
// eerste zin, zonder markdown, max ~60 tekens.
const zonderMarkdown = (t) => (t || '')
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/^\s*(#{1,6}\s*|[-*•+]\s+|>\s*|→\s*)/gm, '')
  .replace(/\*\*|__|`|\*/g, '')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
const laatstGedaanRegel = (rij) => {
  const bron = zonderMarkdown(rij?.resultaat).trim()
  if (bron) return kort(eersteZin(bron).trim().replace(/[.!]$/, ''), 60)
  const opdracht = zonderMarkdown(rij?.opdracht).trim()
  return opdracht ? kort(`Gino deed: ${eersteZin(opdracht).trim().replace(/[.!:]$/, '')}`, 60) : null
}
const GELEZEN_KEY = 'bos_laatst_gedaan_gelezen'
const SLEUTEL_GEDAAN_KEY = 'bos_el_sleutel_gedaan'
const SLEUTEL_ACTIE = 'Zet ELEVENLABS_API_KEY en ELEVENLABS_VOICE_ID in Supabase (Edge Functions, Secrets)'
const lees = (k) => { try { return localStorage.getItem(k) } catch { return null } }
const schrijf = (k, v) => { try { localStorage.setItem(k, v) } catch { /* privé-venster */ } }

// ── Gesprekken (tabjes bij het poppetje) ──
// Elk tabje = { id, naam, sessie, berichten, bijgewerkt }. sessie = het
// gesprek_id voor Slim (Nieuw gesprek geeft een nieuwe sessie, zelfde tabje).
// Bewaard in localStorage en, zodra de tabel bestaat, in business_os_gesprekken
// (business-os-gesprekken.sql, één rij per tabje). Ontbreekt de tabel, dan
// blijft alles lokaal werken.
const GESPREKKEN_KEY = 'business_os_gesprekken'
const ACTIEF_KEY = 'business_os_actief_gesprek'
const DB_GESPREKKEN = 'business_os_gesprekken'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const nieuwTabje = (naam, berichten = [], sessie = null) => ({
  id: crypto.randomUUID(), naam, sessie: UUID.test(sessie || '') ? sessie : crypto.randomUUID(), berichten, bijgewerkt: Date.now(),
})
// Vast tabje 'Editor' (30 okt): praat via editor-chat met ChatGPT (OpenAI API)
// als video-editor-assistent. Herkend aan soort of naam (business_os_gesprekken
// heeft geen soort-kolom). Ontbreekt hij, dan komt hij na Code en Strategie.
const isEditor = (g) => g?.soort === 'editor' || g?.naam === 'Editor'
// Vast tabje 'Klanten' (30 okt): Gino via de Mac met de klant-focus (check-ins,
// wie aandacht nodig heeft, afspraken). De PA krijgt invoer.tab = 'klanten' en
// zet de focus bovenaan de vraag; de rest is gewoon Gino (Snel/Slim).
const isKlanten = (g) => g?.soort === 'klanten' || g?.naam === 'Klanten'
const metKlanten = (gs, lokaal = []) => {
  if (gs.some(isKlanten)) return gs.map(g => (isKlanten(g) ? { ...g, soort: 'klanten' } : g))
  const t = { ...(lokaal.find(isKlanten) || nieuwTabje('Klanten')), soort: 'klanten' }
  const na = gs.findIndex(isEditor)
  return na >= 0 ? [...gs.slice(0, na + 1), t, ...gs.slice(na + 1)] : [...gs, t]
}
const metEditorAlleen = (gs, lokaal = []) => {
  if (gs.some(isEditor)) return gs.map(g => (isEditor(g) ? { ...g, soort: 'editor' } : g))
  const t = { ...(lokaal.find(isEditor) || nieuwTabje('Editor')), soort: 'editor' }
  return [...gs.slice(0, 2), t, ...gs.slice(2)]
}
const metEditor = (gs, lokaal = []) => metKlanten(metEditorAlleen(gs, lokaal), lokaal)
// Code, Strategie, Editor en Klanten kunnen niet dicht.
const isVast = (g, i) => i < 2 || isEditor(g) || isKlanten(g)
const leesGesprekken = () => {
  try {
    const g = JSON.parse(localStorage.getItem(GESPREKKEN_KEY))
    if (Array.isArray(g) && g.length) return metEditor(g)
  } catch { /* nog niets */ }
  // Eerste keer: het bestaande gesprek (en zijn Slim-sessie) wordt 'Code'.
  return metEditor([nieuwTabje('Code', leesGesprek(), lees('business_os_gesprek_id')), nieuwTabje('Strategie')])
}

// ── Terugblik per gesprek (30 okt 2026) ──
// Gemaakt door business-os-chat (de API-route van Gino, niet via de Mac: dan
// zou hij als opdracht in de robot-regel en de tabjes-status verschijnen).
// Bewaard in localStorage per tabje: { tekst, tot, sleutel }. tot = tijd van het
// laatste bericht waar hij op rust; sleutel verandert alleen bij een nieuw
// bericht, dus opnieuw maken kost alleen tokens als er echt iets bij kwam.
// De tijd staat er als WANNEER in en wordt bij het tonen ingevuld ('een uur
// geleden'), zodat een bewaarde terugblik niet veroudert.
const TERUGBLIK_KEY = 'bos_terugblikken'
const leesTerugblikken = () => {
  try { return JSON.parse(localStorage.getItem(TERUGBLIK_KEY)) || {} } catch { return {} }
}
// Berichten van vóór 30 okt hebben geen 'op': dan het tabje als tijd en de lengte als sleutel.
const terugblikBasis = (g) => {
  const l = g?.berichten[g.berichten.length - 1]
  if (!l) return null
  return { tot: l.op || g.bijgewerkt, sleutel: l.op ? String(l.op) : `${g.berichten.length}:${(l.content || '').length}` }
}
const geleden = (ms) => {
  const min = Math.round((Date.now() - ms) / 60000)
  if (min < 2) return 'net'
  if (min < 60) return `${min} minuten geleden`
  const uur = Math.round(min / 60)
  if (uur < 24) return uur === 1 ? 'een uur geleden' : `${uur} uur geleden`
  const dag = Math.round(uur / 24)
  if (dag === 1) return 'gisteren'
  if (dag < 14) return `${dag} dagen geleden`
  return `${Math.round(dag / 7)} weken geleden`
}
const tijdVan = (ms) => new Date(ms).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const vulTerugblikIn = (tb) => tb.tekst.replace(/WANNEER/g, (_, i) => {
  const w = geleden(tb.tot)
  return i === 0 || /[.!?]\s*$/.test(tb.tekst.slice(0, i)) ? w[0].toUpperCase() + w.slice(1) : w
})
async function maakTerugblik(g) {
  const regels = g.berichten.slice(-14).map(b => {
    const wie = b.role === 'user' ? 'Kersten' : 'Gino'
    const wanneer = b.op ? ` (${tijdVan(b.op)}, ${geleden(b.op)})` : ''
    const acties = (b.acties || []).filter(a => a && typeof a === 'object').map(a =>
      `[${a.soort}${a.uitgevoerd ? ', uitgevoerd' : a.afgewezen ? ', afgewezen' : ''}] ${kort(a.tekst || a.uitleg || '', 120)}`)
    return `${wie}${wanneer}: ${kort((b.content || '').trim() || '[screenshot]', 450)}${acties.length ? `\n${acties.join('\n')}` : ''}`
  })
  let verloop = regels.join('\n\n')
  if (verloop.length > 6000) verloop = `(eerder deel weggelaten)\n${verloop.slice(-6000)}`
  const vraag = `Hieronder het gesprek '${g.naam}' tussen Kersten en jou (Gino). Nu is het ${tijdVan(Date.now())}.\n\n---\n${verloop}\n---\n\n`
    + 'Schrijf een terugblik van 2 tot 4 korte zinnen die onderaan dit gesprek komt, zodat Kersten bij terugkomen meteen weet waar het over ging. '
    + 'Spreektaal Nederlands, tegen Kersten (je), alsof je het hem even vertelt. '
    + "Eerste zin: wat er speelde, en begin die zin letterlijk met het woord WANNEER in hoofdletters (dat vervang ik door bijvoorbeeld 'Een uur geleden'). "
    + 'Daarna: wat er besloten of klaargezet is, en wat nu openstaat of de volgende stap is. '
    + 'Geen gedachtestreepjes, geen emoji, geen opsomming, geen kopjes, geen markdown. Gebruik geen tools en voer niets uit: geef alleen de terugblik.'
  try {
    const { data, error } = await supabase.functions.invoke('business-os-chat', { body: { berichten: [{ role: 'user', content: vraag }] } })
    if (error || data?.error || !data?.tekst) throw new Error(data?.error || error?.message || 'leeg antwoord')
    const tekst = zonderMarkdown(data.tekst)
      .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
      .replace(/\s*[–—]\s*/g, ', ').replace(/\s+-\s+/g, ', ')
      .replace(/\s+/g, ' ').trim()
    return tekst || null
  } catch (e) {
    console.error('[terugblik] maken mislukt:', e?.message || e)
    return null
  }
}

// Voorstel → één korte vraag in spreektaal + samenvatting + volledige tekst.
function vraagVoor(ac) {
  if (ac.soort === 'wacht_op_jou') return { vraag: `Ik wacht op jou: ${kort(ac.tekst, 120)}`, kort: '', details: '' }
  if (ac.soort === 'slot_voorstel') {
    const n = ac.klanten.length
    const wie = n === 1 ? ac.klanten[0].naam : `${n} klanten`
    return {
      vraag: ac.actie === 'op_slot' ? `Mag ik ${wie} op slot zetten?` : `Mag ik ${wie} ontgrendelen?`,
      kort: kort(ac.tekst),
      details: ac.klanten.map(k => k.naam).join(', '),
    }
  }
  if (ac.soort === 'wijziging_voorstel') {
    const rijen = `${ac.aantal} ${ac.aantal === 1 ? 'rij' : 'rijen'}`
    return {
      vraag: ac.actie === 'insert' ? `Mag ik ${rijen} toevoegen aan ${ac.tabel}?` : `Mag ik ${rijen} in ${ac.tabel} aanpassen?`,
      kort: kort(ac.uitleg),
      details: wijzigingRegels(ac).join('\n'),
    }
  }
  return { vraag: 'Mag ik dit aanpassen in de code?', kort: kort(eersteZin(ac.tekst)), details: ac.tekst }
}

const Afgewezen = () => (
  <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.textSecondary, fontWeight: 800 }}>
    <X size={14} /> Afgewezen
  </div>
)

// Voorstel van de AI om accounts op slot te zetten of te ontgrendelen.
function SlotVoorstel({ voorstel, staat, onToestaan }) {
  const { bezig, fout } = staat || {}
  const opSlot = voorstel.actie === 'op_slot'
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Lock size={13} /> {opSlot ? 'Op slot zetten' : 'Ontgrendelen'} ({voorstel.klanten.length}){voorstel.tekst ? ` · ${voorstel.tekst}` : ''}
      </div>
      <div style={KAART_SUB}>
        {voorstel.klanten.map(k => k.naam).join(', ')}
      </div>
      {voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={14} /> {opSlot ? 'Op slot gezet' : 'Ontgrendeld'}
        </div>
      ) : voorstel.afgewezen ? <Afgewezen /> : (
        <button onClick={onToestaan} disabled={bezig} style={KNOP}>
          {bezig ? 'Bezig…' : opSlot ? `Zet ${voorstel.klanten.length} op slot` : `Ontgrendel ${voorstel.klanten.length}`}
        </button>
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 4 }}>{fout}</div>}
    </div>
  )
}

// Voorstel van de AI om data aan te passen (stel_wijziging_voor).
function WijzigingVoorstel({ voorstel, staat, onToestaan }) {
  const { bezig, fout } = staat || {}
  const regels = wijzigingRegels(voorstel)
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Database size={13} /> {voorstel.uitleg}
      </div>
      <div style={{ ...KAART_SUB, wordBreak: 'break-word' }}>
        {regels.map((r, i) => <div key={i}>{r}</div>)}
      </div>
      {voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={14} /> Uitgevoerd
        </div>
      ) : voorstel.afgewezen ? <Afgewezen /> : (
        <button onClick={onToestaan} disabled={bezig} style={KNOP}>
          {bezig ? 'Bezig…' : 'Toestaan'}
        </button>
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 4 }}>{fout}</div>}
    </div>
  )
}

// Code-opdracht voor de lokale PA (scripts/business-os-pa.mjs). De klik zet een
// rij in business_os_opdrachten; daarna volgt dit blok de status tot het
// resultaat er is.
const PA_STATUS = { wacht: 'Wacht op je Mac…', bezig: 'Claude Code is bezig…', klaar: 'Klaar', mislukt: 'Mislukt' }

// herhaalKnop(tekst): herhaalknop achter het resultaat (alleen bij het laatste Gino-bericht).
function PaVoorstel({ voorstel, staat, onToestaan, herhaalKnop }) {
  const [rij, setRij] = useState(null)
  const { bezig, fout } = staat || {}
  const id = voorstel.opdrachtId

  // voor = aantal code-opdrachten dat eerder binnenkwam en nog loopt of wacht.
  // De PA doet er één tegelijk, dus > 0 = in de rij (status blijft 'wacht').
  const [voor, setVoor] = useState(0)
  useEffect(() => {
    if (!id) return
    let weg = false
    const kijk = async () => {
      const { data } = await supabase.from('business_os_opdrachten')
        .select('status, resultaat, created_at').eq('id', id).maybeSingle()
        .then(r => r, () => ({ data: null }))
      if (weg || !data) return
      setRij(data)
      if (data.status !== 'wacht') { setVoor(0); return }
      const { count } = await supabase.from('business_os_opdrachten')
        .select('id', { count: 'exact', head: true }).eq('soort', 'code').in('status', ['wacht', 'bezig'])
        .lt('created_at', data.created_at)
        .then(r => r, () => ({ count: 0 }))
      if (!weg) setVoor(count || 0)
    }
    kijk()
    const t = setInterval(kijk, 5000)
    // Realtime: status wisselt meteen; pollen blijft als vangnet.
    const kanaal = supabase.channel(`bos-pa-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'business_os_opdrachten', filter: `id=eq.${id}` }, kijk)
      .subscribe()
    return () => { weg = true; clearInterval(t); supabase.removeChannel(kanaal) }
  }, [id])

  const status = rij?.status
  const inRij = status === 'wacht' && voor > 0
  const hangt = status === 'wacht' && !inRij && rij && Date.now() - new Date(rij.created_at).getTime() > 20000
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Laptop size={13} /> Code-opdracht
      </div>
      <div style={KAART_SUB}><Inkort tekst={voorstel.tekst} /></div>
      {voorstel.afgewezen && !id ? <Afgewezen /> : !id ? (
        <button onClick={onToestaan} disabled={bezig} style={KNOP}>
          {bezig ? 'Versturen…' : 'Uitvoeren op mijn Mac'}
        </button>
      ) : (
        <div style={{ fontWeight: 800 }}>
          <StatusLicht status={status || 'wacht'}
            titel={inRij ? `In de rij${voor > 1 ? ` (${voor} vóór)` : ''}, start na de huidige` : PA_STATUS[status] || 'Versturen…'} />
          {hangt && <div style={{ color: colors.textSecondary, fontWeight: 600, marginTop: 2 }}>Draait npm run pa op je Mac?</div>}
        </div>
      )}
      {rij?.resultaat && <div style={{ marginTop: 6 }}><Inkort tekst={rij.resultaat} achter={herhaalKnop?.(rij.resultaat)} /></div>}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 4 }}>{fout}</div>}
    </div>
  )
}

// Gino wacht op Kersten: tekst + Gedaan.
function WachtOpJou({ voorstel, staat, onToestaan }) {
  const { bezig } = staat || {}
  return (
    <div style={KAART}>
      <div style={{ ...KAART_KOP, marginBottom: 6 }}>Ik wacht op jou: {voorstel.tekst}</div>
      {voorstel.afgehandeld ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={14} /> Gedaan
        </div>
      ) : (
        <button onClick={onToestaan} disabled={bezig} style={KNOP}>Gedaan</button>
      )}
    </div>
  )
}

// Tekstwolkje bij het robotje: het eerste open voorstel als korte vraag.
// Zweeft (absoluut) boven de balk, dus ring en pagina schuiven niet.
function Vraagwolk({ voorstel, nr, totaal, staat, onToestaan, onNee, extraHoogte = 0 }) {
  const [details, setDetails] = useState(false)
  const { vraag, kort: samenvatting, details: volledig } = vraagVoor(voorstel)
  const { bezig, fout } = staat || {}
  const meer = volledig && volledig !== samenvatting
  const wacht = voorstel.soort === 'wacht_op_jou'
  return (
    <div role="dialog" aria-label={wacht ? 'Gino wacht op jou' : 'Gino vraagt toestemming'} style={{
      position: 'absolute', left: 0, bottom: '100%', marginBottom: 34 + extraHoogte, zIndex: 6,
      width: 'min(340px, 100%)', boxSizing: 'border-box', padding: '10px 12px',
      background: '#0a0a0a', border: `1px solid ${colors.success}55`, borderRadius: 14,
      boxShadow: '0 12px 32px rgba(0,0,0,0.6)', fontSize: '0.78rem', lineHeight: 1.35,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        <div style={{ flex: 1, minWidth: 0, fontWeight: 900, color: colors.textPrimary }}>{vraag}</div>
        {totaal > 1 && <div style={{ flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: colors.textMuted }}>{nr} van {totaal}</div>}
      </div>
      {(samenvatting || meer) && (
        <div style={{ marginTop: 3, color: colors.textSecondary, fontWeight: 600, wordBreak: 'break-word' }}>
          {samenvatting}
          {meer && (
            <button onClick={() => setDetails(d => !d)} style={{
              background: 'none', border: 'none', padding: '0 0 0 6px', cursor: 'pointer', fontFamily: 'inherit',
              color: colors.success, fontWeight: 800, fontSize: '0.74rem',
            }}>
              {details ? 'minder' : 'details'}
            </button>
          )}
        </div>
      )}
      {details && (
        <div style={{
          marginTop: 6, maxHeight: 160, overflowY: 'auto', overscrollBehavior: 'contain', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          color: colors.textSecondary, fontWeight: 500, fontSize: '0.74rem', borderTop: `1px solid ${colors.borderSubtle}`, paddingTop: 6,
        }}>
          {volledig}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button onClick={onToestaan} disabled={bezig} style={{ ...KNOP, minHeight: 30 }}>
          {wacht ? 'Gedaan' : bezig ? 'Bezig…' : 'Toestaan'}
        </button>
        {!wacht && (
          <button onClick={onNee} disabled={bezig} style={{
            ...KNOP, minHeight: 30, background: 'transparent', color: colors.textSecondary, border: `1px solid ${colors.borderSubtle}`,
          }}>
            Nee
          </button>
        )}
      </div>
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 6 }}>{fout}</div>}
      {/* staartje naar het robotje */}
      <span style={{
        position: 'absolute', left: 16, bottom: -6, width: 10, height: 10, background: '#0a0a0a', transform: 'rotate(45deg)',
        borderRight: `1px solid ${colors.success}55`, borderBottom: `1px solid ${colors.success}55`,
      }} />
    </div>
  )
}

// Klein robotje achter een laptop dat zacht zit te typen.
// rustig = Gino is klaar: stil en gedimd.
function Robotje({ rustig }) {
  return (
    <svg className={rustig ? 'bos-robot bos-rust' : 'bos-robot'} width="30" height="26" viewBox="0 0 30 26" aria-hidden="true">
      <line x1="11" y1="3" x2="11" y2="6" stroke={colors.success} strokeWidth="1.5" strokeLinecap="round" />
      <circle className="bos-antenne" cx="11" cy="2.5" r="1.6" fill={colors.success} />
      <rect x="4" y="6" width="14" height="10" rx="3.5" fill="#1e1e1e" stroke={colors.success} strokeWidth="1.3" />
      <circle className="bos-oog" cx="9" cy="11" r="1.3" fill={colors.success} />
      <circle className="bos-oog" cx="13.5" cy="11" r="1.3" fill={colors.success} />
      <rect className="bos-hand-l" x="7" y="18" width="3" height="2" rx="1" fill={colors.textSecondary} />
      <rect className="bos-hand-r" x="12.5" y="18" width="3" height="2" rx="1" fill={colors.textSecondary} />
      <path d="M17 12 h10 v8 h-10 z" fill="#0a0a0a" stroke={colors.textSecondary} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="2" y1="21" x2="29" y2="21" stroke={colors.textSecondary} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const ANIMATIES = `
@keyframes bos-mic { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5) } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }
@keyframes bos-typ { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
@keyframes bos-knipper { 0%,92%,100% { transform: scaleY(1) } 96% { transform: scaleY(0.15) } }
@keyframes bos-zacht { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
@keyframes bos-rond { to { transform: rotate(360deg) } }
.bos-stip { animation: bos-zacht 1.8s ease-in-out infinite }
.bos-draai { animation: bos-rond 1s linear infinite }
@keyframes bos-gloei { 0%,100% { opacity: 0.55; transform: scale(0.85); box-shadow: 0 0 2px 0 currentColor } 50% { opacity: 1; transform: scale(1.1); box-shadow: 0 0 8px 1px currentColor } }
@keyframes bos-licht { 0%,100% { opacity: 0.35; box-shadow: 0 0 0 0 currentColor } 50% { opacity: 0.8; box-shadow: 0 0 5px 0 currentColor } }
.bos-gloei { animation: bos-gloei 1.4s ease-in-out infinite }
.bos-licht { animation: bos-licht 2.6s ease-in-out infinite }
.bos-robot .bos-hand-l { animation: bos-typ 0.5s ease-in-out infinite }
.bos-robot .bos-hand-r { animation: bos-typ 0.5s ease-in-out 0.25s infinite }
.bos-robot .bos-oog { transform-box: fill-box; transform-origin: center; animation: bos-knipper 3s infinite }
.bos-robot .bos-antenne { animation: bos-zacht 1.6s ease-in-out infinite }
.bos-robot.bos-rust { opacity: 0.45 }
.bos-tabjes { scrollbar-width: none }
.bos-tabjes::-webkit-scrollbar { display: none }
.bos-robot.bos-rust * { animation: none !important }
@media (prefers-reduced-motion: reduce) { .bos-robot *, .bos-stip, .bos-draai, .bos-gloei, .bos-licht { animation: none !important } }
`

// Gesprek → berichten voor de AI. Meerdere screenshots in één bericht worden
// opeenvolgende gebruikersberichten (de edge function kent één beeld per
// bericht); alleen de laatste MAX_BEELDEN beelden gaan echt mee.
// Eerdere gesprekken terughalen (ook na per ongeluk "Nieuw gesprek"): elke
// chatvraag via de Mac bewaart het hele gesprek in business_os_opdrachten.
// Per gesprek_id de laatste rij; klik = vragen + laatste antwoord terug in
// dit tabje, met dezelfde Slim-sessie (Gino weet dan nog waar het over ging).
function EerdereGesprekken({ huidig, onKies, onSluit }) {
  const [lijst, setLijst] = useState(null)
  useEffect(() => {
    supabase.from('business_os_opdrachten')
      .select('id, created_at, gid:invoer->>gesprek_id, eerste:invoer->berichten->0->>content, laatste:opdracht')
      .eq('soort', 'chat').eq('status', 'klaar')
      .gte('created_at', new Date(Date.now() - 14 * 864e5).toISOString())
      .order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => {
        const gezien = new Set()
        setLijst((data || []).filter(r => r.gid && r.gid !== huidig && !gezien.has(r.gid) && gezien.add(r.gid)).slice(0, 12))
      }, () => setLijst([]))
  }, [huidig])
  const kies = async (r) => {
    const { data } = await supabase.from('business_os_opdrachten').select('invoer, antwoord').eq('id', r.id).maybeSingle()
      .then(x => x, () => ({ data: null }))
    if (!data?.invoer?.berichten?.length) return
    const berichten = data.invoer.berichten.map(b => ({ role: b.role, content: b.content || '' }))
    if (data.antwoord?.tekst) berichten.push({ role: 'assistant', content: data.antwoord.tekst, acties: data.antwoord.acties || [] })
    onKies(berichten, r.gid)
  }
  const wanneer = (iso) => new Date(iso).toLocaleString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <>
      <div onClick={onSluit} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
      <div style={{
        position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', zIndex: 41, width: 'min(340px, 86vw)', maxHeight: 360, overflowY: 'auto',
        background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: 6,
        boxShadow: '0 16px 40px rgba(0,0,0,.6)',
      }}>
        <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '.12em', color: colors.textSecondary, padding: '6px 8px 8px' }}>
          EERDERE GESPREKKEN
        </div>
        {lijst === null && <div style={{ padding: 10, fontSize: '0.8rem', color: colors.textSecondary }}>Laden…</div>}
        {lijst?.length === 0 && <div style={{ padding: 10, fontSize: '0.8rem', color: colors.textSecondary }}>Nog niets bewaard.</div>}
        {lijst?.map(r => (
          <button key={r.gid} onClick={() => kies(r)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '9px 10px', borderRadius: 10, border: 'none',
            background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kort(r.eerste || r.laatste || 'Gesprek', 60)}
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
              {wanneer(r.created_at)} · laatst: {kort(r.laatste || '', 40)}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

function naarBerichten(gesprek) {
  const plat = []
  for (const { role, content, afbeelding, afbeeldingen } of gesprek) {
    const beelden = afbeeldingen?.length ? afbeeldingen : afbeelding ? [afbeelding] : []
    if (!beelden.length) { plat.push({ role, content }); continue }
    beelden.forEach((a, i) => plat.push({ role, content: i === beelden.length - 1 ? content : '', afbeelding: a }))
  }
  let beelden = 0
  return plat.reverse()
    .map(b => (b.afbeelding && b.afbeelding.data && beelden++ < MAX_BEELDEN) ? b : { role: b.role, content: b.content })
    .filter(b => b.afbeelding || b.content)
    .reverse()
}

// ── Editor (ChatGPT via edge function editor-chat) ──
// Alleen tekst: de hele tabje-geschiedenis gaat mee, de function zet de
// editor-basis (skill 'Editor-basis' in business_os_skills) ervoor en houdt de
// opdracht bij in editor_opdrachten (bezig → klaar / mislukt). Geeft { tekst } of { fout }.
const EDITOR_FOUT = {
  geen_sleutel: 'Geen OpenAI-sleutel gevonden: zet een secret met GPT of OPENAI in de naam in Supabase (Edge Functions, Secrets).',
  sleutel_ongeldig: 'OpenAI weigert de sleutel (401). Controleer de GPT-sleutel in Supabase Secrets.',
  alleen_coach: 'Editor is alleen voor coaches.',
}
async function vraagEditor(gesprek) {
  const berichten = gesprek.filter(b => b.content?.trim()).map(({ role, content }) => ({ role, content }))
  const { data, error } = await supabase.functions.invoke('editor-chat', { body: { berichten } })
  if (data?.tekst) return { tekst: data.tekst }
  // Bij een 4xx/5xx zit de body in error.context (een Response).
  const body = data || await error?.context?.json?.().catch(() => null)
  const code = body?.fout
  if (EDITOR_FOUT[code]) return { fout: EDITOR_FOUT[code] }
  if (code === 'openai') return { fout: `ChatGPT gaf een fout: ${body.detail || body.status || 'onbekend'}` }
  return { fout: 'ChatGPT gaf geen antwoord, probeer opnieuw.' }
}

// Statuslicht zonder tekst (30 okt): bezig = pulserende gloed, wacht = zacht
// oplichtend punt, klaar = vinkje, mislukt = x. Het woord staat alleen in
// title/aria-label (tooltip + schermlezer), niet in beeld.
// 'jou' = er staat in dat tabje een vraag of actie voor Kersten open (vast wit licht);
// 'wacht' = opdracht staat klaar maar de Mac heeft hem nog niet opgepakt.
const TAB_STATUS = {
  bezig: { tekst: 'Bezig', kleur: colors.success },
  jou: { tekst: 'Wacht op jou', kleur: colors.textPrimary },
  wacht: { tekst: 'In de rij', kleur: colors.textSecondary },
  klaar: { tekst: 'Klaar', kleur: colors.success },
  mislukt: { tekst: 'Mislukt', kleur: colors.danger },
}
function StatusLicht({ status, titel }) {
  const st = TAB_STATUS[status]
  if (!st) return null
  const label = titel || st.tekst
  const vak = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 12, height: 12, flexShrink: 0, color: st.kleur }
  if (status === 'klaar' || status === 'mislukt') {
    const Icoon = status === 'klaar' ? Check : X
    return (
      <span role="img" aria-label={label} title={label} style={vak}>
        <Icoon size={11} strokeWidth={3} style={{ filter: `drop-shadow(0 0 3px ${st.kleur})` }} />
      </span>
    )
  }
  return (
    <span role="img" aria-label={label} title={label} style={vak}>
      <span className={status === 'bezig' ? 'bos-gloei' : status === 'wacht' ? 'bos-licht' : undefined} style={{
        width: 6, height: 6, borderRadius: '50%', background: 'currentColor',
        boxShadow: status === 'jou' ? '0 0 5px currentColor' : undefined,
      }} />
    </span>
  )
}
const duur = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s} s`
  if (s < 3600) return `${Math.floor(s / 60)} min`
  if (s < 86400) return `${Math.floor(s / 3600)} u`
  return `${Math.floor(s / 86400)} d`
}
function TabStatus({ staat, nu }) {
  const st = staat && TAB_STATUS[staat.status]
  if (!st) return null
  const tijd = !staat.sinds ? ''
    : staat.status === 'bezig' ? ` ${duur(nu - staat.sinds)}`
    : staat.status === 'klaar' || staat.status === 'mislukt' ? ` · ${duur(nu - staat.sinds)} geleden` : ''
  return <StatusLicht status={staat.status} titel={`${st.tekst}${tijd}`} />
}

const EDITOR_STATUS = { open: 'Open', bezig: 'Bezig…', klaar: 'Klaar', mislukt: 'Mislukt' }
// Laatste opdrachten met statuslicht, bovenaan het venster in Editor. Tik op een
// rij = antwoord eronder. Tabel nog niet aangemaakt (business-os-editor.sql) → niets.
function EditorOpdrachten({ vers }) {
  const [rijen, setRijen] = useState([])
  const [alles, setAlles] = useState(false)
  const [open, setOpen] = useState(null)
  useEffect(() => {
    let weg = false
    const kijk = () => supabase.from('editor_opdrachten')
      .select('id, created_at, opdracht, antwoord, status').order('created_at', { ascending: false }).limit(10)
      .then(({ data, error }) => { if (!weg && !error && Array.isArray(data)) setRijen(data) }, () => {})
    kijk()
    const t = setInterval(kijk, 5000)
    return () => { weg = true; clearInterval(t) }
  }, [vers])
  if (!rijen.length) return null
  return (
    <div style={{ ...TEKST, borderBottom: `1px solid ${colors.borderSubtle}`, paddingBottom: 8, marginBottom: 4 }}>
      <div style={{ fontWeight: 900, color: colors.textPrimary, marginBottom: 4 }}>Opdrachten</div>
      {(alles ? rijen : rijen.slice(0, 3)).map(r => (
        <div key={r.id}>
        <div onClick={() => setOpen(o => (o === r.id ? null : r.id))}
          style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0, cursor: r.antwoord ? 'pointer' : 'default' }}>
          <StatusLicht status={r.status === 'open' ? 'wacht' : r.status} titel={EDITOR_STATUS[r.status] || r.status} />
          <span title={r.opdracht} style={{
            flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.textSecondary, fontWeight: 600,
          }}>
            {kort(r.opdracht, 90)}
          </span>
        </div>
        {open === r.id && r.antwoord && (
          <div style={{ whiteSpace: 'pre-wrap', color: colors.textSecondary, fontWeight: 500, padding: '4px 0 6px 15px' }}>
            {r.antwoord}
          </div>
        )}
        </div>
      ))}
      {rijen.length > 3 && (
        <button onClick={() => setAlles(a => !a)} style={{
          background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', fontFamily: 'inherit',
          color: colors.success, fontWeight: 800, fontSize: '0.75rem',
        }}>
          {alles ? 'minder' : `alle ${rijen.length}`}
        </button>
      )}
    </div>
  )
}

// PA opnieuw inloggen vanuit Business OS. Alleen zichtbaar als de PA op deze
// Mac draait maar zijn login kwijt is (lokaal loket 127.0.0.1:47615, zie
// scripts/business-os-pa.mjs). Met je wachtwoord vragen we bij de auth-API
// een verse sessie (geen tweede supabase-client: die vecht om de login-lock);
// die gaat rechtstreeks naar de PA. Je eigen login in de browser blijft
// ongemoeid.
const PA_LOKET = 'http://127.0.0.1:47615'
function PaInloggen({ zichtbaar, onKlaar }) {
  const [nodig, setNodig] = useState(false)
  const [open, setOpen] = useState(false)
  const [ww, setWw] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  useEffect(() => {
    if (!zichtbaar) { setNodig(false); return }
    let weg = false
    const kijk = () => fetch(`${PA_LOKET}/status`).then(r => r.json())
      .then(d => { if (!weg) setNodig(!d.ingelogd) }, () => { if (!weg) setNodig(false) })
    kijk()
    const t = setInterval(kijk, 10000)
    return () => { weg = true; clearInterval(t) }
  }, [zichtbaar])
  if (!nodig) return null

  const log = async () => {
    setBezig(true); setFout(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const sessie = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ email: user.email, password: ww }),
      }).then(x => x.json())
      if (!sessie.refresh_token) throw new Error('Wachtwoord klopt niet')
      const r = await fetch(`${PA_LOKET}/login`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refresh_token: sessie.refresh_token }),
      }).then(x => x.json())
      if (!r.ok) throw new Error(r.fout || 'PA nam de login niet aan')
      setWw(''); setOpen(false); setNodig(false); onKlaar?.()
    } catch (e) { setFout(e.message) }
    setBezig(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 4px 8px', ...TEKST }}>
      <span style={{ color: colors.textSecondary, fontWeight: 700 }}>De PA op je Mac is zijn login kwijt.</span>
      {open ? (
        <form onSubmit={e => { e.preventDefault(); if (ww && !bezig) log() }} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input type="password" autoFocus value={ww} onChange={e => setWw(e.target.value)} placeholder="Wachtwoord"
            autoComplete="current-password"
            style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${colors.borderSubtle}`, borderRadius: 8, outline: 'none',
              color: colors.textPrimary, fontWeight: 600, fontSize: '0.78rem', padding: '6px 8px', width: 140, fontFamily: 'inherit',
            }} />
          <button type="submit" disabled={!ww || bezig} style={{ ...KNOP, opacity: !ww || bezig ? 0.5 : 1 }}>
            {bezig ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
      ) : (
        <button onClick={() => setOpen(true)} style={KNOP}>PA inloggen</button>
      )}
      {fout && <span style={{ color: colors.danger, fontWeight: 700 }}>{fout}</span>}
    </div>
  )
}

// onVisueel(actie, tabId): Gino wil iets laten zien rond de bol (GinoToneel.jsx),
// bij dat tabje. onTab(tabId): het open tabje, zodat het beeld meewisselt.
export default function BusinessChat({ context, onBezig, onVisueel, onTab, marginTop = 28 }) {
  // Gesprekken naast elkaar (tabjes). Elk tabje heeft zijn eigen geschiedenis,
  // denk-status en halve tekst, zodat je in 'Strategie' kunt praten terwijl
  // 'Code' nog op een antwoord of code-opdracht wacht.
  const [gesprekken, setGesprekken] = useState(leesGesprekken)
  const [actiefId, setActiefId] = useState(() => lees(ACTIEF_KEY))
  const actief = gesprekken.find(g => g.id === actiefId) || gesprekken[0]
  const gesprek = actief.berichten
  useEffect(() => { onTab?.(actief.id) }, [actief.id, onTab])
  const gesprekkenRef = useRef(gesprekken)
  gesprekkenRef.current = gesprekken
  const actiefRef = useRef(actief.id)
  actiefRef.current = actief.id
  const wijzigTabje = (id, f) => setGesprekken(gs => gs.map(g => g.id !== id ? g : { ...f(g), bijgewerkt: Date.now() }))
  const zetBerichten = (id, f) => wijzigTabje(id, g => ({ ...g, berichten: f(g.berichten) }))
  const [bezigPer, setBezigPer] = useState({})
  const stopPer = useRef({}) // tabje → { id, gestopt } van de lopende vraag
  const [toonEerder, setToonEerder] = useState(false)
  const [deelPer, setDeelPer] = useState({})
  const [ongelezenPer, setOngelezenPer] = useState({})
  const bezig = !!bezigPer[actief.id]
  const ergensBezig = Object.values(bezigPer).some(Boolean)
  const ergensOngelezen = gesprekken.some(g => ongelezenPer[g.id])
  // Snel (Sonnet, licht) of Slim (Opus + CLAUDE.md/memory + onthoudt per
  // gesprek wat hij opzocht). Slim kan alleen via de Mac.
  const [modus, setModus] = useState(() => { try { return localStorage.getItem('business_os_modus') || 'snel' } catch { return 'snel' } })
  const wisselModus = () => setModus(m => {
    const n = m === 'slim' ? 'snel' : 'slim'
    try { localStorage.setItem('business_os_modus', n) } catch { /* geen opslag */ }
    return n
  })
  const [invoer, setInvoer] = useState('')
  const [bijlagen, setBijlagen] = useState([])
  const isMobile = useIsMobile()
  // Berichtenvenster: start altijd dicht, niet onthouden.
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  useEffect(() => { openRef.current = open }, [open])
  // Wat je open ziet, is gelezen.
  useEffect(() => {
    if (open) setOngelezenPer(o => (o[actief.id] ? { ...o, [actief.id]: false } : o))
  }, [open, actief.id])
  // Groene stip op een tabje, behalve als je dat gesprek nu open hebt.
  const markeer = (id) => {
    if (openRef.current && actiefRef.current === id) return
    setOngelezenPer(o => ({ ...o, [id]: true }))
  }
  // Laat de pagina meekijken (de reactor-ring versnelt zolang de AI denkt).
  useEffect(() => { onBezig?.(ergensBezig) }, [ergensBezig, onBezig])

  const kiesGesprek = (id) => {
    setActiefId(id)
    schrijf(ACTIEF_KEY, id)
    setOpen(true)
  }
  const extraGesprek = () => {
    const t = nieuwTabje(`Gesprek ${gesprekken.length + 1}`)
    setGesprekken(gs => [...gs, t])
    kiesGesprek(t.id)
  }
  // Alleen extra tabjes kunnen dicht; Code, Strategie en Editor blijven staan.
  const sluitGesprek = (id) => {
    const g = gesprekken.find(x => x.id === id)
    if (!g || isVast(g, gesprekken.indexOf(g))) return
    if (g.berichten.length && !window.confirm(`Gesprek '${g.naam}' sluiten? De berichten verdwijnen.`)) return
    setGesprekken(gs => gs.filter(x => x.id !== id))
    if (actief.id === id) { setActiefId(gesprekken[0].id); schrijf(ACTIEF_KEY, gesprekken[0].id) }
    if (dbKlaar) supabase.from(DB_GESPREKKEN).delete().eq('id', id).then(() => {}, () => {})
  }

  // Lokaal bewaren (zonder volle afbeeldingen).
  useEffect(() => {
    schrijf(GESPREKKEN_KEY, JSON.stringify(gesprekken.map(g => ({ ...g, berichten: schoon(g.berichten) }))))
  }, [gesprekken])

  // Supabase: bij openen ophalen (nieuwste per tabje wint), daarna elk gewijzigd
  // tabje na 0,8 s rust wegschrijven. Tabel nog niet aangemaakt → alleen lokaal.
  const [dbKlaar, setDbKlaar] = useState(false)
  const opgeslagen = useRef({}) // id → bijgewerkt dat al in de database staat
  useEffect(() => {
    let weg = false
    supabase.from(DB_GESPREKKEN).select('id, naam, volgorde, sessie, berichten, updated_at').order('volgorde')
      .then(({ data, error }) => {
        if (weg || error || !Array.isArray(data)) return
        const uitDb = data.map(r => {
          const bijgewerkt = new Date(r.updated_at).getTime()
          opgeslagen.current[r.id] = bijgewerkt
          return { id: r.id, naam: r.naam, sessie: r.sessie || r.id, berichten: Array.isArray(r.berichten) ? r.berichten : [], bijgewerkt }
        })
        if (uitDb.length) setGesprekken(lokaal => metEditor([
          ...uitDb.map(d => { const l = lokaal.find(x => x.id === d.id); return l && l.bijgewerkt > d.bijgewerkt ? l : d }),
          // Alleen hier bestaande tabjes met berichten (bv. de oude geschiedenis) erachter.
          ...lokaal.filter(l => !uitDb.some(d => d.id === l.id) && l.berichten.length),
        ], lokaal))
        setDbKlaar(true)
      }, () => {})
    return () => { weg = true }
  }, [])
  useEffect(() => {
    if (!dbKlaar) return
    const t = setTimeout(() => {
      gesprekken.forEach((g, volgorde) => {
        if (opgeslagen.current[g.id] === g.bijgewerkt) return
        const bij = g.bijgewerkt
        supabase.from(DB_GESPREKKEN).upsert({
          id: g.id, naam: g.naam, volgorde, sessie: g.sessie, berichten: schoon(g.berichten), updated_at: new Date(bij).toISOString(),
        }).then(({ error }) => { if (!error) opgeslagen.current[g.id] = bij }, () => {})
      })
    }, 800)
    return () => clearTimeout(t)
  }, [gesprekken, dbKlaar])
  // Groeironde (nacht, door de PA): verslag + voorstellen één keer in het
  // tabje Strategie. gezien_at claimen vóór het toevoegen, zodat twee open
  // vensters hem niet allebei plaatsen.
  // Eerste keer na 3 s: dan zijn de tabjes uit de database (als die er is) binnen.
  useEffect(() => {
    let weg = false
    const kijk = async () => {
      const { data } = await supabase.from('business_os_opdrachten').select('id, antwoord, klaar_at')
        .eq('soort', 'groei').eq('status', 'klaar').is('gezien_at', null).order('klaar_at')
      for (const r of data || []) {
        if (weg || !r.antwoord?.tekst) continue
        const { data: geclaimd } = await supabase.from('business_os_opdrachten')
          .update({ gezien_at: new Date().toISOString() }).eq('id', r.id).is('gezien_at', null).select('id')
        if (!geclaimd?.length) continue
        const gs = gesprekkenRef.current
        const doel = gs.find(g => g.naam === 'Strategie') || gs[1] || gs[0]
        const wanneer = new Date(r.klaar_at).toLocaleString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
        zetBerichten(doel.id, b => [...b, { role: 'assistant', content: `Groeironde (${wanneer})\n\n${r.antwoord.tekst}`, acties: r.antwoord.acties || [], op: new Date(r.klaar_at).getTime() || Date.now() }])
        // Ochtendbeeld meteen rond de bol.
        const beeld = (r.antwoord.acties || []).find(a => a?.soort === 'visueel')
        if (beeld) onVisueel?.(beeld, doel.id)
        markeer(doel.id)
      }
    }
    const eerst = setTimeout(() => kijk().catch(() => {}), 3000)
    const t = setInterval(() => kijk().catch(() => {}), 60000)
    return () => { weg = true; clearTimeout(eerst); clearInterval(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [fout, setFout] = useState(null)
  const [editorVers, setEditorVers] = useState(0) // ophogen = opdrachtenlijst Editor opnieuw ophalen
  const [luistert, setLuistert] = useState(false)
  const luistertRef = useRef(false)
  useEffect(() => { luistertRef.current = luistert }, [luistert])
  const { spreekt, bron: spreekBron } = stem.useStem()
  const [sleept, setSleept] = useState(false)
  const wortel = useRef(null)
  const lijst = useRef(null)
  const veld = useRef(null)
  const herkenner = useRef(null)
  const spraakBasis = useRef('') // vaste tekst: wat er stond + finale spraak
  const spraakVerwerkt = useRef(0) // aantal finale resultaten dat al in spraakBasis zit
  const herstartTimer = useRef(null)
  const kiezer = useRef(null)
  const balk = useRef(null)

  // Waar past het berichtenvenster? Liefst onder de groep; is daar te weinig
  // ruimte, dan erboven (over de ring heen). De groep zelf schuift nooit.
  const [plek, setPlek] = useState(null)
  useLayoutEffect(() => {
    if (!open) { setPlek(null); return }
    const meet = () => {
      const w = wortel.current, bk = balk.current
      if (!w || !bk) return
      const pagina = (w.closest('[data-bos-pagina]') || document.documentElement).getBoundingClientRect()
      const onder = pagina.bottom - w.getBoundingClientRect().bottom - 22
      const boven = bk.getBoundingClientRect().top - 40 - pagina.top - 12
      const p = onder >= 240 || onder >= boven ? { onder: true, max: Math.min(520, onder) } : { onder: false, max: Math.min(520, boven) }
      setPlek(o => (o && o.onder === p.onder && o.max === p.max ? o : p))
    }
    meet()
    window.addEventListener('resize', meet)
    return () => window.removeEventListener('resize', meet)
  }, [open])

  useEffect(() => () => { clearTimeout(herstartTimer.current); herkenner.current?.abort() }, [])
  // Stem stopt bij weggaan: tab dicht/verborgen of component weg.
  useEffect(() => {
    const zicht = () => { if (document.hidden) stem.stop() }
    document.addEventListener('visibilitychange', zicht)
    return () => { document.removeEventListener('visibilitychange', zicht); stem.stop() }
  }, [])

  // Korte melding na afloop ("Klaar" / "Mislukt, bekijk resultaat").
  const [melding, setMelding] = useState(null)
  const meldTimer = useRef(null)
  const meld = (tekst, isFout) => {
    clearTimeout(meldTimer.current)
    setMelding({ tekst, fout: isFout })
    meldTimer.current = setTimeout(() => setMelding(null), isFout ? 6000 : 3000)
  }
  useEffect(() => () => clearTimeout(meldTimer.current), [])

  // Draait de PA op de Mac? (hartslag elke 15 s). Route = Kerstens keuze
  // (klik op Mac/API), maar Mac alleen als de PA ook echt online is.
  const [paOnline, setPaOnline] = useState(false)
  const [route, setRoute] = useState(() => { try { return localStorage.getItem('business_os_route') || 'mac' } catch { return 'mac' } })
  const wisselRoute = () => setRoute(r => {
    const n = r === 'mac' ? 'api' : 'mac'
    try { localStorage.setItem('business_os_route', n) } catch { /* geen opslag */ }
    return n
  })
  const viaMac = route === 'mac' && paOnline

  // Herstart-knop: vraagt de PA via het lokale loket om zichzelf te herstarten
  // (launchd start hem opnieuw), wacht tot hij weer antwoordt en ververst dan
  // het scherm. Werkt alleen op de Mac waar de PA draait.
  const [herstart, setHerstart] = useState(false)
  const herstartPa = async () => {
    if (herstart) return
    setHerstart(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch(`${PA_LOKET}/herstart`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ access_token: session?.access_token }),
      }).then(x => x.json(), () => ({ fout: 'PA niet bereikbaar op deze Mac' }))
      if (!r.ok) throw new Error(r.fout || 'Herstart mislukt')
      await slaap(4000)
      for (let i = 0; i < 60; i++) {
        const terug = await fetch(`${PA_LOKET}/status`).then(x => x.ok, () => false)
        if (terug) { window.location.reload(); return }
        await slaap(1500)
      }
      throw new Error('PA kwam niet terug, kijk in ~/Library/Logs/myarc-pa.log')
    } catch (e) {
      meld(e.message, true)
      setHerstart(false)
    }
  }
  useEffect(() => {
    let weg = false
    const kijk = () => supabase.from('business_os_pa_status').select('laatst_gezien').maybeSingle()
      .then(({ data }) => { if (!weg) setPaOnline(!!data && Date.now() - new Date(data.laatst_gezien).getTime() < PA_ONLINE_MS) }, () => {})
    kijk()
    const t = setInterval(kijk, 15000)
    return () => { weg = true; clearInterval(t) }
  }, [])

  // Lopende code-opdrachten (laatste 30 min). Valt er een weg, dan kijken we
  // hoe hij geëindigd is voor de korte melding.
  const [code, setCode] = useState(null) // null | 'wacht' | 'bezig'
  const [inRij, setInRij] = useState(0) // code-opdrachten die op hun beurt wachten
  // Laatst afgeronde code-opdracht: de rustregel van het robotje.
  const [laatst, setLaatst] = useState(null) // { tekst (kort), vol (voor de stem), klaar_at }
  useEffect(() => {
    let weg = false
    const haalLaatst = () => supabase.from('business_os_opdrachten')
      .select('opdracht, resultaat, klaar_at').eq('soort', 'code').eq('status', 'klaar')
      .not('klaar_at', 'is', null).order('klaar_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (weg || !data) return
        const tekst = laatstGedaanRegel(data)
        // vol: de hele tekst voor de stem; de regel zelf is ingekort tot ~60 tekens.
        const vol = data.resultaat?.trim() || `Gino deed: ${data.opdracht || ''}`
        if (tekst) setLaatst(o => (o?.klaar_at === data.klaar_at ? o : { tekst, vol, klaar_at: data.klaar_at }))
      }, () => {})
    haalLaatst()
    const t = setInterval(haalLaatst, 15000)
    return () => { weg = true; clearInterval(t) }
  }, [])
  // Stem aan: alleen een nieuwe rustregel voorlezen. Bij het laden telt de
  // huidige als gelezen; daarna alleen als er echt iets nieuws af is.
  const eersteLaatst = useRef(true)
  useEffect(() => {
    if (!laatst) return
    const nieuw = lees(GELEZEN_KEY) !== laatst.klaar_at
    schrijf(GELEZEN_KEY, laatst.klaar_at)
    if (eersteLaatst.current) { eersteLaatst.current = false; return }
    if (nieuw && stem.isAan() && !stem.isBezig() && !luistertRef.current) stem.spreek(laatst.vol, { bewaar: true })
  }, [laatst])

  // ElevenLabs-sleutels nog niet in Supabase? Dan een open actie voor Kersten,
  // tot de function werkt of hij op Gedaan klikt.
  const [sleutelWeg, setSleutelWeg] = useState(false)
  useEffect(() => {
    if (lees(SLEUTEL_GEDAAN_KEY)) return
    let weg = false
    const kijk = () => stem.sleutelOntbreekt().then(o => { if (!weg && !lees(SLEUTEL_GEDAAN_KEY)) setSleutelWeg(o) })
    kijk()
    const t = setInterval(kijk, 5 * 60 * 1000)
    return () => { weg = true; clearInterval(t) }
  }, [])
  const sleutelGedaan = () => { schrijf(SLEUTEL_GEDAAN_KEY, '1'); setSleutelWeg(false) }

  useEffect(() => {
    let weg = false
    let vorige = []
    // Ruim venster: met een rij kan een opdracht lang op zijn beurt wachten.
    const kijk = () => supabase.from('business_os_opdrachten')
      .select('id, status').eq('soort', 'code').in('status', ['wacht', 'bezig'])
      .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .then(({ data }) => {
        if (weg || !data) return
        const loopt = data.some(r => r.status === 'bezig')
        setCode(loopt ? 'bezig' : data.length ? 'wacht' : null)
        setInRij(Math.max(0, data.length - 1))
        const ids = data.map(r => r.id)
        const klaar = vorige.filter(id => !ids.includes(id))
        vorige = ids
        if (!klaar.length) return
        supabase.from('business_os_opdrachten').select('status').in('id', klaar)
          .then(({ data: af }) => {
            if (weg) return
            if (af?.length && af.every(r => r.status === 'gestopt')) { meld('Gestopt', false); return }
            meld(af?.some(r => r.status === 'mislukt') ? 'Mislukt, bekijk resultaat' : 'Klaar', af?.some(r => r.status === 'mislukt'))
            // Stip op het tabje waar de opdracht vandaan kwam (anders het actieve).
            const bij = gesprekkenRef.current.filter(g => g.berichten.some(b => (b.acties || []).some(a => a?.opdrachtId && klaar.includes(a.opdrachtId))))
            ;(bij.length ? bij.map(g => g.id) : [actiefRef.current]).forEach(markeer)
          }, () => {})
      }, () => {})
    kijk()
    const t = setInterval(kijk, 4000)
    return () => { weg = true; clearInterval(t) }
  }, [])

  // Status per tabje: chat- en code-rijen van het laatste etmaal. Realtime
  // haalt bij elke wijziging opnieuw op; pollen elke 5 s blijft als vangnet.
  const [tabRijen, setTabRijen] = useState([])
  useEffect(() => {
    let weg = false
    let wachtOp = null
    const kijk = () => supabase.from('business_os_opdrachten')
      .select('id, soort, status, created_at, gestart_at, klaar_at, gesprek:invoer->>gesprek_id')
      .in('soort', ['chat', 'code']).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false }).limit(80)
      .then(({ data, error }) => { if (!weg && !error && Array.isArray(data)) setTabRijen(data) }, () => {})
    kijk()
    const t = setInterval(kijk, 5000)
    const kanaal = supabase.channel('bos-tabstatus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'business_os_opdrachten' }, () => {
        clearTimeout(wachtOp)
        wachtOp = setTimeout(kijk, 300)
      })
      .subscribe()
    return () => { weg = true; clearInterval(t); clearTimeout(wachtOp); supabase.removeChannel(kanaal) }
  }, [])
  // Lokaal denken (API-route, Editor) heeft geen rij: starttijd zelf bijhouden.
  const bezigSinds = useRef({})
  useEffect(() => {
    Object.entries(bezigPer).forEach(([id, aan]) => {
      if (aan && !bezigSinds.current[id]) bezigSinds.current[id] = Date.now()
      if (!aan) delete bezigSinds.current[id]
    })
  }, [bezigPer])
  const tabStatus = (g) => {
    const ids = new Set(g.berichten.flatMap(b => (b.acties || []).map(a => a?.opdrachtId).filter(Boolean)))
    const rijen = tabRijen.filter(r => ids.has(r.id) || (r.soort === 'chat' && g.sessie && r.gesprek === g.sessie))
    const loopt = rijen.filter(r => r.status === 'bezig')
    if (loopt.length || bezigPer[g.id]) {
      const start = Math.min(...loopt.map(r => new Date(r.gestart_at || r.created_at).getTime()), bezigSinds.current[g.id] || Infinity)
      return { status: 'bezig', sinds: Number.isFinite(start) ? start : null }
    }
    if (alleOpen.some(x => x.t === g.id)) return { status: 'jou' }
    if (rijen.some(r => r.status === 'wacht')) return { status: 'wacht' }
    const af = rijen.find(r => r.status === 'klaar' || r.status === 'mislukt')
    return af ? { status: af.status, sinds: new Date(af.klaar_at || af.created_at).getTime() } : null
  }
  // Klok voor "loopt 2:13" en "5 min geleden": elke seconde als er iets loopt, anders elke halve minuut.
  const [nu, setNu] = useState(() => Date.now())
  const ietsLoopt = ergensBezig || tabRijen.some(r => r.status === 'bezig')
  useEffect(() => {
    const t = setInterval(() => setNu(Date.now()), ietsLoopt ? 1000 : 30000)
    return () => clearInterval(t)
  }, [ietsLoopt])

  // Eén herkenner-sessie met `basis` als vaste tekst. Finale spraak gaat vast in
  // spraakBasis; alleen het tussentijdse deel staat als losse staart in het veld.
  const startHerkenner = (basis) => {
    const h = new Spraak()
    h.lang = 'nl-NL'
    h.continuous = true
    h.interimResults = true
    h.maxAlternatives = 1
    spraakBasis.current = basis
    spraakVerwerkt.current = 0
    const gestart = Date.now()
    let fataal = false
    // Alleen de actuele herkenner mag het veld vullen: na versturen of bewerken komt er niets meer terug.
    h.onresult = (e) => {
      if (herkenner.current !== h) return
      let staart = ''
      for (let i = Math.max(e.resultIndex, spraakVerwerkt.current); i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal && i === spraakVerwerkt.current) {
          spraakBasis.current = plakSpraak(spraakBasis.current, r[0].transcript)
          spraakVerwerkt.current = i + 1
        } else staart = plakSpraak(staart, r[0].transcript)
      }
      setInvoer(plakSpraak(spraakBasis.current, staart))
    }
    h.onerror = (e) => {
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) fataal = true
      if (e.error !== 'aborted' && e.error !== 'no-speech') setFout('Microfoon werkt niet: ' + e.error)
    }
    h.onend = () => {
      if (herkenner.current !== h) return
      herkenner.current = null
      // Chrome/Safari kappen een sessie af na stilte: zolang de mic aan staat, gewoon doorgaan.
      if (luistertRef.current && !fataal && Date.now() - gestart > 1000 && startHerkenner(spraakBasis.current)) return
      luistertRef.current = false
      setLuistert(false)
      veld.current?.focus()
    }
    herkenner.current = h
    try { h.start() } catch { herkenner.current = null; return false }
    return true
  }
  const microfoon = () => {
    if (luistert) {
      // Zelf gestopt: geen herstart meer, laatste finale woorden mogen nog binnenkomen.
      luistertRef.current = false
      clearTimeout(herstartTimer.current)
      if (herkenner.current) herkenner.current.stop()
      else setLuistert(false)
      return
    }
    stem.stop()
    setFout(null)
    // Wat er al stond blijft staan; het gesprokene komt erachter.
    if (!startHerkenner(invoer)) return
    luistertRef.current = true
    setLuistert(true)
  }
  const koppelLos = () => {
    const h = herkenner.current
    herkenner.current = null
    if (h) {
      h.onresult = h.onerror = h.onend = null
      try { h.abort() } catch { /* al gestopt */ }
    }
  }
  // Versturen: herkenning hard afbreken en loskoppelen, zodat late (interim/final)
  // resultaten de verstuurde tekst niet terugzetten.
  const stopHerkenner = () => {
    clearTimeout(herstartTimer.current)
    koppelLos()
    luistertRef.current = false
    setLuistert(false)
  }
  // Handmatig bewerken wint: tijdens typen, verwijderen of selecteren staat de
  // herkenner even uit; na een korte rust start hij schoon met wat er nu in het veld staat.
  const bewerktTijdensLuisteren = () => {
    if (!luistertRef.current) return
    koppelLos()
    clearTimeout(herstartTimer.current)
    const herstart = () => {
      if (!luistertRef.current || herkenner.current) return
      const el = veld.current
      if (el && el.selectionStart !== el.selectionEnd) { herstartTimer.current = setTimeout(herstart, 800); return }
      if (!startHerkenner(el ? el.value : spraakBasis.current)) { luistertRef.current = false; setLuistert(false) }
    }
    herstartTimer.current = setTimeout(herstart, 1200)
  }

  // Invoerveld groeit mee tot ~6 regels en volgt tijdens inspreken de laatste woorden.
  useLayoutEffect(() => {
    const el = veld.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, INVOER_MAX_H) + 'px'
    if (luistert) el.scrollTop = el.scrollHeight
  }, [invoer, luistert])

  const neemBeelden = async (bestanden) => {
    const beelden = Array.from(bestanden || []).filter(b => b?.type?.startsWith('image/'))
    if (!beelden.length) return
    if (isEditor(actief)) { setFout('Editor (ChatGPT) kan nog geen screenshots, alleen tekst'); return }
    try {
      setFout(null)
      const nieuw = await Promise.all(beelden.map(verklein))
      setBijlagen(oud => {
        const samen = [...oud, ...nieuw]
        if (samen.length > MAX_BEELDEN) setFout(`Maximaal ${MAX_BEELDEN} afbeeldingen per bericht`)
        return samen.slice(0, MAX_BEELDEN)
      })
    } catch (e) {
      setFout(e.message || 'Afbeelding kon niet gelezen worden')
    }
  }
  const plak = (e) => {
    const items = Array.from(e.clipboardData?.items || []).filter(it => it.type.startsWith('image/'))
    if (!items.length) return
    e.preventDefault()
    neemBeelden(items.map(it => it.getAsFile()))
  }

  // Slepen: overal op het scherm, zolang de chat zichtbaar is.
  const neemRef = useRef(neemBeelden)
  neemRef.current = neemBeelden
  useEffect(() => {
    let diepte = 0
    const zichtbaar = () => !!wortel.current?.getClientRects().length
    const metBestand = (e) => Array.from(e.dataTransfer?.types || []).includes('Files') && zichtbaar()
    const binnen = (e) => { if (!metBestand(e)) return; e.preventDefault(); diepte++; setSleept(true) }
    const over = (e) => { if (!metBestand(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }
    const buiten = (e) => { if (!metBestand(e)) return; diepte = Math.max(0, diepte - 1); if (!diepte) setSleept(false) }
    const los = (e) => {
      if (!metBestand(e)) return
      e.preventDefault()
      diepte = 0
      setSleept(false)
      neemRef.current(e.dataTransfer.files)
      veld.current?.focus()
    }
    window.addEventListener('dragenter', binnen)
    window.addEventListener('dragover', over)
    window.addEventListener('dragleave', buiten)
    window.addEventListener('drop', los)
    return () => {
      window.removeEventListener('dragenter', binnen)
      window.removeEventListener('dragover', over)
      window.removeEventListener('dragleave', buiten)
      window.removeEventListener('drop', los)
    }
  }, [])

  // Venster opent onderaan en scrolt mee bij nieuwe inhoud (berichten, kaarten,
  // later ladende thumbs), maar alleen als je al onderaan stond: wie terugleest
  // wordt niet teruggetrokken. Callback-ref: het venster mount pas als plek er is.
  const onderaan = useRef(true)
  const lijstRef = useCallback(el => {
    lijst.current = el
    if (!el) return
    onderaan.current = true
    const naarOnder = () => { if (onderaan.current) el.scrollTop = el.scrollHeight }
    naarOnder()
    const raf = requestAnimationFrame(naarOnder)
    const mo = new MutationObserver(naarOnder)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    el.addEventListener('load', naarOnder, true) // img-load bubbelt niet; capture wel
    return () => {
      cancelAnimationFrame(raf)
      mo.disconnect()
      el.removeEventListener('load', naarOnder, true)
      lijst.current = null
    }
  }, [])
  const bijScroll = (e) => {
    const el = e.currentTarget
    onderaan.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }

  // Terugblik: maken bij openen of wisselen van tabje, alleen als er sinds de
  // vorige een nieuw bericht is. Tijdens het doorpraten niet bij elk antwoord
  // opnieuw (tokens); een verouderde terugblik wordt dan gewoon niet getoond.
  const [terugblikken, setTerugblikken] = useState(leesTerugblikken)
  const terugblikkenRef = useRef(terugblikken)
  terugblikkenRef.current = terugblikken
  const [terugblikLaadt, setTerugblikLaadt] = useState({})
  const terugblikLoopt = useRef({})
  useEffect(() => {
    const bestaat = new Set(gesprekken.map(g => g.id))
    schrijf(TERUGBLIK_KEY, JSON.stringify(Object.fromEntries(Object.entries(terugblikken).filter(([id]) => bestaat.has(id)))))
  }, [terugblikken, gesprekken])
  useEffect(() => {
    if (!open) return
    const g = gesprekkenRef.current.find(x => x.id === actiefRef.current)
    const basis = terugblikBasis(g)
    if (!basis || terugblikLoopt.current[g.id] || terugblikkenRef.current[g.id]?.sleutel === basis.sleutel) return
    terugblikLoopt.current[g.id] = true
    setTerugblikLaadt(l => ({ ...l, [g.id]: true }))
    maakTerugblik(g).then(tekst => {
      if (tekst) setTerugblikken(t => ({ ...t, [g.id]: { tekst, tot: basis.tot, sleutel: basis.sleutel } }))
    }).finally(() => {
      terugblikLoopt.current[g.id] = false
      setTerugblikLaadt(l => ({ ...l, [g.id]: false }))
    })
  }, [open, actief.id, dbKlaar])
  const basisNu = terugblikBasis(actief)
  const terugblik = basisNu && terugblikken[actief.id]?.sleutel === basisNu.sleutel ? terugblikken[actief.id] : null
  const terugblikTekst = terugblik ? vulTerugblikIn(terugblik) : ''
  const terugblikBron = `terugblik-${actief.id}`
  const terugblikPraat = spreekt && spreekBron === terugblikBron
  const leesTerugblikVoor = () => {
    if (terugblikPraat) { stem.stop(); return }
    stopHerkenner()
    stem.leesVoor(terugblikTekst, terugblikBron)
  }

  // Halve tekst terwijl Gino via de Mac typt (per tabje).
  const deel = deelPer[actief.id] || ''
  // Voorleestekst: het antwoord en daarna de eerste toestemmingsvraag (die in het wolkje).
  // Vastgelegd bij binnenkomst, zodat herhalen dezelfde (bewaarde) audio pakt.
  // Op inhoud, niet op object: een afgehandelde actie vervangt het bericht-object.
  // De stem maakt er zelf de korte versie van (stem.spreekTekst); vraag gaat er heel achteraan.
  const spraak = useRef({ content: null, tekst: '', vraag: null })
  const spraakVan = (bericht) => {
    if (spraak.current.content === bericht.content) return spraak.current
    const open = (bericht.acties || []).find(staatOpen)
    return { content: bericht.content, tekst: bericht.content, vraag: (open && vraagVoor(open).vraag) || null }
  }
  // Antwoord landt altijd in het tabje waar de vraag vandaan kwam. Voorlezen
  // alleen als je dat tabje nog voor je hebt; anders een groene stip erop.
  const antwoord = (id, bericht) => {
    bericht = { ...bericht, op: Date.now() }
    zetBerichten(id, g => [...g, bericht])
    const visueel = (bericht.acties || []).find(a => a?.soort === 'visueel')
    if (visueel) onVisueel?.(visueel, id)
    markeer(id)
    meld('Klaar', false)
    if (actiefRef.current !== id) return
    const s = spraakVan(bericht)
    spraak.current = s
    if (stem.isAan() && !luistertRef.current) stem.spreek(s.tekst, { bewaar: true, vraag: s.vraag })
  }
  // tekst = altijd de volledige tekst; stem.herhaal maakt dezelfde korte versie als het voorlezen.
  const herhaal = (tekst, vraag) => {
    if (stem.isBezig()) { stem.stop(); return }
    stopHerkenner()
    stem.herhaal(tekst, vraag)
  }
  const herhaalKnop = (tekst, vraag = null) => <Herhaal praat={spreekt} onKlik={() => herhaal(tekst, vraag)} />

  const stuur = async () => {
    const vraag = invoer.trim()
    if ((!vraag && !bijlagen.length) || bezig) return
    const { id, sessie } = actief
    stopHerkenner()
    setInvoer('')
    stem.stop()
    // Versturen is een klik/Enter: Safari laat het antwoord straks dan ook afspelen.
    if (stem.isAan()) stem.ontgrendel()
    const nieuwBericht = { role: 'user', content: vraag, op: Date.now() }
    if (bijlagen.length) {
      nieuwBericht.afbeeldingen = bijlagen.map(({ media_type, data }) => ({ media_type, data }))
      nieuwBericht.thumbs = bijlagen.map(b => b.thumb)
    }
    const nieuw = [...gesprek, nieuwBericht]
    onderaan.current = true // eigen bericht: altijd naar beneden
    // Extra tabje heet 'Gesprek 3' tot de eerste vraag: dan krijgt het die als naam.
    wijzigTabje(id, g => ({
      ...g, berichten: nieuw,
      naam: !g.berichten.length && /^Gesprek \d+$/.test(g.naam) && vraag ? kort(vraag, 18) : g.naam,
    }))
    setInvoer('')
    setBijlagen([])
    setBezigPer(b => ({ ...b, [id]: true }))
    setFout(null)
    if (isEditor(actief)) {
      setEditorVers(v => v + 1) // lijst toont meteen de nieuwe 'bezig'-rij
      const sig = { id: null, gestopt: false }
      stopPer.current[id] = sig
      const r = await vraagEditor(nieuw)
      delete stopPer.current[id]
      if (sig.gestopt) return
      setBezigPer(b => ({ ...b, [id]: false }))
      setEditorVers(v => v + 1)
      if (r.fout) { setFout(r.fout); meld('Mislukt, bekijk resultaat', true); return }
      antwoord(id, { role: 'assistant', content: r.tekst })
      return
    }
    const berichten = naarBerichten(nieuw)
    const metBeeld = berichten.some(b => b.afbeelding)
    let laatsteDeel = ''
    const opDeel = (t) => { if (t) laatsteDeel = t; setDeelPer(d => ({ ...d, [id]: t })) }
    const signaal = { id: null, gestopt: false }
    stopPer.current[id] = signaal
    const mac = viaMac && !metBeeld ? await vraagViaMac(berichten, context, opDeel, { modus, gesprek_id: sessie, ...(isKlanten(actief) ? { tab: 'klanten' } : {}) }, signaal) : null
    opDeel('')
    if (signaal.gestopt || mac?.gestopt) {
      // Gestopt: wat hij al typte blijft staan, zoals bij ChatGPT.
      delete stopPer.current[id]
      setBezigPer(b => ({ ...b, [id]: false }))
      if (!signaal.afgehandeld) zetBerichten(id, g => [...g, { role: 'assistant', content: `${laatsteDeel ? laatsteDeel + '\n\n' : ''}(gestopt)`, gestopt: true, op: Date.now() }])
      return
    }
    delete stopPer.current[id]
    if (mac) {
      setBezigPer(b => ({ ...b, [id]: false }))
      antwoord(id, { role: 'assistant', content: mac.tekst, acties: mac.acties || [] })
      return
    }
    signaal.id = null // nu via de API: stoppen = antwoord negeren
    stopPer.current[id] = signaal
    const { data, error } = await supabase.functions.invoke('business-os-chat', { body: { berichten, context } })
    delete stopPer.current[id]
    if (signaal.gestopt) return // al afgehandeld door de stopknop
    setBezigPer(b => ({ ...b, [id]: false }))
    if (error || data?.error || !data?.tekst) {
      setFout(data?.error || 'AI gaf geen antwoord, probeer opnieuw.')
      meld('Mislukt, bekijk resultaat', true)
      return
    }
    antwoord(id, { role: 'assistant', content: data.tekst, acties: data.acties || [] })
  }

  // Voorstellen: status op de actie zelf (gedeeld door kaart en wolkje),
  // bezig/fout per actie hier (sleutel 'tabje-bericht-actie'). Open voorstellen
  // uit alle tabjes komen in het wolkje, zodat je er geen mist.
  const [actieStaat, setActieStaat] = useState({})
  const zetActie = (t, i, j, veld) => zetBerichten(t, g => g.map((m, mi) => mi !== i ? m : {
    ...m, acties: m.acties.map((x, xi) => xi === j ? { ...x, ...veld } : x),
  }))
  const toestaan = async (t, i, j) => {
    const ac = gesprekken.find(g => g.id === t)?.berichten[i]?.acties?.[j]
    const sleutel = `${t}-${i}-${j}`
    if (!ac || !staatOpen(ac) || actieStaat[sleutel]?.bezig) return
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: true } }))
    const { veld, fout: f } = await VOER_UIT[ac.soort](ac)
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: false, fout: f || null } }))
    if (f) return
    zetActie(t, i, j, veld)
    if (ac.soort === 'pa_voorstel') setCode(c => c || 'wacht') // robotje meteen, de poll neemt het over
  }
  const afwijzen = (t, i, j) => zetActie(t, i, j, { afgewezen: true })
  // Nieuw gesprek in hetzelfde tabje: berichten leeg, nieuwe Slim-sessie.
  const leegGesprek = () => {
    stem.stop()
    wijzigTabje(actief.id, g => ({ ...g, berichten: [], sessie: crypto.randomUUID() }))
    setActieStaat(s => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith(`${actief.id}-`))))
    setFout(null)
    setOngelezenPer(o => ({ ...o, [actief.id]: false }))
  }
  // Nieuwe deploy? Herladen zodra er geen gesprek loopt (gesprekken staan in localStorage).
  useNieuweVersie(!ergensBezig && !luistert && !spreekt && !invoer.trim() && !bijlagen.length
    && !Object.values(actieStaat).some(s => s?.bezig))
  const alleOpen = gesprekken.flatMap(g => g.berichten.flatMap((b, i) => b.role !== 'assistant' ? [] :
    (b.acties || []).map((ac, j) => ({ ac, t: g.id, i, j, sleutel: `${g.id}-${i}-${j}` })).filter(x => staatOpen(x.ac))))
  // "Wacht op jou" staat als lijstje onder de statusregel; het wolkje is voor toestemmingsvragen.
  const wachtLijst = [
    ...(sleutelWeg ? [{ sleutel: 'el', tekst: SLEUTEL_ACTIE, onGedaan: sleutelGedaan }] : []),
    ...alleOpen.filter(x => x.ac.soort === 'wacht_op_jou').map(x => ({
      sleutel: x.sleutel, tekst: x.ac.tekst, bezig: actieStaat[x.sleutel]?.bezig, onGedaan: () => toestaan(x.t, x.i, x.j),
    })),
  ]
  const openVoorstellen = alleOpen.filter(x => x.ac.soort !== 'wacht_op_jou')
  const vraagNu = openVoorstellen[0]
  // Lijst open boven de balk: daar staan de kaarten al, wolkje dan weg (alleen als het voorstel in dit tabje staat).
  const wolkZichtbaar = vraagNu && !(open && plek && !plek.onder && vraagNu.t === actief.id)

  const kanSturen = (invoer.trim() || bijlagen.length) && !bezig
  // Stopknop (blokje op de plek van het pijltje): de lopende vraag in dit
  // tabje, of in Code een lopende code-opdracht. De PA ziet status 'gestopt'
  // en breekt het Claude-proces af.
  const codeStopbaar = actief.naam === 'Code' && code === 'bezig'
  const kanStoppen = bezig || codeStopbaar
  const stop = async () => {
    stem.stop()
    if (bezig) {
      const id = actief.id
      const sig = stopPer.current[id]
      if (sig) sig.gestopt = true
      if (sig?.id) {
        await supabase.from('business_os_opdrachten').update({ status: 'gestopt', klaar_at: new Date().toISOString() })
          .eq('id', sig.id).in('status', ['wacht', 'bezig']).then(r => r, () => null)
      }
      if (!sig?.id) { // API-route of Editor (of nog geen rij): antwoord negeren
        if (sig) sig.afgehandeld = true
        setBezigPer(b => ({ ...b, [id]: false }))
        setDeelPer(d => ({ ...d, [id]: '' }))
        zetBerichten(id, g => [...g, { role: 'assistant', content: '(gestopt)', gestopt: true, op: Date.now() }])
      }
      return
    }
    if (codeStopbaar) {
      await supabase.from('business_os_opdrachten').update({ status: 'gestopt', klaar_at: new Date().toISOString() })
        .eq('soort', 'code').eq('status', 'bezig').then(r => r, () => null)
      setCode(null)
    }
  }
  const rondeKnop = {
    width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
  }
  const anderBezig = gesprekken.find(g => g.id !== actief.id && bezigPer[g.id])
  const werk = code === 'bezig' ? (inRij ? `Bezig met code · ${inRij} in de rij` : 'Bezig met code…')
    : bezig ? (isEditor(actief) ? 'ChatGPT denkt na…' : deel ? 'Gino typt…' : 'Gino denkt na…') : spreekt ? 'Gino praat…'
    : anderBezig ? `Gino denkt na in ${anderBezig.naam}…`
    : code === 'wacht' ? 'Wacht op je Mac…' : null

  return (
    <div ref={wortel} style={{
      textAlign: 'left', marginTop, flexShrink: 0, width: '100%',
    }}>
      <style>{ANIMATIES}</style>
      <div style={{ position: 'relative' }}>
        {/* ── Berichtenvenster: zweeft onder de groep, of erboven als daar geen ruimte is ── */}
        {open && plek && (
          <div ref={lijstRef} onScroll={bijScroll} style={{
            position: 'absolute', left: 0, right: 0, zIndex: 5,
            ...(plek.onder ? { top: '100%', marginTop: 10 } : { bottom: '100%', marginBottom: 40 + wachtLijst.length * WACHT_RIJ_H }),
            maxHeight: plek.max, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
            display: 'flex', flexDirection: 'column', gap: 6, padding: 12, boxSizing: 'border-box',
            background: '#0a0a0a', border: `1px solid ${colors.borderSubtle}`, borderRadius: 16,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}>
            {isEditor(actief) && <EditorOpdrachten vers={editorVers} />}
            {!gesprek.length && (
              <div style={{ ...TEKST, color: colors.textSecondary, fontWeight: 600 }}>
                {isEditor(actief) ? 'Editor praat met ChatGPT: knipplannen, titels, ondertitels, instructies. Alleen tekst, hij kan niet zelf in je editor klikken.'
                  : isKlanten(actief) ? 'Klanten: vraag wie aandacht nodig heeft, laat check-ins nakijken of een appje voorbereiden. Bijvoorbeeld: "Wie moet ik vandaag spreken?"'
                  : 'Nog geen berichten.'}
              </div>
            )}
            {gesprek.map((b, i, alle) => {
              const laatsteGino = alle.slice(i + 1).every(n => n.role === 'user') && stem.beschikbaar()
              return b.role === 'user' ? (
              <div key={i} style={{
                alignSelf: 'flex-end', maxWidth: '85%', background: colors.surface, borderRadius: 14,
                padding: '4px 9px', ...TEKST, fontWeight: 700, color: colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {(b.thumbs || (b.thumb ? [b.thumb] : [])).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: b.content ? 4 : 0 }}>
                    {(b.thumbs || [b.thumb]).map((t, ti) => (
                      <img key={ti} src={t} alt="Screenshot" style={{ display: 'block', maxWidth: 160, maxHeight: 120, borderRadius: 8 }} />
                    ))}
                  </div>
                )}
                {b.content}
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, ...TEKST, fontWeight: 500, color: colors.textPrimary }}>
                  {(b.acties || []).map((ac, j) => {
                    if (!ac || typeof ac !== 'object') return null
                    const kaart = { voorstel: ac, staat: actieStaat[`${actief.id}-${i}-${j}`], onToestaan: () => toestaan(actief.id, i, j) }
                    if (ac.soort === 'wacht_op_jou') return <WachtOpJou key={j} {...kaart} />
                    if (ac.soort === 'slot_voorstel') return <SlotVoorstel key={j} {...kaart} />
                    if (ac.soort === 'wijziging_voorstel') return <WijzigingVoorstel key={j} {...kaart} />
                    if (ac.soort === 'visueel') return (
                      <button key={j} type="button" onClick={() => onVisueel?.(ac, actief.id)} style={{
                        display: 'flex', gap: 6, alignItems: 'center', background: 'transparent', border: 'none', padding: 0, marginBottom: 4,
                        color: colors.success, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Eye size={13} strokeWidth={2.5} /> Laat zien{typeof ac.titel === 'string' && ac.titel ? `: ${ac.titel.slice(0, 50)}` : ''}
                      </button>
                    )
                    if (ac.soort === 'pa_voorstel') return <PaVoorstel key={j} {...kaart} herhaalKnop={laatsteGino ? herhaalKnop : null} />
                    return (
                      <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: colors.success, fontWeight: 800, fontSize: '0.8rem', marginBottom: 4 }}>
                        <Check size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {ac.soort === 'app_issue' ? `Op de app-lijst: ${ac.tekst}` : typeof ac.tekst === 'string' ? ac.tekst : ''}
                      </div>
                    )
                  })}
                  <Inkort tekst={b.content} achter={laatsteGino ? herhaalKnop(spraakVan(b).tekst, spraakVan(b).vraag) : null} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Kopieer tekst={b.content} />
                  <Duimpjes oordeel={b.oordeel} onOordeel={(oordeel) => {
                    const id = actief.id
                    const vraag = alle.slice(0, i).reverse().find(n => n.role === 'user')?.content
                    zetBerichten(id, g => g.map((n, k) => (k === i ? { ...n, oordeel } : n)))
                    bewaarOordeel({ soort: 'antwoord', oordeel, vraag, inhoud: b.content, visueel: (b.acties || []).find(a => a?.soort === 'visueel') })
                      .then(ok => meld(ok ? (oordeel === 'goed' ? 'Onthouden: dit werkt' : 'Onthouden: dit niet') : 'Opslaan mislukt', !ok))
                  }} />
                </div>
              </div>
            )
            })}
            {bezig && deel && (
              <div style={{ ...TEKST, fontWeight: 500, color: colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{deel}</div>
            )}
            {gesprek.length > 0 && !bezig && (terugblik
              ? <Terugblik tekst={terugblikTekst} praat={terugblikPraat} onKlik={leesTerugblikVoor} />
              : terugblikLaadt[actief.id] ? <TerugblikLicht /> : null)}
          </div>
        )}

        <div ref={balk} style={{ position: 'relative' }}>
          {/* ── Werk-indicator: robotje boven de balk, buiten de flow zodat de groep niet verspringt ── */}
          {/* Altijd zichtbaar: bezig, wacht op jou of wat Gino het laatst deed; open acties eronder */}
          <div style={{ position: 'absolute', left: 4, right: 4, bottom: '100%', marginBottom: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 26, minWidth: 0 }}>
              {/* Klik op het poppetje: berichtenvenster open/dicht. Groene stip = iets ongelezen. */}
              <button role="status" onClick={() => setOpen(o => !o)} aria-expanded={open}
                title={open ? 'Berichten verbergen' : 'Berichten tonen'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 26, whiteSpace: 'nowrap', minWidth: 0, flex: '0 1 auto',
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  fontSize: '0.75rem', fontWeight: 800,
                  color: werk || vraagNu || open ? colors.textSecondary : melding ? (melding.fout ? colors.danger : colors.success) : laatst ? colors.textSecondary : colors.textMuted,
                }}>
                <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                  {melding && !werk && !vraagNu
                    ? <span style={{ width: 30, display: 'flex', justifyContent: 'center' }}>{melding.fout ? <X size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}</span>
                    : <Robotje rustig={!werk && !vraagNu} />}
                  {ergensOngelezen && (
                    <span className="bos-stip" style={{
                      position: 'absolute', top: -1, right: 6, width: 7, height: 7, borderRadius: '50%',
                      background: colors.success, boxShadow: `0 0 6px ${colors.success}`,
                    }} />
                  )}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {werk || (melding && !vraagNu ? melding.tekst : vraagNu ? 'Wacht op jou' : laatst?.tekst || (wachtLijst.length ? 'Gino wacht op jou' : 'Gino is klaar'))}
                </span>
              </button>
              {/* Herhaalknop direct achter het laatste opdrachtresultaat (robot-regel) */}
              {!werk && !(melding && !vraagNu) && !vraagNu && laatst?.tekst && stem.beschikbaar() && (
                <span style={{ display: 'flex', flexShrink: 0, marginLeft: -6 }}>{herhaalKnop(laatst.vol)}</span>
              )}
              {/* Gesprekken: kleine tabjes, groene stip = ongelezen of klaar resultaat */}
              <div role="tablist" aria-label="Gesprekken" className="bos-tabjes" style={{
                display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: '0 1 auto', overflowX: 'auto', marginLeft: 2,
              }}>
                {gesprekken.map((g, gi) => {
                  const aan = g.id === actief.id
                  const staat = tabStatus(g)
                  return (
                    <button key={g.id} role="tab" aria-selected={aan} onClick={() => (aan && open ? setOpen(false) : kiesGesprek(g.id))}
                      title={bezigPer[g.id] ? `${g.naam}: Gino denkt na` : g.naam}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, height: 22, padding: '0 8px', flexShrink: 0,
                        borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: aan ? colors.surface : 'transparent',
                        color: aan ? colors.textPrimary : colors.textMuted, fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap',
                      }}>
                      <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.naam}</span>
                      <TabStatus staat={staat} nu={nu} />
                      {ongelezenPer[g.id] && (
                        <span className="bos-stip" style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: colors.success, boxShadow: `0 0 6px ${colors.success}`,
                        }} />
                      )}
                      {aan && !isVast(g, gi) && (
                        <span role="button" aria-label={`Sluit ${g.naam}`} title="Gesprek sluiten"
                          onClick={e => { e.stopPropagation(); sluitGesprek(g.id) }}
                          style={{ color: colors.textMuted, fontWeight: 800, marginRight: -2 }}>×</span>
                      )}
                    </button>
                  )
                })}
                <button onClick={extraGesprek} title="Extra gesprek" aria-label="Extra gesprek" style={{
                  height: 22, padding: '0 7px', flexShrink: 0, border: 'none', borderRadius: 999, background: 'transparent',
                  color: colors.textMuted, fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
                }}>+</button>
              </div>
              <span onClick={() => setOpen(o => !o)} style={{ flex: 1, alignSelf: 'stretch', cursor: 'pointer' }} />
              {/* Mac/API + herstart: rechts op de hoogte van het poppetje */}
              <button onClick={wisselRoute}
                title={route === 'api' ? 'Via de API. Klik: via je Mac'
                  : paOnline ? 'Via je Mac (Claude-abonnement). Klik: via de API'
                  : 'Mac gekozen, maar de PA draait niet: gaat nu via de API. Klik: altijd API'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 2px', flexShrink: 0,
                  fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', border: 'none',
                  color: viaMac || route === 'api' ? colors.textSecondary : colors.textMuted, fontFamily: 'inherit',
                }}>
                <span className={herstart ? 'bos-stip' : undefined} style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: viaMac ? colors.success : route === 'api' ? colors.textPrimary : colors.danger,
                  boxShadow: viaMac ? `0 0 6px ${colors.success}88` : 'none',
                }} />
                {!isMobile && (herstart ? 'Herstart' : route === 'api' ? 'API' : paOnline ? 'Mac' : 'Mac uit')}
              </button>
              {route === 'mac' && (
                <button onClick={herstartPa} disabled={herstart || ergensBezig} title="PA op je Mac herstarten en scherm verversen"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 26, padding: 0, flexShrink: 0,
                    background: 'transparent', border: 'none', cursor: herstart || ergensBezig ? 'default' : 'pointer',
                    color: colors.textMuted, opacity: ergensBezig ? 0.4 : 1,
                  }}>
                  <RotateCw size={12} strokeWidth={2.5} className={herstart ? 'bos-draai' : undefined} />
                </button>
              )}
            </div>
            {wachtLijst.map(w => (
              <div key={w.sleutel} style={{ display: 'flex', alignItems: 'center', gap: 8, height: WACHT_RIJ_H, minWidth: 0, paddingLeft: 38 }}>
                <span title={w.tekst} style={{
                  flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: '0.74rem', fontWeight: 700, color: colors.textPrimary,
                }}>
                  Ik wacht op jou: {w.tekst}
                </span>
                <button onClick={w.onGedaan} disabled={w.bezig} style={{ ...KNOP, minHeight: 24, padding: '0 10px', fontSize: '0.72rem', flexShrink: 0 }}>
                  Gedaan
                </button>
              </div>
            ))}
          </div>
          {wolkZichtbaar && (
            <Vraagwolk key={vraagNu.sleutel} voorstel={vraagNu.ac} nr={1} totaal={openVoorstellen.length} extraHoogte={wachtLijst.length * WACHT_RIJ_H}
              staat={actieStaat[vraagNu.sleutel]}
              onToestaan={() => toestaan(vraagNu.t, vraagNu.i, vraagNu.j)} onNee={() => afwijzen(vraagNu.t, vraagNu.i, vraagNu.j)} />
          )}
          {sleept && (
            <div style={{
              position: 'absolute', inset: -4, zIndex: 6, borderRadius: 24, pointerEvents: 'none',
              border: `2px dashed ${colors.success}`, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: colors.success, fontWeight: 800, fontSize: '0.85rem',
            }}>
              <ImagePlus size={18} strokeWidth={2.5} /> Laat los om te versturen
            </div>
          )}
          <div style={{
            background: colors.surface, borderRadius: 22, padding: 2,
            border: `1px solid ${luistert ? colors.danger + '80' : 'transparent'}`,
          }}>
            {bijlagen.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '10px 12px 4px' }}>
                {bijlagen.map((b, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={b.thumb} alt="Screenshot om mee te sturen" style={{ display: 'block', height: 52, borderRadius: 8 }} />
                    <button onClick={() => setBijlagen(l => l.filter((_, li) => li !== i))} title="Weghalen" style={{
                      position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%',
                      border: 'none', background: colors.textPrimary, color: colors.onAccent, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                    }}>
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <PaInloggen zichtbaar={route === 'mac' && !paOnline} onKlaar={() => { setPaOnline(true); meld('PA weer ingelogd') }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
              <textarea
                ref={veld}
                value={invoer}
                onChange={e => { stem.stop(); setInvoer(e.target.value); bewerktTijdensLuisteren() }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stuur(); return }
                  bewerktTijdensLuisteren()
                }}
                onBeforeInput={bewerktTijdensLuisteren}
                onSelect={e => { if (e.target.selectionStart !== e.target.selectionEnd) bewerktTijdensLuisteren() }}
                onPaste={plak}
                placeholder={luistert ? 'Luistert… praat maar' : isEditor(actief) ? 'Opdracht voor ChatGPT (editor)' : 'Geef een taak of plak een screenshot'}
                rows={1}
                style={{
                  flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.35, padding: '9px 0 9px 4px',
                  minHeight: 36, maxHeight: INVOER_MAX_H, overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              {/* Snel/Slim + nieuw gesprek: klein, rechts in dezelfde balk (Snel/Slim niet in Editor) */}
              {!isEditor(actief) && <button onClick={wisselModus}
                title={modus === 'slim'
                  ? (viaMac ? 'Slim: Opus, kent CLAUDE.md en memory, onthoudt dit gesprek. Trager (10-30 s). Klik: Snel' : 'Slim werkt alleen via je Mac; nu gaat het via de API (Snel). Klik: Snel')
                  : 'Snel: kort en vlot. Klik: Slim (Opus, denkt langer na)'}
                style={{
                  display: 'flex', alignItems: 'center', height: 40, padding: '0 4px', flexShrink: 0,
                  fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', border: 'none',
                  color: modus === 'slim' ? (viaMac ? colors.success : colors.textMuted) : colors.textSecondary, fontFamily: 'inherit',
                }}>
                {modus === 'slim' ? 'Slim' : 'Snel'}
              </button>}
              {!isEditor(actief) && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setToonEerder(x => !x)} title="Eerdere gesprekken terughalen"
                    style={{ ...rondeKnop, width: 32, background: 'transparent', color: colors.textSecondary }}>
                    <History size={16} strokeWidth={2.2} />
                  </button>
                  {toonEerder && <EerdereGesprekken huidig={actief.sessie} onSluit={() => setToonEerder(false)}
                    onKies={(berichten, gid) => {
                      setToonEerder(false)
                      stem.stop()
                      wijzigTabje(actief.id, g => ({ ...g, berichten, sessie: gid }))
                      setFout(null)
                    }} />}
                </div>
              )}
              {gesprek.length > 0 && (
                <button onClick={leegGesprek} title={`Nieuw gesprek in ${actief.naam}`}
                  style={{ ...rondeKnop, width: 32, background: 'transparent', color: colors.textSecondary }}>
                  <SquarePen size={16} strokeWidth={2.2} />
                </button>
              )}
              <input ref={kiezer} type="file" accept="image/*" multiple hidden
                onChange={e => { neemBeelden(e.target.files); e.target.value = '' }} />
              {!isEditor(actief) && (
                <button onClick={() => kiezer.current?.click()} title="Screenshot meesturen"
                  style={{ ...rondeKnop, background: 'transparent', color: colors.textSecondary }}>
                  <ImagePlus size={18} strokeWidth={2.2} />
                </button>
              )}
              {Spraak && (
                <button
                  onClick={microfoon}
                  title={luistert ? 'Stop met luisteren' : 'Inspreken'}
                  style={{
                    ...rondeKnop,
                    background: luistert ? colors.danger : 'transparent',
                    color: luistert ? colors.textPrimary : colors.textSecondary,
                    animation: luistert ? 'bos-mic 1.2s ease-in-out infinite' : 'none',
                  }}
                >
                  <Mic size={18} strokeWidth={2.5} />
                </button>
              )}
              {kanStoppen && !kanSturen ? (
                <button
                  onClick={stop}
                  title={bezig ? 'Stop Gino' : 'Stop de code-opdracht'}
                  aria-label={bezig ? 'Stop Gino' : 'Stop de code-opdracht'}
                  style={{ ...rondeKnop, background: colors.textPrimary, color: colors.onAccent, cursor: 'pointer' }}
                >
                  <span style={{ width: 13, height: 13, borderRadius: 3, background: 'currentColor', display: 'block' }} />
                </button>
              ) : (
                <button
                  onClick={stuur}
                  disabled={!kanSturen}
                  title="Verstuur"
                  style={{
                    ...rondeKnop,
                    background: kanSturen ? colors.textPrimary : 'rgba(255,255,255,0.15)',
                    color: colors.onAccent, cursor: kanSturen ? 'pointer' : 'default',
                  }}
                >
                  <ArrowUp size={18} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>

        {fout && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.danger, margin: '4px 4px 0' }}>{fout}</div>}
      </div>
    </div>
  )
}
