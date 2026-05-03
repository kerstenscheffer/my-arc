// src/modules/client-journey/components/EvaluationModal.jsx
// v7.1 — client.target_calories als enige bron voor macro targets
import React, { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Activity, Sliders, Check, AlertTriangle, Scale, Utensils, Dumbbell, ChevronDown, ChevronUp, Save, Camera, Flame, Plus, Minus } from 'lucide-react'

const C = {
  gold: '#FFD700', darkGold: '#D4AF37', green: '#10b981', red: '#ef4444', amber: '#f59e0b',
  purple: '#a855f7', orange: '#f97316', bg: '#0a0a0a', text: '#fff',
  text50: 'rgba(255,255,255,0.5)', text25: 'rgba(255,255,255,0.25)', text20: 'rgba(255,255,255,0.2)',
  text15: 'rgba(255,255,255,0.15)', text08: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.06)', borderSub: 'rgba(255,255,255,0.04)', borderItem: 'rgba(255,255,255,0.03)',
  goldBg: 'rgba(255,215,0,0.02)', goldBg10: 'rgba(255,215,0,0.08)',
}
const STOCK = {
  workout: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop&crop=center',
  meal: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=300&fit=crop&crop=center',
  scale: 'https://images.unsplash.com/photo-1611077544507-3cb07658f82b?w=600&h=300&fit=crop&crop=center',
  photo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=300&fit=crop&crop=center',
}
const LPW = { mild: 0.25, moderate: 0.5, aggressive: 0.75 }
const DEFOPTS = [
  { id: 'mild', label: 'Mild', desc: '~0.25kg/wk', pct: 0.125 },
  { id: 'moderate', label: 'Moderate', desc: '~0.5kg/wk', pct: 0.20 },
  { id: 'aggressive', label: 'Aggressive', desc: '~0.75kg/wk', pct: 0.30 },
]
function r7avg(wh, target) { if (!wh?.length) return null; const d = new Date(target); const e = wh.filter(w => { const df = (d - new Date(w.date || w.created_at)) / 86400000; return df >= 0 && df < 7 }); return e.length ? e.reduce((s, w) => s + (w.weight || w.value), 0) / e.length : null }
function expAtWk(wk, plan, adjs = []) { let w = plan.start_weight; for (let i = 1; i <= wk; i++) { const a = adjs.filter(x => x.week <= i).sort((a, b) => b.week - a.week)[0]; w = plan.is_cut !== false ? w - (LPW[a?.deficit_level || plan.deficit_level || 'moderate'] || 0.5) : w + (LPW[a?.deficit_level || plan.deficit_level || 'moderate'] || 0.5) * 0.4 } return w }
function wkRange(start, wk) { const s = new Date(start); s.setDate(s.getDate() + (wk - 1) * 7); const e = new Date(s); e.setDate(e.getDate() + 6); return { start: s, end: e } }
function calcMacros(k, bw) { const p = Math.round(bw * 2), f = Math.round((k * 0.25) / 9); return { protein: p, carbs: Math.max(0, Math.round((k - p * 4 - f * 9) / 4)), fat: f } }
function dAgo(d) { if (!d) return null; const x = Math.floor((Date.now() - new Date(d).getTime()) / 86400000); return x === 0 ? 'vandaag' : x === 1 ? 'gisteren' : `${x}d geleden` }
function fmtDate(d) { return new Date(d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) }
function fmtTime(d) { return new Date(d).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) }

