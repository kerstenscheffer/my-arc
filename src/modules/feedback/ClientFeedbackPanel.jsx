// src/modules/feedback/ClientFeedbackPanel.jsx
import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import { MessageSquare, HelpCircle, Lightbulb, X, Send, ChevronRight, Check, Clock, Bell } from 'lucide-react'

const TABS = [
  { id: 'messages', label: 'Berichten', icon: Bell },
  { id: 'questions', label: 'Vragen', icon: HelpCircle },
  { id: 'feedback', label: 'Feedback', icon: Lightbulb },
]

const FEEDBACK_TYPES = [
  { value: 'feature', label: '💡 Mis een functie' },
  { value: 'bug', label: '🐛 Werkt niet' },
  { value: 'unclear', label: '❓ Snap iets niet' },
  { value: 'other', label: '💬 Anders' },
]

const MSG_TYPE_COLORS = {
  tip: '#10b981',
  update: '#3b82f6',
  task: '#f59e0b',
  answer: '#a855f7',
}

const MSG_TYPE_LABELS = {
  tip: 'TIP',
  update: 'UPDATE',
  task: 'TAAK',
  answer: 'ANTWOORD',
}

export default function ClientFeedbackPanel({ db, client, currentPage }) {
  const modalHost = useModalHost()
  const isMobile = window.innerWidth <= 768
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('messages')

  // Messages state
  const [messages, setMessages] = useState([])

  // Questions state
  const [question, setQuestion] = useState('')
  const [questionSent, setQuestionSent] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [myQuestions, setMyQuestions] = useState([])

  // Feedback state
  const [feedbackType, setFeedbackType] = useState('feature')
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) loadData()
  }, [open, tab])

  useEffect(() => {
    loadUnread()
  }, [])

  const loadUnread = async () => {
    if (!client?.id) return
    try {
      const { data } = await db.supabase
        .from('coach_messages')
        .select('id')
        .eq('client_id', client.id)
        .eq('is_read', false)
      setUnreadCount(data?.length || 0)
    } catch (e) {}
  }

  const loadData = async () => {
    if (!client?.id) return
    setLoading(true)
    try {
      if (tab === 'messages') {
        const { data } = await db.supabase
          .from('coach_messages')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
        setMessages(data || [])
        // Mark all as read
        await db.supabase
          .from('coach_messages')
          .update({ is_read: true })
          .eq('client_id', client.id)
          .eq('is_read', false)
        setUnreadCount(0)
      }
      if (tab === 'questions') {
        const { data } = await db.supabase
          .from('client_questions')
          .select('*')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
        setMyQuestions(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const sendQuestion = async () => {
    if (!question.trim()) return
    setQuestionLoading(true)
    try {
      await db.supabase.from('client_questions').insert({
        client_id: client?.id,
        client_name: client ? `${client.first_name} ${client.last_name}` : 'Onbekend',
        question: question.trim(),
        page: currentPage || 'onbekend',
        status: 'open',
      })
      setQuestion('')
      setQuestionSent(true)
      setTimeout(() => setQuestionSent(false), 3000)
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setQuestionLoading(false)
    }
  }

  const sendFeedback = async () => {
    if (!feedbackMsg.trim()) return
    setFeedbackLoading(true)
    try {
      await db.supabase.from('client_feedback').insert({
        client_id: client?.id,
        client_name: client ? `${client.first_name} ${client.last_name}` : 'Onbekend',
        type: feedbackType,
        message: feedbackMsg.trim(),
        page: currentPage || 'onbekend',
        status: 'new',
      })
      setFeedbackMsg('')
      setFeedbackSent(true)
      setTimeout(() => setFeedbackSent(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Zojuist'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}u`
    return `${Math.floor(diff / 86400000)}d`
  }

  const panel = (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 9998,
            touchAction: 'none',
          }}
        />
      )}

      {/* Side trigger tab */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          right: 0,
          top: '58%',
          transform: 'translateY(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          width: '36px',
          height: '72px',
          background: '#10b981',
          borderRadius: '10px 0 0 10px',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s ease',
          boxShadow: '-2px 0 12px rgba(16,185,129,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.width = '40px'}
        onMouseLeave={e => e.currentTarget.style.width = '36px'}
      >
        <MessageSquare size={16} color="#000" />
        {unreadCount > 0 && (
          <div style={{
            width: '16px', height: '16px',
            background: '#ef4444',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5rem', fontWeight: '800', color: '#fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </div>

      {/* Slide-in panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: isMobile ? '100vw' : '380px',
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRight: 'none',
        zIndex: 9999,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '0.875rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          flexShrink: 0,
        }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%', background: '#10b981',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '0.9rem', fontWeight: '800', color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            MY ARC
          </span>
          <span style={{
            fontSize: '0.55rem', fontWeight: '600',
            color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginTop: '1px',
          }}>
            BERICHTEN & SUPPORT
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: '6px',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          {TABS.map(t => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  padding: '0.625rem 0.25rem',
                  background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
                  color: active ? '#10b981' : 'rgba(255,255,255,0.3)',
                  fontSize: '0.65rem', fontWeight: '700',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '3px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease',
                  minHeight: '48px', justifyContent: 'center',
                }}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* ── BERICHTEN TAB ── */}
          {tab === 'messages' && (
            <div>
              {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
                  Laden...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <Bell size={28} color="rgba(255,255,255,0.1)" style={{ marginBottom: '0.75rem' }} />
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', fontWeight: '600' }}>
                    Nog geen berichten
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.25rem' }}>
                    Kersten stuurt hier tips, updates en taken
                  </div>
                </div>
              ) : messages.map((msg, i) => {
                const color = MSG_TYPE_COLORS[msg.type] || '#10b981'
                return (
                  <div key={msg.id} style={{
                    padding: '0.875rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${color}`,
                    background: msg.is_read ? 'transparent' : `${color}06`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span style={{
                        fontSize: '0.4rem', fontWeight: '700',
                        color, textTransform: 'uppercase', letterSpacing: '0.08em',
                        background: `${color}18`,
                        padding: '2px 5px', borderRadius: '3px',
                      }}>
                        {MSG_TYPE_LABELS[msg.type] || msg.type}
                      </span>
                      <span style={{
                        fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)',
                        marginLeft: 'auto',
                      }}>
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.8rem', fontWeight: '700', color: '#fff',
                      marginBottom: '0.25rem', lineHeight: 1.3,
                    }}>
                      {msg.title}
                    </div>
                    <div style={{
                      fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)',
                      lineHeight: 1.4,
                    }}>
                      {msg.body}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── VRAGEN TAB ── */}
          {tab === 'questions' && (
            <div>
              {/* Input sectie */}
              <div style={{
                padding: '0.875rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{
                  fontSize: '0.55rem', fontWeight: '700',
                  color: 'rgba(255,255,255,0.2)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginBottom: '0.5rem',
                }}>
                  STEL EEN VRAAG
                </div>
                <textarea
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="Snap iets niet? Vraag het hier..."
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '0.625rem 0.75rem',
                    color: '#fff', fontSize: '0.78rem',
                    resize: 'none', outline: 'none',
                    fontFamily: 'inherit', lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={sendQuestion}
                  disabled={questionLoading || !question.trim()}
                  style={{
                    marginTop: '0.5rem',
                    width: '100%',
                    minHeight: '38px',
                    background: questionSent ? 'rgba(16,185,129,0.15)' : '#10b981',
                    border: questionSent ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    borderRadius: '8px',
                    color: questionSent ? '#10b981' : '#000',
                    fontSize: '0.75rem', fontWeight: '700',
                    cursor: question.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: '0.4rem',
                    opacity: !question.trim() ? 0.4 : 1,
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {questionSent ? <><Check size={13} /> Verstuurd!</> : <><Send size={13} /> Verstuur vraag</>}
                </button>
              </div>

              {/* Vorige vragen */}
              {loading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Laden...</div>
              ) : myQuestions.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.5rem', fontWeight: '700',
                    color: 'rgba(255,255,255,0.15)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}>
                    MIJN VRAGEN
                  </div>
                  {myQuestions.map(q => {
                    const statusColor = q.status === 'answered' ? '#10b981' : q.status === 'read' ? '#f59e0b' : 'rgba(255,255,255,0.2)'
                    const statusLabel = q.status === 'answered' ? 'Beantwoord' : q.status === 'read' ? 'Gelezen' : 'Open'
                    return (
                      <div key={q.id} style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        borderLeft: `3px solid ${statusColor}`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <span style={{ fontSize: '0.5rem', fontWeight: '700', color: statusColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {statusLabel}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)', marginLeft: 'auto' }}>
                            {formatTime(q.created_at)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                          {q.question}
                        </div>
                        {q.answer && (
                          <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 0.625rem',
                            background: 'rgba(16,185,129,0.08)',
                            borderRadius: '6px',
                            borderLeft: '2px solid #10b981',
                          }}>
                            <div style={{ fontSize: '0.45rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                              KERSTEN
                            </div>
                            <div style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
                              {q.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FEEDBACK TAB ── */}
          {tab === 'feedback' && (
            <div style={{ padding: '0.875rem 1rem' }}>
              <div style={{
                fontSize: '0.55rem', fontWeight: '700',
                color: 'rgba(255,255,255,0.2)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
                marginBottom: '0.625rem',
              }}>
                WAT WIL JE MELDEN?
              </div>

              {/* Type selector */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: '0.375rem', marginBottom: '0.75rem',
              }}>
                {FEEDBACK_TYPES.map(ft => (
                  <button
                    key={ft.value}
                    onClick={() => setFeedbackType(ft.value)}
                    style={{
                      padding: '0.5rem 0.625rem',
                      background: feedbackType === ft.value ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                      border: feedbackType === ft.value ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      color: feedbackType === ft.value ? '#10b981' : 'rgba(255,255,255,0.4)',
                      fontSize: '0.7rem', fontWeight: '600',
                      cursor: 'pointer', textAlign: 'left',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease',
                      minHeight: '40px',
                    }}
                  >
                    {ft.label}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={feedbackMsg}
                onChange={e => setFeedbackMsg(e.target.value)}
                placeholder="Vertel wat er beter kan, wat je mist of wat er mis gaat..."
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  padding: '0.625rem 0.75rem',
                  color: '#fff', fontSize: '0.78rem',
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit', lineHeight: 1.4,
                  marginBottom: '0.625rem',
                }}
              />

              <button
                onClick={sendFeedback}
                disabled={feedbackLoading || !feedbackMsg.trim()}
                style={{
                  width: '100%', minHeight: '40px',
                  background: feedbackSent ? 'rgba(16,185,129,0.15)' : '#10b981',
                  border: feedbackSent ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  borderRadius: '8px',
                  color: feedbackSent ? '#10b981' : '#000',
                  fontSize: '0.75rem', fontWeight: '700',
                  cursor: feedbackMsg.trim() ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.4rem',
                  opacity: !feedbackMsg.trim() ? 0.4 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {feedbackSent ? <><Check size={13} /> Bedankt!</> : <><Send size={13} /> Verstuur feedback</>}
              </button>

              <div style={{
                marginTop: '0.75rem',
                fontSize: '0.6rem', color: 'rgba(255,255,255,0.15)',
                textAlign: 'center', lineHeight: 1.4,
              }}>
                Kersten ziet dit direct in zijn dashboard
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )

  return createPortal(modal, modalHost)
}
