// src/modules/content-batches/constants.js
// Content Batch System Constants
// Defines all post formats with colors, icons, and metadata
// UPDATED: Added 'blueprint' to video format defaultFields

import { 
  Images, 
  Shield, 
  Zap, 
  ArrowUpDown, 
  Camera, 
  Video,
  Dumbbell,
  UtensilsCrossed,
  MessageCircle,
  Lightbulb
} from 'lucide-react'

// ============================================
// POST FORMATS
// All available content types for batching
// ============================================

export const POST_FORMATS = {
  info_slider: {
    id: 'info_slider',
    label: 'Info Slider',
    icon: Images,
    postColor: '#3b82f6',        // Blauw
    storyColor: '#ec4899',       // Roze
    estimatedTime: '3 uur',
    itemsPerBatch: 7,
    description: 'Carousel posts met waardevolle informatie',
    defaultFields: ['title', 'location', 'caption', 'hook'],
    goals: [1, 2, 3, 5]
  },
  trust_post: {
    id: 'trust_post',
    label: 'Trust Post',
    icon: Shield,
    postColor: '#10b981',        // Groen
    storyColor: '#ec4899',
    estimatedTime: '2 uur',
    itemsPerBatch: 7,
    description: 'Autoriteit opbouwende posts',
    defaultFields: ['title', 'location', 'caption'],
    goals: [3, 4]
  },
  unpopular_statement: {
    id: 'unpopular_statement',
    label: 'Unpopular Statement',
    icon: Zap,
    postColor: '#f59e0b',        // Oranje
    storyColor: '#ec4899',
    estimatedTime: '2 uur',
    itemsPerBatch: 7,
    description: 'Mythe busts & unpopular opinions',
    defaultFields: ['title', 'location', 'caption', 'hook'],
    goals: [1, 2]
  },
  comparison: {
    id: 'comparison',
    label: 'Boven/Onder',
    icon: ArrowUpDown,
    postColor: '#8b5cf6',        // Paars
    storyColor: '#ec4899',
    estimatedTime: '3 uur',
    itemsPerBatch: 7,
    description: 'Vergelijkingen (30 min scrollen vs hardlopen)',
    defaultFields: ['title', 'location', 'caption', 'notes'],
    goals: [1, 2]
  },
  personal_photo: {
    id: 'personal_photo',
    label: 'Persoonlijke Foto',
    icon: Camera,
    postColor: '#06b6d4',        // Cyan
    storyColor: '#ec4899',
    estimatedTime: '1 uur',
    itemsPerBatch: 7,
    description: 'Gym, hardlopen, shirtless - "hem" neerzetten',
    defaultFields: ['title', 'location', 'caption'],
    goals: [1, 2, 3]
  },
  uncensored_reel: {
    id: 'uncensored_reel',
    label: 'Uncensored Reel',
    icon: Video,
    postColor: '#ef4444',        // Rood
    storyColor: '#ec4899',
    estimatedTime: '4 uur',
    itemsPerBatch: 7,
    description: 'Rauw & unscripted reels zonder editen',
    defaultFields: ['title', 'location', 'caption', 'hook', 'script', 'blueprint'],
    goals: [1, 2, 3]
  },
  workout: {
    id: 'workout',
    label: 'Workout',
    icon: Dumbbell,
    postColor: '#f97316',        // Oranje
    storyColor: '#ec4899',
    estimatedTime: '1 uur',
    itemsPerBatch: 7,
    description: 'Workout foto/video content',
    defaultFields: ['title', 'location', 'caption'],
    goals: [1, 2, 3],
    storyDefaults: {
      goal: 'autoriteit',
      topic: 'progressie'
    }
  },
  meal: {
    id: 'meal',
    label: 'Meal',
    icon: UtensilsCrossed,
    postColor: '#22c55e',        // Groen
    storyColor: '#ec4899',
    estimatedTime: '1 uur',
    itemsPerBatch: 7,
    description: "Meal foto's + macro's",
    defaultFields: ['title', 'location', 'caption'],
    goals: [1, 2, 3, 5],
    storyDefaults: {
      goal: 'autoriteit',
      topic: 'tip'
    }
  },
  interaction: {
    id: 'interaction',
    label: 'Interactie',
    icon: MessageCircle,
    postColor: '#a855f7',        // Paars
    storyColor: '#ec4899',
    estimatedTime: '30 min',
    itemsPerBatch: 7,
    description: 'Stelling + vraag voor engagement',
    defaultFields: ['title', 'caption'],
    goals: [3],
    storyDefaults: {
      goal: 'interactie',
      topic: 'probleem'
    }
  },
  quick_tip: {
    id: 'quick_tip',
    label: 'Quick Tip',
    icon: Lightbulb,
    postColor: '#eab308',        // Geel
    storyColor: '#ec4899',
    estimatedTime: '1 uur',
    itemsPerBatch: 7,
    description: 'Snelle waardevolle tips',
    defaultFields: ['title', 'caption'],
    goals: [1, 2],
    storyDefaults: {
      goal: 'waarde',
      topic: 'tip'
    }
  }
}

// ============================================
// POST GOALS (Doel van posten)
// ============================================

