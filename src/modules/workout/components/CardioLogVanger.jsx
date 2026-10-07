// src/modules/workout/components/CardioLogVanger.jsx
//
// Vangt 'myarc:cardio-log' op (tik op een cardiotegel in het weekrooster) en
// opent het stapsgewijze logblad. Staat los op de pagina, zodat er geen
// cardio-sectie meer nodig is. Het gewicht voor de kcal-schatting komt uit
// de laatste weging; de app weegt dagelijks in weight_challenge_logs.

import { useEffect, useState } from 'react'
import CardioLogBlad from './CardioLogBlad'
import CardioService from '../services/CardioService'

export default function CardioLogVanger({ client, db, isMobile }) {
  const [blad, setBlad] = useState(null) // { soort, minuten }
  const [gewicht, setGewicht] = useState(null)
  useEffect(() => {
    const open = (e) => setBlad({ soort: e.detail?.soort || 'Cardio', minuten: e.detail?.minuten || null, datum: e.detail?.datum || null })
    window.addEventListener('myarc:cardio-log', open)
    return () => window.removeEventListener('myarc:cardio-log', open)
  }, [])
  useEffect(() => {
    if (!blad || gewicht || !client?.id || !db?.supabase) return
    let leeft = true
    ;(async () => {
      let w = Number(client?.current_weight) || null
      for (const tabel of w ? [] : ['weight_challenge_logs', 'weight_tracking', 'weight_logs']) {
        const { data } = await db.supabase.from(tabel).select('weight, date').eq('client_id', client.id).order('date', { ascending: false }).limit(1)
          .then(r => r, () => ({ data: null }))
        w = Number(data?.[0]?.weight) || null
        if (w) break
      }
      if (leeft) setGewicht(w || 80)
    })()
    return () => { leeft = false }
  }, [blad, gewicht, client?.id, client?.current_weight, db])

  const log = async (rij) => {
    try {
      await CardioService.addLog({ client_id: client.id, logged_date: blad?.datum || null, ...rij }, db)
      setBlad(null)
      if (navigator.vibrate) navigator.vibrate([20, 40, 20])
      window.dispatchEvent(new CustomEvent('myarc:cardio-changed'))
    } catch (err) { alert('Loggen mislukt: ' + (err?.message || 'onbekende fout')) }
  }

  return (
    <CardioLogBlad open={!!blad} soort={blad?.soort} minutenGepland={blad?.minuten}
      gewicht={gewicht || Number(client?.current_weight) || 80}
      onLog={log} onClose={() => setBlad(null)} isMobile={isMobile} />
  )
}
