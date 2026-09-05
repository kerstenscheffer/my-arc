// ============================================
// FILE: src/modules/client-journey/components/HorizontalTimeline.jsx
// v2 — With evaluation markers on the golden spine
// 3 view modes: volledig | 3-weken | 1-week
// Rows: Call | Bericht | Dots (with eval markers) | Progressie
// ============================================
import React, { useRef, useEffect, useMemo } from 'react'
import { Phone, MessageCircle, Activity, CheckCircle, Layers, Calendar, CalendarDays } from 'lucide-react'
import { G, DAY_LABELS, getDateForWeekDay } from '../journeyConfig'

const CATS = {
  call: { icon: Phone, color: '#3b82f6', border: 'rgba(59,130,246,0.5)', bg: 'rgba(59,130,246,0.12)', label: 'CALL', types: ['call_prep'] },
  bericht: { icon: MessageCircle, color: '#10b981', border: 'rgba(16,185,129,0.5)', bg: 'rgba(16,185,129,0.12)', label: 'BERICHT', types: ['message', 'deliverable', 'check_in'] }
}

const VIEW_MODES = [
  { id: 'full', label: 'Volledig', icon: Layers },
  { id: '3weeks', label: '3 Weken', icon: CalendarDays },
  { id: '1week', label: '1 Week', icon: Calendar }
]

