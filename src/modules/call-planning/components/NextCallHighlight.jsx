import useIsMobile from '../../../hooks/useIsMobile'
import React from 'react';
import { Calendar, Clock, Video, Sparkles, ArrowRight } from 'lucide-react';
import { callTypeConfig } from '../constants/callTypes';

export default function NextCallHighlight({ nextCall, handleBookCall }) {
  const isMobile = useIsMobile();
  const config = callTypeConfig[nextCall.call_number] || callTypeConfig[1];
  
  const getDaysUntilCall = (scheduledDate) => {
    if (!scheduledDate) return null;
    const scheduled = new Date(scheduledDate);
    const today = new Date();
    const diff = Math.ceil((scheduled - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div style={{
      background: nextCall.status === 'scheduled' 
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
      backdropFilter: 'blur(10px)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.25rem' : '1.75rem',
      marginBottom: '2rem',
      border: nextCall.status === 'scheduled'
        ? '2px solid rgba(59, 130, 246, 0.3)'
        : '2px solid rgba(16, 185, 129, 0.3)',
      position: 'relative',
      overflow: 'hidden',
      cursor: nextCall.status === 'available' ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent'
    }}
    onClick={() => nextCall.status === 'available' && handleBookCall(nextCall)}
    onMouseEnter={(e) => {
      if (nextCall.status === 'available' && !isMobile) {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.3)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isMobile) {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }
    }}
    onTouchStart={(e) => {
      if (nextCall.status === 'available' && isMobile) {
        e.currentTarget.style.transform = 'scale(0.98)';
      }
    }}
    onTouchEnd={(e) => {
      if (isMobile) {
        e.currentTarget.style.transform = 'scale(1)';
      }
    }}
    >
      {/* Animated Background */}
      {nextCall.status === 'available' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
          animation: 'pulse 3s infinite'
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center', 
          gap: isMobile ? '1rem' : '1.5rem' 
        }}>
          <div style={{
            width: isMobile ? '56px' : '72px',
            height: isMobile ? '56px' : '72px',
            borderRadius: isMobile ? '14px' : '18px',
            background: nextCall.status === 'scheduled'
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            flexShrink: 0
          }}>
            {nextCall.status === 'scheduled' ? (
              <Clock size={isMobile ? 24 : 32} color="#fff" />
            ) : (
              <Sparkles size={isMobile ? 24 : 32} color="#fff" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              color: nextCall.status === 'scheduled' ? '#3b82f6' : '#10b981',
              fontWeight: '600',
              marginBottom: '0.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {nextCall.status === 'scheduled' ? 'Volgende Call' : 'Beschikbaar om te boeken'}
            </div>
            <h3 style={{
              fontSize: isMobile ? '1.1rem' : '1.35rem',
              fontWeight: 'bold',
              color: '#fff',
              marginBottom: '0.4rem'
            }}>
              Call #{nextCall.call_number} - {config.name}
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              marginBottom: isMobile ? '0.75rem' : '0'
            }}>
              {config.description || nextCall.call_title}
            </p>

            {nextCall.status === 'scheduled' && nextCall.scheduled_date && (
              <div style={{
                marginTop: '1rem',
                padding: isMobile ? '0.65rem' : '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'stretch' : 'center',
                gap: isMobile ? '0.65rem' : '0.5rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <Calendar size={16} color="#3b82f6" />
                  <span style={{ color: '#fff', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                    {new Date(nextCall.scheduled_date).toLocaleDateString('nl-NL', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long'
                    })}
                    {!isMobile && ` om ${new Date(nextCall.scheduled_date).toLocaleTimeString('nl-NL', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  </span>
                </div>
                
                {getDaysUntilCall(nextCall.scheduled_date) >= 0 && (
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    borderRadius: '20px',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    color: '#3b82f6',
                    whiteSpace: 'nowrap'
                  }}>
                    Over {getDaysUntilCall(nextCall.scheduled_date)} dagen
                  </span>
                )}
              </div>
            )}

            {nextCall.status === 'available' && (
              <div style={{
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#10b981',
                fontWeight: '600',
                fontSize: isMobile ? '0.9rem' : '0.95rem'
              }}>
                <ArrowRight size={18} className="slideRight-animation" />
                Klik om deze call in te plannen
              </div>
            )}
          </div>

          {nextCall.status === 'scheduled' && nextCall.zoom_link && !isMobile && (
            <a
              href={nextCall.zoom_link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '0.875rem 1.25rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                borderRadius: '12px',
                color: '#fff',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                flexShrink: 0
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.3)';
              }}
            >
              <Video size={18} />
              Join Zoom
            </a>
          )}
        </div>
        
        {/* Mobile Zoom Button */}
        {nextCall.status === 'scheduled' && nextCall.zoom_link && isMobile && (
          <a
            href={nextCall.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              width: '100%',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Video size={16} />
            Join Zoom Meeting
          </a>
        )}
      </div>
    </div>
  );
}
