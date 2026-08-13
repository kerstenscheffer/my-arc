// src/modules/ai-meal-generator/MealPlanGenerator.jsx
// v2.0 — Gold/black CoachHub styling, no extra wrapper, full width

import { useState, useEffect } from 'react'
import { Users, BarChart3, AlertCircle, Check } from 'lucide-react'

import ClientSelector from './tabs/ClientSelector'
import MealSelector from './tabs/MealSelector'
import PlanBuilder from './tabs/PlanBuilder'
import PlanAnalyzer from './tabs/PlanAnalyzer'
import PlanActions from './tabs/PlanActions'

const G = {
  primary: '#FFD700',
  bg: 'rgba(255, 215, 0, 0.08)',
  bgStrong: 'rgba(255, 215, 0, 0.14)',
  border: 'rgba(255, 215, 0, 0.15)',
  borderActive: 'rgba(255, 215, 0, 0.4)',
  text: 'rgba(255, 215, 0, 0.6)'
}

// Alleen nog Client (om een klant te kiezen) + Analyzer. De oude bouw-tabs
// (Maaltijden/Bouwen/Opslaan) zijn uit de UI gehaald; hun code blijft als
// switch-case staan zodat er niks breekt. `idx` = de case-index in de switch.
const TABS = [
  { id: 'client',  idx: 0, label: 'Client',   icon: Users },
  { id: 'analyze', idx: 3, label: 'Analyzer', icon: BarChart3 }
]

