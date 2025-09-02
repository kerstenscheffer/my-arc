// src/modules/client-management/modules/CommunicationModule.jsx
import { useState, useEffect, useRef } from 'react'

export default function CommunicationModule({ client, data, onAction, viewMode, db }) {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('general')
  const [sending, setSending] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const messagesEndRef = useRef(null)
  
  // Safe data extraction
  const messages = Array.isArray(data) ? data : []
  const lastMessage = messages[0]
  const unreadCount = messages.filter(m => !m.read && m.sender_type === 'client').length
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  useEffect(() => {
    if (viewMode === 'focus') {
      scrollToBottom()
    }
  }, [messages, viewMode])
  
  const handleSendMessage = async () => {
    if (!message.trim()) return
    
    setSending(true)
    try {
      await onAction('sendMessage', { 
        message,
        type: messageType,
        client_id: client.id,
        timestamp: new Date().toISOString()
      })
      setMessage('')
      setShowCompose(false)
      setMessageType('general')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }
  
  const markAsRead = async (messageId) => {
    try {
      await onAction('markAsRead', { messageId })
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }
  
  const getMessageTypeIcon = (type) => {
    switch(type) {
      case 'motivation': return '💪'
      case 'reminder': return '⏰'
      case 'feedback': return '💬'
      case 'celebration': return '🎉'
      case 'check_in': return '✅'
      default: return '📨'
    }
  }
  
  const getQuickMessages = () => [
    { text: "Great work on your workouts this week! 💪", type: 'motivation' },
    { text: "How are you feeling today?", type: 'check_in' },
    { text: "Don't forget to log your meals!", type: 'reminder' },
    { text: "You're crushing your goals! 🎉", type: 'celebration' },
    { text: "Let's schedule a check-in call", type: 'general' }
  ]
  
  // Focus view - full chat interface
  if (viewMode === 'focus') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
        <div className="myarc-flex myarc-justify-between myarc-items-center" style={{ marginBottom: 'var(--s-3)' }}>
          <h4 style={{ color: '#fff' }}>
            💬 Communication
            {unreadCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                borderRadius: '50%',
                padding: '2px 6px',
                fontSize: 'var(--text-xs)',
                marginLeft: 'var(--s-2)'
              }}>
                {unreadCount}
              </span>
            )}
          </h4>
          <button
            className="myarc-btn myarc-btn-sm myarc-btn-secondary"
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? '✕' : '✍️ Compose'}
          </button>
        </div>
        
        {/* Compose Message */}
        {showCompose && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid #3b82f6',
            borderRadius: '8px',
            padding: 'var(--s-3)',
            marginBottom: 'var(--s-3)'
          }}>
            <div style={{ marginBottom: 'var(--s-2)' }}>
              <label style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>
                Message Type
              </label>
              <select
                className="myarc-select"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                style={{ marginTop: '4px' }}
              >
                <option value="general">📨 General</option>
                <option value="motivation">💪 Motivation</option>
                <option value="reminder">⏰ Reminder</option>
                <option value="feedback">💬 Feedback</option>
                <option value="celebration">🎉 Celebration</option>
                <option value="check_in">✅ Check-in</option>
              </select>
            </div>
            
            <textarea
              className="myarc-input"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows="4"
              style={{ marginBottom: 'var(--s-2)' }}
            />
            
            <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
              <button
                className="myarc-btn myarc-btn-primary"
                onClick={handleSendMessage}
                disabled={sending || !message.trim()}
                style={{ flex: 1 }}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
              <button
                className="myarc-btn myarc-btn-ghost"
                onClick={() => {
                  setShowCompose(false)
                  setMessage('')
                  setMessageType('general')
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Quick Messages */}
        {!showCompose && (
          <div style={{ marginBottom: 'var(--s-3)' }}>
            <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--s-2)' }}>
              Quick Messages:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
              {getQuickMessages().map((quick, idx) => (
                <button
                  key={idx}
                  className="myarc-btn myarc-btn-ghost myarc-btn-sm"
                  onClick={() => {
                    setMessage(quick.text)
                    setMessageType(quick.type)
                    setShowCompose(true)
                  }}
                  style={{
                    fontSize: 'var(--text-xs)',
                    padding: '4px 8px'
                  }}
                >
                  {getMessageTypeIcon(quick.type)} {quick.text.substring(0, 20)}...
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Message Thread */}
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '8px',
          padding: 'var(--s-3)',
          flex: 1,
          overflowY: 'auto',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column-reverse'
        }}>
          {messages.length > 0 ? (
            <>
              <div ref={messagesEndRef} />
              {messages.map((msg, idx) => {
                const isCoach = msg.sender_type === 'coach'
                const isUnread = !msg.read && !isCoach
                
                if (isUnread) {
                  markAsRead(msg.id)
                }
                
                return (
                  <div 
                    key={idx} 
                    style={{
                      marginBottom: 'var(--s-3)',
                      display: 'flex',
                      justifyContent: isCoach ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: isCoach 
                        ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: 'var(--s-3)',
                      position: 'relative'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        marginBottom: 'var(--s-1)'
                      }}>
                        <span style={{ marginRight: 'var(--s-1)' }}>
                          {getMessageTypeIcon(msg.type || 'general')}
                        </span>
                        <span style={{ 
                          color: isCoach ? '#93c5fd' : 'var(--c-muted)',
                          fontSize: 'var(--text-xs)'
                        }}>
                          {isCoach ? 'You' : client.first_name}
                        </span>
                        {isUnread && (
                          <span style={{
                            background: '#ef4444',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            marginLeft: 'var(--s-1)'
                          }} />
                        )}
                      </div>
                      
                      <p style={{ 
                        color: '#fff',
                        marginBottom: 'var(--s-1)'
                      }}>
                        {msg.message}
                      </p>
                      
                      <p style={{ 
                        color: isCoach ? '#93c5fd' : 'var(--c-muted)',
                        fontSize: 'var(--text-xs)'
                      }}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: 'var(--s-6)',
              color: 'var(--c-muted)'
            }}>
              <p style={{ fontSize: '2rem', marginBottom: 'var(--s-2)' }}>💬</p>
              <p>No messages yet</p>
              <p style={{ fontSize: 'var(--text-sm)' }}>Start the conversation!</p>
            </div>
          )}
        </div>
        
        {/* Quick Reply */}
        <div style={{ 
          marginTop: 'var(--s-3)',
          display: 'flex',
          gap: 'var(--s-2)'
        }}>
          <input
            className="myarc-input"
            placeholder="Quick reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            style={{ flex: 1 }}
          />
          <button
            className="myarc-btn myarc-btn-primary"
            onClick={handleSendMessage}
            disabled={sending || !message.trim()}
          >
            {sending ? '...' : '📨'}
          </button>
        </div>
      </div>
    )
  }
  
  // Grid/List view - compact display
  return (
    <div>
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '8px',
        padding: 'var(--s-3)',
        marginBottom: 'var(--s-2)',
        textAlign: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--s-1)'
        }}>
          <p style={{ color: 'var(--c-muted)', fontSize: 'var(--text-sm)' }}>Last Contact</p>
          {unreadCount > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              borderRadius: '10px',
              padding: '2px 8px',
              fontSize: 'var(--text-xs)'
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <p style={{ color: '#fff', fontWeight: 'bold' }}>
          {lastMessage ? new Date(lastMessage.created_at).toLocaleDateString() : 'Never'}
        </p>
        {lastMessage && (
          <p style={{ 
            color: 'var(--c-muted)', 
            fontSize: 'var(--text-xs)',
            marginTop: 'var(--s-1)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            "{lastMessage.message.substring(0, 30)}..."
          </p>
        )}
      </div>
      <button
        className="myarc-btn myarc-btn-sm myarc-btn-primary"
        onClick={() => onAction('openChat', {})}
        style={{ width: '100%' }}
      >
        {unreadCount > 0 ? `View Messages (${unreadCount})` : 'Send Message'}
      </button>
    </div>
  )
}
