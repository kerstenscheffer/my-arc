// FILE: src/modules/dm-conversation/data/nodes/callPushNodes.js
// MY ARC - Call Push Nodes
// 4 nodes for different call push strategies

import {
  callPushSoftVariants,
  callPushDirectVariants,
  callPushLogicalVariants,
  callPushUrgencyVariants
} from '../variants/callPushVariants.js'

export const callPushNodes = {
  
  // ==========================================
  // CALL PUSH - SOFT APPROACH
  // ==========================================
  call_push_soft: {
    id: 'call_push_soft',
    phase: 'call_push',
    label: 'Call Push - Soft Approach',
    description: 'Zachte benadering: "Als je wilt kan ik helpen..."',
    variants: callPushSoftVariants,
    defaultVariant: 'cp1',
    options: [
      { 
        id: 'yes', 
        label: '✅ Ja, wil bellen',
        description: 'Lead zegt ja tegen call',
        next: 'call_admin_booking'
      },
      { 
        id: 'maybe', 
        label: '🤔 Twijfelt',
        description: 'Lead twijfelt nog',
        next: 'call_push_logical'
      },
      { 
        id: 'objection', 
        label: '❌ Bezwaar',
        description: 'Lead geeft bezwaar',
        next: 'bezwaar_selectie'
      }
    ]
  },

  // ==========================================
  // CALL PUSH - DIRECT APPROACH
  // ==========================================
  call_push_direct: {
    id: 'call_push_direct',
    phase: 'call_push',
    label: 'Call Push - Direct',
    description: 'Directe benadering: "Laten we bellen, wanneer kan je?"',
    variants: callPushDirectVariants,
    defaultVariant: 'cp5',
    options: [
      { 
        id: 'yes', 
        label: '✅ Ja, wil bellen',
        description: 'Lead zegt ja tegen call',
        next: 'call_admin_booking'
      },
      { 
        id: 'objection', 
        label: '❌ Bezwaar',
        description: 'Lead geeft bezwaar',
        next: 'bezwaar_selectie'
      }
    ]
  },

  // ==========================================
  // CALL PUSH - LOGICAL APPROACH
  // ==========================================
  call_push_logical: {
    id: 'call_push_logical',
    phase: 'call_push',
    label: 'Call Push - Logical',
    description: 'Logische benadering: "15min is effectiever dan typen..."',
    variants: callPushLogicalVariants,
    defaultVariant: 'cp9',
    options: [
      { 
        id: 'yes', 
        label: '✅ Ja, dat klopt',
        description: 'Lead ziet de logica in',
        next: 'call_admin_booking'
      },
      { 
        id: 'still_no', 
        label: '❌ Nog steeds nee',
        description: 'Lead blijft weigeren',
        next: 'bezwaar_selectie'
      }
    ]
  },

  // ==========================================
  // CALL PUSH - URGENCY APPROACH
  // ==========================================
  call_push_urgency: {
    id: 'call_push_urgency',
    phase: 'call_push',
    label: 'Call Push - Urgency',
    description: 'Urgentie benadering: "Agenda bijna vol, nu nog plek..."',
    variants: callPushUrgencyVariants,
    defaultVariant: 'cp12',
    options: [
      { 
        id: 'yes', 
        label: '✅ Oké, snel inplannen',
        description: 'Lead voelt urgentie',
        next: 'call_admin_booking'
      },
      { 
        id: 'no_rush', 
        label: '⏰ Geen haast',
        description: 'Lead voelt geen urgentie',
        next: 'bezwaar_later'
      },
      { 
        id: 'objection', 
        label: '❌ Anders bezwaar',
        description: 'Ander bezwaar',
        next: 'bezwaar_selectie'
      }
    ]
  }

}
