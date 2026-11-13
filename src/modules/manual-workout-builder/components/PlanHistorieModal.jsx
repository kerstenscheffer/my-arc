// src/modules/manual-workout-builder/components/PlanHistorieModal.jsx
//
// Plangeschiedenis van één klant (13 nov 2026, Kersten): elke wijziging in het
// workoutplan staat in workout_plan_historie (zie plan-historie.sql), als het
// hele plan zoals het daarna was. Hier: de lijst met standen, "wat was het
// plan op deze datum", wat er veranderde ten opzichte van de stand ervoor, en
// een oude stand terug in de builder zetten (pas definitief na Opslaan).

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from '../../../client/paginaPortal'
import { X, CalendarDays, RotateCcw, Zap } from 'lucide-react'

const WIE = { coach: 'Coach', klant: 'Klant zelf', systeem: 'Automatisch' }
const WAT = { start: 'Begin van de geschiedenis', toegewezen: 'Plan toegewezen', gewijzigd: 'Plan gewijzigd' }

const datumTijd = (iso) => new Date(iso).toLocaleString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dagen = (ws) => Object.entries(ws || {})
  .filter(([k, d]) => /^dag\d+$/.test(k) && d && typeof d === 'object')
  .sort((a, b) => parseInt(a[0].slice(3), 10) - parseInt(b[0].slice(3), 10))
const regel = (ex) => (ex?.type === 'cardio'
  ? [ex.duration, ex.intensity].filter(Boolean).join(' · ')
  : `${ex?.sets ?? '?'} × ${ex?.reps ?? '?'}${ex?.rust || ex?.rest ? ` · ${ex.rust || ex.rest}` : ''}`)

// Wat er veranderde tussen twee standen, in gewone taal.
function verschil(oud, nieuw) {
  const uit = []
  const o = new Map(dagen(oud)), n = new Map(dagen(nieuw))
  for (const [k, d] of n) {
    const naam = d.name || k
    const vorig = o.get(k)
    if (!vorig) { uit.push(`Nieuwe dag: ${naam}`); continue }
    if ((vorig.name || '') !== (d.name || '')) uit.push(`Dag hernoemd: ${vorig.name || k} → ${naam}`)
    const oudOef = new Map((vorig.exercises || []).map(e => [e.name, e]))
    const nieuwOef = new Map((d.exercises || []).map(e => [e.name, e]))
    for (const [on, e] of nieuwOef) {
      const was = oudOef.get(on)
      if (!was) { uit.push(`${naam}: ${on} erbij`); continue }
      const delen = []
      if (String(was.sets) !== String(e.sets)) delen.push(`sets ${was.sets} → ${e.sets}`)
      if (String(was.reps) !== String(e.reps)) delen.push(`reps ${was.reps} → ${e.reps}`)
      if (String(was.rust || was.rest || '') !== String(e.rust || e.rest || '')) delen.push(`rust ${was.rust || was.rest || '-'} → ${e.rust || e.rest || '-'}`)
      if (!!was.power !== !!e.power) delen.push(e.power ? 'nu power' : 'geen power meer')
      if (delen.length) uit.push(`${naam}: ${on}, ${delen.join(', ')}`)
    }
    for (const on of oudOef.keys()) if (!nieuwOef.has(on)) uit.push(`${naam}: ${on} eruit`)
    const volgordeOud = (vorig.exercises || []).map(e => e.name).filter(x => nieuwOef.has(x)).join('|')
    const volgordeNieuw = (d.exercises || []).map(e => e.name).filter(x => oudOef.has(x)).join('|')
    if (volgordeOud !== volgordeNieuw) uit.push(`${naam}: volgorde aangepast`)
  }
  for (const [k, d] of o) if (!n.has(k)) uit.push(`Dag weg: ${d.name || k}`)
  return uit
}

