// src/modules/ai-meal-generator/tabs/plan-analyzer/ClientContextPanel.jsx
// v3.0 — Tabs: Gegevens | Meal Plan SOP + onClose prop

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { User, ChevronDown, ChevronRight, X, Minus, Maximize2, GripVertical, Check } from 'lucide-react'

// ── Sub image map ──
const SUB_IMAGES = {
  brood_kaas:'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&h=120&fit=crop&q=80',brood_vleeswaren:'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=200&h=120&fit=crop&q=80',brood_pindakaas:'https://images.unsplash.com/photo-1559630700-1a4e99a3f8e4?w=200&h=120&fit=crop&q=80',toast_avocado:'https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=200&h=120&fit=crop&q=80',havermout_fruit:'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?w=200&h=120&fit=crop&q=80',havermout_noten:'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=200&h=120&fit=crop&q=80',kwark_fruit:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80',griekse_yoghurt:'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=200&h=120&fit=crop&q=80',skyr:'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=200&h=120&fit=crop&q=80',smoothie_bowl:'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=200&h=120&fit=crop&q=80',eieren_gebakken:'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=120&fit=crop&q=80',eieren_scrambled:'https://images.unsplash.com/photo-1551248429-40975aa4de74?w=200&h=120&fit=crop&q=80',omelet:'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=200&h=120&fit=crop&q=80',roerei_toast:'https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?w=200&h=120&fit=crop&q=80',smoothie:'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=200&h=120&fit=crop&q=80',fruit_yoghurt:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&h=120&fit=crop&q=80',muesli:'https://images.unsplash.com/photo-1494597564530-871f2b93ac55?w=200&h=120&fit=crop&q=80',lunch_brood_kaas:'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=200&h=120&fit=crop&q=80',lunch_brood_vlees:'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=200&h=120&fit=crop&q=80',lunch_wrap_kip:'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=200&h=120&fit=crop&q=80',lunch_tosti:'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=200&h=120&fit=crop&q=80',lunch_shoarma:'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=200&h=120&fit=crop&q=80',salade_kip:'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200&h=120&fit=crop&q=80',salade_tonijn:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=120&fit=crop&q=80',soep:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=120&fit=crop&q=80',soep_brood:'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=200&h=120&fit=crop&q=80',lunch_rijst:'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=120&fit=crop&q=80',lunch_pasta:'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200&h=120&fit=crop&q=80',lunch_wok:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=120&fit=crop&q=80',rijst_kip:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=120&fit=crop&q=80',rijst_rund:'https://images.unsplash.com/photo-1547592180-85f173990554?w=200&h=120&fit=crop&q=80',rijst_zalm:'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=120&fit=crop&q=80',rijst_groenten:'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=200&h=120&fit=crop&q=80',nasi:'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&h=120&fit=crop&q=80',pasta_bolognese:'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=200&h=120&fit=crop&q=80',pasta_carbonara:'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=200&h=120&fit=crop&q=80',pasta_kip:'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=200&h=120&fit=crop&q=80',pasta_zalm:'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=120&fit=crop&q=80',bami:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&h=120&fit=crop&q=80',aard_kip:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200&h=120&fit=crop&q=80',aard_vlees:'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=120&fit=crop&q=80',stamppot:'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&h=120&fit=crop&q=80',soep_kip:'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=200&h=120&fit=crop&q=80',soep_groente:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=120&fit=crop&q=80',
}
const ONTBIJT_LABELS = { havermout_fruit:'Havermout + fruit',havermout_noten:'Havermout + noten',kwark_fruit:'Kwark + fruit',griekse_yoghurt:'Griekse yoghurt',skyr:'Skyr',eieren_gebakken:'Gebakken ei',eieren_scrambled:'Scrambled eggs',omelet:'Omelet',brood_kaas:'Brood + kaas',brood_vlees:'Brood + vlees',brood_pindakaas:'Pindakaas',smoothie:'Smoothie',fruit_yoghurt:'Fruit + yoghurt',muesli:'Muesli',roerei_toast:'Roerei + toast',toast_avocado:'Toast + avocado' }
const LUNCH_LABELS   = { brood_kaas:'Brood + kaas',brood_vlees:'Brood + vlees',lunch_wrap_kip:'Wrap kip',lunch_tosti:'Tosti',lunch_shoarma:'Shoarma wrap',salade_kip:'Salade kip',salade_tonijn:'Salade tonijn',salade_ei:'Salade ei',soep:'Soep',soep_brood:'Soep + brood',lunch_rijst:'Rijst',lunch_pasta:'Pasta',lunch_wok:'Wok',lunch_noodles:'Noodles' }
const DINER_LABELS   = { rijst_kip:'Rijst + kip',rijst_rund:'Rijst + rund',rijst_zalm:'Rijst + zalm',rijst_groenten:'Rijst + groenten',nasi:'Nasi',pasta_bolognese:'Bolognese',pasta_kip:'Pasta + kip',pasta_carbonara:'Carbonara',pasta_zalm:'Pasta + zalm',bami:'Bami',noodles:'Noodles',aard_kip:'Aardappel + kip',aard_vlees:'Aardappel + vlees',stamppot:'Stamppot',soep_kip:'Soep kip',soep_groente:'Soep groente' }
const TIME_LABELS    = { vroege_ochtend:'06:00',late_ochtend:'10:00',vroege_middag:'13:00',late_middag:'16:00',vroege_avond:'18:00',late_avond:'20:00',ochtend:'08:00',middag:'13:00',einde_werkdag:'17:00',avond:'19:00' }

