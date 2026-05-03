// src/modules/sales/SalesSection.jsx
// Sales Section - Main Container
// Goud-bruine styling theme

import { useState, useEffect } from 'react'
import { DollarSign, Library, BarChart3, Target, Shield } from 'lucide-react'

// Sub-components
import SalesLibrary from './components/SalesLibrary'
import ScriptTrainer from './components/ScriptTrainer'
import SalesDashboard from './components/SalesDashboard'
import DMTraining from './components/DMTraining'
import ObjectieTrainer from './components/ObjectieTrainer'

// Goud-Bruin Theme
export const SALES_THEME = {
  primary: '#d4af37',      // Donker goud
  secondary: '#8B7355',    // Warm bruin
  accent: '#FFD700',       // Helder goud
  background: 'rgba(212, 175, 55, 0.08)',
  border: 'rgba(212, 175, 55, 0.2)',
  glow: 'rgba(212, 175, 55, 0.15)'
}

export default function SalesSection({ db }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [activeTab, setActiveTab] = useState('library')
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Tabs config
  const tabs = [
    { id: 'library', label: 'Library', icon: Library },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'trainer', label: 'Script Trainer', icon: Target },
    { id: 'objectie-trainer', label: 'Objectie Trainer', icon: Shield },
    { id: 'dm-training', label: 'DM Training', icon: DollarSign }
  ]
  
  return (
    <div style={{ 
      padding: isMobile ? '0.75rem' : '1.5rem',
      maxWidth: '100%',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.5rem',
        padding: isMobile ? '1rem' : '1.5rem',
        background: `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.3) 100%)`,
        border: `1px solid ${SALES_THEME.border}`,
        borderRadius: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '48px' : '56px',
          height: isMobile ? '48px' : '56px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
          boxShadow: `0 4px 20px ${SALES_THEME.glow}`
        }}>
          <DollarSign size={isMobile ? 24 : 28} color="#000" strokeWidth={2.5} />
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            marginBottom: '0.25rem'
          }}>
            Sales
          </h1>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0
          }}>
            Beheer je sales pieces, metrics en scripts
          </p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '0.5rem' : '0.75rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDisabled = tab.disabled
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
              disabled={isDisabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem' : '1rem',
                background: isActive
                  ? `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.4) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? `2px solid ${SALES_THEME.primary}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: isDisabled 
                  ? 'rgba(255, 255, 255, 0.2)'
                  : isActive 
                    ? SALES_THEME.primary 
                    : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isActive ? '700' : '500',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '48px',
                opacity: isDisabled ? 0.5 : 1
              }}
            >
              <Icon size={isMobile ? 16 : 18} />
              {tab.label}
              {isDisabled && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.125rem 0.375rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  marginLeft: '0.25rem'
                }}>
                  Soon
                </span>
              )}
            </button>
          )
        })}
      </div>
      
      {/* Content */}
      <div>
        {activeTab === 'library' && (
          <SalesLibrary db={db} isMobile={isMobile} />
        )}
        
        {activeTab === 'dashboard' && (
          <SalesDashboard db={db} isMobile={isMobile} />
        )}
        
        {activeTab === 'trainer' && (
          <ScriptTrainer db={db} isMobile={isMobile} />
        )}
        
        {activeTab === 'objectie-trainer' && (
          <ObjectieTrainer db={db} isMobile={isMobile} />
        )}
        
        {activeTab === 'dm-training' && (
          <DMTraining db={db} isMobile={isMobile} />
        )}
      </div>
    </div>
  )
}

// Placeholder for disabled tabs
function PlaceholderView({ icon: Icon, title, description, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '2rem 1rem' : '4rem 2rem',
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80px',
        height: '80px',
        borderRadius: '16px',
        background: SALES_THEME.background,
        border: `1px solid ${SALES_THEME.border}`,
        margin: '0 auto 1.5rem'
      }}>
        <Icon size={36} color={SALES_THEME.primary} style={{ opacity: 0.5 }} />
      </div>
      
      <h3 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        color: '#fff',
        marginBottom: '0.5rem'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        color: 'rgba(255, 255, 255, 0.5)',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        {description}
      </p>
      
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem 1.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        display: 'inline-block',
        fontSize: '0.85rem',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        🚧 Binnenkort beschikbaar
      </div>
    </div>
  )
}
