// src/modules/lead-management/components/CampaignTracker.jsx
// Campaign Management & Live Funnel Stats

import { useState, useEffect } from 'react'
import { 
  Target, Plus, X, Play, Pause, Square, 
  TrendingUp, Users, MessageCircle, Phone, 
  ChevronDown, ChevronUp, RefreshCw, BarChart3,
  Instagram, Zap, CheckCircle
} from 'lucide-react'
import campaignTrackingService from '../CampaignTrackingService'

export default function CampaignTracker({ coachId, isMobile, onCampaignChange }) {
  const [campaigns, setCampaigns] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [selectedCampaignStats, setSelectedCampaignStats] = useState(null)
  const [overallStats, setOverallStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // New Campaign Form
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    sourceAccount: '',
    sourceType: 'comments',
    hypothesis: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [coachId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [campaignsData, active, overall] = await Promise.all([
        campaignTrackingService.getCampaigns(coachId),
        campaignTrackingService.getActiveCampaign(coachId),
        campaignTrackingService.getOverallStats(coachId)
      ])

      setCampaigns(campaignsData)
      setActiveCampaign(active)
      setOverallStats(overall)

      // Load stats for active campaign
      if (active) {
        const stats = await campaignTrackingService.getCampaignLiveStats(active.id)
        setSelectedCampaignStats(stats)
      }

      // Notify parent of active campaign
      if (onCampaignChange) {
        onCampaignChange(active, campaignsData)
      }
    } catch (error) {
      console.error('❌ Load campaign data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleStartCampaign = async (e) => {
    e.preventDefault()
    if (!newCampaign.name.trim()) {
      alert('Geef de campaign een naam')
      return
    }

    try {
      const campaign = await campaignTrackingService.startCampaign(coachId, newCampaign)
      setShowNewCampaign(false)
      setNewCampaign({ name: '', sourceAccount: '', sourceType: 'comments', hypothesis: '', notes: '' })
      await loadData()
    } catch (error) {
      alert('Campaign starten mislukt')
    }
  }

  const handleEndCampaign = async (campaignId) => {
    if (!window.confirm('Campaign beëindigen?')) return
    try {
      await campaignTrackingService.endCampaign(campaignId)
      await loadData()
    } catch (error) {
      alert('Campaign beëindigen mislukt')
    }
  }

  const handlePauseCampaign = async (campaignId) => {
    try {
      await campaignTrackingService.pauseCampaign(campaignId)
      await loadData()
    } catch (error) {
      alert('Campaign pauzeren mislukt')
    }
  }

  const handleResumeCampaign = async (campaignId) => {
    try {
      await campaignTrackingService.resumeCampaign(campaignId)
      await loadData()
    } catch (error) {
      alert('Campaign hervatten mislukt')
    }
  }

  const loadCampaignStats = async (campaignId) => {
    try {
      const stats = await campaignTrackingService.getCampaignLiveStats(campaignId)
      setSelectedCampaignStats(stats)
    } catch (error) {
      console.error('❌ Load campaign stats failed:', error)
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(17, 17, 17, 0.8)',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.2)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(17, 17, 17, 0.8)',
      borderRadius: '16px',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
          }}>
            <Target size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
              Campaign Tracking
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Track welke bronnen de beste leads opleveren
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '36px',
              minHeight: '36px'
            }}
          >
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={() => setShowNewCampaign(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              minHeight: '36px'
            }}
          >
            <Plus size={16} />
            Nieuwe Campaign
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      {overallStats && (
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '0.75rem'
        }}>
          <StatCard label="Campaigns" value={overallStats.totalCampaigns} color="#10b981" icon={Target} />
          <StatCard label="Actief" value={overallStats.activeCampaigns} color="#3b82f6" icon={Play} />
          <StatCard label="Warm-Up" value={overallStats.totalWarmUpLeads} color="#E1306C" icon={Instagram} />
          <StatCard label="Geconverteerd" value={overallStats.totalConvertedLeads} color="#8b5cf6" icon={Users} />
        </div>
      )}

      {/* Active Campaign Banner */}
      {activeCampaign && (
        <div style={{
          margin: '1rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '600', textTransform: 'uppercase' }}>
                  Actieve Campaign
                </span>
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: '0 0 0.25rem 0' }}>
                {activeCampaign.name}
              </h4>
              {activeCampaign.source_account && (
                <p style={{ fontSize: '0.85rem', color: '#E1306C', margin: 0 }}>
                  {activeCampaign.source_account}
                </p>
              )}
              {activeCampaign.hypothesis && (
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                  "{activeCampaign.hypothesis}"
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handlePauseCampaign(activeCampaign.id)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '1px solid rgba(251, 191, 36, 0.4)',
                  borderRadius: '8px',
                  color: '#fbbf24',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
                title="Pauzeren"
              >
                <Pause size={16} />
              </button>
              <button
                onClick={() => handleEndCampaign(activeCampaign.id)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '36px',
                  minHeight: '36px'
                }}
                title="Beëindigen"
              >
                <Square size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Funnel Stats for Selected Campaign */}
      {selectedCampaignStats && (
        <div style={{ padding: '1rem' }}>
          <h4 style={{ 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            color: 'rgba(255,255,255,0.7)', 
            margin: '0 0 1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={16} color="#10b981" />
            Live Funnel - {selectedCampaignStats.campaign.name}
          </h4>

          {/* Funnel Visualization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <FunnelStep 
              label="Gescraped" 
              value={selectedCampaignStats.funnel.total_scraped} 
              percentage={100}
              color="#6b7280"
            />
            <FunnelStep 
              label="In Warm-Up" 
              value={selectedCampaignStats.funnel.warm_up_total} 
              percentage={selectedCampaignStats.funnel.total_scraped > 0 
                ? (selectedCampaignStats.funnel.warm_up_total / selectedCampaignStats.funnel.total_scraped) * 100 
                : 0}
              color="#f59e0b"
            />
            <FunnelStep 
              label="DM Gestuurd" 
              value={selectedCampaignStats.funnel.phase_4 || 0} 
              percentage={selectedCampaignStats.rates.warmup_to_dm}
              color="#E1306C"
            />
            <FunnelStep 
              label="Geconverteerd" 
              value={selectedCampaignStats.funnel.converted_to_lead} 
              percentage={selectedCampaignStats.rates.dm_to_lead}
              color="#10b981"
            />
            <FunnelStep 
              label="In Gesprek" 
              value={selectedCampaignStats.funnel.gesprek || 0} 
              percentage={selectedCampaignStats.rates.lead_to_conversation}
              color="#3b82f6"
            />
            <FunnelStep 
              label="Call Ingepland" 
              value={selectedCampaignStats.funnel.call_ingepland || 0} 
              percentage={selectedCampaignStats.rates.conversation_to_call}
              color="#8b5cf6"
            />
          </div>

          {/* Conversion Rates */}
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem'
          }}>
            <RateBox label="DM Rate" value={`${selectedCampaignStats.rates.warmup_to_dm}%`} />
            <RateBox label="Reply Rate" value={`${selectedCampaignStats.rates.dm_to_lead}%`} />
            <RateBox label="Total Conv." value={`${selectedCampaignStats.rates.overall_conversion}%`} />
          </div>
        </div>
      )}

      {/* Campaign History Toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            width: '100%',
            padding: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}
        >
          <span>Campaign Historie ({campaigns.length})</span>
          {showHistory ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showHistory && (
          <div style={{ padding: '0 1rem 1rem 1rem' }}>
            {campaigns.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
                Nog geen campaigns
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {campaigns.map(campaign => (
                  <CampaignHistoryItem 
                    key={campaign.id}
                    campaign={campaign}
                    isActive={activeCampaign?.id === campaign.id}
                    onSelect={() => loadCampaignStats(campaign.id)}
                    onResume={() => handleResumeCampaign(campaign.id)}
                    onEnd={() => handleEndCampaign(campaign.id)}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <NewCampaignModal
          isMobile={isMobile}
          formData={newCampaign}
          onChange={setNewCampaign}
          onSubmit={handleStartCampaign}
          onClose={() => setShowNewCampaign(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

// Sub-components

function StatCard({ label, value, color, icon: Icon }) {
  return (
    <div style={{
      padding: '0.75rem',
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: '10px',
      textAlign: 'center'
    }}>
      <Icon size={18} color={color} style={{ marginBottom: '0.25rem' }} />
      <div style={{ fontSize: '1.25rem', fontWeight: '700', color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
    </div>
  )
}

function FunnelStep({ label, value, percentage, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: '100px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>{label}</div>
      <div style={{ flex: 1, height: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${Math.min(100, percentage)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
          borderRadius: '6px',
          transition: 'width 0.5s ease'
        }} />
        <span style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.75rem',
          fontWeight: '600',
          color: '#fff'
        }}>
          {value}
        </span>
      </div>
      <div style={{ width: '45px', fontSize: '0.75rem', color, fontWeight: '600', textAlign: 'right' }}>
        {Math.round(percentage)}%
      </div>
    </div>
  )
}

function RateBox({ label, value }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>{label}</div>
    </div>
  )
}

function CampaignHistoryItem({ campaign, isActive, onSelect, onResume, onEnd, isMobile }) {
  const statusColors = {
    active: '#10b981',
    paused: '#fbbf24',
    completed: '#6b7280'
  }

  return (
    <div 
      onClick={onSelect}
      style={{
        padding: '0.75rem',
        background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
        border: isActive ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'all 0.2s ease'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: statusColors[campaign.status]
          }} />
          <span style={{ 
            fontSize: '0.9rem', 
            fontWeight: '600', 
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {campaign.name}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
          {campaign.source_account || 'Geen bron'} • {new Date(campaign.started_at).toLocaleDateString('nl-NL')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {campaign.status === 'paused' && (
          <button
            onClick={(e) => { e.stopPropagation(); onResume() }}
            style={{
              padding: '0.4rem',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '6px',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <Play size={14} />
          </button>
        )}
        {campaign.status !== 'completed' && (
          <button
            onClick={(e) => { e.stopPropagation(); onEnd() }}
            style={{
              padding: '0.4rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex'
            }}
          >
            <Square size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

function NewCampaignModal({ isMobile, formData, onChange, onSubmit, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Target size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', margin: 0 }}>
                Nieuwe Campaign
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                Start een scrape sessie
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ padding: '1.5rem' }}>
          {/* Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
              Campaign Naam *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="bijv. Jessy Knijn Comments 7-12-2025"
              required
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Source Account */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
              Bron Account
            </label>
            <input
              type="text"
              value={formData.sourceAccount}
              onChange={(e) => onChange({ ...formData, sourceAccount: e.target.value })}
              placeholder="@jessy_knijn"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>

          {/* Source Type */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
              Type Scrape
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {['comments', 'followers', 'likes', 'posts'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onChange({ ...formData, sourceType: type })}
                  style={{
                    padding: '0.6rem',
                    background: formData.sourceType === type ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.3)',
                    border: formData.sourceType === type ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: formData.sourceType === type ? '#10b981' : 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Hypothesis */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
              Hypothese (waarom gaat dit werken?)
            </label>
            <textarea
              value={formData.hypothesis}
              onChange={(e) => onChange({ ...formData, hypothesis: e.target.value })}
              placeholder="bijv. Transformatie content, jonge gasten die vragen 'hoe deed je dit?'"
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'none'
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>
              Notities
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              placeholder="Extra info..."
              rows={2}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'none'
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!formData.name.trim()}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: !formData.name.trim() ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: !formData.name.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              minHeight: '48px'
            }}
          >
            <Play size={18} />
            Campaign Starten
          </button>
        </form>
      </div>
    </div>
  )
}
