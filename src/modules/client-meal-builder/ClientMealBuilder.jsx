// src/modules/client-meal-builder/ClientMealBuilder.jsx
// MODULAR VERSION - Clean & Simple

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import ClientMealBuilderService from './ClientMealBuilderService'
import BarcodeScanner from './components/BarcodeScanner'
import useMealBuilder from './hooks/useMealBuilder'
import SearchSection from './components/SearchSection'
import IngredientList from './components/IngredientList'
import SaveSection from './components/SaveSection'

export default function ClientMealBuilder({ client, db, onClose, onMealCreated }) {
  const [service] = useState(() => new ClientMealBuilderService(db))
  const [visible, setVisible] = useState(false)
  const isMobile = window.innerWidth <= 768
  
  // CRITICAL: Check client prop
  useEffect(() => {
    console.log('🔍 ClientMealBuilder props:', { 
      hasClient: !!client, 
      clientId: client?.id,
      hasDb: !!db 
    })
    
    if (!client || !client.id) {
      console.error('❌ CRITICAL: No client or client.id!')
    }
  }, [client, db])
  
  // Custom hook handles ALL state logic
  const {
    searchTerm,
    searchResults,
    selectedIngredients,
    mealName,
    setMealName,
    saving,
    showScanner,
    setShowScanner,
    macros,
    handleSearch,
    handleBarcodeScanned,
    handleAddIngredient,
    handleUpdateAmount,
    handleRemoveIngredient,
    handleSave
  } = useMealBuilder(service, client)
  
  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])
  
  // Safety check
  if (!client || !client.id) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}>
        <div style={{
          color: '#fff',
          fontSize: '1.5rem',
          textAlign: 'center'
        }}>
          ❌ Fout: Geen client data
          <button 
            onClick={onClose}
            style={{
              display: 'block',
              margin: '1rem auto',
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            Sluiten
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 9999,
      overflow: 'auto',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease'
    }}>
      
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
        padding: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backdropFilter: 'blur(20px)',
        zIndex: 10
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: '900',
            color: '#fff',
            margin: 0
          }}>
            Maaltijd Samenstellen
          </h2>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: '0.25rem 0 0'
          }}>
            {selectedIngredients.length} ingrediënt{selectedIngredients.length !== 1 ? 'en' : ''}
          </p>
        </div>
        
        <button
          onClick={onClose}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '0',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} color="#10b981" />
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '2rem'
      }}>
        
        {/* Search Section */}
        <SearchSection
          searchTerm={searchTerm}
          searchResults={searchResults}
          isMobile={isMobile}
          onSearch={handleSearch}
          onAddIngredient={handleAddIngredient}
          onOpenScanner={() => setShowScanner(true)}
        />
        
        {/* Ingredient List */}
        <IngredientList
          ingredients={selectedIngredients}
          macros={macros}
          isMobile={isMobile}
          onUpdateAmount={handleUpdateAmount}
          onRemoveIngredient={handleRemoveIngredient}
        />
        
        {/* Save Section */}
        {selectedIngredients.length > 0 && (
          <SaveSection
            mealName={mealName}
            saving={saving}
            isMobile={isMobile}
            onMealNameChange={setMealName}
            onSave={() => handleSave(client.id, onMealCreated, onClose)}
          />
        )}
      </div>
      
      {/* Barcode Scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScanned}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
