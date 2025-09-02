import { Coffee, Target, Activity, TrendingUp, Rocket, Trophy } from 'lucide-react';

export const callTypeConfig = {
  1: {
    name: 'Kennismaking',
    gradient: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)',
    icon: Coffee,
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Doelen & verwachtingen bespreken'
  },
  2: {
    name: 'Plan Pitch',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.05) 100%)',
    icon: Target,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Jouw persoonlijke strategie'
  },
  3: {
    name: 'Check-in',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.05) 100%)',
    icon: Activity,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Voortgang & bijsturen'
  },
  4: {
    name: 'Halfway Point',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.05) 100%)',
    icon: TrendingUp,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    description: 'Evaluatie & nieuwe doelen'
  },
  5: {
    name: 'Final Sprint',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.05) 100%)',
    icon: Rocket,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Laatste push naar je doel'
  },
  6: {
    name: 'Celebration',
    gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    darkGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)',
    icon: Trophy,
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.1)',
    description: 'Resultaten & next level'
  }
};
