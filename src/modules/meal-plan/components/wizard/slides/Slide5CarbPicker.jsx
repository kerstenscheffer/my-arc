// src/modules/meal-plan/components/wizard/slides/Slide5CarbPicker.jsx
import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import WizardLayout from '../shared/WizardLayout'
import IngredientPickerModal from '../pickers/IngredientPickerModal'

export default function Slide5CarbPicker({ data, onUpdate, db, isMobile }) {
  const [showPicker, setShowPicker] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)

  const carbSources = data.carbSources || []

  const handleOpenPicker = (slotIndex) => {
    setEditingSlot(slotIndex)
    setShowPicker(true)
  }

  const handleSelectIngredient = (ingredient) => {
    const newSources = [...carbSources]
    newSources[editingSlot] = ingredient
    onUpdate(newSources)
    setShowPicker(false)
    setEditingSlot(null)
  }

  const handleRemove = (slotIndex) => {
    const newSources = [...carbSources]
    newSources[slotIndex] = null
    onUpdate(newSources)
  }

  const kerstenMessage = `Nu we de eiwitten hebben, vind ik het fijn om 3 bronnen complexe koolhydraten te hebben die ik makkelijk kan verhogen of verminderen.

Blijf weg van witte pasta's en bloem! Kies voor volkoren en vezelrijke opties.`

  const suggestions = ['Havermout', 'Rijst', 'Bruin Brood']

  return (
    <>
      <WizardLayout
        coachMessage={kerstenMessage}
        title="🍚 Jouw 3 Koolhydraten"
        subtitle="Selecteer 3 complexe koolhydraten voor je dagelijkse maaltijden"
        isMobile={isMobile}
      >
        {/* Selection Slots */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {[0, 1, 2].map(slotIndex => {
            const ingredient = carbSources[slotIndex]

            return (
              <div key={slotIndex}>
                {ingredient ? (
                  // Filled Slot
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '16px',
                    padding: isMobile ? '1.25rem' : '1.5rem',
                    position: 'relative',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemove(slotIndex)}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#fff',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <X size={16} />
                    </button>

                    {/* Content */}
                    <div>
                      <div style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#f59e0b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Koolhydraat {slotIndex + 1}
                      </div>

                      <div style={{
                        fontSize: isMobile ? '1.125rem' : '1.25rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '1rem'
                      }}>
                        {ingredient.name}
                      </div>

                      {/* Macros */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '0.5rem'
                      }}>
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#f59e0b'
                          }}>
                            {ingredient.carbs_per_100g}g
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            Carbs
                          </div>
                        </div>

                        <div style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '0.5rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: '#10b981'
                          }}>
                            {ingredient.calories_per_100g}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            Kcal
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Change Button */}
                    <button
                      onClick={() => handleOpenPicker(slotIndex)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        marginTop: '1rem',
                        background: 'rgba(245, 158, 11, 0.2)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '10px',
                        color: '#f59e0b',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Wijzig
                    </button>
                  </div>
                ) : (
                  // Empty Slot
                  <button
                    onClick={() => handleOpenPicker(slotIndex)}
                    style={{
                      width: '100%',
                      minHeight: '180px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '2px dashed rgba(245, 158, 11, 0.3)',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: '1.5rem'
                    }}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                      border: '2px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plus size={28} color="#f59e0b" />
                    </div>

                    <div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#f59e0b',
                        marginBottom: '0.25rem'
                      }}>
                        Koolhydraat {slotIndex + 1}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255, 255, 255, 0.5)'
                      }}>
                        Klik om te kiezen
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Progress Indicator */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#10b981'
          }}>
            {carbSources.filter(Boolean).length} / 3 koolhydraten geselecteerd
          </div>
          {carbSources.filter(Boolean).length < 3 && (
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '0.25rem'
            }}>
              Selecteer nog {3 - carbSources.filter(Boolean).length} {carbSources.filter(Boolean).length === 2 ? 'bron' : 'bronnen'}
            </div>
          )}
        </div>
      </WizardLayout>

      {/* Ingredient Picker Modal */}
      {showPicker && (
        <IngredientPickerModal
          isOpen={showPicker}
          onClose={() => {
            setShowPicker(false)
            setEditingSlot(null)
          }}
          onSelect={handleSelectIngredient}
          category="carbs"
          suggestions={suggestions}
          db={db}
          isMobile={isMobile}
        />
      )}
    </>
  )
}
