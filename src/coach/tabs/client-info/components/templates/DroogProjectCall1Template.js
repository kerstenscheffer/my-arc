// src/coach/tabs/client-info/components/templates/DroogProjectCall1Template.js
// 5-8KG DROOG PROJECT - CALL 1: KICKOFF
// Interactive template met checkboxes en client message generator

const DroogProjectCall1Template = {
  sections: [
    {
      id: 'intro',
      type: 'checklist',
      title: '📞 Intro & Programma Uitleg',
      checkItems: [
        { id: 'intro_1', label: '5KG model (conservatief) / 8KG model (agressief) uitgelegd', checked: false },
        { id: 'intro_2', label: 'Week 8 beslissing moment genoemd', checked: false },
        { id: 'intro_3', label: 'Verwachte resultaten besproken: 5-8kg spier, +25% kracht, lean blijven', checked: false }
      ],
      notes: '',
      clientMessage: `Hey! 💪

Bedankt voor de kickoff call. Hier een recap:

🎯 **PROGRAMMA OPZET**
We gaan voor 5-8kg DROGE spiergroei in 26 weken.
- Eerste 8 weken: opbouwfase
- Week 8: belangrijke beslissing (5kg conservatief of 8kg agressief model)
- Verwachting: +5-8kg spier, +25% kracht, blijf lean (geen cut nodig)

📋 **VOLGENDE STAPPEN**
Check je email voor de complete checklist van Week -2.

Let's go! 🔥`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'criteria_check',
      type: 'checklist',
      title: '✅ Criteria Check',
      checkItems: [
        { id: 'crit_1', label: 'Body fat 10-15% (abs zichtbaar)', checked: false },
        { id: 'crit_2', label: 'Min. 6 maanden training ervaring', checked: false },
        { id: 'crit_3', label: 'Kent compound lifts (squat, bench, deadlift)', checked: false },
        { id: 'crit_4', label: 'Kan 4-6x per week trainen', checked: false },
        { id: 'crit_5', label: 'Kan voeding tracken (MyFitnessPal)', checked: false },
        { id: 'crit_6', label: 'Kan zelf koken/meal prep', checked: false },
        { id: 'crit_7', label: 'Heeft tijd voor wekelijkse check-ins', checked: false },
        { id: 'crit_8', label: 'Client voldoet aan ALLE criteria', checked: false }
      ],
      fields: [
        { id: 'bf_estimate', label: 'Body fat schatting', value: '', placeholder: '~12%' },
        { id: 'exp_months', label: 'Ervaring (maanden)', value: '', placeholder: '8 maanden' },
        { id: 'freq_week', label: 'Huidige frequentie', value: '', placeholder: '5x/week' }
      ],
      notes: '',
      clientMessage: null, // Geen client message voor interne check
      timestamp: new Date().toISOString()
    },
    {
      id: 'app_tour',
      type: 'checklist',
      title: '📱 App Tour',
      checkItems: [
        { id: 'app_1', label: 'Home - Dashboard overzicht getoond', checked: false },
        { id: 'app_2', label: 'Workout - Schema uitgelegd', checked: false },
        { id: 'app_3', label: 'Meal Plan - Week overzicht, macro\'s, water', checked: false },
        { id: 'app_4', label: 'Progress - Foto\'s uploaden, gewicht loggen', checked: false },
        { id: 'app_5', label: 'Calls - Planning bekeken', checked: false },
        { id: 'app_6', label: 'Profile - Settings uitgelegd', checked: false }
      ],
      notes: '',
      clientMessage: null,
      timestamp: new Date().toISOString()
    },
    {
      id: 'baseline_fotos',
      type: 'checklist',
      title: '📸 Baseline Foto\'s Instructies (Week -2)',
      checkItems: [
        { id: 'foto_1', label: 'Voor/zij/achterkant foto\'s uitgelegd', checked: false },
        { id: 'foto_2', label: 'Van bovenaf fotograferen (niet vooraf) benadrukt', checked: false },
        { id: 'foto_3', label: 'Goed licht belang uitgelegd', checked: false },
        { id: 'foto_4', label: 'Zelfde plek elke keer uitgelegd', checked: false },
        { id: 'foto_5', label: 'Upload in app (Progress tab) gedemonstreerd', checked: false }
      ],
      notes: '',
      clientMessage: `📸 **BASELINE FOTO'S - Week -2**

Maak deze week je start foto's. Super belangrijk voor later!

**HOW TO:**
- Voor/zij/achterkant (3 foto's)
- Fotografeer van bovenaf (niet vooraf - geeft vertekend beeld)
- Zelfde plek, zelfde licht elke keer
- Upload in app → Progress tab

**TIMING:**
Doe dit binnen 3 dagen, zelfde moment als je gaat wegen (ochtend, na wc).

Heb je vragen? Stuur me een berichtje! 📲`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'metingen',
      type: 'checklist',
      title: '📏 Metingen Instructies (Week -2)',
      checkItems: [
        { id: 'meet_1', label: 'Touwtje methode uitgelegd (omknoopt → naast meetlint)', checked: false },
        { id: 'meet_2', label: 'Waist meting (op navel) gedemonstreerd', checked: false },
        { id: 'meet_3', label: 'Chest (breedste punt) uitgelegd', checked: false },
        { id: 'meet_4', label: 'Arms (beide, bicep peak) uitgelegd', checked: false },
        { id: 'meet_5', label: 'Thighs (beide, mid-thigh) uitgelegd', checked: false }
      ],
      fields: [
        { id: 'waist_cm', label: 'Waist', value: '', placeholder: '85 cm' },
        { id: 'chest_cm', label: 'Chest', value: '', placeholder: '102 cm' },
        { id: 'arms_l', label: 'Arms L', value: '', placeholder: '38 cm' },
        { id: 'arms_r', label: 'Arms R', value: '', placeholder: '38 cm' },
        { id: 'thighs_l', label: 'Thighs L', value: '', placeholder: '58 cm' },
        { id: 'thighs_r', label: 'Thighs R', value: '', placeholder: '58 cm' }
      ],
      notes: '',
      clientMessage: `📏 **BASELINE METINGEN - Week -2**

We gaan 4 metingen doen met de touwtje-methode:

**TOUWTJE METHODE:**
1. Wikkel touwtje om lichaamsdeel
2. Knoop vast waar touwtje elkaar raakt
3. Leg touwtje naast meetlint
4. Lees aantal cm af

**WAT METEN:**
- Waist (op navel)
- Chest (breedste punt)
- Arms (beide armen, bicep peak)
- Thighs (beide benen, midden bovenbeen)

Stuur me de cijfers door via de app (Progress → Measurements).

Klaar binnen 3 dagen! 💪`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'gewicht',
      type: 'checklist',
      title: '⚖️ Gewicht Protocol (Week -2)',
      checkItems: [
        { id: 'weight_1', label: 'Elke ochtend wegen (7 dagen) uitgelegd', checked: false },
        { id: 'weight_2', label: 'Zelfde tijd benadrukt (na wc, voor ontbijt)', checked: false },
        { id: 'weight_3', label: 'Gewicht in app zetten gedemonstreerd', checked: false }
      ],
      fields: [
        { id: 'start_weight', label: 'Start gewicht', value: '', placeholder: '78.5 kg' }
      ],
      notes: '',
      clientMessage: `⚖️ **GEWICHT PROTOCOL - Week -2**

Vanaf nu elke ochtend wegen. We hebben 7 dagen data nodig voor een goed gemiddelde.

**PROTOCOL:**
- Elke ochtend zelfde tijd
- NA wc, VOOR ontbijt
- Log gewicht direct in app (Progress → Weight)

**WAAROM 7 DAGEN?**
Gewicht fluctueert dagelijks (water, zout, slaap). Het 7-daags gemiddelde is de echte waarde.

Start vandaag! We bespreken de cijfers in de volgende call. 📊`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'baseline_lifts',
      type: 'checklist',
      title: '💪 Baseline Lifts (Week -2)',
      checkItems: [
        { id: 'lift_1', label: 'Test alle compound lifts in gym uitgelegd', checked: false },
        { id: 'lift_2', label: 'Workouts loggen in app gedemonstreerd', checked: false }
      ],
      fields: [
        { id: 'squat_kg', label: 'Squat', value: '', placeholder: '100 kg' },
        { id: 'bench_kg', label: 'Bench Press', value: '', placeholder: '80 kg' },
        { id: 'deadlift_kg', label: 'Deadlift', value: '', placeholder: '120 kg' },
        { id: 'pulldown_kg', label: 'Lat Pulldown', value: '', placeholder: '70 kg' }
      ],
      notes: '',
      clientMessage: `💪 **BASELINE LIFTS - Week -2**

Test je kracht deze week. We gaan dit over 8 weken vergelijken (+10-15% verwacht!).

**WELKE OEFENINGEN:**
- Squat (working set, ~6 reps)
- Bench Press (working set, ~6 reps)
- Deadlift (working set, ~6 reps)  
- Lat Pulldown (working set, ~8 reps)

**HOE LOGGEN:**
Doe je normale workout en log alles in de app (Workout tab).

Focus op vorm, niet op max gewicht! We bouwen dit op. 🏋️`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'volgende_call',
      type: 'checklist',
      title: '📅 Volgende Call Inplannen',
      checkItems: [
        { id: 'call2_1', label: 'Week -1 Call ingepland (TDEE & Meal Plan Setup)', checked: false },
        { id: 'call2_2', label: 'Client weet wat mee te brengen (7-daagse tracking data)', checked: false }
      ],
      fields: [
        { id: 'call2_date', label: 'Datum', value: '', placeholder: 'Maandag 13 jan' },
        { id: 'call2_time', label: 'Tijd', value: '', placeholder: '19:00' }
      ],
      notes: '',
      clientMessage: `📅 **VOLGENDE CALL - Week -1**

We hebben onze volgende call ingepland!

**WANNEER:**
[DATUM] om [TIJD]

**DOEL:**
TDEE berekenen + je persoonlijke meal plan maken

**WAT JIJ MOET DOEN:**
7 dagen ALLES tracken in MyFitnessPal. Echt alles - ook die avond snacks! 😅
We gebruiken dit om je calorie behoefte te berekenen.

**CHECKLIST VOOR DIE CALL:**
✅ 7 dagen volledig getracked in MyFitnessPal
✅ Baseline foto's gemaakt
✅ Metingen gedaan (waist, chest, arms, thighs)
✅ Elke dag gewogen
✅ Baseline lifts getest

Zet alles in je agenda! See you next week. 💯`,
      timestamp: new Date().toISOString()
    }
  ]
}

export default DroogProjectCall1Template
