// api/public-intake.js
// Server-side toegang tot de clients-tabel voor de publieke intake-pagina's
// (/myintake en /nutritionintake). Vervangt de directe anon-queries op
// clients, zodat de anon RLS-policies op clients dicht kunnen.
//
// Voorkeur: service_role key (bypasst RLS). De env-varnaam verschilt per
// Vercel-setup — de officiële Supabase-integratie gebruikt
// SUPABASE_SERVICE_ROLE_KEY, niet SUPABASE_SERVICE_KEY. We proberen alle
// gangbare namen. Als absolute terugval de PUBLIEKE anon-key (die staat ook
// in de client-bundle, dus veilig om te embedden). Zo crasht dit endpoint
// NOOIT meer bij module-load door een ontbrekende env-var — dat was de
// oorzaak van de lege "find-client failed (500)". De anon-terugval werkt
// zolang de clients-policies read_all/update_all open staan.
import { createClient } from '@supabase/supabase-js';

// Versie-marker — curl `/api/public-intake?diag=1` geeft dit terug. Zo zie je
// meteen of een deploy de nieuwe code écht live heeft (i.p.v. gokken).
const VERSION = 'pi-2026-10-07-ensure-client';

// De coach aan wie een nieuw account via de intake wordt gehangen. Eén coach
// in dit systeem; via env te overschrijven als dat ooit verandert.
const COACH_ID = (process.env.MYARC_COACH_ID || '5a0135ac-3188-499d-8682-ed6a179e5541').trim();
// Vast startwachtwoord voor accounts die via de intake ontstaan. Geen mail:
// de coach geeft het door, net als bij handmatig aangemaakte accounts.
const START_WACHTWOORD = (process.env.MYARC_START_WACHTWOORD || 'Welcome123!').trim();

// Een auth-gebruiker opzoeken op e-mail via de admin-API (geen directe
// query op auth.users). Kleine gebruikersgroep, dus een paar pagina's is zat.
async function vindAuthUser(supabase, email) {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = (data?.users || []).find(u => String(u.email || '').toLowerCase() === email);
    if (hit) return hit;
    if (!data?.users || data.users.length < 1000) break;
  }
  return null;
}

const HARDCODED_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTEzNDUsImV4cCI6MjA3MDU4NzM0NX0.19WRJrOO4Yll95w9j8qa8ZgoXFiwPK39farBuNSyd6c';

// Een env-var kan gezet zijn maar KAPOT (bv. SUPABASE_URL met een spatie/newline
// of een verkeerde waarde → createClient gooit "Invalid supabaseUrl"). Daarom
// valideren we en slaan we ongeldige waarden over i.p.v. er blind op te vertrouwen.
function isValidHttpUrl(u) {
  if (!u || typeof u !== 'string') return false;
  try {
    const p = new URL(u.trim());
    return p.protocol === 'https:' || p.protocol === 'http:';
  } catch { return false; }
}

function pickUrl() {
  const cands = [
    ['SUPABASE_URL', process.env.SUPABASE_URL],
    ['VITE_SUPABASE_URL', process.env.VITE_SUPABASE_URL],
    ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL],
  ];
  for (const [name, val] of cands) if (isValidHttpUrl(val)) return { name, val: val.trim() };
  return { name: 'HARDCODED_URL', val: 'https://xlaycpwpnhjmulfsnynh.supabase.co' };
}

function pickKey() {
  // Supabase legacy anon/service keys zijn JWT's → beginnen met "eyJ".
  // Een waarde die daar niet aan voldoet is kapot; overslaan.
  const order = [
    ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['SUPABASE_SERVICE_KEY', process.env.SUPABASE_SERVICE_KEY],
    ['SUPABASE_ANON_KEY', process.env.SUPABASE_ANON_KEY],
    ['VITE_SUPABASE_ANON_KEY', process.env.VITE_SUPABASE_ANON_KEY],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
  ];
  for (const [name, val] of order) if (val && val.trim().startsWith('eyJ')) return { name, val: val.trim() };
  return { name: 'HARDCODED_ANON', val: HARDCODED_ANON };
}

