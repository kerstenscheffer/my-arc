// src/modules/coach-command-center/components/CoachingLogModal.jsx
// v1.1 — Categorieën: algemeen, status, whatsapp, call_prep
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import CallBlad from '../../business-os/CallBlad'
import { callHeeftInhoud } from '../../business-os/callBladData'
import { X, GripVertical, Minus, Maximize2, Plus, Loader2, Phone, FileText, History, Rocket, Check } from 'lucide-react'

const STATUS_OPTIONS = [
  { id: 'on_track',        label: 'Op schema',      color: '#FFD700' },
  { id: 'crushing_it',     label: 'On fire 🔥',     color: '#10b981' },
  { id: 'needs_attention', label: 'Aandacht nodig', color: '#f59e0b' },
  { id: 'off_track',       label: 'Off track',       color: '#ef4444' },
]

// Status, WhatsApp en Call prep zijn eruit: die werden niet gebruikt en
// maakten de bovenrand vol. Bestaande items in die categorieen blijven in de
// tijdlijn staan — zie CATEGORIE_LABEL hieronder — ze zijn alleen niet meer
// te kiezen bij het schrijven.
//
// Alles in wit. De kleuren per categorie waren de enige reden dat dit scherm
// er bont uitzag; wat telt is welk tabblad actief is, en dat lees je aan vet
// wit tegen dof wit.
// 6 nov 2026: de formulieren Check-in (3x gebruikt) en Onboarding (nooit) zijn
// eruit. Het logboek is nu het call-scherm: tab Call met Gino's voorbereiding
// en de vaste structuur, tab Notities met het notitieveld en de tijdlijn.
// Oude check-in- en onboarding-items blijven gewoon in de tijdlijn staan.
const CATEGORIES = [
  { id: 'algemeen',   label: 'Algemeen',   icon: FileText },
  { id: 'checkin',    label: 'Check-in',   icon: Phone },
  { id: 'onboarding', label: 'Onboarding', icon: Rocket },
]

// Vaste volgorde van een check-in call (skill Call-voorbereiding).
const CALL_STAPPEN = [
  'Hoe gaat het, hoe zit je erin?',
  'Voeding',
  'Training',
  'Punten van Gino',
  'Struggles en oude issues: hoe gaat het nu?',
  'Terug naar het doel: past wat je doet bij wat je wilt?',
  'Komende week concreet: wat ga je doen?',
  'Nog vragen of iets onduidelijk?',
  'Volgende call inplannen: goed over 2 weken, niet goed over 1 week',
]

const KLEUR_GROEP = { aandacht: '#ef4444', vervolg: '#f59e0b', goed: '#22c55e' }
const T_LABEL = { fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }

