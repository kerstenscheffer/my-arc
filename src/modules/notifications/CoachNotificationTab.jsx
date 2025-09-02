import { RealAIAnalysis } from './RealAIAnalysis';

import { useState, useEffect } from 'react';
import { 
  Send, Bell, Clock, CheckCircle, XCircle, Sparkles, 
  TrendingUp, Award, Utensils, Activity, Brain, 
  BarChart3, Target, Zap, Calendar, Filter, Search,
  AlertCircle, ChevronRight, Rocket, MessageSquare, X
} from 'lucide-react';

export default function CoachNotificationTab({ db, client, selectedClient, currentUser }) {
  // Support both prop names for compatibility
  const activeClient = client || selectedClient;
  const [actualUser, setActualUser] = useState(currentUser);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'ai', 'history'
  
  // Form states
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [pageContext, setPageContext] = useState('all');
  const [priority, setPriority] = useState('normal');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Analysis states
  const [analysisResults, setAnalysisResults] = useState(null);
  const [sendingInsight, setSendingInsight] = useState(null);

  // Coach info
  const coachAvatar = 'https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/sites/2148693122/images/170b127d-0cd9-41bf-9ddf-a83c82dcba2e.jpeg';

  // Get user if not provided
  useEffect(() => {
    const fetchUser = async () => {
      if (!currentUser && db?.supabase) {
        const { data: { user } } = await db.supabase.auth.getUser();
        setActualUser(user);
      }
    };
    fetchUser();
  }, [currentUser, db]);

  const user = currentUser || actualUser;

  useEffect(() => {
    if (activeClient?.id && isOpen) {
      loadHistory();
    }
  }, [activeClient, isOpen]);

  const loadHistory = async () => {
    if (!db?.notifications || !activeClient?.id) return;
    
    setIsLoading(true);
    try {
      const { data } = await db.notifications.getNotificationHistory(activeClient.id, 20);
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendNotification = async (customTitle = null, customMessage = null, customPriority = 'normal', customContext = 'all') => {
    const finalTitle = customTitle || title.trim();
    const finalMessage = customMessage || message.trim();
    
    if (!finalMessage || !finalTitle) {
      alert('Please enter both title and message');
      return;
    }

    setIsSending(true);
    try {
      const { data, error } = await db.notifications.sendManualNotification({
        clientId: activeClient.id,
        coachId: user?.id,
        title: finalTitle,
        message: finalMessage,
        pageContext: customContext || pageContext,
        priority: customPriority || priority
      });

      if (error) throw error;

      // Clear form only if using form values
      if (!customTitle) {
        setTitle('');
        setMessage('');
        setPriority('normal');
      }
      
      await loadHistory();
      
      // Success feedback
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setIsSending(false);
      setSendingInsight(null);
    }
  };

const runSmartAnalysis = async () => {
  if (!activeClient?.id || !db) return;
  
  setIsAnalyzing(true);
  setAnalysisResults(null);
  
  try {
    const analyzer = new RealAIAnalysis(db);
    const results = await analyzer.analyzeClient(activeClient.id);
    setAnalysisResults(results);
  } catch (error) {
    console.error('Error running analysis:', error);
    alert('Failed to run analysis');
  } finally {
    setIsAnalyzing(false);
  }
};


  const sendInsightAsNotification = async (insight) => {
    setSendingInsight(insight);
    await sendNotification(
      insight.title,
      insight.message,
      insight.priority,
      insight.type === 'workout' ? 'workout' : 
      insight.type === 'meal' ? 'meal' : 
      insight.type === 'progress' ? 'progress' : 'all'
    );
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return <Clock className="w-4 h-4" style={{ color: '#3b82f6' }} />;
      case 'read': return <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />;
      case 'dismissed': return <XCircle className="w-4 h-4" style={{ color: '#6b7280' }} />;
      default: return null;
    }
  };

  const getPriorityGradient = (priority) => {
    switch(priority) {
      case 'urgent': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'high': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'normal': return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (!activeClient) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '180px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(139, 92, 246, 0.4)',
          zIndex: 999,
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 15px 40px rgba(139, 92, 246, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 10px 30px rgba(139, 92, 246, 0.4)';
        }}
      >
        <Bell size={26} color="white" />
        {history.filter(n => n.status === 'active').length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ef4444',
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #1a1a1a'
          }}>
            {history.filter(n => n.status === 'active').length}
          </span>
        )}
      </button>

      {/* Full Screen Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            width: '90%',
            maxWidth: '900px',
            maxHeight: '85vh',
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(26, 26, 26, 0.95) 100%)',
            borderRadius: '24px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'slideUp 0.4s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                  src={coachAvatar}
                  alt="Coach"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    objectFit: 'cover'
                  }}
                />
                <div>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    color: '#fff',
                    margin: 0
                  }}>
                    Notifications - {activeClient.name || activeClient.first_name}
                  </h2>
                  <p style={{
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '0.9rem'
                  }}>
                    Motivate, track, and engage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                <X size={24} style={{ color: 'rgba(255, 255, 255, 0.8)' }} />
              </button>
            </div>

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                onClick={() => setActiveTab('send')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'send' 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Send size={18} />
                Send Message
              </button>

              <button
                onClick={() => {
                  setActiveTab('ai');
                  if (!analysisResults) runSmartAnalysis();
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'ai' 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Brain size={18} />
                AI Analysis
              </button>

              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'history' 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Clock size={18} />
                History
              </button>
            </div>

            {/* Content Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              {/* Send Message Tab */}
              {activeTab === 'send' && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                  borderRadius: '20px',
                  padding: '2rem',
                  border: '2px solid rgba(139, 92, 246, 0.3)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#fff',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <MessageSquare size={20} />
                    Send Notification
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title..."
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />

                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your motivational message..."
                      rows={4}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#fff',
                        fontSize: '1rem',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <select
                        value={pageContext}
                        onChange={(e) => setPageContext(e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '1rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="all">All Pages</option>
                        <option value="home">Home Only</option>
                        <option value="workout">Workout Page</option>
                        <option value="meal">Meal Plan Page</option>
                        <option value="progress">Progress Page</option>
                      </select>

                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: '#fff',
                          fontSize: '1rem',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="low">Low Priority</option>
                        <option value="normal">Normal Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <button
                      onClick={() => sendNotification()}
                      disabled={isSending || !message.trim() || !title.trim()}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: isSending || !message.trim() || !title.trim()
                          ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                          : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '1rem',
                        cursor: isSending || !message.trim() || !title.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isSending ? 'Sending...' : (
                        <>
                          <Send size={20} />
                          Send Notification
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* AI Analysis Tab */}
              {activeTab === 'ai' && (
                <div>
                  {isAnalyzing ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '4rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        border: '3px solid rgba(16, 185, 129, 0.2)',
                        borderTopColor: '#10b981',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        animation: 'spin 1s linear infinite'
                      }} />
                      <p>Analyzing client data...</p>
                    </div>
                  ) : analysisResults ? (
                    <div>
                      {/* Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Activity size={18} style={{ color: '#3b82f6' }} />
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Workout</span>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>
                            {analysisResults.stats.workoutConsistency}%
                          </div>
                        </div>

                        <div style={{
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <Utensils size={18} style={{ color: '#f59e0b' }} />
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Nutrition</span>
                          </div>
                          <div style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>
                            {analysisResults.stats.nutritionAdherence}%
                          </div>
                        </div>

                        <div style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                          borderRadius: '16px',
                          padding: '1.5rem',
                          border: '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <TrendingUp size={18} style={{ color: '#8b5cf6' }} />
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Progress</span>
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                            {analysisResults.stats.progressRate}
                          </div>
                        </div>

                        <div style={{
                          background: `linear-gradient(135deg, ${getRiskColor(analysisResults.stats.riskOfDropout)}33 0%, ${getRiskColor(analysisResults.stats.riskOfDropout)}11 100%)`,
                          borderRadius: '16px',
                          padding: '1.5rem',
                          border: `1px solid ${getRiskColor(analysisResults.stats.riskOfDropout)}66`
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <AlertCircle size={18} style={{ color: getRiskColor(analysisResults.stats.riskOfDropout) }} />
                            <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>Risk</span>
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                            {analysisResults.stats.riskOfDropout}
                          </div>
                        </div>
                      </div>

                      {/* AI Insights */}
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#fff',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Sparkles size={20} />
                        AI Insights ({analysisResults.insights.length})
                      </h3>

                      {analysisResults.insights.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '16px',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          No insights available. Client is doing great!
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {analysisResults.insights.map((insight, index) => (
                            <div
                              key={index}
                              style={{
                                background: getPriorityGradient(insight.priority).replace('135deg', '135deg').replace('100%', '10%').replace('0%', '5%'),
                                borderRadius: '16px',
                                padding: '1.5rem',
                                border: `2px solid ${getPriorityGradient(insight.priority).match(/#[a-f0-9]{6}/gi)?.[0]}33`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: getPriorityGradient(insight.priority),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                {insight.type === 'workout' ? <TrendingUp size={24} color="white" /> :
                                 insight.type === 'meal' ? <Utensils size={24} color="white" /> :
                                 <Activity size={24} color="white" />}
                              </div>

                              <div style={{ flex: 1 }}>
                                <h4 style={{ 
                                  margin: 0, 
                                  color: '#fff', 
                                  fontSize: '1.1rem',
                                  fontWeight: '600'
                                }}>
                                  {insight.title}
                                </h4>
                                <p style={{ 
                                  margin: '0.5rem 0 0', 
                                  color: 'rgba(255, 255, 255, 0.8)', 
                                  fontSize: '0.95rem',
                                  lineHeight: '1.5'
                                }}>
                                  {insight.message}
                                </p>
                                <div style={{
                                  display: 'flex',
                                  gap: '0.5rem',
                                  marginTop: '0.75rem'
                                }}>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#10b981',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                  }}>
                                    {Math.round(insight.confidence * 100)}% confidence
                                  </span>
                                  <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '8px',
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    color: '#8b5cf6',
                                    fontSize: '0.85rem',
                                    fontWeight: '600'
                                  }}>
                                    {insight.type}
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => sendInsightAsNotification(insight)}
                                disabled={sendingInsight === insight}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '12px',
                                  border: 'none',
                                  background: sendingInsight === insight 
                                    ? 'rgba(107, 114, 128, 0.3)'
                                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: sendingInsight === insight ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.3s ease',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => !sendingInsight && (e.currentTarget.style.transform = 'scale(1.1)')}
                                onMouseLeave={(e) => !sendingInsight && (e.currentTarget.style.transform = 'scale(1)')}
                              >
                                {sendingInsight === insight ? (
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255, 255, 255, 0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                  }} />
                                ) : (
                                  <Send size={20} color="white" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Refresh button */}
                      <button
                        onClick={runSmartAnalysis}
                        style={{
                          marginTop: '2rem',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          margin: '2rem auto 0'
                        }}
                      >
                        <Brain size={18} />
                        Re-analyze
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '4rem'
                    }}>
                      <button
                        onClick={runSmartAnalysis}
                        style={{
                          padding: '1rem 2rem',
                          borderRadius: '12px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Brain size={24} />
                        Start AI Analysis
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  {isLoading ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      Loading history...
                    </div>
                  ) : history.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      No notifications sent yet
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {history.map((notification) => (
                        <div
                          key={notification.id}
                          style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                          }}
                        >
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: getPriorityGradient(notification.priority),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Bell size={20} color="white" />
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginBottom: '0.25rem'
                            }}>
                              {getStatusIcon(notification.status)}
                              <span style={{
                                fontWeight: '600',
                                color: '#fff'
                              }}>
                                {notification.title}
                              </span>
                            </div>
                            <p style={{
                              margin: 0,
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontSize: '0.875rem'
                            }}>
                              {notification.message}
                            </p>
                            <div style={{
                              marginTop: '0.5rem',
                              fontSize: '0.75rem',
                              color: 'rgba(255, 255, 255, 0.5)'
                            }}>
                              {new Date(notification.created_at).toLocaleString('nl-NL')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
