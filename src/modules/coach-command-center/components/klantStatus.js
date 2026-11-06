// src/modules/coach-command-center/components/klantStatus.js
//
// Klantstatus uit de Klanten-ochtendronde (checkin_ronde_items): één kleur
// overal. Regels staan in scripts/klantenronde.mjs (stap 3).

export const KLANT_STATUS = {
  aandacht:   { kleur: '#ef4444', label: 'Aandacht' },
  vervolg:    { kleur: '#f59e0b', label: 'Vervolg' },
  goed:       { kleur: '#22c55e', label: 'Goed' },
  gepauzeerd: { kleur: '#6b7280', label: 'Gepauzeerd' },
}
export const GEEN_STATUS = { kleur: '#6b7280', label: 'Nog geen status' }

// Nieuwste rij per klant uit de laatste 3 dagen, in één query voor de hele lijst.
export async function laadKlantStatus(supabase, clientIds) {
  if (!clientIds.length) return {}
  const van = new Date(); van.setDate(van.getDate() - 3)
  const { data } = await supabase.from('checkin_ronde_items')
    .select('client_id, ronde_datum, groep, suggesties')
    .in('client_id', clientIds)
    .gte('ronde_datum', van.toLocaleDateString('sv-SE'))
    .order('ronde_datum', { ascending: false })
    .then(r => r, () => ({ data: [] }))
  const m = {}
  ;(data || []).forEach(r => { if (!m[r.client_id]) m[r.client_id] = r })
  return m
}
