import { useState } from 'react'
import { Calculator, Euro, Users, TrendingUp, Minus, Plus } from 'lucide-react'

export default function EarningsCalculator({ isMobile, onOpenCalendly }) {
  const [clients, setClients] = useState(5)
  const [hoveredBar, setHoveredBar] = useState(null)
  
  // Bereken commissies
  const firstMonth = clients * 100
  const secondMonth = clients * 100
  const total = firstMonth + secondMonth
  const monthly = total / 2
  const yearly = monthly * 12

  const handleSliderChange = (e) => {
    setClients(parseInt(e.target.value))
  }

  const adjustClients = (amount) => {
    const newValue = Math.max(1, Math.min(50, clients + amount))
    setClients(newValue)
  }

  return (
    <section style={{
      minHeight: isMobile ? '100vh' : '90vh',
      padding: isMobile ? '3rem 1rem' : '5rem 2rem',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)'
    }}>
      {/* Gouden mist effect */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(255, 215, 0, 0.06) 0%, transparent 70%)',
        filter: 'blur(80px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Content container */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Section label */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(212, 175, 55, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
          }}>
            Reken Het Uit
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: isMobile ? '2rem' : '3rem',
          fontWeight: '800',
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          lineHeight: '1.1'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.3))'
          }}>
            Jouw Potentiële Inkomsten
          </span>
          <br />
          <span style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            Als MY ARC Partner
          </span>
        </h2>

        {/* Calculator Container */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 215, 0, 0.02) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: isMobile ? '20px' : '24px',
          padding: isMobile ? '2rem 1.5rem' : '3rem',
          marginBottom: '3rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.1)'
        }}>
          {/* Client input section */}
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '1rem'
            }}>
              Hoeveel klanten ga jij helpen?
            </div>
            
            {/* Number display with controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => adjustClients(-1)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)'
                }}
              >
                <Minus size={20} color="#D4AF37" />
              </button>
              
              <div style={{
                fontSize: isMobile ? '3rem' : '4rem',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                minWidth: '120px',
                filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))'
              }}>
                {clients}
              </div>
              
              <button
                onClick={() => adjustClients(1)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(0, 0, 0, 0.5) 100%)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 100%)'
                }}
              >
                <Plus size={20} color="#D4AF37" />
              </button>
            </div>

            {/* Slider */}
            <div style={{
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <input
                type="range"
                min="1"
                max="50"
                value={clients}
                onChange={handleSliderChange}
                style={{
                  width: '100%',
                  height: '8px',
                  background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${(clients/50)*100}%, rgba(255, 215, 0, 0.1) ${(clients/50)*100}%, rgba(255, 215, 0, 0.1) 100%)`,
                  borderRadius: '10px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer'
                }}
              />
              <style>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
                  cursor: pointer;
                  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #FFD700 0%, #D4AF37 100%);
                  cursor: pointer;
                  box-shadow: 0 4px 10px rgba(255, 215, 0, 0.3);
                }
              `}</style>
            </div>
          </div>

          {/* Results Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '1.5rem',
            marginTop: '2rem'
          }}>
            {/* Maand 1 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                Na 28 dagen
              </div>
              <div style={{
                fontSize: isMobile ? '1.75rem' : '2rem',
                fontWeight: '800',
                color: '#FFD700'
              }}>
                €{firstMonth.toLocaleString('nl-NL')}
              </div>
            </div>

            {/* Maand 2 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem',
                textTransform: 'uppercase'
              }}>
                Na 2 maanden
              </div>
              <div style={{
                fontSize: isMobile ? '1.75rem' : '2rem',
                fontWeight: '800',
                color: '#FFD700'
              }}>
                +€{secondMonth.toLocaleString('nl-NL')}
              </div>
            </div>
          </div>

          {/* Total earnings highlight */}
          <div style={{
            marginTop: '2rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(212, 175, 55, 0.05) 100%)',
            borderRadius: '16px',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            textAlign: 'center',
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.1)'
          }}>
            <div style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.5rem'
            }}>
              Totaal per {clients} {clients === 1 ? 'klant' : 'klanten'}
            </div>
            <div style={{
              fontSize: isMobile ? '2.5rem' : '3.5rem',
              fontWeight: '900',
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 20px rgba(255, 215, 0, 0.3))',
              marginBottom: '1rem'
            }}>
              €{total.toLocaleString('nl-NL')}
            </div>
            <div style={{
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              = €{yearly.toLocaleString('nl-NL')} per jaar
            </div>
          </div>
        </div>

        {/* Visual bars */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          {[
            { label: '5 klanten', value: 1000, yearly: 6000 },
            { label: '10 klanten', value: 2000, yearly: 12000 },
            { label: '20 klanten', value: 4000, yearly: 24000 }
          ].map((item, index) => (
            <div
              key={index}
              style={{
                padding: '1.25rem',
                background: hoveredBar === index
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(0, 0, 0, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 0, 0, 0.9) 0%, rgba(255, 215, 0, 0.02) 100%)',
                border: '1px solid rgba(255, 215, 0, 0.12)',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
              onClick={() => setClients(parseInt(item.label))}
            >
              <div style={{
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem'
              }}>
                {item.label}
              </div>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                color: '#FFD700',
                marginBottom: '0.25rem'
              }}>
                €{item.value}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                €{item.yearly}/jaar
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onOpenCalendly}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none',
              borderRadius: '16px',
              padding: isMobile ? '1.25rem 2.5rem' : '1.5rem 3.5rem',
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#000',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 30px rgba(255, 215, 0, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 215, 0, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255, 215, 0, 0.3)'
            }}
          >
            Ik Wil €{total} Verdienen
          </button>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </section>
  )
}
