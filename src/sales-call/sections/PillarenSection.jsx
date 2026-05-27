// src/sales-call/sections/PillarenSection.jsx
// Dark section — 5 pillars with photos, compact effort-killer text
import {
  UtensilsCrossed,
  Dumbbell,
  Target,
  BarChart3,
  Moon
} from 'lucide-react'

const GOLD = '#ffba09'
const GOLD_DARK = '#e8a800'

const PILLARS = [
  {
    icon: UtensilsCrossed,
    label: 'Voeding',
    image: 'https://i.ibb.co/fVBpKfsJ/7.png',
    title: 'Flexibel Leren Eten',
    text: 'Open de app en je weet wat je kan eten, hoe je het maakt en **lekkere opties**. Ook als je uit eten gaat.'
  },
  {
    icon: Dumbbell,
    label: 'Training',
    image: 'https://i.ibb.co/6Rmd50GW/5.png',
    title: 'Fitter Worden Op Jouw Tempo',
    text: 'Training die bij je past en in lijn met jouw doelen. Om je blessures heen, van welk punt dan ook bouwen we op, **op jouw tempo**.'
  },
  {
    icon: Target,
    label: 'Coaching',
    image: 'https://i.ibb.co/3y8zGSYt/9.png',
    title: 'Altijd Iemand Die Meekijkt',
    text: 'Ik kijk mee, stuur bij, grijp in en leg uit. Via app, call of bericht, wanneer het jou past. **24/7 bereikbaar** voor vragen.'
  },
  {
    icon: BarChart3,
    label: 'Tracking',
    image: 'https://i.ibb.co/dd3bKQX/4.png',
    title: 'Zien Dat Het Werkt',
    text: 'Altijd inzicht in je vooruitgang. Gaat het goed? Gaan we zo door. Gaat het niet goed? **Lossen we het op** en gaan we verder.'
  },
  {
    icon: Moon,
    label: 'Herstel',
    image: 'https://i.ibb.co/SwTcyFP4/8.png',
    title: 'Meer Energie, Minder Moeite',
    text: 'Je slaapt beter en hebt **meer energie**, met een simpel ritme dat past bij jouw leven.'
  }
]

const renderBoldText = (text) => {
  const parts = text.split(/\*\*(.*?)\*\*/)
  return parts.map((part, i) =>
    i % 2 === 1
      ? <span key={i} style={{ color: '#fff', fontWeight: '700' }}>{part}</span>
      : part
  )
}

export default function PillarenSection({ isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle radial glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: `radial-gradient(circle, rgba(255,186,9,0.04) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`
      }} />

      <div style={{
        maxWidth: '1000px', width: '100%',
        position: 'relative', zIndex: 2
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: GOLD, display: 'inline-block', marginBottom: '0.65rem'
          }}>HOE WE DAT DOEN</span>
          <h2 style={{
            fontSize: isMobile ? 'clamp(1.3rem, 6vw, 1.7rem)' : '2.2rem',
            fontWeight: '900', color: '#fff', margin: 0, lineHeight: 1.2,
            padding: isMobile ? '0 0.25rem' : 0,
          }}>
            Naast je werk en sociale leven<br/>
            je doelen bereiken met{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>
              de 5 pilars
            </span>
          </h2>
        </div>

        {/* Pillars grid — 5 cards on desktop, 2 cols on mobile (5th wraps
            into the bottom row centered via auto-flow). */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? '0.5rem' : '0.8rem'
        }}>
          {PILLARS.map((p, i) => {
            const Icon = p.icon
            return (
              <div key={i} style={{
                borderRadius: '14px',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.3s ease'
              }}>
                {/* Image */}
                <div style={{
                  width: '100%',
                  height: isMobile ? '80px' : '100px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img
                    src={p.image}
                    alt={p.label}
                    style={{
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.8)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0, height: '60%',
                    background: 'linear-gradient(180deg, transparent, rgba(10,10,10,0.95))'
                  }} />
                  </div>

                {/* Text */}
                <div style={{
                  padding: '0.85rem 0.7rem 0.85rem',
                  textAlign: 'center'
                }}>
                  <span style={{
                    display: 'block',
                    fontSize: '0.6rem',
                    fontWeight: '800',
                    color: GOLD,
                    letterSpacing: '0.04em',
                    marginBottom: '0.15rem'
                  }}>{p.title}</span>
                  <span style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    color: '#fff',
                    marginBottom: '0.4rem'
                  }}>{p.label}</span>
                  <p style={{
                    fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1.45,
                    margin: 0,
                    fontWeight: '500'
                  }}>{renderBoldText(p.text)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
