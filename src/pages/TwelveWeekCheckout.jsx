// src/pages/TwelveWeekCheckout.jsx
// 12-weken checkout — EENMALIG €297. Zelfde offer/design als /maand-checkout
// (MaandCheckout), maar met een one-time betaling i.p.v. het €99/mnd-abonnement.
//
// Stripe: /api/create-checkout-session (one-time), plan '12-week-program'.

import { useState, useEffect, useRef } from 'react'
import { Star, Lock, Mail, User, Phone, ChevronDown } from 'lucide-react'

// Eenmalige prijs.
const PRICE = 297

// Same Stripe publishable key as the other checkouts.
const STRIPE_PK = 'pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54'

const TP_GREEN = '#00B67A'

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

// De 3 pilaren van de sales-pagina (OfferPilarenSection): titel + subtitel +
// bullets + app-screenshots. Pilaar 3 heeft een korte klant-quote.
const PILAREN = [
  {
    title: 'Altijd Weten Wat Te Eten Systeem',
    subtitle: 'Een aanpak die bij jou past, ook op verjaardagen, feestjes en vakanties.',
    bullets: [
      { label: 'Weten wat je eet', text: 'vaste structuur in de app, zonder rekenen' },
      { label: 'Flexibel', text: 'meedoen met etentjes, een biertje of vakantie. Inbouwen, niet wegstrepen' },
    ],
    images: ['/sales-screenshots/eten.png', '/sales-screenshots/meedoen.png'],
  },
  {
    title: 'Elke Training Telt Methode',
    subtitle: 'Schema op maat, uitleg per oefening, feedback op jouw uitvoering.',
    bullets: [
      { label: 'Effectief', text: 'workouts onder een uur, thuis of in de gym' },
      { label: 'Begeleiding', text: "uitlegvideo's + persoonlijke bijsturing" },
    ],
    images: ['/sales-screenshots/trainen.png'],
  },
  {
    title: 'Coach In Jouw Corner',
    subtitle: 'Ik kijk meerdere keren per week met je mee, we zien allebei dat het werkt.',
    bullets: [
      { label: 'Wekelijkse check-in call', text: 'toegang tot mijn agenda' },
      { label: 'Snel bereikbaar', text: 'via de app' },
      { label: 'Ik kijk mee', text: "gewicht, kracht en foto's, progressie zwart-op-wit" },
    ],
    images: ['/sales-screenshots/coach.png', '/sales-screenshots/tracking.png'],
    quote: { text: 'Dit was voor mij het sterkste onderdeel.', author: 'Nitish, 3 maanden afgerond' },
  },
]

