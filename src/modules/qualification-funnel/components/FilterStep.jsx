// src/modules/qualification-funnel/components/FilterStep.jsx
import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { funnelTheme, commonStyles } from '../funnelTheme'

const filterOptions = [
  {
    id: 'first',
    text: 'Dit is mijn eerste poging',
    subtext: 'Klaar om het goed te doen'
  },
  {
    id: 'few',
    text: '1-2 keer, nooit volgehouden',
    subtext: 'Motivatie was het probleem'
  },
  {
    id: 'many',
    text: '3+ keer, altijd gefaald',
    subtext: 'Tijd voor een andere aanpak'
  },
  {
    id: 'fit',
    text: 'Ik ben al fit, wil naar next level',
    subtext: 'Klaar voor de volgende stap'
  }
]

export default function FilterStep({ onNext, isMobile }) {
  const [selected, setSelected] = useState(null)
  const [hoveredId, setHoveredId] = useState(null)

  const handleSelect = (optionId) => {
    setSelected(optionId)
    // Auto-advance after brief delay
    setTimeout(() => {
      onNext({ experienceLevel: optionId })
    }, 400)
  }

  return (
    <div style={commonStyles.container(isMobile)}>
      
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? '250px' : '400px',
        height: isMobile ? '250px' : '400px',
        background: 'radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Step indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
          <span style={{
            fontSize: '0.75rem',
            color: funnelTheme.gold,
            fontWeight: '600',
            letterSpacing: '0.1em',
            textTransform: 'uppercase'
          }}>
            Stap 1 van 3
          </span>
          <div style={{
            width: '24px',
            height: '2px',
            background: funnelTheme.gold
          }} />
        </div>
        
        {/* Question */}
        <h2 style={{
          fontSize: isMobile ? '1.75rem' : '2.25rem',
          fontWeight: '800',
          color: funnelTheme.textPrimary,
          marginBottom: isMobile ? '0.75rem' : '1rem',
          lineHeight: '1.2',
          letterSpacing: '-0.02em',
          textAlign: 'center'
        }}>
          Hoeveel keer heb je al geprobeerd in shape te komen?
        </h2>
        
        <p style={{
          fontSize: isMobile ? '0.95rem' : '1rem',
          color: funnelTheme.textMuted,
          marginBottom: isMobile ? '2rem' : '2.5rem',
          textAlign: 'center'
        }}>
          Wees eerlijk. Er is geen fout antwoord.
        </p>
        
        {/* Options */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              onMouseEnter={() => setHoveredId(option.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                ...commonStyles.optionCard(isMobile, selected === option.id),
                transform: hoveredId === option.id ? 'translateX(4px)' : 'translateX(0)',
                borderColor: selected === option.id 
                  ? funnelTheme.borderGoldStrong 
                  : hoveredId === option.id 
                    ? funnelTheme.borderGold 
                    : funnelTheme.borderSubtle
              }}
              onTouchStart={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(0.99)'
              }}
              onTouchEnd={(e) => {
                if (isMobile) e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {/* Checkbox indicator */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '0',
                border: `2px solid ${selected === option.id ? funnelTheme.gold : funnelTheme.borderSubtle}`,
                background: selected === option.id ? funnelTheme.gold : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: isMobile ? '1rem' : '1.25rem',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}>
                {selected === option.id && (
                  <Check size={14} color="#000" strokeWidth={3} />
                )}
              </div>
              
              {/* Text */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: '600',
                  color: selected === option.id ? funnelTheme.gold : funnelTheme.textPrimary,
                  margin: 0,
                  marginBottom: '0.25rem',
                  transition: 'color 0.2s ease'
                }}>
                  {option.text}
                </p>
                <p style={{
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  color: funnelTheme.textMuted,
                  margin: 0
                }}>
                  {option.subtext}
                </p>
              </div>
              
              {/* Arrow */}
              <ArrowRight 
                size={18} 
                color={selected === option.id || hoveredId === option.id ? funnelTheme.gold : funnelTheme.textMuted}
                style={{
                  opacity: selected === option.id || hoveredId === option.id ? 1 : 0.3,
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
