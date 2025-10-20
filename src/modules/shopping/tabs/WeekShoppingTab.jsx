// src/modules/shopping/tabs/WeekShoppingTab.jsx
import React, { useState, useEffect, useRef } from 'react'
import { 
  ShoppingCart, Check, Share2, Save, ChevronDown, ChevronUp,
  Package, TrendingUp, AlertCircle, RefreshCw, Loader,
  Euro, Clock, Target, Sparkles, Filter, Search,
  CheckCircle2, Circle, Zap, Info, Copy, MessageCircle
} from 'lucide-react'

export default function WeekShoppingTab({ shoppingData, service, client, onRefresh, db }) {
  const isMobile = window.innerWidth <= 768
  const [checkedItems, setCheckedItems] = useState({})
  const [expandedCategories, setExpandedCategories] = useState({})
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [shoppingList, setShoppingList] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [animateCards, setAnimateCards] = useState(false)
  
  // Load shopping data
  useEffect(() => {
    loadShoppingData()
  }, [shoppingData])
  
  // Trigger animations
  useEffect(() => {
    if (shoppingList?.items?.length > 0) {
      setTimeout(() => setAnimateCards(true), 100)
    }
  }, [shoppingList])
  
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
  
  const saveShoppingList = async () => {
    if (!shoppingList || !shoppingData?.activePlan?.id) return
    
    setSaving(true)
    setSaveSuccess(false)
    
    try {
      const simplifiedList = {
        items: shoppingList.items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          totalAmount: item.totalAmount,
          displayAmount: item.displayAmount,
          unit: item.unit,
          estimatedCost: item.estimatedCost
        })),
        totalCost: shoppingList.totalCost,
        itemCount: shoppingList.itemCount,
        generatedAt: shoppingList.generatedAt || new Date().toISOString()
      }
      
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
      }
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCheckItem = async (itemId) => {
    const newCheckedItems = {
      ...checkedItems,
      [itemId]: !checkedItems[itemId]
    }
    setCheckedItems(newCheckedItems)
    
    if (shoppingData?.activePlan?.id) {
      await service.saveShoppingProgress(
        client.id,
        shoppingData.activePlan.id,
        { checkedItems: newCheckedItems }
      )
    }
  }
  
  const handleCheckCategory = (category, items) => {
    const allChecked = items.every(item => checkedItems[item.id])
    const newCheckedItems = { ...checkedItems }
    
    items.forEach(item => {
      newCheckedItems[item.id] = !allChecked
    })
    
    setCheckedItems(newCheckedItems)
    
    if (shoppingData?.activePlan?.id) {
      service.saveShoppingProgress(
        client.id,
        shoppingData.activePlan.id,
        { checkedItems: newCheckedItems }
      )
    }
  }
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }
  
  const handleShare = () => {
    if (!shoppingList) return
    const text = service.generateExportText(shoppingList)
    service.shareViaWhatsApp(text)
    setShowExportMenu(false)
  }
  
  const handleCopy = async () => {
    if (!shoppingList) return
    const text = service.generateExportText(shoppingList)
    const success = await service.copyToClipboard(text)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
    setShowExportMenu(false)
  }
  
  // Filter items based on search and category
  const getFilteredItems = () => {
    if (!shoppingList?.items) return {}
    
    let filtered = [...shoppingList.items]
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }
    
    // Group by category
    return filtered.reduce((acc, item) => {
      const category = item.category || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    }, {})
  }
  
  const groupedItems = getFilteredItems()
  
  // Categories config
  const categoryConfig = {
    'protein': { emoji: '🥩', label: 'Eiwitten', color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
    'carbs': { emoji: '🌾', label: 'Koolhydraten', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    'vegetables': { emoji: '🥬', label: 'Groenten', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
    'fats': { emoji: '🥑', label: 'Vetten', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
    'dairy': { emoji: '🥛', label: 'Zuivel', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
    'fruit': { emoji: '🍎', label: 'Fruit', color: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
    'other': { emoji: '📦', label: 'Overig', color: '#6b7280', gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }
  }
  
  // Calculate stats
  const totalItems = shoppingList?.items?.length || 0
  const checkedCount = Object.values(checkedItems).filter(Boolean).length
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
  const remainingCost = shoppingList?.items?.reduce((sum, item) => 
    !checkedItems[item.id] ? sum + (item.estimatedCost || 0) : sum, 0
  ) || 0
  
  // No plan state
  if (!shoppingData?.activePlan) {
    return (
      <EmptyState 
        icon={ShoppingCart}
        title="Geen actief meal plan"
        message="Je hebt een actief AI meal plan nodig om de boodschappenlijst te gebruiken."
        isMobile={isMobile}
      />
    )
  }
  
  // Generating state
  if (generating) {
    return (
      <LoadingState 
        message="Slimme boodschappenlijst genereren..."
        subMessage="Ingrediënten optimaliseren voor beste prijzen"
        isMobile={isMobile}
      />
    )
  }
  
  // Empty list state
  if (!shoppingList || shoppingList.items?.length === 0) {
    return (
      <EmptyState 
        icon={AlertCircle}
        title="Geen boodschappen gevonden"
        message="Genereer een boodschappenlijst voor je meal plan."
        action={{
          label: "Genereer lijst",
          icon: RefreshCw,
          onClick: generateShoppingList
        }}
        isMobile={isMobile}
      />
    )
  }
  
  return (
    <div style={{ 
      padding: isMobile ? '0 0.75rem' : '0 1.5rem',
      paddingBottom: '2rem'
    }}>
      {/* Premium Stats Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: '1.5rem'
      }}>
        <StatsCard
          icon={Target}
          label="Progress"
          value={`${progress}%`}
          subValue={`${checkedCount}/${totalItems}`}
          color="#10b981"
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          delay={0}
          animate={animateCards}
          isMobile={isMobile}
          isProgress={true}
          progress={progress}
        />
        
        <StatsCard
          icon={Euro}
          label="Nog te betalen"
          value={`€${remainingCost.toFixed(0)}`}
          subValue={`van €${shoppingList.totalCost?.toFixed(0)}`}
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          delay={0.1}
          animate={animateCards}
          isMobile={isMobile}
        />
        
        <StatsCard
          icon={Package}
          label="Categorieën"
          value={Object.keys(groupedItems).length}
          subValue="Unieke types"
          color="#8b5cf6"
          gradient="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          delay={0.2}
          animate={animateCards}
          isMobile={isMobile}
        />
        
        <StatsCard
          icon={Sparkles}
          label="Besparing"
          value="€12"
          subValue="Met bulk korting"
          color="#ec4899"
          gradient="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
          delay={0.3}
          animate={animateCards}
          isMobile={isMobile}
        />
      </div>
      
      {/* Action Bar */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1.5rem',
        flexWrap: 'wrap'
      }}>
        <ActionButton
          onClick={saveShoppingList}
          disabled={saving || !hasChanges}
          primary={hasChanges}
          icon={saving ? Loader : Save}
          label={saving ? 'Opslaan...' : hasChanges ? 'Opslaan' : 'Opgeslagen'}
          isMobile={isMobile}
        />
        
        <ActionButton
          onClick={() => setShowExportMenu(!showExportMenu)}
          icon={Share2}
          label="Delen"
          isMobile={isMobile}
        />
        
        <ActionButton
          onClick={() => {
            setShoppingList(null)
            generateShoppingList()
          }}
          icon={RefreshCw}
          isMobile={isMobile}
        />
      </div>
      
      {/* Export Menu */}
      {showExportMenu && (
        <ExportMenu
          onShare={handleShare}
          onCopy={handleCopy}
          isMobile={isMobile}
        />
      )}
      
      {/* Success Messages */}
      {(saveSuccess || copySuccess) && (
        <SuccessMessage
          message={saveSuccess ? 'Lijst opgeslagen!' : 'Gekopieerd!'}
          isMobile={isMobile}
        />
      )}
      
      {/* Shopping List Categories */}
      <div style={{ marginTop: '1.5rem' }}>
        {Object.entries(groupedItems).map(([category, items], index) => (
          <CategoryCard
            key={category}
            category={category}
            config={categoryConfig[category]}
            items={items}
            checkedItems={checkedItems}
            expanded={expandedCategories[category] !== false}
            onToggle={() => toggleCategory(category)}
            onCheckItem={handleCheckItem}
            onCheckAll={() => handleCheckCategory(category, items)}
            service={service}
            isMobile={isMobile}
            delay={index * 0.05}
            animate={animateCards}
          />
        ))}
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ icon: Icon, label, value, subValue, color, gradient, delay, animate, isMobile, isProgress, progress }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      backdropFilter: 'blur(20px)',
      borderRadius: '18px',
      padding: isMobile ? '1rem' : '1.25rem',
      border: `1px solid ${color}20`,
      position: 'relative',
      overflow: 'hidden',
      transform: animate ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(10px)',
      opacity: animate ? 1 : 0,
      transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
      cursor: 'default'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
        animation: 'rotate 30s linear infinite'
      }} />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.625rem'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            background: gradient,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 12px ${color}30`
          }}>
            <Icon size={16} color="white" />
          </div>
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: `${color}cc`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '700'
          }}>
            {label}
          </span>
        </div>
        
        <div style={{
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          fontWeight: '800',
          color: color,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: '0.25rem'
        }}>
          {value}
        </div>
        
        <div style={{
          fontSize: isMobile ? '0.75rem' : '0.825rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          {subValue}
        </div>
        
        {isProgress && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `${color}20`,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: gradient,
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${color}50`
            }} />
          </div>
        )}
      </div>
    </div>
  )
}

// Category Card Component
function CategoryCard({ category, config, items, checkedItems, expanded, onToggle, onCheckItem, onCheckAll, service, isMobile, delay, animate }) {
  const checkedCount = items.filter(item => checkedItems[item.id]).length
  const allChecked = checkedCount === items.length
  const categoryTotal = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0)
  
  return (
    <div style={{
      marginBottom: '1rem',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(17, 17, 17, 0.3) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '18px',
      border: `1px solid ${allChecked ? config.color + '30' : 'rgba(255, 255, 255, 0.05)'}`,
      overflow: 'hidden',
      transform: animate ? 'scale(1) translateY(0)' : 'scale(0.98) translateY(10px)',
      opacity: animate ? 1 : 0,
      transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`
    }}>
      {/* Category Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.25rem',
        background: allChecked 
          ? `linear-gradient(135deg, ${config.color}15 0%, ${config.color}05 100%)`
          : 'transparent',
        borderBottom: expanded ? `1px solid ${config.color}10` : 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}>
        <div 
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: config.gradient,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: `0 8px 20px ${config.color}30`,
              transform: allChecked ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.3s ease'
            }}>
              {config.emoji}
            </div>
            
            <div>
              <h3 style={{
                fontSize: isMobile ? '1.125rem' : '1.25rem',
                fontWeight: '700',
                color: allChecked ? config.color : 'white',
                margin: 0,
                letterSpacing: '-0.01em',
                transition: 'color 0.3s ease'
              }}>
                {config.label}
              </h3>
              <p style={{
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0.125rem 0 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span>{checkedCount}/{items.length} items</span>
                <span>•</span>
                <span>€{categoryTotal.toFixed(2)}</span>
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCheckAll()
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: allChecked ? config.gradient : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {allChecked ? 
                <CheckCircle2 size={18} color="white" /> : 
                <Circle size={18} color="rgba(255, 255, 255, 0.5)" />
              }
            </button>
            
            {expanded ? 
              <ChevronUp size={20} color="rgba(255, 255, 255, 0.5)" /> : 
              <ChevronDown size={20} color="rgba(255, 255, 255, 0.5)" />
            }
          </div>
        </div>
      </div>
      
      {/* Items List */}
      {expanded && (
        <div style={{ 
          padding: isMobile ? '0.5rem' : '0.75rem',
          animation: 'slideDown 0.3s ease'
        }}>
          {items.map((item, index) => (
            <ShoppingItem
              key={item.id}
              item={item}
              checked={checkedItems[item.id]}
              onCheck={() => onCheckItem(item.id)}
              service={service}
              isMobile={isMobile}
              color={config.color}
              delay={index * 0.03}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Shopping Item Component
function ShoppingItem({ item, checked, onCheck, service, isMobile, color, delay }) {
  const [localChecked, setLocalChecked] = useState(checked)
  
  useEffect(() => {
    setLocalChecked(checked)
  }, [checked])
  
  const handleCheck = () => {
    setLocalChecked(!localChecked)
    setTimeout(() => onCheck(), 150)
  }
  
  return (
    <button
      onClick={handleCheck}
      style={{
        width: '100%',
        padding: isMobile ? '0.875rem' : '1rem',
        marginBottom: '0.5rem',
        background: localChecked
          ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)`
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
        border: `1px solid ${localChecked ? color + '30' : 'rgba(255, 255, 255, 0.05)'}`,
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: localChecked ? 0.8 : 1,
        textDecoration: 'none',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        animation: `slideIn 0.3s ease ${delay}s both`,
        transform: localChecked ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '10px',
          background: localChecked 
            ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
          border: localChecked ? 'none' : `2px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.2s ease',
          transform: localChecked ? 'scale(1.1)' : 'scale(1)'
        }}>
          {localChecked && <Check size={16} color="white" strokeWidth={3} />}
        </div>
        
        <div style={{ textAlign: 'left' }}>
          <p style={{
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            color: localChecked ? 'rgba(255, 255, 255, 0.6)' : 'white',
            margin: 0,
            letterSpacing: '-0.01em',
            textDecoration: localChecked ? 'line-through' : 'none',
            transition: 'all 0.2s ease'
          }}>
            {item.name}
          </p>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: `${color}99`,
            margin: '0.125rem 0 0 0',
            fontWeight: '500'
          }}>
            {service.formatAmount(item.displayAmount || item.totalAmount, item.unit)}
          </p>
        </div>
      </div>
      
      <div style={{
        fontSize: isMobile ? '0.95rem' : '1rem',
        fontWeight: '700',
        color: localChecked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)',
        textDecoration: localChecked ? 'line-through' : 'none',
        transition: 'all 0.2s ease'
      }}>
        €{item.estimatedCost?.toFixed(2)}
      </div>
    </button>
  )
}

// Action Button Component
function ActionButton({ onClick, disabled, primary, icon: Icon, label, isMobile }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: label ? 1 : '0 0 auto',
        padding: isMobile ? '0.875rem' : '1rem 1.25rem',
        background: primary
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        border: primary
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        color: primary ? 'white' : 'rgba(255, 255, 255, 0.7)',
        fontSize: isMobile ? '0.925rem' : '0.975rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? '0 8px 20px rgba(16, 185, 129, 0.25)' : 'none'
      }}
    >
      <Icon size={18} style={{ animation: Icon === Loader ? 'spin 1s linear infinite' : 'none' }} />
      {label && <span>{label}</span>}
    </button>
  )
}

