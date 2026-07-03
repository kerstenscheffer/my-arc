// src/modules/notifications/CoachNotificationBell.jsx
// Simple notification bell for CoachHub - reads coach_notifications table
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, ChevronRight, AlertCircle, FileText, Utensils, LifeBuoy, ClipboardCheck } from 'lucide-react'

export default function CoachNotificationBell({ db, isMobile, onNavigate, open: openProp, onOpenChange, onCountChange }) {
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [openInternal, setOpenInternal] = useState(false)
  const isOpen = controlled ? openProp : openInternal
  const setIsOpen = (val) => {
    const next = typeof val === 'function' ? val(isOpen) : val
    if (controlled) onOpenChange(next); else setOpenInternal(next)
  }
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)

  // Load notifications on mount + poll every 30s
  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await db.supabase.auth.getUser()
      if (!user) return

      const { data, error } = await db.supabase
        .from('coach_notifications')
        .select('*')
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('❌ Failed to load coach notifications:', error)
        return
      }

      setNotifications(data || [])
      const unread = (data || []).filter(n => !n.read_status).length
      setUnreadCount(unread)
      if (typeof onCountChange === 'function') onCountChange(unread)
    } catch (err) {
      console.error('❌ Notification load error:', err)
    }
  }

  const markAsRead = async (notificationId) => {
    try {
      await db.supabase
        .from('coach_notifications')
        .update({ read_status: true })
        .eq('id', notificationId)

      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read_status: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('❌ Mark as read failed:', err)
    }
  }

  const markAllRead = async () => {
    try {
      const { data: { user } } = await db.supabase.auth.getUser()
      await db.supabase
        .from('coach_notifications')
        .update({ read_status: true })
        .eq('coach_id', user.id)
        .eq('read_status', false)

      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('❌ Mark all read failed:', err)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'intake_completed': return <FileText size={14} />
      case 'checkin_completed': return <ClipboardCheck size={14} />
      case 'plan_ready': return <Utensils size={14} />
      case 'action_required': return <AlertCircle size={14} />
      case 'support_message': return <LifeBuoy size={14} />
      default: return <Bell size={14} />
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'intake_completed': return '#C9A55A'
      case 'checkin_completed': return '#FFD700'
      case 'plan_ready': return '#10b981'
      case 'action_required': return '#f59e0b'
      case 'support_message': return '#FFD700'
      default: return 'rgba(255,255,255,0.5)'
    }
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'net'
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}u`
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <>
      {/* Side-tab trigger — vertical pill op de rechterrand, zelfde
          patroon als IssueNotesWidget. Verschijnt alleen als dichtgeklapt. */}
      {!controlled && !isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="Meldingen"
          style={{
            position: 'fixed',
            right: 0,
            // Boven IssueNotesWidget (die op 40% staat). Bell op 25%.
            top: '25%',
            transform: 'translateY(-50%)',
            zIndex: 2147483500,
            width: 36, height: 56,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 2,
            background: unreadCount > 0 ? 'rgba(201,165,90,0.18)' : 'rgba(201,165,90,0.08)',
            border: `1px solid ${unreadCount > 0 ? 'rgba(201,165,90,0.45)' : 'rgba(201,165,90,0.22)'}`,
            borderRight: 'none',
            borderRadius: '8px 0 0 8px',
            color: unreadCount > 0 ? '#FFD700' : 'rgba(255,255,255,0.55)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Bell size={15} />
          {unreadCount > 0 && (
            <span style={{ fontSize: '0.55rem', fontWeight: 800 }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Backdrop achter het paneel — klik buiten = sluit */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 2147483545,
          }}
        />
      )}

      {/* Slide-out panel vanaf de rechterrand */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: 0, right: 0, bottom: 0,
            width: 'min(380px, 100vw)',
            background: '#0a0a0a',
            borderLeft: '1px solid rgba(201,165,90,0.2)',
            zIndex: 2147483550,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 24px rgba(0,0,0,0.6)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            animation: 'dropdownSlide 0.2s ease',
          }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Meldingen</span>
              {unreadCount > 0 && (
                <span style={{
                  padding: '0.1rem 0.4rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderRadius: '8px',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  color: '#ef4444'
                }}>{unreadCount} nieuw</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#C9A55A',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    touchAction: 'manipulation'
                  }}
                >
                  Alles gelezen
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  padding: '0.15rem',
                  display: 'flex',
                  touchAction: 'manipulation'
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                textAlign: 'center'
              }}>
                <Bell size={28} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
                  Geen meldingen
                </div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read_status) markAsRead(notif.id)
                    if (notif.action_data?.plan_id && onNavigate) {
                      onNavigate(notif.action_data.plan_id)
                      setIsOpen(false)
                    }
                  }}
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    padding: '0.7rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: notif.read_status ? 'transparent' : 'rgba(201, 165, 90, 0.04)',
                    cursor: notif.read_status ? 'default' : 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: `${getIconColor(notif.type)}15`,
                    border: `1px solid ${getIconColor(notif.type)}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: getIconColor(notif.type)
                  }}>
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '0.75rem',
                      fontWeight: notif.read_status ? 600 : 800,
                      color: notif.read_status ? 'rgba(255,255,255,0.5)' : '#fff',
                      lineHeight: 1.3,
                      marginBottom: '0.15rem'
                    }}>
                      {notif.title}
                    </div>
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255,255,255,0.3)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {notif.message}
                    </div>
                  </div>

                  {/* Time + unread dot */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '0.3rem',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '0.55rem',
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.2)'
                    }}>
                      {timeAgo(notif.created_at)}
                    </span>
                    {!notif.read_status && (
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#C9A55A'
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes bellPulse {
          0%, 100% { transform: scale(1) }
          50% { transform: scale(1.1) }
        }
        @keyframes dropdownSlide {
          from { opacity: 0; transform: translateX(20px) }
          to { opacity: 1; transform: translateX(0) }
        }
      `}</style>
    </>
  )
}
