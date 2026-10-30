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
// afgeronde code-opdracht (max ~60 tekens); open "Ik wacht op jou"-acties staan
// eronder met elk een Gedaan-knop, plus de ElevenLabs-sleutelactie zolang
// gino-stem 503 geen_sleutel geeft. Versturen breekt de spraakherkenning af en
// negeert late resultaten, zodat het veld leeg blijft.

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { ArrowUp, Copy, Check, Mic, Lock, Database, Laptop, ImagePlus, X, SquarePen, RotateCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'
import useIsMobile from '../../hooks/useIsMobile'
import * as stem from './stem'
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
async function vraagViaMac(berichten, context, opDeel, extra = {}) {
  const { data: rij, error } = await supabase.from('business_os_opdrachten')
    .insert({ soort: 'chat', opdracht: berichten[berichten.length - 1].content.slice(0, 500), invoer: { berichten, context, ...extra } })
    .select('id').single()
  if (error) return null
  const start = Date.now()
  let klaar = null
  const bekijk = (data) => {
    if (!data || klaar) return
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

const leesGesprek = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
// Volle afbeeldingen niet in localStorage (te groot), alleen de thumbnail.
const bewaarGesprek = (g) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(g.slice(-40).map(b => {
      if (!b.afbeelding && !b.afbeeldingen) return b
      const kopie = { ...b }
      delete kopie.afbeelding
      delete kopie.afbeeldingen
      return kopie
    })))
  } catch { /* privé-venster of vol */ }
}

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

