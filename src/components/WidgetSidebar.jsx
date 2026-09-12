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
// floating bottom-nav. Alleen iconen, tegen de rand geplakt: met labels
// eronder was het een blok van 60px breed dat over de pagina viel. Het label
// blijft als title/aria-label voor wie erop blijft staan of een schermlezer
// gebruikt.

import React from 'react'

const GOLD = '#FFD700'

export default function WidgetSidebar({ buttons = [], isMobile = false }) {
  if (!buttons.length) return null

  return (
    <nav
      aria-label="Widgets"
      style={{
        position: 'fixed',
        right: 0,
        // Boven de bottom-nav uitkomen. Bottom-nav zit op 30px + ~64px hoog
        // + safe-area. Plus marge → ~120px van onderen.
        bottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
        // Smal randje tegen de zijkant: alleen iconen, geen labels en geen
        // kader per knop. Met tekst eronder was het een blok van 60px breed
        // dat over de pagina viel.
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRight: 'none',
        borderRadius: '14px 0 0 14px',
        boxShadow: '-6px 10px 30px rgba(0,0,0,0.55)',
        padding: 3,
        zIndex: 99,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {buttons.map((btn, i) => {
        const Icon = btn.Icon
        const isActive = !!btn.active
        const accent = btn.color || GOLD
        return (
          <React.Fragment key={btn.id}>
            {i > 0 && (
              <div style={{ height: 1, margin: '0 6px', background: 'rgba(255,255,255,0.08)' }} />
            )}
            <button
              onClick={btn.onClick}
              title={btn.label}
              aria-label={btn.label}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: isMobile ? 40 : 44, height: isMobile ? 40 : 44,
                padding: 0,
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none', borderRadius: 11,
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              {Icon && (
                <Icon
                  size={isMobile ? 18 : 19}
                  color={isActive ? '#fff' : 'rgba(255,255,255,0.5)'}
                  strokeWidth={isActive ? 2.6 : 2}
                />
              )}

              {/* Teller rechtsboven op het icoon. */}
              {btn.badge != null && btn.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 3, right: 3,
                  minWidth: 15, height: 15, padding: '0 3px',
                  borderRadius: 8,
                  background: accent, color: '#000',
                  fontSize: '0.52rem', fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                }}>
                  {btn.badge > 99 ? '99+' : btn.badge}
                </span>
              )}
            </button>
          </React.Fragment>
        )
      })}
    </nav>
  )
}
