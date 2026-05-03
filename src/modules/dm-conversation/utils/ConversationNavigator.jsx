// src/modules/dm-conversation/utils/ConversationNavigator.jsx
// VERSION 8.0 - BACK/FORWARD NAV + SUB-COMPONENTS + STYLING GUIDE
// PRESERVED: All v7.0 logic (auto-move, variant selection, visited tracking)
// NEW: History stack, back/forward buttons, VariantPicker with previews, MessageCard with edit, GhostPanel

import { useState, useEffect } from 'react'
import { 
  ChevronRight, ChevronLeft, MessageCircle, CheckCircle, XCircle,
  Ghost
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

import { DECISION_TREE, getNode, getPhaseColor, isEndNode } from '../data/decisionTree'
import { findSectionForNode } from './sectionMatcher'
import dmTrackingService from '../dmTrackingService'

// Sub-components
import MessageCard from './components/MessageCard'
import VariantPicker from './components/VariantPicker'
import GhostPanel from './components/GhostPanel'

export default function ConversationNavigator({ 
  profileType, currentNodeId, onNodeNavigate, onClose,
  leadName = '[naam]',
  isMobile = window.innerWidth <= 768,
  lead, sections = [], leadService, db, coachId, onLeadMoved
}) {
  // ============================================
  // STATE
  // ============================================
  const [history, setHistory] = useState([currentNodeId || 'start']) // navigation history stack
  const [historyIndex, setHistoryIndex] = useState(0) // current position in history
  const [visitedNodes, setVisitedNodes] = useState([currentNodeId || 'start'])
  const [selectedVariantId, setSelectedVariantId] = useState(null)
  const [showGhost, setShowGhost] = useState(false)

  // Derived: current node ID from history
  const selectedNodeId = history[historyIndex] || 'start'
  const currentNode = getNode(DECISION_TREE, selectedNodeId)

  // Can navigate back/forward?
  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  // ============================================
  // GET CURRENT MESSAGE (variant support)
  // ============================================
  const getCurrentMessage = () => {
    if (!currentNode?.message) return null

    if (currentNode.message.variants?.length > 0) {
      if (selectedVariantId) {
        const variant = currentNode.message.variants.find(v => v.id === selectedVariantId)
        return variant || currentNode.message.variants[0]
      }
      return currentNode.message.variants[0]
    }

    // Legacy format
    return {
      id: currentNode.id,
      text: currentNode.message.text || currentNode.message,
      tone: 'Standaard'
    }
  }

  const currentMessage = getCurrentMessage()
  const phaseColor = currentNode ? getPhaseColor(currentNode.phase) : '#6b7280'

  // ============================================
  // AUTO-MOVE — PRESERVED 1:1
  // ============================================
  const handleAutoMoveToSection = async (nodeId, messageVariant = 0) => {
    if (!lead?.id || !sections?.length || !leadService) return { moved: false }

    try {
      const targetSection = findSectionForNode(sections, nodeId)
      if (!targetSection) return { moved: false }

      const { data: currentSection } = await db.supabase
        .from('lead_section_items')
        .select('section_id')
        .eq('lead_id', lead.id)
        .maybeSingle()

      if (currentSection?.section_id === targetSection.id) return { moved: false }

      let previousSectionTitle = null
      if (currentSection?.section_id) {
        const { data: prevSection } = await db.supabase
          .from('lead_sections').select('id, title').eq('id', currentSection.section_id).single()
        previousSectionTitle = prevSection?.title
      }

      await leadService.moveLeadToSection(lead.id, targetSection.id, 0, coachId)

      await dmTrackingService.updateCurrentNode(lead.id, nodeId, {
        messageVariant,
        movedToSection: targetSection.title,
        movedToSectionId: targetSection.id,
        previousSection: previousSectionTitle,
        category: nodeId.split('_')[0]
      })

      toast.success(`→ "${targetSection.title}"`, {
        icon: '🎯', duration: 2500,
        style: { background: '#111', color: '#fff', border: `1px solid ${targetSection.color || '#10b981'}40`, fontSize: '0.8rem', fontWeight: '600', borderRadius: '8px' }
      })

      if (onLeadMoved) {
        onLeadMoved({
          leadId: lead.id,
          leadName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
          fromSection: previousSectionTitle || 'Niet toegewezen',
          toSection: targetSection.title,
          toSectionColor: targetSection.color,
          nodeId
        })
      }

      return { moved: true, toSection: targetSection.title }
    } catch (error) {
      console.error('❌ Auto-move failed:', error)
      return { moved: false }
    }
  }

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handleOptionClick = async (option) => {
    if (!option?.next) return

    // Mark visited
    if (!visitedNodes.includes(option.next)) {
      setVisitedNodes(prev => [...prev, option.next])
    }

    // Auto-move
    await handleAutoMoveToSection(selectedNodeId, selectedVariantId)

    // Add to history (trim any "forward" history when branching)
    const newHistory = [...history.slice(0, historyIndex + 1), option.next]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setSelectedVariantId(null)

    // Parent callback
    if (onNodeNavigate) {
      try { await onNodeNavigate(option.next, selectedVariantId) }
      catch (e) { console.error('Parent callback failed:', e) }
    }
  }

  const handleGoBack = () => {
    if (!canGoBack) return
    setHistoryIndex(prev => prev - 1)
    setSelectedVariantId(null)
  }

  const handleGoForward = () => {
    if (!canGoForward) return
    setHistoryIndex(prev => prev + 1)
    setSelectedVariantId(null)
  }

  // ============================================
  // PERMANENT SAVE — update variant text in DB
  // ============================================
  const handleSavePermanent = async (variantId, newText) => {
    if (!db?.supabase) throw new Error('No database connection')

    // Save to dm_message_overrides table
    const { error } = await db.supabase
      .from('dm_message_overrides')
      .upsert({
        coach_id: coachId,
        variant_id: variantId,
        node_id: selectedNodeId,
        custom_text: newText,
        updated_at: new Date().toISOString()
      }, { onConflict: 'coach_id,variant_id' })

    if (error) throw error
    toast.success('Bericht permanent opgeslagen', {
      icon: '💾', duration: 2000,
      style: { background: '#111', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.75rem', fontWeight: '600', borderRadius: '8px' }
    })
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (!currentNode) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <XCircle size={32} color="#ef4444" style={{ margin: '0 auto 0.5rem' }} />
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#ef4444', marginBottom: '0.25rem' }}>Node niet gevonden</div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>ID: {selectedNodeId}</div>
      </div>
    )
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <Toaster position="top-center" />

      <div>
        {/* ═══ NAV BAR: Back / Phase indicator / Forward ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.375rem',
          marginBottom: '0.625rem'
        }}>
          {/* Back */}
          <button
            onClick={handleGoBack}
            disabled={!canGoBack}
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canGoBack ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${canGoBack ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius: '6px',
              color: canGoBack ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
              cursor: canGoBack ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <ChevronLeft size={14} />
          </button>

          {/* Phase + node info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: phaseColor, flexShrink: 0 }} />
              <span style={{
                fontSize: '0.4rem', fontWeight: '700', color: phaseColor,
                textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                {currentNode.phase}
              </span>
              <span style={{
                fontSize: '0.4rem', fontWeight: '600', color: 'rgba(255,255,255,0.15)'
              }}>
                — stap {historyIndex + 1}/{history.length}
              </span>
            </div>
            <div style={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              fontWeight: '700', color: '#fff',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {currentNode.label}
            </div>
          </div>

          {/* Forward */}
          <button
            onClick={handleGoForward}
            disabled={!canGoForward}
            style={{
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canGoForward ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: `1px solid ${canGoForward ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`,
              borderRadius: '6px',
              color: canGoForward ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)',
              cursor: canGoForward ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0
            }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* ═══ VARIANT PICKER (with message previews) ═══ */}
        {currentNode?.message?.variants?.length > 1 && (
          <VariantPicker
            variants={currentNode.message.variants}
            selectedVariantId={selectedVariantId}
            onSelect={setSelectedVariantId}
            leadName={leadName}
            isMobile={isMobile}
            phaseColor={phaseColor}
          />
        )}

        {/* ═══ CURRENT MESSAGE ═══ */}
        {currentMessage && (
          <MessageCard
            message={currentMessage}
            leadName={leadName}
            isMobile={isMobile}
            onSavePermanent={handleSavePermanent}
            phaseColor={phaseColor}
          />
        )}

        {/* ═══ OPTIONS (lead response paths) ═══ */}
        {currentNode?.options?.length > 0 && (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              marginBottom: '0.375rem'
            }}>
              <MessageCircle size={11} color={phaseColor} />
              <span style={{
                fontSize: '0.4rem', fontWeight: '700', color: phaseColor,
                textTransform: 'uppercase', letterSpacing: '0.06em'
              }}>
                LEAD REACTIE
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {currentNode.options.map((option, idx) => {
                const nextNode = getNode(DECISION_TREE, option.next)
                const isVisited = visitedNodes.includes(option.next)

                return (
                  <button
                    key={option.id || idx}
                    onClick={() => handleOptionClick(option)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: '0.5rem',
                      padding: isMobile ? '0.5rem 0.625rem' : '0.5rem 0.75rem',
                      background: isVisited ? `${phaseColor}06` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isVisited ? phaseColor + '20' : 'rgba(255,255,255,0.06)'}`,
                      borderLeft: isVisited ? `3px solid ${phaseColor}` : '3px solid transparent',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '36px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: isMobile ? '0.75rem' : '0.8rem',
                        fontWeight: '700',
                        marginBottom: nextNode ? '1px' : 0
                      }}>
                        {option.label}
                      </div>
                      {nextNode && (
                        <div style={{
                          fontSize: '0.45rem', fontWeight: '600',
                          color: phaseColor, textTransform: 'uppercase',
                          letterSpacing: '0.05em', opacity: 0.7
                        }}>
                          → {nextNode.phase}
                        </div>
                      )}
                    </div>

                    <div style={{
                      width: '22px', height: '22px', borderRadius: '5px',
                      background: isVisited ? `${phaseColor}15` : 'rgba(255,255,255,0.03)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isVisited 
                        ? <CheckCircle size={12} color={phaseColor} />
                        : <ChevronRight size={12} color="rgba(255,255,255,0.2)" />
                      }
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ═══ GHOST FOLLOW-UP PANEL ═══ */}
        <GhostPanel
          leadName={leadName}
          isMobile={isMobile}
          isOpen={showGhost}
          onToggle={() => setShowGhost(!showGhost)}
        />
      </div>
    </>
  )
}
