// Qualify Phase Nodes
// Links to REAL qualify variants from messageDatabase.js

import { 
  qualifyAfvallenVariants, 
  qualifySpierenVariants, 
  qualifySportVariants,
  qualifyVastVariants,
  qualifyGevoelVariants,
  qualifyTracktVariants,
  painDeepenVariants
} from '../variants/qualifyVariants.js'

export const qualifyNodes = {

  // QUALIFY AFVALLEN
  qualify_afvallen: {
    id: 'qualify_afvallen',
    phase: 'qualify',
    label: 'Qualify - Afvallen',
    message: {
      variants: qualifyAfvallenVariants // 7 real messages
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

  // QUALIFY SPIEREN
  qualify_spieren: {
    id: 'qualify_spieren',
    phase: 'qualify',
    label: 'Qualify - Spieren',
    message: {
      variants: qualifySpierenVariants // 7 real messages
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

  // QUALIFY SPORT
  qualify_sport: {
    id: 'qualify_sport',
    phase: 'qualify',
    label: 'Qualify - Sport',
    message: {
      variants: qualifySportVariants // 5 real messages
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

  // QUALIFY VAST (Pain detected!)
  qualify_vast: {
    id: 'qualify_vast',
    phase: 'qualify',
    label: 'Qualify - Vast / Pain',
    message: {
      variants: qualifyVastVariants // 5 real messages
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

  // QUALIFY GEVOEL (Not tracking)
  qualify_gevoel: {
    id: 'qualify_gevoel',
    phase: 'qualify',
    label: 'Qualify - Op gevoel',
    message: {
      variants: qualifyGevoelVariants // 4 real messages
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

  // QUALIFY TRACKT (Already tracking!)
  qualify_trackt: {
    id: 'qualify_trackt',
    phase: 'qualify',
    label: 'Qualify - Trackt al',
    message: {
      variants: qualifyTracktVariants // 4 real messages
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

  // PAIN DEEPEN (High pain → Call push!)
  pain_deepen: {
    id: 'pain_deepen',
    phase: 'qualify',
    label: 'Pain Deepen',
    message: {
      variants: painDeepenVariants // 5 real messages
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
  }

}
