// src/pages/leadmagnet/Bouwstenen.jsx
// Gedeelde bouwstenen van de lead magnets (/mijn-split, /mijn-menu) in de
// huisstijl van /challenge: koppen, tekst, groene knop, secties, de
// videospeler met eigen bediening, de modal en de keuzevakken van het
// formulier. Meting van de video via meet() (challenge_events, pad = pagina).
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Play, Volume2, VolumeX, Pause, X } from 'lucide-react'
import { meet, volgTijdOpPagina } from '../challengeTracking'
import { appSafeEmbedUrl } from '../../modules/videos/utils/youtubeHelpers'
import { WIT, ZWAK, CTA_GROEN, BG, HERO_BG, FONT } from './stijl'

// ── Bouwstenen (zelfde maten als /challenge) ──────────────────────────────

export function Kop({ children, m, center, groot, licht }) {
  return (
    <h2 style={{
      margin: 0, fontSize: groot ? (m ? '1.75rem' : '2.9rem') : (m ? '1.5rem' : '2.1rem'),
      fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: licht ? '#000' : WIT,
      textTransform: 'uppercase', textAlign: center ? 'center' : 'left',
    }}>{children}</h2>
  )
}

export function Tekst({ children, m, center, dim, licht, style }) {
  return (
    <p style={{
      margin: 0, fontSize: m ? '0.98rem' : '1.08rem', fontWeight: 600, lineHeight: 1.55, letterSpacing: '-0.01em',
      color: licht ? (dim ? 'rgba(0,0,0,0.6)' : '#1a1a1a') : (dim ? ZWAK : 'rgba(255,255,255,0.85)'),
      textAlign: center ? 'center' : 'left', ...style,
    }}>{children}</p>
  )
}

