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
// Compact (30 okt): ingeklapt een smal, laag berichtenvak (560 px, max 220 px
// hoog) onder de ring; de knop rechtsboven klapt hem uit (860 px, 70% van het
// scherm). Stand in localStorage 'bos_chat_open'. Alleen het berichtenvak scrolt.

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { ArrowUp, Copy, Check, Mic, Lock, Database, Laptop, ImagePlus, X, Maximize2, Minimize2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const KEY = 'business_os_chat'
const OPEN_KEY = 'bos_chat_open'
const PA_ONLINE_MS = 45000
const MAX_BEELDEN = 3 // zoveel recente screenshots gaan mee naar de AI
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
async function vraagViaMac(berichten, context) {
  const { data: rij, error } = await supabase.from('business_os_opdrachten')
    .insert({ soort: 'chat', opdracht: berichten[berichten.length - 1].content.slice(0, 500), invoer: { berichten, context } })
    .select('id').single()
  if (error) return null
  const start = Date.now()
  for (;;) {
    await slaap(1500)
    const { data } = await supabase.from('business_os_opdrachten')
      .select('status, antwoord').eq('id', rij.id).maybeSingle()
    if (data?.status === 'klaar' || data?.status === 'mislukt') return data.antwoord?.tekst ? data.antwoord : null
    if (data?.status === 'wacht' && Date.now() - start > 25000) {
      // Niet opgepakt: intrekken (alleen als hij nog op 'wacht' staat) en via de API.
      const { data: ingetrokken } = await supabase.from('business_os_opdrachten')
        .update({ status: 'mislukt' }).eq('id', rij.id).eq('status', 'wacht').select('id')
      if (ingetrokken?.length) return null
    }
    if (Date.now() - start > 5 * 60 * 1000) return null
  }
}
const Spraak = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

const leesGesprek = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}
// Volle afbeeldingen niet in localStorage (te groot), alleen de thumbnail.
const bewaarGesprek = (g) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(g.slice(-40).map(b => {
      if (!b.afbeelding) return b
      const kopie = { ...b }
      delete kopie.afbeelding
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

// Voorstel van de AI om accounts op slot te zetten of te ontgrendelen. Pas deze
// knop voert het uit, met dezelfde velden als de slotknop in Coach Inzicht
// (CoachingPeriodPanel.wisselSlot).
function SlotVoorstel({ voorstel, onKlaar }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const opSlot = voorstel.actie === 'op_slot'
  const voerUit = async () => {
    setBezig(true)
    setFout(null)
    const payload = opSlot
      ? { account_locked_at: new Date().toISOString(), account_locked_reason: voorstel.tekst || null, coaching_status: 'ended', coaching_paused_at: null, coaching_pause_reason: null }
      : { account_locked_at: null, account_locked_reason: null }
    const { error } = await supabase.from('clients').update(payload).in('id', voorstel.klanten.map(k => k.id))
    setBezig(false)
    if (error) { setFout('Opslaan mislukt: ' + error.message); return }
    onKlaar()
  }
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
        <button onClick={voerUit} disabled={bezig} style={KNOP}>
          {bezig ? 'Bezig…' : opSlot ? `Zet ${voorstel.klanten.length} op slot` : `Ontgrendel ${voorstel.klanten.length}`}
        </button>
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 4 }}>{fout}</div>}
    </div>
  )
}

// Voorstel van de AI om data aan te passen (stel_wijziging_voor). De AI heeft
// het aantal rijen al geteld; deze knop voert het uit met Kerstens eigen
// rechten (RLS), dus nooit meer dan hij zelf in de app zou mogen.
const waardeTekst = (v) => v === null ? 'leeg' : typeof v === 'object' ? JSON.stringify(v) : String(v)

