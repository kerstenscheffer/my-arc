// src/modules/ai-meal-generator/tabs/plan-analyzer/WeekKolommen.jsx
//
// De hele week naast elkaar (10 nov 2026), zoals de dagen in de workout
// builder: zeven kolommen tegen elkaar in één blok, per dag de maaltijden op
// tijd als compacte kaart. Zo zie je in één oogopslag welke dag afwijkt.
//
//   - Muis vasthouden en slepen over kaarten: selecteren (Shift/Cmd = erbij).
//     Klik zonder slepen op een kaart = die aan/uit. Met een selectie
//     verschijnt onderin de balk om ze in één keer aan te passen.
//   - Een kaart aan het gripje naar een andere dag slepen = verplaatsen.
//   - Klik op de dagkop = die dag openen in de dagweergave.
//
// De losse pre-workout (plan-kolom, alleen op trainingsdagen) staat er
// gedimd bij zodat de totalen kloppen, maar is niet te selecteren of slepen:
// die pas je aan in de dagweergave.

import { useEffect, useRef, useState } from 'react'
import { GripVertical, Plus, X, Trash2, Repeat, Minus, Clock, ArrowLeftRight, Pencil, Dumbbell } from 'lucide-react'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import { pctVan, pctKleur, dagDoel } from './weekCijfers'

const LIJN = '1px solid rgba(255,255,255,0.12)'
const DAG = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const nl = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0))
const getallen = { fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }
const SLOT_LABEL = {
  breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', pre_workout: 'Pre-workout',
  snack1: 'Snack', snack2: 'Snack', snack3: 'Snack', snack4: 'Snack', snack5: 'Snack', snack6: 'Snack', snack7: 'Snack', snack8: 'Snack',
}

const selSleutel = (dag, slot) => `${dag}|${slot}`

