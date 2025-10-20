import { useState, useEffect } from 'react'
import { ChevronRight, Award, Camera, User } from 'lucide-react'

export default function TransformationSection({ isMobile, onScrollNext, isCurrentSection }) {
  const [showContent, setShowContent] = useState(false)
  const [imageLoaded, setImageLoaded] = useState({ before: false, after: false })

  useEffect(() => {
    if (isCurrentSection) {
      setTimeout(() => setShowContent(true), 300)
    }
  }, [isCurrentSection])

  return (
    <section style={{
      minHeight: '100vh',
      background: '#000',
      position: 'relative',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: isMobile ? '2rem' : '3rem',
        maxWidth: '800px',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 1s ease'
      }}>
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '1rem',
          letterSpacing: '-0.02em',
          lineHeight: '1.1'
        }}>
          Dit Kan Jouw 8 Weken Transformatie Zijn
        </h2>
        
        <p style={{
          fontSize: isMobile ? '1rem' : '1.25rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontWeight: '300'
        }}>
          Kersten's eigen transformatie
        </p>
      </div>

      {/* Transformation Card */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 1s ease 0.3s'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '0',
          padding: isMobile ? '1.5rem' : '2rem',
          position: 'relative'
        }}>
          
          {/* 8 Weken Badge */}
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            color: '#000',
            padding: isMobile ? '0.5rem 1rem' : '0.5rem 1.5rem',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            fontWeight: '800',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Award size={isMobile ? 16 : 18} />
            8 WEKEN
          </div>

          {/* Before/After Images - ALTIJD NAAST ELKAAR */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.5rem' : '2rem',
            marginTop: '2rem',
            marginBottom: '2rem',
            flexDirection: 'row', // ALTIJD row, ook op mobile
            alignItems: 'center'
          }}>
            
            {/* Before */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto' // Zorg voor minimum breedte
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Voor
              </div>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
                  }}>
                    Loading...
                  </div>
                )}
              </div>
            </div>

            {/* Arrow - Horizontaal blijven */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: isMobile ? '0 0.25rem' : '0 1rem',
              flexShrink: 0
            }}>
              <ChevronRight 
                size={isMobile ? 24 : 48} 
                color="rgba(255, 255, 255, 0.4)"
                style={{
                  transition: 'all 0.3s ease'
                }}
              />
            </div>

            {/* After */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto' // Zelfde minimum breedte
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Na
              </div>
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                aspectRatio: '3/4'
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
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: isMobile ? '0.75rem' : '0.9rem'
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
            padding: isMobile ? '1.5rem 0' : '2rem 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <p style={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontStyle: 'italic',
              lineHeight: '1.6',
              marginBottom: '1rem'
            }}>
              "Er is meer mogelijk dan je denkt met een strak plan en groot doel voor ogen"
            </p>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '500',
              letterSpacing: '0.05em'
            }}>
              - Kersten
            </p>
          </div>
        </div>
      </div>

      {/* Word Jij De Volgende - REDESIGNED */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        marginBottom: isMobile ? '3rem' : '4rem',
        opacity: showContent ? 1 : 0,
        transform: showContent ? 'scale(1)' : 'scale(0.95)',
        transition: 'all 1s ease 0.6s'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          position: 'relative'
        }}>
          
          {/* Title */}
          <h3 style={{
            fontSize: isMobile ? '2rem' : '3rem',
            fontWeight: '800',
            color: '#fff',
            marginBottom: '0.5rem',
            textAlign: 'center',
            letterSpacing: '-0.02em'
          }}>
            Word Jij De Volgende?
          </h3>

          <p style={{
            fontSize: isMobile ? '1rem' : '1.25rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Jouw transformatie begint vandaag
          </p>

          {/* Before/After Placeholders - OOK NAAST ELKAAR */}
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.75rem' : '2rem',
            marginBottom: '2rem',
            flexDirection: 'row', // ALTIJD row
            alignItems: 'center'
          }}>
            
            {/* Your Before */}
            <div style={{
              flex: 1,
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Jouw Start
              </div>
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed rgba(255, 255, 255, 0.2)',
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px dashed rgba(255, 255, 255, 0.4)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px dashed rgba(255, 255, 255, 0.2)'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
                <User size={isMobile ? 40 : 60} color="rgba(255, 255, 255, 0.2)" />
                <Camera size={isMobile ? 20 : 24} color="rgba(255, 255, 255, 0.3)" style={{ marginTop: '0.5rem' }} />
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.3)',
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
              padding: isMobile ? '0 0.25rem' : '0 1rem',
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
                  color="rgba(255, 255, 255, 0.6)"
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                />
                <span style={{
                  fontSize: isMobile ? '0.625rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)',
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
              textAlign: 'center',
              minWidth: isMobile ? '140px' : 'auto'
            }}>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: isMobile ? '0.5rem' : '1rem',
                fontWeight: '600'
              }}>
                Jouw Resultaat
              </div>
              <div style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.5)'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.3)'
                e.currentTarget.style.transform = 'scale(1)'
              }}>
                
                <Award size={isMobile ? 40 : 60} color="rgba(255, 255, 255, 0.4)" />
                <span style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '900',
                  color: '#fff',
                  marginTop: '0.5rem'
                }}>
                  KLAAR
                </span>
                <span style={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                  color: 'rgba(255, 255, 255, 0.5)',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <p style={{
              fontSize: isMobile ? '1.125rem' : '1.375rem',
              color: 'rgba(255, 255, 255, 0.8)',
              fontStyle: 'italic',
              lineHeight: '1.6',
              marginBottom: '0.5rem',
              fontWeight: '300'
            }}>
              "Start vandaag, en over 8 weken kijk je terug met trots op wat je hebt bereikt"
            </p>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              letterSpacing: '0.05em'
            }}>
              Jouw toekomst begint NU
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center',
        opacity: showContent ? 1 : 0,
        transition: 'opacity 1s ease 0.8s'
      }}>
        <button
          onClick={onScrollNext}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            padding: isMobile ? '1rem 2.5rem' : '1.25rem 3rem',
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.9)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
            e.currentTarget.style.background = 'transparent'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          Zie wat je krijgt
        </button>
      </div>
    </section>
  )
}
