// src/modules/dm-conversation/utils/painDetection.js
// PAIN DETECTION ENGINE - Auto-detect triggers

/**
 * Pain detection system
 * Analyzes lead responses for pain signals
 */

export const PAIN_KEYWORDS = {
  // Frustration signals
  frustration: [
    'lukt niet',
    'geen resultaat',
    'niks gebeurt',
    'geen vooruitgang',
    'blijf hetzelfde',
    'werkt niet',
    'frustrerend',
    'irritant',
    'genoeg van'
  ],
  
  // Time/effort signals
  timeEffort: [
    '6 maanden',
    'maanden bezig',
    'jaar bezig',
    'al lang',
    'al jaren',
    'zo lang',
    'veel tijd',
    'veel moeite'
  ],
  
  // Failure signals
  failure: [
    'al geprobeerd',
    'alles geprobeerd',
    'niks werkt',
    'geen resultaat',
    'telkens terug',
    'jojo effect',
    'geef het op'
  ],
  
  // Confusion signals
  confusion: [
    'geen idee',
    'snap er niks van',
    'te moeilijk',
    'te ingewikkeld',
    'weet niet hoe',
    'begrijp het niet'
  ],
  
  // Desperation signals
  desperation: [
    'wanhopig',
    'weet niet meer',
    'help nodig',
    'moet iets veranderen',
    'kan zo niet',
    'moet echt'
  ]
}

/**
 * Detect pain in a message
 * @param {string} message - Lead's response
 * @param {object} node - Current decision tree node
 * @returns {object} Detection result
 */
export function detectPain(message, node = null) {
  if (!message) {
    return {
      detected: false,
      score: 0,
      triggers: [],
      category: null
    }
  }
  
  const messageLower = message.toLowerCase().trim()
  const triggers = []
  let score = 0
  let highestCategory = null
  
  // Check all pain categories
  Object.entries(PAIN_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (messageLower.includes(keyword)) {
        triggers.push({
          keyword,
          category,
          weight: getPainWeight(category)
        })
        
        const weight = getPainWeight(category)
        score += weight
        
        if (!highestCategory || weight > getPainWeight(highestCategory)) {
          highestCategory = category
        }
      }
    })
  })
  
  // Check node-specific pain keywords
  if (node?.painKeywords) {
    node.painKeywords.forEach(keyword => {
      if (messageLower.includes(keyword.toLowerCase())) {
        triggers.push({
          keyword,
          category: 'node_specific',
          weight: 2
        })
        score += 2
      }
    })
  }
  
  // Normalize score to 0-10
  const normalizedScore = Math.min(10, score)
  
  return {
    detected: score > 0,
    score: normalizedScore,
    triggers,
    category: highestCategory,
    severity: getSeverity(normalizedScore)
  }
}

/**
 * Get weight for pain category
 */
function getPainWeight(category) {
  const weights = {
    frustration: 2,
    timeEffort: 3,
    failure: 3,
    confusion: 1,
    desperation: 4,
    node_specific: 2
  }
  return weights[category] || 1
}

/**
 * Get severity level based on score
 */
function getSeverity(score) {
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  if (score >= 1) return 'low'
  return 'none'
}

/**
 * Calculate call trigger score
 * Combines pain detection with conversation progress
 */
export function calculateTriggerScore(conversationState) {
  const {
    painDetections = [],
    currentPhase,
    messagesCount = 0,
    hasSpecificGoal = false,
    timeInvested = 0
  } = conversationState
  
  let score = 0
  
  // Pain contribution (0-5 points)
  const totalPainScore = painDetections.reduce((sum, p) => sum + p.score, 0)
  const painContribution = Math.min(5, totalPainScore / 2)
  score += painContribution
  
  // Phase contribution (0-2 points)
  const phaseScores = {
    opening: 0,
    qualify: 1,
    call_push: 2,
    bezwaar: 1
  }
  score += phaseScores[currentPhase] || 0
  
  // Conversation depth (0-2 points)
  if (messagesCount >= 5) score += 2
  else if (messagesCount >= 3) score += 1
  
  // Commitment signals (0-1 point)
  if (hasSpecificGoal) score += 1
  if (timeInvested > 180) score += 1 // 3+ minutes invested
  
  return Math.min(10, Math.round(score))
}

/**
 * Get recommended action based on trigger score
 */
export function getRecommendedAction(triggerScore, painSeverity) {
  if (triggerScore >= 8 || painSeverity === 'high') {
    return {
      action: 'call_push_direct',
      urgency: 'high',
      message: '🚨 HOGE PAIN + SCORE - Push call NU!',
      color: '#ef4444'
    }
  }
  
  if (triggerScore >= 6 || painSeverity === 'medium') {
    return {
      action: 'call_push_soft',
      urgency: 'medium',
      message: '📞 Goede moment voor call push',
      color: '#f59e0b'
    }
  }
  
  if (triggerScore >= 4) {
    return {
      action: 'qualify_deeper',
      urgency: 'low',
      message: '💬 Blijf qualify, bijna bij call push',
      color: '#3b82f6'
    }
  }
  
  return {
    action: 'continue_qualify',
    urgency: 'low',
    message: '📊 Normale flow, blijf qualify',
    color: '#10b981'
  }
}

/**
 * Analyze complete conversation for insights
 */
export function analyzeConversation(messages) {
  const painPoints = []
  const positiveSignals = []
  const objections = []
  let totalPainScore = 0
  
  messages.forEach((msg, index) => {
    if (msg.sent_by === 'lead' && msg.text) {
      const pain = detectPain(msg.text)
      
      if (pain.detected) {
        painPoints.push({
          index,
          text: msg.text,
          pain,
          timestamp: msg.timestamp
        })
        totalPainScore += pain.score
      }
      
      // Detect positive signals
      const positiveKeywords = ['ja', 'graag', 'klinkt goed', 'top', 'nice', 'oke']
      if (positiveKeywords.some(kw => msg.text.toLowerCase().includes(kw))) {
        positiveSignals.push({
          index,
          text: msg.text,
          timestamp: msg.timestamp
        })
      }
      
      // Detect objections
      const objectionKeywords = ['nee', 'niet', 'geen', 'maar', 'toch']
      if (objectionKeywords.some(kw => msg.text.toLowerCase().startsWith(kw))) {
        objections.push({
          index,
          text: msg.text,
          timestamp: msg.timestamp
        })
      }
    }
  })
  
  return {
    painPoints,
    positiveSignals,
    objections,
    totalPainScore,
    avgPainPerMessage: messages.length > 0 ? totalPainScore / messages.length : 0,
    sentiment: getSentiment(positiveSignals.length, objections.length, painPoints.length)
  }
}

/**
 * Get overall conversation sentiment
 */
function getSentiment(positiveCount, objectionCount, painCount) {
  const score = positiveCount - (objectionCount * 0.5) - (painCount * 0.3)
  
  if (score > 2) return { label: 'positive', emoji: '😊', color: '#10b981' }
  if (score > 0) return { label: 'neutral', emoji: '😐', color: '#f59e0b' }
  if (score > -2) return { label: 'hesitant', emoji: '🤔', color: '#ef4444' }
  return { label: 'negative', emoji: '😤', color: '#991b1b' }
}

/**
 * Export for use in other modules
 */
export default {
  detectPain,
  calculateTriggerScore,
  getRecommendedAction,
  analyzeConversation,
  PAIN_KEYWORDS
}
