import useIsMobile from '../../../hooks/useIsMobile'
import React from 'react';
import { Calendar, Clock, CheckCircle, Lock, Star, Gift } from 'lucide-react';

export default function CallCard({ call, index, handleBookCall }) {
  const isMobile = useIsMobile();
  
  // Check if this is a bonus call
  const isBonusCall = call.call_number === 99;
  
  // Gebruik de juiste titel voor bonus calls
  const displayTitle = isBonusCall 
    ? 'Bonus Call' 
    : (call.call_title || `Call ${call.call_number}`);
    
  // Gebruik client_subject voor bonus calls, anders standaard onderwerp
  const displaySubject = isBonusCall && call.client_subject
    ? call.client_subject
    : (call.client_subject || call.coach_subject || 'Coaching sessie');
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#10b981';      // Green (success)
      case 'scheduled': return '#2563eb';       // Blue (primary)
      case 'available': return '#f97316';       // Orange (warning/important)
      case 'locked': return '#6b7280';          // Gray (disabled)
      default: return '#6b7280';
    }
  };
  
  const getStatusBg = (status) => {
    switch(status) {
      case 'completed': return 'rgba(16, 185, 129, 0.12)';
      case 'scheduled': return 'rgba(37, 99, 235, 0.15)';
      case 'available': return 'rgba(249, 115, 22, 0.12)';
      case 'locked': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };
  
  const getStatusBorder = (status) => {
    switch(status) {
      case 'completed': return 'rgba(16, 185, 129, 0.25)';
      case 'scheduled': return 'rgba(37, 99, 235, 0.3)';
      case 'available': return 'rgba(249, 115, 22, 0.25)';
      case 'locked': return 'rgba(107, 114, 128, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return CheckCircle;
      case 'scheduled': return Calendar;
      case 'available': return Clock;
      case 'locked': return Lock;
      default: return Lock;
    }
  };
  
  const StatusIcon = getStatusIcon(call.status);
  const canBook = call.status === 'available' || call.status === 'scheduled';
  
  return (
    <div
      className={`call-card-${index}`}
      style={{
        position: 'relative',
        background: isBonusCall
          ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.06) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(23, 23, 23, 0.8) 100%)',
        backdropFilter: 'blur(12px)',
        border: isBonusCall
          ? '1px solid rgba(168, 85, 247, 0.3)'
          : '1px solid rgba(37, 99, 235, 0.25)',
        borderRadius: isMobile ? '12px' : '14px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: canBook ? 'pointer' : 'default',
        animation: `slideInUp ${400 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        opacity: 0,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isBonusCall
          ? '0 4px 16px rgba(168, 85, 247, 0.15)'
          : '0 4px 16px rgba(37, 99, 235, 0.15)',
        minHeight: isMobile ? '200px' : '220px',
        transform: 'translateZ(0)'
      }}
      onClick={() => canBook && handleBookCall(call)}
      onTouchStart={(e) => {
        if (isMobile && canBook) {
          e.currentTarget.style.transform = 'scale(0.98)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 2px 12px rgba(168, 85, 247, 0.2)'
            : '0 2px 12px rgba(37, 99, 235, 0.2)';
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile && canBook) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 4px 16px rgba(168, 85, 247, 0.15)'
            : '0 4px 16px rgba(37, 99, 235, 0.15)';
        }
      }}
      onMouseEnter={(e) => {
        if (!isMobile && canBook) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 8px 32px rgba(168, 85, 247, 0.25)'
            : '0 8px 32px rgba(37, 99, 235, 0.25)';
          e.currentTarget.style.borderColor = isBonusCall
            ? 'rgba(168, 85, 247, 0.4)'
            : 'rgba(37, 99, 235, 0.35)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 4px 16px rgba(168, 85, 247, 0.15)'
            : '0 4px 16px rgba(37, 99, 235, 0.15)';
          e.currentTarget.style.borderColor = isBonusCall
            ? 'rgba(168, 85, 247, 0.3)'
            : 'rgba(37, 99, 235, 0.25)';
        }
      }}
    >
      {/* Top Accent Glow Line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: isBonusCall
          ? 'linear-gradient(90deg, transparent 0%, #a855f7 50%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, #2563eb 50%, transparent 100%)',
        opacity: 0.6,
        zIndex: 10
      }} />

      {/* Bonus Call Badge */}
      {isBonusCall && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '1.25rem',
          right: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.12) 100%)',
          padding: isMobile ? '0.375rem 0.625rem' : '0.4rem 0.75rem',
          borderRadius: isMobile ? '18px' : '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 4px 12px rgba(168, 85, 247, 0.15)',
          minHeight: '28px',
          backdropFilter: 'blur(8px)'
        }}>
          <Gift size={isMobile ? 14 : 16} style={{ color: '#a855f7' }} />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '800',
            color: '#a855f7',
            letterSpacing: '0.06em'
          }}>
            BONUS
          </span>
        </div>
      )}
      
      {/* Decorative gradient orbs */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '-50px',
        width: isMobile ? '120px' : '150px',
        height: isMobile ? '120px' : '150px',
        borderRadius: '50%',
        background: isBonusCall
          ? 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {!isBonusCall && (
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: isMobile ? '100px' : '120px',
          height: isMobile ? '100px' : '120px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Call Number or Bonus Icon */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: isMobile ? '48px' : '54px',
          height: isMobile ? '48px' : '54px',
          borderRadius: isMobile ? '12px' : '14px',
          background: isBonusCall 
            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.25rem' : '1.4rem',
          fontWeight: '800',
          color: isBonusCall ? '#a855f7' : '#3b82f6',
          boxShadow: isBonusCall 
            ? '0 4px 12px rgba(168, 85, 247, 0.2)'
            : '0 4px 12px rgba(37, 99, 235, 0.2)',
          border: isBonusCall
            ? '1px solid rgba(168, 85, 247, 0.3)'
            : '1px solid rgba(37, 99, 235, 0.25)',
          minWidth: '48px',
          minHeight: '48px',
          backdropFilter: 'blur(8px)',
          textShadow: isBonusCall
            ? '0 0 12px rgba(168, 85, 247, 0.4)'
            : '0 0 12px rgba(37, 99, 235, 0.4)'
        }}>
          {isBonusCall ? (
            <Star size={isMobile ? 24 : 26} />
          ) : (
            call.call_number
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: isMobile ? '1.15rem' : '1.25rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.35rem',
            letterSpacing: '-0.01em'
          }}>
            {displayTitle}
          </h3>
          <p style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: isBonusCall
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(255, 255, 255, 0.75)',
            lineHeight: '1.4',
            margin: 0
          }}>
            {displaySubject}
          </p>
        </div>
      </div>
      
      {/* Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: isMobile ? '0.75rem 0.875rem' : '0.875rem 1rem',
        background: getStatusBg(call.status),
        borderRadius: isMobile ? '10px' : '12px',
        border: `1px solid ${getStatusBorder(call.status)}`,
        minHeight: '44px',
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <StatusIcon size={isMobile ? 18 : 20} style={{ color: getStatusColor(call.status) }} />
          <span style={{
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600'
          }}>
            {call.status === 'completed' && 'Voltooid'}
            {call.status === 'scheduled' && 'Ingepland'}
            {call.status === 'available' && 'Beschikbaar'}
            {call.status === 'locked' && 'Vergrendeld'}
          </span>
        </div>
        
        {call.scheduled_date && (
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            fontWeight: '500'
          }}>
            {new Date(call.scheduled_date).toLocaleDateString('nl-NL')}
          </span>
        )}
      </div>
      
      {/* Action Button */}
      {canBook && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookCall(call);
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.875rem' : '1rem',
            background: call.status === 'scheduled' 
              ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)'
              : isBonusCall
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)',
            border: call.status === 'scheduled' 
              ? '1px solid rgba(37, 99, 235, 0.35)'
              : isBonusCall
                ? '1px solid rgba(168, 85, 247, 0.35)'
                : '1px solid rgba(37, 99, 235, 0.35)',
            borderRadius: isMobile ? '10px' : '12px',
            color: isBonusCall ? '#a855f7' : '#3b82f6',
            fontSize: isMobile ? '0.875rem' : '0.95rem',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            minHeight: '48px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            backdropFilter: 'blur(10px)',
            boxShadow: isBonusCall
              ? '0 4px 16px rgba(168, 85, 247, 0.15)'
              : '0 4px 16px rgba(37, 99, 235, 0.15)',
            letterSpacing: '0.02em'
          }}
          onTouchStart={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(0.98)';
              e.currentTarget.style.background = isBonusCall
                ? 'rgba(168, 85, 247, 0.25)'
                : 'rgba(37, 99, 235, 0.25)';
            }
          }}
          onTouchEnd={(e) => {
            if (isMobile) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = isBonusCall
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.12) 100%)'
                : 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0.12) 100%)';
            }
          }}
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isBonusCall
                ? '0 6px 20px rgba(168, 85, 247, 0.25)'
                : '0 6px 20px rgba(37, 99, 235, 0.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isBonusCall
                ? '0 4px 16px rgba(168, 85, 247, 0.15)'
                : '0 4px 16px rgba(37, 99, 235, 0.15)';
            }
          }}
        >
          <Calendar size={isMobile ? 18 : 20} />
          {call.status === 'scheduled' ? 'Wijzig Afspraak' : 'Plan Deze Call'}
        </button>
      )}
      
      {/* Locked message */}
      {call.status === 'locked' && (
        <div style={{
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'rgba(107, 114, 128, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          textAlign: 'center',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: 'rgba(255, 255, 255, 0.6)',
            margin: 0
          }}>
            Voltooi eerst call {call.call_number - 1} om deze te ontgrendelen
          </p>
        </div>
      )}
      
      {/* Completed message */}
      {call.status === 'completed' && (
        <div style={{
          padding: isMobile ? '0.875rem' : '1rem',
          background: 'rgba(16, 185, 129, 0.12)',
          borderRadius: isMobile ? '10px' : '12px',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          textAlign: 'center',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
        }}>
          <p style={{
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: '#10b981',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontWeight: '600'
          }}>
            <CheckCircle size={isMobile ? 16 : 18} />
            Deze call is succesvol afgerond
          </p>
        </div>
      )}
    </div>
  );
}
