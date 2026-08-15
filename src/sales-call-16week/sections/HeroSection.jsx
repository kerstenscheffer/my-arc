// src/sales-call/sections/HeroSection.jsx
// Hero — review cards matching screenshot style exactly

const TP_GREEN = '#00B67A'

// 3 echte transformaties — in de hero onder de titel.
const TRANSFORMS = [
  { src: '/review-transformatie-1.png', caption: 'Kersten: van zachte buik naar sixpack.' },
  { src: '/review-transformatie-2-16week.png', caption: 'Nitish bouwde spier terwijl zijn vet % daalde.' },
]

const REVIEWS = [
  {
    name: 'Sassus',
    photo: '/review-sassus.png',
    date: 'NOV 2025',
    headline: '-5,1kg en eindelijk gelukt!',
    quote: 'Na 100 mislukte pogingen wilde ik mijzelf nog 1 kans geven. Met de energie van Kersten is het mij gelukt om een routine te creëren.'
  },
  {
    name: 'Consumer',
    photo: '/review-consumer.png',
    date: 'NOV 2025',
    headline: 'Echt resultaat door persoonlijke aanpak',
    quote: 'Zeer professionele aanpak, waardevolle feedback en motivatie op de juiste momenten.'
  },
  {
    name: 'Hessel',
    photo: null,
    date: 'FEB 2026',
    headline: 'Fijn en succesvol traject',
    quote: 'Van 79,8 naar 74,4 in 8 weken. Vooral de kennis en info spreekt me aan, waardoor ik nu zonder teveel na te denken stabiel blijf in gewicht.'
  },
  {
    name: 'Indi',
    photo: null,
    date: 'DEC 2025',
    headline: 'Professioneel, persoonlijk en betrouwbaar',
    quote: 'Helpt me iedere week en motiveert me heel erg bij het sporten.'
  },
  {
    name: 'Toon',
    photo: null,
    date: 'NOV 2025',
    headline: 'Super Coach, zeker een aanrader',
    quote: 'Leuke gesprekken, altijd enthousiast, goed geholpen in mijn traject.'
  },
  {
    name: 'Me',
    photo: null,
    date: 'DEC 2025',
    headline: 'Goed schema, wekelijkse begeleiding',
    quote: 'Je krijgt een goed schema en wekelijkse calls om je voortgang te checken.'
  }
]

export default function HeroSection({ isMobile }) {
  // Mobile-tuned constants — pulled out so they're easy to tweak together.
  const SECTION_PAD_X = isMobile ? '1rem' : '2rem'

  return (
    <section style={{
      scrollSnapAlign: 'start',
      // 100dvh respects the iOS Safari URL-bar so the section doesn't get
      // clipped under the chrome on mobile.
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      padding: isMobile ? '3rem 0' : '4.5rem 0',
      background: '#0a0a0a',
      position: 'relative'
    }}>
      {/* ═══ Logo — bovenaan de content (in de flow, botst niet met de tekst) ═══ */}
      <img
        src="/ma-logo-header.png"
        alt="MY ARC"
        style={{
          width: isMobile ? '104px' : '132px',
          height: 'auto',
          marginBottom: isMobile ? '1rem' : '1.25rem',
          flexShrink: 0
        }}
      />

      {/* ═══ Titel + boog — gelijk aan de slotsectie ═══ */}
      <div style={{
        textAlign: 'center',
        padding: `0 ${SECTION_PAD_X}`,
        maxWidth: '900px',
        marginBottom: isMobile ? '1.5rem' : '1.75rem'
      }}>
        <h1 style={{
          fontWeight: '900',
          lineHeight: 1.1,
          margin: 0,
          letterSpacing: '-0.02em',
          color: '#fff',
          fontSize: isMobile ? 'clamp(2rem, 7.8vw, 2.6rem)' : 'clamp(2.6rem, 4.4vw, 3.6rem)',
        }}>
          In 16 weken strakker &amp; sterker naast je 9-tot-5
        </h1>
        <div style={{
          fontWeight: '500',
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.4,
          marginTop: isMobile ? '0.5rem' : '0.65rem',
          fontSize: isMobile ? '1.05rem' : '1.6rem',
        }}>
          Zonder gek dieet of uren in de gym en met dat biertje en etentje er gewoon in.
        </div>
      </div>

      {/* ═══ 3 transformaties — onder de titel, bewust klein (titel domineert) ═══ */}
      <div style={{ width: isMobile ? '70%' : '100%', maxWidth: isMobile ? '100%' : '532px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.65rem' }}>
          {TRANSFORMS.map((t) => (
            <div key={t.src} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ borderRadius: '9px', overflow: 'hidden', filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }}>
                <img src={t.src} alt={t.caption} style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              <p style={{ margin: 0, fontSize: isMobile ? '0.5rem' : '0.62rem', fontWeight: '700', color: 'rgba(255,255,255,0.85)', lineHeight: 1.25, textAlign: 'center' }}>
                {t.caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Trustpilot badge ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: isMobile ? '1.25rem' : '1.5rem',
        marginBottom: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={TP_GREEN}/>
        </svg>
        <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>TRUSTPILOT</span>
        <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#fff' }}>4.8</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {[1,2,3,4,5].map(s => (
            <svg key={s} width={11} height={11} viewBox="0 0 24 24" fill={TP_GREEN}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
      </div>

    </section>
  )
}
