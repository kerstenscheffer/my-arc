// src/modules/workout/utils/sessieVerwijderen.js
//
// Een per ongeluk gelogde training eruit (9 nov 2026). De sets gaan mee via de
// foreign key (workout_progress on delete cascade). Afgevinkt-status en
// bouwfase-feedback horen bij de dag: die gaan alleen weg als er die dag geen
// andere training meer staat.
export async function verwijderSessie(sb, sessionId) {
  const { data: rij, error: e0 } = await sb.from('workout_sessions').select('id, client_id, workout_date').eq('id', sessionId).maybeSingle()
  if (e0) throw e0
  if (!rij) throw new Error('Training niet gevonden')
  const { data: weg, error } = await sb.from('workout_sessions').delete().eq('id', sessionId).select('id')
  if (error) throw error
  if (!weg?.length) throw new Error('Geen rechten om deze training te verwijderen')
  const { count } = await sb.from('workout_sessions').select('id', { count: 'exact', head: true })
    .eq('client_id', rij.client_id).eq('workout_date', rij.workout_date)
  if (!count) {
    await sb.from('workout_completions').delete().eq('client_id', rij.client_id).eq('workout_date', rij.workout_date).then(r => r, () => null)
    await sb.from('training_feedback').delete().eq('client_id', rij.client_id).eq('datum', rij.workout_date).then(r => r, () => null)
  }
  window.dispatchEvent(new CustomEvent('myarc:workout-verwijderd'))
}
