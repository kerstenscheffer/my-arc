// src/ui/Skelet.jsx
//
// Laden per blok, niet per pagina. Elk blok tekent eerst zijn eigen skelet
// (dezelfde maat als de inhoud) en vervaagt naar de inhoud zodra zijn data
// er is. Zo zie je de pagina staan terwijl de stukken binnenkomen, in plaats
// van één spinner en dan alles in één keer (Kersten, 9 okt 2026, naar het
// voorbeeld van Stripe).
//
//   <Sectie laden={!data} skelet={<SkeletKaart hoogte={92} />}>
//     <EchteKaart … />
//   </Sectie>
//
// Regels: een skelet heeft dezelfde hoogte als de inhoud (anders verspringt
// de pagina alsnog), en een blok dat al inhoud heeft blijft staan terwijl
// het ververst (laden={false} laten).

const PULS = '@keyframes skeletPuls { 0% { opacity: 0.55; } 50% { opacity: 0.9; } 100% { opacity: 0.55; } }'
const IN = '@keyframes skeletIn { from { opacity: 0; } to { opacity: 1; } }'

export function SkeletStijl() {
  return <style>{PULS + ' ' + IN}</style>
}

// Eén grijs vlak. breedte mag een getal (px) of een string ('42%') zijn.
export function SkeletBlok({ breedte = '100%', hoogte = 14, radius = 6, stijl = {} }) {
  return <div aria-hidden style={{ width: breedte, height: hoogte, borderRadius: radius, background: 'rgba(255,255,255,0.08)', flexShrink: 0, ...stijl }} />
}

// Een paar regels tekst, de laatste korter.
export function SkeletTekst({ regels = 3, hoogte = 12, gap = 8 }) {
  return (
    <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: regels }).map((_, i) => <SkeletBlok key={i} hoogte={hoogte} breedte={i === regels - 1 ? '55%' : '100%'} />)}
    </div>
  )
}

// Een kaart met foto links en twee regels rechts, zoals de klantkaart en de
// maaltijdkaart. hoogte = de hoogte van de echte kaart.
export function SkeletKaart({ hoogte = 92, foto = 64, radius = 14 }) {
  return (
    <div aria-hidden style={{ height: hoogte, borderRadius: radius, background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'stretch', overflow: 'hidden', animation: 'skeletPuls 1.4s ease-in-out infinite' }}>
      {foto > 0 && <div style={{ width: foto, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />}
      <div style={{ flex: 1, padding: '0.7rem 0.8rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <SkeletBlok breedte="42%" hoogte={14} />
          <SkeletBlok breedte={64} hoogte={18} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <SkeletBlok breedte={52} hoogte={20} /><SkeletBlok breedte={52} hoogte={20} /><SkeletBlok breedte={52} hoogte={20} />
        </div>
      </div>
    </div>
  )
}

// Grafiek: een lijn die al "getrokken" is in grijs, met assen.
export function SkeletGrafiek({ hoogte = 200 }) {
  return (
    <div aria-hidden style={{ height: hoogte, position: 'relative', animation: 'skeletPuls 1.4s ease-in-out infinite' }}>
      {[0.25, 0.5, 0.75].map(f => <div key={f} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, height: 1, background: 'rgba(255,255,255,0.06)' }} />)}
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M0,30 C15,28 20,18 35,20 S55,26 65,16 S85,12 100,10" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}

// Het blok zelf: skelet zolang `laden`, daarna de inhoud met een korte fade.
export function Sectie({ laden, skelet, children, stijl = {} }) {
  return (
    <div style={{ minWidth: 0, ...stijl }}>
      <SkeletStijl />
      {laden ? skelet : <div style={{ animation: 'skeletIn 0.28s ease' }}>{children}</div>}
    </div>
  )
}