export const POST_GOALS = {
  1: {
    label: 'Mensen helpen',
    description: 'Waarde geven, volgers krijgen',
    color: '#10b981'
  },
  2: {
    label: 'Zichtbaar zijn',
    description: 'Vertrouwen opbouwen door aanwezigheid',
    color: '#3b82f6'
  },
  3: {
    label: 'In contact komen',
    description: 'Met mensen die je al vertrouwen',
    color: '#8b5cf6'
  },
  4: {
    label: 'Service bekendmaken',
    description: 'Conversie naar coaching',
    color: '#f59e0b'
  },
  5: {
    label: 'Leden ondersteunen',
    description: 'Extra info voor active leden',
    color: '#ec4899'
  }
}

// ============================================
// STORY SPECIFICS (for story content type)
// ============================================

export const STORY_GOALS = {
  interactie: {
    label: 'Interactie',
    icon: MessageCircle,
    color: '#ec4899'
  },
  autoriteit: {
    label: 'Autoriteit',
    icon: Shield,
    color: '#f59e0b'
  },
  waarde: {
    label: 'Waarde Delen',
    icon: Lightbulb,
    color: '#10b981'
  },
  persoonlijk: {
    label: 'Persoonlijk',
    icon: Camera,
    color: '#8b5cf6'
  },
  leven: {
    label: 'Kijkje in Leven',
    icon: Video,
    color: '#06b6d4'
  }
}

export const STORY_TOPICS = {
  progressie: {
    label: 'Mijn Progressie',
    emoji: '📈',
    color: '#10b981'
  },
  probleem: {
    label: 'Probleem Oplossen',
    emoji: '🔧',
    color: '#f59e0b'
  },
  tip: {
    label: 'Quick Tip',
    emoji: '💡',
    color: '#3b82f6'
  },
  motivatie: {
    label: 'Motivatie',
    emoji: '⚡',
    color: '#ec4899'
  }
}

// ============================================
// PLANNING TYPES
// ============================================

export const PLANNING_TYPES = {
  recurring: {
    label: 'Recurring',
    description: 'Automatisch inplannen (wekelijks/dagelijks)',
    icon: '🔄'
  },
  manual: {
    label: 'Handmatig',
    description: 'Kies zelf de dagen',
    icon: '📅'
  },
  ready: {
    label: 'Ready to Post',
    description: 'Klaar maar nog niet ingepland',
    icon: '✅'
  }
}

// ============================================
// RECURRING PATTERNS
// ============================================

export const RECURRING_PATTERNS = {
  daily: {
    label: 'Dagelijks',
    description: 'Elke dag posten',
    type: 'daily'
  },
  weekly: {
    label: 'Wekelijks',
    description: 'Elke week op dezelfde dag',
    type: 'weekly',
    requiresDay: true
  }
}

export const WEEKDAYS = [
  { id: 'monday', label: 'Maandag', short: 'Ma' },
  { id: 'tuesday', label: 'Dinsdag', short: 'Di' },
  { id: 'wednesday', label: 'Woensdag', short: 'Wo' },
  { id: 'thursday', label: 'Donderdag', short: 'Do' },
  { id: 'friday', label: 'Vrijdag', short: 'Vr' },
  { id: 'saturday', label: 'Zaterdag', short: 'Za' },
  { id: 'sunday', label: 'Zondag', short: 'Zo' }
]

// ============================================
// BATCH STATUS
// ============================================

export const BATCH_STATUS = {
  draft: {
    label: 'Draft',
    color: 'rgba(255, 255, 255, 0.3)',
    description: 'Nog niet klaar'
  },
  ready: {
    label: 'Ready',
    color: '#10b981',
    description: 'Klaar om in te plannen'
  },
  planned: {
    label: 'Gepland',
    color: '#3b82f6',
    description: 'Ingepland in kalender'
  },
  completed: {
    label: 'Voltooid',
    color: '#8b5cf6',
    description: 'Alle items gepost'
  }
}

// ============================================
// BLUEPRINT STEP TYPES (for VideoBlueprint in batches)
// ============================================

export const BLUEPRINT_STEP_TYPES = {
  hook: { label: 'HOOK', color: '#ef4444' },
  punt: { label: 'PUNT', color: '#f97316' },
  fix: { label: 'FIX', color: '#10b981' },
  cta: { label: 'CTA', color: '#3b82f6' },
  broll: { label: 'B-ROLL', color: '#8b5cf6' },
  custom: { label: 'CUSTOM', color: '#6b7280' }
}

export const BROLL_TYPES = [
  { id: 'gym', label: 'Gym', icon: '💪', color: '#ef4444' },
  { id: 'food', label: 'Food', icon: '🍳', color: '#f97316' },
  { id: 'tracking', label: 'Tracking', icon: '📱', color: '#3b82f6' },
  { id: 'transformation', label: 'Transform', icon: '📸', color: '#8b5cf6' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '☀️', color: '#10b981' },
  { id: 'custom', label: 'Anders', icon: '🎬', color: '#6b7280' }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get color for batch item based on content type
 */
export const getItemColor = (postFormat, contentType) => {
  const format = POST_FORMATS[postFormat]
  if (!format) return '#3b82f6'
  
  return contentType === 'story' ? format.storyColor : format.postColor
}

/**
 * Get icon component for post format
 */
export const getFormatIcon = (postFormat) => {
  const format = POST_FORMATS[postFormat]
  return format?.icon || Images
}

/**
 * Get display name for format
 */
export const getFormatLabel = (postFormat) => {
  const format = POST_FORMATS[postFormat]
  return format?.label || 'Unknown'
}

/**
 * Check if format should show certain fields
 */
export const shouldShowField = (postFormat, fieldName) => {
  const format = POST_FORMATS[postFormat]
  if (!format) return false
  return format.defaultFields?.includes(fieldName) || false
}
