// src/modules/business-os/contentStatus.jsx
//
// Legenda en label voor de content-status (draft / ingepland / gepost /
// mislukt). Regel, kleuren en laden: contentStatusData.js.

import { STANDEN, standVak, kortGetal } from './contentStatusData'

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

export function StandChip({ stand, views }) {
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
