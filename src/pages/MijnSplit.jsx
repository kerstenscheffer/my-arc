// src/pages/MijnSplit.jsx
// Lead magnet /mijn-split: vier vragen (dagen, waar, doel, ervaring), daarna
// naam + e-mail, en dan de split uit de MY ARC-bibliotheek als PDF. Geen
// mail: de lead komt op het bord in de kolom "🧲 Mijn split" (RPC
// submit_mijn_split).
//
// Zelfde huisstijl als /challenge (23 okt 2026): vaste balk met logo en witte
// pil, kop, video op de overgang zwart/wit, groene knop, en de vragen in een
// modal midden in beeld, één vraag per scherm met de groene voortgangsbalk.
// Meting met dezelfde meet() als /challenge (challenge_events, pad
// /mijn-split). Het Ads-scherm filtert sinds 23 okt 2026 per pagina, dus dit
// komt niet tussen de challenge-cijfers. Zelfde gebeurtenissen: bezoek, tijd,
// video_*, knop, form_start, form_vraag/form_stap per vraag, form_klaar, en
// eigen: pdf_download.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Download, Loader2, Play, Volume2, VolumeX, Pause, X } from 'lucide-react'
import db from '../services/DatabaseService'
import { herkomst, meet, volgTijdOpPagina } from './challengeTracking'
import { appSafeEmbedUrl } from '../modules/videos/utils/youtubeHelpers'
import { SPLITS, DAG_NAAM, WEEK, DOELEN, NIVEAUS, LOCATIES, tips } from './mijn-split/splitRegels'
import { downloadSplitPdf, fotoVoor, duur, totaalSets } from './mijn-split/splitPdf'

// YouTube-id van de uitlegvideo. Leeg = stilstaand beeld zonder afspeelknop.
const VIDEO_ID = ''
const POSTER = '/mijn-split/push.jpg'

const BG = '#000'
const HERO_BG = '#161616'
const CTA_GROEN = '#15803d'
const CTA_TEKST = 'Maak mijn split'
const WIT = '#fff'
const ZWAK = 'rgba(255,255,255,0.55)'
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim())

const STAPPEN = ['dagen', 'locatie', 'doel', 'niveau', 'gegevens']
const TOTAAL = STAPPEN.length
const DAGEN_KEUZE = [
  { key: 2, label: '2 dagen' },
  { key: 3, label: '3 dagen' },
  { key: 4, label: '4 dagen' },
  { key: 5, label: '5 dagen' },
  { key: 6, label: '6 dagen' },
]
const VRAGEN = {
  dagen: { titel: 'Hoeveel dagen per week kun je trainen?', lijst: DAGEN_KEUZE },
  locatie: { titel: 'Waar train je?', lijst: LOCATIES },
  doel: { titel: 'Wat is je doel?', lijst: DOELEN },
  niveau: { titel: 'Hoe lang train je al?', lijst: NIVEAUS },
  gegevens: { titel: 'Waar mag je split heen?' },
}

const VOORBEELDEN = [
  { src: '/mijn-split/voorbeeld-1.jpg', label: 'Jouw split' },
  { src: '/mijn-split/voorbeeld-2.jpg', label: 'Je week' },
  { src: '/mijn-split/voorbeeld-3.jpg', label: 'Elke training + logboek' },
  { src: '/mijn-split/voorbeeld-4.jpg', label: 'Uitvoering en progressie' },
]
const INHOUD = [
  'Een split op jouw aantal dagen, in de gym of thuis.',
  'Alle oefeningen met sets, reps en rust.',
  'Een logboek per set voor 4 weken.',
  'Hoe je opwarmt, hoe zwaar je gaat en hoe lang je rust.',
]

// ── Bouwstenen (zelfde maten als /challenge) ──────────────────────────────

function Kop({ children, m, center, groot, licht }) {
  return (
    <h2 style={{
      margin: 0, fontSize: groot ? (m ? '1.75rem' : '2.9rem') : (m ? '1.5rem' : '2.1rem'),
      fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: licht ? '#000' : WIT,
      textTransform: 'uppercase', textAlign: center ? 'center' : 'left',
    }}>{children}</h2>
  )
}

function Tekst({ children, m, center, dim, licht, style }) {
  return (
    <p style={{
      margin: 0, fontSize: m ? '0.98rem' : '1.08rem', fontWeight: 600, lineHeight: 1.55, letterSpacing: '-0.01em',
      color: licht ? (dim ? 'rgba(0,0,0,0.6)' : '#1a1a1a') : (dim ? ZWAK : 'rgba(255,255,255,0.85)'),
      textAlign: center ? 'center' : 'left', ...style,
    }}>{children}</p>
  )
}

