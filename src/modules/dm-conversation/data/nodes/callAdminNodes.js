// FILE: src/modules/dm-conversation/data/nodes/callAdminNodes.js
// MY ARC - Call Admin Nodes
// 5 nodes for call booking and follow-up administration

import {
  callAdminBevestigingVariants,
  callAdminRemindersVariants,
  callAdminNoShowVariants,
  callAdminRescheduleVariants,
  callAdminLongSilenceVariants
} from '../variants/callAdminVariants.js'

export const callAdminNodes = {

  // ==========================================
  // CALL ADMIN - BOOKING
  // ==========================================
  call_admin_booking: {
    id: 'call_admin_booking',
    phase: 'call_admin',
    label: 'Call Booking',
    description: 'Lead zegt ja - nu call inplannen',
    variants: callAdminBevestigingVariants,
    defaultVariant: 'ca1',
    options: [
      { 
        id: 'booked_calendly', 
        label: '📅 Calendly geboekt',
        description: 'Lead heeft via Calendly geboekt',
        next: 'call_admin_reminders'
      },
      { 
        id: 'booked_manual', 
        label: '✍️ Handmatig geboekt',
        description: 'Tijd afgesproken via DM',
        next: 'call_admin_reminders'
      },
      { 
        id: 'no_calendly', 
        label: '❌ Niet geboekt',
        description: 'Lead heeft nog niet geboekt',
        next: 'call_admin_long_silence'
      }
    ]
  },

  // ==========================================
  // CALL ADMIN - REMINDERS
  // ==========================================
  call_admin_reminders: {
    id: 'call_admin_reminders',
    phase: 'call_admin',
    label: 'Call Reminders',
    description: 'Reminders sturen voor geboekte call',
    variants: callAdminRemindersVariants,
    defaultVariant: 'ca6',
    options: [
      { 
        id: 'confirmed', 
        label: '✅ Lead bevestigt',
        description: 'Lead reageert en bevestigt',
        next: 'end_call_booked'
      },
      { 
        id: 'no_response', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet op reminder',
        next: 'call_admin_no_show'
      },
      { 
        id: 'wants_reschedule', 
        label: '📅 Wil verzetten',
        description: 'Lead vraagt om te verzetten',
        next: 'call_admin_reschedule'
      }
    ]
  },

  // ==========================================
  // CALL ADMIN - NO SHOW
  // ==========================================
  call_admin_no_show: {
    id: 'call_admin_no_show',
    phase: 'call_admin',
    label: 'No Show Follow-up',
    description: 'Lead heeft call gemist',
    variants: callAdminNoShowVariants,
    defaultVariant: 'ca11',
    options: [
      { 
        id: 'wants_reschedule', 
        label: '📅 Wil alsnog bellen',
        description: 'Lead wil call verzetten',
        next: 'call_admin_reschedule'
      },
      { 
        id: 'no_response', 
        label: '👻 Geen reactie',
        description: 'Lead reageert niet',
        next: 'follow_up_dag3'
      },
      { 
        id: 'not_interested', 
        label: '❌ Geen interesse meer',
        description: 'Lead haakt definitief af',
        next: 'end_lost'
      }
    ]
  },

  // ==========================================
  // CALL ADMIN - RESCHEDULE
  // ==========================================
  call_admin_reschedule: {
    id: 'call_admin_reschedule',
    phase: 'call_admin',
    label: 'Reschedule Call',
    description: 'Lead wil call verzetten',
    variants: callAdminRescheduleVariants,
    defaultVariant: 'ca16',
    options: [
      { 
        id: 'rescheduled', 
        label: '✅ Nieuwe tijd afgesproken',
        description: 'Nieuwe datum gepland',
        next: 'call_admin_reminders'
      },
      { 
        id: 'vague', 
        label: '🤔 Vaag over tijd',
        description: 'Lead wil niet committen',
        next: 'call_admin_long_silence'
      },
      { 
        id: 'too_many_reschedules', 
        label: '❌ Te vaak verzet',
        description: 'Dit is al 2e/3e keer',
        next: 'follow_up_dag7'
      }
    ]
  },

  // ==========================================
  // CALL ADMIN - LONG SILENCE
  // ==========================================
  call_admin_long_silence: {
    id: 'call_admin_long_silence',
    phase: 'call_admin',
    label: 'Long Silence Check',
    description: 'Lange tijd niks gehoord na booking',
    variants: callAdminLongSilenceVariants,
    defaultVariant: 'ca20',
    options: [
      { 
        id: 'still_interested', 
        label: '✅ Nog interested',
        description: 'Lead reageert positief',
        next: 'call_admin_booking'
      },
      { 
        id: 'not_ready', 
        label: '⏰ Niet ready',
        description: 'Lead wil later',
        next: 'follow_up_dag21'
      },
      { 
        id: 'ghost', 
        label: '👻 Ghost',
        description: 'Lead reageert helemaal niet',
        next: 'end_lost'
      }
    ]
  }

}
