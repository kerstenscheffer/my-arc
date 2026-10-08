// src/pages/ChallengePrequalPage.jsx
//
// Prekwalificatie voor de 6 Weken Challenge: tien korte vragen, één per
// scherm, vóór iemand een kennismaking inplant. Drie uitkomsten:
//   A  past          -> Calendly, met naam en e-mail al ingevuld
//   B  nog niet      -> gratis content en Instagram
//   C  past niet     -> vriendelijk afgewezen, link naar gratis content
//
// Elke inzending wordt een lead op het bord van Kersten via de
// database-functie submit_challenge_prequal: A in "Call voorgesteld", B en
// C in "Niet geschikt". De antwoorden landen in de kwalificatievelden
// (Doel, Pijn, Urgentie, Open) en als samenvatting in de notities. Boekt
// iemand daarna in Calendly, dan koppelt api/calendly-webhook.js die
// afspraak via utm_content=lead_<id> aan dezelfde lead en schuift hem
// naar "Sales Call".
//
// Werkt los op /challenge/start én in het blad van de VSL (/challenge).

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Instagram, Gift } from 'lucide-react'
import db from '../services/DatabaseService'
import { meet, pixel, herkomst, volgTijdOpPagina } from './challengeTracking'

const GOLD = '#FFD700'
const GOUD_KNOP = 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
const CALENDLY = 'https://calendly.com/kerstenscheffer/strategie-gesprek-kersten-clone'
const INSTAGRAM = 'https://instagram.com/myarc.nl'
const GRATIS_CONTENT = '/7secrets'

// ── De vragen ───────────────────────────────────────────────────────────────
//
// `soort`: tekst | keuze | meerkeuze | lang | schaal | contact
// `afwijzen(antwoord)` geeft 'B' of 'C' terug als deze keuze het einde is.
const VRAGEN = [
  { id: 'voornaam', soort: 'tekst', vraag: 'Wat is je voornaam?', placeholder: 'Je voornaam' },
  {
    id: 'leeftijd', soort: 'keuze', vraag: 'Hoe oud ben je?',
    opties: ['Onder 18', '18–24', '25–34', '35–44', '45–54', '55+'],
    afwijzen: (a) => (a === 'Onder 18' ? 'C' : null),
  },
  {
    id: 'doel', soort: 'keuze', vraag: 'Wat wil je de komende 6 weken het liefst bereiken?',
    opties: ['Buikvet kwijt', 'Vet verliezen en sterker worden', 'Spieren opbouwen', 'Fitter en meer energie'],
  },
  {
    id: 'kilos', soort: 'keuze', vraag: 'Hoeveel kilo wil je ongeveer kwijt?',
    opties: ['Niks, ik wil vooral sterker worden', '0–5', '5–10', '10–20', '20+'],
  },
  {
    id: 'vastlopen', soort: 'meerkeuze', vraag: 'Waar loop je nu het meest op vast?', hint: 'Meerdere antwoorden mogelijk',
    opties: ["'s Avonds snaaien", 'Weekenden en sociale momenten', 'Ik weet niet wat en hoeveel ik moet eten', 'Ik train, maar zie geen resultaat', 'Ik hou het een paar weken vol en dan stopt het', 'Te weinig tijd'],
  },
  {
    id: 'geprobeerd', soort: 'meerkeuze', vraag: 'Wat heb je al geprobeerd?', hint: 'Meerdere antwoorden mogelijk',
    opties: ['Zelf diëten', 'Calorieën tellen met een app', 'Personal trainer', 'Online coach', 'Nog niks'],
  },
  { id: 'waarom_nu', soort: 'lang', vraag: 'Waarom wil je dit juist nú aanpakken?', placeholder: 'Vertel kort wat er speelt' },
  {
    id: 'belang', soort: 'schaal', vraag: 'Hoe belangrijk is het voor je om dit de komende 6 weken op te lossen?',
    hint: '1 = niet zo belangrijk, 10 = heel belangrijk',
    afwijzen: (a) => (Number(a) <= 5 ? 'B' : null),
  },
  {
    id: 'trainen', soort: 'keuze', vraag: 'Hoe vaak per week kun je realistisch trainen?',
    opties: ['0–1x', '2x', '3x', '4x of meer'],
    afwijzen: (a) => (a === '0–1x' ? 'B' : null),
    afwijsTekst: 'Voor de challenge is minimaal 2x per week trainen nodig.',
  },
  {
    id: 'borg', soort: 'keuze', vraag: 'De challenge werkt met een borg die je terugkrijgt als je je aan de afspraken houdt. Sta je daarvoor open?',
    opties: ['Ja', 'Ik wil er eerst meer over horen', 'Nee'],
    afwijzen: (a) => (a === 'Nee' ? 'C' : null),
  },
  { id: 'contact', soort: 'contact', vraag: 'Waar kan ik je bereiken?' },
]

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
  const regels = [
    `Prekwalificatie 6 Weken Challenge (${uitkomst === 'A' ? 'past' : uitkomst === 'B' ? 'nog niet het moment' : 'past niet'})`,
    `Leeftijd: ${antw.leeftijd || '-'}`,
    `Doel: ${antw.doel || '-'} · Kilo's kwijt: ${antw.kilos || '-'}`,
    `Loopt vast op: ${lijst(antw.vastlopen) || '-'}`,
    `Al geprobeerd: ${lijst(antw.geprobeerd) || '-'}`,
    `Waarom nu: ${antw.waarom_nu || '-'}`,
    `Belang (1-10): ${antw.belang || '-'} · Trainen: ${antw.trainen || '-'} · Borg: ${antw.borg || '-'}`,
  ]
  if (afwijsreden) regels.push(`Afgewezen: ${afwijsreden}`)
  return {
    uitkomst, afwijsreden: afwijsreden || '',
    voornaam: antw.voornaam || '', email: antw.email || '', telefoon: antw.telefoon || '',
    qual_goal: [antw.doel, antw.kilos ? `${antw.kilos} kg kwijt` : null].filter(Boolean).join(' · '),
    qual_pain: [lijst(antw.vastlopen), antw.geprobeerd?.length ? `al geprobeerd: ${lijst(antw.geprobeerd)}` : null].filter(Boolean).join(' · '),
    qual_urgency: [antw.waarom_nu, antw.belang ? `belang ${antw.belang}/10` : null].filter(Boolean).join(' · '),
    qual_open: [antw.borg ? `borg: ${antw.borg}` : null, antw.trainen ? `trainen: ${antw.trainen}` : null].filter(Boolean).join(' · '),
    lead_goal: antw.doel || '', lead_struggle: lijst(antw.vastlopen),
    waarom_nu: antw.waarom_nu || '',
    samenvatting: regels.join('\n'),
    ...utm,
  }
}

