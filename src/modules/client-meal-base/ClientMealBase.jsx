// src/modules/client-meal-base/ClientMealBase.jsx
// 🐛 ULTRA DEBUG VERSION - Complete flow tracing

import React, { useState, useEffect } from 'react'
import { X, Plus, ChevronDown } from 'lucide-react'
import StandardFoodsSection from './components/StandardFoodsSection'
import CustomMealsGrid from './components/CustomMealsGrid'
import DayTemplatesSection from './components/DayTemplatesSection'
import SelectMealModal from './components/SelectMealModal'
import ClientMealBuilder from './ClientMealBuilder'
import DayTemplateBuilder from './components/DayTemplateBuilder'

export default function ClientMealBase({ client, db, onClose }) {
  const isMobile = window.innerWidth <= 768
  
  console.log('🏗️ [ClientMealBase] COMPONENT MOUNTED')
  console.log('👤 [ClientMealBase] Client ID:', client?.id)
  
  const [loading, setLoading] = useState(true)
  const [standardFoods, setStandardFoods] = useState({
    protein: [null, null, null],
    carbs: [null, null, null],
    meal_prep: [null, null, null]
  })
  const [customMeals, setCustomMeals] = useState([])
  const [dayTemplates, setDayTemplates] = useState([])
  
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectModalConfig, setSelectModalConfig] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  const [expandedSections, setExpandedSections] = useState({
    standard: true,
    custom: true,
    templates: true
  })

  useEffect(() => {
    console.log('🔄 [ClientMealBase] useEffect triggered, loading data...')
    loadData()
  }, [client?.id])
  
  // 🐛 WATCH showSelectModal state changes
  useEffect(() => {
    console.log('🚨🚨🚨 [ClientMealBase] showSelectModal STATE CHANGED:', showSelectModal)
    console.log('📋 [ClientMealBase] selectModalConfig:', selectModalConfig)
  }, [showSelectModal, selectModalConfig])

  const loadData = async () => {
    console.log('📥 [ClientMealBase] Starting data load...')
    setLoading(true)
    
    try {
      // Load standard foods
      console.log('1️⃣ [ClientMealBase] Loading standard foods...')
      const standardData = await db.getClientStandardFoods(client.id)
      console.log('✅ [ClientMealBase] Standard foods loaded:', standardData)
      
      if (standardData) {
        setStandardFoods({
          protein: standardData.protein || [null, null, null],
          carbs: standardData.carbs || [null, null, null],
          meal_prep: standardData.meal_prep || [null, null, null]
        })
      }
      
      // Load custom meals
      console.log('2️⃣ [ClientMealBase] Loading custom meals...')
      const customData = await db.getClientCustomMeals(client.id)
      console.log('✅ [ClientMealBase] Custom meals loaded:', customData?.length || 0)
      setCustomMeals(customData || [])
      
      // Load day templates
      console.log('3️⃣ [ClientMealBase] Loading day templates...')
      const templates = await db.getClientDayTemplates(client.id)
      console.log('✅ [ClientMealBase] Day templates loaded:', templates?.length || 0)
      setDayTemplates(templates || [])
      
      console.log('✅✅✅ [ClientMealBase] ALL DATA LOADED SUCCESSFULLY')
    } catch (error) {
      console.error('❌ [ClientMealBase] Data load failed:', error)
    } finally {
      setLoading(false)
      console.log('🏁 [ClientMealBase] Loading complete')
    }
  }

  const handleSetStandardFood = (category, slotNumber) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯🎯🎯 [ClientMealBase] handleSetStandardFood CALLED')
    console.log('📦 [ClientMealBase] Parameters:', { category, slotNumber })
    console.log('📋 [ClientMealBase] Available custom meals:', customMeals.length)
    console.log('🧪 [ClientMealBase] Current showSelectModal:', showSelectModal)
    
    const config = { category, slotNumber }
    console.log('💾 [ClientMealBase] Setting selectModalConfig to:', config)
    setSelectModalConfig(config)
    
    console.log('🚀🚀🚀 [ClientMealBase] Setting showSelectModal to TRUE')
    setShowSelectModal(true)
    
    // Force immediate verification
    setTimeout(() => {
      console.log('⏱️ [ClientMealBase] Post-setState verification:')
      console.log('   showSelectModal should be true now')
      console.log('   Check if SelectMealModal renders below...')
    }, 100)
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  }

  const handleSelectMealForSlot = async (mealId) => {
    console.log('🎯 [ClientMealBase] handleSelectMealForSlot:', mealId)
    
    if (!selectModalConfig) {
      console.error('❌ [ClientMealBase] No selectModalConfig!')
      return
    }

    const { category, slotNumber } = selectModalConfig
    console.log(`💾 [ClientMealBase] Setting meal ${mealId} to ${category} slot ${slotNumber}`)

    try {
      await db.setClientStandardFood(
        client.id,
        category,
        slotNumber,
        mealId
      )
      console.log('✅ [ClientMealBase] Standard food saved to database')
      
      // Update local state
      setStandardFoods(prev => {
        const updated = { ...prev }
        updated[category] = [...prev[category]]
        updated[category][slotNumber - 1] = customMeals.find(m => m.id === mealId)
        console.log('✅ [ClientMealBase] Local state updated:', updated)
        return updated
      })
      
      // Close modal
      console.log('🚪 [ClientMealBase] Closing SelectMealModal')
      setShowSelectModal(false)
      setSelectModalConfig(null)
    } catch (error) {
      console.error('❌ [ClientMealBase] Failed to set standard food:', error)
    }
  }

  const handleRemoveStandardFood = async (category, slotNumber) => {
    console.log(`🗑️ [ClientMealBase] Removing ${category} slot ${slotNumber}`)
    
    try {
      await db.removeClientStandardFood(client.id, category, slotNumber)
      console.log('✅ [ClientMealBase] Standard food removed from database')
      
      setStandardFoods(prev => {
        const updated = { ...prev }
        updated[category] = [...prev[category]]
        updated[category][slotNumber - 1] = null
        console.log('✅ [ClientMealBase] Local state updated:', updated)
        return updated
      })
    } catch (error) {
      console.error('❌ [ClientMealBase] Failed to remove standard food:', error)
    }
  }

  const handleMealCreated = (newMeal) => {
    console.log('✨ [ClientMealBase] New meal created:', newMeal.name)
    setCustomMeals(prev => [...prev, newMeal])
    setShowBuilder(false)
    setEditingMeal(null)
  }

  const handleEditMeal = (meal) => {
    console.log('✏️ [ClientMealBase] Editing meal:', meal.name)
    setEditingMeal(meal)
    setShowBuilder(true)
  }

  const handleDeleteCustomMeal = async (mealId) => {
    console.log('🗑️ [ClientMealBase] Deleting custom meal:', mealId)
    
    if (!confirm('Deze meal verwijderen?')) return

    try {
      await db.deleteClientCustomMeal(client.id, mealId)
      console.log('✅ [ClientMealBase] Custom meal deleted from database')
      
      setCustomMeals(prev => prev.filter(m => m.id !== mealId))
      
      // Remove from standard foods if present
      const updatedStandard = { ...standardFoods }
      let changed = false
      
      Object.keys(updatedStandard).forEach(category => {
        updatedStandard[category] = updatedStandard[category].map(meal => {
          if (meal?.id === mealId) {
            changed = true
            return null
          }
          return meal
        })
      })
      
      if (changed) {
        console.log('✅ [ClientMealBase] Removed from standard foods')
        setStandardFoods(updatedStandard)
      }
    } catch (error) {
      console.error('❌ [ClientMealBase] Failed to delete custom meal:', error)
    }
  }

  const handleCreateTemplate = () => {
    console.log('📅 [ClientMealBase] Creating new template')
    setEditingTemplate(null)
    setShowTemplateBuilder(true)
  }

  const handleEditTemplate = (template) => {
    console.log('✏️ [ClientMealBase] Editing template:', template.name)
    setEditingTemplate(template)
    setShowTemplateBuilder(true)
  }

  const handleSaveTemplate = async (templateData) => {
    console.log('💾 [ClientMealBase] Saving template:', templateData)
    
    try {
      if (editingTemplate) {
        await db.updateClientDayTemplate(client.id, editingTemplate.id, templateData)
        console.log('✅ [ClientMealBase] Template updated')
        setDayTemplates(prev => 
          prev.map(t => t.id === editingTemplate.id ? { ...t, ...templateData } : t)
        )
      } else {
        const newTemplate = await db.createClientDayTemplate(client.id, templateData)
        console.log('✅ [ClientMealBase] Template created')
        setDayTemplates(prev => [...prev, newTemplate])
      }
      
      setShowTemplateBuilder(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('❌ [ClientMealBase] Failed to save template:', error)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    console.log('🗑️ [ClientMealBase] Deleting template:', templateId)
    
    if (!confirm('Deze template verwijderen?')) return

    try {
      await db.deleteClientDayTemplate(client.id, templateId)
      console.log('✅ [ClientMealBase] Template deleted')
      setDayTemplates(prev => prev.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('❌ [ClientMealBase] Failed to delete template:', error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const standardCount = Object.values(standardFoods).flat().filter(Boolean).length

  console.log('🎨 [ClientMealBase] RENDERING with state:')
  console.log('   showSelectModal:', showSelectModal)
  console.log('   selectModalConfig:', selectModalConfig)
  console.log('   customMeals count:', customMeals.length)

  return (
    <>
      {/* Main Modal Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? '0' : '1rem'
        }}
      >
        {/* Main Modal Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)',
            borderRadius: isMobile ? '0' : '24px',
            width: '100%',
            maxWidth: isMobile ? '100%' : '900px',
            height: isMobile ? '100vh' : '90vh',
            maxHeight: isMobile ? '100vh' : '90vh',
            border: isMobile ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
            boxShadow: isMobile ? 'none' : '0 20px 60px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            animation: isMobile ? 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16, 185, 129, 0.05)'
          }}>
            <div>
              <h2 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.25rem'
              }}>
                🍽️ Meal Base
              </h2>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: 0
              }}>
                Beheer standaard foods, custom meals & templates
              </p>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <X size={20} style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </button>
          </div>
          
          {/* Action Bar */}
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(16, 185, 129, 0.15)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <button
              onClick={() => {
                console.log('🆕 [ClientMealBase] Opening meal builder')
                setShowBuilder(true)
              }}
              style={{
                width: '100%',
                padding: isMobile ? '0.875rem' : '1rem',
                background: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '48px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Plus size={20} strokeWidth={2.5} />
              Nieuwe Meal Maken
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '1rem' : '1.25rem',
            WebkitOverflowScrolling: 'touch'
          }}>
            {loading ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.875rem'
              }}>
                Laden...
              </div>
            ) : (
              <>
                {/* Standard Foods Section */}
                <CollapsibleSection
                  title="⭐ Standaard Foods"
                  count={`${standardCount}/9`}
                  isExpanded={expandedSections.standard}
                  onToggle={() => toggleSection('standard')}
                  isMobile={isMobile}
                >
                  <StandardFoodsSection
                    standardFoods={standardFoods}
                    onSetFood={handleSetStandardFood}
                    onRemoveFood={handleRemoveStandardFood}
                    isMobile={isMobile}
                  />
                </CollapsibleSection>
                
                {/* Custom Meals Section */}
                <CollapsibleSection
                  title="🍳 Custom Meals"
                  count={customMeals.length}
                  isExpanded={expandedSections.custom}
                  onToggle={() => toggleSection('custom')}
                  isMobile={isMobile}
                >
                  <CustomMealsGrid
                    meals={customMeals}
                    onEdit={handleEditMeal}
                    onDelete={handleDeleteCustomMeal}
                    isMobile={isMobile}
                  />
                </CollapsibleSection>
                
                {/* Day Templates Section */}
                <CollapsibleSection
                  title="📅 Day Templates"
                  count={dayTemplates.length}
                  isExpanded={expandedSections.templates}
                  onToggle={() => toggleSection('templates')}
                  isMobile={isMobile}
                >
                  <DayTemplatesSection
                    templates={dayTemplates}
                    onCreateTemplate={handleCreateTemplate}
                    onEditTemplate={handleEditTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    isMobile={isMobile}
                  />
                </CollapsibleSection>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 🚨🚨🚨 SUB-MODALS - SelectMealModal */}
      {console.log('🔍 [ClientMealBase] Checking if SelectMealModal should render...')}
      {console.log('   showSelectModal:', showSelectModal)}
      {console.log('   Condition (showSelectModal === true):', showSelectModal === true)}
      
      {showSelectModal && (
        <>
          {console.log('✅✅✅ [ClientMealBase] SelectMealModal IS RENDERING!')}
          <SelectMealModal
            isOpen={showSelectModal}
            onClose={() => {
              console.log('🚪 [ClientMealBase] SelectMealModal onClose called')
              setShowSelectModal(false)
              setSelectModalConfig(null)
            }}
            meals={customMeals}
            onSelectMeal={handleSelectMealForSlot}
            category={selectModalConfig?.category}
            slotNumber={selectModalConfig?.slotNumber}
            isMobile={isMobile}
          />
        </>
      )}
      
      {showBuilder && (
        <ClientMealBuilder
          client={client}
          db={db}
          onClose={() => {
            console.log('🚪 [ClientMealBase] Meal builder closed')
            setShowBuilder(false)
            setEditingMeal(null)
          }}
          onMealCreated={handleMealCreated}
          editingMeal={editingMeal}
        />
      )}
      
      {showTemplateBuilder && (
        <DayTemplateBuilder
          isOpen={showTemplateBuilder}
          onClose={() => {
            console.log('🚪 [ClientMealBase] Template builder closed')
            setShowTemplateBuilder(false)
            setEditingTemplate(null)
          }}
          onSave={handleSaveTemplate}
          customMeals={customMeals}
          editingTemplate={editingTemplate}
          isMobile={isMobile}
        />
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  )
}

// Collapsible Section Component
function CollapsibleSection({ title, count, isExpanded, onToggle, children, isMobile }) {
  return (
    <div style={{
      background: 'rgba(16, 185, 129, 0.06)',
      border: '1px solid rgba(16, 185, 129, 0.15)',
      borderRadius: '12px',
      marginBottom: '1rem',
      overflow: 'hidden'
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: isMobile ? '1rem' : '1.125rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span style={{
            fontSize: isMobile ? '0.95rem' : '1.05rem',
            fontWeight: '700',
            color: '#fff'
          }}>
            {title}
          </span>
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '700',
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '0.25rem 0.5rem',
            borderRadius: '6px'
          }}>
            {count}
          </span>
        </div>
        
        <div style={{
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          transition: 'transform 0.3s ease',
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          <ChevronDown size={20} />
        </div>
      </button>
      
      {isExpanded && (
        <div style={{
          padding: isMobile ? '0 1rem 1rem' : '0 1.125rem 1.125rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.15)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {children}
        </div>
      )}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 2000px;
          }
        }
      `}</style>
    </div>
  )
}
