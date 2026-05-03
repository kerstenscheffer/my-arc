// src/funnel/90days/components/AboutMe.jsx

import { GOLD, pp, goldGloss } from '../colors'

const G = ({ children }) => (
  <span style={{ ...goldGloss, fontWeight: 800 }}>{children}</span>
)

export default function AboutMe({ isMobile }) {
  return (
    <section style={{
      maxWidth: '720px', margin: '0 auto',
      padding: isMobile ? '2rem 1rem' : '2.5rem 2rem',
      borderTop: '1px solid rgba(255,186,9,0.08)',
      textAlign: 'center',
    }}>
      {/* Photo */}
      <img
        src="https://i.ibb.co/nq4dW5h9/Scherm-afbeelding-2026-03-07-om-18-17-10.png"
        alt="Kersten Scheffer"
        style={{
          width: isMobile ? '120px' : '150px',
          height: isMobile ? '120px' : '150px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid rgba(255,186,9,0.2)',
          marginBottom: isMobile ? '0.75rem' : '1rem',
        }}
      />

      {/* Title */}
      <h2 style={{
        fontFamily: pp,
        fontSize: isMobile ? '1.2rem' : '1.5rem',
        fontWeight: 900, color: '#fff', lineHeight: 1.2,
        margin: '0 0 1rem',
      }}>Wie ben ik?</h2>

      {/* Short story */}
      <p style={{
        fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.85rem',
        fontWeight: 400, lineHeight: 1.75, color: 'rgba(255,255,255,0.4)',
        margin: '0 auto 0.75rem', maxWidth: '500px',
      }}>
        Mijn naam is Kersten. Ik heb <span style={{ color: '#fff', fontWeight: 700 }}>tientallen mannen geholpen</span> om fitter te worden en op een blijvende manier vet te verliezen. Niet door harder te proberen — maar door <G>het juiste systeem</G>.
      </p>

      <p style={{
        fontFamily: pp, fontSize: isMobile ? '0.78rem' : '0.85rem',
        fontWeight: 400, lineHeight: 1.75, color: 'rgba(255,255,255,0.4)',
        margin: '0 auto', maxWidth: '500px',
      }}>
        <span style={{ color: '#fff', fontWeight: 700 }}>Geen bullshit, geen hype.</span> Gewoon een persoonlijk plan, wekelijkse check-ins, en iemand die er voor je is wanneer het lastig wordt.
      </p>

      {/* Quote */}
      <div style={{
        marginTop: isMobile ? '1rem' : '1.25rem',
        borderLeft: `3px solid ${GOLD}`,
        paddingLeft: isMobile ? '0.75rem' : '1rem',
        textAlign: 'left',
        maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto',
      }}>
        <p style={{
          fontFamily: pp, fontSize: isMobile ? '0.82rem' : '0.9rem',
          fontWeight: 700, lineHeight: 1.5, color: '#fff',
          fontStyle: 'italic', margin: 0,
        }}>
          "Mijn doel is simpel: dat jij over 90 dagen in de spiegel kijkt en denkt — dit had ik veel eerder moeten doen."
        </p>
      </div>
    </section>
  )
}
