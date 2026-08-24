// src/modules/notifications/RecipientsModal.jsx
// "Naar wie is deze melding gegaan?" — gedeeld door de vaste meldingen en de
// geplande regels. Welke bron gebruikt wordt hangt af van wat je meegeeft:
//   scheduleId → get_schedule_recipients      (verzendlog van een regel)
//   fixedKey   → get_fixed_notification_recipients (afgeleid uit de meldingen)
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, User } from 'lucide-react'

const GOLD = '#FFD700'

const fmt = (iso) => {
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

export default function RecipientsModal({ db, title, scheduleId, fixedKey, isMobile, onClose }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const { data, error: e } = scheduleId
          ? await db.supabase.rpc('get_schedule_recipients', { p_schedule_id: scheduleId, p_limit: 100 })
          : await db.supabase.rpc('get_fixed_notification_recipients', { p_key: fixedKey, p_limit: 100 })
        if (e) throw e
        if (alive) setRows(data || [])
      } catch (e) {
        console.error('Ontvangers laden mislukt:', e)
        if (alive) { setError(e.message || 'Laden mislukt'); setRows([]) }
      }
    })()
    return () => { alive = false }
  }, [db, scheduleId, fixedKey])

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 12500, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '1.5rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: isMobile ? '80vh' : '75vh', display: 'flex', flexDirection: 'column', background: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '16px 16px 0 0' : 16, overflow: 'hidden' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 1rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
              {rows === null ? 'Laden…' : `${rows.length} verstuurd`}
            </div>
          </div>
          <button onClick={onClose} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {rows === null ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Laden…</div>
          ) : error ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#ef4444', fontSize: '0.8rem' }}>{error}</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
              Nog nooit verstuurd.
            </div>
          ) : rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 1rem', borderBottom: i === rows.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ flexShrink: 0, width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,215,0,0.1)', border: `1px solid ${GOLD}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={12} color={GOLD} />
              </div>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.82rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.naam?.trim() || 'Onbekend'}
              </span>
              <span style={{ flexShrink: 0, fontSize: '0.66rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{fmt(r.sent_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
