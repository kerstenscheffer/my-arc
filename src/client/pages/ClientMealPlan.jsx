import useIsMobile from '../../hooks/useIsMobile'
// src/client/pages/ClientMealPlan.jsx
// 🚀 MY ARC CLIENT MEAL PLAN - VOLLEDIG WERKEND
// ✅ Custom meals per client
// ✅ Meal detail popup
// ✅ Shop link naar ClientShoppingList
// ✅ Alle meals op tijdlijn
// ✅ Save functionaliteit

import React, { useState, useEffect, useRef } from 'react'
import { 
  Utensils, Flame, Dumbbell, Zap, Droplets,
  CheckCircle2, Camera, Plus, ChevronDown, ChevronUp,
  Calendar, TrendingUp, Activity, Heart,
  Clock, Target, Award, Sparkles,
  RefreshCw, ChevronLeft, ChevronRight,
  Coffee, Sun, Moon, Apple,
  CheckSquare, Square, Edit3,
  Star, Info, AlertCircle,
  BarChart3, Timer, ShoppingCart,
  X, Eye, ChefHat, Users,
  Bell, ArrowRight, MoreVertical,
  PlusCircle, MinusCircle, Settings,
  Home, User, Cookie, History, Search, Filter,
  Save, Upload, Trash2, Edit2, Package, BookOpen
} from 'lucide-react'

