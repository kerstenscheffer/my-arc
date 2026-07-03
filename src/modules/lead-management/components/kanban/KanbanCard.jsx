// src/modules/lead-management/components/kanban/KanbanCard.jsx
// VERSION 7.0 - CRM UPGRADE + STYLING GUIDE COMPLIANT
// PRESERVED: All v6.2 logic (real-time sync, immediate UI, DM modal, snooze, drag, reply counter)
// NEW: Info panel (struggle/goal/magnets/temp), conversation button, lead magnet tags, better styling
// STYLING: Flush rows, borderBottom dividers, no gradient backgrounds, compact data-driven

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  MessageCircle, Plus, Minus,
  ArrowLeftCircle, Clock, CheckCircle, Circle, Flame,
  Info, FileText, Send, Gift, FolderInput, ChevronDown, Trash2,
} from 'lucide-react'
import DMConversationModal from "../../../dm-conversation/components/DMConversationModal"
import LeadDetailModalV2 from "./LeadDetailModalV2"

// ============================================
// CRM CONFIG
// ============================================
const LEAD_MAGNET_OPTIONS = [
  'Gratis E-book',
  'Eiwitten PDF',
  'Calorie Calculator',
  'Workout Plan',
  'Meal Prep Guide',
  'Macro Cheatsheet',
  'Supplement Guide',
  'Grocery List'
]

