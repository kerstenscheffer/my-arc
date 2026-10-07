// src/modules/app-review/ReviewPrompt.jsx
//
// De winkelbeoordeling, zoals WhatsApp het doet: het sterrenvenster van Apple
// of Google zelf, dat de score rechtstreeks naar de App Store of Play Store
// stuurt. Een eigen sterrenscherm mag dat niet; daarom tekent dit component
// niets en vraagt het alleen op het juiste moment het systeemvenster aan.
//
// Wanneer: account minstens een week oud, minstens drie trainingen met
// gelogde sets in de laatste dertig dagen, en niet binnen negentig dagen na
// de vorige keer. Apple en Google beslissen zelf of ze het venster écht
// tonen (maximaal een paar keer per jaar per gebruiker); wij vragen alleen.
// Op het web gebeurt er niets.

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

const DAG = 86400000

export default function ReviewPrompt({ db, client }) {
  useEffect(() => {
    if (!client?.id || !db?.supabase || !Capacitor.isNativePlatform()) return
    let weg = false
    const t = setTimeout(async () => {
      try {
        try { if (Number(localStorage.getItem('myarc_review_laatst') || 0) > Date.now() - 7 * DAG) return } catch { /* geen opslag */ }
        if (client.created_at && Date.now() - new Date(client.created_at).getTime() < 7 * DAG) return
        const { data: eerder } = await db.supabase.from('app_review_prompts').select('asked_at')
          .eq('client_id', client.id).order('asked_at', { ascending: false }).limit(1).then(r => r, () => ({ data: [] }))
        if (eerder?.[0] && Date.now() - new Date(eerder[0].asked_at).getTime() < 90 * DAG) return
        const vanaf = new Date(Date.now() - 30 * DAG).toISOString().slice(0, 10)
        const { data: sessies } = await db.supabase.from('workout_sessions').select('id').eq('client_id', client.id).gte('workout_date', vanaf)
          .then(r => r, () => ({ data: [] }))
        const ids = (sessies || []).map(s => s.id)
        if (ids.length < 3) return
        const { data: sets } = await db.supabase.from('workout_progress').select('session_id').in('session_id', ids).then(r => r, () => ({ data: [] }))
        if (new Set((sets || []).map(x => x.session_id)).size < 3) return
        if (weg) return
        try { localStorage.setItem('myarc_review_laatst', String(Date.now())) } catch { /* geen opslag */ }
        await db.supabase.from('app_review_prompts').insert({ client_id: client.id, platform: Capacitor.getPlatform() }).then(r => r, () => null)
        const { AppReview } = await import('@capawesome/capacitor-app-review')
        await AppReview.requestReview()
      } catch (e) { console.warn('winkelbeoordeling niet gevraagd:', e?.message) }
    }, 6000)
    return () => { weg = true; clearTimeout(t) }
  }, [client?.id, client?.created_at, db])
  return null
}
