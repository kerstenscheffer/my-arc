// src/modules/shopping/tabs/components/ShoppingSelector.jsx
//
// Eén selector-knop bovenaan de boodschappen-pagina die een modal opent
// waarin de klant aangeeft VOOR WANNEER hij boodschappen doet:
//   - Hele week of één specifieke dag
//   - Aantal weken (1/2/3)
// Vervangt de oude ShoppingWeekHeader + WeekMultiplierTabs + ShoppingTabButtons.

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingBasket, Calendar, X, Check, ChevronDown } from 'lucide-react'

// Banner-foto voor de selector — verse boodschappen / markt-feel.
const SHOPPING_BANNER_URL = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop&q=80'

const DAYS = [
  { id: 'monday',    short: 'Ma', label: 'Maandag' },
  { id: 'tuesday',   short: 'Di', label: 'Dinsdag' },
  { id: 'wednesday', short: 'Wo', label: 'Woensdag' },
  { id: 'thursday',  short: 'Do', label: 'Donderdag' },
  { id: 'friday',    short: 'Vr', label: 'Vrijdag' },
  { id: 'saturday',  short: 'Za', label: 'Zaterdag' },
  { id: 'sunday',    short: 'Zo', label: 'Zondag' },
]

const WEEK_OPTIONS = [
  { id: 1, label: '1 week' },
  { id: 2, label: '2 weken' },
  { id: 3, label: '3 weken' },
]

