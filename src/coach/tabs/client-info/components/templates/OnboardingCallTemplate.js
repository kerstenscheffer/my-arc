// src/coach/tabs/client-info/components/templates/OnboardingCallTemplate.js
// ONBOARDING CALL - 3 MAANDEN

const OnboardingCallTemplate = {
  sections: [
    {
      id: 'doel',
      type: 'text',
      title: '🎯 Doel',
      content: `Doel:

Startgewicht: ___ kg
Streefgewicht: ___ kg`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'macros',
      type: 'text',
      title: '📊 Macro Doelen',
      content: `Calorieën: _____ kcal
Eiwit: _____ gram
Koolhydraten: _____ gram
Vetten: _____ gram`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'maaltijdplan',
      type: 'text',
      title: '🍽️ Maaltijdplan',
      content: `Notities tijdens het bouwen van maaltijdplan:



☐ PDF maaltijdplan meegegeven
☐ Boodschappenlijst meegegeven`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'wat_beter_kan',
      type: 'text',
      title: '⚠️ Wat Beter Kan',
      content: `Dingen die opvielen tijdens het gesprek:

`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'training',
      type: 'text',
      title: '💪 Training',
      content: `Schema: _______________
Dagen per week: ___
Notities:

`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'app',
      type: 'text',
      title: '📱 App Uitleg',
      content: `☐ Uitgelegd waar alles te vinden is
☐ Wekelijkse weging uitgelegd (elke week gewicht in app)

Notities:

`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'afspraken',
      type: 'text',
      title: '📋 Afspraken',
      content: `Afspraken voor komende periode:



☐ Afspraken PDF meegegeven
☐ Check-in ingevuld na call`,
      timestamp: new Date().toISOString()
    },
    {
      id: 'afsluiting',
      type: 'text',
      title: '✅ Afsluiting',
      content: `Meegegeven:
☐ Macro targets
☐ Maaltijdplan PDF
☐ Boodschappenlijst
☐ Workout schema
☐ Afspraken PDF

Volgende call: _______________`,
      timestamp: new Date().toISOString()
    }
  ]
}

export default OnboardingCallTemplate
