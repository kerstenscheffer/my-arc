// ========================================
// 📁 src/funnel/five-pilar/sections/PillarSection.jsx
// 2-COL GRID + GOLDEN CENTER LINE + NODES OVERLAY
// Solution-selling copy with system names
// ========================================
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  UtensilsCrossed,
  Dumbbell,
  Target,
  BarChart3,
  Moon,
  Check
} from 'lucide-react'

const PILLARS = [
  {
    id: 1, icon: UtensilsCrossed, label: 'PILAAR 1',
    image: 'https://i.ibb.co/fVBpKfsJ/7.png',
    title: 'Fuel Your Gains',
    subtitle: 'Nooit meer twijfelen wat je moet eten',
    bullets: [
      'We bouwen samen een meal plan dat je lekker vindt met het Fuel Your Gains Meal System',
      'Je houdt alles simpel bij in de app met Macro Mastery, geen weegschaal nodig',
      'Met Prep Like A Pro prep je je hele week in onder een uur',
      'Het Peak Performance Meal Planner stemt je eetmomenten af op jouw werk en training',
      'Met het Flex System eet je mee, ga je uit eten en snack je gewoon, het plan past zich aan'
    ]
  },
  {
    id: 2, icon: Dumbbell, label: 'PILAAR 2',
    image: 'https://i.ibb.co/6Rmd50GW/5.png',
    title: 'Built To Grow',
    subtitle: 'Open de app, train, klaar',
    bullets: [
      'Het Built To Grow Training System staat elke training klaar, je hoeft niks te bedenken',
      'De Better Than Yesterday Tracker laat zien wat je vorige keer deed, jij gaat erbij',
      'Het Raise The Bar System vertelt je wanneer je meer gewicht pakt',
      'Met Stay Locked In heb je voor elke slechte dag, vakantie of drukke week een backup plan'
    ]
  },
  {
    id: 3, icon: Target, label: 'PILAAR 3',
    image: 'https://i.ibb.co/3y8zGSYt/9.png',
    title: 'Coach In Your Corner',
    subtitle: 'Iemand die meekijkt en het snapt',
    bullets: [
      'Elke week een persoonlijk gesprek via het Coach In Your Corner System',
      'Zit je vast? Stuur een bericht, binnen uren heb je antwoord',
      'Ik zie je data en grijp in voordat jij merkt dat het misgaat'
    ]
  },
  {
    id: 4, icon: BarChart3, label: 'PILAAR 4',
    image: 'https://i.ibb.co/dd3bKQX/4.png',
    title: 'Trust The Process',
    subtitle: 'Stoppen met gokken, beginnen met weten',
    bullets: [
      'De Trust The Process Tracker laat in één oogopslag zien of je op schema ligt',
      'Je ziet per oefening dat je sterker wordt, de data liegt niet',
      'Met het Eat Better Spend Less System zie je precies hoeveel je bespaart per week'
    ]
  },
  {
    id: 5, icon: Moon, label: 'PILAAR 5',
    image: 'https://i.ibb.co/SwTcyFP4/8.png',
    title: 'Recovery King',
    subtitle: 'Beter slapen, sneller groeien',
    bullets: [
      'Het Recovery King Protocol geeft je een slaapplan dat je energie binnen dagen verbetert',
      'Je ziet precies hoe je slaap je trainingen en resultaten beïnvloedt',
      'Minder moe, betere trainingen, sneller resultaat, zonder extra moeite'
    ]
  }
]

