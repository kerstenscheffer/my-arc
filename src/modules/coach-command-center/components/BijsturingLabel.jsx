// Label rechtsboven de klantkaart: laatste punt + bijsturing, in de kleur van
// hoe het gaat. Hover (of tik) klapt het uit naar de volledige regel.
import React, { useState } from 'react'
import { colors, radius, space } from '../../../ui/tokens'
import { STATUS_KLEUR, STATUS_NAAM } from '../bijsturing'

const datumKort = (iso) => new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })

export default function BijsturingLabel({ b }) {
  const [open, setOpen] = useState(false)
  if (!b) return null
  const kleur = STATUS_KLEUR[b.status] || colors.textPrimary
  const kort = b.bijsturing ? `${b.punt} → ${b.bijsturing}` : b.punt
  return (
    // Half over, half onder de bovenrand (Kersten, 25 nov): hoogte 22, dus
    // -11 eronder. Rechts 58 vrij voor het video-rondje op de rand.
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 58, marginBottom: -11, position: 'relative', zIndex: open ? 30 : 5 }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        title={kort}
        style={{
          maxWidth: '85%', height: 22, padding: '0 8px', borderRadius: radius.pill, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 5,
          background: `linear-gradient(${kleur}26, ${kleur}26), #0a0a0a`, border: `1px solid ${kleur}88`, color: colors.textPrimary,
          fontSize: 12, fontWeight: 900, lineHeight: 1,
        }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, flexShrink: 0, background: kleur }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{kort}</span>
      </button>
      {open && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: '100%', right: 0, marginTop: space[1], width: 'min(320px, 90vw)',
          padding: space[3], borderRadius: radius.btn, background: colors.surface,
          border: `1px solid ${kleur}66`, boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column', gap: space[2], cursor: 'default',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: space[2], fontSize: 13, fontWeight: 900, color: kleur }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: kleur }} />
            {STATUS_NAAM[b.status] || 'Status'}
            <span style={{ marginLeft: 'auto', color: colors.textSecondary, fontWeight: 800 }}>
              {datumKort(b.datum)}{b.bron === 'gino' ? ' · Gino' : ''}
            </span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary, lineHeight: 1.4 }}>{b.punt}</div>
          {b.bijsturing && (
            <div style={{ fontSize: 15, fontWeight: 800, color: colors.textPrimary, lineHeight: 1.4 }}>→ {b.bijsturing}</div>
          )}
          {b.details && <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{b.details}</div>}
        </div>
      )}
    </div>
  )
}
