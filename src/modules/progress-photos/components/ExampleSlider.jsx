// src/modules/progress-photos/components/ExampleSlider.jsx
// v3.0 - ONLY PROGRESS TYPE - Coach example photos
// Shows coach's example photos so clients know how to pose
// Props IDENTIEK: { isMobile }

import React, { useState } from 'react'
import { Camera, Eye, X } from 'lucide-react'

// Coach example photos — hardcoded URLs
const EXAMPLES = [
  {
    url: 'https://i.ibb.co/RGwZwgmx/Scherm-afbeelding-2026-03-06-om-14-05-31.png',
    label: 'Voorbeeld 1'
  },
  {
    url: 'https://i.ibb.co/1tZQFQvb/Scherm-afbeelding-2026-03-06-om-14-05-50.png',
    label: 'Voorbeeld 2'
  }
]

export default function ExampleSlider({ isMobile = false }) {
  const [showModal, setShowModal] = useState(false)
  const [activeExample, setActiveExample] = useState(0)

  return (
    <div>
      {/* ── EXAMPLE TRIGGER BAR — flush, compact ── */}
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.4rem' : '0.5rem',
          padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
          background: 'rgba(255, 215, 0, 0.04)',
          border: 'none',
          borderBottom: '1px solid rgba(255, 215, 0, 0.08)',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          textAlign: 'left'
        }}
        onTouchStart={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 215, 0, 0.08)' }}
        onTouchEnd={(e) => { if (isMobile) e.currentTarget.style.background = 'rgba(255, 215, 0, 0.04)' }}
      >
        <Eye size={isMobile ? 13 : 14} color="#FFD700" style={{ opacity: 0.5, flexShrink: 0 }} />
        <span style={{
          fontSize: isMobile ? '0.6rem' : '0.65rem',
          fontWeight: '700',
          color: 'rgba(255, 215, 0, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          Bekijk voorbeelden van je coach
        </span>

        {/* Mini previews */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: '3px',
          flexShrink: 0
        }}>
          {EXAMPLES.map((ex, i) => (
            <div key={i} style={{
              width: isMobile ? '24px' : '28px',
              height: isMobile ? '24px' : '28px',
              borderRadius: '4px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 215, 0, 0.15)'
            }}>
              <img
                src={ex.url}
                alt={ex.label}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </button>

      {/* ── EXAMPLE MODAL — fullscreen overlay ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '1rem' : '2rem'
          }}
        >
          {/* Close */}
          <button
            onClick={() => setShowModal(false)}
            style={{
              position: 'absolute',
              top: isMobile ? '0.75rem' : '1rem',
              right: isMobile ? '0.75rem' : '1rem',
              width: '36px', height: '36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10
            }}
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: isMobile ? '1rem' : '1.5rem'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', marginBottom: '0.375rem'
            }}>
              <Camera size={16} color="#FFD700" />
              <span style={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '800', color: '#FFD700',
                textTransform: 'uppercase', letterSpacing: '0.03em'
              }}>
                Zo maak je progress foto's
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.4)',
              fontWeight: '500'
            }}>
              Gebruik dezelfde plek en belichting, elke vrijdag
            </div>
          </div>

          {/* Photo selector tabs */}
          <div style={{
            display: 'flex',
            gap: '2px',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveExample(i) }}
                style={{
                  padding: isMobile ? '0.4rem 0.75rem' : '0.45rem 1rem',
                  background: activeExample === i ? '#FFD700' : 'transparent',
                  border: 'none',
                  color: activeExample === i ? '#000' : 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.6rem' : '0.65rem',
                  fontWeight: activeExample === i ? '800' : '600',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Active photo — large view */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: isMobile ? '100%' : '500px',
              width: '100%',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid rgba(255, 215, 0, 0.15)'
            }}
          >
            <img
              src={EXAMPLES[activeExample].url}
              alt={EXAMPLES[activeExample].label}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </div>

          {/* Tips */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginTop: isMobile ? '0.75rem' : '1rem',
              maxWidth: isMobile ? '100%' : '500px',
              width: '100%',
              padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
              background: 'rgba(255, 215, 0, 0.06)',
              border: '1px solid rgba(255, 215, 0, 0.1)',
              borderRadius: '8px'
            }}
          >
            <div style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              fontWeight: '700', color: 'rgba(255, 215, 0, 0.5)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '0.3rem'
            }}>
              Tips
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: 1.4
            }}>
              Neem full body foto's van voren en opzij. Gebruik dezelfde plek, zelfde belichting, en draag passende kleding zodat je progressie goed zichtbaar is.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
