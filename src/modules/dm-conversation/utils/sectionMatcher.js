// src/modules/dm-conversation/utils/sectionMatcher.js
// Pattern matching utility to map DM conversation nodes to kanban sections

/**
 * NODE CATEGORY DEFINITIONS
 * Maps each conversation node to a logical category
 */
const NODE_TO_CATEGORY = {
  // Opening phase → Initial Contact
  'start': 'initial_contact',
  'opening_dikker': 'initial_contact',
  'opening_dunner': 'initial_contact',
  
  // Qualification → Initial Contact
  'qualify_afvallen': 'initial_contact',
  'qualify_spieren': 'initial_contact',
  'qualify_vet_verliezen': 'initial_contact',
  'qualify_conditie': 'initial_contact',
  
  // Call Push variants → Call Voorgesteld
  'call_push_soft': 'call_voorgesteld',
  'call_push_direct': 'call_voorgesteld',
  'call_push_logical': 'call_voorgesteld',
  'call_push_urgency': 'call_voorgesteld',
  'call_push_fomo': 'call_voorgesteld',
  
  // Bezwaar handling → Bezwaar Handling
  'bezwaar_selectie': 'bezwaar_handling',
  'bezwaar_nadenken': 'bezwaar_handling',
  'bezwaar_geen_tijd': 'bezwaar_handling',
  'bezwaar_zelf_proberen': 'bezwaar_handling',
  'bezwaar_te_duur': 'bezwaar_handling',
  'bezwaar_later': 'bezwaar_handling',
  'bezwaar_via_chat': 'bezwaar_handling',
  'bezwaar_sales_pitch': 'bezwaar_handling',
  'bezwaar_ik_ben_al_bezig': 'bezwaar_handling',
  
  // Call admin → Call Ingepland
  'call_admin_booking': 'call_ingepland',
  'call_admin_tijd_kiezen': 'call_ingepland',
  'call_admin_bevestiging': 'call_ingepland',
  'call_admin_reminders': 'call_ingepland',
  'call_admin_reschedule': 'call_ingepland',
  
  // Follow-up sequence → Follow-up
  'follow_up_dag1': 'follow_up',
  'follow_up_dag3': 'follow_up',
  'follow_up_dag7': 'follow_up',
  'follow_up_dag21': 'follow_up',
  'follow_up_herinner': 'follow_up',
  
  // Value/nurture content → Waarde Gegeven (optional)
  'waarde_tip_basic': 'waarde_gegeven',
  'waarde_tip_facts': 'waarde_gegeven',
  'waarde_tip_advanced': 'waarde_gegeven',
  'waarde_instagram': 'waarde_gegeven',
  
  // End states
  'end_call_booked': 'won',
  'end_lost': 'lost',
  'end_not_ready': 'follow_up'
}

/**
 * SECTION PATTERN MATCHING
 * Keywords to match against section titles
 * Sections are created by user, so we match by keywords
 */
const SECTION_PATTERNS = {
  initial_contact: [
    'nieuw',
    'initial',
    'new',
    'first contact',
    'opening',
    'qualify',
    'kwalificatie'
  ],
  
  call_voorgesteld: [
    'call voor',
    'call push',
    'proposed',
    'voorgesteld',
    'call aangeboden',
    'call gepusht'
  ],
  
  bezwaar_handling: [
    'bezwaar',
    'objection',
    'handling',
    'twijfel',
    'weerstand'
  ],
  
  call_ingepland: [
    'ingepland',
    'booked',
    'scheduled',
    'call ingepland',
    'afspraak',
    'geboekt'
  ],
  
  follow_up: [
    'follow',
    'opvolg',
    'later',
    'herinner',
    'reminder',
    'follow-up'
  ],
  
  waarde_gegeven: [
    'waarde',
    'value',
    'tip',
    'content',
    'nurture',
    'educatie'
  ],
  
  won: [
    'won',
    'gewonnen',
    'success',
    'deal',
    'gelukt',
    'gesloten'
  ],
  
  lost: [
    'lost',
    'verloren',
    'dead',
    'afgewezen',
    'niet interesse'
  ]
}

/**
 * Find matching section for a given node
 * @param {Array} sections - Array of section objects from kanban board
 * @param {string} nodeId - Current conversation node ID
 * @returns {Object|null} - Matching section or null
 */
