// src/lead-magnet/7secretsfunnel/components/FinalSection.jsx
import { useState } from 'react'
import { GOLD, GOLD_DARK, CALENDLY } from './shared'

const pp = "'Poppins', sans-serif"

const REVIEWS = [
  { name: 'Sassus', text: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren.', result: '-5,1kg' },
  { name: 'Hessel', text: 'De kennis zorgt ervoor dat ik nu zonder na te denken stabiel blijf in gewicht.', result: '-5,4kg' },
  { name: 'Indi', text: 'Helpt me iedere week en motiveert me heel erg bij het sporten.', result: '' },
  { name: 'Toon', text: 'Leuke gesprekken, altijd enthousiast, goed geholpen in mijn traject.', result: '' },
  { name: 'Consumer', text: 'Zeer professionele aanpak, waardevolle feedback en motivatie op de juiste momenten.', result: '' },
]

export default function FinalSection({ isMobile }) {
  const doubled = [...REVIEWS, ...REVIEWS]
  const [showCal, setShowCal] = useState(false)

  const calUrl = CALENDLY + '?background_color=000000&text_color=ffffff&primary_color=ffba09&hide_gdpr_banner=1'

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: isMobile ? '2rem 1rem 0' : '3rem 2rem 0' }}>

      {/* CTA — simple conclusion */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.25rem' : '1.5rem' }}>
        <h2 style={{ fontFamily: pp, fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 900, color: '#fff', lineHeight: 1.3, margin: '0 0 0.5rem' }}>
          Wil je begeleiding naar jouw <span className="ss-gold-gloss">Summer Shape?</span>
        </h2>
        <p style={{ fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, lineHeight: 1.6, margin: 0 }}>
          Start voor <span style={{ color: GOLD, fontWeight: 800 }}>€1</span> — eerste maand alles inbegrepen.
        </p>
      </div>

      {/* What you get */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: isMobile ? '1rem' : '1.25rem', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
        {['Persoonlijk voedings- en trainingsplan', '1-op-1 coaching met Kersten', 'Volledige app toegang', 'Wekelijkse check-ins'].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontFamily: pp, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{item}</span>
          </div>
        ))}
      </div>

      {/* Price */}
      <div style={{ textAlign: 'center', marginBottom: isMobile ? '1rem' : '1.25rem' }}>
        <span style={{ fontFamily: pp, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500, textDecoration: 'line-through' }}>€149/maand</span>
        <span style={{ fontFamily: pp, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}> → </span>
        <span style={{ fontFamily: pp, fontSize: '1.1rem', color: GOLD, fontWeight: 900 }}>€1 eerste maand</span>
      </div>

      {/* CTA button */}
      <button onClick={() => setShowCal(true)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        width: '100%', padding: isMobile ? '0.9rem' : '1rem', borderRadius: '14px',
        fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 900,
        color: '#000', background: 'linear-gradient(135deg, #ffd44d, #ffba09, #e8a800)',
        border: 'none', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        boxShadow: '0 4px 25px rgba(255,186,9,0.4)',
        animation: 'ssPulse 2s ease-in-out infinite',
        marginBottom: isMobile ? '0.5rem' : '0.6rem',
      }}>
        Plan Je Gratis Gesprek
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>

      <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '2.5rem' }}>
        <span style={{ fontFamily: pp, fontSize: '0.45rem', color: 'rgba(255,255,255,0.15)', fontWeight: 500 }}>100% vrijblijvend · 15 min kennismaking</span>
      </div>

      {/* Calendly modal */}
      {showCal && (
        <>
          <div onClick={() => setShowCal(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            zIndex: 300,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: isMobile ? 'calc(100vw - 24px)' : '500px',
            height: isMobile ? '85vh' : '80vh',
            background: '#000', border: '1px solid rgba(255,186,9,0.15)',
            borderRadius: '16px', overflow: 'hidden', zIndex: 301,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,186,9,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#000' }}>
              <span style={{ fontFamily: pp, fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: GOLD }}>Kies een moment</span>
              <button onClick={() => setShowCal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', cursor: 'pointer', padding: '4px' }}>✕</button>
            </div>
            <iframe
              src={calUrl}
              style={{ flex: 1, width: '100%', border: 'none', background: '#000' }}
              allow="payment"
            />
          </div>
        </>
      )}

      {/* Reviews */}
      <div style={{ width: '100vw', marginLeft: '50%', transform: 'translateX(-50%)', position: 'relative', overflow: 'hidden', paddingBottom: '3rem' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '80px', height: '100%', background: 'linear-gradient(90deg, rgba(0,0,0,1), transparent)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, right: 0, width: '80px', height: '100%', background: 'linear-gradient(270deg, rgba(0,0,0,1), transparent)', zIndex: 3, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', gap: '0.6rem', animation: 'ssSlide 30s linear infinite', width: 'max-content' }}>
          {doubled.map((r, i) => (
            <div key={i} style={{ width: '200px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.7rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{r.name.charAt(0)}</span>
                  </div>
                  <span style={{ fontFamily: pp, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{r.name}</span>
                  {r.result && <span style={{ fontFamily: pp, fontSize: '0.5rem', fontWeight: 800, color: GOLD }}>{r.result}</span>}
                </div>
                <div style={{ display: 'flex', gap: '1px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} width={9} height={9} viewBox="0 0 24 24" fill={GOLD}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  ))}
                </div>
              </div>
              <p style={{ fontFamily: pp, fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', fontWeight: 400, lineHeight: 1.45, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
