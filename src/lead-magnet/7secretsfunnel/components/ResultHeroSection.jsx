// ========================================
// 📁 src/lead-magnet/components/ResultHeroSection.jsx
// Main orchestrator — white/dark contrast, minimal text
// ========================================
import { useState, useEffect } from 'react'
import HeroBanner from './result-hero/HeroBanner'
import PerceptionSection from './result-hero/PerceptionSection'
import StepsPlanCard from './result-hero/StepsPlanCard'
import QuickWinsSection from './result-hero/QuickWinsSection'
import CoachCtaSection from './result-hero/CoachCtaSection'

export default function ResultHeroSection({ isMobile, persona }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100)
  }, [])

  return (
    <section>
      {/* DARK — Hero banner */}
      <HeroBanner isMobile={isMobile} persona={persona} isVisible={isVisible} />

      {/* WHITE — Main content */}
      <div style={{ background: '#fff' }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: isMobile ? '0 1.25rem' : '0 2rem'
        }}>

          {/* Short herkenning */}
          <p style={{
            fontSize: isMobile ? '0.92rem' : '1rem',
            color: '#444',
            lineHeight: 1.65,
            fontWeight: '450',
            padding: isMobile ? '1.25rem 0' : '1.5rem 0',
            margin: 0,
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.6s ease 0.3s'
          }}>
            {persona.description}
          </p>

          {/* Page preview bullets */}
          <div style={{
            padding: isMobile ? '0 0 1.25rem' : '0 0 1.5rem',
            borderBottom: '1px solid #eee'
          }}>
            <p style={{
              fontSize: isMobile ? '0.82rem' : '0.86rem',
              color: '#1a1a1a',
              fontWeight: '700',
              margin: '0 0 0.5rem'
            }}>Op deze pagina krijg je:</p>
            {[
              'Direct toepasbare tips voor vandaag',
              'Waarom het tot nu toe niet lukte',
              'Jouw persoonlijke 5-stappen plan'
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                marginBottom: '0.3rem'
              }}>
                <span style={{ color: persona.color, fontSize: '0.7rem', fontWeight: '800' }}>→</span>
                <span style={{
                  fontSize: isMobile ? '0.8rem' : '0.84rem',
                  color: '#555', fontWeight: '500'
                }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Quick wins FIRST — value immediately */}
          <QuickWinsSection isMobile={isMobile} persona={persona} />

          {/* Perceptions — myth busting */}
          <PerceptionSection isMobile={isMobile} persona={persona} isVisible={isVisible} />
        </div>
      </div>

      {/* DARK — 5 stappen card */}
      <div style={{ background: '#0a0a0a' }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: isMobile ? '1.5rem 1.25rem' : '2rem'
        }}>
          <StepsPlanCard isMobile={isMobile} persona={persona} isVisible={isVisible} />
        </div>
      </div>

      {/* WHITE — Coach photo */}
      <div style={{ background: '#fff' }}>
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: isMobile ? '0 1.25rem' : '0 2rem'
        }}>
          <CoachCtaSection isMobile={isMobile} persona={persona} />
        </div>
      </div>
    </section>
  )
}
