// src/coach/tabs/client-info/NutritionInfoTab.jsx
import { useState, useEffect } from 'react'
import { Save, X, Edit2, Utensils, Coffee, ChefHat } from 'lucide-react'
import Field from './components/Field'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function NutritionInfoTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const service = new ClientIntelligenceService(db)
  
  useEffect(() => {
    if (client) {
      loadClientData()
    }
  }, [client?.id])
  
  const loadClientData = async () => {
    setLoading(true)
    try {
      const profile = await service.getCompleteProfile(client.id)
      setFormData({
        dietaryType: profile.dietaryType || '',
        allergies: profile.allergies || '',
        intolerances: profile.intolerances || '',
        lovedFoods: profile.lovedFoods || '',
        hatedFoods: profile.hatedFoods || '',
        favoriteCuisines: profile.favoriteCuisines || '',
        budgetPerWeek: profile.budgetPerWeek || '',
        cookingSkill: profile.cookingSkill || '',
        cookingTime: profile.cookingTime || '',
        mealPrepPreference: profile.mealPrepPreference || '',
        mealPreferences: client.meal_preferences || ''
      })
    } catch (error) {
      console.error('Error loading nutrition data:', error)
      setFormData({
        dietaryType: client.dietary_type || '',
        allergies: client.allergies || '',
        intolerances: client.intolerances || '',
        lovedFoods: client.loved_foods || '',
        hatedFoods: client.hated_foods || '',
        favoriteCuisines: client.favorite_cuisines || '',
        budgetPerWeek: client.budget_per_week || '',
        cookingSkill: client.cooking_skill || '',
        cookingTime: client.cooking_time || '',
        mealPrepPreference: client.meal_prep_preference || '',
        mealPreferences: client.meal_preferences || ''
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await service.updateProfile(client.id, formData)
      await onRefresh()
      setIsEditing(false)
      alert('✅ Nutrition preferences updated successfully!')
    } catch (error) {
      console.error('Error saving nutrition:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    loadClientData()
    setIsEditing(false)
  }
  
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  return (
    <div>
      {/* Edit/Save Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginBottom: '1.5rem'
      }}>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            <Edit2 size={16} />
            Edit Nutrition
          </button>
        ) : (
          <>
            <button onClick={handleCancel} style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.85rem',
              cursor: 'pointer',
              minHeight: '44px'
            }}>
              <X size={16} />
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: isMobile ? '0.6rem 1rem' : '0.75rem 1rem',
              background: saving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.85rem' : '0.85rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              minHeight: '44px'
            }}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        )}
      </div>
      
      {/* Content Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Dietary Preferences */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Utensils size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Dietary Preferences
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Dietary Type" 
              value={formData.dietaryType} 
              onChange={(v) => setFormData({...formData, dietaryType: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select diet...' },
                { value: 'omnivore', label: '🍖 Omnivore' },
                { value: 'vegetarian', label: '🥗 Vegetarian' },
                { value: 'vegan', label: '🌱 Vegan' },
                { value: 'pescatarian', label: '🐟 Pescatarian' },
                { value: 'keto', label: '🥓 Keto' },
                { value: 'paleo', label: '🦴 Paleo' },
                { value: 'mediterranean', label: '🫒 Mediterranean' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Allergies" 
              value={formData.allergies} 
              onChange={(v) => setFormData({...formData, allergies: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="e.g., Nuts, Shellfish, Dairy..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Intolerances" 
              value={formData.intolerances} 
              onChange={(v) => setFormData({...formData, intolerances: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="e.g., Lactose, Gluten..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Loved Foods" 
              value={formData.lovedFoods} 
              onChange={(v) => setFormData({...formData, lovedFoods: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="Foods you absolutely love..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Hated Foods" 
              value={formData.hatedFoods} 
              onChange={(v) => setFormData({...formData, hatedFoods: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="Foods you want to avoid..."
              isMobile={isMobile}
            />
            
            <Field 
              label="Favorite Cuisines" 
              value={formData.favoriteCuisines} 
              onChange={(v) => setFormData({...formData, favoriteCuisines: v})} 
              isEditing={isEditing}
              placeholder="e.g., Italian, Thai, Mexican..."
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Practical Info */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <ChefHat size={18} color="#10b981" />
            <h3 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              Practical Info
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Field 
              label="Weekly Budget (€)" 
              value={formData.budgetPerWeek} 
              onChange={(v) => setFormData({...formData, budgetPerWeek: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="50"
              min="10"
              max="500"
              isMobile={isMobile}
            />
            
            <Field 
              label="Cooking Skill" 
              value={formData.cookingSkill} 
              onChange={(v) => setFormData({...formData, cookingSkill: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select skill level...' },
                { value: 'beginner', label: '👶 Beginner' },
                { value: 'intermediate', label: '👨‍🍳 Intermediate' },
                { value: 'advanced', label: '👨‍🍳 Advanced' },
                { value: 'chef', label: '👨‍🍳 Chef Level' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Cooking Time (min/day)" 
              value={formData.cookingTime} 
              onChange={(v) => setFormData({...formData, cookingTime: v})} 
              isEditing={isEditing} 
              type="number"
              placeholder="30"
              min="5"
              max="180"
              isMobile={isMobile}
            />
            
            <Field 
              label="Meal Prep Preference" 
              value={formData.mealPrepPreference} 
              onChange={(v) => setFormData({...formData, mealPrepPreference: v})} 
              isEditing={isEditing}
              type="select"
              options={[
                { value: '', label: 'Select preference...' },
                { value: 'daily', label: '📅 Cook Daily' },
                { value: 'batch', label: '📦 Batch Cook (2-3x/week)' },
                { value: 'weekly', label: '📆 Weekly Meal Prep' },
                { value: 'mixed', label: '🔄 Mixed Approach' }
              ]}
              isMobile={isMobile}
            />
            
            <Field 
              label="Additional Preferences" 
              value={formData.mealPreferences} 
              onChange={(v) => setFormData({...formData, mealPreferences: v})} 
              isEditing={isEditing} 
              type="textarea"
              placeholder="Any other meal preferences or notes..."
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
