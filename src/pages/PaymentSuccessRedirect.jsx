// src/pages/PaymentSuccessRedirect.jsx
// Bevestigingspagina na een geslaagde Stripe-betaling (route /success).
// Toont kort dat de betaling gelukt is en stuurt daarna automatisch door naar
// de intake (/myintake) zodat de klant meteen kan onboarden. Er blijft een
// knop staan voor als de automatische redirect geblokkeerd wordt.
import { useEffect, useState } from 'react'

const INTAKE_URL = '/myintake'
const REDIRECT_MS = 3000

export default function PaymentSuccessRedirect() {
  const [seconds, setSeconds] = useState(Math.round(REDIRECT_MS / 1000))

  useEffect(() => {
    const redirect = setTimeout(() => { window.location.href = INTAKE_URL }, REDIRECT_MS)
    const tick = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000)
    return () => { clearTimeout(redirect); clearInterval(tick) }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #171717 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '500px', background: 'rgba(17, 17, 17, 0.8)',
        backdropFilter: 'blur(10px)', borderRadius: '20px',
        padding: '3rem', border: '2px solid #10b981'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981', marginBottom: '1rem' }}>
          Betaling gelukt!
        </h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Welkom bij MY ARC! Je gaat nu automatisch door naar de intake
          {seconds > 0 ? ` (${seconds})` : ''}...
        </p>
        <button
          onClick={() => { window.location.href = INTAKE_URL }}
          style={{
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none', borderRadius: '10px', color: '#fff',
            fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)' }}
          onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none' }}
        >
          Direct naar de intake
        </button>
      </div>
    </div>
  )
}
