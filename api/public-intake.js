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

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://xlaycpwpnhjmulfsnynh.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsYXljcHdwbmhqbXVsZnNueW5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTEzNDUsImV4cCI6MjA3MDU4NzM0NX0.19WRJrOO4Yll95w9j8qa8ZgoXFiwPK39farBuNSyd6c';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  'allergies', 'variety_preference', 'training_time'
]);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action } = req.body || {};

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

    if (action === 'update-client') {
      const { clientId, fields } = req.body;
      if (!clientId || !fields || typeof fields !== 'object') {
        return res.status(400).json({ error: 'clientId and fields required' });
      }

      const safeFields = Object.fromEntries(
        Object.entries(fields).filter(([k]) => ALLOWED_UPDATE_FIELDS.has(k))
      );
      if (Object.keys(safeFields).length === 0) {
        return res.status(400).json({ error: 'no allowed fields in update' });
      }

      const { error } = await supabase
        .from('clients')
        .update(safeFields)
        .eq('id', clientId);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: `unknown action: ${action}` });
  } catch (error) {
    console.error('❌ public-intake error:', error);
    return res.status(500).json({ error: error.message || 'internal error' });
  }
}
