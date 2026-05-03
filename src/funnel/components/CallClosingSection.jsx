// src/funnel/components/CallClosingSection.jsx
import { useState } from 'react'
import { Calendar, MessageCircle, Check, ChevronRight } from 'lucide-react'

export default function CallClosingSection({ 
  isMobile,
  setCalendlyOpen // Function to open Calendly modal
}) {
  const [callPlanned, setCallPlanned] = useState(false)
  const [whatsappSent, setWhatsappSent] = useState(false)

  return (
    <section 
      id="section-5"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)',
        padding: isMobile ? '3rem 1rem' : '4rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div style={{
        maxWidth: '900px',
        width: '100%'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '2.5rem' : '3rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '2rem' : '2.75rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #ffba09 0%, #d4a006 35%, #8b6804 65%, #402400 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '1rem',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            🎉 Laten We Samen Een Succes Van Maken!
          </h2>
          
          <p style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.6,
            maxWidth: '700px',
            margin: '0 auto',
            fontWeight: '500'
          }}>
            Tijd om in actie te komen. We plannen nu direct je eerste call in en zetten alles klaar.
          </p>
        </div>

        {/* STAP 1: CALL PLANNING */}
        <div style={{
          marginBottom: isMobile ? '1.5rem' : '2rem',
          position: 'relative'
        }}>
          {/* Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: callPlanned 
              ? '1px solid rgba(16, 185, 129, 0.4)' 
              : '1px solid rgba(255, 186, 9, 0.3)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: callPlanned
              ? '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              : '0 4px 16px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: callPlanned
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
              opacity: 0.6,
              zIndex: 2
            }} />

            {/* Shine overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Step number */}
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: callPlanned ? '#10b981' : '#ffba09',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {callPlanned ? (
                  <>
                    <Check size={16} />
                    STAP 1 VOLTOOID
                  </>
                ) : (
                  'STAP 1'
                )}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.75rem',
                lineHeight: 1.3
              }}>
                Plan Je Kickoff Call
              </h3>

              {/* Description */}
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                fontWeight: '500'
              }}>
                <strong style={{ color: '#fff' }}>Script:</strong><br />
                <em style={{ color: 'rgba(255, 186, 9, 0.9)' }}>
                  "Oké, laten we dan alvast de eerste call inplannen zodat we direct aan de slag kunnen. Wanneer zou je kunnen beginnen - deze week al of volgende week?"
                </em>
              </p>

              {/* Call planning button */}
              <button
                onClick={() => {
                  setCalendlyOpen(true)
                  setCallPlanned(true)
                }}
                disabled={callPlanned}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: callPlanned
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'linear-gradient(135deg, rgba(255, 186, 9, 0.1) 0%, rgba(212, 160, 6, 0.05) 100%)',
                  border: callPlanned
                    ? '2px solid rgba(16, 185, 129, 0.4)'
                    : '2px solid rgba(255, 186, 9, 0.4)',
                  borderRadius: '16px',
                  color: callPlanned ? '#10b981' : '#ffba09',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '700',
                  cursor: callPlanned ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  opacity: callPlanned ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!callPlanned) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 186, 9, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!callPlanned) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.1) 0%, rgba(212, 160, 6, 0.05) 100%)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile && !callPlanned) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile && !callPlanned) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <Calendar size={isMobile ? 20 : 22} strokeWidth={2.5} />
                {callPlanned ? 'Call Gepland ✓' : 'Open Kalender'}
                {!callPlanned && <ChevronRight size={20} />}
              </button>

              {/* Success message */}
              {callPlanned && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: '#10b981',
                  fontWeight: '600',
                  animation: 'fadeIn 0.5s ease'
                }}>
                  ✓ Perfect! Call staat ingepland. Client krijgt bevestiging via email.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STAP 2: WHATSAPP NUMMER */}
        <div style={{
          marginBottom: isMobile ? '1.5rem' : '2rem',
          position: 'relative',
          opacity: callPlanned ? 1 : 0.5,
          pointerEvents: callPlanned ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}>
          {/* Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: whatsappSent
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : '1px solid rgba(255, 186, 9, 0.3)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: whatsappSent
              ? '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
              : '0 4px 16px rgba(255, 186, 9, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease'
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: whatsappSent
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #ffba09 0%, #d4a006 100%)',
              opacity: 0.6,
              zIndex: 2
            }} />

            {/* Shine overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Step number */}
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: whatsappSent ? '#10b981' : '#ffba09',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                {whatsappSent ? (
                  <>
                    <Check size={16} />
                    STAP 2 VOLTOOID
                  </>
                ) : (
                  'STAP 2'
                )}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.75rem',
                lineHeight: 1.3
              }}>
                WhatsApp Nummer
              </h3>

              {/* Description */}
              <p style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                color: 'rgba(255, 255, 255, 0.7)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
                fontWeight: '500'
              }}>
                <strong style={{ color: '#fff' }}>Script:</strong><br />
                <em style={{ color: 'rgba(255, 186, 9, 0.9)' }}>
                  "Top! Call staat ingepland. Heb je een telefoonnummer voor mij zodat ik je gelijk twee linkjes kan sturen via WhatsApp?"
                </em>
              </p>

              {/* Note area */}
              <div style={{
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 186, 9, 0.2)',
                borderRadius: '12px',
                marginBottom: '1rem'
              }}>
                <div style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  📝 Noteer nummer:
                </div>
                <div style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  color: '#ffba09',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  letterSpacing: '0.05em'
                }}>
                  06 - __ __ __ __ __ __ __
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => setWhatsappSent(true)}
                disabled={whatsappSent}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: whatsappSent
                    ? 'rgba(16, 185, 129, 0.15)'
                    : 'linear-gradient(135deg, rgba(255, 186, 9, 0.1) 0%, rgba(212, 160, 6, 0.05) 100%)',
                  border: whatsappSent
                    ? '2px solid rgba(16, 185, 129, 0.4)'
                    : '2px solid rgba(255, 186, 9, 0.4)',
                  borderRadius: '16px',
                  color: whatsappSent ? '#10b981' : '#ffba09',
                  fontSize: isMobile ? '1rem' : '1.125rem',
                  fontWeight: '700',
                  cursor: whatsappSent ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  opacity: whatsappSent ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!whatsappSent) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 186, 9, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!whatsappSent) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.1) 0%, rgba(212, 160, 6, 0.05) 100%)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile && !whatsappSent) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile && !whatsappSent) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <MessageCircle size={isMobile ? 20 : 22} strokeWidth={2.5} />
                {whatsappSent ? 'Nummer Genoteerd ✓' : 'Nummer Genoteerd'}
                {!whatsappSent && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* STAP 3: AFSLUITING */}
        <div style={{
          opacity: whatsappSent ? 1 : 0.5,
          pointerEvents: whatsappSent ? 'auto' : 'none',
          transition: 'opacity 0.3s ease'
        }}>
          {/* Card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: isMobile ? '1.5rem' : '2rem',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top accent line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              opacity: 0.6,
              zIndex: 2
            }} />

            {/* Shine overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 1
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* Step number */}
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: '#10b981',
                fontWeight: '700',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Check size={16} />
                STAP 3 - AFRONDEN
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '800',
                color: '#fff',
                marginBottom: '0.75rem',
                lineHeight: 1.3
              }}>
                Bevestig & Verstuur
              </h3>

              {/* Script box */}
              <div style={{
                padding: isMobile ? '1.25rem' : '1.5rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1.05rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: 1.7,
                  margin: 0,
                  fontWeight: '500'
                }}>
                  <strong style={{ color: '#10b981' }}>Closing Script:</strong><br /><br />
                  <em style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    "Perfect! Ik stuur dan zo <strong>twee linkjes</strong>:<br /><br />
                    
                    1️⃣ <strong>Invulformulier</strong> - Wat gegevens zodat ik direct bezig kan met de eerste call voorbereiden<br />
                    2️⃣ <strong>Betaallink</strong> - Zodat dat ook gelijk goed zit<br /><br />
                    
                    Heb je misschien nog <strong>vragen</strong> over iets waar ik meer over uit moet leggen?"<br /><br />
                    
                    [Client: Nee]<br /><br />
                    
                    "Super! Dan ga ik aan de bak en we gaan zorgen dat jij over <strong>6 maanden 5-8 kilo spier</strong> opbouwt. Ik spreek jou dan op [DATUM/TIJD]!"
                  </em>
                </p>
              </div>

              {/* Checklist */}
              <div style={{
                display: 'grid',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                {[
                  { icon: '📅', text: 'Call gepland in kalender' },
                  { icon: '📱', text: 'WhatsApp nummer genoteerd' },
                  { icon: '💳', text: 'Betaallink versturen' },
                  { icon: '📋', text: 'Onboarding link versturen' },
                  { icon: '🎯', text: 'Plan gaan maken' }
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: isMobile ? '0.75rem' : '1rem',
                      background: 'rgba(16, 185, 129, 0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0
                    }}>
                      {item.icon}
                    </div>
                    <span style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: '600'
                    }}>
                      {item.text}
                    </span>
                    <Check 
                      size={18} 
                      style={{
                        color: '#10b981',
                        marginLeft: 'auto',
                        flexShrink: 0
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Completion message - Simple */}
              <div style={{
                marginTop: isMobile ? '1.5rem' : '2rem',
                padding: isMobile ? '1rem' : '1.25rem',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  color: '#10b981',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  ✓ Call afgerond • Linkjes versturen • Client is aan boord
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CLIENT BESLISSING - JA of TWIJFEL */}
        <div style={{
          marginTop: isMobile ? '2.5rem' : '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {/* Instruction text */}
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            🎯 Wat zegt de client?
          </p>

          {/* JA Button → Section 6 */}
          <button
            onClick={() => {
              const section6 = document.getElementById('section-6')
              if (section6) section6.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              width: '100%',
              padding: isMobile ? '1.25rem' : '1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              color: '#fff',
              fontSize: isMobile ? '1.1rem' : '1.25rem',
              fontWeight: '800',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>✅ JA, IK WIL BEGINNEN!</span>
            <ChevronRight size={isMobile ? 22 : 24} style={{ position: 'relative', zIndex: 1 }} />
          </button>

          {/* TWIJFEL Button → Section 7 */}
          <button
            onClick={() => {
              const section7 = document.getElementById('section-7')
              if (section7) section7.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            style={{
              width: '100%',
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)',
              border: '1px solid rgba(255, 186, 9, 0.3)',
              borderRadius: '12px',
              color: '#ffba09',
              fontSize: isMobile ? '0.95rem' : '1.05rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(255, 186, 9, 0.15)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.2) 0%, rgba(212, 160, 6, 0.12) 100%)'
              e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.5)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 186, 9, 0.15) 0%, rgba(212, 160, 6, 0.08) 100%)'
              e.currentTarget.style.borderColor = 'rgba(255, 186, 9, 0.3)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.98)'
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            💭 Ik twijfel nog even...
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  )
}
