// src/modules/output-planning/components/ContentLibrary.jsx
// Content Library - MAIN COMPONENT (Refactored with Week Planning)
// UPDATED: Added Story support + BATCH SYSTEM + RESTORED individual item creation

import { useState, useEffect } from 'react'
import VideoBlueprint from './VideoBlueprint'

// Sub-components
import BatchesListView from './content-library/BatchesListView'
import CalendarView from './content-library/CalendarView'
import IdeasView from './content-library/IdeasView'
import LibraryView from './content-library/LibraryView'
import PlanningModal from './content-library/PlanningModal'
import LibraryModal from './content-library/LibraryModal'

// Week Planning components
import WeekPlanningView from './week-planning/WeekPlanningView'
import PlanFromBatchModal from './week-planning/PlanFromBatchModal'

// Batch system components
import BatchService from '../../content-batches/BatchService'
import BatchModal from '../../content-batches/components/BatchModal'
import ReadyToPostView from '../../content-batches/components/ReadyToPostView'
import PlanBatchItemModal from '../../content-batches/components/PlanBatchItemModal'
import EditBatchItemModal from '../../content-batches/components/EditBatchItemModal'

// Constants & helpers
import { GOLD, LIBRARY_CATEGORIES, getMonday } from './content-library/constants'

// Icons
import {
  Calendar,
  Lightbulb,
  Zap,
  Plus,
  Library,
  CalendarDays,
  CheckCircle
} from 'lucide-react'

