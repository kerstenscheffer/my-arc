// src/modules/lab/experiments/NutritionChoiceTrainer.jsx
// Lab-experiment: train de juiste voedingskeuze (Flexibel eet systeem, vetverlies).
// Styling overgenomen van de meal-pagina: donkere gradient-cards, foto's, witte
// bold titels + duidelijke subteksten, groene accenten.
// Per gelegenheid 2 opties; kies de slimme keuze, krijg feedback + uitleg + score.
// Vragen staan in ROUNDS en zijn makkelijk uit te breiden per gelegenheid.
import { useMemo, useState, useEffect } from 'react'
import { Check, X, RotateCcw, ChevronRight, ChevronDown, UtensilsCrossed } from 'lucide-react'

const GOLD = '#FFD700'
const GREEN = '#22c55e'
const RED = '#ef4444'
const AUTO_MS = 4000   // auto-doorgaan na het antwoord
const CARD_BG = 'linear-gradient(135deg, rgba(23,23,23,0.6) 0%, rgba(20,20,20,0.4) 100%)'
const CARD_BORDER = '1px solid rgba(255,255,255,0.06)'

// Gelegenheden ("Kies jouw gelegenheid"). Meal-momenten + sociale situaties.
const SITUATIONS = [
  { id: 'ontbijt', label: 'Ontbijt' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'diner', label: 'Diner' },
  { id: 'pre-workout', label: 'Pre workout' },
  { id: 'avond-snack', label: 'Avond snack' },
  { id: 'voor-bed', label: 'Voor bed' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'mcdonalds', label: "McDonald's" },
  { id: 'feest', label: 'Feest' },
  { id: 'verjaardag', label: 'Verjaardag' },
]

// Food-foto op basis van trefwoord (zoals de meal-pagina doet). Fallback = bord eten.
const FOOD_IMG = {
  kwark: 'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=400&h=300&fit=crop',
  granola: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400&h=300&fit=crop',
  chips: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=300&fit=crop',
  pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop',
  biefstuk: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&h=300&fit=crop',
  carpaccio: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=300&fit=crop',
  salade: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  kip: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop',
  zalm: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop',
  omelet: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&h=300&fit=crop',
  eieren: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  wrap: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop',
  brood: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
  pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop',
  aardappel: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&h=300&fit=crop',
  burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  friet: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop',
  frituur: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=300&fit=crop',
  noten: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop',
  banaan: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop',
  sinaasappel: 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=400&h=300&fit=crop',
  koekje: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop',
  ijs: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop',
  milkshake: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
  taart: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop',
  cola: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
  frisdrank: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=300&fit=crop',
  bier: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop',
  wijn: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop',
  cocktail: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop',
  water: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=300&fit=crop',
  fruit: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=300&fit=crop',
}
const FOOD_FALLBACK = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
const getFoodImage = (title) => {
  const t = (title || '').toLowerCase()
  const key = Object.keys(FOOD_IMG).find(k => t.includes(k)
    || (k === 'burger' && (t.includes('big mac') || t.includes('hamburger') || t.includes('mcchicken')))
    || (k === 'noten' && t.includes('nootjes'))
    || (k === 'frituur' && t.includes('bitterballen'))
    || (k === 'eieren' && t.includes('eier')))
  return FOOD_IMG[key] || FOOD_FALLBACK
}

