import { useState, useEffect } from 'react'
import { Plus, TrendingUp, Send, Target, BarChart3 } from 'lucide-react'
import CampaignCard from './CampaignCard'
import AddCampaignModal from './AddCampaignModal'
import AddMetricModal from './AddMetricModal'

export default function OutreachAnalytics({ leadService, coachId, isMobile }) {
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddCampaign, setShowAddCampaign] = useState(false)
  const [showAddMetric, setShowAddMetric] = useState(false)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)

  useEffect(() => {
    if (leadService && coachId) {
      loadData()
    }
  }, [leadService, coachId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [campaignsData, statsData] = await Promise.all([
        leadService.getCampaigns(coachId),
        leadService.getCampaignStats(coachId, 30)
      ])
      setCampaigns(campaignsData)
      setStats(statsData)
    } catch (error) {
      console.error('❌ Load analytics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCampaign = async (campaignData) => {
    try {
      await leadService.createCampaign(campaignData, coachId)
      await loadData()
      setShowAddCampaign(false)
    } catch (error) {
      console.error('❌ Create campaign failed:', error)
      alert('Campagne aanmaken mislukt')
    }
  }

  const handleAddMetric = async (metricName, metricColor) => {
    try {
      await leadService.addMetric(selectedCampaignId, metricName, metricColor)
      await loadData()
      setShowAddMetric(false)
      setSelectedCampaignId(null)
    } catch (error) {
      console.error('❌ Add metric failed:', error)
      alert('Metric toevoegen mislukt')
    }
  }

const handleIncrementMetric = async (metricId) => {
    try {
      // Optimistic update - direct in state
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => ({
          ...campaign,
          metrics: campaign.metrics?.map(metric => 
            metric.id === metricId 
              ? { ...metric, metric_value: metric.metric_value + 1 }
              : metric
          )
        }))
      )

      // Then update database
      await leadService.incrementMetric(metricId)
    } catch (error) {
      console.error('❌ Increment failed:', error)
      // Rollback on error
      await loadData()
    }
  }

  const handleDecrementMetric = async (metricId) => {
    try {
      // Optimistic update - direct in state
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(campaign => ({
          ...campaign,
          metrics: campaign.metrics?.map(metric => 
            metric.id === metricId 
              ? { ...metric, metric_value: Math.max(0, metric.metric_value - 1) }
              : metric
          )
        }))
      )

      // Then update database
      await leadService.decrementMetric(metricId)
    } catch (error) {
      console.error('❌ Decrement failed:', error)
      // Rollback on error
      await loadData()
    }
  }
  const handleDeleteMetric = async (metricId) => {
    if (!window.confirm('Metric verwijderen?')) return
    try {
      await leadService.deleteMetric(metricId)
      await loadData()
    } catch (error) {
      console.error('❌ Delete metric failed:', error)
    }
  }

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await leadService.deleteCampaign(campaignId)
      await loadData()
    } catch (error) {
      console.error('❌ Delete campaign failed:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
      {/* Stats Overview */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Total Campaigns */}
          <div style={{
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <BarChart3 size={20} style={{ color: '#3b82f6' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
                Campagnes
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
              {stats.total_campaigns}
            </div>
          </div>

          {/* Total Sent */}
          <div style={{
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Send size={20} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
                Verzonden
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
              {stats.total_sent}
            </div>
          </div>

          {/* Total Responses */}
          <div style={{
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <Target size={20} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
                Responses
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
              {stats.total_responses}
            </div>
          </div>

          {/* Conversion Rate */}
          <div style={{
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(249, 115, 22, 0.3)',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: '#f97316' }} />
              <span style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' }}>
                Response Rate
              </span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f97316' }}>
              {stats.conversion_rate}%
            </div>
          </div>
        </div>
      )}

      {/* Header + Add Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        gap: '1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0
        }}>
          Outreach Campagnes
        </h2>

        <button
          onClick={() => setShowAddCampaign(true)}
          style={{
            padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            minHeight: '44px',
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Plus size={isMobile ? 16 : 18} />
          Nieuwe Campagne
        </button>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div style={{
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(17, 17, 17, 0.5)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <BarChart3 size={64} color="rgba(59, 130, 246, 0.5)" style={{ marginBottom: '1rem' }} />
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Nog geen campagnes
          </h3>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.95rem',
            marginBottom: '1.5rem'
          }}>
            Maak je eerste outreach campagne aan om te beginnen met tracken
          </p>
          <button
            onClick={() => setShowAddCampaign(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            Campagne Aanmaken
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(450px, 1fr))',
          gap: '1.25rem'
        }}>
          {campaigns.map(campaign => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isMobile={isMobile}
              onAddMetric={(campaignId) => {
                setSelectedCampaignId(campaignId)
                setShowAddMetric(true)
              }}
              onIncrementMetric={handleIncrementMetric}
              onDecrementMetric={handleDecrementMetric}
              onDeleteMetric={handleDeleteMetric}
              onDeleteCampaign={handleDeleteCampaign}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddCampaign && (
        <AddCampaignModal
          isMobile={isMobile}
          onClose={() => setShowAddCampaign(false)}
          onSubmit={handleCreateCampaign}
        />
      )}

      {showAddMetric && (
        <AddMetricModal
          isMobile={isMobile}
          onClose={() => {
            setShowAddMetric(false)
            setSelectedCampaignId(null)
          }}
          onSubmit={handleAddMetric}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
