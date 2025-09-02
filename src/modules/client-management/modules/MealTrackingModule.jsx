// src/modules/client-management/modules/MealTrackingModule.jsx
// Meal plan tracking en compliance module - Met Open Meal Planner button

import { useState, useEffect, useMemo } from 'react'

export default function MealTrackingModule({ client, data, onAction, viewMode, db }) {
  const [selectedWeek, setSelectedWeek] = useState(0)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [sendingSuggestion, setSendingSuggestion] = useState(false)
  const [showMealPlanEditor, setShowMealPlanEditor] = useState(false)
  
  // Calculate compliance metrics with better logic
  const complianceMetrics = useMemo(() => {
    if (!data?.compliance) {
      // Generate mock data if no real data
      return {
        overall: 75,
        macros: {
          kcal: 82,
          protein: 78,
          carbs: 85,
          fat: 72
        },
        streak: 5,
        swaps: 3,
        trend: 'up',
        weeklyAverage: [65, 70, 72, 75, 78, 80, 75],
        bestDay: 'Monday',
        worstDay: 'Saturday'
      }
    }
    
    const comp = data.compliance
    return {
      overall: Math.round(comp.average || 0),
      macros: {
        kcal: Math.round(comp.kcal_compliance || 0),
        protein: Math.round(comp.protein_compliance || 0),
        carbs: Math.round(comp.carbs_compliance || 0),
        fat: Math.round(comp.fat_compliance || 0)
      },
      streak: comp.current_streak || 0,
      swaps: comp.total_swaps || 0,
      trend: comp.trend || 'stable',
      weeklyAverage: comp.weeklyAverage || [],
      bestDay: comp.bestDay || 'Monday',
      worstDay: comp.worstDay || 'Saturday'
    }
  }, [data])
  
  // Get recent swaps (mock data for now)
  const recentSwaps = [
    { original_meal: 'Chicken Breast', new_meal: 'Salmon Fillet', date: new Date().toISOString(), reason: 'Preference' },
    { original_meal: 'Brown Rice', new_meal: 'Sweet Potato', date: new Date(Date.now() - 86400000).toISOString(), reason: 'Availability' },
    { original_meal: 'Greek Yogurt', new_meal: 'Cottage Cheese', date: new Date(Date.now() - 172800000).toISOString(), reason: 'Taste' }
  ]
  
  // Generate AI suggestion based on compliance
  const generateSuggestion = () => {
    let suggestion = ''
    let actionPoints = []
    
    if (complianceMetrics.overall < 50) {
      suggestion = `⚠️ Kritieke Situatie - ${client.first_name} heeft moeite met het volgen van het meal plan.`
      actionPoints = [
        'Plan een video call deze week',
        'Vraag naar specifieke obstakels',
        'Overweeg plan aanpassing',
        'Stuur dagelijkse check-in berichten'
      ]
    } else if (complianceMetrics.macros.protein < 70) {
      suggestion = `🥩 Protein Alert - ${client.first_name}'s eiwitinname is ${complianceMetrics.macros.protein}%, wat te laag is voor optimale resultaten.`
      actionPoints = [
        'Voeg protein shake toe als snack',
        'Verhoog porties mager vlees met 25%',
        'Stuur recepten voor high-protein maaltijden',
        'Check of supplementen nodig zijn'
      ]
    } else if (complianceMetrics.swaps > 10) {
      suggestion = `🔄 Veel Swaps Gedetecteerd - ${client.first_name} heeft ${complianceMetrics.swaps} maaltijden gewisseld deze maand.`
      actionPoints = [
        'Analyseer swap patronen',
        'Update voorkeuren in systeem',
        'Maak aangepast meal plan',
        'Bespreek alternatieven'
      ]
    } else if (complianceMetrics.overall > 90) {
      suggestion = `🌟 Uitstekende Compliance! ${client.first_name} is zeer consistent met ${complianceMetrics.overall}% compliance.`
      actionPoints = [
        'Stuur felicitatie bericht',
        'Overweeg progressieve overload',
        'Plan refeed day als beloning',
        'Deel succes (met toestemming) als motivatie voor anderen'
      ]
    } else if (complianceMetrics.streak > 7) {
      suggestion = `🔥 Geweldige Streak! ${client.first_name} heeft ${complianceMetrics.streak} dagen perfect gevolgd.`
      actionPoints = [
        'Erken de prestatie',
        'Vraag naar energy levels',
        'Check of aanpassingen nodig zijn',
        'Plan volgende fase'
      ]
    } else {
      suggestion = `📊 Stabiele Voortgang - ${client.first_name} heeft ${complianceMetrics.overall}% compliance. Ruimte voor verbetering in consistentie.`
      actionPoints = [
        'Focus op ${complianceMetrics.worstDay} verbeteren',
        'Versterk goede gewoontes op ${complianceMetrics.bestDay}',
        'Check meal timing',
        'Evalueer portie groottes'
      ]
    }
    
    setAiSuggestion({ main: suggestion, actions: actionPoints })
    setShowSuggestion(true)
  }
  
  // Handle sending suggestion to client
  const handleSendSuggestion = async (message) => {
    setSendingSuggestion(true)
    try {
      await db.sendNotification(client.id, 'meal_suggestion', message)
      alert('✅ Suggestion sent to client!')
      setShowSuggestion(false)
    } catch (error) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setSendingSuggestion(false)
    }
  }
  
  // Get compliance color
  const getComplianceColor = (value) => {
    if (value >= 90) return '#10b981'
    if (value >= 75) return '#3b82f6'
    if (value >= 60) return '#f59e0b'
    if (value >= 40) return '#fb923c'
    return '#ef4444'
  }
  
  // Focus mode - detailed view
  if (viewMode === 'focus') {
    return (
      <div>
        {/* Compliance Overview Card */}
        <div style={{
          background: `linear-gradient(135deg, ${getComplianceColor(complianceMetrics.overall)}20, transparent)`,
          borderRadius: '12px',
          padding: 'var(--s-4)',
          marginBottom: 'var(--s-4)',
          border: `1px solid ${getComplianceColor(complianceMetrics.overall)}40`
        }}>
          <div className="myarc-flex myarc-justify-between myarc-items-center">
            <div>
              <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Overall Compliance</p>
              <p style={{ 
                color: '#fff', 
                fontSize: '3rem', 
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                {complianceMetrics.overall}%
              </p>
              <div style={{ marginTop: 'var(--s-2)' }}>
                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)',
                  marginRight: 'var(--s-2)'
                }}>
                  🔥 {complianceMetrics.streak} day streak
                </span>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: 'var(--text-sm)'
                }}>
                  🔄 {complianceMetrics.swaps} swaps
                </span>
              </div>
            </div>
            
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `conic-gradient(
                ${getComplianceColor(complianceMetrics.overall)} ${complianceMetrics.overall * 3.6}deg,
                #374151 0deg
              )`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 24px ${getComplianceColor(complianceMetrics.overall)}40`
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: '#0f0f0f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem'
              }}>
                {complianceMetrics.overall >= 90 ? '🌟' :
                 complianceMetrics.overall >= 75 ? '💪' :
                 complianceMetrics.overall >= 60 ? '📈' :
                 complianceMetrics.overall >= 40 ? '⚠️' : '🆘'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Macro Compliance Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--s-3)',
          marginBottom: 'var(--s-4)'
        }}>
          <MacroCard
            title="Calorieën"
            value={complianceMetrics.macros.kcal}
            icon="🔥"
            color="#10b981"
            target="2200 kcal"
          />
          <MacroCard
            title="Eiwitten"
            value={complianceMetrics.macros.protein}
            icon="🥩"
            color="#3b82f6"
            target="165g"
          />
          <MacroCard
            title="Koolhydraten"
            value={complianceMetrics.macros.carbs}
            icon="🌾"
            color="#f59e0b"
            target="275g"
          />
          <MacroCard
            title="Vetten"
            value={complianceMetrics.macros.fat}
            icon="🥑"
            color="#ef4444"
            target="75g"
          />
        </div>
        
        {/* Weekly Trend Chart */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: 'var(--s-3)',
          marginBottom: 'var(--s-4)'
        }}>
          <h4 style={{ color: '#fff', marginBottom: 'var(--s-3)' }}>Weekly Compliance Trend</h4>
          <WeeklyTrendChart data={complianceMetrics.weeklyAverage} />
        </div>
        
        {/* Recent Swaps */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: 'var(--s-3)',
          marginBottom: 'var(--s-4)'
        }}>
          <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
            <h4 style={{ color: '#fff' }}>Recent Meal Swaps</h4>
            <span style={{
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#8b5cf6',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: 'var(--text-sm)'
            }}>
              {recentSwaps.length} this week
            </span>
          </div>
          
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {recentSwaps.map((swap, idx) => (
              <div key={idx} style={{
                padding: 'var(--s-3)',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '8px',
                marginBottom: 'var(--s-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-3)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  🔄
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fff', fontSize: 'var(--text-sm)' }}>
                    <span style={{ color: 'var(--c-muted)' }}>{swap.original_meal}</span>
                    {' → '}
                    <span style={{ color: '#8b5cf6' }}>{swap.new_meal}</span>
                  </p>
                  <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-xs)' }}>
                    {formatDate(swap.date)} • {swap.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* AI Suggestions Section */}
        <div style={{ marginBottom: 'var(--s-3)' }}>
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={generateSuggestion}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              border: 'none',
              padding: 'var(--s-3)',
              fontSize: '1rem'
            }}
          >
            🤖 Generate AI Coach Suggestion
          </button>
          
          {showSuggestion && aiSuggestion && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              padding: 'var(--s-4)',
              marginTop: 'var(--s-3)',
              animation: 'slideIn 0.3s ease'
            }}>
              <div className="myarc-flex myarc-justify-between myarc-items-start" style={{ marginBottom: 'var(--s-3)' }}>
                <h4 style={{ color: '#3b82f6' }}>🤖 AI Coach Analysis</h4>
                <button
                  onClick={() => setShowSuggestion(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: '1.5rem'
                  }}
                >
                  ×
                </button>
              </div>
              
              <p style={{ color: '#fff', marginBottom: 'var(--s-3)', fontSize: '1.1rem' }}>
                {aiSuggestion.main}
              </p>
              
              <div style={{ marginBottom: 'var(--s-3)' }}>
                <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
                  Recommended Actions:
                </p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {aiSuggestion.actions.map((action, idx) => (
                    <li key={idx} style={{
                      color: '#fff',
                      fontSize: 'var(--text-sm)',
                      padding: 'var(--s-2)',
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '6px',
                      marginBottom: 'var(--s-1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--s-2)'
                    }}>
                      <span style={{ color: '#3b82f6' }}>→</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="myarc-flex myarc-gap-sm">
                <button
                  className="myarc-btn myarc-btn-primary myarc-btn-sm"
                  onClick={() => handleSendSuggestion(aiSuggestion.main)}
                  disabled={sendingSuggestion}
                  style={{ flex: 1 }}
                >
                  {sendingSuggestion ? 'Sending...' : '📨 Send to Client'}
                </button>
                <button
                  className="myarc-btn myarc-btn-secondary myarc-btn-sm"
                  onClick={() => setShowMealPlanEditor(true)}
                  style={{ flex: 1 }}
                >
                  ✏️ Adjust Plan
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--s-2)'
        }}>
          <button
            className="myarc-btn myarc-btn-secondary myarc-btn-sm"
            onClick={() => onAction('viewFullPlan', {})}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
              border: '1px solid #10b981',
              color: '#10b981'
            }}
          >
            📋 View Full Plan
          </button>
          <button
            className="myarc-btn myarc-btn-secondary myarc-btn-sm"
            onClick={() => onAction('adjustMacros', {})}
            style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))',
              border: '1px solid #f59e0b',
              color: '#f59e0b'
            }}
          >
            ⚙️ Adjust Macros
          </button>
        </div>
      </div>
    )
  }
  
  // Compact view for grid mode
  return (
    <div>
      {/* Compliance Score */}
      <div style={{
        background: `linear-gradient(135deg, ${getComplianceColor(complianceMetrics.overall)}20, transparent)`,
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-3)',
        border: `1px solid ${getComplianceColor(complianceMetrics.overall)}40`
      }}>
        <div className="myarc-flex myarc-justify-between myarc-items-center">
          <div>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Compliance</p>
            <p style={{ 
              color: getComplianceColor(complianceMetrics.overall), 
              fontSize: '1.8rem', 
              fontWeight: 'bold' 
            }}>
              {complianceMetrics.overall}%
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ 
              color: '#10b981', 
              fontSize: 'var(--text-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🔥 {complianceMetrics.streak} days
            </p>
            <p style={{ 
              color: '#8b5cf6', 
              fontSize: 'var(--text-xs)',
              marginTop: '4px'
            }}>
              🔄 {complianceMetrics.swaps} swaps
            </p>
          </div>
        </div>
      </div>
      
      {/* Macro Compliance Mini */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6px',
        marginBottom: 'var(--s-3)'
      }}>
        <ComplianceBar 
          value={complianceMetrics.macros.kcal} 
          color="#10b981" 
          icon="🔥"
        />
        <ComplianceBar 
          value={complianceMetrics.macros.protein} 
          color="#3b82f6" 
          icon="🥩"
        />
        <ComplianceBar 
          value={complianceMetrics.macros.carbs} 
          color="#f59e0b" 
          icon="🌾"
        />
        <ComplianceBar 
          value={complianceMetrics.macros.fat} 
          color="#ef4444" 
          icon="🥑"
        />
      </div>
      
      {/* Status Badge */}
      <div style={{
        padding: 'var(--s-2)',
        background: complianceMetrics.overall >= 80 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))'
          : complianceMetrics.overall >= 60 
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1))',
        borderRadius: '8px',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <p style={{ 
          color: complianceMetrics.overall >= 80 ? '#10b981' :
                 complianceMetrics.overall >= 60 ? '#f59e0b' : '#ef4444',
          fontSize: 'var(--text-sm)', 
          fontWeight: 'bold'
        }}>
          {complianceMetrics.overall >= 80 ? '✅ On Track!' :
           complianceMetrics.overall >= 60 ? '⚠️ Needs Attention' :
           '🆘 Struggling'}
        </p>
      </div>
      
      {/* UPDATED BUTTON - Opens Meal Planner instead of AI Suggestion */}
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('manageMeals')}
        style={{ 
          width: '100%',
          background: 'linear-gradient(135deg, #3b82f6, #10b981)',
          border: 'none',
          padding: '12px',
          borderRadius: '8px',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        🚀 Open Meal Planner
      </button>
    </div>
  )
}

// Helper Components
function MacroCard({ title, value, icon, color, target }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '12px',
      padding: 'var(--s-3)',
      borderLeft: `4px solid ${color}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${value}%`,
        height: '100%',
        background: `linear-gradient(90deg, ${color}20, transparent)`,
        transition: 'width 0.5s ease'
      }} />
      
      <div style={{ position: 'relative' }}>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-2)' }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>{title}</p>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        </div>
        
        <div className="myarc-flex myarc-items-end myarc-gap-sm">
          <p style={{ 
            color: '#fff', 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            lineHeight: 1
          }}>
            {value}%
          </p>
          <p style={{ 
            color: 'var(--c-muted)', 
            fontSize: 'var(--text-xs)',
            marginBottom: '2px'
          }}>
            target: {target}
          </p>
        </div>
        
        <div style={{
          marginTop: 'var(--s-2)',
          height: '4px',
          background: '#374151',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            transition: 'width 0.5s ease',
            borderRadius: '2px'
          }} />
        </div>
      </div>
    </div>
  )
}

function ComplianceBar({ value, color, icon }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px',
      padding: 'var(--s-2)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: `${value}%`,
        background: `linear-gradient(180deg, ${color}40, ${color}20)`,
        transition: 'height 0.5s ease'
      }} />
      
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{icon}</div>
        <p style={{ 
          color: value >= 80 ? color : '#fff',
          fontSize: 'var(--text-xs)', 
          fontWeight: 'bold' 
        }}>
          {value}%
        </p>
      </div>
    </div>
  )
}

function WeeklyTrendChart({ data }) {
  const days = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
  const maxValue = Math.max(...(data.length ? data : [100]))
  
  return (
    <div style={{ height: '120px', position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '100%',
        gap: '8px'
      }}>
        {days.map((day, idx) => {
          const value = data[idx] || 0
          const height = (value / maxValue) * 100
          
          return (
            <div key={idx} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                background: value >= 80 ? 'linear-gradient(180deg, #10b981, #059669)' :
                           value >= 60 ? 'linear-gradient(180deg, #f59e0b, #d97706)' :
                           'linear-gradient(180deg, #ef4444, #dc2626)',
                height: `${height}%`,
                minHeight: '4px',
                borderRadius: '6px 6px 0 0',
                marginBottom: '4px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scaleY(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scaleY(1)'
              }}
              title={`${day}: ${value}%`}
              />
              <p style={{ 
                color: 'var(--c-muted)', 
                fontSize: 'var(--text-xs)' 
              }}>
                {day}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const today = new Date()
  const diff = Math.floor((today - date) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  
  return date.toLocaleDateString('nl-NL', { 
    day: 'numeric', 
    month: 'short' 
  })
}
