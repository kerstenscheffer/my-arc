
import React from 'react'
import { ShoppingCart, Utensils, History } from 'lucide-react'

export default function BottomNavigation({ onNavigate, onShowHistory, currentPage = 'meals' }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg, transparent 0%, #0a0f0d 30%, #0a0f0d 100%)',
      padding: '0.75rem',
      display: 'flex',
      justifyContent: 'space-around',
      borderTop: '1px solid rgba(16, 185, 129, 0.1)'
    }}>
      <NavButton
        icon={ShoppingCart}
        label="Shop"
        isActive={currentPage === 'shopping'}
        onClick={() => onNavigate('shopping')}
      />
      
      <NavButton
        icon={Utensils}
        label="Meals"
        isActive={currentPage === 'meals'}
        onClick={() => {}}
        primary
      />
      
      <NavButton
        icon={History}
        label="History"
        isActive={currentPage === 'history'}
        onClick={onShowHistory}
      />
    </div>
  )
}

function NavButton({ icon: Icon, label, isActive, onClick, primary }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: primary 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
          : 'transparent',
        border: primary 
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : 'none',
        borderRadius: '8px',
        color: primary 
          ? 'rgba(16, 185, 129, 0.9)'
          : 'rgba(255,255,255,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
        cursor: 'pointer',
        padding: '0.5rem 1.5rem',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        if (!primary) {
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
          e.currentTarget.style.color = 'rgba(16, 185, 129, 0.8)'
        }
      }}
      onMouseLeave={(e) => {
        if (!primary) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
        }
      }}
    >
      <Icon size={22} />
      <span style={{ fontSize: '0.75rem', fontWeight: primary ? '700' : '600' }}>
        {label}
      </span>
    </button>
  )
}
