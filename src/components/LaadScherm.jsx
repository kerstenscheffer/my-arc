// src/components/LaadScherm.jsx
// Het scherm terwijl een lazy geladen stuk (pagina, tabblad) binnenkomt.
//
// Duurt het langer dan 15 s, dan verschijnt een knop om opnieuw te laden
// (15 okt 2026). Eerst bleef een klant bij een haperende verbinding naar een
// draaiend rondje kijken tot hij de app afsloot.
import { useEffect, useState } from 'react'

export default function LaadScherm() {
  const [lang, setLang] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLang(true), 15000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', textAlign: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#fff', borderRadius: '50%', animation: 'laadspin 0.9s linear infinite' }} />
      <style>{'@keyframes laadspin { to { transform: rotate(360deg); } }'}</style>
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
