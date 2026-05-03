// src/intake/IntakePage.jsx
import { useState, useEffect } from 'react'
import HeroSection from './sections/HeroSection'
import TransformationsSection from './sections/TransformationsSection'
import ProgrammaSection from './sections/ProgrammaSection'
import HoeHetWerktSection from './sections/HoeHetWerktSection'
import ReviewsSection from './sections/ReviewsSection'
import CTABannerSection from './sections/CTABannerSection'
import FAQSection from './sections/FAQSection'
import FooterSection from './sections/FooterSection'

export default function IntakePage() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768)
    h(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h)
  }, [])

  return (
    <div style={{ minHeight: '100vh', color: '#1a1a1a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden', WebkitFontSmoothing: 'antialiased' }}>
      <HeroSection isMobile={isMobile} />
      <TransformationsSection isMobile={isMobile} />
      <ProgrammaSection isMobile={isMobile} />
      <HoeHetWerktSection isMobile={isMobile} />
      <ReviewsSection isMobile={isMobile} />
      <CTABannerSection isMobile={isMobile} />
      <FAQSection isMobile={isMobile} />
      <FooterSection isMobile={isMobile} />

      {/* WhatsApp FAB */}
      <a href="https://wa.me/31631388756" target="_blank" rel="noopener noreferrer" style={{
        position: 'fixed', bottom: isMobile ? '20px' : '30px', right: isMobile ? '20px' : '30px',
        width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', borderRadius: '50%',
        background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)', zIndex: 100, transition: 'transform 0.3s ease', touchAction: 'manipulation'
      }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
        <svg width={isMobile ? 28 : 32} height={isMobile ? 28 : 32} viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
      <style>{`html{scroll-behavior:smooth}`}</style>
    </div>
  )
}
