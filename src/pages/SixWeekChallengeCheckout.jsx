// src/pages/SixWeekChallengeCheckout.jsx
// Checkout op /6week-checkout — EENMALIG €297, de 6 weken In Shape Challenge
// met win-your-money-back. Zelfde opmaak als SixteenWeekCheckout: full-screen
// snap-secties op #0a0a0a, hero → 3 pijler-schermen → offer → formulier, met
// nav-dots rechts. Alleen de prijs, de kop en het offer-scherm verschillen.
//
// Stripe: /api/create-checkout-session (one-time), plan '6-week-challenge'.

import { useState, useEffect, useRef } from 'react'
import { Star, Lock, Mail, User, Phone, ChevronDown, Compass, ListChecks, Target, CheckCircle2, HelpCircle, Clock, BadgeEuro } from 'lucide-react'

// Eenmalige prijs.
const PRICE = 297

// Stripe Price ID van dit traject — de checkout rekent hiermee af, niet met
// PRICE hierboven (die is alleen nog de weergegeven prijs op de pagina).
// Eenmalige prijs. Het eerste id dat we kregen was een maandabonnement van
// €297; die combinatie weigert Stripe in 'payment'-mode ("You specified
// `payment` mode but passed a recurring price"), waardoor elke afrekening
// stukliep. Dit id hoort bij hetzelfde product, maar dan one_time.
const STRIPE_PRICE_ID = 'price_1UFdw6J3V4uXn1OkvJicc73b'

