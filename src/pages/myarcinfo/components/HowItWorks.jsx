// src/pages/myarcinfo/components/HowItWorks.jsx
import { GOLD, BORDER, MUTED } from '../constants'

const STEPS = [
  {
    num: '01',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    title: 'DOEL BESPREKEN',
    desc: 'We bespreken jouw doelen, levensstijl en wat er tot nu toe niet werkte.'
  },
  {
    num: '02',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    title: 'PLAN MAKEN',
    desc: 'We bouwen een voedingsplan en trainingsplan optimaal voor jouw doelen en leven.'
  },
  {
    num: '03',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5 17.5 17.5"/>
        <path d="M8 8 5 11l-2-2 5-5 2 2z"/>
        <path d="M16 16l3-3 2 2-5 5-2-2z"/>
        <path d="m12 12-1.5-1.5"/>
        <path d="M14.5 9.5 9.5 14.5"/>
      </svg>
    ),
    title: 'TRAINEN & ETEN',
    desc: 'Wekelijkse calls, dagelijkse support en progressie bijhouden via de app.'
  },
  {
    num: '04',
    icon: (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'RESULTAAT',
    desc: 'Jij ziet het verschil. In de spiegel, in je energie, in je zelfvertrouwen.'
  },
]

export default function HowItWorks() {
  const isMobile = window.innerWidth <= 768

  return (
    <section style={{
      background: GOLD,
      padding: isMobile ? '4rem 1.5rem' : '5rem 2rem'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: '1rem'
          }}>
            DE AANPAK
          </div>
          <h2 style={{
            fontFamily: '"Anton", sans-serif',
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            textTransform: 'uppercase', lineHeight: 1,
            color: '#000'
          }}>
            HOE HET WERKT
          </h2>
        </div>

        {/* Steps — verticaal gestapeld zoals referentie */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '1rem'
            }}>
              {/* Icon */}
              <div style={{
                width: '88px', height: '88px',
                background: '#000',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {step.icon}
              </div>

              {/* Nummer + titel */}
              <div style={{
                fontFamily: '"Anton", sans-serif',
                fontSize: isMobile ? '1.5rem' : '2rem',
                color: '#000',
                textTransform: 'uppercase',
                lineHeight: 1
              }}>
                #{step.num} {step.title}
              </div>

              {/* Desc */}
              <p style={{
                fontSize: '0.88rem',
                color: 'rgba(0,0,0,0.6)',
                fontWeight: '600',
                lineHeight: 1.6,
                maxWidth: '360px',
                margin: 0
              }}>
                {step.desc}
              </p>

              {/* Divider tussen stappen */}
              {i < STEPS.length - 1 && (
                <div style={{ width: '1px', height: '2rem', background: 'rgba(0,0,0,0.15)', marginTop: '0.5rem' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
