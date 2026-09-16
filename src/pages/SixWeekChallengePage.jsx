// src/pages/SixWeekChallengePage.jsx
//
// De 6 weken challenge-pagina: dezelfde opbouw als /6week-checkout, maar
// zonder betalen. Geen formulier, geen Stripe — de knop stuurt je naar de
// checkout. De garanties, de transformaties en de reviewslider blijven,
// want dat is wat deze pagina moet doen: overtuigen.
//
// Bewust een kopie en geen gedeelde component: de checkout mag hierdoor niet
// stukgaan, en de twee pagina's zullen uit elkaar lopen zodra de copy per
// pagina verandert.

import { useState, useEffect, useRef } from 'react'
import { Star, ChevronDown, X, Compass, ListChecks, Target, CheckCircle2, HelpCircle, Clock, BadgeEuro, Maximize2, Minimize2, ClipboardList, ShieldCheck, PartyPopper, Crosshair, Utensils, TrendingUp, Phone, ClipboardCheck, MessageCircle } from 'lucide-react'

// Geen prijs op deze pagina: het bedrag hoort bij het afrekenen en staat dus
// pas op /6week-checkout.

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
const BG = '#0a0a0a'

// Offer(0) + formulier(1). Het hero-scherm is weg: je komt hier met een
// beslissing in je hoofd, dus je begint bij het aanbod. Trustpilot en de
// transformaties staan verderop, bij de reviews onder het formulier.
const SECTION_COUNT = 2

