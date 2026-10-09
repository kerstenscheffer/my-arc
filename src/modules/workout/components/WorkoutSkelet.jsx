// src/modules/workout/components/WorkoutSkelet.jsx
//
// Laden zoals op de maaltijdpagina: geen spinner, maar de vorm van de pagina
// die al staat terwijl de training binnenkomt (Kersten, 9 okt 2026). Zelfde
// maten als de echte blokken, anders verspringt de pagina alsnog.
import { SkeletStijl, SkeletBlok } from '../../../ui/Skelet'

const PULS = { animation: 'skeletPuls 1.4s ease-in-out infinite' }

// De kop van de dag (foto 200/250 hoog) met de kaart eronder: titel, een
// regel cijfers en de knop. Gebruikt door TodaysWorkoutMain bij de eerste keer laden.
export function WorkoutKopSkelet({ isMobile }) {
  const pad = isMobile ? '0 1rem' : '0 1.5rem'
  return (
    <div aria-hidden>
      <SkeletStijl />
      <div style={{ position: 'relative', height: isMobile ? 200 : 250, background: 'rgba(255,255,255,0.04)', ...PULS }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0) 40%, #0a0a0a 100%)' }} />
      </div>
      <div style={{ padding: pad, marginTop: isMobile ? -46 : -56, position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SkeletBlok breedte="58%" hoogte={isMobile ? 26 : 32} radius={8} />
        <div style={{ display: 'flex', gap: 14 }}>
          {[0, 1, 2].map(i => <SkeletBlok key={i} breedte={64} hoogte={14} />)}
        </div>
        <SkeletBlok hoogte={48} radius={12} stijl={{ marginTop: 6 }} />
      </div>
    </div>
  )
}

// De hele pagina: de zwarte balk (Kracht / Historie), de kop van de dag en
// het weekschema met zeven dagen. Voor zolang de code van de pagina laadt.
export function WorkoutPaginaSkelet({ isMobile }) {
  const pad = isMobile ? '0 1rem' : '0 1.5rem'
  return (
    <div aria-hidden style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <SkeletStijl />
      <div style={{ height: isMobile ? 40 : 48, paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, boxSizing: 'content-box', borderBottom: '1px solid rgba(255,255,255,0.12)' }} />
      <WorkoutKopSkelet isMobile={isMobile} />
      <div style={{ padding: pad, marginTop: isMobile ? '3.5rem' : '4.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SkeletBlok breedte="42%" hoogte={18} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: isMobile ? 6 : 10 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: isMobile ? 76 : 96, borderRadius: 12, background: '#141414', border: '1px solid rgba(255,255,255,0.08)', ...PULS }} />
          ))}
        </div>
      </div>
    </div>
  )
}
