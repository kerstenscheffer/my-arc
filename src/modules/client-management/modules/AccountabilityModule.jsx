// src/modules/client-management/modules/AccountabilityModule.jsx
// Accountability Module voor MY ARC Client Management
// Gebruikt alle DatabaseService accountability methods

import { useState, useEffect } from 'react'

const AccountabilityModule = ({ client, data, onAction, viewMode, db }) => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  
  // Load accountability data on mount
  useEffect(() => {
    if (client?.id && db) {
      loadAccountabilityData()
    }
  }, [client])

  const loadAccountabilityData = async () => {
    if (!client?.id || !db) return
    setLoading(true)
    
    try {
      const [notifs, streak, score, unreadCount] = await Promise.all([
        db.getActiveNotifications(client.id, { limit: 5 }),
        db.getClientStreak(client.id),
        db.getMyArcScore(client.id),
        db.getUnreadNotificationCount(client.id)
      ])
      
      setNotifications(notifs || [])
      
      // Update parent data
      if (onAction) {
        onAction('updateData', {
          accountability: {
            notifications: notifs,
            streak,
            score,
            unreadCount
          }
        })
      }
    } catch (error) {
      console.error('Error loading accountability:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendQuickMessage = async (type) => {
    const messages = {
      motivation: "💪 Keep pushing! You're doing amazing!",
      reminder: "⏰ Don't forget your workout today!",
      praise: "🎉 Fantastic work this week!"
    }
    
    try {
      await db.sendNotification(client.id, type, messages[type])
      await loadAccountabilityData()
      
      if (onAction) {
        onAction('messageSent', { type, message: messages[type] })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await db.markNotificationRead(notificationId)
      await loadAccountabilityData()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // Compact view for dashboard
  if (viewMode === 'compact') {
    const accountabilityData = data?.accountability || {}
    
    return (
      <div style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <h4 style={{ color: '#10b981', margin: 0 }}>Accountability</h4>
          <button
            onClick={() => onAction && onAction('viewDetails', {})}
            style={{
              padding: '4px 8px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            View All
          </button>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '12px'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🔥</div>
            <div style={{ color: '#f59e0b', fontSize: '20px', fontWeight: 'bold' }}>
              {accountabilityData.streak || 0}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>Day Streak</div>
          </div>
          
          <div style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '12px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
            <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
              {accountabilityData.score || 0}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '11px' }}>MY ARC Score</div>
          </div>
        </div>
        
        {accountabilityData.unreadCount > 0 && (
          <div style={{
            background: '#ef4444',
            color: 'white',
            padding: '8px',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '12px'
          }}>
            {accountabilityData.unreadCount} unread notifications
          </div>
        )}
      </div>
    )
  }

  // Focus view for detailed management
  if (viewMode === 'focus') {
    return (
      <div>
        <h4 style={{ color: '#10b981', marginBottom: '16px' }}>
          Accountability Management
        </h4>
        
        {/* MY ARC Score & Streak */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔥</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {data?.accountability?.streak || 0}
            </div>
            <div style={{ color: '#9ca3af' }}>Day Streak</div>
          </div>
          
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '2px solid #10b981',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {data?.accountability?.score || 0}
            </div>
            <div style={{ color: '#9ca3af' }}>MY ARC Score</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>Quick Actions</h5>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => sendQuickMessage('motivation')}
              style={{
                flex: 1,
                padding: '10px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              💪 Motivate
            </button>
            <button
              onClick={() => sendQuickMessage('reminder')}
              style={{
                flex: 1,
                padding: '10px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ⏰ Remind
            </button>
            <button
              onClick={() => sendQuickMessage('praise')}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🎉 Praise
            </button>
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <h5 style={{ color: '#d1d5db', marginBottom: '12px' }}>
            Recent Notifications ({notifications.length})
          </h5>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>
              No active notifications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  style={{
                    background: notif.read_status ? 'rgba(0,0,0,0.3)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${notif.priority === 'urgent' ? '#ef4444' : '#374151'}`,
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ color: '#f3f4f6', marginBottom: '4px' }}>
                      {notif.title}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {notif.message}
                    </div>
                  </div>
                  {!notif.read_status && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default list view
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Accountability</h4>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div>
          <span style={{ color: '#9ca3af' }}>Streak: </span>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
            {data?.accountability?.streak || 0} days 🔥
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Score: </span>
          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
            {data?.accountability?.score || 0}/100
          </span>
        </div>
        <div>
          <span style={{ color: '#9ca3af' }}>Unread: </span>
          <span style={{ color: data?.accountability?.unreadCount > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
            {data?.accountability?.unreadCount || 0}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => setShowQuickActions(!showQuickActions)}
        style={{
          padding: '8px 16px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {showQuickActions ? 'Hide' : 'Show'} Quick Actions
      </button>
      
      {showQuickActions && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => sendQuickMessage('motivation')}
            style={{
              flex: 1,
              padding: '8px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            💪 Motivate
          </button>
          <button
            onClick={() => sendQuickMessage('reminder')}
            style={{
              flex: 1,
              padding: '8px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ⏰ Remind
          </button>
          <button
            onClick={() => sendQuickMessage('praise')}
            style={{
              flex: 1,
              padding: '8px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            🎉 Praise
          </button>
        </div>
      )}
    </div>
  )
}

export default AccountabilityModule
