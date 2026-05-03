// ========================================
// 📁 src/lead-magnet/QuizPage.jsx
// Main quiz page — /ontdek-jouw-route
// ========================================
import { useState, useEffect } from 'react'
import QuizHeroSection from './components/QuizHeroSection'
import TransformationsSection from './components/TransformationsSection'
import FreePlanSection from './components/FreePlanSection'
import ReviewsSection from './components/ReviewsSection'
import FAQSection from './components/FAQSection'
import FooterSection from './components/FooterSection'
import FloatingCoach from './components/floating-coach/FloatingCoach'

export default function QuizPage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    h()
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      color: '#1a1a1a',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflowX: 'hidden',
      WebkitFontSmoothing: 'antialiased'
    }}>
      <QuizHeroSection isMobile={isMobile} />
      <TransformationsSection isMobile={isMobile} />
      <FreePlanSection isMobile={isMobile} />
      <ReviewsSection isMobile={isMobile} />
      <FAQSection isMobile={isMobile} />
      <FooterSection isMobile={isMobile} />

      <FloatingCoach isMobile={isMobile} page="quiz" />

      <style>{`html{scroll-behavior:smooth}`}</style>
    </div>
  )
}
