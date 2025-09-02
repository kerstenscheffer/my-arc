// src/modules/goals/utils.js - FIXED VERSION (geen JSX)

// Get day information
export const getDayInfo = () => {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const monthNames = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                      'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  
  return {
    today: today,
    tomorrow: tomorrow,
    todayName: dayNames[today.getDay()],
    tomorrowName: dayNames[tomorrow.getDay()],
    todayDate: `${today.getDate()} ${monthNames[today.getMonth()]}`,
    tomorrowDate: `${tomorrow.getDate()} ${monthNames[tomorrow.getMonth()]}`,
    currentWeek: `Week ${Math.ceil(today.getDate() / 7)}`
  }
}

// Get week dates
export const getWeekDates = (startDate = new Date()) => {
  const dates = []
  const monday = new Date(startDate)
  const day = monday.getDay()
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
  monday.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

// Calculate progress percentage
export const calculateProgress = (goal) => {
  if (!goal.current_value || !goal.target_value) return 0
  const progress = (goal.current_value / goal.target_value) * 100
  return Math.min(100, Math.round(progress))
}

// Get days remaining
export const getDaysRemaining = (targetDate) => {
  const target = new Date(targetDate)
  const today = new Date()
  const diff = target - today
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// Calculate deadline from preset
export const calculateDeadline = (preset, durationPresets) => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const presetData = durationPresets.find(p => p.id === preset)
  
  if (presetData && presetData.days) {
    const deadline = new Date(tomorrow)
    deadline.setDate(tomorrow.getDate() + presetData.days)
    return deadline.toISOString().split('T')[0]
  }
  
  return ''
}

// Calculate progress ring values (no JSX, just data)
export const getProgressRingValues = (progress, size = 60) => {
  const circumference = 2 * Math.PI * 25
  const strokeDashoffset = circumference - (progress / 100) * circumference
  
  return {
    size,
    circumference,
    strokeDashoffset,
    radius: 25,
    strokeWidth: 4
  }
}
