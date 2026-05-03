// src/modules/sales/data/personages.js
// Lead profielen voor Objectie Trainer
// Elk personage heeft unieke context uit het voorgesprek

export const PERSONAGES = {
  tim: {
    id: 'tim',
    naam: 'Tim',
    leeftijd: 26,
    emoji: '💼',
    
    // FASE 2 - DOEL
    doel: '8kg droog worden in 6 maanden',
    waarom: 'Wil er goed uitzien voor vakantie en meer zelfvertrouwen',
    
    // FASE 3 - STRUGGLES
    struggles: [
      'Werkt 60 uur per week als consultant',
      'Geen consistent schema',
      'Eet vaak ongezond door tijdgebrek',
      'Begint enthousiast maar valt snel terug'
    ],
    
    // FASE 3.2 - IMPACT
    impact: 'Voelt zich slap en ongezond, durft shirt niet uit op strand',
    
    // FASE 4 - CONSEQUENTIES
    consequenties: 'Blijft onzeker, mist vakantie moments, laag energieniveau op werk',
    
    // OBJECTIE
    primaryObjectie: 'tijd',
    objectieTekst: 'Ik heb eigenlijk niet genoeg tijd hiervoor',
    
    // PERSONALITY
    toon: 'Druk, zakelijk, wil efficiëntie',
    koopbereidheid: 'Hoog (als tijd-efficiënt is)'
  },
  
  mark: {
    id: 'mark',
    naam: 'Mark',
    leeftijd: 32,
    emoji: '🏋️',
    
    // FASE 2 - DOEL
    doel: '10kg spiermassa erbij in 6 maanden',
    waarom: 'Traint al 3 jaar maar zit op plateau, wil eindelijk doorbreken',
    
    // FASE 3 - STRUGGLES
    struggles: [
      'Zit al 2 jaar op hetzelfde gewicht',
      'Weet niet of voeding goed is',
      'Traint hard maar ziet geen progressie',
      'Gemotiveerd maar gefrustreerd'
    ],
    
    // FASE 3.2 - IMPACT
    impact: 'Voelt dat training zinloos is, verliest motivatie, twijfelt aan zichzelf',
    
    // FASE 4 - CONSEQUENTIES
    consequenties: 'Stopt misschien met fitness, blijft ontevreden met lichaam',
    
    // OBJECTIE
    primaryObjectie: 'geld',
    objectieTekst: 'Het is wel veel geld eigenlijk',
    
    // PERSONALITY
    toon: 'Gemotiveerd maar twijfelend, wil bewijs',
    koopbereidheid: 'Middel (zoekt zekerheid)'
  },
  
  jasper: {
    id: 'jasper',
    naam: 'Jasper',
    leeftijd: 28,
    emoji: '🤔',
    
    // FASE 2 - DOEL
    doel: '15kg afvallen in 6 maanden',
    waarom: 'Voelt zich ongezond, laag energieniveau, wil weer actief zijn',
    
    // FASE 3 - STRUGGLES
    struggles: [
      'Heeft al 5 keer geprobeerd af te vallen',
      'Valt altijd terug na 2-3 weken',
      'Weet niet wat goed/fout is',
      'Weinig zelfvertrouwen'
    ],
    
    // FASE 3.2 - IMPACT
    impact: 'Schaamt zich voor lichaam, vermijdt sociale situaties, laag zelfvertrouwen',
    
    // FASE 4 - CONSEQUENTIES
    consequenties: 'Blijft ongelukkig, gezondheidsrisicos, mist sociale momenten',
    
    // OBJECTIE
    primaryObjectie: 'nadenken',
    objectieTekst: 'Ik moet er nog even over nadenken',
    
    // PERSONALITY
    toon: 'Onzeker, twijfelaar, zoekt bevestiging',
    koopbereidheid: 'Laag (heeft veel reassurance nodig)'
  }
}

// Helper om personage op te halen
export const getPersonage = (id) => PERSONAGES[id]

// Helper om alle personages te krijgen
export const getAllPersonages = () => Object.values(PERSONAGES)
