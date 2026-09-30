// src/client/components/VideoReminderPopup.jsx
//
// Overkoepelende herinnering voor de video's die de coach als belangrijk heeft
// gemarkeerd en die deze klant nog niet gezien heeft.
//
// Waarom naast het blok op de pagina zelf: dat blok zie je alleen als je op die
// pagina komt. Een klant die nooit naar Meal gaat, ziet de uitleg over zijn
// voedingsplan dus nooit. Deze herinnering staat op elke pagina en noemt álle
// openstaande video's, met de pagina waar ze thuishoren.
//
// Drie fases, zelfde patroon als de check-in-nudge:
//
//   1. kaart — schuift vanaf rechts in beeld, blijft aan die rand plakken.
//   2. pill  — smal tabje tegen de rechterrand zodra de kaart is weggeklikt.
//              Blijft staan zolang er video's open zijn en schudt af en toe.
//   3. lijst — sheet met alle openstaande video's; een tik speelt er één af.
//
// Bewust géén donkere waas over de pagina en bewust niet onderaan gecentreerd:
// de check-in-nudge doet dat al, en twee elementen die om dezelfde plek en
// dezelfde aandacht vechten maken ze beide makkelijker te negeren.
//
// Bewust geen localStorage-snooze: deze video's moeten gezien worden. Wegklikken
// verplaatst de herinnering naar de pill, hij verdwijnt pas als alles bekeken is.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlayCircle, X, ArrowRight, Check } from 'lucide-react'
import videoService from '../../modules/videos/VideoService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'

// Hoe de pagina's heten tegen de klant.
const PAGINA_NAAM = {
  home: 'Home', workout: 'Workout', meal: 'Maaltijden',
  tracking: 'Tracking', boodschappen: 'Boodschappen', calls: 'Calls',
}

const paginaLabel = (paginas) => (paginas || [])
  .map(p => PAGINA_NAAM[p] || p)
  .filter(Boolean)
  .join(' · ')

// Even wachten voordat de kaart komt: meteen bij het openen van de app schuift
// er al genoeg in beeld, en dan is dit het zoveelste ding dat wegklikt moet.
const WACHT_VOOR_KAART = 2600
const SCHUD_INTERVAL = 26000

