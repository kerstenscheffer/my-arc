// src/modules/shopping/tabs/components/ShoppingStats.jsx
import React from 'react'
import { ShoppingCart, Euro, CheckCircle2, TrendingUp } from 'lucide-react'

export default function ShoppingStats({ 
  totalItems, 
  checkedCount, 
  totalCost, 
  remainingCost, 
  progress, 
  animate, 
  isMobile 
}) {
  // 🔥 Force 2 decimalen voor alle euro values
  const formatEuro = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  const stats = [
    {
      icon: ShoppingCart,
      label: 'Items',
      value: totalItems,
      subValue: `${checkedCount} afgevinkt`,
      color: '#FFD700',
      gradient: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
    },
    {
      icon: Euro,
      label: 'Totaal',
      value: `€${formatEuro(totalCost)}`,
      subValue: `€${formatEuro(remainingCost)} resterend`,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      icon: TrendingUp,
      label: 'Voortgang',
      value: `${progress}%`,
      subValue: `${totalItems - checkedCount} te gaan`,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
    }
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: isMobile ? '0.75rem' : '1rem',
      marginBottom: isMobile ? '1rem' : '1.5rem'
    }}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            style={{
              position: 'relative',
              background: '#000',
              border: `2px solid rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.3)`,
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '1rem' : '1.25rem',
              boxShadow: `0 8px 32px rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.03)`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: animate ? 1 : 0,
              transform: animate ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
              transitionDelay: `${index * 0.1}s`,
              overflow: 'hidden'
            }}
          >
            {/* Top accent glow */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: stat.gradient,
              opacity: 0.6,
              pointerEvents: 'none'
            }} />

            {/* Content container */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              {/* Icon bubble - glassmorphic */}
              <div style={{
                width: isMobile ? '48px' : '56px',
                height: isMobile ? '48px' : '56px',
                borderRadius: isMobile ? '12px' : '14px',
                background: `linear-gradient(135deg, rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.15) 0%, rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.08) 100%)`,
                backdropFilter: 'blur(12px)',
                border: `1px solid rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.3)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 4px 16px rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)`,
                position: 'relative'
              }}>
                <Icon 
                  size={isMobile ? 20 : 24} 
                  color={stat.color}
                  style={{ 
                    filter: `drop-shadow(0 0 6px rgba(${stat.color === '#FFD700' ? '255, 215, 0' : stat.color === '#f59e0b' ? '245, 158, 11' : '59, 130, 246'}, 0.6))`,
                    strokeWidth: 2.5
                  }}
                />
              </div>

              {/* Text content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: isMobile ? '0.75rem' : '0.8125rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.25rem'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  color: 'white',
                  fontSize: isMobile ? '1.5rem' : '1.75rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  marginBottom: '0.375rem',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: isMobile ? '0.75rem' : '0.8125rem',
                  fontWeight: '600',
                  letterSpacing: '-0.01em'
                }}>
                  {stat.subValue}
                </div>
              </div>
            </div>

            {/* Progress bar (alleen bij voortgang card) */}
            {stat.label === 'Voortgang' && (
              <div style={{
                marginTop: isMobile ? '0.75rem' : '1rem',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progress}%`,
                  background: stat.gradient,
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: '0.5s',
                  boxShadow: `0 0 8px rgba(${stat.color === '#3b82f6' ? '59, 130, 246' : '255, 215, 0'}, 0.6)`
                }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
