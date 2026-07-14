// src/pages/MaandCheckout.jsx
// Maand Plan checkout — €99/mnd × 3 maanden.
// Monthly-only flow; geen direct-pay toggle. Bedoeld als de simpele
// "Jo man, hier is de betaal link"-pagina die je na een sales-call
// in de DM stuurt.
//
// Stripe: reuse van /api/create-subscription-session (no API change).

import { useState, useEffect, useRef } from 'react'
import { Star, Lock, Mail, User, Phone } from 'lucide-react'

// Stripe recurring price · €99/mnd · product prod_TaoKNtzQpYqwch
const STRIPE_MAAND_PRICE_ID = 'price_1SdciJJ3V4uXn1OkxOMcGNiX'

// Same Stripe publishable key as the other checkouts.
const STRIPE_PK = 'pk_live_51Px383J3V4uXn1OktbtpW48KdDUq1ELqW9nfG19weDGHZ4qDOw8wE7jxEbNkA22T18lLJX9PFG755iWZWeAOYpd300oec67m54'

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
  { src: '/review-transformatie-3.png', caption: 'Van 85 naar 78,5 (en dalend)' },
  { src: '/review-transformatie-1.png', caption: 'Van 96 naar 84' },
  { src: '/review-transformatie-2.png', caption: 'Van 65 naar 60,2 (& veel sterker)' },
]

// De 5 pilaren met app-screenshots + korte omschrijving (info uit de sales-pagina).
const PILLAR_PHOTOS = [
  { screenshot: '/sales-screenshots/eten.png',    title: 'Altijd weten wat je eet', desc: 'Vaste maaltijden in de app. Vet verliezen zonder honger.' },
  { screenshot: '/sales-screenshots/meedoen.png', title: 'Gewoon mee blijven doen', desc: 'Feestjes, uit eten en weekenden blijven gewoon mogelijk.' },
  { screenshot: '/sales-screenshots/trainen.png', title: 'In shape in 3x per week',  desc: 'Workouts onder het uur, thuis of in de gym, met bijsturing.' },
  { screenshot: '/sales-screenshots/tracking.png', title: 'Zie dat het werkt',       desc: 'Kracht, gewicht en foto-tracking. Zichtbaar verschil in 30 dagen.' },
  { screenshot: '/sales-screenshots/coach.png',   title: 'Coach naast je',           desc: 'Elke 2 weken een videocall en dagelijks bereikbaar in de app.' },
]

