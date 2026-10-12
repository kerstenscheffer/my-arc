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
import { createPortal } from 'react-dom'
import { Flag, Plus, Check, X, ChevronLeft } from 'lucide-react'
import { DOELEN, beoordeelFase, STATUS_KLEUR } from '../../../weight-tracker/utils/fase'
import { maakConfig, kcalPerWeektempo } from '../../../weight-tracker/utils/coachingBand'
import HorizontaleSlider from '../../../../client/components/HorizontaleSlider'
import { intakeLichaamFotos } from '../../utils/intakeLichaam'

const vandaag = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
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
  // Het formulier is een klik-door pop-up: één vraag per stap.
  const [stap, setStap] = useState(1)
  const [toonBand, setToonBand] = useState(false)

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
    setFout(null); setStap(1); setToonBand(false)
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

  const sluit = () => setNieuw(null)
  const faseModal = () => {
    const metTempo = nieuw.doel !== 'recomp' && nieuw.doel !== 'maintain'
    const STAPPEN = ['doel', 'datum', 'gewicht', ...(metTempo ? ['tempo'] : []), 'kcal', 'doelgewicht']
    const huidig = STAPPEN[stap - 1]
    const laatste = stap === STAPPEN.length
    const dagOffset = Math.round((new Date(`${nieuw.started_on}T00:00:00`) - new Date(`${vandaag()}T00:00:00`)) / 86400000)
    const vraag = (t) => <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 16, letterSpacing: '-0.015em' }}>{t}</div>
    const onder = (t) => <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '2px 0 18px', lineHeight: 1.4 }}>{t}</div>
    const groot = (props) => <HorizontaleSlider itemBreedte={80} groot="1.7rem" {...props} />
    return createPortal(
      <div onClick={sluit} style={{
        position: 'fixed', inset: 0, zIndex: 2147483100,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: 420, maxHeight: '92dvh', overflowY: 'auto',
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '1.1rem 1rem 1.2rem', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            {stap > 1
              ? <button onClick={() => setStap(n => n - 1)} aria-label="Vorige stap" style={kleinKnop}><ChevronLeft size={18} strokeWidth={2.8} /></button>
              : <div style={{ width: 40 }} />}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Nieuwe fase · stap {stap} van {STAPPEN.length}
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Flag size={15} strokeWidth={2.6} /> {DOELEN[nieuw.doel]?.label || 'Fase'}
              </div>
            </div>
            <button onClick={sluit} aria-label="Sluiten" style={kleinKnop}><X size={18} strokeWidth={2.8} /></button>
          </div>

          {/* Wat de klant in de intake aanklikte: zo ziet hij er nu uit (of
              ertussenin) en daar wil hij naartoe. Staat bij elke stap, zodat
              je tempo en tekort kiest met het doel voor ogen. */}
          {(() => {
            const { nu, doel } = intakeLichaamFotos(client)
            if (!nu.length && !doel.length) return null
            const groep = (titel, fotos) => fotos.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 0 }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{titel}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {fotos.map(f => (
                    <div key={f.img} style={{ textAlign: 'center' }}>
                      <img src={f.img} alt={f.label} style={{ width: 64, height: 84, objectFit: 'cover', borderRadius: 10, display: 'block', background: '#151515' }} />
                      <div style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fff', marginTop: 3, maxWidth: 64, lineHeight: 1.2 }}>{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 18 }}>
                {groep(nu.length > 1 ? 'Nu · tussenin' : 'Nu', nu)}
                {nu.length > 0 && doel.length > 0 && <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.35)' }}>→</span>}
                {groep('Wil naar', doel)}
              </div>
            )
          })()}

          {huidig === 'doel' && (
            <>
              {vraag('Wat is het doel?')}
              {Object.entries(DOELEN).map(([k, v]) => {
                const aan = nieuw.doel === k
                return (
                  <button key={k} onClick={() => setNieuw(n => {
                    const week = k === 'build' ? 0.25 : k === 'cut' ? -0.5 : 0
                    return metBand({
                      ...n, doel: k, week_doel_kg: String(week),
                      surplus: n.surplusAangeraakt ? n.surplus : String(kcalPerWeektempo(week)),
                    })
                  })} style={{
                    width: '100%', minHeight: 52, marginBottom: 8, padding: '0 1rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: aan ? '#fff' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${aan ? '#fff' : 'rgba(255,255,255,0.1)'}`, borderRadius: 14,
                    color: aan ? '#0a0a0a' : '#fff', fontSize: '0.95rem', fontWeight: 900,
                    fontFamily: 'inherit', cursor: 'pointer', touchAction: 'manipulation',
                  }}>
                    {v.label}{aan && <Check size={18} strokeWidth={3} />}
                  </button>
                )
              })}
              <div style={{ height: 10 }} />
            </>
          )}

          {huidig === 'datum' && (
            <>
              {vraag('Wanneer start de fase?')}
              {groot({
                waarden: reeks(-90, 60, 1), waarde: dagOffset, itemBreedte: 96,
                toon: v => { const d = new Date(); d.setDate(d.getDate() + v); return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) },
                onChange: v => { const d = new Date(); d.setDate(d.getDate() + v); setNieuw(n => ({ ...n, started_on: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` })) },
              })}
              {onder(dagOffset === 0 ? 'Vandaag' : datumNL(nieuw.started_on))}
            </>
          )}

          {huidig === 'gewicht' && (
            <>
              {vraag('Startgewicht')}
              {groot({
                waarden: reeks(basisKg - 15, basisKg + 15, 0.1),
                waarde: Number(nieuw.start_gewicht) || basisKg, toon: v => komma(v, 1),
                onChange: v => setNieuw(n => metBand({ ...n, start_gewicht: String(v) })),
              })}
              {onder('kg · laatste meting staat al klaar')}
            </>
          )}

          {huidig === 'tempo' && (
            <>
              {vraag('Hoeveel per week?')}
              {groot({
                waarden: reeks(-1.5, 1, 0.05), waarde: Number(nieuw.week_doel_kg) || 0,
                toon: v => `${v > 0 ? '+' : ''}${komma(v, 2)}`,
                onChange: v => setNieuw(n => metBand({
                  ...n, week_doel_kg: String(v),
                  surplus: n.surplusAangeraakt ? n.surplus : String(kcalPerWeektempo(v)),
                })),
              })}
              {onder('kg per week')}
            </>
          )}

          {huidig === 'kcal' && (
            <>
              {vraag(Number(nieuw.surplus) < 0 ? 'Tekort per dag' : 'Surplus per dag')}
              {groot({
                waarden: reeks(-1500, 1000, 25), waarde: Number(nieuw.surplus) || 0,
                toon: v => `${v > 0 ? '+' : ''}${v}`, itemBreedte: 88,
                onChange: v => setNieuw(n => ({ ...n, surplus: String(v), surplusAangeraakt: true })),
              })}
              {onder('kcal per dag · voorstel bij dit tempo')}
            </>
          )}

          {huidig === 'doelgewicht' && (
            <>
              {vraag('Doelgewicht')}
              {groot({
                waarden: ['', ...reeks(basisKg - 40, basisKg + 30, 0.5)],
                waarde: nieuw.doel_gewicht === '' ? '' : Number(nieuw.doel_gewicht),
                toon: v => (v === '' ? '—' : komma(v, 1)),
                onChange: v => setNieuw(n => ({ ...n, doel_gewicht: v === '' ? '' : String(v) })),
              })}
              {onder('kg · mag leeg')}
              {metTempo && (
                <div style={{ textAlign: 'center', marginTop: -8, marginBottom: 14 }}>
                  <button onClick={() => setToonBand(v => !v)} style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)',
                  }}>
                    {grenzenTekst || 'Band'} · {toonBand ? 'sluiten' : 'aanpassen'}
                  </button>
                  {toonBand && (
                    <div style={{ marginTop: 8, textAlign: 'left' }}>
                      <SliderVeld label="Tempo minstens" eenheid="kg/wk"
                        waarden={reeks(0.05, 2, 0.05)} waarde={Number(nieuw.tempo_min_kg) || 0.05}
                        toon={v => komma(v, 2)}
                        zet={v => setNieuw(n => ({ ...n, tempo_min_kg: String(v), tempoAangeraakt: true }))} />
                      <SliderVeld label="Tempo hoogstens" eenheid="kg/wk"
                        waarden={reeks(0.05, 2, 0.05)} waarde={Number(nieuw.tempo_max_kg) || 0.05}
                        toon={v => komma(v, 2)}
                        zet={v => setNieuw(n => ({ ...n, tempo_max_kg: String(v), tempoAangeraakt: true }))} />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {fout && <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', marginBottom: 10, textAlign: 'center' }}>{fout}</div>}

          {laatste
            ? (
              <button onClick={bewaar} disabled={bezig || !nieuw.start_gewicht} style={{ ...primairKnop, opacity: (bezig || !nieuw.start_gewicht) ? 0.5 : 1 }}>
                <Check size={16} strokeWidth={3} /> {bezig ? 'Opslaan…' : 'Fase starten'}
              </button>
            )
            : <button onClick={() => setStap(n => n + 1)} style={primairKnop}>Volgende</button>}
          {laatste && (
            <div style={{ fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              De vorige fase wordt afgesloten.
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  }

  if (!toonKop) return faseModal()

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

      {nieuw && faseModal()}

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

const kleinKnop = {
  width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
  cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}
const primairKnop = {
  width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  background: '#fff', border: '1px solid #fff', borderRadius: 14, color: '#0a0a0a',
  fontSize: '0.95rem', fontWeight: 900, fontFamily: 'inherit', cursor: 'pointer',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const kopjeStijl = { fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }
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
