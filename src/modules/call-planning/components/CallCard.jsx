import React from 'react';
import { Calendar, Clock, CheckCircle, Lock, Star, Gift } from 'lucide-react';

export default function CallCard({ call, index, handleBookCall }) {
  const isMobile = window.innerWidth <= 768;
  
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
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.05) 100%)',
        backdropFilter: 'blur(20px)',
        border: isBonusCall
          ? '1px solid rgba(139, 92, 246, 0.3)'
          : '1px solid rgba(59, 130, 246, 0.25)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: canBook ? 'pointer' : 'default',
        animation: `slideInUp ${400 + index * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
        opacity: 0,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
        boxShadow: isBonusCall
          ? '0 10px 30px rgba(139, 92, 246, 0.15)'
          : '0 10px 30px rgba(59, 130, 246, 0.15)'
      }}
      onClick={() => canBook && handleBookCall(call)}
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
          top: isMobile ? '0.75rem' : '1rem',
          right: isMobile ? '0.75rem' : '1rem',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          padding: isMobile ? '0.3rem 0.6rem' : '0.4rem 0.8rem',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
        }}>
          <Gift size={isMobile ? 12 : 14} style={{ color: '#fff' }} />
          <span style={{
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            fontWeight: '600',
            color: '#fff'
          }}>
            BONUS
          </span>
        </div>
      )}
      
      {/* Decorative gradient orb - BLAUWE ORBS voor normale calls */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '-50px',
        width: isMobile ? '100px' : '150px',
        height: isMobile ? '100px' : '150px',
        borderRadius: '50%',
        background: isBonusCall
          ? 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      
      {/* Extra decorative orb voor normale calls */}
      {!isBonusCall && (
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          right: '-30px',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Call Number or Bonus Icon - BLAUWE GRADIENT voor normale calls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          width: isMobile ? '40px' : '48px',
          height: isMobile ? '40px' : '48px',
          borderRadius: '14px',
          background: isBonusCall 
            ? `linear-gradient(135deg, ${getStatusColor(call.status)}30 0%, ${getStatusColor(call.status)}10 100%)`
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '1.1rem' : '1.3rem',
          fontWeight: 'bold',
          color: isBonusCall ? getStatusColor(call.status) : '#fff',
          boxShadow: isBonusCall 
            ? 'none'
            : '0 4px 12px rgba(59, 130, 246, 0.4)',
          border: isBonusCall
            ? 'none'
            : '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {isBonusCall ? (
            <Star size={isMobile ? 20 : 24} />
          ) : (
            call.call_number
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: isMobile ? '1rem' : '1.1rem',
            fontWeight: '700',
            color: '#fff',
            marginBottom: '0.25rem'
          }}>
            {displayTitle}
          </h3>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: isBonusCall
              ? 'rgba(255, 255, 255, 0.6)'
              : 'rgba(147, 197, 253, 0.9)', // Lichtblauwe tint voor normale calls
            lineHeight: '1.4'
          }}>
            {displaySubject}
          </p>
        </div>
      </div>
      
      {/* Status - met blauwe accenten */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isMobile ? '1rem' : '1.25rem',
        padding: '0.75rem',
        background: isBonusCall
          ? 'rgba(139, 92, 246, 0.05)'
          : 'rgba(59, 130, 246, 0.08)',
        borderRadius: '10px',
        border: isBonusCall
          ? '1px solid rgba(139, 92, 246, 0.1)'
          : '1px solid rgba(59, 130, 246, 0.15)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <StatusIcon size={isMobile ? 16 : 18} style={{ color: getStatusColor(call.status) }} />
          <span style={{
            fontSize: isMobile ? '0.8rem' : '0.85rem',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: '500'
          }}>
            {call.status === 'completed' && 'Voltooid'}
            {call.status === 'scheduled' && 'Ingepland'}
            {call.status === 'available' && 'Beschikbaar'}
            {call.status === 'locked' && 'Vergrendeld'}
          </span>
        </div>
        
        {call.scheduled_date && (
          <span style={{
            fontSize: isMobile ? '0.7rem' : '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            {new Date(call.scheduled_date).toLocaleDateString('nl-NL')}
          </span>
        )}
      </div>
      
      {/* Action Button - BLAUWE buttons voor normale calls */}
      {canBook && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleBookCall(call);
          }}
          style={{
            width: '100%',
            padding: isMobile ? '0.75rem' : '0.875rem',
            background: call.status === 'scheduled' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(30, 64, 175, 0.15) 100%)'
              : isBonusCall
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: call.status === 'scheduled' 
              ? '1px solid rgba(59, 130, 246, 0.3)'
              : 'none',
            borderRadius: isMobile ? '10px' : '12px',
            color: call.status === 'scheduled' ? '#3b82f6' : '#fff',
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            minHeight: '44px',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: call.status === 'available' 
              ? isBonusCall
                ? '0 4px 15px rgba(139, 92, 246, 0.3)'
                : '0 4px 15px rgba(59, 130, 246, 0.4)'
              : 'none'
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
          <Calendar size={isMobile ? 16 : 18} />
          {call.status === 'scheduled' ? 'Wijzig Afspraak' : 'Plan Deze Call'}
        </button>
      )}
      
      {/* Locked message */}
      {call.status === 'locked' && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(107, 114, 128, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: 0
          }}>
            Voltooi eerst call {call.call_number - 1} om deze te ontgrendelen
          </p>
        </div>
      )}
      
      {/* Completed message */}
      {call.status === 'completed' && (
        <div style={{
          padding: isMobile ? '0.75rem' : '1rem',
          background: 'rgba(16, 185, 129, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: 'rgba(16, 185, 129, 0.9)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle size={isMobile ? 14 : 16} />
            Deze call is succesvol afgerond
          </p>
        </div>
      )}
    </div>
  );
}
