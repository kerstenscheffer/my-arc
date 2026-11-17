// src/modules/coach-command-center/utils/intakeLichaam.js
//
// De lichaamsfoto's uit de intake (public-intake BodyFlow + GoalFlow), zodat
// de coach terugziet welk lichaam de klant aanklikte: waar hij nu staat (één
// foto, of twee als hij 'ertussenin' koos) en waar hij naartoe wil.
//
// De plaatjes staan in public/intake-lichaam (17 nov 2026): dezelfde als in de
// intake, maar niet meer van i.ibb.co geladen, want die host gaf af en toe 503.

const VET_FOTOS = [
  { pct: 10, label: '7–10%',  img: '/intake-lichaam/vet-10.png' },
  { pct: 14, label: '10–15%', img: '/intake-lichaam/vet-14.png' },
  { pct: 18, label: '15–20%', img: '/intake-lichaam/vet-18.png' },
  { pct: 23, label: '20–25%', img: '/intake-lichaam/vet-23.png' },
  { pct: 33, label: '25–35%', img: '/intake-lichaam/vet-33.png' },
]

const SPIER_FOTOS = {
  lean:     { label: 'Slank & atletisch',     img: '/intake-lichaam/spier-lean.png' },
  muscular: { label: 'Gespierd & droog',      img: '/intake-lichaam/spier-muscular.png' },
  big:      { label: 'Heel gespierd & bulk',  img: '/intake-lichaam/spier-big.png' },
  shredded: { label: 'Heel gespierd & droog', img: '/intake-lichaam/spier-shredded.png' },
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
