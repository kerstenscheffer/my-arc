// src/modules/workout/bouwfase/TrainingNavraag.jsx
//
// "Hoe was je training van gisteren?" (18 nov 2026). Trainingen sluiten zichzelf
// af op de server (supabase/training-afsluiten.sql), maar het cijfer en "te
// lang / goed / kan meer" kan alleen de klant geven. Wie dat na de training
// niet invulde, krijgt bij het openen van de app één kaart voor de laatste
// training van de afgelopen drie dagen. Wegtikken onthoudt hij per training.
import { useEffect, useState } from 'react'
import { Dumbbell, X } from 'lucide-react'
import FeedbackBlad from './FeedbackBlad'
import { leesActieveFase, vandaagIso } from './bouwfaseData'

const SLEUTEL = 'myarc_navraag_weg'
const isoVan = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function dagWoord(iso) {
  const d = new Date(`${iso}T12:00:00`)
  const gisteren = new Date(); gisteren.setDate(gisteren.getDate() - 1)
  if (isoVan(gisteren) === iso) return 'gisteren'
  return d.toLocaleDateString('nl-NL', { weekday: 'long' })
}

export default function TrainingNavraag({ client, db, isMobile }) {
  const [sessie, setSessie] = useState(null)
  const [fase, setFase] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let leeft = true
    ;(async () => {
      const vandaag = vandaagIso()
      const vanaf = new Date(); vanaf.setDate(vanaf.getDate() - 3)
      const { data: sessies } = await db.supabase.from('workout_sessions')
        .select('id, workout_date, day_display_name, workout_progress ( id )')
        .eq('client_id', client.id).gte('workout_date', isoVan(vanaf)).lt('workout_date', vandaag)
        .order('workout_date', { ascending: false }).limit(4)
        .then(r => r, () => ({ data: [] }))
      const laatste = (sessies || []).find(s => (s.workout_progress || []).length > 0)
      if (!laatste) return
      let weg = []
      try { weg = JSON.parse(localStorage.getItem(SLEUTEL) || '[]') } catch { weg = [] }
      if (Array.isArray(weg) && weg.includes(laatste.id)) return
      const { data: fb } = await db.supabase.from('training_feedback').select('id')
        .eq('client_id', client.id).eq('soort', 'workout').eq('datum', laatste.workout_date).limit(1)
        .then(r => r, () => ({ data: [{ id: 'onbekend' }] })) // bij een fout liever geen kaart dan een dubbele vraag
      if (fb?.length) return
      const f = await leesActieveFase(db.supabase, client.id).then(x => x, () => null)
      if (leeft) { setFase(f || null); setSessie(laatste) }
    })()
    return () => { leeft = false }
  }, [client?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!sessie) return null

  const sluit = () => {
    try {
      const weg = JSON.parse(localStorage.getItem(SLEUTEL) || '[]')
      localStorage.setItem(SLEUTEL, JSON.stringify([...(Array.isArray(weg) ? weg : []), sessie.id].slice(-20)))
    } catch { /* dan komt hij de volgende keer nog één keer terug */ }
    setSessie(null)
  }
  const dag = dagWoord(sessie.workout_date)
  const naam = String(sessie.day_display_name || '').trim()

  return (
    <div style={{ padding: isMobile ? '0 1rem' : '0 1.5rem', marginTop: isMobile ? '0.6rem' : '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.7rem 0.75rem', background: '#121212', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14 }}>
        <Dumbbell size={18} color="#10b981" strokeWidth={2.4} style={{ flexShrink: 0 }} />
        <button onClick={() => setOpen(true)} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
          <div style={{ fontSize: isMobile ? '0.88rem' : '0.82rem', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>Hoe was je training van {dag}?</div>
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {naam && !/^quick log/i.test(naam) ? `${naam} · ` : ''}twee tikken, dan weet je coach het
          </div>
        </button>
        <button onClick={() => setOpen(true)} style={{ flexShrink: 0, height: 36, padding: '0 0.9rem', borderRadius: 10, background: '#fff', color: '#0a0a0a', border: 'none', fontFamily: 'inherit', fontSize: '0.76rem', fontWeight: 900, cursor: 'pointer', touchAction: 'manipulation' }}>Invullen</button>
        <button onClick={sluit} aria-label="Niet nu" title="Niet nu" style={{ flexShrink: 0, width: 32, height: 36, background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', touchAction: 'manipulation' }}>
          <X size={16} color="rgba(255,255,255,0.5)" />
        </button>
      </div>
      <FeedbackBlad open={open} soort="workout" client={client} db={db} fase={fase}
        datum={sessie.workout_date} dagTekst={dag}
        onOpgeslagen={() => setSessie(null)} onClose={() => setOpen(false)} />
    </div>
  )
}
