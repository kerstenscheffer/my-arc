// src/modules/coach-command-center/utils/intakeLichaam.js
//
// De lichaamsfoto's uit de intake (public-intake BodyFlow + GoalFlow), zodat
// de coach terugziet welk lichaam de klant aanklikte: waar hij nu staat (één
// foto, of twee als hij 'ertussenin' koos) en waar hij naartoe wil.

const VET_FOTOS = [
  { pct: 10, label: '7–10%',  img: 'https://i.ibb.co/Y7DfXsf7/Scherm-afbeelding-2026-03-27-om-12-38-24.png' },
  { pct: 14, label: '10–15%', img: 'https://i.ibb.co/Kjtqwfmq/Scherm-afbeelding-2026-03-27-om-12-39-55.png' },
  { pct: 18, label: '15–20%', img: 'https://i.ibb.co/3YNdy00M/Scherm-afbeelding-2026-03-27-om-12-38-46.png' },
  { pct: 23, label: '20–25%', img: 'https://i.ibb.co/d09DQn2f/Scherm-afbeelding-2026-03-27-om-12-38-54.png' },
  { pct: 33, label: '25–35%', img: 'https://i.ibb.co/RGKN8LZr/Scherm-afbeelding-2026-03-27-om-12-39-02.png' },
]

const SPIER_FOTOS = {
  lean:     { label: 'Slank & atletisch',     img: 'https://i.ibb.co/BVSLB4dg/Scherm-afbeelding-2026-04-03-om-11-02-33.png' },
  muscular: { label: 'Gespierd & droog',      img: 'https://i.ibb.co/yF4sXLc6/Scherm-afbeelding-2026-04-03-om-10-59-31.png' },
  big:      { label: 'Heel gespierd & bulk',  img: 'https://i.ibb.co/ynvJBcxW/Scherm-afbeelding-2026-04-03-om-11-01-08.png' },
  shredded: { label: 'Heel gespierd & droog', img: 'https://i.ibb.co/XrTRXk9h/Scherm-afbeelding-2026-04-03-om-11-00-52.png' },
}

// Dichtstbijzijnde foto bij een vetpercentage (doel 22% → de 20–25%-foto).
const vetFoto = (waarde) => {
  const n = parseFloat(waarde)
  if (!Number.isFinite(n)) return null
  return VET_FOTOS.reduce((b, f) => (Math.abs(f.pct - n) < Math.abs(b.pct - n) ? f : b))
}

// { nu: [foto, foto?], doel: [foto, foto?] } — leeg als de intake niets heeft.
export function intakeLichaamFotos(client) {
  const nu = [vetFoto(client?.current_body_fat), vetFoto(client?.current_body_fat_2)]
    .filter(Boolean)
    .filter((f, i, a) => a.findIndex(x => x.img === f.img) === i)
  const doel = []
  const doelVet = vetFoto(client?.target_body_fat)
  if (doelVet) doel.push({ ...doelVet, label: `~${Math.round(parseFloat(client.target_body_fat))}%` })
  const spier = SPIER_FOTOS[client?.muscle_goal_type]
  if (spier) doel.push(spier)
  return { nu, doel }
}
