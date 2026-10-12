// src/modules/coach-command-center/components/insight/FasePaneel.jsx
//
// De fase van een traject: waar begon het, wat is de afspraak, en ligt de
// klant op schema?
//
// Dit is de plek waar de gewichtsgrafiek en de doelen/macro's aan elkaar
// hangen. Start je een nieuwe fase, dan wordt dat het nieuwe nulpunt voor de
// planlijn én worden clients.primary_goal en weekly_weight_goal meegezet —
// dezelfde velden waar de macro-berekening en de kleur van de gewichtstrend
// op leunen. Zonder die synchronisatie zou je twee waarheden hebben.

import { useEffect, useState } from 'react'
import { Flag, Plus, Check, X } from 'lucide-react'
import { DOELEN, beoordeelFase, STATUS_KLEUR } from '../../../weight-tracker/utils/fase'
import { maakConfig, kcalPerWeektempo } from '../../../weight-tracker/utils/coachingBand'
import HorizontaleSlider from '../../../../client/components/HorizontaleSlider'

const vandaag = () => new Date().toISOString().split('T')[0]
const datumNL = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

// `toonOordeel` staat uit zodra de coaching-band eronder hangt: die zegt
// hetzelfde, met de cijfers erbij. Twee meldingen over dezelfde week maken de
// kolom drukker zonder dat er iets bij komt.
// `toonKop` uit: de fase-regel is verhuisd naar de balk boven de grafiek, waar
// hij een dropdown is. Dit paneel toont dan alleen nog het formulier, en dat
// opent van buitenaf via `openNieuw` (een teller die omhoog gaat).
export default function FasePaneel({
  client, db, history, isMobile, onFaseChange, onActieveFase, onFases,
  toonOordeel = true, toonKop = true, openNieuw = 0,
  // Gaat omhoog als iets buiten dit paneel de fase heeft gewijzigd (zoals
  // DoelModal). Zonder dit blijft de cijferbalk het oude bereik tonen tot je
  // de klant opnieuw opent.
  herlaad = 0,
}) {
  const [fases, setFases] = useState([])
  const [laden, setLaden] = useState(true)
  const [nieuw, setNieuw] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState(null)

  const laad = async () => {
    if (!client?.id || !db?.supabase) return
    const { data, error } = await db.supabase
      .from('client_phases')
      .select('*')
      .eq('client_id', client.id)
      .order('started_on', { ascending: false })
    if (error) { console.warn('fases laden mislukt:', error.message); setLaden(false); return }
    setFases(data || [])
    // De statistiekbalk rekent "sinds start" vanaf deze fase, dus die moet
    // 'm kennen. Eén plek die laadt, één plek die doorgeeft.
    onActieveFase?.((data || [])[0] || null)
    // De coaching-band tekent ook de fases die al voorbij zijn, dus die heeft
    // de hele lijst nodig. Eén plek die laadt, één plek die doorgeeft.
    onFases?.(data || [])
    setLaden(false)
  }
  useEffect(() => { laad() }, [client?.id, db, herlaad])

  // Van buitenaf een nieuwe fase beginnen (knop in de dropdown hierboven).
  useEffect(() => {
    if (openNieuw > 0) startNieuw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openNieuw])

  // Wat de band wordt met wat er nu in het formulier staat. Zonder dit vul je
  // een tempo in en zie je pas na opslaan wat er als 'te snel' gaat gelden.
  const grenzenTekst = (() => {
    if (!nieuw) return ''
    const c = maakConfig(client, {
      doel: nieuw.doel,
      week_doel_kg: nieuw.week_doel_kg,
      start_gewicht: nieuw.start_gewicht,
      tempo_min_kg: nieuw.tempo_min_kg,
      tempo_max_kg: nieuw.tempo_max_kg,
    })
    if (c.richting === 'stabiel' || !Number.isFinite(c.traagKg)) return ''
    const teken = c.richting === 'aankomen' ? '+' : '−'
    return `Band: ${teken}${c.traagKg.toFixed(2)} tot ${teken}${c.snelKg.toFixed(2)} kg per week`
      + (nieuw.tempoAangeraakt ? ' (zelf ingesteld)' : '')
  })()

  const huidige = fases[0] || null
  const oordeel = huidige ? beoordeelFase(huidige, history) : null

  // Laatste meting als startpunt: dat is waar de klant nú staat, en dat is
  // het punt waarvandaan de nieuwe fase moet rekenen.
  const laatsteGewicht = (() => {
    const g = (history || [])
      .map(e => ({ d: e.date, w: parseFloat(e.weight) }))
      .filter(e => Number.isFinite(e.w))
      .sort((a, b) => new Date(b.d) - new Date(a.d))[0]
    return g ? g.w : (client?.current_weight ? parseFloat(client.current_weight) : '')
  })()

  // Midden van de gewichtssliders, vastgezet bij het openen: zou het
  // meeschuiven met de gekozen waarde, dan verschuift de lijst onder je vinger.
  const basisKg = nieuw?.basisKg || 80

  // Minstens/hoogstens: het weektempo min en plus 0,2 kg (Kersten, 5 okt
  // 2026). Staat ingevuld zodra er een tempo is, zodat je ziet waar je op
  // stuurt en het meteen kunt bijstellen. Zodra de coach er zelf aan zit
  // (tempoAangeraakt), schuift het niet meer mee met het tempo.
  const autoBand = (n) => {
    const t = Math.abs(Number(n.week_doel_kg))
    if (!Number.isFinite(t) || t === 0 || n.doel === 'recomp' || n.doel === 'maintain') {
      return { tempo_min_kg: '', tempo_max_kg: '' }
    }
    return { tempo_min_kg: Math.max(t - 0.2, 0.05).toFixed(2), tempo_max_kg: (t + 0.2).toFixed(2) }
  }
  const metBand = (n) => (n.tempoAangeraakt ? n : { ...n, ...autoBand(n) })

  const startNieuw = () => {
    setFout(null)
    setNieuw(metBand({
      doel: huidige?.doel === 'cut' ? 'build' : 'cut',
      started_on: vandaag(),
      start_gewicht: laatsteGewicht || '',
      basisKg: Math.round((Number(laatsteGewicht) || 80) * 10) / 10,
      week_doel_kg: huidige?.doel === 'cut' ? '0.25' : '-0.5',
      doel_gewicht: '',
      tempo_min_kg: '',
      tempo_max_kg: '',
      // Het tekort of surplus dat bij dit weektempo hoort. Voorstel, geen wet:
      // de coach ziet het staan en past het aan voordat hij opslaat.
      surplus: String(kcalPerWeektempo(huidige?.doel === 'cut' ? 0.25 : -0.5)),
    }))
  }

  const bewaar = async () => {
    setBezig(true); setFout(null)
    try {
      // Vorige fase afsluiten op de dag ervoor: twee open fases zou de
      // planlijn dubbel tekenen.
      if (huidige && !huidige.ended_on) {
        const eind = new Date(nieuw.started_on)
        eind.setDate(eind.getDate() - 1)
        await db.supabase.from('client_phases')
          .update({ ended_on: eind.toISOString().split('T')[0] })
          .eq('id', huidige.id)
      }

      const rij = {
        client_id: client.id,
        started_on: nieuw.started_on,
        doel: nieuw.doel,
        start_gewicht: nieuw.start_gewicht ? Number(nieuw.start_gewicht) : null,
        week_doel_kg: nieuw.week_doel_kg ? Number(nieuw.week_doel_kg) : null,
        doel_gewicht: nieuw.doel_gewicht ? Number(nieuw.doel_gewicht) : null,
        // Leeg = de app rekent de band zelf uit. Altijd positief opslaan; de
        // richting komt uit `doel`.
        tempo_min_kg: nieuw.tempo_min_kg ? Math.abs(Number(nieuw.tempo_min_kg)) : null,
        tempo_max_kg: nieuw.tempo_max_kg ? Math.abs(Number(nieuw.tempo_max_kg)) : null,
      }
      const { error } = await db.supabase.from('client_phases').insert(rij)
      if (error) throw error

      // Doelen en macro's mee. primary_goal stuurt de macro-berekening en de
      // kleur van de gewichtstrend; zonder dit zou de klant in de app nog het
      // oude doel zien terwijl de fase iets anders zegt.
      const klantUpdate = {
        primary_goal: nieuw.doel === 'build' ? 'muscle_gain'
          : nieuw.doel === 'cut' ? 'fat_loss'
          : nieuw.doel === 'recomp' ? 'recomp' : 'maintenance',
        weekly_weight_goal: rij.week_doel_kg,
        // Het tekort voedt de macro-berekening. Leeg laten zou de oude waarde
        // van een vorige fase laten staan, en dan rekent het macro-paneel nog
        // met de cut terwijl de build begonnen is.
        ...(nieuw.surplus !== '' && Number.isFinite(Number(nieuw.surplus))
          ? { surplus: Math.round(Number(nieuw.surplus)) } : {}),
        start_weight: rij.start_gewicht,
        ...(rij.doel_gewicht ? { target_weight: rij.doel_gewicht, goal_weight: rij.doel_gewicht } : {}),
      }
      const { error: kFout } = await db.supabase.from('clients').update(klantUpdate).eq('id', client.id)
      if (kFout) throw kFout

      setNieuw(null)
      await laad()
      onFaseChange?.(klantUpdate)
    } catch (e) {
      console.error('fase opslaan mislukt:', e)
      setFout(e.message || 'Opslaan mislukt')
    } finally { setBezig(false) }
  }

  if (laden) return null
  // Zonder kop en zonder open formulier valt er niets te tekenen; dan ook geen
  // lege strook met een randje.
  if (!toonKop && !nieuw) return null

  const p = isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem'

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: p }}>
      {toonKop && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: huidige || nieuw ? '0.6rem' : 0 }}>
        <Flag size={14} color="#fff" />
        {huidige && !nieuw ? (
          <>
            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
              {DOELEN[huidige.doel]?.label || huidige.doel}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>
              sinds {datumNL(huidige.started_on)}
              {huidige.week_doel_kg != null && Number(huidige.week_doel_kg) !== 0
                ? ` · ${Number(huidige.week_doel_kg) > 0 ? '+' : ''}${Number(huidige.week_doel_kg)} kg/wk`
                : ''}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Fase</span>
        )}

        <span style={{ flex: 1 }} />

        {!nieuw && (
          <button onClick={startNieuw} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: '0.72rem', fontWeight: 900,
            padding: '0.35rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit',
            touchAction: 'manipulation', minHeight: 32,
          }}><Plus size={12} /> Nieuwe fase</button>
        )}
      </div>
      )}

      {/* Oordeel: ligt de klant op schema? */}
      {toonOordeel && huidige && !nieuw && oordeel && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.8rem', fontWeight: 900,
            color: STATUS_KLEUR[oordeel.status] || '#fff',
          }}>
            {oordeel.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, lineHeight: 1.5 }}>
            {oordeel.uitleg}
          </span>
        </div>
      )}

      {/* Nieuwe fase instellen */}
      {nieuw && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Doel en startdatum: twee dropdowns op één regel. */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Kies label="Doel" waarde={nieuw.doel} isMobile={isMobile}
              opties={Object.entries(DOELEN).map(([k, v]) => [k, v.label])}
              zet={k => setNieuw(n => {
                const week = k === 'build' ? 0.25 : k === 'cut' ? -0.5 : 0
                return metBand({
                  ...n, doel: k, week_doel_kg: String(week),
                  surplus: n.surplusAangeraakt ? n.surplus : String(kcalPerWeektempo(week)),
                })
              })} />
            <label style={{ flex: 1, minWidth: isMobile ? 130 : 160, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={kopjeStijl}>Startdatum</span>
              <input type="date" value={nieuw.started_on}
                onChange={e => setNieuw(n => ({ ...n, started_on: e.target.value }))}
                style={{ ...kiesStijl, colorScheme: 'dark' }} />
            </label>
          </div>

          {/* De getallen als sliders, zoals de gewichtsslider bij de klant.
              Twee kolommen op desktop, onder elkaar op mobiel. */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', columnGap: 16, rowGap: 4 }}>
            <SliderVeld label="Startgewicht" eenheid="kg"
              waarden={reeks(basisKg - 15, basisKg + 15, 0.1)}
              waarde={Number(nieuw.start_gewicht) || basisKg}
              toon={v => komma(v, 1)}
              zet={v => setNieuw(n => metBand({ ...n, start_gewicht: String(v) }))} />
            {/* Tempo en tekort horen bij elkaar: verander je het tempo, dan
                schuift het voorgestelde tekort mee. Heb je het tekort zelf al
                aangeraakt, dan blijft het staan. */}
            <SliderVeld label="Per week" eenheid="kg"
              waarden={reeks(-1.5, 1, 0.05)}
              waarde={Number(nieuw.week_doel_kg) || 0}
              toon={v => `${v > 0 ? '+' : ''}${komma(v, 2)}`}
              zet={v => setNieuw(n => metBand({
                ...n, week_doel_kg: String(v),
                surplus: n.surplusAangeraakt ? n.surplus : String(kcalPerWeektempo(v)),
              }))} />
            <SliderVeld label="Tekort/surplus" eenheid="kcal/dag"
              waarden={reeks(-1500, 1000, 25)}
              waarde={Number(nieuw.surplus) || 0}
              toon={v => `${v > 0 ? '+' : ''}${v}`}
              itemBreedte={64}
              zet={v => setNieuw(n => ({ ...n, surplus: String(v), surplusAangeraakt: true }))} />
            <SliderVeld label="Doelgewicht" eenheid="kg · optioneel"
              waarden={['', ...reeks(basisKg - 40, basisKg + 30, 0.5)]}
              waarde={nieuw.doel_gewicht === '' ? '' : Number(nieuw.doel_gewicht)}
              toon={v => (v === '' ? '—' : komma(v, 1))}
              zet={v => setNieuw(n => ({ ...n, doel_gewicht: v === '' ? '' : String(v) }))} />

            {/* Hoeveel afwijking van dat tempo je goedvindt. Standaard het
                tempo min en plus 0,2 kg; schuif je zelf, dan blijft het staan. */}
            {nieuw.doel !== 'recomp' && nieuw.doel !== 'maintain' && (
              <>
                <SliderVeld label="Tempo minstens" eenheid="kg/wk"
                  waarden={reeks(0.05, 2, 0.05)}
                  waarde={Number(nieuw.tempo_min_kg) || 0.05}
                  toon={v => komma(v, 2)}
                  zet={v => setNieuw(n => ({ ...n, tempo_min_kg: String(v), tempoAangeraakt: true }))} />
                <SliderVeld label="Tempo hoogstens" eenheid="kg/wk"
                  waarden={reeks(0.05, 2, 0.05)}
                  waarde={Number(nieuw.tempo_max_kg) || 0.05}
                  toon={v => komma(v, 2)}
                  zet={v => setNieuw(n => ({ ...n, tempo_max_kg: String(v), tempoAangeraakt: true }))} />
              </>
            )}
          </div>
          {grenzenTekst && (
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.35)' }}>{grenzenTekst}</div>
          )}

          {fout && <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>{fout}</div>}

          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setNieuw(null)} style={{
              flex: 2, padding: '0.6rem', minHeight: 42, background: 'none',
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
            }}><X size={13} style={{ verticalAlign: -2 }} /> Annuleren</button>
            <button onClick={bewaar} disabled={bezig || !nieuw.start_gewicht} style={{
              flex: 8, padding: '0.6rem', minHeight: 42,
              background: (bezig || !nieuw.start_gewicht) ? 'rgba(255,255,255,0.06)' : '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              color: (bezig || !nieuw.start_gewicht) ? 'rgba(255,255,255,0.3)' : '#0a0a0a',
              fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
              cursor: (bezig || !nieuw.start_gewicht) ? 'default' : 'pointer',
            }}><Check size={13} style={{ verticalAlign: -2 }} /> {bezig ? 'Opslaan…' : 'Fase starten'}</button>
          </div>

          <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
            De vorige fase wordt afgesloten. Doel en weektempo gaan mee naar de macro-berekening en de gewichtstrend.
          </div>
        </div>
      )}

      {/* Afgesloten fases: wat heeft de vorige opgeleverd? */}
      {!nieuw && fases.length > 1 && (
        <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fases.slice(1).map(f => (
            <div key={f.id} style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ fontWeight: 800 }}>{DOELEN[f.doel]?.label || f.doel}</span>
              <span>{datumNL(f.started_on)}{f.ended_on ? ` – ${datumNL(f.ended_on)}` : ''}</span>
              {f.start_gewicht != null && <span style={{ marginLeft: 'auto' }}>vanaf {f.start_gewicht} kg</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Reeks van `van` tot en met `tot` in stappen, zonder zwevende-kommaruis.
const reeks = (van, tot, stap) => {
  const uit = []
  const n = Math.round((tot - van) / stap)
  for (let i = 0; i <= n; i++) uit.push(Math.round((van + i * stap) * 100) / 100)
  return uit
}
const komma = (v, d) => Number(v).toFixed(d).replace('.', ',')

const kopjeStijl = { fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }
const kiesStijl = {
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: '0.85rem', fontWeight: 900, fontFamily: 'inherit',
  padding: '0.45rem 0.6rem', outline: 'none', minHeight: 40, width: '100%', boxSizing: 'border-box', cursor: 'pointer',
}

function Kies({ label, waarde, opties, zet, isMobile }) {
  return (
    <label style={{ flex: 1, minWidth: isMobile ? 130 : 160, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={kopjeStijl}>{label}</span>
      <select value={waarde} onChange={e => zet(e.target.value)} style={kiesStijl}>
        {opties.map(([k, l]) => <option key={k} value={k} style={{ background: '#111' }}>{l}</option>)}
      </select>
    </label>
  )
}

function SliderVeld({ label, eenheid, waarden, waarde, toon, zet, itemBreedte = 58 }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={kopjeStijl}>{label}</span>
        <span style={{ ...kopjeStijl, textTransform: 'none', letterSpacing: 0 }}>{eenheid}</span>
      </div>
      <HorizontaleSlider waarden={waarden} waarde={waarde} onChange={zet} toon={toon}
        itemBreedte={itemBreedte} hoogte={52} groot="1.35rem" />
    </div>
  )
}