export default function ShoppingSelector({
  selectedDay, onDayChange,
  weekMultiplier, onWeekMultiplierChange,
  isMobile,
}) {
  const [open, setOpen] = useState(false)

  const photoHeight = isMobile ? 110 : 140
  const day = selectedDay ? DAYS.find(d => d.id === selectedDay) : null
  const titleText = day ? day.label : 'Hele week'
  const subText = weekMultiplier === 1
    ? '1 week boodschappen'
    : `${weekMultiplier} weken boodschappen`

  return (
    <>
      {/* Selector-card — TodaysWorkoutCard-stijl: foto-banner bovenaan,
            info-rij eronder, gouden cirkel-chevron rechts. */}
      <div
        onClick={() => setOpen(true)}
        style={{
          padding: isMobile ? '0.75rem 1rem 0.9rem' : '0.9rem 1.5rem 1.1rem',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Foto-banner — full-width, rounded, bottom-gradient overlay */}
        <div style={{
          width: '100%',
          height: photoHeight,
          borderRadius: 14,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: isMobile ? '0.65rem' : '0.85rem',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${SHOPPING_BANNER_URL})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.6) 100%)',
          }} />
        </div>

        {/* Info-rij — label/titel/meta links, gouden cirkel-chevron rechts */}
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: isMobile ? '0.6rem' : '0.85rem',
        }}>
          <div style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: isMobile ? '0.55rem' : '0.6rem',
              fontWeight: 800,
              color: '#FFD700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              lineHeight: 1, marginBottom: 4, opacity: 0.85,
            }}>
              Boodschappen voor
            </div>
            <h2 style={{
              fontSize: isMobile ? '1.05rem' : '1.2rem',
              fontWeight: 900, color: '#fff',
              margin: 0, marginBottom: 5,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}>
              {titleText}
            </h2>
            <div style={{
              fontSize: isMobile ? '0.72rem' : '0.78rem',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 700,
            }}>
              {subText}
              <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span>
              <span style={{ color: '#FFD700', fontWeight: 800 }}>wijzig</span>
            </div>
          </div>

          {/* Gouden cirkel-knop met chevron */}
          <div style={{
            flexShrink: 0,
            width: isMobile ? 42 : 48, height: isMobile ? 42 : 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            border: 'none',
            boxShadow: '0 6px 16px rgba(255,215,0,0.35), 0 2px 6px rgba(0,0,0,0.4)',
            color: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ChevronDown size={isMobile ? 22 : 26} strokeWidth={3} />
          </div>
        </div>
      </div>

      {open && (
        <SelectorModal
          selectedDay={selectedDay}
          weekMultiplier={weekMultiplier}
          onDayChange={onDayChange}
          onWeekMultiplierChange={onWeekMultiplierChange}
          onClose={() => setOpen(false)}
          isMobile={isMobile}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────
// Modal — twee secties (Dag-keuze + Weken-aantal)
// ─────────────────────────────────────────────────────────
function SelectorModal({
  selectedDay, weekMultiplier,
  onDayChange, onWeekMultiplierChange,
  onClose, isMobile,
}) {
  const node = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2147483600,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'shopSelectorFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#0a0a0a',
          borderTop: '1px solid rgba(255,215,0,0.25)',
          borderRadius: '20px 20px 0 0',
          padding: `1.1rem 1.15rem calc(env(safe-area-inset-bottom, 0px) + 1.25rem)`,
          boxShadow: '0 -16px 40px rgba(0,0,0,0.7)',
          animation: 'shopSelectorSlide 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}
      >
        {/* Drag-indicator */}
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, marginTop: -4,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '0.62rem', fontWeight: 800, color: '#FFD700',
              textTransform: 'uppercase', letterSpacing: '0.12em',
              opacity: 0.85, marginBottom: 3,
            }}>
              Wanneer doe je boodschappen?
            </div>
            <div style={{
              fontSize: isMobile ? '1.15rem' : '1.3rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em',
            }}>
              Stel je boodschappen in
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Sectie 1 — Voor welke dag(en)? */}
        <div>
          <div style={sectionLabel()}>
            <Calendar size={12} strokeWidth={2.6} /> Voor welke dag
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* "Hele week"-optie */}
            <button
              onClick={() => onDayChange(null)}
              style={chipStyle(selectedDay === null, isMobile)}
            >
              {selectedDay === null && <Check size={11} strokeWidth={3} />}
              Hele week
            </button>
            {DAYS.map(d => {
              const sel = selectedDay === d.id
              return (
                <button
                  key={d.id}
                  onClick={() => onDayChange(d.id)}
                  style={chipStyle(sel, isMobile)}
                >
                  {sel && <Check size={11} strokeWidth={3} />}
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Sectie 2 — Voor hoeveel weken? */}
        <div>
          <div style={sectionLabel()}>
            <ShoppingBasket size={12} strokeWidth={2.6} /> Voor hoeveel
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {WEEK_OPTIONS.map(w => {
              const sel = weekMultiplier === w.id
              return (
                <button
                  key={w.id}
                  onClick={() => onWeekMultiplierChange(w.id)}
                  style={{
                    flex: 1,
                    padding: isMobile ? '0.85rem 0.5rem' : '1rem 0.5rem',
                    background: sel
                      ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                      : 'rgba(255,255,255,0.03)',
                    border: sel ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    color: sel ? '#0a0a0a' : '#fff',
                    fontSize: isMobile ? '0.95rem' : '1.05rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    boxShadow: sel ? '0 6px 16px rgba(255,215,0,0.32)' : 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {w.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bevestigen */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: isMobile ? '0.95rem' : '1.05rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)',
            color: '#0a0a0a',
            border: 'none', borderRadius: 12,
            fontSize: isMobile ? '0.95rem' : '1.02rem',
            fontWeight: 900, letterSpacing: '0.02em',
            cursor: 'pointer',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 10px 24px rgba(255,215,0,0.32)',
          }}
        >
          Bevestigen
        </button>
      </div>

      <style>{`
        @keyframes shopSelectorFade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes shopSelectorSlide {
          from { transform: translateY(20px); opacity: 0 }
          to   { transform: translateY(0); opacity: 1 }
        }
      `}</style>
    </div>
  )
  return createPortal(node, document.body)
}

const sectionLabel = () => ({
  display: 'flex', alignItems: 'center', gap: 6,
  fontSize: '0.62rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  marginBottom: 10,
})

const chipStyle = (selected, isMobile) => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: isMobile ? '0.55rem 0.8rem' : '0.65rem 0.95rem',
  background: selected
    ? 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.04) 100%)'
    : 'rgba(255,255,255,0.03)',
  border: `1px solid ${selected ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
  borderRadius: 10,
  color: selected ? '#FFD700' : 'rgba(255,255,255,0.75)',
  fontSize: isMobile ? '0.78rem' : '0.85rem',
  fontWeight: 800,
  cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  whiteSpace: 'nowrap',
})