export default function VideoReminderPopup({ client, isMobile: propMobile, version = 0 }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  const [items, setItems] = useState([])
  const [fase, setFase] = useState('init')   // 'init' | 'kaart' | 'pill' | 'lijst'
  const [speler, setSpeler] = useState(null)
  const [bezig, setBezig] = useState(null)
  const [schudt, setSchudt] = useState(false)
  // Is de kaart deze sessie al geweest? Dan niet opnieuw bij elke herlading van
  // de lijst — anders springt hij terug in beeld nadat je hem net wegklikte.
  const kaartGeweest = useRef(false)

  useEffect(() => {
    let weg = false
    if (!client?.id) return undefined
    videoService.getOpenBelangrijkeVideos(client.id)
      .then(lijst => {
        if (weg) return
        const open = lijst || []
        setItems(open)
        if (open.length === 0) { setFase('init'); return }
        if (kaartGeweest.current) { setFase(f => (f === 'lijst' ? 'lijst' : 'pill')); return }
        const t = setTimeout(() => {
          if (weg) return
          kaartGeweest.current = true
          setFase('kaart')
        }, WACHT_VOOR_KAART)
        return () => clearTimeout(t)
      })
      .catch(e => { console.error('Openstaande video\'s laden mislukt:', e); if (!weg) setItems([]) })
    return () => { weg = true }
  }, [client?.id, version])

  // De pill schudt af en toe, anders wordt hij deel van het meubilair.
  useEffect(() => {
    if (fase !== 'pill') return undefined
    const i = setInterval(() => {
      setSchudt(true)
      setTimeout(() => setSchudt(false), 900)
    }, SCHUD_INTERVAL)
    return () => clearInterval(i)
  }, [fase])

  const afvinken = async (item, via) => {
    setBezig(item.video_id)
    await videoService.markeerVideoGezien(client.id, item.video_id, via, item.assignment_id)
    const over = items.filter(i => i.video_id !== item.video_id)
    setItems(over)
    setBezig(null)
    // Laatste video bekeken → alles weg. Anders blijft de lijst open zodat de
    // klant er meteen nog een kan pakken.
    if (over.length === 0) setFase('init')
    // De pagina zelf leest dezelfde lijst; die mag meteen bijwerken.
    window.dispatchEvent(new CustomEvent('myarc:video-gezien', { detail: { videoId: item.video_id } }))
  }

  const sluitSpeler = async () => {
    const item = speler
    setSpeler(null)
    if (item) await afvinken(item, 'speler')
  }

  if (!client?.id || items.length === 0 || fase === 'init') {
    return speler ? <VideoPlayerModal item={{ id: speler.assignment_id, video: speler.video }} onClose={sluitSpeler} /> : null
  }

  const aantal = items.length
  const meervoud = aantal !== 1

  const speler_ = speler && (
    <VideoPlayerModal item={{ id: speler.assignment_id, video: speler.video }} onClose={sluitSpeler} />
  )

  // ── LIJST ────────────────────────────────────────────────────────────────
  if (fase === 'lijst') {
    return createPortal(
      <>
        <div
          onClick={() => setFase('pill')}
          style={{
            position: 'fixed', inset: 0, zIndex: 2147483000,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 520, maxHeight: '85vh', overflowY: 'auto',
              background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px 20px 0 0', padding: '1.25rem 1.1rem 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
              <PlayCircle size={18} color="#fff" strokeWidth={2.6} />
              <span style={{ flex: 1, fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                Nog {aantal} video{meervoud ? "'s" : ''} te gaan
              </span>
              <button
                onClick={() => setFase('pill')}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                  width: 34, height: 34, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', cursor: 'pointer',
                }}
              >
                <X size={16} color="#fff" />
              </button>
            </div>

            <p style={{
              fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.55,
              color: 'rgba(255,255,255,0.5)', margin: '0 0 1rem',
            }}>
              Deze horen bij je plan. Kort, en je haalt er daarna meer uit.
            </p>

            {items.map((item, i) => (
              <div
                key={item.video_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '0.8rem 0',
                  borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)',
                  opacity: bezig === item.video_id ? 0.4 : 1,
                }}
              >
                <button
                  onClick={() => setSpeler(item)}
                  disabled={!!bezig}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 11,
                    background: 'transparent', border: 'none', padding: 0,
                    cursor: 'pointer', textAlign: 'left', minHeight: 48,
                  }}
                >
                  <div style={{
                    width: 62, height: 40, borderRadius: 8, flexShrink: 0,
                    background: item.video?.thumbnail_url
                      ? `url(${item.video.thumbnail_url}) center/cover`
                      : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {!item.video?.thumbnail_url && <PlayCircle size={18} color="rgba(255,255,255,0.4)" />}
                  </div>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      display: 'block', fontSize: '0.87rem', fontWeight: 900, color: '#fff',
                      letterSpacing: '-0.015em', lineHeight: 1.3,
                    }}>
                      {item.video?.title || 'Video'}
                    </span>
                    {paginaLabel(item.paginas) && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                        {paginaLabel(item.paginas)}
                      </span>
                    )}
                  </span>
                </button>

                {/* Zelf afvinken mag: wie de video al buiten de app heeft gezien
                    hoeft er niet nog een keer door. */}
                <button
                  onClick={() => afvinken(item, 'knop')}
                  disabled={!!bezig}
                  aria-label="Al bekeken"
                  style={{
                    flexShrink: 0, width: 38, height: 38, borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={15} color="rgba(255,255,255,0.6)" strokeWidth={2.8} />
                </button>
              </div>
            ))}
          </div>
        </div>
        {speler_}
      </>,
      document.body
    )
  }

  // ── PILL ─────────────────────────────────────────────────────────────────
  // Tegen de rechterrand en verticaal in het midden: de bottom-bar en de
  // check-in-pill zitten onderaan, daar is het al vol.
  if (fase === 'pill') {
    return createPortal(
      <>
        <button
          onClick={() => setFase('lijst')}
          aria-label={`${aantal} video's nog te bekijken`}
          style={{
            position: 'fixed',
            right: 0,
            top: '46%',
            zIndex: 95,
            display: 'flex', alignItems: 'center', gap: 7,
            padding: isMobile ? '0.6rem 0.75rem' : '0.7rem 0.9rem',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRight: 'none',
            borderRadius: '12px 0 0 12px',
            color: '#fff', fontWeight: 900,
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            letterSpacing: '-0.02em',
            cursor: 'pointer', touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '-6px 0 20px rgba(0,0,0,0.55)',
            animation: schudt ? 'videoNudge 0.9s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          }}
        >
          <PlayCircle size={isMobile ? 16 : 18} strokeWidth={2.6} style={{ flexShrink: 0 }} />
          {aantal}
        </button>
        <style>{`
          @keyframes videoNudge {
            0%, 100% { transform: translateX(0); }
            15%, 45%, 75% { transform: translateX(-6px); }
            30%, 60%, 90% { transform: translateX(0); }
          }
        `}</style>
        {speler_}
      </>,
      document.body
    )
  }

  // ── KAART ────────────────────────────────────────────────────────────────
  // Geen waas over de pagina: dit is een duwtje, geen blokkade. De check-in
  // dimt wel, en die mag de enige zijn die dat doet.
  const breedte = isMobile ? 'min(330px, 88vw)' : 380

  return createPortal(
    <>
      <div
        onClick={() => setFase('lijst')}
        style={{
          position: 'fixed',
          right: 0,
          // Onder de check-in-melding (die zit op 180/214 en is ~90 hoog),
          // zodat ze niet over elkaar heen vallen als ze samen in beeld staan.
          top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 300px)' : 330,
          zIndex: 94,
          width: breedte,
          borderRadius: '16px 0 0 16px',
          overflow: 'hidden',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRight: 'none',
          boxShadow: '0 16px 44px rgba(0,0,0,0.7)',
          cursor: 'pointer', touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          animation: 'videoKaartIn 0.42s cubic-bezier(0.22,1,0.36,1) both',
          padding: isMobile ? '0.85rem 0.95rem' : '1rem 1.1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
          <PlayCircle size={isMobile ? 16 : 18} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0 }} />
          <span style={{
            flex: 1, fontSize: isMobile ? '0.88rem' : '0.95rem', fontWeight: 900,
            color: '#fff', letterSpacing: '-0.02em',
          }}>
            Heb je deze video{meervoud ? "'s" : ''} al bekeken?
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setFase('pill') }}
            aria-label="Later"
            style={{
              flexShrink: 0, background: 'transparent', border: 'none',
              padding: 4, cursor: 'pointer', display: 'flex',
            }}
          >
            <X size={15} color="rgba(255,255,255,0.4)" />
          </button>
        </div>
        <div style={{
          fontSize: isMobile ? '0.74rem' : '0.79rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.5)', lineHeight: 1.45,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ flex: 1 }}>
            {aantal} video{meervoud ? "'s" : ''} die bij je plan hoort{meervoud ? 'en' : ''}.
          </span>
          <ArrowRight size={14} strokeWidth={2.8} style={{ flexShrink: 0 }} />
        </div>
      </div>
      <style>{`
        @keyframes videoKaartIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      {speler_}
    </>,
    document.body
  )
}
