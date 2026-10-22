// src/pages/ChallengePrequalPage.jsx
//
// Prekwalificatie voor de 6 Weken Challenge: één vraag per scherm, midden in
// beeld. Vier vragen (doel, vastlopen, geprobeerd, leeftijd), dan "je bent
// geschikt": Kerstens video met daaronder naam + telefoonnummer (22 okt 2026;
// zelf inplannen in Calendly is weg). Uitkomsten:
//   A  past   -> bevestiging "binnen 24 uur bel of app ik je"
//   C  onder 18 -> vriendelijk afgewezen, gratis video
//
// Elke inzending wordt een lead op het bord van Kersten via de
// database-functie submit_challenge_prequal: A in "🎯 Ad lead", C in "Niet
// geschikt". "Wil gebeld worden" staat in de kwalificatie Open en de notities.
//
// Werkt los op /challenge/start én in het blad van de VSL (/challenge).

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, Instagram, Play, Volume2 } from 'lucide-react'
import db from '../services/DatabaseService'
import { meet, pixel, herkomst, volgTijdOpPagina, metaCookies } from './challengeTracking'
import { VRAGEN, vraagtTelefoon, optiesVan } from './challengeVragen'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'

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
  // Meerkeuze met het eigen antwoord erachter (alleen 'Wat vind je nu lastig?').
  const eigen = String(antw.vastlopen_eigen || '').trim()
  const lastig = [...(Array.isArray(antw.vastlopen) ? antw.vastlopen : []), ...(eigen ? [eigen] : [])]
  const lijst = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''))
  const voorkeur = 'Wil gebeld of geappt worden'
  const regels = [
    `Prekwalificatie 6 Weken Challenge (${uitkomst === 'A' ? 'past' : uitkomst === 'B' ? 'nog niet het moment' : 'past niet'})`,
    `Leeftijd: ${antw.leeftijd || '-'}`,
    `Doel: ${antw.doel || '-'}`,
    `Vindt lastig: ${lijst(lastig) || '-'}`,
    `Al geprobeerd: ${lijst(antw.geprobeerd) || '-'}`,
  ]
  if (uitkomst === 'A') regels.push(voorkeur)
  if (afwijsreden) regels.push(`Afgewezen: ${afwijsreden}`)
  // Alle vragen met hun antwoord, in volgorde: de lead-modal toont dit in
  // de tab Vragen. Niet beantwoord (afgewezen vóór die vraag) = weggelaten.
  const antwoorden = VRAGEN.map(q => {
    if (q.soort === 'info') return null
    const v = q.soort === 'gegevens' ? [antw.voornaam, antw.telefoon, antw.email].filter(Boolean) : q.id === 'vastlopen' ? lastig : antw[q.id]
    const tekst = Array.isArray(v) ? v.join(', ') : (v == null ? '' : String(v)).trim()
    return tekst ? { vraag: q.vraag, antwoord: tekst } : null
  }).filter(Boolean)
  return {
    antwoorden,
    uitkomst, afwijsreden: afwijsreden || '',
    voornaam: antw.voornaam || '', email: antw.email || '', telefoon: antw.telefoon || '',
    qual_goal: antw.doel || '',
    qual_pain: [lijst(lastig), antw.geprobeerd?.length ? `al geprobeerd: ${lijst(antw.geprobeerd)}` : null].filter(Boolean).join(' · '),
    qual_open: uitkomst === 'A' ? voorkeur : '',
    lead_goal: antw.doel || '', lead_struggle: lijst(lastig),
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

// ── Video op het geschikt-scherm ────────────────────────────────────────────
// Speelt meteen. Eerst met geluid; houdt de browser dat tegen (iPhone doet
// dat altijd), dan gedempt met een grote knop "Tik voor geluid", die de
// video ook terug naar het begin zet. YouTube-bediening en titelbalk zijn
// weg: de iframe is hoger dan het kader, zodat de titel bovenin buiten beeld
// valt. In de native app (yt.html) werkt de API niet; daar gedempt afspelen.
// Laadt dezelfde API als de speler op /challenge (gedeelde belofte).
function laadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!window.__ytApiBelofte) {
    window.__ytApiBelofte = new Promise((resolve) => {
      const vorige = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { vorige?.(); resolve(window.YT) }
      const el = document.createElement('script')
      el.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(el)
    })
  }
  return window.__ytApiBelofte
}

