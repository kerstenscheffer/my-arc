// src/modules/coach-command-center/components/CoachingLogModal.jsx
// v1.1 — Categorieën: algemeen, status, whatsapp, call_prep
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, GripVertical, Minus, Maximize2, Plus, Loader2, MessageCircle, BarChart2, Phone, FileText, History } from 'lucide-react'

const STATUS_OPTIONS = [
  { id: 'on_track',        label: 'Op schema',      color: '#FFD700' },
  { id: 'crushing_it',     label: 'On fire 🔥',     color: '#10b981' },
  { id: 'needs_attention', label: 'Aandacht nodig', color: '#f59e0b' },
  { id: 'off_track',       label: 'Off track',       color: '#ef4444' },
]

const CATEGORIES = [
  { id: 'algemeen',   label: 'Algemeen',   icon: FileText,       color: '#FFD700' },
  { id: 'status',     label: 'Status',     icon: BarChart2,      color: '#10b981' },
  { id: 'whatsapp',   label: 'WhatsApp',   icon: MessageCircle,  color: '#25D366' },
  { id: 'call_prep',  label: 'Call prep',  icon: Phone,          color: '#6366f1' },
  // Auto-log entries die geschreven worden wanneer de coach doel of macro's
  // van de client aanpast (zie clientChangeLogger). Heeft een ander icoon
  // zodat ze in de tijdlijn duidelijk onderscheidbaar zijn van handmatige
  // notes.
  { id: 'change_log', label: 'Wijziging',  icon: History,        color: '#a855f7' },
]

const DEFAULT_SIZE = { w: 400, h: 620 }
// Gecentreerd openen zodat de modal midden in beeld verschijnt (was rechtsboven,
// wat op sommige schermen weggevallen leek — "opent niet").
const DEFAULT_POS  = {
  x: Math.max(12, Math.round((window.innerWidth  - DEFAULT_SIZE.w) / 2)),
  y: Math.max(20, Math.round((window.innerHeight - DEFAULT_SIZE.h) / 2)),
}
const MIN_SIZE     = { w: 320, h: 300 }

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) +
    ' · ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

