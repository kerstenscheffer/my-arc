// src/modules/output-planning/components/week-planning/constants.js
// Week Planning Constants & Theme Configuration
// UPDATED: Added Sales phases and gold color

// Gold Theme
export const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Content Piece Colors (for visual tracking)
export const CONTENT_COLORS = {
  red: { 
    bg: 'rgba(239, 68, 68, 0.15)', 
    border: 'rgba(239, 68, 68, 0.4)', 
    primary: '#ef4444',
    label: 'Rood'
  },
  orange: { 
    bg: 'rgba(249, 115, 22, 0.15)', 
    border: 'rgba(249, 115, 22, 0.4)', 
    primary: '#f97316',
    label: 'Oranje'
  },
  yellow: { 
    bg: 'rgba(234, 179, 8, 0.15)', 
    border: 'rgba(234, 179, 8, 0.4)', 
    primary: '#eab308',
    label: 'Geel'
  },
  green: { 
    bg: 'rgba(34, 197, 94, 0.15)', 
    border: 'rgba(34, 197, 94, 0.4)', 
    primary: '#22c55e',
    label: 'Groen'
  },
  blue: { 
    bg: 'rgba(59, 130, 246, 0.15)', 
    border: 'rgba(59, 130, 246, 0.4)', 
    primary: '#3b82f6',
    label: 'Blauw'
  },
  purple: { 
    bg: 'rgba(139, 92, 246, 0.15)', 
    border: 'rgba(139, 92, 246, 0.4)', 
    primary: '#8b5cf6',
    label: 'Paars'
  },
  pink: { 
    bg: 'rgba(236, 72, 153, 0.15)', 
    border: 'rgba(236, 72, 153, 0.4)', 
    primary: '#ec4899',
    label: 'Roze'
  },
  cyan: { 
    bg: 'rgba(6, 182, 212, 0.15)', 
    border: 'rgba(6, 182, 212, 0.4)', 
    primary: '#06b6d4',
    label: 'Cyan'
  },
  // NIEUW: Gold voor sales
  gold: {
    bg: 'rgba(255, 215, 0, 0.15)',
    border: 'rgba(255, 215, 0, 0.4)',
    primary: '#FFD700',
    label: 'Goud (Sales)'
  }
}

// Phase Configuration
export const PHASES = {
  // Content phases
  script: {
    id: 'script',
    label: 'Script',
    shortLabel: 'SCR',
    icon: 'FileText',
    color: '#a855f7', // Purple
    description: 'Script/hook uitwerken'
  },
  shoot: {
    id: 'shoot',
    label: 'Shoot',
    shortLabel: 'SHT',
    icon: 'Video',
    color: '#f97316', // Orange
    description: 'Opnames maken'
  },
  edit: {
    id: 'edit',
    label: 'Edit',
    shortLabel: 'EDT',
    icon: 'Scissors',
    color: '#3b82f6', // Blue
    description: 'Bewerken/monteren'
  },
  post: {
    id: 'post',
    label: 'Post',
    shortLabel: 'PST',
    icon: 'Send',
    color: '#22c55e', // Green
    description: 'Publiceren'
  },
  // NIEUW: Sales phases
  prep: {
    id: 'prep',
    label: 'Prep',
    shortLabel: 'PREP',
    icon: 'ClipboardList',
    color: '#D4AF37', // Dark gold
    description: 'Call voorbereiden'
  },
  followup: {
    id: 'followup',
    label: 'Follow-up',
    shortLabel: 'FUP',
    icon: 'MessageSquare',
    color: '#B8860B', // Darker gold
    description: 'Follow-up bericht'
  },
  call: {
    id: 'call',
    label: 'Call',
    shortLabel: 'CALL',
    icon: 'Phone',
    color: '#FFD700', // Bright gold
    description: 'Sales call'
  },
  aftersale: {
    id: 'aftersale',
    label: 'After Sale',
    shortLabel: 'AFT',
    icon: 'Star',
    color: '#DAA520', // Goldenrod
    description: 'After sale + reflectie'
  }
}

// Content Types
export const CONTENT_TYPES = {
  reel: { label: 'Reel', icon: 'Film', needsShoot: true, needsEdit: true },
  carousel: { label: 'Carousel', icon: 'Images', needsShoot: false, needsEdit: true },
  story: { label: 'Story', icon: 'Circle', needsShoot: true, needsEdit: false },
  photo_post: { label: 'Foto Post', icon: 'Image', needsShoot: true, needsEdit: false },
  video_post: { label: 'Video Post', icon: 'Video', needsShoot: true, needsEdit: true },
  text_post: { label: 'Text Post', icon: 'Type', needsShoot: false, needsEdit: false }
}

// Days
export const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
export const DAYS_FULL = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

// Timeline Configuration
export const TIMELINE = {
  startHour: 6,   // 06:00
  endHour: 23,    // 23:00
  hourHeight: 60, // pixels per hour
  slotMinutes: 15 // snap to 15 min intervals
}

// Duration Options
export const DURATION_OPTIONS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 uur' },
  { value: 90, label: '1.5 uur' },
  { value: 120, label: '2 uur' },
  { value: 180, label: '3 uur' }
]

// Time Options (for dropdowns)
export const TIME_OPTIONS = []
for (let h = TIMELINE.startHour; h <= TIMELINE.endHour; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hour = h.toString().padStart(2, '0')
    const minute = m.toString().padStart(2, '0')
    TIME_OPTIONS.push({ value: `${hour}:${minute}`, label: `${hour}:${minute}` })
  }
}

// Helper Functions
export function getTimePosition(timeString) {
  if (!timeString) return null
  const [hours, minutes] = timeString.split(':').map(Number)
  const minutesFromStart = (hours - TIMELINE.startHour) * 60 + minutes
  return minutesFromStart // 1 pixel = 1 minute
}

export function getPositionTime(position) {
  const totalMinutes = Math.round(position / TIMELINE.slotMinutes) * TIMELINE.slotMinutes
  const hours = TIMELINE.startHour + Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function formatTime(timeString) {
  if (!timeString) return ''
  return timeString.substring(0, 5) // HH:MM
}
