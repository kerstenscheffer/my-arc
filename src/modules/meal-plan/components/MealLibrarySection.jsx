// src/modules/meal-plan/components/MealLibrarySection.jsx
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, X, Library } from 'lucide-react'
import StandardFoodsSection from '../../client-meal-base/components/StandardFoodsSection'
import CustomMealsGrid from '../../client-meal-base/components/CustomMealsGrid'
import SelectMealModal from '../../client-meal-base/components/SelectMealModal'
import ClientMealBuilder from '../../client-meal-builder/ClientMealBuilder'
import DayTemplatesSection from '../../client-meal-base/components/DayTemplatesSection'
import DayTemplateBuilder from '../../client-meal-base/components/DayTemplateBuilder'

export default function MealLibrarySection({ client, db, onMealCreated }) {
  const isMobile = window.innerWidth <= 768
  
  // Modal state
  const [isOpen, setIsOpen] = useState(false)
  
  // Data state
  const [customMeals, setCustomMeals] = useState([])
  const [standardFoods, setStandardFoods] = useState({
    protein: [null, null, null],
    carbs: [null, null, null],
    meal_prep: [null, null, null]
  })
  const [dayTemplates, setDayTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Expand/collapse
  const [expandedSections, setExpandedSections] = useState({
    standard: true,
    custom: true,
    templates: false
  })
  
  // Modals
  const [showBuilder, setShowBuilder] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [selectModalConfig, setSelectModalConfig] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  
  // Load data when modal opens
  useEffect(() => {
    if (isOpen && client?.id) {
      loadData()
    }
  }, [isOpen, client])
  
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])
  
  const loadData = async () => {
    setLoading(true)
    try {
      const [meals, standards, templates] = await Promise.all([
        db.getClientCustomMeals(client.id),
        db.getClientStandardFoods(client.id),
        db.getClientDayTemplates(client.id)
      ])
      
      setCustomMeals(meals || [])
      setStandardFoods(standards || {
        protein: [null, null, null],
        carbs: [null, null, null],
        meal_prep: [null, null, null]
      })
      setDayTemplates(templates || [])
    } catch (error) {
      console.error('Failed to load meal library:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleClose = () => {
    // Don't close if sub-modals are open
    if (showBuilder || showSelectModal || showTemplateBuilder) return
    setIsOpen(false)
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
    (standardFoods.protein?.filter(Boolean).length || 0) +
    (standardFoods.carbs?.filter(Boolean).length || 0) +
    (standardFoods.meal_prep?.filter(Boolean).length || 0)
  
  return (
    <>
      {/* Trigger Button - Premium Coach Style */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
          borderRadius: isMobile ? '14px' : '16px',
          padding: isMobile ? '1rem' : '1.25rem',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          minHeight: '44px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          position: 'relative',
          overflow: 'hidden',
          width: '100%'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.12) 100%)'
          e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {/* Gradient glow effect */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
          pointerEvents: 'none'
        }} />
        
        {/* Icon container */}
        <div style={{
          width: isMobile ? '44px' : '52px',
          height: isMobile ? '44px' : '52px',
          borderRadius: isMobile ? '12px' : '14px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.15) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          flexShrink: 0
        }}>
          <Library 
            size={isMobile ? 22 : 26} 
            color="#10b981"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))'
            }}
          />
        </div>
        
        {/* Text content */}
        <div style={{
          flex: 1,
          textAlign: 'left'
        }}>
          <div style={{
            fontSize: isMobile ? '1rem' : '1.15rem',
            fontWeight: '800',
            color: '#10b981',
            marginBottom: '0.15rem',
            letterSpacing: '-0.01em'
          }}>
            Voer eigen maaltijden in
          </div>
          <div style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            fontWeight: '500',
            lineHeight: 1.4
          }}>
            Bouw je custom meals, templates & standards
          </div>
        </div>
      </button>
      
      {/* Full-Screen Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={handleClose}
        >
          {/* Modal Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0a0a0a',
              width: '100%',
              height: isMobile ? '100%' : 'auto',
              maxHeight: isMobile ? '100%' : '95vh',
              maxWidth: isMobile ? '100%' : '900px',
              borderRadius: isMobile ? '0' : '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: isMobile ? 'none' : '1px solid rgba(16, 185, 129, 0.2)',
              animation: isMobile ? 'slideUp 0.3s ease-out' : 'scaleIn 0.3s ease-out'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: isMobile ? '1.25rem 1rem' : '1.5rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontSize: isMobile ? '1.25rem' : '1.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em'
                }}>
                  🍽️ Mijn Meal Library
                </h2>
                
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    {customMeals.length} Custom Meals
                  </span>
                  <span>•</span>
                  <span style={{ 
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    {standardCount}/9 Standaard
                  </span>
                  <span>•</span>
                  <span style={{ 
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    {dayTemplates.length} Templates
                  </span>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  width: isMobile ? '40px' : '44px',
                  height: isMobile ? '40px' : '44px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  flexShrink: 0,
                  marginLeft: '1rem'
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
                <X size={20} />
              </button>
            </div>
            
            {/* Action Bar - Create Meal Button */}
            <div style={{
              padding: isMobile ? '1rem' : '1.25rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              flexShrink: 0
            }}>
              <button
                onClick={() => setShowBuilder(true)}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.875rem' : '1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: isMobile ? '0.875rem' : '0.95rem',
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
      )}
      
      {/* Sub-Modals */}
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
