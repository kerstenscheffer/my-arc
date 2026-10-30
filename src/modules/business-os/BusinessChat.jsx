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

import { useState, useEffect, useRef } from 'react'
import { ArrowUp, Copy, Check, Mic, Lock, Database, Laptop } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { colors } from '../../ui/tokens'

const KEY = 'business_os_chat'
const PA_ONLINE_MS = 45000
const slaap = (ms) => new Promise(r => setTimeout(r, ms))

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
const bewaarGesprek = (g) => {
  try { localStorage.setItem(KEY, JSON.stringify(g.slice(-40))) } catch { /* privé-venster */ }
}

function Kopieer({ tekst }) {
  const [klaar, setKlaar] = useState(false)
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(tekst).then(() => { setKlaar(true); setTimeout(() => setKlaar(false), 1500) }, () => {})}
      title="Kopieer"
      style={{ background: 'none', border: 'none', color: colors.textSecondary, cursor: 'pointer', padding: 4, display: 'flex' }}
    >
      {klaar ? <Check size={14} color={colors.success} /> : <Copy size={14} />}
    </button>
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
    <div style={{ margin: '4px 0 12px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 800, marginBottom: 4 }}>
        <Lock size={15} /> {opSlot ? 'Op slot zetten' : 'Ontgrendelen'} ({voorstel.klanten.length}){voorstel.tekst ? ` · ${voorstel.tekst}` : ''}
      </div>
      <div style={{ color: colors.textSecondary, fontWeight: 600, marginBottom: 8 }}>
        {voorstel.klanten.map(k => k.naam).join(', ')}
      </div>
      {voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={16} /> {opSlot ? 'Op slot gezet' : 'Ontgrendeld'}
        </div>
      ) : (
        <button
          onClick={voerUit}
          disabled={bezig}
          style={{
            background: colors.textPrimary, color: colors.onAccent, border: 'none', borderRadius: 12,
            padding: '0 16px', minHeight: 44, fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {bezig ? 'Bezig…' : opSlot ? `Zet ${voorstel.klanten.length} op slot` : `Ontgrendel ${voorstel.klanten.length}`}
        </button>
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 6 }}>{fout}</div>}
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
    <div style={{ margin: '4px 0 12px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 800, marginBottom: 4 }}>
        <Database size={15} /> {voorstel.uitleg}
      </div>
      <div style={{ color: colors.textSecondary, fontWeight: 600, marginBottom: 8, wordBreak: 'break-word' }}>
        {voorstel.actie === 'insert'
          ? `${voorstel.aantal} nieuwe rij(en) in ${voorstel.tabel}`
          : <>
              {voorstel.aantal} rij(en) in {voorstel.tabel} waar {voorstel.filters.map(f => `${f.kolom} ${f.op} ${waardeTekst(f.waarde)}`).join(' en ')}
              <br />→ {Object.entries(voorstel.velden).map(([k, v]) => `${k} = ${waardeTekst(v)}`).join(', ')}
            </>}
      </div>
      {voorstel.uitgevoerd ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: colors.success, fontWeight: 800 }}>
          <Check size={16} /> Uitgevoerd
        </div>
      ) : (
        <button
          onClick={voerUit}
          disabled={bezig}
          style={{
            background: colors.textPrimary, color: colors.onAccent, border: 'none', borderRadius: 12,
            padding: '0 16px', minHeight: 44, fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {bezig ? 'Bezig…' : 'Toestaan'}
        </button>
      )}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 6 }}>{fout}</div>}
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
    <div style={{ margin: '4px 0 12px' }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 800, marginBottom: 4 }}>
        <Laptop size={15} /> Code-opdracht
      </div>
      <div style={{ color: colors.textSecondary, fontWeight: 600, marginBottom: 8, whiteSpace: 'pre-wrap' }}>{voorstel.tekst}</div>
      {!id ? (
        <button
          onClick={start}
          style={{
            background: colors.textPrimary, color: colors.onAccent, border: 'none', borderRadius: 12,
            padding: '0 16px', minHeight: 44, fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Uitvoeren op mijn Mac
        </button>
      ) : (
        <div style={{ fontWeight: 800, color: status === 'klaar' ? colors.success : status === 'mislukt' ? colors.danger : colors.textPrimary }}>
          {status === 'klaar' && <Check size={16} style={{ verticalAlign: '-3px', marginRight: 4 }} />}
          {PA_STATUS[status] || 'Versturen…'}
          {hangt && <div style={{ color: colors.textSecondary, fontWeight: 600, marginTop: 4 }}>Draait npm run pa op je Mac?</div>}
        </div>
      )}
      {rij?.resultaat && <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{rij.resultaat}</div>}
      {fout && <div style={{ color: colors.danger, fontWeight: 700, marginTop: 6 }}>{fout}</div>}
    </div>
  )
}