export default function MealPlanGenerator({ db, clients = [], conceptPlanId, selectedClient: propSelectedClient }) {
  const isMobile = window.innerWidth <= 768
  const m = isMobile

  // Altijd direct op de Analyzer openen — client kies je via de inline picker in de tab-balk.
  const [activeTab, setActiveTab] = useState(3)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [selectedClient, setSelectedClient] = useState(propSelectedClient || null)
  const [clientProfile, setClientProfile] = useState(null)
  const [dailyTargets, setDailyTargets] = useState({ calories: 2000, protein: 150, carbs: 200, fat: 67 })
  const [mealsPerDay, setMealsPerDay] = useState(4)

  const [forcedMealsConfig, setForcedMealsConfig] = useState([])
  const [excludedIngredients, setExcludedIngredients] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [mealPreferences, setMealPreferences] = useState({ avoidRepeats: true, optimizeShopping: true, budgetTier: 'moderate' })

  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [analyzedData] = useState(null)
  const [planModifications, setPlanModifications] = useState({})

  const [resolvedClientId, setResolvedClientId] = useState(propSelectedClient?.id || null)

  useEffect(() => { if (conceptPlanId) setActiveTab(3) }, [conceptPlanId])

  useEffect(() => {
    if (propSelectedClient) {
      setSelectedClient(propSelectedClient)
      setResolvedClientId(propSelectedClient.id)
      setActiveTab(3) // meteen naar de Analyzer
    }
  }, [propSelectedClient])

  useEffect(() => {
    if (selectedClient?.id) {
      setResolvedClientId(selectedClient.id)
      loadClientProfile()
    }
  }, [selectedClient])

  const handleConceptLoaded = async (clientId) => {
    if (!clientId || resolvedClientId) return
    console.log('🔗 MealPlanGenerator | clientId resolved van concept plan:', clientId)
    setResolvedClientId(clientId)
    const found = clients.find(c => c.id === clientId)
    if (found) {
      setSelectedClient(found)
    } else if (db?.supabase) {
      try {
        const { data } = await db.supabase.from('clients').select('*').eq('id', clientId).single()
        if (data) setSelectedClient(data)
      } catch (e) { console.warn('Could not load client from concept plan:', e) }
    }
  }

  const loadClientProfile = async () => {
    if (!selectedClient) return
    try {
      setLoading(true)
      setError(null)
      const profile = {
        client_id: selectedClient.id,
        first_name: selectedClient.first_name,
        last_name: selectedClient.last_name,
        gender: selectedClient.gender || 'male',
        age: selectedClient.age || 30,
        height_cm: selectedClient.height || 180,
        current_weight_kg: parseFloat(selectedClient.current_weight) || 75,
        target_weight_kg: parseFloat(selectedClient.target_weight) || 75,
        activity_level: selectedClient.activity_level || 'moderate',
        primary_goal: selectedClient.primary_goal || 'maintain',
        target_calories: selectedClient.target_calories || dailyTargets.calories,
        target_protein_g: selectedClient.target_protein || dailyTargets.protein,
        target_carbs_g: selectedClient.target_carbs || dailyTargets.carbs,
        target_fat_g: selectedClient.target_fat || dailyTargets.fat,
        meals_per_day: mealsPerDay,
        budget_tier: 'moderate',
        meal_prep_preference: 'mixed',
        cooking_skill: selectedClient.cooking_skill || 'intermediate',
        dietary_type: selectedClient.dietary_type || 'omnivore',
        allergies: selectedClient.allergies
          ? (typeof selectedClient.allergies === 'string' ? selectedClient.allergies.split(',').map(s => s.trim()) : selectedClient.allergies)
          : [],
        intolerances: selectedClient.intolerances
          ? (typeof selectedClient.intolerances === 'string' ? selectedClient.intolerances.split(',').map(s => s.trim()) : selectedClient.intolerances)
          : []
      }
      setClientProfile(profile)
      if (selectedClient.target_calories) {
        setDailyTargets({
          calories: selectedClient.target_calories,
          protein: selectedClient.target_protein || 150,
          carbs: selectedClient.target_carbs || 200,
          fat: selectedClient.target_fat || 67
        })
      }
    } catch (err) {
      console.error('Error loading client profile:', err)
      setError('Kon client profiel niet laden')
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateApplied = (templateResult) => {
    setGeneratedPlan(templateResult)
    setSuccess(`✅ Template "${templateResult.templateUsed?.name}" toegepast!`)
    setTimeout(() => setSuccess(null), 3000)
    setActiveTab(3)
  }

  const renderTabContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem' }}>
          <div style={{ width: '28px', height: '28px', border: `2px solid ${G.border}`, borderTopColor: G.primary, borderRadius: '50%', animation: 'mgSpin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Laden</span>
        </div>
      )
    }

    switch (activeTab) {
      case 0: return (
        <ClientSelector
          db={db} clients={clients} selectedClient={selectedClient}
          setSelectedClient={setSelectedClient} clientProfile={clientProfile}
          dailyTargets={dailyTargets} setDailyTargets={setDailyTargets}
          mealsPerDay={mealsPerDay} setMealsPerDay={setMealsPerDay}
          onTemplateApplied={handleTemplateApplied} loading={loading} isMobile={m}
        />
      )
      case 1: return (
        <MealSelector
          db={db} selectedClient={selectedClient} clientProfile={clientProfile}
          forcedMealsConfig={forcedMealsConfig} setForcedMealsConfig={setForcedMealsConfig}
          excludedIngredients={excludedIngredients} setExcludedIngredients={setExcludedIngredients}
          selectedIngredients={selectedIngredients} setSelectedIngredients={setSelectedIngredients}
          mealPreferences={mealPreferences} setMealPreferences={setMealPreferences}
          mealsPerDay={mealsPerDay} isMobile={m}
        />
      )
      case 2: return (
        <PlanBuilder
          db={db} selectedClient={selectedClient} clientProfile={clientProfile}
          dailyTargets={dailyTargets} mealsPerDay={mealsPerDay}
          forcedMealsConfig={forcedMealsConfig} excludedIngredients={excludedIngredients}
          selectedIngredients={selectedIngredients} mealPreferences={mealPreferences}
          setGeneratedPlan={setGeneratedPlan} isMobile={m}
        />
      )
      case 3: return (
        <PlanAnalyzer
          db={db} generatedPlan={generatedPlan} analyzedData={analyzedData}
          planModifications={planModifications} setPlanModifications={setPlanModifications}
          dailyTargets={dailyTargets} isMobile={m}
          conceptPlanId={conceptPlanId} clientId={resolvedClientId}
          onConceptLoaded={handleConceptLoaded}
          onPlanActivated={() => {
            setSuccess('✅ Plan geactiveerd! Client kan het nu zien.')
            setTimeout(() => setSuccess(null), 5000)
          }}
        />
      )
      case 4: return (
        <PlanActions
          db={db} selectedClient={selectedClient} generatedPlan={generatedPlan}
          planModifications={planModifications} dailyTargets={dailyTargets}
          mealsPerDay={mealsPerDay} loading={loading} isMobile={m}
        />
      )
      default: return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ═══ TAB BAR + INLINE CLIENT PICKER — sticky ═══ */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: `1px solid ${G.border}`,
        background: 'rgba(10, 10, 10, 0.97)',
        position: 'sticky',
        top: 'calc(env(safe-area-inset-top, 0px) + 32px)',
        zIndex: 50,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = tab.idx === activeTab
            const isCompleted = generatedPlan && tab.idx < 3
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.idx)}
                style={{
                  minWidth: m ? '58px' : '80px',
                  padding: m ? '0.6rem 0.2rem' : '0.75rem 0',
                  background: 'transparent', border: 'none',
                  borderBottom: isActive ? `2px solid ${G.primary}` : '2px solid transparent',
                  color: isActive ? G.primary : isCompleted ? '#10b981' : 'rgba(255,255,255,0.35)',
                  fontSize: m ? '0.58rem' : '0.7rem', fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: m ? '0.15rem' : '0.3rem',
                  flexDirection: m ? 'column' : 'row',
                  touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em'
                }}
              >
                <Icon size={m ? 12 : 14} />
                {tab.label}
                {isCompleted && !isActive && <Check size={9} color="#10b981" />}
              </button>
            )
          })}
        </div>

        {/* Inline client picker — kies direct hier, geen aparte Client-tab nodig */}
        <div style={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          padding: m ? '0 0.5rem' : '0 0.75rem',
          borderLeft: `1px solid ${G.border}`,
          flexShrink: 0,
        }}>
          <Users size={11} color={G.text} style={{ flexShrink: 0 }} />
          <select
            value={selectedClient?.id || ''}
            onChange={e => {
              const client = (clients || []).find(c => c.id === e.target.value) || null
              setSelectedClient(client)
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: selectedClient ? G.primary : 'rgba(255,255,255,0.3)',
              fontSize: m ? '0.62rem' : '0.68rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
              maxWidth: m ? '100px' : '160px',
            }}
          >
            <option value="" style={{ background: '#1a1a1a', color: '#ccc' }}>Kies client…</option>
            {(clients || [])
              .slice()
              .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
              .map(c => (
                <option key={c.id} value={c.id} style={{ background: '#1a1a1a', color: '#fff' }}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* ═══ STATUS MESSAGES ═══ */}
      {(error || success) && (
        <div style={{ padding: m ? '0.4rem 0.75rem' : '0.5rem 1rem' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: m ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
              background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderLeft: '3px solid #ef4444', borderRadius: '4px',
              color: '#ef4444', fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 600
            }}>
              <AlertCircle size={13} />{error}
            </div>
          )}
          {success && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: m ? '0.4rem 0.625rem' : '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16,185,129,0.15)',
              borderLeft: '3px solid #10b981', borderRadius: '4px',
              color: '#10b981', fontSize: m ? '0.65rem' : '0.7rem', fontWeight: 600
            }}>
              <Check size={13} />{success}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB CONTENT ═══ */}
      <div style={{ minHeight: '60vh' }}>
        {renderTabContent()}
      </div>

      <style>{`@keyframes mgSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
