// ============================================
// 📁 FILE: src/modules/client-journey/components/MessageSystem.jsx
// MESSAGE SYSTEM - Renders berichten met WhatsApp integratie
// ============================================
import React, { useState, useMemo } from 'react'
import { Send, Copy, CheckCircle, Edit3, ChevronDown, ChevronRight, MessageCircle, Clock, X, Save, Eye } from 'lucide-react'

// Import all message templates
import onboardingMessages from './onboardingMessages'
import week1Messages from './week1Messages'
import week2Messages from './week2Messages'
import recurringMessages from './recurringMessages'
import milestoneMessages from './milestoneMessages'

const GOLD = { primary: '#d4a853', background: 'rgba(212,168,83,0.08)', border: 'rgba(212,168,83,0.2)' }

// Get all messages for a specific phase/week
export function getMessagesForPhase(phase) {
  switch (phase) {
    case 'onboarding': return onboardingMessages
    case 'week1': return week1Messages
    case 'week2': return week2Messages
    case 'recurring': return recurringMessages
    case 'milestone': return milestoneMessages
    default: return []
  }
}

// Get messages relevant for a specific week number
export function getMessagesForWeek(weekNumber, totalWeeks) {
  const messages = []

  if (weekNumber === 0) return onboardingMessages
  if (weekNumber === 1) messages.push(...week1Messages)
  if (weekNumber === 2) messages.push(...week2Messages)

  // Recurring messages
  recurringMessages.forEach(msg => {
    if (msg.frequency === 'weekly') messages.push(msg)
    if (msg.frequency === 'per_call') messages.push(msg)
    if (msg.frequency === 'monthly' && weekNumber % 4 === 0) messages.push(msg)
  })

  // Milestone messages
  const halfway = Math.round(totalWeeks / 2)
  if (weekNumber % 4 === 0) {
    messages.push(...milestoneMessages.filter(m => m.id === 'photos_request' || m.id === 'measurements_request'))
  }
  if (weekNumber === halfway) {
    messages.push(...milestoneMessages.filter(m => m.id === 'halfway_evaluation'))
  }
  if (weekNumber === totalWeeks) {
    messages.push(...milestoneMessages.filter(m => m.id === 'final_measurement' || m.id === 'continuation_discussion'))
  }

  return messages
}

// Personalize message with client data
export function personalizeMessage(template, client, customVars = {}) {
  let msg = template
  if (client?.first_name) msg = msg.replace(/{naam}/g, client.first_name)
  if (client?.email) msg = msg.replace(/{client_email}/g, client.email)

  // Apply custom variables
  Object.entries(customVars).forEach(([key, value]) => {
    msg = msg.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  })

  return msg
}

