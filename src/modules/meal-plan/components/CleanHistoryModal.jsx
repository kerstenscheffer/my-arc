import React, { useState, useEffect } from 'react'
import { 
  X, TrendingUp, Calendar, ChevronLeft, ChevronRight,
  BarChart3, Activity, Target, Clock
} from 'lucide-react'

export default function CleanHistoryModal({ 
  isOpen, 
  onClose, 
  client,
  db 
}) {
  const [viewMode, setViewMode] = useState('week')
  const [weekData, setWeekData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (isOpen && client?.id) {
      loadHistoryData()
    }
  }, [isOpen, selectedDate])

  const loadHistoryData = async () => {
    setLoading(true)
    try {
      const history = await db.getMealHistory(client.id, 30)
      
      // Process week data
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      
      const weekDays = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayData = history.find(h => h.date === dateStr) || {
          date: dateStr,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals_logged: 0
        }
        
        weekDays.push({
          ...dayData,
          dayName: date.toLocaleDateString('nl-NL', { weekday: 'short' }),
          dayNumber: date.getDate(),
          isToday: date.toDateString() === new Date().toDateString()
        })
      }
      
      setWeekData(weekDays)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressColor = (value, target) => {
    const percentage = (value / target) * 100
    if (percentage < 80) return '#ef4444'
    if (percentage < 95) return '#f59e0b'
    if (percentage <= 105) return '#10b981'
    return '#f59e0b'
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setSelectedDate(newDate)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      animation: 'fadeIn 0.2s ease'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '600px',
        height: '85vh',
        background: '#111',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: isMobile ? '1.25rem' : '1.5rem',
          borderBottom: '1px solid #333',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: isMobile ? '1.25rem' : '1.5rem',
              right: isMobile ? '1.25rem' : '1.5rem',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={20} style={{ color: '#fff' }} />
          </button>
          
          <h2 style={{
            color: '#fff',
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Voedingsgeschiedenis
          </h2>

          {/* View tabs */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem'
          }}>
            {[
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Maand' },
              { id: 'stats', label: 'Statistieken' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id)}
                style={{
                  padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                  background: viewMode === tab.id 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: viewMode === tab.id
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: viewMode === tab.id ? '#10b981' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '200px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(16, 185, 129, 0.2)',
                borderTopColor: '#10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          ) : viewMode === 'week' ? (
            <>
              {/* Week Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '16px',
                border: '1px solid #333'
              }}>
                <button
                  onClick={() => navigateWeek(-1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <ChevronLeft size={20} style={{ color: '#fff' }} />
                </button>
                
                <span style={{
                  color: '#fff',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  {selectedDate.toLocaleDateString('nl-NL', { 
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                
                <button
                  onClick={() => navigateWeek(1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <ChevronRight size={20} style={{ color: '#fff' }} />
                </button>
              </div>

              {/* Week Days Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: isMobile ? '0.5rem' : '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {weekData.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: day.isToday 
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
                        : day.calories > 0
                        ? 'rgba(16, 185, 129, 0.05)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: day.isToday
                        ? '1px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: isMobile ? '0.75rem 0.5rem' : '1rem',
                      textAlign: 'center',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginBottom: '0.25rem',
                      textTransform: 'capitalize'
                    }}>
                      {day.dayName}
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      color: '#fff',
                      fontWeight: '600',
                      marginBottom: '0.5rem'
                    }}>
                      {day.dayNumber}
                    </div>
                    
                    {day.calories > 0 && (
                      <>
                        <div style={{
                          fontSize: isMobile ? '0.8rem' : '0.85rem',
                          color: '#10b981',
                          fontWeight: '600'
                        }}>
                          {day.calories}
                        </div>
                        <div style={{
                          fontSize: isMobile ? '0.6rem' : '0.65rem',
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          kcal
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Week Summary */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '16px',
                padding: isMobile ? '1rem' : '1.25rem',
                border: '1px solid #333'
              }}>
                <h3 style={{
                  color: '#fff',
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <BarChart3 size={18} style={{ color: '#10b981' }} />
                  Weekoverzicht
                </h3>

                {/* Average stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                  gap: '0.75rem'
                }}>
                  <StatCard
                    icon={<Activity size={14} />}
                    label="Gem. Calorieën"
                    value={Math.round(
                      weekData.reduce((sum, d) => sum + d.calories, 0) / 
                      (weekData.filter(d => d.calories > 0).length || 1)
                    )}
                    unit="kcal"
                    color="#10b981"
                  />
                  <StatCard
                    icon={<Target size={14} />}
                    label="Gem. Eiwit"
                    value={Math.round(
                      weekData.reduce((sum, d) => sum + d.protein, 0) / 
                      (weekData.filter(d => d.protein > 0).length || 1)
                    )}
                    unit="g"
                    color="#3b82f6"
                  />
                  <StatCard
                    icon={<TrendingUp size={14} />}
                    label="Dagen Gelogd"
                    value={weekData.filter(d => d.calories > 0).length}
                    unit="dgn"
                    color="#f59e0b"
                  />
                  <StatCard
                    icon={<Clock size={14} />}
                    label="Compliantie"
                    value={Math.round(
                      (weekData.filter(d => d.calories > 0).length / 7) * 100
                    )}
                    unit="%"
                    color="#ec4899"
                  />
                </div>
              </div>
            </>
          ) : viewMode === 'month' ? (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '3rem'
            }}>
              Maandweergave komt binnenkort
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.5)',
              padding: '3rem'
            }}>
              Statistieken komen binnenkort
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function StatCard({ icon, label, value, unit, color }) {
  const isMobile = window.innerWidth <= 768
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '12px',
      padding: isMobile ? '0.75rem' : '1rem',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        marginBottom: '0.5rem',
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        {icon}
        <span style={{
          fontSize: isMobile ? '0.65rem' : '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: isMobile ? '1.1rem' : '1.25rem',
        fontWeight: 'bold',
        color: color
      }}>
        {value}
        <span style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          marginLeft: '0.25rem',
          opacity: 0.7
        }}>
          {unit}
        </span>
      </div>
    </div>
  )
}
