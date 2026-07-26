// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanSwitcherModal.jsx

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, Circle, Trash2, Pencil, Check, Zap, ChevronRight, Copy, Loader, AlertTriangle, Bookmark } from 'lucide-react'
import TemplateLibrary from '../../../meal-templates/TemplateLibrary'

export default function PlanSwitcherModal({ db, clientId, coachId, activePlanId, onSelect, onRenamed, onSaveAsTemplate, weekSaveState = 'idle', onClose, isMobile, embedded = false }) {
  const m = isMobile
  const [tab, setTab] = useState('client')

  const [plans, setPlans] = useState([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [activating, setActivating] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [copyingId, setCopyingId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => { loadPlans() }, [clientId])
  useEffect(() => { if (tab === 'templates' && templates.length === 0) loadTemplates() }, [tab])

  const loadPlans = async () => {
    setLoadingPlans(true)
    try {
      const { data } = await db.supabase
        .from('client_meal_plans')
        .select('id, template_name, daily_calories, daily_protein, daily_carbs, daily_fat, is_active, ai_generated, created_at, start_date, created_via')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
      // Actief plan altijd bovenaan (stabiele sort behoudt created_at-volgorde
      // binnen de rest) → de coach ziet direct in welk plan hij werkt.
      const sorted = (data || []).slice().sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0))
      setPlans(sorted)
    } catch (e) { console.error('PlanSwitcher load error:', e) }
    setLoadingPlans(false)
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      // Toon ALLE opgeslagen plannen/sjablonen — inclusief de full_week-plannen
      // die je vanuit de analyzer bewaart als "Dit plan bewaren als template".
      // (Die werden voorheen weggefilterd, waardoor je ze bij een andere klant
      // niet terugzag.) Coach-filter is null-inclusief omdat oudere sjablonen
      // met coach_id = null zijn opgeslagen.
      let query = db.supabase
        .from('meal_plan_templates')
        .select('id, name, emoji, description, plan_type, daily_calories, daily_protein, daily_carbs, daily_fat, base_macros, week_structure, created_at, meals_per_day')
        .order('created_at', { ascending: false })
      if (coachId) query = query.or(`coach_id.is.null,coach_id.eq.${coachId}`)

      const { data, error } = await query
      if (error) throw error
      setTemplates(data || [])
    } catch (e) {
      console.error('Templates load error:', e)
    }
    setLoadingTemplates(false)
  }

  const handleActivate = async (planId) => {
    setActivating(planId)
    try {
      await db.supabase.from('client_meal_plans').update({ is_active: false }).eq('client_id', clientId)
      await db.supabase.from('client_meal_plans').update({ is_active: true }).eq('id', planId)
      setPlans(prev => prev.map(p => ({ ...p, is_active: p.id === planId })))
      if (onSelect) onSelect(planId)
    } catch (e) { console.error('Activate error:', e) }
    setActivating(null)
  }

  const handleDelete = async (planId) => {
    if (confirmDelete !== planId) { setConfirmDelete(planId); return }
    setDeleting(planId)
    try {
      await db.supabase.from('client_meal_plans').delete().eq('id', planId)
      setPlans(prev => prev.filter(p => p.id !== planId))
      setConfirmDelete(null)
    } catch (e) { console.error('Delete error:', e) }
    setDeleting(null)
  }

  const handleRenameStart = (plan) => { setRenamingId(plan.id); setRenameValue(plan.template_name || '') }

  const handleRenameSave = async (planId) => {
    const next = renameValue.trim()
    if (!next) return
    try {
      // .select() erbij zodat een update die niets raakt (geen rechten, weg
      // plan) niet stilletjes als succes doorgaat: dan bleef de lijst de
      // nieuwe naam tonen terwijl de DB de oude hield.
      const { data, error } = await db.supabase
        .from('client_meal_plans')
        .update({ template_name: next })
        .eq('id', planId)
        .select('id, template_name')
      if (error) throw error
      if (!data?.length) throw new Error('Plan niet gevonden')
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, template_name: data[0].template_name } : p))
      onRenamed?.(planId, data[0].template_name)
    } catch (e) {
      console.error('Rename error:', e)
      alert('Naam opslaan mislukt: ' + (e.message || 'onbekende fout'))
    }
    setRenamingId(null)
  }

  const DAY_KEYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']
  const isFullWeekStructure = (ws) => ws && typeof ws === 'object' && DAY_KEYS.some(k => k in ws)

  const handleCopyTemplate = async (template) => {
    setCopyingId(template.id)
    try {
      // Macros uit base_macros of directe kolommen
      const macros = template.base_macros || {}

      let expandedWeek
      if (template.plan_type === 'full_week' || isFullWeekStructure(template.week_structure)) {
        // Full-week-plan: al per-dag mét volledige meal-objecten opgeslagen →
        // direct kopiëren (de analyzer hydrateert 'm verder bij het laden).
        expandedWeek = template.week_structure
      } else {
        // Oud setA/setB-template → expand naar per-dag, mét volledige meal-objecten
        // (anders geen namen in de agenda). Trainingsdagen uit de client.
        const lib = new TemplateLibrary(db.supabase)
        const mealIds = lib.extractMealIds(template.week_structure)
        const meals = await lib.loadMealsByIds(mealIds)

        const { data: clientData } = await db.supabase
          .from('clients')
          .select('workout_schedule, training_time, preferred_training_days, assigned_schema_id')
          .eq('id', clientId)
          .single()

        let validDagKeys = null
        if (clientData?.assigned_schema_id) {
          const { data: schema } = await db.supabase
            .from('workout_schemas')
            .select('week_structure')
            .eq('id', clientData.assigned_schema_id)
            .single()
          if (schema?.week_structure && typeof schema.week_structure === 'object') {
            validDagKeys = new Set(Object.keys(schema.week_structure))
          }
        }
        const clientTrainingDays = lib.resolveClientTrainingDays(clientData, validDagKeys)
        const trainingTime = clientData?.training_time || null

        // scaleFactor = 1 → kopie van de template-macros, geen herschaling.
        expandedWeek = lib.buildScaledWeek(
          template.week_structure, meals, 1, clientTrainingDays, trainingTime
        )
      }

      const newPlan = {
        client_id: clientId,
        template_name: `${template.emoji || '📋'} ${template.name} (kopie)`,
        template_id: template.id,
        daily_calories: template.daily_calories || macros.calories,
        daily_protein: template.daily_protein || macros.protein,
        daily_carbs: template.daily_carbs || macros.carbs,
        daily_fat: template.daily_fat || macros.fat,
        week_structure: expandedWeek,
        is_active: false,
        created_via: 'template_copy',
        ai_generated: false,
        start_date: new Date().toISOString().split('T')[0]
      }
      const { data, error } = await db.supabase.from('client_meal_plans').insert([newPlan]).select('id').single()
      if (error) throw error
      await loadPlans()
      setCopiedId(template.id)
      // Laad de kopie direct in de analyzer (onSelect zet selectedConceptId +
      // sluit de modal). De zijbalk toont daarna een "Activeer"-knop.
      setTimeout(() => {
        setCopiedId(null)
        if (onSelect && data?.id) onSelect(data.id)
      }, 900)
    } catch (e) { console.error('Copy template error:', e) }
    setCopyingId(null)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'

  const tabStyle = (active) => ({
    flex: 1, padding: m ? '0.6rem 0.25rem' : '0.7rem 0.25rem',
    background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? '#FFD700' : 'transparent'}`,
    color: active ? '#FFD700' : 'rgba(255,255,255,0.6)',
    fontSize: m ? '0.8rem' : '0.85rem', fontWeight: 800, letterSpacing: '-0.01em',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.15s ease'
  })

  const modal = (
    <div
      onClick={embedded ? undefined : (e) => e.target === e.currentTarget && onClose()}
      style={embedded
        ? { display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#0a0a0a' }
        : { position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center', padding: m ? 0 : '1rem' }}
    >
      <div style={embedded
        ? { background: '#0a0a0a', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        : { background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: m ? '16px 16px 0 0' : '12px', width: m ? '100%' : '520px', maxHeight: m ? '85vh' : '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: m ? '0.875rem 1rem 0.5rem' : '0.875rem 1.25rem 0.5rem',
          flexShrink: 0
        }}>
          <div style={{ fontSize: m ? '1rem' : '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
            Maaltijdplannen
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.3)', padding: '0.25rem',
            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            display: 'flex', alignItems: 'center', minHeight: '32px', minWidth: '32px', justifyContent: 'center'
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '0 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          <button style={tabStyle(tab === 'client')} onClick={() => setTab('client')}>
            👤 Client ({plans.length})
          </button>
          <button style={tabStyle(tab === 'templates')} onClick={() => setTab('templates')}>
            📋 Templates{templates.length > 0 ? ` (${templates.length})` : ''}
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>

          {/* CLIENT PLANS */}
          {tab === 'client' && (
            <>
              {/* Auto-save-bevestiging: maakt zichtbaar dat élke wijziging direct
                  in het actieve plan wordt opgeslagen (geen aparte opslaan-actie). */}
              {(() => {
                const active = plans.find(p => p.is_active)
                const saveCfg = {
                  saving: { color: 'rgba(255,255,255,0.55)', label: 'Bezig met opslaan…' },
                  saved:  { color: '#10b981', label: 'Alle wijzigingen opgeslagen' },
                  error:  { color: '#ef4444', label: 'Let op: laatste wijziging niet opgeslagen' },
                  idle:   { color: '#10b981', label: 'Wijzigingen worden automatisch opgeslagen' },
                }[weekSaveState] || { color: '#10b981', label: 'Wijzigingen worden automatisch opgeslagen' }
                return (
                  <div style={{ padding: m ? '0.6rem 1rem' : '0.7rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(16,185,129,0.04)' }}>
                    <div style={{ fontSize: m ? '0.6rem' : '0.64rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
                      Je werkt nu in
                    </div>
                    <div style={{ fontSize: m ? '0.95rem' : '1rem', fontWeight: 800, color: '#FFD700', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {active ? (active.template_name || 'Naamloos plan') : 'Geen actief plan'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                      {weekSaveState === 'saving'
                        ? <Loader size={11} color={saveCfg.color} style={{ animation: 'psmSpin 1s linear infinite' }} />
                        : weekSaveState === 'error'
                          ? <AlertTriangle size={11} color={saveCfg.color} />
                          : <Check size={11} color={saveCfg.color} strokeWidth={3} />}
                      <span style={{ fontSize: m ? '0.62rem' : '0.66rem', fontWeight: 700, color: saveCfg.color }}>{saveCfg.label}</span>
                    </div>
                  </div>
                )
              })()}
              {loadingPlans && <Placeholder text="Laden..." />}
              {!loadingPlans && plans.length === 0 && <Placeholder text="Geen plannen voor deze client" />}
              {plans.map(plan => {
                const isActive = plan.is_active
                const isRenaming = renamingId === plan.id
                const isConfirmDel = confirmDelete === plan.id
                return (
                  <div key={plan.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${isActive ? '#FFD700' : 'transparent'}`,
                    background: isActive ? 'rgba(255,215,0,0.03)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: m ? '0.75rem 1rem' : '0.75rem 1.25rem' }}>
                      <div style={{ flexShrink: 0 }}>
                        {isActive ? <CheckCircle size={16} color="#FFD700" /> : <Circle size={16} color="rgba(255,255,255,0.12)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isRenaming ? (
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input
                              autoFocus value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(plan.id); if (e.key === 'Escape') setRenamingId(null) }}
                              style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '4px', padding: '0.25rem 0.5rem', color: '#fff', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                            />
                            <Btn gold onClick={() => handleRenameSave(plan.id)}><Check size={12} /></Btn>
                            <Btn onClick={() => setRenamingId(null)}><X size={12} /></Btn>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 800, color: isActive ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                                {plan.template_name || 'Naamloos plan'}
                              </span>
                              {isActive && <Tag gold>ACTIEF</Tag>}
                              {plan.ai_generated && <Zap size={12} color="rgba(255,215,0,0.6)" />}
                            </div>
                            <Meta items={[plan.daily_calories && `${plan.daily_calories} kcal`, plan.daily_protein && `${plan.daily_protein}g eiwit`, formatDate(plan.created_at), plan.created_via]} />
                          </>
                        )}
                      </div>
                      {!isRenaming && (
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                          <Btn onClick={() => handleRenameStart(plan)}><Pencil size={13} /></Btn>
                          <Btn
                            danger={isConfirmDel}
                            onClick={() => isConfirmDel ? handleDelete(plan.id) : setConfirmDelete(plan.id)}
                            onBlur={() => setTimeout(() => setConfirmDelete(null), 200)}
                          >
                            {isConfirmDel ? <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '0 0.2rem' }}>Zeker?</span> : <Trash2 size={13} />}
                          </Btn>
                          {!isActive && (
                            <button
                              onClick={() => handleActivate(plan.id)}
                              disabled={!!activating}
                              style={{
                                background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.35)',
                                borderRadius: '6px', padding: '0.4rem 0.7rem', cursor: 'pointer',
                                color: '#FFD700', fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800,
                                letterSpacing: '-0.01em',
                                display: 'flex', alignItems: 'center', gap: '0.2rem', minHeight: '32px',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                opacity: activating && activating !== plan.id ? 0.4 : 1
                              }}
                            >
                              {activating === plan.id ? 'Activeren…' : <><span>Activeer</span><ChevronRight size={13} /></>}
                            </button>
                          )}
                          <Btn onClick={() => { onSelect(plan.id); onClose() }}><ChevronRight size={14} /></Btn>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* TEMPLATES */}
          {tab === 'templates' && (
            <>
              {loadingTemplates && <Placeholder text="Templates laden..." />}
              {!loadingTemplates && templates.length === 0 && <Placeholder text="Nog geen opgeslagen plannen — bewaar er eerst een via 'Dit plan bewaren als template'." />}
              {templates.map(tmpl => {
                const isCopying = copyingId === tmpl.id
                const isCopied = copiedId === tmpl.id
                const macros = tmpl.base_macros || {}
                const kcal = tmpl.daily_calories || macros.calories
                const protein = tmpl.daily_protein || macros.protein
                return (
                  <div key={tmpl.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: m ? '0.75rem 1rem' : '0.75rem 1.25rem' }}>
                      <div style={{ flexShrink: 0, fontSize: '1.2rem', lineHeight: 1 }}>{tmpl.emoji || '📋'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: m ? '0.9rem' : '0.95rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                          {tmpl.name || 'Naamloos template'}
                        </div>
                        {tmpl.description && (
                          <div style={{ fontSize: m ? '0.65rem' : '0.7rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.15rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tmpl.description}
                          </div>
                        )}
                        <Meta items={[kcal && `${kcal} kcal`, protein && `${protein}g eiwit`, tmpl.meals_per_day && `${tmpl.meals_per_day}x/dag`, formatDate(tmpl.created_at)]} />
                      </div>
                      <button
                        onClick={() => !isCopied && handleCopyTemplate(tmpl)}
                        disabled={isCopying || isCopied}
                        style={{
                          background: isCopied ? 'rgba(16,185,129,0.12)' : 'rgba(255,215,0,0.1)',
                          border: `1px solid ${isCopied ? 'rgba(16,185,129,0.4)' : 'rgba(255,215,0,0.35)'}`,
                          borderRadius: '6px', padding: '0.4rem 0.7rem',
                          cursor: isCopied ? 'default' : 'pointer',
                          color: isCopied ? '#10b981' : '#FFD700',
                          fontSize: m ? '0.72rem' : '0.78rem', fontWeight: 800, letterSpacing: '-0.01em',
                          display: 'flex', alignItems: 'center', gap: '0.3rem', minHeight: '32px', flexShrink: 0,
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          transition: 'all 0.2s ease', opacity: isCopying ? 0.6 : 1
                        }}
                      >
                        {isCopied ? <><Check size={13} /> Gekopieerd</> : isCopying ? 'Kopiëren…' : <><Copy size={13} /> Gebruik</>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: m ? '0.5rem 1rem' : '0.5rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
          {tab === 'client' && onSaveAsTemplate && (
            <button onClick={onSaveAsTemplate} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.55rem', marginBottom: '0.5rem',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
              color: 'rgba(255,255,255,0.7)', fontSize: m ? '0.7rem' : '0.75rem', fontWeight: 700,
              cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
            }}>
              <Bookmark size={13} /> Dit plan bewaren als template (voor andere clients)
            </button>
          )}
          <div style={{ fontSize: m ? '0.62rem' : '0.66rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            {tab === 'client' ? 'Activeer = client ziet dit plan · → = bekijk in analyzer' : 'Gebruik = kopieert als nieuw concept voor deze client'}
          </div>
        </div>
      </div>
    </div>
  )

  if (embedded) return <>{modal}<style>{`@keyframes psmSpin { to { transform: rotate(360deg) } }`}</style></>
  return createPortal(<>{modal}<style>{`@keyframes psmSpin { to { transform: rotate(360deg) } }`}</style></>, document.body)
}

function Placeholder({ text }) {
  return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 600 }}>{text}</div>
}

function Meta({ items }) {
  const filtered = (items || []).filter(Boolean)
  return (
    <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {filtered.map((item, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.65)', fontWeight: 700 }}>{item}</span>
          {i < filtered.length - 1 && <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.25)' }}>·</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

function Tag({ children, gold }) {
  return (
    <span style={{
      fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
      color: gold ? '#FFD700' : 'rgba(255,255,255,0.5)',
      background: gold ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${gold ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '4px', padding: '0.12rem 0.4rem'
    }}>{children}</span>
  )
}

function Btn({ children, onClick, onBlur, gold, danger, disabled }) {
  return (
    <button onClick={onClick} onBlur={onBlur} disabled={disabled} style={{
      background: danger ? 'rgba(239,68,68,0.12)' : gold ? 'rgba(255,215,0,0.1)' : 'none',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : gold ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '4px', padding: '0.25rem', cursor: 'pointer',
      color: danger ? '#ef4444' : gold ? '#FFD700' : 'rgba(255,255,255,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '30px', minWidth: '30px',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.15s ease', opacity: disabled ? 0.4 : 1
    }}>{children}</button>
  )
}
