// src/modules/coach-command-center/components/CoachingLogModal.jsx
// v1.1 — Categorieën: algemeen, status, whatsapp, call_prep
// 24 nov 2026: category 'status' is nu de statusregel per klant (statusRegel.js),
// bovenaan het venster. Voorbereiding van Gino staat er ook zonder call.
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { useModalHost } from '../../../coach/ModalHost'
import CallBlad, { PrecallKnop } from '../../business-os/CallBlad'
import BerichtVak from '../../business-os/BerichtVak'
import { ITEM_KOLOMMEN } from '../../business-os/berichtTekst'
import { callHeeftInhoud, isEchteCall } from '../../business-os/callBladData'
import { schrijfBijsturing, BIJSTURING } from '../bijsturing'
import { standVoorstel } from '../statusRegel'
import StatusRegelBalk from './StatusRegelBalk'
import { colors } from '../../../ui/tokens'
import { X, GripVertical, Minus, Maximize2, Plus, Loader2, Phone, FileText, History, Rocket } from 'lucide-react'

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

const nlDag = (d = new Date()) => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })

// Gino's voorbereiding voor deze klant (checkin_ronde_items). Sinds 24 nov 2026
// de nieuwste ronde met een gevulde suggesties.call, hoe oud ook: op maandag is
// dat het draaiboek voor de video, ook zonder call. De status (kleur, reden,
// actie) komt uit de ronde van de laatste 3 dagen; ouder zegt niets meer.
// undefined = laden.
function useVoorbereiding(clientId, db) {
  const [stand, setStand] = useState(undefined)
  useEffect(() => {
    let weg = false
    setStand(undefined)
    const vandaag = nlDag()
    const van = new Date(); van.setDate(van.getDate() - 3)
    const dagStart = new Date(); dagStart.setHours(0, 0, 0, 0)
    const dagEind = new Date(dagStart); dagEind.setDate(dagEind.getDate() + 1)
    const leeg = () => ({ data: [] })
    Promise.all([
      db.supabase.from('checkin_ronde_items').select('ronde_datum, groep, suggesties')
        .eq('client_id', clientId).lte('ronde_datum', vandaag).not('suggesties->call', 'is', null)
        .order('ronde_datum', { ascending: false }).limit(5).then(r => r, leeg),
      db.supabase.from('checkin_ronde_items').select('ronde_datum, groep, suggesties')
        .eq('client_id', clientId).gte('ronde_datum', nlDag(van)).lte('ronde_datum', vandaag)
        .order('ronde_datum', { ascending: false }).limit(1).then(r => r, leeg),
      // Call vandaag in de app-agenda: dan horen de vaste call-vragen erbij,
      // ook als Gino nog niets klaarzette.
      db.supabase.from('client_calls').select('id')
        .eq('client_id', clientId).is('canceled_at', null)
        .gte('scheduled_date', dagStart.toISOString()).lt('scheduled_date', dagEind.toISOString())
        .limit(1).then(r => r, leeg),
    ]).then(([metCall, recent, calls]) => {
      if (weg) return
      setStand({
        item: (metCall.data || []).find(r => callHeeftInhoud(r.suggesties?.call)) || null,
        recent: recent.data?.[0] || null,
        callVandaag: (calls.data || []).length > 0,
      })
    })
    return () => { weg = true }
  }, [clientId, db])
  return stand
}

