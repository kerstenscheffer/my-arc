// src/modules/nutrition-intake/NutritionIntakePage.jsx
// NUTRITION INTAKE v8.1
// Conversational one-question-at-a-time flow — identiek aan Phase 1
// Paginastructuur identiek aan PublicIntakePage

import React, { useState, useEffect } from 'react'
import DatabaseService from '../../services/DatabaseService'
import { findClient } from '../../lib/publicIntakeApi'
import './services/NutritionIntakeService'
import EatPatternFlow   from './components/nutrition-flow/EatPatternFlow'
import KnowledgeFlow    from './components/nutrition-flow/KnowledgeFlow'
import RestrictionsFlow from './components/nutrition-flow/RestrictionsFlow'
import PracticalFlow    from './components/nutrition-flow/PracticalFlow'
import ExtrasFlow       from './components/nutrition-flow/ExtrasFlow'

const isMobileCheck = () => window.innerWidth <= 768

const FLOWS = [
  { id: 'eat_pattern',  label: 'Eetpatroon' },
  { id: 'knowledge',    label: 'Kennis' },
  { id: 'restrictions', label: 'Restricties' },
  { id: 'practical',    label: 'Praktisch' },
  { id: 'extras',       label: 'Extras' },
]

const TABS = [
  { label: 'GEGEVENS' },
  { label: 'VOEDING' },
  { label: 'TRAINING' },
]

const GOAL_LABELS = {
  fat_loss: 'Vetverlies', muscle_gain: 'Spieropbouw',
  recomp: 'Recomp', general_fitness: 'Fitter worden',
}

function mapToNutritionPreferences(flowData) {
  const allergenErnst = flowData.allergen_ernst || {}
  const selectedAllergens = Object.entries(allergenErnst).filter(([, e]) => e === 'volledig').map(([id]) => id)
  const intolerances      = Object.entries(allergenErnst).filter(([, e]) => e === 'beperkt').map(([id]) => id)

  return {
    guidance_level: { guidance_level: flowData.guidance_level || 'strict' },
    life_context: {
      weekly_budget:      flowData.weekly_budget      || null,
      cooking_preference: flowData.cooking_preference || null,
    },
    allergens: {
      diet_preference:    flowData.diet_preference  || 'geen',
      selected_allergens: selectedAllergens,
      intolerances,
      custom_allergens:   flowData.allergen_overig  || null,
    },
    meal_schedule: {
      num_meals: flowData.num_meals ? parseInt(flowData.num_meals) : 4,
    },
    wishes: {
      // Maaltijdpatroon — drill-down categorieën en subcategorieën
      ontbijt_categories:      flowData.ontbijt_categories     || [],
      ontbijt_subs:            flowData.ontbijt_subs           || [],
      ontbijt_custom:          flowData.ontbijt_custom         || {},
      ontbijt_text:            flowData.ontbijt_text           || {},
      lunch_categories:        flowData.lunch_categories       || [],
      lunch_subs:              flowData.lunch_subs             || [],
      lunch_custom:            flowData.lunch_custom           || {},
      lunch_text:              flowData.lunch_text             || {},
      diner_categories:        flowData.diner_categories       || [],
      diner_subs:              flowData.diner_subs             || [],
      diner_custom:            flowData.diner_custom           || {},
      diner_text:              flowData.diner_text             || {},
      // Restricties
      niet_lekker:             flowData.niet_lekker            || [],
      niet_lekker_overig:      flowData.niet_lekker_overig     || null,
      absoluut_niet:           (flowData.niet_lekker || []).join(', ') || null,
      // Wat werkt
      wat_werkte:              flowData.wat_werkte             || null,
      wat_werkte_toelichting:  flowData.wat_werkte_toelichting || null,
    },
    supplement_preferences: {
      openness: flowData.supps_openheid || null,
    },
    cheat_meals: {
      frequency:        flowData.cheat_aanpak || null,
      social_frequency: flowData.sociaal_eten || null,
    },
    practical_info: {
      macros_kennis:    flowData.macros_kennis    || null,
      calorieen_geteld: flowData.calorieen_geteld || null,
      plan_gevolgd:     flowData.plan_gevolgd     || null,
    },
  }
}

