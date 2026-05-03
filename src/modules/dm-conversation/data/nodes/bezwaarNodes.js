// FILE: src/modules/dm-conversation/data/nodes/bezwaarNodes.js
// MY ARC - Bezwaar (Objection) Handling Nodes
// 8 nodes: 1 selection menu + 7 objection types

import {
  bezwaarNadenkenVariants,
  bezwaarGeenTijdVariants,
  bezwaarZelfProberenVariants,
  bezwaarTeDuurVariants,
  bezwaarLaterVariants,
  bezwaarViaChatVariants,
  bezwaarSalesPitchVariants
} from '../variants/bezwaarVariants.js'

export const bezwaarNodes = {

  // ==========================================
  // BEZWAAR SELECTIE (MENU)
  // ==========================================
  bezwaar_selectie: {
    id: 'bezwaar_selectie',
    phase: 'bezwaar',
    label: 'Bezwaar Selectie',
    description: 'Kies het type bezwaar van de lead',
    question: 'Welk bezwaar geeft de lead?',
    options: [
      { 
        id: 'nadenken', 
        label: '🤔 Wil nadenken',
        description: '"Ik moet er even over nadenken"',
        next: 'bezwaar_nadenken'
      },
      { 
        id: 'geen_tijd', 
        label: '⏰ Geen tijd',
        description: '"Ik heb nu geen tijd"',
        next: 'bezwaar_geen_tijd'
      },
      { 
        id: 'zelf_proberen', 
        label: '💪 Zelf proberen',
        description: '"Ik wil het eerst zelf proberen"',
        next: 'bezwaar_zelf_proberen'
      },
      { 
        id: 'te_duur', 
        label: '💰 Te duur',
        description: '"Dat is te duur voor mij"',
        next: 'bezwaar_te_duur'
      },
      { 
        id: 'later', 
        label: '📅 Later',
        description: '"Misschien later"',
        next: 'bezwaar_later'
      },
      { 
        id: 'via_chat', 
        label: '💬 Via chat helpen',
        description: '"Kun je niet gewoon via chat helpen?"',
        next: 'bezwaar_via_chat'
      },
      { 
        id: 'sales_pitch', 
        label: '🎯 "Is dit een sales pitch?"',
        description: 'Lead denkt dat het sales is',
        next: 'bezwaar_sales_pitch'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: NADENKEN
  // ==========================================
  bezwaar_nadenken: {
    id: 'bezwaar_nadenken',
    phase: 'bezwaar',
    label: 'Bezwaar - Nadenken',
    description: 'Lead wil nadenken over de call',
    variants: bezwaarNadenkenVariants,
    defaultVariant: 'b1',
    options: [
      { 
        id: 'overcome', 
        label: '✅ Bezwaar weggenomen',
        description: 'Lead is overtuigd',
        next: 'call_push_soft'
      },
      { 
        id: 'still_thinking', 
        label: '🤔 Blijft twijfelen',
        description: 'Lead blijft nadenken',
        next: 'follow_up_dag3'
      },
      { 
        id: 'exit', 
        label: '❌ Niet interested',
        description: 'Lead haakt af',
        next: 'end_lost'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: GEEN TIJD
  // ==========================================
  bezwaar_geen_tijd: {
    id: 'bezwaar_geen_tijd',
    phase: 'bezwaar',
    label: 'Bezwaar - Geen Tijd',
    description: 'Lead zegt geen tijd te hebben',
    variants: bezwaarGeenTijdVariants,
    defaultVariant: 'b6',
    options: [
      { 
        id: 'reschedule', 
        label: '📅 Later inplannen',
        description: 'Lead wil andere tijd',
        next: 'call_admin_reschedule'
      },
      { 
        id: 'priority_check', 
        label: '⚡ Prioriteit check',
        description: 'Is het echt tijd of prioriteit?',
        next: 'call_push_logical'
      },
      { 
        id: 'exit', 
        label: '❌ Echt geen tijd',
        description: 'Lead heeft echt geen tijd',
        next: 'follow_up_dag7'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: ZELF PROBEREN
  // ==========================================
  bezwaar_zelf_proberen: {
    id: 'bezwaar_zelf_proberen',
    phase: 'bezwaar',
    label: 'Bezwaar - Zelf Proberen',
    description: 'Lead wil het eerst zelf proberen',
    variants: bezwaarZelfProberenVariants,
    defaultVariant: 'b11',
    options: [
      { 
        id: 'overcome', 
        label: '✅ Ziet voordeel coaching',
        description: 'Lead ziet waarom coaching beter is',
        next: 'call_push_logical'
      },
      { 
        id: 'still_want_try', 
        label: '💪 Wil toch zelf',
        description: 'Lead blijft zelf proberen',
        next: 'waarde_tip_basic'
      },
      { 
        id: 'exit', 
        label: '❌ Definitief zelf',
        description: 'Lead gaat definitief zelf',
        next: 'follow_up_dag21'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: TE DUUR
  // ==========================================
  bezwaar_te_duur: {
    id: 'bezwaar_te_duur',
    phase: 'bezwaar',
    label: 'Bezwaar - Te Duur',
    description: 'Lead vindt het te duur',
    variants: bezwaarTeDuurVariants,
    defaultVariant: 'b16',
    options: [
      { 
        id: 'value_shown', 
        label: '✅ Ziet waarde',
        description: 'Lead ziet de waarde in',
        next: 'call_push_direct'
      },
      { 
        id: 'isolate', 
        label: '🔍 Geld isoleren',
        description: 'Is geld het echte bezwaar?',
        next: 'call_push_logical'
      },
      { 
        id: 'still_expensive', 
        label: '💰 Blijft te duur',
        description: 'Lead kan/wil niet betalen',
        next: 'end_lost'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: LATER
  // ==========================================
  bezwaar_later: {
    id: 'bezwaar_later',
    phase: 'bezwaar',
    label: 'Bezwaar - Later',
    description: 'Lead zegt "misschien later"',
    variants: bezwaarLaterVariants,
    defaultVariant: 'b21',
    options: [
      { 
        id: 'now', 
        label: '✅ Nu toch',
        description: 'Lead kiest voor nu',
        next: 'call_push_urgency'
      },
      { 
        id: 'specific_date', 
        label: '📅 Specifieke datum',
        description: 'Lead noemt datum',
        next: 'call_admin_long_silence'
      },
      { 
        id: 'vague', 
        label: '👻 Vaag later',
        description: 'Later = nooit',
        next: 'follow_up_dag7'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: VIA CHAT
  // ==========================================
  bezwaar_via_chat: {
    id: 'bezwaar_via_chat',
    phase: 'bezwaar',
    label: 'Bezwaar - Via Chat',
    description: 'Lead wil via chat geholpen worden',
    variants: bezwaarViaChatVariants,
    defaultVariant: 'b26',
    options: [
      { 
        id: 'sees_point', 
        label: '✅ Ziet voordeel call',
        description: 'Lead begrijpt waarom call beter is',
        next: 'call_push_direct'
      },
      { 
        id: 'insists_chat', 
        label: '💬 Blijft bij chat',
        description: 'Lead wil echt via chat',
        next: 'waarde_tip_basic'
      },
      { 
        id: 'exit', 
        label: '❌ Niet interested',
        description: 'Lead haakt af',
        next: 'end_lost'
      }
    ]
  },

  // ==========================================
  // BEZWAAR: SALES PITCH
  // ==========================================
  bezwaar_sales_pitch: {
    id: 'bezwaar_sales_pitch',
    phase: 'bezwaar',
    label: 'Bezwaar - Sales Pitch',
    description: 'Lead denkt dat het sales is',
    variants: bezwaarSalesPitchVariants,
    defaultVariant: 'b31',
    options: [
      { 
        id: 'trusts', 
        label: '✅ Vertrouwt het',
        description: 'Lead begrijpt het is geen push',
        next: 'call_push_soft'
      },
      { 
        id: 'skeptical', 
        label: '🤨 Blijft sceptisch',
        description: 'Lead blijft wantrouwend',
        next: 'waarde_tip_basic'
      },
      { 
        id: 'exit', 
        label: '❌ Niet interested',
        description: 'Lead wil geen sales',
        next: 'end_lost'
      }
    ]
  }

}
