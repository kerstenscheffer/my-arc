// src/components/BetalingGelukt.jsx
// Bevestigingsscherm na een geslaagde Stripe-betaling.
//
// Gebruikt op twee plekken:
//  - /success (PaymentSuccessRedirect) — de meeste checkouts
//  - /myintake?session_id=... (PublicIntakePage) — de 6 Weken Challenge
//    stuurt na betaling direct naar de intake. Daar zag de klant tot nu toe
//    alleen "Intake formulier / Welkom bij MY ARC" en geen woord over de
//    betaling, waardoor mensen niet wisten of die was gelukt.
//
// Stripe stuurt alleen naar de success_url als de betaling is afgerond, dus
// een session_id in de URL is genoeg om "gelukt" te tonen.
import { Check } from 'lucide-react'

const STAPPEN = [
  { titel: 'Vul je intake in', tekst: 'Duurt ongeveer 10 minuten. Hiermee maken we jouw plan.' },
  { titel: 'Je account staat klaar', tekst: 'Aan het eind van de intake zie je hoe je inlogt in de app.' },
  { titel: 'Je coach gaat aan de slag', tekst: 'We maken je voedings- en trainingsplan en nemen contact met je op.' },
]

export default function BetalingGelukt({ onStart, knopTekst = 'Start je intake' }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 16px',
      paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
      paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
      boxSizing: 'border-box',
    }}>
      <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: '#10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 10px rgba(16,185,129,0.15)',
        }}>
          <Check size={50} strokeWidth={3.5} color="#fff" />
        </div>

        <h1 style={{
          margin: '1.75rem 0 0',
          fontSize: 'clamp(2rem, 9vw, 3rem)', fontWeight: 900, color: '#fff',
          letterSpacing: '-0.035em', lineHeight: 1.05,
        }}>
          Betaling gelukt
        </h1>
        <p style={{
          margin: '0.75rem 0 0', fontSize: '1rem', fontWeight: 700,
          color: 'rgba(255,255,255,0.7)', lineHeight: 1.5,
        }}>
          We hebben je betaling ontvangen. Je plek staat vast.
        </p>

        <div style={{
          marginTop: '2rem', width: '100%', textAlign: 'left',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{
            margin: '1.25rem 0 0.25rem', fontSize: '0.8rem', fontWeight: 900,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Wat nu
          </div>
          {STAPPEN.map((s, i) => (
            <div key={s.titel} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', padding: '0.75rem 0' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? '#fff' : 'rgba(255,255,255,0.1)',
                color: i === 0 ? '#000' : '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 900,
              }}>
                {i + 1}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{s.titel}</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, marginTop: 2 }}>{s.tekst}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onStart}
          style={{
            marginTop: '1.75rem', width: '100%', minHeight: 54,
            background: '#fff', color: '#000', border: 'none', borderRadius: 12,
            fontSize: '1.05rem', fontWeight: 900, fontFamily: 'inherit',
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}
        >
          {knopTekst} →
        </button>
      </div>
    </div>
  )
}
