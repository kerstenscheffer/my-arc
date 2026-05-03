// ============================================
// 📁 FILE: src/modules/client-journey/journeyConfig.js
// Shared constants, templates, colors, helpers
// ============================================
import { Send, ClipboardList, Phone, Eye, Flag, FileText } from 'lucide-react'

// Premium Gold Theme
export const G = {
  gold: '#d4a853', goldLight: '#e2c97e', goldDark: '#a8872e',
  bg: '#000', card: '#0a0a0a', cardHover: '#111',
  border: 'rgba(212,168,83,0.12)', borderActive: 'rgba(212,168,83,0.35)',
  glow: '0 0 20px rgba(212,168,83,0.12)', glowStrong: '0 0 30px rgba(212,168,83,0.2)',
  text: '#fff', textMuted: 'rgba(255,255,255,0.45)', textDim: 'rgba(255,255,255,0.2)',
  green: '#10b981', red: '#ef4444', yellow: '#f59e0b', blue: '#3b82f6', purple: '#8b5cf6', pink: '#ec4899',
  gradient: 'linear-gradient(135deg, #d4a853, #c9952c)',
  gradientSubtle: 'linear-gradient(135deg, rgba(212,168,83,0.15), rgba(212,168,83,0.05))'
}

export const ACTION_TYPES = {
  message: { icon: Send, color: G.blue, label: 'Bericht', mini: '📨' },
  task: { icon: ClipboardList, color: G.green, label: 'To-do', mini: '✅' },
  call_prep: { icon: Phone, color: G.yellow, label: 'Call', mini: '📞' },
  check_in: { icon: Eye, color: G.purple, label: 'Check-in', mini: '👁' },
  milestone: { icon: Flag, color: G.red, label: 'Milestone', mini: '🏆' },
  deliverable: { icon: FileText, color: G.pink, label: 'Deliverable', mini: '📦' }
}

export const CALL_FREQ = {
  weekly: { label: 'Wekelijks', interval: 1 },
  biweekly: { label: 'Elke 2 weken', interval: 2 },
  monthly: { label: 'Maandelijks', interval: 4 }
}

export const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export const TEMPLATES = {
  '12_weeks': { id: '12_weeks', name: '12 Weken Transformatie', description: 'Intensief traject', total_weeks: 12, call_frequency: 'weekly', phases: [{ week_start: 1, week_end: 2, name: 'Onboarding', color: G.blue }, { week_start: 3, week_end: 6, name: 'Foundation', color: G.green }, { week_start: 7, week_end: 10, name: 'Momentum', color: G.yellow }, { week_start: 11, week_end: 12, name: 'Afronding', color: G.red }] },
  '6_months': { id: '6_months', name: '6 Maanden Coaching', description: 'Halfjaar traject', total_weeks: 26, call_frequency: 'weekly', phases: [{ week_start: 1, week_end: 2, name: 'Onboarding', color: G.blue }, { week_start: 3, week_end: 8, name: 'Foundation', color: G.green }, { week_start: 9, week_end: 16, name: 'Opbouw', color: G.yellow }, { week_start: 17, week_end: 22, name: 'Verdieping', color: G.purple }, { week_start: 23, week_end: 26, name: 'Afronding', color: G.red }] },
  'monthly': { id: 'monthly', name: 'Maandelijks Onbepaald', description: 'Doorlopend traject', total_weeks: 52, call_frequency: 'weekly', phases: [{ week_start: 1, week_end: 2, name: 'Onboarding', color: G.blue }, { week_start: 3, week_end: 12, name: 'Foundation', color: G.green }, { week_start: 13, week_end: 26, name: 'Groei', color: G.yellow }, { week_start: 27, week_end: 40, name: 'Verdieping', color: G.purple }, { week_start: 41, week_end: 52, name: 'Mastery', color: G.pink }] }
}

// Generate default actions for a journey
export function generateDefaultActions(totalWeeks, callFrequency) {
  const a = [], ci = CALL_FREQ[callFrequency]?.interval || 1
  a.push({ week: 1, day: 0, title: 'Welkomstbericht sturen', type: 'message' })
  a.push({ week: 1, day: 0, title: 'Intake call', type: 'call_prep' })
  a.push({ week: 1, day: 1, title: 'Workout plan klaarzetten', type: 'deliverable' })
  a.push({ week: 2, day: 0, title: 'Meal plan klaarzetten', type: 'deliverable' })
  a.push({ week: 2, day: 2, title: 'Check-in bericht', type: 'message' })
  for (let w = 2; w <= totalWeeks; w++) {
    if ((w - 1) % ci === 0) a.push({ week: w, day: 0, title: `Week ${w} call`, type: 'call_prep' })
  }
  for (let w = 4; w <= totalWeeks; w += 2) {
    if (!a.some(x => x.week === w && x.type === 'call_prep'))
      a.push({ week: w, day: 3, title: 'Check-in bericht', type: 'message' })
  }
  for (let w = 4; w <= totalWeeks; w += 4) {
    a.push({ week: w, day: 4, title: "Foto's opvragen", type: 'check_in' })
    a.push({ week: w, day: 5, title: 'Plan bijstellen', type: 'task' })
  }
  a.push({ week: Math.round(totalWeeks / 2), day: 0, title: 'Halverwege evaluatie', type: 'milestone' })
  a.push({ week: totalWeeks, day: 0, title: 'Eindresultaat meting', type: 'milestone' })
  a.push({ week: totalWeeks, day: 0, title: 'Vervolg bespreken', type: 'call_prep' })
  return a.sort((x, y) => x.week - y.week || x.day - y.day)
}

export function scalePhases(orig, origW, newW) {
  if (origW === newW) return orig
  const r = newW / origW
  return orig.map(p => ({
    ...p,
    week_start: Math.max(1, Math.round(p.week_start * r)),
    week_end: Math.min(newW, Math.round(p.week_end * r))
  }))
}

export function getDateForWeekDay(startDate, week, day) {
  const d = new Date(startDate)
  d.setDate(d.getDate() + ((week - 1) * 7) + (day || 0))
  return d
}

// Shared styles
export const navBtn = (m) => ({ width: m ? '28px' : '32px', height: m ? '28px' : '32px', borderRadius: '8px', background: `${G.gold}08`, border: `1px solid ${G.gold}20`, color: G.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', padding: 0 })
export const lbl = { display: 'block', fontSize: '0.72rem', fontWeight: '500', color: G.textMuted, marginBottom: '0.25rem' }
export const inp = (m) => ({ width: '100%', padding: m ? '0.6rem 0.75rem' : '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, color: G.text, fontSize: m ? '0.85rem' : '0.9rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' })
