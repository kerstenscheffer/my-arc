// src/modules/client-meal-base/components/DayTemplatesSectionWrapper.jsx
// ✅ PREMIUM v2.0 - ULTRA-CLEAN GLASSMORPHIC DESIGN
// 🎯 WorkoutPhotoSlider Norm Applied
import React, { useState, useEffect } from 'react'
import { FileText } from 'lucide-react'
import DayTemplatesSection from './DayTemplatesSection'
import ApplyTemplateModal from './ApplyTemplateModal'
import DayTemplateBuilder from './DayTemplateBuilder'

export default function DayTemplatesSectionWrapper({ 
  db, 
  clientId, 
  activePlan,
  onPlanUpdate,
  onNavigateToDay
}) {
  const isMobile = window.innerWidth <= 768
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [customMeals, setCustomMeals] = useState([])

  useEffect(() => {
    if (clientId && db) {
      loadTemplates()
      loadCustomMeals()
    }
  }, [clientId, db])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await db.getClientDayTemplates(clientId)
      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const loadCustomMeals = async () => {
    try {
      const { data, error } = await db.supabase
        .from('ai_meals')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCustomMeals(data || [])
    } catch (error) {
      console.error('Failed to load custom meals:', error)
      setCustomMeals([])
    }
  }

  const handleCreateTemplate = () => {
    setShowBuilder(true)
  }

  const handleSaveTemplate = async (templateData) => {
    try {
      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0

      if (templateData.meals.breakfast) {
        totalCalories += templateData.meals.breakfast.calories || 0
        totalProtein += templateData.meals.breakfast.protein || 0
        totalCarbs += templateData.meals.breakfast.carbs || 0
        totalFat += templateData.meals.breakfast.fat || 0
      }

      if (templateData.meals.lunch) {
        totalCalories += templateData.meals.lunch.calories || 0
        totalProtein += templateData.meals.lunch.protein || 0
        totalCarbs += templateData.meals.lunch.carbs || 0
        totalFat += templateData.meals.lunch.fat || 0
      }

      if (templateData.meals.dinner) {
        totalCalories += templateData.meals.dinner.calories || 0
        totalProtein += templateData.meals.dinner.protein || 0
        totalCarbs += templateData.meals.dinner.carbs || 0
        totalFat += templateData.meals.dinner.fat || 0
      }

      if (templateData.meals.snacks && Array.isArray(templateData.meals.snacks)) {
        templateData.meals.snacks.forEach(snack => {
          totalCalories += snack.calories || 0
          totalProtein += snack.protein || 0
          totalCarbs += snack.carbs || 0
          totalFat += snack.fat || 0
        })
      }

      const { data, error } = await db.supabase
        .from('ai_day_templates')
        .insert({
          client_id: clientId,
          name: templateData.name,
          meals: templateData.meals,
          total_calories: Math.round(totalCalories),
          total_protein: Math.round(totalProtein),
          total_carbs: Math.round(totalCarbs),
          total_fat: Math.round(totalFat)
        })
        .select()
        .single()

      if (error) throw error

      alert('✅ Template opgeslagen!')
      setShowBuilder(false)
      await loadTemplates()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('❌ Opslaan mislukt. Probeer opnieuw.')
    }
  }

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template)
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      return
    }

    try {
      await db.deleteClientDayTemplate(templateId)
      await loadTemplates()
      alert('✅ Template verwijderd!')
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('❌ Verwijderen mislukt. Probeer opnieuw.')
    }
  }

  const handleApplySuccess = async (appliedDay) => {
    console.log('✅ [DayTemplatesSectionWrapper] Template applied to:', appliedDay)
    setSelectedTemplate(null)
    await loadTemplates()
    
    if (onPlanUpdate) {
      console.log('🚀 [DayTemplatesSectionWrapper] Calling onPlanUpdate to reload dashboard')
      await onPlanUpdate()
    } else {
      console.warn('⚠️ [DayTemplatesSectionWrapper] onPlanUpdate callback not provided!')
    }

    if (onNavigateToDay && appliedDay) {
      console.log('📍 [DayTemplatesSectionWrapper] Navigating to day:', appliedDay)
      onNavigateToDay(appliedDay)
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: isMobile ? '2rem 1rem' : '3rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        {/* Premium Glassmorphic Spinner Container */}
        <div style={{
          width: isMobile ? '80px' : '100px',
          height: isMobile ? '80px' : '100px',
          borderRadius: isMobile ? '16px' : '20px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: isMobile ? '1.25rem' : '1.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Shine overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
            pointerEvents: 'none'
          }} />
          
          {/* Spinner */}
          <div style={{
            width: isMobile ? '36px' : '44px',
            height: isMobile ? '36px' : '44px',
            border: '3px solid rgba(139, 92, 246, 0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)',
            position: 'relative',
            zIndex: 1
          }} />
        </div>

        {/* Loading text container */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(23, 23, 23, 0.8) 0%, rgba(23, 23, 23, 0.6) 100%)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem 1.25rem' : '0.875rem 1.5rem',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '700',
            color: '#8b5cf6',
            margin: 0,
            letterSpacing: '-0.01em'
          }}>
            Templates laden...
          </p>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        minHeight: '400px'
      }}>
        {/* 🔥 PREMIUM HEADER */}
        <div style={{
          marginBottom: isMobile ? '1.5rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* Icon container with glow */}
          <div style={{
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: isMobile ? '14px' : '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.08) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 24px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Shine effect */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '40%',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            
            <FileText 
              size={isMobile ? 24 : 28} 
              color="#8b5cf6"
              strokeWidth={2.5}
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))',
                position: 'relative',
                zIndex: 1
              }}
            />
          </div>

          {/* Title container */}
          <div style={{
            textAlign: 'center'
          }}>
            <h2 style={{
              fontSize: isMobile ? '1.5rem' : '1.75rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              textShadow: '0 2px 12px rgba(139, 92, 246, 0.4)'
            }}>
              Day Templates
            </h2>
            <p style={{
              fontSize: isMobile ? '0.875rem' : '0.95rem',
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: 1.5,
              fontWeight: '600',
              margin: 0
            }}>
              Herbruikbare dagplanningen voor dagen die vaak terugkomen
            </p>
          </div>
        </div>

        {/* Templates Section */}
        <DayTemplatesSection
          templates={templates}
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          isMobile={isMobile}
        />
      </div>

      {/* Apply Template Modal */}
      {selectedTemplate && (
        <ApplyTemplateModal
          template={selectedTemplate}
          activePlan={activePlan}
          db={db}
          clientId={clientId}
          onClose={() => setSelectedTemplate(null)}
          onSuccess={handleApplySuccess}
          isMobile={isMobile}
        />
      )}

      {/* Template Builder Modal */}
      <DayTemplateBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={handleSaveTemplate}
        customMeals={customMeals}
        editingTemplate={null}
        isMobile={isMobile}
      />
    </>
  )
}
