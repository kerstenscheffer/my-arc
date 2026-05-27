// src/modules/lead-management/components/kanban/KanbanCard.jsx
// VERSION 7.0 - CRM UPGRADE + STYLING GUIDE COMPLIANT
// PRESERVED: All v6.2 logic (real-time sync, immediate UI, DM modal, snooze, drag, reply counter)
// NEW: Info panel (struggle/goal/magnets/temp), conversation button, lead magnet tags, better styling
// STYLING: Flush rows, borderBottom dividers, no gradient backgrounds, compact data-driven

import { useState, useEffect, useRef } from 'react'
import {
  MessageCircle, Plus, Minus,
  ArrowLeftCircle, Clock, CheckCircle, Circle, Flame,
  Info, FileText, Send, Gift,
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
  coachId,
  db,
  onRefresh,
  sectionTitle = '',
  onSalesCallClick,
  onMagnetAttached,
}) {
  const [showReturnDropdown, setShowReturnDropdown] = useState(false)
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

  // Close dropdowns on outside click
  // NOTE: magnet picker uses createPortal with its own backdrop, so NOT handled here
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowReturnDropdown(false)
    }
    if (showReturnDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showReturnDropdown])

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
  const temp = lead.lead_temperature || null
  const tempConfig = temp ? TEMP_CONFIG[temp] : null

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
    try {
      await onEdit({ reply_count: newCount })
    } catch (error) {
      setReplyCount(replyCount)
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
  const handleTempCycle = async (e) => {
    e.stopPropagation()
    const cycle = [null, 'cold', 'warm', 'hot']
    const currentIdx = cycle.indexOf(lead.lead_temperature || null)
    const nextTemp = cycle[(currentIdx + 1) % cycle.length]
    try {
      await onEdit({ lead_temperature: nextTemp })
    } catch (error) {
      console.error('Update temp failed:', error)
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
        draggable
        onDragStart={onDragStart}
        onClick={handleCardClick}
        style={{ 
          background: '#0a0a0a',
          border: contactedToday
            ? '1px solid rgba(107,114,128,0.2)'
            : isCallReady
              ? `2px solid rgba(212,175,55,0.5)`
              : `1px solid rgba(255,255,255,0.06)`,
          borderLeft: contactedToday 
            ? '3px solid #6b7280'
            : isCallReady
              ? '3px solid #D4AF37'
              : `3px solid ${sectionColor}`,
          borderRadius: isMobile ? '10px' : '12px',
          overflow: 'hidden',
          opacity: contactedToday ? 0.55 : 1,
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
          borderBottom: '1px solid rgba(255,255,255,0.04)'
        }}>
          {/* Contacted Today Checkbox */}
          <button
            onClick={handleContactedTodayToggle}
            disabled={updatingContacted}
            style={{
              width: '24px', height: '24px', minWidth: '24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: contactedToday ? 'rgba(107,114,128,0.12)' : 'transparent',
              border: contactedToday ? '1.5px solid rgba(107,114,128,0.4)' : '1.5px solid rgba(255,255,255,0.12)',
              borderRadius: '5px',
              cursor: updatingContacted ? 'wait' : 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {contactedToday 
              ? <CheckCircle size={13} color="#6b7280" strokeWidth={2.5} />
              : <Circle size={13} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
            }
          </button>

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

          {/* Temperature badge (clickable cycle) */}
          {tempConfig && (
            <button
              onClick={handleTempCycle}
              style={{
                padding: '1px 5px',
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
            </button>
          )}

          {/* Stale days */}
          {daysSinceStale !== null && (
            <span style={{
              padding: '1px 5px',
              background: daysSinceStale >= 3 ? 'rgba(239,68,68,0.12)' : daysSinceStale >= 2 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${daysSinceStale >= 3 ? 'rgba(239,68,68,0.25)' : daysSinceStale >= 2 ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '3px',
              fontSize: '0.5rem',
              fontWeight: '700',
              color: daysSinceStale >= 3 ? '#ef4444' : daysSinceStale >= 2 ? '#fbbf24' : 'rgba(255,255,255,0.4)'
            }}>
              {daysSinceStale}d
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
        </div>

        {/* ═══ ROW 2: META — source + return section + contacted label ═══ */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.3rem',
          padding: isMobile ? '0.3rem 0.625rem' : '0.3rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.03)',
          flexWrap: 'wrap',
          minHeight: '22px'
        }}>
          {/* Return section dropdown */}
          {hasPreviousSection && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <div 
                data-no-click
                onClick={(e) => { e.stopPropagation(); setShowReturnDropdown(!showReturnDropdown) }}
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

              {showReturnDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '3px', background: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)', zIndex: 100, minWidth: '150px', maxHeight: '180px', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
                  {sections.filter(s => s.id !== 'unassigned' && s.id !== currentSectionId).map(section => (
                    <div key={section.id} onClick={async (e) => { e.stopPropagation(); setShowReturnDropdown(false); await onEdit({ previous_section_id: section.id, previous_section_title: section.title, previous_section_color: section.color }) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }} onMouseEnter={(e) => e.currentTarget.style.background = `${section.color}15`} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                      {section.title}
                      {section.id === lead.previous_section_id && <span style={{ marginLeft: 'auto', fontSize: '0.55rem', color: section.color }}>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaign banner — gold pill with campaign name (truncated). */}
          {lead.outreach_campaign?.name && (
            <span
              title={`Campagne: ${lead.outreach_campaign.name}${lead.outreach_campaign.variant_tag ? ` (${lead.outreach_campaign.variant_tag})` : ''}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 6px',
                background: 'rgba(255,215,0,0.14)',
                border: '1px solid rgba(255,215,0,0.4)',
                borderRadius: 3,
                color: '#FFD700',
                fontSize: '0.55rem', fontWeight: 700,
                maxWidth: 160,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              <Send size={9} style={{ flexShrink: 0 }} />
              {lead.outreach_campaign.name}
              {lead.outreach_campaign.variant_tag ? ` · ${lead.outreach_campaign.variant_tag}` : ''}
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
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 6px',
                  background: 'rgba(168,85,247,0.14)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  borderRadius: 3,
                  color: '#c4a4f7',
                  fontSize: '0.55rem', fontWeight: 700,
                  maxWidth: 160,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}
              >
                <Gift size={9} style={{ flexShrink: 0 }} />
                {magnetName}
              </span>
            )
          })()}

          {/* Follow-up counter — lives on the source/label row so it doesn't
              steal width from the action bar (where it pushed the reply
              counter off-screen). */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1px',
            background: followupCount > 0 ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${followupCount > 0 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '3px', padding: '1px',
          }} title="Opvolg-berichten verstuurd">
            <button onClick={(e) => handleFollowupChange(-1, e)} disabled={followupCount <= 0 || updatingFollowup} style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: followupCount > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', cursor: followupCount > 0 ? 'pointer' : 'not-allowed', padding: 0, touchAction: 'manipulation' }}>
              <Minus size={8} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 2px', minWidth: 18, justifyContent: 'center' }}>
              <Send size={8} color={followupCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)'} />
              <span style={{ fontSize: '0.55rem', fontWeight: 800, color: followupCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.2)' }}>
                {followupCount}
              </span>
            </div>
            <button onClick={(e) => handleFollowupChange(1, e)} disabled={updatingFollowup} style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: '#FFD700', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>
              <Plus size={8} />
            </button>
          </div>

          {/* Contacted today label */}
          {contactedToday && (
            <span style={{
              padding: '2px 6px',
              background: 'rgba(107,114,128,0.08)',
              border: '1px solid rgba(107,114,128,0.15)',
              borderRadius: '3px',
              fontSize: '0.45rem', fontWeight: '700', color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              ✓ GEHAD
            </span>
          )}

        </div>

        {/* ═══ ROW 3: NOTES (1 line truncated) ═══ */}
        {lead.notes && (
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: isMobile ? '0.3rem 0.625rem' : '0.3rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.03)'
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

        {/* ═══ ROW 4: ACTION BAR ═══ */}
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '4px',
          padding: isMobile ? '0.35rem 0.625rem' : '0.35rem 0.75rem'
        }}>
          {/* Left: Qual dots + DM button + Info button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Qualification dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[0,1,2,3].map(i => {
                  const isFilled = i < qualScore
                  const isGolden = isCallReady && !contactedToday
                  return (
                    <div key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: isFilled 
                        ? (contactedToday ? '#6b7280' : (isGolden ? '#FFD700' : 'rgba(255,255,255,0.45)'))
                        : 'rgba(255,255,255,0.08)',
                      boxShadow: isFilled && isGolden ? '0 0 4px #D4AF37' : 'none'
                    }} />
                  )
                })}
              </div>
              <span style={{
                fontSize: '0.5rem', fontWeight: '700',
                color: contactedToday ? 'rgba(156,163,175,0.3)' : (isCallReady ? '#D4AF37' : 'rgba(255,255,255,0.25)')
              }}>
                {qualScore}/4
              </span>
            </div>

            {/* Open detail modal — primary action, gold accent */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail(true) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem',
                padding: '0 0.5rem',
                height: '24px',
                background: 'rgba(212,175,55,0.12)',
                border: '1px solid rgba(212,175,55,0.35)',
                borderRadius: '5px',
                color: '#D4AF37',
                fontSize: '0.55rem', fontWeight: '800',
                textTransform: 'uppercase', letterSpacing: '0.04em',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              title="Open lead"
            >
              <Info size={10} strokeWidth={2.5} />
              Open
            </button>

            {/* DM Conversation button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDMModal(true) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px',
                background: 'rgba(139,92,246,0.08)',
                border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '5px',
                color: '#8b5cf6',
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              title="DM Conversation"
            >
              <MessageCircle size={11} />
            </button>

            {/* Info-toggle, Edit, Delete removed — these all open in the
                LeadDetailModalV2 now (via card click or the "Open" button). */}
          </div>

          {/* Center: Later button */}
          {onSnooze && !isSnoozed && (
            <button
              onClick={handleSnooze}
              disabled={snoozingLead}
              style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                padding: '3px 6px',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '4px',
                color: '#fbbf24',
                fontSize: '0.5rem', fontWeight: '700',
                cursor: snoozingLead ? 'wait' : 'pointer',
                opacity: snoozingLead ? 0.5 : 1,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '24px'
              }}
            >
              <Clock size={9} />
              Later
            </button>
          )}

          {/* Right: Reply counter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1px',
            background: replyCount > 0
              ? (contactedToday ? 'rgba(107,114,128,0.08)' : 'rgba(16,185,129,0.08)')
              : 'rgba(255,255,255,0.02)',
            border: `1px solid ${replyCount > 0 ? (contactedToday ? 'rgba(107,114,128,0.15)' : 'rgba(16,185,129,0.2)') : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '4px',
            padding: '1px'
          }} title="Reacties van lead">
            <button onClick={(e) => handleReplyChange(-1, e)} disabled={replyCount <= 0 || updatingReply} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: replyCount > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', cursor: replyCount > 0 ? 'pointer' : 'not-allowed', padding: 0, touchAction: 'manipulation' }}>
              <Minus size={9} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '0 3px', minWidth: '24px', justifyContent: 'center' }}>
              <MessageCircle size={9} color={replyCount > 0 ? (contactedToday ? '#9ca3af' : '#10b981') : 'rgba(255,255,255,0.2)'} />
              <span style={{ fontSize: '0.6rem', fontWeight: '800', color: replyCount > 0 ? (contactedToday ? '#9ca3af' : '#10b981') : 'rgba(255,255,255,0.2)' }}>
                {replyCount}
              </span>
            </div>
            <button onClick={(e) => handleReplyChange(1, e)} disabled={updatingReply} style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: contactedToday ? '#9ca3af' : '#10b981', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}>
              <Plus size={9} />
            </button>
          </div>
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
          onClose={() => { setShowDetail(false); if (onRefresh) onRefresh() }}
          onEdit={onEdit}
          onDelete={async () => { setShowDetail(false); if (onDelete) await onDelete() }}
          onMagnetAttached={onMagnetAttached ? (name) => onMagnetAttached(lead, name) : null}
        />
      )}
    </>
  )
}
