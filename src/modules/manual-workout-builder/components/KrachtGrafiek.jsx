// src/modules/manual-workout-builder/components/KrachtGrafiek.jsx
//
// Krachtverloop per spiergroep in de builder (10 nov 2026). Per oefening de
// beste set per week (geschatte 1RM: gewicht × (1 + reps/30), zodat 60×12 en
// 70×8 vergelijkbaar zijn), als % t.o.v. de eerste week in de gekozen periode.
// Per spiergroep het gemiddelde van zijn oefeningen. Eén as (procent), dus
// zware en lichte oefeningen tellen even zwaar.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { spierVan, spierLabel } from '../spierGroepen'

// Vaste kleur per spiergroep (kleur volgt de spier, niet de rang). Gecontroleerd
// op zwart: alle 8 >= 3:1, kleurenblind-afstand >= 8,4 in deze volgorde.
// Sinds de opsplitsing (10 nov 2026) zijn er meer dan 8 groepen: de 8 die het meest
// bekeken worden krijgen een kleur, billen/kuiten/front delts/buik zijn grijs.
const KLEUR = {
  chest: '#3987e5', back: '#d95926', quads: '#199e70', side_delts: '#c98500',
  biceps: '#d55181', hamstrings: '#008300', triceps: '#9085e9', rear_delts: '#e66767',
}
const OVERIG = 'rgba(255,255,255,0.45)'
const PERIODES = [[4, '4 wk'], [8, '8 wk'], [12, '12 wk'], [26, '6 mnd']]

