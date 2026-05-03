// src/modules/client-journey/components/calls/IntakeNutritionStep4.jsx
// v3 — Fixed: current_supplements[] (was current_supps), wishes.priority_ranking, social_types
import React from 'react'
import { CheckCircle, ExternalLink } from 'lucide-react'
import { C, StatBar, NoteField } from './IntakeCallHelpers'

const HERO = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80'

const PLAN_TYPES = [
  { id: 'strict', label: 'Strict Coachplan', desc: 'Exact mealplan met grammen, vaste structuur' },
  { id: 'flexible', label: 'Flexibel Plan', desc: 'Mealplan met swap opties, meer vrijheid' },
  { id: 'free', label: 'Vrij met Richtlijnen', desc: 'Alleen targets, client kiest zelf' }
]

const LEGACY_TO_NEW = { 'A': 'strict', 'B': 'flexible', 'C': 'free' }

const priorityLabels = { variatie: 'Variatie', simpelheid: 'Simpelheid', smaak: 'Smaak', prijs: 'Lage prijs', snelheid: 'Snelle bereiding', gezondheid: 'Gezondheid', portiegrootte: 'Portiegrootte' }

export default function IntakeNutritionStep4({ cd, np, prac, stepNotes, setStepNotes, stepActions, setStepActions, isMobile, onBack }) {
  const intakeLevel = np?.guidance_level?.guidance_level || null
  const currentSelection = stepNotes.nutrition_plan_type || intakeLevel || ''
  const selectedPlan = LEGACY_TO_NEW[currentSelection] || currentSelection

  const mealsPerDay = cd.meals_per_day || np?.meal_schedule?.num_meals || 5
  const currentDays = stepNotes.current_days || []
  const dreamDays = stepNotes.dream_days || []
  const lc = np?.life_context || {}
  const cm = np?.cheat_meals || {}
  const sp = np?.supplement_preferences || {}
  const wi = np?.wishes || {}
  const tr = np?.training || {}

  const cookLabels = { graag: 'Kookt graag', neutraal: 'Neutraal', niet_graag: 'Simpel & snel' }
  const cookingPref = cookLabels[lc.cooking_preference || prac?.cooking_preference] || cd.cooking_skill || '—'

  const currentMealsFilled = currentDays.reduce((acc, d) => acc + d.meals.filter(m => m.value).length, 0)
  const dreamMealsFilled = dreamDays.reduce((acc, d) => acc + d.meals.filter(m => m.value).length, 0)

  // Targets — np first, fallback cd
  const kcalTarget = np?.calorie_target || cd.target_calories || cd.calorie_target

  const summaryStats = [
    { label: 'KCAL', value: kcalTarget || '—', unit: '/dag', color: C.gold },
    { label: 'EIWIT', value: cd.target_protein || '—', unit: 'g' },
    { label: 'MAALTIJDEN', value: mealsPerDay, unit: '/dag' },
    { label: 'KOKEN', value: cookingPref }
  ]

  const hasLoggedData = currentDays.length > 0 || dreamDays.length > 0
  const loggedStats = []
  if (currentDays.length > 0) loggedStats.push({ label: 'DAGEN GELOGD', value: currentDays.length }, { label: 'MAALTIJDEN', value: currentMealsFilled })
  if (dreamDays.length > 0) loggedStats.push({ label: 'DROOMDAGEN', value: dreamDays.length }, { label: 'DROOMMAALTIJDEN', value: dreamMealsFilled })

  // current_supplements — beide veld namen afgedekt
  const currentSupps = sp.current_supplements?.length > 0
    ? sp.current_supplements.join(', ')
    : sp.current_supps || null

  const handleOpenPlan = async () => {
    let planId = null
    try {
      const { default: DatabaseService } = await import('../../../../services/DatabaseService')
      const { data: plans } = await DatabaseService.supabase
        .from('client_meal_plans')
        .select('id')
        .eq('client_id', cd.id)
        .eq('is_active', false)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (plans?.[0]) planId = plans[0].id
    } catch (e) { console.warn('Could not fetch concept plan:', e) }
    if (planId) { window.location.hash = `ai-meals:${planId}` } else { window.location.hash = 'ai-meals' }
    window.location.reload()
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', height: '90px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${HERO})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0a0a0a 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle size={16} color={C.green} />
          <span style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: 800, color: C.text }}>Voeding bevestigen</span>
        </div>
      </div>

      {/* Samenvatting */}
      <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SAMENVATTING</div>
      <StatBar isMobile={isMobile} stats={summaryStats} />
      {hasLoggedData && <StatBar isMobile={isMobile} stats={loggedStats} />}

      {/* Extra context */}
      {(tr.training_days?.length > 0 || lc.weekly_budget || cm.frequency) && (
        <StatBar isMobile={isMobile} stats={[
          tr.training_days?.length > 0 ? { label: 'TRAINING', value: `${tr.training_days.length}x/week`, color: C.green } : null,
          lc.weekly_budget ? { label: 'BUDGET', value: `€${lc.weekly_budget}/wk` } : null,
          cm.frequency ? { label: 'CHEAT', value: { nooit: 'Geen', '1x_week': '1x/wk', '2x_week': '2x/wk', weekend: 'Weekend', als_nodig: 'Als nodig' }[cm.frequency] || cm.frequency } : null
        ].filter(Boolean)} />
      )}

      {/* Plan type kiezen */}
      <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        WELK TYPE MEALPLAN?
        {intakeLevel && (
          <span style={{ marginLeft: '0.3rem', color: C.gold, fontWeight: 800 }}>
            (client koos: {PLAN_TYPES.find(p => p.id === intakeLevel)?.label || intakeLevel})
          </span>
        )}
      </div>
      <div style={{ padding: '0.25rem 0.75rem 0.4rem' }}>
        {PLAN_TYPES.map(pt => {
          const active = selectedPlan === pt.id
          return (
            <button key={pt.id} onClick={() => setStepNotes(p => ({ ...p, nutrition_plan_type: pt.id }))} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.625rem', marginBottom: '0.2rem',
              background: active ? 'rgba(16,185,129,0.06)' : 'transparent',
              border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : C.borderSub}`,
              borderRadius: 0, cursor: 'pointer',
              touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
              minHeight: '44px', textAlign: 'left'
            }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${active ? C.green : C.text25}`,
                background: active ? C.green : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {active && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#000' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 700, color: active ? C.text : C.text50 }}>{pt.label}</span>
                  {intakeLevel === pt.id && (
                    <span style={{ fontSize: '0.35rem', fontWeight: 800, color: C.gold, background: C.goldBg, padding: '0.04rem 0.2rem', borderRadius: '2px', textTransform: 'uppercase' }}>CLIENT KEUZE</span>
                  )}
                </div>
                <div style={{ fontSize: isMobile ? '0.55rem' : '0.6rem', fontWeight: 500, color: C.text25, marginTop: '0.05rem' }}>{pt.desc}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Allergieën recap */}
      {(cd.allergies || cd.intolerances || np?.allergens?.selected_allergens?.length > 0 || (np?.allergens?.diet_preference && np.allergens.diet_preference !== 'geen')) && (
        <div style={{ borderLeft: `3px solid ${C.red}` }}>
          <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ONTHOUD BIJ PLAN MAKEN</div>
          <div style={{ padding: '0.15rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}` }}>
            {np?.allergens?.selected_allergens?.length > 0 && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.red, padding: '0.1rem 0' }}>
                Allergieën: {np.allergens.selected_allergens.join(', ')}
              </div>
            )}
            {np?.allergens?.diet_preference && np.allergens.diet_preference !== 'geen' && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.amber, padding: '0.1rem 0' }}>
                Dieet: {np.allergens.diet_preference}
              </div>
            )}
            {cd.allergies && !np?.allergens?.selected_allergens?.length && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.red, padding: '0.1rem 0' }}>Allergieën: {cd.allergies}</div>
            )}
            {cd.intolerances && <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 700, color: C.amber, padding: '0.1rem 0' }}>Intoleranties: {cd.intolerances}</div>}
          </div>
        </div>
      )}

      {/* Supplementen recap */}
      {(sp.openness || currentSupps) && (
        <div style={{ borderLeft: `3px solid ${C.blue}` }}>
          <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SUPPLEMENTEN</div>
          <div style={{ padding: '0.15rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}` }}>
            {sp.openness && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>
                Openheid: {{ ja_graag: 'Open voor supps', basics: 'Alleen basis', liever_niet: 'Liever niet', nee: 'Geen supps' }[sp.openness] || sp.openness}
              </div>
            )}
            {currentSupps && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>
                Neemt nu: {currentSupps}
              </div>
            )}
            {(sp.budget || sp.supp_budget) && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>
                Budget: €{sp.budget || sp.supp_budget}/mnd
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wensen recap — incl. priority_ranking + social_types */}
      {wi && (wi.desired_ingredients || wi.current_eating || wi.favorite_meals || wi.absolute_no || wi.priority_ranking?.length > 0 || cm.social_types?.length > 0) && (
        <div style={{ borderLeft: `3px solid ${C.gold}` }}>
          <div style={{ padding: '0.4rem 0.75rem 0.15rem', fontSize: '0.4rem', fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>CLIENT WENSEN</div>
          <div style={{ padding: '0.15rem 0.75rem 0.35rem', borderBottom: `1px solid ${C.borderSub}` }}>
            {wi.desired_ingredients && <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>Wil graag: {wi.desired_ingredients}</div>}
            {wi.absolute_no && <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.red, padding: '0.1rem 0' }}>Absoluut niet: {wi.absolute_no}</div>}
            {wi.current_eating && <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>Eetpatroon: {wi.current_eating}</div>}
            {wi.favorite_meals && <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.green, padding: '0.1rem 0' }}>Favorieten: {wi.favorite_meals}</div>}
            {wi.priority_ranking?.length > 0 && (
              <div style={{ padding: '0.1rem 0' }}>
                <span style={{ fontSize: '0.4rem', fontWeight: 700, color: C.text25, textTransform: 'uppercase' }}>PRIORITEIT: </span>
                <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.gold }}>
                  {wi.priority_ranking.map((p, i) => `${i + 1}. ${priorityLabels[p] || p}`).join(' · ')}
                </span>
              </div>
            )}
            {cm.social_types?.length > 0 && (
              <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', fontWeight: 600, color: C.text50, padding: '0.1rem 0' }}>
                Sociale situaties: {cm.social_types.join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      <NoteField label="NOTITIES VOEDING" value={stepNotes.nutrition} onChange={v => setStepNotes(p => ({ ...p, nutrition: v }))} isMobile={isMobile} />
      <NoteField label="ACTIES" value={stepActions.nutrition} onChange={v => setStepActions(p => ({ ...p, nutrition: v }))} color={C.gold} placeholder="Bijv: mealplan maken met 5 maaltijden, prep schema uitwerken..." isMobile={isMobile} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: isMobile ? '0.75rem' : '1rem' }}>
        <button onClick={handleOpenPlan} style={{
          width: '100%', padding: '0.625rem',
          background: `linear-gradient(90deg, ${C.gold}, #D4AF37)`,
          border: 'none', borderRadius: 0, color: '#000',
          fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: 800,
          cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
          minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
        }}>
          <ExternalLink size={16} />
          OPEN PLAN ANALYZER
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onBack} style={{
            padding: '0.625rem 1rem', background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 0, color: C.text50, fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 700,
            cursor: 'pointer', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: '44px'
          }}>← TERUG</button>
          <div style={{
            flex: 1, padding: '0.625rem', textAlign: 'center',
            background: selectedPlan ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${selectedPlan ? 'rgba(16,185,129,0.2)' : C.borderSub}`,
            borderRadius: 0, minHeight: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 800, color: selectedPlan ? C.green : C.text25 }}>
              {selectedPlan ? `✓ ${PLAN_TYPES.find(p => p.id === selectedPlan)?.label || selectedPlan}` : 'KIES PLAN TYPE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
