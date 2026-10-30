// src/pages/calorie-calculator/bodyFat.js
// Foto-opties en rekenhulp voor de vetpercentage-kiezer. Apart van de component
// omdat een bestand dat zowel componenten als losse waarden exporteert de
// fast-refresh van Vite breekt (react-refresh/only-export-components).
//
// Dezelfde beelden als de MyArc-intake — beide halen ze uit
// `components/vetpercentage/fotos.js`.
import { BF_FOTOS } from '../../components/vetpercentage/fotos'

export const BF_OPTIES = [
  { value: 10, label: '7–10%',  sub: 'Aderen zichtbaar',  img: BF_FOTOS[10].src },
  { value: 14, label: '10–15%', sub: 'Sixpack, atletisch', img: BF_FOTOS[14].src },
  { value: 18, label: '15–20%', sub: 'Slank',              img: BF_FOTOS[18].src },
  { value: 23, label: '20–25%', sub: 'Gemiddeld',          img: BF_FOTOS[23].src },
  { value: 33, label: '25–35%', sub: 'Duidelijk buikje',   img: BF_FOTOS[33].src },
]

// Twee waarden → het gemiddelde ("tussenin"). Eén waarde → die waarde.
export const bfWaarde = (a, b) => {
  if (a == null) return null
  if (b == null) return a
  return Math.round((a + b) / 2)
}
