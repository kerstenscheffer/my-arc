// src/components/WidgetSidebar.jsx
// Verticale floating sidebar — rechterrand van het scherm — in dezelfde
// stijl als de floating bottom-nav. Hosts quick-access knoppen voor
// floating widgets (notificaties, issues, content ideeën, etc.).
//
// Props:
//   buttons: [{ id, label, Icon, onClick, active?, badge?, color? }]
//   isMobile: bool
//
// Hoort op een vaste plek rechts onder zodat 't niet conflicteert met de
// floating bottom-nav. Iedere knop volgt dezelfde icon-on-top + label-below
// patroon als de bottom-nav voor visuele consistentie.

import React from 'react'

const GOLD = '#FFD700'

export default function WidgetSidebar({ buttons = [], isMobile = false }) {
  if (!buttons.length) return null

  return (
    <nav
      aria-label="Widgets"
      style={{
        position: 'fixed',
        right: isMobile ? 8 : 16,
        // Boven de bottom-nav uitkomen. Bottom-nav zit op 30px + ~64px hoog
        // + safe-area. Plus marge → ~120px van onderen.
        bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
        background: 'rgba(10, 10, 10, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 22,
        boxShadow: '0 18px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,215,0,0.04)',
        padding: isMobile ? '0.5rem 0.3rem' : '0.6rem 0.4rem',
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {buttons.map(btn => {
        const Icon = btn.Icon
        const isActive = !!btn.active
        const accent = btn.color || GOLD
        return (
          <button
            key={btn.id}
            onClick={btn.onClick}
            title={btn.label}
            aria-label={btn.label}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: isMobile ? '0.4rem 0.55rem' : '0.5rem 0.65rem',
              background: isActive ? `${accent}1a` : 'transparent',
              border: 'none',
              borderRadius: 14,
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: 44,
              minWidth: 44,
              transition: 'background 0.15s ease',
            }}
          >
            {Icon && (
              <Icon
                size={isMobile ? 20 : 22}
                color={isActive ? accent : 'rgba(255,255,255,0.42)'}
                strokeWidth={isActive ? 2.5 : 1.9}
              />
            )}
            <span style={{
              fontSize: isMobile ? '0.52rem' : '0.58rem',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? accent : 'rgba(255,255,255,0.35)',
              letterSpacing: '-0.01em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>
              {btn.label}
            </span>

            {/* Badge — kleine teller rechts boven bij open items */}
            {btn.badge != null && btn.badge > 0 && (
              <span style={{
                position: 'absolute',
                top: 2, right: 2,
                minWidth: 16, height: 16,
                padding: '0 4px',
                borderRadius: 8,
                background: accent,
                color: '#000',
                fontSize: '0.55rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
                {btn.badge > 99 ? '99+' : btn.badge}
              </span>
            )}

            {/* Secondary gold badge — top-left, voor "iets wacht op coach"
                signalen (bv. Claude-reacties op app_issues). */}
            {btn.goldBadge != null && btn.goldBadge > 0 && (
              <span style={{
                position: 'absolute',
                top: 2, left: 2,
                minWidth: 18, height: 18,
                padding: '0 5px',
                borderRadius: 9,
                background: '#FFD700',
                color: '#0a0a0a',
                fontSize: '0.6rem',
                fontWeight: 900,
                border: '1.5px solid #0a0a0a',
                boxShadow: '0 2px 6px rgba(255,215,0,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}>
                {btn.goldBadge > 99 ? '99+' : btn.goldBadge}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
