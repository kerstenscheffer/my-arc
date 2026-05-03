// src/modules/lead-management/components/DMBibleModal.jsx
// VERSION 4.0 - KERSTEN'S NATURAL VOICE
// Jo man taal, emoji's, logische vragen

import { useState } from 'react'
import { Flame, X, Copy, Check } from 'lucide-react'

// GOLD THEME
const GOLD = {
  primary: '#D4AF37',
  light: '#FFD700',
  dark: '#B8860B',
  glow: 'rgba(212, 175, 55, 0.4)',
  border: 'rgba(212, 175, 55, 0.3)',
  bg: 'rgba(212, 175, 55, 0.08)',
  bgStrong: 'rgba(212, 175, 55, 0.15)'
}

// ===== ALL MESSAGES =====
const CATEGORIES = [
  {
    id: 'eerste-dikker',
    label: '🎯 Eerste: Vet Verlies',
    subtitle: 'Dikker persoon',
    color: '#ef4444',
    messages: [
      // OPENING 1 - Follow-back
      { text: 'Jo man! Ik zag dat je mij ook was gaan volgen, thanks daarvoor! Waar ligt jouw interesse meer, afvallen of juist fitter worden?', tag: 'Follow-back' },
      
      // OPENING 2 - Profiel observatie
      { text: 'Jo! Ik kwam je profiel een paar dagen geleden tegen en zag dat je ook bezig bent met gezonder leven. Hoe lang ben je al bezig met je transformatie?', tag: 'Profiel observatie' },
      
      // OPENING 3 - Compliment + Vraag VARIATIES
      { text: 'Jo man! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Ben je ergens specifiek voor aan het trainen?', tag: 'Compliment 1A' },
      { text: 'Jo man! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Waar werk je naartoe qua doel?', tag: 'Compliment 1B' },
      { text: 'Jo man! Ik zag dat je ook aan het sporten was, lekker bezig! 💪 Wat is je grootste uitdaging op dit moment?', tag: 'Compliment 1C' },
      
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Ben je ergens specifiek voor aan het trainen?', tag: 'Compliment 2A' },
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Waar werk je naartoe qua doel?', tag: 'Compliment 2B' },
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Wat is je grootste uitdaging op dit moment?', tag: 'Compliment 2C' },
      
      { text: 'Jo man! Respect dat je aan jezelf werkt! 💪 Ben je ergens specifiek voor aan het trainen?', tag: 'Compliment 3A' },
      { text: 'Jo man! Respect dat je aan jezelf werkt! 💪 Waar werk je naartoe qua doel?', tag: 'Compliment 3B' },
      { text: 'Jo man! Respect dat je aan jezelf werkt! 💪 Wat is je grootste uitdaging op dit moment?', tag: 'Compliment 3C' },
      
      { text: 'Jo! Ik zag je transformatie, echt sterk man! 🔥 Hoe lang ben je hier al mee bezig?', tag: 'Compliment 4A' },
      { text: 'Jo! Ik zag je transformatie, echt sterk man! 🔥 Waar werk je nu naartoe?', tag: 'Compliment 4B' },
      { text: 'Jo! Ik zag je transformatie, echt sterk man! 🔥 Wat is je volgende doel?', tag: 'Compliment 4C' },
      
      { text: 'Jo man! Vet dat je bezig bent met je gezondheid! 💪 Ben je ergens specifiek voor aan het trainen?', tag: 'Compliment 5A' },
      { text: 'Jo man! Vet dat je bezig bent met je gezondheid! 💪 Waar werk je naartoe qua doel?', tag: 'Compliment 5B' },
      { text: 'Jo man! Vet dat je bezig bent met je gezondheid! 💪 Wat is je grootste uitdaging op dit moment?', tag: 'Compliment 5C' },
      
      { text: 'Jo! Goed bezig man, respect! 🔥 Hoe lang train je al?', tag: 'Compliment 6A' },
      { text: 'Jo! Goed bezig man, respect! 🔥 Waar werk je naartoe?', tag: 'Compliment 6B' },
      { text: 'Jo! Goed bezig man, respect! 🔥 Wat wil je uiteindelijk bereiken?', tag: 'Compliment 6C' },
      
      // OPENING 4 - Fun fact
      { text: 'Jo naam! Ik zag dat je ook bezig bent met je gezondheid. Wist je dat 80% van vet verlies in de keuken gebeurt en niet in de gym? Wil je weten welke simpele aanpassing het meeste verschil maakt?', tag: 'Fun fact' }
    ]
  },
  {
    id: 'eerste-dunner',
    label: '🎯 Eerste: Massa',
    subtitle: 'Dunner persoon',
    color: '#8b5cf6',
    messages: [
      // OPENING 1 - Follow-back
      { text: 'Jo man! Ik zag dat je mij ook was gaan volgen, thanks! Waar ligt jouw interesse meer, sterker worden of meer massa opbouwen?', tag: 'Follow-back' },
      
      // OPENING 2 - Profiel observatie
      { text: 'Jo! Ik kwam je profiel tegen en zag dat je ook aan het trainen bent. Hoe lang ben je al bezig met krachttraining?', tag: 'Profiel observatie' },
      
      // OPENING 3 - Compliment + Vraag VARIATIES
      { text: 'Jo man! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Waar werk je naartoe, bulken of meer kracht?', tag: 'Compliment 1A' },
      { text: 'Jo man! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Hoe lang train je al?', tag: 'Compliment 1B' },
      { text: 'Jo man! Ik zag dat je ook aan het trainen was, lekker bezig! 💪 Volg je een specifiek schema?', tag: 'Compliment 1C' },
      
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Waar werk je naartoe, bulken of meer kracht?', tag: 'Compliment 2A' },
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Hoe lang train je al?', tag: 'Compliment 2B' },
      { text: 'Jo! Mooi om te zien dat je bezig bent man! 🔥 Volg je een specifiek schema?', tag: 'Compliment 2C' },
      
      { text: 'Jo man! Gave gains bro! 💪 Waar werk je naartoe, bulken of meer kracht?', tag: 'Compliment 3A' },
      { text: 'Jo man! Gave gains bro! 💪 Hoe lang train je al?', tag: 'Compliment 3B' },
      { text: 'Jo man! Gave gains bro! 💪 Volg je een specifiek schema?', tag: 'Compliment 3C' },
      
      { text: 'Jo! Respect voor de dedication man! 🔥 Waar werk je naartoe qua doel?', tag: 'Compliment 4A' },
      { text: 'Jo! Respect voor de dedication man! 🔥 Hoe lang ben je al serieus bezig?', tag: 'Compliment 4B' },
      { text: 'Jo! Respect voor de dedication man! 🔥 Wat is je grootste struggle op dit moment?', tag: 'Compliment 4C' },
      
      { text: 'Jo man! Sterk dat je zo consistent bent! 💪 Wat is je doel, bulken of kracht?', tag: 'Compliment 5A' },
      { text: 'Jo man! Sterk dat je zo consistent bent! 💪 Hoe lang ben je hier al mee bezig?', tag: 'Compliment 5B' },
      { text: 'Jo man! Sterk dat je zo consistent bent! 💪 Waar loop je tegenaan?', tag: 'Compliment 5C' },
      
      { text: 'Jo! Lekker bezig man! 🔥 Ben je aan het bulken of cutten?', tag: 'Compliment 6A' },
      { text: 'Jo! Lekker bezig man! 🔥 Hoeveel jaar train je al?', tag: 'Compliment 6B' },
      { text: 'Jo! Lekker bezig man! 🔥 Wat wil je uiteindelijk bereiken?', tag: 'Compliment 6C' },
      
      // OPENING 4 - Fun fact
      { text: 'Jo naam! Ik zag dat je ook traint. Wist je dat de meeste mensen moeite hebben met spieropbouw omdat ze simpelweg te weinig calorieën eten? Wil je weten hoe je dit makkelijk oplost?', tag: 'Fun fact' }
    ]
  },
  {
    id: 'eerste-sporter',
    label: '🎯 Eerste: Sporter',
    subtitle: 'Voetballer etc.',
    color: '#f59e0b',
    messages: [
      // OPENING 1 - Follow-back
      { text: 'Jo man! Ik zag dat je mij ook was gaan volgen, thanks! Ben je vooral bezig met voetbal of train je ook daarbuiten?', tag: 'Follow-back' },
      
      // OPENING 2 - Profiel observatie
      { text: 'Jo! Ik kwam je profiel tegen en zag dat je voetbalt. Hoe lang speel je al en op welk niveau?', tag: 'Profiel observatie' },
      
      // OPENING 3 - Compliment + Vraag VARIATIES
      { text: 'Jo man! Ik zag dat je voetbalt, vet! ⚽ Doe je ook aan krachttraining naast voetbal?', tag: 'Compliment 1A' },
      { text: 'Jo man! Ik zag dat je voetbalt, vet! ⚽ Wat is je positie?', tag: 'Compliment 1B' },
      { text: 'Jo man! Ik zag dat je voetbalt, vet! ⚽ Let je ook op je voeding?', tag: 'Compliment 1C' },
      
      { text: 'Jo! Nice dat je serieus met je sport bezig bent man! 🔥 Train je ook in de gym naast voetbal?', tag: 'Compliment 2A' },
      { text: 'Jo! Nice dat je serieus met je sport bezig bent man! 🔥 Op welk niveau speel je?', tag: 'Compliment 2B' },
      { text: 'Jo! Nice dat je serieus met je sport bezig bent man! 🔥 Hoe vaak train je per week?', tag: 'Compliment 2C' },
      
      { text: 'Jo man! Gave skills! ⚽ Doe je naast voetbal ook aan fitness?', tag: 'Compliment 3A' },
      { text: 'Jo man! Gave skills! ⚽ Wat is je doel met voetbal?', tag: 'Compliment 3B' },
      { text: 'Jo man! Gave skills! ⚽ Hoe lang speel je al?', tag: 'Compliment 3C' },
      
      { text: 'Jo! Respect voor de toewijding man! 💪 Train je ook op kracht naast je sport?', tag: 'Compliment 4A' },
      { text: 'Jo! Respect voor de toewijding man! 💪 Waar wil je naartoe met voetbal?', tag: 'Compliment 4B' },
      { text: 'Jo! Respect voor de toewijding man! 💪 Hoe vaak train je per week?', tag: 'Compliment 4C' },
      
      { text: 'Jo man! Lekker bezig met voetbal! ⚽ Doe je ook krachttraining?', tag: 'Compliment 5A' },
      { text: 'Jo man! Lekker bezig met voetbal! ⚽ Op welk niveau speel je?', tag: 'Compliment 5B' },
      { text: 'Jo man! Lekker bezig met voetbal! ⚽ Let je ook op voeding?', tag: 'Compliment 5C' },
      
      { text: 'Jo! Mooi om te zien dat je zo actief bent man! 🔥 Ben je naast voetbal ook bezig met fitness?', tag: 'Compliment 6A' },
      { text: 'Jo! Mooi om te zien dat je zo actief bent man! 🔥 Wat is je doel?', tag: 'Compliment 6B' },
      { text: 'Jo! Mooi om te zien dat je zo actief bent man! 🔥 Waar werk je naartoe?', tag: 'Compliment 6C' },
      
      // OPENING 4 - Fun fact
      { text: 'Jo naam! Ik zag dat je voetbalt. Wist je dat de juiste voeding en krachttraining je prestaties op het veld flink kunnen verbeteren? Wil je weten wat topatleten anders doen?', tag: 'Fun fact' }
    ]
  },
  {
    id: 'eerste-neutral',
    label: '🎯 Eerste: Neutral',
    subtitle: 'Niks af te lezen',
    color: '#06b6d4',
    messages: [
      // OPENING 1 - Follow-back
      { text: 'Jo man! Ik zag dat je mij ook was gaan volgen, thanks! Wat trok je aandacht, de trainingen of de voeding content?', tag: 'Follow-back' },
      
      // OPENING 2 - Profiel observatie
      { text: 'Jo! Ik kwam je profiel tegen en werd nieuwsgierig. Ben je naast [activiteit] ook bezig met fitness?', tag: 'Profiel observatie' },
      
      // OPENING 3 - Compliment + Vraag VARIATIES
      { text: 'Jo man! Leuk profiel! Ik zag dat je ook bezig was met sporten, ben je ergens voor aan het trainen?', tag: 'Compliment 1A' },
      { text: 'Jo man! Leuk profiel! Ben je bezig met specifieke fitness doelen?', tag: 'Compliment 1B' },
      { text: 'Jo man! Leuk profiel! Waar ligt jouw interesse, training of voeding?', tag: 'Compliment 1C' },
      
      { text: 'Jo! Gave feed man! 🔥 Ben je ook bezig met fitness?', tag: 'Compliment 2A' },
      { text: 'Jo! Gave feed man! 🔥 Train je zelf ook?', tag: 'Compliment 2B' },
      { text: 'Jo! Gave feed man! 🔥 Waar ben je mee bezig qua gezondheid?', tag: 'Compliment 2C' },
      
      { text: 'Jo man! Nice content! 💪 Ben je bezig met sporten?', tag: 'Compliment 3A' },
      { text: 'Jo man! Nice content! 💪 Wat zijn je doelen qua fitness?', tag: 'Compliment 3B' },
      { text: 'Jo man! Nice content! 💪 Waar ligt jouw focus, training of voeding?', tag: 'Compliment 3C' },
      
      { text: 'Jo! Leuke vibe man! 🔥 Ben je ook bezig met fitness?', tag: 'Compliment 4A' },
      { text: 'Jo! Leuke vibe man! 🔥 Train je zelf ook?', tag: 'Compliment 4B' },
      { text: 'Jo! Leuke vibe man! 🔥 Wat houdt je bezig qua gezondheid?', tag: 'Compliment 4C' },
      
      { text: 'Jo man! Cool profiel! 💪 Ben je naast dit ook bezig met sporten?', tag: 'Compliment 5A' },
      { text: 'Jo man! Cool profiel! 💪 Heb je fitness doelen?', tag: 'Compliment 5B' },
      { text: 'Jo man! Cool profiel! 💪 Waar ben je mee bezig qua health?', tag: 'Compliment 5C' },
      
      { text: 'Jo! Interessante feed! 🔥 Ben je ook bezig met fitness?', tag: 'Compliment 6A' },
      { text: 'Jo! Interessante feed! 🔥 Wat zijn je doelen?', tag: 'Compliment 6B' },
      { text: 'Jo! Interessante feed! 🔥 Train je zelf ook?', tag: 'Compliment 6C' },
      
      // OPENING 4 - Fun fact
      { text: 'Jo naam! Wist je dat 90% van de mensen hun fitness doelen niet haalt door één simpele fout? Wil je weten welke en hoe je hem voorkomt?', tag: 'Fun fact' }
    ]
  },
  {
    id: 'openers',
    label: '🚀 Openers Algemeen',
    color: '#10b981',
    messages: [
      { text: 'Jo naam, ik zag dat je mij ook was gaan volgen. Thanks daarvoor! Waar ligt bij jou de interesse meer, training of voeding?', tag: 'Follow back' },
      { text: 'Jo naam, snelle tip: de meeste mannen laten spiergroei liggen door één fout in hun calorieën. Wil je weten welke?', tag: 'Curiosity hook' },
      { text: 'Jo naam, wist je dat 90% van de mannen te weinig eet om écht spieren te bouwen? Herkenbaar?', tag: 'Stat hook' },
      { text: 'Jo naam, ik zie dat je serieus bezig bent met fitness. Snelle vraag: train je met een specifiek schema of meer op gevoel?', tag: 'Direct vraag' },
      { text: 'Jo naam, zag je story! Ziet er goed uit 🔥 Ben je bezig met een specifiek doel?', tag: 'Story reply' },
      { text: 'Jo naam, ik help mannen met hun gains. Zag dat jij ook bezig bent. Wat is je grootste struggle op dit moment?', tag: 'Positionering' }
    ]
  },
  {
    id: 'followup-1',
    label: '👋 Follow-up Dag 1-4',
    subtitle: 'Soft check + waarde',
    color: '#3b82f6',
    messages: [
      { text: 'Jo naam, had je mijn berichtje nog gezien? 🙂', tag: 'Dag 1-2 Soft' },
      { text: 'Jo naam, ik was benieuwd of je mijn bericht had gelezen?', tag: 'Dag 1-2 Direct' },
      { text: 'Jo naam, weet niet of je mijn berichtje had gezien, maar hier is een snelle tip: de meeste mannen eten te weinig eiwitten voor hun doel. Zit jij op 2 gram per kg lichaamsgewicht?', tag: 'Dag 3-4 Waarde' },
      { text: 'Jo naam, nog even dit: veel mannen trainen hard maar zien weinig resultaat omdat ze hun calorieën niet tracken. Ken je dat?', tag: 'Dag 3-4 Waarde v2' },
      { text: 'Jo naam, mocht je het gemist hebben - ik had je een vraag gestuurd. Laat even weten als je tijd hebt!', tag: 'Dag 3-4 Reminder' },
      { text: 'Jo naam, trouwens: weet je hoeveel calorieën jij nodig hebt om te groeien? De meeste mannen gokken en laten daardoor gains liggen.', tag: 'Dag 3-4 TDEE' }
    ]
  },
  {
    id: 'followup-2',
    label: '🔄 Follow-up Dag 7-14',
    subtitle: 'Nieuwe angle + social proof',
    color: '#8b5cf6',
    messages: [
      { text: 'Jo naam, andere vraag: loop jij soms tegen een plateau aan met je training? Veel mannen in jouw situatie hebben dat.', tag: 'Dag 7 Plateau' },
      { text: 'Jo naam, wat is eigenlijk op dit moment je grootste struggle met fitness? Training, voeding, of consistentie?', tag: 'Dag 7 Open vraag' },
      { text: 'Jo naam, toevallig: ik hielp laatst iemand met exact dezelfde situatie. Hij ging van 70 naar 80kg lean in 4 maanden. Benieuwd hoe?', tag: 'Dag 10 Social proof' },
      { text: 'Jo naam, ik werk met mannen die serieus willen bouwen. Eentje kreeg laatst 6kg spiermassa erbij in 12 weken. Zou dat wat voor jou zijn?', tag: 'Dag 10 Case study' },
      { text: 'Jo naam, ik ga eerlijk zijn: ik stuur je dit omdat ik denk dat ik je écht kan helpen met je fitness doelen. Heb je interesse om te horen hoe?', tag: 'Dag 14 Direct' },
      { text: 'Jo naam, ik hou het kort: ik help mannen zoals jij hun droomlichaam bouwen. Ja of nee - is dat iets waar je voor open staat?', tag: 'Dag 14 Polariserend' }
    ]
  },
  {
    id: 'followup-3',
    label: '👻 Follow-up Dag 21+',
    subtitle: 'Break-up sequence',
    color: '#6b7280',
    messages: [
      { text: 'Jo naam, ik snap dat je druk bent, geen probleem. Mocht je ooit serieus willen kijken naar je fitness, dan weet je me te vinden!', tag: 'Dag 21 Soft exit' },
      { text: 'Jo naam, laatste tip van mij: focus op progressieve overload en een calorie surplus. Dat zijn de basics die 90% van de mannen mist. Succes! 💪', tag: 'Dag 30 Final value' },
      { text: 'Jo naam, ik ga je even uit mijn lijst halen zodat ik je niet blijf storen. Mocht je ooit hulp willen, stuur gerust een DM. Succes met alles! 🙏', tag: 'Dag 45 Break-up' },
      { text: 'Jo naam, dit is mijn laatste berichtje. Ik wens je veel succes met je fitness journey. Als je ooit besluit dat je er serieus mee aan de slag wilt, je weet me te vinden. ✌️', tag: 'Final message' }
    ]
  },
  {
    id: 'replies',
    label: '💬 Reacties',
    color: '#f59e0b',
    messages: [
      { text: 'Ah dat is kut man. Hoe lang loop je hier al tegenaan?', tag: 'Hij: "Ik loop vast"' },
      { text: 'Dat hoor ik vaker. Wat is je hoofddoel eigenlijk - afvallen, spieren bouwen, of allebei?', tag: 'Hij: "Weet niet wat ik moet eten"' },
      { text: 'Nice! Hoeveel weeg je nu en wat is je doel qua gewicht?', tag: 'Hij: "Wil spieren bouwen"' },
      { text: 'Oké, en werkt dat voor je? Zie je de resultaten die je wilt?', tag: 'Hij: "Doe het op gevoel"' },
      { text: 'Snap ik. Maar eerlijke vraag: komt er ooit een perfect moment? Of is het altijd druk?', tag: 'Hij: "Heb geen tijd"' },
      { text: 'Hm, maar wil je over een jaar nog steeds hetzelfde zeggen? Of wil je dan resultaat zien?', tag: 'Hij: "Misschien later"' },
      { text: 'Oké, maar dan bouw je waarschijnlijk meer vet dan spieren. Weet je wat je TDEE is?', tag: 'Hij: "Ik prop gewoon"' },
      { text: 'Begrijpelijk, maar je moet eigenlijk kiezen. Welke wil je eerst aanpakken?', tag: 'Hij: "Afvallen én bouwen"' },
      { text: 'Interessant. Hoe lang ben je hier al mee bezig?', tag: 'Doorvragen' },
      { text: 'Oké, en wat heb je tot nu toe al geprobeerd?', tag: 'Doorvragen v2' },
      { text: 'Even eerlijk: als je zo doorgaat zoals nu, waar sta je dan over een jaar?', tag: 'Confronterend' },
      { text: 'Snap ik. Maar wat houdt je eigenlijk tegen om er nu mee aan de slag te gaan?', tag: 'Bezwaar openen' }
    ]
  },
  {
    id: 'call-push',
    label: '📞 Call Pushen',
    color: '#10b981',
    messages: [
      { text: 'Dit is precies waar ik mensen mee help. Heb je vandaag of morgen 15 minuutjes? Dan kan ik je precies vertellen wat je moet doen.', tag: 'Algemeen' },
      { text: 'Weet je wat, laten we even bellen. Dan kan ik je situatie beter begrijpen en kijken of ik je kan helpen. Heb je deze week ergens 15 min?', tag: 'Soft approach' },
      { text: 'Ik denk serieus dat ik je hiermee kan helpen. Wanneer zou je een kwartiertje hebben voor een snelle call?', tag: 'Direct' },
      { text: 'Laten we gewoon even bellen, dan leg ik uit hoe ik dit aanpak. Vandaag of morgen - wat werkt voor jou?', tag: 'Assumptive' },
      { text: 'Stuur me je nummer, dan bel ik je morgen even. 15 minuten max, dan weet je precies waar je aan toe bent.', tag: 'Nummer vragen' },
      { text: 'Ik kan je hier uren over typen, maar een call van 15 min is veel effectiever. Ben je daar voor open?', tag: 'Logisch' }
    ]
  },
  {
    id: 'call-confirm',
    label: '✅ Call Bevestigen',
    color: '#22c55e',
    messages: [
      { text: 'Top! Plan hem hier even in dan heb je gelijk een reminder: [CALENDLY LINK]', tag: 'Calendly' },
      { text: 'Perfect! Stuur even je nummer, dan bel ik je [DAG] om [TIJD].', tag: 'Nummer vragen' },
      { text: 'Genoteerd! Ik bel je [DAG] om [TIJD]. Zorg dat je even rustig kunt praten. Tot dan! 💪', tag: 'Bevestiging' },
      { text: 'Done! Check je DM\'s [DAG] om [TIJD], dan stuur ik een belverzoek via Instagram.', tag: 'IG Call' },
      { text: 'Jo naam, even een reminder: we bellen zo om [TIJD]. Ben je er klaar voor?', tag: 'Reminder' },
      { text: 'Jo naam, we hadden een call staan maar ik kreeg je niet te pakken. Alles goed? Laat even weten wanneer het beter uitkomt!', tag: 'No-show' },
      { text: 'Jo naam, ik zie dat je de call nog niet had ingepland. Nog steeds interesse? Laat even weten!', tag: 'Geen inplanning' }
    ]
  },
  {
    id: 'objections',
    label: '🛡️ Bezwaren',
    color: '#ef4444',
    messages: [
      { text: 'Snap ik helemaal. Waar wil je specifiek over nadenken? Dan kan ik je misschien wat meer info geven.', tag: '"Moet erover nadenken"' },
      { text: 'Begrijpelijk, maar 15 minuten is minder dan één Netflix aflevering. Kun je dat echt niet vinden?', tag: '"Geen tijd voor call"' },
      { text: 'Respect dat je het zelf wilt proberen. Hoe lang doe je dat al? En hoe gaat het tot nu toe?', tag: '"Probeer eerst zelf"' },
      { text: 'Oké, maar wees eerlijk: wat is er over 3 maanden anders waardoor je het dan wél zou doen?', tag: '"Later misschien"' },
      { text: 'Snap ik. Maar even eerlijk: wat kost het je om nog een jaar hetzelfde te blijven? Geen resultaat, geen vooruitgang?', tag: '"Te duur"' },
      { text: 'Fair enough. Wat zou voor jou wél een redelijke investering zijn in je gezondheid?', tag: 'Prijs doorvragen' },
      { text: 'Ik snap het. Maar is "later" niet gewoon een nette manier om "nooit" te zeggen?', tag: 'Confronteren' },
      { text: 'Geen probleem. Wat zou je nodig hebben om wél een beslissing te kunnen maken?', tag: 'Twijfel openen' },
      { text: 'Helder. Maar stel dat geld geen issue was - zou je het dan wel doen?', tag: 'Geld isoleren' }
    ]
  },
  {
    id: 'value',
    label: '💎 Waarde Tips',
    color: '#06b6d4',
    messages: [
      { text: 'Trouwens, snelle tip: de meeste mannen eten te weinig eiwitten. Zit jij op minimaal 2 gram per kg lichaamsgewicht? Dat is de basis voor spiergroei.', tag: 'Eiwit tip' },
      { text: 'Wist je dat je TDEE (dagelijkse caloriebehoefte) bepaalt of je aankomt of afvalt? Niet hoeveel je traint. Ken je die van jou?', tag: 'TDEE tip' },
      { text: 'Fun fact: slaap is net zo belangrijk als training voor je gains. 7-9 uur per nacht = optimale spiergroei en herstel.', tag: 'Slaap tip' },
      { text: 'Grootste fout die ik zie: mannen willen te snel te zwaar trainen. Progressive overload (beetje meer per week) werkt beter dan ego lifting.', tag: 'Training tip' },
      { text: 'Pro tip: track je workouts. Serieus. Wat je niet meet, kun je niet verbeteren. Simpel spreadsheetje is genoeg.', tag: 'Tracking tip' },
      { text: 'De waarheid: de meeste transformaties falen niet door slechte workouts, maar door gebrek aan consistentie. 80% opdagen is belangrijker dan het perfecte schema.', tag: 'Consistentie tip' },
      { text: 'Snelle reality check: als je niet groeit, eet je te weinig. Punt. De meeste "hardgainers" zijn gewoon "undereaters".', tag: 'Hardgainer tip' }
    ]
  }
]

