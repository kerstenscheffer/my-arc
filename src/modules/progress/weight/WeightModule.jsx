import useIsMobile from '../../../hooks/useIsMobile'
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  Weight, TrendingUp, TrendingDown, Target, Calendar,
  Plus, ChevronRight, Info, Clock, Zap, Award,
  ArrowUp, ArrowDown, Minus, ChevronDown, Save,
  Activity, Heart, Brain, Sparkles, BarChart3,
  X, Check, AlertCircle, Loader2
} from 'lucide-react'

import ProgressService from '../core/ProgressService'

// Theme configuration
const THEME = {
  primary: '#3b82f6',
  gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
  lightGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.08) 100%)',
  darkGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(37, 99, 235, 0.15) 100%)',
  border: 'rgba(59, 130, 246, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export default function WeightModule({ client = { id: 1, height: 180, goal_weight: 70, start_weight: 80 }, db }) {
  const isMobile = useIsMobile()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [currentWeight, setCurrentWeight] = useState('')
  const [weightHistory, setWeightHistory] = useState([])
  const [stats, setStats] = useState(null)
  const [timeRange, setTimeRange] = useState(30)
  const [inputMode, setInputMode] = useState('morning')
  const [feeling, setFeeling] = useState('normal')
  const [quickInputValue, setQuickInputValue] = useState(70)
  const [successMessage, setSuccessMessage] = useState('')
  
  const loadWeightData = useCallback(async () => {
    if (!client?.id) return
    
    setLoading(true)
    try {
      const [history, statistics] = await Promise.all([
        ProgressService.getWeightHistory(client.id, timeRange),
        ProgressService.getWeightStats(client.id)
      ])

      setWeightHistory(history || [])
      setStats(statistics || {})
      
      if (history && history.length > 0) {
        setCurrentWeight(history[0].weight.toString())
        setQuickInputValue(parseFloat(history[0].weight))
      }
    } catch (error) {
      console.error('Error loading weight data:', error)
      setWeightHistory([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [client?.id, timeRange])

  useEffect(() => {
    loadWeightData()
  }, [loadWeightData])

  const handleQuickSave = async () => {
    if (!quickInputValue || !client?.id || saving) return

    setSaving(true)
    try {
      await ProgressService.saveWeight(client.id, {
        weight: quickInputValue,
        timeOfDay: 'morning',
        notes: '',
        feeling: 'normal'
      })
      
      setSuccessMessage('Gewicht opgeslagen!')
      await loadWeightData()
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving weight:', error)
      alert('Error bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWeight = async () => {
    if (!currentWeight || !client?.id || saving) return

    setSaving(true)
    try {
      await ProgressService.saveWeight(client.id, {
        weight: parseFloat(currentWeight),
        timeOfDay: inputMode,
        notes: '',
        feeling
      })
      
      setShowInput(false)
      setFeeling('normal')
      setSuccessMessage('Gewicht opgeslagen!')
      
      await loadWeightData()
      
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error) {
      console.error('Error saving weight:', error)
      alert('Er ging iets mis bij het opslaan')
    } finally {
      setSaving(false)
    }
  }

  const bmi = useMemo(() => {
    if (!stats?.current || !client?.height) return null
    const heightInM = client.height / 100
    return (stats.current / (heightInM * heightInM)).toFixed(1)
  }, [stats?.current, client?.height])

  const bmiCategory = useMemo(() => {
    if (!bmi) return null
    if (bmi < 18.5) return { label: 'Ondergewicht', color: THEME.warning }
    if (bmi < 25) return { label: 'Gezond', color: THEME.success }
    if (bmi < 30) return { label: 'Overgewicht', color: THEME.warning }
    return { label: 'Obesitas', color: THEME.danger }
  }, [bmi])

  const progressPercentage = useMemo(() => {
    if (!stats?.current || !client?.goal_weight || !client?.start_weight) return 0
    return Math.min(100, Math.abs(((stats.current - client.start_weight) / (client.goal_weight - client.start_weight)) * 100))
  }, [stats?.current, client?.goal_weight, client?.start_weight])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Loader2 size={isMobile ? 32 : 40} style={{ animation: 'spin 1s linear infinite' }} color={THEME.primary} />
      </div>
    )
  }

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '10px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: isMobile ? '0.625rem 1.25rem' : '0.75rem 1.5rem',
          background: THEME.success,
          borderRadius: isMobile ? '10px' : '12px',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.375rem' : '0.5rem',
          zIndex: 2000,
          fontSize: isMobile ? '0.875rem' : '1rem',
          animation: 'slideDown 0.3s ease'
        }}>
          <Check size={isMobile ? 16 : 20} />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            Gewicht Tracking
          </h2>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: 'rgba(255,255,255,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Calendar size={14} />
            {new Date().toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </div>
        </div>
        
        {stats?.current && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'rgba(59, 130, 246, 0.15)',
            borderRadius: '20px',
            fontSize: isMobile ? '0.75rem' : '0.85rem',
            color: THEME.primary
          }}>
            <Weight size={14} />
            {stats.current} kg
          </div>
        )}
      </div>

      {/* Main Progress Section */}
      <div style={{
        background: THEME.lightGradient,
        borderRadius: '20px',
        padding: isMobile ? '1.25rem' : '2rem',
        marginBottom: '1.5rem',
        border: `1px solid ${THEME.border}`
      }}>
        {/* Progress Ring */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            position: 'relative',
            width: isMobile ? '140px' : '180px',
            height: isMobile ? '140px' : '180px',
            margin: '0 auto 1rem'
          }}>
            <svg width={isMobile ? 140 : 180} height={isMobile ? 140 : 180} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx={isMobile ? 70 : 90}
                cy={isMobile ? 70 : 90}
                r={isMobile ? 60 : 75}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth={isMobile ? 10 : 12}
                fill="none"
              />
              <circle
                cx={isMobile ? 70 : 90}
                cy={isMobile ? 70 : 90}
                r={isMobile ? 60 : 75}
                stroke={THEME.primary}
                strokeWidth={isMobile ? 10 : 12}
                fill="none"
                strokeDasharray={isMobile ? 377 : 471}
                strokeDashoffset={(isMobile ? 377 : 471) - (progressPercentage / 100 * (isMobile ? 377 : 471))}
                strokeLinecap="round"
                style={{ 
                  transition: 'stroke-dashoffset 1s ease',
                  filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4))'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center'
            }}>
              <div style={{ 
                fontSize: isMobile ? '2rem' : '2.5rem', 
                fontWeight: 'bold', 
                color: '#fff' 
              }}>
                {stats?.current || '--'}
              </div>
              <div style={{ 
                fontSize: isMobile ? '0.75rem' : '0.85rem', 
                color: 'rgba(255,255,255,0.6)' 
              }}>
                kilogram
              </div>
            </div>
          </div>

          {/* Trend Badge */}
          {stats?.weekChange && (
            <div style={{
              display: 'inline-block',
              padding: isMobile ? '0.375rem 0.75rem' : '0.5rem 1rem',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '16px',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              color: Math.abs(stats.weekChange) < 0.1 ? '#fff' : 
                     stats.weekChange > 0 ? THEME.danger : THEME.success
            }}>
              {Math.abs(stats.weekChange) < 0.1 ? 'Stabiel' :
               stats.weekChange > 0 ? `+${stats.weekChange} kg` : `${stats.weekChange} kg`}
              <span style={{ opacity: 0.6 }}> / week</span>
            </div>
          )}
        </div>

        {/* Quick Input */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={() => setQuickInputValue(Math.max(30, quickInputValue - 0.5))}
              style={{
                width: isMobile ? '44px' : '48px',
                height: isMobile ? '44px' : '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              -
            </button>
            
            <div style={{
              fontSize: isMobile ? '2rem' : '2.5rem',
              fontWeight: 'bold',
              color: '#fff',
              minWidth: isMobile ? '120px' : '140px',
              textAlign: 'center'
            }}>
              {quickInputValue.toFixed(1)}
              <span style={{ 
                fontSize: isMobile ? '0.875rem' : '1rem', 
                opacity: 0.6, 
                marginLeft: '0.5rem' 
              }}>kg</span>
            </div>
            
            <button
              onClick={() => setQuickInputValue(Math.min(200, quickInputValue + 0.5))}
              style={{
                width: isMobile ? '44px' : '48px',
                height: isMobile ? '44px' : '48px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              +
            </button>
          </div>

          <button
            onClick={handleQuickSave}
            disabled={saving}
            style={{
              width: '100%',
              maxWidth: isMobile ? '250px' : '300px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: isMobile ? '0.75rem' : '0.875rem',
              background: saving ? 'rgba(255,255,255,0.1)' : THEME.gradient,
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: isMobile ? '0.9rem' : '1rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? <Loader2 size={isMobile ? 16 : 20} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={isMobile ? 16 : 20} />}
            Quick Save
          </button>
        </div>
      </div>

      {/* Time Range Pills */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        marginBottom: '1.5rem',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        paddingLeft: isMobile ? '0' : '0',
        paddingRight: isMobile ? '0' : '0'
      }}>
        {[7, 30, 60, 90].map(days => (
          <button
            key={days}
            onClick={() => setTimeRange(days)}
            style={{
              padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.2rem',
              background: timeRange === days ? THEME.gradient : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: timeRange === days ? '600' : 'normal',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flex: isMobile ? '0 0 auto' : '1',
              minWidth: isMobile ? 'auto' : '80px'
            }}
          >
            {days} dagen
          </button>
        ))}
      </div>

      {/* Stats Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* BMI Card */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.75rem' 
          }}>
            <Activity size={16} color={THEME.primary} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>BMI</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            {bmi || '--'}
          </div>
          {bmiCategory && (
            <span style={{
              padding: '0.25rem 0.5rem',
              background: `${bmiCategory.color}33`,
              borderRadius: '6px',
              fontSize: '0.75rem',
              color: bmiCategory.color
            }}>
              {bmiCategory.label}
            </span>
          )}
        </div>

        {/* Goal Card */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.75rem' 
          }}>
            <Target size={16} color={THEME.primary} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Doel</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.5rem' }}>
            {client?.goal_weight || '--'} kg
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            {stats?.current && client?.goal_weight 
              ? `${Math.abs(stats.current - client.goal_weight).toFixed(1)} kg te gaan`
              : 'Stel een doel'}
          </div>
        </div>

        {/* Prediction Card */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            marginBottom: '0.75rem' 
          }}>
            <Brain size={16} color={THEME.primary} />
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>AI Predictie</span>
          </div>
          {stats?.prediction ? (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '0.25rem' }}>
                {stats.prediction.change > 0 ? '+' : ''}{stats.prediction.change} kg
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                in {stats.prediction.timeframe} dagen
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              Meer data nodig
            </div>
          )}
        </div>
      </div>

      {/* History List */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '20px',
        padding: '1.5rem',
        backdropFilter: 'blur(10px)'
      }}>
        <h3 style={{
          fontSize: '0.9rem',
          color: '#fff',
          fontWeight: '600',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Clock size={18} color={THEME.primary} />
          Geschiedenis
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {weightHistory.slice(0, 10).map((entry, index) => {
            const prevEntry = weightHistory[index + 1]
            const change = prevEntry ? entry.weight - prevEntry.weight : 0
            
            return (
              <div
                key={entry.id || index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>
                    {entry.weight.toFixed(1)} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                    {new Date(entry.date).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>
                {change !== 0 && (
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    background: change > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    color: change > 0 ? THEME.danger : THEME.success,
                    fontWeight: '600'
                  }}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowInput(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: THEME.gradient,
          border: 'none',
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}
      >
        <Plus size={24} color="#fff" />
      </button>

      {/* Input Modal */}
      {showInput && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowInput(false)}
        >
          <div 
            style={{
              background: '#1a1a1a',
              borderRadius: isMobile ? '20px 20px 0 0' : '20px',
              padding: isMobile ? '1.25rem' : '2rem',
              width: isMobile ? '100%' : '400px',
              maxHeight: isMobile ? '75vh' : 'auto',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {isMobile && (
              <div style={{
                width: '40px',
                height: '4px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '2px',
                margin: '0 auto 1rem'
              }} />
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff' }}>
                Gewicht invoeren
              </h3>
              <button
                onClick={() => setShowInput(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} color="#fff" />
              </button>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem',
              border: `2px solid ${THEME.primary}`
            }}>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                placeholder="0.0"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#fff',
                  width: '100%',
                  textAlign: 'center'
                }}
                autoFocus={!isMobile}
              />
              <div style={{ 
                textAlign: 'center', 
                color: 'rgba(255,255,255,0.5)', 
                fontSize: '0.85rem', 
                marginTop: '0.5rem' 
              }}>
                kilogram
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              {['morning', 'afternoon', 'evening'].map(time => (
                <button
                  key={time}
                  onClick={() => setInputMode(time)}
                  style={{
                    padding: '0.75rem',
                    background: inputMode === time ? THEME.gradient : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {time === 'morning' ? 'Ochtend' : time === 'afternoon' ? 'Middag' : 'Avond'}
                </button>
              ))}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {[
                { id: 'great', label: '😊' },
                { id: 'normal', label: '😐' },
                { id: 'tired', label: '😴' }
              ].map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setFeeling(mood.id)}
                  style={{
                    padding: '0.75rem',
                    background: feeling === mood.id ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                    border: feeling === mood.id ? `1px solid ${THEME.primary}` : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '1.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {mood.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveWeight}
              disabled={!currentWeight || saving}
              style={{
                width: '100%',
                padding: '1rem',
                background: currentWeight && !saving ? THEME.gradient : 'rgba(255,255,255,0.1)',
                border: 'none',
                borderRadius: '12px',
                color: currentWeight && !saving ? '#fff' : 'rgba(255,255,255,0.3)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: currentWeight && !saving ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {saving ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={20} />}
              Opslaan
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        ::-webkit-scrollbar {
          width: 4px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}
