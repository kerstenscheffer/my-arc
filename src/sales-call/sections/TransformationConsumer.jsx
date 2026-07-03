// src/sales-call/sections/TransformationConsumer.jsx
// White section — Hessel transformation, same style as Sassus, foto rechts (mirrored)
// FOTO TODO: upload Hessel's before/after als /public/transformatie-hessel.png
// en zijn avatar als /public/review-hessel.png — tot dan valt het terug op placeholder.

const GOLD = '#ffba09'

export default function TransformationConsumer({ isMobile }) {
  return (
    <section style={{
      scrollSnapAlign: 'start',
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '2rem 1.25rem' : '3rem 2rem'
    }}>
      <div style={{
        maxWidth: '800px',
        width: '100%',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row-reverse',
        gap: isMobile ? '1.5rem' : '3rem',
        alignItems: 'center'
      }}>
        {/* Before/After foto */}
        <div style={{
          width: isMobile ? '100%' : '45%',
          flexShrink: 0,
          position: 'relative'
        }}>
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            aspectRatio: '4/5',
            background: '#f5f5f5',
            position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
          }}>
            <img
              src="/transformatie-hessel.png"
              alt="Hessel transformatie"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.style.display = 'flex'
                e.target.parentElement.style.alignItems = 'center'
                e.target.parentElement.style.justifyContent = 'center'
                e.target.parentElement.innerHTML += '<span style="color:#ccc;font-size:0.75rem;font-weight:600">BEFORE / AFTER</span>'
              }}
            />
            {/* Result badge */}
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '12px' : '16px',
              right: isMobile ? '12px' : '16px',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              padding: '0.4rem 0.85rem',
              borderRadius: '10px',
              border: `1px solid ${GOLD}50`
            }}>
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.9rem',
                fontWeight: '900',
                color: GOLD
              }}>-5,4 kg in 8 weken</span>
            </div>
          </div>
        </div>

        {/* Quote + info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Naam + datum + sterren */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img
                src="/review-hessel.png"
                alt="Hessel"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.style.background = '#ddd'
                  e.target.parentElement.innerHTML = '<span style="color:#888;font-size:0.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;width:100%;height:100%">H</span>'
                }}
              />
            </div>
            <div>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '800',
                color: '#1a1a1a',
                display: 'block',
                lineHeight: 1.2
              }}>Hessel</span>
              <span style={{
                fontSize: '0.6rem',
                fontWeight: '600',
                color: 'rgba(0,0,0,0.3)',
                display: 'block'
              }}>feb 2026</span>
            </div>
            <div style={{ display: 'flex', gap: '2px', marginLeft: 'auto' }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width={14} height={14} viewBox="0 0 24 24" fill="#FFD700">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
            </div>
          </div>

          {/* Result headline */}
          <p style={{
            fontSize: isMobile ? '1.3rem' : '1.6rem',
            fontWeight: '900',
            color: '#1a1a1a',
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: '-0.01em'
          }}>
            <span style={{
              borderBottom: `3px solid ${GOLD}`,
              paddingBottom: '0px'
            }}>Van 79,8 naar 74,4 kg in 8 weken</span>
          </p>

          {/* Quote */}
          <p style={{
            fontSize: isMobile ? '1rem' : '1.2rem',
            fontWeight: '700',
            color: '#1a1a1a',
            lineHeight: 1.45,
            margin: 0
          }}>
            Na een 0-meting kreeg ik een uitgebreid plan: iedere week wegen en videobellen. Vooral de kennis en info spreekt me aan, waardoor ik nu{' '}
            <span style={{ color: '#e8a800' }}>zonder teveel na te denken stabiel blijf in gewicht.</span>
          </p>

          {/* Trustpilot badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            marginTop: '0.25rem'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#00B67A"/>
            </svg>
            <span style={{
              fontSize: '0.58rem',
              fontWeight: '600',
              color: 'rgba(0,0,0,0.3)',
              letterSpacing: '0.03em'
            }}>Beoordeeld op Trustpilot</span>
          </div>
        </div>
      </div>
    </section>
  )
}
