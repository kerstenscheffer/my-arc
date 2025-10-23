// src/modules/meal-plan/components/wizard/slides/Slide1Goals.jsx
import React from 'react'
import { Target, Zap, TrendingUp } from 'lucide-react'
import WizardLayout from '../shared/WizardLayout'

export default function Slide1Goals({ client, isMobile }) {
  // Get macro goals from client data
  const goals = client?.macro_goals || {
    calories: 2200,
    protein: 165,
    carbs: 220,
    fat: 70
  }

  const kerstenMessage = `Welkom! We gaan samen je meal plan opzetten op basis van jouw doelen.

Ik zie dat je {goals.calories} calorieën per dag moet eten. Laten we nu de juiste basis leggen zodat je dit makkelijk kunt volhouden!`

  return (
    <WizardLayout
      coachMessage={kerstenMessage.replace('{goals.calories}', goals.calories)}
      title="🎯 Jouw Doelen"
      subtitle="Dit zijn je dagelijkse macro doelen"
      isMobile={isMobile}
    >
      {/* Goals Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Calories Card */}
        <div style={{
          gridColumn: isMobile ? 'span 1' : 'span 2',
          padding: isMobile ? '1.5rem' : '2rem',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '20px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '50%',
            filter: 'blur(30px)'
          }} />

          <div style={{
            fontSize: isMobile ? '2.5rem' : '3rem',
            marginBottom: '0.5rem'
          }}>
            <Zap size={isMobile ? 40 : 48} color="#10b981" />
          </div>

          <div style={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            fontWeight: '600',
            color: '#10b981',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Dagelijks Doel
          </div>

          <div style={{
            fontSize: isMobile ? '3rem' : '4rem',
            fontWeight: '800',
            color: '#fff',
            lineHeight: 1,
            marginBottom: '0.5rem'
          }}>
            {goals.calories}
          </div>

          <div style={{
            fontSize: isMobile ? '1rem' : '1.125rem',
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: '500'
          }}>
            Calorieën per dag
          </div>
        </div>

        {/* Protein Card */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            🥩
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#ef4444',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Eiwit
          </div>

          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '800',
            color: '#fff',
            lineHeight: 1,
            marginBottom: '0.25rem'
          }}>
            {goals.protein}g
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            per dag
          </div>
        </div>

        {/* Carbs Card */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
          border: '2px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '0.5rem'
          }}>
            🍚
          </div>

          <div style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem'
          }}>
            Koolhydraten
          </div>

          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: '800',
            color: '#fff',
            lineHeight: 1,
            marginBottom: '0.25rem'
          }}>
            {goals.carbs}g
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)'
          }}>
            per dag
          </div>
        </div>

        {/* Fats Card */}
        <div style={{
          gridColumn: isMobile ? 'span 1' : 'span 2',
          padding: isMobile ? '1.25rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '2px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              fontSize: '2rem'
            }}>
              🥑
            </div>

            <div>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#a855f7',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.25rem'
              }}>
                Vetten
              </div>

              <div style={{
                fontSize: isMobile ? '1.5rem' : '2rem',
                fontWeight: '800',
                color: '#fff'
              }}>
                {goals.fat}g per dag
              </div>
            </div>
          </div>

          <TrendingUp size={isMobile ? 32 : 40} color="#a855f7" opacity={0.5} />
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '16px'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Target size={20} color="#10b981" />
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#10b981',
              marginBottom: '0.5rem',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              Waarom deze doelen?
            </h4>

            <p style={{
              fontSize: '0.95rem',
              color: 'rgba(255, 255, 255, 0.7)',
              lineHeight: 1.6,
              margin: 0
            }}>
              Deze macros zijn afgestemd op jouw doel, activiteit niveau en voorkeur.
              We gaan nu een meal plan maken dat perfect bij deze doelen past!
            </p>
          </div>
        </div>
      </div>
    </WizardLayout>
  )
}
