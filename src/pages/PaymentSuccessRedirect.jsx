// src/pages/PaymentSuccessRedirect.jsx
// Bevestigingspagina na een geslaagde Stripe-betaling (route /success).
// Meldt dat de betaling gelukt is en telt af naar de intake (/myintake).
//
// Kaal en groot: dit scherm zie je drie tellen. Er stond eerder een kaart met
// rand, een emoji van 4rem, groene tekst en een knop met hover-animatie — vijf
// dingen om te lezen op een moment dat er maar één ding hoeft te landen.
import { useEffect, useState } from 'react'

const INTAKE_URL = '/myintake'
const SECONDEN = 5

export default function PaymentSuccessRedirect() {
  const [seconden, setSeconden] = useState(SECONDEN)

  useEffect(() => {
    // Eén timer die per seconde afloopt en bij nul doorstuurt. Een aparte
    // setTimeout naast de interval kan met het aftellen uit de pas lopen —
    // dan springt de pagina weg terwijl er nog een cijfer staat.
    const tick = setInterval(() => {
      setSeconden((s) => {
        if (s <= 1) {
          clearInterval(tick)
          window.location.href = INTAKE_URL
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center',
      // Safe area voor de notch/home-indicator: dit is vaak een telefoon.
      paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
    }}>
      <h1 style={{
        margin: 0,
        fontSize: 'clamp(2.5rem, 11vw, 5rem)',
        fontWeight: 900, color: '#fff',
        letterSpacing: '-0.04em', lineHeight: 1,
      }}>
        Betaling gelukt
      </h1>

      <p style={{
        margin: '1.25rem 0 0',
        fontSize: 'clamp(1rem, 4vw, 1.35rem)',
        fontWeight: 800, color: 'rgba(255,255,255,0.6)',
        letterSpacing: '-0.01em',
      }}>
        Je wordt doorverwezen naar de intake
      </p>

      {/* Het aftellen is de enige beweging op de pagina, dus mag het groot. */}
      <div style={{
        marginTop: '2.5rem',
        fontSize: 'clamp(5rem, 26vw, 11rem)',
        fontWeight: 900, color: '#fff',
        letterSpacing: '-0.06em', lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>
        {seconden}
      </div>

      {/* Vangnet voor als de doorverwijzing geblokkeerd wordt (in-app browsers
          van Instagram en Facebook doen dat soms). Bewust ingetogen. */}
      <button
        onClick={() => { window.location.href = INTAKE_URL }}
        style={{
          marginTop: '2.5rem', padding: '0.6rem 0.4rem',
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.45)',
          fontSize: '0.9rem', fontWeight: 800, fontFamily: 'inherit',
          cursor: 'pointer', minHeight: 44,
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}
      >
        Direct naar de intake
      </button>
    </div>
  )
}
