// src/lib/clients.js
import { supabase } from './supabase'
import { parseMealPreferences } from './intakeParsers'

// Profiles
export async function getClientProfile(client_id){
  const { data, error } = await supabase
    .from('client_extended_profiles')
    .select('*')
    .eq('client_id', client_id)
    .single()
  if(error && error.code !== 'PGRST116') throw error // no rows -> null
  return data || null
}

export async function upsertClientProfile(client_id, payload){
  const rows = { ...payload, client_id }
  const { data, error } = await supabase
    .from('client_extended_profiles')
    .upsert(rows, { onConflict: 'client_id' })
    .select('*')
    .single()
  if(error) throw error
  return data
}

// Meal preferences
export async function getClientMealPrefs(client_id){
  const prof = await getClientProfile(client_id)
  return { raw: prof?.meal_prefs_raw || '', parsed: prof?.meal_prefs || null }
}

export async function saveMealPrefs(client_id, raw){
  const parsed = parseMealPreferences(raw)
  return upsertClientProfile(client_id, { meal_prefs_raw: raw, meal_prefs: parsed })
}

// Bonuses
export async function listBonuses(client_id){
  const { data, error } = await supabase
    .from('client_bonuses')
    .select('*')
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })
  if(error) throw error
  return data || []
}

export async function addBonus(client_id, { label, description='' }){
  const { data, error } = await supabase
    .from('client_bonuses')
    .insert([{ client_id, label, description }])
    .select('*')
    .single()
  if(error) throw error
  return data
}

export async function removeBonus(id){
  const { error } = await supabase.from('client_bonuses').delete().eq('id', id)
  if(error) throw error
  return true
}

// Videos
export async function listClientVideos(client_id){
  const { data, error } = await supabase
    .from('client_videos')
    .select('*')
    .eq('client_id', client_id)
    .order('created_at', { ascending: false })
  if(error) throw error
  return data || []
}

export async function addClientVideo(client_id, { title, url, tags=[] }){
  const { data, error } = await supabase
    .from('client_videos')
    .insert([{ client_id, title, url, tags }])
    .select('*')
    .single()
  if(error) throw error
  return data
}

export async function deleteClientVideo(id){
  const { error } = await supabase.from('client_videos').delete().eq('id', id)
  if(error) throw error
  return true
}
