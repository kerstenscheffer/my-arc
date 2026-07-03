// src/modules/notifications/InlineNotifications.jsx
//
// Inline-weergave van actieve notificaties bovenaan een client-pagina.
// Trekt notifications waar page_context = 'all' OF de pagina-slug die we
// meegeven. Toont elke melding als card met dismiss-actie.

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, AlertCircle, Zap } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'

const PRIORITY_STYLES = {
  low:    { border: 'rgba(255,255,255,0.1)',  accent: 'rgba(255,255,255,0.5)', label: null },
  normal: { border: 'rgba(255,215,0,0.28)',   accent: '#FFD700',                label: null },
  high:   { border: 'rgba(245,158,11,0.45)',  accent: '#f59e0b',                label: 'Belangrijk' },
  urgent: { border: 'rgba(239,68,68,0.5)',    accent: '#ef4444',                label: 'Urgent' },
}

export default function InlineNotifications({ db, client, pageContext = 'home' }) {
  const isMobile = useIsMobile()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const clientPk = client?.id || null

  const load = useCallback(async () => {
    if (!clientPk || !db?.supabase) { setLoading(false); return }
    try {
      // Pak actieve notifications voor de page-context én 'all'.
      const { data, error } = await db.supabase
        .from('notifications')
        .select('id, title, message, page_context, priority, created_at, status, read_at')
        .eq('client_id', clientPk)
        .eq('status', 'active')
        .in('page_context', [pageContext, 'all'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)
      if (error) { console.error('Load notifications failed:', error); return }
      setItems(data || [])
    } finally {
      setLoading(false)
    }
  }, [clientPk, db, pageContext])

  useEffect(() => { load() }, [load])

  const dismiss = async (id) => {
    // Optimistic
    setItems(prev => prev.filter(n => n.id !== id))
    try {
      if (db?.notifications?.dismissNotification) {
        await db.notifications.dismissNotification(id)
      } else {
        await db.supabase
          .from('notifications')
          .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
          .eq('id', id)
      }
    } catch (err) {
      console.error('Dismiss failed:', err)
      load() // herstel state bij fout
    }
  }

  if (loading || items.length === 0) return null

  return (
    <div style={{
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {items.map(n => {
        const p = PRIORITY_STYLES[n.priority] || PRIORITY_STYLES.normal
        const isUrgent = n.priority === 'urgent'
        const isHigh = n.priority === 'high'
        return (
          <div
            key={n.id}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${p.border}`,
              borderLeft: `3px solid ${p.accent}`,
              borderRadius: 12,
              padding: isMobile ? '0.85rem 0.95rem' : '1rem 1.15rem',
              display: 'flex', gap: 12,
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${p.accent}1a`,
              border: `1px solid ${p.accent}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: p.accent,
              flexShrink: 0,
            }}>
              {isUrgent
                ? <AlertCircle size={15} strokeWidth={2.6} />
                : isHigh
                  ? <Zap size={15} strokeWidth={2.6} />
                  : <Bell size={14} strokeWidth={2.4} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                marginBottom: 3,
              }}>
                <div style={{
                  fontSize: isMobile ? '0.92rem' : '1rem',
                  fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.015em',
                }}>
                  {n.title}
                </div>
                {p.label && (
                  <span style={{
                    fontSize: '0.55rem', fontWeight: 800,
                    color: p.accent, background: `${p.accent}1a`,
                    border: `1px solid ${p.accent}50`,
                    padding: '2px 6px', borderRadius: 4,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {p.label}
                  </span>
                )}
              </div>
              <div style={{
                fontSize: isMobile ? '0.82rem' : '0.88rem',
                color: 'rgba(255,255,255,0.75)',
                fontWeight: 500, lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
              }}>
                {n.message}
              </div>
            </div>
            <button
              onClick={() => dismiss(n.id)}
              aria-label="Wegklikken"
              style={{
                width: 26, height: 26, borderRadius: 6,
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