export default function CoachingLogModal({ client, db, coachId, onClose, isMobile, onLogSaved }) {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [note, setNote]           = useState('')
  const [status, setStatus]       = useState('on_track')
  const [category, setCategory]   = useState('algemeen')
  const [filterCat, setFilterCat] = useState('all')
  const [pos, setPos]             = useState(isMobile ? { x: 0, y: 0 } : DEFAULT_POS)
  const [size, setSize]           = useState(isMobile ? { w: window.innerWidth, h: window.innerHeight } : DEFAULT_SIZE)
  const [minimized, setMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const resizeStart  = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const textareaRef  = useRef(null)

  useEffect(() => { loadLogs() }, [client.id])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await db.supabase
        .from('client_coaching_logs')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(100)
      if (!error) {
        setLogs(data || [])
        if (data?.length > 0) setStatus(data[0].status || 'on_track')
      }
    } catch (e) { console.error('❌ loadLogs:', e) }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!note.trim()) return
    setSaving(true)
    try {
      const { data, error } = await db.supabase
        .from('client_coaching_logs')
        .insert({ client_id: client.id, coach_id: coachId || null, status, note: note.trim(), category })
        .select().single()
      if (!error && data) {
        setLogs(prev => [data, ...prev])
        setNote('')
        onLogSaved?.(data)
      }
    } catch (e) { console.error('❌ save log:', e) }
    setSaving(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
  }

  // ── Drag ──
  const onDragStart = useCallback((e) => {
    if (isMobile) return
    e.preventDefault()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: cx - pos.x, y: cy - pos.y }
    setIsDragging(true)
  }, [pos, isMobile])

  const onDragMove = useCallback((e) => {
    if (!isDragging) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setPos({
      x: Math.max(0, Math.min(window.innerWidth  - size.w, cx - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 60,     cy - dragOffset.current.y))
    })
  }, [isDragging, size])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  // ── Resize ──
  const onResizeStart = useCallback((e) => {
    if (isMobile) return
    e.preventDefault(); e.stopPropagation()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    resizeStart.current = { x: cx, y: cy, w: size.w, h: size.h }
    setIsResizing(true)
  }, [size, isMobile])

  const onResizeMove = useCallback((e) => {
    if (!isResizing) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setSize({
      w: Math.max(MIN_SIZE.w, resizeStart.current.w + cx - resizeStart.current.x),
      h: Math.max(MIN_SIZE.h, resizeStart.current.h + cy - resizeStart.current.y)
    })
  }, [isResizing])

  const onResizeEnd = useCallback(() => setIsResizing(false), [])

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const move = isDragging ? onDragMove : onResizeMove
    const end  = isDragging ? onDragEnd  : onResizeEnd
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup',   end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend',  end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup',   end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend',  end)
    }
  }, [isDragging, isResizing, onDragMove, onResizeMove, onDragEnd, onResizeEnd])

  const filteredLogs = filterCat === 'all' ? logs : logs.filter(l => (l.category || 'algemeen') === filterCat)

  const modal = (
    <div style={{
      position: 'fixed',
      left: isMobile ? 0 : pos.x,
      top:  isMobile ? 0 : pos.y,
      width:  isMobile ? '100vw' : size.w,
      height: isMobile ? '100dvh' : (minimized ? 'auto' : size.h),
      // Bumped above any other modal in the app. Some recent screens added
      // overlays with their own stacking contexts that ended up over this
      // floating panel — push it above all of them.
      zIndex: 2147483000,
      isolation: 'isolate',
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a',
      border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)',
      borderRadius: isMobile ? 0 : '10px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      cursor: isDragging ? 'grabbing' : 'default',
    }}>

      {/* Gold accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, #FFD700, #D4AF37, #FFD700)', opacity: 0.6, flexShrink: 0 }} />

      {/* Header */}
      <div
        onMouseDown={!isMobile ? onDragStart : undefined}
        onTouchStart={!isMobile ? onDragStart : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: isMobile ? 'default' : 'grab',
          flexShrink: 0, userSelect: 'none'
        }}
      >
        {!isMobile && <GripVertical size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />}
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {client.first_name} {client.last_name}
        </span>
        <span style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          LOGBOEK
        </span>
        {!isMobile && <button onClick={() => setMinimized(p => !p)} style={iconBtnStyle}><Minus size={10} /></button>}
        {!isMobile && <button onClick={() => { setPos(DEFAULT_POS); setSize(DEFAULT_SIZE) }} style={iconBtnStyle}><Maximize2 size={10} /></button>}
        <button onClick={onClose} style={{ ...iconBtnStyle, marginLeft: '0.125rem' }}><X size={10} /></button>
      </div>

      {!minimized && (
        <>
          {/* ── Nieuwe entry ── */}
          <div style={{ padding: '0.625rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>

            {/* Categorie selector */}
            <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon
                const active = category === cat.id
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    flex: 1, padding: '0.25rem 0.15rem',
                    background: active ? `${cat.color}15` : 'transparent',
                    border: active ? `1px solid ${cat.color}40` : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    color: active ? cat.color : 'rgba(255,255,255,0.2)',
                    fontSize: '0.48rem', fontWeight: 700,
                    cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}>
                    <CatIcon size={9} />{cat.label}
                  </button>
                )
              })}
            </div>

            {/* Status selector — alleen bij algemeen of status */}
            {(category === 'status' || category === 'algemeen') && (
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{
                    flex: 1, padding: '0.2rem 0.1rem',
                    background: status === s.id ? `${s.color}18` : 'transparent',
                    border: status === s.id ? `1px solid ${s.color}40` : '1px solid rgba(255,255,255,0.04)',
                    borderRadius: '4px',
                    color: status === s.id ? s.color : 'rgba(255,255,255,0.2)',
                    fontSize: '0.45rem', fontWeight: 700,
                    cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '24px', lineHeight: 1.2,
                    transition: 'all 0.15s ease'
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                category === 'whatsapp'  ? `WhatsApp bericht voor ${client.first_name}...` :
                category === 'call_prep' ? `Call voorbereiding voor ${client.first_name}...` :
                category === 'status'    ? `Huidige situatie van ${client.first_name}...` :
                `Notitie voor ${client.first_name}... (⌘+Enter)`
              }
              rows={3}
              style={{
                width: '100%', resize: 'none', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${CATEGORIES.find(c => c.id === category)?.color}25`,
                borderRadius: '6px',
                color: '#fff', fontSize: '0.75rem', lineHeight: 1.5,
                padding: '0.5rem 0.625rem',
                outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.375rem' }}>
              <button onClick={handleSave} disabled={!note.trim() || saving} style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem',
                padding: '0.35rem 0.75rem',
                background: note.trim() ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)',
                border: note.trim() ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '6px',
                color: note.trim() ? '#FFD700' : 'rgba(255,255,255,0.2)',
                fontSize: '0.7rem', fontWeight: 700,
                cursor: note.trim() ? 'pointer' : 'default',
                opacity: saving ? 0.5 : 1,
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                minHeight: '32px', transition: 'all 0.15s ease'
              }}>
                {saving ? <Loader2 size={11} style={{ animation: 'logSpin 1s linear infinite' }} /> : <Plus size={11} />}
                Opslaan
              </button>
            </div>
          </div>

          {/* ── Filter strip ── */}
          <div style={{
            display: 'flex', gap: '0.2rem', padding: '0.35rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none'
          }}>
            <button onClick={() => setFilterCat('all')} style={{
              padding: '0.15rem 0.4rem', borderRadius: '3px', border: 'none',
              background: filterCat === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filterCat === 'all' ? '#fff' : 'rgba(255,255,255,0.25)',
              fontSize: '0.48rem', fontWeight: 700, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
            }}>
              Alle <span style={{ opacity: 0.5 }}>{logs.length}</span>
            </button>
            {CATEGORIES.map(cat => {
              const CatIcon = cat.icon
              const count = logs.filter(l => (l.category || 'algemeen') === cat.id).length
              if (count === 0) return null
              return (
                <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.15rem',
                  padding: '0.15rem 0.4rem', borderRadius: '3px', border: 'none',
                  background: filterCat === cat.id ? `${cat.color}15` : 'transparent',
                  color: filterCat === cat.id ? cat.color : 'rgba(255,255,255,0.25)',
                  fontSize: '0.48rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
                }}>
                  <CatIcon size={9} />{cat.label} <span style={{ opacity: 0.5 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* ── Entries ── */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <style>{`@keyframes logSpin { to { transform: rotate(360deg); } }`}</style>

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px', gap: '0.4rem' }}>
                <Loader2 size={14} color="rgba(255,215,0,0.4)" style={{ animation: 'logSpin 1s linear infinite' }} />
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem', opacity: 0.3 }}>📝</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>
                  {filterCat === 'all' ? 'Nog geen logboek entries' : `Geen ${CATEGORIES.find(c => c.id === filterCat)?.label} notities`}
                </div>
              </div>
            ) : filteredLogs.map((log, i) => {
              const s   = STATUS_OPTIONS.find(o => o.id === log.status) || STATUS_OPTIONS[0]
              const cat = CATEGORIES.find(c => c.id === (log.category || 'algemeen')) || CATEGORIES[0]
              const CatIcon = cat.icon
              const isFirst = i === 0
              return (
                <div key={log.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: `2px solid ${cat.color}`,
                  marginLeft: '0.75rem', marginRight: '0.75rem',
                  marginTop: i === 0 ? '0.5rem' : '0',
                  borderRadius: '0 4px 4px 0',
                  background: isFirst ? `${cat.color}05` : 'transparent',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.5rem 0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
                        fontSize: '0.4rem', fontWeight: 700, color: cat.color,
                        background: `${cat.color}15`, padding: '0.08rem 0.3rem', borderRadius: '2px',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        <CatIcon size={8} />{cat.label}
                      </span>
                      {(log.category === 'status' || log.category === 'algemeen' || !log.category) && (
                        <span style={{
                          fontSize: '0.4rem', fontWeight: 700, color: s.color,
                          background: `${s.color}12`, padding: '0.08rem 0.3rem', borderRadius: '2px',
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {s.label}
                        </span>
                      )}
                      <div style={{ flex: 1 }} />
                      <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.18)', fontWeight: 500 }}>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                    <p style={{
                      margin: 0, fontSize: '0.72rem',
                      color: isFirst ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)',
                      lineHeight: 1.55, fontWeight: isFirst ? 500 : 400,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {log.note}
                    </p>
                  </div>
                </div>
              )
            })}
            <div style={{ height: '1rem' }} />
          </div>
        </>
      )}

      {!isMobile && !minimized && (
        <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} style={{
          position: 'absolute', bottom: 0, right: 0,
          width: '16px', height: '16px', cursor: 'se-resize',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '3px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRight: '2px solid rgba(255,255,255,0.15)', borderBottom: '2px solid rgba(255,255,255,0.15)', borderRadius: '0 0 2px 0' }} />
        </div>
      )}
    </div>
  )

  return createPortal(
    <>
      {/* Gedimde achtergrond — maakt zichtbaar dát de modal open is en sluit
          bij klik ernaast. Net onder de modal-z-index. */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 2147482999,
        }}
      />
      {modal}
    </>,
    document.body
  )
}

const iconBtnStyle = {
  width: '20px', height: '20px', borderRadius: '3px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  padding: 0
}
