// src/modules/workout/services/planWijzigingLog.js
//
// Elke wijziging die een klant zelf aan zijn trainingsplan doet — wissel voor
// deze week, permanent wisselen, oefening toevoegen, weghalen of overslaan —
// komt als regel in client_plan_changes. De coach ziet die in het inzicht
// (WorkoutColumn) met "door klant" erbij (Kersten, 13 okt 2026).
//
// Loggen mag de actie zelf nooit breken: fouten worden alleen gelogd.

export async function logPlanWijziging(db, { client, schema, dayKey, soort, oefening, was = null }) {
  try {
    const sb = db?.supabase
    if (!sb || !client?.id || !soort) return
    const { data: { user } = {} } = await sb.auth.getUser()
    // Kijkt de coach mee als klant, dan is het een coach-wijziging.
    const door = user?.id && client.auth_user_id && user.id !== client.auth_user_id ? 'coach' : 'klant'
    const dag = schema?.week_structure?.[dayKey]
    const { error } = await sb.from('client_plan_changes').insert({
      client_id: client.id,
      schema_id: schema?.id || null,
      day_key: dayKey || null,
      dag_naam: dag?.name || dag?.focus || null,
      soort,
      oefening: oefening || null,
      was: was || null,
      door,
    })
    if (error) console.warn('Planwijziging loggen mislukt:', error.message)
  } catch (e) {
    console.warn('Planwijziging loggen mislukt:', e?.message)
  }
}
