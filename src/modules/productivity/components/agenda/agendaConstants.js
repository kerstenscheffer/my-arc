// src/modules/productivity/components/agenda/agendaConstants.js
// Layout + content config for the agenda/week view. One source of truth for
// hours, pauzes, coaching slots and color tokens — keep all magic numbers
// here so the view component stays render-only.

// Day columns in Ma–Zo order. DB column `scheduled_day` uses the English id.
export const DAYS = [
  { id: 'monday',    short: 'Ma', label: 'Maandag' },
  { id: 'tuesday',   short: 'Di', label: 'Dinsdag' },
  { id: 'wednesday', short: 'Wo', label: 'Woensdag' },
  { id: 'thursday',  short: 'Do', label: 'Donderdag' },
  { id: 'friday',    short: 'Vr', label: 'Vrijdag' },
  { id: 'saturday',  short: 'Za', label: 'Zaterdag' },
  { id: 'sunday',    short: 'Zo', label: 'Zondag' },
]

// Visible hour range. Inclusive start, exclusive end (so 6..24 = 18 hours).
export const START_HOUR = 6
export const END_HOUR   = 24 // last labelled tick (midnight)

// Pixels per hour. 60 = 1 minute per pixel — clean math for positioning.
export const HOUR_PX = 60

// Total grid height in pixels for the time-area.
export const GRID_HEIGHT = (END_HOUR - START_HOUR) * HOUR_PX

// Helpers ────────────────────────────────────────────────────────────────────
// "HH:MM" -> integer minutes since START_HOUR (used for top-offset)
export const timeToMinutes = (t) => {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return (h - START_HOUR) * 60 + m
}
// minutes (int, since START_HOUR) -> "HH:MM"
export const minutesToTime = (mins) => {
  const total = mins + START_HOUR * 60
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
// Snap-step in minutes for drag + resize. 10 gives finer control than the
// classic 15-minute calendar grid so tasks can sit back-to-back at, say,
// 10:00 and 10:10. Change once here to retune the whole agenda.
export const SNAP_MINUTES = 10
// Snap minute count to the nearest SNAP_MINUTES increment.
export const snapTo15 = (mins) => Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES

// ── Reserved blocks: pauzes ─────────────────────────────────────────────────
// Pauzes are "fixed breaks" — visually dimmed, non-droppable.
const MA_TO_WO = ['monday', 'tuesday', 'wednesday']
const DO_TO_VR = ['thursday', 'friday']

export const PAUZE_BLOCKS = [
  // Lunch
  ...MA_TO_WO.map(day => ({ day, start: '12:00', end: '12:45', label: 'Lunch' })),
  ...DO_TO_VR.map(day => ({ day, start: '12:00', end: '12:30', label: 'Lunch' })),
  // Korte pauze
  ...MA_TO_WO.map(day => ({ day, start: '15:30', end: '16:00', label: 'Pauze' })),
]

// ── Reserved blocks: coaching ───────────────────────────────────────────────
// Coaching gets its own neutral slate color so it visually reads as "fixed
// appointment" rather than a moveable task. Section-color is intentionally
// ignored here.
export const COACHING_COLOR = '#64748b' // slate-500
export const COACHING_BLOCKS = [
  ...MA_TO_WO.map(day => ({ day, start: '16:30', end: '18:00', label: 'Coaching' })),
  ...DO_TO_VR.map(day => ({ day, start: '13:15', end: '14:45', label: 'Coaching' })),
]

// ── Conflict detection ──────────────────────────────────────────────────────
// Returns true when [startMin, endMin) overlaps a "hard" reserved block
// (pauzes only). Coaching slots are visually reserved but tasks CAN be
// scheduled over them — sometimes coaching itself is the task.
export const overlapsReserved = (day, startMin, endMin) => {
  return PAUZE_BLOCKS.filter(b => b.day === day).some(b => {
    const bs = timeToMinutes(b.start)
    const be = timeToMinutes(b.end)
    return startMin < be && endMin > bs
  })
}

// Returns true when [startMin, endMin) overlaps any task on the same day,
// excluding the task being moved (excludeId).
export const overlapsTasks = (tasksOnDay, startMin, endMin, excludeId = null) => {
  return tasksOnDay.some(t => {
    if (excludeId && t.id === excludeId) return false
    const ts = timeToMinutes(t.scheduled_start_time)
    const te = timeToMinutes(t.scheduled_end_time)
    if (ts == null || te == null) return false
    return startMin < te && endMin > ts
  })
}

// Find the next free start-time on a day (used when dropping on a day header
// without a specific hour — places task at the end of that day's schedule).
// Returns null if no slot of `durationMin` fits before END_HOUR.
export const findNextFreeSlot = (day, tasksOnDay, durationMin) => {
  let cursor = 0 // minutes from START_HOUR
  const maxCursor = (END_HOUR - START_HOUR) * 60 - durationMin
  while (cursor <= maxCursor) {
    const end = cursor + durationMin
    if (!overlapsReserved(day, cursor, end) && !overlapsTasks(tasksOnDay, cursor, end)) {
      return cursor
    }
    cursor += SNAP_MINUTES // step by snap-grid
  }
  return null
}

// ── Week helpers ────────────────────────────────────────────────────────────
// ISO week number for a given Date.
export const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

// Monday-anchored start of the week for any Date.
export const getMondayOfWeek = (date) => {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// English weekday id from a Date — matches DB scheduled_day values.
const WEEKDAY_IDS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
export const getTodayDayId = () => WEEKDAY_IDS[new Date().getDay()]

// Given a Monday anchor + weekday id (e.g. 'thursday'), return the concrete
// Date for that weekday in that week. Used to attach `scheduled_date` to
// tasks created via the agenda so week-navigation can show them on the
// right week instead of repeating them every week.
const DAY_OFFSET = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 }
export const dateForDayInWeek = (weekAnchor, dayId) => {
  const d = new Date(weekAnchor)
  d.setDate(d.getDate() + (DAY_OFFSET[dayId] ?? 0))
  d.setHours(0, 0, 0, 0)
  return d
}
// Date -> 'YYYY-MM-DD' (local, not UTC — matches Postgres `date` column).
export const toISODate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
