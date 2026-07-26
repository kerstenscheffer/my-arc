// src/modules/coach-command-center/components/insight/MealsColumn.jsx
// Voeding drill-down: Days → Meal detail
// Props: { client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }
// v1.2 — ClientDocumentsSection toegevoegd

import React, { useState } from 'react'
import { UtensilsCrossed, ExternalLink, ChevronRight, ArrowLeft, Zap, BarChart3 } from 'lucide-react'
import GeneratePlanModal from './GeneratePlanModal'
import ClientDocumentsSection from './ClientDocumentsSection'

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

export default function MealsColumn({ client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }) {
  const [view, setView] = useState('days')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const targets = mealData.targets
  const today = mealData.todayTotals
  const dailyLog = mealData.dailyLog
  const days = Object.keys(dailyLog).sort((a, b) => new Date(b) - new Date(a))

  const pct = (val, target) => target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0
  const pctColor = (p) => p >= 90 ? '#10b981' : p >= 70 ? '#f59e0b' : '#ef4444'
  const mealTypeLabel = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack', quick_add: 'Quick Add', custom_meal: 'Custom', custom: 'Overig' }
  const mealTypeColor = { breakfast: '#f59e0b', lunch: '#10b981', dinner: '#3b82f6', snack: '#a855f7', quick_add: '#6b7280' }

  const MacroBar = ({ items }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {items.map((m, i) => {
        const p = pct(m.val, m.target)
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>{m.label}</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: pctColor(p), lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: '0.4rem', color: 'rgba(255,255,255,0.2)', marginTop: '0.05rem' }}>/{m.target}</div>
            <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', marginTop: '0.2rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${p}%`, background: pctColor(p), borderRadius: '1px' }} />
            </div>
          </div>
        )
      })}
    </div>
  )

  // ── DAY DETAIL ──
  if (view === 'detail' && selectedDay) {
    const dayData = dailyLog[selectedDay]
    if (!dayData) { setView('days'); return null }
    const dayMeals = dayData.meals || []
    const grouped = {}
    dayMeals.forEach(m => { const t = m.type || 'other'; if (!grouped[t]) grouped[t] = []; grouped[t].push(m) })
    const mealOrder = ['breakfast', 'lunch', 'dinner', 'snack', 'quick_add', 'custom_meal', 'custom', 'other']
    const sortedTypes = Object.keys(grouped).sort((a, b) => mealOrder.indexOf(a) - mealOrder.indexOf(b))

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button onClick={() => { setView('days'); setSelectedDay(null) }} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#FFD700', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}><ArrowLeft size={14} /></button>
          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#FFD700' }}>{formatDate(selectedDay)}</span>
          <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.25)' }}>{dayData.count} items</span>
        </div>
        {targets && <MacroBar items={[
          { label: 'KCAL', val: Math.round(dayData.calories), target: targets.calories },
          { label: 'EIWIT', val: Math.round(dayData.protein), target: targets.protein },
          { label: 'CARBS', val: Math.round(dayData.carbs), target: targets.carbs },
          { label: 'VET', val: Math.round(dayData.fat), target: targets.fat }
        ]} />}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {sortedTypes.map(type => (
            <div key={type}>
              <div style={{ padding: isMobile ? '0.4rem 0.75rem' : '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: mealTypeColor[type] || 'rgba(255,255,255,0.3)' }} />
                <span style={{ fontSize: '0.5rem', fontWeight: '700', color: mealTypeColor[type] || 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{mealTypeLabel[type] || type}</span>
              </div>
              {grouped[type].map((meal, mIdx) => (
                <div key={mIdx} style={{ padding: isMobile ? '0.4rem 0.75rem 0.4rem 1.25rem' : '0.5rem 1rem 0.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meal.name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#FFD700' }}>{meal.calories}</span>
                    <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>E:{Math.round(meal.protein)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── DAYS LIST ──
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UtensilsCrossed size={14} color="#FFD700" />
            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voeding</span>
          </div>
          <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.25)' }}>{mealData.loggingDays}/7 dagen</span>
        </div>

        {targets && <MacroBar items={[
          { label: 'KCAL', val: Math.round(today.calories), target: targets.calories },
          { label: 'EIWIT', val: Math.round(today.protein), target: targets.protein },
          { label: 'CARBS', val: Math.round(today.carbs), target: targets.carbs },
          { label: 'VET', val: Math.round(today.fat), target: targets.fat }
        ]} />}

        {/* Plan rij + knoppen */}
        {onNavigatePlan && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {mealData.plan ? (
                <>
                  <div style={{ fontSize: '0.6rem', fontWeight: '600', color: mealData.plan.isActive ? '#FFD700' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mealData.plan.name || 'Mealplan'}</div>
                  <div style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>{mealData.plan.isActive ? 'Actief' : 'Concept'}</div>
                </>
              ) : (
                <div style={{ fontSize: '0.6rem', fontWeight: '600', color: 'rgba(255,255,255,0.3)' }}>Geen plan</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              {db && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  title="Automatisch plan genereren"
                  style={{
                    padding: isMobile ? '0.3rem 0.4rem' : '0.35rem 0.5rem',
                    background: 'rgba(255,215,0,0.06)',
                    border: '1px solid rgba(255,215,0,0.2)',
                    borderRadius: '6px', color: '#FFD700',
                    fontSize: '0.55rem', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                    touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '28px'
                  }}
                >
                  <Zap size={10} /> Genereer
                </button>
              )}
            </div>
          </div>
        )}

        {/* Directe knop naar de Plan Analyzer van deze klant */}
        {onNavigatePlan && (
          <div style={{ padding: isMobile ? '0.5rem 0.75rem' : '0.625rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => { onNavigatePlan(client.id, mealData.plan?.id || null); onClose() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                padding: isMobile ? '0.5rem' : '0.6rem',
                background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)',
                borderRadius: '8px', color: '#FFD700', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 800,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '34px'
              }}
            >
              <BarChart3 size={13} /> Plan Analyzer
            </button>
          </div>
        )}

        {mealData.loggingDays > 0 && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem' : '0.5rem', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>GEM KCAL</div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: '#FFD700', lineHeight: 1 }}>{mealData.avgCalories}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem' : '0.5rem' }}>
              <div style={{ fontSize: '0.4rem', fontWeight: '700', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>LOG DAGEN</div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{mealData.loggingDays}<span style={{ fontSize: '0.4rem', opacity: 0.4 }}>/7</span></div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {days.length > 0 ? (
            <div style={{ padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem' }}>
              <div style={{ fontSize: '0.45rem', fontWeight: '700', color: 'rgba(255,215,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Dagelijks</div>
              {days.map((day, idx) => {
                const d = dailyLog[day]
                const calPct = targets ? pct(d.calories, targets.calories) : null
                return (
                  <button key={day} onClick={() => { setSelectedDay(day); setView('detail') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.25rem', borderBottom: idx < days.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.6rem', color: idx === 0 ? '#FFD700' : 'rgba(255,255,255,0.35)' }}>{formatDate(day)}</span>
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.15)' }}>{d.count}x</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: '800', color: calPct !== null ? pctColor(calPct) : '#fff' }}>{d.calories}</span>
                      <span style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.2)' }}>E:{Math.round(d.protein)}</span>
                      <ChevronRight size={12} color="rgba(255,255,255,0.15)" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>Geen voedingsdata</div>
          )}

          {/* ── DOCUMENTEN SECTIE ── */}
          {db && client?.id && (
            <ClientDocumentsSection
              db={db}
              clientId={client.id}
              coachId={coachId}
              isMobile={isMobile}
              isClientView={false}
            />
          )}
        </div>
      </div>

      {showGenerateModal && (
        <GeneratePlanModal
          client={client}
          db={db}
          coachId={coachId}
          isMobile={isMobile}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={(newPlanId) => {
            setShowGenerateModal(false)
            if (onGeneratePlan) onGeneratePlan(newPlanId)
            else if (onNavigatePlan) { onNavigatePlan(client.id, newPlanId); onClose() }
          }}
        />
      )}
    </>
  )
}
