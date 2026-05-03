// src/modules/nutrition-intake/components/SubmitSection.jsx
// Submit + Success - no emojis, clean styling
import React from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

export default function SubmitSection({ onSubmit, isSubmitting, isSuccess, isMobile }) {

  if (isSuccess) {
    return (
      <div style={{ padding: r(isMobile, '3rem 1rem', '4rem 1.25rem'), textAlign: 'center' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: t.colors.green, color: '#fff',
          fontSize: '1.5rem', fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>{'\u2713'}</div>
        <div style={{ fontSize: r(isMobile, '1.1rem', '1.25rem'), fontWeight: 800, color: t.colors.white, marginBottom: '0.4rem' }}>Voorkeuren opgeslagen</div>
        <div style={{ fontSize: r(isMobile, '0.65rem', '0.7rem'), color: t.colors.textSecondary, lineHeight: 1.5, maxWidth: '320px', margin: '0 auto 1.5rem' }}>
          Je coach gaat nu aan de slag met jouw persoonlijke voedingsplan. Je ontvangt het plan in de app.
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column',
          maxWidth: '320px', margin: '0 auto',
          background: '#0a0a0a', borderRadius: isMobile ? '10px' : '12px',
          border: `1px solid ${t.colors.borderVisible}`, overflow: 'hidden'
        }}>
          {[
            { num: '1', text: 'Coach analyseert je voorkeuren' },
            { num: '2', text: 'Persoonlijk plan wordt gemaakt' },
            { num: '3', text: 'Je ontvangt het plan in de app' }
          ].map((step, i) => (
            <div key={step.num} style={{
              display: 'flex', alignItems: 'center', gap: r(isMobile, '0.6rem', '0.75rem'),
              padding: r(isMobile, '0.55rem 0.75rem', '0.65rem 1rem'),
              borderBottom: i < 2 ? `1px solid ${t.colors.border}` : 'none'
            }}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: t.colors.gold, color: '#000',
                fontSize: '0.6rem', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>{step.num}</div>
              <div style={{ fontSize: r(isMobile, '0.7rem', '0.75rem'), fontWeight: 600, color: t.colors.textSecondary }}>{step.text}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.5rem', fontSize: '0.5rem', color: t.colors.textMuted }}>
          Je kunt deze pagina nu sluiten
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: r(isMobile, '1rem', '1.25rem'), borderTop: `1px solid ${t.colors.border}` }}>
      <div style={{
        padding: r(isMobile, '0.4rem 0.6rem', '0.5rem 0.75rem'),
        background: t.colors.goldBg, borderRadius: '8px',
        marginBottom: r(isMobile, '0.75rem', '1rem'),
        fontSize: r(isMobile, '0.6rem', '0.65rem'),
        color: t.colors.textSecondary, textAlign: 'center'
      }}>
        Controleer of alles klopt. Je kunt later altijd aanpassen via je coach.
      </div>

      <button onClick={onSubmit} disabled={isSubmitting} style={{
        width: '100%', padding: r(isMobile, '0.8rem', '0.9rem'),
        fontSize: r(isMobile, '0.85rem', '0.9rem'), fontWeight: 800,
        color: '#000', background: isSubmitting ? 'rgba(255,215,0,0.5)' : t.colors.gold,
        border: 'none', borderRadius: '8px',
        cursor: isSubmitting ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        minHeight: '48px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'all 0.2s ease'
      }}>
        {isSubmitting ? (
          <>
            <div style={{
              width: '16px', height: '16px', border: '2px solid #000',
              borderTopColor: 'transparent', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            Opslaan...
          </>
        ) : 'VOORKEUREN OPSLAAN'}
      </button>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
