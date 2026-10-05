// src/modules/coach-command-center/components/insight/MealsColumn.jsx
// Voeding drill-down: Days → Meal detail
// Props: { client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }
// v1.2 — ClientDocumentsSection toegevoegd

import React, { useEffect, useState } from 'react'
import { UtensilsCrossed, ExternalLink, ChevronRight, ArrowLeft, Zap, BarChart3, Droplet, Info } from 'lucide-react'
import GeneratePlanModal from './GeneratePlanModal'
import MealCard from '../../../meal-plan/components/day-schedule/MealCard'
import BladModal from '../../../workout/components/todays-workout/components/BladModal'
import { foodImageFallback } from '../../../meal-plan/foodImageFallback'
import ClientDocumentsSection from './ClientDocumentsSection'
import SupplementTrouw from './SupplementTrouw'

// Het waterblok: wat de klant drinkt, en het doel dat jij daarvoor zet.
// Losse component zodat de kolom zelf niet nog meer state krijgt.
function WaterDoel({ client, db, isMobile }) {
  const [liters, setLiters] = useState(
    Number(client?.water_intake_target) > 0 ? Number(client.water_intake_target) : 3
  )
  const [bezig, setBezig] = useState(false)
  const [bewaard, setBewaard] = useState(false)
  // De laatste zeven dagen, oudste eerst. Zonder rij voor een dag heeft hij
  // die dag niets gelogd — dat is ook informatie.
  const [dagen, setDagen] = useState([])

  useEffect(() => {
    if (!db?.supabase || !client?.id) return
    let weg = false
    ;(async () => {
      const vanaf = new Date(); vanaf.setDate(vanaf.getDate() - 6)
      const vanafIso = vanaf.toISOString().split('T')[0]
      const { data, error } = await db.supabase
        .from('ai_water_tracking')
        .select('date, milliliters, target_milliliters')
        .eq('client_id', client.id)
        .gte('date', vanafIso)
        .order('date', { ascending: true })
      if (weg || error) return
      const perDag = new Map((data || []).map(r => [String(r.date).slice(0, 10), r]))
      const lijst = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const iso = d.toISOString().split('T')[0]
        const rij = perDag.get(iso)
        lijst.push({
          iso,
          dag: d.toLocaleDateString('nl-NL', { weekday: 'short' }).slice(0, 2),
          ml: Number(rij?.milliliters) || 0,
          doel: Number(rij?.target_milliliters) || null,
        })
      }
      setDagen(lijst)
    })()
    return () => { weg = true }
  }, [db, client?.id])

  const zet = async (nieuw) => {
    const waarde = Math.max(0.5, Math.min(8, Math.round(nieuw * 10) / 10))
    setLiters(waarde)
    if (!db?.supabase || !client?.id) return
    setBezig(true)
    try {
      const { error } = await db.supabase
        .from('clients').update({ water_intake_target: waarde }).eq('id', client.id)
      if (error) throw error
      setBewaard(true)
      setTimeout(() => setBewaard(false), 1400)
    } catch (e) {
      console.error('Waterdoel opslaan mislukt:', e)
    } finally {
      setBezig(false)
    }
  }

  const doelMl = liters * 1000
  const vandaag = dagen[dagen.length - 1]
  const gelogdeDagen = dagen.filter(d => d.ml > 0).length

  return (
    <div style={{
      padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Droplet size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
            Water · doel per dag
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1 }}>
            {vandaag ? `Vandaag ${(vandaag.ml / 1000).toFixed(1)}L` : 'Vandaag nog niets'}
            <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>
              {' · '}{gelogdeDagen}/7 dagen gelogd
            </span>
          </div>
          {bewaard && (
            <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#10b981', marginTop: 1 }}>Doel bewaard</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, opacity: bezig ? 0.5 : 1 }}>
          <button onClick={() => zet(liters - 0.5)} aria-label="Minder" style={waterKnop}>−</button>
          <span style={{
            minWidth: 44, textAlign: 'center',
            fontSize: '0.85rem', fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums',
          }}>
            {liters.toFixed(1)}L
          </span>
          <button onClick={() => zet(liters + 0.5)} aria-label="Meer" style={waterKnop}>+</button>
        </div>
      </div>

      {/* Zeven staafjes: hoe vol de dag was ten opzichte van zijn doel. Een
          lege dag blijft leeg staan, want niet loggen is ook een antwoord. */}
      {dagen.length > 0 && (
        <div style={{ display: 'flex', gap: 3, marginTop: '0.5rem', alignItems: 'flex-end' }}>
          {dagen.map((d, i) => {
            const doel = d.doel || doelMl
            const pct = doel > 0 ? Math.min(100, (d.ml / doel) * 100) : 0
            const vol = pct >= 100
            return (
              <div key={d.iso} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  title={`${d.iso}: ${(d.ml / 1000).toFixed(1)} van ${(doel / 1000).toFixed(1)} liter`}
                  style={{
                    height: 26, borderRadius: 4, overflow: 'hidden',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'flex-end',
                  }}
                >
                  <div style={{
                    width: '100%', height: `${pct}%`,
                    background: vol ? '#3b82f6' : 'rgba(59,130,246,0.55)',
                  }} />
                </div>
                <div style={{
                  marginTop: 2, fontSize: '0.52rem', fontWeight: 800,
                  color: i === dagen.length - 1 ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)',
                  textTransform: 'uppercase',
                }}>
                  {d.dag}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const waterKnop = {
  width: 26, height: 26, padding: 0, borderRadius: 7,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
  color: '#fff', fontSize: '0.9rem', fontWeight: 900, lineHeight: 1,
  cursor: 'pointer', fontFamily: 'inherit',
  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
}

const formatDate = (d) => { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: dt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined }) }

const tijdVan = (iso) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// De gelogde ingrediënten zijn op twee manieren opgeslagen: eigen maaltijden
// van de klant (my_meals) al uitgeschreven met naam en macro's; maaltijden
// uit het plan (plan_check) als verwijzing naar ai_ingredients. Beide komen
// hier uit als dezelfde vorm.
async function schrijfIngredientenUit(db, lijst) {
  const rijen = Array.isArray(lijst) ? lijst : []
  if (rijen.length === 0) return []
  const uitgeschreven = rijen.filter(r => r?.name)
  if (uitgeschreven.length === rijen.length) {
    return uitgeschreven.map(r => ({
      name: r.name, amount: Number(r.amount) || 0, unit: r.unit || 'g',
      calories: Number(r.calories) || 0, protein: Number(r.protein) || 0,
      carbs: Number(r.carbs) || 0, fat: Number(r.fat) || 0,
    }))
  }
  const ids = [...new Set(rijen.map(r => r?.ingredient_id).filter(Boolean))]
  if (ids.length === 0 || !db?.supabase) return []
  try {
    const { data, error } = await db.supabase
      .from('ai_ingredients')
      .select('id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g')
      .in('id', ids)
    if (error) throw error
    const opId = new Map((data || []).map(i => [i.id, i]))
    return rijen.map(r => {
      const b = opId.get(r.ingredient_id)
      if (!b) return null
      const gram = Number(r.amount) || 0
      const deel = gram / 100
      return {
        name: b.name, amount: gram, unit: r.unit || 'gram',
        calories: Math.round((b.calories_per_100g || 0) * deel),
        protein: Math.round((b.protein_per_100g || 0) * deel * 10) / 10,
        carbs: Math.round((b.carbs_per_100g || 0) * deel * 10) / 10,
        fat: Math.round((b.fat_per_100g || 0) * deel * 10) / 10,
      }
    }).filter(Boolean)
  } catch (e) {
    console.error('Ingrediënten uitschrijven mislukt:', e)
    return []
  }
}

const eenheid = (u) => (u === 'gram' || u === 'g') ? 'g' : u === 'ml' ? ' ml' : u === 'portion' ? ' portie' : ` ${u || ''}`

export default function MealsColumn({ client, mealData, isMobile, onNavigatePlan, onClose, db, coachId, onGeneratePlan }) {
  const [view, setView] = useState('days')
  const [selectedDay, setSelectedDay] = useState(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  // Gelogde maaltijd waarvan het info-blad open staat, plus zijn ingrediënten.
  const [infoMeal, setInfoMeal] = useState(null)
  const [infoIngredienten, setInfoIngredienten] = useState(null)

  const openInfo = async (meal) => {
    setInfoMeal(meal)
    setInfoIngredienten(null)
    const uit = await schrijfIngredientenUit(db, meal.ingredients)
    setInfoIngredienten(uit)
  }
  const sluitInfo = () => { setInfoMeal(null); setInfoIngredienten(null) }

  const bronLabel = { my_meals: 'Eigen maaltijd', plan_check: 'Uit het plan', myarc: 'Product', recent: 'Recent', recent_relog: 'Recent', quick_add: 'Snel toegevoegd' }

  const targets = mealData.targets
  const today = mealData.todayTotals
  const dailyLog = mealData.dailyLog
  const days = Object.keys(dailyLog).sort((a, b) => new Date(b) - new Date(a))

  const pct = (val, target) => target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0
  const pctColor = (p) => p >= 90 ? '#10b981' : p >= 70 ? '#f59e0b' : '#ef4444'
  const mealTypeLabel = { breakfast: 'Ontbijt', lunch: 'Lunch', dinner: 'Diner', snack: 'Snack', quick_add: 'Snel toegevoegd', custom_meal: 'Eigen maaltijd', custom: 'Overig', other: 'Overig' }

  const MacroBar = ({ items }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {items.map((m, i) => {
        const p = pct(m.val, m.target)
        return (
          <div key={i} style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem 0.125rem' : '0.5rem 0.25rem', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>{m.label}</div>
            <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: pctColor(p), lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.05rem' }}>/{m.target}</div>
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
          <button onClick={() => { setView('days'); setSelectedDay(null) }} style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, touchAction: 'manipulation' }}><ArrowLeft size={14} /></button>
          <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>{formatDate(selectedDay)}</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{dayData.count} gelogd</span>
        </div>
        {targets && <MacroBar items={[
          { label: 'KCAL', val: Math.round(dayData.calories), target: targets.calories },
          { label: 'EIWIT', val: Math.round(dayData.protein), target: targets.protein },
          { label: 'CARBS', val: Math.round(dayData.carbs), target: targets.carbs },
          { label: 'VET', val: Math.round(dayData.fat), target: targets.fat }
        ]} />}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: '0.5rem' }}>
          {sortedTypes.map(type => (
            <div key={type} style={{ marginBottom: '0.5rem' }}>
              {/* Sectiekop: bold wit, sentence case. Geen gekleurde stip; het
                  moment staat ook al op de foto van elke kaart. */}
              <div style={{ padding: isMobile ? '0.25rem 0.9rem 0.4rem' : '0.3rem 1.25rem 0.5rem', fontSize: '0.86rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.015em' }}>
                {mealTypeLabel[type] || type}
              </div>
              {grouped[type].map((meal, mIdx) => (
                <MealCard
                  key={meal.id || mIdx}
                  meal={{
                    name: meal.name, image_url: meal.image_url,
                    slot: type,
                    calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
                  }}
                  momentLabel={mealTypeLabel[type] || type}
                  tijdLabel={tijdVan(meal.time)}
                  // Een los product zonder ingrediënten: de hoeveelheid is wat je wilt weten.
                  ondertitel={(!meal.ingredients?.length && meal.amount > 0) ? `${Math.round(meal.amount * 10) / 10}${eenheid(meal.per_unit)}` : null}
                  isMobile={isMobile}
                  acties={[{ icon: <Info size={isMobile ? 11 : 12} />, label: 'Info', onClick: () => openInfo(meal) }]}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Wat zat erin? Zelfde blad als in het wisselvenster van de klant. */}
        <BladModal open={!!infoMeal} titel={infoMeal?.name || 'Maaltijd'} onClose={sluitInfo} zIndex={10600}>
          {infoMeal && (
            <>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                {[bronLabel[infoMeal.source] || null, tijdVan(infoMeal.time), formatDate(selectedDay)].filter(Boolean).join(' · ')}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { label: 'kcal', waarde: Math.round(infoMeal.calories || 0) },
                  { label: 'eiwit', waarde: `${Math.round(infoMeal.protein || 0)}g` },
                  { label: 'koolh', waarde: `${Math.round(infoMeal.carbs || 0)}g` },
                  { label: 'vet', waarde: `${Math.round(infoMeal.fat || 0)}g` },
                ].map(x => (
                  <div key={x.label} style={{ flex: 1, minWidth: 0, textAlign: 'center', padding: '0.5rem 0.25rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{x.waarde}</div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{x.label}</div>
                  </div>
                ))}
              </div>

              {infoMeal.notes && (
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '0.9rem', lineHeight: 1.4 }}>
                  {infoMeal.notes}
                </div>
              )}

              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                Ingrediënten
              </div>
              {infoIngredienten === null ? (
                <div style={{ padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>Laden…</div>
              ) : infoIngredienten.length === 0 ? (
                <div style={{ padding: '0.5rem 0 1rem', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', fontWeight: 700 }}>
                  {infoMeal.amount > 0
                    ? `Los product: ${Math.round(infoMeal.amount * 10) / 10}${eenheid(infoMeal.per_unit)}.`
                    : 'Van deze maaltijd zijn geen ingrediënten gelogd.'}
                </div>
              ) : (
                <div style={{ margin: '0 -1.25rem 1rem' }}>
                  {infoIngredienten.map((ing, i) => (
                    <MealCard
                      key={`${ing.name}-${i}`}
                      meal={{
                        name: ing.name,
                        image_url: foodImageFallback(ing.name, null, 200),
                        calories: ing.calories, protein: ing.protein, carbs: ing.carbs, fat: ing.fat,
                      }}
                      momentLabel=""
                      rechts={`${ing.amount}${eenheid(ing.unit)}`}
                      isMobile={isMobile}
                      acties={[]}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </BladModal>
      </div>
    )
  }

  // ── DAYS LIST ──
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: isMobile ? '0.625rem 0.75rem' : '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UtensilsCrossed size={14} color="#fff" />
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#fff', letterSpacing: '-0.01em' }}>Voeding</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{mealData.loggingDays}/7 dagen</span>
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
                  <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#fff', opacity: mealData.plan.isActive ? 1 : 0.45, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mealData.plan.name || 'Mealplan'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{mealData.plan.isActive ? 'Actief' : 'Concept'}</div>
                </>
              ) : (
                <div style={{ fontSize: '0.72rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)' }}>Geen plan</div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
              {db && (
                <button
                  onClick={() => setShowGenerateModal(true)}
                  title="Automatisch plan genereren"
                  style={{
                    padding: isMobile ? '0.3rem 0.4rem' : '0.35rem 0.5rem',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px', color: '#fff',
                    fontSize: '0.72rem', fontWeight: '700',
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
                background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '8px', color: '#fff', fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 800,
                cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '34px'
              }}
            >
              <BarChart3 size={13} /> Plan Analyzer
            </button>
          </div>
        )}

        {/* Waterdoel — in liters op de klant (clients.water_intake_target). De
            fles op de maaltijdpagina rekent daarmee; 3 liter is de standaard
            als je niets invult. */}
        <WaterDoel client={client} db={db} isMobile={isMobile} />

        {mealData.loggingDays > 0 && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem' : '0.5rem', borderRight: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>GEM KCAL</div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{mealData.avgCalories}</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: isMobile ? '0.4rem' : '0.5rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: '-0.01em', marginBottom: '0.1rem' }}>LOG DAGEN</div>
              <div style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{mealData.loggingDays}<span style={{ fontSize: '0.72rem', opacity: 0.4 }}>/7</span></div>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {days.length > 0 ? (
            <div style={{ padding: isMobile ? '0.375rem 0.5rem' : '0.5rem 0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em', marginBottom: '0.25rem' }}>Dagelijks</div>
              {days.map((day, idx) => {
                const d = dailyLog[day]
                const calPct = targets ? pct(d.calories, targets.calories) : null
                return (
                  <button key={day} onClick={() => { setSelectedDay(day); setView('detail') }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.35rem 0.25rem', borderBottom: idx < days.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', background: 'transparent', border: 'none', cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>{formatDate(day)}</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>{d.count}x</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: calPct !== null ? pctColor(calPct) : '#fff' }}>{d.calories}</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)' }}>E:{Math.round(d.protein)}</span>
                      <ChevronRight size={12} color="rgba(255,255,255,0.15)" />
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem' }}>Geen voedingsdata</div>
          )}

          {/* Supplementen horen bij voeding, dus hier en niet in een eigen
              kolom. Toont zichzelf niet als er geen supplementplan is. */}
          {db && client?.id && (
            <SupplementTrouw db={db} client={client} isMobile={isMobile} />
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
