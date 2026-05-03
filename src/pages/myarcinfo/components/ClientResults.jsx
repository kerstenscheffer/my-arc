// src/pages/myarcinfo/components/ClientResults.jsx
import { GOLD, BORDER, MUTED } from '../constants'

const RESULTS = [
  { name: 'Hessel', date: 'feb 2026', highlight: '79,8 → 74,4 KG IN 8 WEKEN', text: 'Geen vaste gerechten, gewoon een plan dat werkt. Kersten geeft altijd de volle 100%.' },
  { name: 'Sassus', date: 'nov 2025', highlight: 'NA 100 MISLUKTE POGINGEN', text: 'Eindelijk een routine die ik kan volhouden. Niet alleen fysiek — ook mentaal begeleid.' },
  { name: 'Finn', date: 'mrt 2026', highlight: '8 WEKEN, BLIJVEND RESULTAAT', text: 'Goed aangekomen en de discipline opgebouwd om consistent te blijven gymmen.' },
  { name: 'Consumer', date: 'nov 2025', highlight: 'PROFESSIONEEL & GESTRUCTUREERD', text: 'Alles overzichtelijk in de app. Actieve progressiebewaking met feedback op het juiste moment.' },
  { name: 'Indi', date: 'dec 2025', highlight: 'IEDERE WEEK BETER IN MIJN VEL', text: 'Wekelijkse begeleiding op maat. Professioneel, persoonlijk en veel lachen.' },
  { name: 'Toon', date: 'nov 2025', highlight: 'SUPER COACH', text: 'Leuke gesprekken, altijd enthousiast. Heeft me goed geholpen in mijn traject.' },
]

export default function ClientResults() {
  const isMobile = window.innerWidth <= 768

  return (
    <section style={{
      borderTop: `1px solid ${BORDER}`,
      borderBottom: `1px solid ${BORDER}`,
      padding: isMobile ? '4rem 1.5rem' : '5rem 2rem'
    }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '3rem' : '4rem' }}>
          <div style={{
            fontSize: '0.6rem', fontWeight: '800', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: GOLD, marginBottom: '1rem'
          }}>
            
          </div>
          <h2 style={{
            fontFamily: '"Anton", sans-serif',
            fontSize: isMobile ? '2.5rem' : '3.5rem',
            textTransform: 'uppercase', lineHeight: 1,
            marginBottom: '0.75rem'
          }}>
            KLANT RESULTATEN.
          </h2>
          <p style={{ fontSize: '0.85rem', color: MUTED, fontWeight: '500' }}>
            Beoordeeld op Trustpilot · Nieuwe én bestaande klanten
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '0.75rem'
        }}>
          {RESULTS.map((r, i) => {
            const isGold = i % 2 === 1
            return (
              <div key={i} style={{
                background: isGold ? GOLD : '#fff',
                padding: '1rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                {/* Sterren + naam */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="11" height="11" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={isGold ? '#000' : GOLD} stroke="none"/>
                      </svg>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.58rem', color: 'rgba(0,0,0,0.4)', fontWeight: '700' }}>
                    {r.name} · {r.date}
                  </span>
                </div>

                {/* Highlight — Anton */}
                <div style={{
                  fontFamily: '"Anton", sans-serif',
                  fontSize: '1.1rem',
                  color: '#000',
                  textTransform: 'uppercase',
                  lineHeight: 1.05
                }}>
                  {r.highlight}
                </div>

                {/* Quote */}
                <p style={{
                  fontSize: '0.78rem',
                  color: isGold ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.6)',
                  fontWeight: '600',
                  lineHeight: 1.5,
                  margin: 0
                }}>
                  "{r.text}"
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
