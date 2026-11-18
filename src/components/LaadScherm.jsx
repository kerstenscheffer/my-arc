// src/components/LaadScherm.jsx
// Het scherm terwijl een lazy geladen stuk (pagina, tabblad) binnenkomt.
//
// Duurt het langer dan 15 s, dan verschijnt een knop om opnieuw te laden
// (15 okt 2026). Eerst bleef een klant bij een haperende verbinding naar een
// draaiend rondje kijken tot hij de app afsloot.
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const GAT = 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))'

// inline: alleen voor het voorbeeld op /test; anders vast over het hele scherm,
// net als .loading-container in index.html, zodat het logo niet verspringt.
export default function LaadScherm({ inline = false }) {
  const [lang, setLang] = useState(false)
  // Op de klok zetten via startTime: 4800 ms is een veelvoud van beide rondes
  // (1,6 s en 2,4 s). Een animation-delay werkt hier niet: die telt vanaf het
  // eerste tekenen, en dat liep bij het opstarten tot 0,3 s achter (gemeten
  // 18 nov 2026), precies de sprong die je zag.
  const boog = useRef(null)
  const glans = useRef(null)
  useLayoutEffect(() => {
    try {
      const start = -(performance.timeOrigin % 4800)
      for (const el of [boog.current, glans.current]) el?.getAnimations().forEach(a => { a.startTime = start })
    } catch { /* oude browser: dan loopt hij los van de klok */ }
  }, [])
  useEffect(() => {
    const t = setTimeout(() => setLang(true), 15000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ ...(inline ? { minHeight: '100%' } : { position: 'fixed', inset: 0, zIndex: 1 }), background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textAlign: 'center' }}>
      {/* Boog met staart + lichtstreep over het logo (Kersten, 18 nov 2026).
          Zelfde opbouw als het eerste scherm in index.html. Loopt op de klok:
          dit scherm wordt bij het opstarten een paar keer opnieuw neergezet en
          gaat dan verder waar het was, in plaats van weer op 0 te beginnen. */}
      <div style={{ position: 'relative', width: 150, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div ref={boog} style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 150deg, #fff 360deg)',
          WebkitMaskImage: GAT, maskImage: GAT,
          animation: 'laadspin 1.6s linear infinite', willChange: 'transform',
        }} />
        <div style={{
          position: 'relative', width: 104, height: 52, overflow: 'hidden', background: 'rgba(255,255,255,0.5)',
          WebkitMask: 'url(/ma-logo-header.png) center / contain no-repeat', mask: 'url(/ma-logo-header.png) center / contain no-repeat',
        }}>
          <i ref={glans} style={{
            position: 'absolute', top: 0, bottom: 0, left: 0, width: '45%',
            background: 'linear-gradient(105deg, rgba(255,255,255,0), #fff, rgba(255,255,255,0))',
            animation: 'laadglans 2.4s linear infinite', willChange: 'transform',
          }} />
        </div>
      </div>
      <style>{'@keyframes laadspin { to { transform: rotate(360deg); } } @keyframes laadglans { from { transform: translateX(-120%); } to { transform: translateX(340%); } }'}</style>
      {lang && (
        <>
          <div style={{ marginTop: 20, fontSize: 15, fontWeight: 800, color: '#fff' }}>Dit duurt langer dan normaal</div>
          <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', maxWidth: 280, lineHeight: 1.45 }}>
            Controleer je internet, of probeer het opnieuw.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16, minHeight: 44, padding: '0 1.4rem', borderRadius: 12, border: 'none',
              background: '#fff', color: '#0a0a0a', fontSize: 15, fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            Opnieuw proberen
          </button>
        </>
      )}
    </div>
  )
}
