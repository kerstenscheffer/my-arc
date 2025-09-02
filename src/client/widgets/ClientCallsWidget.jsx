import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, Calendar, Clock, ChevronRight, Sparkles, 
  Trophy, Lock, CheckCircle, Video, ArrowRight, Rocket,
  Coffee, Target, Activity, TrendingUp, Star, Flame
} from 'lucide-react';
import CallPlanningService from "../../modules/call-planning/CallPlanningService";

// Helper hook for mobile detection

// Call Type Configuration - Blauwe variaties
const callTypeConfig = {
  1: {
    name: 'Kennismaking',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
    icon: Coffee,
    color: '#3b82f6'
  },
  2: {
    name: 'Plan Pitch',
    gradient: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    icon: Target,
    color: '#10b981'
  },
  3: {
    name: 'Check-in',
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
    icon: Activity,
    color: '#0ea5e9'
  },
  4: {
    name: 'Halfway',
    gradient: 'linear-gradient(135deg, #312e81 0%, #3730a3 100%)',
    icon: TrendingUp,
    color: '#6366f1'
  },
  5: {
    name: 'Final Sprint',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
    icon: Rocket,
    color: '#64748b'
  },
  6: {
    name: 'Celebration',
    gradient: 'linear-gradient(135deg, #172554 0%, #1e3a8a 100%)',
    icon: Trophy,
    color: '#3b82f6'
  }
};

