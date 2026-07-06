// src/modules/lead-management/components/LeadMoreMenu.jsx
// Gedeeld "Meer"-menu voor de lead-module: view-switcher (Kanban/Overzicht/…)
// + SOP. Gebruikt in de kanban-toolbar (op de kanban-view) én als terug-nav op
// de andere views, zodat je altijd kunt navigeren.

import React, { useState } from 'react'
import { MoreHorizontal, ChevronDown, BookOpen } from 'lucide-react'

const GOLD = '#FFD700'

export default function LeadMoreMenu({ views = [], activeView, onSelect, onOpenSOP, isMobile, align = 'right' }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button onClick={() => setOpen(o => !o)} title="Meer"
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '0.4rem 0.6rem', minHeight: 30,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.68rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', whiteSpace: 'nowrap',
        }}>
        <MoreHorizontal size={16} /> Meer
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 2147483646 }} />
          <div style={{ position: 'absolute', top: '100%', [align === 'left' ? 'left' : 'right']: 0, marginTop: 4, zIndex: 2147483647, background: '#141414', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 10, overflow: 'hidden', minWidth: 200, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
            {views.map(v => {
              const Icon = v.icon
              const isAct = activeView === v.id
              return (
                <button key={v.id} onClick={() => { onSelect?.(v.id); setOpen(false) }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', background: isAct ? 'rgba(255,215,0,0.12)' : 'transparent', border: 'none', color: isAct ? GOLD : 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: isAct ? 800 : 600, cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                  {Icon && <Icon size={14} style={{ opacity: 0.8, flexShrink: 0 }} />} {v.label}
                </button>
              )
            })}
            {onOpenSOP && (
              <button onClick={() => { onOpenSOP(); setOpen(false) }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.85rem', background: 'transparent', border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', textAlign: 'left', touchAction: 'manipulation' }}>
                <BookOpen size={14} style={{ opacity: 0.8, flexShrink: 0 }} /> SOP
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