export default function PillarSection({ isMobile, onScrollNext, onNavigate }) {
  const [isVisible, setIsVisible] = useState(false)
  const [visiblePillars, setVisiblePillars] = useState(new Set())
  const [nodeYPositions, setNodeYPositions] = useState([])
  const sectionRef = useRef(null)
  const containerRef = useRef(null)
  const pillarRefs = useRef([])
  const gridRef = useRef(null)

  // Section visibility
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setIsVisible(true) },
      { threshold: 0.05 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  // Individual pillar visibility
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisiblePillars(prev => new Set([...prev, Number(e.target.dataset.index)]))
          }
        })
      },
      { threshold: 0.15 }
    )
    pillarRefs.current.forEach(ref => { if (ref) obs.observe(ref) })
    return () => obs.disconnect()
  }, [])

  // Calculate node Y positions (desktop only)
  useEffect(() => {
    if (isMobile) return
    const calc = () => {
      if (!containerRef.current) return
      const cRect = containerRef.current.getBoundingClientRect()
      const positions = []
      pillarRefs.current.forEach((ref, idx) => {
        // Only measure left-column cards (even indices)
        if (idx % 2 === 0 && ref) {
          const r = ref.getBoundingClientRect()
          // Position node at top area of the card
          positions.push(r.top - cRect.top + 30)
        }
      })
      setNodeYPositions(positions)
    }
    const t = setTimeout(calc, 150)
    window.addEventListener('resize', calc)
    return () => { clearTimeout(t); window.removeEventListener('resize', calc) }
  }, [isMobile, visiblePillars])

  // Keyboard nav
  const scrollToNext = () => {
    if (onNavigate) onNavigate(1)
    else if (onScrollNext) onScrollNext()
  }

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      if (rect.top > window.innerHeight || rect.bottom < 0) return
      e.preventDefault()
      scrollToNext()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#000',
        position: 'relative',
        padding: isMobile ? '4rem 1.25rem 5rem' : '5rem 2rem 6rem',
        overflow: 'hidden'
      }}
    >
      {/* ══════ HEADER ══════ */}
      <div style={{
        textAlign: 'center',
        maxWidth: '700px',
        margin: '0 auto',
        marginBottom: isMobile ? '2.5rem' : '3rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3.25rem',
          fontWeight: '900',
          lineHeight: 1.1,
          marginBottom: '0.75rem',
          letterSpacing: '-0.02em'
        }}>
          <span style={{ color: '#fff' }}>Jouw Route Naar </span>
          <span className="shimmer-gold-ps">Resultaat</span>
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1.05rem',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: '500'
        }}>
          5 pilaren. 1 systeem. Alles wat je nodig hebt.
        </p>
      </div>

      {/* ══════ MAIN CONTAINER (line + nodes + grid) ══════ */}
      <div ref={containerRef} style={{
        position: 'relative',
        maxWidth: '850px',
        margin: '0 auto'
      }}>

        {/* ── VERTICAL GOLDEN LINE ── */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '16px' : '50%',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          top: 0, bottom: 0,
          width: '2px',
          background: isVisible
            ? 'linear-gradient(180deg, rgba(255,186,9,0.05) 0%, rgba(255,186,9,0.25) 8%, rgba(255,186,9,0.25) 92%, rgba(255,186,9,0.05) 100%)'
            : 'rgba(255,255,255,0.03)',
          transition: 'background 1.5s ease 0.3s',
          zIndex: 0
        }} />

        {/* ── ANIMATED GLOW ── */}
        <div style={{
          position: 'absolute',
          left: isMobile ? '15px' : 'calc(50% - 1px)',
          top: 0,
          width: '4px', height: '60px',
          borderRadius: '2px',
          background: 'linear-gradient(180deg, transparent, rgba(255,186,9,0.6), transparent)',
          animation: isVisible ? 'travelDownPS 5s ease-in-out infinite' : 'none',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 1s ease 1s',
          zIndex: 1
        }} />

        {/* ══════ NODES OVERLAY (desktop only) ══════
            Two nodes per row: one right of left-card, one left of right-card.
            Both sit on the center line area. */}
        {!isMobile && nodeYPositions.length > 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 20
          }}>
            {nodeYPositions.map((yPos, rowIdx) => {
              const leftPillar = PILLARS[rowIdx * 2]
              const rightPillar = PILLARS[rowIdx * 2 + 1]
              const vis = visiblePillars.has(rowIdx * 2)
              return (
                <div key={`row-${rowIdx}`}>
                  {/* Left card's icon — half overlaps right edge of left card */}
                  {leftPillar && (() => {
                    const IconL = leftPillar.icon
                    return (
                      <div style={{
                        position: 'absolute',
                        right: 'calc(50% + 3rem)',
                        top: `${yPos}px`,
                        transform: 'translate(50%, -50%)',
                        width: '40px', height: '40px',
                        borderRadius: '50%',
                        background: '#0a0a0a',
                        border: `2px solid rgba(255,186,9,${vis ? '0.5' : '0.15'})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        boxShadow: vis ? '0 0 25px rgba(255,186,9,0.15)' : 'none'
                      }}>
                        <IconL size={16} color="#ffba09" strokeWidth={2} />
                      </div>
                    )
                  })()}
                  {/* Right card's icon — half overlaps left edge of right card */}
                  {rightPillar && (() => {
                    const IconR = rightPillar.icon
                    const visR = visiblePillars.has(rowIdx * 2 + 1)
                    return (
                      <div style={{
                        position: 'absolute',
                        left: 'calc(50% + 3rem)',
                        top: `${yPos}px`,
                        transform: 'translate(-50%, -50%)',
                        width: '40px', height: '40px',
                        borderRadius: '50%',
                        background: '#0a0a0a',
                        border: `2px solid rgba(255,186,9,${visR ? '0.5' : '0.15'})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.5s ease',
                        boxShadow: visR ? '0 0 25px rgba(255,186,9,0.15)' : 'none'
                      }}>
                        <IconR size={16} color="#ffba09" strokeWidth={2} />
                      </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        )}

        {/* ══════ GRID ══════ */}
        <div ref={gridRef} style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '1rem' : '1.25rem',
          columnGap: isMobile ? '0' : '3.5rem',
          paddingLeft: isMobile ? '2.5rem' : '0',
          position: 'relative',
          zIndex: 2
        }}>
          {PILLARS.map((pillar, index) => {
            const Icon = pillar.icon
            const vis = visiblePillars.has(index)
            const isLeft = index % 2 === 0

            return (
              <div
                key={pillar.id}
                ref={el => pillarRefs.current[index] = el}
                data-index={index}
                style={{
                  gridColumn: isMobile ? 'auto' : (isLeft ? '1' : '2'),
                  position: 'relative',
                  opacity: vis ? 1 : 0,
                  transform: vis ? 'translateY(0)' : 'translateY(20px)',
                  transition: `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.08}s`,
                }}
              >
                {/* ── Mobile node (on left line) ── */}
                {isMobile && (
                  <div style={{
                    position: 'absolute',
                    left: '-2.5rem', top: '12px',
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(10,10,10,0.95)',
                    border: `2px solid rgba(255,186,9,${vis ? '0.4' : '0.15'})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.5s ease',
                    boxShadow: vis ? '0 0 20px rgba(255,186,9,0.12)' : 'none',
                    zIndex: 10
                  }}>
                    <Icon size={14} color="#ffba09" strokeWidth={2} />
                  </div>
                )}

                {/* ── Desktop branch line (from card edge to center line) ── */}
                {!isMobile && (
                  <div style={{
                    position: 'absolute',
                    top: '30px',
                    [isLeft ? 'right' : 'left']: '-1.25rem',
                    width: 'calc(1.75rem + 1.25rem)',
                    height: '2px',
                    background: vis ? 'rgba(255,186,9,0.2)' : 'transparent',
                    transition: 'background 0.6s ease 0.3s',
                    zIndex: 4
                  }} />
                )}

                {/* ── CARD ── */}
                <div className="ps-card" style={{
                  borderRadius: isMobile ? '12px' : '14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.02)',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  height: isMobile ? 'auto' : '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  marginLeft: (!isMobile && !isLeft) ? '1.25rem' : '0',
                  marginRight: (!isMobile && isLeft) ? '1.25rem' : '0'
                }}>
                  {/* Image banner */}
                  <div style={{
                    width: '100%',
                    height: isMobile ? '85px' : '100px',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <img
                      src={pillar.image}
                      alt={pillar.title}
                      loading="lazy"
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.7)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0, height: '70%',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,5,0.95) 100%)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: isMobile ? '0.5rem' : '0.6rem',
                      left: isMobile ? '0.5rem' : '0.6rem',
                      padding: '0.2rem 0.55rem',
                      background: 'linear-gradient(135deg, #ffba09, #d4a006)',
                      borderRadius: '100px',
                      fontSize: '0.5rem',
                      fontWeight: '800',
                      color: '#000',
                      letterSpacing: '0.08em'
                    }}>
                      {pillar.label}
                    </div>
                  </div>

                  {/* Text content */}
                  <div style={{
                    padding: isMobile ? '0.85rem 1rem 1.1rem' : '1rem 1.25rem 1.25rem',
                    flex: 1
                  }}>
                    <h3 style={{
                      fontSize: isMobile ? '1.05rem' : '1.2rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #ffba09, #d4a006)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '0.15rem',
                      lineHeight: 1.3
                    }}>{pillar.title}</h3>

                    <p style={{
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      color: 'rgba(255,255,255,0.45)',
                      fontWeight: '500',
                      marginBottom: isMobile ? '0.65rem' : '0.75rem',
                      lineHeight: 1.4
                    }}>{pillar.subtitle}</p>

                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      gap: isMobile ? '0.4rem' : '0.45rem'
                    }}>
                      {pillar.bullets.map((bullet, idx) => (
                        <div key={idx} style={{
                          display: 'flex', alignItems: 'flex-start', gap: '0.45rem',
                          opacity: vis ? 1 : 0,
                          transform: vis ? 'translateX(0)' : 'translateX(-8px)',
                          transition: `all 0.35s ease ${0.1 + idx * 0.05}s`
                        }}>
                          <div style={{
                            width: '16px', height: '16px',
                            borderRadius: '50%',
                            background: 'rgba(255,186,9,0.08)',
                            border: '1px solid rgba(255,186,9,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: '2px'
                          }}>
                            <Check size={9} color="#ffba09" strokeWidth={2.5} />
                          </div>
                          <span style={{
                            fontSize: isMobile ? '0.78rem' : '0.85rem',
                            color: 'rgba(255,255,255,0.65)',
                            lineHeight: 1.45, fontWeight: '500'
                          }}>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── END: BESTE SHAPE ── */}
        <div style={{
          position: 'relative',
          marginTop: isMobile ? '2rem' : '2rem',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
          transition: 'all 0.8s ease 0.5s',
          paddingLeft: isMobile ? '2.5rem' : '0',
          zIndex: 2
        }}>
          <div style={{
            position: 'absolute',
            left: isMobile ? '0' : '50%',
            top: '50%',
            transform: isMobile ? 'translateY(-50%)' : 'translate(-50%, -50%)',
            width: '14px', height: '14px',
            borderRadius: '50%',
            background: '#ffba09',
            boxShadow: '0 0 12px rgba(255,186,9,0.5), 0 0 30px rgba(255,186,9,0.2)',
            zIndex: 3
          }} />
          <div style={{
            padding: isMobile ? '1rem' : '1.15rem',
            borderRadius: '12px',
            border: '1px solid rgba(255,186,9,0.15)',
            background: 'rgba(255,186,9,0.03)',
            textAlign: 'center',
            maxWidth: isMobile ? '100%' : '350px',
            margin: isMobile ? '0' : '0 auto'
          }}>
            <span className="shimmer-gold-ps" style={{
              fontSize: isMobile ? '1.1rem' : '1.3rem',
              fontWeight: '900', letterSpacing: '-0.01em'
            }}>Jouw Beste Shape</span>
            <p style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.3)',
              fontWeight: '500', marginTop: '0.3rem'
            }}>Dit is wat je krijgt. Geen verrassingen.</p>
          </div>
        </div>
      </div>

      {/* ══════ STYLES ══════ */}
      <style>{`
        .ps-card:hover {
          background: rgba(255,186,9,0.03) !important;
          border-color: rgba(255,186,9,0.15) !important;
        }
        @keyframes travelDownPS {
          0% { top: -60px; opacity: 0; }
          8% { opacity: 1; }
          92% { opacity: 1; }
          100% { top: calc(100% + 20px); opacity: 0; }
        }
        .shimmer-gold-ps {
          background: linear-gradient(110deg, #ffba09 0%, #ffba09 40%, #fff5d4 48%, #ffffff 50%, #fff5d4 52%, #ffba09 60%, #ffba09 100%);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerPS 4s ease-in-out infinite;
          filter: drop-shadow(0 0 20px rgba(255,186,9,0.2));
        }
        @keyframes shimmerPS {
          0% { background-position: 100% center; }
          100% { background-position: -100% center; }
        }
      `}</style>
    </section>
  )
}
