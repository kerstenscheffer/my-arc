// src/modules/notifications/SendNotificationModal.jsx
//
// Focused modal voor het sturen van een notificatie naar één al-geselecteerde
// klant. Wordt geopend vanuit ClientInsightModal (coach insight). Insert
// gaat naar `notifications` tabel — de NotificationWidget op ClientDashboard
// pikt'm direct op.

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../coach/ModalHost'
import {
  Send, X, Check, AlertCircle, Bell, Clock, Loader2,
  Home, Dumbbell, Utensils, TrendingUp,
} from 'lucide-react'

// Spinner-icoon voor de "Versturen…"-state
const Loader2Icon = () => (
  <Loader2 size={16} strokeWidth={2.6} style={{ animation: 'sendNotifSpin 0.9s linear infinite' }} />
)

const GOLD = '#FFD700'

// page_context slugs MOETEN matchen met ClientDashboard `currentView`:
// 'home' | 'workout' | 'meal' | 'tracking' (NIET 'progress' — die view-id
// bestaat niet op de client). 'all' verschijnt op elke pagina.
const PAGE_CONTEXTS = [
  { id: 'all',      label: 'Overal',    icon: Home },
  { id: 'home',     label: 'Home',      icon: Home },
  { id: 'workout',  label: 'Workout',   icon: Dumbbell },
  { id: 'meal',     label: 'Voeding',   icon: Utensils },
  { id: 'tracking', label: 'Voortgang', icon: TrendingUp },
]

// notifications.client_id is een FK naar clients.id (PK van clients-tabel).
// Niet auth.users.id — die FK is in de DB anders dan het oude schema-bestand
// suggereert. Insert dus gewoon met client.id.
const resolveClientId = (client) => client?.id

const PRIORITIES = [
  { id: 'low',    label: 'Laag',    color: 'rgba(255,255,255,0.55)' },
  { id: 'normal', label: 'Normaal', color: '#fff' },
  { id: 'high',   label: 'Hoog',    color: '#f59e0b' },
  { id: 'urgent', label: 'Urgent',  color: '#ef4444' },
]

