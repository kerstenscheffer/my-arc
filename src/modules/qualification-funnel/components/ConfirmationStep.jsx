// src/modules/qualification-funnel/components/ConfirmationStep.jsx
import { Check, Mail, Clock, MessageSquare } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

export default function ConfirmationStep({ isMobile }) {
  return (
    <div style={commonStyles.container(isMobile)}>
      
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '300px' : '500px',
        height: isMobile ? '300px' : '500px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Success icon */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          background: 'rgba(212, 175, 55, 0.15)',
          border: `2px solid ${funnelTheme.gold}`,
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          marginBottom: isMobile ? '2rem' : '2.5rem',
          boxShadow: funnelTheme.glowGold
        }}>
          <Check 
            size={isMobile ? 40 : 50} 
            color={funnelTheme.gold} 
            strokeWidth={2.5}
          />
        </div>
        
        {/* Gold line */}
        <div style={{
          ...commonStyles.goldLine,
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }} />
        
        {/* Headline */}
        <h1 style={{
          fontSize: isMobile ? '2rem' : '2.75rem',
          fontWeight: '800',
          color: funnelTheme.textPrimary,
          marginBottom: isMobile ? '0.75rem' : '1rem',
          lineHeight: '1.1',
          letterSpacing: '-0.03em'
        }}>
          Je call staat{' '}
          <span style={commonStyles.goldText}>
            ingepland.
          </span>
        </h1>
        
        {/* Subtext */}
        <p style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          color: funnelTheme.textSecondary,
          lineHeight: '1.5',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          Check je mail voor de details.<br />
          Bereid je voor: ik ga je vragen stellen.
        </p>
        
        {/* What happens next */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${funnelTheme.borderSubtle}`,
          padding: isMobile ? '1.5rem' : '2rem',
          textAlign: 'left',
          marginBottom: isMobile ? '2rem' : '2.5rem'
        }}>
          {/* Gold accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '3px',
            height: '100%',
            background: funnelTheme.goldGradient
          }} />
          
          <h3 style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: funnelTheme.gold,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700'
          }}>
            Wat nu?
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '1.25rem'
          }}>
            {/* Step 1 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: `1px solid ${funnelTheme.borderGold}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Mail size={16} color={funnelTheme.gold} />
              </div>
              <div>
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  color: funnelTheme.textPrimary,
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Check je inbox
                </p>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: funnelTheme.textMuted,
                  margin: 0
                }}>
                  Je ontvangt een bevestiging met de video link
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Clock size={16} color={funnelTheme.textMuted} />
              </div>
              <div>
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  color: funnelTheme.textPrimary,
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Wees op tijd
                </p>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: funnelTheme.textMuted,
                  margin: 0
                }}>
                  Login 5 minuten voor de afgesproken tijd
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${funnelTheme.borderSubtle}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MessageSquare size={16} color={funnelTheme.textMuted} />
              </div>
              <div>
                <p style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  color: funnelTheme.textPrimary,
                  fontWeight: '600',
                  margin: '0 0 0.25rem 0'
                }}>
                  Wees eerlijk
                </p>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: funnelTheme.textMuted,
                  margin: 0
                }}>
                  Ik ga je vragen stellen. Hoe eerlijker, hoe beter ik kan helpen
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Final message */}
        <p style={{
          fontSize: isMobile ? '0.9rem' : '0.95rem',
          color: funnelTheme.textMuted,
          fontStyle: 'italic',
          marginBottom: 0
        }}>
          "De eerste stap is altijd het moeilijkst.<br />
          Die heb je net gezet."
        </p>
        
        {/* Gold line */}
        <div style={{
          ...commonStyles.goldLine,
          marginTop: isMobile ? '2rem' : '2.5rem',
          width: '40px'
        }} />
      </div>
    </div>
  )
}
