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
  ComposedChart, Area, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Info } from 'lucide-react'
import KopKeuze from './KopKeuze'
import {
  maakConfig, trendReeks, bepaalStart, weekFractie, lijnenOpWeek,
  weekBeoordelingen, advies, ernstVan, kleurVoorErnst, weergaveStatus, STATUS_TEKST, STATUS_KLEUR,
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

// De kolommen van de weektabel, op één plek zodat koprij en rijen niet uit de
// pas lopen. Zelfde opzet als de set-tabel in het oefening-logboek.
const KOLOMMEN = '4.4rem 1fr 3.4rem 3.2rem 1fr'

// Week-op-week in cijfers. Een grafiek laat zien hoe het loopt; een tabel laat
// zien wat er staat — en dat is wat je nodig hebt als je moet besluiten of je
// bijstuurt.
function WeekTabel({ weken, startDatum, isMobile }) {
  const bereik = (n) => {
    const van = new Date(`${String(startDatum).slice(0, 10)}T00:00:00`)
    van.setDate(van.getDate() + n * 7)
    const tot = new Date(van)
    tot.setDate(tot.getDate() + 6)
    const f = (d) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    return `${f(van)} – ${f(tot)}`
  }

  const kop = {
    display: 'grid', gridTemplateColumns: KOLOMMEN, gap: '0 0.6rem', alignItems: 'center',
    padding: isMobile ? '0.5rem 0 0.35rem' : '0.6rem 0 0.4rem',
    fontSize: '0.6rem', fontWeight: 900, color: 'rgba(255,255,255,0.3)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={kop}>
        <span>Week</span>
        <span>Trend</span>
        <span style={{ textAlign: 'right' }}>Δ</span>
        <span style={{ textAlign: 'right' }}>Weeg</span>
        <span style={{ textAlign: 'right' }}>Oordeel</span>
      </div>
      {[...weken].reverse().map(w => {
        const kleur = STATUS_KLEUR[w.status] || 'rgba(255,255,255,0.35)'
        return (
          <div key={w.week} style={{
            display: 'grid', gridTemplateColumns: KOLOMMEN, gap: '0 0.6rem', alignItems: 'center',
            padding: '0.45rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fff' }}>
              wk {w.week}
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#fff' }}>
              {w.trend != null ? `${w.trend} kg` : '—'}
              <span style={{
                display: isMobile ? 'none' : 'inline',
                fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginLeft: 6,
              }}>
                {bereik(w.week)}
              </span>
            </span>
            <span style={{
              textAlign: 'right', fontSize: '0.72rem', fontWeight: 900,
              color: w.verschil == null ? 'rgba(255,255,255,0.25)' : kleur,
            }}>
              {w.verschil == null ? '—' : `${w.verschil > 0 ? '+' : ''}${w.verschil}`}
            </span>
            <span style={{
              textAlign: 'right', fontSize: '0.7rem', fontWeight: 800,
              // Onder de vijf metingen is een week geen oordeel waard; dat hoor
              // je aan deze kolom te zien zonder de uitleg te lezen.
              color: w.metingen >= 5 ? 'rgba(255,255,255,0.45)' : '#f59e0b',
            }}>
              {w.metingen}×
            </span>
            <span style={{
              textAlign: 'right', fontSize: '0.64rem', fontWeight: 900, color: kleur,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {STATUS_TEKST[w.status] || '—'}
              {w.wekenBuiten > 1 ? ` ${w.wekenBuiten}×` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function GewichtBandGrafiek({
  client, history, fase = null, fases = [], onNieuweFase = null, onBijsturen = null, isMobile,
}) {
  const [uitleg, setUitleg] = useState(false)
  const [weergave, setWeergave] = useState('grafiek')   // 'grafiek' | 'tabel'
  // Welke fase staat er in beeld. null = de lopende fase (of, zonder fases, de
  // hele reeks). 'alles' = de hele geschiedenis met alle fases achter elkaar.
  const [gekozen, setGekozen] = useState(null)

  // Fases oplopend in tijd, met hun einddatum ingevuld: de volgende fase begint
  // waar deze ophoudt, ook als ended_on leeg bleef.
  const perFase = useMemo(() => {
    const lijst = [...(fases || [])].sort((a, b) => String(a.started_on).localeCompare(String(b.started_on)))
    return lijst.map((f, i) => ({
      ...f,
      eindigt: f.ended_on || lijst[i + 1]?.started_on || null,
    }))
  }, [fases])

  const actief = (gekozen === 'alles' || gekozen === 'daarvoor')
    ? null
    : (perFase.find(f => f.id === gekozen) || fase)

  // Metingen van vóór de eerste fase. Daar is nooit een tempo voor afgesproken,
  // dus daar hoort geen band bij — maar je wilt er wel naar kunnen kijken. Bij
  // ks10k zijn dat 117 wegingen van maart tot september.
  const eersteStart = perFase[0]?.started_on ? String(perFase[0].started_on).slice(0, 10) : null
  const heeftDaarvoor = !!eersteStart && (history || []).some(e => String(e?.date || '').slice(0, 10) < eersteStart)

  // Wat er in de fase-dropdown staat: de lopende fase, wat eraan voorafging, en
  // onderaan de knop om er een te beginnen.
  const faseOpties = useMemo(() => {
    const omgekeerd = [...perFase].reverse()
    const lijst = omgekeerd.length > 0
      ? omgekeerd.map((f, i) => ({
        id: i === 0 ? 'nu' : f.id,
        label: `${(f.doel || 'fase')[0].toUpperCase()}${(f.doel || 'fase').slice(1)} · ${kort(f.started_on)}`,
      }))
      : [{ id: 'nu', label: 'Geen fase' }]
    if (heeftDaarvoor) lijst.push({ id: 'daarvoor', label: 'Daarvoor' })
    if (perFase.length > 1) lijst.push({ id: 'alles', label: 'Alle fases' })
    if (onNieuweFase) lijst.push({ id: 'nieuw', label: '+ Nieuwe fase' })
    return lijst
  }, [perFase, heeftDaarvoor, onNieuweFase])


  const model = useMemo(() => {
    // ── Vóór de eerste fase: wel de lijn, geen band ──
    if (gekozen === 'daarvoor' && eersteStart) {
      const voor = (history || []).filter(e => String(e?.date || '').slice(0, 10) < eersteStart)
      const reeksVoor = trendReeks(voor)
      if (reeksVoor.length === 0) return { leeg: true, config: maakConfig(client, null) }
      return {
        config: maakConfig(client, null),
        punten: reeksVoor.map(r => ({ datum: r.datum, label: kort(r.datum), meting: r.meting, trend: r.trend })),
        zonderBand: true, leeg: false,
      }
    }

    // ── Alle fases achter elkaar ──
    // Elke meting krijgt de band van de fase waarin hij valt. Zo zie je een cut
    // en de build erna in één lijn, elk met hun eigen tempo, in plaats van één
    // band die nergens klopt.
    if (gekozen === 'alles' && perFase.length > 0) {
      const reeksAlles = trendReeks(history)
      if (reeksAlles.length === 0) return { leeg: true, config: maakConfig(client, null) }
      const faseVan = (datum) => {
        const d = String(datum).slice(0, 10)
        return perFase.find(f => d >= String(f.started_on).slice(0, 10) && (!f.eindigt || d < String(f.eindigt).slice(0, 10))) || null
      }
      const punten = reeksAlles.map(r => {
        const f = faseVan(r.datum)
        if (!f?.start_gewicht) return { datum: r.datum, label: kort(r.datum), meting: r.meting, trend: r.trend }
        const c = maakConfig(client, f)
        const n = weekFractie(r.datum, f.started_on, c.venster_dagen)
        const l = lijnenOpWeek(n, Number(f.start_gewicht), c)
        return {
          datum: r.datum, label: kort(r.datum), meting: r.meting, trend: r.trend,
          doel: Math.round(l.doel * 10) / 10,
          band: [Math.round(Math.min(l.traag, l.snel) * 10) / 10, Math.round(Math.max(l.traag, l.snel) * 10) / 10],
          ernst: ernstVan(r.trend, l),
        }
      })
      return {
        config: maakConfig(client, fase), punten, alles: true, leeg: false,
        grenzen: perFase.slice(1).map(f => ({ datum: f.started_on, label: kort(f.started_on), doel: f.doel })),
      }
    }

    // ── Eén fase ──
    const config = maakConfig(client, actief)
    // Binnen een fase telt alleen wat er ná de start van die fase gemeten is.
    // Anders trekt een cut van drie maanden geleden de band van een build
    // scheef.
    const van = actief?.started_on ? String(actief.started_on).slice(0, 10) : null
    const tot = actief?.eindigt ? String(actief.eindigt).slice(0, 10) : null
    const binnenFase = van
      ? (history || []).filter(e => {
        const d = String(e?.date || '').slice(0, 10)
        return d >= van && (!tot || d < tot)
      })
      : history
    const reeks = trendReeks(binnenFase)
    if (reeks.length === 0) return { config, leeg: true }

    // De fase levert het nulpunt; zonder fase zoeken we het in de metingen.
    const uitFase = actief?.start_gewicht && actief?.started_on
      ? { startGewicht: Number(actief.start_gewicht), startDatum: actief.started_on, herijkt: false }
      : null
    const { startGewicht, startDatum, herijkt } = uitFase || bepaalStart(client, reeks)
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
        ernst: ernstVan(r.trend, l),
      }
    })

    const weken = weekBeoordelingen(reeks, startGewicht, startDatum, config)
    const laatste = weken[weken.length - 1] || null
    return { config, punten, weken, laatste, startGewicht, startDatum, herijkt, leeg: false }
  }, [client, history, actief, gekozen, perFase, fase, eersteStart])

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
  // Eén gradient-id per weergave: twee grafieken op één pagina zouden anders
  // elkaars verloop gebruiken.
  const kleurId = `${client?.id || 'x'}-${gekozen || 'nu'}`
  const raad = advies(laatste, config)
  // De kop volgt niet blind het tempo-oordeel: staat hij achter op de lijn,
  // dan hoort daar geen groen "op koers" boven.
  const kopStatus = weergaveStatus(laatste)
  const kleur = STATUS_KLEUR[kopStatus] || 'rgba(255,255,255,0.35)'

  // Y-as: net iets ruimer dan wat er te zien is, zodat de band niet tegen de
  // rand plakt.
  // Niet elk punt heeft een band: vóór de eerste fase is er geen tempo
  // afgesproken, en in de alles-weergave vallen die punten er ook tussen.
  // Zonder deze controle knalde de grafiek erop stuk.
  const waarden = punten
    .flatMap(p => [p.meting, p.trend, ...(Array.isArray(p.band) ? p.band : [])])
    .filter(Number.isFinite)
  const min = waarden.length ? Math.floor(Math.min(...waarden) - 1) : 0
  const max = waarden.length ? Math.ceil(Math.max(...waarden) + 1) : 100

  return (
    <div style={{ padding: isMobile ? '0.5rem 0.75rem 0.75rem' : '0.625rem 1rem 0.875rem' }}>
      {/* Eén regel voor alles wat je hier kunt kiezen: welke fase je bekijkt
          (met onderin de knop voor een nieuwe) en of je de lijn of de cijfers
          wilt. De losse fase-regel bovenaan de kolom is hierin opgegaan. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <KopKeuze
          groot
          waarde={gekozen || (perFase.find(f => f.id === fase?.id) ? fase.id : 'nu')}
          opties={faseOpties}
          onKies={(id) => {
            if (id === 'nieuw') { onNieuweFase?.(); return }
            setGekozen(id === 'nu' ? null : id)
          }}
        />
        <KopKeuze
          waarde={weergave}
          opties={[{ id: 'grafiek', label: 'Grafiek' }, { id: 'tabel', label: 'Tabel' }]}
          onKies={setWeergave}
          kleur="rgba(255,255,255,0.65)"
        />
        <span style={{ flex: 1 }} />
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
          {model.zonderBand ? (
            <>Wegingen van vóór de eerste vastgelegde fase. Er is toen geen tempo afgesproken, dus er is ook geen
            band om tegen af te meten — je ziet alleen de trend en de losse metingen. Wil je hier wel een oordeel
            over, leg die periode dan alsnog als fase vast.</>
          ) : model.alles ? (
            <>Alle fases achter elkaar. Elke meting wordt afgemeten tegen de band van de fase waarin hij valt,
            dus een cut en de build erna hebben elk hun eigen tempo. Het oordeel staat hier niet: dat hoort bij
            één fase.</>
          ) : config.richting === 'stabiel' ? (
            <>Het doel is stilstand, dus dit is een behoudstrook van een halve procent om het startgewicht.
            De weegschaal zegt hier weinig: beoordeel op kracht, omvang en foto's.</>
          ) : (
            <>Het grijze vlak is het tempo dat we willen zien: tussen {config.traagKg.toFixed(2)} en {config.snelKg.toFixed(2)} kg
            per week{config.kwetsbaar ? ' (afgetopt, want lean of ouder)' : ''}. De stippellijn is het afgesproken
            tempo van {config.tempoKg.toFixed(2)} kg per week{actief?.doel ? ` uit de ${actief.doel}-fase` : ''}. De dikke
            lijn is het 7-daags gemiddelde — daar gaat het oordeel over. De puntjes zijn losse wegingen; daar
            beoordelen we nooit op.</>
          )}
          {model.herijkt && ' Startgewicht is herijkt op de eerste betrouwbare weektrend.'}
        </div>
      )}

      {weergave === 'tabel' && (model.weken || []).length > 0 ? (
        <WeekTabel weken={model.weken} startDatum={model.startDatum} isMobile={isMobile} />
      ) : (
      <div style={{ width: '100%', height: isMobile ? 190 : 230 }}>
        <ResponsiveContainer>
          <ComposedChart data={punten} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            {/* De trendlijn kleurt mee: groen zolang hij in de band ligt, en
                daarbuiten oplopend van oranje naar rood naarmate hij er verder
                vanaf zit. Eén lijn met een verloop per meetpunt — twintig losse
                lijnstukjes tekenen zou hetzelfde doen maar vier keer zo traag. */}
            <defs>
              <linearGradient id={`trend-${kleurId}`} x1="0" y1="0" x2="1" y2="0">
                {punten.map((p, i) => (
                  <stop
                    key={p.datum}
                    offset={punten.length > 1 ? `${(i / (punten.length - 1)) * 100}%` : '0%'}
                    stopColor={kleurVoorErnst(p.ernst)}
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
              domain={[min, max]} tick={{ fontSize: 10, fill: '#fff', fontWeight: 800 }}
              axisLine={false} tickLine={false} width={38}
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
              dataKey="trend" stroke={`url(#trend-${kleurId})`} strokeWidth={2.6} dot={false}
              isAnimationActive={false} connectNulls
            />
            {/* Waar een nieuwe fase begint. */}
            {(model.grenzen || []).map(g => (
              <ReferenceLine
                key={g.datum} x={g.label} stroke="rgba(255,255,255,0.22)" strokeDasharray="3 3"
                label={{ value: g.doel, position: 'top', fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800 }}
              />
            ))}
            {/* Het doelgewicht van de fase is een horizon, geen plan: het zegt
                waar deze fase ongeveer ophoudt, niet hoe snel je er hoort te
                komen. Vandaar een streep en geen lijn die meeloopt. */}
            {Number.isFinite(config.doelGewicht) && config.doelGewicht > 0 && (
              <ReferenceLine
                y={config.doelGewicht} stroke="rgba(16,185,129,0.5)" strokeDasharray="2 4"
                label={{
                  value: `horizon ${config.doelGewicht}`, position: 'insideBottomRight',
                  fill: 'rgba(16,185,129,0.65)', fontSize: 9, fontWeight: 800,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Het oordeel. Eén ding groot en wit — dat is waar je naar kijkt — en
          daaronder wat je ermee doet. De grijze regels eronder zijn de cijfers
          waar het op rust; die lees je alleen als je twijfelt. Alleen bij één
          fase: over een reeks fases heen is 'op koers' betekenisloos. */}
      {laatste && !model.alles && !model.zonderBand && (
        <div style={{
          marginTop: 10, padding: isMobile ? '0.7rem 0.8rem' : '0.8rem 0.9rem',
          borderRadius: 12,
          background: kleur === '#10b981' ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${kleur}55`,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: 900,
              color: kleur, letterSpacing: '-0.02em',
            }}>
              {STATUS_TEKST[kopStatus] || '—'}
            </span>
            {laatste.wekenBuiten > 1 && (
              <span style={{
                fontSize: '0.64rem', fontWeight: 900, color: '#0a0a0a',
                background: kleur, borderRadius: 999, padding: '0.1rem 0.4rem',
              }}>
                {laatste.wekenBuiten} weken op rij
              </span>
            )}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>
              week {laatste.week}
            </span>
          </div>

          {raad && (
            <div style={{
              fontSize: isMobile ? '0.76rem' : '0.8rem', fontWeight: 800,
              color: '#fff', marginTop: 4, lineHeight: 1.35,
            }}>
              {raad.tekst}
            </div>
          )}

          {/* Van oordeel naar handeling in één klik. Zet niets vast: het opent
              het macro-paneel met dit voorstel klaar, jij bevestigt. */}
          {raad?.kcal && onBijsturen && (
            <button
              onClick={() => onBijsturen(raad.kcal)}
              style={{
                marginTop: 8, minHeight: 34, padding: '0 0.7rem', borderRadius: 9,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: '#fff', border: 'none', color: '#0a0a0a',
                fontSize: '0.74rem', fontWeight: 900, fontFamily: 'inherit',
                cursor: 'pointer',
                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              }}
            >
              Macro's bijstellen · {raad.kcal > 0 ? '+' : ''}{raad.kcal} kcal
            </button>
          )}

          {/* Waar hij staat is iets anders dan hoe hard hij gaat. Loopt iemand
              in week 1 een kilo uit, dan ligt zijn trend daarna wekenlang boven
              de band terwijl het tempo allang weer klopt. Het oordeel gaat over
              het tempo; deze regel vertelt de stand erbij. */}
          {laatste.vanPlan != null && Math.abs(laatste.vanPlan) >= 0.3 && (
            <div style={{
              fontSize: '0.7rem', fontWeight: 800, marginTop: 3,
              color: STATUS_KLEUR[laatste.stand] || 'rgba(255,255,255,0.4)',
            }}>
              Staat {Math.abs(laatste.vanPlan)} kg {laatste.vanPlan > 0 ? 'boven' : 'onder'} de plan-lijn
              {laatste.verschil != null ? ` · deze week ${laatste.verschil > 0 ? '+' : ''}${laatste.verschil} kg` : ''}
            </div>
          )}

        </div>
      )}

    </div>
  )
}
