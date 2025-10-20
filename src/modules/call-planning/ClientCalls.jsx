import useIsMobile from '../../hooks/useIsMobile'
import React, { useState, useEffect } from 'react';
import { 
  Bell, RefreshCw, Plus, HelpCircle
} from 'lucide-react';
import PageVideoWidget from '../videos/PageVideoWidget';
import CallPlanningService from './CallPlanningService';
import { callTypeConfig } from './constants/callTypes';
import ProgressBar from './components/ProgressBar';
import CallCard from './components/CallCard';
import NextCallHighlight from './components/NextCallHighlight';
import BookingModal from './components/BookingModal';
import RequestModal from './components/RequestModal';
import './styles/animations.css';

export default function ClientCalls({ db, clientInfo }) {
  const [plans, setPlans] = useState([]);
  const [calls, setCalls] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [calendlyLoaded, setCalendlyLoaded] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [userStats, setUserStats] = useState({
    totalCalls: 0,
    completedCalls: 0,
    scheduledCalls: 0
  });

  const isMobile = useIsMobile();

  // Body scroll management voor modals
  useEffect(() => {
    if (showBookingModal || showRequestModal) {
      const scrollY = window.scrollY;
      
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      if (isMobile) {
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.height = '100%';
      }
      
      return () => {
        const scrollY = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        
        if (isMobile) {
          document.documentElement.style.overflow = '';
          document.documentElement.style.height = '';
        }
        
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      };
    }
  }, [showBookingModal, showRequestModal, isMobile]);

  // Calculate user stats
  const calculateUserStats = (callsData) => {
    const completed = callsData.filter(c => c.status === 'completed').length;
    const scheduled = callsData.filter(c => c.status === 'scheduled').length;
    
    setUserStats({
      totalCalls: callsData.length,
      completedCalls: completed,
      scheduledCalls: scheduled
    });
  };

  // Load call data
  const loadCallData = async () => {
    try {
      setLoading(true);
      
      const plansData = await CallPlanningService.getClientPlans(clientInfo.id);
      setPlans(plansData || []);
      
      if (plansData && plansData.length > 0) {
        const activePlan = plansData.find(p => p.status === 'active') || plansData[0];
        
        if (activePlan.client_calls) {
          let callsData = activePlan.client_calls;
          
          // Auto unlock first call and subsequent calls if previous is completed
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
          calculateUserStats(callsData);
        }
      }
      
      // Load requests and notifications
      try {
        if (CallPlanningService.getClientRequests) {
          const requestsData = await CallPlanningService.getClientRequests(clientInfo.id);
          setRequests(requestsData || []);
        }
      } catch (e) {
        console.log('Requests not available');
      }
      
      try {
        if (CallPlanningService.getCallNotifications) {
          const notificationsData = await CallPlanningService.getCallNotifications(clientInfo.id);
          setNotifications(notificationsData?.filter(n => !n.read) || []);
        }
      } catch (e) {
        console.log('Notifications not available');
      }
      
    } catch (error) {
      console.error('Error loading call data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientInfo?.id) {
      loadCallData();
    }
  }, [clientInfo]);

  const handleBookCall = (call) => {
    console.log('Opening booking for call:', call);
    
    let callWithLink = { ...call };
    
    // Add fallback Calendly links if needed
    if (!callWithLink.calendly_link) {
      const fallbackLinks = {
        1: 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call',
        2: 'https://calendly.com/kerstenscheffer/persoonlijk-plan-pitch',
        3: 'https://calendly.com/kerstenscheffer/reflectie-bijsturen',
        4: 'https://calendly.com/kerstenscheffer/halfway-progressie-call',
        5: 'https://calendly.com/kerstenscheffer/final-sprint-call',
        6: 'https://calendly.com/kerstenscheffer/final-call',
        99: 'https://calendly.com/kerstenscheffer/bonus-call'
      };
      
      if (fallbackLinks[callWithLink.call_number]) {
        callWithLink.calendly_link = fallbackLinks[callWithLink.call_number];
      }
    }
    
    if (callWithLink.call_number === 99) {
      callWithLink.call_title = callWithLink.call_title || 'Bonus Call';
      if (callWithLink.client_subject) {
        callWithLink.display_subject = callWithLink.client_subject;
      }
    }
    
    if (!callWithLink.calendly_link || !callWithLink.calendly_link.includes('calendly.com')) {
      alert('Er is geen geldige Calendly link voor deze call. Neem contact op met je coach.');
      return;
    }

    const separator = callWithLink.calendly_link.includes('?') ? '&' : '?';
    const clientEmail = clientInfo?.email || '';
    const fullCalendlyUrl = `${callWithLink.calendly_link}${separator}utm_content=call_${call.id}&email=${encodeURIComponent(clientEmail)}`;
    
    callWithLink.calendly_link = fullCalendlyUrl;
    
    setCalendlyLoaded(false);
    setSelectedCall(callWithLink);
    setShowBookingModal(true);
    setModalKey(prev => prev + 1);
  };

  const calculateProgress = () => {
    const completed = calls.filter(c => c.status === 'completed').length;
    return calls.length > 0 ? (completed / calls.length) * 100 : 0;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0f0d 100%)',
        borderRadius: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            marginTop: '1rem',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Calls laden...
          </div>
        </div>
      </div>
    );
  }

  const activePlan = plans.find(p => p.status === 'active');
  const nextCall = calls.find(c => c.status === 'available' || c.status === 'scheduled');
  const progress = calculateProgress();

  return (
    <div style={{ 
      padding: isMobile ? '0.75rem' : '1rem', 
      background: 'linear-gradient(180deg, #0a0f0d 0%, #1a1a1a 100%)', 
      minHeight: '100vh' 
    }}>

      {/* Compact Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1rem' : '1.25rem',
        marginBottom: isMobile ? '1.25rem' : '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        {/* Animated Background Pattern */}
        <div className="float-animation" style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: isMobile ? '150px' : '250px',
          height: isMobile ? '150px' : '250px',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        {/* Header Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            marginBottom: isMobile ? '0.75rem' : '1rem',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '0.5rem' : '0.75rem'
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.25rem' : '1.5rem',
                fontWeight: '700',
                color: '#fff',
                marginBottom: '0.2rem',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
              }}>
                Coaching Journey
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.85)', 
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                lineHeight: '1.3'
              }}>
                6 strategische calls voor je transformatie
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '0.5rem' : '0.6rem',
              width: isMobile ? '100%' : 'auto'
            }}>
              <button
                onClick={loadCallData}
                style={{
                  flex: isMobile ? 1 : 'none',
                  padding: isMobile ? '0.6rem 0.8rem' : '0.65rem 1rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '10px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '600',
                  fontSize: isMobile ? '0.85rem' : '0.9rem',
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  minHeight: '44px'
                }}
                onTouchStart={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(0.98)';
                }}
                onTouchEnd={(e) => {
                  if (isMobile) e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <RefreshCw size={isMobile ? 16 : 18} />
                <span>Refresh</span>
              </button>
              
              {activePlan && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  style={{
                    flex: isMobile ? 1 : 'none',
                    padding: isMobile ? '0.6rem 0.8rem' : '0.65rem 1rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer',
                    fontWeight: '700',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(255, 255, 255, 0.2)',
                    fontSize: isMobile ? '0.85rem' : '0.9rem',
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    minHeight: '44px'
                  }}
                  onTouchStart={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(0.98)';
                  }}
                  onTouchEnd={(e) => {
                    if (isMobile) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Plus size={isMobile ? 16 : 18} />
                  <span>Bonus Call</span>
                </button>
              )}
            </div>
          </div>

          {/* Info Section - Smaller */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '10px',
            padding: isMobile ? '0.65rem 0.75rem' : '0.75rem 0.9rem',
            marginBottom: isMobile ? '0.75rem' : '0.9rem',
            border: '1px solid rgba(255, 255, 255, 0.15)'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.9)',
              fontSize: isMobile ? '0.75rem' : '0.8rem',
              lineHeight: '1.4',
              margin: 0,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <HelpCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>
                <strong>Tip:</strong> Plan calls wanneer het jou uitkomt en krijg direct een Zoom link.
              </span>
            </p>
          </div>

          {/* Progress Bar */}
          <ProgressBar 
            calls={calls}
            userStats={userStats}
            progress={progress}
            handleBookCall={handleBookCall}
          />
        </div>
      </div>

      {/* Video Widget - Under Header */}
      {clientInfo && db && (
        <div style={{
          marginBottom: isMobile ? '1.25rem' : '1.5rem'
        }}>
          <PageVideoWidget   
            client={clientInfo}
            db={db}
            pageContext="calls"
            title="Coaching Call Tips"
            compact={true}
          />
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.05) 100%)',
          backdropFilter: 'blur(10px)',
          borderLeft: '3px solid #fbbf24',
          borderRadius: isMobile ? '12px' : '14px',
          padding: isMobile ? '1rem' : '1.25rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          border: '1px solid rgba(251, 191, 36, 0.2)'
        }}>
          <div style={{ display: 'flex', gap: isMobile ? '0.6rem' : '0.75rem' }}>
            <Bell size={isMobile ? 16 : 18} style={{ 
              color: '#fbbf24', 
              marginTop: '2px', 
              flexShrink: 0 
            }} />
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontWeight: '700', 
                color: '#fff', 
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.95rem' : '1.05rem'
              }}>
                Nieuwe Updates
              </h3>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? '0.4rem' : '0.5rem' 
              }}>
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    style={{ 
                      fontSize: isMobile ? '0.8rem' : '0.85rem', 
                      color: 'rgba(255, 255, 255, 0.85)',
                      padding: isMobile ? '0.5rem' : '0.6rem',
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      borderLeft: '2px solid #fbbf24',
                      lineHeight: '1.4'
                    }}
                  >
                    {notif.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Call Highlight */}
      {nextCall && (
        <NextCallHighlight 
          nextCall={nextCall}
          handleBookCall={handleBookCall}
        />
      )}

      {/* Call Cards Grid */}
      <div style={{ marginTop: isMobile ? '1.5rem' : '2rem' }}>
        <h2 style={{ 
          fontSize: isMobile ? '1.25rem' : '1.5rem', 
          fontWeight: '700', 
          color: '#fff', 
          marginBottom: isMobile ? '1rem' : '1.25rem'
        }}>
          Jouw 6-Call Journey
        </h2>
        
        <div style={{
          display: 'grid',
          gap: isMobile ? '0.9rem' : '1.25rem',
          gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(3, 1fr)' 
            : window.innerWidth > 640 ? 'repeat(2, 1fr)' 
            : '1fr'
        }}>
          {calls.sort((a, b) => a.call_number - b.call_number).map((call, index) => (
            <CallCard 
              key={call.id}
              call={call}
              index={index}
              handleBookCall={handleBookCall}
            />
          ))}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedCall && (
        <BookingModal
          selectedCall={selectedCall}
          setShowBookingModal={setShowBookingModal}
          setSelectedCall={setSelectedCall}
          calendlyLoaded={calendlyLoaded}
          setCalendlyLoaded={setCalendlyLoaded}
          modalKey={modalKey}
          calls={calls}
          setCalls={setCalls}
          loadCallData={loadCallData}
        />
      )}

      {/* Bonus Call Request Modal */}
      {showRequestModal && (
        <RequestModal
          setShowRequestModal={setShowRequestModal}
          clientInfo={clientInfo}
          plans={plans}
          loadCallData={loadCallData}
        />
      )}

      {/* Animation Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
