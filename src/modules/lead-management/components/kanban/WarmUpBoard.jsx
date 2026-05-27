// src/modules/lead-management/components/kanban/WarmUpBoard.jsx
// VERSION 3.0 - OPTIMISTIC UPDATES: Geen harde refresh, instant UI

import { useState, useEffect } from 'react'
import { Plus, Instagram, Target, CheckCircle, Zap, RefreshCw, CheckSquare, Square, Loader } from 'lucide-react'
import WarmUpCard from './WarmUpCard'
import AddWarmUpModal from './AddWarmUpModal'
import campaignTrackingService from '../../CampaignTrackingService'

export default function WarmUpBoard({ 
  leadService, 
  coachId, 
  isMobile, 
  sections: kanbanSections,
  campaigns: propCampaigns = [],
  activeCampaign: propActiveCampaign = null
}) {
  const [board, setBoard] = useState([])
  const [stats, setStats] = useState({ total: 0, interactedToday: 0, pendingToday: 0 })
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  // BULK SELECTIE STATE
  const [selectedLeads, setSelectedLeads] = useState(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Local campaign state
  const [campaigns, setCampaigns] = useState(propCampaigns)
  const [activeCampaign, setActiveCampaign] = useState(propActiveCampaign)

  // Sync with props when they change
  useEffect(() => {
    if (propCampaigns.length > 0) setCampaigns(propCampaigns)
    if (propActiveCampaign) setActiveCampaign(propActiveCampaign)
  }, [propCampaigns, propActiveCampaign])

  // Load campaigns if not provided via props
  useEffect(() => {
    if (propCampaigns.length === 0 && coachId) loadCampaigns()
  }, [coachId, propCampaigns.length])

  const loadCampaigns = async () => {
    try {
      const [campaignsData, active] = await Promise.all([
        campaignTrackingService.getCampaigns(coachId),
        campaignTrackingService.getActiveCampaign(coachId)
      ])
      setCampaigns(campaignsData || [])
      setActiveCampaign(active)
    } catch (error) {
      console.error('Load campaigns failed:', error)
    }
  }

  useEffect(() => {
    loadBoard()
  }, [leadService, coachId])

  const loadBoard = async () => {
    try {
      setLoading(true)
      const [boardData, statsData] = await Promise.all([
        leadService.getWarmUpBoard(coachId),
        leadService.getWarmUpTodayStats(coachId)
      ])
      setBoard(boardData)
      setStats(statsData)
    } catch (error) {
      console.error('Load warm-up board failed:', error)
    } finally {
      setLoading(false)
    }
  }

  // =============================================
  // OPTIMISTIC UPDATE HELPERS
  // =============================================
  
  const updateLeadInBoard = (leadId, updates) => {
    setBoard(prevBoard => prevBoard.map(phase => ({
      ...phase,
      leads: phase.leads.map(lead => 
        lead.id === leadId ? { ...lead, ...updates } : lead
      )
    })))
  }

  const moveLeadToNextPhase = (leadId) => {
    setBoard(prevBoard => {
      let leadToMove = null
      let currentPhaseIndex = -1

      // Find the lead and its current phase
      prevBoard.forEach((phase, index) => {
        const found = phase.leads.find(l => l.id === leadId)
        if (found) {
          leadToMove = { ...found, interactedToday: true, isLocked: true }
          currentPhaseIndex = index
        }
      })

      if (!leadToMove || currentPhaseIndex === -1) return prevBoard

      const nextPhaseIndex = Math.min(currentPhaseIndex + 1, prevBoard.length - 1)

      return prevBoard.map((phase, index) => {
        if (index === currentPhaseIndex) {
          // Remove from current phase
          return {
            ...phase,
            leads: phase.leads.filter(l => l.id !== leadId),
            activeCount: phase.activeCount - 1
          }
        } else if (index === nextPhaseIndex && nextPhaseIndex !== currentPhaseIndex) {
          // Add to next phase (at the end, since it's now locked)
          return {
            ...phase,
            leads: [...phase.leads, leadToMove],
            lockedCount: phase.lockedCount + 1
          }
        }
        return phase
      })
    })

    // Update stats
    setStats(prev => ({
      ...prev,
      interactedToday: prev.interactedToday + 1,
      pendingToday: Math.max(0, prev.pendingToday - 1)
    }))
  }

  const removeLeadFromBoard = (leadId) => {
    setBoard(prevBoard => prevBoard.map(phase => ({
      ...phase,
      leads: phase.leads.filter(l => l.id !== leadId),
      activeCount: phase.leads.some(l => l.id === leadId && !l.interactedToday) 
        ? phase.activeCount - 1 
        : phase.activeCount,
      lockedCount: phase.leads.some(l => l.id === leadId && l.interactedToday)
        ? phase.lockedCount - 1
        : phase.lockedCount
    })))

    setStats(prev => ({ ...prev, total: prev.total - 1 }))
  }

  const addLeadToBoard = (newLead) => {
    const leadWithDefaults = {
      ...newLead,
      phase: 0,
      interactedToday: false,
      isLocked: false,
      interaction_count: 0
    }

    setBoard(prevBoard => prevBoard.map((phase, index) => {
      if (index === 0) {
        return {
          ...phase,
          leads: [leadWithDefaults, ...phase.leads],
          activeCount: phase.activeCount + 1
        }
      }
      return phase
    }))

    setStats(prev => ({
      ...prev,
      total: prev.total + 1,
      pendingToday: prev.pendingToday + 1
    }))
  }

  // =============================================
  // HANDLERS WITH OPTIMISTIC UPDATES
  // =============================================

  const handleAddLead = async (leadData) => {
    // Create optimistic lead
    const optimisticLead = {
      id: 'temp-' + Date.now(),
      instagram_handle: leadData.instagramHandle,
      source: leadData.source,
      notes: leadData.notes,
      created_at: new Date().toISOString()
    }

    // Optimistic update
    addLeadToBoard(optimisticLead)
    setShowAddModal(false)

    // Async save
    try {
      await leadService.createWarmUpLead(coachId, {
        instagramHandle: leadData.instagramHandle,
        source: leadData.source,
        notes: leadData.notes,
        campaignId: leadData.campaignId || null
      })
    } catch (error) {
      console.error('Add lead failed:', error)
      removeLeadFromBoard(optimisticLead.id)
      const msg = error?.message || error?.details || JSON.stringify(error)
      alert(`Lead toevoegen mislukt — ${msg}`)
    }
  }

  const handleInteraction = async (leadId) => {
    // INSTANT optimistic update
    moveLeadToNextPhase(leadId)

    // Async save (fire and forget)
    try {
      await leadService.logWarmUpInteraction(leadId)
    } catch (error) {
      console.error('Log interaction failed:', error)
    }
  }

  const handleConvert = async (leadId) => {
    // Optimistic remove
    removeLeadFromBoard(leadId)

    try {
      const targetSection = kanbanSections?.find(s => s.id !== 'unassigned')?.id || null
      await leadService.convertWarmUpToLead(leadId, targetSection, coachId)
    } catch (error) {
      console.error('Convert failed:', error)
      alert('Converteren mislukt - refresh de pagina')
    }
  }

  const handleDelete = async (leadId) => {
    // Optimistic remove
    removeLeadFromBoard(leadId)

    try {
      await leadService.deleteWarmUpLead(leadId)
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  const handleEdit = async (leadId, updates) => {
    // Optimistic update
    updateLeadInBoard(leadId, updates)

    try {
      await leadService.updateWarmUpLead(leadId, updates)
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  // =============================================
  // BULK SELECTION HANDLERS
  // =============================================

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }

  const selectAllInPhase = (phase) => {
    const activeLeadIds = phase.leads
      .filter(lead => !lead.interactedToday)
      .map(lead => lead.id)
    
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      activeLeadIds.forEach(id => newSet.add(id))
      return newSet
    })
  }

  const deselectAllInPhase = (phase) => {
    const phaseLeadIds = phase.leads.map(lead => lead.id)
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      phaseLeadIds.forEach(id => newSet.delete(id))
      return newSet
    })
  }

  const isPhaseFullySelected = (phase) => {
    const activeLeads = phase.leads.filter(lead => !lead.interactedToday)
    if (activeLeads.length === 0) return false
    return activeLeads.every(lead => selectedLeads.has(lead.id))
  }

  const getSelectedCountInPhase = (phase) => {
    return phase.leads.filter(lead => selectedLeads.has(lead.id)).length
  }

  const handleBulkInteraction = async () => {
    if (selectedLeads.size === 0) return
    
    setBulkProcessing(true)
    const leadIds = Array.from(selectedLeads)
    
    // INSTANT optimistic updates for ALL selected leads
    leadIds.forEach(leadId => {
      moveLeadToNextPhase(leadId)
    })

    // Clear selection immediately
    setSelectedLeads(new Set())
    setBulkProcessing(false)

    // Async save all (fire and forget)
    for (const leadId of leadIds) {
      try {
        await leadService.logWarmUpInteraction(leadId)
      } catch (error) {
        console.error('Bulk interaction failed for:', leadId, error)
      }
    }
  }

  const clearSelection = () => {
    setSelectedLeads(new Set())
  }

  // =============================================
  // RENDER
  // =============================================

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: '3rem',
        color: 'rgba(255,255,255,0.5)'
      }}>
        <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '0.75rem' }}>Laden...</span>
      </div>
    )
  }

  return (
    <div>
      {/* Active Campaign Banner */}
      {activeCampaign && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Target size={18} color="#10b981" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#10b981' }}>
              {activeCampaign.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
              Actieve campagne
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTION BAR */}
      {selectedLeads.size > 0 && (
        <div style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={18} color="#8b5cf6" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#8b5cf6' }}>
              {selectedLeads.size} leads geselecteerd
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={clearSelection}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Deselecteer
            </button>
            <button
              onClick={handleBulkInteraction}
              disabled={bulkProcessing}
              style={{
                padding: '0.5rem 1rem',
                background: bulkProcessing 
                  ? 'rgba(139, 92, 246, 0.3)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: bulkProcessing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              {bulkProcessing ? (
                <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Zap size={14} />
              )}
              Allemaal Afvinken
            </button>
          </div>
        </div>
      )}

      {/* Header with Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(107, 114, 128, 0.15)',
            border: '1px solid rgba(107, 114, 128, 0.3)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#6b7280' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
              Totaal
            </div>
          </div>
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
              {stats.interactedToday}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
              Vandaag
            </div>
          </div>
          <div style={{
            padding: '0.5rem 0.75rem',
            background: 'rgba(251, 191, 36, 0.15)',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fbbf24' }}>
              {stats.pendingToday}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)' }}>
              Te doen
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              loadBoard()
              loadCampaigns()
            }}
            style={{
              padding: '0.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #E1306C 0%, #C13584 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <Plus size={16} />
            Lead
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
        gap: '0.75rem'
      }}>
        {board.map((phase) => (
          <div
            key={phase.id}
            style={{
              background: 'rgba(17, 17, 17, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '0.75rem',
              minHeight: isMobile ? 'auto' : '400px'
            }}
          >
            {/* Phase Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: phase.color
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>
                  {phase.title}
                </span>
                <span style={{
                  padding: '0.15rem 0.4rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {phase.leads.length}
                </span>
              </div>
            </div>

            {/* Select All Button for Phase */}
            {phase.leads.filter(l => !l.interactedToday).length > 0 && (
              <button
                onClick={() => {
                  if (isPhaseFullySelected(phase)) {
                    deselectAllInPhase(phase)
                  } else {
                    selectAllInPhase(phase)
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.4rem',
                  marginBottom: '0.5rem',
                  background: isPhaseFullySelected(phase)
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isPhaseFullySelected(phase)
                    ? '1px solid rgba(139, 92, 246, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: isPhaseFullySelected(phase) ? '#8b5cf6' : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem'
                }}
              >
                {isPhaseFullySelected(phase) ? (
                  <CheckSquare size={12} />
                ) : (
                  <Square size={12} />
                )}
                {isPhaseFullySelected(phase) ? 'Deselecteer' : 'Selecteer'} ({phase.leads.filter(l => !l.interactedToday).length})
              </button>
            )}

            {/* Leads */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {phase.leads.map(lead => (
                <WarmUpCard
                  key={lead.id}
                  lead={lead}
                  phaseColor={phase.color}
                  isMobile={isMobile}
                  onInteraction={handleInteraction}
                  onConvert={handleConvert}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  showConvertButton={phase.id >= 3}
                  isSelected={selectedLeads.has(lead.id)}
                  onToggleSelect={() => toggleLeadSelection(lead.id)}
                />
              ))}

              {phase.leads.length === 0 && (
                <div style={{
                  padding: '1.5rem',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.8rem'
                }}>
                  Geen leads
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddWarmUpModal
          onClose={() => setShowAddModal(false)}
onSubmit={handleAddLead}

          isMobile={isMobile}
          campaigns={campaigns}
          activeCampaign={activeCampaign}
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
