// src/pages/MaandCheckout.jsx
// Maand Plan checkout — €99/mnd × 3 maanden.
// Monthly-only flow; geen direct-pay toggle. Bedoeld als de simpele
// "Jo man, hier is de betaal link"-pagina die je na een sales-call
// in de DM stuurt.
//
// Stripe: reuse van /api/create-subscription-session (no API change).

import { useState, useEffect, useRef } from 'react'
import {
  UtensilsCrossed, Dumbbell, Target, BarChart3, Moon,
  Star, Lock, Mail, User, Phone,
} from 'lucide-react'

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

const PILLARS = [
  { icon: UtensilsCrossed, text: 'Fuel Your Gains Meal System' },
  { icon: Dumbbell,        text: 'Built To Grow Training System' },
  { icon: Target,          text: 'Coach In Your Corner' },
  { icon: BarChart3,       text: 'Trust The Process Tracker' },
  { icon: Moon,            text: 'Recovery King Protocol' },
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
        padding: isMobile ? '2rem 1.25rem 3rem' : '3rem 2rem 4rem',
      }}>

        {/* ══ HEADER ══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '2.5rem' }}>
          <div style={{
            fontSize: isMobile ? '0.6rem' : '0.65rem',
            fontWeight: 800, color: 'rgba(255,186,9,0.5)',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6,
          }}>MY ARC FITNESS</div>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.5rem',
            fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 6,
          }}>
            <span style={{ color: '#fff' }}>Maand </span>
            <span style={{
              background: 'linear-gradient(135deg, #ffba09, #d4a006)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Plan</span>
          </h1>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255,255,255,0.4)', fontWeight: 500,
          }}>
            3 maanden coaching · €99 per maand · stop wanneer je wilt na 3 maanden.
          </p>
        </div>

        {/* ══ PRICING CARD ══ */}
        <div style={{
          borderRadius: isMobile ? 18 : 22,
          border: '1px solid rgba(255,186,9,0.3)',
          background: 'rgba(255,255,255,0.02)',
          overflow: 'hidden', position: 'relative',
          marginBottom: isMobile ? '1.5rem' : '2rem',
        }}>
          {/* Gold top accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #ffba09, #d4a006, #ffba09)',
          }} />

          {/* What you get */}
          <div style={{ padding: isMobile ? '1.75rem 1.5rem 1.25rem' : '2rem 2rem 1.5rem' }}>
            <span style={{
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: 800, color: 'rgba(255,186,9,0.5)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              display: 'block', marginBottom: isMobile ? '0.85rem' : '1rem',
            }}>WAT JE KRIJGT</span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.55rem' : '0.65rem' }}>
              {PILLARS.map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: isMobile ? 26 : 30, height: isMobile ? 26 : 30,
                      borderRadius: '50%', background: 'rgba(255,186,9,0.08)',
                      border: '1px solid rgba(255,186,9,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={isMobile ? 12 : 14} color="#ffba09" strokeWidth={2} />
                    </div>
                    <span style={{ fontSize: isMobile ? '0.82rem' : '0.88rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
                      {item.text}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,186,9,0.15), transparent)', margin: '0 1.5rem' }} />

          {/* Guarantees */}
          <div style={{
            padding: isMobile ? '1rem 1.5rem 0' : '1.15rem 2rem 0',
            display: 'flex', gap: isMobile ? '0.75rem' : '1rem',
          }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: isMobile ? '0.55rem 0.65rem' : '0.6rem 0.75rem',
              borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
              <div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>28 Dagen Proberen</div>
                <div style={{ fontSize: isMobile ? '0.55rem' : '0.58rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Niet tevreden? Geld terug.</div>
              </div>
            </div>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: isMobile ? '0.55rem 0.65rem' : '0.6rem 0.75rem',
              borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>3 Maanden</div>
                <div style={{ fontSize: isMobile ? '0.55rem' : '0.58rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>Geen langetermijn-vastlegging</div>
              </div>
            </div>
          </div>

          {/* Price */}
          <div style={{ padding: isMobile ? '1.25rem 1.5rem 1.5rem' : '1.5rem 2rem 1.75rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
              <span style={{ fontSize: isMobile ? '2.75rem' : '3.25rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>€99</span>
              <span style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>/mnd</span>
            </div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 6 }}>
              3 maanden × €99 = €297 totaal
            </div>
            <div style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', color: '#ffba09', fontWeight: 700, marginTop: 4 }}>
              Eerste betaling vandaag · maandelijks automatisch
            </div>
          </div>
        </div>

        {/* ══ CHECKOUT FORM ══ */}
        <div style={{
          borderRadius: isMobile ? 16 : 18,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.02)',
          padding: isMobile ? '1.5rem 1.25rem' : '1.75rem 1.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
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
            {loading ? 'Even geduld...' : 'Start Nu — €99/maand'}
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