function WijzigingVoorstel({ voorstel, onKlaar }) {
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const voerUit = async () => {
    setBezig(true)
    setFout(null)
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
    setBezig(false)
    if (error) { setFout('Mislukt: ' + error.message); return }
    onKlaar()
  }
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Database size={13} /> {voorstel.uitleg}
      </div>
      <div style={{ ...KAART_SUB, wordBreak: 'break-word' }}>
        {voorstel.actie === 'insert'
          ? `${voorstel.aantal} nieuwe rij(en) in ${voorstel.tabel}`
          : <>
              {voorstel.aantal} rij(en) in {voorstel.tabel} waar {voorstel.filters.map(f => `${f.kolom} ${f.op} ${waardeTekst(f.waarde)}`).join(' en ')}
              <br />→ {Object.entries(voorstel.velden).map(([k, v]) => `${k} = ${waardeTekst(v)}`).join(', ')}
            </>}
      </div>
      {voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={14} /> Uitgevoerd
        </div>
      ) : (
        <button onClick={voerUit} disabled={bezig} style={KNOP}>
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

function PaVoorstel({ voorstel, onGestart }) {
  const [rij, setRij] = useState(null)
  const [fout, setFout] = useState(null)
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

  const start = async () => {
    setFout(null)
    const { data, error } = await supabase.from('business_os_opdrachten')
      .insert({ opdracht: voorstel.tekst }).select('id').single()
    if (error) { setFout('Starten mislukt: ' + error.message); return }
    onGestart(data.id)
  }

  const status = rij?.status
  const hangt = status === 'wacht' && rij && Date.now() - new Date(rij.created_at).getTime() > 20000
  return (
    <div style={KAART}>
      <div style={KAART_KOP}>
        <Laptop size={13} /> Code-opdracht
      </div>
      <div style={KAART_SUB}><Inkort tekst={voorstel.tekst} /></div>
      {!id ? (
        <button onClick={start} style={KNOP}>
          Uitvoeren op mijn Mac
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

export default function BusinessChat({ context, onBezig }) {
  const [gesprek, setGesprek] = useState(leesGesprek)
  const [invoer, setInvoer] = useState('')
  const [bijlage, setBijlage] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [groot, setGroot] = useState(() => { try { return localStorage.getItem(OPEN_KEY) === '1' } catch { return false } })
  const wisselGroot = () => setGroot(g => {
    try { localStorage.setItem(OPEN_KEY, g ? '0' : '1') } catch { /* privé-venster */ }
    return !g
  })
  // Laat de pagina meekijken (de reactor-ring versnelt zolang de AI denkt).
  useEffect(() => { onBezig?.(bezig) }, [bezig, onBezig])
  const [fout, setFout] = useState(null)
  const [luistert, setLuistert] = useState(false)
  const lijst = useRef(null)
  const herkenner = useRef(null)
  const kiezer = useRef(null)

  useEffect(() => () => herkenner.current?.abort(), [])

  // Draait de PA op de Mac? (hartslag elke 15 s)
  const [viaMac, setViaMac] = useState(false)
  useEffect(() => {
    let weg = false
    const kijk = () => supabase.from('business_os_pa_status').select('laatst_gezien').maybeSingle()
      .then(({ data }) => { if (!weg) setViaMac(!!data && Date.now() - new Date(data.laatst_gezien).getTime() < PA_ONLINE_MS) }, () => {})
    kijk()
    const t = setInterval(kijk, 15000)
    return () => { weg = true; clearInterval(t) }
  }, [])

  const microfoon = () => {
    if (luistert) { herkenner.current?.stop(); return }
    const h = new Spraak()
    h.lang = 'nl-NL'
    h.continuous = true
    h.interimResults = true
    // Wat er al stond blijft staan; het gesprokene komt erachter.
    const basis = invoer.trim() ? invoer.trim() + ' ' : ''
    h.onresult = (e) => {
      const tekst = Array.from(e.results).map(r => r[0].transcript).join('')
      setInvoer(basis + tekst)
    }
    h.onerror = (e) => { if (e.error !== 'aborted' && e.error !== 'no-speech') setFout('Microfoon werkt niet: ' + e.error) }
    h.onend = () => setLuistert(false)
    herkenner.current = h
    setFout(null)
    h.start()
    setLuistert(true)
  }

  const neemBeeld = async (bestand) => {
    if (!bestand || !bestand.type?.startsWith('image/')) return
    try {
      setFout(null)
      setBijlage(await verklein(bestand))
    } catch (e) {
      setFout(e.message || 'Afbeelding kon niet gelezen worden')
    }
  }
  const plak = (e) => {
    const item = Array.from(e.clipboardData?.items || []).find(it => it.type.startsWith('image/'))
    if (!item) return
    e.preventDefault()
    neemBeeld(item.getAsFile())
  }

  useEffect(() => {
    bewaarGesprek(gesprek)
    if (lijst.current) lijst.current.scrollTop = lijst.current.scrollHeight
  }, [gesprek, bezig, groot])

  const stuur = async () => {
    const vraag = invoer.trim()
    if ((!vraag && !bijlage) || bezig) return
    herkenner.current?.stop()
    const nieuwBericht = { role: 'user', content: vraag }
    if (bijlage) {
      nieuwBericht.afbeelding = { media_type: bijlage.media_type, data: bijlage.data }
      nieuwBericht.thumb = bijlage.thumb
    }
    const nieuw = [...gesprek, nieuwBericht]
    setGesprek(nieuw)
    setInvoer('')
    setBijlage(null)
    setBezig(true)
    setFout(null)
    // Alleen de laatste paar screenshots meesturen; oudere gaan als tekst.
    let beelden = 0
    const berichten = nieuw.map(({ role, content, afbeelding }) => ({ role, content, afbeelding }))
      .reverse()
      .map(b => (b.afbeelding && b.afbeelding.data && beelden++ < MAX_BEELDEN)
        ? b
        : { role: b.role, content: b.content })
      .reverse()
    const metBeeld = berichten.some(b => b.afbeelding)
    const mac = viaMac && !metBeeld ? await vraagViaMac(berichten, context) : null
    if (mac) {
      setBezig(false)
      setGesprek(g => [...g, { role: 'assistant', content: mac.tekst, acties: mac.acties || [] }])
      return
    }
    const { data, error } = await supabase.functions.invoke('business-os-chat', { body: { berichten, context } })
    setBezig(false)
    if (error || data?.error || !data?.tekst) {
      setFout(data?.error || 'AI gaf geen antwoord, probeer opnieuw.')
      return
    }
    setGesprek(g => [...g, { role: 'assistant', content: data.tekst, acties: data.acties || [] }])
  }

  const kanSturen = (invoer.trim() || bijlage) && !bezig
  const rondeKnop = {
    width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }

  return (
    <div style={{
      textAlign: 'left', marginTop: 8, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column',
      width: '100%', maxWidth: groot ? 860 : 560, marginLeft: 'auto', marginRight: 'auto', position: 'relative',
    }}>
      <button onClick={wisselGroot} title={groot ? 'Chat inklappen' : 'Chat uitklappen'} aria-expanded={groot} style={{
        position: 'absolute', top: 0, right: 0, zIndex: 2, width: 28, height: 28, borderRadius: 8,
        border: `1px solid ${colors.success}40`, background: '#000', color: colors.success, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
      }}>
        {groot ? <Minimize2 size={14} strokeWidth={2.5} /> : <Maximize2 size={14} strokeWidth={2.5} />}
      </button>
      <div ref={lijst} style={{
        flex: '0 1 auto', minHeight: 0, maxHeight: groot ? '70dvh' : 'min(30dvh, 220px)',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        display: 'flex', flexDirection: 'column', gap: 6, padding: '0 34px 6px 0',
      }}>
        {gesprek.map((b, i) => b.role === 'user' ? (
          <div key={i} style={{
            alignSelf: 'flex-end', maxWidth: '85%', background: colors.surface, borderRadius: 14,
            padding: '4px 9px', ...TEKST, fontWeight: 700, color: colors.textPrimary, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {b.thumb && (
              <img src={b.thumb} alt="Screenshot" style={{
                display: 'block', maxWidth: 160, maxHeight: 120, borderRadius: 8, marginBottom: b.content ? 4 : 0,
              }} />
            )}
            {b.content}
          </div>
        ) : (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0, ...TEKST, fontWeight: 500, color: colors.textPrimary }}>
              {(b.acties || []).map((ac, j) => {
                const klaar = () => setGesprek(g => g.map((m, mi) => mi !== i ? m : {
                  ...m, acties: m.acties.map((x, xi) => xi === j ? { ...x, uitgevoerd: true } : x),
                }))
                if (ac.soort === 'slot_voorstel') return <SlotVoorstel key={j} voorstel={ac} onKlaar={klaar} />
                if (ac.soort === 'wijziging_voorstel') return <WijzigingVoorstel key={j} voorstel={ac} onKlaar={klaar} />
                if (ac.soort === 'pa_voorstel') {
                  const gestart = (opdrachtId) => setGesprek(g => g.map((m, mi) => mi !== i ? m : {
                    ...m, acties: m.acties.map((x, xi) => xi === j ? { ...x, opdrachtId } : x),
                  }))
                  return <PaVoorstel key={j} voorstel={ac} onGestart={gestart} />
                }
                return (
                  <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: colors.success, fontWeight: 800, fontSize: '0.8rem', marginBottom: 4 }}>
                    <Check size={13} style={{ flexShrink: 0, marginTop: 2 }} /> {ac.soort === 'app_issue' ? `Op de app-lijst: ${ac.tekst}` : ac.tekst}
                  </div>
                )
              })}
              <Inkort tekst={b.content} />
            </div>
            <Kopieer tekst={b.content} />
          </div>
        ))}
        {bezig && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.textSecondary }}>Bezig…</div>}
      </div>

      <div style={{ flexShrink: 0 }}>
        {fout && <div style={{ fontSize: '0.78rem', fontWeight: 700, color: colors.danger, marginBottom: 6 }}>{fout}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', fontWeight: 700, color: colors.textSecondary, margin: '0 0 6px 4px' }}>
          <span title={viaMac ? 'Je Mac beantwoordt (Claude-abonnement)' : 'Via de API (start npm run pa om via je Mac te gaan)'}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: viaMac ? colors.success : colors.textMuted }} />
            {viaMac ? 'Via je Mac' : 'Via de API'}
          </span>
          {gesprek.length > 0 && (
            <button
              onClick={() => { setGesprek([]); setFout(null) }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: colors.textSecondary, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '0 4px', fontFamily: 'inherit' }}
            >
              Nieuw gesprek
            </button>
          )}
        </div>
        {bijlage && (
          <div style={{ position: 'relative', display: 'inline-block', margin: '0 0 6px 4px' }}>
            <img src={bijlage.thumb} alt="Screenshot om mee te sturen" style={{ display: 'block', height: 56, borderRadius: 8 }} />
            <button onClick={() => setBijlage(null)} title="Weghalen" style={{
              position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%',
              border: 'none', background: colors.textPrimary, color: colors.onAccent, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
            }}>
              <X size={13} strokeWidth={3} />
            </button>
          </div>
        )}
        <style>{'@keyframes bos-mic { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5) } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }'}</style>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 2, background: colors.surface,
          borderRadius: 22, padding: '2px 2px 2px 14px',
        }}>
          <textarea
            value={invoer}
            onChange={e => setInvoer(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stuur() } }}
            onPaste={plak}
            placeholder={luistert ? 'Luistert… praat maar' : 'Geef een taak of plak een screenshot'}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
              color: colors.textPrimary, fontSize: '0.85rem', fontWeight: 600, padding: '8px 0',
              minHeight: 36, maxHeight: 120, fontFamily: 'inherit',
            }}
          />
          <input ref={kiezer} type="file" accept="image/*" hidden
            onChange={e => { neemBeeld(e.target.files?.[0]); e.target.value = '' }} />
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
  )
}
