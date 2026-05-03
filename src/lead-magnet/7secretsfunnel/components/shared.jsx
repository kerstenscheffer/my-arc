// src/lead-magnet/7secretsfunnel/components/shared.jsx
export const GOLD = '#ffba09'
export const GOLD_BRIGHT = '#ffd44d'
export const GOLD_DARK = '#e8a800'
export const INK = '#c8b88a'
export const INK_DIM = '#6b6050'
export const PARCHMENT = '#0a0908'
export const PARCHMENT_LIGHT = '#121110'
export const PARCHMENT_EDGE = '#050404'
export const RED_INK = '#8b3a3a'
export const CALENDLY = 'https://calendly.com/kerstenscheffer/call-met-kersten'
export const GOLD_SUBTLE = '#ffba09'
export const ROMANS = ['Cover','I','II','III','IV','V','VI','VII']

export const SECRETS = [
  { number:1, roman:'I', cap:'Capitulum I', tag:'NEAT', stat:'30%', statLabel:'van je verbranding',
    title:'Verhoog je NEAT voor meer eten en sneller vetverlies',
    body:'Mannen die moeiteloos droog de zomer ingaan bewegen meer buiten de gym. Lopen, staan, traplopen — dit heet NEAT en verbrandt tot 30% van je dagelijkse calorieën.',
    highlight:'Combineer NEAT met Secret V en je eet MEER terwijl je MEER VET verliest.' },
  { number:2, roman:'II', cap:'Capitulum II', tag:'CORTISOL', stat:'#1', statLabel:'hormoonkiller',
    title:'Dat laatste laagje buikvet dat niet weg wil?',
    body:'Chronisch hoog cortisol door slaapgebrek en stress geeft je lichaam het signaal om vet vast te houden rond je buik — zelfs in een deficit.',
    highlight:'Beter slapen, minder stress = minder cortisol = makkelijker van buikvet af.' },
  { number:3, roman:'III', cap:'Capitulum III', tag:'WATER RETENTIE', stat:'3L+', statLabel:'per dag',
    title:'Meer spierdefinitie door één gewoonte',
    body:'Weinig water drinken = je lichaam houdt meer vocht vast onder je huid. Dat verbergt al je resultaten.',
    highlight:'3+ liter per dag. Je lichaam houdt niks extra vast en je resultaten worden zichtbaar.' },
  { number:4, roman:'IV', cap:'Capitulum IV', tag:'TRAINING', stat:'80%', statLabel:'van je groei',
    title:'De set die 80% van je groei bepaalt',
    body:'Je eerste werkset moet direct de zwaarste zijn. Licht beginnen en opbouwen? Dan is je energie al op bij de set die ertoe doet.',
    highlight:'Eerste werkset tot falen stimuleert de meeste spiervezels. Alles daarna is bonus.' },
  { number:5, roman:'V', cap:'Capitulum V', tag:'CARB TIMING', stat:'2x', statLabel:'resultaat',
    title:'Dezelfde carbs, ander moment, dubbel resultaat',
    body:'Plan 50-60% van je koolhydraten rond je training. Je spieren gebruiken ze als brandstof — voller = harder trainen = sneller herstellen.',
    highlight:'Dezelfde hoeveelheid carbs, ander moment, beter resultaat.' },
  { number:6, roman:'VI', cap:'Capitulum VI', tag:'FASTED CARDIO', stat:'AM', statLabel:'voor ontbijt',
    title:'De makkelijkste manier om extra vet te verliezen',
    body:"'s Ochtends zijn je glycogeenvoorraden laag. Je lichaam schakelt sneller over op vetverbranding. Dezelfde wandeling na de lunch heeft dit effect niet.",
    highlight:'Vaste ochtendroutine met beweging op een lege maag = moeiteloos droog blijven.' },
  { number:7, roman:'VII', cap:'Capitulum VII', tag:'TESTOSTERON', stat:'95%', statLabel:'tijdens slaap',
    title:'De gratis manier om spiergroei te versnellen',
    body:'95% van je testosteron wordt aangemaakt tijdens diepe slaap. Zonlicht en gezonde vetten doen de rest. Geen supplement komt hier in de buurt.',
    highlight:'Goed slapen + buiten zijn + gezonde vetten = sneller je summer body.' }
]

export const manuscriptStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,400;1,700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#030303;-webkit-font-smoothing:antialiased}
  @keyframes inkReveal{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  @keyframes glowPulse{0%{filter:drop-shadow(0 0 20px rgba(212,165,49,.15))}50%{filter:drop-shadow(0 0 60px rgba(212,165,49,.45))}100%{filter:drop-shadow(0 0 20px rgba(212,165,49,.15))}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes coachPulse{0%,100%{box-shadow:0 4px 20px rgba(212,165,49,.3)}50%{box-shadow:0 4px 30px rgba(212,165,49,.6),0 0 0 8px rgba(212,165,49,.1)}}
  @keyframes coachSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  @keyframes notifSlideIn{from{opacity:0;transform:translateX(20px) scale(.95)}to{opacity:1;transform:none}}
  @keyframes scaleIn{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
  @keyframes slideUp{from{transform:translateY(100%)}to{transform:none}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes zoomFlash{0%{opacity:0}30%{opacity:1}100%{opacity:0}}
  input::placeholder,textarea::placeholder{color:rgba(200,184,138,.2)}
  ::-webkit-scrollbar{display:none}
`
