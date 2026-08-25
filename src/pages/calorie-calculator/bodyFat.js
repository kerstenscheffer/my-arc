// src/pages/calorie-calculator/bodyFat.js
// Foto-opties en rekenhulp voor de vetpercentage-kiezer. Apart van de component
// omdat een bestand dat zowel componenten als losse waarden exporteert de
// fast-refresh van Vite breekt (react-refresh/only-export-components).
//
// Dezelfde beelden als de MyArc-intake
// (`modules/public-intake/components/phase1/BodyFlow.jsx`) — nieuwe foto's
// hoeven dus maar op twee plekken vervangen te worden.
export const BF_OPTIES = [
  { value: 10, label: '7–10%',  sub: 'Aderen zichtbaar',  img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { value: 14, label: '10–15%', sub: 'Sixpack, atletisch', img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { value: 18, label: '15–20%', sub: 'Slank',              img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { value: 23, label: '20–25%', sub: 'Gemiddeld',          img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
  { value: 33, label: '25–35%', sub: 'Duidelijk buikje',   img: 'https://i.ibb.co/RGKN8LZr/Scherm-afbeelding-2026-03-27-om-12-39-02.png' },
]

// Twee waarden → het gemiddelde ("tussenin"). Eén waarde → die waarde.
export const bfWaarde = (a, b) => {
  if (a == null) return null
  if (b == null) return a
  return Math.round((a + b) / 2)
}
