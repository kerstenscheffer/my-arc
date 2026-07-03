import { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, Award, Utensils, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';

export default function NotificationWidget({ db, clientId, currentPage = 'all', open: openProp, onOpenChange, onCountChange }) {
  const isMobile = window.innerWidth <= 768;
  const controlled = typeof openProp === 'boolean' && typeof onOpenChange === 'function'
  const [notifications, setNotifications] = useState([]);
  const [isExpandedInternal, setIsExpandedInternal] = useState(false);
  const isExpanded = controlled ? openProp : isExpandedInternal;
  const setIsExpanded = (val) => {
    const next = typeof val === 'function' ? val(isExpanded) : val
    if (controlled) onOpenChange(next); else setIsExpandedInternal(next)
  };
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
      case 'high':   return '#f59e0b';
      case 'normal': return '#FFD700';
      default:       return 'rgba(255,255,255,0.45)';
    }
  };

  const handleBellClick = () => {
    setIsExpanded(!isExpanded);
    
    // Reset auto-hide timer
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
    }
  };

  // Live count voor sidebar-badge — hook moet vóór de early return staan.
  useEffect(() => {
    if (typeof onCountChange === 'function') {
      const active = notifications.filter(n => n.status === 'active').length
      onCountChange(active)
    }
  }, [notifications, onCountChange])

  if (!db?.notifications || !clientId) return null;

  // Get highest priority for bell color
  const highestPriority = notifications.reduce((highest, n) => {
    if (n.status !== 'active') return highest;
    const priorities = { 'urgent': 4, 'high': 3, 'normal': 2, 'low': 1 };
    return priorities[n.priority] > priorities[highest] ? n.priority : highest;
  }, 'normal');

  return (
    <>
      {/* Cleaner Floating Bell Button — alleen tonen in uncontrolled mode */}
      {!controlled && <button
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
      </button>}

      {/* Notification Panel — gouden styling */}
      {isExpanded && (
        <div style={{
          position: 'fixed',
          bottom: '160px',
          right: '20px',
          width: '90%',
          maxWidth: '400px',
          maxHeight: '60vh',
          background: '#0a0a0a',
          borderRadius: 18,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,215,0,0.08)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,215,0,0.22)',
          animation: 'slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Gouden accent-strip bovenaan */}
          <div style={{
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.7) 50%, transparent 100%)',
          }} />

          {/* Header — goud */}
          <div style={{
            padding: isMobile ? '1rem 1.1rem' : '1.15rem 1.3rem',
            background: 'rgba(255,215,0,0.04)',
            borderBottom: '1px solid rgba(255,215,0,0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              minWidth: 0, flex: 1,
            }}>
              <img
                src={coachAvatar}
                alt={coachName}
                style={{
                  width: isMobile ? 38 : 42,
                  height: isMobile ? 38 : 42,
                  borderRadius: '50%',
                  border: '2px solid rgba(255,215,0,0.45)',
                  objectFit: 'cover',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(255,215,0,0.2)',
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '0.58rem', fontWeight: 800, color: '#FFD700',
                  textTransform: 'uppercase', letterSpacing: '0.12em',
                  opacity: 0.85, marginBottom: 2,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Bell size={10} strokeWidth={2.6} /> Meldingen
                </div>
                <div style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 900, color: '#fff',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {coachName}
                </div>
                <div style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: 1,
                }}>
                  {notifications.filter(n => n.status === 'active').length} actie{notifications.filter(n => n.status === 'active').length === 1 ? '' : 'f'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              aria-label="Sluiten"
              style={{
                width: 34, height: 34,
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
              }}
            >
              <X size={15} strokeWidth={2.4} />
            </button>
          </div>

          {/* Auto-hide timer indicator — goud */}
          <div style={{
            height: 2,
            background: 'rgba(255,255,255,0.04)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              background: 'linear-gradient(90deg, rgba(255,215,0,0.7) 0%, rgba(212,175,55,0.5) 100%)',
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.65rem' : '0.85rem' }}>
                {notifications.map((notification, index) => {
                  const pc = getPriorityColor(notification.priority);
                  const isActive = notification.status === 'active';
                  return (
                  <div
                    key={notification.id}
                    id={`notification-${notification.id}`}
                    onClick={() => isActive && handleMarkAsRead(notification.id)}
                    style={{
                      padding: isMobile ? '0.9rem 0.95rem' : '1rem 1.1rem',
                      paddingLeft: isMobile ? '1.05rem' : '1.2rem',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${pc}30`,
                      borderLeft: `3px solid ${pc}`,
                      cursor: isActive ? 'pointer' : 'default',
                      transition: 'all 0.2s ease',
                      opacity: notification.status === 'read' ? 0.55 : 1,
                      animation: `slideInRight 0.3s ease ${index * 0.05}s both`,
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (isActive && !isMobile) {
                        e.currentTarget.style.transform = 'translateX(-2px)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = `${pc}60`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isMobile) {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        e.currentTarget.style.borderColor = `${pc}30`;
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      gap: isMobile ? '0.7rem' : '0.85rem',
                      alignItems: 'flex-start',
                    }}>
                      <div style={{
                        width: isMobile ? 36 : 40,
                        height: isMobile ? 36 : 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${pc}22 0%, ${pc}0a 100%)`,
                        border: `1px solid ${pc}55`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: pc,
                        boxShadow: isActive ? `0 0 12px ${pc}30` : 'none',
                      }}>
                        {getIcon(notification.type)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                          margin: '0 0 0.3rem 0',
                          fontSize: isMobile ? '0.95rem' : '1rem',
                          fontWeight: 900,
                          color: '#fff',
                          letterSpacing: '-0.015em',
                          lineHeight: 1.25,
                        }}>
                          {notification.title}
                        </h4>
                        <p style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: isMobile ? '0.82rem' : '0.88rem',
                          color: 'rgba(255, 255, 255, 0.75)',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}>
                          {notification.message}
                        </p>

                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          flexWrap: 'wrap'
                        }}>
                          {(notification.priority === 'urgent' || notification.priority === 'high') && (
                            <span style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: 6,
                              background: `${pc}1a`,
                              border: `1px solid ${pc}55`,
                              color: pc,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}>
                              {notification.priority === 'urgent' ? 'Urgent' : 'Belangrijk'}
                            </span>
                          )}
                          {notification.source === 'smart' && (
                            <span style={{
                              padding: '0.15rem 0.55rem',
                              borderRadius: 6,
                              background: 'rgba(255,215,0,0.1)',
                              color: '#FFD700',
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              border: '1px solid rgba(255,215,0,0.3)',
                              textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>
                              AI Insight
                            </span>
                          )}
                          {notification.status === 'read' && (
                            <span style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.65rem',
                              color: 'rgba(255, 255, 255, 0.4)',
                              fontWeight: 700,
                            }}>
                              <CheckCircle size={11} strokeWidth={2.4} />
                              Gelezen
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDismiss(e, notification.id)}
                        aria-label="Wegklikken"
                        style={{
                          width: 28, height: 28,
                          borderRadius: 7,
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.2s ease',
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}
                        onMouseEnter={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                            e.currentTarget.style.color = '#fff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isMobile) {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                          }
                        }}
                      >
                        <X size={13} strokeWidth={2.4} />
                      </button>
                    </div>
                  </div>
                  );
                })}
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
