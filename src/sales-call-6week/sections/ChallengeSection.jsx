// src/sales-call-6week/sections/ChallengeSection.jsx
// De drie slotschermen van de 6-weken challenge: het systeem, de voorwaarden
// en de garantie. Eén component met data per scherm, net als de pijlers:
// zelfde wrapper, zelfde gloed, zelfde eyebrow.
//
// Geen keuze meer tussen zelf en begeleid — alleen de win-your-money-back
// challenge. En geen streepjes of bolletjes: losse regels, groter gezet, met
// veel ruimte ertussen.

const GOLD = '#ffba09'

const SCHERMEN = [
  {
    eyebrow: 'HET SYSTEEM',
    title: 'Win your money back',
    subtitle: '300 euro. Doe je acties en je krijgt alles terug.',
    regels: [
      { kop: 'Persoonlijk plan', sub: 'op jouw week, jouw eten, jouw gym' },
      { kop: 'Dagelijks meekijken', sub: 'ik zie je logs en stuur bij' },
      { kop: 'WhatsApp', sub: 'korte lijn, geen wachten' },
      { kop: 'Wekelijkse call', sub: 'samen je cijfers door' },
      { kop: 'Je 300 euro terug', sub: 'cash, of door in het vervolgtraject' },
    ],
    kolommen: 2,
  },
  {
    eyebrow: 'DE VOORWAARDEN',
    title: 'Zo verdien je het terug',
    subtitle: 'Zes acties in zes weken.',
    regels: [
      { kop: '3 workouts per week', sub: '45 minuten' },
      { kop: '80% van je voedingsplan', sub: 'staat al klaar' },
      { kop: '4x per week wegen', sub: 'we sturen op het weekgemiddelde' },
      { kop: 'Elke week je check-in', sub: 'in de app' },
      { kop: '4 calls', sub: 'met je coach' },
      { kop: "3 progressiefoto's", sub: 'begin, midden, eind' },
    ],
    kolommen: 2,
  },
  {
    eyebrow: 'DE GARANTIE',
    title: 'Je loopt geen risico',
    subtitle: 'Drie keer je geld terug.',
    regels: [
      { kop: 'Doe je acties', sub: 'geld terug' },
      { kop: 'Binnen 7 dagen niet tevreden', sub: 'geld terug' },
      { kop: 'Na 6 weken niet de 300 euro waard', sub: 'geld terug' },
    ],
    kolommen: 1,
  },
]

export default function ChallengeSection({ isMobile, index = 0 }) {
  const s = SCHERMEN[index] || SCHERMEN[0]
  const kolommen = isMobile ? 1 : (s.kolommen || 1)

  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100dvh',
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '4rem 1.25rem' : '5.5rem 2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '600px',
        background: `radial-gradient(circle, rgba(255,186,9,0.04) 0%, transparent 70%)`,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`
      }} />

      <div style={{ maxWidth: '960px', width: '100%', position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.5rem' : '2.25rem' }}>
          <span style={{
            fontSize: isMobile ? '0.55rem' : '0.58rem', fontWeight: '800', letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.5)',
          }}>{s.eyebrow}</span>
        </div>

        <h3 style={{
          fontSize: isMobile ? '1.55rem' : '2.35rem',
          fontWeight: '900', color: '#fff', margin: `0 0 ${isMobile ? '0.6rem' : '0.75rem'}`,
          lineHeight: 1.12, letterSpacing: '-0.02em', textAlign: 'center',
        }}>
          {s.title}
        </h3>

        <p style={{
          margin: `0 auto ${isMobile ? '2.5rem' : '3.5rem'}`,
          maxWidth: '620px', textAlign: 'center',
          fontSize: isMobile ? '1.05rem' : '1.25rem',
          fontWeight: '600', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45,
        }}>{s.subtitle}</p>

        {/* Losse regels: kop groot en wit, toelichting eronder. Geen streepjes,
            geen bolletjes — de witruimte doet het werk. */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${kolommen}, 1fr)`,
          gap: isMobile ? '1.75rem' : '2.5rem 3.5rem',
          maxWidth: kolommen === 1 ? '560px' : '820px',
          margin: '0 auto',
          textAlign: kolommen === 1 ? 'center' : 'left',
        }}>
          {s.regels.map((r) => (
            <div key={r.kop}>
              <div style={{
                fontSize: isMobile ? '1.25rem' : '1.55rem',
                fontWeight: '900', color: '#fff',
                lineHeight: 1.2, letterSpacing: '-0.02em',
                marginBottom: isMobile ? '0.3rem' : '0.4rem',
              }}>
                {r.kop}
              </div>
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '600', color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.4,
              }}>
                {r.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
