// FILE: src/modules/dm-conversation/data/decisionTree.js
// MY ARC - DM Conversation Decision Tree
// Version 4.0 - COMPLETE SYSTEM with 120+ Messages
// Compatible with ConversationNavigator v6

import { dikkerVariants, dunnerVariants, sporterVariants, neutraalVariants } from './variants/openingVariants.js'
import { 
  qualifyAfvallenVariants, 
  qualifySpierenVariants, 
  qualifySportVariants,
  qualifyVastVariants,
  qualifyGevoelVariants,
  qualifyTracktVariants,
  painDeepenVariants
} from './variants/qualifyVariants.js'
import {
  callPushSoftVariants,
  callPushDirectVariants,
  callPushLogicalVariants,
  callPushUrgencyVariants
} from './variants/callPushVariants.js'
import {
  bezwaarNadenkenVariants,
  bezwaarGeenTijdVariants,
  bezwaarZelfProberenVariants,
  bezwaarTeDuurVariants,
  bezwaarLaterVariants,
  bezwaarViaChatVariants,
  bezwaarSalesPitchVariants
} from './variants/bezwaarVariants.js'
import {
  followUpDag1Variants,
  followUpDag3Variants,
  followUpDag7Variants,
  followUpDag21Variants,
  waardeTipVariants
} from './variants/followUpVariants.js'
import {
  callAdminBevestigingVariants,
  callAdminRemindersVariants,
  callAdminNoShowVariants,
  callAdminRescheduleVariants,
  callAdminLongSilenceVariants
} from './variants/callAdminVariants.js'

// Import node modules
import { callPushNodes } from './nodes/callPushNodes.js'
import { bezwaarNodes } from './nodes/bezwaarNodes.js'
import { callAdminNodes } from './nodes/callAdminNodes.js'
import { followUpNodes } from './nodes/followUpNodes.js'
import { waardeNodes } from './nodes/waardeNodes.js'

// ============================================
// DECISION TREE OBJECT
// ============================================