function GeschiktVideo({ id, m, vol = false, onKlaar }) {
  const [speelt, setSpeelt] = useState(false)
  const [gedempt, setGedempt] = useState(false)
  const [voortgang, setVoortgang] = useState(0)
  const iframeRef = useRef(null)
  const spelerRef = useRef(null)
  const gemeten = useRef(new Set())
  // Via een ref, zodat de speler niet opnieuw opgebouwd wordt als de functie wisselt.
  const klaarRef = useRef(onKlaar)
  useEffect(() => { klaarRef.current = onKlaar }, [onKlaar])
  const meetEens = (naam, meta) => { if (!gemeten.current.has(naam)) { gemeten.current.add(naam); meet(naam, meta ? { meta } : undefined) } }

  const embed = `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`
  const appUrl = appSafeEmbedUrl(`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&rel=0&playsinline=1`)
  const eigenLaag = !appUrl.includes('yt.html')

  useEffect(() => {
    if (!eigenLaag) return
    let weg = false
    let controle
    laadYouTubeApi().then((YT) => {
      if (weg || !iframeRef.current) return
      spelerRef.current = new YT.Player(iframeRef.current, {
        events: {
          onReady: (e) => {
            e.target.unMute(); e.target.playVideo()
            // Speelt hij na een moment niet, dan blokkeert de browser geluid.
            controle = setTimeout(() => {
              if (weg) return
              if (e.target.getPlayerState?.() !== YT.PlayerState.PLAYING) {
                e.target.mute(); e.target.playVideo(); setGedempt(true)
              }
            }, 900)
          },
          onStateChange: (e) => {
            const aan = e.data === YT.PlayerState.PLAYING
            setSpeelt(aan)
            if (aan) meetEens('geschikt_video_start')
            // De eerste keer uitgekeken: door naar de gegevens.
            if (e.data === YT.PlayerState.ENDED) {
              setVoortgang(1)
              if (!gemeten.current.has('geschikt_video_klaar')) { meetEens('geschikt_video_klaar'); klaarRef.current?.() }
            }
          },
        },
      })
    })
    return () => { weg = true; clearTimeout(controle); try { spelerRef.current?.destroy?.() } catch { /* leeg */ } }
  }, [eigenLaag])

  useEffect(() => {
    if (!speelt) return
    const t = setInterval(() => {
      try {
        const p = spelerRef.current
        const duur = p?.getDuration?.() || 0
        if (duur > 0) setVoortgang((p.getCurrentTime?.() || 0) / duur)
      } catch { /* nog niet klaar */ }
    }, 200)
    return () => clearInterval(t)
  }, [speelt])

  const tik = () => {
    const p = spelerRef.current
    if (!p?.getPlayerState) return
    if (gedempt) { p.unMute(); p.seekTo(0, true); p.playVideo(); setGedempt(false); meetEens('geschikt_video_geluid'); return }
    if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo()
  }

  return (
    <div style={vol ? {
      // In het blad op de telefoon: staand en heel (volle breedte sneed te
      // veel weg), zo hoog dat kop, velden en knop er zonder scrollen onder
      // passen (22 okt 2026).
      position: 'relative', margin: '0 auto', height: 'max(220px, calc(100dvh - 590px))', aspectRatio: '9 / 16', maxWidth: '100%',
      borderRadius: 16, overflow: 'hidden', background: '#111', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    } : {
      position: 'relative', margin: '1.2rem auto 0', height: m ? 'min(46vh, 390px)' : 'min(52vh, 460px)', aspectRatio: '9 / 16', maxWidth: '100%',
      borderRadius: 18, overflow: 'hidden', background: '#111', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    }}>
      {eigenLaag ? (
        <>
          {/* Hoger dan het kader: de YouTube-titel valt bovenin weg. */}
          <iframe ref={iframeRef} src={embed} title="Je bent geschikt"
            allow="autoplay; encrypted-media; picture-in-picture"
            style={{ position: 'absolute', left: 0, top: -70, width: '100%', height: 'calc(100% + 140px)', border: 0, pointerEvents: 'none' }} />
          <button onClick={tik} aria-label={gedempt ? 'Geluid aan' : speelt ? 'Pauze' : 'Afspelen'} style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer',
            background: speelt && !gedempt ? 'transparent' : 'rgba(0,0,0,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            {gedempt ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0.75rem 1.1rem', borderRadius: 999, background: '#fff', color: '#000', fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(0,0,0,0.45)', animation: 'geluidPuls 1.6s ease-in-out infinite' }}>
                <Volume2 size={20} strokeWidth={2.8} /> Tik voor geluid
              </span>
            ) : !speelt && (
              <Play size={m ? 56 : 64} fill="#fff" color="#fff" strokeWidth={1} style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />
            )}
          </button>
          {/* Dunne balk met de echte voortgang. */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,0.18)', pointerEvents: 'none' }}>
            <div style={{ width: `${voortgang * 100}%`, height: '100%', background: '#fff', transition: 'width 0.2s linear' }} />
          </div>
        </>
      ) : (
        <iframe src={appUrl} title="Je bent geschikt" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      )}
    </div>
  )
}

