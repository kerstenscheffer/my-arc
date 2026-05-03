// src/coach/tabs/client-info/components/templates/TemplateRegistry.js
import { Phone, Users, Target, Calendar, Dumbbell, Utensils, TrendingUp, AlertCircle } from 'lucide-react'

// Import template definitions
import OnboardingCallTemplate from './OnboardingCallTemplate'
import ProgressCheckTemplate from './ProgressCheckTemplate'
import MotivationCallTemplate from './MotivationCallTemplate'
import DroogProjectCall1Template from './DroogProjectCall1Template'

/**
 * TEMPLATE REGISTRY
 * 
 * All available note templates
 * Each template must have:
 * - id: unique identifier
 * - name: display name
 * - description: what the template is for
 * - category: for filtering (Calls, Sessions, Planning, etc.)
 * - icon: Lucide icon component
 * - color: accent color for the template
 * - sections: array of pre-filled sections
 * 
 * TO ADD NEW TEMPLATE:
 * 1. Create new file: TemplateNameTemplate.js
 * 2. Export template object
 * 3. Import and add to TEMPLATE_REGISTRY array below
 */

export const TEMPLATE_REGISTRY = [
  {
    id: 'onboarding-call-3m',
    name: 'Onboarding Call (3 Maanden)',
    description: 'Actie-gerichte onboarding: macro berekening, maaltijdplan bouwen, afspraken maken',
    category: 'Calls',
    icon: Phone,
    color: '#10b981',
    ...OnboardingCallTemplate
  },
  {
    id: 'progress-check',
    name: 'Progress Check Call',
    description: 'Weekly/biweekly progress review and adjustments',
    category: 'Calls',
    icon: TrendingUp,
    color: '#3b82f6',
    ...ProgressCheckTemplate
  },
  {
    id: 'motivation-call',
    name: 'Motivation & Support Call',
    description: 'When client is struggling or needs extra support',
    category: 'Calls',
    icon: AlertCircle,
    color: '#f59e0b',
    ...MotivationCallTemplate
  },
  {
    id: 'droog-call1-kickoff',
    name: '5-8KG Droog - Call 1: Kickoff',
    description: 'Week -2: Baseline metingen, foto\'s, criteria check, app tour',
    category: 'Onboarding',
    icon: Phone,
    color: '#f97316',
    ...DroogProjectCall1Template
  }
  // Add more templates here as you create them
]

/**
 * Helper function to get template by ID
 */
export function getTemplateById(templateId) {
  return TEMPLATE_REGISTRY.find(t => t.id === templateId)
}

/**
 * Helper function to get templates by category
 */
export function getTemplatesByCategory(category) {
  return TEMPLATE_REGISTRY.filter(t => t.category === category)
}
