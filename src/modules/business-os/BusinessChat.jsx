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
// resultaat en spreken het hele resultaat of de korte kern uit, volgens 'Alles
// voorlezen' in het puntjes-menu (31 okt, met daaronder het ElevenLabs-tegoed); open "Ik wacht op jou"-acties staan
// eronder met elk een Gedaan-knop, plus de ElevenLabs-sleutelactie zolang
// gino-stem 503 geen_sleutel geeft. Versturen breekt de spraakherkenning af en
// negeert late resultaten, zodat het veld leeg blijft.
// Bijlagen (31 okt): paperclip naast de invoer of slepen; pdf/csv/Excel/txt/heic
// gaan als chipje mee, worden bij versturen geüpload en komen als [bijlage]-regel
// bij Gino op de Mac (zie uploadBijlagen). Alleen via de Mac-route.
// Editor (30 okt): vast tabje na Code/Strategie dat via edge function editor-chat
// met ChatGPT (OpenAI API) praat, alleen tekst (geen Mac-route, geen screenshots).
// Opdrachten met status bovenaan het venster (business-os-editor.sql).

import { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUp, Copy, Check, Mic, Lock, Database, Laptop, ImagePlus, X, SquarePen, History, MoreHorizontal, RotateCw, Volume2, Eye, ThumbsUp, ThumbsDown, Paperclip, FileText, ChevronDown, ShieldCheck, Minimize2, Maximize2, PanelRightClose, StickyNote } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { waNummer } from './berichtTekst'
import { colors } from '../../ui/tokens'
import useIsMobile from '../../hooks/useIsMobile'
import * as stem from './stem'
import { bewaarOordeel } from './feedback'
import { BewaarKnop } from './schermen'
import VastzetKnop from './VastzetKnop'
import { ToestemmingKaarten, ToestemmingRegels } from './GinoToestemmingen'
import { useNieuweVersie } from './useNieuweVersie'
import { contentUitHash, openContent } from './contentStatusData'

