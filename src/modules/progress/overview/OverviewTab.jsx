import React from 'react'
import { BarChart3, TrendingUp } from 'lucide-react'

// Import alle widgets
import WeightWidget from '../../../widgets/WeightWidget'
import ChallengeWidget from '../../../widgets/ChallengeWidget'  
import WorkoutWidget from '../../../widgets/WorkoutWidget'

export default function OverviewTab({ client, db, stats, onNavigate }) {
  const isMobile = window.innerWidth <= 768

  return (
    <div style={{
      width: '100%',
      maxWidth: '100%',
      padding: 0, // No padding here - widgets handle their own spacing
      margin: 0
    }}>
      {/* Header */}
      <div style={{
        marginBottom: isMobile ? '1.5rem' : '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <BarChart3 
            size={isMobile ? 28 : 32} 
            style={{ color: '#f59e0b' }} 
          />
          <h2 style={{
            fontSize: isMobile ? '1.5rem' : '1.8rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0,
            backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Progress Overview
          </h2>
        </div>
        
        <p style={{
          fontSize: isMobile ? '0.9rem' : '1rem',
          color: 'rgba(255, 255, 255, 0.6)',
          margin: 0,
          fontWeight: '500'
        }}>
          Jouw dagelijkse voortgang in één oogopslag
        </p>
      </div>

      {/* Widget Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: isMobile ? '1rem' : '1.5rem',
        width: '100%',
        maxWidth: '100%'
      }}>
        
        {/* Money Back Guarantee - Most Important Widget */}
        <div style={{
          gridColumn: isMobile ? '1' : 'span 1',
          order: 1
        }}>
          <ChallengeWidget 
            client={client} 
            db={db} 
            onNavigate={onNavigate}
          />
        </div>

        {/* Weight Progress - Quick Daily Check */}
        <div style={{
          gridColumn: isMobile ? '1' : 'span 1',
          order: 2
        }}>
          <WeightWidget 
            client={client} 
            db={db} 
            onNavigate={onNavigate}
          />
        </div>

        {/* Today's Workout - Action Item */}
        <div style={{
          gridColumn: isMobile ? '1' : 'span 1',
          order: 3
        }}>
          <WorkoutWidget 
            client={client} 
            db={db} 
            onNavigate={onNavigate}
          />
        </div>

        {/* Future Widgets - Placeholder for expansion */}
        {/* Uncomment when you create NutritionWidget */}
        {/*
        <div style={{
          gridColumn: isMobile ? '1' : 'span 1',
          order: 4
        }}>
          <NutritionWidget 
            client={client} 
            db={db} 
            onNavigate={onNavigate}
          />
        </div>
        */}

        {/* Quick Stats Summary - Simple info card */}
        <div style={{
          gridColumn: isMobile ? '1' : 'span 1',
          order: isMobile ? 5 : 4,
          background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.8) 0%, rgba(10, 10, 10, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          borderRadius: isMobile ? '16px' : '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: isMobile ? '1rem' : '1.25rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Accent border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #10b981 0%, #10b98180 100%)',
            borderRadius: '20px 20px 0 0'
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <TrendingUp size={20} style={{ color: '#10b981' }} />
            <h3 style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              color: '#fff',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Quick Stats
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                fontWeight: '700',
                color: '#10b981',
                lineHeight: 1,
                marginBottom: '0.25rem'
              }}>
                {stats?.streak || 0}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                Dag Streak
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: isMobile ? '1.3rem' : '1.5rem',
                fontWeight: '700',
                color: '#f97316',
                lineHeight: 1,
                marginBottom: '0.25rem'
              }}>
                {stats?.workouts || 0}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(255,255,255,0.6)'
              }}>
                Deze Week
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '0.8rem',
              color: '#10b981',
              fontWeight: '500'
            }}>
              Geweldig bezig! 🚀
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.6)',
              marginTop: '0.25rem'
            }}>
              Je bent op schema voor je doelen
            </div>
          </div>

          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            bottom: '-20px',
            right: '-20px',
            width: '60px',
            height: '60px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />
        </div>
      </div>

      {/* Bottom Action Cards - Quick Navigation */}
      <div style={{
        marginTop: isMobile ? '2rem' : '2.5rem',
        display: 'grid',
        gridTemplateColumns: isMobile 
          ? '1fr' 
          : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {[
          { id: 'photos', label: 'Progress Foto\'s', icon: '📸', color: '#ec4899' },
          { id: 'nutrition', label: 'Voeding Log', icon: '🥗', color: '#10b981' },
          { id: 'goals', label: 'Mijn Doelen', icon: '🎯', color: '#a855f7' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate?.(item.id)}
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.8) 100%)',
              border: `1px solid ${item.color}30`,
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = `${item.color}60`
              e.currentTarget.style.boxShadow = `0 8px 25px ${item.color}25`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = `${item.color}30`
              e.currentTarget.style.boxShadow = 'none'
            }}
            onTouchStart={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(0.98)'
                e.currentTarget.style.borderColor = `${item.color}60`
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.borderColor = `${item.color}30`
              }
            }}
          >
            <span style={{ 
              fontSize: '1.5rem',
              minWidth: '24px'
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {item.label}
            </span>
            <span style={{
              marginLeft: 'auto',
              color: item.color,
              fontSize: '0.8rem'
            }}>
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
