// src/modules/feedback/CoachFeedbackInbox.jsx
import React, { useState, useEffect } from 'react'
import { MessageSquare, HelpCircle, Lightbulb, Check, Clock, Send, ChevronDown, RefreshCw, Filter } from 'lucide-react'

const STATUS_COLORS = {
  open: '#ef4444',
  read: '#f59e0b',
  answered: '#10b981',
  new: '#ef4444',
  done: '#10b981',
}

const STATUS_LABELS = {
  open: 'OPEN',
  read: 'GELEZEN',
  answered: 'BEANTWOORD',
  new: 'NIEUW',
  done: 'KLAAR',
}

const FEEDBACK_LABELS = {
  feature: '💡 Missende functie',
  bug: '🐛 Werkt niet',
  unclear: '❓ Onduidelijk',
  other: '💬 Anders',
}

const MSG_TYPE_COLORS = {
  tip: '#10b981',
  update: '#3b82f6',
  task: '#f59e0b',
  answer: '#a855f7',
}

export default function CoachFeedbackInbox({ db, clients }) {
  const isMobile = window.innerWidth <= 768
  const [tab, setTab] = useState('questions')
  const [questions, setQuestions] = useState([])
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [expandedId, setExpandedId] = useState(null)
  const [answerText, setAnswerText] = useState({})
  const [answerLoading, setAnswerLoading] = useState({})
  const [sendMsgModal, setSendMsgModal] = useState(null) // { clientId, clientName }
  const [msgForm, setMsgForm] = useState({ type: 'tip', title: '', body: '' })
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgSent, setMsgSent] = useState(false)

  useEffect(() => { loadData() }, [tab, filterStatus])

  const loadData = async () => {
    setLoading(true)
    try {
      if (tab === 'questions') {
        let q = db.supabase.from('client_questions').select('*').order('created_at', { ascending: false })
        if (filterStatus !== 'all') q = q.eq('status', filterStatus)
        const { data } = await q
        setQuestions(data || [])
      } else if (tab === 'feedback') {
        let q = db.supabase.from('client_feedback').select('*').order('created_at', { ascending: false })
        if (filterStatus !== 'all') q = q.eq('status', filterStatus)
        const { data } = await q
        setFeedback(data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const markQuestionRead = async (id) => {
    await db.supabase.from('client_questions').update({ status: 'read' }).eq('id', id).eq('status', 'open')
    loadData()
  }

  const sendAnswer = async (questionId, clientId) => {
    const text = answerText[questionId]
    if (!text?.trim()) return
    setAnswerLoading(prev => ({ ...prev, [questionId]: true }))
    try {
      // Save answer on question
      await db.supabase.from('client_questions').update({
        answer: text.trim(),
        status: 'answered',
        answered_at: new Date().toISOString(),
      }).eq('id', questionId)

      // Push as coach message to client
      await db.supabase.from('coach_messages').insert({
        client_id: clientId,
        type: 'answer',
        title: 'Antwoord op jouw vraag',
        body: text.trim(),
      })

      setAnswerText(prev => ({ ...prev, [questionId]: '' }))
      setExpandedId(null)
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      setAnswerLoading(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const markFeedbackDone = async (id) => {
    await db.supabase.from('client_feedback').update({ status: 'done' }).eq('id', id)
    loadData()
  }

  const markFeedbackRead = async (id) => {
    await db.supabase.from('client_feedback').update({ status: 'read' }).eq('id', id).eq('status', 'new')
    loadData()
  }

  const sendCoachMessage = async () => {
    if (!msgForm.title.trim() || !msgForm.body.trim() || !sendMsgModal) return
    setMsgLoading(true)
    try {
      await db.supabase.from('coach_messages').insert({
        client_id: sendMsgModal.clientId,
        type: msgForm.type,
        title: msgForm.title.trim(),
        body: msgForm.body.trim(),
      })
      setMsgSent(true)
      setTimeout(() => {
        setMsgSent(false)
        setSendMsgModal(null)
        setMsgForm({ type: 'tip', title: '', body: '' })
      }, 2000)
    } catch (e) {
      console.error(e)
    } finally {
      setMsgLoading(false)
    }
  }

  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Zojuist'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m geleden`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}u geleden`
    return `${Math.floor(diff / 86400000)}d geleden`
  }

  const newCount = questions.filter(q => q.status === 'open').length + feedback.filter(f => f.status === 'new').length

  const FILTERS = [
    { id: 'all', label: 'Alles' },
    { id: tab === 'questions' ? 'open' : 'new', label: 'Nieuw' },
    { id: 'read', label: 'Gelezen' },
    { id: tab === 'questions' ? 'answered' : 'done', label: 'Afgerond' },
  ]

  const MSG_TYPES = [
    { value: 'tip', label: 'Tip', color: '#10b981' },
    { value: 'update', label: 'Update', color: '#3b82f6' },
    { value: 'task', label: 'Taak', color: '#f59e0b' },
    { value: 'answer', label: 'Antwoord', color: '#a855f7' },
  ]

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: isMobile ? '10px' : '12px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
    }}>

      {/* Header */}
      <div style={{
        padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        <MessageSquare size={14} color="#FFD700" />
        <h3 style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          fontWeight: '800', color: '#FFD700',
          margin: 0, letterSpacing: '-0.01em',
        }}>
          CLIENT INBOX
        </h3>
        {newCount > 0 && (
          <div style={{
            background: '#ef4444', borderRadius: '50%',
            width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5rem', fontWeight: '800', color: '#fff',
          }}>
            {newCount}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={loadData}
          style={{
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            padding: '4px', borderRadius: '4px',
            touchAction: 'manipulation',
            display: 'flex', alignItems: 'center',
          }}
        >
          <RefreshCw size={13} />
        </button>

        {/* Stuur bericht button */}
        {clients && clients.length > 0 && (
          <div style={{ position: 'relative' }}>
            <select
              onChange={(e) => {
                if (!e.target.value) return
                const c = clients.find(cl => cl.id === e.target.value)
                if (c) setSendMsgModal({ clientId: c.id, clientName: `${c.first_name} ${c.last_name}` })
                e.target.value = ''
              }}
              defaultValue=""
              style={{
                background: 'rgba(255,215,0,0.1)',
                border: '1px solid rgba(255,215,0,0.3)',
                borderRadius: '6px',
                color: '#FFD700',
                fontSize: '0.65rem', fontWeight: '700',
                padding: '0.3rem 0.5rem',
                cursor: 'pointer', outline: 'none',
                minHeight: '28px',
              }}
            >
              <option value="" disabled>+ Stuur bericht</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {[
          { id: 'questions', label: 'Vragen', icon: HelpCircle, count: questions.filter(q => q.status === 'open').length },
          { id: 'feedback', label: 'Feedback', icon: Lightbulb, count: feedback.filter(f => f.status === 'new').length },
        ].map(t => {
          const active = tab === t.id
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setFilterStatus('all') }}
              style={{
                flex: 1, padding: '0.5rem 0.25rem',
                background: active ? 'rgba(255,215,0,0.06)' : 'transparent',
                border: 'none',
                borderBottom: active ? '2px solid #FFD700' : '2px solid transparent',
                color: active ? '#FFD700' : 'rgba(255,255,255,0.3)',
                fontSize: '0.65rem', fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '0.35rem',
                minHeight: '40px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={13} />
              {t.label}
              {t.count > 0 && (
                <span style={{
                  background: '#ef4444', borderRadius: '50%',
                  width: '14px', height: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.45rem', fontWeight: '800', color: '#fff',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filter strip */}
      <div style={{
        display: 'flex', gap: '0.25rem',
        padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            style={{
              padding: '0.25rem 0.5rem', minHeight: '26px',
              background: filterStatus === f.id ? 'rgba(255,215,0,0.12)' : 'transparent',
              border: filterStatus === f.id ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
              borderRadius: '6px',
              color: filterStatus === f.id ? '#FFD700' : 'rgba(255,255,255,0.3)',
              fontSize: '0.6rem', fontWeight: '700',
              textTransform: 'uppercase', letterSpacing: '0.04em',
              cursor: 'pointer', whiteSpace: 'nowrap',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
            Laden...
          </div>
        ) : tab === 'questions' ? (
          questions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
              Geen vragen gevonden
            </div>
          ) : (
            questions.map(q => {
              const statusColor = STATUS_COLORS[q.status] || '#666'
              const expanded = expandedId === q.id
              return (
                <div
                  key={q.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  {/* Question row */}
                  <div
                    onClick={() => {
                      setExpandedId(expanded ? null : q.id)
                      if (q.status === 'open') markQuestionRead(q.id)
                    }}
                    style={{
                      padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: '700', color: '#fff',
                      }}>
                        {q.client_name || 'Client'}
                      </span>
                      <span style={{
                        fontSize: '0.45rem', fontWeight: '700',
                        color: statusColor, textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        background: `${statusColor}18`,
                        padding: '2px 5px', borderRadius: '3px',
                      }}>
                        {STATUS_LABELS[q.status]}
                      </span>
                      <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                        {formatTime(q.created_at)}
                      </span>
                      <ChevronDown
                        size={12}
                        color="rgba(255,255,255,0.3)"
                        style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease', flexShrink: 0 }}
                      />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                      {q.question}
                    </div>
                    {q.page && (
                      <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.15)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Pagina: {q.page}
                      </div>
                    )}
                  </div>

                  {/* Answer area */}
                  {expanded && q.status !== 'answered' && (
                    <div style={{
                      padding: '0 0.75rem 0.75rem',
                      borderTop: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <textarea
                        value={answerText[q.id] || ''}
                        onChange={e => setAnswerText(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder="Typ je antwoord..."
                        rows={3}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,215,0,0.15)',
                          borderRadius: '8px',
                          padding: '0.5rem 0.625rem',
                          color: '#fff', fontSize: '0.75rem',
                          resize: 'none', outline: 'none',
                          fontFamily: 'inherit', lineHeight: 1.4,
                          marginTop: '0.5rem',
                        }}
                      />
                      <button
                        onClick={() => sendAnswer(q.id, q.client_id)}
                        disabled={answerLoading[q.id] || !answerText[q.id]?.trim()}
                        style={{
                          marginTop: '0.375rem',
                          padding: '0.4rem 0.875rem',
                          background: '#FFD700',
                          border: 'none', borderRadius: '6px',
                          color: '#000', fontSize: '0.7rem', fontWeight: '800',
                          cursor: answerText[q.id]?.trim() ? 'pointer' : 'default',
                          opacity: !answerText[q.id]?.trim() ? 0.4 : 1,
                          display: 'flex', alignItems: 'center', gap: '0.35rem',
                          minHeight: '32px',
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <Send size={11} /> Stuur antwoord
                      </button>
                    </div>
                  )}

                  {/* Existing answer */}
                  {expanded && q.answer && (
                    <div style={{
                      margin: '0 0.75rem 0.75rem',
                      padding: '0.5rem 0.625rem',
                      background: 'rgba(16,185,129,0.08)',
                      borderRadius: '6px',
                      borderLeft: '2px solid #10b981',
                    }}>
                      <div style={{ fontSize: '0.45rem', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>
                        JOUW ANTWOORD
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>
                        {q.answer}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )
        ) : (
          // Feedback tab
          feedback.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>
              Geen feedback gevonden
            </div>
          ) : (
            feedback.map(f => {
              const statusColor = STATUS_COLORS[f.status] || '#666'
              return (
                <div
                  key={f.id}
                  style={{
                    padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${statusColor}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff' }}>
                      {f.client_name || 'Client'}
                    </span>
                    <span style={{
                      fontSize: '0.45rem', fontWeight: '700',
                      color: 'rgba(255,255,255,0.3)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {FEEDBACK_LABELS[f.type] || f.type}
                    </span>
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }}>
                      {formatTime(f.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                    {f.message}
                  </div>
                  {f.page && (
                    <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                      Pagina: {f.page}
                    </div>
                  )}
                  {f.status !== 'done' && (
                    <button
                      onClick={() => f.status === 'new' ? markFeedbackRead(f.id) : markFeedbackDone(f.id)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: 'transparent',
                        border: `1px solid ${statusColor}40`,
                        borderRadius: '4px',
                        color: statusColor,
                        fontSize: '0.55rem', fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                        minHeight: '24px',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <Check size={10} />
                      {f.status === 'new' ? 'Mark gelezen' : 'Mark klaar'}
                    </button>
                  )}
                </div>
              )
            })
          )
        )}
      </div>

      {/* Send Coach Message Modal */}
      {sendMsgModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setSendMsgModal(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 10001,
            display: 'flex', alignItems: 'flex-end',
          }}
        >
          <div style={{
            width: '100%',
            background: '#111',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px 16px 0 0',
            padding: '1.25rem 1rem',
          }}>
            <div style={{
              fontSize: '0.55rem', fontWeight: '700',
              color: 'rgba(255,215,0,0.5)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              marginBottom: '0.125rem',
            }}>
              BERICHT STUREN
            </div>
            <div style={{
              fontSize: '0.85rem', fontWeight: '800', color: '#FFD700',
              marginBottom: '0.875rem',
            }}>
              {sendMsgModal.clientName}
            </div>

            {/* Type selector */}
            <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {MSG_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setMsgForm(prev => ({ ...prev, type: t.value }))}
                  style={{
                    padding: '0.3rem 0.625rem',
                    background: msgForm.type === t.value ? `${t.color}18` : 'transparent',
                    border: `1px solid ${msgForm.type === t.value ? `${t.color}50` : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '6px',
                    color: msgForm.type === t.value ? t.color : 'rgba(255,255,255,0.35)',
                    fontSize: '0.65rem', fontWeight: '700',
                    cursor: 'pointer', minHeight: '28px',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={msgForm.title}
              onChange={e => setMsgForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Titel..."
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0.5rem 0.625rem',
                color: '#fff', fontSize: '0.78rem',
                outline: 'none', fontFamily: 'inherit',
                marginBottom: '0.5rem',
              }}
            />
            <textarea
              value={msgForm.body}
              onChange={e => setMsgForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Bericht..."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '0.5rem 0.625rem',
                color: '#fff', fontSize: '0.78rem',
                resize: 'none', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.4,
                marginBottom: '0.75rem',
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSendMsgModal(null)}
                style={{
                  flex: 1, minHeight: '40px',
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none', borderRadius: '8px',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.75rem', fontWeight: '700',
                  cursor: 'pointer',
                  touchAction: 'manipulation',
                }}
              >
                Annuleren
              </button>
              <button
                onClick={sendCoachMessage}
                disabled={msgLoading || !msgForm.title.trim() || !msgForm.body.trim()}
                style={{
                  flex: 2, minHeight: '40px',
                  background: msgSent ? 'rgba(16,185,129,0.15)' : '#FFD700',
                  border: msgSent ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  borderRadius: '8px',
                  color: msgSent ? '#10b981' : '#000',
                  fontSize: '0.75rem', fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '0.4rem',
                  opacity: (!msgForm.title.trim() || !msgForm.body.trim()) ? 0.4 : 1,
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {msgSent ? <><Check size={13} /> Verstuurd!</> : <><Send size={13} /> Verstuur</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
