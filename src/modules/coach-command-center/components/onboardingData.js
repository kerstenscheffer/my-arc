// src/modules/coach-command-center/components/onboardingData.js
//
// Vorm en samenvatting van een onboarding-gesprek. Apart van het formulier
// omdat een bestand dat naast een component ook constanten exporteert
// hot-reload breekt — dezelfde reden als bij checkinData.
//
// De volgorde volgt het gesprek: eerst waar we naartoe gaan, dan wat je
// laat zien, dan wat er in de weg zit, dan wat hij zelf gaat doen.

export const FASES = [
  { id: 'cut',         label: 'Vetverlies',             hint: 'met spierbehoud' },
  { id: 'build',       label: 'Spieropbouw',            hint: 'rustige opbouw' },
  { id: 'recomp',      label: 'Recomp',                 hint: 'tegelijk' },
  { id: 'maintenance', label: 'Onderhoud',              hint: 'vasthouden' },
]

// Wat je tijdens de call op het scherm laat zien. Twee vinkjes per
// onderdeel en niet één: het plan laten zien is iets anders dan uitleggen
// hoe hij het bijhoudt, en juist dat tweede wordt vergeten.
export const DOORLOPEN = [
  { id: 'training_tonen', label: 'Trainingsplan laten zien' },
  { id: 'training_loggen', label: 'Laten zien hoe hij training logt' },
  { id: 'voeding_tonen',  label: 'Voedingsplan laten zien' },
  { id: 'voeding_loggen', label: 'Laten zien hoe hij voeding logt' },
]

// De afspraken die je aan het eind herhaalt. Dit is het rijtje waar hij mee
// de week in gaat; als er één afvalt is het meestal deze.
export const AFSPRAKEN = [
  { id: 'fotos',     label: "Foto's uploaden" },
  { id: 'gewicht',   label: 'Gewicht bijhouden' },
  { id: 'checkin',   label: 'Vrijdag de check-in invullen' },
  { id: 'vragen',    label: 'Direct vragen stellen waar nodig' },
  { id: 'volgende',  label: 'Volgende call ingepland' },
  { id: 'duidelijk', label: 'Gevraagd of alles duidelijk is' },
]

export const LEEG = {
  fase: '',
  doel: '',              // waar gaan we naartoe, in zijn woorden
  streefgewicht: '',
  perWeek: '',
  doorlopen: {},         // id -> bool
  struggles: [{ s: '', o: '' }],
  afspraken: {},         // id -> bool
  notities: '',
  bericht: '',
  volgende: { wanneer: '', onderwerp: '' },
}

const faseLabel = (id) => FASES.find(f => f.id === id)?.label || ''

/** Leesbare samenvatting. Gaat mee als note en is wat je kopieert. */
export function samenvatting(s, clientNaam) {
  const r = []
  r.push(`ONBOARDING — ${clientNaam || ''}`)

  const plan = []
  if (s.fase) plan.push(`  Fase: ${faseLabel(s.fase)}`)
  if (s.doel) plan.push(`  Doel: ${s.doel}`)
  if (s.streefgewicht) plan.push(`  Streefgewicht: ${s.streefgewicht} kg`)
  if (s.perWeek) plan.push(`  Per week: ${s.perWeek} kg`)
  if (plan.length) r.push('', 'HET PLAN', ...plan)

  const gedaan = DOORLOPEN.filter(d => s.doorlopen?.[d.id])
  const open = DOORLOPEN.filter(d => !s.doorlopen?.[d.id])
  if (gedaan.length) {
    r.push('', 'DOORGENOMEN')
    gedaan.forEach(d => r.push(`  [x] ${d.label}`))
    // De niet-afgevinkte punten er expliciet bij. Een lijstje met alleen
    // vinkjes leest als "alles gedaan", ook als de helft ontbreekt.
    open.forEach(d => r.push(`  [ ] ${d.label}`))
  }

  const st = (s.struggles || []).filter(x => (x.s || '').trim() || (x.o || '').trim())
  if (st.length) {
    r.push('', 'WAAR HIJ TEGENAAN LOOPT → WAT WE DOEN')
    st.forEach(x => r.push(`  • ${x.s || '—'} → ${x.o || '—'}`))
  }

  const af = AFSPRAKEN.filter(a => s.afspraken?.[a.id])
  if (af.length) {
    r.push('', 'AFSPRAKEN')
    af.forEach(a => r.push(`  • ${a.label}`))
  }

  if (s.notities) r.push('', 'NOTITIES', '  ' + s.notities)
  if (s.bericht) r.push('', 'BERICHT NAAR CLIENT', '  ' + s.bericht)
  if (s.volgende?.wanneer || s.volgende?.onderwerp) {
    r.push('', `VOLGENDE CALL: ${s.volgende.wanneer || '—'} — ${s.volgende.onderwerp || ''}`)
  }
  return r.join('\n')
}

/**
 * Staat er iets in dit formulier?
 *
 * Nodig om te weten of een concept bewaard moet worden. Zonder deze controle
 * schrijft het openen van het venster voor élke klant een leeg concept weg.
 */
export function heeftInhoud(s) {
  if (!s) return false
  if ((s.fase || '').trim() || (s.doel || '').trim()) return true
  if ((s.streefgewicht || '').trim() || (s.perWeek || '').trim()) return true
  if ((s.notities || '').trim() || (s.bericht || '').trim()) return true
  if ((s.volgende?.wanneer || '').trim() || (s.volgende?.onderwerp || '').trim()) return true
  if (Object.values(s.doorlopen || {}).some(Boolean)) return true
  if (Object.values(s.afspraken || {}).some(Boolean)) return true
  if ((s.struggles || []).some(x => (x.s || '').trim() || (x.o || '').trim())) return true
  return false
}
