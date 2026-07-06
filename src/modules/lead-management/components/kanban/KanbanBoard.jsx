// src/modules/lead-management/components/kanban/KanbanBoard.jsx
// VERSION 7.0 - STYLING GUIDE COMPLIANT
// ALL LOGIC PRESERVED 1:1 FROM v6.4
// STYLING: Compact headers, flush rows, no gradients, no glow, no boxShadow animations

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Settings, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, GripVertical, Save, RotateCcw, Users, Instagram, Search, X, ArrowUp, ArrowUpDown, Clock, Maximize2, Minimize2, CheckCircle, Send, Zap, Flame, Phone, SlidersHorizontal } from 'lucide-react'
import KanbanCard from './KanbanCard'
import AddLeadModal from './AddLeadModal'
import RapidAddLeadsModal from './RapidAddLeadsModal'
import SectionModal from './SectionModal'
import PeriodStatsBar from '../PeriodStatsBar'
import WarmUpBoard from './WarmUpBoard'
import { exportDailyReport } from '../../utils/exportDailyReport'
import SalesCallModal from './SalesCallModal'
import LeadDetailModalV2 from './LeadDetailModalV2'
import OutreachLoggerModal from '../OutreachLoggerModal'
import LeadSourceModal from './LeadSourceModal'
import CallProposalModal from './CallProposalModal'

const SNOOZE_SECTION_PATTERNS = ['later follow', 'later opvolg', 'follow up', 'followup', 'snooze', 'parkeer']

// "Follow up stil"-sectie herkennen — apart van snooze. Bevat 'stil' samen met
// een opvolg-woord, zodat het NIET botst met de snooze-detectie (die ook op
// 'follow up' matcht). "Later Follow Up" (snooze) bevat geen 'stil' en blijft
// dus snooze; "3+ Dagen Stil" bevat geen opvolg-woord en blijft een stil-sectie.
const FOLLOWUP_STIL_PATTERNS = ['follow up stil', 'followup stil', 'opvolg stil', 'opgevolgd stil']
const isFollowupStilTitle = (title) => {
  const t = (title || '').toLowerCase()
  return FOLLOWUP_STIL_PATTERNS.some(p => t.includes(p)) || (t.includes('stil') && (t.includes('follow') || t.includes('opvolg')))
}
// "3 dagen stil"-sectie herkennen (de bron voor de auto-verplaatsing).
const isThreeDaysSilentTitle = (title) => {
  const t = (title || '').toLowerCase()
  return (t.includes('3+') || t.includes('3 dag') || t.includes('3d')) && t.includes('stil')
}
// Elke "stil/stale"-sectie herkennen (1/2/3 dag stil, inactief). Spiegelt
// service.isStaleSectionByTitle — gebruikt voor de optimistische reply-restore.
const isStaleTitle = (title) => {
  const t = (title || '').toLowerCase().trim()
  return t.includes('1 dag') || t.includes('2 dag') || t.includes('3 dag') ||
         t.includes('3+') || t.includes('stil') || t.includes('stale') || t.includes('inactive')
}

// Gold theme tokens (consistent with CoachHub)
const G = {
  primary: '#FFD700',
  border: 'rgba(255, 215, 0, 0.15)',
  bg: 'rgba(255, 215, 0, 0.08)',
  text: 'rgba(255, 215, 0, 0.6)'
}