export default function BusinessChat({ context }) {
  const [gesprek, setGesprek] = useState(leesGesprek)
  const [invoer, setInvoer] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)
  const [luistert, setLuistert] = useState(false)
  const lijst = useRef(null)
  const herkenner = useRef(null)

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

  useEffect(() => {
    bewaarGesprek(gesprek)
    if (lijst.current) lijst.current.scrollTop = lijst.current.scrollHeight
  }, [gesprek, bezig])

  const stuur = async () => {
    const vraag = invoer.trim()
    if (!vraag || bezig) return
    herkenner.current?.stop()
    const nieuw = [...gesprek, { role: 'user', content: vraag }]
    setGesprek(nieuw)
    setInvoer('')
    setBezig(true)
    setFout(null)
    const berichten = nieuw.map(({ role, content }) => ({ role, content }))
    const mac = viaMac ? await vraagViaMac(berichten, context) : null
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

  return (
    <div style={{ textAlign: 'left', marginTop: 24 }}>
      {gesprek.length > 0 && (
        <div ref={lijst} style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
          {gesprek.map((b, i) => b.role === 'user' ? (
            <div key={i} style={{
              alignSelf: 'flex-end', maxWidth: '85%', background: colors.surface, borderRadius: 16,
              padding: '8px 12px', fontSize: '0.9rem', fontWeight: 700, color: colors.textPrimary, whiteSpace: 'pre-wrap',
            }}>
              {b.content}
            </div>
          ) : (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.55, color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
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
                    <div key={j} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', color: colors.success, fontWeight: 800, marginBottom: 6 }}>
                      <Check size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {ac.soort === 'app_issue' ? `Op de app-lijst: ${ac.tekst}` : ac.tekst}
                    </div>
                  )
                })}
                {b.content}
              </div>
              <Kopieer tekst={b.content} />
            </div>
          ))}
          {bezig && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.textSecondary }}>Bezig…</div>}
        </div>
      )}
      {fout && <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.danger, marginBottom: 8 }}>{fout}</div>}

      <div title={viaMac ? 'Je Mac beantwoordt (Claude-abonnement)' : 'Via de API (start npm run pa om via je Mac te gaan)'}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 700, color: colors.textSecondary, margin: '0 0 8px 4px' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: viaMac ? colors.success : colors.textMuted }} />
        {viaMac ? 'Via je Mac' : 'Via de API'}
      </div>
      <style>{'@keyframes bos-mic { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5) } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }'}</style>
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 4, background: colors.surface,
        borderRadius: 24, padding: '4px 4px 4px 16px',
      }}>
        <textarea
          value={invoer}
          onChange={e => setInvoer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); stuur() } }}
          placeholder={luistert ? 'Luistert… praat maar' : 'Geef een taak, bv. maak 3 reel-scripts over buikvet na je 30e'}
          rows={1}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            color: colors.textPrimary, fontSize: '0.95rem', fontWeight: 600, padding: '10px 0',
            minHeight: 44, maxHeight: 140, fontFamily: 'inherit',
          }}
        />
        {Spraak && (
          <button
            onClick={microfoon}
            title={luistert ? 'Stop met luisteren' : 'Inspreken'}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
              background: luistert ? colors.danger : 'transparent',
              color: luistert ? colors.textPrimary : colors.textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: luistert ? 'bos-mic 1.2s ease-in-out infinite' : 'none',
            }}
          >
            <Mic size={18} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={stuur}
          disabled={bezig || !invoer.trim()}
          title="Verstuur"
          style={{
            width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0, margin: 2,
            background: invoer.trim() && !bezig ? colors.textPrimary : 'rgba(255,255,255,0.15)',
            color: colors.onAccent, cursor: invoer.trim() && !bezig ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowUp size={18} strokeWidth={3} />
        </button>
      </div>
      {gesprek.length > 0 && (
        <button
          onClick={() => { setGesprek([]); setFout(null) }}
          style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '8px 4px', minHeight: 32 }}
        >
          Nieuw gesprek
        </button>
      )}
    </div>
  )
}
