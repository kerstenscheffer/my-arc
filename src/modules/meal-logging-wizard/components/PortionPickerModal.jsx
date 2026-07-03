import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Check } from 'lucide-react'

const FALLBACK_PORTIONS = [1, 30, 50, 100]
const LONG_PRESS_MS = 550

export default function PortionPickerModal({
  isOpen,
  onClose,
  onSelect,
  ingredientName,
  currentGrams,
  service,
  clientId
}) {
  const isMobile = window.innerWidth <= 768

  const [learned, setLearned] = useState([])
  const [customValue, setCustomValue] = useState('')
  const [loading, setLoading] = useState(false)
  const pressTimerRef = useRef(null)
  const longPressFiredRef = useRef(false)

  useEffect(() => {
    if (!isOpen) return
    setCustomValue(currentGrams ? String(Math.round(currentGrams)) : '')
    loadHistory()
  }, [isOpen, ingredientName, clientId])

  const loadHistory = async () => {
    if (!service || !clientId || !ingredientName) {
      setLearned([])
      return
    }
    try {
      setLoading(true)
      const history = await service.getPortionHistory(clientId, ingredientName, 4)
      setLearned(history)
    } finally {
      setLoading(false)
    }
  }

  // Merge learned + fallback, keep order: learned first, fill up to 4 with fallback
  const presets = useMemo(() => {
    const result = [...learned]
    for (const g of FALLBACK_PORTIONS) {
      if (result.length >= 4) break
      if (!result.includes(g)) result.push(g)
    }
    return result.slice(0, 4)
  }, [learned])

  const handlePick = (grams) => {
    const value = Math.round(parseFloat(grams))
    if (!Number.isFinite(value) || value <= 0) return
    onSelect(value)
    onClose()
  }

  const handleCustomConfirm = () => {
    const value = Math.round(parseFloat(customValue))
    if (!Number.isFinite(value) || value <= 0) return
    onSelect(value)
    onClose()
  }

  const startLongPress = (grams) => {
    longPressFiredRef.current = false
    pressTimerRef.current = setTimeout(async () => {
      longPressFiredRef.current = true
      const isLearned = learned.includes(grams)
      if (!isLearned) return
      const ok = window.confirm(`Verwijder ${grams}g uit je presets voor "${ingredientName}"?`)
      if (!ok) return
      if (service && clientId) {
        await service.forgetPortion(clientId, ingredientName, grams)
        loadHistory()
      }
    }, LONG_PRESS_MS)
  }

  const cancelLongPress = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const handleChipClick = (grams) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false
      return
    }
    handlePick(grams)
  }

  if (!isOpen) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10010,
        padding: isMobile ? '1rem' : '1.5rem',
        touchAction: 'manipulation'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a',
          borderRadius: '20px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          width: '100%',
          maxWidth: '440px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.25rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'rgba(16, 185, 129, 0.8)',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              marginBottom: '0.25rem'
            }}>
              Portie kiezen
            </div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {ingredientName || 'Ingrediënt'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(255, 255, 255, 0.7)',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Presets */}
        <div style={{ padding: '1.25rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{loading ? 'Laden…' : 'Snel kiezen'}</span>
            {learned.length > 0 && (
              <span style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.35)',
                textTransform: 'none',
                letterSpacing: 0
              }}>
                lang indrukken = vergeten
              </span>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.6rem',
            marginBottom: '1.25rem'
          }}>
            {presets.map((grams) => {
              const isLearned = learned.includes(grams)
              return (
                <button
                  key={grams}
                  onClick={() => handleChipClick(grams)}
                  onTouchStart={() => startLongPress(grams)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onMouseDown={() => startLongPress(grams)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  style={{
                    padding: '1rem 0.75rem',
                    background: isLearned
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(16, 185, 129, 0.08) 100%)'
                      : 'rgba(255, 255, 255, 0.04)',
                    border: isLearned
                      ? '1px solid rgba(16, 185, 129, 0.5)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'transform 0.1s ease',
                    minHeight: '60px',
                    position: 'relative'
                  }}
                >
                  {grams}g
                  {isLearned && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '8px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#10b981'
                    }} />
                  )}
                </button>
              )
            })}
          </div>

          {/* Custom input */}
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '0.5rem'
          }}>
            Of typ exact aantal
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="1"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomConfirm()
                }}
                placeholder="bv. 217"
                style={{
                  width: '100%',
                  padding: '0.875rem 2.25rem 0.875rem 1rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 600,
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'
                }}
              />
              <span style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '0.9rem',
                fontWeight: 600,
                pointerEvents: 'none'
              }}>
                g
              </span>
            </div>
            <button
              onClick={handleCustomConfirm}
              disabled={!customValue || parseFloat(customValue) <= 0}
              style={{
                padding: '0 1.25rem',
                background: (!customValue || parseFloat(customValue) <= 0)
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: 700,
                cursor: (!customValue || parseFloat(customValue) <= 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                opacity: (!customValue || parseFloat(customValue) <= 0) ? 0.5 : 1,
                minHeight: '48px'
              }}
            >
              <Check size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
