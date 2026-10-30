// src/modules/coach-command-center/components/doorstap.js
//
// Helpers voor DoorstapKeuze (client_doorstap). Los bestand zodat de
// klantkaarten-lijst in één query kan laden zonder het component te importeren.
import { supabase } from '../../../lib/supabase'

export const DOORSTAP_OPTIES = [
  { id: null, label: 'Leeg', kort: 'Doorstap', kleur: 'rgba(255,255,255,0.45)' },
  { id: 'ja_mondeling', label: 'Ja, mondeling', kort: 'Ja', kleur: '#10b981' },
  { id: 'denkt_na', label: 'Denkt na', kort: 'Denkt na', kleur: '#f59e0b' },
  { id: 'nee', label: 'Nee', kort: 'Nee', kleur: '#ef4444' },
  { id: 'betaald', label: 'Betaald', kort: 'Betaald', kleur: '#10b981' },
]
export const optieVan = (s) => DOORSTAP_OPTIES.find(o => o.id === (s || null)) || DOORSTAP_OPTIES[0]

// Tabel nog niet aangemaakt (42P01 in Postgres, PGRST205 in PostgREST).
export const tabelOntbreekt = (e) => e && (e.code === '42P01' || e.code === 'PGRST205')

// Laatste rij per klant voor een lijst klanten, in één query.
// Geeft null als de tabel er (nog) niet is.
export async function laadDoorstap(clientIds) {
  if (!clientIds?.length) return {}
  const { data, error } = await supabase.from('client_doorstap')
    .select('id, client_id, status, pakket, notitie, gezet_at')
    .in('client_id', clientIds)
    .order('gezet_at', { ascending: false })
    .then(r => r, e => ({ data: null, error: e }))
  if (error) return null
  const m = {}
  ;(data || []).forEach(r => { if (!(r.client_id in m)) m[r.client_id] = r })
  return m
}
