// FILE: src/modules/dm-conversation/data/variants/callAdminVariants.js
// MY ARC - Call Admin Variants
// All call administration messages from messageDatabase.js

export const callAdminBevestigingVariants = [
  { id: 'ca1', label: 'Calendly link', text: 'Top man! Als je hem hier even kunt inplannen dan komt hij in jouw agenda en die van mij: [CALENDLY LINK]' },
  { id: 'ca2', label: 'Mail reminder', text: 'Perfect man! Als je mij even je mail kunt geven, dan stuur ik je een automatische reminder. 💪' },
  { id: 'ca3', label: 'Directe tijd', text: 'Nice! Dan zet ik je in voor [DAG] om [TIJD]. Als je mij even je mail geeft, stuur ik je een reminder.' },
  { id: 'ca4', label: 'Instagram call', text: 'Top man! Check je DM\'s [DAG] om [TIJD], dan stuur ik een belverzoek via Instagram. Zorg dat je even rustig kunt praten!' },
  { id: 'ca5', label: 'Verwachting setting', text: 'Perfect! Zet het in je agenda voor [DAG] om [TIJD]. Zorg dat je 15 minuten hebt en ergens rustig kunt zitten. Tot dan! 💪' }
]

export const callAdminRemindersVariants = [
  { id: 'ca6', label: 'Dag van call', text: 'Heyy [naam]! Ik kijk ernaar uit om vanmiddag om [TIJD] je situatie te bespreken. Zie je dan! (Laat even weten of het je gaat lukken 💪)' },
  { id: 'ca7', label: 'Ochtend reminder', text: 'Heyy [naam]! Reminder dat we vanmiddag om [TIJD] bellen. Tot zo! 🤙' },
  { id: 'ca8', label: '1 uur voor', text: 'Heyy [naam]! Ik zag dat je het bericht wel had gelezen, maar niet had gereageerd. Kun je mij een uur van tevoren laten weten of het gaat lukken? Anders moet ik hem helaas afzeggen! 🤙' },
  { id: 'ca9', label: '30 min voor', text: 'Heyy [naam]! Over 30 minuten bellen we. Ben je er klaar voor?' },
  { id: 'ca10', label: 'Laatste check', text: 'Heyy [naam], ik heb niks gehoord. Ik ga ervan uit dat het niet doorgaat en zet hem af. Als je hem nog wilt doen, laat het snel even weten!' }
]

export const callAdminNoShowVariants = [
  { id: 'ca11', label: 'Gemist + curiosity', text: 'Heyy [naam], ik zie dat je de call had gemist. Is alles goed? Ik had 2 enorm goede oplossingen bedacht voor jouw probleem die ik je graag zou meegeven. Laat maar weten of je de call nog wilt verplaatsen. Anders succes verder!' },
  { id: 'ca12', label: 'Gemist + waarde', text: 'Heyy [naam]! Je hebt de call gemist. Ik had voor jou uitgewerkt wat je precies moet doen om [doel] te bereiken. Wil je hem nog verzetten? Laat het maar weten, anders laat ik het hierbij.' },
  { id: 'ca13', label: 'Geen Calendly', text: 'Heyy [naam], ik zie dat je de call nog niet had ingepland via de link. Heb je nog steeds interesse? Zo ja, plan hem snel in. Zo niet, laat het even weten dan stop ik met reminders.' },
  { id: 'ca14', label: 'Laatste kans', text: 'Heyy [naam], dit is de tweede keer dat je de call mist. Ik snap dat het druk kan zijn. Als je alsnog wilt, laat het weten. Anders laat ik het hierbij en wens ik je succes!' },
  { id: 'ca15', label: 'Clean closure', text: 'Heyy [naam], ik ga ervan uit dat je geen tijd hebt of geen interesse meer. Helemaal prima man. Als je ooit toch hulp wilt, je weet me te vinden. Succes! 💪' }
]

export const callAdminRescheduleVariants = [
  { id: 'ca16', label: 'Client vraagt', text: 'Geen probleem man! Wanneer zou het dan wel kunnen voor je?' },
  { id: 'ca17', label: 'Flexibel', text: 'Kan gebeuren man. Ik heb nog plek op [dag] om [tijd] of [dag] om [tijd]. Welke past beter?' },
  { id: 'ca18', label: 'Laatste kans', text: 'Oké snap ik. Dit is wel de laatste keer dat ik hem kan verzetten man. Wanneer weet je 100% zeker dat je tijd hebt?' },
  { id: 'ca19', label: 'Commitment check', text: 'Geen probleem. Maar even voor mij: ben je echt ready om dit aan te pakken? Of moet je nog even wachten? Wil je tijd niet verspillen.' }
]

export const callAdminLongSilenceVariants = [
  { id: 'ca20', label: 'Geboekt lang geleden', text: 'Heyy [naam]! We hadden een call staan voor [dag] om [tijd]. Klopt dat nog? Laat even weten!' },
  { id: 'ca21', label: 'Check interesse', text: 'Heyy [naam], we hadden een call gepland maar ik heb al een tijdje niks gehoord. Ben je er nog klaar voor? Laat het maar weten, anders haal ik je van de lijst.' },
  { id: 'ca22', label: 'Reconfirm + exit', text: 'Heyy [naam]! Call staat nog voor [dag]. Als het niet meer past, helemaal geen probleem. Laat het even weten dan stop ik met reminders.' }
]
