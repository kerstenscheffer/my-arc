// ========================================
// 📁 src/lead-magnet/components/QuizHeroSection.jsx
// Gold shimmer title + compact quiz + lead capture step 6
// ========================================
import { useState, useEffect } from 'react'
const ChevronLeftIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
)
import { QUIZ_QUESTIONS, calculatePersona } from '../data/personaData'

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'

export default function QuizHeroSection({ isMobile }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [animating, setAnimating] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [persona, setPersona] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [showBubble2, setShowBubble2] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const totalSteps = QUIZ_QUESTIONS.length + 1 // 5 questions + 1 capture
  const progress = showCapture ? 100 : ((step + 1) / totalSteps) * 100
  const q = !showCapture ? QUIZ_QUESTIONS[step] : null

  const pick = (option) => {
    if (animating) return
    setAnimating(true)
    setAnswers(prev => ({ ...prev, [q.key]: option }))

    setTimeout(() => {
      if (step < QUIZ_QUESTIONS.length - 1) {
        setStep(step + 1)
      } else {
        // Last question answered — calculate persona and show capture
        const updatedAnswers = { ...answers, [q.key]: option }
        const p = calculatePersona(updatedAnswers)
        setPersona(p)
        try { sessionStorage.setItem('quiz_answers', JSON.stringify(updatedAnswers)) } catch(e) {}
        setShowCapture(true)
      }
      setAnimating(false)
    }, 300)
  }

  // Stagger animations for capture screen
  useEffect(() => {
    if (showCapture) {
      const t1 = setTimeout(() => setShowBubble2(true), 800)
      const t2 = setTimeout(() => setShowForm(true), 1400)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [showCapture])

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim()) return
    setSubmitting(true)

    // Save lead info to sessionStorage — ResultPage or backend can pick it up
    try {
      sessionStorage.setItem('lead_name', firstName.trim())
      sessionStorage.setItem('lead_email', email.trim())
    } catch(e) {}

    // Redirect to result
    window.location.href = `/ontdek-jouw-route/resultaat?type=${persona}`
  }

  const goBack = () => {
    if (showCapture) {
      setShowCapture(false)
      setShowBubble2(false)
      setShowForm(false)
      return
    }
    if (step > 0 && !animating) setStep(step - 1)
  }

  return (
    <section style={{
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: isMobile ? '2rem 1rem 2rem' : '2.5rem 2rem 3rem'
    }}>

      {/* ══════ CONTENT ══════ */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>

        {/* ══════ COACH PHOTO — top of page ══════ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          <div style={{
            width: isMobile ? '40px' : '46px',
            height: isMobile ? '40px' : '46px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: `2px solid ${GOLD}`,
            flexShrink: 0
          }}>
            <img
              src="/coach-modal.png"
              alt="Coach Kersten"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
            />
          </div>
          <div>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              fontWeight: '700',
              color: '#fff'
            }}>Kersten</div>
            <div style={{
              fontSize: '0.6rem',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '500'
            }}>MY ARC Coach</div>
          </div>
        </div>

        {/* ══════ HERO ══════ */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <h1 style={{
            fontWeight: '900',
            lineHeight: 1.1,
            margin: '0 0 0.5rem',
            letterSpacing: '-0.02em'
          }}>
            <span style={{
              display: 'block',
              fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.4rem)' : '1.5rem',
              color: '#fff'
            }}>Ontdek in <span className="shimmer-gold-quiz">5 vragen</span></span>
            <span style={{
              display: 'block',
              fontSize: isMobile ? 'clamp(1.4rem, 7vw, 1.8rem)' : '2rem',
              marginTop: '0.1em',
              color: '#fff'
            }}>waarom jij <span style={{ color: '#ef4444', fontStyle: 'italic' }}>geen vet</span> verliest</span>
            <span style={{
              display: 'block',
              fontSize: isMobile ? 'clamp(1.1rem, 5.5vw, 1.4rem)' : '1.5rem',
              marginTop: '0.1em',
              color: '#fff'
            }}>en hoe je het <span style={{ color: '#10b981', fontStyle: 'italic' }}>fixt</span></span>
          </h1>
        </div>

        {/* ══════ QUIZ CARD or LEAD CAPTURE ══════ */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(17,17,17,0.95) 0%, rgba(10,10,10,0.95) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: isMobile ? '1.25rem 1rem 1.5rem' : '1.5rem 1.5rem 1.75rem',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Progress bar row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            gap: '0.75rem'
          }}>
            {(step > 0 || showCapture) ? (
              <button
                onClick={goBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: '4px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <ChevronLeftIcon size={18} />
              </button>
            ) : (
              <div style={{ width: '26px' }} />
            )}

            <div style={{
              flex: 1,
              height: '3px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})`,
                borderRadius: '2px',
                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)'
              }} />
            </div>

            <span style={{
              fontSize: '0.65rem',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.25)',
              whiteSpace: 'nowrap'
            }}>{showCapture ? `${totalSteps}/${totalSteps}` : `${step + 1}/${totalSteps}`}</span>
          </div>

          {/* ══════ QUESTIONS MODE ══════ */}
          {!showCapture && q && (
            <>
              <h3 style={{
                textAlign: 'center',
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '700',
                margin: '0 0 1.25rem',
                color: '#fff',
                lineHeight: 1.4
              }}>{q.question}</h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem'
              }}>
                {q.options.map((option, idx) => {
                  const isSelected = answers[q.key] === option
                  return (
                    <button
                      key={idx}
                      onClick={() => pick(option)}
                      style={{
                        width: '100%',
                        padding: isMobile ? '0.75rem 0.85rem' : '0.85rem 1rem',
                        background: isSelected
                          ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`
                          : 'rgba(255,255,255,0.03)',
                        color: isSelected ? '#000' : 'rgba(255,255,255,0.85)',
                        border: isSelected
                          ? `1px solid ${GOLD}`
                          : '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        fontSize: isMobile ? '0.8rem' : '0.85rem',
                        fontWeight: isSelected ? '700' : '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        lineHeight: 1.35,
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem'
                      }}
                      onTouchStart={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
                      }}
                      onTouchEnd={(e) => {
                        if (isMobile) e.currentTarget.style.transform = 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,186,9,0.06)'
                          e.currentTarget.style.borderColor = 'rgba(255,186,9,0.15)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        }
                      }}
                    >
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: isSelected ? 'rgba(0,0,0,0.15)' : 'transparent',
                        border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '0.55rem',
                        fontWeight: '700',
                        color: isSelected ? '#000' : 'rgba(255,255,255,0.3)'
                      }}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{option.text}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ══════ LEAD CAPTURE MODE — Chat bubble style ══════ */}
          {showCapture && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem'
            }}>
              {/* Bubble 1 — immediate */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img
                    src="/coach-modal.png"
                    alt="K"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
                  />
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: isMobile ? '0.7rem 0.9rem' : '0.8rem 1rem',
                  maxWidth: '85%'
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    color: '#fff',
                    fontWeight: '500',
                    lineHeight: 1.45,
                    margin: 0
                  }}>
                    Hey maat! Je resultaat staat klaar 💪
                  </p>
                </div>
              </div>

              {/* Bubble 2 — delayed */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '0.5rem',
                opacity: showBubble2 ? 1 : 0,
                transform: showBubble2 ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease',
                marginLeft: '36px'
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '16px 16px 16px 4px',
                  padding: isMobile ? '0.7rem 0.9rem' : '0.8rem 1rem',
                  maxWidth: '85%'
                }}>
                  <p style={{
                    fontSize: isMobile ? '0.82rem' : '0.88rem',
                    color: '#fff',
                    fontWeight: '500',
                    lineHeight: 1.45,
                    margin: 0
                  }}>
                    Vul even je naam en mail in, dan laat ik je direct zien waar jij vastloopt 👇
                  </p>
                </div>
              </div>

              {/* Form — delayed */}
              <div style={{
                opacity: showForm ? 1 : 0,
                transform: showForm ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.4s ease',
                marginTop: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                <input
                  type="text"
                  placeholder="Je voornaam"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.8rem 1rem' : '0.9rem 1rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '500',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = GOLD}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <input
                  type="email"
                  placeholder="Je e-mailadres"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.8rem 1rem' : '0.9rem 1rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    fontWeight: '500',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = GOLD}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !firstName.trim() || !email.trim()}
                  style={{
                    width: '100%',
                    padding: isMobile ? '0.85rem' : '0.95rem',
                    background: (!firstName.trim() || !email.trim())
                      ? 'rgba(255,186,9,0.3)'
                      : `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
                    color: '#000',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: isMobile ? '0.88rem' : '0.92rem',
                    fontWeight: '800',
                    cursor: (!firstName.trim() || !email.trim()) ? 'not-allowed' : 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.2s ease',
                    marginTop: '0.25rem'
                  }}
                >
                  {submitting ? 'Even laden...' : 'Bekijk mijn resultaat →'}
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

      {/* ══════ STYLES ══════ */}
      <style>{`
        .shimmer-gold-quiz {
          background: linear-gradient(110deg, #ffba09 0%, #ffba09 40%, #fff5d4 48%, #ffffff 50%, #fff5d4 52%, #ffba09 60%, #ffba09 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerQuiz 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,186,9,0.2));
        }
        @keyframes shimmerQuiz {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </section>
  )
}