// Tab Call: Gino's voorbereiding als pijltjes-regels. Met een call in de
// volgorde van de call en met de vaste vragen; zonder call (maandag check-in)
// het draaiboek bovenaan en geen call-vragen. Verslag doet achteraf het
// transcript.
function CallVoorbereiding({ client, voorbereiding, precall }) {
  if (voorbereiding === undefined) {
    return (
      <div style={{ flex: 1, minHeight: 0, padding: '0.75rem 0.875rem', fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Laden…</div>
    )
  }
  const { item, recent, callVandaag } = voorbereiding
  const s = item?.suggesties || {}
  const echtCall = callVandaag || isEchteCall(s.call)
  const doel = client.primary_goal || client.goal
  const call = item ? s.call : (echtCall && doel ? { doel: [`Doel: ${doel}`] } : {})
  const r = recent?.suggesties || {}
  const status = recent && (r.reden || r.actie) ? { groep: recent.groep, reden: r.reden, actie: r.actie } : null
  const dag = !item ? '' : item.ronde_datum === nlDag() ? 'vandaag'
    : new Date(`${item.ronde_datum}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })
  const sleutel = `${client.id}-${item?.ronde_datum || 'leeg'}`
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.75rem 0.875rem 1.5rem' }}>
      {item ? (
        <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 10px', marginBottom: 14 }}>
          {s.call.titel && <span style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.3 }}>{s.call.titel}</span>}
          <span style={{ fontSize: '0.85rem', fontWeight: 900, color: colors.success, whiteSpace: 'nowrap' }}>
            {dag}{isEchteCall(s.call) ? ` · ${s.call.tijd}` : ''}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', marginBottom: 14 }}>
          Nog geen voorbereiding van Gino.
        </div>
      )}
      <CallBlad key={sleutel} sleutel={sleutel} precall={precall} call={call} status={status} zonderCall={!echtCall} />
    </div>
  )
}

// Voor het tonen van bestaande items, ook uit categorieen die je niet meer
// kunt kiezen. Zonder deze lijst zou een oud WhatsApp-item naamloos worden.
const CATEGORIE_LABEL = {
  algemeen: 'Algemeen', checkin: 'Check-in', onboarding: 'Onboarding', change_log: 'Wijziging',
  status: 'Status', whatsapp: 'WhatsApp', call_prep: 'Call prep', call_summary: 'Call', [BIJSTURING]: 'Bijsturing',
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
// Tab Bericht: het check-in bericht voor WhatsApp. Pakt het laatste bericht
// van Gino dat nog niet verstuurd is (laatste 7 dagen), anders een nieuw
// bericht met Kerstens vaste opbouw.
function BerichtTab({ client, db }) {
  const [item, setItem] = useState(undefined)
  const vandaag = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' })
  useEffect(() => {
    let weg = false
    const van = new Date(); van.setDate(van.getDate() - 7)
    db.supabase.from('checkin_ronde_items').select(ITEM_KOLOMMEN)
      .eq('client_id', client.id).gte('ronde_datum', van.toLocaleDateString('sv-SE')).lte('ronde_datum', vandaag)
      .order('ronde_datum', { ascending: false })
      .then(({ data }) => {
        if (weg) return
        const lijst = data || []
        const heeft = (r) => ((r.bewerkt_bericht ?? r.bericht) || '').trim()
        setItem(lijst.find(r => heeft(r) && !r.verstuurd_at) || lijst.find(r => r.ronde_datum === vandaag) || null)
      }, () => { if (!weg) setItem(null) })
    return () => { weg = true }
  }, [client.id, db, vandaag])
  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0.75rem 0.875rem 1.5rem' }}>
      {item === undefined
        ? <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Laden…</div>
        : <BerichtVak key={client.id} clientId={client.id} voornaam={client.first_name} item={item}
            ronde={item?.ronde_datum || vandaag} onItem={setItem} metSjabloon rijen={12} />}
    </div>
  )
}

export default function CoachingLogModal({ client, db, coachId, onClose, isMobile, onLogSaved, inline = false }) {
  const modalHost = useModalHost()
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [note, setNote]           = useState('')
  const [status, setStatus]       = useState('on_track')
  const category = 'algemeen'
  // Notitie of bijsturing (laatste punt + wat je deze week aanpast). De
  // bijsturing komt als label op de klantkaart in Command.
  const [soort, setSoort] = useState('notitie')
  const [punt, setPunt] = useState('')
  const [bijsturing, setBijsturing] = useState('')
  // Wijzigingen (automatisch, 9 van de 10 items) standaard niet in de tijdlijn.
  const [filterCat, setFilterCat] = useState('notities')
  const [weergave, setWeergave]   = useState('call')
  const [precall, setPrecall]     = useState(false)
  const [pos, setPos]             = useState(isMobile ? { x: 0, y: 0 } : DEFAULT_POS)
  const [size, setSize]           = useState(isMobile ? { w: window.innerWidth, h: window.innerHeight } : DEFAULT_SIZE)
  const [minimized, setMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const resizeStart  = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const textareaRef  = useRef(null)
  const voorbereiding = useVoorbereiding(client.id, db)

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
    if (soort === BIJSTURING) {
      if (!punt.trim()) return
      setSaving(true)
      try {
        const data = await schrijfBijsturing(db.supabase, { clientId: client.id, coachId, status, punt, bijsturing })
        if (data) setLogs(prev => [data, ...prev])
        setPunt(''); setBijsturing('')
        onLogSaved?.(data)
      } catch (e) { console.error('❌ save bijsturing:', e) }
      setSaving(false)
      return
    }
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
          {/* Statusregel: de geldende stand van de klant, met een veld voor een
              nieuwe. Gino's voorstel ('Stand: …' in de voorbereiding) staat
              voorgevuld; pas bewaren zet hem vast. */}
          <StatusRegelBalk key={client.id} client={client} db={db} coachId={coachId} status={status}
            klaar={voorbereiding !== undefined}
            voorstel={standVoorstel(voorbereiding?.item?.suggesties?.call)}
            voorstelDag={voorbereiding?.item?.ronde_datum || ''}
            onBewaard={(rij) => { setLogs(prev => [rij, ...prev]); onLogSaved?.(rij) }} />

          {/* Kopregel: Call | Notities links, Pre-call rechts. Klein, zoals de
              Plan-knop bij Gewicht: tekst in plaats van grote knoppen. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0.6rem 0.875rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
            {[['call', 'Call'], ['bericht', 'Bericht'], ['notities', 'Notities']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setWeergave(id)} style={{
                background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '0.8rem', fontWeight: 900, color: weergave === id ? '#fff' : 'rgba(255,255,255,0.35)',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>{label}</button>
            ))}
            <div style={{ flex: 1 }} />
            {weergave === 'call' && <PrecallKnop aan={precall} onKlik={() => setPrecall(p => !p)} />}
          </div>

          {weergave === 'call' ? <CallVoorbereiding client={client} voorbereiding={voorbereiding} precall={precall} /> : weergave === 'bericht' ? <BerichtTab client={client} db={db} /> : (<>
          {/* ── Nieuwe notitie ── */}
          <div style={{
            padding: '0.625rem 0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            flex: '0 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>

            <div style={{ display: 'flex', gap: 16, marginBottom: '0.5rem' }}>
              {[['notitie', 'Notitie'], [BIJSTURING, 'Bijsturing deze week']].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setSoort(id)} style={{
                  background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', minHeight: 28,
                  fontSize: '0.8rem', fontWeight: 900, color: soort === id ? '#fff' : 'rgba(255,255,255,0.4)',
                  borderBottom: soort === id ? '2px solid #fff' : '2px solid transparent',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                }}>{label}</button>
              ))}
            </div>
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

            {soort === BIJSTURING ? (
              <>
                {[['Laatste punt', punt, setPunt, 'Wat speelde er? (bv. weekend 2x uit eten)'], ['Bijsturing', bijsturing, setBijsturing, 'Wat pas je aan? (bv. stappen naar 10k)']].map(([label, waarde, zet, ph]) => (
                  <input key={label} value={waarde} onChange={e => zet(e.target.value)} onKeyDown={handleKeyDown}
                    placeholder={`${label}: ${ph}`} aria-label={label}
                    style={{
                      width: '100%', boxSizing: 'border-box', marginBottom: '0.375rem', minHeight: 40,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '6px',
                      color: '#fff', fontSize: '0.85rem', fontWeight: 700, padding: '0 0.625rem', outline: 'none', fontFamily: 'inherit',
                    }} />
                ))}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleSave} disabled={!punt.trim() || saving} style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.9rem',
                    background: punt.trim() ? '#fff' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '6px',
                    color: punt.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.25)', fontSize: '0.72rem', fontWeight: 900, fontFamily: 'inherit',
                    cursor: punt.trim() ? 'pointer' : 'default', opacity: saving ? 0.5 : 1, minHeight: '32px',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>
                    {saving ? <Loader2 size={11} style={{ animation: 'logSpin 1s linear infinite' }} /> : <Plus size={11} />}
                    Opslaan
                  </button>
                </div>
              </>
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
                      {(log.category === 'algemeen' || !log.category) && (
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
