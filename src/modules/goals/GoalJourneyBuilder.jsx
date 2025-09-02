import React, { useState, useEffect } from 'react'
import { 
  Target, Flag, Zap, Plus, Check, Circle, ChevronRight, Trophy, Calendar,
  TrendingUp, Footprints, Heart, Timer, CheckCircle, Star, Award, Sparkles,
  X, Edit2, Lock, Unlock, BarChart3, Flame, MapPin, ArrowRight, Info,
  ChevronDown, ChevronUp, RefreshCw, Play, Pause, RotateCcw, Settings,
  AlertCircle, Coffee, Moon, Sun, Cloud, Wind, Droplets, Activity
} from 'lucide-react'

// Smart milestone templates based on goal type
const getMilestoneTemplates = (goalCategory, goalTitle, currentValue, targetValue) => {
  const templates = {
    herstel: {
      'slaap': [
        { title: 'Eerste week consistent', percentage: 10, days: 7 },
        { title: 'Slaapritme vast', percentage: 25, days: 14 },
        { title: 'REM slaap verbeterd', percentage: 50, days: 30 },
        { title: 'Deep sleep optimaal', percentage: 75, days: 45 },
        { title: 'Volledig hersteld', percentage: 100, days: 60 }
      ],
      'stretching': [
        { title: 'Dagelijkse routine', percentage: 20, days: 7 },
        { title: 'Flexibiliteit +10%', percentage: 40, days: 21 },
        { title: 'Pijnpunten weg', percentage: 60, days: 35 },
        { title: 'Full range motion', percentage: 80, days: 49 },
        { title: 'Mobility master', percentage: 100, days: 60 }
      ]
    },
    mindset: {
      'meditatie': [
        { title: '5 min focus', percentage: 20, days: 3 },
        { title: '10 min rustig', percentage: 40, days: 7 },
        { title: '15 min diep', percentage: 60, days: 14 },
        { title: '20 min flow', percentage: 80, days: 21 },
        { title: 'Zen master', percentage: 100, days: 30 }
      ],
      'discipline': [
        { title: 'Eerste streak', percentage: 15, days: 3 },
        { title: 'Week volgehouden', percentage: 30, days: 7 },
        { title: 'Habit formed', percentage: 50, days: 21 },
        { title: 'Lifestyle change', percentage: 75, days: 42 },
        { title: 'Unbreakable', percentage: 100, days: 66 }
      ]
    },
    workout: {
      'kracht': [
        { title: '+5kg toegevoegd', percentage: 10, days: 14 },
        { title: '+10kg milestone', percentage: 25, days: 30 },
        { title: 'Halve weg', percentage: 50, days: 45 },
        { title: 'Breaking barriers', percentage: 75, days: 60 },
        { title: 'Goal crushed!', percentage: 100, days: 90 }
      ],
      'cardio': [
        { title: '5 min extra', percentage: 20, days: 7 },
        { title: 'Pace verbeterd', percentage: 40, days: 14 },
        { title: 'Conditie boost', percentage: 60, days: 28 },
        { title: 'Runner high', percentage: 80, days: 42 },
        { title: 'Endurance beast', percentage: 100, days: 60 }
      ]
    },
    voeding: {
      'hydratatie': [
        { title: '1L per dag', percentage: 25, days: 3 },
        { title: '1.5L consistent', percentage: 50, days: 7 },
        { title: '2L daily', percentage: 75, days: 14 },
        { title: 'Hydration hero', percentage: 100, days: 21 }
      ],
      'macros': [
        { title: 'Tracking started', percentage: 20, days: 3 },
        { title: 'Protein on point', percentage: 40, days: 7 },
        { title: 'Balanced macros', percentage: 60, days: 14 },
        { title: 'Nutrition dialed', percentage: 80, days: 21 },
        { title: 'Macro master', percentage: 100, days: 30 }
      ]
    },
    structuur: {
      'routine': [
        { title: 'Morning ritual', percentage: 25, days: 7 },
        { title: 'Consistency king', percentage: 50, days: 21 },
        { title: 'Habit stacking', percentage: 75, days: 35 },
        { title: 'Routine locked', percentage: 100, days: 49 }
      ]
    }
  }

  // Find matching template or generate generic
  const categoryTemplates = templates[goalCategory] || {}
  const subcategoryKey = Object.keys(categoryTemplates).find(key => 
    goalTitle.toLowerCase().includes(key)
  )
  
  if (categoryTemplates[subcategoryKey]) {
    return categoryTemplates[subcategoryKey].map(template => ({
      ...template,
      target_value: currentValue + ((targetValue - currentValue) * template.percentage / 100),
      icon: getIconForPercentage(template.percentage)
    }))
  }

  // Generate generic milestones
  return generateGenericMilestones(currentValue, targetValue)
}