// Helper: Format date to YYYY-MM-DD without timezone issues
const formatDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ContentLibrary({ content, service, db, onRefresh }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Handle resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // State
  const [activeView, setActiveView] = useState('batch')
  const [currentWeekMonday, setCurrentWeekMonday] = useState(getMonday(new Date()))
  const [planningItems, setPlanningItems] = useState([])
  const [weekDays, setWeekDays] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScriptModal, setShowScriptModal] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [modalType, setModalType] = useState('planning')
  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [libraryCategory, setLibraryCategory] = useState('all')
  const [copiedId, setCopiedId] = useState(null)
  
  // Plan from batch modal state
  const [showPlanFromBatchModal, setShowPlanFromBatchModal] = useState(false)
  const [selectedBatchItem, setSelectedBatchItem] = useState(null)
  
  // Batch system state
  const [batchService] = useState(() => new BatchService(db.supabase))
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [readyItems, setReadyItems] = useState([])
  const [loadingReady, setLoadingReady] = useState(false)
  const [showPlanBatchItemModal, setShowPlanBatchItemModal] = useState(false)
  const [showEditBatchItemModal, setShowEditBatchItemModal] = useState(false)
  const [itemToBeScheduled, setItemToBeScheduled] = useState(null)
  const [itemToBeEdited, setItemToBeEdited] = useState(null)
  // Real batches (content_batches + batch_items) for the Batch tab.
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  
  // Load planning data
  useEffect(() => {
    loadPlanningData()
    loadWeekDays()
  }, [currentWeekMonday])
  
  // Load ready items when ready tab is selected
  useEffect(() => {
    if (activeView === 'ready') {
      loadReadyItems()
    }
    if (activeView === 'batch') {
      loadBatches()
    }
  }, [activeView])

  // Refresh batches whenever the create-batch modal closes (in case user
  // just saved a new one). Cheap query; no need to be clever.
  useEffect(() => {
    if (!showBatchModal && activeView === 'batch') {
      loadBatches()
    }
  }, [showBatchModal])

  const loadBatches = async () => {
    setLoadingBatches(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      const data = await batchService.getBatchesWithItems(user.id)
      setBatches(data || [])
    } catch (e) {
      console.error('loadBatches failed:', e)
    } finally {
      setLoadingBatches(false)
    }
  }

  const handleDeleteBatch = async (batch) => {
    if (!window.confirm(`Batch "${batch.batch_name || 'Naamloos'}" + alle items verwijderen?`)) return
    try {
      await batchService.deleteBatch(batch.id)
      setBatches(prev => prev.filter(b => b.id !== batch.id))
    } catch (e) {
      console.error('deleteBatch failed:', e)
      alert(`Batch verwijderen mislukt — ${e?.message || JSON.stringify(e)}`)
    }
  }

  
  const loadPlanningData = async () => {
    setLoading(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      try {
        const { data, error } = await db.supabase
          .from('content_items')
          .select('*')
          .eq('coach_id', user.id)
          .order('planned_date', { ascending: true })
        
        if (!error) {
          setPlanningItems(data || [])
        }
      } catch (e) {
        console.log('content_items table not yet created:', e.message)
        setPlanningItems([])
      }
    } catch (error) {
      console.error('loadPlanningData failed:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Generate recurring stories for current week
  const generateRecurringStoriesForWeek = async (weekPlanId, userId) => {
    try {
      // Get all recurring stories (templates)
      const { data: recurringStories, error: storiesError } = await db.supabase
        .from('content_items')
        .select('*')
        .eq('coach_id', userId)
        .eq('type', 'story')
        .eq('is_recurring', true)
      
      if (storiesError) throw storiesError
      if (!recurringStories || recurringStories.length === 0) {
        console.log('ℹ️ No recurring stories found')
        return
      }
      
      console.log(`📱 Found ${recurringStories.length} recurring story templates`)
      
      // For each recurring story, create output_day_items for this week
      for (const story of recurringStories) {
        if (!story.recurring_days || story.recurring_days.length === 0) continue
        
        // Check if items already exist for this story in this week
        const { data: existingItems } = await db.supabase
          .from('output_day_items')
          .select('id, day_of_week')
          .eq('week_plan_id', weekPlanId)
          .eq('title', story.title)
          .eq('item_type', 'content')
        
        const existingDays = existingItems?.map(item => item.day_of_week) || []
        
        // Create items for days that don't exist yet
        const itemsToCreate = []
        for (const dayName of story.recurring_days) {
          if (existingDays.includes(dayName)) {
            console.log(`⏭️ Story "${story.title}" already exists for ${dayName}`)
            continue
          }
          
          itemsToCreate.push({
            week_plan_id: weekPlanId,
            day_of_week: dayName,
            scheduled_time: story.planned_time || '12:00',
            duration_minutes: 5,
            title: story.title,
            description: `${story.story_format || 'story'} - ${story.story_goal || ''}`,
            phase: 'post',
            item_type: 'content',
            completed: false,
            content_piece_id: null,
            created_at: new Date().toISOString()
          })
        }
        
        if (itemsToCreate.length > 0) {
          const { error: insertError } = await db.supabase
            .from('output_day_items')
            .insert(itemsToCreate)
          
          if (insertError) {
            console.error(`❌ Failed to create items for "${story.title}":`, insertError)
          } else {
            console.log(`✅ Generated ${itemsToCreate.length} items for "${story.title}"`)
          }
        }
      }
      
      console.log('✨ Recurring stories generated for this week')
    } catch (error) {
      console.error('❌ Generate recurring stories failed:', error)
    }
  }

  // Load or create week days for output_week_plans
  const loadWeekDays = async () => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      // FIX: Use local date formatting to avoid timezone issues
      const weekStart = formatDateString(currentWeekMonday)
      
      // Try to get existing week plan
      let { data: weekPlan, error } = await db.supabase
        .from('output_week_plans')
        .select('*')
        .eq('coach_id', user.id)
        .eq('week_start_date', weekStart)
        .single()
      
      // If no week plan exists, create one
      if (error || !weekPlan) {
        const { data: newPlan, error: createError } = await db.supabase
          .from('output_week_plans')
          .insert({
            coach_id: user.id,
            week_start_date: weekStart,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (!createError) {
          weekPlan = newPlan
        } else {
          console.error('Failed to create week plan:', createError)
          return
        }
      }
      
      if (weekPlan) {
        // Create week days array
        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const daysArray = []
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(currentWeekMonday)
          date.setDate(date.getDate() + i)
          
          daysArray.push({
            weekPlanId: weekPlan.id,
            dayIndex: i,
            dayOfWeek: dayNames[i],
            date: formatDateString(date),
            dateObj: date
          })
        }
        
        setWeekDays(daysArray)
        
        // ✨ AUTO-GENERATE recurring stories for this week
        await generateRecurringStoriesForWeek(weekPlan.id, user.id)
      }
    } catch (error) {
      console.error('loadWeekDays failed:', error)
    }
  }
  
  // Helper: Generate output_day_items for recurring story
  const generateRecurringStoryItems = async (story, userId) => {
    try {
      // Get current week plan
      const weekStart = formatDateString(currentWeekMonday)
      let { data: weekPlan } = await db.supabase
        .from('output_week_plans')
        .select('id')
        .eq('coach_id', userId)
        .eq('week_start_date', weekStart)
        .single()
      
      if (!weekPlan) {
        console.log('No week plan found, creating one...')
        const { data: newPlan, error: planError } = await db.supabase
          .from('output_week_plans')
          .insert({
            coach_id: userId,
            week_start_date: weekStart,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (planError) throw planError
        weekPlan = newPlan
      }
      
      // Create output_day_items for each selected day
      const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const itemsToCreate = []
      
      for (const dayName of story.recurring_days || []) {
        const dayIndex = dayNames.indexOf(dayName)
        if (dayIndex === -1) continue
        
        const storyDate = new Date(currentWeekMonday)
        storyDate.setDate(storyDate.getDate() + dayIndex)
        
        itemsToCreate.push({
          week_plan_id: weekPlan.id,
          day_of_week: dayName,
          scheduled_time: story.planned_time || '12:00',
          duration_minutes: 5,
          title: story.title,
          description: `${story.story_format} - ${story.story_goal}`,
          phase: 'post',
          item_type: 'content',
          completed: false,
          content_piece_id: null, // Stories don't need content_piece
          created_at: new Date().toISOString()
        })
      }
      
      if (itemsToCreate.length > 0) {
        const { error: insertError } = await db.supabase
          .from('output_day_items')
          .insert(itemsToCreate)
        
        if (insertError) throw insertError
        console.log(`✅ Generated ${itemsToCreate.length} story items for week planning`)
      }
    } catch (error) {
      console.error('❌ Generate recurring story items failed:', error)
    }
  }
  
  // Get items for current week
  const getWeekItems = () => {
    const weekStart = formatDateString(currentWeekMonday)
    const weekEnd = new Date(currentWeekMonday)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEndStr = formatDateString(weekEnd)
    
    return planningItems.filter(item => 
      item.planned_date >= weekStart && item.planned_date <= weekEndStr
    )
  }
  
  // Get ideas
  const getIdeas = () => {
    return planningItems.filter(item => 
      item.status === 'idea' && !item.planned_date
    )
  }
  
  // Get content for specific day
  const getContentForDay = (dayIndex) => {
    const date = new Date(currentWeekMonday)
    date.setDate(date.getDate() + dayIndex)
    const dateStr = formatDateString(date)
    return getWeekItems().filter(item => item.planned_date === dateStr)
  }
  
  // Navigation
  const goToPreviousWeek = () => {
    const newMonday = new Date(currentWeekMonday)
    newMonday.setDate(newMonday.getDate() - 7)
    setCurrentWeekMonday(newMonday)
  }
  
  const goToNextWeek = () => {
    const newMonday = new Date(currentWeekMonday)
    newMonday.setDate(newMonday.getDate() + 7)
    setCurrentWeekMonday(newMonday)
  }
  
  // CRUD Operations - UPDATED for story support with week planning generation
  const handleSavePlanningItem = async (formData, options = {}) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      // Check if multiple items (from StoryModal)
      if (options.isMultiple && Array.isArray(formData)) {
        // Save multiple items (stories for different days)
        for (const item of formData) {
          const { data: savedStory, error } = await db.supabase
            .from('content_items')
            .insert({ 
              coach_id: user.id, 
              ...item, 
              created_at: new Date().toISOString() 
            })
            .select()
            .single()
          
          if (error) throw error
          
          // If recurring story, generate output_day_items for current week
          if (item.is_recurring && item.recurring_days && item.recurring_days.length > 0) {
            await generateRecurringStoryItems(savedStory, user.id)
          }
        }
      } else if (editingItem && modalType === 'planning') {
        // Update existing item
        await db.supabase
          .from('content_items')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id)
        
        // If it became a recurring story, generate items
        if (formData.is_recurring && formData.recurring_days && formData.recurring_days.length > 0) {
          const { data: updatedStory } = await db.supabase
            .from('content_items')
            .select('*')
            .eq('id', editingItem.id)
            .single()
          
          if (updatedStory) {
            await generateRecurringStoryItems(updatedStory, user.id)
          }
        }
      } else if (modalType === 'planning') {
        // Create single new item
        const { data: savedItem, error } = await db.supabase
          .from('content_items')
          .insert({ 
            coach_id: user.id, 
            ...formData, 
            created_at: new Date().toISOString() 
          })
          .select()
          .single()
        
        if (error) throw error
        
        // If recurring story, generate output_day_items
        if (formData.is_recurring && formData.recurring_days && formData.recurring_days.length > 0) {
          await generateRecurringStoryItems(savedItem, user.id)
        }
      }
      
      setShowAddModal(false)
      setEditingItem(null)
      loadPlanningData()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }
  
  const handleStatusChange = async (itemId, newStatus) => {
    try {
      const updates = { status: newStatus, updated_at: new Date().toISOString() }
      if (newStatus === 'posted') updates.posted_at = new Date().toISOString()
      
      await db.supabase.from('content_items').update(updates).eq('id', itemId)
      loadPlanningData()
    } catch (error) {
      console.error('Status update failed:', error)
    }
  }
  
  const handleDeletePlanningItem = async (itemId) => {
    if (!confirm('Weet je zeker dat je dit wilt verwijderen?')) return
    try {
      await db.supabase.from('content_items').delete().eq('id', itemId)
      loadPlanningData()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
  
  // ============================================
  // BATCH SYSTEM FUNCTIONS
  // ============================================
  
  /**
   * Load ready items
   */
  const loadReadyItems = async () => {
    setLoadingReady(true)
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      const items = await batchService.getReadyItems(user.id)
      setReadyItems(items)
      console.log('✅ Loaded', items.length, 'ready items')
    } catch (err) {
      console.error('Failed to load ready items:', err)
    } finally {
      setLoadingReady(false)
    }
  }
  
  /**
   * Save new batch
   */
  const handleSaveBatch = async (batchData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) throw new Error('Not logged in')
      
      const batch = await batchService.createBatch(user.id, batchData)
      console.log('✅ Batch created:', batch.id)
      
      // If recurring, automatically plan the items
      if (batchData.planningType === 'recurring' && batchData.recurringPattern) {
        console.log('📅 Planning recurring batch items...')
        await batchService.planRecurringBatch(batch.id, batchData.recurringPattern)
        console.log('✅ Recurring items planned!')
      }
      
      // Reload ready items if planning type was 'ready'
      if (batchData.planningType === 'ready') {
        await loadReadyItems()
      }
      
      alert(`✅ Batch "${batchData.batchName || 'Nieuwe batch'}" aangemaakt met ${batchData.items.length} items!`)
      
    } catch (err) {
      console.error('Failed to save batch:', err)
      throw err
    }
  }
  
  /**
   * Plan a ready item - opens modal
   */
  const handlePlanReadyItem = async (item) => {
    setItemToBeScheduled(item)
    setShowPlanBatchItemModal(true)
  }
  
  /**
   * Save planned batch item
   */
  const handleSavePlannedItem = async (itemId, date, time) => {
    try {
      await batchService.planBatchItem(itemId, date, time)
      await loadReadyItems()
      console.log('✅ Item planned for', date, time)
    } catch (err) {
      console.error('Failed to plan item:', err)
      throw err
    }
  }
  
  /**
   * Edit batch item
   */
  const handleEditBatchItem = async (item) => {
    setItemToBeEdited(item)
    setShowEditBatchItemModal(true)
  }
  
  /**
   * Save edited batch item
   */
  const handleSaveEditedItem = async (itemId, updates) => {
    try {
      await batchService.updateBatchItem(itemId, updates)
      await loadReadyItems()
      console.log('✅ Item updated:', itemId)
    } catch (err) {
      console.error('Failed to update item:', err)
      throw err
    }
  }
  
  /**
   * Delete batch item
   */
  const handleDeleteBatchItem = async (itemId) => {
    try {
      await batchService.deleteBatchItem(itemId)
      await loadReadyItems()
      console.log('✅ Item deleted')
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }
  
  // Save from Plan From Batch Modal
  const handleSaveFromBatch = async (saveData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      // 1. Create content piece
      const { data: piece, error: pieceError } = await db.supabase
        .from('content_pieces')
        .insert({
          coach_id: user.id,
          ...saveData.contentPiece
        })
        .select()
        .single()
      
      if (pieceError) throw pieceError
      
      // 2. Process each week's phases separately
      const phasesByWeek = saveData.phasesByWeek || {}
      
      for (const [weekStart, phases] of Object.entries(phasesByWeek)) {
        // Check if week plan exists for this week
        let { data: weekPlan } = await db.supabase
          .from('output_week_plans')
          .select('id')
          .eq('coach_id', user.id)
          .eq('week_start_date', weekStart)
          .single()
        
        // Create if not exists
        if (!weekPlan) {
          const { data: newPlan, error: planError } = await db.supabase
            .from('output_week_plans')
            .insert({
              coach_id: user.id,
              week_start_date: weekStart
            })
            .select()
            .single()
          
          if (planError) throw planError
          weekPlan = newPlan
        }
        
        // Create items for this week's phases
        const itemsToCreate = phases.map(phase => ({
          week_plan_id: weekPlan.id,
          day_of_week: phase.day_of_week,
          scheduled_time: phase.scheduled_time,
          duration_minutes: phase.duration_minutes,
          title: phase.title,
          description: phase.description,
          phase: phase.phase,
          content_piece_id: piece.id,
          item_type: 'content',
          completed: phase.completed || false
        }))
        
        const { error: itemsError } = await db.supabase
          .from('output_day_items')
          .insert(itemsToCreate)
        
        if (itemsError) throw itemsError
      }
      
      // 3. Update original content_item to mark as planned
      if (selectedBatchItem?.id) {
        await db.supabase
          .from('content_items')
          .update({ 
            status: 'created',
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedBatchItem.id)
      }
      
      setShowPlanFromBatchModal(false)
      setSelectedBatchItem(null)
      loadPlanningData()
      
    } catch (error) {
      console.error('Failed to save from batch:', error)
      throw error
    }
  }
  
  // Library CRUD
  const handleSaveLibraryItem = async (formData) => {
    try {
      const user = await db.getCurrentUser()
      if (!user) return
      
      if (editingItem && modalType === 'library') {
        await service.updateContent(editingItem.id, formData)
      } else if (modalType === 'library') {
        await service.createContent({ ...formData, coach_id: user.id })
      }
      
      setShowAddModal(false)
      setEditingItem(null)
      onRefresh()
    } catch (error) {
      console.error('Save failed:', error)
    }
  }
  
  const handleDeleteLibraryItem = async (itemId) => {
    if (!confirm('Weet je zeker dat je dit wilt verwijderen?')) return
    try {
      await service.deleteContent(itemId)
      onRefresh()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }
  
  const copyLink = async (link, id) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
    }
  }
  
  // Modal helpers
  const openPlanningModal = (item = null) => {
    setModalType('planning')
    setEditingItem(item)
    setShowAddModal(true)
  }
  
  const openLibraryModal = (item = null) => {
    setModalType('library')
    setEditingItem(item)
    setShowAddModal(true)
  }
  
  const filteredLibraryContent = libraryCategory === 'all'
    ? content
    : content.filter(c => c.category === libraryCategory)
  
  // Views config - UPDATED with Ready tab
  const views = [
    { id: 'batch', label: 'Batch', icon: Zap },
    { id: 'weekplan', label: 'Week', icon: CalendarDays },
    { id: 'ready', label: 'Ready', icon: CheckCircle },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'ideas', label: 'Ideeën', icon: Lightbulb },
    { id: 'library', label: 'Bibliotheek', icon: Library }
  ]
  
  // Determine if current view should show + Nieuw Item FAB
  const showAddItemFAB = ['batch', 'calendar', 'ideas'].includes(activeView)

  return (
    <div style={{ 
      padding: isMobile ? '0.75rem' : '1.5rem',
      maxWidth: '100%',
      overflowX: 'hidden',
      position: 'relative',
      paddingBottom: isMobile && showAddItemFAB ? '80px' : '1.5rem' // Extra space for FAB on mobile
    }}>
      {/* View Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(7, 1fr)',
        gap: isMobile ? '0.5rem' : '0.5rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        {views.map(view => {
          const Icon = view.icon
          const isActive = activeView === view.id
          
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: isMobile ? '0.75rem' : '0.75rem 1rem',
                background: isActive
                  ? `linear-gradient(135deg, ${GOLD.background} 0%, rgba(0,0,0,0.4) 100%)`
                  : 'rgba(255, 255, 255, 0.03)',
                border: isActive
                  ? `2px solid ${GOLD.primary}`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: isActive ? GOLD.primary : 'rgba(255, 255, 255, 0.6)',
                fontWeight: isActive ? '700' : '500',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '48px'
              }}
            >
              <Icon size={isMobile ? 16 : 18} />
              {view.label}
            </button>
          )
        })}
        
        {/* Batch Button */}
        <button
          onClick={() => setShowBatchModal(true)}
          style={{
            gridColumn: isMobile ? '1 / -1' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            background: `linear-gradient(135deg, ${GOLD.primary} 0%, ${GOLD.secondary} 100%)`,
            border: 'none',
            borderRadius: '10px',
            color: '#000',
            fontWeight: '700',
            fontSize: isMobile ? '0.85rem' : '0.85rem',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '48px'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          📦 Batch
        </button>
      </div>
      
      {/* Loading */}
      {loading && activeView !== 'library' && activeView !== 'weekplan' && activeView !== 'ready' ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{
            width: '40px', 
            height: '40px',
            border: `3px solid ${GOLD.border}`,
            borderTopColor: GOLD.primary,
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Laden...</div>
        </div>
      ) : (
        <>
          {activeView === 'batch' && (
            <BatchesListView
              batches={batches}
              loading={loadingBatches}
              onCreateBatch={() => setShowBatchModal(true)}
              onEditItem={handleEditBatchItem}
              onPlanItem={handlePlanReadyItem}
              onDeleteBatch={handleDeleteBatch}
              isMobile={isMobile}
            />
          )}
          
          {activeView === 'weekplan' && (
            <WeekPlanningView
              db={db}
              weekDays={weekDays}
              currentWeekMonday={currentWeekMonday}
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
              onRefresh={loadPlanningData}
              isMobile={isMobile}
            />
          )}
          
          {activeView === 'ready' && (
            loadingReady ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: `3px solid ${GOLD.border}`,
                  borderTopColor: GOLD.primary,
                  borderRadius: '50%',
                  margin: '0 auto 1rem',
                  animation: 'spin 1s linear infinite'
                }} />
                <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Laden...</div>
              </div>
            ) : (
              <ReadyToPostView
                readyItems={readyItems}
                onPlanItem={handlePlanReadyItem}
                onEditItem={handleEditBatchItem}
                onDeleteItem={handleDeleteBatchItem}
                onViewBatch={(batch) => console.log('View batch:', batch)}
                isMobile={isMobile}
              />
            )
          )}
          
          {activeView === 'calendar' && (
            <CalendarView
              weekContent={getWeekItems()}
              currentWeekMonday={currentWeekMonday}
              getContentForDay={getContentForDay}
              onStatusChange={handleStatusChange}
              onDelete={handleDeletePlanningItem}
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
              isMobile={isMobile}
            />
          )}
          
          {activeView === 'ideas' && (
            <IdeasView
              ideas={getIdeas()}
              onDelete={handleDeletePlanningItem}
              onEdit={openPlanningModal}
              filterType={filterType}
              setFilterType={setFilterType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isMobile={isMobile}
            />
          )}
          
          {activeView === 'library' && (
            <LibraryView
              content={filteredLibraryContent}
              allContent={content}
              activeCategory={libraryCategory}
              setActiveCategory={setLibraryCategory}
              onEdit={openLibraryModal}
              onDelete={handleDeleteLibraryItem}
              onCopyLink={copyLink}
              copiedId={copiedId}
              isMobile={isMobile}
            />
          )}
        </>
      )}
      
      {/* ➕ NIEUW ITEM FAB - Shows on Batch, Calendar, Ideas views */}
      {showAddItemFAB && (
        <button
          onClick={() => openPlanningModal()}
          style={{
            position: 'fixed',
            bottom: isMobile ? '5rem' : '2rem',
            right: isMobile ? '1rem' : '2rem',
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '2px solid rgba(16, 185, 129, 0.5)',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 50,
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isMobile) e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            if (!isMobile) e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Nieuw item toevoegen"
        >
          <Plus size={isMobile ? 24 : 28} color="#fff" strokeWidth={2.5} />
        </button>
      )}
      
      {/* Modals */}
      {showAddModal && modalType === 'planning' && (
        <PlanningModal
          item={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null) }}
          onSave={handleSavePlanningItem}
          currentWeekMonday={currentWeekMonday}
          isMobile={isMobile}
        />
      )}
      
      {showAddModal && modalType === 'library' && (
        <LibraryModal
          item={editingItem}
          onClose={() => { setShowAddModal(false); setEditingItem(null) }}
          onSave={handleSaveLibraryItem}
          isMobile={isMobile}
        />
      )}
      
      {showScriptModal && (
        <VideoBlueprint
          item={showScriptModal}
          onClose={() => setShowScriptModal(null)}
          onSave={() => loadPlanningData()}
          db={db}
          isMobile={isMobile}
        />
      )}
      
      {/* Plan From Batch Modal */}
      {showPlanFromBatchModal && (
        <PlanFromBatchModal
          isOpen={showPlanFromBatchModal}
          onClose={() => {
            setShowPlanFromBatchModal(false)
            setSelectedBatchItem(null)
          }}
          onSave={handleSaveFromBatch}
          contentItem={selectedBatchItem}
          weekDays={weekDays}
          isMobile={isMobile}
        />
      )}
      
      {/* Batch Modal */}
      <BatchModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSave={handleSaveBatch}
        db={db}
        isMobile={isMobile}
      />
      
      {/* Plan Batch Item Modal */}
      <PlanBatchItemModal
        isOpen={showPlanBatchItemModal}
        onClose={() => {
          setShowPlanBatchItemModal(false)
          setItemToBeScheduled(null)
        }}
        onSave={handleSavePlannedItem}
        batchItem={itemToBeScheduled}
        isMobile={isMobile}
      />
      
      {/* Edit Batch Item Modal */}
      <EditBatchItemModal
        isOpen={showEditBatchItemModal}
        onClose={() => {
          setShowEditBatchItemModal(false)
          setItemToBeEdited(null)
        }}
        onSave={handleSaveEditedItem}
        batchItem={itemToBeEdited}
        isMobile={isMobile}
      />
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
