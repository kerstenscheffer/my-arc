// src/modules/output-planning/components/week-planning/WeekPlanningView.jsx
// REFACTORED v2.4: Added batch items support
// Now loads content pieces, sales pieces, AND batch items

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

// Import sub-components
import CalendarGrid from './CalendarGrid'
import MobileTimelineView from './MobileTimelineView'
import UnscheduledSidebar from './UnscheduledSidebar'
import PlanFromBatchModal from './PlanFromBatchModal'
import SchedulePieceModal from './SchedulePieceModal'
import AddItemModal from './AddItemModal'
import VideoBlueprint from '../VideoBlueprint'
import CaptionModal from './content-block/CaptionModal'
import BatchItemViewModal from '../../../content-batches/components/BatchItemViewModal'
import BatchItemEditModal from '../../../content-batches/components/BatchItemEditModal'
import BatchShootViewModal from '../../../content-batches/components/BatchShootViewModal'
import { GOLD } from './constants'

// Import services
import ContentPlanningService from '../../ContentPlanningService'
import BatchService from '../../../content-batches/BatchService'

// Helper: Format date to YYYY-MM-DD without timezone issues
const formatDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function WeekPlanningView({
  db,
  weekDays,
  currentWeekMonday,
  goToPreviousWeek,
  goToNextWeek,
  onRefresh,
  refreshSignal,
  isMobile: propIsMobile
}) {
  const isMobile = propIsMobile ?? window.innerWidth <= 768
  
  // Initialize services
  const [service] = useState(() => new ContentPlanningService(db.supabase))
  const [batchService] = useState(() => new BatchService(db.supabase))
  
  // Data State - UPDATED: Added batchItems
  const [items, setItems] = useState([])
  const [contentPieces, setContentPieces] = useState([])
  const [salesPieces, setSalesPieces] = useState([])
  const [batchItems, setBatchItems] = useState([])  // NEW
  const [batchShoots, setBatchShoots] = useState([])  // hele-batch opnamemomenten deze week
  const [shootView, setShootView] = useState(null)    // batch voor Inzien-modal
  const [unscheduledPieces, setUnscheduledPieces] = useState([])
  const [weekPlanId, setWeekPlanId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalData, setAddModalData] = useState({ dayOfWeek: null, time: null })
  const [showPlanFromBatchModal, setShowPlanFromBatchModal] = useState(false)
  const [selectedBatchItem, setSelectedBatchItem] = useState(null)
  
  // Multi-select State
  const [multiSelectMode, setMultiSelectMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  
  // Schedule Piece Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [pieceToSchedule, setPieceToSchedule] = useState(null)
  
  // Script Viewer State
  const [showScriptModal, setShowScriptModal] = useState(false)
  const [scriptContentItem, setScriptContentItem] = useState(null)
  const [loadingScript, setLoadingScript] = useState(false)
  
  // Batch-item Inzien/Bewerken op de agenda ({ item, format })
  const [viewBatchItem, setViewBatchItem] = useState(null)
  const [editBatchItem, setEditBatchItem] = useState(null)

  // Caption Modal State
  const [showCaptionModal, setShowCaptionModal] = useState(false)
  const [captionPiece, setCaptionPiece] = useState(null)
  
  // ============================================
  // HELPER: Get piece for item (content, sales, OR batch)
  // ============================================
  
  const getPieceForItem = useCallback((item) => {
    if (item.content_piece_id) {
      return contentPieces.find(cp => cp.id === item.content_piece_id)
    }
    if (item.sales_piece_id) {
      return salesPieces.find(sp => sp.id === item.sales_piece_id)
    }
    // Batch items don't have a separate "piece" - they ARE the item
    return null
  }, [contentPieces, salesPieces])
  
  // ============================================
  // DATA LOADING - UPDATED: Load batch items
  // ============================================
  
  const formatWeekRange = () => {
    if (!currentWeekMonday) return ''
    const weekEnd = new Date(currentWeekMonday)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const startStr = currentWeekMonday.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    const endStr = weekEnd.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${startStr} - ${endStr}`
  }
  
  const loadData = useCallback(async () => {
    if (!weekDays?.length || !currentWeekMonday) return
    
    setLoading(true)
    setError(null)
    
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      const weekStart = formatDateString(currentWeekMonday)
      
      // Load content/sales pieces overview
      const overview = await service.getWeekOverview(user.id, weekStart)
      
      // Load batch items for this week
      const batchItemsData = await batchService.getBatchItemsForWeek(user.id, weekStart)
      // Load hele-batch opnamemomenten (shoot_date) voor deze week
      const shootsData = await batchService.getBatchShootsForWeek(user.id, weekStart)

      setWeekPlanId(overview.weekPlan?.id)
      setItems(overview.items || [])
      setContentPieces(overview.contentPieces || [])
      setSalesPieces(overview.salesPieces || [])
      setBatchItems(batchItemsData || [])  // NEW
      setBatchShoots(shootsData || [])
      setUnscheduledPieces(overview.unscheduledPieces || [])
      setDataLoaded(true)
      
      console.log('📦 Loaded', batchItemsData?.length || 0, 'batch items for week')
      
    } catch (err) {
      console.error('Failed to load week planning data:', err)
      setError('Kon data niet laden: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [db, service, batchService, weekDays, currentWeekMonday])
  
  useEffect(() => {
    if (weekDays?.length > 0) {
      loadData()
    }
  }, [loadData, weekDays?.length])

  // Extern refresh-signaal (bv. nadat in de ideeën-sectie een idee is ingepland)
  // → herlaad de agenda direct, zonder hard refresh.
  useEffect(() => {
    if (refreshSignal) loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal])

  // Batch-item op de agenda: Inzien / Bewerken (met de custom format-velden).
  const handleViewBatchItem = (item) => setViewBatchItem({ item, format: item?.batch?.format || null })
  const handleEditBatchItem = (item) => setEditBatchItem({ item, format: item?.batch?.format || null })
  const handleSaveBatchItemEdit = async (itemId, updates) => {
    await batchService.updateBatchItem(itemId, updates)
    await loadData()
    onRefresh?.()
  }
  const handleViewShoot = (batch) => setShootView(batch)

  // Slepen-om-te-plannen vanuit de ideeën-sectie: die dispatcht een window-event
  // met het idee + de dag/tijd van de cel waar je losliet.
  useEffect(() => {
    const handler = (e) => {
      const { idea, dayOfWeek, time } = e.detail || {}
      if (idea && dayOfWeek) handleIdeaDrop(idea, dayOfWeek, time)
    }
    window.addEventListener('myarc:plan-idea', handler)
    return () => window.removeEventListener('myarc:plan-idea', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWeekMonday])
  
  useEffect(() => {
    if (weekDays?.length) {
      const today = new Date().toDateString()
      const todayIndex = weekDays.findIndex(d => 
        new Date(d.date).toDateString() === today
      )
      if (todayIndex >= 0) {
        setSelectedDayIndex(todayIndex)
      }
    }
  }, [weekDays])
  
  // ============================================
  // ITEM HANDLERS
  // ============================================
  
  // Drag-to-plan: een idee uit de ideeën-sectie op een dag/tijd droppen →
  // maakt een agenda-item (zelfde mechaniek als de Plan-knop) en herlaadt.
  const handleIdeaDrop = async (idea, dayOfWeek, time) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      const weekStart = formatDateString(currentWeekMonday)
      await service.createQuickItem(user.id, weekStart, {
        dayOfWeek,
        time: time || null,
        duration: 30,
        title: idea?.title || 'Idee',
        description: idea?.script || idea?.hook || null,
        phase: 'post',
        itemType: 'content',
        sourceContentId: idea?.id || null,  // koppel aan het idee → script opvraagbaar
      })
      await loadData()
    } catch (err) {
      console.error('Failed to plan idea via drop:', err)
    }
  }

  const handleItemDrop = async (itemId, dayOfWeek, time) => {
    try {
      // Check if this is a batch item
      const isBatchItem = batchItems.some(bi => bi.id === itemId)
      
      if (isBatchItem) {
        // For batch items: update planned_date and planned_time
        const batchItem = batchItems.find(bi => bi.id === itemId)
        
        // Convert dayOfWeek to date
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(dayOfWeek)
        const targetDay = weekDays.find(d => {
          const date = new Date(d.date)
          return date.getDay() === dayIndex
        })
        
        if (!targetDay) {
          throw new Error('Target day not found')
        }
        
        // Update batch item
        setBatchItems(prev => prev.map(item =>
          item.id === itemId
            ? { ...item, planned_date: targetDay.date, planned_time: time, status: 'planned' }
            : item
        ))
        
        await batchService.updateBatchItem(itemId, {
          planned_date: targetDay.date,
          planned_time: time,
          status: 'planned'
        })
        
        console.log('✅ Batch item moved to', targetDay.date, time)
      } else {
        // Regular item: use existing logic
        setItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, day_of_week: dayOfWeek, scheduled_time: time }
            : item
        ))
        await service.movePhaseItem(itemId, dayOfWeek, time)
      }
    } catch (err) {
      console.error('Failed to update item:', err)
      loadData()
    }
  }
  
const handleTimeSlotClick = (dayOfWeek, time) => { 
    setAddModalData({ dayOfWeek, time })
    setShowAddModal(true)
  }

  const handleItemToggleComplete = async (item, completed) => {
    const itemId = typeof item === 'string' ? item : item?.id
    const targetItem = typeof item === 'string' ? items.find(i => i.id === item) : item

    // Check if this is a batch item
    const isBatchItem = batchItems.some(bi => bi.id === itemId) 

    try {
      if (isBatchItem) {
        // Update batch item using STATUS field (not completed)
        const newStatus = completed ? 'posted' : 'planned'
        
        setBatchItems(prev => prev.map(bi =>
          bi.id === itemId ? { ...bi, status: newStatus } : bi
        ))
 
        await batchService.updateBatchItem(itemId, {
          status: newStatus,
          posted_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        
        console.log('✅ Batch item status updated to:', newStatus)
      } else {


        // Existing logic for content/sales items
        setItems(prev => prev.map(i => 
          i.id === itemId ? { ...i, completed } : i
        ))
        
        if (targetItem?.content_piece_id && targetItem?.phase) {
          await service.togglePhaseComplete(targetItem.content_piece_id, targetItem.phase, completed)
          setContentPieces(prev => prev.map(piece => 
            piece.id === targetItem.content_piece_id 
              ? { ...piece, [`${targetItem.phase}_completed`]: completed }
              : piece
          ))
        } else if (targetItem?.sales_piece_id && targetItem?.phase) {
          await service.togglePhaseComplete(targetItem.sales_piece_id, targetItem.phase, completed)
          setSalesPieces(prev => prev.map(piece => 
            piece.id === targetItem.sales_piece_id 
              ? { ...piece, [`${targetItem.phase}_completed`]: completed }
              : piece
          ))
        } else {
          await db.supabase
            .from('output_day_items')
            .update({ completed, updated_at: new Date().toISOString() })
            .eq('id', itemId)
        }
      }
    } catch (err) {
      console.error('Failed to toggle completion:', err)
      loadData()
    }
  }
  
  const handleItemEdit = (item) => {
    setAddModalData({ 
      dayOfWeek: item.day_of_week, 
      time: item.scheduled_time,
      editItem: item 
    })
    setShowAddModal(true)
  }
  
  const handleItemDelete = async (item) => {
    const itemId = typeof item === 'string' ? item : item?.id
    if (!confirm('Item verwijderen?')) return
    
    // Check if this is a batch item
    const isBatchItem = batchItems.some(bi => bi.id === itemId)
    
    try {
      if (isBatchItem) {
        setBatchItems(prev => prev.filter(bi => bi.id !== itemId))
        await batchService.deleteBatchItem(itemId)
      } else {
        setItems(prev => prev.filter(i => i.id !== itemId))
        await service.deleteItem(itemId)
      }
    } catch (err) {
      console.error('Failed to delete item:', err)
      loadData()
    }
  }
  
  const handleDeleteRecurringTemplate = async (item) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      // Find the recurring story template in content_items by title
      // (recurring stories are stored as templates with is_recurring=true)
      const { data: templates, error: searchError } = await db.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', user.id)
        .eq('title', item.title)
        .eq('is_recurring', true)
      
      if (searchError) throw searchError
      
      if (templates && templates.length > 0) {
        // Delete the template(s)
        const { error: deleteError } = await db.supabase
          .from('content_items')
          .delete()
          .eq('id', templates[0].id)
        
        if (deleteError) throw deleteError
        
        console.log('✅ Recurring story template deleted:', item.title)
        alert(`✅ Recurring story "${item.title}" gestopt!\n\nDeze zal niet meer automatisch worden gegenereerd.`)
        
        // Reload data to remove all instances
        await loadData()
      } else {
        console.warn('No recurring template found for:', item.title)
        alert('Kon recurring template niet vinden')
      }
    } catch (err) {
      console.error('Failed to delete recurring template:', err)
      alert('Kon recurring story niet stoppen: ' + err.message)
    }
  }
  
  // ============================================
  // MULTI-SELECT HANDLERS
  // ============================================
  
  const handleToggleMultiSelect = () => {
    console.log('🔄 Toggle multi-select, current:', multiSelectMode, '→ new:', !multiSelectMode)
    setMultiSelectMode(!multiSelectMode)
    setSelectedItemIds(new Set())
  }
  
  const handleToggleItemSelect = (itemId) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }
  
  const handleSelectAll = () => {
    const allItemIds = new Set([
      ...items.map(i => i.id),
      ...batchItems.map(bi => bi.id)
    ])
    setSelectedItemIds(allItemIds)
  }
  
  const handleDeselectAll = () => {
    setSelectedItemIds(new Set())
  }
  
  const handleDeleteSelected = async () => {
    const count = selectedItemIds.size
    if (count === 0) return
    
    if (!confirm(`🗑️ Verwijder ${count} geselecteerde items?\n\nWeet je het zeker?`)) {
      return
    }
    
    try {
      // Separate regular items and batch items
      const regularItemIds = []
      const batchItemIds = []
      
      selectedItemIds.forEach(id => {
        if (batchItems.some(bi => bi.id === id)) {
          batchItemIds.push(id)
        } else {
          regularItemIds.push(id)
        }
      })
      
      // Delete regular items
      if (regularItemIds.length > 0) {
        await Promise.all(regularItemIds.map(id => service.deleteItem(id)))
        setItems(prev => prev.filter(i => !regularItemIds.includes(i.id)))
      }
      
      // Delete batch items
      if (batchItemIds.length > 0) {
        await Promise.all(batchItemIds.map(id => batchService.deleteBatchItem(id)))
        setBatchItems(prev => prev.filter(bi => !batchItemIds.includes(bi.id)))
      }
      
      console.log(`✅ Deleted ${count} items (${regularItemIds.length} regular, ${batchItemIds.length} batch)`)
      alert(`✅ ${count} items verwijderd!`)
      
      // Exit multi-select mode
      setMultiSelectMode(false)
      setSelectedItemIds(new Set())
      
    } catch (err) {
      console.error('Failed to delete selected items:', err)
      alert('Kon items niet verwijderen: ' + err.message)
      loadData()
    }
  }
  
  const handleViewScript = async (item, piece) => {
    // Eerst de gekoppelde content-piece, anders een rechtstreeks ingepland idee.
    const sourceId = piece?.source_content_id || item?.source_content_id

    if (sourceId) {
      setLoadingScript(true)
      try {
        const { data: contentItem, error } = await db.supabase
          .from('content_items')
          .select('*')
          .eq('id', sourceId)
          .single()
        if (error) throw error
        if (contentItem) {
          setScriptContentItem(contentItem)
          setShowScriptModal(true)
          return
        }
      } catch (err) {
        console.error('Failed to load script:', err)
      } finally {
        setLoadingScript(false)
      }
    }

    // Fallback: ouder ingepland item zonder koppeling — toon het opgeslagen
    // script (in description) read-only, zodat je het tóch kunt inzien.
    if (item?.description || item?.script) {
      setScriptContentItem({
        id: null,
        title: item.title || 'Script',
        type: item.item_type || 'content',
        script: item.script || item.description || '',
      })
      setShowScriptModal(true)
    }
  }
  
  // ============================================
  // CAPTION HANDLER - UPDATED: Handle batch items
  // ============================================
  
  const handleOpenCaption = (item, piece) => {
    // Check if this is a batch item
    const batchItem = batchItems.find(bi => bi.id === item?.id)
    
    if (batchItem) {
      // Batch items store caption directly on the item
      setCaptionPiece({ 
        id: batchItem.id, 
        caption: batchItem.caption,
        isBatchItem: true 
      })
      setShowCaptionModal(true)
    } else if (piece) {
      setCaptionPiece(piece)
      setShowCaptionModal(true)
    }
  }
  
  const handleSaveCaption = async (pieceId, caption) => {
    try {
      // Check if this is a batch item
      const isBatchItem = captionPiece?.isBatchItem
      
      if (isBatchItem) {
        // Update batch item caption
        await batchService.updateBatchItem(pieceId, { 
          caption,
          updated_at: new Date().toISOString()
        })
        
        setBatchItems(prev => prev.map(item => 
          item.id === pieceId ? { ...item, caption } : item
        ))
      } else {
        // Existing logic for content/sales pieces
        const piece = contentPieces.find(p => p.id === pieceId) || 
                     salesPieces.find(p => p.id === pieceId)
        
        const tableName = contentPieces.find(p => p.id === pieceId) 
          ? 'content_pieces' 
          : 'sales_pieces'
        
        const { error } = await db.supabase
          .from(tableName)
          .update({ 
            caption,
            updated_at: new Date().toISOString()
          })
          .eq('id', pieceId)
        
        if (error) throw error
        
        if (tableName === 'content_pieces') {
          setContentPieces(prev => prev.map(piece => 
            piece.id === pieceId ? { ...piece, caption } : piece
          ))
        } else {
          setSalesPieces(prev => prev.map(piece => 
            piece.id === pieceId ? { ...piece, caption } : piece
          ))
        }
        
        setUnscheduledPieces(prev => prev.map(piece => 
          piece.id === pieceId ? { ...piece, caption } : piece
        ))
      }
      
    } catch (err) {
      console.error('Failed to save caption:', err)
      throw err
    }
  }
  
  // ============================================
  // MOVE WEEK & UNSCHEDULE HANDLERS
  // ============================================
  
  const handleMoveToNextWeek = async (item, piece) => {
    if (!piece?.id) return
    
    try {
      const nextWeek = new Date(currentWeekMonday)
      nextWeek.setDate(nextWeek.getDate() + 7)
      await service.moveToWeek(piece.id, formatDateString(nextWeek))
      await loadData()
    } catch (err) {
      console.error('Failed to move to next week:', err)
      loadData()
    }
  }
  
  const handleMoveToPrevWeek = async (item, piece) => {
    if (!piece?.id) return
    
    try {
      const prevWeek = new Date(currentWeekMonday)
      prevWeek.setDate(prevWeek.getDate() - 7)
      await service.moveToWeek(piece.id, formatDateString(prevWeek))
      await loadData()
    } catch (err) {
      console.error('Failed to move to previous week:', err)
      loadData()
    }
  }
  
  const handleUnschedule = async (item, piece) => {
    if (!piece?.id) return
    
    try {
      await service.unscheduleContentPiece(piece.id)
      await loadData()
    } catch (err) {
      console.error('Failed to unschedule:', err)
      loadData()
    }
  }
  
  // ============================================
  // ADD ITEM HANDLER
  // ============================================
  
  const handleAddItem = async (itemData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      const weekStart = formatDateString(currentWeekMonday)
      const newItem = await service.createQuickItem(user.id, weekStart, {
        dayOfWeek: itemData.dayOfWeek,
        time: itemData.time,
        duration: itemData.duration,
        title: itemData.title,
        description: itemData.description,
        phase: itemData.phase,
        itemType: itemData.itemType || 'task'
      })
      
      setItems(prev => [...prev, newItem])
      setShowAddModal(false)
      setAddModalData({ dayOfWeek: null, time: null })
    } catch (err) {
      console.error('Failed to add item:', err)
      throw err
    }
  }
  
  // ============================================
  // CONTENT PIECE SCHEDULING
  // ============================================
  
  const handleSchedulePiece = (piece) => {
    setPieceToSchedule(piece)
    setShowScheduleModal(true)
  }
  
  const handleConfirmSchedulePiece = async (scheduleData) => {
    try {
      const weekStart = formatDateString(currentWeekMonday)
      await service.scheduleContentPiece(pieceToSchedule.id, weekStart, scheduleData.phaseSchedule)
      setShowScheduleModal(false)
      setPieceToSchedule(null)
      await loadData()
    } catch (err) {
      console.error('Failed to schedule piece:', err)
      throw err
    }
  }
  
  const handleDeletePiece = async (pieceId) => {
    try {
      await service.deleteContentPiece(pieceId)
      setUnscheduledPieces(prev => prev.filter(p => p.id !== pieceId))
      setContentPieces(prev => prev.filter(p => p.id !== pieceId))
      setSalesPieces(prev => prev.filter(p => p.id !== pieceId))
      setItems(prev => prev.filter(i => 
        i.content_piece_id !== pieceId && i.sales_piece_id !== pieceId
      ))
    } catch (err) {
      console.error('Failed to delete piece:', err)
      loadData()
    }
  }
  
  const handleViewPiece = (piece) => {
    if (piece.source_content_id) {
      handleViewScript(null, piece)
    }
  }
  
  const handleSaveFromBatch = async (saveData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      const piece = await service.createContentPiece(user.id, saveData.contentPiece)
      
      if (saveData.phasesByWeek && Object.keys(saveData.phasesByWeek).length > 0) {
        const firstWeekStart = Object.keys(saveData.phasesByWeek)[0]
        const phases = saveData.phasesByWeek[firstWeekStart]
        const phaseSchedule = {}
        phases.forEach(p => {
          phaseSchedule[p.phase] = {
            dayOfWeek: p.day_of_week,
            time: p.scheduled_time,
            duration: p.duration_minutes
          }
        })
        await service.scheduleContentPiece(piece.id, firstWeekStart, phaseSchedule)
      }
      
      await loadData()
      setShowPlanFromBatchModal(false)
      setSelectedBatchItem(null)
    } catch (err) {
      console.error('Failed to save from batch:', err)
      throw err
    }
  }
  
  // ============================================
  // RENDER: Loading & Error States
  // ============================================
  
  if (loading && !dataLoaded && weekDays?.length > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={32} color={GOLD.primary} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Laden...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  if (!weekDays?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <RefreshCw size={32} color={GOLD.primary} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Week laden...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '1rem' }}>{error}</span>
          <button
            onClick={loadData}
            style={{
              padding: '0.75rem 1.5rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    )
  }
  
  // ============================================
  // RENDER: Main View - UPDATED: Pass batchItems
  // ============================================
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'calc(100vh - 120px)' : '100%',
      minHeight: isMobile ? 'auto' : '600px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0.75rem' : '1rem',
        background: `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.3) 100%)`,
        borderBottom: `1px solid ${GOLD.border}`,
        borderRadius: isMobile ? '0' : '12px 12px 0 0'
      }}>
        {/* Week Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={goToPreviousWeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '8px',
              color: GOLD.primary,
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <div style={{ textAlign: 'center', minWidth: '140px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              color: GOLD.primary,
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '700'
            }}>
              <Calendar size={16} />
              {formatWeekRange()}
            </div>
          </div>
          
          <button
            onClick={goToNextWeek}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '8px',
              color: GOLD.primary,
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={loadData}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
            title="Verversen"
          >
            <RefreshCw size={16} />
          </button>
          
          <button
            onClick={() => {
              const day = isMobile ? weekDays[selectedDayIndex] : weekDays[0]
              setAddModalData({ dayOfWeek: day?.dayOfWeek || 'monday', time: '09:00' })
              setShowAddModal(true)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: isMobile ? '0.5rem' : '0.5rem 0.875rem',
              background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: '700',
              fontSize: '0.85rem',
              cursor: 'pointer',
              touchAction: 'manipulation'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            {!isMobile && <span>Toevoegen</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content - UPDATED: Pass batchItems */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        background: isMobile ? 'transparent' : 'rgba(0, 0, 0, 0.2)',
        borderRadius: isMobile ? '0' : '0 0 12px 12px'
      }}>
        {!isMobile ? (
          <>
            {/* Oude "ideeën"-sidebar (UnscheduledSidebar) verwijderd — ideeën
                worden nu beheerd in de Ideeën-sectie ernaast en van daaruit
                ingepland. */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <CalendarGrid
                weekDays={weekDays}
                items={items}
                contentPieces={contentPieces}
                salesPieces={salesPieces}
                batchItems={batchItems}
                getPieceForItem={getPieceForItem}
                multiSelectMode={multiSelectMode}
                selectedItemIds={selectedItemIds}
                onToggleItemSelect={handleToggleItemSelect}
                onItemDrop={handleItemDrop}
                onIdeaDrop={handleIdeaDrop}
                onTimeSlotClick={handleTimeSlotClick}
                onItemToggleComplete={handleItemToggleComplete}
                onItemEdit={handleItemEdit}
                onItemDelete={handleItemDelete}
                onDeleteRecurringTemplate={handleDeleteRecurringTemplate}
                onViewScript={handleViewScript}
                onMoveToNextWeek={handleMoveToNextWeek}
                onMoveToPrevWeek={handleMoveToPrevWeek}
                onUnschedule={handleUnschedule}
                onOpenCaption={handleOpenCaption}
                onViewBatchItem={handleViewBatchItem}
                onEditBatchItem={handleEditBatchItem}
                batchShoots={batchShoots}
                onViewShoot={handleViewShoot}
              />
            </div>
          </>
        ) : (
          <MobileTimelineView
            weekDays={weekDays}
            items={items}
            contentPieces={contentPieces}
            salesPieces={salesPieces}
            batchItems={batchItems}
            getPieceForItem={getPieceForItem}
            multiSelectMode={multiSelectMode}
            selectedItemIds={selectedItemIds}
            onToggleItemSelect={handleToggleItemSelect}
            selectedDayIndex={selectedDayIndex}
            onDaySelect={setSelectedDayIndex}
            onItemDrop={handleItemDrop}
            onTimeSlotClick={handleTimeSlotClick}
            onItemToggleComplete={handleItemToggleComplete}
            onItemEdit={handleItemEdit}
            onItemDelete={handleItemDelete}
            onDeleteRecurringTemplate={handleDeleteRecurringTemplate}
            onViewScript={handleViewScript}
            onMoveToNextWeek={handleMoveToNextWeek}
            onMoveToPrevWeek={handleMoveToPrevWeek}
            onUnschedule={handleUnschedule}
            onOpenCaption={handleOpenCaption}
            onViewBatchItem={handleViewBatchItem}
            onEditBatchItem={handleEditBatchItem}
            batchShoots={batchShoots}
            onViewShoot={handleViewShoot}
            onAddClick={() => {
              const day = weekDays[selectedDayIndex]
              setAddModalData({ dayOfWeek: day?.dayOfWeek || 'monday', time: '09:00' })
              setShowAddModal(true)
            }}
          />
        )}
      </div>
      
      {/* Modals */}
      {showAddModal && (
        <AddItemModal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setAddModalData({ dayOfWeek: null, time: null }) }}
          onSave={handleAddItem}
          weekDays={weekDays}
          initialDayOfWeek={addModalData.dayOfWeek}
          initialTime={addModalData.time}
          editItem={addModalData.editItem}
          isMobile={isMobile}
        />
      )}
      
      {showScheduleModal && pieceToSchedule && (
        <SchedulePieceModal
          isOpen={showScheduleModal}
          onClose={() => { setShowScheduleModal(false); setPieceToSchedule(null) }}
          onSave={handleConfirmSchedulePiece}
          piece={pieceToSchedule}
          weekDays={weekDays}
          isMobile={isMobile}
        />
      )}
      
      {showPlanFromBatchModal && (
        <PlanFromBatchModal
          isOpen={showPlanFromBatchModal}
          onClose={() => { setShowPlanFromBatchModal(false); setSelectedBatchItem(null) }}
          onSave={handleSaveFromBatch}
          contentItem={selectedBatchItem}
          weekDays={weekDays}
          isMobile={isMobile}
        />
      )}
      
      {showScriptModal && scriptContentItem && (
        <VideoBlueprint
          item={scriptContentItem}
          onClose={() => { setShowScriptModal(false); setScriptContentItem(null) }}
          onSave={() => loadData()}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      {/* Caption Modal */}
      <CaptionModal
        isOpen={showCaptionModal}
        onClose={() => { setShowCaptionModal(false); setCaptionPiece(null) }}
        contentPiece={captionPiece}
        onSave={handleSaveCaption}
        isMobile={isMobile}
      />

      {/* Batch-item Inzien op de agenda */}
      <BatchItemViewModal
        isOpen={!!viewBatchItem}
        onClose={() => setViewBatchItem(null)}
        item={viewBatchItem?.item}
        format={viewBatchItem?.format}
        onPlan={null}
        isMobile={isMobile}
      />

      {/* Batch-item Bewerken op de agenda (custom velden) */}
      <BatchItemEditModal
        isOpen={!!editBatchItem}
        onClose={() => setEditBatchItem(null)}
        item={editBatchItem?.item}
        format={editBatchItem?.format}
        onSave={handleSaveBatchItemEdit}
        isMobile={isMobile}
      />

      {/* Opnamemoment Inzien — alle items van de batch */}
      <BatchShootViewModal
        isOpen={!!shootView}
        onClose={() => setShootView(null)}
        batch={shootView}
        isMobile={isMobile}
      />
      
      {loadingScript && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <RefreshCw size={32} color={GOLD.primary} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Script laden...</span>
          </div>
        </div>
      )}
      
      {/* Multi-Select Floating Action Button */}
      {!multiSelectMode ? (
        <button
          onClick={handleToggleMultiSelect}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '2rem',
            right: isMobile ? '1rem' : '2rem',
            width: isMobile ? '56px' : '60px',
            height: isMobile ? '56px' : '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <span style={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>☑️</span>
        </button>
      ) : (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '2rem',
          right: isMobile ? '1rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          zIndex: 100
        }}>
          {/* Selection info + actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            padding: '1rem',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            minWidth: '200px'
          }}>
            <div style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#8b5cf6',
              textAlign: 'center'
            }}>
              {selectedItemIds.size} geselecteerd
            </div>
            
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={handleSelectAll}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '6px',
                  color: '#8b5cf6',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Alles
              </button>
              
              <button
                onClick={handleDeselectAll}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation'
                }}
              >
                Geen
              </button>
            </div>
            
            {selectedItemIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                style={{
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}
              >
                🗑️ Verwijder ({selectedItemIds.size})
              </button>
            )}
          </div>
          
          {/* Exit multi-select button */}
          <button
            onClick={handleToggleMultiSelect}
            style={{
              width: isMobile ? '56px' : '60px',
              height: isMobile ? '56px' : '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              alignSelf: 'flex-end',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <span style={{ fontSize: isMobile ? '1.5rem' : '1.75rem' }}>✖️</span>
          </button>
        </div>
      )}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