// Export Menu Component
function ExportMenu({ onShare, onCopy, isMobile }) {
  return (
    <div style={{
      marginBottom: '1rem',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(17, 17, 17, 0.4) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      animation: 'slideDown 0.3s ease'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem'
      }}>
        <button
          onClick={onShare}
          style={{
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.15) 0%, rgba(37, 211, 102, 0.08) 100%)',
            border: '1px solid rgba(37, 211, 102, 0.2)',
            borderRadius: '12px',
            color: '#25d366',
            fontSize: isMobile ? '0.925rem' : '0.975rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <MessageCircle size={18} />
          WhatsApp
        </button>
        
        <button
          onClick={onCopy}
          style={{
            padding: '0.875rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            color: '#3b82f6',
            fontSize: isMobile ? '0.925rem' : '0.975rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <Copy size={18} />
          Kopieer
        </button>
      </div>
    </div>
  )
}

// Success Message Component
function SuccessMessage({ message, isMobile }) {
  return (
    <div style={{
      marginBottom: '1rem',
      padding: '0.875rem',
      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
      borderRadius: '12px',
      border: '1px solid rgba(16, 185, 129, 0.25)',
      color: '#10b981',
      fontSize: isMobile ? '0.925rem' : '0.975rem',
      fontWeight: '600',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      animation: 'slideDown 0.3s ease'
    }}>
      <CheckCircle2 size={18} />
      {message}
    </div>
  )
}

// Empty State Component
function EmptyState({ icon: Icon, title, message, action, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <Icon size={36} color="#10b981" />
      </div>
      
      <h3 style={{
        fontSize: isMobile ? '1.25rem' : '1.5rem',
        fontWeight: '700',
        color: 'white',
        marginBottom: '0.75rem'
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: isMobile ? '0.95rem' : '1.05rem',
        color: 'rgba(255, 255, 255, 0.6)',
        lineHeight: 1.6,
        marginBottom: action ? '2rem' : 0
      }}>
        {message}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: isMobile ? '0.875rem 1.5rem' : '1rem 2rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            color: 'white',
            fontSize: isMobile ? '0.95rem' : '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
          }}
        >
          <action.icon size={18} />
          {action.label}
        </button>
      )}
    </div>
  )
}

// Loading State Component
function LoadingState({ message, subMessage, isMobile }) {
  return (
    <div style={{
      padding: '4rem',
      textAlign: 'center'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '3px solid rgba(16, 185, 129, 0.15)',
        borderTopColor: '#10b981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1.5rem'
      }} />
      
      <p style={{ 
        color: 'white',
        fontSize: isMobile ? '1rem' : '1.125rem',
        fontWeight: '600',
        marginBottom: '0.5rem'
      }}>
        {message}
      </p>
      
      {subMessage && (
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: isMobile ? '0.875rem' : '0.925rem'
        }}>
          {subMessage}
        </p>
      )}
      
      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.05);
            opacity: 0.8;
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