// ===== MEAL DETAIL POPUP =====
const MealDetailPopup = ({ isOpen, onClose, meal, db }) => {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (isOpen && meal) {
      loadMealDetails()
    }
  }, [isOpen, meal])
  
  const loadMealDetails = async () => {
    setLoading(true)
    try {
      // Laad extra details uit database
      if (db && meal.id) {
        const fullMeal = await db.getMealDetails(meal.id)
        setDetails(fullMeal || meal)
      } else {
        setDetails(meal)
      }
    } catch (error) {
      console.error('Error loading meal details:', error)
      setDetails(meal)
    } finally {
      setLoading(false)
    }
  }
  
  if (!isOpen || !meal) return null
  
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
    }} onClick={onClose}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
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
              <BookOpen size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              {meal.name}
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
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: '50%',
                margin: '0 auto',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : (
            <>
              {/* Image */}
              {(details?.image_url || meal.image_url) && (
                <div style={{
                  width: '100%',
                  height: '200px',
                  borderRadius: '12px',
                  background: `url(${details?.image_url || meal.image_url}) center/cover`,
                  marginBottom: '1.5rem'
                }} />
              )}
              
              {/* Macros */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {[
                  { icon: Flame, value: meal.kcal, label: 'kcal', color: 'rgba(16, 185, 129, 0.9)' },
                  { icon: Dumbbell, value: `${meal.protein}g`, label: 'Eiwit', color: 'rgba(5, 150, 105, 0.9)' },
                  { icon: Zap, value: `${meal.carbs}g`, label: 'Koolh', color: 'rgba(4, 120, 87, 0.9)' },
                  { icon: Droplets, value: `${meal.fat}g`, label: 'Vet', color: 'rgba(16, 185, 129, 0.7)' }
                ].map(({ icon: Icon, value, label, color }) => (
                  <div key={label} style={{
                    textAlign: 'center',
                    padding: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    border: `1px solid ${color}33`
                  }}>
                    <Icon size={18} style={{ color, marginBottom: '0.25rem' }} />
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      {value}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Ingrediënten */}
              {(details?.ingredients || meal.ingredients) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    color: 'rgba(16, 185, 129, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    Ingrediënten
                  </h3>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '1rem'
                  }}>
                    {Array.isArray(details?.ingredients || meal.ingredients) ? (
                      <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                        {(details?.ingredients || meal.ingredients).map((ingredient, idx) => (
                          <li key={idx} style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            marginBottom: '0.5rem',
                            fontSize: '0.9rem'
                          }}>
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                        {details?.ingredients || meal.ingredients}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Bereiding */}
              {(details?.preparation || meal.preparation) && (
                <div>
                  <h3 style={{
                    color: 'rgba(16, 185, 129, 0.9)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    Bereiding
                  </h3>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '10px',
                    padding: '1rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6'
                  }}>
                    {details?.preparation || meal.preparation || 'Bereidingswijze wordt binnenkort toegevoegd.'}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== CUSTOM MEAL CREATOR MODAL =====
const CustomMealCreator = ({ isOpen, onClose, onSave, db, client }) => {
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
      // Voeg client_specific toe zodat het alleen voor deze client is
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
        {/* Header */}
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
        
        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Meal Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Naam van het gerecht
            </label>
            <input
              type="text"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              placeholder="bijv. Lasagne van mama"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>
          
          {/* Category */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Categorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          
          {/* Image Upload */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Foto (optioneel)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
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
          </div>
          
          {/* Ingredients */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.5rem'
            }}>
              Ingrediënten
            </label>
            
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
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
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
          </div>
          
          {/* Macros */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem',
              fontWeight: '600',
              display: 'block',
              marginBottom: '0.75rem'
            }}>
              Voedingswaarden (per portie)
            </label>
            
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
          </div>
        </div>
        
        {/* Footer */}
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

// ===== ENHANCED SWAP MODAL WITH FAVORITES & CUSTOM MEALS =====
const SwapModal = ({ isOpen, onClose, currentMeal, onSelectMeal, allMeals = [], favorites = [], customMeals = [], onCreateCustom }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  
  // Combine all meals with favorites first
  const combinedMeals = [
    ...customMeals.map(m => ({ ...m, isCustom: true })),
    ...allMeals
  ]
  
  // Sort with favorites first
  const sortedMeals = combinedMeals.sort((a, b) => {
    const aIsFav = favorites.includes(a.id)
    const bIsFav = favorites.includes(b.id)
    if (aIsFav && !bIsFav) return -1
    if (!aIsFav && bIsFav) return 1
    if (a.isCustom && !b.isCustom) return -1
    if (!a.isCustom && b.isCustom) return 1
    return 0
  })
  
  const filteredMeals = sortedMeals.filter(meal => {
    if (showOnlyFavorites && !favorites.includes(meal.id) && !meal.isCustom) return false
    
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      (meal.category && meal.category.toLowerCase() === selectedCategory) ||
      (meal.meal_type && meal.meal_type.toLowerCase() === selectedCategory) ||
      (meal.tags && meal.tags.some(tag => tag.toLowerCase() === selectedCategory))
    return matchesSearch && matchesCategory
  })
  
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
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <RefreshCw size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              Vervang Maaltijd
            </h2>
            
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '10px',
                padding: '0.5rem',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.6)',
                transition: 'all 0.2s ease'
              }}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Current Meal Info */}
          <div style={{
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            marginBottom: '1rem'
          }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              Huidige maaltijd:
            </div>
            <div style={{ color: '#fff', fontWeight: '600' }}>
              {currentMeal?.name}
            </div>
          </div>
          
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.4)'
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Zoek maaltijd..."
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '0.625rem 0.75rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">Alle</option>
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          
          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              style={{
                padding: '0.5rem 0.75rem',
                background: showOnlyFavorites
                  ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)'
                  : 'rgba(0, 0, 0, 0.3)',
                border: showOnlyFavorites
                  ? '1px solid rgba(245, 158, 11, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: showOnlyFavorites
                  ? '#f59e0b'
                  : 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Star size={14} fill={showOnlyFavorites ? '#f59e0b' : 'none'} />
              Favorieten
            </button>
            
            <button
              onClick={onCreateCustom}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                color: 'rgba(16, 185, 129, 0.9)',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Plus size={14} />
              Eigen Maaltijd
            </button>
          </div>
        </div>
        
        {/* Meals List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {filteredMeals.map((meal, index) => {
            const isFavorite = favorites.includes(meal.id)
            const isCustom = meal.isCustom
            
            return (
              <button
                key={`${meal.id}-${index}`}
                onClick={() => onSelectMeal(meal)}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.1)',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.1)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                {/* Favorite/Custom badges */}
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  {isFavorite && (
                    <Star size={14} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                  )}
                  {isCustom && (
                    <ChefHat size={14} style={{ color: 'rgba(16, 185, 129, 0.7)' }} />
                  )}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {/* Meal Image */}
                  {meal.image_url && (
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '8px',
                      background: `url(${meal.image_url}) center/cover`,
                      flexShrink: 0
                    }} />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: '#fff',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {meal.name}
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.75rem',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <span>{meal.kcal} kcal</span>
                      <span>{meal.protein}g eiwit</span>
                      <span>{meal.carbs}g koolh</span>
                      <span>{meal.fat}g vet</span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ===== ENHANCED HISTORY MODAL WITH REAL DATA =====
const HistoryModal = ({ isOpen, onClose, historyData = [], targets = {} }) => {
  const [historyPeriod, setHistoryPeriod] = useState('week')
  
  const filteredHistory = historyData.filter(item => {
    const date = new Date(item.date)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (historyPeriod === 'week') return diffDays <= 7
    if (historyPeriod === 'maand') return diffDays <= 30
    return true
  })
  
  // Calculate statistics
  const stats = filteredHistory.reduce((acc, item) => {
    acc.totalDays++
    acc.totalCalories += item.total_calories || 0
    acc.totalProtein += item.total_protein || 0
    acc.totalCarbs += item.total_carbs || 0
    acc.totalFat += item.total_fat || 0
    
    if (item.total_calories >= targets.kcal * 0.9) {
      acc.daysOnTarget++
    }
    
    return acc
  }, { totalDays: 0, daysOnTarget: 0, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 })
  
  if (stats.totalDays > 0) {
    stats.avgCalories = Math.round(stats.totalCalories / stats.totalDays)
    stats.avgProtein = Math.round(stats.totalProtein / stats.totalDays)
    stats.avgCarbs = Math.round(stats.totalCarbs / stats.totalDays)
    stats.avgFat = Math.round(stats.totalFat / stats.totalDays)
    stats.successRate = Math.round((stats.daysOnTarget / stats.totalDays) * 100)
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
        maxHeight: '80vh',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <History size={20} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />
              Geschiedenis
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
          
          {/* Period Selector */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['week', 'maand', 'alles'].map(period => (
              <button
                key={period}
                onClick={() => setHistoryPeriod(period)}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background: historyPeriod === period
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'rgba(0, 0, 0, 0.3)',
                  border: historyPeriod === period
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: historyPeriod === period
                    ? 'rgba(16, 185, 129, 0.9)'
                    : 'rgba(255, 255, 255, 0.5)',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {period === 'week' ? 'Week' : period === 'maand' ? 'Maand' : 'Alles'}
              </button>
            ))}
          </div>
          
          {/* Statistics */}
          {stats.totalDays > 0 && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '10px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.5rem'
            }}>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                  Succes Rate
                </div>
                <div style={{ color: 'rgba(16, 185, 129, 0.9)', fontWeight: 'bold' }}>
                  {stats.successRate}%
                </div>
              </div>
              <div>
                <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                  Gem. Calorieën
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                  {stats.avgCalories} kcal
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* History List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {filteredHistory.length > 0 ? (
            filteredHistory.map((item, idx) => {
              const successRate = Math.round((item.total_calories / targets.kcal) * 100)
              const isSuccess = successRate >= 90
              
              return (
                <div
                  key={idx}
                  style={{
                    padding: '0.875rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    marginBottom: '0.5rem'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      color: '#fff',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      {new Date(item.date).toLocaleDateString('nl-NL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      {isSuccess && <CheckCircle2 size={14} style={{ color: 'rgba(16, 185, 129, 0.8)' }} />}
                    </div>
                    <div style={{
                      color: isSuccess ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255, 255, 255, 0.5)',
                      fontWeight: '600'
                    }}>
                      {item.total_calories} / {targets.kcal} kcal
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '1rem',
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.4)',
                    marginBottom: '0.5rem'
                  }}>
                    <span>E: {item.total_protein}g</span>
                    <span>K: {item.total_carbs}g</span>
                    <span>V: {item.total_fat}g</span>
                  </div>
                  
                  {item.meals_checked && item.meals_checked.length > 0 && (
                    <div style={{
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.3)',
                        marginBottom: '0.25rem'
                      }}>
                        Gegeten maaltijden:
                      </div>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.25rem'
                      }}>
                        {item.meals_checked.map((meal, mIdx) => (
                          <span
                            key={mIdx}
                            style={{
                              padding: '2px 6px',
                              background: 'rgba(16, 185, 129, 0.1)',
                              borderRadius: '4px',
                              fontSize: '0.65rem',
                              color: 'rgba(16, 185, 129, 0.7)'
                            }}
                          >
                            {meal.meal_name || meal.time_slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.3)'
            }}>
              Geen geschiedenis beschikbaar voor deze periode
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== TIMELINE PROGRESS COMPONENT =====
const TimelineProgress = ({ 
  meals, 
  checkedMeals, 
  onToggleMeal,
  currentProgress,
  targets,
  nextMeal,
  waterIntake,
  onAddWater,
  onSwapMeal
}) => {
  const isMobile = useIsMobile()
  const currentHour = new Date().getHours() + new Date().getMinutes() / 60
  
  const getMealIcon = (slot) => {
    if (slot?.toLowerCase().includes('ontbijt') || slot?.toLowerCase().includes('breakfast')) return Coffee
    if (slot?.toLowerCase().includes('lunch')) return Sun
    if (slot?.toLowerCase().includes('diner') || slot?.toLowerCase().includes('dinner')) return Moon
    if (slot?.toLowerCase().includes('snack')) return Apple
    return Utensils
  }
  
  const handleSwapClick = () => {
    if (nextMeal && onSwapMeal) {
      onSwapMeal(nextMeal)
    }
  }
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)',
      borderRadius: '20px',
      padding: isMobile ? '1.25rem' : '1.5rem',
      marginBottom: '1.5rem',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)',
        animation: 'shimmer 4s ease infinite'
      }} />
      
      {/* Next Meal Card */}
      {nextMeal && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
          borderRadius: '12px',
          marginBottom: '1rem',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: nextMeal.image_url 
              ? `url(${nextMeal.image_url}) center/cover`
              : 'rgba(16, 185, 129, 0.1)',
            flexShrink: 0
          }}>
            {!nextMeal.image_url && (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Utensils size={18} style={{ color: 'rgba(16, 185, 129, 0.5)' }} />
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              color: 'rgba(16, 185, 129, 0.7)',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              marginBottom: '2px'
            }}>
              Volgende: {(() => {
                const now = new Date().getHours() + new Date().getMinutes() / 60
                if (nextMeal.plannedTime > now) {
                  const diff = nextMeal.plannedTime - now
                  const hours = Math.floor(diff)
                  const minutes = Math.round((diff - hours) * 60)
                  return `over ${hours > 0 ? `${hours}u ` : ''}${minutes}m`
                }
                return 'Nu'
              })()}
            </div>
            <div style={{
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {nextMeal.name}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleSwapClick}
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '0.5rem',
                color: 'rgba(59, 130, 246, 0.9)',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <RefreshCw size={14} />
              Swap
            </button>
            
            <button
              onClick={() => {
                if (onToggleMeal && nextMeal.index !== undefined) {
                  onToggleMeal(nextMeal.index)
                }
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#fff',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '0.3rem' }} />
              Klaar
            </button>
          </div>
        </div>
      )}
      
      {/* Macro Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: isMobile ? '0.4rem' : '0.6rem',
        marginBottom: '1.25rem'
      }}>
        {/* Macro Cards */}
        {[
          { key: 'kcal', icon: Flame, color: 'rgba(16, 185, 129, 0.9)', label: 'Kcal' },
          { key: 'protein', icon: Dumbbell, color: 'rgba(5, 150, 105, 0.9)', label: 'Eiwit' },
          { key: 'carbs', icon: Zap, color: 'rgba(4, 120, 87, 0.9)', label: 'Koolh' },
          { key: 'fat', icon: Droplets, color: 'rgba(16, 185, 129, 0.7)', label: 'Vet' }
        ].map((macro) => {
          const Icon = macro.icon
          const value = currentProgress[macro.key]
          const target = targets[macro.key]
          const percentage = Math.min((value / target) * 100, 100)
          
          return (
            <div
              key={macro.key}
              style={{
                background: `linear-gradient(135deg, ${macro.color}22 0%, ${macro.color}11 100%)`,
                borderRadius: '12px',
                padding: isMobile ? '0.6rem' : '0.875rem',
                border: `1px solid ${macro.color}33`,
                position: 'relative',
                overflow: 'hidden',
                minHeight: isMobile ? '65px' : '75px'
              }}
            >
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${percentage}%`,
                background: `linear-gradient(180deg, ${macro.color}22 0%, ${macro.color}11 100%)`,
                transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
              
              <div style={{
                position: 'relative',
                textAlign: 'center'
              }}>
                <Icon size={isMobile ? 13 : 15} style={{ 
                  color: macro.color, 
                  marginBottom: '2px'
                }} />
                <div style={{ 
                  color: macro.color, 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.8rem' : '0.9rem'
                }}>
                  {value}
                </div>
                <div style={{ 
                  color: 'rgba(255,255,255,0.4)', 
                  fontSize: '0.55rem'
                }}>
                  {macro.label}
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Water Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
            borderRadius: '12px',
            padding: isMobile ? '0.6rem' : '0.875rem',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            minHeight: isMobile ? '65px' : '75px',
            cursor: 'pointer'
          }}
          onClick={() => onAddWater(Math.min(waterIntake + 0.25, 3.0))}
        >
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${Math.min((waterIntake / 2.0) * 100, 100)}%`,
            background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.15) 100%)',
            transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />
          
          <div style={{
            position: 'relative',
            textAlign: 'center'
          }}>
            <Droplets size={isMobile ? 13 : 15} style={{ 
              color: 'rgba(59, 130, 246, 0.9)', 
              marginBottom: '2px'
            }} />
            <div style={{ 
              color: 'rgba(59, 130, 246, 0.9)', 
              fontWeight: 'bold',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}>
              {waterIntake.toFixed(1)}L
            </div>
            <div style={{ 
              color: 'rgba(255,255,255,0.4)', 
              fontSize: '0.55rem'
            }}>
              Water
            </div>
          </div>
          
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '4px',
            padding: '2px 4px',
            fontSize: '0.5rem',
            color: 'rgba(59, 130, 246, 0.7)'
          }}>
            +
          </div>
        </div>
      </div>
      
      {/* Meal Timeline - FIX: Toon ALLE meals */}
      <div style={{
        height: '60px',
        background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.03) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(16, 185, 129, 0.03) 100%)',
        borderRadius: '30px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        {/* Time markers */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 20px',
          alignItems: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.65rem',
          pointerEvents: 'none'
        }}>
          <span>6:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>24:00</span>
        </div>

        {/* Current time indicator */}
        {currentHour >= 6 && currentHour <= 24 && (
          <div style={{
            position: 'absolute',
            left: `${((currentHour - 6) / 18) * 100}%`,
            top: '0',
            bottom: '0',
            width: '2px',
            background: 'linear-gradient(180deg, transparent, rgba(16, 185, 129, 0.8), transparent)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
            animation: 'pulse 2s ease infinite',
            zIndex: 1
          }} />
        )}

        {/* Meal dots on timeline - TOON ALLE MEALS */}
        {meals && meals.length > 0 && meals.map((meal, idx) => {
          const Icon = getMealIcon(meal.timeSlot)
          const isEaten = checkedMeals[idx]
          const plannedTime = meal.plannedTime || 12 // Default tijd als plannedTime ontbreekt
          const position = ((plannedTime - 6) / 18) * 100
          
          return (
            <div
              key={`timeline-meal-${meal.id || idx}`}
              onClick={() => onToggleMeal(idx)}
              style={{
                position: 'absolute',
                left: `${Math.min(Math.max(position, 0), 100)}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isEaten 
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
                  : 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isEaten 
                  ? '2px solid rgba(16, 185, 129, 0.8)' 
                  : '2px solid rgba(16, 185, 129, 0.2)',
                zIndex: 2,
                boxShadow: isEaten 
                  ? '0 0 20px rgba(16, 185, 129, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)'
              }}
              title={`${meal.timeSlot}: ${meal.name}`}
            >
              <Icon size={20} style={{ 
                color: isEaten ? '#fff' : 'rgba(16, 185, 129, 0.6)'
              }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ===== MEAL CARD WITH FAVORITE =====
const MealCardWithFavorite = ({ 
  meal, 
  isEaten, 
  onToggle, 
  onSwap,
  onFavorite,
  isFavorite,
  timeSlot,
  imageUrl,
  onViewDetails 
}) => {
  const isMobile = useIsMobile()
  
  return (
    <div
      style={{
        background: isEaten
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)'
          : 'rgba(0, 0, 0, 0.3)',
        border: isEaten
          ? '1px solid rgba(16, 185, 129, 0.25)'
          : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '0.875rem',
        marginBottom: '0.75rem',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={onToggle}
    >
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onFavorite()
        }}
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          zIndex: 10
        }}
      >
        <Star 
          size={18} 
          style={{ 
            color: isFavorite ? '#f59e0b' : 'rgba(255,255,255,0.2)',
            fill: isFavorite ? '#f59e0b' : 'none',
            transition: 'all 0.3s ease'
          }} 
        />
      </button>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        {/* Meal image/icon - Klik voor details */}
        <div 
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails(meal)
          }}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: imageUrl 
              ? `url(${imageUrl}) center/cover`
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: isEaten 
              ? '2px solid rgba(16, 185, 129, 0.5)'
              : '2px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            flexShrink: 0,
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          {!imageUrl && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Utensils size={20} style={{ color: 'rgba(16, 185, 129, 0.3)' }} />
            </div>
          )}
          
          {isEaten && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CheckCircle2 size={24} style={{ color: '#fff' }} />
            </div>
          )}
        </div>
        
        {/* Meal info */}
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem'
          }}>
            <span style={{
              color: 'rgba(16, 185, 129, 0.6)',
              fontSize: '0.7rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {timeSlot}
            </span>
            
            {/* Swap button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSwap()
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(16, 185, 129, 0.5)',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div 
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails(meal)
            }}
            style={{
              color: '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              cursor: 'pointer',
              textDecoration: 'underline',
              textDecorationColor: 'transparent',
              transition: 'text-decoration-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecorationColor = 'rgba(16, 185, 129, 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecorationColor = 'transparent'
            }}
          >
            {meal.name}
          </div>
          
          {/* Macros */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Flame size={11} style={{ color: 'rgba(16, 185, 129, 0.6)' }} />
              {meal.kcal}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Dumbbell size={11} style={{ color: 'rgba(5, 150, 105, 0.6)' }} />
              {meal.protein}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Zap size={11} style={{ color: 'rgba(4, 120, 87, 0.6)' }} />
              {meal.carbs}g
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Droplets size={11} style={{ color: 'rgba(16, 185, 129, 0.5)' }} />
              {meal.fat}g
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ===== MAIN COMPONENT met alle features werkend =====
export default function ClientMealPlan({ client, onNavigate, db }) {
  const [loading, setLoading] = useState(true)
  const [meals, setMeals] = useState([])
  const [allMeals, setAllMeals] = useState([])
  const [customMeals, setCustomMeals] = useState([])
  const [checkedMeals, setCheckedMeals] = useState({})
  const [waterIntake, setWaterIntake] = useState(0.5)
  const [favorites, setFavorites] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSwapForMeal, setShowSwapForMeal] = useState(null)
  const [showCustomCreator, setShowCustomCreator] = useState(false)
  const [showMealDetail, setShowMealDetail] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [plan, setPlan] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const isMobile = useIsMobile()
  
  const [targets, setTargets] = useState({
    kcal: 2200,
    protein: 165,
    carbs: 220,
    fat: 73
  })
  
  // ===== DATA LOADING FROM DATABASE =====
  useEffect(() => {
    loadMealPlan()
  }, [client, db])
  
  // Auto-save wanneer meals worden gechecked
  useEffect(() => {
    if (Object.keys(checkedMeals).length > 0) {
      const saveTimer = setTimeout(() => {
        saveMealProgress(checkedMeals)
      }, 1000) // Save na 1 seconde
      
      return () => clearTimeout(saveTimer)
    }
  }, [checkedMeals])
  
  const loadMealPlan = async () => {
    if (!client?.id || !db) return
    
    setLoading(true)
    
    try {
      const clientId = client.id || client.user_id
      
      // Load client's meal plan
      const clientPlan = await db.getClientMealPlan(clientId)
      
      if (clientPlan) {
        setPlan(clientPlan)
        
        // Set targets from plan
        if (clientPlan.targets) {
          setTargets(clientPlan.targets)
        }
        
        // Process week structure to get today's meals
        const today = new Date()
        const startDate = clientPlan.start_date ? new Date(clientPlan.start_date) : new Date()
        const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
        const todayMeals = clientPlan.week_structure?.[dayIndex % 7]?.meals || []
        
        // Get meal details
        const mealIds = todayMeals.map(m => m.meal_id).filter(Boolean)
        if (mealIds.length > 0) {
          const mealDetails = await db.getMealsByIds(mealIds)
          
          // Combine meal data with time slots
          const mealsWithTiming = todayMeals.map((slot, idx) => {
            const meal = mealDetails.find(m => m.id === slot.meal_id)
            if (!meal) return null
            
            // Extract time from slot or use default
            const timeSlot = slot.time_slot || `Meal ${idx + 1}`
            const plannedTime = extractTimeFromSlot(timeSlot)
            
            return {
              ...meal,
              timeSlot,
              plannedTime,
              targetKcal: slot.target_kcal
            }
          }).filter(Boolean)
          
          setMeals(mealsWithTiming)
        }
      }
      
      // Load all meals for swap functionality
      const allMealsList = await db.getAllMeals()
      setAllMeals(allMealsList || [])
      
      // Load custom meals - alleen voor deze client
      const customMealsList = await db.getCustomMeals(clientId)
      setCustomMeals(customMealsList || [])
      
      // Load today's progress
      const today = new Date()
      const todayDate = today.toISOString().split('T')[0]
      const progress = await db.getMealProgress(clientId, todayDate)
      
      if (progress?.meals_checked) {
        const restoredChecks = {}
        
        // Parse meals_checked als het een string is
        let mealsCheckedData = progress.meals_checked
        if (typeof mealsCheckedData === 'string') {
          try {
            mealsCheckedData = JSON.parse(mealsCheckedData)
          } catch (e) {
            console.error('Error parsing meals_checked:', e)
            mealsCheckedData = []
          }
        }
        
        if (Array.isArray(mealsCheckedData)) {
          mealsCheckedData.forEach(check => {
            if (check.meal_index !== undefined) {
              restoredChecks[check.meal_index] = true
            }
          })
        }
        
        setCheckedMeals(restoredChecks)
      }
      
      // Load water intake
      const water = await db.getWaterIntake(clientId, todayDate)
      setWaterIntake(water?.amount || 0.5)
      
      // Load meal history (last 30 days)
      const history = await db.getMealHistory(clientId, 30)
      setHistoryData(history || [])
      
      // Load favorites from preferences
      const preferences = await db.getMealPreferences(clientId)
      if (preferences?.favorite_meals) {
        setFavorites(preferences.favorite_meals)
      }
      
    } catch (error) {
      console.error('Error loading meal plan:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Helper function to extract time from slot string
  const extractTimeFromSlot = (slot) => {
    const match = slot.match(/(\d{1,2}):(\d{2})/)
    if (match) {
      return parseInt(match[1]) + parseInt(match[2]) / 60
    }
    // Default times
    if (slot.toLowerCase().includes('ontbijt')) return 8
    if (slot.toLowerCase().includes('lunch')) return 13
    if (slot.toLowerCase().includes('diner')) return 19
    if (slot.toLowerCase().includes('snack')) {
      if (slot.includes('1')) return 10.5
      if (slot.includes('2')) return 16
      return 15
    }
    return 12
  }
  
  // ===== PROGRESS CALCULATION =====
  const calculateProgress = () => {
    let totals = { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    
    meals.forEach((meal, idx) => {
      if (checkedMeals[idx]) {
        totals.kcal += meal.kcal || 0
        totals.protein += meal.protein || 0
        totals.carbs += meal.carbs || 0
        totals.fat += meal.fat || 0
      }
    })
    
    return totals
  }
  
  const getNextMeal = () => {
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60
    
    for (let i = 0; i < meals.length; i++) {
      if (!checkedMeals[i] && meals[i].plannedTime > currentHour - 1) {
        return { ...meals[i], index: i }
      }
    }
    
    for (let i = 0; i < meals.length; i++) {
      if (!checkedMeals[i]) {
        return { ...meals[i], index: i }
      }
    }
    
    return null
  }
  
  const currentProgress = calculateProgress()
  const nextMeal = getNextMeal()
  
  // ===== ACTION HANDLERS =====
  const handleToggleMeal = async (idx) => {
    const newCheckedMeals = {
      ...checkedMeals,
      [idx]: !checkedMeals[idx]
    }
    setCheckedMeals(newCheckedMeals)
    setSaveStatus('Opslaan...')
  }
  
  const saveMealProgress = async (checkedMealsData) => {
    if (!db || !client) return
    
    try {
      const today = new Date().toISOString().split('T')[0]
      const clientId = client.id || client.user_id
      
      console.log('💾 Saving progress for client:', clientId)
      
      const mealsChecked = []
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0
      
      meals.forEach((meal, idx) => {
        if (checkedMealsData[idx]) {
          totalCalories += meal.kcal || 0
          totalProtein += meal.protein || 0
          totalCarbs += meal.carbs || 0
          totalFat += meal.fat || 0
          
          mealsChecked.push({
            meal_index: idx,
            meal_id: meal.id,
            meal_name: meal.name,
            time_slot: meal.timeSlot,
            macros: {
              kcal: meal.kcal,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat
            },
            checked_at: new Date().toISOString()
          })
        }
      })
      
      const progressData = {
        plan_id: plan?.id || null,
        date: today,
        day_index: 0,
        meals_checked: mealsChecked,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_carbs: totalCarbs,
        total_fat: totalFat
      }
      
      await db.saveMealProgress(clientId, progressData)
      
      // Reload history
      const history = await db.getMealHistory(clientId, 30)
      setHistoryData(history || [])
      
      setSaveStatus('✓ Opgeslagen')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (error) {
      console.error('❌ Error saving meal progress:', error)
      setSaveStatus('❌ Opslaan mislukt')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }
  
  const handleToggleFavorite = async (mealId) => {
    const newFavorites = favorites.includes(mealId) 
      ? favorites.filter(id => id !== mealId)
      : [...favorites, mealId]
    
    setFavorites(newFavorites)
    
    // Save to database
    if (db && client) {
      const clientId = client.id || client.user_id
      const preferences = await db.getMealPreferences(clientId) || {}
      await db.saveMealPreferences(clientId, {
        ...preferences,
        favorite_meals: newFavorites
      })
    }
  }
  
  const handleSwapMeal = (meal) => {
    setShowSwapForMeal(meal)
  }
  
  const handleSelectSwapMeal = async (newMeal) => {
    if (!showSwapForMeal || !db || !client) {
      setShowSwapForMeal(null)
      return
    }
    
    const mealIndex = meals.findIndex(m => 
      (m.id === showSwapForMeal.id && m.timeSlot === showSwapForMeal.timeSlot)
    )
    
    if (mealIndex === -1) {
      setShowSwapForMeal(null)
      return
    }
    
    // Update local state
    const newMeals = [...meals]
    newMeals[mealIndex] = {
      ...newMeal,
      timeSlot: showSwapForMeal.timeSlot,
      plannedTime: showSwapForMeal.plannedTime
    }
    setMeals(newMeals)
    
    // Save to database if plan exists
    if (plan) {
      const clientId = client.id || client.user_id
      const today = new Date()
      const startDate = plan.start_date ? new Date(plan.start_date) : new Date()
      const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      
      await db.saveMealSwap(
        clientId, 
        plan.id, 
        dayIndex % 7, 
        showSwapForMeal.timeSlot, 
        newMeal.id
      )
    }
    
    setShowSwapForMeal(null)
  }
  
  const handleSaveCustomMeal = async (customMeal) => {
    if (!db || !client) {
      console.error('❌ Missing db or client')
      setShowCustomCreator(false)
      return
    }
    
    try {
      const clientId = client.id || client.user_id
      console.log('📝 Saving custom meal with client ID:', clientId)
      
      const mealToSave = {
        ...customMeal,
        created_by: clientId,
        client_specific: true // Alleen voor deze client
      }
      
      const savedMeal = await db.saveCustomMeal(mealToSave)
      
      if (savedMeal) {
        // Check of meal al bestaat om duplicates te voorkomen
        setCustomMeals(prev => {
          const exists = prev.some(m => m.id === savedMeal.id)
          if (exists) return prev
          return [...prev, savedMeal]
        })
        
        setAllMeals(prev => {
          const exists = prev.some(m => m.id === savedMeal.id)
          if (exists) return prev
          return [...prev, savedMeal]
        })
        
        console.log('✅ Custom meal saved successfully')
        setShowCustomCreator(false)
        
        if (showSwapForMeal) {
          handleSelectSwapMeal(savedMeal)
        }
      }
    } catch (error) {
      console.error('❌ Error saving custom meal:', error)
      alert('Er ging iets mis bij het opslaan van je maaltijd.')
    }
  }
  
  const handleAddWater = async (newAmount) => {
    setWaterIntake(newAmount)
    
    if (db && client) {
      try {
        const today = new Date().toISOString().split('T')[0]
        const clientId = client.id || client.user_id
        
        console.log('💧 Saving water for client:', clientId, 'date:', today)
        await db.saveWaterIntake(clientId, today, newAmount)
      } catch (error) {
        console.error('❌ Failed to save water intake:', error)
      }
    }
  }
  
  const handleViewMealDetails = (meal) => {
    setShowMealDetail(meal)
  }
  
  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid rgba(16, 185, 129, 0.2)',
            borderTopColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: '50%',
            margin: '0 auto 1.5rem',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{ color: 'rgba(255,255,255,0.6)' }}>
            Loading your meal plan...
          </div>
        </div>
      </div>
    )
  }
  
  // ===== MAIN RENDER =====
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)',
      paddingBottom: '80px'
    }}>
      {/* Modals */}
      <MealDetailPopup
        isOpen={!!showMealDetail}
        onClose={() => setShowMealDetail(null)}
        meal={showMealDetail}
        db={db}
      />
      
      <CustomMealCreator
        isOpen={showCustomCreator}
        onClose={() => setShowCustomCreator(false)}
        onSave={handleSaveCustomMeal}
        db={db}
        client={client}
      />
      
      <SwapModal
        isOpen={!!showSwapForMeal}
        onClose={() => setShowSwapForMeal(null)}
        currentMeal={showSwapForMeal}
        onSelectMeal={handleSelectSwapMeal}
        allMeals={allMeals}
        favorites={favorites}
        customMeals={customMeals}
        onCreateCustom={() => {
          setShowSwapForMeal(null)
          setShowCustomCreator(true)
        }}
      />
      
      <HistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        historyData={historyData}
        targets={targets}
      />
      
      {/* Save Status Indicator */}
      {saveStatus && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: saveStatus.includes('✓') 
            ? 'rgba(16, 185, 129, 0.9)' 
            : saveStatus.includes('❌')
            ? 'rgba(239, 68, 68, 0.9)'
            : 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: '600',
          zIndex: 9999,
          animation: 'slideIn 0.3s ease'
        }}>
          {saveStatus}
        </div>
      )}
      
      {/* Main Content */}
      <div style={{ padding: isMobile ? '0.75rem' : '1rem' }}>
        {/* Timeline Progress Section */}
        <TimelineProgress
          meals={meals}
          checkedMeals={checkedMeals}
          onToggleMeal={handleToggleMeal}
          currentProgress={currentProgress}
          targets={targets}
          nextMeal={nextMeal}
          waterIntake={waterIntake}
          onAddWater={handleAddWater}
          onSwapMeal={handleSwapMeal}
        />
        
        {/* Meals List Section */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '1rem',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Utensils size={20} style={{ color: 'rgba(16, 185, 129, 0.7)' }} />
            Vandaag's Maaltijden
          </h3>
          
          {meals.length > 0 ? (
            meals.map((meal, idx) => (
              <MealCardWithFavorite
                key={`meal-${meal.id || idx}-${idx}`}
                meal={meal}
                isEaten={checkedMeals[idx]}
                onToggle={() => handleToggleMeal(idx)}
                onSwap={() => handleSwapMeal(meal)}
                onFavorite={() => handleToggleFavorite(meal.id)}
                isFavorite={favorites.includes(meal.id)}
                timeSlot={meal.timeSlot}
                imageUrl={meal.image_url}
                onViewDetails={handleViewMealDetails}
              />
            ))
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: 'rgba(255, 255, 255, 0.4)'
            }}>
              Geen maaltijden gepland voor vandaag.
              Vraag je coach om een meal plan voor je te maken!
            </div>
          )}
          
          {/* Add Custom Meal Button */}
          <button
            onClick={() => setShowCustomCreator(true)}
            style={{
              width: '100%',
              padding: '0.875rem',
              marginTop: '1rem',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              color: 'rgba(16, 185, 129, 0.9)',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)'
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.2)'
            }}
          >
            <PlusCircle size={18} />
            Voeg Eigen Maaltijd Toe
          </button>
        </div>
      </div>
      
      {/* Bottom Navigation - 3 Buttons */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg, transparent 0%, #0a0f0d 30%, #0a0f0d 100%)',
        padding: '0.75rem',
        display: 'flex',
        justifyContent: 'space-around',
        borderTop: '1px solid rgba(16, 185, 129, 0.1)'
      }}>
        <button 
          onClick={() => onNavigate('shopping')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
            e.currentTarget.style.color = 'rgba(16, 185, 129, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          <ShoppingCart size={22} />
          <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Shop</span>
        </button>
        
        <button 
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '8px',
            color: 'rgba(16, 185, 129, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            padding: '0.5rem 1.5rem'
          }}
        >
          <Utensils size={22} />
          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>Meals</span>
        </button>
        
        <button 
          onClick={() => setShowHistory(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            cursor: 'pointer',
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)'
            e.currentTarget.style.color = 'rgba(16, 185, 129, 0.8)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
          }}
        >
          <History size={22} />
          <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>History</span>
        </button>
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes wave {
          0% { background-position: 0 0; }
          100% { background-position: 100px 0; }
        }
        
        @keyframes rise {
          from { height: 0%; }
        }
        
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
