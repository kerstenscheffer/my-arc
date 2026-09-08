// src/modules/ai-meal-generator/tabs/plan-analyzer/DayLibraryModal.jsx
//
// Eén dag bewaren en terugzetten op de dagen die je kiest.
//
// De bibliotheek hiernaast (PlanLibraryModal) bewaart hele weken, en de
// "Dagen"-knop op een maaltijdkaart kopieert één maaltijd. Daartussenin zat
// niets: een dag die klopt — ontbijt, lunch, diner, snacks, met hun tijden —
// moest je maaltijd voor maaltijd naar de andere dagen overzetten.
//
// Opgeslagen als plan_type='single_day' in meal_plan_templates, coach-breed,
// zodat een dag die voor de ene klant werkt ook bij de volgende klant te
// pakken is.

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { SJABLOON_DAG } from '../../../../lib/mealTemplateTypes'
import { X, CalendarDays, Trash2, Loader, Check, Bookmark } from 'lucide-react'

const DAGEN_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const GOUD = '#FFD700'

export default function DayLibraryModal({
  db, coachId, weekData, activeDay = 0, dayName = '', clientName = '',
  trainingDays = [], onApply, onClose, isMobile, embedded = false,
}) {
  const modalHost = useModalHost()
  const m = isMobile

  const huidigeDag = weekData?.[activeDay] || null
  const maaltijden = Object.entries(huidigeDag?.meals || {}).filter(([, meal]) => !!meal)

  const [naam, setNaam] = useState('')
  useEffect(() => {
    setNaam(dayName ? `${dayName}${clientName ? ` — ${clientName}` : ''}` : '')
  }, [dayName, clientName])

  const [bewaren, setBewaren] = useState(false)
  const [fout, setFout] = useState('')
  const [netBewaard, setNetBewaard] = useState(false)
  const [dagen, setDagen] = useState([])
  const [laden, setLaden] = useState(true)
  const [verwijderId, setVerwijderId] = useState(null)

  // Welke opgeslagen dag staat open om toe te passen, en op welke weekdagen.
  const [gekozenDag, setGekozenDag] = useState(null)
  const [doelDagen, setDoelDagen] = useState([activeDay])
  const [toegepast, setToegepast] = useState(false)

  const laadLijst = async () => {
    setLaden(true)
    try {
      let q = db.supabase
        .from('meal_plan_templates')
        .select('id, name, template_name, daily_calories, daily_protein, daily_carbs, daily_fat, week_structure, meals_per_day, created_at')
        .eq('plan_type', SJABLOON_DAG)
        .order('created_at', { ascending: false })
      if (coachId) q = q.eq('coach_id', coachId)
      const { data, error } = await q
      if (error) throw error
      setDagen(data || [])
    } catch (e) {
      console.warn('Dag-bibliotheek laden mislukt:', e)
      setDagen([])
    }
    setLaden(false)
  }
  useEffect(() => { laadLijst() }, [coachId])

  const bewaarDag = async () => {
    if (!naam.trim()) { setFout('Geef de dag een naam'); return }
    if (!maaltijden.length) { setFout('Deze dag heeft nog geen maaltijden'); return }
    setBewaren(true); setFout(''); setNetBewaard(false)
    try {
      // Alleen de maaltijden. is_training_day gaat bewust NIET mee: of een dag
      // een trainingsdag is hangt aan het schema van de klant, niet aan de
      // maaltijden die je erop zet. Zou dat meeliften, dan zet je met een
      // opgeslagen rustdag stilletjes de training van iemand anders uit.
      const slots = {}
      maaltijden.forEach(([slot, meal]) => { slots[slot] = meal })

      const t = huidigeDag?.totals || {}
      const kcal = Math.round(t.kcal ?? t.calories ?? 0)
      const eiwit = Math.round(t.protein || 0)
      const kh = Math.round(t.carbs || 0)
      const vet = Math.round(t.fat || 0)

      const payload = {
        coach_id: coachId || null,
        name: naam.trim(),
        template_name: naam.trim(),
        plan_type: SJABLOON_DAG,
        week_structure: { day: slots },
        daily_calories: kcal, daily_protein: eiwit, daily_carbs: kh, daily_fat: vet,
        base_macros: { calories: kcal, protein: eiwit, carbs: kh, fat: vet },
        meals_per_day: maaltijden.length,
        emoji: '📌',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await db.supabase.from('meal_plan_templates').insert([payload])
      if (error) throw error
      setNetBewaard(true)
      await laadLijst()
      setTimeout(() => setNetBewaard(false), 2500)
    } catch (e) { setFout(e.message || 'Opslaan mislukt') }
    setBewaren(false)
  }

  const verwijder = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Deze opgeslagen dag definitief verwijderen?')) return
    setVerwijderId(id)
    try {
      const { error } = await db.supabase.from('meal_plan_templates').delete().eq('id', id)
      if (error) throw error
      setDagen(prev => prev.filter(d => d.id !== id))
      if (gekozenDag?.id === id) setGekozenDag(null)
    } catch (err) { console.warn('Verwijderen mislukt:', err) }
    setVerwijderId(null)
  }

  const wisselDoelDag = (i) =>
    setDoelDagen(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])

  const snelkeuzes = [
    { label: 'Deze dag', dagen: [activeDay] },
    { label: 'Alle dagen', dagen: [0, 1, 2, 3, 4, 5, 6] },
    ...(trainingDays.length ? [{ label: '💪 Trainingsdagen', dagen: [...trainingDays] }] : []),
    { label: 'Werkdagen', dagen: [0, 1, 2, 3, 4] },
    { label: 'Weekend', dagen: [5, 6] },
  ]
  const zelfdeDagen = (a) => a.length === doelDagen.length && a.every(d => doelDagen.includes(d))

  const openToepassen = (dag) => {
    setGekozenDag(dag)
    setDoelDagen([activeDay])
    setToegepast(false)
  }

  const pasToe = async () => {
    if (!gekozenDag || !doelDagen.length || toegepast) return
    setToegepast(true)
    await onApply?.(gekozenDag.week_structure, doelDagen, gekozenDag.name || gekozenDag.template_name)
    setTimeout(() => { setGekozenDag(null); setToegepast(false) }, 600)
  }

  const datum = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }
    catch { return '' }
  }

  const kop = (tekst) => (
    <div style={{
      fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{tekst}</div>
  )

  const inhoud = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* Kop */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderBottom: `1px solid rgba(255,215,0,0.2)`, flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: GOUD, fontWeight: 800, fontSize: m ? '0.8rem' : '0.85rem' }}>
          <CalendarDays size={15} /> Dagen bewaren
        </span>
        <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><X size={15} /></button>
      </div>

      {/* Deze dag bewaren */}
      <div style={{ padding: m ? '0.7rem 0.8rem' : '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,215,0,0.02)', flexShrink: 0 }}>
        {kop(`${dayName || 'Deze dag'} bewaren`)}
        <div style={{ fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', margin: '0.15rem 0 0.45rem', lineHeight: 1.35 }}>
          {maaltijden.length
            ? `${maaltijden.length} maaltijd${maaltijden.length !== 1 ? 'en' : ''} met hun tijden. Later terug te zetten op elke dag, ook bij een andere klant.`
            : 'Deze dag is nog leeg — vul eerst maaltijden in.'}
        </div>
        <input
          value={naam}
          onChange={e => { setNaam(e.target.value); setFout('') }}
          placeholder="bijv. Trainingsdag 3000kcal"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,215,0,0.25)`, borderRadius: 7, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: '0.45rem' }}
        />
        {fout && <div style={{ fontSize: '0.6rem', color: '#ef4444', marginBottom: '0.4rem' }}>{fout}</div>}
        <button onClick={bewaarDag} disabled={bewaren || !maaltijden.length} style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          padding: '0.55rem',
          background: netBewaard ? 'rgba(16,185,129,0.15)' : (maaltijden.length ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.04)'),
          border: `1px solid ${netBewaard ? 'rgba(16,185,129,0.5)' : (maaltijden.length ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.1)')}`,
          borderRadius: 7,
          color: netBewaard ? '#10b981' : (maaltijden.length ? GOUD : 'rgba(255,255,255,0.25)'),
          fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 800,
          cursor: (bewaren || !maaltijden.length) ? 'default' : 'pointer',
          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
        }}>
          {bewaren ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Bookmark size={14} />}
          {netBewaard ? 'Dag bewaard ✓' : (bewaren ? 'Bewaren…' : 'Bewaar deze dag')}
        </button>
      </div>

      {/* Opgeslagen dagen */}
      <div style={{ padding: m ? '0.5rem 0.8rem 0.35rem' : '0.6rem 1rem 0.4rem', flexShrink: 0 }}>
        {kop(`Opgeslagen dagen (${dagen.length})`)}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {laden && <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Laden…</div>}
        {!laden && dagen.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Nog geen opgeslagen dagen</div>
        )}
        {!laden && dagen.map(d => {
          const open = gekozenDag?.id === d.id
          return (
            <div key={d.id} style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m ? '0.55rem 0.8rem' : '0.65rem 1rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.name || d.template_name || 'Naamloze dag'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: m ? '0.55rem' : '0.6rem', marginTop: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {d.daily_calories ? <span style={{ color: 'rgba(255,215,0,0.7)', fontWeight: 800 }}>{d.daily_calories} kcal</span> : null}
                    {d.daily_protein ? <span>{d.daily_protein}g E</span> : null}
                    {d.meals_per_day ? <span>· {d.meals_per_day} maaltijden</span> : null}
                    {d.created_at ? <span>· {datum(d.created_at)}</span> : null}
                  </div>
                </div>
                <button onClick={() => open ? setGekozenDag(null) : openToepassen(d)} title="Op dagen toepassen"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.6rem', flexShrink: 0, background: open ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.1)', border: `1px solid rgba(255,215,0,${open ? 0.6 : 0.35})`, borderRadius: 6, color: GOUD, fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
                  <CalendarDays size={13} /> Toepassen
                </button>
                <button onClick={(e) => verwijder(d.id, e)} disabled={verwijderId === d.id} title="Verwijderen"
                  style={{ width: 30, height: 30, flexShrink: 0, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  {verwijderId === d.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                </button>
              </div>

              {/* Dagkiezer — pas uitgeklapt bij de dag die je toepast, zodat de
                  lijst niet zeven keer dezelfde knoppenrij toont. */}
              {open && (
                <div style={{ padding: m ? '0 0.8rem 0.75rem' : '0 1rem 0.85rem' }}>
                  <div style={{ fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 800, color: 'rgba(255,255,255,0.55)', marginBottom: '0.4rem' }}>
                    Op welke dagen zetten?
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {DAGEN_KORT.map((label, i) => {
                      const aan = doelDagen.includes(i)
                      return (
                        <button key={i} onClick={() => wisselDoelDag(i)} style={{
                          flex: 1, padding: m ? '0.5rem 0' : '0.55rem 0',
                          background: aan ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${aan ? GOUD : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 8, color: aan ? GOUD : 'rgba(255,255,255,0.6)',
                          fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800,
                          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          minHeight: 36, fontFamily: 'inherit',
                        }}>{label}</button>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                    {snelkeuzes.map(q => {
                      const aan = zelfdeDagen(q.dagen)
                      return (
                        <button key={q.label} onClick={() => setDoelDagen(q.dagen)} style={{
                          padding: m ? '0.35rem 0.6rem' : '0.4rem 0.7rem',
                          background: aan ? 'rgba(255,215,0,0.14)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${aan ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 999, color: aan ? GOUD : 'rgba(255,255,255,0.7)',
                          fontSize: m ? '0.66rem' : '0.7rem', fontWeight: 800,
                          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
                        }}>{q.label}</button>
                      )
                    })}
                  </div>
                  {/* Zeggen wat er gebeurt. Dit overschrijft de maaltijden die
                      er staan, en dat mag je niet pas ná de klik ontdekken. */}
                  <div style={{ fontSize: m ? '0.58rem' : '0.62rem', fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: '0.5rem', lineHeight: 1.35 }}>
                    Vervangt de maaltijden op de gekozen dagen. Trainingsdagen blijven staan zoals ze staan; met Undo draai je het terug.
                  </div>
                  <button onClick={pasToe} disabled={!doelDagen.length} style={{
                    width: '100%', padding: m ? '0.6rem' : '0.7rem',
                    background: toegepast ? '#10b981' : (doelDagen.length ? GOUD : 'rgba(255,255,255,0.05)'),
                    border: 'none', borderRadius: 8,
                    color: doelDagen.length || toegepast ? '#000' : 'rgba(255,255,255,0.25)',
                    fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 800,
                    cursor: doelDagen.length ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    minHeight: 42, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit',
                  }}>
                    {toegepast
                      ? <><Check size={15} /> Toegepast!</>
                      : <><CalendarDays size={15} /> Zetten op {doelDagen.length} dag{doelDagen.length !== 1 ? 'en' : ''}</>}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return inhoud
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, height: m ? '90vh' : '70vh', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>{inhoud}</div>
    </div>,
    modalHost
  )
}
