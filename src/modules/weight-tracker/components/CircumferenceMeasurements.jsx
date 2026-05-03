// src/modules/weight-tracker/components/CircumferenceMeasurements.jsx
// 🏆 COLLAPSIBLE CIRCUMFERENCE TRACKER - Golden Theme
// WITH EDIT MODE - Can modify today's entry

import React, { useState } from 'react'
import { 
  ChevronDown, 
  ChevronUp, 
  Ruler, 
  Check, 
  Loader2, 
  TrendingDown, 
  TrendingUp,
  Circle,
  Activity,
  Maximize2,
  ArrowRight,
  Edit2
} from 'lucide-react'

const GOLDEN_THEME = {
  primary: '#FFD700',
  secondary: '#FFA500',
  success: '#10b981',  // GROEN = AFVALLEN (alle metrics)
  danger: '#dc2626',
  border: 'rgba(255, 215, 0, 0.08)',
  gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
}

export default function CircumferenceMeasurements({
  weightService,
  clientId,
  isMobile = false,
  onSave
}) {
  // Collapsible state
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Measurement state
  const [measurements, setMeasurements] = useState({
    waist_cm: '',
    bicep_cm: '',
    chest_cm: '',
    thigh_cm: ''
  })
  
  // Data state
  const [todayEntry, setTodayEntry] = useState(null)
  const [previousEntry, setPreviousEntry] = useState(null)
  const [sevenDayAvg, setSevenDayAvg] = useState(null)
  const [weeklyComparison, setWeeklyComparison] = useState(null)
  const [history, setHistory] = useState([])
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  
  // Load data when expanded
  React.useEffect(() => {
    if (isExpanded && !loading) {
      loadData()
    }
  }, [isExpanded, clientId])
  
  const loadData = async () => {
    if (!clientId) return
    
    setLoading(true)
    try {
      const [today, previous, avg, weekly, hist] = await Promise.all([
        weightService.getTodayCircumference(clientId),
        weightService.getPreviousCircumference(clientId),
        weightService.get7DayAverages(clientId),
        weightService.getWeeklyCircumferenceComparison(clientId),
        weightService.getCircumferenceHistory(clientId, 56)
      ])
      
      setTodayEntry(today)
      setPreviousEntry(previous)
      setSevenDayAvg(avg)
      setWeeklyComparison(weekly)
      setHistory(hist)
      
      // Set initial values from today or previous
      if (today) {
        setMeasurements({
          waist_cm: today.waist_cm || '',
          bicep_cm: today.bicep_cm || '',
          chest_cm: today.chest_cm || '',
          thigh_cm: today.thigh_cm || ''
        })
        setIsEditMode(false) // Reset edit mode
      } else if (previous) {
        setMeasurements({
          waist_cm: previous.waist_cm || '',
          bicep_cm: previous.bicep_cm || '',
          chest_cm: previous.chest_cm || '',
          thigh_cm: previous.thigh_cm || ''
        })
        setIsEditMode(false)
      }
    } catch (error) {
      console.error('Error loading circumference data:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    // Validate at least one measurement
    const hasValues = Object.values(measurements).some(v => v !== '' && v !== null)
    
    if (!hasValues) {
      showMessage('Voer minstens één meting in', 'error')
      return
    }
    
    setSaving(true)
    try {
      await weightService.saveCircumference(clientId, measurements)
      showMessage(todayEntry ? 'Metingen bijgewerkt!' : 'Metingen opgeslagen!', 'success')
      await loadData()
      
      if (onSave) onSave()
    } catch (error) {
      console.error('Save error:', error)
      showMessage('Fout bij opslaan', 'error')
    } finally {
      setSaving(false)
    }
  }
  
  const handleEdit = () => {
    setIsEditMode(true)
  }
  
  const handleCancelEdit = () => {
    // Reset to today's entry values
    if (todayEntry) {
      setMeasurements({
        waist_cm: todayEntry.waist_cm || '',
        bicep_cm: todayEntry.bicep_cm || '',
        chest_cm: todayEntry.chest_cm || '',
        thigh_cm: todayEntry.thigh_cm || ''
      })
    }
    setIsEditMode(false)
  }
  
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }
  
  // Calculate change from previous
  const getChange = (metric) => {
    const current = parseFloat(measurements[`${metric}_cm`])
    const prev = previousEntry?.[`${metric}_cm`]
    
    if (!current || !prev) return null
    
    return parseFloat((current - prev).toFixed(1))
  }
  
  // Determine if inputs should be disabled
  const inputsDisabled = todayEntry && !isEditMode
  
  // Render change indicator - GROEN VOOR DALING (ALL METRICS)
  const ChangeIndicator = ({ change, size = 10 }) => {
    if (change === null || change === 0) return null
    
    const isDecrease = change < 0
    
    return (
      <span style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.125rem 0.375rem',
        background: isDecrease ? 
          'rgba(16, 185, 129, 0.1)' :  // GROEN voor afname
          'rgba(220, 38, 38, 0.1)',     // ROOD voor toename
        borderRadius: '4px',
        fontSize: isMobile ? '0.65rem' : '0.7rem',
        color: isDecrease ? GOLDEN_THEME.success : GOLDEN_THEME.danger,
        fontWeight: '600'
      }}>
        {isDecrease ? (
          <TrendingDown size={size} />
        ) : (
          <TrendingUp size={size} />
        )}
        {change > 0 ? '+' : ''}{change}
      </span>
    )
  }
  
  // Metrics configuration - LUCIDE ICONS ONLY
  const metrics = [
    { 
      key: 'waist', 
      label: 'Buik', 
      icon: Circle,
      unit: 'cm', 
      min: 40, 
      max: 200 
    },
    { 
      key: 'bicep', 
      label: 'Arm', 
      icon: Activity,
      unit: 'cm', 
      min: 15, 
      max: 80 
    },
    { 
      key: 'chest', 
      label: 'Borst', 
      icon: Maximize2,
      unit: 'cm', 
      min: 60, 
      max: 200 
    },
    { 
      key: 'thigh', 
      label: 'Bovenbeen', 
      icon: Circle,
      unit: 'cm', 
      min: 30, 
      max: 120 
    }
  ]
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.6) 0%, rgba(10, 10, 10, 0.6) 100%)',
      borderRadius: isMobile ? '12px' : '16px',
      border: `1px solid ${GOLDEN_THEME.border}`,
      backdropFilter: 'blur(10px)',
      overflow: 'hidden'
    }}>
      {/* Message Toast */}
      {message && (
        <div style={{
          position: 'fixed',
          top: isMobile ? '80px' : '100px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: isMobile ? '0.75rem 1.25rem' : '1rem 1.5rem',
          background: message.type === 'error'
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          border: message.type === 'error'
            ? '1px solid rgba(239, 68, 68, 0.5)'
            : '1px solid rgba(16, 185, 129, 0.3)',
          color: '#fff',
          fontSize: isMobile ? '0.875rem' : '1rem',
          fontWeight: '600',
          animation: 'slideDown 0.3s ease',
          boxShadow: message.type === 'error'
            ? '0 8px 24px rgba(239, 68, 68, 0.3)'
            : '0 8px 24px rgba(16, 185, 129, 0.3)',
          zIndex: 2000
        }}>
          {message.text}
        </div>
      )}
      
      {/* Header - Collapsible Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: isMobile ? '0.875rem 1rem' : '1rem 1.25rem',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 215, 0, 0.05)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Ruler size={isMobile ? 16 : 18} color={GOLDEN_THEME.primary} style={{ opacity: 0.7 }} />
          <span style={{
            fontSize: isMobile ? '0.9rem' : '1rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            Omtrekmetingen
          </span>
          {todayEntry && !isEditMode && (
            <Check size={isMobile ? 14 : 16} color={GOLDEN_THEME.success} />
          )}
          {isEditMode && (
            <Edit2 size={isMobile ? 14 : 16} color={GOLDEN_THEME.primary} />
          )}
        </div>
        
        {isExpanded ? (
          <ChevronUp size={isMobile ? 18 : 20} color={GOLDEN_THEME.primary} />
        ) : (
          <ChevronDown size={isMobile ? 18 : 20} color='rgba(255, 255, 255, 0.5)' />
        )}
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div style={{
          padding: isMobile ? '0 1rem 1rem 1rem' : '0 1.25rem 1.25rem 1.25rem',
          borderTop: `1px solid ${GOLDEN_THEME.border}`
        }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              gap: '0.5rem'
            }}>
              <Loader2 
                size={isMobile ? 20 : 24} 
                color={GOLDEN_THEME.primary}
                style={{ animation: 'spin 1s linear infinite' }}
              />
              <span style={{
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                color: 'rgba(255, 215, 0, 0.7)'
              }}>
                Data laden...
              </span>
            </div>
          ) : (
            <>
              {/* EDIT BUTTON - Show when completed and not in edit mode */}
              {todayEntry && !isEditMode && (
                <div style={{
                  marginTop: '1rem',
                  display: 'flex',
                  justifyContent: 'center'
                }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem',
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)',
                      border: `1px solid ${GOLDEN_THEME.border}`,
                      borderRadius: '10px',
                      color: GOLDEN_THEME.primary,
                      fontSize: isMobile ? '0.8rem' : '0.85rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.08) 100%)'
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.05) 100%)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Edit2 size={isMobile ? 14 : 16} />
                    Aanpassen
                  </button>
                </div>
              )}

              {/* COMPARISON TABLE */}
              {previousEntry && !isEditMode && (
                <div style={{
                  marginTop: '1rem',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: `1px solid rgba(255, 215, 0, 0.08)`
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Vergelijking
                  </div>
                  
                  {/* Table */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem'
                  }}>
                    {metrics.map(metric => {
                      const current = parseFloat(measurements[`${metric.key}_cm`]) || null
                      const previous = previousEntry[`${metric.key}_cm`] || null
                      const change = current && previous ? parseFloat((current - previous).toFixed(1)) : null
                      
                      if (!previous && !current) return null
                      
                      return (
                        <div
                          key={metric.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : '1.2fr 1fr 1fr 1fr',
                            gap: isMobile ? '0.5rem' : '0.75rem',
                            alignItems: 'center',
                            padding: isMobile ? '0.5rem' : '0.625rem',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '8px'
                          }}
                        >
                          {/* Label */}
                          <div style={{
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: 'rgba(255,255,255,0.7)',
                            fontWeight: '600'
                          }}>
                            {metric.label}
                          </div>
                          
                          {/* Previous */}
                          <div style={{
                            textAlign: isMobile ? 'center' : 'right',
                            fontSize: isMobile ? '0.75rem' : '0.8rem',
                            color: 'rgba(255,255,255,0.5)',
                            fontWeight: '500'
                          }}>
                            {previous ? `${previous} cm` : '--'}
                          </div>
                          
                          {/* Arrow (desktop only) */}
                          {!isMobile && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'center'
                            }}>
                              <ArrowRight size={14} color='rgba(255,255,255,0.3)' />
                            </div>
                          )}
                          
                          {/* Current */}
                          <div style={{
                            textAlign: isMobile ? 'center' : 'left',
                            fontSize: isMobile ? '0.8rem' : '0.85rem',
                            color: GOLDEN_THEME.primary,
                            fontWeight: '700'
                          }}>
                            {current ? `${current} cm` : '--'}
                          </div>
                          
                          {/* Change indicator */}
                          {change !== null && (
                            <div style={{
                              gridColumn: isMobile ? 'span 3' : 'auto',
                              display: 'flex',
                              justifyContent: isMobile ? 'center' : 'flex-end'
                            }}>
                              <ChangeIndicator change={change} size={12} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Measurement Grid - 2x2 mobile, 4 columns desktop */}
              {(!todayEntry || isEditMode) && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  marginTop: '1rem'
                }}>
                  {metrics.map(metric => {
                    const IconComponent = metric.icon
                    
                    return (
                      <div
                        key={metric.key}
                        style={{
                          background: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '12px',
                          padding: isMobile ? '0.75rem' : '1rem',
                          border: `1px solid rgba(255, 255, 255, 0.05)`
                        }}
                      >
                        {/* Label */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem'
                          }}>
                            <IconComponent 
                              size={isMobile ? 14 : 16} 
                              color={GOLDEN_THEME.primary}
                              style={{ opacity: 0.7 }}
                            />
                            <span style={{
                              fontSize: isMobile ? '0.7rem' : '0.75rem',
                              color: 'rgba(255,255,255,0.6)',
                              fontWeight: '600'
                            }}>
                              {metric.label}
                            </span>
                          </div>
                          
                          <ChangeIndicator change={getChange(metric.key)} />
                        </div>
                        
                        {/* Input */}
                        <input
                          type="number"
                          step="0.1"
                          min={metric.min}
                          max={metric.max}
                          value={measurements[`${metric.key}_cm`]}
                          onChange={(e) => setMeasurements({
                            ...measurements,
                            [`${metric.key}_cm`]: e.target.value
                          })}
                          disabled={inputsDisabled}
                          placeholder={previousEntry?.[`${metric.key}_cm`] || '--'}
                          style={{
                            width: '100%',
                            padding: isMobile ? '0.5rem' : '0.625rem',
                            background: inputsDisabled ? 
                              'rgba(255, 255, 255, 0.03)' : 
                              'rgba(0, 0, 0, 0.4)',
                            border: `1px solid ${inputsDisabled ? 
                              'rgba(255, 255, 255, 0.05)' : 
                              'rgba(255, 215, 0, 0.15)'}`,
                            borderRadius: '8px',
                            color: inputsDisabled ? 
                              'rgba(255, 255, 255, 0.4)' : 
                              '#fff',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            fontWeight: '600',
                            textAlign: 'center',
                            outline: 'none',
                            opacity: inputsDisabled ? 0.6 : 1
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* 7-Day Averages */}
              {sevenDayAvg && sevenDayAvg.count > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: `1px solid rgba(255, 215, 0, 0.08)`
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    7-Dagen Gemiddelde
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.5rem'
                  }}>
                    {metrics.map(metric => {
                      const avgValue = sevenDayAvg[`${metric.key}_avg`]
                      if (!avgValue) return null
                      
                      return (
                        <div key={metric.key} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: isMobile ? '0.7rem' : '0.75rem'
                        }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {metric.label}:
                          </span>
                          <span style={{ 
                            color: GOLDEN_THEME.primary,
                            fontWeight: '600'
                          }}>
                            {avgValue} cm
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* Save/Cancel Buttons */}
              {(!todayEntry || isEditMode) && (
                <div style={{
                  display: 'flex',
                  gap: isMobile ? '0.5rem' : '0.75rem',
                  marginTop: '1rem'
                }}>
                  {/* Cancel button (only in edit mode) */}
                  {isEditMode && (
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      style={{
                        flex: 1,
                        padding: isMobile ? '0.75rem' : '0.875rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        fontWeight: '600',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        touchAction: 'manipulation',
                        WebkitTapHighlightColor: 'transparent',
                        minHeight: '44px'
                      }}
                      onMouseEnter={(e) => {
                        if (!saving) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!saving) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                    >
                      Annuleren
                    </button>
                  )}
                  
                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      flex: 1,
                      padding: isMobile ? '0.75rem' : '0.875rem',
                      borderRadius: '12px',
                      background: saving
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.5) 0%, rgba(255, 165, 0, 0.5) 100%)'
                        : GOLDEN_THEME.gradient,
                      border: 'none',
                      color: '#000',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      cursor: saving ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                      minHeight: '44px'
                    }}
                    onMouseEnter={(e) => {
                      if (!saving) {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 215, 0, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving) {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <Loader2 size={isMobile ? 16 : 18} style={{ animation: 'spin 1s linear infinite' }} />
                        Saving...
                      </>
                    ) : isEditMode ? (
                      <>Bijwerken</>
                    ) : (
                      <>Opslaan</>
                    )}
                  </button>
                </div>
              )}
              
              {/* History Preview */}
              {history.length > 1 && (
                <div style={{
                  marginTop: '1rem',
                  padding: isMobile ? '0.75rem' : '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '12px',
                  border: `1px solid rgba(255, 215, 0, 0.08)`
                }}>
                  <div style={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Historie ({history.length} metingen)
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {history.slice(0, 5).map((entry, idx) => (
                      <div
                        key={entry.id || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: 'rgba(0, 0, 0, 0.2)',
                          borderRadius: '6px',
                          fontSize: isMobile ? '0.65rem' : '0.7rem'
                        }}
                      >
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {new Date(entry.measurement_date).toLocaleDateString('nl-NL', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          color: 'rgba(255,255,255,0.7)'
                        }}>
                          {entry.waist_cm && <span>B:{entry.waist_cm}</span>}
                          {entry.bicep_cm && <span>A:{entry.bicep_cm}</span>}
                          {entry.chest_cm && <span>Bo:{entry.chest_cm}</span>}
                          {entry.thigh_cm && <span>Bv:{entry.thigh_cm}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
