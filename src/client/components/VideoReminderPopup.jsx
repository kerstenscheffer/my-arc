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
// Drie fases, exact hetzelfde patroon en dezelfde kaart als de check-in-nudge:
//
//   1. kaart — schuift vanaf rechts in beeld, met de foto van de coach.
//   2. pill  — smal tabje tegen de rechterrand zodra de kaart is weggeklikt.
//              Blijft staan zolang er video's open zijn en schudt af en toe.
//   3. lijst — sheet met alle openstaande video's; een tik speelt er één af.
//
// Het belangrijkste ontwerpbesluit zit in wat een video wegstreept. Afspelen
// doet dat níet: je kunt een video openzetten, tien seconden kijken en weer
// sluiten, en dan is de boodschap niet aangekomen terwijl de herinnering wel
// weg zou zijn. Alleen het vinkje streept weg, en dat vraagt eerst nog een
// bevestiging midden in beeld. Antwoordt de klant "ik kijk hem later", dan
// blijft de video gewoon openstaan.
//
// Bewust geen localStorage-snooze: deze video's moeten gezien worden. Wegklikken
// verplaatst de herinnering naar de pill, hij verdwijnt pas als alles bekeken is.

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlayCircle, X, ArrowRight, Check, Play } from 'lucide-react'
import videoService from '../../modules/videos/VideoService'
import VideoPlayerModal from '../../modules/videos/VideoPlayerModal'
import { getThumbnailFromUrl } from '../../modules/videos/utils/youtubeHelpers'

// Hoe de pagina's heten tegen de klant.
const PAGINA_NAAM = {
  home: 'Home', workout: 'Workout', meal: 'Maaltijden',
  tracking: 'Tracking', boodschappen: 'Boodschappen', calls: 'Calls',
}

const paginaLabel = (paginas) => (paginas || [])
  .map(p => PAGINA_NAAM[p] || p)
  .filter(Boolean)
  .join(' · ')

// De thumbnail staat lang niet altijd op de video-rij; voor een YouTube-link
// valt hij af te leiden uit de URL. Zonder deze terugval blijft het vakje leeg.
const thumbVan = (v) => v?.thumbnail_url || getThumbnailFromUrl(v?.video_url) || null

// Even wachten voordat de kaart komt: meteen bij het openen van de app schuift
// er al genoeg in beeld, en dan is dit het zoveelste ding dat wegklikt moet.
const WACHT_VOOR_KAART = 2600
const SCHUD_INTERVAL = 26000