const e1rm = (s) => (Number(s?.weight) || 0) * (1 + (Number(s?.reps) || 0) / 30)
const maandag = (iso) => {
  const d = new Date(`${String(iso).slice(0, 10)}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const weekLabel = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
const pct = (v) => `${v > 0 ? '+' : ''}${Math.round(v * 10) / 10}%`

export default function KrachtGrafiek({ db, client, plan, onClose }) {
  const [weken, setWeken] = useState(8)
  // Gewichtsfases van de klant (client_phases: cut, build…). Gekozen fase =
  // started_on t/m ended_on (of vandaag als hij nog loopt); anders de laatste `weken` weken.
  const [fases, setFases] = useState([])
  const [faseId, setFaseId] = useState(null)
  useEffect(() => {
    if (!client?.id || !db?.supabase) return undefined
    let weg = false
    db.supabase.from('client_phases').select('id, doel, started_on, ended_on')
      .eq('client_id', client.id).order('started_on', { ascending: true })
      .then(({ data }) => {
        if (weg) return
        setFases(data || [])
        // Loopt er een fase, dan opent de grafiek daarop.
        const actief = (data || []).filter(f => !f.ended_on).pop()
        if (actief) setFaseId(actief.id)
      }, () => {})
    return () => { weg = true }
  }, [client?.id, db])
  const fase = fases.find(f => f.id === faseId) || null
  const faseEind = (f) => (f.ended_on ? String(f.ended_on).slice(0, 10) : new Date().toISOString().slice(0, 10))
  const FASE_LABEL = { cut: 'Cut', build: 'Build', recomp: 'Recomp', maintenance: 'Onderhoud' }
  const faseNaam = (f) => `${FASE_LABEL[f.doel] || f.doel || 'Fase'} · ${weekLabel(String(f.started_on).slice(0, 10))} – ${f.ended_on ? weekLabel(faseEind(f)) : 'nu'}`
  const [logs, setLogs] = useState(null) // null = laden
  const [bibSpier, setBibSpier] = useState({})
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return undefined
    let weg = false
    setLogs(null)
    ;(async () => {
      const van = new Date(); van.setDate(van.getDate() - weken * 7)
      let q = db.supabase.from('workout_sessions').select('id, workout_date').eq('client_id', client.id)
      q = fase ? q.gte('workout_date', String(fase.started_on).slice(0, 10)).lte('workout_date', faseEind(fase)) : q.gte('workout_date', van.toISOString().slice(0, 10))
      const { data: sessies } = await q.then(r => r, () => ({ data: [] }))
      if (!sessies?.length) { if (!weg) setLogs([]); return }
      const datum = Object.fromEntries(sessies.map(s => [s.id, String(s.workout_date).slice(0, 10)]))
      const { data } = await db.supabase.from('workout_progress').select('session_id, exercise_name, sets')
        .in('session_id', sessies.map(s => s.id)).then(r => r, () => ({ data: [] }))
      const rijen = (data || []).map(l => {
        const best = (Array.isArray(l.sets) ? l.sets : []).reduce((b, x) => (e1rm(x) > e1rm(b) ? x : b), null)
        return { naam: l.exercise_name, datum: datum[l.session_id], kracht: e1rm(best), set: best }
      })
        .filter(r => r.naam && r.datum && r.kracht > 0)
      // Spiergroep voor álle gelogde oefeningen, ook die niet (meer) in het plan
      // staan: bibliotheek + eigen oefeningen (coach en klant), hoofdletter-ongevoelig.
      if (rijen.length) {
        const [{ data: bib }, { data: eigen }] = await Promise.all([
          db.supabase.from('exercises').select('name, primair_spieren').limit(2000).then(r => r, () => ({ data: [] })),
          db.supabase.from('custom_exercises').select('name, primair_spieren, muscle_group').or(`client_id.is.null,client_id.eq.${client.id}`).limit(2000).then(r => r, () => ({ data: [] })),
        ])
        const kaart = {}
        for (const b of bib || []) if (b.name && b.primair_spieren) kaart[b.name.trim().toLowerCase()] = b.primair_spieren
        for (const c of eigen || []) { const sp = c.primair_spieren || c.muscle_group; if (c.name && sp) kaart[c.name.trim().toLowerCase()] = sp }
        if (!weg) setBibSpier(kaart)
      }
      if (!weg) setLogs(rijen)
    })()
    return () => { weg = true }
  }, [client?.id, db, weken, fase?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const { punten, spieren, oefs, alleWeken } = useMemo(() => {
    if (!logs?.length) return { punten: [], spieren: [], oefs: [], alleWeken: [] }
    const spierUitPlan = {}
    for (const ex of plan.days.flatMap(d => d.exercises || [])) spierUitPlan[String(ex.name || '').trim().toLowerCase()] = spierVan(ex)
    const spierOf = (naam) => {
      const k = naam.trim().toLowerCase()
      return spierUitPlan[k] || (bibSpier[k] ? spierVan({ primairSpieren: bibSpier[k] }) : spierVan({ name: naam }))
    }
    // oefening → week → beste kracht
    const perOef = {}
    const setVan = {} // naam → week → beste set
    for (const r of logs) {
      const w = maandag(r.datum)
      const o = perOef[r.naam] || (perOef[r.naam] = {})
      if (r.kracht > (o[w] || 0)) { o[w] = r.kracht; (setVan[r.naam] = setVan[r.naam] || {})[w] = r.set }
    }
    const oefs = []
    // spier → week → [% per oefening]
    const perSpier = {}
    const aantal = {}
    for (const [naam, wk] of Object.entries(perOef)) {
      const ws = Object.keys(wk).sort()
      // Geen spiergroep te vinden: toch tonen, onder "Geen spiergroep".
      const spier = spierOf(naam)
      // Maar één week gelogd: wel in de lijst, niets te vergelijken.
      if (ws.length < 2) { oefs.push({ naam, spier, weken: {}, nu: null, van: setVan[naam][ws[0]], tot: null }); continue }
      aantal[spier] = (aantal[spier] || 0) + 1
      const basis = wk[ws[0]]
      oefs.push({
        naam, spier,
        weken: Object.fromEntries(ws.map(w => [w, (wk[w] / basis - 1) * 100])),
        nu: (wk[ws[ws.length - 1]] / basis - 1) * 100,
        van: setVan[naam][ws[0]], tot: setVan[naam][ws[ws.length - 1]],
      })
      for (const w of ws) ((perSpier[spier] = perSpier[spier] || {})[w] = perSpier[spier][w] || []).push((wk[w] / basis - 1) * 100)
    }
    const alleWeken = [...new Set(Object.values(perSpier).flatMap(o => Object.keys(o)))].sort()
    const punten = alleWeken.map(w => {
      const p = { week: w }
      for (const [s, o] of Object.entries(perSpier)) if (o[w]) p[s] = o[w].reduce((a, b) => a + b, 0) / o[w].length
      return p
    })
    const spieren = Object.keys(perSpier).map(s => {
      const laatste = [...punten].reverse().find(p => p[s] != null)
      return { k: s, nu: laatste?.[s] ?? 0, oef: aantal[s] }
    }).sort((a, b) => b.nu - a.nu)
    return { punten, spieren, oefs, alleWeken }
  }, [logs, plan, bibSpier])

  // Spiergroep aangeklikt: zijn oefeningen los. Sleutels o0, o1… omdat een
  // naam met een punt in recharts als pad gelezen wordt. Kleur op naamvolgorde,
  // zodat een oefening dezelfde kleur houdt als je van periode wisselt.
  const ORDE = Object.values(KLEUR)
  const detail = useMemo(() => {
    if (!focus) return null
    const lijst = oefs.filter(o => o.spier === focus && o.nu != null).sort((a, b) => a.naam.localeCompare(b.naam))
      .map((o, i) => ({ ...o, k: `o${i}`, kleur: ORDE[i] || OVERIG }))
    const enkel = oefs.filter(o => o.spier === focus && o.nu == null).map((o, i) => ({ ...o, k: `e${i}`, kleur: 'transparent' }))
    const pts = alleWeken.map(w => {
      const p = { week: w }
      for (const o of lijst) if (o.weken[w] != null) p[o.k] = o.weken[w]
      return p
    }).filter(p => Object.keys(p).length > 1)
    return { lijst: [...[...lijst].sort((a, b) => b.nu - a.nu), ...enkel], lijnen: lijst, punten: pts, naam: Object.fromEntries(lijst.map(o => [o.k, o.naam])) }
  }, [focus, oefs, alleWeken]) // eslint-disable-line react-hooks/exhaustive-deps
  const setTekst = (x) => (x ? `${Number(x.weight) || 0}×${Number(x.reps) || 0}` : '?')

  const kleur = (k) => KLEUR[k] || OVERIG
  const knop = (aan) => ({
    height: 28, padding: '0 0.65rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    background: aan ? '#fff' : 'transparent', color: aan ? '#000' : 'rgba(255,255,255,0.7)', fontSize: '0.76rem', fontWeight: 900,
  })

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2147483300, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 980, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Kracht per spiergroep</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>% t.o.v. de eerste week · beste set per oefening (geschatte 1RM) · {client?.first_name || ''}</div>
          </div>
          <div role="group" aria-label="Periode" style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)' }}>
            {PERIODES.map(([w, l]) => <button key={w} onClick={() => { setWeken(w); setFaseId(null) }} aria-pressed={!fase && weken === w} style={knop(!fase && weken === w)}>{l}</button>)}
          </div>
          {fases.length > 0 && (
            <select value={faseId || ''} onChange={(e) => setFaseId(e.target.value || null)} title="Periode van een gewichtsfase (cut, build)" style={{
              height: 36, padding: '0 0.6rem', borderRadius: 10, colorScheme: 'dark', fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 900, cursor: 'pointer',
              background: fase ? '#fff' : 'transparent', color: fase ? '#000' : '#fff', border: '1px solid rgba(255,255,255,0.14)',
            }}>
              <option value="">Fase kiezen…</option>
              {fases.map(f => <option key={f.id} value={f.id}>{faseNaam(f)}</option>)}
            </select>
          )}
          <button onClick={onClose} aria-label="Sluit" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        {logs === null ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>Laden…</div>
        ) : !punten.length ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>Te weinig gelogde trainingen in deze periode (per oefening minstens 2 weken nodig).</div>
        ) : (
          <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
            {/* Spiergroepen met de stand nu: tegelijk legenda en tabel. Klik = de oefeningen ervan. */}
            <div style={{ width: 250, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '0.5rem 0' }}>
              {detail ? (<>
                <button onClick={() => setFocus(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '0.4rem 0.9rem 0.6rem', border: 'none', background: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '0.74rem', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left' }}>
                  <ChevronLeft size={14} strokeWidth={2.6} /> Alle spiergroepen
                </button>
                <div style={{ padding: '0 0.9rem 0.5rem', fontSize: '0.95rem', fontWeight: 900, color: '#fff' }}>{spierLabel(focus)}</div>
                {detail.lijst.map(o => (
                  <div key={o.k} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0.5rem 0.9rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: o.kleur, flexShrink: 0 }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.naam}</span>
                      <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{o.nu == null ? `${setTekst(o.van)} · 1 week gelogd` : `${setTekst(o.van)} → ${setTekst(o.tot)}`}</span>
                    </span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 900, color: o.nu == null ? 'rgba(255,255,255,0.35)' : '#fff', fontVariantNumeric: 'tabular-nums' }}>{o.nu == null ? '—' : pct(o.nu)}</span>
                  </div>
                ))}
              </>) : spieren.map(s => (
                <button key={s.k} onClick={() => setFocus(s.k)} title="Oefeningen bekijken" style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '0.5rem 0.9rem', border: 'none', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left', background: 'transparent',
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: kleur(s.k), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{spierLabel(s.k)}</span>
                    <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{s.oef} oefening{s.oef === 1 ? '' : 'en'}</span>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{pct(s.nu)}</span>
                  <ChevronRight size={14} color="rgba(255,255,255,0.35)" />
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0, height: 420, padding: '1rem 1rem 0.5rem 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={detail ? detail.punten : punten} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={weekLabel} stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} />
                  <YAxis tickFormatter={(v) => `${v}%`} stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} tickLine={false} axisLine={false} width={48} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }} itemStyle={{ color: '#fff', fontWeight: 800, padding: 0 }}
                    labelFormatter={(w) => `Week van ${weekLabel(w)}`}
                    formatter={(v, k) => [pct(v), detail ? detail.naam[k] : spierLabel(k)]}
                    itemSorter={(it) => -it.value}
                  />
                  {(detail ? detail.lijnen : spieren.map(x => ({ k: x.k, kleur: kleur(x.k) }))).map(x => (
                    <Line key={x.k} type="monotone" dataKey={x.k} name={x.k} stroke={x.kleur} strokeWidth={2}
                      dot={detail ? { r: 3, strokeWidth: 0, fill: x.kleur } : false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0a0a0a' }} connectNulls isAnimationActive={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
