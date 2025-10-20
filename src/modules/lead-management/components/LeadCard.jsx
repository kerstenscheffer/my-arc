import { Mail, Phone, Calendar, Clock, MoreVertical, MessageSquare } from 'lucide-react'
import { useState } from 'react'

export default function LeadCard({ 
  lead, 
  isSelected, 
  onSelect, 
  onStatusChange, 
  onViewDetails,
  variant = 'card', // 'card' or 'row'
  isMobile 
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)

  // Status configuration
  const statusConfig = {
    new: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'Nieuw' },
    contacted: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'Benaderd' },
    scheduled: { color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', label: 'Gepland' },
    converted: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'Geconverteerd' },
    closed: { color: 'rgba(255, 255, 255, 0.5)', bg: 'rgba(255, 255, 255, 0.05)', label: 'Gesloten' },
    unqualified: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Niet gekwalificeerd' }
  }

  const priorityConfig = {
    high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'Hoog', icon: '🔴' },
    medium: { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)', label: 'Gemiddeld', icon: '🟠' },
    low: { color: 'rgba(255, 255, 255, 0.4)', bg: 'rgba(255, 255, 255, 0.05)', label: 'Laag', icon: '⚪' }
  }

  const status = statusConfig[lead.status] || statusConfig.new
  const priority = priorityConfig[lead.priority] || priorityConfig.medium

  // Time formatting
  const formatTimeAgo = (dateString) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d geleden`
    if (hours > 0) return `${hours}u geleden`
    return 'Zojuist'
  }

  // Card variant (mobile)
  if (variant === 'card') {
    return (
      <div
        onClick={() => onViewDetails(lead)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: isSelected 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
            : 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          border: isSelected 
            ? '1px solid rgba(16, 185, 129, 0.3)'
            : isHovered 
              ? '1px solid rgba(255, 255, 255, 0.15)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '14px' : '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered 
            ? '0 8px 25px rgba(0, 0, 0, 0.3)'
            : '0 4px 15px rgba(0, 0, 0, 0.2)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          position: 'relative'
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
        {/* Header Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '0.75rem',
          gap: '0.75rem'
        }}>
          {/* Checkbox + Name */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flex: 1,
            minWidth: 0
          }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onSelect(lead.id, e.target.checked)
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#10b981',
                flexShrink: 0
              }}
            />
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '600',
                color: '#fff',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {lead.first_name} {lead.last_name}
              </h3>
            </div>
          </div>

          {/* Priority Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            background: priority.bg,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: priority.color,
            flexShrink: 0
          }}>
            <span>{priority.icon}</span>
            <span>{priority.label}</span>
          </div>
        </div>

        {/* Contact Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.75rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem'
          }}>
            <Mail size={14} style={{ flexShrink: 0, color: 'rgba(59, 130, 246, 0.7)' }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {lead.email}
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem'
          }}>
            <Phone size={14} style={{ flexShrink: 0, color: 'rgba(16, 185, 129, 0.7)' }} />
            <span>{lead.phone}</span>
          </div>
        </div>

        {/* Status + Time Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '0.35rem 0.75rem',
            background: status.bg,
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: '600',
            color: status.color
          }}>
            {status.label}
          </div>

          {/* Time ago */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '0.75rem'
          }}>
            <Clock size={12} />
            <span>{formatTimeAgo(lead.created_at)}</span>
          </div>
        </div>

        {/* Notes count indicator */}
        {lead.lead_notes?.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: '#3b82f6',
            fontWeight: '600'
          }}>
            <MessageSquare size={10} />
            <span>{lead.lead_notes.length}</span>
          </div>
        )}
      </div>
    )
  }

  // Row variant (desktop table)
  return (
    <tr
      onClick={() => onViewDetails(lead)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
          : isHovered
            ? 'rgba(255, 255, 255, 0.03)'
            : 'transparent',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      {/* Checkbox */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '40px'
      }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect(lead.id, e.target.checked)
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            accentColor: '#10b981'
          }}
        />
      </td>

      {/* Name */}
      <td style={{ 
        padding: '1rem 0.75rem',
        minWidth: '180px'
      }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: '600',
          color: '#fff'
        }}>
          {lead.first_name} {lead.last_name}
        </div>
      </td>

      {/* Email */}
      <td style={{ 
        padding: '1rem 0.75rem',
        minWidth: '200px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.85rem'
        }}>
          <Mail size={14} style={{ color: 'rgba(59, 130, 246, 0.7)', flexShrink: 0 }} />
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {lead.email}
          </span>
        </div>
      </td>

      {/* Phone */}
      <td style={{ 
        padding: '1rem 0.75rem',
        minWidth: '140px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.85rem'
        }}>
          <Phone size={14} style={{ color: 'rgba(16, 185, 129, 0.7)', flexShrink: 0 }} />
          <span>{lead.phone}</span>
        </div>
      </td>

      {/* Status */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '140px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '0.35rem 0.75rem',
          background: status.bg,
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: status.color
        }}>
          {status.label}
        </div>
      </td>

      {/* Priority */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '110px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: priority.color
        }}>
          <span>{priority.icon}</span>
          <span>{priority.label}</span>
        </div>
      </td>

      {/* Time */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '100px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '0.75rem'
        }}>
          <Clock size={12} />
          <span>{formatTimeAgo(lead.created_at)}</span>
        </div>
      </td>

      {/* Notes */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '70px',
        textAlign: 'center'
      }}>
        {lead.lead_notes?.length > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.5rem',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            fontSize: '0.7rem',
            color: '#3b82f6',
            fontWeight: '600'
          }}>
            <MessageSquare size={10} />
            <span>{lead.lead_notes.length}</span>
          </div>
        )}
      </td>

      {/* Actions */}
      <td style={{ 
        padding: '1rem 0.75rem',
        width: '50px',
        position: 'relative'
      }}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowActions(!showActions)
          }}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: showActions ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            color: 'rgba(255, 255, 255, 0.7)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseLeave={(e) => {
            if (!showActions) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <MoreVertical size={16} />
        </button>

        {/* Actions dropdown */}
        {showActions && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              background: 'rgba(17, 17, 17, 0.98)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '0.5rem',
              minWidth: '160px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.5)',
              zIndex: 10
            }}
          >
            {Object.keys(statusConfig).map((statusKey) => (
              <button
                key={statusKey}
                onClick={(e) => {
                  e.stopPropagation()
                  onStatusChange(lead.id, statusKey)
                  setShowActions(false)
                }}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: statusConfig[statusKey].color,
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = statusConfig[statusKey].bg
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusConfig[statusKey].color
                }} />
                {statusConfig[statusKey].label}
              </button>
            ))}
          </div>
        )}
      </td>
    </tr>
  )
}

