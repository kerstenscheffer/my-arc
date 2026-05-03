// src/modules/shopping/components/SavingsBar.jsx - SAVINGS DISPLAY BAR
import React from 'react'

export default function SavingsBar({ savings, isMobile }) {
  if (!savings) return null

  const progressPercent = savings.baseline > 0
    ? Math.round((savings.planCost / savings.baseline) * 100)
    : 100

  return (
    <div style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
    }}>
      {/* Top label row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.5rem 0.75rem 0.25rem' : '0.625rem 1rem 0.3rem'
      }}>
        <span style={{
          fontSize: '0.4rem',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em'
        }}>
          Je bespaart
        </span>
        <span style={{
          fontSize: isMobile ? '0.55rem' : '0.6rem',
          fontWeight: 600,
          color: 'rgba(255, 255, 255, 0.25)'
        }}>
          €{savings.planCost} van €{savings.baseline}
        </span>
      </div>

      {/* Big savings number */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '0.5rem',
        padding: isMobile ? '0 0.75rem 0.375rem' : '0 1rem 0.5rem'
      }}>
        <span style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: 800,
          color: '#10b981',
          letterSpacing: '-0.03em',
          lineHeight: 1
        }}>
          €{savings.weekly}
        </span>
        <span style={{
          fontSize: '0.4rem',
          fontWeight: 500,
          color: 'rgba(255, 255, 255, 0.3)'
        }}>
          /week
        </span>

        <div style={{ flex: 1 }} />

        <span style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: 800,
          color: 'rgba(16, 185, 129, 0.6)'
        }}>
          -{savings.percentSaved}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height: '3px',
        background: 'rgba(255, 255, 255, 0.04)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${Math.min(progressPercent, 100)}%`,
          background: '#10b981',
          borderRadius: '0 2px 2px 0',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Projection stats */}
      <div style={{ display: 'flex' }}>
        {[
          { label: 'Per maand', value: `€${savings.monthly}` },
          { label: 'Per jaar', value: `€${savings.yearly}` },
          { label: '5 jaar', value: `€${savings.fiveYear}` },
          { label: '10 jaar', value: `€${savings.tenYear}` }
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            padding: isMobile ? '0.375rem 0.125rem' : '0.5rem 0.25rem',
            borderRight: i < 3 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
          }}>
            <div style={{
              fontSize: '0.4rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.15)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.1rem'
            }}>
              {s.label}
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.75rem',
              fontWeight: 800,
              color: 'rgba(16, 185, 129, 0.7)',
              lineHeight: 1
            }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
