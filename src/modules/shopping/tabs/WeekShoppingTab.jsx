// src/modules/shopping/tabs/WeekShoppingTab.jsx - V9 WORKOUT-PAGE CLEAN
// Style-anchor: workout-pagina (WorkoutPlan.jsx). Veel zwarte ruimte,
// secties gescheiden door 2.5-3rem spacing, FadeOnScroll om aankomende
// secties subtiel in te faden, klein gouden section-label boven elke blok.
import React, { useState, useEffect } from 'react'
import { AlertCircle, Wallet, Lightbulb, X, ChevronRight } from 'lucide-react'
import { createPortal } from 'react-dom'

// Layout components
import CompactShoppingCategory from './components/CompactShoppingCategory'
import FloatingActionButtons from './components/FloatingActionButtons'
import AddCustomItemModal from './components/AddCustomItemModal'
import ShoppingSelector from './components/ShoppingSelector'
import ShoppingDailyStats from './components/ShoppingDailyStats'

// Budget components
import BudgetTab from '../components/BudgetTab'
import BudgetService from '../BudgetService'

// Sticky dag-header — zelfde patroon als home/tracking pagina's.
function ShoppingDayHeader({ isMobile }) {
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag']
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december']
  const today = new Date()
  const dayName = days[today.getDay()]
  const dateLabel = `${today.getDate()} ${months[today.getMonth()]}`

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      paddingTop: 'env(safe-area-inset-top, 0)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: isMobile ? '1.2rem' : '1.35rem',
          fontWeight: 900, color: '#FFD700', letterSpacing: '-0.02em',
          lineHeight: 1.1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {dayName}
          <span style={{
            fontSize: '0.62rem', fontWeight: 800,
            color: 'rgba(0,0,0,0.85)', background: '#FFD700',
            padding: '2px 7px', borderRadius: 4,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {dateLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// Sectie-titel met bold witte tekst (vervangt de oude tiny gouden uppercase
// label). Past bij de rest van het opgeruimde DNA.
function SectionTitle({ children, isMobile }) {
  return (
    <div style={{
      padding: isMobile ? '0 1rem' : '0 1.5rem',
      marginBottom: isMobile ? '0.7rem' : '0.85rem',
      fontSize: isMobile ? '1.05rem' : '1.2rem',
      fontWeight: 900, color: '#fff',
      letterSpacing: '-0.02em',
    }}>
      {children}
    </div>
  )
}

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

  const [weekMultiplier, setWeekMultiplier] = useState(1)
  const [checkedItems, setCheckedItems] = useState({})
  const [editModeCategories, setEditModeCategories] = useState({})
  const [editedAmounts, setEditedAmounts] = useState({})
  const [deletedItems, setDeletedItems] = useState([])
  // Budget + Shop tips als modals — niet meer als tab-pills
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  // Week + day filtering bovenaan de pagina:
  //   weekOffset  — 0 = deze week, +1 = volgende, etc. (label-only voor nu;
  //                 dezelfde shopping list want we hebben nog geen week-
  //                 specifieke meal plans).
  //   selectedDay — null = hele week, anders 'monday'..'sunday' → filter op
  //                 item.instances.day.
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)
  // Eigen ingredients die de client zelf heeft toegevoegd via de modal.
  const [customItems, setCustomItems] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)

  // Budget state
  const [budgetService] = useState(() => new BudgetService(db))
  const [savingsData, setSavingsData] = useState(null)

  useEffect(() => {
    if (shoppingData?.progress?.purchased_items) {
      setCheckedItems(shoppingData.progress.purchased_items)
    }
  }, [shoppingData?.progress])

  // Custom items uit client_shopping_custom_items per (client, plan).
  useEffect(() => {
    if (!client?.id || !db?.supabase) return
    let cancelled = false
    const load = async () => {
      const planId = shoppingData?.activePlan?.id || null
      let query = db.supabase
        .from('client_shopping_custom_items')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: true })
      if (planId) query = query.eq('plan_id', planId)
      const { data, error } = await query
      if (cancelled) return
      if (error) console.error('Load custom items failed:', error)
      setCustomItems(data || [])
    }
    load()
    return () => { cancelled = true }
  }, [client?.id, shoppingData?.activePlan?.id, db])

  const handleSaveCustomItem = async (draft) => {
    const planId = shoppingData?.activePlan?.id || null
    const { data, error } = await db.supabase
      .from('client_shopping_custom_items')
      .insert([{
        client_id: client.id,
        plan_id: planId,
        name: draft.name,
        amount: draft.amount,
        unit: draft.unit,
        category: draft.category,
        estimated_cost: draft.estimated_cost,
      }])
      .select()
      .single()
    if (error) throw error
    setCustomItems(prev => [...prev, data])
  }

  const handleDeleteCustomItem = async (itemId) => {
    setCustomItems(prev => prev.filter(i => i.id !== itemId))
    const { error } = await db.supabase
      .from('client_shopping_custom_items')
      .delete()
      .eq('id', itemId)
    if (error) console.error('Delete custom item failed:', error)
  }

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
    // Custom items hebben een prefix `custom_` — die verwijderen we
    // permanent uit de DB. Reguliere items markeren we alleen lokaal als
    // verborgen (zoals voorheen).
    if (typeof itemId === 'string' && itemId.startsWith('custom_')) {
      const customId = itemId.replace('custom_', '')
      handleDeleteCustomItem(customId)
      return
    }
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
  // selectedDay !== null: filter items op `item.instances.day` zodat alleen
  // boodschappen voor die specifieke dag (bv. zondag) verschijnen. Voor
  // single-day mode passen we ook de hoeveelheid aan: we rekenen alleen
  // het deel van de week-totaal dat aan die dag toegerekend werd.
  //
  // Custom items (eigen ingredient toevoegen) komen ongefilterd erbij — die
  // horen niet bij een specifieke meal-plan dag dus tonen we altijd.
  const getGroupedItems = () => {
    if (!shoppingData?.shoppingList?.items && customItems.length === 0) return {}
    const grouped = {}

    // Custom items eerst toevoegen, met flag _custom voor delete-handler.
    customItems.forEach(ci => {
      const cat = ci.category || 'other'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push({
        id: `custom_${ci.id}`,
        customId: ci.id,
        _custom: true,
        name: ci.name,
        category: cat,
        displayAmount: Number(ci.amount) || 0,
        totalAmount: Number(ci.amount) || 0,
        unit: ci.unit || 'stuks',
        estimatedCost: Number(ci.estimated_cost) || 0,
        instances: [],
      })
    })
    if (!shoppingData?.shoppingList?.items) return grouped
    shoppingData.shoppingList.items.forEach(item => {
      // Day-filter eerst: skip items die niet voor de gekozen dag nodig zijn.
      const instances = Array.isArray(item.instances) ? item.instances : []
      if (selectedDay) {
        const dayInstances = instances.filter(i => i?.day === selectedDay)
        if (dayInstances.length === 0) return
        // Hoeveelheid alleen voor deze dag: som van amount over die instances
        // / som totaal × originele displayAmount.
        const dayGramsTotal = dayInstances.reduce((s, i) => s + (Number(i.amount) || 0), 0)
        const allGramsTotal = instances.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 1
        const ratio = dayGramsTotal / allGramsTotal
        const baseDisplay = (item.displayAmount || item.totalAmount) * ratio
        const baseCost = (item.estimatedCost || 0) * ratio

        const displayName = item.name || 'Onbekend Product'
        const dbCategory = normalizeCategory(item.category)
        const cat = (dbCategory && dbCategory !== 'other')
          ? dbCategory
          : (categorizeIngredient(displayName) || 'other')
        if (!grouped[cat]) grouped[cat] = []
        const displayAmount = editedAmounts[item.id] !== undefined
          ? editedAmounts[item.id]
          : baseDisplay * weekMultiplier
        grouped[cat].push({
          ...item,
          category: cat,
          displayAmount,
          estimatedCost: editedAmounts[item.id] !== undefined
            ? (editedAmounts[item.id] / Math.max(0.01, baseDisplay)) * baseCost
            : baseCost * weekMultiplier,
        })
        return
      }

      // Hele week: originele logica.
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
    setShowAddModal(true)
  }

  const showToast = (message) => {
    const toast = document.createElement('div')
    toast.textContent = message
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: isMobile ? '90px' : '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#FFD700',
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

  // ── EMPTY STATE — clean workout-page-style ──
  if (!shoppingData?.shoppingList?.items?.length) {
    return (
      <div style={{
        minHeight: '60vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '3rem 1.5rem' : '4rem 2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 380 }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'rgba(255,215,0,0.08)',
            border: '1px solid rgba(255,215,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertCircle size={24} color="#FFD700" strokeWidth={2.2} />
          </div>
          <div style={{
            fontSize: isMobile ? '1.05rem' : '1.2rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: '0.5rem',
          }}>
            Geen boodschappenlijst
          </div>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.92rem',
            color: 'rgba(255,255,255,0.55)', fontWeight: 600,
            lineHeight: 1.5,
          }}>
            Genereer eerst een meal-plan — dan rolt je weeklijst hier
            automatisch in.
          </div>
        </div>
      </div>
    )
  }

  const listLabel = selectedDay
    ? `Boodschappenlijst — ${selectedDay}`
    : weekMultiplier === 1
      ? 'Boodschappenlijst'
      : `Boodschappenlijst — ${weekMultiplier} weken`

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', paddingBottom: isMobile ? '5rem' : '2rem' }}>
      {/* 0. DAG-HEADER — sticky, identiek aan home/tracking-pagina's */}
      <ShoppingDayHeader isMobile={isMobile} />

      {/* 1. SELECTOR — TodaysWorkoutCard-stijl: foto-banner + info + gouden chevron */}
      <ShoppingSelector
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        weekMultiplier={weekMultiplier}
        onWeekMultiplierChange={setWeekMultiplier}
        isMobile={isMobile}
      />

      {/* 2. OVERZICHT — floating stat-card met margin van de zijkanten */}
      <div style={{ marginTop: isMobile ? '1.75rem' : '2.25rem' }}>
        <SectionTitle isMobile={isMobile}>Overzicht deze lijst</SectionTitle>
        <div style={{
          margin: isMobile ? '0 1rem' : '0 1.5rem',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        }}>
          <ShoppingDailyStats
            totalCost={stats.totalCost}
            totalItems={stats.totalItems}
            checkedPercentage={stats.progress}
            categoriesCount={stats.categoriesCount}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* 3. BOODSCHAPPENLIJST — container vak rond de categorieën, bold witte titel */}
      <div style={{ marginTop: isMobile ? '1.75rem' : '2.25rem' }}>
        <SectionTitle isMobile={isMobile}>{listLabel}</SectionTitle>
        <div style={{
          margin: isMobile ? '0 1rem' : '0 1.5rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14,
          overflow: 'hidden',
        }}>
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
      </div>

      {/* 4. EXTRA-ACTIES — Budget + Shop tips als duidelijke icon-action-cards */}
      <div style={{
        marginTop: isMobile ? '1.75rem' : '2.25rem',
        padding: isMobile ? '0 1rem' : '0 1.5rem',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <ActionRow
          icon={Wallet}
          title="Budget bekijken"
          description="Volg je besparingen en wekelijkse kosten"
          onClick={() => setShowBudgetModal(true)}
          isMobile={isMobile}
        />
        <ActionRow
          icon={Lightbulb}
          title="Shop tips"
          description="Slim boodschappen doen volgens je doel"
          onClick={() => setShowTipsModal(true)}
          isMobile={isMobile}
        />
      </div>

      {/* FLOATING ACTIONS */}
      <FloatingActionButtons
        shoppingData={{ items: Object.values(groupedItems).flat() }}
        weekMultiplier={weekMultiplier}
        onAddItem={handleAddItem}
        isMobile={isMobile}
      />

      <AddCustomItemModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveCustomItem}
        isMobile={isMobile}
      />

      {/* Budget-modal */}
      {showBudgetModal && (
        <SimpleModal title="Budget" onClose={() => setShowBudgetModal(false)} isMobile={isMobile}>
          <BudgetTab
            client={client}
            db={db}
            planCost={shoppingData?.shoppingList?.totalCost || 0}
            isMobile={isMobile}
          />
        </SimpleModal>
      )}

      {/* Shop-tips placeholder modal */}
      {showTipsModal && (
        <SimpleModal title="Shop tips" onClose={() => setShowTipsModal(false)} isMobile={isMobile}>
          <div style={{
            padding: '2rem 1.5rem',
            textAlign: 'center',
            fontSize: isMobile ? '0.9rem' : '1rem',
            color: 'rgba(255,255,255,0.6)', fontWeight: 600,
            lineHeight: 1.5,
          }}>
            Shop tips komen binnenkort beschikbaar. Tot die tijd: koop seizoens-
            producten, vermijd kant-en-klaar maaltijden en plan je eiwit-bron
            vooraf zodat je niet impuls-koopt.
          </div>
        </SimpleModal>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Action-rij — icoon-bubble + titel/sub + chevron rechts
// ─────────────────────────────────────────────────────────
function ActionRow({ icon: Icon, title, description, onClick, isMobile }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 12,
        padding: isMobile ? '0.85rem 1rem' : '1rem 1.15rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        color: '#fff',
        cursor: 'pointer',
        textAlign: 'left',
        touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        transition: 'background 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,215,0,0.06)'
        e.currentTarget.style.borderColor = 'rgba(255,215,0,0.32)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      <div style={{
        width: isMobile ? 38 : 42, height: isMobile ? 38 : 42,
        borderRadius: '50%',
        background: 'rgba(255,215,0,0.14)',
        border: '1px solid rgba(255,215,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: '#FFD700',
      }}>
        <Icon size={isMobile ? 18 : 20} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '0.92rem' : '1rem',
          fontWeight: 900, color: '#fff',
          letterSpacing: '-0.015em',
          marginBottom: 2,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: isMobile ? '0.72rem' : '0.78rem',
          color: 'rgba(255,255,255,0.55)',
          fontWeight: 600,
        }}>
          {description}
        </div>
      </div>
      <ChevronRight size={isMobile ? 18 : 20} color="rgba(255,215,0,0.7)" strokeWidth={2.4} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────
// Simple modal — bottom-sheet stijl, voor Budget + Tips
// ─────────────────────────────────────────────────────────
function SimpleModal({ title, onClose, isMobile, children }) {
  const node = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2147483600,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'shopActionFade 0.18s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: '#0a0a0a',
          borderTop: '1px solid rgba(255,215,0,0.25)',
          borderRadius: '20px 20px 0 0',
          padding: `1.1rem 0 calc(env(safe-area-inset-bottom, 0px) + 1.25rem)`,
          boxShadow: '0 -16px 40px rgba(0,0,0,0.7)',
          animation: 'shopActionSlide 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          maxHeight: '88vh',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{
          width: 38, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          margin: '0 auto 14px',
        }} />
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '0 1.15rem 0.85rem' : '0 1.3rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: isMobile ? '1.15rem' : '1.3rem',
            fontWeight: 900, color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes shopActionFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes shopActionSlide {
          from { transform: translateY(20px); opacity: 0 }
          to   { transform: translateY(0); opacity: 1 }
        }
      `}</style>
    </div>
  )
  return createPortal(node, document.body)
}