// Vetverlies-lens (Flexibel eet systeem): de slimme keuze houdt je LANGER VOL bij
// ±dezelfde calorieën (volume + eiwit). Niks is verboden, het past in je tekort.
// Elke ronde: { situation, prompt, a, b, correct: 'a'|'b', reason }.
const ROUNDS = [
  // ── Ontbijt ──
  {
    situation: 'ontbijt', prompt: 'Ontbijt in een tekort. Wat is de slimme keuze?',
    a: { title: 'Granola met volle yoghurt', sub: 'calorisch dicht, snel op' },
    b: { title: 'Eiwitrijke kwark of eieren met fruit', sub: 'hoog volume + eiwit' },
    correct: 'b', reason: 'Hoog in volume en eiwit = langer vol bij minder calorieën. Granola is lekker maar zit vol verborgen calorieën.',
  },
  {
    situation: 'ontbijt', prompt: 'Welk ontbijt houdt je langer vol?',
    a: { title: 'Volkoren brood met ei en kipfilet', sub: 'eiwit, vult lang' },
    b: { title: 'Wit brood met hagelslag', sub: 'suiker, snel weer honger' },
    correct: 'a', reason: 'Volkoren met eiwit houdt je uren vol. Hagelslag op wit brood is pure suiker, zo heb je weer trek.',
  },
  {
    situation: 'ontbijt', prompt: 'Wat neem je bij je ontbijt?',
    a: { title: 'Glas sinaasappelsap', sub: 'vloeibare suiker' },
    b: { title: 'Hele sinaasappel + water', sub: 'vezels, moet kauwen' },
    correct: 'b', reason: 'De hele vrucht heeft vezels en je moet kauwen, dat verzadigt. Sap is vloeibare suiker zonder vulling.',
  },
  {
    situation: 'ontbijt', prompt: 'Op de hotel-ochtend, wat kies je?',
    a: { title: 'Omelet met groente', sub: 'eiwit + volume' },
    b: { title: 'Croissant met jam', sub: 'calorisch dicht, zo op' },
    correct: 'a', reason: 'De omelet vult met eiwit en groente. Een croissant is veel calorieën en geeft amper verzadiging.',
  },

  // ── Lunch ──
  {
    situation: 'lunch', prompt: 'Lunch onderweg. Welke past beter in je tekort?',
    a: { title: 'Broodje met veel mayo en saus', sub: 'verborgen calorieën' },
    b: { title: 'Broodje kip of tonijn met veel groente', sub: 'eiwit + volume' },
    correct: 'b', reason: 'Eiwit en groente vullen; de sauzen leveren verborgen calorieën zonder dat je voller zit.',
  },
  {
    situation: 'lunch', prompt: 'Wat pak je als lunch?',
    a: { title: 'Grote salade met kip, ei en dressing apart', sub: 'volume + eiwit' },
    b: { title: 'Kant-en-klare pastasalade met dressing', sub: 'veel verborgen olie' },
    correct: 'a', reason: 'Volume en eiwit houden je vol, en dressing apart kun je doseren. Pastasalade zit vol verborgen olie.',
  },
  {
    situation: 'lunch', prompt: 'Snelle lunch op kantoor?',
    a: { title: 'Twee witte boterhammen met kaas', sub: 'snel op, weinig eiwit' },
    b: { title: 'Volkoren wrap met kipfilet en groente', sub: 'volkoren + mager eiwit' },
    correct: 'b', reason: 'Volkoren met mager eiwit houdt langer vol dan wit brood met vette kaas.',
  },

  // ── Diner ──
  {
    situation: 'diner', prompt: 'Hoe bouw je je bord op?',
    a: { title: 'Vooral rijst met saus, weinig groente', sub: 'calorisch dicht' },
    b: { title: 'Half bord groente + kip + portie rijst', sub: 'veel volume' },
    correct: 'b', reason: 'Vul je bord voor de helft met groente: veel volume voor weinig calorieën, je zit langer vol.',
  },
  {
    situation: 'diner', prompt: 'Je hebt zin in pizza. Slimste aanpak?',
    a: { title: '2 punten pizza + grote salade', sub: 'flexibel, vult' },
    b: { title: 'Een hele pizza', sub: 'zo over je calorieën' },
    correct: 'a', reason: 'Niks is verboden. Combineer pizza met groente, dan zit je vol voor veel minder calorieën dan een hele pizza.',
  },
  {
    situation: 'diner', prompt: 'Welke aardappel kies je?',
    a: { title: 'Gebakken aardappels in olie', sub: 'bakvet = extra kcal' },
    b: { title: 'Gepofte of gekookte aardappel', sub: 'zelfde vulling, minder kcal' },
    correct: 'b', reason: 'Bakvet voegt flink calorieën toe zonder extra verzadiging. Gekookt of gepoft vult net zo goed.',
  },
  {
    situation: 'diner', prompt: 'Welke saus bij je pasta?',
    a: { title: 'Tomaten- of groentesaus', sub: 'vult, weinig kcal' },
    b: { title: 'Romige saus', sub: 'calorisch dicht' },
    correct: 'a', reason: 'Roomsaus is calorisch dicht; een tomaten- of groentesaus scheelt veel en vult net zo goed.',
  },

  // ── Pre workout ──
  {
    situation: 'pre-workout', prompt: 'Voor je training, wat doe je?',
    a: { title: 'Niks eten, op honger trainen', sub: 'minder kracht' },
    b: { title: 'Banaan met wat kwark, 30-60 min ervoor', sub: 'energie + herstel' },
    correct: 'b', reason: 'Een lichte koolhydraat met eiwit geeft energie en herstel. Op honger trainen kost je kracht en focus.',
  },
  {
    situation: 'pre-workout', prompt: 'Wanneer en wat eet je voor het sporten?',
    a: { title: 'Lichte snack 30-60 min ervoor', sub: 'energie, ligt licht' },
    b: { title: 'Zware, vette maaltijd vlak ervoor', sub: 'ligt zwaar' },
    correct: 'a', reason: 'Vet en grote porties verteren langzaam en liggen zwaar. Licht eten geeft energie zonder steen in je maag.',
  },
  {
    situation: 'pre-workout', prompt: 'Snelle energie voor de gym?',
    a: { title: 'Suikerreep voor een kick', sub: 'piek en dip' },
    b: { title: 'Banaan + paar rijstwafels', sub: 'stabiele energie' },
    correct: 'b', reason: 'Hele voeding geeft stabielere energie. Een suikerreep geeft een piek en daarna een dip middenin je training.',
  },

  // ── Avond snack ──
  {
    situation: 'avond-snack', prompt: 'Snack van ~300 kcal. Welke houdt je langer vol?',
    a: { title: 'Klein zakje chips', sub: 'zo op, weinig verzadiging' },
    b: { title: 'Bak magere kwark met fruit', sub: 'eiwit + volume' },
    correct: 'b', reason: 'Zelfde calorieën, maar de kwark (eiwit + volume) houdt je veel langer vol. Dé kernvraag bij vetverlies: wat verzadigt het meest per calorie?',
  },
  {
    situation: 'avond-snack', prompt: 'Trek op de bank. Wat pak je?',
    a: { title: 'Eiwitreep of magere kwark', sub: 'vult, eiwit' },
    b: { title: 'Handvol koekjes', sub: 'zo op' },
    correct: 'a', reason: 'Eiwit vult; koekjes zijn zo op en geven amper verzadiging.',
  },
  {
    situation: 'avond-snack', prompt: 'Avondhapje dat in je tekort past?',
    a: { title: 'Kaas- en worstplankje', sub: 'calorisch dicht' },
    b: { title: 'Skyr of magere kwark met bessen', sub: 'hoog eiwit, vult' },
    correct: 'b', reason: 'Veel minder calorieën, hoog in eiwit, en het houdt je vol tot je gaat slapen.',
  },
  {
    situation: 'avond-snack', prompt: 'Zin in iets zoets? Slimste keuze?',
    a: { title: '"Proteïne-ijs" (kwark met cacao)', sub: 'lekker, minder kcal' },
    b: { title: 'Bak roomijs', sub: 'snel veel calorieën' },
    correct: 'a', reason: 'Flexibel en lekker, maar veel minder calorieën dan roomijs, zo blijf je gewoon in je tekort.',
  },

  // ── Voor bed ──
  {
    situation: 'voor-bed', prompt: 'Honger vlak voor bed. Wat doe je?',
    a: { title: 'Niks, met honger naar bed', sub: 'lig je wakker van' },
    b: { title: 'Kleine eiwitrijke snack (kwark/skyr)', sub: 'herstel, voldaan' },
    correct: 'b', reason: 'Een beetje eiwit voor de nacht helpt herstel en voorkomt nacht-honger, zonder je tekort te slopen.',
  },
  {
    situation: 'voor-bed', prompt: 'Laat op de avond nog trek?',
    a: { title: 'Een lichte eiwitrijke snack', sub: 'past in je dag' },
    b: { title: 'Nog een volle maaltijd', sub: 'snel over je calorieën' },
    correct: 'a', reason: 'Laat nog groot eten gaat snel over je calorieën. Licht en eiwitrijk past beter en houdt je voldaan.',
  },
  {
    situation: 'voor-bed', prompt: 'Wat drink je nog voor het slapen?',
    a: { title: 'Glas frisdrank of sap', sub: 'vloeibare calorieën' },
    b: { title: 'Water of kruidenthee', sub: '0 kcal' },
    correct: 'b', reason: 'Vloeibare calorieën vlak voor bed tellen mee en vullen niet.',
  },

  // ── Restaurant ──
  {
    situation: 'restaurant', prompt: 'Je gaat uit eten. Welk hoofdgerecht past beter in je tekort?',
    a: { title: 'Romige pasta carbonara', sub: 'veel verborgen vet, zo op' },
    b: { title: 'Biefstuk met salade en gepofte aardappel', sub: 'mager eiwit + simpel' },
    correct: 'b', reason: 'Mager eiwit met simpele bijgerechten houdt je langer vol voor minder calorieën. Roomsaus is calorisch dicht en zo verdwenen.',
  },
  {
    situation: 'restaurant', prompt: 'Voorgerecht in het restaurant?',
    a: { title: 'Stokbrood met aioli', sub: 'veel kcal, vult amper' },
    b: { title: 'Carpaccio of garnalencocktail', sub: 'eiwit, vult' },
    correct: 'b', reason: 'Eiwit vult en kost weinig calorieën; brood met olie levert veel calorieën zonder verzadiging.',
  },
  {
    situation: 'restaurant', prompt: 'Welk bijgerecht bij je gerecht?',
    a: { title: 'Salade of gepofte aardappel', sub: 'vult, minder kcal' },
    b: { title: 'Portie friet', sub: 'calorisch dicht' },
    correct: 'a', reason: 'Friet is calorisch dicht; een ander bijgerecht scheelt veel en vult net zo goed.',
  },
  {
    situation: 'restaurant', prompt: 'Het dessert komt langs. Wat doe je?',
    a: { title: 'Iedereen een eigen dessert', sub: 'zo over je dag' },
    b: { title: 'Deel één dessert of neem koffie', sub: 'flexibel' },
    correct: 'b', reason: 'Niks is verboden. Deel het dessert of sla over en houd je dagtotaal kloppend.',
  },

  // ── McDonald's ──
  {
    situation: 'mcdonalds', prompt: "Je gaat naar de McDonald's. Welk menu past beter in je tekort?",
    a: { title: 'Big Mac menu, grote friet + cola', sub: 'caloriebom' },
    b: { title: 'Hamburger of McChicken, kleine friet + cola zero', sub: 'slim binnen dezelfde tent' },
    correct: 'b', reason: 'Niks is verboden, kies slim bínnen de McDonald’s. Cola zero + kleinere porties schelen zo 400+ kcal, en nog steeds lekker.',
  },
  {
    situation: 'mcdonalds', prompt: 'Wat drink je erbij?',
    a: { title: 'Milkshake', sub: 'vloeibare calorieën' },
    b: { title: 'Cola zero of water', sub: '0 kcal' },
    correct: 'b', reason: 'Vloeibare calorieën vullen niet maar tellen wel mee. Bewaar je calorieën voor eten dat je vol houdt.',
  },
  {
    situation: 'mcdonalds', prompt: 'Welke friet kies je?',
    a: { title: 'Kleine friet', sub: 'zelfde smaak, minder kcal' },
    b: { title: 'Grote friet', sub: 'fors meer calorieën' },
    correct: 'a', reason: 'Zelfde smaak, fors minder calorieën. Een makkelijke slimme ruil binnen dezelfde tent.',
  },
  {
    situation: 'mcdonalds', prompt: 'Toetje erbij?',
    a: { title: 'McFlurry of sundae', sub: 'snel veel suiker/kcal' },
    b: { title: 'Niks, of een gewone koffie', sub: 'bewaar je calorieën' },
    correct: 'b', reason: 'Het toetje is zo veel calorieën erbij. Wil je het echt, plan het in en laat dan elders iets vallen.',
  },

  // ── Feest ──
  {
    situation: 'feest', prompt: 'Borrel op een feest. Wat pak je van de tafel?',
    a: { title: 'Bord bitterballen en frituur', sub: 'loopt snel op' },
    b: { title: 'Handje nootjes, kaas en olijven', sub: 'beter te doseren' },
    correct: 'b', reason: 'Frituur loopt calorisch razendsnel op en is zo op. Eiwit/vet-hapjes vullen meer en zijn beter te doseren.',
  },
  {
    situation: 'feest', prompt: 'Drinken op het feest?',
    a: { title: 'De hele avond bier', sub: 'lege calorieën' },
    b: { title: 'Een paar drankjes met water ertussen', sub: 'bewust doseren' },
    correct: 'b', reason: 'Alcohol is pure lege calorieën. Doseren + water houdt je in je tekort zonder dat je niks hoeft te drinken.',
  },
  {
    situation: 'feest', prompt: 'Het buffet is open. Hoe pak je het aan?',
    a: { title: 'Eén ronde, bewust opscheppen', sub: 'in controle' },
    b: { title: 'Onbeperkt blijven pakken', sub: 'onbewust over je kcal' },
    correct: 'a', reason: 'Bewust één ronde kiezen voorkomt dat je ongemerkt ver over je calorieën gaat.',
  },
  {
    situation: 'feest', prompt: 'Wat drink je op het feest?',
    a: { title: 'Zoete cocktails', sub: 'vol suiker' },
    b: { title: 'Droge wijn of een light-mix', sub: 'minder lege kcal' },
    correct: 'b', reason: 'Zoete cocktails zitten vol suiker; droog of light scheelt veel lege calorieën.',
  },

  // ── Verjaardag ──
  {
    situation: 'verjaardag', prompt: 'Er is taart op een verjaardag. Wat is de slimste aanpak?',
    a: { title: 'Sla alles over en eet niks', sub: 'niet vol te houden' },
    b: { title: 'Neem een stuk en pas de rest van je dag aan', sub: 'flexibel' },
    correct: 'b', reason: 'Flexibel eten: niks is verboden. Eet bewust een stuk en houd je dagtotaal kloppend. Een streng verbod houd je niet vol.',
  },
  {
    situation: 'verjaardag', prompt: 'De hele dag hapjes op de verjaardag. Wat doe je?',
    a: { title: 'Onbewust de hele dag meesnoepen', sub: 'sloopt je tekort' },
    b: { title: 'Kies 1-2 dingen bewust uit en geniet', sub: 'past in je dag' },
    correct: 'b', reason: 'Onbewust meesnoepen sloopt je tekort zonder dat je het doorhebt. Bewust kiezen past prima in een flexibele aanpak.',
  },
  {
    situation: 'verjaardag', prompt: 'Hoeveel taart neem je?',
    a: { title: 'Eén stuk, bewust genieten', sub: 'past in je dag' },
    b: { title: 'Meerdere stukken', sub: 'sloopt je tekort' },
    correct: 'a', reason: 'Eén stuk past flexibel in je dag; meerdere stukken tikken je tekort zo weg.',
  },
  {
    situation: 'verjaardag', prompt: 'Je hebt al wat gesnoept. Mindset?',
    a: { title: '"Dag toch verpest, dus alles maar"', sub: 'spiraal naar beneden' },
    b: { title: 'Geniet bewust, pak je routine weer op', sub: 'één moment telt niet' },
    correct: 'b', reason: 'Eén moment verpest niks. Gewoon flexibel je volgende maaltijd weer oppakken houdt je op koers.',
  },
]

