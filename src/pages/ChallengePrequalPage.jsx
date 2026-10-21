// src/pages/ChallengePrequalPage.jsx
//
// Prekwalificatie voor de 6 Weken Challenge: één vraag per scherm, midden in
// beeld. Vier vragen (doel, vastlopen, geprobeerd, leeftijd), dan "je bent
// geschikt", dan kiezen: zelf inplannen of contact (WhatsApp, bellen, mail).
// De gegevens komen pas aan het eind, op één scherm. Uitkomsten:
//   A  past, zelf inplannen -> Calendly, met naam en e-mail al ingevuld
//   A  past, contact        -> bevestiging "binnen 24 uur app/bel/mail ik je"
//   C  onder 18             -> vriendelijk afgewezen, gratis video
//
// Elke inzending wordt een lead op het bord van Kersten via de
// database-functie submit_challenge_prequal: A in "🎯 Ad lead", C in "Niet
// geschikt". De voorkeur (zelf inplannen of hoe benaderen) staat in de
// kwalificatie Open en in de notities. Boekt iemand in Calendly, dan koppelt
// de Calendly-sync die afspraak via utm_content=lead_<id> aan dezelfde lead.
//
// Werkt los op /challenge/start én in het blad van de VSL (/challenge).

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Instagram, Play } from 'lucide-react'
import db from '../services/DatabaseService'
import { meet, pixel, herkomst, volgTijdOpPagina, metaCookies } from './challengeTracking'
import { VRAGEN, ROUTE_ZELF, ROUTE_CONTACT, vraagtTelefoon } from './challengeVragen'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'

const CALENDLY = 'https://calendly.com/kerstenscheffer/strategie-gesprek-kersten-clone'
const INSTAGRAM = 'https://instagram.com/myarc.nl'
// Gratis waarde aan het eind: de video waarin Kersten uitlegt hoe je 10 kg
// verliest in 16 weken. Ingesloten op de pagina, met een knop naar YouTube.
const GRATIS_VIDEO_ID = 'OLxhzi-QQmQ'
const GRATIS_VIDEO_URL = `https://youtu.be/${GRATIS_VIDEO_ID}`

const utmUitUrl = () => {
  try {
    const q = new URLSearchParams(window.location.search)
    return {
      utm_source: q.get('utm_source') || '', utm_medium: q.get('utm_medium') || '',
      utm_campaign: q.get('utm_campaign') || '', utm_content: q.get('utm_content') || '',
      referrer: document.referrer || '',
    }
  } catch { return {} }
}

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim())
const telOk = (t) => String(t || '').replace(/[^0-9+]/g, '').length >= 8

// Antwoorden omzetten naar wat het bord nodig heeft.
function bouwPayload(antw, uitkomst, afwijsreden, utm) {
  const lijst = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''))
  const voorkeur = antw.route === ROUTE_CONTACT ? `Wil benaderd worden via ${antw.kanaal || '-'}` : 'Plant zelf in'
  const regels = [
    `Prekwalificatie 6 Weken Challenge (${uitkomst === 'A' ? 'past' : uitkomst === 'B' ? 'nog niet het moment' : 'past niet'})`,
    `Leeftijd: ${antw.leeftijd || '-'}`,
    `Doel: ${antw.doel || '-'}`,
    `Loopt vast op: ${lijst(antw.vastlopen) || '-'}`,
    `Al geprobeerd: ${lijst(antw.geprobeerd) || '-'}`,
  ]
  if (uitkomst === 'A') regels.push(voorkeur)
  if (afwijsreden) regels.push(`Afgewezen: ${afwijsreden}`)
  // Alle vragen met hun antwoord, in volgorde: de lead-modal toont dit in
  // de tab Vragen. Niet beantwoord (afgewezen vóór die vraag) = weggelaten.
  const antwoorden = VRAGEN.map(q => {
    if (q.soort === 'info') return null
    const v = q.soort === 'gegevens' ? [antw.voornaam, antw.telefoon, antw.email].filter(Boolean) : antw[q.id]
    const tekst = Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v)).trim()
    return tekst ? { vraag: q.vraag, antwoord: tekst } : null
  }).filter(Boolean)
  return {
    antwoorden,
    uitkomst, afwijsreden: afwijsreden || '',
    voornaam: antw.voornaam || '', email: antw.email || '', telefoon: antw.telefoon || '',
    qual_goal: antw.doel || '',
    qual_pain: [lijst(antw.vastlopen), antw.geprobeerd?.length ? `al geprobeerd: ${lijst(antw.geprobeerd)}` : null].filter(Boolean).join(' · '),
    qual_open: uitkomst === 'A' ? voorkeur : '',
    lead_goal: antw.doel || '', lead_struggle: lijst(antw.vastlopen),
    samenvatting: regels.join('\n'),
    ...utm,
  }
}