export default function ClientCallsWidget({ client, onNavigate }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextCall, setNextCall] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [hasMultipleCalls, setHasMultipleCalls] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadCallData();
  }, [client]);

  const loadCallData = async () => {
    if (!client?.id) return;
    
    try {
      setLoading(true);
      
      const plansData = await CallPlanningService.getClientPlans(client.id);
      
      if (plansData && plansData.length > 0) {
        const activePlan = plansData.find(p => p.status === 'active') || plansData[0];
        
        if (activePlan.client_calls) {
          let callsData = activePlan.client_calls;
          
          // Process call statuses
          callsData = callsData.map((call, index) => {
            if (call.call_number === 1 && call.status === 'locked') {
              return { ...call, status: 'available' };
            }
            
            if (call.call_number > 1 && call.status === 'locked') {
              const previousCall = callsData.find(c => c.call_number === call.call_number - 1);
              if (previousCall && previousCall.status === 'completed') {
                return { ...call, status: 'available' };
              }
            }
            
            return call;
          });
          
          setCalls(callsData);
          setTotalCalls(callsData.length);
          
          // Find next available or scheduled call
          const next = callsData.find(c => c.status === 'available' || c.status === 'scheduled');
          setNextCall(next);
          
          // Count completed
          const completed = callsData.filter(c => c.status === 'completed').length;
          setCompletedCount(completed);
          
          // Check if there are multiple uncompleted calls
          const uncompleted = callsData.filter(c => c.status !== 'completed' && c.status !== 'locked');
          setHasMultipleCalls(uncompleted.length > 1);
        }
      }
    } catch (error) {
      console.error('Error loading calls for widget:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilCall = (scheduledDate) => {
    if (!scheduledDate) return null;
    const scheduled = new Date(scheduledDate);
    const today = new Date();
    const diff = Math.ceil((scheduled - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const calculateProgress = () => {
    if (totalCalls === 0) return 0;
    return Math.round((completedCount / totalCalls) * 100);
  };

  const handleNavigateToCalls = () => {
    if (onNavigate) {
      onNavigate('calls');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(30, 64, 175, 0.05) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(59, 130, 246, 0.1)',
        backdropFilter: 'blur(10px)',
        height: isMobile ? '120px' : '140px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(59, 130, 246, 0.15)',
          borderTopColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  // No calls state - Stimulate to book
  if (!nextCall && completedCount === 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.15) 0%, rgba(30, 64, 175, 0.1) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(59, 130, 246, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={handleNavigateToCalls}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '0.75rem' : '1rem',
            marginBottom: isMobile ? '0.5rem' : '0.75rem'
          }}>
            <div style={{
              width: isMobile ? '40px' : '44px',
              height: isMobile ? '40px' : '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.25)',
              flexShrink: 0
            }}>
              <Sparkles size={isMobile ? 18 : 20} color="#fff" />
            </div>
            <div>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0
              }}>
                Start Je Coaching Journey!
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.75rem' : '0.8rem',
                margin: 0
              }}>
                Plan je eerste call en begin
              </p>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'rgba(59, 130, 246, 0.9)',
            fontWeight: '600',
            fontSize: isMobile ? '0.8rem' : '0.85rem'
          }}>
            <span>Klik om te beginnen</span>
            <ArrowRight size={14} style={{ animation: 'slideRight 1s infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  // All calls completed state
  if (completedCount === totalCalls && totalCalls > 0) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(14, 165, 233, 0.1) 50%, rgba(6, 182, 212, 0.05) 100%)',
        borderRadius: '16px',
        padding: isMobile ? '1rem' : '1.25rem',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(10px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
      onClick={handleNavigateToCalls}
      onTouchStart={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.5rem' : '0.75rem',
              marginBottom: isMobile ? '0.5rem' : '0.75rem'
            }}>
              <div style={{
                width: isMobile ? '36px' : '40px',
                height: isMobile ? '36px' : '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(14, 165, 233, 0.9) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
              }}>
                <Trophy size={isMobile ? 18 : 20} color="#fff" />
              </div>
              <div>
                <h3 style={{
                  fontSize: isMobile ? '0.95rem' : '1rem',
                  fontWeight: '700',
                  color: 'rgba(255, 255, 255, 0.95)',
                  margin: 0
                }}>
                  Journey Compleet! 🎉
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  margin: 0
                }}>
                  Alle {totalCalls} calls voltooid
                </p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'rgba(59, 130, 246, 0.9)',
              fontWeight: '600',
              fontSize: isMobile ? '0.8rem' : '0.85rem'
            }}>
              <span>Bekijk prestaties</span>
              <ChevronRight size={14} />
            </div>
          </div>

          <div style={{
            fontSize: isMobile ? '1.75rem' : '2rem',
            animation: 'bounce 2s infinite'
          }}>
            🏆
          </div>
        </div>
      </div>
    );
  }

  // Main widget - Show next call (COMPACT VERSION)
  const config = nextCall ? callTypeConfig[nextCall.call_number] || callTypeConfig[1] : null;
  const IconComponent = config?.icon || PhoneCall;

  return (
    <div style={{
      background: nextCall?.status === 'scheduled'
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.08) 50%, rgba(29, 78, 216, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(30, 58, 138, 0.1) 0%, rgba(30, 64, 175, 0.05) 100%)',
      borderRadius: '16px',
      padding: isMobile ? '1rem' : '1.25rem',
      border: nextCall?.status === 'scheduled'
        ? '1px solid rgba(59, 130, 246, 0.2)'
        : '1px solid rgba(59, 130, 246, 0.08)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: nextCall?.status === 'scheduled'
        ? '0 20px 40px rgba(59, 130, 246, 0.15)'
        : '0 10px 30px rgba(0, 0, 0, 0.15)',
      backdropFilter: 'blur(10px)',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
    onClick={handleNavigateToCalls}
    onTouchStart={(e) => {
      if (isMobile) {
        e.currentTarget.style.transform = 'scale(0.98)';
      }
    }}
    onTouchEnd={(e) => {
      if (isMobile) {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header with progress dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMobile ? '0.75rem' : '1rem'
        }}>
          <div style={{
            color: 'rgba(148, 163, 184, 0.8)',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {nextCall?.status === 'scheduled' ? 'VOLGENDE CALL' : 'BESCHIKBAAR'}
          </div>

          {/* Progress dots */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem'
          }}>
            {calls.slice(0, 6).map((call, idx) => (
              <div
                key={idx}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: call.status === 'completed'
                    ? 'rgba(16, 185, 129, 0.8)'
                    : call.status === 'scheduled'
                    ? 'rgba(59, 130, 246, 0.8)'
                    : 'rgba(148, 163, 184, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Main content - Compact Layout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '0.75rem' : '1rem'
        }}>
          {/* Call icon - Smaller */}
          <div style={{
            width: isMobile ? '44px' : '48px',
            height: isMobile ? '44px' : '48px',
            borderRadius: '12px',
            background: nextCall?.status === 'scheduled'
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(71, 85, 105, 0.4) 0%, rgba(51, 65, 85, 0.6) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            flexShrink: 0
          }}>
            <Clock size={isMobile ? 18 : 20} color="#fff" />
            {nextCall?.status === 'available' && (
              <div style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '10px',
                height: '10px',
                background: 'rgba(16, 185, 129, 0.9)',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
                border: '2px solid rgba(15, 23, 42, 0.9)'
              }} />
            )}
          </div>

          {/* Call info - Compact */}
          <div style={{ flex: 1 }}>
            {/* Title with clock icon */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginBottom: isMobile ? '0.35rem' : '0.5rem'
            }}>
              <Clock size={isMobile ? 14 : 15} color="rgba(148, 163, 184, 0.8)" />
              <h3 style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: '700',
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                lineHeight: 1
              }}>
                Call #{nextCall?.call_number} - {config?.name}
              </h3>
            </div>

            {nextCall?.status === 'scheduled' && nextCall.scheduled_date ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.5rem' : '0.75rem',
                flexWrap: 'wrap'
              }}>
                {/* Date display - Compact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'rgba(148, 163, 184, 0.9)',
                  fontSize: isMobile ? '0.75rem' : '0.8rem'
                }}>
                  <Calendar size={12} />
                  <span>
                    {new Date(nextCall.scheduled_date).toLocaleDateString('nl-NL', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                {/* Days badge */}
                {getDaysUntilCall(nextCall.scheduled_date) >= 0 && (
                  <span style={{
                    padding: isMobile ? '0.1rem 0.35rem' : '0.15rem 0.5rem',
                    background: 'rgba(59, 130, 246, 0.15)',
                    borderRadius: '8px',
                    fontSize: isMobile ? '0.65rem' : '0.7rem',
                    color: 'rgba(147, 197, 253, 0.95)',
                    fontWeight: '600',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}>
                    {getDaysUntilCall(nextCall.scheduled_date) === 0 ? 'Vandaag' : 
                     getDaysUntilCall(nextCall.scheduled_date) === 1 ? 'Morgen' :
                     `${getDaysUntilCall(nextCall.scheduled_date)} dagen`}
                  </span>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: 'rgba(147, 197, 253, 0.9)',
                fontWeight: '600',
                fontSize: isMobile ? '0.8rem' : '0.85rem'
              }}>
                <Sparkles size={12} />
                <span>Klik om te plannen</span>
                <ArrowRight size={12} style={{ animation: 'slideRight 1s infinite' }} />
              </div>
            )}
          </div>
        </div>

        {/* Zoom button - Below content on mobile */}
        {nextCall?.status === 'scheduled' && nextCall.zoom_link && (
          <a
            href={nextCall.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: isMobile ? '0.75rem' : '1rem',
              padding: isMobile ? '0.5rem' : '0.6rem 1rem',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '700',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              width: '100%'
            }}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Video size={14} />
            Join Zoom
          </a>
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        
        @keyframes slideRight {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-8px); }
          75% { transform: translateY(4px); }
        }
      `}</style>
    </div>
  );
}
