// ========================================
// 📁 src/lead-magnet/components/FAQSection.jsx
// Eigen kopie — onafhankelijk aanpasbaar
// ========================================
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const G = '#C9A84C'

const FAQS = [
  {
    q: 'Is deze test en guide echt gratis?',
    a: 'Ja, 100% gratis. Geen verborgen kosten, geen email nodig voor de test. De guide is ons cadeau aan jou.'
  },
  {
    q: 'Hoe werkt het 16-weken traject?',
    a: 'Je krijgt een persoonlijk meal plan, workout plan, wekelijkse coaching calls, en toegang tot onze app die alles bijhoudt. Alles is afgestemd op jouw type en jouw leven.'
  },
  {
    q: 'Moet ik streng diëten?',
    a: 'Nee. Wij bouwen een leefstijl die past bij jouw leven. Je kunt gewoon lekker blijven eten, mee-eten met je gezin, en af en toe genieten. Het gaat om slimme keuzes, niet om perfectie.'
  },
  {
    q: 'Wat als ik al eerder gefaald heb?',
    a: 'Dan ben je precies onze doelgroep. De meeste klanten hebben al meerdere dingen geprobeerd. Het verschil is dat wij niet focussen op diëten maar op een systeem dat bij jou past.'
  },
  {
    q: 'Hoeveel kost begeleiding?',
    a: 'Dat bespreken we tijdens het gratis intake gesprek. We kijken eerst of we een goede match zijn en wat jij nodig hebt. Geen verplichtingen.'
  },
  {
    q: 'Kan ik ook online meedoen?',
    a: 'Ja, alles is online. Coaching calls via video, je plan in de app, en je kunt altijd berichten sturen. Je hoeft nergens naartoe.'
  }
]

export default function FAQSection({ isMobile }) {
  const [open, setOpen] = useState(null)

  return (
    <section style={{
      padding: isMobile ? '2.5rem 1.25rem' : '3.5rem 2rem',
      background: '#fafaf8'
    }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <h2 style={{
          fontSize: isMobile ? '1.3rem' : '1.5rem',
          fontWeight: '800',
          color: '#1a1a1a',
          textAlign: 'center',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>Veelgestelde vragen</h2>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          {FAQS.map((faq, idx) => (
            <div key={idx} style={{
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem 1.1rem' : '1.15rem 1.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <span style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '650',
                  color: '#1a1a1a',
                  textAlign: 'left',
                  lineHeight: 1.4
                }}>{faq.q}</span>
                <ChevronDown
                  size={18}
                  color="#999"
                  style={{
                    flexShrink: 0,
                    transition: 'transform 0.3s ease',
                    transform: open === idx ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>
              <div style={{
                maxHeight: open === idx ? '200px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease'
              }}>
                <p style={{
                  padding: isMobile ? '0 1.1rem 1rem' : '0 1.25rem 1.15rem',
                  fontSize: isMobile ? '0.8rem' : '0.84rem',
                  color: '#666',
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: '450'
                }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