export default function NutritionIntakePage() {
  const [isMobile, setIsMobile] = useState(isMobileCheck())
  const storedEmail = (() => { try { return localStorage.getItem('myarc_intake_email') } catch { return null } })()

  const [showEmailLookup, setShowEmailLookup] = useState(!storedEmail)
  const [email, setEmail]               = useState(storedEmail || '')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError]     = useState(null)
  const [clientId, setClientId]         = useState(null)
  const [clientData, setClientData]     = useState(null)
  const [activeFlow, setActiveFlow]     = useState(0)
  const [flowData, setFlowData]         = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess]       = useState(false)
  const [error, setError]               = useState(null)

  useEffect(() => {
    const h = () => setIsMobile(isMobileCheck())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  useEffect(() => {
    if (!storedEmail) return
    setEmailLoading(true)
    findClient(storedEmail)
      .then((data) => {
        if (data) {
          setClientId(data.id); setClientData(data)
          setFlowData(prev => ({ ...prev, target_calories: data.target_calories }))
          setShowEmailLookup(false)
        } else setShowEmailLookup(true)
        setEmailLoading(false)
      })
      .catch(() => { setShowEmailLookup(true); setEmailLoading(false) })
  }, [])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setEmailError('Vul een email adres in'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Vul een geldig email adres in'); return }
    setEmailLoading(true); setEmailError(null)
    try {
      const data = await findClient(email)
      if (!data) { setEmailError('Geen account gevonden.'); setEmailLoading(false); return }
      setClientId(data.id); setClientData(data)
      setFlowData(prev => ({ ...prev, target_calories: data.target_calories }))
      setShowEmailLookup(false); setEmailLoading(false)
    } catch { setEmailError('Er ging iets mis.'); setEmailLoading(false) }
  }

  const handleFlowNext = () => {
    console.log(`✅ [${FLOWS[activeFlow]?.id}] Flow voltooid. Data:`, flowData)
    if (activeFlow < FLOWS.length - 1) {
      setActiveFlow(activeFlow + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else handleSubmit()
  }

  const handleFlowBack = () => {
    if (activeFlow > 0) {
      setActiveFlow(activeFlow - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const prefs = mapToNutritionPreferences(flowData)
      console.log('💾 [submit] Opslaan naar nutrition_preferences:', prefs)
      await DatabaseService.saveNutritionPreferences(clientId, {
        calorie_target: clientData?.target_calories || clientData?.tdee || null,
        tdee: clientData?.tdee || null,
        surplus: clientData?.surplus || 0,
        ...prefs,
      })
      console.log('✅ [submit] Opgeslagen voor client:', clientId)
      try {
        const IntakeFlowService = (await import('./services/IntakeFlowService')).default
        await new IntakeFlowService(DatabaseService.supabase).processIntake(clientId, prefs)
        console.log('✅ [submit] IntakeFlowService klaar')
      } catch (e) { console.error('❌ IntakeFlowService CRASHED:', e.message) }
      setIsSuccess(true); setIsSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => { window.location.href = '/myintake?phase=3' }, 2000)
    } catch (err) {
      console.error('❌ handleSubmit failed:', err)
      alert('Er ging iets mis bij het opslaan.')
      setIsSubmitting(false)
    }
  }

  const activeFlowId = FLOWS[activeFlow]?.id

  const handleFlowDataChange = (newData) => {
    setFlowData(newData)
    const changedKeys = Object.keys(newData).filter(k => newData[k] !== flowData[k])
    if (changedKeys.length > 0) {
      console.log(`📝 [${activeFlowId}] Data update:`, changedKeys.reduce((acc, k) => ({ ...acc, [k]: newData[k] }), {}))
    }
  }

  const flowProps = {
    data: flowData,
    onChange: handleFlowDataChange,
    onNext: handleFlowNext,
    onBack: activeFlow > 0 ? handleFlowBack : null,
    isMobile,
  }

  if (showEmailLookup) return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <StickyHeader isMobile={isMobile} />
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: isMobile ? '3rem 1rem 4rem' : '4rem 1.25rem 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Voedingsintake</div>
          <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Vul je email in om te beginnen</div>
        </div>
        <form onSubmit={handleEmailSubmit}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.nl" autoFocus disabled={emailLoading}
            style={{ width: '100%', padding: isMobile ? '0.85rem 1rem' : '0.9rem 1rem', fontSize: isMobile ? '0.9rem' : '0.95rem', background: '#0a0a0a', border: `1px solid ${emailError ? '#dc2626' : 'rgba(255,215,0,0.25)'}`, color: '#fff', outline: 'none', textAlign: 'center', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '0.75rem' }} />
          {emailError && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>{emailError}</div>}
          <button type="submit" disabled={emailLoading} style={{ width: '100%', padding: isMobile ? '0.9rem' : '0.95rem', fontSize: isMobile ? '0.8rem' : '0.85rem', fontWeight: 800, color: '#000', background: emailLoading ? 'rgba(255,215,0,0.4)' : 'linear-gradient(90deg, #FFD700, #FFA500)', border: 'none', cursor: emailLoading ? 'not-allowed' : 'pointer', minHeight: '44px', touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', letterSpacing: '0.04em', fontFamily: 'inherit' }}>
            {emailLoading ? 'Zoeken...' : 'DOORGAAN →'}
          </button>
        </form>
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: isMobile ? '0.6rem' : '0.62rem', color: 'rgba(255,255,255,0.18)' }}>Gebruik het email adres dat je bij je coach hebt opgegeven</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (emailLoading) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', margin: '0 auto 0.75rem', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,215,0,0.6)', fontWeight: 700 }}>Laden...</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (isSuccess) return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <span style={{ fontSize: '1.2rem', color: '#FFD700' }}>✓</span>
        </div>
        <div style={{ fontSize: isMobile ? '1.3rem' : '1.5rem', fontWeight: 900, color: '#FFD700', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>Voeding opgeslagen!</div>
        <div style={{ fontSize: isMobile ? '0.68rem' : '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Je coach ontvangt een melding. Je wordt doorgestuurd...</div>
        <div style={{ width: '36px', height: '36px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', margin: '1.5rem auto 0', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#000' }}>
      <StickyHeader isMobile={isMobile} />
      <div style={{ position: 'sticky', top: isMobile ? '41px' : '49px', zIndex: 40, background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex' }}>
        {TABS.map((tab, i) => {
          const isActive = i === 1; const isCompleted = i === 0
          return (
            <div key={tab.label} style={{ flex: 1, padding: isMobile ? '0.55rem 0' : '0.6rem 0', textAlign: 'center', position: 'relative' }}>
              <div style={{ fontSize: isMobile ? '0.42rem' : '0.45rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#FFD700' : isCompleted ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                {isCompleted && <span style={{ fontSize: '0.4rem' }}>✓</span>}
                {tab.label}
              </div>
              {isActive && <div style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: '2px', background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '1px 1px 0 0' }} />}
            </div>
          )
        })}
      </div>

      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        {clientData && (clientData.primary_goal || clientData.motivation) && (
          <div style={{ borderBottom: '1px solid rgba(255,215,0,0.06)', padding: isMobile ? '0.6rem 1rem' : '0.7rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ width: '2px', background: 'rgba(255,215,0,0.35)', borderRadius: '2px', alignSelf: 'stretch', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              {clientData.primary_goal && <div style={{ fontSize: '0.42rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>{GOAL_LABELS[clientData.primary_goal]}{clientData.target_weight ? ` · ${clientData.target_weight} kg` : ''}</div>}
              {clientData.motivation && <div style={{ fontSize: isMobile ? '0.62rem' : '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500, lineHeight: 1.5, fontStyle: 'italic', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>"{clientData.motivation}"</div>}
            </div>
          </div>
        )}

        <ProgressBar activeFlow={activeFlow} totalFlows={FLOWS.length} isMobile={isMobile} />

        {activeFlow === 0 && <EatPatternFlow  {...flowProps} />}
        {activeFlow === 1 && <KnowledgeFlow   {...flowProps} />}
        {activeFlow === 2 && <RestrictionsFlow {...flowProps} />}
        {activeFlow === 3 && <PracticalFlow   {...flowProps} />}
        {activeFlow === 4 && <ExtrasFlow      {...flowProps} onNext={handleFlowNext} />}

        {isSubmitting && (
          <div style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '2px solid rgba(255,215,0,0.15)', borderTopColor: '#FFD700', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function StickyHeader({ isMobile }) {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: isMobile ? '0.7rem 1rem' : '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', fontWeight: 900, color: '#FFD700', letterSpacing: '0.12em' }}>MY ARC</div>
      <div style={{ fontSize: '0.48rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Intake Formulier</div>
    </div>
  )
}

function ProgressBar({ activeFlow, totalFlows, isMobile }) {
  const pct = Math.round((activeFlow / totalFlows) * 100)
  return (
    <div style={{ padding: isMobile ? '0.75rem 1rem 0.5rem' : '0.85rem 1.25rem 0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <div style={{ fontSize: '0.45rem', fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Voedingsintake</div>
        <div style={{ fontSize: '0.45rem', fontWeight: 800, color: 'rgba(255,215,0,0.5)', letterSpacing: '0.04em' }}>{pct}%</div>
      </div>
      <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', borderRadius: '1px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #FFD700, #FFA500)', borderRadius: '1px', transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}
