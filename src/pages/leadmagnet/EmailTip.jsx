// src/pages/leadmagnet/EmailTip.jsx
// Melding onder een e-mailveld bij een tikfout (gmail.con, gmial.com): "Bedoel
// je …?" met een knop die het adres verbetert. Verschijnt zodra iemand even
// stopt met typen of het veld verlaat, niet al halverwege het adres.
import { useEffect, useState } from 'react'
import { emailCheck } from './emailCheck'

export default function EmailTip({ email, onVerbeter, klaar = false }) {
  const [rustig, setRustig] = useState(false)
  useEffect(() => {
    setRustig(false)
    const t = setTimeout(() => setRustig(true), 900)
    return () => clearTimeout(t)
  }, [email])
  const { ok, suggestie } = emailCheck(email)
  if (ok || !suggestie || !(rustig || klaar)) return null
  return (
    <div role="alert" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
      padding: '0.65rem 0.8rem', borderRadius: 12, background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.45)', color: '#fff', fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.4,
    }}>
      <span>Bedoel je <strong style={{ fontWeight: 800 }}>{suggestie}</strong>?</span>
      <button type="button" onClick={() => onVerbeter(suggestie)} style={{
        border: 'none', borderRadius: 999, padding: '0.45rem 0.9rem', background: '#fff', color: '#000',
        fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
      }}>Ja, verbeter</button>
    </div>
  )
}