// ── Bouwstenen ──────────────────────────────────────────────────────────────

const knopGoud = (m, uit = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  minHeight: m ? 58 : 64, padding: m ? '0 1.4rem' : '0 2rem', width: '100%',
  borderRadius: 14, border: 'none', background: GOLD, color: '#000',
  fontSize: m ? '1.05rem' : '1.2rem', fontWeight: 900, letterSpacing: '0.03em', textTransform: 'uppercase',
  whiteSpace: 'nowrap', WebkitTextStroke: '0.5px #000',
  cursor: uit ? 'default' : 'pointer', opacity: uit ? 0.45 : 1, fontFamily: 'inherit',
  boxShadow: 'none',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})

const invoer = (m) => ({
  width: '100%', boxSizing: 'border-box', padding: m ? '0.95rem 1rem' : '1.05rem 1.15rem',
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12,
  color: '#fff', fontSize: m ? '1.05rem' : '1.1rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none',
})

function Optie({ tekst, aan, onClick, m, meer }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: m ? '0.9rem 1rem' : '1rem 1.2rem', borderRadius: 12, textAlign: 'left',
        background: aan ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1.5px solid ${aan ? GOLD : 'rgba(255,255,255,0.15)'}`,
        color: '#fff', fontSize: m ? '1rem' : '1.05rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      {tekst}
      <span style={{
        width: 24, height: 24, flexShrink: 0, borderRadius: meer ? 6 : '50%',
        border: `2px solid ${aan ? GOLD : 'rgba(255,255,255,0.3)'}`, background: aan ? GOLD : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {aan && <Check size={15} strokeWidth={3.5} color="#000" />}
      </span>
    </button>
  )
}

// ── Het formulier ───────────────────────────────────────────────────────────

export function PrequalFlow({ m = false, compact = false }) {
  const [stap, setStap] = useState(-1)           // -1 = welkom, 0..n = vraag, 'klaar'
  const [antw, setAntw] = useState({})
  const [einde, setEinde] = useState(null)       // { uitkomst, reden, leadId }
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef({ ...utmUitUrl(), ...herkomst() })
  const bovenRef = useRef(null)

  useEffect(() => { bovenRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }) }, [stap])

  const vraag = stap >= 0 && stap < VRAGEN.length ? VRAGEN[stap] : null
  const zet = (id, v) => setAntw(a => ({ ...a, [id]: v }))

  const ingevuld = (q) => {
    const v = antw[q.id]
    if (q.soort === 'tekst' || q.soort === 'lang') return String(v || '').trim().length > 0
    if (q.soort === 'keuze' || q.soort === 'schaal') return v != null && v !== ''
    if (q.soort === 'meerkeuze') return Array.isArray(v) && v.length > 0
    if (q.soort === 'contact') return emailOk(antw.email) && telOk(antw.telefoon) && antw.akkoord === true
    return false
  }

  const verstuur = async (uitkomst, reden) => {
    setBezig(true); setFout('')
    try {
      const payload = bouwPayload(antw, uitkomst, reden, utm.current)
      const { data, error } = await db.supabase.rpc('submit_challenge_prequal', { p: payload })
      if (error) throw error
      setEinde({ uitkomst, reden, leadId: data })
      setStap('klaar')
      meet('form_klaar', { meta: { uitkomst, reden: reden || null }, lead_id: data })
      if (uitkomst === 'A') pixel('Lead', { content_name: '6 weken challenge prequal' })
    } catch (e) {
      console.error('prequal opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const verder = () => {
    if (!vraag || !ingevuld(vraag)) return
    const uitkomst = vraag.afwijzen?.(antw[vraag.id])
    if (uitkomst) {
      // Afgewezen vóór de contactvraag: we hebben dan geen e-mail, maar wel
      // een naam en de antwoorden. Alleen opslaan als er een naam is.
      return verstuur(uitkomst, vraag.afwijsTekst || `${vraag.vraag} → ${antw[vraag.id]}`)
    }
    if (stap === VRAGEN.length - 1) return verstuur('A', null)
    meet('form_stap', { meta: { stap: stap + 1, vraag: vraag.id } })
    setStap(stap + 1)
  }
  const terug = () => setStap(stap <= 0 ? -1 : stap - 1)

  const kop = (tekst) => (
    <h2 style={{ margin: 0, fontSize: m ? '1.35rem' : '1.7rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', color: '#fff', textTransform: 'uppercase' }}>{tekst}</h2>
  )
  const sub = (tekst) => (
    <p style={{ margin: '0.6rem 0 0', fontSize: m ? '0.95rem' : '1.02rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{tekst}</p>
  )

  const buitenkant = {
    maxWidth: 640, margin: '0 auto', width: '100%',
    padding: compact ? (m ? '1.2rem 1.1rem 2rem' : '1.6rem 1.6rem 2.4rem') : (m ? '1.5rem 1.25rem 4rem' : '3rem 2rem 5rem'),
    color: '#fff', fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }

  // ── Welkom ──
  if (stap === -1) {
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} />
        <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', marginBottom: '0.8rem' }}>Gratis 6 Weken Challenge</div>
        {kop('Past de 6 Weken Challenge bij jou?')}
        {sub('Beantwoord 10 korte vragen (2 minuten). Past het, dan plan je direct je kennismaking met mij in.')}
        <button onClick={() => { setStap(0); meet('form_start') }} style={{ ...knopGoud(m), marginTop: '1.6rem' }}>
          Start de vragen <ArrowRight size={22} strokeWidth={2.6} />
        </button>
      </div>
    )
  }

  // ── Eindschermen ──
  if (stap === 'klaar' && einde) {
    const naam = antw.voornaam || ''
    if (einde.uitkomst === 'A') {
      const url = `${CALENDLY}?embed_domain=${encodeURIComponent(window.location.hostname)}&embed_type=Inline&hide_gdpr_banner=1&hide_event_type_details=1&background_color=0a0a0a&text_color=ffffff&primary_color=ffd700`
        + `&name=${encodeURIComponent(naam)}&email=${encodeURIComponent(antw.email || '')}`
        + `&utm_content=${encodeURIComponent(`lead_${einde.leadId}`)}`
        + (utm.current.utm_source ? `&utm_source=${encodeURIComponent(utm.current.utm_source)}` : '')
        + (utm.current.utm_campaign ? `&utm_campaign=${encodeURIComponent(utm.current.utm_campaign)}` : '')
      return (
        <div style={{ ...buitenkant, maxWidth: 1000, paddingBottom: 0 }}>
          <div ref={bovenRef} />
          {kop(`Top ${naam}, dit past goed.`)}
          {sub('Kies hieronder een moment voor je kennismaking. Je naam en e-mail staan al ingevuld.')}
          <div style={{ marginTop: '1.2rem', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#0a0a0a', height: m ? 'min(78vh, 820px)' : 760 }}>
            <iframe src={url} title="Kennismaking plannen" style={{ width: '100%', height: '100%', border: 0, background: '#0a0a0a' }} />
          </div>
        </div>
      )
    }
    if (einde.uitkomst === 'B') {
      return (
        <div style={buitenkant}>
          <div ref={bovenRef} />
          {kop(`Dank je${naam ? `, ${naam}` : ''}!`)}
          {sub(einde.reden?.startsWith('Voor de challenge') ? einde.reden : 'Nu lijkt het nog niet het juiste moment voor de challenge.')}
          {sub('Hier is mijn gratis content om alvast te starten. En volg me op Instagram voor dagelijkse tips.')}
          <a href={GRATIS_CONTENT} style={{ ...knopGoud(m), marginTop: '1.6rem', textDecoration: 'none' }}><Gift size={22} strokeWidth={2.6} /> Gratis starten</a>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ ...knopGoud(m), marginTop: '0.7rem', background: 'rgba(255,255,255,0.08)', color: '#fff', textDecoration: 'none', boxShadow: 'none', border: '1px solid rgba(255,255,255,0.2)' }}><Instagram size={22} strokeWidth={2.4} /> Volg op Instagram</a>
        </div>
      )
    }
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} />
        {kop('Dank je voor het invullen.')}
        {sub('De challenge past op dit moment niet bij je situatie.')}
        {sub('Volg me op Instagram voor dagelijkse tips.')}
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" style={{ ...knopGoud(m), marginTop: '1.6rem', textDecoration: 'none' }}><Instagram size={22} strokeWidth={2.4} /> Volg op Instagram</a>
      </div>
    )
  }

  if (!vraag) return null

  // ── Vraag ──
  const klaar = ingevuld(vraag)
  const nummer = stap + 1
  return (
    <div style={buitenkant}>
      <div ref={bovenRef} />
      {/* Voortgang */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.2rem' }}>
        <button onClick={terug} aria-label="Terug" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <ArrowLeft size={18} strokeWidth={2.6} />
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
          <div style={{ width: `${(nummer / VRAGEN.length) * 100}%`, height: '100%', background: GOUD_KNOP, transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{nummer}/{VRAGEN.length}</span>
      </div>

      {kop(vraag.vraag)}
      {vraag.hint && sub(vraag.hint)}

      <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {vraag.soort === 'tekst' && (
          <input
            autoFocus value={antw[vraag.id] || ''} placeholder={vraag.placeholder}
            onChange={e => zet(vraag.id, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') verder() }}
            style={invoer(m)}
          />
        )}
        {vraag.soort === 'lang' && (
          <textarea
            autoFocus value={antw[vraag.id] || ''} placeholder={vraag.placeholder} rows={4}
            onChange={e => zet(vraag.id, e.target.value)}
            style={{ ...invoer(m), resize: 'vertical', lineHeight: 1.45 }}
          />
        )}
        {vraag.soort === 'keuze' && vraag.opties.map(o => (
          <Optie key={o} tekst={o} aan={antw[vraag.id] === o} m={m} onClick={() => zet(vraag.id, o)} />
        ))}
        {vraag.soort === 'meerkeuze' && vraag.opties.map(o => {
          const huidig = Array.isArray(antw[vraag.id]) ? antw[vraag.id] : []
          const aan = huidig.includes(o)
          return <Optie key={o} tekst={o} aan={aan} meer m={m} onClick={() => zet(vraag.id, aan ? huidig.filter(x => x !== o) : [...huidig, o])} />
        })}
        {vraag.soort === 'schaal' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
              const aan = Number(antw[vraag.id]) === n
              return (
                <button key={n} onClick={() => zet(vraag.id, n)} style={{
                  minHeight: m ? 52 : 58, borderRadius: 12, fontSize: '1.15rem', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                  background: aan ? GOUD_KNOP : 'rgba(255,255,255,0.04)', color: aan ? '#000' : '#fff',
                  border: `1.5px solid ${aan ? GOLD : 'rgba(255,255,255,0.15)'}`,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{n}</button>
              )
            })}
          </div>
        )}
        {vraag.soort === 'contact' && (
          <>
            <input type="email" inputMode="email" autoComplete="email" autoFocus value={antw.email || ''} placeholder="E-mailadres" onChange={e => zet('email', e.target.value)} style={invoer(m)} />
            <input type="tel" inputMode="tel" autoComplete="tel" value={antw.telefoon || ''} placeholder="Telefoonnummer (WhatsApp)" onChange={e => zet('telefoon', e.target.value)} style={invoer(m)} />
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: '0.4rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.45 }}>
              <input type="checkbox" checked={antw.akkoord === true} onChange={e => zet('akkoord', e.target.checked)} style={{ width: 20, height: 20, marginTop: 2, accentColor: GOLD, flexShrink: 0 }} />
              <span>Ik ga akkoord dat Kersten contact met me opneemt. Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>privacyverklaring</a>.</span>
            </label>
          </>
        )}
      </div>

      {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>}

      <button onClick={verder} disabled={!klaar || bezig} style={{ ...knopGoud(m, !klaar || bezig), marginTop: '1.4rem' }}>
        {bezig ? 'Even geduld…' : stap === VRAGEN.length - 1 ? 'Versturen' : 'Volgende'}
        {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
      </button>
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