function Cta({ m, onClick, sub, licht, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, ...style }}>
      <button onClick={onClick} data-cta="" style={{
        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        minHeight: m ? 68 : 76, padding: m ? '0 1rem' : '0 2.6rem',
        width: m ? '100%' : 'auto', minWidth: m ? 0 : 380,
        borderRadius: 14, background: CTA_GROEN, color: WIT,
        fontSize: m ? '1rem' : '1.4rem', fontWeight: 900, letterSpacing: '0.03em',
        whiteSpace: 'nowrap', WebkitTextStroke: `${m ? '0.5px' : '0.7px'} ${WIT}`,
        textTransform: 'uppercase', boxSizing: 'border-box',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        {CTA_TEKST}
      </button>
      {sub && (
        <div style={{ fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 800, color: licht ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

function Sectie({ children, m, smal, licht, grijs, style }) {
  const bg = grijs ? '#f2f2f2' : licht ? '#fff' : BG
  return (
    <section style={{
      padding: m ? '4rem 1.25rem' : '6.5rem 3rem', background: bg, color: licht || grijs ? '#000' : WIT,
      borderTop: `1px solid ${licht || grijs ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`, ...style,
    }}>
      <div style={{ maxWidth: smal ? 720 : 1000, margin: '0 auto', width: '100%' }}>{children}</div>
    </section>
  )
}

// ── De speler ──────────────────────────────────────────────────────────────
// Zelfde gedrag als op /challenge: eigen beeld met afspeelknop, daarna de
// YouTube-speler zonder eigen bediening met onze laag erover (play/pauze,
// geluid, een balk die eerst snel loopt). Zonder VIDEO_ID alleen het beeld.
const TOON_VOORTGANG = (x) => Math.pow(Math.max(0, Math.min(1, x)), 0.45)

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

const knopIcoon = {
  width: 36, height: 36, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

function Video({ m }) {
  const [gestart, setGestart] = useState(false)
  const [speelt, setSpeelt] = useState(false)
  const [gedempt, setGedempt] = useState(false)
  const [voortgang, setVoortgang] = useState(0)
  const [bediening, setBediening] = useState(true)
  const iframeRef = useRef(null)
  const spelerRef = useRef(null)
  const verbergTimer = useRef(null)
  // Mijlpalen van de echte voortgang, één keer per bezoek. Gedempt kijken telt niet.
  const mijlpalen = useRef(new Set())
  useEffect(() => {
    if (gedempt) return
    [[0.25, 'video_25'], [0.5, 'video_50'], [0.75, 'video_75'], [0.98, 'video_100']].forEach(([grens, naam]) => {
      if (voortgang >= grens && !mijlpalen.current.has(naam)) { mijlpalen.current.add(naam); meet(naam) }
    })
  }, [voortgang, gedempt])

  const directeEmbed = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
  const appUrl = appSafeEmbedUrl(directeEmbed)
  const eigenLaag = appUrl === directeEmbed

  const toonBediening = () => {
    setBediening(true)
    clearTimeout(verbergTimer.current)
    verbergTimer.current = setTimeout(() => setBediening(false), 2500)
  }
  useEffect(() => {
    if (speelt) toonBediening()
    else { clearTimeout(verbergTimer.current); setBediening(true) }
    return () => clearTimeout(verbergTimer.current)
  }, [speelt])

  useEffect(() => {
    if (!gestart || !eigenLaag) return
    let weg = false
    laadYouTubeApi().then((YT) => {
      if (weg || !iframeRef.current) return
      spelerRef.current = new YT.Player(iframeRef.current, {
        events: {
          onReady: (e) => {
            try { e.target.unMute(); e.target.playVideo() } catch { /* leeg */ }
            // Weigert de browser geluid, dan gedempt verder met "Tik voor geluid".
            setTimeout(() => {
              if (weg) return
              try { if (e.target.getPlayerState() !== YT.PlayerState.PLAYING) { e.target.mute(); e.target.playVideo(); setGedempt(true) } } catch { /* leeg */ }
            }, 900)
          },
          onStateChange: (e) => {
            setSpeelt(e.data === YT.PlayerState.PLAYING)
            if (e.data === YT.PlayerState.ENDED) setVoortgang(1)
          },
        },
      })
    })
    return () => { weg = true; try { spelerRef.current?.destroy?.() } catch { /* leeg */ } }
  }, [gestart, eigenLaag])

  useEffect(() => {
    if (!speelt) return
    const t = setInterval(() => {
      try {
        const p = spelerRef.current
        const d = p?.getDuration?.() || 0
        if (d > 0) setVoortgang((p.getCurrentTime?.() || 0) / d)
      } catch { /* nog niet klaar */ }
    }, 200)
    return () => clearInterval(t)
  }, [speelt])

  const wisselSpelen = () => {
    const p = spelerRef.current
    if (!p?.getPlayerState) return
    if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo()
  }
  const metGeluid = () => {
    const p = spelerRef.current
    try { p?.unMute?.(); p?.seekTo?.(0, true); p?.playVideo?.() } catch { /* leeg */ }
    setGedempt(false); setVoortgang(0)
  }
  const wisselGeluid = (e) => {
    e.stopPropagation()
    const p = spelerRef.current
    if (!p?.mute) return
    if (gedempt) { p.unMute(); setGedempt(false) } else { p.mute(); setGedempt(true) }
  }

  const kader = {
    position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: m ? 14 : 18, overflow: 'hidden',
    background: '#111', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
  }

  if (!gestart) {
    return (
      <div style={kader}>
        <button onClick={() => { if (VIDEO_ID) { setGestart(true); meet('video_start') } }} disabled={!VIDEO_ID} aria-label="Video afspelen" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none',
          cursor: VIDEO_ID ? 'pointer' : 'default', background: `url(${POSTER}) center / cover`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          {VIDEO_ID && <Play size={m ? 64 : 84} fill={WIT} color={WIT} strokeWidth={1} style={{ position: 'relative', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />}
        </button>
      </div>
    )
  }

  if (!eigenLaag) {
    return (
      <div style={kader}>
        <iframe src={appUrl} title="Zo werkt je split" allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
      </div>
    )
  }

  const balk = m ? 44 : 52
  return (
    <div style={kader}>
      <iframe ref={iframeRef}
        src={`${directeEmbed}&enablejsapi=1&controls=0&disablekb=1&iv_load_policy=3&origin=${encodeURIComponent(window.location.origin)}`}
        title="Zo werkt je split"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        style={{ position: 'absolute', left: 0, top: -70, width: '100%', height: 'calc(100% + 140px)', border: 0, pointerEvents: 'none' }} />
      <div onClick={() => { wisselSpelen(); toonBediening() }} onMouseMove={toonBediening} onTouchStart={toonBediening}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: bediening ? balk : 0, cursor: 'pointer' }} />
      {gedempt && (
        <button onClick={metGeluid} aria-label="Geluid aan en vanaf het begin kijken" style={{
          position: 'absolute', inset: 0, zIndex: 3, width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.12)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: m ? 8 : 10, padding: m ? '0.7rem 1.05rem' : '0.85rem 1.35rem',
            borderRadius: 999, background: 'rgba(0,0,0,0.78)', border: '1.5px solid rgba(255,255,255,0.9)', color: WIT,
            fontSize: m ? '0.95rem' : '1.1rem', fontWeight: 900, fontFamily: 'inherit', animation: 'tikGeluid 1.6s ease-in-out infinite',
          }}>
            <VolumeX size={m ? 20 : 24} strokeWidth={2.6} /> Tik voor geluid
          </span>
        </button>
      )}
      {!speelt && !gedempt && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <Play size={m ? 56 : 72} fill={WIT} color={WIT} strokeWidth={1} style={{ filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />
        </div>
      )}
      <div onMouseMove={toonBediening} style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: balk,
        display: 'flex', alignItems: 'center', gap: m ? 10 : 14, padding: m ? '0 0.75rem' : '0 1rem',
        background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)',
        opacity: bediening && !gedempt ? 1 : 0, pointerEvents: bediening && !gedempt ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}>
        <button onClick={wisselSpelen} aria-label={speelt ? 'Pauzeren' : 'Afspelen'} style={knopIcoon}>
          {speelt ? <Pause size={20} fill={WIT} color={WIT} /> : <Play size={20} fill={WIT} color={WIT} />}
        </button>
        <button onClick={wisselGeluid} aria-label={gedempt ? 'Geluid aan' : 'Geluid uit'} style={knopIcoon}>
          {gedempt ? <VolumeX size={20} color={WIT} /> : <Volume2 size={20} color={WIT} />}
        </button>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <div style={{ width: `${TOON_VOORTGANG(voortgang) * 100}%`, height: '100%', background: WIT, borderRadius: 3, transition: 'width 0.25s linear' }} />
        </div>
      </div>
    </div>
  )
}

// ── Modal (zelfde omlijsting als op /challenge) ───────────────────────────

function ModalKader({ open, onClose, m, children }) {
  useEffect(() => {
    if (!open) return
    const vorige = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const toets = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', toets)
    return () => { document.body.style.overflow = vorige; window.removeEventListener('keydown', toets) }
  }, [open, onClose])
  // Dicht = verborgen, niet weg: wie sluit en weer opent houdt zijn antwoorden
  // en, na het invullen, zijn split.
  return (
    <div onClick={onClose} aria-hidden={!open} style={{
      position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.88)', animation: 'bladWaas 0.2s ease',
      display: open ? 'flex' : 'none', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box',
      padding: m ? 'calc(env(safe-area-inset-top, 0px) + 2.2rem) 0.75rem calc(env(safe-area-inset-bottom, 0px) + 2.2rem)' : '5vh 1rem',
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 640, maxHeight: '100%', background: '#0a0a0a', borderRadius: 22,
        boxSizing: 'border-box', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', animation: 'modalIn 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: m ? '0.7rem 0.6rem 1.4rem' : '0.9rem 0.9rem 1.8rem',
          background: 'linear-gradient(180deg, #0a0a0a 0%, rgba(10,10,10,0.9) 55%, rgba(10,10,10,0) 100%)', pointerEvents: 'none',
        }}>
          <img src="/ma-logo-header.png" alt="MY ARC" style={{ width: m ? 72 : 90, height: 'auto', display: 'block' }} />
          <button onClick={onClose} aria-label="Sluiten" style={{
            position: 'absolute', top: m ? '0.6rem' : '0.8rem', right: m ? '0.5rem' : '0.8rem', width: 40, height: 40,
            pointerEvents: 'auto', background: 'none', border: 'none', color: WIT, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={24} strokeWidth={2.8} />
          </button>
        </div>
        <div style={{ flex: '0 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Het formulier ──────────────────────────────────────────────────────────

const knopWit = (m, uit = false) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  minHeight: m ? 58 : 64, padding: m ? '0 1.4rem' : '0 2rem', width: '100%', borderRadius: 14, border: 'none',
  background: uit ? 'rgba(255,255,255,0.12)' : WIT, color: uit ? ZWAK : '#000',
  fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
  cursor: uit ? 'default' : 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
})
const invoer = (m) => ({
  width: '100%', boxSizing: 'border-box', padding: m ? '0.72rem 0.95rem' : '0.8rem 1.05rem',
  background: '#050505', border: '1.5px solid rgba(255,255,255,0.14)', borderRadius: 12,
  color: WIT, fontSize: m ? '1.05rem' : '1.1rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
})

function Optie({ label, aan, onClick, m }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      minHeight: m ? 54 : 58, padding: m ? '0.7rem 1rem' : '0.8rem 1.2rem', borderRadius: 14, textAlign: 'left',
      background: aan ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${aan ? WIT : 'rgba(255,255,255,0.15)'}`, color: WIT, cursor: 'pointer', fontFamily: 'inherit',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'border-color 0.15s, background 0.15s',
    }}>
      <span style={{ minWidth: 0, fontSize: m ? '1.02rem' : '1.08rem', fontWeight: 900 }}>{label}</span>
      <span style={{
        width: 24, height: 24, flexShrink: 0, borderRadius: '50%', border: `2px solid ${aan ? WIT : 'rgba(255,255,255,0.3)'}`,
        background: aan ? WIT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {aan && <Check size={15} strokeWidth={3.5} color="#000" />}
      </span>
    </button>
  )
}

function SplitFlow({ m }) {
  const [stap, setStap] = useState(0)            // index in STAPPEN, TOTAAL = klaar
  const [antw, setAntw] = useState({ dagen: null, locatie: null, doel: null, niveau: null, voornaam: '', email: '' })
  const [dagen, setDagen] = useState(null)        // { code: { focus, oefeningen } }
  const [bezig, setBezig] = useState(false)
  const [pdfBezig, setPdfBezig] = useState(false)
  const [fout, setFout] = useState('')
  const utm = useRef(herkomst())
  const doorTimer = useRef(null)
  const bovenRef = useRef(null)

  useEffect(() => () => clearTimeout(doorTimer.current), [])
  useEffect(() => { bovenRef.current?.scrollIntoView?.({ block: 'start' }) }, [stap])
  // Elke vraag die in beeld komt: "gezien"; beantwoord = form_stap. Zo ziet
  // het Ads-scherm per vraag hoeveel mensen afhaken.
  const gezien = useRef(new Set())
  useEffect(() => {
    const vraag = STAPPEN[stap]
    if (!vraag || gezien.current.has(vraag)) return
    gezien.current.add(vraag)
    meet('form_vraag', { meta: { stap: stap + 1, vraag } })
  }, [stap])

  // De dagen van de gekozen locatie alvast ophalen, zodat het resultaat er
  // direct staat na het opslaan.
  useEffect(() => {
    if (!antw.locatie) return
    let weg = false
    db.supabase.rpc('get_mijn_split_dagen', { p_locatie: antw.locatie }).then(({ data, error }) => {
      if (weg || error || !Array.isArray(data)) return
      setDagen(Object.fromEntries(data.map(d => [d.code, d])))
    }, () => null)
    return () => { weg = true }
  }, [antw.locatie])

  const split = antw.dagen ? SPLITS[antw.dagen] : null
  const huidig = STAPPEN[stap]
  const gegevensOk = antw.voornaam.trim().length > 0 && emailOk(antw.email)

  const kies = (veld, waarde) => {
    meet('form_stap', { meta: { stap: stap + 1, vraag: veld } })
    setAntw(a => ({ ...a, [veld]: waarde }))
    clearTimeout(doorTimer.current)
    doorTimer.current = setTimeout(() => setStap(s => s + 1), 220)
  }
  const terug = () => { clearTimeout(doorTimer.current); if (stap > 0) setStap(stap - 1) }

  const verstuur = async () => {
    if (!gegevensOk || bezig) return
    setBezig(true); setFout('')
    try {
      const doelLabel = DOELEN.find(d => d.key === antw.doel)?.label
      const niveauLabel = NIVEAUS.find(n => n.key === antw.niveau)?.label
      const locLabel = LOCATIES.find(l => l.key === antw.locatie)?.label
      const u = utm.current || {}
      const { data: leadId, error } = await db.supabase.rpc('submit_mijn_split', { p: {
        voornaam: antw.voornaam.trim(),
        email: antw.email.trim(),
        doel: doelLabel,
        samenvatting: `Mijn split: ${split.naam} (${antw.dagen} dagen, ${locLabel?.toLowerCase()}). Doel: ${doelLabel}. Traint: ${niveauLabel?.toLowerCase()}.`,
        antwoorden: [
          { vraag: 'Dagen per week', antwoord: String(antw.dagen) },
          { vraag: 'Waar', antwoord: locLabel },
          { vraag: 'Doel', antwoord: doelLabel },
          { vraag: 'Traint al', antwoord: niveauLabel },
          { vraag: 'Split', antwoord: split.naam },
        ],
        utm_source: u.utm_source, utm_medium: u.utm_medium, utm_campaign: u.utm_campaign,
        utm_content: u.utm_content, referrer: u.referrer,
      } })
      if (error) throw error
      meet('form_stap', { meta: { stap: TOTAAL, vraag: 'gegevens' } })
      meet('form_klaar', { meta: { uitkomst: 'A', vraag: 'gegevens' }, lead_id: leadId || null })
      setStap(TOTAAL)
    } catch (e) {
      console.error('mijn-split opslaan mislukt:', e)
      setFout('Opslaan lukte niet. Controleer je e-mail en probeer het nog een keer.')
    } finally { setBezig(false) }
  }

  const download = async () => {
    if (pdfBezig || !dagen) return
    setPdfBezig(true); setFout('')
    try {
      await downloadSplitPdf({ voornaam: antw.voornaam.trim(), split, locatie: antw.locatie, dagen, tips: tips(antw), doel: antw.doel })
      meet('pdf_download', { meta: { split: split.naam } })
    } catch (e) {
      console.error('PDF mislukt:', e)
      setFout('Downloaden lukte niet. Probeer het nog een keer.')
    } finally { setPdfBezig(false) }
  }

  const kop = (tekst) => (
    <h2 style={{ margin: 0, fontSize: m ? '1.6rem' : '2rem', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.03em', color: WIT, textAlign: 'center' }}>{tekst}</h2>
  )
  const sub = (tekst) => (
    <p style={{ margin: '0.7rem 0 0', fontSize: m ? '0.98rem' : '1.05rem', fontWeight: 700, color: ZWAK, lineHeight: 1.5, textAlign: 'center' }}>{tekst}</p>
  )
  const buitenkant = {
    maxWidth: 560, margin: '0 auto', width: '100%', boxSizing: 'border-box',
    padding: m ? '4.4rem 1.1rem 1.3rem' : '5.2rem 1.6rem 1.6rem', color: WIT, fontFamily: FONT,
  }

  // ── Klaar: download en de split zelf ──
  if (stap >= TOTAAL) {
    return (
      <div style={buitenkant}>
        <div ref={bovenRef} />
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: WIT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.2rem' }}>
          <Check size={34} strokeWidth={3.2} color="#000" />
        </div>
        {kop(`${antw.voornaam.trim()}, je split staat klaar.`)}
        {sub(`${split.naam}: ${split.dagen.length} dagen per week, ${antw.locatie === 'thuis' ? 'thuis' : 'in de gym'}.`)}
        <button onClick={download} disabled={!dagen || pdfBezig} style={{ ...knopWit(m, !dagen || pdfBezig), marginTop: '1.4rem', background: dagen ? CTA_GROEN : 'rgba(255,255,255,0.12)', color: WIT }}>
          {pdfBezig ? <Loader2 size={22} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={22} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download je split (PDF)'}
        </button>
        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
        <SplitOverzicht split={split} dagen={dagen} locatie={antw.locatie} m={m} onDownload={download} pdfBezig={pdfBezig} />
      </div>
    )
  }

  // ── Vraag ──
  const v = VRAGEN[huidig]
  const isGegevens = huidig === 'gegevens'
  const nummer = stap + 1
  const deel = TOTAAL > 1 ? (nummer - 1) / (TOTAAL - 1) : 1
  const voortgangKleur = `hsl(${Math.round(110 + deel * 32)}, ${Math.round(50 + deel * 30)}%, ${Math.round(64 - deel * 20)}%)`

  return (
    <div style={buitenkant}>
      <div ref={bovenRef} style={{ scrollMarginTop: m ? 64 : 80 }} />
      <div style={{ marginBottom: m ? '1.4rem' : '1.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 28, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <button onClick={terug} aria-label="Vorige vraag" style={{ display: stap === 0 ? 'none' : 'inline-flex', alignItems: 'center', padding: '4px 4px 4px 0', background: 'none', border: 'none', color: WIT, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <ArrowLeft size={17} strokeWidth={2.8} />
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 900, color: WIT, whiteSpace: 'nowrap' }}>Gratis trainingssplit</span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: voortgangKleur, fontVariantNumeric: 'tabular-nums', transition: 'color 0.35s ease' }}>
            Stap {nummer} van {TOTAAL}
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ width: `${(nummer / TOTAAL) * 100}%`, height: '100%', background: voortgangKleur, borderRadius: 4, transition: 'width 0.35s ease, background-color 0.35s ease' }} />
        </div>
      </div>

      <div key={huidig} style={{ animation: 'vraagIn 0.25s ease' }}>
        {kop(v.titel)}
        <div style={{ marginTop: '1.3rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {!isGegevens && v.lijst.map(o => (
            <Optie key={o.key} label={o.label} m={m} aan={antw[huidig] === o.key} onClick={() => kies(huidig, o.key)} />
          ))}
          {isGegevens && (
            <>
              <input value={antw.voornaam} onChange={e => setAntw(a => ({ ...a, voornaam: e.target.value }))}
                placeholder="Je voornaam*" autoComplete="given-name" style={invoer(m)} />
              <input value={antw.email} onChange={e => setAntw(a => ({ ...a, email: e.target.value.trim() }))}
                onKeyDown={e => e.key === 'Enter' && verstuur()}
                placeholder="jouw@email.nl*" type="email" inputMode="email" autoComplete="email" style={invoer(m)} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.45, textAlign: 'center', marginTop: '0.2rem' }}>
                Zie de <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: WIT }}>privacyverklaring</a>.
              </div>
            </>
          )}
        </div>
        {fout && <div style={{ marginTop: '0.9rem', fontSize: '0.85rem', fontWeight: 800, color: '#ef4444', textAlign: 'center' }}>{fout}</div>}
        {isGegevens && (
          <button onClick={verstuur} disabled={!gegevensOk || bezig} style={{ ...knopWit(m, !gegevensOk || bezig), marginTop: '1.4rem' }}>
            {bezig ? 'Even geduld…' : 'Laat mijn split zien'}
            {!bezig && <ArrowRight size={22} strokeWidth={2.6} />}
          </button>
        )}
      </div>
    </div>
  )
}

// De split zelf onder de downloadknop, in de stijl van de PDF: de week als
// fotokaartjes, een wisselaar per training en per training een kaart met
// foto, kerncijfers en de oefeningen.
const ANTON = "'Anton', 'DM Sans', sans-serif"

function SplitOverzicht({ split, dagen, locatie, m, onDownload, pdfBezig }) {
  const uniek = [...new Set(split.dagen)]
  const [actief, setActief] = useState(uniek[0])
  const dag = dagen?.[actief]
  const nr = uniek.indexOf(actief) + 1
  const wanneer = split.week.filter((_, k) => split.dagen[k] === actief).join(' + ')
  const twee = (n) => String(n).padStart(2, '0')
  const klein = { fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase', color: ZWAK }

  return (
    <div style={{ marginTop: '1.8rem' }}>
      {/* De week: trainingsdagen met hun foto, rustdagen leeg. Tik = die training. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: m ? 5 : 6 }}>
        {WEEK.map(d => {
          const idx = split.week.indexOf(d)
          const code = idx >= 0 ? split.dagen[idx] : null
          const aan = code === actief
          return (
            <button key={d} onClick={() => code && setActief(code)} disabled={!code} aria-label={code ? `${d}: ${DAG_NAAM[code]}` : `${d}: rust`} style={{
              position: 'relative', aspectRatio: '1', borderRadius: 10, padding: 0, overflow: 'hidden', fontFamily: 'inherit',
              border: code ? `1.5px solid ${aan ? WIT : 'rgba(255,255,255,0.18)'}` : '1px solid rgba(255,255,255,0.1)',
              background: code ? `url(/mijn-split/klein-${fotoVoor(code, locatie)}.jpg) center / cover` : 'transparent',
              cursor: code ? 'pointer' : 'default', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: ANTON, fontSize: m ? '0.95rem' : '1.1rem', color: code ? WIT : 'rgba(255,255,255,0.3)', letterSpacing: '0.02em' }}>{d.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {/* Wisselaar tussen de trainingen. */}
      {uniek.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: '0.9rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {uniek.map(c => (
            <button key={c} onClick={() => setActief(c)} style={{
              flexShrink: 0, padding: '0.55rem 0.9rem', borderRadius: 999, fontFamily: 'inherit', cursor: 'pointer',
              border: `1.5px solid ${c === actief ? WIT : 'rgba(255,255,255,0.18)'}`,
              background: c === actief ? WIT : 'transparent', color: c === actief ? '#000' : WIT,
              fontSize: '0.85rem', fontWeight: 900, whiteSpace: 'nowrap',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>{DAG_NAAM[c]}</button>
          ))}
        </div>
      )}

      {!dag && <div style={{ padding: '1.4rem 0', fontSize: '0.88rem', color: ZWAK, textAlign: 'center', fontWeight: 700 }}>Oefeningen laden…</div>}
      {dag && (
        <div key={actief} style={{ marginTop: '0.9rem', borderRadius: 16, overflow: 'hidden', background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.1)', animation: 'vraagIn 0.25s ease' }}>
          <div style={{ position: 'relative', aspectRatio: '1240 / 640', background: `url(/mijn-split/${fotoVoor(actief, locatie)}.jpg) center / cover` }}>
            <div style={{ position: 'absolute', left: m ? 14 : 18, bottom: m ? 12 : 16 }}>
              <div style={{ ...klein, color: WIT }}>Training {twee(nr)} · {wanneer}</div>
              <div style={{ fontFamily: ANTON, fontSize: m ? '2.1rem' : '2.6rem', lineHeight: 1, color: WIT, marginTop: 6, textTransform: 'uppercase' }}>{DAG_NAAM[actief]}</div>
            </div>
          </div>
          <div style={{ padding: m ? '0.2rem 1rem 1rem' : '0.3rem 1.2rem 1.2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.8rem 0' }}>
              {[['Per training', `${dag.oefeningen.length} oef. · ${totaalSets(dag.oefeningen)} sets`], ['Tijd', `± ${duur(dag.oefeningen)} min`], ['Elke werkset', 'Tot falen']].map(([l, w], k) => (
                <div key={l} style={{ paddingLeft: k ? 10 : 0, borderLeft: k ? '1px solid rgba(255,255,255,0.08)' : 'none', minWidth: 0 }}>
                  <div style={{ ...klein, fontSize: '0.56rem' }}>{l}</div>
                  <div style={{ fontSize: m ? '0.86rem' : '0.95rem', fontWeight: 900, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w}</div>
                </div>
              ))}
            </div>
            {dag.oefeningen.map((o, j) => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0', borderBottom: j === dag.oefeningen.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ width: 18, flexShrink: 0, fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>{twee(j + 1)}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3 }}>{o.naam}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 900, whiteSpace: 'nowrap' }}>{o.sets} × {o.reps}</span>
                <span style={{ fontSize: '0.75rem', color: ZWAK, fontWeight: 700, whiteSpace: 'nowrap', width: 42, textAlign: 'right' }}>{o.rust}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wat de PDF extra heeft, met nog een downloadknop. */}
      <div style={{ marginTop: '1.2rem', padding: m ? '1rem' : '1.1rem 1.2rem', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: '0.98rem', fontWeight: 900 }}>In de PDF staat ook</div>
        {['Een logboek per set voor 4 weken', 'Hoe je opwarmt en hoe lang je rust', 'Hoe je progressie bijhoudt'].map(t => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            <Check size={16} strokeWidth={3} style={{ flexShrink: 0 }} /> {t}
          </div>
        ))}
        <button onClick={onDownload} disabled={!dagen || pdfBezig} style={{ ...knopWit(m, !dagen || pdfBezig), marginTop: '1rem', minHeight: m ? 52 : 56, fontSize: '1rem' }}>
          {pdfBezig ? <Loader2 size={20} style={{ animation: 'draai 1s linear infinite' }} /> : <Download size={20} strokeWidth={2.6} />}
          {pdfBezig ? 'PDF maken…' : 'Download de PDF'}
        </button>
      </div>
    </div>
  )
}

// ── De pagina ──────────────────────────────────────────────────────────────

export default function MijnSplit() {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [open, setOpen] = useState(false)
  const [zwevend, setZwevend] = useState(false)
  const heroCtaRef = useRef(null)
  const formGestart = useRef(false)
  const openForm = () => {
    setOpen(true); meet('knop')
    if (!formGestart.current) { formGestart.current = true; meet('form_start') }
  }
  const sluit = useCallback(() => setOpen(false), [])

  // Bezoek bij binnenkomst, tijd op de pagina tot het verlaten.
  useEffect(() => {
    meet('bezoek')
    return volgTijdOpPagina()
  }, [])

  useEffect(() => {
    const check = () => setM(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Zwevende knop alleen als de bovenste knop voorbij is en er geen andere
  // startknop in beeld staat, zoals op /challenge.
  useEffect(() => {
    const hero = heroCtaRef.current
    if (!hero) return
    const knoppen = [...document.querySelectorAll('[data-cta]')]
    const zichtbaar = new Set()
    let heroVoorbij = false
    const obs = new IntersectionObserver((items) => {
      items.forEach(e => {
        if (e.target === hero) heroVoorbij = !e.isIntersecting && e.boundingClientRect.top < 0
        else if (e.isIntersecting) zichtbaar.add(e.target)
        else zichtbaar.delete(e.target)
      })
      setZwevend(heroVoorbij && zichtbaar.size === 0)
    }, { threshold: 0 })
    obs.observe(hero)
    knoppen.forEach(k => { if (!hero.contains(k)) obs.observe(k) })
    return () => obs.disconnect()
  }, [])

  return (
    <div style={{ background: BG, color: WIT, minHeight: '100vh', fontFamily: FONT }}>
      {/* Vaste balk: logo en witte pil samen in het midden. */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: BG, borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        padding: `calc(env(safe-area-inset-top, 0px) + ${m ? '0.6rem' : '0.75rem'}) 1rem ${m ? '0.6rem' : '0.75rem'}`,
      }}>
        <img src="/ma-logo-header.png" alt="MY ARC" style={{ height: m ? 30 : 36, width: 'auto', display: 'block', flexShrink: 0, marginRight: m ? 8 : 12 }} />
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: m ? '0.45rem 0.85rem' : '0.5rem 1.1rem', borderRadius: 6,
          background: WIT, color: '#000', fontSize: m ? '0.66rem' : '0.74rem', fontWeight: 900, letterSpacing: '0.08em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
          Gratis trainingssplit | MY ARC
        </span>
      </div>

      {/* Kop op het donkere vlak. */}
      <section style={{ background: HERO_BG, padding: `${m ? '5.4rem' : '7.5rem'} ${m ? '1.25rem' : '3rem'} 0` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Kop m={m} center groot>Welke trainingssplit past bij jou?</Kop>
          <Tekst m={m} center style={{ marginTop: m ? '1.2rem' : '1.6rem', fontSize: m ? '1.3rem' : '1.55rem', fontWeight: 800, lineHeight: 1.35, color: WIT }}>
            Beantwoord 4 vragen en krijg de split waar mijn klanten mee trainen.
          </Tekst>
        </div>
      </section>
      {/* Video op de overgang: boven donker, onder wit. */}
      <div style={{
        background: `linear-gradient(180deg, ${HERO_BG} 0%, ${HERO_BG} 50%, #fff 50%, #fff 100%)`,
        padding: `${m ? '2.2rem' : '3rem'} ${m ? '1.25rem' : '3rem'} 0`,
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Video m={m} />
        </div>
      </div>
      <section style={{ background: '#fff', color: '#000', padding: `${m ? '2rem' : '2.8rem'} ${m ? '1.25rem' : '3rem'} ${m ? '3.2rem' : '4.5rem'}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div ref={heroCtaRef}>
            <Cta m={m} onClick={openForm} licht sub="4 vragen · gratis · direct als PDF" />
          </div>
        </div>
      </section>

      {/* Wat erin staat, als vinkjes. */}
      <Sectie m={m} smal>
        <Kop m={m}>Wat erin staat</Kop>
        <div style={{ marginTop: m ? '1.1rem' : '1.4rem' }}>
          {INHOUD.map((t, i) => (
            <div key={t} style={{
              display: 'flex', gap: '0.8rem', alignItems: 'center', padding: m ? '0.75rem 0' : '0.95rem 0',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Check size={m ? 22 : 26} strokeWidth={3} color={WIT} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.3 }}>{t}</span>
            </div>
          ))}
        </div>
      </Sectie>

      {/* Wat je krijgt: de pagina's van de PDF zelf. */}
      <Sectie m={m} grijs>
        <Kop m={m} center licht>Dit krijg je</Kop>
        <Tekst m={m} center dim licht style={{ marginTop: '0.8rem' }}>Een PDF van 6 à 8 pagina's, gemaakt op jouw antwoorden.</Tekst>
        <div style={{
          display: m ? 'flex' : 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: m ? 12 : 18,
          overflowX: m ? 'auto' : 'visible', scrollSnapType: m ? 'x mandatory' : undefined, scrollbarWidth: 'none',
          margin: m ? '1.6rem -1.25rem 0' : '2.2rem 0 0', padding: m ? '0 1.25rem 0.4rem' : 0,
        }}>
          {VOORBEELDEN.map(v => (
            <div key={v.src} style={{ flex: m ? '0 0 62%' : undefined, scrollSnapAlign: 'start' }}>
              <img src={v.src} alt={v.label} draggable={false} loading="lazy" style={{
                width: '100%', height: 'auto', display: 'block', borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.22)', aspectRatio: '210 / 297', objectFit: 'cover', background: '#0e0e0e',
              }} />
              <div style={{ marginTop: '0.6rem', fontSize: m ? '0.82rem' : '0.9rem', fontWeight: 900, color: '#000', textAlign: 'center' }}>{v.label}</div>
            </div>
          ))}
        </div>
      </Sectie>

      {/* De coach, zoals op /challenge (zwart, tussen twee lichte vlakken). */}
      <Sectie m={m} style={{ paddingBottom: m ? '6.5rem' : '9rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: m ? '1fr' : '1.15fr 0.85fr', gap: m ? '1.4rem' : '3rem', alignItems: 'center' }}>
          <div>
            {m ? (
              // Telefoon: schermbreed vak met de foto rechts, naar links
              // weggevaagd in zwart, en de kop links eroverheen.
              <div style={{ position: 'relative', minHeight: 440, margin: '-4rem -1.25rem 0', overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'flex-end' }}>
                <img src="/waarom-kersten.jpg" alt="Kersten" draggable={false}
                  style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '74%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, #000 0%, #000 26%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0) 72%)' }} />
                <div aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', background: 'linear-gradient(0deg, #000 0%, rgba(0,0,0,0) 100%)' }} />
                <div style={{ position: 'relative', width: '62%', padding: '1.3rem 0 1.4rem 1.25rem' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.15em', color: ZWAK, textTransform: 'uppercase', marginBottom: '0.7rem' }}>De coach</div>
                  <h2 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 900, lineHeight: 1.02, letterSpacing: '-0.02em', color: WIT, textTransform: 'uppercase' }}>Ik ben Kersten.</h2>
                  <p style={{ margin: '0.6rem 0 0', fontSize: '1rem', fontWeight: 800, lineHeight: 1.35, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
                    En dit is hoe mijn klanten trainen.
                  </p>
                </div>
              </div>
            ) : (<>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: ZWAK, textTransform: 'uppercase', marginBottom: '0.9rem' }}>De coach</div>
              <Kop m={m}>Ik ben Kersten. En dit is hoe mijn klanten trainen.</Kop>
            </>)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.4rem' }}>
              <Tekst m={m}>Als ondernemer heb ik zelf ook niet altijd tijd om lang in de sportschool te staan. Ik begrijp dus dat je resultaat wilt boeken met de tijd die je beschikbaar hebt.</Tekst>
              <Tekst m={m}>Ik begeleid al tientallen mannen en help ze om concrete oplossingen te vinden voor de dingen waar ze op vastlopen.</Tekst>
              <p style={{ margin: '0.4rem 0 0', fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.35, color: WIT }}>
                Deze splits zijn dezelfde waar mijn klanten mee trainen. Zo zie je hoe ik het aanpak, en kun je er vandaag mee beginnen.
              </p>
            </div>
          </div>
          {!m && (
            <div style={{
              borderRadius: 18, overflow: 'hidden', aspectRatio: '4 / 5', border: '1px solid rgba(255,255,255,0.1)',
              backgroundImage: 'url(/waarom-kersten.jpg)', backgroundSize: 'cover', backgroundPosition: 'center top',
            }} />
          )}
        </div>
      </Sectie>

      {/* Slot (wit, na de zwarte coach-sectie). */}
      <Sectie m={m} licht style={{ paddingBottom: m ? '7rem' : '8rem' }}>
        <Kop m={m} center licht>Klaar voor je split?</Kop>
        <Tekst m={m} center dim licht style={{ marginTop: '0.9rem' }}>Vier vragen, dan staat hij voor je klaar.</Tekst>
        <Cta m={m} onClick={openForm} licht style={{ marginTop: m ? '1.8rem' : '2.4rem' }} />
        <div style={{ marginTop: m ? '2.5rem' : '3rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(0,0,0,0.35)' }}>
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
        </div>
      </Sectie>

      {/* Zwevende knop zodra de bovenste knop uit beeld is. */}
      <button onClick={openForm} style={{
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', position: 'fixed', left: '50%',
        bottom: `calc(env(safe-area-inset-bottom, 0px) + ${m ? '1.1rem' : '1.5rem'})`, transform: 'translateX(-50%)', zIndex: 90,
        opacity: zwevend ? 1 : 0, pointerEvents: zwevend ? 'auto' : 'none', transition: 'opacity 0.25s ease',
        padding: m ? '0.85rem 1.6rem' : '0.95rem 2rem', borderRadius: 999, background: CTA_GROEN, color: WIT,
        fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.03em',
        boxShadow: '0 4px 24px rgba(0,0,0,0.5)', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}>
        {CTA_TEKST}
      </button>

      <ModalKader open={open} onClose={sluit} m={m}>
        <SplitFlow m={m} />
      </ModalKader>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html { scroll-behavior: smooth; }
        body { background: #000; margin: 0; }
        input::placeholder { color: rgba(255,255,255,0.35); }
        @keyframes bladWaas { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes vraagIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes tikGeluid { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
        @keyframes draai { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}
