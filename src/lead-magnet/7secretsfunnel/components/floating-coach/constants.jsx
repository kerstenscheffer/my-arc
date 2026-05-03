// ========================================
// 📁 src/lead-magnet/components/floating-coach/constants.js
// Shared constants, icons, and data for FloatingCoach
// ========================================

// ══════ INLINE SVG ICONS ══════
export const XIcon = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
)
export const ArrowIcon = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
)
export const FlameIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
)
export const DumbbellIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>
)
export const ZapIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
)
export const StarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="#ffba09" stroke="#ffba09" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
)
export const TargetIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
)
export const ClockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)
export const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
)
export const WalletIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
)
export const ShieldIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
)
export const TrendingDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
)
export const CalendarIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
)
export const GiftIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ffba09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
)
export const UsersIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)

// ══════ COLORS ══════
export const GOLD = '#ffba09'
export const GOLD_DARK = '#e8a800'
export const CALENDLY_URL = 'https://calendly.com/kerstenscheffer/call-met-kersten'

// ══════ INTAKE DATA ══════
export const GOAL_OPTIONS = [
  { text: 'Een paar kilo kwijt en droger worden', icon: FlameIcon },
  { text: 'Veel gespierder en sterker worden', icon: DumbbellIcon },
  { text: 'Fitter, meer energie en beter voelen', icon: ZapIcon },
  { text: 'Alles, complete transformatie', icon: StarIcon }
]

export const MOTIVATION_OPTIONS = [
  { text: 'Valt mee, ik kijk nog rond', level: 1 },
  { text: 'Redelijk, wil graag mijn doelen halen', level: 2 },
  { text: 'Enorm gemotiveerd. Ik wil niks liever.', level: 3 }
]

export const BUDGET_OPTIONS = [
  { text: '€45 tot €55 per week', icon: WalletIcon },
  { text: '€55 tot €75 per week', icon: WalletIcon },
  { text: '€75+ per week', icon: WalletIcon },
  { text: 'Geen idee', icon: WalletIcon }
]

export const INTAKE_STEPS = [
  { key: 'goal', question: 'Wat zou je het liefst bereiken?', type: 'goal' },
  { key: 'motivation', question: 'Hoe gemotiveerd ben je om dit te bereiken?', type: 'motivation' },
  { key: 'obstacle', question: 'Wat staat je in de weg om je doel te halen?', type: 'textarea', placeholder: 'Bijv. ik weet niet wat ik moet eten of hoeveel...' },
  { key: 'budget', question: 'Hoeveel zou je maximaal willen investeren?', type: 'budget' },
  { key: 'contact', question: 'Top! Plan je gratis kennismaking.', type: 'contact' }
]

// ══════ SHARED STYLES ══════
export const optionButtonStyle = (selected, isMobile) => ({
  width: '100%',
  padding: isMobile ? '0.7rem 0.8rem' : '0.75rem 0.9rem',
  background: selected
    ? 'linear-gradient(135deg, rgba(255,186,9,0.15), rgba(255,186,9,0.08))'
    : 'rgba(255,255,255,0.03)',
  color: selected ? '#fff' : 'rgba(255,255,255,0.75)',
  border: selected
    ? `1.5px solid ${GOLD}`
    : '1.5px solid rgba(255,255,255,0.06)',
  borderRadius: '10px',
  fontSize: isMobile ? '0.78rem' : '0.83rem',
  fontWeight: '600',
  cursor: 'pointer',
  textAlign: 'left',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  lineHeight: 1.35
})

export const iconBoxStyle = (selected) => ({
  width: '28px',
  height: '28px',
  borderRadius: '8px',
  background: selected ? 'rgba(255,186,9,0.2)' : 'rgba(255,255,255,0.04)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'background 0.15s ease'
})

export const inputStyle = (isMobile) => ({
  width: '100%',
  padding: '0.8rem',
  background: 'rgba(255,255,255,0.04)',
  border: '1.5px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  color: '#fff',
  fontSize: isMobile ? '0.82rem' : '0.88rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease',
  fontFamily: 'inherit'
})

export const goldButtonStyle = (active, isMobile) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: isMobile ? '0.9rem' : '0.95rem',
  background: active
    ? `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`
    : 'rgba(255,255,255,0.06)',
  color: active ? '#000' : 'rgba(255,255,255,0.2)',
  border: 'none',
  borderRadius: '10px',
  fontSize: isMobile ? '0.88rem' : '0.92rem',
  fontWeight: '800',
  cursor: active ? 'pointer' : 'not-allowed',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  boxShadow: active ? '0 4px 15px rgba(255,186,9,0.25)' : 'none'
})
