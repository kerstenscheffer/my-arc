// src/modules/lead-management/components/DMBibleModal.jsx
// VERSION 4.0 - KERSTEN'S NATURAL VOICE
// Jo man taal, emoji's, logische vragen

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../coach/ModalHost'
import { Flame, X, Copy, Check, GripHorizontal, Trash2, Plus, Eraser, Pencil, EyeOff, Eye, FolderPlus, MessageSquare } from 'lucide-react'

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

// Synthetic category id for the user's own draft messages. Treated specially
// in the render — instead of the templates list, we show a free-form editor +
// a history list backed by the dm_user_messages table.
const MY_NOTES_ID = '__my_notes__'

// Small icon-button style used in the sidebar for rename/delete/hide actions.
const iconBtn = (color) => ({
  width: 24, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)',
  color, cursor: 'pointer', touchAction: 'manipulation',
})

export default function DMBibleModal({ isMobile = false, db = null, coachId = null, triggerVariant = 'fab' }) {
  const modalHost = useModalHost()
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('eerste-dikker')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  // ── User-categories + my-notes + hidden built-ins ─────────────────────────
  // A "custom category" is just a user-named tab that holds notes in the
  // same dm_user_messages table — same writer/history UX as Mijn berichten,
  // but filtered by category_id. The default Mijn berichten is category_id
  // = null so legacy notes stay visible.
  const [myDraft, setMyDraft] = useState('')
  const [myNotes, setMyNotes] = useState([])         // ALL notes (every cat)
  const [customCategories, setCustomCategories] = useState([])
  const [hiddenBuiltins, setHiddenBuiltins] = useState(new Set())
  const [showHidden, setShowHidden] = useState(false)
  const [savingNote, setSavingNote] = useState(false)
  const [notesLoading, setNotesLoading] = useState(false)
  // Inline UI state
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [renamingCatId, setRenamingCatId] = useState(null)
  const [renamingCatName, setRenamingCatName] = useState('')

  // Active category id resolution:
  //   MY_NOTES_ID  → category_id IS NULL AND builtin_category IS NULL
  //   uuid-string  → category_id = that uuid (custom tab)
  //   built-in id  → builtin_category = that id (DB-backed since seeding)
  const activeCustomCatId = customCategories.find(c => c.id === activeCategory)?.id || null
  const activeBuiltinId = CATEGORIES.find(c => c.id === activeCategory)?.id || null
  // All tabs are now DB-backed and editable, so every tab gets the writer UI.
  const isUserNotesTab = true

  // Notes filtered to the currently active tab.
  const notesForActiveTab = activeBuiltinId
    ? myNotes.filter(n => n.builtin_category === activeBuiltinId)
    : activeCustomCatId
      ? myNotes.filter(n => n.category_id === activeCustomCatId)
      : myNotes.filter(n => !n.category_id && !n.builtin_category)

  // Inline edit-in-place state.
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [editingNoteText, setEditingNoteText] = useState('')

  const handleSaveEdit = async () => {
    if (!editingNoteId || !db?.supabase) return
    const text = editingNoteText.trim()
    if (!text) return
    const prev = myNotes
    setMyNotes(p => p.map(n => n.id === editingNoteId ? { ...n, text } : n))
    setEditingNoteId(null); setEditingNoteText('')
    try {
      const { error } = await db.supabase
        .from('dm_user_messages')
        .update({ text, updated_at: new Date().toISOString() })
        .eq('id', editingNoteId)
      if (error) throw error
    } catch (e) {
      console.error('edit dm note failed:', e)
      setMyNotes(prev)
    }
  }

  // One-time seed: if the coach has zero built-in messages, copy the
  // hardcoded CATEGORIES into the DB. After this, the user owns and can
  // edit/delete/add to every built-in tab.
  const seedBuiltinsIfNeeded = useCallback(async () => {
    if (!db?.supabase || !coachId) return false
    const { count } = await db.supabase
      .from('dm_user_messages')
      .select('id', { count: 'exact', head: true })
      .eq('coach_id', coachId)
      .not('builtin_category', 'is', null)
    if ((count || 0) > 0) return false
    const rows = []
    CATEGORIES.forEach(cat => {
      cat.messages.forEach(m => {
        rows.push({
          coach_id: coachId,
          builtin_category: cat.id,
          tag: m.tag || null,
          text: m.text,
        })
      })
    })
    if (rows.length === 0) return false
    const { error } = await db.supabase.from('dm_user_messages').insert(rows)
    if (error) { console.error('seed builtins failed:', error); return false }
    console.log(`[DM-BIBLE] Seeded ${rows.length} built-in messages for coach.`)
    return true
  }, [db, coachId])

  const loadAllUserData = useCallback(async () => {
    if (!db?.supabase || !coachId) return
    setNotesLoading(true)
    try {
      await seedBuiltinsIfNeeded()
      const [{ data: notes }, { data: cats }, { data: hidden }] = await Promise.all([
        db.supabase.from('dm_user_messages')
          .select('*').eq('coach_id', coachId).is('deleted_at', null)
          .order('created_at', { ascending: true }).limit(1000),
        db.supabase.from('dm_categories')
          .select('*').eq('coach_id', coachId).is('deleted_at', null)
          .order('position', { ascending: true }).order('created_at', { ascending: true }),
        db.supabase.from('dm_hidden_builtins')
          .select('builtin_id').eq('coach_id', coachId),
      ])
      setMyNotes(notes || [])
      setCustomCategories(cats || [])
      setHiddenBuiltins(new Set((hidden || []).map(h => h.builtin_id)))
    } catch (e) {
      console.error('load dm user data failed:', e)
    } finally {
      setNotesLoading(false)
    }
  }, [db, coachId, seedBuiltinsIfNeeded])

  // Load everything when the modal opens (one round-trip). Refresh when the
  // active user-tab changes so a freshly created tab is selectable.
  useEffect(() => {
    if (isOpen) loadAllUserData()
  }, [isOpen, loadAllUserData])

  const handleSaveNote = async () => {
    const text = myDraft.trim()
    if (!text || !db?.supabase || !coachId) return
    setSavingNote(true)
    try {
      const payload = {
        coach_id: coachId,
        text,
        category_id: activeCustomCatId,           // for user-made custom tabs
        builtin_category: activeBuiltinId,        // for the seeded built-in tabs
      }
      const { data, error } = await db.supabase
        .from('dm_user_messages').insert(payload).select().single()
      if (error) throw error
      // Append so new messages show at the bottom of the existing list
      // (chronological — matches the seeded order).
      setMyNotes(prev => [...prev, data])
      setMyDraft('')
    } catch (e) {
      console.error('save dm note failed:', e)
      alert('Opslaan mislukt — ' + (e?.message || e))
    } finally {
      setSavingNote(false)
    }
  }

  const handleClearDraft = () => {
    if (!myDraft.trim()) return
    if (window.confirm('Veld leegmaken? De huidige tekst gaat verloren.')) {
      setMyDraft('')
    }
  }

  const handleDeleteNote = async (id) => {
    if (!db?.supabase) return
    if (!window.confirm('Bericht verwijderen?')) return
    const prev = myNotes
    setMyNotes(p => p.filter(n => n.id !== id))
    try {
      const { error } = await db.supabase
        .from('dm_user_messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error('delete dm note failed:', e)
      setMyNotes(prev)
    }
  }

  // ── Custom category CRUD ──────────────────────────────────────────────────
  const createCustomCategory = async () => {
    const name = newCatName.trim()
    if (!name || !db?.supabase || !coachId) return
    try {
      const { data, error } = await db.supabase
        .from('dm_categories')
        .insert({ coach_id: coachId, name, position: customCategories.length })
        .select().single()
      if (error) throw error
      setCustomCategories(prev => [...prev, data])
      setActiveCategory(data.id) // auto-switch to the new tab
      setSearchTerm('')
      setNewCatName('')
      setCreatingCat(false)
    } catch (e) {
      alert('Tab aanmaken mislukt — ' + (e?.message || e))
    }
  }

  const renameCustomCategory = async (id) => {
    const name = renamingCatName.trim()
    if (!name || !db?.supabase) return
    try {
      const { error } = await db.supabase
        .from('dm_categories').update({ name }).eq('id', id)
      if (error) throw error
      setCustomCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c))
      setRenamingCatId(null)
      setRenamingCatName('')
    } catch (e) {
      alert('Hernoemen mislukt — ' + (e?.message || e))
    }
  }

  const deleteCustomCategory = async (id) => {
    if (!window.confirm('Tab verwijderen? Berichten erin blijven bestaan onder "Mijn berichten".')) return
    try {
      const { error } = await db.supabase
        .from('dm_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      // Move the notes in that category back to default by clearing category_id.
      await db.supabase.from('dm_user_messages')
        .update({ category_id: null }).eq('category_id', id)
      setCustomCategories(prev => prev.filter(c => c.id !== id))
      setMyNotes(prev => prev.map(n => n.category_id === id ? { ...n, category_id: null } : n))
      if (activeCategory === id) setActiveCategory(MY_NOTES_ID)
    } catch (e) {
      alert('Verwijderen mislukt — ' + (e?.message || e))
    }
  }

  // ── Hide / unhide built-in categories ─────────────────────────────────────
  const hideBuiltin = async (builtinId) => {
    if (!db?.supabase || !coachId) return
    try {
      const { error } = await db.supabase
        .from('dm_hidden_builtins')
        .upsert({ coach_id: coachId, builtin_id: builtinId })
      if (error) throw error
      setHiddenBuiltins(prev => new Set([...prev, builtinId]))
      // If the user was looking at it, switch to Mijn berichten.
      if (activeCategory === builtinId) setActiveCategory(MY_NOTES_ID)
    } catch (e) {
      alert('Verbergen mislukt — ' + (e?.message || e))
    }
  }

  const unhideBuiltin = async (builtinId) => {
    if (!db?.supabase || !coachId) return
    try {
      const { error } = await db.supabase
        .from('dm_hidden_builtins')
        .delete()
        .eq('coach_id', coachId).eq('builtin_id', builtinId)
      if (error) throw error
      setHiddenBuiltins(prev => {
        const next = new Set(prev)
        next.delete(builtinId)
        return next
      })
    } catch (e) {
      alert('Tonen mislukt — ' + (e?.message || e))
    }
  }

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory)

  // Search now runs against the DB-backed notes so user edits + additions
  // are searchable. Maps back to {text, tag, category, color} shape that
  // the search-result render expects.
  const filteredMessages = searchTerm
    ? myNotes
        .filter(n => {
          const q = searchTerm.toLowerCase()
          return (n.text || '').toLowerCase().includes(q) ||
                 (n.tag  || '').toLowerCase().includes(q)
        })
        .map(n => {
          const builtin = n.builtin_category ? CATEGORIES.find(c => c.id === n.builtin_category) : null
          const custom = n.category_id ? customCategories.find(c => c.id === n.category_id) : null
          return {
            id: n.id,
            text: n.text,
            tag: n.tag || '',
            category: builtin?.label || custom?.name || 'Mijn berichten',
            color: builtin?.color || custom?.color || GOLD.light,
          }
        })
    : []

  // ── Drag state — modal floats anywhere on screen. ──────────────────────────
  const PANEL_W = isMobile ? Math.min(window.innerWidth, 480) : 820
  const PANEL_H = isMobile ? Math.min(window.innerHeight - 16, 700) : 640
  const [pos, setPos] = useState(null) // { x, y } — set on first open, retained
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isOpen || pos) return
    // Default: center on first open. On mobile we stick to top-left full-screen.
    if (isMobile) {
      setPos({ x: 0, y: 0 })
    } else {
      setPos({
        x: Math.max(8, Math.round((window.innerWidth  - PANEL_W) / 2)),
        y: Math.max(8, Math.round((window.innerHeight - PANEL_H) / 2)),
      })
    }
  }, [isOpen, pos, isMobile, PANEL_W, PANEL_H])

  const onDragStart = useCallback((e) => {
    if (isMobile) return
    // Ignore drag-start that originates from interactive elements inside the
    // header (the close-button), otherwise X won't fire.
    if (e.target?.closest?.('[data-no-drag]')) return
    e.preventDefault()
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    dragOffset.current = { x: cx - (pos?.x ?? 0), y: cy - (pos?.y ?? 0) }
    setIsDragging(true)
  }, [pos, isMobile])

  const onDragMove = useCallback((e) => {
    const cx = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const cy = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    setPos({
      x: Math.max(0, Math.min(window.innerWidth  - PANEL_W, cx - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 60,      cy - dragOffset.current.y)),
    })
  }, [PANEL_W])

  const onDragEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (!isDragging) return
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup',   onDragEnd)
    window.addEventListener('touchmove', onDragMove, { passive: false })
    window.addEventListener('touchend',  onDragEnd)
    return () => {
      window.removeEventListener('mousemove', onDragMove)
      window.removeEventListener('mouseup',   onDragEnd)
      window.removeEventListener('touchmove', onDragMove)
      window.removeEventListener('touchend',  onDragEnd)
    }
  }, [isDragging, onDragMove, onDragEnd])

  // ===== TRIGGER — twee varianten:
  //  'inline' → compacte toolbar-knop (naast de zoekbalk op de leads-pagina),
  //             gewoon in de flow gerenderd (geen portal/fixed).
  //  'fab'    → zwevende ronde knop rechtsonder, portal'd to body zodat een
  //             parent's `transform: translateZ(0)` (compositing) 'm niet van
  //             viewport-fixed naar container-fixed verandert en wegscrollt.
  const inlineTrigger = !isOpen ? (
    <button
      onClick={() => setIsOpen(true)}
      title="DM Copy Center"
      style={{
        width: 30, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.4)',
        borderRadius: 8, color: GOLD.primary,
        cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      }}
    >
      <MessageSquare size={16} />
    </button>
  ) : null

  const fab = !isOpen ? createPortal(
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 20px ${GOLD.glow}, 0 0 30px ${GOLD.glow}`,
        zIndex: 2147483600,
        transition: 'all 0.3s ease',
        animation: 'pulse-gold-dmb 2s infinite',
      }}
      title="DM Copy Center"
    >
      <Flame size={isMobile ? 26 : 30} color="#000" />
      <style>{`
        @keyframes pulse-gold-dmb {
          0%, 100% { box-shadow: 0 4px 20px ${GOLD.glow}, 0 0 30px ${GOLD.glow}; }
          50%      { box-shadow: 0 4px 30px ${GOLD.glow}, 0 0 50px ${GOLD.glow}; }
        }
      `}</style>
    </button>,
    modalHost,
  ) : null

  const trigger = triggerVariant === 'inline' ? inlineTrigger : fab

  if (!isOpen) return trigger

  if (!pos) return fab // wait for initial position calc

  // ===== MODAL — also portal'd. Draggable by its header (same pattern as
  // FloatingPanel / CoachingLogModal). No dark backdrop — feels floating
  // instead of blocking, so you can still see the lead card behind it.
  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        left: pos.x,
        top:  pos.y,
        width:  isMobile ? '100vw' : PANEL_W,
        height: isMobile ? '100dvh' : PANEL_H,
        paddingTop: isMobile ? 'env(safe-area-inset-top, 0px)' : 0,
        boxSizing: isMobile ? 'border-box' : 'content-box',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #111 100%)',
        border: isMobile ? 'none' : `2px solid ${GOLD.border}`,
        borderRadius: isMobile ? 0 : 14,
        boxShadow: `0 12px 50px rgba(0,0,0,0.7), 0 0 40px ${GOLD.glow}`,
        zIndex: 2147483601,
        isolation: 'isolate',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
        {/* HEADER — drag handle */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0.75rem' : '0.85rem 1rem',
            borderBottom: `1px solid ${GOLD.border}`,
            background: GOLD.bg,
            flexShrink: 0,
            cursor: isMobile ? 'default' : (isDragging ? 'grabbing' : 'grab'),
            touchAction: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {!isMobile && <GripHorizontal size={13} color="rgba(255,255,255,0.35)" />}
            <Flame size={22} color={GOLD.light} />
            <div>
              <h2 style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '800',
                color: GOLD.light,
                margin: 0,
              }}>
                DM COPY CENTER
              </h2>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                Klik om te kopiëren → Plak in DM
              </p>
            </div>
          </div>
          <button
            data-no-drag
            onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            style={{
              width: isMobile ? 40 : 32, height: isMobile ? 40 : 32,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              touchAction: 'manipulation',
              flexShrink: 0,
            }}
          >
            <X size={16} />
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
            {/* My Notes — first, so it's always at the top of the sidebar. */}
            {db && coachId && (() => {
              const isActive = activeCategory === MY_NOTES_ID && !searchTerm
              const noteColor = GOLD.light
              const defaultCount = myNotes.filter(n => !n.category_id).length
              return (
                <button
                  onClick={() => { setActiveCategory(MY_NOTES_ID); setSearchTerm('') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 0.75rem',
                    background: isActive ? `${noteColor}1a` : 'transparent',
                    border: isActive ? `1px solid ${noteColor}55` : '1px solid transparent',
                    borderRadius: '6px',
                    color: isActive ? noteColor : 'rgba(255,255,255,0.7)',
                    fontSize: isMobile ? '0.7rem' : '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    flex: isMobile ? '0 0 auto' : 'none',
                  }}
                >
                  <span>📝 Mijn berichten</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: 'auto' }}>
                    {defaultCount}
                  </span>
                </button>
              )
            })()}

            {/* User-created custom tabs. Inline rename + delete. */}
            {customCategories.map(cat => {
              const isActive = activeCategory === cat.id && !searchTerm
              const isRenaming = renamingCatId === cat.id
              const count = myNotes.filter(n => n.category_id === cat.id).length
              const color = cat.color || GOLD.light
              if (isRenaming) {
                return (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '0.35rem 0.5rem',
                    background: `${color}1a`, border: `1px solid ${color}55`, borderRadius: 6,
                  }}>
                    <input
                      autoFocus
                      value={renamingCatName}
                      onChange={(e) => setRenamingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameCustomCategory(cat.id)
                        if (e.key === 'Escape') { setRenamingCatId(null); setRenamingCatName('') }
                      }}
                      style={{
                        flex: 1, minWidth: 0,
                        background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 4, padding: '4px 6px',
                        color: '#fff', fontSize: '0.75rem', outline: 'none',
                      }}
                    />
                    <button onClick={() => renameCustomCategory(cat.id)} style={iconBtn(color)}>
                      <Check size={11} />
                    </button>
                    <button onClick={() => { setRenamingCatId(null); setRenamingCatName('') }} style={iconBtn('rgba(255,255,255,0.4)')}>
                      <X size={11} />
                    </button>
                  </div>
                )
              }
              return (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'stretch',
                  background: isActive ? `${color}1a` : 'transparent',
                  border: isActive ? `1px solid ${color}55` : '1px solid transparent',
                  borderRadius: 6,
                }}>
                  <button
                    onClick={() => { setActiveCategory(cat.id); setSearchTerm('') }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      padding: isMobile ? '0.5rem 0.5rem 0.5rem 0.65rem' : '0.55rem 0.5rem 0.55rem 0.7rem',
                      background: 'transparent', border: 'none',
                      color: isActive ? color : 'rgba(255,255,255,0.7)',
                      fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: 700,
                      cursor: 'pointer', textAlign: 'left',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>📁 {cat.name}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5, marginLeft: 'auto' }}>{count}</span>
                  </button>
                  {isActive && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingCatId(cat.id); setRenamingCatName(cat.name) }}
                        title="Hernoemen" style={iconBtn(color)}
                      >
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteCustomCategory(cat.id) }}
                        title="Verwijderen" style={iconBtn('#fca5a5')}
                      >
                        <Trash2 size={10} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}

            {/* + Nieuwe tab */}
            {db && coachId && (
              creatingCat ? (
                <div style={{
                  display: 'flex', gap: 4, padding: '0.35rem 0.5rem',
                  background: `${GOLD.light}1a`, border: `1px solid ${GOLD.light}55`, borderRadius: 6,
                }}>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Naam tab…"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createCustomCategory()
                      if (e.key === 'Escape') { setCreatingCat(false); setNewCatName('') }
                    }}
                    style={{
                      flex: 1, minWidth: 0,
                      background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 4, padding: '4px 6px',
                      color: '#fff', fontSize: '0.75rem', outline: 'none',
                    }}
                  />
                  <button onClick={createCustomCategory} style={iconBtn(GOLD.light)}>
                    <Check size={11} />
                  </button>
                  <button onClick={() => { setCreatingCat(false); setNewCatName('') }} style={iconBtn('rgba(255,255,255,0.4)')}>
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingCat(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: isMobile ? '0.5rem 0.75rem' : '0.55rem 0.75rem',
                    background: 'transparent',
                    border: '1px dashed rgba(255,255,255,0.15)',
                    borderRadius: 6,
                    color: 'rgba(255,255,255,0.55)',
                    fontSize: '0.7rem', fontWeight: 700,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <FolderPlus size={11} /> Nieuwe tab
                </button>
              )
            )}

            {/* Divider tussen user-tabs en built-ins */}
            <div style={{
              height: 1, background: 'rgba(255,255,255,0.06)',
              margin: '0.4rem 0.25rem',
            }} />

            {CATEGORIES.filter(cat => showHidden || !hiddenBuiltins.has(cat.id)).map(cat => {
              const isActive = activeCategory === cat.id && !searchTerm
              const isHidden = hiddenBuiltins.has(cat.id)
              return (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'stretch',
                  background: isActive ? `${cat.color}22` : 'transparent',
                  border: isActive ? `1px solid ${cat.color}55` : '1px solid transparent',
                  borderRadius: 6,
                  opacity: isHidden ? 0.45 : 1,
                }}>
                  <button
                    onClick={() => { setActiveCategory(cat.id); setSearchTerm('') }}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                      padding: isMobile ? '0.5rem 0.5rem 0.5rem 0.65rem' : '0.55rem 0.5rem 0.55rem 0.7rem',
                      background: 'transparent', border: 'none',
                      color: isActive ? cat.color : 'rgba(255,255,255,0.6)',
                      fontSize: isMobile ? '0.7rem' : '0.8rem', fontWeight: 600,
                      cursor: 'pointer', textAlign: 'left',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.label}</span>
                    <span style={{ fontSize: '0.6rem', opacity: 0.5, marginLeft: 'auto' }}>
                      {cat.messages.length}
                    </span>
                  </button>
                  {db && coachId && isActive && (
                    isHidden ? (
                      <button onClick={(e) => { e.stopPropagation(); unhideBuiltin(cat.id) }} title="Tonen" style={iconBtn(cat.color)}>
                        <Eye size={10} />
                      </button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); hideBuiltin(cat.id) }} title="Verbergen" style={iconBtn('rgba(255,255,255,0.4)')}>
                        <EyeOff size={10} />
                      </button>
                    )
                  )}
                </div>
              )
            })}

            {/* Toon-verborgen toggle als er iets verborgen is */}
            {db && coachId && hiddenBuiltins.size > 0 && (
              <button
                onClick={() => setShowHidden(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0.4rem 0.5rem',
                  marginTop: 4,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 5,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '0.6rem', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showHidden ? <Eye size={9} /> : <EyeOff size={9} />}
                {showHidden ? 'Verberg gehidden' : `Toon ${hiddenBuiltins.size} verborgen`}
              </button>
            )}
          </div>

          {/* MESSAGES LIST */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: isMobile ? '0.5rem' : '0.75rem'
          }}>
            {/* Notes view — unified for default, custom, AND built-in tabs.
                Everything is DB-backed now (built-ins seeded once per coach)
                so every tab supports add/edit/delete with the same UI. */}
            {!searchTerm && isUserNotesTab && (() => {
              const activeCustom = customCategories.find(c => c.id === activeCategory)
              const activeBuiltin = CATEGORIES.find(c => c.id === activeCategory)
              const tabLabel = activeBuiltin?.label || activeCustom?.name || 'Mijn berichten'
              const tabColor = activeBuiltin?.color || activeCustom?.color || GOLD.light
              return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  paddingBottom: '0.4rem', borderBottom: `1px solid ${tabColor}33`,
                }}>
                  <Pencil size={14} color={tabColor} />
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: tabColor }}>
                    {tabLabel}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '0.65rem',
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    {notesForActiveTab.length} opgeslagen
                  </span>
                </div>

                <textarea
                  value={myDraft}
                  onChange={(e) => setMyDraft(e.target.value)}
                  placeholder="Schrijf hier je doordachte bericht. Sla 'm op om 'm later opnieuw te gebruiken (klik in de lijst hieronder om te kopiëren)."
                  rows={isMobile ? 5 : 7}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    padding: '0.7rem 0.85rem',
                    background: 'rgba(0,0,0,0.4)',
                    border: `1px solid ${GOLD.border}`,
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: '0.85rem', lineHeight: 1.5,
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={handleSaveNote}
                    disabled={!myDraft.trim() || savingNote}
                    style={{
                      flex: 2, padding: '0.55rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: myDraft.trim() ? GOLD.primary : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${myDraft.trim() ? GOLD.primary : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6,
                      color: myDraft.trim() ? '#000' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.8rem', fontWeight: 800,
                      cursor: myDraft.trim() && !savingNote ? 'pointer' : 'not-allowed',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Plus size={13} /> {savingNote ? 'Opslaan…' : 'Opslaan'}
                  </button>
                  <button
                    onClick={handleClearDraft}
                    disabled={!myDraft.trim()}
                    style={{
                      flex: 1, padding: '0.55rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: 6,
                      color: myDraft.trim() ? '#fca5a5' : 'rgba(255,255,255,0.25)',
                      fontSize: '0.75rem', fontWeight: 700,
                      cursor: myDraft.trim() ? 'pointer' : 'not-allowed',
                      touchAction: 'manipulation',
                    }}
                  >
                    <Eraser size={12} /> Clear
                  </button>
                </div>

                {/* History */}
                <div style={{
                  marginTop: '0.4rem', paddingTop: '0.5rem',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{
                    fontSize: '0.55rem', fontWeight: 800,
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    marginBottom: '0.45rem',
                  }}>
                    Opgeslagen berichten
                  </div>
                  {notesLoading && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0.5rem' }}>
                      Laden…
                    </div>
                  )}
                  {!notesLoading && notesForActiveTab.length === 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '0.85rem', fontStyle: 'italic' }}>
                      Nog geen berichten in deze tab — schrijf 'r één en sla 'm op.
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {notesForActiveTab.map((n, i) => {
                      const idx = `my-${n.id}`
                      const isCopied = copiedIndex === idx
                      const isEditing = editingNoteId === n.id
                      const stripeColor = tabColor || GOLD.light
                      return (
                        <div
                          key={n.id}
                          onClick={() => { if (!isEditing) copyToClipboard(n.text, idx) }}
                          style={{
                            display: 'flex', alignItems: 'stretch',
                            background: isCopied ? `${GOLD.primary}22` : 'rgba(255,255,255,0.03)',
                            border: isCopied ? `1px solid ${GOLD.primary}` : '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 8, overflow: 'hidden',
                            cursor: isEditing ? 'default' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ width: 4, background: stripeColor, flexShrink: 0 }} />
                          <div style={{ flex: 1, padding: '0.6rem 0.7rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              {n.tag && (
                                <span style={{
                                  fontSize: '0.6rem', fontWeight: 700,
                                  color: stripeColor,
                                  background: `${stripeColor}18`,
                                  padding: '1px 6px', borderRadius: 4,
                                }}>{n.tag}</span>
                              )}
                              <span style={{
                                fontSize: '0.55rem', fontWeight: 700,
                                color: 'rgba(255,255,255,0.35)',
                                letterSpacing: '0.04em', textTransform: 'uppercase',
                              }}>
                                {new Date(n.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            {isEditing ? (
                              <textarea
                                autoFocus
                                value={editingNoteText}
                                onChange={(e) => setEditingNoteText(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                rows={Math.max(2, Math.min(8, (editingNoteText.match(/\n/g)?.length || 0) + 2))}
                                style={{
                                  width: '100%', boxSizing: 'border-box',
                                  padding: '0.45rem 0.55rem',
                                  background: 'rgba(0,0,0,0.4)',
                                  border: `1px solid ${stripeColor}55`,
                                  borderRadius: 5,
                                  color: '#fff', fontSize: '0.85rem', lineHeight: 1.4,
                                  fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                                }}
                              />
                            ) : (
                              <div style={{
                                fontSize: isMobile ? '0.8rem' : '0.85rem',
                                color: 'rgba(255,255,255,0.9)', lineHeight: 1.4,
                                whiteSpace: 'pre-wrap',
                              }}>
                                {n.text}
                              </div>
                            )}
                            {isEditing && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleSaveEdit() }}
                                  style={{
                                    padding: '4px 10px',
                                    background: '#10b981', border: 'none', borderRadius: 4,
                                    color: '#fff', fontSize: '0.7rem', fontWeight: 800,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <Check size={11} /> Opslaan
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingNoteId(null); setEditingNoteText('') }}
                                  style={{
                                    padding: '4px 10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                                    color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Annuleer
                                </button>
                              </div>
                            )}
                          </div>
                          {!isEditing && (
                            <div style={{
                              width: 44, display: 'flex', flexDirection: 'column',
                              borderLeft: '1px solid rgba(255,255,255,0.05)',
                            }}>
                              <div style={{
                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isCopied ? GOLD.primary : 'transparent',
                              }}>
                                {isCopied ? <Check size={16} color="#000" /> : <Copy size={14} color="rgba(255,255,255,0.3)" />}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingNoteId(n.id); setEditingNoteText(n.text) }}
                                title="Bewerken"
                                style={{
                                  height: 26,
                                  background: 'transparent',
                                  border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                                  color: 'rgba(255,255,255,0.4)',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Pencil size={11} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteNote(n.id) }}
                                title="Verwijder"
                                style={{
                                  height: 26,
                                  background: 'transparent',
                                  border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)',
                                  color: 'rgba(239,68,68,0.5)',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              )
            })()}

            {/* Category header */}
            {!searchTerm && !isUserNotesTab && currentCategory && (
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

            {/* Messages — hidden when the My Notes tab is active (that tab
                renders its own writer + history above). */}
            {!isUserNotesTab && (
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
            )}

            {/* Empty state — only for the template categories. */}
            {!isUserNotesTab && filteredMessages.length === 0 && (
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
    </div>,
    modalHost,
  )
}