// ════════ MACRO EDITOR ════════
function MacroEditor({ targetKcal, initProtein, initCarbs, initFat, isMobile, onChange }) {
  const [kcal, setKcal] = useState(targetKcal)
  const [protein, setProtein] = useState(initProtein)
  const [fat, setFat] = useState(initFat)

  // Carbs = restpost, altijd auto-berekend
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4))
  const totalKcal = protein * 4 + carbs * 4 + fat * 9
  const kcalDiff = totalKcal - kcal

  useEffect(() => {
    onChange({ kcal, protein, carbs, fat })
  }, [kcal, protein, fat])

  const adjProtein = (delta) => {
    const np = Math.max(50, protein + delta)
    setProtein(np)
  }

  const adjFat = (delta) => {
    const nf = Math.max(20, fat + delta)
    setFat(nf)
  }

  const adjKcal = (delta) => {
    const nk = Math.max(1000, Math.min(5000, kcal + delta))
    setKcal(nk)
  }

  const pct = (g, cal) => Math.round((g * cal / totalKcal) * 100)

  const MacroRow = ({ label, value, onAdj, kcalPer, color, isAuto = false, step = 5 }) => {
    const macroKcal = value * kcalPer
    const barPct = Math.min(100, (macroKcal / totalKcal) * 100)
    return (
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', width: '3rem' }}>{label}</span>
          <div style={{ flex: 1 }} />
          {isAuto ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
              <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: '0.4rem', color: C.text25 }}>g</span>
              <span style={{ fontSize: '0.35rem', color: C.text15, marginLeft: '0.2rem' }}>AUTO</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => onAdj(-step)}
                style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}
              ><Minus size={11} /></button>
              <div style={{ minWidth: isMobile ? '3.5rem' : '4rem', textAlign: 'center' }}>
                <span style={{ fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
                <span style={{ fontSize: '0.4rem', color: C.text25, marginLeft: '0.1rem' }}>g</span>
              </div>
              <button
                onClick={() => onAdj(step)}
                style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', flexShrink: 0 }}
              ><Plus size={11} /></button>
            </div>
          )}
          <span style={{ fontSize: '0.4rem', color: C.text15, width: '2.5rem', textAlign: 'right' }}>{Math.round(macroKcal)} kcal</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barPct}%`, background: color, borderRadius: '2px', transition: 'width 0.2s ease' }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Kcal anker */}
      <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}`, background: `${C.gold}06` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kcal Target</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => adjKcal(-50)} style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Minus size={11} /></button>
          <div style={{ minWidth: isMobile ? '4rem' : '5rem', textAlign: 'center' }}>
            <span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: 800, color: C.gold }}>{kcal}</span>
            <span style={{ fontSize: '0.4rem', color: C.text25, marginLeft: '0.1rem' }}>kcal</span>
          </div>
          <button onClick={() => adjKcal(50)} style={{ width: isMobile ? '28px' : '32px', height: isMobile ? '28px' : '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><Plus size={11} /></button>
        </div>
      </div>

      <MacroRow label="Eiwit" value={protein} onAdj={adjProtein} kcalPer={4} color={C.orange} step={5} />
      <MacroRow label="Vet" value={fat} onAdj={adjFat} kcalPer={9} color={C.amber} step={2} />
      <MacroRow label="Koolhydraten" value={carbs} kcalPer={4} color={C.green} isAuto />

      {/* Live kcal check */}
      <div style={{ padding: isMobile ? '0.35rem 0.75rem' : '0.4rem 1rem', borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '0.5rem', background: Math.abs(kcalDiff) > 50 ? `${C.red}08` : `${C.green}06` }}>
        <span style={{ fontSize: '0.4rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Totaal</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: Math.abs(kcalDiff) > 50 ? C.red : C.green }}>{totalKcal} kcal</span>
        {Math.abs(kcalDiff) > 0 && (
          <span style={{ fontSize: '0.4rem', color: Math.abs(kcalDiff) > 50 ? C.red : C.text25, fontWeight: 700 }}>
            {kcalDiff > 0 ? '+' : ''}{kcalDiff} vs target
          </span>
        )}
      </div>
    </div>
  )
}

export default function EvaluationModal({ isOpen, onClose, weekNumber, coachingPlan, weightHistory, journey, db, isMobile: iMP, onDataRefresh }) {
  const isMobile = iMP ?? window.innerWidth <= 768
  const [showAdj, setShowAdj] = useState(false)
  const [showHist, setShowHist] = useState(false)
  const [aD, setAD] = useState(null), [aC, setAC] = useState(null), [aR, setAR] = useState('')
  const [saving, setSaving] = useState(false), [saved, setSaved] = useState(false)
  const [macros, setMacros] = useState(null) // { kcal, protein, carbs, fat }

  // Client targets — enige bron van waarheid
  const [clientTargets, setClientTargets] = useState(null)

  // Summary data
  const [weighData, setWeighData] = useState(null)
  const [workoutData, setWorkoutData] = useState(null)
  const [mealData, setMealData] = useState(null)
  const [photoData, setPhotoData] = useState(null)
  const [photos, setPhotos] = useState({ start: null, current: null })
  const [selType, setSelType] = useState('front')

  // Detail data
  const [expanded, setExpanded] = useState(null)
  const [workoutDetail, setWorkoutDetail] = useState(null)

  const plan = coachingPlan
  if (!isOpen || !plan) return null
  const adjs = plan.adjustments || [], startW = plan.start_weight, goalW = plan.goal_weight
  const defLvl = plan.deficit_level || 'moderate', isCut = plan.is_cut !== false
  const tdee = plan.tdee || 2500, curDef = DEFOPTS.find(d => d.id === defLvl) || DEFOPTS[1]

  // Haal actuele macro targets op uit clients tabel — dit is de enige bron van waarheid
  useEffect(() => {
    if (!db?.supabase || !journey?.client_id) return
    const fetchClientTargets = async () => {
      console.log('🔍 [EvalModal] Fetching client targets for:', journey.client_id)
      const { data, error } = await db.supabase
        .from('clients')
        .select('target_calories, target_protein, target_carbs, target_fat')
        .eq('id', journey.client_id)
        .single()
      if (error) console.error('❌ [EvalModal] fetchClientTargets error:', error)
      if (data) {
        console.log('✅ [EvalModal] clientTargets loaded:', data)
        setClientTargets(data)
      } else {
        console.warn('⚠️ [EvalModal] No client targets found')
      }
    }
    fetchClientTargets()
  }, [journey?.client_id])

  // Gebruik client targets als primaire bron, plan als fallback, berekening als laatste resort
  const curKcal = clientTargets?.target_calories || plan.target_calories || Math.round(tdee * (1 - curDef.pct))
  const initProtein = clientTargets?.target_protein || plan.target_protein || calcMacros(curKcal, startW).protein
  const initFat = clientTargets?.target_fat || plan.target_fat || calcMacros(curKcal, startW).fat
  const initCarbs = clientTargets?.target_carbs || plan.target_carbs || calcMacros(curKcal, startW).carbs

  console.log('🔄 [EvalModal] render — clientTargets:', clientTargets, '→ curKcal:', curKcal, 'P:', initProtein, 'F:', initFat, 'C:', initCarbs)

  const curCardio = plan.cardio_sessions || 0, jStart = journey?.start_date || journey?.created_at

  const wData = useMemo(() => { const d = []; for (let w = 0; w <= weekNumber; w++) { const exp = w === 0 ? startW : expAtWk(w, plan, adjs); let act = w === 0 ? startW : (jStart ? r7avg(weightHistory, wkRange(jStart, w).end) : null); d.push({ week: w, expected: Math.round(exp * 10) / 10, actual: act ? Math.round(act * 10) / 10 : null }) }; return d }, [weekNumber, plan, adjs, weightHistory, jStart, startW])
  const latest = [...wData].reverse().find(d => d.actual !== null)
  const wkT = wData[weekNumber], diff = latest && wkT ? latest.actual - wkT.expected : null
  const onTr = diff !== null ? Math.abs(diff) <= 0.5 : null
  const toGo = latest ? Math.abs(latest.actual - goalW) : Math.abs(startW - goalW)
  const lWk = LPW[defLvl] || 0.5, wksL = lWk > 0 ? Math.ceil(toGo / lWk) : '?'
  const wkCh = useMemo(() => { const c = [...wData].reverse().find(d => d.actual !== null); const pv = wData.filter(d => d.actual !== null && d.week < (c?.week || 0)); const p = pv.length ? pv[pv.length - 1] : null; return c && p ? Math.round((c.actual - p.actual) * 10) / 10 : null }, [wData])

  // Init macros wanneer adj panel opent
  useEffect(() => {
    if (showAdj && !macros) {
      setMacros({ kcal: curKcal, protein: initProtein, carbs: initCarbs, fat: initFat })
    }
    if (!showAdj) setMacros(null)
  }, [showAdj])

  useEffect(() => { if (db && journey?.client_id) loadAll() }, [db, journey?.client_id, weekNumber])
  const loadAll = async () => { const cid = journey.client_id, js = new Date(jStart), we = new Date(js); we.setDate(we.getDate() + weekNumber * 7); await Promise.all([loadWeigh(cid), loadWorkout(cid), loadMeal(cid), loadPhoto(cid, js, we)]) }

  const loadWeigh = async (cid) => { try { const { data } = await db.supabase.from('weight_challenge_logs').select('client_id, date, weight').eq('client_id', cid).order('date', { ascending: false }).limit(200); const logs = data?.length ? data : (weightHistory || []); const ws = new Date(jStart); ws.setDate(ws.getDate() + (weekNumber - 1) * 7); const we = new Date(ws); we.setDate(we.getDate() + 7); const tw = logs.filter(w => { const d = new Date(w.date || w.created_at); return d >= ws && d < we }); const dw = new Set(tw.map(w => (w.date || w.created_at || '').slice(0, 10))).size; const last = logs.length ? logs[0] : null; const ww = []; for (let w = 1; w <= weekNumber; w++) { const { start, end } = wkRange(jStart, w); ww.push({ week: w, count: new Set(logs.filter(x => { const d = new Date(x.date || x.created_at); return d >= start && d <= end }).map(x => (x.date || x.created_at || '').slice(0, 10))).size }) }; setWeighData({ daysWeighed: dw, totalDays: 7, lastDate: last?.date || last?.created_at, weeklyWeighs: ww, allLogs: logs }) } catch (e) { console.error('Weigh:', e) } }

  const loadWorkout = async (cid) => { try { const target = plan.training_days || plan.workouts_per_week || 4; const ninetyAgo = new Date(); ninetyAgo.setDate(ninetyAgo.getDate() - 90); const { data: sess, error } = await db.supabase.from('workout_sessions').select('id, client_id, workout_date, day_name, is_completed, exercises_completed, completed_at').eq('client_id', cid).gte('workout_date', ninetyAgo.toISOString().split('T')[0]).order('workout_date', { ascending: false }); if (error) console.error('Workout query error:', error); let ww = [], comp = 0; if (sess?.length && jStart) { for (let w = 1; w <= weekNumber; w++) { const { start, end } = wkRange(jStart, w); const cnt = sess.filter(s => s.is_completed && new Date(s.workout_date) >= start && new Date(s.workout_date) <= end).length; ww.push({ week: w, count: cnt }); if (w === weekNumber) comp = cnt } } else if (sess?.length) { const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7); comp = sess.filter(s => s.is_completed && new Date(s.workout_date) >= sevenAgo).length }; setWorkoutData({ completed: comp, target, weeklyWorkouts: ww, allSessions: sess || [] }) } catch (e) { console.error('Workout:', e) } }

  const loadMeal = async (cid) => { try { const ago30 = new Date(); ago30.setDate(ago30.getDate() - 30); const { data: meals, error } = await db.supabase.from('consumed_meals').select('client_id, consumed_at, calories, protein, carbs, fat, meal_type, meal_name').eq('client_id', cid).gte('consumed_at', ago30.toISOString()).order('consumed_at', { ascending: true }); if (error) console.error('Meal query error:', error); const all = meals || [], byDay = {}; all.forEach(m => { const d = (m.consumed_at || '').split('T')[0]; if (!byDay[d]) byDay[d] = { cal: 0, p: 0, c: 0, f: 0, n: 0, meals: [] }; byDay[d].cal += m.calories || 0; byDay[d].p += parseFloat(m.protein) || 0; byDay[d].c += parseFloat(m.carbs) || 0; byDay[d].f += parseFloat(m.fat) || 0; byDay[d].n++; byDay[d].meals.push(m) }); const days = Object.keys(byDay), isLog = days.length >= 3; const ago7 = new Date(); ago7.setDate(ago7.getDate() - 7); const twD = days.filter(d => new Date(d) >= ago7); const twAvg = twD.length > 0 ? Math.round(twD.reduce((s, d) => s + byDay[d].cal, 0) / twD.length) : null; let trend = null; if (!isLog) { let logs = []; try { const { data } = await db.supabase.from('weight_challenge_logs').select('date, weight').eq('client_id', cid).order('date', { ascending: false }).limit(60); if (data?.length) logs = data } catch (e) {}; if (logs.length && jStart) { const js = new Date(jStart), ce = new Date(js), pe = new Date(js); ce.setDate(ce.getDate() + weekNumber * 7); pe.setDate(pe.getDate() + (weekNumber - 1) * 7); const ca = r7avg(logs, ce), pa = r7avg(logs, pe); if (ca && pa) { const ch = Math.round((ca - pa) * 10) / 10, el = isCut ? -(lWk) : lWk * 0.4; trend = Math.abs(ch - el) <= 0.3 ? 'on_track' : (isCut && ch > 0) ? 'off_track' : 'on_track' } } }; setMealData({ isLogger: isLog, daysLogged: isLog ? twD.length : days.length, totalDays: 7, avgKcal: isLog ? twAvg : null, targetKcal: curKcal, trendFollowsPlan: trend, byDay, allMeals: all }) } catch (e) { console.error('Meal:', e) } }

  const loadPhoto = async (cid, js, we) => { try { const { data: all } = await db.supabase.from('ch8_progress_photos').select('id, client_id, photo_url, photo_date, photo_type, metadata').eq('client_id', cid).order('photo_date', { ascending: false }); const pa = all || []; if (!pa.length) { setPhotoData({ lastDate: null, count: 0, isDue: weekNumber % 2 === 0, isOverdue: false, hasRecentPhoto: false, daysSinceLast: 999, allPhotos: [] }); return }; const ld = pa[0]?.photo_date, dsl = ld ? Math.floor((Date.now() - new Date(ld).getTime()) / 86400000) : 999; const isDue = weekNumber % 2 === 0; setPhotoData({ lastDate: ld, count: pa.length, isDue, isOverdue: isDue && dsl > 16, hasRecentPhoto: dsl <= 16, daysSinceLast: dsl, allPhotos: pa }); const sp = pa.filter(p => Math.abs(new Date(p.photo_date) - js) / 86400000 <= 14); const cp = pa.filter(p => Math.abs(new Date(p.photo_date) - we) / 86400000 <= 14).sort((a, b) => Math.abs(new Date(a.photo_date) - we) - Math.abs(new Date(b.photo_date) - we)); const grp = (arr) => { const g = {}; arr.forEach(p => { const t = (p.photo_type || p.metadata?.pose || 'front').toLowerCase(); if (!g[t]) g[t] = p }); return g }; setPhotos({ start: grp(sp), current: grp(cp) }) } catch (e) { console.error('Photo:', e) } }

  const toggleExpand = async (section) => {
    if (expanded === section) { setExpanded(null); return }
    setExpanded(section)
    const cid = journey.client_id
    if (section === 'training' && !workoutDetail && workoutData?.allSessions?.length) {
      const recentIds = workoutData.allSessions.filter(s => s.is_completed).slice(0, 10).map(s => s.id)
      if (recentIds.length) {
        try {
          const { data: progress } = await db.supabase.from('workout_progress').select('session_id, exercise_name, sets').in('session_id', recentIds)
          const bySession = {}
          progress?.forEach(p => { if (!bySession[p.session_id]) bySession[p.session_id] = []; bySession[p.session_id].push(p) })
          setWorkoutDetail(bySession)
        } catch (e) { console.error('Workout detail:', e) }
      }
    }
  }

  // ── SAVE ──
  const handleSave = async () => {
    if (saving || !macros) return
    setSaving(true)
    console.log('💾 [EvalModal] handleSave START — macros:', macros)
    try {
      const nd = aD || defLvl, nc = aC !== null ? aC : curCardio
      const adj = {
        week: weekNumber,
        date: new Date().toISOString(),
        deficit_level: nd,
        cardio_sessions: nc,
        target_calories: macros.kcal,
        macros: { protein: macros.protein, carbs: macros.carbs, fat: macros.fat },
        reason: aR || 'Evaluatie bijsturing',
        previous: { deficit_level: defLvl, cardio_sessions: curCardio, target_calories: curKcal, macros: { protein: initProtein, carbs: initCarbs, fat: initFat } }
      }
      const up = {
        ...plan, deficit_level: nd, cardio_sessions: nc,
        target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat,
        adjustments: [...adjs, adj]
      }
      const { error: journeyError } = await db.supabase.from('client_journeys').update({ coaching_plan: up }).eq('id', journey.id)
      if (journeyError) console.error('❌ [EvalModal] journey update error:', journeyError)
      else console.log('✅ [EvalModal] client_journeys updated')

      const { error: clientError } = await db.supabase.from('clients').update({ target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat, manual_macro_targets: true }).eq('id', journey.client_id)
      if (clientError) console.error('❌ [EvalModal] clients update error:', clientError)
      else console.log('✅ [EvalModal] clients updated — new targets:', { kcal: macros.kcal, protein: macros.protein, carbs: macros.carbs, fat: macros.fat })

      const { data: verify, error: verifyError } = await db.supabase.from('clients').select('target_calories, target_protein, target_carbs, target_fat').eq('id', journey.client_id).single()
      console.log('🔎 [EvalModal] DB verify na save:', verify, verifyError ? '❌ ' + verifyError.message : '')

      // Direct UI updaten — geen refresh nodig
      setClientTargets({ target_calories: macros.kcal, target_protein: macros.protein, target_carbs: macros.carbs, target_fat: macros.fat })
      console.log('✅ [EvalModal] clientTargets state updated')
      setSaved(true)
      setTimeout(() => { setSaved(false); setShowAdj(false); setAD(null); setAC(null); setAR(''); setMacros(null); onDataRefresh?.() }, 1200)
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const hasChg = macros && (
    macros.kcal !== curKcal || macros.protein !== initProtein ||
    macros.fat !== initFat || (aD && aD !== defLvl) || (aC !== null && aC !== curCardio)
  )

  const chart = useMemo(() => { const w = isMobile ? 340 : 420, h = isMobile ? 130 : 155, pad = { top: 15, right: 25, bottom: 22, left: 32 }, cw = w - pad.left - pad.right, ch = h - pad.top - pad.bottom; const all = wData.flatMap(d => [d.expected, d.actual].filter(Boolean)); if (!all.length) return null; const mn = Math.min(...all) - 1, mx = Math.max(...all) + 1, rng = mx - mn || 1; const xS = wk => pad.left + (wk / Math.max(weekNumber, 1)) * cw, yS = v => pad.top + (1 - (v - mn) / rng) * ch; const expL = `M${wData.map(d => `${xS(d.week)},${yS(d.expected)}`).join(' L')}`; const actD = wData.filter(d => d.actual !== null), actL = actD.length > 1 ? `M${actD.map(d => `${xS(d.week)},${yS(d.actual)}`).join(' L')}` : null; const ticks = []; const step = rng > 8 ? 2 : 1; for (let v = Math.ceil(mn); v <= Math.floor(mx); v += step) ticks.push(v); return { w, h, pad, expL, actL, actD, goalY: yS(goalW), ticks, xS, yS, adjM: adjs.map(a => ({ x: xS(a.week) })) } }, [wData, weekNumber, goalW, adjs, isMobile])

  // ════════ RENDER ════════
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
      <div onClick={e => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: isMobile ? '100%' : '1200px', width: '100%', margin: '0 auto', background: C.bg, overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1.25rem', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, ${C.gold} 0%, ${C.darkGold} 50%, ${C.gold} 100%)`, opacity: 0.6 }} />
          <Activity size={16} color={C.gold} /><h2 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: 800, color: C.gold, letterSpacing: '-0.02em' }}>Week {weekNumber}</h2><span style={{ fontSize: '0.55rem', color: C.text25 }}>EVALUATIE</span><div style={{ flex: 1 }} />
          {onTr !== null && <div style={{ padding: '0.2rem 0.5rem', borderRadius: '3px', background: onTr ? `${C.green}18` : `${C.red}18`, border: `1px solid ${onTr ? C.green : C.red}40`, fontSize: '0.55rem', fontWeight: 700, color: onTr ? C.green : C.red, textTransform: 'uppercase' }}>{onTr ? 'Op schema' : `${diff > 0 ? '+' : ''}${diff?.toFixed(1)}kg af`}</div>}
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'transparent', border: `1px solid ${C.border}`, color: C.text50, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}><X size={14} /></button>
        </div>

        {/* STAT BAR */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.goldBg, flexShrink: 0 }}>
          <St l="Nu" v={latest?.actual || '—'} u="kg" c={C.text} m={isMobile} b /><St l={`Wk ${weekNumber} doel`} v={wkT?.expected || '—'} u="kg" c={C.text50} m={isMobile} b /><St l="Einddoel" v={goalW} u="kg" c={C.gold} m={isMobile} b /><St l="Deze week" v={wkCh !== null ? `${wkCh > 0 ? '+' : ''}${wkCh}` : '—'} u="kg" c={wkCh !== null ? (wkCh <= 0 ? C.green : C.red) : C.text50} m={isMobile} b /><St l="Resterend" v={wksL} u="wk" c={C.text25} m={isMobile} />
        </div>

        {/* 2-COL BODY */}
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

          {/* ═══ LEFT ═══ */}
          <div style={{ width: isMobile ? '100%' : '55%', borderRight: isMobile ? 'none' : `1px solid ${C.border}`, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {chart && <div style={{ padding: isMobile ? '0.5rem 0.25rem' : '0.625rem 0.5rem', borderBottom: `1px solid ${C.border}` }}>
              <svg viewBox={`0 0 ${chart.w} ${chart.h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {chart.ticks.map(v => <g key={v}><line x1={chart.pad.left} x2={chart.w - chart.pad.right} y1={chart.yS(v)} y2={chart.yS(v)} stroke={C.borderSub} strokeWidth={0.5} /><text x={chart.pad.left - 4} y={chart.yS(v) + 3} fill={C.text20} fontSize={8} textAnchor="end" fontWeight={700}>{v}</text></g>)}
                {wData.map(d => <text key={d.week} x={chart.xS(d.week)} y={chart.h - 4} fill={C.text15} fontSize={7} textAnchor="middle" fontWeight={600}>W{d.week}</text>)}
                <line x1={chart.pad.left} x2={chart.w - chart.pad.right} y1={chart.goalY} y2={chart.goalY} stroke={C.gold} strokeWidth={0.5} strokeDasharray="4,4" opacity={0.3} /><text x={chart.w - chart.pad.right + 2} y={chart.goalY + 3} fill={C.gold} fontSize={7} opacity={0.4} fontWeight={700}>DOEL</text>
                <path d={chart.expL} fill="none" stroke={C.text25} strokeWidth={1.5} strokeDasharray="4,3" />{chart.actL && <path d={chart.actL} fill="none" stroke={C.green} strokeWidth={2} />}
                {chart.actD.map(d => <circle key={d.week} cx={chart.xS(d.week)} cy={chart.yS(d.actual)} r={3} fill={C.green} />)}
                {wData.map(d => <circle key={`e${d.week}`} cx={chart.xS(d.week)} cy={chart.yS(d.expected)} r={2} fill="none" stroke={C.text25} strokeWidth={1} />)}
                {chart.adjM.map((m, i) => <g key={i}><line x1={m.x} x2={m.x} y1={chart.pad.top} y2={chart.h - chart.pad.bottom} stroke={C.amber} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.4} /><circle cx={m.x} cy={chart.pad.top - 4} r={3} fill={C.amber} opacity={0.6} /></g>)}
                <line x1={chart.xS(weekNumber)} x2={chart.xS(weekNumber)} y1={chart.pad.top} y2={chart.h - chart.pad.bottom} stroke={C.gold} strokeWidth={1} opacity={0.3} />
              </svg>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.2rem' }}><Lg c={C.green} l="Werkelijk" /><Lg c={C.text25} l={`Wk ${weekNumber} doel`} d />{adjs.length > 0 && <Lg c={C.amber} l="Bijgesteld" d />}</div>
            </div>}
            <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
              <St l="Kcal/dag" v={curKcal} c={C.gold} m={isMobile} b />
              <St l="Eiwit" v={`${initProtein}g`} c={C.text} m={isMobile} b />
              <St l="Koolh" v={`${initCarbs}g`} c={C.text} m={isMobile} b />
              <St l="Vet" v={`${initFat}g`} c={C.text} m={isMobile} b />
              <St l="Cardio" v={curCardio} u="x/wk" c={C.text50} m={isMobile} />
            </div>

            {/* ── PLAN BIJSTUREN ── */}
            <button onClick={() => setShowAdj(!showAdj)} style={{ width: '100%', padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', background: showAdj ? C.goldBg10 : 'transparent', border: 'none', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', color: C.gold, transition: 'all 0.2s ease' }}>
              <Sliders size={13} color={C.gold} />
              <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700 }}>Plan bijsturen</span>
              <div style={{ flex: 1 }} />
              {showAdj ? <ChevronUp size={14} color={C.text50} /> : <ChevronDown size={14} color={C.text50} />}
            </button>

            {showAdj && (
              <div style={{ borderBottom: `1px solid ${C.border}`, background: C.goldBg }}>
                {/* Macro Editor */}
                {macros && (
                  <MacroEditor
                    targetKcal={macros.kcal}
                    initProtein={macros.protein}
                    initCarbs={macros.carbs}
                    initFat={macros.fat}
                    isMobile={isMobile}
                    onChange={setMacros}
                  />
                )}

                {/* Deficit Level */}
                <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
                  <SL>Deficit Level</SL>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {DEFOPTS.map(o => {
                      const act = (aD || defLvl) === o.id, nw = aD === o.id && aD !== defLvl
                      return (
                        <button key={o.id} onClick={() => setAD(o.id === defLvl ? null : o.id)} style={{ flex: 1, padding: '0.35rem 0.25rem', background: act ? `${C.gold}18` : 'transparent', border: `1px solid ${act ? `${C.gold}40` : C.border}`, borderRadius: '6px', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', position: 'relative', minHeight: '36px', transition: 'all 0.2s ease' }}>
                          <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: act ? C.gold : C.text50 }}>{o.label}</div>
                          <div style={{ fontSize: '0.4rem', color: C.text25, marginTop: '0.1rem' }}>{o.desc}</div>
                          {nw && <Bd>NIEUW</Bd>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Cardio */}
                <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                    <SL s={{ marginBottom: 0 }}>Cardio/week</SL>
                    {aC !== null && aC !== curCardio && <span style={{ fontSize: '0.35rem', color: C.amber }}>was {curCardio}x</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[0, 1, 2, 3, 4, 5].map(n => {
                      const act = (aC !== null ? aC : curCardio) === n
                      return (
                        <button key={n} onClick={() => setAC(n === curCardio ? null : n)} style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '32px' : '36px', borderRadius: '6px', background: act ? `${C.gold}18` : 'transparent', border: `1px solid ${act ? `${C.gold}40` : C.border}`, color: act ? C.gold : C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', transition: 'all 0.2s ease' }}>{n}</button>
                      )
                    })}
                  </div>
                </div>

                {/* Reden */}
                <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: `1px solid ${C.borderSub}` }}>
                  <SL>Reden</SL>
                  <textarea placeholder="Waarom bijsturen?" value={aR} onChange={e => setAR(e.target.value)} rows={2} style={{ width: '100%', padding: '0.35rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '6px', color: C.text, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, outline: 'none', resize: 'none', lineHeight: 1.4 }} />
                </div>

                {/* Save */}
                <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem' }}>
                  <button onClick={handleSave} disabled={!hasChg || saving} style={{ width: '100%', padding: '0.5rem', background: saved ? C.green : hasChg ? `linear-gradient(135deg, ${C.gold} 0%, ${C.darkGold} 100%)` : 'rgba(255,255,255,0.03)', border: 'none', borderRadius: '6px', color: saved || hasChg ? '#000' : C.text25, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 800, cursor: hasChg ? 'pointer' : 'default', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                    {saved ? <><Check size={14} /> OPGESLAGEN</> : saving ? 'Opslaan...' : hasChg ? <><Save size={13} /> OPSLAAN</> : 'WIJZIG IETS'}
                  </button>
                </div>
              </div>
            )}

            {/* Aanpassingen history */}
            {adjs.length > 0 && (
              <>
                <button onClick={() => setShowHist(!showHist)} style={{ width: '100%', padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', background: 'transparent', border: 'none', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
                  <AlertTriangle size={11} color={C.amber} />
                  <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.text50 }}>Aanpassingen ({adjs.length})</span>
                  <div style={{ flex: 1 }} />
                  {showHist ? <ChevronUp size={12} color={C.text25} /> : <ChevronDown size={12} color={C.text25} />}
                </button>
                {showHist && (
                  <div style={{ borderBottom: `1px solid ${C.border}` }}>
                    {[...adjs].reverse().map((a, i) => (
                      <div key={i} style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem', borderBottom: i < adjs.length - 1 ? `1px solid ${C.borderItem}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: C.amber }}>Wk {a.week}</span>
                          <span style={{ fontSize: '0.4rem', color: C.text15 }}>{new Date(a.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</span>
                          <div style={{ flex: 1 }} />
                          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: C.text50 }}>{a.target_calories} kcal</span>
                        </div>
                        <div style={{ fontSize: '0.5rem', color: C.text25, marginTop: '0.1rem' }}>
                          {a.previous?.deficit_level}→{a.deficit_level}
                          {a.macros && <span> · E{a.macros.protein}g K{a.macros.carbs}g V{a.macros.fat}g</span>}
                          {a.previous?.cardio_sessions !== a.cardio_sessions && <span> · Cardio {a.previous?.cardio_sessions}→{a.cardio_sessions}x</span>}
                        </div>
                        {a.reason && <div style={{ fontSize: '0.5rem', color: C.text15, fontStyle: 'italic', marginTop: '0.05rem' }}>{a.reason}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══ RIGHT: Expandable Compliance ═══ */}
          <div style={{ width: isMobile ? '100%' : '45%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', borderTop: isMobile ? `1px solid ${C.border}` : 'none' }}>

            {/* ── WEGING ── */}
            <CC img={STOCK.scale} icon={<Scale size={12} />} label="Weging" ac={C.gold} m={isMobile} exp={expanded === 'weging'} onToggle={() => toggleExpand('weging')}>
              {weighData ? <><div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.3rem' }}><span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{weighData.daysWeighed}</span><span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>/ {weighData.totalDays} dagen</span><span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>deze week</span></div>
                {weighData.lastDate && <div style={{ fontSize: '0.5rem', color: C.text25, marginBottom: '0.3rem' }}>Laatst: {dAgo(weighData.lastDate)}</div>}
                {weighData.weeklyWeighs?.length > 1 && <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '28px' }}>{weighData.weeklyWeighs.map((w, i) => <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><div style={{ width: '100%', height: `${Math.max(4, (w.count / 7) * 24)}px`, background: w.count >= 5 ? C.green : w.count >= 3 ? C.amber : C.red, borderRadius: '2px', opacity: i === weighData.weeklyWeighs.length - 1 ? 1 : 0.5 }} /><span style={{ fontSize: '0.3rem', color: C.text15 }}>{w.week}</span></div>)}</div>}
              </> : <Ld />}
            </CC>
            {expanded === 'weging' && weighData?.allLogs && (
              <div style={{ borderBottom: `1px solid ${C.border}`, maxHeight: '250px', overflowY: 'auto' }}>
                {weighData.allLogs.slice(0, 30).map((l, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.3rem 0.75rem', borderBottom: `1px solid ${C.borderItem}` }}>
                    <span style={{ fontSize: '0.55rem', color: C.text50 }}>{fmtDate(l.date)}</span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.text }}>{l.weight}<span style={{ fontSize: '0.35rem', opacity: 0.4, marginLeft: '0.05rem' }}>kg</span></span>
                  </div>
                ))}
              </div>
            )}

            {/* ── TRAINING ── */}
            <CC img={STOCK.workout} icon={<Dumbbell size={12} />} label="Training" ac={C.orange} m={isMobile} exp={expanded === 'training'} onToggle={() => toggleExpand('training')}>
              {workoutData ? <><div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.3rem' }}><span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{workoutData.completed}</span><span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>/ {workoutData.target} sessies</span><span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>deze week</span></div>
                {workoutData.weeklyWorkouts?.length > 1 && <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '28px' }}>{workoutData.weeklyWorkouts.map((w, i) => <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}><div style={{ width: '100%', height: `${Math.max(4, (w.count / workoutData.target) * 24)}px`, background: w.count >= workoutData.target ? C.green : w.count >= workoutData.target * 0.5 ? C.amber : C.red, borderRadius: '2px', opacity: i === workoutData.weeklyWorkouts.length - 1 ? 1 : 0.5 }} /><span style={{ fontSize: '0.3rem', color: C.text15 }}>{w.week}</span></div>)}</div>}
              </> : <Ld />}
            </CC>
            {expanded === 'training' && workoutData?.allSessions && (
              <div style={{ borderBottom: `1px solid ${C.border}`, maxHeight: '300px', overflowY: 'auto' }}>
                {workoutData.allSessions.filter(s => s.is_completed).slice(0, 10).map((s, i) => (
                  <div key={i} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0.75rem', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <div><span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.text }}>{s.day_name || 'Workout'}</span><span style={{ fontSize: '0.4rem', color: C.text25, marginLeft: '0.3rem' }}>{fmtDate(s.workout_date)}</span></div>
                      <span style={{ fontSize: '0.4rem', color: C.green, fontWeight: 700 }}>{s.exercises_completed || '?'} oef.</span>
                    </div>
                    {workoutDetail?.[s.id] && (
                      <div style={{ padding: '0 0.75rem 0.3rem' }}>
                        {workoutDetail[s.id].map((ex, j) => (
                          <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.15rem 0', borderBottom: `1px solid ${C.borderItem}` }}>
                            <span style={{ fontSize: '0.45rem', color: C.text50 }}>{ex.exercise_name}</span>
                            <span style={{ fontSize: '0.45rem', color: C.text25 }}>{ex.sets?.filter(s => s.completed !== false).map(s => `${s.weight || 0}kg×${s.reps || 0}`).join(' · ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── VOEDING ── */}
            <CC img={STOCK.meal} icon={<Utensils size={12} />} label="Voeding" ac={C.green} m={isMobile} exp={expanded === 'voeding'} onToggle={() => toggleExpand('voeding')}>
              {mealData ? <>{mealData.isLogger ? <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '0.3rem' }}><span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{mealData.daysLogged}</span><span style={{ fontSize: '0.6rem', fontWeight: 600, color: C.text50 }}>/ {mealData.totalDays} dagen</span><span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>gelogd</span></div>
                {mealData.avgKcal && <><div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}><Flame size={11} color={C.orange} /><span style={{ fontSize: '0.65rem', fontWeight: 800, color: C.text }}>{mealData.avgKcal}</span><span style={{ fontSize: '0.4rem', color: C.text25 }}>kcal/dag</span></div>
                  <div style={{ height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', position: 'relative', overflow: 'hidden', border: `1px solid ${C.borderSub}` }}><div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(120, (mealData.avgKcal / mealData.targetKcal) * 100)}%`, background: Math.abs(mealData.avgKcal - mealData.targetKcal) <= mealData.targetKcal * 0.05 ? C.green : C.amber, borderRadius: '3px' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.1rem' }}><span style={{ fontSize: '0.35rem', color: Math.abs(mealData.avgKcal - mealData.targetKcal) <= mealData.targetKcal * 0.05 ? C.green : C.amber, fontWeight: 700 }}>{mealData.avgKcal > mealData.targetKcal ? '+' : ''}{mealData.avgKcal - mealData.targetKcal} vs doel</span><span style={{ fontSize: '0.35rem', color: C.gold, fontWeight: 700 }}>doel: {mealData.targetKcal}</span></div></>}
                <div style={{ fontSize: '0.35rem', color: C.text15, marginTop: '0.15rem', padding: '0.15rem 0.3rem', background: `${C.green}08`, borderRadius: '3px', display: 'inline-block' }}>Logt actief voeding</div>
              </> : <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: mealData.trendFollowsPlan === 'on_track' ? `${C.green}15` : mealData.trendFollowsPlan === 'off_track' ? `${C.red}15` : C.text08, border: `2px solid ${mealData.trendFollowsPlan === 'on_track' ? C.green : mealData.trendFollowsPlan === 'off_track' ? C.red : C.text25}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mealData.trendFollowsPlan === 'on_track' ? <Check size={14} color={C.green} /> : mealData.trendFollowsPlan === 'off_track' ? <X size={14} color={C.red} /> : <span style={{ fontSize: '0.5rem', color: C.text25 }}>?</span>}
                  </div>
                  <div><div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800, color: mealData.trendFollowsPlan === 'on_track' ? C.green : mealData.trendFollowsPlan === 'off_track' ? C.red : C.text50 }}>{mealData.trendFollowsPlan === 'on_track' ? 'Gewicht volgt plan' : mealData.trendFollowsPlan === 'off_track' ? 'Gewicht wijkt af' : 'Nog geen data'}</div><div style={{ fontSize: '0.4rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Gebaseerd op gewichtstrend</div></div>
                </div>
                {wkCh !== null && <div style={{ fontSize: '0.5rem', color: C.text25 }}>{wkCh > 0 ? '+' : ''}{wkCh} kg · doel: {isCut ? `-${lWk}` : `+${(lWk * 0.4).toFixed(1)}`} kg/wk</div>}
                <div style={{ fontSize: '0.35rem', color: C.text15, marginTop: '0.15rem', padding: '0.15rem 0.3rem', background: C.text08, borderRadius: '3px', display: 'inline-block' }}>Compliance via gewichtstrend</div>
              </>}</> : <Ld />}
            </CC>
            {expanded === 'voeding' && mealData?.byDay && (
              <div style={{ borderBottom: `1px solid ${C.border}`, maxHeight: '300px', overflowY: 'auto' }}>
                {Object.entries(mealData.byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([day, d], i) => (
                  <div key={i} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.75rem', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <span style={{ fontSize: '0.55rem', fontWeight: 700, color: C.text }}>{fmtDate(day)}</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.5rem', fontWeight: 800, color: C.gold }}>{Math.round(d.cal)}<span style={{ fontSize: '0.3rem', opacity: 0.4 }}> kcal</span></span>
                        <span style={{ fontSize: '0.4rem', color: C.text25 }}>{Math.round(d.p)}E · {Math.round(d.c)}K · {Math.round(d.f)}V</span>
                      </div>
                    </div>
                    <div style={{ padding: '0 0.75rem 0.25rem' }}>
                      {d.meals.map((m, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0', borderBottom: `1px solid ${C.borderItem}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.35rem', color: C.text15 }}>{fmtTime(m.consumed_at)}</span>
                            <span style={{ fontSize: '0.45rem', color: C.text50 }}>{m.meal_name || m.meal_type || 'Maaltijd'}</span>
                          </div>
                          <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25 }}>{m.calories || 0} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── FOTO'S ── */}
            <CC img={STOCK.photo} icon={<Camera size={12} />} label="Foto's" ac={C.purple} m={isMobile} exp={expanded === 'fotos'} onToggle={() => toggleExpand('fotos')}>
              {photoData ? <><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}><span style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: 800, color: C.text, lineHeight: 1 }}>{photoData.count}</span><span style={{ fontSize: '0.5rem', fontWeight: 600, color: C.text50 }}>totaal</span></div>
                <div style={{ flex: 1 }} />
                {photoData.isDue && <div style={{ padding: '0.15rem 0.35rem', borderRadius: '3px', background: photoData.hasRecentPhoto ? `${C.green}15` : `${C.red}15`, border: `1px solid ${photoData.hasRecentPhoto ? C.green : C.red}30`, fontSize: '0.4rem', fontWeight: 700, color: photoData.hasRecentPhoto ? C.green : C.red, textTransform: 'uppercase' }}>{photoData.hasRecentPhoto ? 'Ontvangen' : 'Overdue'}</div>}
              </div>
                {photoData.lastDate && <div style={{ fontSize: '0.5rem', color: C.text25 }}>Laatst: {dAgo(photoData.lastDate)}</div>}
                <div style={{ fontSize: '0.4rem', color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.1rem' }}>Elke 2 weken</div>
              </> : <Ld />}
            </CC>
            {expanded === 'fotos' && photoData?.allPhotos && (
              <div style={{ borderBottom: `1px solid ${C.border}`, maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '2px' }}>
                  {photoData.allPhotos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${p.photo_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.2rem 0.3rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
                        <div style={{ fontSize: '0.3rem', color: C.text50 }}>{fmtDate(p.photo_date)}</div>
                        <div style={{ fontSize: '0.3rem', color: C.purple, textTransform: 'uppercase' }}>{p.photo_type || 'progress'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {((photos.start && Object.keys(photos.start).length > 0) || (photos.current && Object.keys(photos.current).length > 0)) ? <>
                  <div style={{ padding: '0.4rem 0.75rem', borderTop: `1px solid ${C.borderSub}`, borderBottom: `1px solid ${C.borderSub}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start vs Week {weekNumber}</span><div style={{ flex: 1 }} />
                    <div style={{ display: 'flex', gap: '0.2rem' }}>{['front', 'side', 'back'].map(t => { const has = photos.start?.[t] || photos.current?.[t]; return <button key={t} onClick={() => setSelType(t)} disabled={!has} style={{ padding: '0.15rem 0.35rem', borderRadius: '3px', border: selType === t ? `1px solid ${C.purple}40` : `1px solid ${has ? C.border : 'transparent'}`, background: selType === t ? `${C.purple}15` : 'transparent', color: selType === t ? C.purple : has ? C.text50 : C.text15, fontSize: '0.45rem', fontWeight: 600, cursor: has ? 'pointer' : 'default', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textTransform: 'capitalize', minHeight: '24px' }}>{t}</button> })}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: C.borderSub }}>
                    <PS l="Start" p={photos.start?.[selType]} w={startW} wc={C.text} m={isMobile} />
                    <PS l={`Wk ${weekNumber}`} p={photos.current?.[selType]} w={latest?.actual} wc={C.green} df={latest?.actual && startW ? latest.actual - startW : null} m={isMobile} />
                  </div>
                </> : null}
              </div>
            )}

            <div style={{ height: '2rem' }} />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ═══ SUBS ═══
function St({ l, v, u, c, m, b }) { return <div style={{ flex: 1, textAlign: 'center', padding: m ? '0.375rem 0.125rem' : '0.5rem 0.25rem', borderRight: b ? `1px solid ${C.borderSub}` : 'none' }}><div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{l}</div><div style={{ fontSize: m ? '0.75rem' : '0.85rem', fontWeight: 800, color: c || C.text, lineHeight: 1 }}>{v}{u && <span style={{ fontSize: '0.4rem', fontWeight: 500, opacity: 0.4, marginLeft: '0.05rem' }}>{u}</span>}</div></div> }

function CC({ img, icon, label, ac, children, m, exp, onToggle }) { return <div style={{ borderBottom: `1px solid ${C.border}`, background: C.bg, overflow: 'hidden', transform: 'translateZ(0)' }}>
  <div style={{ height: m ? '60px' : '75px', position: 'relative', overflow: 'hidden', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }} onClick={onToggle}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.35)' }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.4) 50%, transparent 100%)' }} />
    <div style={{ position: 'absolute', top: '0.35rem', left: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.5)', padding: '0.15rem 0.4rem', borderRadius: '3px' }}><span style={{ color: ac }}>{icon}</span><span style={{ fontSize: '0.45rem', fontWeight: 700, color: ac, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span></div>
    <div style={{ position: 'absolute', bottom: '0.35rem', right: '0.5rem' }}>{exp ? <ChevronUp size={14} color={C.text25} /> : <ChevronDown size={14} color={C.text25} />}</div>
  </div>
  <div style={{ padding: m ? '0.5rem 0.625rem 0.625rem' : '0.625rem 0.75rem 0.75rem' }}>{children}</div>
</div> }

function PS({ l, p, w, wc, df, m }) { return <div style={{ background: C.bg, position: 'relative' }}><div style={{ position: 'absolute', top: '0.3rem', left: '0.3rem', zIndex: 2, fontSize: '0.35rem', fontWeight: 700, color: l === 'Start' ? C.text25 : C.gold, textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.6)', padding: '0.15rem 0.35rem', borderRadius: '2px' }}>{l}</div>{p ? <div style={{ width: '100%', aspectRatio: '3/4', backgroundImage: `url(${p.photo_url || p.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /> : <div style={{ width: '100%', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}><span style={{ fontSize: '0.5rem', color: C.text15 }}>Geen foto</span></div>}{w && <div style={{ position: 'absolute', bottom: '0.3rem', left: '0.3rem', fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 800, color: wc || C.text, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{w}<span style={{ fontSize: '0.35rem', opacity: 0.5, marginLeft: '0.05rem' }}>kg</span></div>}{df !== null && df !== undefined && <div style={{ position: 'absolute', bottom: '0.3rem', right: '0.3rem', fontSize: '0.45rem', fontWeight: 800, color: df <= 0 ? C.green : C.red, background: 'rgba(0,0,0,0.7)', padding: '0.15rem 0.3rem', borderRadius: '3px' }}>{df <= 0 ? '' : '+'}{df.toFixed(1)}kg</div>}</div> }

function Lg({ c, l, d }) { return <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: '12px', height: '2px', ...(d ? { borderTop: `1px dashed ${c}`, background: 'none', opacity: 0.6 } : { background: c }) }} /><span style={{ fontSize: '0.4rem', color: C.text25, fontWeight: 600 }}>{l}</span></div> }
function SL({ children, s }) { return <div style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text20, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem', ...s }}>{children}</div> }
function Bd({ children }) { return <div style={{ position: 'absolute', top: '-4px', right: '-4px', fontSize: '0.35rem', fontWeight: 800, color: C.bg, background: C.gold, padding: '0.1rem 0.25rem', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</div> }
function Ld() { return <div style={{ fontSize: '0.5rem', color: C.text25 }}>Laden...</div> }
