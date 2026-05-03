// ============================================
// FILE: src/modules/client-journey/components/messages/MessageSystem.jsx
// MESSAGE SYSTEM v2 - Auto-save edits, save on close
// ============================================
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Send, Copy, CheckCircle, Edit3, X, Save, Eye, SkipForward, MessageCircle } from 'lucide-react'
import JourneyMessageService from '../../JourneyMessageService'

const G = {
  gold: '#d4a853', green: '#10b981', red: '#ef4444',
  text: '#fff', textMuted: 'rgba(255,255,255,0.6)', textDim: 'rgba(255,255,255,0.3)',
  card: 'rgba(23,23,23,0.8)', border: 'rgba(16,185,129,0.2)', borderActive: 'rgba(16,185,129,0.4)',
}

export default function MessageSystem({ db, client, journey, weekNumber, dayNumber, totalWeeks, isMobile }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [copied, setCopied] = useState(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const editTimerRef = useRef(null)
  const editDirtyRef = useRef(false)

  const msgService = db?.supabase ? new JourneyMessageService(db.supabase) : null

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!msgService || !journey?.id) { setLoading(false); return }
    setLoading(true)
    try {
      await msgService.generateMessagesForWeek(journey.id, client.id, journey.coach_id, weekNumber, totalWeeks, client)
      const msgs = dayNumber != null
        ? await msgService.getClientMessagesForDay(journey.id, weekNumber, dayNumber)
        : await msgService.getClientMessages(journey.id, weekNumber)
      setMessages(msgs)
    } catch (e) { console.error('Load messages:', e) }
    setLoading(false)
  }, [journey?.id, client?.id, weekNumber, dayNumber, totalWeeks])

  useEffect(() => { loadMessages() }, [loadMessages])

  // ── AUTO-SAVE: save edit text every 800ms while typing ──
  useEffect(() => {
    if (!editingId || !editDirtyRef.current) return
    if (editTimerRef.current) clearTimeout(editTimerRef.current)
    editTimerRef.current = setTimeout(async () => {
      if (!msgService || !editingId) return
      setAutoSaving(true)
      await msgService.updateMessageText(editingId, editText)
      editDirtyRef.current = false
      setAutoSaving(false)
    }, 800)
    return () => { if (editTimerRef.current) clearTimeout(editTimerRef.current) }
  }, [editText, editingId])

  // ── SAVE ON UNMOUNT or when closing edit ──
  const saveEditNow = useCallback(async () => {
    if (!editingId || !editDirtyRef.current || !msgService) return
    if (editTimerRef.current) clearTimeout(editTimerRef.current)
    await msgService.updateMessageText(editingId, editText)
    setMessages(prev => prev.map(m => m.id === editingId ? { ...m, message_text: editText, custom_text: editText } : m))
    editDirtyRef.current = false
  }, [editingId, editText])

  // Save when component unmounts (modal closes)
  useEffect(() => {
    return () => { if (editDirtyRef.current && editingId && msgService) { msgService.updateMessageText(editingId, editText) } }
  }, [editingId, editText])

  const handleEditChange = (text) => {
    setEditText(text)
    editDirtyRef.current = true
  }

  const handleStartEdit = (msg) => {
    setEditingId(msg.id)
    setEditText(msg.custom_text || msg.message_text)
    setExpandedId(msg.id)
    editDirtyRef.current = false
  }

  const handleFinishEdit = async () => {
    await saveEditNow()
    setMessages(prev => prev.map(m => m.id === editingId ? { ...m, message_text: editText, custom_text: editText } : m))
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    // Don't save — revert
    if (editTimerRef.current) clearTimeout(editTimerRef.current)
    editDirtyRef.current = false
    setEditingId(null)
  }

  const handleSend = async (msg) => {
    // If editing this message, save first
    if (editingId === msg.id) await saveEditNow()
    const text = msg.custom_text || msg.message_text || editText
    const url = msgService.getWhatsAppUrl(client, text)
    if (url) window.open(url, '_blank')
    const updated = await msgService.markAsSent(msg.id, 'whatsapp')
    if (updated) {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'sent', sent_at: updated.sent_at } : m))
      if (editingId === msg.id) setEditingId(null)
    }
  }

  const handleCopy = (msg) => {
    const text = editingId === msg.id ? editText : (msg.custom_text || msg.message_text)
    navigator.clipboard.writeText(text)
    setCopied(msg.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSkip = async (msg) => {
    const updated = await msgService.skipMessage(msg.id)
    if (updated) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'skipped' } : m))
  }

  // Close expanded card — save edit if active
  const handleToggle = async (msgId) => {
    if (expandedId === msgId) {
      if (editingId === msgId) await handleFinishEdit()
      setExpandedId(null)
    } else {
      if (editingId && editingId !== msgId) await handleFinishEdit()
      setExpandedId(msgId)
    }
  }

  if (loading) return (
    <div style={{ padding: '1rem', textAlign: 'center' }}>
      <div style={{ width: '24px', height: '24px', border: `2px solid ${G.border}`, borderTop: `2px solid ${G.green}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (messages.length === 0) return (
    <div style={{ padding: '1.5rem', textAlign: 'center' }}>
      <MessageCircle size={24} color={G.textDim} style={{ margin: '0 auto 0.5rem' }} />
      <p style={{ color: G.textDim, fontSize: '0.8rem' }}>Geen berichten voor deze dag</p>
    </div>
  )

  const pending = messages.filter(m => m.status === 'pending')
  const sent = messages.filter(m => m.status === 'sent')
  const skipped = messages.filter(m => m.status === 'skipped')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {pending.map(msg => {
        const isExpanded = expandedId === msg.id
        const isEditing = editingId === msg.id
        const text = isEditing ? editText : (msg.custom_text || msg.message_text)
        const isHigh = msg.priority === 'high'

        return (
          <div key={msg.id} style={{
            borderRadius: '10px', overflow: 'hidden',
            background: '#111', border: `1px solid ${isHigh ? G.borderActive : 'rgba(255,255,255,0.06)'}`,
          }}>
            {/* Header */}
            <div onClick={() => handleToggle(msg.id)} style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent'
            }}>
              <Send size={12} color={G.green} />
              <span style={{ flex: 1, fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 600, color: G.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.title}
              </span>
              {isHigh && <span style={{ fontSize: '0.4rem', padding: '0.06rem 0.2rem', borderRadius: '3px', background: `${G.green}15`, color: G.green, fontWeight: 700 }}>PRIO</span>}
              {isEditing && <span style={{ fontSize: '0.4rem', color: autoSaving ? G.gold : G.green }}>{autoSaving ? 'Opslaan...' : 'Auto-saved'}</span>}
              <Eye size={12} color={isExpanded ? G.green : G.textDim} />
            </div>

            {/* Expanded */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {/* Message text / editor */}
                {isEditing ? (
                  <div style={{ padding: '0.5rem 0.75rem' }}>
                    <textarea value={editText} onChange={e => handleEditChange(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%', minHeight: '120px', padding: '0.5rem',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '6px', color: G.text, fontSize: '0.78rem',
                        resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                        lineHeight: 1.5
                      }}
                    />
                    <div style={{ fontSize: '0.4rem', color: G.textDim, marginTop: '0.15rem' }}>
                      Wordt automatisch opgeslagen terwijl je typt
                    </div>
                  </div>
                ) : (
                  <div style={{
                    margin: '0.4rem 0.75rem', padding: '0.5rem',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '6px', whiteSpace: 'pre-wrap',
                    fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5
                  }}>
                    {text}
                  </div>
                )}

                {/* Action buttons — clean row */}
                <div style={{
                  display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {isEditing ? (
                    <>
                      <ActBtn onClick={handleFinishEdit} color={G.green} label="Klaar" icon={Save} flex isMobile={isMobile} />
                      <ActBtn onClick={handleCancelEdit} color={G.textDim} label="Annuleer" icon={X} isMobile={isMobile} />
                    </>
                  ) : (
                    <>
                      <ActBtn onClick={() => handleSend(msg)} color={G.green} label="WhatsApp" icon={Send} flex isMobile={isMobile} />
                      <ActBtn onClick={() => handleCopy(msg)} color={copied === msg.id ? G.green : G.textMuted} label={copied === msg.id ? '✓' : 'Kopieer'} icon={Copy} isMobile={isMobile} />
                      <ActBtn onClick={() => handleStartEdit(msg)} color={G.textMuted} label="Edit" icon={Edit3} isMobile={isMobile} />
                      <ActBtn onClick={() => handleSkip(msg)} color={G.textDim} label="Skip" icon={SkipForward} isMobile={isMobile} />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Sent */}
      {sent.length > 0 && (
        <div style={{ marginTop: '0.2rem' }}>
          <p style={{ fontSize: '0.45rem', fontWeight: 700, color: `${G.green}60`, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Verstuurd ({sent.length})
          </p>
          {sent.map(msg => (
            <div key={msg.id} style={{
              padding: '0.3rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', gap: '0.3rem'
            }}>
              <CheckCircle size={10} color={G.green} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', flex: 1 }}>{msg.title}</span>
              {msg.sent_at && <span style={{ fontSize: '0.45rem', color: G.textDim }}>{new Date(msg.sent_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Skipped */}
      {skipped.length > 0 && (
        <div style={{ marginTop: '0.2rem' }}>
          <p style={{ fontSize: '0.45rem', fontWeight: 700, color: G.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
            Overgeslagen ({skipped.length})
          </p>
          {skipped.map(msg => (
            <div key={msg.id} style={{ padding: '0.25rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.65rem', color: G.textDim, textDecoration: 'line-through' }}>{msg.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── ACTION BUTTON — flush style, sits in a row ──
function ActBtn({ onClick, color, label, icon: Icon, flex, isMobile }) {
  return (
    <button onClick={onClick} style={{
      flex: flex ? 1 : undefined,
      padding: isMobile ? '0.4rem 0.5rem' : '0.45rem 0.6rem',
      background: 'transparent', border: 'none',
      borderRight: '1px solid rgba(255,255,255,0.04)',
      color, fontSize: '0.65rem', fontWeight: 600,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      minHeight: '36px'
    }}>
      <Icon size={12} /> {label}
    </button>
  )
}

// Exported helpers
export function personalizeMessage(template, client, customVars = {}) {
  let msg = template
  if (client?.first_name) msg = msg.replace(/{naam}/g, client.first_name)
  if (client?.email) msg = msg.replace(/{client_email}/g, client.email)
  Object.entries(customVars).forEach(([key, value]) => {
    msg = msg.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  })
  return msg
}

export function getWhatsAppUrl(client, message) {
  let phone = client?.phone || client?.phone_number || ''
  phone = phone.replace(/[\s\-\+]/g, '')
  if (phone.startsWith('0')) phone = '31' + phone.substring(1)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