export default function DMBibleModal({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('eerste-dikker')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory)
  
  const filteredMessages = searchTerm 
    ? CATEGORIES.flatMap(cat => 
        cat.messages
          .filter(m => 
            m.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map(m => ({ ...m, category: cat.label, color: cat.color }))
      )
    : currentCategory?.messages || []

  // ===== FLOATING BUTTON =====
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: isMobile ? '100px' : '32px',
          right: isMobile ? '16px' : '32px',
          width: isMobile ? '52px' : '60px',
          height: isMobile ? '52px' : '60px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${GOLD.light} 0%, ${GOLD.primary} 50%, ${GOLD.dark} 100%)`,
          border: `2px solid ${GOLD.light}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px ${GOLD.glow}, 0 0 30px ${GOLD.glow}`,
          zIndex: 9999,
          transition: 'all 0.3s ease',
          animation: 'pulse-gold 2s infinite'
        }}
      >
        <Flame size={isMobile ? 26 : 30} color="#000" />
        
        <style>{`
          @keyframes pulse-gold {
            0%, 100% { box-shadow: 0 4px 20px ${GOLD.glow}, 0 0 30px ${GOLD.glow}; }
            50% { box-shadow: 0 4px 30px ${GOLD.glow}, 0 0 50px ${GOLD.glow}; }
          }
        `}</style>
      </button>
    )
  }

  // ===== MODAL =====
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: isMobile ? '0.5rem' : '1rem'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        style={{
          width: isMobile ? '100%' : '900px',
          maxWidth: '100%',
          height: isMobile ? '95vh' : '85vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
          border: `2px solid ${GOLD.border}`,
          borderRadius: isMobile ? '12px' : '16px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 0 50px ${GOLD.glow}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0.75rem' : '1rem 1.25rem',
          borderBottom: `1px solid ${GOLD.border}`,
          background: GOLD.bg,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Flame size={24} color={GOLD.light} />
            <div>
              <h2 style={{ 
                fontSize: isMobile ? '1rem' : '1.25rem', 
                fontWeight: '800', 
                color: GOLD.light, 
                margin: 0 
              }}>
                DM COPY CENTER
              </h2>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Klik om te kopiëren → Plak in DM
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SEARCH */}
        <div style={{ 
          padding: isMobile ? '0.5rem 0.75rem' : '0.75rem 1rem',
          borderBottom: `1px solid ${GOLD.border}`,
          flexShrink: 0
        }}>
          <input
            type="text"
            placeholder="🔍 Zoek berichten..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'rgba(0,0,0,0.4)',
              border: `1px solid ${GOLD.border}`,
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        {/* MAIN CONTENT */}
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          {/* CATEGORY SIDEBAR */}
          <div style={{
            width: isMobile ? '100%' : '200px',
            borderRight: isMobile ? 'none' : `1px solid ${GOLD.border}`,
            borderBottom: isMobile ? `1px solid ${GOLD.border}` : 'none',
            overflow: isMobile ? 'auto' : 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: isMobile ? 'row' : 'column',
            gap: '2px',
            padding: '0.5rem',
            background: 'rgba(0,0,0,0.3)'
          }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id)
                  setSearchTerm('')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.75rem',
                  background: activeCategory === cat.id && !searchTerm
                    ? `${cat.color}22`
                    : 'transparent',
                  border: activeCategory === cat.id && !searchTerm
                    ? `1px solid ${cat.color}55`
                    : '1px solid transparent',
                  borderRadius: '6px',
                  color: activeCategory === cat.id && !searchTerm ? cat.color : 'rgba(255,255,255,0.6)',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  flex: isMobile ? '0 0 auto' : 'none'
                }}
              >
                <span>{cat.label}</span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  opacity: 0.5,
                  marginLeft: 'auto'
                }}>
                  {cat.messages.length}
                </span>
              </button>
            ))}
          </div>

          {/* MESSAGES LIST */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {/* Category header */}
            {!searchTerm && currentCategory && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                paddingBottom: '0.5rem',
                borderBottom: `1px solid ${currentCategory.color}33`
              }}>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  color: currentCategory.color 
                }}>
                  {currentCategory.label}
                </span>
                {currentCategory.subtitle && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {currentCategory.subtitle}
                  </span>
                )}
              </div>
            )}

            {/* Search results header */}
            {searchTerm && (
              <div style={{
                marginBottom: '0.75rem',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.5)'
              }}>
                {filteredMessages.length} resultaten voor "{searchTerm}"
              </div>
            )}

            {/* Messages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {filteredMessages.map((msg, i) => {
                const index = searchTerm ? `search-${i}` : `${activeCategory}-${i}`
                const color = searchTerm ? msg.color : currentCategory?.color
                const isCopied = copiedIndex === index

                return (
                  <div
                    key={index}
                    onClick={() => copyToClipboard(msg.text, index)}
                    style={{
                      display: 'flex',
                      alignItems: 'stretch',
                      background: isCopied 
                        ? `${GOLD.primary}22`
                        : 'rgba(255,255,255,0.03)',
                      border: isCopied
                        ? `1px solid ${GOLD.primary}`
                        : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Color bar */}
                    <div style={{
                      width: '4px',
                      background: color,
                      flexShrink: 0
                    }} />

                    {/* Content */}
                    <div style={{ 
                      flex: 1, 
                      padding: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      {/* Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          color: color,
                          background: `${color}15`,
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {msg.tag}
                        </span>
                        {searchTerm && msg.category && (
                          <span style={{
                            fontSize: '0.6rem',
                            color: 'rgba(255,255,255,0.3)'
                          }}>
                            {msg.category}
                          </span>
                        )}
                      </div>

                      {/* Message text */}
                      <div style={{
                        fontSize: isMobile ? '0.85rem' : '0.9rem',
                        color: 'rgba(255,255,255,0.9)',
                        lineHeight: 1.4
                      }}>
                        {msg.text}
                      </div>
                    </div>

                    {/* Copy indicator */}
                    <div style={{
                      width: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isCopied ? GOLD.primary : 'rgba(255,255,255,0.02)',
                      borderLeft: '1px solid rgba(255,255,255,0.05)',
                      transition: 'all 0.15s ease'
                    }}>
                      {isCopied ? (
                        <Check size={20} color="#000" />
                      ) : (
                        <Copy size={18} color="rgba(255,255,255,0.3)" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {filteredMessages.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Geen berichten gevonden
              </div>
            )}
          </div>
        </div>

        {/* FOOTER STATS */}
        <div style={{
          padding: '0.5rem 1rem',
          borderTop: `1px solid ${GOLD.border}`,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.4)',
          flexShrink: 0
        }}>
          <span>
            {CATEGORIES.reduce((acc, cat) => acc + cat.messages.length, 0)} berichten in {CATEGORIES.length} categorieën
          </span>
          <span style={{ color: GOLD.primary }}>
            💡 Klik = Kopiëren
          </span>
        </div>
      </div>
    </div>
  )
}
