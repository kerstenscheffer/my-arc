// src/modules/client-meal-builder/hooks/useMealBuilder.js
// State management hook for meal builder

import { useState } from 'react'

export default function useMealBuilder(service, client) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedIngredients, setSelectedIngredients] = useState([])
  const [mealName, setMealName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  
  // Search handler
  const handleSearch = async (term) => {
    setSearchTerm(term)
    if (term.length < 2) {
      setSearchResults([])
      return
    }
    const results = await service.searchIngredients(term)
    setSearchResults(results)
  }
  
  // Barcode scan handler
  const handleBarcodeScanned = async (barcode) => {
    console.log('📷 Barcode scanned:', barcode)
    setShowScanner(false)
    setSearchTerm('Zoeken...')
    
    const ingredient = await service.getIngredientByBarcode(barcode)
    
    if (ingredient) {
      handleAddIngredient(ingredient)
      setSearchTerm('')
    } else {
      setSearchTerm('')
      alert(`❌ Barcode ${barcode} niet gevonden`)
    }
  }
  
  // Add ingredient
  const handleAddIngredient = (ingredient) => {
    console.log('➕ Adding ingredient:', ingredient)
    
    const defaultAmount = service.getDefaultPortionSize(ingredient)
    
    const newItem = {
      ingredient: ingredient,
      amount_gram: defaultAmount,
      id: Date.now() + Math.random()
    }
    
    setSelectedIngredients(prev => [...prev, newItem])
    setSearchTerm('')
    setSearchResults([])
  }
  
  // Update amount
  const handleUpdateAmount = (itemId, newAmount) => {
    setSelectedIngredients(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, amount_gram: parseInt(newAmount) || 0 }
          : item
      )
    )
  }
  
  // Remove ingredient
  const handleRemoveIngredient = (itemId) => {
    setSelectedIngredients(prev => prev.filter(item => item.id !== itemId))
  }
  
  // Calculate macros
  const macros = selectedIngredients.length > 0 
    ? service.calculateMacros(selectedIngredients)
    : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  
  // Save meal
  const handleSave = async (clientId, onMealCreated, onClose) => {
    console.log('💾 SAVE CLICKED')
    console.log('🔍 Client ID:', clientId)
    
    if (!clientId) {
      alert('Geen client ID!')
      return
    }
    
    if (!mealName.trim()) {
      alert('Geef je maaltijd een naam!')
      return
    }
    
    if (selectedIngredients.length === 0) {
      alert('Voeg minimaal 1 ingredient toe!')
      return
    }
    
    setSaving(true)
    
    try {
      const meal = await service.saveComposition(clientId, {
        meal_name: mealName,
        ingredients: selectedIngredients,
        meal_type: ['custom']
      })
      
      console.log('✅ SAVED:', meal)
      
      if (onMealCreated) onMealCreated(meal)
      
      setSelectedIngredients([])
      setMealName('')
      
      if (onClose) onClose()
    } catch (error) {
      console.error('❌ SAVE FAILED:', error)
      alert('Fout: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  return {
    // State
    searchTerm,
    setSearchTerm,
    searchResults,
    selectedIngredients,
    mealName,
    setMealName,
    saving,
    showScanner,
    setShowScanner,
    macros,
    
    // Handlers
    handleSearch,
    handleBarcodeScanned,
    handleAddIngredient,
    handleUpdateAmount,
    handleRemoveIngredient,
    handleSave
  }
}
