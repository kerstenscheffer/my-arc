import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Video, Lock, CheckCircle, ChevronRight, Plus, Bell, AlertCircle, X } from 'lucide-react';
import CallPlanningService from './CallPlanningService';

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
  const [requestData, setRequestData] = useState({
    reason: '',
    preferred_date: '',
    preferred_time: '',
    urgency: 'normal'
  });

  // Load Calendly script when modal opens
  useEffect(() => {
    if (showBookingModal && !calendlyLoaded) {
      const existingScript = document.querySelector('script[src*="calendly.com"]');
      if (existingScript) {
        setCalendlyLoaded(true);
        console.log('✅ Calendly script already loaded');
        setTimeout(() => {
          if (window.Calendly && selectedCall?.calendly_link) {
            try {
              window.Calendly.initInlineWidget({
                url: selectedCall.calendly_link,
                parentElement: document.querySelector('.calendly-inline-widget'),
                prefill: {},
                utm: {}
              });
            } catch (e) {
              console.log('Calendly will auto-init');
            }
          }
        }, 100);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://assets.calendly.com/assets/external/widget.js';
      script.async = true;
      script.onload = () => {
        setCalendlyLoaded(true);
        console.log('✅ Calendly script loaded');
      };
      script.onerror = () => {
        console.error('❌ Failed to load Calendly script');
        setCalendlyLoaded(false);
      };
      document.body.appendChild(script);
    }
  }, [showBookingModal, calendlyLoaded, selectedCall]);

  // Listen for Calendly events
  useEffect(() => {
    if (showBookingModal && selectedCall) {
      console.log('🎯 Setting up Calendly listener for call:', selectedCall.call_number);
      
      const handleMessage = async (e) => {
        if (e.origin !== 'https://calendly.com') return;
        
        if (e.data?.event) {
          console.log('📨 Calendly event:', e.data.event);
        }
        
        if (e.data?.event === 'calendly.event_scheduled') {
          console.log('✅ Event scheduled detected!');
          
          try {
            const payload = e.data.payload;
            const scheduledDate = payload.event?.start_time;
            const inviteeName = payload.invitee?.name || 'Client';
            const inviteeEmail = payload.invitee?.email || '';
            const eventUri = payload.event?.uri || '';
            
            // Extract Zoom link if available (sometimes in location)
            let zoomLink = '';
            if (payload.event?.location) {
              const location = payload.event.location;
              if (location.includes('zoom.us') || location.includes('zoom.com')) {
                zoomLink = location;
              } else if (location.type === 'zoom' && location.join_url) {
                zoomLink = location.join_url;
              }
            }
            
            // Update call in database
            await CallPlanningService.scheduleCall(
              selectedCall.id,
              scheduledDate,
              `Gepland door: ${inviteeName} (${inviteeEmail})`
            );
            
            // Immediately update local state to show scheduled status
            const updatedCalls = calls.map(c => 
              c.id === selectedCall.id 
                ? { 
                    ...c, 
                    status: 'scheduled', 
                    scheduled_date: scheduledDate,
                    zoom_link: zoomLink || c.zoom_link,
                    updated_at: new Date().toISOString()
                  }
                : c
            );
            setCalls(updatedCalls);
            console.log('📊 Local state updated immediately');
            
            // Close modal
            setShowBookingModal(false);
            setSelectedCall(null);
            
            // Reload all data to get fresh info from database
            setTimeout(async () => {
              console.log('🔄 Refreshing data from database...');
              await loadCallData();
            }, 2000);
            
            // Success message with details
            alert(`🎉 SUCCES! Call is gepland!\n\n📅 Datum: ${new Date(scheduledDate).toLocaleDateString('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}\n⏰ Tijd: ${new Date(scheduledDate).toLocaleTimeString('nl-NL', {
              hour: '2-digit',
              minute: '2-digit'
            })}\n\n✉️ Je ontvangt een bevestiging per email met de Zoom link.\n${zoomLink ? '🔗 Zoom link is toegevoegd aan je call.' : '⏳ Zoom link volgt binnen enkele minuten.'}\n\n✅ De call status is automatisch bijgewerkt.`);
            
          } catch (error) {
            console.error('Error processing booking:', error);
            // Still reload data even if there was an error
            await loadCallData();
            alert('Call is gepland! Refresh de pagina om de details te zien.');
          }
        }
      };
      
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          console.log('ESC pressed, closing modal');
          setShowBookingModal(false);
          setSelectedCall(null);
        }
      };

      window.addEventListener('message', handleMessage);
      window.addEventListener('keydown', handleEsc);
      console.log('👂 Listening for Calendly events...');
      
      return () => {
        window.removeEventListener('message', handleMessage);
        window.removeEventListener('keydown', handleEsc);
        console.log('🔇 Stopped listening for Calendly events');
      };
    }
  }, [showBookingModal, selectedCall]);

  const loadCallData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading data for client:', clientInfo);
      
      const plansData = await CallPlanningService.getClientPlans(clientInfo.id);
      console.log('📋 Plans loaded:', plansData);
      setPlans(plansData || []);
      
      if (plansData && plansData.length > 0) {
        const activePlan = plansData.find(p => p.status === 'active') || plansData[0];
        
        if (activePlan.client_calls) {
          let callsData = activePlan.client_calls;
          
          // Process call statuses - unlock based on previous completion
          callsData = callsData.map((call, index) => {
            // Call 1 is always available if not completed/scheduled
            if (call.call_number === 1 && call.status === 'locked') {
              return { ...call, status: 'available' };
            }
            
            // Unlock next call if previous is completed
            if (call.call_number > 1 && call.status === 'locked') {
              const previousCall = callsData.find(c => c.call_number === call.call_number - 1);
              if (previousCall && previousCall.status === 'completed') {
                console.log(`Unlocking call #${call.call_number}`);
                return { ...call, status: 'available' };
              }
            }
            
            return call;
          });
          
          console.log('📞 Calls processed:', callsData.length);
          
          // Check if any call status changed
          const statusChanged = JSON.stringify(calls.map(c => ({ id: c.id, status: c.status }))) !== 
                              JSON.stringify(callsData.map(c => ({ id: c.id, status: c.status })));
          
          if (statusChanged) {
            console.log('📊 Call statuses have changed!');
          }
          
          setCalls(callsData);
        }
      }
      
      // Load requests if method exists
      try {
        if (CallPlanningService.getClientRequests) {
          const requestsData = await CallPlanningService.getClientRequests(clientInfo.id);
          setRequests(requestsData || []);
        }
      } catch (e) {
        console.log('Requests not available');
      }
      
      // Load notifications if method exists
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

  useEffect(() => {
    console.log('Modal state changed:', { showBookingModal, selectedCall: selectedCall?.call_number });
    
    if (showBookingModal) {
      setTimeout(() => {
        // Try multiple selectors to find modal
        const modalElement = document.querySelector('.fixed.inset-0') || 
                           document.querySelector('[style*="z-index: 9999"]') ||
                           document.querySelector('.calendly-inline-widget')?.closest('.fixed');
        
        if (!modalElement) {
          console.error('❌ Modal not found in DOM despite showBookingModal=true');
          console.log('Checking for Calendly widget:', !!document.querySelector('.calendly-inline-widget'));
          console.log('All fixed elements:', document.querySelectorAll('.fixed').length);
        } else {
          console.log('✅ Modal is in DOM');
          // Force visibility just in case
          modalElement.style.display = 'flex';
          modalElement.style.visibility = 'visible';
        }
      }, 100);
    }
  }, [showBookingModal, selectedCall]);

  const handleBookCall = (call) => {
    console.log('Opening booking for call:', call);
    
    let callWithLink = { ...call };
    
    if (!callWithLink.calendly_link) {
      const fallbackLinks = {
        1: 'https://calendly.com/kerstenscheffer/kennismaking-doelstelling-call',
        2: 'https://calendly.com/kerstenscheffer/persoonlijk-plan-pitch',
        3: 'https://calendly.com/kerstenscheffer/reflectie-bijsturen',
        4: 'https://calendly.com/kerstenscheffer/halfway-progressie-call',
        5: 'https://calendly.com/kerstenscheffer/final-sprint-call',
        6: 'https://calendly.com/kerstenscheffer/final-call'
      };
      
      if (fallbackLinks[callWithLink.call_number]) {
        callWithLink.calendly_link = fallbackLinks[callWithLink.call_number];
        console.log('Using fallback link for call', callWithLink.call_number, ':', callWithLink.calendly_link);
      }
    }
    
    if (!callWithLink.calendly_link || !callWithLink.calendly_link.includes('calendly.com')) {
      alert('Er is geen geldige Calendly link voor deze call. Neem contact op met je coach.');
      return;
    }
    
    // Set state for modal
    setSelectedCall(callWithLink);
    setShowBookingModal(true);
    setModalKey(prev => prev + 1);
    
    console.log('Modal should be visible now. showBookingModal:', true, 'selectedCall:', callWithLink);
    
    // Force modal visibility and Calendly init
    requestAnimationFrame(() => {
      setTimeout(() => {
        // Force modal to be visible
        const modalEl = document.querySelector('[style*="z-index: 9999"]');
        if (modalEl) {
          modalEl.style.display = 'flex';
          modalEl.style.visibility = 'visible';
          modalEl.style.opacity = '1';
          console.log('Modal forced to visible');
        }
        
        // Initialize Calendly widget
        const widget = document.querySelector('.calendly-inline-widget');
        if (widget && window.Calendly) {
          console.log('Initializing Calendly widget in modal...');
          try {
            window.Calendly.initInlineWidget({
              url: callWithLink.calendly_link,
              parentElement: widget,
              prefill: {},
              utm: {}
            });
            console.log('✅ Calendly widget ready in modal');
          } catch (e) {
            console.log('Calendly will auto-init from data-url');
          }
        }
      }, 200);
    });
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scheduled': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'available': return <ChevronRight className="w-5 h-5 text-green-500" />;
      default: return <Lock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'border-green-500 bg-green-500/10';
      case 'scheduled': return 'border-blue-500 bg-blue-500/10';
      case 'available': return 'border-green-500 bg-green-500/20 animate-pulse shadow-green-500/20 shadow-lg';
      default: return 'border-gray-600 bg-gray-800/50';
    }
  };

  const calculateProgress = () => {
    const completed = calls.filter(c => c.status === 'completed' || c.status === 'voltooid').length;
    return calls.length > 0 ? (completed / calls.length) * 100 : 0;
  };

  const submitCallRequest = async () => {
    if (!requestData.reason) {
      alert('Geef een reden op voor de extra call');
      return;
    }

    try {
      const activePlan = plans.find(p => p.status === 'active');
      if (!activePlan) {
        alert('Geen actief plan gevonden');
        return;
      }

      await CallPlanningService.submitCallRequest(clientInfo.id, activePlan.id, requestData);
      
      await loadCallData();
      setShowRequestModal(false);
      setRequestData({ reason: '', preferred_date: '', preferred_time: '', urgency: 'normal' });
      alert('✅ Bonus call aanvraag verstuurd!');
    } catch (error) {
      console.error('Error submitting call request:', error);
      alert('Er ging iets mis bij het aanvragen van de bonus call');
    }
  };

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    try {
      await loadCallData();
      
      if (selectedCall) {
        const updatedCall = calls.find(c => c.id === selectedCall.id);
        if (updatedCall && updatedCall.status === 'scheduled') {
          setShowBookingModal(false);
          setSelectedCall(null);
          alert('✅ Call is succesvol gepland! Check je email voor de bevestiging.');
        } else {
          alert('⏳ Nog geen booking gevonden. Probeer over enkele seconden opnieuw of voltooi eerst de booking in Calendly.');
        }
      }
    } catch (error) {
      console.error('Refresh error:', error);
      alert('Er ging iets mis. Probeer opnieuw.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const activePlan = plans.find(p => p.status === 'active');

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="myarc-card p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Mijn Coaching Calls</h2>
            <p className="text-gray-400">
              {activePlan ? `${activePlan.call_templates?.template_name || 'Coaching Traject'}` : 'Geen actief plan'}
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Refresh button */}
            <button
              onClick={async () => {
                console.log('🔄 Manual refresh triggered');
                await loadCallData();
                alert('✅ Status bijgewerkt!');
              }}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-2"
              title="Refresh call status"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            {activePlan && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="myarc-btn flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Bonus Call</span>
              </button>
            )}
          </div>
        }
        </div>

        {/* Progress Bar */}
        {calls.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Voortgang</span>
              <span className="text-green-500 font-semibold">
                {calls.filter(c => c.status === 'completed').length} / {calls.length} calls voltooid
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-600 to-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="myarc-card p-4 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Nieuwe meldingen</h3>
              <div className="space-y-2">
                {notifications.map(notif => (
                  <div key={notif.id} className="text-sm text-gray-300">
                    {notif.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Timeline */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Call Timeline</h3>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {calls.sort((a, b) => a.call_number - b.call_number).map((call, index) => {
            const status = call.status || 'locked';
            const isClickable = status === 'available';
            
            return (
              <div
                key={call.id}
                className={`myarc-card p-5 border-2 transition-all ${getStatusColor(status)} ${
                  isClickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : 'opacity-75'
                }`}
                onClick={() => isClickable && handleBookCall(call)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-white font-semibold">
                      Call #{call.call_number || index + 1}
                    </span>
                  </div>
                  {call.week_number && (
                    <span className="text-xs text-gray-500">Week {call.week_number}</span>
                  )}
                </div>

                <h4 className="text-white font-medium mb-2">
                  {call.call_title || `Coaching Call ${index + 1}`}
                </h4>

                {call.client_subject && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {call.client_subject}
                  </p>
                )}

                <div className="mt-auto pt-3 border-t border-gray-700">
                  {status === 'locked' && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Lock className="w-4 h-4" />
                      <span>Wordt beschikbaar na call #{call.call_number - 1}</span>
                    </div>
                  )}
                  
                  {status === 'available' && (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium animate-pulse">
                      <Calendar className="w-4 h-4" />
                      <span>✨ Klik om te plannen</span>
                    </div>
                  )}
                  
                  {status === 'scheduled' && (
                    <div className="space-y-2">
                      {call.scheduled_date ? (
                        <>
                          <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(call.scheduled_date).toLocaleDateString('nl-NL', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'long'
                              })}
                              {' om '}
                              {new Date(call.scheduled_date).toLocaleTimeString('nl-NL', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {call.zoom_link ? (
                            <a
                              href={call.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-blue-400 hover:text-blue-300 transition-all text-sm font-medium group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Video className="w-4 h-4 group-hover:animate-pulse" />
                              <span>Join Zoom Meeting</span>
                              <ChevronRight className="w-3 h-3 ml-auto" />
                            </a>
                          ) : (
                            <div className="text-yellow-500 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 animate-pulse" />
                              <span>Zoom link komt eraan...</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-blue-400 text-sm">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Gepland - details volgen
                        </div>
                      )}
                    </div>
                  )}
                  
                  {status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-500 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Voltooid</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Modal with Calendly Embed - Always render but control visibility */}
      <div 
        key={`modal-${modalKey}`} 
        className="fixed inset-0 flex items-center justify-center p-4" 
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
          zIndex: 9999,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: showBookingModal && selectedCall ? 'flex' : 'none',
          visibility: showBookingModal && selectedCall ? 'visible' : 'hidden'
        }}
      >
        <div 
          className="bg-gray-900 rounded-xl border-2 border-green-500 max-w-4xl w-full max-h-[90vh] overflow-hidden"
          style={{ backgroundColor: '#1f2937' }}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-800">
            <div>
              <h3 className="text-xl font-bold text-white">
                Plan Call #{selectedCall?.call_number || ''}
              </h3>
              <p className="text-gray-400 mt-1">
                {selectedCall?.call_title || ''}
              </p>
            </div>
            <button
              onClick={() => {
                setShowBookingModal(false);
                setSelectedCall(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6">
            {selectedCall?.calendly_link ? (
              <div>
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-green-400">
                    ✅ Selecteer een tijd die je past. Na het plannen ontvang je automatisch een bevestiging met Zoom link.
                  </p>
                </div>
                
                {/* Manual Sync Button */}
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={handleManualRefresh}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check Booking Status
                  </button>
                </div>
                
                {/* Calendly Embed */}
                <div 
                  key={`calendly-${selectedCall?.id}-${Date.now()}`}
                  className="calendly-inline-widget rounded-lg overflow-hidden"
                  data-url={`${selectedCall?.calendly_link}?hide_landing_page_details=1&hide_gdpr_banner=1&background_color=111827&text_color=ffffff&primary_color=10b981`}
                  style={{ 
                    minWidth: '320px', 
                    height: '630px',
                    backgroundColor: '#1a1a1a'
                  }}
                />
                
                {/* Debug info */}
                <div className="mt-2 text-xs text-gray-500 text-center">
                  Call #{selectedCall?.call_number} | {selectedCall?.calendly_link?.split('/').pop()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <p className="text-white text-lg mb-2">Calendly configuratie ontbreekt</p>
                <p className="text-gray-400">
                  Neem contact op met je coach om deze call in te plannen.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bonus Call Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="myarc-card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Bonus Call Aanvragen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Reden voor extra call *
                </label>
                <textarea
                  value={requestData.reason}
                  onChange={(e) => setRequestData({...requestData, reason: e.target.value})}
                  rows={4}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                  placeholder="Leg uit waarom je een extra call nodig hebt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Voorkeursdatum
                </label>
                <input
                  type="date"
                  value={requestData.preferred_date}
                  onChange={(e) => setRequestData({...requestData, preferred_date: e.target.value})}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Urgentie
                </label>
                <select
                  value={requestData.urgency}
                  onChange={(e) => setRequestData({...requestData, urgency: e.target.value})}
                  className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option value="normal">Normaal</option>
                  <option value="high">Hoog</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Annuleren
              </button>
              <button
                onClick={submitCallRequest}
                className="flex-1 myarc-btn"
              >
                Verstuur Aanvraag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