const REVIEWS = [
  { name: 'Hessel', date: 'dec 2025', text: 'Kersten begreep het meteen! Na een uitgebreide 0-meting kreeg ik een plan op maat. Van 79,8 naar 74,4 in 8 weken. Als jij je aan het plan houdt geeft Kersten altijd de volle 100%!' },
  { name: 'Me', date: 'dec 2025', text: 'Als je hulp nodig hebt met sporten raad ik Myarc echt aan. Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls.' },
  { name: 'Indi', date: 'dec 2025', text: 'Myarc is super! Kersten helpt me iedere week met mijn maaltijden. Professioneel, persoonlijk, betrouwbaar. Ik kan Myarc aan iedereen aanraden!' },
  { name: 'Toon', date: 'nov 2025', text: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!' },
  { name: 'Sassus', date: 'nov 2025', text: 'Na 100 mislukte pogingen is het mij met Kersten gelukt een routine te creëren die ik kan continueren. Hij laat je jezelf verbazen over wat je kan bereiken.' },
  { name: 'Consumer', date: 'nov 2025', text: 'Zeer professionele aanpak! Alles duidelijk en gestructureerd in een overzichtelijke app. Feedback en motivatie op de juiste momenten. Absolute aanrader!' },
]

// Transformatie-reviews (before/after) met resultaat-tekst.
const TRANSFORMATIONS = [
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

// De slider draait reviews en transformatiefoto's door elkaar, zodat de
// foto's meeschuiven in plaats van er als los blok boven te staan.
const SLIDES = REVIEWS.flatMap((review, i) => {
  const foto = i === 1 ? TRANSFORMATIONS[0] : i === 3 ? TRANSFORMATIONS[1] : null
  return foto ? [{ soort: 'review', ...review }, { soort: 'foto', ...foto }] : [{ soort: 'review', ...review }]
})

// De 3 pijlers — copy gelijk aan /16week (OfferPilarenSection).
// ── Stroken in een blad: foto tegen de linkerrand, fade naar rechts ─────────
//
// Foto links (zo'n 20% zichtbaar), de kop half over de fade en de toelichting
// in grijs helemaal rechts. Een lijn scheidt de stroken. De negatieve marge
// haalt de padding van het blad weg, zodat de foto's de rand raken.
// ── De methode: schermvullend, één pijler per slide ─────────────────────────
//
// Drie pijlers zijn drie verhalen; in een lijstje van drie regels lees je ze
// als opsomming. Als slide krijgt elke pijler het hele scherm: foto, wat het
// is, en wat we concreet gaan doen.
const PIJLERS = [
  {
    // Op dit beeld staan de titel en de kernwoorden al; die laten we dan ook
    // weg uit de tekst eronder, anders staat alles er twee keer.
    foto: '/methode/voeding-slide.jpg',
    beeldVult: true,
    // De titel staat op dit beeld, dus de pagina zet er geen tweede boven.
    titelInBeeld: true,
    kop: 'Weet wat je eet',
    zin: 'Vaste structuur in de app, zonder rekenen. Etentjes bouwen we in.',
    doen: [
      { Icon: ClipboardList, kop: 'Structuur',     tekst: 'Plan voor jouw doel staat klaar. Nul denkwerk.' },
      { Icon: ShieldCheck,   kop: 'Zekerheid',     tekst: 'Zeker weten dat het klopt. Nooit meer gokken.' },
      { Icon: Utensils,      kop: 'Keuze',         tekst: '500 gerechten die in je plan passen.' },
      { Icon: PartyPopper,   kop: 'Flexibiliteit', tekst: 'Etentjes en vakanties leren we mee omgaan.' },
    ],
  },
  {
    foto: '/methode/training-slide.jpg',
    beeldVult: true,
    titelInBeeld: true,
    kop: 'Elke training telt',
    zin: "Schema op maat, uitlegvideo's per oefening, onder het uur.",
    doen: [
      { Icon: ClipboardList, kop: 'Structuur',  tekst: 'Persoonlijk schema: jouw dagen, jouw locatie, jouw niveau.' },
      { Icon: Crosshair,     kop: 'Focus',      tekst: 'Precies doen wat telt. Niks erbij.' },
      { Icon: ShieldCheck,   kop: 'Zekerheid',  tekst: 'Precies weten hoe, hoeveel en welke oefeningen. Nooit meer twijfelen.' },
      { Icon: TrendingUp,    kop: 'Resultaatgericht' },
    ],
  },
  {
    foto: '/methode/begeleiding-slide.jpg',
    beeldVult: true,
    titelInBeeld: true,
    kop: 'Coach in jouw corner',
    zin: 'Wekelijkse call, snel bereikbaar in de app, ik kijk mee met je cijfers.',
    doen: [
      { Icon: Phone,          tekst: 'Elke week een call over je cijfers en je week' },
      { Icon: ClipboardCheck, tekst: 'Check-in op vrijdag, daar stuur ik maandag op bij' },
      { Icon: MessageCircle,  tekst: 'Korte lijn in de app, geen dagen wachten' },
    ],
  },
]

function MethodeSlider({ isMobile, onClose }) {
  const [i, setI] = useState(0)
  const raakX = useRef(null)
  const p = PIJLERS[i]
  const naar = (n) => setI(Math.max(0, Math.min(PIJLERS.length - 1, n)))

  useEffect(() => {
    const toets = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setI(v => Math.max(0, v - 1))
      // Pijl naar rechts en Enter doen hetzelfde: verder, en op de laatste
      // slide sluiten.
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        setI(v => {
          if (v >= PIJLERS.length - 1) { onClose(); return v }
          return v + 1
        })
      }
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  }, [onClose])

  return (
    <div
      // Klikken in het venster gaat naar de volgende slide; knoppen en
      // bolletjes vangen hun eigen klik af.
      onClick={(e) => {
        if (e.target.closest('button')) return
        if (i >= PIJLERS.length - 1) onClose()
        else naar(i + 1)
      }}
      onTouchStart={(e) => { raakX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (raakX.current == null) return
        const verschil = e.changedTouches[0].clientX - raakX.current
        if (Math.abs(verschil) > 50) naar(i + (verschil < 0 ? 1 : -1))
        raakX.current = null
      }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: BG, color: '#fff',
        display: 'flex', flexDirection: 'column',
        animation: 'bladWaas 0.2s ease',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Foto over de volle breedte, met de kop er half overheen. */}
      {/* Beeld met tekst erop krijgt een vaste verhouding van 16:5, zodat wat
          je exporteert ook precies is wat je ziet: geen bijsnijden, geen zwarte
          balken. De gewone foto's blijven een band met vaste hoogte. */}
      <div style={{
        position: 'relative', width: '100%', flexShrink: 0,
        ...(p.beeldVult && !isMobile
          ? { aspectRatio: '49 / 15', maxHeight: '60vh' }   // 1960x600
          : { height: isMobile ? '34vh' : 'min(46vh, 460px)' }),
      }}>
        <div key={p.foto} style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${p.foto})`,
          backgroundSize: 'cover',
          // Staat de tekst op het beeld, dan houden we de onderkant vast: daar
          // staat de titel. Bijsnijden gebeurt dan bovenin.
          backgroundPosition: p.beeldVult ? 'center bottom' : 'center',
          backgroundRepeat: 'no-repeat',
          animation: 'pijlerIn 0.35s ease',
        }} />
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          // Beeld dat zelf al tekst draagt laten we helemaal met rust: geen
          // fade, anders vreet die de onderste regel op. De gewone foto's
          // lopen wel naar zwart, daar staat de kop overheen.
          background: p.beeldVult
            ? 'none'
            : `linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.25) 30%, rgba(10,10,10,0.8) 72%, ${BG} 100%)`,
        }} />
        <button
          onClick={onClose}
          aria-label="Sluiten"
          style={{
            position: 'absolute', top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 12 : 20}px)`,
            right: isMobile ? 12 : 20,
            width: 40, height: 40, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 12, color: '#fff', cursor: 'pointer',
            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={18} strokeWidth={2.8} />
        </button>
      </div>

      {/* Tekst: wat het is, en wat we gaan doen. */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: isMobile ? '0 1.25rem 1.25rem' : '0 2rem 2rem',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', marginTop: p.beeldVult ? (isMobile ? 10 : 16) : (isMobile ? -18 : -28), position: 'relative' }}>
          {/* Het label 'PIJLER x VAN 3' blijft weg als het beeld al tekst
              draagt; de titel staat er altijd, zodat elke slide op de pagina
              zelf zijn kop heeft. */}
          {!p.beeldVult && (
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800,
              letterSpacing: '0.16em', color: GOLD, marginBottom: isMobile ? 8 : 12,
            }}>
              PIJLER {i + 1} VAN {PIJLERS.length}
            </div>
          )}
          {!p.titelInBeeld && (
            <div style={{
              fontSize: isMobile ? '1.7rem' : '2.6rem', fontWeight: 900,
              letterSpacing: '-0.03em', lineHeight: 1.08,
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}>
              <span style={{ color: GOLD }}>{i + 1}. </span>
              {p.kop}
            </div>
          )}
          {!p.beeldVult && (
            <p style={{
              margin: `${isMobile ? 10 : 14}px 0 ${isMobile ? '1.4rem' : '2rem'}`,
              fontSize: isMobile ? '0.95rem' : '1.2rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.65)', lineHeight: 1.45,
            }}>
              {p.zin}
            </p>
          )}

          {/* Geen kopje boven de punten: de regels spreken voor zich. */}
          <div style={{ marginTop: p.beeldVult ? (isMobile ? '1.2rem' : '1.75rem') : 0 }} />
          {p.doen.map((regel, r) => (
            <div key={regel.tekst} style={{
              display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14,
              padding: isMobile ? '0.75rem 0' : '1rem 0',
              borderTop: r === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <regel.Icon size={isMobile ? 18 : 24} strokeWidth={2.8} style={{ flexShrink: 0, color: '#fff' }} />
              <span style={{
                fontSize: isMobile ? '0.88rem' : '1.1rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
              }}>
                {/* Dubbele punt in plaats van een streepje; staat er geen zin
                    achter, dan ook geen dubbele punt. */}
                {regel.kop && (
                  <span style={{ color: '#fff', fontWeight: 900 }}>{regel.kop}{regel.tekst ? ': ' : ''}</span>
                )}
                {regel.tekst}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Geen knoppenbalk: je bladert met de pijltjestoetsen, Enter, een
          klik in het venster of een swipe. */}
    </div>
  )
}

function Stroken({ items, isMobile, genummerd = false, hoog = false }) {
  return (
    <div style={{ margin: isMobile ? '-0.9rem -1.15rem 0' : '-1rem -1.35rem 0' }}>
      {items.map((r, i) => (
        <div key={r.kop} style={{
          position: 'relative',
          minHeight: hoog ? (isMobile ? 76 : 88) : (isMobile ? 58 : 68),
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%',
            backgroundImage: `url(${r.foto})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(10,10,10,0.4) 0%, rgba(10,10,10,0.5) 10%, rgba(10,10,10,0.85) 21%, #0a0a0a 32%)',
          }} />
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center',
            gap: isMobile ? '0.5rem' : '0.9rem',
            width: '100%',
            paddingLeft: isMobile ? '20%' : '21%',
            paddingRight: isMobile ? '1.15rem' : '1.35rem',
          }}>
            <div style={{
              flex: 1, minWidth: 0,
              fontSize: isMobile ? '0.86rem' : '1.2rem', fontWeight: 900,
              color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em',
              textShadow: '0 1px 8px rgba(0,0,0,0.9)',
            }}>
              {genummerd && <span style={{ color: GOLD }}>{i + 1}. </span>}
              {r.kop}
            </div>
            <div style={{
              flexShrink: 0, maxWidth: isMobile ? '48%' : '46%',
              textAlign: 'right',
              fontSize: isMobile ? '0.66rem' : '0.88rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.45)', lineHeight: 1.35,
            }}>
              {r.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Blad dat vanaf de onderkant openschuift ──────────────────────────────────
// Zelfde vorm als het blad in het log-scherm van de app: de pagina erachter
// vervaagt, het blad komt van onderen omhoog en groeit mee met zijn inhoud tot
// 80% van het scherm. Bewust lokaal en niet geïmporteerd uit de app-modules:
// dit is een publieke verkooppagina die op zichzelf moet staan.
function Blad({ open, titel, onClose, isMobile, children }) {
  if (!open) return null
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        // Op telefoon schuift hij van onder in beeld, op desktop staat hij
        // midden op het scherm: daar is onderaan plakken alleen maar ver weg.
        display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
        padding: isMobile ? 0 : '2rem',
        animation: 'bladWaas 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: BG,
        borderRadius: isMobile ? '18px 18px 0 0' : 18,
        border: '1px solid rgba(255,255,255,0.1)',
        borderBottom: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
        maxHeight: isMobile ? '80vh' : '84vh',
        display: 'flex', flexDirection: 'column',
        animation: `${isMobile ? 'bladOmhoog' : 'bladIn'} 0.28s cubic-bezier(0.22, 1, 0.36, 1)`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '1rem 1.15rem' : '1.1rem 1.35rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            {titel}
          </span>
          <button
            onClick={onClose}
            aria-label="Sluit"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit', lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{
          flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '0.9rem 1.15rem' : '1rem 1.35rem',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
          textAlign: 'left',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Trustpilot-badge — identiek aan /16week ──────────────────────────────────
function TrustpilotBadge({ size = 'sm', style }) {
  const fs = size === 'lg' ? '0.7rem' : '0.65rem'
  const star = size === 'lg' ? 12 : 11
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', ...style }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
      </svg>
      <span style={{ fontSize: fs, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
      <span style={{ fontSize: fs, fontWeight: 800, color: '#fff' }}>4.8</span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1,2,3,4,5].map(s => (
          <svg key={s} width={star} height={star} viewBox="0 0 24 24" fill={TP_GREEN}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        ))}
      </div>
    </div>
  )
}

export default function SixWeekChallengePage() {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef(null)
  const containerRef = useRef(null)
  const offerRef = useRef(null)
  const aanbodRef = useRef(null)
  // Wat er onder de twee knoppen openklapt: 'methode', 'voorwaarden' of niets.
  const [open, setOpen] = useState(null)
  // Volledig scherm: handig als je de pagina op een groot scherm laat zien.
  const [volledig, setVolledig] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Actieve sectie bijhouden voor de nav-dots.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(container.children).indexOf(entry.target)
            if (idx >= 0) setCurrent(idx)
          }
        })
      },
      { root: container, threshold: 0.55 }
    )
    Array.from(container.children).forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [])

  // Naar de checkout; daar staat het formulier en de betaling.
  const naarCheckout = () => { window.location.href = '/6week-checkout' }

  // Basis voor elke sectie: één scherm hoog, inhoud verticaal gecentreerd.
  const screen = {
    scrollSnapAlign: 'start',
    minHeight: isMobile ? '100dvh' : '100vh',
    background: BG,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: isMobile ? '3.5rem 1.25rem' : '4rem 3rem',
    position: 'relative',
  }

  // Auto-scroll review carousel — same vibe as the other checkout pages.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    let animId, pos = 0
    const speed = 0.4
    const scroll = () => {
      pos += speed
      if (pos >= el.scrollWidth / 2) pos = 0
      el.scrollLeft = pos
      animId = requestAnimationFrame(scroll)
    }
    const pause = () => cancelAnimationFrame(animId)
    const resume = () => { animId = requestAnimationFrame(scroll) }
    animId = requestAnimationFrame(scroll)
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resume)
    return () => {
      cancelAnimationFrame(animId)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resume)
    }
  }, [])

  useEffect(() => {
    const kijk = () => setVolledig(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', kijk)
    return () => document.removeEventListener('fullscreenchange', kijk)
  }, [])

  const wisselVolledig = () => {
    if (document.fullscreenElement) document.exitFullscreen?.()
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const doubledSlides = [...SLIDES, ...SLIDES]

  return (
    <div style={{ background: BG }}>
      <div
        ref={containerRef}
        style={{
          // Zachte snap-scroll: glijdt naar de dichtstbijzijnde sectie zodra je
          // in de buurt komt (proximity houdt je nergens vast — belangrijk op
          // een checkout met een formulier).
          height: isMobile ? '100dvh' : '100vh',
          overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'y proximity', scrollBehavior: 'smooth',
          background: BG, color: '#fff',
          fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >

        {/* ══ SCHERM 1: OFFER ══ */}
        <section ref={offerRef} style={{ ...screen, textAlign: 'center', padding: 0, justifyContent: 'flex-start' }}>
          {/* Foto bovenaan die onderin dood loopt in het zwart; de kop valt er
              net overheen. Zelfde truc als de koppen in de app. */}
          {/* Het vak heeft dezelfde verhouding als de foto (1200x600, dus 2:1),
              want anders sneed cover er op desktop meer dan de helft af: een
              venster van 1440 breed en 300 hoog is 4,8:1. Op desktop begrenzen
              we de breedte, zodat de hoogte binnen het scherm blijft. */}
          {/* Op desktop loopt de foto van rand tot rand; de hoogte is
              begrensd zodat de kop eronder nog in beeld valt. Op telefoon
              houden we de echte 2:1-verhouding aan, daar past hij precies. */}
          <div style={{
            position: 'relative', width: '100%',
            margin: 0,
            ...(isMobile
              ? { aspectRatio: '2 / 1' }
              : { height: 'min(58vh, 620px)' }),
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/6week-challenge-hero.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center 45%',
            }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.1) 18%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.88) 68%, ${BG} 92%)`,
            }} />
          </div>

          <div style={{
            maxWidth: isMobile ? 520 : 880, width: '100%',
            // Negatieve marge: de kop schuift over de onderkant van de foto,
            // maar houdt afstand tot het beeld.
            marginTop: isMobile ? -18 : -34,
            padding: isMobile ? `0 1.25rem 3.5rem` : `0 2rem 4rem`,
            position: 'relative', zIndex: 2,
          }}>
            {/* Logo boven de kop, zoals op de salespagina's. */}
            <img
              src="/ma-logo-header.png"
              alt="MY ARC"
              style={{
                width: isMobile ? 96 : 140, height: 'auto', display: 'block',
                margin: `0 auto ${isMobile ? '0.9rem' : '1.15rem'}`,
                filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.85))',
              }}
            />

            {/* Kop boven de prijs — dit is waar het aanbod om draait. */}
            <div style={{
              fontSize: isMobile ? '1.6rem' : '3rem', fontWeight: 900, color: '#fff',
              lineHeight: 1.1, letterSpacing: '-0.03em',
              marginBottom: isMobile ? '1.6rem' : '2.25rem',
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}>
              6 Weken In Shape Challenge
            </div>
            {/* Twee knoppen: de methode en de voorwaarden. Geen omlijnde
                vakken meer maar een icoon met het woord eronder; het scherm
                oogde te druk met alles in een container. */}
            <div style={{
              display: 'flex', gap: isMobile ? '1.1rem' : '7rem',
              justifyContent: 'center',
              marginTop: isMobile ? 0 : '1.5rem',
            }}>
              {[
                { id: 'methode', label: 'De methode', Icon: Compass },
                { id: 'voorwaarden', label: 'De voorwaarden', Icon: ListChecks },
                { id: 'waarom', label: 'Waarom doe ik dit?', Icon: HelpCircle },
              ].map((k) => {
                const aan = open === k.id
                return (
                  <button
                    key={k.id}
                    onClick={() => setOpen(aan ? null : k.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: isMobile ? 9 : 18,
                      padding: 0, border: 'none', background: 'transparent',
                      color: '#fff', opacity: aan ? 1 : 0.75,
                      fontSize: isMobile ? '0.75rem' : '1.4rem', fontWeight: 900,
                      letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <k.Icon size={isMobile ? 32 : 68} strokeWidth={2.2} />
                    {k.label}
                  </button>
                )
              })}
            </div>

          </div>
        </section>

        {/* ══ SCHERM 2: GARANTIES + REVIEWS ══ */}
        <section ref={aanbodRef} style={{ ...screen, justifyContent: 'center' }}>
          <div style={{ maxWidth: isMobile ? 520 : 1000, width: '100%' }}>
            {/* Op desktop staan de garanties en de knop naast elkaar; op
                telefoon onder elkaar. Zo blijft de sectie op een breed scherm
                gevuld in plaats van een smalle kolom in het midden. */}
            <div style={{
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? 0 : '3rem',
            }}>
            <div style={{
              margin: isMobile ? '0 auto 1.75rem' : 0,
              flex: 1, minWidth: 0,
              maxWidth: isMobile ? 480 : 560, width: '100%', textAlign: 'left',
            }}>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800,
                letterSpacing: '0.15em', color: GOLD,
                marginBottom: isMobile ? '0.6rem' : '0.85rem',
                textAlign: isMobile ? 'center' : 'left',
              }}>
                EXTRA GARANTIES
              </div>
              {[
                { Icon: Clock, tekst: 'Binnen 7 dagen niet tevreden? Geld terug.' },
                { Icon: BadgeEuro, tekst: 'Vind je tijdens de 6 weken dat je niet genoeg coaching waarde krijgt? Geld terug.' },
              ].map((r, i) => (
                <div key={r.tekst} style={{
                  display: 'flex', gap: '0.7rem',
                  alignItems: 'center', justifyContent: isMobile ? 'center' : 'flex-start',
                  padding: isMobile ? '0.7rem 0' : '1rem 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {/* Zelfde stijl als de drie knoppen: bold en wit. */}
                  <r.Icon
                    size={isMobile ? 20 : 22} strokeWidth={2.4}
                    style={{ flexShrink: 0, color: '#fff' }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
                    textAlign: isMobile ? 'center' : 'left',
                  }}>{r.tekst}</span>
                </div>
              ))}
            </div>

            {/* Geen formulier hier: één knop naar de checkout. */}
            <div style={{ flexShrink: 0, width: isMobile ? '100%' : 300 }}>
              <button
                onClick={naarCheckout}
                style={{
                  width: '100%', minHeight: isMobile ? 54 : 60, borderRadius: 14, border: 'none',
                  background: '#fff', color: '#000',
                  fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
                  letterSpacing: '-0.01em', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 24px rgba(255,255,255,0.14)',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                Doe mee
              </button>
              <div style={{
                marginTop: 10, textAlign: 'center',
                fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)',
              }}>
                Je gegevens vul je op de volgende pagina in
              </div>
            </div>
            </div>

            {/* ══ Reviews en transformaties ══ */}
            <div style={{ marginTop: isMobile ? '2rem' : '3rem' }}>
              <TrustpilotBadge style={{ margin: isMobile ? '1rem 0' : '1.25rem 0' }} />

              <div
                ref={scrollRef}
                style={{
                  display: 'flex', gap: isMobile ? '0.75rem' : '1rem',
                  overflow: 'hidden', cursor: 'grab',
                  marginLeft: isMobile ? '-1.25rem' : '-3rem',
                  marginRight: isMobile ? '-1.25rem' : '-3rem',
                  paddingLeft: isMobile ? '1.25rem' : '3rem',
                  paddingRight: isMobile ? '1.25rem' : '3rem',
                }}
              >
                {doubledSlides.map((slide, idx) => (
                  <div key={idx} style={{
                    minWidth: isMobile ? 240 : 300, maxWidth: isMobile ? 240 : 300,
                    padding: slide.soort === 'foto'
                      ? (isMobile ? '0.6rem' : '0.7rem')
                      : (isMobile ? '0.85rem 1rem' : '1rem 1.15rem'),
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    flexShrink: 0,
                    display: 'flex', flexDirection: 'column',
                  }}>
                    {slide.soort === 'foto' ? (
                      <>
                        {/* Contain en een maximum: de before/after-collage mag
                            niet bijgesneden worden, maar ook de slider niet
                            drie keer zo hoog maken als een review. */}
                        <div style={{ borderRadius: 9, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={slide.src}
                            alt={slide.caption}
                            draggable={false}
                            onError={(e) => { e.currentTarget.style.opacity = 0 }}
                            style={{
                              maxWidth: '100%', maxHeight: isMobile ? 170 : 195,
                              width: 'auto', height: 'auto', display: 'block',
                            }}
                          />
                        </div>
                        <p style={{
                          margin: '0.5rem 0 0',
                          fontSize: isMobile ? '0.62rem' : '0.68rem', fontWeight: 700,
                          color: 'rgba(255,255,255,0.5)', lineHeight: 1.3, textAlign: 'center',
                        }}>
                          {slide.caption}
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 2, marginBottom: '0.5rem' }}>
                          {[1,2,3,4,5].map(ster => (
                            <Star key={ster} size={11} fill={TP_GREEN} color={TP_GREEN} strokeWidth={0} />
                          ))}
                        </div>
                        <p style={{
                          fontSize: isMobile ? '0.7rem' : '0.75rem',
                          color: 'rgba(255,255,255,0.45)', fontWeight: 500,
                          lineHeight: 1.5, marginBottom: '0.6rem',
                          display: '-webkit-box', WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>{slide.text}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#fff', border: `1px solid ${TP_GREEN}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.6rem', fontWeight: 800, color: TP_GREEN,
                            }}>{slide.name.charAt(0)}</div>
                            <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                              {slide.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{slide.date}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Zwevende knop naar het formulier: staat onderaan het scherm in
          plaats van in de tekst, en verdwijnt zodra je bij het formulier bent
          of een blad opent. */}
      <button
        onClick={naarCheckout}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${isMobile ? '1.25rem' : '1.75rem'})`,
          transform: 'translateX(-50%)',
          zIndex: 90,
          opacity: current === 0 && !open ? 1 : 0,
          pointerEvents: current === 0 && !open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.85rem 1.7rem' : '0.95rem 2rem',
          borderRadius: 999, border: 'none',
          background: '#fff', color: '#000',
          fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(0,0,0,0.6), 0 0 24px rgba(255,255,255,0.12)',
          letterSpacing: '0.01em', whiteSpace: 'nowrap',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          fontFamily: 'inherit',
        }}
      >
        Doe mee <ChevronDown size={16} strokeWidth={3} />
      </button>

      {/* Volledig scherm — linksboven, zodat hij nergens overheen valt. */}
      <button
        onClick={wisselVolledig}
        title={volledig ? 'Volledig scherm verlaten' : 'Volledig scherm'}
        aria-label={volledig ? 'Volledig scherm verlaten' : 'Volledig scherm'}
        style={{
          position: 'fixed',
          left: isMobile ? 10 : 20,
          top: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? 10 : 20}px)`,
          zIndex: 120,
          width: 36, height: 36, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 10,
          color: 'rgba(255,255,255,0.8)',
          cursor: 'pointer', fontFamily: 'inherit',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        {volledig ? <Minimize2 size={16} strokeWidth={2.6} /> : <Maximize2 size={16} strokeWidth={2.6} />}
      </button>

      {/* ══ Nav-dots — zoals /16week ══ */}
      <div style={{
        position: 'fixed',
        right: isMobile ? '10px' : '22px',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '9px',
        zIndex: 100,
      }}>
        {Array.from({ length: SECTION_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i)
              containerRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth' })
            }}
            style={{
              width: current === i ? '9px' : '5px',
              height: current === i ? '9px' : '5px',
              borderRadius: '50%',
              background: current === i ? GOLD : 'rgba(255,255,255,0.3)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
              boxShadow: current === i ? '0 0 8px rgba(255,186,9,0.5)' : 'none',
            }}
            aria-label={`Ga naar sectie ${i + 1}`}
          />
        ))}
      </div>

      {/* De methode — schermvullend, één pijler per slide. */}
      {open === 'methode' && (
        <MethodeSlider isMobile={isMobile} onClose={() => setOpen(null)} />
      )}

      {/* De voorwaarden — dezelfde stroken, plus de regel dat een coach ze
          mondeling mag bijstellen. */}
      <Blad open={open === 'voorwaarden'} titel="De voorwaarden" onClose={() => setOpen(null)} isMobile={isMobile}>
        {/* De geld-terug-regels stonden op het eerste scherm; ze horen hier,
            bij de acties waar ze over gaan. */}
        <div style={{ marginBottom: isMobile ? '1rem' : '1.15rem' }}>
          <div style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
            color: GOLD, letterSpacing: '-0.015em',
            marginBottom: isMobile ? '0.6rem' : '0.75rem',
          }}>
            Geld terug voorwaarden:
          </div>
          {[
            { Icon: Target, tekst: 'Haal afgesproken doel.' },
            { Icon: CheckCircle2, tekst: 'Of voer afgesproken acties uit.' },
          ].map((r, i) => (
            <div key={r.tekst} style={{
              display: 'flex', gap: '0.6rem', alignItems: 'center',
              padding: isMobile ? '0.6rem 0' : '0.7rem 0',
              borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}>
              <r.Icon size={isMobile ? 18 : 20} strokeWidth={2.4} style={{ flexShrink: 0, color: GOLD }} />
              <span style={{
                fontSize: isMobile ? '0.85rem' : '0.95rem', fontWeight: 700,
                color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
              }}>{r.tekst}</span>
            </div>
          ))}
        </div>

        <div style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)', marginBottom: isMobile ? '0.5rem' : '0.6rem',
        }}>
          De acties
        </div>
        <Stroken isMobile={isMobile} items={[
          { foto: '/voorwaarden/workouts.jpg', kop: 'Minimaal 2 trainingen per week', sub: 'van 45 minuten' },
          { foto: '/voorwaarden/voeding.jpg',  kop: '80% van je voedingsplan', sub: 'macrodoelen gehaald of plan gevolgd' },
          { foto: '/voorwaarden/wegen.jpg',    kop: '3x per week wegen',       sub: 'we sturen op het weekgemiddelde' },
          { foto: '/voorwaarden/checkin.jpg',  kop: 'Elke week je check-in',   sub: 'invullen in de app' },
          { foto: '/voorwaarden/calls.jpg',    kop: '4 calls',                 sub: 'verspreid over de zes weken' },
          { foto: '/voorwaarden/fotos.jpg',    kop: "3 progressiefoto's",      sub: 'begin, midden, eind' },
        ]} />
        <p style={{
          margin: isMobile ? '1rem 0 0' : '1.15rem 0 0',
          fontSize: isMobile ? '0.78rem' : '0.83rem',
          fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
        }}>
          Wijkt een van de voorwaarden af van wat je met je coach hebt besproken? Dan
          stellen we die mondeling op. Het belangrijkste is dat het voor jou werkt.
        </p>
      </Blad>

      {/* Waarom doe ik dit — foto rechts, twee redenen links. */}
      <Blad open={open === 'waarom'} titel="Waarom doe ik dit?" onClose={() => setOpen(null)} isMobile={isMobile}>
        <div style={{
          position: 'relative',
          margin: isMobile ? '-0.9rem -1.15rem 0' : '-1rem -1.35rem 0',
          minHeight: isMobile ? 250 : 290,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: '46%',
            backgroundImage: 'url(/waarom-kersten.jpg)',
            backgroundSize: 'cover', backgroundPosition: 'center top',
          }} />
          {/* Fade naar links, zodat de tekst over de foto heen kan lopen. */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(270deg, rgba(10,10,10,0.15) 0%, rgba(10,10,10,0.45) 18%, rgba(10,10,10,0.88) 38%, #0a0a0a 54%)',
          }} />
          <div style={{
            position: 'relative', zIndex: 1, width: '100%',
            paddingLeft: isMobile ? '1.15rem' : '1.35rem',
            paddingRight: isMobile ? '40%' : '42%',
            paddingTop: isMobile ? '1.1rem' : '1.35rem',
            paddingBottom: isMobile ? '1.1rem' : '1.35rem',
          }}>
            {[
              'Ik wil je met een korte termijn doel laten zien dat mijn aanpak voor jou werkt, om je vervolgens met vol vertrouwen naar je uiteindelijke doel te begeleiden.',
              'Om de drempel naar coaching voor mannen laag te maken, zodat ze instappen en inzien hoe het alles voor hen kan veranderen.',
            ].map((tekst, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.6rem', alignItems: 'baseline',
                padding: isMobile ? '0.7rem 0' : '0.8rem 0',
                borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{
                  flexShrink: 0,
                  fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900, color: GOLD,
                }}>{i + 1}.</span>
                <span style={{
                  fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, letterSpacing: '-0.01em',
                  textShadow: '0 1px 8px rgba(0,0,0,0.9)',
                }}>{tekst}</span>
              </div>
            ))}
          </div>
        </div>
      </Blad>

      <style>{`
        /* @import moet als eerste regel staan, anders negeert de browser 'm
           en valt het lettertype terug op de systeemfont. */
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes bladWaas { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bladOmhoog { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bladIn { from { transform: translateY(14px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
        @keyframes pijlerIn { from { opacity: 0; transform: scale(1.03); } to { opacity: 1; transform: none; } }
        body { overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
