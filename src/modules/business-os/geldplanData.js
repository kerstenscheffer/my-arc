// src/modules/business-os/geldplanData.js
//
// Data voor het Geldplan (Geldplan.jsx, geldplan.sql): rekenen via de RPC
// get_geldplan en een korte versie voor Gino's context.

import { supabase } from '../../lib/supabase'

const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
export const maandNaam = (iso) => MAAND[Number(String(iso).slice(5, 7)) - 1]

// Laden en bewaren: rekenen via de RPC, eigen instellingen in de tabel.
export function laadGeldplan(eigen = {}) {
  return supabase.rpc('get_geldplan', { p_instellingen: eigen })
    .then(({ data, error }) => (error ? null : data), () => null)
}

// Kort voor Gino's context: dezelfde getallen als het scherm.
export function geldplanVoorGino(g) {
  if (!g?.maanden) return null
  const s = g.instellingen || {}
  return {
    bron: 'get_geldplan (zelfde als scherm Geldplan); noem deze getallen',
    jijHoudtPerMaandJanApr: g.jij_houdt_gem,
    nodigPerMaand: g.nodig_per_maand,
    saldoEindMaand: Object.fromEntries(g.maanden.map(m => [maandNaam(m.maand), m.saldo_eind])),
    jijHoudtPerMaand: Object.fromEntries(g.maanden.map(m => [maandNaam(m.maand), m.jij_houdt])),
    laagsteSaldo: g.laagste_saldo,
    breakEvenKlantenPerWeek: g.break_even_klanten_per_week,
    klantenPerWeek: g.klanten_per_week,
    perExtraKlantPerWeek: g.per_extra_klant_stabiel,
    aannames: `doorstap ${s.doorstap_pct}%, borg terug ${s.borg_terug_pct}%, Paviljoen ${s.paviljoen}, privé ${s.prive}, zakelijk ${s.zakelijk}, adspend ${s.adspend}`,
  }
}
