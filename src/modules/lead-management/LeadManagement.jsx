// src/modules/lead-management/LeadManagement.jsx
// VERSION 5.0 - COMPACT HEADER + PILL STRIP + ZERO BLOAT
// Follows MY ARC Styling Guide v2 — compact, data-driven, zero bullshit

import { useState, useEffect, useRef } from 'react'
import { 
  Users, BarChart3, Settings, RefreshCw, Download, LayoutGrid,
  Target, MessageCircle, TrendingUp, ClipboardList, ChevronDown,
  Flame, MoreHorizontal
} from 'lucide-react'
import LeadOverview from './components/LeadOverview'
import LeadManagementService from './LeadManagementService'
import KanbanBoard from './components/kanban/KanbanBoard'
import OutreachAnalytics from './components/analytics/OutreachAnalytics'
import CampaignTracker from './components/CampaignTracker'
import campaignTrackingService from './CampaignTrackingService'
import LeadAnalyticsDashboard from '../lead-analytics/LeadAnalyticsDashboard'
import IntakeTab from './components/IntakeTab'
import LeadMoreMenu from './components/LeadMoreMenu'
import { SOPModal } from './components/DailyStatsBar'

// GOLD THEME (consistent with CoachHub)
const G = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  dark: '#B8860B',
  bg: 'rgba(255, 215, 0, 0.08)',
  bgStrong: 'rgba(255, 215, 0, 0.14)',
  border: 'rgba(255, 215, 0, 0.15)',
  borderActive: 'rgba(255, 215, 0, 0.4)',
  text: 'rgba(255, 215, 0, 0.6)',
}

