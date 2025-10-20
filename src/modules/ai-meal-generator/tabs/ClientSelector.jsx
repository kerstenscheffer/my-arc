// src/modules/ai-meal-generator/tabs/ClientSelector.jsx
// TAB 1: Client Selection & Macro Targets

import { useState, useEffect } from 'react'
import { User, Activity, Target, Calculator, Info } from 'lucide-react'

export default function ClientSelector({
  db,
  clients = [],
  selectedClient,
  setSelectedClient,
  dailyTargets,
  setDailyTargets,
  mealsPerDay,
  setMealsPerDay,
  updateClientProfile,
  isMobile
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [tdeeCalculator, setTdeeCalculator] = useState(false)
  
  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })
  
  // Calculate TDEE
  const calculateTDEE = () => {
    if (!selectedClient) return
    
    const weight = selectedClient.current_weight || 75
    const height = selectedClient.height || 180
    const age = selectedClient.age || 30
    const gender = selectedClient.gender || 'male'
    const activityLevel = selectedClient.activity_level || 'moderate'
    
    // Mifflin-St Jeor Formula
    let bmr = gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      very_active: 1.725,
      extreme: 1.9
    }
    
    const tdee = Math.round(bmr * (activityMultipliers[activityLevel] || 1.55))
    
    // Set macros based on goal
    const goal = selectedClient.primary_goal || 'maintain'
    let targetCalories = tdee
    
    if (goal === 'fat_loss') targetCalories = tdee - 500
    if (goal === 'muscle_gain') targetCalories = tdee + 300
    
    // Calculate macros (40/30/30 split)
    const protein = Math.round((targetCalories * 0.30) / 4)
    const carbs = Math.round((targetCalories * 0.40) / 4)
    const fat = Math.round((targetCalories * 0.30) / 9)
    
    setDailyTargets({
      calories: targetCalories,
      protein,
      carbs,
      fat
    })
  }
  
  // Load existing targets when client selected
  useEffect(() => {
    if (selectedClient) {
      if (selectedClient.target_calories) {
        setDailyTargets({
          calories: selectedClient.target_calories,
          protein: selectedClient.target_protein || 150,
          carbs: selectedClient.target_carbs || 200,
          fat: selectedClient.target_fat || 67
        })
      } else {
        calculateTDEE()
      }
    }
  }, [selectedClient])
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1rem' : '1.5rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          fontWeight: '700',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          Selecteer Client & Stel Targets In
        </h2>
        <p style={{
          fontSize: isMobile ? '0.875rem' : '0.95rem',
          color: 'rgba(255,255,255,0.6)'
        }}>
          Kies een client en bepaal de dagelijkse macro targets
        </p>
      </div>
      
      {/* Client Search & Selection */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
        gap: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Client List */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: isMobile ? '1rem' : '1.25rem'
        }}>
          <input
            type="text"
            placeholder="Zoek client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              marginBottom: '1rem'
            }}
          />
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: isMobile ? '200px' : '300px',
            overflowY: 'auto'
          }}>
            {filteredClients.map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client)}
                style={{
                  padding: '0.75rem',
                  background: selectedClient?.id === client.id
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'rgba(255,255,255,0.05)',
                  border: selectedClient?.id === client.id
                    ? '1px solid #8b5cf6'
                    : '1px solid transparent',
                  borderRadius: '8px',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (selectedClient?.id !== client.id) {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedClient?.id !== client.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <User size={18} />
                  <div>
                    <div style={{
                      fontWeight: '600',
                      fontSize: isMobile ? '0.9rem' : '0.95rem'
                    }}>
                      {client.first_name} {client.last_name}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: '0.25rem'
                    }}>
                      {client.primary_goal || 'Geen doel'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Selected Client Details & Targets */}
        {selectedClient ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: isMobile ? '1rem' : '1.25rem'
          }}>
            {/* Client Info */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div>
                <h3 style={{
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  fontWeight: '600',
                  color: '#8b5cf6',
                  marginBottom: '0.25rem'
                }}>
                  {selectedClient.first_name} {selectedClient.last_name}
                </h3>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <span>{selectedClient.age || 30}jr</span>
                  <span>{selectedClient.current_weight || 75}kg</span>
                  <span>{selectedClient.height || 180}cm</span>
                  <span>{selectedClient.gender === 'female' ? '♀️' : '♂️'}</span>
                </div>
              </div>
              
              <button
                onClick={() => setTdeeCalculator(!tdeeCalculator)}
                style={{
                  padding: '0.5rem',
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '8px',
                  color: '#8b5cf6',
                  cursor: 'pointer'
                }}
              >
                <Calculator size={20} />
              </button>
            </div>
            
            {/* TDEE Calculator */}
            {tdeeCalculator && (
              <div style={{
                padding: '1rem',
                background: 'rgba(139, 92, 246, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                marginBottom: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                  color: '#8b5cf6'
                }}>
                  <Info size={18} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                    TDEE Calculator
                  </span>
                </div>
                
                <p style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '1rem'
                }}>
                  Gebaseerd op client data:
                  BMR × {selectedClient.activity_level || 'moderate'} activiteit
                </p>
                
                <button
                  onClick={calculateTDEE}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Bereken & Pas Toe
                </button>
              </div>
            )}
            
            {/* Macro Targets */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {/* Calories */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Calorieën per dag
                </label>
                <input
                  type="number"
                  value={dailyTargets.calories}
                  onChange={(e) => setDailyTargets({
                    ...dailyTargets,
                    calories: parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              {/* Protein */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Eiwitten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.protein}
                  onChange={(e) => setDailyTargets({
                    ...dailyTargets,
                    protein: parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              {/* Carbs */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Koolhydraten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.carbs}
                  onChange={(e) => setDailyTargets({
                    ...dailyTargets,
                    carbs: parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              {/* Fat */}
              <div>
                <label style={{
                  fontSize: '0.85rem',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '0.5rem',
                  display: 'block'
                }}>
                  Vetten (gram)
                </label>
                <input
                  type="number"
                  value={dailyTargets.fat}
                  onChange={(e) => setDailyTargets({
                    ...dailyTargets,
                    fat: parseInt(e.target.value) || 0
                  })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            
            {/* Meals per Day */}
            <div style={{ marginTop: '1.5rem' }}>
              <label style={{
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '0.75rem',
                display: 'block',
                fontWeight: '600'
              }}>
                Maaltijden per dag
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem'
              }}>
                {[3, 4, 5, 6].map(num => (
                  <button
                    key={num}
                    onClick={() => setMealsPerDay(num)}
                    style={{
                      padding: '0.75rem',
                      background: mealsPerDay === num
                        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: mealsPerDay === num
                        ? '1px solid #8b5cf6'
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontWeight: mealsPerDay === num ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Save Profile Button */}
            {updateClientProfile && (
              <button
                onClick={updateClientProfile}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  minHeight: '44px',
                  touchAction: 'manipulation'
                }}
              >
                Targets Opslaan in Profiel
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Target size={48} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }} />
            <p style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              color: 'rgba(255,255,255,0.5)',
              textAlign: 'center'
            }}>
              Selecteer een client om de macro targets in te stellen
            </p>
          </div>
        )}
      </div>
      
      {/* Info Box */}
      <div style={{
        padding: '1rem',
        background: 'rgba(139, 92, 246, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '0.75rem'
        }}>
          <Info size={20} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '0.1rem' }} />
          <div style={{ fontSize: isMobile ? '0.85rem' : '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
            <strong>Tip:</strong> De AI gebruikt deze targets om maaltijden te selecteren die perfect passen bij de doelen van {selectedClient?.first_name || 'de client'}.
            Gebruik de TDEE calculator voor een wetenschappelijke basis.
          </div>
        </div>
      </div>
    </div>
  )
}