const KEY = 'business_os_chat'
// Mac telt als aan als de PA zich < 2 min geleden meldde (zelfde regel als het
// Mac-lampje in BusinessOS.jsx). Hartslag is elke 15 s; pakt de Mac een vraag
// toch niet op, dan valt hij na 25 s terug op de API.
const PA_ONLINE_MS = 2 * 60 * 1000
const ORANJE = '#f59e0b' // alleen voor de API-waarschuwing (kost geld)
const MAX_BEELDEN = 10 // zoveel recente screenshots gaan mee naar de AI (de PA pakt er net zoveel)
const INVOER_MAX_H = 130 // ~6 regels
const WACHT_RIJ_H = 28 // rij in het wacht-op-jou-lijstje onder de statusregel
const STATUS_GAT = 6 // vaste ruimte tussen statusregel en invoerveld (en in BusinessOS/GinoKalender tussen de rijen)
const opdrachtKop = (w) => String(w.opdracht || '').split('\n')[0].replace(/^Onderwerp:\s*/i, '')
const duurSinds = (w) => {
  const min = Math.max(0, Math.round((Date.now() - new Date(w.gestart_at || w.created_at).getTime()) / 60000))
  return duurTekst(min)
}
const duurTekst = (min) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)} u ${min % 60} min`)
const slaap = (ms) => new Promise(r => setTimeout(r, ms))

const TEKST = { fontSize: '0.78rem', lineHeight: 1.4 }
const KNOP = {
  background: colors.textPrimary, color: colors.onAccent, border: 'none', borderRadius: 10,
  padding: '0 12px', minHeight: 36, fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
}
const KNOP_RAND = { ...KNOP, background: 'transparent', color: colors.textPrimary, border: `1px solid ${colors.borderSubtle}` }
const KAART = { margin: '2px 0 6px', fontSize: '0.76rem', lineHeight: 1.35 }
const KAART_KOP = { display: 'flex', gap: 6, alignItems: 'center', fontWeight: 800, marginBottom: 2 }

// Mac/API-aanduiding boven de Gino-bol (6 nov): geen container, alleen bolletje
// + Mac/API. BusinessOS geeft het vak boven de bol (macPlek.el), wij portalen erin.
// Groen + Mac = via de Mac, gratis. Oranje + API = kost geld. Tik (44 px) = korte
// uitleg met laatst gezien, verversen en de Mac/API-keuze.
function MacPil({ viaMac, route, paOnline, gezien, herstart, kanHerstarten, onHerstart, onWissel, isMobile, links }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const buiten = (e) => { if (!e.target.closest?.('[data-mac-pil]')) setOpen(false) }
    const t = setTimeout(() => setOpen(false), 8000)
    document.addEventListener('pointerdown', buiten)
    return () => { clearTimeout(t); document.removeEventListener('pointerdown', buiten) }
  }, [open])
  const kleur = viaMac ? colors.success : ORANJE
  const tijd = gezien ? new Date(gezien).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : null
  const regel = viaMac ? 'Mac aan, gratis' : paOnline && route === 'api' ? 'API gekozen, dit kost geld' : 'Mac uit, dit kost geld via de API'
  const knop = { ...KNOP_RAND, minHeight: isMobile ? 44 : 32, fontSize: '0.74rem', display: 'inline-flex', alignItems: 'center', gap: 6 }
  return (
    <div data-mac-pil style={{ position: 'relative', display: 'flex', justifyContent: 'center', height: 16 }}>
      {/* Tikvlak 44 px hoog, zichtbaar alleen bolletje + tekst; steekt boven en onder uit zonder ruimte te kosten. */}
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o) }} aria-expanded={open} aria-label={regel}
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          height: 44, minWidth: 56, padding: '0 6px', whiteSpace: 'nowrap',
          background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          color: colors.textPrimary, fontSize: 10.5, fontWeight: 800, lineHeight: 1,
        }}>
        <span className={herstart ? 'bos-stip' : undefined} style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: kleur, boxShadow: `0 0 6px ${kleur}88`,
        }} />
        {herstart ? 'Herstart' : viaMac ? 'Mac' : 'API'}
      </button>
      {open && (
        <div role="status" style={{
          position: 'absolute', bottom: '100%', marginBottom: 14, zIndex: 9,
          ...(links ? { left: 0 } : { left: '50%', transform: 'translateX(-50%)' }),
          width: 'max-content', maxWidth: '86vw', display: 'flex', flexDirection: 'column', gap: 10, padding: 14, boxSizing: 'border-box',
          background: colors.surface, border: `1px solid ${colors.borderSubtle}`, borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 900, color: viaMac ? colors.textPrimary : ORANJE, lineHeight: 1.35 }}>
            {regel}
            <div style={{ marginTop: 2, fontSize: '0.74rem', fontWeight: 700, color: colors.textSecondary }}>
              {tijd ? `Laatst gezien ${tijd}` : 'Nog niet gezien'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onHerstart} disabled={herstart || !kanHerstarten} title="PA op je Mac herstarten en scherm verversen"
              style={{ ...knop, opacity: herstart || !kanHerstarten ? 0.4 : 1, cursor: herstart || !kanHerstarten ? 'default' : 'pointer' }}>
              <RotateCw size={13} strokeWidth={2.5} className={herstart ? 'bos-draai' : undefined} /> Verversen
            </button>
            <button type="button" onClick={onWissel} style={knop}>
              {route === 'api' ? 'Via Mac' : 'Altijd API'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
const KAART_SUB = { color: colors.textSecondary, fontWeight: 600, marginBottom: 6 }

// Bijlagen (31 okt): bestanden (pdf, csv, Excel, txt, foto's) gaan naar de
// private bucket business-os-bijlagen/<uid>/<uuid>-<naam>; het bericht krijgt per
// bestand een vaste [bijlage]-regel die Gino op de Mac met
// `node scripts/pa-db.mjs bijlage <pad>` ophaalt. Na 7 dagen ruimt pg_cron ze op.
// Screenshots (png/jpg geplakt of gesleept) blijven de oude beeld-route.
const BIJLAGE_BUCKET = 'business-os-bijlagen'
const BIJLAGE_MAX = 20 * 1024 * 1024
const BIJLAGE_TYPES = {
  pdf: 'application/pdf', csv: 'text/csv', txt: 'text/plain',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', xls: 'application/vnd.ms-excel',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', heic: 'image/heic',
}
const BIJLAGE_ACCEPT = 'image/*,' + Object.keys(BIJLAGE_TYPES).map(e => '.' + e).join(',')
const extVan = (naam) => (String(naam).match(/\.([a-z0-9]+)$/i)?.[1] || '').toLowerCase()
const grootteTekst = (b) => b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
const BIJLAGE_REGEL = /^\[bijlage\] (.+?) \| (\S+) \| (\S+) \| (.+)$/

// Uploaden; geeft [{ naam, pad, type, grootte }] of gooit met een korte melding.
async function uploadBijlagen(bestanden) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Niet ingelogd')
  const uit = []
  for (const b of bestanden) {
    const naam = b.naam.replace(/[^\w.\- ()]+/g, '_').slice(-120)
    const pad = `${user.id}/${crypto.randomUUID()}-${naam}`
    const { error } = await supabase.storage.from(BIJLAGE_BUCKET)
      .upload(pad, b.file, { contentType: b.type, upsert: false })
    if (error) throw new Error(`${b.naam} kon niet worden geüpload`)
    uit.push({ naam: b.naam, pad: `${BIJLAGE_BUCKET}/${pad}`, type: b.type, grootte: grootteTekst(b.grootte) })
  }
  return uit
}

// Gebruikersbericht: [bijlage]-regels als rustig chipje, de rest als tekst.
function BerichtTekst({ tekst }) {
  const regels = String(tekst || '').split('\n')
  const bij = regels.map(r => r.match(BIJLAGE_REGEL)).filter(Boolean)
  if (!bij.length) return tekst
  return (
    <>
      {regels.filter(r => !BIJLAGE_REGEL.test(r)).join('\n').trim()}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
        {bij.map((m, i) => (
          <span key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
            <Paperclip size={12} strokeWidth={2.6} /> {m[1]} <span style={{ color: colors.textMuted, fontWeight: 700 }}>{m[4]}</span>
          </span>
        ))}
      </div>
    </>
  )
}

// Vraag via de lokale PA. Geeft { tekst, acties } of null (Mac pakte hem niet op).
// Vraag via de PA op de Mac. Realtime geeft elke wijziging van de rij meteen
// door (ook de halve tekst tijdens het typen → opDeel); pollen elke 2 s blijft
// als vangnet. null = niet gelukt, dan gaat de vraag via de API.
// extra = { modus: 'snel' | 'slim', gesprek_id } (Slim hervat per gesprek een sessie).
// signaal = { id, gestopt }: de stopknop zet gestopt; dan { gestopt: true } terug.
async function vraagViaMac(berichten, context, opDeel, extra = {}, signaal = {}, bijlagen = []) {
  const { data: rij, error } = await supabase.from('business_os_opdrachten')
    .insert({
      soort: 'chat', opdracht: berichten[berichten.length - 1].content.slice(0, 500), invoer: { berichten, context, ...extra },
      ...(bijlagen.length ? { bijlagen } : {}),
    })
    .select('id').single()
  if (error) return null
  signaal.id = rij.id
  return wachtOpRij(rij.id, opDeel, signaal, { intrekken: true })
}

// Wachten op een chatrij van de PA. Ook gebruikt na terugkomen in Business OS
// (de vraag liep door terwijl het scherm dicht was): dan zonder intrekken.
async function wachtOpRij(id, opDeel, signaal = {}, { intrekken = false, start = Date.now() } = {}) {
  const rij = { id }
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
    let grens = start + 11 * 60 * 1000
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
      if (intrekken && data?.status === 'wacht' && Date.now() - start > 25000) {
        // Niet opgepakt: intrekken (alleen als hij nog op 'wacht' staat) en via de API.
        const { data: ingetrokken } = await supabase.from('business_os_opdrachten')
          .update({ status: 'mislukt' }).eq('id', rij.id).eq('status', 'wacht').select('id')
        if (ingetrokken?.length) return null
      }
      if (Date.now() > grens) {
        // Wacht de chat op een knop van Kersten (max 30 min)? Dan niet naar de API.
        const { count } = await supabase.from('business_os_toestemmingen')
          .select('id', { count: 'exact', head: true }).eq('opdracht_id', rij.id).eq('status', 'wacht')
          .then(r => r, () => ({ count: 0 }))
        if (!count) return null
        grens = Date.now() + 11 * 60 * 1000
      }
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

// Lange antwoorden ingekort tonen (~6 regels) met 'meer' / 'minder'.
// achter: element direct achter de laatste zin (ingeklapt: naast 'meer').
const MAX_REGELS = 6
// Links in Gino's tekst klikbaar (2 nov 2026). Een link naar een post
// (…#business-os:content=<id>, welk domein ook) opent het preview-venster in
// deze sessie: geen nieuw tabblad, dus ook geen inlogpagina. Andere links in
// een nieuw tabblad.
const URL_IN_TEKST = /(https?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?])/g
function MetLinks({ tekst }) {
  if (typeof tekst !== 'string' || !tekst.includes('http')) return tekst
  return tekst.split(URL_IN_TEKST).map((stuk, i) => {
    if (i % 2 === 0) return stuk
    let id = null
    try { id = contentUitHash(new URL(stuk).hash) } catch { /* geen geldige url */ }
    const stijl = { color: colors.success, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 2, wordBreak: 'break-all' }
    if (id) return (
      <a key={i} href={stuk} onClick={e => { e.preventDefault(); openContent(id) }} style={stijl}>Bekijk post</a>
    )
    return <a key={i} href={stuk} target="_blank" rel="noopener noreferrer" style={stijl}>{stuk}</a>
  })
}

// ── Antwoord van Gino netjes tonen, en meelezen met de stem ──
// Sterretjes worden vet, pijltjes een echte lijst, een regel die helemaal vet is een kopje.
const LIJST_REGEL = /^\s*(→|->|=>|•|-|\*(?!\*))\s+/
const KOP_REGEL = /^\s*(?:#{1,6}\s*)?(?:\*\*)?(.+?)(?:\*\*)?\s*$/
const isKop = (r) => /^\s*#{1,6}\s/.test(r) || /^\s*\*\*[^*]+\*\*:?\s*$/.test(r)

// **vet** eruit: de platte tekst plus welke stukken vet zijn.
function leesVet(regel) {
  let plat = ''
  const vet = []
  regel.split('**').forEach((stuk, i) => {
    if (i % 2 === 1 && stuk) vet.push([plat.length, plat.length + stuk.length])
    plat += stuk
  })
  return { plat, vet }
}

// Elke regel in zinnen, met waar die zin in de uitgesproken tekst zit.
function ontleedAntwoord(tekst) {
  return String(tekst || '').split(/\n\s*\n/).filter(b => b.trim()).map((blok) => ({
    blok,
    regels: blok.split('\n').filter(r => r.trim()).map((ruw) => {
      const kop = isKop(ruw)
      const lijst = !kop && LIJST_REGEL.test(ruw)
      const inhoud = kop ? ruw.match(KOP_REGEL)[1].replace(/^\**|\**:?$/g, '') : ruw.replace(LIJST_REGEL, '')
      const { plat, vet } = leesVet(inhoud)
      const zinnen = [...plat.matchAll(/.+?(?:[.!?…]+(?=\s|$)|$)/g)].map(m => ({ van: m.index, tot: m.index + m[0].length }))
      return { kop, lijst, plat, vet, zinnen }
    }),
  }))
}

// Zoekt de zinnen op in de uitgesproken tekst. Telt alleen als dit bericht het grootste deel
// is van wat er gezegd wordt; anders leest hij een ander bericht voor.
function plaatsInSpraak(blokken, schoon) {
  const plek = new Map()
  let vanaf = 0, gevonden = 0
  blokken.forEach((b, bi) => b.regels.forEach((r, ri) => r.zinnen.forEach((z, zi) => {
    const zin = stem.spreekbaar(r.plat.slice(z.van, z.tot)).replace(/[.!?:;…]+$/, '')
    if (zin.length < 2) return
    const i = schoon.indexOf(zin, vanaf)
    if (i < 0) return
    plek.set(`${bi}-${ri}-${zi}`, [i, i + zin.length])
    vanaf = i + zin.length
    gevonden += zin.length
  })))
  return gevonden >= schoon.length * 0.6 ? plek : null
}

function ZinTekst({ regel, zin, actief, actiefRef }) {
  const stukken = []
  let p = zin.van
  for (const [v, t] of regel.vet) {
    if (t <= p || v >= zin.tot) continue
    if (v > p) stukken.push([regel.plat.slice(p, v), false])
    stukken.push([regel.plat.slice(Math.max(v, p), Math.min(t, zin.tot)), true])
    p = Math.min(t, zin.tot)
  }
  if (p < zin.tot) stukken.push([regel.plat.slice(p, zin.tot), false])
  return (
    <span ref={actief ? actiefRef : null} style={actief ? { background: 'rgba(16,185,129,0.28)', color: '#fff', borderRadius: 4, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone', padding: '1px 2px', margin: '0 -2px' } : undefined}>
      {stukken.map(([t, vet], i) => (vet
        ? <strong key={i} style={{ fontWeight: 800, color: '#fff' }}><MetLinks tekst={t} /></strong>
        : <MetLinks key={i} tekst={t} />))}
    </span>
  )
}

function GinoTekst({ tekst, sleutel, praatBron, onLees, actieveZin, plek, actiefRef }) {
  const blokken = useMemo(() => ontleedAntwoord(tekst), [tekst])
  return blokken.map((b, bi) => {
    const bron = `alinea-${sleutel}-${bi}`
    const praat = praatBron === bron
    return (
      <div key={bi} style={{ marginTop: bi ? '0.85em' : 0 }}>
        {b.regels.map((r, ri) => (
          <div key={ri} style={{
            display: r.lijst ? 'flex' : 'block', gap: 7, marginTop: ri ? (r.kop ? '0.5em' : '0.3em') : 0,
            ...(r.kop ? { fontWeight: 900, color: '#fff', fontSize: '1.03em' } : null),
          }}>
            {r.lijst && <span aria-hidden style={{ color: colors.success, fontWeight: 800, flexShrink: 0 }}>→</span>}
            <span style={{ minWidth: 0 }}>
              {r.zinnen.map((z, zi) => <ZinTekst key={zi} regel={r} zin={z} actief={!!plek && actieveZin === `${bi}-${ri}-${zi}`} actiefRef={actiefRef} />)}
              {ri === 0 && onLees && blokken.length > 1 && b.blok.trim().length >= MIN_VOORLEES && (
                <button type="button" onClick={() => onLees(b.blok, bron)} title={praat ? 'Stop' : 'Lees dit stuk voor'} aria-label={praat ? 'Stop' : 'Lees dit stuk voor'} style={{
                  background: 'none', border: 'none', padding: '0 4px', marginLeft: 2, cursor: 'pointer',
                  display: 'inline-flex', verticalAlign: '-2px', color: praat ? colors.success : colors.textSecondary,
                }}>
                  <Volume2 size={13} className={praat ? 'bos-stip' : undefined} />
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    )
  })
}
const MIN_VOORLEES = 25
const ALINEA_STIJL = { fontSize: '0.86rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.88)' }

// Zelfde opmaak als een antwoord in de chat, buiten de chat (Notities).
export function OpmaakTekst({ tekst, sleutel }) {
  return (
    <div style={{ ...ALINEA_STIJL, whiteSpace: 'normal', wordBreak: 'break-word' }}>
      <GinoTekst tekst={tekst} sleutel={sleutel} />
    </div>
  )
}

function Inkort({ tekst, achter, alineas = null }) {
  const ref = useRef(null)
  const [lang, setLang] = useState(false)
  const [openGezet, setOpen] = useState(false)
  // Meelezen: wordt dit bericht voorgelezen, welke zin is aan de beurt?
  const positie = stem.useVoorleesPositie()
  const blokken = useMemo(() => (alineas ? ontleedAntwoord(tekst) : null), [alineas ? tekst : null]) // eslint-disable-line react-hooks/exhaustive-deps
  const plek = useMemo(() => (blokken && positie?.schoon ? plaatsInSpraak(blokken, positie.schoon) : null), [blokken, positie?.schoon])
  let actieveZin = null
  if (plek) for (const [k, [, t]] of plek) { if (positie.at < t) { actieveZin = k; break } }
  // Tijdens voorlezen staat het hele bericht open, anders valt de zin weg onder "meer".
  const open = openGezet || !!plek
  const actiefRef = useRef(null)
  useEffect(() => {
    if (actieveZin) actiefRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [actieveZin])
  useLayoutEffect(() => {
    const el = ref.current
    if (el && !open) setLang(el.scrollHeight > el.clientHeight + 2)
  }, [tekst, open])
  return (
    <>
      <div ref={ref} style={{
        whiteSpace: alineas ? 'normal' : 'pre-wrap', wordBreak: 'break-word',
        ...(alineas ? ALINEA_STIJL : null),
        ...(open ? {} : { maxHeight: `${MAX_REGELS * 1.4}em`, overflow: 'hidden' }),
      }}>
        {alineas ? <GinoTekst tekst={tekst} {...alineas} actieveZin={actieveZin} plek={plek} actiefRef={actiefRef} /> : <MetLinks tekst={tekst} />}
        {achter && (open || !lang) && achter}
      </div>
      {(lang || openGezet) && !plek && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button onClick={() => setOpen(o => !o)} style={{
            background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', fontFamily: 'inherit',
            color: colors.success, fontWeight: 800, fontSize: '0.75rem',
          }}>
            {openGezet ? 'minder' : 'meer'}
          </button>
          {lang && !openGezet && achter}
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

// Toestaan-knop op een bewaakt voorstel. Gewone wijzigingen doet de server al zelf
// (PA / edge function, RPC business_os_wijziging_uitvoeren); deze klik is de enige
// plek met bevestigd = true. Draait met Kerstens eigen rechten (RLS).
async function voerWijzigingUit(voorstel) {
  const { data, error } = await supabase.rpc('business_os_wijziging_uitvoeren', { p_voorstel: voorstel, p_bevestigd: true })
  if (error?.code === 'PGRST202') return voerWijzigingDirect(voorstel) // SQL nog niet gedraaid
  if (error) return { fout: 'Mislukt: ' + error.message }
  if (data?.status !== 'uitgevoerd') return { fout: 'Mislukt: ' + (data?.fout || data?.reden || 'onbekende fout') }
  return { veld: { uitgevoerd: true, wijziging_id: data.wijziging_id, aantal: data.aantal, ongedaan_kan: data.ongedaan_kan || null } }
}

async function voerWijzigingDirect(voorstel) {
  if (voorstel.actie !== 'insert' && !voorstel.filters?.length) return { fout: 'Mislukt: een update zonder filter mag niet' }
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

// Ongedaan maken: oude waarden terug of rij gemarkeerd, de RPC bepaalt wat kan.
async function draaiWijzigingTerug(voorstel) {
  const { data, error } = await supabase.rpc('business_os_wijziging_ongedaan', { p_id: voorstel.wijziging_id })
  if (error) return { fout: 'Ongedaan maken mislukt: ' + error.message }
  if (data?.status === 'al_ongedaan') return { veld: { ongedaan: true, ongedaan_tekst: 'Was al ongedaan gemaakt' } }
  if (data?.status !== 'ongedaan') return { fout: 'Ongedaan maken lukte niet: ' + (data?.reden || data?.fout || 'onbekende fout') }
  return { veld: { ongedaan: true, ongedaan_tekst: data.overgeslagen ? `${data.hersteld} teruggezet, ${data.overgeslagen} overgeslagen (intussen veranderd)` : 'Ongedaan gemaakt' } }
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
const staatOpen = (ac) => !!ac && !!VOER_UIT[ac.soort] && !ac.uitgevoerd && !ac.opdrachtId && !ac.afgewezen && !ac.afgehandeld && !ac.mislukt

const waardeTekst = (v) => v === null ? 'leeg' : typeof v === 'object' ? JSON.stringify(v) : String(v)
const wijzigingRegels = (v) => v.actie === 'insert'
  ? [`${v.aantal} nieuwe rij(en) in ${v.tabel}`]
  : [
      `${v.aantal} rij(en) in ${v.tabel} waar ${(v.filters || []).map(f => `${f.kolom} ${f.op} ${waardeTekst(f.waarde)}`).join(' en ')}`,
      `→ ${Object.entries(v.velden || {}).map(([k, w]) => `${k} = ${waardeTekst(w)}`).join(', ')}`,
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
// Transcript als bijlage of geplakt in het Klanten-tabje (6 nov 2026).
const TRANSCRIPT_BESTAND = /transcript|zoom|\.vtt$|gesprek|call|meeting/i
const TRANSCRIPT_HINT = 'Is dit een call-transcript: verwerk het met de skill Call verwerken (klant) of Na salescall (prospect), en geef bij het appje (bewerkbaar_bericht) client_id of lead_id mee.'
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
// Eén tabje per naam (6 nov): een tweede apparaat maakte eigen Code/Strategie/
// Editor/Klanten met nieuwe id's; die kwamen via 'lokaal met berichten erachter'
// ook in de database, dus stond Code er twee keer. Dubbelen worden hier
// samengevoegd in het eerste tabje: berichten op tijd (op) gesorteerd en
// ontdubbeld, sessie van het laatst gebruikte. De oude rijen blijven in de
// database staan (niets weg); samen = hun id's, voor het actieve tabje.
const berichtSleutel = (b) => `${b?.op || ''}|${b?.role || ''}|${String(b?.content ?? '').slice(0, 80)}`
const laatsteOp = (g) => Math.max(g.bijgewerkt || 0, ...g.berichten.map(b => b?.op || 0))
const eenPerNaam = (gs) => {
  const perNaam = new Map()
  gs.forEach(g => { const k = (g.naam || '').trim().toLowerCase(); perNaam.set(k, [...(perNaam.get(k) || []), g]) })
  if ([...perNaam.values()].every(l => l.length === 1)) return gs
  return gs.flatMap(g => {
    const groep = perNaam.get((g.naam || '').trim().toLowerCase())
    if (groep[0] !== g) return []
    if (groep.length === 1) return [g]
    const gezien = new Set()
    const berichten = groep.flatMap(x => x.berichten)
      .filter(b => { const s = berichtSleutel(b); if (gezien.has(s)) return false; gezien.add(s); return true })
      .map((b, i) => ({ b, i })).sort((a, z) => ((a.b?.op || 0) - (z.b?.op || 0)) || (a.i - z.i)).map(x => x.b)
    const recent = groep.reduce((a, x) => (laatsteOp(x) > laatsteOp(a) ? x : a))
    const samen = [...new Set([...(g.samen || []), ...groep.slice(1).flatMap(x => [x.id, ...(x.samen || [])])])]
    // bijgewerkt blijft die van het eerste tabje: samenvoegen schrijft zelf niets
    // weg (opslaan houdt de laatste 40), pas een nieuw bericht doet dat.
    return [{ ...g, berichten, sessie: recent.sessie, samen }]
  })
}
const metEditor = (gs, lokaal = []) => metKlanten(metEditorAlleen(eenPerNaam(gs), lokaal), lokaal)
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

// Afgewezen voorstellen uit alle tabjes (nieuwste eerst) gaan mee in de context,
// bovenaan zodat de afkapgrens ze niet raakt. Ook nodig voor een hervat Slim-gesprek,
// want dat krijgt alleen de nieuwe vraag en ziet de status op de kaart niet.
// De sleutel is de instructie: zo werkt het op de Mac én via de API.
const AFGEWEZEN_KOP = 'Afgewezen voorstellen (Kersten zei nee en er is niets uitgevoerd. Behandel ze niet als open en stel ze niet opnieuw voor, tenzij hij er zelf om vraagt)'
const afgewezenVoorstellen = (gesprekken, max = 10) => gesprekken
  .flatMap(g => g.berichten.flatMap(b => (b.role !== 'assistant' ? [] : b.acties || [])
    .filter(ac => ac && typeof ac === 'object' && ac.afgewezen && VOER_UIT[ac.soort])
    .map(ac => ({ ac, op: b.op || 0 }))))
  .sort((a, b) => b.op - a.op)
  .slice(0, max)
  .map(({ ac }) => { const v = vraagVoor(ac); return v.kort ? `${v.vraag} (${v.kort})` : v.vraag })
const metAfgewezen = (context, gesprekken) => {
  const lijst = afgewezenVoorstellen(gesprekken)
  return lijst.length ? { [AFGEWEZEN_KOP]: lijst, ...context } : context
}

// Dichtgeklapte kaart na Afwijzen: alleen dit regeltje, de rest van de kaart is weg.
const Afgewezen = () => (
  <div style={{ ...KAART, display: 'flex', gap: 5, alignItems: 'center', color: colors.textSecondary, fontWeight: 800 }}>
    <X size={12} /> Afgewezen
  </div>
)

// Knoppen van een open voorstel. Afwijzen voert niets uit, het zet alleen de status.
function VoorstelKnoppen({ tekst, bezig, onToestaan, onAfwijzen }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <button onClick={onToestaan} disabled={bezig} style={KNOP}>{tekst}</button>
      <button onClick={onAfwijzen} disabled={bezig} style={KNOP_RAND}>Afwijzen</button>
    </div>
  )
}

// Voorstel van de AI om accounts op slot te zetten of te ontgrendelen.
function SlotVoorstel({ voorstel, staat, onToestaan, onAfwijzen }) {
  const { bezig, fout } = staat || {}
  const opSlot = voorstel.actie === 'op_slot'
  if (voorstel.afgewezen && !voorstel.uitgevoerd) return <Afgewezen />
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
      ) : (
        <VoorstelKnoppen bezig={bezig} onToestaan={onToestaan} onAfwijzen={onAfwijzen}
          tekst={bezig ? 'Bezig…' : opSlot ? `Zet ${voorstel.klanten.length} op slot` : `Ontgrendel ${voorstel.klanten.length}`} />
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 4 }}>{fout}</div>}
    </div>
  )
}

// Wijziging van de AI: gewone gaan direct (kaart met uitkomst en Ongedaan maken),
// bewaakte houden de knop Toestaan met de reden erbij. Beslist door de server.
function WijzigingVoorstel({ voorstel, staat, onToestaan, onAfwijzen, onOngedaan }) {
  const { bezig, fout } = staat || {}
  const regels = wijzigingRegels(voorstel)
  if (voorstel.afgewezen && !voorstel.uitgevoerd && !voorstel.mislukt) return <Afgewezen />
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Database size={13} /> {voorstel.uitleg}
      </div>
      <div style={{ ...KAART_SUB, wordBreak: 'break-word' }}>
        {regels.map((r, i) => <div key={i}>{r}</div>)}
        {voorstel.reden && !voorstel.uitgevoerd && <div>Vraagt toestemming: {voorstel.reden}</div>}
      </div>
      {voorstel.mislukt ? (
        <div style={{ color: colors.danger, fontWeight: 800 }}>Mislukt, er is niets veranderd: {voorstel.fout}</div>
      ) : voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
            <Check size={14} /> Uitgevoerd
          </span>
          {voorstel.ongedaan ? (
            <span style={{ color: colors.textSecondary, fontWeight: 800 }}>{voorstel.ongedaan_tekst || 'Ongedaan gemaakt'}</span>
          ) : voorstel.ongedaan_kan ? (
            <span style={{ color: colors.textSecondary, fontWeight: 600 }}>Ongedaan maken kan niet: {voorstel.ongedaan_kan}</span>
          ) : voorstel.wijziging_id ? (
            <button onClick={onOngedaan} disabled={bezig} style={KNOP_RAND}>
              {bezig ? 'Bezig…' : 'Ongedaan maken'}
            </button>
          ) : null}
        </div>
      ) : (
        <VoorstelKnoppen bezig={bezig} onToestaan={onToestaan} onAfwijzen={onAfwijzen} tekst={bezig ? 'Bezig…' : 'Toestaan'} />
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
function PaVoorstel({ voorstel, staat, onToestaan, onAfwijzen, herhaalKnop }) {
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
  if (voorstel.afgewezen && !id) return <Afgewezen />
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Laptop size={13} /> Code-opdracht
      </div>
      <div style={KAART_SUB}><Inkort tekst={voorstel.tekst} /></div>
      {voorstel.reden && !id && <div style={KAART_SUB}>Vraagt toestemming: {voorstel.reden}</div>}
      {!id ? (
        <VoorstelKnoppen bezig={bezig} onToestaan={onToestaan} onAfwijzen={onAfwijzen} tekst={bezig ? 'Versturen…' : 'Uitvoeren op mijn Mac'} />
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

// Bewerkbaar bericht (bv. het klantappje uit Call-appje): tekst aanpassen en
// kopiëren. Bewerkingen staan per bericht in een Map, zodat ze blijven als het
// venster dicht en weer open gaat; de originele tekst zit in de sleutel, dus
// een nieuw gesprek op dezelfde plek begint schoon.
const bewerkingen = new Map()
const isBewerkbaarBericht = (ac) => ac?.soort === 'bewerkbaar_bericht' && typeof ac.tekst === 'string' && ac.tekst.trim() !== ''

function BewerkbaarBericht({ voorstel, sleutel, vastgezet, onVastzetten }) {
  const origineel = voorstel.tekst
  const key = `${sleutel}|${origineel}`
  const [tekst, setTekst] = useState(() => bewerkingen.get(key) ?? origineel)
  const [klaar, setKlaar] = useState(false)
  const veld = useRef(null)
  useLayoutEffect(() => {
    const el = veld.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [tekst])
  const wijzig = (nieuw) => {
    setTekst(nieuw)
    if (nieuw === origineel) bewerkingen.delete(key)
    else bewerkingen.set(key, nieuw)
  }
  const kopieer = () => navigator.clipboard?.writeText(tekst)
    .then(() => { setKlaar(true); setTimeout(() => setKlaar(false), 1500) }, () => {})
  // Appje na een call (skill Call verwerken, voorstel.client_id): opslaan in het
  // logboek van de klant, naar het klembord en WhatsApp open bij de klant.
  // Versturen doet Kersten zelf (plakken + verzenden).
  // Ook na een salescall: lead_id (call_leads) in plaats van client_id; dan gaat
  // het appje in de lead-notities. opslaan: false (bv. het losse linkje) = alleen
  // klembord + WhatsApp, niets bewaren.
  const klant = UUID.test(voorstel.client_id || '') ? voorstel.client_id : null
  const lead = !klant && UUID.test(voorstel.lead_id || '') ? voorstel.lead_id : null
  const bewaren = voorstel.opslaan !== false
  const [verstuurd, setVerstuurd] = useState(() => bewerkingen.get(`${key}|verstuurd`) === true)
  const [versturen, setVersturen] = useState(false)
  const [waFout, setWaFout] = useState(null)
  const opslaanEnVersturen = async () => {
    if ((!klant && !lead) || versturen || !tekst.trim()) return
    const venster = window.open('', '_blank')
    setVersturen(true); setWaFout(null)
    try {
      await navigator.clipboard?.writeText(tekst).catch(() => {})
      const coach = (await supabase.auth.getSession()).data.session?.user?.id || null
      if (bewaren) {
        const { error } = klant
          ? await supabase.from('client_coaching_logs')
            .insert({ client_id: klant, coach_id: coach, status: 'on_track', category: 'whatsapp', note: tekst.trim() })
          : await supabase.from('lead_notes')
            .insert({ lead_id: lead, coach_id: coach, note_type: 'whatsapp', subject: 'WhatsApp', content: tekst.trim() })
        if (error) throw error
      }
      const { data } = await supabase.from(klant ? 'clients' : 'call_leads').select('phone').eq('id', klant || lead).maybeSingle()
      const nr = waNummer(data?.phone)
      if (nr) { if (venster) venster.location.href = `https://wa.me/${nr}`; else window.location.href = `https://wa.me/${nr}` }
      else { venster?.close(); setWaFout('Opgeslagen en gekopieerd, maar geen telefoonnummer bekend.') }
      bewerkingen.set(`${key}|verstuurd`, true)
      setVerstuurd(true)
    } catch (e) { venster?.close(); setWaFout(`Mislukt: ${e.message}`) }
    setVersturen(false)
  }
  const knop2 = { ...KNOP, background: 'transparent', color: colors.textPrimary, border: '1px solid rgba(255,255,255,.15)' }
  return (
    <div style={{ background: '#0a0a0a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 12, padding: 10, margin: '2px 0 8px' }}>
      <div style={{ ...KAART_KOP, fontSize: '0.8rem', marginBottom: 8 }}>
        {typeof voorstel.titel === 'string' && voorstel.titel ? voorstel.titel : 'Bericht'}
      </div>
      <textarea ref={veld} value={tekst} rows={10} onChange={e => wijzig(e.target.value)} spellCheck={false}
        style={{
          width: '100%', boxSizing: 'border-box', minHeight: 160, resize: 'none', overflow: 'hidden',
          background: 'transparent', color: colors.textPrimary, border: '1px solid rgba(255,255,255,.08)', borderRadius: 8,
          padding: 8, fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.8rem', lineHeight: 1.45, whiteSpace: 'pre-wrap',
        }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <span style={{ color: colors.textSecondary, fontWeight: 600, fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{tekst.length} tekens</span>
        <span style={{ marginRight: 'auto', display: 'flex' }}>
          <VastzetKnop tekst={tekst} titel={typeof voorstel.titel === 'string' ? voorstel.titel : null} vastgezet={vastgezet} onVastzetten={onVastzetten} />
        </span>
        <button type="button" onClick={() => wijzig(origineel)} disabled={tekst === origineel}
          style={{ ...knop2, opacity: tekst === origineel ? 0.4 : 1 }}>Herstel</button>
        <button type="button" onClick={kopieer} style={klant || lead ? knop2 : KNOP}>{klaar ? 'Gekopieerd' : 'Kopieer'}</button>
        {(klant || lead) && (
          <button type="button" onClick={opslaanEnVersturen} disabled={versturen || !tekst.trim()}
            style={{ ...KNOP, background: colors.success, color: '#000', opacity: versturen ? 0.6 : 1 }}>
            {verstuurd ? `${bewaren ? 'Opgeslagen' : 'Geopend'} ✓ Nog eens` : bewaren ? 'Opslaan en versturen' : 'Naar WhatsApp'}
          </button>
        )}
      </div>
      {waFout && <div style={{ color: colors.danger, fontWeight: 700, fontSize: '0.72rem', marginTop: 6 }}>{waFout}</div>}
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

const menuRegel = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 10px', borderRadius: 10, border: 'none',
  background: 'transparent', color: colors.textPrimary, fontSize: '0.84rem', fontWeight: 700, fontFamily: 'inherit',
  cursor: 'pointer', textAlign: 'left',
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
// Statusregel: één regel 12 px / 600 grijs; het kopje (tot de eerste ':' of 'Wacht op jou') wit 800.
function StatusTekst({ tekst }) {
  const t = typeof tekst === 'string' ? tekst : ''
  const m = /^([^:]{2,32}):\s(.*)$/.exec(t) || /^((?:Gino |Ik )?[Ww]acht op jou)(.*)$/.exec(t)
  if (!m) return t
  return <><span style={{ color: colors.textPrimary, fontWeight: 800 }}>{m[1]}</span>{t.startsWith(`${m[1]}: `) ? ': ' : ''}{m[2]}</>
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
// stuurRef: de pagina kan via stuurRef.current(tekst) zelf een vraag sturen (Mijn schermen).
// Vraag over agenda of planning: de echte agenda boven de bol gaat meteen
// open, en een rooster dat Gino zelf tekent wordt dan niet getoond (31 okt:
// Slim bleef ondanks zijn instructies eigen kalenders tekenen).
const AGENDA_VRAAG = /(agenda|kalender|calend|planning|plannen|rooster|afspraken|wat staat er|wat heb ik (vandaag|morgen|deze week|volgende week)|mijn week|hele week|volgende week|weekoverzicht|deze week (gepland|staan|staat))/i
// Omzet, geld, verdeling met Marcel: het omzetscherm.
const OMZET_VRAAG = /(omzet|inkomsten|verdien|uitbetal|verdeling|cashflow|geld binnen|komt (er )?binnen|winst|marcel krijgt)/i
// Gaat het over content (planning, reels, opnemen), dan de contentkalender.
const CONTENT_VRAAG = /(content|reels?|stories|posts?|opnemen|magnets?)/i
// Over zijn tijd/productiviteit: het tijdscherm (Gino's tijdmeter).
const TIJD_VRAAG = /(mijn tijd|tijd (gaat|ging|besteed|kwijt)|waar (gaat|ging) mijn tijd|tijdvreter|productiviteit|productief|uren (achter|besteed|gewerkt)|hoeveel (uur|tijd) (heb|ben|zit))/i

// klein: { aan, wissel, inklappen } voor het sleepbare blokje, of null waar dat niet kan (telefoon).
export default function BusinessChat({ context, onBezig, onVisueel, onKalender, onTab, stuurRef, marginTop = 28, klein = null, vastgezet, onVastzetten, onNotities, beperkt = false, macPlek = null }) {
  // Gesprekken naast elkaar (tabjes). Elk tabje heeft zijn eigen geschiedenis,
  // denk-status en halve tekst, zodat je in 'Strategie' kunt praten terwijl
  // 'Code' nog op een antwoord of code-opdracht wacht.
  const [gesprekken, setGesprekken] = useState(leesGesprekken)
  const [actiefId, setActiefId] = useState(() => lees(ACTIEF_KEY))
  const actief = gesprekken.find(g => g.id === actiefId) || gesprekken.find(g => g.samen?.includes(actiefId)) || gesprekken[0]
  const gesprek = actief.berichten
  useEffect(() => { onTab?.(actief.id) }, [actief.id, onTab])
  const gesprekkenRef = useRef(gesprekken)
  gesprekkenRef.current = gesprekken
  const actiefRef = useRef(actief.id)
  actiefRef.current = actief.id
  const wijzigTabje = (id, f) => setGesprekken(gs => gs.map(g => g.id !== id ? g : { ...f(g), bijgewerkt: Date.now() }))
  const zetBerichten = (id, f) => wijzigTabje(id, g => ({ ...g, berichten: f(g.berichten) }))
  const [bezigPer, setBezigPer] = useState({})
  const bezigPerRef = useRef(bezigPer)
  bezigPerRef.current = bezigPer
  const stopPer = useRef({}) // tabje → { id, gestopt } van de lopende vraag
  const [toonEerder, setToonEerder] = useState(false)
  const [toonRegels, setToonRegels] = useState(false)
  const [menu, setMenu] = useState(false)
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
  const [bestanden, setBestanden] = useState([]) // { id, file, naam, grootte, type } → bucket bij versturen
  const [uploadt, setUploadt] = useState(false)
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

  // Klaarstaande vraag voor het Klanten-tabje: sturen zodra dat tabje actief is.
  const [naKlanten, setNaKlanten] = useState(null)
  const stuurNu = useRef(null)
  useEffect(() => {
    if (!naKlanten || !isKlanten(actief)) return
    setNaKlanten(null)
    stuurNu.current?.(naKlanten)
  }, [naKlanten, actief])

  // Tabje Klanten = scherm Klanten erachter (6 nov 2026): wat je daar vraagt
  // hoort bij je klanten, dus de kalender springt mee naar die weergave.
  const naarKlantenScherm = () => onKalender?.({ weergave: 'klanten' })
  const kiesGesprek = (id) => {
    setActiefId(id)
    schrijf(ACTIEF_KEY, id)
    setOpen(true)
    if (isKlanten(gesprekken.find(g => g.id === id))) naarKlantenScherm()
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
  // Terug in Business OS: stond er in een tabje nog een vraag zonder antwoord
  // (scherm dicht terwijl de PA werkte)? Dan het antwoord uit de rij halen, of
  // verder wachten als hij nog loopt. Eén keer, nadat de tabjes geladen zijn.
  const hersteld = useRef(false)
  useEffect(() => {
    if (hersteld.current) return
    const t = setTimeout(() => {
      if (hersteld.current) return
      hersteld.current = true
      gesprekkenRef.current.forEach(async (g) => {
        const laatste = g.berichten[g.berichten.length - 1]
        if (isEditor(g) || laatste?.role !== 'user' || !g.sessie || bezigPerRef.current[g.id]) return
        const { data: rij } = await supabase.from('business_os_opdrachten')
          .select('id, status, antwoord, created_at').eq('soort', 'chat').eq('invoer->>gesprek_id', g.sessie)
          .order('created_at', { ascending: false }).limit(1).maybeSingle()
          .then(r => r, () => ({ data: null }))
        if (!rij || new Date(rij.created_at).getTime() < (laatste.op || 0) - 10000) return
        let laatsteDeel = ''
        const opDeel = (tekst) => { if (tekst) laatsteDeel = tekst; setDeelPer(d => ({ ...d, [g.id]: tekst })) }
        const signaal = { id: rij.id, gestopt: false }
        stopPer.current[g.id] = signaal
        setBezigPer(b => ({ ...b, [g.id]: true }))
        const r = await wachtOpRij(rij.id, opDeel, signaal, { start: new Date(rij.created_at).getTime() })
        delete stopPer.current[g.id]
        opDeel('')
        setBezigPer(b => ({ ...b, [g.id]: false }))
        if (r?.gestopt) {
          if (!signaal.afgehandeld) zetBerichten(g.id, b => [...b, { role: 'assistant', content: `${laatsteDeel ? laatsteDeel + '\n\n' : ''}(gestopt)`, gestopt: true, op: Date.now() }])
        } else if (r?.tekst) antwoord(g.id, { role: 'assistant', content: r.tekst, acties: r.acties || [] })
        else zetBerichten(g.id, b => [...b, { role: 'assistant', content: '(Dit antwoord ging verloren. Stel je vraag nog een keer.)', op: Date.now() }])
      })
    }, dbKlaar ? 300 : 2500)
    return () => clearTimeout(t)
  }, [dbKlaar]) // eslint-disable-line react-hooks/exhaustive-deps

  // Groeironde (nacht, door de PA): verslag + voorstellen één keer in het
  // tabje Strategie. gezien_at claimen vóór het toevoegen, zodat twee open
  // vensters hem niet allebei plaatsen.
  // Eerste keer na 3 s: dan zijn de tabjes uit de database (als die er is) binnen.
  useEffect(() => {
    let weg = false
    const kijk = async () => {
      const { data } = await supabase.from('business_os_opdrachten').select('id, opdracht, antwoord, klaar_at')
        .eq('soort', 'groei').eq('status', 'klaar').is('gezien_at', null).order('klaar_at')
      for (const r of data || []) {
        if (weg || !r.antwoord?.tekst) continue
        const { data: geclaimd } = await supabase.from('business_os_opdrachten')
          .update({ gezien_at: new Date().toISOString() }).eq('id', r.id).is('gezien_at', null).select('id')
        if (!geclaimd?.length) continue
        const gs = gesprekkenRef.current
        // Klanten-ochtendronde (klantenronde.mjs) hoort in het tabje Klanten.
        const klantRonde = /^Klanten/.test(r.opdracht || '')
        const doel = (klantRonde && gs.find(isKlanten)) || gs.find(g => g.naam === 'Strategie') || gs[1] || gs[0]
        const wanneer = new Date(r.klaar_at).toLocaleString('nl-NL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
        zetBerichten(doel.id, b => [...b, { role: 'assistant', content: `${/^(Strategie|Klanten)/.test(r.opdracht || '') ? r.opdracht : 'Groeironde'} (${wanneer})\n\n${r.antwoord.tekst}`, acties: r.antwoord.acties || [], op: new Date(r.klaar_at).getTime() || Date.now() }])
        // Ochtendbeeld meteen rond de bol.
        const beeld = (r.antwoord.acties || []).find(a => a?.soort === 'visueel')
        if (beeld) onVisueel?.(beeld, doel.id)
        const kal = (r.antwoord.acties || []).find(a => a?.soort === 'kalender')
        const prj = (r.antwoord.acties || []).find(a => a?.soort === 'project' && a.id)
        if (prj) onKalender?.({ weergave: 'projecten', project: prj.id })
        else if (kal) onKalender?.(kal)
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
  const { spreekt, bron: spreekBron, alles: allesVoorlezen, tegoed: stemTegoed } = stem.useStem()
  // ElevenLabs-tegoed bij openen en bij elk openen van het puntjes-menu (kost geen tekens).
  useEffect(() => { if (stem.beschikbaar()) stem.tegoed() }, [])
  const [sleept, setSleept] = useState(false)
  const wortel = useRef(null)
  const lijst = useRef(null)
  const veld = useRef(null)
  const herkenner = useRef(null)
  const spraakBasis = useRef('') // vaste tekst: wat er stond + finale spraak
  const spraakVerwerkt = useRef(0) // aantal finale resultaten dat al in spraakBasis zit
  const herstartTimer = useRef(null)
  const kiezer = useRef(null)
  const bestandKiezer = useRef(null)
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
  const [paGezien, setPaGezien] = useState(null) // laatst_gezien van de PA (ms)
  const [route, setRoute] = useState(() => { try { return localStorage.getItem('business_os_route') || 'mac' } catch { return 'mac' } })
  const wisselRoute = () => setRoute(r => {
    const n = r === 'mac' ? 'api' : 'mac'
    try { localStorage.setItem('business_os_route', n) } catch { /* geen opslag */ }
    return n
  })
  const viaMac = !beperkt && route === 'mac' && paOnline

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
      .then(({ data }) => {
        if (weg) return
        const t = data?.laatst_gezien ? new Date(data.laatst_gezien).getTime() : null
        setPaGezien(t)
        setPaOnline(t != null && Date.now() - t < PA_ONLINE_MS)
      }, () => {})
    kijk()
    const t = setInterval(kijk, 15000)
    return () => { weg = true; clearInterval(t) }
  }, [])

  // Lopende code-opdrachten (laatste 30 min). Valt er een weg, dan kijken we
  // hoe hij geëindigd is voor de korte melding.
  const [code, setCode] = useState(null) // null | 'wacht' | 'bezig'
  const [inRij, setInRij] = useState(0) // code-opdrachten die op hun beurt wachten
  // Wat er nu op de Mac loopt of wacht: in de statusregel, details + Stop in een dropdown.
  const [macWerk, setMacWerk] = useState([])
  const [macOpen, setMacOpen] = useState(false)
  const [kaartenOpen, setKaartenOpen] = useState(0) // toestemmingsvragen waar Gino op wacht
  useEffect(() => {
    if (!macOpen) return
    const buiten = (e) => { if (!e.target.closest?.('[data-mac-werk]')) setMacOpen(false) }
    document.addEventListener('pointerdown', buiten)
    return () => document.removeEventListener('pointerdown', buiten)
  }, [macOpen])
  // Laatst afgeronde code-opdracht: de rustregel van het robotje.
  const [laatst, setLaatst] = useState(null) // { tekst (kort), vol (voor de stem), klaar_at }
  useEffect(() => {
    let weg = false
    const haalLaatst = () => supabase.from('business_os_opdrachten')
      .select('opdracht, resultaat, uitkomst, nodig, klaar_at').eq('soort', 'code').eq('status', 'klaar')
      .not('klaar_at', 'is', null).order('klaar_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (weg || !data) return
        const tekst = data.uitkomst === 'wacht_op_jou' ? `Wacht op jou: ${data.nodig || 'bekijk resultaat'}` : laatstGedaanRegel(data)
        // vol: de hele tekst voor de stem; de regel zelf is ingekort tot ~60 tekens.
        const vol = data.resultaat?.trim() || `Gino deed: ${data.opdracht || ''}`
        // Ook de tekst vergelijken: 'Wacht op jou' verdwijnt zodra de opdracht is afgehandeld.
        if (tekst) setLaatst(o => (o?.klaar_at === data.klaar_at && o?.tekst === tekst ? o : { tekst, vol, klaar_at: data.klaar_at }))
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
      .select('id, status, opdracht, voortgang, gestart_at, created_at').eq('soort', 'code').in('status', ['wacht', 'bezig'])
      .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('created_at')
      .then(({ data }) => {
        if (weg || !data) return
        setMacWerk(data)
        if (!data.length) setMacOpen(false)
        const loopt = data.some(r => r.status === 'bezig')
        setCode(loopt ? 'bezig' : data.length ? 'wacht' : null)
        setInRij(Math.max(0, data.length - 1))
        const ids = data.map(r => r.id)
        const klaar = vorige.filter(id => !ids.includes(id))
        vorige = ids
        if (!klaar.length) return
        supabase.from('business_os_opdrachten').select('status, uitkomst, nodig').in('id', klaar)
          .then(({ data: af }) => {
            if (weg) return
            if (af?.length && af.every(r => r.status === 'gestopt')) { meld('Gestopt', false); return }
            const wacht = af?.find(r => r.uitkomst === 'wacht_op_jou')
            if (wacht) meld(`Wacht op jou: ${wacht.nodig || 'bekijk resultaat'}`, true)
            else meld(af?.some(r => r.status === 'mislukt') ? 'Mislukt, bekijk resultaat' : 'Klaar', af?.some(r => r.status === 'mislukt'))
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

  // Gesleept of gekozen: png/jpg/gif/webp = screenshot (beeld-route), de rest
  // (pdf, csv, Excel, txt, heic) = bijlage voor de bucket.
  const neemBestanden = (lijst) => {
    const alle = Array.from(lijst || []).filter(Boolean)
    const isBeeld = (f) => /^image\/(png|jpeg|gif|webp)$/.test(f.type)
    const los = alle.filter(f => !isBeeld(f))
    if (los.length) {
      if (isEditor(actief)) { setFout('Editor (ChatGPT) kan geen bestanden lezen'); return }
      const goed = []
      for (const f of los) {
        const type = BIJLAGE_TYPES[extVan(f.name)]
        if (!type) { setFout(`${f.name}: alleen pdf, csv, xlsx, xls, txt, png, jpg of heic`); continue }
        if (f.size > BIJLAGE_MAX) { setFout(`${f.name} is groter dan 20 MB`); continue }
        goed.push({ id: crypto.randomUUID(), file: f, naam: f.name, grootte: f.size, type })
      }
      if (goed.length) setBestanden(oud => [...oud, ...goed].slice(0, 10))
    }
    neemBeelden(alle.filter(isBeeld))
  }

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
  const neemRef = useRef(neemBestanden)
  neemRef.current = neemBestanden
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
    // De vraag erbij, zodat 'Bewaar' rond de bol weet welke vraag dit scherm opleverde.
    const vraag = [...(gesprekkenRef.current.find(g => g.id === id)?.berichten || [])].reverse().find(n => n.role === 'user')?.content
    const project = (bericht.acties || []).find(a => a?.soort === 'project' && a.id)
    const kalender = (bericht.acties || []).find(a => a?.soort === 'kalender') || (project ? { weergave: 'projecten', project: project.id } : null)
    const overAgenda = !!kalender || AGENDA_VRAAG.test(vraag || '') || OMZET_VRAAG.test(vraag || '') || TIJD_VRAAG.test(vraag || '')
    if (visueel && !overAgenda) onVisueel?.({ ...visueel, _vraag: vraag || null }, id)
    if (kalender) onKalender?.(kalender)
    // Appje klaar (Call verwerken, Na salescall): chat open op dat tabje, zodat
    // je het bewerkveld met Opslaan en versturen meteen voor je hebt.
    if ((bericht.acties || []).some(isBewerkbaarBericht)) kiesGesprek(id)
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
  // Eén alinea voorlezen. Nog een klik op dezelfde = stoppen.
  const leesAlinea = (blok, bron) => {
    if (spreekt && spreekBron === bron) { stem.stop(); return }
    stopHerkenner()
    stem.leesVoor(blok, bron)
  }
  const herhaalKnop = (tekst, vraag = null) => <Herhaal praat={spreekt} onKlik={() => herhaal(tekst, vraag)} />

  // tekst (optioneel): vraag van buitenaf (Mijn schermen); invoer en bijlagen blijven dan staan.
  const stuur = async (tekst, opties) => {
    const vanBuiten = typeof tekst === 'string'
    // Vraag voor het Klanten-tabje (Check-in ronde in de kalender): eerst daarheen, dan sturen.
    if (vanBuiten && opties?.tab === 'klanten' && !isKlanten(actief)) {
      const k = gesprekken.find(isKlanten)
      if (k) { setNaKlanten(tekst); kiesGesprek(k.id); return true }
    }
    let vraag = (vanBuiten ? tekst : invoer).trim()
    if (isKlanten(actief) && vraag) naarKlantenScherm()
    // Geplakt transcript (lange tekst) in het Klanten-tabje: zelfde hint.
    if (isKlanten(actief) && !vanBuiten && vraag.length > 1500 && !vraag.includes('Call verwerken')) vraag = `${TRANSCRIPT_HINT}\n\n${vraag}`
    const bij = vanBuiten ? [] : bijlagen
    const los = vanBuiten ? [] : bestanden
    if ((!vraag && !bij.length && !los.length) || bezig || uploadt || (vanBuiten && isEditor(actief))) return false
    // Bestanden leest alleen Gino op de Mac (pa-db bijlage); screenshots gaan via de API.
    if (los.length && !viaMac) { setFout('Bestanden kan Gino alleen via je Mac lezen. Zet de PA aan (Mac, boven de bol).'); return false }
    if (los.length && bij.length) { setFout('Stuur screenshots en bestanden apart.'); return false }
    const { id, sessie } = actief
    let geupload = []
    if (los.length) {
      setUploadt(true)
      setFout(null)
      try { geupload = await uploadBijlagen(los) } catch (e) { setFout(e.message); return false } finally { setUploadt(false) }
      vraag = [vraag || 'Bekijk de bijlage.', '', ...geupload.map(b => `[bijlage] ${b.naam} | ${b.pad} | ${b.type} | ${b.grootte}`)].join('\n')
      // Call-transcript als bijlage (skill Call verwerken): in het Klanten-tabje
      // altijd, elders als de bestandsnaam erop lijkt. Scherm meteen naar Klanten.
      if (isKlanten(actief) || los.some(f => TRANSCRIPT_BESTAND.test(f?.name || ''))) {
        vraag = `${TRANSCRIPT_HINT}\n\n${vraag}`
        naarKlantenScherm()
      }
      setBestanden([])
    }
    stopHerkenner()
    if (!vanBuiten) setInvoer('')
    stem.stop()
    if (AGENDA_VRAAG.test(vraag) || OMZET_VRAAG.test(vraag) || TIJD_VRAAG.test(vraag)) {
      onKalender?.({ weergave: TIJD_VRAAG.test(vraag) ? 'tijd' : OMZET_VRAAG.test(vraag) ? 'omzet' : CONTENT_VRAAG.test(vraag) ? 'content' : 'week' })
      onVisueel?.(null, actief.id) // oud getekend rooster van dit tabje weg
    }
    // Versturen is een klik/Enter: Safari laat het antwoord straks dan ook afspelen.
    if (stem.isAan()) stem.ontgrendel()
    const nieuwBericht = { role: 'user', content: vraag, op: Date.now() }
    if (bij.length) {
      nieuwBericht.afbeeldingen = bij.map(({ media_type, data }) => ({ media_type, data }))
      nieuwBericht.thumbs = bij.map(b => b.thumb)
    }
    const nieuw = [...gesprek, nieuwBericht]
    onderaan.current = true // eigen bericht: altijd naar beneden
    // Extra tabje heet 'Gesprek 3' tot de eerste vraag: dan krijgt het die als naam.
    wijzigTabje(id, g => ({
      ...g, berichten: nieuw,
      naam: !g.berichten.length && /^Gesprek \d+$/.test(g.naam) && vraag ? kort(vraag, 18) : g.naam,
    }))
    if (!vanBuiten) { setInvoer(''); setBijlagen([]) }
    if (vanBuiten) setOpen(true)
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
    const contextNu = metAfgewezen(context, gesprekken)
    let laatsteDeel = ''
    const opDeel = (t) => { if (t) laatsteDeel = t; setDeelPer(d => ({ ...d, [id]: t })) }
    const signaal = { id: null, gestopt: false }
    stopPer.current[id] = signaal
    // Ook met screenshots via de Mac (2 nov 2026): de PA geeft ze als afbeelding door.
    const mac = viaMac ? await vraagViaMac(berichten, contextNu, opDeel, { modus, gesprek_id: sessie, ...(isKlanten(actief) ? { tab: 'klanten' } : {}) }, signaal, geupload) : null
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
    const { data, error } = await supabase.functions.invoke('business-os-chat', { body: { berichten, context: contextNu } })
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
  // Alleen een status op de actie: niets uitgevoerd, en toestaan() weigert hem daarna
  // (staatOpen). Wegschrijven gaat met het tabje mee (localStorage + business_os_gesprekken).
  const afwijzen = (t, i, j) => {
    const ac = gesprekken.find(g => g.id === t)?.berichten[i]?.acties?.[j]
    if (!ac || !staatOpen(ac) || actieStaat[`${t}-${i}-${j}`]?.bezig) return
    zetActie(t, i, j, { afgewezen: true })
  }
  const ongedaanMaken = async (t, i, j) => {
    const ac = gesprekken.find(g => g.id === t)?.berichten[i]?.acties?.[j]
    const sleutel = `${t}-${i}-${j}`
    if (!ac?.wijziging_id || ac.ongedaan || actieStaat[sleutel]?.bezig) return
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: true } }))
    const { veld, fout: f } = await draaiWijzigingTerug(ac)
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: false, fout: f || null } }))
    if (!f) zetActie(t, i, j, veld)
  }
  if (stuurRef) stuurRef.current = stuur
  stuurNu.current = stuur
  // Nieuw gesprek in hetzelfde tabje: berichten leeg, nieuwe Slim-sessie.
  const leegGesprek = () => {
    stem.stop()
    wijzigTabje(actief.id, g => ({ ...g, berichten: [], sessie: crypto.randomUUID() }))
    setActieStaat(s => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith(`${actief.id}-`))))
    setFout(null)
    setOngelezenPer(o => ({ ...o, [actief.id]: false }))
  }
  // Nieuwe deploy? Herladen zodra er geen gesprek loopt (gesprekken staan in localStorage).
  useNieuweVersie(!ergensBezig && !luistert && !spreekt && !invoer.trim() && !bijlagen.length && !bestanden.length && !uploadt
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

  const kanSturen = (invoer.trim() || bijlagen.length || bestanden.length) && !bezig && !uploadt
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
    width: 30, height: 30, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
  }
  const anderBezig = gesprekken.find(g => g.id !== actief.id && bezigPer[g.id])
  const werk = kaartenOpen ? 'Wacht op jou: klik op de kaart' : code === 'bezig' ? (inRij ? `Bezig met code · ${inRij} in de rij` : 'Bezig met code…')
    : bezig ? (isEditor(actief) ? 'ChatGPT denkt na…' : deel ? 'Gino typt…' : 'Gino denkt na…') : spreekt ? 'Gino praat…'
    : anderBezig ? `Gino denkt na in ${anderBezig.naam}…`
    : code === 'wacht' ? 'Wacht op je Mac…' : null
  const statusRegel = werk || (melding && !vraagNu ? melding.tekst : vraagNu ? 'Wacht op jou' : laatst?.tekst || (wachtLijst.length ? 'Gino wacht op jou' : 'Gino is klaar'))
  // De opdracht die de statusregel noemt; zolang de chat zelf bezig is, gaat die voor.
  const macNu = macWerk.find(w => w.status === 'bezig') || (code === 'wacht' && !bezig && !spreekt ? macWerk[0] : null)

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
                <BerichtTekst tekst={b.content} />
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, ...TEKST, fontWeight: 500, color: colors.textPrimary }}>
                  {(b.acties || []).map((ac, j) => {
                    if (!ac || typeof ac !== 'object') return null
                    const kaart = { voorstel: ac, staat: actieStaat[`${actief.id}-${i}-${j}`], onToestaan: () => toestaan(actief.id, i, j), onAfwijzen: () => afwijzen(actief.id, i, j) }
                    if (ac.soort === 'wacht_op_jou') return <WachtOpJou key={j} {...kaart} />
                    if (ac.soort === 'slot_voorstel') return <SlotVoorstel key={j} {...kaart} />
                    if (ac.soort === 'wijziging_voorstel') return <WijzigingVoorstel key={j} {...kaart} onOngedaan={() => ongedaanMaken(actief.id, i, j)} />
                    if (ac.soort === 'bewerkbaar_bericht') return isBewerkbaarBericht(ac)
                      ? <BewerkbaarBericht key={j} voorstel={ac} sleutel={`${actief.id}-${i}-${j}`} vastgezet={vastgezet} onVastzetten={onVastzetten} /> : null
                    if (ac.soort === 'visueel') {
                      const vraag = alle.slice(0, i).reverse().find(n => n.role === 'user')?.content || null
                      return (
                        <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                          <button type="button" onClick={() => onVisueel?.({ ...ac, _vraag: vraag }, actief.id)} style={{
                            display: 'flex', gap: 6, alignItems: 'center', background: 'transparent', border: 'none', padding: 0,
                            color: colors.success, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                          }}>
                            <Eye size={13} strokeWidth={2.5} /> Laat zien{typeof ac.titel === 'string' && ac.titel ? `: ${ac.titel.slice(0, 50)}` : ''}
                          </button>
                          <BewaarKnop visueel={ac} vraag={vraag} onKlaar={() => meld('Scherm bewaard', false)} />
                        </div>
                      )
                    }
                    if (ac.soort === 'pa_voorstel') return <PaVoorstel key={j} {...kaart} herhaalKnop={laatsteGino ? herhaalKnop : null} />
                    if (ac.soort === 'project' && ac.id) return (
                      <button key={j} type="button" onClick={() => onKalender?.({ weergave: 'projecten', project: ac.id })} style={{
                        display: 'flex', gap: 6, alignItems: 'center', background: 'transparent', border: 'none', padding: 0, marginBottom: 4,
                        color: colors.success, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Eye size={13} strokeWidth={2.5} /> {typeof ac.tekst === 'string' && ac.tekst ? ac.tekst : 'Open project'}
                      </button>
                    )
                    if (ac.soort === 'kalender') return (
                      <button key={j} type="button" onClick={() => onKalender?.(ac)} style={{
                        display: 'flex', gap: 6, alignItems: 'center', background: 'transparent', border: 'none', padding: 0, marginBottom: 4,
                        color: colors.success, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        <Eye size={13} strokeWidth={2.5} /> Open kalender{Array.isArray(ac.concept) && ac.concept.length ? ` · ${ac.concept.length} voorstellen` : ''}
                      </button>
                    )
                    return (
                      <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: colors.success, fontWeight: 800, fontSize: '0.8rem', marginBottom: 4 }}>
                        <Check size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {ac.soort === 'app_issue' ? `Op de app-lijst: ${ac.tekst}` : typeof ac.tekst === 'string' ? ac.tekst : ''}
                      </div>
                    )
                  })}
                  <Inkort tekst={b.content} achter={laatsteGino ? herhaalKnop(spraakVan(b).tekst, spraakVan(b).vraag) : null}
                    alineas={{ sleutel: `${actief.id}-${i}`, praatBron: spreekt ? spreekBron : null, onLees: stem.beschikbaar() ? leesAlinea : null }} />
                  <VastzetKnop tekst={b.content} vastgezet={vastgezet} onVastzetten={onVastzetten} />
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
          </div>
        )}

        {/* Toestemmingsvragen van Gino: blijven staan ook als de berichten dicht zijn */}
        <ToestemmingKaarten onOpen={setKaartenOpen} />
        <div ref={balk} data-sleep-balk="" style={{ position: 'relative' }}>
          {/* ── Werk-indicator: robotje boven de balk, buiten de flow zodat de groep niet verspringt ── */}
          {/* Altijd zichtbaar: bezig, wacht op jou of wat Gino het laatst deed; open acties eronder */}
          {/* In het kleine blokje hoort deze regel in de kaart zelf, anders steekt hij erbuiten. */}
          {/* Eén linkerkant met het invoerveld (left/right 0) en vast 6 px erboven (STATUS_GAT). */}
          <div style={klein?.aan ? { position: 'relative', marginBottom: STATUS_GAT } : { position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: STATUS_GAT }}>
            {/* Op de Mac: alle opdrachten voluit, hoe lang al, en Stop */}
            {macOpen && macWerk.length > 0 && (
              <div data-mac-werk style={{
                position: 'absolute', left: 0, right: 0, bottom: '100%', marginBottom: 8, zIndex: 6,
                maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, padding: 16, boxSizing: 'border-box',
                background: colors.surface, border: `1px solid ${colors.borderSubtle}`, borderRadius: 16,
                boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
              }}>
                {macWerk.map(w => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.4, color: colors.textPrimary,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>{opdrachtKop(w)}</div>
                      <div style={{ marginTop: 4, fontSize: '0.74rem', fontWeight: 700, color: colors.textSecondary }}>
                        {w.status === 'bezig' ? `Op je Mac · ${duurSinds(w)}${w.voortgang ? ` · ${w.voortgang}` : ''}` : 'In de rij'}
                      </div>
                    </div>
                    <button type="button" onClick={() => supabase.from('business_os_opdrachten')
                      .update({ status: 'gestopt', klaar_at: new Date().toISOString() }).eq('id', w.id).in('status', ['wacht', 'bezig'])
                      .then(() => setMacWerk(l => l.filter(x => x.id !== w.id)), () => {})}
                      style={{ ...KNOP, minHeight: 32, padding: '0 12px', fontSize: '0.72rem', flexShrink: 0 }}>
                      Stop
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* Mac/API-aanduiding: boven de Gino-bol (vak van BusinessOS), niet meer in de tabjesrij. */}
            {!beperkt && macPlek?.el && createPortal(
              <MacPil viaMac={viaMac} route={route} paOnline={paOnline} gezien={paGezien} herstart={herstart} links={macPlek.links}
                kanHerstarten={!ergensBezig} onHerstart={herstartPa} onWissel={wisselRoute} isMobile={isMobile} />,
              macPlek.el,
            )}
            <div style={{ display: 'flex', alignItems: 'center', height: 26, minWidth: 0 }}>
            {/* Mobiel: de rij scrolt zijwaarts i.p.v. dat label en tabjes elkaar platdrukken. */}
            <div className={isMobile ? 'bos-tabjes' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 26, minWidth: 0, flex: 1,
              // Mobiel 4 px extra boven (en weer terug), zodat de antenne van het opgeschoven robotje niet wegvalt.
              ...(isMobile ? { overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', height: 30, marginTop: -4, paddingTop: 4, boxSizing: 'border-box' } : null),
            }}>
              {/* Klik op het poppetje: berichtenvenster open/dicht. Groene stip = iets ongelezen. */}
              <button role="status" onClick={() => setOpen(o => !o)} aria-expanded={open}
                title={!isMobile && !macNu && typeof statusRegel === 'string' ? statusRegel : open ? 'Berichten verbergen' : 'Berichten tonen'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 26, whiteSpace: 'nowrap', minWidth: 0,
                  flex: isMobile || macNu ? '0 0 auto' : '0 1 auto', maxWidth: isMobile ? '62vw' : undefined,
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  fontSize: 12, fontWeight: 600, lineHeight: '16px',
                  color: werk || vraagNu || open ? colors.textSecondary : melding ? (melding.fout ? colors.danger : colors.success) : laatst ? colors.textSecondary : colors.textMuted,
                }}>
                {/* Robotje: tafelrand (y=21) op de basislijn van de tekst, getekende linkerkant op de rand van het invoerveld. */}
                <span style={{ position: 'relative', display: 'flex', flexShrink: 0, marginLeft: -2, transform: melding && !werk && !vraagNu ? 'none' : 'translateY(-4px)' }}>
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
                {!macNu && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                  <StatusTekst tekst={statusRegel} />
                </span>}
              </button>
              {macNu && (
                <button type="button" data-mac-werk onClick={() => setMacOpen(o => !o)} aria-expanded={macOpen}
                  title={opdrachtKop(macNu)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, height: 26, minWidth: 0, whiteSpace: 'nowrap',
                    flex: isMobile ? '0 0 auto' : '1 1 0', maxWidth: isMobile ? '62vw' : undefined,
                    background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '0.75rem', fontWeight: 800,
                  }}>
                  {/* Regel 1: de opdracht. Regel 2: hoe lang al en de stap van nu. */}
                  <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left', lineHeight: '13px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: colors.textPrimary }}>{opdrachtKop(macNu)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: colors.textSecondary, fontSize: '0.7rem', fontWeight: 700 }}>
                      {macNu.status === 'bezig' ? `${kaartenOpen ? 'Wacht op jou' : 'Bezig'} · ${duurSinds(macNu)}` : 'In de rij'}{macNu.status === 'bezig' && macNu.voortgang && !kaartenOpen ? ` · ${macNu.voortgang}` : ''}{macWerk.length > 1 ? ` · +${macWerk.length - 1}` : ''}
                    </span>
                  </span>
                  <ChevronDown size={12} strokeWidth={3} color={colors.textSecondary} style={{ flexShrink: 0, transform: macOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>
              )}
              {/* Lege ruimte (tik = berichten open/dicht) duwt luidspreker + tabjes naar de rechterrand van het invoerveld. */}
              <span onClick={() => setOpen(o => !o)} style={{ flex: macNu && !isMobile ? '0 0 4px' : '1 0 4px', minWidth: 4, alignSelf: 'stretch', cursor: 'pointer' }} />
              {/* Herhaalknop van het laatste opdrachtresultaat: klein, direct links van de tabjes */}
              {!werk && !(melding && !vraagNu) && !vraagNu && laatst?.tekst && stem.beschikbaar() && (
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, height: 16, marginLeft: -4 }}>{herhaalKnop(laatst.vol)}</span>
              )}
              {/* Gesprekken: kleine tabjes, groene stip = ongelezen of klaar resultaat */}
              {/* Desktop: minstens de helft van de rij, groeit mee met de inhoud (statusregel kapt af). Teveel schuift zijwaarts. */}
              <div role="tablist" aria-label="Gesprekken" className="bos-tabjes" ref={el => {
                if (!el || el.dataset.actief === actief.id) return
                el.dataset.actief = actief.id
                requestAnimationFrame(() => {
                  const t = el.querySelector('[aria-selected="true"]')
                  if (!t) return
                  const a = t.getBoundingClientRect(), v = el.getBoundingClientRect()
                  if (a.left < v.left) el.scrollLeft += a.left - v.left
                  else if (a.right > v.right) el.scrollLeft += a.right - v.right
                })
              }} style={{
                // Rechts uitgelijnd (safe: bij overloop blijft links bereikbaar), zodat + precies op de rechterrand van het invoerveld eindigt.
                display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', marginLeft: -4,
                ...(isMobile
                  ? { minWidth: 0, flex: '0 0 auto' }
                  : { flex: '0 0 auto', minWidth: '50%', maxWidth: 'calc(100% - 40px)', justifyContent: 'safe flex-end' }),
              }}>
                {gesprekken.filter(g => !beperkt || !isEditor(g)).map((g, gi) => {
                  const aan = g.id === actief.id
                  const staat = tabStatus(g)
                  return (
                    <button key={g.id} role="tab" aria-selected={aan} onClick={() => (aan && open ? setOpen(false) : kiesGesprek(g.id))}
                      title={bezigPer[g.id] ? `${g.naam}: Gino denkt na` : g.naam}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5, height: 16, padding: '0 8px', flexShrink: 0,
                        borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        background: aan ? colors.surface : 'transparent',
                        color: aan ? colors.textPrimary : colors.textMuted, fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap',
                      }}>
                      <span style={{ maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis' }}>{beperkt && g.naam === 'Code' ? 'Gino' : g.naam}</span>
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
                  height: 16, padding: '0 0 0 7px', flexShrink: 0, border: 'none', borderRadius: 999, background: 'transparent',
                  color: colors.textMuted, fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
                }}>+</button>
              </div>
            </div>
            </div>
            {wachtLijst.map(w => (
              <div key={w.sleutel} style={{ display: 'flex', alignItems: 'center', gap: 8, height: WACHT_RIJ_H, minWidth: 0, paddingLeft: 36 }}>
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
              <Paperclip size={18} strokeWidth={2.5} /> Laat los om mee te sturen
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
            {bestanden.length > 0 && (
              <div style={{ padding: '10px 12px 2px' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {bestanden.map(b => (
                    <div key={b.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, maxWidth: '100%', height: 30, padding: '0 4px 0 10px',
                      borderRadius: 999, background: 'rgba(255,255,255,0.06)', fontSize: '0.74rem', fontWeight: 800, color: colors.textPrimary,
                    }}>
                      <FileText size={13} strokeWidth={2.5} color={colors.success} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{b.naam}</span>
                      <span style={{ color: colors.textMuted, fontWeight: 700, flexShrink: 0 }}>{grootteTekst(b.grootte)}</span>
                      <button onClick={() => setBestanden(l => l.filter(x => x.id !== b.id))} disabled={uploadt}
                        title="Weghalen" aria-label={`${b.naam} weghalen`} style={{
                          width: 22, height: 22, borderRadius: '50%', border: 'none', flexShrink: 0, padding: 0,
                          background: 'transparent', color: colors.textSecondary, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        <X size={13} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.66rem', fontWeight: 700, color: colors.textMuted, marginTop: 5 }}>
                  {uploadt ? 'Uploaden…' : 'Bijlagen worden na 7 dagen verwijderd.'}
                </div>
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
                placeholder={luistert ? 'Luistert… praat maar' : isEditor(actief) ? (isMobile ? 'Opdracht voor ChatGPT' : 'Opdracht voor ChatGPT (editor)') : isMobile ? 'Taak of screenshot' : 'Geef een taak of plak een screenshot'}
                rows={1}
                style={{
                  flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  color: colors.textPrimary, fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.3, padding: '6px 0 6px 4px',
                  // marginBottom 2 = zelfde marge als de ronde knoppen, zodat de tekst op hun midden staat.
                  minHeight: 30, marginBottom: 2, maxHeight: INVOER_MAX_H, overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              {/* In Editor is er geen ⋯-menu, dus daar blijft groot/klein een los knopje. */}
              {isEditor(actief) && klein && (
                <button onClick={klein.wissel} title={klein.aan ? 'Terug naar groot' : 'Klein maken en slepen'} aria-label={klein.aan ? 'Terug naar groot' : 'Klein maken en slepen'}
                  style={{ ...rondeKnop, width: 32, background: 'transparent', color: colors.textSecondary }}>
                  {klein.aan ? <Maximize2 size={14} strokeWidth={2.5} /> : <Minimize2 size={14} strokeWidth={2.5} />}
                </button>
              )}
              {/* Snel/Slim zichtbaar; foto, bestand, groot/klein, eerdere gesprekken en nieuw gesprek achter ⋯ (niet in Editor) */}
              {!beperkt && !isEditor(actief) && <button onClick={wisselModus}
                title={modus === 'slim'
                  ? (viaMac ? 'Slim: Opus, kent CLAUDE.md en memory, onthoudt dit gesprek. Trager (10-30 s). Klik: Snel' : 'Slim werkt alleen via je Mac; nu gaat het via de API (Snel). Klik: Snel')
                  : 'Snel: kort en vlot. Klik: Slim (Opus, denkt langer na)'}
                style={{
                  display: 'flex', alignItems: 'center', height: 30, margin: '2px 0', padding: '0 4px', flexShrink: 0,
                  fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', border: 'none',
                  color: modus === 'slim' ? (viaMac ? colors.success : colors.textMuted) : colors.textSecondary, fontFamily: 'inherit',
                }}>
                {modus === 'slim' ? 'Slim' : 'Snel'}
              </button>}
              {!isEditor(actief) && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => { if (!menu && stem.beschikbaar()) stem.tegoed(); setMenu(m => !m) }} title="Meer" aria-label="Meer opties"
                    style={{ ...rondeKnop, width: 32, background: 'transparent', color: colors.textSecondary }}>
                    <MoreHorizontal size={16} strokeWidth={2.4} />
                  </button>
                  {menu && (
                    <>
                      <div onClick={() => setMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                      <div style={{
                        position: 'absolute', right: 0, bottom: 'calc(100% + 8px)', zIndex: 41, minWidth: 230, padding: 6,
                        background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,.6)',
                      }}>
                        <button onClick={() => { setMenu(false); kiezer.current?.click() }} style={menuRegel}>
                          <ImagePlus size={15} /> <span style={{ flex: 1 }}>Foto of screenshot</span>
                        </button>
                        <button onClick={() => { setMenu(false); bestandKiezer.current?.click() }} title="pdf, csv, Excel, txt, foto; max 20 MB" style={menuRegel}>
                          <Paperclip size={15} /> <span style={{ flex: 1 }}>Bestand bijvoegen</span>
                        </button>
                        {klein && (
                          <button onClick={() => { setMenu(false); klein.wissel() }} style={menuRegel}>
                            {klein.aan ? <Maximize2 size={15} /> : <Minimize2 size={15} />} <span style={{ flex: 1 }}>{klein.aan ? 'Terug naar groot' : 'Klein maken en slepen'}</span>
                          </button>
                        )}
                        {/* In het kleine blokje zit hiervoor een pijltje op de linkerrand. */}
                        {klein && !klein.aan && (
                          <button onClick={() => { setMenu(false); klein.inklappen() }} style={menuRegel}>
                            <PanelRightClose size={15} /> <span style={{ flex: 1 }}>Inklappen naar zijkant</span>
                          </button>
                        )}
                        <button onClick={() => { setMenu(false); setToonEerder(true) }} style={menuRegel}>
                          <History size={15} /> <span style={{ flex: 1 }}>Eerdere gesprekken</span>
                        </button>
                        {gesprek.length > 0 && (
                          <button onClick={() => { setMenu(false); leegGesprek() }} style={menuRegel}>
                            <SquarePen size={15} /> <span style={{ flex: 1 }}>Nieuw gesprek</span>
                          </button>
                        )}
                        {onNotities && (
                          <button onClick={() => { setMenu(false); onNotities() }} style={menuRegel}>
                            <StickyNote size={15} /> <span style={{ flex: 1 }}>Notities</span>
                          </button>
                        )}
                        <button onClick={() => { setMenu(false); setToonRegels(true) }} style={menuRegel}>
                          <ShieldCheck size={15} /> <span style={{ flex: 1 }}>Altijd toegestaan</span>
                        </button>
                        {stem.beschikbaar() && (
                          <>
                            <button role="switch" aria-checked={allesVoorlezen} onClick={() => stem.zetAlles(!allesVoorlezen)} style={menuRegel}>
                              <Volume2 size={15} /> <span style={{ flex: 1 }}>Alles voorlezen</span>
                              <span style={{
                                width: 30, height: 18, borderRadius: 9, padding: 2, flexShrink: 0, transition: 'background .15s',
                                background: allesVoorlezen ? colors.success : 'rgba(255,255,255,0.18)',
                              }}>
                                <span style={{
                                  display: 'block', width: 14, height: 14, borderRadius: 7, background: '#fff',
                                  transform: allesVoorlezen ? 'translateX(12px)' : 'none', transition: 'transform .15s',
                                }} />
                              </span>
                            </button>
                            {stemTegoed && (
                              <div style={{ padding: '2px 10px 8px 35px', fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted }}>
                                Stem: nog {stemTegoed.over.toLocaleString('nl-NL')} tekens deze maand
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {toonEerder && <EerdereGesprekken huidig={actief.sessie} onSluit={() => setToonEerder(false)}
                    onKies={(berichten, gid) => {
                      setToonEerder(false)
                      stem.stop()
                      wijzigTabje(actief.id, g => ({ ...g, berichten, sessie: gid }))
                      setFout(null)
                    }} />}
                  {toonRegels && <ToestemmingRegels onSluit={() => setToonRegels(false)} />}
                </div>
              )}
              <input ref={kiezer} type="file" accept="image/*" multiple hidden
                onChange={e => { neemBeelden(e.target.files); e.target.value = '' }} />
              <input ref={bestandKiezer} type="file" accept={BIJLAGE_ACCEPT} multiple hidden
                onChange={e => { neemBestanden(e.target.files); e.target.value = '' }} />
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
                  <Mic size={16} strokeWidth={2.5} />
                </button>
              )}
              {kanStoppen && !kanSturen ? (
                <button
                  onClick={stop}
                  title={bezig ? 'Stop Gino' : 'Stop de code-opdracht'}
                  aria-label={bezig ? 'Stop Gino' : 'Stop de code-opdracht'}
                  style={{ ...rondeKnop, background: colors.textPrimary, color: colors.onAccent, cursor: 'pointer' }}
                >
                  <span style={{ width: 11, height: 11, borderRadius: 3, background: 'currentColor', display: 'block' }} />
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
                  <ArrowUp size={16} strokeWidth={3} />
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