// ── Het formulier ───────────────────────────────────────────────────────────
// Eén vraag per scherm, midden in beeld, zoals slaap loggen in de app. Geen
// startscherm meer: wie op de knop drukt zit meteen in vraag 1. Eén keuze =
// meteen door; bij meerkeuze en bij de gegevens een knop.

export function PrequalFlow({ m = false, compact = false, onVolVideo }) {
  const [stap, setStap] = useState(0)            // index in `pad`, of 'klaar'
  const [antw, setAntw] = useState({})
  const [einde, setEinde] = useState(null)       // { uitkomst, reden, leadId }
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef({ ...utmUitUrl(), ...herkomst() })
  const bovenRef = useRef(null)
  const doorTimer = useRef(null)
  const voornaamRef = useRef(null)
  // Video uitgekeken: rustig naar de velden en de cursor in de voornaam.
  // (iPhone opent het toetsenbord alleen na een tik; daar staat het veld dan klaar.)
  const naarGegevens = () => {
    const el = voornaamRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => { try { el.focus({ preventScroll: true }) } catch { /* leeg */ } }, 450)
  }

  // De schermen die voor deze persoon gelden (`alleen` in challengeVragen).
  const pad = VRAGEN.filter(q => !q.alleen || q.alleen(antw))
  const vraag = typeof stap === 'number' ? pad[stap] : null
  // Op de telefoon in het blad: de video bovenaan zonder voortgangsbalk, en
  // het blad laat dan de transformatiefoto's weg (22 okt 2026).
  const volVideo = compact && m && !!vraag?.video
  useEffect(() => { onVolVideo?.(volVideo) }, [volVideo, onVolVideo])

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
    if (q.soort === 'meerkeuze') return (Array.isArray(v) && v.length > 0) || (!!q.eigen && String(a[`${q.id}_eigen`] || '').trim().length > 0)
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
      meet('form_klaar', { meta: { uitkomst, reden: reden || null, vraag: vraag?.id || null }, lead_id: data })
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
    // Ander doel = andere lijst bij 'Wat vind je nu lastig?': oude vinkjes weg.
    if (vraag.id === 'doel' && antw.doel !== o) delete nieuw.vastlopen
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
    padding: compact ? (m ? '1.1rem 1.1rem 1.3rem' : '1.4rem 1.6rem 1.6rem') : (m ? '1rem 1.25rem 2rem' : '1.5rem 2rem 3rem'),
    color: WIT, fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }
  const midden = { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: compact ? 0 : (m ? '2rem' : '3rem') }

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
    if (einde.uitkomst === 'A') {
      return (
        <div style={buitenkant}>
          <div ref={bovenRef} />
          <div style={midden}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
              <Check size={34} strokeWidth={3.2} color="#000" />
            </div>
            {kop(`Top ${naam}, je staat erop.`)}
            {sub('Binnen 24 uur bel of app ik je om de challenge door te nemen.')}
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
  // Licht groen (begin) naar vol groen (laatste stap).
  const deel = totaal > 1 ? (nummer - 1) / (totaal - 1) : 1
  const voortgangKleur = `hsl(${Math.round(110 + deel * 32)}, ${Math.round(50 + deel * 30)}%, ${Math.round(64 - deel * 20)}%)`

  return (
    <div style={buitenkant}>
      {/* In het blad zweven logo en kruisje bovenin: ruimte laten bij het scrollen. */}
      <div ref={bovenRef} style={{ scrollMarginTop: compact ? (m ? 64 : 80) : 0 }} />
      <div style={midden}>
        {!volVideo && <>
        {/* Voortgang direct boven de vraag, even breed als de antwoorden:
            erboven de naam van de challenge (met terug ervoor) en de teller,
            eronder één balk. Kleur loopt van
            licht naar vol groen naarmate je verder komt (21 okt 2026). */}
        <div style={{ marginBottom: m ? '1.4rem' : '1.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <button onClick={terug} aria-label="Vorige vraag" disabled={stap === 0} style={{ display: stap === 0 ? 'none' : 'inline-flex', alignItems: 'center', padding: '4px 4px 4px 0', background: 'none', border: 'none', color: WIT, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <ArrowLeft size={17} strokeWidth={2.8} />
              </button>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gratis 6 Weken Challenge</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: voortgangKleur, fontVariantNumeric: 'tabular-nums', transition: 'color 0.35s ease' }}>
              Stap {nummer} van {totaal}
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ width: `${(nummer / totaal) * 100}%`, height: '100%', background: voortgangKleur, borderRadius: 4, transition: 'width 0.35s ease, background-color 0.35s ease' }} />
          </div>
        </div>
        </>}
        {/* Alleen de vraag schuift in; de balk blijft staan en loopt vloeiend op. */}
        <div key={vraag.id} style={{ animation: 'prequalIn 0.25s ease' }}>
        {vraag.soort === 'info' ? (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
              <Check size={34} strokeWidth={3.2} color="#000" />
            </div>
            {kop(vraag.vraag)}
            {sub('Op basis van je antwoorden past de 6 Weken Challenge bij jou. Nog twee korte stappen.')}
          </>
        ) : vraag.video && volVideo ? (
          <>
            {/* Ruimte bovenin voor het zwevende logo en kruisje. */}
            <div style={{ paddingTop: '2.6rem', marginBottom: '1rem' }}><GeschiktVideo id={vraag.video} m={m} vol onKlaar={naarGegevens} /></div>
            {kop(vraag.vraag)}
            <p style={{ margin: '0.4rem 0 0', fontSize: '0.92rem', fontWeight: 700, color: ZWAK, lineHeight: 1.4, textAlign: 'center' }}>Laat je gegevens achter, dan neem ik contact op.</p>
          </>
        ) : vraag.video ? (
          <>
            {kop(vraag.vraag)}
            {sub('Laat hieronder je gegevens achter, dan neem ik contact met je op.')}
            <GeschiktVideo id={vraag.video} m={m} onKlaar={naarGegevens} />
          </>
        ) : (
          <>
            {kop(vraag.vraag)}
            {vraag.hint && sub(vraag.hint)}
          </>
        )}

        <div style={{ marginTop: volVideo ? '1rem' : '1.6rem', display: 'flex', flexDirection: 'column', gap: volVideo ? '0.5rem' : '0.6rem' }}>
          {vraag.soort === 'keuze' && optiesVan(vraag, antw).map(o => (
            <Optie key={o} tekst={o} aan={antw[vraag.id] === o} m={m} onClick={() => kies(o)} />
          ))}
          {vraag.soort === 'meerkeuze' && optiesVan(vraag, antw).map(o => {
            const huidig = Array.isArray(antw[vraag.id]) ? antw[vraag.id] : []
            const aan = huidig.includes(o)
            return <Optie key={o} tekst={o} aan={aan} meer m={m} onClick={() => zet(vraag.id, aan ? huidig.filter(x => x !== o) : [...huidig, o])} />
          })}
          {vraag.soort === 'meerkeuze' && vraag.eigen && (
            <input
              value={antw[`${vraag.id}_eigen`] || ''} placeholder={vraag.eigen}
              onChange={e => zet(`${vraag.id}_eigen`, e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') verder() }}
              style={{ ...invoer(m), minHeight: m ? 58 : 62, borderRadius: 14, fontWeight: 900, borderColor: String(antw[`${vraag.id}_eigen`] || '').trim() ? WIT : 'rgba(255,255,255,0.15)' }}
            />
          )}
          {vraag.soort === 'gegevens' && (
            <>
              <input
                ref={voornaamRef} autoComplete="given-name" value={antw.voornaam || ''} placeholder="Je voornaam"
                onChange={e => zet('voornaam', e.target.value)} style={invoer(m)}
              />
              {telefoon ? (
                <input
                  type="tel" inputMode="tel" autoComplete="tel" value={antw.telefoon || ''}
                  placeholder="Telefoonnummer"
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
                Door te versturen ga je akkoord dat Kersten contact met je opneemt.{' '}
                Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: WIT }}>privacyverklaring</a>.
              </div>
            </>
          )}
        </div>

        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}

        {!meteenDoor && (
          <button onClick={() => verder()} disabled={!klaar || bezig} style={{ ...knopWit(m, !klaar || bezig), marginTop: volVideo ? '0.9rem' : '1.4rem' }}>
            {bezig ? 'Even geduld…'
              : vraag.soort === 'info' ? 'Verder'
              : vraag.soort === 'gegevens' ? 'Neem contact met mij op'
              : 'Volgende'}
            {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
          </button>
        )}
        {meteenDoor && bezig && <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: ZWAK }}>Even geduld…</div>}
        </div>
      </div>
      <style>{'@keyframes prequalIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } @keyframes geluidPuls { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }'}</style>
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
