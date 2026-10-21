// src/client/PaginaSkeletten.jsx
//
// De vorm van elke klantpagina terwijl hij laadt, op één plek. Klein en niet
// lazy: ClientDashboard toont deze al terwijl de code van de pagina nog
// binnenkomt, en de pagina zelf gebruikt dezelfde terwijl zijn data laadt.
// Zo zie je van begin tot eind één en hetzelfde skelet in plaats van eerst
// een icoon en dan nog een ander scherm (Kersten, 21 okt 2026). Maten gelijk
// aan de echte blokken, anders verspringt de pagina alsnog.
import { SkeletStijl, SkeletBlok, SkeletKaart, SkeletGrafiek } from '../ui/Skelet'
import { WorkoutPaginaSkelet } from '../modules/workout/components/WorkoutSkelet'

const PULS = { animation: 'skeletPuls 1.4s ease-in-out infinite' }

export const SHOPPING_BANNER_URL = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=700&fit=crop&q=80'

// Home: zwarte balk, de foto, begroeting met datum en de dagagenda.
export function HomeSkelet({ isMobile }) {
  return (
    <div aria-hidden style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <SkeletStijl />
      <div style={{ height: isMobile ? 34 : 40, paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0, boxSizing: 'content-box' }} />
      <div style={{ width: '100%', aspectRatio: '49 / 11', background: 'rgba(255,255,255,0.04)', ...PULS }} />
      <div style={{ padding: isMobile ? '0.1rem 1rem 0' : '0.25rem 1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <SkeletBlok breedte={isMobile ? 190 : 260} hoogte={isMobile ? 20 : 28} radius={7} />
        <SkeletBlok breedte={110} hoogte={12} />
      </div>
      <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', marginTop: isMobile ? '0.6rem' : '0.9rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2, 3, 4].map(i => <SkeletKaart key={i} hoogte={64} foto={56} radius={12} />)}
      </div>
    </div>
  )
}

// Voeding: kop met foto, macro's, maaltijden. Ligt vast over het scherm,
// net als de pagina zelf.
export function MaaltijdSkelet({ isMobile }) {
  return (
    <div aria-hidden style={{ position: 'fixed', inset: 0, height: '100dvh', zIndex: 1, background: '#0a0a0a', overflow: 'hidden' }}>
      <SkeletStijl />
      <div style={{ height: isMobile ? 40 : 48, borderBottom: '1px solid rgba(255,255,255,0.06)' }} />
      <div style={{ height: isMobile ? 190 : 230, background: 'rgba(255,255,255,0.04)', ...PULS }} />
      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.9rem 1rem' }}>
        {[0, 1, 2, 3].map(i => <SkeletBlok key={i} breedte={44} hoogte={44} radius={22} />)}
      </div>
      <div style={{ padding: isMobile ? '0 0.6rem' : '0 1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2, 3].map(i => <SkeletKaart key={i} hoogte={72} foto={64} radius={12} />)}
      </div>
    </div>
  )
}

// Boodschappen: de echte bannerfoto meteen, daaronder de balk Deze dag /
// Hele week, de titel en een paar categorieën met regels.
export function BoodschappenSkelet({ isMobile }) {
  const zij = isMobile ? '1rem' : '1.5rem'
  const lijn = '1px solid rgba(255,255,255,0.1)'
  return (
    <div aria-hidden style={{ background: '#0a0a0a', minHeight: '100vh' }}>
      <SkeletStijl />
      <div style={{ position: 'relative', height: isMobile ? 124 : 165 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${SHOPPING_BANNER_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.12) 18%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.88) 72%, #0a0a0a 100%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: isMobile ? 10 : 14, display: 'flex', justifyContent: 'center' }}>
          <SkeletBlok breedte={isMobile ? 150 : 190} hoogte={isMobile ? 22 : 26} radius={8} />
        </div>
      </div>
      <div style={{ height: isMobile ? 44 : 48, borderBottom: lijn, margin: isMobile ? '0.25rem 0 0' : '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: 16, padding: `0 ${zij}` }}>
        <SkeletBlok breedte={70} hoogte={14} /><SkeletBlok breedte={70} hoogte={14} />
        <div style={{ flex: 1 }} />
        <SkeletBlok breedte={48} hoogte={14} /><SkeletBlok breedte={56} hoogte={14} />
      </div>
      <div style={{ padding: `0 ${zij}`, marginTop: isMobile ? '0.9rem' : '1.1rem' }}>
        <SkeletBlok breedte="52%" hoogte={isMobile ? 22 : 26} radius={7} />
      </div>
      {[5, 4, 3].map((regels, c) => (
        <div key={c} style={{ marginTop: isMobile ? '1.4rem' : '1.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: `0 ${zij} 0.55rem`, borderBottom: lijn }}>
            <SkeletBlok breedte="34%" hoogte={18} />
            <div style={{ flex: 1 }} />
            <SkeletBlok breedte={34} hoogte={34} radius={10} /><SkeletBlok breedte={34} hoogte={34} radius={10} />
          </div>
          {Array.from({ length: regels }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: `0 ${zij}`, borderBottom: i < regels - 1 ? lijn : 'none', ...PULS }}>
              <SkeletBlok breedte={22} hoogte={22} radius={11} />
              <SkeletBlok breedte={`${46 + ((i * 17) % 30)}%`} hoogte={13} />
              <div style={{ flex: 1 }} />
              <SkeletBlok breedte={46} hoogte={13} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// Voortgang: groot getal, grafiek, twee kaarten.
export function VoortgangSkelet({ isMobile }) {
  return (
    <div aria-hidden style={{ maxWidth: '1000px', margin: '0 auto', padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SkeletStijl />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, ...PULS }}>
        <SkeletBlok breedte={120} hoogte={44} radius={8} /><SkeletBlok breedte={80} hoogte={18} />
      </div>
      <SkeletGrafiek hoogte={isMobile ? 180 : 220} />
      <SkeletKaart hoogte={88} foto={0} /><SkeletKaart hoogte={88} foto={0} />
    </div>
  )
}

// Calls, profiel en agenda: een titel en een paar kaarten.
export function LijstSkelet({ isMobile }) {
  return (
    <div aria-hidden style={{ minHeight: '100vh', background: '#0a0a0a', padding: isMobile ? '1rem' : '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SkeletStijl />
      <SkeletBlok breedte="45%" hoogte={isMobile ? 24 : 30} radius={8} stijl={{ marginTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0 }} />
      <SkeletBlok breedte="30%" hoogte={12} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
        {[0, 1, 2, 3].map(i => <SkeletKaart key={i} hoogte={76} foto={0} radius={12} />)}
      </div>
    </div>
  )
}

// Het skelet per pagina-id van ClientDashboard.
export function PaginaSkelet({ pagina, isMobile }) {
  if (pagina === 'home') return <HomeSkelet isMobile={isMobile} />
  if (pagina === 'workout') return <WorkoutPaginaSkelet isMobile={isMobile} />
  if (pagina === 'meal') return <MaaltijdSkelet isMobile={isMobile} />
  if (pagina === 'boodschappen') return <BoodschappenSkelet isMobile={isMobile} />
  if (pagina === 'tracking') return <VoortgangSkelet isMobile={isMobile} />
  return <LijstSkelet isMobile={isMobile} />
}
