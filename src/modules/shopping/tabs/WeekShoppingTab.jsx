// src/modules/shopping/tabs/WeekShoppingTab.jsx - V8 FULL WIDTH
import React, { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

// Layout components
import ShoppingTabButtons from './components/ShoppingTabButtons'
import WeekMultiplierTabs from './components/WeekMultiplierTabs'
import ShoppingDailyStats from './components/ShoppingDailyStats'
import CompactShoppingCategory from './components/CompactShoppingCategory'
import FloatingActionButtons from './components/FloatingActionButtons'

// Budget components
import SavingsBar from '../components/SavingsBar'
import BudgetTab from '../components/BudgetTab'
import BudgetService from '../BudgetService'

// Categorization
let categorizeIngredient
try {
  const shoppingConstants = require('../constants/shoppingConstants')
  categorizeIngredient = shoppingConstants.categorizeIngredient
} catch (e) {
  categorizeIngredient = (name) => {
    if (!name) return 'other'
    const n = name.toLowerCase()
    if (n.includes('kip') || n.includes('whey') || n.includes('protein') || n.includes('ei')) return 'protein'
    if (n.includes('rijst') || n.includes('haver') || n.includes('pasta')) return 'carbs'
    if (n.includes('broccoli') || n.includes('spinazie') || n.includes('groente')) return 'vegetables'
    if (n.includes('bes') || n.includes('appel') || n.includes('banaan')) return 'fruit'
    if (n.includes('melk') || n.includes('yoghurt') || n.includes('kaas')) return 'dairy'
    if (n.includes('olie') || n.includes('avocado') || n.includes('noten')) return 'fats'
    if (n.includes('saus') || n.includes('bbq') || n.includes('teriyaki')) return 'sauces'
    return 'other'
  }
}

export default function WeekShoppingTab({ shoppingData, service, client, onRefresh, db }) {
  const isMobile = window.innerWidth <= 768

  const [activeTab, setActiveTab] = useState('weekplan')
  const [weekMultiplier, setWeekMultiplier] = useState(1)
  const [checkedItems, setCheckedItems] = useState({})
  const [editModeCategories, setEditModeCategories] = useState({})
  const [editedAmounts, setEditedAmounts] = useState({})
  const [deletedItems, setDeletedItems] = useState([])

  // Budget state
  const [budgetService] = useState(() => new BudgetService(db))
  const [savingsData, setSavingsData] = useState(null)

  useEffect(() => {
    if (shoppingData?.progress?.purchased_items) {
      setCheckedItems(shoppingData.progress.purchased_items)
    }
  }, [shoppingData?.progress])

  useEffect(() => {
    if (client?.id && shoppingData?.shoppingList?.totalCost) {
      loadBudgetData()
    }
  }, [client?.id, shoppingData?.shoppingList?.totalCost])

  const loadBudgetData = async () => {
    try {
      const baseline = await budgetService.getBudgetBaseline(client.id)
      if (baseline?.budget_total_baseline) {
        const planCost = shoppingData.shoppingList.totalCost
        const savings = budgetService.calculateSavings(
          parseFloat(baseline.budget_total_baseline),
          planCost
        )
        setSavingsData(savings)
        await budgetService.recordWeeklySavings(client.id, planCost)
      }
    } catch (error) {
      console.error('❌ Budget data load failed:', error)
    }
  }

  // ── HANDLERS ──
  const handleCheckItem = async (itemId) => {
    const newChecked = { ...checkedItems, [itemId]: !checkedItems[itemId] }
    setCheckedItems(newChecked)
    try {
      await service.saveShoppingProgress(client.id, shoppingData?.activePlan?.id, { checkedItems: newChecked })
    } catch (error) {
      console.error('❌ Failed to save:', error)
      setCheckedItems(checkedItems)
    }
  }

  const handleCheckCategory = async (category, items) => {
    if (!items || !Array.isArray(items)) return
    const allChecked = items.every(item => checkedItems[item?.id])
    const newChecked = { ...checkedItems }
    items.forEach(item => { if (item?.id) newChecked[item.id] = !allChecked })
    setCheckedItems(newChecked)
    try {
      await service.saveShoppingProgress(client.id, shoppingData?.activePlan?.id, { checkedItems: newChecked })
    } catch (error) {
      console.error('❌ Failed to save:', error)
      setCheckedItems(checkedItems)
    }
  }

  const toggleEditMode = (category) => {
    setEditModeCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const handleAmountChange = (itemId, newAmount) => {
    setEditedAmounts(prev => ({ ...prev, [itemId]: newAmount }))
  }

  const handleDeleteItem = (itemId) => {
    setDeletedItems(prev => [...prev, itemId])
  }

  // ── CATEGORY NORMALIZER ──
  const normalizeCategory = (cat) => {
    const aliases = {
      'fruits': 'fruit',
      'proteins': 'protein',
      'vegetables': 'vegetables',
      'grains': 'carbs',
      'oils': 'fats',
      'spices': 'sauces',
      'seasonings': 'sauces',
      'condiments': 'sauces'
    }
    return aliases[cat] || cat
  }

  // ── GROUPING ──
  const getGroupedItems = () => {
    if (!shoppingData?.shoppingList?.items) return {}
    const grouped = {}
    shoppingData.shoppingList.items.forEach(item => {
      const displayName = item.name || 'Onbekend Product'
      const dbCategory = normalizeCategory(item.category)
      const cat = (dbCategory && dbCategory !== 'other')
        ? dbCategory
        : (categorizeIngredient(displayName) || 'other')
      if (!grouped[cat]) grouped[cat] = []
      const displayAmount = editedAmounts[item.id] !== undefined
        ? editedAmounts[item.id]
        : (item.displayAmount || item.totalAmount) * weekMultiplier
      grouped[cat].push({
        ...item,
        category: cat,
        displayAmount,
        estimatedCost: editedAmounts[item.id] !== undefined
          ? (editedAmounts[item.id] / (item.displayAmount || item.totalAmount)) * (item.estimatedCost || 0)
          : (item.estimatedCost || 0) * weekMultiplier
      })
    })
    return grouped
  }

  const calculateStats = () => {
    const items = shoppingData?.shoppingList?.items || []
    const visibleItems = items.filter(item => !deletedItems.includes(item.id))
    const totalItems = visibleItems.length
    const checkedCount = Object.keys(checkedItems).filter(id =>
      checkedItems[id] && !deletedItems.includes(id)
    ).length
    const totalCost = visibleItems.reduce((sum, item) => {
      const amount = editedAmounts[item.id] !== undefined
        ? editedAmounts[item.id]
        : (item.displayAmount || item.totalAmount) * weekMultiplier
      const originalAmount = item.displayAmount || item.totalAmount
      const costPerUnit = (item.estimatedCost || 0) / originalAmount
      return sum + (amount * costPerUnit)
    }, 0)
    const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0
    const groupedItems = getGroupedItems()
    const categoriesCount = Object.keys(groupedItems).filter(cat =>
      groupedItems[cat].some(item => !deletedItems.includes(item.id))
    ).length
    return { totalItems, checkedCount, totalCost, progress, categoriesCount }
  }

  const handleExport = () => {
    const text = service.generateExportText(shoppingData.shoppingList)
    if (navigator.share) {
      navigator.share({ title: 'MY ARC Boodschappenlijst', text }).catch(err => console.log('Share failed:', err))
    } else {
      service.copyToClipboard(text)
      showToast('Gekopieerd naar klembord')
    }
  }

  const handleAddItem = () => {
    showToast('Ingredient toevoegen komt binnenkort')
  }

  const showToast = (message) => {
    const toast = document.createElement('div')
    toast.textContent = message
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: isMobile ? '90px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#10b981',
      color: 'white',
      padding: '0.625rem 1rem',
      borderRadius: '6px',
      fontWeight: '700',
      fontSize: isMobile ? '0.75rem' : '0.85rem',
      zIndex: '9999'
    })
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2500)
  }

  const groupedItems = getGroupedItems()
  const stats = calculateStats()

  // ── EMPTY STATE ──
  if (!shoppingData?.shoppingList?.items?.length) {
    return (
      <div style={{
        padding: '3rem 1rem',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.2)',
        fontSize: '0.75rem'
      }}>
        <AlertCircle size={18} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '0.75rem' }} />
        <div style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '700', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.375rem' }}>
          Geen boodschappenlijst
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.2)' }}>
          Genereer eerst een AI meal plan
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 1. COMPACT HEADER */}
      <div style={{
        padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '0.75rem'
      }}>
        <h1 style={{
          fontSize: isMobile ? '1.1rem' : '1.35rem',
          fontWeight: '800',
          color: '#10b981',
          margin: 0,
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '-0.02em'
        }}>
          Boodschappen
        </h1>
        <span style={{
          fontSize: '0.6rem',
          color: 'rgba(16, 185, 129, 0.5)',
          fontWeight: '600'
        }}>
          {stats.checkedCount}/{stats.totalItems}
        </span>
        <div style={{ flex: 1 }} />
        <WeekMultiplierTabs
          selectedWeeks={weekMultiplier}
          onSelect={setWeekMultiplier}
          isMobile={isMobile}
        />
      </div>

      {/* 2. FILTER STRIP */}
      <ShoppingTabButtons
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isMobile={isMobile}
      />

      {/* 3. WEEKPLAN TAB */}
      {activeTab === 'weekplan' && (
        <div>
          <SavingsBar savings={savingsData} isMobile={isMobile} />

          <ShoppingDailyStats
            totalCost={stats.totalCost}
            totalItems={stats.totalItems}
            checkedPercentage={stats.progress}
            categoriesCount={stats.categoriesCount}
            isMobile={isMobile}
          />

          {Object.entries(groupedItems).map(([category, items], index) => (
            <CompactShoppingCategory
              key={category}
              category={category}
              items={items}
              checkedItems={checkedItems}
              editedAmounts={editedAmounts}
              deletedItems={deletedItems}
              editMode={editModeCategories[category] === true}
              onCheckItem={handleCheckItem}
              onCheckAll={() => handleCheckCategory(category, items)}
              onAmountChange={handleAmountChange}
              onDeleteItem={handleDeleteItem}
              onToggleEditMode={toggleEditMode}
              service={service}
              isMobile={isMobile}
              delay={index * 0.02}
            />
          ))}
        </div>
      )}

      {/* 4. BUDGET TAB */}
      {activeTab === 'budget' && (
        <BudgetTab
          client={client}
          db={db}
          planCost={shoppingData?.shoppingList?.totalCost || 0}
          isMobile={isMobile}
        />
      )}

      {/* 5. TIPS TAB */}
      {activeTab === 'shoptips' && (
        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.75rem' }}>
          Shop Tips — coming soon
        </div>
      )}

      {/* FLOATING ACTIONS */}
      {activeTab === 'weekplan' && (
        <FloatingActionButtons
          shoppingData={{ items: Object.values(groupedItems).flat() }}
          weekMultiplier={weekMultiplier}
          onAddItem={handleAddItem}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
