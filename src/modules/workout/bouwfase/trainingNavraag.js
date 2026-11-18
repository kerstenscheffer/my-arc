// src/modules/workout/bouwfase/trainingNavraag.js
//
// "Hoe was je training van gisteren?" (18 nov 2026). Trainingen sluiten zichzelf
// af op de server (supabase/training-afsluiten.sql), maar het cijfer en "te
// lang / goed / kan meer" kan alleen de klant geven. Wie dat na de training
// niet invulde, krijgt één melding voor de laatste training van de afgelopen
// drie dagen. De melding staat in het meldingenpaneel aan de zijkant
// (NotificationWidget), dus op elke pagina. Wegtikken onthoudt hij per training.
import { leesActieveFase, vandaagIso } from './bouwfaseData'

const SLEUTEL = 'myarc_navraag_weg'
const isoVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function dagWoord(iso) {
  const gisteren = new Date(); gisteren.setDate(gisteren.getDate() - 1)
  if (isoVan(gisteren) === iso) return 'gisteren'
  return new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'long' })
}

// Geeft { sessie, fase, dag } of null als er niets te vragen valt.
export async function zoekNavraag(sb, clientId) {
  if (!sb || !clientId) return null
  const vanaf = new Date(); vanaf.setDate(vanaf.getDate() - 3)
  const { data: sessies } = await sb.from('workout_sessions')
    .select('id, workout_date, day_display_name, workout_progress ( id )')
    .eq('client_id', clientId).gte('workout_date', isoVan(vanaf)).lt('workout_date', vandaagIso())
    .order('workout_date', { ascending: false }).limit(4)
    .then(r => r, () => ({ data: [] }))
  const laatste = (sessies || []).find(s => (s.workout_progress || []).length > 0)
  if (!laatste) return null
  let weg = []
  try { weg = JSON.parse(localStorage.getItem(SLEUTEL) || '[]') } catch { weg = [] }
  if (Array.isArray(weg) && weg.includes(laatste.id)) return null
  const { data: fb } = await sb.from('training_feedback').select('id')
    .eq('client_id', clientId).eq('soort', 'workout').eq('datum', laatste.workout_date).limit(1)
    .then(r => r, () => ({ data: [{ id: 'onbekend' }] })) // bij een fout liever geen melding dan een dubbele vraag
  if (fb?.length) return null
  const fase = await leesActieveFase(sb, clientId).then(x => x, () => null)
  return { sessie: laatste, fase: fase || null, dag: dagWoord(laatste.workout_date) }
}

export function navraagWeg(sessieId) {
  try {
    const weg = JSON.parse(localStorage.getItem(SLEUTEL) || '[]')
    localStorage.setItem(SLEUTEL, JSON.stringify([...(Array.isArray(weg) ? weg : []), sessieId].slice(-20)))
  } catch { /* dan komt hij de volgende keer nog één keer terug */ }
}
