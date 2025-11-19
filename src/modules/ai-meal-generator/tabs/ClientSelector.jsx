// src/modules/ai-meal-generator/tabs/ClientSelector.jsx
// TAB 1: Client Selection & Macro Targets - WITH MACRO CALCULATOR MODAL

import { useState, useEffect } from 'react'
import { User, Activity, Target, Calculator, Info } from 'lucide-react'
import MacroCalculatorModal from '../components/MacroCalculatorModal'

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
  const [showMacroModal, setShowMacroModal] = useState(false)
  
  // Filter clients based on search
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })
  
  // Handle macro calculator save
  const handleMacroSave = (calculatedMacros) => {
    setDailyTargets({
      calories: calculatedMacros.calories,
      protein: calculatedMacros.protein,
      carbs: calculatedMacros.carbs,
      fat: calculatedMacros.fat
    })
    setShowMacroModal(false)
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
        // Default fallback values
        setDailyTargets({
          calories: 2500,
          protein: 180,
          carbs: 280,
          fat: 70
        })
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
                onClick={() => setShowMacroModal(true)}
                style={{
                  padding: isMobile ? '0.625rem' : '0.75rem',
                  background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <Calculator size={isMobile ? 16 : 18} />
                {!isMobile && 'Macro Calculator'}
              </button>
            </div>
            
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
                      transition: 'all 0.3s ease',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
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
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
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
            Gebruik de Macro Calculator voor een wetenschappelijke basis met body fat %, activiteit en goal-specifieke formules.
          </div>
        </div>
      </div>
      
      {/* Macro Calculator Modal */}
      {showMacroModal && selectedClient && (
        <MacroCalculatorModal
          client={selectedClient}
          onClose={() => setShowMacroModal(false)}
          onSave={handleMacroSave}
          isMobile={isMobile}
        />
      )}
    </div>
  )
}
