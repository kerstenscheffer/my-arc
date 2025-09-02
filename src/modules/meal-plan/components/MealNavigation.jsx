// src/modules/meal-plan/components/MealNavigation.jsx
import React from 'react'
import { Utensils, ShoppingCart, TrendingUp } from 'lucide-react'

export default function MealNavigation({ activePage, onNavigate, onShowHistory }) {
  const navItems = [
    { icon: Utensils, label: 'Meals', id: 'meals' },
    { icon: ShoppingCart, label: 'Shopping', id: 'shopping', onClick: () => onNavigate('shopping') },
    { icon: TrendingUp, label: 'Progress', id: 'progress', onClick: onShowHistory }
  ]
  
  return (
    <div style={{
      margin: '1rem',
      marginTop: '2rem',
      marginBottom: '1rem'
    }}>
      <div style={{
        background: 'rgba(23,23,23,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: '1px solid rgba(16, 185, 129, 0.1)',
        padding: '0.5rem',
        display: 'flex',
        justifyContent: 'space-around',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        {navItems.map((item) => (
          <NavButton
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activePage === item.id}
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  )
}

function NavButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
          : 'transparent',
        border: 'none',
        borderRadius: '12px',
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      {active && (
        <div style={{
          position: 'absolute',
          top: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '30px',
          height: '3px',
          background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
          borderRadius: '2px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.5)'
        }} />
      )}
      
      <Icon 
        size={20} 
        style={{ 
          color: active ? '#10b981' : 'rgba(255,255,255,0.4)',
          transition: 'all 0.2s ease'
        }} 
      />
      <span style={{
        color: active ? '#10b981' : 'rgba(255,255,255,0.4)',
        fontSize: '0.7rem',
        fontWeight: '600',
        transition: 'all 0.2s ease'
      }}>
        {label}
      </span>
    </button>
  )
}
