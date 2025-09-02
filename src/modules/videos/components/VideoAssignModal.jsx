import React, { useState } from 'react'
import { 
  Send, X, Users, Calendar, FileVideo, Clock,
  Home, Dumbbell, Apple, TrendingUp
} from 'lucide-react'

export default function VideoAssignModal({ 
  video, 
  clients, 
  clientsLoading, 
  onClose, 
  onAssign,
  isMobile 
}) {
  const [selectedClients, setSelectedClients] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [assignmentData, setAssignmentData] = useState({
    type: 'manual',
    scheduledFor: new Date().toISOString().split('T')[0],
    timeOfDay: 'anytime',
    pageContext: 'home',
    contextData: {},
    notes: ''
  })
  
  const pageContextOptions = [
    { value: 'home', label: 'Home / Dashboard', icon: Home, color: '#10b981' },
    { value: 'workout', label: 'Workout Pagina', icon: Dumbbell, color: '#f59e0b' },
    { value: 'meals', label: 'Meal Planning', icon: Apple, color: '#3b82f6' },
    { value: 'progress', label: 'Progress Tracking', icon: TrendingUp, color: '#8b5cf6' },
    { value: 'workout_day', label: 'Specifieke Workout Dag', icon: Calendar, color: '#ef4444' },
    { value: 'meal_moment', label: 'Specifiek Meal Moment', icon: Clock, color: '#06b6d4' }
  ]
  
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedClients([])
    } else {
      setSelectedClients(clients.map(c => c.id))
    }
    setSelectAll(!selectAll)
  }
  
  const handleClientToggle = (clientId) => {
    if (selectedClients.includes(clientId)) {
      setSelectedClients(selectedClients.filter(id => id !== clientId))
    } else {
      setSelectedClients([...selectedClients, clientId])
    }
  }
  
  const handleAssign = () => {
    if (selectedClients.length === 0) {
      alert('Selecteer minimaal 1 client')
      return
    }
    
    const finalAssignmentData = {
      ...assignmentData,
      pageContext: assignmentData.pageContext,
      contextData: assignmentData.contextData
    }
    
    onAssign(selectedClients, finalAssignmentData)
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: '16px',
        padding: isMobile ? '1.5rem' : '2rem',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.08)',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: 'bold',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Send size={20} style={{ color: '#10b981' }} />
            Assign Video
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
        
        {/* Video Info */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#fff',
            marginBottom: '0.5rem'
          }}>
            {video.title}
          </h4>
          {video.description && (
            <p style={{
              fontSize: '0.85rem',
              color: 'rgba(255,255,255,0.4)'
            }}>
              {video.description}
            </p>
          )}
        </div>
        
        {/* Page Context Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem'
          }}>
            <FileVideo size={16} />
            Waar moet deze video verschijnen?
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '0.5rem'
          }}>
            {pageContextOptions.map(option => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setAssignmentData({...assignmentData, pageContext: option.value})}
                  style={{
                    padding: '0.75rem',
                    background: assignmentData.pageContext === option.value
                      ? `linear-gradient(135deg, ${option.color}33 0%, ${option.color}11 100%)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${assignmentData.pageContext === option.value ? option.color + '88' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    color: assignmentData.pageContext === option.value ? option.color : 'rgba(255,255,255,0.6)',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.3s ease',
                    textAlign: 'left',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
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
                  <Icon size={14} />
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
        
        {/* Extra Context Fields - Workout Day */}
        {assignmentData.pageContext === 'workout_day' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Welke workout dag?
            </label>
            <select
              onChange={(e) => setAssignmentData({
                ...assignmentData, 
                contextData: {...assignmentData.contextData, day: e.target.value}
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <option value="">Selecteer dag</option>
              <option value="monday">Maandag</option>
              <option value="tuesday">Dinsdag</option>
              <option value="wednesday">Woensdag</option>
              <option value="thursday">Donderdag</option>
              <option value="friday">Vrijdag</option>
              <option value="saturday">Zaterdag</option>
              <option value="sunday">Zondag</option>
            </select>
          </div>
        )}
        
        {/* Extra Context Fields - Meal Moment */}
        {assignmentData.pageContext === 'meal_moment' && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '0.5rem'
            }}>
              Welk meal moment?
            </label>
            <select
              onChange={(e) => setAssignmentData({
                ...assignmentData,
                contextData: {...assignmentData.contextData, mealType: e.target.value}
              })}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
            >
              <option value="">Selecteer moment</option>
              <option value="breakfast">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Diner</option>
              <option value="snack">Snack</option>
              <option value="pre-workout">Pre-workout</option>
              <option value="post-workout">Post-workout</option>
            </select>
          </div>
        )}
        
        {/* Schedule Date */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.9rem',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '0.5rem'
          }}>
            <Calendar size={16} />
            Schedule voor
          </label>
          <input
            type="date"
            value={assignmentData.scheduledFor}
            onChange={(e) => setAssignmentData({...assignmentData, scheduledFor: e.target.value})}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.95rem',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          />
        </div>
        
        {/* Client Selection */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem'
          }}>
            <label style={{
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}>
              <Users size={16} />
              Selecteer Clients ({selectedClients.length}/{clients.length})
            </label>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '0.4rem 0.75rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '6px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {selectAll ? 'Deselecteer Alle' : 'Selecteer Alle'}
            </button>
          </div>
          
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.02)',
            WebkitOverflowScrolling: 'touch'
          }}>
            {clientsLoading ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Clients laden...
              </div>
            ) : clients.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Geen clients gevonden. Voeg eerst clients toe.
              </div>
            ) : (
              clients.map((client, index) => {
                const clientName = client.first_name && client.last_name 
                  ? `${client.first_name} ${client.last_name}`
                  : client.first_name || client.last_name || client.email || `Client ${index + 1}`
                
                return (
                  <label
                    key={client.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      background: selectedClients.includes(client.id)
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'transparent',
                      transition: 'all 0.2s ease',
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => {
                      if (isMobile && selectedClients.includes(client.id)) {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (isMobile && selectedClients.includes(client.id)) {
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleClientToggle(client.id)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <span style={{ 
                      color: '#fff', 
                      fontSize: '0.9rem',
                      textTransform: 'capitalize'
                    }}>
                      {clientName}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'rgba(255,255,255,0.6)',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
          >
            Annuleren
          </button>
          <button
            onClick={handleAssign}
            disabled={selectedClients.length === 0}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: selectedClients.length === 0 
                ? 'rgba(255,255,255,0.03)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
              border: selectedClients.length === 0 
                ? '1px solid rgba(255,255,255,0.08)'
                : 'none',
              borderRadius: '8px',
              color: selectedClients.length === 0 
                ? 'rgba(255,255,255,0.3)'
                : '#fff',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: selectedClients.length === 0 ? 'not-allowed' : 'pointer',
              opacity: selectedClients.length === 0 ? 0.5 : 0.95,
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: '44px'
            }}
            onTouchStart={(e) => {
              if (isMobile && selectedClients.length > 0) {
                e.currentTarget.style.transform = 'scale(0.98)'
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && selectedClients.length > 0) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }}
          >
            {selectedClients.length === 0 
              ? 'Selecteer minimaal 1 client'
              : `Assign aan ${selectedClients.length} Client${selectedClients.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
