// src/modules/lead-management/teamCoaches.js
//
// Campagnes horen bij het team, niet bij één coach. Overal waar de lijst met
// campagnes werd opgehaald stond `.eq('coach_id', coachId)`, waardoor Marcel
// alleen zijn eigen campagnes zag en die van Kersten niet kon draaien.
//
// Deze helper geeft de coach-id's van iedereen in dezelfde teams, inclusief
// jezelf. Dat gaat via de RPC my_team_coach_ids(): coach_team_members staat op
// slot (RLS aan, geen policies), dus rechtstreeks uitlezen levert niets op.
//
// Het antwoord verandert vrijwel nooit, dus we onthouden het per coach voor de
// duur van de sessie. Lukt de RPC niet, dan val je terug op je eigen id — je
// ziet dan wat je eerst ook zag, in plaats van niets.

const onthouden = new Map()

export async function teamCoachIds(supabase, coachId) {
  const eigen = coachId ? [coachId] : []
  if (!coachId) return eigen
  if (onthouden.has(coachId)) return onthouden.get(coachId)

  try {
    const { data, error } = await supabase.rpc('my_team_coach_ids')
    if (error) throw error
    const ids = [...new Set([...eigen, ...(data || []).map(r => (typeof r === 'string' ? r : r?.my_team_coach_ids)).filter(Boolean)])]
    onthouden.set(coachId, ids)
    return ids
  } catch (e) {
    console.warn('Teamgenoten ophalen mislukt, alleen eigen campagnes:', e?.message)
    return eigen
  }
}