export default function VideoReminderPopup({ client, isMobile: propMobile, version = 0 }) {
  const isMobile = propMobile ?? (typeof window !== 'undefined' && window.innerWidth <= 768)

  const [items, setItems] = useState([])
  const [fase, setFase] = useState('init')   // 'init' | 'kaart' | 'pill' | 'lijst'
  const [speler, setSpeler] = useState(null)
  const [bevestig, setBevestig] = useState(null)  // item waarvoor "echt gekeken?" openstaat
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

  // Alleen hiermee gaat een video weg, en alleen na de bevestiging hieronder.
  const echtGezien = async (item) => {
    setBevestig(null)
    setBezig(item.video_id)
    await videoService.markeerVideoGezien(client.id, item.video_id, 'knop', item.assignment_id)
    const over = items.filter(i => i.video_id !== item.video_id)
    setItems(over)
    setBezig(null)
    if (over.length === 0) setFase('init')
    // Het blok op de pagina zelf leest dezelfde lijst; dat mag meteen bij.
    window.dispatchEvent(new CustomEvent('myarc:video-gezien', { detail: { videoId: item.video_id } }))
  }

  // De speler sluiten doet niets. Dat is het hele punt: wie hem heeft
  // afgespeeld moet zelf bevestigen dat hij hem ook echt heeft uitgekeken.
  const sluitSpeler = () => setSpeler(null)

  const speler_ = speler && (
    <VideoPlayerModal item={{ id: speler.assignment_id, video: speler.video }} onClose={sluitSpeler} />
  )

  // ── BEVESTIGING ──────────────────────────────────────────────────────────
  // Midden in beeld, boven alles heen. Bewust twee volwaardige knoppen en geen
  // klein kruisje: "nee, later" is een echt antwoord, geen ontsnapping.
  const bevestiging = bevestig && createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483300,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.25rem',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 380,
        background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: 18, padding: isMobile ? '1.25rem 1.1rem' : '1.5rem 1.35rem',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
      }}>
        <div style={{
          fontSize: isMobile ? '1.05rem' : '1.15rem', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.025em', lineHeight: 1.25, marginBottom: 6,
        }}>
          Heb je deze video echt gekeken?
        </div>
        <div style={{
          fontSize: isMobile ? '0.76rem' : '0.8rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.5)', lineHeight: 1.45, marginBottom: '1.1rem',
        }}>
          {bevestig.video?.title}
        </div>

        <button
          onClick={() => echtGezien(bevestig)}
          style={{
            width: '100%', minHeight: 48, marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#fff', border: 'none', borderRadius: 12,
            color: '#0a0a0a', fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={16} strokeWidth={3} />
          Ja, helemaal gekeken
        </button>

        <button
          onClick={() => setBevestig(null)}
          style={{
            width: '100%', minHeight: 48,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, color: 'rgba(255,255,255,0.65)',
            fontSize: isMobile ? '0.82rem' : '0.86rem', fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          Nee, ik kijk hem later helemaal
        </button>
      </div>
    </div>,
    document.body
  )

  if (!client?.id || items.length === 0 || fase === 'init') {
    return <>{speler_}{bevestiging}</>
  }

  const aantal = items.length
  const meervoud = aantal !== 1

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
              fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.5,
              color: 'rgba(255,255,255,0.78)', margin: '0 0 1rem',
            }}>
              Enorm belangrijk dat je deze {aantal} video{meervoud ? "'s" : ''} nog bekijkt.
            </p>

            {items.map((item, i) => {
              const thumb = thumbVan(item.video)
              return (
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
                      position: 'relative', width: 78, height: 48, borderRadius: 9, flexShrink: 0,
                      overflow: 'hidden', backgroundColor: '#1a1a1a',
                      backgroundImage: thumb ? `url(${thumb})` : 'none',
                      backgroundSize: 'cover', backgroundPosition: 'center',
                    }}>
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        width: 24, height: 24, borderRadius: '50%', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.5)',
                      }}>
                        <Play size={11} fill="#0a0a0a" strokeWidth={0} style={{ marginLeft: 1 }} />
                      </div>
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

                  {/* Het vinkje is de enige route naar weg — en vraagt eerst
                      nog of hij 'm echt helemaal gekeken heeft. */}
                  <button
                    onClick={() => setBevestig(item)}
                    disabled={!!bezig}
                    aria-label="Ik heb 'm gekeken"
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
              )
            })}
          </div>
        </div>
        {speler_}
        {bevestiging}
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
        {bevestiging}
      </>,
      document.body
    )
  }

  // ── KAART ────────────────────────────────────────────────────────────────
  // Zelfde vorm, maat en foto als de check-in-nudge: rechts ingeschoven kaart
  // met de coach erop. Alleen de plek op het scherm verschilt, zodat de twee
  // niet over elkaar heen vallen als ze tegelijk in beeld staan.
  const breedte = isMobile ? 'min(330px, 88vw)' : 380
  const hoogte = isMobile ? 84 : 94

  return createPortal(
    <>
      <div
        onClick={() => setFase('pill')}
        style={{
          position: 'fixed', inset: 0, zIndex: 93,
          background: 'rgba(0,0,0,0.62)',
          backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
          animation: 'videoDim 0.3s ease both',
        }}
      />
      <div
        onClick={() => setFase('lijst')}
        style={{
          position: 'fixed',
          right: 0,
          // Onder de check-in-melding (die zit op 180/214 en is ~90 hoog).
          top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + 300px)' : 330,
          zIndex: 94,
          width: breedte, height: hoogte,
          borderRadius: '16px 0 0 16px',
          overflow: 'hidden',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRight: 'none',
          boxShadow: '0 16px 44px rgba(0,0,0,0.75), 0 0 0 100px rgba(0,0,0,0.28)',
          cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          animation: 'videoSchuifIn 0.42s cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0,
          width: '30%',
          backgroundImage: 'url(/coach-compliment.jpg)',
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, #0a0a0a 0%, #0a0a0a 56%, rgba(10,10,10,0.85) 70%, rgba(10,10,10,0.4) 86%, rgba(10,10,10,0) 100%)',
        }} />

        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          width: '76%',
          padding: isMobile ? '0.5rem 0.4rem 0.5rem 0.9rem' : '0.6rem 0.5rem 0.6rem 1.1rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: isMobile ? '0.98rem' : '1.1rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em', lineHeight: 1.1,
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}>
            <PlayCircle size={isMobile ? 15 : 17} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            Nog {aantal} openstaand
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.76rem',
            fontWeight: 800, color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.3,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            Enorm belangrijk dat je deze nog bekijkt.
            <ArrowRight size={11} strokeWidth={3} style={{ marginLeft: 4, verticalAlign: -1 }} />
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); setFase('pill') }}
          aria-label="Later"
          style={{
            position: 'absolute', top: 5, right: 6,
            width: 24, height: 24, padding: 0,
            background: 'rgba(0,0,0,0.45)', border: 'none', borderRadius: 7,
            color: '#fff', opacity: 0.85,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={13} strokeWidth={2.8} />
        </button>

        <style>{`
          @keyframes videoSchuifIn {
            from { transform: translateX(105%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
          @keyframes videoDim { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
      {speler_}
      {bevestiging}
    </>,
    document.body
  )
}
