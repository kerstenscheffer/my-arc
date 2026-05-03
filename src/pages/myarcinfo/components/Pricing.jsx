// src/pages/myarcinfo/components/Pricing.jsx
import { GOLD, GOLD_DIM, BORDER, MUTED, CALENDLY } from '../constants'

const PLANS = [
  {
    name: '90 DAGEN',
    duration: 'Eenmalig',
    price: '€300',
    per: 'eenmalig',
    discount: null,
    featured: false,
    features: [
      'Maaltijdplan op maat',
      'Persoonlijk trainingsschema',
      '6 coaching calls',
      'App + WhatsApp support',
      'Progressie tracking',
      'Resultaat of geld terug',
    ]
  },
  {
    name: '6 MAANDEN',
    duration: 'Eenmalig',
    price: '€497',
    per: 'eenmalig',
    originalPrice: '€597',
    discount: '€100 KORTING',
    featured: true,
    badge: 'POPULAIRSTE',
    features: [
      'Alles van 90 dagen',
      '12 coaching calls',
      'Langere persoonlijke begeleiding',
      'Seizoensaanpassingen plan',
      'Prioriteit WhatsApp support',
      'Resultaat of geld terug',
    ]
  },
  {
    name: 'MAANDELIJKS',
    duration: 'Per maand',
    price: '€129',
    per: 'per maand · opzegbaar',
    discount: null,
    featured: false,
    features: [
      'Maaltijdplan op maat',
      'Persoonlijk trainingsschema',
      'Maandelijkse coaching call',
      'App + WhatsApp support',
      'Progressie tracking',
      'Flexibel opzegbaar',
    ]
  }
]

export default function Pricing() {
  const isMobile = window.innerWidth <= 768

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
          PAKKETTEN
        </div>

        <h2 style={{
          fontFamily: '"Anton", sans-serif',
          fontSize: isMobile ? '2.5rem' : '3.5rem',
          textTransform: 'uppercase', lineHeight: 1,
          marginBottom: isMobile ? '3rem' : '4rem'
        }}>
          KIES JOUW TRAJECT
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          border: `1px solid ${BORDER}`
        }}>
          {PLANS.map((plan, i) => (
            <div key={i} style={{
              padding: isMobile ? '2rem 1.5rem' : '2.5rem 1.75rem',
              borderRight: !isMobile && i < 2 ? `1px solid ${BORDER}` : 'none',
              borderBottom: isMobile && i < 2 ? `1px solid ${BORDER}` : 'none',
              outline: plan.featured ? `2px solid ${GOLD}` : 'none',
              outlineOffset: plan.featured ? '-2px' : '0',
              position: 'relative',
              textAlign: 'left'
            }}>

              {/* Badge */}
              {plan.badge && (
                <div style={{
                  display: 'inline-block',
                  background: GOLD,
                  color: '#000',
                  fontSize: '0.55rem',
                  fontWeight: '900',
                  letterSpacing: '0.1em',
                  padding: '0.25rem 0.65rem',
                  marginBottom: '1rem',
                  textTransform: 'uppercase'
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Name */}
              <div style={{
                fontFamily: '"Anton", sans-serif',
                fontSize: '1.5rem',
                textTransform: 'uppercase',
                marginBottom: '0.2rem'
              }}>
                {plan.name}
              </div>
              <div style={{
                fontSize: '0.62rem', fontWeight: '700',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: MUTED, marginBottom: '1.5rem'
              }}>
                {plan.duration}
              </div>

              <div style={{ marginBottom: '1.5rem' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', marginBottom: '2rem' }}>
                {plan.features.map((f, j) => (
                  <li key={j} style={{
                    fontSize: '0.78rem',
                    color: MUTED,
                    padding: '0.45rem 0',
                    borderBottom: `1px solid ${BORDER}`,
                    display: 'flex', gap: '0.5rem', alignItems: 'flex-start'
                  }}>
                    <span style={{ color: GOLD, fontWeight: '800', flexShrink: 0, marginTop: '0.05rem' }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={CALENDLY}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '0.9rem',
                  fontFamily: '"Anton", sans-serif',
                  fontSize: '0.95rem',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  background: plan.featured ? GOLD : 'transparent',
                  color: plan.featured ? '#000' : '#fff',
                  border: plan.featured ? 'none' : `1px solid rgba(255,255,255,0.2)`,
                  cursor: 'pointer',
                  minHeight: '48px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                BOEK GESPREK
              </a>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div style={{
          marginTop: '1.5rem',
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.3)',
          fontWeight: '600'
        }}>
          Alle pakketten · Resultaat of geld terug · Veilig betalen via Stripe
        </div>
      </div>
    </section>
  )
}