const DECISION_TREE = {
  
  // ==========================================
  // OPENING PHASE
  // ==========================================
  
  start: {
    id: 'start',
    phase: 'opening',
    label: 'START - Profiel Type',
    description: 'Selecteer het profiel type van de lead',
    question: 'Welk type profiel heeft deze lead?',
    options: [
      { 
        id: 'dikker',
        label: '🔴 Dikker (Afvallen)',
        description: 'Lead wil afvallen / vet verliezen',
        next: 'opening_dikker'
      },
      { 
        id: 'dunner',
        label: '🔵 Dunner (Spieren)',
        description: 'Lead wil spiermassa opbouwen',
        next: 'opening_dunner'
      },
      { 
        id: 'sporter',
        label: '⚽ Sporter (Prestatie)',
        description: 'Lead doet aan sport',
        next: 'opening_sporter'
      },
      { 
        id: 'neutral',
        label: '⚪ Neutraal (Onbekend)',
        description: 'Profiel niet duidelijk',
        next: 'opening_neutraal'
      }
    ]
  },

  opening_dikker: {
    id: 'opening_dikker',
    phase: 'opening',
    label: 'Opening - Dikker',
    message: {
      variants: dikkerVariants
    },
    options: [
      {
        id: 'afvallen',
        label: '✅ Ja, wil afvallen',
        userResponse: 'Ja klopt, wil graag afvallen',
        next: 'qualify_afvallen'
      },
      {
        id: 'al_bezig',
        label: '🔥 Ja, ben al bezig',
        userResponse: 'Ja man! Al X kilo kwijt',
        next: 'qualify_afvallen'
      },
      {
        id: 'nee_anders',
        label: '❌ Nee, iets anders',
        userResponse: 'Nee eigenlijk niet',
        next: 'qualify_vast'
      },
      {
        id: 'geen_reactie',
        label: '👻 Geen reactie',
        userResponse: '[Geen reactie]',
        next: 'follow_up_1'
      }
    ]
  },

  opening_dunner: {
    id: 'opening_dunner',
    phase: 'opening',
    label: 'Opening - Dunner',
    message: {
      variants: dunnerVariants
    },
    options: [
      {
        id: 'spieren',
        label: '✅ Ja, wil spieren',
        userResponse: 'Ja klopt, wil graag massa',
        next: 'qualify_spieren'
      },
      {
        id: 'al_bezig',
        label: '🔥 Ja, ben al bezig',
        userResponse: 'Ja man! Al X kilo aangekomen',
        next: 'qualify_spieren'
      },
      {
        id: 'nee_anders',
        label: '❌ Nee, iets anders',
        userResponse: 'Nee eigenlijk niet',
        next: 'qualify_vast'
      },
      {
        id: 'geen_reactie',
        label: '👻 Geen reactie',
        userResponse: '[Geen reactie]',
        next: 'follow_up_1'
      }
    ]
  },

  opening_sporter: {
    id: 'opening_sporter',
    phase: 'opening',
    label: 'Opening - Sporter',
    message: {
      variants: sporterVariants
    },
    options: [
      {
        id: 'prestatie',
        label: '✅ Ja, wil beter worden',
        userResponse: 'Ja klopt, wil beter presteren',
        next: 'qualify_sport'
      },
      {
        id: 'al_bezig',
        label: '🔥 Ja, ben serieus bezig',
        userResponse: 'Ja man! Train al X keer per week',
        next: 'qualify_sport'
      },
      {
        id: 'nee_anders',
        label: '❌ Nee, iets anders',
        userResponse: 'Nee eigenlijk niet',
        next: 'qualify_vast'
      },
      {
        id: 'geen_reactie',
        label: '👻 Geen reactie',
        userResponse: '[Geen reactie]',
        next: 'follow_up_1'
      }
    ]
  },

  opening_neutraal: {
    id: 'opening_neutraal',
    phase: 'opening',
    label: 'Opening - Neutraal',
    message: {
      variants: neutraalVariants
    },
    options: [
      {
        id: 'afvallen',
        label: '🔴 Afvallen',
        userResponse: 'Ja wil graag afvallen',
        next: 'qualify_afvallen'
      },
      {
        id: 'spieren',
        label: '🔵 Massa/spieren',
        userResponse: 'Wil graag spieren opbouwen',
        next: 'qualify_spieren'
      },
      {
        id: 'sport',
        label: '⚽ Sport prestatie',
        userResponse: 'Wil beter worden in sport',
        next: 'qualify_sport'
      },
      {
        id: 'algemeen',
        label: '💪 Algemeen fitter',
        userResponse: 'Gewoon algemeen fitter',
        next: 'qualify_gevoel'
      },
      {
        id: 'geen_reactie',
        label: '👻 Geen reactie',
        userResponse: '[Geen reactie]',
        next: 'follow_up_1'
      }
    ]
  },

  // ==========================================
  // QUALIFY PHASE
  // ==========================================

  qualify_afvallen: {
    id: 'qualify_afvallen',
    phase: 'qualify',
    label: 'Qualify - Afvallen',
    message: {
      variants: qualifyAfvallenVariants
    },
    options: [
      {
        id: 'going_well',
        label: '✅ Gaat goed, zie resultaat',
        userResponse: 'Ja man, gaat prima!',
        next: 'qualify_trackt'
      },
      {
        id: 'struggles',
        label: '⚠️ Loopt vast / struggle',
        userResponse: 'Tja, blijft lastig...',
        next: 'qualify_vast'
      },
      {
        id: 'no_tracking',
        label: '🤷 Doe het op gevoel',
        userResponse: 'Ik let er niet echt op',
        next: 'qualify_gevoel'
      },
      {
        id: 'ready_help',
        label: '🔥 Wil graag hulp',
        userResponse: 'Zou wel hulp kunnen gebruiken',
        next: 'pain_deepen'
      }
    ]
  },

  qualify_spieren: {
    id: 'qualify_spieren',
    phase: 'qualify',
    label: 'Qualify - Spieren',
    message: {
      variants: qualifySpierenVariants
    },
    options: [
      {
        id: 'going_well',
        label: '✅ Gaat goed, groei goed',
        userResponse: 'Ja komt goed!',
        next: 'qualify_trackt'
      },
      {
        id: 'struggles',
        label: '⚠️ Groei niet / plateau',
        userResponse: 'Kom niet vooruit eigenlijk',
        next: 'qualify_vast'
      },
      {
        id: 'no_tracking',
        label: '🤷 Eet gewoon wat',
        userResponse: 'Let er niet echt op',
        next: 'qualify_gevoel'
      },
      {
        id: 'ready_help',
        label: '🔥 Wil graag hulp',
        userResponse: 'Zou wel hulp kunnen gebruiken',
        next: 'pain_deepen'
      }
    ]
  },

  qualify_sport: {
    id: 'qualify_sport',
    phase: 'qualify',
    label: 'Qualify - Sport',
    message: {
      variants: qualifySportVariants
    },
    options: [
      {
        id: 'serious',
        label: '✅ Serieus bezig, train veel',
        userResponse: 'Ja train 5x per week',
        next: 'qualify_trackt'
      },
      {
        id: 'casual',
        label: '🤷 Casual, voor fun',
        userResponse: 'Gewoon voor de lol',
        next: 'qualify_gevoel'
      },
      {
        id: 'want_better',
        label: '🔥 Wil beter worden',
        userResponse: 'Wil echt naar hoger niveau',
        next: 'pain_deepen'
      }
    ]
  },

  qualify_vast: {
    id: 'qualify_vast',
    phase: 'qualify',
    label: 'Qualify - Vast / Pain',
    message: {
      variants: qualifyVastVariants
    },
    options: [
      {
        id: 'long_time',
        label: '😤 Al lang vast (>3 maanden)',
        userResponse: 'Al maanden hetzelfde...',
        next: 'pain_deepen'
      },
      {
        id: 'recent',
        label: '⏱️ Kort vast (<1 maand)',
        userResponse: 'Pas recent vastgelopen',
        next: 'call_push_soft'
      },
      {
        id: 'tried_much',
        label: '🔄 Al veel geprobeerd',
        userResponse: 'Echt alles al geprobeerd',
        next: 'pain_deepen'
      }
    ]
  },

  qualify_gevoel: {
    id: 'qualify_gevoel',
    phase: 'qualify',
    label: 'Qualify - Op gevoel',
    message: {
      variants: qualifyGevoelVariants
    },
    options: [
      {
        id: 'works',
        label: '✅ Werkt wel voor mij',
        userResponse: 'Ja zie wel resultaat',
        next: 'waarde_tip_tracking'
      },
      {
        id: 'not_working',
        label: '❌ Werkt eigenlijk niet',
        userResponse: 'Blijft eigenlijk hetzelfde',
        next: 'qualify_vast'
      },
      {
        id: 'want_better',
        label: '🎯 Wil wel beter systeem',
        userResponse: 'Zou wel zekerheid willen',
        next: 'call_push_logical'
      }
    ]
  },

  qualify_trackt: {
    id: 'qualify_trackt',
    phase: 'qualify',
    label: 'Qualify - Trackt al',
    message: {
      variants: qualifyTracktVariants
    },
    options: [
      {
        id: 'perfect',
        label: '✅ Gaat perfect',
        userResponse: 'Ja echt super!',
        next: 'waarde_tip_advanced'
      },
      {
        id: 'stuck',
        label: '⚠️ Toch vastgelopen',
        userResponse: 'Blijf wel hangen ergens',
        next: 'pain_deepen'
      },
      {
        id: 'want_optimize',
        label: '🎯 Wil optimaliseren',
        userResponse: 'Kan altijd beter toch?',
        next: 'call_push_direct'
      }
    ]
  },

  pain_deepen: {
    id: 'pain_deepen',
    phase: 'qualify',
    label: 'Pain Deepen',
    message: {
      variants: painDeepenVariants
    },
    options: [
      {
        id: 'very_frustrated',
        label: '😤 Echt frustrated (8-10)',
        userResponse: 'Man dit is echt kut',
        next: 'call_push_urgency'
      },
      {
        id: 'medium_pain',
        label: '😕 Matig frustrated (5-7)',
        userResponse: 'Ja is wel vervelend',
        next: 'call_push_direct'
      },
      {
        id: 'willing_change',
        label: '🔥 Wil dit echt fixen',
        userResponse: 'Moet echt veranderen',
        next: 'call_push_direct'
      }
    ]
  },

  // ==========================================
  // PLACEHOLDERS - TODO
  // ==========================================

  // ==========================================
  // CALL PUSH PHASE
  // ==========================================
  ...callPushNodes,

  // ==========================================
  // BEZWAAR HANDLING PHASE
  // ==========================================
  ...bezwaarNodes,

  // ==========================================
  // CALL ADMIN PHASE
  // ==========================================
  ...callAdminNodes,

  // ==========================================
  // FOLLOW-UP PHASE
  // ==========================================
  ...followUpNodes,

  // ==========================================
  // WAARDE (VALUE) TIPS PHASE
  // ==========================================
  ...waardeNodes,

  // ==========================================
  // END NODES
  // ==========================================
  end_call_booked: {
    id: 'end_call_booked',
    phase: 'end',
    label: 'END - Call Booked',
    message: { text: '✅ Call geboekt!' },
    isEndNode: true
  },

  end_follow_up: {
    id: 'end_follow_up',
    phase: 'end',
    label: 'END - Follow-up',
    message: { text: '📅 Follow-up actief' },
    isEndNode: true
  },

  end_lost: {
    id: 'end_lost',
    phase: 'end',
    label: 'END - Lost',
    message: { text: '❌ Lead lost' },
    isEndNode: true
  }

}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNode(tree, nodeId) {
  return tree[nodeId] || null
}

function isEndNode(nodeId) {
  return nodeId?.startsWith('end_') || false
}

function getPhaseColor(phase) {
  const colors = {
    'opening': '#3b82f6',
    'qualify': '#10b981',
    'call_push': '#f59e0b',
    'bezwaar': '#ef4444',
    'follow_up': '#8b5cf6',
    'waarde': '#14b8a6',
    'call_admin': '#D4AF37',
    'end': '#6b7280'
  }
  return colors[phase] || '#6b7280'
}

// ============================================
// EXPORTS
// ============================================

export { DECISION_TREE, getNode, isEndNode, getPhaseColor }
