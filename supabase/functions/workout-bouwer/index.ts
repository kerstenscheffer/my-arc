// supabase/functions/workout-bouwer/index.ts
//
// Zet na de intake een CONCEPT-trainingsplan klaar (18 nov 2026). De regels
// staan in kern.ts; hier alleen ophalen, toegang en opslaan.
//
// Het concept is een rij in workout_schemas ZONDER client_id: de klant-app
// toont elk plan met zijn client_id als keuze, dus een concept mag dat veld
// pas krijgen als de coach het goedkeurt. De koppeling staat in
// generation_options: { concept_voor, status: 'concept', brief }.
//
// Body: { client_id, dry_run? }. dry_run geeft het plan terug zonder opslaan.
// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { bouwConcept } from './kern.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-testsleutel',
}

async function laad(sb: SupabaseClient, clientId: string) {
  const { data: klant, error } = await sb.from('clients')
    .select('id, first_name, gender, date_of_birth, injuries, preferred_training_days, auth_user_id, trainer_id, coach_id')
    .eq('id', clientId).single()
  if (error || !klant) throw new Error('Klant niet gevonden')
  const ids = [klant.auth_user_id, klant.id].filter(Boolean)
  const { data: wps } = await sb.from('user_workout_preferences').select('*').in('user_id', ids)
    .order('workout_completed_at', { ascending: false, nullsFirst: false }).limit(1)
  const { data: templates } = await sb.from('workout_schemas')
    .select('id, name, days_per_week, doelgroep, week_structure, cyclus, created_at, is_archived')
    .eq('is_canoniek', true).eq('is_template', true)
  return { klant, wp: wps?.[0] || null, templates: (templates || []).filter((t: any) => !t.is_archived) }
}

async function slaOp(sb: SupabaseClient, klant: any, wp: any, r: ReturnType<typeof bouwConcept>) {
  const rij = {
    name: r.name,
    description: r.brief.samenvatting,
    client_name: String(klant.first_name || '').trim() || null,
    primary_goal: 'muscle_gain',
    experience_level: ['beginner', 'intermediate', 'advanced'].includes(wp?.default_experience_level) ? wp.default_experience_level : 'intermediate',
    days_per_week: r.days_per_week,
    time_per_session: r.brief.klant.tijd,
    split_type: 'custom',
    week_structure: r.week_structure,
    cyclus: r.cyclus,
    is_public: false, is_template: false, is_ai_generated: true,
    original_schema_id: r.basis.id,
    generation_options: { concept_voor: klant.id, status: 'concept', brief: r.brief },
  }
  // Staat er al een concept dat nog niet is goedgekeurd: dat vervangen.
  const { data: bestaand } = await sb.from('workout_schemas').select('id')
    .is('client_id', null).eq('generation_options->>concept_voor', klant.id).eq('generation_options->>status', 'concept')
    .order('created_at', { ascending: false }).limit(1)
  let id = bestaand?.[0]?.id as string | undefined
  if (id) {
    const { error } = await sb.from('workout_schemas').update(rij).eq('id', id)
    if (error) throw error
  } else {
    const { data, error } = await sb.from('workout_schemas')
      .insert({ ...rij, user_id: klant.trainer_id || klant.coach_id || null }).select('id').single()
    if (error) throw error
    id = data.id
  }
  const n = r.brief.nakijken.length
  // Geen plan_id in action_data: de bel opent daarmee de Plan Analyzer (voeding).
  await sb.rpc('create_intake_notification', {
    p_client_id: klant.id, p_type: 'plan_ready', p_priority: 'high',
    p_title: `Concept-trainingsplan klaar: ${String(klant.first_name || '').trim()}`,
    p_message: n ? `Automatisch gebouwd na de intake. ${n} punt(en) om na te kijken. Open via Coach Inzicht → Workout.` : 'Automatisch gebouwd na de intake. Open via Coach Inzicht → Workout.',
    p_action_type: 'review_workout', p_action_data: { client_id: klant.id, schema_id: id, soort: 'workout_concept' },
  }).then((x: any) => x, () => null)
  return id
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } })
  try {
    const { client_id, dry_run } = await req.json()
    if (!client_id) return json({ error: 'client_id ontbreekt' }, 400)
    const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Wie mag dit aanroepen? Een ingelogde coach van deze klant altijd.
    // Zonder login (de intake zelf) alleen vlak na een afgeronde
    // trainingsintake, en niet vaker dan eens per 10 minuten.
    const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
    const { data: gebruiker } = jwt ? await sb.auth.getUser(jwt).then((x: any) => x, () => ({ data: null })) : { data: null as any }
    const uid = gebruiker?.user?.id
    // Proefruns vanuit de database (pg_net) met de testsleutel uit de Vault,
    // dezelfde als bij plan-bouwer.
    const testsleutel = req.headers.get('x-testsleutel')
    const isTest = !!testsleutel && !!(await sb.rpc('plan_bouwer_test_ok', { p_sleutel: testsleutel })).data
    const isCoach = isTest || (!!uid && !!(await sb.from('clients').select('id').eq('id', client_id)
      .or(`coach_id.eq.${uid},trainer_id.eq.${uid}`).maybeSingle()).data)

    const { klant, wp, templates } = await laad(sb, client_id)
    if (!isCoach) {
      if (dry_run) return json({ error: 'dry_run alleen voor de coach' }, 403)
      const vers = wp?.workout_completed && wp.workout_completed_at && Date.now() - new Date(wp.workout_completed_at).getTime() < 3 * 3600_000
      const { data: recent } = await sb.from('workout_schemas').select('id')
        .eq('generation_options->>concept_voor', client_id).gte('updated_at', new Date(Date.now() - 10 * 60_000).toISOString()).limit(1)
      if (!vers || recent?.length) return json({ error: 'niet toegestaan' }, 403)
    }
    if (String(wp?.training_willingness || '').toLowerCase() === 'no') return json({ ok: true, overgeslagen: 'klant wil niet trainen' })

    const r = bouwConcept({ klant, wp, templates })
    if (dry_run) return json({ plan: r })
    const id = await slaOp(sb, klant, wp, r)
    // De intake zelf (niet ingelogd) krijgt alleen te horen dat het gelukt is.
    return json(isCoach ? { ok: true, schema_id: id, brief: r.brief } : { ok: true })
  } catch (e) {
    console.error('workout-bouwer', (e as Error)?.message || e)
    return json({ error: String((e as Error)?.message || e) }, 500)
  }
})
