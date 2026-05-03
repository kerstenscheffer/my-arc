// src/modules/nutrition-intake/components/ProgressBar.jsx
// Hoofd tabs (INTRO / GEGEVENS / VOEDING / TRAINING / KLAAR)
// + sub-tabs als compacte pills met gouden checkmarks

import React from 'react'

export default function ProgressBar({ sections, currentSection, completedSections = [], subTabs = [], currentSubTab, isMobile }) {

  return (
    <div style={{
      position: 'sticky', top: isMobile ? '41px' : '49px', zIndex: 40,
      background: '#000',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>

      {/* ── Hoofd tabs ── */}
      <div style={{
        display: 'flex', overflowX: 'auto',
        padding: isMobile ? '0 0.75rem' : '0 1.5rem',
        gap: 0,
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}>
        {sections.map((section, i) => {
          const isActive    = i === currentSection
          const isCompleted = completedSections.includes(i)
          return (
            <div key={section.id || i} style={{
              padding: isMobile ? '0.65rem 0.75rem' : '0.7rem 1rem',
              fontSize: isMobile ? '0.55rem' : '0.58rem',
              fontWeight: isActive ? 800 : 600,
              color: isActive ? '#FFD700' : isCompleted ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              cursor: 'default',
              position: 'relative',
              flexShrink: 0,
              transition: 'color 0.2s ease',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
            }}>
              {isCompleted && !isActive && (
                <span style={{ color: '#FFD700', fontSize: '0.5rem' }}>✓</span>
              )}
              {section.label || section.title || section}
              {/* Gouden streep onderaan actieve tab */}
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: 0, left: isMobile ? '0.75rem' : '1rem', right: isMobile ? '0.75rem' : '1rem',
                  height: '2px', background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                  borderRadius: '1px 1px 0 0',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Sub-voortgang — geen pills, gewoon dots + label ── */}
      {subTabs.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1.5rem',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          {subTabs.map((tab, i) => {
            const isActive    = tab.id === currentSubTab
            const isCompleted = tab.completed
            return (
              <React.Fragment key={tab.id || i}>
                <div style={{
                  width: isActive ? '16px' : '5px',
                  height: '3px',
                  borderRadius: '2px',
                  background: isCompleted
                    ? '#FFD700'
                    : isActive
                      ? 'rgba(255,215,0,0.5)'
                      : 'rgba(255,255,255,0.08)',
                  transition: 'all 0.25s ease',
                  flexShrink: 0,
                }} />
              </React.Fragment>
            )
          })}
          {/* Huidig label */}
          {currentSubTab && (
            <span style={{
              fontSize: isMobile ? '0.5rem' : '0.52rem',
              fontWeight: 700,
              color: 'rgba(255,215,0,0.5)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginLeft: '0.25rem',
            }}>
              {subTabs.find(t => t.id === currentSubTab)?.label}
            </span>
          )}
        </div>
      )}

    </div>
  )
}