export default function HorizontalTimeline({
  journey, actions, phases, totalWeeks, currentWeek,
  selectedWeek, selectedDay, viewMode, zoomLevel,
  onSelectWeek, onSelectDay, onSetViewMode,
  onOpenActionModal, onOpenEvaluation, messagesByDay, isMobile
}) {
  const scrollRef = useRef(null)
  const startDate = journey?.start_date
  const coachingPlan = journey?.coaching_plan
  const evaluationWeeks = coachingPlan?.evaluation_weeks || []
  const getPhase = (w) => phases.find(p => w >= p.week_start && w <= p.week_end) || null
  const mode = viewMode || '3weeks'

  // ========== BUILD COLUMNS ==========
  //
  // Het middelpunt van het venster ligt altijd binnen het traject.
  //
  // Zonder die grens liep het mis bij elk traject dat over zijn einddatum
  // heen is — en dat zijn de meeste: bij een klant in week 28 van een plan
  // van 12 weken werd het venster week 27 tot en met week 12, dus liep de
  // lus hieronder nul keer en kwam er een lege lijst uit. ProgressArrow
  // pakt dan columns[0], en dat bestaat niet: "Cannot read properties of
  // undefined (reading 'type')", en de hele tijdlijn viel om.
  //
  // Een afgelopen traject toon je aan het eind, niet leeg.
  const midden = Math.min(Math.max(1, selectedWeek || currentWeek || 1), Math.max(1, totalWeeks))

  const columns = useMemo(() => {
    if (mode === 'full') {
      return Array.from({ length: totalWeeks + 1 }, (_, i) => ({ week: i, day: null, type: 'week' }))
    }
    if (mode === '1week') {
      return Array.from({ length: 7 }, (_, d) => ({ week: midden, day: d, type: 'day' }))
    }
    // 3weeks
    const wStart = Math.max(1, midden - 1)
    const wEnd = Math.min(totalWeeks, midden + 2)
    const cols = []
    for (let w = wStart; w <= wEnd; w++) {
      for (let d = 0; d < 7; d++) {
        cols.push({ week: w, day: d, type: 'day', isWeekStart: d === 0, weekNum: w })
      }
    }
    return cols
  }, [mode, totalWeeks, midden])

  // ========== ACTIONS AT COLUMN ==========
  const actionsAt = (catKey, col) => {
    const cat = CATS[catKey]
    if (catKey === 'progressie') return [{ id: `prog-${col.week}-${col.day}`, status: 'pending' }]
    if (catKey === 'bericht' && messagesByDay) {
      if (col.type === 'day') {
        const dbActs = actions.filter(a => a.week_number === col.week && (a.day_number || 0) === col.day && cat.types.includes(a.action_type))
        const tmpl = messagesByDay[`${col.week}:${col.day}`] || []
        if (dbActs.length > 0 || tmpl.length > 0) return [...dbActs, ...tmpl.map(m => ({ id: m.id, status: 'pending', action_type: 'message' }))]
        return []
      }
      const dbActs = actions.filter(a => a.week_number === col.week && cat.types.includes(a.action_type))
      if (dbActs.length > 0) return dbActs
      if (col.week > 0) return [{ id: `tmpl-w${col.week}`, status: 'pending', action_type: 'message' }]
      return []
    }
    if (col.type === 'day') return actions.filter(a => a.week_number === col.week && (a.day_number || 0) === col.day && cat.types.includes(a.action_type))
    return actions.filter(a => a.week_number === col.week && cat.types.includes(a.action_type))
  }

  const isCompletedAt = (catKey, col) => {
    if (catKey === 'progressie') return false
    const m = actionsAt(catKey, col)
    return m.length > 0 && m.every(a => a.status === 'completed')
  }

  // ========== SCROLL TO CURRENT ==========
  useEffect(() => {
    if (!scrollRef.current) return
    setTimeout(() => {
      const el = document.getElementById('tcol-current')
      if (el) {
        const c = scrollRef.current
        c.scrollTo({ left: el.offsetLeft - c.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' })
      }
    }, 100)
  }, [mode, selectedWeek, currentWeek])

  // ========== SIZING ==========
  const dotSize = (col) => col.type === 'week' ? (isMobile ? 38 : 52) : col.isWeekStart ? (isMobile ? 36 : 50) : (isMobile ? 28 : 40)
  const colW = (col) => col.type === 'week' ? (isMobile ? 50 : 68) : col.isWeekStart ? (isMobile ? 44 : 62) : (isMobile ? 36 : 50)
  const circleSize = (col) => col.type === 'week' ? (isMobile ? 30 : 42) : (isMobile ? 22 : 32)
  const connH = isMobile ? 10 : 16

  // ========== POSITION HELPERS ==========
  const isCurrent = (col) => {
    if (col.type === 'week') return col.week === currentWeek
    if (!startDate) return false
    return getDateForWeekDay(startDate, col.week, col.day).toDateString() === new Date().toDateString()
  }
  const isSelected = (col) => col.type === 'week' ? col.week === selectedWeek : (col.week === selectedWeek && col.day === selectedDay)
  const isPast = (col) => {
    if (col.type === 'week') return col.week < currentWeek
    if (!startDate) return false
    return getDateForWeekDay(startDate, col.week, col.day) < new Date()
  }

  // ========== Is this column an evaluation week? ==========
  const isEvalWeek = (col) => {
    if (evaluationWeeks.length === 0) return false
    if (col.type === 'week') return evaluationWeeks.includes(col.week)
    // For day view: only show on Monday (day 0) of eval weeks
    return col.day === 0 && evaluationWeeks.includes(col.week)
  }

  return (
    <div style={{
      background: 'rgba(10,10,10,0.95)',
      borderTop: `1px solid ${G.border}`, borderBottom: `1px solid ${G.border}`,
      paddingTop: isMobile ? '0.4rem' : '0.6rem',
      paddingBottom: isMobile ? '0.3rem' : '0.4rem',
      userSelect: 'none'
    }}>
      {/* VIEW MODE SWITCHER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', marginBottom: '0.4rem', padding: '0 0.75rem' }}>
        {VIEW_MODES.map(vm => {
          const Icon = vm.icon
          const active = mode === vm.id
          return (
            <button key={vm.id} onClick={() => onSetViewMode(vm.id)} style={{
              padding: isMobile ? '0.25rem 0.5rem' : '0.4rem 0.85rem',
              borderRadius: '8px',
              background: active ? `${G.gold}15` : 'rgba(255,255,255,0.02)',
              border: `1px solid ${active ? `${G.gold}40` : 'rgba(255,255,255,0.06)'}`,
              color: active ? G.gold : G.textDim,
              fontSize: isMobile ? '0.55rem' : '0.75rem', fontWeight: active ? '700' : '500',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={isMobile ? 10 : 12} />{vm.label}
            </button>
          )
        })}
      </div>

      {/* Date range */}
      {mode !== 'full' && (
        <p style={{ textAlign: 'center', fontSize: isMobile ? '0.5rem' : '0.7rem', color: G.gold, fontWeight: '600', margin: '0 0 0.3rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {mode === '1week' ? `Week ${selectedWeek || currentWeek}` : `Week ${Math.max(1, (selectedWeek || currentWeek) - 1)} t/m ${Math.min(totalWeeks, (selectedWeek || currentWeek) + 2)}`}
        </p>
      )}

      {/* SCROLLABLE */}
      <div ref={scrollRef} style={{ overflowX: 'auto', overflowY: 'hidden', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        <style>{`div::-webkit-scrollbar{display:none} @keyframes pulse-now{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(1.15)}}`}</style>
        <div style={{ display: 'inline-flex', flexDirection: 'column', minWidth: '100%', padding: `0 ${isMobile ? '0.75rem' : '1rem'}` }}>

          {/* ROW: CALL */}
          <CatRow catKey="call" columns={columns} actionsAt={actionsAt} isCompletedAt={isCompletedAt} colW={colW} circleSize={circleSize} isMobile={isMobile} onOpenActionModal={onOpenActionModal} />
          <ConnRow columns={columns} colW={colW} h={connH} topCat="call" botCat="bericht" actionsAt={actionsAt} />

          {/* ROW: BERICHT */}
          <CatRow catKey="bericht" columns={columns} actionsAt={actionsAt} isCompletedAt={isCompletedAt} colW={colW} circleSize={circleSize} isMobile={isMobile} onOpenActionModal={onOpenActionModal} />
          <ConnRow columns={columns} colW={colW} h={connH} topCat="bericht" botCat="dot" actionsAt={actionsAt} alwaysBot />

          {/* PROGRESS ARROW */}
          <ProgressArrow columns={columns} colW={colW} isCurrent={isCurrent} isPast={isPast} isMobile={isMobile} />

          {/* ROW: DOTS (golden spine) + EVALUATION MARKERS */}
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            {columns.map((col, i) => {
              const phase = getPhase(col.week)
              const phaseColor = phase?.color || G.gold
              const curr = isCurrent(col)
              const sel = isSelected(col)
              const past = isPast(col)
              const size = dotSize(col)
              const w = colW(col)
              const isEval = isEvalWeek(col)

              return (
                <div key={i} id={curr ? 'tcol-current' : undefined} style={{
                  width: `${w}px`, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.05rem'
                }}>
                  {/* Week label */}
                  {col.isWeekStart && mode !== 'full' && (
                    <span style={{ fontSize: isMobile ? '0.42rem' : '0.6rem', fontWeight: '700', color: `${G.gold}60`, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>W{col.week}</span>
                  )}

                  {/* EVALUATION MARKER — red dot above the golden dot */}
                  {isEval && !curr && (
                    <div
                      onClick={(e) => { e.stopPropagation(); onOpenEvaluation && onOpenEvaluation(col.week) }}
                      style={{
                        width: isMobile ? '8px' : '10px',
                        height: isMobile ? '8px' : '10px',
                        borderRadius: '50%',
                        background: col.week <= currentWeek ? '#ef4444' : 'rgba(239,68,68,0.25)',
                        border: `1.5px solid ${col.week <= currentWeek ? 'rgba(239,68,68,0.7)' : 'rgba(239,68,68,0.3)'}`,
                        cursor: 'pointer', marginBottom: '0.1rem',
                        boxShadow: col.week <= currentWeek ? '0 0 6px rgba(239,68,68,0.4)' : 'none',
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      title={`Evaluatie Week ${col.week}`}
                    />
                  )}

                  {/* NOW MARKER — always on current position when coaching plan exists */}
                  {curr && coachingPlan && (
                    <div
                      onClick={(e) => { e.stopPropagation(); onOpenEvaluation && onOpenEvaluation(currentWeek) }}
                      style={{
                        width: isMobile ? '10px' : '12px',
                        height: isMobile ? '10px' : '12px',
                        borderRadius: '50%',
                        background: isEval ? '#ef4444' : G.gold,
                        border: `2px solid ${isEval ? 'rgba(239,68,68,0.8)' : G.gold}`,
                        cursor: 'pointer', marginBottom: '0.1rem',
                        boxShadow: `0 0 8px ${isEval ? 'rgba(239,68,68,0.5)' : 'rgba(212,168,83,0.5)'}`,
                        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                        animation: 'pulse-now 2s ease-in-out infinite'
                      }}
                      title="Tussenstand bekijken"
                    />
                  )}

                  {/* GOLDEN DOT */}
                  <div
                    onClick={() => {
                      if (col.type === 'week') onSelectWeek(col.week)
                      else { onSelectWeek(col.week); onSelectDay(col.day) }
                    }}
                    style={{
                      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                      border: sel ? `2.5px solid ${G.gold}` : curr ? `2px solid ${G.gold}` : past ? `1.5px solid ${G.gold}25` : `1.5px solid ${G.gold}15`,
                      background: sel ? 'rgba(23,23,23,0.9)' : curr ? 'rgba(212,168,83,0.08)' : past ? 'rgba(23,23,23,0.5)' : 'rgba(23,23,23,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', position: 'relative', overflow: 'hidden',
                      boxShadow: sel ? '0 0 18px rgba(212,168,83,0.25)' : curr ? '0 0 12px rgba(212,168,83,0.15)' : 'none',
                      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.2s ease', transform: 'translateZ(0)',
                      opacity: !past && !curr && !sel ? 0.7 : 1
                    }}
                  >
                    {(sel || curr) && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', pointerEvents: 'none' }} />}
                    <span style={{
                      fontSize: col.isWeekStart ? (isMobile ? '0.5rem' : '0.7rem') : (col.type === 'week' ? (isMobile ? '0.55rem' : '0.75rem') : (isMobile ? '0.4rem' : '0.55rem')),
                      fontWeight: sel || curr || col.isWeekStart ? '700' : '500',
                      color: sel ? G.text : curr ? G.gold : past ? G.textMuted : G.textDim,
                      textTransform: 'uppercase', letterSpacing: '0.02em',
                      position: 'relative', zIndex: 1, lineHeight: 1
                    }}>
                      {col.type === 'week'
                        ? (col.week === 0 ? 'PRE' : `W${col.week}`)
                        : startDate
                          ? ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'][getDateForWeekDay(startDate, col.week, col.day).getDay()]
                          : DAY_LABELS[col.day]
                      }
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}


// ============================================
// CATEGORY ROW
// ============================================
function CatRow({ catKey, columns, actionsAt, isCompletedAt, colW, circleSize, isMobile, onOpenActionModal, alwaysShow }) {
  const cat = CATS[catKey]
  const Icon = cat.icon
  const hasAny = alwaysShow || columns.some(col => actionsAt(catKey, col).length > 0)
  if (!hasAny) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {columns.map((col, i) => {
        const has = actionsAt(catKey, col).length > 0
        const done = isCompletedAt(catKey, col)
        const size = circleSize(col)
        const w = colW(col)
        return (
          <div key={i} style={{ width: `${w}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${size + 6}px` }}>
            {has && (
              <div onClick={() => onOpenActionModal && onOpenActionModal(catKey, col.type === 'week' ? col.week : col.day, col.week)}
                style={{
                  width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                  background: done ? `${G.green}10` : cat.bg,
                  border: `1.5px solid ${done ? `${G.green}50` : cat.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  boxShadow: `0 0 8px ${done ? G.green : cat.color}12`,
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.2s ease', transform: 'translateZ(0)'
                }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)', pointerEvents: 'none' }} />
                {done ? <CheckCircle size={size * 0.4} color={G.green} style={{ position: 'relative', zIndex: 1 }} />
                  : <Icon size={size * 0.4} color={cat.color} style={{ position: 'relative', zIndex: 1 }} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}


// ============================================
// CONNECTOR ROW
// ============================================
function ConnRow({ columns, colW, h, topCat, botCat, actionsAt, alwaysBot }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {columns.map((col, i) => {
        const topHas = topCat === 'dot' || (actionsAt(topCat, col).length > 0)
        const botHas = botCat === 'dot' || alwaysBot || (actionsAt(botCat, col).length > 0)
        const show = topHas && botHas
        let color = 'rgba(255,255,255,0.04)'
        if (show && topCat !== 'dot') color = `${CATS[topCat].color}20`
        else if (show && botCat !== 'dot' && CATS[botCat]) color = `${CATS[botCat].color}20`
        else if (show) color = `${G.gold}15`
        const w = colW(col)
        return (
          <div key={i} style={{ width: `${w}px`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', height: `${h}px` }}>
            {show && <div style={{ width: '1.5px', height: '100%', background: color, borderRadius: '1px' }} />}
          </div>
        )
      })}
    </div>
  )
}


// ============================================
// PROGRESS ARROW
// ============================================
function ProgressArrow({ columns, colW, isCurrent, isPast, isMobile }) {
  // Vangrail. De oorzaak van de lege lijst is hierboven weggenomen, maar een
  // pijl die nergens naar wijst hoort geen witte pagina op te leveren.
  if (!columns?.length) return null

  let currentIdx = columns.findIndex(c => isCurrent(c))
  if (currentIdx === -1) currentIdx = columns.filter(c => isPast(c)).length - 1
  if (currentIdx < 0) currentIdx = 0

  let px = 0
  for (let i = 0; i < currentIdx; i++) px += colW(columns[i])
  px += colW(columns[currentIdx]) / 2

  let filledW = 0
  for (let i = 0; i <= currentIdx; i++) filledW += colW(columns[i])
  filledW -= colW(columns[currentIdx]) / 2

  return (
    <div style={{ position: 'relative', height: isMobile ? '14px' : '18px', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ position: 'absolute', left: 0, bottom: 0, width: `${filledW}px`, height: '2px', background: `linear-gradient(90deg, ${G.gold}40, ${G.gold})`, borderRadius: '1px' }} />
      <div style={{ position: 'absolute', left: `${filledW}px`, right: 0, bottom: 0, height: '2px', background: 'rgba(255,255,255,0.03)', borderRadius: '1px' }} />
      <div style={{ position: 'absolute', left: `${px}px`, bottom: 0, transform: 'translate(-50%, 1px)', zIndex: 2 }}>
        <div style={{ width: 0, height: 0, borderLeft: `${isMobile ? 4 : 5}px solid transparent`, borderRight: `${isMobile ? 4 : 5}px solid transparent`, borderTop: `${isMobile ? 6 : 7}px solid ${G.gold}`, filter: `drop-shadow(0 0 3px ${G.gold}40)` }} />
      </div>
      <div style={{ position: 'absolute', left: `${px}px`, top: 0, transform: 'translateX(-50%)', fontSize: '0.38rem', fontWeight: '800', color: G.gold, letterSpacing: '0.08em' }}>NU</div>
    </div>
  )
}
