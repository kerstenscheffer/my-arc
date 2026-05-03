// src/funnel/90days/components/Hook.jsx

import { GOLD, pp, goldGloss } from '../colors'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 900 }}>{children}</span>
)

export default function Hook({ isMobile }) {
  return (
    <section style={{
      maxWidth: '580px', margin: '0 auto',
      padding: isMobile ? '2rem 1.25rem' : '2.5rem 2rem',
      borderTop: '1px solid rgba(255,186,9,0.08)',
    }}>
      {/* Pain headline */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        <h2 style={{
          fontFamily: pp,
          fontSize: isMobile ? '1.35rem' : '1.8rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: '0.6rem',
        }}>
          Je lichaam is niet het probleem.
          <br />
          <G>Het systeem is het probleem.</G>
        </h2>
        <p style={{
          fontFamily: pp,
          fontSize: isMobile ? '0.78rem' : '0.88rem',
          fontWeight: 400, lineHeight: 1.75,
          color: 'rgba(255,255,255,0.4)',
        }}>
          Daarom verlies je altijd het gewicht en komt het weer terug.
          <br />
          Wij geven je het systeem dat <span style={{ color: '#fff', fontWeight: 700 }}>wél werkt.</span>
        </p>
      </div>

      {/* Pain points */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.6rem',
        marginBottom: isMobile ? '1.5rem' : '2rem',
      }}>
        {[
          { icon: '❌', text: 'Te veel tegenstrijdige info — je weet niet waar je moet beginnen' },
          { icon: '❌', text: '3x geprobeerd, 3x gestopt na 4 weken — geen systeem, geen resultaat' },
          { icon: '❌', text: 'Twijfel in de gym — welke oefeningen? Hoeveel sets? Doe ik het goed?' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
            padding: isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
            <span style={{
              fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem',
              fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55,
            }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Promise: What you get */}
      <div style={{
        border: '1.5px solid rgba(255,186,9,0.15)',
        borderRadius: '16px',
        padding: isMobile ? '1.25rem 1rem' : '1.5rem 1.25rem',
        background: 'rgba(255,186,9,0.03)',
      }}>
        <div style={{
          fontFamily: pp, fontSize: isMobile ? '0.5rem' : '0.55rem',
          fontWeight: 700, color: GOLD, textTransform: 'uppercase',
          letterSpacing: '0.12em', marginBottom: '0.75rem',
          textAlign: 'center',
        }}>Wat jij krijgt</div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '0.4rem',
        }}>
          {[
            'Maaltijdplan 100% op maat — berekend op jouw lichaam',
            'Trainingsschema met progressie — geen giswerk meer',
            '6 coaching calls — accountability die werkt',
            'Wekelijkse check-ins — bijsturen wanneer nodig',
            '60 dagen gratis nazorg — resultaat vasthouden',
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span style={{
                fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.82rem',
                fontWeight: 500, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
              }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        gap: isMobile ? '1rem' : '1.5rem',
        marginTop: isMobile ? '1.25rem' : '1.5rem',
        flexWrap: 'wrap',
      }}>
        {[
          { stat: '5-15kg', label: 'in 90 dagen' },
          { stat: '100%', label: 'geld-terug garantie' },
          { stat: '6', label: 'coaching calls' },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div className="ss-gold-gloss" style={{
              fontFamily: pp, fontSize: isMobile ? '1.4rem' : '1.7rem',
              fontWeight: 900, lineHeight: 1,
            }}>{item.stat}</div>
            <div style={{
              fontFamily: pp, fontSize: isMobile ? '0.48rem' : '0.52rem',
              fontWeight: 600, color: 'rgba(255,255,255,0.25)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginTop: '0.25rem',
            }}>{item.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