// Tab Call: Gino's voorbereiding (checkin_ronde_items, laatste 3 dagen) en de
// structuur om af te vinken. Afvinken is alleen voor tijdens de call en wordt
// niet bewaard: het transcript doet achteraf de verslaglegging.
function CallVoorbereiding({ client, db }) {
  const [item, setItem] = useState(undefined)
  const [gedaan, setGedaan] = useState(() => new Set())
  useEffect(() => {
    let weg = false
    const van = new Date(); van.setDate(van.getDate() - 3)
    db.supabase.from('checkin_ronde_items').select('ronde_datum, groep, suggesties')
      .eq('client_id', client.id).gte('ronde_datum', van.toLocaleDateString('sv-SE'))
      .lte('ronde_datum', new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' }))
      .order('ronde_datum', { ascending: false }).limit(3)
      .then(({ data }) => {
        if (weg) return
        const lijst = data || []
        setItem(lijst.find(r => callHeeftInhoud(r.suggesties?.call)) || lijst[0] || null)
      }, () => { if (!weg) setItem(null) })
    return () => { weg = true }
  }, [client.id, db])
  const s = item?.suggesties || {}
  const call = s.call
  const doel = client.primary_goal || client.goal
  const wissel = (i) => setGedaan(g => { const n = new Set(g); if (n.has(i)) n.delete(i); else n.add(i); return n })
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.75rem 0.875rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {item === undefined ? (
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Laden…</div>
      ) : (
        <>
          {item && (s.reden || s.actie) && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...T_LABEL }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: KLEUR_GROEP[item.groep] || 'rgba(255,255,255,0.3)' }} />
                Status
              </div>
              {s.reden && <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.45 }}>{s.reden}</div>}
              {s.actie && <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, marginTop: 2 }}>{s.actie}</div>}
            </div>
          )}
          {callHeeftInhoud(call) ? <CallBlad call={doel && !call.doel ? { ...call, doel } : call} /> : (
            <div>
              {doel && <><div style={T_LABEL}>Doel</div><div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fff', marginBottom: 12 }}>{doel}</div></>}
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Nog geen voorbereiding. Gino zet die klaar op de ochtend van de call.
              </div>
            </div>
          )}
          <div>
            <div style={T_LABEL}>Structuur</div>
            {CALL_STAPPEN.map((t, i) => {
              const aan = gedaan.has(i)
              return (
                <button key={i} type="button" onClick={() => wissel(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 36, padding: '0 2px',
                  background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: aan ? '#22c55e' : 'transparent', boxShadow: aan ? 'none' : 'inset 0 0 0 1.5px rgba(255,255,255,0.25)',
                  }}>{aan && <Check size={12} strokeWidth={3} color="#000" />}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: aan ? 'rgba(255,255,255,0.35)' : '#fff', textDecoration: aan ? 'line-through' : 'none' }}>
                    {i + 1}. {t}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// Voor het tonen van bestaande items, ook uit categorieen die je niet meer
// kunt kiezen. Zonder deze lijst zou een oud WhatsApp-item naamloos worden.
const CATEGORIE_LABEL = {
  algemeen: 'Algemeen', checkin: 'Check-in', onboarding: 'Onboarding', change_log: 'Wijziging',
  status: 'Status', whatsapp: 'WhatsApp', call_prep: 'Call prep',
}

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

// `inline`: geen zwevend venster maar een paneel dat de ruimte van zijn
// ouder vult. Zo staat het logboek als tabblad in Coach Insight naast
// gewicht en training, in plaats van als los venster erbovenop.
export default function CoachingLogModal({ client, db, coachId, onClose, isMobile, onLogSaved, inline = false }) {
  const modalHost = useModalHost()
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [note, setNote]           = useState('')
  const [status, setStatus]       = useState('on_track')
  const category = 'algemeen'
  // Wijzigingen (automatisch, 9 van de 10 items) standaard niet in de tijdlijn.
  const [filterCat, setFilterCat] = useState('notities')
  const [weergave, setWeergave]   = useState('call')
  const [pos, setPos]             = useState(isMobile ? { x: 0, y: 0 } : DEFAULT_POS)
  const [size, setSize]           = useState(isMobile ? { w: window.innerWidth, h: window.innerHeight } : DEFAULT_SIZE)
  const [minimized, setMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const resizeStart  = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const textareaRef  = useRef(null)

  useEffect(() => { loadLogs() }, [client.id])

  // Escape sluit. Klikken naast het venster deed dat vroeger; die weg is
  // dicht sinds de gedimde achtergrond eruit is. Zonder dit blijft alleen het
  // kruisje over, en dat is lastig als je het venster half buiten beeld hebt
  // gesleept.
  //
  // Niet sluiten terwijl je in een veld staat: dan is Escape bedoeld om je
  // invoer te laten staan, niet om je hele check-in weg te gooien.
  useEffect(() => {
    const opToets = (e) => {
      if (e.key !== 'Escape') return
      const t = document.activeElement?.tagName
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return
      onClose?.()
    }
    window.addEventListener('keydown', opToets)
    return () => window.removeEventListener('keydown', opToets)
  }, [onClose])

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
      if (error) throw error
      if (data) setLogs(prev => [data, ...prev])
      else await loadLogs()
      setNote('')
      onLogSaved?.(data)
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

  const isNotitie = (l) => (l.category || 'algemeen') !== 'change_log'
  const filteredLogs = filterCat === 'all' ? logs
    : filterCat === 'notities' ? logs.filter(isNotitie)
    : logs.filter(l => (l.category || 'algemeen') === filterCat)

  const zwevend = !inline
  const modal = (
    <div style={zwevend ? {
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
      // Zwaardere schaduw nu de gedimde achtergrond weg is: dat is wat het
      // venster nog van de pagina eronder scheidt.
      boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
      cursor: isDragging ? 'grabbing' : 'default',
    } : {
      // Als tabblad: vult de kolom, geen rand of schaduw.
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>

      {zwevend && (
        <>
          {/* Gold accent line */}
          <div style={{ height: '2px', background: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />

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
        </>
      )}

      {!minimized && (
        <>
          {/* Tabs: Call (voorbereiding + structuur) en Notities. */}
          <div style={{ display: 'flex', gap: '0.25rem', padding: '0.625rem 0.75rem 0', flexShrink: 0 }}>
            {[['call', 'Call', Phone], ['notities', 'Notities', FileText]].map(([id, label, Icoon]) => {
              const aan = weergave === id
              return (
                <button key={id} type="button" onClick={() => setWeergave(id)} style={{
                  flex: 1, minHeight: 30, borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: aan ? '#fff' : 'transparent', color: aan ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                  boxShadow: aan ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                  fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>
                  {Icoon === Phone ? <Phone size={12} /> : <FileText size={12} />}{label}
                </button>
              )
            })}
          </div>

          {weergave === 'call' ? <CallVoorbereiding client={client} db={db} /> : (<>
          {/* ── Nieuwe notitie ── */}
          <div style={{
            padding: '0.625rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flex: '0 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>

            {/* Statuskeuze hoort bij een notitie, niet bij de check-in:
                daar bepaalt de snelle check hierboven al hoe het ervoor staat. */}
            {(
              <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
                {STATUS_OPTIONS.map(s => (
                  <button key={s.id} onClick={() => setStatus(s.id)} style={{
                    flex: 1, padding: '0.2rem 0.1rem',
                    background: status === s.id ? '#fff' : 'transparent',
                    border: `1px solid ${status === s.id ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: '6px',
                    color: status === s.id ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.62rem', fontWeight: 800,
                    cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '28px', lineHeight: 1.2,
                    transition: 'all 0.15s ease'
                  }}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {(
              <>
                <textarea
                  ref={textareaRef}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Notitie voor ${client.first_name}… (⌘+Enter)`}
                  rows={3}
                  style={{
                    width: '100%', resize: 'none', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: '6px',
                    color: '#fff', fontSize: '0.78rem', lineHeight: 1.5,
                    padding: '0.5rem 0.625rem',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.375rem' }}>
                  <button onClick={handleSave} disabled={!note.trim() || saving} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    padding: '0.4rem 0.9rem',
                    background: note.trim() ? '#fff' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: '6px',
                    color: note.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.25)',
                    fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit',
                    cursor: note.trim() ? 'pointer' : 'default',
                    opacity: saving ? 0.5 : 1,
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '32px',
                  }}>
                    {saving ? <Loader2 size={11} style={{ animation: 'logSpin 1s linear infinite' }} /> : <Plus size={11} />}
                    Opslaan
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Filter strip ── */}
          <div style={{
            display: 'flex', gap: '0.2rem', padding: '0.35rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none'
          }}>
            {[['notities', 'Notities', logs.filter(isNotitie).length], ['all', 'Alles', logs.length]].map(([id, label, n]) => (
              <button key={id} onClick={() => setFilterCat(id)} style={{
                padding: '0.15rem 0.4rem', borderRadius: '3px', border: 'none',
                background: filterCat === id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: filterCat === id ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
              }}>
                {label} <span style={{ opacity: 0.5 }}>{n}</span>
              </button>
            ))}
            {/* Ook categorieen die je niet meer kunt kiezen, zolang er nog
                items in zitten. Anders zijn oude notities onvindbaar. */}
            {Object.keys(CATEGORIE_LABEL).map(id => {
              const cat = CATEGORIES.find(c => c.id === id) || { id, label: CATEGORIE_LABEL[id], icon: History }
              const CatIcon = cat.icon
              const count = logs.filter(l => (l.category || 'algemeen') === cat.id).length
              if (count === 0) return null
              return (
                <button key={cat.id} onClick={() => setFilterCat(cat.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '0.15rem',
                  padding: '0.15rem 0.4rem', borderRadius: '3px', border: 'none',
                  background: filterCat === cat.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: filterCat === cat.id ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
                }}>
                  <CatIcon size={9} />{cat.label} <span style={{ opacity: 0.5 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* ── Entries ── */}
          {/* Tijdens een formulier ben je aan het invullen, niet aan het
              terugkijken. De tijdlijn geeft dan ruimte af aan het formulier
              maar blijft bereikbaar door te scrollen. */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          }}>
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
                  {filterCat === 'all' || filterCat === 'notities' ? 'Nog geen notities' : `Geen ${CATEGORIE_LABEL[filterCat] || filterCat} notities`}
                </div>
              </div>
            ) : filteredLogs.map((log, i) => {
              const s   = STATUS_OPTIONS.find(o => o.id === log.status) || STATUS_OPTIONS[0]
              const catId = log.category || 'algemeen'
              const cat = CATEGORIES.find(c => c.id === catId)
                || { id: catId, label: CATEGORIE_LABEL[catId] || catId, icon: History }
              const CatIcon = cat.icon
              const isFirst = i === 0
              return (
                <div key={log.id} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: '2px solid rgba(255,255,255,0.2)',
                  marginLeft: '0.75rem', marginRight: '0.75rem',
                  marginTop: i === 0 ? '0.5rem' : '0',
                  borderRadius: '0 4px 4px 0',
                  background: isFirst ? 'rgba(255,255,255,0.03)' : 'transparent',
                  overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.5rem 0.625rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.15rem',
                        fontSize: '0.55rem', fontWeight: 900, color: '#fff',
                        background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.35rem', borderRadius: '3px',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        <CatIcon size={9} />{cat.label}
                      </span>
                      {(log.category === 'status' || log.category === 'algemeen' || !log.category) && (
                        <span style={{
                          fontSize: '0.55rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)',
                          background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '3px',
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
          </>)}
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

  // Geen gedimde achtergrond meer.
  //
  // Die lag over het hele scherm en ving elke klik op, waardoor je niets
  // anders kon doen zolang het logboek openstond. Precies verkeerd voor een
  // venster dat je juist naast je werk wilt hebben: je slaat het logboek erop
  // na terwijl je in de plananalyzer of de agenda bezig bent.
  //
  // Het is een zwevend venster met een eigen rand, schaduw en sluitknop — dat
  // je het kunt verslepen zegt genoeg over dat het bovenop ligt. Wat je
  // inlevert is sluiten door ernaast te klikken; dat gaat nu via het kruisje.
  //
  // Op een telefoon vult het scherm zich toch helemaal, dus daar veranderde
  // de achtergrond sowieso niets.
  if (inline) return modal
  return createPortal(modal, modalHost)
}

const iconBtnStyle = {
  width: '20px', height: '20px', borderRadius: '3px',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
  padding: 0
}