const DEFAULT_POS  = { x: window.innerWidth - 380, y: 80 }
const DEFAULT_SIZE = { w: 360, h: 560 }
const MIN_SIZE     = { w: 280, h: 200 }

// ── Meal Plan SOP definitie ──
const MEAL_SOP_STEPS = [
  {
    id: 0, title: 'Doel + aanpak helder',
    checks: [
      { id: 'doel_bepaald', label: 'Doel bepaald (cut / bulk / recomp)' },
      { id: 'aanpak_bepaald', label: 'Aanpak bepaald' },
    ]
  },
  {
    id: 1, title: "Macro's berekenen en vaststellen",
    checks: [
      { id: 'cal_berekend', label: 'Calorie target berekend' },
      { id: 'macros_vastgesteld', label: 'Eiwit / carbs / vet vastgesteld' },
    ]
  },
  {
    id: 2, title: 'Plan voorkeuren checken',
    checks: [
      { id: 'guidance_bepaald', label: 'Strict / Flexibel / Los bepaald' },
      { id: 'voorkeuren_door', label: 'Voorkeuren doorgenomen' },
      { id: 'patronen_in_kaart', label: 'Huidige patronen in kaart' },
    ]
  },
  {
    id: 3, title: 'Plan bepalen',
    checks: [
      { id: 'plan_aanpak', label: 'Aanpak vastgesteld — wat gaan we doen?' },
    ]
  },
  {
    id: 4, title: 'Plan maken',
    checks: [
      { id: 'meals_geplaatst', label: 'Meals op juiste plekken gezet' },
      { id: 'verhoudingen', label: 'Verhoudingen aangepast' },
      { id: 'totalen_check', label: 'Totalen gecontroleerd + aangepast' },
      { id: 'plan_toegewezen', label: 'Plan toegewezen aan client' },
    ]
  }
]

