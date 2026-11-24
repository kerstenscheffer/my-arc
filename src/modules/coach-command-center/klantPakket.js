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

// Maandag check-in-video (clients.maandag_checkin, 24 nov 2026). Op koers,
// Coaching en All-in krijgen er elke maandag een; met de vlag zet je een
// klant er los van uit. Gepauzeerd, gestopt en niet-betalend tellen niet.
export const krijgtMaandag = (client, { pakket, maandagUit, nietBetalend }) =>
  client.status === 'active'
  && (client.coaching_status || 'active') === 'active'
  && pakket !== 'app'
  && !maandagUit.has(client.id)
  && !nietBetalend.has(client.id)

export async function zetMaandag(supabase, clientId, aan) {
  const { error } = await supabase.from('clients').update({ maandag_checkin: aan }).eq('id', clientId)
  if (error) throw error
  window.dispatchEvent(new CustomEvent('myarc:maandag', { detail: { id: clientId, aan } }))
}
