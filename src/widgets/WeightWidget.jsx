import React, { useState, useEffect } from 'react'
import { TrendingDown, Scale, ChevronRight, Activity } from 'lucide-react'

const WeightWidget = ({ db, client, onNavigate }) => {
  const [weightData, setWeightData] = useState([])
  const [currentWeight, setCurrentWeight] = useState(null)
  const [trend, setTrend] = useState(0)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const isMobile = window.innerWidth <= 768

  useEffect(() => {
    if (client?.id && db) {
      loadWeightData()
    }
  }, [client?.id, db])

  const loadWeightData = async () => {
    if (!client?.id || !db) return
    
    setLoading(true)
    try {
      const history = await db.getWeightHistory?.(client.id, 14).catch(() => [])
      if (history && history.length > 0) {
        setWeightData(history)
        setCurrentWeight(history[history.length - 1]?.weight || 0)
        
        if (history.length >= 2) {
          const weightChange = history[history.length - 1].weight - history[0].weight
          setTrend(weightChange)
        }
      }
    } catch (error) {
      console.error('Error loading weight data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLog = async () => {
    if (!newWeight || !client?.id || !db) return
    
    try {
      await db.saveWeightEntry?.(
        client.id,
        new Date().toISOString().split('T')[0],
        parseFloat(newWeight)
      )
      setNewWeight('')
      setShowQuickLog(false)
      await loadWeightData()
    } catch (error) {
      console.error('Error saving weight:', error)
    }
  }

  const handleClick = () => {
    if (typeof onNavigate === 'function') {
      onNavigate()
    }
  }

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        minHeight: isMobile ? '140px' : '160px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    )
  }

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.9) 0%, rgba(59, 130, 246, 0.9) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: isMobile ? '16px' : '20px',
          padding: isMobile ? '1.25rem' : '1.5rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
          minHeight: isMobile ? '140px' : '160px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
          e.currentTarget.style.boxShadow = '0 15px 35px rgba(59, 130, 246, 0.35)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.25)'
        }}
        onTouchStart={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(0.98)'
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        {/* Decorative element */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'float 4s ease-in-out infinite'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: isMobile ? '0.75rem' : '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Scale size={isMobile ? 20 : 24} style={{ color: 'white' }} />
              <div style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '600',
                color: 'white'
              }}>
                Weight Tracker
              </div>
            </div>

            {/* Trend indicator */}
            {trend !== 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'rgba(255,255,255,0.15)',
                padding: '0.25rem 0.5rem',
                borderRadius: '6px',
                backdropFilter: 'blur(10px)'
              }}>
                <TrendingDown size={14} style={{ 
                  color: trend < 0 ? '#10b981' : '#ef4444',
                  transform: trend > 0 ? 'rotate(180deg)' : 'none'
                }} />
                <span style={{
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {Math.abs(trend).toFixed(1)}kg
                </span>
              </div>
            )}
          </div>

          {/* Current weight display */}
          <div style={{
            fontSize: isMobile ? '2rem' : '2.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            {currentWeight ? `${currentWeight.toFixed(1)} kg` : '-- kg'}
          </div>

          {/* Weight history mini chart */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '2px',
            height: '30px',
            marginBottom: '0.75rem'
          }}>
            {weightData.slice(-7).map((data, index) => {
              const maxWeight = Math.max(...weightData.slice(-7).map(d => d.weight))
              const minWeight = Math.min(...weightData.slice(-7).map(d => d.weight))
              const range = maxWeight - minWeight || 1
              const height = ((data.weight - minWeight) / range) * 20 + 10
              
              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${height}px`,
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }}
                />
              )
            })}
          </div>

          {/* Quick log button */}
          <div 
            onClick={(e) => {
              e.stopPropagation()
              setShowQuickLog(true)
            }}
            style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
          >
            <Activity size={14} />
            Quick Log
          </div>
        </div>
      </div>

      {/* Quick Log Modal */}
      {showQuickLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '350px',
            width: '90%',
            border: '1px solid rgba(59, 130, 246, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Scale size={20} />
              Log gewicht
            </h3>

            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Bijv. 75.5"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
              autoFocus
            />

            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <button
                onClick={handleQuickLog}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Opslaan
              </button>
              <button
                onClick={() => {
                  setShowQuickLog(false)
                  setNewWeight('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Annuleer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </>
  )
}

export default WeightWidget
