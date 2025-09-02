
// ===== 2. CustomMealModal.jsx =====
// src/modules/meal-plan/components/CustomMealModal.jsx

import React, { useState, useRef } from 'react'
import { X, Save, Upload, Plus, ChefHat, Flame, Dumbbell, Zap, Droplets } from 'lucide-react'

export default function CustomMealModal({ isOpen, onClose, onSave, client }) {
  const [mealName, setMealName] = useState('')
  const [ingredients, setIngredients] = useState([])
  const [newIngredient, setNewIngredient] = useState('')
  const [macros, setMacros] = useState({
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  })
  const [category, setCategory] = useState('lunch')
  const [imageUrl, setImageUrl] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)
  
  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()])
      setNewIngredient('')
    }
  }
  
  const handleRemoveIngredient = (idx) => {
    setIngredients(ingredients.filter((_, i) => i !== idx))
  }
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploadingImage(true)
    try {
      const placeholder = `https://source.unsplash.com/400x300/?${mealName || 'food'}`
      setImageUrl(placeholder)
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setUploadingImage(false)
    }
  }
  
  const handleSave = async () => {
    if (!mealName.trim()) {
      alert('Geef je maaltijd een naam!')
      return
    }
    
    const customMeal = {
      name: mealName,
      category: category,
      meal_type: category,
      kcal: parseInt(macros.kcal) || 0,
      protein: parseInt(macros.protein) || 0,
      carbs: parseInt(macros.carbs) || 0,
      fat: parseInt(macros.fat) || 0,
      ingredients: ingredients,
      image_url: imageUrl,
      is_custom: true,
      created_by: client?.id,
      client_specific: true,
      tags: ['custom', category]
    }
    
    onSave(customMeal)
    
    // Reset form
    setMealName('')
    setIngredients([])
    setMacros({ kcal: 0, protein: 0, carbs: 0, fat: 0 })
    setCategory('lunch')
    setImageUrl('')
  }
  
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem',
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChefHat size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              Eigen Maaltijd Toevoegen
            </h2>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          <FormField label="Naam van het gerecht">
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="bijv. Lasagne van mama"
              style={inputStyle}
            />
          </FormField>
          
          <FormField label="Categorie">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
            </select>
          </FormField>
          
          <FormField label="Foto (optioneel)">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {imageUrl && (
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  background: `url(${imageUrl}) center/cover`,
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }} />
              )}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(16, 185, 129, 0.9)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: uploadingImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Upload size={16} />
                {uploadingImage ? 'Uploading...' : 'Upload Foto'}
              </button>
            </div>
          </FormField>
          
          <FormField label="Ingrediënten">
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                placeholder="Voeg ingrediënt toe..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={handleAddIngredient}
                style={{
                  padding: '0.625rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  color: 'rgba(16, 185, 129, 0.9)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {ingredients.map((ingredient, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.375rem 0.75rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '20px',
                    color: 'rgba(16, 185, 129, 0.9)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {ingredient}
                  <button
                    onClick={() => handleRemoveIngredient(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </FormField>
          
          <FormField label="Voedingswaarden (per portie)">
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {[
                { key: 'kcal', label: 'Calorieën', icon: Flame },
                { key: 'protein', label: 'Eiwit (g)', icon: Dumbbell },
                { key: 'carbs', label: 'Koolh. (g)', icon: Zap },
                { key: 'fat', label: 'Vet (g)', icon: Droplets }
              ].map(({ key, label, icon: Icon }) => (
                <div key={key}>
                  <label style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginBottom: '0.25rem'
                  }}>
                    <Icon size={12} />
                    {label}
                  </label>
                  <input
                    type="number"
                    value={macros[key]}
                    onChange={(e) => setMacros({
                      ...macros,
                      [key]: e.target.value
                    })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
              ))}
            </div>
          </FormField>
        </div>
        
        <div style={{
          padding: '1.5rem',
          borderTop: '1px solid rgba(16, 185, 129, 0.1)',
          display: 'flex',
          gap: '0.75rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Annuleren
          </button>
          
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Save size={16} />
            Opslaan
          </button>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.85rem',
        fontWeight: '600',
        display: 'block',
        marginBottom: '0.5rem'
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  background: 'rgba(0, 0, 0, 0.5)',
  border: '1px solid rgba(16, 185, 129, 0.2)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none'
}
