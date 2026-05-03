// src/pages/myarcinfo/components/FAQ.jsx
import { useState } from 'react'
import { GOLD, BORDER, MUTED } from '../constants'

const FAQS = [
  { q: 'Voor wie is dit geschikt?', a: 'MY ARC coaching is voor iedereen die serieus resultaat wil. Of je nu wilt afvallen, spieren wilt opbouwen, of gewoon fitter wilt worden — we bouwen een plan dat bij jouw leven past.' },
  { q: 'Hoe snel zie ik resultaat?', a: 'De meeste klanten zien al binnen 2-3 weken verschil. Hessel ging van 79,8 naar 74,4 kg in 8 weken. Resultaten hangen af van hoe consistent je het plan volgt.' },
  { q: 'Wat als het niet werkt?', a: 'Als je het plan volgt en geen resultaat behaalt, krijg je je geld terug. Geen gedoe, geen vragen. Dat is de garantie.' },
  { q: 'Heb ik een sportschool nodig?', a: 'Nee, dat is niet verplicht. We passen het trainingsplan aan op wat jij hebt — gym, thuis, of buiten.' },
  { q: 'Wat zit er in het gratis gesprek?', a: 'Een call van 20 minuten. We bespreken jouw doelen en situatie. Geen verplichtingen — je besluit daarna zelf of je wilt starten.' },
  { q: 'Wat is het verschil tussen de pakketten?', a: 'Het 90 dagen pakket is perfect voor een gerichte transformatie. Het 6 maanden pakket geeft meer tijd en meer calls voor duurzaam resultaat. Maandelijks is ideaal als je flexibel wilt blijven maar toch begeleiding wilt.' },
]

export default function FAQ() {
  const isMobile = window.innerWidth <= 768
  const [open, setOpen] = useState(null)

  return (
    <section style={{
      padding: isMobile ? '4rem 1.5rem' : '5rem 2rem',
      borderBottom: `1px solid ${BORDER}`
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>

        <div style={{
          fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: GOLD, marginBottom: '1rem'
        }}>
          VEELGESTELDE VRAGEN
        </div>

        <h2 style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          textTransform: 'uppercase', lineHeight: 1,
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          FAQ
        </h2>

        <div style={{ textAlign: 'left' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${BORDER}` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  textAlign: 'left',
                  padding: '1.25rem 0',
                  fontSize: isMobile ? '0.88rem' : '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  fontFamily: 'inherit',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {faq.q}
                <span style={{
                  color: GOLD,
                  fontSize: '1.3rem',
                  flexShrink: 0,
                  transform: open === i ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.2s ease',
                  lineHeight: 1
                }}>
                  +
                </span>
              </button>
              {open === i && (
                <div style={{
                  fontSize: '0.82rem',
                  color: MUTED,
                  lineHeight: 1.7,
                  paddingBottom: '1.25rem'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
