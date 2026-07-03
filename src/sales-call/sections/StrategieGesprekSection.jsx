// src/sales-call/sections/StrategieGesprekSection.jsx
// Closing section voor /backinshape — zelfde opzet als GarantiePrijsSection
// (boog + titel + Trustpilot), maar de prijzen zijn vervangen door een CTA naar
// een gratis strategiegesprek. Garantie: het gesprek is vrijblijvend.
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import PhotoFan from './PhotoFan'
import CalendlyPopup from './CalendlyPopup'

const GOLD = '#ffba09'
const TP_GREEN = '#00B67A'
const CALENDLY_URL = 'https://calendly.com/kerstenscheffer/call-met-kersten'

export default function StrategieGesprekSection({ isMobile }) {
  const [calOpen, setCalOpen] = useState(false)
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      overflow: 'hidden',
      padding: isMobile ? '3rem 1.25rem' : '4rem 2rem'
    }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>

        {/* ═══ Pakket — 5 foto's overlappend als één fan ═══ */}
        <div style={{ marginBottom: isMobile ? '4rem' : '5.5rem' }}>
          <PhotoFan isMobile={isMobile} />
        </div>

        {/* ═══ CTA — gratis strategiegesprek ═══ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '4rem' : '5.5rem' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: '900', color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            Plan je <span style={{ color: GOLD }}>gratis strategiegesprek</span> en kijk of jij met 5 uur per week in shape kan komen.
          </h2>
          <div style={{ marginTop: isMobile ? '2.75rem' : '3.25rem' }}>
            <button onClick={() => setCalOpen(true)} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              padding: isMobile ? '1rem 1.75rem' : '1.15rem 2.5rem',
              background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: 14,
              fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, letterSpacing: '-0.01em',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: `0 10px 30px ${GOLD}44`, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              Plan je gratis strategiegesprek<ChevronRight size={isMobile ? 20 : 22} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* ═══ Garantie — het gesprek is vrijblijvend ═══ */}
        <div style={{ textAlign: 'center', fontSize: isMobile ? '1.3rem' : '1.6rem', color: '#fff', fontWeight: '900', lineHeight: 1.45, letterSpacing: '-0.01em', maxWidth: '540px', marginLeft: 'auto', marginRight: 'auto' }}>
          Het gesprek is <span style={{ color: GOLD }}>volledig vrijblijvend.</span>
        </div>

        {/* ═══ Trustpilot — kleine social proof onder de garantie ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: isMobile ? '2.5rem' : '3rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
          </svg>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fff' }}>4.8</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <svg key={s} width={12} height={12} viewBox="0 0 24 24" fill={TP_GREEN}>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
        </div>

      </div>

      <CalendlyPopup isOpen={calOpen} onClose={() => setCalOpen(false)} isMobile={isMobile} url={CALENDLY_URL} />
    </section>
  )
}
