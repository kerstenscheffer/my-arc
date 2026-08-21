// src/pages/TwelveWeekCheckout.jsx
// 12-weken checkout — EENMALIG €297.
//
// Opmaak + copy zijn overgenomen van /16week (src/sales-call-16week/):
// full-screen snap-secties op #0a0a0a, hero → 3 losse pijler-schermen → offer
// → formulier, met nav-dots rechts. De investering-sectie, de zwevende
// "Investering hier"-knop en het Stripe-formulier zijn functioneel ongewijzigd.
//
// Stripe: /api/create-checkout-session (one-time), plan '12-week-program'.

import { useState, useEffect, useRef } from 'react'
import { Star, Lock, Mail, User, Phone, ChevronDown } from 'lucide-react'

// Eenmalige prijs.
const PRICE = 297

// Same Stripe publishable key as the other checkouts.
const STRIPE_PK = 'pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
const BG = '#0a0a0a'

// Hero(0) + 3 pijlers(1-3) + offer(4) + formulier(5).
const SECTION_COUNT = 6

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
  { src: '/review-transformatie-3.png', caption: 'Saskia ging van 85 naar 78,5 en dalend.' },
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

// De 3 pijlers — copy gelijk aan /16week (OfferPilarenSection).
const PILAREN = [
  {
    category: 'Voeding',
    title: 'Weet Wat Je Eet Systeem',
    subtitle: 'Een aanpak die bij jou past — ook op verjaardagen, feestjes en vakanties.',
    bullets: [
      { label: 'Weten wat je eet', text: 'vaste structuur in de app, zonder rekenen' },
      { label: 'Flexibel', text: 'meedoen met etentjes, een biertje, vakantie — inbouwen, niet wegstrepen' },
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
    subtitle: 'Ik kijk meerdere keren per week met je mee — we zien allebei dat het werkt.',
    bullets: [
      { label: 'Wekelijkse check-in call', text: 'toegang tot mijn agenda' },
      { label: 'Snel bereikbaar', text: 'via de app' },
      { label: 'Ik kijk mee', text: "gewicht, kracht en foto's — progressie zwart-op-wit" },
      { label: 'Accountability', text: 'je hoeft het niet alleen te doen — ik hou je scherp en op koers' },
    ],
    images: ['/sales-screenshots/coach.png', '/sales-screenshots/tracking.png'],
  },
]

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

// ── Pijler-scherm — één pijler per volledig scherm (zoals /16week) ───────────
function PijlerSection({ isMobile, index }) {
  const p = PILAREN[index]
  // Om en om links/rechts op desktop voor ritme tussen de schermen.
  const imgFirst = index % 2 === 0

  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: isMobile ? '100dvh' : '100vh',
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '4rem 1.25rem' : '5.5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtiele gouden glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(255,186,9,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Accentlijn bovenaan */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`,
      }} />

      <div style={{ maxWidth: '960px', width: '100%', position: 'relative', zIndex: 2 }}>
        {/* Methode-eyebrow — continuïteit tussen de 3 pijler-schermen */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.25rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: 800, letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.5)',
          }}>MY ARC-METHODE · {index + 1}/{PILAREN.length}</span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : (imgFirst ? 'row-reverse' : 'row'),
          alignItems: 'center',
          gap: isMobile ? '1.75rem' : '3rem',
        }}>
          {/* Beeld-kolom */}
          <div style={{
            flex: isMobile ? 'none' : '0 0 42%',
            maxWidth: isMobile ? '72%' : '42%',
            width: isMobile ? '72%' : undefined,
            margin: isMobile ? '0 auto' : undefined,
            display: 'flex',
            gap: isMobile ? '0.5rem' : '0.65rem',
            alignItems: 'center', justifyContent: 'center',
          }}>
            {p.images.map((src) => (
              <div key={src} style={{ flex: 1, minWidth: 0, borderRadius: '14px', overflow: 'hidden', filter: 'drop-shadow(0 12px 26px rgba(0,0,0,0.55))' }}>
                <img
                  src={src}
                  alt={p.title}
                  onError={(e) => { e.currentTarget.style.opacity = 0 }}
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>

          {/* Tekst-kolom */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: isMobile ? '1.55rem' : '2.35rem',
              fontWeight: 900, color: '#fff', margin: `0 0 ${isMobile ? '0.6rem' : '0.75rem'}`,
              lineHeight: 1.12, letterSpacing: '-0.02em',
            }}>
              <span style={{ display: 'block', fontSize: isMobile ? '0.75rem' : '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>
                PIJLER {index + 1}: {p.category.toUpperCase()}
              </span>
              {p.title}
            </h3>

            <p style={{
              margin: `0 0 ${isMobile ? '0.85rem' : '1.1rem'}`,
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45,
            }}>{p.subtitle}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.55rem' : '0.65rem' }}>
              {p.bullets.map((b, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, marginTop: isMobile ? 7 : 8, width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
                  <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, fontWeight: 500 }}>
                    <span style={{ color: '#fff', fontWeight: 800 }}>{b.label}:</span> {b.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function TwelveWeekCheckout() {
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
  // Zwevende "Investering"-knop: zichtbaar tot je de offer-sectie bereikt.
  const [showInvestBtn, setShowInvestBtn] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const target = offerRef.current
    const root = containerRef.current
    if (!target || !root) return
    const obs = new IntersectionObserver(
      ([entry]) => setShowInvestBtn(!entry.isIntersecting),
      { root, threshold: 0.15 }
    )
    obs.observe(target)
    return () => obs.disconnect()
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

  const scrollToOffer = () => offerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          plan: '12-week-program',
          price: PRICE,
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

        {/* ══ SCHERM 1: HERO ══ */}
        <section style={{ ...screen, padding: isMobile ? '3rem 0' : '4.5rem 0' }}>
          <img
            src="/ma-logo-header.png"
            alt="MY ARC"
            style={{
              width: isMobile ? 104 : 132, height: 'auto',
              marginBottom: isMobile ? '1rem' : '1.25rem',
              flexShrink: 0,
            }}
          />

          <div style={{
            textAlign: 'center',
            padding: `0 ${isMobile ? '1rem' : '2rem'}`,
            maxWidth: '900px',
            marginBottom: isMobile ? '1.5rem' : '1.75rem',
          }}>
            <h1 style={{
              fontWeight: 900, lineHeight: 1.1, margin: 0,
              letterSpacing: '-0.02em', color: '#fff',
              fontSize: isMobile ? 'clamp(2rem, 7.8vw, 2.6rem)' : 'clamp(2.6rem, 4.4vw, 3.6rem)',
            }}>
              In 12 weken in shape komen,<br />met de MY ARC methode.
            </h1>
          </div>

          {/* Transformaties — onder de titel, bewust klein (titel domineert) */}
          <div style={{ width: isMobile ? '78%' : '100%', maxWidth: isMobile ? '100%' : 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.65rem' }}>
              {TRANSFORMATIONS.map((t) => (
                <div key={t.src} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <div style={{ borderRadius: '9px', overflow: 'hidden', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }}>
                    <img
                      src={t.src}
                      alt={t.caption}
                      onError={(e) => { e.currentTarget.style.opacity = 0 }}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: isMobile ? '0.5rem' : '0.62rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1.25, textAlign: 'center' }}>
                    {t.caption}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <TrustpilotBadge style={{ marginTop: isMobile ? '1.25rem' : '1.5rem' }} />
        </section>

        {/* ══ SCHERM 2-4: DE 3 PIJLERS ══ */}
        <PijlerSection isMobile={isMobile} index={0} />
        <PijlerSection isMobile={isMobile} index={1} />
        <PijlerSection isMobile={isMobile} index={2} />

        {/* ══ SCHERM 5: OFFER — ongewijzigd ══ */}
        <section ref={offerRef} style={{ ...screen, textAlign: 'center' }}>
          <div style={{ maxWidth: 520, width: '100%' }}>
            {/* Prijs — eenmalig €297 */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
              <span style={{ fontSize: isMobile ? '2.9rem' : '3.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>€297</span>
            </div>
            <div style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 8 }}>
              Eenmalig · <span style={{ color: '#fff', fontWeight: 800 }}>het volledige 3-maanden traject</span>
            </div>

            {/* Garantie — bold wit, met een gouden streep eronder als accent */}
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', color: '#fff', fontWeight: 800, lineHeight: 1.45, maxWidth: 470, margin: isMobile ? '1.6rem auto 0' : '2rem auto 0' }}>
              <span style={{ color: GOLD }}>Geen zichtbaar verschil binnen 30 dagen?</span> Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.
            </div>
            <div style={{ width: 56, height: 3, background: GOLD, borderRadius: 2, margin: isMobile ? '1.1rem auto 0' : '1.25rem auto 0' }} />

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

        {/* ══ SCHERM 6: FORMULIER + REVIEWS ══ */}
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

            {/* ══ Reviews — samen met het formulier op dit scherm ══ */}
            <div style={{ marginTop: isMobile ? '2rem' : '2.5rem' }}>
              <TrustpilotBadge style={{ marginBottom: isMobile ? '0.85rem' : '1rem' }} />

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

      {/* ══ Zwevende "Investering"-knop — ongewijzigd ══ */}
      {showInvestBtn && (
        <button onClick={scrollToOffer} style={{
          position: 'fixed', bottom: isMobile ? 18 : 26, left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.75rem 1.4rem' : '0.85rem 1.7rem', borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,0.85)',
          background: 'rgba(255,255,255,0.1)', color: '#fff',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.35)', letterSpacing: '0.01em',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          fontFamily: "'DM Sans', -apple-system, sans-serif",
        }}>
          Investering hier <ChevronDown size={16} strokeWidth={3} />
        </button>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        body { overflow: hidden; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
