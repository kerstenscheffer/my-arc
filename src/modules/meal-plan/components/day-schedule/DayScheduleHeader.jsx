// src/modules/meal-plan/components/day-schedule/DayScheduleHeader.jsx
// 🎯 v2.1 - Green accent on key elements, like tracking uses gold
import React from 'react'
import { Calendar, Copy } from 'lucide-react'

export default function DayScheduleHeader({ dayTemplates, onOpenTemplate, isMobile, displayDate }) {
  // `displayDate` is the Date object for whichever day is currently selected
  // in the schedule. Falls back to today when omitted so existing call-sites
  // that never passed it keep their old behaviour.
  const dateToShow = displayDate instanceof Date ? displayDate : new Date()
  const todayMid = new Date(); todayMid.setHours(0, 0, 0, 0)
  const targetMid = new Date(dateToShow); targetMid.setHours(0, 0, 0, 0)
  const diffDays = Math.round((targetMid - todayMid) / (1000 * 60 * 60 * 24))
  let relativeLabel = null
  if (diffDays === 0) relativeLabel = 'Vandaag'
  else if (diffDays === -1) relativeLabel = 'Gisteren'
  else if (diffDays === 1) relativeLabel = 'Morgen'
  else if (diffDays < 0) relativeLabel = `${Math.abs(diffDays)} dagen terug`
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? '0.625rem 1rem' : '0.75rem 1.5rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      background: '#000'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <Calendar size={isMobile ? 14 : 16} color="#FFD700" strokeWidth={2} />
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{
            fontSize: isMobile ? '0.5rem' : '0.55rem',
            fontWeight: '700',
            color: 'rgba(255, 215, 0, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            lineHeight: 1,
            marginBottom: '0.1rem'
          }}>
            Dagschema {relativeLabel ? `· ${relativeLabel}` : ''}
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            fontWeight: '800',
            color: '#fff',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            {dateToShow.toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </div>
        </div>
      </div>

      {/* Altijd zichtbaar zodat de client de feature ontdekt — wanneer er
          geen templates klaar staan tonen we 'm disabled met een tooltip. */}
      {(() => {
        const hasTemplates = (dayTemplates || []).length > 0
        return (
          <button
            onClick={hasTemplates ? onOpenTemplate : undefined}
            disabled={!hasTemplates}
            title={hasTemplates
              ? 'Kies een dag-template om op deze dag toe te passen'
              : 'Nog geen dag-templates beschikbaar. Vraag je coach om er een aan te maken.'}
            style={{
              padding: isMobile ? '0.45rem 0.7rem' : '0.55rem 0.85rem',
              background: hasTemplates ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${hasTemplates ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '8px',
              color: hasTemplates ? '#FFD700' : 'rgba(255,255,255,0.25)',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: 800,
              cursor: hasTemplates ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: '36px',
              whiteSpace: 'nowrap',
            }}
          >
            <Copy size={isMobile ? 12 : 13} />
            {isMobile ? 'Template' : 'Kies dag-template'}
            {hasTemplates && (
              <span style={{
                marginLeft: 4,
                padding: '1px 5px',
                background: 'rgba(255,215,0,0.18)',
                borderRadius: 3,
                fontSize: '0.55rem', fontWeight: 800,
              }}>
                {dayTemplates.length}
              </span>
            )}
          </button>
        )
      })()}
    </div>
  )
}