// ── Bouwstenen ──────────────────────────────────────────────────────────────
// MY ARC-stijl: dik wit op zwart, geen goud (Kersten, 21 okt 2026).

const WIT = '#fff'
const ZWAK = 'rgba(255,255,255,0.55)'

const knopWit = (m, uit = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  minHeight: m ? 58 : 64, padding: m ? '0 1.4rem' : '0 2rem', width: '100%',
  borderRadius: 14, border: 'none', background: uit ? 'rgba(255,255,255,0.12)' : WIT, color: uit ? ZWAK : '#000',
  fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.01em',
  whiteSpace: 'nowrap', cursor: uit ? 'default' : 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'background 0.15s',
})
const knopZacht = (m) => ({ ...knopWit(m), background: 'rgba(255,255,255,0.08)', color: WIT, border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' })

const invoer = (m) => ({
  width: '100%', boxSizing: 'border-box', padding: m ? '1rem 1rem' : '1.1rem 1.15rem',
  background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12,
  color: WIT, fontSize: m ? '1.05rem' : '1.1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
})

function Optie({ tekst, aan, onClick, m, meer }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        minHeight: m ? 58 : 62, padding: m ? '0.85rem 1rem' : '0.95rem 1.2rem', borderRadius: 14, textAlign: 'left',
        background: aan ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${aan ? WIT : 'rgba(255,255,255,0.15)'}`,
        color: WIT, fontSize: m ? '1.02rem' : '1.08rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {tekst}
      <span style={{
        width: 24, height: 24, flexShrink: 0, borderRadius: meer ? 7 : '50%',
        border: `2px solid ${aan ? WIT : 'rgba(255,255,255,0.3)'}`, background: aan ? WIT : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {aan && <Check size={15} strokeWidth={3.5} color="#000" />}
      </span>
    </button>
  )
}

// ── Het formulier ───────────────────────────────────────────────────────────
// Eén vraag per scherm, midden in beeld, zoals slaap loggen in de app. Geen
// startscherm meer: wie op de knop drukt zit meteen in vraag 1. Eén keuze =
// meteen door; bij meerkeuze en bij de gegevens een knop.

export function PrequalFlow({ m = false, compact = false }) {
  const [stap, setStap] = useState(0)            // index in `pad`, of 'klaar'
  const [antw, setAntw] = useState({})
  const [einde, setEinde] = useState(null)       // { uitkomst, reden, leadId }
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef({ ...utmUitUrl(), ...herkomst() })
  const bovenRef = useRef(null)
  const doorTimer = useRef(null)

  // De schermen die voor deze persoon gelden (kanaal alleen bij contact).
  const pad = VRAGEN.filter(q => !q.alleen || q.alleen(antw))
  const vraag = typeof stap === 'number' ? pad[stap] : null

  useEffect(() => { meet('form_start') }, [])
  useEffect(() => () => clearTimeout(doorTimer.current), [])
  useEffect(() => { bovenRef.current?.scrollIntoView?.({ block: 'start' }) }, [stap])
  // Elke vraag die in beeld komt: "gezien". Met "beantwoord" (form_stap)
  // erbij ziet het Ads-scherm per vraag hoeveel mensen afhaken.
  useEffect(() => {
    if (vraag) meet('form_vraag', { meta: { stap: stap + 1, vraag: vraag.id } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stap, vraag?.id])

  const zet = (id, v) => setAntw(a => ({ ...a, [id]: v }))
  const telefoon = vraagtTelefoon(antw)

  const ingevuld = (q, a = antw) => {
    const v = a[q.id]
    if (q.soort === 'keuze') return v != null && v !== ''
    if (q.soort === 'meerkeuze') return Array.isArray(v) && v.length > 0
    if (q.soort === 'info') return true
    if (q.soort === 'gegevens') {
      if (!String(a.voornaam || '').trim()) return false
      return vraagtTelefoon(a) ? telOk(a.telefoon) : emailOk(a.email)
    }
    return false
  }

  const verstuur = async (uitkomst, reden) => {
    setBezig(true); setFout('')
    try {
      const payload = { ...bouwPayload(antw, uitkomst, reden, utm.current), ...metaCookies() }
      // De database wil een voornaam; wie vóór de gegevens wordt afgewezen
      // heeft die nog niet gegeven.
      if (!payload.voornaam) payload.voornaam = 'Onbekend'
      const { data, error } = await db.supabase.rpc('submit_challenge_prequal', { p: payload })
      if (error) throw error
      setEinde({ uitkomst, reden, leadId: data })
      if (emailOk(antw.email)) db.supabase.rpc('save_prequal_email', { p_email: antw.email, p_lead_id: data, p_uitkomst: uitkomst }).then(r => r, () => null)
      setStap('klaar')
      meet('form_klaar', { meta: { uitkomst, reden: reden || null, vraag: vraag?.id || null, route: antw.route || null, kanaal: antw.kanaal || null }, lead_id: data })
      // Zelfde event_id als de server (Conversions API): Meta telt hem één keer.
      if (uitkomst === 'A') pixel('Lead', { content_name: '6 weken challenge prequal' }, `lead_${data}`)
    } catch (e) {
      console.error('prequal opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const verder = (a = antw) => {
    if (!vraag || !ingevuld(vraag, a) || bezig) return
    const uitkomst = vraag.afwijzen?.(a[vraag.id])
    if (uitkomst) return verstuur(uitkomst, vraag.afwijsTekst || `${vraag.vraag} → ${a[vraag.id]}`)
    meet('form_stap', { meta: { stap: stap + 1, vraag: vraag.id } })
    if (vraag.soort === 'gegevens') return verstuur('A', null)
    setStap(stap + 1)
  }
  // Eén keuze: even laten zien dat hij aanstaat, dan door.
  const kies = (o) => {
    const nieuw = { ...antw, [vraag.id]: o }
    setAntw(nieuw)
    clearTimeout(doorTimer.current)
    doorTimer.current = setTimeout(() => verder(nieuw), 220)
  }
  const terug = () => { clearTimeout(doorTimer.current); if (typeof stap === 'number' && stap > 0) setStap(stap - 1) }

  const kop = (tekst) => (
    <h2 style={{ margin: 0, fontSize: m ? '1.6rem' : '2rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', color: WIT, textAlign: 'center' }}>{tekst}</h2>
  )
  const sub = (tekst) => (
    <p style={{ margin: '0.7rem 0 0', fontSize: m ? '0.98rem' : '1.05rem', fontWeight: 700, color: ZWAK, lineHeight: 1.5, textAlign: 'center' }}>{tekst}</p>
  )

  // Midden in beeld: in het blad de volle hoogte ervan, los de hele pagina.
  const buitenkant = {
    maxWidth: 560, margin: '0 auto', width: '100%', boxSizing: 'border-box',
    ...(compact ? { flex: '1 0 auto' } : { minHeight: 'calc(100dvh - 60px)' }),
    display: 'flex', flexDirection: 'column',
    padding: m ? '1rem 1.25rem 2rem' : '1.5rem 2rem 3rem',
    color: WIT, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }
  const midden = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: m ? '2rem' : '3rem' }

  // De gratis waarde: video ingesloten, met een knop naar YouTube eronder.
  const gratisVideo = (
    <>
      <div style={{ marginTop: '1.6rem', fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, color: WIT, lineHeight: 1.2, textAlign: 'center' }}>Zo verlies je 10 kg in 16 weken</div>
      <div style={{ marginTop: '0.8rem', position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
        <iframe
          src={appSafeEmbedUrl(`https://www.youtube-nocookie.com/embed/${GRATIS_VIDEO_ID}?rel=0&playsinline=1`)}
          title="Zo verlies je 10 kg in 16 weken"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
        />
      </div>
      <a href={GRATIS_VIDEO_URL} target="_blank" rel="noopener noreferrer" onClick={() => meet('gratis_video', { meta: { uitkomst: einde?.uitkomst || null } })} style={{ ...knopWit(m), marginTop: '1rem', textDecoration: 'none' }}>
        <Play size={22} strokeWidth={2.6} /> Bekijk op YouTube
      </a>
      <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ ...knopZacht(m), marginTop: '0.7rem' }}><Instagram size={22} strokeWidth={2.4} /> Volg op Instagram</a>
    </>
  )

  // ── Eindschermen ──
  if (stap === 'klaar' && einde) {
    const naam = antw.voornaam || ''
    if (einde.uitkomst === 'A' && antw.route === ROUTE_ZELF) {
      const url = `${CALENDLY}?embed_domain=${encodeURIComponent(window.location.hostname)}&embed_type=Inline&hide_gdpr_banner=1&hide_event_type_details=1&background_color=0a0a0a&text_color=ffffff&primary_color=ffffff`
        + `&name=${encodeURIComponent(naam)}&email=${encodeURIComponent(antw.email || '')}`
        + `&utm_content=${encodeURIComponent(`lead_${einde.leadId}`)}`
        + (utm.current.utm_source ? `&utm_source=${encodeURIComponent(utm.current.utm_source)}` : '')
        + (utm.current.utm_campaign ? `&utm_campaign=${encodeURIComponent(utm.current.utm_campaign)}` : '')
      return (
        <div style={{ ...buitenkant, maxWidth: 1000, paddingBottom: 0 }}>
          <div ref={bovenRef} />
          {kop(`Top ${naam}, kies een moment.`)}
          {sub('Je naam en e-mail staan al ingevuld.')}
          <div style={{ marginTop: '1.2rem', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', height: m ? 'min(78vh, 820px)' : 760 }}>
            <iframe src={url} title="Kennismaking plannen" style={{ width: '100%', height: '100%', border: 0, background: '#0a0a0a' }} />
          </div>
        </div>
      )
    }
    if (einde.uitkomst === 'A') {
      const via = antw.kanaal === 'Bellen' ? 'bel ik je' : antw.kanaal === 'E-mail' ? 'mail ik je' : 'app ik je'
      return (
        <div style={buitenkant}>
          <div ref={bovenRef} />
          <div style={midden}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
              <Check size={34} strokeWidth={3.2} color="#000" />
            </div>
            {kop(`Top ${naam}, je staat erop.`)}
            {sub(`Binnen 24 uur ${via} om de challenge door te nemen.`)}
          </div>
        </div>
      )
    }
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} />
        <div style={midden}>
          {kop('Dank je voor het invullen.')}
          {sub('De challenge is vanaf 18 jaar. Wel heb ik deze video voor je, waarin ik uitleg hoe je 10 kg verliest in 16 weken.')}
          {gratisVideo}
        </div>
      </div>
    )
  }

  if (!vraag) return null

  // ── Vraag ──
  const klaar = ingevuld(vraag)
  const totaal = pad.length
  const nummer = stap + 1
  const meteenDoor = vraag.soort === 'keuze'

  return (
    <div style={buitenkant}>
      <div ref={bovenRef} />
      {/* Voortgang: terug, balk, en hoeveel er nog komt. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={terug} aria-label="Terug" disabled={stap === 0} style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: WIT, cursor: stap === 0 ? 'default' : 'pointer', opacity: stap === 0 ? 0 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <ArrowLeft size={18} strokeWidth={2.8} />
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
          <div style={{ width: `${(nummer / totaal) * 100}%`, height: '100%', background: WIT, borderRadius: 3, transition: 'width 0.35s ease' }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: WIT, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{nummer}/{totaal}</span>
      </div>

      <div key={vraag.id} style={{ ...midden, animation: 'prequalIn 0.25s ease' }}>
        {vraag.soort === 'info' ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
              <Check size={34} strokeWidth={3.2} color="#000" />
            </div>
            {kop(vraag.vraag)}
            {sub('Op basis van je antwoorden past de 6 Weken Challenge bij jou. Nog twee korte stappen.')}
          </>
        ) : (
          <>
            {kop(vraag.vraag)}
            {vraag.hint && sub(vraag.hint)}
          </>
        )}

        <div style={{ marginTop: '1.6rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {vraag.soort === 'keuze' && vraag.opties.map(o => (
            <Optie key={o} tekst={o} aan={antw[vraag.id] === o} m={m} onClick={() => kies(o)} />
          ))}
          {vraag.soort === 'meerkeuze' && vraag.opties.map(o => {
            const huidig = Array.isArray(antw[vraag.id]) ? antw[vraag.id] : []
            const aan = huidig.includes(o)
            return <Optie key={o} tekst={o} aan={aan} meer m={m} onClick={() => zet(vraag.id, aan ? huidig.filter(x => x !== o) : [...huidig, o])} />
          })}
          {vraag.soort === 'gegevens' && (
            <>
              <input
                autoFocus autoComplete="given-name" value={antw.voornaam || ''} placeholder="Je voornaam"
                onChange={e => zet('voornaam', e.target.value)} style={invoer(m)}
              />
              {telefoon ? (
                <input
                  type="tel" inputMode="tel" autoComplete="tel" value={antw.telefoon || ''}
                  placeholder={antw.kanaal === 'WhatsApp' ? 'Telefoonnummer (WhatsApp)' : 'Telefoonnummer'}
                  onChange={e => zet('telefoon', e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') verder() }} style={invoer(m)}
                />
              ) : (
                <input
                  type="email" inputMode="email" autoComplete="email" value={antw.email || ''} placeholder="jouw@email.nl"
                  onChange={e => zet('email', e.target.value.trim())}
                  onKeyDown={e => { if (e.key === 'Enter') verder() }} style={invoer(m)}
                />
              )}
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45, textAlign: 'center', marginTop: '0.2rem' }}>
                {antw.route === ROUTE_CONTACT ? 'Door te versturen ga je akkoord dat Kersten contact met je opneemt. ' : 'Geen spam. '}
                Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: WIT }}>privacyverklaring</a>.
              </div>
            </>
          )}
        </div>

        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}

        {!meteenDoor && (
          <button onClick={() => verder()} disabled={!klaar || bezig} style={{ ...knopWit(m, !klaar || bezig), marginTop: '1.4rem' }}>
            {bezig ? 'Even geduld…'
              : vraag.soort === 'info' ? 'Verder'
              : vraag.soort === 'gegevens' ? (antw.route === ROUTE_ZELF ? 'Naar de agenda' : 'Versturen')
              : 'Volgende'}
            {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
          </button>
        )}
        {meteenDoor && bezig && <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: ZWAK }}>Even geduld…</div>}
      </div>
      <style>{'@keyframes prequalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }'}</style>
    </div>
  )
}

// ── Losse pagina ────────────────────────────────────────────────────────────

export default function ChallengePrequalPage() {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  useEffect(() => {
    const check = () => setM(window.innerWidth <= 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => { meet('bezoek'); return volgTijdOpPagina() }, [])
  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: `calc(env(safe-area-inset-top, 0px) + ${m ? '0.7rem' : '0.9rem'}) 1rem ${m ? '0.7rem' : '0.9rem'}`, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: m ? '0.45rem 0.85rem' : '0.5rem 1.1rem', borderRadius: 6, background: '#fff', color: '#000', fontSize: m ? '0.66rem' : '0.74rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          Gratis 6 Weken Challenge | Online coaching
        </span>
      </div>
      <PrequalFlow m={m} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        body { background: #000; margin: 0; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.35); }
      `}</style>
    </div>
  )
}
