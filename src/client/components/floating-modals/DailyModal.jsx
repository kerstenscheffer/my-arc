// src/client/components/floating-modals/DailyModal.jsx
import { useState, useEffect } from 'react'
import { X, Camera, Weight, Smile, CheckCircle, ChevronRight } from 'lucide-react'

export default function DailyModal({ db, client, onNavigate, onClose, onRefresh }) {
  const isMobile = window.innerWidth <= 768
  
  const [dailyData, setDailyData] = useState({
    type: 'reflection',
    completed: false,
    lastValue: null
  })
  
  useEffect(() => {
    loadDailyData()
  }, [client?.id])
  
  async function loadDailyData() {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const todayStr = today.toISOString().split('T')[0]
    
    const isPhotoDay = [1, 3, 5].includes(dayOfWeek)
    const isWeightDay = [2, 4, 6].includes(dayOfWeek)
    
    const result = {
      type: isPhotoDay ? 'photo' : isWeightDay ? 'weight' : 'reflection',
      completed: false,
      lastValue: null
    }
    
    try {
      if (isPhotoDay) {
        const { data } = await db.supabase
          .from('progress_photos')
          .select('id')
          .eq('client_id', client.id)
          .eq('date', todayStr)
          .limit(1)
        
        result.completed = data && data.length > 0
      } else if (isWeightDay) {
        const { data } = await db.supabase
          .from('weight_challenge_logs')
          .select('weight')
          .eq('client_id', client.id)
          .eq('date', todayStr)
          .single()
        
        if (data) {
          result.completed = true
          result.lastValue = data.weight
        }
      }
    } catch (error) {
      console.error('Daily data error:', error)
    }
    
    setDailyData(result)
  }
  
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: isMobile ? '85vw' : '320px',
      maxWidth: '320px',
      maxHeight: '80vh',
      background: 'rgba(17, 17, 17, 0.95)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderLeft: '0.5px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px 0 0 16px',
      boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      zIndex: 999,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        borderBottom: '0.5px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '0.25rem'
          }}>
            Daily Check-in
          </h3>
          <p style={{
            margin: 0,
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            Log je dagelijkse voortgang
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: '0.5px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} color="rgba(255, 255, 255, 0.4)" />
        </button>
      </div>
      
      {/* Content */}
      <div style={{
        padding: isMobile ? '1.25rem' : '1.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(80vh - 100px)'
      }}>
        <div style={{
          background: dailyData.type === 'photo' 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)'
            : dailyData.type === 'weight'
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)'
            : 'linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(251, 146, 60, 0.04) 100%)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.25rem',
          textAlign: 'center',
          border: '0.5px solid rgba(255, 255, 255, 0.05)'
        }}>
          {dailyData.type === 'photo' && (
            <>
              <Camera size={36} color="rgba(139, 92, 246, 0.8)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '0.375rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Photo Day
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.5)' 
              }}>
                Upload je voortgang foto's
              </div>
            </>
          )}
          
          {dailyData.type === 'weight' && (
            <>
              <Weight size={36} color="rgba(59, 130, 246, 0.8)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '0.375rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Weigh-in Day
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.5)' 
              }}>
                {dailyData.lastValue 
                  ? `Laatste: ${dailyData.lastValue}kg`
                  : 'Log je gewicht'}
              </div>
            </>
          )}
          
          {dailyData.type === 'reflection' && (
            <>
              <Smile size={36} color="rgba(251, 146, 60, 0.8)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600',
                marginBottom: '0.375rem',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Reflection Day
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                color: 'rgba(255, 255, 255, 0.5)' 
              }}>
                Hoe voel je je vandaag?
              </div>
            </>
          )}
        </div>
        
        {dailyData.completed ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
            borderRadius: '10px',
            padding: '1.25rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            border: '0.5px solid rgba(16, 185, 129, 0.2)'
          }}>
            <CheckCircle size={18} color="#10b981" />
            <span style={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              fontWeight: '600'
            }}>
              Completed Today!
            </span>
          </div>
        ) : (
          <button
            onClick={() => {
              onNavigate('tracking')
              onClose()
            }}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
              border: '0.5px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '10px',
              padding: '1.25rem',
              color: '#3b82f6',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            Ga naar Progress
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