export function findSectionForNode(sections, nodeId) {
  if (!sections || !nodeId) {
    console.warn('❌ findSectionForNode: Missing sections or nodeId')
    return null
  }
  
  // 1. Get category for this node
  const category = NODE_TO_CATEGORY[nodeId]
  
  if (!category) {
    console.log(`ℹ️ No category mapping for node: ${nodeId}`)
    return null
  }
  
  console.log(`🔍 Node "${nodeId}" → Category "${category}"`)
  
  // 2. Get keywords for this category
  const keywords = SECTION_PATTERNS[category]
  
  if (!keywords || keywords.length === 0) {
    console.warn(`⚠️ No keywords defined for category: ${category}`)
    return null
  }
  
  // 3. Find matching section
  const matchedSection = sections.find(section => {
    const title = (section.title || '').toLowerCase().trim()
    
    // Check if any keyword matches
    const matches = keywords.some(keyword => 
      title.includes(keyword.toLowerCase())
    )
    
    if (matches) {
      console.log(`✅ Matched section: "${section.title}" for category "${category}"`)
    }
    
    return matches
  })
  
  if (!matchedSection) {
    console.warn(`⚠️ No section found for category "${category}". Keywords tried:`, keywords)
    console.log('💡 Available sections:', sections.map(s => s.title).join(', '))
  }
  
  return matchedSection || null
}

/**
 * Get category name for a node (for display purposes)
 * @param {string} nodeId - Conversation node ID
 * @returns {string} - Human-readable category name
 */
export function getCategoryDisplayName(nodeId) {
  const category = NODE_TO_CATEGORY[nodeId]
  
  const displayNames = {
    'initial_contact': 'Initial Contact',
    'call_voorgesteld': 'Call Voorgesteld',
    'bezwaar_handling': 'Bezwaar Handling',
    'call_ingepland': 'Call Ingepland',
    'follow_up': 'Follow-up',
    'waarde_gegeven': 'Waarde Gegeven',
    'won': 'Won',
    'lost': 'Lost'
  }
  
  return displayNames[category] || 'Unknown'
}

/**
 * Validate section setup - check if all required sections exist
 * @param {Array} sections - Array of section objects
 * @returns {Object} - Validation result with missing categories
 */
export function validateSectionSetup(sections) {
  const requiredCategories = [
    'initial_contact',
    'call_voorgesteld',
    'bezwaar_handling',
    'call_ingepland',
    'follow_up',
    'won',
    'lost'
  ]
  
  const foundCategories = new Set()
  
  sections.forEach(section => {
    const title = (section.title || '').toLowerCase()
    
    // Check which category this section matches
    for (const [category, keywords] of Object.entries(SECTION_PATTERNS)) {
      if (keywords.some(kw => title.includes(kw.toLowerCase()))) {
        foundCategories.add(category)
      }
    }
  })
  
  const missingCategories = requiredCategories.filter(cat => !foundCategories.has(cat))
  
  return {
    isValid: missingCategories.length === 0,
    foundCategories: Array.from(foundCategories),
    missingCategories,
    totalSections: sections.length
  }
}

/**
 * Get suggested section names for missing categories
 * @param {Array} missingCategories - Array of missing category names
 * @returns {Array} - Array of suggested section configurations
 */
export function getSuggestedSections(missingCategories) {
  const suggestions = {
    'initial_contact': {
      title: 'Nieuw',
      color: '#6b7280',
      description: 'Voor nieuwe leads in opening/qualify fase'
    },
    'call_voorgesteld': {
      title: 'Call Voorgesteld',
      color: '#f59e0b',
      description: 'Na call push berichten'
    },
    'bezwaar_handling': {
      title: 'Bezwaar Handling',
      color: '#ef4444',
      description: 'Leads met bezwaren'
    },
    'call_ingepland': {
      title: 'Call Ingepland',
      color: '#3b82f6',
      description: 'Call geboekt'
    },
    'follow_up': {
      title: 'Follow-up',
      color: '#a855f7',
      description: 'Follow-up sequence'
    },
    'waarde_gegeven': {
      title: 'Waarde Gegeven',
      color: '#10b981',
      description: 'Nurture content verstuurd'
    },
    'won': {
      title: 'Won',
      color: '#059669',
      description: 'Deals gewonnen'
    },
    'lost': {
      title: 'Lost',
      color: '#991b1b',
      description: 'Deals verloren'
    }
  }
  
  return missingCategories.map(cat => suggestions[cat]).filter(Boolean)
}

export default {
  findSectionForNode,
  getCategoryDisplayName,
  validateSectionSetup,
  getSuggestedSections,
  NODE_TO_CATEGORY,
  SECTION_PATTERNS
}
