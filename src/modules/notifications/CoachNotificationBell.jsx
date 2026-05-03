// src/modules/notifications/CoachNotificationBell.jsx
// Simple notification bell for CoachHub - reads coach_notifications table
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, ChevronRight, AlertCircle, FileText, Utensils } from 'lucide-react'

export default function CoachNotificationBell({ db, isMobile, onNavigate }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
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
      setUnreadCount((data || []).filter(n => !n.read_status).length)
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
      case 'plan_ready': return <Utensils size={14} />
      case 'action_required': return <AlertCircle size={14} />
      default: return <Bell size={14} />
    }
  }

  const getIconColor = (type) => {
    switch (type) {
      case 'intake_completed': return '#C9A55A'
      case 'plan_ready': return '#10b981'
      case 'action_required': return '#f59e0b'
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
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: isOpen ? 'rgba(201, 165, 90, 0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${isOpen ? 'rgba(201, 165, 90, 0.3)' : 'rgba(255,255,255,0.06)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.2s ease'
        }}
      >
        <Bell size={18} color={unreadCount > 0 ? '#C9A55A' : 'rgba(255,255,255,0.4)'} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.55rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #000',
            animation: 'bellPulse 2s ease-in-out infinite'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '48px',
          right: 0,
          width: isMobile ? 'calc(100vw - 2rem)' : '360px',
          maxHeight: '480px',
          background: '#0a0a0a',
          border: '1px solid rgba(201, 165, 90, 0.2)',
          borderRadius: '14px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8)',
          overflow: 'hidden',
          zIndex: 1000,
          animation: 'dropdownSlide 0.2s ease'
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
          from { opacity: 0; transform: translateY(-8px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </div>
  )
}
