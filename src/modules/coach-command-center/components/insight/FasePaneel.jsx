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

const vandaag = () => new Date().toISOString().split('T')[0]
const datumNL = (d) => new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })

export default function FasePaneel({ client, db, history, isMobile, onFaseChange, onActieveFase }) {
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
    setLaden(false)
  }
  useEffect(() => { laad() }, [client?.id, db])

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

  const startNieuw = () => {
    setFout(null)
    setNieuw({
      doel: huidige?.doel === 'cut' ? 'build' : 'cut',
      started_on: vandaag(),
      start_gewicht: laatsteGewicht || '',
      week_doel_kg: huidige?.doel === 'cut' ? '0.25' : '-0.5',
      doel_gewicht: '',
    })
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

  const p = isMobile ? '0.7rem 0.75rem' : '0.8rem 1rem'

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: p }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: huidige || nieuw ? '0.6rem' : 0 }}>
        <Flag size={14} color="#fff" />
        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Fase</span>

        {huidige && !nieuw && (
          <>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
              {DOELEN[huidige.doel]?.label || huidige.doel}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
              sinds {datumNL(huidige.started_on)}
            </span>
          </>
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

      {/* Oordeel: ligt de klant op schema? */}
      {huidige && !nieuw && oordeel && (
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
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {Object.entries(DOELEN).map(([k, v]) => (
              <button key={k}
                onClick={() => setNieuw(n => ({
                  ...n, doel: k,
                  week_doel_kg: k === 'build' ? '0.25' : k === 'cut' ? '-0.5' : '0',
                }))}
                style={{
                  flex: 1, minWidth: 70, padding: '0.5rem 0.4rem', minHeight: 40,
                  background: nieuw.doel === k ? '#fff' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${nieuw.doel === k ? '#fff' : 'rgba(255,255,255,0.12)'}`,
                  color: nieuw.doel === k ? '#0a0a0a' : 'rgba(255,255,255,0.55)',
                  fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit',
                  cursor: 'pointer', touchAction: 'manipulation',
                }}>{v.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Veld label="Startdatum" type="date" waarde={nieuw.started_on}
              zet={v => setNieuw(n => ({ ...n, started_on: v }))} isMobile={isMobile} />
            <Veld label="Startgewicht" type="number" suffix="kg" waarde={nieuw.start_gewicht}
              zet={v => setNieuw(n => ({ ...n, start_gewicht: v }))} isMobile={isMobile} />
            <Veld label="Per week" type="number" suffix="kg" stap="0.05" waarde={nieuw.week_doel_kg}
              zet={v => setNieuw(n => ({ ...n, week_doel_kg: v }))} isMobile={isMobile} />
            <Veld label="Doelgewicht" type="number" suffix="kg" waarde={nieuw.doel_gewicht}
              zet={v => setNieuw(n => ({ ...n, doel_gewicht: v }))} isMobile={isMobile} optioneel />
          </div>

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

function Veld({ label, type, waarde, zet, suffix, stap, isMobile, optioneel }) {
  return (
    <label style={{ flex: 1, minWidth: isMobile ? 100 : 120, display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}{optioneel ? '' : ''}
      </span>
      <input
        type={type} step={stap} value={waarde}
        onChange={e => zet(e.target.value)}
        placeholder={suffix}
        style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: '0.82rem', fontWeight: 800, fontFamily: 'inherit',
          padding: '0.45rem 0.5rem', outline: 'none', minHeight: 38, width: '100%', boxSizing: 'border-box',
        }}
      />
    </label>
  )
}
