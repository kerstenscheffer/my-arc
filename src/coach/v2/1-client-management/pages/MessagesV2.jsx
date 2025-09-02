import { useState, useEffect } from 'react';
import { Send, MessageSquare, Clock, Check, User, Zap } from 'lucide-react';

export default function MessagesV2({ db, client, refreshData, isMobile }) {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Quick templates
  const templates = [
    { icon: '💪', text: 'Goed bezig deze week! Keep going!' },
    { icon: '🏋️', text: 'Vergeet je workout niet vandaag!' },
    { icon: '🥗', text: 'Check je nieuwe meal plan in de app' },
    { icon: '📊', text: 'Tijd voor je wekelijkse check-in!' },
    { icon: '🔥', text: 'Je bent on fire! Proud of you!' },
    { icon: '💯', text: 'Wauw, wat een progressie!' }
  ];

  useEffect(() => {
    if (client?.id) {
      loadHistory();
    }
  }, [client]);

  const loadHistory = async () => {
    if (!db?.supabase || !client?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await db.supabase
        .from('notifications')
        .select('*')
        .eq('client_id', client.id)
        .eq('type', 'message')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading message history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (messageText = null) => {
    const finalMessage = messageText || message.trim();
    
    if (!finalMessage || !client?.id) return;

    setIsSending(true);
    try {
      const { error } = await db.supabase
        .from('notifications')
        .insert({
          client_id: client.id,
          message: finalMessage,
          type: 'message',
          from_coach: true,
          title: 'Bericht van je coach',
          priority: 'normal',
          created_at: new Date().toISOString(),
          read: false,
          status: 'active'
        });

      if (error) throw error;

      // Clear message if not template
      if (!messageText) {
        setMessage('');
      }
      
      // Reload history
      await loadHistory();
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
      // Refresh parent data if provided
      if (refreshData) refreshData();
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateClick = (template) => {
    sendMessage(template.text);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, rgba(17, 17, 17, 0.98) 0%, rgba(26, 26, 26, 0.98) 100%)',
      borderRadius: isMobile ? '0' : '20px',
      overflow: 'hidden',
      border: '1px solid rgba(236, 72, 153, 0.2)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.1) 100%)',
        borderBottom: '1px solid rgba(236, 72, 153, 0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <MessageSquare size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: isMobile ? '1.1rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            margin: 0
          }}>
            Messages - {client?.first_name || 'Client'}
          </h3>
          <p style={{
            margin: 0,
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: isMobile ? '0.85rem' : '0.9rem'
          }}>
            Direct berichten naar client
          </p>
        </div>
      </div>

      {/* Message History */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '1rem' : '1.5rem',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.75rem',
        minHeight: '200px',
        maxHeight: isMobile ? '300px' : '400px'
      }}>
        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            Loading messages...
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          history.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.from_coach ? 'flex-end' : 'flex-start',
                animation: 'slideIn 0.3s ease'
              }}
            >
              <div style={{
                maxWidth: isMobile ? '85%' : '70%',
                padding: isMobile ? '0.75rem' : '1rem',
                borderRadius: '16px',
                background: msg.from_coach 
                  ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.15) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: msg.from_coach
                  ? '1px solid rgba(236, 72, 153, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  {msg.from_coach ? (
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#ec4899',
                      fontWeight: '600'
                    }}>Coach</span>
                  ) : (
                    <User size={14} style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                  )}
                  <span style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)'
                  }}>
                    {formatTime(msg.created_at)}
                  </span>
                  {msg.read && (
                    <Check size={14} style={{ color: '#10b981' }} />
                  )}
                </div>
                <p style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: isMobile ? '0.9rem' : '0.95rem',
                  lineHeight: '1.5'
                }}>
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Templates */}
      <div style={{
        padding: isMobile ? '0.75rem' : '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.5rem' : '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          WebkitOverflowScrolling: 'touch'
        }}>
          {templates.map((template, index) => (
            <button
              key={index}
              onClick={() => handleTemplateClick(template)}
              disabled={isSending}
              style={{
                padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1rem',
                borderRadius: '10px',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                background: 'rgba(236, 72, 153, 0.1)',
                color: '#fff',
                fontSize: isMobile ? '0.85rem' : '0.9rem',
                cursor: isSending ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexShrink: 0,
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                minHeight: '44px'
              }}
              onTouchStart={(e) => {
                if (isMobile && !isSending) {
                  e.currentTarget.style.transform = 'scale(0.98)';
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'rgba(236, 72, 153, 0.1)';
                }
              }}
            >
              <span>{template.icon}</span>
              <Zap size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Message Composer */}
      <div style={{
        padding: isMobile ? '1rem' : '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          alignItems: 'flex-end'
        }}>
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Type your message..."
              style={{
                width: '100%',
                minHeight: isMobile ? '60px' : '80px',
                maxHeight: '150px',
                padding: isMobile ? '0.75rem' : '1rem',
                paddingBottom: '2rem',
                borderRadius: '12px',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontSize: isMobile ? '0.95rem' : '1rem',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
            />
            <span style={{
              position: 'absolute',
              bottom: '0.5rem',
              right: '0.75rem',
              fontSize: '0.75rem',
              color: message.length > 450 ? '#ef4444' : 'rgba(255, 255, 255, 0.4)'
            }}>
              {message.length}/500
            </span>
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={isSending || !message.trim()}
            style={{
              width: isMobile ? '48px' : '56px',
              height: isMobile ? '48px' : '56px',
              borderRadius: '14px',
              border: 'none',
              background: isSending || !message.trim()
                ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                : 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSending || !message.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px',
              boxShadow: isSending || !message.trim() 
                ? 'none' 
                : '0 4px 15px rgba(236, 72, 153, 0.4)'
            }}
            onTouchStart={(e) => {
              if (isMobile && !isSending && message.trim()) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile) {
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isSending ? (
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            ) : (
              <Send size={isMobile ? 20 : 24} color="white" />
            )}
          </button>
        </div>
      </div>

      {/* Success Animation */}
      {showSuccess && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4)',
          animation: 'bounceIn 0.5s ease',
          zIndex: 1000
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <Check size={32} color="white" />
            <span style={{
              fontSize: '1.1rem',
              fontWeight: '600',
              color: 'white'
            }}>
              Message sent!
            </span>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
