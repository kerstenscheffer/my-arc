// src/modules/meal-plan/components/wizard/slides/Slide4ProteinPicker.jsx
import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import WizardLayout from '../shared/WizardLayout'
import IngredientPickerModal from '../pickers/IngredientPickerModal'

export default function Slide4ProteinPicker({ data, onUpdate, db, isMobile }) {
  const [showPicker, setShowPicker] = useState(false)
  const [editingSlot, setEditingSlot] = useState(null)

  const proteinSources = data.proteinSources || []

  const handleOpenPicker = (slotIndex) => {
    setEditingSlot(slotIndex)
    setShowPicker(true)
  }

  const handleSelectIngredient = (ingredient) => {
    const newSources = [...proteinSources]
    newSources[editingSlot] = ingredient
    onUpdate(newSources)
    setShowPicker(false)
    setEditingSlot(null)
  }

  const handleRemove = (slotIndex) => {
    const newSources = [...proteinSources]
    newSources[slotIndex] = null
    onUpdate(newSources)
  }

  const kerstenMessage = `Omdat genoeg eiwitten eten essentieel is, heb ik hier iets op bedacht wat enorm helpt je eiwitten te halen: 3 bronnen opstellen die je dagelijks zou kunnen/willen eten.

Dit maakt het kiezen van je maaltijden veel makkelijker en zorgt dat je altijd genoeg eiwit binnen krijgt!`

  const suggestions = ['Whey', 'Varkensvlees', 'Eieren']

  return (
    <>
      <WizardLayout
        coachMessage={kerstenMessage}
        title="🥩 Jouw 3 Eiwitbronnen"
        subtitle="Selecteer 3 eiwitbronnen die je vaak eet en makkelijk kunt bereiden"
        isMobile={isMobile}
      >
        {/* Selection Slots */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '1rem' : '1.5rem'
        }}>
          {[0, 1, 2].map(slotIndex => {
            const ingredient = proteinSources[slotIndex]

            return (
              <div key={slotIndex}>
                {ingredient ? (
                  // Filled Slot
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
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
                        color: '#ef4444',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: '0.5rem'
                      }}>
                        Eiwitbron {slotIndex + 1}
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
                            color: '#10b981'
                          }}>
                            {ingredient.protein_per_100g}g
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase'
                          }}>
                            Eiwit
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
                            color: '#f59e0b'
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
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        color: '#ef4444',
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
                      border: '2px dashed rgba(239, 68, 68, 0.3)',
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
                      background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
                      border: '2px solid rgba(239, 68, 68, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Plus size={28} color="#ef4444" />
                    </div>

                    <div>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#ef4444',
                        marginBottom: '0.25rem'
                      }}>
                        Eiwitbron {slotIndex + 1}
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
            {proteinSources.filter(Boolean).length} / 3 eiwitbronnen geselecteerd
          </div>
          {proteinSources.filter(Boolean).length < 3 && (
            <div style={{
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginTop: '0.25rem'
            }}>
              Selecteer nog {3 - proteinSources.filter(Boolean).length} {proteinSources.filter(Boolean).length === 2 ? 'bron' : 'bronnen'}
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
          category="protein"
          suggestions={suggestions}
          db={db}
          isMobile={isMobile}
        />
      )}
    </>
  )
}
