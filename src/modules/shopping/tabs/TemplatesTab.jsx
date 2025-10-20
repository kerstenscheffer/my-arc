// src/modules/shopping/tabs/TemplatesTab.jsx
import React from 'react'
import { Package, TrendingUp, DollarSign, Clock, Zap, Users } from 'lucide-react'

export default function TemplatesTab() {
  const isMobile = window.innerWidth <= 768
  
  const templates = [
    { 
      id: 'budget-bulk',
      name: 'Budget Beast',
      description: 'Max calories voor min geld',
      price: '€25/week',
      icon: DollarSign,
      color: '#10b981'
    },
    {
      id: 'lean-clean',
      name: 'Lean & Clean', 
      description: 'Cut-friendly whole foods',
      price: '€40/week',
      icon: TrendingUp,
      color: '#3b82f6'
    },
    {
      id: 'student',
      name: 'Student Survival',
      description: 'High protein onder €30',
      price: '€28/week',
      icon: Users,
      color: '#f59e0b'
    },
    {
      id: 'meal-prep',
      name: 'Meal Prep Master',
      description: 'Bulk cook essentials',
      price: '€35/week',
      icon: Package,
      color: '#8b5cf6'
    },
    {
      id: 'quick',
      name: 'Quick & Easy',
      description: 'No-cook/minimal prep',
      price: '€45/week',
      icon: Clock,
      color: '#ec4899'
    },
    {
      id: 'competition',
      name: 'Competition Prep',
      description: 'Precise macro foods',
      price: '€50/week',
      icon: Zap,
      color: '#ef4444'
    }
  ]
  
  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: 'white',
          marginBottom: '0.5rem'
        }}>
          Smart Templates Komen Eraan! 🚀
        </h2>
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          Templates die automatisch aanpassen aan jouw macro targets
        </p>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {templates.map(template => {
          const Icon = template.icon
          return (
            <div
              key={template.id}
              style={{
                background: 'rgba(17, 17, 17, 0.5)',
                backdropFilter: 'blur(10px)',
                borderRadius: '14px',
                padding: isMobile ? '1rem' : '1.25rem',
                border: '1px solid rgba(16, 185, 129, 0.08)',
                opacity: 0.7,
                cursor: 'not-allowed'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                background: `linear-gradient(135deg, ${template.color}20 0%, ${template.color}10 100%)`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.75rem'
              }}>
                <Icon size={20} color={template.color} />
              </div>
              
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.05rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '0.25rem'
              }}>
                {template.name}
              </h3>
              
              <p style={{
                fontSize: isMobile ? '0.75rem' : '0.825rem',
                color: 'rgba(255, 255, 255, 0.5)',
                marginBottom: '0.5rem'
              }}>
                {template.description}
              </p>
              
              <span style={{
                fontSize: isMobile ? '0.875rem' : '0.925rem',
                fontWeight: '700',
                color: template.color
              }}>
                {template.price}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