export function Cta({ m, onClick, tekst, sub, licht, style }) {
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
        {tekst}
      </button>
      {sub && (
        <div style={{ fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 800, color: licht ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.45)', textAlign: 'center' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export function Sectie({ children, m, smal, licht, grijs, style }) {
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
// geluid, een balk die eerst snel loopt). Zonder videoId alleen het beeld.
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

export function Video({ m, videoId, poster }) {
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

  const directeEmbed = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
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
        <button onClick={() => { if (videoId) { setGestart(true); meet('video_start') } }} disabled={!videoId} aria-label="Video afspelen" style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', padding: 0, border: 'none',
          cursor: videoId ? 'pointer' : 'default', background: `url(${poster}) center / cover`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          {videoId && <Play size={m ? 64 : 84} fill={WIT} color={WIT} strokeWidth={1} style={{ position: 'relative', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.6))' }} />}
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

export function ModalKader({ open, onClose, m, children }) {
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

export function Optie({ label, aan, onClick, m, meer }) {
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
        width: 24, height: 24, flexShrink: 0, borderRadius: meer ? 7 : '50%', border: `2px solid ${aan ? WIT : 'rgba(255,255,255,0.3)'}`,
        background: aan ? WIT : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {aan && <Check size={15} strokeWidth={3.5} color="#000" />}
      </span>
    </button>
  )
}

// ── De pagina ──────────────────────────────────────────────────────────────

// Eén lead-magnetpagina: vaste balk, kop, video op de overgang zwart/wit,
// groene knop met drie stappen, "wat erin staat" (zwart), voorbeelden van de
// PDF (grijs), de coach (zwart), slot (wit), zwevende knop en de modal met het
// formulier. `cfg` levert de teksten; children(m) is het formulier.
export function LeadMagnetPagina({ cfg, children }) {
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
          {cfg.pil}
        </span>
      </div>

      {/* Kop op het donkere vlak. */}
      <section style={{ background: HERO_BG, padding: `${m ? '5.4rem' : '7.5rem'} ${m ? '1.25rem' : '3rem'} 0` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <Kop m={m} center groot>{cfg.kop}</Kop>
          <Tekst m={m} center style={{ marginTop: m ? '1.2rem' : '1.6rem', fontSize: m ? '1.3rem' : '1.55rem', fontWeight: 800, lineHeight: 1.35, color: WIT }}>
            {cfg.sub}
          </Tekst>
        </div>
      </section>
      {/* Video op de overgang: boven donker, onder wit. */}
      <div style={{
        background: `linear-gradient(180deg, ${HERO_BG} 0%, ${HERO_BG} 50%, #fff 50%, #fff 100%)`,
        padding: `${m ? '2.2rem' : '3rem'} ${m ? '1.25rem' : '3rem'} 0`,
      }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <Video m={m} videoId={cfg.videoId} poster={cfg.poster} />
        </div>
      </div>
      <section style={{ background: '#fff', color: '#000', padding: `${m ? '2rem' : '2.8rem'} ${m ? '1.25rem' : '3rem'} ${m ? '3.2rem' : '4.5rem'}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div ref={heroCtaRef}>
            <Cta m={m} onClick={openForm} tekst={cfg.cta} licht />
          </div>
          {/* Drie bollen 1-2-3 op één lijn met eronder het woord en een korte
              regel, zoals de stappen op /challenge. Tik = formulier open. */}
          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 620, margin: `${m ? '1.8rem' : '2.4rem'} auto 0` }}>
            <span aria-hidden style={{ position: 'absolute', left: '16.67%', right: '16.67%', top: (m ? 44 : 52) / 2 - 1, height: 2, background: 'rgba(0,0,0,0.15)' }} />
            {cfg.stappen.map((st, i) => (
              <button key={st.kop} onClick={openForm} aria-label={st.kop} style={{
                position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: m ? 8 : 10,
                padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                <span style={{
                  width: m ? 44 : 52, height: m ? 44 : 52, borderRadius: '50%', background: '#000', color: WIT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m ? '1.1rem' : '1.25rem', fontWeight: 900,
                  boxShadow: '0 0 0 5px #fff',
                }}>{i + 1}</span>
                <span style={{ fontSize: m ? '0.92rem' : '1.15rem', fontWeight: 900, color: '#000', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{st.kop}</span>
                <span style={{ marginTop: -4, fontSize: m ? '0.78rem' : '0.88rem', fontWeight: 700, color: 'rgba(0,0,0,0.55)', lineHeight: 1.3 }}>{st.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Wat erin staat, als vinkjes. */}
      <Sectie m={m} smal>
        <Kop m={m}>{cfg.inhoudKop || 'Wat erin staat'}</Kop>
        <div style={{ marginTop: m ? '1.1rem' : '1.4rem' }}>
          {cfg.inhoud.map((t, i) => (
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
        <Tekst m={m} center dim licht style={{ marginTop: '0.8rem' }}>{cfg.voorbeeldTekst}</Tekst>
        <div style={{
          display: m ? 'flex' : 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: m ? 12 : 18,
          overflowX: m ? 'auto' : 'visible', scrollSnapType: m ? 'x mandatory' : undefined, scrollbarWidth: 'none',
          margin: m ? '1.6rem -1.25rem 0' : '2.2rem 0 0', padding: m ? '0 1.25rem 0.4rem' : 0,
        }}>
          {cfg.voorbeelden.map(v => (
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
                    {cfg.coachKort}
                  </p>
                </div>
              </div>
            ) : (<>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.15em', color: ZWAK, textTransform: 'uppercase', marginBottom: '0.9rem' }}>De coach</div>
              <Kop m={m}>Ik ben Kersten. {cfg.coachKort}</Kop>
            </>)}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.4rem' }}>
              <Tekst m={m}>Als ondernemer heb ik zelf ook niet altijd tijd om lang in de sportschool te staan. Ik begrijp dus dat je resultaat wilt boeken met de tijd die je beschikbaar hebt.</Tekst>
              <Tekst m={m}>Ik begeleid al tientallen mannen en help ze om concrete oplossingen te vinden voor de dingen waar ze op vastlopen.</Tekst>
              <p style={{ margin: '0.4rem 0 0', fontSize: m ? '1.05rem' : '1.15rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.35, color: WIT }}>
                {cfg.coachSlot}
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
        <Kop m={m} center licht>{cfg.slotKop}</Kop>
        <Tekst m={m} center dim licht style={{ marginTop: '0.9rem' }}>{cfg.slotTekst}</Tekst>
        <Cta m={m} onClick={openForm} tekst={cfg.cta} licht style={{ marginTop: m ? '1.8rem' : '2.4rem' }} />
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
        {cfg.cta}
      </button>

      <ModalKader open={open} onClose={sluit} m={m}>
        {children(m)}
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
