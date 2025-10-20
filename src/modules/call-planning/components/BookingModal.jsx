import useIsMobile from '../../../hooks/useIsMobile'
import React, { useEffect } from 'react';
import { X, Calendar, Info } from 'lucide-react';
import { callTypeConfig } from '../constants/callTypes';

export default function BookingModal({
  selectedCall,
  setShowBookingModal,
  setSelectedCall,
  calendlyLoaded,
  setCalendlyLoaded,
  modalKey,
  calls,
  setCalls,
  loadCallData
}) {
  const isMobile = useIsMobile();
  const config = callTypeConfig[selectedCall.call_number] || callTypeConfig[1];

  // Load Calendly script
  useEffect(() => {
    if (!calendlyLoaded) {
      const existingScript = document.querySelector('script[src*="calendly.com"]');
      if (existingScript) {
        setCalendlyLoaded(true);
        console.log('✅ Calendly script already exists');
        setTimeout(() => {
          const widget = document.querySelector('.calendly-inline-widget');
          if (window.Calendly && selectedCall?.calendly_link && widget) {
            console.log('🎯 Initializing Calendly widget');
            try {
              window.Calendly.initInlineWidget({
                url: selectedCall.calendly_link,
                parentElement: widget,
                prefill: {},
                utm: {}
              });
            } catch (e) {
              console.log('⚠️ Calendly auto-init mode');
            }
          }
        }, 500);
        return;
      }

      console.log('📦 Loading Calendly script...');
      const script = document.createElement('script');   
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        setCalendlyLoaded(true);
        console.log('✅ Calendly script loaded successfully');
        
        setTimeout(() => {
          const widget = document.querySelector('.calendly-inline-widget');
          if (window.Calendly && selectedCall?.calendly_link && widget) {
            try {
              window.Calendly.initInlineWidget({
                url: selectedCall.calendly_link,
                parentElement: widget,
                prefill: {},
                utm: {}
              });
            } catch (e) {
              console.log('⚠️ Calendly will auto-init');
            }
          }
        }, 500);
      };
      script.onerror = (error) => {
        console.error('❌ Failed to load Calendly script:', error);
        setCalendlyLoaded(false);
      };
      document.body.appendChild(script);
    }
  }, [calendlyLoaded, selectedCall, setCalendlyLoaded]);
  
  // Force Calendly initialization when modal opens
  useEffect(() => {
    if (selectedCall && calendlyLoaded) {
      setTimeout(() => {
        const widget = document.querySelector('.calendly-inline-widget');
        if (widget && window.Calendly) {
          const url = widget.getAttribute('data-url');
          if (url) {
            try {
              window.Calendly.initInlineWidget({
                url: url,
                parentElement: widget,
                prefill: {},
                utm: {}
              });
            } catch (e) {
              console.log('⚠️ Calendly might already be initialized');
            }
          }
        }
      }, 300);
    }
  }, [selectedCall, calendlyLoaded, modalKey]);
  
  // Listen for Calendly events
  useEffect(() => {
    if (selectedCall) {
      const handleMessage = async (e) => {
        if (e.origin !== 'https://calendly.com') return;

        if (e.data?.event === 'calendly.event_scheduled') {
          try {
            const payload = e.data.payload;
            const eventUri = payload.event?.uri || '';

            const updatedCalls = calls.map(c => 
              c.id === selectedCall.id 
                ? { 
                    ...c, 
                    status: 'scheduled',
                    calendly_event_uri: eventUri,
                    updated_at: new Date().toISOString()
                  }
                : c
            );
            setCalls(updatedCalls);

            setShowBookingModal(false);
            setSelectedCall(null);

            setTimeout(async () => {
              await loadCallData();
            }, 3000);

            celebrateBooking();
            
          } catch (error) {
            console.error('Error processing booking:', error);
            await loadCallData();
          }
        }
      };

      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          setShowBookingModal(false);
          setSelectedCall(null);
        }
      };

      window.addEventListener('message', handleMessage);
      window.addEventListener('keydown', handleEsc);

      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [selectedCall, calls, setCalls, setShowBookingModal, setSelectedCall, loadCallData]);

  const celebrateBooking = () => {
    const celebration = document.createElement('div');
    celebration.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        animation: celebrateScale 1s ease-out;
        pointer-events: none;
      ">
        <div style="
          font-size: 100px;
          animation: celebrateRotate 1s ease-out;
        ">🎉</div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #10b981;
          white-space: nowrap;
          animation: celebrateText 1s ease-out;
        ">Call Gepland!</div>
      </div>
    `;
    document.body.appendChild(celebration);
    setTimeout(() => celebration.remove(), 1500);
  };

  return (
    <div style={{ 
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? '0' : '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: '#1a1a1a',
        borderRadius: isMobile ? '24px 24px 0 0' : '20px',
        border: `1px solid ${config.color}30`,
        maxWidth: isMobile ? '100%' : '900px',
        width: '100%',
        height: isMobile ? '85vh' : 'auto',
        maxHeight: isMobile ? '85vh' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: `0 -10px 40px rgba(0, 0, 0, 0.5), 0 0 60px ${config.color}15`,
        animation: isMobile ? 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'scaleIn 0.3s ease'
      }}>
        {/* Fixed Header */}
        <div style={{
          background: config.gradient,
          padding: isMobile ? '1.25rem' : '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: isMobile ? '24px 24px 0 0' : '20px 20px 0 0',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.15rem' : '1.4rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Calendar size={isMobile ? 18 : 20} />
              Call {selectedCall.call_number}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.85rem' : '0.95rem',
              fontWeight: '500'
            }}>
              {config.name}
            </p>
          </div>
          <button
            onClick={() => {
              setShowBookingModal(false);
              setSelectedCall(null);
            }}
            style={{
              width: isMobile ? '36px' : '40px',
              height: isMobile ? '36px' : '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minWidth: '44px',
              minHeight: '44px'
            }}
            onTouchStart={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              if (isMobile) e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={isMobile ? 18 : 20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '1rem' : '1.5rem'
        }}>
          {selectedCall.calendly_link ? (
            <div>
              {/* Compact Info Box */}
              <div style={{
                marginBottom: isMobile ? '1rem' : '1.25rem',
                padding: isMobile ? '0.75rem' : '1rem',
                background: 'rgba(59, 130, 246, 0.08)',
                border: `1px solid rgba(59, 130, 246, 0.2)`,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem'
              }}>
                <Info size={isMobile ? 16 : 18} style={{ 
                  color: '#3b82f6',
                  flexShrink: 0
                }} />
                <div>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    Kies een moment • Direct Zoom link in je mail
                  </p>
                </div>
              </div>
              
              {/* Calendly Widget - Adjusted Height */}
              <div
                key={`calendly-${selectedCall.id}-${modalKey}`}
                className="calendly-inline-widget"
                data-url={`${selectedCall.calendly_link}?hide_landing_page_details=1&hide_gdpr_banner=1&background_color=1a1a1a&text_color=ffffff&primary_color=3b82f6`}
                style={{
                  minWidth: '320px',
                  height: isMobile ? '400px' : '550px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `1px solid rgba(59, 130, 246, 0.15)`,
                  background: '#0a0a0a',
                  position: 'relative'
                }}
              >
                {/* Loading indicator */}
                {!calendlyLoaded && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <div className="spinner" style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(59, 130, 246, 0.2)',
                      borderTopColor: '#3b82f6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.5)', 
                      marginTop: '1rem',
                      fontSize: isMobile ? '0.85rem' : '0.9rem'
                    }}>
                      Kalender laden...
                    </p>
                  </div>
                )}
              </div>
              
              {/* Help Text */}
              <div style={{
                marginTop: isMobile ? '0.75rem' : '1rem',
                padding: isMobile ? '0.6rem' : '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <p style={{
                  fontSize: isMobile ? '0.75rem' : '0.8rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  margin: 0
                }}>
                  Scroll voor meer tijdslots
                </p>
                {!isMobile && (
                  <button
                    onClick={() => {
                      const widget = document.querySelector('.calendly-inline-widget');
                      if (window.Calendly && widget) {
                        window.Calendly.initInlineWidget({
                          url: selectedCall.calendly_link,
                          parentElement: widget,
                          prefill: {},
                          utm: {}
                        });
                      }
                    }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Herlaad
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '2rem' : '3rem'
            }}>
              <Calendar size={isMobile ? 48 : 60} style={{ 
                color: '#fbbf24', 
                margin: '0 auto 1rem' 
              }} />
              <p style={{ 
                color: '#fff', 
                fontSize: isMobile ? '1rem' : '1.1rem', 
                fontWeight: '600',
                marginBottom: '0.5rem' 
              }}>
                Calendly configuratie ontbreekt
              </p>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: isMobile ? '0.85rem' : '0.9rem'
              }}>
                Neem contact op met je coach
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0.95);
            opacity: 0;
          }
          to { 
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
