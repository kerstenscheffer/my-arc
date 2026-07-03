// src/pages/BackInShapeMonthlyCheckout.jsx
// Maandelijkse Stripe-betaalpagina voor het "5 Uur Per Week Back In Shape"-programma.
// Zelfde opzet als de €597 prepay-pagina, maar nu €175/maand (subscription).
import { useState } from 'react'

const GOLD = '#FFD700'
const PRICE_ID = 'price_1SuciEJ3V4uXn1Ok4Uvuackr'

const ONDERDELEN = [
  { title: 'Eten Zonder Nadenken', line: 'Je weet elke dag wat je eet, ik reken het uit.' },
  { title: 'Gewoon Meedoen', line: 'Verjaardag, weekend, biertje: het past erin.' },
  { title: 'Klaar Om Te Trainen', line: 'Korte schema\'s die in je week passen.' },
  { title: 'Zie Dat Het Werkt', line: 'Je volgt je voortgang, je raadt niet.' },
  { title: 'Coach Naast Je', line: 'Ik stuur bij als het leven tegenzit.' },
]

export default function BackInShapeMonthlyCheckout() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handlePay = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: PRICE_ID,
          plan: 'back-in-shape-maandelijks',
          mode: 'subscription',
          successPath: '/success',
          cancelPath: '/back-in-shape-maandelijks',
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'Kon de betaalpagina niet openen')
      window.location.href = data.url
    } catch (e) {
      setError(e.message || 'Er ging iets mis. Probeer het opnieuw.')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', justifyContent: 'center', padding: isMobile ? '1.5rem 1rem 3rem' : '3rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>

        {/* Kop */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.75rem' : '2.25rem' }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.18em', color: GOLD, textTransform: 'uppercase', marginBottom: '0.75rem' }}>5 Uur Per Week — Back In Shape</div>
          <h1 style={{ fontSize: isMobile ? '1.7rem' : '2.4rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            In 16 weken een strak<br />en sterk lichaam
          </h1>
          <p style={{ fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: 600, color: 'rgba(255,255,255,0.65)', marginTop: '0.85rem' }}>
            Zonder dat je leven om fitness draait.
          </p>
        </div>

        {/* 5 onderdelen */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          {ONDERDELEN.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 14 }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,215,0,0.12)', border: `1px solid ${GOLD}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontWeight: 900, fontSize: '0.85rem' }}>{i + 1}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em' }}>{o.title}</div>
                <div style={{ fontSize: isMobile ? '0.85rem' : '0.92rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 1.4 }}>{o.line}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Garantie */}
        <div style={{ textAlign: 'center', padding: isMobile ? '1.1rem 1rem' : '1.35rem 1.25rem', background: 'rgba(255,215,0,0.05)', border: `1px solid ${GOLD}33`, borderRadius: 16, marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <div style={{ fontSize: isMobile ? '1.15rem' : '1.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', marginBottom: '0.55rem' }}>De garantie:</div>
          <div style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>
            Geen zichtbaar verschil binnen 30 dagen?{' '}
            <span style={{ color: GOLD }}>Dan krijg je je investering terug en loop je weg met 30 dagen gratis coaching.</span>
          </div>
        </div>

        {/* Prijs + betaalknop */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: isMobile ? '3rem' : '3.75rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>€175</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>per maand</span>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            style={{
              width: '100%', padding: isMobile ? '1.05rem' : '1.2rem',
              background: loading ? 'rgba(255,215,0,0.4)' : 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
              border: 'none', borderRadius: 14,
              color: '#0a0a0a', fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900,
              letterSpacing: '0.01em', cursor: loading ? 'default' : 'pointer',
              boxShadow: '0 10px 30px rgba(255,215,0,0.28)',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Bezig…' : 'Start nu — veilig betalen'}
          </button>

          {error && <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>{error}</div>}

          <div style={{ marginTop: '0.9rem', fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>
            Maandelijks opzegbaar · Beveiligde betaling via Stripe
          </div>
        </div>

      </div>
    </div>
  )
}
