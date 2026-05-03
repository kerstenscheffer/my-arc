// src/modules/sales/components/SalesLibrary.jsx
// Sales Library - Manage sales pieces
// Simplified version gebaseerd op ContentLibrary structuur

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Archive, Sparkles } from 'lucide-react'
import { SALES_THEME } from '../SalesSection'
import ContentPlanningService from '../../output-planning/ContentPlanningService'
import CreateSalesModal from './CreateSalesModal'
import SalesPieceCard from './SalesPieceCard'
import ScheduleSalesModal from './ScheduleSalesModal'

export default function SalesLibrary({ db, isMobile }) {
  const [service] = useState(() => new ContentPlanningService(db.supabase))
  
  // State
  const [salesPieces, setSalesPieces] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('active') // 'active', 'archived'
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPiece, setEditingPiece] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleingPiece, setScheduleingPiece] = useState(null)
  const [weekDays, setWeekDays] = useState([])
  
  // Load data
  useEffect(() => {
    loadSalesPieces()
    loadWeekDays()
  }, [])
  
  const loadWeekDays = () => {
    const monday = getMonday(new Date())
    const days = []
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(date.getDate() + i)
      days.push({
        dayOfWeek: dayNames[i],
        date: date.toISOString().split('T')[0]
      })
    }
    
    setWeekDays(days)
  }
  
  const getMonday = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  const loadSalesPieces = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      const pieces = await service.getSalesPieces(user.id, {
        status: activeFilter === 'active' ? 'idea' : 'archived'
      })
      
      setSalesPieces(pieces || [])
    } catch (error) {
      console.error('Failed to load sales pieces:', error)
      setSalesPieces([])
    } finally {
      setLoading(false)
    }
  }
  
  // Filter pieces
  const filteredPieces = salesPieces.filter(piece => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      piece.title?.toLowerCase().includes(query) ||
      piece.description?.toLowerCase().includes(query) ||
      piece.sales_type?.toLowerCase().includes(query)
    )
  })
  
  // Handlers
  const handleCreate = () => {
    setEditingPiece(null)
    setShowCreateModal(true)
  }
  
  const handleEdit = (piece) => {
    setEditingPiece(piece)
    setShowCreateModal(true)
  }
  
  const handleSave = async (formData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      if (editingPiece) {
        await service.updateSalesPiece(editingPiece.id, formData)
      } else {
        await service.createSalesPiece(user.id, formData)
      }
      
      setShowCreateModal(false)
      setEditingPiece(null)
      loadSalesPieces()
    } catch (error) {
      console.error('Failed to save:', error)
      throw error
    }
  }
  
  const handleSchedule = (piece) => {
    setScheduleingPiece(piece)
    setShowScheduleModal(true)
  }
  
  const handleConfirmSchedule = async ({ phaseSchedule }) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      const weekStart = weekDays[0]?.date
      if (!weekStart) throw new Error('Week not loaded')
      
      await service.scheduleSalesPiece(scheduleingPiece.id, weekStart, phaseSchedule)
      
      setShowScheduleModal(false)
      setScheduleingPiece(null)
      loadSalesPieces()
    } catch (error) {
      console.error('Failed to schedule:', error)
      throw error
    }
  }
  
  const handleDelete = async (pieceId) => {
    if (!confirm('Sales piece verwijderen?')) return
    
    try {
      await service.deleteSalesPiece(pieceId)
      loadSalesPieces()
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }
  
  const handleArchive = async (pieceId) => {
    try {
      await service.updateSalesPiece(pieceId, { 
        status: activeFilter === 'active' ? 'archived' : 'idea' 
      })
      loadSalesPieces()
    } catch (error) {
      console.error('Failed to archive:', error)
    }
  }
  
  return (
    <div>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {/* Search */}
        <div style={{
          flex: 1,
          position: 'relative'
        }}>
          <Search 
            size={18} 
            color="rgba(255, 255, 255, 0.3)"
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            placeholder="Zoek sales pieces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 3rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = SALES_THEME.primary
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          />
        </div>
        
        {/* Filter Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setActiveFilter('active')}
            style={{
              padding: '0.875rem 1.25rem',
              background: activeFilter === 'active'
                ? `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.4) 100%)`
                : 'rgba(255, 255, 255, 0.05)',
              border: activeFilter === 'active'
                ? `1px solid ${SALES_THEME.primary}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: activeFilter === 'active' ? SALES_THEME.primary : 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Sparkles size={16} />
            Active
          </button>
          
          <button
            onClick={() => setActiveFilter('archived')}
            style={{
              padding: '0.875rem 1.25rem',
              background: activeFilter === 'archived'
                ? `linear-gradient(135deg, ${SALES_THEME.background} 0%, rgba(0,0,0,0.4) 100%)`
                : 'rgba(255, 255, 255, 0.05)',
              border: activeFilter === 'archived'
                ? `1px solid ${SALES_THEME.primary}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: activeFilter === 'archived' ? SALES_THEME.primary : 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              whiteSpace: 'nowrap'
            }}
          >
            <Archive size={16} />
            Archive
          </button>
        </div>
        
        {/* Create Button */}
        <button
          onClick={handleCreate}
          style={{
            padding: '0.875rem 1.5rem',
            background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontWeight: '700',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: `0 4px 20px ${SALES_THEME.glow}`,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          Nieuw Sales Piece
        </button>
      </div>
      
      {/* Content */}
      {loading ? (
        <LoadingState isMobile={isMobile} />
      ) : filteredPieces.length === 0 ? (
        <EmptyState 
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onClear={() => setSearchQuery('')}
          onCreate={handleCreate}
          isMobile={isMobile}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {filteredPieces.map(piece => (
            <SalesPieceCard
              key={piece.id}
              piece={piece}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onSchedule={handleSchedule}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
      
      {/* Create Modal */}
      <CreateSalesModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingPiece(null)
        }}
        onSave={handleSave}
        editPiece={editingPiece}
        isMobile={isMobile}
      />
      
      {/* Schedule Modal */}
      <ScheduleSalesModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          setScheduleingPiece(null)
        }}
        onSave={handleConfirmSchedule}
        salesPiece={scheduleingPiece}
        weekDays={weekDays}
        isMobile={isMobile}
      />
    </div>
  )
}

// Loading State
function LoadingState({ isMobile }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      color: 'rgba(255, 255, 255, 0.5)'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${SALES_THEME.border}`,
          borderTopColor: SALES_THEME.primary,
          borderRadius: '50%',
          margin: '0 auto 1rem',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ fontSize: '0.9rem' }}>Sales pieces laden...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Empty State
function EmptyState({ activeFilter, searchQuery, onClear, onCreate, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      textAlign: 'center',
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '16px',
        background: SALES_THEME.background,
        border: `1px solid ${SALES_THEME.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem'
      }}>
        <Sparkles size={36} color={SALES_THEME.primary} style={{ opacity: 0.5 }} />
      </div>
      
      {searchQuery ? (
        <>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            Geen resultaten
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1.5rem'
          }}>
            Geen sales pieces gevonden voor "{searchQuery}"
          </p>
          <button
            onClick={onClear}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Wis filter
          </button>
        </>
      ) : (
        <>
          <h3 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {activeFilter === 'active' ? 'Nog geen sales pieces' : 'Geen gearchiveerde pieces'}
          </h3>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '1.5rem',
            maxWidth: '400px',
            margin: '0 auto 1.5rem'
          }}>
            {activeFilter === 'active' 
              ? 'Maak je eerste sales piece voor announcements, promoties en meer'
              : 'Gearchiveerde pieces verschijnen hier'
            }
          </p>
          {activeFilter === 'active' && (
            <button
              onClick={onCreate}
              style={{
                padding: '0.875rem 1.75rem',
                background: `linear-gradient(135deg, ${SALES_THEME.primary} 0%, ${SALES_THEME.secondary} 100%)`,
                border: 'none',
                borderRadius: '10px',
                color: '#000',
                fontWeight: '700',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: `0 4px 20px ${SALES_THEME.glow}`
              }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline' }} />
              Maak Sales Piece
            </button>
          )}
        </>
      )}
    </div>
  )
}
