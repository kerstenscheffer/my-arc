// src/modules/coach-command-center/klantPakket.js
//
// Pakket per klant (clients.pakket, 24 nov 2026). Zelfde niveaus en namen als
// het aanbod in Business OS (business_os_aanbod.tiers). Alles behalve Solo
// heeft wekelijkse monitoring en feedback; daarop filtert Command voor een
// data- + feedbackdag. Zie klant-pakket.sql.
export const PAKKETTEN = [
  { id: 'app', naam: 'Solo' },
  { id: 'basis', naam: 'Op koers' },
  { id: 'midden', naam: 'Coaching' },
  { id: 'premium', naam: 'All-in' },
]

export async function zetPakket(supabase, clientId, pakket) {
  const { error } = await supabase.from('clients').update({ pakket }).eq('id', clientId)
  if (error) throw error
  window.dispatchEvent(new CustomEvent('myarc:pakket', { detail: { id: clientId, pakket } }))
}
