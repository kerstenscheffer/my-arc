import { Plus, Minus, CheckCircle, Calendar } from 'lucide-react'

export default function RequirementCard({ 
  icon: Icon,
  title,
  color,
  current,
  required,
  lastEntry,
  lastEntryLabel = 'Laatste',
  onAdd,
  onRemove,
  saving,
  isMobile
}) {
  const percentage = Math.round((current / required) * 100)
  const isMet = current >= required

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '14px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Icon size={isMobile ? 18 : 20} color={color} />
          <span style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            {title}
          </span>
        </div>
        {isMet && (
          <CheckCircle size={20} color="#10b981" strokeWidth={2.5} />
        )}
      </div>

      {/* Current Count */}
      <div style={{
        textAlign: 'center',
        marginBottom: '1.25rem'
      }}>
        <div style={{
          fontSize: isMobile ? '2.5rem' : '3rem',
          fontWeight: '800',
          color: isMet ? '#10b981' : '#fff',
          lineHeight: 1,
          marginBottom: '0.5rem'
        }}>
          {current}
          <span style={{
            fontSize: isMobile ? '1.5rem' : '1.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '600'
          }}>
            /{required}
          </span>
        </div>
        <div style={{
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          color: 'rgba(255, 255, 255, 0.6)',
          fontWeight: '500'
        }}>
          {percentage}% Complete
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '8px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: isMet
            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
            : `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isMet 
            ? '0 0 15px rgba(16, 185, 129, 0.5)'
            : `0 0 10px ${color}50`
        }} />
      </div>

      {/* Last Entry Info */}
      {lastEntry && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: isMobile ? '0.75rem' : '0.875rem',
          background: `${color}15`,
          borderRadius: '10px',
          border: `1px solid ${color}25`,
          marginBottom: '1.25rem'
        }}>
          <Calendar size={16} color="rgba(255, 255, 255, 0.6)" />
          <div style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {lastEntryLabel}: {' '}
            <span style={{ fontWeight: '600', color: color }}>
              {new Date(lastEntry).toLocaleDateString('nl-NL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: isMobile ? '0.75rem' : '1rem'
      }}>
        {/* Add Button */}
        <button
          onClick={onAdd}
          disabled={saving || current >= 56}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: current >= 56
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: current >= 56 ? 'rgba(255, 255, 255, 0.3)' : '#fff',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: (saving || current >= 56) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            opacity: (saving || current >= 56) ? 0.5 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Plus size={18} />
          {saving ? 'Bezig...' : 'Add'}
        </button>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          disabled={saving || current === 0 || !lastEntry}
          style={{
            padding: isMobile ? '0.875rem' : '1rem',
            background: (current === 0 || !lastEntry)
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: (current === 0 || !lastEntry) ? 'rgba(255, 255, 255, 0.3)' : '#ef4444',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '600',
            cursor: (saving || current === 0 || !lastEntry) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            opacity: (saving || current === 0 || !lastEntry) ? 0.5 : 1,
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Minus size={18} />
          {saving ? 'Bezig...' : 'Remove'}
        </button>
      </div>
    </div>
  )
}