// Naam op één regel. Past hij niet, dan schuift de tekst door zodra de muis
// op de kaart staat, zodat je de rest kunt lezen (18 nov 2026).
function SchuifNaam({ tekst }) {
  const vak = useRef(null)
  const [schuif, setSchuif] = useState(0)
  useEffect(() => {
    const kaart = vak.current?.closest('[data-sel], [data-kaart]')
    if (!kaart) return undefined
    const in_ = () => { const el = vak.current; if (el) setSchuif(Math.max(0, el.scrollWidth - el.clientWidth)) }
    const uit = () => setSchuif(0)
    kaart.addEventListener('mouseenter', in_)
    kaart.addEventListener('mouseleave', uit)
    return () => { kaart.removeEventListener('mouseenter', in_); kaart.removeEventListener('mouseleave', uit) }
  }, [])
  return (
    <div ref={vak} style={{ overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '0.74rem', fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>
      <span style={{ display: 'inline-block', transform: `translateX(-${schuif}px)`, transition: `transform ${schuif ? Math.max(0.6, schuif / 45) : 0.2}s linear` }}>{tekst}</span>
    </div>
  )
}

export default function WeekKolommen({
  dagen, targets = {}, weekStart = null, aangepast = [], actiefDag = null,
  selectie, setSelectie, onOpenDag, onVoegToe, onVerplaats, onWissel, onVerwijder, trainingen = [], isMobile,
}) {
  const m = isMobile
  const vakRef = useRef(null)
  const lassoRef = useRef(null)
  const [lasso, setLasso] = useState(null)
  const [sleep, setSleep] = useState(null)      // { dag, slot } die versleept wordt
  const [doelDag, setDoelDag] = useState(null)  // kolom waar hij boven hangt

  const datum = (i) => {
    if (!weekStart) return null
    const d = new Date(`${weekStart}T00:00:00`); d.setDate(d.getDate() + i)
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  }

  // Lasso: zelfde gedrag als in de workout builder.
  const startLasso = (e) => {
    if (m || e.pointerType !== 'mouse' || e.button !== 0) return
    if (e.target.closest?.('button, input, textarea, select, a, [data-greep], [data-geen-sleep]')) return
    e.preventDefault()
    const erbij = e.shiftKey || e.metaKey
    lassoRef.current = { x: e.clientX, y: e.clientY, basis: erbij ? new Set(selectie) : new Set(), bewogen: false, kaart: e.target.closest?.('[data-sel]')?.dataset.sel }
    const beweeg = (ev) => {
      const st = lassoRef.current
      if (!st) return
      if (!st.bewogen && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) < 5) return
      st.bewogen = true
      const r = { l: Math.min(st.x, ev.clientX), r: Math.max(st.x, ev.clientX), t: Math.min(st.y, ev.clientY), b: Math.max(st.y, ev.clientY) }
      setLasso(r)
      const nieuw = new Set(st.basis)
      vakRef.current?.querySelectorAll('[data-sel]').forEach(el => {
        const b = el.getBoundingClientRect()
        if (b.right > r.l && b.left < r.r && b.bottom > r.t && b.top < r.b) nieuw.add(el.dataset.sel)
      })
      setSelectie(nieuw)
    }
    const los = () => {
      window.removeEventListener('pointermove', beweeg)
      window.removeEventListener('pointerup', los)
      const st = lassoRef.current
      lassoRef.current = null
      setLasso(null)
      if (!st || st.bewogen) return
      if (st.kaart) setSelectie(prev => { const n = new Set(prev); if (n.has(st.kaart)) n.delete(st.kaart); else n.add(st.kaart); return n })
      else if (!erbij) setSelectie(new Set())
    }
    window.addEventListener('pointermove', beweeg)
    window.addEventListener('pointerup', los)
  }

  useEffect(() => {
    if (!selectie.size) return undefined
    const esc = (e) => { if (e.key === 'Escape') setSelectie(new Set()) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [selectie, setSelectie])

  return (
    <div ref={vakRef} onPointerDown={startLasso} style={{ userSelect: 'none', WebkitUserSelect: 'none', overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', border: LIJN, borderRadius: 12, overflow: 'hidden', minWidth: m ? 7 * 200 : 7 * 150 }}>
        {dagen.map((dag) => {
          const i = dag.index
          const doel = dagDoel(dag, targets)
          const pK = pctVan(dag.kcal, doel.calories)
          const pE = pctVan(dag.protein, doel.protein)
          const leeg = dag.maaltijden.length === 0
          const isDoel = doelDag === i && sleep && sleep.dag !== i
          return (
            <div key={i}
              onDragOver={(e) => { if (!sleep) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (doelDag !== i) setDoelDag(i) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget) && doelDag === i) setDoelDag(null) }}
              onDrop={(e) => { e.preventDefault(); if (sleep && sleep.dag !== i) onVerplaats?.(sleep.dag, sleep.slot, i); setSleep(null); setDoelDag(null) }}
              style={{
                flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
                borderLeft: i ? LIJN : 'none',
                background: isDoel ? 'rgba(255,255,255,0.06)' : actiefDag === i ? 'rgba(255,255,255,0.02)' : 'transparent',
              }}>
              {/* Dagkop: klik = die dag openen. */}
              <button onClick={() => onOpenDag?.(i)} title={`${DAG[i]} openen`} style={{
                display: 'block', width: '100%', padding: '0.55rem 0.6rem 0.5rem', background: 'transparent', border: 'none',
                borderBottom: LIJN, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{DAG[i]}</span>
                  {datum(i) && <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)' }}>{datum(i)}</span>}
                  {aangepast.includes(i) && <span title="Alleen deze week anders" style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                  {dag.training && <span title="Trainingsdag" style={{ marginLeft: 'auto', fontSize: '0.56rem', fontWeight: 900, color: '#0a0a0a', background: '#fff', borderRadius: 3, padding: '0 4px', lineHeight: '14px' }}>TRAINING</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span style={{ ...getallen, fontSize: '0.98rem', fontWeight: 900, color: leeg ? 'rgba(255,255,255,0.3)' : pK == null ? '#fff' : pctKleur(pK) }}>{nl(dag.kcal)}</span>
                  {doel.calories > 0 && <span title={dag.pre ? 'Doel inclusief de pre-workout van deze dag' : undefined} style={{ ...getallen, fontSize: '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)' }}>/ {nl(doel.calories)}</span>}
                </span>
                <span style={{ display: 'flex', gap: 7, marginTop: 2, ...getallen, fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.6)' }}>
                  <span style={{ color: pE != null && !leeg ? pctKleur(pE) : undefined }}>E {nl(dag.protein)}</span>
                  <span>K {nl(dag.carbs)}</span>
                  <span>V {nl(dag.fat)}</span>
                </span>
              </button>

              {/* Maaltijden op tijd. */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5, padding: '0.45rem 0.4rem' }}>
                {(() => {
                  // De training van het actieve workoutplan staat op zijn tijd
                  // tussen de maaltijden, zodat je ziet wat ervoor en erna komt.
                  const tr = trainingen[i]
                  const rij = dag.maaltijden.map(x => ({ ...x }))
                  if (tr) {
                    const plek = tr.tijd ? rij.findIndex(x => (x.tijd || '') > tr.tijd) : 0
                    rij.splice(plek === -1 ? rij.length : plek, 0, { training: tr })
                  }
                  return rij
                })().map(({ slot, meal, tijd, los, training }) => {
                  if (training) return (
                    <div key="training" data-geen-sleep title={`Training uit het actieve workoutplan${training.tijd ? '' : ' · tijd onbekend'}`} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.32rem 0.5rem', borderRadius: 9, background: '#fff', color: '#0a0a0a' }}>
                      <Dumbbell size={14} strokeWidth={2.8} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.74rem', fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{training.naam}</div>
                        <div style={{ ...getallen, fontSize: '0.64rem', fontWeight: 800, color: 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
                          {training.tijd ? `${training.tijd}${training.eind ? ` – ${training.eind}` : ''}` : 'Tijd onbekend'} · {training.min} min · {training.oef} oef
                        </div>
                      </div>
                    </div>
                  )
                  const sleutel = selSleutel(i, slot)
                  const gekozen = !los && selectie.has(sleutel)
                  const label = meal.display_label || SLOT_LABEL[slot] || slot
                  return (
                    <div key={slot + (los ? '-los' : '')}
                      {...(los ? { 'data-kaart': '' } : { 'data-sel': sleutel })}
                      title={los ? 'Pre-workout uit het plan · pas aan in de dagweergave' : `${meal.name || ''}\nKlik = selecteren · slepen over kaarten = meerdere`}
                      style={{
                        display: 'flex', gap: 5, alignItems: 'stretch', borderRadius: 9, overflow: 'hidden',
                        background: gekozen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${gekozen ? '#fff' : 'rgba(255,255,255,0.07)'}`,
                        opacity: los ? 0.5 : sleep && sleep.dag === i && sleep.slot === slot ? 0.4 : 1,
                        cursor: los ? 'default' : 'pointer',
                      }}>
                      <div style={{ width: 58, flexShrink: 0, position: 'relative', backgroundImage: `url(${meal.image_url || foodImageFallback(meal.name, slot, 160)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {/* Soort en tijd in de foto, dik wit met schaduw (18 nov 2026). */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.8) 100%)' }} />
                        <div style={{ position: 'absolute', left: 4, right: 3, bottom: 3, lineHeight: 1.15, color: '#fff', fontWeight: 900, textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8)' }}>
                          <div style={{ fontSize: '0.54rem', letterSpacing: '0.03em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                          {tijd && <div style={{ ...getallen, fontSize: '0.62rem' }}>{tijd}</div>}
                        </div>
                      </div>
                      {/* Foto volle hoogte links; tekst en knoppen rechts ervan (18 nov 2026). */}
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'stretch' }}>
                      <div style={{ flex: 1, minWidth: 0, padding: '0.34rem 0 0.28rem 0.1rem' }}>
                        <SchuifNaam tekst={meal.name || 'Maaltijd'} />
                        <div style={{ ...getallen, fontSize: '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginTop: 1, whiteSpace: 'nowrap' }}>
                          {nl(meal.calories)} · E{nl(meal.protein)} K{nl(meal.carbs)} V{nl(meal.fat)}
                        </div>
                      </div>
                      {!los && !m && (
                        <span data-greep draggable
                          onDragStart={(e) => { setSleep({ dag: i, slot }); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', sleutel) } catch { /* oude browser */ } }}
                          onDragEnd={() => { setSleep(null); setDoelDag(null) }}
                          title="Sleep naar een andere dag"
                          style={{ display: 'flex', alignItems: 'center', padding: '0 3px', color: 'rgba(255,255,255,0.3)', cursor: 'grab' }}>
                          <GripVertical size={13} />
                        </span>
                      )}
                      </div>
                      {!los && (
                        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                          {[
                            onWissel && { t: 'Wisselen', i: <ArrowLeftRight size={11} />, f: () => onWissel(i, slot, meal) },
                            { t: 'Bewerken in de dagweergave', i: <Pencil size={11} />, f: () => onOpenDag?.(i) },
                            onVerwijder && { t: 'Verwijderen', i: <Trash2 size={11} />, f: () => onVerwijder(i, slot), rood: true },
                          ].filter(Boolean).map((k, ki) => (
                            <button key={k.t} onClick={k.f} title={k.t} aria-label={k.t} style={{ flex: 1, height: 20, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderLeft: ki ? '1px solid rgba(255,255,255,0.07)' : 'none', color: k.rood ? '#ef4444' : 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>{k.i}</button>
                          ))}
                        </div>
                      )}
                      </div>
                    </div>
                  )
                })}
                {leeg && <div style={{ padding: '0.6rem 0.2rem', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>Nog niets gepland</div>}
              </div>

              {onVoegToe && (
                <button onClick={() => onVoegToe(i)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', height: 36,
                  background: '#fff', border: 'none', color: '#0a0a0a', fontSize: '0.76rem', fontWeight: 900,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}>
                  <Plus size={14} strokeWidth={3} /> Maaltijd
                </button>
              )}
            </div>
          )
        })}
      </div>
      {lasso && (
        <div style={{
          position: 'fixed', left: lasso.l, top: lasso.t, width: lasso.r - lasso.l, height: lasso.b - lasso.t,
          border: '1px solid rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none', zIndex: 60,
        }} />
      )}
    </div>
  )
}

// Balk onderin zodra er maaltijden geselecteerd zijn: in één keer porties,
// tijd, wisselen of verwijderen.
export function BulkBalk({ aantal, bezig = null, onPortie, onTijd, onWissel, onVerwijder, onWis, isMobile }) {
  const [tijd, setTijd] = useState('')
  const knop = (rood) => ({
    height: 34, padding: '0 0.7rem', borderRadius: 9, display: 'inline-flex', alignItems: 'center', gap: 5,
    background: 'transparent', border: `1px solid ${rood ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.18)'}`,
    color: rood ? '#ef4444' : '#fff', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'inherit', cursor: bezig ? 'wait' : 'pointer',
    whiteSpace: 'nowrap', opacity: bezig ? 0.6 : 1,
  })
  const scheiding = <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.14)', flexShrink: 0 }} />
  return (
    <div data-geen-sleep style={{
      position: 'fixed', left: '50%', bottom: isMobile ? 90 : 96, transform: 'translateX(-50%)', zIndex: 95,
      display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 0.6rem 0.5rem 0.9rem', maxWidth: 'calc(100vw - 24px)', overflowX: 'auto',
      background: '#111', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, boxShadow: '0 16px 44px rgba(0,0,0,0.7)',
    }}>
      <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>{aantal} geselecteerd</span>
      {scheiding}
      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Portie</span>
      <button disabled={!!bezig} onClick={() => onPortie(0.9)} title="10% kleiner" style={knop()}><Minus size={13} strokeWidth={3} />10%</button>
      <button disabled={!!bezig} onClick={() => onPortie(1.1)} title="10% groter" style={knop()}><Plus size={13} strokeWidth={3} />10%</button>
      {scheiding}
      <Clock size={14} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
      <input type="time" value={tijd} onChange={(e) => setTijd(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && tijd) onTijd(tijd) }}
        style={{ height: 34, width: 92, padding: '0 0.4rem', borderRadius: 9, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', colorScheme: 'dark' }} />
      <button disabled={!!bezig || !tijd} onClick={() => onTijd(tijd)} style={{ ...knop(), opacity: !tijd ? 0.4 : knop().opacity }}>Zet tijd</button>
      {scheiding}
      <button disabled={!!bezig} onClick={onWissel} title="Alle geselecteerde vervangen door één maaltijd" style={knop()}><Repeat size={13} strokeWidth={2.8} />Wissel</button>
      <button disabled={!!bezig} onClick={onVerwijder} title="Geselecteerde verwijderen" style={knop(true)}><Trash2 size={13} strokeWidth={2.8} /></button>
      <button onClick={onWis} title="Selectie weg (Esc)" aria-label="Selectie weg" style={{ ...knop(), border: 'none', padding: '0 0.4rem' }}><X size={16} strokeWidth={2.8} /></button>
    </div>
  )
}