export default function NutritionChoiceTrainer({ isMobile }) {
  const [situation, setSituation] = useState('ontbijt')
  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [dropOpen, setDropOpen] = useState(false)

  const rounds = useMemo(() => ROUNDS.filter(r => r.situation === situation), [situation])
  const round = rounds.length ? rounds[index % rounds.length] : null

  const pickSituation = (id) => {
    setSituation(id); setIndex(0); setChosen(null); setScore({ correct: 0, total: 0 })
  }
  const choose = (opt) => {
    if (chosen || !round) return
    const right = opt === round.correct
    setChosen(opt)
    setScore(s => ({ correct: s.correct + (right ? 1 : 0), total: s.total + 1 }))
  }
  const next = () => { setChosen(null); setIndex(i => i + 1) }

  // Na een antwoord automatisch doorgaan naar de volgende vraag.
  useEffect(() => {
    if (!chosen) return
    const t = setTimeout(() => { setChosen(null); setIndex(i => i + 1) }, AUTO_MS)
    return () => clearTimeout(t)
  }, [chosen])

  const optionCard = (key) => {
    const o = round[key]
    const isCorrect = round.correct === key
    const isChosen = chosen === key
    let border = CARD_BORDER
    if (chosen) {
      if (isCorrect) border = `2px solid ${GREEN}`
      else if (isChosen) border = `2px solid ${RED}`
    }
    return (
      <button
        onClick={() => choose(key)}
        disabled={!!chosen}
        style={{
          flex: 1, minWidth: 0, textAlign: 'left', cursor: chosen ? 'default' : 'pointer', padding: 0,
          background: CARD_BG, border, borderRadius: 14, overflow: 'hidden',
          transition: 'all 0.25s ease', position: 'relative', display: 'block',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          opacity: chosen && !isCorrect && !isChosen ? 0.55 : 1,
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: isMobile ? 92 : 130, background: 'rgba(0,0,0,0.4)' }}>
          <img src={getFoodImage(o.title)} alt={o.title} onError={(e) => { e.currentTarget.src = FOOD_FALLBACK }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: chosen && !isCorrect && !isChosen ? 'brightness(0.6)' : 'none' }} />
          {chosen && isCorrect && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: '50%', background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={isMobile ? 14 : 17} color="#fff" strokeWidth={3.5} />
            </span>
          )}
          {chosen && isChosen && !isCorrect && (
            <span style={{ position: 'absolute', top: 6, right: 6, width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={isMobile ? 14 : 17} color="#fff" strokeWidth={3} />
            </span>
          )}
        </div>
        <div style={{ padding: isMobile ? '0.6rem 0.65rem 0.75rem' : '0.95rem 1.1rem 1.1rem' }}>
          <span style={{ display: 'block', fontSize: isMobile ? '0.9rem' : '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{o.title}</span>
          <span style={{ display: 'block', marginTop: 3, fontSize: isMobile ? '0.72rem' : '0.85rem', fontWeight: 500, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{o.sub}</span>
        </div>
      </button>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header — los op de pagina (geen card): grote witte bold titel + subtekst */}
      <h2 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>Slim kiezen</h2>
      <p style={{ margin: '0.5rem 0 0', fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 500, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, maxWidth: 560 }}>
        Leer de juiste keuze maken: kies wat je <b style={{ color: '#fff' }}>langer vol houdt bij ±dezelfde calorieën</b>. Niks is verboden, het past zolang het in je tekort past.
      </p>

      {/* Picker-label */}
      <h3 style={{ margin: isMobile ? '1.5rem 0 0.5rem' : '1.75rem 0 0.55rem', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 900, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Kies jouw gelegenheid
      </h3>

      {/* Gelegenheid-dropdown */}
      <div style={{ position: 'relative', marginBottom: isMobile ? '1.25rem' : '1.5rem', maxWidth: 300 }}>
        <button onClick={() => setDropOpen(o => !o)} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 0.95rem', borderRadius: 11,
          background: 'rgba(255,255,255,0.05)', border: dropOpen ? `1.5px solid ${GOLD}` : '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 800, cursor: 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        }}>
          {SITUATIONS.find(s => s.id === situation)?.label || 'Kies'}
          <ChevronDown size={18} color={GOLD} strokeWidth={3} style={{ transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
        </button>
        {dropOpen && (
          <>
            <div onClick={() => setDropOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, zIndex: 41, background: '#141414', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 11, overflow: 'hidden', maxHeight: 300, overflowY: 'auto', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}>
              {SITUATIONS.map((s, i) => {
                const activeS = situation === s.id
                return (
                  <button key={s.id} onClick={() => { pickSituation(s.id); setDropOpen(false) }} style={{
                    width: '100%', textAlign: 'left', padding: isMobile ? '0.7rem 0.85rem' : '0.75rem 0.95rem',
                    background: activeS ? 'rgba(255,215,0,0.1)' : 'transparent', border: 'none',
                    borderBottom: i < SITUATIONS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    color: activeS ? GOLD : 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontWeight: activeS ? 800 : 600,
                    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  }}>{s.label}</button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {!round ? (
        /* Lege gelegenheid — placeholder */
        <div style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16, padding: isMobile ? '2rem 1.25rem' : '2.5rem 2rem', textAlign: 'center' }}>
          <UtensilsCrossed size={30} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff' }}>Nog geen vragen voor deze gelegenheid</p>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Die werken we later samen uit.</p>
        </div>
      ) : (
        <>
          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '0.85rem' : '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Score: <span style={{ color: GOLD }}>{score.correct}</span> / {score.total}
            </span>
            <button onClick={() => pickSituation(situation)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          {/* Vraag */}
          <h3 style={{ margin: '0 0 1.1rem', fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: '-0.01em' }}>
            {round.prompt}
          </h3>

          {/* Opties — altijd naast elkaar (ook op telefoon) */}
          <div style={{ display: 'flex', flexDirection: 'row', gap: isMobile ? 10 : 16, alignItems: 'stretch' }}>
            {optionCard('a')}
            {optionCard('b')}
          </div>

          {/* Feedback + volgende */}
          {chosen && (
            <div style={{ marginTop: isMobile ? '1.25rem' : '1.5rem', animation: 'labFade 0.3s ease' }}>
              <div style={{ padding: isMobile ? '0.9rem 1rem' : '1rem 1.25rem', background: 'rgba(255,215,0,0.07)', border: `1px solid ${GOLD}33`, borderRadius: 12 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.08em', color: GOLD, textTransform: 'uppercase' }}>Waarom</span>
                <p style={{ margin: '0.35rem 0 0', fontSize: isMobile ? '0.95rem' : '1.02rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, lineHeight: 1.45 }}>{round.reason}</p>
              </div>
              {/* Aflopende timer — gaat vanzelf door */}
              <div style={{ marginTop: '1rem', height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: GOLD, animation: `labTimer ${AUTO_MS}ms linear forwards` }} />
              </div>
              <button onClick={next} style={{
                marginTop: '0.6rem', width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: isMobile ? '0.9rem' : '1rem', background: GOLD, color: '#0a0a0a', border: 'none', borderRadius: 12,
                fontSize: '1rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}>
                Volgende <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes labFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes labTimer { from { width: 100% } to { width: 0% } }
      `}</style>
    </div>
  )
}
