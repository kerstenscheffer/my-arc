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

  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  const verschil = Math.round((laatste.gewicht - eerste.gewicht) * 10) / 10
  const kleur = verschil > 0 ? '#10b981' : verschil < 0 ? '#ef4444' : 'rgba(255,255,255,0.6)'

  // Chart layout with margins for axes
  const PAD_L = 38, PAD_T = 14, PAD_B = 18, PAD_R = 6
  const VB_W = 300, VB_H = 90
  const cW = VB_W - PAD_L - PAD_R
  const cH = VB_H - PAD_T - PAD_B
  const cx = (i) => PAD_L + (punten.length === 1 ? cW / 2 : (i / (punten.length - 1)) * cW)
  const cy = (g) => PAD_T + cH - ((g - onder) / bereik) * cH

  // Nice Y-axis ticks (max 4)
  const niceStep = (span) => {
    if (span <= 0) return 5
    const rough = span / 3
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(1, rough))))
    return ([1, 2, 2.5, 5, 10].map(c => c * mag).find(c => c >= rough)) || 5
  }
  const step = niceStep(boven - onder)
  const firstTick = Math.ceil(onder / step) * step
  const yTicks = []
  for (let v = firstTick; v <= boven + step * 0.01 && yTicks.length < 4; v = Math.round((v + step) * 1000) / 1000) {
    yTicks.push(Math.round(v * 10) / 10)
  }

  // X-axis: first, last, and 1–2 intermediates
  const xLabelIdx = new Set([0, punten.length - 1])
  if (punten.length >= 4) xLabelIdx.add(Math.round((punten.length - 1) / 3))
  if (punten.length >= 6) xLabelIdx.add(Math.round(2 * (punten.length - 1) / 3))

  const prIdx = gewichten.lastIndexOf(max)
  const laagsteIdx = gewichten.indexOf(min)
  const lineCmd = punten.map((p, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(p.gewicht).toFixed(1)}`).join(' ')
  const areaCmd = `${lineCmd} L ${cx(punten.length - 1).toFixed(1)} ${(PAD_T + cH).toFixed(1)} L ${cx(0).toFixed(1)} ${(PAD_T + cH).toFixed(1)} Z`

  return (
    <div style={{
      margin: isMobile ? '0.75rem 1rem 0' : '0.9rem 1.25rem 0',
      paddingTop: '0.85rem', borderTop: `1px solid ${LIJN}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <TrendingUp size={14} color={GOUD} strokeWidth={2.6} style={{ flexShrink: 0, alignSelf: 'center' }} />
        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
          Krachtverloop
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: kleur }}>
          {verschil > 0 ? '+' : ''}{verschil} kg
        </span>
      </div>

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ width: '100%', display: 'block' }}>
        <defs>
          <linearGradient id="krachtVlakGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GOUD} stopOpacity="0.25" />
            <stop offset="100%" stopColor={GOUD} stopOpacity="0" />
          </linearGradient>
          <clipPath id="krachtChartClip">
            <rect x={PAD_L} y={PAD_T} width={cW} height={cH} />
          </clipPath>
        </defs>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={PAD_L} y1={cy(v).toFixed(1)} x2={VB_W - PAD_R} y2={cy(v).toFixed(1)}
              stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
            <text x={PAD_L - 3} y={(cy(v) + 2.5).toFixed(1)} textAnchor="end"
              fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.4)">
              {v}
            </text>
          </g>
        ))}
        <path d={areaCmd} fill="url(#krachtVlakGrad)" clipPath="url(#krachtChartClip)" />
        <path d={lineCmd} fill="none" stroke={GOUD} strokeWidth="1.4"
          strokeLinejoin="round" strokeLinecap="round" clipPath="url(#krachtChartClip)" />
        {punten.map((p, i) => {
          const isPR = i === prIdx
          const isLow = i === laagsteIdx && laagsteIdx !== prIdx
          const r = (isPR || isLow) ? 3.2 : 2.2
          const dotFill = isPR ? '#10b981' : isLow ? '#ef4444' : (i === punten.length - 1 ? '#fff' : GOUD)
          return (
            <circle key={p.datum} cx={cx(i).toFixed(1)} cy={cy(p.gewicht).toFixed(1)} r={r} fill={dotFill}>
              <title>{`${kortDatum(p.datum)}: ${p.gewicht} kg × ${p.reps}`}</title>
            </circle>
          )
        })}
        {prIdx >= 0 && (
          <text x={cx(prIdx).toFixed(1)} y={(cy(punten[prIdx].gewicht) - 4.5).toFixed(1)}
            textAnchor="middle" fontSize="7" fontWeight="900" fill="#10b981">
            {punten[prIdx].gewicht} kg PR
          </text>
        )}
        {[...xLabelIdx].sort((a, b) => a - b).map(i => (
          <text key={i} x={cx(i).toFixed(1)} y={VB_H - 2}
            textAnchor={i === 0 ? 'start' : i === punten.length - 1 ? 'end' : 'middle'}
            fontSize="7.5" fontWeight="700" fill="rgba(255,255,255,0.4)">
            {kortDatum(punten[i].datum)}
          </text>
        ))}
      </svg>
    </div>
  )
}
