// src/modules/client-checkin/components/CheckinListView.jsx
// List view voor alle check-ins
// Features: Filters, search, cards met scores, pending indicator

import { useState } from 'react'
import {
  ClipboardList,
  User,
  Calendar,
  Search,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react'

// Gold theme
const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

const STATUS_CONFIG = {
  submitted: { label: 'Nieuw', color: '#fbbf24', icon: Clock },
  reviewed: { label: 'Bekeken', color: '#10b981', icon: CheckCircle },
  draft: { label: 'Concept', color: '#6b7280', icon: ClipboardList }
}

const getScoreColor = (score) => {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#eab308'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}

export default function CheckinListView({
  checkins = [],
  onSelectCheckin,
  onCreateNew
}) {
  const isMobile = window.innerWidth <= 768
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Filter check-ins
  const filteredCheckins = checkins.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false
    if (searchQuery) {
      const clientName = `${c.clients?.first_name || ''} ${c.clients?.last_name || ''}`.toLowerCase()
      if (!clientName.includes(searchQuery.toLowerCase())) return false
    }
    return true
  })
  
  const pendingCount = checkins.filter(c => c.status === 'submitted').length
  
  // Calculate average score for a check-in
  const getAverageScore = (checkin) => {
    const scores = [
      checkin.voeding_score,
      checkin.weekend_score,
      checkin.slaap_score,
      checkin.training_score,
      checkin.energie_score,
      checkin.motivatie_score
    ].filter(s => s !== null && s !== undefined)
    
    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }
  
  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Icon */}
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${GOLD.primary}20 0%, ${GOLD.secondary}10 100%)`,
            border: `1px solid ${GOLD.borderActive}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${GOLD.glow}`
          }}>
            <ClipboardList size={isMobile ? 28 : 32} color={GOLD.primary} />
          </div>
          
          {/* Title */}
          <div>
            <h1 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Check-ins
            </h1>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              margin: 0
            }}>
              {pendingCount > 0 ? `${pendingCount} nieuw` : 'Geen nieuwe'} · {checkins.length} totaal
            </p>
          </div>
        </div>
        
        {/* Create Button */}
        <button
          onClick={onCreateNew}
          style={{
            padding: isMobile ? '0.875rem 1.25rem' : '1rem 1.5rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '12px',
            color: '#000',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '48px',
            boxShadow: `0 4px 20px ${GOLD.glow}`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Plus size={20} />
          Nieuwe Check-in
        </button>
      </div>
      
      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all', label: 'Alles' },
          { id: 'submitted', label: `Nieuw (${pendingCount})` },
          { id: 'reviewed', label: 'Bekeken' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: isMobile ? '0.5rem 0.875rem' : '0.6rem 1rem',
              background: filter === f.id ? GOLD.background : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${filter === f.id ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '10px',
              color: filter === f.id ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: filter === f.id ? '600' : '400',
              cursor: 'pointer',
              minHeight: '44px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255, 255, 255, 0.4)'
          }}
        />
        <input
          type="text"
          placeholder="Zoek op client naam..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem 1rem 0.75rem 3rem' : '0.875rem 1rem 0.875rem 3rem',
            background: 'rgba(0, 0, 0, 0.4)',
            border: `1px solid ${GOLD.border}`,
            borderRadius: '12px',
            color: '#fff',
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            outline: 'none',
            minHeight: '44px'
          }}
        />
      </div>
      
      {/* List */}
      {filteredCheckins.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '16px',
          border: `1px solid ${GOLD.border}`
        }}>
          <ClipboardList
            size={48}
            color={GOLD.primary}
            style={{ opacity: 0.4, marginBottom: '1rem' }}
          />
          <p style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: isMobile ? '0.95rem' : '1rem',
            marginBottom: '1rem'
          }}>
            Geen check-ins gevonden
          </p>
          <button
            onClick={onCreateNew}
            style={{
              padding: '0.75rem 1.5rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '10px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            Eerste Check-in Maken
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {filteredCheckins.map(checkin => {
            const avgScore = getAverageScore(checkin)
            const StatusIcon = STATUS_CONFIG[checkin.status]?.icon || ClipboardList
            
            return (
              <button
                key={checkin.id}
                onClick={() => onSelectCheckin(checkin)}
                style={{
                  width: '100%',
                  padding: isMobile ? '1rem' : '1.25rem',
                  background: checkin.status === 'submitted'
                    ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0, 0, 0, 0.4) 100%)`
                    : 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${checkin.status === 'submitted' ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  position: 'relative',
                  overflow: 'hidden',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {/* Top accent for new */}
                {checkin.status === 'submitted' && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`
                  }} />
                )}
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  {/* Left: Avatar + Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: checkin.status === 'submitted'
                        ? `${GOLD.primary}20`
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${checkin.status === 'submitted' ? GOLD.border : 'rgba(255, 255, 255, 0.1)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <User
                        size={22}
                        color={checkin.status === 'submitted' ? GOLD.primary : 'rgba(255, 255, 255, 0.5)'}
                      />
                    </div>
                    
                    <div>
                      <h3 style={{
                        fontSize: isMobile ? '0.95rem' : '1rem',
                        fontWeight: '600',
                        color: '#fff',
                        margin: 0
                      }}>
                        {checkin.clients?.first_name} {checkin.clients?.last_name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <p style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}>
                          <Calendar size={12} />
                          {new Date(checkin.checkin_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </p>
                        <span style={{
                          padding: '0.15rem 0.5rem',
                          background: `${STATUS_CONFIG[checkin.status]?.color}20`,
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          color: STATUS_CONFIG[checkin.status]?.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <StatusIcon size={10} />
                          {STATUS_CONFIG[checkin.status]?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Score + Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {avgScore > 0 && (
                      <div style={{
                        padding: '0.35rem 0.75rem',
                        background: `${getScoreColor(avgScore)}20`,
                        borderRadius: '8px',
                        border: `1px solid ${getScoreColor(avgScore)}40`
                      }}>
                        <span style={{
                          fontSize: isMobile ? '0.9rem' : '0.95rem',
                          fontWeight: '700',
                          color: getScoreColor(avgScore)
                        }}>
                          {avgScore.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