// Lazy singleton — bouw de client PAS in de handler (binnen try/catch), zodat
// een fout hier nooit een ongevangen module-load crash (FUNCTION_INVOCATION_FAILED)
// geeft, maar een nette JSON-fout met uitleg.
let _supabase = null;
function getClient() {
  if (!_supabase) _supabase = createClient(pickUrl().val, pickKey().val);
  return _supabase;
}

// Diagnose zonder secrets te lekken: alleen namen + of ze gezet zijn (+ lengte).
function envDiag() {
  const names = [
    'SUPABASE_URL', 'VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_KEY', 'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const env = {};
  for (const n of names) {
    const v = process.env[n];
    env[n] = v ? `set(len=${v.length})` : 'MISSING';
  }
  return { version: VERSION, urlSource: pickUrl().name, keySource: pickKey().name, env };
}

// Alleen intake-gerelateerde kolommen mogen via dit endpoint geschreven
// worden. Nooit: email, status, trainer_id, coach_id, auth_user_id, id.
const ALLOWED_UPDATE_FIELDS = new Set([
  // PublicIntakePage — fase 1 + autosave
  'first_name', 'last_name', 'phone', 'gender', 'date_of_birth', 'age',
  'height', 'current_weight', 'start_weight', 'target_weight', 'goal_weight',
  'primary_goal', 'goal', 'goal_urgency', 'goal_deadline', 'goal_timeline',
  'motivation', 'current_body_fat', 'current_body_fat_2', 'target_body_fat',
  'activity_level', 'work_schedule', 'cooking_time', 'preferred_training_days',
  'sleep_hours', 'stress_level', 'medical_conditions', 'coaching_style_pref',
  'previous_coaching', 'biggest_obstacle', 'coaching_expectations',
  'coaching_goals_extra', 'wat_werkte_eerder', 'waarom_gestopt',
  'muscle_goal_type', 'muscle_focus_tags', 'lichaam_omschrijving',
  'fitness_doel_tags', 'has_weight_goal', 'coaching_goal_tags',
  'tdee', 'target_calories', 'calorie_target', 'target_protein',
  'target_carbs', 'target_fat', 'intake_completed', 'intake_completed_at',
  // PublicIntakePage — fase 3 (workout)
  'training_experience', 'workout_days_per_week', 'minutes_per_session',
  'gym_name', 'injuries',
  // IntakeFlowService — nutrition intake mapping
  'meals_per_day', 'loved_foods', 'hated_foods', 'cooking_skill',
  'allergies', 'variety_preference', 'training_time',
  // Upgrade sep 2026: nulmeting-toelichting, snelle winst, eigen woorden bij
  // motivatie, supplementen, weekagenda-toelichting + eigen blokken, slotwoord.
  'quick_win_2weeks', 'motivation_verbatim', 'supplementen_nu',
  'agenda_toelichting', 'eigen_blokken', 'intake_slotwoord'
]);

// De sportschool uit de intake omzetten naar een rij in client_gyms.
//
// Alleen als de klant er nog geen heeft: heeft hij er al een aangemaakt in de
// app, dan is dat wat hij bedoelde en hoort een herhaalde intake daar niet
// overheen te rijden. Is het zijn eerste, dan nemen zijn bestaande trainingen
// meteen die zaal over — dezelfde regel als in de app.
async function koppelSportschool(supabase, clientId, naam) {
  const schoon = String(naam ?? '').trim();
  if (schoon.length < 3) return;

  const { count } = await supabase
    .from('client_gyms')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);
  if ((count || 0) > 0) return;

  const { data: gym, error } = await supabase
    .from('client_gyms')
    .insert({ client_id: clientId, naam: schoon, eenheid: 'kg' })
    .select('id')
    .maybeSingle();
  if (error || !gym?.id) return;

  await supabase.from('clients').update({ actieve_gym_id: gym.id }).eq('id', clientId);
  await supabase.from('workout_sessions')
    .update({ gym_id: gym.id })
    .eq('client_id', clientId)
    .is('gym_id', null);
}