// Lange antwoorden ingekort tonen (~6 regels) met 'meer' / 'minder'.
const MAX_REGELS = 6
function Inkort({ tekst }) {
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
      </div>
      {(lang || open) && (
        <button onClick={() => setOpen(o => !o)} style={{
          background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', fontFamily: 'inherit',
          color: colors.success, fontWeight: 800, fontSize: '0.75rem',
        }}>
          {open ? 'minder' : 'meer'}
        </button>
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

function PaVoorstel({ voorstel, staat, onToestaan }) {
  const [rij, setRij] = useState(null)
  const { bezig, fout } = staat || {}
  const id = voorstel.opdrachtId

  useEffect(() => {
    if (!id) return
    let weg = false
    const kijk = () => supabase.from('business_os_opdrachten')
      .select('status, resultaat, created_at').eq('id', id).maybeSingle()
      .then(({ data }) => { if (!weg && data) setRij(data) }, () => {})
    kijk()
    const t = setInterval(kijk, 5000)
    return () => { weg = true; clearInterval(t) }
  }, [id])

  const status = rij?.status
  const hangt = status === 'wacht' && rij && Date.now() - new Date(rij.created_at).getTime() > 20000
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
        <div style={{ fontWeight: 800, color: status === 'klaar' ? colors.success : status === 'mislukt' ? colors.danger : colors.textPrimary }}>
          {status === 'klaar' && <Check size={14} style={{ verticalAlign: '-2px', marginRight: 4 }} />}
          {PA_STATUS[status] || 'Versturen…'}
          {hangt && <div style={{ color: colors.textSecondary, fontWeight: 600, marginTop: 2 }}>Draait npm run pa op je Mac?</div>}
        </div>
      )}
      {rij?.resultaat && <div style={{ marginTop: 6 }}><Inkort tekst={rij.resultaat} /></div>}
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
.bos-robot .bos-hand-l { animation: bos-typ 0.5s ease-in-out infinite }
.bos-robot .bos-hand-r { animation: bos-typ 0.5s ease-in-out 0.25s infinite }
.bos-robot .bos-oog { transform-box: fill-box; transform-origin: center; animation: bos-knipper 3s infinite }
.bos-robot .bos-antenne { animation: bos-zacht 1.6s ease-in-out infinite }
.bos-robot.bos-rust { opacity: 0.45 }
.bos-robot.bos-rust * { animation: none !important }
@media (prefers-reduced-motion: reduce) { .bos-robot *, .bos-stip, .bos-draai { animation: none !important } }
`

// Gesprek → berichten voor de AI. Meerdere screenshots in één bericht worden
// opeenvolgende gebruikersberichten (de edge function kent één beeld per
// bericht); alleen de laatste MAX_BEELDEN beelden gaan echt mee.
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

export default function BusinessChat({ context, onBezig, marginTop = 28 }) {
  const [gesprek, setGesprek] = useState(leesGesprek)
  // Snel (Sonnet, licht) of Slim (Opus + CLAUDE.md/memory + onthoudt per
  // gesprek wat hij opzocht). Slim kan alleen via de Mac.
  const [modus, setModus] = useState(() => { try { return localStorage.getItem('business_os_modus') || 'snel' } catch { return 'snel' } })
  const wisselModus = () => setModus(m => {
    const n = m === 'slim' ? 'snel' : 'slim'
    try { localStorage.setItem('business_os_modus', n) } catch { /* geen opslag */ }
    return n
  })
  const nieuwGesprekId = () => {
    const id = crypto.randomUUID()
    try { localStorage.setItem('business_os_gesprek_id', id) } catch { /* geen opslag */ }
    return id
  }
  const gesprekId = useRef(null)
  if (!gesprekId.current) {
    try { gesprekId.current = localStorage.getItem('business_os_gesprek_id') } catch { /* geen opslag */ }
    if (!gesprekId.current) gesprekId.current = nieuwGesprekId()
  }
  const [invoer, setInvoer] = useState('')
  const [bijlagen, setBijlagen] = useState([])
  const [bezig, setBezig] = useState(false)
  const isMobile = useIsMobile()
  // Berichtenvenster: start altijd dicht, niet onthouden.
  const [open, setOpen] = useState(false)
  const [ongelezen, setOngelezen] = useState(false)
  const openRef = useRef(false)
  useEffect(() => { openRef.current = open; if (open) setOngelezen(false) }, [open])
  // Laat de pagina meekijken (de reactor-ring versnelt zolang de AI denkt).
  useEffect(() => { onBezig?.(bezig) }, [bezig, onBezig])
  const [fout, setFout] = useState(null)
  const [luistert, setLuistert] = useState(false)
  const luistertRef = useRef(false)
  useEffect(() => { luistertRef.current = luistert }, [luistert])
  const { spreekt } = stem.useStem()
  const [sleept, setSleept] = useState(false)
  const wortel = useRef(null)
  const lijst = useRef(null)
  const veld = useRef(null)
  const herkenner = useRef(null)
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

  useEffect(() => () => herkenner.current?.abort(), [])
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
  // Laatst afgeronde code-opdracht: de rustregel van het robotje.
  const [laatst, setLaatst] = useState(null) // { tekst, klaar_at }
  useEffect(() => {
    let weg = false
    const haalLaatst = () => supabase.from('business_os_opdrachten')
      .select('opdracht, resultaat, klaar_at').eq('soort', 'code').eq('status', 'klaar')
      .not('klaar_at', 'is', null).order('klaar_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (weg || !data) return
        const tekst = laatstGedaanRegel(data)
        if (tekst) setLaatst(o => (o?.klaar_at === data.klaar_at ? o : { tekst, klaar_at: data.klaar_at }))
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
    if (nieuw && stem.isAan() && !stem.isBezig() && !luistertRef.current) stem.spreek(laatst.tekst)
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
    const kijk = () => supabase.from('business_os_opdrachten')
      .select('id, status').eq('soort', 'code').in('status', ['wacht', 'bezig'])
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .then(({ data }) => {
        if (weg || !data) return
        setCode(data.some(r => r.status === 'bezig') ? 'bezig' : data.length ? 'wacht' : null)
        const ids = data.map(r => r.id)
        const klaar = vorige.filter(id => !ids.includes(id))
        vorige = ids
        if (!klaar.length) return
        supabase.from('business_os_opdrachten').select('status').in('id', klaar)
          .then(({ data: af }) => {
            if (weg) return
            meld(af?.some(r => r.status === 'mislukt') ? 'Mislukt, bekijk resultaat' : 'Klaar', af?.some(r => r.status === 'mislukt'))
            if (!openRef.current) setOngelezen(true)
          }, () => {})
      }, () => {})
    kijk()
    const t = setInterval(kijk, 4000)
    return () => { weg = true; clearInterval(t) }
  }, [])

  const microfoon = () => {
    if (luistert) { herkenner.current?.stop(); return }
    stem.stop()
    const h = new Spraak()
    h.lang = 'nl-NL'
    h.continuous = true
    h.interimResults = true
    // Wat er al stond blijft staan; het gesprokene (ook tussentijds) komt erachter.
    const basis = invoer.trim() ? invoer.trim() + ' ' : ''
    // Alleen de actuele herkenner mag het veld vullen: na versturen komt er niets meer terug.
    h.onresult = (e) => {
      if (herkenner.current !== h) return
      const tekst = Array.from(e.results).map(r => r[0].transcript).join('')
      setInvoer(basis + tekst)
    }
    h.onerror = (e) => { if (e.error !== 'aborted' && e.error !== 'no-speech') setFout('Microfoon werkt niet: ' + e.error) }
    h.onend = () => {
      if (herkenner.current !== h) return
      herkenner.current = null
      setLuistert(false)
      veld.current?.focus()
    }
    herkenner.current = h
    setFout(null)
    h.start()
    luistertRef.current = true
    setLuistert(true)
  }
  // Versturen: herkenning hard afbreken en loskoppelen, zodat late (interim/final)
  // resultaten de verstuurde tekst niet terugzetten.
  const stopHerkenner = () => {
    const h = herkenner.current
    herkenner.current = null
    if (h) {
      h.onresult = h.onerror = h.onend = null
      try { h.abort() } catch { /* al gestopt */ }
    }
    luistertRef.current = false
    setLuistert(false)
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

  useEffect(() => { bewaarGesprek(gesprek) }, [gesprek])
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

  // Halve tekst terwijl Gino via de Mac typt.
  const [deel, setDeel] = useState('')
  const antwoord = (bericht) => {
    setGesprek(g => [...g, bericht])
    if (!openRef.current) setOngelezen(true)
    meld('Klaar', false)
    // Voorlezen: het antwoord en daarna de eerste toestemmingsvraag (die in het wolkje).
    if (stem.isAan() && !luistertRef.current) {
      const open = bericht.acties.find(staatOpen)
      stem.spreek([bericht.content, open && vraagVoor(open).vraag].filter(Boolean).join('\n'))
    }
  }

  const stuur = async () => {
    const vraag = invoer.trim()
    if ((!vraag && !bijlagen.length) || bezig) return
    stopHerkenner()
    setInvoer('')
    stem.stop()
    // Versturen is een klik/Enter: Safari laat het antwoord straks dan ook afspelen.
    if (stem.isAan()) stem.ontgrendel()
    const nieuwBericht = { role: 'user', content: vraag }
    if (bijlagen.length) {
      nieuwBericht.afbeeldingen = bijlagen.map(({ media_type, data }) => ({ media_type, data }))
      nieuwBericht.thumbs = bijlagen.map(b => b.thumb)
    }
    const nieuw = [...gesprek, nieuwBericht]
    onderaan.current = true // eigen bericht: altijd naar beneden
    setGesprek(nieuw)
    setInvoer('')
    setBijlagen([])
    setBezig(true)
    setFout(null)
    const berichten = naarBerichten(nieuw)
    const metBeeld = berichten.some(b => b.afbeelding)
    const mac = viaMac && !metBeeld ? await vraagViaMac(berichten, context, setDeel, { modus, gesprek_id: gesprekId.current }) : null
    setDeel('')
    if (mac) {
      setBezig(false)
      antwoord({ role: 'assistant', content: mac.tekst, acties: mac.acties || [] })
      return
    }
    const { data, error } = await supabase.functions.invoke('business-os-chat', { body: { berichten, context } })
    setBezig(false)
    if (error || data?.error || !data?.tekst) {
      setFout(data?.error || 'AI gaf geen antwoord, probeer opnieuw.')
      meld('Mislukt, bekijk resultaat', true)
      return
    }
    antwoord({ role: 'assistant', content: data.tekst, acties: data.acties || [] })
  }

  // Voorstellen: status op de actie zelf (gedeeld door kaart en wolkje),
  // bezig/fout per actie hier (sleutel 'bericht-actie').
  const [actieStaat, setActieStaat] = useState({})
  const zetActie = (i, j, veld) => setGesprek(g => g.map((m, mi) => mi !== i ? m : {
    ...m, acties: m.acties.map((x, xi) => xi === j ? { ...x, ...veld } : x),
  }))
  const toestaan = async (i, j) => {
    const ac = gesprek[i]?.acties?.[j]
    const sleutel = `${i}-${j}`
    if (!ac || !staatOpen(ac) || actieStaat[sleutel]?.bezig) return
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: true } }))
    const { veld, fout: f } = await VOER_UIT[ac.soort](ac)
    setActieStaat(s => ({ ...s, [sleutel]: { bezig: false, fout: f || null } }))
    if (f) return
    zetActie(i, j, veld)
    if (ac.soort === 'pa_voorstel') setCode(c => c || 'wacht') // robotje meteen, de poll neemt het over
  }
  const afwijzen = (i, j) => zetActie(i, j, { afgewezen: true })
  // Nieuwe deploy? Herladen zodra er geen gesprek loopt (gesprek staat in localStorage).
  useNieuweVersie(!bezig && !luistert && !spreekt && !invoer.trim() && !bijlagen.length
    && !Object.values(actieStaat).some(s => s?.bezig))
  const alleOpen = gesprek.flatMap((b, i) => b.role !== 'assistant' ? [] :
    (b.acties || []).map((ac, j) => ({ ac, i, j })).filter(x => staatOpen(x.ac)))
  // "Wacht op jou" staat als lijstje onder de statusregel; het wolkje is voor toestemmingsvragen.
  const wachtLijst = [
    ...(sleutelWeg ? [{ sleutel: 'el', tekst: SLEUTEL_ACTIE, onGedaan: sleutelGedaan }] : []),
    ...alleOpen.filter(x => x.ac.soort === 'wacht_op_jou').map(x => ({
      sleutel: `${x.i}-${x.j}`, tekst: x.ac.tekst, bezig: actieStaat[`${x.i}-${x.j}`]?.bezig, onGedaan: () => toestaan(x.i, x.j),
    })),
  ]
  const openVoorstellen = alleOpen.filter(x => x.ac.soort !== 'wacht_op_jou')
  const vraagNu = openVoorstellen[0]
  // Lijst open boven de balk: daar staan de kaarten al, wolkje dan weg.
  const wolkZichtbaar = vraagNu && !(open && plek && !plek.onder)

  const kanSturen = (invoer.trim() || bijlagen.length) && !bezig
  const rondeKnop = {
    width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative',
  }
  const werk = code === 'bezig' ? 'Bezig met code…' : bezig ? (deel ? 'Gino typt…' : 'Gino denkt na…') : spreekt ? 'Gino praat…' : code === 'wacht' ? 'Wacht op je Mac…' : null

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
            {!gesprek.length && <div style={{ ...TEKST, color: colors.textSecondary, fontWeight: 600 }}>Nog geen berichten.</div>}
            {gesprek.map((b, i) => b.role === 'user' ? (
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
                    const kaart = { voorstel: ac, staat: actieStaat[`${i}-${j}`], onToestaan: () => toestaan(i, j) }
                    if (ac.soort === 'wacht_op_jou') return <WachtOpJou key={j} {...kaart} />
                    if (ac.soort === 'slot_voorstel') return <SlotVoorstel key={j} {...kaart} />
                    if (ac.soort === 'wijziging_voorstel') return <WijzigingVoorstel key={j} {...kaart} />
                    if (ac.soort === 'pa_voorstel') return <PaVoorstel key={j} {...kaart} />
                    return (
                      <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: colors.success, fontWeight: 800, fontSize: '0.8rem', marginBottom: 4 }}>
                        <Check size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {ac.soort === 'app_issue' ? `Op de app-lijst: ${ac.tekst}` : typeof ac.tekst === 'string' ? ac.tekst : ''}
                      </div>
                    )
                  })}
                  <Inkort tekst={b.content} />
                </div>
                <Kopieer tekst={b.content} />
              </div>
            ))}
            {bezig && deel && (
              <div style={{ ...TEKST, fontWeight: 500, color: colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{deel}</div>
            )}
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
                  display: 'flex', alignItems: 'center', gap: 8, height: 26, whiteSpace: 'nowrap', minWidth: 0, flex: 1,
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  fontSize: '0.75rem', fontWeight: 800,
                  color: werk || vraagNu || open ? colors.textSecondary : melding ? (melding.fout ? colors.danger : colors.success) : laatst ? colors.textSecondary : colors.textMuted,
                }}>
                <span style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                  {melding && !werk && !vraagNu
                    ? <span style={{ width: 30, display: 'flex', justifyContent: 'center' }}>{melding.fout ? <X size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}</span>
                    : <Robotje rustig={!werk && !vraagNu} />}
                  {ongelezen && !open && (
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
                <button onClick={herstartPa} disabled={herstart || bezig} title="PA op je Mac herstarten en scherm verversen"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 26, padding: 0, flexShrink: 0,
                    background: 'transparent', border: 'none', cursor: herstart || bezig ? 'default' : 'pointer',
                    color: colors.textMuted, opacity: bezig ? 0.4 : 1,
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
            <Vraagwolk key={`${vraagNu.i}-${vraagNu.j}`} voorstel={vraagNu.ac} nr={1} totaal={openVoorstellen.length} extraHoogte={wachtLijst.length * WACHT_RIJ_H}
              staat={actieStaat[`${vraagNu.i}-${vraagNu.j}`]}
              onToestaan={() => toestaan(vraagNu.i, vraagNu.j)} onNee={() => afwijzen(vraagNu.i, vraagNu.j)} />
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
                onChange={e => { stem.stop(); setInvoer(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stuur() } }}
                onPaste={plak}
                placeholder={luistert ? 'Luistert… praat maar' : 'Geef een taak of plak een screenshot'}
                rows={1}
                style={{
                  flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                  color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.35, padding: '9px 0 9px 4px',
                  minHeight: 36, maxHeight: INVOER_MAX_H, overflowY: 'auto', boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
              {/* Snel/Slim + nieuw gesprek: klein, rechts in dezelfde balk */}
              <button onClick={wisselModus}
                title={modus === 'slim'
                  ? (viaMac ? 'Slim: Opus, kent CLAUDE.md en memory, onthoudt dit gesprek. Trager (10-30 s). Klik: Snel' : 'Slim werkt alleen via je Mac; nu gaat het via de API (Snel). Klik: Snel')
                  : 'Snel: kort en vlot. Klik: Slim (Opus, denkt langer na)'}
                style={{
                  display: 'flex', alignItems: 'center', height: 40, padding: '0 4px', flexShrink: 0,
                  fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap', cursor: 'pointer', background: 'transparent', border: 'none',
                  color: modus === 'slim' ? (viaMac ? colors.success : colors.textMuted) : colors.textSecondary, fontFamily: 'inherit',
                }}>
                {modus === 'slim' ? 'Slim' : 'Snel'}
              </button>
              {gesprek.length > 0 && (
                <button onClick={() => { stem.stop(); setGesprek([]); setActieStaat({}); setFout(null); setOngelezen(false); gesprekId.current = nieuwGesprekId() }} title="Nieuw gesprek"
                  style={{ ...rondeKnop, width: 32, background: 'transparent', color: colors.textSecondary }}>
                  <SquarePen size={16} strokeWidth={2.2} />
                </button>
              )}
              <input ref={kiezer} type="file" accept="image/*" multiple hidden
                onChange={e => { neemBeelden(e.target.files); e.target.value = '' }} />
              <button onClick={() => kiezer.current?.click()} title="Screenshot meesturen"
                style={{ ...rondeKnop, background: 'transparent', color: colors.textSecondary }}>
                <ImagePlus size={18} strokeWidth={2.2} />
              </button>
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
            </div>
          </div>
        </div>

        {fout && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.danger, margin: '4px 4px 0' }}>{fout}</div>}
      </div>
    </div>
  )
}
