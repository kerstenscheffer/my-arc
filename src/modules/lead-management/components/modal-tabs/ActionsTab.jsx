import { useState } from 'react'
import { Phone, Mail, Calendar, MessageSquare, CheckCircle, XCircle, ArrowRight } from 'lucide-react'

export default function ActionsTab({ lead, onUpdate, isMobile }) {
  const [actionInProgress, setActionInProgress] = useState(null)

  const primaryActions = [
    {
      id: 'call',
      label: 'Bel Lead',
      description: 'Start telefoongesprek',
      icon: Phone,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      action: () => handleCallLead()
    },
    {
      id: 'email',
      label: 'Email Lead',
      description: 'Stuur een email',
      icon: Mail,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      action: () => handleEmailLead()
    },
    {
      id: 'schedule',
      label: 'Plan Afspraak',
      description: 'Maak een afspraak',
      icon: Calendar,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      action: () => handleScheduleCall()
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      description: 'Stuur WhatsApp bericht',
      icon: MessageSquare,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      action: () => handleWhatsApp()
    }
  ]

  const statusActions = [
    {
      id: 'mark_contacted',
      label: 'Markeer als Benaderd',
      icon: CheckCircle,
      color: '#f97316',
      status: 'contacted'
    },
    {
      id: 'mark_scheduled',
      label: 'Markeer als Gepland',
      icon: Calendar,
      color: '#8b5cf6',
      status: 'scheduled'
    },
    {
      id: 'mark_converted',
      label: 'Markeer als Geconverteerd',
      icon: CheckCircle,
      color: '#10b981',
      status: 'converted'
    },
    {
      id: 'mark_unqualified',
      label: 'Markeer als Niet Gekwalificeerd',
      icon: XCircle,
      color: '#ef4444',
      status: 'unqualified'
    }
  ]

  const handleCallLead = () => {
    // Open phone dialer
    window.location.href = `tel:${lead.phone}`
  }

  const handleEmailLead = () => {
    // Open email client
    const subject = encodeURIComponent(`Followup: ${lead.first_name} ${lead.last_name}`)
    window.location.href = `mailto:${lead.email}?subject=${subject}`
  }

  const handleScheduleCall = () => {
    // TODO: Integrate with Calendly or calendar system
    alert('Calendly integratie komt binnenkort!')
  }

  const handleWhatsApp = () => {
    // Open WhatsApp with prefilled message
    const message = encodeURIComponent(`Hi ${lead.first_name}, ik wil graag met je in contact komen over je interesse.`)
    // Remove + and spaces from phone for WhatsApp format
    const phone = lead.phone.replace(/[\s+-]/g, '')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  const handleStatusChange = async (newStatus) => {
    setActionInProgress(newStatus)
    try {
      await onUpdate({ status: newStatus })
      // Show success feedback
      setTimeout(() => setActionInProgress(null), 1000)
    } catch (error) {
      console.error('Status change failed:', error)
      setActionInProgress(null)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      {/* Contact Actions */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ArrowRight size={18} color="#10b981" />
          Neem Contact Op
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {primaryActions.map((action) => {
            const IconComponent = action.icon

            return (
              <button
                key={action.id}
                onClick={action.action}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${action.color}30`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = action.gradient
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 25px ${action.color}40`
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
                onTouchStart={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(0.98)'
                  }
                }}
                onTouchEnd={(e) => {
                  if (isMobile) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <div style={{
                  width: isMobile ? '44px' : '48px',
                  height: isMobile ? '44px' : '48px',
                  borderRadius: '12px',
                  background: `${action.color}20`,
                  border: `1px solid ${action.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={isMobile ? 20 : 22} color={action.color} />
                </div>

                <div>
                  <div style={{
                    fontSize: isMobile ? '0.95rem' : '1rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '0.25rem'
                  }}>
                    {action.label}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {action.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Actions */}
      <div>
        <h3 style={{
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ArrowRight size={18} color="#3b82f6" />
          Wijzig Status
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {statusActions.map((action) => {
            const IconComponent = action.icon
            const isActive = lead.status === action.status
            const isInProgress = actionInProgress === action.status

            return (
              <button
                key={action.id}
                onClick={() => !isActive && handleStatusChange(action.status)}
                disabled={isActive || isInProgress}
                style={{
                  padding: isMobile ? '1rem 1.25rem' : '1.125rem 1.5rem',
                  background: isActive
                    ? `${action.color}15`
                    : 'rgba(17, 17, 17, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: isActive
                    ? `1px solid ${action.color}50`
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  cursor: isActive || isInProgress ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px',
                  opacity: isActive ? 0.6 : isInProgress ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isMobile && !isActive && !isInProgress) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.transform = 'translateX(4px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile && !isActive) {
                    e.currentTarget.style.background = 'rgba(17, 17, 17, 0.5)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${action.color}20`,
                  border: `1px solid ${action.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComponent size={18} color={action.color} />
                </div>

                <span style={{
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  fontWeight: '500',
                  color: isActive ? action.color : '#fff',
                  flex: 1,
                  textAlign: 'left'
                }}>
                  {action.label}
                </span>

                {isActive && (
                  <span style={{
                    padding: '0.35rem 0.75rem',
                    background: `${action.color}20`,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: action.color
                  }}>
                    Actief
                  </span>
                )}

                {isInProgress && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: `2px solid ${action.color}40`,
                    borderTopColor: action.color,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact Info Quick Reference */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        borderRadius: '12px'
      }}>
        <h4 style={{
          fontSize: '0.85rem',
          fontWeight: '600',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Contact Gegevens
        </h4>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Phone size={16} color="#10b981" style={{ flexShrink: 0 }} />
            <a
              href={`tel:${lead.phone}`}
              style={{
                color: '#10b981',
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              {lead.phone}
            </a>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Mail size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
            <a
              href={`mailto:${lead.email}`}
              style={{
                color: '#3b82f6',
                fontSize: '0.9rem',
                textDecoration: 'none',
                fontWeight: '500',
                wordBreak: 'break-all'
              }}
            >
              {lead.email}
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
