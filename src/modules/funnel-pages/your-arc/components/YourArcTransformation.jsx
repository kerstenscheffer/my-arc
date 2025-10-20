import React, { useState, useEffect } from 'react'
import { ChevronRight, Award, Camera, User } from 'lucide-react'

export default function YourArcTransformation({ onScrollNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [imageLoaded, setImageLoaded] = useState({ before: false, after: false })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    
    const timer = setTimeout(() => setIsVisible(true), 100)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timer)
    }
  }, [])

  return (
    <section 
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        position: 'relative',
        padding: isMobile ? '3rem 1rem' : '5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Floating orbs - Green */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '-15%',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 30s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        maxWidth: '800px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3.5rem',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          filter: 'drop-shadow(0 2px 20px rgba(16, 185, 129, 0.3))'
        }}>
          Dit Kan Jouw 8 Weken Transformatie Zijn
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(16, 185, 129, 0.7)',
          fontWeight: '300',
          letterSpacing: '0.02em'
        }}>
          Mijn 8 weken persoonlijke transformatie
        </p>
      </div>

      {/* Kersten's Transformation Card */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(16, 185, 129, 0.03) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.2)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '1.5rem' : '2rem',
          position: 'relative',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 20px 50px rgba(16, 185, 129, 0.15)'
        }}>
          {/* 8 Weken Badge */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '0.5rem 1.5rem',
            borderRadius: '100px',
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: '800',
            color: '#fff',
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Award size={18} />
            8 WEKEN
          </div>

          {/* Before/After Images - ALWAYS SIDE BY SIDE */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '2rem',
            marginTop: '2rem',
            marginBottom: '2rem',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            {/* Before */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(16, 185, 129, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Voor
              </div>
              <div style={{
                position: 'relative',
                borderRadius: isMobile ? '12px' : '16px',
                overflow: 'hidden',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.1)',
                aspectRatio: '3/4'
              }}>
                <img 
                  src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/WhatsApp_Image_2025-09-15_at_10.43.13.jpg?v=1757925858"
                  alt="Voor transformatie"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, before: true }))}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: imageLoaded.before ? 1 : 0,
                    transition: 'opacity 0.5s ease'
                  }}
                />
                {!imageLoaded.before && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(16, 185, 129, 0.3)',
                    fontSize: isMobile ? '0.75rem' : '1rem'
                  }}>
                    Loading...
                  </div>
                )}
              </div>
            </div>

            {/* Arrow - Horizontal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '0 0.25rem' : '0 1rem',
              flexShrink: 0
            }}>
              <ChevronRight 
                size={isMobile ? 24 : 48} 
                color="#10b981"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
            </div>

            {/* After */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(16, 185, 129, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Na
              </div>
              <div style={{
                position: 'relative',
                borderRadius: isMobile ? '12px' : '16px',
                overflow: 'hidden',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                aspectRatio: '3/4',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)'
              }}>
                <img 
                  src="https://cdn.shopify.com/s/files/1/0862/1237/8954/files/WhatsApp_Image_2025-09-15_at_10.43.18.jpg?v=1757925859"
                  alt="Na transformatie"
                  onLoad={() => setImageLoaded(prev => ({ ...prev, after: true }))}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: imageLoaded.after ? 1 : 0,
                    transition: 'opacity 0.5s ease'
                  }}
                />
                {!imageLoaded.after && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'rgba(16, 185, 129, 0.3)',
                    fontSize: isMobile ? '0.75rem' : '1rem'
                  }}>
                    Loading...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quote */}
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '1.5rem 1rem' : '2rem',
            borderTop: '1px solid rgba(16, 185, 129, 0.1)'
          }}>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontStyle: 'italic',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              "Er is meer mogelijk dan je denkt met een strak plan en groot doel voor ogen"
            </p>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: '#10b981',
              fontWeight: '700',
              letterSpacing: '0.05em'
            }}>
              - Kersten
            </p>
          </div>
        </div>
      </div>

      {/* WORD JIJ DE VOLGENDE - REDESIGNED */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(16, 185, 129, 0.04) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.25)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(16, 185, 129, 0.2)'
        }}>
          {/* Animated glow background */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
            animation: 'glow 4s ease-in-out infinite'
          }} />

          {/* Title */}
          <h3 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1,
            letterSpacing: '-0.02em',
            filter: 'drop-shadow(0 2px 15px rgba(16, 185, 129, 0.4))'
          }}>
            Word Jij De Volgende?
          </h3>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(16, 185, 129, 0.7)',
            marginBottom: '2rem',
            textAlign: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            Jouw transformatie begint vandaag
          </p>

          {/* Before/After Placeholders - ALWAYS SIDE BY SIDE */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '2rem',
            marginBottom: '2rem',
            flexDirection: 'row',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            {/* Your Before */}
            <div style={{
              flex: 1,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(16, 185, 129, 0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Jouw Start
              </div>
              <div style={{
                position: 'relative',
                borderRadius: isMobile ? '12px' : '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(0, 0, 0, 0.9) 100%)',
                border: '2px dashed rgba(16, 185, 129, 0.2)',
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px dashed rgba(16, 185, 129, 0.4)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px dashed rgba(16, 185, 129, 0.2)'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
                <User size={isMobile ? 40 : 60} color="rgba(16, 185, 129, 0.3)" />
                <Camera size={isMobile ? 20 : 24} color="rgba(16, 185, 129, 0.4)" style={{ marginTop: '0.5rem' }} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(16, 185, 129, 0.4)',
                  marginTop: '0.5rem',
                  fontWeight: '500'
                }}>
                  Dag 1
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '0' : '0 1rem',
              flexShrink: 0
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ChevronRight 
                  size={isMobile ? 28 : 40} 
                  color="#10b981"
                  style={{
                    filter: 'drop-shadow(0 0 25px rgba(16, 185, 129, 0.6))',
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.625rem' : '0.75rem',
                  color: 'rgba(16, 185, 129, 0.6)',
                  fontWeight: '700',
                  letterSpacing: '0.1em'
                }}>
                  8 WEKEN
                </span>
              </div>
            </div>

            {/* Your After */}
            <div style={{
              flex: 1,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(16, 185, 129, 0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Jouw Resultaat
              </div>
              <div style={{
                position: 'relative',
                borderRadius: isMobile ? '12px' : '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
                border: '2px solid rgba(16, 185, 129, 0.4)',
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 15px 40px rgba(16, 185, 129, 0.15)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '2px solid rgba(16, 185, 129, 0.6)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '2px solid rgba(16, 185, 129, 0.4)'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
                {/* Shimmer effect */}
                <div style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 30%, rgba(16, 185, 129, 0.1) 50%, transparent 70%)',
                  animation: 'shimmer 3s infinite'
                }} />
                
                <Award size={isMobile ? 40 : 60} color="rgba(16, 185, 129, 0.5)" />
                <span style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginTop: '0.5rem'
                }}>
                  KLAAR
                </span>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(16, 185, 129, 0.6)',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>
                  Dag 56
                </span>
              </div>
            </div>
          </div>

          {/* Inspirational Quote */}
          <div style={{
            textAlign: 'center',
            padding: isMobile ? '1.5rem 1rem 0' : '2rem 2rem 0',
            borderTop: '1px solid rgba(16, 185, 129, 0.15)',
            position: 'relative',
            zIndex: 1
          }}>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.375rem',
              color: 'rgba(255, 255, 255, 0.95)',
              fontStyle: 'italic',
              lineHeight: '1.6',
              marginBottom: '0.5rem',
              fontWeight: '300'
            }}>
              "Start vandaag, en over 8 weken kijk je terug met trots op wat je hebt bereikt"
            </p>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: 'rgba(16, 185, 129, 0.8)',
              fontWeight: '600',
              letterSpacing: '0.05em'
            }}>
              Jouw toekomst begint NU
            </p>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.04; }
          50% { transform: translateY(-30px) scale(1.05); opacity: 0.06; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes glow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.6; transform: translate(-50%, -50%) scale(1.2); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }
      `}</style>
    </section>
  )
}
