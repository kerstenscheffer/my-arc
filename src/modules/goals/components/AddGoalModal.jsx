// src/modules/goals/components/AddGoalModal.jsx
import React from 'react'
import { X, Trophy, CalendarCheck, RefreshCw } from 'lucide-react'
import { goalCategories, measurementTypes, durationPresets } from '../config'
import { calculateDeadline, getDayInfo } from '../utils'
import { isMobile } from '../config'

export function AddGoalModal({ 
  selectedCategory, 
  goalForm, 
  setGoalForm,
  selectedDuration,
  setSelectedDuration,
  showCustomDate,
  setShowCustomDate,
  loading,
  onSave,
  onClose
}) {
  const mobile = isMobile()
  const dayInfo = getDayInfo()
  const category = goalCategories[selectedCategory]
  
  if (!category) return null
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: mobile ? '1rem' : '1rem',
      overflowY: 'auto'
    }}>
      <div style={{
        background: category.darkGradient,
        backgroundBlendMode: 'overlay',
        backgroundColor: '#1a1a1a',
        borderRadius: mobile ? '16px' : '20px',
        padding: mobile ? '1.5rem' : '2rem',
        width: '100%',
        maxWidth: mobile ? '100%' : '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: `2px solid ${category.color}33`,
        boxShadow: `0 20px 60px ${category.color}22`
      }}>
        {/* Header */}
        <h2 style={{
          fontSize: mobile ? '1.25rem' : '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {React.createElement(category.icon, { 
              size: mobile ? 20 : 24, 
              color: category.color 
            })}
            <span style={{ color: '#fff' }}>
              Nieuw {category.name} Doel
            </span>
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </h2>
        
        {/* Start Info */}
        <div style={{
          marginBottom: '1.5rem',
          padding: mobile ? '0.75rem' : '1rem',
          background: category.bgColor,
          borderRadius: '12px',
          border: `1px solid ${category.color}33`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: category.color,
            fontSize: mobile ? '0.8rem' : '0.875rem',
            marginBottom: '0.5rem'
          }}>
            <CalendarCheck size={16} />
            <strong>Start vanaf morgen</strong>
          </div>
          <div style={{
            fontSize: mobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255,255,255,0.7)'
          }}>
            Je doel begint {dayInfo.tomorrowName} {dayInfo.tomorrowDate}
          </div>
        </div>
        
        {/* Goal Title */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)',
            fontSize: mobile ? '0.8rem' : '0.875rem'
          }}>
            Titel van je doel *
          </label>
          <input
            type="text"
            value={goalForm.title}
            onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            placeholder="Bijv. '8 uur slaap per nacht'"
            style={{
              width: '100%',
              padding: mobile ? '0.6rem' : '0.75rem',
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${category.color}33`,
              borderRadius: '8px',
              color: '#fff',
              fontSize: mobile ? '0.9rem' : '1rem'
            }}
          />
        </div>
        
        {/* Measurement Type */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)',
            fontSize: mobile ? '0.8rem' : '0.875rem'
          }}>
            Hoe meet je dit? *
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem'
          }}>
            {measurementTypes.map(type => {
              const IconComponent = type.icon
              return (
                <button
                  key={type.id}
                  onClick={() => setGoalForm({ ...goalForm, measurement_type: type.id })}
                  style={{
                    padding: mobile ? '0.6rem' : '0.75rem',
                    background: goalForm.measurement_type === type.id
                      ? category.gradient
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goalForm.measurement_type === type.id
                      ? category.color
                      : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: goalForm.measurement_type === type.id ? '#000' : '#fff',
                    cursor: 'pointer',
                    fontSize: mobile ? '0.8rem' : '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '60px'
                  }}
                >
                  <IconComponent size={mobile ? 18 : 20} />
                  <span>{type.name}</span>
                  <span style={{ fontSize: mobile ? '0.6rem' : '0.65rem', opacity: 0.7 }}>
                    {type.description}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Target Value & Unit */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 1fr', 
          gap: '0.5rem', 
          marginBottom: '1rem' 
        }}>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: mobile ? '0.8rem' : '0.875rem'
            }}>
              Target Waarde *
            </label>
            <input
              type="number"
              value={goalForm.target_value}
              onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
              placeholder="8"
              style={{
                width: '100%',
                padding: mobile ? '0.6rem' : '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: `1px solid ${category.color}33`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: mobile ? '0.9rem' : '1rem'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: mobile ? '0.8rem' : '0.875rem'
            }}>
              Eenheid
            </label>
            <input
              type="text"
              value={goalForm.unit}
              onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
              placeholder="uur"
              style={{
                width: '100%',
                padding: mobile ? '0.6rem' : '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: `1px solid ${category.color}33`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: mobile ? '0.9rem' : '1rem'
              }}
            />
          </div>
        </div>
        
        {/* Frequency for checkbox */}
        {goalForm.measurement_type === 'checkbox' && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: mobile ? '0.8rem' : '0.875rem'
            }}>
              Hoe vaak per week? *
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: mobile ? '0.25rem' : '0.5rem'
            }}>
              {[1,2,3,4,5,6,7].map(num => (
                <button
                  key={num}
                  onClick={() => setGoalForm({ ...goalForm, frequency_target: num })}
                  style={{
                    padding: mobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    background: goalForm.frequency_target === num
                      ? category.gradient
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${goalForm.frequency_target === num
                      ? category.color
                      : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '6px',
                    color: goalForm.frequency_target === num ? '#000' : '#fff',
                    fontSize: mobile ? '0.8rem' : '0.875rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '36px'
                  }}
                >
                  {num}x
                </button>
              ))}
            </div>
            <div style={{
              marginTop: '0.5rem',
              fontSize: mobile ? '0.7rem' : '0.75rem',
              color: 'rgba(255,255,255,0.6)',
              textAlign: 'center'
            }}>
              {goalForm.frequency_target} {goalForm.frequency_target === 1 ? 'dag' : 'dagen'} per week
            </div>
          </div>
        )}
        
        {/* Duration Preset */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'rgba(255,255,255,0.8)',
            fontSize: mobile ? '0.8rem' : '0.875rem'
          }}>
            Hoe lang wil je dit doel? *
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: mobile ? 'repeat(3, 1fr)' : 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: '0.5rem'
          }}>
            {durationPresets.map(preset => {
              const IconComponent = preset.icon
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    setSelectedDuration(preset.id)
                    setShowCustomDate(preset.id === 'custom')
                    if (preset.id !== 'custom') {
                      setGoalForm({
                        ...goalForm,
                        target_date: calculateDeadline(preset.id, durationPresets)
                      })
                    }
                  }}
                  style={{
                    padding: mobile ? '0.5rem 0.25rem' : '0.75rem 0.5rem',
                    background: selectedDuration === preset.id
                      ? category.gradient
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedDuration === preset.id
                      ? category.color
                      : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: selectedDuration === preset.id ? '#000' : '#fff',
                    fontSize: mobile ? '0.8rem' : '0.875rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '60px'
                  }}
                >
                  <IconComponent size={mobile ? 16 : 18} />
                  <span style={{ fontSize: mobile ? '0.7rem' : '0.75rem' }}>{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Custom Date Picker */}
        {showCustomDate && (
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: 'rgba(255,255,255,0.8)',
              fontSize: mobile ? '0.8rem' : '0.875rem'
            }}>
              Kies deadline
            </label>
            <input
              type="date"
              value={goalForm.target_date}
              onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
              min={dayInfo.tomorrow.toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: mobile ? '0.6rem' : '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: `1px solid ${category.color}33`,
                borderRadius: '8px',
                color: '#fff',
                fontSize: mobile ? '0.9rem' : '1rem'
              }}
            />
          </div>
        )}
        
        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!goalForm.title || !goalForm.target_value || loading}
          style={{
            width: '100%',
            padding: mobile ? '0.75rem' : '1rem',
            background: !goalForm.title || !goalForm.target_value
              ? 'rgba(139, 92, 246, 0.3)'
              : category.gradient,
            border: 'none',
            borderRadius: '8px',
            color: !goalForm.title || !goalForm.target_value
              ? 'rgba(255,255,255,0.5)'
              : '#000',
            fontWeight: 'bold',
            fontSize: mobile ? '0.9rem' : '1rem',
            cursor: !goalForm.title || !goalForm.target_value || loading
              ? 'not-allowed'
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            minHeight: '44px'
          }}
        >
          {loading ? <RefreshCw size={20} className="animate-spin" /> : <Trophy size={20} />}
          {loading ? 'Opslaan...' : 'Doel Opslaan'}
        </button>
      </div>
    </div>
  )
}
