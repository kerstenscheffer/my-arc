// src/modules/shopping/tabs/components/ShoppingWeekHeader.jsx
//
// Sticky header bovenaan de boodschappen-pagina, gelijk in stijl aan de
// MealDayNavHeader op de meal-pagina maar dan voor WEKEN: pijl-links +
// "Week X · 15–21 jun" titel + pijl-rechts. Daaronder een day-chip-rij om
// te schakelen tussen "Hele week" en een specifieke dag.
//
// State:
//   weekOffset   — 0 = deze week, 1 = volgende, -1 = vorige
//   selectedDay  — null = hele week, 'monday'..'sunday' = specifieke dag

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const DAYS = [
  { id: 'monday',    short: 'Ma', long: 'Maandag' },
  { id: 'tuesday',   short: 'Di', long: 'Dinsdag' },
  { id: 'wednesday', short: 'Wo', long: 'Woensdag' },
  { id: 'thursday',  short: 'Do', long: 'Donderdag' },
  { id: 'friday',    short: 'Vr', long: 'Vrijdag' },
  { id: 'saturday',  short: 'Za', long: 'Zaterdag' },
  { id: 'sunday',    short: 'Zo', long: 'Zondag' },
]

// Bereken de maandag van de week voor een gegeven offset (0 = deze week).
const getWeekStart = (offset = 0) => {
  const d = new Date()
  const dow = d.getDay() // 0 = sunday
  const diffToMonday = (dow === 0 ? -6 : 1 - dow)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + diffToMonday + offset * 7)
  return d
}

const formatDateRange = (start) => {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const sDay = start.getDate()
  const eDay = end.getDate()
  const sMonth = start.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '')
  const eMonth = end.toLocaleDateString('nl-NL', { month: 'short' }).replace('.', '')
  if (sMonth === eMonth) return `${sDay}–${eDay} ${sMonth}`
  return `${sDay} ${sMonth} – ${eDay} ${eMonth}`
}

const todayDayKey = () => {
  const d = new Date().getDay()
  return DAYS[d === 0 ? 6 : d - 1].id
}

export default function ShoppingWeekHeader({
  weekOffset = 0,
  onWeekChange,
  selectedDay,           // null = hele week
  onDayChange,
  isMobile,
}) {
  const start = getWeekStart(weekOffset)
  const range = formatDateRange(start)

  const relativeLabel = weekOffset === 0 ? 'Deze week'
                      : weekOffset === 1 ? 'Volgende week'
                      : weekOffset === -1 ? 'Vorige week'
                      : weekOffset > 0 ? `Over ${weekOffset} weken`
                      : `${Math.abs(weekOffset)} weken terug`

  const arrowBtnStyle = (disabled) => ({
    width: isMobile ? 38 : 42,
    height: isMobile ? 38 : 42,
    background: 'transparent',
    border: 'none',
    color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    flexShrink: 0,
  })

  const today = todayDayKey()

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      paddingTop: 'env(safe-area-inset-top, 0)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* ROW 1 — Week navigatie */}
      <div style={{
        maxWidth: 1400, margin: '0 auto',
        padding: isMobile ? '0.55rem 0.85rem' : '0.7rem 1.5rem',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={() => onWeekChange?.(weekOffset - 1)}
          aria-label="Vorige week"
          style={arrowBtnStyle(false)}
        >
          <ChevronLeft size={isMobile ? 22 : 24} strokeWidth={2.4} />
        </button>

        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <div style={{
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: 900,
            color: '#FFD700',
            letterSpacing: '-0.02em',
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap',
          }}>
            {relativeLabel}
            {weekOffset === 0 && (
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                color: '#000',
                background: '#FFD700',
                padding: '2px 7px',
                borderRadius: 4,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Nu
              </span>
            )}
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.82rem',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.65)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Calendar size={isMobile ? 11 : 12} strokeWidth={2.4} />
            {range}
          </div>
        </div>

        <button
          onClick={() => onWeekChange?.(weekOffset + 1)}
          aria-label="Volgende week"
          style={arrowBtnStyle(false)}
        >
          <ChevronRight size={isMobile ? 22 : 24} strokeWidth={2.4} />
        </button>
      </div>

      {/* ROW 2 — Day chips: "Hele week" + 7 dagen */}
      <div style={{
        display: 'flex',
        gap: 5,
        padding: isMobile ? '0 0.85rem 0.65rem' : '0 1.5rem 0.8rem',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <button
          onClick={() => onDayChange?.(null)}
          style={dayChipStyle(selectedDay === null, isMobile, false)}
        >
          Hele week
        </button>
        {DAYS.map(d => {
          const active = selectedDay === d.id
          const isToday = d.id === today && weekOffset === 0
          return (
            <button
              key={d.id}
              onClick={() => onDayChange?.(d.id)}
              style={dayChipStyle(active, isMobile, isToday)}
            >
              {d.short}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const dayChipStyle = (active, isMobile, isToday) => ({
  flexShrink: 0,
  minWidth: isMobile ? 50 : 60,
  minHeight: 36,
  padding: '0.4rem 0.7rem',
  background: active ? '#FFD700' : (isToday ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)'),
  border: `1.5px solid ${active ? '#FFD700' : (isToday ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)')}`,
  borderRadius: 999,
  color: active ? '#0a0a0a' : (isToday ? '#FFD700' : 'rgba(255,255,255,0.75)'),
  fontSize: isMobile ? '0.78rem' : '0.85rem',
  fontWeight: active ? 900 : 700,
  cursor: 'pointer',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'background 0.15s ease, color 0.15s ease',
})

export { DAYS }
