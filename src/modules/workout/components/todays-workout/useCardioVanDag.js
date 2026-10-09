// src/modules/workout/components/todays-workout/useCardioVanDag.js
//
// Cardio-blokken van één dag, met of ze al gelogd zijn. Los van de kaart
// (CardioVandaag.jsx) omdat een componentbestand alleen componenten mag
// exporteren voor hot reload.

import { useEffect, useState } from 'react'
import CardioService, { normaliseerSoort } from '../../services/CardioService'

const DAG_SLEUTELS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const maandagVan = (d) => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); m.setHours(0, 0, 0, 0); return m }

// Cardio-blokken van één dag, met of ze al gelogd zijn. Herlaadt op
// 'myarc:cardio-changed' (na loggen of plannen).
export function useCardioVanDag(client, db, datum) {
  const [lijst, setLijst] = useState([])
  const [versie, setVersie] = useState(0)
  useEffect(() => {
    const bump = () => setVersie(v => v + 1)
    window.addEventListener('myarc:cardio-changed', bump)
    return () => window.removeEventListener('myarc:cardio-changed', bump)
  }, [])
  useEffect(() => {
    if (!client?.id || !db?.supabase || !datum) { setLijst([]); return }
    let weg = false
    const maandag = maandagVan(datum)
    const dagSleutel = DAG_SLEUTELS[(datum.getDay() + 6) % 7]
    const datumIso = iso(datum)
    Promise.all([
      db.supabase.from('client_agenda_blocks').select('id, day, label, sublabel, start_time, end_time, week_start, skip_weeks')
        .eq('client_id', client.id).eq('type', 'custom').ilike('label', 'Cardio ·%')
        .eq('day', dagSleutel)
        .or(`week_start.is.null,week_start.eq.${iso(maandag)}`)
        .then(r => r, () => ({ data: [] })),
      CardioService.getLogs(client.id, iso(maandag), db),
    ]).then(([b, logs]) => {
      if (weg) return
      const blokken = (b?.data || []).filter(x => !(x.skip_weeks || []).includes(iso(maandag)))
        .sort((a, c) => String(a.start_time).localeCompare(String(c.start_time)))
      setLijst(blokken.map(blok => {
        const soort = String(blok.label).replace(/^Cardio\s*·\s*/, '')
        const [h, m] = String(blok.start_time || '').split(':').map(Number)
        const [eh, em] = String(blok.end_time || '').split(':').map(Number)
        const duur = Number.isFinite(h) && Number.isFinite(eh) ? Math.max(0, (eh * 60 + em) - (h * 60 + m)) : null
        const log = (logs || []).find(l => normaliseerSoort(l.cardio_type) === normaliseerSoort(soort) && String(l.logged_date).slice(0, 10) === datumIso) || null
        return { id: blok.id, soort, sublabel: blok.sublabel || null, tijd: String(blok.start_time || '').slice(0, 5), duur, gedaan: !!log, log, datum: datumIso }
      }))
    })
    return () => { weg = true }
  }, [client?.id, db, datum ? iso(datum) : null, versie]) // eslint-disable-line react-hooks/exhaustive-deps
  return lijst
}

