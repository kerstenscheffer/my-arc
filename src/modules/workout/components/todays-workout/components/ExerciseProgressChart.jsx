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
//
// De opmaak volgt de gewichtsgrafiek (GewichtBandGrafiek): recharts, witte as-
// labels, een vlak onder de lijn en dezelfde lijndikte. Hier stond een met de
// hand getekende SVG in een viewBox van 300 bij 90, waardoor de tekst met de
// breedte meeschaalde en op een telefoon onleesbaar klein werd. Twee grafieken
// in dezelfde app horen niet twee verschillende talen te spreken.

import { useEffect, useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Info } from 'lucide-react'
import { metBandFases, faseSamenvatting, KLEUR_VOOR, oordeelTekst } from '../krachtBand'

const LIJN = 'rgba(255,255,255,0.1)'
const GROEN = '#10b981'
const ROOD = '#ef4444'

// Geschat 1RM volgens Epley: het gewicht dat je één keer zou kunnen tillen,
// afgeleid uit een set die je wél hebt gedaan.
//
//   1RM ≈ gewicht × (1 + reps / 30)
//
// Waarom niet gewoon het zwaarste gewicht: dan zie je vooruitgang alleen als er
// een schijf bij gaat. Ga je van 70 kg × 8 naar 70 kg × 11, dan ben je sterker
// geworden en bleef de lijn vlak — precies het gat dat dit dicht.
//
// Boven de twaalf herhalingen wordt de schatting onbetrouwbaar (je loopt dan
// eerder tegen je conditie aan dan tegen je kracht), dus daar rekenen we mee
// alsof het er twaalf waren. Een set van dertig telt dus niet als een 1RM van
// het dubbele.
const MAX_REPS_VOOR_SCHATTING = 12

export const geschat1RM = (gewicht, reps) => {
  const g = Number(gewicht) || 0
  const r = Math.min(Math.max(Number(reps) || 1, 1), MAX_REPS_VOOR_SCHATTING)
  if (!g) return 0
  return Math.round(g * (1 + r / 30) * 10) / 10
}

// De set die het meest zegt over je kracht die dag: de hoogste schatting, niet
// per se het zwaarste gewicht. 70 kg × 8 (schatting 88,7) telt dus zwaarder dan
// 80 kg × 1 (schatting 82,7) — acht herhalingen op zeventig is meer werk dan
// één zware poging.
const besteSet = (sets) => (sets || []).reduce((beste, set) => {
  const gewicht = Number(set?.weight) || 0
  const reps = Number(set?.reps) || 0
  if (!gewicht) return beste
  const score = geschat1RM(gewicht, reps)
  if (!beste || score > beste.score) return { gewicht, reps, score }
  return beste
}, null)

const kortDatum = (iso) => {
  try {
    return new Date(`${String(iso).slice(0, 10)}T00:00:00`)
      .toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return '' }
}

