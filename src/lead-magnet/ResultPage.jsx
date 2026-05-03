// ========================================
// 📁 src/lead-magnet/ResultPage.jsx
// Main result page — /ontdek-jouw-route/resultaat?type=X
// LeadModal removed — FloatingCoach handles everything
// ========================================
import { useState, useEffect } from 'react'
import { PERSONAS } from './data/personaData'
import ResultHeroSection from './components/ResultHeroSection'
import TransformationsSection from './components/TransformationsSection'
import FreePlanSection from './components/FreePlanSection'
import ReviewsSection from './components/ReviewsSection'
import FAQSection from './components/FAQSection'
import FooterSection from './components/FooterSection'
import FloatingCoach from './components/floating-coach/FloatingCoach'

export default function ResultPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    h()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const params = new URLSearchParams(window.location.search)
  const typeParam = params.get('type') || 'stress'
  const persona = PERSONAS[typeParam] || PERSONAS.stress

  return (
    <div style={{
      minHeight: '100vh',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased',
      background: '#000'
    }}>
      <ResultHeroSection isMobile={isMobile} persona={persona} />
      <TransformationsSection isMobile={isMobile} />
      <FreePlanSection isMobile={isMobile} />
      <ReviewsSection isMobile={isMobile} />
      <FAQSection isMobile={isMobile} />
      <FooterSection isMobile={isMobile} />

      <FloatingCoach isMobile={isMobile} page="result" />

      <style>{`html{scroll-behavior:smooth}`}</style>
    </div>
  )
}
