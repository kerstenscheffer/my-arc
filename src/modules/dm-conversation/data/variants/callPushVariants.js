// FILE: src/modules/dm-conversation/data/variants/callPushVariants.js
// MY ARC - Call Push Variants
// All call push messages from messageDatabase.js

export const callPushSoftVariants = [
  { id: 'cp1', label: 'Hulp aanbieden', text: 'Duidelijk, dit is precies waar ik mensen mee help man. Ik kan wel even kort meekijken op een call om te kijken wat jij nodig hebt om door te gaan naar je doel. Zou je dat handig vinden?' },
  { id: 'cp2', label: 'Als je wilt', text: 'Weet je wat, als je wilt kan ik je even op weg helpen. Ik help vaker jongens die een beetje vastlopen met dit soort dingen. Gewoon 15 minuutjes bellen, zou dat helpen denk je?' },
  { id: 'cp3', label: 'Quick call', text: 'Snap ik helemaal man. Ik kan deze week wel even 15 minuutjes op een call springen, dan wil ik je wel uitleggen wat je moet doen om vooruit te komen. Zou je dat handig vinden?' },
  { id: 'cp4', label: 'Value first', text: 'Duidelijk, ik zie denk ik waar je vast loopt. Misschien handig om deze week kort te bellen, dan leg ik je even uit wat je nodig hebt om naar je doel te komen. Vind je dat handig?' }
]

export const callPushDirectVariants = [
  { id: 'cp5', label: 'Laten we bellen', text: 'Weet je wat, laten we gewoon even bellen man. Dan kan ik je situatie beter begrijpen en precies kijken of en hoe ik je kan helpen. Wanneer zou je kunnen deze week?' },
  { id: 'cp6', label: 'Wanneer tijd', text: 'Dit is precies waar ik goed in ben man. Wanneer heb je deze week ongeveer 15 minuutjes? Dan bel ik je even.' },
  { id: 'cp7', label: 'Dit is wat ik doe', text: 'Oké luister, dit is letterlijk wat ik de hele dag doe man. Laten we bellen, dan leg ik je precies uit hoe we dit kunnen oplossen. Vandaag of morgen?' },
  { id: 'cp8', label: 'Situatie herkennen', text: 'Ja zie je, dit is precies waar veel jongens tegenaan lopen. Laten we even bellen, dan help ik je op weg. Welke dag zou kunnen?' }
]

export const callPushLogicalVariants = [
  { id: 'cp9', label: '15min vs typen', text: 'Ik kan je hier uren over typen man, maar een call van 15 minuten is echt veel effectiever. Dan kan ik doorvragen en je direct op maat helpen met jouw situatie. Ben je daar voor open?' },
  { id: 'cp10', label: 'Sneller resultaat', text: 'Kijk, je kunt zelf blijven uitzoeken en hopen dat het werkt. Of je belt me even en dan weet je binnen 15 minuten precies wat je moet doen. Wat lijkt jou slimmer?' },
  { id: 'cp11', label: 'Persoonlijk vs generic', text: 'Via chat kan ik je alleen maar generic tips geven man. In een gesprek kan ik echt ingaan op jouw specifieke situatie. 15 minuutjes bellen?' }
]

export const callPushUrgencyVariants = [
  { id: 'cp12', label: 'Beperkte plekken', text: 'Ik heb deze week nog maar een paar plekken vrij man. Als je het echt wilt fixen, laten we dan nu een moment prikken. Welke dag zou kunnen?' },
  { id: 'cp13', label: 'Agenda vol', text: 'Mijn agenda zit bijna vol deze week man. Ik kan je er nog tussen proppen op [dag] om [tijd]. Zou dat kunnen voor jou?' },
  { id: 'cp14', label: 'Langer wachten', text: 'Snap ik man. Maar wees eerlijk: hoe langer je wacht, hoe langer je zonder resultaat blijft zitten. Laten we het gewoon nu regelen?' }
]
