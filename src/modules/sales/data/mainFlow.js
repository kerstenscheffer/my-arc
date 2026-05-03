// src/modules/sales/data/mainFlow.js
// Main flow - Return point na objectie handling en close sequence

export const MAIN_FLOW = {
  // Start punt van objectie training
  priceOffer: {
    text: 'Super, het totale pakket kost 1050. Dat is maandelijks €175. Past dat voor jou?',
    context: 'Dit is waar de objectie komt'
  },
  
  // Return point na objectie handling
  returnAfterObjectie: {
    text: 'Ja toch? Laten we dan gewoon beginnen, en als het toch niks is kun je altijd terug op de 28 dagen geld terug garantie goed?',
    leadResponse: 'Ja isgoed man.',
    note: 'Hier keer je terug na ELKE objectie flow'
  },
  
  // Close sequence
  closeFlow: [
    {
      speaker: 'jij',
      text: 'Super man. Lukt betalen via ideal of heb je liever creditcard?'
    },
    {
      speaker: 'lead',
      text: 'Ideal isgoed.'
    },
    {
      speaker: 'jij',
      text: 'Top man, dan stuur ik je zo de link en dan ga ik alles in orde maken. Heb je deze week ergens tijd voor een call zodat we de aanpak en het plan even rustig kunnen doornemen?'
    },
    {
      speaker: 'lead',
      text: 'Ja vrijdag om 16:00'
    },
    {
      speaker: 'jij',
      text: 'Top doen we dan. Heb je ook een email adres en nummer voor mij?'
    },
    {
      speaker: 'lead',
      text: 'ja [email/nummer]'
    },
    {
      speaker: 'jij',
      text: 'Oke super. Dan stuur ik je zo direct de betaallink en dan spreek ik je vrijdag! Ik heb er zin in man.'
    },
    {
      speaker: 'lead',
      text: 'Top!'
    }
  ],
  
  // Success message
  success: {
    title: '🎉 SALE GESLOTEN!',
    message: 'Je hebt de objectie succesvol behandeld en de sale gesloten!',
    tips: [
      'Je keerde terug naar het main script',
      'Je gebruikte de garantie om laatste twijfel weg te nemen',
      'Je sloot af met duidelijke next steps'
    ]
  }
}

// Helper om volledige flow te krijgen
export const getCompleteFlow = (objectieFlow) => {
  return [
    // Start
    { speaker: 'system', text: MAIN_FLOW.priceOffer.text, type: 'start' },
    
    // Objectie flow
    ...objectieFlow.flow,
    
    // Return point
    { speaker: 'jij', text: objectieFlow.returnText || MAIN_FLOW.returnAfterObjectie.text, type: 'return' },
    { speaker: 'lead', text: MAIN_FLOW.returnAfterObjectie.leadResponse },
    
    // Close
    ...MAIN_FLOW.closeFlow.map(step => ({ ...step, type: 'close' })),
    
    // Success
    { speaker: 'system', text: MAIN_FLOW.success.title, type: 'success' }
  ]
}
