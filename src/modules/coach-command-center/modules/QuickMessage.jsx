import React, { useState, useEffect } from 'react'
import { MessageCircle, Send, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import QuickMessageService from './QuickMessageService'

export default function QuickMessage({ clientId, clientName, coachId, isMobile }) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', message: '...' }
  const [recentMessages, setRecentMessages] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const maxLength = 500

  useEffect(() => {
    if (showHistory && recentMessages.length === 0) {
      loadHistory()
    }
  }, [showHistory])

  const loadHistory = async () => {
    setLoadingHistory(true)
    const messages = await QuickMessageService.getRecentMessages(clientId, 5)
    setRecentMessages(messages)
    setLoadingHistory(false)
  }

  const handleSend = async () => {
    // Validate
    const validation = QuickMessageService.validateMessage(message)
    if (!validation.valid) {
      setFeedback({ type: 'error', message: validation.error })
      return
    }

    setSending(true)
    setFeedback(null)

    const result = await QuickMessageService.sendMessage(
      clientId,
      coachId,
      message,
      'Message from Coach'
    )

    setSending(false)

    if (result.success) {
      setFeedback({ type: 'success', message: 'Message sent!' })
      setMessage('')
      
      // Refresh history
      if (showHistory) {
        loadHistory()
      }
      
      // Clear feedback after 3 seconds
      setTimeout(() => setFeedback(null), 3000)
    } else {
      setFeedback({ type: 'error', message: result.error || 'Failed to send' })
    }
  }

  const handleKeyDown = (e) => {
    // Send on Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const charCount = message.length
  const charCountColor = charCount > maxLength * 0.9 
    ? '#ef4444' 
    : charCount > maxLength * 0.7 
      ? '#f59e0b' 
      : 'rgba(255, 255, 255, 0.4)'

  return (
    <div style={{
      background: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.2)',
      borderRadius: '12px',
      padding: isMobile ? '1rem' : '1.25rem'
    }}>
      {/* HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#10b981',
        fontSize: isMobile ? '0.9rem' : '1rem',
        fontWeight: '600',
        marginBottom: '1rem'
      }}>
        <MessageCircle size={isMobile ? 18 : 20} />
        Quick Message
      </div>

      {/* MESSAGE INPUT */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={`Type message to ${clientName}...\n\nTip: Cmd/Ctrl + Enter to send`}
        disabled={sending}
        style={{
          width: '100%',
          minHeight: isMobile ? '80px' : '100px',
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          color: '#fff',
          fontSize: isMobile ? '0.85rem' : '0.9rem',
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
          transition: 'all 0.2s',
          opacity: sending ? 0.6 : 1
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid #10b981'
          e.target.style.background = 'rgba(255, 255, 255, 0.08)'
        }}
        onBlur={(e) => {
          e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
          e.target.style.background = 'rgba(255, 255, 255, 0.05)'
        }}
      />

      {/* CHARACTER COUNT & SEND BUTTON */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.75rem'
      }}>
        <div style={{
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          color: charCountColor,
          fontWeight: charCount > maxLength * 0.9 ? '600' : '400'
        }}>
          {charCount}/{maxLength}
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !message.trim() || charCount > maxLength}
          style={{
            padding: isMobile ? '0.6rem 1.25rem' : '0.75rem 1.5rem',
            background: sending || !message.trim() || charCount > maxLength
              ? 'rgba(255, 255, 255, 0.1)'
              : '#10b981',
            border: 'none',
            borderRadius: '8px',
            color: sending || !message.trim() || charCount > maxLength
              ? 'rgba(255, 255, 255, 0.4)'
              : '#000',
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: '600',
            cursor: sending || !message.trim() || charCount > maxLength
              ? 'not-allowed'
              : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            opacity: sending || !message.trim() || charCount > maxLength ? 0.5 : 1
          }}
        >
          {sending ? (
            <>
              <div style={{
                width: '14px',
                height: '14px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Sending...
            </>
          ) : (
            <>
              <Send size={14} />
              Send
            </>
          )}
        </button>
      </div>

      {/* FEEDBACK MESSAGE */}
      {feedback && (
        <div style={{
          marginTop: '0.75rem',
          padding: isMobile ? '0.6rem' : '0.75rem',
          background: feedback.type === 'success' 
            ? 'rgba(16, 185, 129, 0.15)' 
            : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          color: feedback.type === 'success' ? '#10b981' : '#ef4444',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {feedback.type === 'success' ? (
            <Check size={16} strokeWidth={3} />
          ) : (
            <AlertCircle size={16} />
          )}
          {feedback.message}
        </div>
      )}

      {/* MESSAGE HISTORY TOGGLE */}
      <div style={{
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            width: '100%',
            padding: isMobile ? '0.6rem' : '0.75rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.2s',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          <span>Recent Messages</span>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* MESSAGE HISTORY */}
        {showHistory && (
          <div style={{
            marginTop: '0.75rem',
            maxHeight: '200px',
            overflowY: 'auto',
            animation: 'slideDown 0.3s ease-out'
          }}>
            {loadingHistory ? (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}>
                Loading...
              </div>
            ) : recentMessages.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}>
                No messages sent yet
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {recentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      padding: isMobile ? '0.6rem' : '0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px'
                    }}
                  >
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.8rem',
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginBottom: '0.3rem',
                      lineHeight: '1.4'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: isMobile ? '0.65rem' : '0.7rem',
                      color: 'rgba(255, 255, 255, 0.4)'
                    }}>
                      <span>
                        {new Date(msg.created_at).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {msg.read && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#10b981'
                        }}>
                          <Check size={12} />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS ANIMATIONS */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