// Generate WhatsApp URL
export function getWhatsAppUrl(client, message) {
  let phone = client?.phone || client?.phone_number || ''
  phone = phone.replace(/[\s\-\+]/g, '')
  if (phone.startsWith('0')) phone = '31' + phone.substring(1)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

// ============================================
// MESSAGE CARD COMPONENT
// ============================================
function MessageCard({ message, client, isMobile, onMarkSent }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [customVars, setCustomVars] = useState({})
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(false)

  const personalizedText = useMemo(() =>
    personalizeMessage(message.template, client, customVars),
    [message.template, client, customVars]
  )

  const whatsappUrl = useMemo(() =>
    getWhatsAppUrl(client, personalizedText),
    [client, personalizedText]
  )

  const hasPhone = !!(client?.phone || client?.phone_number)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(personalizedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }

  const handleSendWhatsApp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank')
      setSent(true)
      if (onMarkSent) onMarkSent(message.id)
    }
  }

  const editableVars = (message.variables || []).filter(v =>
    !v.source || v.source === ''
  )

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280'
  }

  return (
    <div style={{
      borderRadius: '10px',
      background: sent ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${sent ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)'}`,
      overflow: 'hidden',
      transition: 'all 0.2s ease'
    }}>
      {/* Header - clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Status indicator */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
          background: sent ? '#10b981' : priorityColors[message.priority] || '#6b7280'
        }} />

        {/* Title + trigger */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            color: sent ? 'rgba(255,255,255,0.5)' : '#fff',
            fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: '600', margin: 0,
            textDecoration: sent ? 'line-through' : 'none'
          }}>
            {message.title}
          </p>
          <p style={{
            color: 'rgba(255,255,255,0.3)', fontSize: isMobile ? '0.65rem' : '0.7rem',
            margin: '0.15rem 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {message.trigger}
          </p>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
          {sent && <CheckCircle size={14} color="#10b981" />}
          {message.conditional && <Clock size={12} color="rgba(255,255,255,0.2)" />}
          {expanded ? <ChevronDown size={14} color="rgba(255,255,255,0.3)" /> : <ChevronRight size={14} color="rgba(255,255,255,0.3)" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{
          padding: isMobile ? '0 0.75rem 0.75rem' : '0 1rem 1rem',
          borderTop: '1px solid rgba(255,255,255,0.04)'
        }}>
          {/* Description */}
          {message.description && (
            <p style={{
              color: 'rgba(255,255,255,0.35)', fontSize: isMobile ? '0.7rem' : '0.75rem',
              margin: '0.5rem 0', lineHeight: '1.5'
            }}>
              {message.description}
            </p>
          )}

          {/* Conditional notice */}
          {message.conditional && (
            <div style={{
              padding: '0.4rem 0.6rem', borderRadius: '6px', marginBottom: '0.5rem',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)',
              fontSize: isMobile ? '0.65rem' : '0.7rem', color: '#f59e0b'
            }}>
              ⚠️ {message.conditional}
            </div>
          )}

          {/* Editable variables */}
          {editing && editableVars.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              {editableVars.map(v => (
                <div key={v.key} style={{ marginBottom: '0.35rem' }}>
                  <label style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: '0.15rem' }}>
                    {v.label}
                  </label>
                  <textarea
                    value={customVars[v.key] || v.default || ''}
                    onChange={e => setCustomVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                    rows={v.key.includes('samenvatting') || v.key.includes('actiepunten') ? 4 : 1}
                    style={{
                      width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px',
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff', fontSize: isMobile ? '0.75rem' : '0.8rem',
                      outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Message preview */}
          <div style={{
            padding: isMobile ? '0.6rem' : '0.75rem', borderRadius: '8px',
            background: 'rgba(37,211,102,0.04)', border: '1px solid rgba(37,211,102,0.1)',
            marginBottom: '0.5rem', position: 'relative'
          }}>
            {/* WhatsApp style bubble */}
            <div style={{
              position: 'absolute', top: '0.4rem', right: '0.4rem',
              fontSize: '0.55rem', color: 'rgba(37,211,102,0.5)', fontWeight: '600'
            }}>
              WhatsApp preview
            </div>
            <p style={{
              color: 'rgba(255,255,255,0.8)', fontSize: isMobile ? '0.75rem' : '0.8rem',
              lineHeight: '1.6', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              paddingTop: '0.5rem'
            }}>
              {personalizedText}
            </p>
          </div>

          {/* Edit hint */}
          {message.editable && message.editHint && !editing && (
            <p style={{
              fontSize: '0.6rem', color: 'rgba(212,168,83,0.6)', margin: '0 0 0.5rem',
              fontStyle: 'italic'
            }}>
              💡 {message.editHint}
            </p>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {/* WhatsApp Send */}
            {hasPhone && (
              <button
                onClick={handleSendWhatsApp}
                style={{
                  flex: 1, padding: isMobile ? '0.5rem' : '0.6rem', borderRadius: '8px',
                  background: 'linear-gradient(135deg, rgba(37,211,102,0.2), rgba(37,211,102,0.1))',
                  border: '1px solid rgba(37,211,102,0.3)', color: '#25D366',
                  fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: '600',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
                }}
              >
                <Send size={14} />
                {sent ? 'Opnieuw sturen' : 'Stuur via WhatsApp'}
              </button>
            )}

            {/* Copy */}
            <button
              onClick={handleCopy}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.85rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: copied ? '#10b981' : 'rgba(255,255,255,0.5)',
                fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '500',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
              }}
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copied ? 'Gekopieerd!' : 'Kopieer'}
            </button>

            {/* Edit toggle */}
            {(message.editable || editableVars.length > 0) && (
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.85rem', borderRadius: '8px',
                  background: editing ? GOLD.background : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${editing ? GOLD.border : 'rgba(255,255,255,0.08)'}`,
                  color: editing ? GOLD.primary : 'rgba(255,255,255,0.5)',
                  fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: '500',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
                }}
              >
                <Edit3 size={13} />
                {editing ? 'Klaar' : 'Aanpassen'}
              </button>
            )}

            {/* Mark as sent (without actually sending) */}
            {!sent && (
              <button
                onClick={() => { setSent(true); if (onMarkSent) onMarkSent(message.id) }}
                style={{
                  padding: '0.5rem', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '40px'
                }}
                title="Markeer als verstuurd"
              >
                <CheckCircle size={14} />
              </button>
            )}
          </div>

          {/* Tags */}
          {message.tags && message.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
              {message.tags.map(tag => (
                <span key={tag} style={{
                  padding: '0.1rem 0.35rem', borderRadius: '3px',
                  background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.2)',
                  fontSize: '0.55rem'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================
// MAIN MESSAGE SYSTEM COMPONENT
// Used in the timeline to show messages for a week
// ============================================
export default function MessageSystem({ weekNumber, totalWeeks, client, isMobile, sentMessages = [], onMarkSent }) {
  const messages = useMemo(() =>
    getMessagesForWeek(weekNumber, totalWeeks),
    [weekNumber, totalWeeks]
  )

  if (messages.length === 0) return null

  return (
    <div style={{ marginTop: '0.35rem' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem'
      }}>
        <MessageCircle size={11} color={GOLD.primary} />
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600',
          color: GOLD.primary, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
          Berichten ({messages.length})
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {messages.map(msg => (
          <MessageCard
            key={msg.id}
            message={msg}
            client={client}
            isMobile={isMobile}
            onMarkSent={onMarkSent}
          />
        ))}
      </div>
    </div>
  )
}
