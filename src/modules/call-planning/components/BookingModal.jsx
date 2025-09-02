import useIsMobile from '../../../hooks/useIsMobile'
import React, { useEffect } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
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
        // Force re-initialization after modal renders
        setTimeout(() => {
          const widget = document.querySelector('.calendly-inline-widget');
          if (window.Calendly && selectedCall?.calendly_link && widget) {
            console.log('🎯 Initializing Calendly widget with URL:', selectedCall.calendly_link);
            try {
              window.Calendly.initInlineWidget({
                url: selectedCall.calendly_link,
                parentElement: widget,
                prefill: {},
                utm: {}
              });
              console.log('✅ Calendly widget initialized');
            } catch (e) {
              console.log('⚠️ Calendly auto-init mode:', e);
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
        
        // Initialize after script loads
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
              console.log('✅ Calendly widget initialized after script load');
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
          console.log('🚀 Force initializing Calendly for call', selectedCall.call_number);
          const url = widget.getAttribute('data-url');
          if (url) {
            try {
              window.Calendly.initInlineWidget({
                url: url,
                parentElement: widget,
                prefill: {},
                utm: {}
              });
              console.log('✅ Calendly force initialized with URL:', url);
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)',
        borderRadius: '24px',
        border: `2px solid ${config.color}44`,
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: `0 25px 50px rgba(0, 0, 0, 0.7), 0 0 100px ${config.color}22`,
        animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        {/* Modal Header */}
        <div style={{
          background: config.gradient,
          padding: isMobile ? '1.5rem' : '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.35rem' : '1.75rem',
              fontWeight: '700',
              color: '#fff',
              marginBottom: '0.5rem',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}>
              Plan Call #{selectedCall.call_number}
            </h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontSize: isMobile ? '0.95rem' : '1.1rem',
              fontWeight: '500'
            }}>
              {config.name} - {config.description}
            </p>
          </div>
          <button
            onClick={() => {
              setShowBookingModal(false);
              setSelectedCall(null);
            }}
            style={{
              width: isMobile ? '40px' : '48px',
              height: isMobile ? '40px' : '48px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isMobile) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            <X size={isMobile ? 20 : 24} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: isMobile ? '1.5rem' : '2rem' }}>
          {selectedCall.calendly_link ? (
            <div>
              <div style={{
                marginBottom: '1.5rem',
                padding: isMobile ? '1rem' : '1.25rem',
                background: config.darkGradient,
                border: `1px solid ${config.color}44`,
                borderRadius: isMobile ? '12px' : '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <Sparkles size={isMobile ? 20 : 24} style={{ color: config.color }} />
                <div>
                  <p style={{ 
                    color: '#fff', 
                    fontSize: isMobile ? '0.9rem' : '1rem',
                    fontWeight: '500',
                    marginBottom: '0.25rem'
                  }}>
                    Kies een moment dat jou uitkomt
                  </p>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: isMobile ? '0.8rem' : '0.875rem' 
                  }}>
                    Na het plannen ontvang je direct een bevestiging met Zoom link
                  </p>
                </div>
              </div>
              
              <div
                key={`calendly-${selectedCall.id}-${modalKey}`}
                className="calendly-inline-widget"
                data-url={`${selectedCall.calendly_link}?hide_landing_page_details=1&hide_gdpr_banner=1&background_color=1a1a1a&text_color=ffffff&primary_color=${config.color?.replace('#', '') || '10b981'}`}
                style={{
                  minWidth: '320px',
                  height: isMobile ? '500px' : '600px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: `1px solid ${config.color}22`,
                  background: '#1a1a1a',
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
                      borderTopColor: config.color
                    }} />
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '1rem' }}>
                      Kalender laden...
                    </p>
                  </div>
                )}
              </div>
              
              {/* Debug info */}
              <div style={{
                marginTop: '1rem',
                padding: isMobile ? '0.65rem' : '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                fontSize: isMobile ? '0.7rem' : '0.75rem',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Call #{selectedCall.call_number} • {selectedCall.calendly_link?.split('/').pop()}</span>
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
                      console.log('🔄 Calendly manually reloaded');
                    }
                  }}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  Herlaad Kalender
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '3rem' : '4rem'
            }}>
              <AlertCircle size={isMobile ? 60 : 80} style={{ 
                color: '#fbbf24', 
                margin: '0 auto 1.5rem' 
              }} />
              <p style={{ 
                color: '#fff', 
                fontSize: isMobile ? '1.1rem' : '1.25rem', 
                fontWeight: '600',
                marginBottom: '0.75rem' 
              }}>
                Calendly configuratie ontbreekt
              </p>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: isMobile ? '0.9rem' : '1rem'
              }}>
                Neem contact op met je coach om deze call in te plannen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
