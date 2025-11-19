// src/modules/meal-plan/components/wizard/slides/Slide6MealPrep.jsx
import React, { useState } from 'react'
import { Clock, Users, ChefHat } from 'lucide-react'
import WizardLayout from '../shared/WizardLayout'

export default function Slide6MealPrep({ data, onUpdate, isMobile }) {
  const mealPrepPlan = data.mealPrepPlan || {
    batchCooking: false,
    dailyPrep: [],
    portionSize: 1
  }

  const handleToggleBatch = () => {
    onUpdate({
      ...mealPrepPlan,
      batchCooking: !mealPrepPlan.batchCooking
    })
  }

  const handleToggleDailyPrep = (prepType) => {
    const dailyPrep = mealPrepPlan.dailyPrep || []
    const exists = dailyPrep.includes(prepType)

    onUpdate({
      ...mealPrepPlan,
      dailyPrep: exists
        ? dailyPrep.filter(p => p !== prepType)
        : [...dailyPrep, prepType]
    })
  }

  const handlePortionChange = (delta) => {
    const newSize = Math.max(1, Math.min(6, (mealPrepPlan.portionSize || 1) + delta))
    onUpdate({
      ...mealPrepPlan,
      portionSize: newSize
    })
  }

  const kerstenMessage = `Meal prep kan het verschil maken tussen pizza of pasta kiezen. Het kan zo simpel zijn als een bakje kwark klaarzetten of 20 bakken pasta voor 2 weken maken.

Begin klein en bouw het op naar wat bij jou past!`

  const dailyPrepOptions = [
    {
      id: 'yogurt',
      emoji: '🥛',
      title: 'Kwark/Yoghurt',
      description: 'Portie klaar in de koelkast',
      time: '2 min'
    },
    {
      id: 'fruits',
      emoji: '🍎',
      title: 'Fruit Wassen',
      description: 'Snacks voor onderweg',
      time: '5 min'
    },
    {
      id: 'veggies',
      emoji: '🥦',
      title: 'Groenten Snijden',
      description: 'Klaar voor gebruik',
      time: '10 min'
    },
    {
      id: 'rice',
      emoji: '🍚',
      title: 'Rijst/Pasta',
      description: 'Basis voor meerdere dagen',
      time: '15 min'
    }
  ]

  return (
    <WizardLayout
      coachMessage={kerstenMessage}
      title="🍱 Jouw Meal Prep Plan"
      subtitle="Kies hoe je je maaltijden wilt voorbereiden"
      isMobile={isMobile}
    >
      {/* Batch Cooking */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ChefHat size={20} color="#8b5cf6" />
          Grote Meal Prep (Batch Cooking)
        </h4>

        <button
          onClick={handleToggleBatch}
          style={{
            width: '100%',
            padding: isMobile ? '1.25rem' : '1.5rem',
            background: mealPrepPlan.batchCooking
              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
              : 'rgba(255, 255, 255, 0.03)',
            border: mealPrepPlan.batchCooking
              ? '2px solid #8b5cf6'
              : '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'left'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: mealPrepPlan.batchCooking ? '#8b5cf6' : '#fff'
            }}>
              🍲 Ik wil grote batches koken
            </div>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: mealPrepPlan.batchCooking
                ? '#8b5cf6'
                : 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}>
              {mealPrepPlan.batchCooking && '✓'}
            </div>
          </div>

          <div style={{
            fontSize: '0.95rem',
            color: 'rgba(255, 255, 255, 0.6)',
            lineHeight: 1.5
          }}>
            Kook bijvoorbeeld 10-20 porties pasta, kip, of andere maaltijden en vries ze in.
            Perfect voor 1-2 weken vooruit!
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Clock size={16} />
              2-3 uur
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              <Users size={16} />
              10-20 porties
            </div>
          </div>
        </button>
      </div>

      {/* Daily Prep Options */}
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Clock size={20} color="#10b981" />
          Dagelijkse Kleine Prep
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem'
        }}>
          {dailyPrepOptions.map(option => {
            const isSelected = (mealPrepPlan.dailyPrep || []).includes(option.id)

            return (
              <button
                key={option.id}
                onClick={() => handleToggleDailyPrep(option.id)}
                style={{
                  padding: '1.25rem',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid #10b981'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}>
                  <div style={{
                    fontSize: '2.5rem',
                    lineHeight: 1
                  }}>
                    {option.emoji}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: isSelected ? '#10b981' : '#fff'
                      }}>
                        {option.title}
                      </div>
                      {isSelected && (
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#10b981',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem'
                        }}>
                          ✓
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.6)',
                      marginBottom: '0.5rem'
                    }}>
                      {option.description}
                    </div>

                    <div style={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Clock size={12} />
                      {option.time}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Portion Calculator */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px'
      }}>
        <h4 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '1rem'
        }}>
          📊 Standaard Portie Grootte
        </h4>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{
            flex: 1,
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.95rem'
          }}>
            Voor hoeveel personen kook je meestal?
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => handlePortionChange(-1)}
              disabled={mealPrepPlan.portionSize <= 1}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '1.5rem',
                fontWeight: '700',
                cursor: mealPrepPlan.portionSize <= 1 ? 'not-allowed' : 'pointer',
                opacity: mealPrepPlan.portionSize <= 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              -
            </button>

            <div style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#10b981',
              minWidth: '3rem',
              textAlign: 'center'
            }}>
              {mealPrepPlan.portionSize || 1}
            </div>

            <button
              onClick={() => handlePortionChange(1)}
              disabled={mealPrepPlan.portionSize >= 6}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                fontSize: '1.5rem',
                fontWeight: '700',
                cursor: mealPrepPlan.portionSize >= 6 ? 'not-allowed' : 'pointer',
                opacity: mealPrepPlan.portionSize >= 6 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px'
      }}>
        <div style={{
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '0.5rem'
        }}>
          Jouw meal prep plan:
        </div>
        <div style={{
          fontSize: '1rem',
          color: '#fff',
          fontWeight: '500'
        }}>
          {mealPrepPlan.batchCooking && '✓ Batch cooking'}
          {mealPrepPlan.batchCooking && (mealPrepPlan.dailyPrep?.length > 0) && ' • '}
          {(mealPrepPlan.dailyPrep?.length > 0) &&
            `${mealPrepPlan.dailyPrep.length} dagelijkse prep ${mealPrepPlan.dailyPrep.length === 1 ? 'optie' : 'opties'}`}
          {!mealPrepPlan.batchCooking && !mealPrepPlan.dailyPrep?.length &&
            'Geen meal prep geselecteerd (dat kan ook!)'}
        </div>
      </div>
    </WizardLayout>
  )
}