// Same Stripe publishable key as the other checkouts.
const STRIPE_PK = 'pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54'

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
              fontSize: isMobile ? '0.86rem' : '1rem', fontWeight: 900,
              color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em',
              textShadow: '0 1px 8px rgba(0,0,0,0.9)',
            }}>
              {genummerd && <span style={{ color: GOLD }}>{i + 1}. </span>}
              {r.kop}
            </div>
            <div style={{
              flexShrink: 0, maxWidth: isMobile ? '48%' : '46%',
              textAlign: 'right',
              fontSize: isMobile ? '0.66rem' : '0.76rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.4)', lineHeight: 1.3,
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
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'bladWaas 0.2s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 520,
        background: BG,
        borderRadius: '18px 18px 0 0',
        border: '1px solid rgba(255,255,255,0.1)',
        borderBottom: 'none',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        animation: 'bladOmhoog 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '1rem 1.15rem' : '1.1rem 1.35rem',
          borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
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

export default function SixWeekChallengeCheckout() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const [current, setCurrent] = useState(0)
  const scrollRef = useRef(null)
  const containerRef = useRef(null)
  const offerRef = useRef(null)
  const formRef = useRef(null)
  // Wat er onder de twee knoppen openklapt: 'methode', 'voorwaarden' of niets.
  const [open, setOpen] = useState(null)

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

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Basis voor elke sectie: één scherm hoog, inhoud verticaal gecentreerd.
  const screen = {
    scrollSnapAlign: 'start',
    minHeight: isMobile ? '100dvh' : '100vh',
    background: BG,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: isMobile ? '3.5rem 1.25rem' : '5rem 2rem',
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

  const handleCheckout = async () => {
    if (!name || !email) {
      setError('Vul je naam en e-mail in')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: '6-week-challenge',
          price: PRICE,
          ...(STRIPE_PRICE_ID ? { priceId: STRIPE_PRICE_ID } : {}),
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          // Na betaling meteen door naar de intake, niet naar /success.
          successPath: '/myintake',
          cancelPath: '/6week-checkout',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      if (data.sessionId) {
        const stripe = window.Stripe(STRIPE_PK)
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError(err.message || 'Er ging iets mis. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
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
          <div style={{
            position: 'relative', width: '100%',
            maxWidth: isMobile ? '100%' : 760,
            margin: '0 auto',
            aspectRatio: '2 / 1',
            flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/6week-offer-hero.jpg)',
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `linear-gradient(180deg, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.1) 18%, rgba(10,10,10,0.55) 42%, rgba(10,10,10,0.88) 68%, ${BG} 92%)`,
            }} />
          </div>

          <div style={{
            maxWidth: 520, width: '100%',
            // Negatieve marge: de kop schuift over de onderkant van de foto,
            // maar houdt afstand tot het beeld.
            marginTop: isMobile ? -18 : -22,
            padding: isMobile ? `0 1.25rem 3.5rem` : `0 2rem 5rem`,
            position: 'relative', zIndex: 2,
          }}>
            {/* Logo boven de kop, zoals op de salespagina's. */}
            <img
              src="/ma-logo-header.png"
              alt="MY ARC"
              style={{
                width: isMobile ? 96 : 120, height: 'auto', display: 'block',
                margin: `0 auto ${isMobile ? '0.9rem' : '1.15rem'}`,
                filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.85))',
              }}
            />

            {/* Kop boven de prijs — dit is waar het aanbod om draait. */}
            <div style={{
              fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 900, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-0.025em',
              marginBottom: isMobile ? '1.6rem' : '2rem',
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}>
              6 Weken In Shape Challenge
            </div>
            {/* De twee regels van de challenge: een icoon in plaats van een
                cijfer, en gecentreerd in plaats van links uitgelijnd. */}
            <div style={{
              margin: `0 auto ${isMobile ? '4rem' : '5rem'}`,
              maxWidth: 440, width: '100%',
            }}>
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
                color: GOLD, letterSpacing: '-0.015em', textAlign: 'center',
                marginBottom: isMobile ? '0.75rem' : '0.9rem',
              }}>
                Geld terug voorwaarden:
              </div>
              {[
                { Icon: Target, tekst: 'Haal afgesproken doel.' },
                { Icon: CheckCircle2, tekst: 'Of voer afgesproken acties uit.' },
              ].map((r, i) => (
                <div key={r.tekst} style={{
                  display: 'flex', gap: '0.6rem',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'left',
                  padding: isMobile ? '0.7rem 0' : '0.8rem 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <r.Icon
                    size={isMobile ? 18 : 20} strokeWidth={2.4}
                    style={{ flexShrink: 0, color: GOLD }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
                  }}>{r.tekst}</span>
                </div>
              ))}
            </div>

            {/* Twee knoppen: de methode en de voorwaarden. Geen omlijnde
                vakken meer maar een icoon met het woord eronder; het scherm
                oogde te druk met alles in een container. */}
            <div style={{
              display: 'flex', gap: isMobile ? '1.1rem' : '3rem',
              justifyContent: 'center',
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
                      gap: isMobile ? 9 : 11,
                      padding: 0, border: 'none', background: 'transparent',
                      color: '#fff', opacity: aan ? 1 : 0.75,
                      fontSize: isMobile ? '0.75rem' : '0.95rem', fontWeight: 900,
                      letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                      fontFamily: 'inherit', cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <k.Icon size={isMobile ? 32 : 38} strokeWidth={2.4} />
                    {k.label}
                  </button>
                )
              })}
            </div>

          </div>
        </section>

        {/* ══ SCHERM 2: FORMULIER + REVIEWS ══ */}
        <section ref={formRef} style={{ ...screen, justifyContent: 'center' }}>
          <div style={{ maxWidth: 520, width: '100%' }}>
            {/* De twee garanties onder elkaar, met een icoon ervoor. */}
            <div style={{
              margin: isMobile ? '0 auto 1.75rem' : '0 auto 2.25rem',
              maxWidth: 480, width: '100%', textAlign: 'left',
            }}>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
                letterSpacing: '0.15em', color: GOLD,
                marginBottom: isMobile ? '0.6rem' : '0.75rem', textAlign: 'center',
              }}>
                EXTRA GARANTIES
              </div>
              {[
                { Icon: Clock, tekst: 'Binnen 7 dagen niet tevreden? Geld terug.' },
                { Icon: BadgeEuro, tekst: 'Vind je tijdens de 6 weken dat je geen €297 aan coaching waarde krijgt? Geld terug.' },
              ].map((r, i) => (
                <div key={r.tekst} style={{
                  display: 'flex', gap: '0.7rem',
                  alignItems: 'center', justifyContent: 'center',
                  padding: isMobile ? '0.7rem 0' : '0.8rem 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {/* Zelfde stijl als de drie knoppen: bold en wit. */}
                  <r.Icon
                    size={isMobile ? 20 : 22} strokeWidth={2.4}
                    style={{ flexShrink: 0, color: '#fff' }}
                  />
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
                    textAlign: 'center',
                  }}>{r.tekst}</span>
                </div>
              ))}
            </div>

            <div style={{
              borderRadius: isMobile ? 16 : 18,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
            }}>
              <div style={{
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                fontWeight: 800, color: '#fff', marginBottom: '1rem',
              }}>Jouw gegevens</div>

              {[
                { icon: User,  value: name,  set: setName,  placeholder: 'Je naam',                      type: 'text' },
                { icon: Mail,  value: email, set: setEmail, placeholder: 'Je e-mailadres',               type: 'email' },
                { icon: Phone, value: phone, set: setPhone, placeholder: 'Je telefoonnummer (optioneel)', type: 'tel' },
              ].map((field, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 1rem',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: 'rgba(255,255,255,0.05)',
                  marginBottom: '0.6rem',
                }}>
                  <field.icon size={16} color="rgba(255,255,255,0.55)" strokeWidth={2} />
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={e => field.set(e.target.value)}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: '#fff', fontSize: isMobile ? '0.85rem' : '0.9rem',
                      fontWeight: 500, fontFamily: 'inherit',
                    }}
                  />
                </div>
              ))}

              {error && (
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: '#ef4444', fontWeight: 600,
                  marginBottom: '0.75rem', marginTop: '0.25rem',
                }}>{error}</div>
              )}

              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.1rem',
                  borderRadius: 12, border: 'none',
                  background: loading ? 'rgba(255,255,255,0.4)' : '#fff',
                  color: '#000',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  marginTop: '0.5rem', minHeight: 52,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(255,255,255,0.15)',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  letterSpacing: '0.01em', fontFamily: 'inherit',
                }}
              >
                {loading ? 'Even geduld...' : 'Start Nu · €297'}
              </button>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.4rem', marginTop: '0.85rem',
              }}>
                <Lock size={12} color="rgba(255,255,255,0.25)" />
                <span style={{
                  fontSize: isMobile ? '0.65rem' : '0.7rem',
                  color: 'rgba(255,255,255,0.25)', fontWeight: 500,
                }}>Veilig betalen via Stripe · SSL beveiligd</span>
              </div>
            </div>

            {/* ══ Reviews en transformaties — onderaan, na het formulier ══ */}
            <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
              <TrustpilotBadge style={{ margin: isMobile ? '1rem 0' : '1.25rem 0' }} />

              <div
                ref={scrollRef}
                style={{
                  display: 'flex', gap: isMobile ? '0.75rem' : '1rem',
                  overflow: 'hidden', cursor: 'grab',
                  marginLeft: isMobile ? '-1.25rem' : '-2rem',
                  marginRight: isMobile ? '-1.25rem' : '-2rem',
                  paddingLeft: isMobile ? '1.25rem' : '2rem',
                  paddingRight: isMobile ? '1.25rem' : '2rem',
                }}
              >
                {doubledSlides.map((slide, idx) => (
                  <div key={idx} style={{
                    minWidth: isMobile ? 240 : 280, maxWidth: isMobile ? 240 : 280,
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
        onClick={scrollToForm}
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
        Maak investering · €{PRICE} <ChevronDown size={16} strokeWidth={3} />
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

      {/* De methode — drie stroken, verder geen tekst. */}
      <Blad open={open === 'methode'} titel="De methode" onClose={() => setOpen(null)} isMobile={isMobile}>
        <Stroken isMobile={isMobile} genummerd hoog items={[
          { foto: '/methode/voeding.jpg',     kop: 'Weet wat je eet',      sub: 'vaste structuur in de app, zonder rekenen. Etentjes bouwen we in.' },
          { foto: '/methode/training.jpg',    kop: 'Elke training telt',   sub: "schema op maat, uitlegvideo's per oefening, onder het uur." },
          { foto: '/methode/begeleiding.jpg', kop: 'Coach in jouw corner', sub: 'wekelijkse call, snel bereikbaar in de app, ik kijk mee met je cijfers.' },
        ]} />
      </Blad>

      {/* De voorwaarden — dezelfde stroken, plus de regel dat een coach ze
          mondeling mag bijstellen. */}
      <Blad open={open === 'voorwaarden'} titel="De voorwaarden" onClose={() => setOpen(null)} isMobile={isMobile}>
        <Stroken isMobile={isMobile} items={[
          { foto: '/voorwaarden/workouts.jpg', kop: '3 workouts per week',     sub: 'van 45 minuten' },
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
        body { overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
