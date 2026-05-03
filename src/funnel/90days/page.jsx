// src/funnel/90days/page.jsx

import React, { useState } from 'react'
import { pp, globalStyles } from './colors'
import Countdown from './components/Countdown'
import Hero from './components/Hero'
import Calculator from './components/Calculator'
import FoodList from './components/FoodList'
import PainPoints from './components/PainPoints'
import AboutMe from './components/AboutMe'
import FinalCTA from './components/FinalCTA'
import CTAModal from './components/CTAModal'

export default function Funnel90Days() {
  const isMobile = window.innerWidth <= 768
  const [showCTA, setShowCTA] = useState(false)

  return (
    <div style={{
      background: '#000', color: '#fff', minHeight: '100vh',
      fontFamily: pp, overflow: 'hidden',
    }}>
      <style>{globalStyles}</style>

      <Countdown isMobile={isMobile} />
      <Hero isMobile={isMobile} onCTAClick={() => setShowCTA(true)} />
      <Calculator isMobile={isMobile} />
      <FoodList isMobile={isMobile} />
      <PainPoints isMobile={isMobile} />
      <AboutMe isMobile={isMobile} />
      <FinalCTA isMobile={isMobile} onCTAClick={() => setShowCTA(true)} />

      {showCTA && <CTAModal isMobile={isMobile} onClose={() => setShowCTA(false)} />}

      {/* TODO: Offer details, FAQ, Final CTA */}

      <footer style={{
        padding: isMobile ? '1.5rem 1rem' : '2rem',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,186,9,0.06)',
      }}>
        <p style={{
          fontFamily: pp, fontSize: '0.52rem',
          color: 'rgba(255,255,255,0.12)', fontWeight: 500,
        }}>© 2026 Kersten Scheffer. Alle rechten voorbehouden.</p>
      </footer>
    </div>
  )
}
