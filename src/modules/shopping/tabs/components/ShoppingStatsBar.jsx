// src/modules/shopping/tabs/components/ShoppingStatsBar.jsx
import React from 'react'
import { ShoppingBag, Euro, Target } from 'lucide-react'

export default function ShoppingStatsBar({ 
  totalItems, 
  totalCost, 
  progress, 
  isMobile 
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: isMobile ? '0.5rem' : '0.625rem',
      marginBottom: isMobile ? '0.75rem' : '1rem'
    }}>
      {/* Items */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.375rem'
          }}>
            <ShoppingBag size={isMobile ? 12 : 14} color="#10b981" strokeWidth={2.5} />
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700'
            }}>
              Items
            </div>
          </div>
          <div style={{
            fontSize: isMobile ? '1.375rem' : '1.5rem',
            fontWeight: '800',
            color: '#10b981',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            {totalItems}
          </div>
        </div>
      </div>
      
      {/* Total Cost */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.375rem'
          }}>
            <Euro size={isMobile ? 12 : 14} color="#f59e0b" strokeWidth={2.5} />
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700'
            }}>
              Totaal
            </div>
          </div>
          <div style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '800',
            color: '#f59e0b',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            €{totalCost.toFixed(2)}
          </div>
        </div>
      </div>
      
      {/* Progress */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: isMobile ? '10px' : '12px',
        padding: isMobile ? '0.75rem' : '0.875rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Shine overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            marginBottom: '0.375rem'
          }}>
            <Target size={isMobile ? 12 : 14} color="#10b981" strokeWidth={2.5} />
            <div style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              color: 'rgba(255, 255, 255, 0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: '700'
            }}>
              Klaar
            </div>
          </div>
          <div style={{
            fontSize: isMobile ? '1.375rem' : '1.5rem',
            fontWeight: '800',
            color: '#10b981',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            {progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
