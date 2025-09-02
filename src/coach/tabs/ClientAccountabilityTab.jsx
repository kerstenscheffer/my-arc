// src/coach/tabs/ClientAccountabilityTab.jsx
// Complete Accountability Management met ALLE DatabaseService methods
// MY ARC - Kersten 2025

import { useState, useEffect } from 'react'
import './ClientAccountabilityTab.css' // Optional: voor custom styling

export default function ClientAccountabilityTab({ client, db }) {
  // ===== STATE MANAGEMENT =====
  const [notifications, setNotifications] = useState([])
  const [messages, setMessages] = useState([])
  const [streak, setStreak] = useState(0)
  const [compliance, setCompliance] = useState({
    meals: { average: 0, kcal: 0, protein: 0 },
    workouts: 0,
    score: 0
  })
  const [newMessage, setNewMessage] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [weeklyProgress, setWeeklyProgress] = useState({})
  const [unreadCount, setUnreadCount] = useState(0)

  // ===== LOAD DATA ON MOUNT =====
  useEffect(() => {
    if (client?.id) {
      loadAccountabilityData()
      // Refresh every 30 seconds for real-time updates
      const interval = setInterval(loadAccountabilityData, 30000)
      return () => clearInterval(interval)
    }
  }, [client])

  // ===== MAIN DATA LOADER =====
  const loadAccountabilityData = async () => {
    if (!client?.id || !db) return
    
    try {
      setLoading(true)
      
      // Load ALL accountability data in parallel
      const [
        activeNotifs,
        coachMessages,
        workoutStreak,
        mealCompliance,
        weeklyCount,
        myArcScore,
        unreadNotifCount,
        weekProgress
      ] = await Promise.all([
        db.getActiveNotifications(client.id, { 
          unreadOnly: false, 
          limit: 50,
          priority: null 
        }),
        db.getClientMessages(client.id),
        db.getClientStreak(client.id),
        db.getMealCompliance(client.id, 30),
        db.getWeeklyWorkoutCount(client.id),
        db.getMyArcScore(client.id),
        db.getUnreadNotificationCount(client.id),
        db.getWeeklyProgress(client.id)
      ])

      setNotifications(activeNotifs || [])
      setMessages(coachMessages || [])
      setStreak(workoutStreak || 0)
      setCompliance({
        meals: mealCompliance || { average: 0, kcal: 0, protein: 0 },
        workouts: weeklyCount || 0,
        score: myArcScore || 0
      })
      setUnreadCount(unreadNotifCount || 0)
      setWeeklyProgress(weekProgress || {})
      
    } catch (error) {
      console.error('Error loading accountability data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ===== MESSAGE TEMPLATES =====
  const messageTemplates = {
    motivation: [
      "💪 Kom op {name}! Je kunt dit! Elke stap telt!",
      "🔥 Je bent een kampioen {name}! Ga door!",
      "⭐ Geloof in jezelf {name}! Je bent sterker dan je denkt!",
      "🎯 Focus op je doel {name}! Je bent al zo ver gekomen!"
    ],
    reminder: [
      "⏰ Hey {name}, vergeet je workout vandaag niet!",
      "📋 {name}, heb je je maaltijden al gelogd vandaag?",
      "💧 {name}, denk aan je water intake! Doel: 2L+",
      "📸 {name}, tijd voor je wekelijkse progress foto?"
    ],
    praise: [
      "🎉 WAUW {name}! Geweldig bezig deze week!",
      "🏆 {name}, je bent een absolute ster! Trots op je!",
      "⭐ Fantastisch werk {name}! Je consistency is top!",
      "🎯 {name}, je hebt weer een mijlpaal bereikt! Gefeliciteerd!"
    ],
    warning: [
      "⚠️ {name}, je bent al 3 dagen niet actief geweest. Alles oké?",
      "❗ {name}, je streak staat op het punt verloren te gaan!",
      "📉 {name}, je compliance is gedaald. Laten we dit omkeren!",
      "🔔 {name}, belangrijke deadline voor je doel nadert!"
    ]
  }

  // ===== SEND QUICK MESSAGE =====
  const sendQuickMessage = async (type) => {
    const templates = messageTemplates[type]
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
    const message = randomTemplate.replace('{name}', client.first_name || 'Champion')
    
    setSendingMessage(true)
    try {
      await db.createAccountabilityAlert(
        client.id,
        type === 'warning' ? 'warning' : 'motivation',
        { 
          title: type.charAt(0).toUpperCase() + type.slice(1),
          text: message
        },
        {
          type: 'action',
          target: type === 'reminder' ? 'workout' : 'dashboard',
          label: type === 'reminder' ? 'Start Workout' : 'Open Dashboard'
        }
      )
      
      // Also send as notification
      await db.sendNotification(client.id, type, message)
      
      // Reload data
      await loadAccountabilityData()
      
      // Success feedback
      alert(`✅ ${type} message sent to ${client.first_name}!`)
      
    } catch (error) {
      console.error('Error sending message:', error)
      alert('❌ Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // ===== SEND CUSTOM MESSAGE =====
  const sendCustomMessage = async () => {
    if (!newMessage.trim()) return
    
    setSendingMessage(true)
    try {
      await db.createNotification({
        client_id: client.id,
        type: 'coach_message',
        priority: selectedPriority,
        title: '💬 Bericht van je Coach',
        message: newMessage,
        action_type: 'message',
        action_target: 'chat',
        action_label: 'Reply',
        expires_at: null
      })
      
      setNewMessage('')
      await loadAccountabilityData()
      alert('✅ Message sent!')
      
    } catch (error) {
      console.error('Error sending custom message:', error)
      alert('❌ Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // ===== MARK NOTIFICATION AS READ =====
  const handleMarkAsRead = async (notificationId) => {
    try {
      await db.markNotificationRead(notificationId)
      await loadAccountabilityData()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  // ===== DISMISS NOTIFICATION =====
  const handleDismiss = async (notificationId) => {
    try {
      await db.dismissNotification(notificationId)
      await loadAccountabilityData()
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  // ===== BULK ACTIONS =====
  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read_status)
      await Promise.all(unreadNotifs.map(n => db.markNotificationRead(n.id)))
      await loadAccountabilityData()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // ===== COMPLIANCE COLOR HELPER =====
  const getComplianceColor = (value) => {
    if (value >= 80) return '#10b981' // green
    if (value >= 60) return '#f59e0b' // orange
    return '#ef4444' // red
  }

  // ===== PRIORITY BADGE =====
  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: '#ef4444',
      normal: '#3b82f6',
      low: '#9ca3af'
    }
    return (
      <span style={{
        backgroundColor: colors[priority] || colors.normal,
        color: 'white',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {priority?.toUpperCase()}
      </span>
    )
  }

  // ===== RENDER LOADING STATE =====
  if (loading) {
    return (
      <div className="myarc-loading-container">
        <div className="myarc-spinner"></div>
        <p>Loading accountability data...</p>
      </div>
    )
  }

  // ===== MAIN RENDER =====
  return (
    <div className="myarc-accountability-container" style={{ padding: '20px' }}>
      {/* Header with MY ARC Score */}
      <div className="accountability-header" style={{
        background: 'linear-gradient(135deg, #1e293b, #334155)',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {/* MY ARC Score */}
        <div className="score-widget" style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>MY ARC Score</h4>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(#10b981 ${compliance.score * 3.6}deg, #1e293b 0)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            position: 'relative'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#10b981'
            }}>
              {compliance.score}
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="streak-widget" style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Current Streak</h4>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b' }}>
            {streak} 🔥
          </div>
          <p style={{ color: '#6b7280' }}>dagen</p>
        </div>

        {/* Weekly Compliance */}
        <div className="compliance-widget">
          <h4 style={{ color: '#9ca3af', marginBottom: '12px' }}>Weekly Compliance</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#d1d5db' }}>Workouts:</span>
              <span style={{ color: getComplianceColor((compliance.workouts / 3) * 100), fontWeight: 'bold' }}>
                {compliance.workouts}/3
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#d1d5db' }}>Meals:</span>
              <span style={{ color: getComplianceColor(compliance.meals.average), fontWeight: 'bold' }}>
                {compliance.meals.average}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#d1d5db' }}>Protein:</span>
              <span style={{ color: getComplianceColor(compliance.meals.protein_compliance), fontWeight: 'bold' }}>
                {compliance.meals.protein_compliance || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Unread Count */}
        <div className="unread-widget" style={{ textAlign: 'center' }}>
          <h4 style={{ color: '#9ca3af', marginBottom: '8px' }}>Unread</h4>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: unreadCount > 0 ? '#ef4444' : '#10b981' }}>
            {unreadCount}
          </div>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              background: unreadCount > 0 ? '#3b82f6' : '#374151',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: unreadCount > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Mark All Read
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation" style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        borderBottom: '2px solid #1e293b',
        paddingBottom: '12px'
      }}>
        {['overview', 'notifications', 'messages', 'quick-actions'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? '#10b981' : 'transparent',
              color: activeTab === tab ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>
              Accountability Overview - {client.first_name} {client.last_name}
            </h3>
            
            {/* Quick Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              {/* Recent Activity */}
              <div style={{
                background: '#1e293b',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Recent Activity</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ color: '#d1d5db', marginBottom: '8px' }}>
                    ✅ Workout completed - Today
                  </li>
                  <li style={{ color: '#d1d5db', marginBottom: '8px' }}>
                    🍎 Meal logged - 2 hours ago
                  </li>
                  <li style={{ color: '#d1d5db', marginBottom: '8px' }}>
                    📸 Progress photo - Yesterday
                  </li>
                </ul>
              </div>

              {/* Goals Progress */}
              <div style={{
                background: '#1e293b',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Goals Progress</h4>
                <div style={{ color: '#d1d5db' }}>
                  {weeklyProgress.goals 
                    ? `${weeklyProgress.goals}% average progress`
                    : 'No active goals'
                  }
                </div>
              </div>

              {/* Week at a Glance */}
              <div style={{
                background: '#1e293b',
                padding: '16px',
                borderRadius: '8px'
              }}>
                <h4 style={{ color: '#10b981', marginBottom: '12px' }}>This Week</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                    <div
                      key={day}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        background: index < compliance.workouts ? '#10b981' : '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notifications-content">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <h3 style={{ color: '#f3f4f6' }}>Active Notifications ({notifications.length})</h3>
              <button
                onClick={loadAccountabilityData}
                style={{
                  padding: '8px 16px',
                  background: '#374151',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{
                background: '#1e293b',
                padding: '32px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                No active notifications
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    style={{
                      background: notif.read_status ? '#1e293b' : '#1f2937',
                      border: notif.priority === 'urgent' ? '2px solid #ef4444' : '1px solid #374151',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        {getPriorityBadge(notif.priority)}
                        {!notif.read_status && (
                          <span style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            NEW
                          </span>
                        )}
                      </div>
                      <h4 style={{ color: '#f3f4f6', marginBottom: '4px' }}>{notif.title}</h4>
                      <p style={{ color: '#d1d5db', marginBottom: '8px' }}>{notif.message}</p>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(notif.created_at).toLocaleString('nl-NL')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {!notif.read_status && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          style={{
                            padding: '4px 8px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDismiss(notif.id)}
                        style={{
                          padding: '4px 8px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="messages-content">
            <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>Coach Messages</h3>
            
            {/* New Message Form */}
            <div style={{
              background: '#1e293b',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <h4 style={{ color: '#10b981', marginBottom: '12px' }}>Send New Message</h4>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: '#0f172a',
                  color: 'white',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '12px',
                  marginBottom: '12px',
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  style={{
                    padding: '8px',
                    background: '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px'
                  }}
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
                <button
                  onClick={sendCustomMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  style={{
                    padding: '8px 24px',
                    background: newMessage.trim() ? '#10b981' : '#374151',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    fontWeight: 'bold'
                  }}
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>

            {/* Message History */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.length === 0 ? (
                <div style={{
                  background: '#1e293b',
                  padding: '32px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  No messages yet
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      background: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ color: '#f3f4f6' }}>{msg.title}</h4>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        {new Date(msg.created_at).toLocaleString('nl-NL')}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db' }}>{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Quick Actions Tab */}
        {activeTab === 'quick-actions' && (
          <div className="quick-actions-content">
            <h3 style={{ color: '#f3f4f6', marginBottom: '16px' }}>Quick Actions</h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {/* Motivation Messages */}
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#10b981', marginBottom: '16px' }}>💪 Motivation</h4>
                <button
                  onClick={() => sendQuickMessage('motivation')}
                  disabled={sendingMessage}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Send Motivation
                </button>
              </div>

              {/* Reminder Messages */}
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '16px' }}>⏰ Reminder</h4>
                <button
                  onClick={() => sendQuickMessage('reminder')}
                  disabled={sendingMessage}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Send Reminder
                </button>
              </div>

              {/* Praise Messages */}
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#f59e0b', marginBottom: '16px' }}>🎉 Praise</h4>
                <button
                  onClick={() => sendQuickMessage('praise')}
                  disabled={sendingMessage}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Send Praise
                </button>
              </div>

              {/* Warning Messages */}
              <div style={{
                background: '#1e293b',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h4 style={{ color: '#ef4444', marginBottom: '16px' }}>⚠️ Warning</h4>
                <button
                  onClick={() => sendQuickMessage('warning')}
                  disabled={sendingMessage}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}
                >
                  Send Warning
                </button>
              </div>
            </div>

            {/* Bulk Actions */}
            <div style={{
              marginTop: '32px',
              padding: '20px',
              background: '#1e293b',
              borderRadius: '8px'
            }}>
              <h4 style={{ color: '#10b981', marginBottom: '16px' }}>Bulk Actions</h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    if (confirm('Send weekly check-in to all clients?')) {
                      // Implement bulk send
                      alert('Feature coming soon!')
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Weekly Check-in (All Clients)
                </button>
                <button
                  onClick={() => {
                    if (confirm('Send streak reminder to inactive clients?')) {
                      // Implement bulk send
                      alert('Feature coming soon!')
                    }
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Streak Reminder (Inactive)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