export default function PlanHistorieModal({ db, client, isMobile, onClose, onHerstel }) {
  const [lijst, setLijst] = useState(null) // null = laden
  const [fout, setFout] = useState(null)
  const [gekozenId, setGekozenId] = useState(null)
  const [standen, setStanden] = useState({}) // id → { week_structure, cyclus }
  const [datum, setDatum] = useState('')

  useEffect(() => {
    let weg = false
    db.supabase.from('workout_plan_historie')
      .select('id, schema_id, naam, gebeurtenis, door_rol, created_at, bijgewerkt_at')
      .eq('client_id', client.id).order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (weg) return
        if (error) { setFout(error.message); setLijst([]); return }
        setLijst(data || [])
        if (data?.length) setGekozenId(data[0].id)
      }, (e) => { if (!weg) { setFout(e?.message || 'Laden mislukt'); setLijst([]) } })
    return () => { weg = true }
  }, [db, client.id])

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const gekozen = lijst?.find(r => r.id === gekozenId) || null
  // De stand ervoor: de eerstvolgende oudere rij.
  const vorige = useMemo(() => {
    if (!lijst || !gekozen) return null
    return lijst[lijst.findIndex(r => r.id === gekozen.id) + 1] || null
  }, [lijst, gekozen])

  // Inhoud pas ophalen als je een stand opent: de lijst zelf blijft licht.
  useEffect(() => {
    const nodig = [gekozen?.id, vorige?.id].filter(id => id && !standen[id])
    if (!nodig.length) return undefined
    let weg = false
    db.supabase.from('workout_plan_historie').select('id, week_structure, cyclus').in('id', nodig)
      .then(({ data }) => {
        if (weg || !data) return
        setStanden(prev => ({ ...prev, ...Object.fromEntries(data.map(r => [r.id, r])) }))
      }, () => {})
    return () => { weg = true }
  }, [gekozen?.id, vorige?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Datum gekozen: de laatste stand die op het eind van die dag gold.
  const kiesDatum = (waarde) => {
    setDatum(waarde)
    if (!waarde || !lijst) return
    const grens = new Date(`${waarde}T23:59:59`).getTime()
    const rij = lijst.find(r => new Date(r.created_at).getTime() <= grens)
    setGekozenId(rij ? rij.id : null)
  }

  const stand = gekozen ? standen[gekozen.id] : null
  const standVorige = vorige ? standen[vorige.id] : null
  const wijzigingen = stand && standVorige && gekozen.schema_id === vorige.schema_id
    ? verschil(standVorige.week_structure, stand.week_structure) : null
  const oudste = lijst?.length ? lijst[lijst.length - 1] : null
  const isHuidig = lijst?.[0]?.id === gekozenId

  const kop = { fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', maxWidth: 980, height: isMobile ? '100%' : 'min(86vh, 760px)', background: '#0a0a0a',
        border: isMobile ? 'none' : '1px solid rgba(255,255,255,0.12)', borderRadius: isMobile ? 0 : 16,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#fff',
      }}>
        {/* Kop: titel, datumkiezer, sluiten */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isMobile ? '0.85rem 0.9rem' : '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ fontSize: isMobile ? '1.05rem' : '1.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Plangeschiedenis</div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
              {[client.first_name, client.last_name].filter(Boolean).join(' ') || 'Klant'}
              {oudste ? ` · bijgehouden sinds ${new Date(oudste.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 800 }}>
            <CalendarDays size={16} /> Plan op datum
            <input type="date" value={datum} max={new Date().toISOString().slice(0, 10)} onChange={(e) => kiesDatum(e.target.value)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 8, color: '#fff',
              padding: '0.4rem 0.55rem', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 700, colorScheme: 'dark',
            }} />
          </label>
          <button onClick={onClose} aria-label="Sluiten" style={{ width: 36, height: 36, background: 'transparent', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={20} strokeWidth={2.4} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
          {/* Lijst met standen */}
          <div style={{ width: isMobile ? '100%' : 290, flexShrink: 0, maxHeight: isMobile ? 190 : 'none', overflowY: 'auto', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.08)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
            {lijst === null && <div style={{ padding: '1.25rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Laden…</div>}
            {fout && <div style={{ padding: '1.25rem', fontSize: '0.82rem', color: '#f87171' }}>Kon de geschiedenis niet laden: {fout}</div>}
            {lijst?.length === 0 && !fout && <div style={{ padding: '1.25rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Nog geen geschiedenis voor deze klant. De eerste stand komt erbij zodra het plan wordt toegewezen of gewijzigd.</div>}
            {lijst?.map((r, i) => {
              const aan = r.id === gekozenId
              return (
                <button key={r.id} onClick={() => { setGekozenId(r.id); setDatum('') }} style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.7rem 1rem', cursor: 'pointer', fontFamily: 'inherit',
                  background: aan ? '#fff' : 'transparent', color: aan ? '#000' : '#fff', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 900 }}>{datumTijd(r.created_at)}{i === 0 ? ' · nu' : ''}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, opacity: 0.65, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {WAT[r.gebeurtenis] || r.gebeurtenis} · {WIE[r.door_rol] || r.door_rol}{r.naam ? ` · ${r.naam}` : ''}
                  </div>
                </button>
              )
            })}
          </div>

          {/* De gekozen stand */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: isMobile ? '0.9rem' : '1.1rem 1.25rem' }}>
            {lijst && !gekozen && datum && (
              <div style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                Op die datum werd het plan nog niet bijgehouden.{oudste ? ` De geschiedenis begint op ${new Date(oudste.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.` : ''}
              </div>
            )}
            {gekozen && (
              <>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: '0.9rem' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{gekozen.naam || 'Plan zonder naam'}</div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                      Gold vanaf {datumTijd(gekozen.created_at)}{isHuidig ? ' en is het huidige plan' : ''}
                    </div>
                  </div>
                  {onHerstel && stand && !isHuidig && (
                    <button onClick={() => onHerstel({ ...gekozen, ...stand })} style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '0.55rem 0.9rem', background: '#fff', color: '#000',
                      border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 900, cursor: 'pointer',
                    }}>
                      <RotateCcw size={15} strokeWidth={2.8} /> Zet in de builder
                    </button>
                  )}
                </div>

                {wijzigingen && (
                  <div style={{ marginBottom: '1.1rem' }}>
                    <div style={kop}>Gewijzigd ten opzichte van de stand ervoor</div>
                    {wijzigingen.length === 0
                      ? <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginTop: 5 }}>Alleen de planning of naam, geen oefeningen.</div>
                      : wijzigingen.slice(0, 40).map((w, i) => (
                        <div key={i} style={{ display: 'flex', gap: 7, fontSize: '0.84rem', fontWeight: 600, lineHeight: 1.45, marginTop: 4 }}>
                          <span aria-hidden style={{ color: '#10b981', fontWeight: 900 }}>→</span><span>{w}</span>
                        </div>
                      ))}
                  </div>
                )}

                {!stand && <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>Plan laden…</div>}
                {stand && dagen(stand.week_structure).map(([k, d]) => (
                  <div key={k} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900 }}>{d.name || k}</span>
                      <span style={kop}>{k.replace('dag', 'Dag ')} · {(d.exercises || []).length} oef</span>
                    </div>
                    {(d.exercises || []).map((ex, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '0.32rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.84rem' }}>
                        <span style={{ flex: 1, minWidth: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ex.power && <Zap size={12} strokeWidth={2.8} style={{ marginRight: 5, verticalAlign: '-1px' }} />}{ex.name}
                        </span>
                        <span style={{ flexShrink: 0, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums' }}>{regel(ex)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
