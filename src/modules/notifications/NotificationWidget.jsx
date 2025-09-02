import { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, Award, Utensils, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export default function NotificationWidget({ db, clientId, currentPage = 'all' }) {
  const [notifications, setNotifications] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState(null);

  // Coach info
  const coachAvatar = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production//sites/2148693122/images/170b127d-0cd9-41bf-9ddf-a83c82dcba2e.jpeg';
  const coachName = 'Coach Kersten';

  useEffect(() => {
    if (clientId && db?.notifications) {
      loadNotifications();
      
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [clientId, currentPage, db]);

  // Auto-hide effect
  useEffect(() => {
    if (isExpanded) {
      // Clear existing timer
      if (autoHideTimer) {
        clearTimeout(autoHideTimer);
      }
      
      // Set new timer for auto-hide (10 seconds)
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 10000);
      
      setAutoHideTimer(timer);
      
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [isExpanded]);

  const loadNotifications = async () => {
    if (!db?.notifications) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await db.notifications.getActiveNotifications(clientId, currentPage);
      
      if (data) {
        setNotifications(data);
        const unreadCount = data.filter(n => n.status === 'active').length;
        setHasUnread(unreadCount > 0);
        
        // Auto-show for high priority with animation
        if (data.some(n => (n.priority === 'high' || n.priority === 'urgent') && n.status === 'active')) {
          setTimeout(() => setIsExpanded(true), 500);
        }
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (e, notificationId) => {
    e.stopPropagation();
    
    // Fade out animation
    const element = document.getElementById(`notification-${notificationId}`);
    if (element) {
      element.style.animation = 'fadeOutRight 0.3s ease';
      setTimeout(async () => {
        await db.notifications.dismissNotification(notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }, 300);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    await db.notifications.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? {...n, status: 'read'} : n)
    );
    loadNotifications();
  };

  const getIcon = (type) => {
    const iconProps = { size: 20 };
    switch(type) {
      case 'workout': return <TrendingUp {...iconProps} />;
      case 'meal': return <Utensils {...iconProps} />;
      case 'streak': return <Award {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
    }
  };

  const getPriorityGradient = (priority) => {
    switch(priority) {
      case 'urgent':
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)';
      case 'high':
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)';
      case 'normal':
        return 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(107, 114, 128, 0.15) 0%, rgba(107, 114, 128, 0.05) 100%)';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getPriorityBorder = (priority) => {
    switch(priority) {
      case 'urgent': return '2px solid rgba(239, 68, 68, 0.3)';
      case 'high': return '2px solid rgba(245, 158, 11, 0.3)';
      case 'normal': return '2px solid rgba(139, 92, 246, 0.3)';
      default: return '2px solid rgba(107, 114, 128, 0.3)';
    }
  };

  const handleBellClick = () => {
    setIsExpanded(!isExpanded);
    
    // Reset auto-hide timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  };

  if (!db?.notifications || !clientId) return null;

  // Get highest priority for bell color
  const highestPriority = notifications.reduce((highest, n) => {
    if (n.status !== 'active') return highest;
    const priorities = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
    return priorities[n.priority] > priorities[highest] ? n.priority : highest;
  }, 'normal');

  return (
    <>
      {/* Floating Bell Button */}
      <button
        onClick={handleBellClick}
        style={{ 
          position: 'fixed',
          bottom: '100px',
          right: '20px', 
          zIndex: 9999,
          width: '60px',
          height: '60px',
          background: hasUnread 
            ? `linear-gradient(135deg, ${getPriorityColor(highestPriority)} 0%, ${getPriorityColor(highestPriority)}CC 100%)`
            : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          border: 'none',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          boxShadow: hasUnread 
            ? `0 10px 30px ${getPriorityColor(highestPriority)}66`
            : '0 10px 30px rgba(0,0,0,0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          animation: hasUnread ? 'bellPulse 2s infinite' : 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
          e.currentTarget.style.boxShadow = `0 15px 40px ${getPriorityColor(highestPriority)}88`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = hasUnread 
            ? `0 10px 30px ${getPriorityColor(highestPriority)}66`
            : '0 10px 30px rgba(0,0,0,0.3)';
        }}
        aria-label="Toggle notifications"
      >
        <Bell size={26} style={{ color: 'white' }} />
        {hasUnread && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #1a1a1a',
            animation: 'badgeBounce 0.5s ease'
          }}>
            {notifications.filter(n => n.status === 'active').length}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          bottom: '180px',
          right: '20px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '70vh',
          background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.9) 100%)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'slideInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}>
          {/* Header with coach info */}
          <div style={{
            padding: '1.5rem',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <img 
                src={coachAvatar}
                alt={coachName}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '16px',
                  border: '2px solid rgba(139, 92, 246, 0.5)',
                  objectFit: 'cover'
                }}
              />
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {coachName}
                  <Sparkles size={16} style={{ color: '#8b5cf6' }} />
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  {notifications.filter(n => n.status === 'active').length} nieuwe berichten
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <X size={20} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            </button>
          </div>

          {/* Auto-hide timer indicator */}
          <div style={{
            height: '2px',
            background: 'rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
              animation: 'timerShrink 10s linear'
            }} />
          </div>

          {/* Notifications List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem'
          }}>
            {isLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid rgba(139, 92, 246, 0.2)',
                  borderTopColor: '#8b5cf6',
                  borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem'
              }}>
                <Bell size={48} style={{ color: 'rgba(255, 255, 255, 0.2)', margin: '0 auto 1rem' }} />
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  Geen nieuwe berichten
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    onClick={() => notification.status === 'active' && handleMarkAsRead(notification.id)}
                    style={{
                      padding: '1rem',
                      borderRadius: '16px',
                      background: getPriorityGradient(notification.priority),
                      border: getPriorityBorder(notification.priority),
                      backdropFilter: 'blur(10px)',
                      cursor: notification.status === 'active' ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      opacity: notification.status === 'read' ? 0.6 : 1,
                      animation: `slideInRight 0.4s ease ${index * 0.1}s both`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (notification.status === 'active') {
                        e.currentTarget.style.transform = 'translateX(-4px)';
                        e.currentTarget.style.boxShadow = `0 8px 20px ${getPriorityColor(notification.priority)}33`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Priority indicator line */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '3px',
                      background: getPriorityColor(notification.priority),
                      borderRadius: '3px'
                    }} />

                    <div style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'flex-start',
                      paddingLeft: '0.5rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${getPriorityColor(notification.priority)} 0%, ${getPriorityColor(notification.priority)}CC 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${getPriorityColor(notification.priority)}44`
                      }}>
                        {getIcon(notification.type)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: '0 0 0.25rem 0',
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#fff'
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          margin: '0 0 0.75rem 0',
                          fontSize: '0.875rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          lineHeight: '1.5'
                        }}>
                          {notification.message}
                        </p>
                        
                        <div style={{ 
                          display: 'flex', 
                          gap: '0.5rem', 
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {notification.source === 'smart' && (
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                              color: '#8b5cf6',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              border: '1px solid rgba(139, 92, 246, 0.3)'
                            }}>
                              AI Insight
                            </span>
                          )}
                          {notification.status === 'read' && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                              <CheckCircle size={14} />
                              Gelezen
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(e, notification.id)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '10px',
                          border: 'none',
                          background: 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                      >
                        <X size={16} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes bellPulse {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.05);
          }
        }

        @keyframes badgeBounce {
          0% { 
            transform: scale(0);
          }
          50% { 
            transform: scale(1.2);
          }
          100% { 
            transform: scale(1);
          }
        }

        @keyframes slideInUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(50px);
            opacity: 0;
          }
        }

        @keyframes spin {
          to { 
            transform: rotate(360deg);
          }
        }

        @keyframes timerShrink {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </>
  );
}
