// src/modules/dm-conversation/components/DMConversationModal.jsx
// VERSION 4.0 - STYLING GUIDE COMPLIANT + COMPACT HEADER
// PRESERVED: All v3.0 logic (conversation loading, navigation, auto-move)

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageCircle } from 'lucide-react'
import ConversationNavigator from '../utils/ConversationNavigator'
import DMConversationService from '../utils/DMConversationService'
import LeadManagementService from '../../lead-management/LeadManagementService'

export default function DMConversationModal({ 
  lead,
  coachId,
  onClose,
  db,
  isMobile = window.innerWidth <= 768,
  sections = [],
  onLeadMoved
}) {
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [service] = useState(() => new DMConversationService(db))
  const [leadService] = useState(() => new LeadManagementService())

  useEffect(() => { loadConversation() }, [lead?.id])

  const loadConversation = async () => {
    if (!lead?.id || !coachId) return
    try {
      setLoading(true)
      const conv = await service.getOrCreateConversation(lead.id, coachId)
      setConversation(conv)
    } catch (error) {
      console.error('❌ Load conversation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNavigate = async (nodeId, selectedVariantId) => {
    if (!conversation) return
    try {
      const result = await service.navigateToNode(
        conversation.id, lead.id, nodeId, coachId,
        lead.section_id, selectedVariantId
      )
      setConversation(result.conversation)
    } catch (error) {
      console.error('❌ Navigation failed:', error)
    }
  }

  const handleLeadMoved = (moveData) => {
    if (onLeadMoved) onLeadMoved(moveData)
  }

  // Loading state
  if (loading) {
    return createPortal(
      <div style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 10000,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: '40px', height: '40px',
          border: '2px solid rgba(255,255,255,0.06)',
          borderTopColor: '#D4AF37',
          borderRadius: '50%',
          animation: 'dmSpin 0.8s linear infinite'
        }} />
        <style>{`@keyframes dmSpin { to { transform: rotate(360deg); } }`}</style>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div 
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.92)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        animation: 'dmFadeIn 0.15s ease'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: isMobile ? '100%' : '700px',
          width: '100%',
          margin: '0 auto',
          background: '#0a0a0a',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ═══ HEADER — compact, one row ═══ */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
          borderBottom: '2px solid rgba(212,175,55,0.2)',
          flexShrink: 0
        }}>
          <MessageCircle size={16} color="#D4AF37" style={{ flexShrink: 0 }} />
          <h2 style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '800',
            color: '#D4AF37',
            margin: 0,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap'
          }}>
            DM Flow
          </h2>
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            fontWeight: '600',
            color: 'rgba(255,255,255,0.4)'
          }}>
            {lead?.first_name} {lead?.last_name}
          </span>

          {/* Current phase badge */}
          {conversation?.current_phase && (
            <span style={{
              padding: '2px 6px',
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '3px',
              fontSize: '0.45rem',
              fontWeight: '700',
              color: 'rgba(212,175,55,0.6)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {conversation.current_phase}
            </span>
          )}

          <div style={{ flex: 1 }} />

          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px',
              borderRadius: '6px',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              color: 'rgba(239,68,68,0.6)'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '0.75rem' : '1rem'
        }}>
          {conversation && (
            <ConversationNavigator
              profileType={lead.profile_type || 'neutraal'}
              currentNodeId={conversation.current_node_id}
              leadName={lead.first_name}
              onNodeNavigate={handleNavigate}
              isMobile={isMobile}
              lead={lead}
              sections={sections}
              leadService={leadService}
              db={db}
              coachId={coachId}
              onLeadMoved={handleLeadMoved}
            />
          )}
        </div>
      </div>

      <style>{`
        @keyframes dmFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>,
    document.body
  )
}
