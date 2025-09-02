// src/modules/goals/config.js
import { 
  Moon, Brain, Dumbbell, Apple, Calendar,
  CheckCircle, BarChart3, Clock, Plus,
  CalendarDays, CalendarRange, CalendarClock, Edit2
} from 'lucide-react'

// Goal Categories Configuration
export const goalCategories = {
  herstel: {
    name: 'Herstel',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #dbeafe 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(219, 234, 254, 0.05) 100%)',
    icon: Moon,
    color: '#60a5fa',
    bgColor: 'rgba(96, 165, 250, 0.1)',
    subcategories: ['Slaap', 'Recovery', 'Stretching', 'Meditatie', 'Breathwork']
  },
  mindset: {
    name: 'Mindset', 
    gradient: 'linear-gradient(135deg, #ef4444 0%, #fee2e2 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(254, 226, 226, 0.05) 100%)',
    icon: Brain,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    subcategories: ['Focus', 'Discipline', 'Motivatie', 'Visualisatie', 'Journaling']
  },
  workout: {
    name: 'Workout',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(254, 243, 199, 0.05) 100%)',
    icon: Dumbbell,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    subcategories: ['Kracht', 'Cardio', 'Mobility', 'Sport', 'Skills']
  },
  voeding: {
    name: 'Voeding',
    gradient: 'linear-gradient(135deg, #10b981 0%, #d1fae5 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(209, 250, 229, 0.05) 100%)',
    icon: Apple,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    subcategories: ['Calorieën', 'Macros', 'Hydratatie', 'Supplementen', 'Meal Prep']
  },
  structuur: {
    name: 'Structuur',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ede9fe 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(237, 233, 254, 0.05) 100%)',
    icon: Calendar,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    subcategories: ['Routine', 'Habits', 'Planning', 'Consistency', 'Time Management']
  }
}

// Measurement Types
export const measurementTypes = [
  { id: 'checkbox', name: 'Dagen', icon: CheckCircle, description: 'per week' },
  { id: 'number', name: 'Getal', icon: BarChart3, description: 'kg, km, etc.' },
  { id: 'timer', name: 'Tijd', icon: Clock, description: 'minuten/uren' },
  { id: 'counter', name: 'Teller', icon: Plus, description: 'reps, glazen' }
]

// Duration Presets
export const durationPresets = [
  { id: '1_week', label: '1 Week', days: 7, icon: CalendarDays },
  { id: '2_weeks', label: '2 Weken', days: 14, icon: CalendarRange },
  { id: '4_weeks', label: '4 Weken', days: 28, icon: Calendar },
  { id: '2_months', label: '2 Maanden', days: 60, icon: CalendarClock },
  { id: 'custom', label: 'Handmatig', days: null, icon: Edit2 }
]

// Mobile Detection
export const isMobile = () => window.innerWidth <= 768
