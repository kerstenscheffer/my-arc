import { useState } from 'react'
import { CheckSquare, Square, Trash2, Edit } from 'lucide-react'
import LeadFilters from './LeadFilters'
import LeadCard from './LeadCard'
import LeadDetailsModal from './LeadDetailsModal'

export default function LeadOverview({
  leads,
  selectedLeads,
  filters,
  stats,
  pagination,
  loading,
  isMobile,
  onFilterChange,
  onSearch,
  onLeadSelect,
  onSelectAll,
  onDeselectAll,
  onBulkStatusUpdate,
  onBulkDelete,
  onLeadStatusUpdate,
  onAddNote,
  onPageChange,
  leadService
}) {
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const handleViewDetails = (lead) => {
    setSelectedLead(lead)
    setShowDetailModal(true)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedLead(null)
  }

  const handleLeadUpdate = (updatedLead) => {
    // Refresh will happen via real-time subscription
    console.log('Lead updated:', updatedLead)
  }

  // Stats Cards
  const statsCards = [
    { label: 'Totaal', value: stats.total_leads, color: '#3b82f6' },
    { label: 'Nieuw', value: stats.new_leads, color: '#3b82f6' },
    { label: 'Benaderd', value: stats.contacted_leads, color: '#f97316' },
    { label: 'Gepland', value: stats.scheduled_leads, color: '#8b5cf6' },
    { label: 'Geconverteerd', value: stats.converted_leads, color: '#10b981' }
  ]

  return (
    <div>
      {/* Filters */}
      <LeadFilters
        filters={filters}
        stats={stats}
        onFilterChange={onFilterChange}
        onSearch={onSearch}
        isMobile={isMobile}
      />

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        {statsCards.map((stat, index) => (
          <div
            key={index}
            style={{
              padding: isMobile ? '1rem' : '1.25rem',
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              marginBottom: '0.5rem',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: isMobile ? '1.75rem' : '2rem',
              fontWeight: '700',
              color: stat.color
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <span style={{
              color: '#10b981',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600'
            }}>
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} geselecteerd
            </span>
            <button
              onClick={onDeselectAll}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              Deselecteer alle
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap'
          }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  onBulkStatusUpdate(e.target.value)
                  e.target.value = ''
                }
              }}
              style={{
                padding: '0.75rem 1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              <option value="">Wijzig status...</option>
              <option value="contacted">Benaderd</option>
              <option value="scheduled">Gepland</option>
              <option value="converted">Geconverteerd</option>
              <option value="closed">Gesloten</option>
            </select>

            <button
              onClick={onBulkDelete}
              style={{
                padding: '0.75rem 1rem',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '10px',
                color: '#ef4444',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <Trash2 size={16} />
              {!isMobile && 'Verwijder'}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && leads.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px'
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
      ) : leads.length === 0 ? (
        // Empty State
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '1rem',
          color: 'rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <Square size={40} color="rgba(59, 130, 246, 0.5)" />
          </div>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Geen leads gevonden
          </h3>
          <p style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            maxWidth: '400px'
          }}>
            {filters.status !== 'all' || filters.search
              ? 'Pas je filters aan om meer leads te zien'
              : 'Je eerste leads verschijnen hier zodra ze binnenkomen'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          {!isMobile && (
            <div style={{
              background: 'rgba(17, 17, 17, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      width: '40px'
                    }}>
                      <button
                        onClick={() => {
                          if (selectedLeads.length === leads.length) {
                            onDeselectAll()
                          } else {
                            onSelectAll()
                          }
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgba(255, 255, 255, 0.7)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {selectedLeads.length === leads.length && leads.length > 0 ? (
                          <CheckSquare size={18} color="#10b981" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Naam
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Email
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Telefoon
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Status
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Prioriteit
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'left',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Tijd
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      Notes
                    </th>
                    <th style={{
                      padding: '1rem 0.75rem',
                      width: '50px'
                    }}></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      isSelected={selectedLeads.includes(lead.id)}
                      onSelect={onLeadSelect}
                      onStatusChange={onLeadStatusUpdate}
                      onViewDetails={handleViewDetails}
                      variant="row"
                      isMobile={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Cards */}
          {isMobile && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              {/* Select All Mobile */}
              <button
                onClick={() => {
                  if (selectedLeads.length === leads.length) {
                    onDeselectAll()
                  } else {
                    onSelectAll()
                  }
                }}
                style={{
                  padding: '0.875rem 1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                {selectedLeads.length === leads.length && leads.length > 0 ? (
                  <CheckSquare size={18} color="#10b981" />
                ) : (
                  <Square size={18} />
                )}
                <span>
                  {selectedLeads.length === leads.length && leads.length > 0
                    ? 'Deselecteer alle'
                    : 'Selecteer alle'}
                </span>
              </button>

              {leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  isSelected={selectedLeads.includes(lead.id)}
                  onSelect={onLeadSelect}
                  onStatusChange={onLeadStatusUpdate}
                  onViewDetails={handleViewDetails}
                  variant="card"
                  isMobile={true}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.75rem',
              marginTop: '2rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: pagination.page === 1
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: pagination.page === 1
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                Vorige
              </button>

              <span style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                Pagina {pagination.page}
              </span>

              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={leads.length < pagination.limit}
                style={{
                  padding: '0.75rem 1.25rem',
                  background: leads.length < pagination.limit
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: leads.length < pagination.limit
                    ? 'rgba(255, 255, 255, 0.3)'
                    : 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: leads.length < pagination.limit ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
              >
                Volgende
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          isOpen={showDetailModal}
          onClose={handleCloseModal}
          onUpdate={handleLeadUpdate}
          leadService={leadService}
          coachId={selectedLead.coach_id}
          isMobile={isMobile}
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
