// src/modules/shopping/tabs/components/ShoppingTabButtons.jsx - V4 BUDGET TAB
import React from 'react'
import { Calendar, TrendingDown, Lightbulb } from 'lucide-react'

export default function ShoppingTabButtons({ activeTab, onTabChange, isMobile }) {
  const tabs = [
    { id: 'weekplan', label: 'Weekplan', icon: Calendar },
    { id: 'budget', label: 'Budget', icon: TrendingDown },
    { id: 'shoptips', label: 'Tips', icon: Lightbulb }
  ]

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 2rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      display: 'flex',
      gap: isMobile ? '0.25rem' : '0.375rem',
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem',
              background: isActive ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
              border: isActive 
                ? '1px solid rgba(255, 215, 0, 0.25)' 
                : '1px solid transparent',
              borderRadius: '6px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease',
              outline: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              minHeight: '28px',
              whiteSpace: 'nowrap'
            }}
          >
            <Icon 
              size={12} 
              color={isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.35)'} 
              strokeWidth={2}
            />
            <span style={{
              fontSize: isMobile ? '0.65rem' : '0.7rem',
              fontWeight: isActive ? '700' : '600',
              color: isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.35)'
            }}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