const TEMP_CONFIG = {
  cold: { label: 'KOUD', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
  warm: { label: 'WARM', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  hot:  { label: 'HOT',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' }
}

export default function KanbanCard({
  lead,
  sectionColor,
  isMobile,
  onDragStart,
  onEdit,
  onDelete,
  onSnooze,
  onClick,
  sections = [],
  currentSectionId,
  onMoveToSection,
  coachId,
  db,
  onRefresh,
  sectionTitle = '',
  onSalesCallClick,
  onMagnetAttached,
}) {
  const [showReturnDropdown, setShowReturnDropdown] = useState(false)
  const [showMoveDropdown, setShowMoveDropdown] = useState(false)
  const [movePos, setMovePos] = useState({ top: 0, left: 0 })
  const moveBtnRef = useRef(null)
  const moveMenuRef = useRef(null)
  const [returnPos, setReturnPos] = useState({ top: 0, left: 0 })
  const returnBtnRef = useRef(null)
  const returnMenuRef = useRef(null)
  const [showTempDropdown, setShowTempDropdown] = useState(false)
  const [tempPos, setTempPos] = useState({ top: 0, left: 0 })
  const tempBtnRef = useRef(null)
  const tempMenuRef = useRef(null)
  // Lokale temperatuur zodat een keuze meteen zichtbaar is (optimistisch),
  // ook al werkt de parent de lead-prop pas later bij.
  const [localTemp, setLocalTemp] = useState(lead.lead_temperature || 'cold')
  const [showDMModal, setShowDMModal] = useState(false)
  // Central tabbed lead-detail modal — primary path for "open this lead and
  // see/edit everything". Triggered by card click + by the explicit button.
  const [showDetail, setShowDetail] = useState(false)
  const dropdownRef = useRef(null)

  const [replyCount, setReplyCount] = useState(lead.reply_count || 0)
  const [updatingReply, setUpdatingReply] = useState(false)
  const [followupCount, setFollowupCount] = useState(lead.followup_count || 0)
  const [updatingFollowup, setUpdatingFollowup] = useState(false)
  // Brief "Gekopieerd!" feedback after click-to-copy on the name.
  const [nameCopied, setNameCopied] = useState(false)
  const [snoozingLead, setSnoozingLead] = useState(false)
  const [contactedToday, setContactedToday] = useState(false)
  const [updatingContacted, setUpdatingContacted] = useState(false)

  useEffect(() => {
    setReplyCount(lead.reply_count || 0)
  }, [lead.reply_count])
  useEffect(() => {
    setFollowupCount(lead.followup_count || 0)
  }, [lead.followup_count])
  useEffect(() => {
    setLocalTemp(lead.lead_temperature || 'cold')
  }, [lead.lead_temperature])

  // Close dropdowns on outside click
  // NOTE: magnet picker uses createPortal with its own backdrop, so NOT handled here
  // De return-dropdown is óók fixed-geportald (zoals de move-dropdown) zodat 'ie
  // niet onder de card valt — daarom checken we hier zowel de knop als het menu.
  useEffect(() => {
    if (!showReturnDropdown) return
    const handleClickOutside = (event) => {
      const inBtn = returnBtnRef.current && returnBtnRef.current.contains(event.target)
      const inMenu = returnMenuRef.current && returnMenuRef.current.contains(event.target)
      if (!inBtn && !inMenu) setShowReturnDropdown(false)
    }
    const closeOnScroll = (ev) => {
      if (returnMenuRef.current && returnMenuRef.current.contains(ev.target)) return
      setShowReturnDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [showReturnDropdown])

  useEffect(() => {
    if (!showMoveDropdown) return
    const handleClickOutside = (event) => {
      const inBtn = moveBtnRef.current && moveBtnRef.current.contains(event.target)
      const inMenu = moveMenuRef.current && moveMenuRef.current.contains(event.target)
      if (!inBtn && !inMenu) setShowMoveDropdown(false)
    }
    // Menu is fixed-positioned (portal). Sluit als de PAGINA/het bord eronder
    // scrollt (anders blijft 'ie los van de knop hangen), maar NIET als je in
    // het menu zelf scrollt — dat is de lange sectie-lijst.
    const closeOnScroll = (ev) => {
      if (moveMenuRef.current && moveMenuRef.current.contains(ev.target)) return
      setShowMoveDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [showMoveDropdown])

  // Temp-dropdown (cold/warm/hot) is óók fixed-geportald → zelfde sluit-logica.
  useEffect(() => {
    if (!showTempDropdown) return
    const handleClickOutside = (event) => {
      const inBtn = tempBtnRef.current && tempBtnRef.current.contains(event.target)
      const inMenu = tempMenuRef.current && tempMenuRef.current.contains(event.target)
      if (!inBtn && !inMenu) setShowTempDropdown(false)
    }
    const closeOnScroll = (ev) => {
      if (tempMenuRef.current && tempMenuRef.current.contains(ev.target)) return
      setShowTempDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [showTempDropdown])

  const openMoveDropdown = (e) => {
    e.stopPropagation()
    if (showMoveDropdown) { setShowMoveDropdown(false); return }
    const r = moveBtnRef.current?.getBoundingClientRect()
    if (r) setMovePos({ top: r.bottom + 4, left: r.left })
    setShowMoveDropdown(true)
  }

  const openReturnDropdown = (e) => {
    e.stopPropagation()
    if (showReturnDropdown) { setShowReturnDropdown(false); return }
    const r = returnBtnRef.current?.getBoundingClientRect()
    if (r) setReturnPos({ top: r.bottom + 4, left: r.left })
    setShowReturnDropdown(true)
  }

  useEffect(() => {
    if (lead.contacted_today_date) {
      const today = new Date().toISOString().split('T')[0]
      const contactedDate = lead.contacted_today_date.split('T')[0]
      setContactedToday(contactedDate === today)
    } else {
      setContactedToday(false)
    }
  }, [lead.contacted_today_date])

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const hasPreviousSection = lead.previous_section_id && lead.previous_section_title
  const previousSectionColor = lead.previous_section_color || '#6b7280'
  const previousSectionTitle = lead.previous_section_title || ''
  const isSnoozed = lead.is_snoozed || false
  // Elke lead toont standaard "cold" als er nog geen temperatuur gezet is —
  // zo is het één klik om iemand op warm/hot te zetten. We tonen de lokale
  // (optimistische) waarde zodat een keuze meteen zichtbaar is.
  const temp = localTemp
  const tempConfig = TEMP_CONFIG[temp] || TEMP_CONFIG.cold

  const qualScore = [
    lead.qual_goal_checked,
    lead.qual_pain_checked,
    lead.qual_urgency_checked,
    lead.qual_open_checked
  ].filter(Boolean).length
  const isCallReady = qualScore >= 3

  const getDaysSinceStale = () => {
    if (!lead.moved_to_stale_at) return null
    const movedDate = new Date(lead.moved_to_stale_at)
    const now = new Date()
    return Math.floor(Math.abs(now - movedDate) / (1000 * 60 * 60 * 24))
  }
  const daysSinceStale = getDaysSinceStale()

  // Dagen sinds laatste BEWUSTE actie van de coach (followup verstuurd of
  // 'vandaag gehad'-tap). Automatische section-moves (stale detection)
  // tellen NIET mee — de coach wil weten of zelf nog iets gedaan moet
  // worden. Bij geen actie ooit: val terug op lead.created_at zodat de
  // counter altijd zinvol gevuld is.
  const getDaysSinceLastAction = () => {
    const candidates = [lead.last_followup_sent_at, lead.contacted_today_date]
      .filter(Boolean)
      .map(v => new Date(v).getTime())
      .filter(t => !Number.isNaN(t))
    const ref = candidates.length > 0
      ? Math.max(...candidates)
      : (lead.created_at ? new Date(lead.created_at).getTime() : null)
    if (!ref) return null
    const days = Math.floor((Date.now() - ref) / (1000 * 60 * 60 * 24))
    return Math.max(0, days)
  }
  const daysSinceAction = getDaysSinceLastAction()
  // Kleur-codering: 0-2 groen, 3-6 amber, 7+ rood. Zo zie je in één oogopslag
  // welke leads stilstaan en opvolging nodig hebben.
  const actionColor = daysSinceAction == null
    ? 'rgba(255,255,255,0.3)'
    : daysSinceAction <= 2 ? '#10b981'
    : daysSinceAction <= 6 ? '#f59e0b'
    : '#ef4444'

  // ============================================
  // ✅ HANDLERS — ALL PRESERVED FROM v6.2
  // ============================================
  const handleContactedTodayToggle = async (e) => {
    e.stopPropagation()
    if (updatingContacted) return
    setUpdatingContacted(true)
    const newValue = !contactedToday
    const today = new Date().toISOString()
    setContactedToday(newValue)
    try {
      await onEdit({ contacted_today_date: newValue ? today : null })
    } catch (error) {
      setContactedToday(!newValue)
      console.error('Update contacted today failed:', error)
    } finally {
      setUpdatingContacted(false)
    }
  }

  const handleReplyChange = async (delta, e) => {
    e.stopPropagation()
    if (updatingReply) return
    if (delta < 0 && replyCount <= 0) return
    setUpdatingReply(true)
    const newCount = Math.max(0, replyCount + delta)
    setReplyCount(newCount)
    // Nieuwe regel: een reactie (+1) reset de opvolg-teller meteen naar 0.
    const prevFollowup = followupCount
    if (delta > 0) setFollowupCount(0)
    try {
      await onEdit({ reply_count: newCount })
    } catch (error) {
      setReplyCount(replyCount)
      if (delta > 0) setFollowupCount(prevFollowup)
      console.error('Update reply count failed:', error)
    } finally {
      setUpdatingReply(false)
    }
  }

  // Follow-up counter — same pattern as replies, but also stamps
  // last_followup_sent_at so the daily stats card can count "today" using
  // the stored timestamp instead of a separate events table.
  const handleFollowupChange = async (delta, e) => {
    e.stopPropagation()
    if (updatingFollowup) return
    if (delta < 0 && followupCount <= 0) return
    setUpdatingFollowup(true)
    const newCount = Math.max(0, followupCount + delta)
    setFollowupCount(newCount)
    try {
      const patch = { followup_count: newCount }
      if (delta > 0) patch.last_followup_sent_at = new Date().toISOString()
      await onEdit(patch)
    } catch (error) {
      setFollowupCount(followupCount)
      console.error('Update followup count failed:', error)
    } finally {
      setUpdatingFollowup(false)
    }
  }

  const handleSnooze = async (e) => {
    e.stopPropagation()
    if (snoozingLead || !onSnooze) return
    setSnoozingLead(true)
    try {
      await onSnooze(lead.id)
    } catch (error) {
      console.error('Snooze lead failed:', error)
    } finally {
      setSnoozingLead(false)
    }
  }

  const handleCardClick = (e) => {
    if (e.target.closest('button')) return
    if (e.target.closest('input')) return
    if (e.target.closest('textarea')) return
    if (e.target.closest('[data-no-click]')) return

    // Sales-section keeps its dedicated modal (different flow).
    const isSalesSection = sectionTitle?.toLowerCase().includes('sales')
    if (isSalesSection && onSalesCallClick) {
      onSalesCallClick(lead)
      return
    }

    // Default: open the tabbed detail modal — replaces the old inline
    // info-toggle. onClick prop still fired so external listeners survive.
    setShowDetail(true)
    if (onClick) onClick(lead)
  }

  const handleDMModalClose = () => setShowDMModal(false)

  const handleLeadUpdate = async () => {
    setShowDMModal(false)
    if (onRefresh) await onRefresh()
  }

  // Lead magnet toggle handler removed — magnets are now managed inside
  // LeadDetailModalV2 (Magnets tab).

  // ============================================
  // NEW: Quick temperature toggle
  // ============================================
  const openTempDropdown = (e) => {
    e.stopPropagation()
    if (showTempDropdown) { setShowTempDropdown(false); return }
    const r = tempBtnRef.current?.getBoundingClientRect()
    if (r) setTempPos({ top: r.bottom + 4, left: r.left })
    setShowTempDropdown(true)
  }

  const handleTempSelect = async (value, e) => {
    e.stopPropagation()
    setShowTempDropdown(false)
    if (value === localTemp) return
    const prev = localTemp
    setLocalTemp(value)  // direct zichtbaar
    try {
      await onEdit({ lead_temperature: value })
    } catch (error) {
      console.error('Update temp failed:', error)
      setLocalTemp(prev)  // terugdraaien als opslaan mislukt
    }
  }

  // Inline edit-mode + showInfo panel removed — all editing now flows
  // through LeadDetailModalV2 (opened by the "Open"-button or card click).

  // ============================================
  // MAIN CARD RENDER
  // ============================================
  return (
    <>
      <div
        // Op mobiel géén HTML5-drag: dat onderschept op iOS de touch op kleine
        // knoppen (zoals +1 reactie), waardoor die niet reageren. Slepen werkt
        // op touch toch niet — daar verplaats je via de "Verplaats"-dropdown.
        draggable={!isMobile}
        onDragStart={onDragStart}
        onClick={handleCardClick}
        style={{
          // Zachte, rustige kaart in de stijl van de meal-cards.
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.06)',
          // Gekleurd accent links = de sectie (goud als de lead call-ready is).
          borderLeft: `3px solid ${isCallReady ? '#D4AF37' : sectionColor}`,
          borderRadius: 12,
          overflow: 'hidden',
          opacity: contactedToday ? 0.6 : 1,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          transform: 'translateZ(0)'
        }}
      >
        {/* ═══ ROW 1: CHECKBOX + NAME + TEMP + ACTIONS ═══ */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.375rem',
          padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Contacted-today checkbox verwijderd — functie wordt niet meer
              gebruikt (op verzoek). */}

          {/* Name — click to copy to clipboard. Stops propagation so the
              card-click (open detail modal) doesn't fire. */}
          <span
            onClick={async (e) => {
              e.stopPropagation()
              const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
              if (!fullName) return
              try {
                await navigator.clipboard.writeText(fullName)
              } catch {
                // Older Safari / insecure context fallback
                const ta = document.createElement('textarea')
                ta.value = fullName
                ta.style.position = 'fixed'; ta.style.opacity = '0'
                document.body.appendChild(ta)
                ta.select()
                try { document.execCommand('copy') } catch {}
                document.body.removeChild(ta)
              }
              setNameCopied(true)
              setTimeout(() => setNameCopied(false), 1100)
            }}
            title="Klik om naam te kopiëren"
            style={{
              flex: 1, position: 'relative',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: '700',
              color: nameCopied
                ? '#10b981'
                : (contactedToday ? '#9ca3af' : (isCallReady ? '#FFD700' : '#fff')),
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              lineHeight: 1,
              cursor: 'pointer',
              borderBottom: '1px dotted rgba(255,255,255,0.18)',
              transition: 'color 0.15s ease',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}
          >
            {lead.first_name} {lead.last_name}
            {nameCopied && (
              <span style={{
                position: 'absolute',
                left: '50%', top: '100%', transform: 'translate(-50%, 4px)',
                background: '#10b981', color: '#fff',
                fontSize: '0.55rem', fontWeight: 800,
                padding: '2px 6px', borderRadius: 3,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                zIndex: 10,
              }}>
                Gekopieerd
              </span>
            )}
          </span>

          {/* Temperatuur-dropdown (cold/warm/hot) — standaard cold; één klik om
              op warm/hot te zetten. Fixed-geportald zodat 'ie niet onder de
              card valt. */}
          <button
            ref={tempBtnRef}
            data-no-click
            onClick={openTempDropdown}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '2px',
              padding: '1px 4px 1px 5px',
              background: tempConfig.bg,
              border: `1px solid ${tempConfig.border}`,
              borderRadius: '3px',
              fontSize: '0.45rem',
              fontWeight: '700',
              color: tempConfig.color,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              lineHeight: 1.4
            }}
          >
            {tempConfig.label}
            <ChevronDown size={8} style={{ flexShrink: 0, opacity: 0.7 }} />
          </button>
          {showTempDropdown && createPortal(
            <div
              ref={tempMenuRef}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', top: tempPos.top, left: tempPos.left, background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', zIndex: 2147483600, minWidth: '110px', overflow: 'hidden' }}
            >
              {['cold', 'warm', 'hot'].map(key => {
                const cfg = TEMP_CONFIG[key]
                const active = key === temp
                return (
                  <div
                    key={key}
                    onClick={(e) => handleTempSelect(key, e)}
                    style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.7rem', fontWeight: 700, color: active ? cfg.color : 'rgba(255,255,255,0.8)', background: active ? cfg.bg : 'transparent' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = cfg.bg}
                    onMouseLeave={(e) => e.currentTarget.style.background = active ? cfg.bg : 'transparent'}
                  >
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                    {cfg.label}
                    {active && <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: cfg.color }}>✓</span>}
                  </div>
                )
              })}
            </div>,
            document.body
          )}

          {/* Tweede dag-teller ("{n}d", sinds stale-move) verwijderd — alleen de
              "dagen stil"-stat hieronder blijft (op verzoek). */}

          {/* Dagen stil — sinds laatste bewuste actie van de coach (followup
              verstuurd of contact). Dit is de zichtbare "dagen stil"-stat. */}
          {daysSinceAction !== null && (
            <span
              title={`${daysSinceAction} dag${daysSinceAction === 1 ? '' : 'en'} stil`}
              style={{
                padding: '1px 5px',
                background: `${actionColor}1f`,
                border: `1px solid ${actionColor}55`,
                borderRadius: '3px',
                fontSize: '0.5rem',
                fontWeight: '700',
                color: actionColor,
              }}
            >
              {daysSinceAction === 0 ? 'vandaag' : `${daysSinceAction}d stil`}
            </span>
          )}

          {/* Call ready badge */}
          {isCallReady && !contactedToday && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              padding: '1px 5px',
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.35)',
              borderRadius: '3px'
            }}>
              <Flame size={9} color="#D4AF37" />
              <span style={{ fontSize: '0.45rem', fontWeight: '700', color: '#D4AF37', letterSpacing: '0.04em' }}>CALL</span>
            </span>
          )}

          {/* Snoozed badge */}
          {isSnoozed && !isCallReady && !contactedToday && (
            <Clock size={11} color="#fbbf24" style={{ opacity: 0.6, flexShrink: 0 }} />
          )}

          {/* Sales call badge */}
          {sectionTitle?.toLowerCase().includes('sales') && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '2px',
              padding: '1px 5px',
              background: 'rgba(255,215,0,0.08)',
              border: '1px solid rgba(255,215,0,0.25)',
              borderRadius: '3px'
            }}>
              <span style={{ fontSize: '0.45rem', fontWeight: '700', color: '#FFD700', letterSpacing: '0.04em' }}>SALES</span>
            </span>
          )}

          {/* Verwijder-knop — vraagt bevestiging via onDelete (handleLeadDelete). */}
          {onDelete && (
            <button
              data-no-click
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              title="Lead verwijderen"
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, padding: 0,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 5, color: 'rgba(239,68,68,0.85)', cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>

        {/* ═══ ROW 2: META — source + return section + contacted label ═══ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          padding: isMobile ? '0.3rem 0.625rem' : '0.3rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          // Eén regel: lange campagne-/magnet-namen korten in met … i.p.v. naar
          // een nieuwe regel te springen.
          flexWrap: 'nowrap',
          overflow: 'hidden',
          minHeight: '22px'
        }}>
          {/* Verplaats-naar-sectie dropdown — alternatief voor slepen (handig
              als de doelsectie niet in beeld staat). */}
          {onMoveToSection && sections.filter(s => s.id !== 'unassigned' && s.id !== currentSectionId).length > 0 && (
            <>
              <div
                ref={moveBtnRef}
                data-no-click
                onClick={openMoveDropdown}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px',
                  background: 'rgba(255,215,0,0.12)',
                  border: '1px solid rgba(255,215,0,0.3)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,215,0,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,215,0,0.12)' }}
              >
                <FolderInput size={11} color="#FFD700" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#FFD700', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
                  Verplaats
                </span>
                <ChevronDown size={10} color="#FFD700" style={{ flexShrink: 0, opacity: 0.8 }} />
              </div>

              {/* Portal + fixed positie zodat de dropdown niet wordt geclipt
                  door de card (overflow:hidden) of achter andere cards valt. */}
              {showMoveDropdown && createPortal(
                <div
                  ref={moveMenuRef}
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: 'fixed', top: movePos.top, left: movePos.left, background: '#111', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', zIndex: 2147483600, minWidth: '170px', maxHeight: '260px', overflowY: 'auto' }}
                >
                  <div style={{ padding: '6px 10px', fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    Verplaats naar
                  </div>
                  {sections.filter(s => s.id !== 'unassigned' && s.id !== currentSectionId).map(section => (
                    <div
                      key={section.id}
                      onClick={(e) => { e.stopPropagation(); setShowMoveDropdown(false); onMoveToSection(section.id) }}
                      style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '8px 11px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.74rem', color: 'rgba(255,255,255,0.85)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${section.color}18`}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                      {section.title}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </>
          )}

          {/* Return section dropdown — fixed-geportald zodat 'ie niet onder de
              card valt (card heeft overflow:hidden). */}
          {hasPreviousSection && (
            <div style={{ position: 'relative', flexShrink: 0 }} ref={dropdownRef}>
              <div
                ref={returnBtnRef}
                data-no-click
                onClick={openReturnDropdown}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '2px 6px',
                  background: `${previousSectionColor}10`,
                  border: `1px solid ${previousSectionColor}25`,
                  borderRadius: '3px',
                  maxWidth: '120px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowLeftCircle size={9} color={previousSectionColor} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.55rem', fontWeight: '600', color: previousSectionColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {previousSectionTitle}
                </span>
                <span style={{ fontSize: '0.4rem', color: previousSectionColor }}>▼</span>
              </div>

              {showReturnDropdown && createPortal(
                <div ref={returnMenuRef} onClick={(e) => e.stopPropagation()} style={{ position: 'fixed', top: returnPos.top, left: returnPos.left, background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.7)', zIndex: 2147483600, minWidth: '150px', maxHeight: '180px', overflowY: 'auto' }}>
                  {sections.filter(s => s.id !== 'unassigned' && s.id !== currentSectionId).map(section => (
                    <div key={section.id} onClick={async (e) => { e.stopPropagation(); setShowReturnDropdown(false); await onEdit({ previous_section_id: section.id, previous_section_title: section.title, previous_section_color: section.color }) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }} onMouseEnter={(e) => e.currentTarget.style.background = `${section.color}15`} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                      {section.title}
                      {section.id === lead.previous_section_id && <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: section.color }}>✓</span>}
                    </div>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}

          {/* Campaign banner — gold chip; naam kort in met … en krimpt mee. */}
          {lead.outreach_campaign?.name && (
            <span
              title={`Campagne: ${lead.outreach_campaign.name}${lead.outreach_campaign.variant_tag ? ` (${lead.outreach_campaign.variant_tag})` : ''}`}
              style={{
                flexShrink: 1, minWidth: 0,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                background: 'rgba(255,215,0,0.12)',
                border: '1px solid rgba(255,215,0,0.32)',
                borderRadius: 6,
                color: '#FFD700',
                fontSize: '0.58rem', fontWeight: 700,
                maxWidth: 170,
              }}
            >
              <Send size={10} style={{ flexShrink: 0 }} />
              <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {lead.outreach_campaign.name}
                {lead.outreach_campaign.variant_tag ? ` · ${lead.outreach_campaign.variant_tag}` : ''}
              </span>
            </span>
          )}

          {/* Source magnet banner — shows which lead magnet brought this lead
              in. Distinct purple so it pops above the regular source pill.
              Prefers the FK-linked source_lead_magnet (modern flow), but
              falls back to the first entry of lead_magnets_shared so older
              leads — created before source_lead_magnet_id existed — still
              show their magnet on the card. */}
          {(() => {
            const magnetName =
              lead.source_lead_magnet?.name ||
              (Array.isArray(lead.lead_magnets_shared) && lead.lead_magnets_shared.length > 0
                ? lead.lead_magnets_shared[0]
                : null)
            if (!magnetName) return null
            return (
              <span
                title={`Binnengekomen via lead magnet: ${magnetName}`}
                style={{
                  flexShrink: 1, minWidth: 0,
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px',
                  background: 'rgba(168,85,247,0.14)',
                  border: '1px solid rgba(168,85,247,0.38)',
                  borderRadius: 6,
                  color: '#c4a4f7',
                  fontSize: '0.58rem', fontWeight: 700,
                  maxWidth: 170,
                }}
              >
                <Gift size={10} style={{ flexShrink: 0 }} />
                <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {magnetName}
                </span>
              </span>
            )
          })()}

          {/* Opvolg-teller verhuisd naar de actie-strip onderaan. */}
        </div>

        {/* ═══ ROW 3: NOTES (1 line truncated) ═══ */}
        {lead.notes && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: isMobile ? '0.3rem 0.625rem' : '0.3rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <FileText size={9} style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <p style={{ 
              margin: 0, color: contactedToday ? 'rgba(156,163,175,0.4)' : 'rgba(255,255,255,0.4)', 
              fontSize: '0.6rem', lineHeight: '1.3',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {lead.notes}
            </p>
          </div>
        )}

        {/* ═══ ACTIE-STRIP — edge-to-edge met verticale scheidingslijntjes,
            in de stijl van de meal-cards. Reacties · Opvolg · Later. ═══ */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Stepper
            label="Reacties van lead" Icon={MessageCircle} accent="#10b981"
            count={replyCount} disabled={updatingReply}
            onInc={(e) => handleReplyChange(1, e)}
          />
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
          <Stepper
            label="Opvolg-berichten verstuurd" Icon={Send} accent="#FFD700"
            count={followupCount} disabled={updatingFollowup}
            onInc={(e) => handleFollowupChange(1, e)}
          />
          {onSnooze && !isSnoozed && (
            <>
              <div style={{ width: 1, background: 'rgba(255,255,255,0.06)', alignSelf: 'stretch' }} />
              <button
                onClick={handleSnooze}
                disabled={snoozingLead}
                title="Later opvolgen"
                style={{
                  flex: '0 0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: isMobile ? '0 0.75rem' : '0 0.95rem', minHeight: 34,
                  background: 'transparent', border: 'none',
                  color: '#fbbf24', fontSize: '0.62rem', fontWeight: 700,
                  cursor: snoozingLead ? 'wait' : 'pointer', opacity: snoozingLead ? 0.5 : 1,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Clock size={12} /> Later
              </button>
            </>
          )}
        </div>

        {/* Inline info panel removed — opens in LeadDetailModalV2. */}
      </div>

      {/* ═══ DM FLOW MODAL — PRESERVED FROM v6.2 ═══ */}
      {showDMModal && coachId && (
        <DMConversationModal
          lead={lead}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          sections={sections}
          onClose={handleDMModalClose}
          onLeadUpdate={handleLeadUpdate}
          onLeadMoved={handleLeadUpdate}
        />
      )}

      {/* ═══ CENTRAL LEAD DETAIL MODAL — tabbed; primary path for editing ═══ */}
      {showDetail && (
        <LeadDetailModalV2
          lead={lead}
          sectionColor={sectionColor}
          isMobile={isMobile}
          db={db}
          coachId={coachId}
          /*
            Vroeger: bij sluiten van de modal triggerden we onRefresh()
            wat loadBoard() draaide en alle kolommen + scroll resette.
            Dat veroorzaakte de "harde refresh" — bij elke per-ongeluk-tap
            in de stil-sectie sprong de coach terug naar boven-links.
            Alle edits in de modal lopen al via onEdit (handleLeadEdit
            doet optimistische state-updates) en delete via onDelete
            (handleLeadDelete idem). Dus geen reload nodig bij sluiten.
          */
          onClose={() => setShowDetail(false)}
          onEdit={onEdit}
          onDelete={async () => { setShowDetail(false); if (onDelete) await onDelete() }}
          onMagnetAttached={onMagnetAttached ? (name) => onMagnetAttached(lead, name) : null}
        />
      )}
    </>
  )
}

// ── Teller-cel voor de actie-strip (reacties / opvolg) ──
// De HELE cel is één +knop (tik = +1). Count + icoon blijven zichtbaar; geen
// min-knop meer. Edge-to-edge in de stijl van de meal-card actie-cellen.
function Stepper({ label, Icon, accent, count, disabled, onInc }) {
  const valColor = count > 0 ? accent : 'rgba(255,255,255,0.4)'
  return (
    <button
      onClick={onInc}
      disabled={disabled}
      title={`${label} — tik voor +1`}
      style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        minHeight: 36, padding: '0 0.4rem',
        background: 'transparent', border: 'none',
        cursor: disabled ? 'default' : 'pointer',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = `${accent}12` }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <Icon size={13} color={valColor} />
      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: valColor }}>{count}</span>
      <Plus size={13} color={accent} strokeWidth={2.6} style={{ opacity: 0.75 }} />
    </button>
  )
}