export default function ClientContextPanel({ db, clientId, isMobile, isFloating = false, onClose }) {
  console.log('🍽️ ClientContextPanel render — clientId:', clientId, '— isFloating:', isFloating)
  const modalHost = useModalHost()
  const [cd, setCd]         = useState(null)
  const [np, setNp]         = useState(null)
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('gegevens') // 'gegevens' | 'sop'
  const [sopChecks, setSopChecks] = useState({})
  const [sopStep, setSopStep]     = useState(0)
  const [expanded, setExpanded]   = useState({
    targets: true, alerts: true, call: true, eetpatroon: true,
    training: false, life: false, food: false, cheat: false, supplements: false
  })

  // Floating state
  const [pos, setPos]           = useState(DEFAULT_POS)
  const [size, setSize]         = useState(DEFAULT_SIZE)
  const [minimized, setMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset  = useRef({ x: 0, y: 0 })
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const panelRef    = useRef(null)
  const m = isMobile

  useEffect(() => {
    if (clientId && db?.supabase) loadData()
  }, [clientId])

  // Reset SOP when client changes
  useEffect(() => { setSopChecks({}); setSopStep(0) }, [clientId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [clientRes, npRes, journeyRes] = await Promise.all([
        db.supabase.from('clients').select('*').eq('id', clientId).single(),
        db.supabase.from('nutrition_preferences').select('*').eq('client_id', clientId).order('updated_at', { ascending: false }).limit(1),
        db.supabase.from('client_journeys').select('coaching_plan').eq('client_id', clientId).eq('is_active', true).single()
      ])
      if (clientRes.data) setCd(clientRes.data)
      if (npRes.data?.[0]) setNp(npRes.data[0])
      if (journeyRes.data) setJourney(journeyRes.data)
    } catch (e) { console.warn('Context panel load failed:', e) }
    setLoading(false)
  }

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }))

  const toggleSopCheck = (checkId) => {
    setSopChecks(p => ({ ...p, [checkId]: !p[checkId] }))
  }

  const sopStepComplete = (step) => step.checks.every(c => sopChecks[c.id])
  const totalChecks     = MEAL_SOP_STEPS.reduce((a, s) => a + s.checks.length, 0)
  const doneChecks      = Object.values(sopChecks).filter(Boolean).length
  const sopProgress     = totalChecks > 0 ? Math.round((doneChecks / totalChecks) * 100) : 0

  // ── Drag ──
  const onDragStart = useCallback((e) => {
    e.preventDefault()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: cx - pos.x, y: cy - pos.y }
    setIsDragging(true)
  }, [pos])

  const onDragMove = useCallback((e) => {
    if (!isDragging) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setPos({ x: Math.max(0, Math.min(window.innerWidth - size.w, cx - dragOffset.current.x)), y: Math.max(0, Math.min(window.innerHeight - 60, cy - dragOffset.current.y)) })
  }, [isDragging, size])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  // ── Resize ──
  const onResizeStart = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    resizeStart.current = { x: cx, y: cy, w: size.w, h: size.h }
    setIsResizing(true)
  }, [size])

  const onResizeMove = useCallback((e) => {
    if (!isResizing) return
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setSize({ w: Math.max(MIN_SIZE.w, resizeStart.current.w + cx - resizeStart.current.x), h: Math.max(MIN_SIZE.h, resizeStart.current.h + cy - resizeStart.current.y) })
  }, [isResizing])

  const onResizeEnd = useCallback(() => setIsResizing(false), [])

  useEffect(() => {
    if (!isDragging && !isResizing) return
    const move = isDragging ? onDragMove : onResizeMove
    const end  = isDragging ? onDragEnd  : onResizeEnd
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [isDragging, isResizing, onDragMove, onResizeMove, onDragEnd, onResizeEnd])

  // ── Data extractie ──
  const gl = np?.guidance_level?.guidance_level
  const lc = np?.life_context || {}
  const tr = np?.training || {}
  const al = np?.allergens || {}
  const cm = np?.cheat_meals || {}
  const wi = np?.wishes || {}
  const sp = np?.supplement_preferences || {}
  const ms = np?.meal_schedule || {}
  const plan       = journey?.coaching_plan || {}
  const callNotes  = plan.intake_call_notes?.notes || {}
  const planResult = plan.intake_call_notes?.plan_result || {}
  const callDoel   = callNotes.doel || {}
  const callVoeding = callNotes.voeding || {}
  const hasCallData = !!(callDoel.doel || callVoeding.verandering || planResult.target_cal)
  const ontbijtSubs = (wi.ontbijt_subs || []).map(s => ONTBIJT_LABELS[s] || s)
  const lunchSubs   = (wi.lunch_subs   || []).map(s => LUNCH_LABELS[s]   || s)
  const dinerSubs   = (wi.diner_subs   || []).map(s => DINER_LABELS[s]   || s)
  const nietLekker  = wi.niet_lekker   || []
  const absolNiet   = wi.absoluut_niet || ''
  const hasEetpatroon = ontbijtSubs.length > 0 || lunchSubs.length > 0 || dinerSubs.length > 0 || nietLekker.length > 0
  const hasAlerts = al.selected_allergens?.length > 0 || (al.diet_preference && al.diet_preference !== 'geen') || cd?.allergies
  const guidanceLabels = { strict: 'Strict', flexible: 'Flexibel', free: 'Vrij' }
  const cookLabels     = { graag: 'Graag koken', neutraal: 'Neutraal', niet_graag: 'Simpel houden' }

  if (loading) return isFloating ? null : <div style={{ padding: '0.75rem', fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)' }}>Laden...</div>
  if (!cd) return null

  const panelContent = (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#0a0a0a',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '10px',
      overflow: 'hidden',
      transform: 'translateZ(0)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      ...(isFloating ? {
        position: 'fixed', left: pos.x, top: pos.y,
        width: size.w, height: minimized ? 'auto' : size.h,
        zIndex: 10100, cursor: isDragging ? 'grabbing' : 'default',
      } : { height: '100%' })
    }} ref={panelRef}>

      {/* Gold accent line */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg,#FFD700,#D4AF37,#FFD700)', opacity: 0.6, flexShrink: 0 }} />

      {/* ── Header ── */}
      <div
        onMouseDown={isFloating ? onDragStart : undefined}
        onTouchStart={isFloating ? onDragStart : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: m ? '0.4rem 0.6rem' : '0.5rem 0.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          cursor: isFloating ? 'grab' : 'default',
          flexShrink: 0, userSelect: 'none'
        }}
      >
        {isFloating && <GripVertical size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />}
        <User size={15} color="#FFD700" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: m ? '0.95rem' : '1.05rem', fontWeight: 800, color: '#fff', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          {cd.first_name} {cd.last_name}
        </span>
        {gl && (
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FFD700', background: 'rgba(255,215,0,0.12)', padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>
            {guidanceLabels[gl]}
          </span>
        )}
        {isFloating && (
          <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0, marginLeft: '0.25rem' }}>
            <button onClick={() => setMinimized(p => !p)} style={iconBtnStyle}><Minus size={10} /></button>
            <button onClick={() => { setPos(DEFAULT_POS); setSize(DEFAULT_SIZE) }} style={iconBtnStyle}><Maximize2 size={10} /></button>
            {onClose && <button onClick={onClose} style={{ ...iconBtnStyle, color: 'rgba(255,255,255,0.5)' }}><X size={10} /></button>}
          </div>
        )}
      </div>

      {minimized ? null : (
        <>
          {/* ── Tab strip ── */}
          <div style={{
            display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)',
            flexShrink: 0, background: '#050505'
          }}>
            {[
              { id: 'gegevens', label: 'GEGEVENS' },
              { id: 'sop', label: `MEAL SOP ${sopProgress > 0 ? `· ${sopProgress}%` : ''}` }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                flex: 1, padding: m ? '0.6rem 0.5rem' : '0.7rem 0.5rem',
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#FFD700' : 'transparent'}`,
                color: activeTab === tab.id ? '#FFD700' : 'rgba(255,255,255,0.55)',
                fontSize: m ? '0.78rem' : '0.82rem', fontWeight: 800, letterSpacing: '-0.01em',
                cursor: 'pointer', touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                transition: 'color 0.15s ease'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

            {/* ════ TAB: GEGEVENS ════ */}
            {activeTab === 'gegevens' && (
              <>
                <Section title="MACRO TARGETS" expanded={expanded.targets} onToggle={() => toggle('targets')} m={m}>
                  <FlushRow items={[
                    { l: 'KCAL',  v: cd.target_calories || '—', color: '#FFD700' },
                    { l: 'EIWIT', v: cd.target_protein ? `${cd.target_protein}g` : '—', color: '#10b981' },
                    { l: 'CARBS', v: cd.target_carbs   ? `${cd.target_carbs}g`   : '—', color: '#3b82f6' },
                    { l: 'VET',   v: cd.target_fat     ? `${cd.target_fat}g`     : '—', color: '#f59e0b' },
                  ]} m={m} />
                  {planResult.mode && <DataRow label="MODUS" value={planResult.mode?.toUpperCase()} color={planResult.mode==='bulk'?'#10b981':planResult.mode==='cut'?'#ef4444':'#6366f1'} m={m} />}
                  {ms.num_meals && <DataRow label="MAALTIJDEN" value={`${ms.num_meals}x per dag`} m={m} />}
                </Section>

                {hasAlerts && (
                  <Section title="⚠️ ALLERGIEËN & RESTRICTIES" expanded={expanded.alerts} onToggle={() => toggle('alerts')} m={m} color="#ef4444">
                    {al.diet_preference && al.diet_preference !== 'geen' && <DataRow label="DIEET" value={al.diet_preference} color="#f59e0b" m={m} />}
                    {al.selected_allergens?.length > 0 && <DataRow label="ALLERGEEN" value={al.selected_allergens.join(', ')} color="#ef4444" m={m} />}
                    {al.intolerances?.length > 0 && <DataRow label="INTOLERANTIE" value={al.intolerances.join(', ')} color="#f59e0b" m={m} />}
                    {cd.allergies && !al.selected_allergens?.length && <DataRow label="ALLERGEEN" value={cd.allergies} color="#ef4444" m={m} />}
                  </Section>
                )}

                {hasCallData && (
                  <Section title="📞 INTAKE CALL" expanded={expanded.call} onToggle={() => toggle('call')} m={m} color="#6366f1">
                    {callDoel.route && <DataRow label="ROUTE" value={callDoel.route.toUpperCase()} color="#6366f1" m={m} />}
                    {callDoel.doel && <DataRow label="DOEL" value={callDoel.doel} color="#fff" m={m} />}
                    {callDoel.aanpak && <DataRow label="AANPAK" value={callDoel.aanpak} m={m} />}
                    {callDoel.blokkades && <DataRow label="BLOKKADES" value={callDoel.blokkades} color="#f59e0b" m={m} />}
                    {callVoeding.verandering && <DataRow label="VERANDERING" value={callVoeding.verandering} color="#10b981" m={m} />}
                    {callVoeding.mealprep && <DataRow label="MEAL PREP" value={callVoeding.mealprep} m={m} />}
                    {callVoeding.restricties_notitie && <DataRow label="RESTRICTIES+" value={callVoeding.restricties_notitie} color="#ef4444" m={m} />}
                    {callVoeding.dagvoorbeeld_blij === 'nee' && callVoeding.dagvoorbeeld_anders && <DataRow label="DAGV. ANDERS" value={callVoeding.dagvoorbeeld_anders} color="#f59e0b" m={m} />}
                    {plan.coaching_level && <DataRow label="COACHING" value={plan.coaching_level} color="#FFD700" m={m} />}
                  </Section>
                )}

                {hasEetpatroon && (
                  <Section title="🍽️ EETPATROON" expanded={expanded.eetpatroon} onToggle={() => toggle('eetpatroon')} m={m} color="#f59e0b">
                    {ontbijtSubs.length > 0 && <MealCardStrip label="ONTBIJT" color="#f59e0b" items={wi.ontbijt_subs||[]} labelMap={ONTBIJT_LABELS} m={m} />}
                    {lunchSubs.length   > 0 && <MealCardStrip label="LUNCH"   color="#10b981" items={wi.lunch_subs||[]}   labelMap={LUNCH_LABELS}   m={m} />}
                    {dinerSubs.length   > 0 && <MealCardStrip label="DINER"   color="#3b82f6" items={wi.diner_subs||[]}   labelMap={DINER_LABELS}   m={m} />}
                    {nietLekker.length  > 0 && <DataRow label="NIET LEKKER"    value={nietLekker.join(', ')} color="#ef4444" m={m} />}
                    {absolNiet          &&     <DataRow label="ABSOLUUT NIET"   value={absolNiet}             color="#ef4444" m={m} />}
                  </Section>
                )}

                {tr.training_days?.length > 0 && (
                  <Section title="💪 TRAINING" expanded={expanded.training} onToggle={() => toggle('training')} m={m} color="#f97316">
                    <FlushRow items={[
                      { l: 'FREQ', v: `${tr.training_days.length}x/wk` },
                      { l: 'TIJD', v: TIME_LABELS[tr.default_time] || tr.default_time || '—', color: '#f97316' },
                      { l: 'DUUR', v: tr.training_duration || '—' },
                    ]} m={m} />
                    <DataRow label="DAGEN" value={tr.training_days.map(d => d.toUpperCase()).join(' · ')} m={m} />
                  </Section>
                )}

                {lc.cooking_preference && (
                  <Section title="🏠 LEVENSSTIJL" expanded={expanded.life} onToggle={() => toggle('life')} m={m}>
                    <DataRow label="KOKEN"    value={cookLabels[lc.cooking_preference]} m={m} />
                    {lc.weekly_budget       && <DataRow label="BUDGET"    value={`€${lc.weekly_budget}/week`} m={m} />}
                    {lc.cooking_time_dinner && <DataRow label="KOOKTIJD"  value={`${lc.cooking_time_dinner} min (diner)`} m={m} />}
                  </Section>
                )}

                {(cd.loved_foods || cd.hated_foods) && (
                  <Section title="❤️ VOEDSEL VOOR/TEGEN" expanded={expanded.food} onToggle={() => toggle('food')} m={m}>
                    {cd.loved_foods && <DataRow label="FAVORIETEN" value={cd.loved_foods} color="#10b981" m={m} />}
                    {cd.hated_foods && <DataRow label="HAAT"       value={cd.hated_foods} color="#ef4444" m={m} />}
                  </Section>
                )}

                {cm.frequency && (
                  <Section title="🍕 FLEXIBEL ETEN" expanded={expanded.cheat} onToggle={() => toggle('cheat')} m={m}>
                    <FlushRow items={[
                      { l: 'FREQ', v: { nooit:'Geen','1x_week':'1x/wk','2x_week':'2x/wk',weekend:'Weekend',als_nodig:'Flexibel' }[cm.frequency] || cm.frequency },
                      { l: 'AANPAK', v: { strict_plan:'Strict',one_free_meal:'1 vrij',flexible_weekend:'Flex',macro_fit:'Past het' }[cm.approach] || '—' },
                    ]} m={m} />
                  </Section>
                )}

                {(sp.current?.length > 0 || sp.interested?.length > 0) && (
                  <Section title="💊 SUPPLEMENTEN" expanded={expanded.supplements} onToggle={() => toggle('supplements')} m={m}>
                    {sp.current?.length   > 0 && <DataRow label="GEBRUIKT"   value={sp.current.join(', ')}    color="#10b981" m={m} />}
                    {sp.interested?.length > 0 && <DataRow label="INTERESSE"  value={sp.interested.join(', ')} m={m} />}
                  </Section>
                )}
              </>
            )}

            {/* ════ TAB: MEAL SOP ════ */}
            {activeTab === 'sop' && (
              <div style={{ padding: '0.5rem 0.5rem 1rem' }}>

                {/* Progress bar */}
                <div style={{ padding: '0.4rem 0.25rem 0.6rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: m?'0.72rem':'0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 800, letterSpacing: '0.01em' }}>VOORTGANG</span>
                    <span style={{ fontSize: m?'0.72rem':'0.78rem', color: '#FFD700', fontWeight: 800 }}>{sopProgress}%</span>
                  </div>
                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${sopProgress}%`, background: 'linear-gradient(90deg,#FFD700,#D4AF37)', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* SOP stappen */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {MEAL_SOP_STEPS.map((step) => {
                    const done = sopStepComplete(step)
                    const isActive = sopStep === step.id
                    return (
                      <div key={step.id} style={{
                        borderLeft: `3px solid ${done ? '#10b981' : isActive ? '#FFD700' : 'rgba(255,255,255,0.1)'}`,
                        background: isActive ? '#111' : 'transparent',
                        borderRadius: '0 5px 5px 0',
                        overflow: 'hidden'
                      }}>
                        {/* Stap header */}
                        <button
                          onClick={() => setSopStep(isActive ? -1 : step.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.4rem 0.5rem',
                            background: 'transparent', border: 'none',
                            cursor: 'pointer', touchAction: 'manipulation',
                            WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                            minHeight: '32px'
                          }}
                        >
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                            background: done ? '#10b981' : isActive ? 'rgba(255,215,0,0.12)' : 'transparent',
                            border: `1.5px solid ${done ? '#10b981' : isActive ? '#FFD700' : 'rgba(255,255,255,0.12)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {done
                              ? <Check size={8} color="#000" strokeWidth={3.5} />
                              : isActive
                                ? <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FFD700' }} />
                                : <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>{step.id + 1}</span>
                            }
                          </div>
                          <span style={{
                            flex: 1, fontSize: m?'0.82rem':'0.88rem', fontWeight: 800,
                            color: done ? 'rgba(255,255,255,0.5)' : '#fff',
                            textDecoration: done ? 'line-through' : 'none'
                          }}>
                            {step.title}
                          </span>
                          {isActive ? <ChevronDown size={15} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={15} color="rgba(255,255,255,0.4)" />}
                        </button>

                        {/* Checks */}
                        {isActive && (
                          <div style={{ padding: '0 0.5rem 0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {step.checks.map(c => (
                              <button
                                key={c.id}
                                onClick={() => toggleSopCheck(c.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                                  padding: '0.3rem 0.4rem', borderRadius: '4px',
                                  background: sopChecks[c.id] ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${sopChecks[c.id] ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                  cursor: 'pointer', touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent', textAlign: 'left',
                                  minHeight: '30px'
                                }}
                              >
                                <div style={{
                                  width: '13px', height: '13px', borderRadius: '3px', flexShrink: 0,
                                  background: sopChecks[c.id] ? '#10b981' : 'transparent',
                                  border: `1.5px solid ${sopChecks[c.id] ? '#10b981' : 'rgba(255,255,255,0.18)'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                  {sopChecks[c.id] && <Check size={7} color="#000" strokeWidth={3.5} />}
                                </div>
                                <span style={{
                                  fontSize: m?'0.75rem':'0.8rem', fontWeight: 700,
                                  color: sopChecks[c.id] ? 'rgba(255,255,255,0.5)' : '#fff',
                                  textDecoration: sopChecks[c.id] ? 'line-through' : 'none'
                                }}>
                                  {c.label}
                                </span>
                              </button>
                            ))}

                            {/* Volgende stap knop */}
                            {sopStep < MEAL_SOP_STEPS.length - 1 && (
                              <button
                                onClick={() => setSopStep(sopStep + 1)}
                                style={{
                                  marginTop: '0.2rem', padding: '0.3rem 0.5rem',
                                  background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
                                  borderRadius: '5px', color: '#FFD700',
                                  fontSize: m?'0.75rem':'0.8rem', fontWeight: 800,
                                  cursor: 'pointer', touchAction: 'manipulation',
                                  WebkitTapHighlightColor: 'transparent', minHeight: '32px'
                                }}
                              >
                                Volgende stap →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Reset knop */}
                {doneChecks > 0 && (
                  <button
                    onClick={() => { setSopChecks({}); setSopStep(0) }}
                    style={{
                      marginTop: '0.75rem', width: '100%', padding: '0.3rem',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '5px', color: 'rgba(255,255,255,0.5)',
                      fontSize: m?'0.68rem':'0.72rem', fontWeight: 700,
                      cursor: 'pointer', touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                  >
                    SOP resetten
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Resize handle */}
      {isFloating && !minimized && (
        <div onMouseDown={onResizeStart} onTouchStart={onResizeStart} style={{ position: 'absolute', bottom: 0, right: 0, width: '16px', height: '16px', cursor: 'se-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRight: '2px solid rgba(255,255,255,0.15)', borderBottom: '2px solid rgba(255,255,255,0.15)', borderRadius: '0 0 2px 0' }} />
        </div>
      )}
    </div>
  )

  if (isFloating) return createPortal(panelContent, modalHost)
  return panelContent
}

const iconBtnStyle = { width:'20px',height:'20px',borderRadius:'3px',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.3)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation',WebkitTapHighlightColor:'transparent',padding:0 }

function Section({ title, expanded, onToggle, children, m, color }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={onToggle} style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:m?'0.6rem 0.9rem':'0.7rem 1rem',background:'transparent',border:'none',cursor:'pointer',touchAction:'manipulation',WebkitTapHighlightColor:'transparent' }}>
        <span style={{ fontSize:m?'0.85rem':'0.9rem',fontWeight:800,color:'#fff',letterSpacing:'-0.01em' }}>{title}</span>
        {expanded ? <ChevronDown size={16} color="rgba(255,255,255,0.5)" /> : <ChevronRight size={16} color="rgba(255,255,255,0.5)" />}
      </button>
      {expanded && children}
    </div>
  )
}

function FlushRow({ items, m }) {
  return (
    <div style={{ display:'flex',borderTop:'1px solid rgba(255,255,255,0.06)' }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex:1,textAlign:'center',padding:m?'0.5rem 0.15rem':'0.6rem 0.2rem',borderRight:i<items.length-1?'1px solid rgba(255,255,255,0.06)':'none' }}>
          <div style={{ fontSize:m?'0.62rem':'0.66rem',fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:'0.02em',marginBottom:'0.2rem' }}>{item.l}</div>
          <div style={{ fontSize:m?'0.95rem':'1.05rem',fontWeight:800,color:'#fff',lineHeight:1 }}>{item.v}</div>
        </div>
      ))}
    </div>
  )
}

function MealCardStrip({ label, color, items, labelMap, m }) {
  if (!items?.length) return null
  return (
    <div style={{ padding:m?'0.35rem 0.5rem':'0.4rem 0.75rem',borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
      <style>{`._ms::-webkit-scrollbar{display:none}`}</style>
      <div style={{ fontSize:m?'0.7rem':'0.75rem',fontWeight:800,color:'#fff',letterSpacing:'0.01em',marginBottom:'0.4rem' }}>{label}</div>
      <div className="_ms" style={{ display:'flex',gap:'0.4rem',overflowX:'auto',WebkitOverflowScrolling:'touch',scrollbarWidth:'none',msOverflowStyle:'none' }}>
        {items.map(id => {
          const name  = labelMap[id] || id.replace(/_/g,' ')
          const image = SUB_IMAGES[id]
          return (
            <div key={id} style={{ flexShrink:0,width:m?'84px':'92px',borderRadius:'6px',overflow:'hidden',border:`1px solid rgba(255,255,255,0.12)`,background:'#111' }}>
              {image
                ? <div style={{ width:'100%',height:m?'52px':'58px',backgroundImage:`url(${image})`,backgroundSize:'cover',backgroundPosition:'center' }} />
                : <div style={{ width:'100%',height:m?'52px':'58px',background:'rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ fontSize:'1.2rem' }}>🍽️</span></div>
              }
              <div style={{ padding:'0.3rem 0.35rem' }}>
                <div style={{ fontSize:m?'0.62rem':'0.68rem',fontWeight:700,color:'#fff',lineHeight:1.25,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{name}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DataRow({ label, value, color, m }) {
  if (!value) return null
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:m?'0.4rem 0.9rem':'0.45rem 1rem',gap:'0.75rem' }}>
      <span style={{ fontSize:m?'0.7rem':'0.75rem',fontWeight:800,color:'rgba(255,255,255,0.55)',textTransform:'uppercase',letterSpacing:'0.01em',flexShrink:0,paddingTop:'0.05rem' }}>{label}</span>
      <span style={{ fontSize:m?'0.82rem':'0.88rem',fontWeight:800,color:'#fff',textAlign:'right',lineHeight:1.35,display:'-webkit-box',WebkitLineClamp:4,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{value}</span>
    </div>
  )
}
