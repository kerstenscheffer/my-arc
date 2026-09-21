// src/modules/coach-command-center/components/insight/GewichtBandGrafiek.jsx
//
// Het gewicht van een klant met de coaching-band eromheen: het vlak waarbinnen
// de trend hoort te blijven, de doellijn erdoorheen, en de losse wegingen als
// puntjes.
//
// De puntjes zijn bewust geen lijn. Twee kilo verschil tussen twee ochtenden is
// normaal, en een lijn door die punten suggereert een beweging die er niet is.
// Het oordeel gaat over de dikke lijn: het 7-daags gemiddelde.
//
// De rekenkunde zit in weight-tracker/utils/coachingBand.js, zodat de klant-kant
// straks dezelfde band kan tonen zonder dat de twee uit elkaar lopen.

import { useMemo, useState } from 'react'
import {
  ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Scale, Info } from 'lucide-react'
import {
  maakConfig, trendReeks, bepaalStart, weekFractie, lijnenOpWeek,
  weekBeoordelingen, advies, STATUS_TEKST, STATUS_KLEUR,
} from '../../../weight-tracker/utils/coachingBand'

const kort = (d) => {
  try {
    return new Date(`${String(d).slice(0, 10)}T00:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  } catch { return d }
}

// Eigen tooltip. De standaard van recharts kleurt elke regel naar de kleur van
// zijn lijn — en die zijn hier grijs tot bijna zwart, dus onleesbaar op een
// donkere achtergrond. Hij toonde bovendien de x-waarde van de puntjes als
// extra regel ("Weging: 5 mei kg").
function Kaartje({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const van = (sleutel) => payload.find(p => p.dataKey === sleutel)?.value
  const trend = van('trend')
  const meting = van('meting')
  const band = van('band')
  const doel = van('doel')

  const regel = (naam, waarde, dik = false) => waarde == null ? null : (
    <div key={naam} style={{
      display: 'flex', justifyContent: 'space-between', gap: 14,
      fontSize: '0.7rem', fontWeight: dik ? 900 : 700,
      color: dik ? '#fff' : 'rgba(255,255,255,0.5)',
      marginTop: 2,
    }}>
      <span>{naam}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{waarde}</span>
    </div>
  )

  return (
    <div style={{
      background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '0.5rem 0.65rem',
      boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
    }}>
      <div style={{ fontSize: '0.66rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
        {label}
      </div>
      {regel('7-daags gemiddelde', trend != null ? `${trend} kg` : null, true)}
      {regel('Weging', meting != null ? `${meting} kg` : null)}
      {regel('Streeftempo', doel != null ? `${doel} kg` : null)}
      {regel('Band', Array.isArray(band) && band[0] !== band[1] ? `${band[0]} – ${band[1]} kg` : null)}
    </div>
  )
}

export default function GewichtBandGrafiek({ client, history, isMobile }) {
  const [uitleg, setUitleg] = useState(false)

  const model = useMemo(() => {
    const config = maakConfig(client)
    const reeks = trendReeks(history)
    if (reeks.length === 0) return { config, leeg: true }
    const { startGewicht, startDatum, herijkt } = bepaalStart(client, reeks)
    if (!Number.isFinite(startGewicht)) return { config, leeg: true }

    const punten = reeks.map(r => {
      const n = weekFractie(r.datum, startDatum, config.venster_dagen)
      const l = lijnenOpWeek(n, startGewicht, config)
      const hoog = Math.max(l.traag, l.snel)
      const laag = Math.min(l.traag, l.snel)
      return {
        datum: r.datum,
        label: kort(r.datum),
        meting: r.meting,
        trend: r.trend,
        doel: Math.round(l.doel * 10) / 10,
        band: [Math.round(laag * 10) / 10, Math.round(hoog * 10) / 10],
      }
    })

    const weken = weekBeoordelingen(reeks, startGewicht, startDatum, config)
    const laatste = weken[weken.length - 1] || null
    return { config, punten, weken, laatste, startGewicht, startDatum, herijkt, leeg: false }
  }, [client, history])

  if (model.leeg) {
    return (
      <div style={{
        padding: '1.5rem 1rem', textAlign: 'center',
        color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', fontWeight: 700,
      }}>
        Nog geen wegingen om een band op te tekenen.
      </div>
    )
  }

  const { config, punten, laatste } = model
  const raad = advies(laatste, config)
  const kleur = STATUS_KLEUR[laatste?.status] || 'rgba(255,255,255,0.35)'

  // Y-as: net iets ruimer dan wat er te zien is, zodat de band niet tegen de
  // rand plakt.
  const waarden = punten.flatMap(p => [p.meting, p.trend, p.band[0], p.band[1]]).filter(Number.isFinite)
  const min = Math.floor(Math.min(...waarden) - 1)
  const max = Math.ceil(Math.max(...waarden) + 1)

  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem 0.75rem' : '0.625rem 1rem 0.875rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Scale size={12} color="rgba(255,255,255,0.4)" strokeWidth={2.6} />
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', flex: 1 }}>
          Coaching-band
        </span>
        <button
          onClick={() => setUitleg(v => !v)}
          title="Hoe deze band werkt"
          aria-label="Uitleg"
          style={{
            width: 22, height: 22, padding: 0, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)',
            cursor: 'pointer', touchAction: 'manipulation',
          }}
        >
          <Info size={12} />
        </button>
      </div>

      {uitleg && (
        <div style={{
          fontSize: '0.64rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.45, marginBottom: 8,
          padding: '0.5rem 0.6rem', borderRadius: 8,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          Het grijze vlak is het tempo dat we willen zien: tussen {config.traagste_pct}% en {config.snelste_pct}% van
          het startgewicht per week{config.kwetsbaar ? ' (strenger, want lean of ouder)' : ''}. De stippellijn is het
          streeftempo van {config.streeftempo_pct}%. De dikke lijn is het 7-daags gemiddelde — daar gaat het oordeel
          over. De puntjes zijn losse wegingen; daar beoordelen we nooit op.
          {model.herijkt && ' Startgewicht is herijkt op de eerste betrouwbare weektrend.'}
        </div>
      )}

      <div style={{ width: '100%', height: isMobile ? 190 : 230 }}>
        <ResponsiveContainer>
          <ComposedChart data={punten} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="label" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false} tickLine={false} minTickGap={24}
            />
            <YAxis
              domain={[min, max]} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)' }}
              axisLine={false} tickLine={false} width={34}
            />
            <Tooltip content={<Kaartje />} cursor={{ stroke: 'rgba(255,255,255,0.25)' }} />
            {/* Het vlak tussen te snel en te langzaam. */}
            <Area
              dataKey="band" stroke="none" fill="rgba(255,255,255,0.07)"
              isAnimationActive={false} activeDot={false}
            />
            <Line
              dataKey="doel" stroke="rgba(255,255,255,0.28)" strokeWidth={1}
              strokeDasharray="4 4" dot={false} isAnimationActive={false}
            />
            {/* Losse wegingen: puntjes, geen lijn. */}
            <Scatter dataKey="meting" fill="rgba(255,255,255,0.3)" shape="circle" r={2} isAnimationActive={false} />
            <Line
              dataKey="trend" stroke="#fff" strokeWidth={2.4} dot={false}
              isAnimationActive={false} connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Het oordeel in één regel, plus wat je ermee zou doen. */}
      {laatste && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          marginTop: 8, padding: '0.55rem 0.7rem', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <span style={{
            flexShrink: 0, marginTop: 3, width: 7, height: 7, borderRadius: '50%', background: kleur,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 900, color: '#fff' }}>
              {STATUS_TEKST[laatste.status] || '—'}
              <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>
                {' · week '}{laatste.week}
                {laatste.wekenBuiten > 1 ? ` · ${laatste.wekenBuiten} weken op rij` : ''}
              </span>
            </div>
            {raad && (
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', marginTop: 2, lineHeight: 1.4 }}>
                {raad.tekst}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
