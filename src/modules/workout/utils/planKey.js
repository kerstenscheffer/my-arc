// src/modules/workout/utils/planKey.js
//
// Een dag in clients.workout_schedule kan drie soorten waarde hebben:
//   'dag1'                      -> dag uit het actieve plan
//   'custom_<id>'               -> eigen training van de klant
//   'plan_<schemaId>__<dagKey>' -> dag uit een ÁNDER plan van de klant
// Die laatste bestaat sinds 8 okt 2026 (call Martijn): hij traint wisselend
// 2 of 3 keer en wil per dag vrij Upper/Lower/Full body uit zijn plannen
// combineren, zonder van actief plan te wisselen.

export const maakPlanKey = (schemaId, dagKey) => `plan_${schemaId}__${dagKey}`

export const ontleedPlanKey = (key) => {
  if (typeof key !== 'string' || !key.startsWith('plan_')) return null
  const i = key.indexOf('__')
  if (i < 0) return null
  return { schemaId: key.slice(5, i), dagKey: key.slice(i + 2) }
}
