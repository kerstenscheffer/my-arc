// src/pages/SixWeekChallengeCheckout.jsx
// Checkout op /6week-checkout — EENMALIG €297, de 6 weken In Shape Challenge
// met win-your-money-back. Zelfde opmaak als SixteenWeekCheckout: full-screen
// snap-secties op #0a0a0a, hero → 3 pijler-schermen → offer → formulier, met
// nav-dots rechts. Alleen de prijs, de kop en het offer-scherm verschillen.
//
// Stripe: /api/create-checkout-session (one-time), plan '6-week-challenge'.

import { useState, useEffect, useRef } from 'react'
import { Star, Lock, Mail, User, Phone, ChevronDown } from 'lucide-react'

// Eenmalige prijs.
const PRICE = 297

// Stripe Price ID van dit traject — de checkout rekent hiermee af, niet met
// PRICE hierboven (die is alleen nog de weergegeven prijs op de pagina).
const STRIPE_PRICE_ID = 'price_1UFXN7J3V4uXn1Oka5UQZ79k'

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

// De 3 pijlers — copy gelijk aan /16week (OfferPilarenSection).
const PILAREN = [
  {
    category: 'Voeding',
    title: 'Weet Wat Je Eet Systeem',
    subtitle: 'Een aanpak die bij jou past. Ook op verjaardagen, feestjes en vakanties.',
    bullets: [
      { label: 'Weten wat je eet', text: 'vaste structuur in de app, zonder rekenen' },
      { label: 'Flexibel', text: 'etentjes, een biertje, vakantie: inbouwen in plaats van wegstrepen' },
    ],
    images: ['/sales-screenshots/eten.png', '/sales-screenshots/meedoen.png'],
  },
  {
    category: 'Training',
    title: 'Elke Training Telt Methode',
    subtitle: 'Schema op maat, uitleg per oefening, feedback op jouw uitvoering.',
    bullets: [
      { label: 'Effectief', text: 'workouts onder een uur, thuis of in de gym' },
      { label: 'Begeleiding', text: "uitlegvideo's + persoonlijke bijsturing" },
    ],
    images: ['/sales-screenshots/trainen.png'],
  },
  {
    category: 'Begeleiding',
    title: 'Coach In Jouw Corner',
    subtitle: 'Ik kijk meerdere keren per week met je mee. We zien allebei dat het werkt.',
    bullets: [
      { label: 'Wekelijkse check-in call', text: 'toegang tot mijn agenda' },
      { label: 'Snel bereikbaar', text: 'via de app' },
      { label: 'Ik kijk mee', text: "gewicht, kracht en foto's, progressie zwart-op-wit" },
      { label: 'Accountability', text: 'je hoeft het niet alleen te doen, ik hou je scherp en op koers' },
    ],
    images: ['/sales-screenshots/coach.png', '/sales-screenshots/tracking.png'],
  },
]

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

  const doubledReviews = [...REVIEWS, ...REVIEWS]

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
            // Negatieve marge: de kop schuift over de onderkant van de foto.
            marginTop: isMobile ? -46 : -60,
            padding: isMobile ? `0 1.25rem 3.5rem` : `0 2rem 5rem`,
            position: 'relative', zIndex: 2,
          }}>
            {/* Kop boven de prijs — dit is waar het aanbod om draait. */}
            <div style={{
              fontSize: isMobile ? '1.6rem' : '2.1rem', fontWeight: 900, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-0.025em',
              marginBottom: isMobile ? '0.5rem' : '0.6rem',
              textShadow: '0 2px 14px rgba(0,0,0,0.85)',
            }}>
              6 Weken In Shape Challenge
            </div>
            <p style={{
              margin: `0 auto ${isMobile ? '1.5rem' : '1.85rem'}`,
              maxWidth: 420,
              fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.7)', lineHeight: 1.45,
            }}>
              <span style={{ color: GOLD, fontWeight: 900 }}>Win Your Money Back.</span> Haal je doel,
              of voer je acties uit en krijg je investering terug.
            </p>

            {/* Prijs — eenmalig €297 */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
              <span style={{ fontSize: isMobile ? '2.9rem' : '3.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>€297</span>
            </div>
            {/* Twee knoppen onder de prijs: de methode en de voorwaarden.
                Allebei klappen ze eronder open. Stonden eerder als drie losse
                schermen en een lange tabel in de pagina; dan scrol je langs
                alles voordat je bij het formulier bent. */}
            <div style={{
              display: 'flex', gap: 8,
              margin: isMobile ? '1.5rem auto 0' : '1.85rem auto 0',
              maxWidth: 480,
            }}>
              {[
                { id: 'methode', label: 'De methode' },
                { id: 'voorwaarden', label: 'De voorwaarden' },
              ].map((k) => {
                const aan = open === k.id
                return (
                  <button
                    key={k.id}
                    onClick={() => setOpen(aan ? null : k.id)}
                    style={{
                      flex: 1, minHeight: 46,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      borderRadius: 12,
                      border: `1.5px solid ${aan ? '#fff' : 'rgba(255,255,255,0.25)'}`,
                      background: aan ? 'rgba(255,255,255,0.1)' : 'transparent',
                      color: '#fff',
                      fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 900,
                      fontFamily: 'inherit', cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {k.label}
                    <ChevronDown
                      size={15} strokeWidth={3}
                      style={{ transform: aan ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                    />
                  </button>
                )
              })}
            </div>

            {/* De twee garanties genummerd onder elkaar. */}
            <div style={{
              margin: isMobile ? '1.5rem auto 0' : '1.85rem auto 0',
              maxWidth: 480, width: '100%', textAlign: 'left',
            }}>
              <div style={{
                fontSize: isMobile ? '0.6rem' : '0.65rem', fontWeight: 800,
                letterSpacing: '0.15em', color: GOLD,
                marginBottom: isMobile ? '0.6rem' : '0.75rem', textAlign: 'center',
              }}>
                DE GARANTIE
              </div>
              {[
                'Binnen 7 dagen niet tevreden? Geld terug.',
                'Vind je tijdens de 6 weken dat je geen €297 aan coaching waarde krijgt? Geld terug.',
              ].map((tekst, i) => (
                <div key={i} style={{
                  display: 'flex', gap: '0.7rem', alignItems: 'baseline',
                  padding: isMobile ? '0.65rem 0' : '0.75rem 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{
                    flexShrink: 0,
                    fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900,
                    color: GOLD,
                  }}>{i + 1}.</span>
                  <span style={{
                    fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, letterSpacing: '-0.01em',
                  }}>{tekst}</span>
                </div>
              ))}
            </div>

            {/* Knop naar het formulier (afrekenen) */}
            <button onClick={scrollToForm} style={{
              marginTop: isMobile ? '1.85rem' : '2.25rem',
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: isMobile ? '0.85rem 1.7rem' : '0.95rem 2rem', borderRadius: 999, border: 'none',
              background: '#fff', color: '#000',
              fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(255,255,255,0.15)', letterSpacing: '0.01em',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}>
              Ik wil starten <ChevronDown size={16} strokeWidth={3} />
            </button>
          </div>
        </section>

        {/* ══ SCHERM 2: FORMULIER + REVIEWS ══ */}
        <section ref={formRef} style={{ ...screen, justifyContent: 'center' }}>
          <div style={{ maxWidth: 520, width: '100%' }}>
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

            {/* ══ Transformaties + reviews — onderaan, na het formulier ══ */}
            <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
              <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', maxWidth: 420, margin: '0 auto' }}>
                {TRANSFORMATIONS.map((t) => (
                  <div key={t.src} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ borderRadius: 9, overflow: 'hidden', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }}>
                      <img
                        src={t.src}
                        alt={t.caption}
                        onError={(e) => { e.currentTarget.style.opacity = 0 }}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>
                    <p style={{ margin: 0, fontSize: isMobile ? '0.5rem' : '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', lineHeight: 1.25, textAlign: 'center' }}>
                      {t.caption}
                    </p>
                  </div>
                ))}
              </div>

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
                {doubledReviews.map((review, idx) => (
                  <div key={idx} style={{
                    minWidth: isMobile ? 240 : 280, maxWidth: isMobile ? 240 : 280,
                    padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                    flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: '0.5rem' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={11} fill={TP_GREEN} color={TP_GREEN} strokeWidth={0} />
                      ))}
                    </div>
                    <p style={{
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: 'rgba(255,255,255,0.45)', fontWeight: 500,
                      lineHeight: 1.5, marginBottom: '0.6rem',
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{review.text}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%',
                          background: '#fff', border: `1px solid ${TP_GREEN}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: 800, color: TP_GREEN,
                        }}>{review.name.charAt(0)}</div>
                        <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
                          {review.name}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)' }}>{review.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

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

      {/* De methode — de drie pijlers, kort. */}
      <Blad open={open === 'methode'} titel="De methode" onClose={() => setOpen(null)} isMobile={isMobile}>
        {PILAREN.map((p, i) => (
          <div key={p.title} style={{
            padding: isMobile ? '0.85rem 0' : '1rem 0',
            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)',
          }}>
            <div style={{
              fontSize: isMobile ? '0.6rem' : '0.63rem', fontWeight: 800,
              letterSpacing: '0.14em', color: GOLD, marginBottom: 4,
            }}>
              PIJLER {i + 1}: {p.category.toUpperCase()}
            </div>
            <div style={{
              fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff',
              letterSpacing: '-0.015em', marginBottom: 4,
            }}>
              {p.title}
            </div>
            <div style={{
              fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 600,
              color: 'rgba(255,255,255,0.55)', lineHeight: 1.45, marginBottom: 8,
            }}>
              {p.subtitle}
            </div>
            {p.bullets.map((b, j) => (
              <div key={j} style={{
                fontSize: isMobile ? '0.82rem' : '0.88rem', fontWeight: 600,
                color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
              }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>{b.label}:</span> {b.text}
              </div>
            ))}
          </div>
        ))}
      </Blad>

      {/* De voorwaarden — per actie een strook over de volle breedte van het
          blad: foto tegen de linkerrand (zo'n 20% zichtbaar), zwarte fade naar
          rechts, de kop half over die fade en de toelichting in grijs helemaal
          rechts. Een lijn scheidt de stroken. Beelden zijn Unsplash-stock,
          opgeslagen in public/voorwaarden/. */}
      <Blad open={open === 'voorwaarden'} titel="De voorwaarden" onClose={() => setOpen(null)} isMobile={isMobile}>
        {/* Negatieve marge: het blad heeft padding, de stroken moeten juist
            tegen de randen aan. */}
        <div style={{ margin: isMobile ? '-0.9rem -1.15rem 0' : '-1rem -1.35rem 0' }}>
          {[
            { foto: '/voorwaarden/workouts.jpg', kop: '3 workouts per week',     sub: 'van 45 minuten' },
            { foto: '/voorwaarden/voeding.jpg',  kop: '80% van je voedingsplan', sub: 'macrodoelen gehaald of plan gevolgd' },
            { foto: '/voorwaarden/wegen.jpg',    kop: '3x per week wegen',       sub: 'we sturen op het weekgemiddelde' },
            { foto: '/voorwaarden/checkin.jpg',  kop: 'Elke week je check-in',   sub: 'invullen in de app' },
            { foto: '/voorwaarden/calls.jpg',    kop: '4 calls',                 sub: 'verspreid over de zes weken' },
            { foto: '/voorwaarden/fotos.jpg',    kop: "3 progressiefoto's",      sub: 'begin, midden, eind' },
          ].map((r) => (
            <div key={r.kop} style={{
              position: 'relative',
              minHeight: isMobile ? 58 : 68,
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
                  {r.kop}
                </div>
                <div style={{
                  flexShrink: 0, maxWidth: isMobile ? '46%' : '42%',
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
        <p style={{
          margin: isMobile ? '1rem 0 0' : '1.15rem 0 0',
          fontSize: isMobile ? '0.78rem' : '0.83rem',
          fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5,
        }}>
          Wijkt een van de voorwaarden af van wat je met je coach hebt besproken? Dan
          stellen we die mondeling op. Het belangrijkste is dat het voor jou werkt.
        </p>
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