// ============================================
// TAB CONFIG
// ============================================
const TABS = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'intake', label: 'Intake', icon: ClipboardList },
  { id: 'dm-flow', label: 'DM Flow', icon: MessageCircle },
  { id: 'overview', label: 'Overzicht', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'lead-analytics', label: 'Lead Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function LeadManagement({ db, isMobile, coachId, user }) {
  const [activeView, setActiveView] = useState('kanban')
  const [moreTabsOpen, setMoreTabsOpen] = useState(false)
  const [showSOP, setShowSOP] = useState(false)
  const [leads, setLeads] = useState([])
  const [selectedLeads, setSelectedLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leadService, setLeadService] = useState(null)

  const [campaigns, setCampaigns] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dateRange: 'month',
    search: '',
    source: 'all'
  })

  const [stats, setStats] = useState({
    total_leads: 0,
    new_leads: 0,
    contacted_leads: 0,
    scheduled_leads: 0,
    converted_leads: 0,
    conversion_rate: 0
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: isMobile ? 20 : 50,
    total: 0
  })

  const [subscription, setSubscription] = useState(null)
  const scrollRef = useRef(null)

  // ============================================
  // LIFECYCLE (unchanged logic)
  // ============================================
  useEffect(() => {
    if (coachId) initializeLeadManagement()
    return () => { if (subscription) subscription.unsubscribe() }
  }, [coachId])

  useEffect(() => {
    if (leadService) { loadLeads(); loadStats() }
  }, [leadService, filters, pagination.page])

  const initializeLeadManagement = async () => {
    try {
      if (!coachId) { setLoading(false); return }
      const service = new LeadManagementService()
      setLeadService(service)
      await loadCampaigns()
      const sub = service.subscribeToLeadUpdates(coachId, (payload) => {
        handleRealtimeUpdate(payload)
      })
      setSubscription(sub)
    } catch (error) {
      console.error('❌ Lead Management initialization failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCampaigns = async () => {
    try {
      const [campaignsData, active] = await Promise.all([
        campaignTrackingService.getCampaigns(coachId),
        campaignTrackingService.getActiveCampaign(coachId)
      ])
      setCampaigns(campaignsData)
      setActiveCampaign(active)
    } catch (error) {
      console.error('❌ Load campaigns failed:', error)
    }
  }

  const handleCampaignChange = (active, allCampaigns) => {
    setActiveCampaign(active)
    if (allCampaigns) setCampaigns(allCampaigns)
  }

  const loadLeads = async (showLoader = true) => {
    if (!leadService || !coachId) return
    try {
      if (showLoader) setLoading(true)
      const filterParams = {
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      }
      const data = await leadService.getLeads(coachId, filterParams)
      setLeads(data)
      if (pagination.page === 1) {
        const newTotal = data.length < pagination.limit ? data.length : Math.max(data.length, pagination.total)
        setPagination(prev => ({ ...prev, total: newTotal }))
      }
    } catch (error) {
      console.error('❌ Load leads failed:', error)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!leadService || !coachId) return
    try {
      const dateRangeMap = { 'today': 1, 'week': 7, 'month': 30, 'quarter': 90 }
      const days = dateRangeMap[filters.dateRange] || 30
      const statsData = await leadService.getLeadStats(coachId, days)
      setStats(statsData)
    } catch (error) {
      console.error('❌ Load stats failed:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadLeads(false), loadStats(), loadCampaigns()])
    setRefreshing(false)
  }

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    setLeads(currentLeads => {
      switch (eventType) {
        case 'INSERT':
          // INSERT lacks the embed; reload to get the full shape. Cheaper
          // than fetching just one row with joins.
          loadLeads(false)
          return currentLeads
        case 'UPDATE':
          // Realtime payloads only carry plain columns — NO embedded joins
          // (outreach_campaign, source_lead_magnet, lead_notes). Without
          // this merge those nested objects get nuked on every touch
          // (last_touched, contacted_today, reply_count, …) and the gold
          // campaign pill / purple magnet pill disappear from the card.
          // Spread-merging preserves them while still applying the new
          // column values.
          return currentLeads.map(lead => {
            if (lead.id !== newRecord.id) return lead
            const merged = { ...lead, ...newRecord }
            // If the FK changed, the cached embed is now stale — drop it
            // so a fresh loadLeads can repopulate. The card simply shows
            // no pill until then (better than showing the wrong one).
            if (newRecord.outreach_campaign_id !== lead.outreach_campaign_id) {
              merged.outreach_campaign = null
            }
            if (newRecord.source_lead_magnet_id !== lead.source_lead_magnet_id) {
              merged.source_lead_magnet = null
            }
            return merged
          })
        case 'DELETE':
          return currentLeads.filter(lead => lead.id !== oldRecord.id)
        default:
          return currentLeads
      }
    })
    loadStats()
  }

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setSelectedLeads([])
  }

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleLeadSelect = (leadId, isSelected) => {
    setSelectedLeads(prev => isSelected ? [...prev, leadId] : prev.filter(id => id !== leadId))
  }

  const handleSelectAll = () => setSelectedLeads(leads.map(lead => lead.id))
  const handleDeselectAll = () => setSelectedLeads([])

  const handleBulkStatusUpdate = async (newStatus) => {
    if (!leadService || selectedLeads.length === 0) return
    try {
      await leadService.bulkUpdateStatus(selectedLeads, newStatus, coachId)
      await Promise.all([loadLeads(false), loadStats()])
      setSelectedLeads([])
    } catch (error) {
      console.error('❌ Bulk status update failed:', error)
    }
  }

  const handleBulkDelete = async () => {
    if (!leadService || selectedLeads.length === 0) return
    const confirmed = window.confirm(`Weet je zeker dat je ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} wilt verwijderen?`)
    if (confirmed) {
      try {
        await leadService.bulkDeleteLeads(selectedLeads, true)
        await Promise.all([loadLeads(false), loadStats()])
        setSelectedLeads([])
      } catch (error) {
        console.error('❌ Bulk delete failed:', error)
      }
    }
  }

  const handleExport = async () => {
    if (!leadService) return
    try {
      const csvContent = await leadService.exportLeadsCSV(filters, coachId)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('❌ Export failed:', error)
    }
  }

  const handleLeadStatusUpdate = async (leadId, newStatus) => {
    if (!leadService) return
    try {
      await leadService.updateLeadStatus(leadId, newStatus, coachId)
      await Promise.all([loadLeads(false), loadStats()])
    } catch (error) {
      console.error('❌ Update lead status failed:', error)
    }
  }

  const handleAddNote = async (leadId, noteData) => {
    if (!leadService) return
    try {
      await leadService.addLeadNote(leadId, noteData, coachId)
    } catch (error) {
      console.error('❌ Add note failed:', error)
    }
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo(0, 0)
  }

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && leads.length === 0) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `2px solid ${G.border}`,
          borderTopColor: G.primary,
          borderRadius: '50%',
          animation: 'lmSpin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      transform: 'translateZ(0)'
    }}>
      {/* Datum + stats staan nu samengevoegd in de PeriodStatsBar (in de kanban-
          view). Deze rij toont alleen nog de actieve campagne wanneer relevant. */}
      {activeCampaign && activeView !== 'campaigns' && (
      <div style={{
        padding: isMobile ? '0.5rem 1rem' : '0.5rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
          <button
            onClick={() => setActiveView('campaigns')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.2rem 0.5rem',
              background: G.bg,
              border: `1px solid ${G.border}`,
              borderRadius: '6px',
              color: G.text,
              fontSize: isMobile ? '0.6rem' : '0.65rem',
              fontWeight: '600',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '28px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              maxWidth: isMobile ? '120px' : '200px'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: G.primary,
              flexShrink: 0
            }} />
            <span style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {activeCampaign.name}
            </span>
          </button>
      </div>
      )}

      {/* Nav-rij: alleen op de ANDERE views (op de kanban-view zit "Meer" in de
          toolbar). Zo kun je vanaf elke view terug naar Kanban of een andere view. */}
      {activeView !== 'kanban' && (
        <div style={{ padding: isMobile ? '0.5rem 1rem' : '0.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', zIndex: 30 }}>
          <LeadMoreMenu views={TABS} activeView={activeView} onSelect={setActiveView} onOpenSOP={() => setShowSOP(true)} isMobile={isMobile} align="left" />
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem'
      }}>
        {activeView === 'kanban' && (
          <KanbanBoard
            leadService={leadService}
            db={db}
            coachId={coachId}
            isMobile={isMobile}
            campaigns={campaigns}
            activeCampaign={activeCampaign}
            onCampaignChange={handleCampaignChange}
            leadViews={TABS}
            activeLeadView={activeView}
            onSelectLeadView={setActiveView}
            onOpenSOP={() => setShowSOP(true)}
          />
        )}

        {activeView === 'intake' && (
          <IntakeTab isMobile={isMobile} />
        )}

        {activeView === 'dm-flow' && (
          <PlaceholderSection
            icon={MessageCircle}
            title="DM Flow Dashboard"
            subtitle="Wordt gebouwd in volgende fase"
            color="#8b5cf6"
            isMobile={isMobile}
          />
        )}

        {activeView === 'overview' && (
          <LeadOverview
            leads={leads}
            selectedLeads={selectedLeads}
            filters={filters}
            stats={stats}
            pagination={pagination}
            loading={loading}
            isMobile={isMobile}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            onLeadSelect={handleLeadSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onBulkDelete={handleBulkDelete}
            onLeadStatusUpdate={handleLeadStatusUpdate}
            onAddNote={handleAddNote}
            onPageChange={handlePageChange}
            leadService={leadService}
          />
        )}

        {activeView === 'campaigns' && (
          <CampaignTracker
            coachId={coachId}
            isMobile={isMobile}
            onCampaignChange={handleCampaignChange}
          />
        )}

        {activeView === 'analytics' && (
          <OutreachAnalytics
            leadService={leadService}
            coachId={coachId}
            isMobile={isMobile}
          />
        )}

        {activeView === 'lead-analytics' && (
          <LeadAnalyticsDashboard
            db={db}
            coachId={coachId}
            isMobile={isMobile}
          />
        )}

        {activeView === 'settings' && (
          <PlaceholderSection
            icon={Settings}
            title="Instellingen"
            subtitle="Wordt gebouwd in Fase 3"
            color={G.secondary}
            isMobile={isMobile}
          />
        )}
      </div>

      {showSOP && <SOPModal isMobile={isMobile} onClose={() => setShowSOP(false)} />}

      <style>{`
        @keyframes lmSpin {
          to { transform: rotate(360deg); }
        }
        div::-webkit-scrollbar { height: 0px; width: 0px; }
      `}</style>
    </div>
  )
}

// ============================================
// PLACEHOLDER (for unbuilt tabs)
// ============================================
function PlaceholderSection({ icon: Icon, title, subtitle, color, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
      textAlign: 'center'
    }}>
      <Icon 
        size={28} 
        color={color} 
        style={{ opacity: 0.5, marginBottom: '0.75rem' }} 
      />
      <h3 style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        fontWeight: '700',
        color: color,
        margin: '0 0 0.25rem 0'
      }}>
        {title}
      </h3>
      <p style={{
        color: 'rgba(255, 255, 255, 0.3)',
        fontSize: isMobile ? '0.75rem' : '0.8rem',
        margin: 0
      }}>
        {subtitle}
      </p>
    </div>
  )
}
