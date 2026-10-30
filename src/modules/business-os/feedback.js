// src/modules/business-os/feedback.js
//
// Duimpjes (30 okt 2026): Kerstens oordeel over een Gino-antwoord of -beeld →
// business_os_feedback (RLS: alleen eigen rijen). De groeironde leest ze
// 's nachts en werkt de skills bij (bewezen beelden, wat hij niet wil).

import { supabase } from '../../lib/supabase'

export async function bewaarOordeel({ soort, oordeel, vraag, inhoud, visueel }) {
  let beeld = null
  try { beeld = visueel ? JSON.parse(JSON.stringify(visueel)) : null } catch { /* geen beeld */ }
  if (beeld && JSON.stringify(beeld).length > 40000) beeld = { titel: beeld.titel, te_groot: true }
  const { error } = await supabase.from('business_os_feedback').insert({
    soort, oordeel,
    vraag: vraag ? String(vraag).slice(0, 2000) : null,
    inhoud: inhoud ? String(inhoud).slice(0, 4000) : null,
    visueel: beeld,
  })
  return !error
}
