// src/modules/lead-management/components/LeadKanban.jsx
import { useState, useEffect } from 'react'
import { Plus, Settings, Trash2, GripVertical } from 'lucide-react'
import AddLeadModal from './AddLeadModal'
import SectionSettingsModal from './SectionSettingsModal'
import LeadCard from './LeadCard'

export default function LeadKanban({ leadService, coachId, isMobile }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddLead, setShowAddLead] = useState(false)
  const [showSectionSettings, setShowSectionSettings] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedSectionForLead, setSelectedSectionForLead] = useState(null)
  const [draggedLead, setDraggedLead] = useState(null)
  const [draggedOverSection, setDraggedOverSection] = useState(null)

  useEffect(() => {
    if (leadService && coachId) {
      loadKanbanBoard()
    }
  }, [leadService, coachId])

  const loadKanbanBoard = async () => {
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
      const newSection = await leadService.createSection(coachId, {
        ...sectionData,
        position: sections.filter(s => s.id !== 'unassigned').length
      })
      await loadKanbanBoard()
      setShowSectionSettings(false)
    } catch (error) {
      console.error('❌ Create section failed:', error)
      alert('Sectie maken mislukt')
    }
  }

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      await leadService.updateSection(sectionId, updates)
      await loadKanbanBoard()
      setShowSectionSettings(false)
    } catch (error) {
      console.error('❌ Update section failed:', error)
      alert('Sectie bijwerken mislukt')
    }
  }

  const handleDeleteSection = async (sectionId) => {
    const confirmed = window.confirm('Weet je zeker dat je deze sectie wilt verwijderen? Leads blijven behouden.')
    if (!confirmed) return

    try {
      await leadService.deleteSection(sectionId)
      await loadKanbanBoard()
      setShowSectionSettings(false)
    } catch (error) {
      console.error('❌ Delete section failed:', error)
      alert('Sectie verwijderen mislukt')
    }
  }

  const handleAddLead = async (leadData) => {
    try {
      await leadService.createLeadWithSection(
        leadData,
        selectedSectionForLead,
        coachId
      )
      await loadKanbanBoard()
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

  const handleDragLeave = () => {
    setDraggedOverSection(null)
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
      await loadKanbanBoard()
    } catch (error) {
      console.error('❌ Move lead failed:', error)
      alert('Lead verplaatsen mislukt')
    } finally {
      setDraggedLead(null)
    }
  }

  const handleEditSection = (section) => {
    setSelectedSection(section)
    setShowSectionSettings(true)
  }

  const handleNewSection = () => {
    setSelectedSection(null)
    setShowSectionSettings(true)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
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
    <div style={{
      padding: isMobile ? '1rem' : '1.5rem',
      background: '#0a0a0a',
      borderRadius: '16px',
      minHeight: '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0
        }}>
          Lead Board
        </h2>

        <button
          onClick={handleNewSection}
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
            transition: 'all 0.2s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)'
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

      {/* Kanban Board */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        overflowX: 'auto',
        paddingBottom: '1rem'
      }}>
        {sections.map(section => (
          <div
            key={section.id}
            onDragOver={(e) => handleDragOver(e, section.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, section.id)}
            style={{
              minWidth: isMobile ? '280px' : '320px',
              maxWidth: isMobile ? '280px' : '320px',
              background: draggedOverSection === section.id 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(10px)',
              border: draggedOverSection === section.id
                ? `2px solid ${section.color}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {/* Section Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: section.color,
                  boxShadow: `0 0 10px ${section.color}`
                }} />
                <h3 style={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {section.title}
                </h3>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  {section.leads?.length || 0}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {section.id !== 'unassigned' && (
                  <button
                    onClick={() => handleEditSection(section)}
                    style={{
                      padding: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.color = '#fff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    <Settings size={16} />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    setSelectedSectionForLead(section.id)
                    setShowAddLead(true)
                  }}
                  style={{
                    padding: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: section.color,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${section.color}20`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Leads */}
            <div style={{
              padding: '0.75rem',
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              minHeight: '200px'
            }}>
              {section.leads?.length === 0 ? (
                <div style={{
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.3)',
                  fontSize: '0.875rem'
                }}>
                  Geen leads
                </div>
              ) : (
                section.leads?.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    sectionColor={section.color}
                    isMobile={isMobile}
                    onDragStart={(e) => handleDragStart(e, lead, section.id)}
                    onEdit={async (updates) => {
                      await leadService.updateLead(lead.id, updates)
                      await loadKanbanBoard()
                    }}
                    onDelete={async () => {
                      const confirmed = window.confirm('Lead verwijderen?')
                      if (confirmed) {
                        await leadService.deleteLead(lead.id)
                        await loadKanbanBoard()
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showAddLead && (
        <AddLeadModal
          isMobile={isMobile}
          onClose={() => {
            setShowAddLead(false)
            setSelectedSectionForLead(null)
          }}
          onSubmit={handleAddLead}
        />
      )}

      {showSectionSettings && (
        <SectionSettingsModal
          isMobile={isMobile}
          section={selectedSection}
          onClose={() => {
            setShowSectionSettings(false)
            setSelectedSection(null)
          }}
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
