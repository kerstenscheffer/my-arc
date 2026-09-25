// src/modules/workout/components/todays-workout/components/ExerciseProgressChart.jsx
//
// Krachtverloop van één oefening: een lijn door je beste set per training.
//
// "Beste set" is hier het zwaarste gewicht van die dag; staan er meerdere sets
// met dat gewicht, dan telt die met de meeste herhalingen. Dat is wat je wilt
// zien — niet het gemiddelde, want een afzakkende laatste set zegt niets over
// je kracht, en niet het volume, want dat gaat ook omhoog als je een set
// toevoegt.
//
// Onder de lijn staat wat er veranderde sinds je eerste sessie: de reden dat
// je hier kijkt.

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

const LIJN = 'rgba(255,255,255,0.1)'
const GOUD = '#FFD700'

// Het zwaarste gewicht van een sessie; bij gelijk gewicht de meeste reps.
const besteSet = (sets) => (sets || []).reduce((beste, set) => {
  const gewicht = Number(set?.weight) || 0
  const reps = Number(set?.reps) || 0
  if (!beste) return { gewicht, reps }
  if (gewicht > beste.gewicht) return { gewicht, reps }
  if (gewicht === beste.gewicht && reps > beste.reps) return { gewicht, reps }
  return beste
}, null)

const kortDatum = (iso) => {
  try {
    return new Date(`${String(iso).slice(0, 10)}T00:00:00`)
      .toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

export default function ExerciseProgressChart({ db, client, exerciseName, isMobile }) {
  const [punten, setPunten] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    let leeft = true
    const laad = async () => {
      if (!db?.supabase || !client?.id || !exerciseName) { setLaden(false); return }
      try {
        // Laatste twaalf sessies met deze oefening. De datum zit op de sessie,
        // niet op de progressie-rij, dus we halen ze samen op.
        const { data: sessions } = await db.supabase
          .from('workout_sessions')
          .select('id, workout_date')
          .eq('client_id', client.id)
          // Ruim genomen: je traint deze oefening niet elke sessie, dus voor
          // twaalf punten heb je een flink venster aan sessies nodig.
          .order('workout_date', { ascending: false })
          .limit(150)
        if (!sessions?.length) { if (leeft) { setPunten([]); setLaden(false) } return }

        const perSessie = new Map(sessions.map(s => [s.id, s.workout_date]))
        const { data: rijen } = await db.supabase
          .from('workout_progress')
          .select('sets, session_id')
          .in('session_id', sessions.map(s => s.id))
          .eq('exercise_name', exerciseName)

        const lijst = (rijen || [])
          .map(r => {
            const beste = besteSet(r.sets)
            const datum = perSessie.get(r.session_id)
            if (!beste || !beste.gewicht || !datum) return null
            return { datum, gewicht: beste.gewicht, reps: beste.reps }
          })
          .filter(Boolean)
          // Eén punt per dag: twee rijen op dezelfde dag is dezelfde training.
          .reduce((uit, p) => {
            const bestaand = uit.find(x => x.datum === p.datum)
            if (!bestaand) uit.push(p)
            else if (p.gewicht > bestaand.gewicht) Object.assign(bestaand, p)
            return uit
          }, [])
          .sort((a, b) => String(a.datum).localeCompare(String(b.datum)))
          .slice(-12)

        if (leeft) { setPunten(lijst); setLaden(false) }
      } catch (e) {
        console.warn('Krachtverloop laden mislukt:', e?.message)
        if (leeft) { setPunten([]); setLaden(false) }
      }
    }
    laad()
    return () => { leeft = false }
  }, [db, client?.id, exerciseName])

  if (laden) return null

  // Onder de twee metingen valt er geen lijn te trekken; dan is een vlak met
  // één stip alleen maar ruis.
  if (punten.length < 2) {
    return (
      <div style={{
        margin: isMobile ? '0.75rem 1rem 0' : '0.9rem 1.25rem 0',
        padding: '0.85rem 0', borderTop: `1px solid ${LIJN}`,
        fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
      }}>
        {punten.length === 1
          ? 'Nog één training met deze oefening — vanaf de tweede zie je hier je verloop.'
          : 'Nog geen eerdere trainingen met deze oefening.'}
      </div>
    )
  }

  const gewichten = punten.map(p => p.gewicht)
  const max = Math.max(...gewichten)
  const min = Math.min(...gewichten)
  const marge = Math.max(2.5, (max - min) * 0.25)
  const boven = max + marge
  const onder = Math.max(0, min - marge)
  const bereik = Math.max(1, boven - onder)

  const B = 100   // viewBox-breedte; de svg rekt mee met de kaart
  const H = 46
  const x = (i) => (punten.length === 1 ? B / 2 : (i / (punten.length - 1)) * B)
  const y = (g) => H - ((g - onder) / bereik) * H
  const pad = punten.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(p.gewicht).toFixed(2)}`).join(' ')
  const vlak = `${pad} L ${B} ${H} L 0 ${H} Z`

  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  const verschil = Math.round((laatste.gewicht - eerste.gewicht) * 10) / 10
  const kleur = verschil > 0 ? '#10b981' : verschil < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)'

  return (
    <div style={{
      margin: isMobile ? '0.75rem 1rem 0' : '0.9rem 1.25rem 0',
      paddingTop: '0.85rem', borderTop: `1px solid ${LIJN}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <TrendingUp size={14} color={GOUD} strokeWidth={2.6} style={{ flexShrink: 0, alignSelf: 'center' }} />
        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
          Krachtverloop
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: kleur }}>
          {verschil > 0 ? '+' : ''}{verschil} kg
        </span>
      </div>

      <svg viewBox={`0 0 ${B} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: isMobile ? 76 : 92, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="krachtVlak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOUD} stopOpacity="0.22" />
            <stop offset="100%" stopColor={GOUD} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={vlak} fill="url(#krachtVlak)" />
        <path d={pad} fill="none" stroke={GOUD} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {punten.map((p, i) => (
          <circle
            key={p.datum}
            cx={x(i)} cy={y(p.gewicht)} r="2.5"
            fill={i === punten.length - 1 ? '#fff' : GOUD}
            vectorEffect="non-scaling-stroke"
          >
            <title>{`${kortDatum(p.datum)}: ${p.gewicht} kg × ${p.reps}`}</title>
          </circle>
        ))}
      </svg>

      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: 6,
        fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
      }}>
        <span>{kortDatum(eerste.datum)} · {eerste.gewicht} kg</span>
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>{kortDatum(laatste.datum)} · {laatste.gewicht} kg × {laatste.reps}</span>
      </div>
    </div>
  )
}