// Zelfde kaartje als bij de gewichtsgrafiek: recharts kleurt zijn standaard
// regels naar de lijnkleur, en dat is hier wit op wit.
function Kaartje({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div style={{
      background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '0.5rem 0.65rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
        {p.label}
      </div>
      <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fff' }}>
        {p.gewicht} kg geschat 1RM
      </div>
      <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
        gedaan: {p.ruwGewicht} kg × {p.reps}
      </div>
      {p.doel != null && (
        <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
          Streeftempo hier: {p.doel} kg
          {p.norm?.faseDoel ? ` · ${p.norm.faseDoel}` : ''}
        </div>
      )}
      {p.oordeel && (
        <div style={{ fontSize: '0.66rem', fontWeight: 900, color: KLEUR_VOOR[p.oordeel], marginTop: 2 }}>
          {oordeelTekst(p.oordeel, p.norm)}
        </div>
      )}
      {p.isPR && (
        <div style={{ fontSize: '0.66rem', fontWeight: 900, color: GROEN, marginTop: 2 }}>
          Zwaarste tot nu toe
        </div>
      )}
    </div>
  )
}

export default function ExerciseProgressChart({ db, client, exerciseName, isMobile }) {
  // Eigen id voor het kleurverloop: staan er twee van deze grafieken op één
  // pagina, dan pakken ze anders elkaars definitie.
  const velling = String(exerciseName || 'x').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'x'
  const [punten, setPunten] = useState([])
  const [laden, setLaden] = useState(true)
  // Álle fases van deze klant, niet alleen de lopende. Iemand die maanden
  // cutte en nu bouwt hoort een doellijn te zien die tijdens de cut vlak loopt
  // en pas vanaf de build klimt.
  const [fases, setFases] = useState([])
  const [uitleg, setUitleg] = useState(false)

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
        // De fases erbij. Mislukt dit, dan valt de norm terug op opbouwen —
        // dan klopt het oordeel misschien niet, maar de grafiek staat er wel.
        db.supabase
          .from('client_phases')
          .select('doel, started_on')
          .eq('client_id', client.id)
          .order('started_on', { ascending: true })
          .then(r => r, () => ({ data: [] }))
          .then(({ data }) => { if (leeft) setFases(data || []) })

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
            // `gewicht` is bewust de schátting: de band, het oordeel en de
            // as rekenen daarop. Wat je die dag echt tilde bewaren we ernaast
            // voor de tooltip.
            return { datum, gewicht: beste.score, ruwGewicht: beste.gewicht, reps: beste.reps }
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

  // De reeks geschatte 1RM's: de maat waarop de band, het oordeel en de PR gaan.
  const gewichten = punten.map(p => p.gewicht)
  const max = Math.max(...gewichten)
  const min = Math.min(...gewichten)

  const eerste = punten[0]
  const laatste = punten[punten.length - 1]
  const verschil = Math.round((laatste.gewicht - eerste.gewicht) * 10) / 10
  const kleur = verschil > 0 ? GROEN : verschil < 0 ? ROOD : 'rgba(255,255,255,0.6)'

  // De PR is de laatste keer dat je het zwaarste gewicht haalde — bij gelijk
  // gewicht is de recentste het nieuws. Het laagste punt is de eerste keer:
  // dat is waar je vandaan komt.
  const prIdx = gewichten.lastIndexOf(max)
  const laagsteIdx = gewichten.indexOf(min)

  // De band eromheen: waar je minimaal hoort te zitten, waar we op mikken, en
  // hoe dit punt daartegen afsteekt. Rekenen gebeurt in krachtBand.js zodat de
  // norm op één plek staat.
  const data = metBandFases(punten, fases).map((p, i) => ({
    ...p,
    label: kortDatum(p.datum),
    isPR: i === prIdx,
    isLaagste: i === laagsteIdx && laagsteIdx !== prIdx,
  }))

  // Iets ruimer dan wat er te zien is, zodat de lijn niet tegen de rand plakt
  // en het PR-label erboven past. Zelfde aanpak als de gewichtsgrafiek.
  // Het domein moet ook de band en de doellijn omvatten, anders loopt de
  // doellijn boven de grafiek uit zodra iemand achterloopt. Afronden op vijf
  // kilo geeft nette aslabels (70, 75, 80) in plaats van 69, 73, 77.
  const alles = [
    ...gewichten,
    ...data.map(p => p.doel).filter(Number.isFinite),
    ...data.flatMap(p => (Array.isArray(p.band) ? p.band : [])).filter(Number.isFinite),
  ]
  const marge = Math.max(2.5, (Math.max(...alles) - Math.min(...alles)) * 0.2)
  const onder = Math.max(0, Math.floor((Math.min(...alles) - marge) / 5) * 5)
  const boven = Math.ceil((Math.max(...alles) + marge) / 5) * 5

  // Elke log een eigen punt. De PR groen en groter, het laagste rood; de rest
  // wit, met de laatste net iets groter want daar kijk je naar.
  const Punt = (props) => {
    const { cx, cy, payload, index } = props
    if (cx == null || cy == null) return null
    const isLaatste = index === data.length - 1
    const kleurPunt = payload.isPR ? GROEN
      : payload.isLaagste ? ROOD
      : (KLEUR_VOOR[payload.oordeel] || '#fff')
    const straal = payload.isPR ? 5 : payload.isLaagste ? 4.5 : isLaatste ? 4 : 3
    return (
      <g>
        <circle cx={cx} cy={cy} r={straal} fill={kleurPunt} stroke="#0a0a0a" strokeWidth={1.5} />
        {payload.isPR && (
          <text
            x={cx} y={cy - 10} textAnchor="middle"
            fontSize={11} fontWeight={900} fill={GROEN}
          >
            {payload.gewicht} kg PR
          </text>
        )}
      </g>
    )
  }

  return (
    <div style={{
      margin: isMobile ? '0.75rem 1rem 0' : '0.9rem 1.25rem 0',
      paddingTop: '0.85rem', borderTop: `1px solid ${LIJN}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <TrendingUp size={14} color="#fff" strokeWidth={2.6} style={{ flexShrink: 0, alignSelf: 'center' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff' }}>
          Krachtverloop
        </span>
        <button
          onClick={() => setUitleg(v => !v)}
          title="Hoe dit gerekend wordt"
          aria-label="Uitleg"
          style={{
            width: 20, height: 20, padding: 0, borderRadius: 6, alignSelf: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none',
            color: uitleg ? '#fff' : 'rgba(255,255,255,0.35)',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Info size={13} />
        </button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 900, color: kleur }}>
          {verschil > 0 ? '+' : ''}{verschil} kg
        </span>
      </div>

      {uitleg && (
        <div style={{
          fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          lineHeight: 1.5, marginBottom: 8,
          padding: '0.6rem 0.7rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          De lijn is je <strong style={{ color: '#fff' }}>geschatte 1RM</strong>: het gewicht dat je
          één keer zou kunnen tillen, berekend uit je beste set van die training —
          gewicht × (1 + herhalingen ÷ 30).
          <br /><br />
          Daardoor telt ook vooruitgang in herhalingen mee. Ga je van 70 kg × 8 naar
          70 kg × 11, dan gaat de lijn omhoog (88,7 → 95,7) terwijl er geen schijf bij ging.
          Je bent immers sterker geworden.
          <br /><br />
          Boven de twaalf herhalingen rekenen we alsof het er twaalf waren: daarboven
          meet je vooral je conditie en wordt de schatting onbetrouwbaar. In de tooltip
          zie je altijd wat je die dag echt hebt getild.
          {norm?.faseDoel && (
            <>
              <br /><br />
              De band en de streeplijn horen bij je <strong style={{ color: '#fff' }}>{norm.faseDoel}</strong>-fase:
              {norm.faseDoel === 'cut'
                ? ' in een tekort is kracht vasthouden het doel, een lichte daling hoort erbij.'
                : ' daar hoort je kracht op te lopen.'}
            </>
          )}
        </div>
      )}

      <div style={{ width: '100%', height: isMobile ? 190 : 230 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 16, right: 10, bottom: 0, left: -18 }}>
            <defs>
              {/* De lijn kleurt mee met hoe je ervoor staat: groen op tempo,
                  oranje als je vooruitgaat maar traag, rood als je stilstaat.
                  Eén lijn met een verloop per meetpunt — precies zoals de
                  trendlijn in de gewichtsgrafiek. */}
              <linearGradient id={`kracht-lijn-${velling}`} x1="0" y1="0" x2="1" y2="0">
                {data.map((p, i) => (
                  <stop
                    key={p.datum}
                    offset={data.length > 1 ? `${(i / (data.length - 1)) * 100}%` : '0%'}
                    stopColor={KLEUR_VOOR[p.oordeel] || '#fff'}
                  />
                ))}
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label" tick={{ fontSize: 10, fill: '#fff', fontWeight: 800 }}
              axisLine={false} tickLine={false} minTickGap={28}
            />
            <YAxis
              domain={[onder, boven]} tick={{ fontSize: 10, fill: '#fff', fontWeight: 800 }}
              axisLine={false} tickLine={false} width={38}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<Kaartje />} cursor={{ stroke: 'rgba(255,255,255,0.25)' }} />
            {/* Het vlak tussen "dit is het minste wat we willen zien" en het
                streeftempo. Zit je lijn erin of erboven, dan loopt het. */}
            <Area
              dataKey="band" stroke="none" fill="rgba(255,255,255,0.07)"
              isAnimationActive={false} activeDot={false}
            />
            {/* Het streeftempo zelf: een streep, geen lijn om op te sturen. */}
            <Line
              dataKey="doel" stroke="rgba(255,255,255,0.28)" strokeWidth={1}
              strokeDasharray="4 4" dot={false} isAnimationActive={false}
            />
            <Line
              dataKey="gewicht" stroke={`url(#kracht-lijn-${velling})`} strokeWidth={2.6}
              strokeLinejoin="round" strokeLinecap="round"
              dot={<Punt />} activeDot={false} isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Wat de band betekent. Zonder deze regel is een grijs vlak onder een
          lijn decoratie, en dan gaat niemand ernaar handelen. */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.9rem',
        marginTop: 2, fontSize: '0.62rem', fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 2, background: 'rgba(255,255,255,0.28)' }} />
          {(() => {
            const stukken = faseSamenvatting(punten, fases)
            if (!stukken.length || !stukken[0].doel) return 'streeftempo'
            // "cut tot 4 sep · build daarna" — zodat je ziet waarom de lijn
            // halverwege van richting verandert.
            return stukken
              .map((f, i) => i === 0 && stukken.length > 1
                ? `${f.doel} tot ${kortDatum(stukken[1].vanaf)}`
                : i === 0 ? `${f.doel}-fase` : `${f.doel} daarna`)
              .join(' · ')
          })()}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />
          minimaal tot streef
        </span>
      </div>
    </div>
  )
}
