// WeightStatusBadge.jsx - Status indicator met gold/black styling
import React from 'react'
import { AlertCircle, CheckCircle, Clock, AlertTriangle, HelpCircle } from 'lucide-react'

export default function WeightStatusBadge({ status, fridayMissing, isMobile }) {
  // Status configuratie
  const statusConfig = {
    today: {
      label: 'Vandaag gewogen',
      icon: CheckCircle,
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
      border: 'rgba(16, 185, 129, 0.4)',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.3)'
    },
    recent: {
      label: 'Recent gewogen',
      icon: CheckCircle,
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
      border: 'rgba(16, 185, 129, 0.3)',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.2)'
    },
    warning: {
      label: '4-7 dagen geleden',
      icon: Clock,
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
      border: 'rgba(245, 158, 11, 0.4)',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.3)'
    },
    overdue: {
      label: '7+ dagen geleden',
      icon: AlertTriangle,
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
      border: 'rgba(239, 68, 68, 0.4)',
      color: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.3)'
    },
    never: {
      label: 'Nooit gewogen',
      icon: AlertCircle,
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(239, 68, 68, 0.15) 100%)',
      border: 'rgba(239, 68, 68, 0.5)',
      color: '#ef4444',
      glow: 'rgba(239, 68, 68, 0.4)'
    },
    unknown: {
      label: 'Geen data',
      icon: HelpCircle,
      bg: 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%)',
      border: 'rgba(107, 114, 128, 0.3)',
      color: '#6b7280',
      glow: 'rgba(107, 114, 128, 0.2)'
    }
  }

  const config = statusConfig[status] || statusConfig.unknown
  const Icon = config.icon

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '0.375rem' : '0.5rem'
    }}>
      {/* Main Status Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isMobile ? '0.375rem' : '0.5rem',
        padding: isMobile ? '0.375rem 0.625rem' : '0.5rem 0.75rem',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: '8px',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 12px ${config.glow}`,
        transition: 'all 0.2s ease'
      }}>
        <Icon 
          size={isMobile ? 14 : 16} 
          color={config.color}
          style={{ 
            filter: `drop-shadow(0 0 4px ${config.glow})`,
            flexShrink: 0
          }}
        />
        <span style={{
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          fontWeight: '600',
          color: config.color,
          whiteSpace: 'nowrap'
        }}>
          {config.label}
        </span>
      </div>

      {/* Friday Missing Alert */}
      {fridayMissing && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: isMobile ? '0.25rem' : '0.375rem',
          padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.625rem',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          borderRadius: '6px',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          <AlertCircle 
            size={isMobile ? 12 : 14} 
            color="#FFD700"
            style={{ filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' }}
          />
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '700',
            color: '#FFD700',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}>
            Vrijdag weging mist!
          </span>
        </div>
      )}
    </div>
  )
}
