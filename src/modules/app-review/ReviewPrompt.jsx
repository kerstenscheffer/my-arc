// src/modules/app-review/ReviewPrompt.jsx
//
// De winkelbeoordeling, zoals WhatsApp het doet: het sterrenvenster van Apple
// of Google zelf, dat de score rechtstreeks naar de App Store of Play Store
// stuurt. Een eigen sterrenscherm mag dat niet; daarom tekent dit component
// niets en vraagt het alleen op het juiste moment het systeemvenster aan.
//
// Wanneer: account minstens zeven dagen oud, op minstens drie verschillende
// dagen iets gelogd (maaltijd of training met sets) in de laatste veertien
// dagen, en niet binnen negentig dagen na de vorige keer. (Tot 14 okt 2026
// was het dertig dagen + drie trainingen; dat haalde maar de helft.) Apple en Google beslissen zelf of ze het venster écht
// tonen (maximaal een paar keer per jaar per gebruiker); wij vragen alleen.
// Op het web gebeurt er niets.
//
// Moment (15 okt 2026): niet meer 6 s na het openen, maar vlak na iets wat
// goed ging: een maaltijd gelogd/afgerond, supplement ingenomen, training
// klaar. Die plekken roepen meldSucces() aan. Apple raadt precies dit aan,
// en wie net iets bereikt heeft geeft vaker vijf sterren.

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { SUCCES_EVENT } from './reviewMoment'

const DAG = 86400000

export default function ReviewPrompt({ db, client }) {
  useEffect(() => {
    if (!client?.id || !db?.supabase || !Capacitor.isNativePlatform()) return
    let weg = false
    let t = null
    const vraag = async () => {
      try {
        try { if (Number(localStorage.getItem('myarc_review_laatst') || 0) > Date.now() - 7 * DAG) return } catch { /* geen opslag */ }
        if (client.created_at && Date.now() - new Date(client.created_at).getTime() < 7 * DAG) return
        const { data: eerder } = await db.supabase.from('app_review_prompts').select('asked_at')
          .eq('client_id', client.id).order('asked_at', { ascending: false }).limit(1).then(r => r, () => ({ data: [] }))
        if (eerder?.[0] && Date.now() - new Date(eerder[0].asked_at).getTime() < 90 * DAG) return
        const vanaf = new Date(Date.now() - 14 * DAG)
        const dagen = new Set()
        const { data: maaltijden } = await db.supabase.from('consumed_meals').select('consumed_at')
          .eq('client_id', client.id).gte('consumed_at', vanaf.toISOString()).limit(500).then(r => r, () => ({ data: [] }))
        for (const m of maaltijden || []) if (m.consumed_at) dagen.add(new Date(m.consumed_at).toLocaleDateString('sv-SE'))
        if (dagen.size < 3) {
          const { data: sessies } = await db.supabase.from('workout_sessions').select('id, workout_date')
            .eq('client_id', client.id).gte('workout_date', vanaf.toISOString().slice(0, 10)).then(r => r, () => ({ data: [] }))
          const ids = (sessies || []).map(x => x.id)
          if (ids.length) {
            const { data: sets } = await db.supabase.from('workout_progress').select('session_id').in('session_id', ids).then(r => r, () => ({ data: [] }))
            const metSets = new Set((sets || []).map(x => x.session_id))
            for (const x of sessies) if (metSets.has(x.id)) dagen.add(String(x.workout_date).slice(0, 10))
          }
        }
        if (dagen.size < 3) return
        if (weg) return
        try { localStorage.setItem('myarc_review_laatst', String(Date.now())) } catch { /* geen opslag */ }
        await db.supabase.from('app_review_prompts').insert({ client_id: client.id, platform: Capacitor.getPlatform() }).then(r => r, () => null)
        const { AppReview } = await import('@capawesome/capacitor-app-review')
        await AppReview.requestReview()
      } catch (e) { console.warn('winkelbeoordeling niet gevraagd:', e?.message) }
    }
    // Na het succes-scherm (1,4 s) nog even wachten, dan pas vragen.
    const opSucces = () => { clearTimeout(t); t = setTimeout(vraag, 2000) }
    window.addEventListener(SUCCES_EVENT, opSucces)
    return () => { weg = true; clearTimeout(t); window.removeEventListener(SUCCES_EVENT, opSucces) }
  }, [client?.id, client?.created_at, db])
  return null
}
