// src/modules/notifications/CoachSendNotificationPanel.jsx
//
// Lichtgewicht panel om handmatig een notificatie naar een client te sturen.
// Inserted in `notifications` table → NotificationWidget op ClientDashboard
// pikt'm direct op.
//
// Flow: client kiezen → formulier invullen → versturen.

import { useState, useEffect, useMemo } from 'react'
import {
  Send, Search, Users, X, Check, AlertCircle,
  Home, Dumbbell, Utensils, TrendingUp,
} from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'

const GOLD = '#FFD700'

const PAGE_CONTEXTS = [
  { id: 'all',     label: 'Overal',     icon: Home },
  { id: 'workout', label: 'Workout',    icon: Dumbbell },
  { id: 'meal',    label: 'Voeding',    icon: Utensils },
  { id: 'progress',label: 'Voortgang',  icon: TrendingUp },
]

const PRIORITIES = [
  { id: 'low',    label: 'Laag',    color: 'rgba(255,255,255,0.55)' },
  { id: 'normal', label: 'Normaal', color: '#fff' },
  { id: 'high',   label: 'Hoog',    color: '#f59e0b' },
  { id: 'urgent', label: 'Urgent',  color: '#ef4444' },
]

export default function CoachSendNotificationPanel({ db }) {
  const isMobile = useIsMobile()

  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)

  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')
  const [pageContext, setPageContext] = useState('all')
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  // Laatst verstuurde notificaties voor de geselecteerde client
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Coach uit auth.
  const [coachId, setCoachId] = useState(null)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await db.supabase.auth.getUser()
      if (user) setCoachId(user.id)
    })()
  }, [db])

  // Clients van deze coach inladen.
  useEffect(() => {
    if (!db?.supabase) return
    let cancelled = false
    ;(async () => {
      setLoadingClients(true)
      const { data, error } = await db.supabase
        .from('clients')
        .select('id, first_name, last_name, email, avatar_url')
        .order('first_name', { ascending: true })
      if (cancelled) return
      if (error) console.error('Load clients failed:', error)
      setClients(data || [])
      setLoadingClients(false)
    })()
    return () => { cancelled = true }
  }, [db])

  // History laden wanneer een client wordt geselecteerd.
  useEffect(() => {
    if (!selectedClient?.id || !db?.supabase) { setHistory([]); return }
    let cancelled = false
    ;(async () => {
      setLoadingHistory(true)
      const { data, error } = await db.supabase
        .from('notifications')
        .select('id, title, message, priority, page_context, status, created_at')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false })
        .limit(8)
      if (cancelled) return
      if (error) console.error('Load history failed:', error)
      setHistory(data || [])
      setLoadingHistory(false)
    })()
    return () => { cancelled = true }
  }, [selectedClient?.id, db])

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => {
      const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase()
      return name.includes(q) || (c.email || '').toLowerCase().includes(q)
    })
  }, [clients, search])

  const canSend = title.trim().length >= 2 && message.trim().length >= 3 && selectedClient && !sending

  const handleSend = async () => {
    if (!canSend) return
    setSending(true)
    try {
      const { error } = await db.notifications.sendManualNotification({
        clientId: selectedClient.id,
        coachId,
        title: title.trim(),
        message: message.trim(),
        pageContext,
        priority,
      })
      if (error) throw error
      setToast({ type: 'success', text: 'Notificatie verstuurd' })
      setTitle('')
      setMessage('')
      setPriority('normal')
      setPageContext('all')
      // Refresh history
      const { data } = await db.supabase
        .from('notifications')
        .select('id, title, message, priority, page_context, status, created_at')
        .eq('client_id', selectedClient.id)
        .order('created_at', { ascending: false })
        .limit(8)
      setHistory(data || [])
    } catch (err) {
      console.error('Send notification failed:', err)
      setToast({ type: 'error', text: 'Versturen mislukt — check console.' })
    } finally {
      setSending(false)
      setTimeout(() => setToast(null), 3500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a',
      padding: isMobile ? '1rem' : '1.5rem 2rem',
      paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isMobile ? '1rem' : '1.5rem'})`,
      paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 5rem)`,
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <div style={{
            fontSize: '0.68rem', fontWeight: 800, color: GOLD,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            opacity: 0.85, marginBottom: 6,
          }}>
            Notificaties
          </div>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : '1.9rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.025em', margin: 0,
          }}>
            Stuur een notificatie
          </h1>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.95rem',
            color: 'rgba(255,255,255,0.55)', fontWeight: 600,
            marginTop: 6, marginBottom: 0,
          }}>
            Kies een klant, schrijf je bericht en kies de pagina waar de
            notificatie verschijnt.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '300px 1fr',
          gap: isMobile ? '1rem' : '1.5rem',
        }}>
          {/* LEFT: Client picker */}
          <ClientPicker
            clients={filteredClients}
            loading={loadingClients}
            search={search}
            onSearchChange={setSearch}
            selected={selectedClient}
            onSelect={setSelectedClient}
            isMobile={isMobile}
          />

          {/* RIGHT: Composer + history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
            <Composer
              selectedClient={selectedClient}
              title={title} setTitle={setTitle}
              message={message} setMessage={setMessage}
              priority={priority} setPriority={setPriority}
              pageContext={pageContext} setPageContext={setPageContext}
              canSend={canSend} sending={sending}
              onSend={handleSend}
              isMobile={isMobile}
            />

            {selectedClient && (
              <HistoryList
                history={history}
                loading={loadingHistory}
                isMobile={isMobile}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top, 0px) + 16px)`,
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
          zIndex: 5000,
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {toast.type === 'success'
            ? <Check size={16} strokeWidth={3} />
            : <AlertCircle size={16} strokeWidth={2.6} />}
          {toast.text}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Client picker — scrollbare lijst met search
// ─────────────────────────────────────────────────────────
function ClientPicker({ clients, loading, search, onSearchChange, selected, onSelect, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: isMobile ? '0.75rem' : '0.85rem',
      maxHeight: isMobile ? 320 : 'calc(100vh - 200px)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '0.65rem', fontWeight: 800, color: GOLD,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 8, opacity: 0.85,
      }}>
        <Users size={13} strokeWidth={2.4} /> Klanten · {clients.length}
      </div>

      <div style={{ position: 'relative', marginBottom: 8 }}>
        <Search size={13} strokeWidth={2.4}
          color="rgba(255,255,255,0.4)"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Zoek klant…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem 0.6rem 0.55rem 30px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            color: '#fff', fontSize: '0.85rem', fontWeight: 600,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            Laden…
          </div>
        )}
        {!loading && clients.length === 0 && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            Geen klanten gevonden
          </div>
        )}
        {clients.map(c => {
          const isSel = selected?.id === c.id
          const name = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.email
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.55rem 0.6rem',
                marginBottom: 4,
                background: isSel ? 'rgba(255,215,0,0.12)' : 'transparent',
                border: `1px solid ${isSel ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 8,
                color: '#fff',
                cursor: 'pointer', textAlign: 'left',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: isSel ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${isSel ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontSize: '0.72rem', fontWeight: 900,
                color: isSel ? GOLD : 'rgba(255,255,255,0.7)',
              }}>
                {(c.first_name || c.email || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: isSel ? '#fff' : 'rgba(255,255,255,0.85)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {name}
                </div>
                <div style={{
                  fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {c.email}
                </div>
              </div>
              {isSel && <Check size={14} color={GOLD} strokeWidth={3} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Composer — formulier
// ─────────────────────────────────────────────────────────
function Composer({
  selectedClient,
  title, setTitle,
  message, setMessage,
  priority, setPriority,
  pageContext, setPageContext,
  canSend, sending, onSend,
  isMobile,
}) {
  if (!selectedClient) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px dashed rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: isMobile ? '1.5rem 1rem' : '2.5rem 1.5rem',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: isMobile ? '0.85rem' : '0.95rem',
        fontWeight: 600,
      }}>
        Kies eerst een klant om een bericht te schrijven.
      </div>
    )
  }

  const clientName = `${selectedClient.first_name || ''} ${selectedClient.last_name || ''}`.trim() || selectedClient.email

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: isMobile ? '1rem' : '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.8rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: '0.65rem', fontWeight: 800,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        Bericht voor <span style={{ color: GOLD }}>{clientName}</span>
      </div>

      <input
        type="text"
        placeholder="Titel (bv. Top week!)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
        style={inputStyle(isMobile)}
      />

      <textarea
        placeholder="Bericht aan je klant…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        maxLength={600}
        style={{
          ...inputStyle(isMobile),
          resize: 'vertical', minHeight: 120, fontFamily: 'inherit',
        }}
      />
      <div style={{
        fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
        fontWeight: 600, textAlign: 'right',
      }}>
        {message.length}/600
      </div>

      {/* Pagina-context */}
      <div>
        <div style={labelStyle()}>Verschijnt op</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PAGE_CONTEXTS.map(p => {
            const sel = pageContext === p.id
            const Icon = p.icon
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPageContext(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.45rem 0.7rem',
                  background: sel ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${sel ? 'rgba(255,215,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  color: sel ? GOLD : 'rgba(255,255,255,0.65)',
                  fontSize: '0.75rem', fontWeight: 800,
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={12} strokeWidth={2.4} />
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Prioriteit */}
      <div>
        <div style={labelStyle()}>Prioriteit</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRIORITIES.map(p => {
            const sel = priority === p.id
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPriority(p.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: sel ? `${p.color}20` : 'rgba(0,0,0,0.4)',
                  border: `1px solid ${sel ? `${p.color}80` : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 8,
                  color: sel ? p.color : 'rgba(255,255,255,0.55)',
                  fontSize: '0.75rem', fontWeight: 800,
                  cursor: 'pointer',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onSend}
        disabled={!canSend}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: isMobile ? '0.85rem' : '0.95rem',
          minHeight: 48,
          background: canSend
            ? 'linear-gradient(135deg, #FFD700 0%, #D4AF37 100%)'
            : 'rgba(255,215,0,0.2)',
          color: canSend ? '#0a0a0a' : 'rgba(0,0,0,0.5)',
          border: 'none', borderRadius: 10,
          fontSize: isMobile ? '0.92rem' : '1rem',
          fontWeight: 900, letterSpacing: '0.02em',
          cursor: canSend ? 'pointer' : 'not-allowed',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          boxShadow: canSend ? '0 8px 20px rgba(255,215,0,0.25)' : 'none',
          marginTop: 4,
        }}
      >
        {sending
          ? 'Versturen…'
          : <><Send size={15} strokeWidth={2.6} /> Verstuur notificatie</>}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// History — laatste 8 verstuurde notificaties voor deze client
// ─────────────────────────────────────────────────────────
function HistoryList({ history, loading, isMobile }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: isMobile ? '1rem' : '1.25rem',
    }}>
      <div style={{
        fontSize: '0.65rem', fontWeight: 800,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 10,
      }}>
        Recente notificaties · {history.length}
      </div>

      {loading && (
        <div style={{ padding: '1rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
          Laden…
        </div>
      )}
      {!loading && history.length === 0 && (
        <div style={{ padding: '1rem 0', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem' }}>
          Nog geen notificaties verstuurd
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {history.map(n => {
          const date = new Date(n.created_at)
          const ago = formatAgo(date)
          return (
            <div key={n.id} style={{
              padding: '0.6rem 0.7rem',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 8,
              display: 'flex', flexDirection: 'column', gap: 3,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}>
                <div style={{
                  fontSize: '0.82rem', fontWeight: 800, color: '#fff',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  flex: 1, minWidth: 0,
                }}>
                  {n.title}
                </div>
                <span style={{
                  fontSize: '0.6rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.35)',
                  flexShrink: 0,
                }}>
                  {ago}
                </span>
              </div>
              <div style={{
                fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)',
                fontWeight: 500, lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {n.message}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 2,
              }}>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.25)',
                  color: GOLD,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {n.page_context || 'all'}
                </span>
                {n.status === 'dismissed' && (
                  <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>
                    weggeklikt
                  </span>
                )}
                {n.status === 'active' && (
                  <span style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 700 }}>
                    actief
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
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
  padding: isMobile ? '0.7rem 0.85rem' : '0.8rem 0.95rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#fff',
  fontSize: isMobile ? '0.88rem' : '0.92rem',
  fontWeight: 600,
  outline: 'none',
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
})

const labelStyle = () => ({
  fontSize: '0.6rem', fontWeight: 800,
  color: 'rgba(255,255,255,0.5)',
  textTransform: 'uppercase', letterSpacing: '0.1em',
  marginBottom: 6,
})
