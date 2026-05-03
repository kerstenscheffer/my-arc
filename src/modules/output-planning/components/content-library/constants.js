// src/modules/output-planning/components/content-library/constants.js
// Shared constants for ContentLibrary module
// UPDATED: Added Story system constants

import {
  Film,
  Layers,
  Image,
  MessageCircle,
  Video,
  FileText,
  Dumbbell,
  Music,
  MessageSquare,
  Award,
  Lightbulb,
  User,
  Camera,
  TrendingUp,
  AlertCircle,
  Zap,
  Heart
} from 'lucide-react'

// Gold Theme Constants
export const GOLD = {
  primary: '#FFD700',
  secondary: '#D4AF37',
  border: 'rgba(255, 215, 0, 0.3)',
  borderActive: 'rgba(255, 215, 0, 0.5)',
  glow: 'rgba(255, 215, 0, 0.2)',
  background: 'rgba(255, 215, 0, 0.08)'
}

// Content type config (for planning)
export const CONTENT_TYPES = {
  reel: { label: 'Reel', icon: Film, color: '#f97316' },
  carousel: { label: 'Carousel', icon: Layers, color: '#8b5cf6' },
  post: { label: 'Post', icon: Image, color: '#3b82f6' },
  story: { label: 'Story', icon: MessageCircle, color: '#ec4899' },
  video: { label: 'Video', icon: Video, color: '#ef4444' }
}

// Category config (for planning)
export const CATEGORIES = {
  lifestyle: { label: 'Lifestyle', color: '#f97316' },
  relatable: { label: 'Relatable', color: '#ec4899' },
  educational: { label: 'Educatief', color: '#8b5cf6' },
  social_proof: { label: 'Social Proof', color: '#10b981' },
  personal: { label: 'Persoonlijk', color: '#3b82f6' },
  entertainment: { label: 'Entertainment', color: '#eab308' }
}

// ============================================
// STORY SYSTEM CONSTANTS
// ============================================

// Story Formats - HOE ziet de story eruit?
export const STORY_FORMATS = {
  canva: { 
    label: 'Canva Slider', 
    icon: Layers, 
    color: '#8b5cf6',
    description: 'Ontworpen slides/graphics'
  },
  workout_video: { 
    label: 'Workout Video', 
    icon: Dumbbell, 
    color: '#ef4444',
    description: 'Video van je training'
  },
  praat_video: { 
    label: 'Praat Video', 
    icon: MessageCircle, 
    color: '#3b82f6',
    description: 'Praten naar camera met tip'
  },
  foto_muziek: { 
    label: 'Foto + Muziek', 
    icon: Music, 
    color: '#ec4899',
    description: 'Foto met muziek eroverheen'
  },
  screenshot: {
    label: 'Screenshot',
    icon: Image,
    color: '#10b981',
    description: 'Screenshot van chat/resultaat'
  }
}

// Story Goals - WAT is het doel?
export const STORY_GOALS = {
  interactie: { 
    label: 'Interactie', 
    icon: MessageSquare, 
    color: '#10b981',
    description: 'Reacties/polls/vragen krijgen'
  },
  autoriteit: { 
    label: 'Autoriteit', 
    icon: Award, 
    color: '#f59e0b',
    description: 'Expertise tonen'
  },
  waarde: { 
    label: 'Waarde delen', 
    icon: Lightbulb, 
    color: '#8b5cf6',
    description: 'Tips/kennis delen'
  },
  persoonlijk: { 
    label: 'Persoonlijk', 
    icon: User, 
    color: '#ec4899',
    description: 'Jezelf laten zien'
  },
  leven: { 
    label: 'Kijkje in leven', 
    icon: Camera, 
    color: '#3b82f6',
    description: 'Day in the life content'
  }
}

// Story Topics - WAAR gaat het over?
export const STORY_TOPICS = {
  progressie: { 
    label: 'Mijn progressie', 
    icon: TrendingUp,
    color: '#10b981',
    description: 'Eigen voortgang/resultaten'
  },
  probleem: { 
    label: 'Probleem oplossen', 
    icon: AlertCircle,
    color: '#ef4444',
    description: 'Veelvoorkomend probleem aanpakken'
  },
  tip: { 
    label: 'Quick tip', 
    icon: Zap,
    color: '#3b82f6',
    description: 'Snelle praktische tip'
  },
  motivatie: { 
    label: 'Motivatie', 
    icon: Heart,
    color: '#f59e0b',
    description: 'Motiverende boodschap'
  }
}

// Daily Story Templates - Standaard dagelijkse stories
export const DAILY_STORY_TEMPLATES = [
  { 
    id: 'workout',
    title: 'Workout foto', 
    format: 'foto_muziek', 
    goal: 'autoriteit', 
    topic: 'progressie',
    isRecurring: true,
    description: 'Dagelijkse gym/workout content'
  },
  { 
    id: 'meal',
    title: 'Meal + Macro\'s', 
    format: 'foto_muziek', 
    goal: 'autoriteit', 
    topic: 'tip',
    isRecurring: true,
    description: 'Maaltijd met macro breakdown'
  },
  { 
    id: 'interactie',
    title: 'Interactie', 
    format: 'canva', 
    goal: 'interactie', 
    topic: null,
    isRecurring: true,
    description: 'Poll, vraag of stelling'
  },
  { 
    id: 'extra',
    title: 'Extra/Vrij', 
    format: null, 
    goal: null, 
    topic: null,
    isRecurring: false,
    description: 'Vrije invulling'
  }
]

// Days for recurring selection
export const WEEKDAYS = [
  { id: 'monday', label: 'Ma', fullLabel: 'Maandag' },
  { id: 'tuesday', label: 'Di', fullLabel: 'Dinsdag' },
  { id: 'wednesday', label: 'Wo', fullLabel: 'Woensdag' },
  { id: 'thursday', label: 'Do', fullLabel: 'Donderdag' },
  { id: 'friday', label: 'Vr', fullLabel: 'Vrijdag' },
  { id: 'saturday', label: 'Za', fullLabel: 'Zaterdag' },
  { id: 'sunday', label: 'Zo', fullLabel: 'Zondag' }
]

// ============================================
// EXISTING CONSTANTS (unchanged)
// ============================================

// Library categories (for existing content)
export const LIBRARY_CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'voeding', label: 'Voeding' },
  { id: 'training', label: 'Training' },
  { id: 'mindset', label: 'Mindset' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'motivatie', label: 'Motivatie' },
  { id: 'overig', label: 'Overig' }
]

// Status config
export const STATUSES = {
  idea: { label: 'Idee', color: 'rgba(255, 255, 255, 0.5)' },
  planned: { label: 'Gepland', color: '#3b82f6' },
  created: { label: 'Gemaakt', color: '#f97316' },
  posted: { label: 'Gepost', color: '#10b981' }
}

// Days
export const DAYS = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za']
export const DAYS_FULL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']

// Helper: Get Monday of week
export const getMonday = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Helper: Format date
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

// Helper: Format date to YYYY-MM-DD
export const formatDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
