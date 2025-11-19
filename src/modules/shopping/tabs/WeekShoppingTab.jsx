// src/modules/shopping/tabs/WeekShoppingTab.jsx - OPTIMIZED
import React, { useState, useEffect } from 'react'
import ShoppingActions from './components/ShoppingActions'
import ShoppingCategoryCard from './components/ShoppingCategoryCard'
import ShoppingEmpty from './components/ShoppingEmpty'
import ShoppingExportMenu from './components/ShoppingExportMenu'
import { ShoppingCart, AlertCircle, RefreshCw, Save, Check } from 'lucide-react'
import { CATEGORY_CONFIG } from '../constants/shoppingConstants'
import { getGroupedItems, calculateShoppingStats, simplifyShoppingList } from '../utils/shoppingHelpers'

export default function WeekShoppingTab({ shoppingData, service, client, onRefresh, db }) {
  const isMobile = window.innerWidth <= 768
  
  // State management
  const [checkedItems, setCheckedItems] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [shoppingList, setShoppingList] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [animateCards, setAnimateCards] = useState(false)
  
  // Load shopping data on mount and when data changes
  useEffect(() => {
    loadShoppingData()
  }, [shoppingData])
  
  // Trigger animation after list loads
  useEffect(() => {
    if (shoppingList?.items?.length > 0) {
      setTimeout(() => setAnimateCards(true), 100)
    }
  }, [shoppingList])
  
  // 🔥 Auto-expand only first category
  useEffect(() => {
    if (shoppingList?.items?.length > 0) {
      const grouped = getGroupedItems(shoppingList.items)
      const firstCategory = Object.keys(grouped)[0]
      if (firstCategory) {
        setExpandedCategories({ [firstCategory]: true })
      }
    }
  }, [shoppingList])
  
  // Load shopping data from props or generate if needed
  const loadShoppingData = async () => {
    if (shoppingData?.activePlan?.shopping_list) {
      setShoppingList(shoppingData.activePlan.shopping_list)
    } else if (shoppingData?.weekStructure && !generating && !shoppingList) {
      await generateShoppingList()
    }
    
    if (shoppingData?.progress?.purchased_items) {
      setCheckedItems(shoppingData.progress.purchased_items)
    }
  }
  
  // Generate new shopping list from week structure
  const generateShoppingList = async () => {
    if (!shoppingData?.weekStructure) return
    
    setGenerating(true)
    setHasChanges(false)
    
    try {
      const list = await service.generateShoppingList(shoppingData.weekStructure)
      
      if (list && list.items.length > 0) {
        setShoppingList(list)
        setHasChanges(true)
        setAnimateCards(false)
        setTimeout(() => setAnimateCards(true), 100)
      }
    } catch (error) {
      console.error('Failed to generate shopping list:', error)
    } finally {
      setGenerating(false)
    }
  }
  
  // Save shopping list to database
  const saveShoppingList = async () => {
    if (!shoppingList || !shoppingData?.activePlan?.id) return
    
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      const simplifiedList = simplifyShoppingList(shoppingList)
      
      const { error } = await db.supabase
        .from('client_meal_plans')
        .update({ 
          shopping_list: simplifiedList,
          updated_at: new Date().toISOString()
        })
        .eq('id', shoppingData.activePlan.id)
      
      if (!error) {
        setSaveSuccess(true)
        setHasChanges(false)
        setTimeout(() => setSaveSuccess(false), 3000)
        
        await service.saveShoppingProgress(client.id, shoppingData.activePlan.id, {
          checkedItems
        })
        
        if (onRefresh) onRefresh()
      }
    } catch (error) {
      console.error('Failed to save shopping list:', error)
    } finally {
      setSaving(false)
    }
  }
  
  // Toggle individual item checked state
  const handleCheckItem = async (itemId) => {
    const newCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId]
    }
    setCheckedItems(newCheckedItems)
    
    if (shoppingData?.activePlan?.id) {
      await service.saveShoppingProgress(client.id, shoppingData.activePlan.id, {
        checkedItems: newCheckedItems
      })
    }
  }
  
  // Check/uncheck all items in a category
  const handleCheckCategory = async (category, items) => {
    if (!items || !Array.isArray(items)) return
    
    const allChecked = items.every(item => checkedItems[item?.id])
    const newCheckedItems = { ...checkedItems }
    
    items.forEach(item => {
      if (item?.id) {
        newCheckedItems[item.id] = !allChecked
      }
    })
    
    setCheckedItems(newCheckedItems)
    
    if (shoppingData?.activePlan?.id) {
      await service.saveShoppingProgress(client.id, shoppingData.activePlan.id, {
        checkedItems: newCheckedItems
      })
    }
  }
  
  // Toggle category expanded/collapsed state
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  // Share shopping list via WhatsApp
  const handleShare = () => {
    if (!shoppingList) return
    const text = service.generateExportText(shoppingList)
    service.shareViaWhatsApp(text)
    setShowExportMenu(false)
  }
  
  // Copy shopping list to clipboard
  const handleCopy = async () => {
    if (!shoppingList) return
    const text = service.generateExportText(shoppingList)
    const success = await service.copyToClipboard(text)
    setShowExportMenu(false)
  }
  
  // Calculate statistics
  const groupedItems = getGroupedItems(shoppingList?.items)
  const stats = calculateShoppingStats(shoppingList?.items, checkedItems)
  
  // Empty states
  if (!shoppingData?.activePlan) {
    return (
      <ShoppingEmpty 
        icon={ShoppingCart}
        title="Geen actief meal plan"
        message="Je hebt een actief AI meal plan nodig om de boodschappenlijst te gebruiken."
        isMobile={isMobile}
      />
    )
  }
  
  if (generating) {
    return (
      <ShoppingEmpty 
        loading={true}
        message="Slimme boodschappenlijst genereren..."
        subMessage="Ingrediënten optimaliseren voor beste prijzen"
        isMobile={isMobile}
      />
    )
  }
  
  if (!shoppingList || shoppingList.items?.length === 0) {
    return (
      <ShoppingEmpty 
        icon={AlertCircle}
        title="Geen boodschappen gevonden"
        message="Er zijn geen ingrediënten gevonden in je meal plan."
        action={{
          label: 'Opnieuw genereren',
          onClick: generateShoppingList,
          icon: RefreshCw
        }}
        isMobile={isMobile}
      />
    )
  }
  
  // Main render - COMPACT VERSION
  return (
    <div style={{
      padding: isMobile ? '0.5rem' : '0.75rem',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* 🔥 COMPACT: Inline actions (geen aparte rij) */}
      <ShoppingActions
        onSave={saveShoppingList}
        onShare={() => setShowExportMenu(!showExportMenu)}
        onRefresh={() => {
          setShoppingList(null)
          generateShoppingList()
        }}
        saving={saving}
        hasChanges={hasChanges}
        saveSuccess={saveSuccess}
        isMobile={isMobile}
      />
      
      {/* Export Menu Dropdown */}
      {showExportMenu && (
        <ShoppingExportMenu
          onShare={handleShare}
          onCopy={handleCopy}
          onClose={() => setShowExportMenu(false)}
          isMobile={isMobile}
        />
      )}
      
      {/* 🔥 COMPACT: Category Cards - tighter spacing */}
      <div style={{ marginTop: isMobile ? '0.5rem' : '0.75rem' }}>
        {Object.entries(groupedItems).map(([category, items], index) => (
          <ShoppingCategoryCard
            key={category}
            category={category}
            config={CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other}
            items={items || []}
            checkedItems={checkedItems}
            expanded={expandedCategories[category] === true}
            onToggle={() => toggleCategory(category)}
            onCheckItem={handleCheckItem}
            onCheckAll={() => handleCheckCategory(category, items)}
            service={service}
            isMobile={isMobile}
            delay={index * 0.03}
            animate={animateCards}
          />
        ))}
      </div>
      
      {/* 🔥 FLOATING SAVE BUTTON (primary action) */}
      {hasChanges && (
        <button
          onClick={saveShoppingList}
          disabled={saving}
          style={{
            position: 'fixed',
            bottom: isMobile ? '80px' : '2rem',
            right: isMobile ? '1rem' : '2rem',
            width: isMobile ? '56px' : '64px',
            height: isMobile ? '56px' : '64px',
            borderRadius: '50%',
            background: saveSuccess 
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '2px solid rgba(16, 185, 129, 0.3)',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: saving ? 'not-allowed' : 'pointer',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 100,
            animation: 'float 3s ease-in-out infinite',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            if (!isMobile && !saving) {
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.5)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile && !saving) {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(16, 185, 129, 0.4)'
            }
          }}
          onTouchStart={(e) => {
            if (isMobile && !saving) {
              e.currentTarget.style.transform = 'scale(0.95)'
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile && !saving) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          {saveSuccess ? (
            <Check size={isMobile ? 24 : 28} color="white" strokeWidth={3} />
          ) : saving ? (
            <RefreshCw 
              size={isMobile ? 24 : 28} 
              color="white" 
              strokeWidth={3}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          ) : (
            <Save size={isMobile ? 24 : 28} color="white" strokeWidth={3} />
          )}
        </button>
      )}
      
      {/* Animations */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-8px) scale(1.02); }
          }
        `}
      </style>
    </div>
  )
}
