// src/sales-call/sections/ReviewsSlider.jsx
// White section — Swipeable review cards
import { useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

const GOLD = '#ffba09'

const REVIEWS = [
  {
    name: 'Hessel',
    quote: 'De kennis en info die ik heb gekregen zorgt ervoor dat ik nu zonder teveel na te denken stabiel blijf in gewicht. Van 79,8 naar 74,4 in 8 weken.',
    result: '-5,4 kg in 8 weken'
  },
  {
    name: 'Indi',
    quote: 'Kersten helpt me iedere week met mijn maaltijden en motiveert me heel erg bij het sporten. Zijn begeleiding is professioneel, persoonlijk en betrouwbaar.',
    result: 'Fitter & sterker'
  },
  {
    name: 'Toon',
    quote: 'Super Coach, leuke gesprekken en altijd enthousiast. Heeft me goed geholpen in mijn traject. Zeker een aanrader!',
    result: 'Succesvol traject'
  },
  {
    name: 'Me',
    quote: 'Je krijgt een goed schema om je doel te halen en je hebt wekelijkse calls om te kijken hoe je er nu voor staat. Ook kan je makkelijk contact opnemen als je ergens tegen aan loopt.',
    result: 'Doel behaald'
  }
]

export default function ReviewsSlider({ isMobile }) {
  const [active, setActive] = useState(0)

  const next = () => setActive((prev) => (prev + 1) % REVIEWS.length)
  const prev = () => setActive((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length)

  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2.5rem 1.25rem' : '3rem 2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Header */}
        <span style={{
          fontSize: '0.6rem',
          fontWeight: '800',
          letterSpacing: '0.15em',
          color: '#e8a800',
          display: 'inline-block',
          marginBottom: '0.5rem'
        }}>WAT ANDEREN ZEGGEN</span>

        <h2 style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: isMobile ? '1.4rem' : '1.8rem',
          fontWeight: '900',
          color: '#1a1a1a',
          margin: '0 0 2.5rem',
          lineHeight: 1.2
        }}>
          Echte Verhalen,{' '}
          <span style={{
            color: '#e8a800',
            fontStyle: 'italic',
            fontFamily: "'DM Sans', sans-serif"
          }}>Echte Resultaten</span>
        </h2>

        {/* Review card */}
        <div style={{
          position: 'relative',
          minHeight: isMobile ? '220px' : '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {REVIEWS.map((r, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: '100%',
                opacity: i === active ? 1 : 0,
                transform: i === active ? 'translateX(0) scale(1)' : (i < active ? 'translateX(-40px) scale(0.95)' : 'translateX(40px) scale(0.95)'),
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: i === active ? 'auto' : 'none'
              }}
            >
              <div style={{
                background: '#fafafa',
                borderRadius: '20px',
                padding: isMobile ? '1.75rem 1.25rem' : '2.25rem 2rem',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.04)'
              }}>
                {/* Stars */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '3px',
                  marginBottom: '1.25rem'
                }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={isMobile ? 16 : 20} fill="#FFD700" color="#FFD700" strokeWidth={0} />
                  ))}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: isMobile ? '1rem' : '1.15rem',
                  fontFamily: "'DM Sans', sans-serif",
                  fontStyle: 'italic',
                  fontWeight: '500',
                  color: '#333',
                  lineHeight: 1.55,
                  margin: '0 0 1.25rem'
                }}>
                  "{r.quote}"
                </p>

                {/* Name + result */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${GOLD}, #D4B85A)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: '800'
                    }}>{r.name.charAt(0)}</span>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{
                      display: 'block',
                      fontSize: isMobile ? '0.82rem' : '0.88rem',
                      fontWeight: '800',
                      color: '#1a1a1a'
                    }}>{r.name}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: '#e8a800'
                    }}>{r.result}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={prev}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,186,9,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,186,9,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
            }}
          >
            <ChevronLeft size={18} color="#1a1a1a" />
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                style={{
                  width: i === active ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === active ? GOLD : 'rgba(0,0,0,0.12)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
              />
            ))}
          </div>

          <button
            onClick={next}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,186,9,0.1)'
              e.currentTarget.style.borderColor = 'rgba(255,186,9,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.08)'
            }}
          >
            <ChevronRight size={18} color="#1a1a1a" />
          </button>
        </div>
      </div>
    </section>
  )
}
