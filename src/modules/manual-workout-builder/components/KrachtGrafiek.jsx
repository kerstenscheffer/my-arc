// src/modules/manual-workout-builder/components/KrachtGrafiek.jsx
//
// Krachtverloop per spiergroep in de builder (10 nov 2026). Per oefening de
// beste set per week (geschatte 1RM: gewicht × (1 + reps/30), zodat 60×12 en
// 70×8 vergelijkbaar zijn), als % t.o.v. de eerste week in de gekozen periode.
// Per spiergroep het gemiddelde van zijn oefeningen. Eén as (procent), dus
// zware en lichte oefeningen tellen even zwaar.

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { spierVan, spierLabel } from '../spierGroepen'

// Vaste kleur per spiergroep (kleur volgt de spier, niet de rang). Gecontroleerd
// op zwart: alle 8 >= 3:1, kleurenblind-afstand >= 8,4 in deze volgorde.
const KLEUR = {
  chest: '#3987e5', back: '#d95926', legs: '#199e70', shoulders: '#c98500',
  biceps: '#d55181', glutes: '#008300', triceps: '#9085e9', calves: '#e66767',
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
  const [logs, setLogs] = useState(null) // null = laden
  const [bibSpier, setBibSpier] = useState({})
  const [focus, setFocus] = useState(null)

  useEffect(() => {
    if (!client?.id || !db?.supabase) return undefined
    let weg = false
    setLogs(null)
    ;(async () => {
      const van = new Date(); van.setDate(van.getDate() - weken * 7)
      const { data: sessies } = await db.supabase.from('workout_sessions').select('id, workout_date')
        .eq('client_id', client.id).gte('workout_date', van.toISOString().slice(0, 10))
        .then(r => r, () => ({ data: [] }))
      if (!sessies?.length) { if (!weg) setLogs([]); return }
      const datum = Object.fromEntries(sessies.map(s => [s.id, String(s.workout_date).slice(0, 10)]))
      const { data } = await db.supabase.from('workout_progress').select('session_id, exercise_name, sets')
        .in('session_id', sessies.map(s => s.id)).then(r => r, () => ({ data: [] }))
      const rijen = (data || []).map(l => ({ naam: l.exercise_name, datum: datum[l.session_id], kracht: Math.max(0, ...(Array.isArray(l.sets) ? l.sets : []).map(e1rm)) }))
        .filter(r => r.naam && r.datum && r.kracht > 0)
      // Oefeningen die niet (meer) in het plan staan: spiergroep uit de bibliotheek.
      const inPlan = new Set(plan.days.flatMap(d => d.exercises || []).map(e => String(e.name || '').toLowerCase()))
      const los = [...new Set(rijen.map(r => r.naam))].filter(n => !inPlan.has(n.toLowerCase()))
      if (los.length) {
        const { data: bib } = await db.supabase.from('exercises').select('name, primair_spieren').in('name', los)
          .then(r => r, () => ({ data: [] }))
        if (!weg) setBibSpier(Object.fromEntries((bib || []).map(b => [b.name.toLowerCase(), b.primair_spieren])))
      }
      if (!weg) setLogs(rijen)
    })()
    return () => { weg = true }
  }, [client?.id, db, weken, plan])

  const { punten, spieren } = useMemo(() => {
    if (!logs?.length) return { punten: [], spieren: [] }
    const spierUitPlan = {}
    for (const ex of plan.days.flatMap(d => d.exercises || [])) spierUitPlan[String(ex.name || '').toLowerCase()] = spierVan(ex)
    const spierOf = (naam) => {
      const k = naam.toLowerCase()
      return spierUitPlan[k] || (bibSpier[k] ? spierVan({ primairSpieren: bibSpier[k] }) : spierVan({ name: naam }))
    }
    // oefening → week → beste kracht
    const perOef = {}
    for (const r of logs) {
      const w = maandag(r.datum)
      const o = perOef[r.naam] || (perOef[r.naam] = {})
      o[w] = Math.max(o[w] || 0, r.kracht)
    }
    // spier → week → [% per oefening]
    const perSpier = {}
    const aantal = {}
    for (const [naam, wk] of Object.entries(perOef)) {
      const ws = Object.keys(wk).sort()
      if (ws.length < 2) continue
      const spier = spierOf(naam)
      if (spier === 'onbekend') continue
      aantal[spier] = (aantal[spier] || 0) + 1
      const basis = wk[ws[0]]
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
    return { punten, spieren }
  }, [logs, plan, bibSpier])

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
            {PERIODES.map(([w, l]) => <button key={w} onClick={() => setWeken(w)} aria-pressed={weken === w} style={knop(weken === w)}>{l}</button>)}
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></button>
        </div>

        {logs === null ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>Laden…</div>
        ) : !punten.length ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 700 }}>Te weinig gelogde trainingen in deze periode (per oefening minstens 2 weken nodig).</div>
        ) : (
          <div style={{ display: 'flex', minHeight: 0, flex: 1 }}>
            {/* Spiergroepen met de stand nu: tegelijk legenda en tabel. Klik = uitlichten. */}
            <div style={{ width: 230, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '0.5rem 0' }}>
              {spieren.map(s => (
                <button key={s.k} onClick={() => setFocus(f => (f === s.k ? null : s.k))} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '0.5rem 0.9rem', border: 'none', fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
                  background: focus === s.k ? 'rgba(255,255,255,0.07)' : 'transparent', opacity: focus && focus !== s.k ? 0.45 : 1,
                }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: kleur(s.k), flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 900, color: '#fff' }}>{spierLabel(s.k)}</span>
                    <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>{s.oef} oefening{s.oef === 1 ? '' : 'en'}</span>
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{pct(s.nu)}</span>
                </button>
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0, height: 420, padding: '1rem 1rem 0.5rem 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={punten} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="week" tickFormatter={weekLabel} stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.12)' }} />
                  <YAxis tickFormatter={(v) => `${v}%`} stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.55)' }} tickLine={false} axisLine={false} width={48} />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', fontWeight: 800 }} itemStyle={{ color: '#fff', fontWeight: 800, padding: 0 }}
                    labelFormatter={(w) => `Week van ${weekLabel(w)}`}
                    formatter={(v, k) => [pct(v), spierLabel(k)]}
                    itemSorter={(it) => -it.value}
                  />
                  {spieren.map(s => (
                    <Line key={s.k} type="monotone" dataKey={s.k} name={s.k} stroke={kleur(s.k)} strokeWidth={focus === s.k ? 3 : 2}
                      strokeOpacity={focus && focus !== s.k ? 0.15 : 1} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#0a0a0a' }} connectNulls isAnimationActive={false} />
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
