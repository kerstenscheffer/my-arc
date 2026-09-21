// src/modules/coach-command-center/components/insight/KopKeuze.jsx
//
// Een kop die tegelijk de keuze is: je leest wat er staat en klikt erop om het
// te veranderen. Vervangt de rijen pillen die hier stonden — acht knoppen voor
// twee keuzes is acht dingen om te lezen.
//
// De echte select ligt onzichtbaar over de tekst, zodat je het keuzemenu van
// het toestel zelf krijgt en het scherm er geen vakje bij krijgt.

import { ChevronDown } from 'lucide-react'

export default function KopKeuze({ waarde, opties, onKies, groot = false, kleur = '#fff' }) {
  const huidig = opties.find(o => o.id === waarde)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
      <span style={{
        fontSize: groot ? '0.9rem' : '0.78rem', fontWeight: 900, color: kleur,
        letterSpacing: '-0.02em', whiteSpace: 'nowrap',
      }}>
        {huidig?.label || opties[0]?.label}
      </span>
      <ChevronDown size={groot ? 14 : 12} strokeWidth={3} color="rgba(255,255,255,0.45)" />
      <select
        value={waarde ?? ''}
        onChange={(e) => onKies(e.target.value)}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          opacity: 0, cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
          border: 'none', background: 'transparent', fontFamily: 'inherit',
        }}
      >
        {opties.map(o => (
          <option key={o.id} value={o.id} style={{ background: '#0a0a0a', color: '#fff' }}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  )
}