export default async function handler(req, res) {
  // Diagnose-route: GET of ?diag=1 → laat versie + env-status zien zonder
  // secrets. Zo controleer je met één curl of de nieuwe code live staat.
  if (req.method === 'GET' || req.query?.diag === '1' || (req.body && req.body.action === 'diag')) {
    return res.status(200).json(envDiag());
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', version: VERSION });
  }

  try {
    const { action } = req.body || {};
    const supabase = getClient();

    if (action === 'find-client') {
      const email = (req.body.email || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ error: 'email required' });

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return res.status(200).json({ client: data?.[0] || null });
    }

    // Account aanmaken als het nog niet bestaat. Zo kan de klant na de
    // intake-call direct de link krijgen, ook als hij sneller betaalt dan
    // de coach een account aanmaakt. Bestaat er al een client met dit
    // e-mailadres, dan krijg je die gewoon terug.
    if (action === 'ensure-client') {
      const email = (req.body.email || '').toLowerCase().trim();
      if (!email || !email.includes('@')) return res.status(400).json({ error: 'email required' });
      const first_name = String(req.body.first_name || '').trim();
      const last_name = String(req.body.last_name || '').trim();
      const phone = String(req.body.phone || '').trim() || null;

      const { data: bestaand, error: zoekFout } = await supabase
        .from('clients').select('*').eq('email', email)
        .order('created_at', { ascending: false }).limit(1);
      if (zoekFout) throw zoekFout;
      if (bestaand?.[0]) return res.status(200).json({ client: bestaand[0], created: false });

      // Hiervoor is de service-key nodig (admin-API). Met alleen de anon-key
      // kunnen we geen gebruiker aanmaken: dan netjes zeggen in plaats van
      // half werk leveren.
      const keyNaam = pickKey().name;
      if (!/SERVICE/.test(keyNaam)) {
        return res.status(503).json({ error: 'account aanmaken niet mogelijk: geen service-key op de server', version: VERSION });
      }

      // Auth-gebruiker: nieuw, of de bestaande als dit e-mailadres al een
      // login had (bijvoorbeeld een oud account zonder client-rij).
      let authUser = null;
      const { data: gemaakt, error: maakFout } = await supabase.auth.admin.createUser({
        email, password: START_WACHTWOORD, email_confirm: true,
        user_metadata: { first_name, last_name, role: 'client' },
      });
      if (maakFout) {
        if (/already|exists|registered/i.test(maakFout.message || '')) authUser = await vindAuthUser(supabase, email);
        if (!authUser) throw maakFout;
      } else {
        authUser = gemaakt?.user || null;
      }

      const { data: client, error: insFout } = await supabase
        .from('clients')
        .insert([{
          email, first_name, last_name, phone,
          auth_user_id: authUser?.id || null,
          trainer_id: COACH_ID, coach_id: COACH_ID,
          created_at: new Date().toISOString(),
        }])
        .select('*').single();
      if (insFout) throw insFout;

      // Bestond de login al (oud account), dan laten we dat wachtwoord met rust
      // en weten we het hier niet; anders is het het startwachtwoord.
      const wachtwoord = maakFout ? null : START_WACHTWOORD;
      return res.status(200).json({ client, created: true, wachtwoord, version: VERSION });
    }

    if (action === 'get-client') {
      const { clientId } = req.body;
      if (!clientId) return res.status(400).json({ error: 'clientId required' });

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .limit(1);

      if (error) throw error;
      return res.status(200).json({ client: data?.[0] || null });
    }

    // Nulmeting wegschrijven. Aparte actie omdat dit naar client_baselines
    // gaat en niet naar clients: elk meetmoment is een eigen rij, zodat de
    // intake-meting en latere hermetingen naast elkaar te leggen zijn.
    if (action === 'save-baseline') {
      const { clientId, meting, bron } = req.body;
      if (!clientId || !meting || typeof meting !== 'object') {
        return res.status(400).json({ error: 'clientId and meting required' });
      }
      // Alleen de vijf schalen + toelichting; alles daarbuiten negeren.
      const schaal = (v) => {
        const n = parseInt(v, 10);
        return Number.isFinite(n) && n >= 1 && n <= 10 ? n : null;
      };
      const rij = {
        client_id: clientId,
        bron: bron === 'hermeting' ? 'hermeting' : 'intake',
        energie: schaal(meting.energie),
        in_je_vel: schaal(meting.in_je_vel),
        kracht: schaal(meting.kracht),
        slaap: schaal(meting.slaap),
        voeding_grip: schaal(meting.voeding_grip),
        toelichting: typeof meting.toelichting === 'string' ? meting.toelichting.slice(0, 4000) : null,
      };
      // Niets ingevuld → niets opslaan, anders krijg je lege meetmomenten
      // die een latere vergelijking vertroebelen.
      const heeftIets = ['energie', 'in_je_vel', 'kracht', 'slaap', 'voeding_grip']
        .some((k) => rij[k] !== null) || !!rij.toelichting;
      if (!heeftIets) return res.status(200).json({ success: true, skipped: true });

      const { error } = await supabase.from('client_baselines').insert(rij);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    if (action === 'update-client') {
      const { clientId, fields } = req.body;
      if (!clientId || !fields || typeof fields !== 'object') {
        return res.status(400).json({ error: 'clientId and fields required' });
      }

      const safeFields = Object.fromEntries(
        Object.entries(fields).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
      );
      // clients.training_time is een `time`-kolom. Komt er iets anders binnen
      // dan HH:MM (de intake stuurde 'onbekend' bij "Weet ik nog niet"), dan
      // weigert Postgres de hele update. Liever leeg dan alles kwijt.
      if ('training_time' in safeFields) {
        const t = String(safeFields.training_time ?? '').trim();
        safeFields.training_time = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(t) ? t : null;
      }
      if (Object.keys(safeFields).length === 0) {
        return res.status(400).json({ error: 'no allowed fields in update' });
      }

      const { error } = await supabase
        .from('clients')
        .update(safeFields)
        .eq('id', clientId);

      if (error) throw error;

      // De sportschool uit de intake wordt ook een echte rij in client_gyms:
      // dat is waar het loggen straks op filtert. Zonder dit staat de naam wel
      // in het intakeformulier maar begint de klant in de app zonder zaal, en
      // vergelijkt zijn eerste training met niets.
      //
      // Apart en met een eigen try: mislukt het, dan is de intake al veilig
      // opgeslagen en is dit hooguit iets dat de klant zelf nog invult.
      if ('gym_name' in safeFields) {
        try { await koppelSportschool(supabase, clientId, safeFields.gym_name); }
        catch (e) { console.warn('sportschool koppelen mislukt:', e?.message); }
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `unknown action: ${action}`, version: VERSION });
  } catch (error) {
    // Rijke log in Vercel Functions + volledige uitleg in de JSON-respons,
    // zodat de browserconsole precies laat zien WAAROM het faalt (env, key-bron,
    // Supabase-foutmelding) i.p.v. een blinde "(500)".
    const diag = envDiag();
    console.error('❌ public-intake error:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      hint: error?.hint,
      keySource: diag.keySource,
      urlSource: diag.urlSource,
      env: diag.env,
      stack: error?.stack,
    });
    return res.status(500).json({
      error: error?.message || 'internal error',
      code: error?.code || null,
      hint: error?.hint || null,
      keySource: diag.keySource,
      urlSource: diag.urlSource,
      version: VERSION,
    });
  }
}