export default function SendNotificationModal({ open, onClose, client, db, coachId, isMobile = false }) {
  const modalHost = useModalHost()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [pageContext, setPageContext] = useState('all')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)
  const [history, setHistory] = useState([])

  // Reset form wanneer modal opent voor een nieuwe klant
  useEffect(() => {
    if (open) {
      setTitle('')
      setMessage('')
      setPriority('normal')
      setPageContext('all')
      setToast(null)
    }
  }, [open, client?.id])

  // History inladen — query op clients.id zodat we match maken met de
  // FK constraint op notifications.client_id.
  useEffect(() => {
    if (!open || !client || !db?.supabase) { setHistory([]); return }
    const clientPk = resolveClientId(client)
    if (!clientPk) { setHistory([]); return }
    let cancelled = false
    ;(async () => {
      const { data, error } = await db.supabase
        .from('notifications')
        .select('id, title, message, page_context, status, created_at')
        .eq('client_id', clientPk)
        .order('created_at', { ascending: false })
        .limit(5)
      if (cancelled) return
      if (error) console.error('Load history failed:', error)
      setHistory(data || [])
    })()
    return () => { cancelled = true }
  }, [open, client?.id, client?.auth_user_id, db])

  const canSend = title.trim().length >= 2 && message.trim().length >= 3 && client && !sending

  const handleSend = async () => {
    if (!canSend) return
    const clientPk = resolveClientId(client)
    if (!clientPk) {
      setToast({ type: 'error', text: 'Klant heeft geen id — kan geen notificatie sturen.' })
      setTimeout(() => setToast(null), 3500)
      return
    }
    setSending(true)
    try {
      let resolvedCoachId = coachId
      if (!resolvedCoachId && db?.supabase) {
        const { data: { user } } = await db.supabase.auth.getUser()
        resolvedCoachId = user?.id
      }
      const { error } = await db.notifications.sendManualNotification({
        clientId: clientPk,
        coachId: resolvedCoachId,
        title: title.trim(),
        message: message.trim(),
        pageContext,
        priority,
      })
      if (error) throw error
      setToast({ type: 'success', text: 'Notificatie verstuurd' })
      setTitle('')
      setMessage('')
      // History refreshen
      const { data } = await db.supabase
        .from('notifications')
        .select('id, title, message, page_context, status, created_at')
        .eq('client_id', clientPk)
        .order('created_at', { ascending: false })
        .limit(5)
      setHistory(data || [])
      setTimeout(() => onClose && onClose(), 1100)
    } catch (err) {
      console.error('Send notification failed:', err)
      setToast({ type: 'error', text: 'Versturen mislukt — check console.' })
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 3500)
    }
  }

  if (!open) return null

  const clientName = `${client?.first_name || ''} ${client?.last_name || ''}`.trim() || client?.email || 'klant'

  const initial = (client?.first_name || client?.email || '?').charAt(0).toUpperCase()

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px) saturate(140%)',
        WebkitBackdropFilter: 'blur(10px) saturate(140%)',
        zIndex: 2147483600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '1rem' : '2rem',
        animation: 'sendNotifFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: '#0a0a0a',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          width: '100%',
          maxWidth: 560,
          maxHeight: '92vh',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,215,0,0.06)',
          animation: 'sendNotifPop 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Gouden accent-strip bovenaan */}
        <div style={{
          position: 'absolute', top: 0, left: 24, right: 24, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.6) 50%, transparent 100%)',
          borderRadius: 2,
        }} />

        {/* Header */}
        <div style={{
          padding: isMobile ? '1.1rem 1.15rem 0.95rem' : '1.4rem 1.5rem 1.1rem',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Avatar van de klant */}
          <div style={{
            width: isMobile ? 42 : 48,
            height: isMobile ? 42 : 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(255,215,0,0.18) 0%, rgba(255,215,0,0.05) 100%)',
            border: '1px solid rgba(255,215,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: 900, color: GOLD,
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}>
            {initial}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '0.6rem', fontWeight: 800, color: GOLD,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              opacity: 0.8, marginBottom: 3,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Bell size={11} strokeWidth={2.6} /> Notificatie
            </div>
            <div style={{
              fontSize: isMobile ? '1.05rem' : '1.2rem',
              fontWeight: 900, color: '#fff',
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {clientName}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: isMobile ? '1.1rem 1.15rem' : '1.4rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.1rem',
        }}>
          {/* Title input */}
          <div>
            <div style={labelStyle()}>Titel</div>
            <input
              type="text"
              placeholder="Bv. Top week!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              autoFocus
              style={inputStyle(isMobile)}
            />
          </div>

          {/* Message textarea */}
          <div>
            <div style={{
              ...labelStyle(),
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span>Bericht</span>
              <span style={{
                fontSize: '0.6rem', color: message.length > 540 ? '#f59e0b' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, letterSpacing: 0,
                textTransform: 'none',
              }}>
                {message.length}/600
              </span>
            </div>
            <textarea
              placeholder="Bericht aan je klant…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={600}
              style={{
                ...inputStyle(isMobile),
                resize: 'vertical', minHeight: 120, fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
            />
          </div>

          <div>
            <div style={labelStyle()}>Verschijnt op</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {PAGE_CONTEXTS.map(p => {
                const sel = pageContext === p.id
                const Icon = p.icon
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPageContext(p.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: isMobile ? '0.6rem 0.7rem' : '0.7rem 0.85rem',
                      minWidth: isMobile ? 64 : 72,
                      background: sel
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.16) 0%, rgba(255,215,0,0.04) 100%)'
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${sel ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10,
                      color: sel ? GOLD : 'rgba(255,255,255,0.55)',
                      fontSize: '0.68rem', fontWeight: 800,
                      cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <Icon size={15} strokeWidth={2.4} />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div style={labelStyle()}>Prioriteit</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {PRIORITIES.map(p => {
                const sel = priority === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '0.55rem 0.85rem',
                      background: sel
                        ? `linear-gradient(135deg, ${p.color}22 0%, ${p.color}0a 100%)`
                        : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${sel ? `${p.color}80` : 'rgba(255,255,255,0.07)'}`,
                      borderRadius: 10,
                      color: sel ? p.color : 'rgba(255,255,255,0.55)',
                      fontSize: '0.75rem', fontWeight: 800,
                      cursor: 'pointer',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: p.color, flexShrink: 0,
                      boxShadow: sel ? `0 0 8px ${p.color}` : 'none',
                    }} />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Verstuur-knop — sticky-feel, gouden gradient */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: isMobile ? '0.95rem' : '1.05rem',
              minHeight: 54,
              background: canSend
                ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
                : 'rgba(255,215,0,0.18)',
              color: canSend ? '#0a0a0a' : 'rgba(0,0,0,0.4)',
              border: 'none', borderRadius: 12,
              fontSize: isMobile ? '0.95rem' : '1.02rem',
              fontWeight: 900, letterSpacing: '0.02em',
              cursor: canSend ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              boxShadow: canSend
                ? '0 12px 28px rgba(255,215,0,0.28), 0 2px 6px rgba(0,0,0,0.5)'
                : 'none',
              marginTop: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { if (canSend) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(255,215,0,0.36), 0 2px 6px rgba(0,0,0,0.5)' } }}
            onMouseLeave={(e) => { if (canSend) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(255,215,0,0.28), 0 2px 6px rgba(0,0,0,0.5)' } }}
          >
            {sending
              ? <><Loader2Icon /> Versturen…</>
              : <><Send size={16} strokeWidth={2.6} /> Verstuur notificatie</>}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div style={{
              marginTop: 6,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{
                fontSize: '0.6rem', fontWeight: 800,
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Clock size={11} strokeWidth={2.4} />
                Recent verstuurd · {history.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {history.map(n => (
                  <div key={n.id} style={{
                    padding: '0.65rem 0.8rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 10,
                    transition: 'border-color 0.15s ease',
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      gap: 8, marginBottom: 3,
                    }}>
                      <div style={{
                        fontSize: '0.82rem', fontWeight: 800, color: '#fff',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        flex: 1, minWidth: 0,
                        letterSpacing: '-0.01em',
                      }}>
                        {n.title}
                      </div>
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800,
                        color: 'rgba(255,215,0,0.6)', flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {formatAgo(new Date(n.created_at))}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
                      fontWeight: 500, lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {n.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top, 0px) + 18px)`,
          left: '50%', transform: 'translateX(-50%)',
          padding: '0.7rem 1.1rem',
          background: toast.type === 'success'
            ? 'linear-gradient(135deg, rgba(16,185,129,0.95) 0%, rgba(5,150,105,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(220,38,38,0.95) 0%, rgba(153,27,27,0.95) 100%)',
          border: toast.type === 'success'
            ? '1px solid rgba(16,185,129,0.4)'
            : '1px solid rgba(220,38,38,0.4)',
          borderRadius: 10,
          color: '#fff', fontSize: '0.85rem', fontWeight: 800,
          zIndex: 2147483700,
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success'
            ? <Check size={16} strokeWidth={3} />
            : <AlertCircle size={16} strokeWidth={2.6} />}
          {toast.text}
        </div>
      )}

      <style>{`
        @keyframes sendNotifFade {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes sendNotifPop {
          0%   { opacity: 0; transform: scale(0.96) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes sendNotifSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )

  return createPortal(modal, modalHost)
}

function formatAgo(date) {
  const ms = Date.now() - date.getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'net'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}u`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

const inputStyle = (isMobile) => ({
  width: '100%',
  padding: isMobile ? '0.8rem 0.95rem' : '0.9rem 1.05rem',
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#fff',
  fontSize: isMobile ? '0.9rem' : '0.95rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  transition: 'border-color 0.15s ease, background 0.15s ease',
})

const labelStyle = () => ({
  fontSize: '0.62rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.55)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  marginBottom: 6,
})