export default function KanbanBoard({ 
  leadService, db, coachId, isMobile, onUnsavedChanges, coachName = 'Coach',
  campaigns = [], activeCampaign = null
}) { 
  const [viewMode, setViewMode] = useState('leads')
  const [sections, setSections] = useState([])
  const [originalSections, setOriginalSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddLead, setShowAddLead] = useState(false)
  const [showRapidAdd, setShowRapidAdd] = useState(false)
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [selectedSectionForLead, setSelectedSectionForLead] = useState(null)
  const [expandedSections, setExpandedSections] = useState({})
  // boardFilter shape: {
  //   sort: string,
  //   types: Set<'magnet'|'outreach'>,        // leeg = alle types
  //   temps: Set<'hot'|'warm'|'cold'|'none'>, // leeg = alle temps
  //   followups: Set<number>,                 // leeg = alle aantallen opvolg
  // }
  // Eén overkoepelende filter voor het HELE bord (i.p.v. per sectie). Dezelfde
  // dimensies (type, temperatuur, opvolg-aantal, sortering) gelden nu in alle
  // secties tegelijk.
  const [boardFilter, setBoardFilter] = useState({ sort: 'default', types: new Set(), temps: new Set(), followups: new Set() })
  const [showBoardFilter, setShowBoardFilter] = useState(false)
  const boardFilterRef = useRef(null)

  const toggleBoardSet = (key, value) => setBoardFilter(cur => {
    const next = new Set(cur[key])
    if (next.has(value)) next.delete(value); else next.add(value)
    return { ...cur, [key]: next }
  })
  const setBoardSort = (sort) => setBoardFilter(cur => ({ ...cur, sort }))
  const resetBoardFilter = () => setBoardFilter({ sort: 'default', types: new Set(), temps: new Set(), followups: new Set() })

  // Sluit de globale filter-dropdown bij een klik/touch buiten (document-niveau,
  // betrouwbaar ook binnen transform-ouders zoals de kanban-kolommen).
  useEffect(() => {
    if (!showBoardFilter) return
    const onDown = (e) => {
      if (boardFilterRef.current && !boardFilterRef.current.contains(e.target)) setShowBoardFilter(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [showBoardFilter])
  // Globale "hot leads" toggle — overschrijft de per-sectie temperatuur-
  // filter zodat de coach in één klik hot leads ALLE secties kan zien.
  const [globalHotOnly, setGlobalHotOnly] = useState(false)
  // Globale "calls voorgesteld" toggle — toont alleen leads waar de coach
  // al een call_proposal-bericht heeft gestuurd (via lead_notes).
  const [globalCallProposedOnly, setGlobalCallProposedOnly] = useState(false)
  const [callProposedLeadIds, setCallProposedLeadIds] = useState(() => new Set())

  // Eenmalig lijst van leads met een call-proposal note ophalen. Reload
  // gebeurt elke keer dat we de toggle aanzetten — zo blijft de set vers
  // ook als de coach intussen nieuwe proposals heeft gestuurd.
  useEffect(() => {
    if (!globalCallProposedOnly || !coachId || !leadService?.db?.supabase) return
    let cancelled = false
    leadService.db.supabase
      .from('lead_notes')
      .select('lead_id')
      .eq('coach_id', coachId)
      .eq('note_type', 'call_proposal')
      .is('deleted_at', null)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('load call_proposal notes failed:', error); return }
        setCallProposedLeadIds(new Set((data || []).map(r => r.lead_id)))
      })
    return () => { cancelled = true }
  }, [globalCallProposedOnly, coachId, leadService])

  const sectionPassesFilter = (lead, filter, section = null) => {
    // Globale hot-only override — als actief, alleen hot leads tonen,
    // ongeacht de per-sectie temperatuur-filter.
    if (globalHotOnly && lead.lead_temperature !== 'hot') return false
    // Globale call-proposed override — toon leads die een call voorgesteld
    // hebben gekregen. Dat is: ze staan NU in de "Call voorgesteld"-sectie,
    // óf ze zijn vanuit die sectie naar "stil" geschoven (previous_section),
    // óf er is een tracked call_proposal-note voor verstuurd. (Eerder keken we
    // alleen naar de note, waardoor handmatig verplaatste leads wegvielen.)
    if (globalCallProposedOnly) {
      const proposedRe = /voorgesteld|voorstel/i
      const inProposedSection = proposedRe.test(section?.title || '')
      const cameFromProposed = proposedRe.test(lead.previous_section_title || '')
      const hasProposalNote = callProposedLeadIds.has(lead.id)
      if (!(inProposedSection || cameFromProposed || hasProposalNote)) return false
    }

    // Type-filter — een lead heeft EITHER een lead_magnet OR een
    // outreach_campaign (zelden allebei). De coach kan beide aanvinken =
    // alles toegestaan, of slechts één voor exclusieve focus.
    if (filter.types.size > 0) {
      const isMagnet = !!lead.source_lead_magnet_id
      const isOutreach = !!lead.outreach_campaign_id
      const matches =
        (filter.types.has('magnet') && isMagnet) ||
        (filter.types.has('outreach') && isOutreach)
      if (!matches) return false
    }
    // Temperatuur-filter — null/empty count als 'none'. Geskipt als
    // globalHotOnly al actief is.
    if (!globalHotOnly && filter.temps.size > 0) {
      const t = lead.lead_temperature || 'none'
      if (!filter.temps.has(t)) return false
    }
    // Opvolg-filter — alleen leads met EXACT (een van) de gekozen aantallen
    // opvolg-berichten. Leeg = alle aantallen toegestaan.
    if (filter.followups && filter.followups.size > 0) {
      if (!filter.followups.has(Number(lead.followup_count) || 0)) return false
    }
    return true
  }
  const [activityData, setActivityData] = useState({})
  const [funnelData, setFunnelData] = useState({})
  // Bumpt bij elke reactie/DM-edit zodat de bovenste PeriodStatsBar direct
  // herlaadt (niet pas bij een periode-wissel).
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const [draggedLead, setDraggedLead] = useState(null)
  const [dragOverSectionId, setDragOverSectionId] = useState(null)
  const [draggedSection, setDraggedSection] = useState(null)
  const [dragOverForSection, setDragOverForSection] = useState(null)
  const [isDraggingSection, setIsDraggingSection] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  // Server-side duplicate check — runs when local board has no match. Surfaces
  // existing leads (e.g. in "Niet toegewezen") that the local sections array
  // didn't include, so we don't accidentally create dupes.
  const [dbCheckResults, setDbCheckResults] = useState([])
  const [dbCheckLoading, setDbCheckLoading] = useState(false)
  // Drop-triggered modal: when a lead is dropped into the Lead-magnets
  // section, this holds { lead, sectionColor } and forces the modal to
  // open on the Magnets tab so the coach can immediately pick which one.
  const [magnetPickerLead, setMagnetPickerLead] = useState(null)
  // Outreach logger modal — daily DMs sent per campaign.
  const [showOutreachLogger, setShowOutreachLogger] = useState(false)
  // Most recent active campaign id — pre-filled when a new lead is added so
  // attribution is automatic. Null when the coach has no active campaign.
  const [activeCampaignId, setActiveCampaignId] = useState(null)
  const [activeCampaignName, setActiveCampaignName] = useState('')

  useEffect(() => {
    if (!coachId) return
    let cancelled = false
    leadService.db.supabase
      .from('outreach_campaigns')
      .select('id, name, variant_tag')
      .eq('coach_id', coachId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return
        // Clear state when no active campaign exists — otherwise a deleted /
        // archived campaign id would stick around and cause an FK violation
        // on the next lead-add (call_leads_outreach_campaign_id_fkey).
        if (!data) {
          setActiveCampaignId(null)
          setActiveCampaignName('')
          return
        }
        setActiveCampaignId(data.id)
        setActiveCampaignName(data.variant_tag ? `${data.name} · ${data.variant_tag}` : data.name)
      })
    return () => { cancelled = true }
    // Re-fetch when the logger modal closes (user may have created a new campaign).
  }, [coachId, leadService, showOutreachLogger])
  const [highlightedLeadId, setHighlightedLeadId] = useState(null)
  // Holds the just-created lead so we can prompt for its source. Cleared
  // when the source modal closes (whether attributed or skipped).
  const [leadForSource, setLeadForSource] = useState(null)
  // Set when a lead just got dropped into a "Call voorgesteld" section
  // — opens the proposal-text logger so the coach can save the exact
  // message they sent for later review in the stats.
  const [leadForProposal, setLeadForProposal] = useState(null)
  const handleSourceAttributed = (leadId, updates) => {
    // Mirror the new attribution into local state so any open detail modal
    // or card label reflects it without a full board reload.
    setSections(prev => prev.map(s => ({
      ...s,
      leads: (s.leads || []).map(l => l.id === leadId ? { ...l, ...updates } : l),
    })))
  }
  const searchInputRef = useRef(null)
  const leadRefs = useRef({})
  const [showScrollTop, setShowScrollTop] = useState(false)
  // Zoek-toolbar: zweeft vast in beeld (fixed) en is sleepbaar. Positie
  // onthouden in localStorage. null = standaard bovenaan.
  const [searchBarPos, setSearchBarPos] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem('leadSearchBarPos') || 'null'); if (s && typeof s.top === 'number') return s } catch {}
    return null
  })
  const toolbarRef = useRef(null)
  // Slepen zonder re-render: tijdens het bewegen manipuleren we de DOM direct
  // (geen setState → geen re-render van het zware bord → botersmooth). Pas bij
  // loslaten committen we de positie naar state + localStorage.
  const startSearchDrag = (e) => {
    e.preventDefault(); e.stopPropagation()
    const el = toolbarRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const p = e.touches?.[0] || e
    const offX = p.clientX - rect.left
    const offY = p.clientY - rect.top
    el.style.transform = 'none'
    el.style.transition = 'none'
    el.style.willChange = 'left, top'
    let last = { left: rect.left, top: rect.top }
    const move = (ev) => {
      const q = ev.touches?.[0] || ev
      const left = Math.max(4, Math.min(window.innerWidth - rect.width - 4, q.clientX - offX))
      const top = Math.max(4, Math.min(window.innerHeight - rect.height - 4, q.clientY - offY))
      el.style.left = left + 'px'
      el.style.top = top + 'px'
      last = { left, top }
    }
    const end = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end)
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end)
      el.style.willChange = 'auto'
      setSearchBarPos(last)
      try { localStorage.setItem('leadSearchBarPos', JSON.stringify(last)) } catch {}
    }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', end)
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', end)
  }
  // Houd de zoekbalk ALTIJD binnen het scherm: bij laden en bij resize/device-
  // wissel wordt een opgeslagen positie die (deels) buiten beeld valt terug in
  // beeld geclampt. Zo verdwijnt 'ie nooit uit je scherm.
  useEffect(() => {
    const clampIntoView = () => {
      if (!searchBarPos) return
      const el = toolbarRef.current
      const w = el?.offsetWidth || 320
      const h = el?.offsetHeight || 44
      const left = Math.max(4, Math.min(window.innerWidth - w - 4, searchBarPos.left))
      const top = Math.max(4, Math.min(window.innerHeight - h - 4, searchBarPos.top))
      if (left !== searchBarPos.left || top !== searchBarPos.top) {
        const pos = { left, top }
        setSearchBarPos(pos)
        try { localStorage.setItem('leadSearchBarPos', JSON.stringify(pos)) } catch {}
      }
    }
    clampIntoView()
    window.addEventListener('resize', clampIntoView)
    return () => window.removeEventListener('resize', clampIntoView)
  }, [searchBarPos])
  const [staleCheckDone, setStaleCheckDone] = useState(false)
  const [staleCheckResult, setStaleCheckResult] = useState(null)
  const [snoozeSection, setSnoozeSection] = useState(null)
  // "Follow up stil"-sectie: leads die 3 dagen stil staan en al 1x opgevolgd
  // zijn, gaan hierheen zodat de opvolg-werklijst zuiver blijft.
  const [followupStilSection, setFollowupStilSection] = useState(null)
  const followupStilAutoCreatedRef = useRef(false)
  // Tracks whether we've already attempted to auto-create the default snooze
  // section this session, so the effect below stays idempotent if it re-fires
  // (e.g. after sections state updates).
  const snoozeAutoCreatedRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [salesCallLead, setSalesCallLead] = useState(null)
  const fullscreenContentRef = useRef(null)
  
  const MAX_VISIBLE_LEADS = 5

  // ========================================
  // REAL-TIME SUBSCRIPTION — PRESERVED 1:1
  // ========================================
  useEffect(() => {
    if (!db?.supabase || !coachId) return

    const timestamp = Date.now()
    const channelName1 = `kanban_leads_${coachId}_${timestamp}`
    const channelName2 = `kanban_items_${coachId}_${timestamp}`

    const subscription1 = db.supabase
      .channel(channelName1)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_leads' }, (payload) => {
        handleRealtimeEvent(payload, 'call_leads')
      })
      .subscribe()

    const subscription2 = db.supabase
      .channel(channelName2)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_section_items' }, (payload) => {
        handleRealtimeEvent(payload, 'lead_section_items')
      })
      .subscribe()

    return () => {
      subscription1.unsubscribe()
      subscription2.unsubscribe()
    }
  }, [db, coachId])

  // ========================================
  // REALTIME EVENT HANDLER — PRESERVED 1:1
  // ========================================
  const handleRealtimeEvent = async (payload, tableName) => {
    const updatedItem = payload.new
    const oldItem = payload.old
    
    if (tableName === 'lead_section_items') {
      const leadId = updatedItem?.lead_id || oldItem?.lead_id
      if (!leadId) return
      
      const { data: fullLead, error: leadError } = await db.supabase
        .from('call_leads').select('*').eq('id', leadId).single()
      
      if (leadError || !fullLead) { loadBoard(false); return }
      
      const enrichedLead = {
        ...fullLead,
        section_id: updatedItem?.section_id,
        position: updatedItem?.position || 0,
        previous_section_id: updatedItem?.previous_section_id,
        previous_section_title: updatedItem?.previous_section_title,
        previous_section_color: updatedItem?.previous_section_color
      }
      
      if (payload.eventType === 'UPDATE') handleLeadUpdate(enrichedLead, { ...fullLead, section_id: oldItem?.section_id })
      else if (payload.eventType === 'INSERT') handleLeadInsert(enrichedLead)
      else if (payload.eventType === 'DELETE') handleRealtimeLeadDelete(oldItem)
      return
    }
    
    const updatedLead = payload.new
    const oldLead = payload.old
    const isRelevant = updatedLead?.coach_id === coachId || updatedLead?.coach_id === null || oldLead?.coach_id === coachId || oldLead?.coach_id === null
    if (!isRelevant) return
    
    if (payload.eventType === 'UPDATE') handleLeadUpdate(updatedLead, oldLead)
    else if (payload.eventType === 'INSERT') handleLeadInsert(updatedLead)
    else if (payload.eventType === 'DELETE') handleRealtimeLeadDelete(oldLead)
  }

  // ========================================
  // LEAD UPDATE/INSERT/DELETE — PRESERVED 1:1
  // ========================================
  const handleLeadUpdate = (updatedLead, oldLead) => {
    const targetSectionId = updatedLead.section_id || null
    let currentSectionId = null
    for (const section of sections) {
      if ((section.leads || []).some(l => l.id === updatedLead.id)) { currentSectionId = section.id; break }
    }
    const isMove = targetSectionId && currentSectionId !== targetSectionId
    
    if (!isMove) {
      setSections(prev => prev.map(section => ({
        ...section,
        leads: (section.leads || []).map(l => l.id === updatedLead.id ? { ...l, ...updatedLead } : l)
      })))
    } else {
      // Find the existing card so we can carry its embed (outreach_campaign,
      // source_lead_magnet) forward — realtime payloads don't include joins,
      // so a raw replace would nuke the gold campaign pill on the card.
      let prevCard = null
      for (const s of sections) {
        const found = (s.leads || []).find(l => l.id === updatedLead.id)
        if (found) { prevCard = found; break }
      }
      const mergedLead = prevCard ? { ...prevCard, ...updatedLead } : updatedLead
      setSections(prev => prev.map(section => {
        if (section.id === currentSectionId) return { ...section, leads: (section.leads || []).filter(l => l.id !== updatedLead.id) }
        if (targetSectionId && section.id === targetSectionId) {
          const exists = (section.leads || []).some(l => l.id === updatedLead.id)
          if (exists) return { ...section, leads: (section.leads || []).map(l => l.id === updatedLead.id ? mergedLead : l) }
          return { ...section, leads: [mergedLead, ...(section.leads || [])] }
        }
        return section
      }))
      if (targetSectionId) setExpandedSections(prev => ({ ...prev, [targetSectionId]: true }))
      setHighlightedLeadId(updatedLead.id)
      setTimeout(() => setHighlightedLeadId(null), 3000)
      loadActivityData()
    }
  }

  const handleLeadInsert = (newLead) => {
    const targetSectionId = newLead.section_id || 'unassigned'
    setSections(prev => prev.map(section => {
      if (section.id === targetSectionId) {
        const exists = (section.leads || []).some(l => l.id === newLead.id)
        if (!exists) return { ...section, leads: [newLead, ...(section.leads || [])] }
      }
      return section
    }))
    setHighlightedLeadId(newLead.id)
    setTimeout(() => setHighlightedLeadId(null), 3000)
    loadActivityData()
    setStatsRefreshKey(k => k + 1)  // nieuwe lead → stat-bar direct bijwerken
  }

  const handleRealtimeLeadDelete = (deletedLead) => {
    setSections(prev => prev.map(section => ({ ...section, leads: (section.leads || []).filter(l => l.id !== deletedLead.id) })))
    loadActivityData()
    setStatsRefreshKey(k => k + 1)
  }

  // ========================================
  // EFFECTS — PRESERVED 1:1
  // ========================================
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false) }
    if (isFullscreen) { document.addEventListener('keydown', handleKeyDown); document.body.style.overflow = 'hidden' }
    else { document.body.style.overflow = '' }
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = '' }
  }, [isFullscreen])

  useEffect(() => {
    if (sections.length === 0) return
    // Sluit de "Follow up stil"-sectie expliciet uit van de snooze-detectie.
    const found = sections.find(s => !isFollowupStilTitle(s.title) && SNOOZE_SECTION_PATTERNS.some(p => (s.title || '').toLowerCase().includes(p)))
    if (found) {
      setSnoozeSection(found)
      return
    }
    setSnoozeSection(null)
    // No snooze section yet — auto-create a default one once. The ref guard
    // prevents re-creation when this effect runs again after sections update.
    if (!coachId || !leadService || snoozeAutoCreatedRef.current || loading) return
    snoozeAutoCreatedRef.current = true
    ;(async () => {
      try {
        const ns = await leadService.createSection(coachId, {
          title: '💤 Snooze',
          color: '#64748b',
          position: sections.filter(s => s.id !== 'unassigned').length,
        })
        const sectionWithLeads = { ...ns, leads: [] }
        const update = (prev) => {
          const u = prev.find(s => s.id === 'unassigned')
          const others = prev.filter(s => s.id !== 'unassigned')
          return [...others, sectionWithLeads, ...(u ? [u] : [])]
        }
        setSections(update)
        setOriginalSections(update)
      } catch (e) {
        console.error('Auto-create snooze section failed:', e)
        // Allow retry on next mount if it failed.
        snoozeAutoCreatedRef.current = false
      }
    })()
  }, [sections, coachId, leadService, loading])

  // "Follow up stil"-sectie vinden, of eenmalig auto-aanmaken (zelfde patroon
  // als snooze). Hierheen verplaatsen leads die 3 dagen stil staan zodra ze
  // hun opvolg-bericht krijgen.
  useEffect(() => {
    if (sections.length === 0) return
    const found = sections.find(s => isFollowupStilTitle(s.title))
    if (found) { setFollowupStilSection(found); return }
    setFollowupStilSection(null)
    if (!coachId || !leadService || followupStilAutoCreatedRef.current || loading) return
    followupStilAutoCreatedRef.current = true
    ;(async () => {
      try {
        const ns = await leadService.createSection(coachId, {
          title: '📵 Follow up stil',
          color: '#f97316',
          position: sections.filter(s => s.id !== 'unassigned').length,
        })
        const sectionWithLeads = { ...ns, leads: [] }
        const update = (prev) => {
          const u = prev.find(s => s.id === 'unassigned')
          const others = prev.filter(s => s.id !== 'unassigned')
          return [...others, sectionWithLeads, ...(u ? [u] : [])]
        }
        setSections(update)
        setOriginalSections(update)
        setFollowupStilSection(sectionWithLeads)
      } catch (e) {
        console.error('Auto-create Follow up stil section failed:', e)
        followupStilAutoCreatedRef.current = false
      }
    })()
  }, [sections, coachId, leadService, loading])

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  // Overkoepelende sort + filter (geldt voor alle secties). Filters eerst, dan sort.
  const getSortedLeads = (section) => {
    const f = boardFilter
    const leads = (section.leads || []).filter(lead => sectionPassesFilter(lead, f, section))
    const mode = f.sort || 'default'
    const num = (v) => Number(v) || 0
    const t = (v) => v ? new Date(v).getTime() : 0

    if (mode === 'followup-asc') {
      return [...leads].sort((a, b) => num(a.followup_count) - num(b.followup_count))
    }
    if (mode === 'followup-desc') {
      return [...leads].sort((a, b) => num(b.followup_count) - num(a.followup_count))
    }
    if (mode === 'reply-asc') {
      return [...leads].sort((a, b) => num(a.reply_count) - num(b.reply_count))
    }
    if (mode === 'created-desc') {
      return [...leads].sort((a, b) => t(b.created_at) - t(a.created_at))
    }
    if (mode === 'created-asc') {
      return [...leads].sort((a, b) => t(a.created_at) - t(b.created_at))
    }
    // default
    const today = new Date().toISOString().split('T')[0]
    return [...leads].sort((a, b) => {
      const aToday = a.contacted_today_date?.split('T')[0] === today
      const bToday = b.contacted_today_date?.split('T')[0] === today
      if (aToday && !bToday) return 1
      if (!aToday && bToday) return -1
      return (a.position || 0) - (b.position || 0)
    })
  }

  const SECTION_SORT_OPTIONS = [
    { id: 'default',       label: 'Standaard' },
    { id: 'followup-asc',  label: 'Weinig opvolgingen ↑' },
    { id: 'followup-desc', label: 'Veel opvolgingen ↓' },
    { id: 'reply-asc',     label: 'Geen reactie eerst' },
    { id: 'created-desc',  label: 'Nieuwste eerst' },
    { id: 'created-asc',   label: 'Oudste eerst' },
  ]

  const getContactedTodayCount = (section) => {
    const today = new Date().toISOString().split('T')[0]
    return (section.leads || []).filter(l => l.contacted_today_date?.split('T')[0] === today).length
  }

  // SEARCH — PRESERVED 1:1
  const handleSearch = (query) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([]); setShowSearchResults(false)
      setDbCheckResults([]); setDbCheckLoading(false)
      return
    }
    const q = query.toLowerCase().trim()
    const results = []
    sections.forEach(section => {
      (section.leads || []).forEach(lead => {
        const fn = (lead.first_name || '').toLowerCase()
        const ln = (lead.last_name || '').toLowerCase()
        const full = `${fn} ${ln}`.trim()
        const ig = (lead.instagram_handle || '').toLowerCase()
        const em = (lead.email || '').toLowerCase()
        const notes = (lead.notes || '').toLowerCase()
        if (fn.includes(q) || ln.includes(q) || full.includes(q) || ig.includes(q) || em.includes(q) || notes.includes(q)) {
          results.push({ ...lead, sectionId: section.id, sectionTitle: section.title, sectionColor: section.color })
        }
      })
    })
    setSearchResults(results.slice(0, 10))
    setShowSearchResults(true)
  }

  // When local results come back empty for a non-trivial query, do an
  // async server-side lookup. PostgREST ilike with * wildcards (not %)
  // because % gets URL-mangled in OR-filters.
  useEffect(() => {
    const q = (searchQuery || '').trim()
    // Need at least 2 chars + coach context + zero local hits.
    if (!coachId || q.length < 2 || searchResults.length > 0) {
      setDbCheckResults([])
      setDbCheckLoading(false)
      return
    }
    let cancelled = false
    setDbCheckLoading(true)
    const localLeadIds = new Set(sections.flatMap(s => (s.leads || []).map(l => l.id)))
    const handleClean = q.replace(/^@+/, '')
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await leadService.db.supabase
          .from('call_leads')
          .select('id, first_name, last_name, email, phone, lead_source, notes, coach_id')
          .eq('coach_id', coachId)
          .is('deleted_at', null)
          .or(`first_name.ilike.*${handleClean}*,last_name.ilike.*${handleClean}*,email.ilike.*${handleClean}*,notes.ilike.*${handleClean}*`)
          .limit(8)
        if (cancelled) return
        if (error) { console.warn('Server-side lead search failed:', error); setDbCheckResults([]); setDbCheckLoading(false); return }
        // Drop hits that are already in the local board (no need to dupe-warn).
        const novel = (data || []).filter(l => !localLeadIds.has(l.id))
        // Annotate with current section info via lead_section_items lookup.
        if (novel.length === 0) { setDbCheckResults([]); setDbCheckLoading(false); return }
        const novelIds = novel.map(l => l.id)
        const { data: items } = await leadService.db.supabase
          .from('lead_section_items')
          .select('lead_id, section_id')
          .in('lead_id', novelIds)
        if (cancelled) return
        const sectionMap = {}
        sections.forEach(s => { sectionMap[s.id] = s })
        const annotated = novel.map(l => {
          const item = (items || []).find(i => i.lead_id === l.id)
          const sec = item ? sectionMap[item.section_id] : null
          return { ...l, sectionId: sec?.id || null, sectionTitle: sec?.title || 'Niet toegewezen', sectionColor: sec?.color || '#6b7280' }
        })
        setDbCheckResults(annotated)
      } catch (err) {
        console.error('DB dupe-check error:', err)
        if (!cancelled) setDbCheckResults([])
      } finally {
        if (!cancelled) setDbCheckLoading(false)
      }
    }, 300) // debounce so we don't query on every keystroke
    return () => { cancelled = true; clearTimeout(timer) }
  }, [searchQuery, searchResults.length, coachId, leadService, sections])

  // Called when a magnet is *added* to a lead via the modal. Auto-moves the
  // lead into the "Lead magnets" section if it isn't already there. No-op
  // if the section doesn't exist or the lead is already in it.
  const handleMagnetAttachedForLead = async (leadObj /* , magnetName */) => {
    const target = findLeadMagnetsSection()
    if (!target || !leadObj?.id) return
    let currentSectionId = null
    for (const s of sections) {
      if ((s.leads || []).some(l => l.id === leadObj.id)) { currentSectionId = s.id; break }
    }
    if (currentSectionId === target.id) return // already there, nothing to do
    // Optimistic move — strip currentSectionId annotation if present.
    const { currentSectionId: _x, ...cleanLead } = leadObj
    void _x
    setSections(prev => prev.map(s => {
      if (s.id === currentSectionId) return { ...s, leads: (s.leads || []).filter(l => l.id !== cleanLead.id) }
      if (s.id === target.id) return { ...s, leads: [cleanLead, ...(s.leads || []).filter(l => l.id !== cleanLead.id)] }
      return s
    }))
    setExpandedSections(prev => ({ ...prev, [target.id]: true }))
    setHighlightedLeadId(cleanLead.id)
    setTimeout(() => setHighlightedLeadId(null), 2000)
    try {
      await leadService.moveLeadToSection(cleanLead.id, target.id, 0, coachId)
    } catch (err) {
      console.error('Auto-move to lead-magnets failed:', err)
      await loadBoard(false)
    }
  }

  // Move an existing (server-side-found) lead into the Gesprek-Insta section.
  // Optimistic — drop it into the target section immediately so the user
  // doesn't see it bounce through "Niet toegewezen" while the realtime
  // DELETE/INSERT events on lead_section_items arrive out-of-order. We
  // intentionally skip loadBoard() here; the realtime subscription keeps
  // things eventually consistent.
  const handlePlaceExistingLead = async (existingLead) => {
    const section = findInstagramConversationSection()
    if (!section) return
    // Strip transient annotations added by the dbCheck (sectionId/etc) so the
    // lead object is purely call_leads-shaped for KanbanCard.
    const { sectionId: _s1, sectionTitle: _s2, sectionColor: _s3, ...cleanLead } = existingLead
    void _s1; void _s2; void _s3
    // 1) Optimistic UI: clear search + place card directly in target section.
    setSearchQuery(''); setSearchResults([]); setShowSearchResults(false)
    setDbCheckResults([])
    setSections(prev => prev.map(s => {
      // Drop the lead from any other local section it might already be in.
      const leadsWithout = (s.leads || []).filter(l => l.id !== cleanLead.id)
      if (s.id === section.id) return { ...s, leads: [cleanLead, ...leadsWithout] }
      return { ...s, leads: leadsWithout }
    }))
    setExpandedSections(prev => ({ ...prev, [section.id]: true }))
    setHighlightedLeadId(cleanLead.id)
    setTimeout(() => setHighlightedLeadId(null), 3000)
    // 2) Persist. On failure, revert the optimistic insert.
    try {
      await leadService.moveLeadToSection(cleanLead.id, section.id, 0, coachId)
    } catch (err) {
      console.error('Place existing lead failed:', err)
      alert('Verplaatsen mislukt')
      setSections(prev => prev.map(s => s.id === section.id
        ? { ...s, leads: (s.leads || []).filter(l => l.id !== cleanLead.id) }
        : s
      ))
    }
  }

  const scrollToLead = (leadId, sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }))
    setHighlightedLeadId(leadId)
    setShowSearchResults(false)
    setSearchQuery('')
    setTimeout(() => {
      const el = leadRefs.current[leadId]
      if (el) {
        if (isFullscreen && fullscreenContentRef.current) {
          const container = fullscreenContentRef.current
          const eRect = el.getBoundingClientRect()
          const cRect = container.getBoundingClientRect()
          container.scrollTo({ top: container.scrollTop + (eRect.top - cRect.top) - (cRect.height / 2) + (eRect.height / 2), behavior: 'smooth' })
        } else {
          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }
    }, 200)
    setTimeout(() => setHighlightedLeadId(null), 3000)
  }

  // DATA LOADING — PRESERVED 1:1
  const loadActivityData = async () => {
    try {
      const [activity, funnel] = await Promise.all([leadService.getTodayActivity(coachId), leadService.getTodayFunnelStats(coachId)])
      setActivityData(activity)
      setFunnelData(funnel)
    } catch (error) { console.error('❌ Load activity data failed:', error) }
  }

  const handleExportPDF = async () => {
    await loadActivityData()
    exportDailyReport(sections, { coachName, dailyGoal: 100 }, activityData, funnelData)
  }

  const hasUnsavedChanges = useCallback(() => {
    if (sections.length === 0 || originalSections.length === 0) return false
    const cur = sections.filter(s => s.id !== 'unassigned').map(s => s.id)
    const orig = originalSections.filter(s => s.id !== 'unassigned').map(s => s.id)
    if (cur.length !== orig.length) return true
    return cur.some((id, i) => id !== orig[i])
  }, [sections, originalSections])

  useEffect(() => { if (onUnsavedChanges) onUnsavedChanges(hasUnsavedChanges()) }, [sections, originalSections, hasUnsavedChanges, onUnsavedChanges])

  useEffect(() => {
    const handler = (e) => { if (hasUnsavedChanges()) { e.preventDefault(); e.returnValue = 'Je hebt onopgeslagen wijzigingen.'; return e.returnValue } }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  useEffect(() => {
    if (leadService && coachId) { loadBoard(true); loadActivityData() }
  }, [leadService, coachId])

  const loadBoard = async (isInitialLoad = false) => {
    try {
      setLoading(true)
      const board = await leadService.getKanbanBoard(coachId)
      if (isInitialLoad) { setSections(board); setOriginalSections(board) }
      else {
        const currentOrder = sections.filter(s => s.id !== 'unassigned').map(s => s.id)
        const unassigned = board.find(s => s.id === 'unassigned')
        const reordered = currentOrder.map(id => board.find(s => s.id === id)).filter(Boolean)
        board.forEach(s => { if (s.id !== 'unassigned' && !currentOrder.includes(s.id)) reordered.push(s) })
        if (unassigned) reordered.push(unassigned)
        setSections(reordered)
      }
    } catch (error) { console.error('❌ Load kanban failed:', error) }
    finally { setLoading(false) }
  }

  // STALE CHECK — PRESERVED 1:1
  useEffect(() => {
    const run = async () => {
      if (!leadService || !coachId || staleCheckDone || loading) return
      if (typeof leadService.checkAndMoveStaleLeads !== 'function') { setStaleCheckDone(true); return }
      try {
        const result = await leadService.checkAndMoveStaleLeads(coachId)
        setStaleCheckResult(result)
        setStaleCheckDone(true)
        if (result && result.moved > 0) { await loadBoard(true); await loadActivityData() }
      } catch (error) { console.error('❌ Stale check failed:', error); setStaleCheckDone(true) }
    }
    if (!loading && !staleCheckDone) run()
  }, [leadService, coachId, loading, staleCheckDone])

  // ========================================
  // HANDLERS — ALL PRESERVED 1:1
  // ========================================
  const handleSnoozeLead = async (leadId) => {
    if (!snoozeSection) { alert('⚠️ Geen "Later Follow Up" sectie gevonden!'); return }
    let currentSectionId = null, leadData = null
    for (const section of sections) {
      const found = (section.leads || []).find(l => l.id === leadId)
      if (found) { currentSectionId = section.id; leadData = found; break }
    }
    if (currentSectionId === snoozeSection.id) return
    try {
      await leadService.moveLeadToSection(leadId, snoozeSection.id, 0, coachId)
      setSections(prev => prev.map(section => {
        if (section.id === currentSectionId) return { ...section, leads: (section.leads || []).filter(l => l.id !== leadId) }
        if (section.id === snoozeSection.id) return { ...section, leads: [leadData, ...(section.leads || []).filter(l => l.id !== leadId)] }
        return section
      }))
      setExpandedSections(prev => ({ ...prev, [snoozeSection.id]: true }))
      setHighlightedLeadId(leadId)
      setTimeout(() => setHighlightedLeadId(null), 2000)
      loadActivityData()
    } catch (error) { console.error('❌ Snooze lead failed:', error); loadBoard(false) }
  }

  const isSnoozeSectionById = (sectionId) => snoozeSection && snoozeSection.id === sectionId

  const handleSave = async () => {
    if (!hasUnsavedChanges()) return
    try {
      setSaving(true)
      await leadService.reorderSections(coachId, sections.filter(s => s.id !== 'unassigned').map(s => s.id))
      setOriginalSections([...sections])
    } catch (error) { console.error('❌ Save failed:', error); alert('Opslaan mislukt') }
    finally { setSaving(false) }
  }

  const handleReset = () => { if (hasUnsavedChanges() && window.confirm('Wijzigingen ongedaan maken?')) setSections([...originalSections]) }

  const getReorderableSections = () => sections.filter(s => s.id !== 'unassigned')

  const moveSection = (sectionId, direction) => {
    const reorderable = getReorderableSections()
    const idx = reorderable.findIndex(s => s.id === sectionId)
    if (idx === -1) return
    const newIdx = direction === 'left' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= reorderable.length) return
    const newOrder = [...reorderable]
    ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
    setSections([...newOrder, sections.find(s => s.id === 'unassigned')])
  }

  // SECTION DRAG — PRESERVED 1:1
  const onGripDragStart = (e, section) => { e.stopPropagation(); if (section.id === 'unassigned') { e.preventDefault(); return }; setIsDraggingSection(true); setDraggedSection(section); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('dragType', 'section') }
  const onGripDragEnd = () => { setDraggedSection(null); setDragOverForSection(null); setIsDraggingSection(false) }
  const onColumnDragOver = (e, section) => { e.preventDefault(); if (isDraggingSection && draggedSection) { if (section.id !== 'unassigned' && section.id !== draggedSection.id) setDragOverForSection(section.id) } else if (draggedLead) { setDragOverSectionId(section.id) } }
  const onColumnDragLeave = () => { setDragOverForSection(null); setDragOverSectionId(null) }

  const onColumnDrop = async (e, targetSection) => {
    e.preventDefault()
    if (isDraggingSection && draggedSection) {
      setDragOverForSection(null)
      if (targetSection.id === 'unassigned' || targetSection.id === draggedSection.id) { setDraggedSection(null); setIsDraggingSection(false); return }
      const reorderable = getReorderableSections()
      const di = reorderable.findIndex(s => s.id === draggedSection.id)
      const ti = reorderable.findIndex(s => s.id === targetSection.id)
      if (di !== -1 && ti !== -1) { const n = [...reorderable]; n.splice(di, 1); n.splice(ti, 0, draggedSection); setSections([...n, sections.find(s => s.id === 'unassigned')]) }
      setDraggedSection(null); setIsDraggingSection(false)
    } else if (draggedLead) {
      setDragOverSectionId(null)
      if (draggedLead.currentSectionId === targetSection.id) { setDraggedLead(null); return }
      const magnetsSection = findLeadMagnetsSection()
      const isMagnetsDrop = magnetsSection && targetSection.id === magnetsSection.id
      try {
        await leadService.moveLeadToSection(draggedLead.id, targetSection.id, 0, coachId)
        setSections(prev => prev.map(section => {
          if (section.id === draggedLead.currentSectionId) return { ...section, leads: (section.leads || []).filter(l => l.id !== draggedLead.id) }
          if (section.id === targetSection.id) return { ...section, leads: [draggedLead, ...(section.leads || []).filter(l => l.id !== draggedLead.id)] }
          return section
        }))
        setExpandedSections(prev => ({ ...prev, [targetSection.id]: true }))
        setHighlightedLeadId(draggedLead.id)
        setTimeout(() => setHighlightedLeadId(null), 2000)
        loadActivityData()
        // Auto-open the magnet picker when this drop landed in the
        // Lead-magnets section. Strip the dragged-lead's transient
        // currentSectionId before handing it to the modal.
        if (isMagnetsDrop) {
          const { currentSectionId: _csId, ...cleanLead } = draggedLead
          void _csId
          setMagnetPickerLead({ lead: cleanLead, sectionColor: targetSection.color })
        }
        // Auto-open the call-proposal logger when the drop landed in a
        // section whose title signals "I proposed a call". Keyword-based
        // so any custom section a coach renames (e.g. "Voorstel call · A")
        // still triggers it. Skipped for the negative-outcome sections
        // (Sale verloren / Lost) — those are dead-end buckets.
        const t = (targetSection.title || '').toLowerCase()
        const isProposalDrop = (t.includes('voorgesteld') || t.includes('voorstel'))
          && !t.includes('verloren') && !t.includes('lost')
        if (isProposalDrop) {
          const { currentSectionId: _x, ...cleanLead } = draggedLead
          void _x
          setLeadForProposal(cleanLead)
        }
      } catch (error) { console.error('❌ Move lead failed:', error); await loadBoard(true) }
      setDraggedLead(null)
    }
  }

  const onLeadDragStart = (e, lead, sectionId) => { e.stopPropagation(); setDraggedLead({ ...lead, currentSectionId: sectionId }); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('dragType', 'lead') }

  // CRUD — PRESERVED 1:1
  const handleCreateSection = async (sectionData) => {
    try {
      const ns = await leadService.createSection(coachId, { ...sectionData, position: sections.filter(s => s.id !== 'unassigned').length })
      const update = (prev) => { const u = prev.find(s => s.id === 'unassigned'); const o = prev.filter(s => s.id !== 'unassigned'); return [...o, { ...ns, leads: [] }, u] }
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (error) { console.error('❌ Create section failed:', error); alert('Sectie maken mislukt') }
  }

  const handleUpdateSection = async (sectionId, updates) => {
    try {
      await leadService.updateSection(sectionId, updates)
      const update = (prev) => prev.map(s => s.id === sectionId ? { ...s, ...updates } : s)
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (error) { console.error('❌ Update section failed:', error); alert('Sectie bijwerken mislukt') }
  }

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Sectie verwijderen?')) return
    try {
      await leadService.deleteSection(sectionId)
      const update = (prev) => { const d = prev.find(s => s.id === sectionId); const leads = d?.leads || []; return prev.filter(s => s.id !== sectionId).map(s => s.id === 'unassigned' ? { ...s, leads: [...leads, ...(s.leads || [])] } : s) }
      setSections(update); setOriginalSections(update); setShowSectionModal(false)
    } catch (error) { console.error('❌ Delete section failed:', error) }
  }

  const handleAddLead = async (leadData) => {
    try {
      const newLead = await leadService.createLeadWithSection(leadData, selectedSectionForLead, coachId)
      setSections(prev => prev.map(section => {
        if (section.id === selectedSectionForLead) return { ...section, leads: [newLead, ...(section.leads || []).filter(l => l.id !== newLead.id)] }
        return section
      }))
      setExpandedSections(prev => ({ ...prev, [selectedSectionForLead]: true }))
      setHighlightedLeadId(newLead.id)
      setTimeout(() => setHighlightedLeadId(null), 3000)
      loadActivityData(); setStatsRefreshKey(k => k + 1); setShowAddLead(false); setSelectedSectionForLead(null)
      // Prompt the coach to attribute the source while it's fresh.
      setLeadForSource(newLead)
    } catch (error) {
      console.error('❌ Add lead failed:', error)
      const msg = error?.message || error?.details || JSON.stringify(error)
      alert(`Lead toevoegen mislukt — ${msg}\n\ncoachId: ${coachId || '(leeg!)'}`)
    }
  }

  // ── Rapid-add modal callbacks: optimistisch de board-state bijwerken.
  const handleRapidAdded = (newLead, sectionId) => {
    if (!newLead || !sectionId) return
    setSections(prev => prev.map(s => s.id === sectionId
      ? { ...s, leads: [newLead, ...(s.leads || []).filter(l => l.id !== newLead.id)] }
      : s))
    setExpandedSections(prev => ({ ...prev, [sectionId]: true }))
    setStatsRefreshKey(k => k + 1)
  }
  const handleRapidRemoved = (leadId) => {
    if (!leadId) return
    setSections(prev => prev.map(s => ({ ...s, leads: (s.leads || []).filter(l => l.id !== leadId) })))
    setStatsRefreshKey(k => k + 1)
  }

  // ── Quick-add directly from the search bar when no match was found.
  //
  // - If the query starts with "@" we treat it as an Instagram handle (no
  //   first name yet) and stash it in the notes field for now.
  // - Otherwise the query becomes first_name.
  // - lead_source is hard-coded to "Instagram" and the lead is dropped into
  //   the first section whose title matches /gesprek.*insta/i (the
  //   "Gesprek insta" workflow). Falls back to the first available section
  //   if the user renames it.
  const findInstagramConversationSection = () => {
    const re = /gesprek.*insta|insta.*gesprek/i
    return sections.find(s => s.id !== 'unassigned' && re.test(s.title || ''))
        || sections.find(s => s.id !== 'unassigned')
  }
  // Lead-magnets workflow: matches "Lead magnets", "Lead magnet", "Magnets",
  // etc. — case-insensitive whole-name lookup so coach can rename loosely.
  // Genormaliseerde set van bestaande lead-namen/handles op het bord — gebruikt
  // door de snel-toevoegen modal om dubbele invoer te blokkeren.
  const getExistingLeadNames = () => {
    const s = new Set()
    const norm = (v) => (v || '').toString().trim().toLowerCase().replace(/^@+/, '')
    sections.forEach(sec => (sec.leads || []).forEach(l => {
      // Alleen op de VOLLEDIGE naam matchen (niet losse voornaam) + handle,
      // anders krijg je valse "bestaat al" bij verschillende mensen met
      // dezelfde voornaam.
      const full = `${l.first_name || ''} ${l.last_name || ''}`.trim()
      if (full) s.add(norm(full))
      if (l.instagram_handle) s.add(norm(l.instagram_handle))
    }))
    return s
  }

  const findLeadMagnetsSection = () => {
    const re = /lead\s*magnets?|^\s*magnets?\s*$/i
    return sections.find(s => s.id !== 'unassigned' && re.test(s.title || ''))
  }
  const handleQuickAddFromSearch = async () => {
    const q = (searchQuery || '').trim()
    if (!q) return
    const section = findInstagramConversationSection()
    if (!section) {
      alert('Geen sectie gevonden om de lead in te plaatsen.')
      return
    }
    const isHandle = q.startsWith('@')
    const handleClean = isHandle ? q.replace(/^@+/, '') : ''
    const leadData = {
      firstName: isHandle ? handleClean : q,
      source: 'Instagram',
      notes: isHandle ? `Instagram: @${handleClean}` : null,
      // Auto-attribute to the latest active outreach campaign so funnel
      // metrics tie back to a specific message variant. (campaign_id is the
      // old scrape_campaigns ref; outreach_campaign_id is the new column.)
      outreachCampaignId: activeCampaignId || null,
    }
    try {
      const newLead = await leadService.createLeadWithSection(leadData, section.id, coachId)
      setSections(prev => prev.map(s => {
        if (s.id === section.id) return { ...s, leads: [newLead, ...(s.leads || []).filter(l => l.id !== newLead.id)] }
        return s
      }))
      setExpandedSections(prev => ({ ...prev, [section.id]: true }))
      setHighlightedLeadId(newLead.id)
      setTimeout(() => setHighlightedLeadId(null), 3000)
      // Clear search + jump to the new card so the user sees it land.
      setSearchQuery('')
      setSearchResults([])
      setShowSearchResults(false)
      setTimeout(() => {
        const el = leadRefs.current?.[newLead.id]
        if (el?.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 250)
      loadActivityData()
      setStatsRefreshKey(k => k + 1)  // nieuwe lead → stat-bar direct bijwerken
      setLeadForSource(newLead)
    } catch (error) {
      console.error('❌ Quick add from search failed:', error)
      const msg = error?.message || error?.details || JSON.stringify(error)
      alert(`Lead toevoegen mislukt — ${msg}\n\ncoachId: ${coachId || '(leeg!)'}`)
    }
  }

  const handleLeadEdit = async (lead, section, updates) => {
    if (updates.previous_section_id !== undefined) {
      try {
        const { error } = await leadService.db.supabase.from('lead_section_items').update({ previous_section_id: updates.previous_section_id, previous_section_title: updates.previous_section_title, previous_section_color: updates.previous_section_color }).eq('lead_id', lead.id)
        if (error) throw error
        setSections(prev => prev.map(s => ({ ...s, leads: (s.leads || []).map(l => l.id === lead.id ? { ...l, ...updates } : l) })))
        return
      } catch (error) { console.error('❌ Update return section failed:', error); return }
    }
    
    if (updates.contacted_today_date !== undefined || updates.reply_count !== undefined) {
      let currentSectionId = null
      for (const sec of sections) { if ((sec.leads || []).some(l => l.id === lead.id)) { currentSectionId = sec.id; break } }
      if (!currentSectionId) { await leadService.updateLead(lead.id, updates, coachId); setStatsRefreshKey(k => k + 1); await loadBoard(false); return }

      // OPTIMISTISCHE restore bij een reactie op een lead in een stil-sectie.
      // Doel = de vorige sectie als die bekend is; anders val terug op de
      // "Gesprek insta"-sectie (het actieve gesprek). Zonder deze fallback bleef
      // een stille lead zónder previous_section_id staan (bv. dukkie99).
      const curSection = sections.find(s => s.id === currentSectionId)
      const isStaleReply = updates.reply_count !== undefined && curSection && isStaleTitle(curSection.title)
      let restoreTarget = null
      if (isStaleReply) {
        const prevValid = lead.previous_section_id && sections.some(s => s.id === lead.previous_section_id)
        restoreTarget = prevValid
          ? lead.previous_section_id
          : (findInstagramConversationSection()?.id || null)
      }
      // Nieuwe regel: elke reactie (+1) reset de opvolg-teller direct naar 0 —
      // ook in de board-state, anders synct de card 'm terug naar de oude waarde.
      const replyReset = updates.reply_count !== undefined ? { followup_count: 0, last_followup_sent_at: null } : {}
      if (restoreTarget && restoreTarget !== currentSectionId) {
        setSections(prev => prev.map(s => {
          if (s.id === currentSectionId) return { ...s, leads: (s.leads || []).filter(l => l.id !== lead.id) }
          if (s.id === restoreTarget) return { ...s, leads: [{ ...lead, ...updates, ...replyReset }, ...(s.leads || []).filter(l => l.id !== lead.id)] }
          return s
        }))
        setExpandedSections(prev => ({ ...prev, [restoreTarget]: true }))
        setHighlightedLeadId(lead.id)
        setTimeout(() => setHighlightedLeadId(null), 2000)
      }

      try {
        const result = await leadService.updateLead(lead.id, updates, coachId)
        if (result.restored && result.restoredTo) {
          // Server restaureerde zelf (previous_section_id-pad) → plaats op de
          // juiste sectie + neem eventueel de gereset followup_count over.
          const restoredLead = { ...lead, ...updates, followup_count: result.followup_count }
          setSections(prev => prev.map(s => {
            const leads = (s.leads || []).filter(l => l.id !== lead.id)
            if (s.id === result.restoredTo.id) return { ...s, leads: [restoredLead, ...leads] }
            return { ...s, leads }
          }))
          setExpandedSections(prev => ({ ...prev, [result.restoredTo.id]: true }))
          setHighlightedLeadId(lead.id)
          setTimeout(() => setHighlightedLeadId(null), 2000)
        } else if (restoreTarget && restoreTarget !== currentSectionId) {
          // Server restaureerde niet (geen previous_section_id) → persisteer onze
          // fallback-verplaatsing zodat 'ie ook na reload op de juiste plek staat.
          try { await leadService.moveLeadToSection(lead.id, restoreTarget, 0, coachId) }
          catch (e) { console.error('❌ Fallback-restore persist mislukt:', e); await loadBoard(false) }
        } else {
          setSections(prev => prev.map(s => ({ ...s, leads: (s.leads || []).map(l => l.id === lead.id ? { ...l, ...updates, ...replyReset } : l) })))
        }
        setStatsRefreshKey(k => k + 1)  // bovenste stat-bar direct bijwerken
        loadActivityData()
      } catch (error) { console.error('❌ Update lead failed:', error); await loadBoard(false) }
      return
    }
    
    // Opvolg +1 vanuit een "3 dagen stil"-sectie → DIRECT naar "Follow up stil".
    // We bepalen dit op basis van de sectie waarin de kaart staat (section-param,
    // betrouwbaarder dan zoeken in de state) en verplaatsen OPTIMISTISCH (vóór de
    // netwerk-calls) zodat het meteen zichtbaar is.
    const isFollowupBump = updates.followup_count !== undefined && !!updates.last_followup_sent_at
    const moveToStil = isFollowupBump && followupStilSection && section
      && section.id !== followupStilSection.id && isThreeDaysSilentTitle(section.title)

    if (moveToStil) {
      setSections(prev => prev.map(s => {
        if (s.id === section.id) return { ...s, leads: (s.leads || []).filter(l => l.id !== lead.id) }
        if (s.id === followupStilSection.id) return { ...s, leads: [{ ...lead, ...updates }, ...(s.leads || []).filter(l => l.id !== lead.id)] }
        return s
      }))
      setExpandedSections(prev => ({ ...prev, [followupStilSection.id]: true }))
      setHighlightedLeadId(lead.id)
      setTimeout(() => setHighlightedLeadId(null), 2000)
    } else if (updates.followup_count !== undefined) {
      // Geen stil-move: werk de teller optimistisch bij in de sectie-state.
      // Zo herberekent een actieve per-sectie opvolg-filter direct → een lead
      // die niet meer aan het gekozen aantal voldoet verdwijnt meteen.
      setSections(prev => prev.map(s => ({
        ...s,
        leads: (s.leads || []).map(l => l.id === lead.id ? { ...l, ...updates } : l),
      })))
    }

    try {
      await leadService.updateLead(lead.id, updates, coachId)
      if (moveToStil) await leadService.moveLeadToSection(lead.id, followupStilSection.id, 0, coachId)
    } catch (e) {
      console.error('❌ Follow-up update/verplaatsing mislukt:', e)
      await loadBoard(false) // herstel UI bij fout
    }
    if (updates.followup_count !== undefined) setStatsRefreshKey(k => k + 1)
    loadActivityData()
  }

  // Verplaats een lead naar een sectie via de dropdown op de card (alternatief
  // voor slepen — handig als de doelsectie niet in beeld staat). Spiegelt de
  // optimistische move uit onColumnDrop.
  const handleMoveLeadToSection = async (lead, fromSectionId, targetSectionId) => {
    if (!targetSectionId || targetSectionId === fromSectionId) return
    try {
      await leadService.moveLeadToSection(lead.id, targetSectionId, 0, coachId)
      setSections(prev => prev.map(section => {
        if (section.id === fromSectionId) return { ...section, leads: (section.leads || []).filter(l => l.id !== lead.id) }
        if (section.id === targetSectionId) return { ...section, leads: [lead, ...(section.leads || []).filter(l => l.id !== lead.id)] }
        return section
      }))
      setExpandedSections(prev => ({ ...prev, [targetSectionId]: true }))
      setHighlightedLeadId(lead.id)
      setTimeout(() => setHighlightedLeadId(null), 2000)
      loadActivityData()
    } catch (error) {
      console.error('❌ Move lead via dropdown failed:', error)
      await loadBoard(false)
    }
  }

  const handleLeadDelete = async (lead) => {
    if (!window.confirm('Lead verwijderen?')) return
    try {
      await leadService.deleteLead(lead.id)
      setSections(prev => prev.map(section => ({ ...section, leads: (section.leads || []).filter(l => l.id !== lead.id) })))
      loadActivityData()
      setStatsRefreshKey(k => k + 1)
    } catch (error) { console.error('❌ Delete failed:', error); await loadBoard(false) }
  }

  const toggleSectionExpansion = (sectionId) => setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }))

  const getVisibleLeads = (section) => {
    const sorted = getSortedLeads(section)
    const isExpanded = expandedSections[section.id]
    return (isExpanded || sorted.length <= MAX_VISIBLE_LEADS) ? sorted : sorted.slice(0, MAX_VISIBLE_LEADS)
  }

  // Search bar is now inline in the toolbar — renderSearchBar removed

  // ========================================
  // RENDER: LEAD CARD WRAPPER — PRESERVED
  // ========================================
  const renderLeadCard = (lead, section) => {
    const isThisSnooze = isSnoozeSectionById(section.id)
    const qualScore = [lead.qual_goal_checked, lead.qual_pain_checked, lead.qual_urgency_checked, lead.qual_open_checked].filter(Boolean).length
    const isCallReady = qualScore >= 3
    let cardShadow = 'none'
    if (highlightedLeadId === lead.id) cardShadow = `0 0 0 2px ${section.color}, 0 0 15px ${section.color}40`
    else if (isCallReady) cardShadow = '0 0 0 1px #D4AF37'
    
    return (
      <div key={lead.id} ref={(el) => { leadRefs.current[lead.id] = el }} style={{ transition: 'all 0.2s ease', borderRadius: isMobile ? '10px' : '12px', boxShadow: cardShadow }}>
        <KanbanCard
          lead={lead} sectionColor={section.color} isMobile={isMobile}
          onDragStart={(e) => onLeadDragStart(e, lead, section.id)}
          onEdit={(updates) => handleLeadEdit(lead, section, updates)}
          onDelete={() => handleLeadDelete(lead)}
          onSnooze={snoozeSection && !isThisSnooze ? handleSnoozeLead : null}
          sections={sections} currentSectionId={section.id}
          onMoveToSection={(targetSectionId) => handleMoveLeadToSection(lead, section.id, targetSectionId)}
          sectionTitle={section.title}
          onSalesCallClick={(lead) => setSalesCallLead(lead)}
          coachId={coachId} db={db} onRefresh={loadBoard}
          onMagnetAttached={handleMagnetAttachedForLead}
        />
      </div>
    )
  }

  // ========================================
  // RENDER: KANBAN COLUMNS — STYLING UPGRADED
  // ========================================
  const renderKanbanColumns = (isFullscreenView = false) => {
    const colW = isFullscreenView ? (isMobile ? '300px' : '350px') : (isMobile ? '280px' : '320px')
    return (
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.75rem', WebkitOverflowScrolling: 'touch' }}>
        {sections.map((section) => {
          const isExpanded = expandedSections[section.id]
          // De teller toont het aantal leads dat de actieve filter doorstaat
          // (bv. "hoeveel met x opvolg"). Zonder filter = gewoon alle leads.
          const sortedLeads = getSortedLeads(section)
          const totalLeads = sortedLeads.length
          const visibleLeads = (isExpanded || totalLeads <= MAX_VISIBLE_LEADS) ? sortedLeads : sortedLeads.slice(0, MAX_VISIBLE_LEADS)
          const hasMore = totalLeads > MAX_VISIBLE_LEADS
          const isUnassigned = section.id === 'unassigned'
          const reIdx = getReorderableSections().findIndex(s => s.id === section.id)
          const canLeft = !isUnassigned && reIdx > 0
          const canRight = !isUnassigned && reIdx < getReorderableSections().length - 1
          const isBeingDragged = draggedSection?.id === section.id
          const isSectionDrop = dragOverForSection === section.id
          const isLeadDrop = dragOverSectionId === section.id
          const isThisSnooze = isSnoozeSectionById(section.id)
          const contactedCount = getContactedTodayCount(section)

          return (
            <div key={section.id}
              onDragOver={(e) => onColumnDragOver(e, section)}
              onDragLeave={onColumnDragLeave}
              onDrop={(e) => onColumnDrop(e, section)}
              style={{
                minWidth: colW, maxWidth: colW,
                background: '#0a0a0a',
                border: isSectionDrop ? `2px dashed ${section.color}` : isLeadDrop ? `2px solid ${section.color}` : `1px solid rgba(255,255,255,0.06)`,
                borderRadius: isMobile ? '10px' : '12px',
                display: 'flex', flexDirection: 'column', flexShrink: 0,
                transition: 'all 0.2s ease',
                opacity: isBeingDragged ? 0.5 : 1,
                transform: 'translateZ(0)',
                overflow: 'hidden'
              }}
            >
              {/* Section Header — compact, flush */}
              <div style={{
                padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.75rem',
                borderBottom: `2px solid ${section.color}`,
                display: 'flex', alignItems: 'center', gap: '0.375rem'
              }}>
                {!isUnassigned && (
                  <div draggable onDragStart={(e) => onGripDragStart(e, section)} onDragEnd={onGripDragEnd}
                    style={{ color: 'rgba(255,255,255,0.2)', cursor: 'grab', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <GripVertical size={13} />
                  </div>
                )}
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                <h3 style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '700',
                  color: section.color, margin: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1, display: 'flex', alignItems: 'center', gap: '0.3rem'
                }}>
                  {section.title}
                  {isThisSnooze && <Clock size={11} style={{ opacity: 0.5 }} />}
                </h3>

                {/* Count */}
                <span style={{
                  fontSize: '0.6rem', fontWeight: '800', color: section.color, opacity: 0.8,
                  minWidth: '16px', textAlign: 'center'
                }}>
                  {totalLeads}
                </span>

                {/* Contacted today count */}
                {contactedCount > 0 && (
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '2px',
                    fontSize: '0.5rem', fontWeight: '700', color: '#9ca3af',
                    opacity: 0.6
                  }}>
                    <CheckCircle size={8} />{contactedCount}
                  </span>
                )}

                {/* Actions */}
                {!isUnassigned && (
                  <button onClick={() => { setSelectedSection(section); setShowSectionModal(true) }}
                    style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                    <Settings size={11} />
                  </button>
                )}
                <button onClick={() => { setSelectedSectionForLead(section.id); setShowAddLead(true) }}
                  style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${section.color}10`, border: `1px solid ${section.color}25`, borderRadius: '5px', color: section.color, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <Plus size={11} />
                </button>
              </div>

              {/* Reorder buttons — compact, only non-fullscreen */}
              {!isUnassigned && !isFullscreenView && (
                <div style={{
                  display: 'flex', gap: '0.25rem', justifyContent: 'center',
                  padding: '0.3rem 0.625rem',
                  borderBottom: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <button onClick={() => moveSection(section.id, 'left')} disabled={!canLeft}
                    style={{ padding: '0.2rem 0.4rem', background: 'transparent', border: `1px solid ${canLeft ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '4px', color: canLeft ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)', cursor: canLeft ? 'pointer' : 'not-allowed', fontSize: '0.55rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', minHeight: '24px', touchAction: 'manipulation' }}>
                    <ChevronLeft size={10} /> Links
                  </button>
                  <button onClick={() => moveSection(section.id, 'right')} disabled={!canRight}
                    style={{ padding: '0.2rem 0.4rem', background: 'transparent', border: `1px solid ${canRight ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '4px', color: canRight ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)', cursor: canRight ? 'pointer' : 'not-allowed', fontSize: '0.55rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px', minHeight: '24px', touchAction: 'manipulation' }}>
                    Rechts <ChevronRight size={10} />
                  </button>
                </div>
              )}

              {/* Leads */}
              <div style={{
                padding: '0.5rem', flex: 1, overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: '0.5rem',
                minHeight: isFullscreenView ? '300px' : '200px',
                maxHeight: isExpanded ? 'none' : (isFullscreenView ? '500px' : '600px')
              }}>
                {totalLeads === 0 ? (
                  <div style={{ padding: '1.5rem 0.75rem', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem' }}>Geen leads</div>
                ) : (
                  <>
                    {visibleLeads.map(lead => renderLeadCard(lead, section))}
                    {hasMore && (
                      <button onClick={() => toggleSectionExpansion(section.id)}
                        style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: section.color, cursor: 'pointer', fontSize: '0.7rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', minHeight: '32px', touchAction: 'manipulation' }}>
                        {isExpanded ? <><ChevronUp size={13} /> Minder</> : <><ChevronDown size={13} /> +{totalLeads - MAX_VISIBLE_LEADS} meer</>}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ========================================
  // LOADING
  // ========================================
  if (loading) {
    return (
      <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '2px solid rgba(255,255,255,0.06)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'kbSpin 0.8s linear infinite' }} />
      </div>
    )
  }

  const showSaveBar = hasUnsavedChanges()

  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <div style={{ transform: 'translateZ(0)' }}>

      {viewMode === 'warmup' ? (
        <>
          {/* Minimal back-to-leads */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
            <button onClick={() => { setViewMode('leads'); setStaleCheckDone(false) }}
              style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.6rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '28px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Users size={10} /> Leads
            </button>
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#E1306C' }}>Warm-Up</span>
          </div>
          <WarmUpBoard leadService={leadService} coachId={coachId} isMobile={isMobile} sections={sections} />
        </>
      ) : (
        <div>
          <PeriodStatsBar leadService={leadService} coachId={coachId} isMobile={isMobile} refreshKey={statsRefreshKey} />

          {/* Bord-acties (meal-card knopstijl: flat, icon+label, dunne dividers). */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0.4rem 0 0.3rem', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'stretch', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
              <button onClick={() => setViewMode('warmup')} title="Warm-Up Board"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.85rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', minHeight: 32, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Instagram size={14} /> Warm-Up
              </button>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
              <button onClick={() => { setSelectedSection(null); setShowSectionModal(true) }} title="Nieuwe sectie toevoegen"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem 0.85rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', minHeight: 32, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                <Plus size={14} /> Sectie
              </button>
            </div>
            <button onClick={() => setIsFullscreen(true)} title="Volledig scherm"
              style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Spacer: houdt de plek vast nu de toolbar fixed zweeft. */}
          <div style={{ height: isMobile ? 46 : 42, flexShrink: 0 }} />
          {/* ═══ ONE TOOLBAR ROW: Search + Warm-Up + Fullscreen + Sectie ═══
              Zweeft vast in beeld (fixed) en is sleepbaar via de grip, zodat de
              zoekbalk altijd bereikbaar is en je 'm kunt verplaatsen. */}
          {createPortal(
          <div ref={toolbarRef} style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            position: 'fixed', zIndex: 320,
            ...(searchBarPos
              ? { top: searchBarPos.top, left: searchBarPos.left, width: 'min(94vw, 480px)' }
              : { top: isMobile ? 6 : 8, left: '50%', transform: 'translateX(-50%)', width: 'min(94vw, 480px)' }),
            background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(8px)',
            padding: '0.35rem', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
          }}>
            {/* Sleep-grip */}
            <div onPointerDown={startSearchDrag} onTouchStart={startSearchDrag}
              title="Sleep om de zoekbalk te verplaatsen"
              style={{ flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 0.05rem', cursor: 'grab', touchAction: 'none', color: 'rgba(255,215,0,0.7)' }}>
              <GripVertical size={18} />
            </div>
            {/* Search */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: isMobile ? '0.3rem 0.5rem' : '0.35rem 0.625rem',
              background: 'rgba(255,255,255,0.03)',
              border: showSearchResults && searchResults.length > 0 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', transition: 'all 0.2s ease', minHeight: '28px'
            }}>
              <Search size={12} color={searchQuery ? '#10b981' : 'rgba(255,255,255,0.2)'} style={{ flexShrink: 0 }} />
              <input ref={searchInputRef} type="text" value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                placeholder={isMobile ? 'Zoek lead...' : 'Zoek op naam, Instagram, email...'}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: isMobile ? '0.7rem' : '0.75rem', minWidth: 0 }} />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false) }} style={{ padding: '2px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '3px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Hot-leads toggle (icon-only) */}
            <button
              onClick={() => setGlobalHotOnly(v => !v)}
              title={globalHotOnly ? 'Toon alle leads weer' : 'Toon alleen hot leads (overal)'}
              style={{
                width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: globalHotOnly ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${globalHotOnly ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, color: globalHotOnly ? '#f87171' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Flame size={16} />
            </button>

            {/* Call-voorgesteld toggle (icon-only) */}
            <button
              onClick={() => setGlobalCallProposedOnly(v => !v)}
              title={globalCallProposedOnly ? 'Toon alle leads weer' : 'Toon alleen leads waar al een call voorgesteld is'}
              style={{
                width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: globalCallProposedOnly ? 'rgba(212,175,55,0.18)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${globalCallProposedOnly ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, color: globalCallProposedOnly ? '#D4AF37' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Phone size={16} />
            </button>

            {/* Overkoepelende filter voor het HELE bord — Type, Temperatuur,
                Opvolg-aantal en Sortering, in alle secties tegelijk. */}
            {(() => {
              const counts = [...new Set(sections.flatMap(s => (s.leads || []).map(l => Number(l.followup_count) || 0)))].sort((a, b) => a - b)
              const hasFilter = boardFilter.sort !== 'default' || boardFilter.types.size > 0 || boardFilter.temps.size > 0 || boardFilter.followups.size > 0
              const filterCount = boardFilter.types.size + boardFilter.temps.size + boardFilter.followups.size + (boardFilter.sort !== 'default' ? 1 : 0)
              const GOLD = '#FFD700'
              return (
                <div style={{ position: 'relative', flexShrink: 0 }} ref={boardFilterRef}>
                  <button
                    onClick={() => setShowBoardFilter(v => !v)}
                    title="Filter & sorteer alle leads (hele bord)"
                    style={{
                      position: 'relative',
                      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: hasFilter ? 'rgba(255,215,0,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${hasFilter ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 8,
                      color: hasFilter ? GOLD : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <SlidersHorizontal size={16} />
                    {filterCount > 0 && (
                      <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 15, height: 15, background: GOLD, color: '#000', borderRadius: 8, padding: '0 3px', fontSize: '0.55rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{filterCount}</span>
                    )}
                  </button>
                  {showBoardFilter && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 0.3rem)', left: 0,
                      zIndex: 200, minWidth: 230,
                      background: '#111', border: '1px solid rgba(255,215,0,0.3)',
                      borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    }}>
                      {/* Type-filter */}
                      <div style={{ padding: '0.5rem 0.65rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Type lead</div>
                        {[{ id: 'magnet', label: 'Lead-magnet' }, { id: 'outreach', label: 'Zelf bericht' }].map(opt => {
                          const active = boardFilter.types.has(opt.id)
                          return (
                            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.1rem', cursor: 'pointer', color: active ? GOLD : 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: active ? 700 : 500 }}>
                              <input type="checkbox" checked={active} onChange={() => toggleBoardSet('types', opt.id)} style={{ accentColor: GOLD, width: 14, height: 14 }} />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>

                      {/* Temperatuur-filter */}
                      <div style={{ padding: '0.5rem 0.65rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Temperatuur</div>
                        {[{ id: 'hot', label: '🔥 Hot' }, { id: 'warm', label: '🌤 Warm' }, { id: 'cold', label: '❄️ Cold' }, { id: 'none', label: '— Geen' }].map(opt => {
                          const active = boardFilter.temps.has(opt.id)
                          return (
                            <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.1rem', cursor: 'pointer', color: active ? GOLD : 'rgba(255,255,255,0.65)', fontSize: '0.72rem', fontWeight: active ? 700 : 500 }}>
                              <input type="checkbox" checked={active} onChange={() => toggleBoardSet('temps', opt.id)} style={{ accentColor: GOLD, width: 14, height: 14 }} />
                              {opt.label}
                            </label>
                          )
                        })}
                      </div>

                      {/* Opvolg-berichten filter */}
                      {counts.length > 0 && (
                        <div style={{ padding: '0.5rem 0.65rem 0.4rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Opvolg-berichten</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {counts.map(n => {
                              const active = boardFilter.followups.has(n)
                              return (
                                <button key={n} onClick={() => toggleBoardSet('followups', n)}
                                  style={{ padding: '0.25rem 0.5rem', background: active ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.08)'}`, borderRadius: '5px', color: active ? GOLD : 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: active ? 800 : 600, cursor: 'pointer', minHeight: 26, touchAction: 'manipulation' }}>
                                  {n}×
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sorteer */}
                      <div style={{ padding: '0.4rem 0' }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '0 0.65rem 0.2rem' }}>Sorteer</div>
                        {SECTION_SORT_OPTIONS.map(opt => {
                          const active = (boardFilter.sort || 'default') === opt.id
                          return (
                            <button key={opt.id} onClick={() => setBoardSort(opt.id)}
                              style={{ display: 'block', width: '100%', padding: '0.4rem 0.65rem', background: active ? 'rgba(255,215,0,0.12)' : 'transparent', border: 'none', color: active ? GOLD : 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: active ? 700 : 500, textAlign: 'left', cursor: 'pointer', minHeight: 30 }}>
                              {opt.label}
                            </button>
                          )
                        })}
                      </div>

                      {hasFilter && (
                        <button onClick={() => { resetBoardFilter(); setShowBoardFilter(false) }}
                          style={{ display: 'block', width: '100%', padding: '0.5rem 0.65rem', background: 'rgba(239,68,68,0.06)', border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#fca5a5', fontSize: '0.65rem', fontWeight: 700, textAlign: 'center', cursor: 'pointer' }}>
                          Reset filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Mijn berichten (icon-only) */}
            <button onClick={() => setShowOutreachLogger(true)}
              title="Bekijk je berichten en log hoeveel je vandaag verstuurde"
              style={{
                width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(225,48,108,0.14)', border: '1px solid rgba(225,48,108,0.4)',
                borderRadius: 8, color: '#E1306C', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
              <Send size={16} />
            </button>
          </div>, document.body)}

          {/* Search results dropdown */}
          {showSearchResults && createPortal((
            <>
              <div onClick={() => setShowSearchResults(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} />
              {searchResults.length > 0 ? (
                <div style={{ position: 'fixed', zIndex: 1000, top: (searchBarPos ? searchBarPos.top : (isMobile ? 6 : 8)) + (isMobile ? 52 : 50), left: searchBarPos ? searchBarPos.left : '50%', transform: searchBarPos ? 'none' : 'translateX(-50%)', width: 'min(94vw, 640px)' }}>
                  <div style={{ background: '#111', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: '60vh', overflowY: 'auto' }}>
                    <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.62rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {searchResults.length} RESULTATEN
                    </div>
                    {searchResults.map(lead => (
                      <button key={lead.id} onClick={() => scrollToLead(lead.id, lead.sectionId)} style={{ width: '100%', padding: '0.75rem 0.85rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', textAlign: 'left', minHeight: 52 }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16,185,129,0.06)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: '800', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>{lead.first_name} {lead.last_name}</div>
                          {lead.instagram_handle && <span style={{ fontSize: '0.7rem', color: '#E1306C', fontWeight: 600 }}>@{lead.instagram_handle}</span>}
                        </div>
                        <span style={{ padding: '3px 8px', background: `${lead.sectionColor}12`, border: `1px solid ${lead.sectionColor}25`, borderRadius: '5px', fontSize: '0.62rem', fontWeight: '700', color: lead.sectionColor, whiteSpace: 'nowrap', flexShrink: 0 }}>{lead.sectionTitle?.substring(0, 14)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchQuery && (() => {
                const quickSection = findInstagramConversationSection()
                const q = searchQuery.trim()
                const display = q.startsWith('@') ? q : `"${q}"`
                return (
                  <div style={{ position: 'fixed', zIndex: 1000, top: (searchBarPos ? searchBarPos.top : (isMobile ? 6 : 8)) + (isMobile ? 52 : 50), left: searchBarPos ? searchBarPos.left : '50%', transform: searchBarPos ? 'none' : 'translateX(-50%)', width: 'min(94vw, 640px)' }}>
                    <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ padding: '0.45rem 0.625rem', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Search size={10} />
                        {dbCheckLoading
                          ? <>Zoeken in database…</>
                          : <>Geen lead gevonden voor {display}</>
                        }
                      </div>

                      {/* Server-side hits — existing leads that weren't in the local board. */}
                      {dbCheckResults.length > 0 && (
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(245,158,11,0.04)' }}>
                          <div style={{ padding: '0.4rem 0.625rem 0.2rem', fontSize: '0.5rem', fontWeight: '800', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Bestaat al — open in plaats van toevoegen
                          </div>
                          {dbCheckResults.map(existing => (
                            <button
                              key={existing.id}
                              onClick={() => handlePlaceExistingLead(existing)}
                              style={{
                                width: '100%',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.45rem 0.625rem',
                                background: 'transparent',
                                border: 'none',
                                borderTop: '1px solid rgba(255,255,255,0.03)',
                                color: '#fff', cursor: 'pointer', textAlign: 'left',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                minHeight: '38px',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {[existing.first_name, existing.last_name].filter(Boolean).join(' ') || 'Naamloze lead'}
                                </div>
                                <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem', fontWeight: '600' }}>
                                  {existing.lead_source ? `${existing.lead_source} · ` : ''}{existing.sectionTitle}
                                </div>
                              </div>
                              <span style={{ padding: '2px 6px', background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '3px', fontSize: '0.5rem', fontWeight: '700', color: '#f59e0b', whiteSpace: 'nowrap' }}>
                                → {quickSection?.title || 'plaats'}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Always-available create-new button */}
                      <button
                        onClick={handleQuickAddFromSearch}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.55rem 0.625rem',
                          background: 'rgba(225,48,108,0.08)',
                          border: 'none',
                          borderLeft: '3px solid #E1306C',
                          color: '#fff', cursor: 'pointer', textAlign: 'left',
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          minHeight: '40px',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(225,48,108,0.14)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(225,48,108,0.08)'}
                      >
                        <div style={{
                          width: '22px', height: '22px', borderRadius: '5px',
                          background: '#E1306C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Plus size={13} color="#fff" strokeWidth={2.8} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.01em' }}>
                            {dbCheckResults.length > 0 ? `Toch nieuwe lead aanmaken (${display})` : `Voeg ${display} toe als nieuwe lead`}
                          </div>
                          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.15rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                            <span>Instagram · {quickSection?.title || 'eerste sectie'}</span>
                            {activeCampaignName && (
                              <span style={{ padding: '1px 5px', background: 'rgba(225,48,108,0.18)', color: '#E1306C', borderRadius: '3px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.48rem' }}>
                                ⮕ {activeCampaignName}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )
              })()}
            </>
          ), document.body)}

          {/* Inline notifications — ultra compact, borderLeft only */}
          {staleCheckResult && staleCheckResult.moved > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.625rem', marginBottom: '0.375rem', borderLeft: '3px solid #fbbf24' }}>
              <Clock size={10} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.55rem' }}>{staleCheckResult.moved} verplaatst</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.45rem' }}>geen activiteit</span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setStaleCheckResult(null)} style={{ padding: '1px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation' }}><X size={9} /></button>
            </div>
          )}

          {!snoozeSection && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.625rem', marginBottom: '0.375rem', borderLeft: '3px solid #3b82f6' }}>
              <Clock size={9} color="#3b82f6" style={{ flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.5rem' }}>Maak "Later Follow Up" sectie voor ⏰</span>
            </div>
          )}

          {/* Save bar — minimal inline */}
          {showSaveBar && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.625rem', marginBottom: '0.375rem', borderLeft: '3px solid #fbbf24' }}>
              <span style={{ color: '#fbbf24', fontSize: '0.55rem', fontWeight: '600' }}>Wijzigingen</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button onClick={handleReset} disabled={saving} style={{ padding: '0.2rem 0.35rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.5rem', minHeight: '22px', touchAction: 'manipulation' }}>Reset</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '0.2rem 0.4rem', background: saving ? 'rgba(16,185,129,0.3)' : '#10b981', border: 'none', borderRadius: '4px', color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.5rem', fontWeight: '700', minHeight: '22px', touchAction: 'manipulation' }}>{saving ? '...' : 'Opslaan'}</button>
              </div>
            </div>
          )}


          {renderKanbanColumns(false)}

          {showAddLead && <AddLeadModal isMobile={isMobile} onClose={() => { setShowAddLead(false); setSelectedSectionForLead(null) }} onSubmit={handleAddLead} />}
          {showRapidAdd && (
            <RapidAddLeadsModal
              isOpen={showRapidAdd}
              onClose={() => setShowRapidAdd(false)}
              isMobile={isMobile}
              leadService={leadService}
              db={db || leadService?.db}
              coachId={coachId}
              campaigns={campaigns}
              instaSectionId={findInstagramConversationSection()?.id || sections.find(s => s.id !== 'unassigned')?.id}
              magnetsSectionId={findLeadMagnetsSection()?.id || findInstagramConversationSection()?.id || sections.find(s => s.id !== 'unassigned')?.id}
              existingNames={getExistingLeadNames()}
              onAdded={handleRapidAdded}
              onRemoved={handleRapidRemoved}
            />
          )}
          {showSectionModal && <SectionModal isMobile={isMobile} section={selectedSection} onClose={() => { setShowSectionModal(false); setSelectedSection(null) }} onSubmit={selectedSection ? (u) => handleUpdateSection(selectedSection.id, u) : handleCreateSection} onDelete={selectedSection ? () => handleDeleteSection(selectedSection.id) : null} />}
        </div>
      )}

      {/* ═══ SCROLL TO TOP — compact ═══ */}
      {showScrollTop && createPortal(
        <button onClick={scrollToTop}
          style={{
            position: 'fixed', bottom: isMobile ? '96px' : '32px',
            left: '50%', transform: 'translateX(-50%)',
            padding: isMobile ? '0.85rem 1.5rem' : '0.8rem 1.6rem',
            background: 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)', border: 'none', borderRadius: '999px',
            color: '#0a0a0a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
            fontSize: isMobile ? '0.9rem' : '0.85rem', fontWeight: '800',
            boxShadow: '0 6px 20px rgba(255,215,0,0.4), 0 2px 6px rgba(0,0,0,0.4)',
            zIndex: 99999, minHeight: isMobile ? '52px' : '46px',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            animation: 'kbFadeUp 0.2s ease'
          }}>
          <ArrowUp size={isMobile ? 20 : 18} strokeWidth={2.6} /> Naar boven
        </button>,
        document.body
      )}

      {/* ═══ FULLSCREEN — clean, no gradients ═══ */}
      {isFullscreen && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, background: '#000', display: 'flex', flexDirection: 'column', animation: 'kbFadeIn 0.2s ease' }}>
          {/* Fullscreen header — compact */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
              <h1 style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '800', color: '#fff', margin: 0 }}>Lead Board</h1>
              <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>FULLSCREEN</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              {!isMobile && (
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <kbd style={{ padding: '1px 4px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', fontSize: '0.55rem', fontFamily: 'monospace' }}>ESC</kbd>
                </span>
              )}
              <button onClick={() => setIsFullscreen(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', touchAction: 'manipulation' }}>
                <Minimize2 size={14} />
              </button>
              <button onClick={() => setIsFullscreen(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', touchAction: 'manipulation' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Fullscreen content */}
          <div ref={fullscreenContentRef} style={{ flex: 1, overflow: 'auto', padding: isMobile ? '0.5rem' : '0.75rem' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', gap: '0.25rem', padding: '0.375rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '0.75rem' }}>
              <button onClick={() => { setViewMode('leads'); setStaleCheckDone(false) }}
                style={{ flex: 1, padding: '0.4rem', background: viewMode === 'leads' ? '#10b981' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'leads' ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: '700', minHeight: '32px', touchAction: 'manipulation' }}>
                <Users size={13} /> Leads
              </button>
              <button onClick={() => setViewMode('warmup')}
                style={{ flex: 1, padding: '0.4rem', background: viewMode === 'warmup' ? '#E1306C' : 'transparent', border: 'none', borderRadius: '6px', color: viewMode === 'warmup' ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.7rem', fontWeight: '700', minHeight: '32px', touchAction: 'manipulation' }}>
                <Instagram size={13} /> Warm-Up
              </button>
            </div>

            {viewMode === 'warmup' ? (
              <WarmUpBoard leadService={leadService} coachId={coachId} isMobile={isMobile} sections={sections} />
            ) : (
              <>
                <PeriodStatsBar leadService={leadService} coachId={coachId} isMobile={isMobile} refreshKey={statsRefreshKey} />
                {/* Fullscreen toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', minHeight: '28px' }}>
                    <Search size={12} color={searchQuery ? '#10b981' : 'rgba(255,255,255,0.2)'} />
                    <input ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)} onFocus={() => searchQuery && setShowSearchResults(true)} placeholder="Zoek lead..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.7rem', minWidth: 0 }} />
                    {searchQuery && <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchResults(false) }} style={{ padding: '2px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '3px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={10} /></button>}
                  </div>
                  <button onClick={() => { setSelectedSection(null); setShowSectionModal(true) }}
                    style={{ padding: '0 0.5rem', height: '28px', background: '#10b981', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.6rem', fontWeight: '700', touchAction: 'manipulation', flexShrink: 0 }}>
                    <Plus size={10} /> Sectie
                  </button>
                </div>
                {renderKanbanColumns(true)}
              </>
            )}
          </div>

          {showAddLead && <AddLeadModal isMobile={isMobile} onClose={() => { setShowAddLead(false); setSelectedSectionForLead(null) }} onSubmit={handleAddLead} />}
          {showRapidAdd && (
            <RapidAddLeadsModal
              isOpen={showRapidAdd}
              onClose={() => setShowRapidAdd(false)}
              isMobile={isMobile}
              leadService={leadService}
              db={db || leadService?.db}
              coachId={coachId}
              campaigns={campaigns}
              instaSectionId={findInstagramConversationSection()?.id || sections.find(s => s.id !== 'unassigned')?.id}
              magnetsSectionId={findLeadMagnetsSection()?.id || findInstagramConversationSection()?.id || sections.find(s => s.id !== 'unassigned')?.id}
              existingNames={getExistingLeadNames()}
              onAdded={handleRapidAdded}
              onRemoved={handleRapidRemoved}
            />
          )}
          {showSectionModal && <SectionModal isMobile={isMobile} section={selectedSection} onClose={() => { setShowSectionModal(false); setSelectedSection(null) }} onSubmit={selectedSection ? (u) => handleUpdateSection(selectedSection.id, u) : handleCreateSection} onDelete={selectedSection ? () => handleDeleteSection(selectedSection.id) : null} />}
        </div>,
        document.body
      )}

      {salesCallLead && (
        <SalesCallModal
          lead={salesCallLead}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setSalesCallLead(null)}
          onLeadUpdate={async () => {
            setSalesCallLead(null)
            await loadBoard(false)
          }}
        />
      )}

      {/* Outreach logger — daily DM counts per campaign */}
      {showOutreachLogger && (
        <OutreachLoggerModal
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowOutreachLogger(false)}
        />
      )}

      {/* Auto-prompt: after a new lead is created, ask which source it
          came from (campaign vs lead magnet) so weekly metrics are accurate. */}
      <LeadSourceModal
        isOpen={!!leadForSource}
        onClose={() => setLeadForSource(null)}
        lead={leadForSource}
        db={leadService.db}
        coachId={coachId}
        onAttributed={handleSourceAttributed}
      />

      {/* Auto-prompt: log the exact message after dropping a lead into a
          "Call voorgesteld" section, so the stats modal can later show
          which proposal-wording actually converts. */}
      <CallProposalModal
        isOpen={!!leadForProposal}
        onClose={() => setLeadForProposal(null)}
        lead={leadForProposal}
        db={leadService.db}
        coachId={coachId}
        isMobile={isMobile}
      />

      {/* Drop-triggered magnet picker — opens after dragging a lead into the
          Lead-magnets section so the coach can immediately tag a magnet. */}
      {magnetPickerLead && (
        <LeadDetailModalV2
          lead={magnetPickerLead.lead}
          sectionColor={magnetPickerLead.sectionColor || '#6366f1'}
          isMobile={isMobile}
          initialTab="magnets"
          onClose={() => setMagnetPickerLead(null)}
          onEdit={(updates) => handleLeadEdit(magnetPickerLead.lead, { id: 'unknown' }, updates)}
          onDelete={async () => { await handleLeadDelete(magnetPickerLead.lead); setMagnetPickerLead(null) }}
          // Already in lead-magnets section (we just dropped them) so no
          // auto-move needed.
          onMagnetAttached={null}
        />
      )}

      <style>{`
        @keyframes kbSpin { to { transform: rotate(360deg); } }
        @keyframes kbFadeUp { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes kbFadeIn { from { opacity: 0; } to { opacity: 1; } }
        div::-webkit-scrollbar { width: 4px; height: 4px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 2px; }
      `}</style>
    </div>
  )
}
