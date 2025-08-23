#!/usr/bin/env zsh
set -euo pipefail

FILE="src/lib/mealplanDatabase.js"
TS=$(date +%Y%m%d_%H%M%S)

if [[ ! -f "$FILE" ]]; then
  echo "❌ $FILE niet gevonden. Controleer je pad."
  exit 1
fi

# 0) Back-up
cp "$FILE" "${FILE}.bak_${TS}"
echo "🗂  Backup -> ${FILE}.bak_${TS}"

# 1) Zorg dat supabase import bovenaan staat
if ! grep -q "import { supabase } from './supabase'" "$FILE"; then
  # Insert als eerste regel
  sed -i '' "1s|^|import { supabase } from './supabase'\n|" "$FILE"
  echo "✅ supabase import toegevoegd"
else
  echo "ℹ️  supabase import al aanwezig"
fi

# 2) Verwijder ALLE bestaande definities van saveClientMealSwap (incl. 'return true' stubs)
#    (pakte blok van 'export async function saveClientMealSwap(' t/m afsluitende '}' )
perl -0777 -i -pe 's/export\s+async\s+function\s+saveClientMealSwap\s*\([\s\S]*?\)\s*\{[\s\S]*?\n\}\n//gs' "$FILE"

# 3) Append de correcte implementaties aan het einde van het bestand
cat >> "$FILE" <<'JS'

// === MEAL SWAPS / OVERRIDES ===

/**
 * Upsert 1 override voor (plan_id, client_id, day_index, slot) -> meal_id
 * Vereist unieke index op (plan_id, client_id, day_index, slot).
 */
export async function saveClientMealSwap({ plan_id, client_id, day_index, slot, meal_id }) {
  if (!plan_id || !client_id || day_index === undefined || slot === undefined || !meal_id) {
    throw new Error('saveClientMealSwap: plan_id, client_id, day_index, slot, meal_id zijn verplicht')
  }

  const payload = {
    plan_id,
    client_id,
    day_index: Number(day_index),
    slot: String(slot),
    meal_id,
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('client_meal_plan_overrides')
    .upsert([payload], {
      onConflict: 'plan_id,client_id,day_index,slot',
      ignoreDuplicates: false
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

/**
 * Haal alle overrides op als map: key = `${day}:${slot}` -> value = meal_id
 */
export async function getClientMealSwapMap(plan_id, client_id) {
  if (!plan_id || !client_id) throw new Error('getClientMealSwapMap: plan_id & client_id verplicht')

  const { data, error } = await supabase
    .from('client_meal_plan_overrides')
    .select('day_index, slot, meal_id')
    .eq('plan_id', plan_id)
    .eq('client_id', client_id)

  if (error) throw error

  const map = {}
  for (const r of (data || [])) map[`${r.day_index}:${r.slot}`] = r.meal_id
  return map
}

/** Verwijder 1 override (reset naar origineel). */
export async function clearClientMealSwap({ plan_id, client_id, day_index, slot }) {
  if (!plan_id || !client_id || day_index === undefined || slot === undefined) {
    throw new Error('clearClientMealSwap: plan_id, client_id, day_index, slot verplicht')
  }

  const { error } = await supabase
    .from('client_meal_plan_overrides')
    .delete()
    .eq('plan_id', plan_id)
    .eq('client_id', client_id)
    .eq('day_index', Number(day_index))
    .eq('slot', String(slot))

  if (error) throw error
  return true
}
JS

echo "✅ Implementatie toegevoegd aan $FILE"
echo "🎯 Klaar."
