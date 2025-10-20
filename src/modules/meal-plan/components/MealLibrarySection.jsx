// src/modules/meal-plan/components/MealLibrarySection.jsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import StandardFoodsSection from '../../client-meal-base/components/StandardFoodsSection'
import CustomMealsGrid from '../../client-meal-base/components/CustomMealsGrid'
import SelectMealModal from '../../client-meal-base/components/SelectMealModal'
import ClientMealBuilder from '../../client-meal-builder/ClientMealBuilder'
import DayTemplatesSection from '../../client-meal-base/components/DayTemplatesSection'
import DayTemplateBuilder from '../../client-meal-base/components/DayTemplateBuilder'

export default function MealLibrarySection({ client, db, onMealCreated }) {
  const isMobile = window.innerWidth <= 768
  
  // State
  const [customMeals, setCustomMeals] = useState([])
  const [standardFoods, setStandardFoods] = useState({
    protein: [null, null, null],
    carbs: [null, null, null],
    meal_prep: [null, null, null]
  })
  const [dayTemplates, setDayTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Expand/collapse
  const [expandedSections, setExpandedSections] = useState({
    standard: false,
    custom: false,
    templates: false
  })
  
  // Modals
  const [showBuilder, setShowBuilder] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectModalConfig, setSelectModalConfig] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  // Load data
  useEffect(() => {
    if (client?.id) {
      loadData()
    }
  }, [client])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [meals, standards, templates] = await Promise.all([
        db.getClientCustomMeals(client.id),
        db.getClientStandardFoods(client.id),
        db.getClientDayTemplates(client.id)
      ])
      
      setCustomMeals(meals)
      setStandardFoods(standards)
      setDayTemplates(templates)
    } catch (error) {
      console.error('Failed to load meal library:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Handlers
  const handleSetStandardFood = (category, slotNumber) => {
    setSelectModalConfig({ category, slotNumber })
    setShowSelectModal(true)
  }
  
  const handleSelectMealForSlot = async (mealId) => {
    try {
      await db.setStandardFood(
        client.id,
        selectModalConfig.category,
        selectModalConfig.slotNumber,
        mealId
      )
      setShowSelectModal(false)
      setSelectModalConfig(null)
      await loadData()
    } catch (error) {
      console.error('Failed to set standard food:', error)
      alert('Kon niet opslaan: ' + error.message)
    }
  }
  
  const handleRemoveStandardFood = async (category, slotNumber) => {
    if (!confirm('Verwijder deze standaard meal?')) return
    
    try {
      await db.removeStandardFood(client.id, category, slotNumber)
      await loadData()
    } catch (error) {
      console.error('Failed to remove:', error)
    }
  }
  
  const handleDeleteCustomMeal = async (mealId) => {
    if (!confirm('Verwijder deze custom meal?')) return
    
    try {
      await db.deleteCustomMeal(client.id, mealId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('Kon niet verwijderen: ' + error.message)
    }
  }
  
  const handleEditMeal = (meal) => {
    setEditingMeal(meal)
    setShowBuilder(true)
  }
  
  const handleMealCreated = async () => {
    setShowBuilder(false)
    setEditingMeal(null)
    await loadData()
    onMealCreated?.()
  }
  
  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setShowTemplateBuilder(true)
  }
  
  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setShowTemplateBuilder(true)
  }
  
  const handleSaveTemplate = async (templateData) => {
    try {
      if (editingTemplate) {
        await db.updateDayTemplate(editingTemplate.id, {
          name: templateData.name,
          meals: templateData.meals
        })
      } else {
        await db.createDayTemplate(client.id, templateData)
      }
      setShowTemplateBuilder(false)
      setEditingTemplate(null)
      await loadData()
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Kon niet opslaan: ' + error.message)
    }
  }
  
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Verwijder deze template?')) return
    
    try {
      await db.deleteDayTemplate(client.id, templateId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Kon niet verwijderen: ' + error.message)
    }
  }
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  const standardCount = 
    standardFoods.protein.filter(Boolean).length +
    standardFoods.carbs.filter(Boolean).length +
    standardFoods.meal_prep.filter(Boolean).length
  
  return (
    <div style={{
      padding: isMobile ? '0 1rem 1rem' : '0 1.5rem 1.5rem'
    }}>
      {/* Main Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem'
        }}>
          <h2 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: 0
          }}>
            🍽️ Mijn Meal Library
          </h2>
          
          <button
            onClick={() => setShowBuilder(true)}
            style={{
              padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Plus size={16} />
            Nieuwe Meal
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '1rem',
          fontSize: isMobile ? '0.8rem' : '0.875rem',
          color: 'rgba(255, 255, 255, 0.7)',
          flexWrap: 'wrap'
        }}>
          <span>{customMeals.length} Custom Meals</span>
          <span>•</span>
          <span>{standardCount}/9 Standaard Foods</span>
          <span>•</span>
          <span>{dayTemplates.length} Templates</span>
        </div>
      </div>
      
      {/* Expandable Sections */}
      
      {/* Standard Foods */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        marginBottom: '1rem',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('standard')}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            ⭐ Standaard Foods ({standardCount}/9)
          </span>
          {expandedSections.standard ? (
            <ChevronUp size={20} color="#fff" />
          ) : (
            <ChevronDown size={20} color="#fff" />
          )}
        </button>
        
        {expandedSections.standard && (
          <div style={{
            padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <StandardFoodsSection
              standardFoods={standardFoods}
              onSetFood={handleSetStandardFood}
              onRemoveFood={handleRemoveStandardFood}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* Custom Meals */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        marginBottom: '1rem',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('custom')}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            🍳 Custom Meals ({customMeals.length})
          </span>
          {expandedSections.custom ? (
            <ChevronUp size={20} color="#fff" />
          ) : (
            <ChevronDown size={20} color="#fff" />
          )}
        </button>
        
        {expandedSections.custom && (
          <div style={{
            padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CustomMealsGrid
              meals={customMeals}
              onEdit={handleEditMeal}
              onDelete={handleDeleteCustomMeal}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* Day Templates */}
      <div style={{
        background: 'rgba(17, 17, 17, 0.5)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => toggleSection('templates')}
          style={{
            width: '100%',
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            📅 Day Templates ({dayTemplates.length})
          </span>
          {expandedSections.templates ? (
            <ChevronUp size={20} color="#fff" />
          ) : (
            <ChevronDown size={20} color="#fff" />
          )}
        </button>
        
        {expandedSections.templates && (
          <div style={{
            padding: isMobile ? '0 1rem 1rem' : '0 1.25rem 1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <DayTemplatesSection
              templates={dayTemplates}
              onCreateTemplate={handleCreateTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showSelectModal && (
        <SelectMealModal
          isOpen={showSelectModal}
          onClose={() => {
            setShowSelectModal(false)
            setSelectModalConfig(null)
          }}
          meals={customMeals}
          onSelectMeal={handleSelectMealForSlot}
          category={selectModalConfig?.category}
          slotNumber={selectModalConfig?.slotNumber}
          isMobile={isMobile}
        />
      )}
      
      {showBuilder && (
        <ClientMealBuilder
          client={client}
          db={db}
          onClose={() => {
            setShowBuilder(false)
            setEditingMeal(null)
          }}
          onMealCreated={handleMealCreated}
          editingMeal={editingMeal}
        />
      )}
      
      {/* Template Builder Modal */}
      {showTemplateBuilder && (
        <DayTemplateBuilder
          isOpen={showTemplateBuilder}
          onClose={() => {
            setShowTemplateBuilder(false)
            setEditingTemplate(null)
          }}
          onSave={handleSaveTemplate}
          customMeals={customMeals}
          editingTemplate={editingTemplate}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
