import { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, Award, Utensils, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export default function NotificationWidget({ db, clientId, currentPage = 'all' }) {
  const isMobile = window.innerWidth <= 768;
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
    const iconProps = { size: 18, strokeWidth: 2 };
    switch(type) {
      case 'workout': return <TrendingUp {...iconProps} />;
      case 'meal': return <Utensils {...iconProps} />;
      case 'streak': return <Award {...iconProps} />;
      default: return <Sparkles {...iconProps} />;
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
      {/* Cleaner Floating Bell Button */}
      <button
        onClick={handleBellClick}
        style={{ 
          position: 'fixed',
          bottom: '100px',
          right: '0',
          zIndex: 997,
          width: isMobile ? '44px' : '48px',
          height: isMobile ? '44px' : '48px',
          background: hasUnread && isExpanded
            ? `linear-gradient(135deg, ${getPriorityColor(highestPriority)}20 0%, ${getPriorityColor(highestPriority)}10 100%)`
            : 'rgba(17, 17, 17, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: hasUnread && isExpanded
            ? `0.5px solid ${getPriorityColor(highestPriority)}40`
            : '0.5px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: hasUnread && isExpanded
            ? `0 4px 12px ${getPriorityColor(highestPriority)}20`
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: `translateX(${isMobile ? '8px' : '10px'})`,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          if (!isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(6px)';
            e.currentTarget.style.background = 'rgba(17, 17, 17, 0.85)';
            e.currentTarget.style.borderColor = hasUnread ? `${getPriorityColor(highestPriority)}30` : 'rgba(255, 255, 255, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(10px)';
            e.currentTarget.style.background = 'rgba(17, 17, 17, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
          }
        }}
        onTouchStart={(e) => {
          if (isMobile && !isExpanded) {
            e.currentTarget.style.transform = 'translateX(4px) scale(0.95)';
          }
        }}
        onTouchEnd={(e) => {
          if (isMobile) {
            e.currentTarget.style.transform = 'translateX(8px) scale(1)';
          }
        }}
        aria-label="Toggle notifications"
      >
        <Bell size={isMobile ? 18 : 20} color={hasUnread && isExpanded ? getPriorityColor(highestPriority) : 'rgba(255, 255, 255, 0.6)'} strokeWidth={2} />
        {hasUnread && (
          <span style={{
            position: 'absolute',
            top: '-2px',
            left: '-2px',
            background: '#ef4444',
            color: '#fff',
            fontSize: '0.6rem',
            fontWeight: '700',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(0, 0, 0, 0.3)',
            boxShadow: '0 1px 4px rgba(239, 68, 68, 0.5)'
          }}>
            {notifications.filter(n => n.status === 'active').length < 10 
              ? notifications.filter(n => n.status === 'active').length 
              : '•'}
          </span>
        )}
      </button>

      {/* Cleaner Notification Panel */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          bottom: '160px',
          right: '20px',
          width: '90%',
          maxWidth: '380px',
          maxHeight: '60vh',
          background: 'rgba(17, 17, 17, 0.95)',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '0.5px solid rgba(255, 255, 255, 0.08)',
          animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Cleaner Header */}
          <div style={{
            padding: isMobile ? '1rem' : '1.25rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <img 
                src={coachAvatar}
                alt={coachName}
                style={{
                  width: isMobile ? '36px' : '40px',
                  height: isMobile ? '36px' : '40px',
                  borderRadius: '12px',
                  border: '0.5px solid rgba(255, 255, 255, 0.1)',
                  objectFit: 'cover'
                }}
              />
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  {coachName}
                  <Sparkles size={14} style={{ color: 'rgba(139, 92, 246, 0.6)' }} />
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  {notifications.filter(n => n.status === 'active').length} nieuwe berichten
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '0.5px solid rgba(255, 255, 255, 0.08)',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <X size={16} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
            </button>
          </div>

          {/* Auto-hide timer indicator - Subtler */}
          <div style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.05)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              background: 'rgba(139, 92, 246, 0.3)',
              animation: 'timerShrink 10s linear',
              transformOrigin: 'left'
            }} />
          </div>

          {/* Notifications List - Cleaner */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '0.75rem' : '1rem'
          }}>
            {isLoading ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem',
                color: 'rgba(255, 255, 255, 0.4)'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: '2px solid rgba(255, 255, 255, 0.1)',
                  borderTopColor: 'rgba(139, 92, 246, 0.5)',
                  borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 1s linear infinite'
                }} />
              </div>
            ) : notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                <Bell size={32} style={{ color: 'rgba(255, 255, 255, 0.15)', margin: '0 auto 0.75rem' }} />
                <p style={{ color: 'rgba(255, 255, 255, 0.4)', margin: 0, fontSize: isMobile ? '0.8rem' : '0.85rem' }}>
                  Geen nieuwe berichten
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.5rem' : '0.75rem' }}>
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    onClick={() => notification.status === 'active' && handleMarkAsRead(notification.id)}
                    style={{
                      padding: isMobile ? '0.875rem' : '1rem',
                      borderRadius: '12px',
                      background: notification.priority === 'urgent'
                        ? 'rgba(239, 68, 68, 0.08)'
                        : notification.priority === 'high'
                        ? 'rgba(245, 158, 11, 0.08)'
                        : 'rgba(0, 0, 0, 0.3)',
                      border: `0.5px solid ${
                        notification.priority === 'urgent'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : notification.priority === 'high'
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(255, 255, 255, 0.05)'
                      }`,
                      backdropFilter: 'blur(8px)',
                      cursor: notification.status === 'active' ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      opacity: notification.status === 'read' ? 0.5 : 1,
                      animation: `slideInRight 0.3s ease ${index * 0.05}s both`,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (notification.status === 'active' && !isMobile) {
                        e.currentTarget.style.transform = 'translateX(-2px)';
                        e.currentTarget.style.background = 
                          notification.priority === 'urgent'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : notification.priority === 'high'
                            ? 'rgba(245, 158, 11, 0.1)'
                            : 'rgba(0, 0, 0, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = 
                          notification.priority === 'urgent'
                            ? 'rgba(239, 68, 68, 0.08)'
                            : notification.priority === 'high'
                            ? 'rgba(245, 158, 11, 0.08)'
                            : 'rgba(0, 0, 0, 0.3)';
                      }
                    }}
                  >
                    {/* Priority indicator line - Subtler */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: getPriorityColor(notification.priority),
                      opacity: 0.5,
                      borderRadius: '2px'
                    }} />

                    <div style={{ 
                      display: 'flex', 
                      gap: isMobile ? '0.75rem' : '1rem', 
                      alignItems: 'flex-start',
                      paddingLeft: '0.5rem'
                    }}>
                      <div style={{
                        width: isMobile ? '32px' : '36px',
                        height: isMobile ? '32px' : '36px',
                        borderRadius: '10px',
                        background: `linear-gradient(135deg, ${getPriorityColor(notification.priority)}15 0%, ${getPriorityColor(notification.priority)}08 100%)`,
                        border: `0.5px solid ${getPriorityColor(notification.priority)}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: getPriorityColor(notification.priority)
                      }}>
                        {getIcon(notification.type)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: '0 0 0.25rem 0',
                          fontSize: isMobile ? '0.85rem' : '0.9rem',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.9)'
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: isMobile ? '0.75rem' : '0.8rem',
                          color: 'rgba(255, 255, 255, 0.6)',
                          lineHeight: '1.4'
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
                              padding: '0.15rem 0.5rem',
                              borderRadius: '8px',
                              background: 'rgba(139, 92, 246, 0.1)',
                              color: 'rgba(139, 92, 246, 0.8)',
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              fontWeight: '600',
                              border: '0.5px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              AI Insight
                            </span>
                          )}
                          {notification.status === 'read' && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: isMobile ? '0.65rem' : '0.7rem',
                              color: 'rgba(255, 255, 255, 0.4)'
                            }}>
                              <CheckCircle size={12} />
                              Gelezen
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(e, notification.id)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          opacity: 0.5
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.opacity = '0.5';
                          }
                        }}
                      >
                        <X size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
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
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(20px);
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
            transform: translateX(20px);
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