export default function MaandCheckout() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isMobile = window.innerWidth <= 768
  const scrollRef = useRef(null)

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
      const res = await fetch('/api/create-subscription-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: STRIPE_MAAND_PRICE_ID,
          plan: 'maand-plan-3x100',
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          duration: '3-months',
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
    <div style={{
      minHeight: '100vh', background: '#000', color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        maxWidth: 520, margin: '0 auto',
        padding: isMobile ? '3.5rem 1.25rem 4.5rem' : '4.5rem 2rem 5.5rem',
      }}>

        {/* ══ HEADER ══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '4rem' : '5.5rem' }}>
          <img
            src="/ma-logo-header.png"
            alt="MA Coaching"
            style={{ width: isMobile ? 130 : 160, height: 'auto', display: 'block', margin: `0 auto ${isMobile ? '1.25rem' : '1.5rem'}` }}
          />
          <h1 style={{
            fontSize: isMobile ? '1.6rem' : '2.2rem',
            fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.02em', margin: 0, color: '#fff',
          }}>
            De start van jouw 3 maand <span style={{ color: '#ffba09' }}>(en levenslange)</span> transformatie
          </h1>
        </div>

        {/* ══ TRANSFORMATIE-REVIEWS (3 before/after + resultaat) ══ */}
        <div style={{
          display: 'flex', gap: isMobile ? '0.45rem' : '0.75rem', justifyContent: 'center',
          alignItems: 'flex-start', marginBottom: isMobile ? '4rem' : '5.5rem',
        }}>
          {TRANSFORMATIONS.map((t, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, maxWidth: isMobile ? 'none' : 165, display: 'flex', flexDirection: 'column', gap: isMobile ? 6 : 8 }}>
              <div style={{
                width: '100%', borderRadius: isMobile ? 10 : 14, overflow: 'hidden', aspectRatio: '4 / 5',
                boxShadow: '0 10px 26px rgba(0,0,0,0.5)', border: '1px solid rgba(255,186,9,0.2)',
              }}>
                <img
                  src={t.src}
                  alt="Transformatie — maand 1 naar maand 3"
                  onError={(e) => { e.currentTarget.style.opacity = 0 }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <span style={{
                textAlign: 'center', color: '#fff', fontWeight: 800,
                fontSize: isMobile ? '0.78rem' : '0.92rem', lineHeight: 1.25,
              }}>{t.caption}</span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: isMobile ? '4rem' : '5.5rem' }}>
          <div style={{
            textAlign: 'center', color: '#fff', fontWeight: 900,
            fontSize: isMobile ? '1.6rem' : '2rem', letterSpacing: '-0.02em',
            lineHeight: 1.1, marginBottom: isMobile ? '1.25rem' : '1.5rem',
          }}>Wat je krijgt</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {PILLAR_PHOTOS.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.65rem', alignItems: 'center' }}>
                {/* Screenshot — los op de pagina, geen container */}
                <div style={{
                  flexShrink: 0, width: isMobile ? 118 : 142, aspectRatio: '3 / 4',
                  borderRadius: 10, overflow: 'hidden',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                }}>
                  <img
                    src={p.screenshot}
                    alt={p.title}
                    onError={(e) => { e.currentTarget.style.opacity = 0 }}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>

                {/* Titel + korte omschrijving (wit) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 800,
                    color: '#fff', lineHeight: 1.2, marginBottom: 3,
                  }}><span style={{ color: '#ffba09' }}>{i + 1}.</span> {p.title}</div>
                  <p style={{
                    margin: 0, fontSize: isMobile ? '0.78rem' : '0.85rem',
                    color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.4,
                  }}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ OFFER — compacte platte tekst (sales-stijl, geen card) ══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '4rem' : '5.5rem' }}>
          {/* Prijs */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
            <span style={{ fontSize: isMobile ? '2.9rem' : '3.4rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>€99</span>
            <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>/mnd</span>
          </div>
          <div style={{ fontSize: isMobile ? '0.82rem' : '0.9rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 8 }}>
            3 maanden × €99 = <span style={{ color: '#fff', fontWeight: 800 }}>€297 totaal</span>
          </div>

          {/* Garantie — de belofte in goud, zoals de sales-pagina */}
          <div style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', color: '#fff', fontWeight: 700, lineHeight: 1.45, maxWidth: 470, margin: isMobile ? '1.6rem auto 0' : '2rem auto 0' }}>
            Geen zichtbaar verschil binnen 30 dagen?{' '}
            <span style={{ color: '#ffba09' }}>Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.</span>
          </div>
        </div>

        {/* ══ CHECKOUT FORM ══ */}
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
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              marginBottom: '0.6rem',
            }}>
              <field.icon size={16} color="rgba(255,186,9,0.5)" strokeWidth={2} />
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
              background: loading ? 'rgba(255,186,9,0.3)' : 'linear-gradient(135deg, #ffba09, #e8a800)',
              color: '#000',
              fontSize: isMobile ? '0.9rem' : '0.95rem',
              fontWeight: 900,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              marginTop: '0.5rem', minHeight: 52,
              boxShadow: loading ? 'none' : '0 4px 20px rgba(255,186,9,0.3)',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              letterSpacing: '0.01em',
            }}
          >
            {loading ? 'Even geduld...' : 'Start Nu · €99/maand'}
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

        {/* ══ REVIEWS ══ */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '0.5rem', marginBottom: isMobile ? '0.85rem' : '1rem',
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={isMobile ? 14 : 16} fill="#ffba09" color="#ffba09" strokeWidth={0} />
              ))}
            </div>
            <span style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.35)', fontWeight: 600,
            }}>Beoordeeld op Trustpilot</span>
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
                    <Star key={s} size={11} fill="#ffba09" color="#ffba09" strokeWidth={0} />
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
                      background: 'rgba(255,186,9,0.1)', border: '1px solid rgba(255,186,9,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 800, color: '#ffba09',
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
    </div>
  )
}
