// src/modules/business-os/contentStatus.jsx
//
// Legenda en label voor de content-status (draft / ingepland / gepost /
// mislukt). Regel, kleuren en laden: contentStatusData.js.
// Niet gepost (goedgekeurd in Metricool, niet live gegaan) is een rood label
// zonder kader; NietGepostKnop opent de post in Metricool.

import { STANDEN, standVak, kortGetal, openItem, NIET_GEPOST, NIET_GEPOST_LABEL, NIET_GEPOST_KLEUR } from './contentStatusData'

export function StandLegenda({ style }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px', ...style }}>
      {STANDEN.map(s => (
        <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.75)' }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, boxSizing: 'border-box', ...standVak(s.id) }} />
          {s.label}
        </span>
      ))}
    </div>
  )
}

export function NietGepostLabel({ style }) {
  return (
    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', color: NIET_GEPOST_KLEUR, ...style }}>{NIET_GEPOST_LABEL}</span>
  )
}

// it = kalender-item met metricoolLink (en contentId als terugval).
export function NietGepostKnop({ it, style }) {
  return (
    <button type="button" title="Open in Metricool" onClick={(e) => { e.stopPropagation(); openItem(it) }} style={{
      flexShrink: 0, minHeight: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
    }}>
      <NietGepostLabel style={style} />
    </button>
  )
}

export function StandChip({ stand, views }) {
  if (stand === NIET_GEPOST) return <NietGepostLabel />
  const s = STANDEN.find(x => x.id === stand) || STANDEN[0]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, flexShrink: 0,
      fontSize: 10.5, fontWeight: 900, whiteSpace: 'nowrap', boxSizing: 'border-box', ...standVak(s.id),
    }}>
      {s.label}{stand === 'gepost' && views ? ` · ${kortGetal(views)} views` : ''}
    </span>
  )
}
