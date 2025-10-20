
// src/modules/shopping/tabs/KnowledgeTab.jsx
import React from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Pill, ChefHat } from 'lucide-react'

export default function KnowledgeTab({ db, client }) {
  const isMobile = window.innerWidth <= 768
  
  const knowledgeCards = [
    {
      id: 'high-pro-tankstation',
      title: 'High-Pro On The Go',
      description: 'Tankstation & AH to go protein hacks',
      icon: ShoppingCart,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      savings: '€200/jaar besparing'
    },
    {
      id: 'protein-price-wars',
      title: 'Cheapest Protein',
      description: 'Beste protein per euro ranking',
      icon: DollarSign,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      savings: 'Tot 60% goedkoper'
    },
    {
      id: 'save-500',
      title: '€500 Bespaar Tricks',
      description: '10 concrete tips voor jaarlijkse besparing',
      icon: TrendingUp,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      savings: '€500+ per jaar'
    },
    {
      id: 'bulk-vs-cut',
      title: 'Bulk vs Cut Shopping',
      description: 'Verschillende shopping strategies',
      icon: Calendar,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      savings: 'Optimale macros'
    },
    {
      id: 'supplement-guide',
      title: 'Supplement Reality',
      description: 'Wat wel/niet kopen + ROI calculator',
      icon: Pill,
      color: '#ef4444',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      savings: '€120/jaar besparing'
    },
    {
      id: 'meal-prep',
      title: 'Meal Prep Master',
      description: '2 uur = hele week sorted',
      icon: ChefHat,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
      savings: '8 uur/week tijdwinst'
    }
  ]
  
  return (
    <div style={{ padding: isMobile ? '0.75rem' : '1.5rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {knowledgeCards.map(card => {
          const Icon = card.icon
          
          return (
            <button
              key={card.id}
              style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: isMobile ? '1.25rem' : '1.5rem',
                border: '1px solid rgba(16, 185, 129, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 20px 40px ${card.color}20`
                e.currentTarget.style.border = `1px solid ${card.color}30`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.08)'
              }}
            >
              {/* Background gradient */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                background: card.gradient,
                opacity: 0.1,
                borderRadius: '50%',
                transform: 'translate(30%, -30%)'
              }} />
              
              <div style={{
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: card.gradient,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 8px 20px ${card.color}30`
                  }}>
                    <Icon size={24} color="white" />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: isMobile ? '1rem' : '1.125rem',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '0.375rem'
                    }}>
                      {card.title}
                    </h3>
                    
                    <p style={{
                      fontSize: isMobile ? '0.825rem' : '0.9rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      lineHeight: 1.4,
                      marginBottom: '0.75rem'
                    }}>
                      {card.description}
                    </p>
                    
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.375rem 0.75rem',
                      background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 100%)`,
                      borderRadius: '8px',
                      border: `1px solid ${card.color}30`
                    }}>
                      <span style={{
                        fontSize: isMobile ? '0.8rem' : '0.875rem',
                        fontWeight: '700',
                        color: card.color
                      }}>
                        {card.savings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

