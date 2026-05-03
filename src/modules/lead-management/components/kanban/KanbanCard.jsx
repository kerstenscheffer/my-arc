// src/modules/lead-management/components/kanban/KanbanCard.jsx
// VERSION 7.0 - CRM UPGRADE + STYLING GUIDE COMPLIANT
// PRESERVED: All v6.2 logic (real-time sync, immediate UI, DM modal, snooze, drag, reply counter)
// NEW: Info panel (struggle/goal/magnets/temp), conversation button, lead magnet tags, better styling
// STYLING: Flush rows, borderBottom dividers, no gradient backgrounds, compact data-driven

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Edit2, Trash2, FileText, MessageCircle, Plus, Minus, 
  ArrowLeftCircle, Clock, CheckCircle, Circle, Flame, 
  ChevronDown, ChevronUp, Info, Target, AlertTriangle,
  Gift, X, Save
} from 'lucide-react'
import DMConversationModal from "../../../dm-conversation/components/DMConversationModal"

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
  onSalesCallClick
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [showInfo, setShowInfo] = useState(false)
  const [showReturnDropdown, setShowReturnDropdown] = useState(false)
  const [showDMModal, setShowDMModal] = useState(false)
  const [showMagnetPicker, setShowMagnetPicker] = useState(false)
  const dropdownRef = useRef(null)
  const magnetRef = useRef(null)

  const [editData, setEditData] = useState({
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    email: lead.email || '',
    phone: lead.phone || '',
    lead_source: lead.lead_source || '',
    notes: lead.notes || '',
    lead_struggle: lead.lead_struggle || '',
    lead_goal: lead.lead_goal || '',
    lead_temperature: lead.lead_temperature || ''
  })

  const [replyCount, setReplyCount] = useState(lead.reply_count || 0)
  const [updatingReply, setUpdatingReply] = useState(false)
  const [snoozingLead, setSnoozingLead] = useState(false)
  const [contactedToday, setContactedToday] = useState(false)
  const [updatingContacted, setUpdatingContacted] = useState(false)
  const [magnetsShared, setMagnetsShared] = useState(lead.lead_magnets_shared || [])

  // ============================================
  // ✅ SYNC WITH PROPS (real-time updates) — PRESERVED FROM v6.2
  // ============================================
  useEffect(() => {
    setEditData({
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      lead_source: lead.lead_source || '',
      notes: lead.notes || '',
      lead_struggle: lead.lead_struggle || '',
      lead_goal: lead.lead_goal || '',
      lead_temperature: lead.lead_temperature || ''
    })
  }, [lead.first_name, lead.last_name, lead.email, lead.phone, lead.lead_source, lead.notes, lead.lead_struggle, lead.lead_goal, lead.lead_temperature])

  useEffect(() => {
    setReplyCount(lead.reply_count || 0)
  }, [lead.reply_count])

  useEffect(() => {
    setMagnetsShared(lead.lead_magnets_shared || [])
  }, [lead.lead_magnets_shared])

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

  // Has any CRM data?
  const hasCrmData = lead.lead_struggle || lead.lead_goal || (magnetsShared && magnetsShared.length > 0)

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

    // Als lead in sales call sectie zit → open SalesCallModal
    const isSalesSection = sectionTitle?.toLowerCase().includes('sales')
    if (isSalesSection && onSalesCallClick) {
      onSalesCallClick(lead)
      return
    }

    // Anders → toggle inline info panel
    setShowInfo(!showInfo)
    if (onClick) onClick(lead)
  }

  const handleDMModalClose = () => setShowDMModal(false)

  const handleLeadUpdate = async () => {
    setShowDMModal(false)
    if (onRefresh) await onRefresh()
  }

  // ============================================
  // NEW: Lead magnet toggle
  // ============================================
  const handleToggleMagnet = async (magnetName, e) => {
    if (e) e.stopPropagation()
    const current = magnetsShared || []
    let updated
    if (current.includes(magnetName)) {
      updated = current.filter(m => m !== magnetName)
    } else {
      updated = [...current, magnetName]
    }
    setMagnetsShared(updated)
    try {
      await onEdit({ lead_magnets_shared: updated })
    } catch (error) {
      setMagnetsShared(current)
      console.error('Update magnets failed:', error)
    }
  }

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

  // ============================================
  // EDIT MODE
  // ============================================
  if (isEditing) {
    return (
      <div style={{
        background: '#0a0a0a',
        border: `1px solid ${sectionColor}40`,
        borderRadius: isMobile ? '10px' : '12px',
        overflow: 'hidden'
      }}>
        {/* Edit header */}
        <div style={{
          padding: '0.5rem 0.75rem',
          borderBottom: `1px solid ${sectionColor}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: sectionColor }}>BEWERKEN</span>
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button onClick={async () => { await onEdit(editData); setIsEditing(false) }} style={{ padding: '0.3rem 0.5rem', background: `${sectionColor}20`, border: `1px solid ${sectionColor}40`, borderRadius: '6px', color: sectionColor, fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '28px', touchAction: 'manipulation' }}>
              <Save size={10} /> Opslaan
            </button>
            <button onClick={() => setIsEditing(false)} style={{ padding: '0.3rem 0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', fontWeight: '600', cursor: 'pointer', minHeight: '28px', touchAction: 'manipulation' }}>
              Annuleer
            </button>
          </div>
        </div>

        {/* Edit fields */}
        <div style={{ padding: '0.625rem' }}>
          {[
            { key: 'first_name', placeholder: 'Voornaam' },
            { key: 'last_name', placeholder: 'Achternaam' },
            { key: 'lead_source', placeholder: 'Bron (instagram, tiktok...)' },
            { key: 'email', placeholder: 'Email', type: 'email' },
            { key: 'phone', placeholder: 'Telefoon', type: 'tel' },
            { key: 'lead_goal', placeholder: '🎯 Doel (bijv: 5kg afvallen)' },
            { key: 'lead_struggle', placeholder: '⚡ Struggle (bijv: geen structuur)' }
          ].map(field => (
            <input
              key={field.key}
              type={field.type || 'text'}
              placeholder={field.placeholder}
              value={editData[field.key]}
              onChange={(e) => setEditData({ ...editData, [field.key]: e.target.value })}
              style={{
                width: '100%',
                padding: '0.4rem 0.5rem',
                marginBottom: '0.375rem',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.8rem',
                outline: 'none',
                minHeight: '32px'
              }}
            />
          ))}
          <textarea
            placeholder="Notities"
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '0.4rem 0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.8rem',
              resize: 'none',
              outline: 'none'
            }}
          />

          {/* Temperature selector */}
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
            {Object.entries(TEMP_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setEditData({ ...editData, lead_temperature: editData.lead_temperature === key ? '' : key })}
                style={{
                  flex: 1,
                  padding: '0.3rem',
                  background: editData.lead_temperature === key ? cfg.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${editData.lead_temperature === key ? cfg.border : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  color: editData.lead_temperature === key ? cfg.color : 'rgba(255,255,255,0.3)',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  minHeight: '28px',
                  touchAction: 'manipulation'
                }}
              >
                {cfg.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

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

          {/* Name */}
          <span style={{ 
            flex: 1,
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '700', 
            color: contactedToday ? '#9ca3af' : (isCallReady ? '#FFD700' : '#fff'),
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1
          }}>
            {lead.first_name} {lead.last_name}
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

          {/* Source */}
          {lead.lead_source && (
            <span style={{ 
              padding: '2px 6px', 
              background: contactedToday ? 'rgba(107,114,128,0.08)' : `${sectionColor}10`, 
              border: `1px solid ${contactedToday ? 'rgba(107,114,128,0.15)' : sectionColor + '20'}`, 
              borderRadius: '3px', 
              color: contactedToday ? '#9ca3af' : sectionColor, 
              fontSize: '0.55rem',
              fontWeight: '600'
            }}>
              {lead.lead_source}
            </span>
          )}

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

          {/* Lead magnet count indicator */}
          {magnetsShared.length > 0 && (
            <span style={{
              padding: '2px 5px',
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.2)',
              borderRadius: '3px',
              fontSize: '0.5rem', fontWeight: '700', color: '#a855f7',
              display: 'flex', alignItems: 'center', gap: '2px'
            }}>
              <Gift size={8} />
              {magnetsShared.length}
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

            {/* Info toggle button */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px',
                background: showInfo ? `${sectionColor}15` : (hasCrmData ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)'),
                border: `1px solid ${showInfo ? sectionColor + '30' : (hasCrmData ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)')}`,
                borderRadius: '5px',
                color: showInfo ? sectionColor : (hasCrmData ? '#10b981' : 'rgba(255,255,255,0.25)'),
                cursor: 'pointer',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              title="Lead Info"
            >
              <Info size={11} />
            </button>

            {/* Edit */}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} style={{ padding: '3px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', touchAction: 'manipulation' }}>
              <Edit2 size={10} />
            </button>

            {/* Delete */}
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} style={{ padding: '3px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', touchAction: 'manipulation' }}>
              <Trash2 size={10} />
            </button>
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
          }}>
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

        {/* ═══ ROW 5: INFO PANEL (expandable) ═══ */}
        {showInfo && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} data-no-click>
            {/* Goal */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '6px',
              padding: isMobile ? '0.4rem 0.625rem' : '0.4rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}>
              <Target size={10} color="#10b981" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>DOEL</div>
                {lead.lead_goal ? (
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{lead.lead_goal}</div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontStyle: 'italic' }}>+ Toevoegen</button>
                )}
              </div>
            </div>

            {/* Struggle */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '6px',
              padding: isMobile ? '0.4rem 0.625rem' : '0.4rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}>
              <AlertTriangle size={10} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1px' }}>STRUGGLE</div>
                {lead.lead_struggle ? (
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{lead.lead_struggle}</div>
                ) : (
                  <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontStyle: 'italic' }}>+ Toevoegen</button>
                )}
              </div>
            </div>

            {/* Lead Magnets Shared */}
            <div style={{
              padding: isMobile ? '0.4rem 0.625rem' : '0.4rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gift size={10} color="#a855f7" />
                  <span style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LEAD MAGNETS</span>
                </div>
                <div style={{ position: 'relative' }} ref={magnetRef}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMagnetPicker(!showMagnetPicker) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '2px',
                      padding: '2px 5px',
                      background: 'rgba(168,85,247,0.08)',
                      border: '1px solid rgba(168,85,247,0.2)',
                      borderRadius: '4px',
                      color: '#a855f7',
                      fontSize: '0.5rem', fontWeight: '600',
                      cursor: 'pointer',
                      touchAction: 'manipulation'
                    }}
                  >
                    <Plus size={8} /> Toevoegen
                  </button>

                  {/* Magnet picker dropdown — via createPortal to escape overflow:hidden */}
                  {showMagnetPicker && createPortal(
                    <>
                      {/* Backdrop — closes picker */}
                      <div onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowMagnetPicker(false) }} style={{ position: 'fixed', inset: 0, zIndex: 10000 }} />
                      {/* Menu */}
                      <div data-magnet-picker onMouseDown={(e) => e.stopPropagation()} style={{
                        position: 'fixed',
                        top: (() => { const r = magnetRef.current?.getBoundingClientRect(); return r ? Math.min(r.bottom + 3, window.innerHeight - 220) : 0 })(),
                        left: (() => { const r = magnetRef.current?.getBoundingClientRect(); return r ? Math.max(8, r.right - 180) : 0 })(),
                        width: '180px',
                        maxHeight: '210px', overflowY: 'auto',
                        background: '#111', border: '1px solid rgba(168,85,247,0.25)',
                        borderRadius: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
                        zIndex: 10001,
                        WebkitOverflowScrolling: 'touch'
                      }} onClick={(e) => e.stopPropagation()}>
                        {LEAD_MAGNET_OPTIONS.map(magnet => {
                          const isSelected = magnetsShared.includes(magnet)
                          return (
                            <div
                              key={magnet}
                              onClick={(e) => handleToggleMagnet(magnet, e)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                background: isSelected ? 'rgba(168,85,247,0.1)' : 'transparent',
                                touchAction: 'manipulation'
                              }}
                              onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(168,85,247,0.06)' }}
                              onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'rgba(168,85,247,0.1)' : 'transparent' }}
                            >
                              <div style={{
                                width: '16px', height: '16px', borderRadius: '3px',
                                border: isSelected ? '1.5px solid #a855f7' : '1.5px solid rgba(255,255,255,0.15)',
                                background: isSelected ? 'rgba(168,85,247,0.2)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {isSelected && <CheckCircle size={10} color="#a855f7" />}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: isSelected ? '#a855f7' : 'rgba(255,255,255,0.6)', fontWeight: isSelected ? '600' : '400' }}>
                                {magnet}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </>,
                    document.body
                  )}
                </div>
              </div>

              {/* Shared magnets tags */}
              {magnetsShared.length > 0 ? (
                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                  {magnetsShared.map(magnet => (
                    <span key={magnet} style={{
                      padding: '2px 6px',
                      background: 'rgba(168,85,247,0.08)',
                      border: '1px solid rgba(168,85,247,0.15)',
                      borderRadius: '3px',
                      fontSize: '0.5rem', fontWeight: '600', color: '#a855f7',
                      display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {magnet}
                      <X size={7} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => handleToggleMagnet(magnet, e)} />
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Nog geen lead magnets gedeeld</div>
              )}
            </div>

            {/* Quick actions in info */}
            <div style={{
              display: 'flex', gap: '0.25rem',
              padding: isMobile ? '0.35rem 0.625rem' : '0.35rem 0.75rem'
            }}>
              {!tempConfig && (
                <button
                  onClick={handleTempCycle}
                  style={{
                    padding: '3px 6px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '0.5rem', fontWeight: '600',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    display: 'flex', alignItems: 'center', gap: '3px',
                    minHeight: '24px'
                  }}
                >
                  🌡️ Temperatuur
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
                style={{
                  padding: '3px 6px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  color: 'rgba(255,255,255,0.3)',
                  fontSize: '0.5rem', fontWeight: '600',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                  display: 'flex', alignItems: 'center', gap: '3px',
                  minHeight: '24px'
                }}
              >
                <Edit2 size={8} /> Bewerken
              </button>
            </div>
          </div>
        )}
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
    </>
  )
}
