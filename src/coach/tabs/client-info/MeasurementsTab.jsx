// src/coach/tabs/client-info/MeasurementsTab.jsx
import { useState, useEffect } from 'react'
import { Save, Plus, Ruler, TrendingDown, Calendar, Activity } from 'lucide-react'
import ClientIntelligenceService from '../../../modules/client-intelligence/ClientIntelligenceService'

export default function MeasurementsTab({ db, client, isEditing, setIsEditing, saving, setSaving, onRefresh, isMobile }) {
  const [measurements, setMeasurements] = useState([])
  const [newMeasurement, setNewMeasurement] = useState({
    date: new Date().toISOString().split('T')[0],
    chest: '',
    waist: '',
    hips: '',
    arm: '',
    thigh: '',
    calf: '',
    neck: '',
    weight: '',
    bodyFat: '',
    muscleMass: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const service = new ClientIntelligenceService(db)
  
  useEffect(() => {
    if (client) {
      loadMeasurements()
    }
  }, [client?.id])
  
  const loadMeasurements = async () => {
    setLoading(true)
    try {
      const data = await service.getBodyMeasurements(client.id, 10)
      setMeasurements(data || [])
    } catch (error) {
      console.error('Error loading measurements:', error)
      setMeasurements([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      await service.saveBodyMeasurements(client.id, newMeasurement)
      await loadMeasurements()
      setShowAddForm(false)
      setNewMeasurement({
        date: new Date().toISOString().split('T')[0],
        chest: '',
        waist: '',
        hips: '',
        arm: '',
        thigh: '',
        calf: '',
        neck: '',
        weight: '',
        bodyFat: '',
        muscleMass: '',
        notes: ''
      })
      alert('✅ Measurements saved successfully!')
    } catch (error) {
      console.error('Error saving measurements:', error)
      alert('❌ Error saving: ' + error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const calculateChange = (current, previous, field) => {
    if (!current?.[field] || !previous?.[field]) return null
    const diff = parseFloat(current[field]) - parseFloat(previous[field])
    return diff
  }
  
  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          margin: '0 auto',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }
  
  return (
    <div>
      {/* Header with Add Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: isMobile ? '1.1rem' : '1.25rem',
          fontWeight: '600',
          color: '#fff',
          margin: 0
        }}>
          Body Measurements History
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: isMobile ? '0.6rem 1rem' : '0.75rem 1.25rem',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px',
            transition: 'all 0.3s ease',
            transform: 'translateZ(0)'
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
          <Plus size={16} />
          Add Measurement
        </button>
      </div>
      
      {/* Add Measurement Form */}
      {showAddForm && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.05)',
          borderRadius: '12px',
          padding: isMobile ? '1rem' : '1.5rem',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <Ruler size={18} color="#10b981" />
            <h4 style={{
              fontSize: isMobile ? '0.95rem' : '1rem',
              fontWeight: '600',
              color: '#10b981',
              margin: 0
            }}>
              New Measurement
            </h4>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '0.75rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Date</label>
              <input
                type="date"
                value={newMeasurement.date}
                onChange={(e) => setNewMeasurement({...newMeasurement, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newMeasurement.weight}
                onChange={(e) => setNewMeasurement({...newMeasurement, weight: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Chest (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newMeasurement.chest}
                onChange={(e) => setNewMeasurement({...newMeasurement, chest: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Waist (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newMeasurement.waist}
                onChange={(e) => setNewMeasurement({...newMeasurement, waist: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Hips (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newMeasurement.hips}
                onChange={(e) => setNewMeasurement({...newMeasurement, hips: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Arm (cm)</label>
              <input
                type="number"
                step="0.5"
                value={newMeasurement.arm}
                onChange={(e) => setNewMeasurement({...newMeasurement, arm: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Body Fat %</label>
              <input
                type="number"
                step="0.1"
                value={newMeasurement.bodyFat}
                onChange={(e) => setNewMeasurement({...newMeasurement, bodyFat: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
            
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.25rem',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>Muscle Mass (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newMeasurement.muscleMass}
                onChange={(e) => setNewMeasurement({...newMeasurement, muscleMass: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.4rem' : '0.5rem',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  minHeight: '44px'
                }}
              />
            </div>
          </div>
          
          <div style={{ marginTop: '0.75rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.25rem',
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>Notes</label>
            <textarea
              value={newMeasurement.notes}
              onChange={(e) => setNewMeasurement({...newMeasurement, notes: e.target.value})}
              placeholder="Any notes about this measurement..."
              style={{
                width: '100%',
                padding: isMobile ? '0.4rem' : '0.5rem',
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                minHeight: '60px',
                resize: 'vertical'
              }}
            />
          </div>
          
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            marginTop: '1rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                cursor: 'pointer',
                minHeight: '44px',
                touchAction: 'manipulation'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: isMobile ? '0.5rem 1rem' : '0.6rem 1.25rem',
                background: saving ? 'rgba(16, 185, 129, 0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                minHeight: '44px',
                touchAction: 'manipulation'
              }}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Measurement'}
            </button>
          </div>
        </div>
      )}
      
      {/* Measurements History */}
      {measurements.length === 0 ? (
        <div style={{
          padding: '3rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <Ruler size={48} color="#10b981" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h4 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '600',
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.5rem'
          }}>
            No Measurements Yet
          </h4>
          <p style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: isMobile ? '0.85rem' : '0.9rem'
          }}>
            Click "Add Measurement" to start tracking progress
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {measurements.map((measurement, index) => {
            const previous = measurements[index + 1]
            const weightChange = calculateChange(measurement, previous, 'weight')
            const waistChange = calculateChange(measurement, previous, 'waist')
            
            return (
              <div key={measurement.id || index} style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: isMobile ? '1rem' : '1.25rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}>
                    <Calendar size={16} color="#10b981" />
                    <span style={{
                      fontSize: isMobile ? '0.9rem' : '0.95rem',
                      fontWeight: '600',
                      color: '#fff'
                    }}>
                      {new Date(measurement.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {index === 0 && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.7rem' : '0.75rem',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      LATEST
                    </span>
                  )}
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                  gap: '0.75rem'
                }}>
                  {measurement.weight && (
                    <div>
                      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Weight</div>
                      <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '600', color: '#fff' }}>
                        {measurement.weight} kg
                        {weightChange && (
                          <span style={{
                            marginLeft: '0.25rem',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: weightChange < 0 ? '#10b981' : '#ef4444'
                          }}>
                            ({weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {measurement.waist && (
                    <div>
                      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Waist</div>
                      <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '600', color: '#fff' }}>
                        {measurement.waist} cm
                        {waistChange && (
                          <span style={{
                            marginLeft: '0.25rem',
                            fontSize: isMobile ? '0.7rem' : '0.75rem',
                            color: waistChange < 0 ? '#10b981' : '#ef4444'
                          }}>
                            ({waistChange > 0 ? '+' : ''}{waistChange.toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {measurement.chest && (
                    <div>
                      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Chest</div>
                      <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '600', color: '#fff' }}>
                        {measurement.chest} cm
                      </div>
                    </div>
                  )}
                  {measurement.body_fat && (
                    <div>
                      <div style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', color: 'rgba(255, 255, 255, 0.4)' }}>Body Fat</div>
                      <div style={{ fontSize: isMobile ? '0.9rem' : '0.95rem', fontWeight: '600', color: '#fff' }}>
                        {measurement.body_fat}%
                      </div>
                    </div>
                  )}
                </div>
                
                {measurement.notes && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {measurement.notes}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