// Generate generic progressive milestones
const generateGenericMilestones = (current, target) => {
  const diff = target - current
  const milestones = []
  const steps = [10, 25, 50, 75, 100]
  
  steps.forEach((percentage, index) => {
    milestones.push({
      title: getGenericMilestoneTitle(percentage),
      percentage: percentage,
      target_value: current + (diff * percentage / 100),
      days: Math.round((index + 1) * 14),
      icon: getIconForPercentage(percentage)
    })
  })
  
  return milestones
}

const getGenericMilestoneTitle = (percentage) => {
  const titles = {
    10: 'Eerste stappen',
    25: 'Op de goede weg',
    50: 'Halverwege!',
    75: 'Bijna daar',
    100: 'Doel bereikt! 🎉'
  }
  return titles[percentage] || `${percentage}% bereikt`
}

const getIconForPercentage = (percentage) => {
  if (percentage <= 25) return 'footprints'
  if (percentage <= 50) return 'flag'
  if (percentage <= 75) return 'trophy'
  return 'crown'
}

// Smart action suggestions
const getActionSuggestions = (goalCategory, goalTitle) => {
  const suggestions = {
    herstel: [
      { title: 'Slaap tracker', frequency: 'daily', target: 7, icon: 'moon' },
      { title: 'Screen-free hour', frequency: 'daily', target: 7, icon: 'smartphone' },
      { title: 'Stretchen', frequency: 'daily', target: 5, icon: 'activity' },
      { title: 'Foam rolling', frequency: 'weekly', target: 3, icon: 'circle' },
      { title: 'Meditatie', frequency: 'daily', target: 7, icon: 'brain' }
    ],
    mindset: [
      { title: 'Journaling', frequency: 'daily', target: 7, icon: 'book' },
      { title: 'Gratitude list', frequency: 'daily', target: 7, icon: 'heart' },
      { title: 'Visualisatie', frequency: 'daily', target: 5, icon: 'eye' },
      { title: 'Cold shower', frequency: 'weekly', target: 5, icon: 'droplets' },
      { title: 'No complaints', frequency: 'daily', target: 7, icon: 'smile' }
    ],
    workout: [
      { title: 'Training session', frequency: 'weekly', target: 4, icon: 'dumbbell' },
      { title: 'Cardio', frequency: 'weekly', target: 3, icon: 'run' },
      { title: 'Mobility work', frequency: 'daily', target: 5, icon: 'activity' },
      { title: 'Rest day', frequency: 'weekly', target: 2, icon: 'pause' },
      { title: 'Progress foto', frequency: 'weekly', target: 1, icon: 'camera' }
    ],
    voeding: [
      { title: 'Water intake', frequency: 'daily', target: 7, icon: 'droplets' },
      { title: 'Track calories', frequency: 'daily', target: 7, icon: 'calculator' },
      { title: 'Meal prep', frequency: 'weekly', target: 2, icon: 'chefHat' },
      { title: 'No junk food', frequency: 'daily', target: 6, icon: 'pizza' },
      { title: 'Protein target', frequency: 'daily', target: 7, icon: 'beef' }
    ],
    structuur: [
      { title: 'Morning routine', frequency: 'daily', target: 7, icon: 'sunrise' },
      { title: 'Planning session', frequency: 'weekly', target: 1, icon: 'calendar' },
      { title: 'No snooze', frequency: 'daily', target: 5, icon: 'alarm' },
      { title: 'Evening shutdown', frequency: 'daily', target: 5, icon: 'power' },
      { title: 'Digital detox', frequency: 'daily', target: 2, icon: 'phoneOff' }
    ]
  }
  
  return suggestions[goalCategory] || suggestions.structuur
}

