// src/modules/business-os/borgAfronden.js
//
// Borg van een challenge afronden: terugbetaald of behouden. Eén plek voor
// Business OS → Klanten (GinoDoorstap) en Einde traject op het leadbord, zodat
// ze hetzelfde doen (24 nov 2026). Zelfde kolom als het lead-systeem.
// Terugbetaald valt uit omzet en uitbetaling (uitbetaalmaand gaat leeg, zodat hij bij
// later toch behouden in de dan lopende periode valt); behouden telt vanaf nu mee (trigger).
//
// → { ok, error, alUitbetaald }. alUitbetaald = was behouden en die maand is al aan Marcel
// uitbetaald: melden, de maand blijft vast staan.
import { supabase } from '../../lib/supabase'

export async function borgAfronden(sale, status) {
  if (!sale?.id) return { ok: false, error: new Error('Geen borg') }
  if (sale.challenge_status === status) return { ok: true, alUitbetaald: false }
  const { data: alBetaald } = sale.challenge_status === 'behouden' && status === 'terugbetaald'
    ? await supabase.from('partner_payout_items').select('id').eq('movement_id', sale.id).limit(1).then(x => x, () => ({ data: [] }))
    : { data: [] }
  const patch = status === 'terugbetaald' ? { challenge_status: status, telt_mee_vanaf: null } : { challenge_status: status }
  const { data, error } = await supabase.from('lead_movements').update(patch)
    .eq('id', sale.id).in('challenge_status', ['open', 'behouden', 'terugbetaald']).select('id').then(x => x, e => ({ error: e }))
  if (error || !data?.length) return { ok: false, error: error || new Error('Borg niet bijgewerkt (geen rechten?)') }
  return { ok: true, alUitbetaald: !!alBetaald?.length }
}

// De borg van een klant: via de challenge-instelling (sale_id) of gekoppeld op client_id.
// Alleen betaalde challenge-sales. → sale of null.
export async function borgVanKlant(clientId) {
  const kol = 'id, lead_name, order_value, challenge_status, payment_received, client_id'
  const { data: inst } = await supabase.from('client_challenge_instelling').select('sale_id').eq('client_id', clientId).maybeSingle()
    .then(x => x, () => ({ data: null }))
  if (inst?.sale_id) {
    const { data } = await supabase.from('lead_movements').select(kol).eq('id', inst.sale_id).is('reverted_at', null).maybeSingle()
      .then(x => x, () => ({ data: null }))
    if (data) return data
  }
  const { data } = await supabase.from('lead_movements').select(kol)
    .eq('client_id', clientId).eq('sale_kind', 'challenge').is('reverted_at', null)
    .order('moved_at', { ascending: false }).limit(1)
    .then(x => x, () => ({ data: [] }))
  return data?.[0] || null
}

// Betaalde, open borgen die nog aan niemand hangen: om te koppelen.
export async function losseBorgen() {
  const { data } = await supabase.from('lead_movements').select('id, lead_name, order_value')
    .eq('sale_kind', 'challenge').eq('challenge_status', 'open').eq('payment_received', true)
    .is('client_id', null).is('reverted_at', null).order('lead_name')
    .then(x => x, () => ({ data: [] }))
  return data || []
}
