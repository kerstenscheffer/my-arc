// src/modules/nutrition-intake/components/GuidanceLevelSection.jsx
// Stap 0: Begeleidingsniveau keuze — 3 opties met stock images
// Volgt intake-theme gold/black styling, geen glassmorphism
import React, { useState, useEffect } from 'react'
import { intakeTheme as t, r } from '../styles/intake-theme'

const LEVELS = [
  {
    id: 'strict',
    title: 'Coach bouwt mijn plan',
    description: 'Jij geeft je voorkeuren, je coach bouwt een plan op maat met exacte hoeveelheden',
    detail: 'Ideaal als je structuur wilt en vertrouwt op je coach',
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop&q=80',
    badge: null
  },
  {
    id: 'flexible',
    title: 'Flexibel plan met targets',
    description: 'Je krijgt een plan met macro targets. Wisselen mag, zolang je targets haalt',
    detail: 'De beste balans tussen structuur en vrijheid',
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=200&fit=crop&q=80',
    badge: 'Populairst'
  },
  {
    id: 'free',
    title: 'Ik eet vrij, geef me richtlijnen',
    description: 'Je krijgt macro targets en een voorbeeldplan als inspiratie',
    detail: 'Voor wie al weet wat werkt en eigen regie wil',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=200&fit=crop&q=80',
    badge: null
  }
]

export default function GuidanceLevelSection({ value, onChange, onComplete, isMobile }) {
  const [selected, setSelected] = useState(value?.guidance_level || null)

  useEffect(() => {
    if (value?.guidance_level) {
      setSelected(value.guidance_level)
    }
  }, [value])

  const handleSelect = (levelId) => {
    setSelected(levelId)
  }

  const handleConfirm = () => {
    if (!selected) return
    onChange({ guidance_level: selected })
    onComplete(true)
  }

  return (
    <div>
      {/* Intro */}
      <div style={{
        padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'),
        borderBottom: `1px solid ${t.colors.border}`
      }}>
        <div style={{
          fontSize: r(isMobile, '0.65rem', '0.7rem'),
          fontWeight: 800,
          color: '#fff',
          marginBottom: '0.15rem'
        }}>
          Hoe wil je begeleid worden met je voeding?
        </div>
        <div style={{
          fontSize: r(isMobile, '0.5rem', '0.52rem'),
          color: t.colors.textMuted,
          lineHeight: 1.4
        }}>
          Dit bepaalt hoe je plan eruitziet en hoeveel vrijheid je krijgt
        </div>
      </div>

      {/* Level cards */}
      <div style={{
        padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem'),
        display: 'flex',
        flexDirection: 'column',
        gap: r(isMobile, '0.5rem', '0.6rem')
      }}>
        {LEVELS.map(level => {
          const isSelected = selected === level.id
          return (
            <button
              key={level.id}
              onClick={() => handleSelect(level.id)}
              style={{
                padding: 0,
                overflow: 'hidden',
                background: isSelected ? 'rgba(255,215,0,0.04)' : '#0a0a0a',
                border: `1.5px solid ${isSelected ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: isMobile ? '10px' : '12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.2s ease',
                transform: 'translateZ(0)',
                position: 'relative'
              }}
              onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
              onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {/* Image */}
              <div style={{
                width: '100%',
                height: isMobile ? '70px' : '85px',
                backgroundImage: `url(${level.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isSelected
                    ? 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 100%)'
                }} />

                {/* Gold top line when selected */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '2px',
                    background: 'linear-gradient(90deg, #FFD700, #FFA500)'
                  }} />
                )}

                {/* Badge */}
                {level.badge && (
                  <div style={{
                    position: 'absolute',
                    top: isMobile ? '0.4rem' : '0.5rem',
                    right: isMobile ? '0.4rem' : '0.5rem',
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(255,215,0,0.15)',
                    border: '1px solid rgba(255,215,0,0.3)',
                    borderRadius: '3px',
                    fontSize: r(isMobile, '0.5rem', '0.52rem'),
                    fontWeight: 800,
                    color: '#FFD700',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {level.badge}
                  </div>
                )}

                {/* Selection indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: isMobile ? '0.4rem' : '0.5rem',
                  right: isMobile ? '0.4rem' : '0.5rem',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? '#FFD700' : 'rgba(255,255,255,0.2)'}`,
                  background: isSelected ? '#FFD700' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}>
                  {isSelected && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#000' }}>{'\u2713'}</span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div style={{
                padding: r(isMobile, '0.5rem 0.65rem', '0.6rem 0.75rem')
              }}>
                <div style={{
                  fontSize: r(isMobile, '0.82rem', '0.9rem'),
                  fontWeight: 800,
                  color: isSelected ? '#FFD700' : '#fff',
                  lineHeight: 1.2,
                  marginBottom: '0.15rem'
                }}>
                  {level.title}
                </div>
                <div style={{
                  fontSize: r(isMobile, '0.6rem', '0.65rem'),
                  fontWeight: 600,
                  color: isSelected ? 'rgba(255,215,0,0.6)' : t.colors.textSecondary,
                  lineHeight: 1.35,
                  marginBottom: '0.1rem'
                }}>
                  {level.description}
                </div>
                <div style={{
                  fontSize: r(isMobile, '0.5rem', '0.52rem'),
                  fontWeight: 500,
                  color: t.colors.textMuted,
                  lineHeight: 1.3
                }}>
                  {level.detail}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Confirm button */}
      <div style={{
        padding: r(isMobile, '0.6rem 1rem', '0.75rem 1.25rem')
      }}>
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            width: '100%',
            padding: r(isMobile, '0.65rem', '0.7rem'),
            background: selected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${selected ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.04)'}`,
            borderRadius: '8px',
            color: selected ? '#FFD700' : t.colors.textMuted,
            fontSize: r(isMobile, '0.72rem', '0.76rem'),
            fontWeight: 800,
            cursor: selected ? 'pointer' : 'default',
            minHeight: '40px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            opacity: selected ? 1 : 0.4,
            transition: 'all 0.2s ease'
          }}
        >
          {selected ? 'OPSLAAN EN DOOR' : 'KIES EEN OPTIE'}
        </button>
      </div>
    </div>
  )
}

