import { useState, useEffect } from 'react'
import { Users, BarChart3, Settings, RefreshCw, Download } from 'lucide-react'
import LeadOverview from './components/LeadOverview'
import LeadManagementService from './LeadManagementService'

export default function LeadManagement({ db, isMobile, coachId, user }) {
  const [activeView, setActiveView] = useState('overview')
  const [leads, setLeads] = useState([])
  const [selectedLeads, setSelectedLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leadService, setLeadService] = useState(null)

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

  useEffect(() => {
    if (coachId) {
      initializeLeadManagement()
    }
    
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [coachId])

  useEffect(() => {
    if (leadService) {
      loadLeads()
      loadStats()
    }
  }, [leadService, filters, pagination.page])

  const initializeLeadManagement = async () => {
    try {
      console.log('🔄 Initializing Lead Management...')
      console.log('📍 CoachId:', coachId)
      
      if (!coachId) {
        console.warn('⚠️ No coachId provided, waiting...')
        setLoading(false)
        return
      }
      
      const service = new LeadManagementService()
      setLeadService(service)

      // Subscribe to real-time updates
      const sub = service.subscribeToLeadUpdates(coachId, (payload) => {
        console.log('📡 Real-time lead update:', payload.eventType)
        handleRealtimeUpdate(payload)
      })
      setSubscription(sub)

      console.log('✅ Lead Management initialized')
    } catch (error) {
      console.error('❌ Lead Management initialization failed:', error)
    } finally {
      setLoading(false)
    }
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
      
      // ✅ FIXED: Always update total on first page
      if (pagination.page === 1) {
        // If we got less than limit, that's the total
        // If we got exactly limit, there might be more (keep existing total or set to data.length)
        const newTotal = data.length < pagination.limit ? data.length : Math.max(data.length, pagination.total)
        setPagination(prev => ({ ...prev, total: newTotal }))
      }

      console.log('✅ Leads loaded:', data.length)
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
      const dateRangeMap = {
        'today': 1,
        'week': 7,
        'month': 30,
        'quarter': 90
      }
      
      const days = dateRangeMap[filters.dateRange] || 30
      const statsData = await leadService.getLeadStats(coachId, days)
      
      // ✅ DEBUG LOGGING
      console.log('📊 Stats data received:', statsData)
      console.log('📊 total_leads value:', statsData?.total_leads)
      
      setStats(statsData)
    } catch (error) {
      console.error('❌ Load stats failed:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([loadLeads(false), loadStats()])
    setRefreshing(false)
  }

  const handleRealtimeUpdate = (payload) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    setLeads(currentLeads => {
      switch (eventType) {
        case 'INSERT':
          return [newRecord, ...currentLeads]
        case 'UPDATE':
          return currentLeads.map(lead => 
            lead.id === newRecord.id ? newRecord : lead
          )
        case 'DELETE':
          return currentLeads.filter(lead => lead.id !== oldRecord.id)
        default:
          return currentLeads
      }
    })

    // ✅ FIXED: Reload stats after any update
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
    setSelectedLeads(prev => {
      if (isSelected) {
        return [...prev, leadId]
      } else {
        return prev.filter(id => id !== leadId)
      }
    })
  }

  const handleSelectAll = () => {
    setSelectedLeads(leads.map(lead => lead.id))
  }

  const handleDeselectAll = () => {
    setSelectedLeads([])
  }

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

    const confirmed = window.confirm(
      `Weet je zeker dat je ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} wilt verwijderen?`
    )

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

  const tabs = [
    { id: 'overview', label: 'Overzicht', icon: Users, badge: stats.total_leads },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'settings', label: 'Instellingen', icon: Settings, badge: null }
  ]

  if (loading && leads.length === 0) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        margin: isMobile ? '1rem' : '2rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Lead Management laden...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      padding: isMobile ? '1rem' : '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '1rem' : '2rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '1.75rem' : '2.25rem',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '0.5rem'
          }}>
            Lead Management
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.9rem' : '1rem',
            margin: 0
          }}>
            Beheer en volg al je leads vanaf één plek
          </p>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              padding: isMobile ? '0.6rem' : '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              opacity: refreshing ? 0.6 : 1,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <RefreshCw size={isMobile ? 14 : 16} style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none'
            }} />
            {!isMobile && 'Vernieuwen'}
          </button>

          <button
            onClick={handleExport}
            style={{
              padding: isMobile ? '0.6rem' : '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          >
            <Download size={isMobile ? 14 : 16} />
            {!isMobile && 'Export'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: isMobile ? 'auto' : 'visible',
        paddingBottom: isMobile ? '0.5rem' : '0'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
              background: activeView === tab.id 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: activeView === tab.id
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: activeView === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: activeView === tab.id ? '600' : '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <tab.icon size={isMobile ? 16 : 18} />
            {tab.label}
            {tab.badge !== null && (
              <span style={{
                background: activeView === tab.id 
                  ? 'rgba(16, 185, 129, 0.2)' 
                  : 'rgba(255, 255, 255, 0.1)',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div>
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

        {activeView === 'analytics' && (
          <div style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(17, 17, 17, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <BarChart3 size={48} color="rgba(59, 130, 246, 0.5)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Analytics Dashboard
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.95rem'
              }}>
                Wordt gebouwd in Fase 3
              </p>
            </div>
          </div>
        )}

        {activeView === 'settings' && (
          <div style={{
            minHeight: '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(17, 17, 17, 0.5)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div>
              <Settings size={48} color="rgba(139, 92, 246, 0.5)" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                Instellingen
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.95rem'
              }}>
                Wordt gebouwd in Fase 3
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        div::-webkit-scrollbar {
          height: 4px;
        }
        
        div::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        div::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 2px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  )
}
