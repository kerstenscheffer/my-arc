import React, { useState, useEffect } from 'react'
import { Timer, Users, Calendar, ArrowRight, X } from 'lucide-react'
import CalendlyModal from '../components/CalendlyModal'

export default function FinalCTASection({ onScrollNext }) {
  // Visibility states voor progressive reveal
  const [headerVisible, setHeaderVisible] = useState(false)
  const [urgencyVisible, setUrgencyVisible] = useState(false)
  const [kernVisible, setKernVisible] = useState(false)
  const [keuzeTitleVisible, setKeuzeTitleVisible] = useState(false)
  const [leftImageVisible, setLeftImageVisible] = useState(false)
  const [rightImageVisible, setRightImageVisible] = useState(false)
  const [vsBadgeVisible, setVsBadgeVisible] = useState(false)
  const [scenarioTextVisible, setScenarioTextVisible] = useState(false)
  const [choiceBoxesVisible, setChoiceBoxesVisible] = useState(false)
  const [psVisible, setPsVisible] = useState(false)
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [hoveredChoice, setHoveredChoice] = useState(null)
  const [showCalendlyModal, setShowCalendlyModal] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    // Progressive reveal choreography
    setTimeout(() => setHeaderVisible(true), 400)
    setTimeout(() => setUrgencyVisible(true), 800)
    setTimeout(() => setKernVisible(true), 1400)
    setTimeout(() => setKeuzeTitleVisible(true), 1800)
    setTimeout(() => setLeftImageVisible(true), 2000)
    setTimeout(() => setRightImageVisible(true), 2200)
    setTimeout(() => setVsBadgeVisible(true), 2400)
    setTimeout(() => setScenarioTextVisible(true), 2600)
    setTimeout(() => setChoiceBoxesVisible(true), 2800)
    setTimeout(() => setPsVisible(true), 3200)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const urgencyItems = [
    { icon: Timer, text: "Exclusief Voor Eerste 10 Challenge Deelnemers", color: '#ef4444' },
    { icon: Users, text: "Week 6-8 Timing - Momentum Op Maximum", color: '#f97316' },
    { icon: Calendar, text: "Daarna Full Price €1800 - Nu €550-€600", color: '#eab308' }
  ]

  // Placeholder foto URLs (gebruiker moet vervangen)
  const photoUrlLeft = 'https://images.unsplash.com/photo-1529068755536-a5ade0dcb4e8?w=600&h=800&fit=crop' // Man on couch with phone
  const photoUrlRight = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=800&fit=crop' // Man training intense

  return (
    <>
      <section 
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
          position: 'relative',
          padding: isMobile ? '4rem 1rem' : '6rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'hidden'
        }}
      >
        {/* Dramatic red orbs */}
        <div style={{
          position: 'absolute',
          top: '5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: isMobile ? '400px' : '600px',
          height: isMobile ? '400px' : '600px',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 60%)',
          filter: 'blur(100px)',
          animation: 'pulse 4s ease-in-out infinite',
          pointerEvents: 'none'
        }} />

        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4.5rem',
          maxWidth: '800px',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '3.5rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            textShadow: '0 0 40px rgba(220, 38, 38, 0.3)'
          }}>
            Tijd Om Te Beslissen
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(239, 68, 68, 0.7)',
            fontWeight: '300',
            letterSpacing: '0.02em'
          }}>
            Blijf Je Bij Je Momentum Of Val Je Terug?
          </p>
        </div>

        {/* Urgency Box */}
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1.5rem',
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: isMobile ? '3rem' : '4.5rem',
          opacity: urgencyVisible ? 1 : 0,
          transform: urgencyVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {urgencyItems.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid ${item.color}40`,
                  borderRadius: '0',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px ${item.color}10`,
                  opacity: 0.7,
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '0',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${item.color}30`,
                  flexShrink: 0
                }}>
                  <Icon size={20} color={item.color} style={{ opacity: 0.8 }} />
                </div>
                <span style={{
                  fontSize: isMobile ? '0.875rem' : '1rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: '400',
                  whiteSpace: isMobile ? 'normal' : 'nowrap'
                }}>
                  {item.text}
                </span>
              </div>
            )
          })}
        </div>

        {/* Kern Boodschap */}
        <div style={{
          maxWidth: '700px',
          textAlign: 'center',
          marginBottom: isMobile ? '4.5rem' : '6rem',
          opacity: kernVisible ? 1 : 0,
          transform: kernVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.8',
            marginBottom: '2.25rem',
            fontWeight: '300'
          }}>
            Je hebt 8 weken bewezen dat je het kunt. Je hebt momentum. Je hebt resultaten.
          </p>
          
          <p style={{
            fontSize: isMobile ? '1.125rem' : '1.375rem',
            color: '#ef4444',
            fontWeight: '600',
            lineHeight: '1.6',
            marginBottom: '2.25rem',
            filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.3))'
          }}>
            De vraag is: Bouw je hier een lifetime transformatie van? Of laat je het momentum wegglippen?
          </p>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
            fontWeight: '300'
          }}>
            90% valt terug zonder systeem. Jij hoeft geen onderdeel te zijn van die statistiek.
          </p>
        </div>

        {/* "De Keuzemoment" Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          opacity: keuzeTitleVisible ? 1 : 0,
          transform: keuzeTitleVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '400',
            marginBottom: '0.5rem'
          }}>
            De Keuzemoment
          </p>
        </div>

        {/* SPLIT IMAGE COMPONENT */}
        <div style={{
          width: '100%',
          maxWidth: '900px',
          marginBottom: isMobile ? '4.5rem' : '6rem',
          position: 'relative'
        }}>
          {/* Desktop: Side by Side */}
          {!isMobile && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2px',
              height: '450px',
              position: 'relative'
            }}>
              {/* LEFT - Terugval */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                opacity: leftImageVisible ? 1 : 0,
                transform: leftImageVisible ? 'translateX(0)' : 'translateX(-30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${photoUrlLeft})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(100%) brightness(0.5)',
                  position: 'relative'
                }}>
                  {/* Dark overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(107, 114, 128, 0.3)'
                  }} />
                  
                  {/* Label */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    left: '1.5rem',
                    fontSize: '0.85rem',
                    color: 'rgba(107, 114, 128, 0.7)',
                    fontWeight: '600'
                  }}>
                    3 Maanden Later
                  </div>
                  
                  {/* Caption */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '400',
                    textAlign: 'center'
                  }}>
                    Momentum Verloren
                  </div>
                </div>
              </div>

              {/* RIGHT - Doorgang */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                opacity: rightImageVisible ? 1 : 0,
                transform: rightImageVisible ? 'translateX(0)' : 'translateX(30px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${photoUrlRight})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  {/* Rode overlay */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%)',
                    border: '1px solid rgba(220, 38, 38, 0.4)',
                    boxShadow: '0 0 40px rgba(220, 38, 38, 0.2)'
                  }} />
                  
                  {/* Rode accent line */}
                  <div style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: '1.5rem',
                    width: '40px',
                    height: '2px',
                    background: '#dc2626'
                  }} />
                  
                  {/* Label */}
                  <div style={{
                    position: 'absolute',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    fontWeight: '700',
                    filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))'
                  }}>
                    6 Maanden Later
                  </div>
                  
                  {/* Caption */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    color: '#ef4444',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    Systeem Actief
                  </div>
                </div>
              </div>

              {/* VS Badge - Center */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${vsBadgeVisible ? 1 : 0.8}) rotate(${vsBadgeVisible ? '0deg' : '360deg'})`,
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: '#000',
                border: '3px solid #dc2626',
                boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: '900',
                color: '#dc2626',
                letterSpacing: '0.05em',
                opacity: vsBadgeVisible ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10
              }}>
                VS
              </div>
            </div>
          )}

          {/* Mobile: Stacked */}
          {isMobile && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
              position: 'relative'
            }}>
              {/* LEFT - Terugval */}
              <div style={{
                position: 'relative',
                height: '300px',
                overflow: 'hidden',
                opacity: leftImageVisible ? 1 : 0,
                transform: leftImageVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${photoUrlLeft})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'grayscale(100%) brightness(0.5)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    border: '1px solid rgba(107, 114, 128, 0.3)'
                  }} />
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    left: '1rem',
                    fontSize: '0.85rem',
                    color: 'rgba(107, 114, 128, 0.7)',
                    fontWeight: '600'
                  }}>
                    3 Maanden Later
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: '400'
                  }}>
                    Momentum Verloren
                  </div>
                </div>
              </div>

              {/* VS Badge - Between */}
              <div style={{
                position: 'relative',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: '#000',
                  border: '3px solid #dc2626',
                  boxShadow: '0 0 40px rgba(220, 38, 38, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  color: '#dc2626',
                  letterSpacing: '0.05em',
                  transform: `scale(${vsBadgeVisible ? 1 : 0.8}) rotate(${vsBadgeVisible ? '0deg' : '360deg'})`,
                  opacity: vsBadgeVisible ? 1 : 0,
                  transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }}>
                  VS
                </div>
              </div>

              {/* RIGHT - Doorgang */}
              <div style={{
                position: 'relative',
                height: '300px',
                overflow: 'hidden',
                opacity: rightImageVisible ? 1 : 0,
                transform: rightImageVisible ? 'translateY(0)' : 'translateY(20px)',
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundImage: `url(${photoUrlRight})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, transparent 100%)',
                    border: '1px solid rgba(220, 38, 38, 0.4)',
                    boxShadow: '0 0 40px rgba(220, 38, 38, 0.2)'
                  }} />
                  
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    width: '40px',
                    height: '2px',
                    background: '#dc2626'
                  }} />
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                    fontSize: '0.85rem',
                    color: '#ef4444',
                    fontWeight: '700',
                    filter: 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.4))'
                  }}>
                    6 Maanden Later
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    color: '#ef4444',
                    fontWeight: '600'
                  }}>
                    Systeem Actief
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* "Welk Scenario Kies Jij?" */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '3rem' : '4rem',
          maxWidth: '700px',
          opacity: scenarioTextVisible ? 1 : 0,
          transform: scenarioTextVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '1rem'
          }}>
            Welk Scenario Kies Jij?
          </h3>
          
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.1rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontStyle: 'italic',
            fontWeight: '300'
          }}>
            3 maanden na je 8-weken challenge - waar sta jij?
          </p>
        </div>

        {/* 2 Keuze Boxes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: isMobile ? '1.5rem' : '2rem',
          maxWidth: '800px',
          width: '100%',
          marginBottom: isMobile ? '3rem' : '4.5rem',
          opacity: choiceBoxesVisible ? 1 : 0,
          transform: choiceBoxesVisible ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* JA Box */}
          <div
            onMouseEnter={() => setHoveredChoice('yes')}
            onMouseLeave={() => setHoveredChoice(null)}
            onClick={() => setShowCalendlyModal(true)}
            style={{
              background: hoveredChoice === 'yes'
                ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(153, 27, 27, 0.08) 100%)'
                : 'rgba(0, 0, 0, 0.8)',
              border: `2px solid ${hoveredChoice === 'yes' ? '#dc2626' : 'rgba(220, 38, 38, 0.3)'}`,
              borderRadius: '0',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              cursor: 'pointer',
              transform: hoveredChoice === 'yes' ? 'translateY(-8px)' : 'translateY(0)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: hoveredChoice === 'yes'
                ? '0 25px 50px rgba(220, 38, 38, 0.3), 0 0 80px rgba(220, 38, 38, 0.2)'
                : '0 10px 30px rgba(0, 0, 0, 0.5)',
              position: 'relative',
              overflow: 'hidden',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {/* Glow effect */}
            {hoveredChoice === 'yes' && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '150%',
                height: '150%',
                background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 60%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
              }} />
            )}
            
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '1.5rem',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1
            }}>
              JA, Ik Ga Door Till The Goal
            </h3>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              position: 'relative',
              zIndex: 1
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '300'
              }}>
                <ArrowRight size={16} color="#ef4444" />
                Bouw op mijn 8-weken momentum
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '300'
              }}>
                <ArrowRight size={16} color="#ef4444" />
                Win tot €300 terug bij succes
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(255, 255, 255, 0.8)',
                fontWeight: '300'
              }}>
                <ArrowRight size={16} color="#ef4444" />
                Lifetime transformation gegarandeerd
              </li>
            </ul>
          </div>

          {/* NEE Box */}
          <div
            onMouseEnter={() => setHoveredChoice('no')}
            onMouseLeave={() => setHoveredChoice(null)}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              border: '2px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '0',
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 2rem',
              cursor: 'default',
              opacity: hoveredChoice === 'yes' ? 0.4 : 0.7,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              position: 'relative'
            }}
          >
            <h3 style={{
              fontSize: isMobile ? '1.5rem' : '2rem',
              fontWeight: '800',
              color: 'rgba(107, 114, 128, 0.7)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              NEE, Ik Stop Na 8 Weken
            </h3>
            
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(107, 114, 128, 0.6)',
                fontWeight: '300'
              }}>
                <X size={16} color="rgba(107, 114, 128, 0.5)" />
                90% kans op terugval
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(107, 114, 128, 0.6)',
                fontWeight: '300'
              }}>
                <X size={16} color="rgba(107, 114, 128, 0.5)" />
                Momentum verloren
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: isMobile ? '0.9rem' : '1rem',
                color: 'rgba(107, 114, 128, 0.6)',
                fontWeight: '300'
              }}>
                <X size={16} color="rgba(107, 114, 128, 0.5)" />
                Terug naar af binnen 3 maanden
              </li>
            </ul>
            
            <p style={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              color: 'rgba(107, 114, 128, 0.5)',
              fontStyle: 'italic',
              textAlign: 'center',
              marginTop: '1rem',
              fontWeight: '300'
            }}>
              Respecteer je keuze
            </p>
          </div>
        </div>

        {/* PS Bottom text */}
        <div style={{
          textAlign: 'center',
          maxWidth: '600px',
          opacity: psVisible ? 1 : 0,
          transform: psVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1.125rem',
            color: '#ef4444',
            fontWeight: '600',
            fontStyle: 'italic',
            filter: 'drop-shadow(0 0 15px rgba(220, 38, 38, 0.4))'
          }}>
            P.S. Over 6+ maanden ben je óf bij je doel, óf we gaan door tot je wint. Plus: tot €300 terug. Wat heb je écht te verliezen?
          </p>
        </div>

        {/* CSS Animations */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.08; }
            50% { opacity: 0.12; }
          }
        `}</style>
      </section>

      {/* Calendly Modal */}
      <CalendlyModal 
        isOpen={showCalendlyModal}
        onClose={() => setShowCalendlyModal(false)}
        isMobile={isMobile}
      />
    </>
  )
}
