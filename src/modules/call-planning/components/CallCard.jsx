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
      case 'completed': return '#10b981';
      case 'scheduled': return '#3b82f6';
      case 'available': return '#fbbf24';
      case 'locked': return '#6b7280';
      default: return '#6b7280';
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
        background: isBonusCall
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(124, 58, 237, 0.06) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(37, 99, 235, 0.06) 100%)',
        backdropFilter: 'blur(20px)',
        border: isBonusCall
          ? '1px solid rgba(139, 92, 246, 0.3)'
          : '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: isMobile ? '18px' : '22px',
        padding: isMobile ? '1.5rem 1.25rem' : '1.75rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: canBook ? 'pointer' : 'default',
        animation: `slideInUp ${400 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        opacity: 0,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isBonusCall
          ? '0 10px 30px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          : '0 10px 30px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        minHeight: isMobile ? '200px' : '220px'
      }}
      onClick={() => canBook && handleBookCall(call)}
      onTouchStart={(e) => {
        if (isMobile && canBook) {
          e.currentTarget.style.transform = 'scale(0.98)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 5px 20px rgba(139, 92, 246, 0.2)'
            : '0 5px 20px rgba(59, 130, 246, 0.2)';
        }
      }}
      onTouchEnd={(e) => {
        if (isMobile && canBook) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 10px 30px rgba(139, 92, 246, 0.15)'
            : '0 10px 30px rgba(59, 130, 246, 0.15)';
        }
      }}
      onMouseEnter={(e) => {
        if (!isMobile && canBook) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 20px 40px rgba(139, 92, 246, 0.3)'
            : '0 20px 40px rgba(59, 130, 246, 0.3)';
          e.currentTarget.style.borderColor = isBonusCall
            ? 'rgba(139, 92, 246, 0.4)'
            : 'rgba(59, 130, 246, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = isBonusCall
            ? '0 10px 30px rgba(139, 92, 246, 0.15)'
            : '0 10px 30px rgba(59, 130, 246, 0.15)';
          e.currentTarget.style.borderColor = isBonusCall
            ? 'rgba(139, 92, 246, 0.3)'
            : 'rgba(59, 130, 246, 0.25)';
        }
      }}
    >
      {/* Bonus Call Badge */}
      {isBonusCall && (
        <div style={{
          position: 'absolute',
          top: isMobile ? '1rem' : '1.25rem',
          right: isMobile ? '1rem' : '1.25rem',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: isMobile ? '0.4rem 0.75rem' : '0.45rem 0.9rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
          minHeight: '28px'
        }}>
          <Gift size={isMobile ? 14 : 16} style={{ color: '#fff' }} />
          <span style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            fontWeight: '700',
            color: '#fff',
            letterSpacing: '0.05em'
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
          ? 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
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
          borderRadius: '16px',
          background: isBonusCall 
            ? `linear-gradient(135deg, ${getStatusColor(call.status)}30 0%, ${getStatusColor(call.status)}10 100%)`
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.25rem' : '1.4rem',
          fontWeight: '800',
          color: isBonusCall ? getStatusColor(call.status) : '#fff',
          boxShadow: isBonusCall 
            ? 'inset 0 1px 2px rgba(255, 255, 255, 0.1)'
            : '0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.2)',
          border: isBonusCall
            ? `2px solid ${getStatusColor(call.status)}20`
            : '1px solid rgba(255, 255, 255, 0.15)',
          minWidth: '48px',
          minHeight: '48px'
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
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            color: isBonusCall
              ? 'rgba(255, 255, 255, 0.7)'
              : 'rgba(147, 197, 253, 0.9)',
            lineHeight: '1.4'
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
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        padding: isMobile ? '0.9rem' : '1rem',
        background: isBonusCall
          ? 'rgba(139, 92, 246, 0.06)'
          : 'rgba(59, 130, 246, 0.08)',
        borderRadius: '12px',
        border: isBonusCall
          ? '1px solid rgba(139, 92, 246, 0.12)'
          : '1px solid rgba(59, 130, 246, 0.15)',
        minHeight: '44px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}>
          <StatusIcon size={isMobile ? 18 : 20} style={{ color: getStatusColor(call.status) }} />
          <span style={{
            fontSize: isMobile ? '0.9rem' : '0.95rem',
            color: 'rgba(255, 255, 255, 0.85)',
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
            fontSize: isMobile ? '0.85rem' : '0.9rem',
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
            padding: isMobile ? '0.95rem' : '1.05rem',
            background: call.status === 'scheduled' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.15) 100%)'
              : isBonusCall
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: call.status === 'scheduled' 
              ? '1px solid rgba(59, 130, 246, 0.3)'
              : 'none',
            borderRadius: isMobile ? '12px' : '14px',
            color: call.status === 'scheduled' ? '#3b82f6' : '#fff',
            fontSize: isMobile ? '0.95rem' : '1rem',
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
            boxShadow: call.status === 'available' 
              ? isBonusCall
                ? '0 4px 12px rgba(139, 92, 246, 0.2)'
                : '0 4px 12px rgba(59, 130, 246, 0.2)'
              : 'none'
          }}
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
          onMouseEnter={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isBonusCall
                ? '0 8px 25px rgba(139, 92, 246, 0.4)'
                : '0 8px 25px rgba(59, 130, 246, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isMobile) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = call.status === 'available'
                ? isBonusCall
                  ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                  : '0 4px 15px rgba(59, 130, 246, 0.4)'
                : 'none';
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
          padding: isMobile ? '0.95rem' : '1.1rem',
          background: 'rgba(107, 114, 128, 0.1)',
          borderRadius: isMobile ? '12px' : '14px',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          textAlign: 'center',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
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
          padding: isMobile ? '0.95rem' : '1.1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: isMobile ? '12px' : '14px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          textAlign: 'center',
          minHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            color: 'rgba(16, 185, 129, 0.9)',
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
