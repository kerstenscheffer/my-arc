// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanLibraryModal.jsx
// Opslaan + laden van volledige 7-daagse plannen ("full_week") in de coach-brede
// meal_plan_templates tabel (plan_type='full_week'), zodat een coach een plan met
// naam bewaart en later voor een andere client kan hergebruiken.

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Bookmark, Trash2, Download, Loader } from 'lucide-react'

export default function PlanLibraryModal({
  db, coachId, weekData, planMeta, clientName = '',
  onLoad, onClose, isMobile, embedded = false,
}) {
  const m = isMobile
  const [name, setName] = useState(() =>
    planMeta?.name ? `${planMeta.name} (kopie)` : (clientName ? `Plan ${clientName}` : ''))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const loadList = async () => {
    setLoading(true)
    try {
      let q = db.supabase
        .from('meal_plan_templates')
        .select('id, name, template_name, daily_calories, daily_protein, daily_carbs, daily_fat, week_structure, meals_per_day, created_at')
        .eq('plan_type', 'full_week')
        .order('created_at', { ascending: false })
      if (coachId) q = q.eq('coach_id', coachId)
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

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Dit opgeslagen plan definitief verwijderen?')) return
    setDeletingId(id)
    try {
      const { error } = await db.supabase.from('meal_plan_templates').delete().eq('id', id)
      if (error) throw error
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) { console.warn('Delete failed:', err) }
    setDeletingId(null)
  }

  const fmtDate = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return '' }
  }

  const modal = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderBottom: '1px solid rgba(255,215,0,0.2)', flexShrink: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FFD700', fontWeight: 800, fontSize: m ? '0.8rem' : '0.85rem' }}>
          <Bookmark size={15} /> Plannen bibliotheek
        </span>
        <button onClick={onClose} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}><X size={15} /></button>
      </div>

      {/* Opslaan */}
      <div style={{ padding: m ? '0.7rem 0.8rem' : '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,215,0,0.02)', flexShrink: 0 }}>
        <div style={{ fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
          Kopie bewaren als sjabloon
        </div>
        {/* Expliciet: dit maakt een los, herbruikbaar sjabloon. De titel van
            het plan zelf pas je aan in de titelbalk bovenaan de analyzer. */}
        <div style={{ fontSize: m ? '0.55rem' : '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginBottom: '0.4rem', lineHeight: 1.3 }}>
          Voor hergebruik bij andere clients — hernoemt dit plan niet.
        </div>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError('') }}
          placeholder="bijv. Cut 2000kcal - 4 meals"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,215,0,0.25)', borderRadius: 7, color: '#fff', fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 600, fontFamily: 'inherit', outline: 'none', marginBottom: '0.45rem' }}
        />
        {error && <div style={{ fontSize: '0.6rem', color: '#ef4444', marginBottom: '0.4rem' }}>{error}</div>}
        <button onClick={handleSave} disabled={saving} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.55rem', background: justSaved ? 'rgba(16,185,129,0.15)' : 'rgba(255,215,0,0.12)', border: `1px solid ${justSaved ? 'rgba(16,185,129,0.5)' : 'rgba(255,215,0,0.4)'}`, borderRadius: 7, color: justSaved ? '#10b981' : '#FFD700', fontSize: m ? '0.75rem' : '0.8rem', fontWeight: 800, cursor: saving ? 'default' : 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
          {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Bookmark size={14} />}
          {justSaved ? 'Sjabloon bewaard ✓' : (saving ? 'Bewaren…' : 'Bewaar als sjabloon')}
        </button>
      </div>

      {/* Opgeslagen plannen */}
      <div style={{ padding: m ? '0.5rem 0.8rem 0.35rem' : '0.6rem 1rem 0.4rem', flexShrink: 0 }}>
        <div style={{ fontSize: m ? '0.6rem' : '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Opgeslagen plannen ({plans.length})
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading && <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Laden…</div>}
        {!loading && plans.length === 0 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)' }}>Nog geen opgeslagen plannen</div>
        )}
        {!loading && plans.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: m ? '0.55rem 0.8rem' : '0.65rem 1rem', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.name || p.template_name || 'Naamloos plan'}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: m ? '0.55rem' : '0.6rem', marginTop: 2, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                {p.daily_calories ? <span style={{ color: 'rgba(255,215,0,0.7)', fontWeight: 800 }}>{p.daily_calories} kcal</span> : null}
                {p.daily_protein ? <span>{p.daily_protein}g E</span> : null}
                {p.meals_per_day ? <span>· {p.meals_per_day} meals</span> : null}
                {p.created_at ? <span>· {fmtDate(p.created_at)}</span> : null}
              </div>
            </div>
            <button onClick={() => onLoad?.(p.week_structure, p.name || p.template_name)} title="Dit plan laden in het huidige plan"
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.6rem', flexShrink: 0, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)', borderRadius: 6, color: '#FFD700', fontSize: m ? '0.68rem' : '0.72rem', fontWeight: 800, cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', fontFamily: 'inherit' }}>
              <Download size={13} /> Laden
            </button>
            <button onClick={(e) => handleDelete(p.id, e)} disabled={deletingId === p.id} title="Verwijderen"
              style={{ width: 30, height: 30, flexShrink: 0, background: 'transparent', border: 'none', color: 'rgba(239,68,68,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}>
              {deletingId === p.id ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (embedded) return modal
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, height: m ? '90vh' : '70vh', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>{modal}</div>
    </div>,
    document.body
  )
}
