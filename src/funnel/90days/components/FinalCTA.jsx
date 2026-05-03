// src/funnel/90days/components/FinalCTA.jsx

import { useState } from 'react'
import { GOLD, CALENDLY, pp, goldGloss, goldButtonBg, shimmerOverlay } from '../colors'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

const H = ({ children }) => (
  <span style={{ background: 'rgba(255,186,9,0.2)', padding: '0 3px', borderRadius: '3px', color: '#fff', fontWeight: 700 }}>{children}</span>
)

const OFFER_POINTS = [
  'Maaltijdplan 100% op maat — gebouwd op jouw lichaam, smaak en budget',
  'Compleet trainingsschema in de app — met progressie ingebouwd',
  '6 persoonlijke coaching calls met mij',
  'Wekelijkse check-ins — bijsturen wanneer nodig',
  'WhatsApp support gedurende het hele traject',
  '60 dagen gratis nazorg — zodat je resultaat blijft',
]

const FAQS = [
  {
    q: 'Wat kost het?',
    a: 'Het traject kost €597 voor 90 dagen volledige begeleiding + 60 dagen gratis nazorg. Dat is minder dan €5 per dag voor een complete transformatie.',
  },
  {
    q: 'Hoeveel tijd kost het per dag?',
    a: 'Je traint 3-4x per week, 45-60 minuten. Meal prep kost je maximaal 1-2 uur per week. De app doet de rest.',
  },
  {
    q: 'Wat als het niet werkt?',
    a: 'Als je 80% van het plan volgt en je haalt je doel niet, krijg je je geld terug. Zo simpel is het.',
  },
  {
    q: 'Moet ik een strikt dieet volgen?',
    a: 'Nee. Je leert flexibel eten naar je doelen. Geen verboden voedsel, geen crash diëten. Gewoon een plan dat werkt.',
  },
  {
    q: 'Ik heb al vaker gefaald, waarom zou dit anders zijn?',
    a: 'Omdat je dit keer niet alleen bent. Je krijgt een persoonlijk plan, wekelijkse accountability, en iemand die bijstuurt wanneer het lastig wordt.',
  },
]

function FAQItem({ faq, isMobile }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.85rem 0' : '1rem 0',
        background: 'none', border: 'none', cursor: 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        textAlign: 'left',
      }}>
        <span style={{
          fontFamily: pp, fontSize: isMobile ? '0.8rem' : '0.88rem',
          fontWeight: 700, color: '#fff', lineHeight: 1.35,
          flex: 1, paddingRight: '0.5rem',
        }}>{faq.q}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={open ? GOLD : 'rgba(255,255,255,0.2)'}
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div style={{
        maxHeight: open ? '200px' : '0',
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, opacity 0.2s ease',
      }}>
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.72rem' : '0.78rem',
          fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.4)',
          margin: 0, paddingBottom: isMobile ? '0.85rem' : '1rem',
        }}>{faq.a}</p>
      </div>
    </div>
  )
}

export default function FinalCTA({ isMobile, onCTAClick }) {
  return (
    <>
      {/* ═══════════════════════════════════
          CONCREET AANBOD
          ═══════════════════════════════════ */}
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: isMobile ? '2rem 1rem' : '2.5rem 2rem',
        borderTop: '1px solid rgba(255,186,9,0.08)',
        textAlign: 'center',
      }}>
        {/* Pain hook — BIG */}
        <h2 style={{
          fontFamily: pp, fontSize: isMobile ? '1.3rem' : '1.7rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          marginBottom: isMobile ? '1rem' : '1.25rem',
          maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Loop jij tegen <H>motivatieverlies</H>, <H>geen structuur</H> of <H>geen resultaten</H> aan?
        </h2>

        {/* What I do — also big */}
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '1rem' : '1.15rem',
          fontWeight: 400, lineHeight: 1.6, color: 'rgba(255,255,255,0.4)',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Ik begeleid mannen naar <span style={{ color: '#fff', fontWeight: 700 }}>5-15 kilo vetverlies in 90 dagen</span>. Persoonlijk plan, wekelijkse check-ins, en ik sta naast je tot je er bent.
        </p>

        {/* Guarantee — one line */}
        <div style={{
          fontFamily: pp, fontSize: isMobile ? '0.95rem' : '1.05rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.3,
          marginBottom: isMobile ? '1.25rem' : '1.5rem',
        }}>
          Geen resultaat? <G>Dan werk ik voor niks.</G>
        </div>

        {/* CTA with urgency inside button */}
        <button onClick={onCTAClick} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center',
          fontFamily: pp, color: '#000',
          background: 'linear-gradient(145deg, #d4a017 0%, #ffba09 30%, #ffd44d 50%, #ffba09 70%, #d4a017 100%)',
          borderRadius: '14px',
          padding: isMobile ? '1rem 2rem' : '1.1rem 2.5rem',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(255,186,9,0.2)',
          animation: 'ssPulseGlow 2.5s ease-in-out infinite',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          border: 'none', cursor: 'pointer',
          maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          <div style={shimmerOverlay} />
          <span style={{ position: 'relative', zIndex: 1, fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 900 }}>Plan Je Gratis Gesprek</span>
          <span style={{ position: 'relative', zIndex: 1, fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 600, opacity: 0.7, marginTop: '2px' }}>Nog 5 plekken beschikbaar — 15 min, vrijblijvend</span>
        </button>
      </section>

      {/* ═══════════════════════════════════
          FAQ
          ═══════════════════════════════════ */}
      <section style={{
        maxWidth: '720px', margin: '0 auto',
        padding: isMobile ? '1.5rem 1rem 2rem' : '2rem 2rem 2.5rem',
        borderTop: '1px solid rgba(255,186,9,0.08)',
      }}>
        <h2 style={{
          fontFamily: pp,
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: 900, color: '#fff', lineHeight: 1.25,
          textAlign: 'center',
          marginBottom: isMobile ? '1rem' : '1.25rem',
        }}>
          Veelgestelde vragen
        </h2>

        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} isMobile={isMobile} />
          ))}
        </div>
      </section>

      <style>{`
        @keyframes spotsLivePulse {
          0%, 100% { opacity: 1; transform: scale(1) }
          50% { opacity: 0.5; transform: scale(1.4) }
        }
      `}</style>
    </>
  )
}
