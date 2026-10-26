// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanLibraryModal.jsx
// Opslaan + laden van volledige 7-daagse plannen ("full_week") in de coach-brede
// meal_plan_templates tabel (plan_type='full_week'), zodat een coach een plan met
// naam bewaart en later voor een andere client kan hergebruiken.

import React, { useState, useEffect } from 'react'
import { createPortal } from '../../../../client/paginaPortal'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Bookmark, Trash2, Download, Check, Search } from 'lucide-react'
import { Placeholder, Meta, PrimairKnop, SecundairKnop, IconKnop } from './PlanSwitcherModal'
import { supplementenVoorSjabloon, extrasSamenvatting } from './sjabloonExtras'

export default function PlanLibraryModal({
  db, coachId, weekData, planMeta, clientName = '',
  // Gaan mee in het sjabloon: de plan-brede pre-workout maaltijd en de
  // supplementen van de klant (met trainingsdagen als regel, niet letterlijk).
  preWorkoutMeal = null, supplementen = [], trainingDayKeys = [],
  // Targets van de klant: voor "dichtst bij doel" en het verschil per sjabloon.
  doelKcal = 0, doelEiwit = 0,
  onLoad, onClose, isMobile, embedded = false,
}) {
  const modalHost = useModalHost()
  const m = isMobile
  // Standaard de titel zoals hij nu bovenaan staat: wie net de titel aanpast
  // en op opslaan drukt, wil het sjabloon onder die naam.
  const [name, setName] = useState(() =>
    planMeta?.name || (clientName ? `Plan ${clientName}` : ''))
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  // Filters om voor een klant het passende sjabloon te vinden.
  const [zoek, setZoek] = useState('')
  const [kcalFilter, setKcalFilter] = useState('alle')
  const [maaltijdenFilter, setMaaltijdenFilter] = useState('alle')
  const [sortering, setSortering] = useState(() => doelKcal > 0 ? 'doel' : 'nieuw')

  const loadList = async () => {
    setLoading(true)
    try {
      let q = db.supabase
        .from('meal_plan_templates')
        .select('id, name, template_name, daily_calories, daily_protein, daily_carbs, daily_fat, week_structure, meals_per_day, created_at, pre_workout_meal, supplements')
        .eq('plan_type', 'full_week')
        .order('created_at', { ascending: false })
      // Ook de plannen zonder coach tonen. Zeven van de tien full-week plannen
      // in de database hebben geen coach_id — die zijn opgeslagen via een pad
      // dat dat veld nooit invulde. Met een harde `eq` vielen ze uit de lijst
      // en leek de bibliotheek leeg terwijl het werk er wél stond.
      if (coachId) q = q.or(`coach_id.eq.${coachId},coach_id.is.null`)
      const { data, error } = await q
      if (error) throw error
      setPlans(data || [])
    } catch (e) { console.warn('PlanLibrary load failed:', e); setPlans([]) }
    setLoading(false)
  }
  useEffect(() => { loadList() }, [coachId])

  const handleSave = async () => {
    if (!name.trim()) { setError('Geef het plan een naam'); return }
    if (!weekData?.length) { setError('Er is geen plan om op te slaan'); return }
    setSaving(true); setError(''); setJustSaved(false)
    try {
      const ws = {}
      weekData.forEach(d => { ws[d.dayId] = { ...d.meals, totals: d.totals, is_training_day: d.is_training_day } })

      const dayTotals = weekData.map(d => d.totals).filter(t => t && (t.kcal || t.calories || t.protein))
      const avg = (key, alt) => dayTotals.length
        ? Math.round(dayTotals.reduce((s, t) => s + (t[key] ?? (alt ? t[alt] : 0) ?? 0), 0) / dayTotals.length)
        : 0
      const cal = avg('kcal', 'calories'), prot = avg('protein'), carb = avg('carbs'), fat = avg('fat')
      const mpd = Math.max(1, ...weekData.map(d => Object.values(d.meals || {}).filter(Boolean).length))

      const payload = {
        coach_id: coachId || null,
        name: name.trim(),
        template_name: name.trim(),
        plan_type: 'full_week',
        week_structure: ws,
        daily_calories: cal, daily_protein: prot, daily_carbs: carb, daily_fat: fat,
        base_macros: { calories: cal, protein: prot, carbs: carb, fat: fat },
        meals_per_day: mpd,
        pre_workout_meal: preWorkoutMeal || null,
        supplements: supplementenVoorSjabloon(supplementen, trainingDayKeys),
        emoji: '📅',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const { error } = await db.supabase.from('meal_plan_templates').insert([payload])
      if (error) throw error
      setJustSaved(true)
      await loadList()
      setTimeout(() => setJustSaved(false), 2500)
    } catch (e) { setError(e.message || 'Opslaan mislukt') }
    setSaving(false)
  }

  // Twee tikken, zoals in het plannenpaneel: eerst 'Zeker?', dan weg.
  const handleDelete = async (id) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return }
    setDeletingId(id)
    try {
      const { error } = await db.supabase.from('meal_plan_templates').delete().eq('id', id)
      if (error) throw error
      setPlans(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
    } catch (err) { console.warn('Delete failed:', err) }
    setDeletingId(null)
  }

  const fmtDate = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return '' }
  }

  // Filteren en sorteren. Kcal "rond doel" = binnen 150 kcal van de klant.
  const KCAL_OPTIES = [
    { id: 'alle', label: 'Alle kcal' },
    ...(doelKcal > 0 ? [{ id: 'doel', label: `Rond doel (${doelKcal} ±150)` }] : []),
    { id: '<1800', label: 'Tot 1800', test: k => k < 1800 },
    { id: '1800', label: '1800 – 2200', test: k => k >= 1800 && k < 2200 },
    { id: '2200', label: '2200 – 2600', test: k => k >= 2200 && k < 2600 },
    { id: '2600', label: '2600 – 3000', test: k => k >= 2600 && k < 3000 },
    { id: '3000', label: '3000+', test: k => k >= 3000 },
  ]
  const maaltijdOpties = [...new Set(plans.map(p => p.meals_per_day).filter(Boolean))].sort((a, b) => a - b)
  const woorden = zoek.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const zichtbaar = plans.filter(p => {
    const naam = `${p.name || ''} ${p.template_name || ''}`.toLowerCase()
    if (woorden.some(w => !naam.includes(w))) return false
    const k = Number(p.daily_calories) || 0
    if (kcalFilter === 'doel' && Math.abs(k - doelKcal) > 150) return false
    const optie = KCAL_OPTIES.find(o => o.id === kcalFilter)
    if (optie?.test && !optie.test(k)) return false
    if (maaltijdenFilter !== 'alle' && String(p.meals_per_day) !== maaltijdenFilter) return false
    return true
  }).sort((a, b) => {
    const ka = Number(a.daily_calories) || 0, kb = Number(b.daily_calories) || 0
    if (sortering === 'doel') {
      // Kcal telt, eiwit weegt mee: 10 g eiwit te weinig ≈ 40 kcal.
      const afstand = (p, k) => Math.abs(k - doelKcal) + (doelEiwit > 0 ? Math.abs((Number(p.daily_protein) || 0) - doelEiwit) * 4 : 0)
      return afstand(a, ka) - afstand(b, kb)
    }
    if (sortering === 'laag') return ka - kb
    if (sortering === 'hoog') return kb - ka
    if (sortering === 'eiwit') return (Number(b.daily_protein) || 0) - (Number(a.daily_protein) || 0)
    return String(b.created_at || '').localeCompare(String(a.created_at || ''))
  })
  const gefilterd = zoek.trim() || kcalFilter !== 'alle' || maaltijdenFilter !== 'alle'
  const verschil = (p) => {
    if (!(doelKcal > 0) || !p.daily_calories) return null
    const d = Math.round(p.daily_calories - doelKcal)
    return `${d > 0 ? '+' : d < 0 ? '−' : '±'}${Math.abs(d)} t.o.v. doel`
  }
  const keuze = {
    height: 36, minWidth: 0, padding: '0 0.5rem', borderRadius: 10,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#fff', fontSize: '0.8rem', fontWeight: 800, fontFamily: 'inherit', outline: 'none',
    colorScheme: 'dark', cursor: 'pointer',
  }

  const pad = m ? '0.75rem 1rem' : '0.85rem 1.5rem'
  const extras = extrasSamenvatting({ pre_workout_meal: preWorkoutMeal, supplements: supplementen })

  const inhoud = (
    <>
      {/* Kop, zoals het plannenpaneel. */}
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: m ? '0.75rem 1rem 0.25rem' : '1rem 1.5rem 0.25rem', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: m ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            Bewaren als sjabloon
          </div>
          <button onClick={onClose} aria-label="Sluit" style={{
            width: 36, height: 36, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Bewaren: naam, wat er meegaat, één witte knop. */}
      <div style={{ padding: pad, borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, marginBottom: 10 }}>
          Een losse kopie voor andere klanten. Dit plan blijft zoals het is.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); setJustSaved(false) }}
            onKeyDown={e => { if (e.key === 'Enter' && !saving) handleSave() }}
            placeholder="Naam van het sjabloon"
            style={{
              flex: 1, minWidth: 0, minHeight: 44, padding: '0 0.75rem',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 800,
              fontFamily: 'inherit', outline: 'none',
            }}
          />
          {justSaved ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minHeight: 44, color: '#22c55e', fontSize: '0.8rem', fontWeight: 900, flexShrink: 0 }}>
              <Check size={15} strokeWidth={3} /> Bewaard
            </span>
          ) : (
            <PrimairKnop onClick={handleSave} disabled={saving} dimmed={saving}>
              <Bookmark size={14} strokeWidth={2.6} /> {saving ? 'Bewaren…' : 'Bewaar'}
            </PrimairKnop>
          )}
        </div>
        {extras && <Meta items={[`Gaat mee: ${extras}`]} />}
        {error && <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', marginTop: 6 }}>{error}</div>}
      </div>

      {/* Bestaande weekplan-sjablonen. */}
      <div style={{ padding: m ? '0.75rem 1rem 0.35rem' : '0.85rem 1.5rem 0.35rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
        Weekplan-sjablonen{plans.length > 0 ? ` (${gefilterd ? `${zichtbaar.length} van ${plans.length}` : plans.length})` : ''}
      </div>
      {/* Zoeken + filters: één regel, dropdowns in plaats van knoppenrijen. */}
      {plans.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: m ? '0.25rem 1rem 0.6rem' : '0.25rem 1.5rem 0.7rem', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 0 }}>
            <Search size={14} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: 10, top: 11, pointerEvents: 'none' }} />
            <input value={zoek} onChange={e => setZoek(e.target.value)} placeholder="Zoek op naam"
              style={{ ...keuze, width: '100%', boxSizing: 'border-box', paddingLeft: 30, cursor: 'text' }} />
          </div>
          <select value={kcalFilter} onChange={e => setKcalFilter(e.target.value)} style={keuze} title="Kcal per dag">
            {KCAL_OPTIES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          {maaltijdOpties.length > 1 && (
            <select value={maaltijdenFilter} onChange={e => setMaaltijdenFilter(e.target.value)} style={keuze} title="Maaltijden per dag">
              <option value="alle">Alle maaltijden</option>
              {maaltijdOpties.map(n => <option key={n} value={String(n)}>{n}x per dag</option>)}
            </select>
          )}
          <select value={sortering} onChange={e => setSortering(e.target.value)} style={keuze} title="Sorteren">
            {doelKcal > 0 && <option value="doel">Dichtst bij doel</option>}
            <option value="nieuw">Nieuwste eerst</option>
            <option value="laag">Kcal laag → hoog</option>
            <option value="hoog">Kcal hoog → laag</option>
            <option value="eiwit">Meeste eiwit</option>
          </select>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && <Placeholder text="Laden…" />}
        {!loading && plans.length === 0 && <Placeholder text="Nog geen sjablonen bewaard." />}
        {!loading && plans.length > 0 && zichtbaar.length === 0 && <Placeholder text="Geen sjabloon past bij deze filters." />}
        {!loading && zichtbaar.map(p => {
          const isConfirmDel = confirmDelete === p.id
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: pad, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: m ? '0.92rem' : '0.98rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name || p.template_name || 'Naamloos plan'}
                </div>
                <Meta items={[p.daily_calories && `${p.daily_calories} kcal`, verschil(p), p.daily_protein && `${p.daily_protein}g eiwit`, p.meals_per_day && `${p.meals_per_day}x per dag`, fmtDate(p.created_at)]} />
                {extrasSamenvatting(p) && (
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 2, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {extrasSamenvatting(p)}
                  </div>
                )}
              </div>
              {onLoad && (
                <SecundairKnop onClick={() => onLoad(p.week_structure, p.name || p.template_name, { pre_workout_meal: p.pre_workout_meal || null, supplements: p.supplements || [] })}>
                  <Download size={13} strokeWidth={2.5} /> Laden
                </SecundairKnop>
              )}
              <IconKnop
                danger={isConfirmDel}
                onClick={() => handleDelete(p.id)}
                onBlur={() => setTimeout(() => setConfirmDelete(null), 200)}
                title={isConfirmDel ? 'Nogmaals om te verwijderen' : 'Verwijderen'}
              >
                {isConfirmDel
                  ? <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '0 0.3rem' }}>{deletingId === p.id ? 'Bezig…' : 'Zeker?'}</span>
                  : <Trash2 size={14} />}
              </IconKnop>
            </div>
          )
        })}
      </div>
    </>
  )

  const modal = (
    <div
      onClick={embedded ? undefined : (e) => e.target === e.currentTarget && onClose()}
      style={embedded
        ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0a0a0a' }
        : { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center', padding: m ? 0 : '1rem' }}
    >
      <div style={embedded
        ? { background: '#0a0a0a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        : { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: m ? '16px 16px 0 0' : 16, width: m ? '100%' : 520, maxHeight: m ? '85vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {inhoud}
      </div>
    </div>
  )

  if (embedded) return modal
  return createPortal(modal, modalHost)
}
