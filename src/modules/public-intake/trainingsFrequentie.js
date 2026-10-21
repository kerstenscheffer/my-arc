// src/modules/public-intake/trainingsFrequentie.js
//
// Hoe vaak iemand per week wil trainen, uit de weekplanner van de intake.
// De gekozen frequentie ('Hoeveel dagen per week wil je trainen?', 0 = coach
// bepaalt) wint; pas zonder antwoord tellen we de aangevinkte voorkeursdagen.
// Eerst won het aantal dagen: 3x gekozen en 5 dagen beschikbaar werd 5x
// (Roshan, 21 okt 2026).
export const trainingsFrequentie = (pd) => {
  const f = pd?.preferred_training_frequency
  if (f != null && f !== '' && Number.isFinite(Number(f))) return Number(f)
  return pd?.preferred_training_days?.length || null
}
