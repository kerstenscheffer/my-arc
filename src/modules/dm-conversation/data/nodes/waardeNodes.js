// FILE: src/modules/dm-conversation/data/nodes/waardeNodes.js
// MY ARC - Waarde (Value) Tip Nodes
// 3 nodes for different types of value tips

import { waardeTipVariants } from '../variants/followUpVariants.js'

export const waardeNodes = {

  // ==========================================
  // WAARDE TIP - BASIC
  // ==========================================
  waarde_tip_basic: {
    id: 'waarde_tip_basic',
    phase: 'waarde',
    label: 'Waarde Tip - Basic',
    description: 'Basis fitness tips (eiwit, TDEE, slaap, progressive overload, consistency)',
    variants: waardeTipVariants.slice(0, 5), // w1-w5
    defaultVariant: 'w1',
    options: [
      { 
        id: 'wants_more', 
        label: '💡 Wil meer tips',
        description: 'Lead vraagt om meer',
        next: 'waarde_tip_advanced'
      },
      { 
        id: 'grateful', 
        label: '🙏 Bedankt',
        description: 'Lead bedankt voor tip',
        next: 'follow_up_dag7'
      },
      { 
        id: 'now_interested', 
        label: '✅ Nu wel call',
        description: 'Lead wil nu toch bellen',
        next: 'call_push_soft'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'end_follow_up'
      }
    ]
  },

  // ==========================================
  // WAARDE TIP - FACTS
  // ==========================================
  waarde_tip_facts: {
    id: 'waarde_tip_facts',
    phase: 'waarde',
    label: 'Waarde Tip - Facts',
    description: 'Feiten en eye-openers (80% keuken, undereating, slaap, compound, timing)',
    variants: [
      waardeTipVariants[8],  // w9
      waardeTipVariants[9],  // w10
      waardeTipVariants[10], // w11
      waardeTipVariants[11], // w12
      waardeTipVariants[12]  // w13
    ],
    defaultVariant: 'w9',
    options: [
      { 
        id: 'mind_blown', 
        label: '🤯 Mind blown',
        description: 'Lead is verrast',
        next: 'call_push_logical'
      },
      { 
        id: 'wants_help', 
        label: '✅ Wil hulp',
        description: 'Lead vraagt om hulp',
        next: 'call_push_direct'
      },
      { 
        id: 'grateful', 
        label: '🙏 Bedankt',
        description: 'Lead bedankt voor info',
        next: 'follow_up_dag7'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'end_follow_up'
      }
    ]
  },

  // ==========================================
  // WAARDE TIP - ADVANCED
  // ==========================================
  waarde_tip_advanced: {
    id: 'waarde_tip_advanced',
    phase: 'waarde',
    label: 'Waarde Tip - Advanced',
    description: 'Geavanceerde tips (tracking, hydration, pre-workout, cardio)',
    variants: [
      waardeTipVariants[5],  // w6
      waardeTipVariants[6],  // w7
      waardeTipVariants[7],  // w8
      waardeTipVariants[13]  // w14
    ],
    defaultVariant: 'w6',
    options: [
      { 
        id: 'wants_coaching', 
        label: '✅ Wil coaching',
        description: 'Lead ziet waarde van coaching',
        next: 'call_push_direct'
      },
      { 
        id: 'implementing', 
        label: '💪 Gaat toepassen',
        description: 'Lead gaat tips gebruiken',
        next: 'follow_up_dag21'
      },
      { 
        id: 'grateful', 
        label: '🙏 Bedankt',
        description: 'Lead bedankt',
        next: 'end_follow_up'
      },
      { 
        id: 'no_reply', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'end_follow_up'
      }
    ]
  }

}
