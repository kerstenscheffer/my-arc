// src/modules/funnel-pages/your-arc/components/TrajectFasenSection.jsx
// "3 fases van het traject" — concept-versie (issue a46bed31). Copy is een
// logische coaching-boog over 16 weken; Kersten verfijnt de teksten.
// Past in het groene YOUR ARC-funnel thema.
import { useEffect, useState } from 'react'

const GREEN = '#10b981'

const FASES = [
  {
    n: 1,
    label: 'Weken 1–4',
    title: 'Fundament',
    body: 'We starten met een 0-meting en een plan dat past bij jouw leven. Je leert de basis: wat eet je, hoe train je, en we zetten routines neer die je vol kunt houden.',
  },
  {
    n: 2,
    label: 'Weken 5–12',
    title: 'Versnelling',
    body: 'Nu zie je het werken. We sturen wekelijks bij op jouw data, je gewoontes worden automatisch en je lichaam verandert zichtbaar — zonder dat je leven om fitness draait.',
  },
  {
    n: 3,
    label: 'Weken 13–16',
    title: 'Verankering',
    body: 'Je maakt je los van de begeleiding: je weet nu zelf wat je moet doen. Het resultaat houd je vast omdat het een leefstijl is geworden, geen tijdelijke kuur.',
  },
]

export default function TrajectFasenSection({ isMobile }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t) }, [])

  return (
    <div style={{
      minHeight: isMobile ? 'calc(var(--vh, 1vh) * 100)' : '100vh',
      background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 55%), #0a0a0a',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: isMobile ? '3.5rem 1.25rem' : '4rem 2rem',
    }}>
      <div style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        {/* Kop */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem' }}>
          <div style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: 800, letterSpacing: '0.18em', color: GREEN, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Jouw traject
          </div>
          <h2 style={{ fontSize: isMobile ? 'clamp(1.7rem, 8vw, 2.3rem)' : 'clamp(2.4rem, 4vw, 3.2rem)', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            In 16 weken, in <span style={{ color: GREEN }}>3 fases</span>
          </h2>
          <p style={{ fontSize: isMobile ? '0.9rem' : '1.05rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, margin: '0.85rem auto 0', maxWidth: 560, lineHeight: 1.5 }}>
            Geen vage beloftes — een duidelijk pad van opstart tot zelfstandig resultaat vasthouden.
          </p>
        </div>

        {/* Fase-cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '0.85rem' : '1.1rem' }}>
          {FASES.map((f, i) => (
            <div key={f.n} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(16,185,129,0.18)',
              borderRadius: 16,
              padding: isMobile ? '1.25rem 1.1rem' : '1.5rem 1.35rem',
              position: 'relative',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(16px)',
              transition: `all 0.5s cubic-bezier(0.4,0,0.2,1) ${i * 120}ms`,
            }}>
              {/* Nummer */}
              <div style={{
                width: isMobile ? 40 : 46, height: isMobile ? 40 : 46, borderRadius: '50%',
                background: 'rgba(16,185,129,0.12)', border: `1.5px solid ${GREEN}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: GREEN, fontWeight: 900, fontSize: isMobile ? '1.1rem' : '1.25rem',
                marginBottom: '0.85rem',
              }}>{f.n}</div>

              <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(16,185,129,0.7)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{f.label}</div>
              <h3 style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 900, color: '#fff', margin: '0 0 0.55rem', letterSpacing: '-0.01em' }}>{f.title}</h3>
              <p style={{ fontSize: isMobile ? '0.88rem' : '0.92rem', color: 'rgba(255,255,255,0.65)', fontWeight: 500, lineHeight: 1.55, margin: 0 }}>{f.body}</p>

              {/* Connector-lijn tussen cards (desktop) */}
              {!isMobile && i < FASES.length - 1 && (
                <div style={{ position: 'absolute', top: '50%', right: -11, width: 22, height: 2, background: `linear-gradient(90deg, ${GREEN}, transparent)` }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