export default function TwelveWeekCheckout() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isMobile = window.innerWidth <= 768
  const scrollRef = useRef(null)
  const containerRef = useRef(null)
  const offerRef = useRef(null)
  const formRef = useRef(null)
  // Zwevende "Investering"-knop: zichtbaar tot je de offer-sectie bereikt.
  const [showInvestBtn, setShowInvestBtn] = useState(true)

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

  const scrollToOffer = () => offerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Elke sectie vult (min.) een heel scherm en centreert z'n inhoud verticaal,
  // zodat je één sectie tegelijk ziet. Langere secties groeien gewoon mee.
  const screen = {
    minHeight: isMobile ? '100dvh' : '100vh',
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    scrollSnapAlign: 'start',
    paddingTop: isMobile ? '1.5rem' : '2rem',
    paddingBottom: isMobile ? '1.5rem' : '2rem',
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
    <div ref={containerRef} style={{
      // Zachte snap-scroll: glijdt naar de dichtstbijzijnde sectie zodra je in
      // de buurt komt (proximity houdt je nergens vast — belangrijk op checkout).
      height: isMobile ? '100dvh' : '100vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      scrollSnapType: 'y proximity', scrollBehavior: 'smooth',
      scrollPaddingTop: isMobile ? '1.5rem' : '2rem',
      background: '#000', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: isMobile ? '0 1.25rem' : '0 2rem',
      }}>

        {/* ══ Zwevende "Investering"-knop — begeleidt naar de prijs/offer ══ */}
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
          }}>
            Investering hier <ChevronDown size={16} strokeWidth={3} />
          </button>
        )}

        {/* ══ SCHERM 1: HERO ══ */}
        <div style={screen}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '1.75rem' }}>
          <img
            src="/ma-logo-header.png"
            alt="MA Coaching"
            style={{ width: isMobile ? 104 : 132, height: 'auto', display: 'block', margin: `0 auto ${isMobile ? '1rem' : '1.25rem'}` }}
          />
          <h1 style={{
            fontSize: isMobile ? 'clamp(2rem, 7.8vw, 2.6rem)' : 'clamp(2.6rem, 4.4vw, 3.6rem)',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, color: '#fff',
          }}>
            Het in shape komen &amp; blijven systeem
          </h1>
          <div style={{
            fontWeight: 500, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4,
            marginTop: isMobile ? '0.5rem' : '0.65rem',
            fontSize: isMobile ? '1.05rem' : '1.6rem',
          }}>
            In 3 maanden in shape met een aanpak die je daarna niet meer kwijtraakt.
          </div>
        </div>

        {/* ══ 3 transformaties — onder de titel, klein (titel domineert) ══ */}
        <div style={{
          display: 'flex', gap: isMobile ? '0.4rem' : '0.65rem', justifyContent: 'center',
          alignItems: 'flex-start', width: isMobile ? '70%' : '100%', maxWidth: isMobile ? 'none' : 400, margin: '0 auto',
        }}>
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

        {/* ══ Trustpilot badge — sluit de hero af (gelijk aan /sales) ══ */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.5rem', marginTop: isMobile ? '1.25rem' : '1.5rem',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
          </svg>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>4.8</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
        </div>

        </div>{/* /scherm 1 hero */}

        {/* ══ SCHERM 2: WAT JE KRIJGT ══ */}
        <div style={screen}>
          <div style={{
            textAlign: 'center', color: '#fff', fontWeight: 900,
            fontSize: isMobile ? '1.6rem' : '2rem', letterSpacing: '-0.02em',
            lineHeight: 1.1, marginBottom: isMobile ? '1.25rem' : '1.5rem',
          }}>Wat je krijgt</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '2rem' : '2.5rem' }}>
            {PILAREN.map((p, i) => (
              <div key={i}>
                {/* Nummer + titel */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isMobile ? '0.4rem' : '0.5rem' }}>
                  <div style={{
                    flexShrink: 0, width: isMobile ? 30 : 34, height: isMobile ? 30 : 34, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: isMobile ? '0.9rem' : '1rem',
                  }}>{i + 1}</div>
                  <h3 style={{
                    flex: 1, minWidth: 0, margin: 0,
                    fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 900,
                    color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em',
                  }}>{p.title}</h3>
                </div>

                {/* Subtitel */}
                <p style={{
                  margin: `0 0 ${isMobile ? '0.7rem' : '0.85rem'}`,
                  fontSize: isMobile ? '0.82rem' : '0.9rem', fontWeight: 600,
                  color: 'rgba(255,255,255,0.65)', lineHeight: 1.4,
                }}>{p.subtitle}</p>

                {/* Beelden — 1 of 2 screenshots naast elkaar */}
                <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.55rem', marginBottom: isMobile ? '0.7rem' : '0.85rem' }}>
                  {p.images.map((src) => (
                    <div key={src} style={{
                      flex: 1, minWidth: 0, borderRadius: 10, overflow: 'hidden', display: 'flex',
                      filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                    }}>
                      <img
                        src={src}
                        alt={p.title}
                        onError={(e) => { e.currentTarget.style.opacity = 0 }}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.4rem' : '0.5rem' }}>
                  {p.bullets.map((b, j) => (
                    <div key={j} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ flexShrink: 0, marginTop: isMobile ? 6 : 7, width: 5, height: 5, borderRadius: '50%', background: '#ffba09' }} />
                      <p style={{ margin: 0, fontSize: isMobile ? '0.8rem' : '0.88rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, fontWeight: 500 }}>
                        <span style={{ color: '#fff', fontWeight: 800 }}>{b.label}:</span> {b.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Optionele quote (pilaar 3) */}
                {p.quote && (
                  <div style={{ marginTop: isMobile ? '0.85rem' : '1rem', paddingLeft: '0.85rem', borderLeft: '2px solid rgba(255,255,255,0.25)' }}>
                    <p style={{ margin: 0, fontSize: isMobile ? '0.88rem' : '0.95rem', fontStyle: 'italic', color: '#fff', fontWeight: 600, lineHeight: 1.4 }}>
                      "{p.quote.text}"
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: isMobile ? '0.7rem' : '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                      {p.quote.author}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ══ SCHERM 3: OFFER ══ */}
        <div ref={offerRef} style={{ ...screen, textAlign: 'center' }}>
          {/* Prijs — eenmalig €297 */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: isMobile ? '2.9rem' : '3.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>€297</span>
          </div>
          <div style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 8 }}>
            Eenmalig · <span style={{ color: '#fff', fontWeight: 800 }}>het volledige 3-maanden traject</span>
          </div>

          {/* Garantie — bold wit, met een gouden streep eronder als accent */}
          <div style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', color: '#fff', fontWeight: 800, lineHeight: 1.45, maxWidth: 470, margin: isMobile ? '1.6rem auto 0' : '2rem auto 0' }}>
            <span style={{ color: '#ffba09' }}>Geen zichtbaar verschil binnen 30 dagen?</span> Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.
          </div>
          <div style={{ width: 56, height: 3, background: '#ffba09', borderRadius: 2, margin: isMobile ? '1.1rem auto 0' : '1.25rem auto 0' }} />

          {/* Knop naar het formulier (afrekenen) */}
          <button onClick={scrollToForm} style={{
            alignSelf: 'center', marginTop: isMobile ? '1.85rem' : '2.25rem',
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: isMobile ? '0.85rem 1.7rem' : '0.95rem 2rem', borderRadius: 999, border: 'none',
            background: '#fff', color: '#000',
            fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(255,255,255,0.15)', letterSpacing: '0.01em',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            Ik wil starten <ChevronDown size={16} strokeWidth={3} />
          </button>
        </div>

        {/* ══ SCHERM 4: FORMULIER ══ */}
        <div ref={formRef} style={screen}>
        <div style={{
          borderRadius: isMobile ? 16 : 18,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
          marginBottom: isMobile ? '4rem' : '5.5rem',
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
              letterSpacing: '0.01em',
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
        <div style={{ marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', marginBottom: isMobile ? '0.85rem' : '1rem',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
            </svg>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>4.8</span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          </div>

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
        </div>{/* /scherm 4: formulier + reviews */}

      </div>
    </div>
  )
}
