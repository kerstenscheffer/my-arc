import { useState, useEffect } from 'react'
import { Plus, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import KanbanCard from './KanbanCard'
import AddLeadModal from './AddLeadModal'
import SectionModal from './SectionModal'

export default function KanbanBoard({ leadService, coachId, isMobile }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddLead, setShowAddLead] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedSectionForLead, setSelectedSectionForLead] = useState(null)
  const [draggedLead, setDraggedLead] = useState(null)
  const [draggedOverSection, setDraggedOverSection] = useState(null)
  const [expandedSections, setExpandedSections] = useState({}) // Track which sections are expanded

  const MAX_VISIBLE_LEADS = 5 // Maximum leads to show before collapsing

  useEffect(() => {
    if (leadService && coachId) {
      loadBoard()
    }
  }, [leadService, coachId])

  const loadBoard = async () => {
    try {
      setLoading(true)
      const board = await leadService.getKanbanBoard(coachId)
      setSections(board)
    } catch (error) {
      console.error('❌ Load kanban failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSection = async (sectionData) => {
    try {
      await leadService.createSection(coachId, {
        ...sectionData,
        position: sections.filter(s => s.id !== 'unassigned').length
      })
      await loadBoard()
      setShowSectionModal(false)
    } catch (error) {
      console.error('❌ Create section failed:', error)
      alert('Sectie maken mislukt')
    }
  }

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      await leadService.updateSection(sectionId, updates)
      await loadBoard()
      setShowSectionModal(false)
    } catch (error) {
      console.error('❌ Update section failed:', error)
      alert('Sectie bijwerken mislukt')
    }
  }

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Sectie verwijderen? Leads blijven behouden.')) return
    try {
      await leadService.deleteSection(sectionId)
      await loadBoard()
      setShowSectionModal(false)
    } catch (error) {
      console.error('❌ Delete section failed:', error)
    }
  }

  const handleAddLead = async (leadData) => {
    try {
      await leadService.createLeadWithSection(leadData, selectedSectionForLead, coachId)
      await loadBoard()
      setShowAddLead(false)
      setSelectedSectionForLead(null)
    } catch (error) {
      console.error('❌ Add lead failed:', error)
      alert('Lead toevoegen mislukt')
    }
  }

  const handleDragStart = (e, lead, sectionId) => {
    setDraggedLead({ ...lead, currentSectionId: sectionId })
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, sectionId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverSection(sectionId)
  }

  const handleDrop = async (e, targetSectionId) => {
    e.preventDefault()
    setDraggedOverSection(null)

    if (!draggedLead || draggedLead.currentSectionId === targetSectionId) {
      setDraggedLead(null)
      return
    }

    try {
      await leadService.moveLeadToSection(draggedLead.id, targetSectionId, 0)
      await loadBoard()
    } catch (error) {
      console.error('❌ Move lead failed:', error)
    } finally {
      setDraggedLead(null)
    }
  }

  const toggleSectionExpansion = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getVisibleLeads = (section) => {
    const leads = section.leads || []
    const isExpanded = expandedSections[section.id]
    
    if (isExpanded || leads.length <= MAX_VISIBLE_LEADS) {
      return leads
    }
    
    return leads.slice(0, MAX_VISIBLE_LEADS)
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
    <div style={{ padding: isMobile ? '1rem' : '1.5rem', background: '#0a0a0a', borderRadius: '16px', minHeight: '600px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: '600', color: '#fff', margin: 0 }}>
          Lead Board
        </h2>
        <button
          onClick={() => { setSelectedSection(null); setShowSectionModal(true) }}
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
          Nieuwe Sectie
        </button>
      </div>

      {/* Kanban Columns - Fixed horizontal scrolling with padding */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        overflowX: 'auto', 
        paddingBottom: '1rem',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem',
        marginLeft: '-0.5rem',
        marginRight: '-0.5rem'
      }}>
        {sections.map(section => {
          const totalLeads = section.leads?.length || 0
          const visibleLeads = getVisibleLeads(section)
          const hasMoreLeads = totalLeads > MAX_VISIBLE_LEADS
          const isExpanded = expandedSections[section.id]

          return (
            <div
              key={section.id}
              onDragOver={(e) => handleDragOver(e, section.id)}
              onDragLeave={() => setDraggedOverSection(null)}
              onDrop={(e) => handleDrop(e, section.id)}
              style={{
                minWidth: isMobile ? '280px' : '320px',
                maxWidth: isMobile ? '280px' : '320px',
                background: draggedOverSection === section.id 
                  ? `linear-gradient(135deg, ${section.color}20 0%, ${section.color}10 100%)`
                  : 'rgba(17, 17, 17, 0.8)',
                border: draggedOverSection === section.id 
                  ? `2px solid ${section.color}` 
                  : `1px solid ${section.color}30`,
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Section Header */}
              <div style={{
                padding: '1rem',
                background: `linear-gradient(135deg, ${section.color}15 0%, ${section.color}08 100%)`,
                borderBottom: `2px solid ${section.color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                borderTopLeftRadius: '12px',
                borderTopRightRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: section.color,
                    boxShadow: `0 0 12px ${section.color}, 0 0 24px ${section.color}60`,
                    border: `2px solid ${section.color}40`
                  }} />
                  <h3 style={{
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '600',
                    color: section.color,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textShadow: `0 0 20px ${section.color}40`
                  }}>
                    {section.title}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    background: `${section.color}25`,
                    border: `1px solid ${section.color}50`,
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: section.color,
                    boxShadow: `0 2px 8px ${section.color}20`
                  }}>
                    {totalLeads}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  {section.id !== 'unassigned' && (
                    <button
                      onClick={() => { setSelectedSection(section); setShowSectionModal(true) }}
                      style={{
                        padding: '0.5rem',
                        background: `${section.color}15`,
                        border: `1px solid ${section.color}30`,
                        borderRadius: '6px',
                        color: section.color,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${section.color}30`
                        e.currentTarget.style.boxShadow = `0 0 12px ${section.color}40`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${section.color}15`
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <Settings size={16} />
                    </button>
                  )}
                  
                  <button
                    onClick={() => { setSelectedSectionForLead(section.id); setShowAddLead(true) }}
                    style={{
                      padding: '0.5rem',
                      background: `${section.color}20`,
                      border: `1px solid ${section.color}40`,
                      borderRadius: '6px',
                      color: section.color,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${section.color}35`
                      e.currentTarget.style.boxShadow = `0 0 12px ${section.color}50`
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${section.color}20`
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Leads Container */}
              <div style={{
                padding: '0.75rem',
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                minHeight: '200px',
                maxHeight: isExpanded ? 'none' : '600px'
              }}>
                {totalLeads === 0 ? (
                  <div style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.3)',
                    fontSize: '0.875rem'
                  }}>
                    Geen leads
                  </div>
                ) : (
                  <>
                    {visibleLeads.map(lead => (
                      <KanbanCard
                        key={lead.id}
                        lead={lead}
                        sectionColor={section.color}
                        isMobile={isMobile}
                        onDragStart={(e) => handleDragStart(e, lead, section.id)}
                        onEdit={async (updates) => { 
                          await leadService.updateLead(lead.id, updates)
                          await loadBoard()
                        }}
                        onDelete={async () => { 
                          if (window.confirm('Lead verwijderen?')) {
                            await leadService.deleteLead(lead.id)
                            await loadBoard()
                          }
                        }}
                      />
                    ))}
                    
                    {/* Show More/Less Button */}
                    {hasMoreLeads && (
                      <button
                        onClick={() => toggleSectionExpansion(section.id)}
                        style={{
                          padding: '0.75rem',
                          background: `${section.color}10`,
                          border: `1px solid ${section.color}30`,
                          borderRadius: '8px',
                          color: section.color,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease',
                          marginTop: '0.25rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${section.color}20`
                          e.currentTarget.style.borderColor = `${section.color}50`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${section.color}10`
                          e.currentTarget.style.borderColor = `${section.color}30`
                        }}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={16} />
                            Toon minder
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} />
                            Toon meer ({totalLeads - MAX_VISIBLE_LEADS} verborgen)
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showAddLead && (
        <AddLeadModal
          isMobile={isMobile}
          onClose={() => { setShowAddLead(false); setSelectedSectionForLead(null) }}
          onSubmit={handleAddLead}
        />
      )}

      {showSectionModal && (
        <SectionModal
          isMobile={isMobile}
          section={selectedSection}
          onClose={() => { setShowSectionModal(false); setSelectedSection(null) }}
          onSubmit={selectedSection 
            ? (updates) => handleUpdateSection(selectedSection.id, updates)
            : handleCreateSection
          }
          onDelete={selectedSection ? () => handleDeleteSection(selectedSection.id) : null}
        />
      )}

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); }
        }
        
        div::-webkit-scrollbar { 
          width: 6px; 
          height: 6px; 
        }
        
        div::-webkit-scrollbar-track { 
          background: rgba(255, 255, 255, 0.05);
          borderRadius: 3px;
        }
        
        div::-webkit-scrollbar-thumb { 
          background: rgba(16, 185, 129, 0.3);
          borderRadius: 3px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }
      `}</style>
    </div>
  )
}
