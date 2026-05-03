// Opening Phase Nodes
// Links to REAL message variants from messageDatabase.js

import { dikkerVariants, dunnerVariants, sporterVariants, neutraalVariants } from '../variants/openingVariants.js'

export const openingNodes = {
  
  // START NODE - Profile Selection
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

  // OPENING DIKKER
  opening_dikker: {
    id: 'opening_dikker',
    phase: 'opening',
    label: 'Opening - Dikker',
    message: {
      variants: dikkerVariants // 8 real messages
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

  // OPENING DUNNER
  opening_dunner: {
    id: 'opening_dunner',
    phase: 'opening',
    label: 'Opening - Dunner',
    message: {
      variants: dunnerVariants // 8 real messages
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

  // OPENING SPORTER
  opening_sporter: {
    id: 'opening_sporter',
    phase: 'opening',
    label: 'Opening - Sporter',
    message: {
      variants: sporterVariants // 8 real messages
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

  // OPENING NEUTRAAL
  opening_neutraal: {
    id: 'opening_neutraal',
    phase: 'opening',
    label: 'Opening - Neutraal',
    message: {
      variants: neutraalVariants // 6 real messages
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
  }

}