// Main Journey Builder Component
export default function GoalJourneyBuilder({ goal, db, onUpdate }) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [milestones, setMilestones] = useState([])
  const [actions, setActions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [showAddMilestone, setShowAddMilestone] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [journeyStats, setJourneyStats] = useState({
    completedMilestones: 0,
    totalStreakDays: 0,
    estimatedCompletion: null,
    successProbability: 0
  })
  
  // Forms
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    target_value: '',
    unit: goal.unit || '',
    target_date: '',
    icon: 'flag'
  })
  
  const [actionForm, setActionForm] = useState({
    title: '',
    frequency: 'weekly',
    frequency_target: 3,
    icon: 'zap'
  })
  
  // Action tracking
  const [actionTracking, setActionTracking] = useState({})
  const [expandedAction, setExpandedAction] = useState(null)
  
  // Load existing journey data
  useEffect(() => {
    loadJourneyData()
  }, [goal.id])
  
  const loadJourneyData = async () => {
    if (!goal.id || !db) return
    
    try {
      // Load milestones
      const { data: milestonesData } = await db.supabase
        .from('goal_milestones')
        .select('*')
        .eq('goal_id', goal.id)
        .order('order_index')
      
      // Load actions
      const { data: actionsData } = await db.supabase
        .from('goal_actions')
        .select('*')
        .eq('goal_id', goal.id)
      
      setMilestones(milestonesData || [])
      setActions(actionsData || [])
      
      // Calculate stats
      calculateJourneyStats(milestonesData || [], actionsData || [])
    } catch (error) {
      console.error('Error loading journey data:', error)
    }
  }
  
  const calculateJourneyStats = (milestones, actions) => {
    const completedMilestones = milestones.filter(m => m.completed).length
    const totalStreak = actions.reduce((sum, a) => sum + (a.current_streak || 0), 0)
    
    // Estimate completion based on current pace
    const progress = goal.target_value > 0 
      ? (goal.current_value / goal.target_value) * 100 
      : 0
    
    const daysElapsed = Math.floor((Date.now() - new Date(goal.created_at || Date.now())) / (1000 * 60 * 60 * 24))
    const daysRemaining = Math.floor((new Date(goal.target_date) - Date.now()) / (1000 * 60 * 60 * 24))
    
    const dailyProgress = daysElapsed > 0 ? progress / daysElapsed : 0
    const estimatedDaysToComplete = dailyProgress > 0 ? Math.ceil((100 - progress) / dailyProgress) : daysRemaining
    
    const estimatedCompletion = new Date()
    estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedDaysToComplete)
    
    // Calculate success probability based on consistency
    const consistencyScore = actions.length > 0
      ? actions.reduce((sum, a) => sum + (a.current_streak / a.frequency_target), 0) / actions.length
      : 0.5
    
    const successProbability = Math.min(95, Math.round(consistencyScore * 100 * (progress / 50)))
    
    setJourneyStats({
      completedMilestones,
      totalStreakDays: totalStreak,
      estimatedCompletion: estimatedCompletion.toISOString().split('T')[0],
      successProbability
    })
  }
  
  // Generate smart milestones
  const generateSmartMilestones = () => {
    const suggestions = getMilestoneTemplates(
      goal.category,
      goal.title,
      goal.current_value || 0,
      goal.target_value
    )
    
    setMilestones(suggestions.map((s, index) => ({
      ...s,
      id: `temp_${index}`,
      order_index: index,
      unit: goal.unit,
      completed: false
    })))
  }
  
  // Generate smart actions
  const generateSmartActions = () => {
    const suggestions = getActionSuggestions(goal.category, goal.title)
    setActions(suggestions.map((s, index) => ({
      ...s,
      id: `temp_${index}`,
      current_streak: 0,
      best_streak: 0
    })))
  }
  
  // Save milestone
  const saveMilestone = async (milestone) => {
    try {
      const { data, error } = await db.supabase
        .from('goal_milestones')
        .insert({
          goal_id: goal.id,
          title: milestone.title,
          target_value: milestone.target_value,
          unit: milestone.unit,
          target_date: milestone.target_date,
          order_index: milestones.length,
          icon: milestone.icon
        })
        .select()
        .single()
      
      if (error) throw error
      
      setMilestones([...milestones, data])
      setShowAddMilestone(false)
      setMilestoneForm({ title: '', target_value: '', unit: goal.unit || '', target_date: '', icon: 'flag' })
    } catch (error) {
      console.error('Error saving milestone:', error)
    }
  }
  
  // Save action
  const saveAction = async (action) => {
    try {
      const { data, error } = await db.supabase
        .from('goal_actions')
        .insert({
          goal_id: goal.id,
          title: action.title,
          frequency: action.frequency,
          frequency_target: action.frequency_target,
          icon: action.icon
        })
        .select()
        .single()
      
      if (error) throw error
      
      setActions([...actions, data])
      setShowAddAction(false)
      setActionForm({ title: '', frequency: 'weekly', frequency_target: 3, icon: 'zap' })
    } catch (error) {
      console.error('Error saving action:', error)
    }
  }
  
  // Complete milestone
  const completeMilestone = async (milestone) => {
    try {
      await db.supabase
        .from('goal_milestones')
        .update({
          completed: true,
          completed_date: new Date().toISOString()
        })
        .eq('id', milestone.id)
      
      // Update local state
      setMilestones(milestones.map(m => 
        m.id === milestone.id ? { ...m, completed: true } : m
      ))
      
      // Celebration
      alert(`🎉 Milestone bereikt: ${milestone.title}!`)
      onUpdate()
    } catch (error) {
      console.error('Error completing milestone:', error)
    }
  }
  
  // Track action completion
  const trackActionCompletion = async (action, date) => {
    try {
      // Log the completion
      await db.supabase
        .from('goal_action_logs')
        .upsert({
          action_id: action.id,
          date: date,
          completed: true
        }, {
          onConflict: 'action_id,date'
        })
      
      // Update streak
      const newStreak = (action.current_streak || 0) + 1
      const bestStreak = Math.max(newStreak, action.best_streak || 0)
      
      await db.supabase
        .from('goal_actions')
        .update({
          current_streak: newStreak,
          best_streak: bestStreak,
          last_completed: date
        })
        .eq('id', action.id)
      
      // Update local state
      setActions(actions.map(a => 
        a.id === action.id 
          ? { ...a, current_streak: newStreak, best_streak: bestStreak }
          : a
      ))
      
      onUpdate()
    } catch (error) {
      console.error('Error tracking action:', error)
    }
  }
  
  // Save entire journey
  const saveJourney = async () => {
    try {
      // Save all temporary milestones
      for (const milestone of milestones.filter(m => m.id.startsWith('temp_'))) {
        await saveMilestone(milestone)
      }
      
      // Save all temporary actions
      for (const action of actions.filter(a => a.id.startsWith('temp_'))) {
        await saveAction(action)
      }
      
      alert('🚀 Journey opgeslagen!')
      setShowBuilder(false)
      onUpdate()
    } catch (error) {
      console.error('Error saving journey:', error)
    }
  }
  
  // Visual journey path
  const renderJourneyPath = () => {
    const totalMilestones = milestones.length
    const completedCount = milestones.filter(m => m.completed).length
    const progressPercentage = totalMilestones > 0 ? (completedCount / totalMilestones) * 100 : 0
    
    return (
      <div style={{
        position: 'relative',
        padding: '2rem 0',
        marginBottom: '1rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '12px'
      }}>
        {/* Progress Path */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '2rem',
          right: '2rem',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercentage}%`,
            background: `linear-gradient(90deg, ${goal.color || '#8b5cf6'} 0%, ${goal.color || '#8b5cf6'}dd 100%)`,
            borderRadius: '2px',
            transition: 'width 0.5s ease',
            boxShadow: `0 0 10px ${goal.color || '#8b5cf6'}66`
          }} />
        </div>
        
        {/* Milestone Points */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          position: 'relative',
          padding: '0 2rem'
        }}>
          {/* Start Point */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid #fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              <Footprints size={20} color="#fff" />
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '0.5rem'
            }}>
              Start
            </span>
          </div>
          
          {/* Milestones */}
          {milestones.slice(0, 4).map((milestone, index) => {
            const IconComponent = iconMap[milestone.icon] || Flag
            
            return (
              <div key={milestone.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <div
                  onClick={() => !milestone.completed && completeMilestone(milestone)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: milestone.completed 
                      ? '#10b981' 
                      : 'rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `3px solid ${milestone.completed ? '#fff' : 'rgba(255,255,255,0.3)'}`,
                    cursor: milestone.completed ? 'default' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: milestone.completed 
                      ? '0 2px 8px rgba(16, 185, 129, 0.5)'
                      : 'none'
                  }}
                >
                  {milestone.completed ? (
                    <Check size={20} color="#fff" />
                  ) : (
                    <IconComponent size={18} color="#8b5cf6" />
                  )}
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  color: milestone.completed ? '#10b981' : 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                  maxWidth: '80px',
                  marginTop: '0.5rem'
                }}>
                  {milestone.title}
                </span>
                {milestone.target_value && (
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'rgba(255,255,255,0.4)'
                  }}>
                    {milestone.target_value} {milestone.unit}
                  </span>
                )}
              </div>
            )
          })}
          
          {/* Goal End */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: completedCount === totalMilestones && totalMilestones > 0
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'rgba(251, 191, 36, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: completedCount === totalMilestones && totalMilestones > 0
                ? '0 2px 12px rgba(251, 191, 36, 0.7)'
                : 'none'
            }}>
              <Trophy size={20} color={completedCount === totalMilestones && totalMilestones > 0 ? '#fff' : '#f59e0b'} />
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: completedCount === totalMilestones && totalMilestones > 0
                ? '#f59e0b'
                : 'rgba(255,255,255,0.6)',
              marginTop: '0.5rem'
            }}>
              Doel!
            </span>
          </div>
        </div>
      </div>
    )
  }
  
  // Icon mapping
  const iconMap = {
    flag: Flag, trophy: Trophy, crown: Award, footprints: Footprints,
    zap: Zap, heart: Heart, brain: Brain, dumbbell: Dumbbell,
    moon: Moon, sunrise: Sunrise, book: Book, droplets: Droplets,
    activity: Activity, camera: Camera, timer: Timer, star: Star
  }
  
  return (
    <div style={{
      marginTop: '1rem',
      padding: '1rem',
      background: `linear-gradient(135deg, ${goal.color || '#8b5cf6'}10 0%, rgba(0,0,0,0.4) 100%)`,
      borderRadius: '12px',
      border: `1px solid ${goal.color || '#8b5cf6'}33`
    }}>
      {/* Journey Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          fontSize: '1.1rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: goal.color || '#8b5cf6'
        }}>
          <MapPin size={20} />
          Journey Map
        </h4>
        <button
          onClick={() => setShowBuilder(!showBuilder)}
          style={{
            padding: '0.5rem 1rem',
            background: `${goal.color || '#8b5cf6'}20`,
            border: `1px solid ${goal.color || '#8b5cf6'}`,
            borderRadius: '8px',
            color: goal.color || '#8b5cf6',
            fontSize: '0.875rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {showBuilder ? <X size={16} /> : <Plus size={16} />}
          {showBuilder ? 'Sluiten' : 'Plan Journey'}
        </button>
      </div>
      
      {/* Journey Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
            {journeyStats.completedMilestones}/{milestones.length}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
            Milestones
          </div>
        </div>
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {journeyStats.totalStreakDays}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
            Streak Days
          </div>
        </div>
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '0.75rem',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {journeyStats.successProbability}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>
            Kans op succes
          </div>
        </div>
      </div>
      
      {/* Visual Journey Path */}
      {milestones.length > 0 && renderJourneyPath()}
      
      {/* Journey Builder */}
      {showBuilder && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: '8px'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {['overview', 'milestones', 'actions', 'analytics'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: activeTab === tab 
                    ? goal.color || '#8b5cf6'
                    : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: activeTab === tab ? '#000' : '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'overview' && '📊'}
                {tab === 'milestones' && '🏁'}
                {tab === 'actions' && '⚡'}
                {tab === 'analytics' && '📈'}
                {' ' + tab}
              </button>
            ))}
          </div>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h5 style={{ marginBottom: '1rem', color: goal.color || '#8b5cf6' }}>
                📊 Journey Overview
              </h5>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Geschatte voltooiing:</strong>{' '}
                  <span style={{ color: '#10b981' }}>
                    {journeyStats.estimatedCompletion 
                      ? new Date(journeyStats.estimatedCompletion).toLocaleDateString('nl-NL')
                      : 'Nog te bepalen'}
                  </span>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <strong>Huidige snelheid:</strong>{' '}
                  <span style={{ color: '#f59e0b' }}>
                    {((goal.current_value / goal.target_value) * 100).toFixed(1)}% compleet
                  </span>
                </div>
                <div>
                  <strong>Aanbeveling:</strong>{' '}
                  <span style={{ color: '#3b82f6' }}>
                    {journeyStats.successProbability > 70 
                      ? 'Je bent goed op weg! Blijf consistent.'
                      : journeyStats.successProbability > 40
                      ? 'Probeer je frequentie te verhogen voor betere resultaten.'
                      : 'Overweeg je milestones aan te passen voor een realistischer pad.'}
                  </span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem'
              }}>
                <button
                  onClick={generateSmartMilestones}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8b5cf6',
                    borderRadius: '8px',
                    color: '#8b5cf6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Sparkles size={16} />
                  Smart Milestones
                </button>
                <button
                  onClick={generateSmartActions}
                  style={{
                    padding: '0.75rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    color: '#f59e0b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Zap size={16} />
                  Smart Actions
                </button>
              </div>
            </div>
          )}
          
          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h5 style={{ color: goal.color || '#8b5cf6' }}>
                  🏁 Milestones ({milestones.length})
                </h5>
                <button
                  onClick={() => setShowAddMilestone(true)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8b5cf6',
                    borderRadius: '6px',
                    color: '#8b5cf6',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              
              {/* Milestone List */}
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {milestones.map((milestone, index) => {
                  const IconComponent = iconMap[milestone.icon] || Flag
                  
                  return (
                    <div key={milestone.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: milestone.completed 
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: `1px solid ${milestone.completed 
                        ? '#10b981'
                        : 'rgba(255,255,255,0.1)'}`
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: milestone.completed
                          ? '#10b981'
                          : 'rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {milestone.completed ? (
                          <Check size={16} color="#fff" />
                        ) : (
                          <IconComponent size={16} color="#8b5cf6" />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '0.875rem',
                          marginBottom: '0.25rem'
                        }}>
                          {milestone.title}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.6)'
                        }}>
                          {milestone.target_value} {milestone.unit} • 
                          {milestone.target_date 
                            ? ` ${new Date(milestone.target_date).toLocaleDateString('nl-NL')}`
                            : ' Geen deadline'}
                        </div>
                      </div>
                      {!milestone.completed && (
                        <button
                          onClick={() => completeMilestone(milestone)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid #10b981',
                            borderRadius: '4px',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Add Milestone Form */}
              {showAddMilestone && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '8px'
                }}>
                  <input
                    type="text"
                    placeholder="Milestone naam"
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({...milestoneForm, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      placeholder="Target"
                      value={milestoneForm.target_value}
                      onChange={(e) => setMilestoneForm({...milestoneForm, target_value: e.target.value})}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={milestoneForm.unit}
                      onChange={(e) => setMilestoneForm({...milestoneForm, unit: e.target.value})}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    />
                  </div>
                  <input
                    type="date"
                    value={milestoneForm.target_date}
                    onChange={(e) => setMilestoneForm({...milestoneForm, target_date: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        if (milestoneForm.id) {
                          // Update existing
                          setMilestones(milestones.map(m => 
                            m.id === milestoneForm.id ? milestoneForm : m
                          ))
                        } else {
                          // Add new
                          setMilestones([...milestones, {
                            ...milestoneForm,
                            id: `temp_${Date.now()}`,
                            order_index: milestones.length,
                            completed: false
                          }])
                        }
                        setShowAddMilestone(false)
                        setMilestoneForm({ title: '', target_value: '', unit: goal.unit || '', target_date: '', icon: 'flag' })
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#8b5cf6',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Toevoegen
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMilestone(false)
                        setMilestoneForm({ title: '', target_value: '', unit: goal.unit || '', target_date: '', icon: 'flag' })
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h5 style={{ color: '#f59e0b' }}>
                  ⚡ Daily Actions ({actions.length})
                </h5>
                <button
                  onClick={() => setShowAddAction(true)}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    color: '#f59e0b',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              
              {/* Actions List with Habit Tracker */}
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {actions.map(action => {
                  const isExpanded = expandedAction === action.id
                  const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
                  const checkedDays = actionTracking[action.id]?.days || []
                  
                  return (
                    <div key={action.id} style={{
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <div
                        onClick={() => setExpandedAction(isExpanded ? null : action.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        <Zap size={16} color="#f59e0b" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                            {action.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                            {action.frequency_target}x per {action.frequency === 'daily' ? 'dag' : 'week'}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: 'rgba(245, 158, 11, 0.2)',
                          borderRadius: '12px',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: '#f59e0b'
                        }}>
                          {action.current_streak || 0} 🔥
                        </div>
                        <ChevronDown size={16} style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                          transition: 'transform 0.2s',
                          color: 'rgba(255,255,255,0.6)'
                        }} />
                      </div>
                      
                      {/* Expanded Habit Tracker */}
                      {isExpanded && (
                        <div style={{
                          marginTop: '0.75rem',
                          paddingTop: '0.75rem',
                          borderTop: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.6)',
                            marginBottom: '0.5rem'
                          }}>
                            Deze week tracken:
                          </div>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: '0.25rem'
                          }}>
                            {days.map((day, index) => (
                              <button
                                key={day}
                                onClick={() => {
                                  const newDays = checkedDays.includes(index)
                                    ? checkedDays.filter(d => d !== index)
                                    : [...checkedDays, index]
                                  
                                  setActionTracking({
                                    ...actionTracking,
                                    [action.id]: { days: newDays }
                                  })
                                  
                                  // Track if completed today
                                  const today = new Date().getDay() - 1
                                  if (index === today) {
                                    trackActionCompletion(action, new Date().toISOString().split('T')[0])
                                  }
                                }}
                                style={{
                                  padding: '0.5rem 0.25rem',
                                  background: checkedDays.includes(index)
                                    ? '#f59e0b'
                                    : 'rgba(255,255,255,0.1)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  color: checkedDays.includes(index) ? '#000' : '#fff',
                                  fontSize: '0.75rem',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                          <div style={{
                            marginTop: '0.5rem',
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.6)'
                          }}>
                            Best streak: {action.best_streak || 0} dagen
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              {/* Add Action Form */}
              {showAddAction && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderRadius: '8px'
                }}>
                  <input
                    type="text"
                    placeholder="Actie naam (bijv. 30 min hardlopen)"
                    value={actionForm.title}
                    onChange={(e) => setActionForm({...actionForm, title: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      placeholder="Aantal"
                      value={actionForm.frequency_target}
                      onChange={(e) => setActionForm({...actionForm, frequency_target: e.target.value})}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    />
                    <select
                      value={actionForm.frequency}
                      onChange={(e) => setActionForm({...actionForm, frequency: e.target.value})}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    >
                      <option value="daily">keer per dag</option>
                      <option value="weekly">keer per week</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setActions([...actions, {
                          ...actionForm,
                          id: `temp_${Date.now()}`,
                          current_streak: 0,
                          best_streak: 0
                        }])
                        setShowAddAction(false)
                        setActionForm({ title: '', frequency: 'weekly', frequency_target: 3, icon: 'zap' })
                      }}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: '#f59e0b',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Toevoegen
                    </button>
                    <button
                      onClick={() => {
                        setShowAddAction(false)
                        setActionForm({ title: '', frequency: 'weekly', frequency_target: 3, icon: 'zap' })
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div>
              <h5 style={{ marginBottom: '1rem', color: '#3b82f6' }}>
                📈 Progress Analytics
              </h5>
              
              <div style={{
                padding: '1rem',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
                    Progress Trend
                  </div>
                  <div style={{
                    height: '100px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#3b82f6'
                  }}>
                    <TrendingUp size={32} />
                    <span style={{ marginLeft: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                      +{((goal.current_value / goal.target_value) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      Gem. per week
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                      {((goal.current_value - (goal.start_value || 0)) / 4).toFixed(1)} {goal.unit}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                      Consistency
                    </div>
                    <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                      {Math.round((actions.filter(a => a.current_streak > 0).length / actions.length) * 100)}%
                    </div>
                  </div>
                </div>
                
                {/* Prediction */}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    <strong>Voorspelling:</strong>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                    Met je huidige tempo bereik je je doel op{' '}
                    <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                      {journeyStats.estimatedCompletion 
                        ? new Date(journeyStats.estimatedCompletion).toLocaleDateString('nl-NL')
                        : 'onbekend'}
                    </span>
                  </div>
                  {journeyStats.successProbability < 50 && (
                    <div style={{
                      marginTop: '0.5rem',
                      fontSize: '0.75rem',
                      color: '#f59e0b'
                    }}>
                      💡 Tip: Verhoog je frequentie of pas je milestones aan voor betere kansen
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Save Journey Button */}
          {(milestones.some(m => m.id.startsWith('temp_')) || actions.some(a => a.id.startsWith('temp_'))) && (
            <button
              onClick={saveJourney}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '0.75rem',
                background: `linear-gradient(135deg, ${goal.color || '#8b5cf6'} 0%, #f59e0b 100%)`,
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <MapPin size={18} />
              Journey Opslaan
            </button>
          )}
        </div>
      )}
    </div>
  )
}
