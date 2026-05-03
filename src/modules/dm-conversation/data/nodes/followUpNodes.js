// FILE: src/modules/dm-conversation/data/nodes/followUpNodes.js
// MY ARC - Follow-up Nodes
// 4 time-based follow-up nodes

import {
  followUpDag1Variants,
  followUpDag3Variants,
  followUpDag7Variants,
  followUpDag21Variants
} from '../variants/followUpVariants.js'

export const followUpNodes = {

  // ==========================================
  // FOLLOW-UP DAG 1-2
  // ==========================================
  follow_up_dag1: {
    id: 'follow_up_dag1',
    phase: 'follow_up',
    label: 'Follow-up Dag 1-2',
    description: 'Eerste follow-up na geen reactie (1-2 dagen)',
    variants: followUpDag1Variants,
    defaultVariant: 'f1',
    options: [
      { 
        id: 'reply_positive', 
        label: '✅ Positieve reactie',
        description: 'Lead reageert positief',
        next: 'call_push_soft'
      },
      { 
        id: 'reply_negative', 
        label: '❌ Negatieve reactie',
        description: 'Lead heeft bezwaar',
        next: 'bezwaar_selectie'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'follow_up_dag3'
      }
    ]
  },

  // ==========================================
  // FOLLOW-UP DAG 3-5
  // ==========================================
  follow_up_dag3: {
    id: 'follow_up_dag3',
    phase: 'follow_up',
    label: 'Follow-up Dag 3-5',
    description: 'Tweede follow-up met waarde tip (3-5 dagen)',
    variants: followUpDag3Variants,
    defaultVariant: 'f3',
    options: [
      { 
        id: 'reply_interested', 
        label: '✅ Interested nu',
        description: 'Lead reageert nu wel positief',
        next: 'call_push_direct'
      },
      { 
        id: 'reply_question', 
        label: '💬 Stelt vraag',
        description: 'Lead stelt vraag over tip',
        next: 'waarde_tip_advanced'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert nog steeds niet',
        next: 'follow_up_dag7'
      }
    ]
  },

  // ==========================================
  // FOLLOW-UP DAG 7-14
  // ==========================================
  follow_up_dag7: {
    id: 'follow_up_dag7',
    phase: 'follow_up',
    label: 'Follow-up Dag 7-14',
    description: 'Derde follow-up met social proof (7-14 dagen)',
    variants: followUpDag7Variants,
    defaultVariant: 'f6',
    options: [
      { 
        id: 'reply_interested', 
        label: '✅ Nu wel interested',
        description: 'Lead reageert op social proof',
        next: 'call_push_urgency'
      },
      { 
        id: 'reply_curious', 
        label: '🤔 Nieuwsgierig',
        description: 'Lead vraagt meer info',
        next: 'waarde_tip_facts'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'follow_up_dag21'
      }
    ]
  },

  // ==========================================
  // FOLLOW-UP DAG 21+
  // ==========================================
  follow_up_dag21: {
    id: 'follow_up_dag21',
    phase: 'follow_up',
    label: 'Follow-up Dag 21+ (Final)',
    description: 'Laatste follow-up voordat we stoppen (21+ dagen)',
    variants: followUpDag21Variants,
    defaultVariant: 'f9',
    options: [
      { 
        id: 'reply_ready', 
        label: '✅ Nu ready',
        description: 'Lead is nu toch ready',
        next: 'call_push_soft'
      },
      { 
        id: 'reply_thanks', 
        label: '🙏 Bedankt voor tips',
        description: 'Lead bedankt maar geen call',
        next: 'end_follow_up'
      },
      { 
        id: 'no_reply', 
        label: '👻 Definitief geen reactie',
        description: 'Lead reageert helemaal niet meer',
        next: 'end_lost'
      }
    ]
  }

}
