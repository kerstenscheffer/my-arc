// src/modules/ai-meal-generator/tabs/plan-analyzer/PlanSwitcherModal.jsx

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, CheckCircle, Circle, Trash2, Pencil, Check, Zap, ChevronRight, Copy } from 'lucide-react'

export default function PlanSwitcherModal({ db, clientId, coachId, activePlanId, onSelect, onClose, isMobile }) {
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
      setPlans(data || [])
    } catch (e) { console.error('PlanSwitcher load error:', e) }
    setLoadingPlans(false)
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      // Gebruik coach_id filter zoals TemplateLibrary.getTemplates() dat doet
      let query = db.supabase
        .from('meal_plan_templates')
        .select('id, name, emoji, description, daily_calories, daily_protein, daily_carbs, daily_fat, base_macros, week_structure, created_at, meals_per_day')
        .order('created_at', { ascending: false })

      if (coachId) {
        query = query.eq('coach_id', coachId)
      }

      const { data, error } = await query
      if (error) throw error
      setTemplates(data || [])
      console.log(`✅ Loaded ${data?.length || 0} templates for coach ${coachId}`)
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
    if (!renameValue.trim()) return
    try {
      await db.supabase.from('client_meal_plans').update({ template_name: renameValue.trim() }).eq('id', planId)
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, template_name: renameValue.trim() } : p))
    } catch (e) { console.error('Rename error:', e) }
    setRenamingId(null)
  }

  const handleCopyTemplate = async (template) => {
    setCopyingId(template.id)
    try {
      // Macros uit base_macros of directe kolommen
      const macros = template.base_macros || {}
      const newPlan = {
        client_id: clientId,
        template_name: `${template.emoji || '📋'} ${template.name} (kopie)`,
        template_id: template.id,
        daily_calories: template.daily_calories || macros.calories,
        daily_protein: template.daily_protein || macros.protein,
        daily_carbs: template.daily_carbs || macros.carbs,
        daily_fat: template.daily_fat || macros.fat,
        week_structure: template.week_structure || {},
        is_active: false,
        created_via: 'template_copy',
        ai_generated: false,
        start_date: new Date().toISOString().split('T')[0]
      }
      const { data, error } = await db.supabase.from('client_meal_plans').insert([newPlan]).select().single()
      if (error) throw error
      await loadPlans()
      setCopiedId(template.id)
      setTimeout(() => {
        setCopiedId(null)
        setTab('client')
        if (onSelect) onSelect(data.id)
      }, 1200)
    } catch (e) { console.error('Copy template error:', e) }
    setCopyingId(null)
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'

  const tabStyle = (active) => ({
    flex: 1, padding: '0.5rem 0.25rem',
    background: 'none', border: 'none',
    borderBottom: `2px solid ${active ? '#FFD700' : 'transparent'}`,
    color: active ? '#FFD700' : 'rgba(255,255,255,0.3)',
    fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
    cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
    transition: 'all 0.15s ease'
  })

  const modal = (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: m ? 'flex-end' : 'center', justifyContent: 'center',
        padding: m ? 0 : '1rem'
      }}
    >
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: m ? '16px 16px 0 0' : '12px',
        width: m ? '100%' : '520px',
        maxHeight: m ? '85vh' : '80vh',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: m ? '0.875rem 1rem 0.5rem' : '0.875rem 1.25rem 0.5rem',
          flexShrink: 0
        }}>
          <div style={{ fontSize: m ? '0.9rem' : '1rem', fontWeight: 800, color: '#fff' }}>
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
                              <span style={{ fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 700, color: isActive ? '#FFD700' : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {plan.template_name || 'Naamloos plan'}
                              </span>
                              {isActive && <Tag gold>ACTIEF</Tag>}
                              {plan.ai_generated && <Zap size={10} color="rgba(255,215,0,0.4)" />}
                            </div>
                            <Meta items={[plan.daily_calories && `${plan.daily_calories} kcal`, plan.daily_protein && `${plan.daily_protein}g eiwit`, formatDate(plan.created_at), plan.created_via]} />
                          </>
                        )}
                      </div>
                      {!isRenaming && (
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                          <Btn onClick={() => handleRenameStart(plan)}><Pencil size={11} /></Btn>
                          <Btn
                            danger={isConfirmDel}
                            onClick={() => isConfirmDel ? handleDelete(plan.id) : setConfirmDelete(plan.id)}
                            onBlur={() => setTimeout(() => setConfirmDelete(null), 200)}
                          >
                            {isConfirmDel ? <span style={{ fontSize: '0.45rem', fontWeight: 700, padding: '0 0.1rem' }}>Zeker?</span> : <Trash2 size={11} />}
                          </Btn>
                          {!isActive && (
                            <button
                              onClick={() => handleActivate(plan.id)}
                              disabled={!!activating}
                              style={{
                                background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)',
                                borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: 'pointer',
                                color: '#FFD700', fontSize: '0.45rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                display: 'flex', alignItems: 'center', gap: '0.2rem', minHeight: '28px',
                                touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                                opacity: activating && activating !== plan.id ? 0.4 : 1
                              }}
                            >
                              {activating === plan.id ? 'Activeren...' : <><span>Activeer</span><ChevronRight size={10} /></>}
                            </button>
                          )}
                          <Btn onClick={() => { onSelect(plan.id); onClose() }}><ChevronRight size={12} /></Btn>
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
              {!loadingTemplates && !coachId && <Placeholder text="Geen coach ID beschikbaar — templates kunnen niet geladen worden" />}
              {!loadingTemplates && coachId && templates.length === 0 && <Placeholder text="Geen templates gevonden" />}
              {templates.map(tmpl => {
                const isCopying = copyingId === tmpl.id
                const isCopied = copiedId === tmpl.id
                const macros = tmpl.base_macros || {}
                const kcal = tmpl.daily_calories || macros.calories
                const protein = tmpl.daily_protein || macros.protein
                return (
                  <div key={tmpl.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', borderLeft: '3px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: m ? '0.75rem 1rem' : '0.75rem 1.25rem' }}>
                      <div style={{ flexShrink: 0, fontSize: '1rem', lineHeight: 1 }}>{tmpl.emoji || '📋'}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: m ? '0.78rem' : '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                          {tmpl.name || 'Naamloos template'}
                        </div>
                        {tmpl.description && (
                          <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }}>
                            {tmpl.description}
                          </div>
                        )}
                        <Meta items={[kcal && `${kcal} kcal`, protein && `${protein}g eiwit`, tmpl.meals_per_day && `${tmpl.meals_per_day}x/dag`, formatDate(tmpl.created_at)]} />
                      </div>
                      <button
                        onClick={() => !isCopied && handleCopyTemplate(tmpl)}
                        disabled={isCopying || isCopied}
                        style={{
                          background: isCopied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isCopied ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: '4px', padding: '0.25rem 0.5rem',
                          cursor: isCopied ? 'default' : 'pointer',
                          color: isCopied ? '#10b981' : 'rgba(255,255,255,0.5)',
                          fontSize: '0.45rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          display: 'flex', alignItems: 'center', gap: '0.25rem', minHeight: '28px', flexShrink: 0,
                          touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                          transition: 'all 0.2s ease', opacity: isCopying ? 0.6 : 1
                        }}
                      >
                        {isCopied ? <><Check size={11} /> Gekopieerd</> : isCopying ? 'Kopiëren...' : <><Copy size={11} /> Gebruik</>}
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
          <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.12)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {tab === 'client' ? 'Activeer = client ziet dit plan · → = bekijk in analyzer' : 'Gebruik = kopieert als nieuw concept voor deze client'}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function Placeholder({ text }) {
  return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.65rem' }}>{text}</div>
}

function Meta({ items }) {
  const filtered = (items || []).filter(Boolean)
  return (
    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {filtered.map((item, i) => (
        <React.Fragment key={i}>
          <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>{item}</span>
          {i < filtered.length - 1 && <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.12)' }}>·</span>}
        </React.Fragment>
      ))}
    </div>
  )
}

function Tag({ children, gold }) {
  return (
    <span style={{
      fontSize: '0.4rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      color: gold ? '#FFD700' : 'rgba(255,255,255,0.35)',
      background: gold ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${gold ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: '3px', padding: '0.1rem 0.3rem'
    }}>{children}</span>
  )
}

function Btn({ children, onClick, onBlur, gold, danger, disabled }) {
  return (
    <button onClick={onClick} onBlur={onBlur} disabled={disabled} style={{
      background: danger ? 'rgba(239,68,68,0.12)' : gold ? 'rgba(255,215,0,0.1)' : 'none',
      border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : gold ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: '4px', padding: '0.25rem', cursor: 'pointer',
      color: danger ? '#ef4444' : gold ? '#FFD700' : 'rgba(255,255,255,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '28px', minWidth: '28px',
      touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
      transition: 'all 0.15s ease', opacity: disabled ? 0.4 : 1
    }}>{children}</button>
  )
}
