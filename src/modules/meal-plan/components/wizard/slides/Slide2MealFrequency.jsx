// src/modules/meal-plan/components/wizard/slides/Slide2MealFrequency.jsx
import React from 'react'
import { Coffee, Sun, Sunset, Moon, Cookie } from 'lucide-react'
import WizardLayout from '../shared/WizardLayout'

export default function Slide2MealFrequency({ data, onUpdate, isMobile }) {
  const frequency = data.mealFrequency || {
    meals: 3,
    snacks: 1
  }

  const handleMealChange = (count) => {
    onUpdate({
      ...frequency,
      meals: count
    })
  }

  const handleSnackChange = (count) => {
    onUpdate({
      ...frequency,
      snacks: count
    })
  }

  const kerstenMessage = `Het aantal maaltijden en snacks per dag bepaalt hoe we je calorieën verdelen.

Kies wat het beste bij je dagindeling past. De meeste mensen doen het goed op 3-4 maaltijden met 1-2 snacks.`

  const mealOptions = [
    { count: 3, icon: Sun, label: '3 Maaltijden', description: 'Ontbijt, Lunch, Diner' },
    { count: 4, icon: Sunset, label: '4 Maaltijden', description: 'Extra maaltijd tussendoor' },
    { count: 5, icon: Moon, label: '5 Maaltijden', description: 'Kleinere porties, vaker eten' }
  ]

  const snackOptions = [
    { count: 0, label: 'Geen Snacks', description: 'Alleen maaltijden' },
    { count: 1, label: '1 Snack', description: 'Tussen maaltijden door' },
    { count: 2, label: '2 Snacks', description: 'Ochtend & middag' },
    { count: 3, label: '3 Snacks', description: 'Extra energie boosts' }
  ]

  return (
    <WizardLayout
      coachMessage={kerstenMessage}
      title="🍽️ Maaltijd Frequentie"
      subtitle="Hoeveel keer per dag wil je eten?"
      isMobile={isMobile}
    >
      {/* Meals Selection */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Sun size={20} color="#10b981" />
          Aantal Maaltijden
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          {mealOptions.map(option => {
            const isSelected = frequency.meals === option.count
            const Icon = option.icon

            return (
              <button
                key={option.count}
                onClick={() => handleMealChange(option.count)}
                style={{
                  padding: isMobile ? '1.25rem' : '1.5rem',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid #10b981'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  margin: '0 auto 1rem',
                  borderRadius: '50%',
                  background: isSelected
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <Icon size={28} color={isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.5)'} />
                </div>

                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: isSelected ? '#10b981' : '#fff',
                  marginBottom: '0.5rem'
                }}>
                  {option.label}
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.4
                }}>
                  {option.description}
                </div>

                {isSelected && (
                  <div style={{
                    marginTop: '1rem',
                    width: '32px',
                    height: '32px',
                    margin: '1rem auto 0',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem'
                  }}>
                    ✓
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Snacks Selection */}
      <div>
        <h4 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Cookie size={20} color="#f59e0b" />
          Aantal Snacks
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '1rem'
        }}>
          {snackOptions.map(option => {
            const isSelected = frequency.snacks === option.count

            return (
              <button
                key={option.count}
                onClick={() => handleSnackChange(option.count)}
                style={{
                  padding: '1.25rem 1rem',
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected
                    ? '2px solid #f59e0b'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.3)',
                  marginBottom: '0.5rem'
                }}>
                  {option.count}
                </div>

                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: isSelected ? '#f59e0b' : '#fff',
                  marginBottom: '0.25rem'
                }}>
                  {option.label}
                </div>

                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  {option.description}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '2rem',
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#10b981',
          marginBottom: '0.5rem'
        }}>
          Jouw dagindeling
        </div>

        <div style={{
          fontSize: isMobile ? '1.75rem' : '2rem',
          fontWeight: '800',
          color: '#fff',
          marginBottom: '0.5rem'
        }}>
          {frequency.meals} Maaltijden + {frequency.snacks} {frequency.snacks === 1 ? 'Snack' : 'Snacks'}
        </div>

        <div style={{
          fontSize: '0.95rem',
          color: 'rgba(255, 255, 255, 0.7)'
        }}>
          = {frequency.meals + frequency.snacks} eetmomenten per dag
        </div>
      </div>
    </WizardLayout>
  )
}
