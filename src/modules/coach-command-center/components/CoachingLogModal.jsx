// src/modules/coach-command-center/components/CoachingLogModal.jsx
// v1.1 — Categorieën: algemeen, status, whatsapp, call_prep
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import CheckinFlow from './CheckinFlow'
import { LEEG as CHECKIN_LEEG, samenvatting, heeftInhoud } from './checkinData'
import { X, GripVertical, Minus, Maximize2, Plus, Loader2, MessageCircle, BarChart2, Phone, FileText, History } from 'lucide-react'

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
const CATEGORIES = [
  { id: 'algemeen', label: 'Algemeen', icon: FileText },
  { id: 'checkin',  label: 'Check-in', icon: Phone },
]

// Voor het tonen van bestaande items, ook uit categorieen die je niet meer
// kunt kiezen. Zonder deze lijst zou een oud WhatsApp-item naamloos worden.
const CATEGORIE_LABEL = {
  algemeen: 'Algemeen', checkin: 'Check-in', change_log: 'Wijziging',
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

export default function CoachingLogModal({ client, db, coachId, onClose, isMobile, onLogSaved }) {
  const modalHost = useModalHost()
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [note, setNote]           = useState('')
  const [status, setStatus]       = useState('on_track')
  const [category, setCategory]   = useState('algemeen')
  const [filterCat, setFilterCat] = useState('all')
  // De check-in staat los van het notitieveld: het is een formulier, geen
  // regel tekst. Wordt bij opslaan één logboek-item.
  const [checkin, setCheckin] = useState(CHECKIN_LEEG)
  // undefined = concept nog niet opgehaald. Belangrijk onderscheid: pas ná
  // het laden mag er bewaard worden, anders overschrijft een leeg formulier
  // het concept dat er stond voordat het binnen was.
  const [conceptGeladen, setConceptGeladen] = useState(false)
  const [conceptStand, setConceptStand] = useState('')  // '', 'bezig', 'bewaard'
  const bewaarTimer = useRef(null)
  // Laatste stand vasthouden voor het afsluiten. De bewaar-pauze wordt bij
  // het sluiten afgebroken; zonder dit ben je het laatste dat je typte kwijt
  // als je binnen een seconde het kruisje pakt.
  const laatste = useRef({ vuil: false })
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

  // Lopend concept ophalen bij het openen.
  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let leeft = true
    db.supabase
      .from('checkin_drafts').select('data')
      .eq('coach_id', coachId || '00000000-0000-0000-0000-000000000000')
      .eq('client_id', client.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!leeft) return
        if (data?.data && Object.keys(data.data).length) setCheckin({ ...CHECKIN_LEEG, ...data.data })
        setConceptGeladen(true)
      }, () => { if (leeft) setConceptGeladen(true) })
    return () => { leeft = false }
  }, [db, client?.id, coachId])

  // Bewaren met een pauze van een seconde. Bij elke toetsaanslag schrijven is
  // zonde van de verbinding; een seconde stilte betekent dat je even nadenkt
  // of naar een ander veld gaat, en dat is een prima moment.
  useEffect(() => {
    if (!conceptGeladen || !db?.supabase || !client?.id || !coachId) return

    // Leeg formulier hoeft niet bewaard: anders legt het openen van dit
    // venster voor elke klant een lege rij aan. Stond er wél iets en heb je
    // het weer weggehaald, dan hoort het concept ook echt weg te zijn.
    const gevuld = heeftInhoud(checkin)
    laatste.current = { vuil: true, gevuld, checkin, coachId, clientId: client.id, sb: db.supabase }
    setConceptStand(gevuld ? 'bezig' : '')
    clearTimeout(bewaarTimer.current)
    bewaarTimer.current = setTimeout(async () => {
      try {
        const q = gevuld
          ? db.supabase.from('checkin_drafts').upsert(
              { coach_id: coachId, client_id: client.id, data: checkin, updated_at: new Date().toISOString() },
              { onConflict: 'coach_id,client_id' })
          : db.supabase.from('checkin_drafts').delete()
              .eq('coach_id', coachId).eq('client_id', client.id)
        const { error } = await q
        if (error) throw error
        laatste.current.vuil = false
        setConceptStand(gevuld ? 'bewaard' : '')
      } catch (e) {
        console.warn('concept bewaren mislukt:', e?.message)
        setConceptStand('')
      }
    }, 1000)
    return () => clearTimeout(bewaarTimer.current)
  }, [checkin, conceptGeladen, db, client?.id, coachId])

  // Nog één keer wegschrijven bij het sluiten, als de pauze het niet meer
  // haalde. Bewust een lege lijst: dit hoort alleen bij het écht verdwijnen
  // van het venster te draaien, niet bij elke wijziging.
  useEffect(() => () => {
    const l = laatste.current
    if (!l.vuil || !l.sb || !l.coachId || !l.clientId) return
    if (l.gevuld) {
      l.sb.from('checkin_drafts').upsert(
        { coach_id: l.coachId, client_id: l.clientId, data: l.checkin, updated_at: new Date().toISOString() },
        { onConflict: 'coach_id,client_id' }).then(() => {}, () => {})
    } else {
      l.sb.from('checkin_drafts').delete()
        .eq('coach_id', l.coachId).eq('client_id', l.clientId).then(() => {}, () => {})
    }
  }, [])

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

  const bewaarCheckin = async () => {
    setSaving(true)
    try {
      // note krijgt de leesbare samenvatting zodat de tijdlijn er zonder
      // extra code iets van kan tonen; de structuur gaat in data.
      const { data, error } = await db.supabase
        .from('client_coaching_logs')
        .insert({
          client_id: client.id, coach_id: coachId || null,
          status, category: 'checkin',
          note: samenvatting(checkin, client.first_name),
          data: checkin,
        })
        .select().single()
      if (error) throw error
      setLogs(prev => [data, ...prev])

      // Concept opruimen: hij is nu een echt logboek-item. Laat je 'm staan,
      // dan zie je bij de volgende call je vorige check-in weer terug.
      // Eerst de tijd stopzetten, anders schrijft de bewaar-pauze het
      // zojuist verwijderde concept meteen terug.
      clearTimeout(bewaarTimer.current)
      try {
        await db.supabase.from('checkin_drafts').delete()
          .eq('coach_id', coachId).eq('client_id', client.id)
      } catch (e) { console.warn('concept opruimen mislukt:', e?.message) }

      // Leeg formulier, en je blijft op het check-in tabblad staan: na
      // opslaan wil je meestal meteen aan de volgende beginnen.
      setCheckin(CHECKIN_LEEG)
      setConceptStand('')
      onLogSaved?.(data)
    } catch (e) {
      console.error('check-in opslaan mislukt:', e)
      alert('Opslaan mislukt — ' + (e?.message || e))
    }
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
      // Zwaardere schaduw nu de gedimde achtergrond weg is: dat is wat het
      // venster nog van de pagina eronder scheidt.
      boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
      cursor: isDragging ? 'grabbing' : 'default',
    }}>

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

      {!minimized && (
        <>
          {/* ── Nieuwe entry ── */}
          {/* Het invoerblok stond op flexShrink: 0 en kon dus nooit krimpen.
              Met een notitieveld van drie regels viel dat niet op, maar het
              check-in formulier is een stuk langer: dat liep buiten het
              venster en de modal staat op overflow hidden, dus scrollen kon
              niet.

              Nu mag dit blok krimpen én zelf scrollen. Bij de check-in krijgt
              het de ruimte (het is dan je werkveld), bij een gewone notitie
              blijft het compact en houdt de tijdlijn eronder zijn plek. */}
          <div style={{
            padding: '0.625rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flex: category === 'checkin' ? '1 1 auto' : '0 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>

            {/* Categorie selector */}
            <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '0.4rem' }}>
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon
                const active = category === cat.id
                return (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                    flex: 1, padding: '0.4rem 0.3rem',
                    background: active ? '#fff' : 'transparent',
                    border: `1px solid ${active ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: '6px',
                    color: active ? '#0a0a0a' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.68rem', fontWeight: 900,
                    cursor: 'pointer',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                    minHeight: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                    transition: 'all 0.15s ease'
                  }}>
                    <CatIcon size={11} />{cat.label}
                  </button>
                )
              })}
            </div>

            {/* Statuskeuze hoort bij een notitie, niet bij de check-in:
                daar bepaalt de snelle check hierboven al hoe het ervoor staat. */}
            {category === 'algemeen' && (
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

            {/* Bij Check-in het formulier, anders het notitieveld. */}
            {category === 'checkin' ? (
              <CheckinFlow
                waarde={checkin}
                onChange={setCheckin}
                onOpslaan={bewaarCheckin}
                opslaan={saving}
                clientNaam={client.first_name}
                conceptStand={conceptStand}
              />
            ) : (
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
            <button onClick={() => setFilterCat('all')} style={{
              padding: '0.15rem 0.4rem', borderRadius: '3px', border: 'none',
              background: filterCat === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: filterCat === 'all' ? '#fff' : 'rgba(255,255,255,0.25)',
              fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '22px'
            }}>
              Alle <span style={{ opacity: 0.5 }}>{logs.length}</span>
            </button>
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
          {/* Tijdens een check-in ben je aan het invullen, niet aan het
              terugkijken. De tijdlijn geeft dan ruimte af aan het formulier
              maar blijft bereikbaar door te scrollen. */}
          <div style={{
            flex: category === 'checkin' ? '0 1 30%' : 1,
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
                  {filterCat === 'all' ? 'Nog geen logboek entries' : `Geen ${CATEGORIES.find(c => c.id === filterCat)?.label} notities`}
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
