// src/client/pages/components/WeightTracker.jsx
// Weight tracking component met optimalisaties

import React, { useState, useCallback, useMemo } from 'react'
import { Weight, Plus, TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react'

export default function WeightTracker() {
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'goal'
  const [formData, setFormData] = useState({ weight: '', goal: '' })
  
  // Hook voor weight data (geïmporteerd van parent)
  const { client, db, refresh } = React.useContext(ProgressContext)
  const [data, setData] = useState({ loading: true, history: [], goal: null })
  
  React.useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    if (!client?.id || !db) return
    
    try {
      const [goals, history] = await Promise.all([
        db.getClientGoals(client.id),
        db.getWeightHistory(client.id, 30)
      ])
      
      const weightGoal = goals?.find(g => g.goal_type === 'weight')
      
      setData({
        loading: false,
        history: history || [],
        goal: weightGoal || null
      })
    } catch (error) {
      console.error('Error loading weight data:', error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }
  
  const handleSave = async () => {
    if (!client?.id || !db) return
    
    try {
      if (modalMode === 'add') {
        await db.saveWeight(
          client.id,
          parseFloat(formData.weight),
          new Date().toISOString().split('T')[0]
        )
      } else {
        await db.saveWeightGoal(
          client.id,
          parseFloat(formData.weight),
          parseFloat(formData.goal)
        )
      }
      
      await loadData()
      setShowModal(false)
      setFormData({ weight: '', goal: '' })
    } catch (error) {
      console.error('Error saving:', error)
    }
  }
  
  // Memoized calculations
  const stats = useMemo(() => {
    if (!data.history.length) return null
    
    const latest = data.history[0]?.weight
    const previous = data.history[1]?.weight
    const oldest = data.history[data.history.length - 1]?.weight
    
    return {
      current: latest,
      change: previous ? (latest - previous).toFixed(1) : null,
      totalChange: oldest ? (latest - oldest).toFixed(1) : null,
      trend: previous ? (latest < previous ? 'down' : 'up') : null
    }
  }, [data.history])
  
  const chartData = useMemo(() => {
    return data.history.slice().reverse().map(entry => ({
      date: new Date(entry.date).toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'short' 
      }),
      value: entry.weight
    }))
  }, [data.history])
  
  if (data.loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
  }
  
  return (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Current Weight */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <Weight size={20} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats?.current || '--'} kg
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
            Huidig gewicht
          </div>
        </div>
        
        {/* Week Change */}
        {stats?.change && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            {stats.trend === 'down' ? (
              <TrendingDown size={20} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
            ) : (
              <TrendingUp size={20} style={{ color: '#f59e0b', marginBottom: '0.5rem' }} />
            )}
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {stats.change} kg
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Deze week
            </div>
          </div>
        )}
        
        {/* Goal */}
        {data.goal && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <Target size={20} style={{ color: '#3b82f6', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {data.goal.target_value} kg
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
              Doel gewicht
            </div>
          </div>
        )}
      </div>
      
      {/* Chart */}
      {chartData.length > 1 && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          height: '250px'
        }}>
          <SimpleChart data={chartData} />
        </div>
      )}
      
      {/* Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem'
      }}>
        <button
          onClick={() => {
            setModalMode('add')
            setShowModal(true)
          }}
          style={{
            padding: '1rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Plus size={20} />
          Gewicht toevoegen
        </button>
        
        <button
          onClick={() => {
            setModalMode('goal')
            setShowModal(true)
          }}
          style={{
            padding: '1rem',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <Target size={20} />
          Doel instellen
        </button>
      </div>
      
      {/* Modal */}
      {showModal && (
        <Modal
          mode={modalMode}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

// Simple Chart Component
const SimpleChart = ({ data }) => {
  if (!data || data.length < 2) return null
  
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        points={data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = 100 - ((d.value - min) / range) * 90
          return `${x},${y}`
        }).join(' ')}
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100
        const y = 100 - ((d.value - min) / range) * 90
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="#10b981"
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

// Modal Component
const Modal = ({ mode, formData, setFormData, onSave, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: '#1a1a1a',
      borderRadius: '16px',
      padding: '2rem',
      width: '90%',
      maxWidth: '400px'
    }}>
      <h3 style={{ marginBottom: '1.5rem' }}>
        {mode === 'add' ? 'Gewicht toevoegen' : 'Doel instellen'}
      </h3>
      
      <input
        type="number"
        step="0.1"
        placeholder="Gewicht (kg)"
        value={formData.weight}
        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
        style={{
          width: '100%',
          padding: '0.75rem',
          background: 'rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          color: '#fff',
          marginBottom: '1rem'
        }}
      />
      
      {mode === 'goal' && (
        <input
          type="number"
          step="0.1"
          placeholder="Doel gewicht (kg)"
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#fff',
            marginBottom: '1rem'
          }}
        />
      )}
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          Annuleren
        </button>
        <button
          onClick={onSave}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '8px',
            color: '#000',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Opslaan
        </button>
      </div>
    </div>
  </div>
)

// Context import voor gebruik in parent
const ProgressContext = React.createContext()
