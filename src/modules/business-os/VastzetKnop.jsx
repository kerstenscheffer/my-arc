// src/modules/business-os/VastzetKnop.jsx
//
// Kleine knop onder een antwoord van Gino: één klik bewaart de tekst als notitie.
// Staat die tekst al in de notities, dan toont hij Vastgezet.

import { useState } from 'react'
import { Pin, Check } from 'lucide-react'
import { colors } from '../../ui/tokens'
import { notitieTekst } from './notitiesData'

export default function VastzetKnop({ tekst, titel = null, vastgezet, onVastzetten }) {
  const [staat, setStaat] = useState(null) // 'bezig' | 'fout'
  const schoon = notitieTekst(tekst)
  if (!schoon || !onVastzetten) return null
  const klaar = !!vastgezet?.has(schoon)
  const klik = async () => {
    if (klaar || staat === 'bezig') return
    setStaat('bezig')
    const ok = await onVastzetten({ tekst: schoon, titel })
    setStaat(ok ? null : 'fout')
  }
  return (
    <button type="button" onClick={klik} disabled={klaar || staat === 'bezig'} title={klaar ? 'Staat in Notities' : 'Bewaar in Notities'} style={{
      display: 'inline-flex', gap: 4, alignItems: 'center', minHeight: 24, background: 'none', border: 'none', padding: '4px 0', fontFamily: 'inherit',
      color: staat === 'fout' ? colors.danger : klaar ? colors.success : colors.textSecondary,
      fontWeight: 800, fontSize: '0.72rem', cursor: klaar ? 'default' : 'pointer',
    }}>
      {klaar ? <Check size={12} strokeWidth={2.8} /> : <Pin size={12} strokeWidth={2.6} />}
      {staat === 'fout' ? 'Mislukt, opnieuw' : klaar ? 'Vastgezet' : staat === 'bezig' ? 'Bezig…' : 'Vastzetten'}
    </button>
  )
}
