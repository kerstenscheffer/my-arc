// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanSwitcherModal.jsx

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useModalHost } from '../../../../coach/ModalHost'
import { X, Trash2, Pencil, Check, ChevronRight, Copy, Loader, AlertTriangle, Bookmark } from 'lucide-react'
import TemplateLibrary from '../../../meal-templates/TemplateLibrary'

export default function PlanSwitcherModal({ db, clientId, coachId, activePlanId, onSelect, onRenamed, onSaveAsTemplate, weekSaveState = 'idle', onClose, isMobile, embedded = false }) {
  const modalHost = useModalHost()
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

      // Trainingsdagen van déze klant: workout_schedule gefilterd op de dagen
      // die in zijn actieve schema bestaan, anders preferred_training_days.
      // Beide kopieerpaden hieronder hebben ze nodig.
      const lib = new TemplateLibrary(db.supabase)
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

      let expandedWeek
      if (template.plan_type === 'full_week' || isFullWeekStructure(template.week_structure)) {
        // Full-week-plan: al per-dag mét volledige meal-objecten opgeslagen.
        // Werd letterlijk gekopieerd, dus ook de trainingsdagen en de
        // pre-workout van de klant voor wie het sjabloon ooit gemaakt is.
        // Bij Casper stond daardoor op zondag een pre-workout terwijl hij
        // zondag niet traint. Nu: is_training_day uit het schema van de
        // klant zelf, en pre_workout weg op rustdagen.
        const dagen = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        expandedWeek = {}
        Object.entries(template.week_structure).forEach(([dag, dagPlan]) => {
          if (!dagPlan || typeof dagPlan !== 'object') { expandedWeek[dag] = dagPlan; return }
          const idx = dagen.indexOf(dag)
          const isTraining = idx >= 0 ? clientTrainingDays.includes(idx) : !!dagPlan.is_training_day
          const kopie = { ...dagPlan, is_training_day: isTraining }
          if (!isTraining) delete kopie.pre_workout
          expandedWeek[dag] = kopie
        })
      } else {
        // Oud setA/setB-template → expand naar per-dag, mét volledige meal-objecten
        // (anders geen namen in de agenda). Trainingsdagen uit de client.
        const mealIds = lib.extractMealIds(template.week_structure)
        const meals = await lib.loadMealsByIds(mealIds)

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
  // created_via is een interne sleutel; de coach leest liever waar het plan
  // vandaan komt dan "template_copy".
  const herkomst = (via, ai) => ai ? 'AI' : ({ template_copy: 'uit sjabloon', template: 'uit sjabloon', wizard: 'wizard', manual: null }[via] ?? null)

  const tabStyle = (active) => ({
    flex: 1, minHeight: 44, padding: '0 0.25rem',
    background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? '#fff' : 'transparent'}`,
    color: '#fff', opacity: active ? 1 : 0.45,
    fontSize: m ? '0.82rem' : '0.86rem', fontWeight: 900, letterSpacing: '-0.01em',
    fontFamily: 'inherit',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 0.15s ease',
  })

  const saveCfg = {
    saving: { color: 'rgba(255,255,255,0.55)', label: 'Bezig met opslaan…' },
    saved:  { color: '#22c55e', label: 'Alle wijzigingen opgeslagen' },
    error:  { color: '#ef4444', label: 'Laatste wijziging niet opgeslagen' },
    idle:   { color: 'rgba(255,255,255,0.55)', label: 'Wijzigingen worden automatisch opgeslagen' },
  }[weekSaveState] || { color: 'rgba(255,255,255,0.55)', label: 'Wijzigingen worden automatisch opgeslagen' }
  const activePlan = plans.find(p => p.is_active)

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

        {/* Kop */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: m ? '0.75rem 1rem 0.25rem' : '1rem 1.5rem 0.25rem',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, fontSize: m ? '1.15rem' : '1.3rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.025em' }}>
            Maaltijdplannen
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

        {/* Tabs */}
        <div style={{ display: 'flex', padding: m ? '0 1rem' : '0 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <button style={tabStyle(tab === 'client')} onClick={() => setTab('client')}>
            Van deze klant{plans.length > 0 ? ` (${plans.length})` : ''}
          </button>
          <button style={tabStyle(tab === 'templates')} onClick={() => setTab('templates')}>
            Sjablonen{templates.length > 0 ? ` (${templates.length})` : ''}
          </button>
        </div>

        {/* Inhoud */}
        <div style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>

          {tab === 'client' && (
            <>
              {/* Waar je nu in werkt, en dat elke wijziging direct wordt
                  opgeslagen. Groen alleen als er net iets is opgeslagen. */}
              <div style={{ padding: m ? '0.75rem 1rem' : '0.85rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  Je werkt nu in
                </div>
                <div style={{ fontSize: m ? '0.95rem' : '1rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activePlan ? (activePlan.template_name || 'Naamloos plan') : 'Geen actief plan'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                  {weekSaveState === 'saving'
                    ? <Loader size={12} color={saveCfg.color} style={{ animation: 'psmSpin 1s linear infinite' }} />
                    : weekSaveState === 'error'
                      ? <AlertTriangle size={12} color={saveCfg.color} />
                      : <Check size={12} color={saveCfg.color} strokeWidth={3} />}
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: saveCfg.color }}>{saveCfg.label}</span>
                </div>
              </div>

              {loadingPlans && <Placeholder text="Laden…" />}
              {!loadingPlans && plans.length === 0 && (
                <Placeholder text="Nog geen plannen voor deze klant. Kopieer een sjabloon of maak een plan via de wizard." />
              )}

              {plans.map(plan => {
                const isActive = plan.is_active
                const isRenaming = renamingId === plan.id
                const isConfirmDel = confirmDelete === plan.id
                const bron = herkomst(plan.created_via, plan.ai_generated)
                return (
                  <div key={plan.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    borderLeft: `3px solid ${isActive ? '#fff' : 'transparent'}`,
                    background: isActive ? 'rgba(255,255,255,0.03)' : 'transparent',
                    padding: m ? '0.75rem 1rem 0.75rem calc(1rem - 3px)' : '0.85rem 1.5rem 0.85rem calc(1.5rem - 3px)',
                  }}>
                    {isRenaming ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          autoFocus value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRenameSave(plan.id); if (e.key === 'Escape') setRenamingId(null) }}
                          style={{
                            flex: 1, minWidth: 0, minHeight: 40, padding: '0 0.7rem',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.25)',
                            borderRadius: 10, color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                            fontFamily: 'inherit', outline: 'none',
                          }}
                        />
                        <PrimairKnop onClick={() => handleRenameSave(plan.id)} compact><Check size={14} strokeWidth={3} /></PrimairKnop>
                        <IconKnop onClick={() => setRenamingId(null)} title="Annuleren"><X size={15} /></IconKnop>
                      </div>
                    ) : (
                      <>
                        {/* Naam + tag op één regel; de hele regel opent het plan. */}
                        <button
                          onClick={() => { onSelect(plan.id); onClose() }}
                          title="Bekijk in de analyzer"
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', padding: 0, textAlign: 'left',
                            fontFamily: 'inherit', cursor: 'pointer',
                            touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0, fontSize: m ? '0.92rem' : '0.98rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {plan.template_name || 'Naamloos plan'}
                          </span>
                          {isActive && <Tag>Actief</Tag>}
                          <ChevronRight size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                        </button>
                        <Meta items={[plan.daily_calories && `${plan.daily_calories} kcal`, plan.daily_protein && `${plan.daily_protein}g eiwit`, formatDate(plan.created_at), bron]} />

                        {/* Acties: één gevulde knop (Activeer), de rest kale iconen. */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                          {!isActive && (
                            <PrimairKnop onClick={() => handleActivate(plan.id)} disabled={!!activating} dimmed={activating && activating !== plan.id}>
                              {activating === plan.id ? 'Activeren…' : 'Activeer voor klant'}
                            </PrimairKnop>
                          )}
                          <span style={{ flex: 1 }} />
                          <IconKnop onClick={() => handleRenameStart(plan)} title="Naam wijzigen"><Pencil size={14} /></IconKnop>
                          <IconKnop
                            danger={isConfirmDel}
                            onClick={() => isConfirmDel ? handleDelete(plan.id) : setConfirmDelete(plan.id)}
                            onBlur={() => setTimeout(() => setConfirmDelete(null), 200)}
                            title={isConfirmDel ? 'Nogmaals om te verwijderen' : 'Verwijderen'}
                          >
                            {isConfirmDel
                              ? <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '0 0.3rem' }}>{deleting === plan.id ? 'Bezig…' : 'Zeker?'}</span>
                              : <Trash2 size={14} />}
                          </IconKnop>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {tab === 'templates' && (
            <>
              {loadingTemplates && <Placeholder text="Sjablonen laden…" />}
              {!loadingTemplates && templates.length === 0 && (
                <Placeholder text="Nog geen sjablonen. Bewaar een plan via 'Bewaren als sjabloon' op het tabblad van de klant." />
              )}
              {templates.map(tmpl => {
                const isCopying = copyingId === tmpl.id
                const isCopied = copiedId === tmpl.id
                const macros = tmpl.base_macros || {}
                const kcal = tmpl.daily_calories || macros.calories
                const protein = tmpl.daily_protein || macros.protein
                return (
                  <div key={tmpl.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: m ? '0.75rem 1rem' : '0.85rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: m ? '0.92rem' : '0.98rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tmpl.name || 'Naamloos sjabloon'}
                      </div>
                      {tmpl.description && (
                        <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tmpl.description}
                        </div>
                      )}
                      <Meta items={[kcal && `${kcal} kcal`, protein && `${protein}g eiwit`, tmpl.meals_per_day && `${tmpl.meals_per_day}x per dag`, formatDate(tmpl.created_at)]} />
                    </div>
                    {isCopied ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#22c55e', fontSize: '0.8rem', fontWeight: 900, flexShrink: 0 }}>
                        <Check size={14} strokeWidth={3} /> Gekopieerd
                      </span>
                    ) : (
                      <SecundairKnop onClick={() => handleCopyTemplate(tmpl)} disabled={isCopying}>
                        {isCopying ? 'Kopiëren…' : <><Copy size={13} strokeWidth={2.5} /> Gebruik</>}
                      </SecundairKnop>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Voet */}
        <div style={{ padding: m ? '0.75rem 1rem' : '0.85rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {tab === 'client' && onSaveAsTemplate && (
            <SecundairKnop onClick={onSaveAsTemplate} breed>
              <Bookmark size={14} strokeWidth={2.5} /> Bewaren als sjabloon voor andere klanten
            </SecundairKnop>
          )}
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginTop: tab === 'client' && onSaveAsTemplate ? 8 : 0 }}>
            {tab === 'client' ? 'Activeer = de klant ziet dit plan. Tik op een naam om het te openen.' : 'Gebruik = kopieert het sjabloon als nieuw plan voor deze klant.'}
          </div>
        </div>
      </div>
    </div>
  )

  if (embedded) return <>{modal}<style>{`@keyframes psmSpin { to { transform: rotate(360deg) } }`}</style></>
  return createPortal(<>{modal}<style>{`@keyframes psmSpin { to { transform: rotate(360deg) } }`}</style></>, modalHost)
}

function Placeholder({ text }) {
  return <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.45 }}>{text}</div>
}

function Meta({ items }) {
  const filtered = (items || []).filter(Boolean)
  if (filtered.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {filtered.map((item, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{item}</span>
          {i < filtered.length - 1 && <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.25)' }}>·</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

function Tag({ children }) {
  return (
    <span style={{
      flexShrink: 0,
      fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: '#000', background: '#fff',
      borderRadius: 5, padding: '2px 7px',
    }}>{children}</span>
  )
}

// Eén gevulde witte knop per rij.
function PrimairKnop({ children, onClick, disabled, dimmed, compact }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      minHeight: compact ? 40 : 40, padding: compact ? '0 0.7rem' : '0 0.9rem',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: '#fff', border: 'none', borderRadius: 10,
      color: '#0a0a0a', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '-0.01em',
      fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
      opacity: dimmed ? 0.4 : 1,
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  )
}

function SecundairKnop({ children, onClick, disabled, breed }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: breed ? '100%' : undefined, minHeight: breed ? 44 : 40, padding: '0 0.9rem', flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      background: 'transparent', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10,
      color: '#fff', fontSize: '0.8rem', fontWeight: 900, letterSpacing: '-0.01em',
      fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  )
}

// Kale iconen zonder vakje. Rood alleen zolang je op "Zeker?" staat.
function IconKnop({ children, onClick, onBlur, danger, title }) {
  return (
    <button onClick={onClick} onBlur={onBlur} title={title} aria-label={title} style={{
      minHeight: 40, minWidth: 40, padding: 0,
      background: 'none', border: 'none', borderRadius: 10,
      color: danger ? '#ef4444' : 'rgba(255,255,255,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', cursor: 'pointer',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    }}>{children}</button>
  )
}
