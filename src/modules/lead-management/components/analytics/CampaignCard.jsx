import { useState } from 'react'
import { Calendar, Send, Target, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import MetricCounter from './MetricCounter'

export default function CampaignCard({ 
  campaign, 
  isMobile, 
  onAddMetric, 
  onIncrementMetric, 
  onDecrementMetric, 
  onDeleteMetric,
  onDeleteCampaign 
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const totalResponses = campaign.metrics?.reduce((sum, m) => sum + (m.metric_value || 0), 0) || 0
  const responseRate = campaign.total_sent > 0 
    ? ((totalResponses / campaign.total_sent) * 100).toFixed(1)
    : 0

  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Header - Always Visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          padding: isMobile ? '1rem' : '1.25rem',
          cursor: 'pointer',
          background: isExpanded 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%)'
            : 'transparent',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem'
        }}>
          {/* Left: Platform + Stats */}
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '600',
                color: '#10b981',
                margin: 0
              }}>
                {campaign.platform}
              </h3>
              
              <span style={{
                padding: '0.25rem 0.65rem',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#3b82f6'
              }}>
                {responseRate}% rate
              </span>
            </div>

            {/* Quick Stats */}
            <div style={{
              display: 'flex',
              gap: isMobile ? '1rem' : '1.5rem',
              flexWrap: 'wrap',
              marginTop: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {formatDate(campaign.campaign_date)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {campaign.total_sent} verzonden
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  {totalResponses} responses
                </span>
              </div>
            </div>
          </div>

          {/* Right: Expand Button */}
          <button
            style={{
              padding: '0.5rem',
              background: isExpanded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: isExpanded ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)'
        }}>
          {/* Purpose */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '0 0 0.5rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Doel
            </h4>
            <p style={{
              fontSize: '0.95rem',
              color: '#fff',
              margin: 0
            }}>
              {campaign.purpose}
            </p>
          </div>

          {/* Message */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.6)',
              margin: '0 0 0.5rem 0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Bericht
            </h4>
            <div style={{
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px'
            }}>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: 0,
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {campaign.message_text}
              </p>
            </div>
          </div>

          {/* Metrics Section */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h4 style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Metrics
              </h4>

              <button
                onClick={() => onAddMetric(campaign.id)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: '#10b981',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'
                }}
              >
                <Plus size={16} />
                {!isMobile && 'Metric'}
              </button>
            </div>

            {/* Metric Counters */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              {campaign.metrics && campaign.metrics.length > 0 ? (
                campaign.metrics.map(metric => (
                  <MetricCounter
                    key={metric.id}
                    metric={metric}
                    totalSent={campaign.total_sent}
                    isMobile={isMobile}
                    onIncrement={() => onIncrementMetric(metric.id)}
                    onDecrement={() => onDecrementMetric(metric.id)}
                    onDelete={() => onDeleteMetric(metric.id)}
                  />
                ))
              ) : (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.875rem'
                }}>
                  Nog geen metrics. Klik op "+ Metric" om er een toe te voegen.
                </div>
              )}
            </div>
          </div>

          {/* Delete Campaign Button */}
          <button
            onClick={() => {
              if (window.confirm('Campagne verwijderen? Dit verwijdert ook alle metrics.')) {
                onDeleteCampaign(campaign.id)
              }
            }}
            style={{
              width: '100%',
              marginTop: '1.5rem',
              padding: isMobile ? '0.875rem' : '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              color: '#ef4444',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
            }}
          >
            <Trash2 size={18} />
            Campagne Verwijderen
          </button>
        </div>
      )}
    </div>
  )
}
